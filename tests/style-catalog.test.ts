import { describe, expect, it } from 'vitest';
import { BADGE_BY_ID, BADGES } from '../src/game/achievements';
import {
  STYLE_OPTIONS, cycleStyleOption, styleCatalogProgress, styleOptionViews,
} from '../src/game/art/styleCatalog';

describe('수집형 스타일 도감', () => {
  it('기본 18종과 희귀 10종, 총 28종으로 구성된다', () => {
    expect(STYLE_OPTIONS).toHaveLength(28);
    expect(STYLE_OPTIONS.filter((option) => option.rarity === 'starter')).toHaveLength(18);
    expect(STYLE_OPTIONS.filter((option) => option.rarity === 'rare')).toHaveLength(10);
    expect(styleCatalogProgress([])).toEqual({ unlocked: 18, total: 28, rareUnlocked: 0, rareTotal: 10 });
  });

  it('모든 희귀 스타일의 요구 배지가 실제 퀘스트 보상으로 존재한다', () => {
    for (const option of STYLE_OPTIONS.filter((item) => item.requiredBadgeId)) {
      expect(BADGE_BY_ID.has(option.requiredBadgeId!)).toBe(true);
    }
  });

  it('초보 모험가 배지는 눈매와 얼굴 포인트 두 종을 연다', () => {
    const unlocked = styleOptionViews(['badge_intro_hunt']).filter((option) => option.rarity === 'rare' && option.unlocked);
    expect(unlocked.map((option) => option.id)).toEqual(['eyeStyle-4', 'faceDetail-4']);
  });

  it('화살표 순환은 잠긴 눈매를 건너뛴다', () => {
    expect(cycleStyleOption('eyeStyle', 3, 1, [])).toBe(0);
    expect(cycleStyleOption('eyeStyle', 0, -1, [])).toBe(3);
    expect(cycleStyleOption('eyeStyle', 3, 1, ['badge_intro_hunt'])).toBe(4);
  });

  it('모든 배지를 얻으면 28종 전체가 열린다', () => {
    expect(styleCatalogProgress(BADGES.map((badge) => badge.id))).toEqual({
      unlocked: 28, total: 28, rareUnlocked: 10, rareTotal: 10,
    });
  });
});
