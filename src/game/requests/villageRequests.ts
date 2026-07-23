import type { QuestState } from '../questProgress';
import {
  freshVillageRequestStoryState, normalizeVillageRequestStoryState, recommendedVillageRequestStory,
  villageRequestStoryProgress, villageRequestStoryViews, VILLAGE_REQUEST_STORY_BY_ID,
  type VillageRequestStoryId, type VillageRequestStoryProgress, type VillageRequestStoryState,
  type VillageRequestStoryView,
} from './villageRequestStories';

export type VillageRequestCategory = 'neighbor' | 'street' | 'companion' | 'style' | 'home' | 'craft' | 'water' | 'adventure';
export type VillageRequestStatus = 'available' | 'active' | 'paused';

export interface VillageRequestDef {
  id: string;
  code: string;
  category: VillageRequestCategory;
  title: string;
  description: string;
  metric: string;
  goal: number;
  location: string;
  requester: string;
  stamp: string;
  color: string;
}

export interface VillageRequestRecord {
  id: string;
  status: VillageRequestStatus;
  baseline: number;
  carry: number;
  repeats: number;
  acceptedAt: number;
  lastCompletedAt: number;
}

export interface VillageRequestState {
  version: 2;
  records: Record<string, VillageRequestRecord>;
  totalCompleted: number;
  stories: VillageRequestStoryState;
}

export interface VillageRequestView extends VillageRequestDef {
  status: VillageRequestStatus;
  progress: number;
  done: boolean;
  repeats: number;
  stamped: boolean;
}

export interface VillageRequestProgress {
  active: number;
  paused: number;
  uniqueStamps: number;
  totalStamps: number;
  categoryStamps: number;
  totalCategories: number;
  totalCompleted: number;
  reputation: number;
  rank: number;
  rankName: string;
  storyChapters: number;
  storyTotalChapters: number;
  storyRoutes: number;
  storyTotalRoutes: number;
  storyReady: number;
  storyClues: number;
  storyTotalClues: number;
  storyCompletedIds: VillageRequestStoryId[];
}

export type VillageRequestResult =
  | { ok: true; view: VillageRequestView }
  | { ok: false; reason: 'unknown' | 'full' | 'not-active' | 'not-done' };

export type VillageRequestStoryResult =
  | { ok: true; view: VillageRequestStoryView }
  | { ok: false; reason: 'unknown' | 'locked' | 'not-ready' };

export const VILLAGE_REQUEST_CATEGORY_LABEL: Record<VillageRequestCategory, string> = {
  neighbor: '이웃', street: '골목', companion: '동행', style: '스타일',
  home: '나의 집', craft: '손작업', water: '물정원', adventure: '모험',
};

const request = (
  id: string, code: string, category: VillageRequestCategory, title: string, description: string,
  metric: string, goal: number, location: string, requester: string, stamp: string, color: string,
): VillageRequestDef => ({ id, code, category, title, description, metric, goal, location, requester, stamp, color });

