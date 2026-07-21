/**
 * 마을 생활 포인트 (레퍼런스 랭킹 화면) — 기본 pt는 코인, 활동 가산값이 %로 붙는다.
 * 랭킹 목록 자체는 서버(profiles.coins)로 겨루고, 가산 상세는 내 화면 표시용.
 */
export interface PointBreakdown {
  base: number;          // 기본 pt = 보유 코인
  heartPct: number;      // 오늘의 퀘스트 하트 × 5%
  dexPct: number;        // 도감 발견 × 1%
  trustPct: number;      // 주민 신뢰도 합 ÷ 50 (%)
  total: number;
}

export function computePoints(coins: number, hearts: number, dexFound: number, trustSum: number): PointBreakdown {
  const heartPct = hearts * 5;
  const dexPct = dexFound;
  const trustPct = Math.floor(trustSum / 50);
  const mult = 1 + (heartPct + dexPct + trustPct) / 100;
  return {
    base: coins, heartPct, dexPct, trustPct,
    total: Math.round(coins * mult),
  };
}

export interface RankRow { userId: string; nickname: string; coins: number; rank: number }

/** 코인 내림차순 랭킹 부여 — 동점은 같은 순위(다음 순위는 건너뜀) */
export function assignRanks(rows: Array<{ userId: string; nickname: string; coins: number }>): RankRow[] {
  const sorted = [...rows].sort((a, b) => b.coins - a.coins);
  let rank = 0, prevCoins = Number.POSITIVE_INFINITY;
  return sorted.map((r, i) => {
    if (r.coins < prevCoins) { rank = i + 1; prevCoins = r.coins; }
    return { ...r, rank };
  });
}
