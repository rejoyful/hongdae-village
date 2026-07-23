import { PET_SPECIES } from './pets';
import { PET_PERSONALITIES, type PetPersonalityId } from './petProfiles';

export type PetOutingRouteId =
  | 'rail_sunwalk'
  | 'mural_alley'
  | 'yeonnam_lawn'
  | 'moon_channel'
  | 'record_lane'
  | 'rooftop_garden'
  | 'forest_edge'
  | 'dawn_square';

export interface PetOutingRequirement {
  affinity?: number;
  tricks?: number;
  memories?: number;
}

export interface PetOutingSouvenir {
  id: string;
  mark: string;
  name: string;
  note: string;
  threshold: 1 | 3 | 6;
}

export interface PetOutingRoute {
  id: PetOutingRouteId;
  code: string;
  name: string;
  district: string;
  description: string;
  palette: readonly [string, string, string, string];
  favorites: readonly [PetPersonalityId, PetPersonalityId];
  requirement?: PetOutingRequirement;
  souvenirs: readonly [PetOutingSouvenir, PetOutingSouvenir, PetOutingSouvenir];
}

export interface PetOutingContext {
  affinity: number;
  tricks: number;
  memories: number;
  personality: PetPersonalityId;
}

export interface PetOutingRecord {
  petId: string;
  routeId: PetOutingRouteId;
  points: number;
  walks: number;
  lastAt: number;
}

export interface PetOutingState {
  version: 1;
  records: Record<string, PetOutingRecord>;
  totalWalks: number;
}

export interface PetOutingProgress {
  totalWalks: number;
  routesVisited: number;
  totalRoutes: number;
  souvenirStamps: number;
  totalSouvenirs: number;
  completedRoutes: number;
  petPartners: number;
  pairings: number;
}

export interface PetOutingRouteView extends PetOutingRoute {
  unlocked: boolean;
  unlockHint: string;
  activePoints: number;
  archivePoints: number;
  stamps: number;
  favoriteMatch: boolean;
}

export type PetOutingResult =
  | {
    ok: true;
    routeId: PetOutingRouteId;
    gained: 1 | 2;
    points: number;
    favoriteMatch: boolean;
    newSouvenirs: PetOutingSouvenir[];
    firstRouteVisit: boolean;
    routeCompleted: boolean;
  }
  | { ok: false; reason: 'unknown-pet' | 'unknown-route' | 'locked-route' };

const souvenir = (id: string, mark: string, name: string, note: string, threshold: 1 | 3 | 6): PetOutingSouvenir => (
  { id, mark, name, note, threshold }
);

