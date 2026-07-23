import { beforeEach, describe, expect, it } from 'vitest';
import {
  GARDEN_PLOT_COUNT, GARDEN_SEEDS, GARDEN_VARIANTS, freshGardenState, gardenProgress,
  gardenSeedUnlocked, harvestGardenPlot, normalizeGardenState, plantGardenPlot, tendGardenPlot,
} from '../src/game/garden/garden';
import { GardenStore } from '../src/game/garden/gardenStore';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function growAndHarvest(state: ReturnType<typeof freshGardenState>, plotIndex = 0) {
  for (let step = 0; step < 3; step += 1) expect(tendGardenPlot(state, plotIndex).ok).toBe(true);
  return harvestGardenPlot(state, plotIndex);
}

describe('옥상 씨앗 연구소', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('4화분·12식물·3성장 결로 36칸 표본 목표를 만든다', () => {
    const state = freshGardenState();
    expect(state.plots).toHaveLength(GARDEN_PLOT_COUNT);
    expect(GARDEN_SEEDS).toHaveLength(12);
    expect(GARDEN_VARIANTS).toHaveLength(3);
    expect(gardenProgress(state).totalSpecimens).toBe(36);
    expect(new Set(GARDEN_SEEDS.map((seed) => seed.id)).size).toBe(12);
  });

  it('초기 세 종만 열리고 수확 기록에 따라 새 씨앗이 열린다', () => {
    const state = freshGardenState();
    expect(GARDEN_SEEDS.filter((seed) => gardenSeedUnlocked(state, seed.id)).map((seed) => seed.id)).toEqual(['basil', 'pansy', 'mint']);
    expect(plantGardenPlot(state, 0, 'rosemary')).toEqual({ ok: false, reason: 'locked-seed' });
    expect(plantGardenPlot(state, 0, 'basil').ok).toBe(true);
    const harvested = growAndHarvest(state);
    expect(harvested).toMatchObject({ ok: true, kind: 'harvested', newlyUnlocked: ['rosemary'] });
    expect(state.seedPackets.rosemary).toBe(1);
  });

  it('심기 비용 1봉투를 쓰고 수확 때 같은 씨앗 2봉투를 돌려준다', () => {
    const state = freshGardenState();
    expect(state.seedPackets.basil).toBe(2);
    expect(plantGardenPlot(state, 0, 'basil').ok).toBe(true);
    expect(state.seedPackets.basil).toBe(1);
    expect(tendGardenPlot(state, 0)).toMatchObject({ ok: true, kind: 'tended', plot: { stage: 1 } });
    expect(harvestGardenPlot(state, 0)).toEqual({ ok: false, reason: 'not-ready' });
    expect(tendGardenPlot(state, 0).ok).toBe(true);
    expect(tendGardenPlot(state, 0).ok).toBe(true);
    expect(tendGardenPlot(state, 0)).toEqual({ ok: false, reason: 'already-ready' });
    expect(harvestGardenPlot(state, 0).ok).toBe(true);
    expect(state.seedPackets.basil).toBe(3);
    expect(state.ingredients['basil:sun']).toBe(1);
    expect(gardenProgress(state).pantryIngredients).toBe(1);
  });

  it('같은 식물을 반복하면 햇살·빗방울·달그늘 표본이 순환한다', () => {
    const state = freshGardenState();
    for (let cycle = 0; cycle < 3; cycle += 1) {
      expect(plantGardenPlot(state, 0, 'basil').ok).toBe(true);
      expect(growAndHarvest(state).ok).toBe(true);
    }
    expect(new Set(state.specimens)).toEqual(new Set(['basil:sun', 'basil:rain', 'basil:moon']));
    expect(gardenProgress(state)).toMatchObject({ totalHarvests: 3, speciesDiscovered: 1, specimensDiscovered: 3 });
  });

  it('손상된 화분·표본·수량은 버리거나 안전한 범위로 정규화한다', () => {
    const state = normalizeGardenState({
      plots: [
        { seedId: 'fake', variantId: 'sun', stage: 3 },
        { seedId: 'mint', variantId: 'rain', stage: 99 },
      ],
      seedPackets: { basil: 9.8, mint: -3, moon_orchid: 5000 },
      ingredients: { 'basil:sun': 2.9, 'mint:fake': 8, 'fake:moon': 4 },
      specimens: ['mint:rain', 'mint:rain', 'fake:moon', 4],
      claimedUnlocks: ['fake'], totalHarvests: 30.9, totalTends: -2,
    });
    expect(state.plots[0]).toBeNull();
    expect(state.plots[1]).toMatchObject({ seedId: 'mint', variantId: 'rain', stage: 3 });
    expect(state.seedPackets).toMatchObject({ basil: 9, mint: 1, moon_orchid: 999 });
    expect(state.specimens).toEqual(['mint:rain']);
    expect(state.ingredients).toEqual({ 'basil:sun': 2 });
    expect(state.totalHarvests).toBe(30);
    expect(state.claimedUnlocks).toHaveLength(12);
  });

  it('사용자별 저장을 다시 열어도 성장 단계와 누적 기록을 보존한다', () => {
    const first = new GardenStore('keeper');
    first.plant(2, 'pansy');
    first.tend(2);
    const reopened = new GardenStore('keeper');
    expect(reopened.get().plots[2]).toMatchObject({ seedId: 'pansy', stage: 1 });
    expect(reopened.progress()).toMatchObject({ planted: 1, totalPlanted: 1, totalTends: 1 });
    expect(new GardenStore('neighbor').progress().totalPlanted).toBe(0);
  });
});