/** 8분야 × 3장. 기존 평생 지표의 증가분을 구독하므로 어느 월드에서도 같은 의뢰가 진행된다. */
export const VILLAGE_REQUESTS: readonly VillageRequestDef[] = [
  request('neighbor_hello', 'NB-01', 'neighbor', '세 번의 먼저 인사', '이름 있는 주민에게 세 번 다정하게 인사해 주세요.', 'resident_greet', 3, '마을 주민 이름표 근처', '골목 반상회', '인', '#87936f'),
  request('neighbor_reaction', 'NB-02', 'neighbor', '마음이 보이는 손짓', '이모트로 세 번 마음을 표현해 주세요.', 'q_emote', 3, '어디서나 · E', '몸짓 연구회', '손', '#9b8065'),
  request('neighbor_chat', 'NB-03', 'neighbor', '두 줄짜리 안부', '마을 채팅에 두 번 안부를 남겨 주세요.', 'chat_sent', 2, '하단 채팅 또는 Enter', '새벽 접속자 모임', '말', '#71878a'),

  request('street_cafe', 'ST-01', 'street', '모퉁이의 바쁜 한때', '카페 일을 한 번 도와 골목의 리듬을 맞춰 주세요.', 'q_cafe', 1, '카페 「모퉁이」', '모퉁이 주인', '잔', '#a97859'),
  request('street_busking', 'ST-02', 'street', '한 곡만 더', '버스킹을 한 번 성공해 조용한 골목을 깨워 주세요.', 'q_busking', 1, '메인 스트리트 버스킹 스팟', '골목 공연 기획단', '음', '#96705f'),
  request('street_photo', 'ST-03', 'street', '오늘의 네 장면', '지금의 모습을 네컷 사진 한 장으로 남겨 주세요.', 'photo_taken', 1, '네컷 작업실', '필름 수선소', '찰', '#7d8171'),

  request('companion_meal', 'CP-01', 'companion', '작은 그릇의 약속', '동행 펫에게 오늘의 먹이를 챙겨 주세요.', 'pet_feed', 1, '펫샵 「멍냥이네」', '멍냥이네', '밥', '#ae805f'),
  request('companion_play', 'CP-02', 'companion', '같이 노는 오후', '동행 펫과 한 번 신나게 놀아 주세요.', 'pet_play', 1, '펫샵 · 돌봄', '공놀이 동호회', '공', '#89976f'),
  request('companion_walk', 'CP-03', 'companion', '두 골목 나란히', '좋아하는 동행 펫과 산책을 두 번 다녀와 주세요.', 'pet_outings_total', 2, '동행 산책 수첩', '산책 기록가', '발', '#677d6d'),

  request('style_save', 'FS-01', 'style', '오늘의 나를 저장', '마음에 드는 캐릭터 모습을 한 번 저장해 주세요.', 'customize_save', 1, '캐릭터 아틀리에', '골목 스타일 편집부', '옷', '#a56f67'),
  request('style_theme', 'FS-02', 'style', '두 번의 테마 여행', '테마 코디를 두 번 입어 새로운 조합을 찾아 주세요.', 'fashion_preset', 2, '아틀리에 · 옷장', '빈티지 행거 클럽', '색', '#95707f'),
  request('style_lookbook', 'FS-03', 'style', '의뢰서 위의 한 벌', '골목 룩북에 코디 한 벌을 기록해 주세요.', 'lookbook_submissions', 1, '아틀리에 · 골목 룩북', '룩북 소모임', '별', '#8a756c'),

  request('home_place_small', 'HM-01', 'home', '세 번 옮긴 가구', '내 집에서 가구를 세 번 배치해 흐름을 다듬어 주세요.', 'q_place', 3, '내 집 꾸미기 모드', '공간 연구소', '집', '#8d775d'),
  request('home_reform', 'HM-02', 'home', '한 가구의 새 결', '가구 한 점의 마감과 색을 골라 새 모습으로 리폼해 주세요.', 'furniture_reform_saves', 1, '내 집 · 가구 리폼 공방', '살림 아주머니', '결', '#806b5c'),
  request('home_aquarium', 'HM-03', 'home', '물속 풍경 갈아입기', '물결 테라리움 구성을 한 번 새로 저장해 주세요.', 'aquarium_saves', 1, '내 집 · 물결 테라리움', '수조 큐레이터', '물', '#668083'),

  request('craft_tend', 'CR-01', 'craft', '화분에 건네는 두 손길', '옥상 화분을 두 번 돌봐 주세요.', 'garden_tend', 2, '옥상 씨앗 연구소', '씨앗 연구원', '싹', '#77845f'),
  request('craft_harvest', 'CR-02', 'craft', '잘 익은 한 번', '다 자란 식물을 한 번 수확해 주세요.', 'garden_harvest', 1, '옥상 씨앗 연구소', '계절 없는 정원사', '열', '#8f7f58'),
  request('craft_cook', 'CR-03', 'craft', '두 접시의 저녁', '정원 재료로 메뉴 두 접시를 완성해 주세요.', 'cooking_total', 2, '모퉁이 골목 주방', '저녁 식탁 모임', '접', '#a06f50'),

  request('water_short', 'WT-01', 'water', '세 번의 입질', '좋아하는 물가에서 생물을 세 번 만나 주세요.', 'fishing_total', 3, '세 물가 · 낚시 수첩', '빗물정원 조사단', '낚', '#52777b'),
  request('water_long', 'WT-02', 'water', '느린 물결 여섯 번', '서두르지 말고 낚시 기록을 여섯 번 더해 주세요.', 'fishing_total', 6, '세 물가 · 낚시 수첩', '달빛 수로 모임', '결', '#5e7180'),
  request('water_scene', 'WT-03', 'water', '작은 수조의 새 장면', '물결 테라리움 풍경을 한 번 바꿔 저장해 주세요.', 'aquarium_saves', 1, '물결 테라리움 작업실', '물가 기록 보관소', '조', '#6c8581'),

  request('adventure_forest', 'AD-01', 'adventure', '숲길의 마흔다섯 호흡', '경의선 숲길에서 누적 45초 머물러 주세요.', 'q_forest', 45, '경의선 숲길', '숲길 안전대', '숲', '#596f5d'),
  request('adventure_hunt', 'AD-02', 'adventure', '외곽 생태 순찰', '외곽숲 몬스터를 다섯 마리 정리해 주세요.', 'monster_kill', 5, '동쪽 외곽숲', '외곽 순찰대', '검', '#6f665a'),
  request('adventure_treasure', 'AD-03', 'adventure', '조각이 보물이 되는 날', '모은 조각으로 보물을 한 번 복원해 주세요.', 'treasure_crafted', 1, '보물 도감', '골목 고물상', '보', '#8e754b'),
] as const;

