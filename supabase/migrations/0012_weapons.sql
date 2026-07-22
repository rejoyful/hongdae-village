-- 0012: 무기 구매 (서버 권위 경제 — 가격 SSOT는 서버, 클라 조작 불가)
-- 미적용 시 클라이언트가 '무료 구매(로컬)'로 우아하게 폴백한다.

create table if not exists owned_weapons (
  user_id    uuid not null references auth.users on delete cascade,
  weapon_id  text not null,
  bought_at  timestamptz not null default now(),
  primary key (user_id, weapon_id)
);

alter table owned_weapons enable row level security;

drop policy if exists "owned_weapons read own" on owned_weapons;
create policy "owned_weapons read own" on owned_weapons
  for select using (auth.uid() = user_id);
-- 직접 write 없음 — 오직 buy_weapon RPC로만

-- 가격은 서버가 결정 (weapons.ts와 동일 유지)
create or replace function buy_weapon(p_weapon_id text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid   uuid := auth.uid();
  bal   int;
  price int;
begin
  if uid is null then return -2; end if;
  price := case p_weapon_id
    when 'woodsword' then 30
    when 'dagger'    then 120
    when 'bronze'    then 350
    when 'steel'     then 800
    when 'knight'    then 1800
    when 'mithril'   then 4000
    when 'dragon'    then 8500
    when 'legend'    then 18000
    else -1 end;
  if price < 0 then return -2; end if;            -- 알 수 없는/무료 무기

  if exists (select 1 from owned_weapons where user_id = uid and weapon_id = p_weapon_id) then
    select coins into bal from profiles where id = uid;
    return bal;                                    -- 이미 보유 → 청구 없음
  end if;

  update profiles set coins = coins - price
    where id = uid and coins >= price
    returning coins into bal;
  if bal is null then return -1; end if;           -- 잔액 부족

  insert into owned_weapons (user_id, weapon_id) values (uid, p_weapon_id);
  return bal;
end;
$$;

revoke all on function buy_weapon(text) from public, anon;
grant execute on function buy_weapon(text) to authenticated;
