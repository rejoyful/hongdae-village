-- 0013: 몬스터 처치 골드 보상 (서버 권위 — earn_activity와 동일 패턴, 일일 상한)
-- 클라는 처치 시 hunt_reward(티어)를 ~2.5s 스로틀로 호출. 티어가 높을수록 보상↑.
-- 일일 상한(코인 원장 count)으로 무한 파밍을 막는다. 미적용 시 클라는 코인 없이 통과.

create or replace function public.hunt_reward(p_tier int) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_tier < 1 or p_tier > 6 then return -2; end if;
  reward := 3 + p_tier * 2;                       -- 티어1=5 … 티어6=15 골드
  select count(*) into done from coin_ledger
    where user_id = uid and reason = 'hunt' and created_at >= kst_day_start();
  if done >= 300 then return -3; end if;          -- 하루 최대 300회 보상
  update profiles set coins = coins + reward where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, reward, 'hunt');
  return bal;
end $$;

revoke all on function public.hunt_reward(int) from public, anon;
grant execute on function public.hunt_reward(int) to authenticated;
