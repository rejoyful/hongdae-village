-- 0020: 여섯 칸 홈 장면 보관함.
-- 스냅샷은 현재 서버 배치에서만 생성하고, 적용은 인벤토리 합계 검증 뒤 한 트랜잭션으로 교체한다.
create table if not exists public.home_layout_slots (
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id int not null references public.rooms(id) on delete cascade,
  slot smallint not null check (slot between 1 and 6),
  label_id text not null check (label_id in ('daily','guest','studio','season','pet','collector')),
  placements jsonb not null default '[]'::jsonb,
  save_count int not null default 1 check (save_count >= 1),
  apply_count int not null default 0 check (apply_count >= 0),
  saved_at timestamptz not null default now(),
  primary key (user_id, room_id, slot),
  check (jsonb_typeof(placements) = 'array' and jsonb_array_length(placements) <= 200)
);

alter table public.home_layout_slots enable row level security;
drop policy if exists "home_layout_read_own" on public.home_layout_slots;
create policy "home_layout_read_own" on public.home_layout_slots for select using (
  user_id = auth.uid() and exists (
    select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid()
  )
);

create or replace function public.save_home_layout_slot(
  p_room_id int, p_slot int, p_label_id text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  snapshot jsonb;
  saved_row public.home_layout_slots%rowtype;
begin
  if uid is null or p_slot not between 1 and 6
    or p_label_id not in ('daily','guest','studio','season','pet','collector') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  perform 1 from public.rooms where id = p_room_id and owner_id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'owner'); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'itemId', p.item_id, 'tx', p.tx, 'ty', p.ty, 'rot', p.rot
  ) order by p.created_at, p.id), '[]'::jsonb)
  into snapshot from public.placements p where p.room_id = p_room_id;

  insert into public.home_layout_slots(user_id, room_id, slot, label_id, placements)
  values (uid, p_room_id, p_slot, p_label_id, snapshot)
  on conflict (user_id, room_id, slot) do update set
    label_id = excluded.label_id,
    placements = excluded.placements,
    save_count = public.home_layout_slots.save_count + 1,
    saved_at = now()
  returning * into saved_row;

  return jsonb_build_object(
    'ok', true, 'slot', saved_row.slot, 'labelId', saved_row.label_id,
    'placements', saved_row.placements, 'savedAt', saved_row.saved_at,
    'saveCount', saved_row.save_count, 'applyCount', saved_row.apply_count
  );
end $$;

create or replace function public.apply_home_layout_slot(
  p_room_id int, p_slot int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  saved_row public.home_layout_slots%rowtype;
  item_row record;
  placement_row record;
  available_count int;
  updated_qty int;
  new_id uuid;
  applied jsonb := '[]'::jsonb;
  missing jsonb := '[]'::jsonb;
begin
  if uid is null or p_slot not between 1 and 6 then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;
  perform 1 from public.rooms where id = p_room_id and owner_id = uid for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'owner'); end if;
  select * into saved_row from public.home_layout_slots
    where user_id = uid and room_id = p_room_id and slot = p_slot for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if jsonb_array_length(saved_row.placements) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;

  -- 인벤토리와 현재 방에 놓인 수량을 합쳐 대상 장면을 완성할 수 있는지 먼저 검사한다.
  perform 1 from public.inventory where user_id = uid for update;
  perform 1 from public.placements where room_id = p_room_id for update;
  for item_row in
    select x."itemId" as item_id, count(*)::int as needed
    from jsonb_to_recordset(saved_row.placements) as x("itemId" text, tx int, ty int, rot int)
    group by x."itemId"
  loop
    select coalesce((select qty from public.inventory where user_id = uid and item_id = item_row.item_id), 0)
      + (select count(*)::int from public.placements where room_id = p_room_id and item_id = item_row.item_id)
      into available_count;
    if item_row.item_id is null or not exists (select 1 from public.home_item_meta where item_id = item_row.item_id)
      or available_count < item_row.needed then
      missing := missing || jsonb_build_array(item_row.item_id);
    end if;
  end loop;
  if jsonb_array_length(missing) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing', 'missingItemIds', missing);
  end if;

  -- 여기부터는 한 트랜잭션이다. 현재 장면을 모두 인벤토리로 돌린 뒤 저장 장면을 다시 꺼낸다.
  insert into public.inventory(user_id, item_id, qty)
    select uid, item_id, count(*)::int from public.placements where room_id = p_room_id group by item_id
  on conflict (user_id, item_id) do update set qty = public.inventory.qty + excluded.qty;
  delete from public.placements where room_id = p_room_id;

  for placement_row in
    select x."itemId" as item_id, x.tx, x.ty, x.rot, x.ordinality
    from jsonb_to_recordset(saved_row.placements) with ordinality as x("itemId" text, tx int, ty int, rot int, ordinality bigint)
    order by x.ordinality
  loop
    if placement_row.tx is null or placement_row.ty is null or placement_row.rot not in (0,1,2,3) then
      raise exception 'invalid saved home layout placement';
    end if;
    update public.inventory set qty = qty - 1
      where user_id = uid and item_id = placement_row.item_id and qty > 0
      returning qty into updated_qty;
    if updated_qty is null then raise exception 'home layout inventory changed during apply'; end if;
    insert into public.placements(room_id, item_id, tx, ty, rot)
      values (p_room_id, placement_row.item_id, placement_row.tx, placement_row.ty, placement_row.rot)
      returning id into new_id;
    applied := applied || jsonb_build_array(jsonb_build_object(
      'id', new_id, 'itemId', placement_row.item_id,
      'tx', placement_row.tx, 'ty', placement_row.ty, 'rot', placement_row.rot
    ));
    updated_qty := null;
  end loop;

  update public.home_layout_slots set apply_count = apply_count + 1
    where user_id = uid and room_id = p_room_id and slot = p_slot
    returning apply_count into saved_row.apply_count;
  perform public.refresh_verified_progress();
  return jsonb_build_object(
    'ok', true, 'slot', saved_row.slot, 'labelId', saved_row.label_id,
    'placements', applied, 'savedAt', saved_row.saved_at,
    'saveCount', saved_row.save_count, 'applyCount', saved_row.apply_count
  );
end $$;

-- 이사·매매 때 이전 집 장면이 새 소유자에게 남지 않게 한다.
create or replace function public.clear_home_layouts_on_owner_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.owner_id is distinct from new.owner_id then
    delete from public.home_layout_slots where room_id = old.id;
  end if;
  return new;
end $$;

drop trigger if exists rooms_clear_home_layouts on public.rooms;
create trigger rooms_clear_home_layouts before update of owner_id on public.rooms
for each row execute function public.clear_home_layouts_on_owner_change();

revoke all on function public.save_home_layout_slot(int,int,text) from public, anon;
revoke all on function public.apply_home_layout_slot(int,int) from public, anon;
grant execute on function public.save_home_layout_slot(int,int,text) to authenticated;
grant execute on function public.apply_home_layout_slot(int,int) to authenticated;
