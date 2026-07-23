import type { LifeMasteryId, LifeMasteryView } from './lifeMastery';
import {
  LIFE_SYNERGIES, LIFE_SYNERGY_BY_ID, lifeSynergyForMasteries, type LifeSynergyDef,
} from './lifeSynergies';

export interface LifeSpecialtyCardDef {
  id: string;
  masteryId: LifeMasteryId;
  tier: 1 | 2 | 3;
  unlockLevel: 2 | 5 | 8;
  mark: string;
  title: string;
  line: string;
  keepsake: string;
  palette: readonly [string, string, string];
}

export interface LifeSpecialtyCardView extends LifeSpecialtyCardDef {
  unlocked: boolean;
  featured: boolean;
  masteryLevel: number;
}

export interface LifeSpecialtyProgress {
  unlockedCards: number;
  totalCards: number;
  featuredCards: number;
  featuredDomains: number;
  masteredDomains: number;
  discoveredSynergies: number;
  totalSynergies: number;
  currentSynergyId: string | null;
  edits: number;
}

interface LifeSpecialtyState {
  version: 2;
  unlockedIds: string[];
  featuredIds: string[];
  discoveredSynergyIds: string[];
  edits: number;
}

const MAX_FEATURED = 3;
export const LIFE_SPECIALTY_FEATURED_MAX = MAX_FEATURED;

type CardSeed = readonly [mark: string, title: string, line: string, keepsake: string];

const BOARD_SEEDS: ReadonlyArray<{
  masteryId: LifeMasteryId;
  palette: readonly [string, string, string];
  cards: readonly [CardSeed, CardSeed, CardSeed];
}> = [
  { masteryId: 'exploration', palette: ['#d9c27e', '#718777', '#3f514b'], cards: [
    ['눈', '골목 관찰자', '지나치기 쉬운 생활 풍경을 먼저 발견합니다.', '관찰 노트 책갈피'],
    ['길', '소풍 노선 편집자', '그날의 기분에 맞는 골목 순서를 엮습니다.', '열두 길 접이 지도'],
    ['록', '도시 연대 탐사가', '장소와 사람의 시간을 한 권에 보존합니다.', '도시 기억 동판'],
  ] },
  { masteryId: 'style', palette: ['#e3a5a0', '#a56f7e', '#5f4658'], cards: [
    ['색', '색조 조율사', '작은 포인트색으로 오늘의 기분을 말합니다.', '휴대용 색실표'],
    ['옷', '실루엣 편집자', '익숙한 옷도 나다운 비율로 다시 읽습니다.', '골목 재단 핀'],
    ['최', '최애 룩 아카이비스트', '코디와 포토카드를 나만의 화보로 엮습니다.', '영구 소장 룩 인덱스'],
  ] },
  { masteryId: 'home', palette: ['#e0bd83', '#a8795c', '#60493b'], cards: [
    ['온', '온기 배치가', '한 칸의 불빛과 의자로 머물 자리를 만듭니다.', '작은 스탠드 도면'],
    ['선', '생활 동선 설계자', '보기 좋은 방과 편안한 움직임을 함께 맞춥니다.', '생활 동선 자'],
    ['장', '방의 장면 감독', '가구·리폼·동행이 만나는 한 장면을 완성합니다.', '시그니처 룸 명판'],
  ] },
  { masteryId: 'companion', palette: ['#d7b486', '#9d765d', '#5d493e'], cards: [
    ['맘', '마음 신호 번역가', '작은 몸짓에 둘만 알아보는 뜻을 붙입니다.', '마음 번역 꼬리표'],
    ['발', '산책 리듬 메이커', '동행이 좋아하는 속도로 여덟 골목을 걷습니다.', '나란한 발자국 띠'],
    ['함', '동행 추억 기록가', '집과 길에서 만난 순간을 오래 보존합니다.', '동행 기억 메달'],
  ] },
  { masteryId: 'community', palette: ['#a9c79e', '#708f78', '#425b51'], cards: [
    ['안', '안부 수집가', '먼저 건넨 한마디로 이웃의 오늘을 기억합니다.', '골목 안부 우표'],
    ['약', '골목 약속 조율자', '서로 편한 방식으로 만남의 장면을 이어 갑니다.', '약속 시간표 리본'],
    ['연', '관계 연대 편집자', '열 사람의 이야기와 마을의 변화를 함께 엮습니다.', '이웃 연대 인장'],
  ] },
  { masteryId: 'performer', palette: ['#e2b56f', '#b36f58', '#6c4540'], cards: [
    ['삶', '모퉁이 생활인', '알바와 놀이의 작은 성공을 하루에 담습니다.', '단골 가게 토큰'],
    ['흥', '골목 무대 기획자', '거리의 소리와 사람을 한 무대에 모읍니다.', '백스테이지 패스'],
    ['밤', '밤거리 축제 감독', '평범한 저녁을 모두의 기념일로 연출합니다.', '밤골목 조명 배지'],
  ] },
  { masteryId: 'gardener', palette: ['#b9c47f', '#77945d', '#476245'], cards: [
    ['싹', '새싹 관찰자', '서두르지 않고 매일의 작은 변화를 살핍니다.', '첫잎 표본 봉투'],
    ['결', '성장 결 연구가', '같은 씨앗에서 나온 서로 다른 결을 기록합니다.', '성장 결 표본함'],
    ['철', '옥상 계절 큐레이터', '열두 식물로 골목 위의 사계절을 만듭니다.', '옥상 정원 명찰'],
  ] },
  { masteryId: 'culinary', palette: ['#e1bf81', '#bd7959', '#714b3d'], cards: [
    ['접', '한 접시 기록가', '수확물의 이야기를 따뜻한 한 끼로 남깁니다.', '첫 접시 레시피'],
    ['맛', '골목 메뉴 편집자', '다시 찾고 싶은 맛과 플레이팅을 고릅니다.', '단골 메뉴 인쇄판'],
    ['상', '계절 식탁 감독', '정원과 이웃이 만나는 계절 식탁을 완성합니다.', '사계절 식탁보'],
  ] },
  { masteryId: 'angler', palette: ['#99c1c0', '#628c98', '#405a6b'], cards: [
    ['물', '물결 관찰자', '세 물가에서 먼저 다가온 생물을 기억합니다.', '잔물결 관찰경'],
    ['생', '수로 생태 기록가', '생물의 종류와 크기를 조용히 비교합니다.', '도심 수로 도감'],
    ['원', '물정원 아카이비스트', '발견과 수조의 풍경을 하나의 생태로 엮습니다.', '물정원 유리 인장'],
  ] },
  { masteryId: 'adventure', palette: ['#b4a4c9', '#7a6e9d', '#4e496d'], cards: [
    ['숲', '숲길 답사자', '안전한 길과 낯선 흔적을 차근차근 구분합니다.', '외곽숲 나침반'],
    ['흔', '생태 흔적 연구가', '전투보다 먼저 생태와 패턴을 관찰합니다.', '생태 연구 필름'],
    ['전', '외곽숲 전설 기록가', '모든 발견을 다음 탐험가의 안내서로 남깁니다.', '보랏빛 전설 휘장'],
  ] },
] as const;

