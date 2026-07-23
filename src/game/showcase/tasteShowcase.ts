import type { HomeDesignAnalysis, HomeThemeId } from '../home/homeDesign';
import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';

export type TasteShowcaseDomain = 'home' | 'pet';

export interface TasteShowcaseCriterion {
  id: string;
  label: string;
  hint: string;
}

export interface TasteShowcaseExhibit {
  id: string;
  domain: TasteShowcaseDomain;
  code: string;
  mark: string;
  name: string;
  curator: string;
  brief: string;
  criteria: readonly [TasteShowcaseCriterion, TasteShowcaseCriterion, TasteShowcaseCriterion];
}

export interface TasteHomeSnapshot {
  score: number;
  themeId: HomeThemeId;
  themeName: string;
  themePower: number;
  placedCount: number;
  uniqueCount: number;
  categoryCount: number;
  layerCount: number;
  natureCount: number;
  hobbyCount: number;
  essentials: HomeDesignAnalysis['essentials'];
  itemIds: string[];
  updatedAt: number;
}

export interface TastePetSnapshot {
  activeId: string | null;
  activeName: string | null;
  personality: PetPersonalityId | null;
  accessory: PetAccessoryId | null;
  affinity: number;
  tricks: number;
  memories: number;
  owned: number;
  customized: number;
  accessories: number;
  personalities: number;
  outingRoutes: number;
  outingSouvenirs: number;
  homeMemories: number;
  homePartners: number;
}

export interface TasteShowcaseContext {
  home: TasteHomeSnapshot | null;
  pet: TastePetSnapshot;
}

export interface TasteShowcaseRecord {
  bestStamps: number;
  attempts: number;
  savedAt: number;
}

export interface TasteShowcaseState {
  version: 1;
  records: Record<string, TasteShowcaseRecord>;
  totalSubmissions: number;
  home: TasteHomeSnapshot | null;
}

export interface TasteShowcaseProgress {
  entries: number;
  totalEntries: number;
  stamps: number;
  totalStamps: number;
  perfect: number;
  submissions: number;
  domains: number;
}

export interface TasteShowcaseEvaluation {
  matched: number;
  stampsOnSubmit: number;
  criteria: Array<TasteShowcaseCriterion & { matched: boolean }>;
}

export type TasteShowcaseSubmitResult =
  | { ok: true; exhibitId: string; stamps: number; matched: number; improved: boolean; firstEntry: boolean; firstPerfect: boolean }
  | { ok: false; reason: 'unknown-exhibit' };

const criterion = (id: string, label: string, hint: string): TasteShowcaseCriterion => ({ id, label, hint });

