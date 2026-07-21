import type { PosMsg, ChatMsg, EmoteMsg } from './protocol';

export interface PeerState { userId: string; nickname: string; color: string }

/**
 * 네트워킹 추상화 — Supabase 구현체를 끼우고, 추후 전용 서버(Colyseus 등)로
 * 교체할 수 있는 유일한 지점 (스펙 §6).
 */
export interface NetworkAdapter {
  connect(self: PeerState): Promise<void>;
  disconnect(): Promise<void>;
  /** 씬 재진입 시 이전 씬이 등록한 콜백 제거 (중복 수신 방지) */
  clearListeners(): void;
  sendPos(msg: PosMsg): void; // fire-and-forget, POS_HZ 주기
  sendChat(msg: ChatMsg): void;
  sendEmote(msg: EmoteMsg): void;
  onPeerJoin(cb: (peer: PeerState) => void): void;
  onPeerLeave(cb: (userId: string) => void): void;
  onPos(cb: (userId: string, msg: PosMsg, atMs: number) => void): void;
  onChat(cb: (userId: string, msg: ChatMsg) => void): void;
  onEmote(cb: (userId: string, msg: EmoteMsg) => void): void;
}
