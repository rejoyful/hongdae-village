export type GardenSeedId =
  | 'basil'
  | 'pansy'
  | 'mint'
  | 'rosemary'
  | 'marigold'
  | 'strawberry'
  | 'lavender'
  | 'hydrangea'
  | 'tomato'
  | 'monstera'
  | 'camellia'
  | 'moon_orchid';

export type GardenVariantId = 'sun' | 'rain' | 'moon';
export type GardenRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type GardenStage = 0 | 1 | 2 | 3;

export interface GardenSeedDef {
  id: GardenSeedId;
  name: string;
  note: string;
  rarity: GardenRarity;
  unlockAt: number;
  leaf: string;
  bloom: string;
  accent: string;
}

export interface GardenVariantDef {
  id: GardenVariantId;
  name: string;
  note: string;
}

export interface GardenPlot {
  seedId: GardenSeedId;
  variantId: GardenVariantId;
  stage: GardenStage;
}

export interface GardenState {
  version: 2;
  plots: Array<GardenPlot | null>;
  seedPackets: Record<GardenSeedId, number>;
  ingredients: Record<string, number>;
  specimens: string[];
  claimedUnlocks: GardenSeedId[];
  totalPlanted: number;
  totalTends: number;
  totalHarvests: number;
  totalIngredientsHarvested: number;
}

export interface GardenProgress {
  planted: number;
  ready: number;
  totalPlanted: number;
  totalTends: number;
  totalHarvests: number;
  speciesDiscovered: number;
  specimensDiscovered: number;
  totalSpecimens: number;
  unlockedSeeds: number;
  totalSeedPackets: number;
  pantryIngredients: number;
}

export type GardenActionResult =
  | { ok: true; kind: 'planted'; plotIndex: number; plot: GardenPlot }
  | { ok: true; kind: 'tended'; plotIndex: number; plot: GardenPlot }
  | { ok: true; kind: 'harvested'; plotIndex: number; specimenKey: string; ingredientKey: string; firstSpecimen: boolean; newlyUnlocked: GardenSeedId[] }
  | { ok: false; reason: 'bad-plot' | 'occupied' | 'empty' | 'locked-seed' | 'no-seed' | 'already-ready' | 'not-ready' };

export const GARDEN_PLOT_COUNT = 4;
export const GARDEN_STAGE_LABELS = ['씨앗', '새싹', '잎새', '수확 가능'] as const;

export const GARDEN_VARIANTS: readonly GardenVariantDef[] = [
  { id: 'sun', name: '햇살결', note: '따뜻한 빛을 머금은 선명한 표본' },
  { id: 'rain', name: '빗방울결', note: '비 온 뒤처럼 짙고 맑은 표본' },
  { id: 'moon', name: '달그늘결', note: '밤빛이 감도는 차분한 표본' },
] as const;

export const GARDEN_SEEDS: readonly GardenSeedDef[] = [
  { id: 'basil', name: '창가 바질', note: '작은 잎에서 상쾌한 향이 번져요.', rarity: 'common', unlockAt: 0, leaf: '#54835b', bloom: '#a8d384', accent: '#d9e7a6' },
  { id: 'pansy', name: '골목 팬지', note: '낮은 화분을 얼굴처럼 채우는 꽃.', rarity: 'common', unlockAt: 0, leaf: '#557851', bloom: '#d19a6f', accent: '#f0cd82' },
  { id: 'mint', name: '비 오는 민트', note: '서늘한 잎맥이 또렷한 허브예요.', rarity: 'common', unlockAt: 0, leaf: '#4f8b73', bloom: '#a7d1b1', accent: '#d7ead2' },
  { id: 'rosemary', name: '계단 로즈마리', note: '가느다란 잎이 계단 바람을 좋아해요.', rarity: 'uncommon', unlockAt: 1, leaf: '#587565', bloom: '#8aa6ad', accent: '#c3d3c8' },
  { id: 'marigold', name: '노을 메리골드', note: '해 질 무렵 가장 진한 주황빛을 내요.', rarity: 'uncommon', unlockAt: 2, leaf: '#63804e', bloom: '#d8893d', accent: '#f0bd55' },
  { id: 'strawberry', name: '옥상 딸기', note: '작은 열매가 난간 아래로 고개를 내밀어요.', rarity: 'uncommon', unlockAt: 4, leaf: '#4f7c4d', bloom: '#cf5e55', accent: '#f2d7b0' },
  { id: 'lavender', name: '새벽 라벤더', note: '이른 시간의 공기를 닮은 긴 꽃대.', rarity: 'rare', unlockAt: 6, leaf: '#5a7463', bloom: '#8a789f', accent: '#c5b6ca' },
  { id: 'hydrangea', name: '장마 수국', note: '빗물의 산도에 따라 표정이 달라져요.', rarity: 'rare', unlockAt: 8, leaf: '#4f705a', bloom: '#738dab', accent: '#bdc8d0' },
  { id: 'tomato', name: '철길 방울토마토', note: '기차 소리를 들으며 빨갛게 익는 열매.', rarity: 'rare', unlockAt: 11, leaf: '#4e744a', bloom: '#c75c46', accent: '#efaa64' },
  { id: 'monstera', name: '레코드 몬스테라', note: '갈라진 잎이 오래된 음반처럼 펼쳐져요.', rarity: 'rare', unlockAt: 15, leaf: '#3f6a50', bloom: '#73a16d', accent: '#b5c88d' },
  { id: 'camellia', name: '겨울 동백', note: '찬 골목에서도 단단한 붉은 꽃을 피워요.', rarity: 'legendary', unlockAt: 20, leaf: '#3f6550', bloom: '#a94d4b', accent: '#e5b282' },
  { id: 'moon_orchid', name: '달빛 난초', note: '서른 번 가까운 돌봄 끝에 만나는 희귀종.', rarity: 'legendary', unlockAt: 26, leaf: '#46675d', bloom: '#a59ab7', accent: '#e0d4c1' },
] as const;

