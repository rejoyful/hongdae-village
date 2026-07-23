-- 0018: 살림 쇼룸 4주 큐레이션 + 서버 권위 DIY 제작
-- 클라이언트 furnitureWorkshop.ts와 품목·슬롯·레시피·공임을 동일하게 유지한다.

create table if not exists public.home_item_acquisition (
  item_id text primary key references public.home_item_meta(item_id) on delete cascade,
  channel text not null check (channel in ('weekly','diy')),
  rotation_slot int check (rotation_slot between 0 and 3),
  check ((channel = 'weekly' and rotation_slot is not null) or (channel = 'diy' and rotation_slot is null))
);
alter table public.home_item_acquisition enable row level security;
drop policy if exists "home_item_acquisition read all" on public.home_item_acquisition;
create policy "home_item_acquisition read all" on public.home_item_acquisition for select using (true);
revoke insert, update, delete on public.home_item_acquisition from authenticated;

insert into public.home_item_acquisition (item_id, channel, rotation_slot) values
  ('bed_blue','weekly',0),('turntable','weekly',0),('cactus','weekly',0),('poster_film','weekly',0),
  ('desk_white','weekly',1),('speaker_amp','weekly',1),('stuckyi','weekly',1),('guitar','weekly',1),
  ('chair_cushion','weekly',2),('fridge','weekly',2),('rug_check','weekly',2),('mic_stand','weekly',2),
  ('sofa_coral','weekly',3),('washer','weekly',3),('lamp_mood','weekly',3),('easel','weekly',3),
  ('bed_green','diy',null),('dining_table','diy',null),('bookshelf_wide','diy',null),
  ('wardrobe','diy',null),('dresser','diy',null),('pc_setup','diy',null),
  ('mini_garden','diy',null),('window_plant','diy',null),('rug_round','diy',null),
  ('cat_tower','diy',null),('neon_sign','diy',null),('photo_frames','diy',null)
on conflict (item_id) do update set channel = excluded.channel, rotation_slot = excluded.rotation_slot;

create table if not exists public.furniture_diy_recipes (
  recipe_id text primary key,
  output_item_id text not null unique references public.home_item_meta(item_id),
  fee int not null check (fee between 0 and 10000)
);
create table if not exists public.furniture_diy_ingredients (
  recipe_id text not null references public.furniture_diy_recipes(recipe_id) on delete cascade,
  item_id text not null references public.home_item_meta(item_id),
  qty int not null check (qty between 1 and 99),
  primary key (recipe_id, item_id)
);
alter table public.furniture_diy_recipes enable row level security;
alter table public.furniture_diy_ingredients enable row level security;
drop policy if exists "furniture_diy_recipes read all" on public.furniture_diy_recipes;
drop policy if exists "furniture_diy_ingredients read all" on public.furniture_diy_ingredients;
create policy "furniture_diy_recipes read all" on public.furniture_diy_recipes for select using (true);
create policy "furniture_diy_ingredients read all" on public.furniture_diy_ingredients for select using (true);
revoke insert, update, delete on public.furniture_diy_recipes from authenticated;
revoke insert, update, delete on public.furniture_diy_ingredients from authenticated;

insert into public.furniture_diy_recipes (recipe_id, output_item_id, fee) values
  ('soft_green_bed','bed_green',80),('table_for_two','dining_table',70),
  ('wide_story_shelf','bookshelf_wide',75),('quiet_wardrobe','wardrobe',90),
  ('morning_dresser','dresser',70),('alley_pc_desk','pc_setup',120),
  ('tabletop_greenhouse','mini_garden',60),('window_green_line','window_plant',60),
  ('round_rest_rug','rug_round',70),('cat_stair_tower','cat_tower',75),
  ('band_neon_memory','neon_sign',85),('slow_photo_wall','photo_frames',55)
on conflict (recipe_id) do update set output_item_id = excluded.output_item_id, fee = excluded.fee;

