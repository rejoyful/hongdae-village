import type Phaser from 'phaser';
import { CATALOG_BY_ID } from '../../items/catalog';
import {
  FURNITURE_COLOR_BY_ID, FURNITURE_FINISH_BY_ID, type FurnitureReformStyle,
} from '../home/furnitureReform';
import { ensureFurniture } from './roomArt';
import type { Rot } from '../entities/placement';

export const REFORM_PREVIEW_W = 480;
export const REFORM_PREVIEW_H = 280;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function drawPattern(ctx: CanvasRenderingContext2D, style: FurnitureReformStyle, w: number, h: number): void {
  const finish = FURNITURE_FINISH_BY_ID.get(style.finishId)!;
  const color = FURNITURE_COLOR_BY_ID.get(style.colorId)!;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = finish.opacity;
  ctx.fillStyle = color.hex; ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = .18; ctx.fillStyle = color.dark;
  if (finish.pattern === 'wash') for (let y = 2; y < h; y += 5) ctx.fillRect(0, y, w, 1);
  if (finish.pattern === 'grain') for (let y = 3; y < h; y += 6) { ctx.fillRect(0, y, w, 1); for (let x = (y * 3) % 11; x < w; x += 13) ctx.fillRect(x, y - 1, 5, 1); }
  if (finish.pattern === 'cross') {
    for (let x = 2; x < w; x += 5) ctx.fillRect(x, 0, 1, h);
    for (let y = 2; y < h; y += 5) ctx.fillRect(0, y, w, 1);
  }
  if (finish.pattern === 'shine') { ctx.globalAlpha = .25; ctx.fillStyle = '#fff3d5'; ctx.fillRect(2, 2, Math.max(1, w - 5), 1); ctx.fillRect(2, 3, 1, Math.max(1, h - 6)); }
  if (finish.pattern === 'speckle') for (let index = 0; index < Math.max(6, Math.floor(w * h / 90)); index += 1) ctx.fillRect((index * 17 + 3) % w, (index * 29 + 5) % h, index % 3 === 0 ? 2 : 1, 1);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

/** 기존 가구 텍스처를 보존하며 색막과 픽셀 재질을 합성한다. */
export function ensureReformedFurniture(
  scene: Phaser.Scene,
  itemId: string,
  rot: Rot,
  style: FurnitureReformStyle,
): string {
  const key = `furn-reform-${itemId}-${rot}-${style.finishId}-${style.colorId}`;
  if (scene.textures.exists(key)) return key;
  const baseKey = ensureFurniture(scene, itemId, rot);
  const source = scene.textures.get(baseKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0);
  drawPattern(ctx, style, canvas.width, canvas.height);
  scene.textures.addCanvas(key, canvas);
  return key;
}

function furnitureShape(ctx: CanvasRenderingContext2D, itemId: string, style: FurnitureReformStyle): void {
  const def = CATALOG_BY_ID.get(itemId);
  const color = FURNITURE_COLOR_BY_ID.get(style.colorId)!;
  const finish = FURNITURE_FINISH_BY_ID.get(style.finishId)!;
  const x = 143; const y = 112; const w = Math.min(190, 88 + (def?.w ?? 1) * 35); const h = Math.min(105, 46 + (def?.h ?? 1) * 24);
  rect(ctx, 'rgba(43,38,32,.22)', x - 18, y + h + 18, w + 55, 13);
  rect(ctx, color.dark, x, y + 7, w, h);
  rect(ctx, color.hex, x + 7, y, w - 7, h - 7);
  const arch = def?.arch ?? 'deco';
  if (['bed', 'sofa', 'seat'].includes(arch)) {
    rect(ctx, '#e2d2b4', x + 18, y + 15, w - 30, Math.max(17, h - 34));
    rect(ctx, color.dark, x + 10, y + h, 12, 20); rect(ctx, color.dark, x + w - 20, y + h, 12, 20);
  } else if (['table', 'counter'].includes(arch)) {
    rect(ctx, '#d8c6a3', x + 10, y + 10, w - 20, 8);
    rect(ctx, color.dark, x + 15, y + 18, 12, h + 8); rect(ctx, color.dark, x + w - 27, y + 18, 12, h + 8);
  } else if (['shelf', 'wardrobe', 'hanger'].includes(arch)) {
    for (let row = y + 18; row < y + h; row += 22) rect(ctx, color.dark, x + 10, row, w - 20, 5);
    for (let col = x + 25; col < x + w - 10; col += 28) rect(ctx, '#d7b86f', col, y + 25, 7, 17);
  } else if (arch === 'screen') {
    rect(ctx, '#303635', x + 15, y + 14, w - 30, h - 28); rect(ctx, '#809b94', x + 21, y + 20, w - 42, h - 40);
  } else {
    rect(ctx, '#e2d2b4', x + 18, y + 18, w - 36, h - 36);
  }
  ctx.globalAlpha = .23; ctx.fillStyle = color.dark;
  if (finish.pattern === 'wash') for (let py = y + 8; py < y + h; py += 7) ctx.fillRect(x + 5, py, w - 10, 2);
  if (finish.pattern === 'grain') for (let py = y + 11; py < y + h; py += 9) ctx.fillRect(x + 7, py, w - 14, 2);
  if (finish.pattern === 'cross') { for (let px = x + 8; px < x + w; px += 8) ctx.fillRect(px, y + 5, 1, h - 10); for (let py = y + 9; py < y + h; py += 8) ctx.fillRect(x + 5, py, w - 10, 1); }
  if (finish.pattern === 'shine') { ctx.fillStyle = '#fff0d2'; ctx.fillRect(x + 9, y + 6, w - 20, 3); }
  if (finish.pattern === 'speckle') for (let i = 0; i < 24; i += 1) ctx.fillRect(x + 7 + (i * 37) % (w - 14), y + 7 + (i * 19) % (h - 14), 3, 2);
  ctx.globalAlpha = 1;
}

/** 리폼 공방 DOM 미리보기용 픽셀 작업대. */
export function paintFurnitureReformPreview(canvas: HTMLCanvasElement, itemId: string, style: FurnitureReformStyle): void {
  canvas.width = REFORM_PREVIEW_W; canvas.height = REFORM_PREVIEW_H;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  rect(ctx, '#aeb7a6', 0, 0, 480, 87); rect(ctx, '#d5c6aa', 0, 87, 480, 193);
  rect(ctx, '#7b6653', 0, 222, 480, 58);
  for (let x = 0; x < 480; x += 32) rect(ctx, x % 64 ? '#8d7560' : '#6f5c4c', x, 244, 30, 3);
  rect(ctx, '#5e4b3d', 18, 40, 103, 142); rect(ctx, '#8b6e54', 27, 50, 85, 123);
  for (let y = 62; y < 165; y += 29) { rect(ctx, '#4a3d34', 35, y, 68, 4); rect(ctx, '#c7aa67', 43, y - 17, 8, 17); rect(ctx, '#718274', 58, y - 15, 9, 15); }
  rect(ctx, '#58665a', 374, 55, 82, 126); rect(ctx, '#809079', 383, 66, 64, 104);
  rect(ctx, '#463a31', 390, 84, 50, 5); rect(ctx, '#d0b873', 397, 69, 8, 15); rect(ctx, '#a87560', 414, 72, 10, 12);
  furnitureShape(ctx, itemId, style);
  rect(ctx, '#43372e', 119, 208, 252, 10); rect(ctx, '#6d5442', 132, 218, 13, 44); rect(ctx, '#6d5442', 345, 218, 13, 44);
  const finish = FURNITURE_FINISH_BY_ID.get(style.finishId)!; const color = FURNITURE_COLOR_BY_ID.get(style.colorId)!;
  rect(ctx, '#efe3c7', 13, 13, 126, 27); rect(ctx, '#3e463f', 17, 17, 118, 19);
  ctx.fillStyle = '#efe3c7'; ctx.font = 'bold 10px monospace'; ctx.textBaseline = 'top'; ctx.fillText(`${finish.id.toUpperCase()} / ${color.id.toUpperCase()}`, 24, 22);
}
