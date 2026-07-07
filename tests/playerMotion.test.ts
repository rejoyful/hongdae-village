import { describe, it, expect } from 'vitest';
import { stepPlayer, type MoveInput } from '../src/game/entities/playerMotion';
import { CollisionGrid } from '../src/game/world/grid';
import { PLAYER_SPEED } from '../src/game/config';

const open = CollisionGrid.fromRects(20, 20, []);           // 빈 맵
const walled = CollisionGrid.fromRects(20, 20, [{ x: 5, y: 0, w: 1, h: 20 }]); // x=5 세로 벽
const BOX = { hw: 8, hh: 8 };
const idle: MoveInput = { up: false, down: false, left: false, right: false };

describe('stepPlayer', () => {
  it('입력이 없으면 제자리에 머문다', () => {
    expect(stepPlayer({ x: 100, y: 100 }, idle, 16, open, BOX)).toEqual({ x: 100, y: 100 });
  });

  it('오른쪽 입력 시 속도×시간만큼 이동한다', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true }, 1000, open, BOX);
    expect(next.x).toBeCloseTo(100 + PLAYER_SPEED);
    expect(next.y).toBe(100);
  });

  it('대각선 이동은 정규화되어 같은 속력이다', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true, down: true }, 1000, open, BOX);
    const dist = Math.hypot(next.x - 100, next.y - 100);
    expect(dist).toBeCloseTo(PLAYER_SPEED, 0);
  });

  it('벽을 통과하지 못한다', () => {
    // 벽(x타일=5 → 월드 160~192) 왼쪽에서 오른쪽으로 1초 이동해도 벽 앞에서 멈춘다
    const next = stepPlayer({ x: 130, y: 100 }, { ...idle, right: true }, 1000, walled, BOX);
    expect(next.x + BOX.hw).toBeLessThanOrEqual(160);
  });

  it('벽에 대각선으로 비비면 남은 축으로 미끄러진다', () => {
    const next = stepPlayer({ x: 150, y: 100 }, { ...idle, right: true, down: true }, 1000, walled, BOX);
    expect(next.x + BOX.hw).toBeLessThanOrEqual(160); // x는 벽에 막힘
    expect(next.y).toBeGreaterThan(100);              // y로는 진행
  });

  it('소수 이동량도 정확히 반영된다 (프레임레이트 독립)', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true }, 16, open, BOX);
    expect(next.x).toBeCloseTo(100 + PLAYER_SPEED * 0.016, 5);
  });
});
