import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_QUESTS } from '../src/game/quests';
import { normalizeState, questViews, setQuestMetric } from '../src/game/questProgress';
import {
  ADVENTURE_PATHS, AdventurePathPassportStore, adventurePathMetrics, adventurePathViews,
  normalizeAdventurePathPassportState, recommendAdventurePaths,
} from '../src/game/progression/adventurePaths';

const TODAY = '2026-07-23';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('여덟 갈래 장기 생활 모험 진로', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('여덟 진로가 각각 실제 퀘스트 여섯 장으로 이야기·수집·숙련을 연결한다', () => {
    expect(ADVENTURE_PATHS).toHaveLength(8);
    expect(new Set(ADVENTURE_PATHS.map((path) => path.id)).size).toBe(8);
    const questIds = new Set(ALL_QUESTS.map((quest) => quest.id));
    for (const path of ADVENTURE_PATHS) {
      expect(path.questIds).toHaveLength(6);
      expect(path.questIds.every((id) => questIds.has(id))).toBe(true);
      const categories = new Set(ALL_QUESTS.filter((quest) => path.questIds.includes(quest.id)).map((quest) => quest.category));
      expect(categories.has('story') || categories.has('onboarding')).toBe(true);
      expect(categories.has('collection')).toBe(true);
      expect(categories.has('mastery')).toBe(true);
    }
  });

  it('새 이웃에게는 모든 진로를 열어 두고 아틀리에·집·동행 순으로 친숙하게 보여 준다', () => {
    const views = questViews(normalizeState(null, TODAY));
    expect(adventurePathViews(views)).toHaveLength(8);
    expect(recommendAdventurePaths(views).map((path) => path.id)).toEqual(['style', 'home', 'companion']);
    expect(adventurePathViews(views).every((path) => path.rank === '새 지도')).toBe(true);
  });

  it('이미 즐긴 활동을 읽어 가장 많이 진행한 진로를 우선 추천한다', () => {
    let state = normalizeState(null, TODAY);
    state = setQuestMetric(state, 'q_place', 2);
    expect(recommendAdventurePaths(questViews(state), 1)[0]).toMatchObject({ id: 'home', rank: '첫 발자국' });
  });

  it('잠금 선행 조건을 무시하지 않고 지금 추적할 수 있는 다음 한 걸음을 고른다', () => {
    let state = normalizeState(null, TODAY);
    state = setQuestMetric(state, 'open_quest', 1);
    const style = adventurePathViews(questViews(state)).find((path) => path.id === 'style')!;
    expect(style.next).toMatchObject({ id: 'story_style', unlocked: true, done: false });
  });

  it('진로를 나중에 열어도 이전 평생 기록을 소급해 100%로 반영한다', () => {
    const homeDef = ADVENTURE_PATHS.find((path) => path.id === 'home')!;
    let state = normalizeState(null, TODAY);
    for (const id of homeDef.questIds) {
      const quest = ALL_QUESTS.find((item) => item.id === id)!;
      state = setQuestMetric(state, quest.registryKey, quest.goal);
    }
    const home = adventurePathViews(questViews(state)).find((path) => path.id === 'home')!;
    expect(home).toMatchObject({ completed: 6, total: 6, progressPct: 100, rank: '진로 명인', next: null });
    expect(adventurePathMetrics(questViews(state))).toMatchObject({
      adventure_paths_complete: 1,
      adventure_path_home_complete: 1,
      adventure_path_style_complete: 0,
    });
  });

  it('관심 진로 세 개와 대표 진로 하나를 저장하되 다른 진로를 잠그지 않는다', () => {
    const store = new AdventurePathPassportStore('tester');
    expect(store.togglePin('style')).toBe('pinned');
    expect(store.togglePin('home')).toBe('pinned');
    expect(store.togglePin('companion')).toBe('pinned');
    expect(store.togglePin('neighbor')).toBe('full');
    expect(store.toggleFeatured('home')).toBe('featured');
    expect(store.toggleFeatured('neighbor')).toBe('unpinned');
    expect(new AdventurePathPassportStore('tester').get()).toEqual({
      version: 1, pinnedIds: ['style', 'home', 'companion'], featuredId: 'home',
    });
    expect(store.togglePin('home')).toBe('unpinned');
    expect(store.get().featuredId).toBeNull();
  });

  it('손상된 패스포트는 알려진 진로와 관심 목록 안의 대표 진로만 남긴다', () => {
    expect(normalizeAdventurePathPassportState({
      pinnedIds: ['style', 'bad', 'style', 'home', 'companion', 'neighbor'],
      featuredId: 'neighbor',
    })).toEqual({ version: 1, pinnedIds: ['style', 'home', 'companion'], featuredId: null });
  });

  it('여덟 진로 완주마다 실제 영웅 배지 퀘스트를 제공한다', () => {
    const completionQuests = ALL_QUESTS.filter((quest) => quest.id.startsWith('master_adventure_path_'));
    expect(completionQuests).toHaveLength(8);
    expect(completionQuests.every((quest) => quest.category === 'mastery'
      && quest.registryKey.endsWith('_complete') && !!quest.rewardLabel)).toBe(true);
  });
});
