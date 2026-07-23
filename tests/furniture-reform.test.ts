import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import {
  FURNITURE_COLORS, FURNITURE_FINISHES, FurnitureReformStore, freshFurnitureReformState,
  furnitureColorViews, furnitureFinishViews, furnitureReformProgress, isReformableFurniture,
  normalizeFurnitureReformState,
} from '../src/game/home/furnitureReform';

class MemStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

const quests = () => normalizeState(null, '2026-07-23');

describe('가구 리폼 공방', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('6마감 × 8색감으로 48개 조합을 제공한다', () => {
    expect(FURNITURE_FINISHES).toHaveLength(6);
    expect(FURNITURE_COLORS).toHaveLength(8);
    expect(new Set(FURNITURE_FINISHES.map((item) => item.id)).size).toBe(6);
    expect(new Set(FURNITURE_COLORS.map((item) => item.id)).size).toBe(8);
    expect(furnitureReformProgress(freshFurnitureReformState()).totalCombinations).toBe(48);
  });

  it('가구·가전·소품·러그·벽장식만 리폼하고 식물과 어항은 보존한다', () => {
    expect(isReformableFurniture('bed_basic')).toBe(true);
    expect(isReformableFurniture('rug_cream')).toBe(true);
    expect(isReformableFurniture('poster_band')).toBe(true);
    expect(isReformableFurniture('plant_pot')).toBe(false);
    expect(isReformableFurniture('fish_tank')).toBe(false);
  });

  it('기본 마감 두 개와 색 세 개는 처음부터 열려 있다', () => {
    expect(furnitureFinishViews(quests()).filter((view) => view.unlocked).map((view) => view.option.id)).toEqual(['matte', 'limewash']);
    expect(furnitureColorViews(quests()).filter((view) => view.unlocked).map((view) => view.option.id)).toEqual(['oat', 'sage', 'clay']);
  });

  it('생활 기록을 채우면 나머지 마감과 색이 구체적으로 열린다', () => {
    let state = quests();
    for (const [key, value] of Object.entries({ q_place: 5, home_score: 40, home_theme_power: 3, home_visits: 3, home_unique_items: 8, fishing_species: 6, cooking_recipes: 6, treasure_crafted: 3, garden_specimens: 12 })) {
      state = setQuestMetric(state, key, value);
    }
    expect(furnitureFinishViews(state).every((view) => view.unlocked)).toBe(true);
    expect(furnitureColorViews(state).every((view) => view.unlocked)).toBe(true);
  });

  it('잠긴 조합은 적용할 수 없고 열린 조합은 실제 배치 ID에 저장한다', () => {
    const store = new FurnitureReformStore('apply');
    expect(store.apply('p1', 'bed_basic', { finishId: 'patina', colorId: 'petal' }, quests())).toMatchObject({ ok: false, reason: 'locked-finish' });
    expect(store.apply('p1', 'bed_basic', { finishId: 'matte', colorId: 'sage' }, quests())).toMatchObject({ ok: true, newCombination: true });
    expect(store.styleFor('p1')).toMatchObject({ itemId: 'bed_basic', finishId: 'matte', colorId: 'sage' });
  });

  it('마을 레벨 명찰 레시피는 개별 생활 조건보다 먼저 자동 사용할 수 있다', () => {
    const store = new FurnitureReformStore('village-reward');
    const recipe = { finishId: 'woodgrain', colorId: 'oat' } as const;
    expect(store.apply('p1', 'bed_basic', recipe, quests())).toMatchObject({ ok: false, reason: 'locked-finish' });
    expect(store.apply('p1', 'bed_basic', recipe, quests(), ['badge_master_village_level_5']))
      .toMatchObject({ ok: true, newCombination: true });
  });

  it('연속 의뢰 완결 레시피도 잠긴 재질·색 조건보다 먼저 사용할 수 있다', () => {
    const store = new FurnitureReformStore('story-reward');
    const recipe = { finishId: 'patina', colorId: 'sky' } as const;
    expect(store.apply('p1', 'bed_basic', recipe, quests())).toMatchObject({ ok: false, reason: 'locked-finish' });
    expect(store.apply('p1', 'bed_basic', recipe, quests(), ['badge_story_request_reward_rain_map']))
      .toMatchObject({ ok: true, newCombination: true });
  });

  it('같은 조합을 다른 가구에 적용하면 저장 횟수만 늘고 도감은 중복되지 않는다', () => {
    const store = new FurnitureReformStore('repeat');
    store.apply('p1', 'bed_basic', { finishId: 'limewash', colorId: 'clay' }, quests());
    store.apply('p2', 'desk_wood', { finishId: 'limewash', colorId: 'clay' }, quests());
    expect(store.progress()).toMatchObject({ saves: 2, combinations: 1, finishes: 1, colors: 1, styledPlacements: 2 });
  });

  it('배치 제거 시 외형 연결만 지우고 발견 조합은 영구 보존한다', () => {
    const store = new FurnitureReformStore('clear');
    store.apply('p1', 'bed_basic', { finishId: 'matte', colorId: 'oat' }, quests());
    expect(store.clear('p1')).toBe(true);
    expect(store.styleFor('p1')).toBeNull();
    expect(store.progress()).toMatchObject({ combinations: 1, styledPlacements: 0 });
  });

  it('실행 취소로 가구를 다시 놓을 때 외형만 복원하고 저장 횟수는 중복 증가하지 않는다', () => {
    const store = new FurnitureReformStore('history-restore');
    const style = { finishId: 'matte', colorId: 'sage' } as const;
    store.apply('old-placement', 'bed_basic', style, quests());
    store.clear('old-placement');

    expect(store.restore('new-placement', 'bed_basic', style)).toBe(true);
    expect(store.styleFor('new-placement')).toMatchObject({ itemId: 'bed_basic', ...style });
    expect(store.progress()).toMatchObject({ saves: 1, combinations: 1, styledPlacements: 1 });
  });

  it('손상 저장값과 리폼 불가 아이템을 제거하고 사용자 저장을 분리한다', () => {
    const normalized = normalizeFurnitureReformState({
      saveCount: 0,
      styles: {
        good: { itemId: 'bed_basic', finishId: 'matte', colorId: 'oat', updatedAt: 2.8 },
        plant: { itemId: 'plant_pot', finishId: 'matte', colorId: 'oat' },
        bad: { itemId: 'desk_wood', finishId: 'fake', colorId: 'oat' },
      },
      discovered: ['matte:sage', 'fake:oat', 3],
    });
    expect(Object.keys(normalized.styles)).toEqual(['good']);
    expect(normalized.styles.good?.updatedAt).toBe(2);
    expect(normalized.discovered).toEqual(['matte:sage', 'matte:oat']);
    expect(normalized.saveCount).toBe(2);
    new FurnitureReformStore('a').apply('p', 'bed_basic', { finishId: 'matte', colorId: 'oat' }, quests());
    expect(new FurnitureReformStore('a').progress().saves).toBe(1);
    expect(new FurnitureReformStore('b').progress().saves).toBe(0);
  });
});
