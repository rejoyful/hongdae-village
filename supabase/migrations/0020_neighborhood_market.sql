-- 0020: 골목 나눔장터 — 고정 가격·인벤토리 에스크로·원자 정산
-- 자유문구와 임의 가격을 두지 않고, 정가의 40/60/80% 세 가격만 서버가 계산한다.

create table if not exists public.neighborhood_market_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  item_id text not null references public.item_prices(item_id),
  price_tier text not null check (price_tier in ('neighbor','fair','collector')),
  price int not null check (price > 0),
  status text not null default 'active' check (status in ('active','sold','cancelled')),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  check (
    (status = 'active' and buyer_id is null and settled_at is null)
    or (status = 'sold' and buyer_id is not null and settled_at is not null)
    or (status = 'cancelled' and buyer_id is null and settled_at is not null)
  )
);

create index if not exists neighborhood_market_active_idx
  on public.neighborhood_market_listings(status, created_at desc);
create index if not exists neighborhood_market_seller_idx
  on public.neighborhood_market_listings(seller_id, created_at desc);
create index if not exists neighborhood_market_buyer_idx
  on public.neighborhood_market_listings(buyer_id, settled_at desc);

alter table public.neighborhood_market_listings enable row level security;
drop policy if exists "market active and own history read" on public.neighborhood_market_listings;
create policy "market active and own history read" on public.neighborhood_market_listings
  for select using (
    status = 'active' or seller_id = auth.uid() or buyer_id = auth.uid()
  );
revoke insert, update, delete on public.neighborhood_market_listings from authenticated;

create or replace view public.neighborhood_market_active
with (security_invoker = true) as
select
  listing.id,
  listing.seller_id,
  profile.nickname as seller_name,
  listing.item_id,
  listing.price_tier,
  listing.price,
  listing.created_at
from public.neighborhood_market_listings listing
join public.profiles profile on profile.id = listing.seller_id
where listing.status = 'active';
grant select on public.neighborhood_market_active to authenticated;

create or replace function public.create_neighborhood_market_listing(
  p_item_id text,
  p_price_tier text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  base_price int;
  computed_price int;
  active_count int;
  listing_id uuid;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  if p_price_tier not in ('neighbor','fair','collector') then
    return jsonb_build_object('ok', false, 'reason', 'invalid-tier');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('neighborhood-market', 0));
  select price into base_price from public.item_prices where item_id = p_item_id;
  if base_price is null then return jsonb_build_object('ok', false, 'reason', 'no-item'); end if;
  select count(*) into active_count
    from public.neighborhood_market_listings
    where seller_id = uid and status = 'active';
  if active_count >= 6 then return jsonb_build_object('ok', false, 'reason', 'limit'); end if;

  update public.inventory
    set qty = qty - 1
    where user_id = uid and item_id = p_item_id and qty > 0;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no-stock'); end if;

  computed_price := greatest(5, round((
    base_price * case p_price_tier when 'neighbor' then 0.4 when 'collector' then 0.8 else 0.6 end
  ) / 5.0) * 5)::int;
  insert into public.neighborhood_market_listings(seller_id, item_id, price_tier, price)
    values (uid, p_item_id, p_price_tier, computed_price)
    returning id into listing_id;
  return jsonb_build_object('ok', true, 'listing_id', listing_id, 'price', computed_price);
end $$;

create or replace function public.cancel_neighborhood_market_listing(
  p_listing_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  listing public.neighborhood_market_listings%rowtype;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  perform pg_advisory_xact_lock(hashtextextended('neighborhood-market', 0));
  select * into listing from public.neighborhood_market_listings
    where id = p_listing_id for update;
  if not found or listing.seller_id <> uid then
    return jsonb_build_object('ok', false, 'reason', 'unknown');
  end if;
  if listing.status <> 'active' then return jsonb_build_object('ok', false, 'reason', 'settled'); end if;

  update public.neighborhood_market_listings
    set status = 'cancelled', settled_at = now()
    where id = listing.id;
  insert into public.inventory(user_id, item_id, qty)
    values (uid, listing.item_id, 1)
    on conflict (user_id, item_id) do update set qty = public.inventory.qty + 1;
  return jsonb_build_object('ok', true, 'item_id', listing.item_id);
end $$;

create or replace function public.buy_neighborhood_market_listing(
  p_listing_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  listing public.neighborhood_market_listings%rowtype;
  buyer_balance int;
  seller_balance int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  perform pg_advisory_xact_lock(hashtextextended('neighborhood-market', 0));
  select * into listing from public.neighborhood_market_listings
    where id = p_listing_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
  if listing.status <> 'active' then return jsonb_build_object('ok', false, 'reason', 'settled'); end if;
  if listing.seller_id = uid then return jsonb_build_object('ok', false, 'reason', 'self'); end if;

  update public.profiles
    set coins = coins - listing.price
    where id = uid and coins >= listing.price
    returning coins into buyer_balance;
  if buyer_balance is null then return jsonb_build_object('ok', false, 'reason', 'no-coins'); end if;

  update public.profiles
    set coins = coins + listing.price
    where id = listing.seller_id
    returning coins into seller_balance;
  if seller_balance is null then raise exception 'market seller missing during settlement'; end if;

  insert into public.inventory(user_id, item_id, qty)
    values (uid, listing.item_id, 1)
    on conflict (user_id, item_id) do update set qty = public.inventory.qty + 1;
  update public.neighborhood_market_listings
    set status = 'sold', buyer_id = uid, settled_at = now()
    where id = listing.id;
  insert into public.coin_ledger(user_id, amount, reason) values
    (uid, -listing.price, 'market_buy:' || listing.id::text),
    (listing.seller_id, listing.price, 'market_sale:' || listing.id::text);
  return jsonb_build_object(
    'ok', true,
    'item_id', listing.item_id,
    'price', listing.price,
    'buyer_balance', buyer_balance
  );
end $$;

create or replace function public.neighborhood_market_summary()
returns jsonb
language sql security definer set search_path = public stable as $$
  with mine as (
    select *
    from public.neighborhood_market_listings
    where seller_id = auth.uid() or buyer_id = auth.uid()
  ), traded as (
    select distinct listing.item_id, meta.category
    from mine listing
    left join public.home_item_meta meta on meta.item_id = listing.item_id
    where listing.status = 'sold'
  )
  select jsonb_build_object(
    'listings_created', (select count(*) from mine where seller_id = auth.uid()),
    'purchases', (select count(*) from mine where buyer_id = auth.uid() and status = 'sold'),
    'sales', (select count(*) from mine where seller_id = auth.uid() and status = 'sold'),
    'unique_item_ids', coalesce((select jsonb_agg(item_id order by item_id) from traded), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(category order by category) from (select distinct category from traded where category is not null) c), '[]'::jsonb)
  );
$$;

revoke all on function public.create_neighborhood_market_listing(text,text) from public, anon;
revoke all on function public.cancel_neighborhood_market_listing(uuid) from public, anon;
revoke all on function public.buy_neighborhood_market_listing(uuid) from public, anon;
revoke all on function public.neighborhood_market_summary() from public, anon;
grant execute on function public.create_neighborhood_market_listing(text,text) to authenticated;
grant execute on function public.cancel_neighborhood_market_listing(uuid) to authenticated;
grant execute on function public.buy_neighborhood_market_listing(uuid) to authenticated;
grant execute on function public.neighborhood_market_summary() to authenticated;
