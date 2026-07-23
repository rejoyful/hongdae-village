import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from '../world/isometricVillageMap';

export type NeighborhoodTourId =
  | 'first_afternoon' | 'thread_walk' | 'small_room' | 'paw_steps'
  | 'rooftop_table' | 'water_notes' | 'maker_lane' | 'night_scene'
  | 'collector_loop' | 'shared_home' | 'neighbor_hands' | 'village_chronicle';

export type NeighborhoodTourMood = '처음' | '꾸미기' | '동행' | '관찰' | '만들기' | '이웃';

export interface NeighborhoodTourStop {
  key: string;
  goal: number;
  label: string;
  note: string;
  location: string;
  activity: IsoActivityKind;
}

export interface NeighborhoodTourDef {
  id: NeighborhoodTourId;
  code: string;
  mark: string;
  mood: NeighborhoodTourMood;
  duration: string;
  name: string;
  description: string;
  postcardTitle: string;
  postcardCaption: string;
  color: string;
  stops: readonly [NeighborhoodTourStop, NeighborhoodTourStop, NeighborhoodTourStop, NeighborhoodTourStop];
}

export interface NeighborhoodTourState {
  version: 1;
  claimedTourIds: NeighborhoodTourId[];
  pinnedTourId: NeighborhoodTourId | null;
  lastClaimedAt: number;
}

