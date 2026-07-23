import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import { MONSTERS } from '../src/game/battle/monsters';
import type { MonsterDexEntry } from '../src/game/battle/monsterDex';
import {
  COLLECTION_SHELF_MAX, CollectionShelfStore, collectionTargetView, normalizeCollectionShelf,
  type CollectionShelfContext,
} from '../src/game/progression/collectionShelf';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const context = (
  discoveredItems: string[] = [], discoveredMonsters: string[] = [],
  unlockedBadgeIds: string[] = [], ownedPetIds: string[] = [],
): CollectionShelfContext => ({
  quests: normalizeState(null, '2026-07-23'),
  discoveredItems: new Set(discoveredItems),
  monsters: MONSTERS.map((species): MonsterDexEntry => ({
    species, kills: discoveredMonsters.includes(species.id) ? 3 : 0, discovered: discoveredMonsters.includes(species.id),
  })),
  unlockedBadgeIds,
  ownedPetIds,
});

describe('개인 수집 선반', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('손상·중복 목표를 제거하고 여덟 칸까지만 복구한다', () => {
    const normalized = normalizeCollectionShelf({ targets: [
      'item:bed_basic', 'item:bed_basic', 'monster:slime_g', 'metric:garden_species',
      'item:desk_wood', 'item:chair_wood', 'item:rug_cream', 'style:eyeStyle-4',
      'pet:dog', 'item:plant_pot', 'item:fake', 3,
    ] });
    expect(normalized.targets).toHaveLength(COLLECTION_SHELF_MAX);
    expect(new Set(normalized.targets).size).toBe(COLLECTION_SHELF_MAX);
    expect(normalized.targets).not.toContain('item:fake');
  });

  it('물건은 실제 발견 기록과 살림 가구 가격·진열대를 함께 보여 준다', () => {
    const before = collectionTargetView('item:bed_basic', context());
    expect(before).toMatchObject({ complete: false, current: 0, goal: 1 });
    expect(before?.detail).toContain('코인');
    expect(before?.location).toContain('살림 가구');
    expect(collectionTargetView('item:bed_basic', context(['bed_basic']))).toMatchObject({ complete: true, progressPct: 100 });
  });

  it('미발견 생태의 이름은 숨기고 티어별 출현 위치만 안내한다', () => {
    expect(collectionTargetView('monster:slime_g', context())).toMatchObject({
      label: 'T1 미발견 생태', complete: false,
    });
    const found = collectionTargetView('monster:slime_g', context([], ['slime_g']));
    expect(found).toMatchObject({ label: '초록 슬라임', complete: true, current: 1 });
    expect(found?.location).toContain('T1');
  });

  it('생활 목표는 평생 기록을 소급해 진행률과 완료를 계산한다', () => {
    let quests = normalizeState(null, '2026-07-23');
    quests = setQuestMetric(quests, 'garden_species', 7);
    let view = collectionTargetView('metric:garden_species', { ...context(), quests });
    expect(view).toMatchObject({ current: 7, goal: 12, progressPct: 58, complete: false });
    quests = setQuestMetric(quests, 'garden_species', 14);
    view = collectionTargetView('metric:garden_species', { ...context(), quests });
    expect(view).toMatchObject({ current: 14, progressPct: 100, complete: true });
  });

  it('희귀 스타일은 배지, 동행은 실제 가족 기록으로 완료한다', () => {
    expect(collectionTargetView('style:eyeStyle-4', context())).toMatchObject({
      kind: 'style', complete: false, label: '날카로운 눈',
    });
    expect(collectionTargetView('style:eyeStyle-4', context([], [], ['badge_intro_hunt']))).toMatchObject({
      complete: true, progressPct: 100,
    });
    expect(collectionTargetView('pet:dog', context())).toMatchObject({
      kind: 'pet', complete: false, label: '강아지',
    });
    expect(collectionTargetView('pet:dog', context([], [], [], ['dog']))).toMatchObject({
      complete: true, progressPct: 100,
    });
  });

  it('담기·빼기와 여덟 칸 제한을 사용자별로 영구 저장한다', () => {
    const store = new CollectionShelfStore('collector-a');
    const targets = [
      'item:bed_basic', 'item:desk_wood', 'item:chair_wood', 'item:rug_cream',
      'item:plant_pot', 'monster:slime_g', 'style:eyeStyle-4', 'pet:dog',
    ];
    for (const target of targets) expect(store.toggle(target)).toBe('added');
    expect(store.toggle('metric:garden_species')).toBe('full');
    expect(new CollectionShelfStore('collector-a').get().targets).toEqual(targets);
    expect(new CollectionShelfStore('collector-b').get().targets).toEqual([]);
    expect(store.toggle('item:bed_basic')).toBe('removed');
    expect(store.toggle('metric:garden_species')).toBe('added');
  });

  it('선반 진행은 여러 취향 분야와 완료 목표를 집계한다', () => {
    const store = new CollectionShelfStore('progress');
    store.toggle('item:bed_basic');
    store.toggle('style:eyeStyle-4');
    store.toggle('pet:dog');
    expect(store.progress(context(['bed_basic'], [], [], ['dog']))).toEqual({
      targets: 3, targetKinds: 3, completed: 2,
    });
  });
});
