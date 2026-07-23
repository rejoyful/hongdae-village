import type { QuestState } from '../questProgress';

export type StarterCompassRouteId = 'style' | 'home' | 'companion' | 'neighbor' | 'maker' | 'explorer';

export interface StarterCompassRequirement {
  key: string;
  mark: string;
  label: string;
  location: string;
}

export interface StarterCompassRouteDef {
  id: StarterCompassRouteId;
  code: string;
  mark: string;
  title: string;
  description: string;
  color: string;
  reward: string;
  mentorName: string;
  mentorRole: string;
  welcomeLetter: string;
  keepsakeNote: string;
  required: number;
  requirements: readonly [StarterCompassRequirement, StarterCompassRequirement, StarterCompassRequirement];
}

export interface StarterCompassRequirementView extends StarterCompassRequirement {
  current: number;
  complete: boolean;
}

export interface StarterCompassRouteView extends Omit<StarterCompassRouteDef, 'requirements'> {
  requirements: StarterCompassRequirementView[];
  completed: number;
  complete: boolean;
  progressPct: number;
  next: StarterCompassRequirementView | null;
}

export interface StarterCompassPreferenceState {
  version: 3;
  selectedRouteId: StarterCompassRouteId | null;
  claimedRouteIds: StarterCompassRouteId[];
  featuredRouteId: StarterCompassRouteId | null;
  claimedMentorChapterIds: string[];
  featuredMentorChapterIds: string[];
  mentorReplayCounts: Record<string, number>;
}

export type StarterCompassConciergeStage = 'choose' | 'first-step' | 'one-left' | 'complete' | 'all-complete';

export interface StarterCompassConciergeView {
  stage: StarterCompassConciergeStage;
  route: StarterCompassRouteView | null;
  selected: boolean;
  next: StarterCompassRequirementView | null;
  alternatives: StarterCompassRequirementView[];
  suggestedRoute: StarterCompassRouteView | null;
}

export interface StarterCompassKeepsakeProgress {
  claimed: number;
  featured: number;
  claimedRouteIds: StarterCompassRouteId[];
  featuredRouteId: StarterCompassRouteId | null;
  mentorChapters: number;
  mentorRoutes: number;
  mentorRouteIds: StarterCompassRouteId[];
  featuredMentorScenes: number;
  mentorReplays: number;
}

export interface StarterMentorRequirement {
  key: string;
  goal: number;
  mark: string;
  label: string;
  location: string;
}

export interface StarterMentorChapter {
  id: string;
  routeId: StarterCompassRouteId;
  chapter: 1 | 2 | 3;
  code: string;
  title: string;
  subtitle: string;
  story: string;
  closing: string;
  requirements: readonly [StarterMentorRequirement, StarterMentorRequirement];
}

