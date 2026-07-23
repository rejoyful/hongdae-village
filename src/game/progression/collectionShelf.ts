import { CATALOG_BY_ID, CATEGORY_LABEL } from '../../items/catalog';
import { MONSTER_MAP, type MonsterSpecies } from '../battle/monsters';
import type { MonsterDexEntry } from '../battle/monsterDex';
import type { QuestState } from '../questProgress';
import { TASTE_DOMAINS, type TasteMetricDef } from './tasteProfile';
import { furnitureAcquisitionChannel, furnitureAcquisitionRoute } from '../home/furnitureWorkshop';
import { BADGE_BY_ID } from '../achievements';
import { STYLE_FIELD_LABELS, STYLE_OPTIONS, type StyleOptionDef } from '../art/styleCatalog';
import { petById } from '../pets/pets';

export const COLLECTION_SHELF_MAX = 8;
export type CollectionTargetKind = 'item' | 'monster' | 'metric' | 'style' | 'pet';

export interface CollectionShelfState { version: 1; targets: string[]; }
export interface CollectionShelfContext {
  quests: QuestState;
  discoveredItems: ReadonlySet<string>;
  monsters: readonly MonsterDexEntry[];
  unlockedBadgeIds: readonly string[];
  ownedPetIds: readonly string[];
}
export interface CollectionTargetView {
  signature: string;
  kind: CollectionTargetKind;
  mark: string;
  label: string;
  detail: string;
  location: string;
  current: number;
  goal: number;
  progressPct: number;
  complete: boolean;
}
export type CollectionShelfToggleResult = 'added' | 'removed' | 'full' | 'invalid';
export interface CollectionShelfProgress {
  targets: number;
  targetKinds: number;
  completed: number;
}

const METRICS = new Map<string, { metric: TasteMetricDef; mark: string; domain: string }>();
for (const domain of TASTE_DOMAINS) for (const metric of domain.metrics) {
  METRICS.set(metric.key, { metric, mark: domain.mark, domain: domain.name });
}
const STYLE_OPTION_BY_ID = new Map(STYLE_OPTIONS.map((option) => [option.id, option]));

const splitSignature = (signature: string): [CollectionTargetKind, string] | null => {
  const index = signature.indexOf(':');
  if (index < 1) return null;
  const kind = signature.slice(0, index);
  const id = signature.slice(index + 1);
  if (!id || (kind !== 'item' && kind !== 'monster' && kind !== 'metric' && kind !== 'style' && kind !== 'pet')) return null;
  return [kind, id];
};

export function isCollectionTargetSignature(signature: unknown): signature is string {
  if (typeof signature !== 'string') return false;
  const parts = splitSignature(signature);
  if (!parts) return false;
  const [kind, id] = parts;
  return kind === 'item' ? CATALOG_BY_ID.has(id)
    : kind === 'monster' ? MONSTER_MAP.has(id)
      : kind === 'style' ? STYLE_OPTION_BY_ID.has(id)
        : kind === 'pet' ? !!petById(id)
          : METRICS.has(id);
}

export function normalizeCollectionShelf(raw: unknown): CollectionShelfState {
  const value = (raw ?? {}) as Partial<CollectionShelfState>;
  const targets = Array.isArray(value.targets)
    ? [...new Set(value.targets.filter(isCollectionTargetSignature))].slice(0, COLLECTION_SHELF_MAX)
    : [];
  return { version: 1, targets };
}

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.floor(value) : 0;
const firstMark = (label: string, fallback: string): string => [...label][0] ?? fallback;
const monsterLocation = (species: MonsterSpecies): string => `동쪽 외곽숲 · 전투 T${species.tier} 해금 뒤 출현`;
const styleLocation = (option: StyleOptionDef): string => {
  const badge = option.requiredBadgeId ? BADGE_BY_ID.get(option.requiredBadgeId) : null;
  return badge ? `캐릭터 아틀리에 · ${badge.source}` : '캐릭터 아틀리에 · 처음부터 사용 가능';
};

