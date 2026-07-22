import { describe, it, expect } from 'vitest';
import {
  normalizeAppearance, appearanceKey, randomAppearance,
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS, PANTS_COLORS, DEFAULT_APPEARANCE,
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
    const a = { skin: 2, hair: 4, hairColor: 5, shirt: 'a8c8e0', pants: 3, glasses: 3, hat: 6 };
    expect(normalizeAppearance(a)).toEqual(a);
  });

  it('안경·모자는 없어도(레거시) 0으로 채워진다', () => {
    const legacy = normalizeAppearance({ skin: 1, hair: 1, hairColor: 1, shirt: 'a8c8e0', pants: 1 });
    expect(legacy.glasses).toBe(0);
    expect(legacy.hat).toBe(0);
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
    }
  });
});
