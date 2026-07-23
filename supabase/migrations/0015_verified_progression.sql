-- 0015: 생활 콘텐츠 서버 권위화
-- - 펫 친밀도·먹이·놀이·트릭을 서버가 소유권/일일 제한과 함께 원자 처리
-- - 가구 배치를 카탈로그 크기·회전·레이어·주택별 실제 경계로 검증
-- - DB에서 증명 가능한 집/펫 진행과 배지를 서버 기록으로 발급

-- ── 서버 가구 메타 SSOT (items/catalog.json과 동기) ──
create table if not exists public.home_item_meta (
  item_id text primary key,
  category text not null check (category in ('furniture','electronics','plant','deco','rug','wall')),
  arch text not null,
  w int not null check (w between 1 and 8),
  h int not null check (h between 1 and 8)
);

insert into public.home_item_meta (item_id, category, arch, w, h) values
  ('bed_basic','furniture','bed',2,3),
  ('bed_blue','furniture','bed',2,3),
  ('bed_green','furniture','bed',3,3),
  ('desk_wood','furniture','table',2,1),
  ('desk_white','furniture','table',2,1),
  ('table_low','furniture','table',2,1),
  ('tea_table','furniture','table',1,1),
  ('dining_table','furniture','table',2,2),
  ('side_table','furniture','table',1,1),
  ('chair_wood','furniture','seat',1,1),
  ('chair_cushion','furniture','seat',1,1),
  ('stool','furniture','seat',1,1),
  ('sofa_coral','furniture','sofa',2,1),
  ('sofa_gray','furniture','sofa',3,1),
  ('sofa_single','furniture','sofa',1,1),
  ('bookshelf','furniture','shelf',1,2),
  ('bookshelf_wide','furniture','shelf',2,2),
  ('drawer','furniture','wardrobe',1,2),
  ('wardrobe','furniture','wardrobe',2,3),
  ('dresser','furniture','mirror',2,1),
  ('hanger_rack','furniture','hanger',2,1),
  ('shoe_rack','furniture','shelf',1,2),
  ('kitchen_counter','furniture','counter',2,1),
  ('sink_unit','furniture','counter',2,1),
  ('dry_rack','furniture','hanger',2,1),
  ('mirror_full','furniture','mirror',1,1),
  ('tv_stand','electronics','screen',3,1),
  ('pc_setup','electronics','screen',2,1),
  ('laptop_desk','electronics','screen',1,1),
  ('turntable','electronics','appliance',1,1),
  ('speaker_amp','electronics','appliance',1,2),
  ('fridge','electronics','wardrobe',1,2),
  ('washer','electronics','appliance',1,1),
  ('fan_stand','electronics','lamp',1,1),
  ('coffee_maker','electronics','appliance',1,1),
  ('lamp_stand','electronics','lamp',1,1),
  ('lamp_mood','electronics','lamp',1,1),
  ('plant_pot','plant','plant',1,1),
  ('cactus','plant','plant',1,1),
  ('stuckyi','plant','plant',1,1),
  ('flower_vase','plant','vase',1,1),
  ('mini_garden','plant','garden',2,1),
  ('window_plant','plant','garden',2,1),
  ('rug_cream','rug','rug',3,2),
  ('rug_check','rug','rug',3,2),
  ('rug_round','rug','rug',2,2),
  ('rug_long','rug','rug',4,1),
  ('fish_tank','deco','tank',1,1),
  ('guitar','deco','instrument',1,1),
  ('mic_stand','deco','instrument',1,1),
  ('easel','deco','instrument',1,1),
  ('book_pile','deco','deco',1,1),
  ('candle_set','deco','deco',1,1),
  ('bear_doll','deco','doll',1,1),
  ('cat_tower','deco','cattower',1,2),
  ('skateboard','deco','deco',1,1),
  ('lp_crate','deco','deco',1,1),
  ('cushion','deco','seat',1,1),
  ('moving_box','deco','deco',1,1),
  ('poster_band','wall','wall',1,1),
  ('poster_film','wall','wall',1,1),
  ('neon_sign','wall','wallneon',2,1),
  ('wall_clock','wall','wallclock',1,1),
  ('wall_shelf','wall','wallshelf',2,1),
  ('photo_frames','wall','wall',2,1)
