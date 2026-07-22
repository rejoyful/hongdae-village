/** 펫 팔로워 위치 계산 (순수 — Phaser 비의존, 테스트 가능) */

/** 멈췄을 때 플레이어와 겹치지 않게 옆(살짝 아래)에 앉히는 오프셋 */
export const PET_REST = { dx: -15, dy: 8, gap: 16 } as const;

/**
 * 펫이 향할 목표 좌표.
 * lagged = 지연 버퍼의 가장 오래된 좌표(없으면 null). 플레이어와 가까우면(=정지)
 * 옆자리로 밀어 겹침을 막는다.
 */
export function petTarget(
  px: number, py: number, lagged: { x: number; y: number } | null,
): { x: number; y: number } {
  const t = lagged ?? { x: px, y: py };
  if (Math.hypot(t.x - px, t.y - py) < PET_REST.gap) {
    return { x: px + PET_REST.dx, y: py + PET_REST.dy };
  }
  return t;
}
