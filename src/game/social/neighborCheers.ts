import {
  NEIGHBOR_CHEER_KINDS, isNeighborCheerKind, sanitizeNetworkUserId,
  type NeighborCheerKind,
} from '../../net/protocol';

export interface NeighborCheerDef {
  id: NeighborCheerKind;
  mark: string;
  name: string;
  message: string;
  color: string;
  deep: string;
}

export interface NeighborCheerRecord {
  id: string;
  fromUserId: string;
  fromNickname: string;
  kind: NeighborCheerKind;
  receivedAt: number;
  day: string;
}

export interface NeighborCheerProgress {
  sent: number;
  received: number;
  exchanges: number;
  kinds: number;
  neighbors: number;
  todaySent: number;
  inboxCards: number;
}

interface NeighborCheerState {
  version: 1;
  records: NeighborCheerRecord[];
  sentDays: Record<string, string>;
  sentTotal: number;
  receivedTotal: number;
  kindIds: NeighborCheerKind[];
  neighborIds: string[];
}

export const NEIGHBOR_CHEERS: readonly NeighborCheerDef[] = [
  { id: 'style', mark: '옷', name: '오늘 코디가 멋져요', message: '당신의 오늘 색이 골목을 더 선명하게 만들었어요.', color: '#d58d9f', deep: '#795064' },
  { id: 'home', mark: '집', name: '집 취향이 궁금해요', message: '한 칸씩 고른 생활의 결을 더 보고 싶어요.', color: '#c6966e', deep: '#735943' },
  { id: 'companion', mark: '발', name: '동행이 사랑스러워요', message: '나란히 걷는 두 발자국이 아주 잘 어울려요.', color: '#c98f75', deep: '#745347' },
  { id: 'garden', mark: '잎', name: '초록 기록을 응원해요', message: '당신이 돌본 작은 계절이 오래 자라길 바라요.', color: '#8da578', deep: '#536448' },
  { id: 'table', mark: '접', name: '한 접시 나누고 싶어요', message: '당신의 단골 메뉴 옆에 빈 의자 하나를 남겨 둘게요.', color: '#d2a861', deep: '#735c39' },
  { id: 'water', mark: '물', name: '물결 수첩이 근사해요', message: '천천히 기다려 만난 기록이라 더 반짝여요.', color: '#719eaa', deep: '#405d67' },
  { id: 'neighbor', mark: '안', name: '마주쳐서 반가워요', message: '같은 시간의 골목을 걸어서 오늘이 조금 더 넓어졌어요.', color: '#8d94b8', deep: '#505773' },
  { id: 'adventure', mark: '별', name: '다음 모험도 응원해요', message: '서두르지 않아도 당신의 다음 페이지를 기다릴게요.', color: '#9a83ad', deep: '#5a4b69' },
] as const;

export const NEIGHBOR_CHEER_BY_ID = new Map(NEIGHBOR_CHEERS.map((cheer) => [cheer.id, cheer]));
export const NEIGHBOR_CHEER_INBOX_MAX = 36;

const cleanCount = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const cleanNickname = (value: unknown): string => typeof value === 'string'
  ? value.replace(/[<>\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || '이름 없는 이웃'
  : '이름 없는 이웃';

export function seoulDayAt(now: Date | number = Date.now()): string {
  const date = now instanceof Date ? now : new Date(now);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
}

export function normalizeNeighborCheerState(raw: unknown): NeighborCheerState {
  const value = raw && typeof raw === 'object' ? raw as Partial<NeighborCheerState> : {};
  const records = Array.isArray(value.records) ? value.records.slice(0, NEIGHBOR_CHEER_INBOX_MAX).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Partial<NeighborCheerRecord>;
    const fromUserId = sanitizeNetworkUserId(item.fromUserId);
    if (!fromUserId || !isNeighborCheerKind(item.kind) || typeof item.receivedAt !== 'number' || !Number.isFinite(item.receivedAt) || item.receivedAt < 0) return [];
    const receivedAt = Math.floor(item.receivedAt);
    return [{
      id: typeof item.id === 'string' ? item.id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80) || `${fromUserId}-${receivedAt}` : `${fromUserId}-${receivedAt}`,
      fromUserId, fromNickname: cleanNickname(item.fromNickname), kind: item.kind,
      receivedAt, day: typeof item.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.day) ? item.day : seoulDayAt(receivedAt),
    }];
  }) : [];
  const sentDays: Record<string, string> = {};
  if (value.sentDays && typeof value.sentDays === 'object') {
    for (const [id, day] of Object.entries(value.sentDays)) {
      const safeId = sanitizeNetworkUserId(id);
      if (safeId && typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) sentDays[safeId] = day;
    }
  }
  const validKinds = Array.isArray(value.kindIds) ? [...new Set(value.kindIds.filter(isNeighborCheerKind))] : [];
  const validNeighbors = Array.isArray(value.neighborIds)
    ? [...new Set(value.neighborIds.flatMap((id) => sanitizeNetworkUserId(id) ?? []))].slice(0, 500) : [];
  return {
    version: 1, records, sentDays, sentTotal: cleanCount(value.sentTotal), receivedTotal: cleanCount(value.receivedTotal),
    kindIds: validKinds, neighborIds: validNeighbors,
  };
}

