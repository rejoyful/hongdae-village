import { describe, expect, it } from 'vitest';
import { BADGE_BY_ID } from '../src/game/achievements';
import {
  completedQuestIds, normalizeQuestMilestoneHistory, QuestMilestoneHistoryStore, questMilestoneNotice,
} from '../src/game/guidance/questMilestones';
import type { QuestView } from '../src/game/questProgress';
import type { QuestCategory } from '../src/game/quests';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  clear(): void { this.values.clear(); }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

function quest(id: string, category: QuestCategory, overrides: Partial<QuestView> = {}): QuestView {
  return {
    id,
    name: `기록 ${id}`,
    desc: `설명 ${id}`,
    goal: 1,
    registryKey: id,
    reward: category === 'daily' ? 40 : 0,
    category,
    location: '중앙 광장',
    order: 10,
    progress: 0,
    done: false,
    claimed: false,
    unlocked: true,
    ...overrides,
  };
}

describe('quest milestone notices', () => {
  it('does not replay quests that were already complete at the session baseline', () => {
    const view = quest('old', 'story', { progress: 1, done: true });
    expect(questMilestoneNotice(new Set(['old']), [view])).toBeNull();
    expect(completedQuestIds([view])).toEqual(new Set(['old']));
  });

  it('prioritizes onboarding and groups simultaneous lower-priority completions', () => {
    const notice = questMilestoneNotice(new Set(), [
      quest('master', 'mastery', { progress: 1, done: true }),
      quest('intro', 'onboarding', { progress: 1, done: true }),
      quest('story', 'story', { progress: 1, done: true }),
    ]);

    expect(notice).toMatchObject({
      title: '기록 intro',
      category: 'onboarding',
      extraCount: 2,
    });
    expect(notice?.extraTitles).toEqual(['기록 story', '기록 master']);
  });

  it('shows the directly unlocked follow-up without pretending other routes are locked', () => {
    const notice = questMilestoneNotice(new Set(), [
      quest('chapter-1', 'story', { progress: 1, done: true }),
      quest('chapter-2', 'story', { prerequisite: 'chapter-1', order: 20 }),
      quest('other', 'story'),
    ]);

    expect(notice?.next).toEqual({
      id: 'chapter-2',
      name: '기록 chapter-2',
      description: '설명 chapter-2',
      location: '중앙 광장',
    });
  });

  it('describes daily completion as a claimable reward', () => {
    const notice = questMilestoneNotice(new Set(), [
      quest('daily', 'daily', { progress: 1, done: true }),
    ]);
    expect(notice).toMatchObject({
      progressLabel: '오늘의 기록 완료 · 모험 일지에서 코인 받기',
      rewardLabel: '40 코인 보상 준비',
    });
  });

  it('pairs a newly unlocked badge with its source quest', () => {
    const badge = [...BADGE_BY_ID.values()][0]!;
    const notice = questMilestoneNotice(new Set(), [
      quest(badge.questId, badge.category, {
        name: badge.source,
        progress: 1,
        done: true,
        rewardLabel: badge.name,
      }),
    ], [badge.id]);
    expect(notice?.badge?.id).toBe(badge.id);
    expect(notice?.rewardLabel).toBe(badge.name);
  });

  it('seeds a new history from current completions and preserves later scene completions once', () => {
    localStorage.clear();
    const store = new QuestMilestoneHistoryStore('milestone-user', new Set(['old']));
    expect(store.seenCompletedIds()).toEqual(new Set(['old']));
    store.remember(new Set(['old', 'room-complete']));
    expect(new QuestMilestoneHistoryStore('milestone-user', new Set(['ignored'])).seenCompletedIds())
      .toEqual(new Set(['old', 'room-complete']));
    expect(normalizeQuestMilestoneHistory({ seenCompletedQuestIds: ['a', 'a', 3] }))
      .toEqual({ version: 1, seenCompletedQuestIds: ['a'] });
  });
});
