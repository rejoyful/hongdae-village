/**
 * 히든 트레저 시스템 (동물의 숲 감성) — 맵·건물 곳곳에 숨겨진 반짝이 스팟에서
 * 조각을 모아(노가다) 예쁜 보석·유물을 제작·수집한다. 표시 없이 힌트로 찾는 재미.
 * 순수 데이터·로직이라 테스트로 요구사항을 못박는다.
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Treasure {
  id: string;
  name: string;
  emoji: string;      // 도감 표시 (픽셀 아이콘은 treasureIcons)
  rarity: Rarity;
  shards: number;     // 제작에 필요한 조각 수 (희귀할수록 많다 = 노가다)
  lore: string;       // 소장 가치 설명
}

/** 12종 컬렉션 — 흔한 것부터 전설까지, 이름·설명에 소장 가치를 담는다 */
export const TREASURES: Treasure[] = [
  { id: 'dewdrop', name: '이슬 구슬', emoji: '💧', rarity: 'common', shards: 3,
    lore: '이른 아침 경의선 숲길 풀잎에 맺힌 이슬을 굳힌 구슬. 안을 들여다보면 작은 무지개가 돈다.' },
  { id: 'clover', name: '네잎클로버', emoji: '🍀', rarity: 'common', shards: 3,
    lore: '홍대 골목 화단에서 자란 행운의 네잎클로버. 코팅해 책갈피로 쓰기 좋다.' },
  { id: 'seaglass', name: '바다 유리', emoji: '🔷', rarity: 'common', shards: 4,
    lore: '오랜 세월 파도가 다듬은 젖빛 유리 조각. 창가에 두면 빛이 부드럽게 번진다.' },
  { id: 'acorn', name: '황금 도토리', emoji: '🌰', rarity: 'rare', shards: 5,
    lore: '마인드 포레스트 뒷산 다람쥐가 숨겨둔 금빛 도토리. 가을 햇살을 응축한 색.' },
  { id: 'firefly', name: '반딧불 유리병', emoji: '🏮', rarity: 'rare', shards: 5,
    lore: '여름밤의 반딧불을 담은 작은 유리병. 흔들면 은은하게 빛난다.' },
  { id: 'maple', name: '단풍 호박', emoji: '🍁', rarity: 'rare', shards: 6,
    lore: '단풍잎 하나가 그대로 굳어버린 호박(琥珀). 수천 년의 가을이 담겼다.' },
  { id: 'moonstone', name: '월장석', emoji: '🌙', rarity: 'epic', shards: 8,
    lore: '보름달 밤에만 캘 수 있다는 푸른 빛의 돌. 각도에 따라 달무리가 흐른다.' },
  { id: 'starfrag', name: '별조각', emoji: '⭐', rarity: 'epic', shards: 8,
    lore: '유성우가 지나간 새벽, 옥상에서 주웠다는 별의 파편. 손끝이 시리게 차갑다.' },
  { id: 'auroragem', name: '오로라 젬', emoji: '💠', rarity: 'epic', shards: 10,
    lore: '북극의 빛을 결정으로 붙잡은 보석. 표면에 오로라가 천천히 일렁인다.' },
  { id: 'phoenix', name: '불사조 깃털', emoji: '🪶', rarity: 'legendary', shards: 12,
    lore: '천 년에 한 번 떨어진다는 불사조의 깃털. 어둠 속에서 스스로 은은히 타오른다.' },
  { id: 'dragoneye', name: '용의 눈동자', emoji: '🐉', rarity: 'legendary', shards: 14,
    lore: '잠든 용이 흘린 눈물이 굳은 보옥. 들여다보면 심연이 마주 본다.' },
  { id: 'forestheart', name: '숲의 심장', emoji: '💚', rarity: 'legendary', shards: 16,
    lore: '마인드 포레스트 가장 깊은 곳에 잠든 전설의 원석. 이 마을의 이름이 여기서 왔다.' },
];

export const TREASURE_BY_ID = new Map(TREASURES.map((t) => [t.id, t]));

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '일반', rare: '희귀', epic: '영웅', legendary: '전설',
};
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8ca0b0', rare: '#5aa668', epic: '#a86ad0', legendary: '#e8a83c',
};

/** 반짝이 스팟 하나에서 나오는 조각 수 (희귀 스팟일수록 조각을 더 준다) */
export interface SparkleSpot { id: string; tx: number; ty: number; where: string; shards: number; hint: string }

/**
 * 거리에 숨겨진 반짝이 스팟 — 표시 없음(동숲처럼 밟아야 발견). 매일 리셋.
 * 힌트는 '보물 도감'에서 볼 수 있어 탐색의 실마리를 준다.
 */
