import { describe, it, expect } from 'vitest';
import {
  normalizeAppearance, appearanceKey, randomAppearance,
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS, PANTS_COLORS, DEFAULT_APPEARANCE,
  TOP_STYLES, BOTTOM_STYLES, SHOE_STYLES, BACK_STYLES, ACCENT_COLORS,
  EYE_STYLES, MOUTH_STYLES, FACE_DETAILS, TOP_PATTERNS, SOCK_STYLES, appearanceCombinationCount,
} from '../src/game/art/appearance';

describe('appearance', () => {
  it('손상된 저장값은 안전한 기본값으로 정규화된다', () => {
    expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance({ skin: 99, hair: -1, hairColor: 'x', shirt: 'zzz', pants: 3.5 }))
      .toEqual({ ...DEFAULT_APPEARANCE, shirt: DEFAULT_APPEARANCE.shirt });
  });

  it('레거시 color를 상의색 폴백으로 쓴다', () => {
    expect(normalizeAppearance(null, 'd88a7c').shirt).toBe('d88a7c');
    expect(normalizeAppearance(null, '###').shirt).toBe(DEFAULT_APPEARANCE.shirt);
  });

  it('정상값은 그대로 통과한다', () => {
    const a = {
      skin: 2, hair: 4, hairColor: 5, shirt: 'a8c8e0', pants: 3, glasses: 3, hat: 6,
      topStyle: 2, bottomStyle: 3, shoeStyle: 4, back: 2, accent: 'e85f6a',
      eyeStyle: 5, mouthStyle: 2, faceDetail: 4, topPattern: 2, sockStyle: 3,
    };
    expect(normalizeAppearance(a)).toEqual(a);
  });

  it('안경·모자는 없어도(레거시) 0으로 채워진다', () => {
    const legacy = normalizeAppearance({ skin: 1, hair: 1, hairColor: 1, shirt: 'a8c8e0', pants: 1 });
    expect(legacy.glasses).toBe(0);
    expect(legacy.hat).toBe(0);
    expect(legacy.topStyle).toBe(0);
    expect(legacy.bottomStyle).toBe(0);
    expect(legacy.shoeStyle).toBe(0);
    expect(legacy.back).toBe(0);
    expect(legacy.accent).toBe(DEFAULT_APPEARANCE.accent);
    expect(legacy.eyeStyle).toBe(0);
    expect(legacy.mouthStyle).toBe(0);
    expect(legacy.faceDetail).toBe(0);
    expect(legacy.topPattern).toBe(0);
    expect(legacy.sockStyle).toBe(0);
  });

  it('appearanceKey는 조합마다 유일하다', () => {
    const k1 = appearanceKey({ skin: 0, hair: 1, hairColor: 2, shirt: 'aabbcc', pants: 3 });
    const k2 = appearanceKey({ skin: 0, hair: 1, hairColor: 2, shirt: 'aabbcc', pants: 4 });
    expect(k1).not.toBe(k2);
  });

  it('randomAppearance는 항상 유효 범위를 지킨다', () => {
    for (let i = 0; i < 50; i++) {
      const a = randomAppearance();
      expect(a.skin).toBeLessThan(SKIN_TONES.length);
      expect(a.hair).toBeLessThan(HAIR_STYLES.length);
      expect(a.hairColor).toBeLessThan(HAIR_COLORS.length);
      expect(a.pants).toBeLessThan(PANTS_COLORS.length);
      expect(a.shirt).toMatch(/^[0-9a-f]{6}$/);
      expect(TOP_STYLES[a.topStyle ?? -1]).toBeDefined();
      expect(BOTTOM_STYLES[a.bottomStyle ?? -1]).toBeDefined();
      expect(SHOE_STYLES[a.shoeStyle ?? -1]).toBeDefined();
      expect(BACK_STYLES[a.back ?? -1]).toBeDefined();
      expect(ACCENT_COLORS).toContain(a.accent);
      expect(EYE_STYLES[a.eyeStyle ?? -1]).toBeDefined();
      expect(MOUTH_STYLES[a.mouthStyle ?? -1]).toBeDefined();
      expect(FACE_DETAILS[a.faceDetail ?? -1]).toBeDefined();
      expect(TOP_PATTERNS[a.topPattern ?? -1]).toBeDefined();
      expect(SOCK_STYLES[a.sockStyle ?? -1]).toBeDefined();
    }
  });

  it('새 스타일 필드를 범위 밖 값과 잘못된 염색값에서 복구한다', () => {
    const a = normalizeAppearance({
      topStyle: 99, bottomStyle: -1, shoeStyle: 1.5, back: 999, accent: '#fff',
      eyeStyle: 99, mouthStyle: -2, faceDetail: 1.5, topPattern: 99, sockStyle: -1,
    });
    expect(a.topStyle).toBe(0);
    expect(a.bottomStyle).toBe(0);
    expect(a.shoeStyle).toBe(0);
    expect(a.back).toBe(0);
    expect(a.accent).toBe(DEFAULT_APPEARANCE.accent);
    expect(a.eyeStyle).toBe(0);
    expect(a.mouthStyle).toBe(0);
    expect(a.faceDetail).toBe(0);
    expect(a.topPattern).toBe(0);
    expect(a.sockStyle).toBe(0);
  });

  it('신규 얼굴·무늬·양말 레이어가 수십조 이상의 독립 코디 조합을 만든다', () => {
    expect(appearanceCombinationCount()).toBeGreaterThan(100_000_000_000_000);
    const base = normalizeAppearance(DEFAULT_APPEARANCE);
    expect(appearanceKey(base)).not.toBe(appearanceKey({ ...base, eyeStyle: 1 }));
    expect(appearanceKey(base)).not.toBe(appearanceKey({ ...base, topPattern: 1 }));
  });
});
