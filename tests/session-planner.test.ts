import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SessionPlannerStore, freshSessionPlannerState, normalizeSessionPlannerState,
  recommendSessionPlan, sessionPlannerProgress, sessionPlannerView,
} from '../src/game/progression/sessionPlanner';
import {
  bumpQuest, normalizeState, questViews, setQuestMetric,
} from '../src/game/questProgress';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const DAY = '2026-07-23';

describe('오늘의 플레이 큐', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
    vi.spyOn(Date, 'now').mockReturnValue(1_234_567);
  });

  it('진행 중이거나 거의 끝난 목표와 서로 다른 장소·분야를 우선 추천한다', () => {
    let state = normalizeState(null, DAY);
    state = setQuestMetric(state, 'open_quest', 1);
    state = bumpQuest(state, 'q_cafe');
    const recommendations = recommendSessionPlan(questViews(state), [], 6);
    expect(recommendations).toHaveLength(6);
    expect(new Set(recommendations.map((quest) => quest.id)).size).toBe(6);
    expect(recommendations.every((quest) => quest.unlocked && !quest.done)).toBe(true);
    expect(new Set(recommendations.map((quest) => quest.location)).size).toBeGreaterThan(2);
  });

  it('잠긴 목표와 완료 목표를 막고 미완료 목표 세 개까지만 자유롭게 담고 뺀다', () => {
    const store = new SessionPlannerStore('queue');
    const views = questViews(normalizeState(null, DAY));
    expect(store.toggle('intro_map', views)).toBe('locked');
    expect(store.toggle('intro_journal', views)).toBe('added');
    expect(store.toggle('quest_cafe', views)).toBe('added');
    expect(store.toggle('quest_busking', views)).toBe('added');
    expect(store.toggle('quest_forest', views)).toBe('full');
    expect(store.toggle('quest_cafe', views)).toBe('removed');
    expect(store.progress().slots).toBe(2);

    const completeIntro = questViews(setQuestMetric(normalizeState(null, DAY), 'open_quest', 1));
    expect(store.toggle('intro_journal', completeIntro)).toBe('removed');
    expect(store.toggle('intro_journal', completeIntro)).toBe('done');
  });

  it('큐 순서에서 첫 미완료 목표만 다음 정류장으로 안내하고 완료 기록은 남긴다', () => {
    const store = new SessionPlannerStore('route');
    const initial = questViews(normalizeState(null, DAY));
    for (const id of ['intro_journal', 'quest_cafe', 'quest_busking']) expect(store.toggle(id, initial)).toBe('added');

    let state = setQuestMetric(normalizeState(null, DAY), 'open_quest', 1);
    state = bumpQuest(state, 'q_cafe');
    const view = store.view(questViews(state));
    expect(view.slots.map((slot) => [slot.quest.id, slot.quest.done, slot.active])).toEqual([
      ['intro_journal', true, false],
      ['quest_cafe', true, false],
      ['quest_busking', false, true],
    ]);
    expect(view.nextQuest?.id).toBe('quest_busking');
    expect(view.readyToArchive).toBe(false);
  });

  it('세 목표를 모두 끝낸 뒤에만 페이지로 보존하고 대표 기록과 누적치를 재접속 후에도 유지한다', () => {
    const store = new SessionPlannerStore('archive');
    const initial = questViews(normalizeState(null, DAY));
    for (const id of ['intro_journal', 'quest_cafe', 'quest_busking']) store.toggle(id, initial);
    expect(store.archive(initial)).toEqual({ ok: false, reason: 'not-complete' });

    let state = setQuestMetric(normalizeState(null, DAY), 'open_quest', 1);
    state = bumpQuest(state, 'q_cafe');
    state = bumpQuest(state, 'q_busking');
    const completed = questViews(state);
    const result = store.archive(completed);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(store.feature(result.archive.id)).toBe('featured');
    expect(store.progress()).toEqual({
      slots: 0, archivedPages: 1, archivedQuests: 3, archivedCategories: 2, featured: 1,
    });
    const restored = new SessionPlannerStore('archive');
    expect(restored.progress()).toEqual(store.progress());
    expect(restored.view(completed).archives[0]).toMatchObject({
      id: result.archive.id, featured: true,
      names: ['어서 와, 홍대마을!', '모퉁이의 하루', '거리의 뮤지션'],
    });
    expect(restored.feature(result.archive.id)).toBe('cleared');
  });

  it('손상된 중복·알 수 없는 목표와 아카이브를 안전하게 정리한다', () => {
    const state = normalizeSessionPlannerState({
      version: 99,
      questIds: ['intro_journal', 'intro_journal', 'missing', 'quest_cafe', 'quest_busking', 'quest_forest'],
      archives: [
        { id: 'good', questIds: ['intro_journal', 'quest_cafe', 'quest_busking'], completedAt: 3.8 },
        { id: 'duplicate-quests', questIds: ['intro_journal', 'intro_journal', 'quest_cafe'], completedAt: 2 },
        { id: 'missing-quest', questIds: ['intro_journal', 'quest_cafe', 'missing'], completedAt: 2 },
        { id: 'good', questIds: ['intro_journal', 'quest_cafe', 'quest_forest'], completedAt: 2 },
      ],
      featuredArchiveId: 'missing',
      totalArchived: -4,
    });
    expect(state.questIds).toEqual(['intro_journal', 'quest_cafe', 'quest_busking']);
    expect(state.archives).toEqual([{
      id: 'good', questIds: ['intro_journal', 'quest_cafe', 'quest_busking'], completedAt: 3,
    }]);
    expect(state.featuredArchiveId).toBeNull();
    expect(sessionPlannerProgress(state).archivedPages).toBe(1);
  });

  it('빈 저장본은 안전한 3칸 미만 상태이며 보존할 수 없다', () => {
    const state = freshSessionPlannerState();
    const view = sessionPlannerView(state, questViews(normalizeState(null, DAY)));
    expect(view.slots).toEqual([]);
    expect(view.readyToArchive).toBe(false);
    expect(view.recommendations.length).toBeGreaterThanOrEqual(3);
  });
});
