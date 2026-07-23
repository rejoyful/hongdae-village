import type { Appearance } from '../art/appearance';
import type { FurnitureReformStyle } from '../home/furnitureReform';
import type { PetAccessoryId } from '../pets/petProfiles';
import { REQUEST_STORY_REWARDS } from './requestStoryRewards';
import { VILLAGE_LEVEL_REWARDS } from './villageRewards';
import { JOURNEY_CHAPTER_REWARDS } from './journeyChapterRewards';
import { STARTER_MENTOR_REWARDS } from './starterMentorRewards';

export type TasteSetSource = 'village-level' | 'request-story' | 'journey-chapter' | 'starter-mentor';

export interface TasteSetDef {
  id: string;
  source: TasteSetSource;
  badgeId: string;
  mark: string;
  title: string;
  note: string;
  unlockHint: string;
  outfit: { id: string; name: string; blurb: string; style: Partial<Appearance> };
  petAccessory: { id: PetAccessoryId; mark: string; name: string; description: string };
  homeRecipe: { id: string; name: string; description: string; style: FurnitureReformStyle };
}

export interface TasteSetArchiveState {
  version: 1;
  featuredIds: string[];
}

export interface TasteSetProgress {
  unlockedSets: number;
  totalSets: number;
  unlockedPieces: number;
  totalPieces: number;
  villageSets: number;
  storySets: number;
  journeySets: number;
  mentorSets: number;
  featuredSets: number;
}

export const TASTE_SET_FEATURED_MAX = 3;

/** 레벨·연속 이야기·메인 여정·첫 생활 멘토 보상을 한 권에서 감상하는 28개 통합 취향 세트. */
export const TASTE_SETS: readonly TasteSetDef[] = [
  ...VILLAGE_LEVEL_REWARDS.map((reward): TasteSetDef => ({
    id: `level_${reward.level}`,
    source: 'village-level',
    badgeId: reward.badgeId,
    mark: String(reward.level),
    title: reward.title,
    note: reward.note,
    unlockHint: `마을 Lv.${reward.level} 명찰`,
    outfit: reward.outfit,
    petAccessory: reward.petAccessory,
    homeRecipe: reward.homeRecipe,
  })),
  ...REQUEST_STORY_REWARDS.map((reward): TasteSetDef => ({
    id: `story_${reward.storyId}`,
    source: 'request-story',
    badgeId: reward.badgeId,
    mark: reward.petAccessory.mark,
    title: reward.title,
    note: reward.note,
    unlockHint: '해당 연속 의뢰 3장 완결',
    outfit: reward.outfit,
    petAccessory: reward.petAccessory,
    homeRecipe: reward.homeRecipe,
  })),
  ...JOURNEY_CHAPTER_REWARDS.map((reward): TasteSetDef => ({
    id: `journey_${reward.chapter}`,
    source: 'journey-chapter',
    badgeId: reward.badgeId,
    mark: String(reward.chapter),
    title: reward.title,
    note: reward.note,
    unlockHint: `메인 여정 제${reward.chapter}장 완결`,
    outfit: reward.outfit,
    petAccessory: reward.petAccessory,
    homeRecipe: reward.homeRecipe,
  })),
  ...STARTER_MENTOR_REWARDS.map((reward): TasteSetDef => ({
    id: `mentor_${reward.routeId}`,
    source: 'starter-mentor',
    badgeId: reward.badgeId,
    mark: reward.petAccessory.mark,
    title: reward.title,
    note: reward.note,
    unlockHint: '해당 첫 생활 멘토 루트 3장 완주',
    outfit: reward.outfit,
    petAccessory: reward.petAccessory,
    homeRecipe: reward.homeRecipe,
  })),
] as const;

export const TASTE_SET_BY_ID = new Map(TASTE_SETS.map((set) => [set.id, set]));

export function normalizeTasteSetArchiveState(raw: unknown): TasteSetArchiveState {
  const value = (raw ?? {}) as Partial<TasteSetArchiveState>;
  const featuredIds = Array.isArray(value.featuredIds)
    ? [...new Set(value.featuredIds.filter((id): id is string => typeof id === 'string' && TASTE_SET_BY_ID.has(id)))].slice(0, TASTE_SET_FEATURED_MAX)
    : [];
  return { version: 1, featuredIds };
}

export function tasteSetViews(unlockedBadgeIds: Iterable<string>, featuredIds: Iterable<string> = []) {
  const unlocked = new Set(unlockedBadgeIds);
  const featured = new Set(featuredIds);
  return TASTE_SETS.map((set) => ({ ...set, unlocked: unlocked.has(set.badgeId), featured: featured.has(set.id) }));
}

export function tasteSetProgress(
  unlockedBadgeIds: Iterable<string>, featuredIds: Iterable<string> = [],
): TasteSetProgress {
  const views = tasteSetViews(unlockedBadgeIds, featuredIds);
  const unlocked = views.filter((set) => set.unlocked);
  return {
    unlockedSets: unlocked.length,
    totalSets: views.length,
    unlockedPieces: unlocked.length * 3,
    totalPieces: views.length * 3,
    villageSets: unlocked.filter((set) => set.source === 'village-level').length,
    storySets: unlocked.filter((set) => set.source === 'request-story').length,
    journeySets: unlocked.filter((set) => set.source === 'journey-chapter').length,
    mentorSets: unlocked.filter((set) => set.source === 'starter-mentor').length,
    featuredSets: views.filter((set) => set.featured && set.unlocked).length,
  };
}

export type TasteSetFeatureResult = 'added' | 'removed' | 'locked' | 'full' | 'unknown';

export class TasteSetArchiveStore {
  private state: TasteSetArchiveState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-taste-set-archive-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeTasteSetArchiveState(raw);
    this.persist();
  }

  get(): TasteSetArchiveState { return this.state; }
  progress(unlockedBadgeIds: Iterable<string>): TasteSetProgress { return tasteSetProgress(unlockedBadgeIds, this.state.featuredIds); }

  toggleFeatured(id: string, unlockedBadgeIds: Iterable<string>): TasteSetFeatureResult {
    const set = TASTE_SET_BY_ID.get(id);
    if (!set) return 'unknown';
    const index = this.state.featuredIds.indexOf(id);
    if (index >= 0) {
      this.state.featuredIds.splice(index, 1); this.persist(); return 'removed';
    }
    if (!new Set(unlockedBadgeIds).has(set.badgeId)) return 'locked';
    if (this.state.featuredIds.length >= TASTE_SET_FEATURED_MAX) return 'full';
    this.state.featuredIds.push(id); this.persist(); return 'added';
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
