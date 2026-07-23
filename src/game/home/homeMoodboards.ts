import { CATALOG_BY_ID } from '../../items/catalog';
import type { Placed } from '../entities/placement';
import type { QuestState } from '../questProgress';
import type { FurnitureReformState } from './furnitureReform';
import type { HomeDesignAnalysis } from './homeDesign';

export type HomeMoodboardId =
  | 'first_nest' | 'rainy_cafe' | 'vinyl_night' | 'rehearsal_room'
  | 'rooftop_green' | 'water_observatory' | 'creator_desk' | 'analog_studio'
  | 'pet_lounge' | 'tiny_kitchen' | 'vintage_room' | 'maximalist_archive';

type AnalysisMetric = 'score' | 'uniqueCount' | 'categoryCount' | 'natureCount' | 'hobbyCount' | 'themePower';

export type HomeMoodboardRequirement =
  | { kind: 'analysis'; key: AnalysisMetric; goal: number; label: string }
  | { kind: 'theme'; theme: 'cozy' | 'music' | 'green' | 'creator' | 'pet'; goal: number; label: string }
  | { kind: 'journal'; key: string; goal: number; label: string }
  | { kind: 'reform'; key: 'styled' | 'combinations'; goal: number; label: string };

export interface HomeMoodboardDef {
  id: HomeMoodboardId;
  order: number;
  mark: string;
  title: string;
  subtitle: string;
  description: string;
  palette: readonly [string, string, string, string];
  itemIds: readonly [string, string, string, string];
  requirements: readonly HomeMoodboardRequirement[];
  keepsake: string;
}

export interface HomeMoodboardState {
  version: 1;
  stampedIds: HomeMoodboardId[];
  trackedId: HomeMoodboardId | null;
}

export interface HomeMoodboardContext {
  placed: readonly Placed[];
  inventory: ReadonlyMap<string, number>;
  analysis: HomeDesignAnalysis;
  quests: QuestState;
  reform: FurnitureReformState;
}

export interface HomeMoodboardCheck {
  id: string;
  kind: 'item' | 'condition';
  label: string;
  current: number;
  goal: number;
  done: boolean;
  itemId?: string;
  owned?: boolean;
}

export interface HomeMoodboardView extends HomeMoodboardDef {
  checks: HomeMoodboardCheck[];
  stamped: boolean;
  ready: boolean;
  progress: number;
  completedChecks: number;
}

export interface HomeMoodboardProgress {
  stamped: number;
  total: number;
  ready: number;
  started: number;
  matchedItems: number;
  totalItems: number;
}

