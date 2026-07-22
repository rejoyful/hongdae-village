-- 홍대마을 부동산 시스템: 5종 주택 × 전세·월세·매매.
-- rooms 테이블을 소유권 앵커로 유지(placements FK 보존)하고, properties가 매물 메타·계약 상태를 담는다.
-- 모든 돈 이동은 security definer RPC로만 (0007 하드닝과 동일 원칙).

-- 시세표 (클라이언트 HOUSE_SPECS와 동기 유지)
create table if not exists public.house_specs (
  house_type text primary key,
  jeonse_deposit int not null,
  wolse_deposit int not null,
  monthly_rent int not null,
  price int not null
);
insert into public.house_specs (house_type, jeonse_deposit, wolse_deposit, monthly_rent, price) values
  ('banjiha', 300,  80,   4,  500),
  ('oneroom', 600,  150,  7,  1000),
  ('villa',   1400, 300,  14, 2400),
  ('apt',     3200, 700,  26, 6000),
  ('house',   5000, 1000, 40, 10000)
on conflict (house_type) do update set
  jeonse_deposit = excluded.jeonse_deposit, wolse_deposit = excluded.wolse_deposit,
  monthly_rent = excluded.monthly_rent, price = excluded.price;

create table if not exists public.properties (
  id int primary key references public.rooms(id),
  house_type text not null references public.house_specs(house_type),
  deal_type text,                    -- jeonse/wolse/maemae, null이면 공실
  deposit_escrow int not null default 0,  -- 예치 보증금(환급 대상)
  lease_start timestamptz,
  last_charge timestamptz,
  rent_due int not null default 0,   -- 미납 월세(연체)
  floor_seed int not null default 1
);
alter table public.properties enable row level security;
drop policy if exists "prop_read_all" on public.properties;
create policy "prop_read_all" on public.properties for select using (true);
-- 직접 쓰기 금지 (RPC로만)
revoke insert, update, delete on public.properties from authenticated;

-- 매물 시딩 (지도 개인공간 문 1~10과 1:1 매칭). 기존 소유 방은 매매 보유로 승계.
insert into public.properties (id, house_type, floor_seed) values
  (1,'banjiha',101),(2,'oneroom',102),(3,'banjiha',103),(4,'oneroom',104),(5,'villa',105),
  (6,'villa',106),(7,'apt',107),(8,'oneroom',108),(9,'villa',109),(10,'house',110)
on conflict (id) do nothing;

-- 기존에 무료로 점유된 방(owner_id 있음)은 매매 보유로 승계
update public.properties p set deal_type = 'maemae', lease_start = now(), last_charge = now()
  from public.rooms r where r.id = p.id and r.owner_id is not null and p.deal_type is null;

-- 계약: 전세/월세/매매. 공실만, 잔액 검증, 예치·차감 원자 처리
create or replace function public.lease_property(p_id int, p_deal text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); spec house_specs%rowtype; cost int; escrow int; bal int; occ uuid;
begin
  if uid is null then return -1; end if;
  if p_deal not in ('jeonse','wolse','maemae') then return -5; end if;
  select r.owner_id into occ from rooms r where r.id = p_id;
  if not found then return -2; end if;
  if occ is not null then return -3; end if; -- 이미 계약됨
  select hs.* into spec from house_specs hs join properties pr on pr.house_type = hs.house_type where pr.id = p_id;
  if not found then return -2; end if;
  if p_deal = 'jeonse' then cost := spec.jeonse_deposit; escrow := spec.jeonse_deposit;
  elsif p_deal = 'wolse' then cost := spec.wolse_deposit; escrow := spec.wolse_deposit;
  else cost := spec.price; escrow := 0; end if;
  update profiles set coins = coins - cost where id = uid and coins >= cost returning coins into bal;
  if bal is null then return -4; end if; -- 잔액 부족
  update rooms set owner_id = uid, claimed_at = now() where id = p_id and owner_id is null;
  if not found then return -3; end if;
  update properties set deal_type = p_deal, deposit_escrow = escrow,
    lease_start = now(), last_charge = now(), rent_due = 0 where id = p_id;
  insert into coin_ledger (user_id, amount, reason) values (uid, -cost, 'lease:' || p_deal || ':' || p_id);
  return bal;
