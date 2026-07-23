import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0022_neighborhood_market.sql?raw';
import { normalizeMarketAction } from '../src/db/neighborhoodMarketApi';

describe('골목 나눔장터 서버 권한 계약', () => {
  it('직접 쓰기를 막고 모든 변경을 보안 함수에 가둔다', () => {
    expect(migration).toContain('revoke insert, update, delete on public.neighborhood_market_listings from authenticated');
    expect(migration.match(/security definer set search_path = public/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain('grant execute on function public.create_neighborhood_market_listing(text,text) to authenticated');
    expect(migration).toContain('grant execute on function public.buy_neighborhood_market_listing(uuid) to authenticated');
  });

  it('서버가 세 가격만 받아 정가의 40·60·80%를 직접 계산한다', () => {
    expect(migration).toContain("price_tier in ('neighbor','fair','collector')");
    expect(migration).toContain("case p_price_tier when 'neighbor' then 0.4 when 'collector' then 0.8 else 0.6 end");
    expect(migration).toContain('active_count >= 6');
  });

  it('등록 때 인벤토리를 에스크로로 빼고 취소 때 한 점을 돌려준다', () => {
    const create = migration.indexOf('create or replace function public.create_neighborhood_market_listing');
    const decrement = migration.indexOf('set qty = qty - 1', create);
    const insert = migration.indexOf('insert into public.neighborhood_market_listings', create);
    expect(decrement).toBeGreaterThan(create);
    expect(insert).toBeGreaterThan(decrement);
    const cancel = migration.indexOf('create or replace function public.cancel_neighborhood_market_listing');
    expect(migration.indexOf('do update set qty = public.inventory.qty + 1', cancel)).toBeGreaterThan(cancel);
  });

  it('구매는 자기 물건을 막고 잔액·판매자 정산·아이템 이전·원장을 한 함수에서 처리한다', () => {
    const buy = migration.match(/create or replace function public\.buy_neighborhood_market_listing[\s\S]*?end \$\$;/)?.[0] ?? '';
    expect(buy).toContain("reason', 'self'");
    expect(buy).toContain('coins = coins - listing.price');
    expect(buy).toContain('coins = coins + listing.price');
    expect(buy).toContain('on conflict (user_id, item_id) do update');
    expect(buy).toContain("'market_buy:'");
    expect(buy).toContain("'market_sale:'");
    expect(buy).toContain("status = 'sold'");
  });

  it('API는 서버 사유 코드와 성공 잔액만 안전하게 노출한다', () => {
    expect(normalizeMarketAction({ ok: false, reason: 'no-coins' })).toEqual({ ok: false, reason: 'no-coins' });
    expect(normalizeMarketAction({ ok: false, reason: 'hacked' })).toEqual({ ok: false, reason: 'error' });
    expect(normalizeMarketAction({
      ok: true, item_id: 'cactus', price: 75.8, buyer_balance: 210.9,
    })).toEqual({ ok: true, itemId: 'cactus', price: 75, balance: 210 });
  });
});
