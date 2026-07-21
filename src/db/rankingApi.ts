import type { SupabaseClient } from '@supabase/supabase-js';
import { assignRanks, type RankRow } from '../game/ranking';

/** 코인 랭킹 상위 N — profiles_read_all 정책으로 누구나 조회 가능 */
export async function fetchRanking(sb: SupabaseClient, limit = 30): Promise<RankRow[]> {
  const { data, error } = await sb
    .from('profiles')
    .select('id, nickname, coins')
    .order('coins', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return assignRanks(data.map((r) => ({
    userId: r.id as string,
    nickname: (r.nickname as string | null) ?? '주민',
    coins: (r.coins as number | null) ?? 0,
  })));
}
