import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM, MAP_W, MAP_H, TEXT_RES, UI_FONT } from '../config';
import {
  ZONES, SPAWN_TILE, HOUSE_DOORS, SHOP_DOORS, CAFE_DOORS, INTERIOR_DOORS,
  BUSKING_SPOT, OMOK_SPOT, BOARD_SPOT, CLAW_SPOT, PHOTO_SPOT, BUNGEO_SPOT, REALTY_DOOR,
  COMPANY_DOORS, PETSHOP_DOOR, buildCollision,
} from '../world/mapData';
import { PetShopPanel } from '../../ui/petShopPanel';
import { PetStore } from '../pets/petStore';
import { PetFollower } from '../pets/petFollower';
import { adoptPet, fetchOwnedPets } from '../../db/petApi';
import { petById } from '../pets/pets';
import { giftIntervalMs, giftShards, giftEmoji } from '../pets/petGift';
import { WEAPONSHOP_DOOR, HUNT_FIELD } from '../world/mapData';
import { BattleStore } from '../battle/battleStore';
import { HuntField } from '../battle/huntField';
import { maxHpForLevel, totalAtk, xpToNext, FATIGUE_MS } from '../battle/combat';
import { weaponById } from '../battle/weapons';
import { titleForLevel, isTitleUpAt } from '../battle/titles';
import { ensureWeaponSprite } from '../art/weaponArt';
import { PlayerAura } from '../entities/playerAura';
import type { MonsterSpecies } from '../battle/monsters';
import { BattleHud } from '../../ui/battleHud';
import { WeaponShopPanel } from '../../ui/weaponShopPanel';
import { buyWeapon, fetchOwnedWeapons } from '../../db/weaponApi';
import { ClawPanel } from '../../ui/clawPanel';
import { RealtyPanel } from '../../ui/realtyPanel';
import {
  fetchProperties, leaseProperty, moveOut, sellProperty, payRent, chargeRent,
  offlineProperties, type Property,
} from '../../db/realEstateApi';
import type { DealType } from '../realestate/realEstate';
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
import { tileToWorld, worldToTile, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { RemoteTrack } from '../entities/remoteMotion';
import { screenToTile } from '../input/pointer';
import { POS_HZ, INTERP_DELAY_MS, sanitizeChat, type EmoteKind } from '../../net/protocol';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { ChatInput } from '../../ui/chatInput';
import { ChatFeed } from '../../ui/chatFeed';
import { OnlineList } from '../../ui/onlineList';
import { EmoteWheel, EMOTE_EMOJI } from '../../ui/emoteWheel';
import { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { TreasurePanel } from '../../ui/treasurePanel';
import type { TreasureStore } from '../treasure/treasureStore';
import { STREET_SPARKLES } from '../treasure/treasures';
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
  ring: Phaser.GameObjects.Ellipse;
  track: RemoteTrack;
  charKey: string;
  lastF: 0 | 1 | 2 | 3;
  nick: string;
  pet: PetFollower;   // 상대 동행 펫 (없으면 내부 스프라이트 null)
  aura: PlayerAura;   // 상대 레벨 간지
  level: number;
}

interface Bubble { c: Phaser.GameObjects.Container; owner: Phaser.GameObjects.Sprite; until: number }

/** 말풍선 종류별 색 — NPC(크림), 원격 유저(파랑), 나(초록) */
const BUBBLE_STYLE = {
  npc: { border: 0x4a2c12, fill: 0xfff8e4, text: '#4a2e14' },
  user: { border: 0x2a5a8a, fill: 0xdcecff, text: '#1a3a5a' },
  me: { border: 0x2a6a3a, fill: 0xdcf2dc, text: '#173a1e' },
} as const;
type BubbleKind = keyof typeof BUBBLE_STYLE;

const WASD = [
  Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.D,
];

/** 화면 크기에 맞춘 카메라 줌 — 모바일(세로·가로 회전 모두)에서 시야를 넓게 확보 */
function streetZoom(): number {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  if (vmin >= 700) return ZOOM; // 데스크톱
  return Math.max(1.1, Math.min(1.7, vmin / 300));
}

export class StreetScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private playerRing!: Phaser.GameObjects.Ellipse;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private remotes = new Map<string, Remote>();
  private bubbles: Bubble[] = [];
  private chat: ChatInput | null = null;
  private chatFeed: ChatFeed | null = null;
  private onlineList: OnlineList | null = null;
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
  private realty: RealtyPanel | null = null;
  private petShop: PetShopPanel | null = null;
  private petStore = new PetStore();
  private pet: PetFollower | null = null;
  private onPetShopTile = false;
  private lastPetAt = 0;
  private petGiftMs = 0;
  // 전투/레벨업
  private battleStore = new BattleStore();
  private hunt: HuntField | null = null;
  private battleHud: BattleHud | null = null;
  private weaponShop: WeaponShopPanel | null = null;
  private onWeaponShopTile = false;
  private playerHp = 40;
  private fatigueUntil = 0;
  private lastHitMs = -9999;
  private weaponSprite: Phaser.GameObjects.Sprite | null = null;
  private playerTitle!: Phaser.GameObjects.Text;
  private playerAura!: PlayerAura;
  private properties: Property[] = [];
  private onRealtyTile = false;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private forestMs = 0;
  private hud: GameHud | null = null;
  private questStore!: QuestStore;
  private treasureStore!: TreasureStore;
  private treasure: TreasurePanel | null = null;
  private lastSparkleTile = '';
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
    this.treasureStore = this.registry.get('treasure') as TreasureStore;
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
        fontFamily: UI_FONT, fontSize: '11px', color: '#ffffff', resolution: TEXT_RES,
      }).setAlpha(0.45).setDepth(3);
    }
    for (const d of HOUSE_DOORS) {
      const p = tileToWorld(d.tx, d.ty);
      this.add.text(p.x + TILE / 2, p.y - 5, String(d.roomId), {
        fontFamily: UI_FONT, fontSize: '9px', color: '#f2d8a8', resolution: TEXT_RES,
      }).setOrigin(0.5).setAlpha(0.9).setDepth(3);
    }
    // 부동산 매물 상태 로드 (온라인은 서버, 오프라인은 로컬 세트)
    this.properties = offlineProperties();
    if (this.sb) void fetchProperties(this.sb).then((p) => { if (p.length) this.properties = p; });

    // 로컬 플레이어 (커스터마이징 외형)
    const spawn = tileToWorld(this.spawnTile.tx, this.spawnTile.ty);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    // 실제 유저는 발밑 링으로 NPC와 구분 (나=초록)
    this.playerRing = this.add.ellipse(spawn.x + TILE / 2, spawn.y + TILE / 2 + 12, 26, 10, 0x4ec86a, 0.55)
      .setStrokeStyle(2, 0x2a6a3a, 0.9).setDepth(9);
    this.player = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, this.charKey, 0)
      .setOrigin(0.5, 0.66).setDepth(10); // 발이 충돌 박스 바닥에 오게
    this.playerLabel = this.makeNameLabel(this.peer.nickname, 'me').setDepth(11);
    // 이름 위 레벨 호칭
    this.playerTitle = this.add.text(spawn.x, spawn.y, '', {
      fontFamily: UI_FONT, fontSize: '9px', color: '#ffe08a', fontStyle: 'bold',
      stroke: '#3a2410', strokeThickness: 2.5, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(11).setAlpha(0.98);

    // 동행 펫 (펫샵에서 입양) — 플레이어를 졸졸 따라온다
    this.pet = new PetFollower(this, this.petStore.activeId());
    this.refreshPetStage();
    // 온라인이면 서버 보유 펫을 병합 (기기 간 유지)
    if (this.sb) void fetchOwnedPets(this.sb, this.peer.userId).then((ids) => this.petStore.merge(ids));

    // 사냥터 전투 (마을 밖 = 경의선 숲길 필드) — 근접 자동 전투
    this.playerHp = maxHpForLevel(this.battleStore.level);
    this.battleHud = new BattleHud();
    this.hunt = new HuntField(this,
      { x: HUNT_FIELD.x * TILE, y: HUNT_FIELD.y * TILE, w: HUNT_FIELD.w * TILE, h: HUNT_FIELD.h * TILE },
      {
        getPlayerPos: () => ({ x: this.player.x, y: this.player.y }),
        getPlayerAtk: () => totalAtk(this.battleStore.level, weaponById(this.battleStore.equippedId()).atk, this.isFatigued()),
        currentTier: () => this.battleStore.tier,
        onPlayerHit: (dmg) => this.damagePlayer(dmg),
        onDefeat: (species) => this.onMonsterDefeat(species),
        onSwing: () => this.swingWeapon(),
      });
    this.refreshNameTag();
    this.refreshWeaponSprite();
    // 레벨 간지 오라 (레벨↑ → 점점 화려하게) + 펫·레벨을 상대에게 전파
    this.playerAura = new PlayerAura(this);
    this.playerAura.setLevel(this.battleStore.level);
    this.peer.pet = this.petStore.activeId();
    this.peer.level = this.battleStore.level;
    if (this.sb) void fetchOwnedWeapons(this.sb, this.peer.userId).then((ids) => { ids.forEach((id) => this.battleStore.buyWeapon(id)); });

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
      // 따라다니는 펫을 클릭하면 쓰다듬기 (동물의 숲 감성)
      const wp = cam.getWorldPoint(p.x, p.y);
      if (this.pet?.contains(wp.x, wp.y) && !this.anyPanelOpen()) { this.pettingActivePet(); return; }
      const { tx, ty } = screenToTile(p.x, p.y, {
        scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
        width: cam.width, height: cam.height,
      });
      const door = HOUSE_DOORS.find((d) => d.tx === tx && d.ty === ty);
      if (door) void this.enterDoor(door.roomId);
    });

    // 카메라 — 로컬 플레이어만 팔로우 (좁은 화면은 줌을 낮춰 시야 확보)
    const cam = this.cameras.main;
    // 모바일은 세로가 좁으므로 화면 크기에 맞춰 시야 확보 (가로 회전 포함)
    cam.setZoom(streetZoom());
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);
    // 화면 회전·리사이즈 시 줌 재적용
    this.scale.on('resize', this.onResize, this);

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
    // 피로 상태면 굉장히 느리게 (부활 직후 패널티)
    const moveDelta = this.isFatigued() ? delta * 0.5 : delta;
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, moveDelta, this.grid, { hw: 8, hh: 11 },
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
        const onRealty = tile.tx === REALTY_DOOR.tx && tile.ty === REALTY_DOOR.ty;
        if (onRealty && !this.onRealtyTile && this.realty && !this.realty.isOpen) void this.openRealty();
        this.onRealtyTile = onRealty;
        const onPetShop = tile.tx === PETSHOP_DOOR.tx && tile.ty === PETSHOP_DOOR.ty;
        if (onPetShop && !this.onPetShopTile && this.petShop && !this.petShop.isOpen) this.openPetShop();
        this.onPetShopTile = onPetShop;
        const onWeaponShop = tile.tx === WEAPONSHOP_DOOR.tx && tile.ty === WEAPONSHOP_DOOR.ty;
        if (onWeaponShop && !this.onWeaponShopTile && this.weaponShop && !this.weaponShop.isOpen) this.openWeaponShop();
        this.onWeaponShopTile = onWeaponShop;
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
        const companyDoor = COMPANY_DOORS.find((d) => d.tx === tile.tx && d.ty === tile.ty);
        if (companyDoor && !this.entering) {
          this.entering = true;
          audio.playSe('door');
          this.scene.start('company', { companyId: companyDoor.company, peer: this.peer, adapter: this.adapter });
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
    { const t = worldToTile(next.x, next.y); this.checkSparkle(t.tx, t.ty); }
    this.pet?.update(next.x, next.y, delta);
    if (moving && !this.anyPanelOpen()) this.tickPetGift(delta);
    if (!this.anyPanelOpen()) this.hunt?.update(delta);
    this.tickBattle(delta);
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
        r.ring.setPosition(p.x, p.y + 12);
        r.aura.follow(p.x, p.y);
        r.pet?.update(p.x, p.y, delta);
        const ak = `${r.charKey}-walk-${r.lastF}`;
        if (moved) {
          if (r.sprite.anims.currentAnim?.key !== ak || !r.sprite.anims.isPlaying) r.sprite.play(ak);
        } else if (r.sprite.anims.isPlaying) {
          r.sprite.stop();
          r.sprite.setFrame(r.lastF * FRAMES_PER_DIR);
        }
      }
    }

    // 라벨·링·말풍선 위치 추종 및 만료 처리
    this.playerLabel.setPosition(this.player.x, this.player.y - 26);
    this.playerTitle.setPosition(this.player.x, this.player.y - 38);
    this.playerRing.setPosition(this.player.x, this.player.y + 12);
    this.playerAura?.follow(this.player.x, this.player.y);
    this.positionWeaponSprite();
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 38);
      return true;
    });
  }

  /**
   * 문 진입: 계약한 내 집이면 꾸미기, 남의 집이면 구경, 공실이면 복덕방 안내.
   * (무료 선착순 입주는 폐지 — 부동산 계약으로 대체)
   */
  private async enterDoor(roomId: number): Promise<void> {
    if (this.entering) return;
    const prop = this.properties.find((p) => p.id === roomId);
    if (!this.sb) {
      // 오프라인: 로컬 전용 — 유형만 반영해 바로 입장(무료)
      this.entering = true;
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: true, peer: this.peer, adapter: this.adapter,
        houseType: prop?.houseType ?? 'oneroom', floorSeed: prop?.floorSeed ?? roomId, dealType: null,
      });
      return;
    }
    // 온라인: 최신 소유 상태 확인
    this.properties = await fetchProperties(this.sb);
    const p = this.properties.find((x) => x.id === roomId);
    if (!p) return;
    if (p.holderId === this.peer.userId) {
      this.entering = true;
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: true, peer: this.peer, adapter: this.adapter,
        houseType: p.houseType, floorSeed: p.floorSeed, dealType: p.dealType,
      });
    } else if (p.holderId === null) {
      this.showBubble(this.player, '공실이에요 — 복덕방에서 계약할 수 있어요 🏘️');
    } else {
      // 남의 집 구경 모드
      this.entering = true;
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: false, peer: this.peer, adapter: this.adapter,
        houseType: p.houseType, floorSeed: p.floorSeed, dealType: p.dealType,
      });
    }
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
      r.nick = peer.nickname;
      r.level = peer.level ?? r.level;
      r.label.setText(`● ${peer.nickname}  Lv.${r.level}`);
      r.pet.setSpecies(peer.pet ?? null); // 상대 펫 반영
      r.aura.setLevel(r.level);
      this.refreshOnline();
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
      if (r) {
        this.showBubble(r.sprite, m.t, 'user');
        this.chatFeed?.push(r.nick, m.t, 'user');
      }
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
    // 원격 유저 발밑 링 (파랑) — NPC와 구분
    const ring = this.add.ellipse(spawn.x + TILE / 2, spawn.y + TILE / 2 + 12, 26, 10, 0x5aa0e0, 0.5)
      .setStrokeStyle(2, 0x2a5a8a, 0.9).setDepth(9);
    const sprite = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, charKey, 0)
      .setOrigin(0.5, 0.66).setDepth(10);
    const level = peer.level ?? 1;
    const label = this.makeNameLabel(`${peer.nickname}  Lv.${level}`, 'user').setDepth(11);
    // 상대 동행 펫 + 레벨 간지 오라
    const pet = new PetFollower(this, peer.pet ?? null);
    const aura = new PlayerAura(this);
    aura.setLevel(level);
    this.remotes.set(peer.userId, { sprite, label, ring, track: new RemoteTrack(), charKey, lastF: 0, nick: peer.nickname, pet, aura, level });
    this.chatFeed?.push('', `${peer.nickname}님이 입장했어요`, 'system');
    this.refreshOnline();
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
    r.ring.destroy();
    r.pet?.destroy();
    r.aura.destroy();
    this.remotes.delete(userId);
    this.chatFeed?.push('', `${r.nick}님이 나갔어요`, 'system');
    this.refreshOnline();
  }

  /** 좌상단 접속자 목록 갱신 (나 + 원격 닉네임) */
  private refreshOnline(): void {
    this.onlineList?.render([...this.remotes.values()].map((r) => r.nick));
  }

  private onResize(): void {
    this.cameras.main?.setZoom(streetZoom());
  }

  private updateFacing(input: MoveInput): void {
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
  }

  // --- UI (채팅·이모트·힌트) ---

  private setupUi(): void {
    // 접속자 목록(좌상단) + 전체 채팅 피드 — 멀티일 때만 의미, 오프라인도 나 표시
    this.onlineList = new OnlineList(this.peer.nickname);
    this.chatFeed = new ChatFeed();

    this.chat = new ChatInput({
      onSend: (raw) => {
        const text = sanitizeChat(raw);
        if (!text) return;
        this.showBubble(this.player, text, 'me');
        this.chatFeed?.push(this.peer.nickname, text, 'me');
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
    kb.on('keydown-T', () => this.openTreasure());
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
      onWin: (prize) => {
        this.showBubble(this.player, `${prize} 획득! 🎉`);
        this.motions?.play(this.player, 'win');
        void this.awardActivity('claw');
      },
    });
    this.realty = new RealtyPanel({
      online: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onLease: (id, deal) => void this.handleLease(id, deal),
      onMoveOut: (id) => void this.handleMoveOut(id),
      onSell: (id) => void this.handleSellProperty(id),
      onPayRent: (id) => void this.handlePayRent(id),
    });
    this.quests = new QuestPanel({
      online: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onClaim: (questId) => void this.handleQuestClaim(questId),
    });
    this.petShop = new PetShopPanel({
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onAdopt: (petId) => void this.handleAdopt(petId),
      onSetActive: (petId) => this.handleSetActivePet(petId),
      onFeed: (petId) => this.handleFeed(petId),
    });
    this.weaponShop = new WeaponShopPanel({
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onBuy: (weaponId) => void this.handleBuyWeapon(weaponId),
      onEquip: (weaponId) => { this.battleStore.equip(weaponId); this.refreshWeaponSprite(); },
    });

    // 활동 스팟 표시 — 통통 튀는 아이콘으로 "여기서 뭔가 된다"를 알린다
    const spot = (t: { tx: number; ty: number }, emoji: string, label: string) => {
      const w = tileToWorld(t.tx, t.ty);
      const icon = this.add.text(w.x + TILE / 2, w.y - 4, emoji, { fontFamily: UI_FONT, fontSize: '16px' })
        .setOrigin(0.5, 1).setDepth(12).setAlpha(0.95);
      this.add.text(w.x + TILE / 2, w.y + TILE + 2, label, {
        fontFamily: UI_FONT, fontSize: '8px', color: '#fff2d8', backgroundColor: '#7a5220',
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
    spot(PETSHOP_DOOR, '🐾', '펫샵');
    spot(WEAPONSHOP_DOOR, '⚒️', '대장간');

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
    this.treasure = new TreasurePanel(this.treasureStore, { onToggle: (o) => this.setGameKeysEnabled(!o) });
    // HUD는 세션 싱글턴 (main 생성) — 거리 진입 시 액션 바만 장착
    this.hud = this.registry.get('hud') as GameHud;
    this.hud.mountActions({
      onBag: () => void this.openBag(),
      onDex: () => void this.openDex(),
      onMap: () => this.openMap(),
      onQuest: () => this.openQuests(),
      onTreasure: () => this.openTreasure(),
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
      || (this.rankingPanel?.isOpen ?? false) || (this.claw?.isOpen ?? false)
      || (this.realty?.isOpen ?? false) || (this.treasure?.isOpen ?? false)
      || (this.petShop?.isOpen ?? false) || (this.weaponShop?.isOpen ?? false);
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
      { open: this.realty?.isOpen ?? false, close: () => this.realty!.close() },
      { open: this.petShop?.isOpen ?? false, close: () => this.petShop!.close() },
      { open: this.weaponShop?.isOpen ?? false, close: () => this.weaponShop!.close() },
      { open: this.treasure?.isOpen ?? false, close: () => this.treasure!.close() },
      { open: this.omok?.isOpen ?? false, close: () => this.omok!.close() },
      { open: this.cafe?.isOpen ?? false, close: () => this.cafe!.close() },
      { open: this.busking?.isOpen ?? false, close: () => this.busking!.close() },
      { open: this.customize?.isOpen ?? false, close: () => this.customize!.close() },
    ];
    const top = closers.find((c) => c.open);
    if (top) { top.close(); return true; }
    return false;
  }

  /** 네컷 포토부스 — 갬성샷 + 소액 보상 */
  private takePhoto(): void {
    const lines = ['📸 인생네컷 찰칵!', '📸 갬성샷 득템~', '📸 최고의 한 컷 ✨'];
    this.showBubble(this.player, lines[Math.floor(Date.now() / 1000) % lines.length]!);
    this.motions?.play(this.player, 'greet');
    audio.playSe('success');
    void this.awardActivity('photo');
  }

  /** 붕어빵 포차 — 따끈한 간식 + 소액 보상 */
  private eatBungeo(): void {
    this.showBubble(this.player, '🐟 붕어빵 호호… 따끈해!');
    void this.awardActivity('bungeo');
  }

  /**
   * 활동 보상 지급 — earn_activity RPC(서버 원장·일일 상한). 성공 시 코인·모션.
   * kind가 화이트리스트에 없으면(-2, SQL 미적용 상태) 조용히 연출만 유지.
   */
  private async awardActivity(kind: 'claw' | 'photo' | 'bungeo'): Promise<void> {
    if (!this.sb) return; // 오프라인: 연출만
    const { data } = await this.sb.rpc('earn_activity', { p_kind: kind });
    if (typeof data === 'number' && data >= 0) {
      this.setCoins(data);
      this.motions?.play(this.player, 'coin');
    } else if (data === -3) {
      this.showBubble(this.player, '오늘은 여기까지! (하루 상한)');
    }
    // data === -2 (미적용) 또는 기타: 연출만 유지, 조용히 통과
  }

  private openResidents(): void {
    if (this.anyPanelOpen()) return;
    this.residentsPanel!.open(this.residents!.getTrust());
  }

  private openTreasure(): void {
    if (this.anyPanelOpen()) return;
    this.treasure!.open();
  }

  /** 히든 반짝이 스팟 채집 — 밟는 순간 1회, 오늘 처음이면 조각 획득 + 반짝이 연출 */
  private checkSparkle(tx: number, ty: number): void {
    const spot = STREET_SPARKLES.find((s) => s.tx === tx && s.ty === ty);
    const key = spot ? spot.id : '';
    if (spot && key !== this.lastSparkleTile) {
      const gained = this.treasureStore.collect(spot);
      if (gained > 0) {
        this.showBubble(this.player, `✨ 반짝이는 걸 발견! 조각 +${gained} 💠`);
        this.motions?.play(this.player, 'win');
        audio.playSe('success');
      }
    }
    this.lastSparkleTile = key;
  }

  // --- 부동산 ---

  private async openRealty(): Promise<void> {
    if (this.anyPanelOpen()) return;
    if (this.sb) {
      this.properties = await fetchProperties(this.sb);
      // 내 월세 매물 청구 (연체 반영)
      for (const p of this.properties) {
        if (p.holderId === this.peer.userId && p.dealType === 'wolse') await chargeRent(this.sb, p.id);
      }
      this.properties = await fetchProperties(this.sb);
      this.coins = await fetchCoins(this.sb, this.peer.userId);
      this.setCoins(this.coins);
    }
    this.realty!.open(this.properties, this.coins, this.peer.userId);
  }

  private async refreshRealty(): Promise<void> {
    if (this.sb) this.properties = await fetchProperties(this.sb);
    this.realty?.update(this.properties, this.coins);
  }

  // --- 펫샵 ---

  private openPetShop(): void {
    if (this.anyPanelOpen()) return;
    this.petShop!.open(this.petStore, this.coins, !!this.sb);
  }

  /** 입양 — 온라인이면 서버 코인 차감(가격 SSOT=서버). 미적용/오프라인/희귀는 무료 코스메틱 폴백 */
  private async handleAdopt(petId: string): Promise<void> {
    const s = petById(petId);
    if (!s || this.petStore.isOwned(petId)) return;
    // 희귀(히든) 펫은 발견 보상 — 서버 청구 없이 로컬 무료 입양
    if (!s.rare && this.sb) {
      const res = await adoptPet(this.sb, petId);
      if (res.ok) {
        this.setCoins(res.balance);
        this.petStore.adopt(petId);
        this.motions?.play(this.player, 'coin');
      } else if (res.reason === 'no-coins') {
        this.showBubble(this.player, '코인이 부족해요 😢');
        this.petShop?.refresh(this.coins);
        return;
      } else {
        this.petStore.adopt(petId); // 서버 미적용(no-rpc)/에러 → 무료 폴백
      }
    } else {
      this.petStore.adopt(petId); // 오프라인 or 희귀 무료 입양
    }
    // 처음 들인 펫은 바로 데리고 다닌다
    if (!this.petStore.activeId()) this.handleSetActivePet(petId);
    this.showBubble(this.player, `${s.emoji} ${s.name} 입양 완료! 🎉`);
    audio.playSe('success');
    this.announceUnlocks();
    this.petShop?.refresh(this.coins);
  }

  private handleSetActivePet(petId: string | null): void {
    this.petStore.setActive(petId);
    this.pet?.setSpecies(petId);
    this.refreshPetStage();
    this.syncSelfMeta(); // 상대에게도 내 펫 반영
  }

  /** 내 펫·레벨 상태를 presence로 전파 (상대 화면에 반영) */
  private syncSelfMeta(): void {
    this.peer.pet = this.petStore.activeId();
    this.peer.level = this.battleStore.level;
    void this.adapter?.updateSelf(this.peer);
  }

  /** 먹이 주기 — 하루 1회, 친밀도 상승 + 히든 해금 체크 */
  private handleFeed(petId: string): void {
    const s = petById(petId);
    const aff = this.petStore.feed(petId);
    if (aff < 0) { this.showBubble(this.player, '오늘은 이미 배불러요 🍚'); return; }
    if (s) this.showBubble(this.player, `${s.emoji} 냠냠! 친밀도 ${aff} 💛`);
    audio.playSe('success');
    this.refreshPetStage();
    this.announceUnlocks();
    this.petShop?.refresh(this.coins);
  }

  /** 동행 펫 쓰다듬기 — 하트 연출 + 소량 친밀도 (3초 쿨다운) */
  private pettingActivePet(): void {
    const id = this.petStore.activeId();
    if (!id) return;
    const now = this.time.now;
    if (now - this.lastPetAt < 3000) { this.pet?.petFx(); return; }
    this.lastPetAt = now;
    const aff = this.petStore.pet(id);
    this.pet?.petFx();
    audio.playSe('pop');
    const s = petById(id);
    this.showBubble(this.player, `${s?.emoji ?? '🐾'} 쓰담쓰담~ 🥰 (친밀도 ${aff})`);
    this.refreshPetStage();
    this.announceUnlocks();
  }

  /** 데리고 걷다 보면 펫이 가끔 보물 조각을 물어다 준다 (친밀도↑ → 자주·후하게) */
  private tickPetGift(delta: number): void {
    const id = this.petStore.activeId();
    if (!id) { this.petGiftMs = 0; return; }
    this.petGiftMs += delta;
    if (this.petGiftMs < giftIntervalMs(this.petStore.affinity(id))) return;
    this.petGiftMs = 0;
    const n = giftShards(this.petStore.stage(id));
    this.treasureStore.addShards(n);
    const emoji = giftEmoji();
    this.pet?.giftFx(emoji);
    const s = petById(id);
    this.showBubble(this.player, `${s?.emoji ?? '🐾'} 선물이에요! ${emoji} 조각 +${n} 💠`);
    audio.playSe('success');
  }

  private refreshPetStage(): void {
    const id = this.petStore.activeId();
    this.pet?.setStage(id ? this.petStore.stage(id) : 0);
  }

  // --- 전투/레벨업 ---

  private isFatigued(): boolean { return this.time.now < this.fatigueUntil; }

  /** 이름표 = ● 닉 Lv.N + 위에 호칭 */
  private refreshNameTag(): void {
    const lv = this.battleStore.level;
    this.playerLabel.setText(`● ${this.peer.nickname}  Lv.${lv}`);
    this.playerTitle.setText(`〈${titleForLevel(lv)}〉`);
  }

  /** 장착 무기 스프라이트 생성/교체 (맨손이면 숨김) */
  private refreshWeaponSprite(): void {
    const key = ensureWeaponSprite(this, this.battleStore.equippedId());
    if (!key) { this.weaponSprite?.destroy(); this.weaponSprite = null; return; }
    if (!this.weaponSprite) {
      this.weaponSprite = this.add.sprite(this.player.x, this.player.y, key)
        .setOrigin(0.5, 0.85).setDepth(11).setScale(1.0);
    } else {
      this.weaponSprite.setTexture(key);
    }
  }

  /** 손에 쥔 무기를 방향에 맞게 배치 (뒤를 보면 등 뒤로) */
  private positionWeaponSprite(): void {
    const w = this.weaponSprite;
    if (!w) return;
    const f = this.facing; // 0하 1우 2좌 3상
    const sideLeft = f === 2;
    w.setFlipX(sideLeft);
    w.setDepth(f === 3 ? 9 : 11); // 위를 보면 캐릭터 뒤
    const dx = sideLeft ? -9 : 9;
    w.setPosition(this.player.x + dx, this.player.y - (f === 3 ? 12 : 6));
    if (!w.getData('swinging')) w.setAngle(sideLeft ? -25 : 25);
  }

  /** 몬스터를 벨 때 무기 스윙 연출 */
  private swingWeapon(): void {
    const w = this.weaponSprite;
    if (!w || w.getData('swinging')) return;
    w.setData('swinging', true);
    const base = this.facing === 2 ? -25 : 25;
    this.tweens.add({
      targets: w, angle: base - 90, duration: 110, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => { w.setData('swinging', false); w.setAngle(base); },
    });
  }

  /** 매 프레임 배틀 상태 갱신 — HUD 표시·HP 재생 */
  private tickBattle(delta: number): void {
    if (!this.hunt || !this.battleHud) return;
    const inField = this.hunt.contains(this.player.x, this.player.y);
    this.battleHud.setVisible(inField || this.isFatigued());
    // 최근 피격 없고 위험 밖이면 HP 서서히 회복
    const maxHp = maxHpForLevel(this.battleStore.level);
    if (this.playerHp < maxHp && this.time.now - this.lastHitMs > 3000) {
      this.playerHp = Math.min(maxHp, this.playerHp + (8 * delta) / 1000);
    }
    const w = weaponById(this.battleStore.equippedId());
    this.battleHud.set({
      level: this.battleStore.level, hp: this.playerHp, maxHp,
      xp: this.battleStore.xp, xpNext: xpToNext(this.battleStore.level),
      tier: this.battleStore.tier, kills: this.battleStore.killsInTier, quota: this.battleStore.quota,
      weapon: `${w.emoji} ${w.name}`, fatigued: this.isFatigued(),
    });
  }

  /** 몬스터에게 맞음 */
  private damagePlayer(dmg: number): void {
    if (this.playerHp <= 0) return;
    this.playerHp -= dmg;
    this.lastHitMs = this.time.now;
    this.cameras.main.shake(90, 0.004);
    this.player.setTintFill(0xff5a5a);
    this.time.delayedCall(80, () => this.player.clearTint());
    if (this.playerHp <= 0) this.playerDie();
  }

  /** 사망 → 경험치 감소 + 마을 부활 + 피로 상태 */
  private playerDie(): void {
    this.battleStore.onDeath();
    this.playerHp = maxHpForLevel(this.battleStore.level);
    this.fatigueUntil = this.time.now + FATIGUE_MS;
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    this.player.setPosition(spawn.x + TILE / 2, spawn.y + TILE / 2);
    this.showBubble(this.player, '💫 기절… 마을에서 깨어났어요 (경험치 손실·한동안 피로)');
    audio.playSe('click');
  }

  /** 몬스터 처치 → 경험치·조각·레벨업·티어 전진 */
  private onMonsterDefeat(species: MonsterSpecies): void {
    const before = this.battleStore.level;
    const r = this.battleStore.onKill(species.xp);
    if (species.shard > 0 && Math.random() < 0.5) this.treasureStore.addShards(species.shard);
    audio.playSe('success');
    if (r.leveledUp > 0) {
      this.playerHp = maxHpForLevel(this.battleStore.level); // 레벨업 완전 회복
      this.refreshNameTag();
      this.playerAura.setLevel(this.battleStore.level); // 간지 등급 갱신
      this.syncSelfMeta();                              // 상대에게 레벨 전파
      this.showBubble(this.player, `🎉 레벨 업! Lv.${this.battleStore.level}`);
      this.motions?.play(this.player, 'win');
      this.cameras.main.flash(160, 255, 240, 180);
      // 새 호칭 승격 알림
      for (let l = before + 1; l <= this.battleStore.level; l++) {
        if (isTitleUpAt(l)) this.showBubble(this.player, `🏅 새 호칭 「${titleForLevel(l)}」 획득!`);
      }
    }
    if (r.tierUp) {
      this.showBubble(this.player, `⚔️ 티어 ${r.newTier} 돌파! 더 강한 몬스터가 나타난다…`);
    }
  }

  private openWeaponShop(): void {
    if (this.anyPanelOpen()) return;
    this.weaponShop!.open(this.battleStore, this.coins, !!this.sb);
  }

  /** 무기 구매 — 온라인이면 서버 코인 차감(가격 SSOT=서버), 미적용/오프라인은 무료 폴백 */
  private async handleBuyWeapon(weaponId: string): Promise<void> {
    if (this.battleStore.isWeaponOwned(weaponId)) { this.battleStore.equip(weaponId); this.refreshWeaponSprite(); this.weaponShop?.refresh(this.coins); return; }
    if (this.sb) {
      const res = await buyWeapon(this.sb, weaponId);
      if (res.ok) { this.setCoins(res.balance); this.battleStore.buyWeapon(weaponId); }
      else if (res.reason === 'no-coins') { this.showBubble(this.player, '골드가 부족해요 😢'); this.weaponShop?.refresh(this.coins); return; }
      else this.battleStore.buyWeapon(weaponId); // 미적용/에러 → 무료 폴백
    } else {
      this.battleStore.buyWeapon(weaponId);
    }
    this.battleStore.equip(weaponId);
    this.refreshWeaponSprite();
    audio.playSe('success');
    this.motions?.play(this.player, 'coin');
    this.weaponShop?.refresh(this.coins);
  }

  /** 새로 해금된 히든 펫을 알린다 */
  private announceUnlocks(): void {
    const newly = this.petStore.checkUnlocks();
    for (const id of newly) {
      const s = petById(id);
      if (s) {
        this.showBubble(this.player, `✨ 히든 친구 「${s.name}」 발견! 펫샵에서 만나요`);
        this.motions?.play(this.player, 'win');
        audio.playSe('success');
      }
    }
    if (newly.length && this.petShop?.isOpen) this.petShop.refresh(this.coins);
  }

  private async handleLease(id: number, deal: DealType): Promise<void> {
    if (!this.sb) { this.showBubble(this.player, '계약은 접속 후에 가능해요'); return; }
    const res = await leaseProperty(this.sb, id, deal);
    if (res.ok) {
      this.setCoins(res.balance);
      this.motions?.play(this.player, 'coin');
      this.showBubble(this.player, '계약 완료! 문으로 입주하세요 🔑');
      await this.refreshRealty();
    } else if (res.reason === 'no-coins') {
      this.showBubble(this.player, '잔액이 부족해요 😢');
    } else if (res.reason === 'occupied') {
      this.showBubble(this.player, '방금 다른 분이 계약했어요');
      await this.refreshRealty();
    } else {
      this.showBubble(this.player, '계약에 실패했어요');
    }
  }

  private async handleMoveOut(id: number): Promise<void> {
    if (!this.sb) return;
    const bal = await moveOut(this.sb, id);
    if (bal !== null) {
      this.setCoins(bal);
      this.showBubble(this.player, '퇴실 완료 · 보증금 환급 🧳');
      await this.refreshRealty();
    } else this.showBubble(this.player, '퇴실에 실패했어요');
  }

  private async handleSellProperty(id: number): Promise<void> {
    if (!this.sb) return;
    const bal = await sellProperty(this.sb, id);
    if (bal !== null) {
      this.setCoins(bal);
      this.showBubble(this.player, '매도 완료 🏷️');
      await this.refreshRealty();
    } else this.showBubble(this.player, '매도에 실패했어요');
  }

  private async handlePayRent(id: number): Promise<void> {
    if (!this.sb) return;
    const bal = await payRent(this.sb, id);
    if (bal !== null) {
      this.setCoins(bal);
      this.showBubble(this.player, '월세 납부 완료 🧾');
      await this.refreshRealty();
    } else this.showBubble(this.player, '납부에 실패했어요');
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

  /** 이름표 — 실제 유저(me/user)는 색을 달리해 NPC와 구분 */
  private makeNameLabel(name: string, kind: 'me' | 'user' = 'user'): Phaser.GameObjects.Text {
    const bg = kind === 'me' ? '#2a6a3a' : '#2a5a8a';
    return this.add.text(0, 0, `● ${name}`, {
      fontFamily: UI_FONT, fontSize: '10px', color: '#ffffff', backgroundColor: bg,
      padding: { x: 5, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setAlpha(0.98);
  }

  private showBubble(owner: Phaser.GameObjects.Sprite, text: string, kind: BubbleKind = 'npc'): void {
    // 같은 주인의 기존 말풍선은 교체
    this.bubbles = this.bubbles.filter((b) => {
      if (b.owner === owner) { b.c.destroy(); return false; }
      return true;
    });
    const st = BUBBLE_STYLE[kind];
    const t = this.add.text(0, 0, text, {
      fontFamily: UI_FONT, fontSize: '11px', color: st.text, wordWrap: { width: 150 }, align: 'center',
      resolution: TEXT_RES,
    }).setOrigin(0.5);
    const bounds = t.getBounds();
    const w = bounds.width + 16, h = bounds.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(st.border, 1).fillRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, 8);
    bg.fillStyle(st.fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    bg.fillStyle(st.border, 1).fillTriangle(-4, h / 2 + 4.5, 5, h / 2 + 4.5, 0.5, h / 2 - 2);
    bg.fillStyle(st.fill, 1).fillTriangle(-2.5, h / 2 + 3, 3.5, h / 2 + 3, 0.5, h / 2 - 2);
    const c = this.add.container(owner.x, owner.y - 32, [bg, t]).setDepth(20);
    // 뿅 하고 등장
    c.setScale(0.6);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.bubbles.push({ c, owner, until: this.time.now + 4000 });
  }

  private teardown(): void {
    this.scale.off('resize', this.onResize, this);
    void this.adapter?.disconnect();
    this.chat?.destroy();
    this.chatFeed?.destroy();
    this.onlineList?.destroy();
    this.emotes?.destroy();
    this.customize?.destroy();
    this.shop?.destroy();
    this.cafe?.destroy();
    this.busking?.destroy();
    this.omok?.destroy();
    this.claw?.destroy();
    this.realty?.destroy();
    this.petShop?.destroy();
    this.weaponShop?.destroy();
    this.hunt?.destroy();
    this.battleHud?.destroy();
    this.playerAura?.destroy();
    this.pet?.destroy();
    this.treasure?.destroy();
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
