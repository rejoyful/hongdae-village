import type { TrustState } from './residents';
import { RESIDENTS, trustOf } from './residents';

export type RoomCareHomeId = 'hook' | 'shelf' | 'worktop' | 'memory';

export interface RoomCareHome {
  id: RoomCareHomeId;
  mark: string;
  name: string;
  description: string;
}

export interface RoomCareItem {
  id: string;
  mark: string;
  name: string;
  note: string;
  homeId: RoomCareHomeId;
  placedLine: string;
}

export interface ResidentRoomCareDef {
  residentId: string;
  code: string;
  title: string;
  request: string;
  afterScene: string;
  keepsake: string;
  keepsakeMark: string;
  keepsakeNote: string;
  palette: readonly [string, string, string, string];
  items: readonly [RoomCareItem, RoomCareItem, RoomCareItem, RoomCareItem];
}

export interface ResidentRoomCareState {
  version: 2;
  sortedItemIds: string[];
  featuredResidentIds: string[];
}

export interface ResidentRoomCareView extends ResidentRoomCareDef {
  residentName: string;
  residentRole: string;
  unlocked: boolean;
  sortedItemIds: string[];
  sorted: number;
  total: number;
  complete: boolean;
  featured: boolean;
  nextItem: RoomCareItem | null;
}

export interface ResidentRoomCareProgress {
  sortedItems: number;
  completedRooms: number;
  featuredRooms: number;
  totalItems: number;
  totalRooms: number;
}

export type RoomCareSortResult =
  | { ok: true; firstRoom: boolean; roomComplete: boolean; view: ResidentRoomCareView; item: RoomCareItem }
  | { ok: false; reason: 'locked' | 'missing' | 'already' | 'not-home'; view: ResidentRoomCareView | null; item: RoomCareItem | null };

export const ROOM_CARE_FEATURED_MAX = 3;

export const ROOM_CARE_HOMES: readonly RoomCareHome[] = [
  { id: 'hook', mark: '걸', name: '벽걸이 자리', description: '자주 꺼내는 긴 물건과 천을 걸어 둬요.' },
  { id: 'shelf', mark: '선', name: '낮은 진열 선반', description: '다시 보고 싶은 물건을 눈높이에 놓아요.' },
  { id: 'worktop', mark: '손', name: '작업 상판', description: '곧 다시 쓰는 도구와 종이를 펼쳐 둬요.' },
  { id: 'memory', mark: '록', name: '기억 상자', description: '작지만 버리고 싶지 않은 장면을 보관해요.' },
] as const;

const item = (
  id: string, mark: string, name: string, note: string, homeId: RoomCareHomeId, placedLine: string,
): RoomCareItem => ({ id, mark, name, note, homeId, placedLine });

