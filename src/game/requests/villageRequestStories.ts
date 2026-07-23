import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from '../world/isometricVillageMap';
import type { VillageRequestCategory } from './villageRequests';

export type VillageRequestStoryId =
  | 'returned_umbrella'
  | 'last_encore'
  | 'paw_letter'
  | 'alley_issue'
  | 'one_room_table'
  | 'rooftop_supper'
  | 'rain_map'
  | 'forest_lantern';

export type VillageRequestDestination = IsoActivityKind | 'residents' | 'profile' | 'treasure' | 'adventure-kit' | 'hunt' | 'chat' | 'emote' | 'map' | 'search' | 'secrets';

export interface VillageRequestStoryRequirement {
  key: string;
  goal: number;
  label: string;
  location: string;
  destination: VillageRequestDestination;
}

export interface VillageRequestStoryChapter {
  id: string;
  act: 1 | 2 | 3;
  title: string;
  summary: string;
  letter: string;
  keepsake: string;
  requirements: readonly VillageRequestStoryRequirement[];
}

export interface VillageRequestStoryDef {
  id: VillageRequestStoryId;
  code: string;
  category: VillageRequestCategory;
  mark: string;
  title: string;
  patron: string;
  synopsis: string;
  color: string;
  chapters: readonly [VillageRequestStoryChapter, VillageRequestStoryChapter, VillageRequestStoryChapter];
}

export interface VillageRequestStoryState {
  version: 1;
  claimedChapters: string[];
  trackedStoryId: VillageRequestStoryId | null;
}

