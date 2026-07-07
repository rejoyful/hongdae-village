import { describe, it, expect } from 'vitest';
import { screenToTile } from '../src/game/input/pointer';

describe('screenToTile', () => {
  it('줌 1, 스크롤 0이면 화면 좌표 그대로 타일 계산한다', () => {
    expect(screenToTile(33, 65, { scrollX: 0, scrollY: 0, zoom: 1, width: 640, height: 480 })).toEqual({ tx: 1, ty: 2 });
  });

  it('카메라 스크롤을 보정한다', () => {
    expect(screenToTile(0, 0, { scrollX: 320, scrollY: 64, zoom: 1, width: 640, height: 480 })).toEqual({ tx: 10, ty: 2 });
  });

  it('줌은 뷰포트 중심 기준으로 보정한다 (Phaser 카메라 시맨틱)', () => {
    // zoom 2, 640×480: world = screen/2 + (뷰포트/2)(1-1/2) → x: 32+160=192(tx 6), y: 32+120=152(ty 4)
    expect(screenToTile(64, 64, { scrollX: 0, scrollY: 0, zoom: 2, width: 640, height: 480 })).toEqual({ tx: 6, ty: 4 });
  });

  it('줌 1에서는 중심 보정 항이 사라진다 (뷰포트 크기 무관)', () => {
    expect(screenToTile(64, 64, { scrollX: 0, scrollY: 0, zoom: 1, width: 999, height: 777 })).toEqual({ tx: 2, ty: 2 });
  });
});
