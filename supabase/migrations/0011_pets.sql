-- 0011: 펫 입양 (서버 권위 경제 — 가격 SSOT는 서버, 클라 조작 불가)
-- 실행 후 온라인 유저는 코인으로 펫을 사고 기기 간 보유가 유지된다.
-- 미적용 상태에선 클라이언트가 '무료 입양(코스메틱)'으로 우아하게 폴백한다.

create table if not exists owned_pets (
  user_id    uuid not null references auth.users on delete cascade,
  pet_id     text not null,
  adopted_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

alter table owned_pets enable row level security;

drop policy if exists "owned_pets read own" on owned_pets;
create policy "owned_pets read own" on owned_pets
  for select using (auth.uid() = user_id);
-- 직접 write 없음 — 오직 adopt_pet RPC로만 삽입

-- 클라가 넘긴 가격을 믿지 않는다. pet_id → 가격은 서버가 결정 (pets.ts와 동일 유지).
create or replace function adopt_pet(p_pet_id text)
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
  price := case p_pet_id
    when 'dog'     then 120
    when 'cat'     then 120
    when 'rabbit'  then 150
    when 'chick'   then 90
    when 'hamster' then 90
    when 'fox'     then 200
    when 'penguin' then 220
    when 'panda'   then 260
    else -1 end;
  if price < 0 then return -2; end if;                 -- 알 수 없는 펫

  -- 이미 보유하면 중복 청구 없이 현재 잔액 반환
  if exists (select 1 from owned_pets where user_id = uid and pet_id = p_pet_id) then
    select coins into bal from profiles where id = uid;
    return bal;
  end if;

  update profiles set coins = coins - price
    where id = uid and coins >= price
    returning coins into bal;
  if bal is null then return -1; end if;               -- 잔액 부족

  insert into owned_pets (user_id, pet_id) values (uid, p_pet_id);
  return bal;
end;
$$;

revoke all on function adopt_pet(text) from public, anon;
grant execute on function adopt_pet(text) to authenticated;
