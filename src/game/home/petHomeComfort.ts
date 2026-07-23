import { CATALOG_BY_ID, type ItemCategory, type ItemDef } from '../../items/catalog';
import type { Placed } from '../entities/placement';
import { PET_PERSONALITIES, type PetPersonalityId } from '../pets/petProfiles';

export interface PetHomeMomentDef {
  id: string;
  personality: PetPersonalityId;
  mark: string;
  name: string;
  phrase: string;
  hint: string;
  itemIds?: readonly string[];
  arches?: readonly string[];
  categories?: readonly ItemCategory[];
  suggestions: readonly string[];
}

export interface PetHomeMomentMatch {
  moment: PetHomeMomentDef;
  placement: Placed;
  item: ItemDef;
}

export interface PetHomeComfortView {
  personality: PetPersonalityId;
  personalityName: string;
  score: number;
  grade: string;
  matches: PetHomeMomentMatch[];
  nextMoment: PetHomeMomentDef | null;
  nextSuggestion: ItemDef | null;
  tip: string;
}

export const PET_HOME_MOMENTS: readonly PetHomeMomentDef[] = [
  { id: 'gentle_nearby_nap', personality: 'gentle', mark: '곁', name: '곁을 지키는 낮잠', phrase: '여기서 쉬면 당신이 돌아오는 소리를 들을 수 있어요.', hint: '침대나 소파 곁에서 조용히 기다립니다.', arches: ['bed', 'sofa'], suggestions: ['bed_basic', 'sofa_single'] },
  { id: 'gentle_soft_guard', personality: 'gentle', mark: '포', name: '포근한 물건 지킴이', phrase: '폭신한 냄새가 나요. 소중한 자리로 기억할게요.', hint: '방석·인형·러그처럼 부드러운 물건을 좋아합니다.', itemIds: ['cushion', 'bear_doll'], categories: ['rug'], suggestions: ['cushion', 'rug_cream'] },
  { id: 'gentle_green_company', personality: 'gentle', mark: '잎', name: '초록 친구의 안부', phrase: '잎이 흔들릴 때마다 먼저 인사해 줄게요.', hint: '식물과 꽃 곁에서 천천히 시간을 보냅니다.', categories: ['plant'], arches: ['vase', 'garden'], suggestions: ['plant_pot', 'flower_vase'] },
  { id: 'curious_shelf_patrol', personality: 'curious', mark: '책', name: '선반 끝 탐험', phrase: '맨 위 칸에는 어떤 이야기가 숨어 있을까요?', hint: '책장과 벽 선반의 구석구석을 살핍니다.', arches: ['shelf', 'wallshelf'], itemIds: ['book_pile'], suggestions: ['bookshelf', 'wall_shelf'] },
  { id: 'curious_screen_research', personality: 'curious', mark: '빛', name: '반짝이는 화면 연구', phrase: '화면 속 작은 움직임도 놓치지 않을래요.', hint: 'TV·PC·가전의 불빛을 유심히 관찰합니다.', arches: ['screen', 'appliance'], suggestions: ['tv_stand', 'laptop_desk'] },
  { id: 'curious_tank_watch', personality: 'curious', mark: '물', name: '물결 관찰 일지', phrase: '오늘 물속 친구는 어제와 다른 길로 헤엄쳤어요.', hint: '어항과 작은 정원을 오래 관찰합니다.', arches: ['tank', 'garden'], suggestions: ['fish_tank', 'mini_garden'] },
  { id: 'brave_door_guard', personality: 'brave', mark: '문', name: '현관 지킴이', phrase: '낯선 발소리가 나면 내가 먼저 확인할게요.', hint: '현관 수납과 이삿짐 곁을 든든하게 지킵니다.', itemIds: ['shoe_rack', 'hanger_rack', 'moving_box'], suggestions: ['shoe_rack', 'moving_box'] },
  { id: 'brave_training_base', personality: 'brave', mark: '훈', name: '작은 훈련 기지', phrase: '이 정도 높이는 한 번에 올라갈 수 있어요.', hint: '악기·캣타워·보드 주변을 훈련장으로 삼습니다.', arches: ['instrument', 'cattower'], itemIds: ['skateboard'], suggestions: ['guitar', 'cat_tower'] },
  { id: 'brave_lookout', personality: 'brave', mark: '망', name: '방 안 전망대', phrase: '높은 곳에서 방 전체를 살펴봤어요. 이상 무!', hint: '거울과 창가 장식 앞에서 방을 순찰합니다.', arches: ['mirror', 'wallclock'], itemIds: ['window_plant'], suggestions: ['mirror_full', 'window_plant'] },
  { id: 'playful_rug_zoom', personality: 'playful', mark: '쌩', name: '러그 한 바퀴', phrase: '바닥이 폭신하면 코너를 더 빠르게 돌 수 있어요.', hint: '러그를 작은 달리기 트랙으로 사용합니다.', categories: ['rug'], suggestions: ['rug_cream', 'rug_round'] },
  { id: 'playful_toy_hide', personality: 'playful', mark: '숨', name: '장난감 숨기기', phrase: '찾아보세요. 아주 가까운 곳에 숨겨 뒀어요.', hint: '인형·방석·보드 주변에 보물을 숨깁니다.', arches: ['doll', 'cattower'], itemIds: ['cushion', 'skateboard'], suggestions: ['bear_doll', 'cushion'] },
  { id: 'playful_chair_game', personality: 'playful', mark: '콩', name: '의자 사이 점프', phrase: '바닥은 용암이에요. 다음 의자까지 한 번에!', hint: '의자와 스툴을 이어 작은 놀이 코스로 만듭니다.', arches: ['seat'], itemIds: ['stool'], suggestions: ['chair_wood', 'stool'] },
  { id: 'calm_long_nap', personality: 'calm', mark: '잠', name: '느린 오후의 낮잠', phrase: '지금 이 방의 온도와 소리가 딱 좋아요.', hint: '침대와 소파에서 오래 쉬며 방의 소리를 듣습니다.', arches: ['bed', 'sofa'], suggestions: ['bed_basic', 'sofa_single'] },
  { id: 'calm_sun_corner', personality: 'calm', mark: '볕', name: '볕 드는 자리', phrase: '빛이 여기까지 천천히 오는 걸 기다렸어요.', hint: '식물과 은은한 조명 근처의 따뜻한 자리를 찾습니다.', categories: ['plant'], arches: ['lamp'], suggestions: ['plant_pot', 'lamp_mood'] },
  { id: 'calm_quiet_read', personality: 'calm', mark: '쉼', name: '조용한 독서 동무', phrase: '책장을 넘기는 소리는 비 오는 날처럼 편안해요.', hint: '책장과 책 더미 곁에서 말없이 함께 읽습니다.', arches: ['shelf'], itemIds: ['book_pile'], suggestions: ['bookshelf', 'book_pile'] },
  { id: 'performer_home_stage', personality: 'performer', mark: '막', name: '우리 집 첫 무대', phrase: '관객 한 명이어도 오늘 공연은 최선을 다할게요.', hint: '악기·마이크·이젤 앞을 자기만의 무대로 만듭니다.', arches: ['instrument'], itemIds: ['mic_stand', 'easel'], suggestions: ['guitar', 'mic_stand'] },
  { id: 'performer_audience_seat', personality: 'performer', mark: '객', name: '객석 점검', phrase: '이 자리는 표정이 잘 보여서 최고의 객석이에요.', hint: '의자와 소파를 공연을 위한 객석으로 살핍니다.', arches: ['seat', 'sofa'], suggestions: ['chair_cushion', 'sofa_single'] },
  { id: 'performer_spotlight', personality: 'performer', mark: '조', name: '조명 아래 포즈', phrase: '불빛이 켜지면 자연스럽게 포즈가 나와요.', hint: '조명·네온·포스터 앞에서 마지막 포즈를 연습합니다.', arches: ['lamp', 'wallneon'], itemIds: ['poster_band', 'poster_film'], suggestions: ['lamp_stand', 'poster_band'] },
] as const;

