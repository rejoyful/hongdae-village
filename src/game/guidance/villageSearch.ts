import type { QuestView } from '../questProgress';
import { RESIDENTS } from '../residents/residents';
import {
  ISO_RESIDENT_PLACEMENTS, ISO_VILLAGE_ACTIVITIES, type IsoActivityKind,
} from '../world/isometricVillageMap';
import {
  NEIGHBORHOOD_DISTRICTS, type NeighborhoodDistrictId,
} from '../world/neighborhoodDistricts';

export type VillageSearchKind = 'panel' | 'activity' | 'resident' | 'district' | 'quest';

export type VillageSearchPanelTarget =
  | 'bag' | 'guide' | 'map' | 'residents' | 'quest' | 'market' | 'treasure'
  | 'garden' | 'cooking' | 'fishing' | 'customize' | 'character-zine' | 'adventure-kit' | 'secrets';

export type VillageSearchAction =
  | { type: 'panel'; target: VillageSearchPanelTarget }
  | { type: 'activity'; activityKind: IsoActivityKind; tx: number; ty: number }
  | { type: 'resident'; residentId: string; tx: number; ty: number }
  | { type: 'district'; districtId: NeighborhoodDistrictId; tx: number; ty: number }
  | { type: 'quest'; questId: string; metric: string; unlocked: boolean; done: boolean };

export interface VillageSearchEntry {
  id: string;
  kind: VillageSearchKind;
  mark: string;
  code: string;
  title: string;
  subtitle: string;
  keywords: string[];
  action: VillageSearchAction;
  progress?: { current: number; goal: number; state: 'active' | 'done' | 'locked' };
}

export interface VillageSearchResult extends VillageSearchEntry {
  score: number;
}

const PANEL_ENTRIES: readonly VillageSearchEntry[] = [
  panel('search-panel-quest', '일', 'QUEST', '모험 일지', '추천·오늘·이야기·숙련 퀘스트를 확인해요.', ['퀘스트', '임무', '일일', '오늘', '목표'], 'quest'),
  panel('search-panel-guide', '책', 'GUIDE', '가이드북', '수집 도감과 취향 기록을 한곳에서 찾아요.', ['도감', '수집', '컬렉션', '몬스터', '세트'], 'guide'),
  panel('search-panel-customize', '옷', 'STYLE', '캐릭터 꾸미기', '외형·옷장·테마 코디를 바꿔요.', ['코디', '커스터마이징', '외형', '옷', '헤어', '패션'], 'customize'),
  panel('search-panel-character-zine', 'OC', 'ZINE', '골목 캐릭터 설정집', '여섯 인물의 외형·역할·모티프와 대표 카드를 보관해요.', ['캐릭터', '설정집', '자캐', '오씨', 'oc', '페르소나', '모티프', '창작'], 'character-zine'),
  panel('search-panel-bag', '가', 'BAG', '소지품 가방', '보유한 가구와 생활 물건을 확인해요.', ['인벤토리', '가방', '아이템', '소지품', '보유'], 'bag'),
  panel('search-panel-residents', '이', 'NEIGHBOR', '주민 관계 수첩', '만난 주민의 이야기·편지·최애 팬북과 작은 방 정리 의뢰를 읽어요.', ['주민', '관계', '신뢰', '편지', '팬북', '최애', '작은 방 정리', '정리 의뢰', '이웃 방', '주민 물건', '제자리'], 'residents'),
  panel('search-panel-market', '장', 'MARKET', '골목 나눔장터', '이웃의 가구를 찜하고 안전하게 나눠요.', ['장터', '거래', '교환', '찜', '경제'], 'market'),
  panel('search-panel-treasure', '보', 'TREASURE', '보물 도감', '외곽숲에서 모은 조각을 복원해요.', ['보물', '조각', '복원', '유물'], 'treasure'),
  panel('search-panel-adventure', '원', 'EXPEDITION', '골목 원정 키트', '역할·부적·저장 세팅을 비용 없이 바꿔요.', ['전투', '원정', '역할', '부적', '세팅', '사냥'], 'adventure-kit'),
  panel('search-panel-map', '지', 'MAP', '마을 지도와 골목 여권', '현재 위치와 일곱 권역을 확인해요.', ['지도', '권역', '골목', '여권', '위치'], 'map'),
  panel('search-panel-secrets', '◇', 'SECRET', '골목 비밀 기록', '환경 단서 12개와 네 편의 숨은 이야기를 모아요.', ['비밀', '숨은', '단서', '환경', '세계관', '기록', '수집'], 'secrets'),
] as const;

