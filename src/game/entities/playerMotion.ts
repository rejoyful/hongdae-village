import { PLAYER_SPEED } from '../config';
import type { CollisionGrid, Vec2 } from '../world/grid';

export interface MoveInput { up: boolean; down: boolean; left: boolean; right: boolean }
export interface Aabb { hw: number; hh: number } // 중심 기준 half-extents(px)

function boxCollides(x: number, y: number, box: Aabb, grid: CollisionGrid): boolean {
  const tl = grid.isSolidAtWorld(x - box.hw, y - box.hh);
  const tr = grid.isSolidAtWorld(x + box.hw - 1, y - box.hh);
  const bl = grid.isSolidAtWorld(x - box.hw, y + box.hh - 1);
  const br = grid.isSolidAtWorld(x + box.hw - 1, y + box.hh - 1);
  return tl || tr || bl || br;
}

/**
 * 프레임당 이동. 축 분리 처리로 벽에 막힌 축만 취소되고 나머지 축은 진행(슬라이드).
 * 1px 단위 스윕으로 터널링을 방지하고, 잔여 소수분은 마지막에 적용해 속도를 보존한다.
 */
export function stepPlayer(pos: Vec2, input: MoveInput, dtMs: number, grid: CollisionGrid, box: Aabb): Vec2 {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx === 0 && dy === 0) return { ...pos };

  const len = Math.hypot(dx, dy);
  const dist = (PLAYER_SPEED * dtMs) / 1000;
  dx = (dx / len) * dist;
  dy = (dy / len) * dist;

  const next = { ...pos };
  next.x = moveAxis(next.x, next.y, dx, 'x', box, grid);
  next.y = moveAxis(next.x, next.y, dy, 'y', box, grid);
  return next;
}

function moveAxis(x: number, y: number, delta: number, axis: 'x' | 'y', box: Aabb, grid: CollisionGrid): number {
  const cur = axis === 'x' ? x : y;
  if (delta === 0) return cur;
  const collides = (v: number) =>
    axis === 'x' ? boxCollides(v, y, box, grid) : boxCollides(x, v, box, grid);
  // 1px 스윕: 큰 dt(탭 백그라운드 복귀 등)에도 벽을 통과하지 않는다
  const step = Math.sign(delta);
  const total = Math.abs(delta);
  let v = cur;
  let moved = 0;
  while (total - moved >= 1) {
    if (collides(v + step)) return v;
    v += step;
    moved += 1;
  }
  // 잔여 소수분 적용 — 정수 스텝만 쓰면 프레임레이트에 따라 속도가 왜곡된다
  const rem = total - moved;
  if (rem > 0 && !collides(v + step * rem)) v += step * rem;
  return v;
}
