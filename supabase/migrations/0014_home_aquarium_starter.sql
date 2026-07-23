-- 물결 테라리움 수직 슬라이스: 모든 기존/신규 입주자에게 어항 1개를 한 번만 지급한다.
-- 로컬 STARTER_ITEMS와 동일한 목록을 유지하며, on conflict do nothing으로 기존 수량은 덮어쓰지 않는다.
create or replace function public.grant_starter() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into inventory (user_id, item_id, qty) values
    (uid,'bed_basic',1),(uid,'desk_wood',1),(uid,'chair_wood',2),(uid,'rug_cream',1),
    (uid,'plant_pot',2),(uid,'lamp_stand',1),(uid,'cushion',2),(uid,'sofa_single',1),
    (uid,'tea_table',1),(uid,'bookshelf',1),(uid,'poster_band',1),(uid,'wall_clock',1),
    (uid,'moving_box',2),(uid,'book_pile',1),(uid,'flower_vase',1),(uid,'bear_doll',1),
    (uid,'fish_tank',1)
  on conflict (user_id, item_id) do nothing;
end $$;
