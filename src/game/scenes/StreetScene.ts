import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM, MAP_W, MAP_H, TEXT_RES } from '../config';
import {
  ZONES, SPAWN_TILE, HOUSE_DOORS, SHOP_DOORS, CAFE_DOORS, INTERIOR_DOORS,
  BUSKING_SPOT, OMOK_SPOT, BOARD_SPOT, CLAW_SPOT, PHOTO_SPOT, BUNGEO_SPOT, buildCollision,
} from '../world/mapData';
import { ClawPanel } from '../../ui/clawPanel';
import { NpcCrowd } from '../entities/npcAmbient';
import { OmokPanel } from '../../ui/omokPanel';
import { QuestPanel } from '../../ui/questPanel';
import { DAILY_QUESTS } from '../quests';
import { ShopPanel } from '../../ui/shopPanel';
import { CafePanel } from '../../ui/cafePanel';
import { BuskingPanel } from '../../ui/buskingPanel';
import { phaseForHour, seoulHour } from '../world/timeOfDay';
import { fetchCoins, claimDaily, buyItem, sellItem } from '../../db/economyApi';
import { fetchInventory } from '../../db/roomsApi';
import { buildStreetArt } from '../art/streetArt';
import { BUILDING_TEXTURES, PROP_ASSETS } from '../art/assetManifest';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { DEFAULT_APPEARANCE, type Appearance } from '../art/appearance';
import { CustomizePanel } from '../../ui/customizePanel';
import { saveAppearance, linkIdCode } from '../../ui/loginPanel';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { fetchRooms, claimRoom, grantStarterOnce, type RoomInfo } from '../../db/roomsApi';
import { tileToWorld, worldToTile, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { RemoteTrack } from '../entities/remoteMotion';
import { screenToTile } from '../input/pointer';
import { POS_HZ, INTERP_DELAY_MS, sanitizeChat, type EmoteKind } from '../../net/protocol';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { ChatInput } from '../../ui/chatInput';
import { EmoteWheel, EMOTE_EMOJI } from '../../ui/emoteWheel';
import { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { BagPanel } from '../../ui/bagPanel';
import { CollectionPanel } from '../../ui/collectionPanel';
import { MapPanel } from '../../ui/mapPanel';
import { ResidentsPanel } from '../../ui/residentsPanel';
import { RankingPanel } from '../../ui/rankingPanel';
import { fetchRanking } from '../../db/rankingApi';
import { ActionMotions, IdleBreath } from '../entities/actionMotion';
import { ResidentNpcs } from '../entities/npcResidents';
import { RESIDENTS } from '../residents/residents';
import { audio } from '../audio';

interface StreetData {
  peer: PeerState;
  adapter: NetworkAdapter | null;
  /** 방에서 나올 때 등 특정 위치로 스폰 (기본: 역 광장) */
  spawnTile?: { tx: number; ty: number };
}

interface Remote {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  track: RemoteTrack;
  charKey: string;
  lastF: 0 | 1 | 2 | 3;
}

interface Bubble { c: Phaser.GameObjects.Container; owner: Phaser.GameObjects.Sprite; until: number }

const WASD = [
  Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.D,
];

export class StreetScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private remotes = new Map<string, Remote>();
  private bubbles: Bubble[] = [];
  private chat: ChatInput | null = null;
  private emotes: EmoteWheel | null = null;
  private customize: CustomizePanel | null = null;
  private shop: ShopPanel | null = null;
  private cafe: CafePanel | null = null;
  private busking: BuskingPanel | null = null;
  private touch: TouchControls | null = null;
  private omok: OmokPanel | null = null;
  private quests: QuestPanel | null = null;
  private npcs: NpcCrowd | null = null;
  private tintOverlay: Phaser.GameObjects.Rectangle | null = null;
  private onBuskingTile = false;
  private onOmokTile = false;
  private onBoardTile = false;
  private onClawTile = false;
  private onPhotoTile = false;
  private onBungeoTile = false;
  private claw: ClawPanel | null = null;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private forestMs = 0;
  private hud: GameHud | null = null;
  private questStore!: QuestStore;
  private bag: BagPanel | null = null;
  private dex: CollectionPanel | null = null;
  private mapPanel: MapPanel | null = null;
  private residentsPanel: ResidentsPanel | null = null;
  private rankingPanel: RankingPanel | null = null;
  private residents: ResidentNpcs | null = null;
  private motions: ActionMotions | null = null;
  private idleBreath: IdleBreath | null = null;
  private coins = 0;
  private charKey = '';
  private hint: HTMLDivElement | null = null;
  private lastSentAt = 0;
  private facing: 0 | 1 | 2 | 3 = 0;
  private sb: SupabaseClient | null = null;
  private rooms: RoomInfo[] = [];
  private spawnTile = SPAWN_TILE;
  private entering = false;
  private onShopTile = false;
  private onCafeTile = false;

  constructor() { super('street'); }

  preload(): void {
    // AI 아트 자산 — 404여도 게임은 프로시저럴 폴백으로 계속
    for (const a of [...BUILDING_TEXTURES, ...PROP_ASSETS]) {
      if (!this.textures.exists(a.key)) this.load.image(a.key, a.url);
    }
    this.load.on('loaderror', (file: { key: string }) => {
      console.warn('[홍대마을] 자산 로드 실패(프로시저럴 폴백):', file.key);
    });
  }

  init(data: Partial<StreetData>): void {
    this.peer = data.peer
      ?? { userId: 'offline', nickname: '게스트', color: 'e8c9a0', appearance: DEFAULT_APPEARANCE };
    this.adapter = data.adapter ?? null;
    this.sb = (this.registry.get('sb') as SupabaseClient | undefined) ?? null;
    this.questStore = this.registry.get('quests') as QuestStore;
    this.remotes = new Map();
    this.bubbles = [];
    this.spawnTile = data.spawnTile ?? SPAWN_TILE;
    this.entering = false;
  }

  create(): void {
    this.grid = buildCollision();

    // 거리 아트 (바닥·건물·문·간판·소품·바닥 데칼)
    buildStreetArt(this, MAP_W, MAP_H, this.grid);
    for (const z of ZONES) {
      const p = tileToWorld(z.rect.x, z.rect.y);
      this.add.text(p.x + 8, p.y + 8, z.name, {
        fontSize: '11px', color: '#ffffff', resolution: TEXT_RES,
      }).setAlpha(0.45).setDepth(3);
    }
    for (const d of HOUSE_DOORS) {
      const p = tileToWorld(d.tx, d.ty);
      this.add.text(p.x + TILE / 2, p.y - 5, String(d.roomId), {
        fontSize: '9px', color: '#f2d8a8', resolution: TEXT_RES,
      }).setOrigin(0.5).setAlpha(0.9).setDepth(3);
    }
    if (this.sb) void fetchRooms(this.sb).then((r) => { this.rooms = r; });

    // 로컬 플레이어 (커스터마이징 외형)
    const spawn = tileToWorld(this.spawnTile.tx, this.spawnTile.ty);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, this.charKey, 0)
      .setOrigin(0.5, 0.66).setDepth(10); // 발이 충돌 박스 바닥에 오게
    this.playerLabel = this.makeNameLabel(this.peer.nickname).setDepth(11);

    // 입력
    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    // 집 문을 클릭하면 입장 (이동은 WASD·조이스틱 — 오해를 주던 클릭 마커는 제거, P2-2)
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      const { tx, ty } = screenToTile(p.x, p.y, {
        scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
        width: cam.width, height: cam.height,
      });
      const door = HOUSE_DOORS.find((d) => d.tx === tx && d.ty === ty);
      if (door) void this.enterDoor(door.roomId);
    });

    // 카메라 — 로컬 플레이어만 팔로우 (좁은 화면은 줌을 낮춰 시야 확보)
    const cam = this.cameras.main;
    cam.setZoom(window.innerWidth < 700 ? 1.5 : ZOOM);
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.setupUi();
    if (this.adapter) this.wireAdapter(this.adapter);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    const chatOpen = this.chat?.isOpen ?? false;
    const t = this.touch?.getInput();
    const input: MoveInput = chatOpen
      ? { up: false, down: false, left: false, right: false }
      : {
          up: this.keys.W.isDown || !!t?.up,
          down: this.keys.S.isDown || !!t?.down,
          left: this.keys.A.isDown || !!t?.left,
          right: this.keys.D.isDown || !!t?.right,
        };
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.player.setPosition(next.x, next.y);
    this.updateFacing(input);

    // 걷기 애니메이션
    const moving = input.up || input.down || input.left || input.right;
    const animKey = `${this.charKey}-walk-${this.facing}`;
    if (moving) {
      if (this.player.anims.currentAnim?.key !== animKey || !this.player.anims.isPlaying) {
        this.player.play(animKey);
      }
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(this.facing * FRAMES_PER_DIR);
    }

    // 문 타일을 밟으면 입장 (클릭 없이 걸어서 들어가기)
    if (!this.entering) {
      const tile = worldToTile(next.x, next.y);
      const door = HOUSE_DOORS.find((d) => d.tx === tile.tx && d.ty === tile.ty);
      if (door) void this.enterDoor(door.roomId);
      else {
        // 상점·카페 문은 "밟는 순간" 1회만 열림 (서 있는 동안 재오픈 방지)
        const onShop = SHOP_DOORS.some((d) => d.tx === tile.tx && d.ty === tile.ty);
        if (onShop && !this.onShopTile && this.shop && !this.shop.isOpen) void this.openShop();
        this.onShopTile = onShop;
        const onCafe = CAFE_DOORS.some((d) => d.tx === tile.tx && d.ty === tile.ty);
        if (onCafe && !this.onCafeTile && this.cafe && !this.cafe.isOpen) this.cafe.open();
        this.onCafeTile = onCafe;
        const onBusking = tile.tx === BUSKING_SPOT.tx && tile.ty === BUSKING_SPOT.ty;
        if (onBusking && !this.onBuskingTile && this.busking && !this.busking.isOpen) this.busking.open();
        this.onBuskingTile = onBusking;
        const onOmok = tile.tx === OMOK_SPOT.tx && tile.ty === OMOK_SPOT.ty;
        if (onOmok && !this.onOmokTile && this.omok && !this.omok.isOpen) this.omok.open();
        this.onOmokTile = onOmok;
        const onClaw = tile.tx === CLAW_SPOT.tx && tile.ty === CLAW_SPOT.ty;
        if (onClaw && !this.onClawTile && this.claw && !this.claw.isOpen && !this.anyPanelOpen()) this.claw.open();
        this.onClawTile = onClaw;
        const onPhoto = tile.tx === PHOTO_SPOT.tx && tile.ty === PHOTO_SPOT.ty;
        if (onPhoto && !this.onPhotoTile) { this.takePhoto(); }
        this.onPhotoTile = onPhoto;
        const onBungeo = tile.tx === BUNGEO_SPOT.tx && tile.ty === BUNGEO_SPOT.ty;
        if (onBungeo && !this.onBungeoTile) { this.eatBungeo(); }
        this.onBungeoTile = onBungeo;
        const interiorDoor = INTERIOR_DOORS.find((d) => d.tx === tile.tx && d.ty === tile.ty);
        if (interiorDoor && !this.entering) {
          this.entering = true;
          audio.playSe('door');
          this.scene.start('interior', { shop: interiorDoor.shop, peer: this.peer, adapter: this.adapter });
          return;
        }
        const onBoard = tile.tx === BOARD_SPOT.tx && tile.ty === BOARD_SPOT.ty;
        if (onBoard && !this.onBoardTile && this.quests && !this.quests.isOpen) {
          this.quests.open(this.questStore.progress(), this.questStore.get().claimed);
        }
        this.onBoardTile = onBoard;
      }
    }

    // 숲길 산책 퀘스트 (초 단위 누적)
    {
      const forest = ZONES[0]!.rect;
      const t = worldToTile(next.x, next.y);
      if (t.tx >= forest.x && t.tx < forest.x + forest.w && t.ty >= forest.y && t.ty < forest.y + forest.h) {
        this.forestMs += delta;
        if (this.forestMs >= 1000) {
          this.forestMs -= 1000;
          this.incQuest('q_forest');
        }
      }
    }

    // NPC 무리 + 이름 있는 주민 (근접 인사)
    this.npcs?.update(delta);
    this.residents?.update(next.x, next.y);
    this.idleBreath?.set(!moving && !this.anyPanelOpen());

    // 위치 브로드캐스트 (POS_HZ 스로틀)
    const now = this.time.now;
    if (this.adapter && now - this.lastSentAt >= 1000 / POS_HZ) {
      this.lastSentAt = now;
      this.adapter.sendPos({ x: Math.round(next.x), y: Math.round(next.y), f: this.facing });
    }

    // 원격 플레이어 보간 + 걷기 애니메이션
    const renderT = Date.now() - INTERP_DELAY_MS;
    for (const r of this.remotes.values()) {
      const p = r.track.sample(renderT);
      if (p) {
        const moved = Math.abs(p.x - r.sprite.x) + Math.abs(p.y - r.sprite.y) > 0.4;
        r.sprite.setPosition(p.x, p.y);
        r.label.setPosition(p.x, p.y - 26);
        const ak = `${r.charKey}-walk-${r.lastF}`;
        if (moved) {
          if (r.sprite.anims.currentAnim?.key !== ak || !r.sprite.anims.isPlaying) r.sprite.play(ak);
        } else if (r.sprite.anims.isPlaying) {
          r.sprite.stop();
          r.sprite.setFrame(r.lastF * FRAMES_PER_DIR);
        }
      }
    }

    // 라벨·말풍선 위치 추종 및 만료 처리
    this.playerLabel.setPosition(this.player.x, this.player.y - 26);
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 38);
      return true;
    });
  }

  /** 문 진입(밟기/클릭): 빈 방이면 선착순 입주(+시작 가구), 내 방이면 꾸미기, 남의 방이면 구경 */
  private async enterDoor(roomId: number): Promise<void> {
    if (this.entering) return;
    this.entering = true;
    audio.playSe('door');
    let isOwner = false;
    if (!this.sb) {
      isOwner = true; // 오프라인: 모든 방을 주인 모드로 (로컬 전용)
    } else {
      this.rooms = await fetchRooms(this.sb);
      const room = this.rooms.find((r) => r.id === roomId);
      if (!room) { this.entering = false; return; }
      if (room.ownerId === this.peer.userId) {
        isOwner = true;
      } else if (room.ownerId === null) {
        const claimed = await claimRoom(this.sb, roomId, this.peer.userId);
        if (claimed) {
          await grantStarterOnce(this.sb, this.peer.userId);
          isOwner = true;
        } else {
          this.entering = false;
          return this.enterDoor(roomId); // 레이스에서 밀림 → 최신 상태로 재시도(방문 모드)
        }
      }
    }
    this.scene.start('room', { roomId, isOwner, peer: this.peer, adapter: this.adapter });
  }

  // --- 멀티플레이 배선 ---

  private wireAdapter(a: NetworkAdapter): void {
    a.clearListeners(); // 씬 재진입 시 콜백 중복 방지
    a.onPeerJoin((peer) => this.addRemote(peer));
    a.onPeerUpdate((peer) => {
      const r = this.remotes.get(peer.userId);
      if (!r) return;
      r.charKey = ensureCharacter(this, peer.appearance);
      r.sprite.stop();
      r.sprite.setTexture(r.charKey, r.lastF * FRAMES_PER_DIR);
      r.label.setText(peer.nickname);
    });
    a.onPeerLeave((id) => this.removeRemote(id));
    a.onPos((id, m, at) => {
      const r = this.remotes.get(id);
      if (!r) return;
      r.track.push({ t: at, x: m.x, y: m.y });
      r.lastF = m.f;
    });
    a.onChat((id, m) => {
      const r = this.remotes.get(id);
      if (r) this.showBubble(r.sprite, m.t);
    });
    a.onEmote((id, m) => {
      const r = this.remotes.get(id);
      if (r) this.showBubble(r.sprite, EMOTE_EMOJI[m.k]);
    });
    void a.connect(this.peer);
  }

  private addRemote(peer: PeerState): void {
    if (this.remotes.has(peer.userId)) return;
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    const charKey = ensureCharacter(this, peer.appearance);
    const sprite = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, charKey, 0)
      .setOrigin(0.5, 0.66).setDepth(10);
    const label = this.makeNameLabel(peer.nickname).setDepth(11);
    this.remotes.set(peer.userId, { sprite, label, track: new RemoteTrack(), charKey, lastF: 0 });
  }

  private removeRemote(userId: string): void {
    const r = this.remotes.get(userId);
    if (!r) return;
    this.bubbles = this.bubbles.filter((b) => {
      if (b.owner === r.sprite) { b.c.destroy(); return false; }
      return true;
    });
    r.sprite.destroy();
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
      this.incQuest('q_emote');
    });

    this.customize = new CustomizePanel(this.peer.appearance, {
      onChange: (a) => this.applyAppearance(a, false),
      onSave: (a) => this.applyAppearance(a, true),
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onLinkId: this.sb ? (id, code) => linkIdCode(this.sb!, id, code) : undefined,
    });

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => { if (!this.chat!.isOpen) this.chat!.open(); });
    kb.on('keydown-E', () => { if (!this.chat!.isOpen) this.emotes!.toggle(); });
    kb.on('keydown-C', () => {
      if (!this.chat!.isOpen && !this.customize!.isOpen) this.customize!.open(this.peer.appearance);
    });
    kb.on('keydown-B', () => void this.openBag());
    kb.on('keydown-G', () => void this.openDex());
    kb.on('keydown-M', () => this.openMap());
    kb.on('keydown-Q', () => this.openQuests());
    kb.on('keydown-R', () => this.openRanking());
    kb.on('keydown-P', () => this.openResidents());
    // ESC로 열린 패널 닫기 — 패널이 Phaser 키보드를 끄므로 document 레벨에서 처리
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (this.closeTopPanel()) e.stopPropagation(); }
    };
    document.addEventListener('keydown', this.escHandler);

    this.shop = new ShopPanel({
      buyEnabled: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onBuy: (itemId) => void this.handleBuy(itemId),
      onSell: (itemId) => void this.handleSell(itemId),
    });
    // 활동 패널 — 여는 동안 캐릭터가 그 행동을 연상시키는 모션을 한다
    this.cafe = new CafePanel({
      onToggle: (open) => {
        this.setGameKeysEnabled(!open);
        if (open) this.motions!.play(this.player, 'cafe');
        else this.motions!.stop(this.player);
      },
      onComplete: () => void this.handleCafeComplete(),
    });
    this.busking = new BuskingPanel({
      onToggle: (open) => {
        this.setGameKeysEnabled(!open);
        if (open) this.motions!.play(this.player, 'busking');
        else this.motions!.stop(this.player);
      },
      onComplete: () => void this.handleBuskingComplete(),
    });

    this.omok = new OmokPanel({
      onToggle: (open) => {
        this.setGameKeysEnabled(!open);
        if (open) this.motions!.play(this.player, 'omok');
        else this.motions!.stop(this.player);
      },
      onWin: () => void this.handleOmokWin(),
    });
    this.claw = new ClawPanel(this.peer.userId, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onWin: (prize) => { this.showBubble(this.player, `${prize} 획득! 🎉`); this.motions?.play(this.player, 'win'); },
    });
    this.quests = new QuestPanel({
      online: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onClaim: (questId) => void this.handleQuestClaim(questId),
    });

    // 활동 스팟 표시 — 통통 튀는 아이콘으로 "여기서 뭔가 된다"를 알린다
    const spot = (t: { tx: number; ty: number }, emoji: string, label: string) => {
      const w = tileToWorld(t.tx, t.ty);
      const icon = this.add.text(w.x + TILE / 2, w.y - 4, emoji, { fontSize: '16px' })
        .setOrigin(0.5, 1).setDepth(12).setAlpha(0.95);
      this.add.text(w.x + TILE / 2, w.y + TILE + 2, label, {
        fontSize: '8px', color: '#fff2d8', backgroundColor: '#7a5220',
        padding: { x: 3, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 0).setDepth(12).setAlpha(0.9);
      this.tweens.add({ targets: icon, y: w.y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    };
    spot(BUSKING_SPOT, '🎸', '버스킹');
    spot(OMOK_SPOT, '⚫', '오목');
    spot(BOARD_SPOT, '📋', '퀘스트');
    spot(CLAW_SPOT, '🕹️', '인형뽑기');
    spot(PHOTO_SPOT, '📸', '네컷');
    spot(BUNGEO_SPOT, '🐟', '붕어빵');

    // 마을을 걸어다니는 행인들 (스펙 §2 NPC 앰비언트)
    this.npcs = new NpcCrowd(this, this.grid, (sprite, text) => this.showBubble(sprite, text));

    // 실시간 시간대 틴트 (서울 기준, 1분마다 갱신 — 스펙 §2)
    this.tintOverlay = this.add.rectangle(0, 0, MAP_W * TILE, MAP_H * TILE, 0x000000, 0)
      .setOrigin(0).setDepth(13);
    this.applyTimeOfDay();
    this.time.addEvent({ delay: 60_000, loop: true, callback: () => this.applyTimeOfDay() });

    // 행동 모션 + 이름 있는 주민 NPC
    this.motions = new ActionMotions(this);
    this.idleBreath = new IdleBreath(this, this.player);
    this.residents = new ResidentNpcs(this, this.peer.userId, {
      onBubble: (s, t) => this.showBubble(s, t),
      onGreet: (s) => this.motions!.play(s, 'greet'),
    });

    // 게임형 HUD (하트·코인·시계·하단 아이콘 바) + 패널들
    this.bag = new BagPanel({ online: !!this.sb, onToggle: (o) => this.setGameKeysEnabled(!o) });
    this.dex = new CollectionPanel(this.peer.userId, { onToggle: (o) => this.setGameKeysEnabled(!o) });
    this.mapPanel = new MapPanel({
      onToggle: (o) => this.setGameKeysEnabled(!o),
      getPlayerTile: () => worldToTile(this.player.x, this.player.y),
    });
    this.residentsPanel = new ResidentsPanel(this.bakePortraits(), {
      onToggle: (o) => this.setGameKeysEnabled(!o),
    });
    this.rankingPanel = new RankingPanel({
      online: !!this.sb,
      myId: this.peer.userId,
      onToggle: (o) => this.setGameKeysEnabled(!o),
      fetchRows: () => fetchRanking(this.sb!),
    });
    // HUD는 세션 싱글턴 (main 생성) — 거리 진입 시 액션 바만 장착
    this.hud = this.registry.get('hud') as GameHud;
    this.hud.mountActions({
      onBag: () => void this.openBag(),
      onDex: () => void this.openDex(),
      onMap: () => this.openMap(),
      onQuest: () => this.openQuests(),
      onResidents: () => this.openResidents(),
      onRanking: () => this.openRanking(),
      onCustomize: () => { if (!this.chat!.isOpen && !this.customize!.isOpen) this.customize!.open(this.peer.appearance); },
      onChat: () => { if (!this.chat!.isOpen) this.chat!.open(); },
      onEmote: () => { if (!this.chat!.isOpen) this.emotes!.toggle(); },
    });
    this.refreshHearts();
    void this.initCoins();

    // 모바일 터치 컨트롤 — D-패드만 (액션은 HUD 바로 통합)
    if (isTouchDevice()) this.touch = new TouchControls();

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = isTouchDevice()
      ? '패드로 이동 · 문을 밟으면 입장'
      : 'WASD 이동 · Enter 채팅 · 문을 밟으면 입장';
    document.body.appendChild(this.hint);
  }

  // --- HUD 패널 열기 (동시에 하나만) ---

  private anyPanelOpen(): boolean {
    return (this.chat?.isOpen ?? false) || (this.customize?.isOpen ?? false)
      || (this.bag?.isOpen ?? false) || (this.dex?.isOpen ?? false)
      || (this.mapPanel?.isOpen ?? false) || (this.quests?.isOpen ?? false)
      || (this.shop?.isOpen ?? false) || (this.residentsPanel?.isOpen ?? false)
      || (this.rankingPanel?.isOpen ?? false) || (this.claw?.isOpen ?? false);
  }

  /** ESC — 열린 패널 중 하나를 닫는다. 닫았으면 true */
  private closeTopPanel(): boolean {
    const closers: Array<{ open: boolean; close: () => void }> = [
      { open: this.bag?.isOpen ?? false, close: () => this.bag!.close() },
      { open: this.dex?.isOpen ?? false, close: () => this.dex!.close() },
      { open: this.mapPanel?.isOpen ?? false, close: () => this.mapPanel!.close() },
      { open: this.residentsPanel?.isOpen ?? false, close: () => this.residentsPanel!.close() },
      { open: this.rankingPanel?.isOpen ?? false, close: () => this.rankingPanel!.close() },
      { open: this.quests?.isOpen ?? false, close: () => this.quests!.close() },
      { open: this.shop?.isOpen ?? false, close: () => this.shop!.close() },
      { open: this.claw?.isOpen ?? false, close: () => this.claw!.close() },
      { open: this.omok?.isOpen ?? false, close: () => this.omok!.close() },
      { open: this.cafe?.isOpen ?? false, close: () => this.cafe!.close() },
      { open: this.busking?.isOpen ?? false, close: () => this.busking!.close() },
      { open: this.customize?.isOpen ?? false, close: () => this.customize!.close() },
    ];
    const top = closers.find((c) => c.open);
    if (top) { top.close(); return true; }
    return false;
  }

  /** 네컷 포토부스 — 프로필 인사 연출 (실시간 시간대 문구) */
  private takePhoto(): void {
    const slot = ['📸 인생네컷 찰칵!', '📸 갬성샷 득템~', '📸 최고의 한 컷 ✨'];
    this.showBubble(this.player, slot[Math.floor(Date.now() / 1000) % slot.length]!);
    this.motions?.play(this.player, 'greet');
    audio.playSe('success');
  }

  /** 붕어빵 포차 — 따끈한 간식 (하트 회복 연출) */
  private eatBungeo(): void {
    this.showBubble(this.player, '🐟 붕어빵 호호… 따끈해!');
    this.motions?.play(this.player, 'coin');
  }

  private openResidents(): void {
    if (this.anyPanelOpen()) return;
    this.residentsPanel!.open(this.residents!.getTrust());
  }

  private openRanking(): void {
    if (this.anyPanelOpen()) return;
    const trust = this.residents!.getTrust();
    const trustSum = Object.values(trust).reduce((s, e) => s + e.v, 0);
    this.rankingPanel!.open({
      coins: this.coins,
      hearts: this.questDoneCount(),
      dexFound: this.dex!.foundCount,
      trustSum,
    });
  }

  /** 주민 초상 — 스프라이트 시트 정면 1프레임을 확대해 dataURL로 굽는다 */
  private bakePortraits(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const def of RESIDENTS) {
      const key = ensureCharacter(this, def.appearance);
      const src = this.textures.get(key).getSourceImage();
      if (!(src instanceof HTMLCanvasElement) && !(src instanceof HTMLImageElement)) continue;
      const c = document.createElement('canvas');
      c.width = 48; c.height = 64;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, 24, 32, 0, 0, 48, 64);
      out[def.id] = c.toDataURL();
    }
    return out;
  }

  private async openBag(): Promise<void> {
    if (this.anyPanelOpen()) return;
    if (this.sb) this.shopCounts = await fetchInventory(this.sb, this.peer.userId);
    this.bag!.open(this.shopCounts);
  }

  private async openDex(): Promise<void> {
    if (this.anyPanelOpen()) return;
    if (this.sb) this.shopCounts = await fetchInventory(this.sb, this.peer.userId);
    this.dex!.open(this.shopCounts);
  }

  private openMap(): void {
    if (this.anyPanelOpen()) return;
    this.mapPanel!.open();
  }

  private openQuests(): void {
    if (this.anyPanelOpen()) return;
    this.quests!.open(this.questStore.progress(), this.questStore.get().claimed);
  }

  private questDoneCount(): number {
    return this.questStore.doneCount();
  }

  /** 하트 = 오늘의 퀘스트 달성 수 */
  private refreshHearts(): void {
    this.hud?.setHearts(this.questStore.doneCount(), DAILY_QUESTS.length);
  }

  private setCoins(v: number): void {
    this.coins = v;
    this.hud?.setCoins(v);
    this.shop?.setCoins(v);
  }

  private async initCoins(): Promise<void> {
    if (!this.sb) { this.setCoins(0); return; }
    this.setCoins(await fetchCoins(this.sb, this.peer.userId));
    const claimed = await claimDaily(this.sb);
    if (claimed !== null) {
      this.setCoins(claimed);
      this.showBubble(this.player, '출석 보상 +100 🪙');
      this.motions?.play(this.player, 'coin');
    }
  }

  private shopCounts = new Map<string, number>();

  private async openShop(): Promise<void> {
    if (this.sb) this.shopCounts = await fetchInventory(this.sb, this.peer.userId);
    this.shop!.open(this.coins, this.shopCounts);
  }

  private async handleBuy(itemId: string): Promise<void> {
    if (!this.sb) return;
    const res = await buyItem(this.sb, itemId);
    if (res.ok) {
      this.setCoins(res.balance);
      this.shopCounts.set(itemId, (this.shopCounts.get(itemId) ?? 0) + 1);
      this.shop?.setCounts(this.shopCounts);
    } else if (res.reason === 'no-coins') {
      this.showBubble(this.player, '코인이 부족해요 😢');
    } else {
      this.showBubble(this.player, '구매에 실패했어요');
    }
  }

  private async handleSell(itemId: string): Promise<void> {
    if (!this.sb) return;
    const bal = await sellItem(this.sb, itemId);
    if (bal === null) {
      this.showBubble(this.player, '판매에 실패했어요');
      return;
    }
    this.setCoins(bal);
    this.shopCounts.set(itemId, Math.max(0, (this.shopCounts.get(itemId) ?? 0) - 1));
    this.shop?.setCounts(this.shopCounts);
  }

  private applyTimeOfDay(): void {
    const phase = phaseForHour(seoulHour());
    this.tintOverlay?.setFillStyle(phase.color, phase.alpha);
  }

  // --- 퀘스트 진행 (game.registry — 씬 전환에도 유지) ---

  private incQuest(key: string, by = 1): void {
    this.questStore.bump(key, by); // localStorage 지속 (KST 자정 리셋, P2-3)
    this.quests?.refresh(this.questStore.progress());
    this.refreshHearts();
  }

  private async handleQuestClaim(questId: string): Promise<void> {
    if (!this.sb) return;
    const { data } = await this.sb.rpc('earn_activity', { p_kind: questId });
    if (typeof data === 'number' && data >= 0) {
      this.setCoins(data);
      this.questStore.claim(questId);
      this.quests?.markClaimed(questId);
      this.showBubble(this.player, '퀘스트 보상 +40 🪙');
      this.motions?.play(this.player, 'coin');
    } else if (data === -3) {
      this.questStore.claim(questId);
      this.quests?.markClaimed(questId); // 오늘 이미 수령
    } else {
      this.showBubble(this.player, '보상 수령에 실패했어요');
    }
  }

  private async handleOmokWin(): Promise<void> {
    if (!this.sb) {
      this.showBubble(this.player, '오목 승리! (오프라인 — 보상은 접속 후에)');
      return;
    }
    const { data } = await this.sb.rpc('earn_activity', { p_kind: 'omok' });
    if (typeof data === 'number' && data >= 0) {
      this.setCoins(data);
      this.showBubble(this.player, '오목 승리! +50 🪙');
      this.motions?.play(this.player, 'win');
    } else if (data === -3) {
      this.showBubble(this.player, '즐거운 대국! (보상은 하루 3번)');
    }
  }

  private async handleBuskingComplete(): Promise<void> {
    if (!this.sb) {
      this.showBubble(this.player, '멋진 연주! (오프라인 — 보상은 접속 후에)');
      return;
    }
    this.incQuest('q_busking');
    const { data } = await this.sb.rpc('earn_activity', { p_kind: 'busking' });
    if (typeof data === 'number' && data >= 0) {
      this.setCoins(data);
      this.showBubble(this.player, '관객들의 박수! +30 🪙');
      this.motions?.play(this.player, 'win');
    } else if (data === -3) {
      this.showBubble(this.player, '오늘 버스킹은 여기까지! (하루 10번)');
    } else {
      this.showBubble(this.player, '보상 지급에 실패했어요');
    }
  }

  private async handleCafeComplete(): Promise<void> {
    this.incQuest('q_cafe');
    if (!this.sb) {
      this.showBubble(this.player, '알바 완료! (오프라인 — 보상은 접속 후에)');
      return;
    }
    const { data } = await this.sb.rpc('earn_activity', { p_kind: 'cafe' });
    if (typeof data === 'number' && data >= 0) {
      this.setCoins(data);
      this.showBubble(this.player, '알바비 +60 🪙 수고했어요!');
      this.motions?.play(this.player, 'coin');
    } else if (data === -3) {
      this.showBubble(this.player, '오늘 알바는 여기까지! (하루 3번)');
    } else {
      this.showBubble(this.player, '보상 지급에 실패했어요');
    }
  }

  /** 커스터마이징 적용 — 미리보기는 로컬만, 저장 시 DB·presence 전파 */
  private applyAppearance(a: Appearance, persist: boolean): void {
    this.peer.appearance = a;
    this.peer.color = a.shirt;
    this.charKey = ensureCharacter(this, a);
    this.player.stop();
    this.player.setTexture(this.charKey, this.facing * FRAMES_PER_DIR);
    if (!persist) return;
    if (this.sb) void saveAppearance(this.sb, this.peer.userId, a);
    void this.adapter?.updateSelf(this.peer);
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
      fontSize: '10px', color: '#4a2e14', backgroundColor: '#f6ecd0',
      padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setAlpha(0.95);
  }

  private showBubble(owner: Phaser.GameObjects.Sprite, text: string): void {
    // 같은 주인의 기존 말풍선은 교체
    this.bubbles = this.bubbles.filter((b) => {
      if (b.owner === owner) { b.c.destroy(); return false; }
      return true;
    });
    const t = this.add.text(0, 0, text, {
      fontSize: '11px', color: '#4a2e14', wordWrap: { width: 150 }, align: 'center',
      resolution: TEXT_RES,
    }).setOrigin(0.5);
    const bounds = t.getBounds();
    const w = bounds.width + 16, h = bounds.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x4a2c12, 1).fillRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, 8);
    bg.fillStyle(0xfff8e4, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    bg.fillStyle(0x4a2c12, 1).fillTriangle(-4, h / 2 + 4.5, 5, h / 2 + 4.5, 0.5, h / 2 - 2);
    bg.fillStyle(0xfff8e4, 1).fillTriangle(-2.5, h / 2 + 3, 3.5, h / 2 + 3, 0.5, h / 2 - 2);
    const c = this.add.container(owner.x, owner.y - 32, [bg, t]).setDepth(20);
    // 뿅 하고 등장
    c.setScale(0.6);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.bubbles.push({ c, owner, until: this.time.now + 4000 });
  }

  private teardown(): void {
    void this.adapter?.disconnect();
    this.chat?.destroy();
    this.emotes?.destroy();
    this.customize?.destroy();
    this.shop?.destroy();
    this.cafe?.destroy();
    this.busking?.destroy();
    this.omok?.destroy();
    this.claw?.destroy();
    this.quests?.destroy();
    this.npcs?.destroy();
    this.residents?.destroy();
    this.motions?.destroy();
    this.idleBreath?.destroy();
    this.touch?.destroy();
    this.hud?.unmountActions(); // HUD는 싱글턴 — 액션 바만 내리고 상태·설정은 유지
    this.bag?.destroy();
    this.dex?.destroy();
    this.mapPanel?.destroy();
    this.residentsPanel?.destroy();
    this.rankingPanel?.destroy();
    if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
    this.hint?.remove();
  }
}
