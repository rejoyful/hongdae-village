import { RESIDENTS, trustOf, type ResidentDef, type TrustState } from './residents';

export interface ResidentStoryChapter {
  threshold: 15 | 50 | 80 | 100;
  title: string;
  memory: string;
  dialogue: string;
}

export interface ResidentRequestDef {
  title: string;
  desc: string;
  registryKey: string;
  goal: number;
  location: string;
  reward: string;
  progressMode?: 'max';
}

export interface ResidentStoryArc {
  motto: string;
  tags: readonly [string, string, string];
  bondReward: string;
  request: ResidentRequestDef;
  chapters: readonly ResidentStoryChapter[];
}

export interface ResidentStoryView extends ResidentStoryChapter {
  unlocked: boolean;
}

/** 주민 서사·개인 부탁 SSOT. 각 관계 장면은 실제 신뢰 단계와 일치한다. */
export const RESIDENT_STORY_ARCS: Readonly<Record<string, ResidentStoryArc>> = {
  haneul: {
    motto: '좋은 노래는 큰 무대보다 오래 남는 마음에서 시작해요.',
    tags: ['버스킹', '새벽 작업', '오래된 티켓'], bondReward: '하늘의 리듬 배지',
    request: { title: '다섯 번째 앙코르', desc: '하늘과 약속한 버스킹을 누적 5번 성공하기', registryKey: 'q_busking', goal: 5, location: '메인 스트리트 버스킹 스팟', reward: '한밤 앙코르 배지' },
    chapters: [
      { threshold: 15, title: '코드 사이 첫인사', memory: '하늘은 관객이 한 명이어도 마지막 곡까지 연주한다고 했다.', dialogue: '한 사람에게 닿으면 그날 공연은 성공한 거예요.' },
      { threshold: 50, title: '비가 그친 뒤의 관객', memory: '소나기 뒤 젖은 의자에 둘이 앉아 새 멜로디의 첫 소절을 들었다.', dialogue: '이 부분은 아직 누구에게도 안 들려줬어요.' },
      { threshold: 80, title: '멈춘 앰프', memory: '앰프가 꺼진 밤, 골목 사람들이 손뼉으로 박자를 이어 주었다.', dialogue: '장비가 멈춰도 같이 부를 사람이 있으면 노래는 계속돼요.' },
      { threshold: 100, title: '첫 티켓의 뒷면', memory: '손때 묻은 티켓 뒷면에는 하늘이 처음 만든 곡의 제목이 적혀 있었다.', dialogue: '제 첫 관객의 자리는 이제 늘 비워 둘게요.' },
    ],
  },
  moturi: {
    motto: '한 잔의 온도는 손님을 기억하는 데서 정해져요.',
    tags: ['핸드드립', '비 오는 날', '단골잔'], bondReward: '모퉁이의 온기 배지',
    request: { title: '단골잔이 놓이는 자리', desc: '카페 모퉁이 알바를 누적 5번 완주하기', registryKey: 'q_cafe', goal: 5, location: '카페 「모퉁이」', reward: '모퉁이 명예 식구 배지' },
    chapters: [
      { threshold: 15, title: '이름을 묻는 주문', memory: '모퉁이 씨는 주문보다 먼저 이름을 물었고 컵에 작게 적어 주었다.', dialogue: '단골의 첫 주문은 메뉴가 아니라 이름이죠.' },
      { threshold: 50, title: '비 오는 날의 자리', memory: '창가 두 번째 자리는 우산을 말리며 골목을 보기 가장 좋은 곳이었다.', dialogue: '비 오는 날엔 서두르지 않아도 괜찮아요.' },
      { threshold: 80, title: '마지막 원두 한 줌', memory: '가게를 처음 열던 날 남겨 둔 원두로 둘만의 작은 시음을 했다.', dialogue: '시작하던 마음은 가끔 다시 내려 마셔야 해요.' },
      { threshold: 100, title: '1호 단골잔', memory: '선반 가장 안쪽의 단골잔 밑면에는 오늘 날짜가 새로 적혔다.', dialogue: '이 잔은 이제 당신이 올 때만 꺼낼게요.' },
    ],
  },
  sallim: {
    motto: '예쁜 집보다 그 사람답게 흐트러질 수 있는 집이 좋아.',
    tags: ['원목 가구', '햇살', '작은 집'], bondReward: '살림의 안목 배지',
    request: { title: '열 가지 살림의 표정', desc: '내 집에 서로 다른 가구 10종 배치하기', registryKey: 'home_unique_items', goal: 10, progressMode: 'max', location: '가구점과 내 집', reward: '햇살 가구 연구가 배지' },
    chapters: [
      { threshold: 15, title: '줄자의 첫 칸', memory: '살림 아주머니는 방의 크기보다 그 안에서 하고 싶은 일을 먼저 물었다.', dialogue: '가구는 자리를 재기 전에 생활부터 재야 해.' },
      { threshold: 50, title: '창가의 한 뼘', memory: '오래된 의자를 고쳐 햇살이 가장 오래 머무는 곳에 함께 놓았다.', dialogue: '새것보다 오래 곁에 있을 물건이 더 귀하지.' },
      { threshold: 80, title: '작은 집의 큰 식탁', memory: '좁은 방에도 둘러앉을 자리는 생긴다는 배치 비법을 배웠다.', dialogue: '사람이 모일 틈만 남기면 집은 넓어져.' },
      { threshold: 100, title: '집 모양 줄자', memory: '손바닥만 한 줄자는 수많은 이웃의 첫 방을 함께 재 온 물건이었다.', dialogue: '다음에 누군가의 시작을 재 줄 때 이걸 같이 써요.' },
    ],
  },
  jun: {
    motto: '야간 근무에도 의외로 웃긴 손님은 꼭 한 명 와요.',
    tags: ['야간 알바', '삼각김밥', '퇴근'], bondReward: '준의 야간 동료 배지',
    request: { title: '퇴근길의 따끈한 봉투', desc: '붕어빵 포차를 누적 5번 이용하기', registryKey: 'bungeo_eat', goal: 5, location: '골목 붕어빵 포차', reward: '야간 간식 원정대 배지' },
    chapters: [
      { threshold: 15, title: '새벽의 1+1', memory: '준은 남은 행사 음료 하나를 건네며 비밀 단골 혜택이라고 웃었다.', dialogue: '이 시간엔 손님보다 동료가 필요하거든요.' },
      { threshold: 50, title: '폐기 도시락의 낭만', memory: '퇴근 전 남은 도시락으로 편의점 앞 작은 만찬을 열었다.', dialogue: '유통기한은 짧아도 오늘 이야기는 오래가겠죠.' },
      { threshold: 80, title: '교대 전 십 분', memory: '가장 지친 시간에 서로의 하루를 정확히 십 분씩 들어 주었다.', dialogue: '누가 기다려 주면 퇴근까지 훨씬 빨라져요.' },
      { threshold: 100, title: '첫 월급날 영수증', memory: '구겨진 영수증에는 준이 가족에게 처음 산 선물 목록이 남아 있었다.', dialogue: '부끄럽지만 이게 제가 버틴 이유예요.' },
    ],
  },
  choco: {
    motto: '새로운 맛을 고르는 건 오늘 기분에 이름을 붙이는 일이에요.',
    tags: ['신상 젤리', '컬러', '작은 모험'], bondReward: '초코의 신상 탐험 배지',
    request: { title: '다섯 색의 오늘', desc: '상의 또는 포인트 염색을 누적 5번 바꾸기', registryKey: 'fashion_dye', goal: 5, location: '캐릭터 아틀리에 · 의상', reward: '컬러 테이스터 배지' },
    chapters: [
      { threshold: 15, title: '반으로 나눈 신상', memory: '초코는 가장 궁금한 젤리를 정확히 반으로 갈라 먼저 맛보게 했다.', dialogue: '새로운 건 같이 먹어야 실패해도 재밌어요.' },
      { threshold: 50, title: '색으로 고른 하루', memory: '그날의 기분을 젤리 색으로 고르는 초코만의 규칙을 배웠다.', dialogue: '오늘은 민트보단 살구색 기분 같아요.' },
      { threshold: 80, title: '단종 예고', memory: '좋아하던 맛의 단종 소식에 둘이 골목 편의점을 전부 찾아다녔다.', dialogue: '사라지기 전에 좋아한다고 많이 말해 둘래요.' },
      { threshold: 100, title: '포도맛 봉지', memory: '마지막 한 봉지는 먹지 않고 추억 상자에 나란히 보관했다.', dialogue: '아껴 둔 맛보다 같이 찾던 밤이 더 선명해요.' },
    ],
  },
  ille: {
    motto: '새벽은 조용한 게 아니라 작은 소리가 잘 들리는 시간이죠.',
    tags: ['새벽 골목', '아이스크림', '행운'], bondReward: '일레의 새벽 친구 배지',
    request: { title: '새벽 세 바퀴', desc: '경의선 숲길에서 누적 180초 산책하기', registryKey: 'q_forest', goal: 180, location: '경의선 숲길', reward: '새벽 산책 동료 배지' },
    chapters: [
      { threshold: 15, title: '새벽 두 시의 손님', memory: '손님 없는 계산대에서 냉장고 모터 소리를 박자 삼아 이야기를 나눴다.', dialogue: '이 시간에 오는 사람은 다 조금씩 사연이 있어요.' },
      { threshold: 50, title: '반값 아이스크림', memory: '행사가 끝나기 전 가장 이상한 맛을 골라 골목 벤치에서 나눠 먹었다.', dialogue: '예상 못 한 맛이 기억에는 더 오래 남더라고요.' },
      { threshold: 80, title: '첫차 전의 산책', memory: '교대가 늦어진 날 첫차가 올 때까지 숲길을 천천히 걸었다.', dialogue: '밤을 다 건너면 아침은 생각보다 가까워요.' },
      { threshold: 100, title: '일곱 번째 스티커', memory: '행운의 일곱 스티커 중 하나가 수첩 안쪽에 조심스레 붙었다.', dialogue: '이제 행운을 반씩 나눠 가진 거예요.' },
    ],
  },
  park: {
    motto: '길을 잃은 사람에게 필요한 건 정답보다 안심되는 목소리입니다.',
    tags: ['첫차', '분실물', '종이 승차권'], bondReward: '박 기장의 길잡이 배지',
    request: { title: '열 번의 스쳐 간 이름', desc: '온라인 이웃과 누적 10번 마주치기', registryKey: 'online_encounter', goal: 10, location: '아이소메트릭 온라인 마을', reward: '환승 안내인 배지' },
    chapters: [
      { threshold: 15, title: '9번 출구의 방향', memory: '박 기장은 지도보다 알아듣기 쉬운 골목 냄새와 간판으로 길을 설명했다.', dialogue: '사람마다 기억하기 쉬운 길은 따로 있어요.' },
      { threshold: 50, title: '돌아온 분실물', memory: '오래 기다리던 우산의 주인이 나타난 날 함께 기뻐했다.', dialogue: '물건도 제 사람에게 돌아가면 표정이 달라 보여요.' },
      { threshold: 80, title: '막차 뒤의 플랫폼', memory: '모든 불이 줄어든 역에서 하루 마지막 안전 점검을 도왔다.', dialogue: '아무도 없을 때 지키는 약속이 진짜 약속이죠.' },
      { threshold: 100, title: '오래된 승차권', memory: '처음 역무원이 된 날의 종이 승차권에는 떨리는 필체로 날짜가 적혀 있었다.', dialogue: '제 첫 출발을 기억하는 표예요. 당신에게 보여 주고 싶었어요.' },
    ],
  },
  noeul: {
    motto: '벽은 막는 것이 아니라 아직 그리지 않은 장면일 때도 있어요.',
    tags: ['벽화', '노을빛', '물감'], bondReward: '노을의 색채 친구 배지',
    request: { title: '골목의 다섯 장면', desc: '네컷 작업실에서 누적 5번 사진 남기기', registryKey: 'photo_taken', goal: 5, location: '네컷 작업실', reward: '골목 장면 수집가 배지' },
    chapters: [
      { threshold: 15, title: '소매 끝의 물감', memory: '노을은 옷에 튄 물감 자국마다 어느 벽에서 왔는지 이야기해 주었다.', dialogue: '지워지지 않는 자국은 작은 지도 같아요.' },
      { threshold: 50, title: '주황과 보라 사이', memory: '해가 지는 몇 분 동안만 볼 수 있는 색을 함께 섞었다.', dialogue: '정답 없는 색을 같이 찾는 사람이 생겼네요.' },
      { threshold: 80, title: '비어 있던 한 칸', memory: '완성 직전의 벽화 한쪽에 둘의 작은 실루엣을 남겼다.', dialogue: '이 그림에 당신이 없으면 오늘 골목이 아니잖아요.' },
      { threshold: 100, title: '마른 물감 조각', memory: '첫 벽화에서 떨어진 물감 조각은 포기하지 않았던 계절의 흔적이었다.', dialogue: '완성된 그림보다 버티던 시간이 더 소중할 때가 있어요.' },
    ],
  },
  imo: {
    motto: '따뜻한 국물 한 컵이면 낯선 사람도 잠깐은 식구야.',
    tags: ['포차', '어묵 국물', '오래된 메뉴판'], bondReward: '포차 이모의 식구 배지',
    request: { title: '열 봉지의 겨울', desc: '붕어빵 포차를 누적 10번 이용하기', registryKey: 'bungeo_eat', goal: 10, location: '골목 붕어빵 포차', reward: '골목 간식 대장 배지' },
    chapters: [
      { threshold: 15, title: '국물은 서비스', memory: '포차 이모는 주문하지 않아도 추워 보인다며 어묵 국물을 먼저 내주었다.', dialogue: '손부터 녹이고 천천히 골라, 안 도망가.' },
      { threshold: 50, title: '원조라는 말', memory: '수많은 원조 간판 사이에서 오래 버틴 비결은 손님 이름을 기억하는 것이라 했다.', dialogue: '맛도 중요하지만 다시 온 사람을 알아봐야 진짜 장사지.' },
      { threshold: 80, title: '비밀 양념 한 숟갈', memory: '영업이 끝난 뒤 다음 날 양념을 함께 저으며 맵기 비율을 배웠다.', dialogue: '레시피보다 사람 표정 보고 한 숟갈 덜 넣는 게 비법이야.' },
      { threshold: 100, title: '십 년 된 메뉴판', memory: '낡은 메뉴판 뒤에는 외상값 대신 남긴 감사 메모들이 빼곡했다.', dialogue: '돈보다 먼저 갚는 마음도 있는 법이더라.' },
    ],
  },
  dongsu: {
    motto: '빨리 가면 길만 남고 천천히 가면 계절이 남아요.',
    tags: ['숲길', '옛 기찻길', '느린 아침'], bondReward: '동수의 산책 벗 배지',
    request: { title: '다섯 분의 느린 아침', desc: '경의선 숲길에서 누적 300초 산책하기', registryKey: 'q_forest', goal: 300, location: '경의선 숲길', reward: '기찻길 기억지기 배지' },
    chapters: [
      { threshold: 15, title: '천천히 걷는 법', memory: '동수 할아버지는 목적지를 묻지 않고 오늘 나무 색부터 보라고 했다.', dialogue: '걷는 건 도착하려고만 하는 일이 아니에요.' },
      { threshold: 50, title: '기찻길이던 시절', memory: '벤치 아래 희미한 철길 흔적을 따라 옛 동네 이야기를 들었다.', dialogue: '사라진 길도 기억 속에서는 계속 이어지지.' },
      { threshold: 80, title: '나무 이름 열 개', memory: '매일 지나던 나무들이 저마다 다른 이름과 계절을 가졌다는 걸 배웠다.', dialogue: '이름을 알면 풍경이 이웃이 돼요.' },
      { threshold: 100, title: '작은 기찻길 자갈', memory: '손바닥 위의 자갈은 숲길이 철길이던 시간을 조용히 품고 있었다.', dialogue: '오래 걸어 준 사람에게 이 길의 기억을 맡기고 싶어요.' },
    ],
  },
};

