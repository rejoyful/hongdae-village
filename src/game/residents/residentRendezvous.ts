import type { QuestState } from '../questProgress';
import { RESIDENTS, trustOf, type TrustState } from './residents';

export type ResidentRendezvousAct = 1 | 2 | 3;
export type ResidentRendezvousLocation = 'stage' | 'cafe' | 'home' | 'shop' | 'forest' | 'station' | 'studio' | 'stall';

export interface ResidentRendezvousRequirement {
  key: string;
  goal: number;
  label: string;
  location: string;
}

export interface ResidentRendezvousDef {
  id: string;
  residentId: string;
  act: ResidentRendezvousAct;
  trust: 30 | 50 | 80;
  title: string;
  invitation: string;
  memory: string;
  dialogue: string;
  keepsake: string;
  mark: string;
  location: ResidentRendezvousLocation;
  palette: readonly [string, string, string, string];
  requirements: readonly ResidentRendezvousRequirement[];
}

interface ResidentRendezvousSeries {
  residentId: string;
  location: ResidentRendezvousLocation;
  palette: readonly [string, string, string, string];
  scenes: readonly [
    Omit<ResidentRendezvousDef, 'id' | 'residentId' | 'act' | 'trust' | 'location' | 'palette'>,
    Omit<ResidentRendezvousDef, 'id' | 'residentId' | 'act' | 'trust' | 'location' | 'palette'>,
    Omit<ResidentRendezvousDef, 'id' | 'residentId' | 'act' | 'trust' | 'location' | 'palette'>,
  ];
}

const req = (key: string, goal: number, label: string, location: string): ResidentRendezvousRequirement => ({ key, goal, label, location });

