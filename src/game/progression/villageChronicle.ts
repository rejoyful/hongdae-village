import type { QuestState } from '../questProgress';

const KEY = 'hv-village-chronicle-v1';

export type ChronicleMotifId = 'people' | 'place' | 'possibility';

export interface ChronicleRouteDef {
  id: string;
  mark: string;
  title: string;
  description: string;
  metric: string;
  goal: number;
  location: string;
}

export interface ChronicleReflectionDef {
  id: ChronicleMotifId;
  mark: string;
  title: string;
  line: string;
  keepsake: string;
}

export interface ChronicleChapterDef {
  id: string;
  chapter: number;
  code: string;
  mark: string;
  title: string;
  cast: string;
  premise: string;
  scene: string;
  palette: readonly [string, string, string, string];
  routes: readonly [ChronicleRouteDef, ChronicleRouteDef, ChronicleRouteDef];
  reflections: readonly [ChronicleReflectionDef, ChronicleReflectionDef, ChronicleReflectionDef];
}

export interface ChronicleRouteView extends ChronicleRouteDef {
  current: number;
  complete: boolean;
  selected: boolean;
}

export interface ChronicleChapterView extends Omit<ChronicleChapterDef, 'routes'> {
  routes: ChronicleRouteView[];
  status: 'locked' | 'active' | 'complete';
  selectedRouteId: string | null;
  reflection: ChronicleReflectionDef | null;
  featured: boolean;
}

export interface ChronicleProgress {
  pages: number;
  totalPages: number;
  routesChosen: number;
  motifs: number;
  featured: number;
}

export interface VillageChronicleState {
  version: 1;
  routes: Record<string, string>;
  reflections: Record<string, ChronicleMotifId>;
  featuredId: string | null;
}

const route = (id: string, mark: string, title: string, description: string, metric: string, goal: number, location: string): ChronicleRouteDef => (
  { id, mark, title, description, metric, goal, location }
);
const reflection = (id: ChronicleMotifId, mark: string, title: string, line: string, keepsake: string): ChronicleReflectionDef => (
  { id, mark, title, line, keepsake }
);

