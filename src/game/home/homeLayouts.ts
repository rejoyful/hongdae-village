import { CATALOG_BY_ID } from '../../items/catalog';
import { canPlace, normalizeRot, type Placed, type PlaceRegion, type Rot } from '../entities/placement';
import {
  isFurnitureColorId, isFurnitureFinishId, isReformableFurniture,
  type FurnitureReformStyle,
} from './furnitureReform';

export type HomeLayoutLabelId = 'daily' | 'guest' | 'studio' | 'season' | 'pet' | 'collector';

export interface HomeLayoutLabel {
  id: HomeLayoutLabelId;
  mark: string;
  name: string;
  note: string;
  color: string;
  dark: string;
}

export interface HomeLayoutPlacement {
  itemId: string;
  tx: number;
  ty: number;
  rot: Rot;
  reform: FurnitureReformStyle | null;
}

export interface HomeLayoutSnapshot {
  slot: number;
  labelId: HomeLayoutLabelId;
  placements: HomeLayoutPlacement[];
  savedAt: number;
  saveCount: number;
  applyCount: number;
  signature: string;
}

export interface HomeLayoutProgress {
  savedSlots: number;
  totalSaves: number;
  totalApplies: number;
  distinctScenes: number;
  itemTypes: number;
}

export interface HomeLayoutState {
  version: 1;
  slots: Record<string, HomeLayoutSnapshot>;
  totalSaves: number;
  totalApplies: number;
}

export type HomeLayoutApplyResult =
  | { ok: true; placements: Placed[]; counts: Map<string, number>; styles: Map<string, FurnitureReformStyle>; snapshot: HomeLayoutSnapshot }
  | { ok: false; reason: 'empty' | 'missing' | 'invalid'; missingItemIds?: string[] };

export const HOME_LAYOUT_SLOT_MAX = 6;
export const HOME_LAYOUT_PLACEMENT_MAX = 200;

export const HOME_LAYOUT_LABELS: readonly HomeLayoutLabel[] = [
  { id: 'daily', mark: '온', name: '매일의 방', note: '자주 쓰는 가구와 편안한 동선', color: '#d3a071', dark: '#72533d' },
  { id: 'guest', mark: '손', name: '손님 오는 날', note: '차와 의자를 꺼낸 작은 집들이', color: '#bd8b78', dark: '#694a42' },
  { id: 'studio', mark: '작', name: '창작 작업실', note: '음악·그림·책이 모이는 몰입의 자리', color: '#78949b', dark: '#405a62' },
  { id: 'season', mark: '철', name: '계절 갈아입기', note: '빛과 색을 바꾸는 계절 한정 장면', color: '#899b72', dark: '#506044' },
  { id: 'pet', mark: '발', name: '동행의 자리', note: '작은 가족의 반응을 위한 가구 배치', color: '#b68286', dark: '#67494e' },
  { id: 'collector', mark: '장', name: '수집가 전시실', note: '좋아하는 물건을 한눈에 보는 아카이브', color: '#a38a69', dark: '#5d4c39' },
] as const;

export const HOME_LAYOUT_LABEL_BY_ID = new Map(HOME_LAYOUT_LABELS.map((label) => [label.id, label]));

export function isHomeLayoutLabelId(value: unknown): value is HomeLayoutLabelId {
  return typeof value === 'string' && HOME_LAYOUT_LABEL_BY_ID.has(value as HomeLayoutLabelId);
}

function cleanCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function cleanStyle(value: unknown, itemId: string): FurnitureReformStyle | null {
  if (!isReformableFurniture(itemId) || !value || typeof value !== 'object') return null;
  const style = value as Partial<FurnitureReformStyle>;
  return isFurnitureFinishId(style.finishId) && isFurnitureColorId(style.colorId)
    ? { finishId: style.finishId, colorId: style.colorId } : null;
}

export function homeLayoutPlacementKey(value: Pick<HomeLayoutPlacement, 'itemId' | 'tx' | 'ty' | 'rot'>): string {
  return `${value.itemId}@${value.tx},${value.ty},${value.rot}`;
}

