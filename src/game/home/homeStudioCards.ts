import { CATALOG_BY_ID } from '../../items/catalog';
import { normalizeAppearance, type Appearance } from '../art/appearance';
import type { Placed, Rot } from '../entities/placement';
import { isPetAccessoryId, type PetAccessoryId } from '../pets/petProfiles';
import { petById } from '../pets/pets';
import type { HouseType } from '../realestate/realEstate';
import type { HomeDesignAnalysis, HomeThemeId } from './homeDesign';

export type HomeStudioMoodId = 'everyday' | 'night' | 'green' | 'creator' | 'companion' | 'collector';

export interface HomeStudioMood {
  id: HomeStudioMoodId;
  mark: string;
  code: string;
  title: string;
  subtitle: string;
  note: string;
  palette: readonly [string, string, string, string];
}

export interface HomeStudioPlacement {
  itemId: string;
  tx: number;
  ty: number;
  rot: Rot;
}

export interface HomeStudioCard {
  moodId: HomeStudioMoodId;
  appearance: Appearance;
  pet: { speciesId: string; accessory: PetAccessoryId } | null;
  houseType: HouseType;
  themeId: HomeThemeId;
  themeName: string;
  score: number;
  placements: HomeStudioPlacement[];
  savedAt: number;
}

export interface HomeStudioCardContext {
  appearance: Appearance;
  pet: { speciesId: string; accessory: PetAccessoryId } | null;
  houseType: HouseType;
  analysis: HomeDesignAnalysis;
  placed: readonly Placed[];
}

export interface HomeStudioCardState {
  version: 1;
  slots: Array<HomeStudioCard | null>;
  featuredSlots: number[];
  totalCaptures: number;
}

export interface HomeStudioCardProgress {
  savedCards: number;
  totalCaptures: number;
  moods: number;
  petCards: number;
  featuredCards: number;
  totalSlots: number;
}

export const HOME_STUDIO_SLOT_MAX = 6;
export const HOME_STUDIO_FEATURED_MAX = 3;
export const HOME_STUDIO_PLACEMENT_MAX = 32;

export const HOME_STUDIO_MOODS: readonly HomeStudioMood[] = [
  {
    id: 'everyday', mark: '온', code: 'SCENE 01 · EVERYDAY', title: '불을 켠 보통날',
    subtitle: '자주 쓰는 물건 사이의 나', note: '가장 멋낸 날보다 가장 자주 돌아오는 저녁을 한 장에 남겨요.',
    palette: ['#34282a', '#b8785d', '#d5ad6e', '#f1dfbd'],
  },
  {
    id: 'night', mark: '밤', code: 'SCENE 02 · NIGHT', title: '자정의 작은 취향',
    subtitle: '빛이 줄어든 뒤 선명해지는 것', note: '조명과 화면, 음악처럼 밤에 더 또렷한 물건을 중심에 둡니다.',
    palette: ['#202238', '#554a78', '#c86f83', '#eed48e'],
  },
  {
    id: 'green', mark: '잎', code: 'SCENE 03 · GREEN', title: '방 안의 느린 계절',
    subtitle: '잎과 물결 곁에서 쉬기', note: '식물과 작은 생태의 숨을 빌려 방 안에 천천히 흐르는 시간을 만들어요.',
    palette: ['#26362f', '#647c63', '#a2ad71', '#e2dbad'],
  },
  {
    id: 'creator', mark: '작', code: 'SCENE 04 · CREATOR', title: '아직 끝나지 않은 작업실',
    subtitle: '완성보다 다음 한 칸', note: '책상과 도구, 엉킨 아이디어까지 지금 만드는 사람의 장면으로 기록해요.',
    palette: ['#28323b', '#687f89', '#c48668', '#e7ddc7'],
  },
  {
    id: 'companion', mark: '짝', code: 'SCENE 05 · COMPANION', title: '같은 높이의 우리',
    subtitle: '동행과 나눈 생활 반경', note: '캐릭터와 동행이 한 집에서 서로 다른 방식으로 쉬는 순간을 보존합니다.',
    palette: ['#3b2d35', '#9b6b73', '#d3a26d', '#f0d7b5'],
  },
  {
    id: 'collector', mark: '장', code: 'SCENE 06 · COLLECTOR', title: '좋아하는 것으로 가득',
    subtitle: '설명할 수 있는 맥시멀리즘', note: '많이 놓는 대신 왜 남겼는지 말할 수 있는 물건들로 나만의 도감을 만들어요.',
    palette: ['#322b3d', '#766385', '#c99a5d', '#ead8b4'],
  },
] as const;