/** 선물·시간 제한 없이 기존 생활 기록으로 열리는 주민별 세 번의 약속. */
const SERIES: readonly ResidentRendezvousSeries[] = [
  { residentId: 'haneul', location: 'stage', palette: ['#201f38', '#57416f', '#e98a70', '#ffd789'], scenes: [
    { title: '한 사람뿐인 리허설', invitation: '관객이 없는 시간에 첫 소절을 들어 달라는 쪽지가 왔어요.', memory: '무대 조명이 켜지기 전, 둘만 아는 박자로 첫 곡을 맞췄다.', dialogue: '첫 음을 믿어 주는 사람이 있으면 시작할 수 있어요.', keepsake: '연습실의 파란 피크', mark: '음', requirements: [req('q_busking', 1, '버스킹 한 번 성공', '메인 스트리트 버스킹 스팟')] },
    { title: '골목 소리 채집', invitation: '새 곡에 넣을 골목의 생활 소리를 함께 찾아요.', memory: '컵 내려놓는 소리와 횡단보도 신호음이 짧은 리듬이 되었다.', dialogue: '홍대는 가만히 들어도 매일 새 노래를 만들어요.', keepsake: '골목 리듬 카세트', mark: '록', requirements: [req('q_busking', 3, '버스킹 누적 3회', '메인 스트리트'), req('photo_taken', 2, '골목 사진 2장', '네컷 작업실')] },
    { title: '옥상 비밀 앙코르', invitation: '가장 오래 기억하고 싶은 곡을 단 한 명에게 연주해요.', memory: '도시 불빛 위로 미완성 곡의 마지막 코드가 길게 남았다.', dialogue: '이 곡의 첫 번째 제목은 당신이 정해 줘요.', keepsake: '손글씨 앙코르 세트리스트', mark: '별', requirements: [req('q_busking', 8, '버스킹 누적 8회', '메인 스트리트 버스킹 스팟'), req('lookbook_entries', 3, '룩북 코디 3종', '캐릭터 아틀리에')] },
  ] },
  { residentId: 'moturi', location: 'cafe', palette: ['#2c2521', '#6c4b35', '#bd8058', '#f1d2a1'], scenes: [
    { title: '첫 잔의 온도', invitation: '영업 전, 오늘의 첫 커피를 같이 내려요.', memory: '주전자 물줄기가 가늘어질수록 카페 안의 아침이 또렷해졌다.', dialogue: '서두르지 않는 사람이 좋은 온도를 찾아요.', keepsake: '첫 추출 원두 한 알', mark: '콩', requirements: [req('q_cafe', 1, '카페 알바 1회', '카페 「모퉁이」')] },
    { title: '단골 메뉴 실험', invitation: '수확한 재료로 골목에 없는 한 잔을 연구해요.', memory: '서툰 조합도 서로 한 모금씩 맛보며 이름을 붙였다.', dialogue: '완벽한 레시피보다 다시 만들고 싶은 기억이 중요하죠.', keepsake: '손글씨 시음표', mark: '잔', requirements: [req('q_cafe', 3, '카페 알바 누적 3회', '카페 「모퉁이」'), req('cooking_total', 3, '골목 요리 3회', '모퉁이 골목 주방')] },
    { title: '불 꺼진 카페의 테이블', invitation: '마지막 손님이 간 뒤 단골잔 두 개를 나란히 꺼내요.', memory: '정리된 테이블에서 서로의 가장 조용했던 하루를 들었다.', dialogue: '문을 닫고 나서야 할 수 있는 이야기도 있어요.', keepsake: '두 번째 단골잔 받침', mark: '온', requirements: [req('q_cafe', 8, '카페 알바 누적 8회', '카페 「모퉁이」'), req('cooking_recipes', 5, '요리법 5종 발견', '골목 주방')] },
  ] },
  { residentId: 'sallim', location: 'home', palette: ['#344238', '#738461', '#c7a46c', '#f4e2b8'], scenes: [
    { title: '창가 한 뼘 재기', invitation: '오래 머물고 싶은 자리를 함께 찾아요.', memory: '줄자보다 햇살의 움직임으로 의자 자리를 정했다.', dialogue: '좋은 자리는 숫자보다 몸이 먼저 알아.', keepsake: '햇살 눈금 리본', mark: '집', requirements: [req('q_place', 3, '가구 3점 배치', '내 집')] },
    { title: '오래된 의자의 새 표정', invitation: '버려질 뻔한 의자에 어울리는 색을 골라요.', memory: '긁힌 나뭇결을 숨기지 않고 이야기처럼 남겨 두었다.', dialogue: '흠집까지 살려야 그 물건만의 얼굴이 되지.', keepsake: '원목 색 견본', mark: '결', requirements: [req('home_unique_items', 8, '서로 다른 가구 8종', '내 집'), req('furniture_reform_saves', 1, '가구 리폼 1회', '가구 리폼 공방')] },
    { title: '열 사람의 작은 식탁', invitation: '좁은 방에도 모두 앉을 수 있는 배치를 실험해요.', memory: '의자를 조금씩 비껴 놓자 작은 방 한가운데 이야기가 흐를 길이 생겼다.', dialogue: '집은 물건보다 사람이 들어올 틈으로 완성돼.', keepsake: '사랑방 배치 도면', mark: '틈', requirements: [req('home_categories', 5, '가구 분류 5종', '내 집'), req('furniture_reform_combos', 12, '리폼 조합 12종', '가구 리폼 공방')] },
  ] },
  { residentId: 'jun', location: 'shop', palette: ['#1f2b43', '#47698a', '#8fc7d8', '#f5dc9b'], scenes: [
    { title: '교대 전 삼각김밥', invitation: '가장 한산한 시간, 편의점 앞 의자에 잠깐 앉아요.', memory: '봉지를 뜯는 소리 사이로 오늘의 별것 아닌 사건을 나눴다.', dialogue: '이런 얘기 들어 주는 게 진짜 야간 복지예요.', keepsake: '1+1 행사 스티커', mark: '밤', requirements: [req('bungeo_eat', 1, '골목 간식 1회', '붕어빵 포차')] },
    { title: '심야 진열대 탐험', invitation: '둘만의 기준으로 가장 재미있는 신상품을 골라요.', memory: '맛보다 포장지 문구를 읽느라 한참 웃었다.', dialogue: '실패한 신상도 같이 먹으면 에피소드가 되죠.', keepsake: '심야 신상 평가표', mark: '신', requirements: [req('bungeo_eat', 3, '골목 간식 누적 3회', '붕어빵 포차'), req('photo_taken', 3, '골목 사진 3장', '네컷 작업실')] },
    { title: '첫차까지 십 분', invitation: '퇴근 뒤 첫차를 기다리며 서로의 내일을 응원해요.', memory: '빈 정류장 벤치에서 나눈 십 분이 긴 야간 근무의 마침표가 되었다.', dialogue: '내일도 여기 불은 켜져 있을 거예요. 너무 걱정 마요.', keepsake: '첫차 시간 메모', mark: '빛', requirements: [req('bungeo_eat', 8, '골목 간식 누적 8회', '붕어빵 포차'), req('neighborhood_tour_stops', 6, '골목 소풍 6곳', '골목 소풍 안내소')] },
  ] },
  { residentId: 'choco', location: 'shop', palette: ['#54304a', '#a85c75', '#ef9e8f', '#ffe2a8'], scenes: [
    { title: '오늘 기분 한 색', invitation: '오늘 마음과 가장 닮은 색을 같이 골라요.', memory: '정답 없는 색 이름을 붙이며 평범한 하루가 작은 팔레트가 되었다.', dialogue: '지금 기분은 복숭아 탄산색이에요!', keepsake: '복숭아색 젤리 띠지', mark: '색', requirements: [req('fashion_dye', 1, '의상 염색 1회', '캐릭터 아틀리에')] },
    { title: '세상에 없는 젤리 봉지', invitation: '좋아하는 코디를 젤리 패키지로 디자인해요.', memory: '룩북의 색을 조합해 둘만의 가상 신상품을 완성했다.', dialogue: '진짜 출시되면 첫 봉지는 절대 안 먹고 간직할래요.', keepsake: '가상 신상 패키지', mark: '젤', requirements: [req('fashion_dye', 3, '의상 염색 누적 3회', '캐릭터 아틀리에'), req('lookbook_entries', 3, '룩북 코디 3종', '골목 룩북')] },
    { title: '단종 맛 원정대', invitation: '사라지기 전 좋아했던 맛의 흔적을 골목에서 찾아요.', memory: '빈 진열대 앞에서도 그 맛을 좋아했던 이유를 오래 이야기했다.', dialogue: '찾지 못해도 괜찮아요. 같이 찾은 밤은 안 사라지니까.', keepsake: '단종 맛 원정 지도', mark: '탐', requirements: [req('lookbook_stars', 12, '룩북 별 12개', '골목 룩북'), req('pet_accessories', 5, '펫 장식 5종', '펫샵')] },
  ] },
  { residentId: 'ille', location: 'forest', palette: ['#182f3c', '#326069', '#6aa58d', '#d8e4a2'], scenes: [
    { title: '새벽 냉장고의 박자', invitation: '조용한 시간에만 들리는 골목 소리를 찾아요.', memory: '냉장고 모터와 먼 발자국을 세며 새벽의 느린 박자를 알게 됐다.', dialogue: '조용한 게 아니라 작은 소리가 가까워지는 시간이죠.', keepsake: '새벽 소리 체크표', mark: '새', requirements: [req('q_forest', 45, '숲길 45초 산책', '경의선 숲길')] },
    { title: '첫차 전 아이스크림', invitation: '가장 이상한 맛 하나를 골라 숲길 벤치로 가요.', memory: '차가운 한입 뒤에 떠오르는 엉뚱한 이야기를 번갈아 말했다.', dialogue: '예상 밖의 맛이 잠을 깨우는 데는 최고예요.', keepsake: '반값 아이스크림 막대', mark: '달', requirements: [req('q_forest', 120, '숲길 누적 120초', '경의선 숲길'), req('fishing_total', 3, '물가 생물 3회 만나기', '물정원')] },
    { title: '행운을 반으로', invitation: '일곱 번째 행운을 누구와 나눌지 정하는 밤이에요.', memory: '작은 스티커를 반듯하게 붙이고 서로에게 필요한 행운을 적었다.', dialogue: '행운은 나누면 줄어드는 게 아니라 갈 곳이 생겨요.', keepsake: '반쪽 별 스티커', mark: '행', requirements: [req('q_forest', 300, '숲길 누적 300초', '경의선 숲길'), req('pet_outing_stamps', 6, '펫 산책 표식 6개', '동행 산책 수첩')] },
  ] },
  { residentId: 'park', location: 'station', palette: ['#20354b', '#3f6380', '#d19a51', '#f1e0b3'], scenes: [
    { title: '9번 출구 설명법', invitation: '지도 없이도 안심되는 길 안내를 연습해요.', memory: '간판과 빵 냄새를 이정표 삼아 누구나 기억할 길을 만들었다.', dialogue: '정확한 길보다 기억나는 길이 더 친절할 때가 있어요.', keepsake: '9번 출구 방향표', mark: '길', requirements: [req('open_map', 1, '마을 지도 열기', '하단 지도 버튼')] },
    { title: '분실물의 하루', invitation: '주인을 기다리는 물건들의 사연을 함께 상상해요.', memory: '낡은 우산 하나에도 누군가의 비 오는 귀갓길이 담겨 있었다.', dialogue: '돌아갈 곳을 표시해 두는 일이 제 일의 절반입니다.', keepsake: '분실물 꼬리표', mark: '표', requirements: [req('residents_met', 5, '주민 5명 만나기', '마을 곳곳'), req('neighborhood_tour_postcards', 2, '소풍 엽서 2장', '골목 소풍 안내소')] },
    { title: '막차 뒤 안전 점검', invitation: '사람이 없는 플랫폼의 마지막 약속을 확인해요.', memory: '꺼진 안내판 아래에서도 누군가의 내일을 위해 손잡이를 한 번 더 살폈다.', dialogue: '보이지 않는 곳에서 지키는 약속이 마을을 움직여요.', keepsake: '막차 점검 펀치', mark: '약', requirements: [req('residents_met', 10, '주민 10명 만나기', '마을 곳곳'), req('village_request_story_routes', 1, '연속 의뢰 1편 완결', '골목 의뢰 게시판')] },
  ] },
  { residentId: 'noeul', location: 'studio', palette: ['#472b58', '#965e8d', '#e7866f', '#ffd19a'], scenes: [
    { title: '노을빛 한 방울', invitation: '몇 분만 머무는 하늘색을 사진에 붙잡아요.', memory: '주황과 보라 사이의 이름 없는 색을 함께 발견했다.', dialogue: '혼자 봤으면 그냥 지나쳤을 색이에요.', keepsake: '노을빛 물감 점', mark: '빛', requirements: [req('photo_taken', 1, '네컷 사진 1장', '네컷 작업실')] },
    { title: '골목 색 지도', invitation: '간판과 옷, 벽에서 오늘의 색 세 가지를 모아요.', memory: '익숙한 거리를 색으로 다시 읽자 처음 온 동네처럼 보였다.', dialogue: '색을 찾는 동안은 평범한 벽도 전시장이 돼요.', keepsake: '세 색의 골목 팔레트', mark: '화', requirements: [req('photo_taken', 3, '네컷 사진 3장', '네컷 작업실'), req('fashion_dye', 3, '의상 염색 3회', '캐릭터 아틀리에')] },
    { title: '비어 있던 벽의 한 칸', invitation: '완성 직전 벽화에 오늘의 작은 실루엣을 남겨요.', memory: '그림 구석의 두 사람과 한 마리 그림자가 지금 골목의 표정이 되었다.', dialogue: '완벽해서가 아니라 우리가 있어서 완성이에요.', keepsake: '벽화 색 조각', mark: '벽', requirements: [req('photo_backdrops', 3, '사진 배경 3종', '네컷 작업실'), req('lookbook_unique', 6, '서로 다른 룩 6종', '골목 룩북')] },
  ] },
  { residentId: 'imo', location: 'stall', palette: ['#4a2422', '#a54835', '#dc804e', '#f6d08b'], scenes: [
    { title: '국물 먼저 한 컵', invitation: '쌀쌀한 날 포차 안쪽 자리를 비워 두셨어요.', memory: '주문보다 먼저 건넨 국물 한 컵에 낯선 하루가 천천히 녹았다.', dialogue: '손부터 녹여. 이야기는 그다음이야.', keepsake: '어묵 국물 종이컵 띠', mark: '온', requirements: [req('bungeo_eat', 3, '골목 간식 누적 3회', '붕어빵 포차')] },
    { title: '비밀 양념 반 숟갈', invitation: '영업이 끝난 뒤 내일의 양념을 같이 저어요.', memory: '레시피보다 손님 표정을 읽는 법을 오래 들었다.', dialogue: '매운맛도 마음도 사람마다 딱 좋은 만큼이 달라.', keepsake: '반 숟갈 계량표', mark: '맛', requirements: [req('bungeo_eat', 6, '골목 간식 누적 6회', '붕어빵 포차'), req('cooking_recipes', 3, '요리법 3종', '골목 주방')] },
    { title: '메뉴판 뒤의 식구들', invitation: '오래된 메뉴판 뒤에 새 감사 메모를 남겨요.', memory: '돈보다 먼저 갚은 마음들이 겹겹이 포차의 벽이 되어 있었다.', dialogue: '자주 온다고 다 식구는 아니야. 서로 기억해야 식구지.', keepsake: '포차 식구 메모', mark: '식', requirements: [req('bungeo_eat', 10, '골목 간식 누적 10회', '붕어빵 포차'), req('home_visits', 5, '집들이 추억 5명', '내 집 방문 앨범')] },
  ] },
  { residentId: 'dongsu', location: 'forest', palette: ['#273e33', '#55745b', '#9ca56c', '#e3d4a1'], scenes: [
    { title: '나무 하나의 이름', invitation: '오늘은 목적지 대신 나무 한 그루를 정해 걸어요.', memory: '매일 지나던 풍경에 이름 하나가 생기자 이웃처럼 반가워졌다.', dialogue: '이름을 부르면 길도 대답하는 것 같지요.', keepsake: '은행잎 이름표', mark: '잎', requirements: [req('q_forest', 60, '숲길 누적 60초', '경의선 숲길')] },
    { title: '철길 자갈의 시간', invitation: '숲길 아래 남은 옛 기찻길 흔적을 찾아요.', memory: '작은 자갈 하나를 사이에 두고 사라진 역과 다시 자란 나무를 이야기했다.', dialogue: '사라진 길도 천천히 걸으면 다시 이어져요.', keepsake: '기찻길 탁본 조각', mark: '길', requirements: [req('q_forest', 180, '숲길 누적 180초', '경의선 숲길'), req('garden_species', 3, '정원 식물 3종', '옥상 씨앗 연구소')] },
    { title: '계절을 남기는 산책', invitation: '동행 친구와 같은 길을 가장 느린 속도로 걸어요.', memory: '재촉하지 않는 발걸음 셋이 숲길의 작은 변화들을 빠짐없이 주웠다.', dialogue: '오늘은 길이 아니라 계절을 데리고 돌아갑시다.', keepsake: '세 발자국 산책 표식', mark: '봄', requirements: [req('q_forest', 360, '숲길 누적 360초', '경의선 숲길'), req('pet_outing_stamps', 6, '펫 산책 표식 6개', '동행 산책 수첩')] },
  ] },
] as const;

