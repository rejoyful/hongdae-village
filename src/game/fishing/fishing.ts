export type FishingWaterId = 'rail_garden' | 'moon_channel' | 'rooftop_reservoir';
export type FishingLureId = 'crumb' | 'herb' | 'glimmer';
export type FishingRank = 'bronze' | 'silver' | 'gold';
export type FishShape = 'minnow' | 'round' | 'eel' | 'goby' | 'shrimp' | 'crayfish' | 'catfish' | 'carp' | 'betta' | 'puffer' | 'jelly';

export interface FishingWaterDef {
  id: FishingWaterId;
  name: string;
  shortName: string;
  note: string;
  palette: readonly [string, string, string, string];
}

export interface FishingLureDef {
  id: FishingLureId;
  name: string;
  note: string;
  mark: string;
}

export interface FishDef {
  id: string;
  name: string;
  waterId: FishingWaterId;
  lureId: FishingLureId;
  rarity: '골목' | '반짝' | '비밀';
  note: string;
  baseCm: number;
  goldCm: number;
  shape: FishShape;
  body: string;
  accent: string;
}

export interface FishingRecord {
  catches: number;
  maxSizeCm: number;
  rank: FishingRank;
}

export interface FishingState {
  version: 1;
  totalCatches: number;
  records: Record<string, FishingRecord>;
  lastCatch: { fishId: string; waterId: FishingWaterId; lureId: FishingLureId; sizeCm: number } | null;
}

export interface FishingProgress {
  totalCatches: number;
  speciesDiscovered: number;
  recordStamps: number;
  goldRecords: number;
  totalSpecies: number;
  totalStamps: number;
}

export interface FishingCatchResult {
  fishId: string;
  waterId: FishingWaterId;
  lureId: FishingLureId;
  sizeCm: number;
  rank: FishingRank;
  firstCatch: boolean;
  newRank: boolean;
  previousSizeCm: number;
  catches: number;
}

export const FISHING_WATERS: readonly FishingWaterDef[] = [
  { id: 'rail_garden', name: '철길 빗물정원', shortName: '빗물정원', note: '자갈과 수초 사이로 작은 토종 생물이 모이는 낮은 물길.', palette: ['#18292b', '#29484a', '#47706b', '#9bae86'] },
  { id: 'moon_channel', name: '달빛 수로', shortName: '달빛 수로', note: '레코드 골목 아래를 흐르는 푸른 수로. 밤이면 비늘이 더 또렷해져요.', palette: ['#171f32', '#283b59', '#476d82', '#a7bed0'] },
  { id: 'rooftop_reservoir', name: '옥상 구름저수조', shortName: '구름저수조', note: '빗물과 상상이 함께 고인 옥상 물탱크. 조금 이상한 친구들도 삽니다.', palette: ['#24293b', '#46516a', '#70859a', '#d0c7af'] },
] as const;

export const FISHING_LURES: readonly FishingLureDef[] = [
  { id: 'crumb', name: '빵가루 매듭', note: '둥글고 친근한 입맛을 먼저 부릅니다.', mark: '빵' },
  { id: 'herb', name: '허브실 매듭', note: '수초 곁의 조용한 생물을 먼저 부릅니다.', mark: '잎' },
  { id: 'glimmer', name: '반짝구슬 매듭', note: '달빛과 네온을 좋아하는 생물을 먼저 부릅니다.', mark: '빛' },
] as const;

