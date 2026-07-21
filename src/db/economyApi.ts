import type { SupabaseClient } from '@supabase/supabase-js';

/** 코인 잔액 (RPC로만 변경 가능 — 0004 컬럼 권한) */
export async function fetchCoins(sb: SupabaseClient, uid: string): Promise<number> {
  const { data } = await sb.from('profiles').select('coins').eq('id', uid).maybeSingle();
  return (data?.coins as number | undefined) ?? 0;
}

/** 출석 보상. 성공 시 새 잔액, 오늘 이미 받았으면 null */
export async function claimDaily(sb: SupabaseClient): Promise<number | null> {
  const { data, error } = await sb.rpc('claim_daily');
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}

export type BuyResult = { ok: true; balance: number } | { ok: false; reason: 'no-item' | 'no-coins' | 'error' };

export async function buyItem(sb: SupabaseClient, itemId: string): Promise<BuyResult> {
  const { data, error } = await sb.rpc('buy_item', { p_item_id: itemId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'error' };
  if (data === -2) return { ok: false, reason: 'no-item' };
  if (data === -3) return { ok: false, reason: 'no-coins' };
  if (data < 0) return { ok: false, reason: 'error' };
  return { ok: true, balance: data };
}

export async function sellItem(sb: SupabaseClient, itemId: string): Promise<number | null> {
  const { data, error } = await sb.rpc('sell_item', { p_item_id: itemId });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}
