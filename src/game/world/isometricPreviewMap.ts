import { CollisionGrid, type Rect } from './grid';
import type { IsoBuildingDef, IsoTerrain } from '../art/isometricArt';

export const ISO_PREVIEW_W = 18;
export const ISO_PREVIEW_H = 18;

/** 수직 슬라이스용 작은 홍대 블록. 실제 맵 데이터로 교체하기 전 투영 계약을 검증한다. */
export const ISO_PREVIEW_BUILDINGS: readonly IsoBuildingDef[] = [
  {
    id: 'mind-forest', name: '마인드 포레스트', tx: 2, ty: 2, w: 4, h: 3, levels: 5,
    wallLeft: 0xb79b7b, wallRight: 0x9c8065, roof: 0x6f5a49, accent: 0xf1d49a,
  },
  {
    id: 'corner-cafe', name: '모퉁이 카페', tx: 10, ty: 2, w: 3, h: 3, levels: 2,
    wallLeft: 0xc9a987, wallRight: 0xaa896b, roof: 0x7c5846, accent: 0xd98568,
  },
  {
    id: 'salim', name: '살림', tx: 3, ty: 11, w: 3, h: 3, levels: 2,
    wallLeft: 0xb4aa84, wallRight: 0x8e8a6a, roof: 0x6d6551, accent: 0xe7bd7f,
  },
  {
    id: 'pet-shop', name: '멍냥이네', tx: 11, ty: 11, w: 3, h: 3, levels: 2,
    wallLeft: 0xc6a0a0, wallRight: 0xa78181, roof: 0x73545a, accent: 0xf0c3a1,
  },
] as const;

const BORDER: Rect[] = [
  { x: 0, y: 0, w: ISO_PREVIEW_W, h: 1 },
  { x: 0, y: ISO_PREVIEW_H - 1, w: ISO_PREVIEW_W, h: 1 },
  { x: 0, y: 0, w: 1, h: ISO_PREVIEW_H },
  { x: ISO_PREVIEW_W - 1, y: 0, w: 1, h: ISO_PREVIEW_H },
];

export function buildIsoPreviewCollision(): CollisionGrid {
  const buildings: Rect[] = ISO_PREVIEW_BUILDINGS.map(({ tx: x, ty: y, w, h }) => ({ x, y, w, h }));
  return CollisionGrid.fromRects(ISO_PREVIEW_W, ISO_PREVIEW_H, [...BORDER, ...buildings]);
}

export function isoPreviewTerrain(tx: number, ty: number): IsoTerrain {
  if (tx >= 7 && tx <= 9) return 'road';
  if (ty >= 7 && ty <= 9) return 'road';
  if (tx >= 6 && tx <= 10 && ty >= 6 && ty <= 10) return 'plaza';
  if (tx <= 6 && ty <= 6) return 'grass';
  return 'alley';
}
