import { CATALOG_BY_ID, type ItemCategory, type ItemDef } from '../../items/catalog';
import { layerOf, type Placed } from '../entities/placement';

export type HomeGradeId = 'empty' | 'nest' | 'cozy' | 'signature' | 'star' | 'landmark';
export type HomeThemeId = 'starter' | 'cozy' | 'music' | 'green' | 'creator' | 'pet';

export interface HomeGrade {
  id: HomeGradeId;
  name: string;
  icon: string;
  minScore: number;
}

export interface HomeTheme {
  id: HomeThemeId;
  name: string;
  icon: string;
  description: string;
  itemIds: readonly string[];
  arches: readonly string[];
}

export interface HomeDesignAnalysis {
  score: number;
  grade: HomeGrade;
  theme: HomeTheme;
  themePower: number;
  /** 대표 테마뿐 아니라 주민 방문 조건이 읽는 모든 테마의 현재 점수. */
  themePowers: Record<HomeThemeId, number>;
  placedCount: number;
  uniqueCount: number;
  categoryCount: number;
  layerCount: number;
  natureCount: number;
  hobbyCount: number;
  essentials: {
    sleep: boolean;
    seating: boolean;
    surface: boolean;
    storage: boolean;
    light: boolean;
  };
  nextTip: string;
}

export const HOME_GRADES: readonly HomeGrade[] = [
  { id: 'empty', name: '빈 캔버스', icon: '📦', minScore: 0 },
  { id: 'nest', name: '새 둥지', icon: '🪹', minScore: 10 },
  { id: 'cozy', name: '포근한 방', icon: '🛋️', minScore: 30 },
  { id: 'signature', name: '취향 가득', icon: '🎨', minScore: 50 },
  { id: 'star', name: '홈스타', icon: '✨', minScore: 70 },
  { id: 'landmark', name: '마을 명소', icon: '🏆', minScore: 90 },
];

export const HOME_THEMES: readonly HomeTheme[] = [
  {
    id: 'cozy', name: '포근한 아지트', icon: '☕', description: '부드러운 조명과 쉴 곳이 많은 따뜻한 공간',
    itemIds: ['bed_basic', 'bed_green', 'sofa_coral', 'sofa_gray', 'sofa_single', 'rug_cream', 'rug_round', 'candle_set', 'cushion'],
    arches: ['bed', 'sofa', 'rug', 'lamp'],
  },
  {
    id: 'music', name: '홍대 뮤직룸', icon: '🎸', description: '악기와 음반으로 채운 골목 뮤지션의 작업실',
    itemIds: ['turntable', 'speaker_amp', 'guitar', 'mic_stand', 'lp_crate', 'poster_band', 'neon_sign'],
    arches: ['instrument'],
  },
  {
    id: 'green', name: '초록 정원', icon: '🌿', description: '식물과 작은 생명이 숨 쉬는 도심 속 정원',
    itemIds: ['plant_pot', 'cactus', 'stuckyi', 'flower_vase', 'mini_garden', 'window_plant', 'fish_tank'],
    arches: ['plant', 'vase', 'garden', 'tank'],
  },
  {
    id: 'creator', name: '크리에이터 스튜디오', icon: '🖥️', description: '책과 장비, 영감이 모이는 창작자의 방',
    itemIds: ['desk_wood', 'desk_white', 'pc_setup', 'laptop_desk', 'bookshelf', 'bookshelf_wide', 'easel', 'book_pile', 'photo_frames'],
    arches: ['screen', 'shelf'],
  },
  {
    id: 'pet', name: '멍냥 패밀리룸', icon: '🐾', description: '작은 친구와 함께 쉬고 노는 다정한 공간',
    itemIds: ['cat_tower', 'cushion', 'bear_doll', 'fish_tank', 'rug_round', 'sofa_single'],
    arches: ['cattower', 'doll'],
  },
];

export const STARTER_THEME: HomeTheme = {
  id: 'starter', name: '나만의 시작', icon: '🏠', description: '좋아하는 물건을 하나씩 놓아 보세요', itemIds: [], arches: [],
};

const hasArch = (defs: ItemDef[], arches: readonly string[]): boolean => defs.some((d) => arches.includes(d.arch));

function themePower(theme: HomeTheme, uniqueDefs: ItemDef[]): number {
  return uniqueDefs.reduce((sum, def) => (
    sum + (theme.itemIds.includes(def.id) || theme.arches.includes(def.arch) ? 1 : 0)
  ), 0);
}