export interface StarterMentorRequirementView extends StarterMentorRequirement {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface StarterMentorChapterView extends Omit<StarterMentorChapter, 'requirements'> {
  requirements: StarterMentorRequirementView[];
  complete: boolean;
  available: boolean;
  claimed: boolean;
  featured: boolean;
  replayCount: number;
}

export type StarterCompassClaimResult = 'claimed' | 'already' | 'not-ready' | 'missing';
export type StarterCompassFeatureResult = 'featured' | 'cleared' | 'locked' | 'missing';
export type StarterMentorClaimResult = 'claimed' | 'already' | 'route-locked' | 'previous' | 'not-ready' | 'missing';

const req = (key: string, mark: string, label: string, location: string): StarterCompassRequirement => ({
  key, mark, label, location,
});

/**
 * 첫날부터 동시에 열리는 여섯 플레이 성향. 세 칸을 전부 강요하지 않고 두 칸만 채우면
 * 한 방향을 찾은 것으로 본다. 모든 판정은 평생 기록을 읽어 선택 전 행동도 소급 인정한다.
 */
export const STARTER_COMPASS_ROUTES: readonly StarterCompassRouteDef[] = [
  {
    id: 'style', code: 'STYLE', mark: '옷', title: '골목 스타일러', color: '#a77279',
    description: '옷과 색, 사진으로 오늘의 나를 먼저 기록해요.', reward: '첫 코디 견본', required: 2,
    mentorName: '노을', mentorRole: '벽화 화가',
    welcomeLetter: '옷도 벽화처럼 오늘의 색을 남기는 일이에요. 정답보다 지금 마음에 드는 한 벌을 골라 봐요.',
    keepsakeNote: '주황과 보라 물감이 묻은 작은 패브릭 견본',
    requirements: [
      req('customize_save', '입', '캐릭터 꾸미기 저장', '캐릭터 아틀리에'),
      req('closet_save', '옷', '마음에 든 코디 보관', '아틀리에 · 옷장'),
      req('photo_taken', '찰', '현재 모습 네컷 남기기', '네컷 작업실'),
    ],
  },
  {
    id: 'home', code: 'HOME', mark: '집', title: '포근한 집주인', color: '#9a785d',
    description: '작은 방에 내가 돌아오고 싶은 첫 자리를 만들어요.', reward: '첫 방 열쇠표', required: 2,
    mentorName: '살림 아주머니', mentorRole: '가구점 살림 사장',
    welcomeLetter: '빈 방은 부족한 방이 아니야. 네가 좋아할 자리를 천천히 기다리는 넓은 여백이지.',
    keepsakeNote: '첫 가구의 자리를 다시 찾게 해 주는 집 모양 열쇠표',
    requirements: [
      req('visit_home', '문', '내 집 처음 방문', '주택가 · 나의 집'),
      req('visit_shop', '장', '살림 쇼룸 둘러보기', '살림 가구 쇼룸'),
      req('q_place', '놓', '가구 한 점 배치', '내 집 · 꾸미기 모드'),
    ],
  },
  {
    id: 'companion', code: 'PET', mark: '발', title: '다정한 동행인', color: '#788867',
    description: '작은 친구와 먹고 놀며 서로의 신호를 배워요.', reward: '첫 발자국 태그', required: 2,
    mentorName: '동수 할아버지', mentorRole: '숲길 산책러',
    welcomeLetter: '작은 발의 속도에 맞추면 전에는 지나쳤던 계절도 보인답니다. 먼저 기다리는 법부터 배워 봅시다.',
    keepsakeNote: '두 걸음 사이에 작은 한 걸음을 새긴 산책 태그',
    requirements: [
      req('pet_adopt', '가', '동행 친구 입양', '펫샵 「멍냥이네」'),
      req('pet_feed', '밥', '먹이 한 번 챙기기', '펫샵 · 돌봄'),
      req('pet_play', '놀', '같이 한 번 놀기', '펫샵 · 돌봄'),
    ],
  },
  {
    id: 'neighbor', code: 'SOCIAL', mark: '이', title: '골목의 이웃', color: '#6f8190',
    description: '인사와 작은 도움으로 이름을 기억하는 사이가 돼요.', reward: '새 이웃 명찰 조각', required: 2,
    mentorName: '모퉁이 씨', mentorRole: '카페 모퉁이 사장',
    welcomeLetter: '단골은 많이 주문한 사람이 아니라 서로의 자리를 기억하는 사람이에요. 첫 잔은 제가 비워 둘게요.',
    keepsakeNote: '따뜻한 잔 자국과 새 이웃의 이름을 함께 적은 명찰 조각',
    requirements: [
      req('resident_greet', '안', '이름 있는 주민과 인사', '마을 주민 이름표 근처'),
      req('q_cafe', '일', '카페 일을 한 번 돕기', '카페 「모퉁이」'),
      req('q_emote', '손', '이모트로 마음 전하기', '어디서나 · E'),
    ],
  },
  {
    id: 'maker', code: 'LIFE', mark: '손', title: '손끝 생활가', color: '#91815d',
    description: '심고, 낚고, 요리하며 손에 남는 하루를 골라요.', reward: '생활 재료표', required: 2,
    mentorName: '포차 이모', mentorRole: '포차 골목 사장',
    welcomeLetter: '처음부터 솜씨 좋을 필요 없어. 손에 남은 흙이든 국물 냄새든 오늘 해 본 게 네 레시피가 되는 거야.',
    keepsakeNote: '씨앗·물결·따뜻한 한 접시를 세 칸에 그린 생활 재료표',
    requirements: [
      req('garden_planted', '싹', '첫 씨앗 심기', '옥상 씨앗 연구소'),
      req('fishing_total', '물', '첫 물결 만나기', '세 물가 · 낚시 수첩'),
      req('cooking_total', '접', '첫 메뉴 완성하기', '모퉁이 골목 주방'),
    ],
  },
  {
    id: 'explorer', code: 'DISCOVER', mark: '별', title: '반짝임 탐험가', color: '#756d91',
    description: '지도를 펴고 골목과 외곽의 숨은 기록을 찾아요.', reward: '첫 탐험 핀', required: 2,
    mentorName: '박 기장', mentorRole: '역무원',
    welcomeLetter: '처음 가는 길도 돌아오는 표식 하나면 충분합니다. 위험한 길은 직접 고를 때만 열리니 안심하세요.',
    keepsakeNote: '현재 위치와 안전한 귀환길을 함께 가리키는 황동 탐험 핀',
    requirements: [
      req('open_map', '지', '마을 지도 열기', '하단 지도 버튼 또는 M'),
      req('sparkle_collect', '빛', '숨은 반짝이 발견', '마을 골목과 숲길'),
      req('monster_kill', '숲', '외곽 생태 첫 정리', '동쪽 외곽숲'),
    ],
  },
] as const;

const mentorReq = (
  key: string, goal: number, mark: string, label: string, location: string,
): StarterMentorRequirement => ({ key, goal, mark, label, location });

const mentorChapter = (
  routeId: StarterCompassRouteId,
  chapter: 1 | 2 | 3,
  title: string,
  subtitle: string,
  story: string,
  closing: string,
  requirements: readonly [StarterMentorRequirement, StarterMentorRequirement],
): StarterMentorChapter => ({
  id: `${routeId}_mentor_${chapter}`, routeId, chapter,
  code: `${routeId.toUpperCase()} · ${String(chapter).padStart(2, '0')}`,
  title, subtitle, story, closing, requirements,
});

/**
 * 환영 소포 이후 이어지는 18개의 초반 멘토 에피소드.
 * 각 장은 두 생활 기록만 읽으며, 다른 루트를 고르거나 늦게 돌아와도 진행이 사라지지 않는다.
 */
export const STARTER_MENTOR_CHAPTERS: readonly StarterMentorChapter[] = [
  mentorChapter('style', 1, '세 날의 다른 표정', '노을과 만드는 작은 코디 보드', '같은 얼굴도 옷장과 카메라 앞에서는 매일 다른 이야기를 골랐어요.', '잘 입는다는 건 많이 갖는 일이 아니라 오늘의 마음을 알아보는 일이래요.', [
    mentorReq('closet_save', 3, '옷', '코디 세 칸 보관하기', '캐릭터 아틀리에 · 옷장'),
    mentorReq('photo_album', 2, '찰', '필름 앨범 두 장 남기기', '네컷 작업실 · 필름 앨범'),
  ]),
  mentorChapter('style', 2, '골목이 건넨 피팅 질문', '정답 대신 변주를 찾는 화보 연습', '의뢰서의 조건은 틀리지 않기 위한 답안이 아니라 새로운 조합을 시작하는 질문이었어요.', '별보다 오래 남는 건 내가 다시 입고 싶은 한 벌이에요.', [
    mentorReq('lookbook_entries', 3, '책', '룩북 의뢰 세 장 기록', '캐릭터 아틀리에 · 골목 룩북'),
    mentorReq('lookbook_unique', 3, '결', '서로 다른 코디 세 벌', '골목 룩북 · 코디 기록'),
  ]),
  mentorChapter('style', 3, '한 사람이 만든 여러 주인공', '취향 전시와 OC 설정집의 첫 합본', '지금의 모습은 하나뿐인 정답이 아니라 앞으로 만들 수많은 주인공 중 첫 장이 되었어요.', '내가 만든 인물들이 서로 다른 골목을 걸어도 모두 내 취향에서 태어났어요.', [
    mentorReq('taste_showcase_entries', 2, '전', '취향 전시 두 주제 기록', '중앙 광장 · 골목 취향 전시회'),
    mentorReq('character_zine_saved', 1, '인', '첫 OC 설정 카드 만들기', '캐릭터 아틀리에 · 캐릭터 설정집'),
  ]),
  mentorChapter('home', 1, '돌아오는 길 끝의 한 칸', '살림 아주머니와 찾는 첫 생활 동선', '가구 다섯 점이 놓이자 빈 방은 물건 창고가 아니라 돌아오고 싶은 순서가 되었어요.', '좋은 방은 보여 주는 방보다 손이 먼저 기억하는 방이에요.', [
    mentorReq('q_place', 5, '놓', '가구 다섯 점 배치', '내 집 · 꾸미기 모드'),
    mentorReq('home_unique_items', 5, '집', '서로 다른 가구 다섯 종', '내 집 · 인테리어 수첩'),
  ]),
  mentorChapter('home', 2, '오래 쓰고 싶은 물건의 색', '점수와 리폼 사이에서 취향 찾기', '낡은 가구의 색을 한 번 바꾸자 방 전체가 새 물건 없이도 다른 목소리를 냈어요.', '점수는 길을 알려 줄 뿐, 마지막 색은 언제나 집주인이 고르는 거예요.', [
    mentorReq('home_score', 35, '온', '홈 스타일 35점', '내 집 · 홈 스타일 카드'),
    mentorReq('furniture_reform_saves', 1, '칠', '첫 가구 리폼 저장', '내 집 · 가구 리폼 공방'),
  ]),
  mentorChapter('home', 3, '내 방이 엽서가 되는 밤', '생활 장면을 보존하는 작은 스튜디오', '오늘의 배치와 동행, 빛을 한 장에 담으니 방은 언제든 다시 펼칠 수 있는 장면이 되었어요.', '완벽한 방이 아니라 기억하고 싶은 방을 남겨요.', [
    mentorReq('home_layout_saves', 1, '도', '첫 홈 레이아웃 보존', '내 집 · 레이아웃 도서관'),
    mentorReq('home_studio_cards', 1, '엽', '첫 홈 스튜디오 카드', '내 집 · 2.5D 홈 스튜디오'),
  ]),
  mentorChapter('companion', 1, '같은 보폭을 찾는 연습', '동수 할아버지와 배우는 기다림', '세 번의 놀이 끝에 작은 친구가 먼저 고개를 들고 다음 차례를 기다려 주었어요.', '친밀도는 서두른 횟수가 아니라 서로 기다려 준 시간의 기록이에요.', [
    mentorReq('max_pet_affinity', 15, '맘', '동행 친밀도 15', '펫샵 · 가족 프로필'),
    mentorReq('pet_play', 3, '놀', '함께 세 번 놀기', '펫샵 · 돌봄'),
  ]),
  mentorChapter('companion', 2, '발바닥이 기억한 두 길', '성격에 맞는 산책 수첩', '같은 골목도 누구와 걷느냐에 따라 냄새와 그늘, 멈추는 자리가 달라졌어요.', '좋은 산책 코스는 먼 길이 아니라 둘 다 다시 걷고 싶은 길이에요.', [
    mentorReq('pet_outing_routes', 2, '길', '산책 코스 두 곳', '펫샵 · 동행 산책 수첩'),
    mentorReq('pet_outing_stamps', 3, '도', '산책 기념 도장 세 개', '동행 산책 수첩'),
  ]),
  mentorChapter('companion', 3, '말보다 먼저 알아들은 신호', '몸짓과 집의 작은 사전', '동행이 좋아하는 자리와 몸짓에 이름을 붙이자 둘만의 짧은 문장이 생겼어요.', '정답을 맞히는 대신 오래 관찰한 마음이 우리만의 언어가 돼요.', [
    mentorReq('pet_signals', 2, '신', '몸짓 두 개 번역', '펫샵 · 마음 번역 수첩'),
    mentorReq('pet_home_memories', 2, '곁', '집 생활 추억 두 장', '내 집 · 동행의 자리'),
  ]),
  mentorChapter('neighbor', 1, '이름을 기억하는 세 자리', '모퉁이 씨의 단골 노트', '세 주민의 이름과 카페의 반복되는 손길이 낯선 골목을 아는 장소로 바꾸었어요.', '단골은 많이 주문한 사람이 아니라 서로의 빈자리를 알아보는 사람이에요.', [
    mentorReq('residents_met', 3, '명', '주민 세 명 만나기', '주민 수첩 · 인연 지도'),
    mentorReq('q_cafe', 3, '잔', '카페 일 세 번 돕기', '카페 「모퉁이」'),
  ]),
  mentorChapter('neighbor', 2, '약속이 된 평범한 오후', '신뢰에서 장면으로 이어지는 관계', '인사를 반복한 이웃과 처음 약속을 남기자 골목의 한 자리가 둘만의 기억이 되었어요.', '관계는 숫자에서 끝나지 않고 함께 있었던 장면으로 기억돼요.', [
    mentorReq('resident_trust_max', 15, '신', '한 주민 신뢰도 15', '주민 수첩 · 관계 앨범'),
    mentorReq('resident_rendezvous_scenes', 1, '약', '첫 주민 약속 장면', '주민 수첩 · 주민 약속'),
  ]),
  mentorChapter('neighbor', 3, '좋아한다고 오래 말하는 법', '응원 리본과 열린 현관', '누군가의 생활을 응원하고 내 방의 문도 열어 두자 골목의 관계가 서로 오가는 길이 되었어요.', '최애는 순위를 세우는 말이 아니라 오래 바라본 마음을 보관하는 방식이에요.', [
    mentorReq('resident_fan_ribbons', 3, '띠', '주민 응원 리본 세 개', '주민 수첩 · 최애 팬북'),
    mentorReq('home_visits', 1, '문', '첫 주민 집들이 추억', '내 집 · 방문 앨범'),
  ]),
  mentorChapter('maker', 1, '흙에서 접시까지 두 번', '포차 이모의 작은 생활 실험', '직접 기른 것을 두 번 수확하고 요리하자 기다림도 레시피의 한 줄이 되었어요.', '잘 만드는 손보다 끝까지 돌본 손이 먼저 생활가가 돼요.', [
    mentorReq('garden_harvest', 2, '싹', '식물 두 번 수확', '옥상 씨앗 연구소'),
    mentorReq('cooking_total', 2, '접', '메뉴 두 번 완성', '모퉁이 골목 주방'),
  ]),
  mentorChapter('maker', 2, '세 잎과 세 물결의 도감', '도시 안의 재료를 오래 보는 법', '서로 다른 잎과 물속 친구를 알아보며 재료는 아이템보다 먼저 살아 있는 이름이 되었어요.', '도감의 빈칸은 실패가 아니라 다음에 만날 것을 남겨 둔 자리예요.', [
    mentorReq('garden_species', 3, '잎', '식물 세 종 수확', '옥상 정원 · 씨앗 서랍'),
    mentorReq('fishing_species', 3, '물', '물가 생물 세 종 발견', '물정원 낚시 수첩'),
  ]),
  mentorChapter('maker', 3, '같은 재료의 다른 계절', '성장 결과 메뉴를 엮는 연구 노트', '같은 이름의 재료도 햇빛과 돌봄에 따라 다른 표정으로 접시 위에 도착했어요.', '레시피는 정답표가 아니라 다음 변주를 기억하는 출발점이에요.', [
    mentorReq('cooking_recipes', 3, '맛', '메뉴 세 종 완성', '골목 주방 · 메뉴 카드'),
    mentorReq('garden_specimens', 3, '결', '성장 결 표본 세 개', '옥상 정원 · 표본함'),
  ]),
  mentorChapter('explorer', 1, '돌아올 표식이 있는 두 권역', '박 기장과 그리는 안전한 첫 지도', '두 권역의 경계를 확인하고 반짝임을 모으자 처음 가는 길에도 돌아올 좌표가 생겼어요.', '탐험은 멀리 가는 용기보다 돌아오는 방법을 아는 데서 시작해요.', [
    mentorReq('safe_districts_discovered', 2, '역', '안전 권역 두 곳 발견', '마을 지도 · 골목 여권'),
    mentorReq('sparkle_collect', 5, '빛', '숨은 반짝이 다섯 개', '마을 골목과 숲길'),
  ]),
  mentorChapter('explorer', 2, '지도에 없던 한 문장', '비밀과 소풍 정류장을 함께 읽기', '숨은 흔적 하나와 소풍길의 세 정류장이 평범한 골목을 이야기의 장소로 바꾸었어요.', '발견은 먼저 도착하는 일이 아니라 남들이 지나친 이유를 오래 보는 일이에요.', [
    mentorReq('alley_secrets_discovered', 1, '비', '골목 비밀 하나 발견', '골목 비밀 수첩'),
    mentorReq('neighborhood_tour_stops', 3, '길', '소풍 정류장 세 곳 기록', '골목 소풍 안내소'),
  ]),
  mentorChapter('explorer', 3, '숲의 이름과 박물관의 자리', '생태 기록이 전시가 되는 마지막 장', '외곽 생태 세 종을 알아보고 생활 기념품을 보존하자 관찰은 마을이 함께 읽는 기록이 되었어요.', '강함만 남기는 탐험보다 무엇을 만났는지 설명할 수 있는 탐험이 오래가요.', [
    mentorReq('monster_species', 3, '숲', '외곽 생태 세 종 발견', '동쪽 외곽숲 · 생태 도감'),
    mentorReq('neighborhood_museum_exhibits', 1, '관', '생활 기념품 하나 보존', '골목 작은 박물관'),
  ]),
] as const;

export const STARTER_MENTOR_CHAPTER_BY_ID = new Map(STARTER_MENTOR_CHAPTERS.map((chapter) => [chapter.id, chapter]));

const count = (state: QuestState, key: string): number => Math.max(0, state.lifetimeCounts?.[key] ?? 0);

export function starterCompassRouteViews(state: QuestState): StarterCompassRouteView[] {
  return STARTER_COMPASS_ROUTES.map((route) => {
    const requirements = route.requirements.map((requirement) => {
      const current = count(state, requirement.key);
      return { ...requirement, current, complete: current >= 1 };
    });
    const completed = requirements.filter((requirement) => requirement.complete).length;
    return {
      ...route,
      requirements,
      completed,
      complete: completed >= route.required,
      progressPct: Math.round((Math.min(completed, route.required) / route.required) * 100),
      next: requirements.find((requirement) => !requirement.complete) ?? null,
    };
  });
}

export function starterCompassMetrics(state: QuestState): {
  starter_routes: number;
  starter_steps: number;
} {
  const routes = starterCompassRouteViews(state);
  return {
    starter_routes: routes.filter((route) => route.complete).length,
    starter_steps: routes.reduce((total, route) => total + route.completed, 0),
  };
}

const STARTER_ROUTE_IDS = new Set<string>(STARTER_COMPASS_ROUTES.map((route) => route.id));

export function normalizeStarterCompassPreference(raw: unknown): StarterCompassPreferenceState {
  const value = (raw ?? {}) as Partial<StarterCompassPreferenceState>;
  const claimedRouteIds = Array.isArray(value.claimedRouteIds)
    ? [...new Set(value.claimedRouteIds.filter((id): id is StarterCompassRouteId => (
      typeof id === 'string' && STARTER_ROUTE_IDS.has(id)
    )))]
    : [];
  const featuredRouteId = typeof value.featuredRouteId === 'string'
    && claimedRouteIds.includes(value.featuredRouteId as StarterCompassRouteId)
    ? value.featuredRouteId as StarterCompassRouteId
    : null;
  const rawChapterIds = Array.isArray(value.claimedMentorChapterIds)
    ? new Set(value.claimedMentorChapterIds.filter((id): id is string => typeof id === 'string' && STARTER_MENTOR_CHAPTER_BY_ID.has(id)))
    : new Set<string>();
  // 손상된 저장에서 뒤 장만 남으면 앞 장을 임의 완료하지 않고 각 루트의 연속 기록만 복구한다.
  const claimedMentorChapterIds = STARTER_COMPASS_ROUTES.flatMap((route) => {
    const valid: string[] = [];
    for (const chapter of STARTER_MENTOR_CHAPTERS.filter((item) => item.routeId === route.id)) {
      if (!rawChapterIds.has(chapter.id) || !claimedRouteIds.includes(route.id)) break;
      valid.push(chapter.id);
    }
    return valid;
  });
  const featuredMentorChapterIds = Array.isArray(value.featuredMentorChapterIds)
    ? [...new Set(value.featuredMentorChapterIds.filter((id): id is string => (
      typeof id === 'string' && claimedMentorChapterIds.includes(id)
    )))].slice(0, 3)
    : [];
  const mentorReplayCounts: Record<string, number> = {};
  if (value.mentorReplayCounts && typeof value.mentorReplayCounts === 'object') {
    for (const id of claimedMentorChapterIds) {
      const replay = (value.mentorReplayCounts as Record<string, unknown>)[id];
      if (typeof replay === 'number' && Number.isFinite(replay) && replay > 0) mentorReplayCounts[id] = Math.floor(replay);
    }
  }
  return {
    version: 3,
    selectedRouteId: typeof value.selectedRouteId === 'string' && STARTER_ROUTE_IDS.has(value.selectedRouteId)
      ? value.selectedRouteId as StarterCompassRouteId
      : null,
    claimedRouteIds,
    featuredRouteId,
    claimedMentorChapterIds,
    featuredMentorChapterIds,
    mentorReplayCounts,
  };
}

const safeMetric = (state: QuestState, key: string): number => {
  const value = state.lifetimeCounts?.[key] ?? 0;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

export function starterMentorChapterViews(
  state: StarterCompassPreferenceState,
  quests: QuestState,
): StarterMentorChapterView[] {
  return STARTER_MENTOR_CHAPTERS.map((chapter) => {
    const requirements = chapter.requirements.map((requirement) => {
      const current = safeMetric(quests, requirement.key);
      return {
        ...requirement, current, complete: current >= requirement.goal,
        progressPct: Math.round((Math.min(current, requirement.goal) / requirement.goal) * 100),
      };
    });
    const previousId = chapter.chapter > 1 ? `${chapter.routeId}_mentor_${chapter.chapter - 1}` : null;
    const available = state.claimedRouteIds.includes(chapter.routeId)
      && (!previousId || state.claimedMentorChapterIds.includes(previousId));
    return {
      ...chapter, requirements, complete: requirements.every((item) => item.complete), available,
      claimed: state.claimedMentorChapterIds.includes(chapter.id),
      featured: state.featuredMentorChapterIds.includes(chapter.id),
      replayCount: Math.max(0, state.mentorReplayCounts[chapter.id] ?? 0),
    };
  });
}

/** 선택은 다른 방향을 잠그지 않으며, 가장 진행된 미완료 방향을 부드러운 기본 제안으로 삼는다. */
export function starterCompassConciergeView(
  routes: readonly StarterCompassRouteView[],
  selectedRouteId: StarterCompassRouteId | null,
): StarterCompassConciergeView {
  const incomplete = routes.filter((route) => !route.complete);
  const suggestedRoute = [...incomplete].sort((a, b) => b.completed - a.completed
    || STARTER_COMPASS_ROUTES.findIndex((route) => route.id === a.id)
    - STARTER_COMPASS_ROUTES.findIndex((route) => route.id === b.id))[0] ?? null;
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;
  if (!incomplete.length) {
    return { stage: 'all-complete', route: selectedRoute ?? routes[0] ?? null, selected: !!selectedRoute, next: null, alternatives: [], suggestedRoute: null };
  }
  if (!selectedRoute) {
    return { stage: 'choose', route: suggestedRoute, selected: false, next: suggestedRoute?.next ?? null, alternatives: [], suggestedRoute };
  }
  if (selectedRoute.complete) {
    return { stage: 'complete', route: selectedRoute, selected: true, next: null, alternatives: [], suggestedRoute };
  }
  const unfinished = selectedRoute.requirements.filter((item) => !item.complete);
  return {
    stage: selectedRoute.completed === 0 ? 'first-step' : 'one-left',
    route: selectedRoute,
    selected: true,
    next: unfinished[0] ?? null,
    alternatives: unfinished.slice(1),
    suggestedRoute,
  };
}

export class StarterCompassPreferenceStore {
  private state: StarterCompassPreferenceState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-starter-compass-preference-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeStarterCompassPreference(raw);
    this.persist();
  }

  get(): StarterCompassPreferenceState { return this.state; }

  select(routeId: StarterCompassRouteId | null): boolean {
    if (routeId !== null && !STARTER_ROUTE_IDS.has(routeId)) return false;
    if (this.state.selectedRouteId === routeId) return false;
    this.state = { ...this.state, selectedRouteId: routeId };
    this.persist();
    return true;
  }

  claim(routeId: StarterCompassRouteId, routeComplete: boolean): StarterCompassClaimResult {
    if (!STARTER_ROUTE_IDS.has(routeId)) return 'missing';
    if (this.state.claimedRouteIds.includes(routeId)) return 'already';
    if (!routeComplete) return 'not-ready';
    this.state = {
      ...this.state,
      claimedRouteIds: [...this.state.claimedRouteIds, routeId],
    };
    this.persist();
    return 'claimed';
  }

  feature(routeId: StarterCompassRouteId): StarterCompassFeatureResult {
    if (!STARTER_ROUTE_IDS.has(routeId)) return 'missing';
    if (!this.state.claimedRouteIds.includes(routeId)) return 'locked';
    const clearing = this.state.featuredRouteId === routeId;
    this.state = { ...this.state, featuredRouteId: clearing ? null : routeId };
    this.persist();
    return clearing ? 'cleared' : 'featured';
  }

  progress(): StarterCompassKeepsakeProgress {
    const completedRoutes = new Set(this.state.claimedMentorChapterIds.map((id) => STARTER_MENTOR_CHAPTER_BY_ID.get(id))
      .filter((chapter) => chapter?.chapter === 3).map((chapter) => chapter!.routeId));
    return {
      claimed: this.state.claimedRouteIds.length,
      featured: Number(this.state.featuredRouteId !== null),
      claimedRouteIds: [...this.state.claimedRouteIds],
      featuredRouteId: this.state.featuredRouteId,
      mentorChapters: this.state.claimedMentorChapterIds.length,
      mentorRoutes: completedRoutes.size,
      mentorRouteIds: STARTER_COMPASS_ROUTES.map((route) => route.id).filter((id) => completedRoutes.has(id)),
      featuredMentorScenes: this.state.featuredMentorChapterIds.length,
      mentorReplays: Object.values(this.state.mentorReplayCounts).reduce((sum, value) => sum + Math.max(0, value), 0),
    };
  }

  mentorViews(quests: QuestState): StarterMentorChapterView[] {
    return starterMentorChapterViews(this.state, quests);
  }

  claimMentorChapter(chapterId: string, quests: QuestState): StarterMentorClaimResult {
    const chapter = STARTER_MENTOR_CHAPTER_BY_ID.get(chapterId);
    if (!chapter) return 'missing';
    if (this.state.claimedMentorChapterIds.includes(chapterId)) return 'already';
    if (!this.state.claimedRouteIds.includes(chapter.routeId)) return 'route-locked';
    const previousId = chapter.chapter > 1 ? `${chapter.routeId}_mentor_${chapter.chapter - 1}` : null;
    if (previousId && !this.state.claimedMentorChapterIds.includes(previousId)) return 'previous';
    const view = starterMentorChapterViews(this.state, quests).find((item) => item.id === chapterId);
    if (!view?.complete) return 'not-ready';
    this.state.claimedMentorChapterIds = [...this.state.claimedMentorChapterIds, chapterId];
    this.persist();
    return 'claimed';
  }

  toggleMentorFeature(chapterId: string): StarterCompassFeatureResult {
    if (!STARTER_MENTOR_CHAPTER_BY_ID.has(chapterId)) return 'missing';
    if (!this.state.claimedMentorChapterIds.includes(chapterId)) return 'locked';
    if (this.state.featuredMentorChapterIds.includes(chapterId)) {
      this.state.featuredMentorChapterIds = this.state.featuredMentorChapterIds.filter((id) => id !== chapterId);
      this.persist();
      return 'cleared';
    }
    if (this.state.featuredMentorChapterIds.length >= 3) return 'locked';
    this.state.featuredMentorChapterIds = [...this.state.featuredMentorChapterIds, chapterId];
    this.persist();
    return 'featured';
  }

  replayMentorChapter(chapterId: string): boolean {
    if (!this.state.claimedMentorChapterIds.includes(chapterId)) return false;
    this.state.mentorReplayCounts[chapterId] = Math.max(0, this.state.mentorReplayCounts[chapterId] ?? 0) + 1;
    this.persist();
    return true;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
