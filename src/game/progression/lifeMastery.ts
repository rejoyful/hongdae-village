import type { QuestState } from '../questProgress';

export type LifeMasteryId =
  | 'exploration'
  | 'style'
  | 'home'
  | 'companion'
  | 'community'
  | 'performer'
  | 'gardener'
  | 'culinary'
  | 'angler'
  | 'adventure';

export interface MasterySource {
  key: string;
  xp: number;
  offset?: number;
}

export interface MasteryObjective {
  key: string;
  goal: number;
  label: string;
  location: string;
}

export interface LifeMasteryDef {
  id: LifeMasteryId;
  mark: string;
  name: string;
  description: string;
  reward: string;
  sources: readonly MasterySource[];
  objectives: readonly MasteryObjective[];
}

export interface MasteryActionView extends MasteryObjective {
  current: number;
}

export interface LifeMasteryView extends LifeMasteryDef {
  xp: number;
  level: number;
  rank: string;
  levelXp: number;
  levelGoal: number;
  progressPct: number;
  objectivesDone: number;
  nextAction: MasteryActionView | null;
}

/** 누적 경험치 기준. Lv.5부터 각 분야의 전용 배지 퀘스트가 완료된다. */
export const LIFE_MASTERY_THRESHOLDS = [0, 60, 150, 280, 450, 680, 950, 1_260, 1_620, 2_040] as const;