const LEVELS = [2, 5, 8] as const;

export const LIFE_SPECIALTY_CARDS: readonly LifeSpecialtyCardDef[] = BOARD_SEEDS.flatMap((board) =>
  board.cards.map((seed, index) => ({
    id: `${board.masteryId}_${index + 1}`,
    masteryId: board.masteryId,
    tier: (index + 1) as 1 | 2 | 3,
    unlockLevel: LEVELS[index]!,
    mark: seed[0], title: seed[1], line: seed[2], keepsake: seed[3], palette: board.palette,
  })),
);

const CARD_BY_ID = new Map(LIFE_SPECIALTY_CARDS.map((card) => [card.id, card]));

function normalizeLifeSpecialty(raw: unknown): LifeSpecialtyState {
  if (!raw || typeof raw !== 'object') {
    return { version: 2, unlockedIds: [], featuredIds: [], discoveredSynergyIds: [], edits: 0 };
  }
  const value = raw as Partial<LifeSpecialtyState>;
  const unlockedIds = Array.isArray(value.unlockedIds)
    ? [...new Set(value.unlockedIds.filter((id): id is string => typeof id === 'string' && CARD_BY_ID.has(id)))]
    : [];
  const featuredIds = Array.isArray(value.featuredIds)
    ? [...new Set(value.featuredIds.filter((id): id is string => typeof id === 'string' && CARD_BY_ID.has(id)))].slice(0, MAX_FEATURED)
    : [];
  const discoveredSynergyIds = Array.isArray(value.discoveredSynergyIds)
    ? [...new Set(value.discoveredSynergyIds.filter((id): id is string => typeof id === 'string' && LIFE_SYNERGY_BY_ID.has(id)))]
    : [];
  const edits = Number(value.edits);
  return {
    version: 2, unlockedIds, featuredIds, discoveredSynergyIds,
    edits: Number.isFinite(edits) ? Math.max(0, Math.floor(edits)) : 0,
  };
}