on conflict (item_id) do update set
  category = excluded.category, arch = excluded.arch, w = excluded.w, h = excluded.h;

alter table public.home_item_meta enable row level security;
drop policy if exists "home_item_meta read all" on public.home_item_meta;
create policy "home_item_meta read all" on public.home_item_meta for select using (true);
revoke insert, update, delete on public.home_item_meta from authenticated;

-- ── 펫 장기 성장 ──
alter table public.owned_pets add column if not exists affinity int not null default 10;
alter table public.owned_pets add column if not exists feeds int not null default 0;
alter table public.owned_pets add column if not exists plays int not null default 0;
alter table public.owned_pets add column if not exists trainings int not null default 0;
alter table public.owned_pets add column if not exists learned_tricks text[] not null default '{}'::text[];
alter table public.owned_pets add column if not exists last_fed_day date;
alter table public.owned_pets add column if not exists last_played_day date;
alter table public.owned_pets add column if not exists last_trained_day date;
alter table public.owned_pets add column if not exists petted_day date;
alter table public.owned_pets add column if not exists pets_today int not null default 0;

do $$ begin
  alter table public.owned_pets add constraint owned_pets_affinity_range check (affinity between 0 and 100);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.owned_pets add constraint owned_pets_counters_nonnegative
    check (feeds >= 0 and plays >= 0 and trainings >= 0 and pets_today >= 0);
exception when duplicate_object then null; end $$;

revoke insert, update, delete on public.owned_pets from authenticated;

-- 서버가 검증해 발급한 배지. 클라이언트 직접 쓰기 금지.
create table if not exists public.verified_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.verified_badges enable row level security;
drop policy if exists "verified_badges read own" on public.verified_badges;
create policy "verified_badges read own" on public.verified_badges
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.verified_badges from authenticated;

