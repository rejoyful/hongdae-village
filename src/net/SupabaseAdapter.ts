import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import {
  EV, isEmoteKind, isNeighborCheerKind, isPetMeetKind, sanitizeChat, sanitizeNetworkUserId,
  type PosMsg, type ChatMsg, type EmoteMsg, type NeighborCheerMsg, type PetMeetMsg,
} from './protocol';
import type { NetworkAdapter, NetworkWorld, PeerState } from './NetworkAdapter';
import { normalizeAppearance, type Appearance } from '../game/art/appearance';
import { isPetAccessoryId, sanitizePetNickname, type PetAccessoryId } from '../game/pets/petProfiles';
import { normalizeVillageProfilePublic, type VillageProfilePublic } from '../game/progression/villageProfile';

interface PresenceMeta {
  nickname: string;
  color: string;
  appearance?: Appearance;
  pet?: string | null;
  petAccessory?: PetAccessoryId;
  petName?: string | null;
  level?: number;
  badge?: string | null;
  profile?: VillageProfilePublic | null;
}

/** NetworkAdapter의 Supabase Realtime 구현체 — presence(입장/퇴장) + broadcast(위치·채팅·이모트) */
export class SupabaseAdapter implements NetworkAdapter {
  private channel: RealtimeChannel | null = null;
  private self: PeerState | null = null;
  private known = new Set<string>();
  private retryMs = 1000;
  private stopped = false;
  private world: NetworkWorld = 'street';

  private joinCbs: Array<(p: PeerState) => void> = [];
  private updateCbs: Array<(p: PeerState) => void> = [];
  private leaveCbs: Array<(id: string) => void> = [];
  private lastMeta = new Map<string, string>(); // userId → 직전 메타 직렬화 (변경 감지)
  private posCbs: Array<(id: string, m: PosMsg, at: number) => void> = [];
  private chatCbs: Array<(id: string, m: ChatMsg) => void> = [];
  private emoteCbs: Array<(id: string, m: EmoteMsg) => void> = [];
  private neighborCheerCbs: Array<(id: string, m: NeighborCheerMsg) => void> = [];
  private petMeetCbs: Array<(id: string, m: PetMeetMsg) => void> = [];

  constructor(private readonly client: SupabaseClient) {}

  async connect(self: PeerState, world: NetworkWorld = 'street'): Promise<void> {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.self = self;
    this.world = world;
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
    this.updateCbs = [];
    this.leaveCbs = [];
    this.posCbs = [];
    this.chatCbs = [];
    this.emoteCbs = [];
    this.neighborCheerCbs = [];
    this.petMeetCbs = [];
  }