export function collectionTargetView(signature: string, context: CollectionShelfContext): CollectionTargetView | null {
  const parts = splitSignature(signature);
  if (!parts || !isCollectionTargetSignature(signature)) return null;
  const [kind, id] = parts;
  if (kind === 'item') {
    const item = CATALOG_BY_ID.get(id)!;
    const complete = context.discoveredItems.has(id);
    const channel = furnitureAcquisitionChannel(id);
    return {
      signature, kind, mark: firstMark(item.name, '물'), label: item.name,
      detail: `${CATEGORY_LABEL[item.category]} · ${item.w}×${item.h}칸 · ${channel === 'diy' ? 'DIY 전용' : channel === 'weekly' ? '4주 순환' : `${item.price} 코인`}`,
      location: furnitureAcquisitionRoute(id),
      current: Number(complete), goal: 1, progressPct: complete ? 100 : 0, complete,
    };
  }
  if (kind === 'monster') {
    const species = MONSTER_MAP.get(id)!;
    const entry = context.monsters.find((view) => view.species.id === id);
    const complete = !!entry?.discovered;
    return {
      signature, kind, mark: `T${species.tier}`, label: complete ? species.name : `T${species.tier} 미발견 생태`,
      detail: complete ? `${species.name} · 누적 처치 ${entry?.kills ?? 0}` : '이름과 생김새는 첫 발견 뒤 기록됩니다.',
      location: monsterLocation(species), current: Number(complete), goal: 1, progressPct: complete ? 100 : 0, complete,
    };
  }
  if (kind === 'style') {
    const option = STYLE_OPTION_BY_ID.get(id)!;
    const complete = !option.requiredBadgeId || context.unlockedBadgeIds.includes(option.requiredBadgeId);
    const badge = option.requiredBadgeId ? BADGE_BY_ID.get(option.requiredBadgeId) : null;
    return {
      signature, kind, mark: firstMark(option.name, '옷'), label: option.name,
      detail: `${STYLE_FIELD_LABELS[option.field]} · ${option.rarity === 'rare' ? '희귀 스타일' : '기본 스타일'}${badge ? ` · ${badge.name}` : ''}`,
      location: styleLocation(option), current: Number(complete), goal: 1,
      progressPct: complete ? 100 : 0, complete,
    };
  }
  if (kind === 'pet') {
    const pet = petById(id)!;
    const complete = context.ownedPetIds.includes(id);
    const detail = pet.rare
      ? `숨은 동행 · ${pet.hint ?? '생활 기록으로 발견'}`
      : `일반 동행 · ${pet.price} 코인 · ${pet.blurb}`;
    return {
      signature, kind, mark: pet.emoji, label: pet.name, detail,
      location: pet.rare ? `펫샵 멍냥이네 · ${pet.hint ?? '숨은 친구 기록'}` : '펫샵 멍냥이네 · 가족 목록',
      current: Number(complete), goal: 1, progressPct: complete ? 100 : 0, complete,
    };
  }
  const source = METRICS.get(id)!;
  const current = cleanCount(context.quests.lifetimeCounts?.[id]);
  const complete = current >= source.metric.goal;
  return {
    signature, kind, mark: source.mark, label: source.metric.label,
    detail: `${source.domain} 취향 기록`, location: source.metric.location,
    current, goal: source.metric.goal,
    progressPct: Math.round((Math.min(current, source.metric.goal) / source.metric.goal) * 100), complete,
  };
}

export class CollectionShelfStore {
  private state: CollectionShelfState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-collection-shelf-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeCollectionShelf(raw);
    this.persist();
  }

  get(): CollectionShelfState { return this.state; }
  has(signature: string): boolean { return this.state.targets.includes(signature); }
  views(context: CollectionShelfContext): CollectionTargetView[] {
    return this.state.targets.flatMap((signature) => {
      const view = collectionTargetView(signature, context);
      return view ? [view] : [];
    });
  }
  progress(context: CollectionShelfContext): CollectionShelfProgress {
    const views = this.views(context);
    return {
      targets: views.length,
      targetKinds: new Set(views.map((view) => view.kind)).size,
      completed: views.filter((view) => view.complete).length,
    };
  }

  toggle(signature: string): CollectionShelfToggleResult {
    if (!isCollectionTargetSignature(signature)) return 'invalid';
    if (this.has(signature)) {
      this.state = { version: 1, targets: this.state.targets.filter((target) => target !== signature) };
      this.persist(); return 'removed';
    }
    if (this.state.targets.length >= COLLECTION_SHELF_MAX) return 'full';
    this.state = { version: 1, targets: [...this.state.targets, signature] };
    this.persist(); return 'added';
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