export function normalizeHomeLayoutPlacements(raw: unknown): HomeLayoutPlacement[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.slice(0, HOME_LAYOUT_PLACEMENT_MAX).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const value = entry as Partial<HomeLayoutPlacement>;
    if (typeof value.itemId !== 'string' || !CATALOG_BY_ID.has(value.itemId)) return [];
    if (!Number.isInteger(value.tx) || !Number.isInteger(value.ty) || value.tx! < 0 || value.ty! < 0 || value.tx! > 40 || value.ty! > 40) return [];
    const placement: HomeLayoutPlacement = {
      itemId: value.itemId, tx: value.tx!, ty: value.ty!, rot: normalizeRot(value.rot),
      reform: cleanStyle(value.reform, value.itemId),
    };
    const key = homeLayoutPlacementKey(placement);
    if (seen.has(key)) return [];
    seen.add(key); return [placement];
  });
}

export function homeLayoutSignature(placements: readonly HomeLayoutPlacement[]): string {
  const source = [...placements].sort((a, b) => homeLayoutPlacementKey(a).localeCompare(homeLayoutPlacementKey(b)))
    .map((placement) => `${homeLayoutPlacementKey(placement)}:${placement.reform?.finishId ?? '-'}:${placement.reform?.colorId ?? '-'}`).join('|');
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index); hash = Math.imul(hash, 16777619);
  }
  return `${placements.length}-${(hash >>> 0).toString(36)}`;
}

export function makeHomeLayoutSnapshot(
  slot: number, labelId: HomeLayoutLabelId, placements: readonly Placed[],
  styleFor: (placementId: string) => FurnitureReformStyle | null = () => null,
  savedAt = Date.now(), applyCount = 0,
): HomeLayoutSnapshot {
  const snapshotPlacements = placements.slice(0, HOME_LAYOUT_PLACEMENT_MAX).map((placement) => ({
    itemId: placement.itemId, tx: placement.tx, ty: placement.ty, rot: placement.rot,
    reform: cleanStyle(styleFor(placement.id), placement.itemId),
  }));
  return {
    slot: Math.max(1, Math.min(HOME_LAYOUT_SLOT_MAX, Math.floor(slot))), labelId,
    placements: snapshotPlacements, savedAt: Math.max(0, Math.floor(savedAt)),
    saveCount: 1, applyCount: cleanCount(applyCount), signature: homeLayoutSignature(snapshotPlacements),
  };
}

export function normalizeHomeLayoutSnapshot(raw: unknown, fallbackSlot = 1): HomeLayoutSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<HomeLayoutSnapshot> & { label_id?: unknown; saved_at?: unknown; save_count?: unknown; apply_count?: unknown };
  const slot = Number(value.slot ?? fallbackSlot);
  const labelId = value.labelId ?? value.label_id;
  if (!Number.isInteger(slot) || slot < 1 || slot > HOME_LAYOUT_SLOT_MAX || !isHomeLayoutLabelId(labelId)) return null;
  const placements = normalizeHomeLayoutPlacements(value.placements);
  const savedRaw = value.savedAt ?? value.saved_at;
  const savedAt = typeof savedRaw === 'string' ? Date.parse(savedRaw) : Number(savedRaw);
  return {
    slot, labelId, placements, savedAt: Number.isFinite(savedAt) ? Math.max(0, Math.floor(savedAt)) : 0,
    saveCount: Math.max(1, cleanCount(value.saveCount ?? value.save_count)),
    applyCount: cleanCount(value.applyCount ?? value.apply_count), signature: homeLayoutSignature(placements),
  };
}

export function freshHomeLayoutState(): HomeLayoutState { return { version: 1, slots: {}, totalSaves: 0, totalApplies: 0 }; }

export function normalizeHomeLayoutState(raw: unknown): HomeLayoutState {
  if (!raw || typeof raw !== 'object') return freshHomeLayoutState();
  const value = raw as Partial<HomeLayoutState>;
  const slots: Record<string, HomeLayoutSnapshot> = {};
  if (value.slots && typeof value.slots === 'object') for (const [key, entry] of Object.entries(value.slots)) {
    const slot = Number(key); const snapshot = normalizeHomeLayoutSnapshot(entry, slot);
    if (snapshot) slots[String(snapshot.slot)] = snapshot;
  }
  return {
    version: 1, slots,
    totalSaves: Math.max(cleanCount(value.totalSaves), Object.values(slots).reduce((sum, slot) => sum + slot.saveCount, 0)),
    totalApplies: Math.max(cleanCount(value.totalApplies), Object.values(slots).reduce((sum, slot) => sum + slot.applyCount, 0)),
  };
}

