import { CATALOG_BY_ID, type ItemCategory } from '../../items/catalog';
import type { QuestState } from '../questProgress';
import { unlockedVillageFurnitureRecipe } from '../progression/villageRewards';

export type FurnitureFinishId = 'matte' | 'limewash' | 'woodgrain' | 'linen' | 'lacquer' | 'patina';
export type FurnitureColorId = 'oat' | 'sage' | 'clay' | 'ink' | 'sky' | 'berry' | 'marigold' | 'petal';

export interface ReformRequirement { key: string; goal: number; label: string; }
export interface FurnitureFinish {
  id: FurnitureFinishId; name: string; description: string; mark: string; pattern: 'none' | 'wash' | 'grain' | 'cross' | 'shine' | 'speckle';
  opacity: number; requirement?: ReformRequirement;
}
export interface FurnitureColor {
  id: FurnitureColorId; name: string; hex: string; dark: string; description: string; requirement?: ReformRequirement;
}
export interface FurnitureReformStyle { finishId: FurnitureFinishId; colorId: FurnitureColorId; }
export interface FurnitureReformRecord extends FurnitureReformStyle { placementId: string; itemId: string; updatedAt: number; }
export interface FurnitureReformState {
  version: 1;
  styles: Record<string, FurnitureReformRecord>;
  discovered: string[];
  saveCount: number;
}
export interface FurnitureReformOptionView<T> { option: T; unlocked: boolean; hint: string; current: number; goal: number; }
export interface FurnitureReformProgress {
  saves: number; combinations: number; totalCombinations: number; finishes: number; totalFinishes: number;
  colors: number; totalColors: number; styledPlacements: number;
}
export type FurnitureReformResult =
  | { ok: true; style: FurnitureReformStyle; newCombination: boolean }
  | { ok: false; reason: 'unknown-item' | 'not-reformable' | 'locked-finish' | 'locked-color' };

export const FURNITURE_FINISHES: readonly FurnitureFinish[] = [
  { id: 'matte', name: '보드라운 무광', description: '빛을 눌러 형태가 또렷한 기본 마감', mark: '무', pattern: 'none', opacity: .22 },
  { id: 'limewash', name: '석회 덧칠', description: '손으로 여러 번 칠한 듯한 잔잔한 결', mark: '칠', pattern: 'wash', opacity: .26 },
  { id: 'woodgrain', name: '나뭇결 오일', description: '긴 나뭇결을 살리는 따뜻한 마감', mark: '목', pattern: 'grain', opacity: .20, requirement: { key: 'q_place', goal: 5, label: '가구 누적 5회 배치' } },
  { id: 'linen', name: '리넨 감싸기', description: '촘촘한 직조 무늬를 입힌 포근한 마감', mark: '천', pattern: 'cross', opacity: .28, requirement: { key: 'home_score', goal: 40, label: '홈 점수 40' } },
  { id: 'lacquer', name: '옻빛 광택', description: '가장자리에 한 줄 반사가 흐르는 마감', mark: '광', pattern: 'shine', opacity: .25, requirement: { key: 'home_theme_power', goal: 3, label: '홈 테마 파워 3' } },
  { id: 'patina', name: '시간의 녹청', description: '모서리에 세월의 점을 남긴 빈티지 마감', mark: '고', pattern: 'speckle', opacity: .23, requirement: { key: 'home_visits', goal: 3, label: '주민 방문 추억 3장' } },
] as const;

