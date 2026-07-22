-- 홍대마을: 새 활동 보상 (인형뽑기·네컷·붕어빵) — earn_activity 화이트리스트 확장.
-- 0007 하드닝(퀘스트 화이트리스트 + KST 경계)을 그대로 유지하고 3종만 추가한다.
create or replace function public.earn_activity(p_kind text) returns int
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); reward int; cap int; done int; bal int;
begin
  if uid is null then return -1; end if;
  if p_kind = 'cafe' then reward := 60; cap := 3;
  elsif p_kind = 'busking' then reward := 30; cap := 10;
  elsif p_kind = 'omok' then reward := 50; cap := 3;
  elsif p_kind = 'claw' then reward := 25; cap := 5;       -- 인형뽑기 성공
  elsif p_kind = 'photo' then reward := 15; cap := 3;      -- 네컷 포토부스
  elsif p_kind = 'bungeo' then reward := 10; cap := 5;     -- 붕어빵 간식
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
