import type { QuestState } from '../questProgress';
import type { IsoActivityKind } from '../world/isometricVillageMap';

export type CommunityProjectId = 'shade' | 'rain' | 'table' | 'companion' | 'stage';

export interface CommunityContribution {
  key: string;
  goal: number;
  label: string;
  note: string;
  location: string;
  activity: IsoActivityKind;
}

export interface CommunityProjectPhase {
  id: string;
  projectId: CommunityProjectId;
  phase: 1 | 2 | 3 | 4;
  code: string;
  name: string;
  description: string;
  change: string;
  story: string;
  contributions: readonly [CommunityContribution, CommunityContribution, CommunityContribution, CommunityContribution];
}

export interface CommunityProjectDef {
  id: CommunityProjectId;
  code: string;
  mark: string;
  name: string;
  district: string;
  steward: string;
  purpose: string;
  finalChange: string;
  phases: readonly CommunityProjectPhase[];
}

export interface CommunityProjectState {
  version: 1;
  claimedPhaseIds: string[];
  featuredProjectId: CommunityProjectId | null;
  lastClaimedAt: number;
}

export interface CommunityContributionView extends CommunityContribution {
  current: number;
  complete: boolean;
  progressPct: number;
}

export interface CommunityProjectPhaseView extends Omit<CommunityProjectPhase, 'contributions'> {
  contributions: CommunityContributionView[];
  complete: boolean;
  claimed: boolean;
  available: boolean;
  ready: boolean;
  locked: boolean;
  contributionsDone: number;
}

export interface CommunityProjectView extends Omit<CommunityProjectDef, 'phases'> {
  phases: CommunityProjectPhaseView[];
  level: number;
  status: 'planned' | 'building' | 'complete';
  ready: number;
  contributionMarks: number;
  nextPhase: CommunityProjectPhaseView | null;
  nextContribution: CommunityContributionView | null;
  featured: boolean;
}

export interface CommunityProjectProgress {
  phases: number;
  totalPhases: number;
  completedProjects: number;
  totalProjects: number;
  activeProjects: number;
  ready: number;
  contributionMarks: number;
  totalContributionMarks: number;
  villageChangeLevel: number;
}

export type CommunityProjectClaimResult =
  | { ok: true; phase: CommunityProjectPhase; startedProject: boolean; completedProject: boolean }
  | { ok: false; reason: 'unknown-phase' | 'already-claimed' | 'previous-phase' | 'not-ready' };

const contribution = (
  key: string, goal: number, label: string, note: string, location: string, activity: IsoActivityKind,
): CommunityContribution => ({ key, goal, label, note, location, activity });

const phase = (
  projectId: CommunityProjectId, number: 1 | 2 | 3 | 4, name: string, description: string,
  change: string, story: string,
  contributions: CommunityProjectPhase['contributions'],
): CommunityProjectPhase => ({
  id: `${projectId}_${number}`, projectId, phase: number,
  code: `${projectId.toUpperCase()}-${String(number).padStart(2, '0')}`,
  name, description, change, story, contributions,
});

