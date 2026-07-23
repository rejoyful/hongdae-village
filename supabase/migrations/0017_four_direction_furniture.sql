-- 0017: 2.5D 실내 꾸미기. 기존 rot 0/1을 보존하며 2/3 방향을 서버 검증에 추가한다.
-- 0·2는 원본 footprint, 1·3은 w/h 교환. 클라이언트는 2/3 자산을 기존 0/1의 좌우 반전으로 렌더한다.

create or replace function public.place_item(
  p_room_id int, p_item_id text, p_tx int, p_ty int, p_rot int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid(); pid uuid; cnt int; q int; house text;
  max_x int; max_y int; iw int; ih int; original_w int; original_h int;
  item_category text; new_layer text;
begin
  if uid is null or p_rot not in (0,1,2,3) then return null; end if;
  if not exists (select 1 from public.rooms where id = p_room_id and owner_id = uid) then return null; end if;

  select m.w, m.h, m.category into original_w, original_h, item_category
    from public.home_item_meta m where m.item_id = p_item_id;
  if not found then return null; end if;
  if item_category = 'wall' or mod(p_rot, 2) = 0 then iw := original_w; ih := original_h;
  else iw := original_h; ih := original_w; end if;
  new_layer := case when item_category = 'rug' then 'rug' when item_category = 'wall' then 'wall' else 'floor' end;

  select pr.house_type into house from public.properties pr where pr.id = p_room_id;
  house := coalesce(house, 'oneroom');
  max_x := case house when 'banjiha' then 5 when 'oneroom' then 6 when 'villa' then 9 when 'apt' then 11 when 'house' then 13 else 6 end;
  max_y := case house when 'banjiha' then 4 when 'oneroom' then 5 when 'villa' then 7 when 'apt' then 9 when 'house' then 10 else 5 end;
  if p_tx < 1 or p_ty < 1 or p_tx + iw - 1 > max_x or p_ty + ih - 1 > max_y then return null; end if;
  if item_category = 'wall' and p_ty <> 1 then return null; end if;

  select count(*) into cnt from public.placements where room_id = p_room_id;
  if cnt >= 200 then return null; end if;
  if exists (
    select 1 from public.placements p
    join public.home_item_meta m on m.item_id = p.item_id
    where p.room_id = p_room_id
      and (case when m.category = 'rug' then 'rug' when m.category = 'wall' then 'wall' else 'floor' end) = new_layer
      and p.tx < p_tx + iw
      and p_tx < p.tx + (case when m.category = 'wall' or mod(p.rot, 2) = 0 then m.w else m.h end)
      and p.ty < p_ty + ih
      and p_ty < p.ty + (case when m.category = 'wall' or mod(p.rot, 2) = 0 then m.h else m.w end)
  ) then return null; end if;

  update public.inventory set qty = qty - 1
    where user_id = uid and item_id = p_item_id and qty > 0 returning qty into q;
  if q is null then return null; end if;
  insert into public.placements (room_id, item_id, tx, ty, rot)
    values (p_room_id, p_item_id, p_tx, p_ty, p_rot) returning id into pid;
  perform public.refresh_verified_progress();
  return pid;
end $$;

comment on column public.placements.rot is
  '시계 방향 4방향: 0 북, 1 동, 2 남, 3 서. 0/1은 이전 클라이언트와 완전 호환.';
