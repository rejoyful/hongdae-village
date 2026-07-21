import type { SupabaseClient } from '@supabase/supabase-js';
import type { Placed, Rot } from '../game/entities/placement';
import { STARTER_ITEMS } from '../items/catalog';

export interface RoomInfo { id: number; ownerId: string | null }

export async function fetchRooms(sb: SupabaseClient): Promise<RoomInfo[]> {
  const { data, error } = await sb.from('rooms').select('id,owner_id').order('id');
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id as number, ownerId: (r.owner_id as string | null) ?? null }));
}

/** 빈 방 선착순 입주. RLS + owner_id null 조건으로 레이스에도 한 명만 성공 */
export async function claimRoom(sb: SupabaseClient, roomId: number, uid: string): Promise<boolean> {
  const { data, error } = await sb.from('rooms')
    .update({ owner_id: uid, claimed_at: new Date().toISOString() })
    .eq('id', roomId).is('owner_id', null).select('id');
  return !error && (data?.length ?? 0) > 0;
}

/** 첫 입주 시 시작 가구 1회 지급 */
export async function grantStarterOnce(sb: SupabaseClient, uid: string): Promise<void> {
  const { data } = await sb.from('inventory').select('item_id').eq('user_id', uid).limit(1);
  if (data && data.length > 0) return;
  await sb.from('inventory').insert(
    STARTER_ITEMS.map((s) => ({ user_id: uid, item_id: s.itemId, qty: s.qty })),
  );
}

export async function fetchInventory(sb: SupabaseClient, uid: string): Promise<Map<string, number>> {
  const { data } = await sb.from('inventory').select('item_id,qty').eq('user_id', uid);
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.item_id as string, row.qty as number);
  return map;
}

/** 수량 증감 (지인 서버 기준 낙관적 처리 — 정밀 원장은 Phase 4 coin_ledger에서) */
export async function adjustInventory(sb: SupabaseClient, uid: string, itemId: string, delta: number): Promise<void> {
  const { data } = await sb.from('inventory').select('qty').eq('user_id', uid).eq('item_id', itemId).maybeSingle();
  const cur = (data?.qty as number | undefined) ?? 0;
  const next = Math.max(0, cur + delta);
  await sb.from('inventory').upsert({ user_id: uid, item_id: itemId, qty: next });
}

function rowToPlaced(row: Record<string, unknown>): Placed {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    tx: row.tx as number,
    ty: row.ty as number,
    rot: (row.rot as number) === 1 ? 1 : 0 as Rot,
  };
}

export async function fetchPlacements(sb: SupabaseClient, roomId: number): Promise<Placed[]> {
  const { data } = await sb.from('placements').select('*').eq('room_id', roomId);
  return (data ?? []).map(rowToPlaced);
}

export async function insertPlacement(
  sb: SupabaseClient, roomId: number, p: Omit<Placed, 'id'>,
): Promise<string | null> {
  const { data, error } = await sb.from('placements')
    .insert({ room_id: roomId, item_id: p.itemId, tx: p.tx, ty: p.ty, rot: p.rot })
    .select('id').single();
  if (error || !data) return null;
  return data.id as string;
}

export async function deletePlacement(sb: SupabaseClient, id: string): Promise<boolean> {
  const { error } = await sb.from('placements').delete().eq('id', id);
  return !error;
}

/** 방 배치 변경 실시간 구독 — 변경 시 재조회 콜백. 반환값은 해제 함수 */
export function subscribePlacements(sb: SupabaseClient, roomId: number, onChange: () => void): () => void {
  const ch = sb.channel(`room-placements-${roomId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'placements', filter: `room_id=eq.${roomId}` },
      () => onChange())
    .subscribe();
  return () => { void sb.removeChannel(ch); };
}