export interface NeighborhoodTourStopView extends NeighborhoodTourStop {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface NeighborhoodTourView extends Omit<NeighborhoodTourDef, 'stops'> {
  stops: NeighborhoodTourStopView[];
  completedStops: number;
  progressPct: number;
  ready: boolean;
  claimed: boolean;
  pinned: boolean;
  nextStop: NeighborhoodTourStopView | null;
}

export interface NeighborhoodTourProgress {
  postcards: number;
  totalPostcards: number;
  moods: number;
  totalMoods: number;
  ready: number;
  completedStops: number;
  totalStops: number;
}

export type NeighborhoodTourClaimResult =
  | { ok: true; tour: NeighborhoodTourDef; firstMood: boolean; collectionComplete: boolean }
  | { ok: false; reason: 'unknown-tour' | 'already-claimed' | 'not-ready' };

const stop = (
  key: string, goal: number, label: string, note: string, location: string, activity: IsoActivityKind,
): NeighborhoodTourStop => ({ key, goal, label, note, location, activity });

/** 짧은 취향 입구 12개. 기존 평생 기록을 읽어 과거 활동도 모두 소급한다. */
export const NEIGHBORHOOD_TOURS: readonly NeighborhoodTourDef[] = [
  {
    id: 'first_afternoon', code: 'HELLO 01', mark: '첫', mood: '처음', duration: '약 15분', name: '첫 오후 네 모퉁이',
    description: '카페, 사진, 아틀리에와 집을 한 번씩 둘러보며 마을의 기본 리듬을 익힙니다.',
    postcardTitle: '문을 연 첫 오후', postcardCaption: '낯설었던 네 모퉁이가 돌아오는 길의 표지가 되었다.', color: '#b87858',
    stops: [
      stop('q_cafe', 1, '따뜻한 첫 잔', '모퉁이 카페에서 짧은 일을 도와봐요.', '모퉁이 카페', 'cafe'),
      stop('photo_taken', 1, '오늘을 한 장', '네컷 작업실에서 첫 장면을 남겨요.', '네컷 작업실', 'photo'),
      stop('customize_save', 1, '나를 닮은 모습', '아틀리에에서 현재 모습을 저장해요.', '살림 아틀리에', 'atelier'),
      stop('visit_home', 1, '돌아갈 방', '나의 집 문을 열어 생활 수첩을 확인해요.', '주택가 · 나의 집', 'home'),
    ],
  },
  {
    id: 'thread_walk', code: 'THREAD 02', mark: '결', mood: '꾸미기', duration: '약 20분', name: '옷결 따라 걷기',
    description: '한 가지 색을 고르고 옷장, 룩북, 전시회까지 나만의 모습이 이어지는 길입니다.',
    postcardTitle: '골목이 입은 색', postcardCaption: '한 번 고른 색이 옷장을 지나 골목의 작은 전시가 되었다.', color: '#9b6d62',
    stops: [
      stop('fashion_dye', 1, '오늘의 한 색', '상의나 포인트 색을 한 번 바꿔 봐요.', '아틀리에 · 의상', 'atelier'),
      stop('closet_save', 1, '옷장 첫 칸', '마음에 든 조합을 옷장에 보관해요.', '아틀리에 · 옷장', 'atelier'),
      stop('lookbook_entries', 1, '룩북 한 장', '조건을 읽고 나만의 답을 출품해요.', '아틀리에 · 골목 룩북', 'atelier'),
      stop('taste_showcase_submissions', 1, '광장에 남긴 취향', '현재 코디를 취향 전시회에 기록해요.', '중앙 광장 · 취향 전시회', 'showcase'),
    ],
  },
  {
    id: 'small_room', code: 'NEST 03', mark: '집', mood: '꾸미기', duration: '약 25분', name: '작은 방 큰 표정',
    description: '가구를 놓고 손질하며 비어 있던 방에 반복되는 색과 생활 동선을 만듭니다.',
    postcardTitle: '불을 켠 방', postcardCaption: '물건 네 점보다 그 사이를 오간 생활의 순서가 방을 채웠다.', color: '#8a7257',
    stops: [
      stop('visit_home', 1, '방의 첫 불', '집에 들어가 현재 공간을 살펴봐요.', '나의 집', 'home'),
      stop('q_place', 4, '생활 가구 네 점', '쓰임이 다른 가구를 천천히 배치해요.', '내 집 · 꾸미기', 'home'),
      stop('furniture_reform_saves', 1, '손본 한 점', '가구 하나의 마감과 색을 다시 골라요.', '내 집 · 리폼 공방', 'home'),
      stop('home_unique_items', 6, '서로 다른 여섯 물건', '같은 물건만 늘리지 않고 방의 쓰임을 넓혀요.', '내 집 · 인테리어 수첩', 'home'),
    ],
  },
  {
    id: 'paw_steps', code: 'PAW 04', mark: '곁', mood: '동행', duration: '약 20분', name: '나란한 발자국',
    description: '첫 친구에게 이름과 성격을 붙이고 돌본 뒤, 함께 걸을 골목을 고릅니다.',
    postcardTitle: '둘이 된 지도', postcardCaption: '혼자 걸을 때는 없던 냄새와 그늘이 지도에 새로 생겼다.', color: '#a57269',
    stops: [
      stop('pet_adopt', 1, '첫 동행', '멍냥이네에서 마음이 가는 친구를 만나요.', '펫샵 · 가족 목록', 'petshop'),
      stop('pet_feed', 1, '마음을 챙기는 한 끼', '새 친구에게 먹이를 건네요.', '펫샵 · 돌봄', 'petshop'),
      stop('pet_profile_edit', 1, '우리만의 소개', '이름, 성격 또는 장식을 한 번 골라요.', '펫샵 · 프로필', 'petshop'),
      stop('pet_outings_total', 1, '첫 골목 산책', '성격에 어울리는 산책길을 함께 걸어요.', '펫샵 · 산책 수첩', 'petshop'),
    ],
  },
  {
    id: 'rooftop_table', code: 'TABLE 05', mark: '맛', mood: '관찰', duration: '약 25분', name: '옥상에서 식탁까지',
    description: '씨앗 하나가 자라고 수확되어 한 접시의 저녁이 되는 짧은 생활 순환입니다.',
    postcardTitle: '화분 네 칸의 저녁', postcardCaption: '기다린 시간까지 접시에 올리자 작은 잎의 맛이 길어졌다.', color: '#718064',
    stops: [
      stop('garden_planted', 1, '첫 씨앗', '빈 화분에 마음이 가는 씨앗을 심어요.', '옥상 씨앗 연구소', 'garden'),
      stop('garden_harvest', 1, '손바닥만 한 수확', '다 자란 식물의 성장 결을 기록해요.', '옥상 정원 · 네 화분', 'garden'),
      stop('cooking_total', 1, '첫 접시', '수확한 재료로 메뉴를 완성해요.', '모퉁이 골목 주방', 'kitchen'),
      stop('cooking_recipes', 2, '두 가지 대답', '서로 다른 재료로 메뉴 두 종을 발견해요.', '골목 주방 · 메뉴 카드', 'kitchen'),
    ],
  },
  {
    id: 'water_notes', code: 'RIPPLE 06', mark: '물', mood: '관찰', duration: '약 25분', name: '느린 물결 관찰',
    description: '세 물가의 생물과 크기를 비교하고, 마음에 든 물빛을 방 안 수조로 이어 갑니다.',
    postcardTitle: '난간 아래의 손님', postcardCaption: '같은 수면을 오래 보니 매번 다른 인사가 떠올랐다.', color: '#647c7e',
    stops: [
      stop('fishing_total', 1, '첫 물결 인사', '물정원에서 서두르지 않고 한 번 기다려요.', '물정원 낚시', 'fishing'),
      stop('fishing_species', 3, '세 얼굴', '서로 다른 물가 생물 세 종을 기록해요.', '낚시 수첩 · 생물 기록', 'fishing'),
      stop('fishing_stamps', 3, '크기 도장 세 칸', '같은 종의 크기 차이도 수첩에 남겨요.', '낚시 수첩 · 크기 기록', 'fishing'),
      stop('aquarium_saves', 1, '방 안의 작은 수로', '잡은 생물로 첫 테라리움을 저장해요.', '내 집 · 물결 테라리움', 'home'),
    ],
  },
  {
    id: 'maker_lane', code: 'MAKER 07', mark: '손', mood: '만들기', duration: '약 30분', name: '고쳐 쓰는 골목',
    description: '가구의 획득 경로를 살펴보고 재료를 모아 만들거나, 가진 물건의 표정을 바꿉니다.',
    postcardTitle: '손때가 시작된 날', postcardCaption: '새것이 아니어도 다시 고른 색과 결이 물건의 이름을 바꾸었다.', color: '#8b6b4d',
    stops: [
      stop('visit_shop', 1, '살림 선반 읽기', '기본 진열과 주간 수첩을 둘러봐요.', '살림 가구', 'shop'),
      stop('visit_workshop', 1, '설계도 펼치기', 'DIY 작업대의 재료 목록을 확인해요.', '살림 가구 · DIY 작업대', 'workshop'),
      stop('furniture_craft_total', 1, '첫 제작', '모은 재료를 한 점의 가구로 엮어요.', 'DIY 작업대', 'workshop'),
      stop('furniture_reform_saves', 2, '두 번 고른 결', '서로 다른 가구의 외형을 손봐요.', '내 집 · 리폼 공방', 'home'),
    ],
  },
  {
    id: 'night_scene', code: 'NIGHT 08', mark: '밤', mood: '처음', duration: '약 20분', name: '밤골목 한 장면',
    description: '카페의 잔 소리, 작은 무대와 네컷 사진을 한 편의 저녁 장면으로 묶습니다.',
    postcardTitle: '박수 뒤의 모퉁이', postcardCaption: '노래가 끝난 뒤에도 커피잔과 셔터 소리가 골목의 박자를 이었다.', color: '#6f665f',
    stops: [
      stop('q_cafe', 2, '두 번째 따뜻한 잔', '단골처럼 카페의 일을 한 번 더 도와요.', '모퉁이 카페', 'cafe'),
      stop('q_busking', 1, '첫 골목 무대', '중앙 광장에서 짧은 공연을 완주해요.', '중앙 광장 · 버스킹', 'busking'),
      stop('photo_taken', 2, '밤의 네컷', '지금 모습을 두 번째 필름으로 남겨요.', '네컷 작업실', 'photo'),
      stop('taste_showcase_submissions', 2, '오늘의 장면 출품', '생활의 한 장면을 전시 기록으로 남겨요.', '골목 취향 전시회', 'showcase'),
    ],
  },
  {
    id: 'collector_loop', code: 'INDEX 09', mark: '수', mood: '관찰', duration: '여러 날', name: '네 권의 얇은 도감',
    description: '패션, 동행, 식물과 물가에서 한 권씩 작은 수집 기록을 시작합니다.',
    postcardTitle: '첫 번째 빈칸들', postcardCaption: '완성된 도감보다 무엇을 좋아하는지 알게 된 네 빈칸이 더 선명했다.', color: '#7b7460',
    stops: [
      stop('rare_styles', 2, '희귀 옷결 두 종', '배지로 열린 스타일을 도감에서 확인해요.', '아틀리에 · 스타일 도감', 'atelier'),
      stop('pet_accessories', 3, '동행 장식 세 종', '친구와 쌓은 기록으로 장식을 열어요.', '펫샵 · 장식 도감', 'petshop'),
      stop('garden_species', 4, '식물 네 종', '서로 다른 씨앗의 수확 기록을 모아요.', '옥상 정원 · 씨앗 서랍', 'garden'),
      stop('fishing_species', 4, '물가 생물 네 종', '세 물가에서 다른 생물을 찾아요.', '낚시 수첩 · 생물 기록', 'fishing'),
    ],
  },
  {
    id: 'shared_home', code: 'TOGETHER 10', mark: '온', mood: '동행', duration: '여러 날', name: '함께 사는 방',
    description: '동행의 성격을 관찰하고 좋아하는 가구 곁에서 생긴 생활 장면을 집에 남깁니다.',
    postcardTitle: '비어 있지 않은 자리', postcardCaption: '가장 비싼 쿠션보다 자주 돌아오는 사람 곁이 친구의 자리가 되었다.', color: '#927062',
    stops: [
      stop('pet_adopt', 1, '한 지붕의 친구', '함께 살 동행을 먼저 만나요.', '펫샵 · 가족 목록', 'petshop'),
      stop('q_place', 8, '생활 자리 여덟 점', '동행이 반응할 만한 가구를 방에 놓아요.', '내 집 · 꾸미기', 'home'),
      stop('pet_home_scenes', 3, '세 번의 작은 대사', '좋아하는 가구 곁 생활 장면을 지켜봐요.', '내 집 · 동행의 자리', 'home'),
      stop('pet_home_memories', 3, '집 추억 세 장', '서로 다른 반응을 동행 수첩에 기록해요.', '내 집 · 동행의 자리', 'home'),
    ],
  },
  {
    id: 'neighbor_hands', code: 'COMMON 11', mark: '이', mood: '이웃', duration: '여러 날', name: '골목에 보탠 네 손',
    description: '의뢰, 동아리, 전시와 함께짓기에 한 번씩 참여해 마을 콘텐츠의 연결을 익힙니다.',
    postcardTitle: '내 이름 없는 변화', postcardCaption: '작게 보탠 네 손이 모여 누가 만들었는지보다 오래 남는 장소가 되었다.', color: '#687765',
    stops: [
      stop('village_requests_total', 1, '첫 골목 부탁', '의뢰소에서 부담 없는 부탁 하나를 해결해요.', '모험 일지 · 의뢰소', 'quest'),
      stop('hobby_club_chapters', 1, '첫 동아리 페이지', '좋아하는 생활 모임의 한 장을 발간해요.', '중앙 광장 · 골목 동아리', 'clubs'),
      stop('taste_showcase_entries', 1, '첫 취향 기록', '현재 생활 모습을 한 주제에 출품해요.', '중앙 광장 · 취향 전시회', 'showcase'),
      stop('community_project_phases', 1, '첫 함께짓기 변화', '네 기여가 모인 설계 단계를 완성해요.', '레코드 골목 · 함께짓기', 'projects'),
    ],
  },
  {
    id: 'village_chronicle', code: 'CHRONICLE 12', mark: '별', mood: '이웃', duration: '긴 기록', name: '나만의 마을 연대기',
    description: '코디, 집, 동행과 공동 장소에서 오래 쌓인 기록을 골라 마지막 소풍 엽서로 엮습니다.',
    postcardTitle: '다음 페이지가 있는 지도', postcardCaption: '완성한 기록보다 아직 걷지 않은 골목이 있어 이 수첩은 끝나지 않았다.', color: '#5f6e62',
    stops: [
      stop('lookbook_entries', 6, '여섯 벌의 대답', '서로 다른 룩북 의뢰 여섯 장을 기록해요.', '아틀리에 · 골목 룩북', 'atelier'),
      stop('home_score', 70, '생활이 보이는 방', '홈 스타일 점수 70의 공간을 만들어요.', '내 집 · 홈 스타일', 'home'),
      stop('pet_outing_stamps', 12, '열두 산책 기념', '동행과 골목별 기념 도장을 모아요.', '펫샵 · 산책 수첩', 'petshop'),
      stop('community_project_phases', 8, '여덟 번의 마을 변화', '함께짓기 여덟 단계를 마을에 반영해요.', '골목 함께짓기', 'projects'),
    ],
  },
] as const;

export const NEIGHBORHOOD_TOUR_BY_ID = new Map(NEIGHBORHOOD_TOURS.map((tour) => [tour.id, tour]));
const TOUR_IDS = new Set<string>(NEIGHBORHOOD_TOURS.map((tour) => tour.id));
const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
const metric = (quests: QuestState, key: string): number => cleanCount(quests.lifetimeCounts?.[key]);

export function freshNeighborhoodTourState(): NeighborhoodTourState {
  return { version: 1, claimedTourIds: [], pinnedTourId: null, lastClaimedAt: 0 };
}

export function normalizeNeighborhoodTourState(raw: unknown): NeighborhoodTourState {
  if (!raw || typeof raw !== 'object') return freshNeighborhoodTourState();
  const value = raw as Partial<NeighborhoodTourState>;
  const claimedTourIds = Array.isArray(value.claimedTourIds)
    ? [...new Set(value.claimedTourIds.filter((id): id is NeighborhoodTourId => typeof id === 'string' && TOUR_IDS.has(id)))]
    : [];
  const pinnedTourId = typeof value.pinnedTourId === 'string' && TOUR_IDS.has(value.pinnedTourId)
    ? value.pinnedTourId as NeighborhoodTourId : null;
  return { version: 1, claimedTourIds, pinnedTourId, lastClaimedAt: cleanCount(value.lastClaimedAt) };
}

export function neighborhoodTourViews(state: NeighborhoodTourState, quests: QuestState): NeighborhoodTourView[] {
  return NEIGHBORHOOD_TOURS.map((tour): NeighborhoodTourView => {
    const stops = tour.stops.map((item): NeighborhoodTourStopView => {
      const current = metric(quests, item.key);
      return { ...item, current, complete: current >= item.goal, progressPct: Math.round((Math.min(current, item.goal) / item.goal) * 100) };
    });
    const completedStops = stops.filter((item) => item.complete).length;
    return {
      ...tour,
      stops,
      completedStops,
      progressPct: Math.round(stops.reduce((sum, item) => sum + item.progressPct, 0) / stops.length),
      ready: completedStops === stops.length,
      claimed: state.claimedTourIds.includes(tour.id),
      pinned: state.pinnedTourId === tour.id,
      nextStop: [...stops].filter((item) => !item.complete).sort((a, b) => b.progressPct - a.progressPct || a.goal - b.goal)[0] ?? null,
    };
  });
}

export function recommendedNeighborhoodTour(state: NeighborhoodTourState, quests: QuestState): NeighborhoodTourView | null {
  const views = neighborhoodTourViews(state, quests);
  const pinned = views.find((tour) => tour.pinned && !tour.claimed);
  if (pinned) return pinned;
  return [...views].filter((tour) => !tour.claimed)
    .sort((a, b) => Number(b.ready) - Number(a.ready) || b.progressPct - a.progressPct || a.completedStops - b.completedStops)[0] ?? null;
}

export function neighborhoodTourProgress(state: NeighborhoodTourState, quests: QuestState): NeighborhoodTourProgress {
  const views = neighborhoodTourViews(state, quests);
  const claimed = views.filter((tour) => tour.claimed);
  return {
    postcards: claimed.length,
    totalPostcards: views.length,
    moods: new Set(claimed.map((tour) => tour.mood)).size,
    totalMoods: new Set(views.map((tour) => tour.mood)).size,
    ready: views.filter((tour) => tour.ready && !tour.claimed).length,
    completedStops: views.reduce((sum, tour) => sum + tour.completedStops, 0),
    totalStops: views.reduce((sum, tour) => sum + tour.stops.length, 0),
  };
}

export function claimNeighborhoodTour(
  state: NeighborhoodTourState, tourId: string, quests: QuestState, claimedAt = Date.now(),
): NeighborhoodTourClaimResult {
  const tour = NEIGHBORHOOD_TOUR_BY_ID.get(tourId as NeighborhoodTourId);
  if (!tour) return { ok: false, reason: 'unknown-tour' };
  if (state.claimedTourIds.includes(tour.id)) return { ok: false, reason: 'already-claimed' };
  const view = neighborhoodTourViews(state, quests).find((item) => item.id === tour.id)!;
  if (!view.ready) return { ok: false, reason: 'not-ready' };
  const firstMood = !state.claimedTourIds.some((id) => NEIGHBORHOOD_TOUR_BY_ID.get(id)?.mood === tour.mood);
  state.claimedTourIds = [...state.claimedTourIds, tour.id];
  state.lastClaimedAt = cleanCount(claimedAt);
  return { ok: true, tour, firstMood, collectionComplete: state.claimedTourIds.length === NEIGHBORHOOD_TOURS.length };
}

export class NeighborhoodTourStore {
  private state: NeighborhoodTourState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-neighborhood-tours-${userId}`;
    let raw: unknown = null;
    try { const value = localStorage.getItem(this.key); if (value) raw = JSON.parse(value); } catch { /* 세션 한정 */ }
    this.state = normalizeNeighborhoodTourState(raw);
    this.persist();
  }

  get(): NeighborhoodTourState { return this.state; }
  views(quests: QuestState): NeighborhoodTourView[] { return neighborhoodTourViews(this.state, quests); }
  progress(quests: QuestState): NeighborhoodTourProgress { return neighborhoodTourProgress(this.state, quests); }
  recommended(quests: QuestState): NeighborhoodTourView | null { return recommendedNeighborhoodTour(this.state, quests); }

  pin(tourId: NeighborhoodTourId | null): boolean {
    if (tourId !== null && !NEIGHBORHOOD_TOUR_BY_ID.has(tourId)) return false;
    this.state.pinnedTourId = this.state.pinnedTourId === tourId ? null : tourId;
    this.persist();
    return true;
  }

  claim(tourId: string, quests: QuestState): NeighborhoodTourClaimResult {
    const result = claimNeighborhoodTour(this.state, tourId, quests);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
