import {
  PET_MEET_KINDS, isPetMeetKind, sanitizeNetworkUserId, type PetMeetKind,
} from '../../net/protocol';
import {
  normalizePetStylePublicCard, type PetStylePublicCard,
} from '../pets/petStyleStudio';
import { seoulDayAt } from './neighborCheers';

export interface PetMeetSceneDef {
  id: PetMeetKind;
  mark: string;
  code: string;
  name: string;
  message: string;
  colors: readonly [string, string, string, string];
}

export const PET_MEET_SCENES: readonly PetMeetSceneDef[] = [
  { id: 'alley_walk', mark: '걷', code: 'ALLEY WALK', name: '나란한 골목 산책', message: '말보다 먼저 같은 속도로 걷기 시작했어요.', colors: ['#20252b', '#49525a', '#b8796d', '#ead5a5'] },
  { id: 'cafe_window', mark: '창', code: 'CAFE WINDOW', name: '카페 창가의 첫 인사', message: '따뜻한 창가에서 서로의 냄새를 천천히 기억했어요.', colors: ['#2c2422', '#72533f', '#c89363', '#efdbaf'] },
  { id: 'roof_garden', mark: '잎', code: 'ROOF GARDEN', name: '옥상 화분 사이', message: '작은 잎이 흔들릴 때 두 꼬리도 함께 흔들렸어요.', colors: ['#1f2b27', '#4f6a50', '#91aa6c', '#e5d7a2'] },
  { id: 'rain_shelter', mark: '비', code: 'RAIN SHELTER', name: '비를 나눈 처마', message: '한 칸 좁은 처마가 둘에게는 충분한 쉼터였어요.', colors: ['#202a36', '#486878', '#77a2a6', '#d8dfb7'] },
  { id: 'little_stage', mark: '무', code: 'LITTLE STAGE', name: '작은 무대의 합동 인사', message: '누가 더 잘했는지 없이 서로의 박수만 남겼어요.', colors: ['#30212b', '#78475a', '#d17a68', '#efd08d'] },
  { id: 'forest_star', mark: '별', code: 'FOREST STAR', name: '별빛 숲의 두 발자국', message: '돌아오는 길을 잊지 않도록 발자국을 나란히 남겼어요.', colors: ['#1c2928', '#405e50', '#80996e', '#ded08d'] },
] as const;

export const PET_MEET_SCENE_BY_ID = new Map(PET_MEET_SCENES.map((scene) => [scene.id, scene]));
export const PET_MEET_ALBUM_MAX = 36;

export interface PetMeetPostcard {
  id: string;
  direction: 'sent' | 'received';
  neighborId: string;
  neighborNickname: string;
  kind: PetMeetKind;
  day: string;
  createdAt: number;
  myPet: PetStylePublicCard;
  neighborPet: PetStylePublicCard;
}

export interface PetMeetProgress {
  sent: number;
  received: number;
  total: number;
  scenes: number;
  neighbors: number;
  species: number;
  pairs: number;
  albumCards: number;
  todaySent: number;
}

