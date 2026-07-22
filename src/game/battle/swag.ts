/** 레벨 간지 등급 (0=없음 … 5=전설). 순수 — 오라 렌더러(playerAura)가 사용 */
export function swagTier(level: number): number {
  return level >= 50 ? 5 : level >= 35 ? 4 : level >= 20 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
}
