import type { SupabaseClient } from '@supabase/supabase-js';

/** 계정 동기 스냅샷 — 진행 데이터를 profiles.game_state(jsonb)에 저장해 기기 간 유지 (0014) */
export interface GameSnapshot {
  v: number;
  battle?: unknown;
  pets?: unknown;
  treasure?: unknown;
  quests?: unknown;
}

/** 서버에 저장된 스냅샷 로드. 없거나 미적용이면 null */
export async function loadGameState(sb: SupabaseClient, uid: string): Promise<GameSnapshot | null> {
  const { data, error } = await sb.from('profiles').select('game_state').eq('id', uid).maybeSingle();
  if (error) return null;
  const g = (data as { game_state?: unknown } | null)?.game_state;
  return g && typeof g === 'object' ? (g as GameSnapshot) : null;
}

/** 스냅샷 저장 (본인 프로필). 미적용/실패해도 게임엔 영향 없음 */
export async function saveGameState(sb: SupabaseClient, uid: string, snap: GameSnapshot): Promise<void> {
  try { await sb.from('profiles').update({ game_state: snap }).eq('id', uid); } catch { /* 무시 */ }
}