/** 기존 8장 여정을 메인 시나리오 장면으로 읽는 SSOT. 세 루트는 우열 없이 같은 장으로 합류한다. */
export const VILLAGE_CHRONICLE: readonly ChronicleChapterDef[] = [
  {
    id: 'arrival', chapter: 1, code: 'MAIN 01', mark: '문', title: '사라진 첫 안내판', cast: '박 기장 · 노을',
    premise: '비어 있던 역 앞 안내판에 새 이웃이 기억한 첫 골목을 다시 그립니다.',
    scene: '박 기장은 오래된 지도 틀을 닦았고, 노을은 빈 칸 하나를 당신 몫으로 남겨 두었다.', palette: ['#b78a69', '#d8c39a', '#718379', '#3f4242'],
    routes: [
      route('arrival_map', '지', '지도로 먼저 읽기', '길의 모양부터 익혀 안내판의 뼈대를 잡습니다.', 'open_map', 1, '하단 지도 · 골목 전체'),
      route('arrival_names', '이', '이름으로 기억하기', '주민의 이름을 첫 번째 이정표로 삼습니다.', 'resident_greet', 1, '이름표가 있는 마을 주민'),
      route('arrival_style', '옷', '오늘 모습으로 표시하기', '첫날의 코디를 안내판 한구석에 남깁니다.', 'customize_save', 1, '캐릭터 아틀리에'),
    ],
    reflections: [
      reflection('people', '이', '첫 이름을 남겼다', '지도에서 가장 오래 기억난 것은 길보다 먼저 인사한 얼굴이었다.', '첫 이름표 조각'),
      reflection('place', '길', '첫 골목을 남겼다', '낯선 골목은 한 번 돌아본 순간부터 돌아올 수 있는 장소가 되었다.', '첫 골목 지도핀'),
      reflection('possibility', '문', '빈칸을 남겼다', '안내판의 마지막 한 칸은 아직 모르는 내일을 위해 비워 두었다.', '빈칸 안내 스티커'),
    ],
  },
  {
    id: 'belonging', chapter: 2, code: 'MAIN 02', mark: '집', title: '돌아올 불빛 한 칸', cast: '살림 아주머니 · 멍냥이네',
    premise: '집, 동행, 사진 중 마음 가는 방법으로 “내 자리”의 증거를 만듭니다.',
    scene: '살림 아주머니는 좋은 집이란 비싼 방이 아니라 돌아오는 방향을 아는 방이라고 말했다.', palette: ['#9a775d', '#e1c99d', '#7f9279', '#4d413a'],
    routes: [
      route('belonging_home', '집', '방에 불을 켜기', '작은 가구 한 점으로 돌아올 자리를 만듭니다.', 'visit_home', 1, '주택가 · 나의 집'),
      route('belonging_pet', '발', '동행과 자리 찾기', '작은 친구가 먼저 고른 자리를 따라가 봅니다.', 'pet_adopt', 1, '펫샵 「멍냥이네」'),
      route('belonging_photo', '찰', '첫날을 사진으로 묶기', '오늘의 모습을 네 귀퉁이 안에 보존합니다.', 'photo_taken', 1, '네컷 작업실'),
    ],
    reflections: [
      reflection('people', '곁', '함께 돌아올 사람', '불빛은 혼자 켰지만 문을 열 때 떠오른 얼굴은 하나가 아니었다.', '나란한 열쇠표'),
      reflection('place', '집', '내가 고른 자리', '작은 방 한 칸이 처음으로 지도보다 정확한 주소가 되었다.', '첫 방 모서리표'),
      reflection('possibility', '빛', '다음 불빛을 위한 창', '비어 있는 창가에는 앞으로 들일 생활 하나를 남겨 두었다.', '창가 빛 조각'),
    ],
  },
  {
    id: 'handmade', chapter: 3, code: 'MAIN 03', mark: '손', title: '손끝에서 시작된 골목', cast: '살림 아주머니 · 동수 할아버지',
    premise: '심고, 고치고, 함께 걸으며 소비하지 않아도 생기는 하루를 발견합니다.',
    scene: '버려질 뻔한 조각과 이름 없는 씨앗, 느린 발자국이 한 작업대 위에서 같은 재료가 되었다.', palette: ['#7f865f', '#d6c28d', '#a4775e', '#45483e'],
    routes: [
      route('handmade_seed', '싹', '살아 있는 것을 돌보기', '씨앗의 작은 변화를 하루의 시계로 삼습니다.', 'garden_planted', 1, '옥상 씨앗 연구소'),
      route('handmade_reform', '결', '낡은 것을 다시 고르기', '가구의 표면을 고쳐 이전과 다른 쓰임을 만듭니다.', 'furniture_reform_saves', 1, '내 집 · 가구 리폼 공방'),
      route('handmade_walk', '발', '같이 걷는 속도 배우기', '동행의 걸음으로 익숙한 골목을 다시 읽습니다.', 'pet_outings_total', 1, '펫샵 · 동행 산책 수첩'),
    ],
    reflections: [
      reflection('people', '손', '건네받은 손길', '완성품보다 누가 옆에서 한 번 더 잡아 주었는지가 오래 남았다.', '함께 쥔 작업 끈'),
      reflection('place', '결', '골목의 재료', '바닥의 조각과 옥상의 흙까지 이곳의 표정이라는 걸 알게 되었다.', '골목 재료 견본'),
      reflection('possibility', '싹', '다시 쓸 다음 방법', '완성이라 부르지 않고 다음에 고쳐 쓸 여백을 남겼다.', '미완성 설계 꼬리표'),
    ],
  },
  {
    id: 'neighbors', chapter: 4, code: 'MAIN 04', mark: '이', title: '열 사람의 다른 저녁', cast: '하늘 · 모퉁이 씨 · 골목 주민들',
    premise: '인사, 일, 무대 중 편한 방식으로 이름이 오가는 저녁을 엽니다.',
    scene: '같은 시간 골목에 있던 열 사람은 모두 다른 하루를 보냈지만 한 테이블에 빈 의자를 남겼다.', palette: ['#788692', '#d4be93', '#aa6e64', '#403e47'],
    routes: [
      route('neighbors_greet', '안', '이름을 천천히 모으기', '짧은 인사를 반복해 낯선 얼굴을 이웃으로 바꿉니다.', 'residents_met', 5, '주민 수첩 · 인연 지도'),
      route('neighbors_work', '잔', '한 시간의 일을 나누기', '카페의 바쁜 손을 도우며 저녁 이야기를 듣습니다.', 'q_cafe', 1, '카페 「모퉁이」'),
      route('neighbors_stage', '음', '골목에 들리는 마음', '말 대신 한 곡으로 같은 자리에 사람을 모읍니다.', 'q_busking', 1, '메인 스트리트 버스킹 스팟'),
    ],
    reflections: [
      reflection('people', '이', '열 이름의 자리', '빈 의자는 마지막에 온 사람의 이름을 기다리며 계속 비워 두었다.', '열 이름 좌석표'),
      reflection('place', '잔', '저녁이 모인 모퉁이', '한 테이블의 작은 흠집들이 서로 다른 하루를 이어 주었다.', '모퉁이 테이블 조각'),
      reflection('possibility', '음', '아직 부르지 않은 곡', '앙코르 목록 끝에 다음 이웃과 부를 제목 없는 한 곡을 적었다.', '무제 앙코르 표'),
    ],
  },
  {
    id: 'collector', chapter: 5, code: 'MAIN 05', mark: '장', title: '아무도 버리지 않은 작은 것', cast: '초코 · 노을 · 작은 박물관',
    premise: '물건, 코디, 동행의 몸짓 중 하나에서 수집의 이유를 찾습니다.',
    scene: '작은 박물관의 빈 진열대는 값비싼 보물보다 사연을 기억하는 물건을 기다리고 있었다.', palette: ['#a37b5c', '#ddc59b', '#857496', '#4b4147'],
    routes: [
      route('collector_objects', '장', '생활 물건의 사연', '발견한 물건의 쓰임과 골목을 함께 기록합니다.', 'items_discovered', 10, '가이드북 · 생활 물건 도감'),
      route('collector_looks', '옷', '입었던 기분의 사연', '코디를 결과가 아니라 그날의 표정으로 모읍니다.', 'lookbook_entries', 2, '아틀리에 · 골목 룩북'),
      route('collector_signals', '발', '작은 몸짓의 사연', '동행의 말 없는 신호에 둘만의 뜻을 붙입니다.', 'pet_signals', 4, '펫샵 · 마음 번역 수첩'),
    ],
    reflections: [
      reflection('people', '사', '누가 건넸는지', '물건의 이름 옆에는 그것을 건넨 사람의 손을 먼저 적었다.', '건넨 이의 명패'),
      reflection('place', '장', '어디서 만났는지', '흠집 하나마다 지나온 골목의 좌표를 조그맣게 새겼다.', '골목 좌표 라벨'),
      reflection('possibility', '빈', '다음 진열 한 칸', '가장 좋은 자리는 아직 만나지 못한 작은 것을 위해 남겨 두었다.', '빈 진열대 열쇠'),
    ],
  },
  {
    id: 'specialist', chapter: 6, code: 'MAIN 06', mark: '숙', title: '네 가지로 불리는 사람', cast: '마을 생활 길드',
    premise: '한 직업으로 고정되지 않고 서로 다른 전문 생활을 자기 조합으로 엮습니다.',
    scene: '길드의 오래된 등록표에는 직업 칸이 하나뿐이었고, 당신은 그 옆에 세 칸을 더 그었다.', palette: ['#6e7f76', '#d8c69f', '#9d7459', '#414944'],
    routes: [
      route('specialist_home', '집', '공간과 돌봄의 조합', '집과 동행을 함께 깊게 익혀 머무는 장면을 만듭니다.', 'mastery_home_level', 5, '모험 일지 · 생활 숙련'),
      route('specialist_craft', '손', '재료와 접시의 조합', '정원과 요리를 이어 손끝의 순환을 배웁니다.', 'mastery_gardener_level', 5, '모험 일지 · 생활 숙련'),
      route('specialist_wander', '길', '탐험과 관계의 조합', '발견한 길을 사람의 이야기와 연결합니다.', 'mastery_exploration_level', 5, '모험 일지 · 생활 숙련'),
    ],
    reflections: [
      reflection('people', '길', '함께 불러 준 이름', '전문가는 혼자 정한 직함보다 이웃이 믿고 불러 준 이름에 가까웠다.', '생활 길드 호칭표'),
      reflection('place', '숙', '손에 익은 네 자리', '서로 다른 네 장소가 어느새 몸이 먼저 길을 아는 작업실이 되었다.', '네 갈래 작업 지도'),
      reflection('possibility', '더', '다섯 번째 취미 칸', '등록표 끝에는 잘하지 않아도 시작할 수 있는 새 칸을 더 그었다.', '새 취미 등록표'),
    ],
  },
  {
    id: 'chronicle', chapter: 7, code: 'MAIN 07', mark: '록', title: '사라지기 전에 적는 이름', cast: '동수 할아버지 · 마을 편집실',
    premise: '편지, 축제, 박물관 중 하나를 통해 변하는 골목의 장면을 보존합니다.',
    scene: '동수 할아버지는 기억은 붙잡는 일이 아니라 다음 사람이 다시 찾을 수 있게 표시하는 일이라고 했다.', palette: ['#687b70', '#d4c39d', '#82718c', '#3d4443'],
    routes: [
      route('chronicle_letters', '편', '사람의 문장 보존하기', '주민이 직접 고른 말투와 망설임을 편지로 남깁니다.', 'resident_letters', 5, '주민 수첩 · 골목 편지함'),
      route('chronicle_festival', '축', '함께 만든 하루 보존하기', '기간이 지나도 사라지지 않는 축제 엽서를 엮습니다.', 'festival_postcards', 4, '모험 일지 · 축제 아카이브'),
      route('chronicle_museum', '관', '작은 물건 보존하기', '생활 물건의 이름과 사연을 전시실에 보존합니다.', 'neighborhood_museum_exhibits', 8, '작은 박물관 · 네 전시관'),
    ],
    reflections: [
      reflection('people', '명', '사람의 이름부터', '장소가 변해도 그곳을 좋아한 사람의 이름은 먼저 읽을 수 있게 썼다.', '골목 인명 색인'),
      reflection('place', '록', '장소의 결부터', '새 건물 아래에도 이전 골목의 선 하나는 겹쳐 보이도록 남겼다.', '겹쳐 보는 옛 지도'),
      reflection('possibility', '후', '다음 편집자에게', '마지막 페이지는 완결 대신 다음 사람이 쓸 수 있는 질문으로 끝냈다.', '다음 편집자 쪽지'),
    ],
  },
  {
    id: 'legend', chapter: 8, code: 'MAIN 08', mark: '별', title: '전설 대신 남은 생활', cast: '홍대마을의 모든 이웃',
    premise: '최고가 되는 한 방법 대신 오래 좋아한 여러 생활을 마지막 광장에 펼칩니다.',
    scene: '광장에는 우승대도 순위표도 없었다. 대신 당신이 오래 머문 자리마다 작은 등이 하나씩 켜졌다.', palette: ['#4d5870', '#d8bd79', '#8c687e', '#343944'],
    routes: [
      route('legend_level', '별', '마을의 긴 여정', '모든 생활에서 쌓인 경험으로 자신의 속도를 증명합니다.', 'village_level', 50, '모험 일지 · 50레벨 골목 여권'),
      route('legend_mastery', '숙', '생활의 넓은 여정', '서로 다른 생활 숙련을 한 권의 백과사전으로 엮습니다.', 'mastery_total_level', 45, '모험 일지 · 생활 숙련'),
      route('legend_archive', '장', '기억의 깊은 여정', '수집과 관계의 대표 기록을 오래 남깁니다.', 'journey_chapters', 8, '모험 일지 · 마을 여정'),
    ],
    reflections: [
      reflection('people', '함', '함께였기에 전설', '가장 빛난 장면마다 화면 밖에서 이름을 불러 준 이웃이 있었다.', '함께 만든 별자리'),
      reflection('place', '마', '마을 자체가 전설', '모든 골목은 누군가 오래 좋아한 순간부터 특별한 장소가 되었다.', '홍대마을 황금 지도'),
      reflection('possibility', '다', '다음 생활이 전설', '마지막 등 옆에는 내일 새로 시작할 취미를 위한 성냥을 두었다.', '다음 페이지 성냥갑'),
    ],
  },
] as const;