/** 8코스 × 3기념품. 코스마다 발견→친숙→완주의 1·3·6 발걸음 구조를 공유한다. */
export const PET_OUTING_ROUTES: readonly PetOutingRoute[] = [
  {
    id: 'rail_sunwalk', code: 'RAIL 01', name: '철길 햇살길', district: '경의선 숲길 입구',
    description: '낮은 철길 담장과 은행잎 사이를 천천히 걷는 첫 산책 코스예요.',
    palette: ['#69745f', '#b9ad79', '#d8c69a', '#745945'], favorites: ['gentle', 'calm'],
    souvenirs: [
      souvenir('rail_leaf', '잎', '은행잎 책갈피', '첫 햇살 아래 주운 납작한 잎', 1),
      souvenir('rail_ticket', '표', '작은 철길표', '세 번의 발자국이 찍힌 산책표', 3),
      souvenir('rail_bell', '종', '햇살 방울', '여섯 번째 산책에서 울린 황동 방울', 6),
    ],
  },
  {
    id: 'mural_alley', code: 'COLOR 02', name: '벽화 골목', district: '노을의 작업 벽',
    description: '물감 자국과 작은 스티커를 따라 둘만의 색을 찾는 골목이에요.',
    palette: ['#7b655b', '#b47868', '#c6a276', '#505f62'], favorites: ['curious', 'performer'],
    souvenirs: [
      souvenir('mural_chip', '색', '벽화 색조각', '벽 아래에서 발견한 마른 물감 조각', 1),
      souvenir('mural_sticker', '띠', '둘만의 스티커', '세 번 걸은 길을 표시한 작은 띠지', 3),
      souvenir('mural_palette', '팔', '손바닥 팔레트', '여섯 색이 겹쳐진 미니 팔레트', 6),
    ],
  },
  {
    id: 'yeonnam_lawn', code: 'LAWN 03', name: '연남 잔디쉼터', district: '느티나무 피크닉 존',
    description: '서두르지 않고 냄새를 맡고 쉬어 가는 넓은 잔디 코스입니다.',
    palette: ['#60735b', '#93a36f', '#d1c890', '#7b6045'], favorites: ['playful', 'gentle'],
    souvenirs: [
      souvenir('lawn_clover', '풀', '세잎 토끼풀', '처음 함께 발견한 푸른 잎', 1),
      souvenir('lawn_ribbon', '끈', '피크닉 매듭', '세 번의 쉼표를 묶어 둔 천 조각', 3),
      souvenir('lawn_ball', '공', '잔디 씨앗공', '여섯 바퀴 굴러도 잃어버리지 않은 공', 6),
    ],
  },
  {
    id: 'moon_channel', code: 'WATER 04', name: '달빛 수로', district: '동쪽 물정원 난간',
    description: '친해진 친구와 수면에 비친 불빛을 나란히 세어 보는 저녁 길이에요.',
    palette: ['#435c63', '#6f8783', '#c8ba8b', '#303c42'], favorites: ['calm', 'curious'],
    requirement: { affinity: 25 },
    souvenirs: [
      souvenir('channel_glass', '유', '둥근 물유리', '난간 아래서 반짝인 매끈한 유리', 1),
      souvenir('channel_knot', '매', '수로 매듭', '세 번의 저녁을 묶은 푸른 실', 3),
      souvenir('channel_moon', '달', '반달 수면패', '여섯 물결을 새긴 은빛 관찰패', 6),
    ],
  },
  {
    id: 'record_lane', code: 'VINYL 05', name: '레코드 골목', district: '비트창고 뒷문',
    description: '배운 트릭의 박자에 맞춰 오래된 음반 가게 사이를 걷는 리듬 코스예요.',
    palette: ['#5b4b45', '#8b6255', '#c09a69', '#343638'], favorites: ['performer', 'playful'],
    requirement: { tricks: 1 },
    souvenirs: [
      souvenir('record_label', '음', '미니 음반라벨', '첫 박자에 맞춰 굴러온 종이 라벨', 1),
      souvenir('record_pick', '픽', '산책 피크', '세 곡을 들은 뒤 받은 작은 기타 피크', 3),
      souvenir('record_single', '판', '둘만의 싱글판', '여섯 산책의 발소리를 새긴 검은 판', 6),
    ],
  },
  {
    id: 'rooftop_garden', code: 'ROOF 06', name: '옥상 화분길', district: '구름 아래 씨앗 연구소',
    description: '함께 만든 추억을 떠올리며 향이 다른 화분 사이를 지나는 코스입니다.',
    palette: ['#5f6c54', '#87906a', '#bf9f71', '#6c5140'], favorites: ['gentle', 'curious'],
    requirement: { memories: 2 },
    souvenirs: [
      souvenir('roof_seed', '씨', '바람 씨앗', '화분 가장자리에서 만난 가벼운 씨앗', 1),
      souvenir('roof_tag', '명', '동행 화분표', '세 번 맡은 향을 적은 작은 이름표', 3),
      souvenir('roof_windmill', '풍', '구름 바람개비', '여섯 번째 바람을 기억하는 미니 바람개비', 6),
    ],
  },
  {
    id: 'forest_edge', code: 'EDGE 07', name: '외곽숲 안전길', district: '보랏빛 경계 바깥',
    description: '충분히 친해지고 트릭도 익힌 친구와 안전 표식만 따라 걷는 모험 코스예요.',
    palette: ['#41584f', '#657765', '#b6a875', '#39433c'], favorites: ['brave', 'calm'],
    requirement: { affinity: 50, tricks: 2 },
    souvenirs: [
      souvenir('forest_acorn', '도', '참나무 도토리', '안전길 입구에서 주운 반질한 열매', 1),
      souvenir('forest_patch', '표', '순찰 천조각', '세 번 길을 지킨 동행 표식', 3),
      souvenir('forest_compass', '침', '작은 숲 나침반', '여섯 갈림길을 기억하는 나무 나침반', 6),
    ],
  },
  {
    id: 'dawn_square', code: 'DAWN 08', name: '새벽 첫차 광장', district: '홍대입구역 조용한 출구',
    description: '오래 함께한 친구와 첫차 전의 고요한 광장을 한 바퀴 도는 마지막 코스예요.',
    palette: ['#4b5660', '#737b7a', '#c2ad7d', '#343b42'], favorites: ['brave', 'performer'],
    requirement: { affinity: 80, memories: 3 },
    souvenirs: [
      souvenir('dawn_stub', '차', '첫차 승강권', '아직 개찰되지 않은 작은 기념표', 1),
      souvenir('dawn_light', '등', '새벽 유리등', '세 번의 새벽빛을 담은 유리 조각', 3),
      souvenir('dawn_badge', '별', '동행 새벽장', '여섯 바퀴를 완주한 친구의 마지막 표장', 6),
    ],
  },
] as const;

