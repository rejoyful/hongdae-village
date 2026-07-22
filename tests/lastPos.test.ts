import { describe, it, expect, beforeEach } from 'vitest';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

describe('lastPos — 새로고침 위치 복원', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('저장·복원 라운드트립 + 유저별 분리', async () => {
    const { saveLastPos, loadLastPos } = await import('../src/game/world/lastPos');
    expect(loadLastPos('u1')).toBeNull();
    saveLastPos('u1', 12, 34);
    expect(loadLastPos('u1')).toEqual({ tx: 12, ty: 34 });
    expect(loadLastPos('u2')).toBeNull(); // 다른 유저는 영향 없음
  });

  it('손상·비정수 값은 null 반환', async () => {
    const { loadLastPos } = await import('../src/game/world/lastPos');
    localStorage.setItem('hv-pos-x', '{bad json');
    expect(loadLastPos('x')).toBeNull();
    localStorage.setItem('hv-pos-y', '{"tx":1.5,"ty":"a"}');
    expect(loadLastPos('y')).toBeNull();
  });
});
