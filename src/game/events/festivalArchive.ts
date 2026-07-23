import type { QuestState } from '../questProgress';

export type FestivalId =
  | 'lantern_encore'
  | 'rain_postcard'
  | 'rooftop_table'
  | 'pet_parade'
  | 'open_house'
  | 'style_week'
  | 'collector_market'
  | 'forest_observatory';

export interface FestivalObjective {
  key: string;
  mark: string;
  label: string;
  location: string;
  goal: number;
}

export interface FestivalDef {
  id: FestivalId;
  code: string;
  mark: string;
  name: string;
  subtitle: string;
  host: string;
  description: string;
  color: string;
  sky: string;
  postcard: string;
  keepsake: string;
  required: number;
  objectives: readonly [FestivalObjective, FestivalObjective, FestivalObjective, FestivalObjective];
}

export interface FestivalObjectiveView extends FestivalObjective {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface FestivalView extends Omit<FestivalDef, 'objectives'> {
  objectives: FestivalObjectiveView[];
  completed: number;
  ready: boolean;
  claimed: boolean;
  spotlight: boolean;
  tracked: boolean;
  featured: boolean;
  progressPct: number;
  next: FestivalObjectiveView | null;
}

export interface FestivalArchiveState {
  version: 1;
  claimedIds: FestivalId[];
  trackedId?: FestivalId;
  featuredId?: FestivalId;
}

export interface FestivalArchiveProgress {
  postcards: number;
  totalPostcards: number;
  clues: number;
  totalClues: number;
  ready: number;
  spotlightId: FestivalId;
  trackedId: FestivalId | null;
  featuredId: FestivalId | null;
}

const objective = (key: string, mark: string, label: string, location: string, goal: number): FestivalObjective => ({
  key, mark, label, location, goal,
});

/**
 * 8개 축제는 언제나 열려 있고 네 활동 중 세 개만 완료하면 된다.
 * 주간 스포트라이트는 연출 추천일 뿐 독점 보상과 종료일은 없다.
 */
export const FESTIVALS: readonly FestivalDef[] = [
  {
    id: 'lantern_encore', code: 'LANTERN', mark: '불', name: '심야 등불 앙콜', subtitle: '노래와 인사가 불빛으로 남는 밤',
    host: '레코드 골목 뮤지션 모임', description: '버스킹, 네컷, 이모트와 주민 인사 중 세 장면을 등불 엽서에 담아요.',
    color: '#b96f58', sky: '#30263d', postcard: '심야 앙콜 엽서', keepsake: '작은 홍색 등불 키태그', required: 3,
    objectives: [
      objective('q_busking', '음', '버스킹 3번 완주', '메인 스트리트 무대', 3),
      objective('photo_taken', '찰', '네컷 사진 한 장', '네컷 작업실', 1),
      objective('q_emote', '손', '이모트 5번 보내기', '어디서나 · E', 5),
      objective('resident_greet', '안', '주민과 3번 인사', '이름표가 있는 주민 곁', 3),
    ],
  },
  {
    id: 'rain_postcard', code: 'RIPPLE', mark: '비', name: '비 갠 물결 엽서전', subtitle: '빗방울 뒤에만 보이는 작은 생태',
    host: '빗물정원 조사단', description: '낚시, 식물 표본, 수조와 소풍 중 세 가지 물결 기록을 모아요.',
    color: '#5e8793', sky: '#354655', postcard: '비 갠 물결 엽서', keepsake: '물방울 유리 핀', required: 3,
    objectives: [
      objective('fishing_total', '물', '물가 생물 3번 만나기', '세 물가 · 낚시 수첩', 3),
      objective('garden_specimens', '잎', '식물 성장 결 3종 기록', '옥상 씨앗 연구소', 3),
      objective('aquarium_saves', '수', '물결 테라리움 저장', '내 집 · 물결 작업실', 1),
      objective('neighborhood_tour_postcards', '길', '골목 소풍 엽서 한 장', '골목 소풍 안내소', 1),
    ],
  },
  {
    id: 'rooftop_table', code: 'HARVEST', mark: '잎', name: '옥상 한 접시 장터', subtitle: '심은 것이 저녁 한 접시가 되는 날',
    host: '모퉁이 주방과 옥상 정원사', description: '수확, 요리, 사진과 숲길 산책으로 작은 피크닉 식탁을 차려요.',
    color: '#90905b', sky: '#76634d', postcard: '옥상 저녁 식탁 엽서', keepsake: '리넨 냅킨 표식', required: 3,
    objectives: [
      objective('garden_harvest', '싹', '식물 3번 수확', '옥상 씨앗 연구소', 3),
      objective('cooking_recipes', '접', '서로 다른 메뉴 2종 완성', '모퉁이 골목 주방', 2),
      objective('photo_taken', '찰', '피크닉 기념 네컷', '네컷 작업실', 1),
      objective('q_forest', '숲', '숲길 60초 산책', '경의선 숲길', 60),
    ],
  },
  {
    id: 'pet_parade', code: 'PAWS', mark: '발', name: '세 발자국 산책 퍼레이드', subtitle: '빠리 걷지 않아도 함께라서 좋은 길',
    host: '멍냥이네 동행 모임', description: '입양, 놀이, 단장과 산책 중 세 장면을 함께 남겨요.',
    color: '#7c916a', sky: '#736e59', postcard: '나란히 걸은 날 엽서', keepsake: '세 발자국 목걸이표', required: 3,
    objectives: [
      objective('pet_adopt', '가', '동행 친구 입양', '펫샵 「멍냥이네」', 1),
      objective('pet_play', '놀', '함께 놀기 3번', '펫샵 · 돌봄', 3),
      objective('pet_accessory_equip', '옷', '펫 액세서리 착용', '펫샵 · 액세서리 도감', 1),
      objective('pet_outings_total', '길', '동행 산책 한 번', '동행 산책 수첩', 1),
    ],
  },
  {
    id: 'open_house', code: 'OPENHOME', mark: '집', name: '열두 창문 집들이', subtitle: '서로 다른 방이 하루 동안 열리는 날',
    host: '주택가 사랑방 모임', description: '홈 점수, 분류, 집들이와 리폼 중 세 가지로 나만의 방을 소개해요.',
    color: '#a5795d', sky: '#675345', postcard: '열두 창문 엽서', keepsake: '작은 집들이 열쇠', required: 3,
    objectives: [
      objective('home_score', '점', '홈 스타일 30점', '내 집 · 홈 스타일 카드', 30),
      objective('home_categories', '분', '가구 분류 4종 배치', '내 집 · 꾸미기', 4),
      objective('home_visits', '문', '주민 집들이 추억', '내 집 · 방문 앨범', 1),
      objective('furniture_reform_saves', '결', '가구 리폼 한 번', '내 집 · 리폼 공방', 1),
    ],
  },
  {
    id: 'style_week', code: 'LOOK', mark: '옷', name: '골목 스타일 주간', subtitle: '같은 사람이 여러 모습으로 나란히 서는 전시',
    host: '아틀리에 스타일 편집부', description: '커스터마이징, 옷장, 룩북과 프레임 중 세 장면으로 오늘의 나를 편집해요.',
    color: '#aa7188', sky: '#443344', postcard: '골목 화보 엽서', keepsake: '시그니처 원단 스와치', required: 3,
    objectives: [
      objective('customize_save', '입', '모습 3번 저장', '캐릭터 아틀리에', 3),
      objective('closet_save', '장', '코디 2벌 옷장 보관', '아틀리에 · 픽셀 옷장', 2),
      objective('lookbook_submissions', '북', '룩북 코디 기록', '아틀리에 · 골목 룩북', 1),
      objective('photo_frames', '틀', '네컷 프레임 2종 사용', '네컷 작업실', 2),
    ],
  },
  {
    id: 'collector_market', code: 'MARKET', mark: '장', name: '편집샵 소장품 장터', subtitle: '물건의 값보다 처음 만난 사연을 나누는 장터',
    host: '골목 박물관 자원봉사단', description: '발견, DIY, 의뢰와 보물 중 세 가지 수집 이야기를 장터 엽서에 남겨요.',
    color: '#a5784d', sky: '#554334', postcard: '편집샵 장터 엽서', keepsake: '동판 가격표 배지', required: 3,
    objectives: [
      objective('items_discovered', '발', '생활 물건 10종 발견', '가이드북 · 살림 도감', 10),
      objective('furniture_craft_total', '만', 'DIY 가구 한 점 제작', '살림 가구 · DIY 작업대', 1),
      objective('village_requests_total', '의', '골목 의뢰 2건 해결', '모험 일지 · 의뢰소', 2),
      objective('treasure_crafted', '보', '보물 한 점 제작', '보물 도감', 1),
    ],
  },
  {
    id: 'forest_observatory', code: 'FIELD', mark: '숲', name: '외곽숲 별빛 관찰회', subtitle: '처치 수보다 발견한 이름을 더 오래 남기는 밤',
    host: '외곽 생태 연구반', description: '발견, 연구, 반짝임과 박물관 중 세 가지 관찰 기록을 모아요.',
    color: '#657e74', sky: '#252d3e', postcard: '외곽숲 별빛 엽서', keepsake: '작은 생태 관찰경', required: 3,
    objectives: [
      objective('monster_species', '발', '외곽 생태 5종 발견', '가이드북 · 몬스터 연구', 5),
      objective('monster_research_stamps', '연', '생태 연구 도장 3개', '가이드북 · 현장 수첩', 3),
      objective('sparkle_collect', '빛', '숨은 반짝임 5번 발견', '마을 골목과 숲길', 5),
      objective('neighborhood_museum_exhibits', '박', '박물관 기념품 한 점', '골목 작은 박물관', 1),
    ],
  },
] as const;

const FESTIVAL_ID_SET = new Set<FestivalId>(FESTIVALS.map((festival) => festival.id));
const cleanId = (value: unknown): FestivalId | null => typeof value === 'string' && FESTIVAL_ID_SET.has(value as FestivalId) ? value as FestivalId : null;
const metric = (state: QuestState, key: string): number => Math.max(0, Math.floor(state.lifetimeCounts?.[key] ?? 0));

export function normalizeFestivalArchiveState(raw: unknown): FestivalArchiveState {
  const source = (raw ?? {}) as Partial<FestivalArchiveState>;
  const claimedIds = Array.isArray(source.claimedIds)
    ? [...new Set(source.claimedIds.map(cleanId).filter((id): id is FestivalId => !!id))]
    : [];
  const trackedId = cleanId(source.trackedId);
  const featured = cleanId(source.featuredId);
  const featuredId = featured && claimedIds.includes(featured) ? featured : undefined;
  return {
    version: 1,
    claimedIds,
    ...(trackedId ? { trackedId } : {}),
    ...(featuredId ? { featuredId } : {}),
  };
}

export function festivalWeekIndex(date = new Date()): number {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const seoulDay = Date.UTC(parts.year!, parts.month! - 1, parts.day!);
  // 1970-01-05(월)을 0으로 삼아 한국 시간 월요일 00:00에 조명을 교체한다.
  return Math.floor((seoulDay - Date.UTC(1970, 0, 5)) / 604_800_000);
}

export function festivalSpotlight(date = new Date()): FestivalDef {
  return FESTIVALS[((festivalWeekIndex(date) % FESTIVALS.length) + FESTIVALS.length) % FESTIVALS.length]!;
}

export function festivalArchiveViews(
  quests: QuestState,
  archive: FestivalArchiveState,
  date = new Date(),
): FestivalView[] {
  const spotlightId = festivalSpotlight(date).id;
  return FESTIVALS.map((festival) => {
    const objectives = festival.objectives.map((item) => {
      const current = metric(quests, item.key);
      return { ...item, current, complete: current >= item.goal, progressPct: Math.round((Math.min(current, item.goal) / item.goal) * 100) };
    });
    const completed = objectives.filter((item) => item.complete).length;
    return {
      ...festival,
      objectives,
      completed,
      ready: completed >= festival.required,
      claimed: archive.claimedIds.includes(festival.id),
      spotlight: festival.id === spotlightId,
      tracked: archive.trackedId === festival.id,
      featured: archive.featuredId === festival.id,
      progressPct: Math.round((Math.min(completed, festival.required) / festival.required) * 100),
      next: objectives.find((item) => !item.complete) ?? null,
    };
  });
}

export class FestivalArchiveStore {
  private state: FestivalArchiveState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-festival-archive-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeFestivalArchiveState(raw);
    this.persist();
  }

