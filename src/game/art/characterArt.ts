import type Phaser from 'phaser';
import { PAL } from './palette';
import { makeSheet, px, type Px } from './pixelCanvas';
import {
  type Appearance, appearanceKey, SKIN_TONES, HAIR_COLORS, PANTS_COLORS,
} from './appearance';

/**
 * 캐릭터 스프라이트시트 (24×32, 프레임 16개 = 방향 4 × 걷기 4프레임).
 * 프레임: dir*4 + step. dir: 0 하 / 1 우 / 2 좌 / 3 상.
 * 걷기 사이클: 0 접지 → 1 왼발 앞 → 2 교차(몸 1px 위) → 3 오른발 앞.
 */
export const CHAR_W = 24;
export const CHAR_H = 32;
export const FRAMES_PER_DIR = 4;

export function ensureCharacter(scene: Phaser.Scene, a: Appearance): string {
  const key = appearanceKey(a);
  makeSheet(scene, key, CHAR_W, CHAR_H, 4 * FRAMES_PER_DIR, (d, frame, ox) => {
    const dir = Math.floor(frame / FRAMES_PER_DIR) as 0 | 1 | 2 | 3;
    const step = frame % FRAMES_PER_DIR;
    drawChar(d, ox, dir, step, a);
  });
  for (let dir = 0; dir < 4; dir++) {
    const animKey = `${key}-walk-${dir}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [1, 2, 3, 2].map((f) => ({ key, frame: dir * FRAMES_PER_DIR + f })),
        frameRate: 9,
        repeat: -1,
      });
    }
  }
  return key;
}

function shade(color: number, f: number): number {
  const c = (v: number) => Math.max(0, Math.min(255, Math.floor(v * f)));
  return (c((color >> 16) & 0xff) << 16) | (c((color >> 8) & 0xff) << 8) | c(color & 0xff);
}

function drawChar(d: Px, ox: number, dir: 0 | 1 | 2 | 3, step: number, a: Appearance): void {
  const skin = SKIN_TONES[a.skin]!;
  const skinDark = shade(skin, 0.85);
  const hairC = HAIR_COLORS[a.hairColor]!;
  const hairDark = shade(hairC, 0.68);
  const hairLite = shade(hairC, 1.28);
  const shirt = parseInt(a.shirt, 16);
  const shirtDark = shade(shirt, 0.78);
  const shirtLite = shade(shirt, 1.15);
  const pants = PANTS_COLORS[a.pants]!;
  const pantsDark = shade(pants, 0.75);
  const OUT = PAL.outline;

  // 걷기 포즈 파라미터
  const bob = step === 2 ? 1 : 0;                    // 교차 프레임에서 몸이 1px 떠오름
  const legA = step === 1 ? 2 : step === 3 ? -1 : 0; // 왼다리 전후
  const legB = step === 3 ? 2 : step === 1 ? -1 : 0; // 오른다리 전후
  const armA = -legA;                                // 팔은 다리와 반대
  const armB = -legB;
  const y0 = 2 - bob;                                // 머리 기준선

  // 바닥 그림자
  d.rect(ox + 6, 29, 12, 2, PAL.shadow);
  d.rect(ox + 7, 30, 10, 1, PAL.shadow);

  // ── 다리 (아웃라인 → 바지 → 밑단 → 신발)
  const leg = (lx: number, phase: number) => {
    const top = 21 - bob;
    const h = 8 + Math.min(0, phase);               // 뒤로 간 다리는 짧아 보임
    d.rect(ox + lx - 1, top - 1, 6, h + 2, OUT, 0.55);
    d.rect(ox + lx, top, 4, h, pants);
    d.rect(ox + lx, top, 1, h, pantsDark);          // 안쪽 음영
    d.rect(ox + lx, top + h - 2, 4, 2, pantsDark);  // 밑단
    const sy = top + h;
    d.rect(ox + lx - 1, sy, 6, 3, OUT, 0.7);
    d.rect(ox + lx, sy, 4 + (phase > 0 ? 1 : 0), 2, PAL.shoes);
    d.rect(ox + lx, sy, 4, 1, shade(PAL.shoes, 1.5));
  };
  if (dir === 1) { leg(9 + legB, legB); leg(12 + legA, legA); }
  else if (dir === 2) { leg(8 + legA, legA); leg(11 + legB, legB); }
  else { leg(7, legA); leg(13, legB); }

  // ── 몸통 (셔츠)
  const ty = 13 + y0 - 2; // = 13 - bob
  d.rect(ox + 6, ty - 1, 12, 10, OUT, 0.55);        // 아웃라인
  d.rect(ox + 7, ty, 10, 9, shirt);
  d.rect(ox + 7, ty, 2, 9, shirtDark);              // 좌측 음영
  d.rect(ox + 15, ty, 2, 9, dir === 2 ? shirtLite : shirtDark);
  d.rect(ox + 8, ty, 8, 1, shirtLite);              // 어깨 하이라이트
  d.rect(ox + 7, ty + 7, 10, 2, shirtDark);         // 밑단
  if (dir === 0) d.rect(ox + 11, ty, 2, 2, shirtDark); // 카라 파임

  // ── 팔 (셔츠 소매 + 손)
  const arm = (axx: number, phase: number, mirror: boolean) => {
    const top = ty + 1 + Math.max(0, -phase);
    d.rect(ox + axx - 1, top - 1, 5, 8, OUT, 0.4);
    d.rect(ox + axx, top, 3, 5, shirt);
    d.rect(ox + axx + (mirror ? 2 : 0), top, 1, 5, shirtDark);
    d.rect(ox + axx, top + 5, 3, 2, skin);          // 손
  };
  if (dir !== 2) arm(4, armA, false);
  if (dir !== 1) arm(17, armB, true);

  // ── 머리 (피부 + 얼굴)
  const hy = y0;
  d.rect(ox + 5, hy - 1, 14, 13, OUT, 0.55);        // 아웃라인
  d.rect(ox + 6, hy, 12, 12, skin);
  d.rect(ox + 6, hy + 10, 12, 2, skinDark);         // 턱 음영
  d.rect(ox + 6, hy, 1, 12, skinDark);

  if (dir !== 3) {
    const eye = (ex: number) => {
      d.rect(ox + ex, hy + 6, 2, 3, 0x2a2420);       // 눈동자
      d.rect(ox + ex, hy + 6, 1, 1, 0xffffff, 0.9);  // 하이라이트
    };
    if (dir === 0) {
      eye(8); eye(14);
      d.rect(ox + 11, hy + 10, 2, 1, 0xc97a6e);      // 입
      d.rect(ox + 7, hy + 9, 1, 1, 0xe8a08c, 0.6);   // 볼터치
      d.rect(ox + 16, hy + 9, 1, 1, 0xe8a08c, 0.6);
    } else if (dir === 1) {
      eye(14);
      d.rect(ox + 17, hy + 7, 1, 3, skinDark);       // 콧선
    } else {
      eye(8);
      d.rect(ox + 6, hy + 7, 1, 3, skinDark);
    }
  }

  drawHair(d, ox, hy, dir, a.hair, hairC, hairDark, hairLite);
  if ((a.glasses ?? 0) > 0) drawGlasses(d, ox, hy, dir, a.glasses!);
  if ((a.hat ?? 0) > 0) drawHat(d, ox, hy, dir, a.hat!);
}

/** 안경 5종 — 얼굴 눈 위에 올린다 (뒤통수 dir 3 제외). 얇은 테 + 렌즈 사이 간격 */
function drawGlasses(d: Px, ox: number, hy: number, dir: 0 | 1 | 2 | 3, style: number): void {
  if (dir === 3) return;
  const ey = hy + 6; // 눈 높이

  if (style === 4) { // 하트 선글라스 (핑크)
    const heart = (lx: number) => {
      d.rect(ox + lx, ey, 4, 3, 0xe86a8a);
      d.rect(ox + lx, ey - 1, 1, 1, 0xe86a8a); d.rect(ox + lx + 3, ey - 1, 1, 1, 0xe86a8a);
      d.rect(ox + lx + 1, ey + 3, 2, 1, 0xe86a8a);
      d.rect(ox + lx + 1, ey, 1, 1, 0xffffff, 0.6);
    };
    if (dir === 0) { heart(6); heart(13); } else if (dir === 1) heart(12); else heart(6);
    return;
  }

  const FR = style === 2 ? 0x5a3a1c : 0x2a2620;     // 뿔테=브라운, 나머지=블랙
  const isSun = style === 3;
  const glass = isSun ? 0x1e2228 : 0x8fd0e8;
  const ga = isSun ? 0.98 : 0.5;
  const lens = (lx: number) => {
    d.rect(ox + lx, ey - 1, 4, 1, FR);              // 윗테
    d.rect(ox + lx, ey + 3, 4, 1, FR);              // 아랫테
    d.rect(ox + lx, ey, 1, 3, FR);                  // 왼테
    d.rect(ox + lx + 3, ey, 1, 3, FR);              // 오른테
    d.rect(ox + lx + 1, ey, 2, 3, glass, ga);       // 렌즈
    if (!isSun) d.rect(ox + lx + 1, ey, 1, 1, 0xffffff, 0.8); // 반짝
  };
  if (dir === 0) { lens(6); lens(13); d.rect(ox + 11, ey, 2, 1, FR); } // 양쪽 + 브리지
  else if (dir === 1) lens(12);
  else lens(7);
}

/** 모자·머리장식 7종 — 헤어 위에 올린다 */
function drawHat(d: Px, ox: number, hy: number, dir: 0 | 1 | 2 | 3, style: number): void {
  const back = dir === 3;
  switch (style) {
    case 1: { // 베레모 (기울어진 붉은 베레)
      const c = 0xc4453a, dk = 0x8a2e28;
      d.rect(ox + 5, hy - 3, 14, 5, c);
      d.rect(ox + 5, hy + 1, 14, 1, dk);
      d.rect(ox + 6, hy - 3, 11, 1, 0xe86a5a, 0.6);
      d.rect(ox + 17, hy - 4, 2, 2, dk);        // 꼭지
      break;
    }
    case 2: { // 비니 (골지 니트)
      const c = 0x5a7a9a, dk = 0x3a5470;
      d.rect(ox + 5, hy - 3, 14, 6, c);
      for (let i = 0; i < 7; i++) d.rect(ox + 5 + i * 2, hy - 3, 1, 6, dk, 0.5);
      d.rect(ox + 5, hy + 2, 14, 2, 0xcfd8e0);  // 접단
      break;
    }
    case 3: { // 머리띠 (리본 포인트)
      const c = 0xe86a9a;
      d.rect(ox + 5, hy - 1, 14, 2, c);
      d.rect(ox + 5, hy - 1, 14, 1, 0xf2a0c0, 0.7);
      if (!back) { d.rect(ox + 15, hy - 3, 4, 3, c); d.rect(ox + 16, hy - 2, 2, 1, 0xf2a0c0); } // 리본
      break;
    }
    case 4: { // 꽃 (측면 데이지)
      if (!back) {
        const petals: Array<[number, number]> = [[15, -1], [17, 0], [17, 2], [15, 3], [14, 1]];
        for (const [x, y] of petals) d.rect(ox + x, hy + y, 2, 2, 0xf2f2f2);
        d.rect(ox + 15, hy + 1, 2, 2, 0xf2c25c); // 꽃술
        d.rect(ox + 15, hy + 1, 1, 1, 0xe89a3c);
      } else {
        d.rect(ox + 6, hy - 1, 2, 2, 0xf2f2f2); d.rect(ox + 6, hy, 1, 1, 0xf2c25c);
      }
      break;
    }
    case 5: { // 리본 (정수리 나비)
      const c = 0xe85a7a, dk = 0xb03a5a;
      d.rect(ox + 8, hy - 3, 3, 3, c); d.rect(ox + 13, hy - 3, 3, 3, c);
      d.rect(ox + 11, hy - 2, 2, 2, dk);        // 매듭
      d.rect(ox + 8, hy - 3, 1, 1, 0xf2a0b8); d.rect(ox + 15, hy - 3, 1, 1, 0xf2a0b8);
      break;
    }
    case 6: { // 왕관 (골드)
      const c = 0xf2c84c, dk = 0xc89a2c;
      d.rect(ox + 6, hy - 1, 12, 3, c);
      d.rect(ox + 6, hy + 1, 12, 1, dk);
      for (const x of [6, 10, 14, 17]) { d.rect(ox + x, hy - 3, 1, 2, c); d.rect(ox + x, hy - 4, 1, 1, 0xf2f2a0); }
      d.rect(ox + 11, hy - 1, 2, 2, 0xe85a7a); // 보석
      break;
    }
    default: { // 헤드폰
      const c = 0x3a3f52, ear = 0xe8623c;
      d.rect(ox + 5, hy - 3, 14, 2, c);         // 밴드
      d.rect(ox + 5, hy - 3, 14, 1, 0x6a7088, 0.7);
      if (dir === 0 || back) { d.rect(ox + 4, hy + 1, 3, 4, ear); d.rect(ox + 17, hy + 1, 3, 4, ear); }
      else if (dir === 1) d.rect(ox + 5, hy + 1, 3, 4, ear);
      else d.rect(ox + 16, hy + 1, 3, 4, ear);
    }
  }
}

/**
 * DOM 캔버스에 캐릭터 한 프레임을 그린다 (커스터마이즈 미리보기용, Phaser 불필요).
 * 캔버스는 24×32 픽셀 그대로 — CSS image-rendering:pixelated로 확대해 선명하게 본다.
 */
export function paintCharacterFrame(
  ctx: CanvasRenderingContext2D, a: Appearance, dir: 0 | 1 | 2 | 3 = 0, step = 0,
): void {
  ctx.clearRect(0, 0, CHAR_W, CHAR_H);
  drawChar(px(ctx), 0, dir, step, a);
}

/** 헤어스타일 6종 — 24×32 캔버스 기준, 하이라이트 밴드 포함 */
function drawHair(
  d: Px, ox: number, hy: number, dir: 0 | 1 | 2 | 3,
  style: number, c: number, dark: number, lite: number,
): void {
  const back = dir === 3;
  const side = dir === 1 ? 1 : dir === 2 ? -1 : 0;
  const OUT = PAL.outline;
  const shine = (x: number, y: number, w: number) => d.rect(ox + x, hy + y, w, 1, lite, 0.85);

  switch (style) {
    case 0: // 숏컷
      d.rect(ox + 5, hy - 1, 14, back ? 9 : 5, OUT, 0.5);
      if (back) {
        d.rect(ox + 6, hy, 12, 8, c); d.rect(ox + 6, hy + 7, 12, 1, dark);
        shine(8, 1, 6);
      } else {
        d.rect(ox + 6, hy, 12, 4, c);
        d.rect(ox + 6, hy, 2, 6, c); d.rect(ox + 16, hy, 2, 6, c);
        d.rect(ox + 6, hy + 3, 12, 1, dark);
        if (side === 1) d.rect(ox + 6, hy, 9, 6, c);
        if (side === -1) d.rect(ox + 9, hy, 9, 6, c);
        shine(8, 1, side === 0 ? 5 : 4);
      }
      break;
    case 1: // 단발
      d.rect(ox + 4, hy - 1, 16, back ? 12 : 11, OUT, 0.45);
      if (back) {
        d.rect(ox + 5, hy, 14, 11, c); d.rect(ox + 5, hy + 10, 14, 1, dark);
        shine(7, 2, 8);
      } else {
        d.rect(ox + 6, hy, 12, 4, c);
        d.rect(ox + 5, hy, 3, 11, c); d.rect(ox + 16, hy, 3, 11, c);
        d.rect(ox + 5, hy + 10, 3, 1, dark); d.rect(ox + 16, hy + 10, 3, 1, dark);
        d.rect(ox + 6, hy + 3, 10, 1, dark, 0.5);
        if (side === 1) d.rect(ox + 6, hy, 9, 6, c);
        if (side === -1) d.rect(ox + 9, hy, 9, 6, c);
        shine(7, 1, 6);
      }
      break;
    case 2: // 장발
      d.rect(ox + 3, hy - 1, 18, back ? 18 : 16, OUT, 0.4);
      if (back) {
        d.rect(ox + 5, hy, 14, 10, c);
        d.rect(ox + 4, hy + 8, 16, 9, c);
        d.rect(ox + 4, hy + 16, 16, 1, dark);
        d.rect(ox + 9, hy + 8, 1, 8, dark, 0.5); d.rect(ox + 14, hy + 8, 1, 8, dark, 0.5);
        shine(7, 2, 9);
      } else {
        d.rect(ox + 6, hy, 12, 4, c);
        d.rect(ox + 4, hy, 3, 15, c); d.rect(ox + 17, hy, 3, 15, c);
        d.rect(ox + 4, hy + 14, 3, 1, dark); d.rect(ox + 17, hy + 14, 3, 1, dark);
        if (side === 1) { d.rect(ox + 6, hy, 9, 6, c); d.rect(ox + 4, hy + 4, 4, 13, c); }
        if (side === -1) { d.rect(ox + 9, hy, 9, 6, c); d.rect(ox + 16, hy + 4, 4, 13, c); }
        shine(7, 1, 7);
      }
      break;
    case 3: // 포니테일
      d.rect(ox + 5, hy - 1, 14, 5, OUT, 0.5);
      if (back) {
        d.rect(ox + 6, hy, 12, 7, c);
        d.rect(ox + 9, hy + 7, 6, 12, c);
        d.rect(ox + 9, hy + 18, 6, 1, dark);
        d.rect(ox + 10, hy + 9, 4, 8, dark, 0.35);
        d.rect(ox + 9, hy + 7, 6, 2, 0xd8b86e);       // 머리끈
        shine(8, 1, 7);
      } else {
        d.rect(ox + 6, hy, 12, 4, c);
        d.rect(ox + 6, hy, 2, 6, c); d.rect(ox + 16, hy, 2, 6, c);
        if (side === 1) { d.rect(ox + 6, hy, 9, 6, c); d.rect(ox + 3, hy + 4, 4, 11, c); d.rect(ox + 3, hy + 4, 4, 2, 0xd8b86e); }
        if (side === -1) { d.rect(ox + 9, hy, 9, 6, c); d.rect(ox + 17, hy + 4, 4, 11, c); d.rect(ox + 17, hy + 4, 4, 2, 0xd8b86e); }
        shine(8, 1, 6);
      }
      break;
    case 4: // 곱슬
      d.rect(ox + 4, hy - 2, 16, back ? 12 : 8, OUT, 0.4);
      if (back) {
        d.rect(ox + 5, hy - 1, 14, 11, c);
        for (let i = 0; i < 7; i++) {
          d.rect(ox + 5 + i * 2, hy - 1 + (i % 2), 2, 2, i % 2 ? dark : lite, 0.6);
          d.rect(ox + 5 + i * 2, hy + 8 + (i % 2), 2, 2, dark, 0.5);
        }
      } else {
        d.rect(ox + 5, hy - 1, 14, 5, c);
        d.rect(ox + 5, hy - 1, 3, 7, c); d.rect(ox + 16, hy - 1, 3, 7, c);
        for (let i = 0; i < 7; i++) d.rect(ox + 5 + i * 2, hy - 2 + (i % 2), 2, 2, i % 2 ? dark : lite, 0.6);
        if (side === 1) d.rect(ox + 5, hy - 1, 10, 6, c);
        if (side === -1) d.rect(ox + 9, hy - 1, 10, 6, c);
      }
      break;
    default: { // 캡모자
      d.rect(ox + 5, hy - 2, 14, 6, OUT, 0.5);
      d.rect(ox + 6, hy - 1, 12, 5, c);
      d.rect(ox + 6, hy + 3, 12, 1, dark);
      d.rect(ox + 8, hy - 1, 8, 1, lite, 0.7);       // 크라운 하이라이트
      d.rect(ox + 11, hy, 2, 2, lite);               // 버튼/로고
      if (back) {
        d.rect(ox + 10, hy + 3, 4, 2, dark);         // 밴드 구멍
        d.rect(ox + 6, hy + 4, 12, 3, PAL.hairA);    // 밑머리
      } else if (side === 0) {
        d.rect(ox + 5, hy + 3, 14, 2, c); d.rect(ox + 5, hy + 4, 14, 1, dark); // 챙
      } else if (side === 1) {
        d.rect(ox + 13, hy + 3, 9, 2, c); d.rect(ox + 13, hy + 4, 9, 1, dark);
      } else {
        d.rect(ox + 2, hy + 3, 9, 2, c); d.rect(ox + 2, hy + 4, 9, 1, dark);
      }
    }
  }
}