-- DB 보유 정보로 집·펫 진행을 다시 계산하고 검증 배지를 멱등 발급한다.
create or replace function public.refresh_verified_progress() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  pet_count int := 0; max_affinity int := 0; total_feeds int := 0; total_plays int := 0;
  max_tricks int := 0; max_memories int := 0;
  placed_count int := 0; unique_items int := 0; category_count int := 0; layer_count int := 0;
  nature_count int := 0; hobby_count int := 0; theme_power int := 0; home_score int := 0;
  essential_score int := 0; pet_corner int := 0;
  badge_list jsonb := '[]'::jsonb;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;

  select count(*), coalesce(max(affinity),0), coalesce(sum(feeds),0), coalesce(sum(plays),0),
    coalesce(max(cardinality(learned_tricks)),0),
    coalesce(max(1 + (plays >= 3)::int + (cardinality(learned_tricks) >= 3)::int + (affinity >= 100)::int),0)
  into pet_count, max_affinity, total_feeds, total_plays, max_tricks, max_memories
  from public.owned_pets where user_id = uid;

  select count(*) into placed_count
  from public.placements p join public.rooms r on r.id = p.room_id
  where r.owner_id = uid;

  with u as (
    select distinct p.item_id, m.category, m.arch
    from public.placements p
    join public.rooms r on r.id = p.room_id and r.owner_id = uid
    join public.home_item_meta m on m.item_id = p.item_id
  )
  select count(*), count(distinct category),
    count(distinct case when category = 'rug' then 'rug' when category = 'wall' then 'wall' else 'floor' end),
    count(*) filter (where arch in ('plant','vase','garden','tank')),
    count(*) filter (where arch in ('instrument','screen','tank','doll','cattower')),
    (case when bool_or(arch = 'bed') then 7 else 0 end)
      + (case when bool_or(arch in ('seat','sofa')) then 6 else 0 end)
      + (case when bool_or(arch in ('table','counter')) then 5 else 0 end)
      + (case when bool_or(arch in ('shelf','wardrobe','hanger')) then 4 else 0 end)
      + (case when bool_or(arch = 'lamp') then 4 else 0 end),
    (case when bool_or(arch = 'cattower') then 4 else 0 end),
    greatest(
      count(*) filter (where item_id in ('bed_basic','bed_green','sofa_coral','sofa_gray','sofa_single','rug_cream','rug_round','candle_set','cushion') or arch in ('bed','sofa','rug','lamp')),
      count(*) filter (where item_id in ('turntable','speaker_amp','guitar','mic_stand','lp_crate','poster_band','neon_sign') or arch = 'instrument'),
      count(*) filter (where item_id in ('plant_pot','cactus','stuckyi','flower_vase','mini_garden','window_plant','fish_tank') or arch in ('plant','vase','garden','tank')),
      count(*) filter (where item_id in ('desk_wood','desk_white','pc_setup','laptop_desk','bookshelf','bookshelf_wide','easel','book_pile','photo_frames') or arch in ('screen','shelf')),
      count(*) filter (where item_id in ('cat_tower','cushion','bear_doll','fish_tank','rug_round','sofa_single') or arch in ('cattower','doll'))
    )
  into unique_items, category_count, layer_count, nature_count, hobby_count,
    essential_score, pet_corner, theme_power
  from u;

  home_score := least(100, greatest(0, round(
    essential_score
    + least(21::numeric, category_count * 3.5)
    + least(21::numeric, unique_items * 1.5)
    + least(9, layer_count * 3)
    + least(9, nature_count * 3)
    + least(6, hobby_count * 3)
    + pet_corner
    + least(4, theme_power)
  )::int));

  insert into public.verified_badges (user_id, badge_id)
  select uid, badge_id from (values
    ('badge_intro_pet', pet_count >= 1),
    ('badge_intro_feed', total_feeds >= 1),
    ('badge_collect_pet_3', pet_count >= 3),
    ('badge_collect_pet_6', pet_count >= 6),
    ('badge_master_pet_affinity', max_affinity >= 100),
    ('badge_story_pet_play', total_plays >= 3),
    ('badge_story_pet_trick', max_tricks >= 1),
    ('badge_collect_pet_tricks_5', max_tricks >= 5),
    ('badge_master_pet_memories', max_memories >= 4),
    ('badge_intro_decorate', placed_count >= 1),
    ('badge_story_cozy_home', placed_count >= 10),
    ('badge_master_decorate_50', placed_count >= 50),
    ('badge_story_home_balance', category_count >= 5),
    ('badge_story_home_signature', theme_power >= 4),
    ('badge_collect_home_unique_20', unique_items >= 20),
    ('badge_master_home_score_90', home_score >= 90)
  ) as candidates(badge_id, earned)
  where earned
  on conflict (user_id, badge_id) do nothing;

  select coalesce(jsonb_agg(badge_id order by badge_id), '[]'::jsonb) into badge_list
  from public.verified_badges where user_id = uid;

  return jsonb_build_object(
    'ok', true,
    'metrics', jsonb_build_object(
      'pet_adopt', pet_count, 'pets_owned', pet_count, 'pet_feed', total_feeds,
      'pet_play', total_plays, 'max_pet_affinity', max_affinity,
      'pet_tricks', max_tricks, 'pet_memories', max_memories,
      'q_place', placed_count, 'home_unique_items', unique_items,
      'home_categories', category_count, 'home_theme_power', theme_power,
      'home_score', home_score
    ),
    'badges', badge_list
  );
end $$;

