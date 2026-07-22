import { describe, it, expect } from 'vitest';
import {
  TREASURES, normalizeTreasure, collectSpot, craftTreasure, collectionProgress,
  freshState, STREET_SPARKLES, FOREST_SPARKLES, type SparkleSpot,
} from '../src/game/treasure/treasures';
import { buildCollision } from '../src/game/world/mapData';
import { COMPANIES } from '../src/game/company/company';
import { CollisionGrid } from '../src/game/world/grid';

const TODAY = '2026-07-22';

describe('트레저 컬렉션', () => {
  it('12종이 희귀도별로 구성되고, 희귀할수록 조각이 많다', () => {
    expect(TREASURES.length).toBe(12);
    const order = { common: 0, rare: 1, epic: 2, legendary: 3 } as const;
    for (let i = 1; i < TREASURES.length; i++) {
      // 대체로 뒤로 갈수록 희귀·조각↑ (엄격 단조는 아니고 그룹 내 동률 허용)
      expect(order[TREASURES[i]!.rarity]).toBeGreaterThanOrEqual(order[TREASURES[i - 1]!.rarity]);
    }
    const leg = TREASURES.filter((t) => t.rarity === 'legendary');
    const com = TREASURES.filter((t) => t.rarity === 'common');
    expect(Math.min(...leg.map((t) => t.shards))).toBeGreaterThan(Math.max(...com.map((t) => t.shards)));
  });

  it('모든 보물에 이름·설명(소장 가치)이 있다', () => {
    for (const t of TREASURES) {
      expect(t.name.length).toBeGreaterThan(1);
      expect(t.lore.length).toBeGreaterThan(10);
    }
  });
});

describe('채집·제작·리셋', () => {
  it('같은 스팟은 하루 한 번만 조각을 준다', () => {
    let s = freshState(TODAY);
    const spot = STREET_SPARKLES[0]!;
    const r1 = collectSpot(s, spot);
    expect(r1.gained).toBe(spot.shards);
    s = r1.state;
    const r2 = collectSpot(s, spot);
    expect(r2.gained).toBe(0);
  });

  it('날이 바뀌면 스팟은 리셋되지만 조각·보물은 유지된다', () => {
    const stale = { day: '2026-07-21', shards: 10, found: ['s-forest1'], crafted: { dewdrop: 2 } };
    const s = normalizeTreasure(stale, TODAY);
    expect(s.found).toEqual([]);       // 스팟 리셋
    expect(s.shards).toBe(10);         // 조각 유지
    expect(s.crafted.dewdrop).toBe(2); // 보물 유지
  });

  it('조각이 충분해야 제작되고, 제작 시 조각이 소모된다', () => {
    let s = { ...freshState(TODAY), shards: 5 };
    const cheap = TREASURES.find((t) => t.shards <= 5)!;
    const r = craftTreasure(s, cheap.id);
    expect(r.ok).toBe(true);
    if (r.ok) { s = r.state; expect(s.shards).toBe(5 - cheap.shards); expect(s.crafted[cheap.id]).toBe(1); }
    // 조각 0이면 전설 제작 불가
    const fail = craftTreasure({ ...freshState(TODAY), shards: 0 }, 'forestheart');
    expect(fail.ok).toBe(false);
  });

  it('도감 진행은 제작한 종류 수를 센다', () => {
    let s = { ...freshState(TODAY), shards: 100 };
    expect(collectionProgress(s).owned).toBe(0);
    s = (craftTreasure(s, 'dewdrop') as { ok: true; state: typeof s }).state;
    s = (craftTreasure(s, 'clover') as { ok: true; state: typeof s }).state;
    expect(collectionProgress(s).owned).toBe(2);
    expect(collectionProgress(s).total).toBe(12);
  });
});

describe('반짝이 스팟 배치 정합성', () => {
  it('거리 스팟은 통행 가능한 타일에 있다', () => {
    const grid = buildCollision();
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const s of STREET_SPARKLES) {
      if (grid.isSolid(s.tx, s.ty)) bad.push(`${s.id} @${s.tx},${s.ty} 막힘`);
      const k = `${s.tx},${s.ty}`;
      if (seen.has(k)) bad.push(`${s.id} 좌표 중복`);
      seen.add(k);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('포레스트 층별 스팟은 그 층에서 통행 가능하다', () => {
    const bad: string[] = [];
    for (const [lvlStr, spots] of Object.entries(FOREST_SPARKLES)) {
      const f = COMPANIES.forest.floors.find((fl) => fl.level === Number(lvlStr))!;
      const doorTx = Math.floor(f.w / 2);
      const grid = CollisionGrid.fromRects(f.w, f.h, [
        { x: 0, y: 0, w: f.w, h: 1 },
        { x: 0, y: f.h - 1, w: doorTx, h: 1 },
        { x: doorTx + 1, y: f.h - 1, w: f.w - doorTx - 1, h: 1 },
        { x: 0, y: 0, w: 1, h: f.h },
        { x: f.w - 1, y: 0, w: 1, h: f.h },
        ...f.solids,
      ], f.meetings.map((m) => m.door));
      for (const s of spots as SparkleSpot[]) {
        if (grid.isSolid(s.tx, s.ty)) bad.push(`포레스트 ${lvlStr}층 ${s.id} @${s.tx},${s.ty} 막힘`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
