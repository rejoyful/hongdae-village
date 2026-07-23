import { BADGE_BY_ID, type BadgeDef } from '../achievements';
import type { QuestView } from '../questProgress';
import type { QuestCategory } from '../quests';

export interface QuestMilestoneNext {
  id: string;
  name: string;
  description: string;
  location: string;
}

export interface QuestMilestoneNotice {
  id: string;
  category: QuestCategory;
  eyebrow: string;
  title: string;
  description: string;
  progressLabel: string;
  rewardLabel: string | null;
  badge: BadgeDef | null;
  next: QuestMilestoneNext | null;
  extraCount: number;
  extraTitles: string[];
}

export interface QuestMilestoneHistoryState {
  version: 1;
  seenCompletedQuestIds: string[];
}

const CATEGORY_PRIORITY: Record<QuestCategory, number> = {
  onboarding: 500,
  story: 400,
  daily: 350,
  collection: 300,
  mastery: 200,
};

const CATEGORY_EYEBROW: Record<QuestCategory, string> = {
  onboarding: 'FIRST STEP RECORDED',
  daily: 'TODAY COMPLETE',
  story: 'STORY ARCHIVED',
  collection: 'COLLECTION STAMP',
  mastery: 'MASTERY MILESTONE',
};

function nextQuestFor(completed: QuestView, views: readonly QuestView[]): QuestMilestoneNext | null {
  const direct = views
    .filter((quest) => quest.prerequisite === completed.id && quest.unlocked && !quest.done)
    .sort((a, b) => a.order - b.order)[0];
  if (!direct) return null;
  return {
    id: direct.id,
    name: direct.name,
    description: direct.desc,
    location: direct.location,
  };
}

/**
 * 기존 완료 기록은 조용히 기준선으로 삼고, 이번 새로고침에서 처음 끝난 기록만 한 장으로 묶는다.
 * 여러 단계가 동시에 끝나도 가장 서사적인 한 건을 앞에 두고 나머지는 카드 안에 요약한다.
 */
export function questMilestoneNotice(
  previousCompletedIds: ReadonlySet<string>,
  views: readonly QuestView[],
  unlockedBadgeIds: readonly string[] = [],
): QuestMilestoneNotice | null {
  const completed = views
    .filter((quest) => quest.done && !previousCompletedIds.has(quest.id))
    .sort((a, b) => CATEGORY_PRIORITY[b.category] - CATEGORY_PRIORITY[a.category]
      || a.order - b.order || a.name.localeCompare(b.name));
  const primary = completed[0];
  if (!primary) return null;

  const badges = unlockedBadgeIds
    .map((id) => BADGE_BY_ID.get(id))
    .filter((badge): badge is BadgeDef => !!badge);
  const badge = badges.find((candidate) => candidate.questId === primary.id) ?? null;
  const extra = completed.slice(1);
  return {
    id: `quest:${completed.map((quest) => quest.id).join('+')}`,
    category: primary.category,
    eyebrow: CATEGORY_EYEBROW[primary.category],
    title: primary.name,
    description: primary.desc,
    progressLabel: primary.category === 'daily'
      ? '오늘의 기록 완료 · 모험 일지에서 코인 받기'
      : `${primary.goal.toLocaleString()} / ${primary.goal.toLocaleString()} · 영구 기록`,
    rewardLabel: primary.category === 'daily'
      ? `${primary.reward.toLocaleString()} 코인 보상 준비`
      : badge?.name ?? primary.rewardLabel ?? null,
    badge,
    next: nextQuestFor(primary, views),
    extraCount: extra.length,
    extraTitles: extra.slice(0, 3).map((quest) => quest.name),
  };
}

export function completedQuestIds(views: readonly QuestView[]): Set<string> {
  return new Set(views.filter((quest) => quest.done).map((quest) => quest.id));
}

export function normalizeQuestMilestoneHistory(
  raw: unknown,
  baselineIds: ReadonlySet<string> = new Set(),
): QuestMilestoneHistoryState {
  const value = (raw ?? {}) as Partial<QuestMilestoneHistoryState>;
  const saved = Array.isArray(value.seenCompletedQuestIds)
    ? value.seenCompletedQuestIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [...baselineIds];
  return { version: 1, seenCompletedQuestIds: [...new Set(saved)].slice(-1_000) };
}

/**
 * 재접속 때 과거 수백 건을 다시 축하하지 않으면서, 집 같은 다른 씬에서 막 끝난 기록은
 * 아이소메트릭 마을에 돌아왔을 때 한 번 보여 주는 사용자별 영구 수신함.
 */
export class QuestMilestoneHistoryStore {
  private state: QuestMilestoneHistoryState;
  private readonly key: string;

  constructor(userId: string, baselineIds: ReadonlySet<string>) {
    this.key = `hv-quest-milestone-history-${userId}`;
    let raw: unknown = null;
    let found = false;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) {
        raw = JSON.parse(saved);
        found = true;
      }
    } catch { /* 세션 한정 */ }
    this.state = normalizeQuestMilestoneHistory(found ? raw : null, baselineIds);
    this.persist();
  }

  seenCompletedIds(): Set<string> {
    return new Set(this.state.seenCompletedQuestIds);
  }

  remember(ids: ReadonlySet<string>): void {
    const merged = [...new Set([...this.state.seenCompletedQuestIds, ...ids])].slice(-1_000);
    if (merged.length === this.state.seenCompletedQuestIds.length
      && merged.every((id, index) => id === this.state.seenCompletedQuestIds[index])) return;
    this.state = { version: 1, seenCompletedQuestIds: merged };
    this.persist();
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
