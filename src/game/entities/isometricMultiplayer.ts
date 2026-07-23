import type Phaser from 'phaser';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import type { EmoteKind, NeighborCheerKind, PetMeetKind } from '../../net/protocol';
import { INTERP_DELAY_MS, POS_HZ } from '../../net/protocol';
import { TILE, TEXT_RES, UI_FONT } from '../config';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { PetFollower } from '../pets/petFollower';
import { PlayerAura } from './playerAura';
import { RemoteTrack } from './remoteMotion';
import { isoDepth, projectIsoWorld } from '../world/isometric';
import { ISO_VILLAGE_SPAWN, isIsoVillageWorldPosition } from '../world/isometricVillageMap';

interface IsoRemote {
  peer: PeerState;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
  track: RemoteTrack;
  charKey: string;
  lastFacing: 0 | 1 | 2 | 3;
  nickname: string;
  level: number;
  badge: string | null;
  pet: PetFollower;
  aura: PlayerAura;
  lastWorld: { x: number; y: number } | null;
}

/**
 * 아이소메트릭 월드 전용 Realtime 표현 계층.
 * 네트워크는 32px 논리 좌표를 유지하고 렌더 순간에만 64×32 화면 좌표로 투영한다.
 */
export class IsometricMultiplayer {
  private readonly remotes = new Map<string, IsoRemote>();
  private lastSentAt = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly adapter: NetworkAdapter | null,
    private readonly self: PeerState,
    private readonly callbacks: {
      onChat: (sprite: Phaser.GameObjects.Sprite, nickname: string, text: string) => void;
      onEmote: (sprite: Phaser.GameObjects.Sprite, kind: EmoteKind) => void;
      onSystem: (message: string) => void;
      onOnline: (nicknames: string[]) => void;
      onEncounter: (peer: PeerState) => void;
      onProfile: (peer: PeerState) => void;
      onNeighborCheer: (peer: PeerState, kind: NeighborCheerKind) => void;
      onPetMeet: (peer: PeerState, kind: PetMeetKind) => void;
    },
  ) {}

  connect(): void {
    const adapter = this.adapter;
    if (!adapter) { this.callbacks.onOnline([]); return; }
    adapter.clearListeners();
    adapter.onPeerJoin((peer) => this.addRemote(peer, true));
    adapter.onPeerUpdate((peer) => this.updateRemote(peer));
    adapter.onPeerLeave((userId) => this.removeRemote(userId, true));
    adapter.onPos((userId, message, atMs) => {
      if (!isIsoVillageWorldPosition(message.x, message.y)) return;
      const remote = this.remotes.get(userId);
      if (!remote) return;
      remote.track.push({ t: atMs, x: message.x, y: message.y });
      remote.lastFacing = message.f;
    });
    adapter.onChat((userId, message) => {
      const remote = this.remotes.get(userId);
      if (remote) this.callbacks.onChat(remote.sprite, remote.nickname, message.t);
    });
    adapter.onEmote((userId, message) => {
      const remote = this.remotes.get(userId);
      if (remote) this.callbacks.onEmote(remote.sprite, message.k);
    });
    adapter.onNeighborCheer((userId, message) => {
      const remote = this.remotes.get(userId);
      if (remote) this.callbacks.onNeighborCheer(remote.peer, message.k);
    });
    adapter.onPetMeet((userId, message) => {
      const remote = this.remotes.get(userId);
      if (remote) this.callbacks.onPetMeet(remote.peer, message.k);
    });
    void adapter.connect(this.self, 'iso-village');
  }

  update(delta: number, local: { x: number; y: number }, facing: 0 | 1 | 2 | 3): void {
    const now = this.scene.time.now;
    if (this.adapter && now - this.lastSentAt >= 1000 / POS_HZ) {
      this.lastSentAt = now;
      this.adapter.sendPos({ x: Math.round(local.x), y: Math.round(local.y), f: facing });
    }

    const renderAt = Date.now() - INTERP_DELAY_MS;
    for (const remote of this.remotes.values()) {
      const world = remote.track.sample(renderAt);
      if (!world) continue;
      const screen = projectIsoWorld(world.x, world.y);
      const moved = !remote.lastWorld
        || Math.abs(world.x - remote.lastWorld.x) + Math.abs(world.y - remote.lastWorld.y) > 0.4;
      remote.lastWorld = world;
      const depth = isoDepth({ tx: world.x / TILE, ty: world.y / TILE, w: 0, h: 0 }, 400);
      remote.sprite.setPosition(screen.x, screen.y).setDepth(depth);
      remote.label.setPosition(screen.x, screen.y - 43).setDepth(depth + 2);
      remote.ring.setPosition(screen.x, screen.y + 2).setDepth(depth - 100);
      remote.aura.follow(screen.x, screen.y);
      remote.aura.setDepth(depth - 6);
      remote.pet.update(screen.x, screen.y, delta);
      remote.pet.setDepth(depth - 5);
      const animation = `${remote.charKey}-walk-${remote.lastFacing}`;
      if (moved) {
        if (remote.sprite.anims.currentAnim?.key !== animation || !remote.sprite.anims.isPlaying) remote.sprite.play(animation);
      } else if (remote.sprite.anims.isPlaying) {
        remote.sprite.stop();
        remote.sprite.setFrame(remote.lastFacing * FRAMES_PER_DIR);
      }
    }
  }

  sendChat(text: string): void { this.adapter?.sendChat({ t: text }); }
  sendEmote(kind: EmoteKind): void { this.adapter?.sendEmote({ k: kind }); }
  sendNeighborCheer(userId: string, kind: NeighborCheerKind): boolean {
    if (!this.adapter) return false;
    this.adapter.sendNeighborCheer({ to: userId, k: kind });
    return true;
  }
  sendPetMeet(userId: string, kind: PetMeetKind): boolean {
    if (!this.adapter) return false;
    this.adapter.sendPetMeet({ to: userId, k: kind });
    return true;
  }
  nicknames(): string[] { return [...this.remotes.values()].map((remote) => remote.nickname); }

  /** 개발 화면 회귀 검증용. 실제 접속 흐름에서는 사용하지 않는다. */
  previewPeer(peer: PeerState, worldX: number, worldY: number): void {
    if (!isIsoVillageWorldPosition(worldX, worldY)) return;
    this.addRemote(peer, false);
    const remote = this.remotes.get(peer.userId);
    remote?.track.push({ t: Date.now(), x: worldX, y: worldY });
    this.callbacks.onOnline(this.nicknames());
  }

  /** 개발 화면에서 원격 채팅 말풍선과 피드를 함께 검증한다. */
  previewChat(userId: string, text: string): void {
    const remote = this.remotes.get(userId);
    if (remote) this.callbacks.onChat(remote.sprite, remote.nickname, text);
  }

  previewNeighborCheer(userId: string, kind: NeighborCheerKind): void {
    const remote = this.remotes.get(userId);
    if (remote) this.callbacks.onNeighborCheer(remote.peer, kind);
  }

  previewPetMeet(userId: string, kind: PetMeetKind): void {
    const remote = this.remotes.get(userId);
    if (remote) this.callbacks.onPetMeet(remote.peer, kind);
  }

  private addRemote(peer: PeerState, announce: boolean): void {
    if (peer.userId === this.self.userId || this.remotes.has(peer.userId)) return;
    const spawnWorld = {
      x: (ISO_VILLAGE_SPAWN.tx + 0.5) * TILE,
      y: (ISO_VILLAGE_SPAWN.ty + 0.5) * TILE,
    };
    const spawn = projectIsoWorld(spawnWorld.x, spawnWorld.y);
    const charKey = ensureCharacter(this.scene, peer.appearance);
    const depth = isoDepth({ tx: ISO_VILLAGE_SPAWN.tx, ty: ISO_VILLAGE_SPAWN.ty, w: 1, h: 1 }, 400);
    const ring = this.scene.add.ellipse(spawn.x, spawn.y + 2, 28, 10, 0x5aa0e0, 0.48)
      .setStrokeStyle(2, 0x2a5a8a, 0.95).setDepth(depth - 100);
    const sprite = this.scene.add.sprite(spawn.x, spawn.y, charKey, 0)
      .setOrigin(0.5, 0.78).setDepth(depth).setInteractive({ useHandCursor: true });
    const level = peer.level ?? 1;
    const badge = peer.badge ?? null;
    const label = this.scene.add.text(spawn.x, spawn.y - 43, this.labelText(peer.nickname, level, badge), {
      fontFamily: UI_FONT, fontSize: '9px', color: '#eef7ff', backgroundColor: '#2a5a8add',
      align: 'center', padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(depth + 2);
    const pet = new PetFollower(this.scene, peer.pet ?? null, peer.petAccessory ?? 'none', peer.petName ?? null);
    const aura = new PlayerAura(this.scene, depth - 6);
    aura.setLevel(level);
    this.remotes.set(peer.userId, {
      peer, sprite, label, ring, track: new RemoteTrack(), charKey, lastFacing: 0,
      nickname: peer.nickname, level, badge, pet, aura, lastWorld: null,
    });
    sprite.on('pointerdown', () => {
      const current = this.remotes.get(peer.userId);
      if (current) this.callbacks.onProfile(current.peer);
    });
    if (announce) {
      this.callbacks.onSystem(`${peer.nickname}님이 아이소메트릭 마을에 왔어요.`);
      this.callbacks.onEncounter(peer);
    }
    this.callbacks.onOnline(this.nicknames());
  }

  private updateRemote(peer: PeerState): void {
    const remote = this.remotes.get(peer.userId);
    if (!remote) { this.addRemote(peer, false); return; }
    remote.charKey = ensureCharacter(this.scene, peer.appearance);
    remote.peer = peer;
    remote.sprite.stop().setTexture(remote.charKey, remote.lastFacing * FRAMES_PER_DIR);
    remote.nickname = peer.nickname;
    remote.level = peer.level ?? remote.level;
    remote.badge = peer.badge ?? null;
    remote.label.setText(this.labelText(remote.nickname, remote.level, remote.badge));
    remote.pet.setSpecies(peer.pet ?? null, peer.petAccessory ?? 'none', peer.petName ?? null);
    remote.aura.setLevel(remote.level);
    this.callbacks.onOnline(this.nicknames());
  }

  private removeRemote(userId: string, announce: boolean): void {
    const remote = this.remotes.get(userId);
    if (!remote) return;
    remote.sprite.destroy();
    remote.label.destroy();
    remote.ring.destroy();
    remote.pet.destroy();
    remote.aura.destroy();
    this.remotes.delete(userId);
    if (announce) this.callbacks.onSystem(`${remote.nickname}님이 마을을 나갔어요.`);
    this.callbacks.onOnline(this.nicknames());
  }

  private labelText(nickname: string, level: number, badge: string | null): string {
    return `${badge ? `◆ ${badge}\n` : ''}● ${nickname}  Lv.${level}`;
  }

  destroy(): void {
    this.adapter?.clearListeners();
    void this.adapter?.disconnect();
    for (const userId of [...this.remotes.keys()]) this.removeRemote(userId, false);
  }
}
