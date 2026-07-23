import type { Appearance } from '../art/appearance';
import type { FurnitureReformStyle } from '../home/furnitureReform';
import type { StarterCompassRouteId } from './starterCompass';

export type StarterMentorRewardPetAccessoryId =
  | 'palette_charm'
  | 'room_key_charm'
  | 'paired_step_charm'
  | 'regular_cup_charm'
  | 'harvest_pouch'
  | 'return_compass';

export interface StarterMentorRewardDef {
  routeId: StarterCompassRouteId;
  badgeId: string;
  title: string;
  note: string;
  outfit: { id: string; name: string; blurb: string; style: Partial<Appearance> };
  petAccessory: {
    id: StarterMentorRewardPetAccessoryId;
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

/**
 * 첫 생활 연대기의 세 장을 완주하면 같은 취향을 캐릭터·동행·집에 동시에 표현한다.
 * 배지는 퀘스트 완료로 자동 해금되며 시즌이나 수령 기한을 두지 않는다.
 */
export const STARTER_MENTOR_REWARDS: readonly StarterMentorRewardDef[] = [
  {
    routeId: 'style', badgeId: 'badge_story_starter_mentor_style', title: '노을의 골목 팔레트 세트',
    note: '세 번의 스타일 기록에서 고른 노을빛을 옷과 동행, 방 한구석에 함께 남겼어요.',
    outfit: { id: 'mentor_alley_palette', name: '골목 팔레트 편집자', blurb: '노을색 재킷과 색 견본 토트백의 완주 코디', style: { topStyle: 5, topPattern: 3, shirt: 'd77a8b', bottomStyle: 3, pants: 10, shoeStyle: 4, sockStyle: 4, accent: 'f2cf75', back: 4 } },
    petAccessory: { id: 'palette_charm', mark: '색', name: '동행 팔레트 참', description: '함께 고른 세 가지 골목색을 작은 픽셀 견본으로 묶은 목걸이입니다.' },
    homeRecipe: { id: 'mentor_sunset_canvas', name: '노을 캔버스', description: '벽화의 겹친 붓자국을 닮은 석회 덧칠과 산딸기색 마감입니다.', style: { finishId: 'limewash', colorId: 'berry' } },
  },
  {
    routeId: 'home', badgeId: 'badge_story_starter_mentor_home', title: '살림의 돌아올 방 세트',
    note: '처음 놓은 가구와 손본 자리를 기억하는, 작지만 분명한 집의 표정을 모았어요.',
    outfit: { id: 'mentor_room_keeper', name: '돌아올 방 지킴이', blurb: '오트색 가디건과 방 열쇠를 챙긴 살림 코디', style: { topStyle: 3, topPattern: 5, shirt: 'd9c6a1', bottomStyle: 1, pants: 5, shoeStyle: 2, sockStyle: 1, accent: '8b6e52', back: 4 } },
    petAccessory: { id: 'room_key_charm', mark: '열', name: '돌아올 방 열쇠', description: '산책 뒤 어느 창으로 돌아가야 하는지 알려 주는 작은 집 열쇠표입니다.' },
    homeRecipe: { id: 'mentor_warm_nest', name: '따뜻한 둥지 원목', description: '오래 쓰던 서랍처럼 편안한 나뭇결과 오트밀색 마감입니다.', style: { finishId: 'woodgrain', colorId: 'oat' } },
  },
  {
    routeId: 'companion', badgeId: 'badge_story_starter_mentor_companion', title: '동수의 나란한 걸음 세트',
    note: '작은 발의 속도를 배우며 생긴 다정한 산책 리듬을 세 가지 꾸미기에 담았어요.',
    outfit: { id: 'mentor_paired_walk', name: '나란한 걸음 산책복', blurb: '세이지 셔츠와 간식 가방을 맨 동행 코디', style: { topStyle: 4, topPattern: 3, shirt: '8da37c', bottomStyle: 2, pants: 5, shoeStyle: 4, sockStyle: 2, accent: 'e8c47b', back: 5 } },
    petAccessory: { id: 'paired_step_charm', mark: '짝', name: '나란한 발자국 참', description: '큰 걸음과 작은 걸음이 나란히 이어지는 산책 기념표입니다.' },
    homeRecipe: { id: 'mentor_paw_linen', name: '발자국 세이지 리넨', description: '함께 쉬는 자리에 어울리는 포근한 리넨과 세이지색 마감입니다.', style: { finishId: 'linen', colorId: 'sage' } },
  },
  {
    routeId: 'neighbor', badgeId: 'badge_story_starter_mentor_neighbor', title: '모퉁이의 단골 자리 세트',
    note: '이름과 자리를 기억하는 이웃의 온도를 카페 점토색으로 오래 보존했어요.',
    outfit: { id: 'mentor_corner_regular', name: '모퉁이 단골 재킷', blurb: '차분한 재킷과 따뜻한 잔 배지의 이웃 코디', style: { topStyle: 2, topPattern: 1, shirt: '7890a0', bottomStyle: 0, pants: 5, shoeStyle: 2, sockStyle: 0, accent: 'e4c691', back: 0 } },
    petAccessory: { id: 'regular_cup_charm', mark: '잔', name: '늘 비워 둔 찻잔표', description: '언제 와도 반겨 줄 자리가 있다는 뜻의 조그만 단골 찻잔입니다.' },
    homeRecipe: { id: 'mentor_corner_cafe', name: '모퉁이 카페 점토', description: '오래 앉아 이야기하기 좋은 보드라운 무광 점토색 마감입니다.', style: { finishId: 'matte', colorId: 'clay' } },
  },
  {
    routeId: 'maker', badgeId: 'badge_story_starter_mentor_maker', title: '포차 이모의 손끝 수확 세트',
    note: '흙과 물결, 따뜻한 한 접시가 하루의 솜씨가 된 순간을 황동빛으로 묶었어요.',
    outfit: { id: 'mentor_harvest_apron', name: '손끝 수확 앞치마', blurb: '튼튼한 작업복과 세 칸 재료 주머니의 생활 코디', style: { topStyle: 4, topPattern: 2, shirt: 'b6a06a', bottomStyle: 4, pants: 6, shoeStyle: 1, sockStyle: 2, accent: 'd9825b', back: 2 } },
    petAccessory: { id: 'harvest_pouch', mark: '손', name: '세 칸 수확 주머니', description: '씨앗과 낚시찌, 작은 간식을 나눠 담는 동행용 생활 주머니입니다.' },
    homeRecipe: { id: 'mentor_harvest_brass', name: '손끝 수확 황동', description: '자주 쓰는 작업대처럼 깊은 옻빛 광택과 메리골드색 마감입니다.', style: { finishId: 'lacquer', colorId: 'marigold' } },
  },
  {
    routeId: 'explorer', badgeId: 'badge_story_starter_mentor_explorer', title: '박 기장의 돌아오는 나침반 세트',
    note: '새 길을 찾는 용기보다 무사히 돌아오는 표식을 먼저 챙긴 탐험의 완주 기록이에요.',
    outfit: { id: 'mentor_return_explorer', name: '귀환 표식 탐험복', blurb: '먹빛 필드 재킷과 황동 나침반의 안전 탐험 코디', style: { topStyle: 1, topPattern: 4, shirt: '67627f', bottomStyle: 4, pants: 6, shoeStyle: 4, sockStyle: 2, accent: 'e1c36c', back: 1 } },
    petAccessory: { id: 'return_compass', mark: '귀', name: '귀환 나침반', description: '멀리 다녀와도 집의 불빛을 향해 돌아가는 작은 황동 나침반입니다.' },
    homeRecipe: { id: 'mentor_station_patina', name: '귀환역 하늘 녹청', description: '오래된 역 표지판에 비 갠 하늘빛이 남은 녹청 마감입니다.', style: { finishId: 'patina', colorId: 'sky' } },
  },
] as const;

export const STARTER_MENTOR_REWARD_BY_ROUTE = new Map(
  STARTER_MENTOR_REWARDS.map((reward) => [reward.routeId, reward]),
);

export function starterMentorRewardViews(unlockedBadgeIds: Iterable<string>) {
  const unlocked = new Set(unlockedBadgeIds);
  return STARTER_MENTOR_REWARDS.map((reward) => ({ ...reward, unlocked: unlocked.has(reward.badgeId) }));
}
