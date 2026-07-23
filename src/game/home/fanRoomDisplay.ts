import type { FanMerchRecord, FanMerchWorkshopState } from '../progression/fanMerchWorkshop';

export const FAN_ROOM_STYLES = [
  { id: 'wood_shelf', mark: '선', code: 'WOOD SHELF', name: '포근한 원목 선반', note: '작은 소장품이 나란히 쉬는 생활형 진열' },
  { id: 'peg_board', mark: '핀', code: 'PEG BOARD', name: '작업실 타공판', note: '카드와 키링을 자유롭게 건 작업실 벽' },
  { id: 'glass_case', mark: '관', code: 'GLASS CASE', name: '심야 유리 장식장', note: '아크릴과 배지를 빛 아래 모은 전시형 진열' },
  { id: 'poster_wall', mark: '벽', code: 'POSTER WALL', name: '겹쳐 붙인 팬 월', note: '포스터와 티켓이 장면처럼 이어지는 벽' },
] as const;

export const FAN_ROOM_LIGHTS = [
  { id: 'warm', mark: '등', code: 'WARM LAMP', name: '크림 스탠드', note: '포근한 방의 노란 저녁빛', colors: ['#31252b', '#74504d', '#d29a68', '#f1d59c'] },
  { id: 'neon', mark: '빛', code: 'NEON NIGHT', name: '홍대 네온', note: '보라와 분홍이 번지는 심야빛', colors: ['#211f33', '#594775', '#c56591', '#efbd82'] },
  { id: 'daylight', mark: '창', code: 'DAYLIGHT', name: '낮의 창가', note: '맑은 하늘과 잎 그림자의 낮빛', colors: ['#26343b', '#567982', '#96b9a6', '#e9ddad'] },
  { id: 'forest', mark: '숲', code: 'FOREST STAR', name: '외곽 별빛', note: '초록 그림자와 별가루가 남는 밤', colors: ['#1f2d2b', '#426052', '#7d9770', '#decf8f'] },
] as const;

export type FanRoomStyleId = typeof FAN_ROOM_STYLES[number]['id'];
export type FanRoomLightId = typeof FAN_ROOM_LIGHTS[number]['id'];

export interface FanRoomDisplayState {
  version: 1;
  styleId: FanRoomStyleId;
  lightId: FanRoomLightId;
  visible: boolean;
  triedStyleIds: FanRoomStyleId[];
  triedLightIds: FanRoomLightId[];
  restyles: number;
}

export interface FanRoomDisplayProgress {
  featuredGoods: number;
  stylesTried: number;
  lightsTried: number;
  restyles: number;
  visible: boolean;
}

export interface FanRoomStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const styleIds = new Set<string>(FAN_ROOM_STYLES.map((item) => item.id));
const lightIds = new Set<string>(FAN_ROOM_LIGHTS.map((item) => item.id));
const isStyleId = (value: unknown): value is FanRoomStyleId => typeof value === 'string' && styleIds.has(value);
const isLightId = (value: unknown): value is FanRoomLightId => typeof value === 'string' && lightIds.has(value);
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function freshFanRoomDisplayState(): FanRoomDisplayState {
  return {
    version: 1,
    styleId: 'wood_shelf',
    lightId: 'warm',
    visible: true,
    triedStyleIds: ['wood_shelf'],
    triedLightIds: ['warm'],
    restyles: 0,
  };
}

export function normalizeFanRoomDisplayState(raw: unknown): FanRoomDisplayState {
  if (!raw || typeof raw !== 'object') return freshFanRoomDisplayState();
  const value = raw as Partial<FanRoomDisplayState>;
  const styleId = isStyleId(value.styleId) ? value.styleId : 'wood_shelf';
  const lightId = isLightId(value.lightId) ? value.lightId : 'warm';
  return {
    version: 1,
    styleId,
    lightId,
    visible: value.visible !== false,
    triedStyleIds: [...new Set([
      ...(Array.isArray(value.triedStyleIds) ? value.triedStyleIds.filter(isStyleId) : []),
      styleId,
    ])],
    triedLightIds: [...new Set([
      ...(Array.isArray(value.triedLightIds) ? value.triedLightIds.filter(isLightId) : []),
      lightId,
    ])],
    restyles: cleanCount(value.restyles),
  };
}

export function featuredFanMerch(state: FanMerchWorkshopState): FanMerchRecord[] {
  const byId = new Map(state.slots.flatMap((record) => record ? [[record.id, record] as const] : []));
  return state.featuredIds.flatMap((id) => {
    const record = byId.get(id);
    return record ? [structuredClone(record)] : [];
  });
}

function browserStorage(): FanRoomStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class FanRoomDisplayStore {
  private state: FanRoomDisplayState;
  private readonly key: string;

  constructor(userId: string, private readonly storage: FanRoomStorage | null = browserStorage()) {
    this.key = `hv-fan-room-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 손상된 저장 대신 안전한 기본 진열을 사용 */ }
    this.state = normalizeFanRoomDisplayState(raw);
    this.persist();
  }

  get(): FanRoomDisplayState { return structuredClone(this.state); }

  progress(featuredGoods: number): FanRoomDisplayProgress {
    return {
      featuredGoods: Math.max(0, Math.min(3, Math.floor(featuredGoods))),
      stylesTried: this.state.triedStyleIds.length,
      lightsTried: this.state.triedLightIds.length,
      restyles: this.state.restyles,
      visible: this.state.visible,
    };
  }

  selectStyle(styleId: FanRoomStyleId): boolean {
    if (!styleIds.has(styleId) || styleId === this.state.styleId) return false;
    this.state = {
      ...this.state,
      styleId,
      triedStyleIds: [...new Set([...this.state.triedStyleIds, styleId])],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return true;
  }

  selectLight(lightId: FanRoomLightId): boolean {
    if (!lightIds.has(lightId) || lightId === this.state.lightId) return false;
    this.state = {
      ...this.state,
      lightId,
      triedLightIds: [...new Set([...this.state.triedLightIds, lightId])],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return true;
  }

  setVisible(visible: boolean): boolean {
    if (visible === this.state.visible) return false;
    this.state = { ...this.state, visible, restyles: this.state.restyles + 1 };
    this.persist();
    return true;
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션 상태는 유지 */ }
  }
}
