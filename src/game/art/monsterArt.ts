import type Phaser from 'phaser';
import { makeTexture, px, type Px } from './pixelCanvas';
import { MONSTER_MAP, type MonsterSpecies } from '../battle/monsters';

export const MON_W = 16;
export const MON_H = 16;

function shade(c: number, f: number): number {
  const g = (v: number) => Math.max(0, Math.min(255, Math.floor(v * f)));
  return (g((c >> 16) & 0xff) << 16) | (g((c >> 8) & 0xff) << 8) | g(c & 0xff);
}

/** 16×16 몬스터. shape·팔레트로 30종을 구분. 높은 티어는 성난 표정 */
function drawMonster(d: Px, ox: number, oy: number, m: MonsterSpecies): void {
  const { body, dark, eye, accent, shape, tier } = m;
  const lite = shade(body, 1.2);
  const OUT = 0x1a1712;
  // 그림자
  d.rect(ox + 3, oy + 15, 10, 1, 0x000000, 0.22);

  // 뒤 레이어 (날개·뿔·가시)
  if (shape === 'winged') {
    const w = accent ?? lite;
    d.rect(ox + 1, oy + 7, 3, 4, w); d.rect(ox + 12, oy + 7, 3, 4, w);
    d.rect(ox + 0, oy + 8, 2, 2, w); d.rect(ox + 14, oy + 8, 2, 2, w);
  }
  if (shape === 'horned') {
    d.rect(ox + 4, oy + 3, 1, 3, accent ?? dark); d.rect(ox + 3, oy + 3, 1, 1, accent ?? dark);
    d.rect(ox + 11, oy + 3, 1, 3, accent ?? dark); d.rect(ox + 12, oy + 3, 1, 1, accent ?? dark);
  }
  if (shape === 'spiky') {
    for (let i = 0; i < 5; i++) d.rect(ox + 4 + i * 2, oy + 3 + (i % 2), 1, 3, accent ?? dark);
  }

  // 본체
  if (shape === 'ghost') {
    d.rect(ox + 4, oy + 5, 8, 8, body, 0.92);
    d.rect(ox + 5, oy + 4, 6, 1, body, 0.92);
    // 물결 밑단
    d.rect(ox + 4, oy + 13, 2, 1, body, 0.8); d.rect(ox + 7, oy + 13, 2, 1, body, 0.8); d.rect(ox + 10, oy + 13, 2, 1, body, 0.8);
    d.rect(ox + 4, oy + 5, 2, 8, dark, 0.5);
  } else if (shape === 'golem') {
    d.rect(ox + 3, oy + 6, 10, 8, OUT, 0.4);
    d.rect(ox + 4, oy + 6, 8, 8, body);
    d.rect(ox + 4, oy + 6, 8, 1, lite); d.rect(ox + 4, oy + 12, 8, 2, dark);
    d.rect(ox + 5, oy + 8, 2, 2, dark, 0.4); d.rect(ox + 9, oy + 10, 2, 2, dark, 0.4); // 균열
  } else {
    // slime/horned/spiky/winged 공용 둥근 몸
    d.rect(ox + 4, oy + 7, 8, 7, OUT, 0.35);
    d.rect(ox + 4, oy + 8, 8, 6, body);
    d.rect(ox + 5, oy + 6, 6, 2, body);
    d.rect(ox + 5, oy + 7, 5, 1, lite);
    d.rect(ox + 4, oy + 12, 8, 2, dark);
    d.rect(ox + 4, oy + 14, 2, 1, body); d.rect(ox + 8, oy + 14, 2, 1, body); // 물컹 밑단
  }

  // 눈 (성난 표정 = 높은 티어)
  const ey = shape === 'golem' ? oy + 8 : oy + 9;
  d.rect(ox + 5, ey, 2, 2, 0xffffff); d.rect(ox + 5, ey, 1, 1, eye);
  d.rect(ox + 9, ey, 2, 2, 0xffffff); d.rect(ox + 10, ey, 1, 1, eye);
  if (tier >= 3) { // 찡그린 눈썹
    d.rect(ox + 5, ey - 1, 2, 1, dark); d.rect(ox + 9, ey - 1, 2, 1, dark);
  }
  if (tier >= 4) { // 이빨 입
    d.rect(ox + 6, ey + 3, 4, 1, 0x2a1a1a);
    d.rect(ox + 6, ey + 3, 1, 1, 0xffffff); d.rect(ox + 9, ey + 3, 1, 1, 0xffffff);
  }
}

export function ensureMonster(scene: Phaser.Scene, id: string): string | null {
  const m = MONSTER_MAP.get(id);
  if (!m) return null;
  const key = `mon-${id}`;
  makeTexture(scene, key, MON_W, MON_H, (d) => drawMonster(d, 0, 0, m));
  return key;
}

export function paintMonster(ctx: CanvasRenderingContext2D, id: string): void {
  const m = MONSTER_MAP.get(id);
  ctx.clearRect(0, 0, MON_W, MON_H);
  if (m) drawMonster(px(ctx), 0, 0, m);
}