/** 주민의 직업·관계 서사에서 실제로 꺼낸 10개의 작은 방 정리 의뢰. */
export const RESIDENT_ROOM_CARE: readonly ResidentRoomCareDef[] = [
  {
    residentId: 'haneul', code: 'ROOM 01 · RHYTHM', title: '첫 소절이 다시 보이는 방',
    request: '공연 뒤 한꺼번에 내려놓은 악보와 작은 기념을 다음 연습 전에 찾고 싶어요.',
    afterScene: '악보가 상판에 펼쳐지고 케이블이 벽에 걸리자, 비어 있던 의자 하나가 다음 곡을 기다리는 객석처럼 보였다.',
    keepsake: '정리된 첫 소절 악보 조각', keepsakeMark: '♪',
    keepsakeNote: '지운 곡과 새 제목이 한 장에 남아, 완성보다 다시 시작한 순간을 기억하게 한다.',
    palette: ['#3f3548', '#84616b', '#d0a66d', '#efe0be'],
    items: [
      item('haneul_cable', '선', '감긴 기타 케이블', '길고 자주 꺼내는 물건은 바닥보다 세워 두는 편이 안전해요.', 'hook', '케이블 끝이 바닥에 닿지 않게 느슨한 고리로 걸었다.'),
      item('haneul_setlist', '곡', '구겨진 오늘의 셋리스트', '다음 연습에서 바로 고칠 종이예요.', 'worktop', '지운 곡 옆에 새 제목을 쓸 자리를 남겨 펼쳤다.'),
      item('haneul_ticket', '표', '첫 버스킹 티켓', '매일 쓰지는 않지만 눈에 보이면 힘이 나는 기념이에요.', 'shelf', '작은 스탠드에 세우니 방의 첫 관객이 되었다.'),
      item('haneul_pick', '픽', '닳은 파란 피크', '손바닥보다 작은 오래된 물건은 잃어버리지 않게 모아 둬요.', 'memory', '투명 봉투에 날짜를 적어 기억 상자에 넣었다.'),
    ],
  },
  {
    residentId: 'moturi', code: 'ROOM 02 · BREW', title: '첫 잔을 내리는 작업대',
    request: '새 원두를 시험하다 보니 손님 자리까지 도구가 번졌어요. 아침 첫 잔 동선만 되찾아 주세요.',
    afterScene: '상판에는 내일 쓸 드리퍼만 남고, 빈 의자 곁으로 커피 향이 천천히 돌아왔다.',
    keepsake: '둘이 고친 첫 잔 레시피표', keepsakeMark: '잔',
    keepsakeNote: '물의 온도 옆에 작은 별 하나가 더해진 뒤, 아침 첫 잔은 둘이 만든 순서가 되었다.',
    palette: ['#343d3c', '#6e7b68', '#b58a5d', '#ead9b8'],
    items: [
      item('moturi_apron', '앞', '원두 가루 묻은 앞치마', '긴 천은 의자에 쌓기보다 걸어 말리면 좋아요.', 'hook', '주머니를 비우고 벽걸이에 반듯하게 걸었다.'),
      item('moturi_dripper', '잔', '도자기 드리퍼', '내일 아침 가장 먼저 손이 가는 도구예요.', 'worktop', '저울 옆에 두어 첫 잔의 순서를 만들었다.'),
      item('moturi_cup', '컵', '1호 단골잔', '자주 쓰기보다 바라볼 때 이야기가 떠오르는 잔이에요.', 'shelf', '창가 선반에 놓자 오래된 단골 이름이 빛났다.'),
      item('moturi_label', '콩', '첫 원두 봉투 라벨', '작은 종이지만 다시 같은 향을 찾게 해 주는 기록이에요.', 'memory', '날짜와 날씨를 덧쓴 뒤 기억 상자에 보관했다.'),
    ],
  },
  {
    residentId: 'sallim', code: 'ROOM 03 · GRAIN', title: '나무결을 읽는 작은 공방',
    request: '남의 방 자리를 재 주느라 제 작업대의 견본들이 뒤섞였네. 손에 익은 순서로 돌려놓아 줄래?',
    afterScene: '줄자와 견본이 제자리를 찾자 오래된 작업대의 긁힌 결도 숨길 흠이 아니라 사용 설명처럼 보였다.',
    keepsake: '손바닥만 한 집 모양 치수표', keepsakeMark: '집',
    keepsakeNote: '숫자보다 먼저 그린 작은 지붕이, 누군가의 생활을 재는 일의 시작점을 보여 준다.',
    palette: ['#463a32', '#8e735c', '#c9a36e', '#eee0bd'],
    items: [
      item('sallim_apron', '천', '못 주머니 앞치마', '무겁고 긴 작업복은 바닥에서 밟히지 않게 걸어요.', 'hook', '못을 비운 앞치마를 공방 문 곁에 걸었다.'),
      item('sallim_sample', '결', '원목 마감 견본', '비교하며 자주 보는 표본은 눈높이가 좋아요.', 'shelf', '밝은 결부터 어두운 결까지 작은 선반에 세웠다.'),
      item('sallim_ruler', '자', '접이식 나무 자', '다음 치수를 바로 잴 수 있게 손 닿는 곳에 둬요.', 'worktop', '연필 옆에 반쯤 펼쳐 다음 선을 기다리게 했다.'),
      item('sallim_key', '집', '첫 가게의 낡은 열쇠', '지금은 쓰지 않지만 시작을 기억하게 하는 물건이에요.', 'memory', '집 모양 꼬리표를 다시 달아 기억 상자에 넣었다.'),
    ],
  },
  {
    residentId: 'jun', code: 'ROOM 04 · NIGHT', title: '교대 뒤 열 분의 책상',
    request: '퇴근하면 주머니부터 비우고 쓰러져서 영수증과 간식이 섞였어요. 쉬는 자리를 조금만 만들어 주세요.',
    afterScene: '야간 조끼가 벽에 걸리고 책상 한 칸이 비자, 준은 남은 열 분을 재고가 아닌 자기 시간으로 쓸 수 있었다.',
    keepsake: '첫 월급날의 반듯한 영수증', keepsakeMark: '영',
    keepsakeNote: '구겨진 모서리를 펴자 금액보다 그날 퇴근 뒤 처음 샀던 작은 간식이 또렷해졌다.',
    palette: ['#313848', '#66758d', '#b98b63', '#e8dfc8'],
    items: [
      item('jun_vest', '밤', '야간 근무 조끼', '긴 근무복은 침대보다 문 가까운 벽이 편해요.', 'hook', '명찰을 떼지 않은 채 내일 다시 입기 좋게 걸었다.'),
      item('jun_snack', '삼', '참치마요 삼각김밥 모형', '먹는 물건이 아니라 첫 월급날 받은 작은 장식이에요.', 'shelf', '미니 진열대에 올리니 늦은 밤의 농담이 돌아왔다.'),
      item('jun_report', '표', '신상품 평가표', '곧 다음 맛을 적을 종이는 책상에서 이어 써요.', 'worktop', '펜과 함께 펼쳐 두고 빈 별점을 남겼다.'),
      item('jun_receipt', '영', '첫 월급날 영수증', '작고 얇은 시작의 기록은 한곳에 모아 둬요.', 'memory', '구겨진 모서리를 펴 투명 파일에 넣었다.'),
    ],
  },
  {
    residentId: 'choco', code: 'ROOM 05 · COLOR', title: '단종 젤리의 색깔 서랍',
    request: '신상 봉지를 모으다 보니 최애 포장이 어디 있는지 모르겠어요. 색이 다시 보이게 도와주세요!',
    afterScene: '포장지가 작은 색면처럼 나란해지자 초코의 방은 재고 창고가 아니라 취향을 기록한 팝업 전시가 되었다.',
    keepsake: '단종된 포도맛 젤리 라벨', keepsakeMark: '포',
    keepsakeNote: '다시는 같은 맛을 살 수 없어도 보랏빛 라벨은 초코의 취향이 시작된 주를 기억한다.',
    palette: ['#443640', '#9b6470', '#d9ad67', '#f0dfc1'],
    items: [
      item('choco_bag', '가', '편의점 에코백', '길고 손잡이가 있는 가방은 걸어 두면 안이 보여요.', 'hook', '봉투를 비우고 가장 밝은 면이 보이게 걸었다.'),
      item('choco_display', '신', '미니 신상 진열대', '여러 색을 비교하는 물건은 눈에 보이는 곳이 좋아요.', 'shelf', '주간 최애 순서대로 작은 칸을 채웠다.'),
      item('choco_score', '점', '젤리 맛 점수표', '오늘도 고쳐 쓸 기록은 펜과 가까워야 해요.', 'worktop', '가장 이상한 맛 옆에 새 평가 칸을 그렸다.'),
      item('choco_grape', '포', '포도맛 마지막 봉지', '다시 살 수 없는 작은 포장은 안전하게 눕혀 둬요.', 'memory', '공기를 빼고 투명 봉투에 넣어 색을 보존했다.'),
    ],
  },
  {
    residentId: 'ille', code: 'ROOM 06 · DAWN', title: '첫차 전의 조용한 서랍',
    request: '새벽 소리를 적은 쪽지가 방 여기저기 있어요. 첫차가 오기 전에 한 장면으로 묶고 싶습니다.',
    afterScene: '작은 소리들이 상판과 상자에 나뉘자 고요는 빈 것이 아니라 오래 들은 것들의 목록이 되었다.',
    keepsake: '첫차 전 새벽 소리 체크표', keepsakeMark: '소',
    keepsakeNote: '냉장고 모터와 멀리 난 첫차 사이 빈 줄에는, 아직 이름 붙이지 못한 고요가 남아 있다.',
    palette: ['#2f3543', '#626a88', '#a78b69', '#e7dfc8'],
    items: [
      item('ille_jacket', '새', '새벽 근무 재킷', '긴 겉옷은 잠자리에서 떨어진 문 곁에 걸어요.', 'hook', '주머니의 동전을 비우고 조용히 벽에 걸었다.'),
      item('ille_sticker', '칠', '행운의 일곱 스티커 판', '하나씩 바라보며 고르는 수집판은 선반이 어울려요.', 'shelf', '남은 일곱 칸이 모두 보이게 세워 두었다.'),
      item('ille_sound', '소', '새벽 소리 체크표', '아직 듣고 적는 중인 기록은 펼쳐 둬요.', 'worktop', '냉장고 모터 다음 빈 줄을 남겨 펜 곁에 놓았다.'),
      item('ille_stick', '달', '반값 아이스크림 막대', '별것 아니어도 둘이 웃은 날의 물건은 기억이 돼요.', 'memory', '작은 달을 그려 날짜와 함께 보관했다.'),
    ],
  },
  {
    residentId: 'park', code: 'ROOM 07 · ROUTE', title: '잃어버리지 않는 귀환표',
    request: '분실물 기록과 오래된 승차권이 한 책상에 섞였습니다. 지금 쓰는 길과 지난 길을 나눠 주세요.',
    afterScene: '현재 노선표는 상판에, 지난 표는 상자에 놓였다. 돌아갈 길을 아는 방에는 오래된 출발도 안전하게 머물렀다.',
    keepsake: '개찰 자국이 남은 종이 승차권', keepsakeMark: '표',
    keepsakeNote: '지금은 사라진 출발역의 개찰 자국이 있어, 오래된 길도 안전하게 돌아갈 주소를 가진다.',
    palette: ['#303842', '#566879', '#b18b5e', '#e8dec4'],
    items: [
      item('park_cap', '모', '역무원 제모', '형태가 무너지지 않게 걸이의 가장 높은 곳에 둬요.', 'hook', '챙을 바로잡아 출근문 곁에 걸었다.'),
      item('park_clock', '시', '작은 역 시계', '매일 확인하는 표식은 눈높이에서 잘 보여야 해요.', 'shelf', '선반 중앙에 두니 방의 시간이 다시 맞았다.'),
      item('park_route', '선', '오늘의 노선 점검표', '아직 확인 중인 길은 책상에 펼쳐 둬요.', 'worktop', '마지막 환승 칸 옆에 연필을 나란히 놓았다.'),
      item('park_ticket', '표', '오래된 종이 승차권', '지금은 쓰지 않는 출발의 기록은 따로 보존해요.', 'memory', '개찰 자국이 닳지 않게 얇은 파일에 넣었다.'),
    ],
  },
  {
    residentId: 'noeul', code: 'ROOM 08 · COLOR', title: '마르기 전과 마른 뒤의 색',
    request: '젖은 붓과 마른 물감 조각이 섞이면 다음 색을 고르기 어려워요. 시간 순서가 보이게 해 주세요.',
    afterScene: '젖은 도구와 마른 기록이 갈라지자 벽의 빈 부분이 실수가 아니라 다음 노을을 위한 여백이 되었다.',
    keepsake: '첫 벽화의 마른 물감 조각', keepsakeMark: '빛',
    keepsakeNote: '주황도 보라도 아닌 얇은 조각은 실패한 색이 아니라 다음 노을의 기준색이 되었다.',
    palette: ['#443341', '#9a627e', '#d58b5f', '#f1d6b5'],
    items: [
      item('noeul_apron', '색', '물감 묻은 작업 앞치마', '젖은 긴 천은 다른 물건과 겹치지 않게 걸어 말려요.', 'hook', '가장 진한 얼룩이 작은 벽화처럼 보이게 걸었다.'),
      item('noeul_chip', '빛', '마른 노을빛 조각', '완성된 색 표본은 나란히 비교할 수 있어야 해요.', 'shelf', '주황과 보라 사이에 이름 없는 색을 세웠다.'),
      item('noeul_brush', '붓', '아직 젖은 둥근 붓', '곧 다시 손질할 도구는 작업 자리에서 말려요.', 'worktop', '천 위에 눕혀 붓끝이 상하지 않게 두었다.'),
      item('noeul_note', '벽', '첫 벽화의 작은 메모', '다시 만들 수 없는 첫 장면의 종이는 따로 모아요.', 'memory', '튀었던 물감까지 그대로 투명 봉투에 보존했다.'),
    ],
  },
  {
    residentId: 'imo', code: 'ROOM 09 · WARM', title: '첫 손님 전의 작은 주방',
    request: '장사를 마치면 메뉴판과 국물 도구가 한데 쌓여요. 내일 첫 손님을 맞을 한 칸만 비워 줘.',
    afterScene: '국자와 앞치마가 벽으로 돌아가고 메뉴판이 선반에 서자, 작은 상판 한 칸이 다시 누군가의 손을 녹일 자리가 되었다.',
    keepsake: '십 년 된 포차 메뉴판 모서리', keepsakeMark: '온',
    keepsakeNote: '손때가 가장 짙은 모서리는 가격보다 먼저, 오래 앉아 있던 손님들의 온도를 기록한다.',
    palette: ['#49352f', '#9b604f', '#d49a59', '#f0d5ad'],
    items: [
      item('imo_ladle', '국', '긴 어묵 국자', '길고 매일 쓰는 도구는 손 닿는 벽에 걸어요.', 'hook', '첫 국물을 뜨기 좋은 높이에 걸었다.'),
      item('imo_menu', '온', '십 년 된 작은 메뉴판', '손님과 함께 보는 물건은 눈에 잘 띄어야 해요.', 'shelf', '가격표보다 손때가 먼저 보이게 세워 두었다.'),
      item('imo_recipe', '맛', '내일의 양념 메모', '아직 고쳐 쓸 비율은 작업 자리에서 이어가요.', 'worktop', '매운맛 한 숟갈 옆에 빈 칸을 남겼다.'),
      item('imo_band', '컵', '첫 종이컵의 띠', '작아도 첫 손님의 온기가 남은 물건은 보관해요.', 'memory', '평평하게 펴 오늘 날짜와 함께 넣었다.'),
    ],
  },
  {
    residentId: 'dongsu', code: 'ROOM 10 · SEASON', title: '천천히 돌아온 산책방',
    request: '산책에서 주운 것들을 탁자에만 올렸더니 계절이 서로 가렸군요. 하나씩 얼굴을 찾아 줍시다.',
    afterScene: '지팡이는 벽에, 잎은 선반에, 지도는 상판에 놓였다. 방 안에서도 세 계절이 서로를 가리지 않고 천천히 걸었다.',
    keepsake: '옛 기찻길의 작은 자갈 표식', keepsakeMark: '돌',
    keepsakeNote: '이름을 적은 종이와 나란히 두면 평범한 자갈도 어느 계절, 어느 길의 한 걸음이 된다.',
    palette: ['#354039', '#66775e', '#a88b5d', '#e7dfbd'],
    items: [
      item('dongsu_stick', '길', '느린 산책 지팡이', '길고 매일 꺼내는 물건은 문 가까이 세워 둬요.', 'hook', '손잡이가 아침 쪽을 향하게 벽에 걸었다.'),
      item('dongsu_leaf', '잎', '이름 붙인 은행잎', '말린 계절 표본은 빛이 닿는 곳에서 바라봐요.', 'shelf', '작은 액자에 넣어 다음 계절 옆자리를 비웠다.'),
      item('dongsu_map', '숲', '옛 기찻길 산책 지도', '다음에 이어 걸을 길은 펼쳐 둬야 해요.', 'worktop', '아직 걷지 않은 골목에 연필 점을 하나 남겼다.'),
      item('dongsu_stone', '돌', '기찻길의 작은 자갈', '작고 무거운 오래된 흔적은 안전한 상자에 둬요.', 'memory', '발견한 나무 이름을 적은 종이와 함께 보관했다.'),
    ],
  },
] as const;

