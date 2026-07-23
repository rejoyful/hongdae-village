import { describe, expect, it } from 'vitest';
import { BADGE_BY_ID } from '../src/game/achievements';
import { FASHION_PRESETS, fashionPresetViews } from '../src/game/art/closet';
import { PET_ACCESSORIES, petAccessoryViews } from '../src/game/pets/petProfiles';
import { STARTER_COMPASS_ROUTES } from '../src/game/progression/starterCompass';
import {
  STARTER_MENTOR_REWARDS, starterMentorRewardViews,
} from '../src/game/progression/starterMentorRewards';
import { TASTE_SETS, tasteSetProgress, tasteSetViews } from '../src/game/progression/tasteSetArchive';
import { unlockedVillageFurnitureRecipe } from '../src/game/progression/villageRewards';

describe('첫 생활 멘토 통합 완주 보상', () => {
  it('여섯 루트가 각자 고유한 코디·동행 장식·집 리폼과 실제 퀘스트 배지를 가진다', () => {
    expect(STARTER_MENTOR_REWARDS.map((reward) => reward.routeId)).toEqual(STARTER_COMPASS_ROUTES.map((route) => route.id));
    expect(new Set(STARTER_MENTOR_REWARDS.map((reward) => reward.badgeId)).size).toBe(6);
    expect(new Set(STARTER_MENTOR_REWARDS.map((reward) => reward.outfit.id)).size).toBe(6);
    expect(new Set(STARTER_MENTOR_REWARDS.map((reward) => reward.petAccessory.id)).size).toBe(6);
    expect(new Set(STARTER_MENTOR_REWARDS.map((reward) => reward.homeRecipe.id)).size).toBe(6);
    expect(STARTER_MENTOR_REWARDS.every((reward) => BADGE_BY_ID.has(reward.badgeId))).toBe(true);
  });

  it('한 루트 완주 배지가 세 시스템과 통합 취향 수첩을 동시에 연다', () => {
    const reward = STARTER_MENTOR_REWARDS[0]!;
    const badges = [reward.badgeId];
    expect(starterMentorRewardViews(badges).find((view) => view.routeId === reward.routeId)?.unlocked).toBe(true);
    expect(fashionPresetViews(badges).find((preset) => preset.id === reward.outfit.id)?.unlocked).toBe(true);
    expect(petAccessoryViews(
      { affinity: 0, plays: 0, trainings: 0, tricks: 0, memories: 0 }, badges,
    ).find((accessory) => accessory.id === reward.petAccessory.id)?.unlocked).toBe(true);
    expect(unlockedVillageFurnitureRecipe(reward.homeRecipe.style, badges)?.homeRecipe.id).toBe(reward.homeRecipe.id);
    expect(tasteSetViews(badges).find((set) => set.id === `mentor_${reward.routeId}`)).toMatchObject({
      unlocked: true, source: 'starter-mentor',
    });
    expect(tasteSetProgress(badges)).toMatchObject({ unlockedSets: 1, unlockedPieces: 3, mentorSets: 1 });
  });

  it('완주 구성품은 기존 선택 화면의 실제 카탈로그에 모두 등록된다', () => {
    for (const reward of STARTER_MENTOR_REWARDS) {
      expect(FASHION_PRESETS.some((preset) => preset.id === reward.outfit.id)).toBe(true);
      expect(PET_ACCESSORIES.some((accessory) => accessory.id === reward.petAccessory.id)).toBe(true);
      expect(TASTE_SETS.some((set) => set.id === `mentor_${reward.routeId}`)).toBe(true);
    }
  });
});
