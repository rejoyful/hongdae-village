import { describe, expect, it } from 'vitest';
import {
  BADGES, badgeViews, equipBadge, mergeAchievementUnlocks, normalizeAchievementState, syncAchievementState,
  type AchievementState,
} from '../src/game/achievements';
import { normalizeState, bumpQuest, questViews } from '../src/game/questProgress';

const EMPTY: AchievementState = { version: 1, unlocked: [], equipped: null };

describe('퀘스트 배지 컬렉션', () => {
  it('모든 장기 퀘스트 보상이 고유한 배지로 생성된다', () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(BADGES.map((badge) => badge.id)).size).toBe(BADGES.length);
    expect(BADGES.every((badge) => badge.questId && badge.name)).toBe(true);
  });

  it('완료한 퀘스트의 배지를 해금하고 첫 배지를 자동 장착한다', () => {
    let quests = normalizeState(null, '2026-07-22');
    quests = bumpQuest(quests, 'open_quest');
    const result = syncAchievementState(EMPTY, questViews(quests));
    expect(result.newlyUnlocked).toEqual(['badge_intro_journal']);
    expect(result.state.unlocked).toContain('badge_intro_journal');
    expect(result.state.equipped).toBe('badge_intro_journal');
  });

  it('이미 받은 배지는 다시 해금하지 않는다', () => {
    let quests = normalizeState(null, '2026-07-22');
    quests = bumpQuest(quests, 'open_quest');
    const first = syncAchievementState(EMPTY, questViews(quests));
    const second = syncAchievementState(first.state, questViews(quests));
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.state).toBe(first.state);
  });

  it('잠긴 배지는 장착할 수 없고 해금 배지만 장착한다', () => {
    expect(equipBadge(EMPTY, 'badge_intro_journal')).toBe(EMPTY);
    const unlocked: AchievementState = {
      version: 1, unlocked: ['badge_intro_journal', 'badge_intro_map'], equipped: 'badge_intro_journal',
    };
    expect(equipBadge(unlocked, 'badge_intro_map').equipped).toBe('badge_intro_map');
    expect(badgeViews(unlocked).find((badge) => badge.id === 'badge_intro_journal')?.equipped).toBe(true);
  });

  it('손상되거나 존재하지 않는 저장값을 제거한다', () => {
    const state = normalizeAchievementState({
      unlocked: ['badge_intro_journal', 'missing', 'badge_intro_journal', 3],
      equipped: 'missing',
    });
    expect(state.unlocked).toEqual(['badge_intro_journal']);
    expect(state.equipped).toBeNull();
  });

  it('서버 검증 배지는 유효한 id만 멱등 병합한다', () => {
    const merged = mergeAchievementUnlocks(EMPTY, ['badge_intro_pet', 'missing', 'badge_intro_pet']);
    expect(merged.unlocked).toEqual(['badge_intro_pet']);
    expect(merged.equipped).toBe('badge_intro_pet');
    expect(mergeAchievementUnlocks(merged, ['badge_intro_pet'])).toBe(merged);
  });
});
