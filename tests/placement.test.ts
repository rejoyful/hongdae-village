import { describe, it, expect } from 'vitest';
import { CATALOG, validateCatalog } from '../src/items/catalog';
import { sizeOf, footprint, canPlace, type Placed } from '../src/game/entities/placement';
import { buildRoomCollision, ROOM_DOOR, ROOM_SPAWN, ROOM_W, ROOM_H } from '../src/game/world/roomMap';

describe('카탈로그', () => {
  it('무결성 검증을 통과한다 (id 중복·크기·색 형식)', () => {
    expect(validateCatalog(CATALOG)).toBe(true);
    expect(CATALOG.length).toBeGreaterThanOrEqual(16);
  });
});

describe('roomMap', () => {
  it('문 타일은 통행 가능, 나머지 하단 벽은 막힌다', () => {
    const g = buildRoomCollision();
    expect(g.isSolid(ROOM_DOOR.tx, ROOM_DOOR.ty)).toBe(false);
    expect(g.isSolid(ROOM_DOOR.tx - 1, ROOM_H - 1)).toBe(true);
    expect(g.isSolid(0, 5)).toBe(true);
    expect(g.isSolid(ROOM_W - 1, 5)).toBe(true);
    expect(g.isSolid(ROOM_SPAWN.tx, ROOM_SPAWN.ty)).toBe(false);
  });
});

describe('placement', () => {
  it('회전하면 w·h가 스왑된다', () => {
    expect(sizeOf('bed_basic', 0)).toEqual({ w: 2, h: 3 });
    expect(sizeOf('bed_basic', 1)).toEqual({ w: 3, h: 2 });
    expect(sizeOf('unknown', 0)).toBeNull();
  });

  it('footprint는 점유 타일 전체를 돌려준다', () => {
    const tiles = footprint({ itemId: 'desk_wood', tx: 2, ty: 3, rot: 0 }); // 2x1
    expect(tiles).toEqual([{ tx: 2, ty: 3 }, { tx: 3, ty: 3 }]);
  });

  it('바닥 안이고 겹치지 않으면 배치 가능하다', () => {
    expect(canPlace([], 'bed_basic', 1, 1, 0)).toBe(true);
  });

  it('벽(경계 밖)에는 배치할 수 없다', () => {
    expect(canPlace([], 'chair_wood', 0, 1, 0)).toBe(false);          // 왼쪽 벽
    expect(canPlace([], 'bed_basic', 10, 1, 0)).toBe(false);          // 오른쪽 벽 침범 (10+2 > 11)
    expect(canPlace([], 'bed_basic', 1, 7, 0)).toBe(false);           // 아래 벽 침범 (7+3 > 9)
    expect(canPlace([], 'bed_basic', 1, 6, 1)).toBe(true);            // 회전(3x2)하면 들어감
  });

  it('기존 배치와 겹치면 불가, 옆 칸은 가능하다', () => {
    const placed: Placed[] = [{ id: 'p1', itemId: 'rug_cream', tx: 3, ty: 3, rot: 0 }]; // 3x2 → (3..5, 3..4)
    expect(canPlace(placed, 'chair_wood', 4, 4, 0)).toBe(false);
    expect(canPlace(placed, 'chair_wood', 6, 4, 0)).toBe(true);
  });
});
