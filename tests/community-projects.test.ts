import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric, type QuestState } from '../src/game/questProgress';
import {
  COMMUNITY_PROJECTS, COMMUNITY_PROJECT_PHASES, CommunityProjectStore,
  communityProjectProgress, communityProjectViews, freshCommunityProjectState,
  normalizeCommunityProjectState,
} from '../src/game/projects/communityProjects';

const quests = (metrics: Record<string, number> = {}): QuestState => {
  let state = normalizeState(null, '2026-07-23');
  for (const [key, value] of Object.entries(metrics)) state = setQuestMetric(state, key, value);
  return state;
};

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('골목 공동 프로젝트', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('다섯 프로젝트가 네 단계와 네 기여씩 가진다', () => {
    expect(COMMUNITY_PROJECTS).toHaveLength(5);
    expect(COMMUNITY_PROJECT_PHASES).toHaveLength(20);
    expect(COMMUNITY_PROJECTS.every((project) => project.phases.length === 4)).toBe(true);
    expect(COMMUNITY_PROJECT_PHASES.every((item) => item.contributions.length === 4)).toBe(true);
    expect(new Set(COMMUNITY_PROJECT_PHASES.map((item) => item.id)).size).toBe(20);
  });

  it('과거 평생 기록을 모든 프로젝트에 동시에 소급한다', () => {
    const state = quests({ q_place: 3, garden_planted: 1, resident_greet: 3, visit_shop: 1, fishing_total: 3 });
    const views = communityProjectViews(freshCommunityProjectState(), state);
    expect(views.find((view) => view.id === 'shade')?.nextPhase).toMatchObject({ ready: true, contributionsDone: 4 });
    expect(views.find((view) => view.id === 'rain')?.nextPhase).toMatchObject({ contributionsDone: 1 });
    expect(communityProjectProgress(freshCommunityProjectState(), state)).toMatchObject({ ready: 1, contributionMarks: 6 });
  });

  it('준비되지 않은 단계와 앞 단계가 없는 발간을 막는다', () => {
    const store = new CommunityProjectStore('gate');
    expect(store.claim('shade_1', quests())).toEqual({ ok: false, reason: 'not-ready' });
    expect(store.claim('shade_2', quests({ furniture_craft_total: 1, garden_harvest: 3, home_unique_items: 8, village_requests_total: 3 })))
      .toEqual({ ok: false, reason: 'previous-phase' });
  });

  it('완료 단계는 순서대로 확정되고 마을 변화 레벨을 올린다', () => {
    const store = new CommunityProjectStore('builder');
    const state = quests({
      q_place: 3, garden_planted: 1, resident_greet: 3, visit_shop: 1,
      furniture_craft_total: 1, garden_harvest: 3, home_unique_items: 8, village_requests_total: 3,
    });
    expect(store.claim('shade_1', state, 10)).toMatchObject({ ok: true, startedProject: true, completedProject: false });
    expect(store.claim('shade_2', state, 20)).toMatchObject({ ok: true, startedProject: false });
    expect(store.progress(state)).toMatchObject({ phases: 2, activeProjects: 1, villageChangeLevel: 2 });
    expect(store.claim('shade_2', state)).toEqual({ ok: false, reason: 'already-claimed' });
  });

  it('가장 가까운 미완료 기여와 관심 프로젝트를 친절하게 유지한다', () => {
    const store = new CommunityProjectStore('focus');
    store.feature('rain');
    const rain = store.views(quests({ fishing_total: 2 })).find((view) => view.id === 'rain')!;
    expect(rain.featured).toBe(true);
    expect(rain.nextContribution).toMatchObject({ key: 'fishing_total', current: 2, goal: 3 });
    store.feature('rain');
    expect(store.get().featuredProjectId).toBeNull();
  });

  it('손상된 저장값은 존재하는 연속 단계만 복구한다', () => {
    const state = normalizeCommunityProjectState({
      version: 99, claimedPhaseIds: ['shade_2', 'shade_1', 'shade_4', 'bad'], featuredProjectId: 'bad', lastClaimedAt: -4,
    });
    expect(state).toEqual({ version: 1, claimedPhaseIds: ['shade_1', 'shade_2'], featuredProjectId: null, lastClaimedAt: 0 });
  });

  it('사용자별 저장을 분리한다', () => {
    const state = quests({ q_place: 3, garden_planted: 1, resident_greet: 3, visit_shop: 1 });
    const first = new CommunityProjectStore('first');
    first.claim('shade_1', state);
    expect(new CommunityProjectStore('first').get().claimedPhaseIds).toEqual(['shade_1']);
    expect(new CommunityProjectStore('second').get().claimedPhaseIds).toEqual([]);
  });
});
