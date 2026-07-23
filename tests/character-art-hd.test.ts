import { describe, expect, it } from 'vitest';
import {
  BACK_STYLES,
  BOTTOM_STYLES,
  DEFAULT_APPEARANCE,
  EYE_STYLES,
  FACE_DETAILS,
  GLASSES_STYLES,
  HAIR_STYLES,
  HAT_STYLES,
  MOUTH_STYLES,
  SHOE_STYLES,
  SOCK_STYLES,
  TOP_PATTERNS,
  TOP_STYLES,
  type Appearance,
} from '../src/game/art/appearance';
import {
  drawCharacterHd,
  HD_CHAR_H,
  HD_CHAR_ORIGIN_Y,
  HD_CHAR_W,
} from '../src/game/art/characterArtHd';
import type { Px } from '../src/game/art/pixelCanvas';

interface RectCall {
  x: number;
  y: number;
  width: number;
  height: number;
}

function render(appearance: Appearance, direction = 0, step = 0): RectCall[] {
  const calls: RectCall[] = [];
  const painter: Px = {
    ctx: {} as CanvasRenderingContext2D,
    p: (x, y) => calls.push({ x, y, width: 1, height: 1 }),
    rect: (x, y, width, height) => calls.push({ x, y, width, height }),
    speckle: () => undefined,
  };
  drawCharacterHd(painter, 0, direction as 0 | 1 | 2 | 3, step, appearance);
  return calls;
}

function expectInsideFrame(calls: RectCall[]): void {
  expect(calls.length).toBeGreaterThan(30);
  for (const call of calls) {
    expect(Number.isInteger(call.x)).toBe(true);
    expect(Number.isInteger(call.y)).toBe(true);
    expect(call.width).toBeGreaterThan(0);
    expect(call.height).toBeGreaterThan(0);
    expect(call.x).toBeGreaterThanOrEqual(0);
    expect(call.y).toBeGreaterThanOrEqual(0);
    expect(call.x + call.width).toBeLessThanOrEqual(HD_CHAR_W);
    expect(call.y + call.height).toBeLessThanOrEqual(HD_CHAR_H);
  }
}

describe('32×48 HD character art', () => {
  it('월드 공통 프레임과 발 기준점을 고정한다', () => {
    expect(HD_CHAR_W).toBe(32);
    expect(HD_CHAR_H).toBe(48);
    expect(HD_CHAR_ORIGIN_Y).toBe(0.78);
    expect(46 - HD_CHAR_ORIGIN_Y * HD_CHAR_H).toBeGreaterThan(8);
    expect(46 - HD_CHAR_ORIGIN_Y * HD_CHAR_H).toBeLessThan(9);
  });

  it('4방향 × 4걸음의 기본 코디가 프레임 밖으로 잘리지 않는다', () => {
    for (let direction = 0; direction < 4; direction++) {
      for (let step = 0; step < 4; step++) {
        expectInsideFrame(render(DEFAULT_APPEARANCE, direction, step));
      }
    }
  });

  it('모든 실루엣 레이어가 32×48 프레임 안에서 렌더링된다', () => {
    const variants: Appearance[] = [];
    const addVariants = (field: keyof Appearance, length: number) => {
      for (let index = 0; index < length; index++) {
        variants.push({ ...DEFAULT_APPEARANCE, [field]: index });
      }
    };
    addVariants('hair', HAIR_STYLES.length);
    addVariants('glasses', GLASSES_STYLES.length);
    addVariants('hat', HAT_STYLES.length);
    addVariants('topStyle', TOP_STYLES.length);
    addVariants('bottomStyle', BOTTOM_STYLES.length);
    addVariants('shoeStyle', SHOE_STYLES.length);
    addVariants('back', BACK_STYLES.length);
    addVariants('eyeStyle', EYE_STYLES.length);
    addVariants('mouthStyle', MOUTH_STYLES.length);
    addVariants('faceDetail', FACE_DETAILS.length);
    addVariants('topPattern', TOP_PATTERNS.length);
    addVariants('sockStyle', SOCK_STYLES.length);

    for (const appearance of variants) {
      for (let direction = 0; direction < 4; direction++) {
        for (let step = 0; step < 4; step++) {
          expectInsideFrame(render(appearance, direction, step));
        }
      }
    }
  });

  it('완전 코디는 기본형보다 더 많은 픽셀 디테일을 가진다', () => {
    const complete: Appearance = {
      ...DEFAULT_APPEARANCE,
      hair: 4,
      glasses: 4,
      hat: 6,
      topStyle: 7,
      bottomStyle: 4,
      shoeStyle: 4,
      back: 3,
      eyeStyle: 5,
      mouthStyle: 4,
      faceDetail: 5,
      topPattern: 5,
      sockStyle: 4,
    };
    expect(render(complete).length).toBeGreaterThan(render(DEFAULT_APPEARANCE).length + 20);
  });
});