const DEF_BY_RESIDENT = new Map(RESIDENT_ROOM_CARE.map((entry) => [entry.residentId, entry]));
const ITEM_TO_ROOM = new Map(RESIDENT_ROOM_CARE.flatMap((room) => room.items.map((entry) => [entry.id, room.residentId] as const)));

export function normalizeResidentRoomCareState(raw: unknown): ResidentRoomCareState {
  const value = (raw ?? {}) as Partial<ResidentRoomCareState> & { featuredResidentId?: unknown };
  const sortedItemIds = Array.isArray(value.sortedItemIds)
    ? [...new Set(value.sortedItemIds.filter((id): id is string => typeof id === 'string' && ITEM_TO_ROOM.has(id)))]
    : [];
  const featuredCandidates = Array.isArray(value.featuredResidentIds)
    ? value.featuredResidentIds
    : typeof value.featuredResidentId === 'string' ? [value.featuredResidentId] : [];
  const featuredResidentIds = [...new Set(featuredCandidates.filter((id): id is string => (
    typeof id === 'string'
    && DEF_BY_RESIDENT.has(id)
    && DEF_BY_RESIDENT.get(id)!.items.every((entry) => sortedItemIds.includes(entry.id))
  )))].slice(0, ROOM_CARE_FEATURED_MAX);
  return { version: 2, sortedItemIds, featuredResidentIds };
}

