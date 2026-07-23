import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from '../world/isometricVillageMap';

export type HobbyClubId = 'style' | 'home' | 'companion' | 'table' | 'water' | 'stage';

export interface HobbyClubCondition {
  key: string;
  goal: number;
  label: string;
  location: string;
  activity: IsoActivityKind;
}

export interface HobbyClubChapter {
  id: string;
  clubId: HobbyClubId;
  chapter: 1 | 2 | 3 | 4 | 5;
  code: string;
  name: string;
  note: string;
  pageTitle: string;
  pageText: string;
  conditions: readonly [HobbyClubCondition, HobbyClubCondition, HobbyClubCondition];
}

export interface HobbyClubDef {
  id: HobbyClubId;
  code: string;
  mark: string;
  name: string;
  curator: string;
  description: string;
  rankNames: readonly [string, string, string, string, string, string];
  chapters: readonly HobbyClubChapter[];
}

export interface HobbyClubFanPiece {
  chapter: 1 | 2 | 3 | 4 | 5;
  name: string;
  kind: 'badge' | 'banner' | 'light' | 'prop' | 'album';
  description: string;
}

export interface HobbyClubRoomDef {
  clubId: HobbyClubId;
  roomName: string;
  cheerLine: string;
  palette: readonly [string, string, string, string, string];
  pieces: readonly [
    HobbyClubFanPiece, HobbyClubFanPiece, HobbyClubFanPiece, HobbyClubFanPiece, HobbyClubFanPiece,
  ];
}

export interface HobbyClubState {
  version: 2;
  claimedChapterIds: string[];
  pinnedClubId: HobbyClubId | null;
  featuredClubIds: HobbyClubId[];
  roomReplayCounts: Partial<Record<HobbyClubId, number>>;
  lastClaimedAt: number;
}

