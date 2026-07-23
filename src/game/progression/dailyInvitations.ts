import type { QuestState } from '../questProgress';
import { LIFE_SPECIALTY_CARDS } from './lifeSpecialty';
import type { LifeMasteryId } from './lifeMastery';

export interface DailyInvitationDef {
  id: string;
  masteryId: LifeMasteryId;
  mark: string;
  title: string;
  description: string;
  metric: string;
  goal: number;
  location: string;
}

export interface DailyInvitationView extends DailyInvitationDef {
  current: number;
  done: boolean;
  claimed: boolean;
  slot: number;
}

export interface DailyInvitationProgress {
  todayClaimed: number;
  todaySlots: number;
  uniqueStamps: number;
  totalStamps: number;
  stampedDomains: number;
  totalClaims: number;
  rerolls: number;
}

interface DailyInvitationState {
  version: 1;
  day: string;
  slotIds: string[];
  baselines: Record<string, number>;
  claimedIds: string[];
  stampIds: string[];
  totalClaims: number;
  rerolls: number;
}

type Seed = readonly [mark: string, title: string, description: string, metric: string, goal: number, location: string];

const INVITATION_SEEDS: ReadonlyArray<{ masteryId: LifeMasteryId; cards: readonly [Seed, Seed, Seed] }> = [
  { masteryId: 'exploration', cards: [
    ['길', '지도를 접어 주머니에', '오늘 걷고 싶은 골목을 지도에서 한 번 살펴봐요.', 'open_map', 1, '하단 지도 또는 M'],
    ['빛', '세 번의 작은 발견', '바닥의 반짝임을 세 번 발견해 관찰 노트를 채워요.', 'sparkle_collect', 3, '골목·광장·숲길'],
    ['컷', '오늘 풍경 한 장', '현재 모습과 골목을 네컷 사진으로 한 번 남겨요.', 'photo_taken', 1, '네컷 작업실'],
  ] },
  { masteryId: 'style', cards: [
    ['색', '오늘 기분 한 색', '캐릭터 코디를 한 번 저장해 오늘의 색을 남겨요.', 'customize_save', 1, '캐릭터 아틀리에'],
    ['옷', '옷장에 꽂는 하루', '마음에 든 코디를 옷장 슬롯에 한 번 기록해요.', 'closet_save', 1, '아틀리에 · 옷장'],
    ['록', '골목 룩북 한 페이지', '코디 의뢰에 지금 모습을 한 번 제출해 봐요.', 'lookbook_submissions', 1, '아틀리에 · 골목 룩북'],
  ] },
  { masteryId: 'home', cards: [
    ['문', '집에 불을 켜는 시간', '내 집에 들러 오늘의 공간을 한 번 바라봐요.', 'visit_home', 1, '주택가 · 내 집'],
    ['집', '두 칸의 작은 변화', '가구 두 점을 놓아 방의 분위기를 가볍게 바꿔요.', 'q_place', 2, '내 집 · 꾸미기 모드'],
    ['결', '가구에 새 결 한 번', '배치 가구의 마감이나 색감을 한 번 리폼해요.', 'furniture_reform_saves', 1, '내 집 · 리폼 공방'],
  ] },
  { masteryId: 'companion', cards: [
    ['밥', '작은 동행의 식사', '함께 걷는 친구에게 먹이를 한 번 건네요.', 'pet_feed', 1, '펫샵 · 돌봄'],
    ['놀', '잠깐의 장난 시간', '동행과 한 번 놀며 오늘의 기분을 살펴요.', 'pet_play', 1, '펫샵 · 돌봄'],
    ['발', '나란히 한 골목', '동행과 원하는 산책 코스를 한 번 걸어요.', 'pet_outings_total', 1, '펫샵 · 산책 수첩'],
  ] },
  { masteryId: 'community', cards: [
    ['안', '두 사람에게 안부', '이름 있는 주민 두 명에게 천천히 인사해요.', 'resident_greet', 2, '마을 주민 이름표 근처'],
    ['몸', '말 대신 두 번의 몸짓', '부담 없는 이모트로 두 번 마음을 건네요.', 'q_emote', 2, '어디서나 · 이모트'],
    ['손', '골목 부탁 한 장', '마음 가는 골목 의뢰 한 장을 해결해요.', 'village_requests_total', 1, '모험 일지 · 의뢰소'],
  ] },
  { masteryId: 'performer', cards: [
    ['잔', '모퉁이의 한 타임', '카페에서 한 번 일하며 골목의 하루를 도와요.', 'q_cafe', 1, '카페 「모퉁이」'],
    ['음', '거리의 짧은 앙코르', '버스킹을 한 번 성공해 오늘의 소리를 남겨요.', 'q_busking', 1, '메인 스트리트 무대'],
    ['둘', '두 곡의 다른 박자', '버스킹을 두 번 즐기며 오늘 골목의 다른 박자를 찾아요.', 'q_busking', 2, '메인 스트리트 무대'],
  ] },
  { masteryId: 'gardener', cards: [
    ['물', '두 화분의 안부', '화분을 두 번 돌보며 작은 변화를 관찰해요.', 'garden_tend', 2, '옥상 씨앗 연구소'],
    ['잎', '오늘의 첫 수확', '충분히 자란 식물을 한 번 수확해요.', 'garden_harvest', 1, '옥상 씨앗 연구소'],
    ['싹', '빈 화분에 새 계절', '빈 화분에 마음에 드는 씨앗 하나를 심어요.', 'garden_planted', 1, '옥상 씨앗 연구소'],
  ] },
  { masteryId: 'culinary', cards: [
    ['접', '오늘의 한 접시', '정원 재료로 메뉴 한 접시를 완성해요.', 'cooking_total', 1, '모퉁이 골목 주방'],
    ['둘', '두 접시의 다른 결', '메뉴를 두 번 만들며 플레이팅을 비교해요.', 'cooking_total', 2, '모퉁이 골목 주방'],
    ['상', '작은 저녁 세 접시', '좋아하는 메뉴를 세 접시 천천히 완성해요.', 'cooking_total', 3, '모퉁이 골목 주방'],
  ] },
  { masteryId: 'angler', cards: [
    ['물', '잔물결 한 번', '가까운 물가에서 생물을 한 번 만나 봐요.', 'fishing_total', 1, '물정원 낚시 수첩'],
    ['둘', '두 번 기다린 물결', '서두르지 않고 낚시를 두 번 즐겨요.', 'fishing_total', 2, '세 곳의 물정원'],
    ['수', '방 안의 물결 바꾸기', '테라리움 구성을 한 번 저장해요.', 'aquarium_saves', 1, '내 집 · 물결 테라리움'],
  ] },
  { masteryId: 'adventure', cards: [
    ['숲', '외곽숲 세 번의 관찰', '안전 경계를 확인하며 몬스터 세 마리를 관찰해요.', 'monster_kill', 3, '동쪽 외곽숲'],
    ['조', '반짝이는 생태 조각', '외곽 생태에서 보물 조각 한 개를 발견해요.', 'monster_shard', 1, '동쪽 외곽숲'],
    ['걷', '숲길의 느린 30초', '전투 없이 숲길에서 30초 천천히 걸어요.', 'q_forest', 30, '경의선 숲길'],
  ] },
] as const;

