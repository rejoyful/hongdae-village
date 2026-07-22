-- 홍대마을: 회사 근무 보상 (출퇴근·야근·기안 결재) — earn_activity 화이트리스트 확장.
-- 0007~0009 하드닝 원칙 유지 + 3종 추가.
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
  elsif p_kind = 'work' then reward := 108; cap := 1;      -- 정시 퇴근 급여 (9h×12)
  elsif p_kind = 'overtime' then reward := 162; cap := 1;  -- 야근 급여 (9h×12 + 3h×18)
  elsif p_kind = 'draft' then reward := 30; cap := 3;      -- 기안 결재
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