export interface HobbyClubConditionView extends HobbyClubCondition {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface HobbyClubChapterView extends Omit<HobbyClubChapter, 'conditions'> {
  conditions: HobbyClubConditionView[];
  complete: boolean;
  claimed: boolean;
  available: boolean;
  locked: boolean;
  stamps: number;
}

export interface HobbyClubView extends Omit<HobbyClubDef, 'chapters'> {
  chapters: HobbyClubChapterView[];
  rank: number;
  rankName: string;
  ready: number;
  totalStamps: number;
  nextChapter: HobbyClubChapterView | null;
  nextCondition: HobbyClubConditionView | null;
  pinned: boolean;
  featured: boolean;
  room: HobbyClubRoomDef;
  fanKit: Array<HobbyClubFanPiece & { unlocked: boolean }>;
  roomReplayCount: number;
}

export interface HobbyClubProgress {
  chapters: number;
  totalChapters: number;
  societies: number;
  totalSocieties: number;
  ready: number;
  rankMax: number;
  stamps: number;
  totalStamps: number;
  fanKitPieces: number;
  totalFanKitPieces: number;
  completeKits: number;
  featuredClubs: number;
  roomReplays: number;
}

export type HobbyClubClaimResult =
  | { ok: true; chapter: HobbyClubChapter; firstSocietyChapter: boolean; completedSociety: boolean }
  | { ok: false; reason: 'unknown-chapter' | 'already-claimed' | 'previous-chapter' | 'not-ready' };

const c = (key: string, goal: number, label: string, location: string, activity: IsoActivityKind): HobbyClubCondition => (
  { key, goal, label, location, activity }
);

const chapter = (
  clubId: HobbyClubId,
  number: 1 | 2 | 3 | 4 | 5,
  name: string,
  note: string,
  pageTitle: string,
  pageText: string,
  conditions: readonly [HobbyClubCondition, HobbyClubCondition, HobbyClubCondition],
): HobbyClubChapter => ({
  id: `${clubId}_${number}`, clubId, chapter: number, code: `${clubId.toUpperCase()} ${String(number).padStart(2, '0')}`,
  name, note, pageTitle, pageText, conditions,
});

/** 여섯 생활 동아리 × 다섯 장. 각 장은 기존 평생 기록 세 가지를 읽어 과거 활동도 소급한다. */
export const HOBBY_CLUBS: readonly HobbyClubDef[] = [
  {
    id: 'style', code: 'THREAD', mark: '결', name: '골목 옷결 연구회', curator: '하늘과 노을',
    description: '한 벌을 정답으로 정하지 않고, 반복해서 입고 기록하며 자기만의 실루엣을 연구합니다.',
    rankNames: ['구경꾼', '피팅 메모', '색 조율자', '화보 편집자', '골목 디렉터', '옷결 기록장'],
    chapters: [
      chapter('style', 1, '첫 옷핀', '지금의 모습을 고르고 작은 변화부터 저장합니다.', '처음 고른 선', '좋아하는 옷을 설명하기 전에 먼저 입어 본 날의 기록.', [
        c('customize_save', 1, '현재 모습 저장하기', '캐릭터 아틀리에', 'atelier'),
        c('fashion_dye', 1, '색 한 번 바꿔 보기', '아틀리에 · 의상', 'atelier'),
        c('closet_save', 1, '코디 한 칸 보관하기', '아틀리에 · 옷장', 'atelier'),
      ]),
      chapter('style', 2, '세 벌의 대답', '상황마다 다른 코디를 옷장과 룩북에 남깁니다.', '날씨가 바꾼 옷장', '같은 사람도 골목의 빛과 약속에 따라 다른 옷을 고른다.', [
        c('closet_save', 3, '옷장 세 칸 기록', '아틀리에 · 옷장', 'atelier'),
        c('fashion_preset', 4, '테마 코디 네 번 입기', '아틀리에 · 옷장', 'atelier'),
        c('lookbook_entries', 2, '룩북 두 장 출품', '아틀리에 · 골목 룩북', 'atelier'),
      ]),
      chapter('style', 3, '골목 화보', '조건을 읽되 그대로 따르지 않는 변주를 연구합니다.', '규칙과 변주 사이', '의뢰의 세 조건은 답안이 아니라 새로운 조합을 시작하는 질문이었다.', [
        c('lookbook_entries', 6, '서로 다른 룩북 여섯 장', '아틀리에 · 골목 룩북', 'atelier'),
        c('lookbook_stars', 12, '룩북 최고 별 열두 개', '골목 룩북 · 최고 기록', 'atelier'),
        c('lookbook_unique', 6, '서로 다른 코디 여섯 벌', '골목 룩북 · 코디 기록', 'atelier'),
      ]),
      chapter('style', 4, '숨은 재단선', '마을에서 얻은 희귀 스타일과 장식을 조합합니다.', '배지가 열린 옷장', '골목에서 보낸 시간이 옷의 새로운 선과 장식으로 돌아왔다.', [
        c('rare_styles', 5, '희귀 스타일 다섯 종', '아틀리에 · 스타일 도감', 'atelier'),
        c('lookbook_perfect', 3, '최고 별 룩북 세 장', '골목 룩북 · 의뢰서', 'atelier'),
        c('customize_save', 10, '코디 누적 열 번 저장', '캐릭터 아틀리에', 'atelier'),
      ]),
      chapter('style', 5, '서른여섯 별 편집실', '열두 의뢰와 전시를 자기만의 방식으로 완성합니다.', '골목이 입은 한 권', '서른여섯 별은 완벽의 점수가 아니라 오래 고른 선택의 수였다.', [
        c('lookbook_entries', 12, '룩북 열두 장 완성', '골목 룩북 · 열두 의뢰', 'atelier'),
        c('lookbook_stars', 36, '룩북 최고 별 서른여섯', '골목 룩북 · 최고 기록', 'atelier'),
        c('taste_showcase_submissions', 8, '취향 전시 여덟 번 참여', '골목 취향 전시회', 'showcase'),
      ]),
    ],
  },
  {
    id: 'home', code: 'NEST', mark: '집', name: '생활 공간 관찰부', curator: '살림 아주머니',
    description: '비싼 방보다 자주 손이 가는 자리를 살피고, 물건 사이에 생긴 생활의 이야기를 모읍니다.',
    rankNames: ['빈 도면', '새 둥지', '동선 기록가', '취향 설계자', '집들이 큐레이터', '생활 공간장'],
    chapters: [
      chapter('home', 1, '방에 켠 첫 불', '집에 들어가 생활 가구를 하나씩 놓습니다.', '한 칸의 온기', '빈 방은 부족한 곳이 아니라 다음 물건을 기다리는 넓은 여백이었다.', [
        c('visit_home', 1, '내 집 들어가기', '주택가 · 나의 집', 'home'),
        c('q_place', 3, '가구 세 점 배치', '내 집 · 꾸미기', 'home'),
        c('home_unique_items', 3, '서로 다른 물건 세 종', '내 집 · 홈 스타일', 'home'),
      ]),
      chapter('home', 2, '생활의 동선', '잠들고 앉고 정리하는 방의 쓰임을 고르게 만듭니다.', '손이 가는 순서', '좋은 동선은 빠른 길이 아니라 매일의 습관이 자연스럽게 이어지는 길이다.', [
        c('home_categories', 4, '가구 분류 네 가지', '내 집 · 홈 스타일', 'home'),
        c('home_unique_items', 8, '서로 다른 물건 여덟 종', '내 집 · 인테리어 수첩', 'home'),
        c('home_score', 50, '홈 스타일 50점', '내 집 · 홈 스타일 카드', 'home'),
      ]),
      chapter('home', 3, '한눈에 보이는 취향', '테마와 마감, 색을 반복해 방의 목소리를 찾습니다.', '반복이 만든 색', '비슷한 물건이 셋 모이자 우연이었던 색이 주인의 취향이 되었다.', [
        c('home_theme_power', 4, '홈 테마 파워 4', '내 집 · 홈 스타일', 'home'),
        c('furniture_reform_saves', 3, '가구 리폼 세 번', '내 집 · 리폼 공방', 'home'),
        c('furniture_reform_combos', 6, '리폼 조합 여섯 칸', '가구 리폼 공방 · 조합 도감', 'home'),
      ]),
      chapter('home', 4, '열린 현관', '주민과 동행이 머물 수 있는 장면을 만듭니다.', '누군가 앉았던 자리', '방문객이 돌아간 뒤에도 의자의 각도와 찻잔 자리에 대화가 남았다.', [
        c('home_visits', 5, '주민 방문 추억 다섯 장', '내 집 · 방문 앨범', 'home'),
        c('home_pet_visits', 3, '펫과 집들이 세 장', '내 집 · 방문 앨범', 'home'),
        c('pet_home_memories', 6, '동행의 자리 여섯 장', '내 집 · 동행의 자리', 'home'),
      ]),
      chapter('home', 5, '마을의 작은 명소', '수집과 제작, 전시가 이어지는 완성된 생활 공간을 기록합니다.', '주소보다 선명한 방', '사람들은 길을 설명할 때 건물 번호 대신 그 방의 빛과 냄새를 말했다.', [
        c('home_score', 90, '홈 스타일 90점', '내 집 · 홈 스타일 카드', 'home'),
        c('home_unique_items', 20, '서로 다른 가구 스무 종', '내 집 · 인테리어 수첩', 'home'),
        c('furniture_craft_recipes', 6, 'DIY 설계도 여섯 종', '살림 가구 · DIY 작업대', 'workshop'),
      ]),
    ],
  },
  {
    id: 'companion', code: 'PAW', mark: '곁', name: '나란한 발자국회', curator: '멍냥이네 가족',
    description: '강하게 키우는 대신 성격과 좋아하는 장소를 알아가며, 둘 사이에 생긴 작은 습관을 기록합니다.',
    rankNames: ['첫 인사', '산책 친구', '마음 번역가', '추억 수집가', '평생 단짝', '동행 기록장'],
    chapters: [
      chapter('companion', 1, '이름을 부른 날', '첫 동행을 만나 돌봄과 프로필을 시작합니다.', '작은 이름의 무게', '이름을 정한 뒤부터 골목의 발소리가 둘로 들리기 시작했다.', [
        c('pet_adopt', 1, '첫 동행 입양', '펫샵 · 가족 목록', 'petshop'),
        c('pet_feed', 1, '먹이 한 번 주기', '펫샵 · 돌봄', 'petshop'),
        c('pet_profiles_customized', 1, '프로필 한 번 꾸미기', '펫샵 · 프로필', 'petshop'),
      ]),
      chapter('companion', 2, '우리만의 신호', '놀이와 훈련으로 서로의 표현을 알아갑니다.', '말보다 빠른 몸짓', '고개를 기울이는 각도 하나가 오늘의 기분을 알려 주는 신호가 되었다.', [
        c('max_pet_affinity', 25, '친밀도 25', '펫샵 · 돌봄 기록', 'petshop'),
        c('pet_play', 3, '함께 놀기 세 번', '펫샵 · 돌봄', 'petshop'),
        c('pet_tricks', 1, '트릭 하나 배우기', '펫샵 · 트릭 연습', 'petshop'),
      ]),
      chapter('companion', 3, '골목이 넓어진 만큼', '성격에 맞는 길을 골라 산책 기념품을 모읍니다.', '발바닥 지도', '지도에는 없던 냄새와 그늘이 둘만의 경로 위에 표시되었다.', [
        c('pet_outing_routes', 3, '산책 코스 세 곳', '펫샵 · 산책 수첩', 'petshop'),
        c('pet_outing_stamps', 6, '산책 기념 도장 여섯 개', '동행 산책 수첩', 'petshop'),
        c('pet_personalities', 2, '서로 다른 성격 둘', '펫샵 · 가족 프로필', 'petshop'),
      ]),
      chapter('companion', 4, '집 안의 작은 대사', '좋아하는 가구와 장식에서 동행의 생활 장면을 발견합니다.', '곁을 고르는 방법', '친구는 가장 비싼 쿠션이 아니라 사람이 자주 돌아오는 자리를 골랐다.', [
        c('pet_home_memories', 9, '집 생활 추억 아홉 장', '내 집 · 동행의 자리', 'home'),
        c('pet_accessories', 5, '동행 장식 다섯 종', '펫샵 · 장식 도감', 'petshop'),
        c('pet_memories', 3, '한 펫의 추억 세 장', '펫샵 · 추억 앨범', 'petshop'),
      ]),
      chapter('companion', 5, '여덟 길의 단짝', '모든 산책길과 오랜 돌봄을 한 권에 엮습니다.', '돌아오는 길을 아는 사이', '멀리 걸은 날에도 집으로 향하는 마지막 모퉁이에서는 보폭이 자연스레 같아졌다.', [
        c('max_pet_affinity', 100, '친밀도 100', '동행과 매일의 돌봄', 'petshop'),
        c('pet_outing_stamps', 24, '산책 기념 도장 스물네 개', '동행 산책 수첩', 'petshop'),
        c('pet_outings_total', 30, '함께 걷기 서른 번', '펫샵 · 산책 기록', 'petshop'),
      ]),
    ],
  },
  {
    id: 'table', code: 'TABLE', mark: '맛', name: '옥상 식탁 실험실', curator: '동수 할아버지와 모퉁이 씨',
    description: '씨앗의 성장 결부터 한 접시의 배치까지, 키우고 먹는 생활을 작은 실험처럼 이어 갑니다.',
    rankNames: ['빈 화분', '새싹 기록', '수확 조수', '접시 연구원', '계절 메뉴장', '옥상 식탁장'],
    chapters: [
      chapter('table', 1, '흙과 접시 사이', '씨앗을 심고 첫 수확물을 음식으로 이어 봅니다.', '처음 잘라 본 잎', '화분에서 접시까지의 거리는 짧았지만 기다린 시간만큼 맛이 길었다.', [
        c('garden_planted', 1, '씨앗 처음 심기', '옥상 정원', 'garden'),
        c('garden_harvest', 1, '첫 식물 수확', '옥상 정원 · 네 화분', 'garden'),
        c('cooking_total', 1, '첫 메뉴 완성', '골목 주방', 'kitchen'),
      ]),
      chapter('table', 2, '네 화분의 계절', '서로 다른 식물과 성장 결을 비교합니다.', '잎마다 다른 시간', '같은 날 심은 씨앗도 햇빛과 돌봄을 기억하는 방식은 모두 달랐다.', [
        c('garden_species', 4, '식물 네 종 수확', '옥상 정원 · 씨앗 서랍', 'garden'),
        c('garden_specimens', 6, '성장 결 표본 여섯 개', '옥상 정원 · 표본함', 'garden'),
        c('garden_harvest', 8, '누적 여덟 번 수확', '옥상 정원', 'garden'),
      ]),
      chapter('table', 3, '단골 메뉴 노트', '좋아하는 메뉴와 서로 다른 플레이팅을 기록합니다.', '다시 만들고 싶은 맛', '맛있다는 말보다 다음에도 이 접시를 찾는 손이 더 정확한 기록이었다.', [
        c('cooking_recipes', 4, '메뉴 네 종 완성', '골목 주방 · 메뉴 카드', 'kitchen'),
        c('cooking_plates', 8, '플레이팅 여덟 장', '골목 주방 · 접시 노트', 'kitchen'),
        c('cooking_favorites', 2, '단골 메뉴 두 접시', '골목 주방', 'kitchen'),
      ]),
      chapter('table', 4, '성장 결 테이스팅', '같은 재료의 다른 성장 결을 접시 위에서 비교합니다.', '흙이 남긴 뒷맛', '햇살과 비, 돌봄의 차이는 색뿐 아니라 한입 뒤의 향에도 남아 있었다.', [
        c('garden_specimens', 18, '성장 결 표본 열여덟 개', '옥상 정원 · 표본함', 'garden'),
        c('cooking_plates', 18, '플레이팅 열여덟 장', '골목 주방 · 접시 노트', 'kitchen'),
        c('cooking_total', 20, '누적 스무 접시 완성', '골목 주방', 'kitchen'),
      ]),
      chapter('table', 5, '열두 식물의 저녁', '도감과 메뉴판을 완성해 옥상의 한 해를 엮습니다.', '옥상을 먹는 방법', '열두 식물의 계절을 모두 맛본 뒤에야 작은 옥상도 하나의 넓은 밭임을 알았다.', [
        c('garden_species', 12, '식물 열두 종 수확', '옥상 정원 · 씨앗 서랍', 'garden'),
        c('cooking_recipes', 12, '메뉴 열두 종 완성', '골목 주방 · 메뉴 카드', 'kitchen'),
        c('cooking_plates', 36, '플레이팅 서른여섯 장', '골목 주방 · 접시 노트', 'kitchen'),
      ]),
    ],
  },
  {
    id: 'water', code: 'RIPPLE', mark: '물', name: '도심 물결 연구소', curator: '일레의 관찰 노트',
    description: '낚는 속도를 겨루지 않고 세 물가의 생물, 크기, 수조 속 움직임을 오래 관찰합니다.',
    rankNames: ['빈 수첩', '첫 물결', '수로 관찰자', '크기 기록가', '수조 큐레이터', '물생태 기록장'],
    chapters: [
      chapter('water', 1, '수면 아래 첫 인사', '첫 생물을 만나고 기록을 방 안까지 이어 봅니다.', '손끝에 남은 물빛', '잠깐 반짝인 비늘 하나가 평범했던 수로를 오래 들여다보게 했다.', [
        c('fishing_total', 1, '첫 물가 생물 만나기', '물정원 낚시', 'fishing'),
        c('fishing_species', 1, '생물 한 종 기록', '낚시 수첩', 'fishing'),
        c('aquarium_saves', 1, '첫 테라리움 저장', '내 집 · 물결 테라리움', 'home'),
      ]),
      chapter('water', 2, '한 물가의 여섯 얼굴', '같은 장소에서도 다른 생물과 크기를 찾아봅니다.', '익숙한 물의 낯선 얼굴', '매일 같은 난간에 서도 수면 아래의 손님은 한 번도 같은 순서로 오지 않았다.', [
        c('fishing_species', 6, '생물 여섯 종 발견', '낚시 수첩 · 생물 기록', 'fishing'),
        c('fishing_stamps', 6, '크기 도장 여섯 개', '낚시 수첩 · 크기 기록', 'fishing'),
        c('fishing_total', 12, '물결 만남 열두 번', '세 물가', 'fishing'),
      ]),
      chapter('water', 3, '두 물길을 잇는 선', '서로 다른 물가의 생태와 금빛 기록을 비교합니다.', '도시 아래 이어진 길', '떨어진 두 수로에서 같은 친구를 만났을 때 물길의 숨은 연결을 상상했다.', [
        c('fishing_species', 12, '생물 열두 종 발견', '세 물가 · 생물 도감', 'fishing'),
        c('fishing_gold_records', 3, '금빛 크기 기록 세 종', '낚시 수첩 · 크기 기록', 'fishing'),
        c('aquarium_saves', 5, '테라리움 다섯 번 구성', '내 집 · 물결 테라리움', 'home'),
      ]),
      chapter('water', 4, '방 안의 작은 수로', '수조의 테마와 종 구성을 바꾸며 생활 속 생태를 연구합니다.', '밤에도 흐르는 물', '창밖 수로가 어두워진 뒤에도 방 안의 작은 물결은 하루의 관찰을 이어 갔다.', [
        c('home_aquarium_active', 1, '방에 수조 연결', '내 집 · 무료 어항 가구', 'home'),
        c('aquarium_displayed', 3, '수조 전시 슬롯 세 칸', '물결 테라리움 작업실', 'home'),
        c('aquarium_frames', 3, '수조 프레임 세 종', '물결 테라리움 작업실', 'home'),
      ]),
      chapter('water', 5, '열여덟 번의 물결 인사', '세 물가의 생물과 모든 크기 도장을 한 권에 모읍니다.', '도심 물생태 전권', '도감의 마지막 칸을 채운 날에도 수면은 다음에 올 낯선 움직임을 남겨 두었다.', [
        c('fishing_species', 18, '생물 열여덟 종 완성', '낚시 수첩 · 생물 기록', 'fishing'),
        c('fishing_stamps', 54, '크기 도장 쉰네 개', '낚시 수첩 · 크기 기록', 'fishing'),
        c('aquarium_saves', 20, '수조 구성 스무 번', '내 집 · 물결 테라리움', 'home'),
      ]),
    ],
  },
  {
    id: 'stage', code: 'ALLEY', mark: '흥', name: '밤골목 생활편집부', curator: '준과 모퉁이 씨',
    description: '무대만이 아니라 알바, 사진, 이웃의 부탁까지 골목에서 보낸 하루 전체를 한 편의 장면으로 엮습니다.',
    rankNames: ['첫 관객', '골목 스태프', '장면 수집가', '생활 연출가', '밤거리 편집장', '골목 연대기장'],
    chapters: [
      chapter('stage', 1, '첫 박수 뒤의 밤', '카페와 버스킹, 사진으로 골목의 기본 리듬을 익힙니다.', '조명이 켜진 모퉁이', '누군가의 박수와 커피잔 소리가 겹치자 평범한 저녁이 한 장면이 되었다.', [
        c('q_cafe', 1, '카페 알바 한 번', '모퉁이 카페', 'cafe'),
        c('q_busking', 1, '버스킹 한 번', '중앙 광장 · 버스킹', 'busking'),
        c('photo_taken', 1, '네컷 한 장 남기기', '네컷 작업실', 'photo'),
      ]),
      chapter('stage', 2, '골목의 반복 박자', '단골이 되고 주민에게 먼저 인사합니다.', '익숙해진 소리', '세 번째 문을 열었을 때 이름을 부르는 목소리가 골목의 배경음이 되었다.', [
        c('q_cafe', 3, '카페 도움 세 번', '모퉁이 카페', 'cafe'),
        c('q_busking', 3, '버스킹 세 번', '중앙 광장 · 버스킹', 'busking'),
        c('resident_greet', 10, '주민 인사 열 번', '마을의 이름표', 'quest'),
      ]),
      chapter('stage', 3, '세 장면의 편집', '사진 앨범과 이웃의 부탁을 이어 하루의 서사를 만듭니다.', '사진 밖으로 이어진 일', '사진을 찍기 전과 후에 한 작은 일이 장면의 표정을 완전히 바꾸었다.', [
        c('photo_album', 3, '필름 앨범 세 장', '네컷 작업실 · 필름 앨범', 'photo'),
        c('village_requests_total', 5, '골목 의뢰 다섯 번', '모험 일지 · 골목 의뢰소', 'quest'),
        c('residents_met', 5, '주민 다섯 명 만나기', '주민 수첩', 'quest'),
      ]),
      chapter('stage', 4, '누군가의 앙코르', '공연과 관계, 서로 다른 촬영 장면을 오래 쌓습니다.', '다시 불린 이름', '앙코르를 외치는 사람들의 얼굴을 알게 되자 무대는 혼자 서는 곳이 아니었다.', [
        c('q_busking', 15, '버스킹 누적 열다섯 번', '중앙 광장 · 버스킹', 'busking'),
        c('photo_backdrops', 4, '사진 배경 네 곳', '네컷 작업실', 'photo'),
        c('resident_trust_max', 50, '한 주민 신뢰도 50', '주민 수첩 · 관계 앨범', 'quest'),
      ]),
      chapter('stage', 5, '백 번 돌아온 골목', '생활의 반복과 이웃의 부탁을 골목 연대기로 완성합니다.', '매일 달라서 같은 곳', '백 번 돌아온 길은 익숙했지만 그날 만난 사람 때문에 매번 다른 장면으로 남았다.', [
        c('village_requests_total', 30, '골목 의뢰 서른 번', '모험 일지 · 골목 의뢰소', 'quest'),
        c('photo_album', 12, '필름 앨범 열두 장', '네컷 작업실 · 필름 앨범', 'photo'),
        c('q_cafe', 30, '카페 도움 서른 번', '모퉁이 카페', 'cafe'),
      ]),
    ],
  },
] as const;

export const HOBBY_CLUB_BY_ID = new Map(HOBBY_CLUBS.map((club) => [club.id, club]));
export const HOBBY_CLUB_CHAPTERS = HOBBY_CLUBS.flatMap((club) => club.chapters);
export const HOBBY_CLUB_CHAPTER_BY_ID = new Map(HOBBY_CLUB_CHAPTERS.map((item) => [item.id, item]));

const piece = (
  chapter: 1 | 2 | 3 | 4 | 5,
  name: string,
  kind: HobbyClubFanPiece['kind'],
  description: string,
): HobbyClubFanPiece => ({ chapter, name, kind, description });

/** 발간 장과 1:1로 연결되는 영구 팬 키트. 성능 효과 없이 아지트 장면과 취향 전시에만 사용한다. */
export const HOBBY_CLUB_ROOMS: Record<HobbyClubId, HobbyClubRoomDef> = {
  style: {
    clubId: 'style', roomName: '옷결 샘플 편집실', cheerLine: '다른 오늘도, 나다운 한 벌!',
    palette: ['#30283b', '#72556f', '#d08b8d', '#f0cda8', '#f7ead3'],
    pieces: [
      piece(1, '첫 옷핀 배지', 'badge', '처음 저장한 모습의 색을 작은 핀에 남겼어요.'),
      piece(2, '세 벌 패브릭 깃발', 'banner', '옷장의 변주를 세 겹 천으로 이어 만든 깃발이에요.'),
      piece(3, '골목 화보 조명', 'light', '코디의 윤곽을 부드럽게 살리는 편집실 조명이에요.'),
      piece(4, '희귀 재단 마네킹', 'prop', '골목에서 찾은 장식을 시험해 보는 작은 마네킹이에요.'),
      piece(5, '서른여섯 별 룩북', 'album', '열두 의뢰의 선택을 한 권에 제본한 최애 앨범이에요.'),
    ],
  },
  home: {
    clubId: 'home', roomName: '생활 동선 모형방', cheerLine: '손이 가는 자리가 좋은 집!',
    palette: ['#2e312d', '#65705d', '#b18b69', '#dfc6a1', '#f3ead7'],
    pieces: [
      piece(1, '첫 불 창문 배지', 'badge', '빈 방에 처음 켠 불빛을 닮은 배지예요.'),
      piece(2, '생활 동선 벽지도', 'banner', '매일 오가는 길을 천 위에 수놓은 지도예요.'),
      piece(3, '취향 스탠드', 'light', '반복해서 고른 색을 포근하게 비추는 조명이에요.'),
      piece(4, '집들이 티 테이블', 'prop', '이웃과 동행이 잠시 머무는 낮은 탁자예요.'),
      piece(5, '생활 공간 도감', 'album', '주소보다 선명한 방들을 모은 두꺼운 도감이에요.'),
    ],
  },
  companion: {
    clubId: 'companion', roomName: '나란한 발자국 라운지', cheerLine: '서두르지 말고, 같은 보폭으로!',
    palette: ['#26343a', '#55737a', '#8fb2a2', '#e0bd87', '#f6e8cf'],
    pieces: [
      piece(1, '이름표 발바닥 배지', 'badge', '첫 동행의 이름을 새긴 작은 발바닥 배지예요.'),
      piece(2, '우리 신호 깃발', 'banner', '말보다 먼저 알아본 몸짓을 무늬로 만든 깃발이에요.'),
      piece(3, '산책길 랜턴', 'light', '늦은 귀갓길에도 두 그림자를 함께 비춰요.'),
      piece(4, '단짝 쿠션 자리', 'prop', '동행이 스스로 고른 가장 편안한 자리예요.'),
      piece(5, '여덟 길 추억첩', 'album', '함께 걸은 길의 냄새와 소리를 모은 앨범이에요.'),
    ],
  },
  table: {
    clubId: 'table', roomName: '옥상 식탁 시식실', cheerLine: '기른 계절을 한 접시에!',
    palette: ['#343228', '#6b7044', '#a5a85d', '#d89462', '#f4dfba'],
    pieces: [
      piece(1, '새싹 포크 배지', 'badge', '첫 수확과 첫 접시를 이어 주는 작은 배지예요.'),
      piece(2, '네 화분 계절보', 'banner', '서로 다른 성장 속도를 잎 무늬로 기록했어요.'),
      piece(3, '단골 메뉴 펜던트', 'light', '다시 만들고 싶은 접시 위에 켜지는 조명이에요.'),
      piece(4, '성장 결 시식대', 'prop', '같은 재료의 다른 계절을 나란히 비교하는 상이에요.'),
      piece(5, '열두 식물 메뉴북', 'album', '옥상의 한 해를 맛과 색으로 엮은 메뉴북이에요.'),
    ],
  },
  water: {
    clubId: 'water', roomName: '도심 물결 관찰실', cheerLine: '같은 물에도 새로운 얼굴!',
    palette: ['#222f3c', '#375b70', '#5f91a0', '#a6c9bb', '#edf0d2'],
    pieces: [
      piece(1, '첫 비늘 배지', 'badge', '처음 만난 물빛을 작은 비늘에 담았어요.'),
      piece(2, '여섯 물결 깃발', 'banner', '익숙한 물가의 여섯 얼굴이 흐르는 깃발이에요.'),
      piece(3, '수로 관찰등', 'light', '물길 아래 움직임을 방해하지 않는 푸른 조명이에요.'),
      piece(4, '작은 수로 수조', 'prop', '방 안에서도 천천히 흐르는 관찰용 수조예요.'),
      piece(5, '도심 물생태 전권', 'album', '세 물가와 모든 크기 도장을 모은 기록장이에요.'),
    ],
  },
  stage: {
    clubId: 'stage', roomName: '밤골목 장면 편집실', cheerLine: '평범한 오늘도 한 편의 장면!',
    palette: ['#2d2738', '#634d70', '#b65f72', '#e5a466', '#f5dfb4'],
    pieces: [
      piece(1, '첫 박수 배지', 'badge', '조명이 켜진 모퉁이의 첫 박수를 간직한 배지예요.'),
      piece(2, '반복 박자 현수막', 'banner', '알바와 공연의 생활 리듬을 이어 만든 현수막이에요.'),
      piece(3, '관계 장면 스포트', 'light', '이웃의 작은 표정을 놓치지 않는 무대 조명이에요.'),
      piece(4, '골목 소품 트렁크', 'prop', '사진과 비밀, 부탁의 흔적을 모아 둔 소품함이에요.'),
      piece(5, '백 번의 밤 연대기', 'album', '매번 달랐던 같은 골목을 한 권에 편집했어요.'),
    ],
  },
};

const CLUB_IDS = new Set<string>(HOBBY_CLUBS.map((club) => club.id));
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export function freshHobbyClubState(): HobbyClubState {
  return {
    version: 2, claimedChapterIds: [], pinnedClubId: null, featuredClubIds: [], roomReplayCounts: {},
    lastClaimedAt: 0,
  };
}

export function normalizeHobbyClubState(raw: unknown): HobbyClubState {
  if (!raw || typeof raw !== 'object') return freshHobbyClubState();
  const value = raw as Partial<HobbyClubState>;
  const claimedSet = new Set(Array.isArray(value.claimedChapterIds)
    ? value.claimedChapterIds.filter((id): id is string => typeof id === 'string' && HOBBY_CLUB_CHAPTER_BY_ID.has(id)) : []);
  // 손상된 저장에서 뒤 장만 남았을 때 앞 장을 임의 완료시키지 않고, 유효한 연속 기록까지만 복원한다.
  const claimedChapterIds = HOBBY_CLUBS.flatMap((club) => {
    const valid: string[] = [];
    for (const item of club.chapters) {
      if (!claimedSet.has(item.id)) break;
      valid.push(item.id);
    }
    return valid;
  });
  const pinnedClubId = typeof value.pinnedClubId === 'string' && CLUB_IDS.has(value.pinnedClubId)
    ? value.pinnedClubId as HobbyClubId : null;
  const featuredClubIds = Array.isArray(value.featuredClubIds)
    ? [...new Set(value.featuredClubIds.filter((id): id is HobbyClubId => typeof id === 'string' && CLUB_IDS.has(id)))]
      .filter((id) => claimedChapterIds.some((chapterId) => chapterId.startsWith(`${id}_`))).slice(0, 3)
    : [];
  const rawReplays = value.roomReplayCounts && typeof value.roomReplayCounts === 'object'
    ? value.roomReplayCounts : {};
  const roomReplayCounts: Partial<Record<HobbyClubId, number>> = {};
  for (const id of HOBBY_CLUBS.map((club) => club.id)) {
    const count = cleanCount(rawReplays[id]);
    if (count > 0 && claimedChapterIds.some((chapterId) => chapterId.startsWith(`${id}_`))) {
      roomReplayCounts[id] = count;
    }
  }
  return {
    version: 2, claimedChapterIds, pinnedClubId, featuredClubIds, roomReplayCounts,
    lastClaimedAt: cleanCount(value.lastClaimedAt),
  };
}

const metricValue = (state: QuestState, key: string): number => cleanCount(state.lifetimeCounts?.[key]);

export function hobbyClubChapterView(
  chapterDef: HobbyClubChapter,
  state: HobbyClubState,
  quests: QuestState,
): HobbyClubChapterView {
  const conditions = chapterDef.conditions.map((condition): HobbyClubConditionView => {
    const current = metricValue(quests, condition.key);
    return {
      ...condition, current, complete: current >= condition.goal,
      progressPct: Math.round((Math.min(current, condition.goal) / condition.goal) * 100),
    };
  });
  const claimed = state.claimedChapterIds.includes(chapterDef.id);
  const previous = chapterDef.chapter > 1 ? `${chapterDef.clubId}_${chapterDef.chapter - 1}` : null;
  const available = !previous || state.claimedChapterIds.includes(previous);
  return {
    ...chapterDef, conditions, complete: conditions.every((condition) => condition.complete), claimed,
    available, locked: !available && !claimed, stamps: conditions.filter((condition) => condition.complete).length,
  };
}

export function hobbyClubViews(state: HobbyClubState, quests: QuestState): HobbyClubView[] {
  return HOBBY_CLUBS.map((club): HobbyClubView => {
    const chapters = club.chapters.map((item) => hobbyClubChapterView(item, state, quests));
    const rank = chapters.filter((item) => item.claimed).length;
    const nextChapter = chapters.find((item) => !item.claimed) ?? null;
    const nextCondition = nextChapter
      ? [...nextChapter.conditions].filter((condition) => !condition.complete)
        .sort((a, b) => b.progressPct - a.progressPct || a.goal - b.goal)[0] ?? null
      : null;
    return {
      ...club, chapters, rank, rankName: club.rankNames[rank]!,
      ready: chapters.filter((item) => item.available && item.complete && !item.claimed).length,
      totalStamps: chapters.reduce((sum, item) => sum + item.stamps, 0),
      nextChapter, nextCondition, pinned: state.pinnedClubId === club.id,
      featured: state.featuredClubIds.includes(club.id),
      room: HOBBY_CLUB_ROOMS[club.id],
      fanKit: HOBBY_CLUB_ROOMS[club.id].pieces.map((item) => ({ ...item, unlocked: rank >= item.chapter })),
      roomReplayCount: cleanCount(state.roomReplayCounts[club.id]),
    };
  });
}

export function hobbyClubProgress(state: HobbyClubState, quests: QuestState): HobbyClubProgress {
  const views = hobbyClubViews(state, quests);
  return {
    chapters: state.claimedChapterIds.length,
    totalChapters: HOBBY_CLUB_CHAPTERS.length,
    societies: views.filter((club) => club.rank > 0).length,
    totalSocieties: HOBBY_CLUBS.length,
    ready: views.reduce((sum, club) => sum + club.ready, 0),
    rankMax: Math.max(0, ...views.map((club) => club.rank)),
    stamps: views.reduce((sum, club) => sum + club.totalStamps, 0),
    totalStamps: HOBBY_CLUB_CHAPTERS.length * 3,
    fanKitPieces: state.claimedChapterIds.length,
    totalFanKitPieces: HOBBY_CLUB_CHAPTERS.length,
    completeKits: views.filter((club) => club.rank === 5).length,
    featuredClubs: state.featuredClubIds.length,
    roomReplays: Object.values(state.roomReplayCounts).reduce((sum, count) => sum + cleanCount(count), 0),
  };
}

export function claimHobbyClubChapter(
  state: HobbyClubState,
  chapterId: string,
  quests: QuestState,
  claimedAt = Date.now(),
): HobbyClubClaimResult {
  const item = HOBBY_CLUB_CHAPTER_BY_ID.get(chapterId);
  if (!item) return { ok: false, reason: 'unknown-chapter' };
  if (state.claimedChapterIds.includes(chapterId)) return { ok: false, reason: 'already-claimed' };
  const previous = item.chapter > 1 ? `${item.clubId}_${item.chapter - 1}` : null;
  if (previous && !state.claimedChapterIds.includes(previous)) return { ok: false, reason: 'previous-chapter' };
  if (!hobbyClubChapterView(item, state, quests).complete) return { ok: false, reason: 'not-ready' };
  const firstSocietyChapter = !state.claimedChapterIds.some((id) => HOBBY_CLUB_CHAPTER_BY_ID.get(id)?.clubId === item.clubId);
  state.claimedChapterIds = [...state.claimedChapterIds, chapterId];
  state.lastClaimedAt = cleanCount(claimedAt);
  return { ok: true, chapter: item, firstSocietyChapter, completedSociety: item.chapter === 5 };
}

export class HobbyClubStore {
  private state: HobbyClubState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-hobby-clubs-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizeHobbyClubState(raw);
    this.persist();
  }