const SEED_IDS = new Set<GardenSeedId>(GARDEN_SEEDS.map((seed) => seed.id));
const VARIANT_IDS = new Set<GardenVariantId>(GARDEN_VARIANTS.map((variant) => variant.id));

export const gardenSeedById = (id: GardenSeedId): GardenSeedDef => GARDEN_SEEDS.find((seed) => seed.id === id)!;
export const gardenVariantById = (id: GardenVariantId): GardenVariantDef => GARDEN_VARIANTS.find((variant) => variant.id === id)!;
export const gardenSpecimenKey = (seedId: GardenSeedId, variantId: GardenVariantId): string => `${seedId}:${variantId}`;

const cleanCount = (value: unknown, max = Number.MAX_SAFE_INTEGER): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.min(max, Math.floor(value)) : 0
);

function blankPackets(): Record<GardenSeedId, number> {
  return Object.fromEntries(GARDEN_SEEDS.map((seed) => [seed.id, seed.unlockAt === 0 ? 2 : 0])) as Record<GardenSeedId, number>;
}

export function freshGardenState(): GardenState {
  return {
    version: 2,
    plots: Array.from({ length: GARDEN_PLOT_COUNT }, () => null),
    seedPackets: blankPackets(),
    ingredients: {},
    specimens: [],
    claimedUnlocks: GARDEN_SEEDS.filter((seed) => seed.unlockAt === 0).map((seed) => seed.id),
    totalPlanted: 0,
    totalTends: 0,
    totalHarvests: 0,
    totalIngredientsHarvested: 0,
  };
}

function cleanPlot(value: unknown): GardenPlot | null {
  if (!value || typeof value !== 'object') return null;
  const plot = value as Partial<GardenPlot>;
  if (!SEED_IDS.has(plot.seedId as GardenSeedId) || !VARIANT_IDS.has(plot.variantId as GardenVariantId)) return null;
  const stage = cleanCount(plot.stage, 3) as GardenStage;
  return { seedId: plot.seedId as GardenSeedId, variantId: plot.variantId as GardenVariantId, stage };
}

export function normalizeGardenState(raw: unknown): GardenState {
  if (!raw || typeof raw !== 'object') return freshGardenState();
  const value = raw as Partial<GardenState>;
  const totalHarvests = cleanCount(value.totalHarvests);
  const packets = blankPackets();
  if (value.seedPackets && typeof value.seedPackets === 'object') {
    for (const seed of GARDEN_SEEDS) packets[seed.id] = cleanCount(value.seedPackets[seed.id], 999);
  }
  const specimens = Array.isArray(value.specimens)
    ? [...new Set(value.specimens.filter((key): key is string => {
      if (typeof key !== 'string') return false;
      const [seedId, variantId] = key.split(':');
      return SEED_IDS.has(seedId as GardenSeedId) && VARIANT_IDS.has(variantId as GardenVariantId);
    }))]
    : [];
  const ingredients: Record<string, number> = {};
  if (value.ingredients && typeof value.ingredients === 'object') {
    for (const [key, amount] of Object.entries(value.ingredients)) {
      const [seedId, variantId] = key.split(':');
      if (SEED_IDS.has(seedId as GardenSeedId) && VARIANT_IDS.has(variantId as GardenVariantId)) {
        ingredients[key] = cleanCount(amount, 999);
      }
    }
  }
  const claimed = new Set<GardenSeedId>(Array.isArray(value.claimedUnlocks)
    ? value.claimedUnlocks.filter((id): id is GardenSeedId => SEED_IDS.has(id as GardenSeedId))
    : []);
  for (const seed of GARDEN_SEEDS) {
    if (seed.unlockAt > totalHarvests || claimed.has(seed.id)) continue;
    claimed.add(seed.id);
    packets[seed.id] = Math.max(1, packets[seed.id]);
  }
  for (const seed of GARDEN_SEEDS.filter((item) => item.unlockAt === 0)) claimed.add(seed.id);
  const inputPlots = Array.isArray(value.plots) ? value.plots : [];
  return {
    version: 2,
    plots: Array.from({ length: GARDEN_PLOT_COUNT }, (_, index) => cleanPlot(inputPlots[index])),
    seedPackets: packets,
    ingredients,
    specimens,
    claimedUnlocks: [...claimed],
    totalPlanted: cleanCount(value.totalPlanted),
    totalTends: cleanCount(value.totalTends),
    totalHarvests,
    totalIngredientsHarvested: cleanCount(value.totalIngredientsHarvested),
  };
}

