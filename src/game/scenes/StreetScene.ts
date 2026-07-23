import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM, MAP_W, MAP_H, TEXT_RES, UI_FONT } from '../config';
import {
  ZONES, SPAWN_TILE, HOUSE_DOORS, SHOP_DOORS, CAFE_DOORS, INTERIOR_DOORS,
  BUSKING_SPOT, OMOK_SPOT, BOARD_SPOT, CLAW_SPOT, PHOTO_SPOT, BUNGEO_SPOT, REALTY_DOOR,
  COMPANY_DOORS, PETSHOP_DOOR, buildCollision,
} from '../world/mapData';
import { PetShopPanel } from '../../ui/petShopPanel';
import { PetStyleStudioPanel } from '../../ui/petStyleStudioPanel';
import { PetStore } from '../pets/petStore';
import { PetOutingStore, type PetOutingProgress } from '../pets/petOutings';
import type { PetSignalProgress } from '../pets/petSignals';
import type { PetPerformanceProgress } from '../pets/petPerformances';
import {
  PetStyleStudioStore, type PetStyleDraft, type PetStyleStudioProgress,
} from '../pets/petStyleStudio';
import { PetHomeMemoryStore } from '../home/petHomeComfort';
import { VillageRequestStore, type VillageRequestProgress } from '../requests/villageRequests';
import { REQUEST_STORY_REWARDS, requestStoryMetricKey } from '../progression/requestStoryRewards';
import { villageRequestDestinationForMetric } from '../requests/villageRequestStories';
import { PetFollower } from '../pets/petFollower';
import { adoptPet, carePet, claimRarePet, fetchOwnedPets, fetchPetProgress, type PetCareResult } from '../../db/petApi';
import { petById } from '../pets/pets';
import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import { giftIntervalMs, giftShards, giftEmoji } from '../pets/petGift';
import { WEAPONSHOP_DOOR, HUNT_FIELD } from '../world/mapData';
import { BattleStore } from '../battle/battleStore';
import { AdventureRoleStore, type AdventureRoleProgress } from '../battle/adventureRoles';
import { HuntField } from '../battle/huntField';
import { maxHpForLevel, totalAtk, xpToNext, FATIGUE_MS } from '../battle/combat';
import { weaponById } from '../battle/weapons';
import { titleForLevel, isTitleUpAt } from '../battle/titles';
import { ensureWeaponSprite } from '../art/weaponArt';
import { PlayerAura } from '../entities/playerAura';
import { PlayerInfoPanel } from '../../ui/playerInfoPanel';
import type { MonsterSpecies } from '../battle/monsters';
import { BattleHud } from '../../ui/battleHud';
import { AdventureRolePanel } from '../../ui/adventureRolePanel';
import { WeaponShopPanel } from '../../ui/weaponShopPanel';
import { buyWeapon, fetchOwnedWeapons } from '../../db/weaponApi';
import { loadGameState, saveGameState, type GameSnapshot } from '../../db/gameSync';
import { saveLastPos, loadLastPos } from '../world/lastPos';
import { ClawPanel } from '../../ui/clawPanel';
import { RealtyPanel } from '../../ui/realtyPanel';
import {
  fetchProperties, fetchPropertyForHolder, leaseProperty, moveOut, sellProperty, payRent, chargeRent,
  offlineProperties, type Property,
} from '../../db/realEstateApi';
import type { DealType } from '../realestate/realEstate';
import { NpcCrowd } from '../entities/npcAmbient';
import { OmokPanel } from '../../ui/omokPanel';
import { QuestPanel } from '../../ui/questPanel';
import { StarterConciergeDock } from '../../ui/starterConciergeDock';
import { PhotoBoothPanel } from '../../ui/photoBoothPanel';
import { PhotoAlbumStore, type PhotoRecord } from '../photo/photoAlbum';
import { GardenPanel } from '../../ui/gardenPanel';
import type { GardenStore } from '../garden/gardenStore';
import { CookingPanel } from '../../ui/cookingPanel';
import type { CookingStore } from '../cooking/cookingStore';
import { FishingPanel } from '../../ui/fishingPanel';
import type { FishingStore } from '../fishing/fishingStore';
import type { HomeAquariumStore } from '../home/homeAquariumStore';
import type { FurnitureReformStore } from '../home/furnitureReform';
import { DAILY_QUESTS, QUEST_BY_ID } from '../quests';
import { selectQuestGuide } from '../questGuidance';
import { ShopPanel } from '../../ui/shopPanel';
import { CafePanel } from '../../ui/cafePanel';
import { BuskingPanel } from '../../ui/buskingPanel';
import { phaseForHour, seoulHour } from '../world/timeOfDay';
import { fetchCoins, claimDaily, buyItem, craftFurniture, fetchFurnitureCraftHistory, fetchWeeklyFurniturePurchaseHistory, sellItem } from '../../db/economyApi';
import { claimDailyQuest, recordDailyProgress, refreshVerifiedProgress } from '../../db/progressionApi';
import { fetchInventory } from '../../db/roomsApi';
import { buildStreetArt } from '../art/streetArt';
import { furnitureWorkshopPreview } from '../art/furnitureWorkshopArt';
import { BUILDING_TEXTURES, PROP_ASSETS } from '../art/assetManifest';
import { CHAR_H, CHAR_ORIGIN_Y, CHAR_W, ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { DEFAULT_APPEARANCE, type Appearance } from '../art/appearance';
import { ClosetStore } from '../art/closet';
import { LookbookStore, type LookbookProgress } from '../art/lookbook';
import { CharacterZineStore } from '../progression/characterZine';
import { rareStyleUnlockCount } from '../art/styleCatalog';
import { FURNITURE_RECIPE_BY_ID, furnitureAcquisitionChannel } from '../home/furnitureWorkshop';
import { CATALOG_BY_ID } from '../../items/catalog';
import { lifeMasteryQuestMetrics, lifeMasteryViews } from '../progression/lifeMastery';
import type { LifeSpecialtyProgress } from '../progression/lifeSpecialty';
import type { DailyInvitationProgress } from '../progression/dailyInvitations';
import type { SessionPlannerProgress } from '../progression/sessionPlanner';
import type { FanMerchWorkshopProgress } from '../progression/fanMerchWorkshop';
import { villageJourneyMetrics, villageJourneySummary } from '../progression/villageJourney';
import { adventurePathMetrics } from '../progression/adventurePaths';
import { villageLevelMemoryMetrics } from '../progression/villageLevelMemories';
import { STARTER_COMPASS_ROUTES, starterCompassMetrics } from '../progression/starterCompass';
import type { ResidentRendezvousProgress } from '../residents/residentRendezvous';
import type { ResidentLetterProgress } from '../residents/residentLetters';
import type { ResidentFanbookProgress } from '../residents/residentFanbook';
import type { ResidentRoomCareProgress } from '../residents/residentRoomCare';
import { CustomizePanel } from '../../ui/customizePanel';
import { saveAppearance, linkIdCode } from '../../ui/loginPanel';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { performanceComfort } from '../performance/performanceComfort';
import { playComfort } from '../accessibility/playComfort';
import { tileToWorld, worldToTile, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { RemoteTrack } from '../entities/remoteMotion';
import { screenToTile } from '../input/pointer';
import { POS_HZ, INTERP_DELAY_MS, sanitizeChat, type EmoteKind, type NeighborCheerKind, type PetMeetKind } from '../../net/protocol';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { ChatInput } from '../../ui/chatInput';
import { ChatFeed } from '../../ui/chatFeed';
import { OnlineList } from '../../ui/onlineList';
import { EmoteWheel, EMOTE_EMOJI } from '../../ui/emoteWheel';
import { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { AchievementStore, BADGE_BY_ID } from '../achievements';
import { TreasurePanel } from '../../ui/treasurePanel';
import type { TreasureStore } from '../treasure/treasureStore';
import { STREET_SPARKLES } from '../treasure/treasures';
import { BagPanel } from '../../ui/bagPanel';
import { CollectionPanel } from '../../ui/collectionPanel';
import { TASTE_SET_BY_ID, type TasteSetProgress } from '../progression/tasteSetArchive';
import { MapPanel } from '../../ui/mapPanel';
import { Minimap } from '../../ui/minimap';
import { ResidentsPanel } from '../../ui/residentsPanel';
import { VillageProfilePanel, type VillageProfileSelfContext } from '../../ui/villageProfilePanel';
import { HomeStudioCardStore } from '../home/homeStudioCards';
import { RankingPanel } from '../../ui/rankingPanel';
import { fetchRanking } from '../../db/rankingApi';
import { ActionMotions, IdleBreath } from '../entities/actionMotion';
import { ResidentNpcs } from '../entities/npcResidents';
import { RESIDENTS, metCount } from '../residents/residents';
import { residentTrustMetrics } from '../residents/residentStories';
import { audio } from '../audio';
import type { FestivalArchiveStore } from '../events/festivalArchive';
import type { ChronicleProgress } from '../progression/villageChronicle';
import type { NeighborCheerProgress } from '../social/neighborCheers';
import {
  NeighborhoodMarketStore, type MarketPriceTier, type NeighborhoodMarketProgress,
} from '../social/neighborhoodMarket';
import { NeighborhoodMarketPanel } from '../../ui/neighborhoodMarketPanel';
import {
  buyMarketListing, cancelMarketListing, createMarketListing, fetchMarketListings, fetchMarketSummary,
} from '../../db/neighborhoodMarketApi';

interface StreetData {
  peer: PeerState;
  adapter: NetworkAdapter | null;
  /** 방에서 나올 때 등 특정 위치로 스폰 (기본: 역 광장) */
  spawnTile?: { tx: number; ty: number };
}

interface Remote {
  peer: PeerState;
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
  badge: string | null;
  title: Phaser.GameObjects.Text;              // 상대 호칭
  weaponSprite: Phaser.GameObjects.Sprite | null; // 상대 장착 무기
  appearance: Appearance;                       // 정보창 미리보기용
  petId: string | null;
  weaponId: string;
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
  private starterConcierge: StarterConciergeDock | null = null;
  private photoBooth: PhotoBoothPanel | null = null;
  private gardenPanel: GardenPanel | null = null;
  private cookingPanel: CookingPanel | null = null;
  private fishingPanel: FishingPanel | null = null;
  private photoAlbum!: PhotoAlbumStore;
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
  private petStyleStudio: PetStyleStudioPanel | null = null;
  private petStore = new PetStore(() => this.achievementStore?.get().unlocked ?? []);
  private petOutingStore!: PetOutingStore;
  private petStyleStudioStore!: PetStyleStudioStore;
  private petHomeMemoryStore!: PetHomeMemoryStore;
  private requestBoardStore!: VillageRequestStore;
  private festivalArchiveStore!: FestivalArchiveStore;
  private pet: PetFollower | null = null;
  private onPetShopTile = false;
  private lastPetAt = 0;
  private petGiftMs = 0;
  // 전투/레벨업
  private battleStore!: BattleStore;
  private adventureRoleStore!: AdventureRoleStore;
  private neighborhoodMarketStore!: NeighborhoodMarketStore;
  private hunt: HuntField | null = null;
  private battleHud: BattleHud | null = null;
  private adventureRolePanel: AdventureRolePanel | null = null;
  private neighborhoodMarket: NeighborhoodMarketPanel | null = null;
  private weaponShop: WeaponShopPanel | null = null;
  private onWeaponShopTile = false;
  private playerHp = 40;
  private fatigueUntil = 0;
  private lastHitMs = -9999;
  private lastHuntRewardMs = -9999;
  private syncReady = false;
  private lastSyncSaveMs = 0;
  private weaponSprite: Phaser.GameObjects.Sprite | null = null;
  private playerTitle!: Phaser.GameObjects.Text;
  private playerAura!: PlayerAura;
  private playerInfo: PlayerInfoPanel | null = null;
  private properties: Property[] = [];
  private onRealtyTile = false;
  private escHandler: ((e: KeyboardEvent) => void) | null = null;
  private forestMs = 0;
  private hud: GameHud | null = null;
  private questStore!: QuestStore;
  private achievementStore!: AchievementStore;
  private closetStore!: ClosetStore;
  private lookbookStore!: LookbookStore;
  private characterZineStore!: CharacterZineStore;
  private treasureStore!: TreasureStore;
  private gardenStore!: GardenStore;
  private cookingStore!: CookingStore;
  private fishingStore!: FishingStore;
  private homeAquariumStore!: HomeAquariumStore;
  private furnitureReformStore!: FurnitureReformStore;
  private treasure: TreasurePanel | null = null;
  private lastSparkleTile = '';
  private bag: BagPanel | null = null;
  private dex: CollectionPanel | null = null;
  private mapPanel: MapPanel | null = null;
  private minimap: Minimap | null = null;
  private lastMinimapMs = 0;
  private residentsPanel: ResidentsPanel | null = null;
  private profilePanel: VillageProfilePanel | null = null;
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
  private hasExplicitSpawn = false;   // 내부·방 복귀처럼 명시적 스폰이 주어졌는지
  private lastPosSaveMs = 0;
  private sceneDoorSet = new Set<string>(); // 씬 전환 문 — 여기서 리스폰하면 자동 입장 루프
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
    this.battleStore = new BattleStore(this.peer.userId);
    this.adventureRoleStore = new AdventureRoleStore(this.peer.userId);
    this.neighborhoodMarketStore = new NeighborhoodMarketStore(this.peer.userId);
    this.questStore = this.registry.get('quests') as QuestStore;
    this.achievementStore = new AchievementStore(this.peer.userId);
    this.closetStore = new ClosetStore(this.peer.userId);
    this.lookbookStore = new LookbookStore(this.peer.userId);
    this.characterZineStore = new CharacterZineStore(this.peer.userId);
    this.petOutingStore = new PetOutingStore(this.peer.userId);
    this.petStyleStudioStore = new PetStyleStudioStore(this.peer.userId);
    this.petHomeMemoryStore = new PetHomeMemoryStore(this.peer.userId);
    this.requestBoardStore = this.registry.get('requests') as VillageRequestStore;
    this.festivalArchiveStore = this.registry.get('festivals') as FestivalArchiveStore;
    this.photoAlbum = new PhotoAlbumStore(this.peer.userId);
    this.achievementStore.sync(this.questStore.views());
    this.questStore.setMetric('rare_styles', rareStyleUnlockCount(this.achievementStore.get().unlocked));
    this.achievementStore.sync(this.questStore.views());
    this.peer.badge = this.achievementStore.equipped()?.name ?? null;
    this.treasureStore = this.registry.get('treasure') as TreasureStore;
    this.gardenStore = this.registry.get('garden') as GardenStore;
    this.cookingStore = this.registry.get('cooking') as CookingStore;
    this.fishingStore = this.registry.get('fishing') as FishingStore;
    this.homeAquariumStore = this.registry.get('homeAquarium') as HomeAquariumStore;
    this.furnitureReformStore = this.registry.get('furnitureReform') as FurnitureReformStore;
    this.remotes = new Map();
    this.bubbles = [];
    this.spawnTile = data.spawnTile ?? SPAWN_TILE;
    this.hasExplicitSpawn = !!data.spawnTile;
    this.entering = false;
  }

  create(): void {
    this.grid = buildCollision();

    // 씬 전환 문 집합 (여기서 리스폰하면 자동 입장 루프) — 복원 안전성 판정용
    this.sceneDoorSet = new Set([
      ...HOUSE_DOORS.map((d) => `${d.tx},${d.ty}`),
      ...INTERIOR_DOORS.map((d) => `${d.tx},${d.ty}`),
      ...COMPANY_DOORS.map((d) => `${d.tx},${d.ty}`),
    ]);
    // 새로고침 복원: 명시적 스폰(내부·방 복귀)이 없을 때만 마지막 위치를 되살린다
    if (!this.hasExplicitSpawn) {
      const saved = loadLastPos(this.peer.userId);
      if (saved && this.safeSpawn(saved.tx, saved.ty)) this.spawnTile = saved;
    }

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
      .setOrigin(0.5, CHAR_ORIGIN_Y).setDepth(10); // 발이 충돌 박스 바닥에 오게
    this.playerLabel = this.makeNameLabel(this.peer.nickname, 'me').setDepth(11);
    // 이름 위 레벨 호칭
    this.playerTitle = this.add.text(spawn.x, spawn.y, '', {
      fontFamily: UI_FONT, fontSize: '9px', color: '#ffe08a', fontStyle: 'bold',
      stroke: '#3a2410', strokeThickness: 2.5, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(11).setAlpha(0.98);

    // 동행 펫 (펫샵에서 입양) — 플레이어를 졸졸 따라온다
    const activePetId = this.petStore.activeId();
    this.pet = new PetFollower(
      this, activePetId, activePetId ? this.petStore.accessory(activePetId) : 'none',
      activePetId ? this.petStore.nickname(activePetId) : null,
    );
    this.refreshPetStage();
    // 온라인이면 서버 보유 펫을 병합 (기기 간 유지)
    if (this.sb) {
      void this.syncServerPetProgress();
      void this.syncVerifiedProgress(false);
    }

    // 사냥터 전투 (마을 밖 = 경의선 숲길 필드) — 근접 자동 전투
    this.playerHp = maxHpForLevel(this.battleStore.level);
    this.battleHud = new BattleHud({ onOpenRoles: () => this.adventureRolePanel?.open() });
    this.hunt = new HuntField(this,
      { x: HUNT_FIELD.x * TILE, y: HUNT_FIELD.y * TILE, w: HUNT_FIELD.w * TILE, h: HUNT_FIELD.h * TILE },
      {
        getPlayerPos: () => ({ x: this.player.x, y: this.player.y }),
        getPlayerAtk: () => totalAtk(this.battleStore.level, weaponById(this.battleStore.equippedId()).atk, this.isFatigued())
          * this.adventureRoleStore.modifier().attackMultiplier,
        getPlayerAttackInterval: () => this.adventureRoleStore.attackInterval(),
        currentTier: () => this.battleStore.tier,
        onPlayerHit: (dmg) => this.damagePlayer(
          Math.max(1, Math.round(dmg * this.adventureRoleStore.modifier().damageTakenMultiplier)),
        ),
        onDefeat: (species) => this.onMonsterDefeat(species),
        onSwing: () => this.swingWeapon(),
      });
    this.refreshNameTag();
    this.refreshWeaponSprite();
    // 레벨 간지 오라 (레벨↑ → 점점 화려하게) + 펫·레벨을 상대에게 전파
    this.playerAura = new PlayerAura(this);
    this.playerAura.setLevel(this.battleStore.level);
    this.peer.pet = this.petStore.activeId();
    this.peer.petAccessory = activePetId ? this.petStore.accessory(activePetId) : 'none';
    this.peer.petName = activePetId ? this.petStore.nickname(activePetId) : null;
    this.peer.level = this.battleStore.level;
    this.peer.weapon = this.battleStore.equippedId();
    if (this.sb) void fetchOwnedWeapons(this.sb, this.peer.userId).then((ids) => {
      ids.forEach((id) => this.battleStore.buyWeapon(id));
      this.setQuestMetric('weapons_owned', this.battleStore.weaponsOwned().length);
    });

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
      if (this.pet?.contains(wp.x, wp.y) && !this.anyPanelOpen()) { void this.pettingActivePet(); return; }
      // 다른 유저를 클릭하면 정보창 (닉·레벨·호칭·무기·펫)
      if (!this.anyPanelOpen()) {
        for (const r of this.remotes.values()) {
          if (r.sprite.getBounds().contains(wp.x, wp.y)) {
            this.playerInfo?.open({ nickname: r.nick, level: r.level, appearance: r.appearance, pet: r.petId, weapon: r.weaponId });
            return;
          }
        }
      }
      const { tx, ty } = screenToTile(p.x, p.y, {
        scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
        width: cam.width, height: cam.height,
      });
      const door = HOUSE_DOORS.find((d) => d.tx === tx && d.ty === ty);
      if (door) void this.enterDoor(door.roomId);
    });

    // 카메라 — 로컬 플레이어만 팔로우 (좁은 화면은 줌을 낮춰 시야 확보)
    this.reassertCamera();
    // 건물에서 나온 직후 리사이즈 레이스로 팔로우가 풀려 "맵 전체가 보이며 멈추는" 현상 방지 — 재확정
    this.time.delayedCall(60, () => this.reassertCamera());
    this.time.delayedCall(220, () => this.reassertCamera());
    // 화면 회전·리사이즈 시 줌 재적용
    this.scale.on('resize', this.onResize, this);

    this.setupUi();
    void this.initSync();
    // 개발 전용 UI 프리뷰: 이동 없이 주요 패널 회귀 테스트.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      if (params.has('pet-style-profile-ready')) {
        const previewStyles = [
          { petId: 'dog', petName: '몽실', personalityId: 'gentle', accessoryId: 'scarf', backdropId: 'rain_window', poseId: 'look_back' },
          { petId: 'cat', petName: '보리', personalityId: 'calm', accessoryId: 'beret', backdropId: 'cozy_home', poseId: 'daydream' },
          { petId: 'rabbit', petName: '토리', personalityId: 'performer', accessoryId: 'ribbon', backdropId: 'little_stage', poseId: 'spotlight' },
        ] as const;
        previewStyles.forEach((draft, slot) => {
          this.petStore.adopt(draft.petId);
          if (!this.petStyleStudioStore.card(slot)) this.petStyleStudioStore.save(slot, draft);
        });
        for (const card of this.petStyleStudioStore.get().slots) {
          if (!card || this.petStyleStudioStore.progress().featured >= 3) break;
          if (!this.petStyleStudioStore.get().featuredIds.includes(card.id)) this.petStyleStudioStore.feature(card.id);
        }
        this.petStore.setActive('dog');
        this.handleSetActivePet('dog');
        this.syncVillageProfileMetrics();
        this.time.delayedCall(140, () => this.profilePanel?.openSelf());
      }
      if (params.has('pet-style-ready')) {
        for (const id of ['dog', 'cat', 'rabbit']) this.petStore.adopt(id);
        this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'playful');
        this.petStore.mergeServerProgress([{
          petId: 'dog', affinity: 100, feeds: 8, plays: 8, trainings: 5,
          tricks: ['hello', 'paw', 'spin', 'dance', 'pose'],
          lastFedDay: null, lastPlayedDay: null, lastTrainedDay: null,
        }]);
        this.handleSetActivePet('dog');
        this.time.delayedCall(120, () => this.petStyleStudio?.open(this.petStore, 'dog'));
      }
      if (params.has('petshop')) this.time.delayedCall(120, () => this.openPetShop());
      if (params.has('photo')) this.time.delayedCall(120, () => this.openPhotoBooth());
      if (params.has('garden')) this.time.delayedCall(120, () => this.gardenPanel?.open());
      if (params.has('kitchen')) this.time.delayedCall(120, () => this.cookingPanel?.open());
      if (params.has('fishing')) this.time.delayedCall(120, () => this.fishingPanel?.open());
    }
    if (this.adapter) this.wireAdapter(this.adapter);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    performanceComfort.recordFrame(delta);
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
          this.incQuest('visit_shop');
          audio.playSe('door');
          this.scene.start('interior', { shop: interiorDoor.shop, peer: this.peer, adapter: this.adapter });
          return;
        }
        const companyDoor = COMPANY_DOORS.find((d) => d.tx === tile.tx && d.ty === tile.ty);
        if (companyDoor && !this.entering) {
          this.entering = true;
          this.incQuest('visit_company');
          audio.playSe('door');
          this.scene.start('company', { companyId: companyDoor.company, peer: this.peer, adapter: this.adapter });
          return;
        }
        const onBoard = tile.tx === BOARD_SPOT.tx && tile.ty === BOARD_SPOT.ty;
        if (onBoard && !this.onBoardTile && this.quests && !this.quests.isOpen) {
          this.incQuest('open_quest');
          this.quests.open(
            this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
            this.questStore.focusedQuestId(),
          );
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
    // 진행 데이터 주기 저장 (계정 동기) — 복원 완료 후에만
    if (this.syncReady && this.sb && this.time.now - this.lastSyncSaveMs > 8000) {
      this.lastSyncSaveMs = this.time.now;
      void saveGameState(this.sb, this.peer.userId, this.buildSnapshot());
    }
    if (this.minimap && this.time.now - this.lastMinimapMs > 200) {
      this.lastMinimapMs = this.time.now;
      this.minimap.update(worldToTile(next.x, next.y), this.remoteTiles());
    }
    this.idleBreath?.set(!moving && !this.anyPanelOpen());

    // 위치 브로드캐스트 (POS_HZ 스로틀)
    const now = this.time.now;
    if (this.adapter && now - this.lastSentAt >= 1000 / POS_HZ) {
      this.lastSentAt = now;
      this.adapter.sendPos({ x: Math.round(next.x), y: Math.round(next.y), f: this.facing });
    }
    // 마지막 위치 저장 (새로고침 복원용) — 안전 타일일 때만, 1.5s 스로틀
    if (now - this.lastPosSaveMs > 1500) {
      this.lastPosSaveMs = now;
      const pt = worldToTile(next.x, next.y);
      if (this.safeSpawn(pt.tx, pt.ty)) saveLastPos(this.peer.userId, pt.tx, pt.ty);
    }

    // 원격 플레이어 보간 + 걷기 애니메이션
    const renderT = Date.now() - INTERP_DELAY_MS;
    for (const r of this.remotes.values()) {
      const p = r.track.sample(renderT);
      if (p) {
        const moved = Math.abs(p.x - r.sprite.x) + Math.abs(p.y - r.sprite.y) > 0.4;
        r.sprite.setPosition(p.x, p.y);
        r.label.setPosition(p.x, p.y - 26);
        r.title.setPosition(p.x, p.y - 38);
        r.ring.setPosition(p.x, p.y + 12);
        r.aura.follow(p.x, p.y);
        r.pet.update(p.x, p.y, delta);
        if (r.weaponSprite) {
          const left = r.lastF === 2;
          r.weaponSprite.setFlipX(left).setDepth(r.lastF === 3 ? 9 : 11)
            .setAngle(left ? -25 : 25).setPosition(p.x + (left ? -9 : 9), p.y - (r.lastF === 3 ? 12 : 6));
        }
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
    this.playerLabel.setPosition(this.player.x, this.player.y - 40);
    this.playerTitle.setPosition(this.player.x, this.player.y - 52);
    this.playerRing.setPosition(this.player.x, this.player.y + 12);
    this.playerAura?.follow(this.player.x, this.player.y);
    this.positionWeaponSprite();
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 50);
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
      this.incQuest('visit_home');
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: true, peer: this.peer, adapter: this.adapter,
        houseType: prop?.houseType ?? 'oneroom', floorSeed: prop?.floorSeed ?? roomId, dealType: null,
        isPublic: false,
      });
      return;
    }
    // 온라인: 최신 소유 상태 확인
    this.properties = await fetchProperties(this.sb);
    const p = this.properties.find((x) => x.id === roomId);
    if (!p) return;
    if (p.holderId === this.peer.userId) {
      this.entering = true;
      this.incQuest('visit_home');
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: true, peer: this.peer, adapter: this.adapter,
        houseType: p.houseType, floorSeed: p.floorSeed, dealType: p.dealType, isPublic: p.isPublic,
      });
    } else if (p.holderId === null) {
      this.showBubble(this.player, '공실이에요 — 복덕방에서 계약할 수 있어요 🏘️');
    } else if (!p.isPublic) {
      this.showBubble(this.player, '집주인이 지금은 문을 닫아 두었어요. 명함과 응원은 그대로 볼 수 있어요 🔒');
    } else {
      // 남의 집 구경 모드
      this.entering = true;
      this.incQuest('visit_home');
      audio.playSe('door');
      this.scene.start('room', {
        roomId, isOwner: false, peer: this.peer, adapter: this.adapter,
        houseType: p.houseType, floorSeed: p.floorSeed, dealType: p.dealType, isPublic: p.isPublic,
        visitOwner: { userId: p.holderId, nickname: '이웃' },
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
      const prevLevel = r.level;
      const prevWeapon = r.weaponId;
      const prevPet = r.petId;
      r.peer = peer;
      r.charKey = ensureCharacter(this, peer.appearance);
      r.sprite.stop();
      r.sprite.setTexture(r.charKey, r.lastF * FRAMES_PER_DIR);
      r.nick = peer.nickname;
      r.level = peer.level ?? r.level;
      r.appearance = peer.appearance;
      r.badge = peer.badge ?? null;
      r.label.setText(`${r.badge ? `◆ ${r.badge}\n` : ''}● ${peer.nickname}  Lv.${r.level}`);
      r.title.setText(`〈${titleForLevel(r.level)}〉`);
      r.pet.setSpecies(peer.pet ?? null, peer.petAccessory ?? 'none', peer.petName ?? null); // 상대 펫 개성 반영
      r.petId = peer.pet ?? null;
      r.aura.setLevel(r.level);
      // 상대 무기 반영
      r.weaponId = peer.weapon ?? 'fist';
      const wkey = ensureWeaponSprite(this, r.weaponId);
      if (!wkey) { r.weaponSprite?.destroy(); r.weaponSprite = null; }
      else if (r.weaponSprite) r.weaponSprite.setTexture(wkey);
      else r.weaponSprite = this.add.sprite(r.sprite.x, r.sprite.y, wkey).setOrigin(0.5, 0.85).setDepth(11);
      // 즉시 보이는 효과 — 상대 레벨업/장비 변경을 남들도 본다
      if (r.level > prevLevel) {
        this.levelUpFx(r.sprite, r.level);
        this.showBubble(r.sprite, `🎉 Lv.${r.level} 달성!`, 'user');
        this.chatFeed?.push('', `${r.nick}님이 Lv.${r.level} 달성! 🎉`, 'system');
      } else if (r.weaponId !== prevWeapon && r.weaponId !== 'fist') {
        this.sparkleFx(r.sprite, '⚔️✨');
      } else if (r.petId !== prevPet && r.petId) {
        this.sparkleFx(r.sprite, '🐾');
      }
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
    a.onNeighborCheer((id, message) => {
      const remote = this.remotes.get(id);
      if (remote && this.profilePanel?.receiveNeighborCheer(remote.peer, message.k)) {
        this.showBubble(remote.sprite, '응원 우편을 보냈어요 ✉', 'user');
        this.chatFeed?.push('', `${remote.nick}님에게서 취향 응원 우편이 도착했어요.`, 'system');
        audio.playSe('success');
      }
    });
    a.onPetMeet((id, message) => {
      const remote = this.remotes.get(id);
      if (remote && this.profilePanel?.receivePetMeet(remote.peer, message.k)) {
        this.showBubble(remote.sprite, '동행 인사 엽서가 도착했어요 🐾', 'user');
        this.chatFeed?.push('', `${remote.nick}님의 동행과 새 인사 엽서를 남겼어요.`, 'system');
        audio.playSe('success');
      }
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
      .setOrigin(0.5, CHAR_ORIGIN_Y).setDepth(10).setInteractive({ useHandCursor: true });
    const level = peer.level ?? 1;
    const badge = peer.badge ?? null;
    const label = this.makeNameLabel(`${peer.nickname}  Lv.${level}`, 'user').setDepth(11);
    if (badge) label.setText(`◆ ${badge}\n● ${peer.nickname}  Lv.${level}`);
    // 상대 동행 펫 + 레벨 간지 오라
    const pet = new PetFollower(this, peer.pet ?? null, peer.petAccessory ?? 'none', peer.petName ?? null);
    const aura = new PlayerAura(this);
    aura.setLevel(level);
    const title = this.add.text(0, 0, `〈${titleForLevel(level)}〉`, {
      fontFamily: UI_FONT, fontSize: '9px', color: '#ffe08a', fontStyle: 'bold',
      stroke: '#3a2410', strokeThickness: 2.5, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(11).setAlpha(0.96);
    const weaponId = peer.weapon ?? 'fist';
    const wkey = ensureWeaponSprite(this, weaponId);
    const weaponSprite = wkey ? this.add.sprite(0, 0, wkey).setOrigin(0.5, 0.85).setDepth(11) : null;
    this.remotes.set(peer.userId, {
      peer, sprite, label, ring, track: new RemoteTrack(), charKey, lastF: 0, nick: peer.nickname,
      badge,
      pet, aura, level, title, weaponSprite, appearance: peer.appearance, petId: peer.pet ?? null, weaponId,
    });
    sprite.on('pointerdown', () => {
      const current = this.remotes.get(peer.userId);
      if (current && !this.anyPanelOpen()) this.profilePanel?.openPeer(current.peer);
    });
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
    r.title.destroy();
    r.weaponSprite?.destroy();
    r.ring.destroy();
    r.pet.destroy();
    r.aura.destroy();
    this.remotes.delete(userId);
    this.chatFeed?.push('', `${r.nick}님이 나갔어요`, 'system');
    this.refreshOnline();
  }

  /** 다른 유저들의 현재 타일 (지도·미니맵용) */
  private remoteTiles(): Array<{ tx: number; ty: number }> {
    return [...this.remotes.values()].map((r) => worldToTile(r.sprite.x, r.sprite.y));
  }

  /** 좌상단 접속자 목록 갱신 (나 + 원격 닉네임) */
  private refreshOnline(): void {
    this.onlineList?.render([...this.remotes.values()].map((r) => r.nick));
  }

  private onResize(): void {
    this.reassertCamera();
  }

  /** 카메라 줌·경계·팔로우를 항상 다시 확정 (씬 전환·리사이즈 후 팔로우 유실 방지) */
  private reassertCamera(): void {
    const cam = this.cameras.main;
    if (!cam || !this.player) return;
    cam.setZoom(streetZoom());
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  private updateFacing(input: MoveInput): void {
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
  }

  // --- UI (채팅·이모트·힌트) ---

  private setupUi(): void {
    this.adventureRolePanel = new AdventureRolePanel(this.adventureRoleStore, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      getLevel: () => this.battleStore.level,
      onChanged: (progress) => {
        this.writeAdventureRoleMetrics(progress);
        this.tickBattle(0);
        this.refreshAchievementState(true);
        this.refreshQuestTracker();
      },
    });
    this.writeAdventureRoleMetrics(this.adventureRolePanel.progress());
    // 접속자 목록(좌상단) + 전체 채팅 피드 — 멀티일 때만 의미, 오프라인도 나 표시
    this.onlineList = new OnlineList(this.peer.nickname, '', () => {
      if (!this.anyPanelOpen()) this.profilePanel?.openSelf();
    });
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
      closet: this.closetStore,
      lookbook: this.lookbookStore,
      characterZine: this.characterZineStore,
      getUnlockedBadgeIds: () => this.achievementStore.get().unlocked,
      getQuestState: () => this.questStore.get(),
      onWardrobeAction: (action) => {
        if (action === 'preset') this.incQuest('fashion_preset');
        else if (action === 'slot_save') this.incQuest('closet_save');
        else if (action === 'slot_load') this.incQuest('closet_load');
        else if (action === 'dye') this.incQuest('fashion_dye');
        this.syncClosetMetrics();
        this.syncVillageProfileMetrics();
      },
      onLookbookChanged: (progress) => this.handleLookbookChanged(progress),
      onCharacterZineChanged: () => {
        this.syncCharacterZineMetrics();
        this.syncVillageProfileMetrics();
      },
      onCharacterEpisodeNavigate: (metric, title) => this.navigateClassicRequest(metric, title),
      onCharacterEpisodeReplay: (card, episode) => {
        this.applyAppearance(card.appearance, true);
        this.navigateClassicRequest(episode.requirements[0]!.key, `${card.name} · ${episode.title}`);
      },
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
    kb.on('keydown-K', () => { if (!this.anyPanelOpen()) this.adventureRolePanel?.open(); });
    kb.on('keydown-N', () => void this.openNeighborhoodMarket());
    // ESC로 열린 패널 닫기 — 패널이 Phaser 키보드를 끄므로 document 레벨에서 처리
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (this.closeTopPanel()) e.stopPropagation(); }
    };
    document.addEventListener('keydown', this.escHandler);

    this.shop = new ShopPanel({
      buyEnabled: !!this.sb,
      previewForItem: (itemId) => furnitureWorkshopPreview(this, itemId),
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onBuy: (itemId) => this.handleBuy(itemId),
      onSell: (itemId) => this.handleSell(itemId),
      onCraft: (recipeId) => this.handleFurnitureCraft(recipeId),
    });
    this.neighborhoodMarket = new NeighborhoodMarketPanel(this.neighborhoodMarketStore, {
      userId: this.peer.userId,
      online: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      getInventory: () => this.shopCounts,
      getCoins: () => this.coins,
      loadListings: this.sb ? () => fetchMarketListings(this.sb!, this.peer.userId) : undefined,
      loadSummary: this.sb ? () => fetchMarketSummary(this.sb!) : undefined,
      createListing: (itemId, tier) => this.createNeighborhoodMarketListing(itemId, tier),
      cancelListing: (listingId) => this.cancelNeighborhoodMarketListing(listingId),
      buyListing: (listingId) => this.buyNeighborhoodMarketListing(listingId),
      previewForItem: (itemId) => furnitureWorkshopPreview(this, itemId),
      onChanged: (progress) => {
        this.writeNeighborhoodMarketMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
    });
    this.writeNeighborhoodMarketMetrics(this.neighborhoodMarket.progress());
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
      onWin: (prize, ownedCount) => {
        this.showBubble(this.player, `${prize} 획득! 🎉`);
        this.motions?.play(this.player, 'win');
        this.incQuest('claw_win');
        this.setQuestMetric('dolls_owned', ownedCount);
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
    this.quests = new QuestPanel(this.peer.userId, {
      online: !!this.sb,
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onClaim: (questId) => void this.handleQuestClaim(questId),
      onEquipBadge: (badgeId) => this.handleEquipBadge(badgeId),
      onFocus: (questId) => this.handleQuestFocus(questId),
      requestBoard: this.requestBoardStore,
      festivalArchive: this.festivalArchiveStore,
      getQuestState: () => this.questStore.get(),
      getAppearance: () => this.peer.appearance,
      getPet: () => {
        const speciesId = this.petStore.activeId();
        return speciesId ? { speciesId, accessory: this.petStore.accessory(speciesId) } : null;
      },
      getResidentTrust: () => this.residents?.getTrust() ?? {},
      onRequestChanged: (progress) => this.handleRequestBoardChanged(progress),
      onFestivalChanged: () => {
        this.syncFestivalMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onChronicleChanged: (progress) => {
        this.writeChronicleMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onLifeSpecialtyChanged: (progress) => {
        this.writeLifeSpecialtyMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onDailyInvitationsChanged: (progress) => {
        this.writeDailyInvitationMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onSessionPlannerChanged: (progress) => {
        this.writeSessionPlannerMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
        this.showBubble(this.player, progress.archivedPages > 0
          ? `오늘의 플레이 큐 기록 ${progress.archivedPages}장을 보존했어요.`
          : `오늘의 플레이 큐 ${progress.slots}/3칸을 정리했어요.`);
      },
      onFanMerchChanged: (progress) => {
        this.writeFanMerchMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
        this.showBubble(this.player, `최애 굿즈 ${progress.savedSlots}/12칸 · 디자인 ${progress.discoveries}종`);
      },
      onStarterCompassChanged: (progress) => {
        this.questStore.setMetric('starter_keepsakes', progress.claimed);
        this.questStore.setMetric('starter_featured_keepsake', progress.featured);
        this.questStore.setMetric('starter_mentor_chapters', progress.mentorChapters);
        this.questStore.setMetric('starter_mentor_routes', progress.mentorRoutes);
        for (const route of STARTER_COMPASS_ROUTES) {
          this.questStore.setMetric(`starter_mentor_${route.id}_complete`, Number(progress.mentorRouteIds.includes(route.id)));
        }
        this.questStore.setMetric('starter_mentor_featured', progress.featuredMentorScenes);
        this.questStore.setMetric('starter_mentor_replays', progress.mentorReplays);
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onVillageLevelMemoriesChanged: (progress) => {
        for (const [key, value] of Object.entries(villageLevelMemoryMetrics(progress))) {
          this.questStore.setMetric(key, value);
        }
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
        this.showBubble(this.player, '레벨업 장면을 앨범에 보존했어요.');
      },
      onRequestNavigate: (metric, title) => this.navigateClassicRequest(metric, title),
      onOpenVillageReward: (target) => this.openVillageReward(target),
    });
    this.writeChronicleMetrics(this.quests.chronicleProgress());
    this.syncLifeSpecialtyMetrics();
    this.syncDailyInvitationMetrics();
    this.writeSessionPlannerMetrics(this.quests.sessionPlannerProgress());
    this.writeFanMerchMetrics(this.quests.fanMerchProgress());
    this.starterConcierge = new StarterConciergeDock(this.peer.userId, {
      getQuestState: () => this.questStore.get(),
      getSelectedRouteId: () => this.quests?.starterCompassSelectedRouteId() ?? null,
      onSelectRoute: (routeId) => {
        this.quests?.selectStarterCompassRoute(routeId);
        this.starterConcierge?.refresh();
      },
      onNavigate: (metric, title) => this.navigateClassicRequest(metric, title),
      onOpenJournal: () => this.openQuests(),
    });
    this.photoBooth = new PhotoBoothPanel(this.photoAlbum, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onSaved: (record) => this.handlePhotoSaved(record),
      onDeleted: () => this.syncPhotoMetrics(),
      onCardsChanged: () => {
        this.syncPhotoMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
    });
    this.gardenPanel = new GardenPanel(this.gardenStore, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onChanged: () => {
        this.syncGardenMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onOpenKitchen: () => this.cookingPanel?.open(),
    });
    this.cookingPanel = new CookingPanel(this.cookingStore, this.gardenStore, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onChanged: () => {
        this.syncCookingMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
      onOpenGarden: () => this.gardenPanel?.open(),
    });
    this.fishingPanel = new FishingPanel(this.fishingStore, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onChanged: () => {
        this.syncFishingMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
    });
    this.petStyleStudio = new PetStyleStudioPanel(this.petStyleStudioStore, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onApply: (draft) => this.applyPetStyle(draft),
      onChanged: (progress) => {
        this.writePetStyleMetrics(progress);
        this.syncVillageProfileMetrics();
        this.refreshAchievementState(true);
        this.refreshHearts();
        this.refreshQuestTracker();
      },
    });
    this.writePetStyleMetrics(this.petStyleStudioStore.progress());
    this.petShop = new PetShopPanel(this.peer.userId, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onAdopt: (petId) => void this.handleAdopt(petId),
      onSetActive: (petId) => this.handleSetActivePet(petId),
      onFeed: (petId) => void this.handleFeed(petId),
      onPlay: (petId) => void this.handlePlayPet(petId),
      onTrain: (petId) => void this.handleTrainPet(petId),
      onTrick: (petId, trickId) => this.handlePetTrick(petId, trickId),
      onRename: (petId, nickname) => this.handlePetRename(petId, nickname),
      onPersonality: (petId, personality) => this.handlePetPersonality(petId, personality),
      onAccessory: (petId, accessory) => this.handlePetAccessory(petId, accessory),
      onOpenStyleStudio: (petId) => {
        this.petShop?.close();
        this.petStyleStudio?.open(this.petStore, petId);
      },
      outings: this.petOutingStore,
      homeMemories: (petId) => this.petHomeMemoryStore.views(petId),
      onOutingChanged: (progress) => this.handlePetOutingChanged(progress),
      onSignalsChanged: (progress) => this.handlePetSignalsChanged(progress),
      onPerformanceChanged: (progress) => this.handlePetPerformanceChanged(progress),
    });
    this.writePetSignalMetrics(this.petShop.signalProgress());
    this.writePetPerformanceMetrics(this.petShop.performanceProgress());
    this.weaponShop = new WeaponShopPanel({
      onToggle: (open) => this.setGameKeysEnabled(!open),
      onBuy: (weaponId) => void this.handleBuyWeapon(weaponId),
      onEquip: (weaponId) => this.handleEquipWeapon(weaponId),
    });
    this.playerInfo = new PlayerInfoPanel((open) => this.setGameKeysEnabled(!open));

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
      onGreet: (s) => {
        this.motions!.play(s, 'greet');
        this.questStore.bump('resident_greet');
        this.syncResidentQuestMetrics();
        this.refreshAchievementState(true);
        this.refreshQuestTracker();
      },
    });

    // 게임형 HUD (하트·코인·시계·하단 아이콘 바) + 패널들
    this.bag = new BagPanel({ online: !!this.sb, onToggle: (o) => this.setGameKeysEnabled(!o) });
    this.dex = new CollectionPanel(this.peer.userId, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      getQuestState: () => this.questStore.get(),
      getUnlockedBadgeIds: () => this.achievementStore.get().unlocked,
      getOwnedPetIds: () => this.petStore.owned(),
      onOpenTasteSet: (target, setId) => this.openTasteSetTarget(target, setId),
      onTasteSetsChanged: (progress) => { this.writeTasteSetMetrics(progress); this.refreshAchievementState(true); },
      onShelfChanged: (progress) => {
        this.questStore.setMetric('collection_shelf_targets', progress.targets);
        this.questStore.setMetric('collection_shelf_kinds', progress.targetKinds);
        this.questStore.setMetric('collection_shelf_completed', progress.completed);
        this.refreshAchievementState(true); this.refreshHearts(); this.refreshQuestTracker();
      },
    });
    this.mapPanel = new MapPanel({
      onToggle: (o) => this.setGameKeysEnabled(!o),
      getPlayerTile: () => worldToTile(this.player.x, this.player.y),
      getRemoteTiles: () => this.remoteTiles(),
    });
    // 우측 상단 미니맵 — 항상 표시, 유저 위치 실시간, 클릭 시 전체 지도
    this.minimap = new Minimap(() => this.openMap());
    this.residentsPanel = new ResidentsPanel(this.peer.userId, this.bakePortraits(), {
      onToggle: (o) => this.setGameKeysEnabled(!o),
      getQuestState: () => this.questStore.get(),
      getPlayerAppearance: () => this.peer.appearance,
      getActivePet: () => {
        const id = this.petStore.activeId();
        return id ? { speciesId: id, name: this.petStore.displayName(id), accessory: this.petStore.accessory(id) } : null;
      },
      onNavigate: (metric, title) => this.navigateClassicRequest(metric, title),
      onRendezvousChanged: (progress) => { this.writeResidentRendezvousMetrics(progress); this.refreshAchievementState(true); },
      onLettersChanged: (progress) => { this.writeResidentLetterMetrics(progress); this.refreshAchievementState(true); },
      onFanbookChanged: (progress) => { this.writeResidentFanbookMetrics(progress); this.refreshAchievementState(true); this.refreshQuestTracker(); },
      onRoomCareChanged: (progress) => { this.writeResidentRoomCareMetrics(progress); this.refreshAchievementState(true); this.refreshQuestTracker(); },
    });
    this.writeResidentRoomCareMetrics(this.residentsPanel.roomCareProgress());
    this.profilePanel = new VillageProfilePanel(this.peer.userId, {
      onToggle: (open) => this.setGameKeysEnabled(!open),
      online: !!this.adapter,
      getSelfContext: () => this.villageProfileContext(),
      onOpenAtelier: () => this.customize?.open(this.peer.appearance, 'closet'),
      onOpenCharacterZine: () => this.customize?.open(this.peer.appearance, 'zine'),
      onOpenSpecialties: () => this.openQuests('growth'),
      onOpenPhotoBooth: () => this.openPhotoBooth(),
      onOpenPetStyleStudio: () => {
        const id = this.petStore.activeId() ?? this.petStore.owned()[0] ?? null;
        if (id) this.petStyleStudio?.open(this.petStore, id);
        else this.petShop?.open(this.petStore, this.coins, !!this.sb);
      },
      onViewPetStyleCards: () => this.incQuest('pet_style_profile_views'),
      onSendNeighborCheer: (peer, kind) => this.sendNeighborCheer(peer, kind),
      onSendPetMeet: (peer, kind) => this.sendPetMeet(peer, kind),
      onVisitNeighborHome: (peer) => this.visitNeighborHome(peer),
      onNeighborHomeTourChanged: (progress) => {
        this.writeNeighborHomeTourMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshQuestTracker();
      },
      onNeighborCheerChanged: (progress) => {
        this.writeNeighborCheerMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshQuestTracker();
      },
      onPetMeetChanged: (progress) => {
        this.writePetMeetMetrics(progress);
        this.refreshAchievementState(true);
        this.refreshQuestTracker();
      },
      onChanged: (profile) => {
        this.peer.profile = profile;
        this.questStore.setMetric('village_profile_customized', 1);
        this.questStore.setMetric('village_profile_badges', profile.showcasedBadges.length);
        void this.adapter?.updateSelf(this.peer);
        this.refreshAchievementState(true);
      },
    });
    this.peer.profile = this.profilePanel.publicSnapshot();
    this.syncNeighborCheerMetrics();
    this.syncNeighborHomeTourMetrics();
    this.syncPetMeetMetrics();
    this.rankingPanel = new RankingPanel({
      online: !!this.sb,
      myId: this.peer.userId,
      onToggle: (o) => this.setGameKeysEnabled(!o),
      fetchRows: () => fetchRanking(this.sb!),
    });
    this.treasure = new TreasurePanel(this.treasureStore, {
      onToggle: (o) => this.setGameKeysEnabled(!o),
      onCraft: () => {
        this.incQuest('treasure_crafted');
        this.setQuestMetric('treasures_owned', this.treasureStore.progress().owned);
      },
    });
    // HUD는 세션 싱글턴 (main 생성) — 거리 진입 시 액션 바만 장착
    this.hud = this.registry.get('hud') as GameHud;
    this.hud.mountActions({
      onBag: () => void this.openBag(),
      onDex: () => void this.openDex(),
      onMap: () => this.openMap(),
      onQuest: () => this.openQuests(),
      onJourney: () => this.openQuests('journey'),
      onTreasure: () => this.openTreasure(),
      onMarket: () => void this.openNeighborhoodMarket(),
      onGarden: () => { if (!this.anyPanelOpen()) this.gardenPanel?.open(); },
      onCooking: () => { if (!this.anyPanelOpen()) this.cookingPanel?.open(); },
      onFishing: () => { if (!this.anyPanelOpen()) this.fishingPanel?.open(); },
      onResidents: () => this.openResidents(),
      onRanking: () => this.openRanking(),
      onCustomize: () => { if (!this.chat!.isOpen && !this.customize!.isOpen) this.customize!.open(this.peer.appearance); },
      onChat: () => { if (!this.chat!.isOpen) this.chat!.open(); },
      onEmote: () => { if (!this.chat!.isOpen) this.emotes!.toggle(); },
    });
    this.syncQuestMetrics();
    this.refreshHearts();
    this.refreshQuestTracker();
    void this.initCoins();

    // 모바일 터치 컨트롤 — D-패드만 (액션은 HUD 바로 통합)
    if (isTouchDevice()) this.touch = new TouchControls();

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = isTouchDevice()
      ? '빈 곳을 누른 채 끌어 이동 · 문을 밟으면 입장 · 퀘스트에서 추천 길 확인'
      : 'WASD 이동 · Q 모험 일지 · Enter 채팅 · 문을 밟으면 입장';
    document.body.appendChild(this.hint);
  }

  // --- HUD 패널 열기 (동시에 하나만) ---

  private anyPanelOpen(): boolean {
    return (this.chat?.isOpen ?? false) || (this.adventureRolePanel?.isOpen ?? false) || (this.customize?.isOpen ?? false)
      || (this.bag?.isOpen ?? false) || (this.dex?.isOpen ?? false)
      || (this.mapPanel?.isOpen ?? false) || (this.quests?.isOpen ?? false)
      || (this.shop?.isOpen ?? false) || (this.residentsPanel?.isOpen ?? false)
      || (this.neighborhoodMarket?.isOpen ?? false)
      || (this.profilePanel?.isOpen ?? false)
      || (this.rankingPanel?.isOpen ?? false) || (this.claw?.isOpen ?? false)
      || (this.realty?.isOpen ?? false) || (this.treasure?.isOpen ?? false)
      || (this.petShop?.isOpen ?? false) || (this.petStyleStudio?.isOpen ?? false) || (this.weaponShop?.isOpen ?? false)
      || (this.photoBooth?.isOpen ?? false) || (this.gardenPanel?.isOpen ?? false)
      || (this.cookingPanel?.isOpen ?? false) || (this.fishingPanel?.isOpen ?? false)
      || (this.playerInfo?.isOpen ?? false);
  }

  /** ESC — 열린 패널 중 하나를 닫는다. 닫았으면 true */
  private closeTopPanel(): boolean {
    const closers: Array<{ open: boolean; close: () => void }> = [
      { open: this.adventureRolePanel?.isOpen ?? false, close: () => this.adventureRolePanel!.close() },
      { open: this.bag?.isOpen ?? false, close: () => this.bag!.close() },
      { open: this.dex?.isOpen ?? false, close: () => this.dex!.close() },
      { open: this.mapPanel?.isOpen ?? false, close: () => this.mapPanel!.close() },
      { open: this.residentsPanel?.isOpen ?? false, close: () => this.residentsPanel!.close() },
      { open: this.profilePanel?.isOpen ?? false, close: () => this.profilePanel!.close() },
      { open: this.rankingPanel?.isOpen ?? false, close: () => this.rankingPanel!.close() },
      { open: this.quests?.isOpen ?? false, close: () => this.quests!.close() },
      { open: this.photoBooth?.isOpen ?? false, close: () => this.photoBooth!.close() },
      { open: this.gardenPanel?.isOpen ?? false, close: () => this.gardenPanel!.close() },
      { open: this.cookingPanel?.isOpen ?? false, close: () => this.cookingPanel!.close() },
      { open: this.fishingPanel?.isOpen ?? false, close: () => this.fishingPanel!.close() },
      { open: this.shop?.isOpen ?? false, close: () => this.shop!.close() },
      { open: this.neighborhoodMarket?.isOpen ?? false, close: () => this.neighborhoodMarket!.close() },
      { open: this.claw?.isOpen ?? false, close: () => this.claw!.close() },
      { open: this.realty?.isOpen ?? false, close: () => this.realty!.close() },
      { open: this.petShop?.isOpen ?? false, close: () => this.petShop!.close() },
      { open: this.petStyleStudio?.isOpen ?? false, close: () => this.petStyleStudio!.close() },
      { open: this.weaponShop?.isOpen ?? false, close: () => this.weaponShop!.close() },
      { open: this.playerInfo?.isOpen ?? false, close: () => this.playerInfo!.close() },
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

  /** 네컷 포토부스 — 현재 코디·동행 펫을 실제 픽셀 필름으로 보존한다. */
  private takePhoto(): void {
    this.openPhotoBooth();
  }

  private openPhotoBooth(): void {
    if (!this.photoBooth || this.anyPanelOpen()) return;
    const petId = this.petStore.activeId();
    this.photoBooth.open({
      appearance: this.peer.appearance,
      nickname: this.peer.nickname,
      pet: petId ? {
        speciesId: petId, accessory: this.petStore.accessory(petId), name: this.petStore.nickname(petId),
      } : null,
    });
  }

  private handlePhotoSaved(record: PhotoRecord): void {
    this.questStore.bump('photo_taken');
    if (record.pet) this.questStore.bump('photo_with_pet');
    this.syncPhotoMetrics();
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
    this.showBubble(this.player, record.pet ? '동행 친구와 네 컷을 앨범에 남겼어요.' : '오늘의 네 컷을 앨범에 남겼어요.');
    this.motions?.play(this.player, 'greet');
    audio.playSe('success');
    void this.awardActivity('photo');
  }

  private syncPhotoMetrics(): void {
    const progress = this.photoAlbum.progress();
    this.questStore.setMetric('photo_album', progress.count);
    this.questStore.setMetric('photo_frames', progress.framesUsed);
    this.questStore.setMetric('photo_backdrops', progress.backdropsUsed);
    this.questStore.setMetric('photo_cards_decorated', progress.decoratedCards);
    this.questStore.setMetric('photo_card_stickers', progress.stickersUsed);
    this.questStore.setMetric('photo_card_foils', progress.foilsUsed);
    this.questStore.setMetric('photo_cards_featured', progress.featuredCards);
    this.questStore.setMetric('photo_card_edits', progress.cardEdits);
  }

  /** 붕어빵 포차 — 따끈한 간식 + 소액 보상 */
  private eatBungeo(): void {
    this.showBubble(this.player, '🐟 붕어빵 호호… 따끈해!');
    this.incQuest('bungeo_eat');
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
        this.incQuest('sparkle_collect');
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

  /** 서버 성장 스냅샷을 로컬 표현 캐시에 반영한다. 0013 미적용 서버는 보유 목록만 병합한다. */
  private async syncServerPetProgress(): Promise<void> {
    if (!this.sb) return;
    const rows = await fetchPetProgress(this.sb, this.peer.userId);
    if (rows) this.petStore.mergeServerProgress(rows);
    else this.petStore.merge(await fetchOwnedPets(this.sb, this.peer.userId));
    const activeId = this.petStore.activeId();
    this.pet?.setSpecies(activeId, activeId ? this.petStore.accessory(activeId) : 'none', activeId ? this.petStore.nickname(activeId) : null);
    this.refreshPetStage();
    this.setQuestMetric('pets_owned', this.petStore.owned().length);
    this.petShop?.refresh(this.coins);
  }

  /** DB가 직접 증명한 집·펫 진행과 배지를 로컬 일지에 안전하게 합친다. */
  private async syncVerifiedProgress(announce: boolean): Promise<void> {
    if (!this.sb) return;
    const verified = await refreshVerifiedProgress(this.sb);
    if (!verified) return;
    for (const [key, value] of Object.entries(verified.metrics)) {
      if (typeof value === 'number') this.questStore.setMetric(key, value);
    }
    const newly = this.achievementStore.mergeVerified(verified.badges);
    this.refreshAchievementState(false);
    this.refreshHearts();
    this.refreshQuestTracker();
    if (announce && newly.length) {
      const badge = BADGE_BY_ID.get(newly[newly.length - 1]!);
      if (badge) {
        this.showBubble(this.player, `◆ 서버 검증 배지 「${badge.name}」 획득!`);
        this.motions?.play(this.player, 'win');
        audio.playSe('success');
      }
    }
  }

  /** 입양 — 기본 펫 가격과 히든 펫 조건 모두 온라인에서는 서버가 최종 검증한다. */
  private async handleAdopt(petId: string): Promise<void> {
    const s = petById(petId);
    if (!s || this.petStore.isOwned(petId)) return;
    if (s.rare && this.sb) {
      const rare = await claimRarePet(this.sb, petId);
      if (rare === 'locked') {
        this.showBubble(this.player, '서버 기록에서 아직 발견 조건이 확인되지 않았어요. 조금 더 함께해 봐요!');
        return;
      }
      if (rare === 'ok') await this.syncServerPetProgress();
      else this.petStore.adopt(petId); // 0013 미적용 전환기
    } else if (!s.rare && this.sb) {
      const res = await adoptPet(this.sb, petId);
      if (res.ok) {
        this.setCoins(res.balance);
        this.petStore.adopt(petId);
        await this.syncServerPetProgress();
        this.motions?.play(this.player, 'coin');
      } else if (res.reason === 'no-coins') {
        this.showBubble(this.player, '코인이 부족해요 😢');
        this.petShop?.refresh(this.coins);
        return;
      } else if (res.reason === 'error') {
        this.showBubble(this.player, '입양 기록을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
        return;
      } else {
        this.petStore.adopt(petId); // 서버 미적용(no-rpc)/에러 → 무료 폴백
      }
    } else {
      this.petStore.adopt(petId); // 오프라인 or 희귀 무료 입양
    }
    // 처음 들인 펫은 바로 데리고 다닌다
    if (!this.petStore.activeId()) this.handleSetActivePet(petId);
    this.incQuest('pet_adopt');
    this.setQuestMetric('pets_owned', this.petStore.owned().length);
    this.showBubble(this.player, `${s.emoji} ${s.name} 입양 완료! 🎉`);
    audio.playSe('success');
    this.announceUnlocks();
    void this.syncVerifiedProgress(true);
    this.petShop?.refresh(this.coins);
  }

  private handleSetActivePet(petId: string | null): void {
    this.petStore.setActive(petId);
    this.pet?.setSpecies(petId, petId ? this.petStore.accessory(petId) : 'none', petId ? this.petStore.nickname(petId) : null);
    this.refreshPetStage();
    this.syncSelfMeta(); // 상대에게도 내 펫 반영
  }

  /** 내 펫·레벨 상태를 presence로 전파 (상대 화면에 반영) */
  private syncSelfMeta(): void {
    this.peer.pet = this.petStore.activeId();
    const activeId = this.petStore.activeId();
    this.peer.petAccessory = activeId ? this.petStore.accessory(activeId) : 'none';
    this.peer.petName = activeId ? this.petStore.nickname(activeId) : null;
    this.peer.level = this.battleStore.level;
    this.peer.weapon = this.battleStore.equippedId();
    this.peer.badge = this.achievementStore.equipped()?.name ?? null;
    void this.adapter?.updateSelf(this.peer);
  }

  private petCareMessage(result: Exclude<PetCareResult, { ok: true }>, action: 'feed' | 'play' | 'pet' | 'train'): string {
    if (result.reason === 'daily' && action === 'feed') return '오늘은 이미 배불러요 🍚';
    if (result.reason === 'daily' && action === 'play') return '오늘은 신나게 놀았어요! 내일 또 만나요 🧶';
    if (result.reason === 'daily' && action === 'train') return '오늘 연습은 완료했어요. 푹 쉬고 내일 또 해요!';
    if (result.reason === 'daily-cap') return '오늘 쓰담쓰담은 충분해요. 내일도 반갑게 만나요 💛';
    if (result.reason === 'affinity') return `다음 트릭은 친밀도 ${result.required ?? '?'}부터 배울 수 있어요.`;
    if (result.reason === 'done') return '모든 트릭을 마스터한 천재 펫이에요! ✨';
    if (result.reason === 'not-owned') return '먼저 이 친구를 입양해 주세요.';
    return '서버 기록을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }

  /** 먹이 주기 — 온라인에서는 서버가 KST 하루 1회를 원자 검증한다. */
  private async handleFeed(petId: string): Promise<void> {
    const s = petById(petId);
    const server = this.sb ? await carePet(this.sb, petId, 'feed') : null;
    if (server && !server.ok && server.reason !== 'no-rpc') {
      this.showBubble(this.player, this.petCareMessage(server, 'feed')); return;
    }
    const aff = server?.ok ? server.affinity : this.petStore.feed(petId);
    if (aff < 0) { this.showBubble(this.player, '오늘은 이미 배불러요 🍚'); return; }
    if (server?.ok) await this.syncServerPetProgress();
    if (s) this.showBubble(this.player, `${s.emoji} 냠냠! 친밀도 ${aff} 💛`);
    this.incQuest('pet_feed');
    this.setQuestMetric('max_pet_affinity', aff);
    audio.playSe('success');
    this.refreshPetStage();
    this.announceUnlocks();
    void this.syncVerifiedProgress(true);
    this.petShop?.refresh(this.coins);
  }

  /** 같이 놀기 — 놓친 날의 감점 없이 하루 한 번 추억과 친밀도를 쌓는다. */
  private async handlePlayPet(petId: string): Promise<void> {
    const s = petById(petId);
    const server = this.sb ? await carePet(this.sb, petId, 'play') : null;
    if (server && !server.ok && server.reason !== 'no-rpc') {
      this.showBubble(this.player, this.petCareMessage(server, 'play')); return;
    }
    const aff = server?.ok ? server.affinity : this.petStore.play(petId);
    if (aff < 0) { this.showBubble(this.player, '오늘은 신나게 놀았어요! 내일 또 만나요 🧶'); return; }
    if (server?.ok) await this.syncServerPetProgress();
    if (this.petStore.activeId() !== petId) this.handleSetActivePet(petId);
    this.pet?.trickFx('play');
    this.showBubble(this.player, `${s?.emoji ?? '🐾'} 같이 놀기 성공! 친밀도 ${aff} 💛`);
    this.incQuest('pet_play');
    this.setQuestMetric('max_pet_affinity', aff);
    this.setQuestMetric('pet_memories', this.petStore.memories(petId).filter((m) => m.unlocked).length);
    audio.playSe('success');
    this.refreshPetStage();
    this.announceUnlocks();
    void this.syncVerifiedProgress(true);
    this.petShop?.refresh(this.coins);
  }

  /** 하루 한 번 다음 트릭을 배운다. 친밀도가 부족하면 정확한 다음 목표를 알려 준다. */
  private async handleTrainPet(petId: string): Promise<void> {
    const server = this.sb ? await carePet(this.sb, petId, 'train') : null;
    if (server && !server.ok && server.reason !== 'no-rpc') {
      this.showBubble(this.player, this.petCareMessage(server, 'train')); return;
    }
    const result = server?.ok
      ? { ok: true as const, trick: this.petStore.nextTrick(petId), affinity: server.affinity, serverTrick: server.trick }
      : this.petStore.train(petId);
    if (!result.ok) {
      const next = this.petStore.nextTrick(petId);
      const message = result.reason === 'daily' ? '오늘 연습은 완료했어요. 푹 쉬고 내일 또 해요!'
        : result.reason === 'affinity' && next ? `${next.name}은 친밀도 ${next.minAffinity}부터 배울 수 있어요.`
          : result.reason === 'done' ? '모든 트릭을 마스터한 천재 펫이에요! ✨' : '먼저 가족이 되어 주세요.';
      this.showBubble(this.player, message);
      return;
    }
    if (server?.ok) await this.syncServerPetProgress();
    const learned = server?.ok
      ? this.petStore.learnedTricks(petId).find((trick) => trick.id === server.trick)
      : result.trick;
    if (!learned) return;
    if (this.petStore.activeId() !== petId) this.handleSetActivePet(petId);
    this.pet?.trickFx(learned.id);
    this.showBubble(this.player, `${learned.emoji} 「${learned.name}」 습득! ${learned.praise}`);
    this.incQuest('pet_train');
    this.setQuestMetric('pet_tricks', this.petStore.learnedTricks(petId).length);
    this.setQuestMetric('pet_memories', this.petStore.memories(petId).filter((m) => m.unlocked).length);
    this.setQuestMetric('max_pet_affinity', result.affinity);
    this.motions?.play(this.player, 'win');
    audio.playSe('success');
    this.refreshPetStage();
    void this.syncVerifiedProgress(true);
    this.petShop?.refresh(this.coins);
  }

  /** 배운 트릭은 펫 카드에서 언제든 다시 보여 달라고 할 수 있다. */
  private handlePetTrick(petId: string, trickId: string): void {
    const trick = this.petStore.learnedTricks(petId).find((item) => item.id === trickId);
    if (!trick) return;
    if (this.petStore.activeId() !== petId) this.handleSetActivePet(petId);
    this.pet?.trickFx(trick.id);
    this.showBubble(this.player, `${trick.emoji} ${trick.praise}`);
    this.incQuest('pet_trick_perform');
    audio.playSe('pop');
  }

  private handlePetRename(petId: string, nickname: string): void {
    if (!this.petStore.setNickname(petId, nickname)) { this.petShop?.refresh(this.coins); return; }
    this.afterPetProfileChange(petId, 'pet_profile_edit');
    this.showBubble(this.player, `${this.petStore.displayName(petId)}의 새 이름을 기록했어요.`);
  }

  private handlePetPersonality(petId: string, personality: PetPersonalityId): void {
    if (!this.petStore.setPersonality(petId, personality)) return;
    this.afterPetProfileChange(petId, 'pet_profile_edit');
    this.showBubble(this.player, `${this.petStore.displayName(petId)}의 성격 기록을 바꿨어요.`);
  }

  private handlePetAccessory(petId: string, accessory: PetAccessoryId): void {
    if (!this.petStore.equipAccessory(petId, accessory)) return;
    this.afterPetProfileChange(petId, accessory === 'none' ? 'pet_profile_edit' : 'pet_accessory_equip');
    this.showBubble(this.player, `${this.petStore.displayName(petId)}에게 새 장식이 잘 어울려요.`);
  }

  private applyPetStyle(draft: PetStyleDraft): boolean {
    if (!this.petStore.isOwned(draft.petId)) return false;
    const accessory = this.petStore.accessoryViews(draft.petId)
      .find((item) => item.id === draft.accessoryId);
    if (!accessory?.unlocked) return false;
    const personalityChanged = this.petStore.personality(draft.petId) !== draft.personalityId;
    const accessoryChanged = this.petStore.accessory(draft.petId) !== draft.accessoryId;
    if (personalityChanged && !this.petStore.setPersonality(draft.petId, draft.personalityId)) return false;
    if (accessoryChanged && !this.petStore.equipAccessory(draft.petId, draft.accessoryId)) return false;
    this.petStore.setActive(draft.petId);
    this.pet?.setSpecies(draft.petId, draft.accessoryId, this.petStore.nickname(draft.petId));
    this.refreshPetStage();
    this.syncSelfMeta();
    this.incQuest('pet_profile_edit');
    if (accessoryChanged && draft.accessoryId !== 'none') this.incQuest('pet_accessory_equip');
    this.setQuestMetric('pet_profiles_customized', this.petStore.customizedCount());
    this.setQuestMetric('pet_accessories', this.petStore.unlockedAccessoryCount());
    this.setQuestMetric('pet_personalities', this.petStore.personalityVariety());
    this.petShop?.refresh(this.coins);
    this.petStyleStudio?.refresh();
    this.showBubble(this.player, `${draft.petName}의 코디를 동행에게 적용했어요${personalityChanged ? ' · 성격 기록도 함께 바뀌었어요.' : '.'}`);
    return true;
  }

  private afterPetProfileChange(petId: string, registryKey: 'pet_profile_edit' | 'pet_accessory_equip'): void {
    this.incQuest('pet_profile_edit');
    if (registryKey === 'pet_accessory_equip') this.incQuest('pet_accessory_equip');
    this.setQuestMetric('pet_profiles_customized', this.petStore.customizedCount());
    this.setQuestMetric('pet_accessories', this.petStore.unlockedAccessoryCount());
    this.setQuestMetric('pet_personalities', this.petStore.personalityVariety());
    if (this.petStore.activeId() === petId) {
      this.pet?.setSpecies(petId, this.petStore.accessory(petId), this.petStore.nickname(petId));
      this.syncSelfMeta();
    }
    this.petShop?.refresh(this.coins);
  }

  private writePetStyleMetrics(progress: PetStyleStudioProgress): void {
    this.setQuestMetric('pet_style_cards', progress.savedCards);
    this.setQuestMetric('pet_style_captures', progress.totalCaptures);
    this.setQuestMetric('pet_style_discoveries', progress.discoveries);
    this.setQuestMetric('pet_style_pets', progress.pets);
    this.setQuestMetric('pet_style_personalities', progress.personalities);
    this.setQuestMetric('pet_style_accessories', progress.accessories);
    this.setQuestMetric('pet_style_backdrops', progress.backdrops);
    this.setQuestMetric('pet_style_poses', progress.poses);
    this.setQuestMetric('pet_style_featured', progress.featured);
    this.setQuestMetric('pet_style_applies', progress.applies);
  }

  /** 동행 펫 쓰다듬기 — 하트 연출 + 소량 친밀도 (3초 쿨다운) */
  private async pettingActivePet(): Promise<void> {
    const id = this.petStore.activeId();
    if (!id) return;
    const now = this.time.now;
    if (now - this.lastPetAt < 3000) { this.pet?.petFx(); return; }
    this.lastPetAt = now;
    const server = this.sb ? await carePet(this.sb, id, 'pet') : null;
    if (server && !server.ok && server.reason !== 'no-rpc') {
      this.pet?.petFx();
      this.showBubble(this.player, this.petCareMessage(server, 'pet'));
      return;
    }
    const aff = server?.ok ? server.affinity : this.petStore.pet(id);
    if (server?.ok) await this.syncServerPetProgress();
    this.incQuest('pet_pet');
    this.setQuestMetric('max_pet_affinity', aff);
    this.pet?.petFx();
    audio.playSe('pop');
    const s = petById(id);
    this.showBubble(this.player, `${s?.emoji ?? '🐾'} 쓰담쓰담~ 🥰 (친밀도 ${aff})`);
    this.refreshPetStage();
    this.announceUnlocks();
    void this.syncVerifiedProgress(true);
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
    this.questStore.setMetric('pet_profiles_customized', this.petStore.customizedCount());
    this.questStore.setMetric('pet_accessories', this.petStore.unlockedAccessoryCount());
    this.questStore.setMetric('pet_personalities', this.petStore.personalityVariety());
    this.writePetOutingMetrics(this.petOutingStore.progress());
    this.writeRequestBoardMetrics(this.requestBoardStore.progress(this.questStore.get()));
  }

  // --- 전투/레벨업 ---

  private isFatigued(): boolean { return this.time.now < this.fatigueUntil; }

  // --- 계정 동기 (레벨·펫·보물·퀘스트를 기기 간 유지) ---

  private buildSnapshot(): GameSnapshot {
    return {
      v: 1,
      battle: this.battleStore.snapshot(),
      pets: this.petStore.snapshot(),
      treasure: this.treasureStore.snapshot(),
      quests: this.questStore.snapshot(),
    };
  }

  /** 로그인 시: 서버 스냅샷이 있으면 복원(계정 우선), 없으면 현재 로컬을 서버에 올린다 */
  private async initSync(): Promise<void> {
    if (!this.sb) { this.syncReady = true; return; }
    const snap = await loadGameState(this.sb, this.peer.userId);
    if (snap) {
      if (snap.battle) this.battleStore.hydrate(snap.battle);
      if (snap.pets) this.petStore.hydrate(snap.pets);
      if (snap.treasure) this.treasureStore.hydrate(snap.treasure);
      if (snap.quests) this.questStore.hydrate(snap.quests);
      this.refreshAfterSync();
    } else {
      await saveGameState(this.sb, this.peer.userId, this.buildSnapshot());
    }
    this.syncReady = true;
    this.lastSyncSaveMs = this.time.now;
  }

  /** 서버 복원 후 파생 UI·연출 갱신 */
  private refreshAfterSync(): void {
    this.refreshNameTag();
    this.playerAura?.setLevel(this.battleStore.level);
    this.refreshWeaponSprite();
    this.pet?.setSpecies(this.petStore.activeId());
    this.refreshPetStage();
    this.refreshHearts();
    this.syncSelfMeta();
  }

  /** 복원해도 안전한 스폰 타일인지 (지도 안·비장애물·씬전환문 아님) */
  private safeSpawn(tx: number, ty: number): boolean {
    if (tx < 1 || ty < 1 || tx >= MAP_W - 1 || ty >= MAP_H - 1) return false;
    if (this.grid.isSolid(tx, ty)) return false;
    return !this.sceneDoorSet.has(`${tx},${ty}`);
  }

  /** 레벨업 효과 — 금빛 링 + 위로 뜨는 텍스트 + 스프라이트 팝 (나·상대 공용) */
  private levelUpFx(sprite: Phaser.GameObjects.Sprite, level: number): void {
    const ring = this.add.circle(sprite.x, sprite.y, 20, 0x000000, 0)
      .setStrokeStyle(3, 0xffd24a, 0.95).setDepth(20).setScale(0.3);
    this.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    const t = this.add.text(sprite.x, sprite.y - 30, `⬆ LEVEL UP  Lv.${level}`, {
      fontFamily: UI_FONT, fontSize: '11px', color: '#ffe08a', fontStyle: 'bold',
      stroke: '#4a2e10', strokeThickness: 3, resolution: TEXT_RES,
    }).setOrigin(0.5).setDepth(21);
    this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 950, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
    this.tweens.add({ targets: sprite, scaleX: 1.18, scaleY: 1.18, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
    audio.playSe('success');
  }

  /** 소소한 변경 알림(무기·펫) — 이모지가 뿅 */
  private sparkleFx(sprite: Phaser.GameObjects.Sprite, emoji: string): void {
    const t = this.add.text(sprite.x, sprite.y - 20, emoji, { fontSize: '14px' }).setOrigin(0.5).setDepth(21);
    this.tweens.add({ targets: t, y: t.y - 12, alpha: 0, scale: 1.4, duration: 520, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
  }

  /** 이름표 = ● 닉 Lv.N + 위에 호칭 */
  private refreshNameTag(): void {
    const lv = this.battleStore.level;
    const badge = this.achievementStore.equipped();
    this.playerLabel.setText(`● ${this.peer.nickname}  Lv.${lv}`);
    this.playerTitle.setText(`〈${titleForLevel(lv)}〉${badge ? `  ◆ ${badge.name}` : ''}`);
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
    // 32×48 캐릭터의 손 중심(발 기준 약 13px 위)에 손잡이를 맞춘다.
    w.setPosition(this.player.x + dx, this.player.y - (f === 3 ? 18 : 14));
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
    // 최근 피격 없으면 HP 회복 (더 빠르게 — 금방 죽던 문제 완화)
    const maxHp = maxHpForLevel(this.battleStore.level);
    if (this.playerHp < maxHp && this.time.now - this.lastHitMs > 2200) {
      this.playerHp = Math.min(maxHp, this.playerHp + (16 * delta) / 1000);
    }
    const w = weaponById(this.battleStore.equippedId());
    this.battleHud.set({
      level: this.battleStore.level, hp: this.playerHp, maxHp,
      xp: this.battleStore.xp, xpNext: xpToNext(this.battleStore.level),
      tier: this.battleStore.tier, kills: this.battleStore.killsInTier, quota: this.battleStore.quota,
      weapon: `${w.emoji} ${w.name}`, fatigued: this.isFatigued(),
      role: `${this.adventureRoleStore.role().mark} ${this.adventureRoleStore.role().name}`,
    });
  }

  /** 몬스터에게 맞음 */
  private damagePlayer(dmg: number): void {
    if (this.playerHp <= 0) return;
    this.playerHp -= dmg;
    this.lastHitMs = this.time.now;
    if (!playComfort.reducedMotion()) this.cameras.main.shake(90, 0.004);
    this.player.setTintFill(0xff5a5a);
    this.time.delayedCall(80, () => this.player.clearTint());
    if (this.playerHp <= 0) this.playerDie();
  }

  /** 사망 → 경험치 감소 + 마을 부활 + 피로 상태 */
  private playerDie(): void {
    this.battleStore.onDeath();
    this.dex?.breakMonsterStreak();
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
    const roleModifier = this.adventureRoleStore.modifier();
    const r = this.battleStore.onKill(Math.max(1, Math.round(species.xp * roleModifier.xpMultiplier)));
    if (roleModifier.healOnKillPct > 0) {
      const maxHp = maxHpForLevel(this.battleStore.level);
      this.playerHp = Math.min(maxHp, this.playerHp + Math.max(1, Math.round(maxHp * roleModifier.healOnKillPct)));
    }
    const record = this.dex?.recordMonster(species.id);
    this.incQuest('monster_kill');
    this.setQuestMetric('player_level', this.battleStore.level);
    this.setQuestMetric('battle_tier', this.battleStore.tier);
    if (record) {
      this.setQuestMetric('monster_species', record.discovered);
      this.setQuestMetric('monster_streak', record.bestStreak);
    }
    if (species.shard > 0 && Math.random() < 0.5) {
      this.treasureStore.addShards(species.shard);
      this.dex?.addMonsterShards(species.shard);
      this.incQuest('monster_shard', species.shard);
    }
    this.syncMonsterResearchMetrics();
    // 골드 보상 — 서버 원장·일일상한(hunt_reward, 0013). ~2.5s 스로틀. 미적용/오프라인은 통과
    if (this.sb && this.time.now - this.lastHuntRewardMs > 2500) {
      this.lastHuntRewardMs = this.time.now;
      const gold = 3 + species.tier * 2;
      void this.sb.rpc('hunt_reward', { p_tier: species.tier }).then(({ data }) => {
        if (typeof data === 'number' && data >= 0) {
          this.setCoins(data);
          this.showBubble(this.player, `🪙 +${gold} 골드`);
        }
      });
    }
    audio.playSe('success');
    if (r.leveledUp > 0) {
      this.playerHp = maxHpForLevel(this.battleStore.level); // 레벨업 완전 회복
      this.refreshNameTag();
      this.playerAura.setLevel(this.battleStore.level); // 간지 등급 갱신
      this.syncSelfMeta();                              // 상대에게 레벨 전파
      this.levelUpFx(this.player, this.battleStore.level);
      this.showBubble(this.player, `🎉 레벨 업! Lv.${this.battleStore.level}`);
      this.motions?.play(this.player, 'win');
      if (!playComfort.reducedMotion()) this.cameras.main.flash(160, 255, 240, 180);
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

  private handleEquipWeapon(weaponId: string): void {
    this.battleStore.equip(weaponId);
    this.refreshWeaponSprite();
    this.syncSelfMeta();
    this.incQuest('weapon_equip');
  }

  /** 무기 구매 — 온라인이면 서버 코인 차감(가격 SSOT=서버), 미적용/오프라인은 무료 폴백 */
  private async handleBuyWeapon(weaponId: string): Promise<void> {
    if (this.battleStore.isWeaponOwned(weaponId)) { this.handleEquipWeapon(weaponId); this.weaponShop?.refresh(this.coins); return; }
    if (this.sb) {
      const res = await buyWeapon(this.sb, weaponId);
      if (res.ok) { this.setCoins(res.balance); this.battleStore.buyWeapon(weaponId); }
      else if (res.reason === 'no-coins') { this.showBubble(this.player, '골드가 부족해요 😢'); this.weaponShop?.refresh(this.coins); return; }
      else this.battleStore.buyWeapon(weaponId); // 미적용/에러 → 무료 폴백
    } else {
      this.battleStore.buyWeapon(weaponId);
    }
    this.incQuest('weapon_buy');
    this.setQuestMetric('weapons_owned', this.battleStore.weaponsOwned().length);
    this.handleEquipWeapon(weaponId);
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
      c.width = 48; c.height = 72;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, CHAR_W, CHAR_H, 0, 0, 48, 72);
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
    this.setQuestMetric('items_discovered', this.dex!.foundCount);
  }

  private openMap(): void {
    if (this.anyPanelOpen()) return;
    this.incQuest('open_map');
    this.mapPanel!.open();
  }

  private openQuests(initialTab?: 'requests' | 'journey' | 'growth' | 'daily' | 'fanwork'): void {
    if (this.anyPanelOpen()) return;
    this.incQuest('open_quest');
    this.quests!.open(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
      initialTab,
    );
  }

  private openVillageReward(target: 'outfit' | 'pet' | 'home'): void {
    this.quests?.close();
    if (target === 'outfit') this.customize?.open(this.peer.appearance, 'closet');
    else if (target === 'pet') this.petShop?.open(this.petStore, this.coins, !!this.sb);
    else this.showBubble(this.player, '내 집 인테리어 수첩에서 리폼 공방을 열면 명찰·이야기 전용 레시피가 보여요.');
  }

  private openTasteSetTarget(target: 'outfit' | 'pet' | 'home', setId: string): void {
    const set = TASTE_SET_BY_ID.get(setId);
    if (!set || !this.achievementStore.get().unlocked.includes(set.badgeId)) return;
    if (target === 'outfit') {
      this.customize?.openPreset(this.peer.appearance, set.outfit.id);
      return;
    }
    if (target === 'pet') {
      const petId = this.petStore.activeId();
      if (!petId) {
        this.petShop?.open(this.petStore, this.coins, !!this.sb);
        this.showBubble(this.player, '먼저 함께 걷는 동행을 골라 주세요. 세트 장식은 사라지지 않아요.');
        return;
      }
      this.handlePetAccessory(petId, set.petAccessory.id);
      this.petShop?.openProfile(this.petStore, this.coins, !!this.sb, petId);
      return;
    }
    this.openVillageReward('home');
  }

  /** 구형 정면 월드에서도 의뢰 안내 버튼이 막히지 않도록 가장 가까운 수첩·활동을 연다. */
  private navigateClassicRequest(metric: string, title: string): void {
    const destination = villageRequestDestinationForMetric(metric);
    this.quests?.close();
    if (destination === 'residents') this.residentsPanel?.open(
      this.residents?.getTrust() ?? {},
      metric.startsWith('resident_room_care_')
        ? 'room-care'
        : metric.startsWith('resident_fan_') ? 'fanbook' : 'stories',
    );
    else if (destination === 'adventure-kit') this.adventureRolePanel?.open();
    else if (destination === 'profile') this.profilePanel?.openSelf();
    else if (destination === 'treasure') this.treasure?.open();
    else if (destination === 'petshop') this.petShop?.open(this.petStore, this.coins, !!this.sb);
    else if (destination === 'atelier') this.customize?.open(this.peer.appearance);
    else if (destination === 'garden') this.gardenPanel?.open();
    else if (destination === 'kitchen') this.cookingPanel?.open();
    else if (destination === 'fishing') this.fishingPanel?.open();
    else if (destination === 'photo') this.openPhotoBooth();
    else if (destination === 'cafe') this.cafe?.open();
    else if (destination === 'busking') this.busking?.open();
    else if (destination === 'chat') this.chat?.open();
    else if (destination === 'emote') this.emotes?.toggle();
    else if (destination === 'map') this.openMap();
    else if (destination === 'quest') this.openQuests('requests');
    const guidance = destination === 'hunt'
      ? '동쪽 외곽 사냥터로 이동하면 이어갈 수 있어요. 안전 구역에서는 공격받지 않습니다.'
      : destination === 'home'
        ? '주택가의 내 집 문으로 들어가면 이어갈 수 있어요.'
        : '해당 활동을 열었어요. 이전 기록은 그대로 남아 있습니다.';
    this.showBubble(this.player, `「${title}」 · ${guidance}`);
    if (this.hint) this.hint.textContent = `의뢰 길 안내 · ${title}`;
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
  private furnitureCraftHistory = new Map<string, number>();
  private weeklyFurnitureHistory = new Set<string>();

  private async openShop(): Promise<void> {
    if (this.sb) [this.shopCounts, this.furnitureCraftHistory, this.weeklyFurnitureHistory] = await Promise.all([
      fetchInventory(this.sb, this.peer.userId), fetchFurnitureCraftHistory(this.sb, this.peer.userId),
      fetchWeeklyFurniturePurchaseHistory(this.sb, this.peer.userId),
    ]);
    this.setQuestMetric('weekly_furniture_unique', this.weeklyFurnitureHistory.size);
    this.shop!.open(this.coins, this.shopCounts, undefined, this.furnitureCraftHistory, this.weeklyFurnitureHistory);
  }

  private async handleBuy(itemId: string): Promise<void> {
    if (!this.sb) return;
    const res = await buyItem(this.sb, itemId);
    if (res.ok) {
      this.setCoins(res.balance);
      this.shopCounts.set(itemId, (this.shopCounts.get(itemId) ?? 0) + 1);
      this.shop?.setCounts(this.shopCounts);
      this.dex?.absorb(this.shopCounts);
      this.setQuestMetric('items_discovered', this.dex?.foundCount ?? 0);
      this.incQuest('shop_purchase');
      if (furnitureAcquisitionChannel(itemId) === 'weekly') {
        this.weeklyFurnitureHistory.add(itemId);
        this.shop?.setWeeklyHistory(this.weeklyFurnitureHistory);
        this.setQuestMetric('weekly_furniture_unique', this.weeklyFurnitureHistory.size);
        this.incQuest('weekly_furniture_bought');
      }
    } else if (res.reason === 'no-coins') {
      this.showBubble(this.player, '코인이 부족해요 😢');
    } else {
      const itemName = CATALOG_BY_ID.get(itemId)?.name ?? '이 가구';
      this.shop?.setStatus(res.reason === 'diy-only' ? `${itemName}은(는) DIY 작업대에서만 만들 수 있어요.`
        : res.reason === 'not-in-rotation' ? `${itemName}은(는) 이번 주 진열이 아니에요. 순환 수첩에서 돌아오는 주를 확인해 주세요.`
          : '구매 기록을 확인하지 못했어요. 코인은 차감되지 않았습니다.');
    }
  }

  private async handleFurnitureCraft(recipeId: string): Promise<void> {
    const recipe = FURNITURE_RECIPE_BY_ID.get(recipeId);
    if (!this.sb || !recipe) {
      this.shop?.setStatus('접속하면 재료 차감과 결과 지급을 한 번에 안전하게 처리할 수 있어요.');
      return;
    }
    const result = await craftFurniture(this.sb, recipeId);
    if (!result.ok) {
      this.shop?.setStatus(result.reason === 'missing-materials' ? '재료가 조금 부족해요. 보유 수량을 다시 확인해 주세요.'
        : result.reason === 'no-coins' ? `제작 공임 ${recipe.fee} 코인이 필요해요.`
          : '작업대 서버를 확인하지 못했어요. 재료와 코인은 그대로입니다.');
      return;
    }
    [this.shopCounts, this.furnitureCraftHistory] = await Promise.all([
      fetchInventory(this.sb, this.peer.userId), fetchFurnitureCraftHistory(this.sb, this.peer.userId),
    ]);
    this.setCoins(result.balance);
    this.shop?.setCounts(this.shopCounts);
    this.shop?.setCraftHistory(this.furnitureCraftHistory);
    this.dex?.absorb(this.shopCounts);
    this.setQuestMetric('items_discovered', this.dex?.foundCount ?? 0);
    this.setQuestMetric('furniture_craft_recipes', this.furnitureCraftHistory.size);
    this.incQuest('furniture_craft_total');
    this.shop?.setStatus(`${CATALOG_BY_ID.get(recipe.outputItemId)?.name ?? '새 가구'} 제작 완료! 가이드북에도 기록했어요.`);
    this.shop?.celebrateCraft(recipe.outputItemId);
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

  private async openNeighborhoodMarket(tab: 'browse' | 'sell' | 'collection' = 'browse'): Promise<void> {
    if (this.anyPanelOpen()) return;
    if (this.sb) await this.refreshNeighborhoodMarketEconomy();
    if (this.anyPanelOpen()) return;
    this.neighborhoodMarket?.open(tab);
    this.syncNeighborhoodMarketMetrics();
    this.refreshAchievementState(false);
    this.refreshQuestTracker();
  }

  private async refreshNeighborhoodMarketEconomy(): Promise<void> {
    if (!this.sb) return;
    const [coins, inventory] = await Promise.all([
      fetchCoins(this.sb, this.peer.userId),
      fetchInventory(this.sb, this.peer.userId),
    ]);
    this.setCoins(coins);
    this.shopCounts = inventory;
    this.shop?.setCounts(inventory);
    this.dex?.absorb(inventory);
    this.setQuestMetric('items_discovered', this.dex?.foundCount ?? 0);
  }

  private async createNeighborhoodMarketListing(itemId: string, tier: MarketPriceTier) {
    if (!this.sb) return { ok: false as const, reason: 'error' as const };
    const result = await createMarketListing(this.sb, itemId, tier);
    if (result.ok) await this.refreshNeighborhoodMarketEconomy();
    return result;
  }

  private async cancelNeighborhoodMarketListing(listingId: string) {
    if (!this.sb) return { ok: false as const, reason: 'error' as const };
    const result = await cancelMarketListing(this.sb, listingId);
    if (result.ok) await this.refreshNeighborhoodMarketEconomy();
    return result;
  }

  private async buyNeighborhoodMarketListing(listingId: string) {
    if (!this.sb) return { ok: false as const, reason: 'error' as const };
    const result = await buyMarketListing(this.sb, listingId);
    if (result.ok) await this.refreshNeighborhoodMarketEconomy();
    return result;
  }

  private syncNeighborhoodMarketMetrics(): void {
    if (!this.neighborhoodMarket) return;
    this.writeNeighborhoodMarketMetrics(this.neighborhoodMarket.progress());
  }

  private writeNeighborhoodMarketMetrics(progress: NeighborhoodMarketProgress): void {
    this.questStore.setMetric('market_visits', progress.visits);
    this.questStore.setMetric('market_favorites', progress.favorites);
    this.questStore.setMetric('market_listings_created', progress.listingsCreated);
    this.questStore.setMetric('market_purchases', progress.purchases);
    this.questStore.setMetric('market_sales', progress.sales);
    this.questStore.setMetric('market_exchanges', progress.exchanges);
    this.questStore.setMetric('market_unique_items', progress.uniqueItems);
    this.questStore.setMetric('market_categories', progress.categoryKinds);
  }

  private applyTimeOfDay(): void {
    const phase = phaseForHour(seoulHour());
    this.tintOverlay?.setFillStyle(phase.color, phase.alpha);
  }

  // --- 퀘스트 진행 (game.registry — 씬 전환에도 유지) ---

  private incQuest(key: string, by = 1): void {
    this.questStore.bump(key, by); // localStorage 지속 (KST 자정 리셋, P2-3)
    if (this.sb && (key === 'q_forest' || key === 'q_emote')) {
      // 서버 시간 간격과 일일 상한으로 검증되는 월드 행동.
      void recordDailyProgress(this.sb, key);
    }
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
  }

  private setQuestMetric(key: string, value: number): void {
    this.questStore.setMetric(key, value);
    this.refreshAchievementState(true);
    this.refreshQuestTracker();
  }

  private refreshQuestTracker(): void {
    const views = this.questStore.views();
    const guide = selectQuestGuide(views, this.questStore.focusedQuestId());
    this.hud?.setQuestTarget(guide ? {
      id: guide.quest.id, name: guide.quest.name, location: guide.quest.location,
      label: guide.label, action: guide.action, tone: guide.tone, manual: guide.manual,
      progress: guide.quest.progress, goal: guide.quest.goal,
    } : null);
    this.starterConcierge?.refresh();
  }

  private handleQuestFocus(questId: string | null): void {
    if (!this.questStore.focusQuest(questId)) return;
    this.refreshQuestTracker();
    this.quests?.refresh(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
    );
    const quest = questId ? QUEST_BY_ID.get(questId) : null;
    this.showBubble(this.player, quest ? `「${quest.name}」 목표를 따라가 볼게요.` : '자동 길잡이로 돌아왔어요.');
  }

  /** 다른 저장소의 현재값을 모험 일지에 안전하게 합친다. */
  private syncQuestMetrics(): void {
    this.questStore.setMetric('player_level', this.battleStore.level);
    this.questStore.setMetric('battle_tier', this.battleStore.tier);
    this.questStore.setMetric('monster_kill', this.battleStore.totalKills);
    this.questStore.setMetric('pets_owned', this.petStore.owned().length);
    this.questStore.setMetric('max_pet_affinity', Math.max(0, ...this.petStore.owned().map((id) => this.petStore.affinity(id))));
    this.questStore.setMetric('pet_tricks', Math.max(0, ...this.petStore.owned().map((id) => this.petStore.learnedTricks(id).length)));
    this.questStore.setMetric('pet_memories', Math.max(0, ...this.petStore.owned().map((id) => this.petStore.memories(id).filter((m) => m.unlocked).length)));
    this.questStore.setMetric('pet_profiles_customized', this.petStore.customizedCount());
    this.questStore.setMetric('pet_accessories', this.petStore.unlockedAccessoryCount());
    this.questStore.setMetric('pet_personalities', this.petStore.personalityVariety());
    this.questStore.setMetric('weapons_owned', this.battleStore.weaponsOwned().length);
    this.questStore.setMetric('treasures_owned', this.treasureStore.progress().owned);
    this.questStore.setMetric('dolls_owned', this.claw?.ownedCount ?? 0);
    this.syncClosetMetrics();
    this.syncCharacterZineMetrics();
    this.syncMonsterResearchMetrics();
    this.syncPhotoMetrics();
    this.syncGardenMetrics();
    this.syncCookingMetrics();
    this.syncFishingMetrics();
    this.syncAquariumMetrics();
    this.syncFurnitureReformMetrics();
    this.syncLookbookMetrics();
    this.syncResidentQuestMetrics();
    this.syncFestivalMetrics();
    this.syncNeighborhoodMarketMetrics();
    this.refreshAchievementState(false);
  }

  private syncFestivalMetrics(): void {
    const progress = this.festivalArchiveStore.progress(this.questStore.get());
    this.questStore.setMetric('festival_postcards', progress.postcards);
    this.questStore.setMetric('festival_clues', progress.clues);
  }

  private syncMonsterResearchMetrics(): void {
    if (!this.dex) return;
    const research = this.dex.monsterResearchProgress();
    const legacy = this.dex.monsterProgress();
    this.questStore.setMetric('monster_species', research.discovered);
    this.questStore.setMetric('monster_research_stamps', research.stamps);
    this.questStore.setMetric('monster_research_pages', research.pages);
    this.questStore.setMetric('monster_mastered_species', research.masteredSpecies);
    this.questStore.setMetric('monster_streak', legacy.bestStreak);
    this.questStore.setMetric('monster_shard', legacy.totalShards);
  }

  private syncClosetMetrics(): void {
    const progress = this.closetStore.progress();
    this.questStore.setMetric('closet_saved_slots', progress.saved);
    this.questStore.setMetric('closet_featured_slots', progress.featured);
    this.questStore.setMetric('closet_style_identities', progress.identities);
    this.questStore.setMetric('closet_featured_identities', progress.featuredIdentities);
    this.refreshAchievementState(false);
    this.refreshQuestTracker();
  }

  private syncCharacterZineMetrics(): void {
    const progress = this.characterZineStore.progress();
    this.questStore.setMetric('character_zine_saved', progress.saved);
    this.questStore.setMetric('character_zine_featured', progress.featured);
    this.questStore.setMetric('character_zine_roles', progress.roles);
    this.questStore.setMetric('character_zine_motifs', progress.motifs);
    this.questStore.setMetric('character_zine_bonds', progress.bonds);
    this.questStore.setMetric('character_zine_bond_kinds', progress.bondKinds);
    this.questStore.setMetric('character_zine_memory_scenes', progress.memoryScenes);
    this.questStore.setMetric('character_episode_archived', progress.episodes);
    this.questStore.setMetric('character_episode_kinds', progress.episodeKinds);
    this.questStore.setMetric('character_episode_characters', progress.episodeCharacters);
    this.questStore.setMetric('character_episode_featured', progress.featuredEpisodes);
    this.questStore.setMetric('character_episode_replays', progress.episodeReplays);
    this.refreshAchievementState(false);
    this.refreshQuestTracker();
  }

  private syncResidentQuestMetrics(): void {
    const trust = this.residents?.getTrust() ?? {};
    const values = Object.values(trust).map((entry) => entry.v);
    this.questStore.setMetric('residents_met', metCount(trust));
    this.questStore.setMetric('resident_trust_max', Math.max(0, ...values));
    for (const [key, value] of Object.entries(residentTrustMetrics(trust))) this.questStore.setMetric(key, value);
    if (this.residentsPanel) {
      this.writeResidentRendezvousMetrics(this.residentsPanel.rendezvousProgress());
      this.writeResidentLetterMetrics(this.residentsPanel.lettersProgress());
      this.writeResidentFanbookMetrics(this.residentsPanel.fanbookProgress());
    }
  }

  private refreshAchievementState(announce: boolean): void {
    this.syncAdventureRoleMetrics();
    this.syncVillageProfileMetrics();
    this.syncNeighborCheerMetrics();
    this.syncLifeMasteryMetrics();
    this.syncLifeSpecialtyMetrics();
    this.syncDailyInvitationMetrics();
    this.syncVillageJourneyMetrics();
    this.syncCollectionShelfMetrics();
    for (const [key, value] of Object.entries(adventurePathMetrics(this.questStore.views()))) {
      this.questStore.setMetric(key, value);
    }
    const levelMemoryProgress = this.quests?.villageLevelMemoryProgress();
    if (levelMemoryProgress) {
      for (const [key, value] of Object.entries(villageLevelMemoryMetrics(levelMemoryProgress))) {
        this.questStore.setMetric(key, value);
      }
    }
    const firstNewly = this.achievementStore.sync(this.questStore.views());
    this.syncTasteSetMetrics();
    this.syncVillageProfileMetrics();
    this.questStore.setMetric('rare_styles', rareStyleUnlockCount(this.achievementStore.get().unlocked));
    this.syncLifeMasteryMetrics();
    this.syncLifeSpecialtyMetrics();
    this.syncVillageJourneyMetrics();
    this.syncCollectionShelfMetrics();
    const secondNewly = this.achievementStore.sync(this.questStore.views());
    const newly = [...new Set([...firstNewly, ...secondNewly])];
    const views = this.questStore.views();
    this.quests?.refresh(
      views, this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
    );
    this.refreshNameTag();
    this.peer.badge = this.achievementStore.equipped()?.name ?? null;
    if (newly.length) {
      this.syncSelfMeta();
      if (announce) {
        const badge = BADGE_BY_ID.get(newly[newly.length - 1]!);
        if (badge) this.time.delayedCall(280, () => {
          this.showBubble(this.player, `◆ 새 배지 「${badge.name}」 획득!`);
          this.motions?.play(this.player, 'win');
          audio.playSe('success');
        });
      }
    }
  }

  private writeTasteSetMetrics(progress: TasteSetProgress): void {
    this.questStore.setMetric('taste_sets_unlocked', progress.unlockedSets);
    this.questStore.setMetric('taste_set_pieces', progress.unlockedPieces);
    this.questStore.setMetric('taste_sets_village', progress.villageSets);
    this.questStore.setMetric('taste_sets_story', progress.storySets);
    this.questStore.setMetric('taste_sets_journey', progress.journeySets);
    this.questStore.setMetric('taste_sets_mentor', progress.mentorSets);
    this.questStore.setMetric('taste_sets_featured', progress.featuredSets);
  }

  private syncTasteSetMetrics(): void {
    if (this.dex) this.writeTasteSetMetrics(this.dex.tasteSetProgress());
  }

  private syncCollectionShelfMetrics(): void {
    if (!this.dex) return;
    const progress = this.dex.shelfProgress();
    this.questStore.setMetric('collection_shelf_targets', progress.targets);
    this.questStore.setMetric('collection_shelf_kinds', progress.targetKinds);
    this.questStore.setMetric('collection_shelf_completed', progress.completed);
  }

  private writeAdventureRoleMetrics(progress: AdventureRoleProgress): void {
    this.questStore.setMetric('adventure_roles_tried', progress.rolesTried);
    this.questStore.setMetric('adventure_charms_unlocked', progress.charmsUnlocked);
    this.questStore.setMetric('adventure_charms_equipped', progress.charmsEquipped);
    this.questStore.setMetric('adventure_kits_saved', progress.kitsSaved);
    this.questStore.setMetric('adventure_role_switches', progress.switches);
  }

  private syncAdventureRoleMetrics(): void {
    if (this.adventureRolePanel) this.writeAdventureRoleMetrics(this.adventureRolePanel.progress());
  }

  private writeResidentRendezvousMetrics(progress: ResidentRendezvousProgress): void {
    this.questStore.setMetric('resident_rendezvous_scenes', progress.recorded);
    this.questStore.setMetric('resident_rendezvous_residents', progress.startedResidents);
    this.questStore.setMetric('resident_rendezvous_completed', progress.completedResidents);
    this.questStore.setMetric('resident_rendezvous_keepsakes', progress.keepsakes);
  }

  private writeResidentLetterMetrics(progress: ResidentLetterProgress): void {
    this.questStore.setMetric('resident_letters', progress.replied);
    this.questStore.setMetric('resident_letter_correspondents', progress.correspondents);
    this.questStore.setMetric('resident_letter_completed', progress.completedResidents);
    this.questStore.setMetric('resident_letter_tones', progress.tonesUsed);
    this.questStore.setMetric('resident_letter_featured', progress.featured);
  }

  private writeResidentFanbookMetrics(progress: ResidentFanbookProgress): void {
    this.questStore.setMetric('resident_fan_favorites', progress.favorites);
    this.questStore.setMetric('resident_fan_ribbons', progress.ribbons);
    this.questStore.setMetric('resident_fan_residents', progress.ribbonResidents);
    this.questStore.setMetric('resident_fan_completed', progress.completedResidents);
  }

  private writeResidentRoomCareMetrics(progress: ResidentRoomCareProgress): void {
    this.questStore.setMetric('resident_room_care_items', progress.sortedItems);
    this.questStore.setMetric('resident_room_care_rooms', progress.completedRooms);
    this.questStore.setMetric('resident_room_care_featured', progress.featuredRooms);
  }

  private villageProfileContext(): VillageProfileSelfContext {
    const quests = this.questStore.get();
    const level = villageJourneySummary(this.questStore.views(), lifeMasteryViews(quests)).level.level;
    const counts = quests.lifetimeCounts ?? {};
    const photoRecords = new Map(this.photoAlbum.records().map((record) => [record.id, record]));
    const photoCards = this.photoAlbum.featuredIds().flatMap((id) => {
      const record = photoRecords.get(id);
      if (!record) return [];
      const decoration = this.photoAlbum.decorationFor(id);
      return [{
        frameId: record.frameId, backdropId: record.backdropId, poseId: record.poseId,
        appearance: { ...record.appearance },
        pet: record.pet ? { speciesId: record.pet.speciesId, accessory: record.pet.accessory } : null,
        foilId: decoration.foilId, stickerIds: [...decoration.stickerIds],
      }];
    });
    return {
      peer: this.peer, quests, villageLevel: level,
      signatureLooks: this.closetStore.featuredLooks(),
      characterCards: this.characterZineStore.featuredCards(),
      unlockedBadgeIds: this.achievementStore.get().unlocked,
      tasteSets: this.dex?.tasteSetProgress().unlockedSets ?? Math.min(28, counts.taste_sets_unlocked ?? 0),
      rendezvous: this.residentsPanel?.rendezvousProgress().recorded ?? Math.min(30, counts.resident_rendezvous_scenes ?? 0),
      residentsMet: metCount(this.residents?.getTrust() ?? {}),
      petsOwned: this.petStore.owned().length,
      homeLabel: `집 취향 ${Math.min(9, counts.home_categories ?? 0)}분야`,
      specialtyIds: this.quests?.featuredLifeSpecialtyIds(lifeMasteryViews(quests)) ?? [],
      photoCards,
      homeCards: new HomeStudioCardStore(this.peer.userId).featuredCards(),
      petStyleCards: this.petStyleStudioStore.featuredCards(),
    };
  }

  private syncVillageProfileMetrics(): void {
    if (!this.profilePanel) return;
    const progress = this.profilePanel.progress();
    this.questStore.setMetric('village_profile_customized', progress.customized);
    this.questStore.setMetric('village_profile_badges', progress.badges);
    this.questStore.setMetric('village_profile_frames', progress.frames);
    this.questStore.setMetric('village_profile_specialties', progress.specialties);
    this.questStore.setMetric('village_profile_photo_cards', progress.photoCards);
    this.questStore.setMetric('village_profile_pet_styles', progress.petStyleCards);
    this.questStore.setMetric('village_profile_showcase_slots', progress.showcaseSlots);
    this.questStore.setMetric('village_profile_showcase_complete', progress.showcaseComplete);
    const profile = this.profilePanel.publicSnapshot();
    if (JSON.stringify(profile) !== JSON.stringify(this.peer.profile)) {
      this.peer.profile = profile; void this.adapter?.updateSelf(this.peer);
    }
  }

  private sendNeighborCheer(peer: PeerState, kind: NeighborCheerKind): boolean {
    if (!this.adapter) return false;
    this.adapter.sendNeighborCheer({ to: peer.userId, k: kind });
    return true;
  }

  private sendPetMeet(peer: PeerState, kind: PetMeetKind): boolean {
    if (!this.adapter) return false;
    this.adapter.sendPetMeet({ to: peer.userId, k: kind });
    return true;
  }

  private async visitNeighborHome(peer: PeerState): Promise<'entered' | 'no-home' | 'private' | 'offline' | 'error'> {
    if (!this.sb) return 'offline';
    try {
      const property = await fetchPropertyForHolder(this.sb, peer.userId);
      if (!property) return 'no-home';
      if (!property.isPublic) return 'private';
      const here = worldToTile(this.player.x, this.player.y);
      this.entering = true;
      this.scene.start('room', {
        roomId: property.id, isOwner: false, peer: this.peer, adapter: this.adapter,
        houseType: property.houseType, floorSeed: property.floorSeed, dealType: property.dealType,
        isPublic: property.isPublic,
        visitOwner: { userId: peer.userId, nickname: peer.nickname },
        returnScene: 'street', returnSpawnTile: here,
      });
      return 'entered';
    } catch { return 'error'; }
  }

  private writeNeighborCheerMetrics(progress: NeighborCheerProgress): void {
    this.questStore.setMetric('neighbor_cheers_sent', progress.sent);
    this.questStore.setMetric('neighbor_cheers_received', progress.received);
    this.questStore.setMetric('neighbor_cheer_total', progress.exchanges);
    this.questStore.setMetric('neighbor_cheer_kinds', progress.kinds);
    this.questStore.setMetric('neighbor_cheer_neighbors', progress.neighbors);
  }

  private syncNeighborCheerMetrics(): void {
    if (this.profilePanel) this.writeNeighborCheerMetrics(this.profilePanel.neighborCheerProgress());
  }

  private writePetMeetMetrics(progress: ReturnType<VillageProfilePanel['petMeetProgress']>): void {
    this.questStore.setMetric('pet_meet_sent', progress.sent);
    this.questStore.setMetric('pet_meet_received', progress.received);
    this.questStore.setMetric('pet_meet_total', progress.total);
    this.questStore.setMetric('pet_meet_scenes', progress.scenes);
    this.questStore.setMetric('pet_meet_neighbors', progress.neighbors);
    this.questStore.setMetric('pet_meet_species', progress.species);
    this.questStore.setMetric('pet_meet_pairs', progress.pairs);
  }

  private syncPetMeetMetrics(): void {
    if (this.profilePanel) this.writePetMeetMetrics(this.profilePanel.petMeetProgress());
  }

  private syncNeighborHomeTourMetrics(): void {
    if (!this.profilePanel) return;
    this.writeNeighborHomeTourMetrics(this.profilePanel.neighborHomeTourProgress());
  }

  private writeNeighborHomeTourMetrics(progress: ReturnType<VillageProfilePanel['neighborHomeTourProgress']>): void {
    this.questStore.setMetric('neighbor_home_tours', progress.tours);
    this.questStore.setMetric('neighbor_homes_visited', progress.neighbors);
    this.questStore.setMetric('neighbor_home_themes', progress.themes);
    this.questStore.setMetric('neighbor_home_grades', progress.grades);
    this.questStore.setMetric('neighbor_home_types', progress.houseTypes);
    this.questStore.setMetric('neighbor_home_favorites', progress.favorites);
  }

  private syncLifeMasteryMetrics(): void {
    const metrics = lifeMasteryQuestMetrics(this.questStore.get());
    for (const [key, value] of Object.entries(metrics)) this.questStore.setMetric(key, value);
  }

  private writeLifeSpecialtyMetrics(progress: LifeSpecialtyProgress): void {
    this.questStore.setMetric('life_specialty_cards', progress.unlockedCards);
    this.questStore.setMetric('life_specialty_featured', progress.featuredCards);
    this.questStore.setMetric('life_specialty_featured_domains', progress.featuredDomains);
    this.questStore.setMetric('life_specialty_mastered_domains', progress.masteredDomains);
    this.questStore.setMetric('life_specialty_edits', progress.edits);
  }

  private syncLifeSpecialtyMetrics(): void {
    if (!this.quests) return;
    this.writeLifeSpecialtyMetrics(this.quests.lifeSpecialtyProgress(lifeMasteryViews(this.questStore.get())));
  }

  private writeDailyInvitationMetrics(progress: DailyInvitationProgress): void {
    this.questStore.setMetric('daily_invitations_claimed', progress.totalClaims);
    this.questStore.setMetric('daily_invitation_stamps', progress.uniqueStamps);
    this.questStore.setMetric('daily_invitation_domains', progress.stampedDomains);
    this.questStore.setMetric('daily_invitation_rerolls', progress.rerolls);
  }

  private syncDailyInvitationMetrics(): void {
    if (!this.quests) return;
    this.writeDailyInvitationMetrics(this.quests.dailyInvitationProgress(lifeMasteryViews(this.questStore.get())));
  }

  private writeSessionPlannerMetrics(progress: SessionPlannerProgress): void {
    this.questStore.setMetric('session_plan_slots', progress.slots);
    this.questStore.setMetric('session_plan_pages', progress.archivedPages);
    this.questStore.setMetric('session_plan_quests', progress.archivedQuests);
    this.questStore.setMetric('session_plan_categories', progress.archivedCategories);
    this.questStore.setMetric('session_plan_featured', progress.featured);
  }

  private writeFanMerchMetrics(progress: FanMerchWorkshopProgress): void {
    this.questStore.setMetric('fan_merch_created', progress.totalCreated);
    this.questStore.setMetric('fan_merch_discoveries', progress.discoveries);
    this.questStore.setMetric('fan_merch_subjects', progress.subjects);
    this.questStore.setMetric('fan_merch_subject_kinds', progress.subjectKinds);
    this.questStore.setMetric('fan_merch_formats', progress.formats);
    this.questStore.setMetric('fan_merch_motifs', progress.motifs);
    this.questStore.setMetric('fan_merch_featured', progress.featured);
  }

  private syncVillageJourneyMetrics(): void {
    const views = this.questStore.views();
    const masteries = lifeMasteryViews(this.questStore.get());
    const metrics = villageJourneyMetrics(views, masteries);
    for (const [key, value] of Object.entries(metrics)) this.questStore.setMetric(key, value);
    for (const [key, value] of Object.entries(starterCompassMetrics(this.questStore.get()))) {
      this.questStore.setMetric(key, value);
    }
    const starterKeepsakes = this.quests?.starterCompassProgress();
    if (starterKeepsakes) {
      this.questStore.setMetric('starter_keepsakes', starterKeepsakes.claimed);
      this.questStore.setMetric('starter_featured_keepsake', starterKeepsakes.featured);
      this.questStore.setMetric('starter_mentor_chapters', starterKeepsakes.mentorChapters);
      this.questStore.setMetric('starter_mentor_routes', starterKeepsakes.mentorRoutes);
      for (const route of STARTER_COMPASS_ROUTES) {
        this.questStore.setMetric(`starter_mentor_${route.id}_complete`, Number(starterKeepsakes.mentorRouteIds.includes(route.id)));
      }
      this.questStore.setMetric('starter_mentor_featured', starterKeepsakes.featuredMentorScenes);
      this.questStore.setMetric('starter_mentor_replays', starterKeepsakes.mentorReplays);
    }
    const speciesId = this.petStore.activeId();
    this.hud?.setVillageLevel(
      villageJourneySummary(this.questStore.views(), lifeMasteryViews(this.questStore.get())).level,
      {
        appearance: this.peer.appearance,
        pet: speciesId ? { speciesId, accessory: this.petStore.accessory(speciesId) } : null,
      },
    );
  }

  private handlePetOutingChanged(progress: PetOutingProgress): void {
    this.writePetOutingMetrics(progress);
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
    this.showBubble(this.player, `산책 도장 ${progress.souvenirStamps}/${progress.totalSouvenirs} · ${progress.routesVisited}개 골목 기록`);
  }

  private writePetOutingMetrics(progress: PetOutingProgress): void {
    this.questStore.setMetric('pet_outings_total', progress.totalWalks);
    this.questStore.setMetric('pet_outing_routes', progress.routesVisited);
    this.questStore.setMetric('pet_outing_stamps', progress.souvenirStamps);
    this.questStore.setMetric('pet_outing_complete', progress.completedRoutes);
    this.questStore.setMetric('pet_outing_partners', progress.petPartners);
    this.questStore.setMetric('pet_outing_pairings', progress.pairings);
  }

  private handlePetSignalsChanged(progress: PetSignalProgress): void {
    this.writePetSignalMetrics(progress);
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
    this.showBubble(this.player, `마음 번역 ${progress.recorded}개 · ${progress.personalities}/6 성격 기록`);
  }

  private writePetSignalMetrics(progress: PetSignalProgress): void {
    this.questStore.setMetric('pet_signals', progress.recorded);
    this.questStore.setMetric('pet_signal_personalities', progress.personalities);
    this.questStore.setMetric('pet_signal_chapters', progress.completedChapters);
    this.questStore.setMetric('pet_signal_partners', progress.petPartners);
    this.questStore.setMetric('pet_signal_responses', progress.responseStyles);
    this.questStore.setMetric('pet_signal_featured', progress.featured);
  }

  private handlePetPerformanceChanged(progress: PetPerformanceProgress): void {
    this.writePetPerformanceMetrics(progress);
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
    this.showBubble(this.player, `트릭 소극장 ${progress.stamps}장 · ${progress.repertoireTricks}/5 레퍼토리 기록`);
  }

  private writePetPerformanceMetrics(progress: PetPerformanceProgress): void {
    this.questStore.setMetric('pet_performance_rehearsals', progress.totalRehearsals);
    this.questStore.setMetric('pet_performance_stamps', progress.stamps);
    this.questStore.setMetric('pet_performance_tricks', progress.repertoireTricks);
    this.questStore.setMetric('pet_performance_complete', progress.completedPerformances);
    this.questStore.setMetric('pet_performance_partners', progress.petPartners);
    this.questStore.setMetric('pet_performance_featured', progress.featured);
  }

  private writeChronicleMetrics(progress: ChronicleProgress): void {
    this.questStore.setMetric('chronicle_pages', progress.pages);
    this.questStore.setMetric('chronicle_routes', progress.routesChosen);
    this.questStore.setMetric('chronicle_motifs', progress.motifs);
    this.questStore.setMetric('chronicle_featured', progress.featured);
  }

  private handleRequestBoardChanged(progress: VillageRequestProgress): void {
    this.writeRequestBoardMetrics(progress);
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
  }

  private writeRequestBoardMetrics(progress: VillageRequestProgress): void {
    this.questStore.setMetric('village_requests_total', progress.totalCompleted);
    this.questStore.setMetric('village_request_stamps', progress.uniqueStamps);
    this.questStore.setMetric('village_request_categories', progress.categoryStamps);
    this.questStore.setMetric('village_request_rank', progress.rank);
    this.questStore.setMetric('village_request_story_chapters', progress.storyChapters);
    this.questStore.setMetric('village_request_story_routes', progress.storyRoutes);
    this.questStore.setMetric('village_request_story_clues', progress.storyClues);
    this.questStore.setMetric('village_request_story_ready', progress.storyReady);
    const completed = new Set(progress.storyCompletedIds);
    for (const reward of REQUEST_STORY_REWARDS) {
      this.questStore.setMetric(requestStoryMetricKey(reward.storyId), completed.has(reward.storyId) ? 1 : 0);
    }
  }

  private syncGardenMetrics(): void {
    if (!this.gardenStore) return;
    const progress = this.gardenStore.progress();
    this.questStore.setMetric('garden_planted', progress.totalPlanted);
    this.questStore.setMetric('garden_tend', progress.totalTends);
    this.questStore.setMetric('garden_harvest', progress.totalHarvests);
    this.questStore.setMetric('garden_species', progress.speciesDiscovered);
    this.questStore.setMetric('garden_specimens', progress.specimensDiscovered);
  }

  private syncCookingMetrics(): void {
    if (!this.cookingStore) return;
    const progress = this.cookingStore.progress();
    this.questStore.setMetric('cooking_total', progress.totalCooked);
    this.questStore.setMetric('cooking_recipes', progress.recipesDiscovered);
    this.questStore.setMetric('cooking_plates', progress.platesDiscovered);
    this.questStore.setMetric('cooking_favorites', progress.favorites);
  }

  private syncFishingMetrics(): void {
    if (!this.fishingStore) return;
    const progress = this.fishingStore.progress();
    this.questStore.setMetric('fishing_total', progress.totalCatches);
    this.questStore.setMetric('fishing_species', progress.speciesDiscovered);
    this.questStore.setMetric('fishing_stamps', progress.recordStamps);
    this.questStore.setMetric('fishing_gold_records', progress.goldRecords);
  }

  private syncAquariumMetrics(): void {
    if (!this.homeAquariumStore || !this.fishingStore) return;
    const progress = this.homeAquariumStore.progress(this.fishingStore);
    this.questStore.setMetric('aquarium_saves', progress.saveCount);
    this.questStore.setMetric('aquarium_displayed', progress.displayedFish);
    this.questStore.setMetric('aquarium_frames', progress.framesUnlocked);
    this.questStore.setMetric('aquarium_substrates', progress.substratesUnlocked);
    this.questStore.setMetric('aquarium_ornaments', progress.ornamentsUnlocked);
  }

  private syncFurnitureReformMetrics(): void {
    if (!this.furnitureReformStore) return;
    const progress = this.furnitureReformStore.progress();
    this.questStore.setMetric('furniture_reform_saves', progress.saves);
    this.questStore.setMetric('furniture_reform_combos', progress.combinations);
    this.questStore.setMetric('furniture_reform_finishes', progress.finishes);
    this.questStore.setMetric('furniture_reform_colors', progress.colors);
    this.questStore.setMetric('furniture_reformed_items', progress.styledPlacements);
  }

  private handleLookbookChanged(progress: LookbookProgress): void {
    this.writeLookbookMetrics(progress);
    this.refreshAchievementState(true);
    this.refreshHearts();
    this.refreshQuestTracker();
    this.showBubble(this.player, `룩북 ${progress.stars}/${progress.totalStars}별 · ${progress.entries}장 기록`);
  }

  private syncLookbookMetrics(): void {
    if (!this.lookbookStore || !this.achievementStore) return;
    this.writeLookbookMetrics(this.lookbookStore.progress(this.achievementStore.get().unlocked));
  }

  private writeLookbookMetrics(progress: LookbookProgress): void {
    this.questStore.setMetric('lookbook_submissions', progress.submissions);
    this.questStore.setMetric('lookbook_entries', progress.entries);
    this.questStore.setMetric('lookbook_stars', progress.stars);
    this.questStore.setMetric('lookbook_perfect', progress.perfect);
    this.questStore.setMetric('lookbook_unique', progress.uniqueLooks);
  }

  private handleEquipBadge(badgeId: string): void {
    if (!this.achievementStore.equip(badgeId)) return;
    this.refreshNameTag();
    this.syncSelfMeta();
    this.quests?.refresh(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
    );
    const badge = BADGE_BY_ID.get(badgeId);
    if (badge) this.showBubble(this.player, `◆ 「${badge.name}」 배지 장착!`);
  }

  private async handleQuestClaim(questId: string): Promise<void> {
    if (!this.sb) return;
    const result = await claimDailyQuest(this.sb, questId);
    if (result.ok) {
      this.setCoins(result.balance);
      this.questStore.claim(questId);
      this.quests?.markClaimed(questId);
      this.showBubble(this.player, '퀘스트 보상 +40 🪙');
      this.motions?.play(this.player, 'coin');
    } else if (result.reason === 'claimed') {
      this.questStore.claim(questId);
      this.quests?.markClaimed(questId); // 오늘 이미 수령
    } else if (result.reason === 'not-ready') {
      this.showBubble(this.player, '서버 기록이 아직 목표에 조금 모자라요. 안내 행동을 한 번 더 천천히 해 보세요.');
    } else if (result.reason === 'no-rpc') {
      this.showBubble(this.player, '보상 서버를 업데이트한 뒤 다시 시도해 주세요. 진행 기록은 그대로 보관돼요.');
    } else {
      this.showBubble(this.player, '보상 수령에 실패했어요');
    }
  }

  private async handleOmokWin(): Promise<void> {
    this.incQuest('omok_win');
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
    this.incQuest('q_busking');
    if (!this.sb) {
      this.showBubble(this.player, '멋진 연주! (오프라인 — 보상은 접속 후에)');
      return;
    }
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
    this.incQuest('customize_save');
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
    const c = this.add.container(owner.x, owner.y - 48, [bg, t]).setDepth(20);
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
    this.neighborhoodMarket?.destroy();
    this.cafe?.destroy();
    this.busking?.destroy();
    this.omok?.destroy();
    this.claw?.destroy();
    this.realty?.destroy();
    this.petShop?.destroy();
    this.petStyleStudio?.destroy();
    this.photoBooth?.destroy();
    this.gardenPanel?.destroy();
    this.cookingPanel?.destroy();
    this.fishingPanel?.destroy();
    this.weaponShop?.destroy();
    this.adventureRolePanel?.destroy();
    this.hunt?.destroy();
    this.battleHud?.destroy();
    this.playerAura?.destroy();
    this.playerInfo?.destroy();
    this.pet?.destroy();
    this.treasure?.destroy();
    this.starterConcierge?.destroy();
    this.starterConcierge = null;
    this.quests?.destroy();
    this.npcs?.destroy();
    this.residents?.destroy();
    this.motions?.destroy();
    this.idleBreath?.destroy();
    this.touch?.destroy();
    if (this.syncReady && this.sb) void saveGameState(this.sb, this.peer.userId, this.buildSnapshot());
    this.hud?.unmountActions(); // HUD는 싱글턴 — 액션 바만 내리고 상태·설정은 유지
    this.bag?.destroy();
    this.dex?.destroy();
    this.mapPanel?.destroy();
    this.minimap?.destroy();
    this.residentsPanel?.destroy();
    this.profilePanel?.destroy();
    this.rankingPanel?.destroy();
    if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
    this.hint?.remove();
  }
}
