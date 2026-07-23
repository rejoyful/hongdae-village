import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { TILE, TEXT_RES, UI_FONT } from '../config';
import { DEFAULT_APPEARANCE, normalizeAppearance, type Appearance } from '../art/appearance';
import { ClosetStore } from '../art/closet';
import { LookbookStore, type LookbookProgress } from '../art/lookbook';
import { CHARACTER_EPISODES, CharacterZineStore } from '../progression/characterZine';
import { rareStyleUnlockCount } from '../art/styleCatalog';
import { lifeMasteryQuestMetrics, lifeMasteryViews } from '../progression/lifeMastery';
import type { LifeSpecialtyProgress } from '../progression/lifeSpecialty';
import { LIFE_SYNERGY_BY_ID } from '../progression/lifeSynergies';
import type { DailyInvitationProgress } from '../progression/dailyInvitations';
import { DAILY_INVITATIONS } from '../progression/dailyInvitations';
import type { SessionPlannerProgress } from '../progression/sessionPlanner';
import type { FanMerchWorkshopProgress } from '../progression/fanMerchWorkshop';
import {
  VILLAGE_LEVEL_MILESTONES, villageJourneyMetrics, villageJourneySummary, villageTitle,
} from '../progression/villageJourney';
import { normalizeVillageProfilePublic } from '../progression/villageProfile';
import { ADVENTURE_PATHS, adventurePathMetrics } from '../progression/adventurePaths';
import { villageLevelMemoryMetrics } from '../progression/villageLevelMemories';
import { STARTER_COMPASS_ROUTES, STARTER_MENTOR_CHAPTERS, starterCompassMetrics } from '../progression/starterCompass';
import { CHAR_H, CHAR_W, ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { drawIsoBuilding, drawIsoCommunityProjectProgress, drawIsoGround, drawIsoHuntZone, drawIsoProp, drawIsoTileHighlight, drawIsoTree } from '../art/isometricArt';
import { furnitureWorkshopPreview } from '../art/furnitureWorkshopArt';
import { drawIsoGuideRoute, type IsoGuideStep } from '../art/isometricTerrainArt';
import { ISO_METRICS, isoDepth, pickIsoTile, projectIso, projectIsoWorld, screenInputToWorld } from '../world/isometric';
import {
  ISO_HUNT_ZONES, ISO_RESIDENT_PLACEMENTS, ISO_VILLAGE_ACTIVITIES, ISO_VILLAGE_BUILDINGS, ISO_VILLAGE_H, ISO_VILLAGE_PROPS, ISO_VILLAGE_SPAWN, ISO_VILLAGE_TREES, ISO_VILLAGE_W, ISO_WELCOME_ROUTE,
  activityAt, buildIsoVillageCollision, huntZoneAt, isoVillageTerrain, type IsoActivityKind, type IsoActivitySpot, type IsoHuntZoneDef,
} from '../world/isometricVillageMap';
import { collectionWorldGuide, findIsoVillageRoute } from '../world/isometricCollectionGuide';
import type { CollectionShelfProgress } from '../progression/collectionShelf';
import { worldToTile, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import type { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { selectQuestGuide } from '../questGuidance';
import {
  worldQuestSignals, worldQuestSignalSignature, type WorldQuestSignal,
} from '../guidance/worldQuestSignals';
import {
  ALLEY_SECRETS, AlleySecretStore, type AlleySecretDef, type AlleySecretProgress,
} from '../guidance/alleySecrets';
import {
  completedQuestIds, QuestMilestoneHistoryStore, questMilestoneNotice,
} from '../guidance/questMilestones';
import { QUEST_BY_ID } from '../quests';
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
import { HomeStudioCardStore } from '../home/homeStudioCards';
import { AchievementStore, BADGE_BY_ID } from '../achievements';
import { CustomizePanel } from '../../ui/customizePanel';
import { saveAppearance } from '../../ui/loginPanel';
import { PetStore } from '../pets/petStore';
import { PetOutingStore, type PetOutingProgress } from '../pets/petOutings';
import type { PetSignalProgress } from '../pets/petSignals';
import type { PetPerformanceProgress } from '../pets/petPerformances';
import {
  PetStyleStudioStore, type PetStyleDraft, type PetStyleStudioProgress,
} from '../pets/petStyleStudio';
import { PetHomeMemoryStore } from '../home/petHomeComfort';
import { VillageRequestStore, type VillageRequestProgress } from '../requests/villageRequests';
import { villageRequestDestinationForMetric } from '../requests/villageRequestStories';
import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import { PetFollower } from '../pets/petFollower';
import { PetShopPanel } from '../../ui/petShopPanel';
import { PetStyleStudioPanel } from '../../ui/petStyleStudioPanel';
import { petById } from '../pets/pets';
import { adoptPet, carePet, claimRarePet, fetchOwnedPets, fetchPetProgress } from '../../db/petApi';
import { buyItem, craftFurniture, fetchCoins, fetchFurnitureCraftHistory, fetchWeeklyFurniturePurchaseHistory, sellItem } from '../../db/economyApi';
import { claimDailyQuest } from '../../db/progressionApi';
import { CafePanel } from '../../ui/cafePanel';
import { BuskingPanel } from '../../ui/buskingPanel';
import { IsometricMapPanel } from '../../ui/isometricMapPanel';
import { AlleySecretPanel } from '../../ui/alleySecretPanel';
import { VillageSearchPanel } from '../../ui/villageSearchPanel';
import type { VillageSearchAction, VillageSearchResult } from '../guidance/villageSearch';
import { BagPanel } from '../../ui/bagPanel';
import { CollectionPanel } from '../../ui/collectionPanel';
import { TASTE_SET_BY_ID, type TasteSetProgress } from '../progression/tasteSetArchive';
import { TreasurePanel } from '../../ui/treasurePanel';
import type { TreasureStore } from '../treasure/treasureStore';
import { fetchInventory } from '../../db/roomsApi';
import { fetchPropertyForHolder } from '../../db/realEstateApi';
import { audio } from '../audio';
import { IsometricResidentNpcs } from '../entities/isometricResidents';
import { ResidentsPanel } from '../../ui/residentsPanel';
import { ResidentQuestDialoguePanel } from '../../ui/residentQuestDialoguePanel';
import { VillageProfilePanel, type VillageProfileSelfContext } from '../../ui/villageProfilePanel';
import { RankingPanel } from '../../ui/rankingPanel';
import { fetchRanking } from '../../db/rankingApi';
import { RESIDENTS, metCount, trustStage } from '../residents/residents';
import { residentTrustMetrics } from '../residents/residentStories';
import type { ResidentRendezvousProgress } from '../residents/residentRendezvous';
import type { ResidentLetterProgress } from '../residents/residentLetters';
import type { ResidentFanbookProgress } from '../residents/residentFanbook';
import type { ResidentRoomCareProgress } from '../residents/residentRoomCare';
import { IsometricMultiplayer } from '../entities/isometricMultiplayer';
import { ChatInput } from '../../ui/chatInput';
import { ChatFeed } from '../../ui/chatFeed';
import { OnlineList } from '../../ui/onlineList';
import { EmoteWheel, EMOTE_EMOJI } from '../../ui/emoteWheel';
import { sanitizeChat, type EmoteKind, type NeighborCheerKind, type PetMeetKind } from '../../net/protocol';
import { BattleStore } from '../battle/battleStore';
import { AdventureRoleStore, type AdventureRoleProgress } from '../battle/adventureRoles';
import { PlayerAura } from '../entities/playerAura';
import { ISOMETRIC_BUILDING_TEXTURES, ISOMETRIC_MONSTER_TEXTURES, ISOMETRIC_PROP_TEXTURES, ISOMETRIC_TREE_TEXTURES } from '../art/assetManifest';
import { IsometricHuntField } from '../battle/isometricHuntField';
import { AdventureComfortStore, type AdventureComfortProgress } from '../battle/adventureComfort';
import { FATIGUE_MS, maxHpForLevel, totalAtk, xpToNext } from '../battle/combat';
import { weaponById } from '../battle/weapons';
import { isTitleUpAt, titleForLevel } from '../battle/titles';
import type { MonsterSpecies } from '../battle/monsters';
import { BattleHud } from '../../ui/battleHud';
import { AdventureRolePanel } from '../../ui/adventureRolePanel';
import { ShopPanel } from '../../ui/shopPanel';
import { CATALOG_BY_ID } from '../../items/catalog';
import { FURNITURE_RECIPE_BY_ID, furnitureAcquisitionChannel } from '../home/furnitureWorkshop';
import { analyzeHomeDesign } from '../home/homeDesign';
import { TASTE_SHOWCASE_BY_ID, TasteShowcaseStore, emptyPetSnapshot, type TasteShowcaseContext } from '../showcase/tasteShowcase';
import { TasteShowcasePanel } from '../../ui/tasteShowcasePanel';
import {
  HOBBY_CLUB_BY_ID, HobbyClubStore, type HobbyClubCondition, type HobbyClubId, type HobbyClubProgress,
} from '../clubs/hobbyClubs';
import { HobbyClubPanel } from '../../ui/hobbyClubPanel';
import { CommunityProjectStore, type CommunityContribution, type CommunityProjectId, type CommunityProjectProgress } from '../projects/communityProjects';
import { CommunityProjectPanel } from '../../ui/communityProjectPanel';
import {
  SharedVillageProjectStore, type SharedProjectContributionKind,
  type SharedProjectContributeResult, type SharedProjectView,
} from '../projects/sharedVillageProject';
import { SharedVillageProjectPanel } from '../../ui/sharedVillageProjectPanel';
import { drawIsoSharedVillageProject } from '../art/sharedVillageWorldArt';
import {
  contributeSharedVillageProject, fetchSharedVillageProject, subscribeSharedVillageProject,
} from '../../db/sharedVillageProjectApi';
import { NeighborhoodTourStore, type NeighborhoodTourId, type NeighborhoodTourProgress, type NeighborhoodTourStopView } from '../guidance/neighborhoodTours';
import { NeighborhoodTourPanel } from '../../ui/neighborhoodTourPanel';
import { NeighborhoodMuseumStore, type MuseumExhibitId, type MuseumRequirementView, type NeighborhoodMuseumProgress } from '../museum/neighborhoodMuseum';
import { NeighborhoodMuseumPanel } from '../../ui/neighborhoodMuseumPanel';
import { REQUEST_STORY_REWARDS, requestStoryMetricKey } from '../progression/requestStoryRewards';
import type { FestivalArchiveStore } from '../events/festivalArchive';
import type { ChronicleProgress } from '../progression/villageChronicle';
import type { NeighborCheerProgress } from '../social/neighborCheers';
import {
  NeighborhoodMarketStore, type MarketPriceTier, type NeighborhoodMarketProgress,
} from '../social/neighborhoodMarket';
import { NeighborhoodMarketPanel } from '../../ui/neighborhoodMarketPanel';
import {
  buyMarketListing, cancelMarketListing, createMarketListing,
  fetchMarketListings, fetchMarketSummary,
} from '../../db/neighborhoodMarketApi';
import { performanceComfort, type QualityProfile } from '../performance/performanceComfort';
import { playComfort } from '../accessibility/playComfort';
import {
  NEIGHBORHOOD_DISTRICT_BY_ID, NeighborhoodDistrictStore,
  neighborhoodDistrictAtWorld, type NeighborhoodDistrictId, type NeighborhoodDistrictProgress,
} from '../world/neighborhoodDistricts';
import {
  NEIGHBORHOOD_ATMOSPHERES,
  NeighborhoodAtmosphereStore,
  type NeighborhoodAtmosphereProgress,
  type NeighborhoodAtmosphereRequirementView,
} from '../world/neighborhoodAtmospheres';
import { NeighborhoodAtmosphereFx } from '../art/neighborhoodAtmosphereFx';
import { NeighborhoodAtmospherePanel } from '../../ui/neighborhoodAtmospherePanel';

interface VillageData {
  peer?: PeerState;
  adapter?: NetworkAdapter | null;
  spawnTile?: { tx: number; ty: number };
}

/** 실제 저장·퀘스트·집·펫 UI를 공유하는 아이소메트릭 메인 월드 전환 경로. */
export class IsometricVillageScene extends Phaser.Scene {
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private sb: SupabaseClient | null = null;
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private ring!: Phaser.GameObjects.Ellipse;
  private nameLabel!: Phaser.GameObjects.Text;
  private highlight!: Phaser.GameObjects.Graphics;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private touch: TouchControls | null = null;
  private worldPos = { x: ISO_VILLAGE_SPAWN.tx * TILE, y: ISO_VILLAGE_SPAWN.ty * TILE };
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';
  private lastActivityId: string | null = null;
  private entering = false;
  private hint: HTMLDivElement | null = null;
  private toast: Phaser.GameObjects.Text | null = null;
  private hud!: GameHud;
  private questStore!: QuestStore;
  private achievementStore!: AchievementStore;
  private closetStore!: ClosetStore;
  private lookbookStore!: LookbookStore;
  private characterZineStore!: CharacterZineStore;
  private tasteShowcaseStore!: TasteShowcaseStore;
  private hobbyClubStore!: HobbyClubStore;
  private communityProjectStore!: CommunityProjectStore;
  private sharedVillageProjectStore!: SharedVillageProjectStore;
  private neighborhoodTourStore!: NeighborhoodTourStore;
  private neighborhoodMuseumStore!: NeighborhoodMuseumStore;
  private neighborhoodMarketStore!: NeighborhoodMarketStore;
  private atmosphereStore!: NeighborhoodAtmosphereStore;
  private alleySecretStore!: AlleySecretStore;
  private treasureStore!: TreasureStore;
  private gardenStore!: GardenStore;
  private cookingStore!: CookingStore;
  private fishingStore!: FishingStore;
  private homeAquariumStore!: HomeAquariumStore;
  private furnitureReformStore!: FurnitureReformStore;
  private petStore = new PetStore(() => this.achievementStore?.get().unlocked ?? []);
  private petOutingStore!: PetOutingStore;
  private petStyleStudioStore!: PetStyleStudioStore;
  private petHomeMemoryStore!: PetHomeMemoryStore;
  private requestBoardStore!: VillageRequestStore;
  private festivalArchiveStore!: FestivalArchiveStore;
  private pet: PetFollower | null = null;
  private battleStore!: BattleStore;
  private adventureRoleStore!: AdventureRoleStore;
  private adventureComfortStore!: AdventureComfortStore;
  private hunt!: IsometricHuntField;
  private battleHud!: BattleHud;
  private adventureRolePanel!: AdventureRolePanel;
  private playerHp = 40;
  private fatigueUntil = 0;
  private lastHitMs = -10_000;
  private activeHuntZone: IsoHuntZoneDef | null = null;
  private playerAura!: PlayerAura;
  private residents!: IsometricResidentNpcs;
  private worldBubbles = new Map<Phaser.GameObjects.Sprite, Phaser.GameObjects.Container>();
  private multiplayer!: IsometricMultiplayer;
  private chat!: ChatInput;
  private chatFeed!: ChatFeed;
  private onlineList!: OnlineList;
  private emotes!: EmoteWheel;
  private quests!: QuestPanel;
  private starterConcierge: StarterConciergeDock | null = null;
  private photoBooth!: PhotoBoothPanel;
  private gardenPanel!: GardenPanel;
  private cookingPanel!: CookingPanel;
  private fishingPanel!: FishingPanel;
  private photoAlbum!: PhotoAlbumStore;
  private customize!: CustomizePanel;
  private petShop!: PetShopPanel;
  private petStyleStudio!: PetStyleStudioPanel;
  private shop!: ShopPanel;
  private cafe!: CafePanel;
  private busking!: BuskingPanel;
  private mapPanel!: IsometricMapPanel;
  private alleySecrets!: AlleySecretPanel;
  private villageSearch!: VillageSearchPanel;
  private bag!: BagPanel;
  private dex!: CollectionPanel;
  private treasure!: TreasurePanel;
  private residentsPanel!: ResidentsPanel;
  private residentQuestDialogue!: ResidentQuestDialoguePanel;
  private profilePanel!: VillageProfilePanel;
  private rankingPanel!: RankingPanel;
  private tasteShowcase!: TasteShowcasePanel;
  private hobbyClubs!: HobbyClubPanel;
  private communityProjects!: CommunityProjectPanel;
  private sharedVillageProject!: SharedVillageProjectPanel;
  private neighborhoodTours!: NeighborhoodTourPanel;
  private neighborhoodMuseum!: NeighborhoodMuseumPanel;
  private neighborhoodMarket!: NeighborhoodMarketPanel;
  private atmospherePanel!: NeighborhoodAtmospherePanel;
  private atmosphereFx!: NeighborhoodAtmosphereFx;
  private communityProjectVisual: Phaser.GameObjects.Container | null = null;
  private sharedVillageProjectVisual: Phaser.GameObjects.Container | null = null;
  private unsubscribeSharedVillageProject: (() => void) | null = null;
  private inventory = new Map<string, number>();
  private furnitureCraftHistory = new Map<string, number>();
  private weeklyFurnitureHistory = new Set<string>();
  private coins = 0;
  private collectionRoute: Phaser.GameObjects.Graphics | null = null;
  private collectionGuide: {
    signature: string;
    title: string;
    instruction: string;
    target: IsoGuideStep;
    mode: 'activity' | 'hunt' | 'secret';
    activityKind?: IsoActivityKind;
    focusItemId?: string;
    arriveAtTarget?: boolean;
  } | null = null;
  private collectionGuideTile = '';
  private escHandler: ((event: KeyboardEvent) => void) | null = null;
  private qualityUnsubscribe: (() => void) | null = null;
  private comfortUnsubscribe: (() => void) | null = null;
  private readonly activityTweens: Phaser.Tweens.Tween[] = [];
  private readonly worldQuestMarkers: Phaser.GameObjects.Container[] = [];
  private readonly alleySecretMarkers = new Map<string, Phaser.GameObjects.Container>();
  private worldQuestMarkersSignature = '';
  private residentQuestSignals = new Map<string, WorldQuestSignal>();
  private questMilestoneHistory: QuestMilestoneHistoryStore | null = null;
  private districtStore!: NeighborhoodDistrictStore;
  private currentDistrictId: NeighborhoodDistrictId | null = null;
  private districtBanner: HTMLDivElement | null = null;
  private districtBannerTimer: number | null = null;
  private lastDistrictBannerAt = -12_000;

  constructor() { super('iso-village'); }

  preload(): void {
    const authoredAssets = [...ISOMETRIC_BUILDING_TEXTURES, ...ISOMETRIC_MONSTER_TEXTURES, ...ISOMETRIC_TREE_TEXTURES, ...ISOMETRIC_PROP_TEXTURES];
    for (const asset of authoredAssets) {
      if (!this.textures.exists(asset.key)) this.load.image(asset.key, asset.url);
    }
    this.load.on('loaderror', (file: { key: string }) => {
      if (authoredAssets.some((asset) => asset.key === file.key)) {
        console.warn('[홍대마을] 아이소메트릭 자산 로드 실패, 프로시저럴 폴백:', file.key);
      }
    });
  }

  init(data: VillageData): void {
    this.peer = data.peer ?? { userId: 'offline', nickname: '게스트', color: 'e8c9a0', appearance: DEFAULT_APPEARANCE };
    this.adapter = data.adapter ?? null;
    this.sb = (this.registry.get('sb') as SupabaseClient | undefined) ?? null;
    this.battleStore = new BattleStore(this.peer.userId);
    this.adventureRoleStore = new AdventureRoleStore(this.peer.userId);
    this.adventureComfortStore = new AdventureComfortStore(this.peer.userId);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('hunt')) {
      this.adventureComfortStore.setMode('expedition');
    }
    this.questStore = this.registry.get('quests') as QuestStore;
    this.treasureStore = this.registry.get('treasure') as TreasureStore;
    this.gardenStore = this.registry.get('garden') as GardenStore;
    this.cookingStore = this.registry.get('cooking') as CookingStore;
    this.fishingStore = this.registry.get('fishing') as FishingStore;
    this.homeAquariumStore = this.registry.get('homeAquarium') as HomeAquariumStore;
    this.furnitureReformStore = this.registry.get('furnitureReform') as FurnitureReformStore;
    this.achievementStore = new AchievementStore(this.peer.userId);
    this.closetStore = new ClosetStore(this.peer.userId);
    this.lookbookStore = new LookbookStore(this.peer.userId);
    this.characterZineStore = new CharacterZineStore(this.peer.userId);
    this.tasteShowcaseStore = new TasteShowcaseStore(this.peer.userId);
    this.hobbyClubStore = new HobbyClubStore(this.peer.userId);
    this.communityProjectStore = new CommunityProjectStore(this.peer.userId);
    this.sharedVillageProjectStore = new SharedVillageProjectStore(this.peer.userId);
    this.neighborhoodTourStore = new NeighborhoodTourStore(this.peer.userId);
    this.neighborhoodMuseumStore = new NeighborhoodMuseumStore(this.peer.userId);
    this.neighborhoodMarketStore = new NeighborhoodMarketStore(this.peer.userId);
    this.atmosphereStore = new NeighborhoodAtmosphereStore(this.peer.userId);
    this.districtStore = new NeighborhoodDistrictStore(this.peer.userId);
    this.alleySecretStore = new AlleySecretStore(this.peer.userId);
    this.petOutingStore = new PetOutingStore(this.peer.userId);
    this.petStyleStudioStore = new PetStyleStudioStore(this.peer.userId);
    this.petHomeMemoryStore = new PetHomeMemoryStore(this.peer.userId);
    this.requestBoardStore = this.registry.get('requests') as VillageRequestStore;
    this.festivalArchiveStore = this.registry.get('festivals') as FestivalArchiveStore;
    this.photoAlbum = new PhotoAlbumStore(this.peer.userId);
    this.achievementStore.sync(this.questStore.views());
    this.questStore.setMetric('rare_styles', rareStyleUnlockCount(this.achievementStore.get().unlocked));
    this.achievementStore.sync(this.questStore.views());
    this.peer.level = this.battleStore.level;
    this.peer.badge = this.achievementStore.equipped()?.name ?? null;
    this.questStore.setMetric('player_level', this.battleStore.level);
    this.questStore.setMetric('battle_tier', this.battleStore.tier);
    this.questStore.setMetric('monster_kill', this.battleStore.totalKills);
    this.questStore.setMetric('weapons_owned', this.battleStore.weaponsOwned().length);
    this.syncGardenMetrics();
    this.syncCookingMetrics();
    this.syncFishingMetrics();
    this.syncAquariumMetrics();
    this.syncFurnitureReformMetrics();
    this.syncLookbookMetrics();
    this.syncTasteShowcaseMetrics();
    this.syncHobbyClubMetrics();
    this.syncCommunityProjectMetrics();
    this.syncNeighborhoodTourMetrics();
    this.syncNeighborhoodMuseumMetrics();
    this.syncAlleySecretMetrics();
    this.syncNeighborhoodAtmosphereMetrics();
    this.syncAdventureComfortMetrics();
    this.syncLifeMasteryMetrics();
    this.syncVillageJourneyMetrics();
    this.achievementStore.sync(this.questStore.views());
    this.playerHp = maxHpForLevel(this.battleStore.level);
    const spawn = data.spawnTile ?? ISO_VILLAGE_SPAWN;
    this.worldPos = { x: (spawn.tx + 0.5) * TILE, y: (spawn.ty + 0.5) * TILE };
    this.entering = false;
    this.lastActivityId = null;
    this.currentDistrictId = null;
  }

  create(): void {
    this.grid = buildIsoVillageCollision();
    drawIsoGround(this, ISO_VILLAGE_W, ISO_VILLAGE_H, isoVillageTerrain);
    const introJournalDone = this.questStore.views().find((quest) => quest.id === 'intro_journal')?.done ?? false;
    const showWelcomeRoute = !introJournalDone || (
      import.meta.env.DEV && new URLSearchParams(location.search).has('welcome-route')
    );
    if (showWelcomeRoute) drawIsoGuideRoute(this, ISO_WELCOME_ROUTE);
    for (const def of ISO_VILLAGE_BUILDINGS) drawIsoBuilding(this, def);
    for (const zone of ISO_HUNT_ZONES) drawIsoHuntZone(this, zone);
    for (const tree of ISO_VILLAGE_TREES) drawIsoTree(this, tree.tx, tree.ty, tree.variant);
    for (const prop of ISO_VILLAGE_PROPS) drawIsoProp(this, prop);
    this.atmosphereFx = new NeighborhoodAtmosphereFx(this, this.atmosphereStore.get().activeId);
    this.refreshCommunityProjectVisual();
    this.refreshSharedVillageProjectVisual();
    this.drawActivitySpots();
    this.drawAlleySecretMarkers();

    this.highlight = this.add.graphics();
    const p = projectIsoWorld(this.worldPos.x, this.worldPos.y);
    this.ring = this.add.ellipse(p.x, p.y + 2, 28, 10, 0x54b86a, 0.42).setStrokeStyle(2, 0xffe6a0, 0.9);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(p.x, p.y, this.charKey, 3 * FRAMES_PER_DIR).setOrigin(0.5, 0.78);
    this.nameLabel = this.add.text(p.x, p.y - 43, this.playerName(), {
      fontFamily: UI_FONT, fontSize: '9px', color: '#fff5d8', backgroundColor: '#3b2a20cc',
      padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1);
    const activePetId = this.petStore.activeId();
    this.pet = new PetFollower(
      this, activePetId, activePetId ? this.petStore.accessory(activePetId) : 'none',
      activePetId ? this.petStore.nickname(activePetId) : null,
    );
    this.peer.pet = activePetId;
    this.peer.petAccessory = activePetId ? this.petStore.accessory(activePetId) : 'none';
    this.peer.petName = activePetId ? this.petStore.nickname(activePetId) : null;
    this.playerAura = new PlayerAura(this);
    this.playerAura.setLevel(this.battleStore.level);
    this.residents = new IsometricResidentNpcs(this, this.peer.userId, {
      onBubble: (sprite, text) => this.showWorldBubble(sprite, text, 'npc'),
      onGreet: (sprite, resident, trust) => {
        this.tweens.add({ targets: sprite, scaleX: 1.4, scaleY: 1.4, duration: 180, yoyo: true, ease: 'Back.easeOut' });
        this.bump('resident_greet');
        this.syncResidentMetrics();
        const stage = trustStage(trust);
        this.showToast(`${stage.icon} ${resident.name} · ${stage.name} ${trust}%`);
        audio.playSe('success');
      },
      onDirectTalk: (resident) => {
        if (!this.combatUiPaused()) this.openResidentQuestDialogue(resident.id);
      },
    });
    this.syncPlayerVisual(0);

    const kb = this.input.keyboard!;
    this.keys = { W: kb.addKey('W'), A: kb.addKey('A'), S: kb.addKey('S'), D: kb.addKey('D') };
    kb.on('keydown-Q', () => this.openExclusive(() => this.openQuests()));
    kb.on('keydown-M', () => this.openExclusive(() => this.mapPanel.open()));
    kb.on('keydown-B', () => this.openExclusive(() => this.bag.open(this.inventory)));
    kb.on('keydown-G', () => this.openExclusive(() => this.dex.open(this.inventory)));
    kb.on('keydown-C', () => this.openExclusive(() => this.customize.open(this.peer.appearance)));
    kb.on('keydown-K', () => this.openExclusive(() => this.adventureRolePanel.open()));
    kb.on('keydown-N', () => this.openExclusive(() => this.openNeighborhoodMarket()));
    kb.on('keydown-F', () => this.openExclusive(() => this.villageSearch.open()));
    kb.on('keydown-L', () => this.openExclusive(() => this.alleySecrets.open()));
    if (isTouchDevice()) this.touch = new TouchControls();

    this.setupPanels();
    void this.refreshSharedVillageProject();
    if (this.sb) {
      this.unsubscribeSharedVillageProject = subscribeSharedVillageProject(this.sb, () => {
        void this.refreshSharedVillageProject();
      });
    }
    this.battleHud = new BattleHud({
      onOpenRoles: () => this.adventureRolePanel.open(),
      onToggleCombatMode: () => this.toggleAdventureComfortMode(),
    });
    const huntPreviewTier = import.meta.env.DEV
      && new URLSearchParams(location.search).has('monster-art') ? 1 : null;
    this.hunt = new IsometricHuntField(this, ISO_HUNT_ZONES, {
      getPlayerPos: () => this.worldPos,
      getPlayerAtk: () => totalAtk(
        this.battleStore.level,
        weaponById(this.battleStore.equippedId()).atk,
        this.isFatigued(),
      ) * this.adventureRoleStore.modifier().attackMultiplier,
      getPlayerAttackInterval: () => this.adventureRoleStore.attackInterval(),
      combatEnabled: () => this.adventureComfortStore.combatEnabled(),
      currentTier: () => huntPreviewTier ?? this.battleStore.tier,
      onPlayerHit: (damage) => this.damagePlayer(
        Math.max(1, Math.round(damage * this.adventureRoleStore.modifier().damageTakenMultiplier)),
      ),
      onDefeat: (species) => this.onMonsterDefeat(species),
      onZoneChange: (zone) => this.onHuntZoneChange(zone),
    });
    this.qualityUnsubscribe = performanceComfort.subscribe(() => this.applyPerformanceComfort());
    this.comfortUnsubscribe = playComfort.subscribe(() => this.applyPerformanceComfort());
    this.setupSocial();
    this.multiplayer = new IsometricMultiplayer(this, this.adapter, this.peer, {
      onChat: (sprite, nickname, text) => {
        this.showWorldBubble(sprite, text, 'user');
        this.chatFeed.push(nickname, text, 'user');
      },
      onEmote: (sprite, kind) => this.showWorldBubble(sprite, EMOTE_EMOJI[kind], 'user'),
      onSystem: (message) => this.chatFeed.push('', message, 'system'),
      onOnline: (nicknames) => this.onlineList.render(nicknames),
      onEncounter: () => this.bump('online_encounter'),
      onProfile: (peer) => this.openExclusive(() => this.profilePanel.openPeer(peer)),
      onNeighborCheer: (peer, kind) => {
        if (this.profilePanel.receiveNeighborCheer(peer, kind)) {
          this.showToast(`${peer.nickname}님에게서 안전한 취향 응원 우편이 도착했어요.`);
          audio.playSe('success');
        }
      },
      onPetMeet: (peer, kind) => {
        if (this.profilePanel.receivePetMeet(peer, kind)) {
          this.showToast(`${peer.nickname}님의 동행과 새 인사 엽서를 남겼어요.`);
          audio.playSe('success');
        }
      },
    });
    this.multiplayer.connect();
    this.setupPointer();
    this.mountHud();
    this.syncResidentMetrics();

    // 개발 전용 회귀 경로: 이동 없이 주요 아이소메트릭 전환 화면을 검증한다.
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      if (params.has('pet-outing-ready')) {
        this.petStore.adopt('dog'); this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'gentle');
      }
      if (params.has('request-ready')) {
        const accepted = this.requestBoardStore.accept('street_cafe', this.questStore.get());
        if (accepted.ok) this.questStore.bump('q_cafe');
      }
      if (params.has('request-story-ready')) {
        this.questStore.setMetric('customize_save', 1);
        this.questStore.setMetric('photo_taken', 1);
      }
      if (params.has('journey-ready')) {
        for (const key of ['open_quest', 'open_map', 'resident_greet', 'customize_save']) this.questStore.bump(key);
        this.questStore.setMetric('visit_home', 1);
        this.questStore.setMetric('q_place', 1);
        this.questStore.setMetric('pet_adopt', 1);
        this.questStore.setMetric('photo_taken', 1);
        this.refreshProgress();
      }
      if (params.has('starter-mentor-ready')) {
        const completeMentorRoute = params.has('starter-mentor-complete');
        this.questStore.setMetric('customize_save', 1);
        this.questStore.setMetric('closet_save', 3);
        this.questStore.setMetric('photo_taken', 1);
        for (const chapter of STARTER_MENTOR_CHAPTERS.filter((item) => item.routeId === 'style').slice(0, completeMentorRoute ? 3 : 2)) {
          for (const requirement of chapter.requirements) this.questStore.setMetric(requirement.key, requirement.goal);
        }
        this.petStore.adopt('dog'); this.petStore.setActive('dog');
      }
      if (params.has('adventure-path-ready')) {
        const path = ADVENTURE_PATHS.find((item) => item.id === (params.get('adventure-path') ?? 'style'))
          ?? ADVENTURE_PATHS[0]!;
        for (const questId of path.questIds) {
          const quest = QUEST_BY_ID.get(questId);
          if (quest) this.questStore.setMetric(quest.registryKey, quest.goal);
        }
        this.petStore.adopt('dog'); this.petStore.setActive('dog');
        this.refreshProgress();
      }
      if (params.has('festival-ready')) {
        this.questStore.setMetric('q_busking', 3);
        this.questStore.setMetric('photo_taken', 1);
        this.questStore.setMetric('q_emote', 5);
        this.syncFestivalMetrics();
        this.refreshProgress();
      }
      if (params.has('showcase-ready')) {
        const homeItems = [
          'bed_basic', 'sofa_single', 'desk_wood', 'bookshelf', 'lamp_stand', 'plant_pot',
          'flower_vase', 'rug_cream', 'guitar', 'turntable', 'poster_band', 'cushion',
        ];
        const placed = homeItems.map((itemId, index) => ({ id: `showcase-${index}`, itemId, tx: index + 1, ty: 2, rot: 0 as const }));
        this.tasteShowcaseStore.updateHome(analyzeHomeDesign(placed), homeItems);
        this.petStore.adopt('dog');
        this.petStore.setActive('dog');
        this.petStore.mergeServerProgress([{
          petId: 'dog', affinity: 55, feeds: 4, plays: 4, trainings: 3, tricks: ['hello', 'spin'],
          lastFedDay: null, lastPlayedDay: null, lastTrainedDay: null,
        }]);
        this.syncPetMetrics();
      }
      if (params.has('clubs-ready')) {
        this.questStore.setMetric('customize_save', 1);
        this.questStore.setMetric('fashion_dye', 1);
        this.questStore.setMetric('closet_save', 1);
        this.syncHobbyClubMetrics();
      }
      if (params.has('clubroom-ready')) {
        const previewRanks: Partial<Record<HobbyClubId, number>> = { style: 4, companion: 3, home: 2 };
        for (const [clubId, targetRank] of Object.entries(previewRanks) as Array<[HobbyClubId, number]>) {
          const club = HOBBY_CLUB_BY_ID.get(clubId);
          if (!club) continue;
          for (const chapter of club.chapters.slice(0, targetRank)) {
            for (const condition of chapter.conditions) this.questStore.setMetric(condition.key, condition.goal);
            if (!this.hobbyClubStore.get().claimedChapterIds.includes(chapter.id)) {
              this.hobbyClubStore.claim(chapter.id, this.questStore.get());
            }
          }
        }
        this.petStore.adopt('dog'); this.petStore.setActive('dog');
        if (this.hobbyClubStore.get().pinnedClubId !== 'style') this.hobbyClubStore.pin('style');
        if (!this.hobbyClubStore.get().featuredClubIds.includes('style')) this.hobbyClubStore.toggleFeatured('style');
        this.syncHobbyClubMetrics();
      }
      if (params.has('projects-ready')) {
        this.questStore.setMetric('q_place', 3);
        this.questStore.setMetric('garden_planted', 1);
        this.questStore.setMetric('resident_greet', 3);
        this.questStore.setMetric('visit_shop', 1);
        this.syncCommunityProjectMetrics();
      }
      if (params.has('shared-project-ready')) {
        this.sharedVillageProjectStore.merge({
          globalTotal: 77,
          kindCounts: { warmth: 13, green: 17, music: 8, craft: 10, companion: 9, table: 7, water: 6, story: 7 },
          updatedAt: Date.now(),
          memberTotal: 4, kindIds: ['warmth', 'green', 'music', 'story'], chapterIds: [1], lastDay: null,
        });
        this.handleSharedVillageProjectChanged(this.sharedVillageProjectStore.view());
      }
      if (params.has('tours-ready')) {
        for (const [key, value] of [
          ['q_cafe', 1], ['photo_taken', 1], ['customize_save', 1], ['visit_home', 1],
        ] as const) this.questStore.setMetric(key, value);
        this.syncNeighborhoodTourMetrics();
      }
      if (params.has('museum-ready')) {
        for (const [key, value] of [
          ['customize_save', 1], ['fashion_dye', 1], ['visit_home', 1], ['q_place', 4],
        ] as const) this.questStore.setMetric(key, value);
        this.syncNeighborhoodMuseumMetrics();
      }
      if (params.has('atmosphere-ready')) {
        for (const atmosphere of NEIGHBORHOOD_ATMOSPHERES) {
          for (const requirement of atmosphere.requirements) {
            this.questStore.setMetric(requirement.key, requirement.goal);
          }
        }
        this.syncNeighborhoodAtmosphereMetrics();
        this.time.delayedCall(140, () => this.openExclusive(() => this.atmospherePanel.open()));
      }
      if (params.has('profile-ready')) {
        for (const [key, value] of [
          ['open_quest', 1], ['open_map', 1], ['q_busking', 3], ['garden_species', 6],
          ['fishing_species', 6], ['photo_backdrops', 3], ['furniture_reform_combos', 12],
        ] as const) this.questStore.setMetric(key, value);
        this.refreshProgress();
      }
      if (params.has('neighbor-cheer-ready')) {
        const previewKinds: NeighborCheerKind[] = ['style', 'home', 'companion', 'garden', 'water'];
        previewKinds.forEach((kind, index) => this.profilePanel.receiveNeighborCheer({
          userId: `cheer-neighbor-${index}`, nickname: ['새벽별', '모카집사', '초록손', '물결씨', '달빛낚시'][index]!,
          color: '806ad8', appearance: { ...DEFAULT_APPEARANCE, hair: index % 4, shirt: ['806ad8', 'a86e5a', '6f8c67', '658f9d', '8a78a6'][index]! },
        }, kind));
        this.time.delayedCall(140, () => this.profilePanel.openSelf());
      }
      if (params.has('specialty-ready')) {
        for (const [key, value] of [
          ['sparkle_collect', 10], ['customize_save', 4], ['q_place', 5],
          ['resident_greet', 4], ['q_cafe', 2], ['pet_adopt', 1],
          ['pet_feed', 8], ['pet_play', 8], ['pet_outings_total', 1],
        ] as const) this.questStore.setMetric(key, value);
        this.refreshProgress();
        const specialtyProgress = this.quests.previewLifeSpecialtyDeck(
          ['style_1', 'home_1', 'companion_1'], lifeMasteryViews(this.questStore.get()),
        );
        this.writeLifeSpecialtyMetrics(specialtyProgress);
        this.refreshProgress();
        this.time.delayedCall(140, () => this.openQuests('growth'));
      }
      if (params.has('daily-invites-ready')) {
        for (const metric of new Set(DAILY_INVITATIONS.map((invitation) => invitation.metric))) {
          this.questStore.bump(metric, 40);
        }
        this.refreshProgress();
        this.time.delayedCall(140, () => this.openQuests('daily'));
      }
      if (params.has('chronicle-ready')) {
        for (const [key, value] of [
          ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['customize_save', 1],
          ['visit_home', 1], ['q_place', 1], ['pet_adopt', 1], ['photo_taken', 1],
        ] as const) this.questStore.setMetric(key, value);
        this.refreshProgress();
        this.time.delayedCall(140, () => this.openQuests('chronicle'));
      }
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
        this.syncPetMetrics();
        this.syncVillageProfileMetrics();
        this.time.delayedCall(140, () => this.profilePanel.openSelf());
      }
      if (params.has('pet-meet-ready')) {
        const selfStyles = [
          { petId: 'dog', petName: '몽실', personalityId: 'gentle', accessoryId: 'scarf', backdropId: 'rain_window', poseId: 'look_back' },
          { petId: 'cat', petName: '보리', personalityId: 'calm', accessoryId: 'beret', backdropId: 'cozy_home', poseId: 'daydream' },
          { petId: 'rabbit', petName: '토리', personalityId: 'performer', accessoryId: 'ribbon', backdropId: 'little_stage', poseId: 'spotlight' },
        ] as const;
        selfStyles.forEach((draft, slot) => {
          this.petStore.adopt(draft.petId);
          if (!this.petStyleStudioStore.card(slot)) this.petStyleStudioStore.save(slot, draft);
        });
        for (const card of this.petStyleStudioStore.get().slots) {
          if (!card || this.petStyleStudioStore.progress().featured >= 3) break;
          if (!this.petStyleStudioStore.get().featuredIds.includes(card.id)) this.petStyleStudioStore.feature(card.id);
        }
        this.petStore.setActive('dog');
        this.syncPetMetrics();
        this.syncVillageProfileMetrics();
        const previewMeetPeers = [
          { id: 'meet-neighbor-fox', nickname: '새벽별', petId: 'fox', personalityId: 'curious', accessoryId: 'scarf', backdropId: 'rain_window', poseId: 'look_back', kind: 'rain_shelter' },
          { id: 'meet-neighbor-cat', nickname: '모카집사', petId: 'cat', personalityId: 'calm', accessoryId: 'beret', backdropId: 'cozy_home', poseId: 'daydream', kind: 'cafe_window' },
          { id: 'meet-neighbor-rabbit', nickname: '초록손', petId: 'rabbit', personalityId: 'performer', accessoryId: 'ribbon', backdropId: 'roof_garden', poseId: 'spotlight', kind: 'roof_garden' },
        ] as const;
        previewMeetPeers.forEach((entry, index) => {
          const previewPeer: PeerState = {
            userId: entry.id,
            nickname: entry.nickname,
            color: ['806ad8', '9d6658', '6f8064'][index]!,
            appearance: { ...DEFAULT_APPEARANCE, hair: (index + 2) % 6, shirt: ['806ad8', '9d6658', '6f8064'][index]! },
            pet: entry.petId,
            petAccessory: entry.accessoryId,
            level: 12 + index * 4,
            profile: normalizeVillageProfilePublic({
              villageLevel: 12 + index * 4,
              petStyleCards: [{
                petId: entry.petId,
                personalityId: entry.personalityId,
                accessoryId: entry.accessoryId,
                backdropId: entry.backdropId,
                poseId: entry.poseId,
              }],
            }),
          };
          this.multiplayer.previewPeer(
            previewPeer,
            (ISO_VILLAGE_SPAWN.tx + 1 + index) * TILE,
            (ISO_VILLAGE_SPAWN.ty + 1) * TILE,
          );
          this.multiplayer.previewPetMeet(previewPeer.userId, entry.kind);
        });
        this.syncPetMeetMetrics();
        this.time.delayedCall(180, () => this.profilePanel.openSelf());
      }
      if (params.has('pet-style-ready')) {
        for (const id of ['dog', 'cat', 'rabbit']) this.petStore.adopt(id);
        this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'playful');
        this.petStore.mergeServerProgress([{
          petId: 'dog', affinity: 100, feeds: 8, plays: 8, trainings: 5,
          tricks: ['hello', 'paw', 'spin', 'dance', 'pose'],
          lastFedDay: null, lastPlayedDay: null, lastTrainedDay: null,
        }]);
        this.syncPetMetrics();
        this.time.delayedCall(120, () => this.openExclusive(() => this.petStyleStudio.open(this.petStore, 'dog')));
      } else if (params.has('pet-signals-ready')) {
        this.petStore.adopt('dog'); this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'playful');
        this.petStore.mergeServerProgress([{
          petId: 'dog', affinity: 100, feeds: 8, plays: 8, trainings: 5,
          tricks: ['hello', 'paw', 'spin', 'dance', 'pose'],
          lastFedDay: null, lastPlayedDay: null, lastTrainedDay: null,
        }]);
        this.syncPetMetrics();
        this.time.delayedCall(120, () => this.petShop.openProfile(this.petStore, this.coins, !!this.sb, 'dog'));
      } else if (params.has('pet-performance-ready')) {
        this.petStore.adopt('dog'); this.petStore.setActive('dog'); this.petStore.setPersonality('dog', 'performer');
        this.petStore.mergeServerProgress([{
          petId: 'dog', affinity: 100, feeds: 8, plays: 8, trainings: 5,
          tricks: ['hello', 'paw', 'spin', 'dance', 'pose'],
          lastFedDay: null, lastPlayedDay: null, lastTrainedDay: null,
        }]);
        this.syncPetMetrics();
        this.time.delayedCall(120, () => this.petShop.open(this.petStore, this.coins, !!this.sb, 'performances'));
      } else if (params.has('petshop')) this.time.delayedCall(120, () => this.petShop.open(this.petStore, this.coins, !!this.sb, params.has('outings') ? 'outings' : 'list'));
      if (params.has('shop')) this.time.delayedCall(120, () => void this.openShop(params.get('shop') || undefined));
      if (params.has('workshop-world')) {
        const workshop = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'workshop');
        if (workshop) {
          this.worldPos = { x: (workshop.tx + 1.5) * TILE, y: (workshop.ty + 1.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('finder-world')) {
        const finder = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'search');
        if (finder) {
          const onInteraction = params.has('finder-enter');
          this.worldPos = {
            x: (finder.tx + 0.5) * TILE,
            y: (finder.ty + (onInteraction ? 0.5 : 1.5)) * TILE,
          };
          this.syncPlayerVisual(0);
          if (onInteraction) this.time.delayedCall(120, () => this.checkActivity());
        }
      }
      if (params.has('workshop-enter')) {
        const workshop = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'workshop');
        if (workshop) {
          this.worldPos = { x: (workshop.tx + 0.5) * TILE, y: (workshop.ty + 0.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('showcase-world')) {
        const showcase = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'showcase');
        if (showcase) {
          this.worldPos = { x: (showcase.tx + 0.5) * TILE, y: (showcase.ty + 1.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('clubs-world')) {
        const clubs = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'clubs');
        if (clubs) {
          this.worldPos = { x: (clubs.tx + 0.5) * TILE, y: (clubs.ty + 1.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('projects-world')) {
        const projects = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'projects');
        if (projects) {
          this.worldPos = { x: (projects.tx - 0.5) * TILE, y: (projects.ty + 0.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('quest')) {
        if (params.has('starter-mentor-ready')) {
          const progress = this.quests.previewStarterMentor('style', params.has('starter-mentor-complete') ? 3 : 2);
          this.questStore.setMetric('starter_keepsakes', progress.claimed);
          this.questStore.setMetric('starter_mentor_chapters', progress.mentorChapters);
          this.questStore.setMetric('starter_mentor_routes', progress.mentorRoutes);
          for (const route of STARTER_COMPASS_ROUTES) {
            this.questStore.setMetric(`starter_mentor_${route.id}_complete`, Number(progress.mentorRouteIds.includes(route.id)));
          }
          this.questStore.setMetric('starter_mentor_featured', progress.featuredMentorScenes);
          this.questStore.setMetric('starter_mentor_replays', progress.mentorReplays);
          this.refreshProgress();
        }
        this.time.delayedCall(120, () => this.openQuests(
          params.has('adventure-path-ready') || params.has('paths') ? 'paths'
            : params.has('journey-ready') ? 'journey'
              : params.has('fanwork') ? 'fanwork'
                : params.has('requests') ? 'requests' : undefined,
        ));
      }
      if (params.has('photo')) this.time.delayedCall(120, () => this.openPhotoBooth());
      if (params.has('garden')) this.time.delayedCall(120, () => this.gardenPanel.open());
      if (params.has('kitchen')) this.time.delayedCall(120, () => this.cookingPanel.open());
      if (params.has('fishing')) this.time.delayedCall(120, () => this.fishingPanel.open());
      if (params.has('showcase')) this.time.delayedCall(120, () => {
        const tab = params.get('showcase-tab');
        this.tasteShowcase.open(tab === 'home' || tab === 'pet' ? tab : 'fashion');
      });
      if (params.has('clubs')) this.time.delayedCall(120, () => this.hobbyClubs.open(
        (params.get('clubs-id') as HobbyClubId | null) ?? undefined,
      ));
      if (params.has('projects')) this.time.delayedCall(120, () => this.communityProjects.open(
        (params.get('projects-id') as CommunityProjectId | null) ?? undefined,
      ));
      if (params.has('shared-project')) this.time.delayedCall(140, () => this.sharedVillageProject.open());
      if (params.has('tours')) this.time.delayedCall(120, () => this.neighborhoodTours.open(
        (params.get('tour-id') as NeighborhoodTourId | null) ?? undefined,
      ));
      if (params.has('museum')) this.time.delayedCall(120, () => this.neighborhoodMuseum.open(
        (params.get('museum-id') as MuseumExhibitId | null) ?? undefined,
      ));
      if (params.has('market')) this.time.delayedCall(120, () => this.openExclusive(() => this.openNeighborhoodMarket(
        params.get('market-tab') === 'sell' || params.get('market-tab') === 'collection'
          ? params.get('market-tab') as 'sell' | 'collection' : 'browse',
      )));
      if (params.has('profile')) this.time.delayedCall(120, () => this.profilePanel.openSelf());
      if (params.has('character-episode-ready')) {
        const previewCharacters = [
          { name: '새벽 편집자', roleId: 'midnight_editor', motifId: 'star', appearance: { ...this.peer.appearance, hair: 3, shirt: '7d5a86', accent: 'd7859c' } },
          { name: '옥상 연구원', roleId: 'rooftop_gardener', motifId: 'leaf', appearance: { ...this.peer.appearance, hair: 5, shirt: '617653', accent: 'd0a861' } },
          { name: '비의 지도', roleId: 'rain_cartographer', motifId: 'rain', appearance: { ...this.peer.appearance, hair: 1, shirt: '4f7085', accent: '8fb7b5' } },
        ] as const;
        previewCharacters.forEach((character, index) => this.characterZineStore.save(index, character.appearance, {
          name: character.name, roleId: character.roleId, motifId: character.motifId, direction: index as 0 | 1 | 2,
        }));
        for (const episode of CHARACTER_EPISODES) {
          for (const requirement of episode.requirements) this.questStore.setMetric(requirement.key, requirement.goal);
        }
        this.characterZineStore.archiveEpisode(this.questStore.get(), 0, 'rainy_encore');
        this.syncCharacterZineMetrics();
      }
      if (params.has('character-zine') || params.has('character-episode-ready')) this.time.delayedCall(120, () => this.openExclusive(() => this.customize.open(this.peer.appearance, 'zine')));
      if (params.has('adventure-kit')) this.time.delayedCall(120, () => this.openExclusive(() => this.adventureRolePanel.open()));
      if (params.has('peer-profile')) this.time.delayedCall(120, () => this.profilePanel.openPeer({
        userId: 'preview-neighbor', nickname: '새벽별', color: '806ad8',
        appearance: { ...DEFAULT_APPEARANCE, hair: 3, hairColor: 8, shirt: '806ad8', hat: 1 },
        pet: 'fox', petAccessory: 'scarf', petName: '별콩', level: 20, badge: '골목 뮤지션 배지',
        profile: {
          mottoId: 'archivist', frameId: 'film', showcasedBadges: ['필름 아카이비스트', '골목 인연 기록가', '동행 큐레이터'],
          villageLevel: 28, tasteSets: 9, rendezvous: 17, signatureLooks: [],
          characterCards: [],
          specialtyIds: ['exploration_1', 'style_1', 'community_1'], synergyId: 'archive_curator',
          photoCards: [
            { frameId: 'oatmeal', backdropId: 'alley', poseId: 'hello', appearance: DEFAULT_APPEARANCE, pet: null, foilId: 'paper', stickerIds: ['heart', 'star'] },
            { frameId: 'leaf', backdropId: 'garden', poseId: 'side', appearance: { ...DEFAULT_APPEARANCE, topStyle: 4, shirt: '6f8064' }, pet: { speciesId: 'fox', accessory: 'scarf' }, foilId: 'silver', stickerIds: ['leaf', 'paw'] },
            { frameId: 'ink', backdropId: 'night', poseId: 'back', appearance: { ...DEFAULT_APPEARANCE, topStyle: 6, shirt: '5c4e73' }, pet: null, foilId: 'midnight', stickerIds: ['moon', 'sparkle'] },
          ],
          homeCards: [],
          petStyleCards: [
            { petId: 'fox', personalityId: 'curious', accessoryId: 'scarf', backdropId: 'rain_window', poseId: 'look_back' },
            { petId: 'cat', personalityId: 'calm', accessoryId: 'beret', backdropId: 'cozy_home', poseId: 'daydream' },
            { petId: 'rabbit', personalityId: 'performer', accessoryId: 'ribbon', backdropId: 'little_stage', poseId: 'spotlight' },
          ],
        },
      }));
      if (params.has('rendezvous-ready')) {
        const trust = this.residents.getTrust();
        trust.haneul = { v: 80, day: 'dev-preview' };
        this.questStore.setMetric('q_busking', 8);
        this.questStore.setMetric('photo_taken', 2);
        this.questStore.setMetric('lookbook_entries', 3);
        this.petStore.adopt('dog'); this.petStore.setActive('dog');
        this.syncResidentMetrics();
        this.time.delayedCall(120, () => this.residentsPanel.open(trust, 'rendezvous'));
      } else if (params.has('letters-ready')) {
        const trust = this.residents.getTrust();
        trust.haneul = { v: 100, day: 'dev-preview' };
        this.syncResidentMetrics();
        this.time.delayedCall(120, () => this.residentsPanel.open(trust, 'letters'));
      } else if (params.has('fanbook-ready')) {
        const trust = this.residents.getTrust();
        trust.haneul = { v: 100, day: 'dev-preview' };
        trust.moturi = { v: 50, day: 'dev-preview' };
        trust.sallim = { v: 15, day: 'dev-preview' };
        this.syncResidentMetrics();
        this.time.delayedCall(120, () => this.residentsPanel.open(trust, 'fanbook'));
      } else if (params.has('room-care-ready')) {
        const trust = this.residents.getTrust();
        trust.haneul = { v: 100, day: 'dev-preview' };
        trust.moturi = { v: 50, day: 'dev-preview' };
        trust.sallim = { v: 15, day: 'dev-preview' };
        this.syncResidentMetrics();
        this.time.delayedCall(120, () => this.residentsPanel.open(trust, 'room-care'));
      } else if (params.has('resident-book')) this.time.delayedCall(120, () => this.residentsPanel.open(this.residents.getTrust()));
      if (params.has('resident')) {
        const requested = params.get('resident');
        const placement = ISO_RESIDENT_PLACEMENTS.find((item) => item.residentId === requested) ?? ISO_RESIDENT_PLACEMENTS[0];
        if (placement) {
          this.worldPos = { x: (placement.tx + 0.5) * TILE, y: (placement.ty + 1.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('multiplayer')) {
        const previewPeer: PeerState = {
          userId: 'preview-neighbor', nickname: '새벽별', color: '806ad8', level: 20,
          badge: '골목 뮤지션 배지', pet: 'fox',
          appearance: { ...DEFAULT_APPEARANCE, hair: 3, hairColor: 5, shirt: '806ad8', pants: 5, hat: 7, back: 2 },
        };
        this.multiplayer.previewPeer(previewPeer, (15.5) * TILE, (18.5) * TILE);
        this.time.delayedCall(500, () => this.multiplayer.previewChat(previewPeer.userId, '안녕! 오늘 골목도 같이 둘러볼래요?'));
      }
      if (params.has('hunt') || params.has('forest-observe')) {
        const zone = ISO_HUNT_ZONES[0];
        if (zone) {
          this.worldPos = { x: (zone.tx + 1.4) * TILE, y: (zone.ty + 2.5) * TILE };
          this.syncPlayerVisual(0);
        }
      }
      if (params.has('customize')) {
        const previewAppearance = params.has('customize-art')
          ? normalizeAppearance({
            ...this.peer.appearance,
            eyeStyle: 5, mouthStyle: 2, faceDetail: 4,
            topStyle: 5, topPattern: 3, bottomStyle: 3, sockStyle: 4,
            shirt: 'e86ab0', accent: 'f2d85c', back: 4,
          })
          : this.peer.appearance;
        this.time.delayedCall(120, () => this.customize.open(previewAppearance, params.has('lookbook') ? 'lookbook' : undefined));
      }
      if (params.has('home')) {
        const home = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'home');
        // 방에서 돌아온 뒤 같은 개발 훅이 재실행되지 않도록 1회성으로 소비한다.
        params.delete('home');
        history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
        if (home) this.time.delayedCall(120, () => this.activate(home));
      }
    }

    const cam = this.cameras.main;
    const mapPixelW = (ISO_VILLAGE_W + ISO_VILLAGE_H) * (ISO_METRICS.tileWidth / 2);
    const mapPixelH = (ISO_VILLAGE_W + ISO_VILLAGE_H) * (ISO_METRICS.tileHeight / 2);
    cam.setBounds(-mapPixelW / 2 - 260, -260, mapPixelW + 520, mapPixelH + 650);
    cam.setZoom(window.innerWidth < 700 ? 1.05 : 1.45);
    cam.startFollow(this.player, true, 0.12, 0.12, 0, 55);

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    const movementHint = isTouchDevice() ? '빈 곳을 누른 채 끌어 이동' : 'WASD 이동';
    this.hint.textContent = showWelcomeRoute
      ? `처음 오셨나요? 금빛 발자국을 따라 모험 일지로 가보세요 · ${movementHint}`
      : `아이소메트릭 메인 월드 · ${movementHint} · 동쪽 보랏빛 외곽숲에서는 가까운 몬스터를 자동 공격해요`;
    document.body.appendChild(this.hint);
    void this.loadAccountState();
    this.refreshProgress();
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('level-up-preview')) {
      this.time.delayedCall(280, () => {
        const base = villageJourneySummary(this.questStore.views(), lifeMasteryViews(this.questStore.get())).level;
        const speciesId = this.petStore.activeId();
        this.hud.previewVillageLevelUp(
          {
            ...base,
            level: 30,
            title: villageTitle(30),
            nextMilestone: VILLAGE_LEVEL_MILESTONES.find((milestone) => milestone.level > 30) ?? null,
          },
          {
            appearance: this.peer.appearance,
            pet: speciesId ? { speciesId, accessory: this.petStore.accessory(speciesId) } : null,
          },
        );
      });
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('milestone-preview')) {
      this.time.delayedCall(500, () => this.hud.showQuestMilestone({
        id: 'dev:milestone-preview',
        category: 'story',
        eyebrow: 'STORY ARCHIVED',
        title: '골목에 남은 첫 번째 약속',
        description: '하늘과 나눈 인사와 작은 앙코르가 마을 이야기 한 장으로 보존됐어요.',
        progressLabel: '3 / 3 · 영구 기록',
        rewardLabel: '골목 뮤지션 배지',
        badge: null,
        next: {
          id: 'story_neighbors',
          name: '안부가 쌓이는 마을',
          description: '이름 있는 주민들과 천천히 인사를 나눠요.',
          location: '마을 곳곳의 주민 이름표',
        },
        extraCount: 2,
        extraTitles: ['첫 버스킹 기록', '하늘의 두 번째 인사'],
      }));
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('resident-dialogue-preview')) {
      this.time.delayedCall(500, () => {
        const resident = RESIDENTS.find((candidate) => candidate.id === 'haneul');
        if (!resident) return;
        this.openExclusive(() => this.residentQuestDialogue.open(resident, {
          questId: 'story_resident_haneul_bond',
          title: '하늘의 두 번째 인사',
          description: '하늘과 안부를 나누며 신뢰도 30을 기록하기',
          location: '메인 스트리트 · 하늘의 이름표 근처',
          rewardLabel: '하늘의 리듬 배지',
          registryKey: 'resident_haneul_trust',
          progress: 15,
          goal: 30,
          tone: 'progress',
          mark: '↗',
          shortLabel: '진행',
          target: { type: 'resident', residentId: 'haneul' },
          priority: 335,
        }));
      });
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('secrets-preview')) {
      for (const secret of ALLEY_SECRETS.filter((entry) => entry.chapterId === 'first-door')) {
        this.alleySecretStore.discover(secret.id);
      }
      this.alleySecretStore.discover('late-receipt');
      if (this.alleySecretStore.get().featuredChapterId !== 'first-door') {
        this.alleySecretStore.feature('first-door');
      }
      this.syncAlleySecretMetrics();
      this.time.delayedCall(500, () => this.openExclusive(() => this.alleySecrets.open('late-receipt')));
    }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('secret-world')) {
      const secret = ALLEY_SECRETS.find((entry) => entry.id === 'record-sticker');
      if (secret) {
        this.worldPos = { x: (secret.tx + 2.8) * TILE, y: (secret.ty + 0.5) * TILE };
        this.syncPlayerVisual(0);
        this.updateAlleySecretMarkers();
      }
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    performanceComfort.recordFrame(delta);
    const quality = performanceComfort.profile();
    this.atmosphereFx?.update(
      delta,
      playComfort.reducedMotion(),
      quality.decorativeFx ? quality.ambientMotion || 1 : 0.38,
    );
    const uiPaused = this.combatUiPaused();
    const touch = this.touch?.getInput();
    const requestedInput: MoveInput = {
      up: this.keys.W.isDown || !!touch?.up, down: this.keys.S.isDown || !!touch?.down,
      left: this.keys.A.isDown || !!touch?.left, right: this.keys.D.isDown || !!touch?.right,
    };
    const screenInput: MoveInput = uiPaused
      ? { up: false, down: false, left: false, right: false }
      : requestedInput;
    const worldInput = screenInputToWorld(screenInput);
    this.worldPos = stepPlayer(this.worldPos, worldInput, delta, this.grid, { hw: 8, hh: 8 });
    this.updateFacing(screenInput);
    const moving = screenInput.up || screenInput.down || screenInput.left || screenInput.right;
    const animKey = `${this.charKey}-walk-${this.facing}`;
    if (moving) {
      if (this.player.anims.currentAnim?.key !== animKey || !this.player.anims.isPlaying) this.player.play(animKey);
    } else if (this.player.anims.isPlaying) {
      this.player.stop(); this.player.setFrame(this.facing * FRAMES_PER_DIR);
    }
    this.syncPlayerVisual(delta);
    this.multiplayer.update(delta, this.worldPos, this.facing);
    for (const [owner, bubble] of this.worldBubbles) {
      if (!owner.active) { bubble.destroy(); this.worldBubbles.delete(owner); }
      else bubble.setPosition(owner.x, owner.y - 54).setDepth(owner.depth + 900);
    }
    if (!uiPaused) {
      this.residents.update(this.worldPos.x, this.worldPos.y);
      this.hunt.update(delta);
    }
    this.updateRecovery(delta);
    this.updateBattleHud();
    if (!uiPaused) this.updateCollectionGuide();
    this.updateAlleySecretMarkers();
    if (!uiPaused) {
      this.checkActivity();
      this.checkDistrict();
    }
  }

  private drawActivitySpots(): void {
    for (const spot of ISO_VILLAGE_ACTIVITIES) {
      const p = projectIso(spot.tx + 0.5, spot.ty + 0.5);
      const depth = isoDepth({ tx: spot.tx, ty: spot.ty, w: 1, h: 1 }, 600);
      const icon = this.add.text(p.x, p.y - 13, spot.emoji, { fontSize: '17px' }).setOrigin(0.5, 1).setDepth(depth);
      this.add.text(p.x, p.y + 12, spot.label, {
        fontFamily: UI_FONT, fontSize: '8px', color: '#fff4d4', backgroundColor: '#684622dd',
        padding: { x: 3, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 0).setDepth(depth + 1);
      this.activityTweens.push(this.tweens.add({
        targets: icon, y: icon.y - 5, duration: 720, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }));
    }
  }

  private drawAlleySecretMarkers(): void {
    const discovered = new Set(this.alleySecretStore.get().discoveredIds);
    for (const secret of ALLEY_SECRETS) {
      const p = projectIso(secret.tx + 0.5, secret.ty + 0.5);
      const depth = isoDepth({ tx: secret.tx, ty: secret.ty, w: 1, h: 1 }, 635);
      const known = discovered.has(secret.id);
      const shadow = this.add.ellipse(0, 8, 23, 8, 0x1a1514, 0.36);
      const paper = this.add.graphics();
      paper.fillStyle(known ? 0xe7d19a : 0x342e35, 0.98);
      paper.fillTriangle(0, -10, 10, 0, 0, 10);
      paper.fillTriangle(0, -10, -10, 0, 0, 10);
      paper.lineStyle(1, known ? 0x6f5a3e : 0xd8b96f, 1);
      paper.strokePoints([{ x: 0, y: -10 }, { x: 10, y: 0 }, { x: 0, y: 10 }, { x: -10, y: 0 }], true);
      const mark = this.add.text(0, -1, known ? secret.mark : '…', {
        fontFamily: UI_FONT, fontSize: '8px', color: known ? '#4f3a29' : '#f1d189',
        fontStyle: 'bold', resolution: TEXT_RES,
      }).setOrigin(0.5).setName('secret-mark');
      const glint = this.add.text(9, -12, '·', {
        fontFamily: UI_FONT, fontSize: '11px', color: '#ffe8a2', fontStyle: 'bold', resolution: TEXT_RES,
      }).setOrigin(0.5);
      const marker = this.add.container(p.x, p.y - 17, [shadow, paper, mark, glint])
        .setDepth(depth)
        .setSize(30, 34)
        .setInteractive({ useHandCursor: true });
      marker.on('pointerdown', () => this.interactAlleySecret(secret));
      marker.on('pointerover', () => marker.setScale(1.1));
      marker.on('pointerout', () => marker.setScale(1));
      this.activityTweens.push(this.tweens.add({
        targets: glint, y: glint.y - 4, alpha: 0.25, duration: 760,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      }));
      this.alleySecretMarkers.set(secret.id, marker);
    }
    this.updateAlleySecretMarkers();
  }

  private updateAlleySecretMarkers(): void {
    if (!this.alleySecretStore) return;
    const discovered = new Set(this.alleySecretStore.get().discoveredIds);
    for (const secret of ALLEY_SECRETS) {
      const marker = this.alleySecretMarkers.get(secret.id);
      if (!marker) continue;
      const dx = this.worldPos.x - (secret.tx + 0.5) * TILE;
      const dy = this.worldPos.y - (secret.ty + 0.5) * TILE;
      const known = discovered.has(secret.id);
      const range = (known ? 2.6 : 5.2) * TILE;
      const guided = this.collectionGuide?.signature === `secret:${secret.id}`;
      marker.setVisible(guided || dx * dx + dy * dy <= range * range);
      const mark = marker.getByName('secret-mark') as Phaser.GameObjects.Text | null;
      if (mark) mark.setText(known ? secret.mark : '…');
    }
  }

  private interactAlleySecret(secret: AlleySecretDef): void {
    const dx = this.worldPos.x - (secret.tx + 0.5) * TILE;
    const dy = this.worldPos.y - (secret.ty + 0.5) * TILE;
    if (dx * dx + dy * dy <= (2.2 * TILE) ** 2) this.discoverAlleySecret(secret.id);
    else this.navigateAlleySecret(secret.id);
  }

  private createWorldQuestMarker(
    signal: WorldQuestSignal, x: number, y: number, depth: number,
  ): Phaser.GameObjects.Container {
    const palette = {
      tracked: { border: 0xf2cf72, fill: 0x3f3128, text: '#fff0b0' },
      reward: { border: 0x94cf9a, fill: 0x283b31, text: '#d9f4d9' },
      progress: { border: 0x86aaba, fill: 0x293743, text: '#dceef4' },
      available: { border: 0xe1b982, fill: 0x423228, text: '#ffe6c1' },
    }[signal.tone];
    const text = this.add.text(0, 0, `${signal.mark} ${signal.shortLabel}`, {
      fontFamily: UI_FONT,
      fontSize: '7px',
      color: palette.text,
      align: 'center',
      padding: { x: 2, y: 1 },
      resolution: TEXT_RES,
    }).setOrigin(0.5);
    const width = Math.max(34, Math.ceil(text.width) + 10);
    const height = 17;
    const background = this.add.graphics();
    background.fillStyle(0x1d1714, 0.35).fillRoundedRect(-width / 2 - 2, -height / 2 + 2, width + 4, height + 3, 5);
    background.fillStyle(palette.fill, 0.96).fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    background.lineStyle(1, palette.border, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    background.fillStyle(palette.border, 1).fillTriangle(-3, height / 2, 3, height / 2, 0, height / 2 + 5);
    const marker = this.add.container(x, y, [background, text])
      .setDepth(depth)
      .setSize(width, height + 5)
      .setInteractive({ useHandCursor: true });
    marker.on('pointerdown', () => this.followWorldQuestSignal(signal));
    marker.on('pointerover', () => marker.setScale(1.08));
    marker.on('pointerout', () => marker.setScale(1));
    return marker;
  }

  private refreshWorldQuestMarkers(views = this.questStore.views()): void {
    if (!this.residents) return;
    const signals = worldQuestSignals(views, this.questStore.focusedQuestId(), this.residents.getTrust());
    this.residentQuestSignals = new Map(signals.residents.flatMap((signal) => (
      signal.target.type === 'resident' ? [[signal.target.residentId, signal] as const] : []
    )));
    const signature = worldQuestSignalSignature(signals);
    if (signature === this.worldQuestMarkersSignature) return;
    for (const marker of this.worldQuestMarkers) marker.destroy();
    this.worldQuestMarkers.length = 0;
    for (const marker of this.alleySecretMarkers.values()) marker.destroy();
    this.alleySecretMarkers.clear();
    this.worldQuestMarkersSignature = signature;

    for (const signal of signals.activities) {
      if (signal.target.type !== 'activity') continue;
      const activityKind = signal.target.kind;
      const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === activityKind);
      if (!spot) continue;
      const p = projectIso(spot.tx + 0.5, spot.ty + 0.5);
      const depth = isoDepth({ tx: spot.tx, ty: spot.ty, w: 1, h: 1 }, 625);
      this.worldQuestMarkers.push(this.createWorldQuestMarker(signal, p.x, p.y - 52, depth));
    }
    for (const signal of signals.residents) {
      if (signal.target.type !== 'resident') continue;
      const residentId = signal.target.residentId;
      const placement = ISO_RESIDENT_PLACEMENTS.find((candidate) => candidate.residentId === residentId);
      if (!placement) continue;
      const p = projectIso(placement.tx + 0.5, placement.ty + 0.5);
      const depth = isoDepth({ tx: placement.tx, ty: placement.ty, w: 1, h: 1 }, 438);
      this.worldQuestMarkers.push(this.createWorldQuestMarker(signal, p.x, p.y - 70, depth));
    }
  }

  private followWorldQuestSignal(signal: WorldQuestSignal): void {
    if (signal.tone === 'reward') {
      this.openExclusive(() => this.openQuests('daily'));
      this.showToast(`${signal.title} · 오늘 탭에서 준비된 보상을 받아 보세요.`);
      audio.playSe('success');
      return;
    }
    if (signal.target.type === 'resident') {
      this.openResidentQuestDialogue(signal.target.residentId, signal);
      audio.playSe('click');
      return;
    }
    this.focusQuest(signal.questId);
    if (signal.target.kind === 'quest' && !villageRequestDestinationForMetric(signal.registryKey)) {
      this.openExclusive(() => this.openQuests());
      this.showToast(`${signal.title} · 모험 일지에서 다음 단서를 확인해 보세요.`);
      audio.playSe('click');
      return;
    }
    this.navigateVillageRequestMetric(signal.registryKey, signal.title);
  }

  private openResidentQuestDialogue(
    residentId: string,
    signal = this.residentQuestSignals.get(residentId),
  ): void {
    const resident = RESIDENTS.find((candidate) => candidate.id === residentId);
    if (!resident) return;
    if (signal) {
      this.openExclusive(() => this.residentQuestDialogue.open(resident, signal));
      return;
    }
    this.openExclusive(() => this.residentsPanel.openResident(
      this.residents.getTrust(), residentId, 'stories',
    ));
    this.showToast(`${resident.name}의 주민 수첩을 펼쳤어요.`);
  }

  private applyPerformanceComfort(): void {
    const profile: QualityProfile = performanceComfort.profile();
    const reducedMotion = playComfort.reducedMotion();
    const worldProfile = reducedMotion
      ? { ...profile, ambientMotion: 0, decorativeFx: false }
      : profile;
    this.hunt?.setQuality(worldProfile);
    this.residents?.setAmbientMotion(worldProfile.ambientMotion);
    this.ring?.setAlpha(profile.shadowAlpha);
    this.cameras.main.roundPixels = true;
    for (const tween of this.activityTweens) {
      if (worldProfile.ambientMotion <= 0) tween.pause();
      else {
        tween.resume();
        tween.timeScale = worldProfile.ambientMotion;
      }
    }
  }

  private setupPointer(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tile = pickIsoTile(p.x, p.y);
      if (tile.tx >= 0 && tile.ty >= 0 && tile.tx < ISO_VILLAGE_W && tile.ty < ISO_VILLAGE_H) drawIsoTileHighlight(this.highlight, tile.tx, tile.ty);
      else this.highlight.clear();
    });
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.pet?.contains(p.x, p.y)) void this.petActive();
    });
  }

  private setupPanels(): void {
    const toggle = (open: boolean) => {
      this.input.keyboard!.enabled = !open;
      // DOM 메뉴 뒤의 월드 포인터를 함께 잠가 주민·펫·활동 지점 클릭이 새어 나가지 않게 한다.
      this.input.enabled = !open;
    };
    this.villageSearch = new VillageSearchPanel({
      onToggle: toggle,
      getQuestViews: () => this.questStore.views(),
      onOpen: () => this.bump('village_search_open'),
      onSelect: (action, result) => this.navigateVillageSearch(action, result),
    });
    this.adventureRolePanel = new AdventureRolePanel(this.adventureRoleStore, {
      onToggle: toggle,
      getLevel: () => this.battleStore.level,
      onChanged: (progress) => {
        this.writeAdventureRoleMetrics(progress);
        this.updateBattleHud();
        this.refreshProgress();
        this.showToast('원정 역할과 부적 조합을 바꿨어요. 장비와 레벨은 그대로예요.');
      },
    });
    this.writeAdventureRoleMetrics(this.adventureRolePanel.progress());
    this.quests = new QuestPanel(this.peer.userId, {
      online: !!this.sb, onToggle: toggle,
      onClaim: (id) => void this.claimQuest(id), onEquipBadge: (id) => this.equipBadge(id),
      onFocus: (id) => this.focusQuest(id),
      requestBoard: this.requestBoardStore,
      festivalArchive: this.festivalArchiveStore,
      getQuestState: () => this.questStore.get(),
      getAppearance: () => this.peer.appearance,
      getPet: () => {
        const speciesId = this.petStore.activeId();
        return speciesId ? { speciesId, accessory: this.petStore.accessory(speciesId) } : null;
      },
      getResidentTrust: () => this.residents.getTrust(),
      onRequestChanged: (progress) => this.handleRequestBoardChanged(progress),
      onFestivalChanged: () => { this.syncFestivalMetrics(); this.refreshProgress(); },
      onChronicleChanged: (progress) => { this.writeChronicleMetrics(progress); this.refreshProgress(); },
      onLifeSpecialtyChanged: (progress) => {
        this.writeLifeSpecialtyMetrics(progress);
        this.refreshProgress();
        const synergy = progress.currentSynergyId ? LIFE_SYNERGY_BY_ID.get(progress.currentSynergyId) : null;
        this.showToast(synergy
          ? `생활 시너지 「${synergy.title}」이(가) 완성됐어요. 발견 기록은 조합을 바꿔도 남아요.`
          : '대표 생활 전문성을 바꿨어요. 숙련과 발견 기록은 그대로예요.');
      },
      onDailyInvitationsChanged: (progress) => {
        this.writeDailyInvitationMetrics(progress);
        this.refreshProgress();
        this.showToast('생활 초대장 기록을 마을 수첩에 보존했어요.');
      },
      onSessionPlannerChanged: (progress) => {
        this.writeSessionPlannerMetrics(progress);
        this.refreshProgress();
        this.showToast(progress.archivedPages > 0
          ? `오늘의 플레이 큐 기록 ${progress.archivedPages}장을 모험 일지에 보존했어요.`
          : `오늘의 플레이 큐 ${progress.slots}/3칸을 정리했어요.`);
      },
      onFanMerchChanged: (progress) => {
        this.writeFanMerchMetrics(progress);
        this.refreshProgress();
        this.showToast(`최애 굿즈 ${progress.savedSlots}/12칸 · 영구 디자인 ${progress.discoveries}종`);
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
        this.refreshProgress();
        this.showToast(progress.featured
          ? '환영 기념품을 나의 첫 생활 표식으로 전시했어요.'
          : '환영 편지와 기념품 기록을 새 이웃 수첩에 반영했어요.');
      },
      onVillageLevelMemoriesChanged: (progress) => {
        for (const [key, value] of Object.entries(villageLevelMemoryMetrics(progress))) {
          this.questStore.setMetric(key, value);
        }
        this.refreshProgress();
        this.showToast('레벨업 장면을 앨범에 보존했어요. 보상과 다른 진행은 그대로예요.');
      },
      onRequestNavigate: (metric, title) => this.navigateVillageRequestMetric(metric, title),
      onOpenVillageReward: (target) => this.openVillageReward(target),
    });
    this.writeChronicleMetrics(this.quests.chronicleProgress());
    this.syncLifeSpecialtyMetrics();
    this.syncDailyInvitationMetrics();
    this.writeSessionPlannerMetrics(this.quests.sessionPlannerProgress());
    this.writeFanMerchMetrics(this.quests.fanMerchProgress());
    this.starterConcierge = new StarterConciergeDock(this.peer.userId, {
      getQuestState: () => this.questStore.get(),
      getSelectedRouteId: () => this.quests.starterCompassSelectedRouteId(),
      onSelectRoute: (routeId) => {
        this.quests.selectStarterCompassRoute(routeId);
        this.starterConcierge?.refresh();
      },
      onNavigate: (metric, title) => this.navigateVillageRequestMetric(metric, title),
      onOpenJournal: () => this.openExclusive(() => this.openQuests()),
    });
    this.photoBooth = new PhotoBoothPanel(this.photoAlbum, {
      onToggle: toggle,
      onSaved: (record) => this.handlePhotoSaved(record),
      onDeleted: () => { this.syncPhotoMetrics(); this.refreshProgress(); },
      onCardsChanged: () => {
        this.syncPhotoMetrics();
        this.refreshProgress();
        this.showToast('포토카드 꾸밈과 최애 전시가 영구 기록됐어요.');
      },
    });
    this.gardenPanel = new GardenPanel(this.gardenStore, {
      onToggle: toggle,
      onChanged: () => {
        this.syncGardenMetrics();
        this.refreshProgress();
        this.showToast('정원 기록이 모험 일지에 반영됐어요.');
      },
      onOpenKitchen: () => this.openExclusive(() => this.cookingPanel.open()),
    });
    this.cookingPanel = new CookingPanel(this.cookingStore, this.gardenStore, {
      onToggle: toggle,
      onChanged: () => {
        this.syncCookingMetrics();
        this.refreshProgress();
        this.showToast('새 접시가 레시피 수첩에 기록됐어요.');
      },
      onOpenGarden: () => this.openExclusive(() => this.gardenPanel.open()),
    });
    this.fishingPanel = new FishingPanel(this.fishingStore, {
      onToggle: toggle,
      onChanged: () => {
        this.syncFishingMetrics();
        this.refreshProgress();
        this.showToast('새 물가 기록이 낚시 수첩에 반영됐어요.');
      },
    });
    this.customize = new CustomizePanel(this.peer.appearance, {
      onChange: (a) => this.applyAppearance(a, false), onSave: (a) => this.applyAppearance(a, true), onToggle: toggle,
      closet: this.closetStore, lookbook: this.lookbookStore, characterZine: this.characterZineStore,
      getUnlockedBadgeIds: () => this.achievementStore.get().unlocked,
      getQuestState: () => this.questStore.get(),
      onWardrobeAction: (action) => {
        if (action === 'slot_feature' || action === 'slot_update') { this.syncClosetMetrics(); this.syncVillageProfileMetrics(); this.refreshProgress(); return; }
        this.bump(action === 'slot_save' ? 'closet_save' : action === 'slot_load' ? 'closet_load' : action === 'preset' ? 'fashion_preset' : 'fashion_dye');
        if (action === 'slot_save') { this.syncClosetMetrics(); this.syncVillageProfileMetrics(); }
      },
      onLookbookChanged: (progress) => this.handleLookbookChanged(progress),
      onCharacterZineChanged: () => {
        this.syncCharacterZineMetrics();
        this.syncVillageProfileMetrics();
        this.refreshProgress();
      },
      onCharacterEpisodeNavigate: (metric, title) => this.navigateVillageRequestMetric(metric, title),
      onCharacterEpisodeReplay: (card, episode) => {
        this.applyAppearance(card.appearance, true);
        this.navigateVillageRequestMetric(episode.requirements[0]!.key, `${card.name} · ${episode.title}`);
        this.showToast(`${card.name}의 저장 외형으로 갈아입고 에피소드 장소를 다시 찾아가요.`);
      },
    });
    this.tasteShowcase = new TasteShowcasePanel(this.tasteShowcaseStore, this.lookbookStore, {
      onToggle: toggle,
      getContext: () => ({ ...this.tasteShowcaseContext(), appearance: this.peer.appearance, unlockedBadgeIds: this.achievementStore.get().unlocked }),
      onChanged: () => {
        this.syncLookbookMetrics();
        this.syncTasteShowcaseMetrics();
        this.refreshProgress();
      },
      onOpenAtelier: () => this.openExclusive(() => this.customize.open(this.peer.appearance, 'lookbook')),
      onOpenHome: () => {
        const home = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'home');
        if (home) this.activate(home);
      },
      onOpenPet: () => this.openExclusive(() => this.petShop.open(this.petStore, this.coins, !!this.sb)),
    });
    this.hobbyClubs = new HobbyClubPanel(this.hobbyClubStore, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      getAppearance: () => this.peer.appearance,
      getPet: () => {
        const speciesId = this.petStore.activeId();
        return speciesId ? { speciesId, accessory: this.petStore.accessory(speciesId) } : null;
      },
      onChanged: (progress, result) => {
        this.writeHobbyClubMetrics(progress);
        this.refreshProgress();
        if (result.ok) this.showToast(`골목 동아리 「${result.chapter.pageTitle}」 페이지를 발간했어요.`);
      },
      onFanChanged: (progress) => {
        this.writeHobbyClubMetrics(progress);
        this.refreshProgress();
      },
      onReplay: (club) => this.showToast(`${club.room.roomName}에서 내 캐릭터와 동행의 장면을 다시 남겼어요.`),
      onNavigate: (condition) => this.navigateHobbyClubCondition(condition),
    });
    this.communityProjects = new CommunityProjectPanel(this.communityProjectStore, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      onChanged: (progress, result) => {
        this.writeCommunityProjectMetrics(progress);
        this.refreshCommunityProjectVisual();
        this.refreshProgress();
        if (result.ok) this.showToast(`함께짓기 「${result.phase.name}」 단계가 마을에 반영됐어요.`);
      },
      onNavigate: (contribution) => this.navigateCommunityContribution(contribution),
      onOpenShared: () => this.openExclusive(() => this.sharedVillageProject.open()),
    });
    const sharedDebug = import.meta.env.DEV && new URLSearchParams(location.search).has('shared-project-ready');
    this.sharedVillageProject = new SharedVillageProjectPanel(this.sharedVillageProjectStore.view(), {
      online: !!this.sb || sharedDebug,
      onToggle: toggle,
      onLoad: () => this.refreshSharedVillageProject(),
      onContribute: (kind) => this.contributeToSharedVillageProject(kind, sharedDebug),
      onChanged: (view) => this.handleSharedVillageProjectChanged(view),
    });
    this.neighborhoodTours = new NeighborhoodTourPanel(this.neighborhoodTourStore, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      onChanged: (progress, result) => {
        this.writeNeighborhoodTourMetrics(progress);
        this.refreshProgress();
        if (result.ok) this.showToast(`골목 소풍 「${result.tour.postcardTitle}」 엽서를 기록했어요.`);
      },
      onNavigate: (stop) => this.navigateNeighborhoodTourStop(stop),
    });
    this.neighborhoodMuseum = new NeighborhoodMuseumPanel(this.neighborhoodMuseumStore, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      onChanged: (progress, result) => {
        this.writeNeighborhoodMuseumMetrics(progress);
        this.refreshProgress();
        if (typeof result !== 'string' && result.ok) this.showToast(`작은 박물관에 「${result.exhibit.objectName}」을(를) 보존했어요.`);
      },
      onNavigate: (requirement) => this.navigateMuseumRequirement(requirement),
    });
    this.neighborhoodMarket = new NeighborhoodMarketPanel(this.neighborhoodMarketStore, {
      userId: this.peer.userId,
      online: !!this.sb,
      onToggle: toggle,
      getInventory: () => this.inventory,
      getCoins: () => this.coins,
      loadListings: () => this.sb ? fetchMarketListings(this.sb, this.peer.userId) : Promise.resolve([]),
      loadSummary: () => this.sb ? fetchMarketSummary(this.sb) : Promise.resolve({
        listingsCreated: 0, purchases: 0, sales: 0, uniqueItemIds: [], categories: [],
      }),
      createListing: (itemId, tier) => this.createNeighborhoodMarketListing(itemId, tier),
      cancelListing: (listingId) => this.cancelNeighborhoodMarketListing(listingId),
      buyListing: (listingId) => this.buyNeighborhoodMarketListing(listingId),
      previewForItem: (itemId) => furnitureWorkshopPreview(this, itemId),
      onChanged: (progress, result) => {
        this.writeNeighborhoodMarketMetrics(progress);
        if (result?.ok) this.showToast('골목 나눔장터 기록과 소지품을 안전하게 갱신했어요.');
        this.refreshProgress();
      },
    });
    this.writeNeighborhoodMarketMetrics(this.neighborhoodMarket.progress());
    this.petStyleStudio = new PetStyleStudioPanel(this.petStyleStudioStore, {
      onToggle: toggle,
      onApply: (draft) => this.applyPetStyle(draft),
      onChanged: (progress) => {
        this.writePetStyleMetrics(progress);
        this.syncVillageProfileMetrics();
        this.refreshProgress();
      },
    });
    this.writePetStyleMetrics(this.petStyleStudioStore.progress());
    this.petShop = new PetShopPanel(this.peer.userId, {
      onToggle: toggle, onAdopt: (id) => void this.adopt(id), onSetActive: (id) => this.setActivePet(id),
      onFeed: (id) => void this.care(id, 'feed'), onPlay: (id) => void this.care(id, 'play'),
      onTrain: (id) => void this.care(id, 'train'), onTrick: (id, trick) => this.performTrick(id, trick),
      onRename: (id, nickname) => this.renamePet(id, nickname),
      onPersonality: (id, personality) => this.setPetPersonality(id, personality),
      onAccessory: (id, accessory) => this.setPetAccessory(id, accessory),
      onOpenStyleStudio: (id) => {
        this.petShop.close();
        this.petStyleStudio.open(this.petStore, id);
      },
      outings: this.petOutingStore,
      homeMemories: (petId) => this.petHomeMemoryStore.views(petId),
      onOutingChanged: (progress) => this.handlePetOutingChanged(progress),
      onSignalsChanged: (progress) => this.handlePetSignalsChanged(progress),
      onPerformanceChanged: (progress) => this.handlePetPerformanceChanged(progress),
    });
    this.writePetSignalMetrics(this.petShop.signalProgress());
    this.writePetPerformanceMetrics(this.petShop.performanceProgress());
    this.shop = new ShopPanel({
      buyEnabled: !!this.sb,
      previewForItem: (itemId) => furnitureWorkshopPreview(this, itemId),
      onToggle: toggle,
      onBuy: (itemId) => this.buyFurniture(itemId),
      onSell: (itemId) => this.sellFurniture(itemId),
      onCraft: (recipeId) => this.craftFurnitureRecipe(recipeId),
    });
    this.cafe = new CafePanel({ onToggle: toggle, onComplete: () => { this.bump('q_cafe'); this.showToast('카페 알바 완료! ☕'); } });
    this.busking = new BuskingPanel({ onToggle: toggle, onComplete: () => { this.bump('q_busking'); this.showToast('골목에 앙코르가 울려요! 🎸'); } });
    this.alleySecrets = new AlleySecretPanel(this.alleySecretStore, {
      onToggle: toggle,
      onNavigate: (secretId) => this.navigateAlleySecret(secretId),
      onChanged: (progress) => {
        this.writeAlleySecretMetrics(progress);
        this.refreshProgress();
        this.mapPanel?.refresh();
      },
    });
    this.atmospherePanel = new NeighborhoodAtmospherePanel(this.atmosphereStore, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      onChanged: (progress) => {
        this.writeNeighborhoodAtmosphereMetrics(progress);
        this.refreshProgress();
      },
      onReplay: (id) => {
        if (this.atmosphereFx.activeId === id) this.atmosphereFx.replay();
        else this.atmosphereFx.set(id);
        const atmosphere = this.atmosphereStore.active();
        this.showToast(`하 ${atmosphere.name} · 골목 규칙은 그대로, 빛과 날씨만 바뀌었어요.`);
      },
      onNavigate: (requirement) => this.navigateNeighborhoodAtmosphereRequirement(requirement),
    });
    this.mapPanel = new IsometricMapPanel({
      onToggle: toggle,
      onOpen: () => this.bump('open_map'),
      getPlayerTile: () => worldToTile(this.worldPos.x, this.worldPos.y),
      getDistricts: () => this.districtStore.views(),
      getSecrets: () => this.alleySecretStore.views(),
      onNavigateDistrict: (id) => this.navigateNeighborhoodDistrict(id),
      onFeatureDistrict: (id) => this.featureNeighborhoodDistrict(id),
      onOpenSecrets: () => this.openExclusive(() => this.alleySecrets.open()),
      onOpenAtmospheres: () => this.openExclusive(() => this.atmospherePanel.open()),
    });
    this.bag = new BagPanel({ online: !!this.sb, onToggle: toggle });
    this.dex = new CollectionPanel(this.peer.userId, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      getUnlockedBadgeIds: () => this.achievementStore.get().unlocked,
      getOwnedPetIds: () => this.petStore.owned(),
      onNavigateTarget: (signature) => this.navigateCollectionTarget(signature),
      onOpenTasteSet: (target, setId) => this.openTasteSetTarget(target, setId),
      onTasteSetsChanged: (progress) => { this.writeTasteSetMetrics(progress); this.refreshProgress(); },
      onShelfChanged: (progress) => { this.writeCollectionShelfMetrics(progress); this.refreshProgress(); },
    });
    this.treasure = new TreasurePanel(this.treasureStore, { onToggle: toggle, onCraft: () => { this.bump('treasure_crafted'); this.questStore.setMetric('treasures_owned', this.treasureStore.progress().owned); this.refreshProgress(); } });
    const residentPortraits = this.bakePortraits();
    this.residentQuestDialogue = new ResidentQuestDialoguePanel(residentPortraits, {
      onToggle: toggle,
      onTrack: (questId) => this.focusQuest(questId),
      onOpenBook: (residentId) => this.openExclusive(() => (
        this.residentsPanel.openResident(this.residents.getTrust(), residentId, 'stories')
      )),
    });
    this.residentsPanel = new ResidentsPanel(this.peer.userId, residentPortraits, {
      onToggle: toggle,
      getQuestState: () => this.questStore.get(),
      getPlayerAppearance: () => this.peer.appearance,
      getActivePet: () => {
        const id = this.petStore.activeId();
        return id ? { speciesId: id, name: this.petStore.displayName(id), accessory: this.petStore.accessory(id) } : null;
      },
      onNavigate: (metric, title) => this.navigateVillageRequestMetric(metric, title),
      onRendezvousChanged: (progress) => { this.writeResidentRendezvousMetrics(progress); this.refreshProgress(); },
      onLettersChanged: (progress) => { this.writeResidentLetterMetrics(progress); this.refreshProgress(); },
      onFanbookChanged: (progress) => { this.writeResidentFanbookMetrics(progress); this.refreshProgress(); },
      onRoomCareChanged: (progress) => { this.writeResidentRoomCareMetrics(progress); this.refreshProgress(); },
    });
    this.writeResidentRoomCareMetrics(this.residentsPanel.roomCareProgress());
    this.profilePanel = new VillageProfilePanel(this.peer.userId, {
      onToggle: toggle,
      online: !!this.adapter || (import.meta.env.DEV && new URLSearchParams(location.search).has('peer-profile')),
      getSelfContext: () => this.villageProfileContext(),
      onOpenAtelier: () => this.openExclusive(() => this.customize.open(this.peer.appearance, 'closet')),
      onOpenCharacterZine: () => this.openExclusive(() => this.customize.open(this.peer.appearance, 'zine')),
      onOpenSpecialties: () => this.openExclusive(() => this.openQuests('growth')),
      onOpenPhotoBooth: () => this.openExclusive(() => this.openPhotoBooth()),
      onOpenPetStyleStudio: () => this.openExclusive(() => {
        const id = this.petStore.activeId() ?? this.petStore.owned()[0] ?? null;
        if (id) this.petStyleStudio.open(this.petStore, id);
        else this.petShop.open(this.petStore, this.coins, !!this.sb);
      }),
      onViewPetStyleCards: () => this.bump('pet_style_profile_views'),
      onSendNeighborCheer: (peer, kind) => this.sendNeighborCheer(peer, kind),
      onSendPetMeet: (peer, kind) => this.sendPetMeet(peer, kind),
      onVisitNeighborHome: (peer) => this.visitNeighborHome(peer),
      onNeighborHomeTourChanged: (progress) => {
        this.writeNeighborHomeTourMetrics(progress);
        this.refreshProgress();
      },
      onNeighborCheerChanged: (progress) => {
        this.writeNeighborCheerMetrics(progress);
        this.refreshProgress();
      },
      onPetMeetChanged: (progress) => {
        this.writePetMeetMetrics(progress);
        this.refreshProgress();
      },
      onChanged: (profile) => {
        this.peer.profile = profile;
        this.questStore.setMetric('village_profile_customized', 1);
        this.questStore.setMetric('village_profile_badges', profile.showcasedBadges.length);
        void this.adapter?.updateSelf(this.peer);
        this.refreshProgress();
      },
    });
    this.peer.profile = this.profilePanel.publicSnapshot();
    this.syncNeighborCheerMetrics();
    this.syncNeighborHomeTourMetrics();
    this.syncPetMeetMetrics();
    this.rankingPanel = new RankingPanel({
      online: !!this.sb, myId: this.peer.userId, onToggle: toggle,
      fetchRows: () => this.sb ? fetchRanking(this.sb) : Promise.resolve([]),
    });
    this.escHandler = (event) => {
      if (event.key !== 'Escape') return;
      if (this.emotes?.isOpen) { this.emotes.close(); event.stopPropagation(); return; }
      const open = this.overlayPanels().find((panel) => panel.isOpen); if (open) { open.close(); event.stopPropagation(); }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  private setupSocial(): void {
    this.onlineList = new OnlineList(this.peer.nickname, 'hv-online-iso', () => this.openExclusive(() => this.profilePanel.openSelf()));
    this.chatFeed = new ChatFeed();
    this.chat = new ChatInput({
      onSend: (raw) => {
        const message = sanitizeChat(raw);
        if (!message) return;
        this.showWorldBubble(this.player, message, 'me');
        this.chatFeed.push(this.peer.nickname, message, 'me');
        this.multiplayer?.sendChat(message);
        this.bump('chat_sent');
      },
      onToggle: (open) => { this.input.keyboard!.enabled = !open; },
    });
    this.emotes = new EmoteWheel((kind: EmoteKind) => {
      this.showWorldBubble(this.player, EMOTE_EMOJI[kind], 'me');
      this.multiplayer?.sendEmote(kind);
      this.bump('q_emote');
    });
    const keyboard = this.input.keyboard!;
    keyboard.on('keydown-ENTER', () => { if (!this.chat.isOpen) this.chat.open(); });
    keyboard.on('keydown-E', () => { if (!this.chat.isOpen) this.emotes.toggle(); });
  }

  private mountHud(): void {
    this.hud = this.registry.get('hud') as GameHud;
    this.hud.mountActions({
      onSearch: () => this.openExclusive(() => this.villageSearch.open()),
      onBag: () => this.openExclusive(() => this.bag.open(this.inventory)),
      onDex: () => this.openExclusive(() => this.dex.open(this.inventory)),
      onMap: () => this.openExclusive(() => this.mapPanel.open()),
      onResidents: () => this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust())),
      onRanking: () => this.openExclusive(() => this.openRanking()),
      onQuest: () => this.openExclusive(() => this.openQuests()),
      onMarket: () => this.openExclusive(() => this.openNeighborhoodMarket()),
      onJourney: () => this.openExclusive(() => this.openQuests('journey')),
      onMilestone: (notice) => {
        if (notice.category === 'daily') {
          this.openExclusive(() => this.openQuests('daily'));
          return;
        }
        if (notice.next) this.focusQuest(notice.next.id);
        this.openExclusive(() => this.openQuests());
      },
      onTreasure: () => this.openExclusive(() => this.treasure.open()),
      onGarden: () => this.openExclusive(() => this.gardenPanel.open()),
      onCooking: () => this.openExclusive(() => this.cookingPanel.open()),
      onFishing: () => this.openExclusive(() => this.fishingPanel.open()),
      onCustomize: () => this.openExclusive(() => this.customize.open(this.peer.appearance)),
      onChat: () => { if (!this.chat.isOpen) this.chat.open(); },
      onEmote: () => { if (!this.chat.isOpen) this.emotes.toggle(); },
    });
    this.hud.setCoins(this.coins);
  }

  private overlayPanels(): Array<{ isOpen: boolean; close: () => void }> {
    return [
      this.villageSearch, this.adventureRolePanel, this.quests, this.customize, this.petShop, this.petStyleStudio, this.shop, this.cafe, this.busking, this.mapPanel,
      this.alleySecrets, this.atmospherePanel,
      this.bag, this.dex, this.treasure, this.residentsPanel, this.rankingPanel, this.photoBooth,
      this.residentQuestDialogue,
      this.profilePanel,
      this.gardenPanel,
      this.cookingPanel,
      this.fishingPanel,
      this.tasteShowcase,
      this.hobbyClubs,
      this.communityProjects,
      this.sharedVillageProject,
      this.neighborhoodTours,
      this.neighborhoodMuseum,
      this.neighborhoodMarket,
    ];
  }

  /** 메뉴를 읽거나 채팅하는 동안에는 필드 전투가 완전히 멈춘다. */
  private combatUiPaused(): boolean {
    return this.overlayPanels().some((panel) => panel.isOpen)
      || !!this.chat?.isOpen
      || !!this.emotes?.isOpen;
  }

  private openExclusive(open: () => void): void {
    this.emotes?.close();
    this.chat?.close();
    for (const panel of this.overlayPanels()) if (panel.isOpen) panel.close();
    open();
  }

  private openVillageReward(target: 'outfit' | 'pet' | 'home'): void {
    if (target === 'outfit') this.openExclusive(() => this.customize.open(this.peer.appearance, 'closet'));
    else if (target === 'pet') this.openExclusive(() => this.petShop.open(this.petStore, this.coins, !!this.sb));
    else {
      this.quests.close();
      this.showToast('내 집 인테리어 수첩에서 리폼 공방을 열면 명찰·이야기 전용 레시피가 보여요.');
    }
  }

  private openTasteSetTarget(target: 'outfit' | 'pet' | 'home', setId: string): void {
    const set = TASTE_SET_BY_ID.get(setId);
    if (!set || !this.achievementStore.get().unlocked.includes(set.badgeId)) return;
    if (target === 'outfit') {
      this.openExclusive(() => this.customize.openPreset(this.peer.appearance, set.outfit.id));
      return;
    }
    if (target === 'pet') {
      const petId = this.petStore.activeId();
      if (!petId) {
        this.openExclusive(() => this.petShop.open(this.petStore, this.coins, !!this.sb));
        this.showToast('먼저 함께 걷는 동행을 골라 주세요. 세트 장식은 사라지지 않아요.');
        return;
      }
      this.setPetAccessory(petId, set.petAccessory.id);
      this.openExclusive(() => this.petShop.openProfile(this.petStore, this.coins, !!this.sb, petId));
      return;
    }
    this.openVillageReward('home');
  }

  private navigateVillageSearch(action: VillageSearchAction, result: VillageSearchResult): void {
    this.clearCollectionGuide();
    if (action.type === 'panel') {
      if (action.target === 'bag') this.openExclusive(() => this.bag.open(this.inventory));
      else if (action.target === 'guide') this.openExclusive(() => this.dex.open(this.inventory));
      else if (action.target === 'map') this.openExclusive(() => this.mapPanel.open());
      else if (action.target === 'residents') this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust()));
      else if (action.target === 'quest') this.openExclusive(() => this.openQuests());
      else if (action.target === 'market') this.openExclusive(() => this.openNeighborhoodMarket());
      else if (action.target === 'treasure') this.openExclusive(() => this.treasure.open());
      else if (action.target === 'garden') this.openExclusive(() => this.gardenPanel.open());
      else if (action.target === 'cooking') this.openExclusive(() => this.cookingPanel.open());
      else if (action.target === 'fishing') this.openExclusive(() => this.fishingPanel.open());
      else if (action.target === 'customize') this.openExclusive(() => this.customize.open(this.peer.appearance));
      else if (action.target === 'character-zine') this.openExclusive(() => this.customize.open(this.peer.appearance, 'zine'));
      else if (action.target === 'secrets') this.openExclusive(() => this.alleySecrets.open());
      else this.openExclusive(() => this.adventureRolePanel.open());
      this.showToast(`「${result.title}」을(를) 바로 열었어요.`);
      return;
    }
    if (action.type === 'district') {
      this.bump('village_search_routes');
      this.navigateNeighborhoodDistrict(action.districtId);
      return;
    }
    if (action.type === 'quest') {
      if (!action.unlocked) {
        this.openExclusive(() => this.openQuests());
        this.showToast(`「${result.title}」은(는) 선행 기록이 열리면 자동으로 시작돼요. 지금 한 활동도 소급 인정됩니다.`);
        return;
      }
      if (!action.done) this.focusQuest(action.questId);
      this.bump('village_search_routes');
      if (villageRequestDestinationForMetric(action.metric)) {
        this.navigateVillageRequestMetric(action.metric, result.title);
      } else {
        this.openExclusive(() => this.openQuests());
        this.showToast(`「${result.title}」을(를) 모험 일지에서 표시했어요.`);
      }
      return;
    }

    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = { tx: action.tx, ty: action.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장에서 다시 찾아 주세요.');
      return;
    }
    this.bump('village_search_routes');
    this.collectionGuide = {
      signature: `search:${result.id}`,
      title: result.title,
      instruction: action.type === 'resident'
        ? `${result.title}의 생활 자리 근처까지 안내할게요. 주민은 골목 안에서 조금씩 움직일 수 있어요.`
        : `${result.title}까지 실제 통행 가능한 길을 안내할게요.`,
      target,
      mode: 'activity',
      activityKind: action.type === 'activity' ? action.activityKind : undefined,
      arriveAtTarget: action.type === 'resident',
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `마을 찾기 · ${result.title} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      if (action.type === 'activity') {
        this.lastActivityId = null;
        this.checkActivity();
      } else {
        this.updateCollectionGuide();
      }
    }
  }

  private navigateCollectionTarget(signature: string): void {
    const guide = collectionWorldGuide(signature);
    if (!guide) { this.showToast('이 목표의 위치를 다시 확인하지 못했어요. 가이드북에서 다른 목표를 골라 주세요.'); return; }
    this.clearCollectionGuide();
    if (guide.mode === 'panel') {
      if (guide.panel === 'residents') this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust()));
      else if (guide.panel === 'rendezvous') this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust(), 'rendezvous'));
      else if (guide.panel === 'resident-fanbook') this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust(), 'fanbook'));
      else if (guide.panel === 'adventure-kit') this.openExclusive(() => this.adventureRolePanel.open());
      else if (guide.panel === 'profile') this.openExclusive(() => this.profilePanel.openSelf());
      else if (guide.panel === 'treasure') this.openExclusive(() => this.treasure.open());
      else if (guide.panel === 'collection-shelf') this.openExclusive(() => this.dex.openProfile(this.inventory));
      else this.openExclusive(() => this.dex.openTasteSets(this.inventory));
      this.showToast(guide.instruction);
      return;
    }

    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    let target: IsoGuideStep | null = null;
    let route: IsoGuideStep[] = [];
    if (guide.mode === 'activity') {
      const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === guide.activityKind);
      if (spot) {
        target = { tx: spot.tx, ty: spot.ty };
        route = findIsoVillageRoute(start, target);
      }
    } else {
      const candidates = ISO_HUNT_ZONES.map((zone) => ({
        tx: zone.tx,
        ty: zone.ty < ISO_VILLAGE_H / 2 ? zone.ty + zone.h - 1 : zone.ty,
      }));
      const routes = candidates.map((candidate) => ({ candidate, route: findIsoVillageRoute(start, candidate) }))
        .filter((candidate) => candidate.route.length > 0)
        .sort((a, b) => a.route.length - b.route.length);
      target = routes[0]?.candidate ?? null;
      route = routes[0]?.route ?? [];
    }
    if (!target || route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: guide.signature,
      title: guide.title,
      instruction: guide.mode === 'hunt' && guide.tier > this.battleStore.tier
        ? `${guide.instruction} 현재 전투 T${this.battleStore.tier}이며, T${guide.tier} 해금 뒤 만날 수 있어요.`
        : guide.instruction,
      target,
      mode: guide.mode,
      activityKind: guide.mode === 'activity' ? guide.activityKind : undefined,
      focusItemId: guide.mode === 'activity' ? guide.focusItemId : undefined,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `수집 길 안내 · ${this.collectionGuide.title} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  /** 관측 조건을 주민 수첩·비밀 기록 또는 실제 생활 장소까지 바로 이어 준다. */
  private navigateNeighborhoodAtmosphereRequirement(requirement: NeighborhoodAtmosphereRequirementView): void {
    this.clearCollectionGuide();
    if (requirement.key === 'resident_letters' || requirement.key === 'resident_rendezvous_scenes') {
      const mode = requirement.key === 'resident_letters' ? 'letters' : 'rendezvous';
      this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust(), mode));
      this.showToast(`${requirement.label} · 주민 관계 수첩의 해당 기록을 바로 열었어요.`);
      return;
    }
    if (requirement.key === 'resident_greet') {
      this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust(), 'stories'));
      this.showToast(`${requirement.label} · 가까워지고 싶은 주민과 실제 골목에서 인사를 나눠 보세요.`);
      return;
    }
    if (requirement.key === 'alley_secrets_discovered') {
      this.openExclusive(() => this.alleySecrets.open());
      this.showToast(`${requirement.label} · 아직 발견하지 않은 환경 단서부터 확인할 수 있어요.`);
      return;
    }
    if (requirement.key === 'q_forest') {
      this.navigateVillageRequestMetric(requirement.key, requirement.label);
      return;
    }

    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === requirement.activity);
    if (!spot) {
      this.showToast('이 기록의 생활 장소를 다시 찾지 못했어요. 마을 찾기에서 이름으로 검색해 주세요.');
      return;
    }
    const target = { tx: spot.tx, ty: spot.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장에서 다시 시도해 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `atmosphere:${requirement.key}`,
      title: requirement.label,
      instruction: `${requirement.location}까지 금빛 발자국으로 안내할게요. 이미 남긴 기록도 모두 소급 반영됩니다.`,
      target,
      mode: 'activity',
      activityKind: requirement.activity,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `하늘 관측 길 안내 · ${requirement.location} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  /** 단발·연속 의뢰의 한 조건을 실제 월드 활동이나 전용 수첩으로 안내한다. */
  private navigateVillageRequestMetric(metric: string, title: string): void {
    const destination = villageRequestDestinationForMetric(metric);
    if (!destination) {
      this.showToast('이 의뢰의 위치를 다시 확인하지 못했어요. 다른 조건부터 이어가 주세요.');
      return;
    }
    this.clearCollectionGuide();
    if (destination === 'residents') {
      const mode = metric.startsWith('resident_room_care_')
        ? 'room-care'
        : metric.startsWith('resident_fan_') ? 'fanbook' : 'stories';
      this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust(), mode));
      this.showToast(mode === 'room-care'
        ? `${title} · 작은 방 정리에서 이웃의 생활 단서와 물건의 제자리를 살펴보세요.`
        : mode === 'fanbook'
          ? `${title} · 최애 팬북에서 응원석과 다음 리본을 확인해 보세요.`
          : `${title} · 주민 수첩에서 가까워지고 싶은 이웃을 확인해 보세요.`);
      return;
    }
    if (destination === 'adventure-kit') {
      this.openExclusive(() => this.adventureRolePanel.open());
      this.showToast(`${title} · 역할과 원정 부적을 비용 없이 바꿔 볼 수 있어요.`);
      return;
    }
    if (destination === 'profile') {
      this.openExclusive(() => this.profilePanel.openSelf());
      this.showToast(`${title} · 마을 명함의 공개 쇼케이스에서 대표 기록을 확인해 보세요.`);
      return;
    }
    if (destination === 'treasure') {
      this.openExclusive(() => this.treasure.open());
      this.showToast(`${title} · 보물 도감에서 모은 조각을 복원할 수 있어요.`);
      return;
    }
    if (destination === 'chat') {
      this.quests.close();
      if (!this.chat.isOpen) this.chat.open();
      this.showToast(`${title} · 짧은 안부 한 줄이면 충분해요.`);
      return;
    }
    if (destination === 'emote') {
      this.quests.close();
      if (!this.emotes.isOpen) this.emotes.toggle();
      this.showToast(`${title} · 마음에 맞는 몸짓을 골라 보세요.`);
      return;
    }
    if (destination === 'secrets') {
      this.openExclusive(() => this.alleySecrets.open());
      this.showToast(`${title} · 골목 비밀 기록에서 아직 찾지 못한 환경 단서를 골라 보세요.`);
      return;
    }
    if (destination === 'map') {
      this.openExclusive(() => this.mapPanel.open());
      this.showToast(`${title} · 현재 위치와 모든 생활 장소를 한 번에 확인할 수 있어요.`);
      return;
    }
    if (destination === 'search') {
      this.openExclusive(() => this.villageSearch.open());
      this.showToast(`${title} · 하고 싶은 생활이나 이름 한 단어만 적어도 괜찮아요.`);
      return;
    }

    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    let target: IsoGuideStep | null = null;
    let route: IsoGuideStep[] = [];
    if (destination === 'hunt') {
      const routes = ISO_HUNT_ZONES.map((zone) => {
        const candidate = { tx: zone.tx, ty: zone.ty < ISO_VILLAGE_H / 2 ? zone.ty + zone.h - 1 : zone.ty };
        return { candidate, route: findIsoVillageRoute(start, candidate) };
      }).filter((item) => item.route.length > 0).sort((a, b) => a.route.length - b.route.length);
      target = routes[0]?.candidate ?? null;
      route = routes[0]?.route ?? [];
    } else {
      const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === destination);
      if (spot) {
        target = { tx: spot.tx, ty: spot.ty };
        route = findIsoVillageRoute(start, target);
      }
    }
    if (!target || route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.quests.close();
    this.collectionGuide = {
      signature: `request:${metric}`, title,
      instruction: destination === 'hunt'
        ? '동쪽 연결도로 끝의 외곽숲에서 이어갈 수 있어요. 안전 구역으로 나오면 전투는 즉시 멈춥니다.'
        : '금빛 발자국 끝의 활동에서 이어갈 수 있어요. 이전 기록은 그대로 남아 있습니다.',
      target,
      mode: destination === 'hunt' ? 'hunt' : 'activity',
      activityKind: destination === 'hunt' ? undefined : destination,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `의뢰 길 안내 · ${title} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
  }

  private navigateHobbyClubCondition(condition: HobbyClubCondition): void {
    const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === condition.activity);
    if (!spot) {
      this.showToast('이 동아리 활동의 위치를 다시 확인하지 못했어요. 다른 기록부터 이어가 주세요.');
      return;
    }
    this.clearCollectionGuide();
    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = { tx: spot.tx, ty: spot.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `club:${condition.key}`,
      title: condition.label,
      instruction: `${condition.location}에서 이어갈 수 있어요. 이전 기록은 그대로 남아 있습니다.`,
      target,
      mode: 'activity',
      activityKind: condition.activity,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `동아리 길 안내 · ${condition.label} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  private navigateCommunityContribution(contribution: CommunityContribution): void {
    const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === contribution.activity);
    if (!spot) {
      this.showToast('이 생활 기여의 위치를 다시 확인하지 못했어요. 다른 기록부터 이어가 주세요.');
      return;
    }
    this.clearCollectionGuide();
    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = { tx: spot.tx, ty: spot.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `project:${contribution.key}`,
      title: contribution.label,
      instruction: `${contribution.location}에서 기여할 수 있어요. 기록이나 재료는 소비되지 않습니다.`,
      target,
      mode: 'activity',
      activityKind: contribution.activity,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `함께짓기 길 안내 · ${contribution.label} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  private navigateNeighborhoodTourStop(stop: NeighborhoodTourStopView): void {
    const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === stop.activity);
    if (!spot) {
      this.showToast('이 정류장의 위치를 다시 확인하지 못했어요. 다른 정류장부터 걸어도 기록은 그대로예요.');
      return;
    }
    this.clearCollectionGuide();
    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = { tx: spot.tx, ty: spot.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `tour:${stop.key}`,
      title: stop.label,
      instruction: `${stop.location}에서 이어갈 수 있어요. 순서와 마감은 없고 이전 기록도 그대로 남습니다.`,
      target,
      mode: 'activity',
      activityKind: stop.activity,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `소풍 길 안내 · ${stop.label} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  private navigateMuseumRequirement(requirement: MuseumRequirementView): void {
    this.clearCollectionGuide();
    if (requirement.destination === 'residents') {
      this.openExclusive(() => this.residentsPanel.open(this.residents.getTrust()));
      this.showToast(`${requirement.label} 단서는 주민 수첩의 인연 지도에서 이어갈 수 있어요.`);
      return;
    }
    if (requirement.destination === 'treasure') {
      this.openExclusive(() => this.treasure.open());
      this.showToast(`${requirement.label} 단서는 보물 도감에서 이어갈 수 있어요.`);
      return;
    }

    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    let target: IsoGuideStep | null = null;
    let route: IsoGuideStep[] = [];
    let activityKind: IsoActivityKind | undefined;
    if (requirement.destination === 'hunt') {
      const routes = ISO_HUNT_ZONES.map((zone) => ({
        target: { tx: zone.tx, ty: zone.ty < ISO_VILLAGE_H / 2 ? zone.ty + zone.h - 1 : zone.ty },
      })).map((candidate) => ({ ...candidate, route: findIsoVillageRoute(start, candidate.target) }))
        .filter((candidate) => candidate.route.length > 0)
        .sort((a, b) => a.route.length - b.route.length);
      target = routes[0]?.target ?? null;
      route = routes[0]?.route ?? [];
    } else {
      const spot = ISO_VILLAGE_ACTIVITIES.find((candidate) => candidate.kind === requirement.destination);
      if (spot) {
        target = { tx: spot.tx, ty: spot.ty };
        route = findIsoVillageRoute(start, target);
        activityKind = spot.kind;
      }
    }
    if (!target || route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `museum:${requirement.key}`,
      title: requirement.label,
      instruction: `${requirement.location}에서 단서를 이어갈 수 있어요. 기존 기록과 수령한 기념품은 그대로 남습니다.`,
      target,
      mode: requirement.destination === 'hunt' ? 'hunt' : 'activity',
      activityKind,
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `박물관 단서 안내 · ${requirement.label} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) {
      this.lastActivityId = null;
      this.checkActivity();
    }
  }

  private updateCollectionGuide(): void {
    const guide = this.collectionGuide;
    if (!guide) return;
    const tile = worldToTile(this.worldPos.x, this.worldPos.y);
    if (guide.mode === 'hunt' && huntZoneAt(tile.tx, tile.ty)) {
      const title = guide.title;
      this.clearCollectionGuide(true);
      this.showToast(`${title} 관찰 구역에 도착했어요. 가까운 생태를 자동으로 관찰합니다.`);
      return;
    }
    if (guide.mode === 'secret'
      && tile.tx === guide.target.tx && tile.ty === guide.target.ty) {
      const secretId = guide.signature.slice('secret:'.length);
      this.clearCollectionGuide(true);
      this.discoverAlleySecret(secretId);
      return;
    }
    if (guide.signature.startsWith('district:')
      && tile.tx === guide.target.tx && tile.ty === guide.target.ty) {
      const title = guide.title;
      this.clearCollectionGuide(true);
      this.showToast(`${title} 여권 표식에 도착했어요. 주변 생활 장소는 지도에서 다시 확인할 수 있어요.`);
      return;
    }
    if (guide.arriveAtTarget && tile.tx === guide.target.tx && tile.ty === guide.target.ty) {
      const title = guide.title;
      this.clearCollectionGuide(true);
      this.showToast(`${title} 근처에 도착했어요. 이름표를 클릭하거나 가까이에서 인사해 보세요.`);
      return;
    }
    const tileKey = `${tile.tx},${tile.ty}`;
    if (tileKey === this.collectionGuideTile) return;
    this.collectionGuideTile = tileKey;
    const route = findIsoVillageRoute(tile, guide.target);
    this.collectionRoute?.destroy();
    this.collectionRoute = route.length > 1 ? drawIsoGuideRoute(this, route.slice(1)) : null;
  }

  private clearCollectionGuide(arrived = false): void {
    const previous = this.collectionGuide;
    this.collectionRoute?.destroy();
    this.collectionRoute = null;
    this.collectionGuide = null;
    this.collectionGuideTile = '';
    if (!this.hint) return;
    this.hint.textContent = arrived && previous
      ? `${previous.title} 목적지에 도착했어요 · 활동을 마치면 가이드북에 자동 기록됩니다`
      : '아이소메트릭 메인 월드 · WASD 이동 · 동쪽 보랏빛 외곽숲은 선택형 자동전투 구역';
  }

  private async openShop(focusItemId?: string, initialMode?: 'buy' | 'weekly' | 'craft' | 'sell'): Promise<void> {
    this.shop.open(this.coins, this.inventory, focusItemId, this.furnitureCraftHistory, this.weeklyFurnitureHistory, initialMode);
    if (!this.sb) return;
    const [coins, inventory, craftHistory, weeklyHistory] = await Promise.all([
      fetchCoins(this.sb, this.peer.userId), fetchInventory(this.sb, this.peer.userId),
      fetchFurnitureCraftHistory(this.sb, this.peer.userId),
      fetchWeeklyFurniturePurchaseHistory(this.sb, this.peer.userId),
    ]);
    this.coins = coins;
    this.inventory = inventory;
    this.furnitureCraftHistory = craftHistory;
    this.weeklyFurnitureHistory = weeklyHistory;
    this.hud.setCoins(coins);
    this.shop.setCoins(coins);
    this.shop.setCounts(inventory);
    this.shop.setCraftHistory(craftHistory);
    this.shop.setWeeklyHistory(weeklyHistory);
    this.questStore.setMetric('weekly_furniture_unique', weeklyHistory.size);
    this.dex.absorb(inventory);
  }

  private async buyFurniture(itemId: string): Promise<void> {
    const item = CATALOG_BY_ID.get(itemId);
    if (!this.sb || !item) {
      this.shop.setStatus('지금은 둘러보기 모드예요. 접속하면 이 진열대에서 안전하게 구매할 수 있어요.');
      return;
    }
    const firstDiscovery = !this.inventory.has(itemId) || (this.inventory.get(itemId) ?? 0) <= 0;
    const result = await buyItem(this.sb, itemId);
    if (!result.ok) {
      const message = result.reason === 'no-coins'
        ? `${item.name}을(를) 고르려면 ${item.price.toLocaleString()} 코인이 필요해요.`
        : result.reason === 'diy-only' ? `${item.name}은(는) DIY 작업대에서만 만들 수 있어요.`
          : result.reason === 'not-in-rotation' ? `${item.name}은(는) 이번 주 진열이 아니에요. 주간 수첩에서 돌아오는 주를 확인해 주세요.`
            : '구매 기록을 확인하지 못했어요. 코인은 차감되지 않았습니다. 잠시 뒤 다시 눌러 주세요.';
      this.shop.setStatus(message);
      audio.playSe('click');
      return;
    }
    this.coins = result.balance;
    this.inventory.set(itemId, (this.inventory.get(itemId) ?? 0) + 1);
    this.hud.setCoins(this.coins);
    this.shop.setCoins(this.coins);
    this.shop.setCounts(this.inventory);
    this.dex.absorb(this.inventory);
    this.questStore.bump('shop_purchase');
    if (furnitureAcquisitionChannel(itemId) === 'weekly') {
      this.weeklyFurnitureHistory.add(itemId);
      this.shop.setWeeklyHistory(this.weeklyFurnitureHistory);
      this.questStore.setMetric('weekly_furniture_unique', this.weeklyFurnitureHistory.size);
      this.questStore.bump('weekly_furniture_bought');
    }
    this.refreshProgress();
    const message = firstDiscovery
      ? `${item.name} 첫 발견! 가이드북과 수집 선반에 기록했어요.`
      : `${item.name}을(를) 한 점 더 들였어요. 보유 수량도 갱신됐습니다.`;
    this.shop.setStatus(message);
    this.showToast(message);
    audio.playSe('success');
  }

  private async craftFurnitureRecipe(recipeId: string): Promise<void> {
    const recipe = FURNITURE_RECIPE_BY_ID.get(recipeId);
    if (!this.sb || !recipe) {
      this.shop.setStatus('지금은 작업대 설계도를 둘러볼 수 있어요. 접속하면 재료를 안전하게 합칠 수 있습니다.');
      return;
    }
    const result = await craftFurniture(this.sb, recipeId);
    if (!result.ok) {
      this.shop.setStatus(result.reason === 'missing-materials' ? '재료가 조금 부족해요. 기본 진열과 보유 수량을 다시 확인해 주세요.'
        : result.reason === 'no-coins' ? `제작 공임 ${recipe.fee} 코인이 필요해요.`
          : result.reason === 'no-rpc' ? '작업대 서버가 아직 준비되지 않았어요. 재료와 코인은 그대로입니다.'
            : '이 설계도를 확인하지 못했어요. 재료와 코인은 그대로입니다.');
      return;
    }
    const [inventory, craftHistory] = await Promise.all([
      fetchInventory(this.sb, this.peer.userId), fetchFurnitureCraftHistory(this.sb, this.peer.userId),
    ]);
    const output = CATALOG_BY_ID.get(recipe.outputItemId)!;
    const firstCraft = (this.furnitureCraftHistory.get(recipeId) ?? 0) === 0;
    this.coins = result.balance;
    this.inventory = inventory;
    this.furnitureCraftHistory = craftHistory;
    this.hud.setCoins(result.balance);
    this.shop.setCoins(result.balance);
    this.shop.setCounts(inventory);
    this.shop.setCraftHistory(craftHistory);
    this.dex.absorb(inventory);
    this.questStore.setMetric('furniture_craft_recipes', craftHistory.size);
    this.questStore.bump('furniture_craft_total');
    this.refreshProgress();
    const message = firstCraft ? `${output.name} 첫 제작! 설계도와 수집 선반에 기록했어요.` : `${output.name}을(를) 한 점 더 완성했어요.`;
    this.shop.setStatus(message);
    this.shop.celebrateCraft(output.id);
    this.showToast(message);
    audio.playSe('success');
  }

  private async sellFurniture(itemId: string): Promise<void> {
    const item = CATALOG_BY_ID.get(itemId);
    if (!this.sb || !item) {
      this.shop.setStatus('판매는 접속 상태에서만 안전하게 처리할 수 있어요.');
      return;
    }
    const balance = await sellItem(this.sb, itemId);
    if (balance === null) {
      this.shop.setStatus('판매 기록을 확인하지 못했어요. 가구와 코인은 그대로예요.');
      return;
    }
    this.coins = balance;
    this.inventory.set(itemId, Math.max(0, (this.inventory.get(itemId) ?? 0) - 1));
    this.hud.setCoins(balance);
    this.shop.setCoins(balance);
    this.shop.setCounts(this.inventory);
    this.shop.setStatus(`${item.name}을(를) 정리했어요. 발견 기록은 가이드북에 계속 남습니다.`);
    this.showToast(`${item.name} 판매 완료 · 발견 기록 유지`);
    audio.playSe('success');
  }

  private checkDistrict(): void {
    const district = neighborhoodDistrictAtWorld(this.worldPos.x, this.worldPos.y);
    if (!district || district.id === this.currentDistrictId) return;
    this.currentDistrictId = district.id;
    const result = this.districtStore.discover(district.id);
    const firstDiscovery = result === 'discovered';
    this.writeNeighborhoodDistrictMetrics(this.districtStore.progress());
    if (firstDiscovery) {
      this.refreshProgress();
      audio.playSe('success');
    }
    if (firstDiscovery || this.time.now - this.lastDistrictBannerAt >= 12_000) {
      this.showDistrictBanner(district, firstDiscovery);
      this.lastDistrictBannerAt = this.time.now;
    }
  }

  private showDistrictBanner(
    district: NonNullable<ReturnType<typeof neighborhoodDistrictAtWorld>>,
    firstDiscovery: boolean,
  ): void {
    if (this.districtBannerTimer !== null) window.clearTimeout(this.districtBannerTimer);
    this.districtBanner?.remove();
    const banner = document.createElement('div');
    banner.className = 'hv-district-banner';
    banner.style.setProperty('--district', district.color);
    banner.innerHTML = `<i>${district.mark}</i><div><small>${firstDiscovery ? 'NEW DISTRICT · PASSPORT STAMP' : district.code}</small><b>${district.name}</b><span>${district.subtitle}</span></div>`;
    document.body.appendChild(banner);
    this.districtBanner = banner;
    this.districtBannerTimer = window.setTimeout(() => {
      banner.classList.add('is-leaving');
      window.setTimeout(() => banner.remove(), 260);
      if (this.districtBanner === banner) this.districtBanner = null;
      this.districtBannerTimer = null;
    }, firstDiscovery ? 3_200 : 2_200);
  }

  private navigateNeighborhoodDistrict(id: NeighborhoodDistrictId): void {
    const district = NEIGHBORHOOD_DISTRICT_BY_ID.get(id);
    if (!district) {
      this.showToast('이 골목의 지도 표식을 다시 찾지 못했어요.');
      return;
    }
    this.clearCollectionGuide();
    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = district.guideTarget;
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 안전한 길을 만들지 못했어요. 중앙 광장으로 이동한 뒤 다시 눌러 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `district:${district.id}`,
      title: district.name,
      instruction: district.safe
        ? `${district.subtitle} · 금빛 발자국은 순간이동 없이 안전한 생활길만 따라갑니다.`
        : `${district.subtitle} · 보랏빛 경계 안에서만 전투가 시작되고 연결도로로 나오면 안전합니다.`,
      target,
      mode: district.safe ? 'activity' : 'hunt',
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    if (this.hint) this.hint.textContent = `골목 여권 길 안내 · ${district.name} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide?.instruction ?? district.description);
    audio.playSe('click');
  }

  private featureNeighborhoodDistrict(id: NeighborhoodDistrictId): void {
    const result = this.districtStore.feature(id);
    this.writeNeighborhoodDistrictMetrics(this.districtStore.progress());
    this.refreshProgress();
    const district = NEIGHBORHOOD_DISTRICT_BY_ID.get(id);
    this.showToast(result === 'featured'
      ? `「${district?.name ?? '이 골목'}」을(를) 골목 여권의 최애 권역으로 전시해요.`
      : result === 'cleared' ? '최애 권역 전시를 내렸어요. 발견 도장은 그대로 남습니다.'
        : '먼저 직접 걸어서 이 권역의 발견 도장을 남겨 주세요.');
  }

  private navigateAlleySecret(secretId: string): void {
    const secret = ALLEY_SECRETS.find((entry) => entry.id === secretId);
    if (!secret) return;
    this.clearCollectionGuide();
    const start = worldToTile(this.worldPos.x, this.worldPos.y);
    const target = { tx: secret.tx, ty: secret.ty };
    const route = findIsoVillageRoute(start, target);
    if (route.length === 0) {
      this.showToast('지금 위치에서는 이 흔적까지 안전한 길을 만들지 못했어요. 중앙 광장에서 다시 확인해 주세요.');
      return;
    }
    this.collectionGuide = {
      signature: `secret:${secret.id}`,
      title: this.alleySecretStore.get().discoveredIds.includes(secret.id)
        ? secret.title : `${secret.location}의 환경 단서`,
      instruction: `${secret.location}까지 실제 골목길로 안내할게요. 전투 지역의 단서도 관찰 모드로 안전하게 찾을 수 있어요.`,
      target,
      mode: 'secret',
    };
    this.collectionGuideTile = '';
    this.updateCollectionGuide();
    this.updateAlleySecretMarkers();
    if (this.hint) this.hint.textContent = `골목 비밀 길 안내 · ${secret.location} · 금빛 발자국을 따라가세요`;
    this.showToast(this.collectionGuide.instruction);
    audio.playSe('click');
    if (start.tx === target.tx && start.ty === target.ty) this.updateCollectionGuide();
  }

  private discoverAlleySecret(secretId: string): void {
    const secret = ALLEY_SECRETS.find((entry) => entry.id === secretId);
    if (!secret) return;
    const result = this.alleySecretStore.discover(secretId);
    this.syncAlleySecretMetrics();
    this.updateAlleySecretMarkers();
    this.mapPanel?.refresh();
    if (result === 'discovered') {
      this.refreshProgress();
      audio.playSe('success');
      this.showToast(`◇ 골목 비밀 발견 · 「${secret.title}」`);
    }
    this.openExclusive(() => this.alleySecrets.open(secretId));
  }

  private checkActivity(): void {
    if (this.entering) return;
    const tile = worldToTile(this.worldPos.x, this.worldPos.y);
    const spot = activityAt(tile.tx, tile.ty);
    if (!spot) { this.lastActivityId = null; return; }
    if (this.lastActivityId === spot.id) return;
    this.lastActivityId = spot.id;
    const guidedArrival = this.collectionGuide?.mode === 'activity' && this.collectionGuide.activityKind === spot.kind;
    const focusItemId = guidedArrival ? this.collectionGuide?.focusItemId : undefined;
    if (guidedArrival) this.clearCollectionGuide(true);
    this.activate(spot, focusItemId);
  }

  private activate(spot: IsoActivitySpot, focusItemId?: string): void {
    if (spot.kind === 'home') {
      void this.enterOwnHome(spot);
    } else if (spot.kind === 'quest') this.openQuests();
    else if (spot.kind === 'cafe') this.cafe.open();
    else if (spot.kind === 'busking') this.busking.open();
    else if (spot.kind === 'photo') this.openPhotoBooth();
    else if (spot.kind === 'petshop') this.petShop.open(this.petStore, this.coins, !!this.sb);
    else if (spot.kind === 'atelier') this.customize.open(this.peer.appearance);
    else if (spot.kind === 'shop') { this.bump('visit_shop'); void this.openShop(focusItemId); }
    else if (spot.kind === 'workshop') { this.bump('visit_workshop'); void this.openShop(focusItemId, 'craft'); }
    else if (spot.kind === 'garden') this.gardenPanel.open();
    else if (spot.kind === 'kitchen') this.cookingPanel.open();
    else if (spot.kind === 'fishing') this.fishingPanel.open();
    else if (spot.kind === 'showcase') this.tasteShowcase.open();
    else if (spot.kind === 'clubs') this.hobbyClubs.open();
    else if (spot.kind === 'projects') this.communityProjects.open();
    else if (spot.kind === 'guide') this.neighborhoodTours.open();
    else if (spot.kind === 'search') this.openExclusive(() => this.villageSearch.open());
    else if (spot.kind === 'museum') this.neighborhoodMuseum.open();
    else if (spot.kind === 'market') this.openNeighborhoodMarket();
    else if (spot.kind === 'atmosphere') this.openExclusive(() => this.atmospherePanel.open());
  }

  private async enterOwnHome(spot: IsoActivitySpot): Promise<void> {
    if (this.entering) return;
    if (!this.sb) {
      this.entering = true; this.bump('visit_home'); audio.playSe('door');
      this.scene.start('room', { roomId: 1, isOwner: true, peer: this.peer, adapter: this.adapter, houseType: 'oneroom', isPublic: false, returnScene: 'iso-village', returnSpawnTile: { tx: spot.tx, ty: spot.ty + 1 } });
      return;
    }
    const property = await fetchPropertyForHolder(this.sb, this.peer.userId);
    if (!property) {
      this.showToast('아직 계약한 집이 없어요. 주택가 복덕방에서 마음에 드는 첫 집을 골라 주세요.');
      this.lastActivityId = null;
      return;
    }
    this.entering = true; this.bump('visit_home'); audio.playSe('door');
    this.scene.start('room', {
      roomId: property.id, isOwner: true, peer: this.peer, adapter: this.adapter,
      houseType: property.houseType, floorSeed: property.floorSeed, dealType: property.dealType,
      isPublic: property.isPublic, returnScene: 'iso-village', returnSpawnTile: { tx: spot.tx, ty: spot.ty + 1 },
    });
  }

  private openQuests(initialTab?: 'requests' | 'journey' | 'chronicle' | 'paths' | 'growth' | 'daily' | 'fanwork'): void {
    this.bump('open_quest');
    this.quests.open(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
      initialTab,
    );
  }

  private bump(key: string, by = 1): void { this.questStore.bump(key, by); this.refreshProgress(); }

  private writeChronicleMetrics(progress: ChronicleProgress): void {
    this.questStore.setMetric('chronicle_pages', progress.pages);
    this.questStore.setMetric('chronicle_routes', progress.routesChosen);
    this.questStore.setMetric('chronicle_motifs', progress.motifs);
    this.questStore.setMetric('chronicle_featured', progress.featured);
  }

  private refreshProgress(): void {
    if (this.dex) this.questStore.setMetric('items_discovered', this.dex.foundCount);
    this.syncAdventureRoleMetrics();
    this.syncCollectionShelfMetrics();
    this.syncResidentFanbookMetrics();
    this.syncClosetMetrics();
    this.syncCharacterZineMetrics();
    this.syncMonsterResearchMetrics();
    this.syncGardenMetrics();
    this.syncCookingMetrics();
    this.syncFishingMetrics();
    this.syncAquariumMetrics();
    this.syncFurnitureReformMetrics();
    this.syncLookbookMetrics();
    this.syncTasteShowcaseMetrics();
    this.syncHobbyClubMetrics();
    this.syncCommunityProjectMetrics();
    this.syncNeighborhoodTourMetrics();
    this.syncNeighborhoodMuseumMetrics();
    this.syncNeighborhoodMarketMetrics();
    this.syncNeighborhoodDistrictMetrics();
    this.syncAlleySecretMetrics();
    this.syncNeighborhoodAtmosphereMetrics();
    this.syncTasteSetMetrics();
    this.syncVillageProfileMetrics();
    this.syncNeighborCheerMetrics();
    this.writePetOutingMetrics(this.petOutingStore.progress());
    this.writeRequestBoardMetrics(this.requestBoardStore.progress(this.questStore.get()));
    this.syncFestivalMetrics();
    this.syncPhotoMetrics();
    this.syncLifeMasteryMetrics();
    this.syncLifeSpecialtyMetrics();
    this.syncDailyInvitationMetrics();
    this.syncVillageJourneyMetrics();
    for (const [key, value] of Object.entries(adventurePathMetrics(this.questStore.views()))) {
      this.questStore.setMetric(key, value);
    }
    const levelMemoryProgress = this.quests?.villageLevelMemoryProgress();
    if (levelMemoryProgress) {
      for (const [key, value] of Object.entries(villageLevelMemoryMetrics(levelMemoryProgress))) {
        this.questStore.setMetric(key, value);
      }
    }
    this.achievementStore.sync(this.questStore.views());
    this.syncCollectionShelfMetrics();
    this.syncResidentFanbookMetrics();
    this.syncTasteSetMetrics();
    this.syncVillageProfileMetrics();
    this.questStore.setMetric('rare_styles', rareStyleUnlockCount(this.achievementStore.get().unlocked));
    this.syncLifeMasteryMetrics();
    this.syncLifeSpecialtyMetrics();
    this.syncVillageJourneyMetrics();
    this.achievementStore.sync(this.questStore.views());
    const badgeName = this.achievementStore.equipped()?.name ?? null;
    if (this.peer.badge !== badgeName) {
      this.peer.badge = badgeName;
      void this.adapter?.updateSelf(this.peer);
    }
    this.quests?.refresh(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
    );
    this.starterConcierge?.refresh();
    this.hud?.setHearts(this.questStore.doneCount(), 5);
    const views = this.questStore.views();
    const completed = completedQuestIds(views);
    this.questMilestoneHistory ??= new QuestMilestoneHistoryStore(this.peer.userId, completed);
    const milestone = questMilestoneNotice(
      this.questMilestoneHistory.seenCompletedIds(), views, this.achievementStore.get().unlocked,
    );
    this.questMilestoneHistory.remember(completed);
    if (milestone) this.hud?.showQuestMilestone(milestone);
    this.refreshWorldQuestMarkers(views);
    const guide = selectQuestGuide(views, this.questStore.focusedQuestId());
    this.hud?.setQuestTarget(guide ? {
      id: guide.quest.id, name: guide.quest.name, location: guide.quest.location,
      label: guide.label, action: guide.action, tone: guide.tone, manual: guide.manual,
      progress: guide.quest.progress, goal: guide.quest.goal,
    } : null);
    this.nameLabel?.setText(this.playerName());
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

  private writeCollectionShelfMetrics(progress: CollectionShelfProgress): void {
    this.questStore.setMetric('collection_shelf_targets', progress.targets);
    this.questStore.setMetric('collection_shelf_kinds', progress.targetKinds);
    this.questStore.setMetric('collection_shelf_completed', progress.completed);
  }

  private syncCollectionShelfMetrics(): void {
    if (this.dex) this.writeCollectionShelfMetrics(this.dex.shelfProgress());
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

  private syncResidentFanbookMetrics(): void {
    if (this.residentsPanel) this.writeResidentFanbookMetrics(this.residentsPanel.fanbookProgress());
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
      specialtyIds: this.quests.featuredLifeSpecialtyIds(lifeMasteryViews(quests)),
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
    const sent = this.multiplayer?.sendNeighborCheer(peer.userId, kind) ?? false;
    // 오프라인 peer-profile은 실제 브로드캐스트 없이 전송 UI만 회귀 검증한다.
    return sent || (import.meta.env.DEV && new URLSearchParams(location.search).has('peer-profile'));
  }

  private sendPetMeet(peer: PeerState, kind: PetMeetKind): boolean {
    const sent = this.multiplayer?.sendPetMeet(peer.userId, kind) ?? false;
    return sent || (import.meta.env.DEV && new URLSearchParams(location.search).has('peer-profile'));
  }

  private async visitNeighborHome(peer: PeerState): Promise<'entered' | 'no-home' | 'private' | 'offline' | 'error'> {
    const params = new URLSearchParams(location.search);
    if (!this.sb) {
      if (!(import.meta.env.DEV && params.has('neighbor-home-tour'))) return 'offline';
      const here = worldToTile(this.worldPos.x, this.worldPos.y);
      this.scene.start('room', {
        roomId: 7, isOwner: false, peer: this.peer, adapter: this.adapter,
        houseType: 'villa', floorSeed: 707, visitOwner: { userId: peer.userId, nickname: peer.nickname },
        isPublic: true,
        returnScene: 'iso-village', returnSpawnTile: here,
      });
      return 'entered';
    }
    try {
      const property = await fetchPropertyForHolder(this.sb, peer.userId);
      if (!property) return 'no-home';
      if (!property.isPublic) return 'private';
      const here = worldToTile(this.worldPos.x, this.worldPos.y);
      this.scene.start('room', {
        roomId: property.id, isOwner: false, peer: this.peer, adapter: this.adapter,
        houseType: property.houseType, floorSeed: property.floorSeed, dealType: property.dealType,
        isPublic: property.isPublic,
        visitOwner: { userId: peer.userId, nickname: peer.nickname },
        returnScene: 'iso-village', returnSpawnTile: here,
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
    this.questStore.setMetric('life_specialty_synergies', progress.discoveredSynergies);
    this.questStore.setMetric('life_specialty_current_synergy', Number(!!progress.currentSynergyId));
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
    this.refreshProgress();
    this.showToast(`산책 도장 ${progress.souvenirStamps}/${progress.totalSouvenirs} · ${progress.routesVisited}개 골목 기록`);
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
    this.refreshProgress();
    this.showToast(`마음 번역 ${progress.recorded}개 · ${progress.personalities}/6 성격 기록`);
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
    this.refreshProgress();
    this.showToast(`트릭 소극장 ${progress.stamps}장 · ${progress.repertoireTricks}/5 레퍼토리 기록`);
  }

  private writePetPerformanceMetrics(progress: PetPerformanceProgress): void {
    this.questStore.setMetric('pet_performance_rehearsals', progress.totalRehearsals);
    this.questStore.setMetric('pet_performance_stamps', progress.stamps);
    this.questStore.setMetric('pet_performance_tricks', progress.repertoireTricks);
    this.questStore.setMetric('pet_performance_complete', progress.completedPerformances);
    this.questStore.setMetric('pet_performance_partners', progress.petPartners);
    this.questStore.setMetric('pet_performance_featured', progress.featured);
  }

  private handleRequestBoardChanged(progress: VillageRequestProgress): void {
    this.writeRequestBoardMetrics(progress);
    this.refreshProgress();
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
    if (!this.gardenStore || !this.questStore) return;
    const progress = this.gardenStore.progress();
    this.questStore.setMetric('garden_planted', progress.totalPlanted);
    this.questStore.setMetric('garden_tend', progress.totalTends);
    this.questStore.setMetric('garden_harvest', progress.totalHarvests);
    this.questStore.setMetric('garden_species', progress.speciesDiscovered);
    this.questStore.setMetric('garden_specimens', progress.specimensDiscovered);
  }

  private syncCookingMetrics(): void {
    if (!this.cookingStore || !this.questStore) return;
    const progress = this.cookingStore.progress();
    this.questStore.setMetric('cooking_total', progress.totalCooked);
    this.questStore.setMetric('cooking_recipes', progress.recipesDiscovered);
    this.questStore.setMetric('cooking_plates', progress.platesDiscovered);
    this.questStore.setMetric('cooking_favorites', progress.favorites);
  }

  private syncFishingMetrics(): void {
    if (!this.fishingStore || !this.questStore) return;
    const progress = this.fishingStore.progress();
    this.questStore.setMetric('fishing_total', progress.totalCatches);
    this.questStore.setMetric('fishing_species', progress.speciesDiscovered);
    this.questStore.setMetric('fishing_stamps', progress.recordStamps);
    this.questStore.setMetric('fishing_gold_records', progress.goldRecords);
  }

  private syncAquariumMetrics(): void {
    if (!this.homeAquariumStore || !this.fishingStore || !this.questStore) return;
    const progress = this.homeAquariumStore.progress(this.fishingStore);
    this.questStore.setMetric('aquarium_saves', progress.saveCount);
    this.questStore.setMetric('aquarium_displayed', progress.displayedFish);
    this.questStore.setMetric('aquarium_frames', progress.framesUnlocked);
    this.questStore.setMetric('aquarium_substrates', progress.substratesUnlocked);
    this.questStore.setMetric('aquarium_ornaments', progress.ornamentsUnlocked);
  }

  private syncFurnitureReformMetrics(): void {
    if (!this.furnitureReformStore || !this.questStore) return;
    const progress = this.furnitureReformStore.progress();
    this.questStore.setMetric('furniture_reform_saves', progress.saves);
    this.questStore.setMetric('furniture_reform_combos', progress.combinations);
    this.questStore.setMetric('furniture_reform_finishes', progress.finishes);
    this.questStore.setMetric('furniture_reform_colors', progress.colors);
    this.questStore.setMetric('furniture_reformed_items', progress.styledPlacements);
  }

  private handleLookbookChanged(progress: LookbookProgress): void {
    this.writeLookbookMetrics(progress);
    this.refreshProgress();
    this.showToast(`룩북 ${progress.stars}/${progress.totalStars}별 · ${progress.entries}장 기록`);
  }

  private syncLookbookMetrics(): void {
    if (!this.lookbookStore || !this.achievementStore || !this.questStore) return;
    this.writeLookbookMetrics(this.lookbookStore.progress(this.achievementStore.get().unlocked));
  }

  private writeLookbookMetrics(progress: LookbookProgress): void {
    this.questStore.setMetric('lookbook_submissions', progress.submissions);
    this.questStore.setMetric('lookbook_entries', progress.entries);
    this.questStore.setMetric('lookbook_stars', progress.stars);
    this.questStore.setMetric('lookbook_perfect', progress.perfect);
    this.questStore.setMetric('lookbook_unique', progress.uniqueLooks);
  }

  private tasteShowcaseContext(): TasteShowcaseContext {
    const pet = emptyPetSnapshot();
    const activeId = this.petStore.activeId();
    const outing = this.petOutingStore.progress();
    pet.owned = this.petStore.owned().length;
    pet.customized = this.petStore.customizedCount();
    pet.accessories = this.petStore.unlockedAccessoryCount();
    pet.personalities = this.petStore.personalityVariety();
    pet.outingRoutes = outing.routesVisited;
    pet.outingSouvenirs = outing.souvenirStamps;
    pet.homeMemories = this.petHomeMemoryStore.uniqueCount();
    pet.homePartners = this.petHomeMemoryStore.petPartners();
    if (activeId) {
      pet.activeId = activeId;
      pet.activeName = this.petStore.displayName(activeId);
      pet.personality = this.petStore.personality(activeId);
      pet.accessory = this.petStore.accessory(activeId);
      pet.affinity = this.petStore.affinity(activeId);
      pet.tricks = this.petStore.learnedTricks(activeId).length;
      pet.memories = this.petStore.memories(activeId).filter((memory) => memory.unlocked).length;
    }
    return { home: this.tasteShowcaseStore.home(), pet };
  }

  private syncTasteShowcaseMetrics(): void {
    if (!this.tasteShowcaseStore || !this.questStore) return;
    const progress = this.tasteShowcaseStore.progress();
    this.questStore.setMetric('taste_showcase_submissions', progress.submissions);
    this.questStore.setMetric('taste_showcase_entries', progress.entries);
    this.questStore.setMetric('taste_showcase_stamps', progress.stamps);
    this.questStore.setMetric('taste_showcase_perfect', progress.perfect);
    this.questStore.setMetric('taste_showcase_domains', progress.domains);
    const records = Object.entries(this.tasteShowcaseStore.get().records);
    const home = records.filter(([id]) => TASTE_SHOWCASE_BY_ID.get(id)?.domain === 'home');
    const pet = records.filter(([id]) => TASTE_SHOWCASE_BY_ID.get(id)?.domain === 'pet');
    this.questStore.setMetric('taste_showcase_home_entries', home.length);
    this.questStore.setMetric('taste_showcase_home_stamps', home.reduce((sum, [, record]) => sum + record.bestStamps, 0));
    this.questStore.setMetric('taste_showcase_pet_entries', pet.length);
    this.questStore.setMetric('taste_showcase_pet_stamps', pet.reduce((sum, [, record]) => sum + record.bestStamps, 0));
  }

  private syncHobbyClubMetrics(): void {
    if (!this.hobbyClubStore || !this.questStore) return;
    this.writeHobbyClubMetrics(this.hobbyClubStore.progress(this.questStore.get()));
  }

  private writeHobbyClubMetrics(progress: HobbyClubProgress): void {
    this.questStore.setMetric('hobby_club_chapters', progress.chapters);
    this.questStore.setMetric('hobby_club_societies', progress.societies);
    this.questStore.setMetric('hobby_club_rank_max', progress.rankMax);
    this.questStore.setMetric('hobby_club_stamps', progress.stamps);
    this.questStore.setMetric('hobby_club_fan_pieces', progress.fanKitPieces);
    this.questStore.setMetric('hobby_club_complete_kits', progress.completeKits);
    this.questStore.setMetric('hobby_club_featured', progress.featuredClubs);
    this.questStore.setMetric('hobby_club_room_replays', progress.roomReplays);
    for (const view of this.hobbyClubStore.views(this.questStore.get())) {
      this.questStore.setMetric(`hobby_club_${view.id}_rank`, view.rank);
    }
  }

  private syncCommunityProjectMetrics(): void {
    if (!this.communityProjectStore || !this.questStore) return;
    this.writeCommunityProjectMetrics(this.communityProjectStore.progress(this.questStore.get()));
  }

  private writeCommunityProjectMetrics(progress: CommunityProjectProgress): void {
    this.questStore.setMetric('community_project_phases', progress.phases);
    this.questStore.setMetric('community_projects_completed', progress.completedProjects);
    this.questStore.setMetric('community_projects_active', progress.activeProjects);
    this.questStore.setMetric('community_project_contributions', progress.contributionMarks);
    this.questStore.setMetric('community_change_level', progress.villageChangeLevel);
    for (const view of this.communityProjectStore.views(this.questStore.get())) {
      this.questStore.setMetric(`community_project_${view.id}_level`, view.level);
    }
  }

  private async refreshSharedVillageProject(): Promise<SharedProjectView> {
    if (this.sb) {
      const result = await fetchSharedVillageProject(this.sb);
      if (result.ok) this.sharedVillageProjectStore.merge(result.state);
    }
    const view = this.sharedVillageProjectStore.view();
    this.sharedVillageProject?.update(view);
    this.handleSharedVillageProjectChanged(view);
    return view;
  }

  private async contributeToSharedVillageProject(
    kind: SharedProjectContributionKind, debug: boolean,
  ): Promise<SharedProjectContributeResult> {
    if (debug && !this.sb) {
      const result = this.sharedVillageProjectStore.previewContribute(kind);
      if (result.ok) this.showToast('오늘의 마음 한 장이 모두의 밤정원에 도착했어요.');
      return result;
    }
    if (!this.sb) return { ok: false, reason: 'bad', view: this.sharedVillageProjectStore.view() };
    const result = await contributeSharedVillageProject(this.sb, kind);
    if (result.state) this.sharedVillageProjectStore.merge(result.state);
    const view = this.sharedVillageProjectStore.view();
    if (result.ok) {
      this.showToast('오늘의 마음 한 장이 모두의 밤정원에 도착했어요.');
      return { ok: true, view };
    }
    return { ok: false, reason: result.reason === 'today' ? 'today' : 'bad', view };
  }

  private handleSharedVillageProjectChanged(view: SharedProjectView): void {
    if (!this.questStore) return;
    this.questStore.setMetric('shared_project_contributions', view.member.total);
    this.questStore.setMetric('shared_project_kinds', view.member.kindIds.length);
    this.questStore.setMetric('shared_project_chapters', view.member.chapterIds.length);
    this.questStore.setMetric('shared_project_completed_chapters', view.completedChapters);
    this.questStore.setMetric('shared_project_stage', view.stage);
    this.refreshSharedVillageProjectVisual();
    this.refreshProgress();
  }

  private syncNeighborhoodTourMetrics(): void {
    if (!this.neighborhoodTourStore || !this.questStore) return;
    this.writeNeighborhoodTourMetrics(this.neighborhoodTourStore.progress(this.questStore.get()));
  }

  private writeNeighborhoodTourMetrics(progress: NeighborhoodTourProgress): void {
    this.questStore.setMetric('neighborhood_tour_postcards', progress.postcards);
    this.questStore.setMetric('neighborhood_tour_moods', progress.moods);
    this.questStore.setMetric('neighborhood_tour_ready', progress.ready);
    this.questStore.setMetric('neighborhood_tour_stops', progress.completedStops);
  }

  private syncNeighborhoodMuseumMetrics(): void {
    if (!this.neighborhoodMuseumStore || !this.questStore) return;
    this.writeNeighborhoodMuseumMetrics(this.neighborhoodMuseumStore.progress(this.questStore.get()));
  }

  private writeNeighborhoodMuseumMetrics(progress: NeighborhoodMuseumProgress): void {
    this.questStore.setMetric('neighborhood_museum_exhibits', progress.exhibits);
    this.questStore.setMetric('neighborhood_museum_featured', progress.featured);
    this.questStore.setMetric('neighborhood_museum_wings', progress.completedWings);
    this.questStore.setMetric('neighborhood_museum_ready', progress.ready);
    this.questStore.setMetric('neighborhood_museum_clues', progress.completedClues);
  }

  private openNeighborhoodMarket(tab: 'browse' | 'sell' | 'collection' = 'browse'): void {
    this.neighborhoodMarket.open(tab);
    this.writeNeighborhoodMarketMetrics(this.neighborhoodMarket.progress());
    this.refreshProgress();
  }

  private async refreshNeighborhoodMarketEconomy(): Promise<void> {
    if (!this.sb) return;
    const [coins, inventory] = await Promise.all([
      fetchCoins(this.sb, this.peer.userId),
      fetchInventory(this.sb, this.peer.userId),
    ]);
    this.coins = coins;
    this.inventory = inventory;
    this.hud.setCoins(coins);
    this.shop.setCoins(coins);
    this.shop.setCounts(inventory);
    this.dex.absorb(inventory);
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
    if (!this.neighborhoodMarket || !this.questStore) return;
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

  private syncNeighborhoodDistrictMetrics(): void {
    if (!this.districtStore || !this.questStore) return;
    this.writeNeighborhoodDistrictMetrics(this.districtStore.progress());
  }

  private writeNeighborhoodDistrictMetrics(progress: NeighborhoodDistrictProgress): void {
    this.questStore.setMetric('districts_discovered', progress.discovered);
    this.questStore.setMetric('safe_districts_discovered', progress.safeDiscovered);
    this.questStore.setMetric('district_passport_featured', progress.featured);
  }

  private syncAlleySecretMetrics(): void {
    if (!this.alleySecretStore || !this.questStore) return;
    this.writeAlleySecretMetrics(this.alleySecretStore.progress());
  }

  private writeAlleySecretMetrics(progress: AlleySecretProgress): void {
    this.questStore.setMetric('alley_secrets_discovered', progress.discovered);
    this.questStore.setMetric('alley_secret_chapters', progress.completedChapters);
    this.questStore.setMetric('alley_secret_featured', progress.featured);
  }

  private syncNeighborhoodAtmosphereMetrics(): void {
    if (!this.atmosphereStore || !this.questStore) return;
    this.writeNeighborhoodAtmosphereMetrics(this.atmosphereStore.progress(this.questStore.get()));
  }

  private writeNeighborhoodAtmosphereMetrics(progress: NeighborhoodAtmosphereProgress): void {
    this.questStore.setMetric('atmosphere_visits', progress.visitCount);
    this.questStore.setMetric('atmosphere_observed', progress.observed);
    this.questStore.setMetric('atmosphere_featured', progress.featured);
    this.questStore.setMetric('atmosphere_replays', progress.replayCount);
    this.questStore.setMetric('atmosphere_effects', progress.effects);
  }

  private syncAdventureComfortMetrics(): void {
    if (!this.adventureComfortStore || !this.questStore) return;
    this.writeAdventureComfortMetrics(this.adventureComfortStore.progress());
  }

  private writeAdventureComfortMetrics(progress: AdventureComfortProgress): void {
    this.questStore.setMetric('adventure_mode_started', progress.adventure_mode_started);
    this.questStore.setMetric('adventure_mode_restored', progress.adventure_mode_restored);
  }

  private refreshCommunityProjectVisual(): void {
    this.communityProjectVisual?.destroy();
    this.communityProjectVisual = null;
    if (!this.communityProjectStore || !this.questStore) return;
    const prop = ISO_VILLAGE_PROPS.find((item) => item.id === 'community-project-pavilion');
    if (!prop) return;
    const phases = this.communityProjectStore.progress(this.questStore.get()).phases;
    this.communityProjectVisual = drawIsoCommunityProjectProgress(this, prop.tx, prop.ty, phases);
  }

  private refreshSharedVillageProjectVisual(): void {
    this.sharedVillageProjectVisual?.destroy();
    this.sharedVillageProjectVisual = null;
    if (!this.sharedVillageProjectStore) return;
    const prop = ISO_VILLAGE_PROPS.find((item) => item.id === 'community-project-pavilion');
    if (!prop) return;
    this.sharedVillageProjectVisual = drawIsoSharedVillageProject(this, prop.tx, prop.ty, this.sharedVillageProjectStore.view());
  }

  private openPhotoBooth(): void {
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
    this.refreshProgress();
    this.photoFx();
    audio.playSe('success');
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

  private focusQuest(id: string | null): void {
    if (!this.questStore.focusQuest(id)) return;
    this.refreshProgress();
    const quest = id ? QUEST_BY_ID.get(id) : null;
    this.showToast(quest ? `「${quest.name}」 목표를 HUD에 표시해요.` : '자동 길잡이로 돌아왔어요.');
  }

  private playerName(): string {
    const badge = this.achievementStore?.equipped();
    const identity = `${titleForLevel(this.battleStore.level)} · ${this.peer.nickname}  Lv.${this.battleStore.level}`;
    return badge ? `◆ ${badge.name}\n● ${identity}` : `● ${identity}`;
  }

  private isFatigued(): boolean { return this.time.now < this.fatigueUntil; }

  private updateRecovery(delta: number): void {
    const maxHp = maxHpForLevel(this.battleStore.level);
    if ((this.activeHuntZone && this.adventureComfortStore.combatEnabled())
      || this.playerHp >= maxHp || this.time.now - this.lastHitMs < 2_500) return;
    this.playerHp = Math.min(maxHp, this.playerHp + maxHp * 0.1 * (delta / 1_000));
  }

  private updateBattleHud(): void {
    const maxHp = maxHpForLevel(this.battleStore.level);
    this.battleHud.setVisible(!!this.activeHuntZone || this.isFatigued() || this.playerHp < maxHp - 0.5);
    const weapon = weaponById(this.battleStore.equippedId());
    this.battleHud.set({
      level: this.battleStore.level,
      hp: this.playerHp,
      maxHp,
      xp: this.battleStore.xp,
      xpNext: xpToNext(this.battleStore.level),
      tier: this.battleStore.tier,
      kills: this.battleStore.killsInTier,
      quota: this.battleStore.quota,
      weapon: `${weapon.emoji} ${weapon.name}`,
      role: `${this.adventureRoleStore.role().mark} ${this.adventureRoleStore.role().name}`,
      fatigued: this.isFatigued(),
      combatMode: this.adventureComfortStore.get().mode,
    });
  }

  private onHuntZoneChange(zone: IsoHuntZoneDef | null): void {
    const previous = this.activeHuntZone;
    this.activeHuntZone = zone;
    if (zone) {
      if (this.adventureComfortStore.combatEnabled()) {
        this.showToast(`${zone.name} · 원정 모드예요. 가까운 몬스터와 자동 전투를 시작합니다.`);
        if (this.hint) this.hint.textContent = `${zone.name} · 원정 모드 · 상단 HUD에서 언제든 관찰 모드로 돌아갈 수 있어요`;
      } else {
        this.showToast(`${zone.name} · 관찰 모드라 몬스터가 공격하지 않아요. 준비되면 상단에서 원정을 켜세요.`);
        if (this.hint) this.hint.textContent = `${zone.name} · 관찰 모드 · 몬스터와 풍경을 안전하게 둘러보는 중`;
      }
    } else {
      if (previous) {
        this.dex.breakMonsterStreak();
        this.showToast('안전한 생활권이에요. 체력이 천천히 회복됩니다.');
      }
      if (this.hint) this.hint.textContent = '아이소메트릭 메인 월드 · WASD 이동 · 동쪽 보랏빛 외곽숲은 선택형 자동전투 구역';
    }
  }

  private toggleAdventureComfortMode(): void {
    const result = this.adventureComfortStore.toggle();
    if (result === 'unchanged') return;
    this.syncAdventureComfortMetrics();
    this.refreshProgress();
    if (result === 'peaceful') {
      this.dex.breakMonsterStreak();
      this.showToast('관찰 모드로 돌아왔어요. 외곽숲 안에서도 공격받지 않고 체력을 회복합니다.');
      if (this.hint && this.activeHuntZone) this.hint.textContent = `${this.activeHuntZone.name} · 관찰 모드 · 다시 원할 때만 원정을 켜세요`;
    } else {
      this.showToast('원정 모드를 직접 시작했어요. 상단 버튼을 누르면 언제든 안전하게 멈출 수 있습니다.');
      if (this.hint && this.activeHuntZone) this.hint.textContent = `${this.activeHuntZone.name} · 원정 모드 · 상단 HUD에서 즉시 관찰 모드로 전환 가능`;
    }
    this.updateBattleHud();
    audio.playSe('click');
  }

  private damagePlayer(damage: number): void {
    if (this.playerHp <= 0) return;
    this.playerHp = Math.max(0, this.playerHp - Math.max(0, damage));
    this.lastHitMs = this.time.now;
    if (!playComfort.reducedMotion()) this.cameras.main.shake(90, 0.004);
    this.player.setTintFill(0xff6b6b);
    this.time.delayedCall(90, () => { if (this.player.active) this.player.clearTint(); });
    if (this.playerHp <= 0) this.playerDie();
  }

  private playerDie(): void {
    this.battleStore.onDeath();
    this.dex.breakMonsterStreak();
    this.playerHp = maxHpForLevel(this.battleStore.level);
    this.fatigueUntil = this.time.now + FATIGUE_MS;
    this.worldPos = {
      x: (ISO_VILLAGE_SPAWN.tx + 0.5) * TILE,
      y: (ISO_VILLAGE_SPAWN.ty + 0.5) * TILE,
    };
    this.syncPlayerVisual(0);
    this.showWorldBubble(this.player, '💫 잠깐 기절했어요. 장비는 안전하고, 마을에서 다시 시작해요!', 'me');
    this.showToast('경험치가 조금 줄었어요 · 15초 동안 공격력이 낮지만 생활 활동은 그대로 가능해요.');
    audio.playSe('click');
  }

  private onMonsterDefeat(species: MonsterSpecies): void {
    const before = this.battleStore.level;
    const roleModifier = this.adventureRoleStore.modifier();
    const result = this.battleStore.onKill(Math.max(1, Math.round(species.xp * roleModifier.xpMultiplier)));
    if (roleModifier.healOnKillPct > 0) {
      const maxHp = maxHpForLevel(this.battleStore.level);
      this.playerHp = Math.min(maxHp, this.playerHp + Math.max(1, Math.round(maxHp * roleModifier.healOnKillPct)));
    }
    const record = this.dex.recordMonster(species.id);
    this.questStore.bump('monster_kill');
    this.questStore.setMetric('player_level', this.battleStore.level);
    this.questStore.setMetric('battle_tier', this.battleStore.tier);
    if (record) {
      this.questStore.setMetric('monster_species', record.discovered);
      this.questStore.setMetric('monster_streak', record.bestStreak);
    }
    let shards = 0;
    if (species.shard > 0 && Math.random() < 0.5) {
      shards = species.shard;
      this.treasureStore.addShards(shards);
      this.dex.addMonsterShards(shards);
      this.questStore.bump('monster_shard', shards);
    }
    this.refreshProgress();
    audio.playSe('success');

    if (result.leveledUp > 0) {
      this.playerHp = maxHpForLevel(this.battleStore.level);
      this.playerAura.setLevel(this.battleStore.level);
      this.peer.level = this.battleStore.level;
      this.nameLabel.setText(this.playerName());
      void this.adapter?.updateSelf(this.peer);
      if (!playComfort.reducedMotion()) this.cameras.main.flash(180, 255, 239, 172);
      const newTitles: string[] = [];
      for (let level = before + 1; level <= this.battleStore.level; level++) {
        if (isTitleUpAt(level)) newTitles.push(titleForLevel(level));
      }
      this.showWorldBubble(
        this.player,
        `🎉 Lv.${this.battleStore.level} 레벨 업!${newTitles.length ? ` · 새 호칭 「${newTitles.at(-1)}」` : ''}`,
        'me',
      );
    } else if (record?.firstDiscovery) {
      this.showToast(`📖 도감 발견: T${species.tier} ${species.name}${shards ? ` · 조각 +${shards}` : ''}`);
    } else if (record && record.currentStreak > 0 && record.currentStreak % 5 === 0) {
      this.showToast(`🔥 ${record.currentStreak}연속 처치!${shards ? ` · 조각 +${shards}` : ''}`);
    } else if (shards) {
      this.showToast(`💠 보물 조각 +${shards}`);
    }
    if (result.tierUp) {
      this.showToast(`⚔️ 사냥 티어 ${result.newTier} 개방 · 새로운 몬스터 5종이 나타납니다!`);
    }
  }

  private updateFacing(input: MoveInput): void {
    if (input.down) this.facing = 0; else if (input.right) this.facing = 1; else if (input.left) this.facing = 2; else if (input.up) this.facing = 3;
  }

  private syncPlayerVisual(delta: number): void {
    const p = projectIsoWorld(this.worldPos.x, this.worldPos.y);
    const tile = { tx: this.worldPos.x / TILE, ty: this.worldPos.y / TILE, w: 0, h: 0 };
    const depth = isoDepth(tile, 400);
    this.player.setPosition(p.x, p.y).setDepth(depth);
    this.ring.setPosition(p.x, p.y + 2).setDepth(depth - 100);
    this.nameLabel.setPosition(p.x, p.y - 43).setDepth(depth + 2);
    this.playerAura.follow(p.x, p.y);
    this.playerAura.setDepth(depth - 6);
    this.pet?.update(p.x, p.y, delta);
    this.pet?.setDepth(depth - 5);
  }

  private applyAppearance(appearance: Appearance, persist: boolean): void {
    this.peer.appearance = appearance; this.peer.color = appearance.shirt;
    this.charKey = ensureCharacter(this, appearance); this.player.setTexture(this.charKey, this.facing * FRAMES_PER_DIR);
    if (persist) { this.bump('customize_save'); if (this.sb) void saveAppearance(this.sb, this.peer.userId, appearance); void this.adapter?.updateSelf(this.peer); }
  }

  private equipBadge(id: string): void {
    if (!this.achievementStore.equip(id)) return;
    this.peer.badge = this.achievementStore.equipped()?.name ?? null;
    void this.adapter?.updateSelf(this.peer);
    this.nameLabel.setText(this.playerName());
    this.quests.refresh(
      this.questStore.views(), this.achievementStore.views(), lifeMasteryViews(this.questStore.get()),
      this.questStore.focusedQuestId(),
    );
    const badge = BADGE_BY_ID.get(id); if (badge) this.showToast(`◆ 「${badge.name}」 장착 완료`);
  }

  private async claimQuest(id: string): Promise<void> {
    if (!this.sb) return;
    const result = await claimDailyQuest(this.sb, id);
    if (result.ok) { this.coins = result.balance; this.hud.setCoins(this.coins); this.questStore.claim(id); this.quests.markClaimed(id); this.showToast('일일 보상을 받았어요! 🪙'); }
    else this.showToast(result.reason === 'not-ready' ? '서버 기록이 목표에 조금 모자라요.' : '보상 기록을 확인하지 못했어요.');
  }

  private async loadAccountState(): Promise<void> {
    if (!this.sb) return;
    const [coins, inventory, progress, craftHistory, weeklyHistory] = await Promise.all([fetchCoins(this.sb, this.peer.userId), fetchInventory(this.sb, this.peer.userId), fetchPetProgress(this.sb, this.peer.userId), fetchFurnitureCraftHistory(this.sb, this.peer.userId), fetchWeeklyFurniturePurchaseHistory(this.sb, this.peer.userId)]);
    this.coins = coins; this.inventory = inventory; this.hud.setCoins(coins);
    this.furnitureCraftHistory = craftHistory;
    this.weeklyFurnitureHistory = weeklyHistory;
    this.shop?.setCoins(coins); this.shop?.setCounts(inventory); this.shop?.setCraftHistory(craftHistory); this.shop?.setWeeklyHistory(weeklyHistory); this.dex?.absorb(inventory);
    this.questStore.setMetric('furniture_craft_recipes', craftHistory.size);
    this.questStore.setMetric('furniture_craft_total', [...craftHistory.values()].reduce((sum, count) => sum + count, 0));
    this.questStore.setMetric('weekly_furniture_unique', weeklyHistory.size);
    if (progress) this.petStore.mergeServerProgress(progress); else this.petStore.merge(await fetchOwnedPets(this.sb, this.peer.userId));
    const activeId = this.petStore.activeId();
    this.pet?.setSpecies(activeId, activeId ? this.petStore.accessory(activeId) : 'none', activeId ? this.petStore.nickname(activeId) : null);
    this.syncPetMetrics(); this.petShop.refresh(this.coins);
  }

  private async adopt(id: string): Promise<void> {
    const species = petById(id); if (!species || this.petStore.isOwned(id)) return;
    if (species.rare && this.sb) {
      const result = await claimRarePet(this.sb, id);
      if (result === 'locked') { this.showToast('서버 기록에서 아직 발견 조건이 확인되지 않았어요.'); return; }
      if (result === 'ok') await this.loadAccountState();
      else this.petStore.adopt(id); // 0013 미적용 전환기
    } else if (this.sb) {
      const result = await adoptPet(this.sb, id);
      if (!result.ok) { this.showToast(result.reason === 'no-coins' ? '코인이 부족해요.' : '입양 서버를 확인하지 못했어요.'); return; }
      this.coins = result.balance; this.hud.setCoins(this.coins);
      this.petStore.adopt(id);
    } else {
      this.petStore.adopt(id);
    }
    if (!this.petStore.activeId()) this.setActivePet(id);
    this.bump('pet_adopt'); this.syncPetMetrics(); this.petShop.refresh(this.coins); this.showToast(`${species.emoji} ${species.name}, 이제 가족이에요!`);
  }

  private setActivePet(id: string | null): void {
    this.petStore.setActive(id);
    this.pet?.setSpecies(id, id ? this.petStore.accessory(id) : 'none', id ? this.petStore.nickname(id) : null);
    this.peer.pet = id;
    this.peer.petAccessory = id ? this.petStore.accessory(id) : 'none';
    this.peer.petName = id ? this.petStore.nickname(id) : null;
    void this.adapter?.updateSelf(this.peer);
  }

  private renamePet(id: string, nickname: string): void {
    if (!this.petStore.setNickname(id, nickname)) { this.petShop.refresh(this.coins); return; }
    this.afterPetProfileChange(id, 'pet_profile_edit');
    this.showToast(`${this.petStore.displayName(id)}의 새 이름을 기록했어요.`);
  }

  private setPetPersonality(id: string, personality: PetPersonalityId): void {
    if (!this.petStore.setPersonality(id, personality)) return;
    this.afterPetProfileChange(id, 'pet_profile_edit');
    this.showToast(`${this.petStore.displayName(id)}의 성격 기록을 바꿨어요.`);
  }

  private setPetAccessory(id: string, accessory: PetAccessoryId): void {
    if (!this.petStore.equipAccessory(id, accessory)) return;
    this.afterPetProfileChange(id, accessory === 'none' ? 'pet_profile_edit' : 'pet_accessory_equip');
    this.showToast(`${this.petStore.displayName(id)}에게 새 장식이 잘 어울려요.`);
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
    this.peer.pet = draft.petId;
    this.peer.petAccessory = draft.accessoryId;
    this.peer.petName = this.petStore.nickname(draft.petId);
    void this.adapter?.updateSelf(this.peer);
    this.bump('pet_profile_edit');
    if (accessoryChanged && draft.accessoryId !== 'none') this.bump('pet_accessory_equip');
    this.syncPetMetrics();
    this.petShop.refresh(this.coins);
    this.petStyleStudio.refresh();
    this.showToast(`${draft.petName}의 코디를 동행 모습에 바로 적용했어요${personalityChanged ? ' · 성격 기록도 함께 바뀌었어요.' : '.'}`);
    return true;
  }

  private afterPetProfileChange(id: string, registryKey: 'pet_profile_edit' | 'pet_accessory_equip'): void {
    this.bump('pet_profile_edit');
    if (registryKey === 'pet_accessory_equip') this.bump('pet_accessory_equip');
    this.syncPetMetrics();
    if (this.petStore.activeId() === id) this.setActivePet(id);
    this.petShop.refresh(this.coins);
  }

  private async care(id: string, action: 'feed' | 'play' | 'train'): Promise<void> {
    const server = this.sb ? await carePet(this.sb, id, action) : null;
    if (server && !server.ok && server.reason !== 'no-rpc') { this.showToast('오늘 할 수 있는 돌봄을 이미 마쳤거나 조건이 부족해요.'); return; }
    let affinity = -1; let trickId: string | null = null;
    if (server?.ok) { affinity = server.affinity; await this.loadAccountState(); trickId = server.trick; }
    else if (action === 'feed') affinity = this.petStore.feed(id);
    else if (action === 'play') affinity = this.petStore.play(id);
    else { const result = this.petStore.train(id); if (result.ok) { affinity = result.affinity; trickId = result.trick.id; } }
    if (affinity < 0) { this.showToast('오늘은 이미 함께했어요. 내일 또 만나요!'); return; }
    if (this.petStore.activeId() !== id) this.setActivePet(id);
    this.pet?.trickFx(action === 'play' ? 'play' : trickId ?? 'hello');
    this.bump(action === 'feed' ? 'pet_feed' : action === 'play' ? 'pet_play' : 'pet_train');
    this.syncPetMetrics(); this.petShop.refresh(this.coins); this.showToast(`친밀도 ${affinity} 💛`);
  }

  private performTrick(id: string, trickId: string): void { if (this.petStore.activeId() !== id) this.setActivePet(id); this.pet?.trickFx(trickId); this.bump('pet_trick_perform'); }

  private async petActive(): Promise<void> {
    const id = this.petStore.activeId(); if (!id) return;
    const server = this.sb ? await carePet(this.sb, id, 'pet') : null;
    if (server && !server.ok && server.reason !== 'no-rpc') {
      this.showToast(server.reason === 'daily-cap' ? '오늘은 충분히 쓰다듬어 줬어요. 내일 또 만나요!' : '펫 기록을 확인하지 못했어요.');
      return;
    }
    const affinity = server?.ok ? server.affinity : this.petStore.pet(id);
    this.pet?.petFx(); this.questStore.setMetric('max_pet_affinity', affinity); this.refreshProgress();
  }

  private syncPetMetrics(): void {
    const owned = this.petStore.owned(); this.questStore.setMetric('pets_owned', owned.length);
    this.questStore.setMetric('max_pet_affinity', Math.max(0, ...owned.map((id) => this.petStore.affinity(id))));
    this.questStore.setMetric('pet_tricks', Math.max(0, ...owned.map((id) => this.petStore.learnedTricks(id).length)));
    this.questStore.setMetric('pet_memories', Math.max(0, ...owned.map((id) => this.petStore.memories(id).filter((m) => m.unlocked).length)));
    this.questStore.setMetric('pet_profiles_customized', this.petStore.customizedCount());
    this.questStore.setMetric('pet_accessories', this.petStore.unlockedAccessoryCount());
    this.questStore.setMetric('pet_personalities', this.petStore.personalityVariety());
    this.refreshProgress();
  }

  private writePetStyleMetrics(progress: PetStyleStudioProgress): void {
    this.questStore.setMetric('pet_style_cards', progress.savedCards);
    this.questStore.setMetric('pet_style_captures', progress.totalCaptures);
    this.questStore.setMetric('pet_style_discoveries', progress.discoveries);
    this.questStore.setMetric('pet_style_pets', progress.pets);
    this.questStore.setMetric('pet_style_personalities', progress.personalities);
    this.questStore.setMetric('pet_style_accessories', progress.accessories);
    this.questStore.setMetric('pet_style_backdrops', progress.backdrops);
    this.questStore.setMetric('pet_style_poses', progress.poses);
    this.questStore.setMetric('pet_style_featured', progress.featured);
    this.questStore.setMetric('pet_style_applies', progress.applies);
  }

  private syncResidentMetrics(): void {
    const trust = this.residents.getTrust();
    const values = Object.values(trust).map((entry) => entry.v);
    this.questStore.setMetric('residents_met', metCount(trust));
    this.questStore.setMetric('resident_trust_max', Math.max(0, ...values));
    for (const [key, value] of Object.entries(residentTrustMetrics(trust))) this.questStore.setMetric(key, value);
    if (this.residentsPanel) {
      this.writeResidentRendezvousMetrics(this.residentsPanel.rendezvousProgress());
      this.writeResidentLetterMetrics(this.residentsPanel.lettersProgress());
      this.writeResidentFanbookMetrics(this.residentsPanel.fanbookProgress());
    }
    this.refreshProgress();
  }

  private openRanking(): void {
    const trust = this.residents.getTrust();
    const trustSum = Object.values(trust).reduce((sum, entry) => sum + entry.v, 0);
    this.rankingPanel.open({
      coins: this.coins,
      hearts: this.questStore.doneCount(),
      dexFound: this.dex.foundCount,
      trustSum,
    });
  }

  /** 주민 스프라이트 정면 프레임을 픽셀 초상으로 구워 주민 수첩과 같은 외형을 공유한다. */
  private bakePortraits(): Record<string, string> {
    const portraits: Record<string, string> = {};
    for (const resident of RESIDENTS) {
      const key = ensureCharacter(this, resident.appearance);
      const source = this.textures.get(key).getSourceImage();
      if (!(source instanceof HTMLCanvasElement) && !(source instanceof HTMLImageElement)) continue;
      const canvas = document.createElement('canvas');
      canvas.width = 48; canvas.height = 72;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, CHAR_W, CHAR_H, 0, 0, 48, 72);
      portraits[resident.id] = canvas.toDataURL();
    }
    return portraits;
  }

  private showWorldBubble(owner: Phaser.GameObjects.Sprite, message: string, kind: 'npc' | 'user' | 'me'): void {
    this.worldBubbles.get(owner)?.destroy();
    const styles = {
      npc: { border: 0x5b381e, fill: 0xfff8e4, text: '#4a2e14' },
      user: { border: 0x2a5a8a, fill: 0xdcecff, text: '#1a3a5a' },
      me: { border: 0x2a6a3a, fill: 0xdcf2dc, text: '#173a1e' },
    } as const;
    const style = styles[kind];
    const text = this.add.text(0, 0, message, {
      fontFamily: UI_FONT, fontSize: '10px', color: style.text, wordWrap: { width: 150 },
      align: 'center', resolution: TEXT_RES,
    }).setOrigin(0.5);
    const bounds = text.getBounds();
    const width = bounds.width + 18, height = bounds.height + 12;
    const background = this.add.graphics();
    background.fillStyle(style.border, 1).fillRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 8);
    background.fillStyle(style.fill, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 7);
    background.fillStyle(style.border, 1).fillTriangle(-5, height / 2 + 6, 6, height / 2 + 6, 0, height / 2 - 1);
    background.fillStyle(style.fill, 1).fillTriangle(-3, height / 2 + 4, 4, height / 2 + 4, 0, height / 2 - 1);
    const reducedMotion = playComfort.reducedMotion();
    const bubble = this.add.container(owner.x, owner.y - 54, [background, text])
      .setDepth(owner.depth + 900).setScale(reducedMotion ? 1 : 0.65);
    this.worldBubbles.set(owner, bubble);
    if (!reducedMotion) this.tweens.add({ targets: bubble, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.time.delayedCall(4200, () => {
      if (this.worldBubbles.get(owner) !== bubble) return;
      this.worldBubbles.delete(owner);
      bubble.destroy();
    });
  }

  private photoFx(): void {
    if (playComfort.reducedMotion()) {
      this.showToast('오늘의 네 컷을 필름 앨범에 기록했어요.');
      return;
    }
    const flash = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xffffff, 0.82).setScrollFactor(0).setOrigin(0).setDepth(999999);
    this.tweens.add({ targets: flash, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
    this.showToast('오늘의 네 컷을 필름 앨범에 기록했어요.');
  }

  private showToast(message: string): void {
    this.toast?.destroy();
    this.toast = this.add.text(this.scale.width / 2, 76, message, {
      fontFamily: UI_FONT, fontSize: '11px', color: '#fff4d7', backgroundColor: '#49301de8',
      padding: { x: 10, y: 6 }, resolution: TEXT_RES,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(999999);
    if (playComfort.reducedMotion()) {
      this.time.delayedCall(2150, () => { this.toast?.destroy(); this.toast = null; });
    } else {
      this.tweens.add({ targets: this.toast, alpha: 0, y: 62, delay: 1700, duration: 450, onComplete: () => { this.toast?.destroy(); this.toast = null; } });
    }
  }

  private teardown(): void {
    this.qualityUnsubscribe?.(); this.qualityUnsubscribe = null;
    this.comfortUnsubscribe?.(); this.comfortUnsubscribe = null;
    this.activityTweens.length = 0;
    for (const marker of this.worldQuestMarkers) marker.destroy();
    this.worldQuestMarkers.length = 0;
    this.worldQuestMarkersSignature = '';
    if (this.districtBannerTimer !== null) window.clearTimeout(this.districtBannerTimer);
    this.districtBannerTimer = null;
    this.districtBanner?.remove(); this.districtBanner = null;
    this.collectionRoute?.destroy(); this.collectionRoute = null; this.collectionGuide = null;
    this.hud?.unmountActions(); this.touch?.destroy(); this.pet?.destroy(); this.playerAura?.destroy(); this.residents?.destroy(); this.hint?.remove();
    this.hunt?.destroy(); this.battleHud?.destroy();
    this.multiplayer?.destroy(); this.chat?.destroy(); this.chatFeed?.destroy(); this.onlineList?.destroy(); this.emotes?.destroy();
    for (const bubble of this.worldBubbles.values()) bubble.destroy();
    this.worldBubbles.clear();
    if (this.escHandler) document.removeEventListener('keydown', this.escHandler);
    this.communityProjectVisual?.destroy(); this.communityProjectVisual = null;
    this.sharedVillageProjectVisual?.destroy(); this.sharedVillageProjectVisual = null;
    this.unsubscribeSharedVillageProject?.(); this.unsubscribeSharedVillageProject = null;
    this.villageSearch?.destroy(); this.adventureRolePanel?.destroy(); this.starterConcierge?.destroy(); this.starterConcierge = null; this.quests?.destroy(); this.customize?.destroy(); this.petShop?.destroy(); this.petStyleStudio?.destroy(); this.shop?.destroy(); this.photoBooth?.destroy(); this.gardenPanel?.destroy(); this.cookingPanel?.destroy(); this.fishingPanel?.destroy(); this.cafe?.destroy(); this.busking?.destroy(); this.tasteShowcase?.destroy(); this.hobbyClubs?.destroy(); this.communityProjects?.destroy(); this.sharedVillageProject?.destroy(); this.neighborhoodTours?.destroy(); this.neighborhoodMuseum?.destroy(); this.neighborhoodMarket?.destroy();
    this.atmosphereFx?.destroy();
    this.mapPanel?.destroy(); this.alleySecrets?.destroy(); this.atmospherePanel?.destroy(); this.bag?.destroy(); this.dex?.destroy(); this.treasure?.destroy();
    this.residentsPanel?.destroy(); this.profilePanel?.destroy(); this.rankingPanel?.destroy();
    this.residentQuestDialogue?.destroy();
  }
}
