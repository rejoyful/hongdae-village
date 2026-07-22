import type Phaser from 'phaser';
import { makeTexture, px, type Px } from './pixelCanvas';
import { type PetSpecies, petById } from '../pets/pets';

export const PET_W = 16;
export const PET_H = 16;

/** 오른쪽을 보는 16×16 펫 (좌향은 스프라이트 flipX). 종별 귀·꼬리·색으로 구분 */
function drawPet(d: Px, ox: number, oy: number, s: PetSpecies): void {
  const OUT = 0x2e2620;
  // 그림자
  d.rect(ox + 3, oy + 15, 11, 1, 0x000000, 0.2);

  // 꼬리 (뒤=왼쪽)
  if (s.tail === 'curl') { d.rect(ox + 1, oy + 8, 2, 3, s.body); d.rect(ox + 1, oy + 7, 2, 1, s.body); }
  else if (s.tail === 'puff') d.rect(ox + 1, oy + 9, 3, 3, s.belly);
  else if (s.tail === 'long') { d.rect(ox + 0, oy + 8, 3, 1, s.body); d.rect(ox + 0, oy + 6, 1, 3, s.body); }
  else if (s.tail === 'longtip') { d.rect(ox + 0, oy + 8, 3, 1, s.body); d.rect(ox + 0, oy + 6, 1, 3, s.body); d.rect(ox + 0, oy + 6, 1, 1, 0xf4ead6); }

  // 다리
  d.rect(ox + 4, oy + 13, 2, 2, s.dark); d.rect(ox + 9, oy + 13, 2, 2, s.dark);
  if (s.accent && s.id === 'penguin') { d.rect(ox + 4, oy + 14, 2, 1, s.accent); d.rect(ox + 9, oy + 14, 2, 1, s.accent); }

  // 몸통
  d.rect(ox + 3, oy + 7, 9, 7, OUT, 0.45);
  d.rect(ox + 3, oy + 8, 9, 5, s.body);
  d.rect(ox + 4, oy + 11, 7, 2, s.belly); // 배

  // 머리 (오른쪽)
  d.rect(ox + 8, oy + 3, 7, 8, OUT, 0.45);
  d.rect(ox + 9, oy + 4, 6, 6, s.body);
  d.rect(ox + 9, oy + 8, 6, 2, s.belly); // 주둥이 아래

  // 귀
  if (s.earType === 'up') {
    d.rect(ox + 9, oy + 2, 2, 3, s.body); d.rect(ox + 13, oy + 2, 2, 3, s.body);
    d.rect(ox + 9, oy + 2, 2, 1, s.ear); d.rect(ox + 13, oy + 2, 2, 1, s.ear);
  } else if (s.earType === 'longup') {
    d.rect(ox + 9, oy + 0, 2, 5, s.body); d.rect(ox + 13, oy + 0, 2, 5, s.body);
    d.rect(ox + 9, oy + 1, 1, 3, s.ear); d.rect(ox + 13, oy + 1, 1, 3, s.ear);
  } else if (s.earType === 'round') {
    d.rect(ox + 8, oy + 2, 2, 2, s.ear); d.rect(ox + 13, oy + 2, 2, 2, s.ear);
  } else if (s.earType === 'floppy') {
    d.rect(ox + 8, oy + 4, 2, 4, s.ear); d.rect(ox + 14, oy + 4, 2, 4, s.ear);
  }

  // 눈 + 코 + 볼
  d.rect(ox + 12, oy + 6, 1, 2, 0x2a2420);
  d.rect(ox + 12, oy + 6, 1, 1, 0xffffff, 0.7);
  d.rect(ox + 14, oy + 8, 1, 1, 0x3a2e26); // 코
  d.rect(ox + 11, oy + 9, 1, 1, 0xe89a9a, 0.5); // 볼터치
  // 부리 (병아리·펭귄)
  if (s.accent && (s.id === 'chick' || s.id === 'penguin')) d.rect(ox + 15, oy + 7, 1, 2, s.accent);
}

/** Phaser 텍스처 등록 (씬용). 키: pet-<id> */
export function ensurePet(scene: Phaser.Scene, speciesId: string): string | null {
  const s = petById(speciesId);
  if (!s) return null;
  const key = `pet-${s.id}`;
  makeTexture(scene, key, PET_W, PET_H, (d) => drawPet(d, 0, 0, s));
  return key;
}

/** DOM 캔버스에 펫을 그린다 (펫샵 미리보기용) */
export function paintPet(ctx: CanvasRenderingContext2D, speciesId: string): void {
  const s = petById(speciesId);
  ctx.clearRect(0, 0, PET_W, PET_H);
  if (s) drawPet(px(ctx), 0, 0, s);
}