/** 집과 동행의 현재 모습을 기록하는 여덟 개의 비경쟁형 전시 주제. */
export const TASTE_SHOWCASE_EXHIBITS: readonly TasteShowcaseExhibit[] = [
  {
    id: 'home_everyday', domain: 'home', code: 'ROOM 01', mark: '삶', name: '생활이 놓인 방', curator: '살림 아주머니',
    brief: '멋보다 먼저, 매일 손이 가는 물건들이 자연스럽게 이어지는 방을 기록해요.',
    criteria: [
      criterion('home_essentials_3', '생활 자리 셋', '침대·앉을 곳·테이블·수납·조명 중 세 가지'),
      criterion('home_categories_4', '서로 다른 쓰임', '가구 분류 네 가지 이상'),
      criterion('home_unique_8', '여덟 가지 이야기', '서로 다른 물건 여덟 종 이상'),
    ],
  },
  {
    id: 'home_signature', domain: 'home', code: 'ROOM 02', mark: '색', name: '취향의 중심', curator: '노을의 스케치',
    brief: '좋아하는 색과 물건이 반복되며 주인의 취향이 또렷해진 공간을 찾아요.',
    criteria: [
      criterion('home_score_50', '취향 가득 등급', '홈 스타일 점수 50 이상'),
      criterion('home_theme_3', '선명한 테마', '같은 테마 물건 세 종 이상'),
      criterion('home_unique_12', '풍부한 컬렉션', '서로 다른 물건 열두 종 이상'),
    ],
  },
  {
    id: 'home_green_pause', domain: 'home', code: 'ROOM 03', mark: '숨', name: '초록빛 쉼표', curator: '동수 할아버지',
    brief: '잠시 앉아 잎의 움직임과 작은 불빛을 볼 수 있는 느린 구석을 전시해요.',
    criteria: [
      criterion('home_nature_2', '초록 친구 둘', '식물·꽃·정원·어항 두 종 이상'),
      criterion('home_light', '은은한 빛', '조명 한 자리를 마련하기'),
      criterion('home_seating', '잠시 앉을 곳', '의자나 소파 놓기'),
    ],
  },
  {
    id: 'home_story_corner', domain: 'home', code: 'ROOM 04', mark: '장', name: '이야기가 쌓인 구석', curator: '마을 기록관',
    brief: '층마다 다른 물건이 놓이고, 취미의 흔적이 작은 장면처럼 이어지는 방이에요.',
    criteria: [
      criterion('home_hobby_2', '취미의 흔적', '악기·화면·수조·인형 등 두 종 이상'),
      criterion('home_layers_3', '세 겹의 장면', '바닥·가구·벽 레이어를 고르게 사용'),
      criterion('home_placed_15', '살아온 밀도', '물건 열다섯 점 이상 배치'),
    ],
  },
  {
    id: 'pet_first_portrait', domain: 'pet', code: 'PAIR 01', mark: '첫', name: '우리의 첫 초상', curator: '멍냥이네 가족',
    brief: '처음 함께 골목을 걷기 시작한 친구의 지금 모습을 그대로 남겨요.',
    criteria: [
      criterion('pet_active', '오늘의 동행', '함께 걷는 펫 선택하기'),
      criterion('pet_affinity_25', '친해지는 중', '현재 동행 친밀도 25 이상'),
      criterion('pet_accessory', '작은 장식', '기본 모습이 아닌 장식 하나 착용'),
    ],
  },
  {
    id: 'pet_personality', domain: 'pet', code: 'PAIR 02', mark: '결', name: '서로 다른 성격', curator: '하늘의 메모',
    brief: '이름과 장식, 성격을 고르는 동안 생긴 각 동행의 고유한 결을 모아요.',
    criteria: [
      criterion('pet_customized', '프로필 한 장', '펫 프로필 한 번 편집하기'),
      criterion('pet_personalities_2', '두 가지 성격', '서로 다른 성격의 펫 둘 이상'),
      criterion('pet_accessories_2', '장식 서랍', '장식 두 종 이상 열기'),
    ],
  },
  {
    id: 'pet_practiced_pair', domain: 'pet', code: 'PAIR 03', mark: '짝', name: '연습해 온 사이', curator: '비트창고 쪽지',
    brief: '함께 반복한 인사와 놀이가 둘만의 호흡으로 남은 순간을 전시합니다.',
    criteria: [
      criterion('pet_tricks_2', '둘만의 신호', '현재 동행 트릭 두 개 배우기'),
      criterion('pet_affinity_50', '단짝의 마음', '현재 동행 친밀도 50 이상'),
      criterion('pet_memories_3', '추억 세 장', '현재 동행 추억 세 장 열기'),
    ],
  },
  {
    id: 'pet_shared_village', domain: 'pet', code: 'PAIR 04', mark: '길', name: '함께 넓어진 마을', curator: '박 기장의 지도',
    brief: '산책길과 집 안의 자리가 늘어날수록 둘의 마을도 천천히 넓어집니다.',
    criteria: [
      criterion('pet_outing_routes_3', '세 갈래 산책길', '서로 다른 산책 코스 세 곳 방문'),
      criterion('pet_outing_souvenirs_5', '다섯 개의 기념품', '산책 기념품 도장 다섯 개'),
      criterion('pet_home_memories_3', '동행의 자리 셋', '집에서 동행 추억 세 장 기록'),
    ],
  },
] as const;

export const TASTE_SHOWCASE_BY_ID = new Map(TASTE_SHOWCASE_EXHIBITS.map((exhibit) => [exhibit.id, exhibit]));

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

const HOME_THEME_IDS = new Set<HomeThemeId>(['starter', 'cozy', 'music', 'green', 'creator', 'pet']);

