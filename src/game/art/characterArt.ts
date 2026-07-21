import type Phaser from 'phaser';
import { PAL } from './palette';
import { makeSheet, type Px } from './pixelCanvas';
import {
  type Appearance, appearanceKey, SKIN_TONES, HAIR_COLORS, PANTS_COLORS,
} from './appearance';

/**
 * 캐릭터 스프라이트시트 (16×22, 프레임 8개 = 방향 4 × 걸음 2).
 * 외형(Appearance) 조합별로 텍스처 1장 캐시. 프레임: dir*2 + step, dir: 0 하 / 1 우 / 2 좌 / 3 상
 */
export function ensureCharacter(scene: Phaser.Scene, a: Appearance): string {
  const key = appearanceKey(a);
  makeSheet(scene, key, 16, 22, 8, (d, frame, ox) => {
    const dir = Math.floor(frame / 2) as 0 | 1 | 2 | 3;
    const step = frame % 2;
    drawChar(d, ox, dir, step, a);
  });
  for (let dir = 0; dir < 4; dir++) {
    const animKey = `${key}-walk-${dir}`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [{ key, frame: dir * 2 }, { key, frame: dir * 2 + 1 }],
        frameRate: 7,
        repeat: -1,
      });
    }
  }
  return key;
}

function darken(color: number, f: number): number {
  const c = (v: number) => Math.max(0, Math.min(255, Math.floor(v * f)));
  return (c((color >> 16) & 0xff) << 16) | (c((color >> 8) & 0xff) << 8) | c(color & 0xff);
}

function drawChar(d: Px, ox: number, dir: 0 | 1 | 2 | 3, step: number, a: Appearance): void {
  const skin = SKIN_TONES[a.skin]!;
  const skinShade = darken(skin, 0.88);
  const hairC = HAIR_COLORS[a.hairColor]!;
  const hairDark = darken(hairC, 0.7);
  const shirt = parseInt(a.shirt, 16);
  const shirtShade = darken(shirt, 0.82);
  const pants = PANTS_COLORS[a.pants]!;

  const legL = step === 0 ? 0 : 1;
  const legR = step === 0 ? 1 : 0;

  // 그림자
  d.rect(ox + 3, 20, 10, 2, PAL.shadow);

  // 다리
  d.rect(ox + 4, 16 - legL, 3, 4 + legL, pants);
  d.rect(ox + 9, 16 - legR, 3, 4 + legR, pants);
  d.rect(ox + 4, 19, 3, 1 + legL, PAL.shoes);
  d.rect(ox + 9, 19, 3, 1 + legR, PAL.shoes);

  // 몸통·팔
  d.rect(ox + 3, 9, 10, 8, shirt);
  d.rect(ox + 3, 15, 10, 2, shirtShade);
  d.rect(ox + 2, 10 - legR, 2, 5, shirt);
  d.rect(ox + 12, 10 - legL, 2, 5, shirt);
  d.rect(ox + 2, 14 - legR, 2, 1, skin);
  d.rect(ox + 12, 14 - legL, 2, 1, skin);

  // 머리 (피부)
  d.rect(ox + 3, 1, 10, 9, skin);
  d.rect(ox + 3, 8, 10, 1, skinShade);

  // 얼굴 (뒷모습 제외)
  if (dir !== 3) {
    if (dir === 0) {
      d.rect(ox + 5, 5, 2, 2, hairDark);
      d.rect(ox + 9, 5, 2, 2, hairDark);
      d.rect(ox + 7, 7, 2, 1, 0xd98a80, 0.8);
    } else if (dir === 1) {
      d.rect(ox + 10, 5, 2, 2, hairDark);
    } else {
      d.rect(ox + 4, 5, 2, 2, hairDark);
    }
  }

  drawHair(d, ox, dir, a.hair, hairC, hairDark);
}

