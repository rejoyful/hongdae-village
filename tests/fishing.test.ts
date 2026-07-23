import { beforeEach, describe, expect, it } from 'vitest';
import {
  FISHING_SPECIES, FISHING_WATERS, catchFish, fishingProgress, freshFishingState,
  normalizeFishingState,
} from '../src/game/fishing/fishing';
import { FishingStore } from '../src/game/fishing/fishingStore';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('친절한 물정원 낚시', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('세 물가에 6종씩 총 18종과 54개 크기 도장이 있다', () => {
    expect(FISHING_WATERS).toHaveLength(3);
    expect(FISHING_SPECIES).toHaveLength(18);
    for (const water of FISHING_WATERS) {
      expect(FISHING_SPECIES.filter((fish) => fish.waterId === water.id)).toHaveLength(6);
    }
    expect(fishingProgress(freshFishingState())).toMatchObject({ totalSpecies: 18, totalStamps: 54 });
  });

  it('어떤 매듭을 골라도 한 물가의 첫 여섯 번은 모두 새로운 생물이다', () => {
    const state = freshFishingState();
    const ids = Array.from({ length: 6 }, () => catchFish(state, 'rail_garden', 'crumb'));
    expect(ids.every((result) => result.firstCatch)).toBe(true);
    expect(new Set(ids.map((result) => result.fishId)).size).toBe(6);
    expect(fishingProgress(state).speciesDiscovered).toBe(6);
  });

  it('중복 낚시는 항상 최고 크기를 키우고 세 번째 만남에 금빛 도장을 준다', () => {
    const state = freshFishingState();
    let target = catchFish(state, 'moon_channel', 'glimmer');
    const fishId = target.fishId;
    while (state.records[fishId]!.catches < 3) {
      const next = catchFish(state, 'moon_channel', 'glimmer');
      if (next.fishId === fishId) {
        expect(next.sizeCm).toBeGreaterThan(target.sizeCm);
        target = next;
      }
    }
    expect(state.records[fishId]).toMatchObject({ catches: 3, rank: 'gold' });
  });

  it('금빛 기준 뒤의 중복도 0.1cm 이상 계속 기록을 갱신한다', () => {
    const state = freshFishingState();
    for (let i = 0; i < 18; i += 1) catchFish(state, 'rooftop_reservoir', 'herb');
    const before = Object.fromEntries(Object.entries(state.records).map(([id, record]) => [id, record.maxSizeCm]));
    for (let i = 0; i < 6; i += 1) catchFish(state, 'rooftop_reservoir', 'herb');
    for (const [id, size] of Object.entries(before)) expect(state.records[id]!.maxSizeCm).toBeGreaterThan(size);
  });

  it('손상된 저장값을 정리하고 사용자별 기록을 다시 불러온다', () => {
    const clean = normalizeFishingState({
      totalCatches: -3,
      records: { rail_minnow: { catches: 2.9, maxSizeCm: 9.1, rank: 'hacked' }, unknown: { catches: 5, maxSizeCm: 99 } },
      lastCatch: { fishId: 'unknown', waterId: 'rail_garden', lureId: 'crumb', sizeCm: 99 },
    });
    expect(clean.totalCatches).toBe(2);
    expect(clean.records.rail_minnow).toMatchObject({ catches: 2 });
    expect(clean.records.unknown).toBeUndefined();
    expect(clean.lastCatch).toBeNull();

    const first = new FishingStore('angler');
    first.cast('rail_garden', 'crumb');
    const restored = new FishingStore('angler');
    expect(restored.progress()).toMatchObject({ totalCatches: 1, speciesDiscovered: 1, recordStamps: 1 });
    expect(new FishingStore('neighbor').progress().totalCatches).toBe(0);
  });
});
