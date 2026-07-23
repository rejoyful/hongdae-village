/** broadcast 이벤트 이름 (10Hz 전송 대역폭 절약을 위해 짧은 키 사용) */
export const EV = { pos: 'p', chat: 'c', emote: 'e', neighborCheer: 'n', petMeet: 'm' } as const;

/** f: 바라보는 방향 — 0 하, 1 우, 2 좌, 3 상 (Phase 5 스프라이트용, 지금은 전송만) */
export interface PosMsg { x: number; y: number; f: 0 | 1 | 2 | 3 }
export interface ChatMsg { t: string }

export type EmoteKind =
  | 'heart' | 'laugh' | 'clap' | 'dance'
  | 'surprise' | 'sleepy' | 'cheers' | 'wave';
export interface EmoteMsg { k: EmoteKind }

export type NeighborCheerKind =
  | 'style' | 'home' | 'companion' | 'garden'
  | 'table' | 'water' | 'neighbor' | 'adventure';
export interface NeighborCheerMsg { to: string; k: NeighborCheerKind }

export type PetMeetKind =
  | 'alley_walk' | 'cafe_window' | 'roof_garden'
  | 'rain_shelter' | 'little_stage' | 'forest_star';
export interface PetMeetMsg { to: string; k: PetMeetKind }

export const NEIGHBOR_CHEER_KINDS: readonly NeighborCheerKind[] = [
  'style', 'home', 'companion', 'garden', 'table', 'water', 'neighbor', 'adventure',
] as const;

export function isNeighborCheerKind(value: unknown): value is NeighborCheerKind {
  return typeof value === 'string' && (NEIGHBOR_CHEER_KINDS as readonly string[]).includes(value);
}

export const PET_MEET_KINDS: readonly PetMeetKind[] = [
  'alley_walk', 'cafe_window', 'roof_garden', 'rain_shelter', 'little_stage', 'forest_star',
] as const;

export function isPetMeetKind(value: unknown): value is PetMeetKind {
  return typeof value === 'string' && (PET_MEET_KINDS as readonly string[]).includes(value);
}

/** UUID·오프라인 디버그 ID만 허용하고 Realtime 대상 키 크기를 제한한다. */
export function sanitizeNetworkUserId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : null;
}

export const EMOTE_KINDS: readonly EmoteKind[] = [
  'heart', 'laugh', 'clap', 'dance', 'surprise', 'sleepy', 'cheers', 'wave',
] as const;

export function isEmoteKind(value: unknown): value is EmoteKind {
  return typeof value === 'string' && (EMOTE_KINDS as readonly string[]).includes(value);
}

export const POS_HZ = 10;            // 위치 전송 주기 (초당 회수)
export const INTERP_DELAY_MS = 120;  // 원격 보간 지연 버퍼
export const CHAT_MAX = 80;          // 채팅 최대 길이

/** 채팅 메시지 정제: trim → 80자 제한. 내용이 없으면 null */
export function sanitizeChat(raw: string): string | null {
  const t = raw.trim().slice(0, CHAT_MAX);
  return t.length > 0 ? t : null;
}
