import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0015_four_direction_furniture.sql?raw';

describe('0015 가구 4방향 서버 계약', () => {
  it('0~3 방향만 허용하고 홀짝으로 footprint를 계산한다', () => {
    expect(migration).toContain('p_rot not in (0,1,2,3)');
    expect(migration).toContain('mod(p_rot, 2) = 0');
    expect(migration).toContain('mod(p.rot, 2) = 0');
  });

  it('소유권·수량·레이어 겹침 검증과 진행 새로고침을 그대로 보존한다', () => {
    expect(migration).toContain('owner_id = uid');
    expect(migration).toContain('new_layer');
    expect(migration).toContain('qty = qty - 1');
    expect(migration).toContain('perform public.refresh_verified_progress()');
  });
});