-- 펫 돌봄: 행 잠금으로 동시 요청도 하루 제한을 우회하지 못한다.
create or replace function public.pet_care(p_pet_id text, p_action text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); today date := (now() at time zone 'Asia/Seoul')::date;
  pet public.owned_pets%rowtype; next_trick text; need_affinity int; today_pets int;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into pet from public.owned_pets
    where user_id = uid and pet_id = p_pet_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not-owned'); end if;

  if p_action = 'feed' then
    if pet.last_fed_day = today then return jsonb_build_object('ok', false, 'reason', 'daily'); end if;
    update public.owned_pets set affinity = least(100, affinity + 10), feeds = feeds + 1,
      last_fed_day = today where user_id = uid and pet_id = p_pet_id;
  elsif p_action = 'play' then
    if pet.last_played_day = today then return jsonb_build_object('ok', false, 'reason', 'daily'); end if;
    update public.owned_pets set affinity = least(100, affinity + 6), plays = plays + 1,
      last_played_day = today where user_id = uid and pet_id = p_pet_id;
  elsif p_action = 'pet' then
    today_pets := case when pet.petted_day = today then pet.pets_today else 0 end;
    if today_pets >= 5 then return jsonb_build_object('ok', false, 'reason', 'daily-cap'); end if;
    update public.owned_pets set affinity = least(100, affinity + 2), petted_day = today,
      pets_today = today_pets + 1 where user_id = uid and pet_id = p_pet_id;
  elsif p_action = 'train' then
    if pet.last_trained_day = today then return jsonb_build_object('ok', false, 'reason', 'daily'); end if;
    if not ('hello' = any(pet.learned_tricks)) then next_trick := 'hello'; need_affinity := 10;
    elsif not ('paw' = any(pet.learned_tricks)) then next_trick := 'paw'; need_affinity := 25;
    elsif not ('spin' = any(pet.learned_tricks)) then next_trick := 'spin'; need_affinity := 50;
    elsif not ('dance' = any(pet.learned_tricks)) then next_trick := 'dance'; need_affinity := 80;
    elsif not ('pose' = any(pet.learned_tricks)) then next_trick := 'pose'; need_affinity := 100;
    else return jsonb_build_object('ok', false, 'reason', 'done'); end if;
    if pet.affinity < need_affinity then
      return jsonb_build_object('ok', false, 'reason', 'affinity', 'required', need_affinity, 'next_trick', next_trick);
    end if;
    update public.owned_pets set affinity = least(100, affinity + 5), trainings = trainings + 1,
      learned_tricks = learned_tricks || next_trick, last_trained_day = today
      where user_id = uid and pet_id = p_pet_id;
  else
    return jsonb_build_object('ok', false, 'reason', 'action');
  end if;

  select * into pet from public.owned_pets where user_id = uid and pet_id = p_pet_id;
  perform public.refresh_verified_progress();
  return jsonb_build_object(
    'ok', true, 'action', p_action, 'affinity', pet.affinity,
    'feeds', pet.feeds, 'plays', pet.plays, 'trainings', pet.trainings,
    'tricks', to_jsonb(pet.learned_tricks), 'trick', next_trick
  );
end $$;

-- 히든 펫도 서버 통계로 조건을 검증한 뒤 무료 입양한다.
create or replace function public.claim_rare_pet(p_pet_id text) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); allowed boolean := false;
begin
  if uid is null then return false; end if;
  if p_pet_id = 'goldcat' then
    select exists(select 1 from public.owned_pets where user_id = uid and affinity >= 100) into allowed;
  elsif p_pet_id = 'rainbowdog' then
    select count(*) >= 5 into allowed from public.owned_pets
      where user_id = uid and pet_id in ('dog','cat','rabbit','chick','hamster','fox','penguin','panda');
  elsif p_pet_id = 'starbunny' then
    select coalesce(sum(feeds),0) >= 20 into allowed from public.owned_pets where user_id = uid;
  else return false; end if;
  if not allowed then return false; end if;
  insert into public.owned_pets (user_id, pet_id) values (uid, p_pet_id)
    on conflict (user_id, pet_id) do nothing;
  perform public.refresh_verified_progress();
  return true;
end $$;

-- 주택별 실제 크기 + 아이템 실제 footprint + 같은 레이어 겹침을 검증한다.
create or replace function public.place_item(
  p_room_id int, p_item_id text, p_tx int, p_ty int, p_rot int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); pid uuid; cnt int; q int; house text;
  max_x int; max_y int; iw int; ih int; original_w int; original_h int;
  item_category text; new_layer text;
