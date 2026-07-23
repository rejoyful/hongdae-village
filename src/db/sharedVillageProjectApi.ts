import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import {
  isSharedProjectContributionKind, normalizeSharedProjectState,
  type SharedProjectContributionKind, type SharedProjectState,
} from '../game/projects/sharedVillageProject';

export type SharedProjectApiResult =
  | { ok: true; state: SharedProjectState }
  | { ok: false; reason: 'today' | 'bad' | 'offline'; state?: SharedProjectState };

const stateFromPayload = (payload: unknown): SharedProjectState | null => {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;
  const source = value.state && typeof value.state === 'object' ? value.state : value;
  if (!source || typeof source !== 'object') return null;
  const stateValue = source as Record<string, unknown>;
  if (stateValue.ok === false) return null;
  return normalizeSharedProjectState(stateValue);
};

export async function fetchSharedVillageProject(sb: SupabaseClient): Promise<SharedProjectApiResult> {
  const { data, error } = await sb.rpc('get_shared_village_project');
  const state = !error ? stateFromPayload(data) : null;
  return state ? { ok: true, state } : { ok: false, reason: 'offline' };
}

export async function contributeSharedVillageProject(
  sb: SupabaseClient, kind: SharedProjectContributionKind,
): Promise<SharedProjectApiResult> {
  if (!isSharedProjectContributionKind(kind)) return { ok: false, reason: 'bad' };
  const { data, error } = await sb.rpc('contribute_shared_village_project', { p_kind: kind });
  if (error || !data || typeof data !== 'object') return { ok: false, reason: 'offline' };
  const payload = data as Record<string, unknown>;
  const state = stateFromPayload(payload);
  if (payload.ok === true && state) return { ok: true, state };
  const reason = payload.reason === 'today' ? 'today' : 'bad';
  return { ok: false, reason, ...(state ? { state } : {}) };
}

export function subscribeSharedVillageProject(
  sb: SupabaseClient, onChange: () => void,
): () => void {
  const channel: RealtimeChannel = sb.channel('shared-village-project')
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'shared_village_projects',
      filter: 'project_id=eq.night_garden',
    }, () => onChange())
    .subscribe();
  return () => { void sb.removeChannel(channel); };
}
