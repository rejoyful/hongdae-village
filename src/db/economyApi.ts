import type { SupabaseClient } from '@supabase/supabase-js';
import { furnitureAcquisitionChannel } from '../game/home/furnitureWorkshop';

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

export type BuyResult = { ok: true; balance: number } | { ok: false; reason: 'no-item' | 'no-coins' | 'diy-only' | 'not-in-rotation' | 'error' };

export async function buyItem(sb: SupabaseClient, itemId: string): Promise<BuyResult> {
  const { data, error } = await sb.rpc('buy_item', { p_item_id: itemId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'error' };
  if (data === -2) return { ok: false, reason: 'no-item' };
  if (data === -3) return { ok: false, reason: 'no-coins' };
  if (data === -5) return { ok: false, reason: 'diy-only' };
  if (data === -6) return { ok: false, reason: 'not-in-rotation' };
  if (data < 0) return { ok: false, reason: 'error' };
  return { ok: true, balance: data };
}

export type CraftFurnitureResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'invalid-recipe' | 'no-coins' | 'missing-materials' | 'no-rpc' };

/** 제작 재료 차감·공임 결제·결과 지급을 서버 트랜잭션 한 번으로 처리한다. */
export async function craftFurniture(sb: SupabaseClient, recipeId: string): Promise<CraftFurnitureResult> {
  const { data, error } = await sb.rpc('craft_furniture', { p_recipe_id: recipeId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'no-rpc' };
  if (data >= 0) return { ok: true, balance: data };
  if (data === -2) return { ok: false, reason: 'invalid-recipe' };
  if (data === -3) return { ok: false, reason: 'no-coins' };
  return { ok: false, reason: 'missing-materials' };
}

/** 서버 제작 이력에서 레시피별 누적 횟수를 읽는다. */
export async function fetchFurnitureCraftHistory(sb: SupabaseClient, uid: string): Promise<Map<string, number>> {
  const { data, error } = await sb.from('furniture_craft_history').select('recipe_id').eq('user_id', uid);
  const history = new Map<string, number>();
  if (error) return history; // 0016 적용 전에는 빈 작업일지로 안전하게 폴백
  for (const row of data ?? []) {
    const recipeId = row.recipe_id;
    if (typeof recipeId === 'string') history.set(recipeId, (history.get(recipeId) ?? 0) + 1);
  }
  return history;
}

/** 서버 거래 원장에서 한 번이라도 구매한 주간 큐레이션 가구를 복원한다. 판매해도 기록은 남는다. */
export async function fetchWeeklyFurniturePurchaseHistory(sb: SupabaseClient, uid: string): Promise<Set<string>> {
  const { data, error } = await sb.from('coin_ledger').select('reason').eq('user_id', uid).like('reason', 'buy:%');
  const history = new Set<string>();
  if (error) return history;
  for (const row of data ?? []) {
    const reason = row.reason;
    if (typeof reason !== 'string' || !reason.startsWith('buy:')) continue;
    const itemId = reason.slice(4);
    if (furnitureAcquisitionChannel(itemId) === 'weekly') history.add(itemId);
  }
  return history;
}

export async function sellItem(sb: SupabaseClient, itemId: string): Promise<number | null> {
  const { data, error } = await sb.rpc('sell_item', { p_item_id: itemId });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}
