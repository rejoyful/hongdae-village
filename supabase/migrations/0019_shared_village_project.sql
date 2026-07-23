-- 서버 전체가 함께 키우는 반복형 공용 장소. 경쟁·마감·재화 보상 없이 하루 한 장만 남긴다.
create table if not exists public.shared_village_projects (
  project_id text primary key check (project_id = 'night_garden'),
  total_contributions bigint not null default 0 check (total_contributions >= 0),
  kind_counts jsonb not null default '{"warmth":0,"green":0,"music":0,"craft":0,"companion":0,"table":0,"water":0,"story":0}'::jsonb,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(kind_counts) = 'object')
);

create table if not exists public.shared_village_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.shared_village_projects(project_id) on delete cascade,
  total_contributions int not null default 0 check (total_contributions >= 0),
  kind_ids text[] not null default '{}'::text[],
  chapter_ids int[] not null default '{}'::int[],
  last_day date,
  primary key (user_id, project_id)
);

create table if not exists public.shared_village_contributions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.shared_village_projects(project_id) on delete cascade,
  contribution_day date not null,
  kind text not null check (kind in ('warmth','green','music','craft','companion','table','water','story')),
  chapter int not null check (chapter >= 1),
  created_at timestamptz not null default now(),
  unique (user_id, project_id, contribution_day)
);

insert into public.shared_village_projects(project_id) values ('night_garden')
on conflict (project_id) do nothing;

alter table public.shared_village_projects enable row level security;
alter table public.shared_village_members enable row level security;
alter table public.shared_village_contributions enable row level security;

drop policy if exists "shared_project_public_read" on public.shared_village_projects;
create policy "shared_project_public_read" on public.shared_village_projects for select using (true);
drop policy if exists "shared_project_member_read_own" on public.shared_village_members;
create policy "shared_project_member_read_own" on public.shared_village_members for select using (user_id = auth.uid());
drop policy if exists "shared_project_ledger_read_own" on public.shared_village_contributions;
create policy "shared_project_ledger_read_own" on public.shared_village_contributions for select using (user_id = auth.uid());

create or replace function public.get_shared_village_project()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  project_row public.shared_village_projects%rowtype;
  member_row public.shared_village_members%rowtype;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'auth'); end if;
  select * into project_row from public.shared_village_projects where project_id = 'night_garden';
  select * into member_row from public.shared_village_members where user_id = uid and project_id = 'night_garden';
  return jsonb_build_object(
    'ok', true,
    'global', jsonb_build_object(
      'total', project_row.total_contributions, 'kindCounts', project_row.kind_counts,
      'updatedAt', project_row.updated_at
    ),
    'member', jsonb_build_object(
      'total', coalesce(member_row.total_contributions, 0),
      'kindIds', coalesce(to_jsonb(member_row.kind_ids), '[]'::jsonb),
      'chapterIds', coalesce(to_jsonb(member_row.chapter_ids), '[]'::jsonb),
      'lastDay', member_row.last_day
    )
  );
end $$;

create or replace function public.contribute_shared_village_project(p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Seoul')::date;
  project_row public.shared_village_projects%rowtype;
  member_row public.shared_village_members%rowtype;
  inserted_id bigint;
  contribution_chapter int;
begin
  if uid is null or p_kind not in ('warmth','green','music','craft','companion','table','water','story') then
    return jsonb_build_object('ok', false, 'reason', 'bad');
  end if;

  select * into project_row from public.shared_village_projects
    where project_id = 'night_garden' for update;
  contribution_chapter := (project_row.total_contributions / 120)::int + 1;

  insert into public.shared_village_contributions(user_id, project_id, contribution_day, kind, chapter)
  values (uid, 'night_garden', today, p_kind, contribution_chapter)
  on conflict (user_id, project_id, contribution_day) do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return jsonb_build_object('ok', false, 'reason', 'today', 'state', public.get_shared_village_project());
  end if;

  update public.shared_village_projects set
    total_contributions = total_contributions + 1,
    kind_counts = jsonb_set(
      kind_counts, array[p_kind],
      to_jsonb(coalesce((kind_counts ->> p_kind)::int, 0) + 1), true
    ),
    updated_at = now()
  where project_id = 'night_garden'
  returning * into project_row;

  insert into public.shared_village_members(
    user_id, project_id, total_contributions, kind_ids, chapter_ids, last_day
  ) values (
    uid, 'night_garden', 1, array[p_kind], array[contribution_chapter], today
  )
  on conflict (user_id, project_id) do update set
    total_contributions = public.shared_village_members.total_contributions + 1,
    kind_ids = (select array_agg(distinct value order by value) from unnest(public.shared_village_members.kind_ids || p_kind) value),
    chapter_ids = (select array_agg(distinct value order by value) from unnest(public.shared_village_members.chapter_ids || contribution_chapter) value),
    last_day = today
  returning * into member_row;

  return jsonb_build_object(
    'ok', true,
    'global', jsonb_build_object(
      'total', project_row.total_contributions, 'kindCounts', project_row.kind_counts,
      'updatedAt', project_row.updated_at
    ),
    'member', jsonb_build_object(
      'total', member_row.total_contributions, 'kindIds', to_jsonb(member_row.kind_ids),
      'chapterIds', to_jsonb(member_row.chapter_ids), 'lastDay', member_row.last_day
    )
  );
end $$;

do $$ begin
  alter publication supabase_realtime add table public.shared_village_projects;
exception when duplicate_object then null;
end $$;

revoke all on function public.get_shared_village_project() from public, anon;
revoke all on function public.contribute_shared_village_project(text) from public, anon;
grant execute on function public.get_shared_village_project() to authenticated;
grant execute on function public.contribute_shared_village_project(text) to authenticated;
