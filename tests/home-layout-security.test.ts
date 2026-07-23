import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0018_home_layout_library.sql?raw';

describe('홈 장면 보관함 서버 권한 계약', () => {
  it('사용자가 임의 JSON을 저장하지 못하고 현재 서버 배치에서만 스냅샷을 만든다', () => {
    expect(migration).toContain('create policy "home_layout_read_own"');
    expect(migration).not.toContain('for insert with check');
    expect(migration).toContain("from public.placements p where p.room_id = p_room_id");
    expect(migration).toContain('where id = p_room_id and owner_id = uid for update');
  });

  it('인벤토리와 현재 배치를 잠그고 부족 검사를 삭제보다 먼저 수행한다', () => {
    const lock = migration.indexOf('perform 1 from public.inventory where user_id = uid for update');
    const missing = migration.indexOf("return jsonb_build_object('ok', false, 'reason', 'missing'");
    const deletion = migration.indexOf('delete from public.placements where room_id = p_room_id');
    expect(lock).toBeGreaterThan(0);
    expect(missing).toBeGreaterThan(lock);
    expect(deletion).toBeGreaterThan(missing);
  });

  it('적용은 회수·삭제·재배치를 한 보안 함수에서 처리하고 이사 때 슬롯을 제거한다', () => {
    expect(migration).toContain('insert into public.inventory(user_id, item_id, qty)');
    expect(migration).toContain('insert into public.placements(room_id, item_id, tx, ty, rot)');
    expect(migration).toContain('delete from public.home_layout_slots where room_id = old.id');
    expect(migration).toContain('grant execute on function public.apply_home_layout_slot(int,int) to authenticated');
  });
});
