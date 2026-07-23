import { normalizeAppearance, type Appearance } from './appearance';

export type LookbookField =
  | 'topStyle'
  | 'bottomStyle'
  | 'shoeStyle'
  | 'back'
  | 'hat'
  | 'glasses'
  | 'topPattern'
  | 'sockStyle'
  | 'shirt'
  | 'accent';

export type LookbookValue = number | string;

export interface LookbookRule {
  id: string;
  field: LookbookField;
  label: string;
  hint: string;
  values: readonly LookbookValue[];
}

export interface LookbookContract {
  id: string;
  name: string;
  client: string;
  scene: string;
  brief: string;
  ink: string;
  paper: string;
  prerequisiteBadgeId?: string;
  rules: readonly [LookbookRule, LookbookRule, LookbookRule];
}

export interface LookbookEntry {
  bestStars: number;
  attempts: number;
  appearance: Appearance;
  savedAt: number;
}

export interface LookbookState {
  version: 1;
  entries: Record<string, LookbookEntry>;
  totalSubmissions: number;
  uniqueLooks: string[];
}

export interface LookbookProgress {
  entries: number;
  totalEntries: number;
  stars: number;
  totalStars: number;
  perfect: number;
  submissions: number;
  uniqueLooks: number;
  unlocked: number;
}

export interface LookbookEvaluation {
  matched: number;
  starsOnSubmit: number;
  rules: Array<LookbookRule & { matched: boolean }>;
}

export type LookbookSubmitResult =
  | {
    ok: true;
    contractId: string;
    stars: number;
    matched: number;
    improved: boolean;
    firstEntry: boolean;
    firstPerfect: boolean;
    unique: boolean;
  }
  | { ok: false; reason: 'unknown-contract' | 'locked-contract' };

const rule = (
  id: string,
  field: LookbookField,
  label: string,
  hint: string,
  values: readonly LookbookValue[],
): LookbookRule => ({ id, field, label, hint, values });

/**
 * 골목 룩북의 12개 코디 의뢰. 첫 네 장은 즉시 열리고 나머지는 기존 마을 활동 배지와 연결된다.
 * 각 의뢰는 독립적인 세 조건만 사용해 처음 보는 플레이어도 시행착오 없이 읽을 수 있다.
 */
