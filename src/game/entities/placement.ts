import { CATALOG_BY_ID } from '../../items/catalog';
import { FLOOR } from '../world/roomMap';

/** rot: 0 = 원본, 1 = 90도 회전(w·h 스왑) */
export type Rot = 0 | 1;

/** 배치 레이어 — 러그는 가구 밑에 깔리고, 벽걸이는 벽에 붙는다. 겹침은 같은 레이어끼리만 판정 */
export type Layer = 'rug' | 'floor' | 'wall';

export interface Placed {
  id: string;      // placement 행 id (로컬 배치는 임시 id)
  itemId: string;
  tx: number;
  ty: number;
  rot: Rot;
}

export function layerOf(itemId: string): Layer {
  const def = CATALOG_BY_ID.get(itemId);
  if (!def) return 'floor';
  if (def.category === 'rug') return 'rug';
  if (def.category === 'wall') return 'wall';
  return 'floor';
}

/** 회전 반영한 점유 크기 (벽걸이는 회전 불가 — rot 무시) */
export function sizeOf(itemId: string, rot: Rot): { w: number; h: number } | null {
  const def = CATALOG_BY_ID.get(itemId);
  if (!def) return null;
  if (layerOf(itemId) === 'wall' || rot === 0) return { w: def.w, h: def.h };
  return { w: def.h, h: def.w };
}

/** 점유 타일 목록 */
export function footprint(p: Pick<Placed, 'itemId' | 'tx' | 'ty' | 'rot'>): Array<{ tx: number; ty: number }> {
  const size = sizeOf(p.itemId, p.rot);
  if (!size) return [];
  const tiles: Array<{ tx: number; ty: number }> = [];
  for (let dy = 0; dy < size.h; dy++) {
    for (let dx = 0; dx < size.w; dx++) tiles.push({ tx: p.tx + dx, ty: p.ty + dy });
  }
  return tiles;
}

/**
 * 배치 가능 여부.
 * - rug/floor: 바닥 경계 안 + 같은 레이어끼리 비겹침 (러그 위에 가구 OK)
 * - wall: 최상단 바닥 행(FLOOR.y)에만, 벽걸이끼리 비겹침
 */
export function canPlace(
  placed: Placed[],
  itemId: string,
  tx: number,
  ty: number,
  rot: Rot,
): boolean {
  const size = sizeOf(itemId, rot);
  if (!size) return false;
  const layer = layerOf(itemId);

  if (layer === 'wall') {
    if (ty !== FLOOR.y) return false;
    if (tx < FLOOR.x || tx + size.w > FLOOR.x + FLOOR.w) return false;
  } else {
    if (tx < FLOOR.x || ty < FLOOR.y) return false;
    if (tx + size.w > FLOOR.x + FLOOR.w || ty + size.h > FLOOR.y + FLOOR.h) return false;
  }

  const occupied = new Set<string>();
  for (const p of placed) {
    if (layerOf(p.itemId) !== layer) continue;
    for (const t of footprint(p)) occupied.add(`${t.tx},${t.ty}`);
  }
  for (const t of footprint({ itemId, tx, ty, rot })) {
    if (occupied.has(`${t.tx},${t.ty}`)) return false;
  }
  return true;
}
