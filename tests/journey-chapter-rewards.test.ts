import { beforeEach, describe, expect, it } from 'vitest';
import { BADGES } from '../src/game/achievements';
import { fashionPresetViews } from '../src/game/art/closet';
import { FurnitureReformStore } from '../src/game/home/furnitureReform';
import { petAccessoryViews } from '../src/game/pets/petProfiles';
import { normalizeState } from '../src/game/questProgress';
import { ALL_QUESTS } from '../src/game/quests';
import {
  JOURNEY_CHAPTER_REWARDS, journeyChapterRewardViews,
} from '../src/game/progression/journeyChapterRewards';
import { TASTE_SETS, tasteSetProgress, tasteSetViews } from '../src/game/progression/tasteSetArchive';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('메인 여정 3종 테마 보상', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('8개 장이 각각 고유한 코디·동행 장식·가구 리폼 세트를 가진다', () => {
    expect(JOURNEY_CHAPTER_REWARDS).toHaveLength(8);
    expect(JOURNEY_CHAPTER_REWARDS.map((reward) => reward.chapter)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(JOURNEY_CHAPTER_REWARDS.map((reward) => reward.outfit.id)).size).toBe(8);
    expect(new Set(JOURNEY_CHAPTER_REWARDS.map((reward) => reward.petAccessory.id)).size).toBe(8);
    expect(new Set(JOURNEY_CHAPTER_REWARDS.map((reward) => reward.homeRecipe.id)).size).toBe(8);
    expect(new Set(JOURNEY_CHAPTER_REWARDS.map((reward) => `${reward.homeRecipe.style.finishId}:${reward.homeRecipe.style.colorId}`)).size).toBe(8);
  });

  it('각 장의 기존 여정 퀘스트 배지를 해금 키로 그대로 쓴다', () => {
    const questIds = new Set(ALL_QUESTS.map((quest) => quest.id));
    const badgeIds = new Set(BADGES.map((badge) => badge.id));
    for (const reward of JOURNEY_CHAPTER_REWARDS) {
      expect(reward.badgeId).toBe(`badge_journey_reward_${reward.chapter}`);
      expect(questIds.has(`journey_reward_${reward.chapter}`)).toBe(true);
      expect(badgeIds.has(reward.badgeId)).toBe(true);
    }
    const views = journeyChapterRewardViews(['badge_journey_reward_3']);
    expect(views.find((reward) => reward.chapter === 3)?.unlocked).toBe(true);
    expect(views.filter((reward) => reward.chapter !== 3).every((reward) => !reward.unlocked)).toBe(true);
  });

  it('배지 하나로 옷장·펫 프로필·취향 세트가 동시에 열린다', () => {
    const badges = ['badge_journey_reward_5'];
    expect(fashionPresetViews(badges).find((preset) => preset.id === 'small_museum_curator')?.unlocked).toBe(true);
    expect(petAccessoryViews({ affinity: 0, plays: 0, trainings: 0, tricks: 0, memories: 0 }, badges)
      .find((accessory) => accessory.id === 'museum_ribbon')?.unlocked).toBe(true);
    expect(tasteSetViews(badges).find((set) => set.id === 'journey_5')).toMatchObject({ unlocked: true, source: 'journey-chapter' });
    expect(tasteSetProgress(badges)).toMatchObject({ unlockedSets: 1, unlockedPieces: 3, journeySets: 1 });
    expect(TASTE_SETS.filter((set) => set.source === 'journey-chapter')).toHaveLength(8);
  });

  it('완결 배지의 전용 리폼 레시피는 일반 생활 조건보다 먼저 쓸 수 있다', () => {
    const store = new FurnitureReformStore('journey-reward');
    const quests = normalizeState(null, '2026-07-23');
    const recipe = { finishId: 'patina', colorId: 'marigold' } as const;
    expect(store.apply('p1', 'bed_basic', recipe, quests)).toMatchObject({ ok: false, reason: 'locked-finish' });
    expect(store.apply('p1', 'bed_basic', recipe, quests, ['badge_journey_reward_8']))
      .toMatchObject({ ok: true, newCombination: true });
  });
});
