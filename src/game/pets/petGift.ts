/** 펫 선물 로직 (순수 — 테스트 가능). 데리고 다니면 가끔 조각을 물어다 준다 */

/** 선물 간격(ms) — 친밀도가 높을수록 자주 (30s → 최소 18s) */
export function giftIntervalMs(affinity: number): number {
  return Math.max(18000, 30000 - affinity * 120);
}

/** 이번 선물의 조각 수 — 성장 단계가 높을수록 후하게 (1 ~ stage+1) */
export function giftShards(stage: number, rnd: () => number = Math.random): number {
  return 1 + Math.floor(rnd() * (stage + 1));
}

/** 가끔 조각 대신 특별 선물(간식·조개 등) — 순수 연출 선택 */
export const GIFT_EMOJIS = ['💠', '💠', '💠', '🐚', '🌰', '🍬'] as const;
export function giftEmoji(rnd: () => number = Math.random): string {
  return GIFT_EMOJIS[Math.floor(rnd() * GIFT_EMOJIS.length)]!;
}