export const LOOKBOOK_CONTRACTS: readonly LookbookContract[] = [
  {
    id: 'alley_arrival', name: '골목 첫 산책', client: '하늘의 메모', scene: '오후의 철길 입구',
    brief: '처음 온 골목에서도 발걸음이 가벼워 보이는 코디를 부탁해요.', ink: '#596b5f', paper: '#d9cda8',
    rules: [
      rule('easy_top', 'topStyle', '편한 상의', '베이직 티·후드·가디건', [0, 1, 3]),
      rule('walking_shoes', 'shoeStyle', '걷기 좋은 신발', '스니커즈·컬러 러너', [0, 4]),
      rule('small_bag', 'back', '작은 가방', '미니 백팩·토트백', [1, 4]),
    ],
  },
  {
    id: 'cafe_shift', name: '모퉁이 첫 근무', client: '모퉁이 씨', scene: '크림빛 카페 창가',
    brief: '단정하지만 너무 딱딱하지 않은 첫 근무 옷을 골라 주세요.', ink: '#77533e', paper: '#e1c99e',
    rules: [
      rule('cafe_top', 'topStyle', '차분한 상의', '블레이저·가디건', [2, 3]),
      rule('cafe_bottom', 'bottomStyle', '긴 바지', '슬림·와이드 팬츠', [0, 1]),
      rule('cream_point', 'accent', '크림 포인트', '크림·화이트·카멜 포인트', ['f2ead8', 'f2f2ea', 'c89a6a']),
    ],
  },
  {
    id: 'rain_walk', name: '비 온 뒤 산책', client: '노을의 스케치', scene: '젖은 벽돌 골목',
    brief: '웅덩이를 돌아 걸어도 실루엣이 흐트러지지 않는 산책 코디예요.', ink: '#536675', paper: '#c7d0c7',
    rules: [
      rule('rain_top', 'topStyle', '포근한 겉옷', '후드·가디건', [1, 3]),
      rule('rain_bottom', 'bottomStyle', '활동적인 하의', '와이드·쇼츠·카고', [1, 2, 4]),
      rule('rain_socks', 'sockStyle', '보이는 양말', '양말을 한 가지 착용', [1, 2, 3, 4]),
    ],
  },
  {
    id: 'record_dig', name: '레코드 사냥꾼', client: '비트창고 쪽지', scene: '오래된 음반 선반',
    brief: '먼지 쌓인 명반을 찾아낼 것 같은 빈티지한 조합을 찾습니다.', ink: '#6c4e43', paper: '#c8b58d',
    rules: [
      rule('record_top', 'topStyle', '빈티지 재킷', '블레이저·크롭 재킷', [2, 5]),
      rule('record_pattern', 'topPattern', '리듬 무늬', '스트라이프·체커', [1, 2]),
      rule('record_back', 'back', '레코드 가방', '기타 케이스·토트백', [2, 4]),
    ],
  },
  {
    id: 'pet_picnic', name: '멍냥 피크닉', client: '멍냥이네 가족', scene: '잔디 위 체크 매트',
    brief: '털이 조금 묻어도 웃을 수 있는 다정하고 장난스러운 옷이면 좋아요.', ink: '#65734f', paper: '#d7c88e',
    prerequisiteBadgeId: 'badge_intro_pet',
    rules: [
      rule('pet_top', 'topStyle', '돌봄 상의', '베이직 티·오버롤', [0, 4]),
      rule('pet_pattern', 'topPattern', '다정한 무늬', '하트·꽃자수', [3, 5]),
      rule('pet_back', 'back', '친구 장식', '미니 백팩·고양이 꼬리', [1, 5]),
    ],
  },
  {
    id: 'forest_patrol', name: '외곽숲 순찰복', client: '박 기장의 부탁', scene: '초록 경계 표지판',
    brief: '길을 잃은 사람에게 먼저 손을 내밀 수 있는 튼튼한 코디입니다.', ink: '#455f52', paper: '#bfc7a0',
    prerequisiteBadgeId: 'badge_intro_hunt',
    rules: [
      rule('forest_top', 'topStyle', '움직이는 상의', '베이직 티·후드', [0, 1]),
      rule('forest_bottom', 'bottomStyle', '순찰 하의', '쇼츠·카고 팬츠', [2, 4]),
      rule('forest_shoes', 'shoeStyle', '단단한 신발', '앵클부츠·컬러 러너', [1, 4]),
    ],
  },
  {
    id: 'studio_encore', name: '앙코르 스튜디오', client: '하늘의 셋리스트', scene: '주황 조명의 작은 무대',
    brief: '마지막 곡이 끝나도 관객이 기억할 한 가지 포인트를 남겨 주세요.', ink: '#8a5148', paper: '#d8b487',
    prerequisiteBadgeId: 'badge_story_street_stage',
    rules: [
      rule('stage_top', 'topStyle', '무대 실루엣', '블레이저·크롭 재킷', [2, 5]),
      rule('stage_pattern', 'topPattern', '무대 무늬', '하트·별', [3, 4]),
      rule('stage_back', 'back', '공연 등 장식', '기타 케이스·픽셀 윙', [2, 3]),
    ],
  },
  {
    id: 'office_deadline', name: '금요일 편집실', client: '스튜디오 편집장', scene: '퇴근 전 푸른 창문',
    brief: '발표도 야근도 버틸 수 있는 정돈된 도시 코디를 기록합니다.', ink: '#4f5e6c', paper: '#cbd0c7',
    prerequisiteBadgeId: 'badge_story_company',
    rules: [
      rule('office_top', 'topStyle', '정돈된 재킷', '블레이저', [2]),
      rule('office_bottom', 'bottomStyle', '도시형 팬츠', '슬림·와이드 팬츠', [0, 1]),
      rule('office_shoes', 'shoeStyle', '단정한 로퍼', '로퍼', [2]),
    ],
  },
  {
    id: 'rooftop_harvest', name: '옥상 수확일', client: '동수 할아버지', scene: '해 질 녘 화분 사이',
    brief: '흙을 만지고도 사진 한 장 남기고 싶은 정원 작업복을 골라 봅시다.', ink: '#596c4d', paper: '#c9c597',
    prerequisiteBadgeId: 'badge_story_garden_harvest',
    rules: [
      rule('garden_top', 'topStyle', '정원 상의', '가디건·오버롤', [3, 4]),
      rule('garden_pattern', 'topPattern', '식물 무늬', '무지·꽃자수', [0, 5]),
      rule('garden_accent', 'accent', '잎사귀 포인트', '초록·민트 포인트', ['72b86a', '58b8c8', '8a6a4a']),
    ],
  },
  {
    id: 'water_curator', name: '물결 큐레이터', client: '수로 연구 노트', scene: '달빛 수조 앞',
    brief: '유리 너머 생물보다 튀지 않으면서 물빛을 닮은 코디가 필요해요.', ink: '#4c6970', paper: '#bfcdc4',
    prerequisiteBadgeId: 'badge_story_aquarium_first',
    rules: [
      rule('water_top', 'topStyle', '물결 상의', '가디건·세일러', [3, 6]),
      rule('water_shirt', 'shirt', '수로 색', '블루·민트·라벤더 상의색', ['5cb0e0', '6a6ad8', '5cc0a0', 'c8a8d8']),
      rule('water_accent', 'accent', '유리 포인트', '화이트·시안·블루 포인트', ['ffffff', 'f2f2ea', '58b8c8', '5c8fe0']),
    ],
  },
  {
    id: 'housewarming_host', name: '열린 집의 주인', client: '살림 아주머니', scene: '따뜻한 현관 조명',
    brief: '손님을 맞이하되 내 취향도 분명히 보이는 집들이 옷을 부탁해요.', ink: '#79584a', paper: '#d9c29b',
    prerequisiteBadgeId: 'badge_story_home_first_guest',
    rules: [
      rule('host_top', 'topStyle', '포근한 상의', '가디건·한복 저고리', [3, 7]),
      rule('host_bottom', 'bottomStyle', '긴 실루엣', '와이드 팬츠·롱 스커트', [1, 5]),
      rule('host_hat', 'hat', '환영 머리장식', '꽃·리본', [4, 5]),
    ],
  },
  {
    id: 'moon_hanbok', name: '달빛 한복 산책', client: '마을 기록관', scene: '반달 아래 한옥 담장',
    brief: '오래된 선과 홍대의 색을 함께 남기는 마지막 룩북 한 장입니다.', ink: '#56506d', paper: '#cbc0bd',
    prerequisiteBadgeId: 'badge_master_level_10',
    rules: [
      rule('hanbok_top', 'topStyle', '한복 저고리', '한복 저고리', [7]),
      rule('hanbok_bottom', 'bottomStyle', '긴 치마', '롱 스커트', [5]),
      rule('hanbok_accent', 'accent', '달빛 포인트', '핑크·보라·크림 포인트', ['e86aa8', '806ad8', 'b86ad8', 'f2ead8']),
    ],
  },
] as const;

