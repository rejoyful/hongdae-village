import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeRot, type Placed } from '../game/entities/placement';
import {
  isHomeLayoutLabelId, normalizeHomeLayoutSnapshot,
  type HomeLayoutLabelId, type HomeLayoutSnapshot,
} from '../game/home/homeLayouts';

export type SaveHomeLayoutResult =
  | { ok: true; snapshot: HomeLayoutSnapshot }
  | { ok: false; reason: 'bad' | 'owner' | 'offline' };

export type ApplyHomeLayoutResult =
  | { ok: true; snapshot: HomeLayoutSnapshot; placements: Placed[] }
  | { ok: false; reason: 'bad' | 'owner' | 'empty' | 'missing' | 'offline'; missingItemIds: string[] };

export async function fetchHomeLayouts(sb: SupabaseClient, roomId: number): Promise<HomeLayoutSnapshot[]> {
  if (!Number.isInteger(roomId) || roomId <= 0) return [];
  const { data, error } = await sb.from('home_layout_slots')
    .select('slot,label_id,placements,save_count,apply_count,saved_at')
    .eq('room_id', roomId).order('slot');
  if (error || !data) return [];
  return data.flatMap((row) => normalizeHomeLayoutSnapshot(row, Number(row.slot)) ?? []);
}

export async function saveHomeLayout(
  sb: SupabaseClient, roomId: number, slot: number, labelId: HomeLayoutLabelId,
): Promise<SaveHomeLayoutResult> {
  if (!Number.isInteger(roomId) || roomId <= 0 || !Number.isInteger(slot) || slot < 1 || slot > 6 || !isHomeLayoutLabelId(labelId)) {
    return { ok: false, reason: 'bad' };
  }
  const { data, error } = await sb.rpc('save_home_layout_slot', {
    p_room_id: roomId, p_slot: slot, p_label_id: labelId,
  });
  if (error || !data || typeof data !== 'object') return { ok: false, reason: 'offline' };
  const payload = data as Record<string, unknown>;
  if (payload.ok !== true) return { ok: false, reason: payload.reason === 'owner' ? 'owner' : 'bad' };
  const snapshot = normalizeHomeLayoutSnapshot(payload, slot);
  return snapshot ? { ok: true, snapshot } : { ok: false, reason: 'bad' };
}

export async function applyHomeLayout(
  sb: SupabaseClient, roomId: number, slot: number,
): Promise<ApplyHomeLayoutResult> {
  if (!Number.isInteger(roomId) || roomId <= 0 || !Number.isInteger(slot) || slot < 1 || slot > 6) {
    return { ok: false, reason: 'bad', missingItemIds: [] };
  }
  const { data, error } = await sb.rpc('apply_home_layout_slot', { p_room_id: roomId, p_slot: slot });
  if (error || !data || typeof data !== 'object') return { ok: false, reason: 'offline', missingItemIds: [] };
  const payload = data as Record<string, unknown>;
  if (payload.ok !== true) {
    const reason = ['owner', 'empty', 'missing', 'bad'].includes(String(payload.reason))
      ? String(payload.reason) as 'owner' | 'empty' | 'missing' | 'bad' : 'bad';
    const missingItemIds = Array.isArray(payload.missingItemIds)
      ? payload.missingItemIds.filter((item): item is string => typeof item === 'string').slice(0, 20) : [];
    return { ok: false, reason, missingItemIds };
  }
  const snapshot = normalizeHomeLayoutSnapshot(payload, slot);
  const rawPlacements = Array.isArray(payload.placements) ? payload.placements : [];
  const placements = rawPlacements.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const value = entry as Record<string, unknown>;
    if (typeof value.id !== 'string' || typeof value.itemId !== 'string'
      || !Number.isInteger(value.tx) || !Number.isInteger(value.ty)) return [];
    return [{ id: value.id, itemId: value.itemId, tx: value.tx as number, ty: value.ty as number, rot: normalizeRot(value.rot) }];
  });
  return snapshot ? { ok: true, snapshot, placements } : { ok: false, reason: 'bad', missingItemIds: [] };
}
