import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** .env.local의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 필요. 없으면 throw → 오프라인 모드 폴백 */
export function createSupabase(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 .env.local에 필요합니다');
  }
  return createClient(url, key);
}
