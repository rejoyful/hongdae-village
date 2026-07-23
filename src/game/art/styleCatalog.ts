import {
  EYE_STYLES, MOUTH_STYLES, FACE_DETAILS, TOP_PATTERNS, SOCK_STYLES,
} from './appearance';

export type StyleField = 'eyeStyle' | 'mouthStyle' | 'faceDetail' | 'topPattern' | 'sockStyle';
export type StyleRarity = 'starter' | 'rare';

export interface StyleOptionDef {
  id: string;
  field: StyleField;
  index: number;
  name: string;
  rarity: StyleRarity;
  requiredBadgeId?: string;
}

export interface StyleOptionView extends StyleOptionDef {
  unlocked: boolean;
}

const LOCKS: Partial<Record<`${StyleField}:${number}`, string>> = {
  'eyeStyle:4': 'badge_intro_hunt',
  'eyeStyle:5': 'badge_collect_sparkle_10',
  'mouthStyle:4': 'badge_story_emote_circle',
  'faceDetail:4': 'badge_intro_hunt',
  'faceDetail:5': 'badge_story_street_stage',
  'topPattern:3': 'badge_intro_pet',
  'topPattern:4': 'badge_collect_treasure_1',
  'topPattern:5': 'badge_story_style',
  'sockStyle:3': 'badge_story_style',
  'sockStyle:4': 'badge_story_street_stage',
};

export const STYLE_FIELD_LABELS: Record<StyleField, string> = {
  eyeStyle: '눈매',
  mouthStyle: '입모양',
  faceDetail: '얼굴 포인트',
  topPattern: '상의 무늬',
  sockStyle: '양말',
};

const STYLE_NAMES: Record<StyleField, readonly string[]> = {
  eyeStyle: EYE_STYLES,
  mouthStyle: MOUTH_STYLES,
  faceDetail: FACE_DETAILS,
  topPattern: TOP_PATTERNS,
  sockStyle: SOCK_STYLES,
};

export const STYLE_FIELDS = Object.keys(STYLE_NAMES) as StyleField[];

export const STYLE_OPTIONS: StyleOptionDef[] = STYLE_FIELDS.flatMap((field) =>
  STYLE_NAMES[field].map((name, index) => {
    const requiredBadgeId = LOCKS[`${field}:${index}`];
    return {
      id: `${field}-${index}`,
      field,
      index,
      name,
      rarity: requiredBadgeId ? 'rare' : 'starter',
      ...(requiredBadgeId ? { requiredBadgeId } : {}),
    };
  }),
);

export function isStyleField(field: keyof import('./appearance').Appearance): field is StyleField {
  return STYLE_FIELDS.includes(field as StyleField);
}

export function styleOptionViews(unlockedBadgeIds: readonly string[]): StyleOptionView[] {
  const badges = new Set(unlockedBadgeIds);
  return STYLE_OPTIONS.map((option) => ({
    ...option,
    unlocked: !option.requiredBadgeId || badges.has(option.requiredBadgeId),
  }));
}

export function styleCatalogProgress(unlockedBadgeIds: readonly string[]): {
  unlocked: number;
  total: number;
  rareUnlocked: number;
  rareTotal: number;
} {
  const views = styleOptionViews(unlockedBadgeIds);
  const rare = views.filter((option) => option.rarity === 'rare');
  return {
    unlocked: views.filter((option) => option.unlocked).length,
    total: views.length,
    rareUnlocked: rare.filter((option) => option.unlocked).length,
    rareTotal: rare.length,
  };
}

export function rareStyleUnlockCount(unlockedBadgeIds: readonly string[]): number {
  return styleCatalogProgress(unlockedBadgeIds).rareUnlocked;
}

export function unlockedStyleIndexes(field: StyleField, unlockedBadgeIds: readonly string[]): number[] {
  return styleOptionViews(unlockedBadgeIds)
    .filter((option) => option.field === field && option.unlocked)
    .map((option) => option.index);
}

/** 화살표 순환 시 잠긴 스타일은 건너뛴다. 현재 잠긴 값은 레거시 코디 보존을 위해 그대로 표시 가능하다. */
export function cycleStyleOption(
  field: StyleField,
  current: number,
  direction: 1 | -1,
  unlockedBadgeIds: readonly string[],
): number {
  const available = new Set(unlockedStyleIndexes(field, unlockedBadgeIds));
  const length = STYLE_NAMES[field].length;
  for (let distance = 1; distance <= length; distance += 1) {
    const candidate = (current + direction * distance + length * 2) % length;
    if (available.has(candidate)) return candidate;
  }
  return current;
}
