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

/**
 * 시작 가구(웰컴 박스) 지급 — 서버 RPC(0007)가 지급. 없는 아이템만 채우므로 여러 번 불러도 안전.
 * RPC가 아직 없는 구 스키마에서는 직접 upsert로 폴백 (마이그레이션 전환기 호환).
 */
export async function grantStarterOnce(sb: SupabaseClient, uid: string): Promise<void> {
  const { error } = await sb.rpc('grant_starter');
  if (error) {
    await sb.from('inventory').upsert(
      STARTER_ITEMS.map((s) => ({ user_id: uid, item_id: s.itemId, qty: s.qty })),
      { onConflict: 'user_id,item_id', ignoreDuplicates: true },
    );
  }
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

/**
 * 가구 배치 — 서버 RPC place_item(0007)이 방 소유·보유 수량·좌표를 검증하고
 * 인벤 차감까지 원자 처리. 구 스키마에서는 직접 insert + 인벤 차감으로 폴백.
 */
export async function insertPlacement(
  sb: SupabaseClient, roomId: number, uid: string, p: Omit<Placed, 'id'>,
): Promise<string | null> {
  const { data, error } = await sb.rpc('place_item', {
    p_room_id: roomId, p_item_id: p.itemId, p_tx: p.tx, p_ty: p.ty, p_rot: p.rot,
  });
  if (!error) return (data as string | null) ?? null;
  // 구 스키마 폴백 (RPC 미존재)
  const legacy = await sb.from('placements')
    .insert({ room_id: roomId, item_id: p.itemId, tx: p.tx, ty: p.ty, rot: p.rot })
    .select('id').single();
  if (legacy.error || !legacy.data) return null;
  void adjustInventory(sb, uid, p.itemId, -1);
  return legacy.data.id as string;
}

/** 가구 회수 — RPC pickup_item이 삭제+인벤 복귀 원자 처리. 구 스키마 폴백 포함 */
export async function deletePlacement(
  sb: SupabaseClient, id: string, uid: string, itemId: string,
): Promise<boolean> {
  const { data, error } = await sb.rpc('pickup_item', { p_placement_id: id });
  if (!error) return data === true;
  const legacy = await sb.from('placements').delete().eq('id', id);
  if (legacy.error) return false;
  void adjustInventory(sb, uid, itemId, 1);
  return true;
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