export const LIFE_MASTERIES: readonly LifeMasteryDef[] = [
  {
    id: 'exploration', mark: '탐', name: '골목 탐험',
    description: '지도와 숲길을 누비며 숨은 장소와 생활 풍경을 기록합니다.',
    reward: '골목 길잡이 휘장',
    sources: [
      { key: 'q_forest', xp: 1 }, { key: 'sparkle_collect', xp: 20 }, { key: 'open_map', xp: 8 },
      { key: 'photo_taken', xp: 30 }, { key: 'photo_backdrops', xp: 45 },
      { key: 'visit_company', xp: 25 }, { key: 'visit_shop', xp: 10 },
      { key: 'neighborhood_tour_stops', xp: 10 }, { key: 'neighborhood_tour_postcards', xp: 70 },
      { key: 'neighborhood_museum_clues', xp: 5 }, { key: 'neighborhood_museum_exhibits', xp: 120 },
      { key: 'chronicle_routes', xp: 30 }, { key: 'chronicle_pages', xp: 100 },
      { key: 'chronicle_motifs', xp: 70 }, { key: 'chronicle_featured', xp: 45 },
      { key: 'collection_shelf_targets', xp: 28 }, { key: 'collection_shelf_kinds', xp: 90 },
      { key: 'collection_shelf_completed', xp: 65 },
      { key: 'atmosphere_visits', xp: 8 }, { key: 'atmosphere_observed', xp: 110 },
      { key: 'atmosphere_featured', xp: 75 }, { key: 'atmosphere_replays', xp: 12 },
      { key: 'starter_mentor_chapters', xp: 42 }, { key: 'starter_mentor_routes', xp: 135 },
      { key: 'starter_mentor_featured', xp: 70 }, { key: 'starter_mentor_replays', xp: 7 },
    ],
    objectives: [
      { key: 'open_map', goal: 1, label: '지도를 열어 마을 구조 살펴보기', location: '하단 지도 또는 M' },
      { key: 'sparkle_collect', goal: 10, label: '골목의 반짝임 10번 발견하기', location: '골목·광장·숲길' },
      { key: 'q_forest', goal: 180, label: '숲길에서 누적 3분 산책하기', location: '경의선 숲길' },
      { key: 'photo_taken', goal: 3, label: '서로 다른 날의 추억 사진 남기기', location: '네컷 작업실' },
      { key: 'neighborhood_tour_postcards', goal: 6, label: '기분에 맞는 소풍 엽서 6장 기록하기', location: '중앙 광장 · 골목 소풍 안내소' },
      { key: 'neighborhood_tour_postcards', goal: 12, label: '열두 소풍 코스의 엽서함 완성하기', location: '골목 소풍 안내소 · 완주 엽서함' },
      { key: 'neighborhood_museum_exhibits', goal: 8, label: '여덟 갈래 생활 기념품 수령하기', location: '골목 작은 박물관' },
      { key: 'neighborhood_museum_exhibits', goal: 24, label: '박물관 기념품 24점 모두 보존하기', location: '골목 작은 박물관 · 전권 소장 기록' },
      { key: 'chronicle_pages', goal: 4, label: '메인 연대기 원고 4장 보존하기', location: '모험 일지 · 메인' },
      { key: 'chronicle_pages', goal: 8, label: '홍대마을 메인 연대기 전권 완성하기', location: '모험 일지 · 메인 원고 목차' },
      { key: 'collection_shelf_targets', goal: 1, label: '첫 수집 목표를 선반에 담기', location: '가이드북 · 나의 수집 선반' },
      { key: 'collection_shelf_kinds', goal: 4, label: '서로 다른 네 수집 분야 함께 추적하기', location: '가이드북 · 통합 도감' },
      { key: 'collection_shelf_completed', goal: 8, label: '여덟 칸 수집 목표 완성하기', location: '가이드북 · 나의 수집 선반' },
      { key: 'atmosphere_observed', goal: 2, label: '두 번째 골목 하늘 영구 관측하기', location: '골목 분위기 관측소' },
      { key: 'atmosphere_observed', goal: 8, label: '여덟 골목 분위기의 연감 완성하기', location: '골목 분위기 관측소 · 전권' },
      { key: 'atmosphere_featured', goal: 3, label: '대표 하늘 세 장 간직하기', location: '골목 분위기 관측소 · 대표 하늘' },
      { key: 'atmosphere_replays', goal: 20, label: '좋아하는 골목 연출 20번 다시 부르기', location: '골목 분위기 관측소 · 월드 연출' },
      { key: 'starter_mentor_chapters', goal: 6, label: '첫 생활 멘토 성장 장 여섯 장 보존하기', location: '모험 일지 · 추천 · 첫 생활 연대기' },
      { key: 'starter_mentor_routes', goal: 6, label: '여섯 첫 생활 멘토 루트 완주하기', location: '첫 생활 연대기 · 18장 전권' },
      { key: 'starter_mentor_featured', goal: 3, label: '나를 만든 성장 장면 세 장 전시하기', location: '첫 생활 연대기 · 대표 성장 장면' },
      { key: 'starter_mentor_replays', goal: 30, label: '좋아하는 첫 생활 장면 30번 다시 보기', location: '첫 생활 연대기 · 장면 재생' },
    ],
  },
  {
    id: 'style', mark: '패', name: '패션 감각',
    description: '코디를 만들고 염색과 희귀 스타일을 연구합니다.',
    reward: '아틀리에 감별사 휘장',
    sources: [
      { key: 'customize_save', xp: 25 }, { key: 'closet_save', xp: 30 }, { key: 'fashion_preset', xp: 20 },
      { key: 'fashion_dye', xp: 18 }, { key: 'rare_styles', xp: 90 }, { key: 'photo_frames', xp: 55 },
      { key: 'lookbook_submissions', xp: 14 }, { key: 'lookbook_entries', xp: 55 },
      { key: 'lookbook_stars', xp: 16 }, { key: 'lookbook_perfect', xp: 80 }, { key: 'lookbook_unique', xp: 22 },
      { key: 'closet_saved_slots', xp: 35 }, { key: 'closet_featured_slots', xp: 70 },
      { key: 'closet_style_identities', xp: 95 },
      { key: 'taste_sets_unlocked', xp: 60 }, { key: 'taste_sets_featured', xp: 45 },
      { key: 'photo_card_edits', xp: 18 }, { key: 'photo_cards_featured', xp: 85 },
      { key: 'village_profile_frames', xp: 90 }, { key: 'village_profile_badges', xp: 55 },
      { key: 'hobby_club_style_rank', xp: 130 },
      { key: 'character_episode_archived', xp: 38 }, { key: 'character_episode_kinds', xp: 85 },
      { key: 'character_episode_characters', xp: 90 }, { key: 'character_episode_featured', xp: 55 },
      { key: 'character_episode_replays', xp: 10 },
    ],
    objectives: [
      { key: 'customize_save', goal: 1, label: '첫 코디를 완성해 저장하기', location: '캐릭터 아틀리에' },
      { key: 'closet_save', goal: 3, label: '나만의 코디를 옷장 3칸에 기록하기', location: '아틀리에 · 옷장' },
      { key: 'rare_styles', goal: 3, label: '모험 배지로 희귀 스타일 3종 열기', location: '아틀리에 · 도감' },
      { key: 'fashion_preset', goal: 12, label: '테마 코디를 누적 12번 입어보기', location: '아틀리에 · 옷장' },
      { key: 'lookbook_entries', goal: 6, label: '서로 다른 코디 의뢰 6장 기록하기', location: '아틀리에 · 골목 룩북' },
      { key: 'lookbook_perfect', goal: 3, label: '의뢰 세 장을 최고 별로 완성하기', location: '골목 룩북 · 코디 의뢰서' },
      { key: 'closet_featured_slots', goal: 3, label: '대표 코디 전시 세 칸 채우기', location: '마을 명함 · 대표 코디 전시' },
      { key: 'closet_style_identities', goal: 8, label: '여덟 스타일 정체성을 모두 기록하기', location: '아틀리에 · 픽셀 코디 아카이브' },
      { key: 'taste_sets_unlocked', goal: 7, label: '코디·동행·집이 이어진 취향 세트 7개 모으기', location: '가이드북 · 취향 세트' },
      { key: 'taste_sets_featured', goal: 3, label: '좋아하는 취향 세트 3개 대표 전시하기', location: '가이드북 · 취향 세트' },
      { key: 'photo_cards_featured', goal: 3, label: '최애 포토카드 세 장을 대표 장면으로 전시하기', location: '네컷 작업실 · 포토카드' },
      { key: 'village_profile_frames', goal: 6, label: '생활 명함 프레임 6종 모두 열기', location: '마을 명함 · 생활 프레임' },
      { key: 'hobby_club_style_rank', goal: 5, label: '골목 옷결 연구회 다섯 장 발간하기', location: '골목 동아리 · 옷결 연구회' },
      { key: 'character_episode_archived', goal: 1, label: '첫 OC 에피소드 장면 보존하기', location: '캐릭터 설정집 · 에피소드 보드' },
      { key: 'character_episode_kinds', goal: 8, label: '여덟 캐릭터 사건 도감 완성하기', location: '캐릭터 에피소드 보드 · 8개 사건' },
      { key: 'character_episode_characters', goal: 3, label: '세 OC에게 서로 다른 장면 남기기', location: '캐릭터 에피소드 보드 · 주인공 색인' },
      { key: 'character_episode_replays', goal: 20, label: '좋아하는 주인공 장면 20번 다시 걷기', location: '캐릭터 에피소드 보드 · 장면 재생' },
    ],
  },
  {
    id: 'home', mark: '집', name: '공간 꾸미기',
    description: '가구의 종류와 테마 균형을 연구해 나만의 집을 만듭니다.',
    reward: '생활 공간 장인 휘장',
    sources: [
      { key: 'visit_home', xp: 12 }, { key: 'q_place', xp: 12 }, { key: 'home_unique_items', xp: 25 },
      { key: 'home_categories', xp: 45 }, { key: 'home_theme_power', xp: 55 }, { key: 'home_score', xp: 3 },
      { key: 'home_visits', xp: 90 }, { key: 'home_pet_visits', xp: 110 },
      { key: 'neighbor_home_tours', xp: 22 }, { key: 'neighbor_homes_visited', xp: 70 },
      { key: 'neighbor_home_themes', xp: 95 }, { key: 'neighbor_home_types', xp: 105 },
      { key: 'neighbor_home_favorites', xp: 85 },
      { key: 'home_open_public', xp: 65 }, { key: 'home_guestbook_sent', xp: 18 },
      { key: 'home_guestbook_received', xp: 24 }, { key: 'home_guestbook_visitors', xp: 65 },
      { key: 'home_layout_slots', xp: 90 }, { key: 'home_layout_saves', xp: 14 },
      { key: 'home_layout_applies', xp: 18 }, { key: 'home_layout_scenes', xp: 105 },
      { key: 'home_layout_items', xp: 22 },
      { key: 'home_studio_cards', xp: 100 }, { key: 'home_studio_captures', xp: 18 },
      { key: 'home_studio_moods', xp: 95 }, { key: 'home_studio_pet_cards', xp: 45 },
      { key: 'home_studio_featured', xp: 80 },
      { key: 'object_story_items', xp: 28 }, { key: 'object_story_chapters', xp: 135 },
      { key: 'object_story_favorites', xp: 75 }, { key: 'object_story_inspections', xp: 7 },
      { key: 'home_moodboard_stamps', xp: 120 }, { key: 'home_moodboard_items', xp: 16 },
      { key: 'home_aquarium_active', xp: 160 },
      { key: 'furniture_reform_saves', xp: 14 }, { key: 'furniture_reform_combos', xp: 55 },
      { key: 'furniture_reform_finishes', xp: 80 }, { key: 'furniture_reform_colors', xp: 65 },
      { key: 'furniture_reformed_items', xp: 20 },
      { key: 'furniture_craft_total', xp: 30 }, { key: 'furniture_craft_recipes', xp: 70 },
      { key: 'weekly_furniture_unique', xp: 45 }, { key: 'visit_workshop', xp: 15 },
      { key: 'pet_home_memories', xp: 55 }, { key: 'pet_home_personalities', xp: 75 },
      { key: 'taste_showcase_home_entries', xp: 65 }, { key: 'taste_showcase_home_stamps', xp: 24 },
      { key: 'hobby_club_home_rank', xp: 130 },
    ],
    objectives: [
      { key: 'visit_home', goal: 1, label: '내 집에 처음 들어가기', location: '주택가 · 내 집' },
      { key: 'q_place', goal: 10, label: '가구를 누적 10개 배치하기', location: '내 집 꾸미기 모드' },
      { key: 'home_categories', goal: 5, label: '서로 다른 가구 분류 5종 놓기', location: '내 집 · 홈 스타일' },
      { key: 'home_unique_items', goal: 20, label: '서로 다른 가구 20종 전시하기', location: '가구점과 내 집' },
      { key: 'visit_workshop', goal: 1, label: '골목 DIY 작업대 둘러보기', location: '살림 아틀리에 앞 작업대' },
      { key: 'furniture_craft_total', goal: 1, label: 'DIY 작업대에서 첫 가구 만들기', location: '살림 가구 · DIY 작업대' },
      { key: 'furniture_craft_recipes', goal: 6, label: '서로 다른 DIY 설계도 6종 완성하기', location: '살림 가구 · DIY 작업일지' },
      { key: 'weekly_furniture_unique', goal: 4, label: '주간 큐레이션 가구 4종 기록하기', location: '살림 가구 · 4주 순환 수첩' },
      { key: 'furniture_reform_combos', goal: 12, label: '서로 다른 가구 리폼 조합 12칸 기록하기', location: '내 집 · 가구 리폼 공방' },
      { key: 'furniture_reform_combos', goal: 48, label: '마감과 색감 48조합 모두 기록하기', location: '가구 리폼 공방 · 조합 도감' },
      { key: 'home_visits', goal: 5, label: '주민 5명의 집들이 추억 남기기', location: '내 집 · 방문 앨범' },
      { key: 'neighbor_home_favorites', goal: 6, label: '이웃집 최애 투어 엽서 6장 보존하기', location: '나의 마을 명함 · 투어 수첩' },
      { key: 'home_guestbook_received', goal: 1, label: '내 집 방명록에 첫 집들이 스티커 맞이하기', location: '내 집 · 우리 집 방명록' },
      { key: 'home_guestbook_visitors', goal: 10, label: '서로 다른 이웃 10명의 집들이 마음 맞이하기', location: '내 집 · 열린 집 방명록' },
      { key: 'home_layout_slots', goal: 3, label: '서로 다른 홈 장면 슬롯 3칸 채우기', location: '내 집 · 홈 장면 보관함' },
      { key: 'home_layout_scenes', goal: 6, label: '배치가 다른 홈 장면 6개 보존하기', location: '홈 장면 보관함 · 픽셀 미니어처' },
      { key: 'home_layout_items', goal: 30, label: '저장 장면에서 서로 다른 가구 30종 기록하기', location: '홈 장면 보관함 · 장면 도감' },
      { key: 'home_studio_cards', goal: 3, label: '홈 스튜디오 엽서 슬롯 3칸 채우기', location: '내 집 · 홈 스튜디오 엽서' },
      { key: 'home_studio_moods', goal: 6, label: '여섯 홈 스튜디오 무드 모두 기록하기', location: '홈 스튜디오 엽서 · 여섯 무드' },
      { key: 'home_studio_featured', goal: 3, label: '대표 홈 엽서 세 장을 마을 명함에 전시하기', location: '나의 마을 명함 · 대표 홈 엽서' },
      { key: 'object_story_items', goal: 15, label: '서로 다른 물건 이야기 15점 발견하기', location: '내 집 · 물건의 속삭임 도감' },
      { key: 'object_story_chapters', goal: 4, label: '물건 이야기 테마 장 4편 완성하기', location: '물건의 속삭임 도감 · 아홉 장' },
      { key: 'object_story_favorites', goal: 9, label: '나를 설명하는 최애 물건 9점 진열하기', location: '물건의 속삭임 도감 · 최애 선반' },
      { key: 'home_moodboard_stamps', goal: 4, label: '홈 무드보드 장면 4개 완성하기', location: '내 집 · 홈 무드보드 연구실' },
      { key: 'home_moodboard_stamps', goal: 12, label: '열두 가지 홈 무드보드 도장 모두 모으기', location: '홈 무드보드 연구실 · 완성 도감' },
      { key: 'pet_home_memories', goal: 9, label: '동행 펫의 서로 다른 집 추억 9개 기록하기', location: '내 집 · 동행의 자리' },
      { key: 'taste_showcase_home_entries', goal: 4, label: '집 전시 주제 네 장에 현재 방 기록하기', location: '골목 취향 전시회 · 사는 취향' },
      { key: 'hobby_club_home_rank', goal: 5, label: '생활 공간 관찰부 다섯 장 발간하기', location: '골목 동아리 · 공간 관찰부' },
    ],
  },
  {
    id: 'companion', mark: '펫', name: '동행 돌봄',
    description: '펫과 돌봄·놀이·훈련을 반복하며 추억과 개인기를 쌓습니다.',
    reward: '동행 조련사 휘장',
    sources: [
      { key: 'pet_adopt', xp: 50 }, { key: 'pet_feed', xp: 20 }, { key: 'pet_play', xp: 25 },
      { key: 'pet_train', xp: 20 }, { key: 'pet_trick_perform', xp: 12 }, { key: 'pet_tricks', xp: 75 },
      { key: 'max_pet_affinity', xp: 4 }, { key: 'pet_memories', xp: 120 },
      { key: 'home_pet_visits', xp: 80 },
      { key: 'pet_profile_edit', xp: 18 }, { key: 'pet_accessories', xp: 75 }, { key: 'pet_personalities', xp: 55 },
      { key: 'photo_with_pet', xp: 35 },
      { key: 'pet_outings_total', xp: 16 }, { key: 'pet_outing_routes', xp: 60 },
      { key: 'pet_outing_stamps', xp: 38 }, { key: 'pet_outing_complete', xp: 90 },
      { key: 'pet_outing_partners', xp: 65 }, { key: 'pet_outing_pairings', xp: 22 },
      { key: 'pet_home_scenes', xp: 14 }, { key: 'pet_home_memories', xp: 55 },
      { key: 'pet_home_partners', xp: 70 }, { key: 'pet_home_personalities', xp: 60 },
      { key: 'pet_signals', xp: 28 }, { key: 'pet_signal_personalities', xp: 70 },
      { key: 'pet_signal_chapters', xp: 95 }, { key: 'pet_signal_responses', xp: 45 },
      { key: 'pet_signal_partners', xp: 55 }, { key: 'pet_signal_featured', xp: 35 },
      { key: 'pet_performance_rehearsals', xp: 14 }, { key: 'pet_performance_stamps', xp: 48 },
      { key: 'pet_performance_tricks', xp: 85 }, { key: 'pet_performance_complete', xp: 110 },
      { key: 'pet_performance_partners', xp: 65 }, { key: 'pet_performance_featured', xp: 35 },
      { key: 'taste_showcase_pet_entries', xp: 65 }, { key: 'taste_showcase_pet_stamps', xp: 24 },
      { key: 'hobby_club_companion_rank', xp: 130 },
    ],
    objectives: [
      { key: 'pet_adopt', goal: 1, label: '첫 동행 펫 입양하기', location: '펫샵 「멍냥이네」' },
      { key: 'pet_feed', goal: 3, label: '펫에게 누적 3번 먹이 주기', location: '펫샵 · 돌봄' },
      { key: 'pet_play', goal: 3, label: '펫과 누적 3번 놀기', location: '펫샵 · 돌봄' },
      { key: 'max_pet_affinity', goal: 100, label: '한 펫과 친밀도 100 달성하기', location: '동행과 매일의 돌봄' },
      { key: 'home_pet_visits', goal: 3, label: '펫과 주민 방문 추억 3장 남기기', location: '내 집 · 방문 앨범' },
      { key: 'pet_accessories', goal: 7, label: '펫 액세서리 7종 해금하기', location: '펫샵 · 프로필 꾸미기' },
      { key: 'pet_outing_routes', goal: 4, label: '동행 펫과 산책 코스 4곳 기록하기', location: '펫샵 · 동행 산책 수첩' },
      { key: 'pet_outing_stamps', goal: 24, label: '여덟 골목의 기념 도장 모두 모으기', location: '동행 산책 수첩 · 기념 도감' },
      { key: 'pet_home_memories', goal: 3, label: '한 성격의 집 생활 추억 3개 기록하기', location: '내 집 · 동행의 자리' },
      { key: 'pet_home_scenes', goal: 50, label: '좋아하는 가구 곁 생활 장면 50번 만나기', location: '내 집 · 동행 펫' },
      { key: 'pet_signals', goal: 8, label: '작은 몸짓 8개에 둘만의 뜻 붙이기', location: '펫샵 · 마음 번역 수첩' },
      { key: 'pet_signal_personalities', goal: 6, label: '여섯 성격의 서로 다른 몸짓 기록하기', location: '마음 번역 수첩 · 성격 도감' },
      { key: 'pet_performance_stamps', goal: 15, label: '다섯 트릭의 데뷔·대표작·앙코르 15장 모으기', location: '펫샵 · 둘만의 트릭 소극장' },
      { key: 'taste_showcase_pet_entries', goal: 4, label: '동행 전시 주제 네 장에 현재 모습 기록하기', location: '골목 취향 전시회 · 함께하는 취향' },
      { key: 'hobby_club_companion_rank', goal: 5, label: '나란한 발자국회 다섯 장 발간하기', location: '골목 동아리 · 발자국회' },
    ],
  },
  {
    id: 'community', mark: '이', name: '이웃 관계',
    description: '주민과 온라인 이웃에게 꾸준히 인사하며 신뢰를 만듭니다.',
    reward: '마을 연결자 휘장',
    sources: [
      { key: 'resident_greet', xp: 15 }, { key: 'residents_met', xp: 55 }, { key: 'resident_trust_max', xp: 4 },
      { key: 'resident_rendezvous_scenes', xp: 55 }, { key: 'resident_rendezvous_completed', xp: 140 },
      { key: 'resident_fan_favorites', xp: 60 }, { key: 'resident_fan_ribbons', xp: 32 },
      { key: 'resident_fan_residents', xp: 55 }, { key: 'resident_fan_completed', xp: 140 },
      { key: 'chat_sent', xp: 8 }, { key: 'q_emote', xp: 5 }, { key: 'online_encounter', xp: 20 },
      { key: 'neighbor_cheers_sent', xp: 30 }, { key: 'neighbor_cheers_received', xp: 30 },
      { key: 'neighbor_cheer_kinds', xp: 120 }, { key: 'neighbor_cheer_neighbors', xp: 45 },
      { key: 'neighbor_home_tours', xp: 18 }, { key: 'neighbor_homes_visited', xp: 55 },
      { key: 'home_guestbook_sent', xp: 24 }, { key: 'home_guestbook_kinds', xp: 95 },
      { key: 'home_guestbook_received', xp: 18 }, { key: 'home_guestbook_visitors', xp: 70 },
      { key: 'home_visits', xp: 45 },
      { key: 'village_requests_total', xp: 18 }, { key: 'village_request_stamps', xp: 65 },
      { key: 'village_request_categories', xp: 90 }, { key: 'village_request_rank', xp: 55 },
      { key: 'village_request_story_chapters', xp: 45 }, { key: 'village_request_story_routes', xp: 140 },
      { key: 'village_request_story_clues', xp: 8 },
      { key: 'community_project_phases', xp: 85 }, { key: 'community_project_contributions', xp: 12 },
      { key: 'shared_project_contributions', xp: 34 }, { key: 'shared_project_kinds', xp: 95 },
      { key: 'shared_project_chapters', xp: 120 },
      { key: 'hobby_club_fan_pieces', xp: 24 }, { key: 'hobby_club_complete_kits', xp: 150 },
      { key: 'hobby_club_featured', xp: 75 }, { key: 'hobby_club_room_replays', xp: 8 },
      { key: 'market_visits', xp: 8 }, { key: 'market_favorites', xp: 18 },
      { key: 'market_listings_created', xp: 28 }, { key: 'market_purchases', xp: 34 },
      { key: 'market_sales', xp: 38 }, { key: 'market_categories', xp: 95 },
      { key: 'market_unique_items', xp: 55 }, { key: 'market_exchanges', xp: 16 },
    ],
    objectives: [
      { key: 'resident_greet', goal: 1, label: '이름 있는 주민에게 먼저 인사하기', location: '마을 주민 이름표 근처' },
      { key: 'residents_met', goal: 5, label: '서로 다른 주민 5명 만나기', location: '주민 수첩' },
      { key: 'resident_trust_max', goal: 50, label: '한 주민과 신뢰도 50 만들기', location: '매일의 주민 인사' },
      { key: 'resident_rendezvous_scenes', goal: 10, label: '주민 약속 장면 10개 기록하기', location: '주민 수첩 · 주민 약속' },
      { key: 'resident_rendezvous_completed', goal: 10, label: '열 주민의 약속 앨범 완성하기', location: '주민 수첩 · 약속 전집' },
      { key: 'resident_fan_favorites', goal: 3, label: '최애·차애·마음친구 응원석 채우기', location: '주민 수첩 · 최애 팬북' },
      { key: 'resident_fan_ribbons', goal: 20, label: '응원 리본 20개 모으기', location: '주민 수첩 · 응원 리본 전시' },
      { key: 'resident_fan_completed', goal: 5, label: '다섯 주민의 평생 응원 페이지 완성하기', location: '주민 수첩 · 최애 팬북 전권' },
      { key: 'online_encounter', goal: 10, label: '온라인 이웃과 10번 마주치기', location: '온라인 마을' },
      { key: 'neighbor_cheers_sent', goal: 1, label: '이웃 명함에서 첫 취향 응원 보내기', location: '온라인 이웃 · 마을 명함' },
      { key: 'neighbor_cheers_received', goal: 1, label: '이웃 응원 우편 처음 받기', location: '나의 마을 명함 · 응원 우편함' },
      { key: 'neighbor_cheer_kinds', goal: 8, label: '여덟 종류 취향 응원 도감 완성하기', location: '마을 명함 · 영구 응원 우편함' },
      { key: 'neighbor_cheer_neighbors', goal: 10, label: '서로 다른 온라인 이웃 10명과 마음 나누기', location: '온라인 홍대마을' },
      { key: 'neighbor_homes_visited', goal: 5, label: '서로 다른 온라인 이웃집 5곳 구경하기', location: '마을 명함 · 열린 집 투어' },
      { key: 'neighbor_home_themes', goal: 6, label: '이웃집 홈 테마 6종 기록하기', location: '이웃집 투어 수첩' },
      { key: 'home_guestbook_sent', goal: 1, label: '열린 집 현관에 첫 집들이 스티커 남기기', location: '온라인 이웃 · 열린 집' },
      { key: 'home_guestbook_kinds', goal: 8, label: '집들이 스티커 여덟 마음 모두 나누기', location: '열린 집 · 집들이 스티커' },
      { key: 'home_visits', goal: 5, label: '주민 5명을 집으로 초대하기', location: '내 집 · 방문 앨범' },
      { key: 'village_requests_total', goal: 10, label: '골목 의뢰를 누적 10번 해결하기', location: '모험 일지 · 골목 의뢰소' },
      { key: 'village_request_stamps', goal: 24, label: '서로 다른 의뢰 도장 24개 모으기', location: '골목 의뢰소 · 종이 도감' },
      { key: 'village_request_story_chapters', goal: 8, label: '연속 의뢰 이야기 8장 기록하기', location: '골목 의뢰소 · 연속 이야기' },
      { key: 'village_request_story_routes', goal: 8, label: '여덟 연속 의뢰 이야기 모두 완결하기', location: '골목 의뢰소 · 완결 편지함' },
      { key: 'community_project_phases', goal: 5, label: '함께짓기 단계를 다섯 번 완성하기', location: '레코드 골목 입구 · 골목 함께짓기' },
      { key: 'community_project_phases', goal: 20, label: '다섯 공용 장소의 20단계 완성하기', location: '골목 함께짓기 · 전체 설계도' },
      { key: 'shared_project_contributions', goal: 1, label: '모두의 밤정원에 첫 마음 건네기', location: '골목 함께짓기 · LIVE 밤정원' },
      { key: 'shared_project_kinds', goal: 8, label: '여덟 종류 마음 도감 완성하기', location: '모두의 밤정원 · 마음 도감' },
      { key: 'shared_project_contributions', goal: 30, label: '서로 다른 날 30장 건네기', location: '모두의 밤정원 · 나의 기록' },
      { key: 'hobby_club_fan_pieces', goal: 12, label: '동아리 응원 키트 열두 점 해금하기', location: '골목 동아리 · 응원 키트와 아지트' },
      { key: 'hobby_club_complete_kits', goal: 6, label: '여섯 동아리 응원 키트 완성하기', location: '골목 동아리 · 여섯 아지트' },
      { key: 'hobby_club_featured', goal: 3, label: '대표 아지트 세 곳 전시하기', location: '골목 동아리 · 대표 아지트 전시' },
      { key: 'hobby_club_room_replays', goal: 20, label: '최애 아지트 장면 스무 번 다시 보기', location: '골목 동아리 · 나의 최애 아지트' },
      { key: 'market_favorites', goal: 3, label: '마음에 둔 장터 한 점 세 개 담기', location: '골목 나눔장터 · 찜 선반' },
      { key: 'market_categories', goal: 6, label: '여섯 가구 분류 교환 도감 완성하기', location: '골목 나눔장터 · 교환 수첩' },
      { key: 'market_exchanges', goal: 30, label: '이웃 장터 교환 30번 기록하기', location: '골목 나눔장터 · 영구 수첩' },
    ],
  },
  {
    id: 'performer', mark: '흥', name: '골목 생활',
    description: '알바와 공연, 미니게임과 간식 같은 홍대의 일상을 즐깁니다.',
    reward: '골목 무대 장인 휘장',
    sources: [
      { key: 'q_cafe', xp: 35 }, { key: 'q_busking', xp: 45 }, { key: 'omok_win', xp: 25 },
      { key: 'hobby_club_stage_rank', xp: 130 },
      { key: 'claw_win', xp: 30 }, { key: 'dolls_owned', xp: 80 }, { key: 'photo_taken', xp: 25 },
      { key: 'photo_album', xp: 35 }, { key: 'bungeo_eat', xp: 12 },
    ],
    objectives: [
      { key: 'q_cafe', goal: 1, label: '카페 알바 한 번 완주하기', location: '카페 「모퉁이」' },
      { key: 'q_busking', goal: 3, label: '버스킹 무대 3번 성공하기', location: '메인 스트리트' },
      { key: 'claw_win', goal: 3, label: '인형뽑기에서 3번 성공하기', location: '오락 골목' },
      { key: 'dolls_owned', goal: 6, label: '인형 6종 컬렉션 완성하기', location: '인형뽑기 컬렉션' },
      { key: 'hobby_club_stage_rank', goal: 5, label: '밤골목 생활편집부 다섯 장 발간하기', location: '골목 동아리 · 생활편집부' },
    ],
  },
  {
    id: 'gardener', mark: '원', name: '도시 정원',
    description: '씨앗을 심고 돌보며 계절 대신 세 가지 성장 결을 표본으로 기록합니다.',
    reward: '옥상 식물 연구가 휘장',
    sources: [
      { key: 'garden_planted', xp: 12 }, { key: 'garden_tend', xp: 8 },
      { key: 'garden_harvest', xp: 35 }, { key: 'garden_species', xp: 65 },
      { key: 'garden_specimens', xp: 45 },
      { key: 'hobby_club_table_rank', xp: 130 },
    ],
    objectives: [
      { key: 'garden_planted', goal: 1, label: '첫 씨앗을 빈 화분에 심기', location: '옥상 씨앗 연구소' },
      { key: 'garden_harvest', goal: 3, label: '식물 표본을 누적 3번 수확하기', location: '옥상 씨앗 연구소 · 네 화분' },
      { key: 'garden_species', goal: 6, label: '서로 다른 식물 6종 발견하기', location: '옥상 씨앗 연구소 · 씨앗 서랍' },
      { key: 'garden_specimens', goal: 18, label: '성장 결 표본 18칸 채우기', location: '옥상 씨앗 연구소 · 표본함' },
      { key: 'hobby_club_table_rank', goal: 5, label: '옥상 식탁 실험실 다섯 장 발간하기', location: '골목 동아리 · 식탁 실험실' },
    ],
  },
  {
    id: 'culinary', mark: '요', name: '골목 요리',
    description: '정원 수확물을 접시로 바꾸고 성장 결마다 다른 플레이팅 노트를 완성합니다.',
    reward: '모퉁이 셰프 휘장',
    sources: [
      { key: 'cooking_total', xp: 35 }, { key: 'cooking_recipes', xp: 70 },
      { key: 'cooking_plates', xp: 45 }, { key: 'cooking_favorites', xp: 40 },
    ],
    objectives: [
      { key: 'cooking_total', goal: 1, label: '정원 재료로 첫 접시 완성하기', location: '모퉁이 골목 주방' },
      { key: 'cooking_recipes', goal: 6, label: '서로 다른 메뉴 6종 만들기', location: '골목 주방 · 메뉴 카드' },
      { key: 'cooking_plates', goal: 18, label: '성장 결 플레이팅 18칸 채우기', location: '골목 주방 · 플레이팅 노트' },
      { key: 'cooking_total', goal: 30, label: '누적 30접시 조리하기', location: '모퉁이 골목 주방' },
    ],
  },
  {
    id: 'angler', mark: '낚', name: '물정원 낚시',
    description: '세 물가의 생물을 만나고 중복 낚시로 더 큰 크기 도장을 기록합니다.',
    reward: '도심 물결 기록가 휘장',
    sources: [
      { key: 'fishing_total', xp: 22 }, { key: 'fishing_species', xp: 65 },
      { key: 'fishing_stamps', xp: 32 }, { key: 'fishing_gold_records', xp: 85 },
      { key: 'aquarium_saves', xp: 18 }, { key: 'aquarium_displayed', xp: 55 },
      { key: 'aquarium_frames', xp: 24 }, { key: 'aquarium_substrates', xp: 24 },
      { key: 'aquarium_ornaments', xp: 24 },
      { key: 'hobby_club_water_rank', xp: 130 },
    ],
    objectives: [
      { key: 'fishing_total', goal: 1, label: '물정원에서 첫 생물 만나기', location: '물정원 낚시 수첩' },
      { key: 'fishing_species', goal: 6, label: '서로 다른 생물 6종 발견하기', location: '세 물가 · 생물 도감' },
      { key: 'fishing_stamps', goal: 27, label: '크기 기록 도장 27개 모으기', location: '낚시 수첩 · 54칸 기록' },
      { key: 'fishing_total', goal: 50, label: '누적 50번 다정한 낚시하기', location: '철길·수로·옥상 물가' },
      { key: 'hobby_club_water_rank', goal: 5, label: '도심 물결 연구소 다섯 장 발간하기', location: '골목 동아리 · 물결 연구소' },
    ],
  },
  {
    id: 'adventure', mark: '모', name: '외곽 모험',
    description: '몬스터 생태를 연구하고 장비와 전투 경험을 축적합니다.',
    reward: '외곽 개척자 휘장',
    sources: [
      { key: 'monster_kill', xp: 8 }, { key: 'monster_species', xp: 60 }, { key: 'monster_streak', xp: 15 },
      { key: 'monster_shard', xp: 2 }, { key: 'weapons_owned', xp: 60 },
      { key: 'player_level', xp: 40, offset: 1 }, { key: 'battle_tier', xp: 70, offset: 1 },
      { key: 'adventure_roles_tried', xp: 100 }, { key: 'adventure_charms_unlocked', xp: 70 },
      { key: 'adventure_kits_saved', xp: 110 },
    ],
    objectives: [
      { key: 'monster_kill', goal: 1, label: '외곽숲에서 첫 몬스터 처치하기', location: '동쪽 외곽숲' },
      { key: 'monster_kill', goal: 50, label: '몬스터 누적 50마리 처치하기', location: '외곽 사냥터' },
      { key: 'monster_species', goal: 15, label: '몬스터 15종 발견하기', location: '가이드북 · 몬스터 연구' },
      { key: 'player_level', goal: 10, label: '캐릭터 레벨 10 달성하기', location: '사냥과 마을 활동' },
      { key: 'adventure_roles_tried', goal: 4, label: '네 원정 역할 모두 사용해 보기', location: '골목 원정 키트 · 역할 수첩' },
      { key: 'adventure_charms_equipped', goal: 2, label: '원정 부적 두 개 함께 장착하기', location: '골목 원정 키트 · 부적 주머니' },
      { key: 'adventure_kits_saved', goal: 3, label: '원정 세팅 세 칸 저장하기', location: '골목 원정 키트 · 보관함' },
    ],
  },
] as const;

