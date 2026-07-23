import type { LifeMasteryId } from './lifeMastery';

export interface LifeSynergyDef {
  id: string;
  mark: string;
  title: string;
  epithet: string;
  description: string;
  domains: readonly [LifeMasteryId, LifeMasteryId, LifeMasteryId];
  palette: readonly [string, string, string];
  keepsake: string;
}

/**
 * 대표 전문성 세 장을 MMO식 빌드처럼 조합하되 능력치 우열은 만들지 않는다.
 * 서로 다른 세 생활 분야의 정확한 조합마다 호칭·색·영구 발견 표식만 남는다.
 */
export const LIFE_SYNERGIES: readonly LifeSynergyDef[] = [
  {
    id: 'alley_editor', mark: '편', title: '골목 장면 편집자', epithet: '걷고 만나고 무대에 남기는 사람',
    description: '탐험에서 찾은 장면을 이웃과 나누고 골목의 작은 무대로 엮습니다.',
    domains: ['exploration', 'community', 'performer'], palette: ['#d8c47f', '#729078', '#9d6658'],
    keepsake: '세 갈래 골목 편집핀',
  },
  {
    id: 'cozy_curator', mark: '온', title: '포근한 취향 큐레이터', epithet: '옷과 방과 동행을 한 결로',
    description: '오늘의 코디, 머무는 방, 작은 동행의 색을 하나의 생활 장면으로 맞춥니다.',
    domains: ['style', 'home', 'companion'], palette: ['#d99ca0', '#b98962', '#7a6656'],
    keepsake: '포근한 세 장면 리본',
  },
  {
    id: 'rooftop_table', mark: '상', title: '옥상 식탁 정원사', epithet: '기른 것을 함께 먹는 저녁',
    description: '옥상에서 기른 계절을 따뜻한 한 접시로 바꾸어 이웃과 나눕니다.',
    domains: ['gardener', 'culinary', 'community'], palette: ['#a9b972', '#d49a64', '#62806a'],
    keepsake: '옥상 저녁 식탁보',
  },
  {
    id: 'water_room', mark: '수', title: '물빛 방 설계자', epithet: '잎과 물결이 머무는 공간',
    description: '집 안의 동선에 식물과 수조의 잔물결을 겹쳐 조용한 생태 방을 만듭니다.',
    domains: ['home', 'gardener', 'angler'], palette: ['#b48a69', '#7d9b66', '#6594a0'],
    keepsake: '물빛 온실 평면도',
  },
  {
    id: 'field_archivist', mark: '록', title: '외곽 현장 아키비스트', epithet: '길과 물과 숲의 작은 증거',
    description: '골목 밖 길, 세 물가, 외곽숲의 흔적을 한 권의 안전한 현장 수첩에 모읍니다.',
    domains: ['exploration', 'angler', 'adventure'], palette: ['#c9b66f', '#5f8f9a', '#776b96'],
    keepsake: '외곽 현장 필름함',
  },
  {
    id: 'stage_stylist', mark: '빛', title: '골목 무대 스타일리스트', epithet: '사람과 옷과 음악을 비추는 손',
    description: '이웃의 개성을 해치지 않는 코디와 조명으로 모두가 편한 무대를 준비합니다.',
    domains: ['style', 'community', 'performer'], palette: ['#d992aa', '#74927b', '#c98459'],
    keepsake: '백스테이지 색실 패스',
  },
  {
    id: 'pet_atelier', mark: '발', title: '동행 소품 공방장', epithet: '함께 걷는 친구의 작은 취향',
    description: '동행에게 어울리는 소품을 고르고 이웃과 안전한 돌봄 경험을 나눕니다.',
    domains: ['style', 'companion', 'community'], palette: ['#d99ab0', '#a77f61', '#6f9178'],
    keepsake: '동행 맞춤 재단표',
  },
  {
    id: 'forest_picnic', mark: '소', title: '숲길 소풍 요리사', epithet: '발견을 도시락에 담는 사람',
    description: '천천히 찾은 외곽 풍경을 따뜻한 한 끼와 안전한 소풍 경로로 바꿉니다.',
    domains: ['exploration', 'culinary', 'adventure'], palette: ['#cfb86f', '#d18a62', '#766c94'],
    keepsake: '숲길 도시락 지도',
  },
  {
    id: 'neighborhood_host', mark: '문', title: '다정한 골목 호스트', epithet: '문을 열고 한 끼를 건네는 집',
    description: '머물기 좋은 방과 작은 식탁을 준비해 이웃이 부담 없이 쉬어 갈 자리를 만듭니다.',
    domains: ['home', 'community', 'culinary'], palette: ['#b98a67', '#719078', '#d09a63'],
    keepsake: '다정한 현관 식탁표',
  },
  {
    id: 'companion_explorer', mark: '짝', title: '나란한 길 탐험가', epithet: '작은 친구의 속도로 보는 외곽',
    description: '동행의 신호를 살피며 골목과 외곽숲을 무리 없이 함께 기록합니다.',
    domains: ['exploration', 'companion', 'adventure'], palette: ['#d0bc72', '#a47c62', '#756b94'],
    keepsake: '나란한 발자국 나침반',
  },
  {
    id: 'night_photographer', mark: '밤', title: '밤골목 화보 감독', epithet: '빛과 옷과 박자를 한 장에',
    description: '밤의 골목을 걷고 어울리는 코디와 공연의 순간을 오래 남을 장면으로 만듭니다.',
    domains: ['exploration', 'style', 'performer'], palette: ['#d1ba71', '#b77b9a', '#925f62'],
    keepsake: '밤골목 필름 클랩',
  },
  {
    id: 'slow_naturalist', mark: '결', title: '느린 생태 관찰가', epithet: '잎과 물과 숲을 서두르지 않게',
    description: '정원, 수로, 외곽숲의 변화를 경쟁 없이 비교하고 작은 차이를 기록합니다.',
    domains: ['gardener', 'angler', 'adventure'], palette: ['#8da76b', '#6594a1', '#756b93'],
    keepsake: '세 생태 관찰 렌즈',
  },
  {
    id: 'cozy_maker', mark: '손', title: '생활 결 메이커', epithet: '입고 머물고 기르는 한 가지 색',
    description: '옷감의 색, 가구의 결, 식물의 잎을 조율해 나만의 생활 팔레트를 만듭니다.',
    domains: ['style', 'home', 'gardener'], palette: ['#d798a7', '#aa7e60', '#7f9b65'],
    keepsake: '생활 결 삼색 견본',
  },
  {
    id: 'festival_chef', mark: '잔', title: '골목 잔치 요리감독', epithet: '한 접시와 한 곡으로 모이는 밤',
    description: '이웃이 편히 어울리는 무대와 음식의 순서를 조율해 작은 골목 잔치를 엽니다.',
    domains: ['performer', 'culinary', 'community'], palette: ['#bd735d', '#d49a61', '#6f9078'],
    keepsake: '골목 잔치 순서표',
  },
  {
    id: 'water_companion', mark: '물', title: '동행 물정원 돌봄가', epithet: '방 안의 잔물결을 함께 보는 시간',
    description: '동행이 쉬기 좋은 방에 작은 물 생태를 들이고 조용한 관찰 자리를 만듭니다.',
    domains: ['home', 'companion', 'angler'], palette: ['#ad8366', '#a17a62', '#6093a1'],
    keepsake: '동행 물결 관찰석',
  },
  {
    id: 'trail_chef', mark: '길', title: '물길 탐사 요리사', epithet: '수로와 숲의 이야기를 한 접시에',
    description: '물가와 외곽에서 만난 풍경을 무리 없는 탐사식과 기록 메뉴로 엮습니다.',
    domains: ['culinary', 'angler', 'adventure'], palette: ['#d09661', '#6093a0', '#766a93'],
    keepsake: '물길 탐사 레시피',
  },
  {
    id: 'rooftop_festival', mark: '등', title: '옥상 초록 축제감독', epithet: '잎과 이웃과 음악이 켜지는 저녁',
    description: '옥상의 초록을 무대와 쉼터로 엮어 누구나 잠시 머무는 작은 축제를 만듭니다.',
    domains: ['gardener', 'performer', 'community'], palette: ['#8ea66a', '#bd745e', '#6f9078'],
    keepsake: '옥상 초록 조명핀',
  },
  {
    id: 'archive_curator', mark: '책', title: '취향 연대 큐레이터', epithet: '걷고 입고 만난 것을 한 권에',
    description: '골목에서 발견한 장면과 스타일, 이웃의 기억을 서로의 맥락이 보이는 전시로 묶습니다.',
    domains: ['exploration', 'style', 'community'], palette: ['#ceb873', '#b77c9a', '#709078'],
    keepsake: '취향 연대 색인표',
  },
] as const;