const TRUST_BY_ACT = [30, 50, 80] as const;

export const RESIDENT_RENDEZVOUS: readonly ResidentRendezvousDef[] = SERIES.flatMap((series) => (
  series.scenes.map((scene, index): ResidentRendezvousDef => ({
    ...scene,
    id: `${series.residentId}_${index + 1}`,
    residentId: series.residentId,
    act: (index + 1) as ResidentRendezvousAct,
    trust: TRUST_BY_ACT[index]!,
    location: series.location,
    palette: series.palette,
  }))
));

export const RESIDENT_RENDEZVOUS_BY_ID = new Map(RESIDENT_RENDEZVOUS.map((scene) => [scene.id, scene]));

export interface ResidentRendezvousState {
  version: 1;
  recordedIds: string[];
  trackedResidentId: string | null;
}

export interface ResidentRendezvousView extends ResidentRendezvousDef {
  recorded: boolean;
  trustMet: boolean;
  previousMet: boolean;
  requirementsMet: boolean;
  ready: boolean;
  requirementViews: Array<ResidentRendezvousRequirement & { progress: number; done: boolean }>;
}

export interface ResidentRendezvousProgress {
  recorded: number;
  total: number;
  ready: number;
  keepsakes: number;
  startedResidents: number;
  completedResidents: number;
}