export function residentRoomCareViews(state: ResidentRoomCareState, trust: TrustState): ResidentRoomCareView[] {
  const sorted = new Set(state.sortedItemIds);
  return RESIDENT_ROOM_CARE.map((def) => {
    const resident = RESIDENTS.find((entry) => entry.id === def.residentId)!;
    const sortedItemIds = def.items.filter((entry) => sorted.has(entry.id)).map((entry) => entry.id);
    return {
      ...def,
      residentName: resident.name,
      residentRole: resident.role,
      unlocked: trustOf(trust, resident.id) > 0,
      sortedItemIds,
      sorted: sortedItemIds.length,
      total: def.items.length,
      complete: sortedItemIds.length === def.items.length,
      featured: state.featuredResidentIds.includes(def.residentId),
      nextItem: def.items.find((entry) => !sorted.has(entry.id)) ?? null,
    };
  });
}

export function residentRoomCareProgress(state: ResidentRoomCareState): ResidentRoomCareProgress {
  const views = residentRoomCareViews(state, {});
  return {
    sortedItems: state.sortedItemIds.length,
    completedRooms: views.filter((view) => view.complete).length,
    featuredRooms: state.featuredResidentIds.length,
    totalItems: RESIDENT_ROOM_CARE.reduce((sum, room) => sum + room.items.length, 0),
    totalRooms: RESIDENT_ROOM_CARE.length,
  };
}