const clean = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export function masteryLevelForXp(xp: number): number {
  const safe = clean(xp);
  let level = 1;
  for (let i = 1; i < LIFE_MASTERY_THRESHOLDS.length; i += 1) {
    if (safe < LIFE_MASTERY_THRESHOLDS[i]!) break;
    level = i + 1;
  }
  return level;
}

export function masteryRank(level: number): string {
  if (level >= 10) return '전설';
  if (level >= 8) return '장인';
  if (level >= 6) return '숙련';
  if (level >= 4) return '익숙';
  if (level >= 2) return '견습';
  return '새싹';
}

export function masteryXp(def: LifeMasteryDef, state: QuestState): number {
  const counts = state.lifetimeCounts ?? {};
  return def.sources.reduce((total, source) => {
    const units = Math.max(0, clean(counts[source.key]) - (source.offset ?? 0));
    return total + units * source.xp;
  }, 0);
}

export function lifeMasteryViews(state: QuestState): LifeMasteryView[] {
  const counts = state.lifetimeCounts ?? {};
  return LIFE_MASTERIES.map((def) => {
    const xp = masteryXp(def, state);
    const level = masteryLevelForXp(xp);
    const currentThreshold = LIFE_MASTERY_THRESHOLDS[level - 1]!;
    const nextThreshold = LIFE_MASTERY_THRESHOLDS[level] ?? currentThreshold;
    const levelGoal = Math.max(0, nextThreshold - currentThreshold);
    const levelXp = level >= 10 ? levelGoal : Math.max(0, xp - currentThreshold);
    const nextObjective = def.objectives.find((objective) => clean(counts[objective.key]) < objective.goal);
    const nextAction = nextObjective ? { ...nextObjective, current: clean(counts[nextObjective.key]) } : null;
    return {
      ...def,
      xp,
      level,
      rank: masteryRank(level),
      levelXp,
      levelGoal,
      progressPct: level >= 10 ? 100 : Math.round((levelXp / Math.max(1, levelGoal)) * 100),
      objectivesDone: def.objectives.filter((objective) => clean(counts[objective.key]) >= objective.goal).length,
      nextAction,
    };
  });
}

export function lifeMasterySummary(state: QuestState): {
  totalLevel: number;
  minimumLevel: number;
  specialty: LifeMasteryView;
} {
  const views = lifeMasteryViews(state);
  return {
    totalLevel: views.reduce((total, view) => total + view.level, 0),
    minimumLevel: Math.min(...views.map((view) => view.level)),
    specialty: [...views].sort((a, b) => b.level - a.level || b.xp - a.xp)[0]!,
  };
}

/** 퀘스트 저장소에 넣을 파생 지표. 입력 지표만 읽으므로 반복 호출해도 값이 불어나지 않는다. */
export function lifeMasteryQuestMetrics(state: QuestState): Record<string, number> {
  const views = lifeMasteryViews(state);
  const summary = lifeMasterySummary(state);
  return {
    ...Object.fromEntries(views.map((view) => [`mastery_${view.id}_level`, view.level])),
    mastery_all_level: summary.minimumLevel,
    mastery_total_level: summary.totalLevel,
  };
}
