import type Phaser from 'phaser';
import { PAL } from './palette';
import { makeSheet, px, type Px } from './pixelCanvas';
import {
  type Appearance, appearanceKey, SKIN_TONES, HAIR_COLORS, PANTS_COLORS,
} from './appearance';
import {
  drawCharacterHd, HD_CHAR_H, HD_CHAR_ORIGIN_Y, HD_CHAR_W,
} from './characterArtHd';

/**
 * 캐릭터 스프라이트시트 (32×48, 프레임 16개 = 방향 4 × 걷기 4프레임).
 * 프레임: dir*4 + step. dir: 0 하 / 1 우 / 2 좌 / 3 상.
 * 걷기 사이클: 0 접지 → 1 왼발 앞 → 2 교차(몸 1px 위) → 3 오른발 앞.
 */
export const CHAR_W = HD_CHAR_W;
export const CHAR_H = HD_CHAR_H;
export const CHAR_ORIGIN_Y = HD_CHAR_ORIGIN_Y;
export const FRAMES_PER_DIR = 4;

export function ensureCharacter(scene: Phaser.Scene, a: Appearance): string {
  const key = `${appearanceKey(a)}-hd32x48`;
  makeSheet(scene, key, CHAR_W, CHAR_H, 4 * FRAMES_PER_DIR, (d, frame, ox) => {
    const dir = Math.floor(frame / FRAMES_PER_DIR) as 0 | 1 | 2 | 3;
    const step = frame % FRAMES_PER_DIR;
    drawCharacterHd(d, ox, dir, step, a);
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
  const accent = parseInt(a.accent ?? 'f2ead8', 16);
  const accentDark = shade(accent, 0.72);
  const topStyle = a.topStyle ?? 0;
  const bottomStyle = a.bottomStyle ?? 0;
  const shoeStyle = a.shoeStyle ?? 0;
  const backStyle = a.back ?? 0;
  const eyeStyle = a.eyeStyle ?? 0;
  const mouthStyle = a.mouthStyle ?? 0;
  const faceDetail = a.faceDetail ?? 0;
  const topPattern = a.topPattern ?? 0;
  const sockStyle = a.sockStyle ?? 0;
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

  // 등 장식은 몸·다리보다 먼저 그려 자연스럽게 뒤로 들어간다.
  if (backStyle > 0) drawBackAccessory(d, ox, dir, y0, backStyle, accent, accentDark, OUT);

  // ── 다리 (아웃라인 → 바지 → 밑단 → 신발)
  const leg = (lx: number, phase: number) => {
    const top = 21 - bob;
    const h = 8 + Math.min(0, phase);               // 뒤로 간 다리는 짧아 보임
    const wide = bottomStyle === 1 || bottomStyle === 4;
    const legX = lx - (wide ? 1 : 0), legW = wide ? 6 : 4;
    d.rect(ox + legX - 1, top - 1, legW + 2, h + 2, OUT, 0.55);
    if (bottomStyle === 2) {                         // 쇼츠 + 맨다리
      d.rect(ox + legX, top, legW, 3, pants);
      d.rect(ox + legX, top + 2, legW, 1, pantsDark);
      d.rect(ox + lx, top + 3, 4, Math.max(1, h - 3), skin);
      d.rect(ox + lx, top + 3, 1, Math.max(1, h - 3), skinDark);
    } else if (bottomStyle === 3 || bottomStyle === 5) { // 스커트 아래 다리
      d.rect(ox + lx, top, 4, h, skin);
      d.rect(ox + lx, top, 1, h, skinDark);
    } else {
      d.rect(ox + legX, top, legW, h, pants);
      d.rect(ox + legX, top, 1, h, pantsDark);
      d.rect(ox + legX, top + h - 2, legW, 2, pantsDark);
      if (bottomStyle === 4) {                       // 카고 포켓
        d.rect(ox + legX + (lx < 10 ? 0 : legW - 2), top + 3, 2, 3, accentDark, 0.8);
      }
    }
    const sy = top + h;
    if (sockStyle > 0) {
      const exposed = bottomStyle === 2 || bottomStyle === 3 || bottomStyle === 5;
      const sockH = sockStyle === 3 && exposed ? 5 : sockStyle === 4 ? 4 : exposed ? 3 : 2;
      const sockX = lx - (sockStyle === 4 ? 1 : 0);
      const sockW = sockStyle === 4 ? 6 : 4;
      const sock = sockStyle === 4 ? accent : 0xf4ead8;
      d.rect(ox + sockX - 1, sy - sockH - 1, sockW + 2, sockH + 2, OUT, 0.55);
      d.rect(ox + sockX, sy - sockH, sockW, sockH + 1, sock);
      if (sockStyle === 2) {
        d.rect(ox + sockX, sy - sockH + 1, sockW, 1, accent);
        d.rect(ox + sockX, sy - 1, sockW, 1, accentDark);
      } else if (sockStyle === 3) {
        d.rect(ox + sockX, sy - sockH, sockW, 1, accent);
      } else if (sockStyle === 4) {
        d.rect(ox + sockX, sy - sockH, sockW, 1, shade(accent, 1.25));
        d.rect(ox + sockX + 1, sy - sockH + 2, sockW - 2, 1, accentDark, 0.7);
      }
    }
    const shoe = shoeStyle === 2 ? 0x5a3a24 : shoeStyle === 4 ? accent : PAL.shoes;
    const shoeH = shoeStyle === 1 ? 4 : shoeStyle === 3 ? 3 : 2;
    d.rect(ox + lx - 1, sy - (shoeH - 2), 6, shoeH + 1, OUT, 0.75);
    d.rect(ox + lx, sy - (shoeH - 2), 4 + (phase > 0 ? 1 : 0), shoeH, shoe);
    d.rect(ox + lx, sy - (shoeH - 2), 4, 1, shoeStyle === 4 ? shade(accent, 1.28) : shade(shoe, 1.5));
    if (shoeStyle === 3) d.rect(ox + lx + 1, sy - 1, 2, 1, accent, 0.9);
  };
  if (dir === 1) { leg(9 + legB, legB); leg(12 + legA, legA); }
  else if (dir === 2) { leg(8 + legA, legA); leg(11 + legB, legB); }
  else { leg(7, legA); leg(13, legB); }

  // 스커트 실루엣은 다리 위에 얹는다.
  const by = 19 - bob;
  if (bottomStyle === 3) {
    d.rect(ox + 5, by - 1, 14, 7, OUT, 0.6);
    d.rect(ox + 6, by, 12, 5, pants);
    d.rect(ox + 6, by + 4, 12, 1, pantsDark);
    for (const x of [8, 11, 14, 17]) d.rect(ox + x, by + 1, 1, 3, x % 2 ? pantsDark : accentDark, 0.55);
  } else if (bottomStyle === 5) {
    d.rect(ox + 5, by - 1, 14, 11, OUT, 0.6);
    d.rect(ox + 6, by, 12, 9, pants);
    d.rect(ox + 5, by + 7, 14, 2, pants);
    d.rect(ox + 5, by + 9, 14, 1, pantsDark);
    d.rect(ox + (dir === 2 ? 7 : 15), by + 1, 2, 7, pantsDark, 0.55);
  }

  // ── 몸통 (셔츠)
  const ty = 13 + y0 - 2; // = 13 - bob
  d.rect(ox + 6, ty - 1, 12, 10, OUT, 0.55);        // 아웃라인
  d.rect(ox + 7, ty, 10, 9, shirt);
  d.rect(ox + 7, ty, 2, 9, shirtDark);              // 좌측 음영
  d.rect(ox + 15, ty, 2, 9, dir === 2 ? shirtLite : shirtDark);
  d.rect(ox + 8, ty, 8, 1, shirtLite);              // 어깨 하이라이트
  d.rect(ox + 7, ty + 7, 10, 2, shirtDark);         // 밑단
  if (dir === 0) d.rect(ox + 11, ty, 2, 2, shirtDark); // 카라 파임
  drawTopPattern(d, ox, dir, ty, topPattern, accent, accentDark, shirtLite);
  drawTopDetails(d, ox, dir, ty, topStyle, shirt, shirtDark, shirtLite, pants, accent, accentDark, OUT);

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

  drawFace(d, ox, hy, dir, eyeStyle, mouthStyle, faceDetail, skinDark, accent, accentDark);

  drawHair(d, ox, hy, dir, a.hair, hairC, hairDark, hairLite);
  if ((a.glasses ?? 0) > 0) drawGlasses(d, ox, hy, dir, a.glasses!);
  if ((a.hat ?? 0) > 0) drawHat(d, ox, hy, dir, a.hat!);
}

/** 눈·입·얼굴 포인트는 헤어·안경과 독립된 조합 레이어다. */
function drawFace(
  d: Px, ox: number, hy: number, dir: 0 | 1 | 2 | 3,
  eyeStyle: number, mouthStyle: number, detail: number,
  skinDark: number, accent: number, accentDark: number,
): void {
  if (dir === 3) return;
  const ink = 0x2a2420;
  const eye = (ex: number, mirror = false) => {
    const y = hy + 6;
    switch (eyeStyle) {
      case 1: // 초롱 눈
        d.rect(ox + ex, y, 3, 3, ink);
        d.rect(ox + ex, y, 1, 1, 0xffffff);
        d.rect(ox + ex + 2, y + 2, 1, 1, 0x8ecfe0, 0.9);
        break;
      case 2: // 반달 눈
        d.rect(ox + ex, y + 1, 3, 1, ink);
        d.rect(ox + ex + (mirror ? 0 : 2), y, 1, 1, ink);
        break;
      case 3: // 졸린 눈
        d.rect(ox + ex, y, 3, 1, ink);
        d.rect(ox + ex + (mirror ? 0 : 2), y + 1, 1, 1, ink, 0.8);
        break;
      case 4: // 날카로운 눈
        d.rect(ox + ex, y + (mirror ? 0 : 1), 3, 1, ink);
        d.rect(ox + ex + (mirror ? 2 : 0), y + 1, 2, 1, ink);
        break;
      case 5: // 별빛 눈
        d.rect(ox + ex + 1, y - 1, 1, 4, ink);
        d.rect(ox + ex, y, 3, 2, ink);
        d.rect(ox + ex + 1, y, 1, 1, 0xffffff);
        break;
      default:
        d.rect(ox + ex, y, 2, 3, ink);
        d.rect(ox + ex, y, 1, 1, 0xffffff, 0.9);
    }
  };

  if (dir === 0) {
    eye(8); eye(14, true);
    switch (mouthStyle) {
      case 1: d.rect(ox + 12, hy + 10, 1, 1, 0xb76562); break;
      case 2:
        d.rect(ox + 10, hy + 10, 2, 1, 0xb76562);
        d.rect(ox + 13, hy + 10, 2, 1, 0xb76562);
        d.rect(ox + 12, hy + 9, 1, 1, 0xb76562);
        break;
      case 3: d.rect(ox + 11, hy + 10, 3, 1, skinDark); break;
      case 4:
        d.rect(ox + 11, hy + 10, 3, 2, 0xb75f62);
        d.rect(ox + 12, hy + 10, 2, 1, 0xffffff, 0.9);
        break;
      default:
        d.rect(ox + 11, hy + 10, 3, 1, 0xc97a6e);
        d.rect(ox + 12, hy + 11, 1, 1, 0xc97a6e, 0.8);
    }

    if (detail === 1) { // 주근깨
      for (const x of [7, 9, 15, 17]) d.rect(ox + x, hy + 9, 1, 1, 0xa86e58, 0.75);
    } else if (detail === 2) { // 볼터치
      d.rect(ox + 7, hy + 9, 2, 1, 0xe88f8a, 0.72);
      d.rect(ox + 16, hy + 9, 2, 1, 0xe88f8a, 0.72);
    } else if (detail === 3) { // 매력점
      d.rect(ox + 16, hy + 10, 1, 1, 0x5a3a32);
    } else if (detail === 4) { // 반창고
      d.rect(ox + 15, hy + 8, 4, 2, 0xd8b890);
      d.rect(ox + 16, hy + 8, 1, 2, 0xf2d8ae);
    } else if (detail === 5) { // 페이스 페인트
      d.rect(ox + 6, hy + 8, 3, 1, accent);
      d.rect(ox + 7, hy + 9, 3, 1, accentDark);
    }
  } else if (dir === 1) {
    eye(14, true);
    d.rect(ox + 17, hy + 7, 1, 3, skinDark);
    if (detail === 4) d.rect(ox + 14, hy + 9, 4, 2, 0xd8b890);
    else if (detail === 2) d.rect(ox + 15, hy + 9, 2, 1, 0xe88f8a, 0.72);
  } else {
    eye(8);
    d.rect(ox + 6, hy + 7, 1, 3, skinDark);
    if (detail === 5) d.rect(ox + 6, hy + 9, 3, 1, accent);
    else if (detail === 2) d.rect(ox + 7, hy + 9, 2, 1, 0xe88f8a, 0.72);
  }
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
 * 캔버스는 32×48 픽셀 그대로 — CSS image-rendering:pixelated로 확대해 선명하게 본다.
 */
export function paintCharacterFrame(
  ctx: CanvasRenderingContext2D, a: Appearance, dir: 0 | 1 | 2 | 3 = 0, step = 0,
): void {
  ctx.clearRect(0, 0, CHAR_W, CHAR_H);
  drawCharacterHd(px(ctx), 0, dir, step, a);
}

/** 상의 실루엣과 별개로 염색 가능한 6종 패턴을 겹친다. */
function drawTopPattern(
  d: Px, ox: number, dir: 0 | 1 | 2 | 3, ty: number, pattern: number,
  accent: number, accentDark: number, lite: number,
): void {
  if (pattern === 0) return;
  const x0 = dir === 2 ? 8 : 9;
  const width = dir === 0 || dir === 3 ? 7 : 6;
  switch (pattern) {
    case 1: // 스트라이프
      d.rect(ox + x0, ty + 3, width, 1, accent, 0.88);
      d.rect(ox + x0, ty + 5, width, 1, accentDark, 0.76);
      break;
    case 2: // 체커
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          d.rect(ox + x0 + col * 2, ty + 2 + row * 2, 2, 2, (row + col) % 2 ? accentDark : accent, 0.8);
        }
      }
      break;
    case 3: // 하트
      if (dir !== 3) {
        d.rect(ox + 10, ty + 3, 2, 2, accent);
        d.rect(ox + 13, ty + 3, 2, 2, accent);
        d.rect(ox + 11, ty + 4, 3, 3, accent);
        d.rect(ox + 12, ty + 7, 1, 1, accentDark);
      }
      break;
    case 4: // 별
      if (dir !== 3) {
        d.rect(ox + 12, ty + 2, 1, 6, accent);
        d.rect(ox + 10, ty + 4, 5, 2, accent);
        d.rect(ox + 12, ty + 4, 1, 1, lite);
      }
      break;
    default: // 꽃자수
      if (dir !== 3) {
        d.rect(ox + 11, ty + 3, 2, 2, accent);
        d.rect(ox + 14, ty + 3, 2, 2, accent);
        d.rect(ox + 12, ty + 2, 2, 1, accent);
        d.rect(ox + 12, ty + 5, 2, 2, accent);
        d.rect(ox + 13, ty + 4, 1, 1, lite);
      } else d.rect(ox + 10, ty + 4, 5, 2, accent, 0.72);
  }
}

/** 상의 8종의 작은 실루엣·봉제 디테일. 24px에서도 정면 식별점이 남도록 단순화한다. */
function drawTopDetails(
  d: Px, ox: number, dir: 0 | 1 | 2 | 3, ty: number, style: number,
  shirt: number, dark: number, lite: number, pants: number, accent: number, accentDark: number, out: number,
): void {
  const back = dir === 3;
  switch (style) {
    case 1: // 후드 — 목 뒤 후드 + 앞주머니/끈
      d.rect(ox + 8, ty - 2, 8, 3, out, 0.55);
      d.rect(ox + 9, ty - 1, 6, 3, shirt);
      if (back) {
        d.rect(ox + 8, ty, 8, 5, dark, 0.85);
        d.rect(ox + 9, ty + 1, 6, 3, shirt);
      } else {
        d.rect(ox + 10, ty + 1, 1, 4, accentDark);
        d.rect(ox + 14, ty + 1, 1, 4, accentDark);
        d.rect(ox + 9, ty + 5, 6, 3, dark);
        d.rect(ox + 10, ty + 5, 4, 1, lite);
      }
      break;
    case 2: // 블레이저 — 라펠·단추
      if (!back) {
        d.rect(ox + 8, ty + 1, 3, 4, lite);
        d.rect(ox + 14, ty + 1, 3, 4, dark);
        d.rect(ox + 11, ty + 1, 3, 5, accent);
        d.rect(ox + 12, ty + 6, 1, 1, accentDark);
        d.rect(ox + 14, ty + 6, 1, 1, accentDark);
      } else d.rect(ox + 11, ty + 1, 2, 7, dark, 0.7);
      break;
    case 3: // 가디건 — 앞여밈과 작은 단추
      d.rect(ox + 11, ty, 2, 8, accent);
      d.rect(ox + 12, ty, 1, 8, accentDark);
      if (!back) for (const y of [ty + 2, ty + 5]) d.rect(ox + 13, y, 1, 1, lite);
      break;
    case 4: // 오버롤 — 바지색 턱받이와 멜빵
      d.rect(ox + 9, ty, 2, 5, pants);
      d.rect(ox + 14, ty, 2, 5, pants);
      d.rect(ox + 9, ty + 3, 7, 6, pants);
      d.rect(ox + 10, ty + 4, 5, 3, accentDark, 0.7);
      if (!back) { d.rect(ox + 10, ty + 1, 1, 1, accent); d.rect(ox + 15, ty + 1, 1, 1, accent); }
      break;
    case 5: // 크롭 재킷 — 짧은 재킷과 이중 밑단
      d.rect(ox + 7, ty + 5, 10, 2, accent);
      d.rect(ox + 8, ty + 7, 8, 2, dark);
      if (!back) { d.rect(ox + 11, ty + 1, 2, 5, accentDark); d.rect(ox + 9, ty + 2, 2, 1, lite); }
      break;
    case 6: // 세일러 — 넓은 카라와 포인트 타이
      d.rect(ox + 7, ty, 10, 3, accent);
      d.rect(ox + 9, ty + 2, 6, 2, shirt);
      if (!back) {
        d.rect(ox + 11, ty + 2, 2, 5, accentDark);
        d.rect(ox + 10, ty + 6, 4, 2, accent);
      } else d.rect(ox + 9, ty + 1, 6, 3, accentDark, 0.7);
      break;
    case 7: // 한복 저고리 — 사선 깃·고름
      d.rect(ox + 7, ty + 6, 10, 3, accent);
      if (!back) {
        for (let i = 0; i < 5; i++) d.rect(ox + 9 + i, ty + i, 2, 1, accentDark);
        d.rect(ox + 13, ty + 4, 4, 2, accent);
        d.rect(ox + 15, ty + 5, 2, 3, accentDark);
      } else d.rect(ox + 8, ty + 1, 8, 1, lite, 0.7);
      break;
    default: // 베이직 티 — 포인트 자수 한 픽셀
      if (!back) d.rect(ox + 12, ty + 3, 2, 2, accent, 0.85);
  }
}

/** 등 장식 5종. 방향별로 몸 뒤에서 읽히는 핵심 실루엣만 그린다. */
function drawBackAccessory(
  d: Px, ox: number, dir: 0 | 1 | 2 | 3, y0: number, style: number,
  accent: number, dark: number, out: number,
): void {
  const ty = 13 + y0 - 2;
  switch (style) {
    case 1: { // 미니 백팩
      const x = dir === 1 ? 4 : dir === 2 ? 15 : 7;
      d.rect(ox + x - 1, ty, 11, 10, out, 0.65);
      d.rect(ox + x, ty + 1, 9, 8, accent);
      d.rect(ox + x + 1, ty + 5, 7, 3, dark);
      d.rect(ox + x + 3, ty, 3, 1, dark);
      break;
    }
    case 2: // 기타 케이스 — 길쭉한 사선 실루엣
      for (let i = 0; i < 15; i++) {
        const x = dir === 2 ? 17 - Math.floor(i / 3) : 3 + Math.floor(i / 3);
        d.rect(ox + x, ty - 4 + i, 4, 2, out, 0.7);
        d.rect(ox + x + 1, ty - 4 + i, 2, 2, dark);
      }
      d.rect(ox + (dir === 2 ? 13 : 7), ty + 8, 7, 6, out, 0.65);
      d.rect(ox + (dir === 2 ? 14 : 8), ty + 9, 5, 4, accent);
      break;
    case 3: // 픽셀 윙 — 좌우 대칭 반투명 날개
      for (const sx of [-1, 1]) {
        const base = sx < 0 ? 1 : 17;
        d.rect(ox + base, ty - 1, 6, 3, accent, 0.75);
        d.rect(ox + base + (sx < 0 ? -1 : 1), ty + 2, 6, 4, accent, 0.62);
        d.rect(ox + base + (sx < 0 ? 1 : 0), ty + 6, 4, 4, accent, 0.5);
        d.rect(ox + base + 2, ty, 2, 1, 0xffffff, 0.75);
      }
      break;
    case 4: { // 토트백 — 한쪽으로 내려오는 가방
      const x = dir === 2 ? 2 : 17;
      d.rect(ox + x, ty + 4, 6, 9, out, 0.6);
      d.rect(ox + x + 1, ty + 5, 4, 7, accent);
      d.rect(ox + x + 2, ty + 2, 2, 4, dark);
      break;
    }
    default: { // 고양이 꼬리 — 몸 뒤로 휘는 픽셀 곡선
      const right = dir !== 2;
      const bx = right ? 18 : 4;
      for (let i = 0; i < 7; i++) {
        const x = bx + (right ? Math.floor(i / 3) : -Math.floor(i / 3));
        d.rect(ox + x, ty + 7 + i, 3, 2, i % 2 ? accent : dark);
      }
      d.rect(ox + (right ? 18 : 3), ty + 13, 4, 3, accent);
    }
  }
}

/** 레거시 24×32 렌더러용 헤어스타일 6종. 저장 호환 참고를 위해 남겨 둔다. */
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
