import { normalizeAppearance, type Appearance } from './appearance';
import { styleIdentityFor } from './styleIdentity';
import { VILLAGE_LEVEL_REWARDS } from '../progression/villageRewards';
import { REQUEST_STORY_REWARDS } from '../progression/requestStoryRewards';
import { JOURNEY_CHAPTER_REWARDS } from '../progression/journeyChapterRewards';
import { STARTER_MENTOR_REWARDS } from '../progression/starterMentorRewards';

export interface ClosetSlot {
  name: string;
  appearance: Appearance;
  savedAt: number;
}

export interface ClosetState {
  version: 2;
  slots: Array<ClosetSlot | null>;
  featured: number[];
}

export interface FashionPreset {
  id: string;
  name: string;
  blurb: string;
  style: Partial<Appearance>;
  requiredBadgeId?: string;
}

export interface FashionPresetView extends FashionPreset { unlocked: boolean }

export const CLOSET_SLOT_COUNT = 12;
export const CLOSET_FEATURED_MAX = 3;
export interface ClosetProgress { saved: number; featured: number; identities: number; featuredIdentities: number }

/** 몸·얼굴은 유지하고 옷 레이어만 교체하는 테마 코디. */
export const FASHION_PRESETS: FashionPreset[] = [
  { id: 'soft_cafe', name: '카페 소프트', blurb: '크림 가디건과 브라운 와이드 팬츠', style: { topStyle: 3, topPattern: 5, shirt: 'f2ead8', bottomStyle: 1, pants: 5, shoeStyle: 2, sockStyle: 1, accent: 'c89a6a', back: 4 } },
  { id: 'street_red', name: '홍대 스트리트', blurb: '코랄 후드와 카고 팬츠의 활동적인 조합', style: { topStyle: 1, topPattern: 1, shirt: 'e86a6a', bottomStyle: 4, pants: 6, shoeStyle: 3, sockStyle: 4, accent: 'f2ead8', back: 1 } },
  { id: 'forest_walk', name: '숲길 산책', blurb: '세이지 티와 편안한 쇼츠', style: { topStyle: 0, topPattern: 5, shirt: '9cc79c', bottomStyle: 2, pants: 4, shoeStyle: 4, sockStyle: 2, accent: 'f2d85c', back: 1 } },
  { id: 'mono_city', name: '모노 시티', blurb: '차콜 블레이저와 슬림 팬츠', style: { topStyle: 2, topPattern: 0, shirt: '4a4e5c', bottomStyle: 0, pants: 6, shoeStyle: 2, sockStyle: 0, accent: 'f2f2ea', back: 0 } },
  { id: 'dream_sailor', name: '드림 세일러', blurb: '라벤더 세일러와 플리츠 스커트', style: { topStyle: 6, topPattern: 4, shirt: 'c8a8d8', bottomStyle: 3, pants: 8, shoeStyle: 3, sockStyle: 3, accent: 'f2ead8', back: 3 } },
  { id: 'retro_denim', name: '레트로 데님', blurb: '오버롤과 컬러 러너의 빈티지 코디', style: { topStyle: 4, topPattern: 2, shirt: 'f2ead8', bottomStyle: 1, pants: 8, shoeStyle: 4, sockStyle: 2, accent: 'e85f6a', back: 0 } },
  { id: 'style_icon', name: '스타일 선언', blurb: '핑크 재킷과 토트백으로 완성한 시그니처 룩', style: { topStyle: 5, topPattern: 3, shirt: 'e86ab0', bottomStyle: 3, pants: 10, shoeStyle: 4, sockStyle: 4, accent: 'f2d85c', back: 4 }, requiredBadgeId: 'badge_story_style' },
  { id: 'pet_club', name: '멍냥 클럽', blurb: '꼬리 장식과 따뜻한 오버롤', style: { topStyle: 4, topPattern: 3, shirt: 'd8b86e', bottomStyle: 2, pants: 5, shoeStyle: 0, sockStyle: 1, accent: 'f2ead8', back: 5 }, requiredBadgeId: 'badge_intro_pet' },
  { id: 'gem_curator', name: '젬 큐레이터', blurb: '보석빛 가디건과 픽셀 윙', style: { topStyle: 3, topPattern: 4, shirt: '6a6ad8', bottomStyle: 5, pants: 10, shoeStyle: 4, sockStyle: 0, accent: '58b8c8', back: 3 }, requiredBadgeId: 'badge_collect_treasure_1' },
  { id: 'alley_bard', name: '골목의 음유시인', blurb: '기타 케이스와 빈티지 재킷', style: { topStyle: 2, topPattern: 1, shirt: 'b0685a', bottomStyle: 4, pants: 5, shoeStyle: 1, sockStyle: 0, accent: 'f2a85c', back: 2 }, requiredBadgeId: 'badge_story_street_stage' },
  { id: 'office_editor', name: '시티 에디터', blurb: '정갈한 블레이저와 로퍼', style: { topStyle: 2, topPattern: 0, shirt: 'a8c8e0', bottomStyle: 0, pants: 2, shoeStyle: 2, sockStyle: 0, accent: 'f2ead8', back: 4 }, requiredBadgeId: 'badge_story_company' },
  { id: 'hanbok_night', name: '달빛 한복', blurb: '남보라 저고리와 긴 치마', style: { topStyle: 7, topPattern: 5, shirt: '806ad8', bottomStyle: 5, pants: 10, shoeStyle: 2, sockStyle: 1, accent: 'e86aa8', back: 0 }, requiredBadgeId: 'badge_master_level_10' },
  ...VILLAGE_LEVEL_REWARDS.map((reward): FashionPreset => ({
    ...reward.outfit,
    requiredBadgeId: reward.badgeId,
  })),
  ...REQUEST_STORY_REWARDS.map((reward): FashionPreset => ({
    ...reward.outfit,
    requiredBadgeId: reward.badgeId,
  })),
  ...JOURNEY_CHAPTER_REWARDS.map((reward): FashionPreset => ({
    ...reward.outfit,
    requiredBadgeId: reward.badgeId,
  })),
  ...STARTER_MENTOR_REWARDS.map((reward): FashionPreset => ({
    ...reward.outfit,
    requiredBadgeId: reward.badgeId,
  })),
];