export const LIFE_SYNERGY_BY_ID = new Map(LIFE_SYNERGIES.map((synergy) => [synergy.id, synergy]));

const signature = (domains: Iterable<LifeMasteryId>): string => [...new Set(domains)].sort().join('|');
const SYNERGY_BY_SIGNATURE = new Map(LIFE_SYNERGIES.map((synergy) => [signature(synergy.domains), synergy]));

export function lifeSynergyForMasteries(domains: Iterable<LifeMasteryId>): LifeSynergyDef | null {
  const unique = [...new Set(domains)];
  if (unique.length !== 3) return null;
  return SYNERGY_BY_SIGNATURE.get(signature(unique)) ?? null;
}

/** 현재 대표 분야와 가장 많이 겹치는 미완성 조합을 안정적인 순서로 제안한다. */
export function recommendLifeSynergies(
  domains: Iterable<LifeMasteryId>, discoveredIds: Iterable<string> = [], limit = 3,
): LifeSynergyDef[] {
  const current = new Set(domains);
  const discovered = new Set(discoveredIds);
  return LIFE_SYNERGIES
    .map((synergy, index) => ({
      synergy, index,
      overlap: synergy.domains.filter((domain) => current.has(domain)).length,
      discovered: discovered.has(synergy.id),
    }))
    .sort((a, b) => b.overlap - a.overlap || Number(a.discovered) - Number(b.discovered) || a.index - b.index)
    .slice(0, Math.max(0, limit))
    .map((item) => item.synergy);
}
