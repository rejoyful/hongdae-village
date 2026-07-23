import { describe, it, expect } from 'vitest';
import { CATALOG, validateCatalog } from '../src/items/catalog';
import {
  blockingTiles, canPlace, footprint, layerOf, nextRot, normalizeRot, sizeOf, type Placed,
} from '../src/game/entities/placement';
import { buildRoomCollision, ROOM_DOOR, ROOM_SPAWN, ROOM_W, ROOM_H, FLOOR } from '../src/game/world/roomMap';

describe('카탈로그', () => {
  it('무결성 검증을 통과한다 (id 중복·크기·색·카테고리·아키타입)', () => {
    expect(validateCatalog(CATALOG)).toBe(true);
    expect(CATALOG.length).toBeGreaterThanOrEqual(60);
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
  it('4방향 중 홀수 방향만 w·h가 스왑된다 (벽걸이는 회전 무시)', () => {
    expect(sizeOf('bed_basic', 0)).toEqual({ w: 2, h: 3 });
    expect(sizeOf('bed_basic', 1)).toEqual({ w: 3, h: 2 });
    expect(sizeOf('bed_basic', 2)).toEqual({ w: 2, h: 3 });
    expect(sizeOf('bed_basic', 3)).toEqual({ w: 3, h: 2 });
    expect(sizeOf('neon_sign', 1)).toEqual({ w: 2, h: 1 }); // wall: rot 무시
    expect(sizeOf('unknown', 0)).toBeNull();
  });

  it('바닥 가구는 북→동→남→서로 돌고 벽장식은 방향을 고정한다', () => {
    expect(nextRot(0, 'chair_wood')).toBe(1);
    expect(nextRot(1, 'chair_wood')).toBe(2);
    expect(nextRot(2, 'chair_wood')).toBe(3);
    expect(nextRot(3, 'chair_wood')).toBe(0);
    expect(nextRot(0, 'poster_band')).toBe(0);
    expect(normalizeRot(3)).toBe(3);
    expect(normalizeRot(8)).toBe(0);
  });

  it('레이어 분류: 러그/벽걸이/바닥', () => {
    expect(layerOf('rug_cream')).toBe('rug');
    expect(layerOf('poster_band')).toBe('wall');
    expect(layerOf('bed_basic')).toBe('floor');
  });

  it('footprint는 점유 타일 전체를 돌려준다', () => {
    const tiles = footprint({ itemId: 'desk_wood', tx: 2, ty: 3, rot: 0 }); // 2x1
    expect(tiles).toEqual([{ tx: 2, ty: 3 }, { tx: 3, ty: 3 }]);
  });

  it('바닥 안이고 겹치지 않으면 배치 가능하다', () => {
    expect(canPlace([], 'bed_basic', 1, 1, 0)).toBe(true);
  });

  it('벽(경계 밖)에는 배치할 수 없다', () => {
    expect(canPlace([], 'chair_wood', 0, 1, 0)).toBe(false);
    expect(canPlace([], 'bed_basic', 10, 1, 0)).toBe(false);
    expect(canPlace([], 'bed_basic', 1, 7, 0)).toBe(false);
    expect(canPlace([], 'bed_basic', 1, 6, 1)).toBe(true); // 회전(3x2)하면 들어감
  });

  it('같은 레이어(바닥)끼리 겹치면 불가, 옆 칸은 가능하다', () => {
    const placed: Placed[] = [{ id: 'p1', itemId: 'dining_table', tx: 3, ty: 3, rot: 0 }]; // 2x2
    expect(canPlace(placed, 'chair_wood', 4, 4, 0)).toBe(false);
    expect(canPlace(placed, 'chair_wood', 5, 4, 0)).toBe(true);
  });

  it('러그 위에는 가구를 겹쳐 놓을 수 있다 (레이어 분리)', () => {
    const placed: Placed[] = [{ id: 'r1', itemId: 'rug_cream', tx: 3, ty: 3, rot: 0 }]; // rug 3x2
    expect(canPlace(placed, 'chair_wood', 4, 4, 0)).toBe(true);   // 러그 위 의자 OK
    expect(canPlace(placed, 'rug_round', 4, 3, 0)).toBe(false);   // 러그끼리는 불가
  });

  it('벽걸이는 벽 행(FLOOR.y)에만 붙는다', () => {
    expect(canPlace([], 'poster_band', 3, FLOOR.y, 0)).toBe(true);
    expect(canPlace([], 'poster_band', 3, FLOOR.y + 2, 0)).toBe(false);
    const placed: Placed[] = [{ id: 'w1', itemId: 'poster_band', tx: 3, ty: FLOOR.y, rot: 0 }];
    expect(canPlace(placed, 'wall_clock', 3, FLOOR.y, 0)).toBe(false); // 벽걸이끼리 겹침 불가
    expect(canPlace(placed, 'chair_wood', 3, FLOOR.y, 0)).toBe(true);  // 바닥 가구는 그 아래 OK
  });

  it('이동 충돌 타일은 바닥 가구만 중복 없이 반환한다', () => {
    const placed: Placed[] = [
      { id: 'desk', itemId: 'desk_wood', tx: 2, ty: 3, rot: 0 },
      { id: 'chair', itemId: 'chair_wood', tx: 3, ty: 3, rot: 2 },
      { id: 'rug', itemId: 'rug_cream', tx: 2, ty: 3, rot: 0 },
      { id: 'wall', itemId: 'poster_band', tx: 2, ty: 1, rot: 0 },
    ];
    expect(blockingTiles(placed)).toEqual([{ tx: 2, ty: 3 }, { tx: 3, ty: 3 }]);
  });
});
