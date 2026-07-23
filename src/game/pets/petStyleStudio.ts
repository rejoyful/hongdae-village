import { isPetAccessoryId, isPetPersonalityId, type PetAccessoryId, type PetPersonalityId } from './petProfiles';
import { petById } from './pets';

export const PET_STYLE_SLOT_COUNT = 6;
export const PET_STYLE_FEATURED_MAX = 3;

export const PET_STYLE_BACKDROPS = [
  { id: 'alley_neon', mark: '빛', code: 'ALLEY NEON', name: '심야 간판 골목', note: '보라 간판과 분홍 반사광', colors: ['#211d30', '#51406a', '#b85f86', '#efc486'] },
  { id: 'cozy_home', mark: '집', code: 'COZY HOME', name: '우리 집 한구석', note: '원목 선반과 크림 스탠드', colors: ['#302523', '#725141', '#c28d61', '#edd7aa'] },
  { id: 'roof_garden', mark: '잎', code: 'ROOF GARDEN', name: '옥상 초록 오후', note: '화분과 햇살이 남은 자리', colors: ['#213128', '#506e52', '#91aa6c', '#e6d7a3'] },
  { id: 'rain_window', mark: '비', code: 'RAIN WINDOW', name: '비 갠 창가', note: '청록 유리와 젖은 골목빛', colors: ['#1f2b38', '#466878', '#76a1a5', '#d8dfb6'] },
  { id: 'little_stage', mark: '무', code: 'LITTLE STAGE', name: '작은 공연 무대', note: '박수와 금빛 조명이 머무는 곳', colors: ['#30202b', '#754458', '#d17a68', '#efd08d'] },
  { id: 'forest_star', mark: '별', code: 'FOREST STAR', name: '외곽숲 별자리', note: '짙은 잎과 작은 별이 켜진 밤', colors: ['#1d2b29', '#405e50', '#7e976d', '#ded08d'] },
] as const;

export const PET_STYLE_POSES = [
  { id: 'hello', mark: '안', code: 'HELLO', name: '첫 인사', note: '정면에서 반갑게 마주 보는 장면' },
  { id: 'look_back', mark: '뒤', code: 'LOOK BACK', name: '돌아보기', note: '함께 오는지 한 번 더 확인하는 장면' },
  { id: 'tiny_step', mark: '톡', code: 'TINY STEP', name: '사뿐한 걸음', note: '한 발 먼저 나아가는 산책 장면' },
  { id: 'daydream', mark: '꿈', code: 'DAYDREAM', name: '느긋한 꿈', note: '좋아하는 자리에서 잠깐 쉬는 장면' },
  { id: 'spotlight', mark: '별', code: 'SPOTLIGHT', name: '나의 주인공', note: '배운 몸짓을 자랑하는 대표 장면' },
] as const;

export type PetStyleBackdropId = typeof PET_STYLE_BACKDROPS[number]['id'];
export type PetStylePoseId = typeof PET_STYLE_POSES[number]['id'];

export interface PetStyleDraft {
  petId: string;
  petName: string;
  personalityId: PetPersonalityId;
  accessoryId: PetAccessoryId;
  backdropId: PetStyleBackdropId;
  poseId: PetStylePoseId;
}

/** 다른 이웃에게 공개해도 되는 최소 코디 스냅샷. 별명·저장 ID·시각은 포함하지 않는다. */
export type PetStylePublicCard = Omit<PetStyleDraft, 'petName'>;

export interface PetStyleCard extends PetStyleDraft {
  id: string;
  savedAt: number;
}

export interface PetStyleStudioState {
  version: 1;
  slots: Array<PetStyleCard | null>;
  featuredIds: string[];
  discoveries: string[];
  totalCaptures: number;
  applies: number;
}

export interface PetStyleStudioProgress {
  savedCards: number;
  totalCaptures: number;
  discoveries: number;
  pets: number;
  personalities: number;
  accessories: number;
  backdrops: number;
  poses: number;
  featured: number;
  applies: number;
}

export interface PetStyleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type PetStyleSaveResult = 'saved' | 'replaced' | 'invalid';
export type PetStyleFeatureResult = 'featured' | 'cleared' | 'full' | 'missing';

const backdropIds = new Set<string>(PET_STYLE_BACKDROPS.map((item) => item.id));
const poseIds = new Set<string>(PET_STYLE_POSES.map((item) => item.id));
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);
const safeName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[<>\n\r]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || fallback;
};

function normalizeDraft(raw: unknown): PetStyleDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PetStyleDraft>;
  const species = typeof value.petId === 'string' ? petById(value.petId) : null;
  if (!species || !isPetPersonalityId(value.personalityId) || !isPetAccessoryId(value.accessoryId)
    || !backdropIds.has(value.backdropId ?? '') || !poseIds.has(value.poseId ?? '')) return null;
  return {
    petId: species.id,
    petName: safeName(value.petName, species.name),
    personalityId: value.personalityId,
    accessoryId: value.accessoryId,
    backdropId: value.backdropId as PetStyleBackdropId,
    poseId: value.poseId as PetStylePoseId,
  };
}

export function normalizePetStylePublicCard(raw: unknown): PetStylePublicCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PetStylePublicCard>;
  const species = typeof value.petId === 'string' ? petById(value.petId) : null;
  if (!species || !isPetPersonalityId(value.personalityId) || !isPetAccessoryId(value.accessoryId)
    || !backdropIds.has(value.backdropId ?? '') || !poseIds.has(value.poseId ?? '')) return null;
  return {
    petId: species.id,
    personalityId: value.personalityId,
    accessoryId: value.accessoryId,
    backdropId: value.backdropId as PetStyleBackdropId,
    poseId: value.poseId as PetStylePoseId,
  };
}

