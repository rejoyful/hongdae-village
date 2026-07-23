import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0021_shared_village_project.sql?raw';

describe('공유 밤정원 서버 권한 계약', () => {
  it('공개 진행은 읽기만 허용하고 모든 쓰기를 보안 함수에 가둔다', () => {
    expect(migration).toContain('create policy "shared_project_public_read"');
    expect(migration).toContain('create policy "shared_project_member_read_own"');
    expect(migration).not.toContain('for insert with check');
    expect(migration).not.toContain('for update using');
    expect(migration).toContain('security definer set search_path = public');
  });

  it('종류를 고정하고 서울 날짜의 사용자별 하루 한 번을 DB가 강제한다', () => {
    expect(migration).toContain("check (kind in ('warmth','green','music','craft','companion','table','water','story'))");
    expect(migration).toContain("unique (user_id, project_id, contribution_day)");
    expect(migration).toContain("(now() at time zone 'Asia/Seoul')::date");
    expect(migration).toContain('on conflict (user_id, project_id, contribution_day) do nothing');
  });

  it('공동 행을 잠근 뒤 기여 원장을 먼저 확정하고 집계를 올린다', () => {
    const lock = migration.indexOf("where project_id = 'night_garden' for update");
    const ledger = migration.indexOf('insert into public.shared_village_contributions');
    const aggregate = migration.indexOf('update public.shared_village_projects');
    expect(lock).toBeGreaterThan(0);
    expect(ledger).toBeGreaterThan(lock);
    expect(aggregate).toBeGreaterThan(ledger);
  });

  it('순위·코인·자유문구·마감 필드를 두지 않는다', () => {
    expect(migration).not.toMatch(/\brank\b/i);
    expect(migration).not.toMatch(/\bcoins?\b/i);
    expect(migration).not.toMatch(/\bmessage\b/i);
    expect(migration).not.toMatch(/\bdeadline\b/i);
    expect(migration).toContain('grant execute on function public.contribute_shared_village_project(text) to authenticated');
  });
});
