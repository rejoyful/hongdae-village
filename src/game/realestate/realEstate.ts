import type { Rect } from '../world/grid';
import { seeded } from '../art/pixelCanvas';

/**
 * 부동산 시스템 (실제 한국 주거 반영) — 순수 데이터 + 평면 생성.
 * 5종 주택 × 3종 거래(전세·월세·매매). 시세/평면은 여기서 결정하고 테스트한다.
 */
export type HouseType = 'banjiha' | 'oneroom' | 'villa' | 'apt' | 'house';
export type DealType = 'jeonse' | 'wolse' | 'maemae';

export const DEAL_LABEL: Record<DealType, string> = { jeonse: '전세', wolse: '월세', maemae: '매매' };

export interface HouseSpec {
  type: HouseType;
  label: string;
  w: number; h: number;   // 실내 타일 크기 (테두리 포함)
  rooms: number;          // 방 개수
  jeonseDeposit: number;  // 전세금 (전액 예치·퇴실 시 환급)
  wolseDeposit: number;   // 월세 보증금 (예치·환급)
  monthlyRent: number;    // 월세 (코인/서울일)
  price: number;          // 매매가 (매도 시 90% 환급)
  desc: string;
}

/** 시세는 코인 기준 상대값 (반지하=첫 집, 단독=로망). 밸런스 튜닝 대상. */
export const HOUSE_SPECS: Record<HouseType, HouseSpec> = {
  banjiha: { type: 'banjiha', label: '반지하', w: 7, h: 6, rooms: 1,
    jeonseDeposit: 300, wolseDeposit: 80, monthlyRent: 4, price: 500,
    desc: '볕은 아쉽지만 착한 가격, 첫 독립의 낭만' },
  oneroom: { type: 'oneroom', label: '원룸', w: 8, h: 7, rooms: 1,
    jeonseDeposit: 600, wolseDeposit: 150, monthlyRent: 7, price: 1000,
    desc: '혼삶의 정석, 역세권 풀옵션' },
  villa: { type: 'villa', label: '빌라', w: 11, h: 9, rooms: 2,
    jeonseDeposit: 1400, wolseDeposit: 300, monthlyRent: 14, price: 2400,
    desc: '투룸 신혼집 감성, 주차 가능' },
  apt: { type: 'apt', label: '아파트', w: 13, h: 11, rooms: 3,
    jeonseDeposit: 3200, wolseDeposit: 700, monthlyRent: 26, price: 6000,
    desc: '국민 평형 3룸, 브랜드 단지' },
  house: { type: 'house', label: '단독주택', w: 15, h: 12, rooms: 4,
    jeonseDeposit: 5000, wolseDeposit: 1000, monthlyRent: 40, price: 10000,
    desc: '마당 있는 로망, 홈오피스 가능' },
};

export interface FloorRoom { name: string; rect: Rect }
export interface FloorPlan {
  w: number; h: number;
  door: { tx: number; ty: number };   // 하단 벽 중앙
  spawn: { tx: number; ty: number };
  walls: Rect[];                        // 내부 칸막이 (테두리 제외)
  doorGaps: Array<{ tx: number; ty: number }>; // 칸막이 통로
  rooms: FloorRoom[];                   // 라벨용 구획
}

const ROOM_NAMES = ['거실', '침실', '주방', '작은방', '서재', '드레스룸'];

/**
 * 유형·시드로 평면 생성 — 방 개수만큼 내부를 칸막이로 나눈다.
 * 결정론적: 같은 (type, seed)면 항상 같은 평면.
 */