export function normalizePetStyleCard(raw: unknown): PetStyleCard | null {
  const draft = normalizeDraft(raw);
  if (!draft || !raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PetStyleCard>;
  if (typeof value.id !== 'string' || !value.id) return null;
  return { ...draft, id: value.id.slice(0, 80), savedAt: cleanCount(value.savedAt) };
}

const discoveryKey = (draft: PetStyleDraft): string => (
  `${draft.petId}:${draft.personalityId}:${draft.accessoryId}:${draft.backdropId}:${draft.poseId}`
);
const isDiscoveryKey = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const [petId, personalityId, accessoryId, backdropId, poseId, extra] = value.split(':');
  return extra === undefined && !!petById(petId ?? '')
    && isPetPersonalityId(personalityId) && isPetAccessoryId(accessoryId)
    && backdropIds.has(backdropId ?? '') && poseIds.has(poseId ?? '');
};

export function freshPetStyleStudioState(): PetStyleStudioState {
  return {
    version: 1,
    slots: Array.from({ length: PET_STYLE_SLOT_COUNT }, () => null),
    featuredIds: [],
    discoveries: [],
    totalCaptures: 0,
    applies: 0,
  };
}

export function normalizePetStyleStudioState(raw: unknown): PetStyleStudioState {
  if (!raw || typeof raw !== 'object') return freshPetStyleStudioState();
  const value = raw as Partial<PetStyleStudioState>;
  const seen = new Set<string>();
  const input = Array.isArray(value.slots) ? value.slots : [];
  const slots = Array.from({ length: PET_STYLE_SLOT_COUNT }, (_, index) => {
    const card = normalizePetStyleCard(input[index]);
    if (!card || seen.has(card.id)) return null;
    seen.add(card.id);
    return card;
  });
  const featuredIds = Array.isArray(value.featuredIds)
    ? [...new Set(value.featuredIds.filter((id): id is string => typeof id === 'string' && seen.has(id)))].slice(0, PET_STYLE_FEATURED_MAX)
    : [];
  const discoveries = Array.isArray(value.discoveries)
    ? [...new Set(value.discoveries.filter(isDiscoveryKey))].slice(0, 1000)
    : [];
  return {
    version: 1,
    slots,
    featuredIds,
    discoveries,
    totalCaptures: Math.max(cleanCount(value.totalCaptures), slots.filter(Boolean).length, discoveries.length),
    applies: cleanCount(value.applies),
  };
}

export function petStyleStudioProgress(state: PetStyleStudioState): PetStyleStudioProgress {
  const parts = state.discoveries.map((key) => key.split(':'));
  return {
    savedCards: state.slots.filter(Boolean).length,
    totalCaptures: state.totalCaptures,
    discoveries: state.discoveries.length,
    pets: new Set(parts.map((part) => part[0])).size,
    personalities: new Set(parts.map((part) => part[1])).size,
    accessories: new Set(parts.map((part) => part[2])).size,
    backdrops: new Set(parts.map((part) => part[3])).size,
    poses: new Set(parts.map((part) => part[4])).size,
    featured: state.featuredIds.length,
    applies: state.applies,
  };
}

function browserStorage(): PetStyleStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class PetStyleStudioStore {
  private state: PetStyleStudioState;
  private readonly key: string;

  constructor(userId: string, private readonly storage: PetStyleStorage | null = browserStorage()) {
    this.key = `hv-pet-style-studio-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 안전한 빈 보관함으로 계속 */ }
    this.state = normalizePetStyleStudioState(raw);
    this.persist();
  }

  get(): PetStyleStudioState { return structuredClone(this.state); }
  card(slot: number): PetStyleCard | null { return structuredClone(this.state.slots[slot] ?? null); }
  featuredCards(): PetStyleCard[] {
    return this.state.featuredIds.flatMap((id) => {
      const card = this.state.slots.find((item) => item?.id === id);
      return card ? [structuredClone(card)] : [];
    });
  }
  progress(): PetStyleStudioProgress { return petStyleStudioProgress(this.state); }

  save(slot: number, draft: PetStyleDraft): PetStyleSaveResult {
    const normalized = normalizeDraft(draft);
    if (!Number.isInteger(slot) || slot < 0 || slot >= PET_STYLE_SLOT_COUNT || !normalized) return 'invalid';
    const previous = this.state.slots[slot];
    const card: PetStyleCard = {
      ...normalized,
      id: `${Date.now()}-${this.state.totalCaptures + 1}-${slot}`,
      savedAt: Date.now(),
    };
    const slots = [...this.state.slots];
    slots[slot] = card;
    this.state = {
      ...this.state,
      slots,
      featuredIds: previous
        ? this.state.featuredIds.map((id) => id === previous.id ? card.id : id)
        : this.state.featuredIds,
      discoveries: [...new Set([...this.state.discoveries, discoveryKey(card)])],
      totalCaptures: this.state.totalCaptures + 1,
    };
    this.persist();
    return previous ? 'replaced' : 'saved';
  }

  feature(cardId: string): PetStyleFeatureResult {
    if (!this.state.slots.some((card) => card?.id === cardId)) return 'missing';
    if (this.state.featuredIds.includes(cardId)) {
      this.state = { ...this.state, featuredIds: this.state.featuredIds.filter((id) => id !== cardId) };
      this.persist();
      return 'cleared';
    }
    if (this.state.featuredIds.length >= PET_STYLE_FEATURED_MAX) return 'full';
    this.state = { ...this.state, featuredIds: [...this.state.featuredIds, cardId] };
    this.persist();
    return 'featured';
  }

  recordApply(): void {
    this.state = { ...this.state, applies: this.state.applies + 1 };
    this.persist();
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션은 유지 */ }
  }
}