insert into public.furniture_diy_ingredients (recipe_id, item_id, qty) values
  ('soft_green_bed','bed_basic',1),('soft_green_bed','cushion',2),
  ('table_for_two','table_low',1),('table_for_two','chair_wood',2),
  ('wide_story_shelf','bookshelf',2),('wide_story_shelf','book_pile',1),
  ('quiet_wardrobe','drawer',1),('quiet_wardrobe','hanger_rack',1),
  ('morning_dresser','desk_wood',1),('morning_dresser','mirror_full',1),
  ('alley_pc_desk','laptop_desk',1),('alley_pc_desk','tv_stand',1),
  ('tabletop_greenhouse','plant_pot',2),('tabletop_greenhouse','flower_vase',1),
  ('window_green_line','plant_pot',1),('window_green_line','wall_shelf',1),
  ('round_rest_rug','rug_long',1),('round_rest_rug','cushion',2),
  ('cat_stair_tower','bookshelf',1),('cat_stair_tower','cushion',2),
  ('band_neon_memory','lamp_stand',1),('band_neon_memory','poster_band',1),
  ('slow_photo_wall','wall_clock',1),('slow_photo_wall','book_pile',1)
on conflict (recipe_id, item_id) do update set qty = excluded.qty;

create table if not exists public.furniture_craft_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null references public.furniture_diy_recipes(recipe_id),
  crafted_at timestamptz not null default now()
);
create index if not exists furniture_craft_history_user_idx on public.furniture_craft_history(user_id, crafted_at desc);
alter table public.furniture_craft_history enable row level security;
drop policy if exists "furniture_craft_history read own" on public.furniture_craft_history;
create policy "furniture_craft_history read own" on public.furniture_craft_history for select using (auth.uid() = user_id);
revoke insert, update, delete on public.furniture_craft_history from authenticated;

-- 일반 구매는 DIY 전용 품목과 이번 주가 아닌 큐레이션 품목을 서버에서도 거부한다.
create or replace function public.buy_item(p_item_id text) returns int
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); p int; bal int; acquisition text; item_slot int;
  current_slot int := mod(((now() at time zone 'Asia/Seoul')::date - date '2026-01-05') / 7, 4);
begin
  if uid is null then return -1; end if;
  select price into p from public.item_prices where item_id = p_item_id;
  if p is null then return -2; end if;
  select channel, rotation_slot into acquisition, item_slot
    from public.home_item_acquisition where item_id = p_item_id;
  if acquisition = 'diy' then return -5; end if;
  if acquisition = 'weekly' and item_slot <> current_slot then return -6; end if;
  update public.profiles set coins = coins - p where id = uid and coins >= p returning coins into bal;
  if bal is null then return -3; end if;
  insert into public.coin_ledger (user_id, amount, reason) values (uid, -p, 'buy:' || p_item_id);
  insert into public.inventory (user_id, item_id, qty) values (uid, p_item_id, 1)
    on conflict (user_id, item_id) do update set qty = inventory.qty + 1;
  return bal;
end $$;

-- 재료 확인·차감, 공임 결제, 결과 지급, 이력 기록을 한 트랜잭션으로 완료한다.
create or replace function public.craft_furniture(p_recipe_id text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); recipe public.furniture_diy_recipes%rowtype; bal int;
begin
  if uid is null then return -1; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':furniture-craft', 0));
  select * into recipe from public.furniture_diy_recipes where recipe_id = p_recipe_id;
  if not found then return -2; end if;
  if exists (
    select 1 from public.furniture_diy_ingredients ingredient
    left join public.inventory owned on owned.user_id = uid and owned.item_id = ingredient.item_id
    where ingredient.recipe_id = p_recipe_id and coalesce(owned.qty, 0) < ingredient.qty
  ) then return -4; end if;
  update public.profiles set coins = coins - recipe.fee
    where id = uid and coins >= recipe.fee returning coins into bal;
  if bal is null then return -3; end if;
  update public.inventory owned set qty = owned.qty - ingredient.qty
    from public.furniture_diy_ingredients ingredient
    where owned.user_id = uid and ingredient.recipe_id = p_recipe_id and owned.item_id = ingredient.item_id;
  insert into public.inventory (user_id, item_id, qty) values (uid, recipe.output_item_id, 1)
    on conflict (user_id, item_id) do update set qty = inventory.qty + 1;
  insert into public.coin_ledger (user_id, amount, reason) values (uid, -recipe.fee, 'craft:' || p_recipe_id);
  insert into public.furniture_craft_history (user_id, recipe_id) values (uid, p_recipe_id);
  perform public.refresh_verified_progress();
  return bal;
end $$;

revoke all on function public.craft_furniture(text) from public, anon;
grant execute on function public.craft_furniture(text) to authenticated;
