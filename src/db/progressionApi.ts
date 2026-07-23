import type { SupabaseClient } from '@supabase/supabase-js';

export const VERIFIED_METRIC_KEYS = [
  'pet_adopt', 'pets_owned', 'pet_feed', 'pet_play', 'max_pet_affinity',
  'pet_tricks', 'pet_memories', 'q_place', 'home_unique_items',
  'home_categories', 'home_theme_power', 'home_score',
] as const;

export type VerifiedMetricKey = typeof VERIFIED_METRIC_KEYS[number];

export interface VerifiedProgress {
  metrics: Partial<Record<VerifiedMetricKey, number>>;
  badges: string[];
}

const cleanCount = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null
);

export function normalizeVerifiedProgress(raw: unknown): VerifiedProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { ok?: unknown; metrics?: unknown; badges?: unknown };
  if (obj.ok !== true || !obj.metrics || typeof obj.metrics !== 'object') return null;
  const metrics: Partial<Record<VerifiedMetricKey, number>> = {};
  for (const key of VERIFIED_METRIC_KEYS) {
    const value = cleanCount((obj.metrics as Record<string, unknown>)[key]);
    if (value !== null) metrics[key] = value;
  }
  const badges = Array.isArray(obj.badges)
    ? [...new Set(obj.badges.filter((id): id is string => typeof id === 'string' && id.startsWith('badge_')))]
    : [];
  return { metrics, badges };
}

/** DB가 실제 보유 행에서 다시 계산한 장기 진행과 검증 배지를 가져온다. */
export async function refreshVerifiedProgress(sb: SupabaseClient): Promise<VerifiedProgress | null> {
  const { data, error } = await sb.rpc('refresh_verified_progress');
  if (error) return null; // 0013 미적용 서버는 로컬 진행을 유지
  return normalizeVerifiedProgress(data);
}

export type DailyClaimResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'claimed' | 'not-ready' | 'invalid' | 'no-rpc' | 'error' };

/** 일일 퀘스트 보상은 전용 RPC가 실제 활동 기록을 검증한 뒤 지급한다. */
export async function claimDailyQuest(sb: SupabaseClient, questId: string): Promise<DailyClaimResult> {
  const { data, error } = await sb.rpc('claim_daily_quest', { p_quest_id: questId });
  if (error || typeof data !== 'number') return { ok: false, reason: 'no-rpc' };
  if (data >= 0) return { ok: true, balance: data };
  if (data === -3) return { ok: false, reason: 'claimed' };
  if (data === -4) return { ok: false, reason: 'not-ready' };
  if (data === -2) return { ok: false, reason: 'invalid' };
  return { ok: false, reason: 'error' };
}

/** 숲 체류·이모트처럼 DB 행이 없던 행동을 서버 시간 기준으로 누적한다. */
export async function recordDailyProgress(sb: SupabaseClient, key: 'q_forest' | 'q_emote'): Promise<number | null> {
  const { data, error } = await sb.rpc('record_daily_progress', { p_key: key });
  return !error && typeof data === 'number' && data >= 0 ? data : null;
}
