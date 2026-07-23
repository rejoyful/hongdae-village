import type { Appearance } from '../art/appearance';
import type { FurnitureReformStyle } from '../home/furnitureReform';

export type JourneyChapter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type JourneyRewardPetAccessoryId =
  | 'map_pin_tag'
  | 'window_lantern'
  | 'seed_pouch'
  | 'neighbor_seat_tag'
  | 'museum_ribbon'
  | 'guild_satchel'
  | 'index_scarf'
  | 'next_page_cape';

export interface JourneyChapterRewardDef {
  chapter: JourneyChapter;
  badgeId: string;
  title: string;
  note: string;
  outfit: { id: string; name: string; blurb: string; style: Partial<Appearance> };
  petAccessory: {
    id: JourneyRewardPetAccessoryId;
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

/** 메인 여정 한 장의 완결 배지가 코디·동행 장식·집 리폼을 동시에 여는 영구 보상 전집. */
export const JOURNEY_CHAPTER_REWARDS: readonly JourneyChapterRewardDef[] = [
  {
    chapter: 1, badgeId: 'badge_journey_reward_1', title: '첫 안내판 세트',
    note: '처음 외운 골목의 점토색과 새로 꽂은 지도핀을 담았어요.',
    outfit: { id: 'alley_map_maker', name: '골목 지도 제작자', blurb: '지도 조끼와 가벼운 안내 가방의 첫 장 코디', style: { topStyle: 4, topPattern: 2, shirt: 'd8b886', bottomStyle: 2, pants: 5, shoeStyle: 4, sockStyle: 1, accent: '7f9279', glasses: 1, back: 4 } },
    petAccessory: { id: 'map_pin_tag', mark: '핀', name: '첫 골목 지도핀', description: '서로를 잃지 않도록 첫 지도 한가운데 꽂아 둔 점토색 표식입니다.' },
    homeRecipe: { id: 'guideboard_clay', name: '안내판 점토', description: '분필 자국이 포근하게 남는 무광 점토색 가구 마감입니다.', style: { finishId: 'matte', colorId: 'clay' } },
  },
  {
    chapter: 2, badgeId: 'badge_journey_reward_2', title: '돌아올 불빛 세트',
    note: '집과 동행이 기다리는 창가의 따뜻한 불빛을 모았어요.',
    outfit: { id: 'window_light_keeper', name: '창가 불빛지기', blurb: '포근한 가디건과 작은 집 열쇠를 곁들인 귀가 코디', style: { topStyle: 3, topPattern: 5, shirt: 'f2ead8', bottomStyle: 3, pants: 8, shoeStyle: 2, sockStyle: 3, accent: 'f2a85c', back: 1 } },
    petAccessory: { id: 'window_lantern', mark: '빛', name: '창문 등불', description: '늦은 산책에서도 돌아올 창을 알아보게 해 주는 작은 등불입니다.' },
    homeRecipe: { id: 'returning_oat', name: '돌아올 오트', description: '오래 켜 둔 창가 불빛처럼 따뜻한 오트색 석회 마감입니다.', style: { finishId: 'limewash', colorId: 'oat' } },
  },
  {
    chapter: 3, badgeId: 'badge_journey_reward_3', title: '손끝 골목 세트',
    note: '씨앗과 공구, 다시 쓰는 물건에서 발견한 생활의 색이에요.',
    outfit: { id: 'alley_life_maker', name: '골목 생활 제작자', blurb: '넉넉한 작업복과 씨앗 주머니를 묶은 손끝 코디', style: { topStyle: 4, topPattern: 3, shirt: '9cc79c', bottomStyle: 4, pants: 5, shoeStyle: 1, sockStyle: 2, accent: 'b85f72', back: 2 } },
    petAccessory: { id: 'seed_pouch', mark: '싹', name: '씨앗 공구 주머니', description: '작은 씨앗과 잃어버리기 쉬운 나사를 함께 챙기는 동행용 주머니입니다.' },
    homeRecipe: { id: 'handmade_berry_linen', name: '손끝 베리 리넨', description: '손때가 편안하게 스며드는 리넨에 잘 익은 열매색을 얹습니다.', style: { finishId: 'linen', colorId: 'berry' } },
  },
  {
    chapter: 4, badgeId: 'badge_journey_reward_4', title: '열 이름 저녁 세트',
    note: '한 테이블에 모인 서로 다른 이름과 저녁의 온도를 남겼어요.',
    outfit: { id: 'alley_supper_host', name: '골목 저녁 호스트', blurb: '편안한 재킷과 빈 의자 명찰을 챙긴 이웃맞이 코디', style: { topStyle: 2, topPattern: 1, shirt: 'aa6e64', bottomStyle: 1, pants: 5, shoeStyle: 2, sockStyle: 0, accent: 'd4be93', back: 4 } },
    petAccessory: { id: 'neighbor_seat_tag', mark: '이', name: '빈 의자 이름표', description: '늦게 온 이웃도 자기 자리를 바로 찾을 수 있게 만든 황동 이름표입니다.' },
    homeRecipe: { id: 'supper_clay_patina', name: '저녁 점토 녹청', description: '여럿이 둘러앉은 오래된 식탁처럼 점토색 위에 시간의 결을 냅니다.', style: { finishId: 'patina', colorId: 'clay' } },
  },
  {
    chapter: 5, badgeId: 'badge_journey_reward_5', title: '작은 것 박물관 세트',
    note: '사소해서 더 오래 간직하고 싶은 생활 소장품의 빛이에요.',
    outfit: { id: 'small_museum_curator', name: '생활 소장품 큐레이터', blurb: '진열 리본과 기록 토트백의 작은 박물관 코디', style: { topStyle: 5, topPattern: 4, shirt: 'c8a8d8', bottomStyle: 3, pants: 10, shoeStyle: 3, sockStyle: 3, accent: 'f2a85c', hat: 1, back: 4 } },
    petAccessory: { id: 'museum_ribbon', mark: '장', name: '미니 진열 리본', description: '함께 주운 작은 물건도 훌륭한 소장품이라고 알려 주는 전시 리본입니다.' },
    homeRecipe: { id: 'collection_marigold', name: '소장품 메리골드', description: '작은 물건의 윤곽이 또렷하게 살아나는 메리골드 무광 마감입니다.', style: { finishId: 'matte', colorId: 'marigold' } },
  },
  {
    chapter: 6, badgeId: 'badge_journey_reward_6', title: '네 갈래 길드 세트',
    note: '한 가지 이름에 갇히지 않는 다분야 생활인의 도구를 모았어요.',
    outfit: { id: 'many_life_guildmate', name: '다분야 생활 길드원', blurb: '네 칸 작업 가방과 튼튼한 부츠의 길드 코디', style: { topStyle: 4, topPattern: 2, shirt: '6e7f76', bottomStyle: 4, pants: 6, shoeStyle: 1, sockStyle: 2, accent: 'b85f72', back: 2 } },
    petAccessory: { id: 'guild_satchel', mark: '네', name: '네 칸 길드 가방', description: '서로 다른 네 가지 생활 도구를 뒤섞이지 않게 담는 작은 작업 가방입니다.' },
    homeRecipe: { id: 'guild_berry_wood', name: '길드 베리 나뭇결', description: '여러 작업대가 한 공간에 자연스럽게 어울리는 열매색 나뭇결입니다.', style: { finishId: 'woodgrain', colorId: 'berry' } },
  },
  {
    chapter: 7, badgeId: 'badge_journey_reward_7', title: '마을 편집실 세트',
    note: '사라지기 전의 이름과 장소를 다음 사람에게 건네는 색이에요.',
    outfit: { id: 'alley_chronicle_editor', name: '골목 연대기 편집자', blurb: '먹빛 재킷과 인명 색인을 갖춘 기록실 코디', style: { topStyle: 2, topPattern: 4, shirt: '4a4e5c', bottomStyle: 0, pants: 6, shoeStyle: 2, sockStyle: 0, accent: 'd4c39d', glasses: 1, back: 4 } },
    petAccessory: { id: 'index_scarf', mark: '록', name: '인명 색인 목도리', description: '골목에서 만난 이름을 한 글자씩 수놓은 길고 포근한 목도리입니다.' },
    homeRecipe: { id: 'editorial_ink', name: '편집실 먹빛', description: '오래된 원고의 가장자리처럼 깊고 보드라운 먹빛 석회 마감입니다.', style: { finishId: 'limewash', colorId: 'ink' } },
  },
  {
    chapter: 8, badgeId: 'badge_journey_reward_8', title: '다음 페이지 별빛 세트',
    note: '완결보다 다음 생활을 시작하게 하는 별빛 한 장을 남겼어요.',
    outfit: { id: 'next_chapter_protagonist', name: '다음 장의 주인공', blurb: '별빛 한복과 다음 페이지 망토의 완결 코디', style: { topStyle: 7, topPattern: 5, shirt: '4d5870', bottomStyle: 5, pants: 10, shoeStyle: 2, sockStyle: 1, accent: 'd8bd79', back: 3 } },
    petAccessory: { id: 'next_page_cape', mark: '다', name: '다음 페이지 망토', description: '마지막 장 뒤에서도 함께 새 생활을 시작하자는 짧은 별빛 망토입니다.' },
    homeRecipe: { id: 'next_page_marigold', name: '별빛 메리골드 녹청', description: '오랜 시간과 새 별빛이 겹쳐 보이는 메리골드 녹청 마감입니다.', style: { finishId: 'patina', colorId: 'marigold' } },
  },
] as const;

export const JOURNEY_CHAPTER_REWARD_BY_CHAPTER = new Map(
  JOURNEY_CHAPTER_REWARDS.map((reward) => [reward.chapter, reward]),
);

export function journeyChapterRewardViews(unlockedBadgeIds: Iterable<string>) {
  const unlocked = new Set(unlockedBadgeIds);
  return JOURNEY_CHAPTER_REWARDS.map((reward) => ({ ...reward, unlocked: unlocked.has(reward.badgeId) }));
}
