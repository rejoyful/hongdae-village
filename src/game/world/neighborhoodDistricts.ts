import { TILE } from '../config';

export type NeighborhoodDistrictId =
  | 'rooftop-homes'
  | 'cafe-lane'
  | 'central-square'
  | 'creative-alley'
  | 'companion-street'
  | 'station-gate'
  | 'outer-forest';

export interface NeighborhoodDistrictDef {
  id: NeighborhoodDistrictId;
  code: string;
  mark: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  safe: boolean;
  guideTarget: { tx: number; ty: number };
}

export interface NeighborhoodDistrictState {
  version: 1;
  discoveredIds: NeighborhoodDistrictId[];
  featuredId: NeighborhoodDistrictId | null;
}

export interface NeighborhoodDistrictView extends NeighborhoodDistrictDef {
  discovered: boolean;
  featured: boolean;
}

export interface NeighborhoodDistrictProgress {
  discovered: number;
  total: number;
  safeDiscovered: number;
  featured: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const NEIGHBORHOOD_DISTRICTS: readonly NeighborhoodDistrictDef[] = [
  {
    id: 'rooftop-homes', code: 'HOME 01', mark: '집', name: '옥상 주택가',
    subtitle: '창문과 화분 사이로 하루가 시작되는 곳',
    description: '나의 집, 옥상 정원과 오래된 주택 골목이 이어집니다.',
    color: '#9a765e', safe: true, guideTarget: { tx: 10, ty: 7 },
  },
  {
    id: 'cafe-lane', code: 'CAFE 02', mark: '잔', name: '모퉁이 카페길',
    subtitle: '빵 냄새와 저녁 불빛이 오래 머무는 길',
    description: '카페와 골목 주방, 레코드 건물의 북쪽 입구가 모입니다.',
    color: '#b06f59', safe: true, guideTarget: { tx: 18, ty: 8 },
  },
  {
    id: 'central-square', code: 'PLAZA 03', mark: '광', name: '취향 중앙광장',
    subtitle: '오늘 하고 싶은 일을 고르는 마을의 심장',
    description: '모험 일지, 버스킹, 전시회와 여러 생활 게시판이 모입니다.',
    color: '#9b815e', safe: true, guideTarget: { tx: 14, ty: 13 },
  },
  {
    id: 'creative-alley', code: 'MAKER 04', mark: '결', name: '살림 창작골목',
    subtitle: '옷과 물건이 자기만의 결을 얻는 작업실 거리',
    description: '아틀리에, 살림 쇼룸과 DIY 작업대가 나란히 있습니다.',
    color: '#7f7860', safe: true, guideTarget: { tx: 10, ty: 18 },
  },
  {
    id: 'companion-street', code: 'PAWS 05', mark: '발', name: '동행 산책길',
    subtitle: '작은 발자국과 물결 소리가 만나는 남동쪽 길',
    description: '펫샵, 물정원과 함께짓기 공간으로 이어집니다.',
    color: '#708064', safe: true, guideTarget: { tx: 21, ty: 20 },
  },
  {
    id: 'station-gate', code: 'GATE 06', mark: '문', name: '역 앞 산책문',
    subtitle: '처음 온 이웃과 오래 산 주민이 마주치는 입구',
    description: '첫 스폰, 작은 박물관과 남쪽 산책길을 잇는 안전 구역입니다.',
    color: '#6f7778', safe: true, guideTarget: { tx: 13, ty: 20 },
  },
  {
    id: 'outer-forest', code: 'FIELD 07', mark: '숲', name: '별빛 외곽숲',
    subtitle: '생활권 밖 생태를 선택해서 관찰하는 모험 지대',
    description: '보랏빛 경계 안에서만 자동 전투가 시작되고 길로 나오면 안전합니다.',
    color: '#596b58', safe: false, guideTarget: { tx: 28, ty: 8 },
  },
] as const;

export const NEIGHBORHOOD_DISTRICT_BY_ID = new Map(
  NEIGHBORHOOD_DISTRICTS.map((district) => [district.id, district]),
);

const DISTRICT_IDS = new Set<NeighborhoodDistrictId>(
  NEIGHBORHOOD_DISTRICTS.map((district) => district.id),
);

/**
 * 월드의 모든 유효 타일을 정확히 한 권역으로 분류한다.
 * 렌더 청크·지도·발견 기록이 같은 공간 규칙을 공유하기 위한 SSOT다.
 */
export function neighborhoodDistrictAt(tx: number, ty: number): NeighborhoodDistrictDef | null {
  if (!Number.isFinite(tx) || !Number.isFinite(ty) || tx < 0 || ty < 0 || tx >= 34 || ty >= 24) return null;
  if (tx >= 28) return NEIGHBORHOOD_DISTRICT_BY_ID.get('outer-forest')!;
  if (ty <= 8 && tx <= 13) return NEIGHBORHOOD_DISTRICT_BY_ID.get('rooftop-homes')!;
  if (ty <= 8) return NEIGHBORHOOD_DISTRICT_BY_ID.get('cafe-lane')!;
  if (ty >= 16 && tx <= 11) return NEIGHBORHOOD_DISTRICT_BY_ID.get('creative-alley')!;
  if (ty >= 14 && tx >= 17) return NEIGHBORHOOD_DISTRICT_BY_ID.get('companion-street')!;
  if (ty >= 16) return NEIGHBORHOOD_DISTRICT_BY_ID.get('station-gate')!;
  return NEIGHBORHOOD_DISTRICT_BY_ID.get('central-square')!;
}

export function neighborhoodDistrictAtWorld(x: number, y: number): NeighborhoodDistrictDef | null {
  return neighborhoodDistrictAt(Math.floor(x / TILE), Math.floor(y / TILE));
}

export function normalizeNeighborhoodDistrictState(raw: unknown): NeighborhoodDistrictState {
  const value = raw && typeof raw === 'object' ? raw as Partial<NeighborhoodDistrictState> : {};
  const discoveredIds = Array.isArray(value.discoveredIds)
    ? [...new Set(value.discoveredIds.filter((id): id is NeighborhoodDistrictId => (
      typeof id === 'string' && DISTRICT_IDS.has(id as NeighborhoodDistrictId)
    )))]
    : [];
  const featuredId = typeof value.featuredId === 'string'
    && DISTRICT_IDS.has(value.featuredId as NeighborhoodDistrictId)
    && discoveredIds.includes(value.featuredId as NeighborhoodDistrictId)
    ? value.featuredId as NeighborhoodDistrictId
    : null;
  return { version: 1, discoveredIds, featuredId };
}

export function neighborhoodDistrictViews(
  state: NeighborhoodDistrictState,
): NeighborhoodDistrictView[] {
  return NEIGHBORHOOD_DISTRICTS.map((district) => ({
    ...district,
    discovered: state.discoveredIds.includes(district.id),
    featured: state.featuredId === district.id,
  }));
}

export function neighborhoodDistrictProgress(
  state: NeighborhoodDistrictState,
): NeighborhoodDistrictProgress {
  const views = neighborhoodDistrictViews(state);
  return {
    discovered: views.filter((district) => district.discovered).length,
    total: views.length,
    safeDiscovered: views.filter((district) => district.safe && district.discovered).length,
    featured: state.featuredId ? 1 : 0,
  };
}

export class NeighborhoodDistrictStore {
  private readonly key: string;
  private readonly storage?: StorageLike;
  private state: NeighborhoodDistrictState;