begin
  if uid is null or p_rot not in (0,1) then return null; end if;
  if not exists (select 1 from public.rooms where id = p_room_id and owner_id = uid) then return null; end if;

  select m.w, m.h, m.category into original_w, original_h, item_category
    from public.home_item_meta m where m.item_id = p_item_id;
  if not found then return null; end if;
  if item_category = 'wall' or p_rot = 0 then iw := original_w; ih := original_h;
  else iw := original_h; ih := original_w; end if;
  new_layer := case when item_category = 'rug' then 'rug' when item_category = 'wall' then 'wall' else 'floor' end;

  select pr.house_type into house from public.properties pr where pr.id = p_room_id;
  house := coalesce(house, 'oneroom');
  max_x := case house when 'banjiha' then 5 when 'oneroom' then 6 when 'villa' then 9 when 'apt' then 11 when 'house' then 13 else 6 end;
  max_y := case house when 'banjiha' then 4 when 'oneroom' then 5 when 'villa' then 7 when 'apt' then 9 when 'house' then 10 else 5 end;
  if p_tx < 1 or p_ty < 1 or p_tx + iw - 1 > max_x or p_ty + ih - 1 > max_y then return null; end if;
  if item_category = 'wall' and p_ty <> 1 then return null; end if;

  select count(*) into cnt from public.placements where room_id = p_room_id;
  if cnt >= 200 then return null; end if;
  if exists (
    select 1 from public.placements p
    join public.home_item_meta m on m.item_id = p.item_id
    where p.room_id = p_room_id
      and (case when m.category = 'rug' then 'rug' when m.category = 'wall' then 'wall' else 'floor' end) = new_layer
      and p.tx < p_tx + iw
      and p_tx < p.tx + (case when m.category = 'wall' or p.rot = 0 then m.w else m.h end)
      and p.ty < p_ty + ih
      and p_ty < p.ty + (case when m.category = 'wall' or p.rot = 0 then m.h else m.w end)
  ) then return null; end if;

  update public.inventory set qty = qty - 1
    where user_id = uid and item_id = p_item_id and qty > 0 returning qty into q;
  if q is null then return null; end if;
  insert into public.placements (room_id, item_id, tx, ty, rot)
    values (p_room_id, p_item_id, p_tx, p_ty, p_rot) returning id into pid;
  perform public.refresh_verified_progress();
  return pid;
end $$;

-- ── 일일 퀘스트 증명 ──
-- 숲 체류·이모트처럼 별도 DB 행이 없던 행동은 서버 시간 간격과 상한을 기록한다.
create table if not exists public.daily_world_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  progress_key text not null check (progress_key in ('q_forest','q_emote')),
  value int not null default 0 check (value >= 0),
  last_at timestamptz not null default now(),
  primary key (user_id, day, progress_key)
);
alter table public.daily_world_progress enable row level security;
drop policy if exists "daily_world_progress read own" on public.daily_world_progress;
create policy "daily_world_progress read own" on public.daily_world_progress
  for select using (auth.uid() = user_id);
revoke insert, update, delete on public.daily_world_progress from authenticated;

create or replace function public.record_daily_progress(p_key text) returns int
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); today date := (now() at time zone 'Asia/Seoul')::date;
  cap int; cooldown interval; current_value int; previous_at timestamptz;
begin
  if uid is null then return -1; end if;
  if p_key = 'q_forest' then cap := 30; cooldown := interval '900 milliseconds';
  elsif p_key = 'q_emote' then cap := 3; cooldown := interval '200 milliseconds';
  else return -2; end if;

  select value, last_at into current_value, previous_at
    from public.daily_world_progress
    where user_id = uid and day = today and progress_key = p_key for update;
  if not found then
    insert into public.daily_world_progress (user_id, day, progress_key, value, last_at)
      values (uid, today, p_key, 1, now());
    return 1;
  end if;
  if current_value >= cap then return cap; end if;
  if previous_at > now() - cooldown then return current_value; end if;
  update public.daily_world_progress set value = least(cap, value + 1), last_at = now()
    where user_id = uid and day = today and progress_key = p_key returning value into current_value;
  return current_value;