export class LifeSpecialtyStore {
  private readonly key: string;
  private state: LifeSpecialtyState;

  constructor(userId: string) {
    this.key = `hv-life-specialty-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 없는 환경에서는 현재 세션만 유지 */ }
    this.state = normalizeLifeSpecialty(raw);
    this.persist();
  }

  views(masteries: readonly LifeMasteryView[]): LifeSpecialtyCardView[] {
    const levels = new Map(masteries.map((mastery) => [mastery.id, mastery.level]));
    const unlockedIds = new Set(this.state.unlockedIds);
    let changed = false;
    for (const card of LIFE_SPECIALTY_CARDS) {
      if ((levels.get(card.masteryId) ?? 1) >= card.unlockLevel && !unlockedIds.has(card.id)) {
        unlockedIds.add(card.id); changed = true;
      }
    }
    if (changed) {
      this.state.unlockedIds = LIFE_SPECIALTY_CARDS.filter((card) => unlockedIds.has(card.id)).map((card) => card.id);
      this.persist();
    }
    const featured = new Set(this.state.featuredIds);
    return LIFE_SPECIALTY_CARDS.map((card) => {
      const masteryLevel = levels.get(card.masteryId) ?? 1;
      return { ...card, masteryLevel, unlocked: unlockedIds.has(card.id), featured: featured.has(card.id) };
    });
  }

  featuredIds(): string[] { return [...this.state.featuredIds]; }
  discoveredSynergyIds(): string[] { return [...this.state.discoveredSynergyIds]; }

  currentSynergy(masteries: readonly LifeMasteryView[]): LifeSynergyDef | null {
    const featured = this.views(masteries).filter((card) => card.featured && card.unlocked);
    return lifeSynergyForMasteries(featured.map((card) => card.masteryId));
  }

  synergyViews(masteries: readonly LifeMasteryView[]) {
    const current = this.recordCurrentSynergy(this.views(masteries));
    const discovered = new Set(this.state.discoveredSynergyIds);
    return LIFE_SYNERGIES.map((synergy) => ({
      ...synergy, discovered: discovered.has(synergy.id), current: current?.id === synergy.id,
    }));
  }

  toggle(cardId: string, masteries: readonly LifeMasteryView[]): 'added' | 'removed' | 'locked' | 'full' | 'unknown' {
    const card = this.views(masteries).find((item) => item.id === cardId);
    if (!card) return 'unknown';
    if (this.state.featuredIds.includes(cardId)) {
      this.state.featuredIds = this.state.featuredIds.filter((id) => id !== cardId);
      this.state.edits += 1; this.persist(); this.recordCurrentSynergy(this.views(masteries)); return 'removed';
    }
    if (!card.unlocked) return 'locked';
    if (this.state.featuredIds.length >= MAX_FEATURED) return 'full';
    this.state.featuredIds.push(cardId);
    this.state.edits += 1; this.persist(); this.recordCurrentSynergy(this.views(masteries)); return 'added';
  }

  progress(masteries: readonly LifeMasteryView[]): LifeSpecialtyProgress {
    const views = this.views(masteries);
    const unlocked = views.filter((card) => card.unlocked);
    const featured = views.filter((card) => card.featured && card.unlocked);
    const currentSynergy = this.recordCurrentSynergy(views);
    return {
      unlockedCards: unlocked.length,
      totalCards: views.length,
      featuredCards: featured.length,
      featuredDomains: new Set(featured.map((card) => card.masteryId)).size,
      masteredDomains: new Set(unlocked.filter((card) => card.tier === 3).map((card) => card.masteryId)).size,
      discoveredSynergies: this.state.discoveredSynergyIds.length,
      totalSynergies: LIFE_SYNERGIES.length,
      currentSynergyId: currentSynergy?.id ?? null,
      edits: this.state.edits,
    };
  }

  private recordCurrentSynergy(views: readonly LifeSpecialtyCardView[]): LifeSynergyDef | null {
    const featured = views.filter((card) => card.featured && card.unlocked);
    const synergy = lifeSynergyForMasteries(featured.map((card) => card.masteryId));
    if (synergy && !this.state.discoveredSynergyIds.includes(synergy.id)) {
      this.state.discoveredSynergyIds.push(synergy.id);
      this.persist();
    }
    return synergy;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