const safeName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(/[<>\n\r]/g, '').trim().slice(0, 12);
  return clean || fallback;
};

export function normalizeClosetState(raw: unknown): ClosetState {
  const obj = (raw ?? {}) as Partial<ClosetState>;
  const input = Array.isArray(obj.slots) ? obj.slots : [];
  const slots = Array.from({ length: CLOSET_SLOT_COUNT }, (_, index): ClosetSlot | null => {
    const slot = input[index] as Partial<ClosetSlot> | null | undefined;
    if (!slot || typeof slot !== 'object' || !slot.appearance) return null;
    return {
      name: safeName(slot.name, `코디 ${index + 1}`),
      appearance: normalizeAppearance(slot.appearance),
      savedAt: typeof slot.savedAt === 'number' && Number.isFinite(slot.savedAt) ? slot.savedAt : 0,
    };
  });
  const featured = Array.isArray(obj.featured)
    ? [...new Set(obj.featured.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < CLOSET_SLOT_COUNT && !!slots[index]))].slice(0, CLOSET_FEATURED_MAX)
    : [];
  return { version: 2, slots, featured };
}

export function saveClosetSlot(
  state: ClosetState, index: number, appearance: Appearance, name?: string, savedAt = Date.now(),
): ClosetState {
  if (!Number.isInteger(index) || index < 0 || index >= CLOSET_SLOT_COUNT) return state;
  const slots = [...state.slots];
  slots[index] = {
    name: safeName(name, slots[index]?.name ?? `코디 ${index + 1}`),
    appearance: normalizeAppearance(appearance),
    savedAt,
  };
  return { ...state, version: 2, slots };
}

export function removeClosetSlot(state: ClosetState, index: number): ClosetState {
  if (!Number.isInteger(index) || index < 0 || index >= CLOSET_SLOT_COUNT || !state.slots[index]) return state;
  const slots = [...state.slots];
  slots[index] = null;
  return { ...state, version: 2, slots, featured: state.featured.filter((slot) => slot !== index) };
}

export function renameClosetSlot(state: ClosetState, index: number, name: string): ClosetState {
  const slot = state.slots[index];
  if (!slot) return state;
  const nextName = safeName(name, slot.name);
  if (nextName === slot.name) return state;
  const slots = [...state.slots];
  slots[index] = { ...slot, name: nextName };
  return { ...state, slots };
}

export function toggleFeaturedClosetSlot(
  state: ClosetState, index: number,
): { state: ClosetState; result: 'added' | 'removed' | 'full' | 'empty' } {
  if (!state.slots[index]) return { state, result: 'empty' };
  if (state.featured.includes(index)) {
    return { state: { ...state, featured: state.featured.filter((slot) => slot !== index) }, result: 'removed' };
  }
  if (state.featured.length >= CLOSET_FEATURED_MAX) return { state, result: 'full' };
  return { state: { ...state, featured: [...state.featured, index] }, result: 'added' };
}

export function featuredClosetLooks(state: ClosetState): ClosetSlot[] {
  return state.featured.map((index) => state.slots[index]).filter((slot): slot is ClosetSlot => !!slot);
}

export function closetProgress(state: ClosetState): ClosetProgress {
  const slots = state.slots.filter((slot): slot is ClosetSlot => !!slot);
  return {
    saved: slots.length,
    featured: state.featured.length,
    identities: new Set(slots.map((slot) => styleIdentityFor(slot.appearance).id)).size,
    featuredIdentities: new Set(featuredClosetLooks(state).map((slot) => styleIdentityFor(slot.appearance).id)).size,
  };
}

export function applyFashionPreset(current: Appearance, preset: FashionPreset): Appearance {
  return normalizeAppearance({ ...current, ...preset.style });
}

export function fashionPresetViews(unlockedBadges: Iterable<string>): FashionPresetView[] {
  const unlocked = new Set(unlockedBadges);
  return FASHION_PRESETS.map((preset) => ({
    ...preset,
    unlocked: !preset.requiredBadgeId || unlocked.has(preset.requiredBadgeId),
  }));
}

export class ClosetStore {
  private state: ClosetState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-closet-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizeClosetState(raw);
    this.persist();
  }

  get(): ClosetState { return this.state; }
  slot(index: number): ClosetSlot | null { return this.state.slots[index] ?? null; }
  isFeatured(index: number): boolean { return this.state.featured.includes(index); }
  featuredLooks(): ClosetSlot[] { return featuredClosetLooks(this.state); }

  progress(): ClosetProgress { return closetProgress(this.state); }

  save(index: number, appearance: Appearance, name?: string): void {
    this.state = saveClosetSlot(this.state, index, appearance, name);
    this.persist();
  }

  remove(index: number): void {
    this.state = removeClosetSlot(this.state, index);
    this.persist();
  }

  rename(index: number, name: string): void {
    this.state = renameClosetSlot(this.state, index, name);
    this.persist();
  }

  toggleFeatured(index: number): 'added' | 'removed' | 'full' | 'empty' {
    const next = toggleFeaturedClosetSlot(this.state, index);
    this.state = next.state;
    if (next.result === 'added' || next.result === 'removed') this.persist();
    return next.result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