export const STREET_SPARKLES: SparkleSpot[] = [
  { id: 's-forest1', tx: 12, ty: 3, where: '경의선 숲길', shards: 2, hint: '이른 아침 숲길, 서쪽 나무 그늘 아래' },
  { id: 's-forest2', tx: 63, ty: 6, where: '경의선 숲길', shards: 2, hint: '숲길 동쪽 끝 벤치 근처를 살펴봐' },
  { id: 's-plaza', tx: 45, ty: 50, where: '역 광장', shards: 3, hint: '광장 남쪽, 사람이 붐비는 곳 발밑' },
  { id: 's-pojang', tx: 5, ty: 50, where: '포차 골목', shards: 3, hint: '포차 골목 깊숙한 구석, 등불 아래' },
  { id: 's-mural', tx: 74, ty: 50, where: '벽화 골목', shards: 3, hint: '벽화 골목 끝자락 그래피티 옆' },
  { id: 's-home', tx: 26, ty: 22, where: '주택 골목', shards: 2, hint: '서쪽 주택가 골목 사이 좁은 틈' },
  { id: 's-station', tx: 40, ty: 53, where: '역 앞', shards: 4, hint: '9번 출구 바로 아래, 계단 그늘' },
];

/**
 * 마인드 포레스트 층별 숨은 반짝이 (주인공 빌딩 = 히든 밀도 최고).
 * key: 'forest-<level>' → 그 층의 스팟들.
 */
export const FOREST_SPARKLES: Record<number, SparkleSpot[]> = {
  1: [{ id: 'f1', tx: 10, ty: 7, where: '포레스트 1F 로비', shards: 3, hint: '로비 화분 뒤편 구석' }],
  2: [{ id: 'f2', tx: 2, ty: 4, where: '포레스트 2F', shards: 3, hint: '연구실 서쪽 책장 사이' }],
  3: [{ id: 'f3', tx: 9, ty: 7, where: '포레스트 3F', shards: 4, hint: '제작실 동쪽 끝' }],
  4: [{ id: 'f4', tx: 3, ty: 7, where: '포레스트 4F', shards: 4, hint: '교육실 구석 캐비닛 옆' }],
  5: [{ id: 'f5', tx: 10, ty: 4, where: '포레스트 5F', shards: 5, hint: '경영지원실 금고 근처' }],
  6: [
    { id: 'f6a', tx: 2, ty: 2, where: '포레스트 6F 에너지룸', shards: 5, hint: '에너지룸 안쪽 화이트보드 밑' },
    { id: 'f6b', tx: 12, ty: 2, where: '포레스트 6F 라운지룸', shards: 6, hint: '라운지룸 소파 틈새 — 가장 깊은 곳' },
  ],
};

// ── 수집 상태 (localStorage 지속, 매일 리셋되는 스팟) ──

export interface TreasureState {
  day: string;                    // KST 날짜 (스팟 리셋용)
  shards: number;                 // 보유 조각
  found: string[];                // 오늘 발견한 스팟 id (중복 방지)
  crafted: Record<string, number>; // 보물 id → 제작 수량 (소장)
}

export function todaySeoul(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

export function freshState(day: string): TreasureState {
  return { day, shards: 0, found: [], crafted: {} };
}

/** 저장값 정규화 — 날이 바뀌면 스팟(found)만 리셋, 조각·보물은 유지 */
export function normalizeTreasure(raw: unknown, today: string): TreasureState {
  const o = (raw ?? {}) as Partial<TreasureState>;
  const crafted: Record<string, number> = {};
  if (o.crafted && typeof o.crafted === 'object') {
    for (const [k, v] of Object.entries(o.crafted)) {
      if (TREASURE_BY_ID.has(k) && typeof v === 'number' && v > 0) crafted[k] = Math.floor(v);
    }
  }
  const shards = typeof o.shards === 'number' && o.shards >= 0 ? Math.floor(o.shards) : 0;
  if (o.day !== today) return { day: today, shards, found: [], crafted };
  const found = Array.isArray(o.found) ? o.found.filter((f): f is string => typeof f === 'string') : [];
  return { day: today, shards, found, crafted };
}

/** 스팟 채집 — 오늘 처음이면 조각 획득. 반환: 새 상태 + 획득 조각(0이면 이미 캠) */
export function collectSpot(state: TreasureState, spot: SparkleSpot): { state: TreasureState; gained: number } {
  if (state.found.includes(spot.id)) return { state, gained: 0 };
  return {
    state: { ...state, shards: state.shards + spot.shards, found: [...state.found, spot.id] },
    gained: spot.shards,
  };
}

export type CraftResult =
  | { ok: true; state: TreasureState }
  | { ok: false; reason: 'no-shards' | 'unknown' };

/** 보물 제작 — 조각을 소모해 보물 1개 획득(소장) */
export function craftTreasure(state: TreasureState, treasureId: string): CraftResult {
  const t = TREASURE_BY_ID.get(treasureId);
  if (!t) return { ok: false, reason: 'unknown' };
  if (state.shards < t.shards) return { ok: false, reason: 'no-shards' };
  return {
    ok: true,
    state: {
      ...state,
      shards: state.shards - t.shards,
      crafted: { ...state.crafted, [treasureId]: (state.crafted[treasureId] ?? 0) + 1 },
    },
  };
}

/** 수집 진행 (도감) */
export function collectionProgress(state: TreasureState): { owned: number; total: number } {
  const owned = TREASURES.filter((t) => (state.crafted[t.id] ?? 0) > 0).length;
  return { owned, total: TREASURES.length };
}