function nextHomeTip(a: Omit<HomeDesignAnalysis, 'nextTip'>): string {
  if (!a.essentials.sleep) return '침대를 놓으면 생활 점수가 크게 올라요.';
  if (!a.essentials.seating) return '의자나 소파로 편히 쉴 자리를 만들어 보세요.';
  if (!a.essentials.surface) return '책상이나 테이블을 놓아 생활 동선을 완성해 보세요.';
  if (!a.essentials.storage) return '책장·옷장 같은 수납 가구가 있으면 집이 안정돼요.';
  if (!a.essentials.light) return '스탠드나 무드등 하나로 밤 분위기를 바꿀 수 있어요.';
  if (a.categoryCount < 4) return '서로 다른 가구 분류를 섞으면 조화 점수가 올라요.';
  if (a.natureCount === 0) return '작은 화분 하나가 공간에 생기를 더해 줘요.';
  if (a.themePower < 3) return '비슷한 취향의 물건 3종을 모으면 집 테마가 드러나요.';
  if (a.uniqueCount < 12) return '새로운 종류의 소품을 더해 나만의 이야기를 만들어 보세요.';
  if (a.score < 90) return '벽·바닥·가구 레이어를 고르게 꾸미면 명소에 가까워져요.';
  return '완성된 명소예요! 계절 소품으로 새로운 테마도 연구해 보세요.';
}

/**
 * 현재 배치만으로 집의 생활성·다양성·취향을 평가한다.
 * 가격이 아니라 실제 구성에 점수를 주어 과금/노가다보다 꾸미기 선택을 보상한다.
 */
export function analyzeHomeDesign(placed: readonly Placed[]): HomeDesignAnalysis {
  const defs = placed.map((p) => CATALOG_BY_ID.get(p.itemId)).filter((d): d is ItemDef => !!d);
  const uniqueDefs = [...new Map(defs.map((d) => [d.id, d])).values()];
  const categories = new Set<ItemCategory>(defs.map((d) => d.category));
  const layers = new Set(placed.filter((p) => CATALOG_BY_ID.has(p.itemId)).map((p) => layerOf(p.itemId)));

  const essentials = {
    sleep: hasArch(defs, ['bed']),
    seating: hasArch(defs, ['seat', 'sofa']),
    surface: hasArch(defs, ['table', 'counter']),
    storage: hasArch(defs, ['shelf', 'wardrobe', 'hanger']),
    light: hasArch(defs, ['lamp']),
  };
  const natureCount = uniqueDefs.filter((d) => ['plant', 'vase', 'garden', 'tank'].includes(d.arch)).length;
  const hobbyCount = uniqueDefs.filter((d) => ['instrument', 'screen', 'tank', 'doll', 'cattower'].includes(d.arch)).length;

  const rankedThemes = HOME_THEMES
    .map((theme) => ({ theme, power: themePower(theme, uniqueDefs) }))
    .sort((a, b) => b.power - a.power);
  const best = rankedThemes[0]!;
  const theme = best.power >= 3 ? best.theme : STARTER_THEME;
  const strongestThemePower = best.power;
  const themePowers = Object.fromEntries([
    ['starter', 0],
    ...rankedThemes.map(({ theme: rankedTheme, power }) => [rankedTheme.id, power]),
  ]) as Record<HomeThemeId, number>;

  const essentialScore = (essentials.sleep ? 7 : 0) + (essentials.seating ? 6 : 0)
    + (essentials.surface ? 5 : 0) + (essentials.storage ? 4 : 0) + (essentials.light ? 4 : 0);
  const diversityScore = Math.min(21, categories.size * 3.5);
  const collectionScore = Math.min(21, uniqueDefs.length * 1.5);
  const layerScore = Math.min(9, layers.size * 3);
  const careScore = Math.min(9, natureCount * 3) + Math.min(6, hobbyCount * 3)
    + (uniqueDefs.some((d) => d.arch === 'cattower') ? 4 : 0);
  const themeBonus = Math.min(4, strongestThemePower);
  const score = Math.max(0, Math.min(100, Math.round(
    essentialScore + diversityScore + collectionScore + layerScore + careScore + themeBonus,
  )));
  const grade = [...HOME_GRADES].reverse().find((g) => score >= g.minScore) ?? HOME_GRADES[0]!;

  const base = {
    score, grade, theme, themePower: strongestThemePower, themePowers,
    placedCount: defs.length, uniqueCount: uniqueDefs.length, categoryCount: categories.size,
    layerCount: layers.size, natureCount, hobbyCount, essentials,
  };
  return { ...base, nextTip: nextHomeTip(base) };
}
