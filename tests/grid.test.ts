import { describe, it, expect } from 'vitest';
import { tileToWorld, worldToTile, CollisionGrid, type Rect } from '../src/game/world/grid';

describe('tile/world 변환', () => {
  it('타일 좌표를 월드 픽셀(타일 좌상단)로 변환한다', () => {
    expect(tileToWorld(0, 0)).toEqual({ x: 0, y: 0 });
    expect(tileToWorld(3, 2)).toEqual({ x: 96, y: 64 });
  });

  it('월드 픽셀을 타일 좌표로 변환한다 (내림)', () => {
    expect(worldToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
    expect(worldToTile(95.9, 64)).toEqual({ tx: 2, ty: 2 });
  });
});

describe('CollisionGrid', () => {
  const rects: Rect[] = [{ x: 2, y: 2, w: 3, h: 2 }]; // 타일 (2,2)~(4,3) 솔리드
  const grid = CollisionGrid.fromRects(10, 8, rects);

  it('사각형 내부는 솔리드다', () => {
    expect(grid.isSolid(2, 2)).toBe(true);
    expect(grid.isSolid(4, 3)).toBe(true);
  });

  it('사각형 밖은 통행 가능하다', () => {
    expect(grid.isSolid(1, 2)).toBe(false);
    expect(grid.isSolid(5, 3)).toBe(false);
  });

  it('맵 밖은 항상 솔리드다', () => {
    expect(grid.isSolid(-1, 0)).toBe(true);
    expect(grid.isSolid(10, 0)).toBe(true);
    expect(grid.isSolid(0, 8)).toBe(true);
  });

  it('월드 좌표(픽셀)로도 질의할 수 있다', () => {
    expect(grid.isSolidAtWorld(2 * 32 + 1, 2 * 32 + 1)).toBe(true);
    expect(grid.isSolidAtWorld(0, 0)).toBe(false);
  });
});