export const FISHING_SPECIES: readonly FishDef[] = [
  { id: 'rail_minnow', name: '철길 피라미', waterId: 'rail_garden', lureId: 'crumb', rarity: '골목', note: '기차 진동이 오면 은빛 옆선을 반짝이며 모래 아래로 숨는다.', baseCm: 5.4, goldCm: 10.8, shape: 'minnow', body: '#b7c2aa', accent: '#d8b56f' },
  { id: 'willow_fish', name: '버들치', waterId: 'rail_garden', lureId: 'herb', rarity: '골목', note: '버드나무 그림자가 길어지는 오후를 가장 좋아한다.', baseCm: 6.2, goldCm: 12.5, shape: 'minnow', body: '#8fa38c', accent: '#d2c793' },
  { id: 'alley_crucian', name: '골목 참붕어', waterId: 'rail_garden', lureId: 'crumb', rarity: '반짝', note: '빗물받이의 동그란 물결을 따라 천천히 도는 묵직한 손님.', baseCm: 8.8, goldCm: 18.4, shape: 'round', body: '#9b9674', accent: '#d5aa68' },
  { id: 'pansy_bitterling', name: '팬지 각시붕어', waterId: 'rail_garden', lureId: 'glimmer', rarity: '반짝', note: '팬지 꽃잎 같은 자줏빛 점이 꼬리지느러미에 남아 있다.', baseCm: 4.3, goldCm: 8.9, shape: 'round', body: '#a88f9a', accent: '#d5b6c0' },
  { id: 'mottled_goby', name: '자갈 얼룩동사리', waterId: 'rail_garden', lureId: 'herb', rarity: '골목', note: '자갈과 꼭 닮은 얼굴로 가만히 있다가 눈만 데굴 굴린다.', baseCm: 5.7, goldCm: 11.6, shape: 'goby', body: '#867d67', accent: '#b9aa83' },
  { id: 'rain_loach', name: '장화 미꾸리', waterId: 'rail_garden', lureId: 'herb', rarity: '비밀', note: '비 오는 날 장화 그림자가 보이면 진흙 속에서 슬쩍 올라온다.', baseCm: 9.5, goldCm: 20.2, shape: 'eel', body: '#796a59', accent: '#b89b72' },

  { id: 'silver_medaka', name: '은빛 송사리', waterId: 'moon_channel', lureId: 'glimmer', rarity: '골목', note: '가로등 하나를 수십 조각으로 나눠 등에 싣고 다닌다.', baseCm: 3.6, goldCm: 7.2, shape: 'minnow', body: '#aebfca', accent: '#e5dfb7' },
  { id: 'dawn_goby', name: '새벽 망둑', waterId: 'moon_channel', lureId: 'herb', rarity: '골목', note: '첫차 시간 직전, 수로 벽의 이끼 계단을 성큼성큼 오른다.', baseCm: 5.2, goldCm: 10.6, shape: 'goby', body: '#718b8b', accent: '#d38f79' },
  { id: 'glass_shrimp', name: '유리 새우', waterId: 'moon_channel', lureId: 'crumb', rarity: '반짝', note: '몸을 통과한 간판 불빛이 아주 작은 무지개가 된다.', baseCm: 2.8, goldCm: 5.8, shape: 'shrimp', body: '#b6ced0', accent: '#f0d6bd' },
  { id: 'blue_crayfish', name: '푸른 골목가재', waterId: 'moon_channel', lureId: 'herb', rarity: '반짝', note: '병뚜껑을 왕관처럼 모으는 수로 아래의 작은 수집가.', baseCm: 7.1, goldCm: 15.2, shape: 'crayfish', body: '#587f94', accent: '#a5c3c8' },
  { id: 'moon_catfish', name: '달무늬 메기', waterId: 'moon_channel', lureId: 'crumb', rarity: '비밀', note: '수염 끝의 반달 무늬로 물살의 방향을 읽는다.', baseCm: 12.4, goldCm: 27.5, shape: 'catfish', body: '#59657a', accent: '#d3c68f' },
  { id: 'star_carp', name: '별비늘 잉어', waterId: 'moon_channel', lureId: 'glimmer', rarity: '비밀', note: '비늘 세 장만 별빛처럼 밝아서 수로의 소원을 모은다는 소문이 있다.', baseCm: 14.2, goldCm: 31.8, shape: 'carp', body: '#80799c', accent: '#e5c57f' },

  { id: 'rain_guppy', name: '빗물 구피', waterId: 'rooftop_reservoir', lureId: 'crumb', rarity: '골목', note: '빗방울이 떨어질 때마다 꼬리를 작은 우산처럼 활짝 편다.', baseCm: 3.1, goldCm: 6.5, shape: 'minnow', body: '#82a5a1', accent: '#e7b86e' },
  { id: 'cloud_betta', name: '구름 베타', waterId: 'rooftop_reservoir', lureId: 'glimmer', rarity: '반짝', note: '지느러미가 흐린 날의 구름처럼 겹겹이 천천히 풀린다.', baseCm: 4.8, goldCm: 9.7, shape: 'betta', body: '#8796bd', accent: '#d4c7de' },
  { id: 'rooftop_goldfish', name: '옥상 금붕어', waterId: 'rooftop_reservoir', lureId: 'crumb', rarity: '골목', note: '물탱크 점검표 아래에서 주황빛 꼬리를 흔드는 단골.', baseCm: 7.5, goldCm: 16.4, shape: 'round', body: '#d09255', accent: '#f1d29b' },
  { id: 'moss_puffer', name: '이끼 복어', waterId: 'rooftop_reservoir', lureId: 'herb', rarity: '반짝', note: '놀라면 초록 점이 돋아 작은 이끼 화분처럼 보인다.', baseCm: 5.9, goldCm: 12.1, shape: 'puffer', body: '#718b6d', accent: '#bfd08e' },
  { id: 'neon_medaka', name: '네온 송사리', waterId: 'rooftop_reservoir', lureId: 'glimmer', rarity: '비밀', note: '늦은 밤 클럽 간판의 분홍과 파랑을 얇은 선으로 품는다.', baseCm: 3.9, goldCm: 8.1, shape: 'minnow', body: '#5f91ad', accent: '#ec8fc1' },
  { id: 'umbrella_jelly', name: '우산 해파리', waterId: 'rooftop_reservoir', lureId: 'herb', rarity: '비밀', note: '어디서 왔는지는 아무도 모르지만 비 오는 옥상에서는 늘 한 마리쯤 보인다.', baseCm: 6.6, goldCm: 13.8, shape: 'jelly', body: '#9b94b8', accent: '#d8cadf' },
] as const;

