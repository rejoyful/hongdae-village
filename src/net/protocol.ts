/** broadcast 이벤트 이름 (10Hz 전송 대역폭 절약을 위해 짧은 키 사용) */
export const EV = { pos: 'p', chat: 'c', emote: 'e' } as const;

/** f: 바라보는 방향 — 0 하, 1 우, 2 좌, 3 상 (Phase 5 스프라이트용, 지금은 전송만) */
export interface PosMsg { x: number; y: number; f: 0 | 1 | 2 | 3 }
export interface ChatMsg { t: string }

export type EmoteKind =
  | 'heart' | 'laugh' | 'clap' | 'dance'
  | 'surprise' | 'sleepy' | 'cheers' | 'wave';
export interface EmoteMsg { k: EmoteKind }

export const POS_HZ = 10;            // 위치 전송 주기 (초당 회수)
export const INTERP_DELAY_MS = 120;  // 원격 보간 지연 버퍼
export const CHAT_MAX = 80;          // 채팅 최대 길이

/** 채팅 메시지 정제: trim → 80자 제한. 내용이 없으면 null */
export function sanitizeChat(raw: string): string | null {
  const t = raw.trim().slice(0, CHAT_MAX);
  return t.length > 0 ? t : null;
}