export function homeLayoutProgress(state: HomeLayoutState): HomeLayoutProgress {
  const slots = Object.values(state.slots);
  return {
    savedSlots: slots.length, totalSaves: state.totalSaves, totalApplies: state.totalApplies,
    distinctScenes: new Set(slots.map((slot) => slot.signature)).size,
    itemTypes: new Set(slots.flatMap((slot) => slot.placements.map((placement) => placement.itemId))).size,
  };
}

export function prepareHomeLayoutApply(
  snapshot: HomeLayoutSnapshot | null, current: readonly Placed[], inventory: ReadonlyMap<string, number>,
  region: PlaceRegion, idPrefix = 'layout',
): HomeLayoutApplyResult {
  if (!snapshot) return { ok: false, reason: 'empty' };
  const available = new Map(inventory);
  for (const placement of current) available.set(placement.itemId, (available.get(placement.itemId) ?? 0) + 1);
  const needed = new Map<string, number>();
  for (const placement of snapshot.placements) needed.set(placement.itemId, (needed.get(placement.itemId) ?? 0) + 1);
  const missingItemIds = [...needed].filter(([itemId, count]) => (available.get(itemId) ?? 0) < count).map(([itemId]) => itemId);
  if (missingItemIds.length) return { ok: false, reason: 'missing', missingItemIds };

  const placements: Placed[] = [];
  const styles = new Map<string, FurnitureReformStyle>();
  for (const [index, saved] of snapshot.placements.entries()) {
    if (!canPlace(placements, saved.itemId, saved.tx, saved.ty, saved.rot, region)) return { ok: false, reason: 'invalid' };
    const id = `${idPrefix}-${index + 1}-${snapshot.signature}`;
    placements.push({ id, itemId: saved.itemId, tx: saved.tx, ty: saved.ty, rot: saved.rot });
    if (saved.reform) styles.set(id, { ...saved.reform });
  }
  const counts = new Map(available);
  for (const placement of placements) counts.set(placement.itemId, (counts.get(placement.itemId) ?? 0) - 1);
  return { ok: true, placements, counts, styles, snapshot };
}

export class HomeLayoutStore {
  private readonly key: string;
  private state: HomeLayoutState;

  constructor(userId: string, roomId: number) {
    this.key = `hv-home-layouts-v1:${userId}:${roomId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeHomeLayoutState(raw); this.persist();
  }

  snapshots(): HomeLayoutSnapshot[] { return Object.values(this.state.slots).map((slot) => structuredClone(slot)).sort((a, b) => a.slot - b.slot); }
  snapshot(slot: number): HomeLayoutSnapshot | null { const found = this.state.slots[String(slot)]; return found ? structuredClone(found) : null; }
  progress(): HomeLayoutProgress { return homeLayoutProgress(this.state); }

  save(snapshot: HomeLayoutSnapshot): HomeLayoutSnapshot {
    const previous = this.state.slots[String(snapshot.slot)];
    const next = normalizeHomeLayoutSnapshot({
      ...snapshot,
      saveCount: Math.max(snapshot.saveCount, (previous?.saveCount ?? 0) + 1),
      applyCount: Math.max(snapshot.applyCount, previous?.applyCount ?? 0),
    }, snapshot.slot)!;
    this.state.slots[String(next.slot)] = next; this.state.totalSaves += 1; this.persist(); return structuredClone(next);
  }

  replaceFromServer(snapshots: readonly HomeLayoutSnapshot[]): void {
    for (const snapshot of snapshots) {
      const local = this.state.slots[String(snapshot.slot)];
      const styles = new Map((local?.placements ?? []).map((placement) => [homeLayoutPlacementKey(placement), placement.reform]));
      const merged = { ...snapshot, placements: snapshot.placements.map((placement) => ({
        ...placement, reform: styles.get(homeLayoutPlacementKey(placement)) ?? placement.reform,
      })) };
      merged.signature = homeLayoutSignature(merged.placements);
      this.state.slots[String(snapshot.slot)] = merged;
    }
    this.state.totalSaves = Math.max(this.state.totalSaves, snapshots.reduce((sum, slot) => sum + slot.saveCount, 0));
    this.state.totalApplies = Math.max(this.state.totalApplies, snapshots.reduce((sum, slot) => sum + slot.applyCount, 0));
    this.persist();
  }

  recordApplied(slot: number): void {
    const snapshot = this.state.slots[String(slot)]; if (!snapshot) return;
    snapshot.applyCount += 1; this.state.totalApplies += 1; this.persist();
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
