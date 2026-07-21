-- 홍대마을 Phase 4b: 활동 보상 (카페 알바·버스킹) — 일일 상한은 원장으로 검증
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
