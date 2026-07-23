import type { SupabaseClient } from '@supabase/supabase-js';

export interface ServerPetProgress {
  petId: string;
  affinity: number;
  feeds: number;
  plays: number;
  trainings: number;
  tricks: string[];
  lastFedDay: string | null;
  lastPlayedDay: string | null;
  lastTrainedDay: string | null;
}

export type PetCareAction = 'feed' | 'play' | 'pet' | 'train';
export type PetCareResult =
  | { ok: true; affinity: number; feeds: number; plays: number; trainings: number; tricks: string[]; trick: string | null }
  | { ok: false; reason: 'auth' | 'not-owned' | 'daily' | 'daily-cap' | 'affinity' | 'done' | 'action' | 'no-rpc' | 'error'; required?: number; nextTrick?: string };

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

const count = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
);

/** 0013 서버 펫 성장 스냅샷. 구 서버면 null을 반환해 보유 목록 폴백을 허용한다. */
export async function fetchPetProgress(sb: SupabaseClient, uid: string): Promise<ServerPetProgress[] | null> {
  const { data, error } = await sb.from('owned_pets')
    .select('pet_id,affinity,feeds,plays,trainings,learned_tricks,last_fed_day,last_played_day,last_trained_day')
    .eq('user_id', uid);
  if (error || !Array.isArray(data)) return null;
  return data.map((row) => ({
    petId: String(row.pet_id), affinity: Math.min(100, count(row.affinity)),
    feeds: count(row.feeds), plays: count(row.plays), trainings: count(row.trainings),
    tricks: Array.isArray(row.learned_tricks) ? row.learned_tricks.filter((id): id is string => typeof id === 'string') : [],
    lastFedDay: typeof row.last_fed_day === 'string' ? row.last_fed_day : null,
    lastPlayedDay: typeof row.last_played_day === 'string' ? row.last_played_day : null,
    lastTrainedDay: typeof row.last_trained_day === 'string' ? row.last_trained_day : null,
  }));
}

/** 소유권·KST 일일 제한·친밀도 조건을 서버가 검증하는 펫 행동. */
export async function carePet(sb: SupabaseClient, petId: string, action: PetCareAction): Promise<PetCareResult> {
  const { data, error } = await sb.rpc('pet_care', { p_pet_id: petId, p_action: action });
  if (error || !data || typeof data !== 'object') return { ok: false, reason: 'no-rpc' };
  const obj = data as Record<string, unknown>;
  if (obj.ok !== true) {
    const allowed = new Set(['auth','not-owned','daily','daily-cap','affinity','done','action']);
    const reason = typeof obj.reason === 'string' && allowed.has(obj.reason) ? obj.reason : 'error';
    return {
      ok: false, reason: reason as Exclude<PetCareResult, { ok: true }>['reason'],
      required: typeof obj.required === 'number' ? obj.required : undefined,
      nextTrick: typeof obj.next_trick === 'string' ? obj.next_trick : undefined,
    };
  }
  return {
    ok: true, affinity: Math.min(100, count(obj.affinity)), feeds: count(obj.feeds),
    plays: count(obj.plays), trainings: count(obj.trainings),
    tricks: Array.isArray(obj.tricks) ? obj.tricks.filter((id): id is string => typeof id === 'string') : [],
    trick: typeof obj.trick === 'string' ? obj.trick : null,
  };
}

export async function claimRarePet(sb: SupabaseClient, petId: string): Promise<'ok' | 'locked' | 'no-rpc'> {
  const { data, error } = await sb.rpc('claim_rare_pet', { p_pet_id: petId });
  if (error || typeof data !== 'boolean') return 'no-rpc';
  return data ? 'ok' : 'locked';
}