export const PET_HOME_MOMENT_BY_ID = new Map(PET_HOME_MOMENTS.map((moment) => [moment.id, moment]));

const matchesMoment = (moment: PetHomeMomentDef, item: ItemDef): boolean => (
  !!moment.itemIds?.includes(item.id)
  || !!moment.arches?.includes(item.arch)
  || !!moment.categories?.includes(item.category)
);

export function petHomeMomentMatches(personality: PetPersonalityId, placed: readonly Placed[]): PetHomeMomentMatch[] {
  const moments = PET_HOME_MOMENTS.filter((moment) => moment.personality === personality);
  return moments.flatMap((moment) => {
    const placement = placed.find((candidate) => {
      const item = CATALOG_BY_ID.get(candidate.itemId);
      return !!item && matchesMoment(moment, item);
    });
    const item = placement ? CATALOG_BY_ID.get(placement.itemId) : null;
    return placement && item ? [{ moment, placement, item }] : [];
  });
}

/** 배치 실패나 벌점 없이, 성격과 잘 맞는 생활 장면이 몇 가지 열렸는지를 보여 준다. */
export function evaluatePetHome(personality: PetPersonalityId, placed: readonly Placed[]): PetHomeComfortView {
  const matches = petHomeMomentMatches(personality, placed);
  const matchedIds = new Set(matches.map((match) => match.moment.id));
  const uniqueMatchedItems = new Set(matches.map((match) => match.item.id)).size;
  const score = Math.min(100, 20 + matches.length * 22 + uniqueMatchedItems * 4);
  const grade = score >= 90 ? '마음 놓인 우리 집' : score >= 68 ? '자주 머무는 자리' : score >= 42 ? '관심 가는 방' : '함께 알아가는 집';
  const nextMoment = PET_HOME_MOMENTS.find((moment) => moment.personality === personality && !matchedIds.has(moment.id)) ?? null;
  const nextSuggestion = nextMoment?.suggestions.map((id) => CATALOG_BY_ID.get(id)).find(Boolean) ?? null;
  const personalityName = PET_PERSONALITIES.find((item) => item.id === personality)?.name ?? personality;
  const tip = nextMoment && nextSuggestion
    ? `${nextSuggestion.name}을(를) 놓으면 ‘${nextMoment.name}’ 장면이 열려요.`
    : '이 성격의 세 가지 생활 장면이 모두 준비됐어요. 다른 성격으로 바꿔 새 반응도 기록할 수 있어요.';
  return { personality, personalityName, score, grade, matches, nextMoment, nextSuggestion, tip };
}

