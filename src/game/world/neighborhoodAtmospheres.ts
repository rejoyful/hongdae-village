import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from './isometricVillageMap';

export type NeighborhoodAtmosphereId =
  | 'soft_sun'
  | 'cloud_walk'
  | 'window_rain'
  | 'neon_shower'
  | 'golden_garden'
  | 'moon_haze'
  | 'first_snow'
  | 'spring_petals';

export type NeighborhoodAtmosphereEffect =
  | 'sun'
  | 'cloud'
  | 'rain'
  | 'neon-rain'
  | 'golden'
  | 'moon'
  | 'snow'
  | 'petal';

export interface NeighborhoodAtmosphereRequirement {
  key: string;
  goal: number;
  label: string;
  location: string;
  activity: IsoActivityKind;
}

export interface NeighborhoodAtmosphereDef {
  id: NeighborhoodAtmosphereId;
  order: number;
  code: string;
  mark: string;
  name: string;
  subtitle: string;
  description: string;
  memory: string;
  effect: NeighborhoodAtmosphereEffect;
  palette: readonly [string, string, string, string];
  requirements: readonly NeighborhoodAtmosphereRequirement[];
  recommendedActivities: readonly [string, string, string];
  keepsake: string;
}

export interface NeighborhoodAtmosphereState {
  version: 1;
  observedIds: NeighborhoodAtmosphereId[];
  activeId: NeighborhoodAtmosphereId;
  featuredIds: NeighborhoodAtmosphereId[];
  replayCount: number;
  visitCount: number;
}

