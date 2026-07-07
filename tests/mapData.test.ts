import { describe, it, expect } from 'vitest';
import { ZONES, buildCollision, SPAWN_TILE } from '../src/game/world/mapData';
import { MAP_W, MAP_H } from '../src/game/config';

describe('시즌1 블록아웃', () => {
  it('스펙 §2의 7개 구역이 모두 존재한다', () => {
    const names = ZONES.map((z) => z.name);
    for (const required of ['경의선 숲길', '주택 골목 (서)', '주택 골목 (동)', '메인 스트리트', '포차 골목', '홍대입구역 9번 출구', '벽화 골목']) {
      expect(names).toContain(required);
    }
  });

  it('모든 존은 맵 범위 안에 있다', () => {
    for (const z of ZONES) {
      expect(z.rect.x).toBeGreaterThanOrEqual(0);
      expect(z.rect.y).toBeGreaterThanOrEqual(0);
      expect(z.rect.x + z.rect.w).toBeLessThanOrEqual(MAP_W);
      expect(z.rect.y + z.rect.h).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('스폰 지점(역 광장)은 통행 가능하다', () => {
    const grid = buildCollision();
    expect(grid.isSolid(SPAWN_TILE.tx, SPAWN_TILE.ty)).toBe(false);
  });

  it('맵 테두리는 벽이다', () => {
    const grid = buildCollision();
    expect(grid.isSolid(0, 30)).toBe(true);
    expect(grid.isSolid(MAP_W - 1, 30)).toBe(true);
    expect(grid.isSolid(40, 0)).toBe(true);
    expect(grid.isSolid(40, MAP_H - 1)).toBe(true);
  });
});
