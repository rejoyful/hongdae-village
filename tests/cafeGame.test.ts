import { describe, it, expect } from 'vitest';
import { newSession, tap, INGREDIENTS, ORDER_COUNT } from '../src/game/entities/cafeGame';
import { seeded } from '../src/game/art/pixelCanvas';

describe('cafeGame', () => {
  it('주문 5개, 각 3~5 재료로 생성된다', () => {
    const s = newSession(seeded(1));
    expect(s.orders).toHaveLength(ORDER_COUNT);
    for (const o of s.orders) {
      expect(o.length).toBeGreaterThanOrEqual(3);
      expect(o.length).toBeLessThanOrEqual(5);
      for (const ing of o) expect(INGREDIENTS).toContain(ing);
    }
  });

  it('올바른 탭은 진행, 주문 완료·전체 완료 이벤트를 낸다', () => {
    let s = newSession(seeded(2));
    let done = 0;
    // 정답만 계속 탭하면 전부 완료된다
    for (let guard = 0; guard < 100; guard++) {
      const order = s.orders[s.current];
      if (!order) break;
      const r = tap(s, order[s.progress]!);
      s = r.session;
      if (r.event === 'order-done') done++;
      if (r.event === 'all-done') { done++; break; }
    }
    expect(done).toBe(ORDER_COUNT);
    expect(s.current).toBe(ORDER_COUNT);
  });

  it('틀린 탭은 현재 주문만 처음부터', () => {
    let s = newSession(seeded(3));
    const first = s.orders[0]!;
    s = tap(s, first[0]!).session; // 1개 진행
    const wrongIng = INGREDIENTS.find((i) => i !== first[1])!;
    const r = tap(s, wrongIng);
    expect(r.event).toBe('wrong');
    expect(r.session.progress).toBe(0);
    expect(r.session.current).toBe(0); // 주문 자체는 유지
  });
});