export class ResidentRoomCareStore {
  private state: ResidentRoomCareState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-resident-room-care-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeResidentRoomCareState(raw);
    this.persist();
  }

  get(): ResidentRoomCareState { return this.state; }
  views(trust: TrustState): ResidentRoomCareView[] { return residentRoomCareViews(this.state, trust); }
  progress(): ResidentRoomCareProgress { return residentRoomCareProgress(this.state); }

  sort(residentId: string, itemId: string, homeId: RoomCareHomeId, trust: TrustState): RoomCareSortResult {
    const view = this.views(trust).find((entry) => entry.residentId === residentId) ?? null;
    const target = view?.items.find((entry) => entry.id === itemId) ?? null;
    if (!view || !target || !ROOM_CARE_HOMES.some((entry) => entry.id === homeId)) {
      return { ok: false, reason: 'missing', view, item: target };
    }
    if (!view.unlocked) return { ok: false, reason: 'locked', view, item: target };
    if (this.state.sortedItemIds.includes(itemId)) return { ok: false, reason: 'already', view, item: target };
    if (target.homeId !== homeId) return { ok: false, reason: 'not-home', view, item: target };
    const firstRoom = this.progress().completedRooms === 0;
    this.state = { ...this.state, sortedItemIds: [...this.state.sortedItemIds, itemId] };
    this.persist();
    const updated = this.views(trust).find((entry) => entry.residentId === residentId)!;
    return { ok: true, firstRoom, roomComplete: updated.complete, view: updated, item: target };
  }

  feature(residentId: string): 'featured' | 'cleared' | 'full' | 'locked' | 'missing' {
    const def = DEF_BY_RESIDENT.get(residentId);
    if (!def) return 'missing';
    const complete = def.items.every((entry) => this.state.sortedItemIds.includes(entry.id));
    if (!complete) return 'locked';
    const clearing = this.state.featuredResidentIds.includes(residentId);
    if (!clearing && this.state.featuredResidentIds.length >= ROOM_CARE_FEATURED_MAX) return 'full';
    this.state = {
      ...this.state,
      featuredResidentIds: clearing
        ? this.state.featuredResidentIds.filter((id) => id !== residentId)
        : [...this.state.featuredResidentIds, residentId],
    };
    this.persist();
    return clearing ? 'cleared' : 'featured';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