const normalizeHomeSnapshot = (raw: unknown): TasteHomeSnapshot | null => {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<TasteHomeSnapshot>;
  const essentials: Partial<TasteHomeSnapshot['essentials']> = value.essentials && typeof value.essentials === 'object'
    ? value.essentials : {};
  const themeId = typeof value.themeId === 'string' && HOME_THEME_IDS.has(value.themeId as HomeThemeId)
    ? value.themeId as HomeThemeId : 'starter';
  return {
    score: Math.min(100, cleanCount(value.score)),
    themeId,
    themeName: typeof value.themeName === 'string' ? value.themeName.slice(0, 30) : '나만의 시작',
    themePower: cleanCount(value.themePower),
    placedCount: cleanCount(value.placedCount),
    uniqueCount: cleanCount(value.uniqueCount),
    categoryCount: cleanCount(value.categoryCount),
    layerCount: cleanCount(value.layerCount),
    natureCount: cleanCount(value.natureCount),
    hobbyCount: cleanCount(value.hobbyCount),
    essentials: {
      sleep: essentials.sleep === true,
      seating: essentials.seating === true,
      surface: essentials.surface === true,
      storage: essentials.storage === true,
      light: essentials.light === true,
    },
    itemIds: Array.isArray(value.itemIds)
      ? [...new Set(value.itemIds.filter((id): id is string => typeof id === 'string'))].slice(0, 160) : [],
    updatedAt: cleanCount(value.updatedAt),
  };
};

const criterionMatched = (id: string, context: TasteShowcaseContext): boolean => {
  const h = context.home;
  const p = context.pet;
  const essentials = h ? Object.values(h.essentials).filter(Boolean).length : 0;
  const values: Record<string, boolean> = {
    home_essentials_3: essentials >= 3,
    home_categories_4: (h?.categoryCount ?? 0) >= 4,
    home_unique_8: (h?.uniqueCount ?? 0) >= 8,
    home_score_50: (h?.score ?? 0) >= 50,
    home_theme_3: (h?.themePower ?? 0) >= 3,
    home_unique_12: (h?.uniqueCount ?? 0) >= 12,
    home_nature_2: (h?.natureCount ?? 0) >= 2,
    home_light: h?.essentials.light ?? false,
    home_seating: h?.essentials.seating ?? false,
    home_hobby_2: (h?.hobbyCount ?? 0) >= 2,
    home_layers_3: (h?.layerCount ?? 0) >= 3,
    home_placed_15: (h?.placedCount ?? 0) >= 15,
    pet_active: !!p.activeId,
    pet_affinity_25: p.affinity >= 25,
    pet_accessory: !!p.activeId && p.accessory !== null && p.accessory !== 'none',
    pet_customized: p.customized >= 1,
    pet_personalities_2: p.personalities >= 2,
    pet_accessories_2: p.accessories >= 2,
    pet_tricks_2: p.tricks >= 2,
    pet_affinity_50: p.affinity >= 50,
    pet_memories_3: p.memories >= 3,
    pet_outing_routes_3: p.outingRoutes >= 3,
    pet_outing_souvenirs_5: p.outingSouvenirs >= 5,
    pet_home_memories_3: p.homeMemories >= 3,
  };
  return values[id] ?? false;
};

export function emptyPetSnapshot(): TastePetSnapshot {
  return {
    activeId: null, activeName: null, personality: null, accessory: null, affinity: 0, tricks: 0, memories: 0,
    owned: 0, customized: 0, accessories: 0, personalities: 0, outingRoutes: 0, outingSouvenirs: 0,
    homeMemories: 0, homePartners: 0,
  };
}

export function homeSnapshotFromAnalysis(
  analysis: HomeDesignAnalysis,
  itemIds: readonly string[],
  updatedAt = Date.now(),
): TasteHomeSnapshot {
  return {
    score: analysis.score,
    themeId: analysis.theme.id,
    themeName: analysis.theme.name,
    themePower: analysis.themePower,
    placedCount: analysis.placedCount,
    uniqueCount: analysis.uniqueCount,
    categoryCount: analysis.categoryCount,
    layerCount: analysis.layerCount,
    natureCount: analysis.natureCount,
    hobbyCount: analysis.hobbyCount,
    essentials: { ...analysis.essentials },
    itemIds: [...new Set(itemIds.filter((id) => typeof id === 'string'))].slice(0, 160),
    updatedAt,
  };
}