/** 개인의 평생 생활 기록을 소비하지 않고 마을의 공용 장소 변화로 읽는 다섯 장기 프로젝트. */
export const COMMUNITY_PROJECTS: readonly CommunityProjectDef[] = [
  {
    id: 'shade', code: 'REST', mark: '쉼', name: '모두의 그늘 정류장', district: '주택가 남쪽 모퉁이',
    steward: '살림 아주머니와 골목 반상회',
    purpose: '누구나 잠시 앉을 수 있는 그늘, 작은 화분, 나눔 선반이 이어진 생활 정류장을 만듭니다.',
    finalChange: '긴 나무 벤치와 나눔 선반, 사계절 화분이 있는 주민 쉼터',
    phases: [
      phase('shade', 1, '빈 모퉁이 재기', '사람이 멈추는 위치와 필요한 가구를 생활 기록에서 찾습니다.', '바닥에 쉼터 윤곽선이 표시됩니다.', '잠깐 선 사람들의 발끝이 가장 오래 머문 자리에 첫 선을 그었다.', [
        contribution('q_place', 3, '가구 배치 세 번', '집에서 익힌 동선을 도면에 보탭니다.', '내 집 · 꾸미기', 'home'),
        contribution('garden_planted', 1, '첫 씨앗 심기', '그늘에서도 자랄 식물의 시작을 기록합니다.', '옥상 정원', 'garden'),
        contribution('resident_greet', 3, '주민 인사 세 번', '이웃이 쉬고 싶은 시간을 묻습니다.', '이름 있는 주민 곁', 'quest'),
        contribution('visit_shop', 1, '살림 가구 둘러보기', '공용 가구의 재료와 크기를 살핍니다.', '살림 가구 쇼룸', 'shop'),
      ]),
      phase('shade', 2, '앉을 자리 만들기', '손작업과 정원 기록으로 벤치와 화분의 기본 골격을 세웁니다.', '목재 골조와 네 개의 화분이 놓입니다.', '서로 다른 높이의 의자를 시험한 끝에 오래 앉아도 편한 한 줄을 찾았다.', [
        contribution('furniture_craft_total', 1, '첫 가구 제작', '직접 만든 결을 공용 벤치에 남깁니다.', 'DIY 작업대', 'workshop'),
        contribution('garden_harvest', 3, '식물 세 번 수확', '잘 자란 식물의 조건을 골라냅니다.', '옥상 정원', 'garden'),
        contribution('home_unique_items', 8, '가구 여덟 종 경험', '다양한 쓰임을 쉼터 구성에 반영합니다.', '내 집 · 홈 스타일', 'home'),
        contribution('village_requests_total', 3, '골목 의뢰 세 번', '필요한 손길을 먼저 살피는 감각을 모읍니다.', '모험 일지 · 의뢰소', 'quest'),
      ]),
      phase('shade', 3, '이야기가 머무는 선반', '방문과 요리, 동아리 기록으로 나눔 선반의 내용을 채웁니다.', '작은 책과 찻잔이 놓인 나눔 선반이 열립니다.', '누군가 두고 간 얇은 책 옆에 다음 사람이 짧은 쪽지를 끼워 두었다.', [
        contribution('residents_met', 5, '주민 다섯 명 만나기', '서로 다른 생활 리듬을 선반에 반영합니다.', '주민 수첩', 'quest'),
        contribution('home_visits', 3, '집들이 추억 세 장', '손님이 편안했던 자리를 떠올립니다.', '내 집 · 방문 앨범', 'home'),
        contribution('cooking_total', 5, '요리 다섯 접시', '함께 나누기 좋은 간식 기록을 보탭니다.', '골목 주방', 'kitchen'),
        contribution('hobby_club_home_rank', 1, '공간 관찰부 첫 장', '생활 공간 연구를 공용 장소에 옮깁니다.', '골목 동아리', 'clubs'),
      ]),
      phase('shade', 4, '골목의 작은 거실', '숙련된 제작과 정원, 집 꾸미기 기록으로 쉼터를 완성합니다.', '그늘막과 조명, 계절 화분이 켜진 완성 쉼터가 됩니다.', '집 밖에도 돌아와 앉고 싶은 자리가 생기자 골목은 조금 더 넓은 거실이 되었다.', [
        contribution('furniture_craft_recipes', 6, 'DIY 설계도 여섯 종', '튼튼한 공용 가구 구조를 완성합니다.', 'DIY 작업대', 'workshop'),
        contribution('garden_species', 6, '식물 여섯 종', '빛과 그늘에 맞는 화분 구성을 완성합니다.', '옥상 정원', 'garden'),
        contribution('home_score', 75, '홈 스타일 75점', '균형 잡힌 공간 감각을 쉼터에 반영합니다.', '내 집 · 홈 스타일', 'home'),
        contribution('village_level', 10, '마을 레벨 10', '오래 살아 본 주민의 시선으로 마지막 점검을 합니다.', '모험 일지 · 여정', 'quest'),
      ]),
    ],
  },
  {
    id: 'rain', code: 'RIPPLE', mark: '비', name: '빗물정원 생태길', district: '동쪽 연결 수로',
    steward: '일레와 빗물정원 조사단',
    purpose: '비가 온 뒤의 물길을 따라 식물과 생물이 함께 머무는 느린 관찰 산책로를 만듭니다.',
    finalChange: '관찰 표지와 수생 화분, 낮은 난간이 이어진 생태 산책길',
    phases: [
      phase('rain', 1, '물길의 첫 점', '낚시와 사진, 산책 기록으로 빗물이 머무는 지점을 찾습니다.', '수로 옆에 작은 관찰 말뚝이 생깁니다.', '비가 그친 뒤에도 마르지 않은 작은 웅덩이가 첫 관찰 지점이 되었다.', [
        contribution('fishing_total', 3, '물가 만남 세 번', '수면 아래 움직임을 확인합니다.', '물정원 낚시', 'fishing'),
        contribution('photo_taken', 1, '네컷 한 장', '관찰 전의 풍경을 사진으로 남깁니다.', '네컷 작업실', 'photo'),
        contribution('q_forest', 60, '숲길 60초 걷기', '물이 흐르는 경사를 몸으로 익힙니다.', '경의선 숲길', 'quest'),
        contribution('garden_tend', 3, '화분 세 번 돌보기', '젖은 흙의 변화를 살핍니다.', '옥상 정원', 'garden'),
      ]),
      phase('rain', 2, '젖은 땅의 식물표', '생물과 식물의 종류를 비교해 수생 화분 구성을 정합니다.', '수로 가장자리에 낮은 수생 화분이 놓입니다.', '물과 흙의 경계에서 잘 자라는 잎은 빗방울을 오래 붙잡고 있었다.', [
        contribution('fishing_species', 6, '물가 생물 여섯 종', '서로 다른 생물의 서식 자리를 구분합니다.', '낚시 수첩', 'fishing'),
        contribution('garden_species', 4, '식물 네 종', '물가와 어울리는 잎 모양을 고릅니다.', '옥상 정원', 'garden'),
        contribution('garden_specimens', 6, '성장 결 여섯 표본', '습도에 따른 차이를 기록합니다.', '정원 · 표본함', 'garden'),
        contribution('photo_backdrops', 3, '사진 배경 세 곳', '길의 앞뒤 풍경을 비교합니다.', '네컷 작업실', 'photo'),
      ]),
      phase('rain', 3, '느린 관찰 난간', '크기 기록과 수조 연구를 연결해 가까이 들여다볼 자리를 만듭니다.', '앉아서 기록할 수 있는 낮은 난간이 열립니다.', '손을 뻗지 않아도 충분히 가까운 거리가 생태길의 가장 중요한 치수가 되었다.', [
        contribution('fishing_stamps', 18, '크기 도장 열여덟 개', '생물마다 필요한 관찰 거리를 정합니다.', '낚시 수첩', 'fishing'),
        contribution('aquarium_saves', 3, '수조 구성 세 번', '작은 생태를 방 안에서 다시 조합합니다.', '내 집 · 물결 테라리움', 'home'),
        contribution('sparkle_collect', 10, '반짝임 열 번 발견', '산책길의 눈에 잘 띄는 지점을 찾습니다.', '골목과 숲길', 'quest'),
        contribution('q_forest', 180, '숲길 3분 걷기', '관찰 속도에 맞는 길의 간격을 정합니다.', '경의선 숲길', 'quest'),
      ]),
      phase('rain', 4, '도심 물결 지도', '완성된 생물·식물·수조 기록으로 생태길 전체를 연결합니다.', '수로 전 구간에 관찰 표지와 잔잔한 조명이 켜집니다.', '마지막 표지판은 정답을 적지 않고 다음에 발견할 빈 칸을 남겨 두었다.', [
        contribution('fishing_species', 18, '생물 열여덟 종', '세 물가의 생태 기록을 합칩니다.', '낚시 수첩', 'fishing'),
        contribution('garden_species', 12, '식물 열두 종', '수로 곁 식물 구성을 완성합니다.', '옥상 정원', 'garden'),
        contribution('aquarium_displayed', 3, '수조 전시 세 칸', '관찰 기록을 작은 전시로 바꿉니다.', '내 집 · 물결 테라리움', 'home'),
        contribution('hobby_club_water_rank', 3, '물결 연구소 세 장', '오래 쌓인 관찰 노트를 표지에 반영합니다.', '골목 동아리', 'clubs'),
      ]),
    ],
  },
  {
    id: 'table', code: 'SUPPER', mark: '상', name: '늦은 저녁 공유식탁', district: '모퉁이 카페 옥상',
    steward: '모퉁이 씨와 동수 할아버지',
    purpose: '혼자 먹은 접시도 기록으로 모아 누구나 한 자리를 보탤 수 있는 긴 저녁 식탁을 엽니다.',
    finalChange: '열두 메뉴 노트와 빈 의자가 늘 준비된 옥상 공유식탁',
    phases: [
      phase('table', 1, '첫 접시의 자리', '수확과 요리, 인사 기록으로 식탁의 첫 네 자리를 정합니다.', '옥상에 네 개의 빈 의자가 놓입니다.', '누가 올지 몰라 비워 둔 의자가 가장 먼저 식탁의 분위기를 만들었다.', [
        contribution('cooking_total', 1, '첫 메뉴 완성', '식탁의 시작이 될 접시를 기록합니다.', '골목 주방', 'kitchen'),
        contribution('garden_harvest', 1, '첫 식물 수확', '재료가 온 곳을 함께 적습니다.', '옥상 정원', 'garden'),
        contribution('resident_greet', 3, '주민 인사 세 번', '함께 먹고 싶은 이웃의 취향을 듣습니다.', '이름 있는 주민 곁', 'quest'),
        contribution('q_cafe', 1, '카페 일 한 번', '여러 잔을 동시에 내는 순서를 배웁니다.', '모퉁이 카페', 'cafe'),
      ]),
      phase('table', 2, '단골의 메뉴 쪽지', '서로 다른 메뉴와 방문 추억을 긴 메뉴 노트로 엮습니다.', '손글씨 메뉴 쪽지가 식탁 위에 놓입니다.', '정식 이름보다 누가 좋아했던 접시인지가 더 오래 기억에 남았다.', [
        contribution('cooking_recipes', 4, '메뉴 네 종', '각기 다른 취향의 선택지를 만듭니다.', '골목 주방', 'kitchen'),
        contribution('cooking_favorites', 2, '단골 메뉴 두 개', '다시 찾게 되는 맛을 표시합니다.', '골목 주방', 'kitchen'),
        contribution('home_visits', 3, '집들이 추억 세 장', '편안한 대화의 자리를 떠올립니다.', '내 집 · 방문 앨범', 'home'),
        contribution('garden_species', 4, '식물 네 종', '메뉴의 재료 폭을 넓힙니다.', '옥상 정원', 'garden'),
      ]),
      phase('table', 3, '여럿이 차린 한 상', '플레이팅, 의뢰, 공간 구성 기록으로 긴 식탁을 완성합니다.', '여덟 명이 나란히 앉는 긴 상판이 설치됩니다.', '접시 모양은 달라도 가운데 놓인 물병 하나가 모두의 식탁임을 알려 주었다.', [
        contribution('cooking_plates', 18, '플레이팅 열여덟 장', '접시가 겹치지 않는 배치를 찾습니다.', '골목 주방', 'kitchen'),
        contribution('village_requests_total', 10, '골목 의뢰 열 번', '서로 돕는 식탁 운영 방식을 익힙니다.', '모험 일지 · 의뢰소', 'quest'),
        contribution('home_categories', 4, '가구 분류 네 가지', '먹고 앉고 밝히고 정리하는 쓰임을 맞춥니다.', '내 집 · 홈 스타일', 'home'),
        contribution('hobby_club_table_rank', 2, '식탁 실험실 두 장', '재배와 요리의 연결 기록을 보탭니다.', '골목 동아리', 'clubs'),
      ]),
      phase('table', 4, '열두 메뉴의 밤', '정원과 요리 도감을 완성해 언제든 다시 열 수 있는 식탁으로 만듭니다.', '따뜻한 전구와 열두 메뉴 노트가 켜진 공유식탁이 완성됩니다.', '마지막 접시가 놓인 뒤에도 빈 의자 하나는 늦게 오는 사람을 위해 남아 있었다.', [
        contribution('cooking_recipes', 12, '메뉴 열두 종', '전체 메뉴 노트를 완성합니다.', '골목 주방', 'kitchen'),
        contribution('cooking_plates', 36, '플레이팅 서른여섯 장', '모든 성장 결의 접시를 기록합니다.', '골목 주방', 'kitchen'),
        contribution('garden_species', 12, '식물 열두 종', '재료 산지 노트를 완성합니다.', '옥상 정원', 'garden'),
        contribution('cooking_total', 30, '요리 서른 접시', '반복해서 열 수 있는 운영 경험을 쌓습니다.', '골목 주방', 'kitchen'),
      ]),
    ],
  },
  {
    id: 'companion', code: 'PAUSE', mark: '곁', name: '동행 쉼표 지도', district: '주택가와 숲길 사이',
    steward: '멍냥이네와 산책 기록가',
    purpose: '성격과 크기가 다른 동행이 안심하고 쉬는 물그릇·그늘·냄새 지점을 골목 지도에 잇습니다.',
    finalChange: '여덟 산책길의 물그릇과 동행 쉼표가 표시된 공용 지도',
    phases: [
      phase('companion', 1, '나란히 선 첫 점', '입양과 돌봄, 첫 산책 기록으로 지도에 시작점을 찍습니다.', '펫샵 앞에 작은 산책 지도판이 생깁니다.', '사람이 보기 좋은 길과 작은 발이 편한 길은 조금 다르다는 것을 첫 점에서 배웠다.', [
        contribution('pet_adopt', 1, '첫 동행 입양', '함께 걷는 친구의 시선으로 길을 봅니다.', '멍냥이네', 'petshop'),
        contribution('pet_feed', 1, '먹이 한 번', '물과 간식이 필요한 간격을 기록합니다.', '펫샵 · 돌봄', 'petshop'),
        contribution('photo_with_pet', 1, '동행 네컷 한 장', '둘이 편안한 거리를 사진에 남깁니다.', '네컷 작업실', 'photo'),
        contribution('pet_outings_total', 1, '첫 동행 산책', '실제로 한 골목을 함께 걸어 봅니다.', '동행 산책 수첩', 'petshop'),
      ]),
      phase('companion', 2, '성격마다 다른 그늘', '놀이와 성격, 산책 경로 기록으로 여러 종류의 쉼터를 고릅니다.', '세 곳에 낮은 물그릇과 그늘 표식이 놓입니다.', '활발한 친구는 넓은 곳을, 조용한 친구는 벽 가까운 그늘을 먼저 골랐다.', [
        contribution('pet_play', 3, '함께 놀기 세 번', '움직인 뒤 필요한 휴식 공간을 살핍니다.', '펫샵 · 돌봄', 'petshop'),
        contribution('pet_personalities', 2, '성격 두 가지', '서로 다른 쉼터 취향을 기록합니다.', '펫샵 · 프로필', 'petshop'),
        contribution('pet_outing_routes', 3, '산책길 세 곳', '쉼표가 필요한 경로를 넓힙니다.', '동행 산책 수첩', 'petshop'),
        contribution('home_pet_visits', 1, '펫과 집들이 한 장', '낯선 공간에서 편안해지는 조건을 찾습니다.', '내 집 · 방문 앨범', 'home'),
      ]),
      phase('companion', 3, '좋아하는 자리의 표식', '장식과 집 생활 추억으로 알아보기 쉬운 쉼표 표식을 만듭니다.', '성격별 색과 모양이 다른 쉼표 표지판이 설치됩니다.', '글을 읽지 않아도 물과 그늘을 알아볼 수 있도록 모양부터 정했다.', [
        contribution('pet_accessories', 5, '동행 장식 다섯 종', '눈에 잘 띄면서 부담 없는 표식을 고릅니다.', '펫샵 · 장식 도감', 'petshop'),
        contribution('pet_home_memories', 6, '집 생활 추억 여섯 장', '좋아하는 가구와 쉼의 관계를 찾습니다.', '내 집 · 동행의 자리', 'home'),
        contribution('pet_outing_stamps', 12, '산책 도장 열두 개', '여러 길의 쉼표를 실제로 확인합니다.', '동행 산책 수첩', 'petshop'),
        contribution('pet_memories', 3, '동행 추억 세 장', '오래 남는 순간을 지도 설명에 담습니다.', '펫샵 · 추억 앨범', 'petshop'),
      ]),
      phase('companion', 4, '여덟 길의 안심 지도', '오랜 친밀도와 모든 산책 기록으로 공용 지도를 완성합니다.', '마을 전역에 여덟 쉼표와 물그릇이 연결됩니다.', '지도는 가장 빠른 길 대신 함께 걷기 좋은 길을 굵게 표시했다.', [
        contribution('max_pet_affinity', 100, '친밀도 100', '동행의 작은 신호를 충분히 이해합니다.', '매일의 동행 돌봄', 'petshop'),
        contribution('pet_outing_routes', 8, '산책길 여덟 곳', '마을의 모든 산책 경로를 연결합니다.', '동행 산책 수첩', 'petshop'),
        contribution('pet_outing_stamps', 24, '산책 도장 스물네 개', '각 길의 기념 지점을 모두 확인합니다.', '동행 산책 수첩', 'petshop'),
        contribution('taste_showcase_pet_entries', 4, '동행 전시 네 장', '서로 다른 동행의 모습을 안내판에 담습니다.', '골목 취향 전시회', 'showcase'),
      ]),
    ],
  },
  {
    id: 'stage', code: 'NIGHT', mark: '빛', name: '밤골목 작은 무대', district: '레코드 골목 입구',
    steward: '준과 골목 공연 기획단',
    purpose: '큰 공연장이 아니라 누구나 한 곡, 한 장면, 한 벌을 시험할 수 있는 낮은 생활 무대를 만듭니다.',
    finalChange: '사진 벽과 의상 걸이, 낮은 조명이 함께 있는 열린 골목 무대',
    phases: [
      phase('stage', 1, '한 곡 높이의 단상', '공연과 사진, 카페, 코디 기록으로 부담 없는 무대 높이를 찾습니다.', '바닥에 낮은 목재 단상이 놓입니다.', '관객과 눈높이가 거의 같은 단상에서는 첫 음을 내는 일이 조금 덜 무서웠다.', [
        contribution('q_busking', 1, '버스킹 한 번', '직접 무대의 크기와 호흡을 느낍니다.', '중앙 광장 · 버스킹', 'busking'),
        contribution('photo_taken', 1, '네컷 한 장', '무대에 남길 장면의 구도를 찾습니다.', '네컷 작업실', 'photo'),
        contribution('q_cafe', 1, '카페 일 한 번', '공연 전후의 골목 흐름을 배웁니다.', '모퉁이 카페', 'cafe'),
        contribution('customize_save', 1, '현재 모습 저장', '무대 위 첫 실루엣을 기록합니다.', '캐릭터 아틀리에', 'atelier'),
      ]),
      phase('stage', 2, '장면이 바뀌는 벽', '코디와 사진, 공연 기록으로 쉽게 바뀌는 배경 벽을 만듭니다.', '교체 가능한 천 배경과 작은 의상 걸이가 생깁니다.', '벽 하나를 다시 칠하는 대신 천 한 장을 바꾸자 매일 다른 무대가 되었다.', [
        contribution('q_busking', 3, '버스킹 세 번', '서로 다른 공연 장면을 비교합니다.', '중앙 광장 · 버스킹', 'busking'),
        contribution('photo_backdrops', 3, '사진 배경 세 곳', '바뀌는 배경의 색과 깊이를 연구합니다.', '네컷 작업실', 'photo'),
        contribution('lookbook_entries', 2, '룩북 두 장', '의상과 배경이 만나는 조합을 찾습니다.', '아틀리에 · 골목 룩북', 'atelier'),
        contribution('residents_met', 5, '주민 다섯 명 만나기', '서로 다른 관객이 편한 자리를 묻습니다.', '주민 수첩', 'quest'),
      ]),
      phase('stage', 3, '골목의 관객석', '사진 앨범과 의뢰, 카페 경험으로 머물기 편한 관객석을 엽니다.', '계단형 벤치와 작은 필름 벽이 설치됩니다.', '박수치지 않고 조용히 듣는 사람도 관객이라는 문장을 첫 줄에 적었다.', [
        contribution('photo_album', 6, '필름 앨범 여섯 장', '골목의 여러 장면을 벽에 고릅니다.', '네컷 작업실', 'photo'),
        contribution('lookbook_stars', 12, '룩북 별 열두 개', '무대 의상의 읽기 쉬운 실루엣을 찾습니다.', '골목 룩북', 'atelier'),
        contribution('q_cafe', 5, '카페 일 다섯 번', '관객이 머무는 시간의 리듬을 익힙니다.', '모퉁이 카페', 'cafe'),
        contribution('village_requests_total', 10, '골목 의뢰 열 번', '여러 사람의 작은 요청을 운영에 반영합니다.', '모험 일지 · 의뢰소', 'quest'),
      ]),
      phase('stage', 4, '매일 열리는 작은 밤', '공연·사진·룩북·동아리 기록을 모아 열린 생활 무대를 완성합니다.', '낮은 조명과 사진 벽이 켜진 상설 무대가 됩니다.', '공연이 없는 밤에도 누군가는 벽의 사진을 보고, 누군가는 단상에 앉아 다음 곡을 골랐다.', [
        contribution('q_busking', 15, '버스킹 열다섯 번', '반복해서 열 수 있는 무대 경험을 쌓습니다.', '중앙 광장 · 버스킹', 'busking'),
        contribution('photo_album', 12, '필름 앨범 열두 장', '한 해의 골목 장면을 모두 전시합니다.', '네컷 작업실', 'photo'),
        contribution('lookbook_entries', 12, '룩북 열두 장', '무대 의상 기록을 완성합니다.', '골목 룩북', 'atelier'),
        contribution('hobby_club_stage_rank', 5, '생활편집부 다섯 장', '골목 생활의 완성된 이야기를 무대에 남깁니다.', '골목 동아리', 'clubs'),
      ]),
    ],
  },
] as const;

