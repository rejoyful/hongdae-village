import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { EV, type PosMsg, type ChatMsg, type EmoteMsg } from './protocol';
import type { NetworkAdapter, PeerState } from './NetworkAdapter';

interface PresenceMeta { nickname: string; color: string }

/** NetworkAdapter의 Supabase Realtime 구현체 — presence(입장/퇴장) + broadcast(위치·채팅·이모트) */
export class SupabaseAdapter implements NetworkAdapter {
  private channel: RealtimeChannel | null = null;
  private self: PeerState | null = null;
  private known = new Set<string>();
  private retryMs = 1000;
  private stopped = false;

  private joinCbs: Array<(p: PeerState) => void> = [];
  private leaveCbs: Array<(id: string) => void> = [];
  private posCbs: Array<(id: string, m: PosMsg, at: number) => void> = [];
  private chatCbs: Array<(id: string, m: ChatMsg) => void> = [];
  private emoteCbs: Array<(id: string, m: EmoteMsg) => void> = [];

  constructor(private readonly client: SupabaseClient) {}

  async connect(self: PeerState): Promise<void> {
    this.self = self;
    this.stopped = false; // 씬 재진입(거리 복귀) 시 재활성화
    this.known.clear();
    this.subscribe();
  }

  async disconnect(): Promise<void> {
    this.stopped = true;
    this.known.clear();
    if (this.channel) await this.channel.unsubscribe();
    this.channel = null;
  }

  clearListeners(): void {
    this.joinCbs = [];
    this.leaveCbs = [];
    this.posCbs = [];
    this.chatCbs = [];
    this.emoteCbs = [];
  }

  private subscribe(): void {
    const self = this.self;
    if (!self || this.stopped) return;

    const ch = this.client.channel('street', {
      config: { presence: { key: self.userId }, broadcast: { self: false } },
    });

    ch.on('presence', { event: 'sync' }, () => this.syncPresence());

    ch.on('broadcast', { event: EV.pos }, ({ payload }) => {
      const p = payload as { u: string } & PosMsg;
      if (p.u === self.userId) return;
      const at = Date.now();
      this.posCbs.forEach((cb) => cb(p.u, { x: p.x, y: p.y, f: p.f }, at));
    });
    ch.on('broadcast', { event: EV.chat }, ({ payload }) => {
      const p = payload as { u: string } & ChatMsg;
      if (p.u === self.userId) return;
      this.chatCbs.forEach((cb) => cb(p.u, { t: p.t }));
    });
    ch.on('broadcast', { event: EV.emote }, ({ payload }) => {
      const p = payload as { u: string } & EmoteMsg;
      if (p.u === self.userId) return;
      this.emoteCbs.forEach((cb) => cb(p.u, { k: p.k }));
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.retryMs = 1000;
        void ch.track({ nickname: self.nickname, color: self.color } satisfies PresenceMeta);
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        // 끊겨도 게임은 "혼자 모드"로 계속 (스펙 §7) — 지수 백오프 재구독
        this.scheduleResubscribe();
      }
    });

    this.channel = ch;
  }

  private scheduleResubscribe(): void {
    if (this.stopped) return;
    const wait = this.retryMs;
    this.retryMs = Math.min(this.retryMs * 2, 15000);
    setTimeout(() => {
      if (this.stopped) return;
      if (this.channel) void this.channel.unsubscribe();
      this.channel = null;
      this.subscribe();
    }, wait);
  }

  private syncPresence(): void {
    const ch = this.channel;
    const self = this.self;
    if (!ch || !self) return;
    const state = ch.presenceState<PresenceMeta>();
    const current = new Set(Object.keys(state));

    for (const id of current) {
      if (id === self.userId || this.known.has(id)) continue;
      const meta = state[id]?.[0];
      if (!meta) continue;
      this.known.add(id);
      this.joinCbs.forEach((cb) => cb({ userId: id, nickname: meta.nickname, color: meta.color }));
    }
    for (const id of [...this.known]) {
      if (!current.has(id)) {
        this.known.delete(id);
        this.leaveCbs.forEach((cb) => cb(id));
      }
    }
  }

  private broadcast(event: string, payload: Record<string, unknown>): void {
    const self = this.self;
    if (!this.channel || !self) return;
    void this.channel.send({ type: 'broadcast', event, payload: { u: self.userId, ...payload } });
  }

  sendPos(msg: PosMsg): void { this.broadcast(EV.pos, { x: msg.x, y: msg.y, f: msg.f }); }
  sendChat(msg: ChatMsg): void { this.broadcast(EV.chat, { t: msg.t }); }
  sendEmote(msg: EmoteMsg): void { this.broadcast(EV.emote, { k: msg.k }); }

  onPeerJoin(cb: (peer: PeerState) => void): void { this.joinCbs.push(cb); }
  onPeerLeave(cb: (userId: string) => void): void { this.leaveCbs.push(cb); }
  onPos(cb: (userId: string, msg: PosMsg, atMs: number) => void): void { this.posCbs.push(cb); }
  onChat(cb: (userId: string, msg: ChatMsg) => void): void { this.chatCbs.push(cb); }
  onEmote(cb: (userId: string, msg: EmoteMsg) => void): void { this.emoteCbs.push(cb); }
}
