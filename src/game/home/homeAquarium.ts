import { FISHING_SPECIES, type FishingProgress, type FishingState } from '../fishing/fishing';

export type AquariumFrameId = 'rain_lab' | 'moon_glass' | 'rooftop_steel' | 'record_wood' | 'greenhouse' | 'archive_black';
export type AquariumSubstrateId = 'river_stone' | 'white_sand' | 'moss_path' | 'brick_chip' | 'vinyl_gravel' | 'star_glass';
export type AquariumOrnamentId = 'reed' | 'bottle_caps' | 'mini_bridge' | 'cassette' | 'tiny_house' | 'moon_gate';

export interface AquariumOption<T extends string> {
  id: T;
  name: string;
  note: string;
  unlockAt: number;
  color: string;
  accent: string;
}

export interface HomeAquariumState {
  version: 1;
  frameId: AquariumFrameId;
  substrateId: AquariumSubstrateId;
  ornamentId: AquariumOrnamentId;
  fishIds: string[];
  saveCount: number;
}

export interface HomeAquariumProgress {
  configured: boolean;
  saveCount: number;
  displayedFish: number;
  displaySlots: number;
  framesUnlocked: number;
  substratesUnlocked: number;
  ornamentsUnlocked: number;
  totalFrames: number;
  totalSubstrates: number;
  totalOrnaments: number;
}

export interface HomeAquariumDraft {
  frameId: AquariumFrameId;
  substrateId: AquariumSubstrateId;
  ornamentId: AquariumOrnamentId;
  fishIds: string[];
}

export type HomeAquariumSaveFailureReason = 'no-fish' | 'locked-option' | 'undiscovered-fish' | 'too-many-fish';

export type HomeAquariumSaveResult =
  | { ok: true; firstSave: boolean; fishCount: number; saveCount: number }
  | { ok: false; reason: HomeAquariumSaveFailureReason };

export const AQUARIUM_FRAMES: readonly AquariumOption<AquariumFrameId>[] = [
  { id: 'rain_lab', name: '빗물 연구틀', note: '철길 자갈색 테두리와 낮은 수면선', unlockAt: 0, color: '#54645e', accent: '#a8b58c' },
  { id: 'moon_glass', name: '달빛 유리틀', note: '푸른 수로를 닮은 얇은 금속 프레임', unlockAt: 3, color: '#43546b', accent: '#a6baca' },
  { id: 'rooftop_steel', name: '옥상 강철틀', note: '물탱크 리벳이 남은 회청색 프레임', unlockAt: 6, color: '#667078', accent: '#d0c39d' },
  { id: 'record_wood', name: '레코드 원목틀', note: '오래된 음반장처럼 짙고 따뜻한 프레임', unlockAt: 9, color: '#6f5848', accent: '#c89d67' },
  { id: 'greenhouse', name: '온실 황동틀', note: '옥상 온실의 황동 모서리와 녹청빛 유리', unlockAt: 12, color: '#586b5e', accent: '#d1b36c' },
  { id: 'archive_black', name: '아카이브 흑철틀', note: '18종 완성을 위한 박물관형 검은 프레임', unlockAt: 18, color: '#30383d', accent: '#d6c48c' },
] as const;

export const AQUARIUM_SUBSTRATES: readonly AquariumOption<AquariumSubstrateId>[] = [
  { id: 'river_stone', name: '수로 자갈', note: '둥근 회갈색 자갈', unlockAt: 0, color: '#77766d', accent: '#a9a290' },
  { id: 'white_sand', name: '우윳빛 모래', note: '작은 생물의 색이 잘 보이는 모래', unlockAt: 6, color: '#bcb49c', accent: '#e2dac2' },
  { id: 'moss_path', name: '이끼 산책길', note: '짙은 초록 돌과 가느다란 수초', unlockAt: 12, color: '#526b59', accent: '#8ea477' },
  { id: 'brick_chip', name: '골목 벽돌칩', note: '오래된 붉은 벽돌을 둥글게 다듬은 바닥', unlockAt: 24, color: '#8b6255', accent: '#c19372' },
  { id: 'vinyl_gravel', name: '검은 음반자갈', note: '레코드 홈처럼 반짝이는 검은 자갈', unlockAt: 36, color: '#35383d', accent: '#7f8790' },
  { id: 'star_glass', name: '별유리 모래', note: '54개 크기 도장이 비치는 마지막 바닥', unlockAt: 54, color: '#687889', accent: '#d5c68e' },
] as const;

export const AQUARIUM_ORNAMENTS: readonly AquariumOption<AquariumOrnamentId>[] = [
  { id: 'reed', name: '빗물 수초', note: '가느다란 세 줄기 수초', unlockAt: 0, color: '#5d755c', accent: '#9eac79' },
  { id: 'bottle_caps', name: '병뚜껑 왕관', note: '골목가재가 모은 작은 왕관', unlockAt: 1, color: '#9a6a53', accent: '#d2ac6e' },
  { id: 'mini_bridge', name: '수로 다리', note: '달빛 수로의 난간을 줄인 모형', unlockAt: 3, color: '#667680', accent: '#b2c0bc' },
  { id: 'cassette', name: '방수 카세트', note: '레코드 골목에서 건진 투명 카세트', unlockAt: 6, color: '#645c72', accent: '#c78ca7' },
  { id: 'tiny_house', name: '빨간 지붕집', note: '물속 골목을 위한 작은 집', unlockAt: 12, color: '#85645a', accent: '#c97763' },
  { id: 'moon_gate', name: '반달 관찰문', note: '18개 금빛 기록을 위한 마지막 장식', unlockAt: 18, color: '#4f6070', accent: '#dfc985' },
] as const;