export const FURNITURE_COLORS: readonly FurnitureColor[] = [
  { id: 'oat', name: '오트밀', hex: '#d4b98d', dark: '#7c6548', description: '어떤 방에도 어울리는 따뜻한 기본색' },
  { id: 'sage', name: '세이지', hex: '#879b7d', dark: '#50624f', description: '식물 옆에서 차분해지는 회녹색' },
  { id: 'clay', name: '구운 점토', hex: '#b9785f', dark: '#704738', description: '골목 벽돌을 닮은 붉은 흙빛' },
  { id: 'ink', name: '먹빛', hex: '#555b58', dark: '#303633', description: '윤곽을 단단하게 잡는 짙은 회색', requirement: { key: 'home_unique_items', goal: 8, label: '서로 다른 가구 8종 전시' } },
  { id: 'sky', name: '빗물 하늘', hex: '#7f9daa', dark: '#4c6570', description: '물정원 위 흐린 하늘을 담은 청색', requirement: { key: 'fishing_species', goal: 6, label: '물가 생물 6종 발견' } },
  { id: 'berry', name: '산딸기', hex: '#a36e76', dark: '#67434a', description: '작은 소품을 또렷하게 만드는 열매색', requirement: { key: 'cooking_recipes', goal: 6, label: '요리 레시피 6종 발견' } },
  { id: 'marigold', name: '메리골드', hex: '#c79b55', dark: '#7a5c31', description: '낡은 황동처럼 깊은 노란색', requirement: { key: 'treasure_crafted', goal: 3, label: '보물 3회 복원' } },
  { id: 'petal', name: '꽃잎 분홍', hex: '#c68d88', dark: '#815953', description: '표본 노트에서 고른 부드러운 분홍', requirement: { key: 'garden_specimens', goal: 12, label: '정원 표본 12종 발견' } },
] as const;

export const FURNITURE_FINISH_BY_ID = new Map(FURNITURE_FINISHES.map((item) => [item.id, item]));
export const FURNITURE_COLOR_BY_ID = new Map(FURNITURE_COLORS.map((item) => [item.id, item]));
const REFORMABLE = new Set<ItemCategory>(['furniture', 'electronics', 'deco', 'rug', 'wall']);

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
const metric = (quests: QuestState, key: string): number => cleanCount(quests.lifetimeCounts?.[key]);
const signature = (style: FurnitureReformStyle): string => `${style.finishId}:${style.colorId}`;
export const DEFAULT_FURNITURE_REFORM: FurnitureReformStyle = { finishId: 'matte', colorId: 'oat' };

export function isFurnitureFinishId(value: unknown): value is FurnitureFinishId { return typeof value === 'string' && FURNITURE_FINISH_BY_ID.has(value as FurnitureFinishId); }
export function isFurnitureColorId(value: unknown): value is FurnitureColorId { return typeof value === 'string' && FURNITURE_COLOR_BY_ID.has(value as FurnitureColorId); }
export function isReformableFurniture(itemId: string): boolean {
  const def = CATALOG_BY_ID.get(itemId);
  return !!def && REFORMABLE.has(def.category) && itemId !== 'fish_tank';
}

export function freshFurnitureReformState(): FurnitureReformState { return { version: 1, styles: {}, discovered: [], saveCount: 0 }; }

