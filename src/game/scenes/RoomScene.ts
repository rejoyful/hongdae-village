import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM, TEXT_RES, UI_FONT } from '../config';
import { tileToWorld, worldToTile, CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import {
  blockingTiles, canPlace, footprint, sizeOf, layerOf, nextRot, ROTATION_LABEL,
  type Placed, type Rot, type PlaceRegion,
} from '../entities/placement';
import { CATALOG_BY_ID } from '../../items/catalog';
import { HOUSE_DOORS } from '../world/mapData';
import { ensureFurniture } from '../art/roomArt';
import { addIsometricRoomInteriorWalls, makeIsometricRoomBackground } from '../art/isometricRoomArt';
import {
  generateFloorPlan, isPlaceableTile, HOUSE_SPECS, DEAL_LABEL,
  type FloorPlan, type HouseType, type DealType,
} from '../realestate/realEstate';
import { chargeRent } from '../../db/realEstateApi';
import { ROOM_MATERIALS, FURNITURE_ASSETS, furnitureAssetKey } from '../art/assetManifest';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { CHAR_ORIGIN_Y, ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { InventoryBar } from '../../ui/inventoryBar';
import { ExitButton } from '../../ui/exitButton';
import { HomeDesignPanel, type HomePetView } from '../../ui/homeDesignPanel';
import { HomeGuestbookPanel } from '../../ui/homeGuestbookPanel';
import { HomeLayoutPanel, type HomeLayoutPanelResult } from '../../ui/homeLayoutPanel';
import { FurnitureReformPanel } from '../../ui/furnitureReformPanel';
import { HomeMoodboardPanel } from '../../ui/homeMoodboardPanel';
import { HomeStudioCardPanel } from '../../ui/homeStudioCardPanel';
import { FanRoomPanel } from '../../ui/fanRoomPanel';
import { PetMemoryWallPanel } from '../../ui/petMemoryWallPanel';
import { HomeObjectStoryPanel } from '../../ui/homeObjectStoryPanel';
import { HomeAquariumPanel } from '../../ui/homeAquariumPanel';
import { FishingPanel } from '../../ui/fishingPanel';
import type { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { AchievementStore } from '../achievements';
import { DAILY_QUESTS } from '../quests';
import { analyzeHomeDesign } from '../home/homeDesign';
import {
  FURNITURE_COLOR_BY_ID,
  FurnitureReformStore,
  isReformableFurniture,
  type FurnitureReformProgress,
  type FurnitureReformStyle,
} from '../home/furnitureReform';
import { HomeEditHistory, type HomeEditAction } from '../home/homeEditHistory';
import { HomeMoodboardStore, type HomeMoodboardContext, type HomeMoodboardProgress } from '../home/homeMoodboards';
import {
  HomeStudioCardStore, type HomeStudioCardContext, type HomeStudioCardProgress,
} from '../home/homeStudioCards';
import {
  FanRoomDisplayStore, featuredFanMerch, type FanRoomDisplayProgress,
} from '../home/fanRoomDisplay';
import {
  PetMemoryWallStore, type PetMemoryWallProgress,
} from '../home/petMemoryWall';
import { PetMeetPostcardStore } from '../social/petMeetPostcards';
import { FanMerchWorkshopStore } from '../progression/fanMerchWorkshop';
import {
  paintFanRoomFixture,
} from '../art/fanRoomArt';
import { paintPetMemoryWallFixture } from '../art/petMemoryWallArt';
import {
  HomeObjectStoryStore, type ObjectStoryProgress,
} from '../home/objectStories';
import { ensureReformedFurniture } from '../art/furnitureReformArt';
import { furnitureWorkshopPreview } from '../art/furnitureWorkshopArt';
import { furniturePlacementMeta } from '../home/furniturePlacementMeta';
import {
  ROOM_ISO_OVERLAY_DEPTH,
  isometricActorPose,
  isometricFurniturePose,
  isometricRoomLayout,
  projectRoomFootprint,
  projectRoomTile,
  roomLogicalTileCenter,
  screenToRoomTile,
} from '../home/isometricRoom';
import { performanceComfort } from '../performance/performanceComfort';
import { screenInputToWorld } from '../world/isometric';
import type { HomeAquariumStore } from '../home/homeAquariumStore';
import { paintHomeAquarium } from '../art/homeAquariumArt';
import type { FishingStore } from '../fishing/fishingStore';
import { HomeVisitStore, type HomeVisitContext, type HomeVisitView } from '../home/homeVisits';
import { OfflineRoomStore } from '../home/offlineRoomStore';
import { NeighborHomeTourStore } from '../home/neighborHomeTours';
import {
  HOME_LAYOUT_LABELS, HomeLayoutStore, homeLayoutPlacementKey, makeHomeLayoutSnapshot,
  prepareHomeLayoutApply, type HomeLayoutLabelId, type HomeLayoutProgress, type HomeLayoutSnapshot,
} from '../home/homeLayouts';
import type { HomeGuestbookProgress, HomeGuestbookRecord } from '../social/homeGuestbook';
import { PetStore } from '../pets/petStore';
import { PetFollower } from '../pets/petFollower';
import { petById } from '../pets/pets';
import { PetHomeMemoryStore, evaluatePetHome, selectPetHomeMoment } from '../home/petHomeComfort';
import { TasteShowcaseStore } from '../showcase/tasteShowcase';
import { loadTrust } from '../residents/residents';
import type { TreasureStore } from '../treasure/treasureStore';
import { TREASURE_BY_ID } from '../treasure/treasures';
import { drawGem } from '../../ui/treasureIcons';
import { makeTexture } from '../art/pixelCanvas';
import { PAL } from '../art/palette';
import {
  fetchInventory, fetchPlacements, insertPlacement, deletePlacement,
  subscribePlacements, grantStarterOnce, setRoomPublic,
} from '../../db/roomsApi';
import { fetchHomeGuestbook, leaveHomeGuestbook } from '../../db/homeSocialApi';
import { applyHomeLayout, fetchHomeLayouts, saveHomeLayout } from '../../db/homeLayoutsApi';

interface RoomData {
  roomId: number;
  isOwner: boolean;
  peer: PeerState;
  adapter: NetworkAdapter | null;
  houseType?: HouseType;
  floorSeed?: number;
  dealType?: DealType | null;
  returnScene?: 'street' | 'iso-village';
  returnSpawnTile?: { tx: number; ty: number };
  visitOwner?: { userId: string; nickname: string };
  isPublic?: boolean;
}

export class RoomScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';

  private roomId = 1;
  private isOwner = false;
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private sb: SupabaseClient | null = null;
  private plan!: FloorPlan;
  private region!: PlaceRegion;
  private houseType: HouseType = 'oneroom';
  private dealType: DealType | null = null;
  private returnScene: 'street' | 'iso-village' = 'street';
  private returnSpawnTile: { tx: number; ty: number } | null = null;
  private visitOwner: { userId: string; nickname: string } | null = null;
  private isPublic = false;
  private openHomeBusy = false;

  private placed: Placed[] = [];
  private placedGfx = new Map<string, Phaser.GameObjects.Image | Phaser.GameObjects.Graphics>();
  private placedShadows = new Map<string, Phaser.GameObjects.Ellipse>();
  private inv: InventoryBar | null = null;
  private counts = new Map<string, number>();
  private ghost: Phaser.GameObjects.Graphics | null = null;
  private ghostLabel: Phaser.GameObjects.Text | null = null;
  private ghostRot: Rot = 0;
  private ghostTile = { tx: 2, ty: 2 };
  private unsubscribe: (() => void) | null = null;
  private hint: HTMLDivElement | null = null;
  private exitBtn: ExitButton | null = null;
  private homeDesign: HomeDesignPanel | null = null;
  private homeGuestbook: HomeGuestbookPanel | null = null;
  private homeLayoutPanel: HomeLayoutPanel | null = null;
  private homeLayoutStore!: HomeLayoutStore;
  private homeLayoutBusy = false;
  private furnitureReformPanel: FurnitureReformPanel | null = null;
  private furnitureReformStore!: FurnitureReformStore;
  private homeMoodboardPanel: HomeMoodboardPanel | null = null;
  private homeMoodboardStore!: HomeMoodboardStore;
  private homeStudioCardPanel: HomeStudioCardPanel | null = null;
  private homeStudioCardStore!: HomeStudioCardStore;
  private fanRoomPanel: FanRoomPanel | null = null;
  private fanRoomStore!: FanRoomDisplayStore;
  private fanMerchStore!: FanMerchWorkshopStore;
  private fanRoomDisplay: Phaser.GameObjects.Image | null = null;
  private petMemoryWallPanel: PetMemoryWallPanel | null = null;
  private petMemoryWallStore!: PetMemoryWallStore;
  private petMeetPostcardStore!: PetMeetPostcardStore;
  private petMemoryWallDisplay: Phaser.GameObjects.Image | null = null;
  private homeObjectStoryPanel: HomeObjectStoryPanel | null = null;
  private homeObjectStoryStore!: HomeObjectStoryStore;
  private achievementStore!: AchievementStore;
  private homeAquariumPanel: HomeAquariumPanel | null = null;
  private fishingPanel: FishingPanel | null = null;
  private homeAquariumStore!: HomeAquariumStore;
  private fishingStore!: FishingStore;
  private homeVisits: HomeVisitStore | null = null;
  private offlineRoom: OfflineRoomStore | null = null;
  private readonly petStore = new PetStore();
  private pet: PetFollower | null = null;
  private petHomeStore!: PetHomeMemoryStore;
  private tasteShowcaseStore!: TasteShowcaseStore;
  private petHomeSession = new Set<string>();
  private guestSprite: Phaser.GameObjects.Sprite | null = null;
  private guestLabel: Phaser.GameObjects.Text | null = null;
  private guestBubble: Phaser.GameObjects.Text | null = null;
  private homeVisitReadyPreview = false;
  private homeAquariumReadyPreview = false;
  private reformReadyPreview = false;
  private dioramaReadyPreview = false;
  private petHomeReadyPreview = false;
  private moodboardReadyPreview = false;
  private touch: TouchControls | null = null;
  private localSeq = 0;
  private roomStructure: Phaser.GameObjects.Graphics[] = [];
  private actorWorld = { x: 0, y: 0 };
  private baseRoomHint = '';
  private readonly homeEditHistory = new HomeEditHistory(50);
  private homeEditControls: HTMLDivElement | null = null;
  private homeEditBusy = false;
  private homeEditKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private qualityUnsubscribe: (() => void) | null = null;

  constructor() { super('room'); }

  preload(): void {
    // AI 방 재질·가구 스프라이트 — 404여도 프로시저럴 폴백으로 계속
    for (const m of ROOM_MATERIALS) {
      if (!this.textures.exists(m.key)) this.load.image(m.key, m.url);
    }
    for (const f of FURNITURE_ASSETS) {
      for (const rot of f.rots) {
        const key = furnitureAssetKey(f.itemId, rot);
        if (!this.textures.exists(key)) this.load.image(key, `assets/furniture/${f.itemId}_${rot}.png`);
      }
    }
    this.load.on('loaderror', (file: { key: string }) => {
      console.warn('[홍대마을] 자산 로드 실패(프로시저럴 폴백):', file.key);
    });
  }

  init(data: RoomData): void {
    this.roomId = data.roomId;
    this.isOwner = data.isOwner;
    this.peer = data.peer;
    this.adapter = data.adapter ?? null;
    this.sb = (this.registry.get('sb') as SupabaseClient | undefined) ?? null;
    this.houseType = data.houseType ?? 'oneroom';
    this.dealType = data.dealType ?? null;
    this.returnScene = data.returnScene ?? 'street';
    this.returnSpawnTile = data.returnSpawnTile ?? null;
    this.visitOwner = !data.isOwner && data.visitOwner ? { ...data.visitOwner } : null;
    this.isPublic = data.isPublic === true;
    this.openHomeBusy = false;
    this.plan = generateFloorPlan(this.houseType, data.floorSeed ?? this.roomId);
    this.region = {
      x: 1, y: 1, w: this.plan.w - 2, h: this.plan.h - 2, wallRow: 1,
      isBlocked: (tx, ty) => !isPlaceableTile(this.plan, tx, ty),
    };
    this.placed = [];
    this.placedGfx.clear();
    this.ghost = null;
    this.ghostRot = 0;
    this.offlineRoom = null;
    this.homeVisits = new HomeVisitStore(this.peer.userId);
    this.petHomeStore = new PetHomeMemoryStore(this.peer.userId);
    this.tasteShowcaseStore = new TasteShowcaseStore(this.peer.userId);
    this.petHomeSession.clear();
    this.homeEditHistory.clear();
    this.homeEditBusy = false;
    this.homeAquariumStore = this.registry.get('homeAquarium') as HomeAquariumStore;
    this.fishingStore = this.registry.get('fishing') as FishingStore;
    this.furnitureReformStore = this.registry.get('furnitureReform') as FurnitureReformStore;
    this.homeMoodboardStore = new HomeMoodboardStore(this.peer.userId);
    this.homeStudioCardStore = new HomeStudioCardStore(this.peer.userId);
    this.fanRoomStore = new FanRoomDisplayStore(this.peer.userId);
    this.fanMerchStore = new FanMerchWorkshopStore(this.peer.userId);
    this.petMemoryWallStore = new PetMemoryWallStore(this.peer.userId);
    this.petMeetPostcardStore = new PetMeetPostcardStore(this.peer.userId);
    this.homeObjectStoryStore = new HomeObjectStoryStore(this.peer.userId);
    this.homeLayoutStore = new HomeLayoutStore(this.peer.userId, this.roomId);
    this.homeLayoutBusy = false;
    this.achievementStore = new AchievementStore(this.peer.userId);
    const questStore = this.registry.get('quests') as QuestStore;
    if (questStore) this.achievementStore.sync(questStore.views());
    this.homeVisitReadyPreview = import.meta.env.DEV && (
      new URLSearchParams(location.search).has('home-visit-ready')
      || new URLSearchParams(location.search).has('neighbor-home-tour')
    );
    const params = new URLSearchParams(location.search);
    this.homeAquariumReadyPreview = import.meta.env.DEV && params.has('aquarium-ready');
    this.reformReadyPreview = import.meta.env.DEV && params.has('reform-ready');
    this.dioramaReadyPreview = import.meta.env.DEV && params.has('diorama-ready');
    this.petHomeReadyPreview = import.meta.env.DEV && params.has('pet-home-ready');
    this.moodboardReadyPreview = import.meta.env.DEV && params.has('moodboard-ready');
    if (import.meta.env.DEV && (params.has('pet-memory-wall-ready') || params.has('pet-memory-wall-world'))) {
      const myPet = {
        petId: 'dog', personalityId: 'gentle', accessoryId: 'scarf',
        backdropId: 'rain_window', poseId: 'look_back',
      } as const;
      const neighbors = [
        {
          id: 'memory-neighbor-a', name: '새벽별', kind: 'rain_shelter',
          pet: {
            petId: 'cat', personalityId: 'calm', accessoryId: 'beret',
            backdropId: 'cozy_home', poseId: 'daydream',
          },
        },
        {
          id: 'memory-neighbor-b', name: '단풍잎', kind: 'roof_garden',
          pet: {
            petId: 'rabbit', personalityId: 'curious', accessoryId: 'ribbon',
            backdropId: 'roof_garden', poseId: 'hello',
          },
        },
        {
          id: 'memory-neighbor-c', name: '밤산책', kind: 'little_stage',
          pet: {
            petId: 'fox', personalityId: 'playful', accessoryId: 'bandana',
            backdropId: 'alley_neon', poseId: 'spotlight',
          },
        },
      ] as const;
      neighbors.forEach((neighbor, index) => {
        this.petMeetPostcardStore.receive(
          neighbor.id, neighbor.name, neighbor.kind, myPet, neighbor.pet,
          Date.UTC(2026, 6, 20 + index, 3),
        );
      });
      if (this.petMemoryWallStore.featured().length === 0) {
        this.petMeetPostcardStore.postcards().slice(0, 3).forEach((record) => this.petMemoryWallStore.toggle(record));
      }
    }
    if (this.petHomeReadyPreview) {
      this.petStore.adopt('dog'); this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'calm');
    }
    if (import.meta.env.DEV && params.has('aquarium-ready')) {
      const waters = ['rail_garden', 'moon_channel'] as const;
      let guard = 0;
      while ((this.fishingStore.progress().speciesDiscovered < 12
        || this.fishingStore.progress().recordStamps < 24
        || this.fishingStore.progress().goldRecords < 3) && guard < 60) {
        this.fishingStore.cast(waters[guard % waters.length]!, 'glimmer');
        guard += 1;
      }
      if (!this.homeAquariumStore.progress(this.fishingStore).configured) {
        this.homeAquariumStore.save({
          frameId: 'greenhouse', substrateId: 'brick_chip', ornamentId: 'mini_bridge',
          fishIds: Object.keys(this.fishingStore.get().records).slice(0, 3),
        }, this.fishingStore);
      }
    }
  }

  create(): void {
    // 부동산 평면 기반 충돌: 테두리(문 제외) + 내부 칸막이(통로 제외)
    this.rebuildRoomCollision();
    this.cameras.main.setBackgroundColor('#171411');
    this.add.image(0, 0, makeIsometricRoomBackground(this, this.plan, this.roomId)).setOrigin(0).setDepth(0);
    this.roomStructure = addIsometricRoomInteriorWalls(this, this.plan);

    // 방 이름표 (구획별)
    for (const rm of this.plan.rooms) {
      const center = projectRoomTile(
        this.plan, rm.rect.x + rm.rect.w / 2, rm.rect.y + rm.rect.h / 2,
      );
      this.add.text(center.x, center.y, rm.name, {
        fontFamily: UI_FONT, fontSize: '9px', color: '#8a6a4a', resolution: TEXT_RES,
      }).setOrigin(0.5).setDepth(50 + center.y).setAlpha(0.5);
    }

    if (this.isOwner) {
      this.drawTreasureDisplay();
      this.redrawFanRoomDisplay();
      this.redrawPetMemoryWall();
    }

    const spawn = tileToWorld(this.plan.spawn.tx, this.plan.spawn.ty);
    this.actorWorld = { x: spawn.x + TILE / 2, y: spawn.y + TILE / 2 };
    const actor = isometricActorPose(this.plan, this.actorWorld.x, this.actorWorld.y);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(
      actor.x, actor.y, this.charKey, 3 * FRAMES_PER_DIR,
    ).setOrigin(0.5, CHAR_ORIGIN_Y).setDepth(actor.depth);
    this.facing = 3; // 문으로 들어와 위를 보는 상태
    const activePetId = this.petStore.activeId();
    this.pet = new PetFollower(
      this, activePetId, activePetId ? this.petStore.accessory(activePetId) : 'none',
      activePetId ? this.petStore.nickname(activePetId) : null,
    );
    this.pet.setStage(activePetId ? this.petStore.stage(activePetId) : 0);

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    const cam = this.cameras.main;
    this.fitRoomCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.fitRoomCamera, this);

    // 월세 청구 (온라인·월세 계약 시 서울 자정 경과분 자동 납부)
    if (this.sb && this.isOwner && this.dealType === 'wolse') {
      void chargeRent(this.sb, this.roomId).then((due) => {
        if (due && due > 0) this.showRentNotice(due);
      });
    }

    if (isTouchDevice()) {
      this.touch = new TouchControls([
        { emoji: 'R4', label: '4방향 회전', onTap: () => this.rotateGhost() },
        { emoji: 'ESC', label: '선택 해제', onTap: () => this.inv?.clearSelection() },
      ]);
    }

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    kb.on('keydown-R', () => this.rotateGhost());
    kb.on('keydown-ESC', () => this.inv?.clearSelection());

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    const label = HOUSE_SPECS[this.houseType].label + (this.dealType ? ` · ${DEAL_LABEL[this.dealType]}` : '');
    this.baseRoomHint = this.isOwner
      ? `${label} · ${isTouchDevice() ? '빈 곳을 누른 채 끌어 이동' : 'WASD 이동'} · 가구 선택→클릭 배치 · R 4방향 회전 · 배치물 클릭 제거`
      : `${label} · ${this.visitOwner?.nickname ?? '이웃'}님의 열린 집 (읽기 전용)`;
    this.hint.textContent = this.baseRoomHint;
    document.body.appendChild(this.hint);
    this.exitBtn = new ExitButton(() => this.exitToStreet());
    const togglePanel = (open: boolean) => {
      if (this.input.keyboard) this.input.keyboard.enabled = !open;
      if (open) this.inv?.clearSelection();
    };
    if (this.isOwner) {
      this.fishingPanel = new FishingPanel(this.fishingStore, {
        onToggle: togglePanel,
        onChanged: () => {
          this.syncFishingMetrics();
          this.syncAquariumMetrics();
          this.homeAquariumPanel?.refresh();
          this.refreshHomeDesign(true);
        },
      });
      this.homeAquariumPanel = new HomeAquariumPanel(this.homeAquariumStore, this.fishingStore, {
        onToggle: togglePanel,
        onOpenFishing: () => this.fishingPanel?.open(),
        hasPlacedTank: () => this.placed.some((placed) => placed.itemId === 'fish_tank'),
        onSaved: () => {
          this.redrawPlacements();
          this.syncAquariumMetrics();
          this.refreshHomeDesign(true);
        },
      });
    }
    this.homeDesign = new HomeDesignPanel({
      onToggle: (open) => {
        if (this.input.keyboard) this.input.keyboard.enabled = !open;
        if (open) this.inv?.clearSelection();
      },
      onInvite: this.isOwner ? (residentId) => this.handleHomeVisit(residentId) : undefined,
      onOpenAquarium: this.isOwner ? () => this.homeAquariumPanel?.open() : undefined,
      onOpenReform: this.isOwner ? () => this.furnitureReformPanel?.open(this.placed) : undefined,
      onOpenMoodboards: this.isOwner ? () => this.homeMoodboardPanel?.open() : undefined,
      onOpenLayouts: this.isOwner ? () => void this.homeLayoutPanel?.open() : undefined,
      onOpenStudio: this.isOwner ? () => this.homeStudioCardPanel?.open() : undefined,
      onOpenFanRoom: this.isOwner ? () => this.fanRoomPanel?.open() : undefined,
      onOpenPetMemoryWall: this.isOwner ? () => this.petMemoryWallPanel?.open() : undefined,
      onOpenObjectStories: this.isOwner ? () => this.homeObjectStoryPanel?.open() : undefined,
      onFindPetFurniture: this.isOwner ? (itemId) => {
        const selected = this.inv?.select(itemId) ?? false;
        if (!selected && this.hint) {
          const item = CATALOG_BY_ID.get(itemId);
          this.hint.textContent = `${item?.name ?? '추천 가구'}는 가구함에 아직 없어요. 살림 쇼룸의 기본·주간·DIY 경로에서 천천히 구할 수 있어요.`;
        }
        return selected;
      } : undefined,
      tourHost: this.visitOwner?.nickname,
      getHomeOpen: this.isOwner ? () => ({ isPublic: this.isPublic, online: !!this.sb, busy: this.openHomeBusy }) : undefined,
      onToggleHomeOpen: this.isOwner ? () => { void this.toggleHomeOpen(); } : undefined,
    });
    if (this.isOwner) {
      this.homeStudioCardPanel = new HomeStudioCardPanel(this.homeStudioCardStore, {
        onToggle: togglePanel,
        getContext: () => this.homeStudioCardContext(),
        onChanged: (progress) => this.handleHomeStudioCardChanged(progress),
      });
      this.writeHomeStudioCardMetrics(this.homeStudioCardStore.progress());
      this.fanRoomPanel = new FanRoomPanel(this.fanRoomStore, this.fanMerchStore, {
        onToggle: togglePanel,
        onChanged: (progress) => this.handleFanRoomChanged(progress),
      });
      this.writeFanRoomMetrics(this.fanRoomStore.progress(featuredFanMerch(this.fanMerchStore.get()).length));
      this.petMemoryWallPanel = new PetMemoryWallPanel(this.petMemoryWallStore, this.petMeetPostcardStore, {
        onToggle: togglePanel,
        onChanged: (progress) => this.handlePetMemoryWallChanged(progress),
      });
      this.writePetMemoryWallMetrics(this.petMemoryWallStore.progress());
      this.homeObjectStoryPanel = new HomeObjectStoryPanel(this.homeObjectStoryStore, {
        onToggle: togglePanel,
        getContext: () => ({ counts: this.counts, placed: this.placed }),
        onChanged: (progress) => this.handleObjectStoryChanged(progress),
      });
      this.writeObjectStoryMetrics(this.homeObjectStoryStore.progress());
    }
    this.mountHomeGuestbook(togglePanel);
    if (this.isOwner) this.mountHomeLayoutPanel(togglePanel);
    if (this.isOwner) this.mountHomeEditControls();
    if (this.isOwner) {
      this.furnitureReformPanel = new FurnitureReformPanel(this.furnitureReformStore, {
        onToggle: togglePanel,
        getQuestState: () => (this.registry.get('quests') as QuestStore).get(),
        getUnlockedBadgeIds: () => this.achievementStore.get().unlocked,
        onApplied: (progress) => this.handleFurnitureReform(progress),
      });
      this.homeMoodboardPanel = new HomeMoodboardPanel(this.homeMoodboardStore, {
        onToggle: togglePanel,
        getContext: () => this.homeMoodboardContext(),
        previewForItem: (itemId) => furnitureWorkshopPreview(this, itemId),
        onFindItem: (itemId) => {
          const selected = this.inv?.select(itemId) ?? false;
          if (this.hint) {
            const item = CATALOG_BY_ID.get(itemId);
            this.hint.textContent = selected
              ? `${item?.name ?? '테마 가구'} 배치를 시작했어요. 원하는 칸을 눌러 주세요.`
              : `${item?.name ?? '테마 가구'}는 아직 없어요. 거리의 살림 쇼룸에서 기본·주간·DIY 경로를 확인해 보세요.`;
          }
          return selected;
        },
        onOpenReform: () => this.furnitureReformPanel?.open(this.placed),
        onChanged: (progress) => this.handleHomeMoodboard(progress),
      });
    }
    this.refreshHomeDesign();
    this.qualityUnsubscribe = performanceComfort.subscribe(() => this.applyPerformanceComfort());

    if (import.meta.env.DEV && new URLSearchParams(location.search).has('home-visit-book')) {
      this.time.delayedCall(180, () => this.homeDesign?.openAlbum());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('aquarium')) {
      this.time.delayedCall(180, () => this.homeAquariumPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('moodboard')) {
      this.time.delayedCall(260, () => this.homeMoodboardPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('home-studio')) {
      this.time.delayedCall(280, () => this.homeStudioCardPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('fan-room')) {
      this.time.delayedCall(290, () => this.fanRoomPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('pet-memory-wall-ready')) {
      this.time.delayedCall(300, () => this.petMemoryWallPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('object-stories')) {
      this.time.delayedCall(300, () => this.homeObjectStoryPanel?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('guestbook')) {
      this.time.delayedCall(260, () => void this.homeGuestbook?.open());
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('layouts')) {
      this.time.delayedCall(520, () => void this.homeLayoutPanel?.open());
    }

    void this.loadRoom();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    performanceComfort.recordFrame(delta);
    const t = this.touch?.getInput();
    const input: MoveInput = {
      up: this.keys.W.isDown || !!t?.up,
      down: this.keys.S.isDown || !!t?.down,
      left: this.keys.A.isDown || !!t?.left,
      right: this.keys.D.isDown || !!t?.right,
    };
    const worldInput = screenInputToWorld(input);
    const next = stepPlayer(
      this.actorWorld, worldInput, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.actorWorld = next;
    const actor = isometricActorPose(this.plan, next.x, next.y);
    this.player.setPosition(actor.x, actor.y).setDepth(actor.depth);
    this.pet?.update(actor.x, actor.y, delta);
    this.pet?.setDepth(1_000 + (this.pet.worldY() ?? actor.y - 2));

    // 방향·걷기 애니메이션
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
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

    // 문 타일에 서면 거리로 퇴장 — 들어온 집 문 앞으로 복귀
    const { tx, ty } = worldToTile(next.x, next.y);
    if (tx === this.plan.door.tx && ty === this.plan.door.ty) this.exitToStreet();
  }

  private exitToStreet(): void {
    const door = HOUSE_DOORS.find((d) => d.roomId === this.roomId);
    const spawnTile = this.returnSpawnTile ?? (door ? { tx: door.tx, ty: door.ty + 1 } : undefined);
    this.scene.start(this.returnScene, { peer: this.peer, adapter: this.adapter, spawnTile });
  }

  /** 화면 회전·창 크기 변경 뒤에도 작은 방이 검은 여백 밖으로 밀려나지 않게 다시 맞춘다. */
  private fitRoomCamera(gameSize?: Phaser.Structs.Size): void {
    const width = gameSize?.width ?? this.scale.width;
    const height = gameSize?.height ?? this.scale.height;
    const layout = isometricRoomLayout(this.plan);
    const cam = this.cameras.main;
    // 레이아웃의 투명 안전 여백은 화면 맞춤 계산에서 제외해 작은 모바일 방도 읽기 쉽게 키운다.
    const fit = Math.min((width - 16) / (layout.width - 96), (height - 112) / (layout.height - 38));
    cam.setZoom(Phaser.Math.Clamp(fit, .42, Math.max(1.05, ZOOM - .35)));
    cam.centerOn(layout.width / 2, layout.height / 2 + 8);
  }

  private showRentNotice(due: number): void {
    const el = document.createElement('div');
    el.className = 'hv-hint';
    el.style.cssText = 'top:70px;bottom:auto;left:50%;transform:translateX(-50%);color:#e88a6a;opacity:1';
    el.textContent = `⚠️ 월세 미납 ${due.toLocaleString()}코인 — 부동산에서 납부하세요`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  // --- 데이터 ---

  private rebuildRoomCollision(): void {
    const { w, h, door, walls, doorGaps } = this.plan;
    const furniture = blockingTiles(this.placed).map((tile) => ({ x: tile.tx, y: tile.ty, w: 1, h: 1 }));
    this.grid = CollisionGrid.fromRects(w, h, [
      { x: 0, y: 0, w, h: 1 },
      { x: 0, y: h - 1, w: door.tx, h: 1 },
      { x: door.tx + 1, y: h - 1, w: w - door.tx - 1, h: 1 },
      { x: 0, y: 0, w: 1, h },
      { x: w - 1, y: 0, w: 1, h },
      ...walls,
      ...furniture,
    ], doorGaps);
  }

  private async loadRoom(): Promise<void> {
    if (this.sb) {
      this.placed = await fetchPlacements(this.sb, this.roomId);
      this.redrawPlacements();
      this.unsubscribe = subscribePlacements(this.sb, this.roomId, () => void this.refresh());
      if (this.isOwner) {
        // 시작 세트가 확장되면 기존 유저도 부족분을 받는다 (없는 아이템만 채움)
        await grantStarterOnce(this.sb, this.peer.userId);
        this.counts = await fetchInventory(this.sb, this.peer.userId);
        this.mountInventory();
      }
    } else if (this.isOwner) {
      // 오프라인도 사용자·방별로 배치와 인벤토리를 영구 보존한다.
      this.offlineRoom = new OfflineRoomStore(this.peer.userId, this.roomId);
      this.placed = this.offlineRoom.placements();
      this.counts = this.offlineRoom.counts();
      this.redrawPlacements();
      this.mountInventory();
    }
    this.localSeq = this.placed.reduce((largest, placed) => {
      const match = /^local-(\d+)$/.exec(placed.id);
      return match ? Math.max(largest, Number(match[1])) : largest;
    }, 0);
    if (this.homeVisitReadyPreview) {
      const ids = [
        'guitar', 'mic_stand', 'turntable', 'speaker_amp', 'bed_basic', 'sofa_single',
        'desk_wood', 'bookshelf', 'lamp_stand', 'rug_cream', 'plant_pot',
      ];
      this.placed = ids.map((itemId, index) => ({
        id: `visit-preview-${index}`, itemId,
        tx: 2 + (index % 5) * 2, ty: 2 + Math.floor(index / 5) * 2, rot: 0,
      }));
      this.redrawPlacements();
    }
    if (this.homeAquariumReadyPreview && !this.placed.some((placed) => placed.itemId === 'fish_tank')) {
      this.placed.push({ id: 'aquarium-preview-tank', itemId: 'fish_tank', tx: 2, ty: 2, rot: 0 });
      this.redrawPlacements();
    }
    if (this.dioramaReadyPreview) {
      this.placed = [
        { id: 'diorama-bed-north', itemId: 'bed_basic', tx: 1, ty: 1, rot: 0 },
        { id: 'diorama-desk-east', itemId: 'desk_wood', tx: 4, ty: 1, rot: 1 },
        { id: 'diorama-chair-south', itemId: 'chair_wood', tx: 5, ty: 2, rot: 2 },
        { id: 'diorama-lamp-west', itemId: 'lamp_stand', tx: 4, ty: 4, rot: 3 },
        { id: 'diorama-rug-east', itemId: 'rug_cream', tx: 3, ty: 3, rot: 1 },
        { id: 'diorama-poster', itemId: 'poster_band', tx: 3, ty: 1, rot: 0 },
      ];
      this.redrawPlacements();
    }
    if (this.reformReadyPreview) {
      this.placed = [
        { id: 'reform-preview-bed', itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 },
        { id: 'reform-preview-desk', itemId: 'desk_wood', tx: 5, ty: 2, rot: 0 },
        { id: 'reform-preview-chair', itemId: 'chair_wood', tx: 6, ty: 4, rot: 0 },
        { id: 'reform-preview-rug', itemId: 'rug_cream', tx: 4, ty: 5, rot: 0 },
      ];
      this.redrawPlacements();
    }
    if (this.petHomeReadyPreview) {
      this.placed = [
        { id: 'pet-home-bed', itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 },
        { id: 'pet-home-plant', itemId: 'plant_pot', tx: 6, ty: 2, rot: 0 },
        { id: 'pet-home-books', itemId: 'bookshelf', tx: 8, ty: 2, rot: 0 },
        { id: 'pet-home-rug', itemId: 'rug_cream', tx: 4, ty: 5, rot: 0 },
        { id: 'pet-home-guitar', itemId: 'guitar', tx: 7, ty: 5, rot: 0 },
      ];
      this.redrawPlacements();
    }
    if (this.moodboardReadyPreview) {
      const ids = ['bed_basic', 'desk_wood', 'lamp_stand', 'plant_pot'] as const;
      this.placed = ids.map((itemId, index) => ({
        id: `moodboard-preview-${index}`, itemId, tx: 2 + index * 2, ty: 2 + (index % 2) * 2, rot: 0,
      }));
      this.redrawPlacements();
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('layout-ready')) this.seedHomeLayoutPreview();
    this.ensurePlayerClearOfFurniture();
    this.recordNeighborHomeTour();
    this.refreshHomeDesign(true);
    this.time.delayedCall(260, () => this.playPetHomeMoment());
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('reform')) {
      this.time.delayedCall(100, () => this.furnitureReformPanel?.open(this.placed));
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('moodboard')) {
      this.time.delayedCall(120, () => this.homeMoodboardPanel?.refresh());
    }
  }

  private async refresh(): Promise<void> {
    if (!this.sb || this.homeLayoutBusy) return;
    this.placed = await fetchPlacements(this.sb, this.roomId);
    this.redrawPlacements();
    this.ensurePlayerClearOfFurniture();
    this.refreshHomeDesign();
  }

  private mountInventory(): void {
    this.inv = new InventoryBar((itemId) => this.setGhost(itemId));
    this.inv.setCounts(this.counts);
  }

  // --- 렌더 ---

  private redrawPlacements(): void {
    for (const c of this.placedGfx.values()) c.destroy();
    for (const shadow of this.placedShadows.values()) shadow.destroy();
    this.placedGfx.clear();
    this.placedShadows.clear();
    for (const p of this.placed) this.drawPlaced(p);
    this.rebuildRoomCollision();
  }

  private ensurePlayerClearOfFurniture(): void {
    if (!this.player?.active) return;
    const blocked = new Set(blockingTiles(this.placed).map((tile) => `${tile.tx},${tile.ty}`));
    const current = worldToTile(this.actorWorld.x, this.actorWorld.y);
    if (!blocked.has(`${current.tx},${current.ty}`)) return;
    const candidates: Array<{ tx: number; ty: number }> = [];
    for (let ty = 1; ty < this.plan.h - 1; ty += 1) {
      for (let tx = 1; tx < this.plan.w - 1; tx += 1) {
        if (isPlaceableTile(this.plan, tx, ty) && !blocked.has(`${tx},${ty}`)) candidates.push({ tx, ty });
      }
    }
    candidates.sort((a, b) => (
      Math.abs(a.tx - current.tx) + Math.abs(a.ty - current.ty)
      - Math.abs(b.tx - current.tx) - Math.abs(b.ty - current.ty)
    ));
    const safe = candidates[0];
    if (!safe) return;
    const world = tileToWorld(safe.tx, safe.ty);
    this.actorWorld = { x: world.x + TILE / 2, y: world.y + TILE / 2 };
    const actor = isometricActorPose(this.plan, this.actorWorld.x, this.actorWorld.y);
    this.player.setPosition(actor.x, actor.y).setDepth(actor.depth);
  }

  /** 현재 방의 생활성·다양성·테마를 계산해 UI와 장기 퀘스트에 연결한다. */
  private refreshHomeDesign(syncQuests = false): void {
    const analysis = analyzeHomeDesign(this.placed);
    if (this.isOwner) this.tasteShowcaseStore?.updateHome(analysis, this.placed.map((item) => item.itemId));
    if (this.isOwner) {
      this.homeObjectStoryStore.discoverAvailable([
        ...[...this.counts.entries()].filter(([, count]) => count > 0).map(([itemId]) => itemId),
        ...this.placed.map((item) => item.itemId),
      ]);
    }
    const context = this.homeVisitContext(analysis);
    const visits = this.isOwner ? this.homeVisits?.views(context) ?? [] : [];
    const activePetId = this.petStore.activeId();
    const petHome: HomePetView | null = this.isOwner && activePetId ? {
      petId: activePetId,
      petName: this.petStore.displayName(activePetId),
      accessory: this.petStore.accessory(activePetId),
      comfort: evaluatePetHome(this.petStore.personality(activePetId), this.placed),
      memories: this.petHomeStore.views(activePetId),
    } : null;
    const moodboards = this.isOwner ? this.homeMoodboardStore.progress(this.homeMoodboardContext(analysis)) : null;
    this.homeDesign?.update(
      analysis, visits,
      this.isOwner ? this.homeAquariumStore.progress(this.fishingStore) : null,
      this.isOwner ? this.furnitureReformStore.progress() : null,
      petHome, moodboards,
      this.isOwner ? this.homeObjectStoryStore.progress() : null,
    );
    this.homeMoodboardPanel?.refresh();
    this.homeObjectStoryPanel?.refresh();
    if (!syncQuests || !this.isOwner) return;
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (this.isPublic) quests?.setMetric('home_open_public', 1);
    quests?.setMetric('home_unique_items', analysis.uniqueCount);
    quests?.setMetric('home_categories', analysis.categoryCount);
    quests?.setMetric('home_score', analysis.score);
    quests?.setMetric('home_theme_power', analysis.themePower);
    this.writeObjectStoryMetrics(this.homeObjectStoryStore.progress());
    const visitProgress = this.homeVisits?.progress();
    if (visitProgress) {
      quests?.setMetric('home_visits', visitProgress.recorded);
      quests?.setMetric('home_pet_visits', visitProgress.withPet);
    }
    quests?.setMetric('pet_home_memories', this.petHomeStore.uniqueCount());
    quests?.setMetric('pet_home_scenes', this.petHomeStore.totalScenes());
    quests?.setMetric('pet_home_personalities', this.petHomeStore.personalityCount());
    quests?.setMetric('pet_home_partners', this.petHomeStore.petPartners());
    if (petHome) quests?.setMetric('pet_home_comfort', petHome.comfort.score);
    this.syncFishingMetrics();
    this.syncAquariumMetrics();
    this.syncFurnitureReformMetrics();
    if (moodboards) this.writeHomeMoodboardMetrics(moodboards);
  }

  private recordNeighborHomeTour(): void {
    if (this.isOwner || !this.visitOwner) return;
    const store = new NeighborHomeTourStore(this.peer.userId);
    const result = store.record(
      this.visitOwner.userId, this.visitOwner.nickname, this.roomId, this.houseType,
      analyzeHomeDesign(this.placed), this.placed.map((item) => item.itemId),
    );
    const progress = store.progress();
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.setMetric('neighbor_home_tours', progress.tours);
    quests?.setMetric('neighbor_homes_visited', progress.neighbors);
    quests?.setMetric('neighbor_home_themes', progress.themes);
    quests?.setMetric('neighbor_home_grades', progress.grades);
    quests?.setMetric('neighbor_home_types', progress.houseTypes);
    quests?.setMetric('neighbor_home_favorites', progress.favorites);
    if (this.hint) this.hint.textContent = result === 'recorded'
      ? `${this.visitOwner.nickname}님의 열린 집 · 새 투어 도장을 수첩에 남겼어요 (읽기 전용)`
      : `${this.visitOwner.nickname}님의 열린 집 · 오늘의 도장은 이미 있어요. 읽기 전용으로 편하게 둘러보세요.`;
  }

  private async toggleHomeOpen(): Promise<void> {
    if (!this.isOwner || !this.sb || this.openHomeBusy) return;
    this.openHomeBusy = true; this.refreshHomeDesign();
    const next = !this.isPublic;
    const saved = await setRoomPublic(this.sb, this.roomId, next);
    this.openHomeBusy = false;
    if (saved) {
      this.isPublic = next;
      const quests = this.registry.get('quests') as QuestStore | undefined;
      if (next) quests?.setMetric('home_open_public', 1);
      if (this.hint) this.hint.textContent = next
        ? '열린 집으로 저장했어요. 이웃은 읽기 전용으로만 방문하고, 언제든 다시 닫을 수 있어요.'
        : '집 문을 닫았어요. 기존 투어 엽서는 남지만 새로운 온라인 방문은 멈춥니다.';
    } else if (this.hint) this.hint.textContent = '집 공개 설정을 저장하지 못했어요. 연결을 확인한 뒤 다시 눌러 주세요.';
    this.refreshHomeDesign();
  }

  private mountHomeLayoutPanel(onToggle: (open: boolean) => void): void {
    this.homeLayoutPanel = new HomeLayoutPanel({
      online: !!this.sb,
      onToggle,
      currentSnapshot: (slot, labelId) => this.currentHomeLayoutSnapshot(slot, labelId),
      loadSlots: async () => {
        if (this.sb) {
          const serverSlots = await fetchHomeLayouts(this.sb, this.roomId);
          this.homeLayoutStore.replaceFromServer(serverSlots);
          return serverSlots.flatMap((slot) => this.homeLayoutStore.snapshot(slot.slot) ?? []);
        }
        return this.homeLayoutStore.snapshots();
      },
      saveSlot: (slot, labelId) => this.saveHomeLayoutSlot(slot, labelId),
      applySlot: (slot) => this.applyHomeLayoutSlot(slot),
      onChanged: (progress) => this.writeHomeLayoutMetrics(progress),
    });
    this.writeHomeLayoutMetrics(this.homeLayoutStore.progress());
  }

  private currentHomeLayoutSnapshot(slot: number, labelId: HomeLayoutLabelId): HomeLayoutSnapshot {
    return makeHomeLayoutSnapshot(slot, labelId, this.placed, (placementId) => {
      const style = this.furnitureReformStore.styleFor(placementId);
      return style ? { finishId: style.finishId, colorId: style.colorId } : null;
    });
  }

  private async saveHomeLayoutSlot(slot: number, labelId: HomeLayoutLabelId): Promise<HomeLayoutPanelResult> {
    if (!this.isOwner || this.homeLayoutBusy) return { ok: false, reason: 'owner' };
    this.homeLayoutBusy = true;
    try {
      const current = this.currentHomeLayoutSnapshot(slot, labelId);
      if (this.sb) {
        const result = await saveHomeLayout(this.sb, this.roomId, slot, labelId);
        if (!result.ok) return { ok: false, reason: result.reason };
        current.savedAt = result.snapshot.savedAt;
        current.saveCount = result.snapshot.saveCount;
        current.applyCount = result.snapshot.applyCount;
      }
      const saved = this.homeLayoutStore.save(current);
      this.writeHomeLayoutMetrics(this.homeLayoutStore.progress());
      return { ok: true, snapshot: saved };
    } finally { this.homeLayoutBusy = false; }
  }

  private async applyHomeLayoutSlot(slot: number): Promise<HomeLayoutPanelResult> {
    if (!this.isOwner || this.homeLayoutBusy) return { ok: false, reason: 'owner' };
    const localSnapshot = this.homeLayoutStore.snapshot(slot);
    if (!localSnapshot) return { ok: false, reason: 'empty' };
    this.homeLayoutBusy = true; this.homeEditBusy = true; this.updateHomeEditControls();
    try {
      if (!this.sb) {
        const prepared = prepareHomeLayoutApply(localSnapshot, this.placed, this.counts, this.region, `layout-${Date.now()}`);
        if (!prepared.ok) return {
          ok: false, reason: prepared.reason,
          missingNames: prepared.missingItemIds?.map((id) => CATALOG_BY_ID.get(id)?.name ?? id),
        };
        this.clearLayoutReforms(this.placed.map((placement) => placement.id));
        this.placed = prepared.placements; this.counts = prepared.counts;
        for (const [placementId, style] of prepared.styles) {
          const placement = this.placed.find((candidate) => candidate.id === placementId);
          if (placement) this.furnitureReformStore.restore(placementId, placement.itemId, style);
        }
        this.homeLayoutStore.recordApplied(slot);
      } else {
        const result = await applyHomeLayout(this.sb, this.roomId, slot);
        if (!result.ok) return {
          ok: false, reason: result.reason,
          missingNames: result.missingItemIds.map((id) => CATALOG_BY_ID.get(id)?.name ?? id),
        };
        this.homeLayoutStore.replaceFromServer([result.snapshot]);
        const styledSnapshot = this.homeLayoutStore.snapshot(slot) ?? localSnapshot;
        const styles = new Map(styledSnapshot.placements.map((placement) => [homeLayoutPlacementKey(placement), placement.reform]));
        this.clearLayoutReforms(this.placed.map((placement) => placement.id));
        this.placed = result.placements;
        for (const placement of this.placed) {
          const style = styles.get(homeLayoutPlacementKey(placement));
          if (style) this.furnitureReformStore.restore(placement.id, placement.itemId, style);
        }
        this.counts = await fetchInventory(this.sb, this.peer.userId);
      }
      this.inv?.setCounts(this.counts); this.homeEditHistory.clear(); this.updateHomeEditControls();
      this.persistOfflineRoom(); this.redrawPlacements(); this.ensurePlayerClearOfFurniture(); this.refreshHomeDesign(true);
      this.writeHomeLayoutMetrics(this.homeLayoutStore.progress()); this.playPetHomeMoment();
      return { ok: true, snapshot: this.homeLayoutStore.snapshot(slot) ?? localSnapshot };
    } finally {
      this.homeLayoutBusy = false; this.homeEditBusy = false; this.updateHomeEditControls();
    }
  }

  private clearLayoutReforms(placementIds: readonly string[]): void {
    for (const placementId of placementIds) this.furnitureReformStore.clear(placementId);
  }

  private writeHomeLayoutMetrics(progress: HomeLayoutProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.setMetric('home_layout_slots', progress.savedSlots);
    quests?.setMetric('home_layout_saves', progress.totalSaves);
    quests?.setMetric('home_layout_applies', progress.totalApplies);
    quests?.setMetric('home_layout_scenes', progress.distinctScenes);
    quests?.setMetric('home_layout_items', progress.itemTypes);
  }

  private seedHomeLayoutPreview(): void {
    if (this.homeLayoutStore.progress().savedSlots || !this.placed.length) return;
    const sizes = [Math.min(2, this.placed.length), Math.min(4, this.placed.length), Math.min(5, this.placed.length), this.placed.length];
    sizes.forEach((size, index) => {
      const snapshot = makeHomeLayoutSnapshot(index + 1, HOME_LAYOUT_LABELS[index]!.id, this.placed.slice(0, size), () => null, Date.now() - index * 86_400_000, index);
      this.homeLayoutStore.save(snapshot);
    });
    this.writeHomeLayoutMetrics(this.homeLayoutStore.progress());
  }

  private mountHomeGuestbook(onToggle: (open: boolean) => void): void {
    const ownerId = this.isOwner ? this.peer.userId : this.visitOwner?.userId;
    if (!ownerId) return;
    const params = new URLSearchParams(location.search);
    const devTour = import.meta.env.DEV && params.has('neighbor-home-tour');
    const devInbox = import.meta.env.DEV && params.has('guestbook-ready');
    this.homeGuestbook = new HomeGuestbookPanel({
      mode: this.isOwner ? 'owner' : 'visitor',
      online: !!this.sb || devTour,
      userId: this.peer.userId,
      roomId: this.roomId,
      ownerId,
      ownerNickname: this.isOwner ? this.peer.nickname : this.visitOwner?.nickname ?? '이웃',
      onToggle,
      onSend: !this.isOwner ? async (kind) => {
        if (devTour && !this.sb) return 'ok';
        if (!this.sb || !this.isPublic) return this.isPublic ? 'offline' : 'closed';
        return leaveHomeGuestbook(this.sb, this.roomId, kind);
      } : undefined,
      onLoad: this.isOwner ? async () => {
        if (devInbox && !this.sb) return this.previewGuestbookRecords();
        return this.sb ? fetchHomeGuestbook(this.sb, this.roomId) : [];
      } : undefined,
      onSentChanged: (progress) => this.writeGuestbookSentMetrics(progress),
      onReceivedChanged: (records) => this.writeGuestbookReceivedMetrics(records),
    });
  }

  private writeGuestbookSentMetrics(progress: HomeGuestbookProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.setMetric('home_guestbook_sent', progress.sent);
    quests?.setMetric('home_guestbook_kinds', progress.kinds);
    quests?.setMetric('home_guestbook_homes', progress.homes);
  }

  private writeGuestbookReceivedMetrics(records: HomeGuestbookRecord[]): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.setMetric('home_guestbook_received', records.length);
    quests?.setMetric('home_guestbook_visitors', new Set(records.map((record) => record.fromUserId)).size);
    quests?.setMetric('home_guestbook_received_kinds', new Set(records.map((record) => record.kind)).size);
  }

  private previewGuestbookRecords(): HomeGuestbookRecord[] {
    const kinds = ['cozy', 'music', 'green', 'creator', 'pet', 'layout', 'color', 'welcome'] as const;
    return kinds.map((kind, index) => ({
      id: index + 1, roomId: this.roomId, fromUserId: `preview-neighbor-${index % 5}`,
      fromNickname: ['연남산책가', '새벽기타', '초록창문', '모카와나', '골목수집가'][index % 5]!,
      kind, day: `2026-07-${String(22 - index).padStart(2, '0')}`,
      createdAt: new Date(Date.UTC(2026, 6, 22 - index, 4)).toISOString(),
    }));
  }

  private homeMoodboardContext(analysis = analyzeHomeDesign(this.placed)): HomeMoodboardContext {
    const quests = this.registry.get('quests') as QuestStore;
    return {
      placed: this.placed, inventory: this.counts, analysis, quests: quests.get(), reform: this.furnitureReformStore.get(),
    };
  }

  private playPetHomeMoment(): void {
    if (!this.isOwner || !this.pet) return;
    const petId = this.petStore.activeId();
    if (!petId) return;
    const personality = this.petStore.personality(petId);
    const recorded = this.petHomeStore.recordedIds(petId);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
    const match = selectPetHomeMoment(personality, this.placed, recorded, today);
    if (!match || this.petHomeSession.has(match.moment.id)) return;
    this.petHomeSession.add(match.moment.id);
    const result = this.petHomeStore.record(petId, match.moment.id, today);
    const size = sizeOf(match.placement.itemId, match.placement.rot) ?? { w: 1, h: 1 };
    const target = projectRoomTile(
      this.plan, match.placement.tx + size.w / 2, match.placement.ty + size.h / 2,
    );
    this.pet.settleAt(target.x, target.y + 4, match.moment.mark, match.moment.phrase);
    this.refreshHomeDesign(true);
    if (result?.first && this.hint) {
      this.hint.textContent = `새 동행 추억 · ${match.moment.name} · 동행의 자리 수첩에 기록했어요.`;
      this.time.delayedCall(5200, () => { if (this.hint) this.hint.textContent = this.baseRoomHint; });
    }
  }

  private handleFurnitureReform(progress: FurnitureReformProgress): void {
    this.redrawPlacements();
    this.writeFurnitureReformMetrics(progress);
    this.refreshHomeDesign(true);
  }

  private handleHomeMoodboard(progress: HomeMoodboardProgress): void {
    this.writeHomeMoodboardMetrics(progress);
    this.refreshHomeDesign(true);
    if (this.hint && progress.stamped > 0) {
      this.hint.textContent = `홈 무드보드 ${progress.stamped}/${progress.total} 완성 · 도장과 소장품은 가구를 옮겨도 남아요.`;
    }
  }

  private homeStudioCardContext(): HomeStudioCardContext {
    const activePetId = this.petStore.activeId();
    return {
      appearance: { ...this.peer.appearance },
      pet: activePetId ? {
        speciesId: activePetId,
        accessory: this.petStore.accessory(activePetId),
      } : null,
      houseType: this.houseType,
      analysis: analyzeHomeDesign(this.placed),
      placed: this.placed,
    };
  }

  private handleHomeStudioCardChanged(progress: HomeStudioCardProgress): void {
    this.writeHomeStudioCardMetrics(progress);
    if (this.hint) {
      this.hint.textContent = `홈 스튜디오 ${progress.savedCards}/${progress.totalSlots}장 · 대표 공개 ${progress.featuredCards}/3 · 저장한 엽서는 방을 바꿔도 그대로예요.`;
    }
  }

  private writeHomeStudioCardMetrics(progress: HomeStudioCardProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('home_studio_cards', progress.savedCards);
    quests.setMetric('home_studio_captures', progress.totalCaptures);
    quests.setMetric('home_studio_moods', progress.moods);
    quests.setMetric('home_studio_pet_cards', progress.petCards);
    quests.setMetric('home_studio_featured', progress.featuredCards);
  }

  private handleFanRoomChanged(progress: FanRoomDisplayProgress): void {
    this.writeFanRoomMetrics(progress);
    this.redrawFanRoomDisplay();
    if (this.hint) {
      this.hint.textContent = progress.visible
        ? `최애 방 전시 ${progress.featuredGoods}/3점 · 진열 ${progress.stylesTried}/4 · 조명 ${progress.lightsTried}/4`
        : '최애 방 벽면 전시를 잠시 숨겼어요. 굿즈와 영구 기록은 그대로예요.';
    }
  }

  private writeFanRoomMetrics(progress: FanRoomDisplayProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('fan_room_goods', progress.visible ? progress.featuredGoods : 0);
    quests.setMetric('fan_room_styles', progress.stylesTried);
    quests.setMetric('fan_room_lights', progress.lightsTried);
    quests.setMetric('fan_room_restyles', progress.restyles);
    quests.setMetric('fan_room_visible', Number(progress.visible));
  }

  private handlePetMemoryWallChanged(progress: PetMemoryWallProgress): void {
    this.writePetMemoryWallMetrics(progress);
    this.redrawPetMemoryWall();
    if (this.hint) {
      this.hint.textContent = progress.visible
        ? `동행 추억 벽 ${progress.featuredCards}/3장 · 액자 ${progress.framesTried}/4 · 조명 ${progress.lightsTried}/4 · 배치 ${progress.layoutsTried}/4`
        : '동행 추억 벽을 잠시 숨겼어요. 선택한 엽서와 영구 꾸미기 기록은 그대로예요.';
    }
  }

  private writePetMemoryWallMetrics(progress: PetMemoryWallProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('pet_memory_wall_cards', progress.featuredCards);
    quests.setMetric('pet_memory_wall_frames', progress.framesTried);
    quests.setMetric('pet_memory_wall_lights', progress.lightsTried);
    quests.setMetric('pet_memory_wall_layouts', progress.layoutsTried);
    quests.setMetric('pet_memory_wall_restyles', progress.restyles);
    quests.setMetric('pet_memory_wall_visible', Number(progress.visible));
  }

  private handleObjectStoryChanged(progress: ObjectStoryProgress): void {
    this.writeObjectStoryMetrics(progress);
    if (this.hint) {
      this.hint.textContent = `물건의 속삭임 ${progress.observed}/${progress.total}점 · 아홉 장 ${progress.chapters}/${progress.totalChapters} · 최애 ${progress.favorites}/${progress.favoriteMax}`;
    }
    this.refreshHomeDesign();
  }

  private writeObjectStoryMetrics(progress: ObjectStoryProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('object_story_items', progress.observed);
    quests.setMetric('object_story_chapters', progress.chapters);
    quests.setMetric('object_story_favorites', progress.favorites);
    quests.setMetric('object_story_inspections', progress.inspections);
  }

  private writeHomeMoodboardMetrics(progress: HomeMoodboardProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('home_moodboard_stamps', progress.stamped);
    quests.setMetric('home_moodboard_ready', progress.ready);
    quests.setMetric('home_moodboard_started', progress.started);
    quests.setMetric('home_moodboard_items', progress.matchedItems);
  }

  private syncFurnitureReformMetrics(): void { this.writeFurnitureReformMetrics(this.furnitureReformStore.progress()); }

  private writeFurnitureReformMetrics(progress: FurnitureReformProgress): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests) return;
    quests.setMetric('furniture_reform_saves', progress.saves);
    quests.setMetric('furniture_reform_combos', progress.combinations);
    quests.setMetric('furniture_reform_finishes', progress.finishes);
    quests.setMetric('furniture_reform_colors', progress.colors);
    quests.setMetric('furniture_reformed_items', progress.styledPlacements);
  }

  private syncFishingMetrics(): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests || !this.fishingStore) return;
    const progress = this.fishingStore.progress();
    quests.setMetric('fishing_total', progress.totalCatches);
    quests.setMetric('fishing_species', progress.speciesDiscovered);
    quests.setMetric('fishing_stamps', progress.recordStamps);
    quests.setMetric('fishing_gold_records', progress.goldRecords);
  }

  private syncAquariumMetrics(): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    if (!quests || !this.homeAquariumStore || !this.fishingStore) return;
    const progress = this.homeAquariumStore.progress(this.fishingStore);
    quests.setMetric('aquarium_saves', progress.saveCount);
    quests.setMetric('aquarium_displayed', progress.displayedFish);
    quests.setMetric('aquarium_frames', progress.framesUnlocked);
    quests.setMetric('aquarium_substrates', progress.substratesUnlocked);
    quests.setMetric('aquarium_ornaments', progress.ornamentsUnlocked);
    quests.setMetric('home_aquarium_active', Number(progress.configured && this.placed.some((placed) => placed.itemId === 'fish_tank')));
  }

  private homeVisitContext(analysis = analyzeHomeDesign(this.placed)): HomeVisitContext {
    const activeId = this.petStore.activeId();
    const species = petById(activeId);
    const trust = loadTrust(this.peer.userId);
    if (this.homeVisitReadyPreview) trust.haneul = { v: Math.max(30, trust.haneul?.v ?? 0), day: '' };
    return {
      home: analysis,
      trust,
      activePet: activeId && species
        ? { id: activeId, name: this.petStore.displayName(activeId), affinity: this.petStore.affinity(activeId) }
        : null,
    };
  }

  /** 조건이 열린 주민은 실제 방 안에 등장한다. 기록 완료 장면도 언제든 다시 볼 수 있다. */
  private handleHomeVisit(residentId: string): void {
    if (!this.isOwner || !this.homeVisits) return;
    const analysis = analyzeHomeDesign(this.placed);
    const context = this.homeVisitContext(analysis);
    const before = this.homeVisits.views(context).find((visit) => visit.residentId === residentId);
    if (!before || before.status === 'locked') return;
    const recorded = this.homeVisits.record(residentId, context);
    const current = this.homeVisits.views(context).find((visit) => visit.residentId === residentId) ?? before;
    if (recorded) this.refreshHomeDesign(true);
    else this.refreshHomeDesign();
    this.spawnHomeGuest(current, context);
    this.homeDesign?.closeAlbum();
  }

  private spawnHomeGuest(visit: HomeVisitView, context: HomeVisitContext): void {
    this.guestSprite?.destroy();
    this.guestLabel?.destroy();
    this.guestBubble?.destroy();
    const tile = this.homeGuestTile();
    const logical = roomLogicalTileCenter(tile.tx, tile.ty);
    const actor = isometricActorPose(this.plan, logical.x, logical.y);
    const key = ensureCharacter(this, visit.resident.appearance);
    this.guestSprite = this.add.sprite(actor.x, actor.y, key, 0)
      .setOrigin(0.5, CHAR_ORIGIN_Y).setDepth(actor.depth).setInteractive({ useHandCursor: true });
    this.guestLabel = this.add.text(this.guestSprite.x, this.guestSprite.y - 40, `${visit.resident.name} · 집들이 손님`, {
      fontFamily: UI_FONT, fontSize: '8px', color: '#fff2d8', backgroundColor: '#6f4927',
      padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(actor.depth + 2);
    const line = context.activePet ? visit.petDialogue : visit.dialogue;
    this.guestSprite.on('pointerdown', () => this.showHomeGuestBubble(line));
    this.showHomeGuestBubble(line);
    this.tweens.add({
      targets: this.guestSprite, scaleX: { from: .86, to: 1 }, scaleY: { from: .86, to: 1 },
      alpha: { from: 0, to: 1 }, duration: 360, ease: 'Back.easeOut',
    });
  }

  private homeGuestTile(): { tx: number; ty: number } {
    const occupied = new Set(this.placed.flatMap((placed) => (
      layerOf(placed.itemId) === 'floor' ? footprint(placed).map((tile) => `${tile.tx},${tile.ty}`) : []
    )));
    const playerTile = worldToTile(this.actorWorld.x, this.actorWorld.y);
    const candidates = this.plan.rooms.flatMap((room) => {
      const tiles: Array<{ tx: number; ty: number }> = [];
      for (let ty = room.rect.y + 1; ty < room.rect.y + room.rect.h - 1; ty += 1) {
        for (let tx = room.rect.x + 1; tx < room.rect.x + room.rect.w - 1; tx += 1) tiles.push({ tx, ty });
      }
      return tiles;
    });
    return candidates.find(({ tx, ty }) => (
      isPlaceableTile(this.plan, tx, ty)
      && !occupied.has(`${tx},${ty}`)
      && Math.abs(tx - playerTile.tx) + Math.abs(ty - playerTile.ty) >= 2
    )) ?? { tx: this.plan.spawn.tx, ty: Math.max(1, this.plan.spawn.ty - 2) };
  }

  private showHomeGuestBubble(message: string): void {
    if (!this.guestSprite) return;
    this.guestBubble?.destroy();
    this.guestBubble = this.add.text(this.guestSprite.x, this.guestSprite.y - 48, message, {
      fontFamily: UI_FONT, fontSize: '9px', color: '#4a2e14', backgroundColor: '#fff8e4',
      align: 'center', wordWrap: { width: 180 }, padding: { x: 8, y: 6 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(ROOM_ISO_OVERLAY_DEPTH).setAlpha(0);
    this.tweens.add({ targets: this.guestBubble, alpha: 1, y: this.guestBubble.y - 4, duration: 260, ease: 'Back.easeOut' });
  }

  private mountHomeEditControls(): void {
    this.homeEditControls?.remove();
    this.homeEditControls = document.createElement('div');
    this.homeEditControls.className = 'hv-home-edit-history';
    this.homeEditControls.innerHTML = `<div><small>SAFE ROOM EDIT</small><b>배치 기록</b></div>
      <button data-home-history="undo" disabled><i>↶</i><span>되돌리기</span><kbd>⌘ Z</kbd></button>
      <button data-home-history="redo" disabled><i>↷</i><span>다시하기</span><kbd>⇧⌘ Z</kbd></button>
      <p aria-live="polite">가구를 놓거나 회수하면 최근 50단계를 안전하게 되돌릴 수 있어요.</p>`;
    document.body.appendChild(this.homeEditControls);
    this.homeEditControls.querySelector('[data-home-history="undo"]')!.addEventListener('click', () => void this.undoHomeEdit());
    this.homeEditControls.querySelector('[data-home-history="redo"]')!.addEventListener('click', () => void this.redoHomeEdit());
    this.homeEditKeyHandler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input,textarea,select,[contenteditable="true"]')) return;
      if (!(event.metaKey || event.ctrlKey) || this.input.keyboard?.enabled === false) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); void this.undoHomeEdit(); }
      else if ((key === 'z' && event.shiftKey) || key === 'y') { event.preventDefault(); void this.redoHomeEdit(); }
    };
    window.addEventListener('keydown', this.homeEditKeyHandler);
    this.updateHomeEditControls();
  }

  private homeEditLabel(action: HomeEditAction | null, mode: 'undo' | 'redo'): string {
    if (!action) return mode === 'undo' ? '되돌릴 배치 없음' : '다시 적용할 배치 없음';
    const name = CATALOG_BY_ID.get(action.placement.itemId)?.name ?? '가구';
    const verb = mode === 'undo'
      ? action.kind === 'place' ? '배치 취소' : '다시 놓기'
      : action.kind === 'place' ? '다시 배치' : '회수 반복';
    return `${name} · ${verb}`;
  }

  private updateHomeEditControls(message?: string): void {
    const root = this.homeEditControls; if (!root) return;
    const view = this.homeEditHistory.view();
    const undo = root.querySelector<HTMLButtonElement>('[data-home-history="undo"]')!;
    const redo = root.querySelector<HTMLButtonElement>('[data-home-history="redo"]')!;
    undo.disabled = this.homeEditBusy || !view.canUndo; redo.disabled = this.homeEditBusy || !view.canRedo;
    undo.title = this.homeEditLabel(view.undo, 'undo'); redo.title = this.homeEditLabel(view.redo, 'redo');
    undo.querySelector('span')!.textContent = view.canUndo ? `되돌리기 ${view.undoCount}` : '되돌리기';
    redo.querySelector('span')!.textContent = view.canRedo ? `다시하기 ${view.redoCount}` : '다시하기';
    if (message) root.querySelector('p')!.textContent = message;
    root.classList.toggle('is-busy', this.homeEditBusy);
  }

  private recordHomeEdit(action: HomeEditAction): void {
    this.homeEditHistory.push(action);
    const name = CATALOG_BY_ID.get(action.placement.itemId)?.name ?? '가구';
    this.updateHomeEditControls(action.kind === 'place'
      ? `${name} 배치를 기록했어요. 마음이 바뀌면 바로 되돌릴 수 있어요.`
      : `${name} 회수를 기록했어요. 실수였다면 다시 놓을 수 있어요.`);
  }

  private matchingPlacement(action: HomeEditAction): Placed | null {
    return this.placed.find((item) => item.id === action.placement.id)
      ?? this.placed.find((item) => item.itemId === action.placement.itemId
        && item.tx === action.placement.tx && item.ty === action.placement.ty && item.rot === action.placement.rot)
      ?? null;
  }

  private async undoHomeEdit(): Promise<void> {
    if (this.homeEditBusy) return;
    const action = this.homeEditHistory.peekUndo(); if (!action) return;
    this.homeEditBusy = true; this.updateHomeEditControls('배치 상태를 안전하게 되돌리는 중이에요…');
    let updated: HomeEditAction | null = null;
    try {
      if (action.kind === 'place') {
        const current = this.matchingPlacement(action); if (!current) return;
        const style = this.furnitureReformStore.styleFor(current.id);
        const reform = style ? { finishId: style.finishId, colorId: style.colorId } : action.reform;
        if (await this.removePlaced(current, false)) updated = { ...action, placement: { ...current }, reform };
      } else {
        const restored = await this.placeAt(action.placement.itemId, action.placement.tx, action.placement.ty, action.placement.rot, {
          recordHistory: false, recordProgress: false, avoidPlayer: false, reform: action.reform,
        });
        if (restored) {
          this.homeEditHistory.rebindPlacement(action.placement.id, restored);
          updated = { ...action, placement: restored };
        }
      }
      if (updated) this.homeEditHistory.commitUndo(updated);
    } finally {
      this.homeEditBusy = false;
      const name = CATALOG_BY_ID.get(action.placement.itemId)?.name ?? '가구';
      this.updateHomeEditControls(updated
        ? action.kind === 'place' ? `${name} 배치를 되돌렸어요.` : `${name}: 원래 자리에 다시 놓았어요.`
        : `${name} 상태가 달라 되돌리지 못했어요. 현재 방은 그대로 유지됩니다.`);
    }
  }

  private async redoHomeEdit(): Promise<void> {
    if (this.homeEditBusy) return;
    const action = this.homeEditHistory.peekRedo(); if (!action) return;
    this.homeEditBusy = true; this.updateHomeEditControls('되돌린 배치를 다시 적용하는 중이에요…');
    let updated: HomeEditAction | null = null;
    try {
      if (action.kind === 'place') {
        const restored = await this.placeAt(action.placement.itemId, action.placement.tx, action.placement.ty, action.placement.rot, {
          recordHistory: false, recordProgress: false, avoidPlayer: false, reform: action.reform,
        });
        if (restored) {
          this.homeEditHistory.rebindPlacement(action.placement.id, restored);
          updated = { ...action, placement: restored };
        }
      } else {
        const current = this.matchingPlacement(action);
        if (current && await this.removePlaced(current, false)) updated = { ...action, placement: { ...current } };
      }
      if (updated) this.homeEditHistory.commitRedo(updated);
    } finally {
      this.homeEditBusy = false;
      const name = CATALOG_BY_ID.get(action.placement.itemId)?.name ?? '가구';
      this.updateHomeEditControls(updated
        ? action.kind === 'place' ? `${name}: 다시 배치했어요.` : `${name} 회수를 다시 적용했어요.`
        : `${name} 상태가 달라 다시 적용하지 못했어요. 현재 방은 그대로 유지됩니다.`);
    }
  }

  private persistOfflineRoom(): void {
    this.offlineRoom?.save(this.placed, this.counts);
  }

  private recordPlacementProgress(): void {
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.bump('q_place');
    const hud = this.registry.get('hud') as GameHud | undefined;
    if (quests && hud) hud.setHearts(quests.doneCount(), DAILY_QUESTS.length);
    this.refreshHomeDesign(true);
    this.playPetHomeMoment();
  }

  private drawPlaced(p: Placed): void {
    const definition = CATALOG_BY_ID.get(p.itemId);
    if (!definition) return;
    const pose = isometricFurniturePose(this.plan, p);
    const meta = furniturePlacementMeta(p.itemId);
    if (!pose || !meta) return;
    const storedReform = this.isOwner ? this.furnitureReformStore.styleFor(p.id) : null;
    const reform = storedReform?.itemId === p.itemId ? storedReform : null;
    if (meta.surface === 'rug') {
      const points = projectRoomFootprint(this.plan, p);
      if (!points) return;
      const color = reform ? FURNITURE_COLOR_BY_ID.get(reform.colorId)?.hex : null;
      const base = Number.parseInt((color ?? `#${definition.color}`).slice(1), 16);
      const accent = Number.parseInt(definition.accent ?? definition.color, 16);
      const center = points.reduce((total, point) => ({
        x: total.x + point.x / points.length,
        y: total.y + point.y / points.length,
      }), { x: 0, y: 0 });
      const inset = points.map((point) => ({
        x: center.x + (point.x - center.x) * .84,
        y: center.y + (point.y - center.y) * .84,
      }));
      const rug = this.add.graphics().setDepth(pose.depth);
      rug.fillStyle(base, .96); rug.fillPoints(points, true);
      rug.lineStyle(1, 0x4a3828, .58); rug.strokePoints(points, true);
      rug.lineStyle(2, accent, .78); rug.strokePoints(inset, true);
      const horizontal = p.rot % 2 === 0;
      const firstA = horizontal ? inset[0]! : inset[3]!;
      const firstB = horizontal ? inset[1]! : inset[0]!;
      const secondA = horizontal ? inset[3]! : inset[2]!;
      const secondB = horizontal ? inset[2]! : inset[1]!;
      rug.lineStyle(1, accent, .38);
      rug.lineBetween(
        firstA.x + (secondA.x - firstA.x) * .35,
        firstA.y + (secondA.y - firstA.y) * .35,
        firstB.x + (secondB.x - firstB.x) * .35,
        firstB.y + (secondB.y - firstB.y) * .35,
      );
      rug.lineBetween(
        firstA.x + (secondA.x - firstA.x) * .65,
        firstA.y + (secondA.y - firstA.y) * .65,
        firstB.x + (secondB.x - firstB.x) * .65,
        firstB.y + (secondB.y - firstB.y) * .65,
      );
      this.placedGfx.set(p.id, rug);
      return;
    }
    if (meta.castsShadow) {
      const shadow = this.add.ellipse(
        pose.shadowX, pose.shadowY, pose.shadowW, 9, 0x2d241d, .18,
      ).setDepth(pose.depth - .01).setScale(1, .72)
        .setAlpha(performanceComfort.profile().shadowAlpha);
      this.placedShadows.set(p.id, shadow);
    }
    if (p.itemId === 'fish_tank' && this.isOwner && this.homeAquariumStore.progress(this.fishingStore).configured) {
      const key = `home-aquarium-${this.peer.userId}-${this.homeAquariumStore.signature()}`;
      if (!this.textures.exists(key)) {
        const canvas = document.createElement('canvas');
        paintHomeAquarium(canvas, this.homeAquariumStore.get(), this.fishingStore.get(), true);
        this.textures.addCanvas(key, canvas);
      }
      const image = this.add.image(pose.x, pose.baselineY, key)
        .setOrigin(.5, 1).setDisplaySize(66, 48).setDepth(pose.depth);
      this.placedGfx.set(p.id, image);
      return;
    }
    const key = reform
      ? ensureReformedFurniture(this, p.itemId, p.rot, reform)
      : ensureFurniture(this, p.itemId, p.rot);
    const img = this.add.image(pose.x, pose.baselineY, key).setOrigin(.5, 1).setDepth(pose.depth);
    this.placedGfx.set(p.id, img);
  }

  // --- 꾸미기 (주인 전용) ---

  private setGhost(itemId: string | null): void {
    this.ghost?.destroy();
    this.ghostLabel?.destroy();
    this.ghost = null;
    this.ghostLabel = null;
    if (!itemId) {
      if (this.hint) this.hint.textContent = this.baseRoomHint;
      return;
    }
    this.ghostRot = 0;
    this.ghost = this.add.graphics().setDepth(ROOM_ISO_OVERLAY_DEPTH);
    this.ghostLabel = this.add.text(0, 0, '', {
      fontFamily: UI_FONT, fontSize: '8px', color: '#fff4d8', backgroundColor: '#44382dcc',
      padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(.5).setDepth(ROOM_ISO_OVERLAY_DEPTH + 1);
    this.updateGhost();
  }

  private rotateGhost(): void {
    if (!this.ghost) return;
    const itemId = this.inv?.selected;
    if (!itemId) return;
    this.ghostRot = nextRot(this.ghostRot, itemId);
    this.updateGhost();
  }

  private updateGhost(): void {
    const itemId = this.inv?.selected;
    if (!this.ghost || !itemId) return;
    const def = CATALOG_BY_ID.get(itemId);
    const size = sizeOf(itemId, this.ghostRot);
    if (!def || !size) return;
    const playerTile = worldToTile(this.actorWorld.x, this.actorWorld.y);
    const coversPlayer = layerOf(itemId) === 'floor' && footprint({
      itemId, tx: this.ghostTile.tx, ty: this.ghostTile.ty, rot: this.ghostRot,
    }).some((tile) => tile.tx === playerTile.tx && tile.ty === playerTile.ty);
    const ok = !coversPlayer && canPlace(
      this.placed, itemId, this.ghostTile.tx, this.ghostTile.ty, this.ghostRot, this.region,
    );
    const preview = {
      itemId, tx: this.ghostTile.tx, ty: this.ghostTile.ty, rot: this.ghostRot,
    };
    const points = projectRoomFootprint(this.plan, preview);
    if (!points) return;
    this.ghost.clear();
    this.ghost.fillStyle(parseInt(def.color, 16), .46);
    this.ghost.fillPoints(points, true);
    this.ghost.lineStyle(2, ok ? 0x6ee87c : 0xe86e6e, .95);
    this.ghost.strokePoints(points, true);
    points.forEach((point) => {
      this.ghost!.fillStyle(ok ? 0xffe38a : 0xffa0a0, .95);
      this.ghost!.fillCircle(point.x, point.y, 2);
    });
    const center = points.reduce((total, point) => ({
      x: total.x + point.x / points.length,
      y: total.y + point.y / points.length,
    }), { x: 0, y: 0 });
    const rotatable = furniturePlacementMeta(itemId)?.rotatable ?? false;
    const direction = rotatable ? `${ROTATION_LABEL[this.ghostRot]} · ${this.ghostRot + 1}/4` : '벽면 방향 고정';
    this.ghostLabel?.setPosition(center.x, center.y - (layerOf(itemId) === 'wall' ? 40 : 18))
      .setText(`${direction} · ${ok ? '놓을 수 있어요' : '다른 자리를 골라요'}`);
    if (this.hint) this.hint.textContent = `${def.name} 선택 · ${direction} · 초록 테두리에서 배치`;
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!this.ghost) return;
    const cam = this.cameras.main;
    this.ghostTile = screenToRoomTile(this.plan, p.x, p.y, {
      scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
      width: cam.width, height: cam.height,
    });
    // 벽걸이는 벽 행에 자석처럼 붙는다
    const itemId = this.inv?.selected;
    if (itemId && layerOf(itemId) === 'wall') this.ghostTile = { tx: this.ghostTile.tx, ty: this.region.wallRow };
    this.updateGhost();
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.isOwner || this.homeEditBusy) return;
    const itemId = this.inv?.selected;
    if (itemId && this.ghost) {
      void this.tryPlace(itemId);
      return;
    }
    // 고스트 없으면 배치물 클릭 → 제거
    const cam = this.cameras.main;
    const t = screenToRoomTile(this.plan, p.x, p.y, {
      scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
      width: cam.width, height: cam.height,
    });
    // 벽걸이는 벽지 위(한 칸 위)에 그려지므로 그 위치 클릭도 인정
    const hit = this.placed.find((pl) =>
      footprint(pl).some((f) =>
        (f.tx === t.tx && f.ty === t.ty) ||
        (layerOf(pl.itemId) === 'wall' && f.tx === t.tx && f.ty === t.ty + 1),
      ));
    if (hit) void this.removePlaced(hit);
  }

  private async tryPlace(itemId: string): Promise<void> {
    const { tx, ty } = this.ghostTile;
    const rot = this.ghostRot;
    if (this.homeEditBusy) return;
    this.homeEditBusy = true; this.updateHomeEditControls();
    try {
      await this.placeAt(itemId, tx, ty, rot, { recordHistory: true, recordProgress: true, avoidPlayer: true, reform: null });
    } finally { this.homeEditBusy = false; this.updateHomeEditControls(); }
  }

  private async placeAt(
    itemId: string, tx: number, ty: number, rot: Rot,
    options: { recordHistory: boolean; recordProgress: boolean; avoidPlayer: boolean; reform: FurnitureReformStyle | null },
  ): Promise<Placed | null> {
    if ((this.counts.get(itemId) ?? 0) <= 0) return null;
    if (!canPlace(this.placed, itemId, tx, ty, rot, this.region)) return null;
    const playerTile = worldToTile(this.actorWorld.x, this.actorWorld.y);
    if (options.avoidPlayer && layerOf(itemId) === 'floor' && footprint({ itemId, tx, ty, rot }).some((tile) => (
      tile.tx === playerTile.tx && tile.ty === playerTile.ty
    ))) return null;

    // 낙관적 반영 → 서버 실패 시 롤백 (스펙 §7)
    let localId: string;
    do localId = `local-${++this.localSeq}`;
    while (this.placed.some((placed) => placed.id === localId));
    const optimistic: Placed = { id: localId, itemId, tx, ty, rot };
    this.placed.push(optimistic);
    this.drawPlaced(optimistic);
    this.rebuildRoomCollision();
    this.counts.set(itemId, (this.counts.get(itemId) ?? 0) - 1);
    this.inv?.setCounts(this.counts);
    this.updateGhost();
    this.refreshHomeDesign();

    if (!this.sb) {
      this.persistOfflineRoom();
      if (options.reform) { this.furnitureReformStore.restore(optimistic.id, itemId, options.reform); this.redrawPlacements(); }
      if (options.recordHistory) this.recordHomeEdit({ kind: 'place', placement: optimistic, reform: options.reform });
      if (options.recordProgress) this.recordPlacementProgress(); else this.refreshHomeDesign(true);
      this.ensurePlayerClearOfFurniture();
      return { ...optimistic };
    }
    // 서버가 소유·수량·좌표 검증 + 인벤 차감까지 원자 처리 (0007 place_item)
    const realId = await insertPlacement(this.sb, this.roomId, this.peer.userId, { itemId, tx, ty, rot });
    if (!realId) {
      this.placed = this.placed.filter((pl) => pl.id !== localId);
      this.placedGfx.get(localId)?.destroy();
      this.placedGfx.delete(localId);
      this.placedShadows.get(localId)?.destroy();
      this.placedShadows.delete(localId);
      this.rebuildRoomCollision();
      this.counts.set(itemId, (this.counts.get(itemId) ?? 0) + 1);
      this.inv?.setCounts(this.counts);
      this.refreshHomeDesign();
      return null;
    }
    optimistic.id = realId;
    const gfx = this.placedGfx.get(localId);
    if (gfx) { this.placedGfx.delete(localId); this.placedGfx.set(realId, gfx); }
    const shadow = this.placedShadows.get(localId);
    if (shadow) { this.placedShadows.delete(localId); this.placedShadows.set(realId, shadow); }
    if (options.reform) { this.furnitureReformStore.restore(realId, itemId, options.reform); this.redrawPlacements(); }
    if (options.recordHistory) this.recordHomeEdit({ kind: 'place', placement: optimistic, reform: options.reform });
    if (options.recordProgress) this.recordPlacementProgress(); else this.refreshHomeDesign(true);
    this.ensurePlayerClearOfFurniture();
    return { ...optimistic };
  }

  private async removePlaced(p: Placed, recordHistory = true): Promise<boolean> {
    if (recordHistory && this.homeEditBusy) return false;
    if (recordHistory) { this.homeEditBusy = true; this.updateHomeEditControls(); }
    try {
      const style = this.furnitureReformStore.styleFor(p.id);
      const reform: FurnitureReformStyle | null = style ? { finishId: style.finishId, colorId: style.colorId } : null;
      this.placed = this.placed.filter((pl) => pl.id !== p.id);
      this.placedGfx.get(p.id)?.destroy();
      this.placedGfx.delete(p.id);
      this.placedShadows.get(p.id)?.destroy();
      this.placedShadows.delete(p.id);
      this.rebuildRoomCollision();
      this.counts.set(p.itemId, (this.counts.get(p.itemId) ?? 0) + 1);
      this.inv?.setCounts(this.counts);
      this.refreshHomeDesign();

      if (!this.sb || p.id.startsWith('local-')) {
        this.persistOfflineRoom();
        this.clearFurnitureReform(p.id);
        if (recordHistory) this.recordHomeEdit({ kind: 'remove', placement: p, reform });
        return true;
      }
      // 서버가 삭제 + 인벤 복귀 원자 처리 (0007 pickup_item)
      const ok = await deletePlacement(this.sb, p.id, this.peer.userId, p.itemId);
      if (!ok) {
        await this.refresh();
        this.counts = await fetchInventory(this.sb, this.peer.userId); this.inv?.setCounts(this.counts);
      } else {
        this.clearFurnitureReform(p.id);
        if (recordHistory) this.recordHomeEdit({ kind: 'remove', placement: p, reform });
      }
      return ok;
    } finally {
      if (recordHistory) { this.homeEditBusy = false; this.updateHomeEditControls(); }
    }
  }

  private clearFurnitureReform(placementId: string): void {
    this.furnitureReformStore.clear(placementId);
    this.syncFurnitureReformMetrics();
    this.furnitureReformPanel?.refresh(this.placed);
    this.refreshHomeDesign();
  }

  /** 내가 제작한 보물을 벽 상단 진열장에 전시 (소장 페이오프 — 동숲 감성) */
  private drawTreasureDisplay(): void {
    if (!this.isOwner) return;
    const store = this.registry.get('treasure') as TreasureStore | undefined;
    if (!store) return;
    const crafted = Object.keys(store.get().crafted).filter((id) => (store.get().crafted[id] ?? 0) > 0 && TREASURE_BY_ID.has(id));
    if (crafted.length === 0) return;

    const cellW = 22;
    const maxCols = Math.max(3, this.plan.w - 4);
    const cols = Math.min(crafted.length, maxCols);
    const shown = crafted.slice(0, cols);
    const shelfW = cols * cellW + 8, shelfH = 28;
    const key = `treasure-shelf-${this.roomId}-${shown.join('-')}`;
    if (!this.textures.exists(key)) {
      makeTexture(this, key, shelfW, shelfH, (d) => {
        // 나무 선반 판자
        d.rect(2, shelfH - 7, shelfW - 4, 6, PAL.doorWood);
        d.rect(2, shelfH - 7, shelfW - 4, 2, PAL.doorDark, 0.5);
        d.rect(2, shelfH - 2, shelfW - 4, 2, PAL.doorDark, 0.35);
        shown.forEach((id, i) => {
          const t = TREASURE_BY_ID.get(id)!;
          const cx = 4 + i * cellW + cellW / 2;
          d.rect(cx - 6, shelfH - 10, 12, 3, PAL.doorDark);  // 받침
          drawGem(d.ctx, t, cx, shelfH - 16, 7);
        });
      });
    }
    const anchor = projectRoomTile(this.plan, this.plan.w / 2, 1, 2.45);
    this.add.image(anchor.x, anchor.y, key).setOrigin(.5, 1).setDepth(720 + anchor.y);
    this.add.text(anchor.x, anchor.y - shelfH - 3, `🏆 내 보물 ${crafted.length}종 전시 중`, {
      fontFamily: UI_FONT, fontSize: '8px', color: '#fff2d8', backgroundColor: '#7a5220',
      padding: { x: 3, y: 1 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(ROOM_ISO_OVERLAY_DEPTH).setAlpha(0.9);
  }

  /** 공방의 대표 굿즈를 가구 충돌과 무관한 벽면 코너로 실제 방에 표시한다. */
  private redrawFanRoomDisplay(): void {
    this.fanRoomDisplay?.destroy();
    this.fanRoomDisplay = null;
    if (!this.isOwner || !this.fanRoomStore || !this.fanMerchStore) return;
    const state = this.fanRoomStore.get();
    if (!state.visible) return;
    const records = featuredFanMerch(this.fanMerchStore.get());
    const key = `fan-room-fixture-${this.peer.userId}`;
    let canvas: HTMLCanvasElement;
    if (this.textures.exists(key)) {
      canvas = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
      paintFanRoomFixture(canvas, state, records);
    } else {
      canvas = document.createElement('canvas');
      paintFanRoomFixture(canvas, state, records);
      this.textures.addCanvas(key, canvas);
    }
    const texture = this.textures.get(key) as Phaser.Textures.CanvasTexture;
    texture.refresh();
    const anchor = projectRoomTile(this.plan, Math.max(2.2, this.plan.w * .29), 1, 2.35);
    const wallY = anchor.y + 70;
    this.fanRoomDisplay = this.add.image(anchor.x, wallY, key)
      .setOrigin(.5, 1)
      .setScale(.58)
      .setDepth(718 + wallY)
      .setInteractive({ useHandCursor: true });
    this.fanRoomDisplay.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.fanRoomPanel?.open();
    });
    this.fanRoomDisplay.setData('fan-room-display', true);
  }

  /** 동행 엽서 스냅샷을 가구 칸과 무관한 오른쪽 벽면 전시로 실제 방에 표시한다. */
  private redrawPetMemoryWall(): void {
    this.petMemoryWallDisplay?.destroy();
    this.petMemoryWallDisplay = null;
    if (!this.isOwner || !this.petMemoryWallStore) return;
    const state = this.petMemoryWallStore.get();
    if (!state.visible) return;
    const key = `pet-memory-wall-fixture-${this.peer.userId}`;
    let canvas: HTMLCanvasElement;
    if (this.textures.exists(key)) {
      canvas = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
      paintPetMemoryWallFixture(canvas, state);
    } else {
      canvas = document.createElement('canvas');
      paintPetMemoryWallFixture(canvas, state);
      this.textures.addCanvas(key, canvas);
    }
    const texture = this.textures.get(key) as Phaser.Textures.CanvasTexture;
    texture.refresh();
    const anchor = projectRoomTile(this.plan, Math.min(this.plan.w - 2.2, this.plan.w * .71), 1, 2.35);
    const wallY = anchor.y + 70;
    this.petMemoryWallDisplay = this.add.image(anchor.x, wallY, key)
      .setOrigin(.5, 1)
      .setScale(.54)
      .setDepth(719 + wallY)
      .setInteractive({ useHandCursor: true });
    this.petMemoryWallDisplay.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.petMemoryWallPanel?.open();
    });
    this.petMemoryWallDisplay.setData('pet-memory-wall', true);
  }

  private teardown(): void {
    this.qualityUnsubscribe?.();
    this.qualityUnsubscribe = null;
    this.scale.off(Phaser.Scale.Events.RESIZE, this.fitRoomCamera, this);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.touch?.destroy();
    this.touch = null;
    this.inv?.destroy();
    this.inv = null;
    this.ghost = null;
    this.ghostLabel?.destroy();
    this.ghostLabel = null;
    this.hint?.remove();
    this.hint = null;
    this.exitBtn?.destroy();
    this.exitBtn = null;
    this.homeDesign?.destroy();
    this.homeDesign = null;
    this.homeGuestbook?.destroy();
    this.homeGuestbook = null;
    this.homeLayoutPanel?.destroy();
    this.homeLayoutPanel = null;
    this.homeEditControls?.remove(); this.homeEditControls = null;
    if (this.homeEditKeyHandler) window.removeEventListener('keydown', this.homeEditKeyHandler);
    this.homeEditKeyHandler = null;
    this.furnitureReformPanel?.destroy();
    this.furnitureReformPanel = null;
    this.homeMoodboardPanel?.destroy();
    this.homeMoodboardPanel = null;
    this.homeStudioCardPanel?.destroy();
    this.homeStudioCardPanel = null;
    this.fanRoomPanel?.destroy();
    this.fanRoomPanel = null;
    this.fanRoomDisplay?.destroy();
    this.fanRoomDisplay = null;
    this.petMemoryWallPanel?.destroy();
    this.petMemoryWallPanel = null;
    this.petMemoryWallDisplay?.destroy();
    this.petMemoryWallDisplay = null;
    this.homeObjectStoryPanel?.destroy();
    this.homeObjectStoryPanel = null;
    this.homeAquariumPanel?.destroy();
    this.homeAquariumPanel = null;
    this.fishingPanel?.destroy();
    this.fishingPanel = null;
    this.homeVisits = null;
    this.pet?.destroy();
    this.pet = null;
    this.guestSprite?.destroy(); this.guestSprite = null;
    this.guestLabel?.destroy(); this.guestLabel = null;
    this.guestBubble?.destroy(); this.guestBubble = null;
    this.offlineRoom = null;
    this.roomStructure = [];
  }

  private applyPerformanceComfort(): void {
    const profile = performanceComfort.profile();
    for (const shadow of this.placedShadows.values()) shadow.setAlpha(profile.shadowAlpha);
    this.cameras.main.roundPixels = true;
  }
}
