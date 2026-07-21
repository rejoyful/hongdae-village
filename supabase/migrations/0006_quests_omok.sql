-- 홍대마을 Phase 6a: 보상 종류 확장 (오목·일일 퀘스트) — earn_activity 재정의
create or replace function public.earn_activity(p_kind text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; cap int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_kind = 'cafe' then reward := 60; cap := 3;
  elsif p_kind = 'busking' then reward := 30; cap := 10;
  elsif p_kind = 'omok' then reward := 50; cap := 3;
  elsif p_kind like 'quest\_%' escape '\' then reward := 40; cap := 1;
  else return -2; end if;
  select count(*) into done from coin_ledger
    where user_id = uid and reason = p_kind and created_at >= date_trunc('day', now());
  if done >= cap then return -3; end if;
  update profiles set coins = coins + reward where id = uid returning coins into bal;
  insert into coin_ledger (user_id, amount, reason) values (uid, reward, p_kind);
  return bal;
end $$;
