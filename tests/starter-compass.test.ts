import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_QUESTS, STARTER_MENTOR_QUESTS } from '../src/game/quests';
import { bumpQuest, normalizeState, questViews, setQuestMetric } from '../src/game/questProgress';
import {
  STARTER_COMPASS_ROUTES, STARTER_MENTOR_CHAPTERS, StarterCompassPreferenceStore, normalizeStarterCompassPreference,
  starterCompassConciergeView, starterCompassMetrics, starterCompassRouteViews,
} from '../src/game/progression/starterCompass';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

const TODAY = '2026-07-23';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('새 이웃 취향 나침반', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });
  it('여섯 성향을 처음부터 열고 각 성향은 세 활동 중 두 가지만 요구한다', () => {
    expect(STARTER_COMPASS_ROUTES).toHaveLength(6);
    expect(new Set(STARTER_COMPASS_ROUTES.map((route) => route.id)).size).toBe(6);
    for (const route of STARTER_COMPASS_ROUTES) {
      expect(route.requirements).toHaveLength(3);
      expect(route.required).toBe(2);
      expect(route.reward.length).toBeGreaterThan(4);
      expect(route.welcomeLetter.length).toBeGreaterThan(20);
      expect(route.keepsakeNote.length).toBeGreaterThan(12);
    }
    const views = starterCompassRouteViews(normalizeState(null, TODAY));
    expect(views.every((route) => route.completed === 0 && !route.complete)).toBe(true);
  });

  it('한 성향의 두 활동만 해도 영구 방향 도장이 완성된다', () => {
    let state = normalizeState(null, TODAY);
    state = bumpQuest(state, 'customize_save');
    state = bumpQuest(state, 'photo_taken');
    const style = starterCompassRouteViews(state).find((route) => route.id === 'style');
    expect(style).toMatchObject({ completed: 2, required: 2, complete: true, progressPct: 100 });
    expect(starterCompassMetrics(state)).toMatchObject({ starter_routes: 1, starter_steps: 2 });
  });

  it('나침반을 열기 전에 했던 평생 기록도 즉시 소급 인정한다', () => {
    const state = normalizeState({
      day: TODAY, counts: {}, claimed: [], lifetimeCounts: { visit_home: 1, q_place: 7, pet_adopt: 1 },
    }, TODAY);
    const routes = starterCompassRouteViews(state);
    expect(routes.find((route) => route.id === 'home')).toMatchObject({ complete: true, completed: 2 });
    expect(routes.find((route) => route.id === 'companion')).toMatchObject({ complete: false, completed: 1 });
  });

  it('각 성향에는 실제 월드 길 안내가 가능한 미완료 활동이 두 개 이상 있다', () => {
    for (const route of STARTER_COMPASS_ROUTES) {
      expect(route.requirements.filter((item) => villageRequestDestinationForMetric(item.key))).toHaveLength(3);
    }
  });

  it('1·3·6개 방향 완성이 실제 장착 배지 퀘스트로 이어진다', () => {
    const compassQuests = ALL_QUESTS.filter((quest) => quest.registryKey === 'starter_routes');
    expect(compassQuests.map((quest) => quest.goal)).toEqual([1, 3, 6]);
    expect(compassQuests.every((quest) => !!quest.rewardLabel)).toBe(true);

    let state = normalizeState(null, TODAY);
    state = bumpQuest(state, 'open_quest');
    state = setQuestMetric(state, 'starter_routes', 6);
    const views = questViews(state);
    expect(views.filter((quest) => quest.registryKey === 'starter_routes').every((quest) => quest.done)).toBe(true);
  });

  it('환영 소포 1·3·6개와 대표 첫 생활 표식이 별도 영구 퀘스트로 이어진다', () => {
    expect(ALL_QUESTS.filter((quest) => quest.registryKey === 'starter_keepsakes').map((quest) => quest.goal))
      .toEqual([1, 3, 6]);
    expect(ALL_QUESTS.filter((quest) => quest.registryKey === 'starter_featured_keepsake').map((quest) => quest.goal))
      .toEqual([1]);
  });

  it('고른 첫 방향은 사용자별로 영구 기억하고 손상된 선택은 안전하게 비운다', () => {
    const store = new StarterCompassPreferenceStore('new-neighbor');
    expect(store.get().selectedRouteId).toBeNull();
    expect(store.select('companion')).toBe(true);
    expect(new StarterCompassPreferenceStore('new-neighbor').get().selectedRouteId).toBe('companion');
    expect(store.select('missing' as 'companion')).toBe(false);
    expect(normalizeStarterCompassPreference({ selectedRouteId: '<script>' }).selectedRouteId).toBeNull();
  });

  it('기존 v1·v2 선택과 소포를 보존하면서 멘토 연대기 v3로 안전하게 이관한다', () => {
    expect(normalizeStarterCompassPreference({ version: 1, selectedRouteId: 'home' })).toEqual({
      version: 3, selectedRouteId: 'home', claimedRouteIds: [], featuredRouteId: null,
      claimedMentorChapterIds: [], featuredMentorChapterIds: [], mentorReplayCounts: {},
    });
    expect(normalizeStarterCompassPreference({
      version: 2,
      selectedRouteId: 'style',
      claimedRouteIds: ['home', 'bad', 'home', 'companion'],
      featuredRouteId: 'bad',
    })).toEqual({
      version: 3, selectedRouteId: 'style', claimedRouteIds: ['home', 'companion'], featuredRouteId: null,
      claimedMentorChapterIds: [], featuredMentorChapterIds: [], mentorReplayCounts: {},
    });
  });

  it('완성한 방향의 환영 소포만 한 번 받고 받은 기념품 중 하나를 대표로 고른다', () => {
    const store = new StarterCompassPreferenceStore('keepsake-neighbor');
    expect(store.claim('home', false)).toBe('not-ready');
    expect(store.claim('home', true)).toBe('claimed');
    expect(store.claim('home', true)).toBe('already');
    expect(store.feature('style')).toBe('locked');
    expect(store.feature('home')).toBe('featured');
    expect(store.progress()).toEqual({
      claimed: 1, featured: 1, claimedRouteIds: ['home'], featuredRouteId: 'home',
      mentorChapters: 0, mentorRoutes: 0, mentorRouteIds: [], featuredMentorScenes: 0, mentorReplays: 0,
    });
    expect(store.feature('home')).toBe('cleared');
    expect(new StarterCompassPreferenceStore('keepsake-neighbor').progress()).toMatchObject({
      claimed: 1, featured: 0, featuredRouteId: null,
    });
  });

  it('길잡이는 선택 전·첫걸음·한 걸음 남음·완료 상태마다 한 가지 다음 행동을 제안한다', () => {
    let state = normalizeState(null, TODAY);
    let routes = starterCompassRouteViews(state);
    expect(starterCompassConciergeView(routes, null)).toMatchObject({ stage: 'choose', selected: false, route: { id: 'style' } });
    expect(starterCompassConciergeView(routes, 'home')).toMatchObject({ stage: 'first-step', next: { key: 'visit_home' } });

    state = bumpQuest(state, 'visit_home');
    routes = starterCompassRouteViews(state);
    expect(starterCompassConciergeView(routes, 'home')).toMatchObject({ stage: 'one-left', next: { key: 'visit_shop' } });

    state = bumpQuest(state, 'q_place');
    routes = starterCompassRouteViews(state);
    expect(starterCompassConciergeView(routes, 'home')).toMatchObject({ stage: 'complete', suggestedRoute: { id: 'style' } });
  });

  it('여섯 방향을 모두 마치면 더 이상 행동을 강요하지 않고 자유 생활로 전환한다', () => {
    let state = normalizeState(null, TODAY);
    for (const route of STARTER_COMPASS_ROUTES) {
      for (const requirement of route.requirements.slice(0, route.required)) state = setQuestMetric(state, requirement.key, 1);
    }
    expect(starterCompassConciergeView(starterCompassRouteViews(state), 'explorer'))
      .toMatchObject({ stage: 'all-complete', next: null, suggestedRoute: null });
  });

  it('여섯 방향마다 두 기록으로 이어지는 세 장씩, 총 18개의 멘토 성장 이야기가 있다', () => {
    expect(STARTER_MENTOR_CHAPTERS).toHaveLength(18);
    for (const route of STARTER_COMPASS_ROUTES) {
      const chapters = STARTER_MENTOR_CHAPTERS.filter((chapter) => chapter.routeId === route.id);
      expect(chapters.map((chapter) => chapter.chapter)).toEqual([1, 2, 3]);
      expect(chapters.every((chapter) => chapter.requirements.length === 2)).toBe(true);
      expect(chapters.every((chapter) => chapter.story.length > 25 && chapter.closing.length > 20)).toBe(true);
      expect(chapters.flatMap((chapter) => chapter.requirements)
        .every((requirement) => villageRequestDestinationForMetric(requirement.key))).toBe(true);
    }
  });

  it('환영 소포를 받은 루트만 세 장을 순서대로 보존하고 과거 생활 기록을 소급한다', () => {
    let state = normalizeState(null, TODAY);
    const store = new StarterCompassPreferenceStore('mentor-route');
    const style = STARTER_MENTOR_CHAPTERS.filter((chapter) => chapter.routeId === 'style');
    for (const chapter of style) for (const requirement of chapter.requirements) {
      state = setQuestMetric(state, requirement.key, requirement.goal);
    }
    expect(store.claimMentorChapter(style[0]!.id, state)).toBe('route-locked');
    expect(store.claim('style', true)).toBe('claimed');
    expect(store.claimMentorChapter(style[1]!.id, state)).toBe('previous');
    expect(store.claimMentorChapter(style[0]!.id, state)).toBe('claimed');
    expect(store.claimMentorChapter(style[1]!.id, state)).toBe('claimed');
    expect(store.claimMentorChapter(style[2]!.id, state)).toBe('claimed');
    expect(store.progress()).toMatchObject({ mentorChapters: 3, mentorRoutes: 1 });
    expect(new StarterCompassPreferenceStore('mentor-route').progress()).toMatchObject({
      mentorChapters: 3, mentorRoutes: 1,
    });
  });

  it('보존한 성장 장만 대표 세 장과 장면 재생 기록으로 남긴다', () => {
    let state = normalizeState(null, TODAY);
    const store = new StarterCompassPreferenceStore('mentor-scenes');
    for (const route of STARTER_COMPASS_ROUTES.slice(0, 2)) {
      expect(store.claim(route.id, true)).toBe('claimed');
      for (const chapter of STARTER_MENTOR_CHAPTERS.filter((item) => item.routeId === route.id)) {
        for (const requirement of chapter.requirements) state = setQuestMetric(state, requirement.key, requirement.goal);
        expect(store.claimMentorChapter(chapter.id, state)).toBe('claimed');
      }
    }
    const claimed = store.get().claimedMentorChapterIds;
    expect(store.toggleMentorFeature(claimed[0]!)).toBe('featured');
    expect(store.toggleMentorFeature(claimed[1]!)).toBe('featured');
    expect(store.toggleMentorFeature(claimed[2]!)).toBe('featured');
    expect(store.toggleMentorFeature(claimed[3]!)).toBe('locked');
    expect(store.replayMentorChapter(claimed[0]!)).toBe(true);
    expect(store.replayMentorChapter(claimed[0]!)).toBe(true);
    expect(store.replayMentorChapter('maker_mentor_1')).toBe(false);
    expect(store.progress()).toMatchObject({ featuredMentorScenes: 3, mentorReplays: 2 });
  });

  it('손상된 멘토 뒤 장과 미수령 루트 기록을 버리고 대표는 세 장으로 제한한다', () => {
    const normalized = normalizeStarterCompassPreference({
      claimedRouteIds: ['style'],
      claimedMentorChapterIds: ['style_1', 'style_mentor_1', 'style_mentor_3', 'home_mentor_1'],
      featuredMentorChapterIds: ['style_mentor_1', 'style_mentor_3', 'home_mentor_1'],
      mentorReplayCounts: { style_mentor_1: 4, style_mentor_3: 9, bad: 7 },
    });
    expect(normalized).toMatchObject({
      claimedMentorChapterIds: ['style_mentor_1'],
      featuredMentorChapterIds: ['style_mentor_1'],
      mentorReplayCounts: { style_mentor_1: 4 },
    });
  });

  it('멘토 연대기 열네 퀘스트가 장·루트·대표·재생과 여섯 완주 보상을 실제 모험 일지로 연결한다', () => {
    expect(STARTER_MENTOR_QUESTS).toHaveLength(14);
    expect(new Set(STARTER_MENTOR_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'starter_mentor_chapters', 'starter_mentor_routes', 'starter_mentor_featured', 'starter_mentor_replays',
      'starter_mentor_style_complete', 'starter_mentor_home_complete', 'starter_mentor_companion_complete',
      'starter_mentor_neighbor_complete', 'starter_mentor_maker_complete', 'starter_mentor_explorer_complete',
    ]));
    expect(villageRequestDestinationForMetric('starter_mentor_chapters')).toBe('quest');
  });
});
