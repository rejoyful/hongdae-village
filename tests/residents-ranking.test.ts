import { describe, it, expect } from 'vitest';
import {
  RESIDENTS, applyGreeting, trustOf, metCount, TRUST_GAIN, TRUST_MAX,
} from '../src/game/residents/residents';
import { computePoints, assignRanks } from '../src/game/ranking';
import { buildCollision, SOLID_RECTS } from '../src/game/world/mapData';

describe('주민 신뢰도', () => {
  it('같은 날 인사는 한 번만 +15', () => {
    let s = applyGreeting({}, 'haneul', '2026-07-21');
    expect(s.gained).toBe(true);
    expect(trustOf(s.state, 'haneul')).toBe(TRUST_GAIN);
    const again = applyGreeting(s.state, 'haneul', '2026-07-21');
    expect(again.gained).toBe(false);
    expect(trustOf(again.state, 'haneul')).toBe(TRUST_GAIN);
  });

  it('다음 날 인사는 다시 오르고 100에서 캡', () => {
    let state = {};
    for (let d = 1; d <= 9; d++) {
      state = applyGreeting(state, 'imo', `2026-07-${String(d).padStart(2, '0')}`).state;
    }
    expect(trustOf(state, 'imo')).toBe(TRUST_MAX);
  });

  it('만난 주민 수를 센다', () => {
    const s = applyGreeting({}, RESIDENTS[0]!.id, '2026-07-21').state;
    expect(metCount(s)).toBe(1);
    expect(metCount({})).toBe(0);
  });

  it('주민 로스터는 id 중복이 없고 통행 가능한 타일에 선다', () => {
    const grid = buildCollision();
    const ids = new Set(RESIDENTS.map((r) => r.id));
    expect(ids.size).toBe(RESIDENTS.length);
    for (const r of RESIDENTS) {
      expect(grid.isSolid(r.tile.tx, r.tile.ty), `${r.name} @${r.tile.tx},${r.tile.ty}`).toBe(false);
    }
  });
});

describe('생활 포인트·랭킹', () => {
  it('가산값 공식: 하트×5% + 도감×1% + 신뢰도÷50%', () => {
    const p = computePoints(1000, 2, 10, 100);
    expect(p.base).toBe(1000);
    expect(p.heartPct).toBe(10);
    expect(p.dexPct).toBe(10);
    expect(p.trustPct).toBe(2);
    expect(p.total).toBe(1220); // 1000 × 1.22
  });

  it('활동이 없으면 포인트 = 코인', () => {
    expect(computePoints(500, 0, 0, 0).total).toBe(500);
  });

  it('랭킹은 코인 내림차순, 동점은 같은 순위', () => {
    const rows = assignRanks([
      { userId: 'a', nickname: 'A', coins: 100 },
      { userId: 'b', nickname: 'B', coins: 300 },
      { userId: 'c', nickname: 'C', coins: 300 },
      { userId: 'd', nickname: 'D', coins: 50 },
    ]);
    expect(rows.map((r) => [r.userId, r.rank])).toEqual([
      ['b', 1], ['c', 1], ['a', 3], ['d', 4],
    ]);
  });
});

describe('맵 데이터 회귀', () => {
  it('SOLID_RECTS 브랜드 상가 4곳 인덱스(19~22)가 유지된다', () => {
    expect(SOLID_RECTS.length).toBe(23);
  });
});
