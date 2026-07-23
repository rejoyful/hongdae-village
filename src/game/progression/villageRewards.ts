import type { Appearance } from '../art/appearance';
import type { FurnitureReformStyle } from '../home/furnitureReform';
import { REQUEST_STORY_REWARDS, type RequestStoryRewardDef } from './requestStoryRewards';
import { JOURNEY_CHAPTER_REWARDS, type JourneyChapterRewardDef } from './journeyChapterRewards';
import { STARTER_MENTOR_REWARDS, type StarterMentorRewardDef } from './starterMentorRewards';

export type VillageRewardPetAccessoryId =
  | 'walking_pin'
  | 'field_notebook'
  | 'regular_tag'
  | 'film_pouch'
  | 'artisan_cape'
  | 'chronicle_crown';

export interface VillageLevelRewardDef {
  level: 5 | 10 | 20 | 30 | 40 | 50;
  badgeId: string;
  title: string;
  note: string;
  outfit: { id: string; name: string; blurb: string; style: Partial<Appearance> };
  petAccessory: {
    id: VillageRewardPetAccessoryId;
    mark: string;
    name: string;
    description: string;
  };
  homeRecipe: {
    id: string;
    name: string;
    description: string;
    style: FurnitureReformStyle;
  };
}

/** 마을 레벨 명찰 하나가 코디·펫·집 꾸미기 세 보상을 함께 여는 단일 카탈로그. */
export const VILLAGE_LEVEL_REWARDS: readonly VillageLevelRewardDef[] = [
  {
    level: 5, badgeId: 'badge_master_village_level_5', title: '골목 산책자 꾸러미',
    note: '처음 익숙해진 골목의 햇살과 표지판을 담았어요.',
    outfit: { id: 'village_walker', name: '골목 산책자', blurb: '세이지 셔츠와 가벼운 산책 가방', style: { topStyle: 0, topPattern: 5, shirt: '9cc79c', bottomStyle: 2, pants: 5, shoeStyle: 4, sockStyle: 2, accent: 'f2d85c', back: 1 } },
    petAccessory: { id: 'walking_pin', mark: '산', name: '산책길 핀', description: '첫 산책길의 작은 잎을 눌러 만든 모자 핀입니다.' },
    homeRecipe: { id: 'sunny_oak', name: '햇살 원목', description: '아침 골목처럼 담백한 나뭇결과 오트밀 색감', style: { finishId: 'woodgrain', colorId: 'oat' } },
  },
  {
    level: 10, badgeId: 'badge_master_village_level_10', title: '생활 수집가 꾸러미',
    note: '작은 발견을 놓치지 않는 수집가의 도구를 모았어요.',
    outfit: { id: 'life_collector', name: '생활 수집가', blurb: '필드 노트와 포켓이 많은 수집 코디', style: { topStyle: 4, topPattern: 2, shirt: 'e8d8b8', bottomStyle: 4, pants: 6, shoeStyle: 1, sockStyle: 1, accent: '78927a', back: 4 } },
    petAccessory: { id: 'field_notebook', mark: '집', name: '필드 노트', description: '산책에서 찾은 냄새와 소리를 적는 조그만 수첩입니다.' },
    homeRecipe: { id: 'sage_linen', name: '세이지 리넨', description: '수집 선반을 차분하게 묶는 리넨과 회녹색', style: { finishId: 'linen', colorId: 'sage' } },
  },
  {
    level: 20, badgeId: 'badge_master_village_level_20', title: '마을 단골 꾸러미',
    note: '이름과 취향을 기억해 주는 단골의 온기를 담았어요.',
    outfit: { id: 'village_regular', name: '마을 단골', blurb: '카페 재킷과 오래 신어 편한 로퍼', style: { topStyle: 2, topPattern: 1, shirt: 'b9785f', bottomStyle: 0, pants: 5, shoeStyle: 2, sockStyle: 0, accent: 'e4c691', back: 0 } },
    petAccessory: { id: 'regular_tag', mark: '단', name: '단골 명찰', description: '골목 가게마다 반갑게 알아보는 황동 이름표입니다.' },
    homeRecipe: { id: 'cafe_walnut', name: '단골 카페 월넛', description: '오래 머물고 싶은 카페를 닮은 나뭇결과 점토색', style: { finishId: 'woodgrain', colorId: 'clay' } },
  },
  {
    level: 30, badgeId: 'badge_master_village_level_30', title: '취향 기록가 꾸러미',
    note: '필름 한 칸과 메모 한 줄까지 나다운 기록으로 남겨요.',
    outfit: { id: 'taste_archivist', name: '취향 기록가', blurb: '필름색 가디건과 기록용 토트백', style: { topStyle: 3, topPattern: 4, shirt: 'a36e76', bottomStyle: 3, pants: 8, shoeStyle: 3, sockStyle: 3, accent: 'd4b98d', back: 4 } },
    petAccessory: { id: 'film_pouch', mark: '록', name: '필름 파우치', description: '함께 본 장면을 한 칸씩 보관하는 작은 필름 가방입니다.' },
    homeRecipe: { id: 'film_rose', name: '필름 로즈', description: '빛바랜 사진처럼 부드러운 석회 덧칠과 꽃잎색', style: { finishId: 'limewash', colorId: 'petal' } },
  },
  {
    level: 40, badgeId: 'badge_master_village_level_40', title: '골목 장인 꾸러미',
    note: '오래 손본 물건에서만 나는 단단한 멋을 골랐어요.',
    outfit: { id: 'alley_artisan', name: '골목 장인', blurb: '황동 포인트와 튼튼한 작업복', style: { topStyle: 4, topPattern: 3, shirt: '6f7c68', bottomStyle: 4, pants: 5, shoeStyle: 1, sockStyle: 2, accent: 'c79b55', back: 2 } },
    petAccessory: { id: 'artisan_cape', mark: '장', name: '장인의 짧은 망토', description: '작업대를 지키는 작은 조수에게 어울리는 패치워크 망토입니다.' },
    homeRecipe: { id: 'artisan_brass', name: '장인의 황동', description: '손때 묻은 공방을 닮은 옻빛 광택과 메리골드', style: { finishId: 'lacquer', colorId: 'marigold' } },
  },
  {
    level: 50, badgeId: 'badge_master_village_level_50', title: '마을 연대기 꾸러미',
    note: '당신이 만든 골목의 시간을 오래 남길 마지막 한 장입니다.',
    outfit: { id: 'village_chronicle', name: '마을 연대기', blurb: '밤하늘 한복과 금빛 기록 장식', style: { topStyle: 7, topPattern: 5, shirt: '555b78', bottomStyle: 5, pants: 10, shoeStyle: 2, sockStyle: 1, accent: 'e5bd55', back: 3 } },
    petAccessory: { id: 'chronicle_crown', mark: '별', name: '연대기 월계관', description: '함께 걸어 온 모든 골목을 새긴 밤빛 월계관입니다.' },
    homeRecipe: { id: 'midnight_archive', name: '밤의 연대기', description: '오래된 기록실처럼 깊은 녹청과 먹빛', style: { finishId: 'patina', colorId: 'ink' } },
  },
] as const;

export function villageLevelRewardViews(unlockedBadgeIds: Iterable<string>) {
  const unlocked = new Set(unlockedBadgeIds);
  return VILLAGE_LEVEL_REWARDS.map((reward) => ({ ...reward, unlocked: unlocked.has(reward.badgeId) }));
}

export function unlockedVillageFurnitureRecipe(
  style: FurnitureReformStyle,
  unlockedBadgeIds: Iterable<string>,
): VillageLevelRewardDef | RequestStoryRewardDef | JourneyChapterRewardDef | StarterMentorRewardDef | null {
  const unlocked = new Set(unlockedBadgeIds);
  return [...VILLAGE_LEVEL_REWARDS, ...REQUEST_STORY_REWARDS, ...JOURNEY_CHAPTER_REWARDS, ...STARTER_MENTOR_REWARDS].find((reward) => unlocked.has(reward.badgeId)
    && reward.homeRecipe.style.finishId === style.finishId
    && reward.homeRecipe.style.colorId === style.colorId) ?? null;
}