export function gardenSeedUnlocked(state: GardenState, seedId: GardenSeedId): boolean {
  return state.totalHarvests >= gardenSeedById(seedId).unlockAt;
}

export function gardenProgress(state: GardenState): GardenProgress {
  const species = new Set(state.specimens.map((key) => key.split(':')[0]));
  return {
    planted: state.plots.filter(Boolean).length,
    ready: state.plots.filter((plot) => plot?.stage === 3).length,
    totalPlanted: state.totalPlanted,
    totalTends: state.totalTends,
    totalHarvests: state.totalHarvests,
    speciesDiscovered: species.size,
    specimensDiscovered: state.specimens.length,
    totalSpecimens: GARDEN_SEEDS.length * GARDEN_VARIANTS.length,
    unlockedSeeds: GARDEN_SEEDS.filter((seed) => gardenSeedUnlocked(state, seed.id)).length,
    totalSeedPackets: Object.values(state.seedPackets).reduce((sum, count) => sum + count, 0),
    pantryIngredients: Object.values(state.ingredients).reduce((sum, count) => sum + count, 0),
  };
}

export function plantGardenPlot(state: GardenState, plotIndex: number, seedId: GardenSeedId): GardenActionResult {
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= GARDEN_PLOT_COUNT) return { ok: false, reason: 'bad-plot' };
  if (state.plots[plotIndex]) return { ok: false, reason: 'occupied' };
  if (!gardenSeedUnlocked(state, seedId)) return { ok: false, reason: 'locked-seed' };
  if ((state.seedPackets[seedId] ?? 0) < 1) return { ok: false, reason: 'no-seed' };
  const variantId = GARDEN_VARIANTS[(state.totalPlanted + plotIndex) % GARDEN_VARIANTS.length]!.id;
  const plot: GardenPlot = { seedId, variantId, stage: 0 };
  state.plots[plotIndex] = plot;
  state.seedPackets[seedId] -= 1;
  state.totalPlanted += 1;
  return { ok: true, kind: 'planted', plotIndex, plot: { ...plot } };
}

export function tendGardenPlot(state: GardenState, plotIndex: number): GardenActionResult {
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= GARDEN_PLOT_COUNT) return { ok: false, reason: 'bad-plot' };
  const plot = state.plots[plotIndex];
  if (!plot) return { ok: false, reason: 'empty' };
  if (plot.stage === 3) return { ok: false, reason: 'already-ready' };
  plot.stage = (plot.stage + 1) as GardenStage;
  state.totalTends += 1;
  return { ok: true, kind: 'tended', plotIndex, plot: { ...plot } };
}

export function harvestGardenPlot(state: GardenState, plotIndex: number): GardenActionResult {
  if (!Number.isInteger(plotIndex) || plotIndex < 0 || plotIndex >= GARDEN_PLOT_COUNT) return { ok: false, reason: 'bad-plot' };
  const plot = state.plots[plotIndex];
  if (!plot) return { ok: false, reason: 'empty' };
  if (plot.stage !== 3) return { ok: false, reason: 'not-ready' };
  const specimenKey = gardenSpecimenKey(plot.seedId, plot.variantId);
  const firstSpecimen = !state.specimens.includes(specimenKey);
  if (firstSpecimen) state.specimens.push(specimenKey);
  state.seedPackets[plot.seedId] = Math.min(999, (state.seedPackets[plot.seedId] ?? 0) + 2);
  state.ingredients[specimenKey] = Math.min(999, (state.ingredients[specimenKey] ?? 0) + 1);
  state.totalIngredientsHarvested += 1;
  state.plots[plotIndex] = null;
  const previousHarvests = state.totalHarvests;
  state.totalHarvests += 1;
  const newlyUnlocked = GARDEN_SEEDS.filter((seed) => (
    seed.unlockAt > previousHarvests && seed.unlockAt <= state.totalHarvests && !state.claimedUnlocks.includes(seed.id)
  )).map((seed) => seed.id);
  for (const seedId of newlyUnlocked) {
    state.claimedUnlocks.push(seedId);
    state.seedPackets[seedId] = Math.max(1, state.seedPackets[seedId]);
  }
  return { ok: true, kind: 'harvested', plotIndex, specimenKey, ingredientKey: specimenKey, firstSpecimen, newlyUnlocked };
}
