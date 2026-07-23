import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from '../world/isometricVillageMap';

export type MuseumWingId = 'style' | 'home' | 'companion' | 'garden' | 'culinary' | 'fishing' | 'community' | 'adventure';
export type MuseumExhibitId =
  | 'first_thread' | 'lookbook_ribbon' | 'atelier_archive'
  | 'room_key' | 'reform_tile' | 'living_diorama'
  | 'paw_tag' | 'outing_pouch' | 'shared_cushion'
  | 'seed_envelope' | 'specimen_frame' | 'rooftop_herbarium'
  | 'first_menu' | 'plate_stamp' | 'supper_ledger'
  | 'ripple_token' | 'silver_ruler' | 'water_atlas'
  | 'neighbor_tag' | 'shared_zine' | 'village_model'
  | 'forest_pebble' | 'shard_lens' | 'outer_atlas';

export interface MuseumRequirement {
  key: string;
  goal: number;
  label: string;
  location: string;
  destination: IsoActivityKind | 'hunt' | 'residents' | 'treasure';
}

export interface MuseumExhibitDef {
  id: MuseumExhibitId;
  wing: MuseumWingId;
  tier: 1 | 2 | 3;
  mark: string;
  name: string;
  objectName: string;
  description: string;
  lore: string;
  color: string;
  requirements: readonly MuseumRequirement[];
}

export interface MuseumWingDef {
  id: MuseumWingId;
  mark: string;
  name: string;
  title: string;
  description: string;
}