export interface NeighborhoodAtmosphereRequirementView extends NeighborhoodAtmosphereRequirement {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface NeighborhoodAtmosphereView extends Omit<NeighborhoodAtmosphereDef, 'requirements'> {
  requirements: NeighborhoodAtmosphereRequirementView[];
  observed: boolean;
  ready: boolean;
  active: boolean;
  featured: boolean;
  completedRequirements: number;
}

export interface NeighborhoodAtmosphereProgress {
  observed: number;
  total: number;
  ready: number;
  featured: number;
  featuredMax: number;
  replayCount: number;
  visitCount: number;
  effects: number;
}

export type AtmosphereObserveResult =
  | { ok: true; first: boolean; atmosphere: NeighborhoodAtmosphereDef }
  | { ok: false; reason: 'unknown' | 'not-ready' };
export type AtmosphereActivateResult = 'activated' | 'unchanged' | 'locked' | 'unknown';
export type AtmosphereFeatureResult = 'added' | 'removed' | 'full' | 'locked' | 'unknown';

export const NEIGHBORHOOD_ATMOSPHERE_FEATURED_MAX = 3;

const r = (
  key: string,
  goal: number,
  label: string,
  location: string,
  activity: IsoActivityKind,
): NeighborhoodAtmosphereRequirement => ({ key, goal, label, location, activity });

/**
 * 날씨를 실시간 출석 보상으로 만들지 않고, 이미 즐긴 생활 두 갈래가 만나는 영구 장면으로 연다.
 * 첫 햇살은 항상 열려 있어 누구나 관측소의 기능과 화면 효과를 바로 시험할 수 있다.
 */
export const NEIGHBORHOOD_ATMOSPHERES: readonly NeighborhoodAtmosphereDef[] = [
  {
    id: 'soft_sun', order: 1, code: 'SKY 01 · SOFT SUN', mark: '볕',
    name: '이사 온 날의 옅은 햇살', subtitle: '모든 골목 관측의 첫 장',
    description: '낮은 지붕과 창문 가장자리에 크림빛 햇살이 얇게 머뭅니다.',
    memory: '처음 보는 길도 햇빛이 오래 머문 모서리부터는 조금씩 내 동네가 되었다.',
    effect: 'sun', palette: ['#3d3a3d', '#8b7766', '#d7b778', '#f7e3b0'],
    requirements: [],
    recommendedActivities: ['처음 보는 권역 걷기', '주민에게 인사하기', '내 집 첫 가구 놓기'],
    keepsake: '첫 햇살 관측 필름',
  },
  {
    id: 'cloud_walk', order: 2, code: 'SKY 02 · CLOUD WALK', mark: '구',
    name: '천천히 걷는 낮은 구름', subtitle: '목적지 없는 산책의 회색',
    description: '그늘이 골목을 넓게 덮어 오래 걸어도 눈이 편안한 오후입니다.',
    memory: '맑지 않아도 좋은 날이 있다는 걸, 인사를 나누며 천천히 걸은 뒤에 알았다.',
    effect: 'cloud', palette: ['#343b42', '#697780', '#9fa8a2', '#d6d1bd'],
    requirements: [
      r('q_forest', 60, '숲길에서 60초 천천히 걷기', '경의선 숲길', 'guide'),
      r('resident_greet', 3, '주민과 안부 3번 나누기', '이름 있는 주민', 'guide'),
    ],
    recommendedActivities: ['골목 소풍', '주민 수첩 읽기', '비밀 흔적 찾기'],
    keepsake: '낮은 구름 산책표',
  },
  {
    id: 'window_rain', order: 3, code: 'SKY 03 · WINDOW RAIN', mark: '비',
    name: '창가에 오래 남은 비', subtitle: '커피와 물결 사이의 오후',
    description: '가느다란 빗줄기와 젖은 바닥 반사가 카페 창가까지 이어집니다.',
    memory: '컵이 식는 동안에도 창문을 흐르던 빗방울은 각자 다른 골목으로 내려갔다.',
    effect: 'rain', palette: ['#27343d', '#506b76', '#8ea4a2', '#d4c7a9'],
    requirements: [
      r('q_cafe', 3, '카페의 하루 3번 돕기', '모퉁이 카페', 'cafe'),
      r('fishing_total', 3, '물가 생물 3번 만나기', '물정원 낚시', 'fishing'),
    ],
    recommendedActivities: ['카페 창가 머물기', '물정원 관찰', '비 오는 코디 저장'],
    keepsake: '빗방울 유리 필름',
  },
  {
    id: 'neon_shower', order: 4, code: 'SKY 04 · NEON SHOWER', mark: '네',
    name: '네온이 번지는 소나기', subtitle: '공연 뒤 젖은 밤골목',
    description: '보랏빛 소나기가 간판과 무대 조명을 젖은 길 위에 길게 늘입니다.',
    memory: '공연은 끝났지만 웅덩이에 남은 네온은 마지막 곡을 한 번 더 비추고 있었다.',
    effect: 'neon-rain', palette: ['#20223a', '#51456d', '#a25877', '#e1a66e'],
    requirements: [
      r('q_busking', 3, '버스킹 3번 완주하기', '중앙 광장 무대', 'busking'),
      r('photo_taken', 3, '골목 네컷 3장 남기기', '네컷 작업실', 'photo'),
    ],
    recommendedActivities: ['밤 버스킹', '네컷 화보', '레코드 골목 산책'],
    keepsake: '네온 소나기 셋리스트',
  },
  {
    id: 'golden_garden', order: 5, code: 'SKY 05 · GOLDEN GARDEN', mark: '금',
    name: '옥상 정원의 금빛 시간', subtitle: '기른 것과 머무는 곳의 저녁',
    description: '낮은 금빛이 잎 가장자리와 집 창문, 오래 쓴 가구의 결을 함께 밝힙니다.',
    memory: '수확한 잎을 들고 집으로 돌아가자 방 안의 나무결도 같은 계절처럼 빛났다.',
    effect: 'golden', palette: ['#4b3b38', '#9c684d', '#d49a58', '#f4d486'],
    requirements: [
      r('garden_harvest', 3, '옥상 식물 3번 수확하기', '옥상 정원', 'garden'),
      r('home_score', 30, '홈 스타일 30점 만들기', '나의 집', 'home'),
    ],
    recommendedActivities: ['옥상 수확', '집 장면 촬영', '골목 주방 요리'],
    keepsake: '금빛 잎맥 필름',
  },
  {
    id: 'moon_haze', order: 6, code: 'SKY 06 · MOON HAZE', mark: '달',
    name: '첫차 전의 달빛 안개', subtitle: '숨은 문장이 보이는 시간',
    description: '푸른 안개가 철길과 골목 사이를 낮게 흐르며 작은 환경 단서를 드러냅니다.',
    memory: '길이 흐릿해지자 간판보다 발밑의 오래된 흔적과 멀리 켜진 창문이 더 선명해졌다.',
    effect: 'moon', palette: ['#20283a', '#45546e', '#77849b', '#d8d5bd'],
    requirements: [
      r('q_forest', 180, '숲길에서 180초 걷기', '경의선 숲길', 'guide'),
      r('alley_secrets_discovered', 6, '환경 단서 6개 발견하기', '골목 비밀 기록', 'guide'),
    ],
    recommendedActivities: ['골목 비밀 찾기', '외곽 생태 관찰', '첫차 전 산책'],
    keepsake: '달빛 안개 색인표',
  },
  {
    id: 'first_snow', order: 7, code: 'SKY 07 · FIRST SNOW', mark: '설',
    name: '식탁에 닿기 전 첫눈', subtitle: '따뜻한 답장을 쓰는 저녁',
    description: '굵고 느린 첫눈이 지붕과 포장마차 불빛 사이를 조용히 채웁니다.',
    memory: '따뜻한 접시를 비운 뒤 쓴 답장은 눈이 그친 다음 날에도 식지 않았다.',
    effect: 'snow', palette: ['#313745', '#657083', '#aeb8bf', '#f3e6ca'],
    requirements: [
      r('cooking_total', 6, '따뜻한 메뉴 6번 완성하기', '골목 주방', 'kitchen'),
      r('resident_letters', 1, '주민 편지에 첫 답장 남기기', '주민 관계 수첩', 'guide'),
    ],
    recommendedActivities: ['따뜻한 요리', '주민 우편 읽기', '포근한 집 꾸미기'],
    keepsake: '첫눈 답장 봉인',
  },
  {
    id: 'spring_petals', order: 8, code: 'SKY 08 · PETAL ROUTE', mark: '꽃',
    name: '동행과 걷는 꽃잎길', subtitle: '약속 장소까지 이어진 봄',
    description: '살구빛 꽃잎이 동행의 발자국과 주민 약속 장소를 천천히 이어 줍니다.',
    memory: '서로 다른 보폭으로 출발했지만 꽃잎이 쌓인 마지막 모퉁이에서는 나란히 걷고 있었다.',
    effect: 'petal', palette: ['#4e4248', '#8f6f78', '#d5999c', '#f2d2b6'],
    requirements: [
      r('pet_outings_total', 6, '동행과 산책 6번 기록하기', '펫샵 · 산책 수첩', 'petshop'),
      r('resident_rendezvous_scenes', 1, '주민과 첫 약속 장면 기록하기', '주민 관계 수첩', 'guide'),
    ],
    recommendedActivities: ['동행 산책', '주민 약속', '봄 코디 화보'],
    keepsake: '나란한 꽃잎 노선도',
  },
] as const;

export const NEIGHBORHOOD_ATMOSPHERE_BY_ID = new Map(
  NEIGHBORHOOD_ATMOSPHERES.map((atmosphere) => [atmosphere.id, atmosphere]),
);

const IDS = new Set<string>(NEIGHBORHOOD_ATMOSPHERES.map((atmosphere) => atmosphere.id));
const EFFECT_COUNT = new Set(NEIGHBORHOOD_ATMOSPHERES.map((atmosphere) => atmosphere.effect)).size;
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);
const isId = (value: unknown): value is NeighborhoodAtmosphereId => (
  typeof value === 'string' && IDS.has(value)
);