/** 헤어스타일 6종 — 방향별로 그린다 */
function drawHair(d: Px, ox: number, dir: 0 | 1 | 2 | 3, style: number, c: number, dark: number): void {
  const back = dir === 3;
  const side = dir === 1 ? 1 : dir === 2 ? -1 : 0;

  switch (style) {
    case 0: // 숏컷
      if (back) { d.rect(ox + 3, 1, 10, 6, c); d.rect(ox + 3, 6, 10, 1, dark); }
      else {
        d.rect(ox + 3, 1, 10, 3, c);
        d.rect(ox + 3, 1, 2, 4, c); d.rect(ox + 11, 1, 2, 4, c);
        if (side === 1) d.rect(ox + 3, 1, 7, 5, c);
        if (side === -1) d.rect(ox + 6, 1, 7, 5, c);
      }
      break;
    case 1: // 단발
      if (back) { d.rect(ox + 3, 1, 10, 8, c); d.rect(ox + 3, 8, 10, 1, dark); }
      else {
        d.rect(ox + 3, 1, 10, 3, c);
        d.rect(ox + 2, 1, 3, 8, c); d.rect(ox + 11, 1, 3, 8, c);
        d.rect(ox + 2, 8, 3, 1, dark); d.rect(ox + 11, 8, 3, 1, dark);
        if (side === 1) d.rect(ox + 3, 1, 7, 5, c);
        if (side === -1) d.rect(ox + 6, 1, 7, 5, c);
      }
      break;
    case 2: // 장발
      if (back) { d.rect(ox + 3, 1, 10, 8, c); d.rect(ox + 2, 6, 12, 8, c); d.rect(ox + 2, 13, 12, 1, dark); }
      else {
        d.rect(ox + 3, 1, 10, 3, c);
        d.rect(ox + 1, 1, 3, 12, c); d.rect(ox + 12, 1, 3, 12, c);
        d.rect(ox + 1, 12, 3, 1, dark); d.rect(ox + 12, 12, 3, 1, dark);
        if (side === 1) { d.rect(ox + 3, 1, 7, 5, c); d.rect(ox + 2, 4, 3, 10, c); }
        if (side === -1) { d.rect(ox + 6, 1, 7, 5, c); d.rect(ox + 11, 4, 3, 10, c); }
      }
      break;
    case 3: // 포니테일
      if (back) {
        d.rect(ox + 3, 1, 10, 6, c);
        d.rect(ox + 6, 6, 4, 9, c); d.rect(ox + 6, 14, 4, 1, dark);
        d.rect(ox + 6, 7, 4, 1, 0xd8b86e); // 머리끈
      } else {
        d.rect(ox + 3, 1, 10, 3, c);
        d.rect(ox + 3, 1, 2, 4, c); d.rect(ox + 11, 1, 2, 4, c);
        if (side === 1) { d.rect(ox + 3, 1, 7, 5, c); d.rect(ox + 2, 4, 3, 8, c); d.rect(ox + 2, 5, 3, 1, 0xd8b86e); }
        if (side === -1) { d.rect(ox + 6, 1, 7, 5, c); d.rect(ox + 11, 4, 3, 8, c); d.rect(ox + 11, 5, 3, 1, 0xd8b86e); }
      }
      break;
    case 4: // 곱슬
      if (back) {
        d.rect(ox + 2, 0, 12, 8, c);
        for (let i = 0; i < 6; i++) d.rect(ox + 2 + i * 2, (i % 2), 2, 2, dark, 0.5);
      } else {
        d.rect(ox + 2, 0, 12, 4, c);
        d.rect(ox + 2, 0, 3, 6, c); d.rect(ox + 11, 0, 3, 6, c);
        for (let i = 0; i < 6; i++) d.rect(ox + 2 + i * 2, (i % 2), 2, 2, dark, 0.5);
        if (side === 1) d.rect(ox + 2, 0, 8, 5, c);
        if (side === -1) d.rect(ox + 6, 0, 8, 5, c);
      }
      break;
    default: { // 캡모자
      const capDark = dark;
      d.rect(ox + 3, 0, 10, 4, c);
      d.rect(ox + 3, 3, 10, 1, capDark);
      if (back) {
        d.rect(ox + 6, 4, 4, 2, capDark); // 사이즈 조절 밴드
        d.rect(ox + 3, 4, 10, 3, PAL.hairA); // 밑머리
      } else if (side === 0) {
        d.rect(ox + 2, 3, 12, 2, c); // 챙(정면)
      } else if (side === 1) {
        d.rect(ox + 10, 3, 6, 2, c); // 챙(우)
      } else {
        d.rect(ox + 0, 3, 6, 2, c);  // 챙(좌)
      }
    }
  }
}
