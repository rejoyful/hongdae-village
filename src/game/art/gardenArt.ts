import {
  gardenSeedById, type GardenPlot, type GardenSeedId, type GardenStage, type GardenVariantId,
} from '../garden/garden';

const W = 112;
const H = 104;

type Ctx = CanvasRenderingContext2D;

const VARIANT_TINT: Record<GardenVariantId, { sky: string; glow: string; shadow: string }> = {
  sun: { sky: '#d7c58e', glow: '#f1dda1', shadow: '#6d704f' },
  rain: { sky: '#849b94', glow: '#bdd0be', shadow: '#4d6460' },
  moon: { sky: '#657079', glow: '#c2c1b3', shadow: '#414c51' },
};

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pixelLine(ctx: Ctx, color: string, points: Array<[number, number]>): void {
  ctx.fillStyle = color;
  for (const [x, y] of points) ctx.fillRect(x, y, 2, 2);
}

function drawBackdrop(ctx: Ctx, variantId: GardenVariantId): void {
  const tint = VARIANT_TINT[variantId];
  rect(ctx, tint.sky, 0, 0, W, H);
  rect(ctx, tint.glow, 0, 0, W, 4);
  rect(ctx, '#66715e', 0, 52, W, 52);
  rect(ctx, '#55604f', 0, 58, W, 46);
  rect(ctx, '#39443b', 0, 83, W, 21);
  rect(ctx, tint.shadow, 0, 48, W, 5);
  for (let x = 0; x < W; x += 16) {
    rect(ctx, '#475249', x, 57 + ((x / 16) % 2) * 3, 10, 2);
    rect(ctx, '#71806c', x + 3, 61 + ((x / 16) % 2) * 3, 11, 2);
  }
  rect(ctx, '#4a4c44', 0, 31, W, 4);
  rect(ctx, '#727167', 0, 30, W, 2);
  for (let x = 6; x < W; x += 18) rect(ctx, '#4a4c44', x, 32, 3, 22);
  if (variantId === 'sun') {
    rect(ctx, '#f0d991', 86, 10, 9, 9);
    rect(ctx, '#cfb96f', 89, 7, 3, 15);
    rect(ctx, '#cfb96f', 83, 13, 15, 3);
  } else if (variantId === 'rain') {
    pixelLine(ctx, '#c6d5cc', [[12, 9], [28, 18], [46, 7], [67, 15], [88, 8], [102, 21]]);
    pixelLine(ctx, '#6b8780', [[17, 20], [34, 10], [54, 22], [76, 6], [95, 16]]);
  } else {
    rect(ctx, '#d1d0be', 86, 9, 9, 9);
    rect(ctx, tint.sky, 89, 7, 8, 8);
    pixelLine(ctx, '#b4b8ad', [[13, 10], [30, 19], [50, 8], [67, 21], [103, 12]]);
  }
}

function drawPot(ctx: Ctx): void {
  rect(ctx, '#30271f', 28, 85, 57, 6);
  rect(ctx, '#6d4531', 34, 69, 45, 18);
  rect(ctx, '#9b6543', 37, 71, 39, 14);
  rect(ctx, '#bb7d4f', 29, 66, 55, 7);
  rect(ctx, '#d39a66', 32, 67, 49, 2);
  rect(ctx, '#453125', 38, 65, 37, 4);
  rect(ctx, '#8f6044', 39, 66, 35, 2);
  rect(ctx, '#503426', 38, 83, 5, 4);
  rect(ctx, '#704a34', 72, 72, 4, 11);
}

function leaf(ctx: Ctx, x: number, y: number, side: -1 | 1, color: string, highlight: string, large = false): void {
  const w = large ? 12 : 9;
  const h = large ? 7 : 5;
  rect(ctx, '#334a3c', side < 0 ? x - w : x, y, w, h);
  rect(ctx, color, side < 0 ? x - w + 2 : x, y + 1, w - 2, h - 2);
  rect(ctx, highlight, side < 0 ? x - w + 2 : x + w - 4, y + 1, 3, 2);
}

function bloom(ctx: Ctx, x: number, y: number, color: string, accent: string, size = 1): void {
  const p = size === 2 ? 4 : 3;
  rect(ctx, '#4b382f', x - p - 1, y - 1, p * 2 + 2, p * 2 + 2);
  rect(ctx, color, x - p, y, p, p);
  rect(ctx, color, x + 1, y, p, p);
  rect(ctx, color, x - 1, y - p + 1, p, p);
  rect(ctx, color, x - 1, y + p, p, p);
  rect(ctx, accent, x - 1, y + 1, 3, 3);
}