export const COMMUNITY_PROJECT_BY_ID = new Map(COMMUNITY_PROJECTS.map((item) => [item.id, item]));
export const COMMUNITY_PROJECT_PHASES = COMMUNITY_PROJECTS.flatMap((item) => item.phases);
export const COMMUNITY_PROJECT_PHASE_BY_ID = new Map(COMMUNITY_PROJECT_PHASES.map((item) => [item.id, item]));

const clean = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.floor(value) : 0;

export const freshCommunityProjectState = (): CommunityProjectState => ({
  version: 1, claimedPhaseIds: [], featuredProjectId: null, lastClaimedAt: 0,
});

export function normalizeCommunityProjectState(raw: unknown): CommunityProjectState {
  if (!raw || typeof raw !== 'object') return freshCommunityProjectState();
  const value = raw as Partial<CommunityProjectState>;
  const input = Array.isArray(value.claimedPhaseIds)
    ? [...new Set(value.claimedPhaseIds.filter((id): id is string => typeof id === 'string' && COMMUNITY_PROJECT_PHASE_BY_ID.has(id)))]
    : [];
  const claimed = new Set<string>();
  for (const project of COMMUNITY_PROJECTS) {
    for (const item of project.phases) {
      if (!input.includes(item.id)) break;
      claimed.add(item.id);
    }
  }
  const featured = typeof value.featuredProjectId === 'string' && COMMUNITY_PROJECT_BY_ID.has(value.featuredProjectId as CommunityProjectId)
    ? value.featuredProjectId as CommunityProjectId : null;
  return { version: 1, claimedPhaseIds: [...claimed], featuredProjectId: featured, lastClaimedAt: clean(value.lastClaimedAt) };
}

