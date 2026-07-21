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
}

export const RESIDENTS: ResidentDef[] = [
  {
    id: 'haneul', name: '하늘', role: '거리 뮤지션', tile: { tx: 39, ty: 31 },
    appearance: { skin: 1, hair: 3, hairColor: 5, shirt: 'b0685a', pants: 2 },
    ments: ['오늘 신곡 들어볼래요?', '버스킹은 홍대의 심장이죠', '팁은 사랑입니다 🎸'],
  },
  {
    id: 'moturi', name: '모퉁이 씨', role: '카페 모퉁이 사장', tile: { tx: 30, ty: 36 },
    appearance: { skin: 0, hair: 5, hairColor: 1, shirt: '6a7a8a', pants: 1 },
    ments: ['오늘의 원두는 케냐예요', '알바생 구해요 — 시급 최고!', '커피 향 좋죠?'],
  },
  {
    id: 'sallim', name: '살림 아주머니', role: '가구점 살림 사장', tile: { tx: 14, ty: 36 },
    appearance: { skin: 2, hair: 1, hairColor: 4, shirt: 'e0a8b8', pants: 5 },
    ments: ['새 가구 들어왔어요~', '방 꾸미기엔 러그가 최고야', '싸게 줄게, 구경해요'],
  },
  {
    id: 'jun', name: '준', role: 'GS25 알바', tile: { tx: 22, ty: 31 },
    appearance: { skin: 0, hair: 0, hairColor: 0, shirt: 'a8c8e0', pants: 0 },
    ments: ['1+1 행사 중이에요', '야간 알바는 힘들어요…', '폐기 도시락의 낭만'],
  },
  {
    id: 'choco', name: '초코', role: 'CU 알바', tile: { tx: 48, ty: 31 },
    appearance: { skin: 3, hair: 4, hairColor: 2, shirt: 'd8b86e', pants: 3 },
    ments: ['신상 젤리 입고됐어요', '포인트 적립 되세요?', '컵라면엔 삼각김밥이죠'],
  },
  {
    id: 'ille', name: '일레', role: '세븐일레븐 알바', tile: { tx: 62, ty: 31 },
    appearance: { skin: 1, hair: 2, hairColor: 3, shirt: '9cc79c', pants: 4 },
    ments: ['새벽 손님이 제일 많아요', '아이스크림 반값 행사!', '오늘도 평화로운 편의점'],
  },
  {
    id: 'park', name: '박 기장', role: '역무원', tile: { tx: 38, ty: 45 },
    appearance: { skin: 2, hair: 5, hairColor: 1, shirt: '4a4e5c', pants: 2 },
    ments: ['9번 출구는 언제나 북적여요', '막차 놓치지 마세요', '분실물은 역무실로!'],
  },
  {
    id: 'noeul', name: '노을', role: '벽화 화가', tile: { tx: 60, ty: 41 },
    appearance: { skin: 0, hair: 2, hairColor: 5, shirt: 'c8a8d8', pants: 1 },
    ments: ['이 벽엔 노을을 그릴 거예요', '물감이 좀 튀었네', '예술은 골목에 있죠'],
  },
  {
    id: 'imo', name: '포차 이모', role: '포차 골목 사장', tile: { tx: 10, ty: 45 },
    appearance: { skin: 2, hair: 1, hairColor: 0, shirt: 'd88a7c', pants: 5 },
    ments: ['떡볶이 맵기 조절 돼~', '어묵 국물은 서비스!', '우리 집이 원조야'],
  },
  {
    id: 'dongsu', name: '동수 할아버지', role: '숲길 산책러', tile: { tx: 30, ty: 5 },
    appearance: { skin: 1, hair: 5, hairColor: 4, shirt: 'f2ead8', pants: 1 },
    ments: ['이 숲길이 옛날엔 기찻길이었지', '젊은이, 천천히 걸어요', '나무들이 참 좋지?'],
  },
];

// ── 신뢰도 저장/계산 (순수 로직 — 테스트 대상) ──

export interface TrustEntry { v: number; day: string }
export type TrustState = Record<string, TrustEntry>;

export const TRUST_GAIN = 15;
export const TRUST_MAX = 100;

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
