import { beforeEach, describe, expect, it } from 'vitest';
import {
  TASTE_SET_FEATURED_MAX, TASTE_SETS, TasteSetArchiveStore, normalizeTasteSetArchiveState,
  tasteSetProgress, tasteSetViews,
} from '../src/game/progression/tasteSetArchive';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('통합 취향 세트 수첩', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('마을 레벨 6세트·연속 이야기 8세트·메인 여정 8세트·첫 생활 멘토 6세트가 84개 구성품을 이룬다', () => {
    expect(TASTE_SETS).toHaveLength(28);
    expect(TASTE_SETS.filter((set) => set.source === 'village-level')).toHaveLength(6);
    expect(TASTE_SETS.filter((set) => set.source === 'request-story')).toHaveLength(8);
    expect(TASTE_SETS.filter((set) => set.source === 'journey-chapter')).toHaveLength(8);
    expect(TASTE_SETS.filter((set) => set.source === 'starter-mentor')).toHaveLength(6);
    expect(new Set(TASTE_SETS.map((set) => set.id)).size).toBe(28);
    expect(new Set(TASTE_SETS.map((set) => set.outfit.id)).size).toBe(28);
    expect(new Set(TASTE_SETS.map((set) => set.petAccessory.id)).size).toBe(28);
    expect(new Set(TASTE_SETS.map((set) => set.homeRecipe.id)).size).toBe(28);
    expect(tasteSetProgress([])).toMatchObject({ unlockedSets: 0, totalSets: 28, unlockedPieces: 0, totalPieces: 84, journeySets: 0, mentorSets: 0 });
  });

  it('배지 하나가 세 구성품과 정확히 한 세트를 동시에 연다', () => {
    const views = tasteSetViews(['badge_story_request_reward_rain_map']);
    expect(views.find((set) => set.id === 'story_rain_map')).toMatchObject({ unlocked: true, featured: false });
    expect(views.filter((set) => set.unlocked)).toHaveLength(1);
    expect(tasteSetProgress(['badge_story_request_reward_rain_map'])).toMatchObject({
      unlockedSets: 1, unlockedPieces: 3, villageSets: 0, storySets: 1,
      journeySets: 0,
    });
  });

  it('대표 전시는 해금한 세트만 세 칸까지 올리고 소장 기록과 분리해 저장한다', () => {
    const badges = TASTE_SETS.slice(0, 4).map((set) => set.badgeId);
    const store = new TasteSetArchiveStore('feature');
    expect(store.toggleFeatured(TASTE_SETS[4]!.id, badges)).toBe('locked');
    expect(store.toggleFeatured(TASTE_SETS[0]!.id, badges)).toBe('added');
    expect(store.toggleFeatured(TASTE_SETS[1]!.id, badges)).toBe('added');
    expect(store.toggleFeatured(TASTE_SETS[2]!.id, badges)).toBe('added');
    expect(store.toggleFeatured(TASTE_SETS[3]!.id, badges)).toBe('full');
    expect(store.progress(badges)).toMatchObject({ unlockedSets: 4, featuredSets: TASTE_SET_FEATURED_MAX });
    expect(store.toggleFeatured(TASTE_SETS[1]!.id, badges)).toBe('removed');
    expect(new TasteSetArchiveStore('feature').get().featuredIds).toEqual([TASTE_SETS[0]!.id, TASTE_SETS[2]!.id]);
  });

  it('손상된 대표 전시는 중복·미지 세트를 제거하고 최대 세 칸만 복구한다', () => {
    const ids = TASTE_SETS.slice(0, 4).map((set) => set.id);
    expect(normalizeTasteSetArchiveState({ featuredIds: [ids[0], 'fake', ids[0], ids[1], ids[2], ids[3]] }).featuredIds)
      .toEqual(ids.slice(0, 3));
  });
});
