import { CATALOG_BY_ID } from '../../items/catalog';
import { FURNITURE_COLOR_BY_ID } from '../home/furnitureReform';
import {
  HOME_LAYOUT_LABEL_BY_ID, type HomeLayoutLabelId, type HomeLayoutPlacement,
} from '../home/homeLayouts';
import { layerOf, sizeOf } from '../entities/placement';

export const HOME_LAYOUT_ART_W = 180;
export const HOME_LAYOUT_ART_H = 112;

const TILE_W = 12;
const TILE_H = 6;
const ORIGIN_X = 90;
const ORIGIN_Y = 17;

function rect(context: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function iso(tx: number, ty: number): { x: number; y: number } {
  return { x: ORIGIN_X + (tx - ty) * TILE_W / 2, y: ORIGIN_Y + (tx + ty) * TILE_H / 2 };
}

function diamond(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  context.fillStyle = color; context.beginPath(); context.moveTo(x, y - h / 2); context.lineTo(x + w / 2, y);
  context.lineTo(x, y + h / 2); context.lineTo(x - w / 2, y); context.closePath(); context.fill();
}

/** 저장한 배치를 2.5D 픽셀 미니어처로 복원해 장면별 차이를 한눈에 보여 준다. */
export function paintHomeLayoutArt(
  canvas: HTMLCanvasElement, placements: readonly HomeLayoutPlacement[], labelId: HomeLayoutLabelId, selected = false,
): void {
  canvas.width = HOME_LAYOUT_ART_W; canvas.height = HOME_LAYOUT_ART_H;
  const context = canvas.getContext('2d'); if (!context) return;
  const label = HOME_LAYOUT_LABEL_BY_ID.get(labelId)!;
  context.imageSmoothingEnabled = false; context.clearRect(0, 0, 180, 112);
  rect(context, '#27211d', 2, 2, 176, 108);
  rect(context, selected ? label.dark : '#4c4136', 5, 5, 170, 102);
  rect(context, '#d9c49d', 8, 8, 164, 94);
  rect(context, label.color, 8, 8, 164, 5);

  for (let ty = 1; ty <= 9; ty += 1) for (let tx = 1; tx <= 12; tx += 1) {
    const point = iso(tx, ty);
    diamond(context, point.x, point.y, TILE_W - 1, TILE_H - 1, (tx + ty) % 2 ? '#bca47e' : '#c7b18b');
  }
  const north = iso(1, 1); const east = iso(12, 1); const west = iso(1, 9);
  context.strokeStyle = '#735c46'; context.lineWidth = 2; context.beginPath(); context.moveTo(north.x, north.y - 3);
  context.lineTo(east.x + 6, east.y); context.moveTo(north.x, north.y - 3); context.lineTo(west.x - 6, west.y); context.stroke();

  if (!placements.length) drawEmptyRoom(context, label.color, label.dark);
  const sorted = [...placements].sort((a, b) => (a.tx + a.ty) - (b.tx + b.ty) || a.ty - b.ty || a.tx - b.tx);
  for (const placement of sorted) drawFurniture(context, placement);
  rect(context, '#3a3028', 12, 96, 156, 7);
  rect(context, label.color, 15, 98, Math.max(10, Math.min(145, placements.length * 7)), 3);
  if (selected) { rect(context, '#f2d486', 4, 4, 3, 104); rect(context, '#f2d486', 173, 4, 3, 104); }
}

function drawFurniture(context: CanvasRenderingContext2D, placement: HomeLayoutPlacement): void {
  const def = CATALOG_BY_ID.get(placement.itemId); const size = sizeOf(placement.itemId, placement.rot);
  if (!def || !size) return;
  const point = iso(placement.tx + (size.w - 1) / 2, placement.ty + (size.h - 1) / 2);
  const reformed = placement.reform ? FURNITURE_COLOR_BY_ID.get(placement.reform.colorId) : null;
  const color = reformed?.hex ?? `#${def.color}`; const dark = reformed?.dark ?? shade(color, -.34);
  const width = Math.max(7, (size.w + size.h) * 5);
  if (layerOf(placement.itemId) === 'rug') {
    diamond(context, point.x, point.y + 2, width, Math.max(5, width / 2), dark);
    diamond(context, point.x, point.y + 1, Math.max(4, width - 4), Math.max(3, width / 2 - 3), color); return;
  }
  if (layerOf(placement.itemId) === 'wall') {
    const wall = iso(placement.tx, 1); rect(context, dark, wall.x - width / 2, wall.y - 17, width, 13);
    rect(context, color, wall.x - width / 2 + 2, wall.y - 15, Math.max(3, width - 4), 9); return;
  }
  diamond(context, point.x, point.y + 3, width + 3, Math.max(5, width / 2), '#675441');
  rect(context, dark, point.x - width / 2, point.y - 7, width, 10);
  rect(context, color, point.x - width / 2 + 1, point.y - 9, Math.max(3, width - 2), 7);
  const category = def.category;
  if (category === 'plant') {
    rect(context, dark, point.x - 4, point.y - 5, 8, 8); rect(context, color, point.x - 1, point.y - 16, 3, 10);
    rect(context, color, point.x - 7, point.y - 14, 7, 5); rect(context, color, point.x + 2, point.y - 12, 7, 5);
  } else if (category === 'electronics') {
    rect(context, '#312f2d', point.x - width / 2 + 3, point.y - 7, Math.max(3, width - 6), 4);
    rect(context, '#d3b86f', point.x + width / 2 - 4, point.y - 6, 2, 2);
  } else if (category === 'deco') {
    rect(context, '#eee0bf', point.x - 2, point.y - 13, 4, 6);
  } else if (category === 'furniture' && width >= 15) {
    rect(context, dark, point.x - width / 2 + 3, point.y - 4, 3, 5);
    rect(context, dark, point.x + width / 2 - 6, point.y - 4, 3, 5);
  }
}

function drawEmptyRoom(context: CanvasRenderingContext2D, color: string, dark: string): void {
  const center = iso(6.5, 5);
  diamond(context, center.x, center.y + 4, 27, 13, dark);
  rect(context, dark, center.x - 12, center.y - 9, 24, 12);
  rect(context, color, center.x - 9, center.y - 12, 18, 8);
  rect(context, '#e7d5b4', center.x - 3, center.y - 10, 6, 5);
}

function shade(hex: string, amount: number): string {
  const raw = hex.replace('#', ''); const value = Number.parseInt(raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw, 16);
  if (!Number.isFinite(value)) return '#57483a';
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * (1 + amount))));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}