export const HOME_STUDIO_MOOD_BY_ID = new Map(HOME_STUDIO_MOODS.map((mood) => [mood.id, mood]));

const HOUSE_TYPES = new Set<HouseType>(['banjiha', 'oneroom', 'villa', 'apt', 'house']);
const THEME_IDS = new Set<HomeThemeId>(['starter', 'cozy', 'music', 'green', 'creator', 'pet']);

const cleanMetric = (value: unknown, max: number): number => (
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value)))
    : 0
);

function normalizePlacement(raw: unknown): HomeStudioPlacement | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<HomeStudioPlacement>;
  if (typeof value.itemId !== 'string' || !CATALOG_BY_ID.has(value.itemId)) return null;
  if (!Number.isInteger(value.tx) || !Number.isInteger(value.ty)
    || value.tx! < 0 || value.ty! < 0 || value.tx! > 40 || value.ty! > 40) return null;
  const rot: Rot = value.rot === 1 || value.rot === 2 || value.rot === 3 ? value.rot : 0;
  return { itemId: value.itemId, tx: value.tx!, ty: value.ty!, rot };
}

export function normalizeHomeStudioCard(raw: unknown): HomeStudioCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<HomeStudioCard>;
  if (!value.appearance || typeof value.appearance !== 'object') return null;
  const moodId = typeof value.moodId === 'string' && HOME_STUDIO_MOOD_BY_ID.has(value.moodId as HomeStudioMoodId)
    ? value.moodId as HomeStudioMoodId : 'everyday';
  const pet = value.pet && typeof value.pet === 'object' && petById(value.pet.speciesId)
    ? { speciesId: value.pet.speciesId, accessory: isPetAccessoryId(value.pet.accessory) ? value.pet.accessory : 'none' as const }
    : null;
  const seen = new Set<string>();
  const placements = Array.isArray(value.placements) ? value.placements.slice(0, HOME_STUDIO_PLACEMENT_MAX)
    .flatMap((entry): HomeStudioPlacement[] => {
      const placement = normalizePlacement(entry);
      if (!placement) return [];
      const key = `${placement.itemId}@${placement.tx},${placement.ty},${placement.rot}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [placement];
    }) : [];
  return {
    moodId,
    appearance: normalizeAppearance(value.appearance),
    pet,
    houseType: HOUSE_TYPES.has(value.houseType as HouseType) ? value.houseType as HouseType : 'oneroom',
    themeId: THEME_IDS.has(value.themeId as HomeThemeId) ? value.themeId as HomeThemeId : 'starter',
    themeName: typeof value.themeName === 'string'
      ? value.themeName.replace(/[<>\n\r]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24) || '나만의 시작'
      : '나만의 시작',
    score: cleanMetric(value.score, 100),
    placements,
    savedAt: cleanMetric(value.savedAt, Number.MAX_SAFE_INTEGER),
  };
}

export function makeHomeStudioCard(
  context: HomeStudioCardContext, moodId: HomeStudioMoodId, savedAt = Date.now(),
): HomeStudioCard {
  return normalizeHomeStudioCard({
    moodId,
    appearance: context.appearance,
    pet: context.pet,
    houseType: context.houseType,
    themeId: context.analysis.theme.id,
    themeName: context.analysis.theme.name,
    score: context.analysis.score,
    placements: context.placed.map((entry) => ({
      itemId: entry.itemId, tx: entry.tx, ty: entry.ty, rot: entry.rot,
    })),
    savedAt,
  })!;
}

export function freshHomeStudioCardState(): HomeStudioCardState {
  return {
    version: 1,
    slots: Array.from({ length: HOME_STUDIO_SLOT_MAX }, () => null),
    featuredSlots: [],
    totalCaptures: 0,
  };
}

export function normalizeHomeStudioCardState(raw: unknown): HomeStudioCardState {
  if (!raw || typeof raw !== 'object') return freshHomeStudioCardState();
  const value = raw as Partial<HomeStudioCardState>;
  const source = Array.isArray(value.slots) ? value.slots : [];
  const slots = Array.from({ length: HOME_STUDIO_SLOT_MAX }, (_, index) => normalizeHomeStudioCard(source[index]));
  const featuredSlots = Array.isArray(value.featuredSlots)
    ? [...new Set(value.featuredSlots.filter((slot): slot is number => (
      Number.isInteger(slot) && slot >= 0 && slot < HOME_STUDIO_SLOT_MAX && !!slots[slot]
    )))].slice(0, HOME_STUDIO_FEATURED_MAX)
    : [];
  const savedCards = slots.filter(Boolean).length;
  return {
    version: 1,
    slots,
    featuredSlots,
    totalCaptures: Math.max(savedCards, cleanMetric(value.totalCaptures, Number.MAX_SAFE_INTEGER)),
  };
}

export function homeStudioCardProgress(state: HomeStudioCardState): HomeStudioCardProgress {
  const cards = state.slots.filter((card): card is HomeStudioCard => !!card);
  return {
    savedCards: cards.length,
    totalCaptures: state.totalCaptures,
    moods: new Set(cards.map((card) => card.moodId)).size,
    petCards: cards.filter((card) => !!card.pet).length,
    featuredCards: state.featuredSlots.length,
    totalSlots: HOME_STUDIO_SLOT_MAX,
  };
}

export class HomeStudioCardStore {
  private readonly key: string;
  private state: HomeStudioCardState;

  constructor(userId: string) {
    this.key = `hv-home-studio-cards-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeHomeStudioCardState(raw);
    this.persist();
  }

  get(): HomeStudioCardState { return this.state; }
  card(slot: number): HomeStudioCard | null { return this.state.slots[slot] ?? null; }
  progress(): HomeStudioCardProgress { return homeStudioCardProgress(this.state); }
  featuredCards(): HomeStudioCard[] {
    return this.state.featuredSlots.flatMap((slot) => {
      const card = this.state.slots[slot];
      return card ? [structuredClone(card)] : [];
    });
  }

  save(slot: number, card: HomeStudioCard): 'saved' | 'overwritten' | 'invalid' {
    if (!Number.isInteger(slot) || slot < 0 || slot >= HOME_STUDIO_SLOT_MAX) return 'invalid';
    const normalized = normalizeHomeStudioCard(card);
    if (!normalized) return 'invalid';
    const overwritten = !!this.state.slots[slot];
    const slots = [...this.state.slots];
    slots[slot] = normalized;
    this.state = { ...this.state, slots, totalCaptures: this.state.totalCaptures + 1 };
    this.persist();
    return overwritten ? 'overwritten' : 'saved';
  }

  remove(slot: number): boolean {
    if (!this.state.slots[slot]) return false;
    const slots = [...this.state.slots];
    slots[slot] = null;
    this.state = { ...this.state, slots, featuredSlots: this.state.featuredSlots.filter((value) => value !== slot) };
    this.persist();
    return true;
  }

  toggleFeatured(slot: number): 'added' | 'removed' | 'full' | 'empty' {
    if (!this.state.slots[slot]) return 'empty';
    if (this.state.featuredSlots.includes(slot)) {
      this.state = { ...this.state, featuredSlots: this.state.featuredSlots.filter((value) => value !== slot) };
      this.persist();
      return 'removed';
    }
    if (this.state.featuredSlots.length >= HOME_STUDIO_FEATURED_MAX) return 'full';
    this.state = { ...this.state, featuredSlots: [...this.state.featuredSlots, slot] };
    this.persist();
    return 'added';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