end $$;

-- 월세 청구 — 서울 자정 경과 일수만큼 누적, 가능한 만큼 자동 납부. 반환: 미납액(연체)
create or replace function public.charge_rent(p_id int) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr properties%rowtype; spec house_specs%rowtype;
  periods int; add_due int; pay int; bal int;
begin
  if uid is null then return -1; end if;
  select p.* into pr from properties p join rooms r on r.id = p.id
    where p.id = p_id and r.owner_id = uid;
  if not found or pr.deal_type <> 'wolse' then return 0; end if;
  select * into spec from house_specs where house_type = pr.house_type;
  periods := greatest(0, (date_part('day', (date_trunc('day', now() at time zone 'Asia/Seoul')
    - date_trunc('day', pr.last_charge at time zone 'Asia/Seoul'))))::int);
  if periods > 0 then
    add_due := periods * spec.monthly_rent;
    -- 가능한 만큼 즉시 납부
    select coins into bal from profiles where id = uid;
    pay := least(pr.rent_due + add_due, bal);
    if pay > 0 then
      update profiles set coins = coins - pay where id = uid;
      insert into coin_ledger (user_id, amount, reason) values (uid, -pay, 'rent:' || p_id);
    end if;
    update properties set rent_due = (rent_due + add_due - pay),
      last_charge = date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul'
      where id = p_id;
    return pr.rent_due + add_due - pay;
  end if;
  return pr.rent_due;
end $$;

-- 미납 월세 수동 납부
create or replace function public.pay_rent(p_id int) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); due int; pay int; bal int;
begin
  if uid is null then return -1; end if;
  select rent_due into due from properties p join rooms r on r.id = p.id
    where p.id = p_id and r.owner_id = uid;
  if not found then return -2; end if;
  if due <= 0 then select coins into bal from profiles where id = uid; return bal; end if;
  select coins into bal from profiles where id = uid;
  pay := least(due, bal);
  if pay <= 0 then return -4; end if;
  update profiles set coins = coins - pay where id = uid returning coins into bal;
  update properties set rent_due = rent_due - pay where id = p_id;
  insert into coin_ledger (user_id, amount, reason) values (uid, -pay, 'rent:' || p_id);
  return bal;
end $$;

-- 퇴실(전세·월세) — 보증금 - 미납월세 환급, 소유 해제, 배치물 정리
create or replace function public.move_out(p_id int) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr properties%rowtype; refund int; bal int;
begin
  if uid is null then return -1; end if;
  select p.* into pr from properties p join rooms r on r.id = p.id
    where p.id = p_id and r.owner_id = uid;
  if not found then return -2; end if;
  if pr.deal_type = 'maemae' then return -5; end if; -- 매매는 매도로
  refund := greatest(0, pr.deposit_escrow - pr.rent_due);
  update profiles set coins = coins + refund where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, refund, 'moveout:' || p_id);
  delete from placements where room_id = p_id;
  update properties set deal_type = null, deposit_escrow = 0, lease_start = null,
    last_charge = null, rent_due = 0 where id = p_id;
  update rooms set owner_id = null, claimed_at = null where id = p_id;
  return bal;
end $$;

-- 매도(매매) — 시세 90% 환급, 소유 해제
create or replace function public.sell_property(p_id int) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr properties%rowtype; spec house_specs%rowtype; refund int; bal int;
begin
  if uid is null then return -1; end if;
  select p.* into pr from properties p join rooms r on r.id = p.id
    where p.id = p_id and r.owner_id = uid;
  if not found then return -2; end if;
  if pr.deal_type <> 'maemae' then return -5; end if;
  select * into spec from house_specs where house_type = pr.house_type;
  refund := (spec.price * 9) / 10;
  update profiles set coins = coins + refund where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, refund, 'sell:' || p_id);
  delete from placements where room_id = p_id;
  update properties set deal_type = null where id = p_id;
  update rooms set owner_id = null, claimed_at = null where id = p_id;
  return bal;
end $$;