const SPECIES_BY_ID = new Map(FISHING_SPECIES.map((fish) => [fish.id, fish]));
const WATER_IDS = new Set(FISHING_WATERS.map((water) => water.id));
const LURE_IDS = new Set(FISHING_LURES.map((lure) => lure.id));
const RANK_VALUE: Record<FishingRank, number> = { bronze: 1, silver: 2, gold: 3 };

const cleanInt = (value: unknown, max = Number.MAX_SAFE_INTEGER): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.min(max, Math.floor(value)) : 0
);

const cleanSize = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value * 10) / 10 : 0
);

export const fishById = (id: string): FishDef => SPECIES_BY_ID.get(id)!;
export const fishingWaterById = (id: FishingWaterId): FishingWaterDef => FISHING_WATERS.find((water) => water.id === id)!;
export const fishingLureById = (id: FishingLureId): FishingLureDef => FISHING_LURES.find((lure) => lure.id === id)!;
export const fishingSpeciesForWater = (id: FishingWaterId): FishDef[] => FISHING_SPECIES.filter((fish) => fish.waterId === id);

export function fishingRankForSize(fish: FishDef, sizeCm: number): FishingRank {
  const silver = fish.baseCm + (fish.goldCm - fish.baseCm) * (2 / 3);
  if (sizeCm >= fish.goldCm) return 'gold';
  if (sizeCm >= silver) return 'silver';
  return 'bronze';
}

export function freshFishingState(): FishingState {
  return { version: 1, totalCatches: 0, records: {}, lastCatch: null };
}