export const DAILY_INVITATIONS: readonly DailyInvitationDef[] = INVITATION_SEEDS.flatMap((group) =>
  group.cards.map((seed, index) => ({
    id: `${group.masteryId}_${index + 1}`, masteryId: group.masteryId,
    mark: seed[0], title: seed[1], description: seed[2], metric: seed[3], goal: seed[4], location: seed[5],
  })),
);

const INVITATION_BY_ID = new Map(DAILY_INVITATIONS.map((item) => [item.id, item]));
const METRIC_KEYS = [...new Set(DAILY_INVITATIONS.map((item) => item.metric))];

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const hashDay = (day: string): number => Array.from(day).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);

function normalizeState(raw: unknown): DailyInvitationState {
  const value = raw && typeof raw === 'object' ? raw as Partial<DailyInvitationState> : {};
  const validIds = (input: unknown, max = Number.MAX_SAFE_INTEGER) => Array.isArray(input)
    ? [...new Set(input.filter((id): id is string => typeof id === 'string' && INVITATION_BY_ID.has(id)))].slice(0, max) : [];
  const baselines: Record<string, number> = {};
  if (value.baselines && typeof value.baselines === 'object') {
    for (const key of METRIC_KEYS) baselines[key] = cleanCount(value.baselines[key]);
  }
  return {
    version: 1,
    day: typeof value.day === 'string' ? value.day.slice(0, 10) : '',
    slotIds: validIds(value.slotIds, 3), baselines,
    claimedIds: validIds(value.claimedIds, 3), stampIds: validIds(value.stampIds),
    totalClaims: cleanCount(value.totalClaims), rerolls: cleanCount(value.rerolls),
  };
}

function lifetime(state: QuestState, key: string): number { return cleanCount(state.lifetimeCounts?.[key]); }

export class DailyInvitationStore {
  private readonly key: string;
  private state: DailyInvitationState;

