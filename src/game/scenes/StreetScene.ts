import Phaser from 'phaser';
import { TILE, ZOOM, MAP_W, MAP_H } from '../config';
import { ZONES, SOLID_RECTS, SPAWN_TILE, buildCollision } from '../world/mapData';
import { tileToWorld, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { RemoteTrack } from '../entities/remoteMotion';
import { screenToTile } from '../input/pointer';
import { POS_HZ, INTERP_DELAY_MS, sanitizeChat, type EmoteKind } from '../../net/protocol';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { ChatInput } from '../../ui/chatInput';
import { EmoteWheel, EMOTE_EMOJI } from '../../ui/emoteWheel';

interface StreetData { peer: PeerState; adapter: NetworkAdapter | null }

interface Remote {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  track: RemoteTrack;
}

interface Bubble { c: Phaser.GameObjects.Container; owner: Phaser.GameObjects.Rectangle; until: number }

const WASD = [
  Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.D,
];

export class StreetScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Rectangle;
  private playerLabel!: Phaser.GameObjects.Text;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private marker!: Phaser.GameObjects.Rectangle;

  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private remotes = new Map<string, Remote>();
  private bubbles: Bubble[] = [];
  private chat: ChatInput | null = null;
  private emotes: EmoteWheel | null = null;
  private hint: HTMLDivElement | null = null;
  private lastSentAt = 0;
  private facing: 0 | 1 | 2 | 3 = 0;

  constructor() { super('street'); }

  init(data: Partial<StreetData>): void {
    this.peer = data.peer ?? { userId: 'offline', nickname: '게스트', color: 'e8c9a0' };
    this.adapter = data.adapter ?? null;
  }

  create(): void {
    this.grid = buildCollision();

    // 존 배경 블록
    for (const z of ZONES) {
      const p = tileToWorld(z.rect.x, z.rect.y);
      this.add.rectangle(p.x, p.y, z.rect.w * TILE, z.rect.h * TILE, z.color).setOrigin(0);
      this.add.text(p.x + 6, p.y + 6, z.name, { fontSize: '10px', color: '#ffffff' }).setAlpha(0.55);
    }
    // 건물(충돌) 블록
    for (const r of SOLID_RECTS) {
      const p = tileToWorld(r.x, r.y);
      this.add.rectangle(p.x, p.y, r.w * TILE, r.h * TILE, 0x241f1a).setOrigin(0);
    }

    // 클릭 마커
    this.marker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0)
      .setStrokeStyle(2, 0xf2d8a8).setVisible(false);

    // 로컬 플레이어 (placeholder 사각형 — Phase 5에서 스프라이트 교체)
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    this.player = this.add.rectangle(
      spawn.x + TILE / 2, spawn.y + TILE / 2, 16, 22, parseInt(this.peer.color, 16),
    );
    this.playerLabel = this.makeNameLabel(this.peer.nickname);

    // 입력
    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      const { tx, ty } = screenToTile(p.x, p.y, {
        scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
        width: cam.width, height: cam.height,
      });
      const w = tileToWorld(tx, ty);
      this.marker.setPosition(w.x, w.y).setVisible(true);
    });

    // 카메라 — 로컬 플레이어만 팔로우
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.setupUi();
    if (this.adapter) this.wireAdapter(this.adapter);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    const chatOpen = this.chat?.isOpen ?? false;
    const input: MoveInput = chatOpen
      ? { up: false, down: false, left: false, right: false }
      : {
          up: this.keys.W.isDown, down: this.keys.S.isDown,
          left: this.keys.A.isDown, right: this.keys.D.isDown,
        };
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.player.setPosition(next.x, next.y);
    this.updateFacing(input);

    // 위치 브로드캐스트 (POS_HZ 스로틀)
    const now = this.time.now;
    if (this.adapter && now - this.lastSentAt >= 1000 / POS_HZ) {
      this.lastSentAt = now;
      this.adapter.sendPos({ x: Math.round(next.x), y: Math.round(next.y), f: this.facing });
    }

    // 원격 플레이어 보간
    const renderT = Date.now() - INTERP_DELAY_MS;
    for (const r of this.remotes.values()) {
      const p = r.track.sample(renderT);
      if (p) {
        r.rect.setPosition(p.x, p.y);
        r.label.setPosition(p.x, p.y - 18);
      }
    }

    // 라벨·말풍선 위치 추종 및 만료 처리
    this.playerLabel.setPosition(this.player.x, this.player.y - 18);
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 32);
      return true;
    });
  }

  // --- 멀티플레이 배선 ---

  private wireAdapter(a: NetworkAdapter): void {
    a.onPeerJoin((peer) => this.addRemote(peer));
    a.onPeerLeave((id) => this.removeRemote(id));
    a.onPos((id, m, at) => this.remotes.get(id)?.track.push({ t: at, x: m.x, y: m.y }));
    a.onChat((id, m) => {
      const r = this.remotes.get(id);
      if (r) this.showBubble(r.rect, m.t);
    });
    a.onEmote((id, m) => {
      const r = this.remotes.get(id);
      if (r) this.showBubble(r.rect, EMOTE_EMOJI[m.k]);
    });
    void a.connect(this.peer);
  }

  private addRemote(peer: PeerState): void {
    if (this.remotes.has(peer.userId)) return;
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    const parsed = parseInt(peer.color, 16);
    const color = Number.isNaN(parsed) ? 0xe8c9a0 : parsed;
    const rect = this.add.rectangle(spawn.x + TILE / 2, spawn.y + TILE / 2, 16, 22, color);
    const label = this.makeNameLabel(peer.nickname);
    this.remotes.set(peer.userId, { rect, label, track: new RemoteTrack() });
  }

  private removeRemote(userId: string): void {
    const r = this.remotes.get(userId);
    if (!r) return;
    r.rect.destroy();
    r.label.destroy();
    this.remotes.delete(userId);
  }

  private updateFacing(input: MoveInput): void {
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
  }

  // --- UI (채팅·이모트·힌트) ---

  private setupUi(): void {
    this.chat = new ChatInput({
      onSend: (raw) => {
        const text = sanitizeChat(raw);
        if (!text) return;
        this.showBubble(this.player, text);
        this.adapter?.sendChat({ t: text });
      },
      onToggle: (open) => this.setGameKeysEnabled(!open),
    });
    this.emotes = new EmoteWheel((k: EmoteKind) => {
      this.showBubble(this.player, EMOTE_EMOJI[k]);
      this.adapter?.sendEmote({ k });
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => { if (!this.chat!.isOpen) this.chat!.open(); });
    kb.on('keydown-E', () => { if (!this.chat!.isOpen) this.emotes!.toggle(); });

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = 'WASD 이동 · Enter 채팅 · E 이모트';
    document.body.appendChild(this.hint);
  }

  /** 채팅 입력 중에는 Phaser 키보드를 끄고 WASD 캡처를 풀어 브라우저 기본 입력을 살린다 */
  private setGameKeysEnabled(enabled: boolean): void {
    const kb = this.input.keyboard!;
    kb.enabled = enabled;
    if (enabled) kb.addCapture(WASD);
    else kb.removeCapture(WASD);
    Object.values(this.keys).forEach((k) => k.reset());
  }

  private makeNameLabel(name: string): Phaser.GameObjects.Text {
    return this.add.text(0, 0, name, {
      fontSize: '9px', color: '#f2e8dc', backgroundColor: '#241f1a', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1);
  }

  private showBubble(owner: Phaser.GameObjects.Rectangle, text: string): void {
    // 같은 주인의 기존 말풍선은 교체
    this.bubbles = this.bubbles.filter((b) => {
      if (b.owner === owner) { b.c.destroy(); return false; }
      return true;
    });
    const t = this.add.text(0, 0, text, {
      fontSize: '10px', color: '#241f1a', wordWrap: { width: 140 }, align: 'center',
    }).setOrigin(0.5);
    const bounds = t.getBounds();
    const bg = this.add.rectangle(0, 0, bounds.width + 12, bounds.height + 8, 0xf2e8dc).setOrigin(0.5);
    const c = this.add.container(owner.x, owner.y - 32, [bg, t]);
    this.bubbles.push({ c, owner, until: this.time.now + 4000 });
  }

  private teardown(): void {
    void this.adapter?.disconnect();
    this.chat?.destroy();
    this.emotes?.destroy();
    this.hint?.remove();
  }
}
