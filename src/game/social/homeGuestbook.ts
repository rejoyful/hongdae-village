import { sanitizeNetworkUserId } from '../../net/protocol';

export type HomeGuestbookStickerKind = 'cozy' | 'music' | 'green' | 'creator' | 'pet' | 'layout' | 'color' | 'welcome';

export interface HomeGuestbookStickerDef {
  id: HomeGuestbookStickerKind;
  mark: string;
  name: string;
  message: string;
  color: string;
  deep: string;
}

export interface HomeGuestbookRecord {
  id: number;
  roomId: number;
  fromUserId: string;
  fromNickname: string;
  kind: HomeGuestbookStickerKind;
  day: string;
  createdAt: string;
}

export interface HomeGuestbookProgress { sent: number; kinds: number; homes: number; todaySent: number }

export interface HomeGuestbookState {
  version: 1;
  sent: number;
  kindIds: HomeGuestbookStickerKind[];
  homeIds: string[];
  sentDays: Record<string, string>;
}

export const HOME_GUESTBOOK_STICKERS: readonly HomeGuestbookStickerDef[] = [
  { id: 'cozy', mark: '온', name: '포근함이 오래 남아요', message: '쉬어 가고 싶은 온기가 방 구석구석에 머물러요.', color: '#d6a06f', deep: '#72533e' },
  { id: 'music', mark: '음', name: '방 안에 리듬이 보여요', message: '가구 사이의 작은 박자까지 이 집만의 노래 같아요.', color: '#a285b6', deep: '#584a69' },
  { id: 'green', mark: '잎', name: '초록 숨이 참 좋아요', message: '작은 잎과 빛이 만나 집 안에 계절을 만들었어요.', color: '#86a273', deep: '#4e6547' },
  { id: 'creator', mark: '손', name: '창작자의 자리가 멋져요', message: '무언가 시작하고 싶어지는 도구와 여백이 보여요.', color: '#719ba2', deep: '#415e66' },
  { id: 'pet', mark: '발', name: '작은 식구 자리도 보여요', message: '가장 작은 동행까지 편히 머물 수 있는 집이에요.', color: '#c58d7b', deep: '#715047' },
  { id: 'layout', mark: '길', name: '걷기 좋은 집이에요', message: '처음 온 사람도 자연스럽게 쉴 곳을 찾을 수 있어요.', color: '#9a9875', deep: '#5d5c47' },
  { id: 'color', mark: '색', name: '색 조합이 기억에 남아요', message: '서로 다른 색이 한 장면처럼 잘 이어져 보여요.', color: '#cb8795', deep: '#754e5b' },
  { id: 'welcome', mark: '문', name: '초대해 줘서 고마워요', message: '순위나 평가 없이 편하게 둘러볼 수 있어 반가웠어요.', color: '#d2b067', deep: '#735f3c' },
] as const;

export const HOME_GUESTBOOK_STICKER_BY_ID = new Map(HOME_GUESTBOOK_STICKERS.map((sticker) => [sticker.id, sticker]));
export const HOME_GUESTBOOK_STICKER_KINDS = HOME_GUESTBOOK_STICKERS.map((sticker) => sticker.id);

export function isHomeGuestbookStickerKind(value: unknown): value is HomeGuestbookStickerKind {
  return typeof value === 'string' && HOME_GUESTBOOK_STICKER_BY_ID.has(value as HomeGuestbookStickerKind);
}

export function seoulGuestbookDay(now: Date | number = Date.now()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now instanceof Date ? now : new Date(now));
}

export function normalizeHomeGuestbookState(raw: unknown): HomeGuestbookState {
  const value = raw && typeof raw === 'object' ? raw as Partial<HomeGuestbookState> : {};
  const sentDays: Record<string, string> = {};
  if (value.sentDays && typeof value.sentDays === 'object') for (const [key, day] of Object.entries(value.sentDays)) {
    if (/^\d{1,8}$/.test(key) && typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) sentDays[key] = day;
  }
  return {
    version: 1,
    sent: typeof value.sent === 'number' && Number.isFinite(value.sent) ? Math.max(0, Math.floor(value.sent)) : 0,
    kindIds: Array.isArray(value.kindIds) ? [...new Set(value.kindIds.filter(isHomeGuestbookStickerKind))] : [],
    homeIds: Array.isArray(value.homeIds) ? [...new Set(value.homeIds.flatMap((id) => sanitizeNetworkUserId(id) ?? []))].slice(0, 500) : [],
    sentDays,
  };
}

export class HomeGuestbookStore {
  private readonly key: string;
  private state: HomeGuestbookState;

  constructor(userId: string) {
    const safeId = sanitizeNetworkUserId(userId) ?? 'offline';
    this.key = `hv-home-guestbook-v1:${safeId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeHomeGuestbookState(raw); this.persist();
  }

  canSend(roomId: number, now: Date | number = Date.now()): boolean { return this.state.sentDays[String(roomId)] !== seoulGuestbookDay(now); }

  recordSent(roomId: number, ownerId: string, kind: HomeGuestbookStickerKind, now: Date | number = Date.now()): boolean {
    const safeOwner = sanitizeNetworkUserId(ownerId);
    if (!Number.isInteger(roomId) || roomId <= 0 || !safeOwner || !isHomeGuestbookStickerKind(kind) || !this.canSend(roomId, now)) return false;
    this.state.sentDays[String(roomId)] = seoulGuestbookDay(now);
    this.state.sent += 1;
    if (!this.state.kindIds.includes(kind)) this.state.kindIds.push(kind);
    if (!this.state.homeIds.includes(safeOwner)) this.state.homeIds.push(safeOwner);
    this.persist(); return true;
  }

  progress(now: Date | number = Date.now()): HomeGuestbookProgress {
    const day = seoulGuestbookDay(now);
    return { sent: this.state.sent, kinds: this.state.kindIds.length, homes: this.state.homeIds.length, todaySent: Object.values(this.state.sentDays).filter((value) => value === day).length };
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
