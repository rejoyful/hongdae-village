/**
 * 인형뽑기 미니게임 (순수 로직) — 크레인이 좌우로 움직이고, 멈춘 위치가
 * 인형과 가까울수록 성공. 인형은 매판 랜덤 위치.
 */
export interface ClawState {
  cranePos: number;   // 0..1 (레일 위치)
  dir: 1 | -1;        // 이동 방향
  dollPos: number;    // 0..1 (인형 위치)
  speed: number;      // 프레임당 이동량 (0..1)
  result: 'playing' | 'win' | 'miss';
  prize: string | null;
}

export const DOLLS = ['🧸 곰인형', '🐰 토끼인형', '🐻‍❄️ 베어', '🐥 삐약이', '🐙 문어', '🦖 공룡'];

/** 성공 판정 허용 오차 (레일 폭 대비) — 너무 쉽지 않게 */
export const CLAW_TOLERANCE = 0.08;

export function newClaw(rnd: () => number): ClawState {
  return {
    cranePos: 0,
    dir: 1,
    dollPos: 0.15 + rnd() * 0.7,   // 양끝은 피해서 배치
    speed: 0.012 + rnd() * 0.006,
    result: 'playing',
    prize: null,
  };
}

/** 한 프레임 크레인 이동 (벽에서 반사) */
export function tickClaw(s: ClawState): ClawState {
  if (s.result !== 'playing') return s;
  let pos = s.cranePos + s.dir * s.speed;
  let dir = s.dir;
  if (pos >= 1) { pos = 1; dir = -1; }
  else if (pos <= 0) { pos = 0; dir = 1; }
  return { ...s, cranePos: pos, dir };
}

/** 집게 내리기 — 인형과 거리로 성공 판정 */
export function dropClaw(s: ClawState, rnd: () => number): ClawState {
  if (s.result !== 'playing') return s;
  const near = Math.abs(s.cranePos - s.dollPos) <= CLAW_TOLERANCE;
  if (near) {
    return { ...s, result: 'win', prize: DOLLS[Math.floor(rnd() * DOLLS.length)]! };
  }
  return { ...s, result: 'miss', prize: null };
}