export const LOOKBOOK_BY_ID = new Map(LOOKBOOK_CONTRACTS.map((contract) => [contract.id, contract]));

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

const cleanStars = (value: unknown): number => Math.min(3, cleanCount(value));

export function freshLookbookState(): LookbookState {
  return { version: 1, entries: {}, totalSubmissions: 0, uniqueLooks: [] };
}

export function lookbookOutfitSignature(appearance: Appearance): string {
  const a = normalizeAppearance(appearance);
  return [
    a.shirt, a.pants, a.glasses ?? 0, a.hat ?? 0, a.topStyle ?? 0, a.bottomStyle ?? 0,
    a.shoeStyle ?? 0, a.back ?? 0, a.accent ?? '', a.topPattern ?? 0, a.sockStyle ?? 0,
  ].join('-');
}

export function normalizeLookbookState(raw: unknown): LookbookState {
  if (!raw || typeof raw !== 'object') return freshLookbookState();
  const value = raw as Partial<LookbookState>;
  const inputEntries = value.entries && typeof value.entries === 'object' ? value.entries : {};
  const entries: Record<string, LookbookEntry> = {};
  for (const contract of LOOKBOOK_CONTRACTS) {
    const input = (inputEntries as Record<string, unknown>)[contract.id];
    if (!input || typeof input !== 'object') continue;
    const entry = input as Partial<LookbookEntry>;
    const bestStars = cleanStars(entry.bestStars);
    const attempts = cleanCount(entry.attempts);
    if (!bestStars || !attempts) continue;
    entries[contract.id] = {
      bestStars,
      attempts,
      appearance: normalizeAppearance(entry.appearance),
      savedAt: cleanCount(entry.savedAt),
    };
  }
  const uniqueLooks = Array.isArray(value.uniqueLooks)
    ? [...new Set(value.uniqueLooks.filter((item): item is string => typeof item === 'string' && /^[a-z0-9-]+$/i.test(item)))].slice(0, 120)
    : [];
  return {
    version: 1,
    entries,
    totalSubmissions: Math.max(cleanCount(value.totalSubmissions), Object.values(entries).reduce((sum, entry) => sum + entry.attempts, 0)),
    uniqueLooks,
  };
}