export function freshNeighborhoodAtmosphereState(): NeighborhoodAtmosphereState {
  return {
    version: 1,
    observedIds: ['soft_sun'],
    activeId: 'soft_sun',
    featuredIds: [],
    replayCount: 0,
    visitCount: 0,
  };
}

export function normalizeNeighborhoodAtmosphereState(raw: unknown): NeighborhoodAtmosphereState {
  if (!raw || typeof raw !== 'object') return freshNeighborhoodAtmosphereState();
  const value = raw as Partial<NeighborhoodAtmosphereState>;
  const observedIds = Array.isArray(value.observedIds)
    ? [...new Set(value.observedIds.filter(isId))]
    : [];
  if (!observedIds.includes('soft_sun')) observedIds.unshift('soft_sun');
  const observed = new Set(observedIds);
  const activeId = isId(value.activeId) && observed.has(value.activeId) ? value.activeId : 'soft_sun';
  const featuredIds = Array.isArray(value.featuredIds)
    ? [...new Set(value.featuredIds.filter((id): id is NeighborhoodAtmosphereId => isId(id) && observed.has(id)))]
      .slice(0, NEIGHBORHOOD_ATMOSPHERE_FEATURED_MAX)
    : [];
  return {
    version: 1,
    observedIds,
    activeId,
    featuredIds,
    replayCount: cleanCount(value.replayCount),
    visitCount: cleanCount(value.visitCount),
  };
}

function metricValue(state: QuestState, key: string): number {
  return cleanCount(state.lifetimeCounts?.[key]);
}

