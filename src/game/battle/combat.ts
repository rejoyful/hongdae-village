/**
 * 전투·성장 순수 로직 (Phaser 비의존, 테스트 가능).
 * 난이도: 경험치 곡선을 가파르게(레벨^1.7) — 너무 쉽지 않게.
 */

/** 다음 레벨까지 필요한 경험치 (가파른 곡선) */
export function xpToNext(level: number): number {
  return Math.round(40 * Math.pow(level, 1.7));
}

/** 레벨별 최대 체력 (초반 생존력 상향 — 금방 죽던 문제) */
export function maxHpForLevel(level: number): number {
  return 55 + (level - 1) * 14;
}

/** 레벨별 기본 공격력 (무기 보너스 별도) */
export function baseAtkForLevel(level: number): number {
  return 4 + Math.floor((level - 1) * 1.5);
}

/** 총 공격력 = 기본 + 무기 (피로 시 절반) */
export function totalAtk(level: number, weaponAtk: number, fatigued = false): number {
  const raw = baseAtkForLevel(level) + weaponAtk;
  return fatigued ? Math.max(1, Math.floor(raw * 0.5)) : raw;
}

export interface Progress { level: number; xp: number } // xp = 현재 레벨 내 누적

/** 경험치 획득 → 레벨업 처리. 반환: 새 진행 + 오른 레벨 수 */
export function gainXp(p: Progress, amount: number): { next: Progress; leveledUp: number } {
  let { level, xp } = p;
  xp += Math.max(0, Math.round(amount));
  let leveledUp = 0;
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    leveledUp += 1;
  }
  return { next: { level, xp }, leveledUp };
}

/** 사망 패널티 — 현재 레벨 필요치의 30%만큼 경험치 감소(레벨 다운은 없음, 0에서 멈춤) */
export function deathPenalty(p: Progress): Progress {
  const loss = Math.round(xpToNext(p.level) * 0.3);
  return { level: p.level, xp: Math.max(0, p.xp - loss) };
}

/** 부활 후 피로 지속 시간(ms) — 굉장히 피로한 상태 */
export const FATIGUE_MS = 15000;
