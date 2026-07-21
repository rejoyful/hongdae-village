-- 홍대마을 Phase 3: 방·인벤토리·배치
create table public.rooms (
  id int primary key,
  owner_id uuid unique references auth.users(id) on delete set null,
  claimed_at timestamptz
);
insert into public.rooms (id) select generate_series(1, 10);

alter table public.rooms enable row level security;
create policy "rooms_read_all" on public.rooms for select using (true);
-- 빈 방만 선착순 입주, 자기 방만 갱신
create policy "rooms_claim" on public.rooms for update
  using (owner_id is null or owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table public.inventory (
  user_id uuid references auth.users(id) on delete cascade,
  item_id text not null,
  qty int not null default 0 check (qty >= 0),
  primary key (user_id, item_id)
);
alter table public.inventory enable row level security;
create policy "inv_read_own"   on public.inventory for select using (auth.uid() = user_id);
create policy "inv_insert_own" on public.inventory for insert with check (auth.uid() = user_id);
create policy "inv_update_own" on public.inventory for update using (auth.uid() = user_id);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  room_id int not null references public.rooms(id),
  item_id text not null,
  tx int not null,
  ty int not null,
  rot int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.placements enable row level security;
create policy "pl_read_all" on public.placements for select using (true);
create policy "pl_insert_owner" on public.placements for insert with check (
  exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid())
);
create policy "pl_delete_owner" on public.placements for delete using (
  exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid())
);

-- 방문자 실시간 반영 (postgres_changes)
alter publication supabase_realtime add table public.placements;