const chapterById = new Map(VILLAGE_CHRONICLE.map((chapter) => [chapter.id, chapter]));
const motifIds = new Set<string>(['people', 'place', 'possibility']);
const cleanCount = (state: QuestState, key: string): number => Math.max(0, Math.floor(state.lifetimeCounts?.[key] ?? 0));

export function normalizeVillageChronicleState(raw: unknown): VillageChronicleState {
  if (!raw || typeof raw !== 'object') return { version: 1, routes: {}, reflections: {}, featuredId: null };
  const value = raw as Partial<VillageChronicleState>;
  const routes: Record<string, string> = {};
  if (value.routes && typeof value.routes === 'object') for (const [chapterId, routeId] of Object.entries(value.routes)) {
    const chapter = chapterById.get(chapterId);
    if (chapter?.routes.some((item) => item.id === routeId)) routes[chapterId] = routeId;
  }
  const reflections: Record<string, ChronicleMotifId> = {};
  if (value.reflections && typeof value.reflections === 'object') for (const [chapterId, motif] of Object.entries(value.reflections)) {
    if (chapterById.has(chapterId) && motifIds.has(String(motif))) reflections[chapterId] = motif as ChronicleMotifId;
  }
  const featuredId = typeof value.featuredId === 'string' && reflections[value.featuredId] ? value.featuredId : null;
  return { version: 1, routes, reflections, featuredId };
}