function berry(ctx: Ctx, x: number, y: number, color: string, accent: string): void {
  rect(ctx, '#49372c', x - 3, y - 2, 8, 8);
  rect(ctx, color, x - 2, y - 1, 6, 6);
  rect(ctx, accent, x - 1, y, 2, 2);
  rect(ctx, '#426044', x, y - 3, 3, 2);
}

function drawPlant(ctx: Ctx, seedId: GardenSeedId, stage: GardenStage): void {
  const seed = gardenSeedById(seedId);
  if (stage === 0) {
    rect(ctx, '#6f4d33', 51, 63, 10, 3);
    rect(ctx, seed.accent, 54, 61, 4, 2);
    return;
  }
  const top = stage === 1 ? 55 : stage === 2 ? 38 : 22;
  rect(ctx, '#31483b', 54, top, 5, 46 - top + 20);
  rect(ctx, seed.leaf, 56, top + 1, 2, 45 - top + 20);
  leaf(ctx, 54, top + 15, -1, seed.leaf, seed.accent, stage >= 3);
  leaf(ctx, 59, top + 22, 1, seed.leaf, seed.accent, stage >= 2);
  if (stage >= 2) {
    leaf(ctx, 54, top + 29, -1, seed.leaf, seed.accent);
    leaf(ctx, 59, top + 8, 1, seed.leaf, seed.accent);
  }
  if (stage < 3) return;

  if (seedId === 'tomato' || seedId === 'strawberry') {
    berry(ctx, 43, 39, seed.bloom, seed.accent);
    berry(ctx, 65, 34, seed.bloom, seed.accent);
    berry(ctx, 58, 25, seed.bloom, seed.accent);
  } else if (seedId === 'monstera') {
    leaf(ctx, 53, 27, -1, seed.leaf, seed.accent, true);
    leaf(ctx, 60, 22, 1, seed.leaf, seed.accent, true);
    rect(ctx, '#617e60', 42, 29, 3, 2);
    rect(ctx, '#617e60', 67, 25, 3, 2);
  } else if (seedId === 'rosemary' || seedId === 'lavender') {
    for (const [x, y] of [[46, 37], [53, 27], [61, 34], [68, 23], [57, 18]] as Array<[number, number]>) {
      rect(ctx, seed.bloom, x, y, 3, 8);
      rect(ctx, seed.accent, x + 1, y, 2, 2);
      rect(ctx, '#374c3e', x + 1, y + 8, 2, 10);
    }
  } else if (seedId === 'hydrangea') {
    for (const [x, y] of [[48, 29], [56, 24], [64, 30], [55, 34]] as Array<[number, number]>) bloom(ctx, x, y, seed.bloom, seed.accent);
  } else {
    bloom(ctx, 56, 19, seed.bloom, seed.accent, seedId === 'camellia' || seedId === 'moon_orchid' ? 2 : 1);
    bloom(ctx, 43, 35, seed.bloom, seed.accent);
    bloom(ctx, 68, 33, seed.bloom, seed.accent);
  }
  rect(ctx, 'rgba(255,255,255,.42)', 50, 15, 3, 3);
  rect(ctx, 'rgba(255,255,255,.28)', 74, 27, 2, 2);
}

export function paintGardenPlot(canvas: HTMLCanvasElement, plot: GardenPlot | null, previewSeedId: GardenSeedId = 'basil'): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const variantId = plot?.variantId ?? 'sun';
  drawBackdrop(ctx, variantId);
  drawPot(ctx);
  drawPlant(ctx, plot?.seedId ?? previewSeedId, plot?.stage ?? 0);
  rect(ctx, '#2e2922', 0, H - 4, W, 4);
  rect(ctx, '#887254', 0, H - 4, W, 1);
}

export function paintGardenSpecimen(
  canvas: HTMLCanvasElement,
  seedId: GardenSeedId,
  variantId: GardenVariantId,
  collected: boolean,
): void {
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const tint = VARIANT_TINT[variantId];
  rect(ctx, collected ? tint.sky : '#4c4940', 0, 0, 40, 40);
  rect(ctx, collected ? tint.glow : '#656158', 0, 0, 40, 2);
  if (collected) {
    ctx.save();
    ctx.translate(-36, -42);
    ctx.scale(0.65, 0.65);
    drawPlant(ctx, seedId, 3);
    ctx.restore();
  } else {
    rect(ctx, '#37352f', 18, 13, 5, 15);
    rect(ctx, '#5f5b50', 16, 29, 9, 3);
  }
  rect(ctx, collected ? '#2e2922' : '#38362f', 0, 37, 40, 3);
}
