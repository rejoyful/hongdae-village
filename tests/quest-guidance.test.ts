import { describe, expect, it } from 'vitest';
import {
  bumpQuest, normalizeState, questViews, reconcileFocusedQuest, setFocusedQuest, type QuestState,
} from '../src/game/questProgress';
import { recommendQuestGuides, selectQuestGuide } from '../src/game/questGuidance';

const TODAY = '2026-07-23';

function finishFirstSteps(): QuestState {
  let state = normalizeState(null, TODAY);
  for (const [key, amount] of [
    ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['q_cafe', 1],
    ['visit_home', 1], ['visit_shop', 1], ['visit_workshop', 1], ['q_place', 2], ['pet_adopt', 1], ['pet_feed', 1],
    ['sparkle_collect', 1], ['monster_kill', 1],
  ] as const) state = bumpQuest(state, key, amount);
  return state;
}

describe('친절한 퀘스트 길잡이', () => {
  it('새 플레이어에게 첫걸음 하나를 가장 먼저 안내한다', () => {
    const guide = selectQuestGuide(questViews(normalizeState(null, TODAY)));
    expect(guide).toMatchObject({
      tone: 'first-step', label: '첫걸음 안내', manual: false,
      quest: { id: 'intro_journal' },
    });
    expect(guide?.action).toContain('추천 탭');
  });

  it('직접 추적한 목표는 자동 추천보다 우선한다', () => {
    let state = normalizeState(null, TODAY);
    state = setFocusedQuest(state, 'quest_forest');
    const guide = selectQuestGuide(questViews(state), state.focusedQuestId ?? null);
    expect(guide).toMatchObject({ tone: 'tracked', manual: true, quest: { id: 'quest_forest' } });
  });

  it('잠긴 목표와 존재하지 않는 목표는 추적할 수 없다', () => {
    const state = normalizeState(null, TODAY);
    expect(setFocusedQuest(state, 'intro_map')).toBe(state);
    expect(setFocusedQuest(state, 'missing')).toBe(state);
  });

  it('추적 목표를 마치면 자동 추천으로 안전하게 돌아간다', () => {
    let state = setFocusedQuest(normalizeState(null, TODAY), 'quest_forest');
    state = bumpQuest(state, 'q_forest', 30);
    state = reconcileFocusedQuest(state);
    expect(state.focusedQuestId).toBeUndefined();
    expect(selectQuestGuide(questViews(state), state.focusedQuestId ?? null)?.manual).toBe(false);
  });

  it('첫걸음 이후 추천 목록은 보상·일상·이야기·수집·숙련을 섞는다', () => {
    const guides = recommendQuestGuides(questViews(finishFirstSteps()), null, 6);
    const categories = new Set(guides.map((guide) => guide.quest.category));
    expect(categories).toEqual(new Set(['daily', 'story', 'collection', 'mastery']));
    expect(guides.some((guide) => guide.tone === 'reward')).toBe(true);
  });

  it('날짜가 바뀌어도 유효한 직접 추적 목표는 보존한다', () => {
    const stale: QuestState = {
      day: '2026-07-22', counts: {}, claimed: [], lifetimeCounts: {}, focusedQuestId: 'quest_busking',
    };
    expect(normalizeState(stale, TODAY).focusedQuestId).toBe('quest_busking');
    expect(normalizeState({ ...stale, focusedQuestId: 'not-real' }, TODAY).focusedQuestId).toBeUndefined();
  });
});
