import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0019_open_homes_guestbook.sql?raw';

describe('열린 집 서버 권한 계약', () => {
  it('기존 집은 기본 비공개이고 공개 변경은 집주인에게만 허용한다', () => {
    expect(migration).toContain('is_public boolean not null default false');
    expect(migration).toContain('where id = p_room_id and owner_id = auth.uid()');
    expect(migration).toContain('grant execute on function public.set_room_public(int,boolean) to authenticated');
  });

  it('방명록은 공개 집·비소유자·허용 스티커·하루 한 장을 서버가 검증한다', () => {
    expect(migration).toContain("p_sticker not in ('cozy','music','green','creator','pet','layout','color','welcome')");
    expect(migration).toContain("if owner is null or not coalesce(opened, false) then return 'closed'");
    expect(migration).toContain("if owner = uid then return 'self'");
    expect(migration).toContain('unique (room_id, from_user_id, visit_day)');
  });

  it('받은 방명록은 집주인만 읽고 소유권 이전 때 기록과 공개 상태를 초기화한다', () => {
    expect(migration).toContain('r.owner_id = auth.uid()');
    expect(migration).toContain('delete from public.home_guestbook where room_id = old.id');
    expect(migration).toContain('new.is_public := false');
  });
});
