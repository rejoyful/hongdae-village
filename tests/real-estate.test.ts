import { describe, it, expect } from 'vitest';
import {
  HOUSE_SPECS, generateFloorPlan, isPlaceableTile, rentPeriods,
  type HouseType,
} from '../src/game/realestate/realEstate';
import { CollisionGrid } from '../src/game/world/grid';

const TYPES: HouseType[] = ['banjiha', 'oneroom', 'villa', 'apt', 'house'];

describe('주택 시세', () => {
  it('유형이 커질수록 시세가 오른다 (전세·매매 단조 증가)', () => {
    for (let i = 1; i < TYPES.length; i++) {
      const a = HOUSE_SPECS[TYPES[i - 1]!], b = HOUSE_SPECS[TYPES[i]!];
      expect(b.jeonseDeposit).toBeGreaterThan(a.jeonseDeposit);
      expect(b.price).toBeGreaterThan(a.price);
      expect(b.rooms).toBeGreaterThanOrEqual(a.rooms);
    }
  });
  it('전세금 > 월세보증금, 매매가 > 전세금 (실제 구조)', () => {
    for (const t of TYPES) {
      const s = HOUSE_SPECS[t];
      expect(s.jeonseDeposit).toBeGreaterThan(s.wolseDeposit);
      expect(s.price).toBeGreaterThan(s.jeonseDeposit);
    }
  });
});

describe('평면 생성', () => {
  it('결정론적 — 같은 유형·시드면 동일 평면', () => {
    const a = generateFloorPlan('apt', 7);
    const b = generateFloorPlan('apt', 7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('방 개수만큼 구획이 생기고, 문·스폰이 유효하다', () => {
    for (const t of TYPES) {
      const spec = HOUSE_SPECS[t];
      const plan = generateFloorPlan(t, 42);
      expect(plan.w).toBe(spec.w);
      expect(plan.h).toBe(spec.h);
      expect(plan.rooms.length).toBe(spec.rooms);
      expect(plan.door.ty).toBe(spec.h - 1);
      expect(isPlaceableTile(plan, plan.spawn.tx, plan.spawn.ty)).toBe(true);
    }
  });

  it('칸막이 통로(doorGaps)가 실제로 통행 가능해 방들이 연결된다', () => {
    for (const t of ['villa', 'apt', 'house'] as HouseType[]) {
      const plan = generateFloorPlan(t, 3);
      const grid = CollisionGrid.fromRects(plan.w, plan.h, [
        { x: 0, y: 0, w: plan.w, h: 1 },
        { x: 0, y: plan.h - 1, w: plan.door.tx, h: 1 },
        { x: plan.door.tx + 1, y: plan.h - 1, w: plan.w - plan.door.tx - 1, h: 1 },
        { x: 0, y: 0, w: 1, h: plan.h },
        { x: plan.w - 1, y: 0, w: 1, h: plan.h },
        ...plan.walls,
      ], plan.doorGaps);
      // 스폰에서 BFS로 모든 구획 대표 타일에 도달 가능해야 (고립된 방 없음)
      const reachable = bfs(grid, plan.w, plan.h, plan.spawn);
      for (const rm of plan.rooms) {
        const center = { tx: Math.floor(rm.rect.x + rm.rect.w / 2), ty: Math.floor(rm.rect.y + rm.rect.h / 2) };
        // 구획 안에서 도달 가능한 타일이 하나라도 있어야
        let ok = false;
        for (let dy = 0; dy < rm.rect.h && !ok; dy++)
          for (let dx = 0; dx < rm.rect.w && !ok; dx++)
            if (reachable.has(`${rm.rect.x + dx},${rm.rect.y + dy}`)) ok = true;
        expect(ok, `${t} ${rm.name} 고립 (center ${center.tx},${center.ty})`).toBe(true);
      }
    }
  });

  it('내부 칸막이 타일엔 배치 불가, 통로·바닥엔 가능', () => {
    const plan = generateFloorPlan('villa', 5);
    const wall = plan.walls[0]!;
    const solidTile = { tx: wall.x, ty: wall.y };
    const isGap = plan.doorGaps.some((g) => g.tx === solidTile.tx && g.ty === solidTile.ty);
    if (!isGap) expect(isPlaceableTile(plan, solidTile.tx, solidTile.ty)).toBe(false);
    for (const g of plan.doorGaps) expect(isPlaceableTile(plan, g.tx, g.ty)).toBe(true);
  });
});

describe('월세 청구 주기 (서울 자정)', () => {
  it('같은 날은 0회, 하루 뒤는 1회', () => {
    const base = new Date('2026-07-22T02:00:00Z'); // KST 11:00
    expect(rentPeriods('2026-07-22T00:00:00Z', base)).toBe(0);
    expect(rentPeriods('2026-07-21T02:00:00Z', base)).toBe(1);
    expect(rentPeriods('2026-07-19T02:00:00Z', base)).toBe(3);
  });
});

function bfs(grid: CollisionGrid, w: number, h: number, start: { tx: number; ty: number }): Set<string> {
  const seen = new Set<string>();
  const q = [start];
  seen.add(`${start.tx},${start.ty}`);
  while (q.length) {
    const c = q.shift()!;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
      const nx = c.tx + dx, ny = c.ty + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(k) || grid.isSolid(nx, ny)) continue;
      seen.add(k); q.push({ tx: nx, ty: ny });
    }
  }
  return seen;
}
