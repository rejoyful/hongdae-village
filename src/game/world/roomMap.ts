import { CollisionGrid } from './grid';

/** 방 내부 크기 (타일). 테두리 1타일은 벽 */
export const ROOM_W = 12;
export const ROOM_H = 10;

/** 문: 하단 벽 중앙 — 밟으면 거리로 퇴장 */
export const ROOM_DOOR = { tx: Math.floor(ROOM_W / 2), ty: ROOM_H - 1 };
/** 방 스폰: 문 바로 안쪽 */
export const ROOM_SPAWN = { tx: ROOM_DOOR.tx, ty: ROOM_H - 2 };

/** 테두리 벽(문 타일 제외) 충돌 그리드 */
export function buildRoomCollision(): CollisionGrid {
  const grid = CollisionGrid.fromRects(ROOM_W, ROOM_H, [
    { x: 0, y: 0, w: ROOM_W, h: 1 },
    { x: 0, y: ROOM_H - 1, w: ROOM_DOOR.tx, h: 1 },
    { x: ROOM_DOOR.tx + 1, y: ROOM_H - 1, w: ROOM_W - ROOM_DOOR.tx - 1, h: 1 },
    { x: 0, y: 0, w: 1, h: ROOM_H },
    { x: ROOM_W - 1, y: 0, w: 1, h: ROOM_H },
  ]);
  return grid;
}

/** 배치 가능 영역: 벽 안쪽 바닥 */
export const FLOOR = { x: 1, y: 1, w: ROOM_W - 2, h: ROOM_H - 2 };