export function evaluateTasteShowcase(exhibit: TasteShowcaseExhibit, context: TasteShowcaseContext): TasteShowcaseEvaluation {
  const criteria = exhibit.criteria.map((item) => ({ ...item, matched: criterionMatched(item.id, context) }));
  const matched = criteria.filter((item) => item.matched).length;
  return { matched, stampsOnSubmit: Math.max(1, matched), criteria };
}

export function freshTasteShowcaseState(): TasteShowcaseState {
  return { version: 1, records: {}, totalSubmissions: 0, home: null };
}

export function normalizeTasteShowcaseState(raw: unknown): TasteShowcaseState {
  if (!raw || typeof raw !== 'object') return freshTasteShowcaseState();
  const value = raw as Partial<TasteShowcaseState>;
  const records: Record<string, TasteShowcaseRecord> = {};
  const input = value.records && typeof value.records === 'object' ? value.records as Record<string, unknown> : {};
  for (const exhibit of TASTE_SHOWCASE_EXHIBITS) {
    const candidate = input[exhibit.id];
    if (!candidate || typeof candidate !== 'object') continue;
    const record = candidate as Partial<TasteShowcaseRecord>;
    const bestStamps = Math.min(3, cleanCount(record.bestStamps));
    const attempts = cleanCount(record.attempts);
    if (!bestStamps || !attempts) continue;
    records[exhibit.id] = { bestStamps, attempts, savedAt: cleanCount(record.savedAt) };
  }
  const home = normalizeHomeSnapshot(value.home);
  return {
    version: 1,
    records,
    totalSubmissions: Math.max(cleanCount(value.totalSubmissions), Object.values(records).reduce((sum, record) => sum + record.attempts, 0)),
    home,
  };
}

export function submitTasteShowcase(
  state: TasteShowcaseState,
  exhibitId: string,
  context: TasteShowcaseContext,
  savedAt = Date.now(),
): TasteShowcaseSubmitResult {
  const exhibit = TASTE_SHOWCASE_BY_ID.get(exhibitId);
  if (!exhibit) return { ok: false, reason: 'unknown-exhibit' };
  const evaluation = evaluateTasteShowcase(exhibit, context);
  const previous = state.records[exhibitId];
  const stamps = evaluation.stampsOnSubmit;
  const improved = !previous || stamps > previous.bestStamps;
  state.records[exhibitId] = {
    bestStamps: Math.max(previous?.bestStamps ?? 0, stamps),
    attempts: (previous?.attempts ?? 0) + 1,
    savedAt: improved ? savedAt : previous!.savedAt,
  };
  state.totalSubmissions += 1;
  return {
    ok: true, exhibitId, stamps, matched: evaluation.matched, improved, firstEntry: !previous,
    firstPerfect: stamps === 3 && previous?.bestStamps !== 3,
  };
}

export function tasteShowcaseProgress(state: TasteShowcaseState): TasteShowcaseProgress {
  const records = Object.entries(state.records);
  return {
    entries: records.length,
    totalEntries: TASTE_SHOWCASE_EXHIBITS.length,
    stamps: records.reduce((sum, [, record]) => sum + record.bestStamps, 0),
    totalStamps: TASTE_SHOWCASE_EXHIBITS.length * 3,
    perfect: records.filter(([, record]) => record.bestStamps === 3).length,
    submissions: state.totalSubmissions,
    domains: new Set(records.map(([id]) => TASTE_SHOWCASE_BY_ID.get(id)?.domain).filter(Boolean)).size,
  };
}

export class TasteShowcaseStore {
  private state: TasteShowcaseState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-taste-showcase-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizeTasteShowcaseState(raw);
    this.persist();
  }

  get(): TasteShowcaseState { return this.state; }
  home(): TasteHomeSnapshot | null { return this.state.home; }
  record(exhibitId: string): TasteShowcaseRecord | null { return this.state.records[exhibitId] ?? null; }
  progress(): TasteShowcaseProgress { return tasteShowcaseProgress(this.state); }

  updateHome(analysis: HomeDesignAnalysis, itemIds: readonly string[]): TasteHomeSnapshot {
    this.state.home = homeSnapshotFromAnalysis(analysis, itemIds);
    this.persist();
    return this.state.home;
  }

  submit(exhibitId: string, context: TasteShowcaseContext): TasteShowcaseSubmitResult {
    const result = submitTasteShowcase(this.state, exhibitId, context);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