export function villageChronicleViews(
  state: VillageChronicleState,
  questState: QuestState,
  completedJourneyChapters: number,
): ChronicleChapterView[] {
  return VILLAGE_CHRONICLE.map((chapter) => {
    const status: ChronicleChapterView['status'] = chapter.chapter <= completedJourneyChapters
      ? 'complete' : chapter.chapter === completedJourneyChapters + 1 ? 'active' : 'locked';
    const selectedRouteId = state.routes[chapter.id] ?? null;
    const motif = state.reflections[chapter.id] ?? null;
    return {
      ...chapter,
      status,
      selectedRouteId,
      routes: chapter.routes.map((item) => {
        const current = cleanCount(questState, item.metric);
        return { ...item, current, complete: current >= item.goal, selected: selectedRouteId === item.id };
      }),
      reflection: motif ? chapter.reflections.find((item) => item.id === motif) ?? null : null,
      featured: state.featuredId === chapter.id,
    };
  });
}

export function villageChronicleProgress(state: VillageChronicleState): ChronicleProgress {
  const pages = Object.keys(state.reflections).filter((id) => chapterById.has(id)).length;
  return {
    pages,
    totalPages: VILLAGE_CHRONICLE.length,
    routesChosen: Object.keys(state.routes).filter((id) => chapterById.has(id)).length,
    motifs: new Set(Object.values(state.reflections)).size,
    featured: state.featuredId ? 1 : 0,
  };
}

