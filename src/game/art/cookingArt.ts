import { cookingRecipeById, type DishShape } from '../cooking/cooking';
import type { GardenSeedId, GardenVariantId } from '../garden/garden';

type Ctx = CanvasRenderingContext2D;

const W = 128;
const H = 108;

const VARIANT_LIGHT: Record<GardenVariantId, { wall: string; light: string; shadow: string }> = {
  sun: { wall: '#c9b682', light: '#efd997', shadow: '#76694e' },
  rain: { wall: '#84958c', light: '#bdcbbb', shadow: '#53645d' },
  moon: { wall: '#667078', light: '#c5c2ae', shadow: '#424b51' },
};

function rect(ctx: Ctx, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function ellipse(ctx: Ctx, color: string, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

function backdrop(ctx: Ctx, variantId: GardenVariantId): void {
  const v = VARIANT_LIGHT[variantId];
  rect(ctx, v.wall, 0, 0, W, H);
  rect(ctx, v.light, 0, 0, W, 4);
  rect(ctx, '#4b4b42', 0, 24, W, 4);
  rect(ctx, '#777467', 0, 25, W, 2);
  for (let x = 8; x < W; x += 24) {
    rect(ctx, '#45463e', x, 5, 2, 19);
    rect(ctx, '#d2c49b', x + 2, 8, 14, 11);
    rect(ctx, v.shadow, x + 4, 10, 10, 7);
  }
  rect(ctx, '#5e4c3c', 0, 79, W, 29);
  rect(ctx, '#8c6d4d', 0, 77, W, 5);
  rect(ctx, '#b08a5f', 0, 77, W, 2);
  for (let x = 4; x < W; x += 17) rect(ctx, '#6f553f', x, 85 + (x % 3), 10, 2);
}

function plate(ctx: Ctx, color: string): void {
  ellipse(ctx, '#3c372f', 64, 78, 39, 13);
  ellipse(ctx, color, 64, 74, 38, 13);
  ellipse(ctx, '#e4dcc8', 64, 72, 31, 9);
  ellipse(ctx, '#b9ae98', 64, 75, 28, 7);
}

function garnish(ctx: Ctx, color: string, accent: string, x: number, y: number): void {
  rect(ctx, '#334338', x - 4, y, 8, 4);
  rect(ctx, color, x - 3, y, 5, 3);
  rect(ctx, accent, x + 2, y - 1, 3, 3);
}

function drawFood(ctx: Ctx, shape: DishShape, food: string, accent: string): void {
  if (shape === 'drink' || shape === 'milk' || shape === 'tea') {
    rect(ctx, '#423a32', 48, 39, 34, 38);
    rect(ctx, '#d7d5ca', 50, 37, 30, 38);
    rect(ctx, food, 53, 43, 24, 28);
    rect(ctx, '#f1ead8', 55, 40, 20, 4);
    rect(ctx, '#9c9281', 82, 49, 5, 17);
    rect(ctx, '#d7d5ca', 80, 47, 8, 21);
    rect(ctx, VARIANT_LIGHT.moon.shadow, 57, 47, 3, 19);
    if (shape === 'drink') for (const [x, y] of [[62, 49], [70, 55], [65, 64]] as Array<[number, number]>) rect(ctx, '#d8e2d5', x, y, 4, 4);
    garnish(ctx, accent, '#e6d3a0', 66, 38);
    return;
  }
  plate(ctx, '#d2c6ad');
  if (shape === 'toast') {
    rect(ctx, '#5c3e2b', 41, 45, 48, 28); rect(ctx, food, 44, 43, 42, 27); rect(ctx, '#e5c084', 48, 48, 34, 20);
    for (const [x, y] of [[52, 51], [64, 57], [73, 48], [79, 62]] as Array<[number, number]>) garnish(ctx, accent, '#d7d895', x, y);
  } else if (shape === 'cookie' || shape === 'macaron') {
    const ys = shape === 'macaron' ? [52, 62] : [57, 64];
    for (const [index, x] of [48, 62, 76].entries()) {
      ellipse(ctx, '#5b402e', x, ys[index % 2]!, 12, 8); ellipse(ctx, food, x, ys[index % 2]! - 2, 10, 7);
      rect(ctx, accent, x - 3, ys[index % 2]! - 5, 5, 3);
      if (shape === 'macaron') rect(ctx, '#eee2ce', x - 8, ys[index % 2]!, 16, 3);
    }
  } else if (shape === 'bread') {
    rect(ctx, '#60412d', 37, 50, 54, 24); rect(ctx, food, 40, 47, 48, 24);
    for (let x = 46; x < 86; x += 12) { rect(ctx, '#e3b879', x, 51, 7, 3); garnish(ctx, accent, '#d0c68c', x + 2, 46); }
  } else if (shape === 'soup') {
    ellipse(ctx, '#4d3c31', 64, 69, 35, 13); rect(ctx, '#aa9b83', 31, 52, 66, 18); ellipse(ctx, '#d6cbb5', 64, 53, 33, 11); ellipse(ctx, food, 64, 54, 27, 8);
    garnish(ctx, accent, '#f0ce75', 65, 49); rect(ctx, '#e0be78', 50, 51, 7, 5); rect(ctx, '#e0be78', 76, 55, 6, 4);
  } else if (shape === 'sandwich') {
    rect(ctx, '#5c4635', 40, 48, 49, 24); rect(ctx, food, 43, 45, 43, 22); rect(ctx, '#c85d58', 47, 52, 9, 12); rect(ctx, '#eee0c8', 57, 49, 10, 17); rect(ctx, '#c85d58', 68, 52, 9, 12); rect(ctx, '#eee0c8', 78, 49, 6, 17);
  } else if (shape === 'jelly') {
    rect(ctx, '#4a4540', 43, 44, 44, 30); rect(ctx, food, 46, 40, 38, 31); rect(ctx, '#b8c7ce', 50, 44, 10, 18); rect(ctx, '#d9d5c8', 51, 40, 8, 4); garnish(ctx, accent, '#e5d9b8', 76, 38);
  } else if (shape === 'pasta') {
    for (let y = 50; y < 70; y += 5) { rect(ctx, '#e0b870', 43 + (y % 3), y, 43, 3); rect(ctx, food, 52 + (y % 4), y + 1, 28, 3); }
    for (const [x, y] of [[48, 55], [72, 51], [80, 63]] as Array<[number, number]>) { ellipse(ctx, accent, x, y, 5, 4); rect(ctx, '#e7b47b', x - 2, y - 2, 2, 2); }
  } else if (shape === 'taco') {
    for (const [x, y] of [[48, 60], [65, 54], [81, 62]] as Array<[number, number]>) {
      ellipse(ctx, '#60432e', x, y, 14, 10); rect(ctx, food, x - 11, y - 8, 22, 10); rect(ctx, accent, x - 8, y - 10, 16, 6); rect(ctx, '#d2aa60', x - 9, y + 2, 18, 4);
    }
  }
  garnish(ctx, accent, '#e6d6a0', 91, 70);
}

export function paintCookingDish(canvas: HTMLCanvasElement, recipeId: GardenSeedId, variantId: GardenVariantId, discovered = true): void {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  backdrop(ctx, variantId);
  if (discovered) {
    const recipe = cookingRecipeById(recipeId);
    drawFood(ctx, recipe.shape, recipe.food, recipe.accent);
  } else {
    plate(ctx, '#777166'); rect(ctx, '#47443e', 60, 42, 8, 26); rect(ctx, '#777166', 56, 69, 16, 4);
  }
  rect(ctx, '#2f2b25', 0, H - 3, W, 3);
}