export interface VillageRequestStoryRequirementView extends VillageRequestStoryRequirement {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface VillageRequestStoryChapterView extends Omit<VillageRequestStoryChapter, 'requirements'> {
  requirements: VillageRequestStoryRequirementView[];
  claimed: boolean;
  unlocked: boolean;
  ready: boolean;
  progressPct: number;
}

export interface VillageRequestStoryView extends Omit<VillageRequestStoryDef, 'chapters'> {
  chapters: VillageRequestStoryChapterView[];
  claimed: number;
  ready: number;
  complete: boolean;
  tracked: boolean;
  nextChapter: VillageRequestStoryChapterView | null;
  progressPct: number;
}

export interface VillageRequestStoryProgress {
  claimedChapters: number;
  totalChapters: number;
  completedStories: number;
  totalStories: number;
  readyChapters: number;
  completedClues: number;
  totalClues: number;
  completedStoryIds: VillageRequestStoryId[];
}

const requirement = (
  key: string, goal: number, label: string, location: string, destination: VillageRequestDestination,
): VillageRequestStoryRequirement => ({ key, goal, label, location, destination });

const chapter = (
  story: string, act: 1 | 2 | 3, title: string, summary: string, letter: string, keepsake: string,
  requirements: readonly VillageRequestStoryRequirement[],
): VillageRequestStoryChapter => ({ id: `${story}_${act}`, act, title, summary, letter, keepsake, requirements });

/**
 * 8개 생활권 × 3막. 단발 의뢰와 달리 여러 시스템을 한 이야기로 엮고,
 * 모든 조건은 평생 기록을 읽어 복귀 플레이어에게도 소급 적용한다.
 */
export const VILLAGE_REQUEST_STORIES: readonly VillageRequestStoryDef[] = [
  {
    id: 'returned_umbrella', code: 'STORY NB', category: 'neighbor', mark: '우',
    title: '돌아온 노란 우산', patron: '박 기장과 노을', color: '#718477',
    synopsis: '분실물 선반에 오래 남은 우산의 주인을 주민들의 기억과 골목 사진으로 찾아갑니다.',
    chapters: [
      chapter('returned_umbrella', 1, '손잡이에 적힌 작은 별', '우산의 주인을 기억할 만한 이웃부터 만나 봅니다.', '노을은 손잡이의 별이 어느 벽화 구석과 닮았다고 했다.', '별 모양 우산표', [
        requirement('residents_met', 3, '서로 다른 주민 3명 만나기', '주민 수첩 · 인연 지도', 'residents'),
        requirement('resident_greet', 3, '이름 있는 주민에게 3번 인사하기', '마을 주민 이름표 근처', 'residents'),
      ]),
      chapter('returned_umbrella', 2, '비가 멈춘 네 장면', '사진과 안부를 모아 우산이 지나온 골목을 좁힙니다.', '사진 네 귀퉁이마다 같은 노란색이 조금씩 남아 있었다.', '비 갠 골목 필름', [
        requirement('photo_taken', 2, '네컷 사진 2장 남기기', '네컷 작업실', 'photo'),
        requirement('q_emote', 5, '몸짓으로 마음 5번 전하기', '어디서나 · E', 'emote'),
      ]),
      chapter('returned_umbrella', 3, '현관 앞의 마른 우산', '마지막 단서를 들고 익숙해진 이웃의 집을 찾아갑니다.', '우산은 주인보다 먼저 집에 도착했고 현관에는 고맙다는 쪽지가 놓였다.', '노란 우산 엽서', [
        requirement('resident_trust_max', 50, '한 주민과 신뢰도 50 달성하기', '주민 수첩 · 관계 앨범', 'residents'),
        requirement('home_visits', 1, '첫 집들이 추억 남기기', '내 집 · 방문 앨범', 'home'),
      ]),
    ],
  },
  {
    id: 'last_encore', code: 'STORY ST', category: 'street', mark: '음',
    title: '불이 꺼진 뒤의 앙코르', patron: '하늘과 모퉁이 씨', color: '#9a745d',
    synopsis: '공연이 끝난 골목에 남은 사람들을 위해 작은 심야 무대를 다시 엽니다.',
    chapters: [
      chapter('last_encore', 1, '빈 의자 세 개', '카페 일을 도우며 늦은 관객이 원하는 무대를 묻습니다.', '세 의자의 등받이에는 서로 다른 신청곡이 연필로 적혔다.', '연필 신청곡 쪽지', [
        requirement('q_cafe', 1, '카페 일을 1번 돕기', '카페 「모퉁이」', 'cafe'),
        requirement('resident_greet', 2, '주민에게 2번 인사하기', '마을 주민 이름표 근처', 'residents'),
      ]),
      chapter('last_encore', 2, '전기가 없는 합주', '버스킹과 사진으로 장비 없이도 남는 무대를 만듭니다.', '앰프는 꺼졌지만 셔터와 손뼉이 정확한 박자를 만들었다.', '손뼉 박자표', [
        requirement('q_busking', 2, '버스킹 2번 성공하기', '메인 스트리트 버스킹 스팟', 'busking'),
        requirement('photo_taken', 3, '골목 사진 3장 남기기', '네컷 작업실', 'photo'),
      ]),
      chapter('last_encore', 3, '마지막 손님이 부른 첫 소절', '골목의 일과 무대를 충분히 익혀 심야 앙코르를 완성합니다.', '마지막 손님은 신청곡 대신 모두가 따라 부를 수 있는 첫 소절을 골랐다.', '심야 앙코르 티켓', [
        requirement('q_cafe', 5, '카페 일을 누적 5번 돕기', '카페 「모퉁이」', 'cafe'),
        requirement('q_busking', 5, '버스킹을 누적 5번 성공하기', '메인 스트리트 버스킹 스팟', 'busking'),
      ]),
    ],
  },
  {
    id: 'paw_letter', code: 'STORY CP', category: 'companion', mark: '발',
    title: '발자국으로 쓴 편지', patron: '멍냥이네 산책 모임', color: '#7d8c68',
    synopsis: '말 대신 행동으로 마음을 전하는 동행 친구의 하루를 산책 편지로 기록합니다.',
    chapters: [
      chapter('paw_letter', 1, '밥그릇 옆 첫 글자', '새 친구와 먹고 놀며 서로의 신호를 배웁니다.', '비어 있는 그릇 옆 작은 발자국 하나가 편지의 첫 글자가 되었다.', '첫 발자국 태그', [
        requirement('pet_adopt', 1, '첫 동행 친구 입양하기', '펫샵 「멍냥이네」', 'petshop'),
        requirement('pet_feed', 1, '동행에게 먹이 1번 챙기기', '펫샵 · 돌봄', 'petshop'),
      ]),
      chapter('paw_letter', 2, '두 골목의 문장', '서로 다른 골목을 걸으며 좋아하는 풍경을 발견합니다.', '같은 길도 함께 걷는 속도에 따라 전혀 다른 문장이 되었다.', '산책 문장 리본', [
        requirement('pet_play', 3, '동행과 누적 3번 놀기', '펫샵 · 돌봄', 'petshop'),
        requirement('pet_outing_routes', 2, '서로 다른 산책 코스 2곳 기록하기', '펫샵 · 동행 산책 수첩', 'petshop'),
      ]),
      chapter('paw_letter', 3, '집으로 돌아온 마침표', '산책의 기념과 집에서의 생활 장면으로 편지를 완성합니다.', '마지막 발자국은 늘 같은 쿠션 앞에서 멈췄고 그곳이 편지의 주소가 되었다.', '동행의 집 편지', [
        requirement('pet_outing_stamps', 6, '산책 기념 도장 6개 모으기', '동행 산책 수첩', 'petshop'),
        requirement('pet_home_memories', 3, '집 생활 추억 3개 기록하기', '내 집 · 동행의 자리', 'home'),
      ]),
    ],
  },
  {
    id: 'alley_issue', code: 'STORY FS', category: 'style', mark: '옷',
    title: '골목 화보 특별호', patron: '초코와 노을', color: '#a07373',
    synopsis: '유행을 복사하지 않고 지금의 기분과 골목의 색을 한 권의 화보로 엮습니다.',
    chapters: [
      chapter('alley_issue', 1, '오늘 기분의 한 벌', '현재 모습을 저장하고 골목의 빛 아래 사진으로 확인합니다.', '초코는 잘 어울린다는 말보다 오늘 같다는 말을 먼저 골랐다.', '오늘의 색 견본', [
        requirement('customize_save', 1, '첫 코디 저장하기', '캐릭터 아틀리에', 'atelier'),
        requirement('photo_taken', 1, '현재 모습 사진으로 남기기', '네컷 작업실', 'photo'),
      ]),
      chapter('alley_issue', 2, '세 색이 만나는 모서리', '염색과 룩북 의뢰로 같은 옷의 다른 대답을 찾습니다.', '벽화에서 주운 세 색은 옷 위에서 만나자 하나의 골목이 되었다.', '골목 삼색표', [
        requirement('fashion_dye', 3, '의상 색감 누적 3번 바꾸기', '아틀리에 · 의상', 'atelier'),
        requirement('lookbook_entries', 2, '서로 다른 룩북 의뢰 2장 기록하기', '아틀리에 · 골목 룩북', 'atelier'),
      ]),
      chapter('alley_issue', 3, '여섯 벌의 편집 회의', '충분히 다른 코디를 모아 특별호의 마지막 펼침면을 완성합니다.', '마지막 페이지에는 정답 대신 다음에 입어 볼 조합 여섯 개가 남았다.', '특별호 교정본', [
        requirement('lookbook_entries', 6, '서로 다른 룩북 의뢰 6장 기록하기', '아틀리에 · 골목 룩북', 'atelier'),
        requirement('lookbook_stars', 12, '룩북 최고 별 12개 모으기', '골목 룩북 · 최고 기록', 'atelier'),
      ]),
    ],
  },
  {
    id: 'one_room_table', code: 'STORY HM', category: 'home', mark: '집',
    title: '한 평짜리 사랑방', patron: '살림 아주머니', color: '#8f775c',
    synopsis: '작은 방에도 여럿이 편히 머무를 수 있도록 가구와 추억의 자리를 차근차근 만듭니다.',
    chapters: [
      chapter('one_room_table', 1, '불을 켠 첫 자리', '방을 열고 생활 가구 네 점으로 기본 동선을 만듭니다.', '가장 먼저 놓은 의자는 창문보다 돌아올 사람을 바라봤다.', '작은 방 열쇠고리', [
        requirement('visit_home', 1, '내 집 처음 방문하기', '주택가 · 나의 집', 'home'),
        requirement('q_place', 4, '가구 누적 4점 배치하기', '내 집 꾸미기 모드', 'home'),
      ]),
      chapter('one_room_table', 2, '다시 고른 나무결', '가구를 고쳐 쓰고 서로 다른 물건으로 방의 표정을 넓힙니다.', '낡은 표면을 벗기자 이전 주인의 연필 자국이 작은 무늬처럼 남았다.', '리폼 나무 조각', [
        requirement('furniture_reform_saves', 2, '가구 리폼 2번 저장하기', '내 집 · 리폼 공방', 'home'),
        requirement('home_unique_items', 8, '서로 다른 가구 8종 놓기', '내 집 · 인테리어 수첩', 'home'),
      ]),
      chapter('one_room_table', 3, '열 사람이 앉는 작은 집', '방의 개성을 만들고 이웃이 머문 장면을 사랑방 앨범에 남깁니다.', '방은 한 평 그대로였지만 다녀간 사람의 이름만큼 넓어졌다.', '사랑방 방명록', [
        requirement('home_theme_power', 6, '한 가지 홈 테마 점수 6 달성하기', '내 집 · 홈 스타일 카드', 'home'),
        requirement('home_visits', 5, '주민 5명의 집들이 추억 남기기', '내 집 · 방문 앨범', 'home'),
      ]),
    ],
  },
  {
    id: 'rooftop_supper', code: 'STORY CR', category: 'craft', mark: '접',
    title: '옥상에서 차린 저녁', patron: '계절 없는 정원사', color: '#7c815f',
    synopsis: '씨앗 하나가 이웃과 나누는 저녁 한 상이 될 때까지 손끝의 변화를 기록합니다.',
    chapters: [
      chapter('rooftop_supper', 1, '네 화분의 초대장', '첫 씨앗을 심고 작은 변화를 돌봅니다.', '싹은 초대받은 사람보다 먼저 고개를 내밀었다.', '씨앗 초대 봉투', [
        requirement('garden_planted', 2, '씨앗 누적 2번 심기', '옥상 씨앗 연구소', 'garden'),
        requirement('garden_tend', 3, '화분 누적 3번 돌보기', '옥상 씨앗 연구소', 'garden'),
      ]),
      chapter('rooftop_supper', 2, '서로 다른 세 가지 향', '다른 식물을 수확해 첫 메뉴들을 완성합니다.', '도마 위의 세 향은 어느 계절인지 묻지 않고 잘 어울렸다.', '옥상 향신 메모', [
        requirement('garden_species', 3, '서로 다른 식물 3종 수확하기', '정원 · 씨앗 서랍', 'garden'),
        requirement('cooking_recipes', 3, '서로 다른 메뉴 3종 완성하기', '골목 주방 · 메뉴 카드', 'kitchen'),
      ]),
      chapter('rooftop_supper', 3, '열두 접시가 지나간 자리', '표본과 플레이팅을 모아 오래 기억할 옥상 저녁을 완성합니다.', '빈 접시마다 누구와 무엇을 나눴는지가 작은 얼룩처럼 남아 있었다.', '옥상 저녁 메뉴판', [
        requirement('garden_specimens', 12, '성장 결 표본 12개 기록하기', '정원 · 표본함', 'garden'),
        requirement('cooking_plates', 12, '플레이팅 기록 12개 모으기', '골목 주방 · 접시 노트', 'kitchen'),
      ]),
    ],
  },
  {
    id: 'rain_map', code: 'STORY WT', category: 'water', mark: '물',
    title: '비가 모이는 세 곳', patron: '빗물정원 조사단', color: '#627e82',
    synopsis: '철길과 수로, 옥상의 물가를 오가며 도시의 비가 머무는 생태 지도를 만듭니다.',
    chapters: [
      chapter('rain_map', 1, '첫 번째 잔물결', '도심 물가에서 서로 다른 작은 생물을 만납니다.', '바늘 끝의 떨림 하나가 지도에 그은 첫 물길이 되었다.', '잔물결 관측표', [
        requirement('fishing_total', 3, '물가에서 누적 3번 만나기', '세 물가 · 낚시 수첩', 'fishing'),
        requirement('fishing_species', 2, '서로 다른 생물 2종 발견하기', '낚시 수첩 · 생물 기록', 'fishing'),
      ]),
      chapter('rain_map', 2, '세 물가의 다른 온도', '생물과 크기 기록을 늘려 장소마다 다른 물결을 읽습니다.', '같은 비도 철길에서는 차갑고 옥상에서는 조금 더 느리게 식었다.', '세 물가 온도띠', [
        requirement('fishing_species', 6, '서로 다른 생물 6종 발견하기', '낚시 수첩 · 생물 기록', 'fishing'),
        requirement('fishing_stamps', 9, '크기 기록 도장 9개 모으기', '낚시 수첩 · 크기 기록', 'fishing'),
      ]),
      chapter('rain_map', 3, '방 안에 들인 작은 수로', '수집한 물결을 테라리움으로 옮겨 도시 물길 지도를 완성합니다.', '작은 수조의 물결은 창밖 비와 같은 방향으로 천천히 흔들렸다.', '도심 물길 지도', [
        requirement('fishing_stamps', 27, '크기 기록 도장 27개 모으기', '낚시 수첩 · 크기 기록', 'fishing'),
        requirement('aquarium_saves', 3, '물결 테라리움 3번 저장하기', '내 집 · 물결 테라리움', 'home'),
      ]),
    ],
  },
  {
    id: 'forest_lantern', code: 'STORY AD', category: 'adventure', mark: '등',
    title: '외곽숲의 길 잃은 불빛', patron: '동수 할아버지와 외곽 순찰대', color: '#66705c',
    synopsis: '숲길 너머에서 반복해서 보이는 불빛의 정체를 생태 기록과 보물 조각으로 확인합니다.',
    chapters: [
      chapter('forest_lantern', 1, '나무 사이 세 번의 깜빡임', '외곽 생태를 안전하게 관찰하며 불빛이 나타나는 구역을 찾습니다.', '불빛은 다가가면 사라졌고 돌아서면 세 번씩 다시 반짝였다.', '외곽 안전 리본', [
        requirement('monster_kill', 5, '외곽 생태 5번 정리하기', '동쪽 외곽숲', 'hunt'),
        requirement('monster_species', 3, '서로 다른 생태 3종 발견하기', '가이드북 · 몬스터 연구', 'hunt'),
      ]),
      chapter('forest_lantern', 2, '조각에 비친 오래된 길', '숲에서 얻은 조각과 더 넓은 생태 기록을 맞춰 봅니다.', '조각을 기울이자 지금은 사라진 철길의 신호등이 희미하게 비쳤다.', '신호등 유리 조각', [
        requirement('monster_species', 8, '서로 다른 생태 8종 발견하기', '가이드북 · 몬스터 연구', 'hunt'),
        requirement('monster_shard', 20, '보물 조각 누적 20개 얻기', '동쪽 외곽숲', 'hunt'),
      ]),
      chapter('forest_lantern', 3, '돌아오는 사람을 위한 등', '보물을 복원하고 충분한 생태 기록으로 숲의 불빛을 새 표식으로 남깁니다.', '길 잃은 불빛은 오래전 돌아오는 열차를 기다리던 작은 표지등이었다.', '기찻길 귀환등', [
        requirement('treasures_owned', 3, '복원 보물 3점 보유하기', '보물 도감 · 진열장', 'treasure'),
        requirement('monster_species', 15, '서로 다른 생태 15종 발견하기', '가이드북 · 몬스터 연구', 'hunt'),
      ]),
    ],
  },
] as const;

export const VILLAGE_REQUEST_STORY_BY_ID = new Map(VILLAGE_REQUEST_STORIES.map((story) => [story.id, story]));
export const VILLAGE_REQUEST_STORY_CHAPTERS = VILLAGE_REQUEST_STORIES.flatMap((story) => story.chapters);
export const VILLAGE_REQUEST_STORY_CHAPTER_BY_ID = new Map(VILLAGE_REQUEST_STORY_CHAPTERS.map((item) => [item.id, item]));

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.floor(value) : 0;

const metricValue = (state: QuestState, key: string): number => cleanCount(state.lifetimeCounts?.[key]);

export function freshVillageRequestStoryState(): VillageRequestStoryState {
  return { version: 1, claimedChapters: [], trackedStoryId: null };
}

export function normalizeVillageRequestStoryState(raw: unknown): VillageRequestStoryState {
  const value = (raw ?? {}) as Partial<VillageRequestStoryState>;
  const validChapters = new Set<string>();
  const claimed = new Set(Array.isArray(value.claimedChapters) ? value.claimedChapters : []);
  // 손상된 저장값이 뒤 막만 가지고 있어도 존재하는 연속 막까지만 복원한다.
  for (const story of VILLAGE_REQUEST_STORIES) {
    for (const item of story.chapters) {
      if (!claimed.has(item.id)) break;
      validChapters.add(item.id);
    }
  }
  const trackedStoryId = typeof value.trackedStoryId === 'string' && VILLAGE_REQUEST_STORY_BY_ID.has(value.trackedStoryId as VillageRequestStoryId)
    ? value.trackedStoryId as VillageRequestStoryId
    : null;
  return { version: 1, claimedChapters: [...validChapters], trackedStoryId };
}

export function villageRequestStoryViews(
  storyState: VillageRequestStoryState, quests: QuestState,
): VillageRequestStoryView[] {
  const claimedIds = new Set(storyState.claimedChapters);
  return VILLAGE_REQUEST_STORIES.map((story) => {
    let previousClaimed = true;
    const chapters = story.chapters.map((item): VillageRequestStoryChapterView => {
      const claimed = claimedIds.has(item.id);
      const unlocked = previousClaimed;
      const requirements = item.requirements.map((source): VillageRequestStoryRequirementView => {
        const current = metricValue(quests, source.key);
        return {
          ...source, current, complete: current >= source.goal,
          progressPct: Math.round((Math.min(current, source.goal) / source.goal) * 100),
        };
      });
      const ready = unlocked && !claimed && requirements.every((source) => source.complete);
      previousClaimed = previousClaimed && claimed;
      return {
        ...item, requirements, claimed, unlocked, ready,
        progressPct: Math.round(requirements.reduce((sum, source) => sum + source.progressPct, 0) / requirements.length),
      };
    });
    const claimed = chapters.filter((item) => item.claimed).length;
    const nextChapter = chapters.find((item) => item.unlocked && !item.claimed) ?? null;
    return {
      ...story, chapters, claimed, ready: chapters.filter((item) => item.ready).length,
      complete: claimed === chapters.length, tracked: storyState.trackedStoryId === story.id,
      nextChapter, progressPct: Math.round(chapters.reduce((sum, item) => sum + item.progressPct, 0) / chapters.length),
    };
  });
}

export function villageRequestStoryProgress(
  storyState: VillageRequestStoryState, quests: QuestState,
): VillageRequestStoryProgress {
  const views = villageRequestStoryViews(storyState, quests);
  const clues = views.flatMap((story) => story.chapters.flatMap((item) => item.requirements));
  return {
    claimedChapters: storyState.claimedChapters.length,
    totalChapters: VILLAGE_REQUEST_STORY_CHAPTERS.length,
    completedStories: views.filter((story) => story.complete).length,
    totalStories: VILLAGE_REQUEST_STORIES.length,
    readyChapters: views.reduce((sum, story) => sum + story.ready, 0),
    completedClues: clues.filter((item) => item.complete).length,
    totalClues: clues.length,
    completedStoryIds: views.filter((story) => story.complete).map((story) => story.id),
  };
}

/** 완료에 가장 가까운 현재 막을 추천하되, 추적 중인 이야기가 있으면 그 이야기를 우선한다. */
export function recommendedVillageRequestStory(
  storyState: VillageRequestStoryState, quests: QuestState,
): VillageRequestStoryView | null {
  const views = villageRequestStoryViews(storyState, quests);
  const tracked = views.find((story) => story.tracked && !story.complete);
  if (tracked) return tracked;
  return [...views]
    .filter((story) => !story.complete && story.nextChapter)
    .sort((a, b) => Number(b.nextChapter!.ready) - Number(a.nextChapter!.ready)
      || b.nextChapter!.progressPct - a.nextChapter!.progressPct
      || a.code.localeCompare(b.code))[0] ?? null;
}

/** 단발 의뢰와 연속 의뢰가 같은 길 안내 규칙을 공유한다. */
export function villageRequestDestinationForMetric(key: string): VillageRequestDestination | null {
  if (key.startsWith('village_search_')) return 'search';
  if (key.startsWith('atmosphere_')) return 'atmosphere';
  if (key.startsWith('neighborhood_tour_')) return 'guide';
  if (key.startsWith('neighborhood_museum_')) return 'museum';
  if (key.startsWith('taste_showcase_')) return 'showcase';
  if (key.startsWith('alley_secret')) return 'secrets';
  if (key === 'open_map' || key.startsWith('district') || key === 'safe_districts_discovered') return 'map';
  if (key === 'village_requests_total') return 'quest';
  if (key === 'sparkle_collect') return 'guide';
  if (key === 'resident_greet' || key === 'residents_met' || key === 'resident_trust_max'
    || key.startsWith('resident_fan_') || key.startsWith('resident_room_care_')
    || key.startsWith('resident_rendezvous_') || key.startsWith('resident_letter')) return 'residents';
  if (key.startsWith('adventure_mode_')) return 'hunt';
  if (key.startsWith('adventure_role') || key.startsWith('adventure_charm') || key.startsWith('adventure_kit')) return 'adventure-kit';
  if (key.startsWith('village_profile_')) return 'profile';
  if (key.startsWith('neighbor_cheer') || key.startsWith('neighbor_home')) return 'profile';
  if (key === 'q_emote') return 'emote';
  if (key === 'chat_sent') return 'chat';
  if (key === 'q_cafe') return 'cafe';
  if (key === 'q_busking') return 'busking';
  if (key === 'visit_shop' || key === 'shop_purchase') return 'shop';
  if (key.startsWith('market_')) return 'market';
  if (key === 'visit_workshop' || key.startsWith('furniture_craft_')) return 'workshop';
  if (key === 'photo_taken' || key === 'photo_album' || key === 'photo_frames' || key.startsWith('photo_card')) return 'photo';
  if (key.startsWith('pet_') || key === 'pets_owned' || key === 'max_pet_affinity') return 'petshop';
  if (key.startsWith('fashion_') || key.startsWith('lookbook_') || key.startsWith('character_zine_')
    || key.startsWith('character_episode_') || key === 'customize_save' || key === 'closet_save') return 'atelier';
  if (key.startsWith('home_') || key.startsWith('object_story_') || key.startsWith('furniture_reform_') || key.startsWith('aquarium_') || key === 'visit_home' || key === 'q_place') return 'home';
  if (key.startsWith('garden_')) return 'garden';
  if (key.startsWith('shared_project_') || key.startsWith('community_project_')) return 'projects';
  if (key.startsWith('hobby_club_')) return 'clubs';
  if (key.startsWith('starter_mentor_')) return 'quest';
  if (key.startsWith('cooking_')) return 'kitchen';
  if (key.startsWith('fishing_')) return 'fishing';
  if (key.startsWith('monster_') || key === 'q_forest') return 'hunt';
  if (key.startsWith('treasure')) return 'treasure';
  return null;
}
