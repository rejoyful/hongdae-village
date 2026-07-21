import type Phaser from 'phaser';

/** 시드 고정 의사난수 (mulberry32) — 아트가 리로드마다 변하지 않게 한다 */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hex(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface Px {
  ctx: CanvasRenderingContext2D;
  p: (x: number, y: number, color: number, alpha?: number) => void;
  rect: (x: number, y: number, w: number, h: number, color: number, alpha?: number) => void;
  /** 밀도(0~1)만큼 무작위 점을 뿌려 질감을 낸다 */
  speckle: (x: number, y: number, w: number, h: number, color: number, density: number, rnd: () => number, alpha?: number) => void;
}

export function px(ctx: CanvasRenderingContext2D): Px {
  return {
    ctx,
    p: (x, y, color, alpha = 1) => { ctx.fillStyle = hex(color, alpha); ctx.fillRect(x, y, 1, 1); },
    rect: (x, y, w, h, color, alpha = 1) => { ctx.fillStyle = hex(color, alpha); ctx.fillRect(x, y, w, h); },
    speckle: (x, y, w, h, color, density, rnd, alpha = 1) => {
      ctx.fillStyle = hex(color, alpha);
      const n = Math.floor(w * h * density);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1);
      }
    },
  };
}

/** 캔버스에 그린 뒤 Phaser 텍스처로 등록. 이미 있으면 재사용 */
export function makeTexture(
  scene: Phaser.Scene, key: string, w: number, h: number,
  draw: (d: Px) => void,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, w, h);
  if (!canvas) return;
  draw(px(canvas.context));
  canvas.refresh();
}

/** 프레임이 가로로 나열된 캔버스 스프라이트시트 등록 */
export function makeSheet(
  scene: Phaser.Scene, key: string, frameW: number, frameH: number, frames: number,
  draw: (d: Px, frame: number, ox: number) => void,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, frameW * frames, frameH);
  if (!canvas) return;
  const d = px(canvas.context);
  for (let f = 0; f < frames; f++) draw(d, f, f * frameW);
  canvas.refresh();
  const tex = scene.textures.get(key);
  for (let f = 0; f < frames; f++) tex.add(f, 0, f * frameW, 0, frameW, frameH);
}
