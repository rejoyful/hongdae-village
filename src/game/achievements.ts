import { ALL_QUESTS, type QuestCategory } from './quests';
import type { QuestView } from './questProgress';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface BadgeDef {
  id: string;
  questId: string;
  name: string;
  source: string;
  hint: string;
  category: Exclude<QuestCategory, 'daily'>;
  rarity: BadgeRarity;
}

export interface AchievementState {
  version: 1;
  unlocked: string[];
  equipped: string | null;
}

export interface BadgeView extends BadgeDef {
  unlocked: boolean;
  equipped: boolean;
}

const RARITY_BY_CATEGORY: Record<Exclude<QuestCategory, 'daily'>, BadgeRarity> = {
  onboarding: 'common',
  story: 'uncommon',
  collection: 'rare',
  mastery: 'epic',
};

/** 모든 장기 퀘스트 보상은 실제 장착 가능한 배지가 된다. */
export const BADGES: BadgeDef[] = ALL_QUESTS
  .filter((q): q is typeof q & { category: Exclude<QuestCategory, 'daily'>; rewardLabel: string } =>
    q.category !== 'daily' && typeof q.rewardLabel === 'string',
  )
  .map((q) => ({
    id: `badge_${q.id}`,
    questId: q.id,
    name: q.rewardLabel,
    source: q.name,
    hint: q.desc,
    category: q.category,
    rarity: RARITY_BY_CATEGORY[q.category],
  }));

export const BADGE_BY_ID = new Map(BADGES.map((badge) => [badge.id, badge]));

export function normalizeAchievementState(raw: unknown): AchievementState {
  const obj = (raw ?? {}) as Partial<AchievementState>;
  const unlocked = Array.isArray(obj.unlocked)
    ? [...new Set(obj.unlocked.filter((id): id is string => typeof id === 'string' && BADGE_BY_ID.has(id)))]
    : [];
  const equipped = typeof obj.equipped === 'string' && unlocked.includes(obj.equipped)
    ? obj.equipped
    : null;
  return { version: 1, unlocked, equipped };
}

export function syncAchievementState(
  state: AchievementState,
  quests: QuestView[],
): { state: AchievementState; newlyUnlocked: string[] } {
  const done = new Set(quests.filter((q) => q.done).map((q) => q.id));
  const newlyUnlocked = BADGES
    .filter((badge) => done.has(badge.questId) && !state.unlocked.includes(badge.id))
    .map((badge) => badge.id);
  if (!newlyUnlocked.length) return { state, newlyUnlocked };
  const unlocked = [...state.unlocked, ...newlyUnlocked];
  return {
    state: { ...state, unlocked, equipped: state.equipped ?? newlyUnlocked[0]! },
    newlyUnlocked,
  };
}

export function equipBadge(state: AchievementState, badgeId: string | null): AchievementState {
  if (badgeId !== null && !state.unlocked.includes(badgeId)) return state;
  if (state.equipped === badgeId) return state;
  return { ...state, equipped: badgeId };
}

export function mergeAchievementUnlocks(state: AchievementState, badgeIds: readonly string[]): AchievementState {
  const incoming = [...new Set(badgeIds.filter((id) => BADGE_BY_ID.has(id) && !state.unlocked.includes(id)))];
  if (!incoming.length) return state;
  const unlocked = [...state.unlocked, ...incoming];
  return { ...state, unlocked, equipped: state.equipped ?? incoming[0]! };
}

export function badgeViews(state: AchievementState): BadgeView[] {
  const unlocked = new Set(state.unlocked);
  return BADGES.map((badge) => ({
    ...badge,
    unlocked: unlocked.has(badge.id),
    equipped: state.equipped === badge.id,
  }));
}

export class AchievementStore {
  private state: AchievementState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-achievements-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeAchievementState(raw);
    this.persist();
  }

  get(): AchievementState { return this.state; }
  views(): BadgeView[] { return badgeViews(this.state); }
  equipped(): BadgeDef | null { return this.state.equipped ? (BADGE_BY_ID.get(this.state.equipped) ?? null) : null; }

  sync(quests: QuestView[]): string[] {
    const result = syncAchievementState(this.state, quests);
    this.state = result.state;
    if (result.newlyUnlocked.length) this.persist();
    return result.newlyUnlocked;
  }

  mergeVerified(badgeIds: readonly string[]): string[] {
    const next = mergeAchievementUnlocks(this.state, badgeIds);
    if (next === this.state) return [];
    const newly = next.unlocked.filter((id) => !this.state.unlocked.includes(id));
    this.state = next;
    this.persist();
    return newly;
  }

  equip(badgeId: string | null): boolean {
    const next = equipBadge(this.state, badgeId);
    if (next === this.state) return false;
    this.state = next;
    this.persist();
    return true;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
