/**
 * 캐릭터 외형 (스펙 §3 커스터마이징 — 베이스+레이어 조합).
 * 피부 4 × 헤어스타일 6 × 헤어색 6 × 상의 12 × 하의 6 = 10,368 조합.
 * profiles.appearance(jsonb)에 저장, presence 메타로 전파.
 */
export interface Appearance {
  skin: number;      // SKIN_TONES 인덱스
  hair: number;      // HAIR_STYLES 인덱스
  hairColor: number; // HAIR_COLORS 인덱스
  shirt: string;     // hex 6자리 (# 제외)
  pants: number;     // PANTS_COLORS 인덱스
}

export const SKIN_TONES = [0xf0cfae, 0xe2b98f, 0xc99a6e, 0xa5744c] as const;
export const HAIR_STYLES = ['숏컷', '단발', '장발', '포니테일', '곱슬', '캡모자'] as const;
export const HAIR_COLORS = [0x4a3828, 0x2e2620, 0x6e4a30, 0x8a6a4a, 0xb8b0a8, 0xa85c48] as const;
export const SHIRT_COLORS = [
  'e8c9a0', 'd88a7c', '8ab8a8', 'd8b86e', 'a8c8e0', 'c8a8d8',
  '9cc79c', 'e0a8b8', 'f2ead8', '6a7a8a', 'b0685a', '4a4e5c',
] as const;
export const PANTS_COLORS = [0x4a4e5c, 0x6e5c4c, 0x3a3f52, 0x8a8a92, 0x556052, 0x7d5f46] as const;

export const DEFAULT_APPEARANCE: Appearance = { skin: 0, hair: 0, hairColor: 0, shirt: 'e8c9a0', pants: 0 };

const HEX = /^[0-9a-f]{6}$/;

/** 저장된 값(jsonb)을 안전한 Appearance로 정규화 — 손상돼도 캐릭터는 뜬다 */
export function normalizeAppearance(raw: unknown, fallbackShirt?: string): Appearance {
  const o = (raw ?? {}) as Partial<Appearance>;
  const idx = (v: unknown, len: number, def: number) =>
    Number.isInteger(v) && (v as number) >= 0 && (v as number) < len ? (v as number) : def;
  const shirt = typeof o.shirt === 'string' && HEX.test(o.shirt)
    ? o.shirt
    : (fallbackShirt && HEX.test(fallbackShirt) ? fallbackShirt : DEFAULT_APPEARANCE.shirt);
  return {
    skin: idx(o.skin, SKIN_TONES.length, 0),
    hair: idx(o.hair, HAIR_STYLES.length, 0),
    hairColor: idx(o.hairColor, HAIR_COLORS.length, 0),
    shirt,
    pants: idx(o.pants, PANTS_COLORS.length, 0),
  };
}

/** 텍스처 캐시 키 */
export function appearanceKey(a: Appearance): string {
  return `char-${a.skin}-${a.hair}-${a.hairColor}-${a.shirt}-${a.pants}`;
}

export function randomAppearance(rnd: () => number = Math.random): Appearance {
  return {
    skin: Math.floor(rnd() * SKIN_TONES.length),
    hair: Math.floor(rnd() * HAIR_STYLES.length),
    hairColor: Math.floor(rnd() * HAIR_COLORS.length),
    shirt: SHIRT_COLORS[Math.floor(rnd() * SHIRT_COLORS.length)]!,
    pants: Math.floor(rnd() * PANTS_COLORS.length),
  };
}