export const VILLAGE_REQUEST_BY_ID = new Map(VILLAGE_REQUESTS.map((item) => [item.id, item]));
export const VILLAGE_REQUEST_MAX_ACTIVE = 3;
export const VILLAGE_REQUEST_RANK_NAMES = ['새 손', '심부름꾼', '골목 도우미', '믿음직한 손', '동네 해결사', '의뢰 수첩가', '마을 조율사', '골목 명인', '홍대 해결사', '전설의 이웃'] as const;
export const VILLAGE_REQUEST_RANK_THRESHOLDS = [0, 20, 50, 90, 140, 205, 285, 380, 490, 620] as const;

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
const metricValue = (state: QuestState, metric: string): number => cleanCount(state.lifetimeCounts?.[metric]);

export function freshVillageRequestState(): VillageRequestState {
  return { version: 2, records: {}, totalCompleted: 0, stories: freshVillageRequestStoryState() };
}

export function normalizeVillageRequestState(raw: unknown): VillageRequestState {
  if (!raw || typeof raw !== 'object') return freshVillageRequestState();
  const value = raw as Partial<VillageRequestState>;
  const records: Record<string, VillageRequestRecord> = {};
  const input = value.records && typeof value.records === 'object' ? value.records as Record<string, unknown> : {};
  for (const [id, entry] of Object.entries(input)) {
    if (!VILLAGE_REQUEST_BY_ID.has(id) || !entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<VillageRequestRecord>;
    const status: VillageRequestStatus = candidate.status === 'active' || candidate.status === 'paused' ? candidate.status : 'available';
    records[id] = {
      id, status, baseline: cleanCount(candidate.baseline), carry: cleanCount(candidate.carry),
      repeats: cleanCount(candidate.repeats), acceptedAt: cleanCount(candidate.acceptedAt),
      lastCompletedAt: cleanCount(candidate.lastCompletedAt),
    };
  }
  const repeatTotal = Object.values(records).reduce((sum, record) => sum + record.repeats, 0);
  return {
    version: 2, records, totalCompleted: Math.max(cleanCount(value.totalCompleted), repeatTotal),
    stories: normalizeVillageRequestStoryState(value.stories),
  };
}

export function villageRequestView(state: VillageRequestState, quests: QuestState, def: VillageRequestDef): VillageRequestView {
  const record = state.records[def.id];
  const status = record?.status ?? 'available';
  const live = status === 'active' ? Math.max(0, metricValue(quests, def.metric) - (record?.baseline ?? 0)) : 0;
  const progress = Math.min(def.goal, (record?.carry ?? 0) + live);
  const repeats = record?.repeats ?? 0;
  return { ...def, status, progress, done: status === 'active' && progress >= def.goal, repeats, stamped: repeats > 0 };
}

export function villageRequestViews(state: VillageRequestState, quests: QuestState): VillageRequestView[] {
  return VILLAGE_REQUESTS.map((def) => villageRequestView(state, quests, def));
}

const EMPTY_QUEST_STATE: QuestState = { version: 2, day: '', counts: {}, lifetimeCounts: {}, claimed: [] };

export function villageRequestProgress(state: VillageRequestState, quests: QuestState = EMPTY_QUEST_STATE): VillageRequestProgress {
  const stamped = VILLAGE_REQUESTS.filter((def) => (state.records[def.id]?.repeats ?? 0) > 0);
  const stories = villageRequestStoryProgress(state.stories, quests);
  const reputation = state.totalCompleted * 5 + stamped.length * 10
    + stories.claimedChapters * 10 + stories.completedStories * 30;
  let rank = 1;
  for (let index = 0; index < VILLAGE_REQUEST_RANK_THRESHOLDS.length; index += 1) if (reputation >= VILLAGE_REQUEST_RANK_THRESHOLDS[index]!) rank = index + 1;
  return {
    active: Object.values(state.records).filter((record) => record.status === 'active').length,
    paused: Object.values(state.records).filter((record) => record.status === 'paused').length,
    uniqueStamps: stamped.length,
    totalStamps: VILLAGE_REQUESTS.length,
    categoryStamps: new Set(stamped.map((def) => def.category)).size,
    totalCategories: Object.keys(VILLAGE_REQUEST_CATEGORY_LABEL).length,
    totalCompleted: state.totalCompleted,
    reputation,
    rank,
    rankName: VILLAGE_REQUEST_RANK_NAMES[rank - 1]!,
    storyChapters: stories.claimedChapters,
    storyTotalChapters: stories.totalChapters,
    storyRoutes: stories.completedStories,
    storyTotalRoutes: stories.totalStories,
    storyReady: stories.readyChapters,
    storyClues: stories.completedClues,
    storyTotalClues: stories.totalClues,
    storyCompletedIds: stories.completedStoryIds,
  };
}

export class VillageRequestStore {
  private state: VillageRequestState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-village-requests-${userId}`;
    let raw: unknown = null;
    try { const stored = localStorage.getItem(this.key); if (stored) raw = JSON.parse(stored); } catch { /* session only */ }
    this.state = normalizeVillageRequestState(raw);
    this.persist();
  }

  get(): VillageRequestState { return this.state; }
  views(quests: QuestState): VillageRequestView[] { return villageRequestViews(this.state, quests); }
  progress(quests?: QuestState): VillageRequestProgress { return villageRequestProgress(this.state, quests); }
  storyViews(quests: QuestState): VillageRequestStoryView[] { return villageRequestStoryViews(this.state.stories, quests); }
  storyProgress(quests: QuestState): VillageRequestStoryProgress { return villageRequestStoryProgress(this.state.stories, quests); }
  recommendedStory(quests: QuestState): VillageRequestStoryView | null {
    return recommendedVillageRequestStory(this.state.stories, quests);
  }

  accept(id: string, quests: QuestState): VillageRequestResult {
    const def = VILLAGE_REQUEST_BY_ID.get(id);
    if (!def) return { ok: false, reason: 'unknown' };
    const current = this.state.records[id];
    if (current?.status === 'active') return { ok: true, view: villageRequestView(this.state, quests, def) };
    if (this.progress().active >= VILLAGE_REQUEST_MAX_ACTIVE) return { ok: false, reason: 'full' };
    this.state.records[id] = {
      id, status: 'active', baseline: metricValue(quests, def.metric), carry: current?.status === 'paused' ? current.carry : 0,
      repeats: current?.repeats ?? 0, acceptedAt: Date.now(), lastCompletedAt: current?.lastCompletedAt ?? 0,
    };
    this.persist();
    return { ok: true, view: villageRequestView(this.state, quests, def) };
  }

  pause(id: string, quests: QuestState): VillageRequestResult {
    const def = VILLAGE_REQUEST_BY_ID.get(id);
    const current = this.state.records[id];
    if (!def) return { ok: false, reason: 'unknown' };
    if (!current || current.status !== 'active') return { ok: false, reason: 'not-active' };
    const view = villageRequestView(this.state, quests, def);
    if (view.done) return { ok: false, reason: 'not-done' };
    current.carry = view.progress;
    current.baseline = metricValue(quests, def.metric);
    current.status = 'paused';
    this.persist();
    return { ok: true, view: villageRequestView(this.state, quests, def) };
  }

  claim(id: string, quests: QuestState, completedAt = Date.now()): VillageRequestResult {
    const def = VILLAGE_REQUEST_BY_ID.get(id);
    const current = this.state.records[id];
    if (!def) return { ok: false, reason: 'unknown' };
    if (!current || current.status !== 'active') return { ok: false, reason: 'not-active' };
    const view = villageRequestView(this.state, quests, def);
    if (!view.done) return { ok: false, reason: 'not-done' };
    current.status = 'available'; current.baseline = metricValue(quests, def.metric); current.carry = 0;
    current.repeats += 1; current.lastCompletedAt = cleanCount(completedAt);
    this.state.totalCompleted += 1;
    this.persist();
    return { ok: true, view: villageRequestView(this.state, quests, def) };
  }

  trackStory(id: VillageRequestStoryId | null): boolean {
    if (id !== null && !VILLAGE_REQUEST_STORY_BY_ID.has(id)) return false;
    if (this.state.stories.trackedStoryId === id) return false;
    this.state.stories.trackedStoryId = id;
    this.persist();
    return true;
  }

  claimStoryChapter(chapterId: string, quests: QuestState): VillageRequestStoryResult {
    const story = this.storyViews(quests).find((candidate) => candidate.chapters.some((item) => item.id === chapterId));
    const view = story?.chapters.find((item) => item.id === chapterId);
    if (!story || !view) return { ok: false, reason: 'unknown' };
    if (!view.unlocked) return { ok: false, reason: 'locked' };
    if (!view.ready) return { ok: false, reason: 'not-ready' };
    this.state.stories.claimedChapters.push(chapterId);
    if (story.claimed + 1 >= story.chapters.length && this.state.stories.trackedStoryId === story.id) {
      this.state.stories.trackedStoryId = null;
    }
    this.persist();
    return { ok: true, view: this.storyViews(quests).find((candidate) => candidate.id === story.id)! };
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