/** 아직 기록하지 않은 장면을 우선하고, 모두 기록했으면 날짜에 따라 기존 장면을 다시 보여 준다. */
export function selectPetHomeMoment(
  personality: PetPersonalityId,
  placed: readonly Placed[],
  recordedMomentIds: ReadonlySet<string>,
  dayKey: string,
): PetHomeMomentMatch | null {
  const matches = petHomeMomentMatches(personality, placed);
  const firstNew = matches.find((match) => !recordedMomentIds.has(match.moment.id));
  if (firstNew) return firstNew;
  if (!matches.length) return null;
  const dayNumber = Number(dayKey.replaceAll('-', '')) || 0;
  return matches[dayNumber % matches.length] ?? matches[0]!;
}

export interface PetHomeMemoryRecord {
  momentId: string;
  count: number;
  firstSeenAt: string;
  lastSeenDay: string;
}

export interface PetHomeMemoryView extends PetHomeMomentDef {
  recorded: boolean;
  count: number;
  firstSeenAt: string | null;
  lastSeenDay: string | null;
}

interface PetHomeMemoryState { records: Record<string, Record<string, PetHomeMemoryRecord>> }
const KEY_PREFIX = 'hv-pet-home-v1';
const emptyState = (): PetHomeMemoryState => ({ records: {} });

const dayKey = (): string => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());

export class PetHomeMemoryStore {
  private state: PetHomeMemoryState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `${KEY_PREFIX}:${userId}`;
    this.state = this.load();
  }

  private load(): PetHomeMemoryState {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key) ?? '{}') as Partial<PetHomeMemoryState>;
      const state = emptyState();
      if (!raw.records || typeof raw.records !== 'object') return state;
      for (const [petId, entries] of Object.entries(raw.records)) {
        if (!entries || typeof entries !== 'object') continue;
        const valid: Record<string, PetHomeMemoryRecord> = {};
        for (const [momentId, value] of Object.entries(entries)) {
          const record = value as Partial<PetHomeMemoryRecord>;
          if (!PET_HOME_MOMENT_BY_ID.has(momentId)) continue;
          valid[momentId] = {
            momentId, count: Math.max(1, Math.floor(Number(record.count) || 1)),
            firstSeenAt: typeof record.firstSeenAt === 'string' ? record.firstSeenAt : '',
            lastSeenDay: typeof record.lastSeenDay === 'string' ? record.lastSeenDay : '',
          };
        }
        if (Object.keys(valid).length) state.records[petId] = valid;
      }
      return state;
    } catch { return emptyState(); }
  }

  private save(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 읽기 전용 환경 */ } }

  record(petId: string, momentId: string, seenDay = dayKey()): { first: boolean; record: PetHomeMemoryRecord } | null {
    if (!petId || !PET_HOME_MOMENT_BY_ID.has(momentId)) return null;
    const entries = this.state.records[petId] ?? (this.state.records[petId] = {});
    const previous = entries[momentId];
    const record: PetHomeMemoryRecord = previous
      ? { ...previous, count: previous.count + 1, lastSeenDay: seenDay }
      : { momentId, count: 1, firstSeenAt: new Date().toISOString(), lastSeenDay: seenDay };
    entries[momentId] = record; this.save();
    return { first: !previous, record: { ...record } };
  }

  recordedIds(petId: string): Set<string> { return new Set(Object.keys(this.state.records[petId] ?? {})); }

  views(petId: string): PetHomeMemoryView[] {
    const records = this.state.records[petId] ?? {};
    return PET_HOME_MOMENTS.map((moment) => {
      const record = records[moment.id];
      return { ...moment, recorded: !!record, count: record?.count ?? 0, firstSeenAt: record?.firstSeenAt || null, lastSeenDay: record?.lastSeenDay || null };
    });
  }

  uniqueCount(petId?: string): number {
    if (petId) return Object.keys(this.state.records[petId] ?? {}).length;
    return new Set(Object.values(this.state.records).flatMap((records) => Object.keys(records))).size;
  }

  totalScenes(): number { return Object.values(this.state.records).reduce((sum, records) => sum + Object.values(records).reduce((inner, record) => inner + record.count, 0), 0); }
  petPartners(): number { return Object.values(this.state.records).filter((records) => Object.keys(records).length > 0).length; }
  personalityCount(): number {
    const personalities = new Set<string>();
    for (const records of Object.values(this.state.records)) for (const id of Object.keys(records)) personalities.add(PET_HOME_MOMENT_BY_ID.get(id)!.personality);
    return personalities.size;
  }
}