export const HOME_MOODBOARDS: readonly HomeMoodboardDef[] = [
  {
    id: 'first_nest', order: 1, mark: '둥', title: '첫 둥지', subtitle: '오늘부터 내 방',
    description: '잠들 곳, 작업할 곳, 작은 빛과 초록을 놓아 생활의 중심을 만들어요.',
    palette: ['#f6dfb3', '#c78967', '#6f8062', '#3f3540'],
    itemIds: ['bed_basic', 'desk_wood', 'lamp_stand', 'plant_pot'],
    requirements: [{ kind: 'analysis', key: 'score', goal: 30, label: '홈 점수 30' }],
    keepsake: '손때 묻은 첫 열쇠',
  },
  {
    id: 'rainy_cafe', order: 2, mark: '비', title: '비 오는 골목 카페', subtitle: '창가의 느린 오후',
    description: '낮은 테이블과 따뜻한 커피 향으로 친구가 오래 머무는 자리를 만들어요.',
    palette: ['#d9c6a0', '#8da0a1', '#785d55', '#313b42'],
    itemIds: ['sofa_single', 'tea_table', 'coffee_maker', 'lamp_mood'],
    requirements: [{ kind: 'theme', theme: 'cozy', goal: 4, label: '포근한 테마 파워 4' }],
    keepsake: '빗방울 유리 코스터',
  },
  {
    id: 'vinyl_night', order: 3, mark: '판', title: '바이닐 나이트', subtitle: '바늘 끝의 밤',
    description: '좋아하는 음반과 네온을 모아 밤마다 선곡이 바뀌는 감상실을 꾸며요.',
    palette: ['#e8a95d', '#bb596d', '#54416d', '#222536'],
    itemIds: ['turntable', 'speaker_amp', 'lp_crate', 'neon_sign'],
    requirements: [{ kind: 'theme', theme: 'music', goal: 4, label: '음악 테마 파워 4' }],
    keepsake: '자정 한정 LP 라벨',
  },
  {
    id: 'rehearsal_room', order: 4, mark: '합', title: '골목 합주실', subtitle: '서툰 첫 번째 앙코르',
    description: '기타와 마이크, 작은 앰프를 연결해 누구나 한 곡 보태는 방을 만들어요.',
    palette: ['#e9c45f', '#bf5d4c', '#537568', '#2b3036'],
    itemIds: ['guitar', 'mic_stand', 'speaker_amp', 'poster_band'],
    requirements: [{ kind: 'journal', key: 'q_busking', goal: 5, label: '버스킹 누적 5회' }],
    keepsake: '첫 합주 셋리스트',
  },
  {
    id: 'rooftop_green', order: 5, mark: '잎', title: '옥탑 초록정원', subtitle: '콘크리트 틈의 계절',
    description: '크고 작은 식물을 높낮이 다르게 놓아 매일 자라는 풍경을 만들어요.',
    palette: ['#d8d59a', '#91ad76', '#55735d', '#4e403a'],
    itemIds: ['mini_garden', 'window_plant', 'cactus', 'flower_vase'],
    requirements: [{ kind: 'analysis', key: 'natureCount', goal: 4, label: '서로 다른 자연 소품 4종' }],
    keepsake: '옥상 정원 관찰표',
  },
  {
    id: 'water_observatory', order: 6, mark: '물', title: '작은 물빛 관측소', subtitle: '유리 너머의 생태',
    description: '어항 주변에 물가의 기억과 식물을 모아 조용한 관찰 자리를 꾸며요.',
    palette: ['#cfe1d5', '#78a9a9', '#547b8f', '#334654'],
    itemIds: ['fish_tank', 'stuckyi', 'window_plant', 'photo_frames'],
    requirements: [{ kind: 'journal', key: 'fishing_species', goal: 6, label: '물가 생물 6종 발견' }],
    keepsake: '푸른 관측 기록지',
  },
  {
    id: 'creator_desk', order: 7, mark: '작', title: '크리에이터 데스크', subtitle: '아이디어가 켜지는 자리',
    description: '화면과 책, 기록을 한곳에 모아 나만의 프로젝트가 자라는 작업대를 만들어요.',
    palette: ['#e1d7c5', '#8ca3ac', '#bd7f66', '#3c4653'],
    itemIds: ['pc_setup', 'desk_white', 'bookshelf_wide', 'photo_frames'],
    requirements: [{ kind: 'theme', theme: 'creator', goal: 4, label: '창작 테마 파워 4' }],
    keepsake: '완성한 첫 시안',
  },
  {
    id: 'analog_studio', order: 8, mark: '손', title: '아날로그 스튜디오', subtitle: '종이와 붓의 온도',
    description: '그림과 책, 영화의 조각을 손으로 다듬은 가구 사이에 전시해요.',
    palette: ['#e7cf9d', '#b77b5f', '#718177', '#463d3b'],
    itemIds: ['easel', 'book_pile', 'poster_film', 'wall_shelf'],
    requirements: [{ kind: 'reform', key: 'styled', goal: 1, label: '가구 1개 리폼' }],
    keepsake: '물감 묻은 작업 앞치마',
  },
  {
    id: 'pet_lounge', order: 9, mark: '발', title: '멍냥 패밀리 라운지', subtitle: '같은 높이에서 쉬기',
    description: '푹신한 바닥과 오를 곳을 준비해 작은 가족의 생활 반경을 넓혀요.',
    palette: ['#f0d1ad', '#c98f83', '#7c987c', '#514653'],
    itemIds: ['cat_tower', 'cushion', 'rug_round', 'sofa_single'],
    requirements: [{ kind: 'theme', theme: 'pet', goal: 4, label: '반려 테마 파워 4' }],
    keepsake: '발바닥 모양 방명록',
  },
  {
    id: 'tiny_kitchen', order: 10, mark: '식', title: '한 평 다이닝', subtitle: '한 끼를 나누는 집',
    description: '작아도 손이 잘 닿는 주방과 마주 앉는 식탁으로 집의 맛을 완성해요.',
    palette: ['#f1d9a8', '#c56f50', '#78927f', '#48515a'],
    itemIds: ['kitchen_counter', 'sink_unit', 'coffee_maker', 'dining_table'],
    requirements: [{ kind: 'journal', key: 'cooking_recipes', goal: 6, label: '요리 레시피 6종 발견' }],
    keepsake: '우리 집 첫 메뉴판',
  },
  {
    id: 'vintage_room', order: 11, mark: '고', title: '시간 수집가의 방', subtitle: '낡아서 더 좋은 것들',
    description: '오래된 시계와 천, 촛불의 질감에 리폼의 손길을 더해 시간의 층을 만들어요.',
    palette: ['#d0bd8d', '#9b7759', '#65705d', '#3d3a34'],
    itemIds: ['dresser', 'wall_clock', 'candle_set', 'rug_long'],
    requirements: [{ kind: 'reform', key: 'combinations', goal: 4, label: '리폼 조합 4종 발견' }],
    keepsake: '황동빛 리폼 스탬프',
  },
  {
    id: 'maximalist_archive', order: 12, mark: '집', title: '취향 맥시멀리스트', subtitle: '좋아하는 것으로 가득',
    description: '수납과 전시, 장난감과 기록을 층층이 쌓아 누구와도 닮지 않은 방을 완성해요.',
    palette: ['#e4b865', '#c26a61', '#5b8b88', '#443f63'],
    itemIds: ['wardrobe', 'bookshelf_wide', 'photo_frames', 'bear_doll'],
    requirements: [
      { kind: 'analysis', key: 'uniqueCount', goal: 20, label: '서로 다른 가구 20종 전시' },
      { kind: 'analysis', key: 'score', goal: 90, label: '홈 점수 90' },
    ],
    keepsake: '나만의 집 도감 완성본',
  },
] as const;

