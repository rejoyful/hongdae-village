import type { QuestState } from '../questProgress';

export type TasteDomainId = 'style' | 'home' | 'companion' | 'garden' | 'culinary' | 'fishing' | 'community' | 'adventure';

export interface TasteMetricDef {
  key: string;
  label: string;
  goal: number;
  location: string;
}

export interface TasteDomainDef {
  id: TasteDomainId;
  mark: string;
  name: string;
  title: string;
  description: string;
  metrics: readonly TasteMetricDef[];
}

export interface TasteMetricView extends TasteMetricDef {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface TasteDomainView extends Omit<TasteDomainDef, 'metrics'> {
  metrics: TasteMetricView[];
  completed: number;
  progressPct: number;
  rank: string;
}

export interface TasteProfileView {
  domains: TasteDomainView[];
  favorite: TasteDomainView;
  overallPct: number;
  completedMetrics: number;
  totalMetrics: number;
  nextMetric: TasteMetricView | null;
}

export const TASTE_DOMAINS: readonly TasteDomainDef[] = [
  {
    id: 'style', mark: '옷', name: '패션', title: '골목 스타일 편집자',
    description: '희귀 스타일과 룩북의 서로 다른 코디를 기록합니다.',
    metrics: [
      { key: 'rare_styles', label: '희귀 스타일', goal: 10, location: '아틀리에 · 스타일 도감' },
      { key: 'lookbook_entries', label: '룩북 의뢰', goal: 12, location: '아틀리에 · 골목 룩북' },
      { key: 'lookbook_stars', label: '룩북 최고 별', goal: 36, location: '아틀리에 · 골목 룩북' },
      { key: 'taste_sets_unlocked', label: '통합 취향 세트', goal: 28, location: '가이드북 · 취향 세트' },
      { key: 'photo_cards_featured', label: '최애 포토카드', goal: 3, location: '네컷 작업실 · 포토카드' },
      { key: 'village_profile_frames', label: '마을 명함 프레임', goal: 6, location: '접속자 목록 · 나 · 마을 명함' },
    ],
  },
  {
    id: 'home', mark: '집', name: '집 꾸미기', title: '생활 공간 큐레이터',
    description: '가구 종류, 리폼 조합과 집들이 장면을 한 방에 쌓습니다.',
    metrics: [
      { key: 'home_unique_items', label: '서로 다른 가구', goal: 20, location: '내 집 · 인테리어 수첩' },
      { key: 'furniture_reform_combos', label: '리폼 조합', goal: 48, location: '내 집 · 리폼 공방' },
      { key: 'home_visits', label: '집들이 추억', goal: 10, location: '내 집 · 방문 앨범' },
      { key: 'home_moodboard_stamps', label: '홈 무드보드 도장', goal: 12, location: '내 집 · 홈 무드보드 연구실' },
      { key: 'pet_home_personalities', label: '집 반응 성격', goal: 6, location: '내 집 · 동행의 자리' },
      { key: 'taste_showcase_home_entries', label: '집 전시 주제', goal: 4, location: '골목 취향 전시회 · 사는 취향' },
    ],
  },
  {
    id: 'companion', mark: '펫', name: '동행', title: '골목 동행 아카이비스트',
    description: '입양한 친구, 산책 장식과 코스별 기념 도장을 모읍니다.',
    metrics: [
      { key: 'pets_owned', label: '동행 친구', goal: 11, location: '펫샵 · 가족 목록' },
      { key: 'pet_accessories', label: '펫 장식', goal: 21, location: '펫샵 · 장식 도감' },
      { key: 'pet_outing_stamps', label: '산책 기념 도장', goal: 24, location: '펫샵 · 산책 수첩' },
      { key: 'pet_home_memories', label: '집 생활 추억', goal: 18, location: '내 집 · 동행의 자리' },
      { key: 'taste_showcase_pet_entries', label: '동행 전시 주제', goal: 4, location: '골목 취향 전시회 · 함께하는 취향' },
    ],
  },
  {
    id: 'garden', mark: '잎', name: '도시 정원', title: '옥상 식물 기록가',
    description: '열두 식물과 서로 다른 성장 결을 표본함에 보존합니다.',
    metrics: [
      { key: 'garden_species', label: '수확 식물', goal: 12, location: '정원 · 씨앗 서랍' },
      { key: 'garden_specimens', label: '성장 결 표본', goal: 36, location: '정원 · 표본함' },
    ],
  },
  {
    id: 'culinary', mark: '접', name: '골목 요리', title: '모퉁이 메뉴 편집자',
    description: '정원 재료의 메뉴와 성장 결별 플레이팅을 기록합니다.',
    metrics: [
      { key: 'cooking_recipes', label: '완성 메뉴', goal: 12, location: '골목 주방 · 메뉴 카드' },
      { key: 'cooking_plates', label: '플레이팅 기록', goal: 36, location: '골목 주방 · 접시 노트' },
    ],
  },
  {
    id: 'fishing', mark: '물', name: '물정원', title: '도심 수로 연구가',
    description: '세 물가의 생물과 동·은·금 크기 기록을 채웁니다.',
    metrics: [
      { key: 'fishing_species', label: '물가 생물', goal: 18, location: '낚시 수첩 · 생물 기록' },
      { key: 'fishing_stamps', label: '크기 도장', goal: 54, location: '낚시 수첩 · 크기 기록' },
    ],
  },
  {
    id: 'community', mark: '인', name: '이웃', title: '골목 관계 기록가',
    description: '이름을 기억한 주민과 가장 깊어진 신뢰를 기록합니다.',
    metrics: [
      { key: 'residents_met', label: '만난 주민', goal: 10, location: '주민 수첩 · 인연 지도' },
      { key: 'resident_trust_max', label: '최고 신뢰도', goal: 100, location: '주민 수첩 · 관계 앨범' },
      { key: 'resident_rendezvous_scenes', label: '주민 약속 장면', goal: 30, location: '주민 수첩 · 주민 약속' },
      { key: 'resident_rendezvous_completed', label: '완결한 주민 인연', goal: 10, location: '주민 수첩 · 약속 전집' },
      { key: 'resident_fan_favorites', label: '나의 응원석', goal: 3, location: '주민 수첩 · 최애 팬북' },
      { key: 'resident_fan_ribbons', label: '영구 응원 리본', goal: 50, location: '주민 수첩 · 응원 리본 전집' },
      { key: 'village_profile_badges', label: '명함 대표 배지', goal: 3, location: '마을 명함 · 대표 배지' },
      { key: 'hobby_club_chapters', label: '동아리 발간 장', goal: 30, location: '골목 동아리 · 발간 페이지' },
      { key: 'hobby_club_societies', label: '활동 동아리', goal: 6, location: '골목 동아리 · 여섯 모임' },
      { key: 'hobby_club_stamps', label: '동아리 생활 기록', goal: 90, location: '골목 동아리 · 조건 기록' },
      { key: 'hobby_club_fan_pieces', label: '동아리 응원 키트', goal: 30, location: '골목 동아리 · 응원 키트와 아지트' },
      { key: 'hobby_club_complete_kits', label: '완성한 응원 키트', goal: 6, location: '골목 동아리 · 여섯 아지트' },
      { key: 'hobby_club_featured', label: '대표 아지트 전시', goal: 3, location: '골목 동아리 · 대표 아지트' },
      { key: 'hobby_club_room_replays', label: '아지트 장면 다시 보기', goal: 20, location: '골목 동아리 · 최애 아지트' },
      { key: 'starter_mentor_chapters', label: '첫 생활 성장 장', goal: 18, location: '모험 일지 · 첫 생활 연대기' },
      { key: 'starter_mentor_routes', label: '완주한 멘토 루트', goal: 6, location: '첫 생활 연대기 · 여섯 루트' },
      { key: 'starter_mentor_featured', label: '대표 성장 장면', goal: 3, location: '첫 생활 연대기 · 대표 장면' },
      { key: 'starter_mentor_replays', label: '다시 펼친 성장 장면', goal: 30, location: '첫 생활 연대기 · 장면 재생' },
      { key: 'community_project_phases', label: '함께짓기 완성 단계', goal: 20, location: '골목 함께짓기 · 단계 연표' },
      { key: 'community_project_contributions', label: '공동 생활 기여', goal: 80, location: '골목 함께짓기 · 생활 기여' },
      { key: 'neighborhood_tour_postcards', label: '소풍 완주 엽서', goal: 12, location: '골목 소풍 안내소 · 완주 엽서함' },
      { key: 'neighborhood_tour_moods', label: '소풍 기분 색인', goal: 6, location: '골목 소풍 안내소 · 기분 색인' },
      { key: 'village_request_story_chapters', label: '연속 의뢰 이야기', goal: 24, location: '골목 의뢰소 · 연속 이야기' },
      { key: 'village_request_story_routes', label: '완결한 골목 편지', goal: 8, location: '골목 의뢰소 · 완결 편지함' },
      { key: 'market_categories', label: '장터 교환 분류', goal: 6, location: '골목 나눔장터 · 분류 도감' },
      { key: 'market_unique_items', label: '장터 교환 물건', goal: 10, location: '골목 나눔장터 · 물건 도감' },
      { key: 'market_exchanges', label: '이웃 장터 교환', goal: 30, location: '골목 나눔장터 · 영구 수첩' },
    ],
  },
  {
    id: 'adventure', mark: '탐', name: '탐험', title: '외곽 생태 수집가',
    description: '외곽숲의 생태와 골목에서 복원한 보물을 수집합니다.',
    metrics: [
      { key: 'monster_species', label: '몬스터 생태', goal: 30, location: '가이드북 · 몬스터 연구' },
      { key: 'treasures_owned', label: '복원 보물', goal: 5, location: '보물 도감 · 진열장' },
      { key: 'neighborhood_museum_exhibits', label: '생활 기념품', goal: 24, location: '골목 작은 박물관 · 기념품 수첩' },
      { key: 'neighborhood_museum_featured', label: '대표 진열', goal: 6, location: '골목 작은 박물관 · 대표 진열' },
      { key: 'adventure_roles_tried', label: '사용한 원정 역할', goal: 4, location: '골목 원정 키트 · 역할 수첩' },
      { key: 'adventure_kits_saved', label: '저장한 원정 세팅', goal: 3, location: '골목 원정 키트 · 세팅 보관함' },
    ],
  },
] as const;

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.floor(value) : 0;

const rankFor = (pct: number): string => {
  if (pct >= 100) return '도감 완성';
  if (pct >= 75) return '아카이비스트';
  if (pct >= 50) return '큐레이터';
  if (pct >= 25) return '수집가';
  if (pct > 0) return '첫 기록';
  return '새 페이지';
};

/** 평생 기록의 실제 값만 읽는 결정적 취향 프로필. 호출해도 저장값을 변경하지 않는다. */
export function tasteProfile(state: QuestState): TasteProfileView {
  const counts = state.lifetimeCounts ?? {};
  const domains = TASTE_DOMAINS.map((domain): TasteDomainView => {
    const metrics = domain.metrics.map((metric): TasteMetricView => {
      const current = cleanCount(counts[metric.key]);
      return {
        ...metric,
        current,
        complete: current >= metric.goal,
        progressPct: Math.round((Math.min(current, metric.goal) / metric.goal) * 100),
      };
    });
    const progressPct = Math.round(metrics.reduce((sum, metric) => sum + metric.progressPct, 0) / metrics.length);
    return {
      ...domain,
      metrics,
      completed: metrics.filter((metric) => metric.complete).length,
      progressPct,
      rank: rankFor(progressPct),
    };
  });
  const favorite = [...domains].sort((a, b) => b.progressPct - a.progressPct || b.completed - a.completed)[0]!;
  const metrics = domains.flatMap((domain) => domain.metrics);
  const nextMetric = [...metrics]
    .filter((metric) => !metric.complete)
    .sort((a, b) => b.progressPct - a.progressPct || a.goal - b.goal)[0] ?? null;
  return {
    domains,
    favorite,
    overallPct: Math.round(metrics.reduce((sum, metric) => sum + metric.progressPct, 0) / metrics.length),
    completedMetrics: metrics.filter((metric) => metric.complete).length,
    totalMetrics: metrics.length,
    nextMetric,
  };
}