  get(): FestivalArchiveState { return structuredClone(this.state); }
  views(quests: QuestState, date = new Date()): FestivalView[] { return festivalArchiveViews(quests, this.state, date); }

  claim(id: string, quests: QuestState, date = new Date()): { ok: true; view: FestivalView } | { ok: false; reason: 'missing' | 'not-ready' | 'claimed' } {
    const view = this.views(quests, date).find((item) => item.id === id);
    if (!view) return { ok: false, reason: 'missing' };
    if (view.claimed) return { ok: false, reason: 'claimed' };
    if (!view.ready) return { ok: false, reason: 'not-ready' };
    this.state = { ...this.state, claimedIds: [...this.state.claimedIds, view.id] };
    this.persist();
    return { ok: true, view: this.views(quests, date).find((item) => item.id === view.id)! };
  }

  track(id: FestivalId | null): boolean {
    if (id !== null && !FESTIVAL_ID_SET.has(id)) return false;
    this.state = { ...this.state, ...(id ? { trackedId: id } : {}) };
    if (!id) delete this.state.trackedId;
    this.persist();
    return true;
  }

  feature(id: FestivalId | null): boolean {
    if (id !== null && !this.state.claimedIds.includes(id)) return false;
    this.state = { ...this.state, ...(id ? { featuredId: id } : {}) };
    if (!id) delete this.state.featuredId;
    this.persist();
    return true;
  }

  progress(quests: QuestState, date = new Date()): FestivalArchiveProgress {
    const views = this.views(quests, date);
    return {
      postcards: views.filter((view) => view.claimed).length,
      totalPostcards: views.length,
      clues: views.reduce((sum, view) => sum + view.completed, 0),
      totalClues: views.reduce((sum, view) => sum + view.objectives.length, 0),
      ready: views.filter((view) => view.ready && !view.claimed).length,
      spotlightId: views.find((view) => view.spotlight)!.id,
      trackedId: this.state.trackedId ?? null,
      featuredId: this.state.featuredId ?? null,
    };
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* session only */ }
  }
}