export const HOME_MOODBOARD_BY_ID = new Map(HOME_MOODBOARDS.map((board) => [board.id, board]));

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

export function freshHomeMoodboardState(): HomeMoodboardState { return { version: 1, stampedIds: [], trackedId: 'first_nest' }; }

export function normalizeHomeMoodboardState(raw: unknown): HomeMoodboardState {
  if (!raw || typeof raw !== 'object') return freshHomeMoodboardState();
  const value = raw as Partial<HomeMoodboardState>;
  const stampedIds = Array.isArray(value.stampedIds)
    ? [...new Set(value.stampedIds.filter((id): id is HomeMoodboardId => typeof id === 'string' && HOME_MOODBOARD_BY_ID.has(id as HomeMoodboardId)))]
    : [];
  const trackedId = typeof value.trackedId === 'string' && HOME_MOODBOARD_BY_ID.has(value.trackedId as HomeMoodboardId)
    ? value.trackedId as HomeMoodboardId : null;
  return { version: 1, stampedIds, trackedId };
}

function requirementValue(requirement: HomeMoodboardRequirement, context: HomeMoodboardContext): number {
  if (requirement.kind === 'analysis') return cleanCount(context.analysis[requirement.key]);
  if (requirement.kind === 'theme') return cleanCount(context.analysis.themePowers[requirement.theme]);
  if (requirement.kind === 'journal') return cleanCount(context.quests.lifetimeCounts?.[requirement.key]);
  if (requirement.key === 'styled') return Object.keys(context.reform.styles).length;
  return context.reform.discovered.length;
}