const metric = (quests: QuestState, key: string): number => {
  const value = quests.lifetimeCounts?.[key];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

export function normalizeResidentRendezvousState(raw: unknown): ResidentRendezvousState {
  const value = (raw ?? {}) as Partial<ResidentRendezvousState>;
  const recordedIds = Array.isArray(value.recordedIds)
    ? [...new Set(value.recordedIds.filter((id): id is string => typeof id === 'string' && RESIDENT_RENDEZVOUS_BY_ID.has(id)))]
    : [];
  const trackedResidentId = typeof value.trackedResidentId === 'string' && RESIDENTS.some((resident) => resident.id === value.trackedResidentId)
    ? value.trackedResidentId : null;
  return { version: 1, recordedIds, trackedResidentId };
}

export function residentRendezvousViews(
  residentId: string, state: ResidentRendezvousState, trust: TrustState, quests: QuestState,
): ResidentRendezvousView[] {
  const recorded = new Set(state.recordedIds);
  return RESIDENT_RENDEZVOUS.filter((scene) => scene.residentId === residentId).map((scene) => {
    const requirementViews = scene.requirements.map((requirement) => {
      const progress = metric(quests, requirement.key);
      return { ...requirement, progress: Math.min(progress, requirement.goal), done: progress >= requirement.goal };
    });
    const isRecorded = recorded.has(scene.id);
    const previousMet = scene.act === 1 || recorded.has(`${scene.residentId}_${scene.act - 1}`);
    const trustMet = trustOf(trust, scene.residentId) >= scene.trust;
    const requirementsMet = requirementViews.every((requirement) => requirement.done);
    return { ...scene, recorded: isRecorded, previousMet, trustMet, requirementsMet, ready: !isRecorded && previousMet && trustMet && requirementsMet, requirementViews };
  });
}

export function residentRendezvousProgress(
  state: ResidentRendezvousState, trust: TrustState, quests: QuestState,
): ResidentRendezvousProgress {
  const views = RESIDENTS.flatMap((resident) => residentRendezvousViews(resident.id, state, trust, quests));
  const recordedByResident = new Map<string, number>();
  for (const view of views) if (view.recorded) recordedByResident.set(view.residentId, (recordedByResident.get(view.residentId) ?? 0) + 1);
  return {
    recorded: views.filter((view) => view.recorded).length,
    total: views.length,
    ready: views.filter((view) => view.ready).length,
    keepsakes: views.filter((view) => view.recorded).length,
    startedResidents: [...recordedByResident.values()].filter((count) => count > 0).length,
    completedResidents: [...recordedByResident.values()].filter((count) => count === 3).length,
  };
}

export type RecordRendezvousResult = 'recorded' | 'not-ready' | 'unknown';

export class ResidentRendezvousStore {
  private state: ResidentRendezvousState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-resident-rendezvous-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeResidentRendezvousState(raw);
    this.persist();
  }

  get(): ResidentRendezvousState { return this.state; }
  views(residentId: string, trust: TrustState, quests: QuestState): ResidentRendezvousView[] { return residentRendezvousViews(residentId, this.state, trust, quests); }
  progress(trust: TrustState, quests: QuestState): ResidentRendezvousProgress { return residentRendezvousProgress(this.state, trust, quests); }

  record(sceneId: string, trust: TrustState, quests: QuestState): RecordRendezvousResult {
    const scene = RESIDENT_RENDEZVOUS_BY_ID.get(sceneId);
    if (!scene) return 'unknown';
    const view = this.views(scene.residentId, trust, quests).find((item) => item.id === sceneId);
    if (!view?.ready) return 'not-ready';
    this.state = { ...this.state, recordedIds: [...this.state.recordedIds, sceneId] };
    this.persist();
    return 'recorded';
  }

  track(residentId: string | null): void {
    this.state = { ...this.state, trackedResidentId: residentId && RESIDENTS.some((resident) => resident.id === residentId) ? residentId : null };
    this.persist();
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