const metric = (quests: QuestState, key: string): number => clean(quests.lifetimeCounts?.[key]);

export function communityProjectViews(state: CommunityProjectState, quests: QuestState): CommunityProjectView[] {
  const claimed = new Set(state.claimedPhaseIds);
  return COMMUNITY_PROJECTS.map((project) => {
    const phases = project.phases.map((item, index): CommunityProjectPhaseView => {
      const contributions = item.contributions.map((entry): CommunityContributionView => {
        const current = metric(quests, entry.key);
        return { ...entry, current, complete: current >= entry.goal, progressPct: Math.round(Math.min(current, entry.goal) / entry.goal * 100) };
      });
      const available = index === 0 || claimed.has(project.phases[index - 1]!.id);
      const complete = contributions.every((entry) => entry.complete);
      return {
        ...item, contributions, complete, claimed: claimed.has(item.id), available,
        ready: available && complete && !claimed.has(item.id), locked: !available,
        contributionsDone: contributions.filter((entry) => entry.complete).length,
      };
    });
    const level = phases.filter((item) => item.claimed).length;
    const nextPhase = phases.find((item) => !item.claimed) ?? null;
    const nextContribution = nextPhase
      ? [...nextPhase.contributions].filter((item) => !item.complete)
        .sort((a, b) => b.progressPct - a.progressPct || a.goal - a.current - (b.goal - b.current))[0] ?? null
      : null;
    return {
      ...project, phases, level, status: level >= 4 ? 'complete' : level > 0 ? 'building' : 'planned',
      ready: phases.filter((item) => item.ready).length,
      contributionMarks: phases.reduce((sum, item) => sum + item.contributionsDone, 0),
      nextPhase, nextContribution, featured: state.featuredProjectId === project.id,
    };
  });
}