export class NeighborCheerStore {
  private readonly key: string;
  private readonly selfId: string;
  private state: NeighborCheerState;

  constructor(userId: string) {
    this.selfId = sanitizeNetworkUserId(userId) ?? 'offline';
    this.key = `hv-neighbor-cheers-v1:${this.selfId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeNeighborCheerState(raw); this.persist();
  }

  records(): readonly NeighborCheerRecord[] { return this.state.records.map((record) => ({ ...record })); }
  canSendTo(userId: string, now: Date | number = Date.now()): boolean {
    const peerId = sanitizeNetworkUserId(userId);
    return !!peerId && peerId !== this.selfId && this.state.sentDays[peerId] !== seoulDayAt(now);
  }

  recordSent(userId: string, kind: NeighborCheerKind, now: Date | number = Date.now()): 'sent' | 'today' | 'self' | 'invalid' {
    const peerId = sanitizeNetworkUserId(userId);
    if (!peerId || !isNeighborCheerKind(kind)) return 'invalid';
    if (peerId === this.selfId) return 'self';
    const day = seoulDayAt(now);
    if (this.state.sentDays[peerId] === day) return 'today';
    this.state.sentDays[peerId] = day;
    this.state.sentTotal += 1;
    if (!this.state.kindIds.includes(kind)) this.state.kindIds.push(kind);
    if (!this.state.neighborIds.includes(peerId)) this.state.neighborIds.push(peerId);
    this.persist(); return 'sent';
  }

  receive(userId: string, nickname: string, kind: NeighborCheerKind, now: Date | number = Date.now()): 'received' | 'duplicate' | 'self' | 'invalid' {
    const peerId = sanitizeNetworkUserId(userId);
    if (!peerId || !isNeighborCheerKind(kind)) return 'invalid';
    if (peerId === this.selfId) return 'self';
    const timestamp = now instanceof Date ? now.getTime() : now;
    if (!Number.isFinite(timestamp) || timestamp < 0) return 'invalid';
    const day = seoulDayAt(timestamp);
    if (this.state.records.some((record) => record.fromUserId === peerId && record.day === day)) return 'duplicate';
    this.state.records.unshift({
      id: `${peerId}-${Math.floor(timestamp)}`, fromUserId: peerId, fromNickname: cleanNickname(nickname),
      kind, receivedAt: Math.floor(timestamp), day,
    });
    this.state.records = this.state.records.slice(0, NEIGHBOR_CHEER_INBOX_MAX);
    this.state.receivedTotal += 1;
    if (!this.state.kindIds.includes(kind)) this.state.kindIds.push(kind);
    if (!this.state.neighborIds.includes(peerId)) this.state.neighborIds.push(peerId);
    this.persist(); return 'received';
  }

  progress(now: Date | number = Date.now()): NeighborCheerProgress {
    const day = seoulDayAt(now);
    return {
      sent: this.state.sentTotal, received: this.state.receivedTotal,
      exchanges: this.state.sentTotal + this.state.receivedTotal, kinds: this.state.kindIds.length,
      neighbors: this.state.neighborIds.length,
      todaySent: Object.values(this.state.sentDays).filter((sentDay) => sentDay === day).length,
      inboxCards: this.state.records.length,
    };
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