export function residentStoryArc(residentId: string): ResidentStoryArc | null {
  return RESIDENT_STORY_ARCS[residentId] ?? null;
}

export function residentStoryViews(residentId: string, trust: number): ResidentStoryView[] {
  const arc = residentStoryArc(residentId);
  return arc?.chapters.map((chapter) => ({ ...chapter, unlocked: trust >= chapter.threshold })) ?? [];
}

export function latestResidentStory(residentId: string, trust: number): ResidentStoryChapter | null {
  const unlocked = residentStoryViews(residentId, trust).filter((chapter) => chapter.unlocked);
  return unlocked[unlocked.length - 1] ?? null;
}

export function residentStoryProgress(state: TrustState): { unlocked: number; total: number; completedResidents: number } {
  let unlocked = 0;
  let total = 0;
  let completedResidents = 0;
  for (const resident of RESIDENTS) {
    const views = residentStoryViews(resident.id, trustOf(state, resident.id));
    unlocked += views.filter((chapter) => chapter.unlocked).length;
    total += views.length;
    if (views.length > 0 && views.every((chapter) => chapter.unlocked)) completedResidents += 1;
  }
  return { unlocked, total, completedResidents };
}

export function residentTrustMetricKey(residentId: string): string {
  return `resident_${residentId}_trust`;
}

export function residentTrustMetrics(state: TrustState): Record<string, number> {
  return Object.fromEntries(RESIDENTS.map((resident) => [residentTrustMetricKey(resident.id), trustOf(state, resident.id)]));
}

/** 퀘스트 생성 순서와 주민 로스터가 항상 일치하도록 제공한다. */
export function residentStoryEntries(): Array<{ resident: ResidentDef; arc: ResidentStoryArc; index: number }> {
  return RESIDENTS.flatMap((resident, index) => {
    const arc = residentStoryArc(resident.id);
    return arc ? [{ resident, arc, index }] : [];
  });
}
