/**
 * 캐릭터 외형 (스펙 §3 커스터마이징 — 베이스+레이어 조합).
 * 기존 색상 조합 위에 상의·하의·신발 실루엣, 등 장식, 포인트 염색을 겹친다.
 * 예전 profiles.appearance JSON에는 새 필드가 없어도 normalizeAppearance가 기본값을 채운다.
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
  topStyle?: number;    // TOP_STYLES 인덱스
  bottomStyle?: number; // BOTTOM_STYLES 인덱스
  shoeStyle?: number;   // SHOE_STYLES 인덱스
  back?: number;        // BACK_STYLES 인덱스 (0 = 없음)
  accent?: string;      // 포인트 염색 hex 6자리 (# 제외)
  eyeStyle?: number;    // EYE_STYLES 인덱스
  mouthStyle?: number;  // MOUTH_STYLES 인덱스
  faceDetail?: number;  // FACE_DETAILS 인덱스 (0 = 없음)
  topPattern?: number;  // TOP_PATTERNS 인덱스 (0 = 무지)
  sockStyle?: number;   // SOCK_STYLES 인덱스 (0 = 없음)
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
export const TOP_STYLES = ['베이직 티', '후드', '블레이저', '가디건', '오버롤', '크롭 재킷', '세일러', '한복 저고리'] as const;
export const BOTTOM_STYLES = ['슬림 팬츠', '와이드 팬츠', '쇼츠', '플리츠 스커트', '카고 팬츠', '롱 스커트'] as const;
export const SHOE_STYLES = ['스니커즈', '앵클부츠', '로퍼', '하이탑', '컬러 러너'] as const;
export const BACK_STYLES = ['없음', '미니 백팩', '기타 케이스', '픽셀 윙', '토트백', '고양이 꼬리'] as const;
export const EYE_STYLES = ['동글 눈', '초롱 눈', '반달 눈', '졸린 눈', '날카로운 눈', '별빛 눈'] as const;
export const MOUTH_STYLES = ['작은 미소', '앙다문 입', '고양이 입', '무표정', '장난 미소'] as const;
export const FACE_DETAILS = ['없음', '주근깨', '볼터치', '매력점', '볼 반창고', '페이스 페인트'] as const;
export const TOP_PATTERNS = ['무지', '스트라이프', '체커', '하트', '별', '꽃자수'] as const;
export const SOCK_STYLES = ['없음', '흰 양말', '줄무늬 양말', '니삭스', '레그워머'] as const;
export const ACCENT_COLORS = [
  'f2ead8', '2e2e38', 'e85f6a', 'f2a85c', 'f2d85c', '72b86a', '58b8c8', '5c8fe0',
  '806ad8', 'b86ad8', 'e86aa8', 'c89a6a', '8a6a4a', 'd8c8a8', 'a8b8c8', 'ffffff',
] as const;

export const DEFAULT_APPEARANCE: Appearance = {
  skin: 0, hair: 0, hairColor: 0, shirt: 'e8c9a0', pants: 0, glasses: 0, hat: 0,
  topStyle: 0, bottomStyle: 0, shoeStyle: 0, back: 0, accent: 'f2ead8',
  eyeStyle: 0, mouthStyle: 0, faceDetail: 0, topPattern: 0, sockStyle: 0,
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
    topStyle: idx(o.topStyle, TOP_STYLES.length, 0),
    bottomStyle: idx(o.bottomStyle, BOTTOM_STYLES.length, 0),
    shoeStyle: idx(o.shoeStyle, SHOE_STYLES.length, 0),
    back: idx(o.back, BACK_STYLES.length, 0),
    accent: typeof o.accent === 'string' && HEX.test(o.accent) ? o.accent : DEFAULT_APPEARANCE.accent,
    eyeStyle: idx(o.eyeStyle, EYE_STYLES.length, 0),
    mouthStyle: idx(o.mouthStyle, MOUTH_STYLES.length, 0),
    faceDetail: idx(o.faceDetail, FACE_DETAILS.length, 0),
    topPattern: idx(o.topPattern, TOP_PATTERNS.length, 0),
    sockStyle: idx(o.sockStyle, SOCK_STYLES.length, 0),
  };
}

/** 텍스처 캐시 키 */
export function appearanceKey(a: Appearance): string {
  return `char-${a.skin}-${a.hair}-${a.hairColor}-${a.shirt}-${a.pants}-${a.glasses ?? 0}-${a.hat ?? 0}-${a.topStyle ?? 0}-${a.bottomStyle ?? 0}-${a.shoeStyle ?? 0}-${a.back ?? 0}-${a.accent ?? DEFAULT_APPEARANCE.accent}-${a.eyeStyle ?? 0}-${a.mouthStyle ?? 0}-${a.faceDetail ?? 0}-${a.topPattern ?? 0}-${a.sockStyle ?? 0}`;
}

/** 아틀리에에서 실제로 만들 수 있는 독립 외형 조합 수. */
export function appearanceCombinationCount(): number {
  return [
    SKIN_TONES, HAIR_STYLES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS,
    GLASSES_STYLES, HAT_STYLES, TOP_STYLES, BOTTOM_STYLES, SHOE_STYLES,
    BACK_STYLES, ACCENT_COLORS, EYE_STYLES, MOUTH_STYLES, FACE_DETAILS,
    TOP_PATTERNS, SOCK_STYLES,
  ].reduce((total, options) => total * options.length, 1);
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
    topStyle: pick(TOP_STYLES.length),
    bottomStyle: pick(BOTTOM_STYLES.length),
    shoeStyle: pick(SHOE_STYLES.length),
    back: rnd() < 0.6 ? 0 : pick(BACK_STYLES.length),
    accent: ACCENT_COLORS[pick(ACCENT_COLORS.length)]!,
    eyeStyle: pick(EYE_STYLES.length),
    mouthStyle: pick(MOUTH_STYLES.length),
    faceDetail: rnd() < 0.45 ? 0 : pick(FACE_DETAILS.length),
    topPattern: rnd() < 0.35 ? 0 : pick(TOP_PATTERNS.length),
    sockStyle: rnd() < 0.4 ? 0 : pick(SOCK_STYLES.length),
  };
}