export function normalizeFishingState(raw: unknown): FishingState {
  if (!raw || typeof raw !== 'object') return freshFishingState();
  const value = raw as Partial<FishingState>;
  const records: Record<string, FishingRecord> = {};
  if (value.records && typeof value.records === 'object') {
    for (const [fishId, recordRaw] of Object.entries(value.records)) {
      const fish = SPECIES_BY_ID.get(fishId);
      if (!fish || !recordRaw || typeof recordRaw !== 'object') continue;
      const record = recordRaw as Partial<FishingRecord>;
      const catches = cleanInt(record.catches, 999_999);
      const maxSizeCm = cleanSize(record.maxSizeCm);
      if (!catches || !maxSizeCm) continue;
      records[fishId] = { catches, maxSizeCm, rank: fishingRankForSize(fish, maxSizeCm) };
    }
  }
  let lastCatch: FishingState['lastCatch'] = null;
  if (value.lastCatch && typeof value.lastCatch === 'object') {
    const last = value.lastCatch as FishingState['lastCatch'];
    if (last && SPECIES_BY_ID.has(last.fishId) && WATER_IDS.has(last.waterId) && LURE_IDS.has(last.lureId) && cleanSize(last.sizeCm)) {
      lastCatch = { fishId: last.fishId, waterId: last.waterId, lureId: last.lureId, sizeCm: cleanSize(last.sizeCm) };
    }
  }
  const recordCatches = Object.values(records).reduce((sum, record) => sum + record.catches, 0);
  return { version: 1, records, totalCatches: Math.max(cleanInt(value.totalCatches), recordCatches), lastCatch };
}

export function fishingProgress(state: FishingState): FishingProgress {
  const records = Object.values(state.records);
  return {
    totalCatches: state.totalCatches,
    speciesDiscovered: records.length,
    recordStamps: records.reduce((sum, record) => sum + RANK_VALUE[record.rank], 0),
    goldRecords: records.filter((record) => record.rank === 'gold').length,
    totalSpecies: FISHING_SPECIES.length,
    totalStamps: FISHING_SPECIES.length * 3,
  };
}

/**
 * 선택한 물가의 빈 도감 칸을 먼저 채운다. 매듭은 출현 제한이 아니라 우선순위라서
 * 초보자가 어떤 선택을 해도 여섯 번 안에 그 물가의 여섯 생물을 모두 만난다.
 */
export function catchFish(state: FishingState, waterId: FishingWaterId, lureId: FishingLureId): FishingCatchResult {
  const waterIndex = FISHING_WATERS.findIndex((water) => water.id === waterId);
  const lureIndex = FISHING_LURES.findIndex((lure) => lure.id === lureId);
  const candidates = fishingSpeciesForWater(waterId)
    .sort((a, b) => Number(b.lureId === lureId) - Number(a.lureId === lureId));
  const rotate = (state.totalCatches + Math.max(0, waterIndex) * 2 + Math.max(0, lureIndex)) % candidates.length;
  const ordered = [...candidates.slice(rotate), ...candidates.slice(0, rotate)];
  const fish = ordered.find((candidate) => !state.records[candidate.id]) ?? ordered[0]!;
  const previous = state.records[fish.id];
  const firstCatch = !previous;
  const catches = (previous?.catches ?? 0) + 1;
  const step = (fish.goldCm - fish.baseCm) / 3;
  // 금빛 기준을 넘어선 뒤에도 매번 0.1cm 이상 커져 중복 낚시가 헛되지 않는다.
  const sizeCm = Math.round((fish.baseCm + step * catches) * 10) / 10;
  const rank = fishingRankForSize(fish, sizeCm);
  const newRank = !previous || RANK_VALUE[rank] > RANK_VALUE[previous.rank];
  state.records[fish.id] = { catches, maxSizeCm: sizeCm, rank };
  state.totalCatches += 1;
  state.lastCatch = { fishId: fish.id, waterId, lureId, sizeCm };
  return {
    fishId: fish.id, waterId, lureId, sizeCm, rank, firstCatch, newRank,
    previousSizeCm: previous?.maxSizeCm ?? 0, catches,
  };
}

export const fishingRankLabel = (rank: FishingRank): string => ({ bronze: '동빛', silver: '은빛', gold: '금빛' })[rank];
export const fishingRankValue = (rank: FishingRank): number => RANK_VALUE[rank];
