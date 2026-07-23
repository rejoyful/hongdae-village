import { describe, expect, it } from 'vitest';
import {
  clampTile,
  getWorldMetrics,
  projectIsometric,
  unprojectIsometric,
} from '../src/core/isometric';

describe('empty isometric world', () => {
  const metrics = getWorldMetrics(1200, 800);

  it('projects the origin to the visual center', () => {
    expect(projectIsometric({ x: 0, y: 0 }, metrics)).toEqual({
      x: metrics.centerX,
      y: metrics.centerY,
    });
  });

  it('round-trips a tile through screen coordinates', () => {
    const tile = { x: 4, y: -2 };
    expect(unprojectIsometric(projectIsometric(tile, metrics), metrics)).toEqual(tile);
  });

  it('keeps movement inside the empty floor', () => {
    expect(clampTile({ x: 40, y: -40 }, 8)).toEqual({ x: 8, y: -8 });
  });
});
