import type { SupabaseClient } from '@supabase/supabase-js';

/** 무기 구매 — 서버 buy_weapon RPC(0012). 가격 SSOT=서버. 미적용 시 'no-rpc' → 무료 폴백 */
export type BuyWeaponResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'no-coins' | 'no-rpc' | 'error' };

export async function buyWeapon(sb: SupabaseClient, weaponId: string): Promise<BuyWeaponResult> {
  const { data, error } = await sb.rpc('buy_weapon', { p_weapon_id: weaponId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'no-rpc' };
  if (data === -1) return { ok: false, reason: 'no-coins' };
  if (data === -2) return { ok: false, reason: 'no-rpc' };
  if (data < 0) return { ok: false, reason: 'error' };
  return { ok: true, balance: data };
}

/** 서버 보유 무기 목록 (기기 간 동기). 미적용이면 빈 배열 */
export async function fetchOwnedWeapons(sb: SupabaseClient, uid: string): Promise<string[]> {
  const { data, error } = await sb.from('owned_weapons').select('weapon_id').eq('user_id', uid);
  if (error || !Array.isArray(data)) return [];
  return data.map((r) => r.weapon_id as string).filter((x) => typeof x === 'string');
}
