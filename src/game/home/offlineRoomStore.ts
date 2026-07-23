import { CATALOG_BY_ID, STARTER_ITEMS } from '../../items/catalog';
import { normalizeRot, type Placed } from '../entities/placement';

export interface OfflineRoomState {
  version: 1;
  placements: Placed[];
  counts: Record<string, number>;
  grantedStarterIds: string[];
}

const cleanQty = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function normalizeOfflineRoomState(raw: unknown): OfflineRoomState {
  const obj = (raw ?? {}) as Partial<OfflineRoomState>;
  const placements = Array.isArray(obj.placements) ? obj.placements.flatMap((value, index) => {
    const p = value as Partial<Placed>;
    if (typeof p.itemId !== 'string' || !CATALOG_BY_ID.has(p.itemId)) return [];
    if (!Number.isInteger(p.tx) || !Number.isInteger(p.ty)) return [];
    return [{
      id: typeof p.id === 'string' && p.id ? p.id : `offline-restored-${index}`,
      itemId: p.itemId, tx: p.tx!, ty: p.ty!, rot: normalizeRot(p.rot),
    }];
  }) : [];
  const counts: Record<string, number> = {};
  if (obj.counts && typeof obj.counts === 'object') {
    for (const [id, qty] of Object.entries(obj.counts)) if (CATALOG_BY_ID.has(id)) counts[id] = cleanQty(qty);
  }
  const grantedStarterIds = Array.isArray(obj.grantedStarterIds)
    ? [...new Set(obj.grantedStarterIds.filter((id): id is string => typeof id === 'string'))]
    : [];

  // 시작 세트의 새 항목만 한 번씩 추가한다. 이미 배치/소비한 아이템이 재지급되는 일은 없다.
  for (const starter of STARTER_ITEMS) {
    if (grantedStarterIds.includes(starter.itemId)) continue;
    counts[starter.itemId] = (counts[starter.itemId] ?? 0) + starter.qty;
    grantedStarterIds.push(starter.itemId);
  }
  return { version: 1, placements, counts, grantedStarterIds };
}

/** 온라인 연결이 없어도 집 꾸미기 결과를 사용자·방별로 영구 보존한다. */
export class OfflineRoomStore {
  private state: OfflineRoomState;
  private readonly key: string;

  constructor(userId: string, roomId: number) {
    this.key = `hv-room-offline-${userId}-${roomId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeOfflineRoomState(raw);
    this.persist();
  }

  placements(): Placed[] { return this.state.placements.map((p) => ({ ...p })); }
  counts(): Map<string, number> { return new Map(Object.entries(this.state.counts)); }

  save(placements: readonly Placed[], counts: ReadonlyMap<string, number>): void {
    this.state = {
      ...this.state,
      placements: placements.map((p) => ({ ...p })),
      counts: Object.fromEntries([...counts].map(([id, qty]) => [id, cleanQty(qty)])),
    };
    this.persist();
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
