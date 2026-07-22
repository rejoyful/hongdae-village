-- 홍대마을 QA 하드닝 (2026-07-22 전수 검토 결과)
-- P0-1: earn_activity quest 와일드카드 → 화이트리스트 (임의 quest_* 문자열로 무한 코인 차단)
-- P0-2: inventory 직접 쓰기 차단 → 수량 위조 후 sell_item 환급(무한 코인 발행) 차단
--       스타터 지급·가구 배치/회수는 서버 RPC(grant_starter/place_item/pickup_item)로만
-- P2  : 일일 리셋 기준을 UTC → 한국 시간(KST 자정)으로

-- ── 일일 경계 헬퍼: 오늘(KST) 시작 시각 ──
create or replace function public.kst_day_start() returns timestamptz
language sql stable as $$
  select date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
$$;

-- ── P0-1 + P2: 활동 보상 재정의 (퀘스트 화이트리스트 + KST 경계) ──
create or replace function public.earn_activity(p_kind text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; cap int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_kind = 'cafe' then reward := 60; cap := 3;
  elsif p_kind = 'busking' then reward := 30; cap := 10;
  elsif p_kind = 'omok' then reward := 50; cap := 3;
  elsif p_kind in ('quest_cafe','quest_busking','quest_forest','quest_emote','quest_decorate')
    then reward := 40; cap := 1;
  else return -2; end if;
  select count(*) into done from coin_ledger
    where user_id = uid and reason = p_kind and created_at >= kst_day_start();
  if done >= cap then return -3; end if;
  update profiles set coins = coins + reward where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, reward, p_kind);
  return bal;
end $$;

-- ── P2: 출석 보상도 KST 경계 ──
create or replace function public.claim_daily() returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); bal int;
begin
  if uid is null then return -1; end if;
  if exists (select 1 from coin_ledger where user_id = uid and reason = 'daily'
             and created_at >= kst_day_start()) then
    return -1;
  end if;
  update profiles set coins = coins + 100 where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, 100, 'daily');
  return bal;
end $$;

-- ── P0-2: 인벤토리·배치 직접 쓰기 차단 ──
drop policy if exists "inv_insert_own" on public.inventory;
drop policy if exists "inv_update_own" on public.inventory;
drop policy if exists "pl_insert_owner" on public.placements;
drop policy if exists "pl_delete_owner" on public.placements;
revoke insert, update, delete on public.inventory from authenticated;
revoke insert, update, delete on public.placements from authenticated;

-- 시작 가구(웰컴 박스) — 서버가 지급 (items/catalog.ts STARTER_ITEMS와 동기 유지)
create or replace function public.grant_starter() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into inventory (user_id, item_id, qty) values
    (uid,'bed_basic',1),(uid,'desk_wood',1),(uid,'chair_wood',2),(uid,'rug_cream',1),
    (uid,'plant_pot',2),(uid,'lamp_stand',1),(uid,'cushion',2),(uid,'sofa_single',1),
    (uid,'tea_table',1),(uid,'bookshelf',1),(uid,'poster_band',1),(uid,'wall_clock',1),
    (uid,'moving_box',2),(uid,'book_pile',1),(uid,'flower_vase',1),(uid,'bear_doll',1)
  on conflict (user_id, item_id) do nothing;
end $$;

-- 가구 배치 — 방 소유·보유 수량·좌표 경계를 서버가 검증하고 원자 처리
-- 방 12×10, 바닥 1..10 × 1..8 (벽걸이는 클라가 ty=1로 스냅)
create or replace function public.place_item(
  p_room_id int, p_item_id text, p_tx int, p_ty int, p_rot int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); q int; pid uuid; cnt int;
begin
  if uid is null then return null; end if;
  if not exists (select 1 from rooms where id = p_room_id and owner_id = uid) then return null; end if;
  if p_tx < 1 or p_tx > 10 or p_ty < 1 or p_ty > 8 or p_rot not in (0, 1) then return null; end if;
  select count(*) into cnt from placements where room_id = p_room_id;
  if cnt >= 200 then return null; end if; -- 스팸 상한
  update inventory set qty = qty - 1
    where user_id = uid and item_id = p_item_id and qty > 0
    returning qty into q;
  if q is null then return null; end if; -- 미보유
  insert into placements (room_id, item_id, tx, ty, rot)
    values (p_room_id, p_item_id, p_tx, p_ty, p_rot)
    returning id into pid;
  return pid;
end $$;

-- 가구 회수 — 배치 삭제 + 인벤 복귀 원자 처리
create or replace function public.pickup_item(p_placement_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r_item text;
begin
  if uid is null then return false; end if;
  delete from placements p using rooms r
    where p.id = p_placement_id and r.id = p.room_id and r.owner_id = uid
    returning p.item_id into r_item;
  if r_item is null then return false; end if;
  insert into inventory (user_id, item_id, qty) values (uid, r_item, 1)
    on conflict (user_id, item_id) do update set qty = inventory.qty + 1;
  return true;
end $$;
