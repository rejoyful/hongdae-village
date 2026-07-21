import type Phaser from 'phaser';
import { PAL } from './palette';
import { makeSheet, type Px } from './pixelCanvas';

/**
 * 캐릭터 스프라이트시트 (16×22, 프레임 8개 = 방향 4 × 걸음 2).
 * 셔츠는 플레이어 색으로 구워서 색깔당 텍스처 1장 (`char-<hex>`).
 * 프레임 인덱스: dir*2 + step, dir: 0 하 / 1 우 / 2 좌 / 3 상
 */
export function ensureCharacter(scene: Phaser.Scene, colorHex: string): string {
  const key = `char-${colorHex}`;
  const shirt = parseInt(colorHex, 16);
  const shirtShade = darken(shirt, 0.82);

  makeSheet(scene, key, 16, 22, 8, (d, frame, ox) => {
    const dir = Math.floor(frame / 2) as 0 | 1 | 2 | 3;
    const step = frame % 2;
    drawChar(d, ox, dir, step, shirt, shirtShade);
  });

  // 걷기 애니메이션 등록 (색깔별 1회)
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
  const r = Math.floor(((color >> 16) & 0xff) * f);
  const g = Math.floor(((color >> 8) & 0xff) * f);
  const b = Math.floor((color & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}

function drawChar(d: Px, ox: number, dir: 0 | 1 | 2 | 3, step: number, shirt: number, shirtShade: number): void {
  const legL = step === 0 ? 0 : 1; // 걸음에 따라 다리 교차
  const legR = step === 0 ? 1 : 0;

  // 그림자
  d.rect(ox + 3, 20, 10, 2, PAL.shadow);

  // 다리 (바지)
  d.rect(ox + 4, 16 - legL, 3, 4 + legL, PAL.pants);
  d.rect(ox + 9, 16 - legR, 3, 4 + legR, PAL.pants);
  d.rect(ox + 4, 19, 3, 1 + legL, PAL.shoes);
  d.rect(ox + 9, 19, 3, 1 + legR, PAL.shoes);

  // 몸통 (셔츠)
  d.rect(ox + 3, 9, 10, 8, shirt);
  d.rect(ox + 3, 15, 10, 2, shirtShade);
  // 팔
  d.rect(ox + 2, 10 - legR, 2, 5, shirt);
  d.rect(ox + 12, 10 - legL, 2, 5, shirt);
  d.rect(ox + 2, 14 - legR, 2, 1, PAL.skin);
  d.rect(ox + 12, 14 - legL, 2, 1, PAL.skin);

  // 머리
  d.rect(ox + 3, 1, 10, 9, PAL.skin);
  d.rect(ox + 3, 8, 10, 1, PAL.skinShade);

  // 헤어 & 얼굴 (방향별)
  if (dir === 3) {
    // 뒷모습: 머리카락이 얼굴 전체
    d.rect(ox + 3, 1, 10, 8, PAL.hairA);
    d.rect(ox + 3, 7, 10, 2, PAL.hairB);
  } else {
    d.rect(ox + 3, 1, 10, 3, PAL.hairA); // 앞머리
    d.rect(ox + 3, 1, 2, 5, PAL.hairA);
    d.rect(ox + 11, 1, 2, 5, PAL.hairA);
    if (dir === 0) {
      // 정면: 눈 2
      d.rect(ox + 5, 5, 2, 2, PAL.hairB);
      d.rect(ox + 9, 5, 2, 2, PAL.hairB);
      d.rect(ox + 7, 7, 2, 1, 0xd98a80, 0.8); // 입
    } else if (dir === 1) {
      // 우측: 눈 1 (오른쪽)
      d.rect(ox + 10, 5, 2, 2, PAL.hairB);
      d.rect(ox + 3, 1, 6, 6, PAL.hairA); // 옆머리 볼륨
    } else {
      // 좌측
      d.rect(ox + 4, 5, 2, 2, PAL.hairB);
      d.rect(ox + 7, 1, 6, 6, PAL.hairA);
    }
  }
}
