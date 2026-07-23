import type { QuestView } from '../questProgress';

export type AdventurePathId =
  | 'style'
  | 'home'
  | 'companion'
  | 'neighbor'
  | 'maker'
  | 'explorer'
  | 'collector'
  | 'guardian';

export interface AdventurePathDef {
  id: AdventurePathId;
  code: string;
  mark: string;
  name: string;
  epithet: string;
  description: string;
  color: string;
  reward: string;
  questIds: readonly [string, string, string, string, string, string];
}

export interface AdventurePathView extends Omit<AdventurePathDef, 'questIds'> {
  steps: QuestView[];
  completed: number;
  total: number;
  progressPct: number;
  rank: string;
  next: QuestView | null;
  engaged: boolean;
}

export interface AdventurePathPassportState {
  version: 1;
  pinnedIds: AdventurePathId[];
  featuredId: AdventurePathId | null;
}

export interface AdventurePathPassportProgress {
  pinned: number;
  featured: AdventurePathId | null;
}

export const ADVENTURE_PATH_PIN_MAX = 3;

/**
 * 첫날 나침반 이후의 장기 진로. 각 진로는 이야기→수집→숙련을 한 줄로 묶되,
 * 가입/전직/포기 개념 없이 여덟 갈래를 동시에 진행한다. 기존 기록도 모두 소급 인정된다.
 */
export const ADVENTURE_PATHS: readonly AdventurePathDef[] = [
  {
    id: 'style', code: 'ATELIER', mark: '옷', name: '골목 아틀리에 디렉터', epithet: '오늘의 나를 수집하는 사람', color: '#a96f82',
    description: '커스터마이징, 옷장, 룩북과 화보를 이어 나만의 스타일 아카이브를 만듭니다.',
    reward: '아틀리에 시그니처 페이지',
    questIds: ['story_style', 'story_lookbook_first', 'story_lookbook_perfect', 'collect_lookbook_entries_6', 'collect_style_catalog', 'master_lookbook_unique_20'],
  },
  {
    id: 'home', code: 'HOMESTEAD', mark: '집', name: '장면을 짓는 집주인', epithet: '살림에 이야기를 담는 사람', color: '#a77a58',
    description: '배치, 리폼, 무드보드와 집들이까지 하나의 시그니처 룸으로 엮습니다.',
    reward: '홈 디렉터 금장 키태그',
    questIds: ['story_cozy_home', 'story_reform_first', 'story_moodboard_first', 'story_home_balance', 'collect_home_unique_20', 'master_home_score_90'],
  },
  {
    id: 'companion', code: 'COMPANION', mark: '발', name: '다정한 동행 기록가', epithet: '작은 신호를 오래 기억하는 사람', color: '#7f9169',
    description: '돌봄, 개성 프로필, 산책과 집 추억을 한 권의 동행 앨범으로 남깁니다.',
    reward: '평생 동행 발자국 휘장',
    questIds: ['story_pet_play', 'story_pet_profile', 'story_pet_signal_first', 'story_pet_outing_first', 'collect_pet_signals_24', 'master_pet_signal_chapters_6'],
  },
  {
    id: 'neighbor', code: 'NEIGHBOR', mark: '이', name: '골목 인연지기', epithet: '이름과 약속을 잊지 않는 사람', color: '#66869a',
    description: '인사, 신뢰, 주민 약속과 골목 의뢰를 이어 마을의 모든 이름을 기억합니다.',
    reward: '홍대 인연 수첩 표지',
    questIds: ['story_neighbor_circle', 'story_trusted_friend', 'story_rendezvous_first', 'story_request_categories_4', 'collect_rendezvous_10', 'master_resident_family'],
  },
  {
    id: 'maker', code: 'HANDMADE', mark: '손', name: '계절 없는 생활 장인', epithet: '심고 낚고 요리하는 사람', color: '#8d885a',
    description: '옥상 정원의 씨앗을 물결과 접시로 이어 손에 남는 생활 도감을 채웁니다.',
    reward: '골목 저녁 장인 레시피',
    questIds: ['story_garden_seed', 'story_garden_harvest', 'story_cooking_first', 'story_fishing_first', 'collect_garden_species_12', 'master_cooking_30'],
  },
  {
    id: 'explorer', code: 'WANDER', mark: '길', name: '엽서를 모으는 탐험가', epithet: '기분따라 다른 길을 걷는 사람', color: '#80739b',
    description: '지도, 반짝임, 골목 소풍과 작은 박물관을 돌며 숨은 장면을 찾습니다.',
    reward: '열두 장면 탐험 핀',
    questIds: ['intro_map', 'intro_sparkle', 'story_tour_first', 'collect_tour_postcards_6', 'story_museum_first', 'master_life_exploration_5'],
  },
  {
    id: 'collector', code: 'ARCHIVE', mark: '장', name: '생활 박물관 큐레이터', epithet: '작은 물건의 사연까지 모으는 사람', color: '#9a7654',
    description: '인형, 보물, 살림과 기념품을 발견하고 대표 소장품에 나를 담습니다.',
    reward: '개인 소장전 황금 명패',
    questIds: ['story_claw_first', 'collect_dolls_6', 'collect_treasure_1', 'collect_sallim_30', 'collect_museum_exhibits_8', 'master_museum_exhibits_24'],
  },
  {
    id: 'guardian', code: 'OUTSKIRT', mark: '숲', name: '외곽 생태 수호자', epithet: '싸움보다 관찰을 먼저 남기는 사람', color: '#687b74',
    description: '안전한 순찰, 몬스터 발견과 생태 연구를 함께 키워 외곽숲 전권을 완성합니다.',
    reward: '외곽숲 생태 연대기 휘장',
    questIds: ['intro_hunt', 'story_patrol_combo', 'collect_monster_5', 'collect_monster_research_30', 'master_level_10', 'master_monster_research_90'],
  },
] as const;