  constructor(userId: string) {
    this.key = `hv-daily-invitations-v1:${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeState(raw); this.persist();
  }

  views(quests: QuestState, featuredSpecialtyIds: readonly string[] = []): DailyInvitationView[] {
    this.ensureDay(quests, featuredSpecialtyIds);
    return this.state.slotIds.flatMap((id, slot) => {
      const def = INVITATION_BY_ID.get(id);
      if (!def) return [];
      const current = Math.min(def.goal, Math.max(0, lifetime(quests, def.metric) - (this.state.baselines[def.metric] ?? 0)));
      return [{ ...def, current, done: current >= def.goal, claimed: this.state.claimedIds.includes(id), slot }];
    });
  }

  claim(invitationId: string, quests: QuestState, featuredSpecialtyIds: readonly string[] = []): 'claimed' | 'not-ready' | 'already' | 'unknown' {
    const view = this.views(quests, featuredSpecialtyIds).find((item) => item.id === invitationId);
    if (!view) return 'unknown';
    if (view.claimed) return 'already';
    if (!view.done) return 'not-ready';
    this.state.claimedIds.push(invitationId);
    if (!this.state.stampIds.includes(invitationId)) this.state.stampIds.push(invitationId);
    this.state.totalClaims += 1; this.persist(); return 'claimed';
  }

  reroll(slot: number, quests: QuestState, featuredSpecialtyIds: readonly string[] = []): string | null {
    this.ensureDay(quests, featuredSpecialtyIds);
    if (!Number.isInteger(slot) || slot < 0 || slot >= this.state.slotIds.length) return null;
    const currentId = this.state.slotIds[slot]!;
    if (this.state.claimedIds.includes(currentId)) return null;
    const used = new Set(this.state.slotIds);
    const start = (DAILY_INVITATIONS.findIndex((item) => item.id === currentId) + 1) % DAILY_INVITATIONS.length;
    for (let offset = 0; offset < DAILY_INVITATIONS.length; offset += 1) {
      const candidate = DAILY_INVITATIONS[(start + offset) % DAILY_INVITATIONS.length]!;
      if (used.has(candidate.id)) continue;
      this.state.slotIds[slot] = candidate.id; this.state.rerolls += 1; this.persist(); return candidate.id;
    }
    return null;
  }

  progress(quests: QuestState, featuredSpecialtyIds: readonly string[] = []): DailyInvitationProgress {
    const views = this.views(quests, featuredSpecialtyIds);
    const stampedDomains = new Set(this.state.stampIds.map((id) => INVITATION_BY_ID.get(id)?.masteryId).filter(Boolean)).size;
    return {
      todayClaimed: views.filter((item) => item.claimed).length, todaySlots: views.length,
      uniqueStamps: this.state.stampIds.length, totalStamps: DAILY_INVITATIONS.length,
      stampedDomains, totalClaims: this.state.totalClaims, rerolls: this.state.rerolls,
    };
  }

  stampIds(): readonly string[] { return [...this.state.stampIds]; }

  private ensureDay(quests: QuestState, featuredSpecialtyIds: readonly string[]): void {
    if (this.state.day === quests.day && this.state.slotIds.length === 3 && METRIC_KEYS.every((key) => key in this.state.baselines)) return;
    const preferred = featuredSpecialtyIds.flatMap((id) => {
      const masteryId = LIFE_SPECIALTY_CARDS.find((card) => card.id === id)?.masteryId;
      return masteryId ? [masteryId] : [];
    });
    const rotation = hashDay(quests.day);
    const preferredMasteries = [...new Set(preferred)].slice(0, 3);
    const slotIds: string[] = [];
    for (let index = 0; index < preferredMasteries.length; index += 1) {
      const cards = DAILY_INVITATIONS.filter((item) => item.masteryId === preferredMasteries[index]);
      const card = cards[(rotation + index) % cards.length];
      if (card && !slotIds.includes(card.id)) slotIds.push(card.id);
    }
    const remainingMasteries = INVITATION_SEEDS.map((group) => group.masteryId)
      .filter((masteryId) => !preferredMasteries.includes(masteryId));
    for (let index = 0; index < remainingMasteries.length && slotIds.length < 3; index += 1) {
      const masteryId = remainingMasteries[(index + rotation) % remainingMasteries.length];
      const cards = DAILY_INVITATIONS.filter((item) => item.masteryId === masteryId);
      const card = cards[(rotation + index) % cards.length];
      if (card && !slotIds.includes(card.id)) slotIds.push(card.id);
    }
    const baselines = Object.fromEntries(METRIC_KEYS.map((key) => [key, lifetime(quests, key)]));
    this.state = { ...this.state, day: quests.day, slotIds, baselines, claimedIds: [] };
    this.persist();
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