export function neighborhoodAtmosphereViews(
  state: NeighborhoodAtmosphereState,
  quests: QuestState,
): NeighborhoodAtmosphereView[] {
  const observed = new Set(state.observedIds);
  const featured = new Set(state.featuredIds);
  return NEIGHBORHOOD_ATMOSPHERES.map((atmosphere) => {
    const requirements = atmosphere.requirements.map((requirement) => {
      const current = metricValue(quests, requirement.key);
      return {
        ...requirement,
        current: Math.min(current, requirement.goal),
        complete: current >= requirement.goal,
        progressPct: requirement.goal > 0 ? Math.min(100, Math.round((current / requirement.goal) * 100)) : 100,
      };
    });
    const isObserved = observed.has(atmosphere.id);
    return {
      ...atmosphere,
      requirements,
      observed: isObserved,
      ready: !isObserved && requirements.every((requirement) => requirement.complete),
      active: state.activeId === atmosphere.id,
      featured: featured.has(atmosphere.id),
      completedRequirements: requirements.filter((requirement) => requirement.complete).length,
    };
  });
}

export function neighborhoodAtmosphereProgress(
  state: NeighborhoodAtmosphereState,
  quests: QuestState,
): NeighborhoodAtmosphereProgress {
  const views = neighborhoodAtmosphereViews(state, quests);
  return {
    observed: state.observedIds.length,
    total: NEIGHBORHOOD_ATMOSPHERES.length,
    ready: views.filter((view) => view.ready).length,
    featured: state.featuredIds.length,
    featuredMax: NEIGHBORHOOD_ATMOSPHERE_FEATURED_MAX,
    replayCount: state.replayCount,
    visitCount: state.visitCount,
    effects: EFFECT_COUNT,
  };
}

export class NeighborhoodAtmosphereStore {
  private state: NeighborhoodAtmosphereState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-neighborhood-atmospheres-v1:${userId}`;
    let raw: unknown = null;
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) raw = JSON.parse(stored);
    } catch { /* 현재 세션에서만 유지 */ }
    this.state = normalizeNeighborhoodAtmosphereState(raw);
    this.persist();
  }

  get(): NeighborhoodAtmosphereState { return this.state; }
  active(): NeighborhoodAtmosphereDef {
    return NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(this.state.activeId) ?? NEIGHBORHOOD_ATMOSPHERES[0]!;
  }
  views(quests: QuestState): NeighborhoodAtmosphereView[] {
    return neighborhoodAtmosphereViews(this.state, quests);
  }
  progress(quests: QuestState): NeighborhoodAtmosphereProgress {
    return neighborhoodAtmosphereProgress(this.state, quests);
  }

  visit(): void {
    this.state = { ...this.state, visitCount: this.state.visitCount + 1 };
    this.persist();
  }

  observe(id: string, quests: QuestState): AtmosphereObserveResult {
    const atmosphere = NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(id as NeighborhoodAtmosphereId);
    if (!atmosphere) return { ok: false, reason: 'unknown' };
    if (this.state.observedIds.includes(atmosphere.id)) return { ok: true, first: false, atmosphere };
    const view = neighborhoodAtmosphereViews(this.state, quests).find((candidate) => candidate.id === atmosphere.id);
    if (!view?.ready) return { ok: false, reason: 'not-ready' };
    this.state = {
      ...this.state,
      observedIds: [...this.state.observedIds, atmosphere.id],
      activeId: atmosphere.id,
    };
    this.persist();
    return { ok: true, first: true, atmosphere };
  }

  activate(id: string): AtmosphereActivateResult {
    if (!isId(id)) return 'unknown';
    if (!this.state.observedIds.includes(id)) return 'locked';
    if (this.state.activeId === id) return 'unchanged';
    this.state = { ...this.state, activeId: id };
    this.persist();
    return 'activated';
  }

  replay(): void {
    this.state = { ...this.state, replayCount: this.state.replayCount + 1 };
    this.persist();
  }

  toggleFeatured(id: string): AtmosphereFeatureResult {
    if (!isId(id)) return 'unknown';
    if (!this.state.observedIds.includes(id)) return 'locked';
    if (this.state.featuredIds.includes(id)) {
      this.state = { ...this.state, featuredIds: this.state.featuredIds.filter((item) => item !== id) };
      this.persist();
      return 'removed';
    }
    if (this.state.featuredIds.length >= NEIGHBORHOOD_ATMOSPHERE_FEATURED_MAX) return 'full';
    this.state = { ...this.state, featuredIds: [...this.state.featuredIds, id] };
    this.persist();
    return 'added';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션에서만 유지 */ }
  }
}
