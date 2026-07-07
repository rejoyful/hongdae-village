import { MAP_W, MAP_H } from '../config';
import { CollisionGrid, type Rect } from './grid';

export interface Zone { name: string; rect: Rect; color: number }

/** 시즌1 홍대입구역 일대 블록아웃 (스펙 §2). 색은 placeholder 무드 컬러. */
export const ZONES: Zone[] = [
  { name: '경의선 숲길',        rect: { x: 1,  y: 1,  w: 78, h: 8  }, color: 0x2f4a3a },
  { name: '주택 골목 (서)',     rect: { x: 1,  y: 10, w: 24, h: 17 }, color: 0x4a3a2f },
  { name: '주택 골목 (동)',     rect: { x: 55, y: 10, w: 24, h: 17 }, color: 0x4a3a2f },
  { name: '메인 스트리트',      rect: { x: 1,  y: 28, w: 78, h: 8  }, color: 0x3a3f52 },
  { name: '포차 골목',          rect: { x: 1,  y: 37, w: 22, h: 18 }, color: 0x523a4a },
  { name: '홍대입구역 9번 출구', rect: { x: 28, y: 37, w: 24, h: 18 }, color: 0x37424a },
  { name: '벽화 골목',          rect: { x: 57, y: 37, w: 22, h: 18 }, color: 0x3d4a37 },
];

/** 건물·구조물 풋프린트 (통행 불가). 실내 진입은 Phase 3에서. */
export const SOLID_RECTS: Rect[] = [
  // 맵 테두리 벽
  { x: 0, y: 0, w: MAP_W, h: 1 },
  { x: 0, y: MAP_H - 1, w: MAP_W, h: 1 },
  { x: 0, y: 0, w: 1, h: MAP_H },
  { x: MAP_W - 1, y: 0, w: 1, h: MAP_H },
  // 주택 골목 (서) — 개인 공간 5채
  { x: 3,  y: 12, w: 6, h: 4 }, { x: 12, y: 12, w: 6, h: 4 },
  { x: 3,  y: 20, w: 6, h: 4 }, { x: 12, y: 20, w: 6, h: 4 }, { x: 20, y: 16, w: 4, h: 6 },
  // 주택 골목 (동) — 개인 공간 5채
  { x: 57, y: 12, w: 6, h: 4 }, { x: 66, y: 12, w: 6, h: 4 },
  { x: 57, y: 20, w: 6, h: 4 }, { x: 66, y: 20, w: 6, h: 4 }, { x: 74, y: 16, w: 4, h: 6 },
  // 메인 스트리트 상점 4곳 (가구점·카페·편의점·잡화점) — 거리 남쪽 접면
  { x: 8,  y: 33, w: 8, h: 3 }, { x: 24, y: 33, w: 8, h: 3 },
  { x: 48, y: 33, w: 8, h: 3 }, { x: 64, y: 33, w: 8, h: 3 },
  // 역 출구 구조물
  { x: 36, y: 46, w: 8, h: 4 },
];

/** 스폰 지점: 역 출구 앞 광장 (스펙 §2) */
export const SPAWN_TILE = { tx: 40, ty: 42 };

export function buildCollision(): CollisionGrid {
  return CollisionGrid.fromRects(MAP_W, MAP_H, SOLID_RECTS);
}