export function normalizeFurnitureReformState(raw: unknown): FurnitureReformState {
  if (!raw || typeof raw !== 'object') return freshFurnitureReformState();
  const value = raw as Partial<FurnitureReformState>;
  const styles: Record<string, FurnitureReformRecord> = {};
  const input = value.styles && typeof value.styles === 'object' ? value.styles as Record<string, unknown> : {};
  for (const [placementId, entry] of Object.entries(input)) {
    if (!placementId || !entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<FurnitureReformRecord>;
    if (typeof candidate.itemId !== 'string' || !isReformableFurniture(candidate.itemId)) continue;
    if (!isFurnitureFinishId(candidate.finishId) || !isFurnitureColorId(candidate.colorId)) continue;
    styles[placementId] = { placementId, itemId: candidate.itemId, finishId: candidate.finishId, colorId: candidate.colorId, updatedAt: cleanCount(candidate.updatedAt) };
  }
  const discovered = Array.isArray(value.discovered) ? [...new Set(value.discovered.filter((entry): entry is string => {
    if (typeof entry !== 'string') return false;
    const [finishId, colorId] = entry.split(':');
    return isFurnitureFinishId(finishId) && isFurnitureColorId(colorId);
  }))] : [];
  for (const style of Object.values(styles)) if (!discovered.includes(signature(style))) discovered.push(signature(style));
  return { version: 1, styles, discovered, saveCount: Math.max(cleanCount(value.saveCount), discovered.length) };
}

function optionView<T extends { requirement?: ReformRequirement }>(option: T, quests: QuestState): FurnitureReformOptionView<T> {
  const requirement = option.requirement;
  const current = requirement ? metric(quests, requirement.key) : 1;
  const goal = requirement?.goal ?? 1;
  const unlocked = current >= goal;
  return { option, unlocked, hint: unlocked ? '사용할 수 있어요.' : `${requirement!.label} 필요`, current: Math.min(current, goal), goal };
}

export function furnitureFinishViews(quests: QuestState): FurnitureReformOptionView<FurnitureFinish>[] { return FURNITURE_FINISHES.map((item) => optionView(item, quests)); }
export function furnitureColorViews(quests: QuestState): FurnitureReformOptionView<FurnitureColor>[] { return FURNITURE_COLORS.map((item) => optionView(item, quests)); }

export function furnitureReformProgress(state: FurnitureReformState): FurnitureReformProgress {
  const pairs = state.discovered.map((item) => item.split(':'));
  return {
    saves: state.saveCount, combinations: state.discovered.length, totalCombinations: FURNITURE_FINISHES.length * FURNITURE_COLORS.length,
    finishes: new Set(pairs.map(([finish]) => finish)).size, totalFinishes: FURNITURE_FINISHES.length,
    colors: new Set(pairs.map(([, color]) => color)).size, totalColors: FURNITURE_COLORS.length,
    styledPlacements: Object.keys(state.styles).length,
  };
}

export class FurnitureReformStore {
  private state: FurnitureReformState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-furniture-reforms-${userId}`;
    let raw: unknown = null;
    try { const stored = localStorage.getItem(this.key); if (stored) raw = JSON.parse(stored); } catch { /* session only */ }
    this.state = normalizeFurnitureReformState(raw);
    this.persist();
  }

  get(): FurnitureReformState { return this.state; }
  styleFor(placementId: string): FurnitureReformRecord | null { return this.state.styles[placementId] ?? null; }
  progress(): FurnitureReformProgress { return furnitureReformProgress(this.state); }

  apply(
    placementId: string,
    itemId: string,
    style: FurnitureReformStyle,
    quests: QuestState,
    unlockedBadgeIds: Iterable<string> = [],
  ): FurnitureReformResult {
    if (!CATALOG_BY_ID.has(itemId)) return { ok: false, reason: 'unknown-item' };
    if (!isReformableFurniture(itemId)) return { ok: false, reason: 'not-reformable' };
    const rewardRecipe = unlockedVillageFurnitureRecipe(style, unlockedBadgeIds);
    const finish = furnitureFinishViews(quests).find((view) => view.option.id === style.finishId);
    if (!finish?.unlocked && !rewardRecipe) return { ok: false, reason: 'locked-finish' };
    const color = furnitureColorViews(quests).find((view) => view.option.id === style.colorId);
    if (!color?.unlocked && !rewardRecipe) return { ok: false, reason: 'locked-color' };
    const combo = signature(style);
    const newCombination = !this.state.discovered.includes(combo);
    this.state.styles[placementId] = { placementId, itemId, ...style, updatedAt: Date.now() };
    if (newCombination) this.state.discovered.push(combo);
    this.state.saveCount += 1;
    this.persist();
    return { ok: true, style, newCombination };
  }

  clear(placementId: string): boolean {
    if (!this.state.styles[placementId]) return false;
    delete this.state.styles[placementId]; this.persist(); return true;
  }

  /** 되돌리기로 같은 가구가 새 배치 ID를 받았을 때 이미 획득한 리폼 외형을 무손실 복구한다. */
  restore(placementId: string, itemId: string, style: FurnitureReformStyle | null): boolean {
    if (!style || !placementId || !isReformableFurniture(itemId)) return false;
    if (!isFurnitureFinishId(style.finishId) || !isFurnitureColorId(style.colorId)) return false;
    this.state.styles[placementId] = { placementId, itemId, ...style, updatedAt: Date.now() };
    const combo = signature(style); if (!this.state.discovered.includes(combo)) this.state.discovered.push(combo);
    this.persist(); return true;
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