export class VillageChronicleStore {
  private state: VillageChronicleState;

  constructor(private readonly userId: string) {
    try { this.state = normalizeVillageChronicleState(JSON.parse(localStorage.getItem(`${KEY}:${userId}`) ?? 'null')); }
    catch { this.state = normalizeVillageChronicleState(null); }
  }

  get(): VillageChronicleState { return { ...this.state, routes: { ...this.state.routes }, reflections: { ...this.state.reflections } }; }
  progress(): ChronicleProgress { return villageChronicleProgress(this.state); }

  private save(): void {
    try { localStorage.setItem(`${KEY}:${this.userId}`, JSON.stringify(this.state)); } catch { /* 로컬 저장 실패가 플레이를 막지 않는다. */ }
  }

  chooseRoute(chapterId: string, routeId: string, completedJourneyChapters: number): boolean {
    const chapter = chapterById.get(chapterId);
    if (!chapter || chapter.chapter > completedJourneyChapters + 1 || !chapter.routes.some((item) => item.id === routeId)) return false;
    if (this.state.routes[chapterId] === routeId) return false;
    this.state.routes[chapterId] = routeId; this.save(); return true;
  }

  reflect(chapterId: string, motif: ChronicleMotifId, completedJourneyChapters: number): boolean {
    const chapter = chapterById.get(chapterId);
    if (!chapter || chapter.chapter > completedJourneyChapters || !chapter.reflections.some((item) => item.id === motif)) return false;
    if (this.state.reflections[chapterId] === motif) return false;
    this.state.reflections[chapterId] = motif; this.save(); return true;
  }

  feature(chapterId: string): boolean {
    if (!this.state.reflections[chapterId]) return false;
    this.state.featuredId = this.state.featuredId === chapterId ? null : chapterId;
    this.save(); return true;
  }
}
