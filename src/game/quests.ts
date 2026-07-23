/**
 * 홍대마을 모험 일지 SSOT.
 *
 * 일일 퀘스트의 코인 보상은 기존 earn_activity RPC가 최종 검증한다.
 * 그 외 항목은 여러 시스템을 안내하고 장기 목표를 보여 주는 영구 기록이다.
 */
import { residentStoryEntries, residentTrustMetricKey } from './residents/residentStories';
import {
  REQUEST_STORY_REWARDS, requestStoryMetricKey, requestStoryRewardQuestId,
} from './progression/requestStoryRewards';
import { VILLAGE_REQUEST_STORY_BY_ID } from './requests/villageRequestStories';

export type QuestCategory = 'onboarding' | 'daily' | 'story' | 'collection' | 'mastery';
export type QuestProgressMode = 'add' | 'max';

export interface QuestDef {
  id: string;
  name: string;
  desc: string;
  goal: number;
  registryKey: string;
  reward: number;
  category: QuestCategory;
  location: string;
  tip?: string;
  prerequisite?: string;
  progressMode?: QuestProgressMode;
  rewardLabel?: string;
  order: number;
}

export const QUEST_CATEGORY_LABEL: Record<QuestCategory, string> = {
  onboarding: '첫걸음',
  daily: '오늘',
  story: '마을 이야기',
  collection: '수집',
  mastery: '숙련',
};

/** 서버 보상 ID와 필드는 기존 계약을 유지한다. */
export const DAILY_QUESTS: QuestDef[] = [
  {
    id: 'quest_cafe', name: '모퉁이의 하루',
    desc: '카페 알바를 1번 완료하기', goal: 1, registryKey: 'q_cafe', reward: 40,
    category: 'daily', location: '카페 「모퉁이」', tip: '카페 문을 밟으면 알바가 시작돼요.', order: 10,
  },
  {
    id: 'quest_busking', name: '거리의 뮤지션',
    desc: '버스킹을 1번 성공하기', goal: 1, registryKey: 'q_busking', reward: 40,
    category: 'daily', location: '메인 스트리트 버스킹 스팟', tip: '기타 표식 위로 걸어가 보세요.', order: 20,
  },
  {
    id: 'quest_forest', name: '숲길 산책',
    desc: '경의선 숲길에서 30초 머물기', goal: 30, registryKey: 'q_forest', reward: 40,
    category: 'daily', location: '마을 위쪽 경의선 숲길', tip: '숲길 안에 있으면 매초 자동으로 올라요.', order: 30,
  },
  {
    id: 'quest_emote', name: '동네 인사',
    desc: '이모트 3번 보내기', goal: 3, registryKey: 'q_emote', reward: 40,
    category: 'daily', location: '어디서나', tip: 'E 키 또는 하단 이모트 버튼을 눌러요.', order: 40,
  },
  {
    id: 'quest_decorate', name: '오늘의 인테리어',
    desc: '내 방에 가구 2개 배치하기', goal: 2, registryKey: 'q_place', reward: 40,
    category: 'daily', location: '내 집', tip: '집에 들어가 가방의 가구를 배치해요.', order: 50,
  },
];

const ONBOARDING_QUESTS: QuestDef[] = [
  { id: 'intro_journal', name: '어서 와, 홍대마을!', desc: '모험 일지를 열어 안내를 확인하기', goal: 1, registryKey: 'open_quest', reward: 0, category: 'onboarding', location: '하단 퀘스트 버튼 또는 Q', tip: '모르는 일이 생기면 이 일지의 추천 탭을 확인하세요.', rewardLabel: '초행자 도장', order: 10 },
  { id: 'intro_map', name: '길부터 익히기', desc: '마을 지도를 한 번 열기', goal: 1, registryKey: 'open_map', reward: 0, category: 'onboarding', location: '하단 지도 버튼 또는 M', prerequisite: 'intro_journal', rewardLabel: '길잡이 도장', order: 20 },
  { id: 'intro_greet', name: '먼저 건네는 인사', desc: '이름 있는 주민과 처음 인사하기', goal: 1, registryKey: 'resident_greet', reward: 0, category: 'onboarding', location: '이름표가 있는 마을 주민 근처', tip: '가까이 다가가면 주민이 먼저 말을 걸어요.', prerequisite: 'intro_map', rewardLabel: '이웃 도장', order: 30 },
  { id: 'intro_cafe', name: '첫 아르바이트', desc: '카페 알바를 한 번 마치기', goal: 1, registryKey: 'q_cafe', reward: 0, category: 'onboarding', location: '카페 「모퉁이」', prerequisite: 'intro_greet', rewardLabel: '생활인 도장', order: 40 },
  { id: 'intro_home', name: '나만의 공간', desc: '집 안에 처음 들어가기', goal: 1, registryKey: 'visit_home', reward: 0, category: 'onboarding', location: '주택가 또는 복덕방', prerequisite: 'intro_cafe', rewardLabel: '새집 도장', order: 50 },
  { id: 'intro_decorate', name: '방에 온기를', desc: '가구를 처음 배치하기', goal: 1, registryKey: 'q_place', reward: 0, category: 'onboarding', location: '내 집', prerequisite: 'intro_shop', rewardLabel: '새내기 꾸미기 배지', order: 60 },
  { id: 'intro_pet', name: '작은 동행', desc: '펫을 한 마리 입양하기', goal: 1, registryKey: 'pet_adopt', reward: 0, category: 'onboarding', location: '펫샵 「멍냥이네」', prerequisite: 'intro_decorate', rewardLabel: '첫 친구 배지', order: 70 },
  { id: 'intro_feed', name: '친해지는 방법', desc: '펫에게 먹이를 한 번 주기', goal: 1, registryKey: 'pet_feed', reward: 0, category: 'onboarding', location: '펫샵 「멍냥이네」', prerequisite: 'intro_pet', rewardLabel: '다정한 손길 배지', order: 80 },
  { id: 'intro_sparkle', name: '골목의 반짝임', desc: '숨은 반짝이 스팟을 한 곳 발견하기', goal: 1, registryKey: 'sparkle_collect', reward: 0, category: 'onboarding', location: '마을 골목과 숲길', tip: '바닥에서 반짝이는 작은 빛을 찾아 밟아 보세요.', prerequisite: 'intro_map', rewardLabel: '발견 도장', order: 90 },
  { id: 'intro_hunt', name: '마을 밖의 소란', desc: '몬스터를 처음 처치하기', goal: 1, registryKey: 'monster_kill', reward: 0, category: 'onboarding', location: '동쪽 연결도로 끝 외곽숲', tip: '처음에는 관찰 모드라 안전해요. 상단 HUD에서 원정을 직접 켜면 가까운 몬스터와 자동 전투하고, 언제든 다시 멈출 수 있어요.', prerequisite: 'intro_sparkle', rewardLabel: '초보 모험가 배지', order: 100 },
];

