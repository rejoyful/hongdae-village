import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 펫 입양 — 서버 adopt_pet RPC(0011). 가격은 서버가 SSOT라 클라가 못 속인다.
 * 반환: { ok, balance } | { ok:false, reason }.
 * reason 'no-rpc' 는 미적용 서버(마이그레이션 전) — 호출측이 무료 입양으로 폴백한다.
 */
export type AdoptResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'no-coins' | 'no-rpc' | 'error' };

export async function adoptPet(sb: SupabaseClient, petId: string): Promise<AdoptResult> {
  const { data, error } = await sb.rpc('adopt_pet', { p_pet_id: petId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'no-rpc' };
  if (data === -1) return { ok: false, reason: 'no-coins' };
  if (data === -2) return { ok: false, reason: 'no-rpc' };
  if (data < 0) return { ok: false, reason: 'error' };
  return { ok: true, balance: data };
}

/** 서버 보유 펫 목록 (기기 간 동기). 테이블 미적용이면 빈 배열 */
export async function fetchOwnedPets(sb: SupabaseClient, uid: string): Promise<string[]> {
  const { data, error } = await sb.from('owned_pets').select('pet_id').eq('user_id', uid);
  if (error || !Array.isArray(data)) return [];
  return data.map((r) => r.pet_id as string).filter((x) => typeof x === 'string');
}