export function communityProjectProgress(state: CommunityProjectState, quests: QuestState): CommunityProjectProgress {
  const views = communityProjectViews(state, quests);
  const phases = views.reduce((sum, view) => sum + view.level, 0);
  return {
    phases, totalPhases: COMMUNITY_PROJECT_PHASES.length,
    completedProjects: views.filter((view) => view.status === 'complete').length,
    totalProjects: views.length,
    activeProjects: views.filter((view) => view.status !== 'planned').length,
    ready: views.reduce((sum, view) => sum + view.ready, 0),
    contributionMarks: views.reduce((sum, view) => sum + view.contributionMarks, 0),
    totalContributionMarks: COMMUNITY_PROJECT_PHASES.length * 4,
    villageChangeLevel: phases,
  };
}

export class CommunityProjectStore {
  private state: CommunityProjectState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-community-projects-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeCommunityProjectState(raw);
    this.persist();
  }

  get(): CommunityProjectState { return this.state; }
  views(quests: QuestState): CommunityProjectView[] { return communityProjectViews(this.state, quests); }
  progress(quests: QuestState): CommunityProjectProgress { return communityProjectProgress(this.state, quests); }

  feature(projectId: CommunityProjectId): CommunityProjectState {
    this.state.featuredProjectId = this.state.featuredProjectId === projectId ? null : projectId;
    this.persist();
    return this.state;
  }

  claim(phaseId: string, quests: QuestState, claimedAt = Date.now()): CommunityProjectClaimResult {
    const item = COMMUNITY_PROJECT_PHASE_BY_ID.get(phaseId);
    if (!item) return { ok: false, reason: 'unknown-phase' };
    if (this.state.claimedPhaseIds.includes(phaseId)) return { ok: false, reason: 'already-claimed' };
    const project = COMMUNITY_PROJECT_BY_ID.get(item.projectId)!;
    const previous = item.phase > 1 ? project.phases[item.phase - 2] : null;
    if (previous && !this.state.claimedPhaseIds.includes(previous.id)) return { ok: false, reason: 'previous-phase' };
    const view = communityProjectViews(this.state, quests).find((entry) => entry.id === item.projectId)
      ?.phases.find((entry) => entry.id === phaseId);
    if (!view?.complete) return { ok: false, reason: 'not-ready' };
    this.state.claimedPhaseIds.push(phaseId);
    this.state.lastClaimedAt = clean(claimedAt);
    this.persist();
    return { ok: true, phase: item, startedProject: item.phase === 1, completedProject: item.phase === 4 };
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* session only */ }
  }
}