export const PET_OUTING_ROUTE_BY_ID = new Map(PET_OUTING_ROUTES.map((route) => [route.id, route]));
export const PET_OUTING_THRESHOLDS = [1, 3, 6] as const;

const PET_IDS = new Set(PET_SPECIES.map((pet) => pet.id));
const PERSONALITY_BY_ID = new Map(PET_PERSONALITIES.map((personality) => [personality.id, personality]));

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

const recordKey = (petId: string, routeId: PetOutingRouteId): string => `${petId}:${routeId}`;

export function freshPetOutingState(): PetOutingState {
  return { version: 1, records: {}, totalWalks: 0 };
}

export function normalizePetOutingState(raw: unknown): PetOutingState {
  if (!raw || typeof raw !== 'object') return freshPetOutingState();
  const value = raw as Partial<PetOutingState>;
  const records: Record<string, PetOutingRecord> = {};
  const input = value.records && typeof value.records === 'object' ? value.records as Record<string, unknown> : {};
  for (const entry of Object.values(input)) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<PetOutingRecord>;
    if (typeof candidate.petId !== 'string' || !PET_IDS.has(candidate.petId)) continue;
    if (typeof candidate.routeId !== 'string' || !PET_OUTING_ROUTE_BY_ID.has(candidate.routeId as PetOutingRouteId)) continue;
    const walks = cleanCount(candidate.walks);
    const points = Math.min(6, cleanCount(candidate.points));
    if (!walks || !points) continue;
    const routeId = candidate.routeId as PetOutingRouteId;
    records[recordKey(candidate.petId, routeId)] = {
      petId: candidate.petId,
      routeId,
      points,
      walks,
      lastAt: cleanCount(candidate.lastAt),
    };
  }
  const walked = Object.values(records).reduce((sum, record) => sum + record.walks, 0);
  return { version: 1, records, totalWalks: Math.max(cleanCount(value.totalWalks), walked) };
}

export function petOutingUnlockHint(route: PetOutingRoute, context: PetOutingContext): string {
  const requirement = route.requirement;
  if (!requirement) return '처음부터 걸을 수 있어요.';
  const missing: string[] = [];
  if ((requirement.affinity ?? 0) > context.affinity) missing.push(`친밀도 ${requirement.affinity}`);
  if ((requirement.tricks ?? 0) > context.tricks) missing.push(`트릭 ${requirement.tricks}개`);
  if ((requirement.memories ?? 0) > context.memories) missing.push(`기존 추억 ${requirement.memories}장`);
  return missing.length ? `${missing.join(' · ')} 조건이 필요해요.` : '이 친구와 걸을 준비가 됐어요.';
}

export function petOutingRouteUnlocked(route: PetOutingRoute, context: PetOutingContext): boolean {
  const requirement = route.requirement ?? {};
  return context.affinity >= (requirement.affinity ?? 0)
    && context.tricks >= (requirement.tricks ?? 0)
    && context.memories >= (requirement.memories ?? 0);
}