export function homeMoodboardView(def: HomeMoodboardDef, state: HomeMoodboardState, context: HomeMoodboardContext): HomeMoodboardView {
  const placedIds = new Set(context.placed.map((item) => item.itemId));
  const itemChecks: HomeMoodboardCheck[] = def.itemIds.map((itemId) => {
    const current = placedIds.has(itemId) ? 1 : 0;
    return {
      id: `item:${itemId}`, kind: 'item', itemId, label: CATALOG_BY_ID.get(itemId)?.name ?? itemId,
      current, goal: 1, done: current >= 1, owned: current >= 1 || cleanCount(context.inventory.get(itemId)) > 0,
    };
  });
  const conditionChecks: HomeMoodboardCheck[] = def.requirements.map((requirement, index) => {
    const value = requirementValue(requirement, context);
    return {
      id: `condition:${index}`, kind: 'condition', label: requirement.label,
      current: Math.min(value, requirement.goal), goal: requirement.goal, done: value >= requirement.goal,
    };
  });
  const checks = [...itemChecks, ...conditionChecks];
  const stamped = state.stampedIds.includes(def.id);
  const completedChecks = checks.filter((check) => check.done).length;
  return {
    ...def, checks, stamped, ready: !stamped && checks.every((check) => check.done),
    progress: checks.length ? Math.round((completedChecks / checks.length) * 100) : 100, completedChecks,
  };
}

export function homeMoodboardViews(state: HomeMoodboardState, context: HomeMoodboardContext): HomeMoodboardView[] {
  return HOME_MOODBOARDS.map((board) => homeMoodboardView(board, state, context));
}

export function homeMoodboardProgress(state: HomeMoodboardState, context: HomeMoodboardContext): HomeMoodboardProgress {
  const views = homeMoodboardViews(state, context);
  const itemChecks = views.flatMap((view) => view.checks.filter((check) => check.kind === 'item'));
  return {
    stamped: state.stampedIds.length, total: HOME_MOODBOARDS.length,
    ready: views.filter((view) => view.ready).length,
    started: views.filter((view) => view.stamped || view.completedChecks > 0).length,
    matchedItems: itemChecks.filter((check) => check.done).length, totalItems: itemChecks.length,
  };
}

export type HomeMoodboardStampResult = 'stamped' | 'not-ready' | 'unknown';

export class HomeMoodboardStore {
  private state: HomeMoodboardState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-home-moodboards-${userId}`;
    let raw: unknown = null;
    try { const stored = localStorage.getItem(this.key); if (stored) raw = JSON.parse(stored); } catch { /* session only */ }
    this.state = normalizeHomeMoodboardState(raw);
    this.persist();
  }

  get(): HomeMoodboardState { return this.state; }
  views(context: HomeMoodboardContext): HomeMoodboardView[] { return homeMoodboardViews(this.state, context); }
  progress(context: HomeMoodboardContext): HomeMoodboardProgress { return homeMoodboardProgress(this.state, context); }

  track(id: HomeMoodboardId | null): void {
    if (id !== null && !HOME_MOODBOARD_BY_ID.has(id)) return;
    this.state = { ...this.state, trackedId: id }; this.persist();
  }

  stamp(id: HomeMoodboardId, context: HomeMoodboardContext): HomeMoodboardStampResult {
    const def = HOME_MOODBOARD_BY_ID.get(id);
    if (!def) return 'unknown';
    const view = homeMoodboardView(def, this.state, context);
    if (!view.ready) return 'not-ready';
    this.state = { ...this.state, stampedIds: [...this.state.stampedIds, id], trackedId: this.nextUnstamped(id) };
    this.persist();
    return 'stamped';
  }

  private nextUnstamped(after: HomeMoodboardId): HomeMoodboardId | null {
    const current = HOME_MOODBOARDS.findIndex((board) => board.id === after);
    for (let offset = 1; offset <= HOME_MOODBOARDS.length; offset += 1) {
      const candidate = HOME_MOODBOARDS[(current + offset) % HOME_MOODBOARDS.length]!;
      if (!this.state.stampedIds.includes(candidate.id)) return candidate.id;
    }
    return null;
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