export function lookbookContractUnlocked(contract: LookbookContract, unlockedBadgeIds: readonly string[]): boolean {
  return !contract.prerequisiteBadgeId || unlockedBadgeIds.includes(contract.prerequisiteBadgeId);
}

export function evaluateLookbookContract(contract: LookbookContract, appearance: Appearance): LookbookEvaluation {
  const a = normalizeAppearance(appearance);
  const rules = contract.rules.map((item) => ({
    ...item,
    matched: item.values.some((candidate) => candidate === a[item.field]),
  }));
  const matched = rules.filter((item) => item.matched).length;
  return { matched, starsOnSubmit: Math.max(1, matched), rules };
}

/** 막힌 플레이어를 위한 안전한 샘플 코디. 자동 제출하지 않고 조건에 맞는 첫 값만 미리 입힌다. */
export function suggestLookbookAppearance(current: Appearance, contract: LookbookContract): Appearance {
  const next = { ...normalizeAppearance(current) };
  for (const item of contract.rules) {
    const candidate = item.values[0];
    if (candidate !== undefined) (next as Record<LookbookField, LookbookValue>)[item.field] = candidate;
  }
  return normalizeAppearance(next);
}

export function submitLookbookEntry(
  state: LookbookState,
  contractId: string,
  appearance: Appearance,
  unlockedBadgeIds: readonly string[],
  savedAt = Date.now(),
): LookbookSubmitResult {
  const contract = LOOKBOOK_BY_ID.get(contractId);
  if (!contract) return { ok: false, reason: 'unknown-contract' };
  if (!lookbookContractUnlocked(contract, unlockedBadgeIds)) return { ok: false, reason: 'locked-contract' };

  const evaluation = evaluateLookbookContract(contract, appearance);
  const stars = evaluation.starsOnSubmit;
  const previous = state.entries[contractId];
  const firstEntry = !previous;
  const improved = !previous || stars > previous.bestStars;
  const firstPerfect = stars === 3 && previous?.bestStars !== 3;
  const signature = lookbookOutfitSignature(appearance);
  const unique = !state.uniqueLooks.includes(signature);

  state.entries[contractId] = {
    bestStars: Math.max(previous?.bestStars ?? 0, stars),
    attempts: (previous?.attempts ?? 0) + 1,
    appearance: stars >= (previous?.bestStars ?? 0) ? normalizeAppearance(appearance) : previous!.appearance,
    savedAt: stars >= (previous?.bestStars ?? 0) ? cleanCount(savedAt) : previous!.savedAt,
  };
  state.totalSubmissions += 1;
  if (unique) state.uniqueLooks = [...state.uniqueLooks, signature].slice(-120);
  return { ok: true, contractId, stars, matched: evaluation.matched, improved, firstEntry, firstPerfect, unique };
}

export function lookbookProgress(state: LookbookState, unlockedBadgeIds: readonly string[] = []): LookbookProgress {
  const entries = Object.values(state.entries);
  return {
    entries: entries.length,
    totalEntries: LOOKBOOK_CONTRACTS.length,
    stars: entries.reduce((sum, entry) => sum + entry.bestStars, 0),
    totalStars: LOOKBOOK_CONTRACTS.length * 3,
    perfect: entries.filter((entry) => entry.bestStars === 3).length,
    submissions: state.totalSubmissions,
    uniqueLooks: state.uniqueLooks.length,
    unlocked: LOOKBOOK_CONTRACTS.filter((contract) => lookbookContractUnlocked(contract, unlockedBadgeIds)).length,
  };
}

export class LookbookStore {
  private state: LookbookState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-lookbook-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizeLookbookState(raw);
    this.persist();
  }

  get(): LookbookState { return this.state; }
  entry(contractId: string): LookbookEntry | null { return this.state.entries[contractId] ?? null; }
  progress(unlockedBadgeIds: readonly string[] = []): LookbookProgress { return lookbookProgress(this.state, unlockedBadgeIds); }

  submit(contractId: string, appearance: Appearance, unlockedBadgeIds: readonly string[]): LookbookSubmitResult {
    const result = submitLookbookEntry(this.state, contractId, appearance, unlockedBadgeIds);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