  get(): HobbyClubState { return this.state; }
  views(quests: QuestState): HobbyClubView[] { return hobbyClubViews(this.state, quests); }
  progress(quests: QuestState): HobbyClubProgress { return hobbyClubProgress(this.state, quests); }

  pin(clubId: HobbyClubId | null): boolean {
    if (clubId !== null && !HOBBY_CLUB_BY_ID.has(clubId)) return false;
    this.state.pinnedClubId = this.state.pinnedClubId === clubId ? null : clubId;
    this.persist();
    return true;
  }

  toggleFeatured(clubId: HobbyClubId): boolean {
    if (!HOBBY_CLUB_BY_ID.has(clubId)) return false;
    const active = this.state.claimedChapterIds.some((id) => id.startsWith(`${clubId}_`));
    if (!active) return false;
    if (this.state.featuredClubIds.includes(clubId)) {
      this.state.featuredClubIds = this.state.featuredClubIds.filter((id) => id !== clubId);
    } else {
      if (this.state.featuredClubIds.length >= 3) return false;
      this.state.featuredClubIds = [...this.state.featuredClubIds, clubId];
    }
    this.persist();
    return true;
  }

  replayRoom(clubId: HobbyClubId): boolean {
    if (!HOBBY_CLUB_BY_ID.has(clubId)) return false;
    const active = this.state.claimedChapterIds.some((id) => id.startsWith(`${clubId}_`));
    if (!active) return false;
    this.state.roomReplayCounts[clubId] = cleanCount(this.state.roomReplayCounts[clubId]) + 1;
    this.persist();
    return true;
  }

  claim(chapterId: string, quests: QuestState): HobbyClubClaimResult {
    const result = claimHobbyClubChapter(this.state, chapterId, quests);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