const FEATURED_IDS = [
  'search-panel-quest', 'search-panel-customize', 'search-panel-residents', 'search-panel-map',
  'activity-home-door', 'activity-petshop-door', 'activity-sallim-showroom', 'activity-neighborhood-guide',
] as const;

const ACTIVITY_ALIASES: Partial<Record<IsoActivityKind, string[]>> = {
  home: ['집', '집꾸미기', '하우징', '인테리어', '방꾸미기'],
  quest: ['퀘스트', '모험 일지', '임무'],
  cafe: ['카페', '커피', '알바'],
  busking: ['버스킹', '음악', '공연'],
  photo: ['사진', '네컷', '포토카드'],
  petshop: ['펫', '동행', '입양', '돌봄'],
  atelier: ['코디', '커스터마이징', '옷장', '패션', '캐릭터 설정집', '자캐', 'oc', '페르소나'],
  shop: ['가구', '쇼룸', '살림', '상점'],
  workshop: ['제작', 'DIY', '공방', '리폼'],
  garden: ['정원', '씨앗', '식물', '재배'],
  kitchen: ['요리', '주방', '메뉴'],
  fishing: ['낚시', '물정원', '물고기'],
  showcase: ['전시', '취향', '쇼케이스'],
  clubs: ['동아리', '클럽', '취미'],
  projects: ['함께짓기', '공동', '프로젝트'],
  guide: ['소풍', '안내소', '산책'],
  search: ['찾기', '검색', '안내함', '길찾기', '어디'],
  museum: ['박물관', '전시관', '기념품'],
  market: ['장터', '거래', '교환', '찜'],
  atmosphere: ['날씨', '하늘', '비', '눈', '안개', '꽃잎', '분위기', '기상', '관측소'],
};

function panel(
  id: string, mark: string, code: string, title: string, subtitle: string,
  keywords: string[], target: VillageSearchPanelTarget,
): VillageSearchEntry {
  return { id, kind: 'panel', mark, code, title, subtitle, keywords, action: { type: 'panel', target } };
}

function normalize(value: string): string {
  return value.toLocaleLowerCase('ko-KR').normalize('NFKC').replace(/[^0-9a-z가-힣]+/g, '');
}

function queryTokens(value: string): string[] {
  return value.toLocaleLowerCase('ko-KR').normalize('NFKC')
    .split(/[\s·,/|()[\]{}_-]+/g).map(normalize).filter(Boolean);
}