export function generateFloorPlan(type: HouseType, seed: number): FloorPlan {
  const spec = HOUSE_SPECS[type];
  const { w, h, rooms } = spec;
  const rnd = seeded(seed + w * 31 + h * 7);
  const door = { tx: Math.floor(w / 2), ty: h - 1 };
  const spawn = { tx: door.tx, ty: h - 2 };
  const walls: Rect[] = [];
  const doorGaps: Array<{ tx: number; ty: number }> = [];
  const roomRects: FloorRoom[] = [];

  const interior: Rect = { x: 1, y: 1, w: w - 2, h: h - 2 };

  // 하단 실내 행(y=h-2)은 항상 통로로 비워 둔다 → 현관에서 모든 구획 도달 보장.
  const wallBottom = h - 3;      // 세로 칸막이는 이 행까지만 (바닥 복도 확보)
  if (rooms <= 1) {
    roomRects.push({ name: '원룸', rect: interior });
  } else if (rooms === 2) {
    const midX = 1 + Math.floor((w - 2) / 2);
    walls.push({ x: midX, y: 1, w: 1, h: wallBottom });
    roomRects.push({ name: '거실', rect: { x: 1, y: 1, w: midX - 1, h: h - 2 } });
    roomRects.push({ name: '침실', rect: { x: midX + 1, y: 1, w: w - 2 - midX, h: h - 2 } });
  } else if (rooms === 3) {
    const midX = 1 + Math.floor((w - 2) * 0.55);
    walls.push({ x: midX, y: 1, w: 1, h: wallBottom });
    const midY = 1 + Math.floor((h - 3) / 2);
    walls.push({ x: midX + 1, y: midY, w: w - 2 - midX, h: 1 });
    doorGaps.push({ tx: midX + 1 + Math.floor(rnd() * Math.max(1, w - 3 - midX)), ty: midY });
    roomRects.push({ name: '거실', rect: { x: 1, y: 1, w: midX - 1, h: h - 2 } });
    roomRects.push({ name: '침실', rect: { x: midX + 1, y: 1, w: w - 2 - midX, h: midY - 1 } });
    roomRects.push({ name: '주방', rect: { x: midX + 1, y: midY + 1, w: w - 2 - midX, h: h - 2 - midY } });
  } else {
    // 십자(세로는 바닥 복도 앞에서 멈춤) — 4구획, 가로 칸막이는 양쪽에 통로
    const midX = 1 + Math.floor((w - 2) / 2);
    const midY = 1 + Math.floor((h - 3) / 2);
    walls.push({ x: midX, y: 1, w: 1, h: wallBottom });
    walls.push({ x: 1, y: midY, w: w - 2, h: 1 });
    doorGaps.push({ tx: Math.max(2, 1 + Math.floor(rnd() * (midX - 1))), ty: midY });
    doorGaps.push({ tx: midX + 1 + Math.floor(rnd() * Math.max(1, w - 2 - midX)), ty: midY });
    const names = [...ROOM_NAMES];
    roomRects.push({ name: names[0]!, rect: { x: 1, y: 1, w: midX - 1, h: midY - 1 } });
    roomRects.push({ name: names[1]!, rect: { x: midX + 1, y: 1, w: w - 2 - midX, h: midY - 1 } });
    roomRects.push({ name: names[2]!, rect: { x: 1, y: midY + 1, w: midX - 1, h: h - 2 - midY } });
    roomRects.push({ name: names[3]!, rect: { x: midX + 1, y: midY + 1, w: w - 2 - midX, h: h - 2 - midY } });
  }

  return { w, h, door, spawn, walls, doorGaps, rooms: roomRects };
}

/** 특정 타일이 배치 가능한 실내 바닥인지 (테두리·칸막이 제외, 통로는 바닥) */
export function isPlaceableTile(plan: FloorPlan, tx: number, ty: number): boolean {
  if (tx < 1 || ty < 1 || tx >= plan.w - 1 || ty >= plan.h - 1) return false;
  if (plan.door.tx === tx && plan.door.ty === ty) return false;
  for (const w of plan.walls) {
    if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) {
      const isGap = plan.doorGaps.some((g) => g.tx === tx && g.ty === ty);
      if (!isGap) return false;
    }
  }
  return true;
}

// ── 월세 청구 (서울시간 일 기준) ──

/** last부터 now까지 경과한 "서울 자정" 횟수 = 월세 청구 일수 */
export function rentPeriods(lastIso: string, now: Date = new Date()): number {
  const fmt = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
  const last = new Date(lastIso);
  if (Number.isNaN(last.getTime())) return 0;
  const dayMs = 86400000;
  const lastDay = Math.floor(new Date(fmt(last) + 'T00:00:00Z').getTime() / dayMs);
  const nowDay = Math.floor(new Date(fmt(now) + 'T00:00:00Z').getTime() / dayMs);
  return Math.max(0, nowDay - lastDay);
}
