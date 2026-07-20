-- 홍대마을 Phase 2: 프로필 (닉네임·캐릭터 색)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 12),
  color text not null default 'e8c9a0', -- 캐릭터 placeholder 색 (hex, # 제외)
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