end $$;

-- 일반 활동 보상에는 퀘스트 문자열을 더 이상 허용하지 않는다.
create or replace function public.earn_activity(p_kind text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; cap int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_kind = 'cafe' then reward := 60; cap := 3;
  elsif p_kind = 'busking' then reward := 30; cap := 10;
  elsif p_kind = 'omok' then reward := 50; cap := 3;
  elsif p_kind = 'claw' then reward := 25; cap := 5;
  elsif p_kind = 'photo' then reward := 15; cap := 3;
  elsif p_kind = 'bungeo' then reward := 10; cap := 5;
  elsif p_kind = 'work' then reward := 108; cap := 1;
  elsif p_kind = 'overtime' then reward := 162; cap := 1;
  elsif p_kind = 'draft' then reward := 30; cap := 3;
  else return -2; end if;
  select count(*) into done from public.coin_ledger
    where user_id = uid and reason = p_kind and created_at >= public.kst_day_start();
  if done >= cap then return -3; end if;
  update public.profiles set coins = coins + reward where id = uid returning coins into bal;
  insert into public.coin_ledger (user_id, amount, reason) values (uid, reward, p_kind);
  return bal;
end $$;

-- 일일 보상은 실제 서버 기록을 확인하고, advisory lock으로 중복 동시 청구를 막는다.
create or replace function public.claim_daily_quest(p_quest_id text) returns int
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); start_at timestamptz := public.kst_day_start();
  today date := (now() at time zone 'Asia/Seoul')::date; eligible boolean := false; bal int;
begin
  if uid is null then return -1; end if;
  if p_quest_id not in ('quest_cafe','quest_busking','quest_forest','quest_emote','quest_decorate') then return -2; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text || ':' || p_quest_id, 0));
  if exists (select 1 from public.coin_ledger where user_id = uid and reason = p_quest_id and created_at >= start_at) then
    return -3;
  end if;

  if p_quest_id = 'quest_cafe' then
    select exists(select 1 from public.coin_ledger where user_id = uid and reason = 'cafe' and created_at >= start_at) into eligible;
  elsif p_quest_id = 'quest_busking' then
    select exists(select 1 from public.coin_ledger where user_id = uid and reason = 'busking' and created_at >= start_at) into eligible;
  elsif p_quest_id = 'quest_forest' then
    select coalesce(max(value),0) >= 30 into eligible from public.daily_world_progress
      where user_id = uid and day = today and progress_key = 'q_forest';
  elsif p_quest_id = 'quest_emote' then
    select coalesce(max(value),0) >= 3 into eligible from public.daily_world_progress
      where user_id = uid and day = today and progress_key = 'q_emote';
  elsif p_quest_id = 'quest_decorate' then
    select count(*) >= 2 into eligible from public.placements p
      join public.rooms r on r.id = p.room_id
      where r.owner_id = uid and p.created_at >= start_at;
  end if;
  if not eligible then return -4; end if;

  update public.profiles set coins = coins + 40 where id = uid returning coins into bal;
  insert into public.coin_ledger (user_id, amount, reason) values (uid, 40, p_quest_id);
  return bal;
end $$;

revoke all on function public.refresh_verified_progress() from public, anon;
revoke all on function public.pet_care(text,text) from public, anon;
revoke all on function public.claim_rare_pet(text) from public, anon;
revoke all on function public.place_item(int,text,int,int,int) from public, anon;
revoke all on function public.record_daily_progress(text) from public, anon;
revoke all on function public.claim_daily_quest(text) from public, anon;
grant execute on function public.refresh_verified_progress() to authenticated;
grant execute on function public.pet_care(text,text) to authenticated;
grant execute on function public.claim_rare_pet(text) to authenticated;
grant execute on function public.place_item(int,text,int,int,int) to authenticated;
grant execute on function public.record_daily_progress(text) to authenticated;
grant execute on function public.claim_daily_quest(text) to authenticated;