function staticEntries(): VillageSearchEntry[] {
  const residents = new Map(RESIDENTS.map((resident) => [resident.id, resident]));
  return [
    ...PANEL_ENTRIES,
    ...ISO_VILLAGE_ACTIVITIES.map((spot): VillageSearchEntry => ({
      id: `activity-${spot.id}`, kind: 'activity', mark: spot.label.slice(0, 1), code: 'PLACE',
      title: spot.label, subtitle: '금빛 발자국으로 실제 활동 위치까지 안내해요.',
      keywords: [spot.id, spot.kind, spot.questKey, ...(ACTIVITY_ALIASES[spot.kind] ?? []), '장소', '활동'],
      action: { type: 'activity', activityKind: spot.kind, tx: spot.tx, ty: spot.ty },
    })),
    ...ISO_RESIDENT_PLACEMENTS.flatMap((placement): VillageSearchEntry[] => {
      const resident = residents.get(placement.residentId);
      return resident ? [{
        id: `resident-${resident.id}`, kind: 'resident', mark: resident.name.slice(0, 1), code: 'RESIDENT',
        title: resident.name, subtitle: `${resident.role} · ${resident.favorite}`,
        keywords: [resident.role, resident.favorite, resident.keepsake, '주민', '인사', '신뢰'],
        action: { type: 'resident', residentId: resident.id, tx: placement.tx, ty: placement.ty },
      }] : [];
    }),
    ...NEIGHBORHOOD_DISTRICTS.map((district): VillageSearchEntry => ({
      id: `district-${district.id}`, kind: 'district', mark: district.mark, code: district.code,
      title: district.name, subtitle: district.description,
      keywords: [district.subtitle, district.safe ? '안전' : '외곽 전투 관찰', '권역', '골목 여권'],
      action: {
        type: 'district', districtId: district.id,
        tx: district.guideTarget.tx, ty: district.guideTarget.ty,
      },
    })),
  ];
}

export function villageSearchEntries(quests: readonly QuestView[]): VillageSearchEntry[] {
  return [
    ...staticEntries(),
    ...quests.map((quest): VillageSearchEntry => ({
      id: `quest-${quest.id}`, kind: 'quest', mark: quest.done ? '완' : quest.unlocked ? '진' : '잠',
      code: quest.category.toLocaleUpperCase('en-US'), title: quest.name,
      subtitle: `${quest.desc} · ${quest.location}`,
      keywords: [quest.registryKey, quest.category, quest.tip ?? '', quest.rewardLabel ?? '', '퀘스트', '목표'],
      action: {
        type: 'quest', questId: quest.id, metric: quest.registryKey,
        unlocked: quest.unlocked, done: quest.done,
      },
      progress: {
        current: Math.min(quest.progress, quest.goal), goal: quest.goal,
        state: quest.done ? 'done' : quest.unlocked ? 'active' : 'locked',
      },
    })),
  ];
}

function entryScore(entry: VillageSearchEntry, query: string, tokens: readonly string[]): number {
  const title = normalize(entry.title);
  const subtitle = normalize(entry.subtitle);
  const keywords = entry.keywords.map(normalize);
  const haystack = [title, subtitle, entry.code, entry.kind, ...keywords].join('|');
  if (!tokens.every((token) => haystack.includes(token))) return -1;
  let score = 0;
  if (title === query) score += 140;
  else if (title.startsWith(query)) score += 95;
  else if (title.includes(query)) score += 70;
  if (keywords.some((keyword) => keyword === query)) score += 55;
  else if (keywords.some((keyword) => keyword.includes(query))) score += 28;
  if (subtitle.includes(query)) score += 18;
  score += tokens.length * 7;
  if (entry.kind === 'activity' || entry.kind === 'resident' || entry.kind === 'district') score += 5;
  if (entry.progress?.state === 'active') score += 6;
  if (entry.progress?.state === 'locked') score -= 8;
  return score;
}

/** 제목·설명·별칭의 모든 검색어가 일치해야 하며, 정확한 장소와 진행 중 퀘스트를 먼저 보여 준다. */
export function searchVillage(
  query: string,
  quests: readonly QuestView[],
  kind: VillageSearchKind | 'all' = 'all',
  limit = 36,
): VillageSearchResult[] {
  const entries = villageSearchEntries(quests).filter((entry) => kind === 'all' || entry.kind === kind);
  const normalizedQuery = normalize(query);
  const tokens = queryTokens(query);
  if (!normalizedQuery || !tokens.length) {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    return FEATURED_IDS.flatMap((id) => {
      const entry = byId.get(id);
      return entry ? [{ ...entry, score: 0 }] : [];
    }).slice(0, limit);
  }
  return entries.map((entry) => ({ ...entry, score: entryScore(entry, normalizedQuery, tokens) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'ko-KR'))
    .slice(0, Math.max(1, limit));
}