export interface PetMeetStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface PetMeetState {
  version: 1;
  records: PetMeetPostcard[];
  sentDays: Record<string, string>;
  receivedDays: Record<string, string>;
  sentTotal: number;
  receivedTotal: number;
  sceneIds: PetMeetKind[];
  neighborIds: string[];
  speciesIds: string[];
  pairIds: string[];
}

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);
const cleanNickname = (value: unknown): string => (
  typeof value === 'string'
    ? value.replace(/[<>\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || '이름 없는 이웃'
    : '이름 없는 이웃'
);
const cleanDay = (value: unknown, timestamp: number): string => (
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : seoulDayAt(timestamp)
);
const pairId = (a: PetStylePublicCard, b: PetStylePublicCard): string => (
  [a.petId, b.petId].sort().join('+')
);
const browserStorage = (): PetMeetStorage | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

function normalizeDays(raw: unknown): Record<string, string> {
  const days: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return days;
  for (const [id, day] of Object.entries(raw)) {
    const safeId = sanitizeNetworkUserId(id);
    if (safeId && typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) days[safeId] = day;
  }
  return days;
}

/** 다른 영구 전시가 안전한 엽서 스냅샷만 복제할 수 있게 하는 단일 레코드 정규화 계약. */
export function normalizePetMeetPostcard(raw: unknown): PetMeetPostcard | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<PetMeetPostcard>;
  const neighborId = sanitizeNetworkUserId(item.neighborId);
  const myPet = normalizePetStylePublicCard(item.myPet);
  const neighborPet = normalizePetStylePublicCard(item.neighborPet);
  const createdAt = cleanCount(item.createdAt);
  if (!neighborId || !myPet || !neighborPet || !isPetMeetKind(item.kind)
    || (item.direction !== 'sent' && item.direction !== 'received')) return null;
  return {
    id: typeof item.id === 'string'
      ? item.id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || `${neighborId}-${createdAt}`
      : `${neighborId}-${createdAt}`,
    direction: item.direction,
    neighborId,
    neighborNickname: cleanNickname(item.neighborNickname),
    kind: item.kind,
    day: cleanDay(item.day, createdAt),
    createdAt,
    myPet,
    neighborPet,
  };
}

export function normalizePetMeetState(raw: unknown): PetMeetState {
  const value = raw && typeof raw === 'object' ? raw as Partial<PetMeetState> : {};
  const records = Array.isArray(value.records) ? value.records.slice(0, PET_MEET_ALBUM_MAX).flatMap((entry) => {
    const record = normalizePetMeetPostcard(entry);
    return record ? [record] : [];
  }) : [];
  const sceneIds = Array.isArray(value.sceneIds)
    ? [...new Set(value.sceneIds.filter(isPetMeetKind))] : [];
  const neighborIds = Array.isArray(value.neighborIds)
    ? [...new Set(value.neighborIds.flatMap((id) => sanitizeNetworkUserId(id) ?? []))].slice(0, 500) : [];
  const speciesIds = Array.isArray(value.speciesIds)
    ? [...new Set(value.speciesIds.filter((id): id is string => typeof id === 'string'))].slice(0, 32) : [];
  const pairIds = Array.isArray(value.pairIds)
    ? [...new Set(value.pairIds.filter((id): id is string => typeof id === 'string' && /^[A-Za-z0-9_+-]{1,80}$/.test(id)))].slice(0, 128) : [];
  return {
    version: 1,
    records,
    sentDays: normalizeDays(value.sentDays),
    receivedDays: normalizeDays(value.receivedDays),
    sentTotal: cleanCount(value.sentTotal),
    receivedTotal: cleanCount(value.receivedTotal),
    sceneIds,
    neighborIds,
    speciesIds,
    pairIds,
  };
}

export class PetMeetPostcardStore {
  private readonly selfId: string;
  private readonly key: string;
  private state: PetMeetState;

  constructor(userId: string, private readonly storage: PetMeetStorage | null = browserStorage()) {
    this.selfId = sanitizeNetworkUserId(userId) ?? 'offline';
    this.key = `hv-pet-meet-postcards-v1:${this.selfId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 안전한 빈 앨범으로 계속 */ }
    this.state = normalizePetMeetState(raw);
    this.persist();
  }

  postcards(): PetMeetPostcard[] { return structuredClone(this.state.records); }
  canSendTo(userId: string, now: Date | number = Date.now()): boolean {
    const neighborId = sanitizeNetworkUserId(userId);
    return !!neighborId && neighborId !== this.selfId && this.state.sentDays[neighborId] !== seoulDayAt(now);
  }

  recordSent(
    userId: string,
    nickname: string,
    kind: PetMeetKind,
    myPetRaw: unknown,
    neighborPetRaw: unknown,
    now: Date | number = Date.now(),
  ): 'sent' | 'today' | 'self' | 'invalid' {
    const neighborId = sanitizeNetworkUserId(userId);
    const myPet = normalizePetStylePublicCard(myPetRaw);
    const neighborPet = normalizePetStylePublicCard(neighborPetRaw);
    if (!neighborId || !isPetMeetKind(kind) || !myPet || !neighborPet) return 'invalid';
    if (neighborId === this.selfId) return 'self';
    const timestamp = now instanceof Date ? now.getTime() : now;
    if (!Number.isFinite(timestamp) || timestamp < 0) return 'invalid';
    const day = seoulDayAt(timestamp);
    if (this.state.sentDays[neighborId] === day) return 'today';
    this.state.sentDays[neighborId] = day;
    this.addRecord('sent', neighborId, nickname, kind, myPet, neighborPet, timestamp, day);
    this.state.sentTotal += 1;
    this.remember(neighborId, kind, myPet, neighborPet);
    this.persist();
    return 'sent';
  }

  receive(
    userId: string,
    nickname: string,
    kind: PetMeetKind,
    myPetRaw: unknown,
    neighborPetRaw: unknown,
    now: Date | number = Date.now(),
  ): 'received' | 'duplicate' | 'self' | 'invalid' {
    const neighborId = sanitizeNetworkUserId(userId);
    const myPet = normalizePetStylePublicCard(myPetRaw);
    const neighborPet = normalizePetStylePublicCard(neighborPetRaw);
    if (!neighborId || !isPetMeetKind(kind) || !myPet || !neighborPet) return 'invalid';
    if (neighborId === this.selfId) return 'self';
    const timestamp = now instanceof Date ? now.getTime() : now;
    if (!Number.isFinite(timestamp) || timestamp < 0) return 'invalid';
    const day = seoulDayAt(timestamp);
    if (this.state.receivedDays[neighborId] === day) return 'duplicate';
    this.state.receivedDays[neighborId] = day;
    this.addRecord('received', neighborId, nickname, kind, myPet, neighborPet, timestamp, day);
    this.state.receivedTotal += 1;
    this.remember(neighborId, kind, myPet, neighborPet);
    this.persist();
    return 'received';
  }

  progress(now: Date | number = Date.now()): PetMeetProgress {
    const day = seoulDayAt(now);
    return {
      sent: this.state.sentTotal,
      received: this.state.receivedTotal,
      total: this.state.sentTotal + this.state.receivedTotal,
      scenes: this.state.sceneIds.length,
      neighbors: this.state.neighborIds.length,
      species: this.state.speciesIds.length,
      pairs: this.state.pairIds.length,
      albumCards: this.state.records.length,
      todaySent: Object.values(this.state.sentDays).filter((sentDay) => sentDay === day).length,
    };
  }

  private addRecord(
    direction: PetMeetPostcard['direction'],
    neighborId: string,
    nickname: string,
    kind: PetMeetKind,
    myPet: PetStylePublicCard,
    neighborPet: PetStylePublicCard,
    timestamp: number,
    day: string,
  ): void {
    this.state.records.unshift({
      id: `${direction}-${neighborId}-${Math.floor(timestamp)}`,
      direction,
      neighborId,
      neighborNickname: cleanNickname(nickname),
      kind,
      day,
      createdAt: Math.floor(timestamp),
      myPet,
      neighborPet,
    });
    this.state.records = this.state.records.slice(0, PET_MEET_ALBUM_MAX);
  }

  private remember(
    neighborId: string,
    kind: PetMeetKind,
    myPet: PetStylePublicCard,
    neighborPet: PetStylePublicCard,
  ): void {
    if (!this.state.sceneIds.includes(kind)) this.state.sceneIds.push(kind);
    if (!this.state.neighborIds.includes(neighborId)) this.state.neighborIds.push(neighborId);
    for (const speciesId of [myPet.petId, neighborPet.petId]) {
      if (!this.state.speciesIds.includes(speciesId)) this.state.speciesIds.push(speciesId);
    }
    const pair = pairId(myPet, neighborPet);
    if (!this.state.pairIds.includes(pair)) this.state.pairIds.push(pair);
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션은 유지 */ }
  }
}

export { PET_MEET_KINDS };