export const ADVENTURE_PATH_BY_ID = new Map(ADVENTURE_PATHS.map((path) => [path.id, path]));

export function normalizeAdventurePathPassportState(raw: unknown): AdventurePathPassportState {
  const value = (raw ?? {}) as Partial<AdventurePathPassportState>;
  const pinnedIds = Array.isArray(value.pinnedIds)
    ? [...new Set(value.pinnedIds.filter((id): id is AdventurePathId =>
      typeof id === 'string' && ADVENTURE_PATH_BY_ID.has(id as AdventurePathId),
    ))].slice(0, ADVENTURE_PATH_PIN_MAX)
    : [];
  const featuredId = typeof value.featuredId === 'string'
    && pinnedIds.includes(value.featuredId as AdventurePathId)
    ? value.featuredId as AdventurePathId
    : null;
  return { version: 1, pinnedIds, featuredId };
}

export type AdventurePathPinResult = 'pinned' | 'unpinned' | 'full' | 'missing';
export type AdventurePathFeatureResult = 'featured' | 'cleared' | 'unpinned' | 'missing';

export class AdventurePathPassportStore {
  private state: AdventurePathPassportState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-adventure-path-passport-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeAdventurePathPassportState(raw);
    this.persist();
  }

  get(): AdventurePathPassportState { return this.state; }

  progress(): AdventurePathPassportProgress {
    return { pinned: this.state.pinnedIds.length, featured: this.state.featuredId };
  }

  togglePin(id: AdventurePathId): AdventurePathPinResult {
    if (!ADVENTURE_PATH_BY_ID.has(id)) return 'missing';
    if (this.state.pinnedIds.includes(id)) {
      this.state = {
        ...this.state,
        pinnedIds: this.state.pinnedIds.filter((pathId) => pathId !== id),
        featuredId: this.state.featuredId === id ? null : this.state.featuredId,
      };
      this.persist();
      return 'unpinned';
    }
    if (this.state.pinnedIds.length >= ADVENTURE_PATH_PIN_MAX) return 'full';
    this.state = { ...this.state, pinnedIds: [...this.state.pinnedIds, id] };
    this.persist();
    return 'pinned';
  }

  toggleFeatured(id: AdventurePathId): AdventurePathFeatureResult {
    if (!ADVENTURE_PATH_BY_ID.has(id)) return 'missing';
    if (!this.state.pinnedIds.includes(id)) return 'unpinned';
    this.state = { ...this.state, featuredId: this.state.featuredId === id ? null : id };
    this.persist();
    return this.state.featuredId === id ? 'featured' : 'cleared';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}

const ratio = (quest: QuestView): number => quest.goal > 0 ? Math.min(quest.progress, quest.goal) / quest.goal : 0;

function rankFor(completed: number, total: number, progressPct: number): string {
  if (completed >= total) return '진로 명인';
  if (completed >= total - 1) return '생활 기록가';
  if (completed >= Math.ceil(total / 2)) return '골목 애호가';
  if (completed > 0) return '취향 탐색가';
  if (progressPct > 0) return '첫 발자국';
  return '새 지도';
}

export function adventurePathViews(quests: QuestView[]): AdventurePathView[] {
  const byId = new Map(quests.map((quest) => [quest.id, quest]));
  return ADVENTURE_PATHS.map((path) => {
    const steps = path.questIds.map((id) => byId.get(id)).filter((quest): quest is QuestView => !!quest);
    const completed = steps.filter((quest) => quest.done).length;
    const progressPct = steps.length
      ? Math.round((steps.reduce((sum, quest) => sum + ratio(quest), 0) / steps.length) * 100)
      : 0;
    return {
      ...path,
      steps,
      completed,
      total: steps.length,
      progressPct,
      rank: rankFor(completed, steps.length, progressPct),
      next: steps.find((quest) => quest.unlocked && !quest.done) ?? steps.find((quest) => !quest.done) ?? null,
      engaged: steps.some((quest) => quest.progress > 0),
    };
  });
}

/** 이미 손댄 진로와 완주가 가까운 진로를 우선하되, 어느 진로도 잠그거나 선택을 강요하지 않는다. */
export function recommendAdventurePaths(quests: QuestView[], limit = 3): AdventurePathView[] {
  if (limit <= 0) return [];
  return adventurePathViews(quests)
    .map((path, index) => ({ path, index }))
    .sort((a, b) => Number(b.path.engaged) - Number(a.path.engaged)
      || b.path.progressPct - a.path.progressPct
      || b.path.completed - a.path.completed
      || a.index - b.index)
    .slice(0, limit)
    .map(({ path }) => path);
}

/** 완주 기록을 퀘스트/배지 시스템이 읽을 수 있는 영구 지표로 변환한다. */
export function adventurePathMetrics(quests: QuestView[]): Record<string, number> {
  const paths = adventurePathViews(quests);
  return {
    adventure_paths_complete: paths.filter((path) => path.total > 0 && path.completed >= path.total).length,
    ...Object.fromEntries(paths.map((path) => [
      `adventure_path_${path.id}_complete`,
      path.total > 0 && path.completed >= path.total ? 1 : 0,
    ])),
  };
}