export function petOutingStampCount(points: number): number {
  return PET_OUTING_THRESHOLDS.filter((threshold) => points >= threshold).length;
}

export function petOutingArchivePoints(state: PetOutingState, routeId: PetOutingRouteId): number {
  return Math.max(0, ...Object.values(state.records).filter((record) => record.routeId === routeId).map((record) => record.points));
}

export function petOutingRouteViews(
  state: PetOutingState,
  petId: string,
  context: PetOutingContext,
): PetOutingRouteView[] {
  return PET_OUTING_ROUTES.map((route) => {
    const archivePoints = petOutingArchivePoints(state, route.id);
    return {
      ...route,
      unlocked: petOutingRouteUnlocked(route, context),
      unlockHint: petOutingUnlockHint(route, context),
      activePoints: state.records[recordKey(petId, route.id)]?.points ?? 0,
      archivePoints,
      stamps: petOutingStampCount(archivePoints),
      favoriteMatch: route.favorites.includes(context.personality),
    };
  });
}

export function walkPetOuting(
  state: PetOutingState,
  petId: string,
  routeId: PetOutingRouteId,
  context: PetOutingContext,
  walkedAt = Date.now(),
): PetOutingResult {
  if (!PET_IDS.has(petId)) return { ok: false, reason: 'unknown-pet' };
  const route = PET_OUTING_ROUTE_BY_ID.get(routeId);
  if (!route) return { ok: false, reason: 'unknown-route' };
  if (!petOutingRouteUnlocked(route, context)) return { ok: false, reason: 'locked-route' };

  const key = recordKey(petId, routeId);
  const previous = state.records[key];
  const previousArchive = petOutingArchivePoints(state, routeId);
  const favoriteMatch = route.favorites.includes(context.personality);
  const gained = favoriteMatch ? 2 : 1;
  const points = Math.min(6, (previous?.points ?? 0) + gained);
  state.records[key] = {
    petId,
    routeId,
    points,
    walks: (previous?.walks ?? 0) + 1,
    lastAt: cleanCount(walkedAt),
  };
  state.totalWalks += 1;
  const nextArchive = Math.max(previousArchive, points);
  const newSouvenirs = route.souvenirs.filter((item) => previousArchive < item.threshold && nextArchive >= item.threshold);
  return {
    ok: true,
    routeId,
    gained,
    points,
    favoriteMatch,
    newSouvenirs,
    firstRouteVisit: previousArchive === 0,
    routeCompleted: previousArchive < 6 && nextArchive >= 6,
  };
}

export function petOutingProgress(state: PetOutingState): PetOutingProgress {
  const archive = PET_OUTING_ROUTES.map((route) => petOutingArchivePoints(state, route.id));
  const records = Object.values(state.records);
  return {
    totalWalks: state.totalWalks,
    routesVisited: archive.filter((points) => points >= 1).length,
    totalRoutes: PET_OUTING_ROUTES.length,
    souvenirStamps: archive.reduce((sum, points) => sum + petOutingStampCount(points), 0),
    totalSouvenirs: PET_OUTING_ROUTES.length * PET_OUTING_THRESHOLDS.length,
    completedRoutes: archive.filter((points) => points >= 6).length,
    petPartners: new Set(records.map((record) => record.petId)).size,
    pairings: records.length,
  };
}

export function favoritePersonalityNames(route: PetOutingRoute): string {
  return route.favorites.map((id) => PERSONALITY_BY_ID.get(id)?.name ?? id).join(' · ');
}

export class PetOutingStore {
  private state: PetOutingState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-pet-outings-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizePetOutingState(raw);
    this.persist();
  }

  get(): PetOutingState { return this.state; }
  progress(): PetOutingProgress { return petOutingProgress(this.state); }
  views(petId: string, context: PetOutingContext): PetOutingRouteView[] { return petOutingRouteViews(this.state, petId, context); }

  walk(petId: string, routeId: PetOutingRouteId, context: PetOutingContext): PetOutingResult {
    const result = walkPetOuting(this.state, petId, routeId, context);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