const FISH_IDS = new Set(FISHING_SPECIES.map((fish) => fish.id));
const FRAME_IDS = new Set(AQUARIUM_FRAMES.map((option) => option.id));
const SUBSTRATE_IDS = new Set(AQUARIUM_SUBSTRATES.map((option) => option.id));
const ORNAMENT_IDS = new Set(AQUARIUM_ORNAMENTS.map((option) => option.id));

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export const aquariumDisplaySlots = (speciesDiscovered: number): number => (
  speciesDiscovered >= 12 ? 3 : speciesDiscovered >= 6 ? 2 : speciesDiscovered >= 1 ? 1 : 0
);

export const aquariumOptionUnlocked = <T extends string>(option: AquariumOption<T>, current: number): boolean => current >= option.unlockAt;
export const aquariumFrameById = (id: AquariumFrameId) => AQUARIUM_FRAMES.find((option) => option.id === id)!;
export const aquariumSubstrateById = (id: AquariumSubstrateId) => AQUARIUM_SUBSTRATES.find((option) => option.id === id)!;
export const aquariumOrnamentById = (id: AquariumOrnamentId) => AQUARIUM_ORNAMENTS.find((option) => option.id === id)!;

export function freshHomeAquariumState(): HomeAquariumState {
  return { version: 1, frameId: 'rain_lab', substrateId: 'river_stone', ornamentId: 'reed', fishIds: [], saveCount: 0 };
}

export function normalizeHomeAquariumState(raw: unknown): HomeAquariumState {
  if (!raw || typeof raw !== 'object') return freshHomeAquariumState();
  const value = raw as Partial<HomeAquariumState>;
  return {
    version: 1,
    frameId: FRAME_IDS.has(value.frameId as AquariumFrameId) ? value.frameId as AquariumFrameId : 'rain_lab',
    substrateId: SUBSTRATE_IDS.has(value.substrateId as AquariumSubstrateId) ? value.substrateId as AquariumSubstrateId : 'river_stone',
    ornamentId: ORNAMENT_IDS.has(value.ornamentId as AquariumOrnamentId) ? value.ornamentId as AquariumOrnamentId : 'reed',
    fishIds: Array.isArray(value.fishIds)
      ? [...new Set(value.fishIds.filter((id): id is string => typeof id === 'string' && FISH_IDS.has(id)))].slice(0, 3)
      : [],
    saveCount: cleanCount(value.saveCount),
  };
}

export function homeAquariumProgress(state: HomeAquariumState, fishing: FishingProgress): HomeAquariumProgress {
  return {
    configured: state.saveCount > 0 && state.fishIds.length > 0,
    saveCount: state.saveCount,
    displayedFish: state.fishIds.length,
    displaySlots: aquariumDisplaySlots(fishing.speciesDiscovered),
    framesUnlocked: AQUARIUM_FRAMES.filter((option) => aquariumOptionUnlocked(option, fishing.speciesDiscovered)).length,
    substratesUnlocked: AQUARIUM_SUBSTRATES.filter((option) => aquariumOptionUnlocked(option, fishing.recordStamps)).length,
    ornamentsUnlocked: AQUARIUM_ORNAMENTS.filter((option) => aquariumOptionUnlocked(option, fishing.goldRecords)).length,
    totalFrames: AQUARIUM_FRAMES.length,
    totalSubstrates: AQUARIUM_SUBSTRATES.length,
    totalOrnaments: AQUARIUM_ORNAMENTS.length,
  };
}

export function validateHomeAquariumDraft(
  draft: HomeAquariumDraft,
  fishingState: FishingState,
  fishingProgress: FishingProgress,
): HomeAquariumSaveFailureReason | null {
  if (draft.fishIds.length === 0) return 'no-fish';
  if (draft.fishIds.length > aquariumDisplaySlots(fishingProgress.speciesDiscovered)) return 'too-many-fish';
  if (draft.fishIds.some((id) => !FISH_IDS.has(id) || !fishingState.records[id])) return 'undiscovered-fish';
  const frame = AQUARIUM_FRAMES.find((option) => option.id === draft.frameId);
  const substrate = AQUARIUM_SUBSTRATES.find((option) => option.id === draft.substrateId);
  const ornament = AQUARIUM_ORNAMENTS.find((option) => option.id === draft.ornamentId);
  if (!frame || !substrate || !ornament
    || !aquariumOptionUnlocked(frame, fishingProgress.speciesDiscovered)
    || !aquariumOptionUnlocked(substrate, fishingProgress.recordStamps)
    || !aquariumOptionUnlocked(ornament, fishingProgress.goldRecords)) return 'locked-option';
  return null;
}

export function applyHomeAquariumDraft(
  state: HomeAquariumState,
  draft: HomeAquariumDraft,
  fishingState: FishingState,
  fishingProgress: FishingProgress,
): HomeAquariumSaveResult {
  const reason = validateHomeAquariumDraft(draft, fishingState, fishingProgress);
  if (reason) return { ok: false, reason };
  const firstSave = state.saveCount === 0;
  state.frameId = draft.frameId;
  state.substrateId = draft.substrateId;
  state.ornamentId = draft.ornamentId;
  state.fishIds = [...new Set(draft.fishIds)].slice(0, 3);
  state.saveCount += 1;
  return { ok: true, firstSave, fishCount: state.fishIds.length, saveCount: state.saveCount };
}

export function aquariumSignature(state: HomeAquariumState): string {
  return [state.frameId, state.substrateId, state.ornamentId, ...state.fishIds].join('-').replace(/[^a-z0-9_-]/g, '');
}
