import type Phaser from 'phaser';
import { makeTexture, px, type Px } from './pixelCanvas';

export const WPN_W = 12;
export const WPN_H = 16;

/** 무기별 날/가드 색 (fist는 없음) */
const PAL: Record<string, { blade: number; guard: number; glow?: boolean }> = {
  woodsword: { blade: 0xb98a5c, guard: 0x8a6a44 },
  dagger: { blade: 0xc0c8d0, guard: 0x8a8a92 },
  bronze: { blade: 0xc8904a, guard: 0xe0b060 },
  steel: { blade: 0xc8d0dc, guard: 0x9aa4b0 },
  knight: { blade: 0xe0e8f0, guard: 0xf2c84c },
  mithril: { blade: 0x9ce0f0, guard: 0xd8f2ff, glow: true },
  dragon: { blade: 0xe86a3c, guard: 0xf2a83c, glow: true },
  legend: { blade: 0xf2e08a, guard: 0xfff2a0, glow: true },
};

function shade(c: number, f: number): number {
  const g = (v: number) => Math.max(0, Math.min(255, Math.floor(v * f)));
  return (g((c >> 16) & 0xff) << 16) | (g((c >> 8) & 0xff) << 8) | g(c & 0xff);
}

/** 손잡이가 아래, 날이 위를 향하는 검 (씬에서 손에 쥐어 방향 배치) */
function drawSword(d: Px, ox: number, oy: number, id: string): void {
  const p = PAL[id];
  if (!p) return;
  const grip = 0x5a3a1c;
  // 손잡이 + 폼멜
  d.rect(ox + 5, oy + 11, 2, 4, grip);
  d.rect(ox + 4, oy + 15, 4, 1, p.guard);
  // 가드(십자)
  d.rect(ox + 3, oy + 10, 6, 1, p.guard);
  d.rect(ox + 3, oy + 9, 1, 1, p.guard); d.rect(ox + 8, oy + 9, 1, 1, p.guard);
  // 날
  d.rect(ox + 5, oy + 1, 2, 9, p.blade);
  d.rect(ox + 5, oy + 1, 1, 9, shade(p.blade, 1.3)); // 하이라이트
  d.rect(ox + 5, oy + 0, 2, 1, shade(p.blade, 1.4)); // 검 끝
  if (p.glow) { // 상급 무기 반짝임
    d.rect(ox + 4, oy + 3, 1, 1, 0xffffff, 0.8); d.rect(ox + 8, oy + 6, 1, 1, 0xffffff, 0.7);
  }
}

export function ensureWeaponSprite(scene: Phaser.Scene, id: string): string | null {
  if (!PAL[id]) return null; // fist 등은 표시 안 함
  const key = `wpn-${id}`;
  makeTexture(scene, key, WPN_W, WPN_H, (dd) => drawSword(dd, 0, 0, id));
  return key;
}

export function paintWeapon(ctx: CanvasRenderingContext2D, id: string): void {
  ctx.clearRect(0, 0, WPN_W, WPN_H);
  drawSword(px(ctx), 0, 0, id);
}
