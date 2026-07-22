/**
 * 캐릭터 외형 (스펙 §3 커스터마이징 — 베이스+레이어 조합).
 * 피부 6 × 헤어 6 × 헤어색 12 × 상의 24 × 하의 12 × 안경 5 × 모자 8 = 수백만 조합.
 * profiles.appearance(jsonb)에 저장, presence 메타로 전파.
 */
export interface Appearance {
  skin: number;      // SKIN_TONES 인덱스
  hair: number;      // HAIR_STYLES 인덱스
  hairColor: number; // HAIR_COLORS 인덱스
  shirt: string;     // hex 6자리 (# 제외)
  pants: number;     // PANTS_COLORS 인덱스
  glasses?: number;  // GLASSES_STYLES 인덱스 (0/미지정 = 없음)
  hat?: number;      // HAT_STYLES 인덱스 (0/미지정 = 없음)
}

export const SKIN_TONES = [0xf0cfae, 0xe8c0a0, 0xe2b98f, 0xc99a6e, 0xa5744c, 0x7a5236] as const;
export const SKIN_LABELS = ['라이트', '내추럴', '미디엄', '탠', '브론즈', '딥'] as const;
export const HAIR_STYLES = ['숏컷', '단발', '장발', '포니테일', '곱슬', '캡모자'] as const;
export const HAIR_COLORS = [
  0x2e2620, 0x4a3828, 0x6e4a30, 0x8a6a4a, 0xb8b0a8, 0xa85c48,
  0xd8b46a, 0xe89ab8, 0x6a8ad8, 0x5cc0a0, 0xb89ad8, 0xdcd6cc,
] as const;
export const HAIR_COLOR_LABELS = [
  '블랙', '다크브라운', '브라운', '라이트브라운', '애쉬', '오번',
  '블론드', '핑크', '블루', '민트', '라벤더', '실버',
] as const;
export const SHIRT_COLORS = [
  'e8c9a0', 'd88a7c', '8ab8a8', 'd8b86e', 'a8c8e0', 'c8a8d8',
  '9cc79c', 'e0a8b8', 'f2ead8', '6a7a8a', 'b0685a', '4a4e5c',
  'e86a6a', 'f2a85c', 'f2d85c', '7ec86a', '5cb0e0', '6a6ad8',
  'b06ad8', 'e86ab0', '2e2e38', 'f2f2ea', 'c89a6a', '3a7a5a',
] as const;
export const PANTS_COLORS = [
  0x4a4e5c, 0x6e5c4c, 0x3a3f52, 0x8a8a92, 0x556052, 0x7d5f46,
  0x2e3440, 0xa85c48, 0x5a6a8a, 0xb0a89c, 0x4a3a5c, 0xd8c8a8,
] as const;
/** 안경 (0 = 없음). 얼굴 위에 그린다 */
export const GLASSES_STYLES = ['없음', '동그란', '뿔테', '선글라스', '하트'] as const;
/** 모자·머리장식 (0 = 없음). 헤어 위에 그린다 */
export const HAT_STYLES = ['없음', '베레모', '비니', '머리띠', '꽃', '리본', '왕관', '헤드폰'] as const;

export const DEFAULT_APPEARANCE: Appearance = {
  skin: 0, hair: 0, hairColor: 0, shirt: 'e8c9a0', pants: 0, glasses: 0, hat: 0,
};

const HEX = /^[0-9a-f]{6}$/;

/** 저장된 값(jsonb)을 안전한 Appearance로 정규화 — 손상돼도/필드 없어도 캐릭터는 뜬다 */
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
    glasses: idx(o.glasses, GLASSES_STYLES.length, 0),
    hat: idx(o.hat, HAT_STYLES.length, 0),
  };
}

/** 텍스처 캐시 키 */
export function appearanceKey(a: Appearance): string {
  return `char-${a.skin}-${a.hair}-${a.hairColor}-${a.shirt}-${a.pants}-${a.glasses ?? 0}-${a.hat ?? 0}`;
}

export function randomAppearance(rnd: () => number = Math.random): Appearance {
  const pick = (n: number) => Math.floor(rnd() * n);
  return {
    skin: pick(SKIN_TONES.length),
    hair: pick(HAIR_STYLES.length),
    hairColor: pick(HAIR_COLORS.length),
    shirt: SHIRT_COLORS[pick(SHIRT_COLORS.length)]!,
    pants: pick(PANTS_COLORS.length),
    // 안경·모자는 절반 확률로만 착용 (없음=0에 가중치)
    glasses: rnd() < 0.5 ? 0 : pick(GLASSES_STYLES.length),
    hat: rnd() < 0.5 ? 0 : pick(HAT_STYLES.length),
  };
}