const STORY_QUESTS: QuestDef[] = [
  { id: 'story_regular', name: '모퉁이의 단골', desc: '카페 알바를 누적 3번 돕기', goal: 3, registryKey: 'q_cafe', reward: 0, category: 'story', location: '카페 「모퉁이」', prerequisite: 'intro_cafe', rewardLabel: '모퉁이 식구 배지', order: 10 },
  { id: 'story_street_stage', name: '거리의 앙코르', desc: '버스킹을 누적 3번 성공하기', goal: 3, registryKey: 'q_busking', reward: 0, category: 'story', location: '메인 스트리트', prerequisite: 'intro_cafe', rewardLabel: '골목 뮤지션 배지', order: 20 },
  { id: 'story_neighbors', name: '안부가 쌓이는 마을', desc: '주민 인사를 누적 10번 나누기', goal: 10, registryKey: 'resident_greet', reward: 0, category: 'story', location: '마을 곳곳의 이름 있는 주민', prerequisite: 'intro_greet', rewardLabel: '동네 사람 배지', order: 30 },
  { id: 'story_cozy_home', name: '취향이 사는 집', desc: '가구를 누적 10개 배치하기', goal: 10, registryKey: 'q_place', reward: 0, category: 'story', location: '내 집', prerequisite: 'intro_decorate', rewardLabel: '홈 스타일리스트 배지', order: 40 },
  { id: 'story_company', name: '홍대의 일하는 사람들', desc: '회사 건물을 한 곳 방문하기', goal: 1, registryKey: 'visit_company', reward: 0, category: 'story', location: '거리의 회사 건물', prerequisite: 'intro_map', rewardLabel: '도시 탐방 배지', order: 50 },
  { id: 'story_photo', name: '오늘을 네 칸에', desc: '인생네컷을 한 번 찍기', goal: 1, registryKey: 'photo_taken', reward: 0, category: 'story', location: '메인 스트리트 사진 스팟', prerequisite: 'intro_map', rewardLabel: '추억 한 장 배지', order: 60 },
  { id: 'story_photo_pet', name: '나란히 선 작은 친구', desc: '동행 펫과 네컷 사진 한 장 남기기', goal: 1, registryKey: 'photo_with_pet', reward: 0, category: 'story', location: '네컷 작업실 · 동행 펫 켜기', prerequisite: 'story_photo', rewardLabel: '둘만의 네컷 배지', order: 62 },
  { id: 'story_photo_album', name: '세 장이면 시작되는 앨범', desc: '필름 앨범에 네컷 3장 보관하기', goal: 3, registryKey: 'photo_album', progressMode: 'max', reward: 0, category: 'story', location: '네컷 작업실 · 필름 앨범', prerequisite: 'story_photo', rewardLabel: '필름 수집 입문 배지', order: 64 },
  { id: 'story_photo_card_first', name: '필름이 최애 카드가 되는 날', desc: '저장한 네컷에 포일과 픽셀 스티커를 골라 첫 포토카드 꾸미기', goal: 1, registryKey: 'photo_cards_decorated', progressMode: 'max', reward: 0, category: 'story', location: '네컷 작업실 · 포토카드', prerequisite: 'story_photo_album', rewardLabel: '첫 포토카드 메이커 배지', order: 65 },
  { id: 'story_life_specialty_first', name: '내가 좋아하는 일을 소개하는 법', desc: '생활 전문성 보드에서 첫 자격 카드를 대표 전시하기', goal: 1, registryKey: 'life_specialty_featured', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 생활 · 전문성 보드', prerequisite: 'intro_journal', rewardLabel: '첫 생활 자격 도장', order: 67 },
  { id: 'story_life_synergy_first', name: '세 가지 취향이 한 이름이 된 날', desc: '서로 다른 대표 전문성 세 장으로 첫 생활 시너지 발견하기', goal: 1, registryKey: 'life_specialty_synergies', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 생활 · 생활 시너지 연구', prerequisite: 'story_life_specialty_first', rewardLabel: '첫 생활 시너지 표식', order: 68 },
  { id: 'story_garden_seed', name: '옥상에 놓인 첫 봉투', desc: '빈 화분에 첫 씨앗 심기', goal: 1, registryKey: 'garden_planted', progressMode: 'max', reward: 0, category: 'story', location: '나의 집 화분 또는 HUD 정원', prerequisite: 'intro_home', rewardLabel: '첫 파종 도장', order: 66 },
  { id: 'story_garden_harvest', name: '시들지 않는 첫 수확', desc: '세 번 돌본 식물을 처음 수확하기', goal: 1, registryKey: 'garden_harvest', progressMode: 'max', reward: 0, category: 'story', location: '옥상 씨앗 연구소 · 네 화분', prerequisite: 'story_garden_seed', rewardLabel: '옥상 가드너 배지', order: 68 },
  { id: 'story_cooking_first', name: '수확물이 한 접시가 되는 날', desc: '정원 재료로 첫 메뉴 완성하기', goal: 1, registryKey: 'cooking_total', progressMode: 'max', reward: 0, category: 'story', location: '모퉁이 골목 주방', prerequisite: 'story_garden_harvest', rewardLabel: '첫 조리 도장', order: 69 },
  { id: 'story_cooking_favorite', name: '다시 만들고 싶은 맛', desc: '완성한 메뉴를 첫 단골 메뉴로 고르기', goal: 1, registryKey: 'cooking_favorites', progressMode: 'max', reward: 0, category: 'story', location: '골목 주방 · 오늘의 테스트 접시', prerequisite: 'story_cooking_first', rewardLabel: '나만의 메뉴 배지', order: 71 },
  { id: 'story_fishing_first', name: '물결이 건넨 첫 인사', desc: '세 물가 중 한 곳에서 첫 생물 만나기', goal: 1, registryKey: 'fishing_total', progressMode: 'max', reward: 0, category: 'story', location: '물정원 낚시 수첩 또는 동쪽 물정원', prerequisite: 'intro_map', rewardLabel: '첫 물결 도장', order: 72 },
  { id: 'story_fishing_gold', name: '다시 만난 친구의 금빛', desc: '한 생물의 크기 기록을 금빛 도장으로 키우기', goal: 1, registryKey: 'fishing_gold_records', progressMode: 'max', reward: 0, category: 'story', location: '낚시 수첩 · 크기 기록', prerequisite: 'story_fishing_first', rewardLabel: '금빛 기록 배지', order: 73 },
  { id: 'story_aquarium_first', name: '물결을 집으로 데려온 날', desc: '발견한 생물로 첫 물결 테라리움 구성 저장하기', goal: 1, registryKey: 'aquarium_saves', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 물결 테라리움 작업실', prerequisite: 'story_fishing_first', rewardLabel: '첫 수조 큐레이터 배지', order: 74 },
  { id: 'story_aquarium_room', name: '방 안에서 헤엄치는 기록', desc: '저장한 테라리움과 어항 가구를 실제 방에서 연결하기', goal: 1, registryKey: 'home_aquarium_active', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 무료 어항 가구', prerequisite: 'story_aquarium_first', rewardLabel: '홈 아쿠아리스트 배지', order: 75 },
  { id: 'story_reform_first', name: '낡은 결에 고른 첫 색', desc: '배치 가구의 마감과 색감을 골라 처음 리폼하기', goal: 1, registryKey: 'furniture_reform_saves', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 가구 리폼 공방', prerequisite: 'intro_decorate', rewardLabel: '첫 리폼 도장', order: 76 },
  { id: 'story_reform_room', name: '세 가구가 들려주는 한 방', desc: '서로 다른 배치 가구 3점에 리폼 외형 남기기', goal: 3, registryKey: 'furniture_reformed_items', progressMode: 'max', reward: 0, category: 'story', location: '가구 리폼 공방 · 배치 가구 목록', prerequisite: 'story_reform_first', rewardLabel: '방의 색 조율사 배지', order: 77 },
  { id: 'story_moodboard_first', name: '상상이 방이 되는 날', desc: '홈 무드보드 테마를 처음 완성해 영구 도장 받기', goal: 1, registryKey: 'home_moodboard_stamps', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 무드보드 연구실', prerequisite: 'intro_decorate', rewardLabel: '첫 장면 설계자 배지', order: 78 },
  { id: 'story_omok', name: '골목의 승부사', desc: '오목에서 누적 3번 이기기', goal: 3, registryKey: 'omok_win', reward: 0, category: 'story', location: '오목 스팟', prerequisite: 'intro_map', rewardLabel: '동네 승부사 배지', order: 70 },
  { id: 'story_style', name: '나를 닮은 모습', desc: '캐릭터 꾸미기를 저장하기', goal: 1, registryKey: 'customize_save', reward: 0, category: 'story', location: '하단 꾸미기 버튼 또는 C', prerequisite: 'intro_journal', rewardLabel: '스타일 선언 배지', order: 80 },
  { id: 'story_wardrobe', name: '오늘의 코디 기록', desc: '마음에 든 코디를 옷장 슬롯에 저장하기', goal: 1, registryKey: 'closet_save', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 옷장', prerequisite: 'story_style', rewardLabel: '코디 기록가 배지', order: 90 },
  { id: 'story_dye', name: '색으로 말하기', desc: '포인트 또는 상의 염색을 바꿔 3번 저장하기', goal: 3, registryKey: 'fashion_dye', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 의상', prerequisite: 'story_style', rewardLabel: '컬러 믹서 배지', order: 100 },
  { id: 'story_fashion_trip', name: '옷으로 떠나는 여행', desc: '테마 코디를 누적 6번 입어보기', goal: 6, registryKey: 'fashion_preset', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 옷장', prerequisite: 'story_wardrobe', rewardLabel: '테마 스타일러 배지', order: 110 },
  { id: 'story_style_scout', name: '숨은 스타일의 문', desc: '희귀 스타일 3종 해금하기', goal: 3, registryKey: 'rare_styles', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 스타일 도감', prerequisite: 'story_style', rewardLabel: '스타일 스카우트 배지', order: 115 },
  { id: 'story_lookbook_first', name: '골목에 남긴 첫 코디', desc: '코디 의뢰를 처음 룩북에 기록하기', goal: 1, registryKey: 'lookbook_submissions', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 골목 룩북', prerequisite: 'intro_journal', rewardLabel: '첫 룩북 기록가 배지', order: 117 },
  { id: 'story_lookbook_perfect', name: '세 조건이 만난 순간', desc: '코디 의뢰 하나에서 최고 별 3개 기록하기', goal: 1, registryKey: 'lookbook_perfect', progressMode: 'max', reward: 0, category: 'story', location: '골목 룩북 · 코디 의뢰서', prerequisite: 'story_lookbook_first', rewardLabel: '완벽 코디 감별사 배지', order: 119 },
  { id: 'story_showcase_first', name: '지금의 취향을 건 첫날', desc: '골목 취향 전시회에 현재 모습 처음 출품하기', goal: 1, registryKey: 'taste_showcase_submissions', progressMode: 'max', reward: 0, category: 'story', location: '중앙 광장 · 골목 취향 전시회', prerequisite: 'intro_journal', rewardLabel: '첫 주민 전시 도장', order: 118 },
  { id: 'story_showcase_two_tastes', name: '집과 동행이 나란히', desc: '집과 펫 두 분야에 모두 한 번 이상 출품하기', goal: 2, registryKey: 'taste_showcase_domains', progressMode: 'max', reward: 0, category: 'story', location: '골목 취향 전시회 · 사는 취향과 함께하는 취향', prerequisite: 'story_showcase_first', rewardLabel: '두 갈래 취향 큐레이터 배지', order: 121 },
  { id: 'story_club_first', name: '첫 동아리 회보', desc: '골목 동아리의 첫 장을 발간하기', goal: 1, registryKey: 'hobby_club_chapters', progressMode: 'max', reward: 0, category: 'story', location: '중앙 광장 · 골목 동아리 게시판', prerequisite: 'intro_journal', rewardLabel: '첫 생활 연구 도장', order: 122 },
  { id: 'story_club_three', name: '세 갈래 생활 연구', desc: '서로 다른 동아리 세 곳의 첫 장을 발간하기', goal: 3, registryKey: 'hobby_club_societies', progressMode: 'max', reward: 0, category: 'story', location: '골목 동아리 · 여섯 모임', prerequisite: 'story_club_first', rewardLabel: '골목 모임 안내자 배지', order: 123 },
  { id: 'story_project_first', name: '골목에 남은 첫 설계선', desc: '골목 함께짓기의 첫 단계를 완성하기', goal: 1, registryKey: 'community_project_phases', progressMode: 'max', reward: 0, category: 'story', location: '레코드 골목 입구 · 골목 함께짓기', prerequisite: 'intro_journal', rewardLabel: '첫 공동 설계 도장', order: 124 },
  { id: 'story_project_three', name: '세 장소에 켜진 공사등', desc: '서로 다른 공동 프로젝트 세 곳의 첫 단계를 시작하기', goal: 3, registryKey: 'community_projects_active', progressMode: 'max', reward: 0, category: 'story', location: '골목 함께짓기 · 다섯 설계도', prerequisite: 'story_project_first', rewardLabel: '마을 조율자 견습 배지', order: 125 },
  { id: 'story_shared_project_first', name: '모두의 밤에 건넨 한 장', desc: '모두의 밤정원에 첫 마음 한 장 건네기', goal: 1, registryKey: 'shared_project_contributions', progressMode: 'max', reward: 0, category: 'story', location: '골목 함께짓기 · LIVE 모두의 밤정원', prerequisite: 'intro_journal', rewardLabel: '첫 공동 밤 도장', order: 126 },
  { id: 'story_collection_shelf_first', name: '마음에 둔 첫 번째 것', desc: '가이드북 수집 선반에 첫 목표 담기', goal: 1, registryKey: 'collection_shelf_targets', progressMode: 'max', reward: 0, category: 'story', location: '가이드북 · 나의 수집 선반', prerequisite: 'intro_journal', rewardLabel: '첫 위시 카드 도장', order: 127 },
  { id: 'story_home_balance', name: '생활이 흐르는 집', desc: '내 집에 서로 다른 가구 분류 5종 배치하기', goal: 5, registryKey: 'home_categories', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스타일 카드', prerequisite: 'story_cozy_home', rewardLabel: '살림 균형가 배지', order: 120 },
  { id: 'story_home_signature', name: '한눈에 보이는 취향', desc: '하나의 홈 테마 파워 4 달성하기', goal: 4, registryKey: 'home_theme_power', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스타일 카드', prerequisite: 'story_home_balance', rewardLabel: '시그니처 룸 배지', order: 130 },
  { id: 'story_home_first_guest', name: '처음 열린 집들이', desc: '조건을 갖춰 주민을 처음 집으로 초대하기', goal: 1, registryKey: 'home_visits', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 우리 집 방문 앨범', prerequisite: 'story_home_balance', rewardLabel: '다정한 집주인 배지', order: 135 },
  { id: 'story_home_pet_guest', name: '세 식구의 한 장면', desc: '동행 펫과 함께 주민 방문 추억 남기기', goal: 1, registryKey: 'home_pet_visits', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 방문 앨범과 동행 펫', prerequisite: 'story_home_first_guest', rewardLabel: '복작복작 집들이 배지', order: 137 },
  { id: 'story_pet_play', name: '우리만의 놀이 시간', desc: '펫과 같이 놀기를 누적 3번 하기', goal: 3, registryKey: 'pet_play', reward: 0, category: 'story', location: '펫샵 「멍냥이네」', prerequisite: 'intro_feed', rewardLabel: '놀이 친구 배지', order: 140 },
  { id: 'story_pet_trick', name: '처음 맞춘 호흡', desc: '펫에게 첫 트릭을 가르치기', goal: 1, registryKey: 'pet_tricks', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 「멍냥이네」', prerequisite: 'story_pet_play', rewardLabel: '펫 트레이너 배지', order: 150 },
  { id: 'story_pet_profile', name: '이름을 불러 주는 순간', desc: '펫 한 마리의 별명 또는 성격 기록 바꾸기', goal: 1, registryKey: 'pet_profiles_customized', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 · 프로필 꾸미기', prerequisite: 'intro_pet', rewardLabel: '첫 프로필 도장', order: 155 },
  { id: 'story_pet_accessory', name: '산책 전의 작은 단장', desc: '펫에게 첫 액세서리 착용하기', goal: 1, registryKey: 'pet_accessory_equip', reward: 0, category: 'story', location: '펫샵 · 액세서리 도감', prerequisite: 'story_pet_profile', rewardLabel: '멍냥 스타일리스트 배지', order: 157 },
  { id: 'story_pet_outing_first', name: '둘이서 걷는 첫 골목', desc: '동행 펫과 첫 산책 코스 기록 남기기', goal: 1, registryKey: 'pet_outings_total', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 · 동행 산책 수첩', prerequisite: 'intro_pet', rewardLabel: '첫 산책 도장', order: 158 },
  { id: 'story_pet_outing_souvenir', name: '주머니 속 작은 풍경', desc: '산책 코스에서 첫 기념 도장 발견하기', goal: 1, registryKey: 'pet_outing_stamps', progressMode: 'max', reward: 0, category: 'story', location: '동행 산책 수첩 · 코스별 기념품', prerequisite: 'story_pet_outing_first', rewardLabel: '골목 기념품 수집가 배지', order: 159 },
  { id: 'story_pet_home_first', name: '집에서 처음 들은 작은 말', desc: '동행 펫이 좋아하는 가구 곁에서 첫 생활 장면 발견하기', goal: 1, registryKey: 'pet_home_memories', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 동행의 자리', prerequisite: 'intro_pet', rewardLabel: '첫 집 추억 도장', order: 160 },
  { id: 'story_pet_home_personality', name: '한 성격의 세 가지 하루', desc: '한 성격에서 열리는 생활 장면 3개 기록하기', goal: 3, registryKey: 'pet_home_memories', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 동행의 자리 수첩', prerequisite: 'story_pet_home_first', rewardLabel: '생활 관찰가 배지', order: 161 },
  { id: 'story_neighbor_circle', name: '다섯 갈래 안부', desc: '서로 다른 주민 5명과 인사 나누기', goal: 5, registryKey: 'residents_met', progressMode: 'max', reward: 0, category: 'story', location: '아이소메트릭 마을의 이름표', prerequisite: 'intro_greet', rewardLabel: '골목 마당발 배지', order: 160 },
  { id: 'story_trusted_friend', name: '말해도 좋은 사람', desc: '한 주민과 신뢰도 50 달성하기', goal: 50, registryKey: 'resident_trust_max', progressMode: 'max', reward: 0, category: 'story', location: '주민 수첩 · 매일의 인사', prerequisite: 'story_neighbor_circle', rewardLabel: '동네 친구 배지', order: 170 },
  { id: 'story_first_chat', name: '골목에 띄운 한마디', desc: '마을 채팅으로 첫 메시지 보내기', goal: 1, registryKey: 'chat_sent', reward: 0, category: 'story', location: '하단 채팅 버튼 또는 Enter', prerequisite: 'intro_greet', rewardLabel: '첫 대화 배지', order: 180 },
  { id: 'story_emote_circle', name: '말보다 빠른 마음', desc: '이모트를 누적 10번 사용하기', goal: 10, registryKey: 'q_emote', reward: 0, category: 'story', location: '하단 이모트 버튼 또는 E', prerequisite: 'intro_greet', rewardLabel: '리액션 장인 배지', order: 190 },
  { id: 'story_patrol_combo', name: '안전한 순찰 요령', desc: '외곽숲에서 5연속 처치 달성하기', goal: 5, registryKey: 'monster_streak', progressMode: 'max', reward: 0, category: 'story', location: '동쪽 외곽숲 · 길로 나오기 전', prerequisite: 'intro_hunt', rewardLabel: '외곽 순찰자 배지', order: 200 },
  { id: 'story_bungeo_regular', name: '호호 부는 골목 간식', desc: '붕어빵 포차를 누적 5번 이용하기', goal: 5, registryKey: 'bungeo_eat', reward: 0, category: 'story', location: '골목 붕어빵 포차', prerequisite: 'intro_map', rewardLabel: '붕어빵 단골 배지', order: 210 },
  { id: 'story_claw_first', name: '집게 끝의 행운', desc: '인형뽑기에서 처음 성공하기', goal: 1, registryKey: 'claw_win', reward: 0, category: 'story', location: '오락 골목 인형뽑기', prerequisite: 'intro_map', rewardLabel: '첫 인형 구조대 배지', order: 220 },
  { id: 'story_request_first', name: '게시판에서 고른 첫 마음', desc: '골목 의뢰를 처음 완료하고 도장 받기', goal: 1, registryKey: 'village_requests_total', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 골목 의뢰소', prerequisite: 'intro_journal', rewardLabel: '첫 해결 도장', order: 230 },
  { id: 'story_request_categories_4', name: '네 사람의 다른 부탁', desc: '서로 다른 의뢰 분야 4곳에서 도장 받기', goal: 4, registryKey: 'village_request_categories', progressMode: 'max', reward: 0, category: 'story', location: '골목 의뢰소 · 8분야 도감', prerequisite: 'story_request_first', rewardLabel: '골목 만능손 배지', order: 240 },
];

/** 살림 쇼룸의 방문→첫 구매→도감 완성 루프. 기존 기록은 모두 소급 인정한다. */
const SHOP_QUESTS: QuestDef[] = [
  { id: 'intro_shop', name: '살림을 고르는 눈', desc: '살림 가구 쇼룸을 처음 둘러보기', goal: 1, registryKey: 'visit_shop', reward: 0, category: 'onboarding', location: '살림 아틀리에 옆 쇼룸', tip: '가이드북의 가구 목표에서 ‘길 안내’를 누르면 금빛 발자국이 이어져요.', prerequisite: 'intro_home', rewardLabel: '쇼룸 방문 도장', order: 55 },
  { id: 'intro_workshop', name: '골목 작업대의 첫 도면', desc: '살림 아틀리에 앞 DIY 작업대 둘러보기', goal: 1, registryKey: 'visit_workshop', reward: 0, category: 'onboarding', location: '살림 아틀리에 앞 원목 작업대', tip: '재료 찾기를 누르면 필요한 가구가 있는 진열대로 바로 이동해요.', prerequisite: 'intro_shop', rewardLabel: 'DIY 작업대 방문 도장', order: 56 },
  { id: 'story_shop_first', name: '내 방을 기다린 한 점', desc: '살림 가구에서 첫 물건 구매하기', goal: 1, registryKey: 'shop_purchase', reward: 0, category: 'story', location: '살림 가구 · 원하는 진열대', tip: '구매한 물건은 즉시 가이드북에 기록되고 내 집 가방에서 꺼낼 수 있어요.', prerequisite: 'intro_shop', rewardLabel: '첫 살림 장만 배지', order: 78 },
  { id: 'story_diy_first', name: '버리지 않고 다시 만든 것', desc: 'DIY 작업대에서 첫 가구 제작하기', goal: 1, registryKey: 'furniture_craft_total', reward: 0, category: 'story', location: '살림 가구 · DIY 작업대', tip: '부족한 재료는 기본 진열에서 찾을 수 있고, 제작 전에는 아무것도 차감되지 않아요.', prerequisite: 'intro_workshop', rewardLabel: '첫 손수 제작 배지', order: 79 },
  { id: 'collect_diy_6', name: '여섯 장의 작업 도면', desc: '서로 다른 DIY 가구 6종 제작하기', goal: 6, registryKey: 'furniture_craft_recipes', progressMode: 'max', reward: 0, category: 'collection', location: '살림 가구 · DIY 작업일지', prerequisite: 'story_diy_first', rewardLabel: '생활 제작자 배지', order: 80 },
  { id: 'collect_diy_12', name: '열두 번의 새 쓰임', desc: 'DIY 가구 12종 설계도 모두 제작하기', goal: 12, registryKey: 'furniture_craft_recipes', progressMode: 'max', reward: 0, category: 'collection', location: '살림 가구 · DIY 작업일지', prerequisite: 'collect_diy_6', rewardLabel: '업사이클 공방장 배지', order: 81 },
  { id: 'collect_weekly_4', name: '한 달의 살림 기록', desc: '주간 큐레이션 가구 4종 수집하기', goal: 4, registryKey: 'weekly_furniture_unique', progressMode: 'max', reward: 0, category: 'collection', location: '살림 가구 · 4주 순환 수첩', prerequisite: 'story_shop_first', rewardLabel: '주간 큐레이터 배지', order: 82 },
  { id: 'collect_weekly_16', name: '돌아온 열여섯 점', desc: '주간 큐레이션 가구 16종 모두 수집하기', goal: 16, registryKey: 'weekly_furniture_unique', progressMode: 'max', reward: 0, category: 'collection', location: '살림 가구 · 4주 순환 수첩', prerequisite: 'collect_weekly_4', rewardLabel: '순환 살림 기록가 배지', order: 83 },
  { id: 'master_diy_30', name: '손때가 만든 서른 번째 가구', desc: 'DIY 작업대에서 누적 30점 제작하기', goal: 30, registryKey: 'furniture_craft_total', reward: 0, category: 'mastery', location: '살림 가구 · DIY 작업대', prerequisite: 'story_diy_first', rewardLabel: '골목 생활 공예가 배지', order: 84 },
  { id: 'collect_sallim_10', name: '열 가지 생활의 표정', desc: '서로 다른 생활 물건 10종 발견하기', goal: 10, registryKey: 'items_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 생활 물건 도감', prerequisite: 'story_shop_first', rewardLabel: '살림 수집 입문 배지', order: 89 },
  { id: 'collect_sallim_30', name: '서른 칸의 취향 선반', desc: '서로 다른 생활 물건 30종 발견하기', goal: 30, registryKey: 'items_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 생활 물건 도감', prerequisite: 'collect_sallim_10', rewardLabel: '생활 물건 큐레이터 배지', order: 90 },
  { id: 'collect_sallim_65', name: '예순다섯 살림의 작은 박물관', desc: '생활 물건 65종 도감 완성하기', goal: 65, registryKey: 'items_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 생활 물건 도감', prerequisite: 'collect_sallim_30', rewardLabel: '홍대 살림 아카이비스트 배지', order: 91 },
  { id: 'master_shop_50', name: '오래 고른 방의 역사', desc: '살림 가구에서 누적 50점 구매하기', goal: 50, registryKey: 'shop_purchase', reward: 0, category: 'mastery', location: '살림 가구 · 여섯 진열대', prerequisite: 'story_shop_first', rewardLabel: '골목 단골 바이어 배지', order: 92 },
];

/** 주민 10명의 관계 1막과 개인 부탁을 데이터에서 생성한다. */
const RESIDENT_STORY_QUESTS: QuestDef[] = residentStoryEntries().flatMap(({ resident, arc, index }) => {
  const bondId = `story_resident_${resident.id}_bond`;
  return [
    {
      id: bondId,
      name: `${resident.name}의 두 번째 인사`,
      desc: `${resident.name} 신뢰도 30 달성하기`,
      goal: 30,
      registryKey: residentTrustMetricKey(resident.id),
      reward: 0,
      category: 'story' as const,
      location: `${resident.role} · 주민 이름표 근처`,
      tip: '주민별 신뢰도는 하루 첫 인사에서만 오르고 절대 줄지 않아요.',
      prerequisite: 'intro_greet',
      progressMode: 'max' as const,
      rewardLabel: arc.bondReward,
      order: 300 + index * 20,
    },
    {
      id: `story_resident_${resident.id}_request`,
      name: arc.request.title,
      desc: arc.request.desc,
      goal: arc.request.goal,
      registryKey: arc.request.registryKey,
      reward: 0,
      category: 'story' as const,
      location: arc.request.location,
      prerequisite: bondId,
      ...(arc.request.progressMode ? { progressMode: arc.request.progressMode } : {}),
      rewardLabel: arc.request.reward,
      order: 310 + index * 20,
    },
  ];
});

const COLLECTION_QUESTS: QuestDef[] = [
  { id: 'collect_sparkle_10', name: '반짝임 수첩', desc: '숨은 스팟을 누적 10번 발견하기', goal: 10, registryKey: 'sparkle_collect', reward: 0, category: 'collection', location: '마을과 숲길의 반짝이 스팟', prerequisite: 'intro_sparkle', rewardLabel: '골목 탐색가 배지', order: 10 },
  { id: 'collect_sparkle_30', name: '빛을 좇는 사람', desc: '숨은 스팟을 누적 30번 발견하기', goal: 30, registryKey: 'sparkle_collect', reward: 0, category: 'collection', location: '마을과 숲길의 반짝이 스팟', prerequisite: 'collect_sparkle_10', rewardLabel: '반짝임 수집가 배지', order: 20 },
  { id: 'collect_treasure_1', name: '첫 번째 보물', desc: '보물 도감에서 보물을 1개 제작하기', goal: 1, registryKey: 'treasure_crafted', reward: 0, category: 'collection', location: '보물 도감', prerequisite: 'intro_sparkle', rewardLabel: '보물 세공 입문 배지', order: 30 },
  { id: 'collect_treasure_5', name: '작은 진열장', desc: '서로 다른 보물을 5개 보유하기', goal: 5, registryKey: 'treasures_owned', progressMode: 'max', reward: 0, category: 'collection', location: '보물 도감', prerequisite: 'collect_treasure_1', rewardLabel: '보물 진열가 배지', order: 40 },
  { id: 'collect_pet_3', name: '왁자지껄한 산책', desc: '펫을 3마리 입양하기', goal: 3, registryKey: 'pets_owned', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 「멍냥이네」', prerequisite: 'intro_pet', rewardLabel: '세 친구 배지', order: 50 },
  { id: 'collect_pet_6', name: '멍냥이네 명예 가족', desc: '펫을 6마리 입양하기', goal: 6, registryKey: 'pets_owned', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 「멍냥이네」', prerequisite: 'collect_pet_3', rewardLabel: '펫 컬렉터 배지', order: 60 },
  { id: 'collect_weapon_3', name: '손에 맞는 도구', desc: '무기를 3종 보유하기', goal: 3, registryKey: 'weapons_owned', progressMode: 'max', reward: 0, category: 'collection', location: '대장간', prerequisite: 'intro_hunt', rewardLabel: '무기 수집가 배지', order: 70 },
  { id: 'collect_fashion_12', name: '열두 번의 변신', desc: '테마 코디를 누적 12번 입어보기', goal: 12, registryKey: 'fashion_preset', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 옷장', prerequisite: 'story_fashion_trip', rewardLabel: '패션 아카이브 배지', order: 80 },
  { id: 'collect_style_catalog', name: '아틀리에 비밀 서랍', desc: '희귀 스타일 10종을 모두 해금하기', goal: 10, registryKey: 'rare_styles', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 스타일 도감', prerequisite: 'story_style_scout', rewardLabel: '스타일 도감 완성 배지', order: 85 },
  { id: 'collect_lookbook_entries_6', name: '여섯 장의 골목 화보', desc: '서로 다른 코디 의뢰 6개 기록하기', goal: 6, registryKey: 'lookbook_entries', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 골목 룩북', prerequisite: 'story_lookbook_first', rewardLabel: '골목 화보 편집자 배지', order: 86 },
  { id: 'collect_lookbook_entries_12', name: '열두 장의 계절 옷장', desc: '골목 룩북 코디 의뢰 12개를 모두 기록하기', goal: 12, registryKey: 'lookbook_entries', progressMode: 'max', reward: 0, category: 'collection', location: '골목 룩북 · 열두 의뢰서', prerequisite: 'collect_lookbook_entries_6', rewardLabel: '홍대 룩북 아카이비스트 배지', order: 87 },
  { id: 'collect_lookbook_stars_18', name: '반짝임을 고르는 눈', desc: '골목 룩북 최고 별을 합계 18개 모으기', goal: 18, registryKey: 'lookbook_stars', progressMode: 'max', reward: 0, category: 'collection', location: '골목 룩북 · 최고 기록', prerequisite: 'story_lookbook_perfect', rewardLabel: '코디 별 수집가 배지', order: 88 },
  { id: 'collect_lookbook_stars_36', name: '서른여섯 별의 스타일 북', desc: '12개 의뢰를 모두 최고 별 3개로 완성하기', goal: 36, registryKey: 'lookbook_stars', progressMode: 'max', reward: 0, category: 'collection', location: '골목 룩북 · 36별 기록', prerequisite: 'collect_lookbook_stars_18', rewardLabel: '스타일 북 완성자 배지', order: 89 },
  { id: 'collect_showcase_entries_8', name: '여덟 장의 주민 전시', desc: '집과 펫 전시 주제 8개에 모두 기록 남기기', goal: 8, registryKey: 'taste_showcase_entries', progressMode: 'max', reward: 0, category: 'collection', location: '골목 취향 전시회 · 주제 색인', prerequisite: 'story_showcase_first', rewardLabel: '골목 취향 아카이비스트 배지', order: 90 },
  { id: 'collect_showcase_stamps_24', name: '스물네 번의 작은 인정', desc: '집과 펫 전시의 최고 도장 합계 24개 모으기', goal: 24, registryKey: 'taste_showcase_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '골목 취향 전시회 · 최고 기록', prerequisite: 'collect_showcase_entries_8', rewardLabel: '주민 전시 완성자 배지', order: 91 },
  { id: 'collect_club_chapters_12', name: '열두 장의 생활 회보', desc: '골목 동아리 장을 합계 12장 발간하기', goal: 12, registryKey: 'hobby_club_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '골목 동아리 · 발간 페이지', prerequisite: 'story_club_first', rewardLabel: '생활 회보 수집가 배지', order: 92 },
  { id: 'collect_club_societies_6', name: '여섯 모임의 열린 문', desc: '여섯 동아리에서 각각 한 장 이상 발간하기', goal: 6, registryKey: 'hobby_club_societies', progressMode: 'max', reward: 0, category: 'collection', location: '골목 동아리 · 여섯 모임', prerequisite: 'story_club_three', rewardLabel: '전 동아리 이웃 배지', order: 93 },
  { id: 'collect_project_phases_10', name: '열 번 달라진 골목 풍경', desc: '공동 프로젝트 단계를 합계 10번 완성하기', goal: 10, registryKey: 'community_project_phases', progressMode: 'max', reward: 0, category: 'collection', location: '골목 함께짓기 · 단계 연표', prerequisite: 'story_project_first', rewardLabel: '생활 공간 조율사 배지', order: 94 },
  { id: 'collect_projects_5', name: '다섯 장소의 열린 문', desc: '다섯 공동 프로젝트를 모두 완공하기', goal: 5, registryKey: 'community_projects_completed', progressMode: 'max', reward: 0, category: 'collection', location: '골목 함께짓기 · 완공 기록', prerequisite: 'collect_project_phases_10', rewardLabel: '홍대 공용공간 기록가 배지', order: 95 },
  { id: 'collect_shared_project_kinds_4', name: '네 가지 마음의 화단', desc: '모두의 밤정원 마음 도감 4종 기록하기', goal: 4, registryKey: 'shared_project_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '모두의 밤정원 · 여덟 마음 도감', prerequisite: 'story_shared_project_first', rewardLabel: '밤정원 이웃 배지', order: 96 },
  { id: 'collect_shared_project_kinds_8', name: '여덟 마음이 켜진 정원', desc: '모두의 밤정원 마음 도감 8종 모두 기록하기', goal: 8, registryKey: 'shared_project_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '모두의 밤정원 · 여덟 마음 도감', prerequisite: 'collect_shared_project_kinds_4', rewardLabel: '공동 마음 수집가 배지', order: 97 },
  { id: 'collect_shared_project_chapters_3', name: '세 밤에 남은 내 자리', desc: '서로 다른 공동 밤정원 3장에 함께하기', goal: 3, registryKey: 'shared_project_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '모두의 밤정원 · 함께한 밤 기록', prerequisite: 'story_shared_project_first', rewardLabel: '밤의 연대기 배지', order: 98 },
  { id: 'collect_shelf_kinds_4', name: '네 갈래로 뻗은 위시보드', desc: '서로 다른 수집 분야 4종을 선반에 함께 담기', goal: 4, registryKey: 'collection_shelf_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 스타일·동행·가구·생활 선반', prerequisite: 'story_collection_shelf_first', rewardLabel: '다취향 수집가 배지', order: 99 },
  { id: 'collect_shelf_completed_4', name: '기다림 끝에 도착한 네 가지', desc: '수집 선반 목표 4개 완성하기', goal: 4, registryKey: 'collection_shelf_completed', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 나의 수집 선반', prerequisite: 'story_collection_shelf_first', rewardLabel: '위시 실현가 배지', order: 100 },
  { id: 'collect_home_unique_20', name: '스무 가지 살림 이야기', desc: '내 집에 서로 다른 가구 20종 배치하기', goal: 20, registryKey: 'home_unique_items', progressMode: 'max', reward: 0, category: 'collection', location: '가구점과 내 집', prerequisite: 'story_home_balance', rewardLabel: '홈 컬렉터 배지', order: 90 },
  { id: 'collect_photo_frames_4', name: '프레임을 고르는 눈', desc: '서로 다른 네컷 프레임 4종 사용하기', goal: 4, registryKey: 'photo_frames', progressMode: 'max', reward: 0, category: 'collection', location: '네컷 작업실 · 프레임 선반', prerequisite: 'story_photo_album', rewardLabel: '필름 프레임 큐레이터 배지', order: 91 },
  { id: 'collect_photo_backdrops_6', name: '여섯 곳의 같은 얼굴', desc: '네컷 배경 6종을 모두 사진에 남기기', goal: 6, registryKey: 'photo_backdrops', progressMode: 'max', reward: 0, category: 'collection', location: '네컷 작업실 · 배경 선택', prerequisite: 'story_photo_album', rewardLabel: '골목 로케이션 수집가 배지', order: 93 },
  { id: 'collect_photo_stickers_12', name: '열두 표식의 최애 스크랩북', desc: '포토카드에 서로 다른 픽셀 스티커 12종 모두 사용하기', goal: 12, registryKey: 'photo_card_stickers', progressMode: 'max', reward: 0, category: 'collection', location: '네컷 작업실 · 포토카드 스티커함', prerequisite: 'story_photo_card_first', rewardLabel: '픽셀 스티커 전집 배지', order: 94 },
  { id: 'collect_photo_foils_3', name: '세 번 다르게 반짝이는 필름', desc: '은빛·무지개·심야 포일 3종을 포토카드에 사용하기', goal: 3, registryKey: 'photo_card_foils', progressMode: 'max', reward: 0, category: 'collection', location: '네컷 작업실 · 포토카드 포일 선반', prerequisite: 'story_photo_card_first', rewardLabel: '홀로그램 필름 수집가 배지', order: 95 },
  { id: 'collect_life_specialty_10', name: '열 가지 생활의 첫 자격', desc: '생활 숙련으로 서로 다른 자격 카드 10장 해금하기', goal: 10, registryKey: 'life_specialty_cards', progressMode: 'max', reward: 0, category: 'collection', location: '모험 일지 · 생활 · 전문성 보드', prerequisite: 'story_life_specialty_first', rewardLabel: '다재다능 생활인 배지', order: 96 },
  { id: 'collect_life_specialty_30', name: '서른 장의 생활 직업 백과', desc: '열 분야의 생활 자격 카드 30장을 모두 해금하기', goal: 30, registryKey: 'life_specialty_cards', progressMode: 'max', reward: 0, category: 'collection', location: '모험 일지 · 생활 · 전문성 보드', prerequisite: 'collect_life_specialty_10', rewardLabel: '홍대 생활 직업 아카이비스트 휘장', order: 97 },
  { id: 'collect_life_synergies_6', name: '여섯 이름으로 불리는 생활', desc: '대표 전문성 조합을 바꾸며 생활 시너지 6종 발견하기', goal: 6, registryKey: 'life_specialty_synergies', progressMode: 'max', reward: 0, category: 'collection', location: '모험 일지 · 생활 · 시너지 도감', prerequisite: 'story_life_synergy_first', rewardLabel: '다취향 생활 조합가 배지', order: 98 },
  { id: 'collect_garden_species_6', name: '여섯 향의 작은 옥상', desc: '서로 다른 식물 6종 수확하기', goal: 6, registryKey: 'garden_species', progressMode: 'max', reward: 0, category: 'collection', location: '옥상 씨앗 연구소 · 씨앗 서랍', prerequisite: 'story_garden_harvest', rewardLabel: '생활 식물 관찰가 배지', order: 95 },
  { id: 'collect_garden_species_12', name: '홍대의 열두 잎', desc: '식물 12종을 모두 수확하기', goal: 12, registryKey: 'garden_species', progressMode: 'max', reward: 0, category: 'collection', location: '옥상 씨앗 연구소 · 씨앗 서랍', prerequisite: 'collect_garden_species_6', rewardLabel: '도시 식물도감 배지', order: 97 },
  { id: 'collect_garden_specimens_18', name: '햇살과 빗방울 사이', desc: '서로 다른 성장 결 표본 18칸 채우기', goal: 18, registryKey: 'garden_specimens', progressMode: 'max', reward: 0, category: 'collection', location: '옥상 씨앗 연구소 · 36칸 표본함', prerequisite: 'collect_garden_species_6', rewardLabel: '성장 결 기록가 배지', order: 99 },
  { id: 'collect_garden_specimens_36', name: '서른여섯 번의 초록', desc: '12종의 세 가지 성장 결 표본을 모두 모으기', goal: 36, registryKey: 'garden_specimens', progressMode: 'max', reward: 0, category: 'collection', location: '옥상 씨앗 연구소 · 36칸 표본함', prerequisite: 'collect_garden_specimens_18', rewardLabel: '옥상 식물 아카이비스트 배지', order: 101 },
  { id: 'collect_cooking_recipes_6', name: '여섯 장의 작은 메뉴판', desc: '서로 다른 메뉴 6종 완성하기', goal: 6, registryKey: 'cooking_recipes', progressMode: 'max', reward: 0, category: 'collection', location: '골목 주방 · 메뉴 카드', prerequisite: 'story_cooking_first', rewardLabel: '동네 메뉴 연구가 배지', order: 103 },
  { id: 'collect_cooking_recipes_12', name: '열두 식물의 식탁', desc: '정원 식물 12종의 메뉴를 모두 만들기', goal: 12, registryKey: 'cooking_recipes', progressMode: 'max', reward: 0, category: 'collection', location: '골목 주방 · 메뉴 카드', prerequisite: 'collect_cooking_recipes_6', rewardLabel: '홍대 코스 설계자 배지', order: 105 },
  { id: 'collect_cooking_plates_18', name: '접시 위의 세 가지 날씨', desc: '서로 다른 성장 결 플레이팅 18칸 채우기', goal: 18, registryKey: 'cooking_plates', progressMode: 'max', reward: 0, category: 'collection', location: '골목 주방 · 36칸 플레이팅 노트', prerequisite: 'collect_cooking_recipes_6', rewardLabel: '플레이팅 기록가 배지', order: 107 },
  { id: 'collect_cooking_plates_36', name: '서른여섯 접시의 골목', desc: '12메뉴의 성장 결 플레이팅을 모두 완성하기', goal: 36, registryKey: 'cooking_plates', progressMode: 'max', reward: 0, category: 'collection', location: '골목 주방 · 36칸 플레이팅 노트', prerequisite: 'collect_cooking_plates_18', rewardLabel: '모퉁이 메뉴 아카이비스트 배지', order: 109 },
  { id: 'collect_fishing_species_6', name: '한 물가의 여섯 얼굴', desc: '서로 다른 물가 생물 6종 발견하기', goal: 6, registryKey: 'fishing_species', progressMode: 'max', reward: 0, category: 'collection', location: '낚시 수첩 · 열여덟 생물 기록', prerequisite: 'story_fishing_first', rewardLabel: '물가 관찰가 배지', order: 111 },
  { id: 'collect_fishing_species_12', name: '두 물길을 잇는 수첩', desc: '서로 다른 물가 생물 12종 발견하기', goal: 12, registryKey: 'fishing_species', progressMode: 'max', reward: 0, category: 'collection', location: '세 물가 · 생물 도감', prerequisite: 'collect_fishing_species_6', rewardLabel: '도심 수로 연구가 배지', order: 113 },
  { id: 'collect_fishing_species_18', name: '열여덟 번의 물결 인사', desc: '세 물가의 생물 18종을 모두 발견하기', goal: 18, registryKey: 'fishing_species', progressMode: 'max', reward: 0, category: 'collection', location: '낚시 수첩 · 열여덟 생물 기록', prerequisite: 'collect_fishing_species_12', rewardLabel: '홍대 물생태 아카이비스트 배지', order: 115 },
  { id: 'collect_fishing_stamps_27', name: '동빛과 은빛 사이', desc: '크기 기록 도장 27개 모으기', goal: 27, registryKey: 'fishing_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '낚시 수첩 · 54칸 크기 기록', prerequisite: 'collect_fishing_species_6', rewardLabel: '크기 기록가 배지', order: 117 },
  { id: 'collect_fishing_stamps_54', name: '쉰네 번의 반짝임', desc: '18종의 동·은·금 크기 도장을 모두 채우기', goal: 54, registryKey: 'fishing_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '낚시 수첩 · 54칸 크기 기록', prerequisite: 'collect_fishing_stamps_27', rewardLabel: '금빛 물결 도감 배지', order: 119 },
  { id: 'collect_aquarium_display_3', name: '세 물결이 사는 작은 방', desc: '물결 테라리움 전시 슬롯 세 칸 모두 채우기', goal: 3, registryKey: 'aquarium_displayed', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 물결 테라리움 작업실', prerequisite: 'story_aquarium_first', rewardLabel: '세 물결 조율사 배지', order: 120 },
  { id: 'collect_aquarium_frames_3', name: '수조도 옷을 갈아입어요', desc: '테라리움 프레임 3종 해금하기', goal: 3, registryKey: 'aquarium_frames', progressMode: 'max', reward: 0, category: 'collection', location: '테라리움 작업실 · 프레임 선반', prerequisite: 'story_aquarium_first', rewardLabel: '수조 프레임 연구가 배지', order: 121 },
  { id: 'collect_aquarium_frames_6', name: '여섯 개의 물가 창문', desc: '테라리움 프레임 6종 모두 해금하기', goal: 6, registryKey: 'aquarium_frames', progressMode: 'max', reward: 0, category: 'collection', location: '테라리움 작업실 · 프레임 선반', prerequisite: 'collect_aquarium_frames_3', rewardLabel: '물가 공간 디렉터 배지', order: 122 },
  { id: 'collect_aquarium_substrates_6', name: '물밑에도 여섯 가지 취향', desc: '테라리움 바닥재 6종 모두 해금하기', goal: 6, registryKey: 'aquarium_substrates', progressMode: 'max', reward: 0, category: 'collection', location: '테라리움 작업실 · 바닥 재료', prerequisite: 'collect_fishing_stamps_27', rewardLabel: '물밑 재료 아카이비스트 배지', order: 123 },
  { id: 'collect_aquarium_ornaments_6', name: '열여덟 금빛의 작은 박물관', desc: '테라리움 내부 장식 6종 모두 해금하기', goal: 6, registryKey: 'aquarium_ornaments', progressMode: 'max', reward: 0, category: 'collection', location: '테라리움 작업실 · 장식 서랍', prerequisite: 'story_fishing_gold', rewardLabel: '수중 장면 연출가 배지', order: 124 },
  { id: 'collect_reform_combos_12', name: '열두 칸의 재료 수첩', desc: '서로 다른 리폼 마감·색감 조합 12개 기록하기', goal: 12, registryKey: 'furniture_reform_combos', progressMode: 'max', reward: 0, category: 'collection', location: '가구 리폼 공방 · 48칸 조합 도감', prerequisite: 'story_reform_first', rewardLabel: '리폼 견본 수집가 배지', order: 125 },
  { id: 'collect_reform_combos_24', name: '스물네 번 달라진 표정', desc: '서로 다른 리폼 조합 24개 기록하기', goal: 24, registryKey: 'furniture_reform_combos', progressMode: 'max', reward: 0, category: 'collection', location: '가구 리폼 공방 · 48칸 조합 도감', prerequisite: 'collect_reform_combos_12', rewardLabel: '가구 색채 연구가 배지', order: 126 },
  { id: 'collect_reform_combos_48', name: '마흔여덟 결의 작은 집', desc: '6가지 마감과 8가지 색감의 48조합을 모두 기록하기', goal: 48, registryKey: 'furniture_reform_combos', progressMode: 'max', reward: 0, category: 'collection', location: '가구 리폼 공방 · 완성 도감', prerequisite: 'collect_reform_combos_24', rewardLabel: '홍대 리폼 아카이비스트 배지', order: 127 },
  { id: 'collect_reform_finishes_6', name: '손끝에 남은 여섯 질감', desc: '가구 리폼 마감 6종을 모두 조합에 사용하기', goal: 6, registryKey: 'furniture_reform_finishes', progressMode: 'max', reward: 0, category: 'collection', location: '가구 리폼 공방 · 재질 마감', prerequisite: 'story_reform_first', rewardLabel: '재질 감별사 배지', order: 128 },
  { id: 'collect_reform_colors_8', name: '골목에서 주운 여덟 색', desc: '가구 리폼 색감 8종을 모두 조합에 사용하기', goal: 8, registryKey: 'furniture_reform_colors', progressMode: 'max', reward: 0, category: 'collection', location: '가구 리폼 공방 · 색감 팔레트', prerequisite: 'story_reform_first', rewardLabel: '생활 팔레트 배지', order: 129 },
  { id: 'collect_moodboards_4', name: '네 장면의 작은 집', desc: '서로 다른 홈 무드보드 테마 4개 완성하기', goal: 4, registryKey: 'home_moodboard_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 홈 무드보드 연구실', prerequisite: 'story_moodboard_first', rewardLabel: '생활 장면 편집자 배지', order: 130 },
  { id: 'collect_moodboards_8', name: '여덟 번 달라진 창문', desc: '홈 무드보드 완성 도장 8개 모으기', goal: 8, registryKey: 'home_moodboard_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '홈 무드보드 연구실 · 테마 색인', prerequisite: 'collect_moodboards_4', rewardLabel: '공간 무드 큐레이터 배지', order: 131 },
  { id: 'collect_moodboards_12', name: '열두 장면으로 쓴 집', desc: '12가지 홈 무드보드 테마를 모두 완성하기', goal: 12, registryKey: 'home_moodboard_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '홈 무드보드 연구실 · 완성 도감', prerequisite: 'collect_moodboards_8', rewardLabel: '홍대 홈 아카이비스트 배지', order: 132 },
  { id: 'collect_home_visitors_5', name: '다섯 켤레의 실내화', desc: '서로 다른 주민 5명의 집들이 추억 기록하기', goal: 5, registryKey: 'home_visits', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 우리 집 방문 앨범', prerequisite: 'story_home_first_guest', rewardLabel: '골목 사랑방 배지', order: 92 },
  { id: 'collect_home_visitors_10', name: '열 사람의 사랑방', desc: '주민 10명의 집들이 추억 모두 기록하기', goal: 10, registryKey: 'home_visits', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 우리 집 방문 앨범', prerequisite: 'collect_home_visitors_5', rewardLabel: '홍대 사랑방지기 배지', order: 94 },
  { id: 'collect_pet_tricks_5', name: '우리 집 개인기 도감', desc: '한 펫이 트릭 5개를 모두 배우기', goal: 5, registryKey: 'pet_tricks', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 「멍냥이네」', prerequisite: 'story_pet_trick', rewardLabel: '트릭 마스터 배지', order: 100 },
  { id: 'collect_pet_accessories_5', name: '다섯 번의 산책 단장', desc: '펫 액세서리 5종 해금하기', goal: 5, registryKey: 'pet_accessories', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 · 액세서리 도감', prerequisite: 'story_pet_accessory', rewardLabel: '펫 패션 수집가 배지', order: 102 },
  { id: 'collect_pet_personalities_4', name: '서로 다른 네 개의 마음', desc: '보유 펫에게 서로 다른 성격 4종 기록하기', goal: 4, registryKey: 'pet_personalities', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 · 개성 프로필', prerequisite: 'story_pet_profile', rewardLabel: '마음 관찰가 배지', order: 104 },
  { id: 'collect_pet_outing_routes_4', name: '네 갈래 동행 지도', desc: '서로 다른 산책 코스 4곳 기록하기', goal: 4, registryKey: 'pet_outing_routes', progressMode: 'max', reward: 0, category: 'collection', location: '동행 산책 수첩 · 여덟 골목', prerequisite: 'story_pet_outing_souvenir', rewardLabel: '반나절 산책가 배지', order: 105 },
  { id: 'collect_pet_outing_routes_8', name: '여덟 골목을 외운 발', desc: '산책 코스 8곳을 모두 기록하기', goal: 8, registryKey: 'pet_outing_routes', progressMode: 'max', reward: 0, category: 'collection', location: '동행 산책 수첩 · 여덟 골목', prerequisite: 'collect_pet_outing_routes_4', rewardLabel: '홍대 동행 지도사 배지', order: 106 },
  { id: 'collect_pet_outing_stamps_12', name: '열두 개의 작은 풍경', desc: '산책 기념 도장 12개 모으기', goal: 12, registryKey: 'pet_outing_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '동행 산책 수첩 · 24칸 기념 도감', prerequisite: 'story_pet_outing_souvenir', rewardLabel: '동행 기념품 기록가 배지', order: 107 },
  { id: 'collect_pet_outing_stamps_24', name: '스물네 번의 나란한 발자국', desc: '여덟 코스의 기념 도장 24개 모두 모으기', goal: 24, registryKey: 'pet_outing_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '동행 산책 수첩 · 24칸 기념 도감', prerequisite: 'collect_pet_outing_stamps_12', rewardLabel: '골목 동행 아카이비스트 배지', order: 108 },
  { id: 'collect_pet_outing_partners_3', name: '세 친구와 같은 골목', desc: '서로 다른 동행 펫 3마리와 산책하기', goal: 3, registryKey: 'pet_outing_partners', progressMode: 'max', reward: 0, category: 'collection', location: '동행 산책 수첩 · 동행 기록', prerequisite: 'story_pet_outing_first', rewardLabel: '다정한 산책 모임장 배지', order: 109 },
  { id: 'collect_pet_home_memories_9', name: '아홉 번 다르게 머문 자리', desc: '성격과 가구가 만든 서로 다른 집 추억 9개 기록하기', goal: 9, registryKey: 'pet_home_memories', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 동행의 자리 수첩', prerequisite: 'story_pet_home_personality', rewardLabel: '집 생활 기록가 배지', order: 110 },
  { id: 'collect_pet_home_memories_18', name: '열여덟 장의 함께 사는 법', desc: '여섯 성격의 집 생활 추억 18개 모두 기록하기', goal: 18, registryKey: 'pet_home_memories', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 동행의 자리 전체 기록', prerequisite: 'collect_pet_home_memories_9', rewardLabel: '동행 생활 아카이비스트 배지', order: 111 },
  { id: 'collect_pet_home_personalities_3', name: '세 가지 마음이 고른 가구', desc: '서로 다른 성격 3종의 집 생활 장면 기록하기', goal: 3, registryKey: 'pet_home_personalities', progressMode: 'max', reward: 0, category: 'collection', location: '펫 프로필과 내 집 · 성격 기록', prerequisite: 'story_pet_home_first', rewardLabel: '동행 성격 연구가 배지', order: 112 },
  { id: 'collect_pet_home_personalities_6', name: '여섯 마음의 작은 집', desc: '여섯 성격 모두에서 집 생활 장면 기록하기', goal: 6, registryKey: 'pet_home_personalities', progressMode: 'max', reward: 0, category: 'collection', location: '동행의 자리 · 여섯 성격 도감', prerequisite: 'collect_pet_home_personalities_3', rewardLabel: '여섯 마음 이해자 배지', order: 113 },
  { id: 'collect_pet_home_partners_3', name: '세 친구가 남긴 서로 다른 자리', desc: '서로 다른 동행 펫 3마리의 집 추억 기록하기', goal: 3, registryKey: 'pet_home_partners', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 프로필 · 동행의 자리 기록', prerequisite: 'story_pet_home_first', rewardLabel: '복작복작 동거인 배지', order: 114 },
  { id: 'collect_every_neighbor', name: '열 사람, 열 개의 골목', desc: '이름 있는 주민 10명을 모두 만나기', goal: 10, registryKey: 'residents_met', progressMode: 'max', reward: 0, category: 'collection', location: '마을 지도와 주민 수첩', prerequisite: 'story_neighbor_circle', rewardLabel: '홍대 인맥 지도 배지', order: 110 },
  { id: 'collect_online_encounters', name: '스쳐 간 닉네임들', desc: '온라인 이웃과 누적 10번 마주치기', goal: 10, registryKey: 'online_encounter', reward: 0, category: 'collection', location: '아이소메트릭 온라인 마을', prerequisite: 'story_first_chat', rewardLabel: '마을 접속 명부 배지', order: 120 },
  { id: 'collect_monster_5', name: '외곽숲 관찰 노트', desc: '서로 다른 몬스터 5종 발견하기', goal: 5, registryKey: 'monster_species', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 몬스터 연구', prerequisite: 'intro_hunt', rewardLabel: '초보 생태 연구가 배지', order: 130 },
  { id: 'collect_monster_15', name: '세 티어의 얼굴들', desc: '서로 다른 몬스터 15종 발견하기', goal: 15, registryKey: 'monster_species', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 몬스터 연구', prerequisite: 'collect_monster_5', rewardLabel: '외곽숲 기록가 배지', order: 140 },
  { id: 'collect_monster_30', name: '서른 생명의 도감', desc: '몬스터 30종 도감 완성하기', goal: 30, registryKey: 'monster_species', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 몬스터 연구', prerequisite: 'collect_monster_15', rewardLabel: '홍대 생태 박사 배지', order: 150 },
  { id: 'collect_dolls_6', name: '유리장 속 여섯 친구', desc: '인형뽑기 인형 6종을 모두 모으기', goal: 6, registryKey: 'dolls_owned', progressMode: 'max', reward: 0, category: 'collection', location: '오락 골목 인형뽑기', prerequisite: 'story_claw_first', rewardLabel: '인형 구조대장 배지', order: 160 },
  { id: 'collect_request_stamps_12', name: '열두 장의 고마운 쪽지', desc: '서로 다른 골목 의뢰 도장 12개 모으기', goal: 12, registryKey: 'village_request_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 24장 종이 도감', prerequisite: 'story_request_first', rewardLabel: '의뢰 수첩가 배지', order: 170 },
  { id: 'collect_request_stamps_24', name: '스물네 사람의 부탁 지도', desc: '골목 의뢰 도장 24개를 모두 모으기', goal: 24, registryKey: 'village_request_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 24장 종이 도감', prerequisite: 'collect_request_stamps_12', rewardLabel: '홍대 해결사 배지', order: 180 },
  { id: 'collect_request_categories_8', name: '여덟 갈래 생활의 손', desc: '의뢰 8분야에서 모두 한 번 이상 도장 받기', goal: 8, registryKey: 'village_request_categories', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 분야 도감', prerequisite: 'story_request_categories_4', rewardLabel: '생활 연결자 배지', order: 190 },
];

const MASTERY_QUESTS: QuestDef[] = [
  { id: 'master_kill_10', name: '사냥터 적응', desc: '몬스터를 누적 10마리 처치하기', goal: 10, registryKey: 'monster_kill', reward: 0, category: 'mastery', location: '마을 외곽 사냥터', prerequisite: 'intro_hunt', rewardLabel: '견습 사냥꾼 배지', order: 10 },
  { id: 'master_kill_50', name: '골목을 지키는 힘', desc: '몬스터를 누적 50마리 처치하기', goal: 50, registryKey: 'monster_kill', reward: 0, category: 'mastery', location: '마을 외곽 사냥터', prerequisite: 'master_kill_10', rewardLabel: '마을 수호자 배지', order: 20 },
  { id: 'master_kill_100', name: '백 번의 승리', desc: '몬스터를 누적 100마리 처치하기', goal: 100, registryKey: 'monster_kill', reward: 0, category: 'mastery', location: '마을 외곽 사냥터', prerequisite: 'master_kill_50', rewardLabel: '백전연마 배지', order: 30 },
  { id: 'master_level_5', name: '익숙해진 발걸음', desc: '캐릭터 레벨 5 달성하기', goal: 5, registryKey: 'player_level', progressMode: 'max', reward: 0, category: 'mastery', location: '사냥과 마을 활동', prerequisite: 'intro_hunt', rewardLabel: '성장 기록 I', order: 40 },
  { id: 'master_level_10', name: '홍대의 모험가', desc: '캐릭터 레벨 10 달성하기', goal: 10, registryKey: 'player_level', progressMode: 'max', reward: 0, category: 'mastery', location: '사냥과 마을 활동', prerequisite: 'master_level_5', rewardLabel: '성장 기록 II', order: 50 },
  { id: 'master_level_20', name: '골목의 베테랑', desc: '캐릭터 레벨 20 달성하기', goal: 20, registryKey: 'player_level', progressMode: 'max', reward: 0, category: 'mastery', location: '사냥과 마을 활동', prerequisite: 'master_level_10', rewardLabel: '성장 기록 III', order: 60 },
  { id: 'master_tier_5', name: '더 깊은 사냥터로', desc: '사냥 티어 5에 도달하기', goal: 5, registryKey: 'battle_tier', progressMode: 'max', reward: 0, category: 'mastery', location: '마을 외곽 사냥터', prerequisite: 'master_kill_10', rewardLabel: '전투 숙련 배지', order: 70 },
  { id: 'master_streak_20', name: '흐트러지지 않는 호흡', desc: '외곽숲에서 20연속 처치 달성하기', goal: 20, registryKey: 'monster_streak', progressMode: 'max', reward: 0, category: 'mastery', location: '동쪽 외곽숲', prerequisite: 'story_patrol_combo', rewardLabel: '연속 사냥 장인 배지', order: 75 },
  { id: 'master_monster_shards', name: '전투가 남긴 반짝임', desc: '몬스터에게서 보물 조각 누적 50개 얻기', goal: 50, registryKey: 'monster_shard', reward: 0, category: 'mastery', location: '동쪽 외곽숲과 보물 도감', prerequisite: 'collect_monster_5', rewardLabel: '조각 추적자 배지', order: 76 },
  { id: 'master_pet_affinity', name: '말하지 않아도 알아', desc: '한 펫의 친밀도 100 달성하기', goal: 100, registryKey: 'max_pet_affinity', progressMode: 'max', reward: 0, category: 'mastery', location: '동행 펫과 펫샵', prerequisite: 'intro_feed', rewardLabel: '영원한 단짝 배지', order: 80 },
  { id: 'master_decorate_50', name: '나만의 세계', desc: '가구를 누적 50개 배치하기', goal: 50, registryKey: 'q_place', reward: 0, category: 'mastery', location: '내 집', prerequisite: 'story_cozy_home', rewardLabel: '공간 장인 배지', order: 90 },
  { id: 'master_style_10', name: '흔들리지 않는 취향', desc: '캐릭터 모습을 누적 10번 저장하기', goal: 10, registryKey: 'customize_save', reward: 0, category: 'mastery', location: '캐릭터 아틀리에', prerequisite: 'story_wardrobe', rewardLabel: '스타일 마스터 배지', order: 100 },
  { id: 'master_closet_12', name: '코디 연구 노트', desc: '코디 슬롯 저장을 누적 12번 하기', goal: 12, registryKey: 'closet_save', reward: 0, category: 'mastery', location: '캐릭터 아틀리에 · 옷장', prerequisite: 'story_wardrobe', rewardLabel: '옷장 연구가 배지', order: 110 },
  { id: 'master_lookbook_submissions_30', name: '서른 번의 피팅 노트', desc: '코디 의뢰에 누적 30번 코디 기록 남기기', goal: 30, registryKey: 'lookbook_submissions', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 아틀리에 · 골목 룩북', prerequisite: 'story_lookbook_first', rewardLabel: '피팅 디렉터 배지', order: 112 },
  { id: 'master_lookbook_unique_20', name: '스무 벌, 스무 가지 대답', desc: '서로 다른 코디 20벌을 룩북에 기록하기', goal: 20, registryKey: 'lookbook_unique', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 룩북 · 서로 다른 코디 기록', prerequisite: 'collect_lookbook_entries_6', rewardLabel: '스타일 변주 장인 배지', order: 114 },
  { id: 'master_showcase_submissions_30', name: '서른 번 다시 읽은 취향', desc: '전시 주제에 현재 모습을 누적 30번 기록하기', goal: 30, registryKey: 'taste_showcase_submissions', progressMode: 'max', reward: 0, category: 'mastery', location: '중앙 광장 · 골목 취향 전시회', prerequisite: 'story_showcase_first', rewardLabel: '생활 취향 편집장 배지', order: 116 },
  { id: 'master_club_chapters_30', name: '서른 장의 골목 연대기', desc: '여섯 동아리의 30장을 모두 발간하기', goal: 30, registryKey: 'hobby_club_chapters', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 동아리 · 전권 기록', prerequisite: 'collect_club_chapters_12', rewardLabel: '골목 연대기 편집장 배지', order: 117 },
  { id: 'master_club_stamps_90', name: '아흔 번 쌓인 생활 증거', desc: '30개 장의 생활 조건 90개를 모두 기록하기', goal: 90, registryKey: 'hobby_club_stamps', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 동아리 · 조건 기록', prerequisite: 'collect_club_societies_6', rewardLabel: '여섯 취향 기록장 배지', order: 118 },
  { id: 'master_project_phases_20', name: '스무 단계의 마을 변화', desc: '다섯 공동 프로젝트의 20단계를 모두 완성하기', goal: 20, registryKey: 'community_project_phases', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 함께짓기 · 전체 설계도', prerequisite: 'collect_project_phases_10', rewardLabel: '마을 공간 설계장 배지', order: 119 },
  { id: 'master_project_contributions_80', name: '여든 번 모인 생활의 손', desc: '공동 프로젝트의 생활 기여 조건 80개를 모두 기록하기', goal: 80, registryKey: 'community_project_contributions', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 함께짓기 · 생활 기여', prerequisite: 'story_project_three', rewardLabel: '골목 함께짓기 총괄 배지', order: 120 },
  { id: 'master_shared_project_contributions_30', name: '서른 밤을 지킨 작은 등불', desc: '모두의 밤정원에 서로 다른 날 30장 건네기', goal: 30, registryKey: 'shared_project_contributions', progressMode: 'max', reward: 0, category: 'mastery', location: '모두의 밤정원 · 나의 공동 기록', prerequisite: 'collect_shared_project_kinds_4', rewardLabel: '밤정원 오래된 이웃 휘장', order: 121 },
  { id: 'master_shelf_completed_8', name: '여덟 칸에 도착한 오래된 소망', desc: '수집 선반 여덟 칸을 모두 완성 목표로 채우기', goal: 8, registryKey: 'collection_shelf_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '가이드북 · 여덟 칸 수집 선반', prerequisite: 'collect_shelf_completed_4', rewardLabel: '홍대 위시 아카이비스트 휘장', order: 122 },
  { id: 'master_home_score_90', name: '사람들이 찾아오는 집', desc: '홈 스타일 점수 90 달성하기', goal: 90, registryKey: 'home_score', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 홈 스타일 카드', prerequisite: 'story_home_signature', rewardLabel: '홍대 홈스타 배지', order: 120 },
  { id: 'master_reform_saves_30', name: '서른 번 다시 고른 취향', desc: '가구 리폼 외형을 누적 30번 저장하기', goal: 30, registryKey: 'furniture_reform_saves', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 가구 리폼 공방', prerequisite: 'story_reform_first', rewardLabel: '생활 리폼 장인 배지', order: 123 },
  { id: 'master_photo_album_12', name: '열두 장의 계절', desc: '필름 앨범 12칸을 모두 채우기', goal: 12, registryKey: 'photo_album', progressMode: 'max', reward: 0, category: 'mastery', location: '네컷 작업실 · 필름 앨범', prerequisite: 'story_photo_album', rewardLabel: '홍대 필름 아카이비스트 배지', order: 125 },
  { id: 'master_photo_cards_featured_3', name: '세 장으로 완성한 나의 최애 벽', desc: '포토카드 3장을 최애 전시에 올리기', goal: 3, registryKey: 'photo_cards_featured', progressMode: 'max', reward: 0, category: 'mastery', location: '네컷 작업실 · 포토카드 최애 전시', prerequisite: 'story_photo_card_first', rewardLabel: '최애 포토월 디렉터 휘장', order: 126 },
  { id: 'master_life_specialty_featured_3', name: '세 장으로 쓰는 나의 생활 소개', desc: '서로 다른 분야의 자격 카드 3장을 대표 전문성으로 전시하기', goal: 3, registryKey: 'life_specialty_featured_domains', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 · 전문성 보드', prerequisite: 'story_life_specialty_first', rewardLabel: '생활 포트폴리오 디렉터 휘장', order: 128 },
  { id: 'master_life_specialty_domains_10', name: '열 분야에 남긴 최고 인장', desc: '생활 숙련 열 분야에서 모두 Lv.8 최고 자격 해금하기', goal: 10, registryKey: 'life_specialty_mastered_domains', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 · 전문성 보드', prerequisite: 'collect_life_specialty_10', rewardLabel: '만능 생활 전설 휘장', order: 149 },
  { id: 'master_life_synergies_18', name: '열여덟 별자리의 생활 연대기', desc: '능력치 경쟁 없이 생활 시너지 18종 모두 발견하기', goal: 18, registryKey: 'life_specialty_synergies', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 · 시너지 도감 전권', prerequisite: 'collect_life_synergies_6', rewardLabel: '홍대 생활 조합 연대기 휘장', order: 150 },
  { id: 'master_garden_harvest_30', name: '서른 번의 손끝', desc: '식물을 누적 30번 수확하기', goal: 30, registryKey: 'garden_harvest', progressMode: 'max', reward: 0, category: 'mastery', location: '옥상 씨앗 연구소 · 네 화분', prerequisite: 'story_garden_harvest', rewardLabel: '계절 없는 정원사 배지', order: 127 },
  { id: 'master_cooking_30', name: '서른 접시의 저녁', desc: '메뉴를 누적 30접시 조리하기', goal: 30, registryKey: 'cooking_total', progressMode: 'max', reward: 0, category: 'mastery', location: '모퉁이 골목 주방', prerequisite: 'story_cooking_first', rewardLabel: '골목 저녁 책임자 배지', order: 129 },
  { id: 'master_fishing_50', name: '쉰 번의 느린 물결', desc: '세 물가에서 누적 50번 낚시하기', goal: 50, registryKey: 'fishing_total', progressMode: 'max', reward: 0, category: 'mastery', location: '철길 빗물정원·달빛 수로·옥상 구름저수조', prerequisite: 'story_fishing_first', rewardLabel: '물정원 단골 조사자 배지', order: 131 },
  { id: 'master_aquarium_save_20', name: '스무 번 바뀐 물속 풍경', desc: '물결 테라리움 구성을 누적 20번 저장하기', goal: 20, registryKey: 'aquarium_saves', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 물결 테라리움 작업실', prerequisite: 'story_aquarium_first', rewardLabel: '생활 수조 큐레이터 배지', order: 132 },
  { id: 'master_pet_memories', name: '사진보다 선명한 네 장면', desc: '한 펫의 추억 앨범 4칸 모두 채우기', goal: 4, registryKey: 'pet_memories', progressMode: 'max', reward: 0, category: 'mastery', location: '펫샵 「멍냥이네」', prerequisite: 'story_pet_trick', rewardLabel: '평생 가족 배지', order: 130 },
  { id: 'master_pet_style_20', name: '매일 다른 산책 준비', desc: '펫 프로필 또는 장식을 누적 20번 바꾸기', goal: 20, registryKey: 'pet_profile_edit', reward: 0, category: 'mastery', location: '펫샵 · 개성 프로필', prerequisite: 'story_pet_profile', rewardLabel: '동행 큐레이터 배지', order: 135 },
  { id: 'master_pet_outings_50', name: '쉰 번 나란히 걷는 법', desc: '동행 펫과 산책을 누적 50번 하기', goal: 50, registryKey: 'pet_outings_total', progressMode: 'max', reward: 0, category: 'mastery', location: '펫샵 · 동행 산책 수첩', prerequisite: 'story_pet_outing_first', rewardLabel: '평생 산책 친구 배지', order: 137 },
  { id: 'master_pet_home_scenes_50', name: '쉰 번 돌아온 익숙한 자리', desc: '집에서 동행 펫의 생활 장면을 누적 50번 만나기', goal: 50, registryKey: 'pet_home_scenes', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 좋아하는 가구 곁', prerequisite: 'story_pet_home_first', rewardLabel: '평생 집 동무 배지', order: 138 },
  { id: 'master_requests_30', name: '서른 번의 믿음직한 손', desc: '골목 의뢰를 누적 30번 완료하기', goal: 30, registryKey: 'village_requests_total', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 골목 의뢰소', prerequisite: 'story_request_first', rewardLabel: '동네 해결사 배지', order: 138 },
  { id: 'master_requests_100', name: '백 번 돌아온 고마움', desc: '골목 의뢰를 누적 100번 완료하기', goal: 100, registryKey: 'village_requests_total', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 골목 의뢰소', prerequisite: 'master_requests_30', rewardLabel: '전설의 이웃 배지', order: 139 },
  { id: 'master_request_rank_10', name: '게시판의 마지막 전구', desc: '골목 의뢰소 평판 Lv.10 달성하기', goal: 10, registryKey: 'village_request_rank', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 의뢰소 · 평판 전구', prerequisite: 'collect_request_stamps_24', rewardLabel: '홍대 의뢰 명인 휘장', order: 140 },
  { id: 'master_resident_family', name: '골목이 가족이 되는 날', desc: '한 주민과 신뢰도 100 달성하기', goal: 100, registryKey: 'resident_trust_max', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 수첩 · 일곱 번의 안부', prerequisite: 'story_trusted_friend', rewardLabel: '마을 가족 배지', order: 140 },
  { id: 'master_life_exploration_5', name: '발끝으로 외운 지도', desc: '골목 탐험 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_exploration_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_map', rewardLabel: '골목 길잡이 휘장', order: 150 },
  { id: 'master_life_style_5', name: '취향을 알아보는 눈', desc: '패션 감각 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_style_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'story_style', rewardLabel: '아틀리에 감별사 휘장', order: 160 },
  { id: 'master_life_home_5', name: '생활을 설계하는 손', desc: '공간 꾸미기 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_home_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_decorate', rewardLabel: '생활 공간 장인 휘장', order: 170 },
  { id: 'master_life_companion_5', name: '마음이 통하는 돌봄', desc: '동행 돌봄 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_companion_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_pet', rewardLabel: '동행 조련사 휘장', order: 180 },
  { id: 'master_life_community_5', name: '골목을 잇는 이름', desc: '이웃 관계 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_community_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_greet', rewardLabel: '마을 연결자 휘장', order: 190 },
  { id: 'master_life_performer_5', name: '하루가 무대가 될 때', desc: '골목 생활 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_performer_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_cafe', rewardLabel: '골목 무대 장인 휘장', order: 200 },
  { id: 'master_life_gardener_5', name: '옥상을 채운 손', desc: '도시 정원 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_gardener_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'story_garden_seed', rewardLabel: '옥상 식물 연구가 휘장', order: 205 },
  { id: 'master_life_culinary_5', name: '접시를 기억하는 손', desc: '골목 요리 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_culinary_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'story_cooking_first', rewardLabel: '모퉁이 셰프 휘장', order: 207 },
  { id: 'master_life_angler_5', name: '물결을 읽는 눈', desc: '물정원 낚시 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_angler_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'story_fishing_first', rewardLabel: '도심 물결 기록가 휘장', order: 208 },
  { id: 'master_life_adventure_5', name: '외곽의 길을 여는 사람', desc: '외곽 모험 숙련 Lv.5 달성하기', goal: 5, registryKey: 'mastery_adventure_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_hunt', rewardLabel: '외곽 개척자 휘장', order: 210 },
  { id: 'master_life_all_3', name: '열 갈래의 생활인', desc: '생활 숙련 10분야를 모두 Lv.3 이상 달성하기', goal: 3, registryKey: 'mastery_all_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'intro_journal', rewardLabel: '홍대 만능 생활인 휘장', order: 220 },
  { id: 'master_life_total_45', name: '끝나지 않는 취미 목록', desc: '생활 숙련 레벨 합계 45 달성하기', goal: 45, registryKey: 'mastery_total_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 생활 숙련', prerequisite: 'master_life_all_3', rewardLabel: '생활 백과사전 휘장', order: 230 },
];

/** 마감·실패 없이 기존 생활 기록을 네 정류장 코스로 엮는 소풍 엽서 목표. */
export const NEIGHBORHOOD_TOUR_QUESTS: QuestDef[] = [
  { id: 'story_tour_first', name: '네 모퉁이가 이어진 오후', desc: '골목 소풍 코스의 첫 완주 엽서 기록하기', goal: 1, registryKey: 'neighborhood_tour_postcards', progressMode: 'max', reward: 0, category: 'story', location: '중앙 광장 · 골목 소풍 안내소', prerequisite: 'intro_journal', rewardLabel: '첫 소풍 우편 도장', order: 126 },
  { id: 'story_tour_moods_3', name: '세 가지 마음으로 걷는 길', desc: '서로 다른 기분의 소풍 엽서 3장 기록하기', goal: 3, registryKey: 'neighborhood_tour_moods', progressMode: 'max', reward: 0, category: 'story', location: '골목 소풍 안내소 · 기분 색인', prerequisite: 'story_tour_first', rewardLabel: '골목 기분 안내자 배지', order: 127 },
  { id: 'collect_tour_stops_24', name: '스물네 번 멈춰 본 골목', desc: '소풍 코스 정류장 기록 24칸 채우기', goal: 24, registryKey: 'neighborhood_tour_stops', progressMode: 'max', reward: 0, category: 'collection', location: '골목 소풍 안내소 · 열두 코스', prerequisite: 'story_tour_first', rewardLabel: '생활 산책 기록가 배지', order: 96 },
  { id: 'collect_tour_postcards_6', name: '엽서함의 여섯 장면', desc: '골목 소풍 완주 엽서 6장 기록하기', goal: 6, registryKey: 'neighborhood_tour_postcards', progressMode: 'max', reward: 0, category: 'collection', location: '골목 소풍 안내소 · 완주 엽서함', prerequisite: 'story_tour_moods_3', rewardLabel: '골목 엽서 큐레이터 배지', order: 97 },
  { id: 'collect_tour_moods_6', name: '여섯 마음의 색인', desc: '여섯 기분의 소풍 엽서를 한 장 이상 기록하기', goal: 6, registryKey: 'neighborhood_tour_moods', progressMode: 'max', reward: 0, category: 'collection', location: '골목 소풍 안내소 · 기분 색인', prerequisite: 'collect_tour_postcards_6', rewardLabel: '마을 취향 나침반 배지', order: 98 },
  { id: 'master_tour_postcards_12', name: '열두 장으로 읽는 마을', desc: '골목 소풍 완주 엽서 12장을 모두 기록하기', goal: 12, registryKey: 'neighborhood_tour_postcards', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 소풍 안내소 · 완주 엽서함', prerequisite: 'collect_tour_moods_6', rewardLabel: '골목 소풍 편집장 휘장', order: 121 },
];

/** 여덟 생활 분야의 깊은 기록을 24개 기념품과 여섯 점 대표 진열로 보존한다. */
export const NEIGHBORHOOD_MUSEUM_QUESTS: QuestDef[] = [
  { id: 'story_museum_first', name: '생활이 기념품이 되는 날', desc: '골목 작은 박물관의 첫 기념품 수령하기', goal: 1, registryKey: 'neighborhood_museum_exhibits', progressMode: 'max', reward: 0, category: 'story', location: '중앙 광장 남쪽 · 골목 작은 박물관', prerequisite: 'intro_journal', rewardLabel: '첫 생활 기증 도장', order: 128 },
  { id: 'story_museum_featured_3', name: '나를 설명하는 세 물건', desc: '수령한 기념품 3점을 대표 진열에 올리기', goal: 3, registryKey: 'neighborhood_museum_featured', progressMode: 'max', reward: 0, category: 'story', location: '골목 작은 박물관 · 대표 진열', prerequisite: 'story_museum_first', rewardLabel: '첫 개인 전시 기획자 배지', order: 129 },
  { id: 'collect_museum_clues_36', name: '서른여섯 생활의 단서', desc: '박물관 기념품 단서 36개 기록하기', goal: 36, registryKey: 'neighborhood_museum_clues', progressMode: 'max', reward: 0, category: 'collection', location: '골목 작은 박물관 · 여덟 전시관', prerequisite: 'story_museum_first', rewardLabel: '생활 유물 조사자 배지', order: 99 },
  { id: 'collect_museum_exhibits_8', name: '여덟 갈래 첫 진열', desc: '박물관 기념품 8점 수령하기', goal: 8, registryKey: 'neighborhood_museum_exhibits', progressMode: 'max', reward: 0, category: 'collection', location: '골목 작은 박물관 · 기념품 수첩', prerequisite: 'story_museum_first', rewardLabel: '골목 소장품 큐레이터 배지', order: 100 },
  { id: 'collect_museum_wings_4', name: '네 전시관의 마지막 조명', desc: '생활 전시관 4곳의 기념품 3단계 모두 수령하기', goal: 4, registryKey: 'neighborhood_museum_wings', progressMode: 'max', reward: 0, category: 'collection', location: '골목 작은 박물관 · 전시관 색인', prerequisite: 'collect_museum_exhibits_8', rewardLabel: '생활 박물관 부관장 배지', order: 101 },
  { id: 'collect_museum_featured_6', name: '여섯 점의 자기소개', desc: '대표 진열 6칸을 수령한 기념품으로 채우기', goal: 6, registryKey: 'neighborhood_museum_featured', progressMode: 'max', reward: 0, category: 'collection', location: '골목 작은 박물관 · 대표 진열', prerequisite: 'story_museum_featured_3', rewardLabel: '개인 소장전 큐레이터 배지', order: 102 },
  { id: 'master_museum_exhibits_24', name: '스물네 점으로 읽는 생활', desc: '여덟 전시관의 기념품 24점을 모두 수령하기', goal: 24, registryKey: 'neighborhood_museum_exhibits', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 작은 박물관 · 전권 소장 기록', prerequisite: 'collect_museum_wings_4', rewardLabel: '골목 생활 박물관장 휘장', order: 122 },
];

/** 8권×3장의 연속 의뢰를 마을 성장·배지·수집 목표로 연결한다. */
export const VILLAGE_REQUEST_STORY_QUESTS: QuestDef[] = [
  { id: 'story_request_letter_first', name: '편지로 이어진 첫 부탁', desc: '골목 연속 의뢰의 첫 장 영구 기록하기', goal: 1, registryKey: 'village_request_story_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 의뢰소 · 연속 이야기', prerequisite: 'story_request_first', rewardLabel: '첫 연속 의뢰 도장', order: 245 },
  { id: 'story_request_letter_routes_4', name: '네 갈래로 이어진 편지', desc: '서로 다른 연속 의뢰 이야기 4권 완결하기', goal: 4, registryKey: 'village_request_story_routes', progressMode: 'max', reward: 0, category: 'story', location: '골목 의뢰소 · 여덟 이야기 서랍', prerequisite: 'story_request_letter_first', rewardLabel: '골목 편지 배달부 배지', order: 246 },
  { id: 'collect_request_story_8', name: '여덟 장의 첫 문장', desc: '연속 의뢰 이야기 장 8개 기록하기', goal: 8, registryKey: 'village_request_story_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 연속 이야기', prerequisite: 'story_request_letter_first', rewardLabel: '연속 의뢰 독자 배지', order: 103 },
  { id: 'collect_request_story_16', name: '열여섯 장의 골목 사정', desc: '연속 의뢰 이야기 장 16개 기록하기', goal: 16, registryKey: 'village_request_story_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 연속 이야기', prerequisite: 'collect_request_story_8', rewardLabel: '골목 사정 기록가 배지', order: 104 },
  { id: 'collect_request_story_routes_8', name: '여덟 권의 답장', desc: '연속 의뢰 이야기 8권을 모두 완결하기', goal: 8, registryKey: 'village_request_story_routes', progressMode: 'max', reward: 0, category: 'collection', location: '골목 의뢰소 · 완결 편지함', prerequisite: 'story_request_letter_routes_4', rewardLabel: '마을 편지 보관자 배지', order: 105 },
  { id: 'master_request_story_24', name: '스물네 장의 생활 연대기', desc: '연속 의뢰 이야기 24장을 모두 영구 기록하기', goal: 24, registryKey: 'village_request_story_chapters', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 의뢰소 · 여덟 권 전집', prerequisite: 'collect_request_story_16', rewardLabel: '골목 연속 의뢰 편집장 휘장', order: 123 },
];

/** 각 연속 의뢰 완결을 세 가지 실제 꾸미기 보상 배지로 연결한다. */
export const REQUEST_STORY_REWARD_QUESTS: QuestDef[] = REQUEST_STORY_REWARDS.map((reward, index) => ({
  id: requestStoryRewardQuestId(reward.storyId),
  name: `${reward.title} · 완결`,
  desc: `연속 의뢰 「${VILLAGE_REQUEST_STORY_BY_ID.get(reward.storyId)?.title ?? reward.title}」 완결하기`,
  goal: 1,
  registryKey: requestStoryMetricKey(reward.storyId),
  progressMode: 'max',
  reward: 0,
  category: 'story',
  location: '골목 의뢰소 · 연속 이야기 완결함',
  prerequisite: 'story_request_letter_first',
  rewardLabel: `${reward.title} 명찰`,
  order: 247 + index,
}));

/** 코디·펫·집을 한 작품처럼 모으고 전시하는 통합 취향 세트 목표. */
export const TASTE_SET_QUESTS: QuestDef[] = [
  { id: 'story_taste_set_first', name: '처음 완성한 세 가지 취향', desc: '코디·펫·집 구성품이 담긴 취향 세트 1개 해금하기', goal: 1, registryKey: 'taste_sets_unlocked', progressMode: 'max', reward: 0, category: 'story', location: '가이드북 · 취향 세트', prerequisite: 'intro_journal', rewardLabel: '첫 취향 세트 도장', order: 255 },
  { id: 'collect_taste_sets_7', name: '일곱 벌의 다른 생활', desc: '통합 취향 세트 7개 영구 소장하기', goal: 7, registryKey: 'taste_sets_unlocked', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 취향 세트', prerequisite: 'story_taste_set_first', rewardLabel: '크로스 세트 수집가 배지', order: 106 },
  { id: 'collect_taste_sets_14', name: '마흔두 조각의 자기소개', desc: '취향 세트 14개·구성품 42개 모두 영구 소장하기', goal: 14, registryKey: 'taste_sets_unlocked', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 취향 세트 전집', prerequisite: 'collect_taste_sets_7', rewardLabel: '통합 취향 아카이비스트 배지', order: 107 },
  { id: 'collect_taste_sets_22', name: '예순여섯 조각의 마을 연대기', desc: '레벨·연속 의뢰·메인 여정 취향 세트 22개와 구성품 66개 영구 소장하기', goal: 22, registryKey: 'taste_sets_unlocked', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 취향 세트 본편', prerequisite: 'collect_taste_sets_14', rewardLabel: '메인 취향 전집 큐레이터 휘장', order: 108 },
  { id: 'collect_taste_sets_28', name: '여든네 조각의 첫 생활 전집', desc: '멘토 완주 세트를 포함한 취향 세트 28개·구성품 84개 모두 영구 소장하기', goal: 28, registryKey: 'taste_sets_unlocked', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 취향 세트 완전판', prerequisite: 'collect_taste_sets_22', rewardLabel: '첫 생활 통합 취향 디렉터 휘장', order: 109 },
  { id: 'master_taste_set_gallery_3', name: '세 장면으로 말하는 나', desc: '해금한 취향 세트 3개를 대표 전시에 올리기', goal: 3, registryKey: 'taste_sets_featured', progressMode: 'max', reward: 0, category: 'mastery', location: '가이드북 · 취향 세트 · 대표 전시', prerequisite: 'story_taste_set_first', rewardLabel: '취향 전시 디렉터 휘장', order: 124 },
];

/** 기존 생활 기록으로 열리는 30개 주민 약속과 10명 인연 완결 목표. */
export const RESIDENT_RENDEZVOUS_QUESTS: QuestDef[] = [
  { id: 'story_rendezvous_first', name: '함께 보낸 첫 약속', desc: '주민 약속 장면을 처음 기록하기', goal: 1, registryKey: 'resident_rendezvous_scenes', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 주민 약속', prerequisite: 'intro_greet', rewardLabel: '첫 약속 표식', order: 256 },
  { id: 'collect_rendezvous_10', name: '열 장의 골목 약속', desc: '주민 약속 장면 10개 기록하기', goal: 10, registryKey: 'resident_rendezvous_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 주민 약속', prerequisite: 'story_rendezvous_first', rewardLabel: '골목 약속 수집가 배지', order: 108 },
  { id: 'collect_rendezvous_20', name: '스무 번 함께 본 풍경', desc: '주민 약속 장면 20개 기록하기', goal: 20, registryKey: 'resident_rendezvous_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 주민 약속', prerequisite: 'collect_rendezvous_10', rewardLabel: '인연 장면 큐레이터 배지', order: 109 },
  { id: 'collect_rendezvous_30', name: '서른 장의 주민 약속 앨범', desc: '10명 주민의 약속 장면 30개 모두 기록하기', goal: 30, registryKey: 'resident_rendezvous_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 주민 약속 전집', prerequisite: 'collect_rendezvous_20', rewardLabel: '골목 인연 아카이비스트 배지', order: 111 },
  { id: 'master_rendezvous_five', name: '다섯 사람의 세 번째 약속', desc: '주민 5명의 약속 앨범을 각각 3장 완성하기', goal: 5, registryKey: 'resident_rendezvous_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 주민 약속', prerequisite: 'collect_rendezvous_10', rewardLabel: '다섯 인연의 증표', order: 142 },
  { id: 'master_rendezvous_ten', name: '골목의 모든 이름을 기억하는 사람', desc: '10명 주민의 약속 앨범을 모두 완성하기', goal: 10, registryKey: 'resident_rendezvous_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 주민 약속 전집', prerequisite: 'collect_rendezvous_30', rewardLabel: '홍대 인연지기 휘장', order: 144 },
];

/** 매일의 인사로 도착하고 세 가지 말투로 답하는 주민 편지 30통. */
export const RESIDENT_LETTER_QUESTS: QuestDef[] = [
  { id: 'story_resident_letter_first', name: '골목 우편함의 첫 답장', desc: '주민에게 도착한 첫 편지에 내 말투로 답장하기', goal: 1, registryKey: 'resident_letters', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 골목 우편', prerequisite: 'intro_greet', rewardLabel: '첫 답장 봉인', order: 262 },
  { id: 'collect_resident_correspondents_5', name: '다섯 이름으로 온 안부', desc: '서로 다른 주민 5명과 편지를 주고받기', goal: 5, registryKey: 'resident_letter_correspondents', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 골목 우편', prerequisite: 'story_resident_letter_first', rewardLabel: '골목 펜팔 수집가 배지', order: 123 },
  { id: 'collect_resident_letters_15', name: '열다섯 통의 생활 문장', desc: '주민 편지 15통에 답장해 영구 보관하기', goal: 15, registryKey: 'resident_letters', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 답장 보관함', prerequisite: 'collect_resident_correspondents_5', rewardLabel: '생활 편지 큐레이터 배지', order: 124 },
  { id: 'collect_resident_letters_30', name: '서른 통으로 엮은 골목 사람들', desc: '10명 주민의 편지 30통 모두 답장하기', goal: 30, registryKey: 'resident_letters', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 골목 우편 전집', prerequisite: 'collect_resident_letters_15', rewardLabel: '홍대 서신 아카이비스트 배지', order: 125 },
  { id: 'master_resident_reply_tones', name: '세 가지로 말하는 마음', desc: '다정하게·장난스럽게·찬찬하게 답장 말투 3종 모두 사용하기', goal: 3, registryKey: 'resident_letter_tones', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 답장 봉인', prerequisite: 'story_resident_letter_first', rewardLabel: '답장 문체 편집자 휘장', order: 153 },
  { id: 'master_resident_letters_ten', name: '모든 이름에 돌아간 답장', desc: '10명 주민의 세 통 편지를 각각 모두 완결하기', goal: 10, registryKey: 'resident_letter_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 골목 우편 전집', prerequisite: 'collect_resident_letters_30', rewardLabel: '골목의 오래된 펜팔 휘장', order: 154 },
];

/** 최애·차애·마음친구를 고르고 관계 단계마다 영구 응원 리본을 모으는 팬북 목표. */
export const RESIDENT_FANBOOK_QUESTS: QuestDef[] = [
  { id: 'story_resident_fan_first', name: '마음이 먼저 앉은 자리', desc: '만난 주민을 처음 최애 응원석에 담기', goal: 1, registryKey: 'resident_fan_favorites', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 최애 팬북', prerequisite: 'intro_greet', rewardLabel: '첫 응원봉 도장', order: 263 },
  { id: 'collect_resident_favorites_3', name: '세 자리의 다른 응원빛', desc: '최애·차애·마음친구 응원석 3자리 채우기', goal: 3, registryKey: 'resident_fan_favorites', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 최애 팬북', prerequisite: 'story_resident_fan_first', rewardLabel: '골목 삼색 응원단 배지', order: 126 },
  { id: 'collect_resident_fan_ribbons_5', name: '다섯 번 묶은 안부', desc: '주민 관계에서 응원 리본 5개 모으기', goal: 5, registryKey: 'resident_fan_ribbons', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 응원 리본', prerequisite: 'story_resident_fan_first', rewardLabel: '첫 팬북 한 장 배지', order: 127 },
  { id: 'collect_resident_fan_ribbons_20', name: '스무 매듭의 골목 팬북', desc: '열 주민의 관계에서 응원 리본 20개 모으기', goal: 20, registryKey: 'resident_fan_ribbons', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 응원 리본 전시', prerequisite: 'collect_resident_fan_ribbons_5', rewardLabel: '생활 응원 리본 수집가 배지', order: 128 },
  { id: 'collect_resident_fan_everyone', name: '모든 이름에 건 첫 리본', desc: '이름 있는 주민 10명에게 응원 리본을 하나 이상 받기', goal: 10, registryKey: 'resident_fan_residents', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 열 사람 팬북', prerequisite: 'collect_resident_fan_ribbons_20', rewardLabel: '열 이름 응원 지도 배지', order: 129 },
  { id: 'master_resident_fan_five', name: '다섯 권의 평생 응원 페이지', desc: '주민 5명의 응원 리본 5단계를 각각 완성하기', goal: 5, registryKey: 'resident_fan_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 최애 팬북 전권', prerequisite: 'collect_resident_fan_ribbons_20', rewardLabel: '다섯 마음 팬북 편집장 휘장', order: 155 },
  { id: 'master_resident_fan_ten', name: '골목 모두의 오래된 팬', desc: '열 주민의 평생 응원 리본 50개를 모두 완성하기', goal: 10, registryKey: 'resident_fan_completed', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 응원 리본 전집', prerequisite: 'collect_resident_fan_everyone', rewardLabel: '홍대마을 영원한 응원단장 휘장', order: 156 },
];

/** 주민의 생활 단서를 읽어 10개 방·40개 물건의 제자리를 찾아 주는 실패 없는 정리 의뢰. */
export const RESIDENT_ROOM_CARE_QUESTS: QuestDef[] = [
  { id: 'story_room_care_item_first', name: '제자리를 찾은 첫 물건', desc: '이웃의 작은 방에서 생활 단서를 읽고 물건 하나를 제자리에 놓기', goal: 1, registryKey: 'resident_room_care_items', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 작은 방 정리', prerequisite: 'intro_greet', rewardLabel: '첫 정리표 도장', order: 264 },
  { id: 'story_room_care_first', name: '다시 숨 쉬는 작은 방', desc: '한 주민의 물건 네 점을 모두 정리해 방의 다음 장면 열기', goal: 1, registryKey: 'resident_room_care_rooms', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 작은 방 정리', prerequisite: 'story_room_care_item_first', rewardLabel: '첫 방 돌봄 리본', order: 265 },
  { id: 'story_room_care_featured', name: '간직하고 싶은 전후 한 장', desc: '완성한 작은 방 하나를 대표 전후 장면으로 간직하기', goal: 1, registryKey: 'resident_room_care_featured', progressMode: 'max', reward: 0, category: 'story', location: '주민 관계 수첩 · 작은 방 정리', prerequisite: 'story_room_care_first', rewardLabel: '생활 장면 금박표', order: 266 },
  { id: 'collect_room_care_featured_3', name: '세 사람의 생활을 놓은 선반', desc: '완성한 주민 기념품 3점을 나만의 대표 진열에 함께 올리기', goal: 3, registryKey: 'resident_room_care_featured', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 작은 방 정리 · 기념품 보관함', prerequisite: 'story_room_care_featured', rewardLabel: '세 장면 큐레이터 배지', order: 130 },
  { id: 'collect_room_care_items_20', name: '스무 물건의 생활 문법', desc: '서로 다른 이웃의 물건 20점을 단서에 맞춰 정리하기', goal: 20, registryKey: 'resident_room_care_items', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 작은 방 정리', prerequisite: 'story_room_care_first', rewardLabel: '생활 단서 수집가 배지', order: 130 },
  { id: 'collect_room_care_rooms_5', name: '다섯 방에 돌아온 저녁', desc: '주민 5명의 작은 방 정리 의뢰를 완성하기', goal: 5, registryKey: 'resident_room_care_rooms', progressMode: 'max', reward: 0, category: 'collection', location: '주민 관계 수첩 · 작은 방 정리 앨범', prerequisite: 'collect_room_care_items_20', rewardLabel: '이웃 방 돌봄가 배지', order: 131 },
  { id: 'master_room_care_rooms_10', name: '열 사람의 생활을 기억하는 손', desc: '주민 10명의 작은 방과 물건 40점을 모두 정리하기', goal: 10, registryKey: 'resident_room_care_rooms', progressMode: 'max', reward: 0, category: 'mastery', location: '주민 관계 수첩 · 작은 방 정리 전집', prerequisite: 'collect_room_care_rooms_5', rewardLabel: '골목 생활 장면 보존가 휘장', order: 157 },
];

/** 네 역할·여덟 부적·세 세팅을 자유롭게 조합하는 비강제형 전투 빌드 목표. */
export const ADVENTURE_ROLE_QUESTS: QuestDef[] = [
  { id: 'story_adventure_role_first', name: '다른 방식으로 걷는 첫 원정', desc: '기본 수호자와 다른 역할을 하나 선택해 보기', goal: 2, registryKey: 'adventure_roles_tried', progressMode: 'max', reward: 0, category: 'story', location: '골목 원정 키트 · 역할 수첩', prerequisite: 'intro_hunt', rewardLabel: '첫 역할 전환 도장', order: 264 },
  { id: 'collect_adventure_roles_4', name: '네 방향의 같은 외곽숲', desc: '수호자·길잡이·돌봄가·기록가 역할 모두 사용해 보기', goal: 4, registryKey: 'adventure_roles_tried', progressMode: 'max', reward: 0, category: 'collection', location: '골목 원정 키트 · 네 역할', prerequisite: 'story_adventure_role_first', rewardLabel: '다역할 원정가 배지', order: 130 },
  { id: 'story_adventure_charms_2', name: '주머니에 넣은 두 작은 용기', desc: '해금된 원정 부적 두 개를 함께 장착하기', goal: 2, registryKey: 'adventure_charms_equipped', progressMode: 'max', reward: 0, category: 'story', location: '골목 원정 키트 · 원정 부적', prerequisite: 'story_adventure_role_first', rewardLabel: '첫 부적 조합 도장', order: 265 },
  { id: 'story_adventure_kit_first', name: '오늘의 전투 취향을 접어 둔 칸', desc: '현재 역할과 부적 조합을 원정 키트에 처음 저장하기', goal: 1, registryKey: 'adventure_kits_saved', progressMode: 'max', reward: 0, category: 'story', location: '골목 원정 키트 · 세팅 보관함', prerequisite: 'story_adventure_charms_2', rewardLabel: '첫 세팅 카드 도장', order: 266 },
  { id: 'collect_adventure_kits_3', name: '세 가지 마음가짐의 원정 가방', desc: '서로 바꿔 쓸 원정 키트 세 칸 모두 저장하기', goal: 3, registryKey: 'adventure_kits_saved', progressMode: 'max', reward: 0, category: 'collection', location: '골목 원정 키트 · 세 세팅', prerequisite: 'story_adventure_kit_first', rewardLabel: '원정 세팅 큐레이터 배지', order: 131 },
  { id: 'master_adventure_charms_8', name: '여덟 부적을 읽는 외곽 장인', desc: '전투 레벨 10에 도달해 원정 부적 8개 모두 해금하기', goal: 8, registryKey: 'adventure_charms_unlocked', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 원정 키트 · 부적 전권', prerequisite: 'collect_adventure_roles_4', rewardLabel: '골목 원정 빌드 디렉터 휘장', order: 157 },
];

/** 외곽숲 전투를 플레이어가 직접 시작하고 즉시 멈출 수 있음을 가르치는 안전 장치 목표. */
export const ADVENTURE_COMFORT_QUESTS: QuestDef[] = [
  { id: 'story_adventure_mode_start', name: '내가 고른 첫 원정', desc: '외곽숲 상단 HUD에서 원정 모드를 직접 시작하기', goal: 1, registryKey: 'adventure_mode_started', progressMode: 'max', reward: 0, category: 'story', location: '동쪽 외곽숲 · 모험 보호 HUD', prerequisite: 'intro_journal', rewardLabel: '자기 선택 원정 도장', order: 265 },
  { id: 'story_adventure_mode_rest', name: '용기를 접어 두는 방법', desc: '원정 뒤 관찰 모드로 돌아와 전투를 안전하게 멈추기', goal: 1, registryKey: 'adventure_mode_restored', progressMode: 'max', reward: 0, category: 'story', location: '동쪽 외곽숲 · 모험 보호 HUD', prerequisite: 'story_adventure_mode_start', rewardLabel: '안심 귀환 리본', order: 266 },
];

/** 임의 가격·흥정 없이 이웃의 가구가 다른 집 장면으로 이어지는 안전한 사회 경제 목표. */
export const NEIGHBORHOOD_MARKET_QUESTS: QuestDef[] = [
  { id: 'story_market_visit', name: '천막 아래 첫 구경', desc: '골목 나눔장터를 처음 둘러보기', goal: 1, registryKey: 'market_visits', progressMode: 'max', reward: 0, category: 'story', location: '중앙 광장 남쪽 · 골목 나눔장터', prerequisite: 'intro_shop', rewardLabel: '첫 장터 방문 도장', order: 267 },
  { id: 'story_market_favorite', name: '마음에 둔 첫 한 점', desc: '이웃 선반의 물건을 처음 찜 수첩에 담기', goal: 1, registryKey: 'market_favorites', progressMode: 'max', reward: 0, category: 'story', location: '골목 나눔장터 · 이웃 선반', prerequisite: 'story_market_visit', rewardLabel: '첫 찜표 금박', order: 268 },
  { id: 'story_market_listing', name: '새 장면을 기다리는 물건', desc: '쓰지 않는 가구 한 점을 서버 보관함에 처음 맡기기', goal: 1, registryKey: 'market_listings_created', progressMode: 'max', reward: 0, category: 'story', location: '골목 나눔장터 · 내 한 점', prerequisite: 'story_market_visit', rewardLabel: '첫 나눔 가격표 도장', order: 269 },
  { id: 'story_market_purchase', name: '이웃의 취향을 들인 날', desc: '이웃 선반에서 첫 한 점을 안전하게 구매하기', goal: 1, registryKey: 'market_purchases', progressMode: 'max', reward: 0, category: 'story', location: '골목 나눔장터 · 이웃 선반', prerequisite: 'story_market_visit', rewardLabel: '첫 이웃 물건 영수증', order: 270 },
  { id: 'story_market_sale', name: '다른 방에 켜진 불', desc: '내가 맡긴 한 점이 처음 다른 이웃에게 이어지기', goal: 1, registryKey: 'market_sales', progressMode: 'max', reward: 0, category: 'story', location: '골목 나눔장터 · 장터 수첩', prerequisite: 'story_market_listing', rewardLabel: '첫 물건 순환 배지', order: 271 },
  { id: 'collect_market_categories_6', name: '여섯 선반의 생활 언어', desc: '가구·가전·식물·소품·러그·벽장식 교환 기록 모두 남기기', goal: 6, registryKey: 'market_categories', progressMode: 'max', reward: 0, category: 'collection', location: '골목 나눔장터 · 교환 분류 도감', prerequisite: 'story_market_purchase', rewardLabel: '여섯 선반 감별사 배지', order: 132 },
  { id: 'collect_market_unique_10', name: '열 물건이 지나간 자리', desc: '서로 다른 장터 물건 10종을 사고팔아 기록하기', goal: 10, registryKey: 'market_unique_items', progressMode: 'max', reward: 0, category: 'collection', location: '골목 나눔장터 · 물건 도감', prerequisite: 'story_market_purchase', rewardLabel: '이웃 물건 아카이비스트 배지', order: 133 },
  { id: 'master_market_exchanges_30', name: '서른 번 이어진 생활의 다음 장', desc: '만료나 연속 조건 없이 장터 교환 30번 기록하기', goal: 30, registryKey: 'market_exchanges', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 나눔장터 · 영구 교환 수첩', prerequisite: 'collect_market_unique_10', rewardLabel: '홍대마을 순환 살림가 휘장', order: 160 },
];

/** 코디·수집·생활 성장을 안전한 공개 명함으로 꾸미는 사회적 커스터마이징 목표. */
export const VILLAGE_PROFILE_QUESTS: QuestDef[] = [
  { id: 'story_village_profile_first', name: '한 장으로 건네는 자기소개', desc: '마을 명함의 한마디 또는 프레임을 처음 바꾸기', goal: 1, registryKey: 'village_profile_customized', progressMode: 'max', reward: 0, category: 'story', location: '접속자 목록 · 나 · 마을 명함', prerequisite: 'intro_journal', rewardLabel: '첫 마을 명함 도장', order: 257 },
  { id: 'story_profile_specialty_first', name: '좋아하는 일을 명함에 건 날', desc: '대표 생활 전문성 카드를 마을 명함에 처음 공개하기', goal: 1, registryKey: 'village_profile_specialties', progressMode: 'max', reward: 0, category: 'story', location: '마을 명함 · 생활 전문성', prerequisite: 'story_life_specialty_first', rewardLabel: '첫 생활 소개 도장', order: 258 },
  { id: 'story_profile_photo_first', name: '최애 장면을 건네는 명함', desc: '최애 포토카드를 마을 명함에 처음 공개하기', goal: 1, registryKey: 'village_profile_photo_cards', progressMode: 'max', reward: 0, category: 'story', location: '마을 명함 · 최애 포토카드', prerequisite: 'story_photo_card_first', rewardLabel: '첫 최애 장면 공유 도장', order: 259 },
  { id: 'collect_profile_badges_3', name: '세 개의 대표 장면', desc: '마을 명함에 대표 배지 3개 전시하기', goal: 3, registryKey: 'village_profile_badges', progressMode: 'max', reward: 0, category: 'collection', location: '마을 명함 · 대표 배지', prerequisite: 'story_village_profile_first', rewardLabel: '자기소개 큐레이터 배지', order: 112 },
  { id: 'collect_profile_frames_3', name: '세 가지 생활의 테두리', desc: '생활 기록으로 마을 명함 프레임 3종 해금하기', goal: 3, registryKey: 'village_profile_frames', progressMode: 'max', reward: 0, category: 'collection', location: '마을 명함 · 생활 프레임', prerequisite: 'story_village_profile_first', rewardLabel: '명함 프레임 수집가 배지', order: 113 },
  { id: 'collect_profile_showcase_6', name: '여섯 칸의 최애 자기소개', desc: '전문성 3장과 포토카드 3장으로 공개 쇼케이스 6칸 채우기', goal: 6, registryKey: 'village_profile_showcase_slots', progressMode: 'max', reward: 0, category: 'collection', location: '마을 명함 · 최애 생활 덱', prerequisite: 'story_profile_specialty_first', rewardLabel: '최애 생활 덱 큐레이터 배지', order: 114 },
  { id: 'master_profile_frames_6', name: '여섯 생활을 두른 명함', desc: '마을 명함의 생활 프레임 6종 모두 해금하기', goal: 6, registryKey: 'village_profile_frames', progressMode: 'max', reward: 0, category: 'mastery', location: '마을 명함 · 프레임 전집', prerequisite: 'collect_profile_frames_3', rewardLabel: '생활 정체성 디렉터 휘장', order: 146 },
  { id: 'master_profile_showcase_complete', name: '열두 칸으로 완성한 픽셀 자서전', desc: '대표 배지·코디·전문성·포토카드를 각각 3개씩 완성하기', goal: 1, registryKey: 'village_profile_showcase_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '마을 명함 · 전체 자기소개 전시', prerequisite: 'collect_profile_showcase_6', rewardLabel: '홍대 픽셀 프로필 디렉터 휘장', order: 147 },
];

/** 메뉴 이름을 외우지 않아도 원하는 생활과 실제 위치를 다시 찾는 친절한 탐색 목표. */
export const VILLAGE_SEARCH_QUESTS: QuestDef[] = [
  { id: 'story_village_search_first', name: '모르는 것을 묻는 방법', desc: '하단 찾기·F 또는 중앙광장 안내함으로 마을 전체 찾기 처음 열기', goal: 1, registryKey: 'village_search_open', progressMode: 'max', reward: 0, category: 'story', location: '중앙광장 골목 찾기 안내함 · 하단 찾기 · F', prerequisite: 'intro_journal', rewardLabel: '새 이웃 길찾기 표식', order: 258 },
  { id: 'story_village_search_route', name: '한 단어에서 이어진 발자국', desc: '마을 찾기 결과에서 첫 실제 길 안내 시작하기', goal: 1, registryKey: 'village_search_routes', progressMode: 'max', reward: 0, category: 'story', location: '마을 전체 찾기 · 장소·주민·권역·퀘스트', prerequisite: 'story_village_search_first', rewardLabel: '골목 검색가 도장', order: 259 },
];

/** 첫날부터 열린 여섯 플레이 성향 중 마음 가는 방향을 골라 얻는 영구 나침반 배지. */
export const STARTER_COMPASS_QUESTS: QuestDef[] = [
  { id: 'story_starter_compass_first', name: '처음 가리킨 방향', desc: '새 이웃 취향 나침반에서 첫 성향 완성하기', goal: 1, registryKey: 'starter_routes', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 추천 · 취향 나침반', prerequisite: 'intro_journal', rewardLabel: '첫 취향 방향 배지', order: 258 },
  { id: 'story_starter_keepsake_first', name: '기다리고 있던 첫 환영 소포', desc: '완성한 취향 방향의 주민 편지와 기념품 처음 보존하기', goal: 1, registryKey: 'starter_keepsakes', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 추천 · 여섯 멘토의 환영 소포', prerequisite: 'story_starter_compass_first', rewardLabel: '첫 환영 우편 도장', order: 259 },
  { id: 'story_starter_keepsake_featured', name: '나의 첫 생활 표식', desc: '받은 환영 기념품 하나를 대표 첫 생활 표식으로 고르기', goal: 1, registryKey: 'starter_featured_keepsake', progressMode: 'max', reward: 0, category: 'story', location: '새 이웃 환영 소포 · 대표 기념품', prerequisite: 'story_starter_keepsake_first', rewardLabel: '첫 생활 표식 배지', order: 260 },
  { id: 'collect_starter_compass_3', name: '세 갈래로 시작한 생활', desc: '서로 다른 첫날 플레이 성향 3개 완성하기', goal: 3, registryKey: 'starter_routes', progressMode: 'max', reward: 0, category: 'collection', location: '모험 일지 · 새 이웃 취향 나침반', prerequisite: 'story_starter_compass_first', rewardLabel: '다취향 새 이웃 배지', order: 114 },
  { id: 'collect_starter_keepsakes_3', name: '세 주민이 보낸 환영 편지', desc: '서로 다른 취향 방향의 환영 소포 3개 보존하기', goal: 3, registryKey: 'starter_keepsakes', progressMode: 'max', reward: 0, category: 'collection', location: '새 이웃 환영 소포 수집책', prerequisite: 'story_starter_keepsake_first', rewardLabel: '골목 환영 편지 수집가 배지', order: 115 },
  { id: 'master_starter_compass_6', name: '여섯 방향이 모두 내 생활', desc: '첫날 플레이 성향 6개 모두 완성하기', goal: 6, registryKey: 'starter_routes', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 취향 나침반 전권', prerequisite: 'collect_starter_compass_3', rewardLabel: '홍대 생활 나침반 휘장', order: 148 },
  { id: 'master_starter_keepsakes_6', name: '여섯 사람이 건넨 첫 생활 상자', desc: '여섯 취향 방향의 환영 편지와 기념품 전권 보존하기', goal: 6, registryKey: 'starter_keepsakes', progressMode: 'max', reward: 0, category: 'mastery', location: '여섯 멘토의 환영 소포 전권', prerequisite: 'collect_starter_keepsakes_3', rewardLabel: '홍대마을 환영 우편함 휘장', order: 149 },
];

/** 여섯 첫날 방향을 각각 세 장의 실제 생활 성장 이야기로 잇는 멘토 연대기 목표. */
export const STARTER_MENTOR_QUESTS: QuestDef[] = [
  { id: 'story_starter_mentor_first', name: '환영 다음에 시작된 첫 장', desc: '환영 소포 이후 첫 멘토 성장 장 보존하기', goal: 1, registryKey: 'starter_mentor_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 추천 · 여섯 멘토의 첫 생활 연대기', prerequisite: 'story_starter_keepsake_first', rewardLabel: '첫 멘토 성장 필름', order: 293 },
  { id: 'story_starter_mentor_replay', name: '처음 배운 장면을 다시 펼치기', desc: '보존한 멘토 성장 장면 처음 다시 보기', goal: 1, registryKey: 'starter_mentor_replays', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 장면 다시 보기', prerequisite: 'story_starter_mentor_first', rewardLabel: '첫 생활 복습 도장', order: 294 },
  { id: 'story_starter_mentor_style', name: '노을과 완성한 나의 골목색', desc: '스타일 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_style_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 골목 스타일러', prerequisite: 'story_starter_mentor_first', rewardLabel: '노을의 골목 팔레트 배지', order: 295 },
  { id: 'story_starter_mentor_home', name: '살림과 완성한 돌아올 방', desc: '집 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_home_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 포근한 집주인', prerequisite: 'story_starter_mentor_first', rewardLabel: '살림의 돌아올 방 배지', order: 296 },
  { id: 'story_starter_mentor_companion', name: '동수와 완성한 나란한 걸음', desc: '동행 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_companion_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 다정한 동행인', prerequisite: 'story_starter_mentor_first', rewardLabel: '동수의 나란한 걸음 배지', order: 297 },
  { id: 'story_starter_mentor_neighbor', name: '모퉁이와 완성한 단골 자리', desc: '이웃 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_neighbor_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 골목의 이웃', prerequisite: 'story_starter_mentor_first', rewardLabel: '모퉁이의 단골 자리 배지', order: 298 },
  { id: 'story_starter_mentor_maker', name: '포차 이모와 완성한 손끝 하루', desc: '생활 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_maker_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 손끝 생활가', prerequisite: 'story_starter_mentor_first', rewardLabel: '포차 이모의 손끝 수확 배지', order: 299 },
  { id: 'story_starter_mentor_explorer', name: '박 기장과 완성한 귀환 표식', desc: '탐험 멘토 성장 이야기 세 장 모두 보존하기', goal: 1, registryKey: 'starter_mentor_explorer_complete', progressMode: 'max', reward: 0, category: 'story', location: '첫 생활 연대기 · 반짝임 탐험가', prerequisite: 'story_starter_mentor_first', rewardLabel: '박 기장의 귀환 나침반 배지', order: 300 },
  { id: 'collect_starter_mentor_chapters_6', name: '여섯 장으로 넓어진 첫 생활', desc: '멘토 성장 장 합계 6장 보존하기', goal: 6, registryKey: 'starter_mentor_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '여섯 멘토의 첫 생활 연대기', prerequisite: 'story_starter_mentor_first', rewardLabel: '새 이웃 성장 기록가 배지', order: 170 },
  { id: 'collect_starter_mentor_routes_2', name: '두 방향을 끝까지 걸은 사람', desc: '서로 다른 멘토 성장 루트 두 곳 완주하기', goal: 2, registryKey: 'starter_mentor_routes', progressMode: 'max', reward: 0, category: 'collection', location: '첫 생활 연대기 · 6개 성장 루트', prerequisite: 'story_starter_mentor_first', rewardLabel: '두 갈래 생활 수료 배지', order: 171 },
  { id: 'collect_starter_mentor_featured_3', name: '나를 만든 세 장면', desc: '보존한 멘토 성장 장 3개를 대표 장면으로 전시하기', goal: 3, registryKey: 'starter_mentor_featured', progressMode: 'max', reward: 0, category: 'collection', location: '첫 생활 연대기 · 대표 성장 장면', prerequisite: 'story_starter_mentor_first', rewardLabel: '첫 생활 장면 큐레이터 배지', order: 172 },
  { id: 'master_starter_mentor_chapters_18', name: '열여덟 장의 첫 생활 전권', desc: '여섯 멘토의 성장 장 18개 모두 보존하기', goal: 18, registryKey: 'starter_mentor_chapters', progressMode: 'max', reward: 0, category: 'mastery', location: '첫 생활 연대기 · 18장 전권', prerequisite: 'collect_starter_mentor_chapters_6', rewardLabel: '홍대 첫 생활 연대기 휘장', order: 170 },
  { id: 'master_starter_mentor_routes_6', name: '여섯 멘토가 인정한 생활가', desc: '여섯 멘토 성장 루트를 모두 완주하기', goal: 6, registryKey: 'starter_mentor_routes', progressMode: 'max', reward: 0, category: 'mastery', location: '첫 생활 연대기 · 여섯 루트 수료', prerequisite: 'collect_starter_mentor_routes_2', rewardLabel: '여섯 생활 수료자 휘장', order: 171 },
  { id: 'master_starter_mentor_replays_30', name: '서른 번 돌아본 성장의 시작', desc: '좋아하는 멘토 성장 장면 누적 30번 다시 보기', goal: 30, registryKey: 'starter_mentor_replays', progressMode: 'max', reward: 0, category: 'mastery', location: '첫 생활 연대기 · 장면 다시 보기', prerequisite: 'story_starter_mentor_replay', rewardLabel: '오래된 첫 생활 필름 휘장', order: 172 },
];

/** 30종마다 3단 관찰 도장을 남기는 외곽숲 영구 생태 연구 목표. */
export const MONSTER_RESEARCH_QUESTS: QuestDef[] = [
  { id: 'story_monster_research_first', name: '현장 수첩의 첫 잉크', desc: '외곽 생태 연구 도장 처음 기록하기', goal: 1, registryKey: 'monster_research_stamps', progressMode: 'max', reward: 0, category: 'story', location: '가이드북 · 몬스터 연구 · 6권 현장 수첩', prerequisite: 'intro_hunt', rewardLabel: '첫 생태 관찰 도장', order: 259 },
  { id: 'collect_monster_research_30', name: '서른 칸의 관찰 습관', desc: '30종 생태 연구 도장 중 30개 기록하기', goal: 30, registryKey: 'monster_research_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 외곽 생태 연구', prerequisite: 'collect_monster_5', rewardLabel: '현장 관찰가 배지', order: 116 },
  { id: 'collect_monster_research_pages_3', name: '세 구역의 얼굴을 모두 아는 사람', desc: '티어별 생태 5종을 발견해 연구 수첩 3권 표지 완성하기', goal: 3, registryKey: 'monster_research_pages', progressMode: 'max', reward: 0, category: 'collection', location: '가이드북 · 외곽 생태 연구 · 구역 표지', prerequisite: 'collect_monster_15', rewardLabel: '외곽 생태 편집자 배지', order: 117 },
  { id: 'master_monster_research_90', name: '아흔 도장의 외곽숲 연대기', desc: '30종의 첫 발견·익숙한 관찰·생태 숙련 도장 90개 모두 기록하기', goal: 90, registryKey: 'monster_research_stamps', progressMode: 'max', reward: 0, category: 'mastery', location: '가이드북 · 외곽 생태 연구 전권', prerequisite: 'collect_monster_research_pages_3', rewardLabel: '외곽 생태 연대기 휘장', order: 149 },
];

/** 12칸 픽셀 코디 아카이브와 대표 시그니처 전시 목표. */
export const SIGNATURE_CLOSET_QUESTS: QuestDef[] = [
  { id: 'story_signature_look_first', name: '처음 고른 나의 대표 장면', desc: '저장한 코디를 첫 대표 코디로 전시하기', goal: 1, registryKey: 'closet_featured_slots', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 픽셀 코디 아카이브', prerequisite: 'story_wardrobe', rewardLabel: '첫 시그니처 룩 도장', order: 260 },
  { id: 'collect_closet_archive_6', name: '여섯 날의 다른 표정', desc: '서로 다른 개인 코디 슬롯 6칸 채우기', goal: 6, registryKey: 'closet_saved_slots', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 코디 아카이브', prerequisite: 'story_wardrobe', rewardLabel: '픽셀 옷장 기록가 배지', order: 118 },
  { id: 'collect_signature_looks_3', name: '세 벌로 말하는 나', desc: '대표 코디 전시 3칸 모두 채우기', goal: 3, registryKey: 'closet_featured_slots', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 대표 코디', prerequisite: 'story_signature_look_first', rewardLabel: '시그니처 코디 큐레이터 배지', order: 119 },
  { id: 'collect_closet_identities_4', name: '네 가지 기분의 옷장', desc: '코디 아카이브에 서로 다른 스타일 정체성 4종 기록하기', goal: 4, registryKey: 'closet_style_identities', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 스타일 정체성', prerequisite: 'collect_closet_archive_6', rewardLabel: '다취향 코디 연구가 배지', order: 120 },
  { id: 'master_closet_archive_12', name: '열두 벌의 픽셀 자서전', desc: '개인 코디 아카이브 12칸 모두 채우기', goal: 12, registryKey: 'closet_saved_slots', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 아틀리에 · 12칸 아카이브', prerequisite: 'collect_closet_archive_6', rewardLabel: '홍대 픽셀 스타일 디렉터 휘장', order: 150 },
  { id: 'master_closet_identities_8', name: '여덟 얼굴의 스타일 연대기', desc: '8가지 스타일 정체성을 코디 아카이브에 모두 기록하기', goal: 8, registryKey: 'closet_style_identities', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 아틀리에 · 스타일 정체성 전권', prerequisite: 'collect_closet_identities_4', rewardLabel: '픽셀 패션 정체성 디렉터 휘장', order: 151 },
];

/** 현재 외형을 독립된 OC로 보존하고 역할·상징·대표 카드를 모으는 설정집 목표. */
export const CHARACTER_ZINE_QUESTS: QuestDef[] = [
  { id: 'story_character_zine_first', name: '내가 만든 첫 번째 골목 사람', desc: '현재 모습으로 첫 캐릭터 설정 카드 만들기', goal: 1, registryKey: 'character_zine_saved', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 아틀리에 · 골목 캐릭터 설정집', prerequisite: 'intro_journal', rewardLabel: '첫 OC 창작자 도장', order: 262 },
  { id: 'story_character_zine_featured', name: '명함에 실린 첫 주인공', desc: '설정집 인물 한 명을 대표 OC로 공개하기', goal: 1, registryKey: 'character_zine_featured', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 설정집 · 대표 공개', prerequisite: 'story_character_zine_first', rewardLabel: '골목 주인공 표식', order: 263 },
  { id: 'collect_character_zine_3', name: '세 사람이 사는 한 권', desc: '서로 다른 캐릭터 설정 카드 3장 보관하기', goal: 3, registryKey: 'character_zine_saved', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 아틀리에 · 설정집', prerequisite: 'story_character_zine_first', rewardLabel: 'OC 설정집 편집자 배지', order: 123 },
  { id: 'collect_character_roles_4', name: '네 가지 삶의 가능성', desc: '설정집에 서로 다른 역할 4종 기록하기', goal: 4, registryKey: 'character_zine_roles', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 설정집 · 역할 분류', prerequisite: 'collect_character_zine_3', rewardLabel: '골목 배역 연구가 배지', order: 124 },
  { id: 'collect_character_motifs_6', name: '여섯 상징으로 엮은 관계도', desc: '설정집에 서로 다른 모티프 6종 기록하기', goal: 6, registryKey: 'character_zine_motifs', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 설정집 · 상징 분류', prerequisite: 'collect_character_zine_3', rewardLabel: '캐릭터 모티프 수집가 배지', order: 125 },
  { id: 'master_character_zine_6', name: '여섯 주인공의 골목 앤솔로지', desc: '캐릭터 설정집 여섯 칸 모두 완성하기', goal: 6, registryKey: 'character_zine_saved', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 아틀리에 · 설정집 전권', prerequisite: 'collect_character_roles_4', rewardLabel: '홍대 OC 앤솔로지 편집장 휘장', order: 153 },
  { id: 'story_character_bond_first', name: '두 사람이 한 장면에 선 날', desc: '서로 다른 두 인물의 첫 관계 실타래 엮기', goal: 1, registryKey: 'character_zine_bonds', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 설정집 · 관계 실타래', prerequisite: 'story_character_zine_first', rewardLabel: '첫 관계 작가 도장', order: 264 },
  { id: 'collect_character_bonds_3', name: '세 갈래로 이어진 캐릭터 노트', desc: '서로 다른 인물 쌍의 관계 장면 3개 보관하기', goal: 3, registryKey: 'character_zine_bonds', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 설정집 · 관계 실타래', prerequisite: 'story_character_bond_first', rewardLabel: '관계도 편집자 배지', order: 126 },
  { id: 'collect_character_bond_kinds_4', name: '관계는 한 단어로 끝나지 않아', desc: '서로 다른 관계 유형 4종 기록하기', goal: 4, registryKey: 'character_zine_bond_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '관계 실타래 · 8개 관계 유형', prerequisite: 'collect_character_bonds_3', rewardLabel: '캐릭터 케미 연구가 배지', order: 127 },
  { id: 'collect_character_memory_scenes_8', name: '여덟 장면의 골목 드라마', desc: '관계 실타래에 8개 기억 장면 모두 기록하기', goal: 8, registryKey: 'character_zine_memory_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '관계 실타래 · 기억 장면 도감', prerequisite: 'collect_character_bonds_3', rewardLabel: '골목 장면 각본가 배지', order: 128 },
  { id: 'master_character_bonds_15', name: '여섯 사람 사이의 모든 실', desc: '여섯 인물로 만들 수 있는 관계 15쌍 모두 기록하기', goal: 15, registryKey: 'character_zine_bonds', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 설정집 · 관계도 전권', prerequisite: 'master_character_zine_6', rewardLabel: '홍대 캐릭터 연대기 작가 휘장', order: 154 },
  { id: 'story_character_episode_first', name: '주인공이 골목을 걷기 시작한 날', desc: '실제 생활 기록 두 가지로 첫 캐릭터 에피소드 보존하기', goal: 1, registryKey: 'character_episode_archived', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 설정집 · 에피소드 보드', prerequisite: 'story_character_zine_first', rewardLabel: '첫 OC 에피소드 필름', order: 289 },
  { id: 'story_character_episode_replay', name: '저장한 주인공으로 다시 걷기', desc: 'OC의 외형을 입고 보존 에피소드 처음 다시 걷기', goal: 1, registryKey: 'character_episode_replays', progressMode: 'max', reward: 0, category: 'story', location: '캐릭터 에피소드 보드 · 장면 재생', prerequisite: 'story_character_episode_first', rewardLabel: '캐릭터 롤플레이 도장', order: 290 },
  { id: 'collect_character_episode_kinds_4', name: '네 사건을 건넌 한 권의 주인공들', desc: '서로 다른 캐릭터 에피소드 유형 4종 보존하기', goal: 4, registryKey: 'character_episode_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 에피소드 보드 · 8개 사건', prerequisite: 'story_character_episode_first', rewardLabel: 'OC 장면 수집가 배지', order: 158 },
  { id: 'collect_character_episodes_8', name: '여덟 사건의 골목 앤솔로지', desc: '캐릭터별 에피소드 장면 8장 보존하기', goal: 8, registryKey: 'character_episode_archived', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 에피소드 보드 · 영구 장면', prerequisite: 'story_character_episode_first', rewardLabel: '픽셀 에피소드 편집자 배지', order: 159 },
  { id: 'collect_character_episode_cast_3', name: '세 주인공이 나누어 가진 골목', desc: '서로 다른 OC 3명에게 에피소드 한 장 이상 보존하기', goal: 3, registryKey: 'character_episode_characters', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 에피소드 보드 · 주인공 색인', prerequisite: 'collect_character_zine_3', rewardLabel: '앙상블 캐스트 디렉터 배지', order: 160 },
  { id: 'collect_character_episode_featured_3', name: '나의 최애 에피소드 세 장', desc: '좋아하는 캐릭터 에피소드 3장을 대표 장면으로 간직하기', goal: 3, registryKey: 'character_episode_featured', progressMode: 'max', reward: 0, category: 'collection', location: '캐릭터 에피소드 보드 · 대표 장면', prerequisite: 'story_character_episode_first', rewardLabel: '최애 장면 큐레이터 배지', order: 161 },
  { id: 'master_character_episodes_24', name: '스물네 장면을 연출한 OC 감독', desc: '여섯 OC와 여덟 사건을 조합해 캐릭터 에피소드 24장 보존하기', goal: 24, registryKey: 'character_episode_archived', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 에피소드 보드 · 48장 전집', prerequisite: 'collect_character_episodes_8', rewardLabel: '홍대 픽셀 앤솔로지 감독 휘장', order: 165 },
  { id: 'master_character_episode_replays_20', name: '스무 번 주인공으로 돌아간 사람', desc: '좋아하는 OC 에피소드를 누적 20번 다시 걷기', goal: 20, registryKey: 'character_episode_replays', progressMode: 'max', reward: 0, category: 'mastery', location: '캐릭터 에피소드 보드 · 장면 재생', prerequisite: 'story_character_episode_replay', rewardLabel: '캐릭터 롤플레이 마스터 휘장', order: 166 },
];

/** 동아리 발간을 영구 팬 키트와 아지트 표현으로 확장하는 목표. */
export const HOBBY_CLUB_FAN_QUESTS: QuestDef[] = [
  { id: 'story_club_fan_piece_first', name: '회보가 응원 키트가 된 날', desc: '동아리 첫 장을 발간해 첫 응원 키트 해금하기', goal: 1, registryKey: 'hobby_club_fan_pieces', progressMode: 'max', reward: 0, category: 'story', location: '골목 동아리 · 응원 키트와 아지트', prerequisite: 'story_club_first', rewardLabel: '첫 동아리 응원 핀', order: 291 },
  { id: 'story_club_room_replay', name: '최애 방에 다시 모인 저녁', desc: '해금한 동아리 아지트 장면 처음 다시 보기', goal: 1, registryKey: 'hobby_club_room_replays', progressMode: 'max', reward: 0, category: 'story', location: '골목 동아리 · 나의 최애 아지트', prerequisite: 'story_club_fan_piece_first', rewardLabel: '첫 아지트 추억 도장', order: 292 },
  { id: 'collect_club_fan_pieces_12', name: '열두 점의 골목 응원함', desc: '여섯 동아리 응원 키트 합계 12점 해금하기', goal: 12, registryKey: 'hobby_club_fan_pieces', progressMode: 'max', reward: 0, category: 'collection', location: '골목 동아리 · 응원 키트', prerequisite: 'story_club_fan_piece_first', rewardLabel: '골목 팬 키트 수집가 배지', order: 162 },
  { id: 'collect_club_complete_kits_3', name: '세 취향의 완성 키트', desc: '서로 다른 동아리 세 곳의 응원 키트 5점 완성하기', goal: 3, registryKey: 'hobby_club_complete_kits', progressMode: 'max', reward: 0, category: 'collection', location: '골목 동아리 · 여섯 아지트', prerequisite: 'collect_club_fan_pieces_12', rewardLabel: '세 취향 아지트 큐레이터 배지', order: 163 },
  { id: 'collect_club_featured_3', name: '세 곳으로 소개하는 나', desc: '대표 아지트 전시에 동아리 세 곳 올리기', goal: 3, registryKey: 'hobby_club_featured', progressMode: 'max', reward: 0, category: 'collection', location: '골목 동아리 · 대표 아지트 전시', prerequisite: 'story_club_fan_piece_first', rewardLabel: '최애 아지트 디렉터 배지', order: 164 },
  { id: 'master_club_fan_pieces_30', name: '서른 점의 생활 응원 전권', desc: '여섯 동아리의 응원 키트 30점을 모두 해금하기', goal: 30, registryKey: 'hobby_club_fan_pieces', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 동아리 · 응원 키트 전권', prerequisite: 'collect_club_fan_pieces_12', rewardLabel: '골목 응원 전권 편집장 휘장', order: 167 },
  { id: 'master_club_complete_kits_6', name: '여섯 아지트에 켜진 불', desc: '여섯 동아리의 응원 키트를 모두 완성하기', goal: 6, registryKey: 'hobby_club_complete_kits', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 동아리 · 여섯 아지트', prerequisite: 'collect_club_complete_kits_3', rewardLabel: '전 동아리 아지트 지기 휘장', order: 168 },
  { id: 'master_club_room_replays_20', name: '스무 번 다시 펼친 최애 장면', desc: '좋아하는 동아리 아지트 장면 누적 20번 다시 보기', goal: 20, registryKey: 'hobby_club_room_replays', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 동아리 · 나의 최애 아지트', prerequisite: 'story_club_room_replay', rewardLabel: '오래된 아지트 단골 휘장', order: 169 },
];

/** 기한 없는 8개 축제의 엽서와 생활 단서를 영구 수집하는 목표. */
export const FESTIVAL_ARCHIVE_QUESTS: QuestDef[] = [
  { id: 'story_festival_first', name: '축제가 기록이 되는 날', desc: '골목 축제의 첫 완주 엽서 보존하기', goal: 1, registryKey: 'festival_postcards', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 축제 아카이브', prerequisite: 'intro_journal', rewardLabel: '첫 골목 축제 도장', order: 261 },
  { id: 'collect_festival_postcards_4', name: '네 계절을 닮은 엽서함', desc: '서로 다른 골목 축제 엽서 4장 보존하기', goal: 4, registryKey: 'festival_postcards', progressMode: 'max', reward: 0, category: 'collection', location: '축제 아카이브 · 영구 엽서함', prerequisite: 'story_festival_first', rewardLabel: '골목 축제 엽서가 배지', order: 121 },
  { id: 'collect_festival_postcards_8', name: '여덟 번 다른 광장의 불빛', desc: '8개 골목 축제 엽서 전권 보존하기', goal: 8, registryKey: 'festival_postcards', progressMode: 'max', reward: 0, category: 'collection', location: '축제 아카이브 · 전권 엽서함', prerequisite: 'collect_festival_postcards_4', rewardLabel: '홍대 축제 아카이비스트 배지', order: 122 },
  { id: 'master_festival_clues_24', name: '스물네 장면으로 읽는 마을', desc: '축제 생활 단서 24개 완성하기', goal: 24, registryKey: 'festival_clues', progressMode: 'max', reward: 0, category: 'mastery', location: '축제 아카이브 · 32개 생활 단서', prerequisite: 'collect_festival_postcards_4', rewardLabel: '골목 축제 편집장 휘장', order: 152 },
];

/** 여섯 성격의 몸짓에 플레이어가 직접 뜻을 붙이는, 실패 없는 동행 언어 아카이브. */
export const PET_SIGNAL_QUESTS: QuestDef[] = [
  { id: 'story_pet_signal_first', name: '처음 알아들은 작은 몸짓', desc: '동행의 첫 몸짓에 우리만의 뜻 붙이기', goal: 1, registryKey: 'pet_signals', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 · 가족 프로필 · 마음 번역 수첩', prerequisite: 'intro_pet', rewardLabel: '첫 마음 번역 도장', order: 262 },
  { id: 'collect_pet_signals_8', name: '여덟 번의 다정한 오해', desc: '동행 몸짓 8개 번역해 영구 보존하기', goal: 8, registryKey: 'pet_signals', progressMode: 'max', reward: 0, category: 'collection', location: '펫샵 · 마음 번역 수첩', prerequisite: 'story_pet_signal_first', rewardLabel: '동행 언어 관찰가 배지', order: 123 },
  { id: 'collect_pet_signals_24', name: '스물네 장의 둘만의 사전', desc: '여섯 성격의 몸짓 24개 모두 번역하기', goal: 24, registryKey: 'pet_signals', progressMode: 'max', reward: 0, category: 'collection', location: '마음 번역 수첩 · 여섯 성격 전권', prerequisite: 'collect_pet_signals_8', rewardLabel: '동행 마음 사전 편집자 배지', order: 124 },
  { id: 'collect_pet_signal_personalities_6', name: '여섯 마음의 다른 문법', desc: '여섯 가지 성격에서 몸짓 번역 남기기', goal: 6, registryKey: 'pet_signal_personalities', progressMode: 'max', reward: 0, category: 'collection', location: '가족 프로필 · 성격과 마음 번역 수첩', prerequisite: 'story_pet_signal_first', rewardLabel: '여섯 마음 번역가 배지', order: 125 },
  { id: 'master_pet_signal_responses_3', name: '곁과 놀이와 기다림', desc: '세 가지 돌봄 방식으로 서로 다른 번역 남기기', goal: 3, registryKey: 'pet_signal_responses', progressMode: 'max', reward: 0, category: 'mastery', location: '마음 번역 수첩 · 돌봄 선택', prerequisite: 'story_pet_signal_first', rewardLabel: '다정한 응답가 휘장', order: 153 },
  { id: 'master_pet_signal_chapters_6', name: '여섯 성격의 완성된 마음 장', desc: '성격별 네 몸짓을 여섯 장 모두 완성하기', goal: 6, registryKey: 'pet_signal_chapters', progressMode: 'max', reward: 0, category: 'mastery', location: '마음 번역 수첩 · 성격별 네 장', prerequisite: 'collect_pet_signals_8', rewardLabel: '평생 동행 언어학자 휘장', order: 154 },
];

/** 이미 배운 트릭을 점수 경쟁 없이 데뷔·대표작·앙코르의 영구 무대 추억으로 깊게 만드는 목표. */
export const PET_PERFORMANCE_QUESTS: QuestDef[] = [
  { id: 'story_pet_performance_first', name: '관객 한 명의 첫 소극장', desc: '배운 트릭으로 첫 무대 추억 남기기', goal: 1, registryKey: 'pet_performance_stamps', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 · 둘만의 트릭 소극장', prerequisite: 'story_pet_trick', rewardLabel: '첫 동행 공연표', order: 263 },
  { id: 'story_pet_performance_featured', name: '명함에 걸어 둔 둘만의 장면', desc: '무대 추억 한 장을 대표 공연으로 남기기', goal: 1, registryKey: 'pet_performance_featured', progressMode: 'max', reward: 0, category: 'story', location: '트릭 소극장 · 대표 무대', prerequisite: 'story_pet_performance_first', rewardLabel: '대표 동행 무대 금박', order: 264 },
  { id: 'collect_pet_performance_tricks_5', name: '다섯 개인기의 작은 극단', desc: '다섯 트릭 모두에서 무대 추억 남기기', goal: 5, registryKey: 'pet_performance_tricks', progressMode: 'max', reward: 0, category: 'collection', location: '트릭 소극장 · 다섯 레퍼토리', prerequisite: 'story_pet_performance_first', rewardLabel: '동행 레퍼토리 감독 배지', order: 126 },
  { id: 'collect_pet_performance_stamps_15', name: '데뷔와 대표작과 앙코르', desc: '트릭 소극장 무대 추억 15장 모으기', goal: 15, registryKey: 'pet_performance_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '트릭 소극장 · 15장 공연 수첩', prerequisite: 'collect_pet_performance_tricks_5', rewardLabel: '둘만의 공연 아카이비스트 배지', order: 127 },
  { id: 'collect_pet_performance_partners_3', name: '세 친구가 고른 다른 박수', desc: '서로 다른 동행 펫 3마리와 공연하기', goal: 3, registryKey: 'pet_performance_partners', progressMode: 'max', reward: 0, category: 'collection', location: '트릭 소극장 · 공연 친구 기록', prerequisite: 'story_pet_performance_first', rewardLabel: '작은 극단 돌봄 감독 배지', order: 128 },
  { id: 'master_pet_performance_complete_5', name: '다섯 번 울린 비밀 앙코르', desc: '데뷔·대표작·앙코르를 모두 채운 공연 5개 완성하기', goal: 5, registryKey: 'pet_performance_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '트릭 소극장 · 완성 레퍼토리', prerequisite: 'collect_pet_performance_stamps_15', rewardLabel: '평생 동행 무대감독 휘장', order: 155 },
];

/** 동행의 성격·장식·장면을 스냅샷으로 보존하고 실제 월드 모습에 다시 적용하는 코디 목표. */
export const PET_STYLE_STUDIO_QUESTS: QuestDef[] = [
  { id: 'story_pet_style_first', name: '오늘의 동행을 간직하는 법', desc: '성격·장식·배경·포즈를 골라 첫 동행 코디 카드 저장하기', goal: 1, registryKey: 'pet_style_captures', progressMode: 'max', reward: 0, category: 'story', location: '펫샵 · 가족 프로필 · 동행 코디 카드 아틀리에', prerequisite: 'story_pet_accessory', rewardLabel: '첫 동행 코디 필름', order: 265 },
  { id: 'story_pet_style_apply', name: '카드에서 다시 걸어 나온 친구', desc: '고른 코디를 실제 월드 동행에게 처음 적용하기', goal: 1, registryKey: 'pet_style_applies', progressMode: 'max', reward: 0, category: 'story', location: '동행 코디 카드 아틀리에 · 함께 걷기', prerequisite: 'story_pet_style_first', rewardLabel: '첫 동행 코디 열쇠', order: 266 },
  { id: 'story_pet_style_featured', name: '가장 우리다운 한 장', desc: '저장한 동행 코디를 첫 대표 카드로 전시하기', goal: 1, registryKey: 'pet_style_featured', progressMode: 'max', reward: 0, category: 'story', location: '동행 코디 카드 아틀리에 · 여섯 장 보관함', prerequisite: 'story_pet_style_first', rewardLabel: '대표 동행 코디 금박', order: 267 },
  { id: 'collect_pet_style_backdrops_6', name: '여섯 골목에 선 작은 발', desc: '동행 코디 카드에 여섯 장면 배경 모두 기록하기', goal: 6, registryKey: 'pet_style_backdrops', progressMode: 'max', reward: 0, category: 'collection', location: '동행 코디 카드 아틀리에 · 장면 배경', prerequisite: 'story_pet_style_first', rewardLabel: '동행 장면 로케이션 배지', order: 129 },
  { id: 'collect_pet_style_poses_5', name: '다섯 몸짓의 포토콜', desc: '동행 코디 카드에 다섯 포즈 모두 기록하기', goal: 5, registryKey: 'pet_style_poses', progressMode: 'max', reward: 0, category: 'collection', location: '동행 코디 카드 아틀리에 · 오늘의 포즈', prerequisite: 'story_pet_style_first', rewardLabel: '작은 포토콜 감독 배지', order: 130 },
  { id: 'collect_pet_style_partners_3', name: '세 친구의 서로 다른 명함', desc: '서로 다른 동행 펫 3마리의 코디 카드 남기기', goal: 3, registryKey: 'pet_style_pets', progressMode: 'max', reward: 0, category: 'collection', location: '동행 코디 카드 아틀리에 · 오늘의 동행', prerequisite: 'story_pet_style_first', rewardLabel: '세 동행 스타일리스트 배지', order: 131 },
  { id: 'master_pet_style_designs_24', name: '스물네 장의 함께 걷는 방식', desc: '펫·성격·장식·배경·포즈가 다른 코디 디자인 24종 발견하기', goal: 24, registryKey: 'pet_style_discoveries', progressMode: 'max', reward: 0, category: 'mastery', location: '동행 코디 카드 아틀리에 · 영구 디자인 기록', prerequisite: 'collect_pet_style_backdrops_6', rewardLabel: '홍대 동행 코디 디렉터 휘장', order: 156 },
];

/** 대표 동행 코디를 최소 공개 스냅샷으로 마을 명함에 싣고 이웃의 취향을 발견하는 목표. */
export const PET_STYLE_PROFILE_QUESTS: QuestDef[] = [
  { id: 'story_pet_style_profile_first', name: '명함에 실린 작은 동행', desc: '대표 동행 코디 한 장을 마을 명함에 공개하기', goal: 1, registryKey: 'village_profile_pet_styles', progressMode: 'max', reward: 0, category: 'story', location: '나의 마을 명함 · 대표 동행 코디', prerequisite: 'story_pet_style_featured', rewardLabel: '첫 동행 명함 금박', order: 268 },
  { id: 'collect_pet_style_profile_3', name: '세 장으로 소개하는 우리', desc: '대표 동행 코디 세 장을 마을 명함에 공개하기', goal: 3, registryKey: 'village_profile_pet_styles', progressMode: 'max', reward: 0, category: 'collection', location: '나의 마을 명함 · 대표 동행 코디 세 칸', prerequisite: 'story_pet_style_profile_first', rewardLabel: '동행 코디 큐레이터 배지', order: 132 },
  { id: 'story_pet_style_neighbor_view', name: '이웃의 작은 주인공', desc: '온라인 이웃 명함에서 대표 동행 코디 처음 보기', goal: 1, registryKey: 'pet_style_profile_views', progressMode: 'max', reward: 0, category: 'story', location: '온라인 이웃 명함 · 대표 동행 코디', prerequisite: 'intro_pet', rewardLabel: '이웃 동행 발견 도장', order: 269 },
];

/** 두 이웃의 대표 동행을 경쟁·보상 압박 없이 한 장의 2.5D 인사 엽서로 잇는 소셜 목표. */
export const PET_MEET_QUESTS: QuestDef[] = [
  { id: 'story_pet_meet_first', name: '두 발자국이 한 장에', desc: '온라인 이웃의 대표 동행과 첫 인사 엽서 남기기', goal: 1, registryKey: 'pet_meet_sent', progressMode: 'max', reward: 0, category: 'story', location: '온라인 이웃 명함 · 동행 인사 엽서', prerequisite: 'story_pet_style_profile_first', rewardLabel: '첫 동행 만남 우표', order: 270 },
  { id: 'story_pet_meet_received', name: '우리 집 앨범에 온 작은 친구', desc: '이웃의 동행 인사 엽서 처음 받기', goal: 1, registryKey: 'pet_meet_received', progressMode: 'max', reward: 0, category: 'story', location: '나의 마을 명함 · 동행 인사 엽서 앨범', prerequisite: 'intro_pet', rewardLabel: '첫 동행 답장 발자국', order: 271 },
  { id: 'collect_pet_meet_scenes_6', name: '여섯 풍경의 나란한 발', desc: '동행 인사 엽서 여섯 장면 모두 발견하기', goal: 6, registryKey: 'pet_meet_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '동행 인사 엽서 · 여섯 프리셋 장면', prerequisite: 'story_pet_meet_first', rewardLabel: '동행 만남 로케이션 배지', order: 133 },
  { id: 'collect_pet_meet_neighbors_5', name: '다섯 집의 작은 친구들', desc: '서로 다른 온라인 이웃 5명과 동행 엽서 남기기', goal: 5, registryKey: 'pet_meet_neighbors', progressMode: 'max', reward: 0, category: 'collection', location: '동행 인사 엽서 · 이웃 기록', prerequisite: 'story_pet_meet_first', rewardLabel: '골목 동행 인연가 배지', order: 134 },
  { id: 'collect_pet_meet_species_8', name: '여덟 종의 서로 다른 인사', desc: '동행 엽서에서 서로 다른 펫 종 8종 만나기', goal: 8, registryKey: 'pet_meet_species', progressMode: 'max', reward: 0, category: 'collection', location: '동행 인사 엽서 · 친구 도감', prerequisite: 'story_pet_meet_first', rewardLabel: '작은 친구 관찰가 배지', order: 135 },
  { id: 'collect_pet_meet_pairs_8', name: '여덟 가지 둘만의 호흡', desc: '서로 다른 동행 종 조합 8개 발견하기', goal: 8, registryKey: 'pet_meet_pairs', progressMode: 'max', reward: 0, category: 'collection', location: '동행 인사 엽서 · 두 발 조합 도감', prerequisite: 'story_pet_meet_first', rewardLabel: '동행 페어 큐레이터 배지', order: 136 },
  { id: 'master_pet_meet_total_24', name: '스물네 장의 경쟁 없는 만남', desc: '기한 없이 동행 인사 엽서 24장 주고받기', goal: 24, registryKey: 'pet_meet_total', progressMode: 'max', reward: 0, category: 'mastery', location: '나의 마을 명함 · 영구 동행 만남 앨범', prerequisite: 'collect_pet_meet_scenes_6', rewardLabel: '홍대 동행 우정 편집장 휘장', order: 160 },
];

/** 동행 인사 엽서 세 장을 액자·조명·배치와 함께 실제 집 벽면으로 잇는 하우징 목표. */
export const PET_MEMORY_WALL_QUESTS: QuestDef[] = [
  { id: 'story_pet_memory_wall_first', name: '한 장의 인사가 방에 걸린 날', desc: '동행 인사 엽서 한 장을 처음 추억 벽에 전시하기', goal: 1, registryKey: 'pet_memory_wall_cards', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 동행 추억 벽', prerequisite: 'story_pet_meet_first', rewardLabel: '첫 동행 벽걸이 핀', order: 272 },
  { id: 'story_pet_memory_wall_visible', name: '작은 친구들이 사는 벽', desc: '고른 동행 엽서를 실제 2.5D 방 벽면에 펼치기', goal: 1, registryKey: 'pet_memory_wall_visible', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 동행 추억 벽 · 방 표시', prerequisite: 'story_pet_memory_wall_first', rewardLabel: '첫 동행 홈 갤러리 도장', order: 273 },
  { id: 'collect_pet_memory_wall_cards_3', name: '세 이웃의 발자국 갤러리', desc: '서로 다른 동행 인사 엽서 세 장을 추억 벽에 전시하기', goal: 3, registryKey: 'pet_memory_wall_cards', progressMode: 'max', reward: 0, category: 'collection', location: '동행 추억 벽 · 세 장 전시', prerequisite: 'story_pet_memory_wall_first', rewardLabel: '동행 엽서 큐레이터 배지', order: 158 },
  { id: 'collect_pet_memory_wall_frames_4', name: '네 가지 결에 남은 인사', desc: '동행 추억 벽의 액자 결 네 가지 모두 사용하기', goal: 4, registryKey: 'pet_memory_wall_frames', progressMode: 'max', reward: 0, category: 'collection', location: '동행 추억 벽 · 액자 결', prerequisite: 'story_pet_memory_wall_first', rewardLabel: '추억 액자 제작자 배지', order: 159 },
  { id: 'collect_pet_memory_wall_lights_4', name: '네 빛으로 다시 보는 한 장', desc: '동행 추억 벽의 조명 네 가지 모두 사용하기', goal: 4, registryKey: 'pet_memory_wall_lights', progressMode: 'max', reward: 0, category: 'collection', location: '동행 추억 벽 · 추억 조명', prerequisite: 'story_pet_memory_wall_first', rewardLabel: '동행 장면 조명가 배지', order: 160 },
  { id: 'collect_pet_memory_wall_layouts_4', name: '세 장을 읽는 네 가지 순서', desc: '동행 추억 벽의 세 장 배치 네 가지 모두 사용하기', goal: 4, registryKey: 'pet_memory_wall_layouts', progressMode: 'max', reward: 0, category: 'collection', location: '동행 추억 벽 · 세 장 배치', prerequisite: 'collect_pet_memory_wall_cards_3', rewardLabel: '추억 벽 편집자 배지', order: 161 },
  { id: 'master_pet_memory_wall_restyles_16', name: '열여섯 번 다시 엮은 우리 골목', desc: '기한 없이 동행 추억 벽을 16번 새롭게 연출하기', goal: 16, registryKey: 'pet_memory_wall_restyles', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 동행 추억 벽 · 영구 꾸미기 기록', prerequisite: 'collect_pet_memory_wall_frames_4', rewardLabel: '홍대 동행 홈 큐레이터 휘장', order: 165 },
];

/** 분야가 다른 목표 세 개를 한 번에 고르고, 완료한 하루를 영구 모험 페이지로 남기는 선택형 목표. */
export const SESSION_PLANNER_QUESTS: QuestDef[] = [
  { id: 'story_session_plan_full', name: '오늘 하고 싶은 세 가지', desc: '분야가 달라도 괜찮은 목표 3개를 오늘의 플레이 큐에 담기', goal: 3, registryKey: 'session_plan_slots', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 추천 · 오늘의 플레이 큐', prerequisite: 'intro_journal', rewardLabel: '첫 세 정류장 노선표', order: 266 },
  { id: 'story_session_plan_page', name: '세 정류장이 한 장이 되는 밤', desc: '완료한 목표 3개를 첫 모험 페이지로 보존하기', goal: 1, registryKey: 'session_plan_pages', progressMode: 'max', reward: 0, category: 'story', location: '오늘의 플레이 큐 · 모험 페이지 보존', prerequisite: 'story_session_plan_full', rewardLabel: '첫 플레이 큐 기록 도장', order: 267 },
  { id: 'story_session_plan_featured', name: '내 방식의 대표 하루', desc: '보존한 모험 페이지 한 장을 대표 기록으로 전시하기', goal: 1, registryKey: 'session_plan_featured', progressMode: 'max', reward: 0, category: 'story', location: '오늘의 플레이 큐 · 모험 페이지 서랍', prerequisite: 'story_session_plan_page', rewardLabel: '대표 하루 금박 책갈피', order: 268 },
  { id: 'collect_session_plan_quests_15', name: '열다섯 번 스스로 고른 목적지', desc: '플레이 큐로 선택한 목표 15개를 완료해 보존하기', goal: 15, registryKey: 'session_plan_quests', progressMode: 'max', reward: 0, category: 'collection', location: '오늘의 플레이 큐 · 영구 모험 페이지', prerequisite: 'story_session_plan_page', rewardLabel: '자기 방식 여행자 배지', order: 132 },
  { id: 'collect_session_plan_categories_4', name: '네 갈래 생활을 잇는 노선', desc: '서로 다른 목표 분야 4종을 모험 페이지에 보존하기', goal: 4, registryKey: 'session_plan_categories', progressMode: 'max', reward: 0, category: 'collection', location: '오늘의 플레이 큐 · 분야별 노선 기록', prerequisite: 'story_session_plan_page', rewardLabel: '다분야 길잡이 배지', order: 133 },
  { id: 'master_session_plan_pages_10', name: '열 장으로 완성한 나만의 계절', desc: '기한 없이 플레이 큐 모험 페이지 10장 보존하기', goal: 10, registryKey: 'session_plan_pages', progressMode: 'max', reward: 0, category: 'mastery', location: '오늘의 플레이 큐 · 열 장의 영구 기록', prerequisite: 'collect_session_plan_quests_15', rewardLabel: '자유 일정 모험가 휘장', order: 157 },
];

/** 내 캐릭터·동행·만난 주민을 확률과 재료 소모 없이 직접 제작·전시하는 최애 굿즈 목표. */
export const FAN_MERCH_QUESTS: QuestDef[] = [
  { id: 'story_fan_merch_first', name: '최애가 책상 위에 선 날', desc: '내 캐릭터·동행·주민 중 첫 픽셀 굿즈 제작하기', goal: 1, registryKey: 'fan_merch_created', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 굿즈 · 골목 최애 굿즈 공방', prerequisite: 'intro_journal', rewardLabel: '첫 최애 제작 인증표', order: 269 },
  { id: 'story_fan_merch_featured', name: '나의 세 칸 최애 진열대', desc: '소장한 굿즈 한 점을 대표 진열에 올리기', goal: 1, registryKey: 'fan_merch_featured', progressMode: 'max', reward: 0, category: 'story', location: '최애 굿즈 공방 · 열두 칸 진열장', prerequisite: 'story_fan_merch_first', rewardLabel: '대표 최애 금박 스티커', order: 270 },
  { id: 'collect_fan_merch_formats_6', name: '여섯 형태의 소장법', desc: '아크릴·포토카드·배지·키링·포스터·티켓북 모두 제작하기', goal: 6, registryKey: 'fan_merch_formats', progressMode: 'max', reward: 0, category: 'collection', location: '최애 굿즈 공방 · 여섯 소장 형태', prerequisite: 'story_fan_merch_first', rewardLabel: '골목 굿즈 디렉터 배지', order: 134 },
  { id: 'collect_fan_merch_motifs_6', name: '여섯 골목의 최애 색', desc: '서로 다른 골목 분위기 6종으로 굿즈 제작하기', goal: 6, registryKey: 'fan_merch_motifs', progressMode: 'max', reward: 0, category: 'collection', location: '최애 굿즈 공방 · 분위기 팔레트', prerequisite: 'story_fan_merch_first', rewardLabel: '최애 팔레트 수집가 배지', order: 135 },
  { id: 'collect_fan_merch_subjects_5', name: '다섯 마음의 소장 선반', desc: '내 캐릭터·동행·만난 주민을 포함한 최애 5명 제작하기', goal: 5, registryKey: 'fan_merch_subjects', progressMode: 'max', reward: 0, category: 'collection', location: '최애 굿즈 공방 · 최애 선택 서랍', prerequisite: 'story_fan_merch_first', rewardLabel: '다섯 마음 응원단 배지', order: 136 },
  { id: 'master_fan_merch_designs_24', name: '스물네 장의 비공식 전시회', desc: '형태와 분위기가 다른 영구 굿즈 디자인 24종 발견하기', goal: 24, registryKey: 'fan_merch_discoveries', progressMode: 'max', reward: 0, category: 'mastery', location: '최애 굿즈 공방 · 영구 디자인 도감', prerequisite: 'collect_fan_merch_formats_6', rewardLabel: '홍대마을 팬메이드 장인 휘장', order: 158 },
];

/** 대표 굿즈를 실제 2.5D 집 벽에 펼치고 전시 가구·조명을 취향대로 연구하는 팬룸 목표. */
export const FAN_ROOM_QUESTS: QuestDef[] = [
  { id: 'story_fan_room_first', name: '최애가 우리 집에 온 날', desc: '대표 굿즈 한 점을 실제 방의 최애 코너에 전시하기', goal: 1, registryKey: 'fan_room_goods', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 나의 최애 방 전시 코너', prerequisite: 'story_fan_merch_featured', rewardLabel: '첫 덕질방 문패', order: 271 },
  { id: 'story_fan_room_restyle', name: '오늘 마음에 맞춘 한 칸', desc: '최애 코너의 진열 방식이나 조명을 처음 바꾸기', goal: 1, registryKey: 'fan_room_restyles', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 최애 방 전시 설정', prerequisite: 'story_fan_room_first', rewardLabel: '팬룸 스타일리스트 스티커', order: 272 },
  { id: 'collect_fan_room_goods_3', name: '세 마음이 머무는 벽', desc: '대표 굿즈 세 점을 실제 방에 함께 전시하기', goal: 3, registryKey: 'fan_room_goods', progressMode: 'max', reward: 0, category: 'collection', location: '최애 굿즈 공방 대표 진열 · 내 집 팬 코너', prerequisite: 'story_fan_room_first', rewardLabel: '세 칸 응원 선반 배지', order: 137 },
  { id: 'collect_fan_room_styles_4', name: '네 가지 소장 풍경', desc: '원목 선반·타공판·유리 장식장·팬 월 진열을 모두 사용하기', goal: 4, registryKey: 'fan_room_styles', progressMode: 'max', reward: 0, category: 'collection', location: '나의 최애 방 · 진열 방식', prerequisite: 'story_fan_room_restyle', rewardLabel: '팬 코너 큐레이터 배지', order: 138 },
  { id: 'collect_fan_room_lights_4', name: '네 번 달라진 최애의 빛', desc: '크림·네온·낮빛·별빛 조명을 모두 사용하기', goal: 4, registryKey: 'fan_room_lights', progressMode: 'max', reward: 0, category: 'collection', location: '나의 최애 방 · 코너 조명', prerequisite: 'story_fan_room_restyle', rewardLabel: '골목 조명 감독 배지', order: 139 },
  { id: 'master_fan_room_restyles_16', name: '열여섯 번 다시 좋아한 방', desc: '기한 없이 최애 코너의 진열과 조명을 16회 다듬기', goal: 16, registryKey: 'fan_room_restyles', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 최애 방 영구 전시 기록', prerequisite: 'collect_fan_room_styles_4', rewardLabel: '홍대마을 팬룸 디렉터 휘장', order: 159 },
];

/** 기존 8장 여정을 세 갈래 해결법과 선택형 마지막 문장으로 읽는 메인 시나리오 기록. */
export const VILLAGE_CHRONICLE_QUESTS: QuestDef[] = [
  { id: 'story_chronicle_route_first', name: '내가 고른 첫 이야기의 길', desc: '메인 연대기에서 첫 장의 생활 루트 고르기', goal: 1, registryKey: 'chronicle_routes', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 메인 · 홍대마을 연대기', prerequisite: 'intro_journal', rewardLabel: '첫 메인 루트 책갈피', order: 263 },
  { id: 'story_chronicle_page_first', name: '첫 장의 마지막 문장', desc: '완료한 여정에 첫 연대기 원고 보존하기', goal: 1, registryKey: 'chronicle_pages', progressMode: 'max', reward: 0, category: 'story', location: '메인 연대기 · 마지막 문장', prerequisite: 'journey_reward_1', rewardLabel: '첫 연대기 원고 도장', order: 264 },
  { id: 'collect_chronicle_pages_4', name: '네 장으로 읽는 나의 마을', desc: '메인 연대기 원고 4장 보존하기', goal: 4, registryKey: 'chronicle_pages', progressMode: 'max', reward: 0, category: 'collection', location: '모험 일지 · 메인 원고 목차', prerequisite: 'story_chronicle_page_first', rewardLabel: '마을 이야기 독자 배지', order: 126 },
  { id: 'collect_chronicle_pages_8', name: '여덟 장의 자기 방식 서사', desc: '메인 연대기 8장 전권 보존하기', goal: 8, registryKey: 'chronicle_pages', progressMode: 'max', reward: 0, category: 'collection', location: '홍대마을 메인 연대기 · 전권', prerequisite: 'collect_chronicle_pages_4', rewardLabel: '홍대마을 주인공 휘장', order: 127 },
  { id: 'collect_chronicle_motifs_3', name: '사람과 장소와 다음 가능성', desc: '세 가지 기억 방식으로 서로 다른 장 보존하기', goal: 3, registryKey: 'chronicle_motifs', progressMode: 'max', reward: 0, category: 'collection', location: '메인 연대기 · 선택형 마지막 문장', prerequisite: 'story_chronicle_page_first', rewardLabel: '세 갈래 이야기 편집자 배지', order: 128 },
  { id: 'master_chronicle_featured', name: '광장에 펼친 나의 대표 원고', desc: '좋아하는 메인 연대기 장을 대표 원고로 전시하기', goal: 1, registryKey: 'chronicle_featured', progressMode: 'max', reward: 0, category: 'mastery', location: '메인 연대기 · 영구 보존 기념', prerequisite: 'story_chronicle_page_first', rewardLabel: '대표 원고 금장 집게', order: 155 },
];

/** 선택형 여정의 각 장을 마치면 실제 배지함에 남는 여행 도장. */
export const JOURNEY_REWARD_QUESTS: QuestDef[] = [
  { id: 'journey_reward_1', name: '여정 1장 · 문을 연 첫날', desc: '첫 여정에서 원하는 목표 3개 완성하기', goal: 1, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'intro_journal', rewardLabel: '첫날의 여권 도장', order: 900 },
  { id: 'journey_reward_2', name: '여정 2장 · 내가 사는 방식', desc: '두 번째 여정에서 원하는 목표 3개 완성하기', goal: 2, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_1', rewardLabel: '생활의 첫 페이지 배지', order: 910 },
  { id: 'journey_reward_3', name: '여정 3장 · 손끝에 남는 하루', desc: '세 번째 여정에서 생활 분야 3개 경험하기', goal: 3, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_2', rewardLabel: '골목 생활 제작자 배지', order: 920 },
  { id: 'journey_reward_4', name: '여정 4장 · 이름을 기억하는 골목', desc: '네 번째 여정에서 관계 장면 3개 완성하기', goal: 4, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_3', rewardLabel: '골목 인연 기록가 배지', order: 930 },
  { id: 'journey_reward_5', name: '여정 5장 · 수집가의 벽 한 칸', desc: '다섯 번째 여정에서 수집 도감 3권 채우기', goal: 5, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_4', rewardLabel: '취향 수집가 배지', order: 940 },
  { id: 'journey_reward_6', name: '여정 6장 · 네 갈래의 전문 생활', desc: '여섯 번째 여정에서 생활 숙련 4분야 Lv.5 달성하기', goal: 6, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_5', rewardLabel: '다분야 생활 전문가 휘장', order: 950 },
  { id: 'journey_reward_7', name: '여정 7장 · 홍대마을 연대기', desc: '일곱 번째 여정에서 깊은 기록 4개 완성하기', goal: 7, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_6', rewardLabel: '마을 연대기 편집자 휘장', order: 960 },
  { id: 'journey_reward_8', name: '여정 8장 · 자기 방식의 전설', desc: '마지막 여정에서 최상위 목표 5개 완성하기', goal: 8, registryKey: 'journey_chapters', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정', prerequisite: 'journey_reward_7', rewardLabel: '홍대마을 생활 전설 휘장', order: 970 },
];

/** 연속 출석 압박 없이 매일 세 장만 골라 즐기고, 첫 도장을 영구 수집하는 생활 초대장 목표. */
export const DAILY_INVITATION_QUESTS: QuestDef[] = [
  { id: 'story_daily_invitation_first', name: '우편함의 첫 생활 초대', desc: '오늘의 생활 초대장에 첫 완료 도장 남기기', goal: 1, registryKey: 'daily_invitations_claimed', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 오늘 · 생활 초대장', prerequisite: 'intro_journal', rewardLabel: '첫 생활 우편 도장', order: 265 },
  { id: 'collect_daily_invitation_stamps_10', name: '열 가지 마음이 머문 우편함', desc: '서로 다른 생활 초대장 첫 도장 10개 수집하기', goal: 10, registryKey: 'daily_invitation_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '오늘의 생활 초대장 · 영구 도장책', prerequisite: 'story_daily_invitation_first', rewardLabel: '생활 우편 수집가 배지', order: 129 },
  { id: 'collect_daily_invitation_stamps_30', name: '서른 장의 하고 싶은 하루', desc: '생활 초대장 첫 도장 30개를 모두 수집하기', goal: 30, registryKey: 'daily_invitation_stamps', progressMode: 'max', reward: 0, category: 'collection', location: '생활 초대장 · 30칸 영구 도장책', prerequisite: 'collect_daily_invitation_stamps_10', rewardLabel: '골목 생활 우편 아카이비스트 배지', order: 130 },
  { id: 'collect_daily_invitation_domains_10', name: '열 갈래 생활에서 온 편지', desc: '생활 숙련 열 분야의 초대장 도장 남기기', goal: 10, registryKey: 'daily_invitation_domains', progressMode: 'max', reward: 0, category: 'collection', location: '생활 초대장 · 분야별 도장 색인', prerequisite: 'collect_daily_invitation_stamps_10', rewardLabel: '열 갈래 생활 탐험가 배지', order: 131 },
  { id: 'master_daily_invitations_100', name: '백 번 스스로 고른 하루', desc: '기한 없이 생활 초대장 도장 누적 100번 남기기', goal: 100, registryKey: 'daily_invitations_claimed', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 오늘의 생활 초대장', prerequisite: 'collect_daily_invitation_stamps_30', rewardLabel: '자기 방식 생활인 휘장', order: 156 },
];

/** 실제 온라인 이웃과 자유문구 없이 하루 한 장씩 나누는 안전한 취향 응원 우편 목표. */
export const NEIGHBOR_CHEER_QUESTS: QuestDef[] = [
  { id: 'story_neighbor_cheer_send', name: '명함 사이를 건넌 첫 마음', desc: '온라인 이웃의 마을 명함에서 첫 취향 응원 보내기', goal: 1, registryKey: 'neighbor_cheers_sent', progressMode: 'max', reward: 0, category: 'story', location: '온라인 이웃 · 마을 명함', prerequisite: 'story_first_chat', rewardLabel: '첫 이웃 응원 우표', order: 266 },
  { id: 'story_neighbor_cheer_receive', name: '우편함에 도착한 반가움', desc: '온라인 이웃에게서 첫 취향 응원 우편 받기', goal: 1, registryKey: 'neighbor_cheers_received', progressMode: 'max', reward: 0, category: 'story', location: '나의 마을 명함 · 응원 우편함', prerequisite: 'story_neighbor_cheer_send', rewardLabel: '첫 답신 봉인', order: 267 },
  { id: 'collect_neighbor_cheer_kinds_8', name: '여덟 취향으로 읽는 골목', desc: '자유문구 없는 취향 응원 8종 모두 기록하기', goal: 8, registryKey: 'neighbor_cheer_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '마을 명함 · 영구 응원 우편함', prerequisite: 'story_neighbor_cheer_receive', rewardLabel: '취향 공감 수집가 배지', order: 132 },
  { id: 'collect_neighbor_cheer_neighbors_10', name: '열 이름이 머문 작은 우편함', desc: '서로 다른 온라인 이웃 10명과 응원 우편 나누기', goal: 10, registryKey: 'neighbor_cheer_neighbors', progressMode: 'max', reward: 0, category: 'collection', location: '온라인 마을 · 이웃 명함', prerequisite: 'story_neighbor_cheer_receive', rewardLabel: '온라인 골목 우편배달부 배지', order: 133 },
  { id: 'master_neighbor_cheer_50', name: '쉰 장의 경쟁 없는 응원', desc: '보낸 마음과 받은 마음을 합쳐 응원 우편 50장 기록하기', goal: 50, registryKey: 'neighbor_cheer_total', progressMode: 'max', reward: 0, category: 'mastery', location: '마을 명함 · 응원 우편함', prerequisite: 'collect_neighbor_cheer_kinds_8', rewardLabel: '홍대마을 마음 연결자 휘장', order: 157 },
];

/** 실제 온라인 이웃의 서버 방을 읽기 전용으로 둘러보고 경쟁 없이 수첩에 남기는 집 투어 목표. */
export const NEIGHBOR_HOME_TOUR_QUESTS: QuestDef[] = [
  { id: 'story_neighbor_home_first', name: '명함 너머 처음 열린 문', desc: '온라인 이웃의 명함에서 첫 읽기 전용 집 투어 도장 남기기', goal: 1, registryKey: 'neighbor_home_tours', progressMode: 'max', reward: 0, category: 'story', location: '온라인 이웃 · 마을 명함 · 열린 집', prerequisite: 'story_first_chat', rewardLabel: '첫 이웃집 실내화 도장', order: 268 },
  { id: 'collect_neighbor_homes_5', name: '다섯 현관의 서로 다른 온도', desc: '서로 다른 온라인 이웃집 5곳 방문하기', goal: 5, registryKey: 'neighbor_homes_visited', progressMode: 'max', reward: 0, category: 'collection', location: '마을 명함 · 이웃집 투어 수첩', prerequisite: 'story_neighbor_home_first', rewardLabel: '열린 문 산책가 배지', order: 134 },
  { id: 'collect_neighbor_home_themes_6', name: '여섯 취향이 사는 방식', desc: '이웃집 투어에서 홈 테마 6종 모두 기록하기', goal: 6, registryKey: 'neighbor_home_themes', progressMode: 'max', reward: 0, category: 'collection', location: '이웃집 투어 수첩 · 테마 도장', prerequisite: 'story_neighbor_home_first', rewardLabel: '생활 공간 독자 배지', order: 135 },
  { id: 'collect_neighbor_home_types_5', name: '반지하부터 마당집까지', desc: '다섯 주거 유형의 온라인 이웃집 방문하기', goal: 5, registryKey: 'neighbor_home_types', progressMode: 'max', reward: 0, category: 'collection', location: '이웃집 투어 수첩 · 주거형 색인', prerequisite: 'collect_neighbor_homes_5', rewardLabel: '골목 주거 탐험가 배지', order: 136 },
  { id: 'master_neighbor_home_tours_30', name: '서른 번 신발을 가지런히', desc: '기한과 연속 출석 없이 이웃집 투어 30회 기록하기', goal: 30, registryKey: 'neighbor_home_tours', progressMode: 'max', reward: 0, category: 'mastery', location: '온라인 마을 · 열린 집 투어', prerequisite: 'collect_neighbor_homes_5', rewardLabel: '다정한 집 구경꾼 휘장', order: 158 },
  { id: 'story_neighbor_home_favorite', name: '마음에 오래 남은 첫 방', desc: '투어 엽서 한 장을 첫 최애로 보존하기', goal: 1, registryKey: 'neighbor_home_favorites', progressMode: 'max', reward: 0, category: 'story', location: '나의 마을 명함 · 이웃집 투어 수첩', prerequisite: 'story_neighbor_home_first', rewardLabel: '첫 최애 집 엽서 금박', order: 269 },
  { id: 'collect_neighbor_home_favorites_6', name: '여섯 창문에 켜 둔 불', desc: '마음에 든 이웃집 투어 엽서 6장을 최애로 보존하기', goal: 6, registryKey: 'neighbor_home_favorites', progressMode: 'max', reward: 0, category: 'collection', location: '이웃집 투어 수첩 · 최애 엽서', prerequisite: 'story_neighbor_home_favorite', rewardLabel: '열린 집 엽서 편집자 배지', order: 137 },
];

/** 집주인의 공개 동의와 고정 문구 스티커만 사용하는 안전한 영구 집들이 방명록 목표. */
export const HOME_GUESTBOOK_QUESTS: QuestDef[] = [
  { id: 'story_home_open_public', name: '내가 직접 여는 현관', desc: '내 집 꾸미기에서 이웃집 투어 공개를 직접 켜기', goal: 1, registryKey: 'home_open_public', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스타일 · 공개 설정', prerequisite: 'intro_home', rewardLabel: '열린 현관 주인 도장', order: 270 },
  { id: 'story_home_guestbook_send', name: '현관에 남긴 첫 온기', desc: '온라인 열린 집에서 자유문구 없는 집들이 스티커 한 장 남기기', goal: 1, registryKey: 'home_guestbook_sent', progressMode: 'max', reward: 0, category: 'story', location: '온라인 이웃 · 열린 집 · 집들이 스티커', prerequisite: 'story_neighbor_home_first', rewardLabel: '첫 집들이 스티커 우표', order: 271 },
  { id: 'story_home_guestbook_receive', name: '내 집에 도착한 첫 마음', desc: '공개한 내 집의 영구 우편함에서 첫 집들이 스티커 받기', goal: 1, registryKey: 'home_guestbook_received', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 우리 집 방명록', prerequisite: 'story_home_open_public', rewardLabel: '첫 집들이 답례 봉인', order: 272 },
  { id: 'collect_home_guestbook_kinds_8', name: '여덟 마음의 집들이 도감', desc: '서로 다른 집들이 스티커 8종 모두 나누기', goal: 8, registryKey: 'home_guestbook_kinds', progressMode: 'max', reward: 0, category: 'collection', location: '온라인 열린 집 · 집들이 스티커', prerequisite: 'story_home_guestbook_send', rewardLabel: '집들이 마음 수집가 배지', order: 138 },
  { id: 'collect_home_guestbook_visitors_10', name: '열 이름이 다녀간 현관', desc: '공개한 내 집 방명록에 서로 다른 이웃 10명 맞이하기', goal: 10, registryKey: 'home_guestbook_visitors', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 우리 집 방명록', prerequisite: 'story_home_guestbook_receive', rewardLabel: '다정한 열린 집 주인 배지', order: 139 },
  { id: 'master_home_guestbook_50', name: '쉰 현관에 놓인 작은 마음', desc: '기한 없이 열린 집에 집들이 스티커 50장 남기기', goal: 50, registryKey: 'home_guestbook_sent', progressMode: 'max', reward: 0, category: 'mastery', location: '온라인 마을 · 열린 집', prerequisite: 'collect_home_guestbook_kinds_8', rewardLabel: '홍대마을 집들이 기록가 휘장', order: 159 },
];

/** 현재 방을 여섯 픽셀 장면으로 보존하고 안전하게 갈아입히는 집 꾸미기 장기 목표. */
export const HOME_LAYOUT_QUESTS: QuestDef[] = [
  { id: 'story_home_layout_first', name: '방을 접어 둔 첫 페이지', desc: '현재 방 배치를 홈 장면 보관함에 처음 저장하기', goal: 1, registryKey: 'home_layout_slots', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 장면 보관함', prerequisite: 'intro_decorate', rewardLabel: '첫 공간 스냅샷 도장', order: 273 },
  { id: 'story_home_layout_apply', name: '어제의 방으로 돌아오는 법', desc: '저장한 홈 장면을 처음 안전하게 적용하기', goal: 1, registryKey: 'home_layout_applies', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 장면 보관함', prerequisite: 'story_home_layout_first', rewardLabel: '첫 장면 전환 열쇠', order: 274 },
  { id: 'collect_home_layout_slots_3', name: '세 가지로 사는 한 사람', desc: '서로 다른 홈 장면 슬롯 3칸 채우기', goal: 3, registryKey: 'home_layout_slots', progressMode: 'max', reward: 0, category: 'collection', location: '홈 장면 보관함 · 여섯 슬롯', prerequisite: 'story_home_layout_first', rewardLabel: '세 장면 생활 편집자 배지', order: 140 },
  { id: 'collect_home_layout_slots_6', name: '여섯 개의 작은 집 우주', desc: '홈 장면 보관함 여섯 슬롯 모두 채우기', goal: 6, registryKey: 'home_layout_slots', progressMode: 'max', reward: 0, category: 'collection', location: '홈 장면 보관함 · 전권', prerequisite: 'collect_home_layout_slots_3', rewardLabel: '여섯 방 아카이비스트 배지', order: 141 },
  { id: 'collect_home_layout_scenes_6', name: '복사하지 않은 여섯 풍경', desc: '배치가 서로 다른 홈 장면 6개 보존하기', goal: 6, registryKey: 'home_layout_scenes', progressMode: 'max', reward: 0, category: 'collection', location: '홈 장면 보관함 · 픽셀 미니어처', prerequisite: 'collect_home_layout_slots_3', rewardLabel: '공간 컨셉 수집가 배지', order: 142 },
  { id: 'collect_home_layout_items_30', name: '서른 물건의 다른 문장', desc: '저장 장면 전체에서 서로 다른 가구 30종 기록하기', goal: 30, registryKey: 'home_layout_items', progressMode: 'max', reward: 0, category: 'collection', location: '홈 장면 보관함 · 장면 도감', prerequisite: 'collect_home_layout_slots_3', rewardLabel: '살림 장면 감별사 배지', order: 143 },
  { id: 'master_home_layout_saves_30', name: '서른 번 갈아입은 생활의 결', desc: '기한 없이 홈 장면 저장을 누적 30번 기록하기', goal: 30, registryKey: 'home_layout_saves', progressMode: 'max', reward: 0, category: 'mastery', location: '내 집 · 홈 장면 보관함', prerequisite: 'collect_home_layout_slots_6', rewardLabel: '홍대 공간 연출가 휘장', order: 160 },
];

/** 실제 캐릭터·동행·가구 배치를 여섯 장의 2.5D 픽셀 엽서로 보존하는 홈 스튜디오 목표. */
export const HOME_STUDIO_CARD_QUESTS: QuestDef[] = [
  { id: 'story_home_studio_first', name: '우리 방을 닮은 첫 엽서', desc: '현재 캐릭터와 방 배치를 홈 스튜디오 엽서로 처음 보존하기', goal: 1, registryKey: 'home_studio_cards', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스튜디오 엽서', prerequisite: 'intro_decorate', rewardLabel: '첫 홈 스튜디오 촬영 도장', order: 275 },
  { id: 'story_home_studio_pet', name: '작은 동행이 들어온 한 장', desc: '현재 함께 사는 펫과 홈 스튜디오 엽서 남기기', goal: 1, registryKey: 'home_studio_pet_cards', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스튜디오 엽서', prerequisite: 'intro_pet', rewardLabel: '동행 홈 엽서 리본', order: 276 },
  { id: 'story_home_studio_featured', name: '명함에 걸어 둔 우리 집', desc: '홈 스튜디오 엽서 한 장을 마을 명함 대표로 공개하기', goal: 1, registryKey: 'home_studio_featured', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 홈 스튜디오 엽서 · 대표 공개', prerequisite: 'story_home_studio_first', rewardLabel: '첫 대표 홈 엽서 금박', order: 277 },
  { id: 'collect_home_studio_cards_3', name: '세 장으로 읽는 나의 생활', desc: '서로 다른 홈 스튜디오 슬롯 3칸 채우기', goal: 3, registryKey: 'home_studio_cards', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 홈 스튜디오 엽서 · 여섯 슬롯', prerequisite: 'story_home_studio_first', rewardLabel: '생활 장면 편집자 배지', order: 147 },
  { id: 'collect_home_studio_moods_3', name: '한 방에 머문 세 가지 온도', desc: '서로 다른 홈 스튜디오 무드 3종으로 엽서 보존하기', goal: 3, registryKey: 'home_studio_moods', progressMode: 'max', reward: 0, category: 'collection', location: '홈 스튜디오 엽서 · 여섯 무드', prerequisite: 'story_home_studio_first', rewardLabel: '홈 무드 컬렉터 배지', order: 148 },
  { id: 'collect_home_studio_cards_6', name: '여섯 장의 작은 생활 화보', desc: '홈 스튜디오 엽서 여섯 슬롯 모두 채우기', goal: 6, registryKey: 'home_studio_cards', progressMode: 'max', reward: 0, category: 'collection', location: '홈 스튜디오 엽서 · 전권', prerequisite: 'collect_home_studio_cards_3', rewardLabel: '홈 스튜디오 아카이비스트 배지', order: 149 },
  { id: 'master_home_studio_featured_3', name: '세 창에 비친 나의 세계', desc: '마을 명함에 대표 홈 스튜디오 엽서 3장 전시하기', goal: 3, registryKey: 'home_studio_featured', progressMode: 'max', reward: 0, category: 'mastery', location: '나의 마을 명함 · 대표 홈 엽서', prerequisite: 'story_home_studio_featured', rewardLabel: '홍대 홈 비주얼 디렉터 휘장', order: 162 },
];

/** 보유·배치한 가구 65점의 개별 기억을 읽고 아홉 테마 장과 최애 선반을 만드는 물건 서사 목표. */
export const OBJECT_STORY_QUESTS: QuestDef[] = [
  { id: 'story_object_story_first', name: '물건이 처음 건넨 한마디', desc: '가지고 있거나 방에 놓아 본 첫 물건 이야기 발견하기', goal: 1, registryKey: 'object_story_items', progressMode: 'max', reward: 0, category: 'story', location: '내 집 · 물건의 속삭임 도감', prerequisite: 'intro_decorate', rewardLabel: '첫 물건 속삭임 책갈피', order: 278 },
  { id: 'story_object_story_inspect', name: '손때를 따라 다시 읽는 법', desc: '물건의 속삭임 상세 이야기를 처음 다시 읽기', goal: 1, registryKey: 'object_story_inspections', progressMode: 'max', reward: 0, category: 'story', location: '물건의 속삭임 도감 · 상세 장면', prerequisite: 'story_object_story_first', rewardLabel: '첫 생활 관찰 메모', order: 279 },
  { id: 'story_object_story_favorite', name: '나를 설명하는 첫 물건', desc: '마음에 남은 물건 한 점을 첫 최애로 진열하기', goal: 1, registryKey: 'object_story_favorites', progressMode: 'max', reward: 0, category: 'story', location: '물건의 속삭임 도감 · 최애 아홉 칸', prerequisite: 'story_object_story_first', rewardLabel: '첫 최애 물건 금박', order: 285 },
  { id: 'collect_object_story_15', name: '열다섯 물건이 사는 방', desc: '서로 다른 물건 이야기 15점 발견하기', goal: 15, registryKey: 'object_story_items', progressMode: 'max', reward: 0, category: 'collection', location: '내 집 · 물건의 속삭임 도감', prerequisite: 'story_object_story_first', rewardLabel: '생활 사물 관찰자 배지', order: 150 },
  { id: 'collect_object_story_35', name: '서른다섯 취향의 손때', desc: '서로 다른 물건 이야기 35점 발견하기', goal: 35, registryKey: 'object_story_items', progressMode: 'max', reward: 0, category: 'collection', location: '물건의 속삭임 도감 · 65점 전권', prerequisite: 'collect_object_story_15', rewardLabel: '방의 문장 수집가 배지', order: 151 },
  { id: 'collect_object_story_65', name: '예순다섯 물건의 완전한 집', desc: '카탈로그 모든 물건의 고유 이야기 65점 발견하기', goal: 65, registryKey: 'object_story_items', progressMode: 'max', reward: 0, category: 'collection', location: '물건의 속삭임 도감 · 전권', prerequisite: 'collect_object_story_35', rewardLabel: '홍대 생활 사물 대도감 배지', order: 152 },
  { id: 'collect_object_story_chapters_4', name: '네 방식으로 읽는 생활', desc: '물건 이야기 테마 장 4편 완성하기', goal: 4, registryKey: 'object_story_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '물건의 속삭임 도감 · 아홉 장', prerequisite: 'collect_object_story_15', rewardLabel: '생활 장면 독자 배지', order: 153 },
  { id: 'collect_object_story_chapters_9', name: '방이 기억한 아홉 장', desc: '물건 이야기 테마 장 9편 모두 완성하기', goal: 9, registryKey: 'object_story_chapters', progressMode: 'max', reward: 0, category: 'collection', location: '물건의 속삭임 도감 · 아홉 장 전권', prerequisite: 'collect_object_story_chapters_4', rewardLabel: '골목 사물 서사 편집자 배지', order: 154 },
  { id: 'master_object_story_favorites_9', name: '아홉 물건으로 쓰는 자기소개', desc: '나를 설명하는 최애 물건 선반 9칸 채우기', goal: 9, registryKey: 'object_story_favorites', progressMode: 'max', reward: 0, category: 'mastery', location: '물건의 속삭임 도감 · 최애 아홉 칸', prerequisite: 'story_object_story_favorite', rewardLabel: '홍대 취향 사물 큐레이터 휘장', order: 163 },
];

/** 생활 기록으로 빛·비·눈을 영구 관측하고 실제 아이소메트릭 월드에 자유 재생하는 환경 수집 목표. */
export const NEIGHBORHOOD_ATMOSPHERE_QUESTS: QuestDef[] = [
  { id: 'story_atmosphere_visit', name: '날씨를 고르는 첫 관측소', desc: '골목 분위기 관측소를 처음 열어 여덟 하늘 살펴보기', goal: 1, registryKey: 'atmosphere_visits', progressMode: 'max', reward: 0, category: 'story', location: '아이소메트릭 마을 · 골목 분위기 관측소', prerequisite: 'intro_map', rewardLabel: '첫 하늘 관측표', order: 286 },
  { id: 'story_atmosphere_first', name: '두 생활이 만난 두 번째 하늘', desc: '첫 햇살 외에 새로운 골목 분위기 한 장 영구 관측하기', goal: 2, registryKey: 'atmosphere_observed', progressMode: 'max', reward: 0, category: 'story', location: '골목 분위기 관측소 · 여덟 하늘', prerequisite: 'story_atmosphere_visit', rewardLabel: '생활 기상 관측자 배지', order: 287 },
  { id: 'story_atmosphere_replay', name: '좋아하는 날씨를 다시 부르는 법', desc: '관측한 골목 분위기 연출을 처음 다시 보기', goal: 1, registryKey: 'atmosphere_replays', progressMode: 'max', reward: 0, category: 'story', location: '골목 분위기 관측소 · 월드 빛 제어', prerequisite: 'story_atmosphere_visit', rewardLabel: '첫 날씨 재생 필름', order: 288 },
  { id: 'collect_atmospheres_4', name: '네 계절이 머문 한 골목', desc: '서로 다른 골목 분위기 4장 영구 관측하기', goal: 4, registryKey: 'atmosphere_observed', progressMode: 'max', reward: 0, category: 'collection', location: '골목 분위기 관측소 · 영구 관측책', prerequisite: 'story_atmosphere_first', rewardLabel: '골목 빛 수집가 배지', order: 155 },
  { id: 'collect_atmospheres_8', name: '여덟 하늘의 완전한 연감', desc: '빛·구름·비·네온·안개·눈·꽃잎 8장 모두 관측하기', goal: 8, registryKey: 'atmosphere_observed', progressMode: 'max', reward: 0, category: 'collection', location: '골목 분위기 관측소 · 전권', prerequisite: 'collect_atmospheres_4', rewardLabel: '홍대마을 날씨 연감 배지', order: 156 },
  { id: 'collect_atmosphere_featured_3', name: '나를 설명하는 세 장의 하늘', desc: '좋아하는 골목 분위기 3장을 대표 하늘로 간직하기', goal: 3, registryKey: 'atmosphere_featured', progressMode: 'max', reward: 0, category: 'collection', location: '골목 분위기 관측소 · 대표 하늘', prerequisite: 'story_atmosphere_first', rewardLabel: '세 하늘 무드 디렉터 배지', order: 157 },
  { id: 'master_atmosphere_replays_20', name: '스무 번 골목의 빛을 연출한 사람', desc: '마감 없이 좋아하는 골목 분위기 연출 20번 다시 보기', goal: 20, registryKey: 'atmosphere_replays', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 분위기 관측소 · 월드 연출', prerequisite: 'story_atmosphere_replay', rewardLabel: '아이소메트릭 기상 연출가 휘장', order: 164 },
];

/** 아이소메트릭 생활권을 직접 걸어 발견하고 최애 골목을 남기는 공간 진행. */
export const NEIGHBORHOOD_DISTRICT_QUESTS: QuestDef[] = [
  { id: 'story_district_first', name: '발밑에 찍힌 첫 골목 도장', desc: '아이소메트릭 마을에서 첫 생활 권역 발견하기', goal: 1, registryKey: 'districts_discovered', progressMode: 'max', reward: 0, category: 'story', location: '마을 지도 · 골목 여권', prerequisite: 'intro_map', rewardLabel: '첫 골목 여권 도장', order: 280 },
  { id: 'story_district_featured', name: '오래 머물고 싶은 한 골목', desc: '직접 발견한 권역을 골목 여권의 첫 최애로 전시하기', goal: 1, registryKey: 'district_passport_featured', progressMode: 'max', reward: 0, category: 'story', location: '마을 지도 · 일곱 골목 발견 도장', prerequisite: 'story_district_first', rewardLabel: '나의 최애 골목 핀', order: 281 },
  { id: 'collect_districts_4', name: '네 갈래 생활 지도를 접는 법', desc: '서로 다른 생활 권역 4곳 직접 발견하기', goal: 4, registryKey: 'districts_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '마을 지도 · 골목 여권', prerequisite: 'story_district_first', rewardLabel: '생활권 산책가 배지', order: 144 },
  { id: 'collect_districts_7', name: '일곱 골목에 남은 내 발자국', desc: '안전 생활권 6곳과 선택형 외곽숲까지 모두 발견하기', goal: 7, registryKey: 'districts_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '아이소메트릭 홍대마을 · 전 권역', prerequisite: 'collect_districts_4', rewardLabel: '홍대마을 전도 완성 배지', order: 145 },
];

/** 월드의 작은 환경 소품을 직접 찾아 네 편의 숨은 생활 서사로 엮는 탐험 기록. */
export const ALLEY_SECRET_QUESTS: QuestDef[] = [
  { id: 'story_alley_secret_first', name: '골목이 먼저 건넨 한마디', desc: '월드에서 첫 환경 단서 발견하기', goal: 1, registryKey: 'alley_secrets_discovered', progressMode: 'max', reward: 0, category: 'story', location: '마을 지도 · 골목 비밀 기록 또는 가까운 ◇ 흔적', prerequisite: 'intro_sparkle', rewardLabel: '첫 골목 비밀 봉인', order: 282 },
  { id: 'story_alley_secret_chapter', name: '세 흔적이 한 이야기가 되는 밤', desc: '골목 비밀 이야기 한 편 완결하기', goal: 1, registryKey: 'alley_secret_chapters', progressMode: 'max', reward: 0, category: 'story', location: '골목 비밀 기록 · 네 이야기 색인', prerequisite: 'story_alley_secret_first', rewardLabel: '첫 환경 서사 편집자 배지', order: 283 },
  { id: 'story_alley_secret_featured', name: '오래 간직할 골목의 문장', desc: '완결한 비밀 이야기 한 편을 최애로 전시하기', goal: 1, registryKey: 'alley_secret_featured', progressMode: 'max', reward: 0, category: 'story', location: '골목 비밀 기록 · 완결 이야기', prerequisite: 'story_alley_secret_chapter', rewardLabel: '최애 골목 문장 금박', order: 284 },
  { id: 'collect_alley_secrets_6', name: '여섯 모서리에 남은 생활', desc: '서로 다른 환경 단서 6개 발견하기', goal: 6, registryKey: 'alley_secrets_discovered', progressMode: 'max', reward: 0, category: 'collection', location: '아이소메트릭 마을 · 가까이에서 나타나는 ◇ 흔적', prerequisite: 'story_alley_secret_first', rewardLabel: '골목 여백 수집가 배지', order: 146 },
  { id: 'master_alley_secrets_12', name: '열두 흔적으로 읽는 홍대마을', desc: '네 편의 골목 비밀 기록 12개 모두 발견하기', goal: 12, registryKey: 'alley_secrets_discovered', progressMode: 'max', reward: 0, category: 'mastery', location: '골목 비밀 기록 · 전권', prerequisite: 'collect_alley_secrets_6', rewardLabel: '홍대마을 환경 서사가 휘장', order: 161 },
];

/** 전투뿐 아니라 모든 생활 XP를 합산하는 마을 레벨 이정표. */
export const VILLAGE_LEVEL_QUESTS: QuestDef[] = [
  { id: 'master_village_level_5', name: '골목을 걷는 법', desc: '마을 레벨 5 달성하기', goal: 5, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'intro_journal', rewardLabel: '골목 산책자 명찰', order: 300 },
  { id: 'master_village_level_10', name: '생활이 경험이 되는 순간', desc: '마을 레벨 10 달성하기', goal: 10, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'master_village_level_5', rewardLabel: '생활 수집가 명찰', order: 310 },
  { id: 'master_village_level_20', name: '골목의 익숙한 얼굴', desc: '마을 레벨 20 달성하기', goal: 20, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'master_village_level_10', rewardLabel: '마을 단골 명찰', order: 320 },
  { id: 'master_village_level_30', name: '취향을 기록하는 사람', desc: '마을 레벨 30 달성하기', goal: 30, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'master_village_level_20', rewardLabel: '취향 기록가 명찰', order: 330 },
  { id: 'master_village_level_40', name: '생활을 엮는 장인', desc: '마을 레벨 40 달성하기', goal: 40, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'master_village_level_30', rewardLabel: '골목 장인 명찰', order: 340 },
  { id: 'master_village_level_50', name: '모든 날의 연대기', desc: '마을 레벨 50 달성하기', goal: 50, registryKey: 'village_level', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 여정', prerequisite: 'master_village_level_40', rewardLabel: '마을 연대기 명찰', order: 350 },
];

/** 여섯 장의 실제 활동을 모두 엮은 진로 완주 퀘스트. 보상은 프로필 한마디와 연결되는 영웅 배지다. */
export const ADVENTURE_PATH_COMPLETION_QUESTS: QuestDef[] = [
  { id: 'master_adventure_path_style', name: '오늘의 나를 수집하는 사람', desc: '골목 아틀리에 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_style_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 골목 아틀리에', prerequisite: 'story_style', rewardLabel: '아틀리에 디렉터 금장', order: 360 },
  { id: 'master_adventure_path_home', name: '살림에 이야기를 담는 사람', desc: '장면을 짓는 집주인 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_home_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 홈스테드', prerequisite: 'story_cozy_home', rewardLabel: '홈 디렉터 금장 키태그', order: 361 },
  { id: 'master_adventure_path_companion', name: '작은 신호를 오래 기억하는 사람', desc: '다정한 동행 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_companion_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 동행 기록', prerequisite: 'story_pet_play', rewardLabel: '평생 동행 발자국 휘장', order: 362 },
  { id: 'master_adventure_path_neighbor', name: '이름과 약속을 잊지 않는 사람', desc: '골목 인연지기 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_neighbor_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 이웃 인연', prerequisite: 'story_neighbor_circle', rewardLabel: '홍대 인연 수첩 금장', order: 363 },
  { id: 'master_adventure_path_maker', name: '심고 낚고 요리하는 사람', desc: '계절 없는 생활 장인 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_maker_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 생활 공방', prerequisite: 'story_garden_seed', rewardLabel: '골목 저녁 장인 휘장', order: 364 },
  { id: 'master_adventure_path_explorer', name: '기분 따라 다른 길을 걷는 사람', desc: '엽서를 모으는 탐험가 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_explorer_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 골목 탐험', prerequisite: 'intro_map', rewardLabel: '열두 장면 탐험 핀', order: 365 },
  { id: 'master_adventure_path_collector', name: '작은 물건의 사연까지 모으는 사람', desc: '생활 박물관 큐레이터 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_collector_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 생활 박물관', prerequisite: 'story_claw_first', rewardLabel: '개인 소장전 황금 명패', order: 366 },
  { id: 'master_adventure_path_guardian', name: '싸움보다 관찰을 먼저 남기는 사람', desc: '외곽 생태 수호자 진로의 여섯 기록 완주하기', goal: 1, registryKey: 'adventure_path_guardian_complete', progressMode: 'max', reward: 0, category: 'mastery', location: '모험 일지 · 진로 · 외곽숲', prerequisite: 'intro_hunt', rewardLabel: '외곽숲 생태 연대기 휘장', order: 367 },
];

export const VILLAGE_LEVEL_MEMORY_QUESTS: QuestDef[] = [
  { id: 'story_level_memory_first', name: '레벨이 한 장면이 되는 날', desc: '처음 도달한 주요 레벨의 성장 장면 보존하기', goal: 1, registryKey: 'village_level_memories', progressMode: 'max', reward: 0, category: 'story', location: '모험 일지 · 여정 · 레벨업 장면 앨범', prerequisite: 'master_village_level_5', rewardLabel: '첫 레벨 추억 필름', order: 368 },
  { id: 'collect_level_memory_domains_6', name: '여섯 취향으로 자란 한 사람', desc: '레벨업 장면에 여섯 생활 취향 모두 남기기', goal: 6, registryKey: 'village_level_memory_domains', progressMode: 'max', reward: 0, category: 'collection', location: '레벨업 장면 앨범 · 여섯 주요 레벨', prerequisite: 'story_level_memory_first', rewardLabel: '다취향 성장 앨범 배지', order: 369 },
  { id: 'master_level_memories_6', name: '쉰 레벨의 여섯 장면', desc: 'Lv.5·10·20·30·40·50 성장 장면 모두 보존하기', goal: 6, registryKey: 'village_level_memories', progressMode: 'max', reward: 0, category: 'mastery', location: '레벨업 장면 앨범 · 전권', prerequisite: 'story_level_memory_first', rewardLabel: '마을 성장 장면 감독 휘장', order: 370 },
];

export const ALL_QUESTS: QuestDef[] = [
  ...ONBOARDING_QUESTS,
  ...DAILY_QUESTS,
  ...STORY_QUESTS,
  ...SHOP_QUESTS,
  ...JOURNEY_REWARD_QUESTS,
  ...RESIDENT_STORY_QUESTS,
  ...COLLECTION_QUESTS,
  ...MASTERY_QUESTS,
  ...NEIGHBORHOOD_TOUR_QUESTS,
  ...NEIGHBORHOOD_MUSEUM_QUESTS,
  ...VILLAGE_REQUEST_STORY_QUESTS,
  ...REQUEST_STORY_REWARD_QUESTS,
  ...TASTE_SET_QUESTS,
  ...RESIDENT_RENDEZVOUS_QUESTS,
  ...RESIDENT_LETTER_QUESTS,
  ...RESIDENT_FANBOOK_QUESTS,
  ...RESIDENT_ROOM_CARE_QUESTS,
  ...ADVENTURE_ROLE_QUESTS,
  ...ADVENTURE_COMFORT_QUESTS,
  ...NEIGHBORHOOD_MARKET_QUESTS,
  ...VILLAGE_PROFILE_QUESTS,
  ...VILLAGE_SEARCH_QUESTS,
  ...STARTER_COMPASS_QUESTS,
  ...STARTER_MENTOR_QUESTS,
  ...MONSTER_RESEARCH_QUESTS,
  ...SIGNATURE_CLOSET_QUESTS,
  ...CHARACTER_ZINE_QUESTS,
  ...HOBBY_CLUB_FAN_QUESTS,
  ...FESTIVAL_ARCHIVE_QUESTS,
  ...PET_SIGNAL_QUESTS,
  ...PET_PERFORMANCE_QUESTS,
  ...PET_STYLE_STUDIO_QUESTS,
  ...PET_STYLE_PROFILE_QUESTS,
  ...PET_MEET_QUESTS,
  ...PET_MEMORY_WALL_QUESTS,
  ...SESSION_PLANNER_QUESTS,
  ...FAN_MERCH_QUESTS,
  ...FAN_ROOM_QUESTS,
  ...VILLAGE_CHRONICLE_QUESTS,
  ...DAILY_INVITATION_QUESTS,
  ...NEIGHBOR_CHEER_QUESTS,
  ...NEIGHBOR_HOME_TOUR_QUESTS,
  ...HOME_GUESTBOOK_QUESTS,
  ...HOME_LAYOUT_QUESTS,
  ...HOME_STUDIO_CARD_QUESTS,
  ...OBJECT_STORY_QUESTS,
  ...NEIGHBORHOOD_ATMOSPHERE_QUESTS,
  ...NEIGHBORHOOD_DISTRICT_QUESTS,
  ...ALLEY_SECRET_QUESTS,
  ...VILLAGE_LEVEL_QUESTS,
  ...ADVENTURE_PATH_COMPLETION_QUESTS,
  ...VILLAGE_LEVEL_MEMORY_QUESTS,
];

export const QUEST_BY_ID = new Map(ALL_QUESTS.map((q) => [q.id, q]));
