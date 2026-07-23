import type { Appearance } from '../art/appearance';
import type { FurnitureReformStyle } from '../home/furnitureReform';
import type { VillageRequestStoryId } from '../requests/villageRequestStories';

export type RequestStoryRewardPetAccessoryId =
  | 'umbrella_charm'
  | 'encore_headset'
  | 'letter_satchel'
  | 'editor_beret'
  | 'house_key_tag'
  | 'herb_neckerchief'
  | 'water_goggles'
  | 'lantern_cape';

export interface RequestStoryRewardDef {
  storyId: VillageRequestStoryId;
  badgeId: string;
  title: string;
  note: string;
  outfit: { id: string; name: string; blurb: string; style: Partial<Appearance> };
  petAccessory: {
    id: RequestStoryRewardPetAccessoryId;
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

export const requestStoryMetricKey = (storyId: VillageRequestStoryId): string => `village_request_story_${storyId}`;
export const requestStoryRewardQuestId = (storyId: VillageRequestStoryId): string => `story_request_reward_${storyId}`;

/** 연속 의뢰 한 권의 완결 배지가 코디·펫 장식·집 리폼 세트를 함께 여는 카탈로그. */
export const REQUEST_STORY_REWARDS: readonly RequestStoryRewardDef[] = [
  {
    storyId: 'returned_umbrella', badgeId: 'badge_story_request_reward_returned_umbrella', title: '노란 우산 귀환 세트',
    note: '비가 그친 골목의 노랑과 젖은 잎의 초록을 담았어요.',
    outfit: { id: 'yellow_umbrella_guide', name: '노란 우산 안내인', blurb: '꽃핀과 미니 백팩을 더한 비 갠 산책 코디', style: { topStyle: 3, topPattern: 5, shirt: '9cc79c', bottomStyle: 2, pants: 5, shoeStyle: 4, sockStyle: 2, accent: 'f2d85c', hat: 4, back: 1 } },
    petAccessory: { id: 'umbrella_charm', mark: '우', name: '노란 우산 참', description: '비 오는 날 서로를 찾아 주는 손바닥만 한 우산표입니다.' },
    homeRecipe: { id: 'after_rain_sky', name: '비 갠 하늘', description: '빗자국이 은은히 남은 석회 결에 흐린 하늘빛을 입힙니다.', style: { finishId: 'limewash', colorId: 'sky' } },
  },
  {
    storyId: 'last_encore', badgeId: 'badge_story_request_reward_last_encore', title: '심야 앙코르 세트',
    note: '불이 꺼진 뒤에도 남는 무대의 붉은 잔광을 모았어요.',
    outfit: { id: 'midnight_encore', name: '심야 앙코르', blurb: '헤드폰과 기타 케이스를 갖춘 마지막 무대 코디', style: { topStyle: 2, topPattern: 1, shirt: 'b0685a', bottomStyle: 4, pants: 6, shoeStyle: 1, sockStyle: 0, accent: 'f2a85c', hat: 7, back: 2 } },
    petAccessory: { id: 'encore_headset', mark: '음', name: '앙코르 헤드셋', description: '작은 손뼉 소리까지 놓치지 않는 밤색 스테이지 헤드셋입니다.' },
    homeRecipe: { id: 'encore_berry', name: '앙코르 베리', description: '공연장 조명처럼 깊고 매끈한 열매색 옻빛 마감입니다.', style: { finishId: 'lacquer', colorId: 'berry' } },
  },
  {
    storyId: 'paw_letter', badgeId: 'badge_story_request_reward_paw_letter', title: '산책 편지 세트',
    note: '나란히 걸은 속도와 집으로 돌아온 발자국을 간직해요.',
    outfit: { id: 'walk_letter_carrier', name: '산책 편지 배달부', blurb: '포근한 오버롤과 편지 가방의 동행 코디', style: { topStyle: 4, topPattern: 3, shirt: 'd8b86e', bottomStyle: 2, pants: 4, shoeStyle: 0, sockStyle: 1, accent: 'f2ead8', back: 4 } },
    petAccessory: { id: 'letter_satchel', mark: '발', name: '발자국 편지 가방', description: '함께 걸은 문장을 차곡차곡 넣는 조그만 우편 가방입니다.' },
    homeRecipe: { id: 'letter_linen', name: '편지 리넨', description: '오래 접어 둔 편지지처럼 포근한 리넨과 오트밀색 조합입니다.', style: { finishId: 'linen', colorId: 'oat' } },
  },
  {
    storyId: 'alley_issue', badgeId: 'badge_story_request_reward_alley_issue', title: '골목 특별호 세트',
    note: '정답 대신 다음 조합을 남기는 작은 편집실의 색이에요.',
    outfit: { id: 'alley_issue_editor', name: '골목 화보 편집자', blurb: '베레와 토트백으로 완성한 특별호 편집 코디', style: { topStyle: 5, topPattern: 4, shirt: 'e0a8b8', bottomStyle: 3, pants: 10, shoeStyle: 3, sockStyle: 3, accent: 'e86aa8', hat: 1, back: 4 } },
    petAccessory: { id: 'editor_beret', mark: '편', name: '교정본 베레', description: '특별호의 마지막 교정 표시를 수놓은 꽃잎색 베레입니다.' },
    homeRecipe: { id: 'editorial_petal', name: '편집실 꽃잎', description: '화보의 여백처럼 보드라운 무광 위에 꽃잎색을 얹습니다.', style: { finishId: 'matte', colorId: 'petal' } },
  },
  {
    storyId: 'one_room_table', badgeId: 'badge_story_request_reward_one_room_table', title: '작은 사랑방 세트',
    note: '한 평의 방을 여러 사람의 이름만큼 넓게 쓰는 마음을 담았어요.',
    outfit: { id: 'tiny_room_host', name: '작은 집 호스트', blurb: '차분한 가디건과 실용적인 토트백의 집들이 코디', style: { topStyle: 3, topPattern: 2, shirt: 'f2ead8', bottomStyle: 1, pants: 5, shoeStyle: 2, sockStyle: 1, accent: 'c89a6a', back: 4 } },
    petAccessory: { id: 'house_key_tag', mark: '집', name: '사랑방 열쇠표', description: '돌아올 자리의 온기를 새긴 작고 둥근 나무 열쇠표입니다.' },
    homeRecipe: { id: 'small_room_sage', name: '사랑방 세이지', description: '작은 방을 답답하지 않게 묶어 주는 나뭇결과 세이지색입니다.', style: { finishId: 'woodgrain', colorId: 'sage' } },
  },
  {
    storyId: 'rooftop_supper', badgeId: 'badge_story_request_reward_rooftop_supper', title: '옥상 저녁 세트',
    note: '씨앗에서 접시까지 이어진 햇빛과 허브 향을 모았어요.',
    outfit: { id: 'rooftop_supper_cook', name: '옥상 저녁 요리사', blurb: '꽃자수 오버롤과 따뜻한 작업화의 정원 코디', style: { topStyle: 4, topPattern: 5, shirt: '9cc79c', bottomStyle: 4, pants: 4, shoeStyle: 1, sockStyle: 2, accent: 'f2a85c', back: 1 } },
    petAccessory: { id: 'herb_neckerchief', mark: '잎', name: '허브 손수건', description: '옥상 화분의 향을 한 모금 머금은 메리골드 목수건입니다.' },
    homeRecipe: { id: 'rooftop_marigold', name: '옥상 메리골드', description: '햇빛에 잘 마른 천처럼 산뜻한 리넨과 메리골드 조합입니다.', style: { finishId: 'linen', colorId: 'marigold' } },
  },
  {
    storyId: 'rain_map', badgeId: 'badge_story_request_reward_rain_map', title: '도심 물길 세트',
    note: '철길과 수로, 옥상의 서로 다른 잔물결을 한 장에 겹쳤어요.',
    outfit: { id: 'urban_water_surveyor', name: '도심 수로 조사원', blurb: '푸른 재킷과 관측 가방을 갖춘 물가 조사 코디', style: { topStyle: 2, topPattern: 2, shirt: 'a8c8e0', bottomStyle: 0, pants: 2, shoeStyle: 1, sockStyle: 0, accent: '58b8c8', glasses: 1, back: 4 } },
    petAccessory: { id: 'water_goggles', mark: '물', name: '잔물결 고글', description: '빗방울의 방향과 작은 물고기 그림자를 함께 보는 둥근 고글입니다.' },
    homeRecipe: { id: 'waterway_patina', name: '물길 녹청', description: '비에 오래 닿은 표지판처럼 시간의 녹청과 하늘빛을 겹칩니다.', style: { finishId: 'patina', colorId: 'sky' } },
  },
  {
    storyId: 'forest_lantern', badgeId: 'badge_story_request_reward_forest_lantern', title: '외곽 귀환등 세트',
    note: '길 잃은 불빛을 돌아오는 사람의 표식으로 다시 만들었어요.',
    outfit: { id: 'forest_lantern_keeper', name: '외곽 귀환등 지기', blurb: '먹빛 작업복과 금빛 표식의 야간 순찰 코디', style: { topStyle: 1, topPattern: 4, shirt: '4a4e5c', bottomStyle: 4, pants: 6, shoeStyle: 1, sockStyle: 2, accent: 'f2d85c', back: 1 } },
    petAccessory: { id: 'lantern_cape', mark: '등', name: '귀환등 망토', description: '어두운 숲에서도 동행의 위치를 알려 주는 별빛 짧은 망토입니다.' },
    homeRecipe: { id: 'lantern_ink', name: '귀환등 먹빛', description: '밤의 신호등처럼 깊은 먹빛을 반사하는 옻빛 가구 마감입니다.', style: { finishId: 'lacquer', colorId: 'ink' } },
  },
] as const;

export const REQUEST_STORY_REWARD_BY_STORY = new Map(REQUEST_STORY_REWARDS.map((reward) => [reward.storyId, reward]));

export function requestStoryRewardViews(unlockedBadgeIds: Iterable<string>) {
  const unlocked = new Set(unlockedBadgeIds);
  return REQUEST_STORY_REWARDS.map((reward) => ({ ...reward, unlocked: unlocked.has(reward.badgeId) }));
}
