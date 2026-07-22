import { describe, it, expect } from 'vitest';
import { COMPANIES, isCompanyFloorWalkable, type CompanyFloor } from '../src/game/company/company';
import { CollisionGrid } from '../src/game/world/grid';

describe('회사 건물 3동', () => {
  it('3개 빌딩이 이름·소속대로 존재한다', () => {
    expect(COMPANIES.forest.name).toBe('마인드 포레스트');
    expect(COMPANIES.forest.org).toBe('인싸이트');
    expect(COMPANIES.world.name).toBe('마인드 월드');
    expect(COMPANIES.world.org).toBe('학지사');
    expect(COMPANIES.bridge.name).toBe('마인드 브릿지');
    expect(COMPANIES.bridge.org).toBe('학지사 에듀');
  });

  it('마인드 포레스트·월드 모두 6층까지 있다', () => {
    expect(COMPANIES.forest.floors.map((f) => f.level)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(COMPANIES.world.floors.map((f) => f.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('엘리베이터는 1~5층만, 6층은 계단으로만 오간다', () => {
    for (const c of [COMPANIES.forest, COMPANIES.world]) {
      for (const f of c.floors) {
        if (f.level <= 5) expect(f.elevator, `${c.name} ${f.level}층 엘베`).toBeDefined();
        else expect(f.elevator, `${c.name} 6층 엘베 없어야`).toBeUndefined();
      }
      // 5층엔 6층행 계단(up), 6층엔 5층행 계단(down)
      expect(c.floors[4]!.up, `${c.name} 5층 up`).toBeDefined();
      expect(c.floors[5]!.down, `${c.name} 6층 down`).toBeDefined();
    }
  });

  it('6층은 AX기획실, 병렬 회의실 3개(입구부터 에너지·시너지·라운지)', () => {
    const f6 = COMPANIES.forest.floors[5]!;
    expect(f6.name).toBe('AX기획실');
    expect(f6.meetings.map((m) => m.name)).toEqual(['에너지룸', '시너지룸', '라운지룸']);
  });

  it('6층 AX기획실에 정확히 14명이 근무한다', () => {
    const f6 = COMPANIES.forest.floors[5]!;
    expect(f6.npcs.length).toBe(14);
  });

  it('모든 층: 사람·스팟·계단·회의실문이 벽과 겹치지 않고 통행 가능', () => {
    const bad: string[] = [];
    for (const c of Object.values(COMPANIES)) {
      for (const f of c.floors) {
        const check = (tx: number, ty: number, what: string) => {
          if (!isCompanyFloorWalkable(f, tx, ty)) bad.push(`${c.name} ${f.level}층 ${what}(${tx},${ty})`);
        };
        for (const n of f.npcs) check(n.tx, n.ty, `npc ${n.name}`);
        for (const s of f.spots) check(s.tx, s.ty, `spot ${s.label}`);
        for (const m of f.meetings) check(m.door.tx, m.door.ty, `meeting ${m.name} door`);
        if (f.up) check(f.up.tx, f.up.ty, 'up-stair');
        if (f.down) check(f.down.tx, f.down.ty, 'down-stair');
        if (f.elevator) check(f.elevator.tx, f.elevator.ty, 'elevator');
        if (f.clockDesk) check(f.clockDesk.tx, f.clockDesk.ty, 'clock-desk');
        if (f.draftDesk) check(f.draftDesk.tx, f.draftDesk.ty, 'draft-desk');
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('각 층 스폰(하단 중앙)에서 모든 스팟에 도달 가능 (고립 없음)', () => {
    const bad: string[] = [];
    for (const c of Object.values(COMPANIES)) {
      for (const f of c.floors) {
        const grid = floorGrid(f);
        const spawn = { tx: Math.floor(f.w / 2), ty: f.h - 2 };
        const reach = bfs(grid, f.w, f.h, spawn);
        for (const s of f.spots) {
          if (!reach.has(`${s.tx},${s.ty}`)) bad.push(`${c.name} ${f.level}층 ${s.label} 고립`);
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

function floorGrid(f: CompanyFloor): CollisionGrid {
  const doorTx = Math.floor(f.w / 2);
  return CollisionGrid.fromRects(f.w, f.h, [
    { x: 0, y: 0, w: f.w, h: 1 },
    { x: 0, y: f.h - 1, w: doorTx, h: 1 },
    { x: doorTx + 1, y: f.h - 1, w: f.w - doorTx - 1, h: 1 },
    { x: 0, y: 0, w: 1, h: f.h },
    { x: f.w - 1, y: 0, w: 1, h: f.h },
    ...f.solids,
  ], f.meetings.map((m) => m.door));
}

function bfs(grid: CollisionGrid, w: number, h: number, start: { tx: number; ty: number }): Set<string> {
  const seen = new Set([`${start.tx},${start.ty}`]);
  const q = [start];
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