  private subscribe(): void {
    const self = this.self;
    if (!self || this.stopped) return;

    const ch = this.client.channel(this.world, {
      config: { presence: { key: self.userId }, broadcast: { self: false } },
    });

    ch.on('presence', { event: 'sync' }, () => this.syncPresence());

    ch.on('broadcast', { event: EV.pos }, ({ payload }) => {
      const p = payload as { u: string } & PosMsg;
      if (p.u === self.userId || typeof p.u !== 'string'
        || !Number.isFinite(p.x) || !Number.isFinite(p.y)
        || !Number.isInteger(p.f) || p.f < 0 || p.f > 3) return;
      const at = Date.now();
      this.posCbs.forEach((cb) => cb(p.u, { x: p.x, y: p.y, f: p.f }, at));
    });
    ch.on('broadcast', { event: EV.chat }, ({ payload }) => {
      const p = payload as { u: string } & ChatMsg;
      if (p.u === self.userId || typeof p.u !== 'string') return;
      const text = sanitizeChat(typeof p.t === 'string' ? p.t : '');
      if (!text) return;
      this.chatCbs.forEach((cb) => cb(p.u, { t: text }));
    });
    ch.on('broadcast', { event: EV.emote }, ({ payload }) => {
      const p = payload as { u: string } & EmoteMsg;
      if (p.u === self.userId || typeof p.u !== 'string' || !isEmoteKind(p.k)) return;
      this.emoteCbs.forEach((cb) => cb(p.u, { k: p.k }));
    });
    ch.on('broadcast', { event: EV.neighborCheer }, ({ payload }) => {
      const p = payload as { u: string } & NeighborCheerMsg;
      const senderId = sanitizeNetworkUserId(p.u);
      const targetId = sanitizeNetworkUserId(p.to);
      if (!senderId || senderId === self.userId || targetId !== self.userId || !isNeighborCheerKind(p.k)) return;
      this.neighborCheerCbs.forEach((cb) => cb(senderId, { to: targetId, k: p.k }));
    });
    ch.on('broadcast', { event: EV.petMeet }, ({ payload }) => {
      const p = payload as { u: string } & PetMeetMsg;
      const senderId = sanitizeNetworkUserId(p.u);
      const targetId = sanitizeNetworkUserId(p.to);
      if (!senderId || senderId === self.userId || targetId !== self.userId || !isPetMeetKind(p.k)) return;
      this.petMeetCbs.forEach((cb) => cb(senderId, { to: targetId, k: p.k }));
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.retryMs = 1000;
        void ch.track({
          nickname: self.nickname, color: self.color, appearance: self.appearance,
          pet: self.pet ?? null, petAccessory: self.petAccessory ?? 'none', petName: self.petName ?? null,
          level: self.level ?? 1, badge: self.badge ?? null, profile: self.profile ?? null,
        } satisfies PresenceMeta);
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
      if (id === self.userId) continue;
      const meta = state[id]?.[0];
      if (!meta) continue;
      const peer: PeerState = {
        userId: id,
        nickname: meta.nickname,
        color: meta.color,
        appearance: normalizeAppearance(meta.appearance, meta.color),
        pet: meta.pet ?? null,
        petAccessory: isPetAccessoryId(meta.petAccessory) ? meta.petAccessory : 'none',
        petName: sanitizePetNickname(meta.petName),
        level: typeof meta.level === 'number' ? meta.level : 1,
        badge: typeof meta.badge === 'string' ? meta.badge.replace(/\s+/g, ' ').trim().slice(0, 24) : null,
        profile: normalizeVillageProfilePublic(meta.profile),
      };
      const serialized = JSON.stringify([
        meta.nickname, meta.appearance ?? meta.color, meta.pet ?? null, meta.petAccessory ?? 'none',
        sanitizePetNickname(meta.petName), meta.level ?? 1, meta.badge ?? null, normalizeVillageProfilePublic(meta.profile),
      ]);
      if (!this.known.has(id)) {
        this.known.add(id);
        this.lastMeta.set(id, serialized);
        this.joinCbs.forEach((cb) => cb(peer));
      } else if (this.lastMeta.get(id) !== serialized) {
        this.lastMeta.set(id, serialized);
        this.updateCbs.forEach((cb) => cb(peer)); // 외형·닉네임 변경
      }
    }
    for (const id of [...this.known]) {
      if (!current.has(id)) {
        this.known.delete(id);
        this.lastMeta.delete(id);
        this.leaveCbs.forEach((cb) => cb(id));
      }
    }
  }

  async updateSelf(self: PeerState): Promise<void> {
    this.self = self;
    if (this.channel) {
      await this.channel.track({
        nickname: self.nickname, color: self.color, appearance: self.appearance,
        pet: self.pet ?? null, petAccessory: self.petAccessory ?? 'none', petName: self.petName ?? null,
        level: self.level ?? 1, badge: self.badge ?? null, profile: self.profile ?? null,
      } satisfies PresenceMeta);
    }
  }

  onPeerUpdate(cb: (peer: PeerState) => void): void { this.updateCbs.push(cb); }

  private broadcast(event: string, payload: Record<string, unknown>): void {
    const self = this.self;
    // join 완료 전 send()는 REST 폴백으로 새어나가 유실·rate limit을 유발 → 소켓 준비 후에만 전송
    if (!this.channel || this.channel.state !== 'joined' || !self) return;
    void this.channel.send({ type: 'broadcast', event, payload: { u: self.userId, ...payload } });
  }

  sendPos(msg: PosMsg): void { this.broadcast(EV.pos, { x: msg.x, y: msg.y, f: msg.f }); }
  sendChat(msg: ChatMsg): void { this.broadcast(EV.chat, { t: msg.t }); }
  sendEmote(msg: EmoteMsg): void { this.broadcast(EV.emote, { k: msg.k }); }
  sendNeighborCheer(msg: NeighborCheerMsg): void {
    const targetId = sanitizeNetworkUserId(msg.to);
    if (targetId && isNeighborCheerKind(msg.k)) this.broadcast(EV.neighborCheer, { to: targetId, k: msg.k });
  }
  sendPetMeet(msg: PetMeetMsg): void {
    const targetId = sanitizeNetworkUserId(msg.to);
    if (targetId && isPetMeetKind(msg.k)) this.broadcast(EV.petMeet, { to: targetId, k: msg.k });
  }

  onPeerJoin(cb: (peer: PeerState) => void): void { this.joinCbs.push(cb); }
  onPeerLeave(cb: (userId: string) => void): void { this.leaveCbs.push(cb); }
  onPos(cb: (userId: string, msg: PosMsg, atMs: number) => void): void { this.posCbs.push(cb); }
  onChat(cb: (userId: string, msg: ChatMsg) => void): void { this.chatCbs.push(cb); }
  onEmote(cb: (userId: string, msg: EmoteMsg) => void): void { this.emoteCbs.push(cb); }
  onNeighborCheer(cb: (userId: string, msg: NeighborCheerMsg) => void): void { this.neighborCheerCbs.push(cb); }
  onPetMeet(cb: (userId: string, msg: PetMeetMsg) => void): void { this.petMeetCbs.push(cb); }
}