  constructor(userId: string, storage?: StorageLike) {
    this.key = `hv-neighborhood-districts-v1:${userId}`;
    let raw: unknown = null;
    const source = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
    try {
      const saved = source?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.storage = source;
    this.state = normalizeNeighborhoodDistrictState(raw);
    this.persist();
  }

  get(): NeighborhoodDistrictState {
    return { ...this.state, discoveredIds: [...this.state.discoveredIds] };
  }

  views(): NeighborhoodDistrictView[] { return neighborhoodDistrictViews(this.state); }
  progress(): NeighborhoodDistrictProgress { return neighborhoodDistrictProgress(this.state); }

  discover(id: NeighborhoodDistrictId): 'discovered' | 'known' | 'invalid' {
    if (!DISTRICT_IDS.has(id)) return 'invalid';
    if (this.state.discoveredIds.includes(id)) return 'known';
    this.state = { ...this.state, discoveredIds: [...this.state.discoveredIds, id] };
    this.persist();
    return 'discovered';
  }

  feature(id: NeighborhoodDistrictId | null): 'featured' | 'cleared' | 'locked' | 'invalid' {
    if (id === null) {
      if (this.state.featuredId === null) return 'cleared';
      this.state = { ...this.state, featuredId: null }; this.persist(); return 'cleared';
    }
    if (!DISTRICT_IDS.has(id)) return 'invalid';
    if (!this.state.discoveredIds.includes(id)) return 'locked';
    this.state = { ...this.state, featuredId: this.state.featuredId === id ? null : id };
    this.persist();
    return this.state.featuredId ? 'featured' : 'cleared';
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 한정 */ }
  }
}
