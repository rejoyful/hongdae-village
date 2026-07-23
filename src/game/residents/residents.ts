import type { Appearance } from '../art/appearance';

/**
 * 이름 있는 주민 로스터 (레퍼런스 주민 도감) — 각자 담당 구역 근처에 상주.
 * 가까이 가면 인사하며 신뢰도가 오르고, 주민 패널에 기록된다.
 */
export interface ResidentDef {
  id: string;
  name: string;
  role: string;
  tile: { tx: number; ty: number };
  appearance: Appearance;
  ments: string[];
  favorite: string;
  keepsake: string;
}

export const RESIDENTS: ResidentDef[] = [
  {
    id: 'haneul', name: '하늘', role: '거리 뮤지션', tile: { tx: 39, ty: 31 },
    appearance: { skin: 1, hair: 3, hairColor: 5, shirt: 'b0685a', pants: 2 },
    ments: ['오늘 신곡 들어볼래요?', '버스킹은 홍대의 심장이죠', '팁은 사랑입니다 🎸'],
    favorite: '밤 9시의 작은 앙코르', keepsake: '손때 묻은 첫 버스킹 티켓',
  },
  {
    id: 'moturi', name: '모퉁이 씨', role: '카페 모퉁이 사장', tile: { tx: 30, ty: 36 },
    appearance: { skin: 0, hair: 5, hairColor: 1, shirt: '6a7a8a', pants: 1 },
    ments: ['오늘의 원두는 케냐예요', '알바생 구해요 — 시급 최고!', '커피 향 좋죠?'],
    favorite: '비 오는 날의 핸드드립', keepsake: '모퉁이 카페 1호 단골잔',
  },
  {
    id: 'sallim', name: '살림 아주머니', role: '가구점 살림 사장', tile: { tx: 14, ty: 36 },
    appearance: { skin: 2, hair: 1, hairColor: 4, shirt: 'e0a8b8', pants: 5 },
    ments: ['새 가구 들어왔어요~', '방 꾸미기엔 러그가 최고야', '싸게 줄게, 구경해요'],
    favorite: '햇살 드는 창가와 원목 가구', keepsake: '작은 집 모양 줄자',
  },
  {
    id: 'jun', name: '준', role: 'GS25 알바', tile: { tx: 22, ty: 31 },
    appearance: { skin: 0, hair: 0, hairColor: 0, shirt: 'a8c8e0', pants: 0 },
    ments: ['1+1 행사 중이에요', '야간 알바는 힘들어요…', '폐기 도시락의 낭만'],
    favorite: '퇴근 직전의 삼각김밥', keepsake: '첫 월급날 영수증',
  },
  {
    id: 'choco', name: '초코', role: 'CU 알바', tile: { tx: 48, ty: 31 },
    appearance: { skin: 3, hair: 4, hairColor: 2, shirt: 'd8b86e', pants: 3 },
    ments: ['신상 젤리 입고됐어요', '포인트 적립 되세요?', '컵라면엔 삼각김밥이죠'],
    favorite: '알록달록한 신상 젤리', keepsake: '단종된 포도맛 젤리 봉지',
  },
  {
    id: 'ille', name: '일레', role: '세븐일레븐 알바', tile: { tx: 62, ty: 31 },
    appearance: { skin: 1, hair: 2, hairColor: 3, shirt: '9cc79c', pants: 4 },
    ments: ['새벽 손님이 제일 많아요', '아이스크림 반값 행사!', '오늘도 평화로운 편의점'],
    favorite: '새벽 두 시의 조용한 골목', keepsake: '행운의 일곱 스티커',
  },
  {
    id: 'park', name: '박 기장', role: '역무원', tile: { tx: 38, ty: 45 },
    appearance: { skin: 2, hair: 5, hairColor: 1, shirt: '4a4e5c', pants: 2 },
    ments: ['9번 출구는 언제나 북적여요', '막차 놓치지 마세요', '분실물은 역무실로!'],
    favorite: '정시에 도착하는 첫차', keepsake: '오래된 종이 승차권',
  },
  {
    id: 'noeul', name: '노을', role: '벽화 화가', tile: { tx: 60, ty: 41 },
    appearance: { skin: 0, hair: 2, hairColor: 5, shirt: 'c8a8d8', pants: 1 },
    ments: ['이 벽엔 노을을 그릴 거예요', '물감이 좀 튀었네', '예술은 골목에 있죠'],
    favorite: '주황과 보라가 섞이는 순간', keepsake: '첫 벽화의 마른 물감 조각',
  },
  {
    id: 'imo', name: '포차 이모', role: '포차 골목 사장', tile: { tx: 10, ty: 45 },
    appearance: { skin: 2, hair: 1, hairColor: 0, shirt: 'd88a7c', pants: 5 },
    ments: ['떡볶이 맵기 조절 돼~', '어묵 국물은 서비스!', '우리 집이 원조야'],
    favorite: '첫 손님에게 내는 어묵 국물', keepsake: '십 년 된 포차 메뉴판',
  },
  {
    id: 'dongsu', name: '동수 할아버지', role: '숲길 산책러', tile: { tx: 30, ty: 5 },
    appearance: { skin: 1, hair: 5, hairColor: 4, shirt: 'f2ead8', pants: 1 },
    ments: ['이 숲길이 옛날엔 기찻길이었지', '젊은이, 천천히 걸어요', '나무들이 참 좋지?'],
    favorite: '느리게 걷는 아침 숲길', keepsake: '옛 기찻길의 작은 자갈',
  },
];

