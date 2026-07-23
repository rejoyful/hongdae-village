import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeRot, type Placed } from '../game/entities/placement';

export interface RoomInfo { id: number; ownerId: string | null; isPublic: boolean }

export async function fetchRooms(sb: SupabaseClient): Promise<RoomInfo[]> {
  const { data, error } = await sb.from('rooms').select('id,owner_id,is_public').order('id');
  if (error || !data) return [];
  return data.map((r) => ({ id: r.id as number, ownerId: (r.owner_id as string | null) ?? null, isPublic: r.is_public === true }));
}

export async function setRoomPublic(sb: SupabaseClient, roomId: number, isPublic: boolean): Promise<boolean> {
  const { data, error } = await sb.rpc('set_room_public', { p_room_id: roomId, p_public: isPublic });
  return !error && data === true;
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
 * 직접 인벤토리 쓰기 폴백은 무한 판매 악용 경로가 되므로 허용하지 않는다.
 */
export async function grantStarterOnce(sb: SupabaseClient, _uid: string): Promise<void> {
  await sb.rpc('grant_starter');
}

export async function fetchInventory(sb: SupabaseClient, uid: string): Promise<Map<string, number>> {
  const { data } = await sb.from('inventory').select('item_id,qty').eq('user_id', uid);
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.item_id as string, row.qty as number);
  return map;
}

function rowToPlaced(row: Record<string, unknown>): Placed {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    tx: row.tx as number,
    ty: row.ty as number,
    rot: normalizeRot(row.rot),
  };
}

export async function fetchPlacements(sb: SupabaseClient, roomId: number): Promise<Placed[]> {
  const { data } = await sb.from('placements').select('*').eq('room_id', roomId);
  return (data ?? []).map(rowToPlaced);
}

/**
 * 가구 배치 — 서버 RPC place_item(0007)이 방 소유·보유 수량·좌표를 검증하고
 * 인벤 차감까지 원자 처리. RPC가 없으면 안전하게 실패한다.
 */
export async function insertPlacement(
  sb: SupabaseClient, roomId: number, _uid: string, p: Omit<Placed, 'id'>,
): Promise<string | null> {
  const { data, error } = await sb.rpc('place_item', {
    p_room_id: roomId, p_item_id: p.itemId, p_tx: p.tx, p_ty: p.ty, p_rot: p.rot,
  });
  return !error ? ((data as string | null) ?? null) : null;
}

/** 가구 회수 — RPC pickup_item이 삭제+인벤 복귀를 원자 처리하며 직접 삭제 폴백은 없다. */
export async function deletePlacement(
  sb: SupabaseClient, id: string, _uid: string, _itemId: string,
): Promise<boolean> {
  const { data, error } = await sb.rpc('pickup_item', { p_placement_id: id });
  return !error && data === true;
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
