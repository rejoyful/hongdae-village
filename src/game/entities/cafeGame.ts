/**
 * 카페 「모퉁이」 알바 미니게임 — 주문서대로 재료를 순서대로 탭하는 잔잔한 게임 (스펙 §3).
 * 순수 로직 (UI는 ui/cafePanel.ts). 타이머 없음 — 힐링 톤 유지.
 */
export const INGREDIENTS = ['bean', 'milk', 'syrup', 'ice'] as const;
export type Ingredient = typeof INGREDIENTS[number];

export const INGREDIENT_LABEL: Record<Ingredient, string> = {
  bean: '☕ 원두', milk: '🥛 우유', syrup: '🍯 시럽', ice: '🧊 얼음',
};

export const ORDER_COUNT = 5;

export interface CafeSession {
  orders: Ingredient[][]; // 주문 5개, 각 3~5 재료
  current: number;        // 진행 중 주문 인덱스
  progress: number;       // 현재 주문에서 맞춘 재료 수
}

export type TapEvent = 'progress' | 'wrong' | 'order-done' | 'all-done';

export function newSession(rnd: () => number = Math.random): CafeSession {
  const orders: Ingredient[][] = [];
  for (let i = 0; i < ORDER_COUNT; i++) {
    const len = 3 + Math.floor(rnd() * 3); // 3~5
    const order: Ingredient[] = [];
    for (let j = 0; j < len; j++) order.push(INGREDIENTS[Math.floor(rnd() * INGREDIENTS.length)]!);
    orders.push(order);
  }
  return { orders, current: 0, progress: 0 };
}

/** 재료 탭 처리 — 틀리면 현재 주문만 처음부터 (좌절 없이 가볍게) */
export function tap(s: CafeSession, ing: Ingredient): { session: CafeSession; event: TapEvent } {
  const order = s.orders[s.current];
  if (!order) return { session: s, event: 'all-done' };
  if (order[s.progress] !== ing) {
    return { session: { ...s, progress: 0 }, event: 'wrong' };
  }
  const progress = s.progress + 1;
  if (progress < order.length) {
    return { session: { ...s, progress }, event: 'progress' };
  }
  const current = s.current + 1;
  if (current < s.orders.length) {
    return { session: { ...s, current, progress: 0 }, event: 'order-done' };
  }
  return { session: { ...s, current, progress: 0 }, event: 'all-done' };
}
