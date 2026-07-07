import { describe, it, expect } from 'vitest';
import { screenToTile } from '../src/game/input/pointer';

describe('screenToTile', () => {
  it('줌 1, 스크롤 0이면 화면 좌표 그대로 타일 계산한다', () => {
    expect(screenToTile(33, 65, { scrollX: 0, scrollY: 0, zoom: 1 })).toEqual({ tx: 1, ty: 2 });
  });

  it('카메라 스크롤을 보정한다', () => {
    expect(screenToTile(0, 0, { scrollX: 320, scrollY: 64, zoom: 1 })).toEqual({ tx: 10, ty: 2 });
  });

  it('줌을 보정한다 (줌 2에서 화면 64px = 월드 32px)', () => {
    expect(screenToTile(64, 64, { scrollX: 0, scrollY: 0, zoom: 2 })).toEqual({ tx: 1, ty: 1 });
  });
});
