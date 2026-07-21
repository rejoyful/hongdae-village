-- 홍대마을 통합 마이그레이션 (0003+0004+0005, 중복 실행 안전)
alter table public.profiles add column if not exists appearance jsonb;
alter table public.profiles add column if not exists coins int not null default 300;

revoke update on public.profiles from authenticated;
grant update (id, nickname, color, appearance) on public.profiles to authenticated;

create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.coin_ledger enable row level security;
drop policy if exists "ledger_read_own" on public.coin_ledger;
create policy "ledger_read_own" on public.coin_ledger for select using (auth.uid() = user_id);

create table if not exists public.item_prices (
  item_id text primary key,
  price int not null check (price > 0)
);
alter table public.item_prices enable row level security;
drop policy if exists "prices_read_all" on public.item_prices;
create policy "prices_read_all" on public.item_prices for select using (true);
insert into public.item_prices (item_id, price) values
  ('bed_basic', 480),
  ('bed_blue', 500),
  ('bed_green', 680),
  ('desk_wood', 340),
  ('desk_white', 340),
  ('table_low', 340),
  ('tea_table', 250),
  ('dining_table', 520),
  ('side_table', 250),
  ('chair_wood', 250),
  ('chair_cushion', 250),
  ('stool', 250),
  ('sofa_coral', 340),
  ('sofa_gray', 520),
  ('sofa_single', 250),
  ('bookshelf', 340),
  ('bookshelf_wide', 520),
  ('drawer', 340),
  ('wardrobe', 620),
  ('dresser', 420),
  ('hanger_rack', 340),
  ('shoe_rack', 340),
  ('kitchen_counter', 340),
  ('sink_unit', 340),
  ('dry_rack', 340),
  ('mirror_full', 250),
  ('tv_stand', 640),
  ('pc_setup', 720),
  ('laptop_desk', 330),
  ('turntable', 380),
  ('speaker_amp', 340),
  ('fridge', 560),
  ('washer', 460),
  ('fan_stand', 330),
  ('coffee_maker', 330),
  ('lamp_stand', 330),
  ('lamp_mood', 330),
  ('plant_pot', 190),
  ('cactus', 190),
  ('stuckyi', 190),
  ('flower_vase', 190),
  ('mini_garden', 280),
  ('window_plant', 280),
  ('rug_cream', 660),
  ('rug_check', 660),
  ('rug_round', 480),
  ('rug_long', 480),
  ('fish_tank', 180),
  ('guitar', 180),
  ('mic_stand', 180),
  ('easel', 180),
  ('book_pile', 180),
  ('candle_set', 180),
  ('bear_doll', 180),
  ('cat_tower', 360),
  ('skateboard', 180),
  ('lp_crate', 180),
  ('cushion', 180),
  ('moving_box', 180),
  ('poster_band', 190),
  ('poster_film', 190),
  ('neon_sign', 320),
  ('wall_clock', 190),
  ('wall_shelf', 280),
  ('photo_frames', 280)
on conflict (item_id) do update set price = excluded.price;

-- 출석 보상: 하루 1회 100코인
create or replace function public.claim_daily() returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); bal int;
begin
  if uid is null then return -1; end if;
  if exists (select 1 from coin_ledger where user_id = uid and reason = 'daily'
             and created_at >= date_trunc('day', now())) then
    return -1; -- 오늘 이미 수령
  end if;
  update profiles set coins = coins + 100 where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, 100, 'daily');
  return bal;
end $$;

-- 구매: 서버가 가격 조회·잔액 검증·원장 기록·인벤 지급을 원자 처리
create or replace function public.buy_item(p_item_id text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p int; bal int;
begin
  if uid is null then return -1; end if;
  select price into p from item_prices where item_id = p_item_id;
  if p is null then return -2; end if;
  update profiles set coins = coins - p where id = uid and coins >= p returning coins into bal;
  if bal is null then return -3; end if; -- 잔액 부족
  insert into coin_ledger (user_id, amount, reason) values (uid, -p, 'buy:' || p_item_id);
  insert into inventory (user_id, item_id, qty) values (uid, p_item_id, 1)
    on conflict (user_id, item_id) do update set qty = inventory.qty + 1;
  return bal;
end $$;

-- 판매: 보유 확인 후 반값 환급
create or replace function public.sell_item(p_item_id text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p int; bal int; owned int;
begin
  if uid is null then return -1; end if;
  select price into p from item_prices where item_id = p_item_id;
  if p is null then return -2; end if;
  update inventory set qty = qty - 1 where user_id = uid and item_id = p_item_id and qty > 0
    returning qty into owned;
  if owned is null then return -4; end if; -- 미보유
  update profiles set coins = coins + (p / 2) where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, p / 2, 'sell:' || p_item_id);
  return bal;
end $$;

create or replace function public.earn_activity(p_kind text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; cap int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_kind = 'cafe' then reward := 60; cap := 3;
  elsif p_kind = 'busking' then reward := 30; cap := 10;
  else return -2; end if;
  select count(*) into done from coin_ledger
    where user_id = uid and reason = p_kind and created_at >= date_trunc('day', now());
  if done >= cap then return -3; end if; -- 오늘 상한 도달
  update profiles set coins = coins + reward where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, reward, p_kind);
  return bal;
end $$;