// ── 신뢰도 저장/계산 (순수 로직 — 테스트 대상) ──

export interface TrustEntry { v: number; day: string }
export type TrustState = Record<string, TrustEntry>;

export const TRUST_GAIN = 15;
export const TRUST_MAX = 100;

export interface TrustStage {
  min: number;
  name: string;
  icon: string;
  note: string;
}

/** 매일 다시 만나고 싶게 만드는 주민 관계 단계. */
export const TRUST_STAGES: readonly TrustStage[] = [
  { min: 0, name: '낯선 얼굴', icon: '◌', note: '먼저 인사를 건네 보세요.' },
  { min: 15, name: '첫인사', icon: '👋', note: '이제 서로의 이름을 알아요.' },
  { min: 30, name: '아는 사이', icon: '☕', note: '골목에서 마주치면 반가워요.' },
  { min: 50, name: '동네 친구', icon: '💛', note: '좋아하는 것을 알려 주었어요.' },
  { min: 80, name: '단짝 이웃', icon: '🌟', note: '작은 비밀도 나누는 사이예요.' },
  { min: 100, name: '마을 가족', icon: '🏡', note: '소중한 기념품 이야기가 열렸어요.' },
] as const;

export function trustStage(value: number): TrustStage {
  const safe = Math.max(0, Math.min(TRUST_MAX, Number.isFinite(value) ? value : 0));
  return [...TRUST_STAGES].reverse().find((stage) => safe >= stage.min) ?? TRUST_STAGES[0]!;
}

export function nextTrustStage(value: number): TrustStage | null {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  return TRUST_STAGES.find((stage) => stage.min > safe) ?? null;
}

/**
 * 인사 적용 — 같은 날 첫 인사만 신뢰도 +15 (최대 100).
 * 반환: 새 상태와 실제 상승 여부.
 */
export function applyGreeting(state: TrustState, id: string, today: string):
{ state: TrustState; gained: boolean } {
  const cur = state[id];
  if (cur && cur.day === today) return { state, gained: false };
  const v = Math.min(TRUST_MAX, (cur?.v ?? 0) + TRUST_GAIN);
  return { state: { ...state, [id]: { v, day: today } }, gained: true };
}

export function trustOf(state: TrustState, id: string): number {
  return state[id]?.v ?? 0;
}

/** 만난 적 있는 주민 수 (도감 진행) */
export function metCount(state: TrustState): number {
  return RESIDENTS.filter((r) => (state[r.id]?.v ?? 0) > 0).length;
}

// ── localStorage 지속 ──

export function loadTrust(userId: string): TrustState {
  try {
    const raw = localStorage.getItem(`hv-trust-${userId}`);
    if (raw) return JSON.parse(raw) as TrustState;
  } catch { /* ignore */ }
  return {};
}

export function saveTrust(userId: string, state: TrustState): void {
  try { localStorage.setItem(`hv-trust-${userId}`, JSON.stringify(state)); } catch { /* ignore */ }
}

export function todaySeoul(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}