export interface MuseumRequirementView extends MuseumRequirement {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface MuseumExhibitView extends Omit<MuseumExhibitDef, 'requirements'> {
  requirements: MuseumRequirementView[];
  completedRequirements: number;
  progressPct: number;
  ready: boolean;
  claimed: boolean;
  featured: boolean;
  nextRequirement: MuseumRequirementView | null;
}

export interface MuseumWingView extends MuseumWingDef {
  exhibits: MuseumExhibitView[];
  claimed: number;
  ready: number;
  completed: boolean;
  progressPct: number;
}

export interface NeighborhoodMuseumState {
  version: 1;
  claimedExhibitIds: MuseumExhibitId[];
  featuredExhibitIds: MuseumExhibitId[];
  lastClaimedAt: number;
}

export interface NeighborhoodMuseumProgress {
  exhibits: number;
  totalExhibits: number;
  featured: number;
  featuredMax: number;
  completedWings: number;
  totalWings: number;
  ready: number;
  completedClues: number;
  totalClues: number;
}

export type MuseumClaimResult =
  | { ok: true; exhibit: MuseumExhibitDef; firstInWing: boolean; wingComplete: boolean; museumComplete: boolean }
  | { ok: false; reason: 'unknown-exhibit' | 'already-claimed' | 'not-ready' };

export type MuseumFeatureResult = 'featured' | 'removed' | 'full' | 'locked' | 'unknown';

const requirementDestination = (key: string): MuseumRequirement['destination'] => {
  if (key === 'residents_met' || key === 'resident_greet') return 'residents';
  if (key === 'treasures_owned') return 'treasure';
  if (key.startsWith('monster_')) return 'hunt';
  if (key.startsWith('lookbook_') || key === 'customize_save' || key === 'fashion_dye' || key === 'rare_styles') return 'atelier';
  if (key.startsWith('pet_') && key !== 'pet_home_memories') return 'petshop';
  if (key.startsWith('garden_')) return 'garden';
  if (key.startsWith('cooking_')) return 'kitchen';
  if (key.startsWith('fishing_')) return 'fishing';
  if (key.startsWith('hobby_club_')) return 'clubs';
  if (key.startsWith('village_request_')) return 'quest';
  if (key.startsWith('community_project_')) return 'projects';
  return 'home';
};

const req = (key: string, goal: number, label: string, location: string): MuseumRequirement => (
  { key, goal, label, location, destination: requirementDestination(key) }
);

export const MUSEUM_WINGS: readonly MuseumWingDef[] = [
  { id: 'style', mark: '옷', name: '옷결', title: '입고 남긴 기록', description: '코디와 염색, 룩북에서 반복해 고른 색을 보존합니다.' },
  { id: 'home', mark: '집', name: '사는 결', title: '방이 기억한 손길', description: '배치와 리폼, 집들이로 사람이 사는 공간의 변화를 모읍니다.' },
  { id: 'companion', mark: '곁', name: '동행', title: '나란히 걷는 시간', description: '이름을 불러 준 날부터 집에서 나눈 작은 장면까지 기록합니다.' },
  { id: 'garden', mark: '잎', name: '정원', title: '옥상에서 자란 표본', description: '시들지 않는 씨앗과 세 가지 성장 결의 표본을 보존합니다.' },
  { id: 'culinary', mark: '접', name: '식탁', title: '한 접시에 남은 계절', description: '수확한 재료가 메뉴와 플레이팅으로 바뀐 저녁을 모읍니다.' },
  { id: 'fishing', mark: '물', name: '물결', title: '도심 수로의 작은 손님', description: '세 물가에서 만난 생물과 최고 크기의 흔적을 기록합니다.' },
  { id: 'community', mark: '인', name: '이웃', title: '함께 바꾼 골목', description: '이름, 부탁, 동아리와 함께짓기가 만든 관계의 증거를 모읍니다.' },
  { id: 'adventure', mark: '탐', name: '외곽', title: '안전선 밖의 생태', description: '외곽숲의 생태와 복원한 보물이 들려주는 지도를 보존합니다.' },
] as const;

/** 여덟 생활 분야의 초급·중급·완성 기록. 모든 조건은 평생 누적값을 소급해서 읽는다. */
export const MUSEUM_EXHIBITS: readonly MuseumExhibitDef[] = [
  { id: 'first_thread', wing: 'style', tier: 1, mark: '실', name: '처음 고른 한 올', objectName: '색실 표본함', color: '#9a6c61', description: '첫 코디와 염색에서 고른 색을 감은 작은 실패입니다.', lore: '유행보다 먼저 손이 갔던 색이 취향의 첫 문장이 되었다.', requirements: [req('customize_save', 1, '첫 코디 저장', '살림 아틀리에'), req('fashion_dye', 1, '첫 색 바꾸기', '아틀리에 · 의상')] },
  { id: 'lookbook_ribbon', wing: 'style', tier: 2, mark: '결', name: '여섯 벌의 대답', objectName: '룩북 리본', color: '#8d665f', description: '서로 다른 의뢰에 답한 여섯 벌의 조합을 묶은 리본입니다.', lore: '같은 사람이 입어도 질문이 달라지면 옷의 대답도 달라졌다.', requirements: [req('lookbook_entries', 6, '룩북 의뢰 6장', '아틀리에 · 골목 룩북'), req('lookbook_stars', 12, '룩북 별 12개', '골목 룩북 · 코디 의뢰서')] },
  { id: 'atelier_archive', wing: 'style', tier: 3, mark: '옷', name: '아틀리에 전권 기록', objectName: '옷결 아카이브', color: '#805e59', description: '열두 의뢰와 숨은 스타일을 한 권에 엮은 완성 기록입니다.', lore: '옷장은 가득 찼지만 마지막 페이지에는 다음에 입고 싶은 모습이 남았다.', requirements: [req('rare_styles', 10, '희귀 스타일 10종', '아틀리에 · 스타일 도감'), req('lookbook_entries', 12, '룩북 의뢰 12장', '아틀리에 · 골목 룩북'), req('lookbook_stars', 36, '룩북 별 36개', '골목 룩북 · 전권 기록')] },

  { id: 'room_key', wing: 'home', tier: 1, mark: '키', name: '불을 켠 첫 방', objectName: '작은 방 열쇠', color: '#8d7358', description: '현관을 열고 네 점의 생활 가구를 놓은 날의 열쇠입니다.', lore: '집은 벽의 수가 아니라 돌아와 불을 켠 횟수로 넓어졌다.', requirements: [req('visit_home', 1, '내 집 첫 방문', '주택가 · 나의 집'), req('q_place', 4, '가구 4점 배치', '내 집 · 꾸미기')] },
  { id: 'reform_tile', wing: 'home', tier: 2, mark: '결', name: '다시 고른 표면', objectName: '리폼 재질 타일', color: '#7f6c56', description: '열두 물건과 열두 리폼 조합에서 고른 표면을 모은 타일입니다.', lore: '새 물건을 들이는 일만큼 오래 쓸 표정을 다시 고르는 일도 중요했다.', requirements: [req('home_unique_items', 12, '서로 다른 가구 12종', '내 집 · 인테리어 수첩'), req('furniture_reform_combos', 12, '리폼 조합 12칸', '내 집 · 리폼 공방')] },
  { id: 'living_diorama', wing: 'home', tier: 3, mark: '집', name: '사람이 사는 방', objectName: '생활 디오라마', color: '#6f6253', description: '예순다섯 살림 중 스무 점과 열 번의 집들이를 축소한 방입니다.', lore: '완벽하게 정돈된 방보다 누군가 앉았다 간 자리가 오래 기억에 남았다.', requirements: [req('home_unique_items', 20, '서로 다른 가구 20종', '내 집 · 인테리어 수첩'), req('furniture_reform_combos', 48, '리폼 조합 48칸', '내 집 · 리폼 공방'), req('home_visits', 10, '집들이 추억 10장', '내 집 · 방문 앨범')] },

  { id: 'paw_tag', wing: 'companion', tier: 1, mark: '발', name: '처음 불러 준 이름', objectName: '동행 이름표', color: '#9b7065', description: '첫 친구의 이름과 성격을 새긴 작은 이름표입니다.', lore: '가족이 된 순간은 데려온 날보다 이름을 여러 번 불러 본 저녁에 가까웠다.', requirements: [req('pet_adopt', 1, '첫 동행 만나기', '펫샵 · 가족 목록'), req('pet_profile_edit', 1, '동행 프로필 편집', '펫샵 · 프로필')] },
  { id: 'outing_pouch', wing: 'companion', tier: 2, mark: '길', name: '네 골목의 냄새', objectName: '산책 기념 주머니', color: '#8d6b62', description: '네 코스에서 모은 열두 기념 도장을 넣은 작은 주머니입니다.', lore: '같은 길도 누구와 걷는지에 따라 지도의 가장자리부터 달라졌다.', requirements: [req('pet_outing_routes', 4, '산책 코스 4곳', '펫샵 · 산책 수첩'), req('pet_outing_stamps', 12, '산책 도장 12개', '동행 산책 수첩 · 기념 도감')] },
  { id: 'shared_cushion', wing: 'companion', tier: 3, mark: '곁', name: '비어 있지 않은 자리', objectName: '함께 쓰는 쿠션', color: '#7e635d', description: '여덟 산책길과 집 안의 열여덟 장면을 함께 보낸 자리입니다.', lore: '가장 좋은 자리는 비싼 가구가 아니라 서로 자주 돌아오는 곳에 생겼다.', requirements: [req('pet_outing_stamps', 24, '산책 도장 24개', '동행 산책 수첩 · 기념 도감'), req('pet_home_memories', 18, '집 생활 추억 18장', '내 집 · 동행의 자리'), req('pet_personalities', 6, '여섯 성격 기록', '펫샵 · 성격 도감')] },

  { id: 'seed_envelope', wing: 'garden', tier: 1, mark: '씨', name: '옥상의 첫 봉투', objectName: '첫 씨앗 봉투', color: '#718064', description: '첫 파종과 수확 날짜를 눌러 적은 씨앗 봉투입니다.', lore: '작은 화분은 기다린 시간을 눈에 보이는 잎으로 바꾸어 주었다.', requirements: [req('garden_planted', 1, '첫 씨앗 심기', '옥상 씨앗 연구소'), req('garden_harvest', 1, '첫 수확', '옥상 정원 · 네 화분')] },
  { id: 'specimen_frame', wing: 'garden', tier: 2, mark: '표', name: '열여덟 결의 잎', objectName: '성장 결 표본 액자', color: '#66765d', description: '여섯 식물의 햇살·빗방울·달그늘 표본을 고른 액자입니다.', lore: '같은 씨앗도 돌본 순서를 기억해 서로 다른 결로 자랐다.', requirements: [req('garden_species', 6, '식물 6종', '옥상 정원 · 씨앗 서랍'), req('garden_specimens', 18, '성장 결 표본 18칸', '옥상 정원 · 표본함')] },
  { id: 'rooftop_herbarium', wing: 'garden', tier: 3, mark: '잎', name: '옥상 식물 전권', objectName: '계절 없는 식물지', color: '#5d6d56', description: '열두 식물과 서른여섯 성장 결을 한 권에 압착한 식물지입니다.', lore: '시들지 않는 정원에도 기다린 사람만 알아보는 계절이 있었다.', requirements: [req('garden_species', 12, '식물 12종', '옥상 정원 · 씨앗 서랍'), req('garden_specimens', 36, '성장 결 표본 36칸', '옥상 정원 · 표본함'), req('garden_harvest', 30, '누적 수확 30번', '옥상 씨앗 연구소')] },

  { id: 'first_menu', wing: 'culinary', tier: 1, mark: '맛', name: '처음 완성한 저녁', objectName: '첫 메뉴 카드', color: '#9b744f', description: '정원 재료가 처음 한 접시가 된 날의 메뉴 카드입니다.', lore: '조리법보다 먼저 기억난 것은 수확한 잎의 결이었다.', requirements: [req('cooking_total', 1, '첫 메뉴 조리', '모퉁이 골목 주방'), req('cooking_recipes', 2, '메뉴 2종 발견', '골목 주방 · 메뉴 카드')] },
  { id: 'plate_stamp', wing: 'culinary', tier: 2, mark: '접', name: '열여덟 접시의 모양', objectName: '플레이팅 인장', color: '#8c6b4d', description: '여섯 메뉴의 서로 다른 성장 결을 찍은 접시 인장입니다.', lore: '같은 메뉴를 다시 만들 때마다 접시 위의 대답은 조금씩 달랐다.', requirements: [req('cooking_recipes', 6, '메뉴 6종', '골목 주방 · 메뉴 카드'), req('cooking_plates', 18, '플레이팅 기록 18칸', '골목 주방 · 접시 노트')] },
  { id: 'supper_ledger', wing: 'culinary', tier: 3, mark: '식', name: '모퉁이 저녁 전권', objectName: '골목 식탁 장부', color: '#7a6048', description: '열두 메뉴와 서른여섯 접시를 서른 번 차린 저녁 장부입니다.', lore: '단골 메뉴는 가장 화려한 접시보다 다시 만들고 싶은 날의 맛으로 남았다.', requirements: [req('cooking_recipes', 12, '메뉴 12종', '골목 주방 · 메뉴 카드'), req('cooking_plates', 36, '플레이팅 기록 36칸', '골목 주방 · 접시 노트'), req('cooking_total', 30, '누적 조리 30접시', '모퉁이 골목 주방')] },

  { id: 'ripple_token', wing: 'fishing', tier: 1, mark: '파', name: '첫 물결 인사', objectName: '물결 동전', color: '#647c7e', description: '첫 생물과 세 종류의 물빛을 새긴 작은 동전입니다.', lore: '기다리는 동안 아무 일도 없었던 시간이 첫 만남을 더 길게 만들었다.', requirements: [req('fishing_total', 1, '첫 낚시 기록', '물정원 낚시'), req('fishing_species', 3, '물가 생물 3종', '낚시 수첩 · 생물 기록')] },
  { id: 'silver_ruler', wing: 'fishing', tier: 2, mark: '자', name: '아홉 손님의 길이', objectName: '은빛 생태 자', color: '#5e7175', description: '아홉 생물과 스물일곱 크기 도장을 비교한 은빛 자입니다.', lore: '큰 기록만 남기려 했지만 가장 작은 손님의 모양도 쉽게 잊히지 않았다.', requirements: [req('fishing_species', 9, '물가 생물 9종', '낚시 수첩 · 생물 기록'), req('fishing_stamps', 27, '크기 도장 27개', '낚시 수첩 · 크기 기록')] },
  { id: 'water_atlas', wing: 'fishing', tier: 3, mark: '물', name: '세 물가 전권 지도', objectName: '도심 수로 생태도', color: '#53686d', description: '열여덟 생물과 쉰네 크기 기록을 수조와 함께 엮은 지도입니다.', lore: '도시의 물길은 좁았지만 그 안의 이름을 다 적기에는 한 권이 모자랐다.', requirements: [req('fishing_species', 18, '물가 생물 18종', '낚시 수첩 · 생물 기록'), req('fishing_stamps', 54, '크기 도장 54개', '낚시 수첩 · 크기 기록'), req('aquarium_saves', 20, '수조 구성 20번', '내 집 · 물결 테라리움')] },

  { id: 'neighbor_tag', wing: 'community', tier: 1, mark: '명', name: '세 이름의 안부', objectName: '골목 이름표 묶음', color: '#8a725f', description: '처음 기억한 세 주민의 이름표를 묶은 작은 고리입니다.', lore: '지름길보다 먼저 외운 것은 모퉁이마다 마주치는 사람의 이름이었다.', requirements: [req('residents_met', 3, '서로 다른 주민 3명', '주민 수첩 · 인연 지도'), req('resident_greet', 5, '주민 인사 5번', '마을 주민 이름표 근처')] },
  { id: 'shared_zine', wing: 'community', tier: 2, mark: '회', name: '열두 장의 공동 회보', objectName: '골목 생활 합본', color: '#796b5c', description: '열두 동아리 장과 열두 의뢰 도장을 함께 제본한 회보입니다.', lore: '혼자 시작한 생활 기록도 읽어 주는 사람이 생기자 골목의 소식이 되었다.', requirements: [req('hobby_club_chapters', 12, '동아리 발간 12장', '중앙 광장 · 골목 동아리'), req('village_request_stamps', 12, '의뢰 도장 12개', '모험 일지 · 골목 의뢰소')] },
  { id: 'village_model', wing: 'community', tier: 3, mark: '마', name: '함께 바꾼 마을', objectName: '공동 골목 모형', color: '#685f54', description: '열 주민, 서른 장의 회보와 스무 번의 변화를 축소한 마을 모형입니다.', lore: '완성된 장소마다 설계자의 이름 대신 여러 사람의 생활 흔적이 남았다.', requirements: [req('residents_met', 10, '주민 10명 만나기', '주민 수첩 · 인연 지도'), req('hobby_club_chapters', 30, '동아리 발간 30장', '골목 동아리 · 전권 기록'), req('community_project_phases', 20, '함께짓기 20단계', '골목 함께짓기 · 전체 설계도')] },

  { id: 'forest_pebble', wing: 'adventure', tier: 1, mark: '돌', name: '안전선 밖의 조약돌', objectName: '외곽숲 표식돌', color: '#6d6b58', description: '세 생태와 첫 열 번의 순찰을 기억하는 작은 표식돌입니다.', lore: '돌아오는 길을 표시한 돌 덕분에 모험은 용기보다 경로가 되었다.', requirements: [req('monster_species', 3, '몬스터 생태 3종', '동쪽 외곽숲 · 생태 기록'), req('monster_kill', 10, '외곽 생태 10번 정리', '동쪽 외곽숲')] },
  { id: 'shard_lens', wing: 'adventure', tier: 2, mark: '경', name: '열다섯 생태의 반짝임', objectName: '보물 조각 렌즈', color: '#626252', description: '열다섯 생태와 복원 보물 세 점을 함께 관찰하는 렌즈입니다.', lore: '전투가 끝난 자리의 조각은 누가 살았는지 알려 주는 작은 문장이었다.', requirements: [req('monster_species', 15, '몬스터 생태 15종', '가이드북 · 몬스터 연구'), req('treasures_owned', 3, '복원 보물 3점', '보물 도감 · 진열장')] },
  { id: 'outer_atlas', wing: 'adventure', tier: 3, mark: '탐', name: '외곽 생태 전권', objectName: '외곽숲 생태 지도', color: '#555848', description: '서른 생태와 다섯 복원 보물의 위치를 한 권에 엮은 지도입니다.', lore: '마지막 빈칸을 채운 날에도 숲은 아직 이름 없는 소리를 들려주었다.', requirements: [req('monster_species', 30, '몬스터 생태 30종', '가이드북 · 몬스터 연구'), req('treasures_owned', 5, '복원 보물 5점', '보물 도감 · 진열장'), req('monster_kill', 200, '외곽 생태 200번 정리', '동쪽 외곽숲')] },
] as const;

export const MUSEUM_EXHIBIT_BY_ID = new Map(MUSEUM_EXHIBITS.map((exhibit) => [exhibit.id, exhibit]));
const MUSEUM_WING_BY_ID = new Map(MUSEUM_WINGS.map((wing) => [wing.id, wing]));
export const MUSEUM_FEATURED_MAX = 6;

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.floor(value) : 0;

export function freshNeighborhoodMuseumState(): NeighborhoodMuseumState {
  return { version: 1, claimedExhibitIds: [], featuredExhibitIds: [], lastClaimedAt: 0 };
}

export function normalizeNeighborhoodMuseumState(raw: unknown): NeighborhoodMuseumState {
  const value = (raw ?? {}) as Partial<NeighborhoodMuseumState>;
  const claimedExhibitIds = Array.isArray(value.claimedExhibitIds)
    ? [...new Set(value.claimedExhibitIds.filter((id): id is MuseumExhibitId => typeof id === 'string' && MUSEUM_EXHIBIT_BY_ID.has(id as MuseumExhibitId)))]
    : [];
  const claimed = new Set(claimedExhibitIds);
  const featuredExhibitIds = Array.isArray(value.featuredExhibitIds)
    ? [...new Set(value.featuredExhibitIds.filter((id): id is MuseumExhibitId => typeof id === 'string' && claimed.has(id as MuseumExhibitId)))].slice(0, MUSEUM_FEATURED_MAX)
    : [];
  return { version: 1, claimedExhibitIds, featuredExhibitIds, lastClaimedAt: cleanCount(value.lastClaimedAt) };
}

export function neighborhoodMuseumExhibitViews(state: NeighborhoodMuseumState, quests: QuestState): MuseumExhibitView[] {
  const counts = quests.lifetimeCounts ?? {};
  const claimed = new Set(state.claimedExhibitIds);
  const featured = new Set(state.featuredExhibitIds);
  return MUSEUM_EXHIBITS.map((exhibit) => {
    const requirements = exhibit.requirements.map((requirement): MuseumRequirementView => {
      const current = cleanCount(counts[requirement.key]);
      return { ...requirement, current, complete: current >= requirement.goal, progressPct: Math.round((Math.min(current, requirement.goal) / requirement.goal) * 100) };
    });
    const completedRequirements = requirements.filter((requirement) => requirement.complete).length;
    return {
      ...exhibit,
      requirements,
      completedRequirements,
      progressPct: Math.round(requirements.reduce((sum, requirement) => sum + requirement.progressPct, 0) / requirements.length),
      ready: completedRequirements === requirements.length,
      claimed: claimed.has(exhibit.id),
      featured: featured.has(exhibit.id),
      nextRequirement: requirements.filter((requirement) => !requirement.complete)
        .sort((a, b) => b.progressPct - a.progressPct || a.goal - b.goal)[0] ?? null,
    };
  });
}

export function neighborhoodMuseumWingViews(state: NeighborhoodMuseumState, quests: QuestState): MuseumWingView[] {
  const exhibits = neighborhoodMuseumExhibitViews(state, quests);
  return MUSEUM_WINGS.map((wing) => {
    const wingExhibits = exhibits.filter((exhibit) => exhibit.wing === wing.id);
    const claimed = wingExhibits.filter((exhibit) => exhibit.claimed).length;
    return {
      ...wing,
      exhibits: wingExhibits,
      claimed,
      ready: wingExhibits.filter((exhibit) => exhibit.ready && !exhibit.claimed).length,
      completed: claimed === wingExhibits.length,
      progressPct: Math.round(wingExhibits.reduce((sum, exhibit) => sum + exhibit.progressPct, 0) / wingExhibits.length),
    };
  });
}

export function recommendedMuseumExhibit(state: NeighborhoodMuseumState, quests: QuestState): MuseumExhibitView | null {
  const views = neighborhoodMuseumExhibitViews(state, quests);
  return [...views].filter((view) => !view.claimed)
    .sort((a, b) => Number(b.ready) - Number(a.ready) || b.progressPct - a.progressPct || a.tier - b.tier)[0] ?? null;
}

export function neighborhoodMuseumProgress(state: NeighborhoodMuseumState, quests: QuestState): NeighborhoodMuseumProgress {
  const views = neighborhoodMuseumExhibitViews(state, quests);
  const wings = neighborhoodMuseumWingViews(state, quests);
  return {
    exhibits: views.filter((view) => view.claimed).length,
    totalExhibits: views.length,
    featured: state.featuredExhibitIds.length,
    featuredMax: MUSEUM_FEATURED_MAX,
    completedWings: wings.filter((wing) => wing.completed).length,
    totalWings: wings.length,
    ready: views.filter((view) => view.ready && !view.claimed).length,
    completedClues: views.reduce((sum, view) => sum + view.completedRequirements, 0),
    totalClues: views.reduce((sum, view) => sum + view.requirements.length, 0),
  };
}

export function claimMuseumExhibit(
  state: NeighborhoodMuseumState, exhibitId: string, quests: QuestState, claimedAt = Date.now(),
): MuseumClaimResult {
  const exhibit = MUSEUM_EXHIBIT_BY_ID.get(exhibitId as MuseumExhibitId);
  if (!exhibit) return { ok: false, reason: 'unknown-exhibit' };
  if (state.claimedExhibitIds.includes(exhibit.id)) return { ok: false, reason: 'already-claimed' };
  const view = neighborhoodMuseumExhibitViews(state, quests).find((candidate) => candidate.id === exhibit.id)!;
  if (!view.ready) return { ok: false, reason: 'not-ready' };
  const firstInWing = !state.claimedExhibitIds.some((id) => MUSEUM_EXHIBIT_BY_ID.get(id)?.wing === exhibit.wing);
  state.claimedExhibitIds = [...state.claimedExhibitIds, exhibit.id];
  state.lastClaimedAt = cleanCount(claimedAt);
  const wingComplete = MUSEUM_EXHIBITS.filter((candidate) => candidate.wing === exhibit.wing)
    .every((candidate) => state.claimedExhibitIds.includes(candidate.id));
  return { ok: true, exhibit, firstInWing, wingComplete, museumComplete: state.claimedExhibitIds.length === MUSEUM_EXHIBITS.length };
}

export function toggleMuseumFeature(state: NeighborhoodMuseumState, exhibitId: string): MuseumFeatureResult {
  const exhibit = MUSEUM_EXHIBIT_BY_ID.get(exhibitId as MuseumExhibitId);
  if (!exhibit) return 'unknown';
  if (!state.claimedExhibitIds.includes(exhibit.id)) return 'locked';
  if (state.featuredExhibitIds.includes(exhibit.id)) {
    state.featuredExhibitIds = state.featuredExhibitIds.filter((id) => id !== exhibit.id);
    return 'removed';
  }
  if (state.featuredExhibitIds.length >= MUSEUM_FEATURED_MAX) return 'full';
  state.featuredExhibitIds = [...state.featuredExhibitIds, exhibit.id];
  return 'featured';
}

export class NeighborhoodMuseumStore {
  private state: NeighborhoodMuseumState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-neighborhood-museum-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeNeighborhoodMuseumState(raw);
    this.persist();
  }

  get(): NeighborhoodMuseumState { return this.state; }
  exhibits(quests: QuestState): MuseumExhibitView[] { return neighborhoodMuseumExhibitViews(this.state, quests); }
  wings(quests: QuestState): MuseumWingView[] { return neighborhoodMuseumWingViews(this.state, quests); }
  recommended(quests: QuestState): MuseumExhibitView | null { return recommendedMuseumExhibit(this.state, quests); }
  progress(quests: QuestState): NeighborhoodMuseumProgress { return neighborhoodMuseumProgress(this.state, quests); }

  claim(exhibitId: string, quests: QuestState): MuseumClaimResult {
    const result = claimMuseumExhibit(this.state, exhibitId, quests);
    if (result.ok) this.persist();
    return result;
  }

  feature(exhibitId: string): MuseumFeatureResult {
    const result = toggleMuseumFeature(this.state, exhibitId);
    if (result === 'featured' || result === 'removed') this.persist();
    return result;
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
