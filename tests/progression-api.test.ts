import { describe, expect, it } from 'vitest';
import { claimDailyQuest, normalizeVerifiedProgress, VERIFIED_METRIC_KEYS } from '../src/db/progressionApi';
import { carePet } from '../src/db/petApi';
import migration from '../supabase/migrations/0015_verified_progression.sql?raw';

describe('검증 진행 API 정규화', () => {
  it('서버가 허용한 지표와 유효한 배지 문자열만 받는다', () => {
    const value = normalizeVerifiedProgress({
      ok: true,
      metrics: { pets_owned: 3.9, home_score: 91, hacked_coins: 999999, pet_feed: -2 },
      badges: ['badge_intro_pet', 'x', 'badge_intro_pet', 7],
    });
    expect(value).toEqual({ metrics: { pets_owned: 3, home_score: 91 }, badges: ['badge_intro_pet'] });
    expect(VERIFIED_METRIC_KEYS).not.toContain('hacked_coins');
  });

  it('형식이 틀리거나 ok가 아닌 응답은 거부한다', () => {
    expect(normalizeVerifiedProgress(null)).toBeNull();
    expect(normalizeVerifiedProgress({ ok: false, metrics: {} })).toBeNull();
    expect(normalizeVerifiedProgress({ ok: true, metrics: null })).toBeNull();
  });

  it('일일 보상과 펫 돌봄의 서버 사유 코드를 UI용 결과로 보존한다', async () => {
    const notReady = { rpc: async () => ({ data: -4, error: null }) } as unknown as Parameters<typeof claimDailyQuest>[0];
    expect(await claimDailyQuest(notReady, 'quest_cafe')).toEqual({ ok: false, reason: 'not-ready' });
    const paid = { rpc: async () => ({ data: 777, error: null }) } as unknown as Parameters<typeof claimDailyQuest>[0];
    expect(await claimDailyQuest(paid, 'quest_cafe')).toEqual({ ok: true, balance: 777 });
    const affinity = { rpc: async () => ({
      data: { ok: false, reason: 'affinity', required: 50, next_trick: 'spin' }, error: null,
    }) } as unknown as Parameters<typeof carePet>[0];
    expect(await carePet(affinity, 'dog', 'train')).toEqual({
      ok: false, reason: 'affinity', required: 50, nextTrick: 'spin',
    });
  });
});

describe('0013 서버 권위 마이그레이션 계약', () => {
  it('전체 65종 가구의 메타를 서버 SSOT에 시딩한다', () => {
    const seed = migration.match(/insert into public\.home_item_meta[\s\S]*?on conflict \(item_id\)/)?.[0] ?? '';
    expect(seed.match(/\('[a-z0-9_]+','(?:furniture|electronics|plant|deco|rug|wall)'/g)).toHaveLength(65);
  });

  it('펫 돌봄은 소유 행을 잠그고 직접 쓰기를 차단한다', () => {
    const care = migration.match(/create or replace function public\.pet_care[\s\S]*?end \$\$;/)?.[0] ?? '';
    expect(care).toContain('for update');
    expect(care).toContain("p_action = 'feed'");
    expect(care).toContain("p_action = 'train'");
    expect(migration).toContain('revoke insert, update, delete on public.owned_pets from authenticated');
  });

  it('가구 배치는 실제 크기·주택 유형·레이어 겹침을 검증한다', () => {
    const place = migration.match(/create or replace function public\.place_item[\s\S]*?end \$\$;/)?.[0] ?? '';
    expect(place).toContain('pr.house_type');
    expect(place).toContain('p_tx + iw - 1 > max_x');
    expect(place).toContain('new_layer');
    expect(place).toContain('public.home_item_meta');
  });

  it('일반 활동 RPC에서 퀘스트 문자열을 제거하고 전용 검증·동시 잠금을 사용한다', () => {
    const earn = migration.match(/create or replace function public\.earn_activity[\s\S]*?end \$\$;/)?.[0] ?? '';
    const claim = migration.match(/create or replace function public\.claim_daily_quest[\s\S]*?end \$\$;/)?.[0] ?? '';
    expect(earn).not.toContain("'quest_cafe'");
    expect(claim).toContain('pg_advisory_xact_lock');
    expect(claim).toContain("reason = 'cafe'");
    expect(claim).toContain('p.created_at >= start_at');
  });
});
