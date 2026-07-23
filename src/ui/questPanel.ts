import { QUEST_BY_ID, QUEST_CATEGORY_LABEL, type QuestCategory } from '../game/quests';
import type { QuestState, QuestView } from '../game/questProgress';
import { guideForQuest, recommendQuestGuides, selectQuestGuide } from '../game/questGuidance';
import type { BadgeRarity, BadgeView } from '../game/achievements';
import type { LifeMasteryView } from '../game/progression/lifeMastery';
import {
  LIFE_SPECIALTY_FEATURED_MAX, LifeSpecialtyStore, type LifeSpecialtyProgress,
} from '../game/progression/lifeSpecialty';
import {
  LIFE_SPECIALTY_ART_H, LIFE_SPECIALTY_ART_W, paintLifeSpecialtyArt,
} from '../game/art/lifeSpecialtyArt';
import {
  LIFE_SYNERGY_ART_H, LIFE_SYNERGY_ART_W, paintLifeSynergyArt,
} from '../game/art/lifeSynergyArt';
import {
  LIFE_SYNERGY_BY_ID, LIFE_SYNERGIES, recommendLifeSynergies,
} from '../game/progression/lifeSynergies';
import {
  villageJourneySummary, villagePassportRoutes, type VillageLevelView,
} from '../game/progression/villageJourney';
import { villageLevelRewardViews } from '../game/progression/villageRewards';
import {
  VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID, VILLAGE_LEVEL_MEMORY_DOMAINS, VILLAGE_LEVEL_MEMORY_LEVELS,
  VillageLevelMemoryStore, recommendedVillageLevelMemoryDomain,
  type VillageLevelMemoryDomainId, type VillageLevelMemoryLevel, type VillageLevelMemoryProgress,
} from '../game/progression/villageLevelMemories';
import {
  paintVillageLevelMemoryArt, VILLAGE_LEVEL_MEMORY_ART_H, VILLAGE_LEVEL_MEMORY_ART_W,
} from '../game/art/villageLevelMemoryArt';
import { DEFAULT_APPEARANCE, normalizeAppearance, type Appearance } from '../game/art/appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from '../game/art/characterArt';
import { PET_H, PET_W, paintPet } from '../game/art/petArt';
import type { PetAccessoryId } from '../game/pets/petProfiles';
import { paintFurnitureReformPreview, REFORM_PREVIEW_H, REFORM_PREVIEW_W } from '../game/art/furnitureReformArt';
import {
  VILLAGE_REQUEST_CATEGORY_LABEL, VILLAGE_REQUEST_MAX_ACTIVE, type VillageRequestCategory,
  type VillageRequestProgress, type VillageRequestStore, type VillageRequestView,
} from '../game/requests/villageRequests';
import {
  villageRequestDestinationForMetric, type VillageRequestStoryId, type VillageRequestStoryView,
} from '../game/requests/villageRequestStories';
import { paintRequestBoardArt, REQUEST_BOARD_ART_H, REQUEST_BOARD_ART_W } from '../game/art/requestBoardArt';
import {
  REQUEST_STORY_REWARD_BY_STORY, requestStoryRewardViews,
} from '../game/progression/requestStoryRewards';
import {
  StarterCompassPreferenceStore, starterCompassConciergeView, starterCompassRouteViews,
  type StarterCompassKeepsakeProgress, type StarterCompassRouteId, type StarterCompassRouteView,
} from '../game/progression/starterCompass';
import {
  paintStarterCompassArt, paintStarterKeepsakeArt,
  STARTER_COMPASS_ART_H, STARTER_COMPASS_ART_W, STARTER_KEEPSAKE_ART_H, STARTER_KEEPSAKE_ART_W,
} from '../game/art/starterCompassArt';
import {
  paintStarterMentorArt, STARTER_MENTOR_ART_H, STARTER_MENTOR_ART_W,
} from '../game/art/starterMentorArt';
import { STARTER_MENTOR_REWARD_BY_ROUTE } from '../game/progression/starterMentorRewards';
import {
  ADVENTURE_PATH_PIN_MAX, AdventurePathPassportStore, adventurePathViews, recommendAdventurePaths,
  type AdventurePathId, type AdventurePathPassportProgress,
} from '../game/progression/adventurePaths';
import {
  ADVENTURE_PATH_ART_H, ADVENTURE_PATH_ART_W, paintAdventurePathArt,
} from '../game/art/adventurePathArt';
import {
  ADVENTURE_PATH_ROOM_ART_H, ADVENTURE_PATH_ROOM_ART_W, paintAdventurePathRoomArt,
} from '../game/art/adventurePathRoomArt';
import {
  type FestivalArchiveProgress, type FestivalArchiveStore, type FestivalId,
} from '../game/events/festivalArchive';
import {
  FESTIVAL_ART_H, FESTIVAL_ART_W, paintFestivalArchiveArt,
} from '../game/art/festivalArchiveArt';
import {
  VillageChronicleStore, villageChronicleViews,
  type ChronicleMotifId, type ChronicleProgress,
} from '../game/progression/villageChronicle';
import {
  CHRONICLE_ART_H, CHRONICLE_ART_W, paintVillageChronicleArt,
} from '../game/art/villageChronicleArt';
import { journeyChapterRewardViews } from '../game/progression/journeyChapterRewards';
import {
  DAILY_INVITATIONS, DailyInvitationStore, type DailyInvitationProgress,
} from '../game/progression/dailyInvitations';
import {
  DAILY_INVITATION_ART_H, DAILY_INVITATION_ART_W, paintDailyInvitationArt,
} from '../game/art/dailyInvitationArt';
import {
  SESSION_PLAN_MAX, SessionPlannerStore,
  type SessionPlannerProgress,
} from '../game/progression/sessionPlanner';
import {
  paintSessionPlannerArt, SESSION_PLANNER_ART_H, SESSION_PLANNER_ART_W,
} from '../game/art/sessionPlannerArt';
import {
  FAN_MERCH_FEATURED_MAX, FAN_MERCH_FORMATS, FAN_MERCH_MOTIFS, FAN_MERCH_SLOT_COUNT,
  FanMerchWorkshopStore, type FanMerchDraft, type FanMerchFormatId,
  type FanMerchMotifId, type FanMerchSubject, type FanMerchWorkshopProgress,
} from '../game/progression/fanMerchWorkshop';
import {
  FAN_MERCH_ART_H, FAN_MERCH_ART_W, paintFanMerchArt,
} from '../game/art/fanMerchArt';
import { petById } from '../game/pets/pets';
import { RESIDENTS, trustOf, type TrustState } from '../game/residents/residents';

type JournalTab = 'recommended' | 'chronicle' | 'paths' | 'festivals' | 'fanwork' | 'journey' | 'requests' | 'growth' | 'badges' | QuestCategory;

const TABS: { id: JournalTab; label: string }[] = [
  { id: 'recommended', label: '추천' },
  { id: 'chronicle', label: '메인' },
  { id: 'paths', label: '진로' },
  { id: 'festivals', label: '축제' },
  { id: 'fanwork', label: '굿즈' },
  { id: 'journey', label: '여정' },
  { id: 'requests', label: '의뢰소' },
  { id: 'growth', label: '생활' },
  { id: 'onboarding', label: '첫걸음' },
  { id: 'daily', label: '오늘' },
  { id: 'story', label: '이야기' },
  { id: 'collection', label: '수집' },
  { id: 'mastery', label: '숙련' },
  { id: 'badges', label: '배지함' },
];

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: '일반', uncommon: '특별', rare: '희귀', epic: '영웅',
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

function objectParticle(text: string): '을' | '를' {
  const code = text.charCodeAt(text.length - 1) - 0xac00;
  return code >= 0 && code <= 0x2ba3 && code % 28 !== 0 ? '을' : '를';
}

/** 여러 게임 시스템을 한 흐름으로 안내하는 모험 일지. */
export class QuestPanel {
  private root: HTMLDivElement;
  private opened = false;
  private views: QuestView[] = [];
  private badges: BadgeView[] = [];
  private masteries: LifeMasteryView[] = [];
  private focusedQuestId: string | null = null;
  private tab: JournalTab = 'recommended';
  private requestFilter: 'all' | VillageRequestCategory = 'all';
  private requestMode: 'board' | 'stories' = 'board';
  private selectedRequestStoryId: VillageRequestStoryId | null = null;
  private selectedAdventurePathId: AdventurePathId | null = null;
  private readonly adventurePathPassport: AdventurePathPassportStore;
  private adventurePathFeedback = '';
  private selectedFestivalId: FestivalId | null = null;
  private festivalFeedback = '';
  private requestFeedback = '';
  private selectedChronicleId: string | null = null;
  private chronicleFeedback = '';
  private readonly chronicle: VillageChronicleStore;
  private readonly starterPreference: StarterCompassPreferenceStore;
  private starterFeedback = '';
  private selectedStarterMentorRouteId: StarterCompassRouteId | null = null;
  private selectedStarterMentorChapterId: string | null = null;
  private readonly lifeSpecialty: LifeSpecialtyStore;
  private readonly villageLevelMemories: VillageLevelMemoryStore;
  private selectedLevelMemoryLevel: VillageLevelMemoryLevel | null = null;
  private levelMemoryFeedback = '';
  private specialtyFeedback = '';
  private readonly dailyInvitations: DailyInvitationStore;
  private dailyInvitationFeedback = '';
  private readonly sessionPlanner: SessionPlannerStore;
  private sessionPlannerFeedback = '';
  private readonly fanMerch: FanMerchWorkshopStore;
  private selectedFanMerchSubjectKey = 'self:self';
  private selectedFanMerchFormatId: FanMerchFormatId = FAN_MERCH_FORMATS[0].id;
  private selectedFanMerchMotifId: FanMerchMotifId = FAN_MERCH_MOTIFS[0].id;
  private selectedFanMerchSlot = 0;
  private pendingFanMerchOverwriteSlot: number | null = null;
  private fanMerchFeedback = '';
  private online: boolean;

  constructor(userId: string, private readonly opts: {
    onClaim: (questId: string) => void;
    onEquipBadge: (badgeId: string) => void;
    onFocus: (questId: string | null) => void;
    onToggle: (open: boolean) => void;
    online: boolean;
    requestBoard: VillageRequestStore;
    festivalArchive: FestivalArchiveStore;
    getQuestState: () => QuestState;
    onRequestChanged: (progress: VillageRequestProgress) => void;
    onFestivalChanged: (progress: FestivalArchiveProgress) => void;
    onChronicleChanged: (progress: ChronicleProgress) => void;
    onLifeSpecialtyChanged: (progress: LifeSpecialtyProgress) => void;
    onDailyInvitationsChanged: (progress: DailyInvitationProgress) => void;
    onSessionPlannerChanged?: (progress: SessionPlannerProgress) => void;
    onFanMerchChanged?: (progress: FanMerchWorkshopProgress) => void;
    onStarterCompassChanged?: (progress: StarterCompassKeepsakeProgress) => void;
    onAdventurePathsChanged?: (progress: AdventurePathPassportProgress) => void;
    onVillageLevelMemoriesChanged?: (progress: VillageLevelMemoryProgress) => void;
    onRequestNavigate?: (metric: string, title: string) => void;
    onOpenVillageReward?: (target: 'outfit' | 'pet' | 'home') => void;
    getAppearance?: () => Appearance;
    getPet?: () => { speciesId: string; accessory: PetAccessoryId } | null;
    getResidentTrust?: () => TrustState;
  }) {
    this.chronicle = new VillageChronicleStore(userId);
    this.adventurePathPassport = new AdventurePathPassportStore(userId);
    this.starterPreference = new StarterCompassPreferenceStore(userId);
    this.lifeSpecialty = new LifeSpecialtyStore(userId);
    this.villageLevelMemories = new VillageLevelMemoryStore(userId);
    this.dailyInvitations = new DailyInvitationStore(userId);
    this.sessionPlanner = new SessionPlannerStore(userId);
    this.fanMerch = new FanMerchWorkshopStore(userId);
    this.online = opts.online;
    this.root = document.createElement('div');
    this.root.className = 'hv-quest';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }
  chronicleProgress(): ChronicleProgress { return this.chronicle.progress(); }
  lifeSpecialtyProgress(masteries: readonly LifeMasteryView[]): LifeSpecialtyProgress {
    return this.lifeSpecialty.progress(masteries);
  }
  featuredLifeSpecialtyIds(masteries: readonly LifeMasteryView[]): string[] {
    return this.lifeSpecialty.views(masteries).filter((card) => card.featured && card.unlocked).map((card) => card.id);
  }
  /** 개발 회귀 화면에서 실제 저장·발견 경로를 거쳐 대표 덱을 준비한다. */
  previewLifeSpecialtyDeck(cardIds: readonly string[], masteries: readonly LifeMasteryView[]): LifeSpecialtyProgress {
    for (const id of this.lifeSpecialty.featuredIds()) this.lifeSpecialty.toggle(id, masteries);
    for (const id of cardIds.slice(0, LIFE_SPECIALTY_FEATURED_MAX)) this.lifeSpecialty.toggle(id, masteries);
    return this.lifeSpecialty.progress(masteries);
  }
  dailyInvitationProgress(masteries: readonly LifeMasteryView[]): DailyInvitationProgress {
    return this.dailyInvitations.progress(this.opts.getQuestState(), this.featuredLifeSpecialtyIds(masteries));
  }
  sessionPlannerProgress(): SessionPlannerProgress { return this.sessionPlanner.progress(); }
  fanMerchProgress(): FanMerchWorkshopProgress { return this.fanMerch.progress(); }
  starterCompassProgress(): StarterCompassKeepsakeProgress { return this.starterPreference.progress(); }
  starterCompassSelectedRouteId(): StarterCompassRouteId | null {
    return this.starterPreference.get().selectedRouteId;
  }
  selectStarterCompassRoute(routeId: StarterCompassRouteId): boolean {
    const changed = this.starterPreference.select(routeId);
    if (changed && this.opened) this.render();
    return changed;
  }
  adventurePathPassportProgress(): AdventurePathPassportProgress { return this.adventurePathPassport.progress(); }
  villageLevelMemoryProgress(): VillageLevelMemoryProgress { return this.villageLevelMemories.progress(); }
  /** 개발 회귀 화면에서 실제 수령·장 보존 경로를 거쳐 멘토 연대기를 준비한다. */
  previewStarterMentor(routeId: StarterCompassRouteId, chapterCount = 2): StarterCompassKeepsakeProgress {
    this.starterPreference.claim(routeId, true);
    const chapters = this.starterPreference.mentorViews(this.opts.getQuestState())
      .filter((chapter) => chapter.routeId === routeId)
      .slice(0, Math.max(0, Math.min(3, chapterCount)));
    for (const chapter of chapters) this.starterPreference.claimMentorChapter(chapter.id, this.opts.getQuestState());
    this.selectedStarterMentorRouteId = routeId;
    this.selectedStarterMentorChapterId = chapters.at(-1)?.id ?? null;
    return this.starterPreference.progress();
  }

  open(
    views: QuestView[],
    badges: BadgeView[] = [],
    masteries: LifeMasteryView[] = [],
    focusedQuestId: string | null = null,
    initialTab?: JournalTab,
  ): void {
    if (this.opened) return;
    this.opened = true;
    this.views = views;
    this.badges = badges;
    this.masteries = masteries;
    this.dailyInvitationProgress(masteries);
    this.focusedQuestId = focusedQuestId;
    if (initialTab) this.tab = initialTab;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  markClaimed(questId: string): void {
    this.views = this.views.map((q) => q.id === questId ? { ...q, claimed: true } : q);
    if (this.opened) this.render();
  }

  refresh(
    views: QuestView[],
    badges: BadgeView[] = this.badges,
    masteries: LifeMasteryView[] = this.masteries,
    focusedQuestId: string | null = this.focusedQuestId,
  ): void {
    this.views = views;
    this.badges = badges;
    this.masteries = masteries;
    this.focusedQuestId = focusedQuestId;
    if (this.opened) this.render();
  }

  private recommended(): QuestView[] {
    const picked = recommendQuestGuides(this.views, this.focusedQuestId).map((guide) => guide.quest);
    if (picked.length) return picked;
    return this.views.filter((q) => q.unlocked).slice(0, 6);
  }

  private visible(): QuestView[] {
    if (this.tab === 'recommended') return this.recommended();
    if (this.tab === 'badges' || this.tab === 'growth' || this.tab === 'chronicle' || this.tab === 'paths' || this.tab === 'festivals' || this.tab === 'fanwork' || this.tab === 'journey' || this.tab === 'requests') return [];
    return this.views
      .filter((q) => q.category === this.tab)
      .sort((a, b) => Number(a.done) - Number(b.done) || a.order - b.order);
  }

  private badgesHtml(): string {
    const unlocked = this.badges.filter((badge) => badge.unlocked).length;
    const cards = [...this.badges]
      .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
      .map((badge) => `<article class="badge-card ${badge.unlocked ? 'unlocked' : 'locked'} ${badge.equipped ? 'equipped' : ''}" data-rarity="${badge.rarity}">
        <div class="badge-medal"><i></i><span>${badge.unlocked ? '◆' : '?'}</span></div>
        <div class="badge-copy">
          <small>${RARITY_LABEL[badge.rarity]} · ${QUEST_CATEGORY_LABEL[badge.category]}</small>
          <b>${badge.unlocked ? badge.name : '아직 잠긴 배지'}</b>
          <span>${badge.source} — ${badge.hint}</span>
        </div>
        ${badge.unlocked
          ? `<button data-badge="${badge.id}" ${badge.equipped ? 'disabled' : ''}>${badge.equipped ? '장착 중' : '장착'}</button>`
          : '<em>잠김</em>'}
      </article>`).join('');
    return `<div class="badge-summary"><b>나의 배지함</b><span>${unlocked} / ${this.badges.length} 획득 · 하나를 골라 이름표에 장착할 수 있어요.</span></div>${cards}`;
  }

  private masteriesHtml(): string {
    if (!this.masteries.length) {
      return '<p class="quest-empty">생활 기록을 불러오는 중이에요.</p>';
    }
    const totalLevel = this.masteries.reduce((total, mastery) => total + mastery.level, 0);
    const minimumLevel = Math.min(...this.masteries.map((mastery) => mastery.level));
    const specialty = [...this.masteries].sort((a, b) => b.level - a.level || b.xp - a.xp)[0]!;
    const specialtyViews = this.lifeSpecialty.views(this.masteries);
    const specialtyProgress = this.lifeSpecialty.progress(this.masteries);
    const featured = specialtyViews.filter((card) => card.featured && card.unlocked);
    const currentSynergy = specialtyProgress.currentSynergyId
      ? LIFE_SYNERGY_BY_ID.get(specialtyProgress.currentSynergyId) ?? null : null;
    const discoveredSynergies = new Set(this.lifeSpecialty.discoveredSynergyIds());
    const masteryNames = new Map(this.masteries.map((mastery) => [mastery.id, mastery.name]));
    const synergyRecommendations = recommendLifeSynergies(
      featured.map((card) => card.masteryId), discoveredSynergies, 3,
    );
    const featuredSlots = Array.from({ length: LIFE_SPECIALTY_FEATURED_MAX }, (_, index) => {
      const card = featured[index];
      return card
        ? `<article><canvas width="${LIFE_SPECIALTY_ART_W}" height="${LIFE_SPECIALTY_ART_H}" data-life-specialty-art="${card.id}" aria-label="${escapeHtml(card.title)} 픽셀 자격 카드"></canvas><span><small>${card.mark} · TIER ${card.tier}</small><b>${escapeHtml(card.title)}</b><em>${escapeHtml(card.keepsake)}</em></span></article>`
        : `<article class="is-empty"><i>${index + 1}</i><span><small>FREE FAVORITE SLOT</small><b>마음에 든 자격을 골라 주세요</b><em>언제든 무료로 바꿀 수 있어요.</em></span></article>`;
    }).join('');
    const synergyArchive = LIFE_SYNERGIES.map((synergy, index) => {
      const discovered = discoveredSynergies.has(synergy.id);
      const current = currentSynergy?.id === synergy.id;
      return `<article class="${discovered ? 'is-discovered' : 'is-hidden'} ${current ? 'is-current' : ''}" style="--synergy-index:${index};--synergy-color:${synergy.palette[1]}">
        <canvas width="${LIFE_SYNERGY_ART_W}" height="${LIFE_SYNERGY_ART_H}" data-life-synergy-art="${synergy.id}" data-discovered="${discovered}" aria-label="${escapeHtml(discovered ? synergy.title : '아직 발견하지 않은 생활 시너지')} 픽셀 카드"></canvas>
        <span><small>${discovered ? 'DISCOVERED' : synergy.domains.map((domain) => masteryNames.get(domain)?.slice(0, 2) ?? domain).join(' · ')}</small><b>${escapeHtml(discovered ? synergy.title : '미발견 생활 조합')}</b><em>${escapeHtml(discovered ? synergy.keepsake : '서로 다른 대표 전문성 세 장을 조합해 보세요.')}</em></span>
      </article>`;
    }).join('');
    const synergyHero = currentSynergy
      ? `<section class="life-synergy-current" style="--synergy-light:${currentSynergy.palette[0]};--synergy-color:${currentSynergy.palette[1]};--synergy-deep:${currentSynergy.palette[2]}">
          <canvas width="${LIFE_SYNERGY_ART_W}" height="${LIFE_SYNERGY_ART_H}" data-life-synergy-art="${currentSynergy.id}" data-discovered="true" aria-label="${escapeHtml(currentSynergy.title)} 픽셀 시너지 카드"></canvas>
          <div><small>CURRENT LIFE SYNERGY · ${currentSynergy.domains.map((domain) => masteryNames.get(domain) ?? domain).join(' + ')}</small><h4>${escapeHtml(currentSynergy.title)}</h4><b>${escapeHtml(currentSynergy.epithet)}</b><p>${escapeHtml(currentSynergy.description)}</p><em>영구 발견 표식 · ${escapeHtml(currentSynergy.keepsake)}</em></div>
        </section>`
      : `<section class="life-synergy-empty">
          <i>결</i><div><small>LIFE SYNERGY RESEARCH · NO STAT BONUS</small><h4>${featured.length < 3 ? `대표 전문성 ${3 - featured.length}장을 더 골라 주세요` : '새 생활 조합을 연구해 볼까요?'}</h4><p>서로 다른 세 분야가 맞으면 고유 호칭과 픽셀 표식을 영구 발견합니다. 조합을 바꿔도 발견 기록은 사라지지 않아요.</p></div>
          <aside>${synergyRecommendations.map((synergy) => `<span style="--hint-color:${synergy.palette[1]}"><b>${escapeHtml(synergy.title)}</b><small>${synergy.domains.map((domain) => masteryNames.get(domain) ?? domain).join(' + ')}</small></span>`).join('')}</aside>
        </section>`;
    const cards = this.masteries.map((mastery) => {
      const action = mastery.nextAction;
      const actionProgress = action ? Math.min(action.current, action.goal) : 0;
      const licenses = specialtyViews.filter((card) => card.masteryId === mastery.id).map((card) => `<button
        class="life-specialty-card ${card.unlocked ? 'is-unlocked' : 'is-locked'} ${card.featured ? 'is-featured' : ''}"
        data-life-specialty="${card.id}" ${card.unlocked || card.featured ? '' : 'disabled'}>
        <canvas width="${LIFE_SPECIALTY_ART_W}" height="${LIFE_SPECIALTY_ART_H}" data-life-specialty-art="${card.id}" aria-hidden="true"></canvas>
        <span><small>Lv.${card.unlockLevel} · TIER ${card.tier}</small><b>${escapeHtml(card.unlocked ? card.title : '아직 비어 있는 자격')}</b><em>${escapeHtml(card.unlocked ? card.line : `${mastery.name} Lv.${card.unlockLevel}에 자동 해금`)}</em></span>
        <strong>${card.featured ? '★ 대표' : card.unlocked ? '전시' : '잠김'}</strong>
      </button>`).join('');
      return `<article class="life-mastery-card" data-mastery="${mastery.id}">
        <div class="life-mastery-mark">${mastery.mark}</div>
        <div class="life-mastery-copy">
          <div class="life-mastery-title"><b>${mastery.name}</b><span>${mastery.rank} · 목표 ${mastery.objectivesDone}/${mastery.objectives.length}</span></div>
          <p>${mastery.description}</p>
          <div class="life-mastery-progress"><i style="width:${mastery.progressPct}%"></i></div>
          <small>${mastery.level >= 10 ? '최고 레벨 달성' : `다음 레벨 ${mastery.levelXp} / ${mastery.levelGoal} XP`}</small>
          <div class="life-mastery-next">
            <em>${action ? '다음 추천' : '추천 완료'}</em>
            <div><b>${action?.label ?? '이 분야의 모든 추천 목표를 마쳤어요'}</b><span>${action ? `${action.location} · ${actionProgress}/${action.goal}` : '좋아하는 활동을 계속하면 평생 기록이 쌓여요.'}</span></div>
            ${action ? `<button data-life-guide="${escapeHtml(action.key)}" data-life-guide-title="${escapeHtml(action.label)}">길 안내</button>` : ''}
          </div>
          <div class="life-specialty-license-strip">${licenses}</div>
        </div>
        <div class="life-mastery-level"><span>Lv.</span><strong>${mastery.level}</strong><small>${mastery.level >= 5 ? '휘장 해금' : `Lv.5 ${mastery.reward}`}</small></div>
      </article>`;
    }).join('');
    return `<section class="life-specialty-hero">
      <header><div><small>LIFE SPECIALTY BOARD · NO RESET COST</small><h3>나의 생활 전문성 보드</h3><p>열 분야를 즐기면 Lv.2·5·8에 자격 카드가 자동으로 열려요. 능력치 차이나 전직 실패 없이, 최애 세 장만 자기소개처럼 전시합니다.</p></div><aside><strong>${specialtyProgress.unlockedCards}<i>/${specialtyProgress.totalCards}</i></strong><span>영구 자격 카드</span><small>${specialtyProgress.masteredDomains}/10 분야 최고 자격</small></aside></header>
      <div class="life-specialty-featured">${featuredSlots}</div>
      ${synergyHero}
      ${this.specialtyFeedback ? `<p>${escapeHtml(this.specialtyFeedback)}</p>` : ''}
      <details class="life-synergy-archive"><summary><span><b>생활 시너지 도감</b><small>능력치 우열 없는 조합 호칭 18종</small></span><strong>${specialtyProgress.discoveredSynergies}<i>/${specialtyProgress.totalSynergies}</i></strong></summary><div>${synergyArchive}</div></details>
    </section>
    <section class="life-mastery-summary">
      <div class="life-total"><span>생활 숙련 합계</span><strong>${totalLevel}<i>/ 100</i></strong></div>
      <div class="life-focus"><span>현재 전문 분야</span><b>${specialty.name} Lv.${specialty.level}</b><small>전 분야 최저 Lv.${minimumLevel} · 모두 Lv.3이면 만능 생활인 휘장</small></div>
    </section>
    <p class="life-mastery-guide">퀘스트를 끝낸 뒤에도 같은 활동의 평생 기록은 계속 쌓여요. 하고 싶은 분야부터 천천히 키워도 됩니다.</p>
    ${cards}`;
  }

  private paintLifeSpecialties(): void {
    const views = new Map(this.lifeSpecialty.views(this.masteries).map((card) => [card.id, card]));
    this.root.querySelectorAll<HTMLCanvasElement>('[data-life-specialty-art]').forEach((canvas) => {
      const card = views.get(canvas.dataset.lifeSpecialtyArt!);
      if (card) paintLifeSpecialtyArt(canvas, card);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-life-synergy-art]').forEach((canvas) => {
      const synergy = LIFE_SYNERGY_BY_ID.get(canvas.dataset.lifeSynergyArt!);
      if (synergy) paintLifeSynergyArt(canvas, synergy, canvas.dataset.discovered === 'true');
    });
  }

  private dailyInvitationsHtml(): string {
    const questState = this.opts.getQuestState();
    const featured = this.featuredLifeSpecialtyIds(this.masteries);
    const invitations = this.dailyInvitations.views(questState, featured);
    const progress = this.dailyInvitations.progress(questState, featured);
    const stamped = new Set(this.dailyInvitations.stampIds());
    const cards = invitations.map((invitation) => {
      const pct = Math.round((invitation.current / invitation.goal) * 100);
      const action = invitation.claimed
        ? '<button disabled>오늘 도장 완료</button>'
        : invitation.done
          ? `<button class="daily-invitation-claim" data-daily-invite-claim="${invitation.id}">도장 찍기</button>`
          : `<button data-daily-invite-guide="${invitation.metric}" data-daily-invite-title="${escapeHtml(invitation.title)}">길 안내</button><button class="daily-invitation-reroll" data-daily-invite-reroll="${invitation.slot}">다른 초대</button>`;
      return `<article class="daily-invitation-card ${invitation.done ? 'is-done' : ''} ${invitation.claimed ? 'is-claimed' : ''}">
        <canvas width="${DAILY_INVITATION_ART_W}" height="${DAILY_INVITATION_ART_H}" data-daily-invitation-art="${invitation.id}" aria-label="${escapeHtml(invitation.title)} 픽셀 초대장"></canvas>
        <div class="daily-invitation-copy"><small>${escapeHtml(invitation.location)}</small><h4>${escapeHtml(invitation.title)}</h4><p>${escapeHtml(invitation.description)}</p>
          <div class="daily-invitation-progress"><i style="width:${pct}%"></i></div><span>${invitation.current} / ${invitation.goal}</span></div>
        <footer>${action}</footer>
      </article>`;
    }).join('');
    const stampShelf = DAILY_INVITATIONS.map((invitation, index) => `<li class="${stamped.has(invitation.id) ? 'is-stamped' : ''}" title="${escapeHtml(invitation.title)}"><i>${stamped.has(invitation.id) ? invitation.mark : index + 1}</i><span>${escapeHtml(invitation.title)}</span></li>`).join('');
    return `<section class="daily-invitation-hero">
      <div><small>PERSONALIZED DAILY POST · NO FOMO</small><h3>오늘 도착한 생활 초대장</h3><p>대표 전문성과 생활 기록을 보고 세 장만 골랐어요. 연속 출석·실패·비용은 없고, 마음이 다르면 무료로 바꿀 수 있습니다.</p></div>
      <aside><strong>${progress.todayClaimed}<i>/${progress.todaySlots}</i></strong><span>오늘 남긴 도장</span><small>영구 수집 ${progress.uniqueStamps}/${progress.totalStamps}</small></aside>
    </section>
    ${this.dailyInvitationFeedback ? `<p class="daily-invitation-feedback">${escapeHtml(this.dailyInvitationFeedback)}</p>` : ''}
    <section class="daily-invitation-grid">${cards}</section>
    <details class="daily-invitation-stamps" ${progress.uniqueStamps ? '' : 'open'}><summary><span><small>PERMANENT STAMP BOOK</small><b>생활 초대장 도장책</b></span><strong>${progress.uniqueStamps}/30 · ${progress.stampedDomains}/10 분야</strong></summary><ol>${stampShelf}</ol><p>같은 초대도 다시 즐길 수 있지만, 첫 도장 30개는 수집책에 영구 보존돼요. 오늘 못 해도 불이익은 없습니다.</p></details>`;
  }

  private paintDailyInvitations(): void {
    const views = new Map(this.dailyInvitations.views(
      this.opts.getQuestState(), this.featuredLifeSpecialtyIds(this.masteries),
    ).map((invitation) => [invitation.id, invitation]));
    this.root.querySelectorAll<HTMLCanvasElement>('[data-daily-invitation-art]').forEach((canvas) => {
      const invitation = views.get(canvas.dataset.dailyInvitationArt!);
      if (invitation) paintDailyInvitationArt(canvas, invitation);
    });
  }

  private levelMemoryHtml(level: VillageLevelView): string {
    const available = VILLAGE_LEVEL_MEMORY_LEVELS.filter((milestone) => milestone <= level.level);
    if (!available.length) {
      return `<section class="level-memory-album is-locked"><header><div><small>LEVEL MEMORY ALBUM</small><h3>나의 레벨업 장면</h3><p>마을 Lv.5부터 그때의 성장을 한 장면으로 남길 수 있어요. 보상과 능력치는 어떤 장면을 골라도 같아요.</p></div><strong>Lv.5에 첫 장</strong></header></section>`;
    }
    if (!this.selectedLevelMemoryLevel || !available.includes(this.selectedLevelMemoryLevel)) {
      this.selectedLevelMemoryLevel = available.at(-1)!;
    }
    const state = this.villageLevelMemories.get();
    const progress = this.villageLevelMemories.progress();
    const selectedLevel = this.selectedLevelMemoryLevel;
    const entry = state.entries.find((item) => item.level === selectedLevel);
    const recommendedId = recommendedVillageLevelMemoryDomain(level.xpBreakdown);
    const domainId = entry?.domainId ?? recommendedId;
    const domain = VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.get(domainId)!;
    return `<section class="level-memory-album" style="--memory-color:${domain.color}">
      <header><div><small>PERMANENT LEVEL MEMORY · NO BUILD LOCK</small><h3>나의 레벨업 장면 앨범</h3><p>그 레벨이 어떤 하루였는지 한 장면으로 남겨요. 선택은 언제든 바꿀 수 있고 코디·펫·집 보상은 모두 자동 지급됩니다.</p></div><aside><strong>${progress.saved}<i>/6</i></strong><span>보존한 장면 · ${progress.domains}/6 취향</span></aside></header>
      ${this.levelMemoryFeedback ? `<p class="level-memory-feedback" role="status">${escapeHtml(this.levelMemoryFeedback)}</p>` : ''}
      <nav class="level-memory-levels" aria-label="레벨업 장면 목록">${VILLAGE_LEVEL_MEMORY_LEVELS.map((milestone) => {
        const saved = state.entries.find((item) => item.level === milestone);
        const savedDomain = saved ? VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.get(saved.domainId) : null;
        const unlocked = milestone <= level.level;
        return `<button data-level-memory-level="${milestone}" class="${milestone === selectedLevel ? 'is-selected' : ''} ${saved ? 'is-saved' : ''}" ${unlocked ? '' : 'disabled'} style="--memory-color:${savedDomain?.color ?? '#776c67'}"><i>${savedDomain?.mark ?? milestone}</i><span><small>VILLAGE LEVEL</small><b>Lv.${milestone}</b><em>${savedDomain ? escapeHtml(savedDomain.name) : unlocked ? '장면 선택 가능' : '아직 잠든 장'}</em></span></button>`;
      }).join('')}</nav>
      <div class="level-memory-book">
        <div class="level-memory-scene"><canvas width="${VILLAGE_LEVEL_MEMORY_ART_W}" height="${VILLAGE_LEVEL_MEMORY_ART_H}" data-level-memory-art="${selectedLevel}" aria-label="마을 레벨 ${selectedLevel} ${escapeHtml(domain.name)} 아이소메트릭 픽셀 추억"></canvas><span>${entry ? '영구 보존됨 · 다시 골라도 기록 손실 없음' : `현재 XP에서 「${escapeHtml(domain.name)}」 추천`}</span></div>
        <section><header><i>${domain.mark}</i><div><small>LV.${selectedLevel} · ${entry ? 'SAVED MEMORY' : 'MEMORY PREVIEW'}</small><h4>${escapeHtml(domain.name)}</h4><p>${escapeHtml(domain.subtitle)}</p></div></header>
          <div class="level-memory-domains">${VILLAGE_LEVEL_MEMORY_DOMAINS.map((item) => `<button data-level-memory-domain="${item.id}" class="${item.id === domainId ? 'is-selected' : ''}" style="--memory-color:${item.color}"><i>${item.mark}</i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.subtitle)}</small></span>${entry?.domainId === item.id ? '<strong>보존 중</strong>' : item.id === recommendedId ? '<strong>추천</strong>' : ''}</button>`).join('')}</div>
          <footer><span><small>이 장면 다음 제안</small><b>${escapeHtml(domain.nextAction)}</b><em>${escapeHtml(domain.location)}</em></span><strong>보상 제한 없음 · 무료 변경</strong></footer>
        </section>
      </div>
    </section>`;
  }

  private journeyHtml(): string {
    const summary = villageJourneySummary(this.views, this.masteries);
    const level = summary.level;
    const next = level.nextMilestone;
    const passportRoutes = villagePassportRoutes(level.level);
    const activePassportRoute = passportRoutes.find((route) => route.status === 'active') ?? passportRoutes.at(-1)!;
    const currentStamp = activePassportRoute.stamps.find((stamp) => stamp.status === 'current') ?? activePassportRoute.stamps.at(-1)!;
    const xpSources = [
      ['생활 활동', level.xpBreakdown.life],
      ['이야기', level.xpBreakdown.stories],
      ['수집', level.xpBreakdown.collections],
      ['숙련 목표', level.xpBreakdown.mastery],
      ['첫걸음', level.xpBreakdown.firstSteps],
    ] as const;
    const rewardViews = villageLevelRewardViews(this.badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
    const chapterCards = summary.chapters.map((chapter) => {
      const statusLabel = chapter.status === 'complete' ? '완료 도장' : chapter.status === 'active' ? '진행 중' : '다음 장';
      const previous = summary.chapters[chapter.chapter - 2];
      const objectives = chapter.status === 'locked' ? '' : `<div class="journey-objectives">${chapter.objectives.map((objective) => {
        const pct = Math.round((Math.min(objective.progress, objective.goal) / objective.goal) * 100);
        const action = objective.done
          ? '<span class="journey-objective-done">기록 완료</span>'
          : objective.unlocked
            ? `<button data-focus="${objective.id}">${this.focusedQuestId === objective.id ? '추적 해제' : '목표 추적'}</button>`
            : '<span class="journey-objective-locked">선행 기록부터</span>';
        return `<article class="journey-objective ${objective.done ? 'done' : ''}">
          <i aria-hidden="true"></i><div><b>${escapeHtml(objective.name)}</b><span>${escapeHtml(objective.location)}</span>
          <em><i style="width:${pct}%"></i></em></div><strong>${objective.done ? '완료' : `${objective.progress}/${objective.goal}`}</strong>${action}
        </article>`;
      }).join('')}</div>`;
      return `<section class="journey-chapter is-${chapter.status}" style="--journey-index:${chapter.chapter - 1}">
        <header><div class="journey-chapter-mark"><small>${String(chapter.chapter).padStart(2, '0')}</small><b>${chapter.mark}</b></div>
          <div><small>CHAPTER ${String(chapter.chapter).padStart(2, '0')}</small><h4>${escapeHtml(chapter.title)}</h4><p>${escapeHtml(chapter.description)}</p></div>
          <aside><span>${statusLabel}</span><strong>${Math.min(chapter.completed, chapter.required)}/${chapter.required}</strong></aside>
        </header>
        ${chapter.status === 'locked'
          ? `<p class="journey-locked-copy">「${escapeHtml(previous?.title ?? '이전 여정')}」에서 필요한 기록을 채우면 자동으로 펼쳐져요. 미리 한 활동도 사라지지 않습니다.</p>`
          : objectives}
        <footer><span>장 완료 보상</span><b>${escapeHtml(chapter.reward)}</b></footer>
      </section>`;
    }).join('');

    const passportLedger = `<section class="journey-passport-ledger">
      <header><div><small>PERMANENT VILLAGE PASSPORT</small><h3>나의 50레벨 골목 여권</h3><p>시즌 종료나 수령 기한 없이, 오른 레벨은 모두 한 칸씩 영구 기록됩니다.</p></div><aside><span>현재 도장</span><b>Lv.${currentStamp.level} · ${escapeHtml(currentStamp.name)}</b><small>${level.level >= 50 ? '50개 도장을 모두 기록했어요.' : `다음 레벨까지 ${level.xpToNextLevel.toLocaleString()} XP`}</small></aside></header>
      <div class="journey-passport-route">${passportRoutes.map((route, routeIndex) => `<article class="is-${route.status}" style="--passport-index:${routeIndex}">
        <div class="journey-passport-route-copy"><i>${route.mark}</i><span><small>Lv.${route.startLevel}—${route.endLevel}</small><b>${escapeHtml(route.title)}</b><em>${escapeHtml(route.description)}</em></span><strong>${route.recorded}<small>/5</small></strong></div>
        <ol>${route.stamps.map((stamp) => `<li class="is-${stamp.status}"${stamp.majorReward ? ' data-major-reward="true"' : ''}><span>${stamp.level}</span><b>${escapeHtml(stamp.name)}</b>${stamp.majorReward ? `<small>${escapeHtml(stamp.majorReward.reward)}</small>` : ''}</li>`).join('')}</ol>
      </article>`).join('')}</div>
    </section>`;

    const rewardLedger = `<section class="journey-reward-ledger">
      <header><div><small>LEVEL REWARD PASSPORT</small><h3>마을 레벨 보상 수첩</h3><p>명찰을 얻는 순간 세 보상이 함께 자동 수령됩니다. 수령 버튼이나 기간 제한은 없어요.</p></div><strong>${rewardViews.filter((reward) => reward.unlocked).length}<i>/${rewardViews.length}</i></strong></header>
      <div class="journey-reward-grid">${rewardViews.map((reward, index) => `<article class="journey-reward-card ${reward.unlocked ? 'is-unlocked' : 'is-locked'}" style="--reward-index:${index}">
        <div class="journey-reward-level"><small>VILLAGE</small><b>${reward.level}</b><span>${reward.unlocked ? '수령 완료' : '잠김'}</span></div>
        <div class="journey-reward-copy"><small>${escapeHtml(reward.title)}</small><h4>${escapeHtml(reward.unlocked ? reward.note : `Lv.${reward.level}에 세 가지 취향 보상`)}</h4>
          <ul><li><canvas width="${CHAR_W}" height="${CHAR_H}" data-reward-outfit="${reward.level}" aria-label="${escapeHtml(reward.outfit.name)} 픽셀 미리보기"></canvas><i>옷</i><span><b>${escapeHtml(reward.unlocked ? reward.outfit.name : '마을 전용 코디')}</b><small>${escapeHtml(reward.unlocked ? reward.outfit.blurb : '아틀리에에서 자동 해금')}</small></span></li>
          <li><canvas width="${PET_W}" height="${PET_H}" data-reward-pet="${reward.level}" aria-label="${escapeHtml(reward.petAccessory.name)} 픽셀 미리보기"></canvas><i>펫</i><span><b>${escapeHtml(reward.unlocked ? reward.petAccessory.name : '펫 전용 픽셀 장식')}</b><small>${escapeHtml(reward.unlocked ? reward.petAccessory.description : '펫샵 장식 도감에서 자동 해금')}</small></span></li>
          <li><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-reward-home="${reward.level}" aria-label="${escapeHtml(reward.homeRecipe.name)} 픽셀 미리보기"></canvas><i>집</i><span><b>${escapeHtml(reward.unlocked ? reward.homeRecipe.name : '가구 리폼 레시피')}</b><small>${escapeHtml(reward.unlocked ? reward.homeRecipe.description : '내 집 리폼 공방에서 자동 해금')}</small></span></li></ul>
        </div>
        <footer>${reward.unlocked ? `<button data-village-reward-target="outfit">코디 보기</button><button data-village-reward-target="pet">펫 장식 보기</button><button data-village-reward-target="home">집 레시피 안내</button>` : `<span>마을 Lv.${reward.level}에 자동 수령</span>`}</footer>
      </article>`).join('')}</div>
    </section>`;

    return `<section class="journey-level-hero">
      <div class="journey-level-seal"><small>VILLAGE</small><strong>${level.level}</strong><span>LEVEL</span></div>
      <div class="journey-level-copy"><small>모든 생활이 한 레벨로 이어져요</small><h3>${escapeHtml(level.title)}</h3>
        <p>전투를 하지 않아도 괜찮아요. 집 꾸미기, 코디, 펫 돌봄, 정원, 요리, 낚시와 이웃 관계가 모두 마을 XP가 됩니다.</p>
        <div class="journey-level-progress"><i style="width:${level.progressPct}%"></i></div>
        <span>${level.level >= 50 ? `${level.totalXp.toLocaleString()} XP · 최고 레벨` : `${level.levelXp.toLocaleString()} / ${level.levelGoal.toLocaleString()} XP`}</span>
      </div>
      <div class="journey-next-reward"><span>${next ? `다음 명찰 · Lv.${next.level}` : '마지막 명찰'}</span><b>${escapeHtml(next?.reward ?? '마을 연대기 명찰 획득 가능')}</b><small>완료한 여정 ${summary.completedChapters}/${summary.chapters.length}</small></div>
    </section>
    <section class="journey-xp-ledger"><header><small>XP RECORD</small><b>경험치가 쌓인 곳</b><span>퀘스트 ${level.questXp.toLocaleString()} · 생활 ${level.activityXp.toLocaleString()}</span></header><div>${xpSources.map(([name, xp]) => {
      const pct = level.totalXp > 0 ? Math.max(xp > 0 ? 3 : 0, Math.round((xp / level.totalXp) * 100)) : 0;
      return `<article><span>${name}</span><i><em style="width:${pct}%"></em></i><b>${xp.toLocaleString()}</b></article>`;
    }).join('')}</div></section>
    ${this.levelMemoryHtml(level)}
    ${passportLedger}
    ${rewardLedger}
    <p class="journey-guide-copy">각 장은 모든 목표를 강요하지 않습니다. 마음에 드는 활동만 필요한 수만큼 골라도 다음 장이 열리고, 먼저 해 둔 기록은 나중에도 그대로 인정됩니다.</p>
    <div class="journey-route">${chapterCards}</div>`;
  }

  private paintJourneyRewards(): void {
    const rewards = villageLevelRewardViews(this.badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
    for (const reward of rewards) {
      const outfit = this.root.querySelector<HTMLCanvasElement>(`[data-reward-outfit="${reward.level}"]`);
      const outfitContext = outfit?.getContext('2d');
      if (outfitContext) paintCharacterFrame(outfitContext, normalizeAppearance({ ...DEFAULT_APPEARANCE, ...reward.outfit.style }), 0, 1);
      const pet = this.root.querySelector<HTMLCanvasElement>(`[data-reward-pet="${reward.level}"]`);
      const petContext = pet?.getContext('2d');
      if (petContext) paintPet(petContext, 'dog', reward.petAccessory.id);
      const home = this.root.querySelector<HTMLCanvasElement>(`[data-reward-home="${reward.level}"]`);
      if (home) paintFurnitureReformPreview(home, 'desk_wood', reward.homeRecipe.style);
    }
    const level = villageJourneySummary(this.views, this.masteries).level;
    const memoryCanvas = this.root.querySelector<HTMLCanvasElement>('[data-level-memory-art]');
    const memoryLevel = Number(memoryCanvas?.dataset.levelMemoryArt) as VillageLevelMemoryLevel;
    if (memoryCanvas && VILLAGE_LEVEL_MEMORY_LEVELS.includes(memoryLevel)) {
      const entry = this.villageLevelMemories.get().entries.find((item) => item.level === memoryLevel);
      const domainId = entry?.domainId ?? recommendedVillageLevelMemoryDomain(level.xpBreakdown);
      const domain = VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.get(domainId);
      if (domain) paintVillageLevelMemoryArt(
        memoryCanvas,
        memoryLevel,
        domain,
        this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE,
        this.opts.getPet?.() ?? null,
      );
    }
  }

  private row(q: QuestView): string {
    const pct = Math.round((Math.min(q.progress, q.goal) / q.goal) * 100);
    const prerequisite = q.prerequisite ? QUEST_BY_ID.get(q.prerequisite)?.name : null;
    if (!q.unlocked) {
      return `<article class="quest-card locked">
        <div class="quest-status">잠김</div>
        <div class="quest-copy"><b>아직 펼쳐지지 않은 기록</b><span>「${prerequisite ?? '이전 이야기'}」${objectParticle(prerequisite ?? '이전 이야기')} 마치면 열려요.</span></div>
      </article>`;
    }

    const claimButton = q.category === 'daily'
      ? `<button data-q="${q.id}" ${q.done && !q.claimed && this.online ? '' : 'disabled'}>
          ${q.claimed ? '수령함' : q.done ? `보상 받기 · ${q.reward}` : `코인 ${q.reward}`}
        </button>`
      : `<span class="quest-reward">${q.done ? '배지 획득' : (q.rewardLabel ?? '기록 배지')}</span>`;
    const focused = this.focusedQuestId === q.id;
    const planned = this.sessionPlanner.has(q.id);
    const focusButton = !q.done
      ? `<button class="quest-focus ${focused ? 'is-focused' : ''}" data-focus="${q.id}" aria-pressed="${focused}">${focused ? '추적 해제' : '목표 추적'}</button>`
      : '';
    const guide = this.tab === 'recommended' ? guideForQuest(q, focused) : null;
    const planButton = !q.done
      ? `<button class="quest-plan ${planned ? 'is-planned' : ''}" data-session-plan-toggle="${q.id}" aria-pressed="${planned}">${planned ? '큐에서 빼기' : '플레이 큐에 담기'}</button>`
      : '';

    return `<article class="quest-card ${q.done ? 'done' : ''} ${focused ? 'focused' : ''} ${planned ? 'is-planned' : ''}"${guide ? ` data-guide-tone="${guide.tone}"` : ''}>
      <div class="quest-status">${focused ? '추적 중' : q.done ? '완료' : QUEST_CATEGORY_LABEL[q.category]}</div>
      <div class="quest-copy">
        <b>${q.name}</b>
        <span>${q.desc}</span>
        ${guide ? `<small class="quest-why">${guide.reason}</small>` : ''}
        <span class="where">${q.location}</span>
        ${q.tip && !q.done ? `<small>${q.tip}</small>` : ''}
        <div class="quest-progress"><i style="width:${pct}%"></i></div>
      </div>
      <div class="quest-side"><strong>${q.done ? '완료!' : `${q.progress} / ${q.goal}`}</strong>${claimButton}${focusButton}${planButton}</div>
    </article>`;
  }

  private sessionPlannerHtml(): string {
    if (this.tab !== 'recommended') return '';
    const view = this.sessionPlanner.view(this.views);
    const progress = this.sessionPlanner.progress();
    const slotByIndex = new Map(view.slots.map((slot) => [slot.slot, slot]));
    const slots = Array.from({ length: SESSION_PLAN_MAX }, (_, index) => {
      const slot = slotByIndex.get(index);
      if (!slot) return `<article class="session-plan-slot is-empty"><i>${index + 1}</i><div><small>비어 있는 정류장</small><b>아래 추천에서 목표를 골라 주세요</b><span>분야가 달라도 괜찮아요.</span></div></article>`;
      const quest = slot.quest;
      const pct = Math.round((Math.min(quest.progress, quest.goal) / quest.goal) * 100);
      return `<article class="session-plan-slot ${quest.done ? 'is-done' : ''} ${slot.active ? 'is-active' : ''}">
        <i>${quest.done ? '✓' : index + 1}</i><div><small>${QUEST_CATEGORY_LABEL[quest.category]} · ${escapeHtml(quest.location)}</small><b>${escapeHtml(quest.name)}</b><span>${quest.done ? '완료한 장면 · 나머지 목표 뒤에 함께 보존' : `${quest.progress}/${quest.goal} · ${escapeHtml(quest.desc)}`}</span><em><u style="width:${pct}%"></u></em></div>
        <aside>${!quest.done ? `<button data-session-plan-guide="${quest.id}">${slot.active ? '이 목표부터 안내' : '이 목표 안내'}</button>` : ''}<button class="quiet" data-session-plan-toggle="${quest.id}">빼기</button></aside>
      </article>`;
    }).join('');
    const recommendations = view.recommendations.slice(0, Math.max(3, SESSION_PLAN_MAX - view.slots.length + 2));
    const archives = view.archives.slice(0, 6).map((archive, index) => `<article class="${archive.featured ? 'is-featured' : ''}">
      <i>${archive.featured ? '★' : String(progress.archivedPages - index).padStart(2, '0')}</i><span><small>${archive.categories.map((category) => QUEST_CATEGORY_LABEL[category]).join(' · ')}</small><b>${archive.names.map((name) => escapeHtml(name)).join(' / ')}</b></span><button data-session-plan-feature="${archive.id}">${archive.featured ? '대표에서 내리기' : '대표 페이지'}</button>
    </article>`).join('');
    return `<section class="session-planner">
      <header><div class="session-planner-art"><canvas width="${SESSION_PLANNER_ART_W}" height="${SESSION_PLANNER_ART_H}" data-session-planner-art aria-label="오늘의 세 정류장 2.5D 픽셀 경로"></canvas><span>3-QUEST ROUTE</span></div>
        <div><small>FRIENDLY MMORPG QUEST QUEUE</small><h3>오늘의 플레이 큐</h3><p>하고 싶은 목표 세 개를 함께 담아 한 번의 외출처럼 이어 가세요. 수락 순서·실패·시간 제한이 없고 이전 기록도 그대로 반영됩니다.</p></div>
        <aside><strong>${view.slots.length}<i>/3</i></strong><span>담은 목표</span><small>${progress.archivedPages}장 완주 보존</small></aside>
      </header>
      ${this.sessionPlannerFeedback ? `<p class="session-planner-feedback" role="status">${escapeHtml(this.sessionPlannerFeedback)}</p>` : ''}
      <div class="session-plan-slots">${slots}</div>
      <footer class="session-plan-actions">
        <div><small>${view.readyToArchive ? 'THREE STOPS COMPLETE' : view.nextQuest ? 'NEXT GENTLE STEP' : 'CHOOSE ANY QUEST'}</small><b>${view.readyToArchive ? '세 목표를 한 장의 모험 페이지로 남길 수 있어요.' : view.nextQuest ? `다음 추천 · ${escapeHtml(view.nextQuest.name)}` : '아래에서 마음 가는 목표부터 담아 보세요.'}</b></div>
        ${view.readyToArchive ? '<button class="is-primary" data-session-plan-archive>세 정류장 페이지 보존</button>' : view.nextQuest ? `<button data-session-plan-guide="${view.nextQuest.id}">가장 가까운 목표 안내</button>` : ''}
      </footer>
      ${view.slots.length < SESSION_PLAN_MAX ? `<section class="session-plan-recommendations"><header><span>함께 담기 좋은 목표</span><small>진행 중인 것·다른 분야·다른 장소를 우선 골랐어요.</small></header><div>${recommendations.map((quest) => `<button data-session-plan-toggle="${quest.id}"><i>${QUEST_CATEGORY_LABEL[quest.category].slice(0, 1)}</i><span><b>${escapeHtml(quest.name)}</b><small>${quest.progress}/${quest.goal} · ${escapeHtml(quest.location)}</small></span><em>+ 담기</em></button>`).join('')}</div></section>` : ''}
      ${archives ? `<section class="session-plan-archive"><header><span>완주한 모험 페이지</span><small>최근 12장은 기기에 보존되고, 누적 완주 수는 계속 남아요.</small></header><div>${archives}</div></section>` : ''}
      <p class="session-plan-note">큐에서 목표를 빼도 퀘스트 진행과 보상은 사라지지 않습니다. 한 목표를 안내할 때만 기존 월드 추적기가 그 목표로 안전하게 전환됩니다.</p>
    </section>`;
  }

  private paintSessionPlanner(): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-session-planner-art]');
    if (!canvas) return;
    paintSessionPlannerArt(
      canvas,
      this.sessionPlanner.view(this.views).slots,
      this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE,
      this.opts.getPet?.() ?? null,
    );
  }

  private fanMerchSubjects(): FanMerchSubject[] {
    const subjects: FanMerchSubject[] = [{
      kind: 'self',
      id: 'self',
      name: '나의 캐릭터',
      appearance: normalizeAppearance(this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE),
    }];
    const pet = this.opts.getPet?.() ?? null;
    const species = pet ? petById(pet.speciesId) : null;
    if (pet && species) {
      subjects.push({
        kind: 'pet',
        id: species.id,
        name: species.name,
        speciesId: species.id,
        accessory: pet.accessory,
      });
    }
    const trust = this.opts.getResidentTrust?.() ?? {};
    for (const resident of RESIDENTS) {
      if (trustOf(trust, resident.id) <= 0) continue;
      subjects.push({
        kind: 'resident',
        id: resident.id,
        name: resident.name,
        appearance: normalizeAppearance(resident.appearance),
      });
    }
    return subjects;
  }

  private fanMerchDraft(): FanMerchDraft {
    const subjects = this.fanMerchSubjects();
    const subject = subjects.find((item) => `${item.kind}:${item.id}` === this.selectedFanMerchSubjectKey) ?? subjects[0]!;
    this.selectedFanMerchSubjectKey = `${subject.kind}:${subject.id}`;
    return {
      subject,
      formatId: this.selectedFanMerchFormatId,
      motifId: this.selectedFanMerchMotifId,
    };
  }

  private fanMerchHtml(): string {
    if (this.tab !== 'fanwork') return '';
    const state = this.fanMerch.get();
    const progress = this.fanMerch.progress();
    const subjects = this.fanMerchSubjects();
    const draft = this.fanMerchDraft();
    const selectedRecord = state.slots[this.selectedFanMerchSlot];
    const saveLabel = selectedRecord
      ? this.pendingFanMerchOverwriteSlot === this.selectedFanMerchSlot
        ? `한 번 더 눌러 ${this.selectedFanMerchSlot + 1}번 교체`
        : `${this.selectedFanMerchSlot + 1}번 굿즈 교체`
      : `${this.selectedFanMerchSlot + 1}번 빈 칸에 보존`;
    const subjectButtons = subjects.map((subject) => {
      const key = `${subject.kind}:${subject.id}`;
      const label = subject.kind === 'self' ? 'MY OC' : subject.kind === 'pet' ? 'COMPANION' : 'NEIGHBOR';
      return `<button data-fan-merch-subject="${key}" class="${key === this.selectedFanMerchSubjectKey ? 'is-selected' : ''}">
        <i>${subject.kind === 'self' ? '나' : subject.kind === 'pet' ? '발' : '이'}</i><span><small>${label}</small><b>${escapeHtml(subject.name)}</b></span>
      </button>`;
    }).join('');
    const slots = state.slots.map((record, index) => {
      if (!record) return `<article class="fan-merch-slot is-empty ${index === this.selectedFanMerchSlot ? 'is-selected' : ''}">
        <button data-fan-merch-slot="${index}"><i>${String(index + 1).padStart(2, '0')}</i><span><b>비어 있는 소장칸</b><small>새 굿즈를 안전하게 보존</small></span></button>
      </article>`;
      const format = FAN_MERCH_FORMATS.find((item) => item.id === record.formatId)!;
      const motif = FAN_MERCH_MOTIFS.find((item) => item.id === record.motifId)!;
      const featured = state.featuredIds.includes(record.id);
      return `<article class="fan-merch-slot ${featured ? 'is-featured' : ''} ${index === this.selectedFanMerchSlot ? 'is-selected' : ''}" style="--fan-merch-color:${motif.colors[2]}">
        <button data-fan-merch-slot="${index}"><canvas width="${FAN_MERCH_ART_W}" height="${FAN_MERCH_ART_H}" data-fan-merch-record="${index}" aria-label="${escapeHtml(record.subject.name)} ${escapeHtml(format.name)}"></canvas><span><small>${format.code} · ${escapeHtml(motif.name)}</small><b>${escapeHtml(record.subject.name)} ${escapeHtml(format.name)}</b><em>${featured ? '★ 대표 진열' : `${index + 1}번 소장칸`}</em></span></button>
        <button class="feature" data-fan-merch-feature="${record.id}">${featured ? '대표에서 내리기' : '대표 굿즈'}</button>
      </article>`;
    }).join('');
    return `<section class="fan-merch-workshop">
      <header><div><small>FAVORITE GOODS LAB · NO GACHA</small><h3>골목 최애 굿즈 공방</h3><p>내 캐릭터, 동행, 만난 주민을 직접 골라 열두 칸의 소장품으로 만들어요. 재료·확률·기간 제한 없이 디자인만 오래 남습니다.</p></div>
        <aside><span><b>${progress.discoveries}</b><small>영구 디자인</small></span><span><b>${progress.featured}</b><small>대표 굿즈</small></span><span><b>${progress.totalCreated}</b><small>누적 제작</small></span></aside>
      </header>
      ${this.fanMerchFeedback ? `<p class="fan-merch-feedback" role="status">${escapeHtml(this.fanMerchFeedback)}</p>` : ''}
      <div class="fan-merch-editor">
        <aside class="fan-merch-pickers">
          <section><header><small>01 · FAVORITE</small><b>누구의 굿즈를 만들까요?</b></header><div class="fan-merch-subjects">${subjectButtons}</div>
            ${subjects.length === 1 ? '<p>동행을 정하거나 주민과 처음 인사하면 새로운 최애가 자동으로 열려요.</p>' : ''}
          </section>
          <section><header><small>02 · FORMAT</small><b>여섯 소장 형태</b></header><div class="fan-merch-formats">${FAN_MERCH_FORMATS.map((format) => `<button data-fan-merch-format="${format.id}" class="${draft.formatId === format.id ? 'is-selected' : ''}"><i>${format.mark}</i><span><b>${format.name}</b><small>${format.note}</small></span></button>`).join('')}</div></section>
          <section><header><small>03 · MOOD</small><b>여섯 골목 분위기</b></header><div class="fan-merch-motifs">${FAN_MERCH_MOTIFS.map((motif) => `<button data-fan-merch-motif="${motif.id}" class="${draft.motifId === motif.id ? 'is-selected' : ''}" style="--fan-merch-color:${motif.colors[2]}"><i>${motif.mark}</i><span><b>${motif.name}</b><small>${motif.note}</small></span></button>`).join('')}</div></section>
        </aside>
        <main class="fan-merch-preview">
          <div><canvas width="${FAN_MERCH_ART_W}" height="${FAN_MERCH_ART_H}" data-fan-merch-preview aria-label="${escapeHtml(draft.subject.name)} 굿즈 제작 미리보기"></canvas><span>LIVE PIXEL PROOF</span></div>
          <header><small>${FAN_MERCH_FORMATS.find((item) => item.id === draft.formatId)!.code} · ${FAN_MERCH_MOTIFS.find((item) => item.id === draft.motifId)!.name}</small><h4>${escapeHtml(draft.subject.name)}의 새 소장품</h4><p>현재 모습과 장식을 이 순간의 픽셀 스냅샷으로 보존합니다. 나중에 코디가 달라져도 이 굿즈는 그대로예요.</p></header>
          <button class="${this.pendingFanMerchOverwriteSlot === this.selectedFanMerchSlot ? 'is-confirm' : ''}" data-fan-merch-save>${saveLabel}</button>
          <small>${selectedRecord ? '기존 칸을 교체해도 과거에 발견한 디자인 도장은 사라지지 않아요.' : '빈 칸에는 즉시 안전하게 보존됩니다.'}</small>
        </main>
      </div>
      <section class="fan-merch-shelf"><header><div><small>TWELVE PERMANENT SLOTS</small><h4>나의 최애 굿즈 진열장</h4></div><span>소장 ${progress.savedSlots}/${FAN_MERCH_SLOT_COUNT} · 대표 ${progress.featured}/${FAN_MERCH_FEATURED_MAX} · 형태 ${progress.formats}/6 · 분위기 ${progress.motifs}/6</span></header><div>${slots}</div></section>
      <footer>주민 순위 경쟁 없음 · 뽑기 없음 · 재화 소모 없음 · 덮어써도 영구 디자인 도감 유지</footer>
    </section>`;
  }

  private paintFanMerch(): void {
    const preview = this.root.querySelector<HTMLCanvasElement>('[data-fan-merch-preview]');
    if (preview) paintFanMerchArt(preview, this.fanMerchDraft());
    const state = this.fanMerch.get();
    this.root.querySelectorAll<HTMLCanvasElement>('[data-fan-merch-record]').forEach((canvas) => {
      const record = state.slots[Number(canvas.dataset.fanMerchRecord)];
      if (record) paintFanMerchArt(canvas, record);
    });
  }

  private guideHtml(): string {
    if (this.tab !== 'recommended') return '';
    const guide = selectQuestGuide(this.views, this.focusedQuestId);
    if (!guide) {
      return `<section class="quest-guide empty">
        <div class="quest-guide-seal"><i></i><span>완료</span></div>
        <div><small>길잡이가 확인했어요</small><b>열려 있는 목표를 모두 마쳤어요</b><p>좋아하는 생활을 계속 즐기면 평생 숙련 기록은 그대로 쌓입니다.</p></div>
      </section>`;
    }
    const q = guide.quest;
    const pct = Math.round((Math.min(q.progress, q.goal) / q.goal) * 100);
    const canFocus = !q.done;
    return `<section class="quest-guide" data-guide-tone="${guide.tone}">
      <div class="quest-guide-seal"><i></i><span>${guide.manual ? '추적' : '추천'}</span></div>
      <div class="quest-guide-copy">
        <small>${guide.label}</small><b>${q.name}</b><p>${guide.reason}</p>
        <div class="quest-guide-next"><span>다음 행동</span><strong>${guide.action}</strong><em>${q.location}</em></div>
      </div>
      <div class="quest-guide-control"><strong>${q.progress} / ${q.goal}</strong><i><em style="width:${pct}%"></em></i>
        ${canFocus ? `<button data-focus="${q.id}" class="${guide.manual ? 'is-focused' : ''}">${guide.manual ? '자동 추천으로' : 'HUD에 고정'}</button>` : '<span>오늘 탭에서 보상 확인</span>'}
      </div>
    </section>`;
  }

  private starterMentorHtml(routes: StarterCompassRouteView[]): string {
    const preference = this.starterPreference.get();
    const views = this.starterPreference.mentorViews(this.opts.getQuestState());
    const claimedRoutes = new Set(preference.claimedRouteIds);
    const preferredRouteId = this.selectedStarterMentorRouteId
      ?? (preference.selectedRouteId && claimedRoutes.has(preference.selectedRouteId) ? preference.selectedRouteId : null)
      ?? preference.claimedRouteIds[0]
      ?? preference.selectedRouteId
      ?? routes[0]?.id
      ?? null;
    if (preferredRouteId) this.selectedStarterMentorRouteId = preferredRouteId;
    const route = routes.find((item) => item.id === preferredRouteId) ?? routes[0];
    if (!route) return '';
    const chapters = views.filter((chapter) => chapter.routeId === route.id);
    const selectedExists = chapters.some((chapter) => chapter.id === this.selectedStarterMentorChapterId);
    if (!selectedExists) {
      this.selectedStarterMentorChapterId = chapters.find((chapter) => chapter.available && !chapter.claimed)?.id
        ?? [...chapters].reverse().find((chapter) => chapter.claimed)?.id
        ?? chapters[0]?.id
        ?? null;
    }
    const selected = chapters.find((chapter) => chapter.id === this.selectedStarterMentorChapterId) ?? chapters[0];
    if (!selected) return '';
    const progress = this.starterPreference.progress();
    const routeUnlocked = claimedRoutes.has(route.id);
    const reward = STARTER_MENTOR_REWARD_BY_ROUTE.get(route.id);
    const rewardUnlocked = progress.mentorRouteIds.includes(route.id);
    const nextRequirement = selected.requirements.find((item) => !item.complete);
    const canClaim = selected.available && selected.complete && !selected.claimed;
    const action = selected.claimed
      ? `<button data-starter-mentor-feature="${selected.id}" class="${selected.featured ? 'is-featured' : ''}">${selected.featured ? '★ 대표 장면에서 내리기' : `대표 성장 장면 ${progress.featuredMentorScenes}/3`}</button>
        <button data-starter-mentor-replay="${selected.id}">멘토 장면 다시 보기 <i>${selected.replayCount}</i></button>`
      : canClaim
        ? `<button class="is-primary" data-starter-mentor-claim="${selected.id}">${escapeHtml(route.mentorName)}와 이 장 보존하기</button>`
        : selected.available && nextRequirement && villageRequestDestinationForMetric(nextRequirement.key)
          ? `<button class="is-primary" data-starter-mentor-guide="${nextRequirement.key}" data-starter-mentor-title="${escapeHtml(nextRequirement.label)}">가장 가까운 한 걸음 안내</button>`
          : `<button disabled>${routeUnlocked ? '앞 장을 먼저 보존하면 열려요' : '이 방향의 환영 소포를 받으면 열려요'}</button>`;
    return `<section class="starter-mentor-book ${routeUnlocked ? '' : 'is-route-locked'}" style="--starter-color:${route.color}">
      <header><div><small>NEW NEIGHBOR MENTOR STORIES · 18 CHAPTERS</small><h3>여섯 멘토의 첫 생활 연대기</h3><p>환영 소포는 시작일 뿐이에요. 각 방향마다 세 장의 이야기가 실제 생활 기록으로 이어지고, 어느 순서로 돌아와도 이전 행동을 그대로 인정합니다.</p></div>
        <aside><strong>${progress.mentorChapters}<i>/18</i></strong><span>보존한 성장 장</span><small>완주 루트 ${progress.mentorRoutes}/6 · 대표 ${progress.featuredMentorScenes}/3</small></aside></header>
      <nav class="starter-mentor-routes" aria-label="멘토 성장 루트">${routes.map((item) => {
        const routeChapters = views.filter((chapter) => chapter.routeId === item.id);
        const claimed = routeChapters.filter((chapter) => chapter.claimed).length;
        const ready = routeChapters.some((chapter) => chapter.available && chapter.complete && !chapter.claimed);
        return `<button data-starter-mentor-route="${item.id}" class="${item.id === route.id ? 'is-selected' : ''} ${claimedRoutes.has(item.id) ? 'is-open' : ''}" style="--starter-color:${item.color}">
          <i>${item.mark}</i><span><small>${escapeHtml(item.mentorName)} · ${item.code}</small><b>${escapeHtml(item.title)}</b><em>${claimedRoutes.has(item.id) ? `${claimed}/3장${ready ? ' · 보존 준비' : ''}` : '환영 소포 이후'}</em></span><strong>${claimedRoutes.has(item.id) ? `${claimed}/3` : '잠김'}</strong>
        </button>`;
      }).join('')}</nav>
      <main>
        <div class="starter-mentor-scene ${selected.claimed ? 'is-claimed' : ''}">
          <canvas width="${STARTER_MENTOR_ART_W}" height="${STARTER_MENTOR_ART_H}" data-starter-mentor-art="${selected.id}" aria-label="${escapeHtml(selected.title)} 2.5D 픽셀 멘토 장면"></canvas>
          <span><small>${escapeHtml(route.mentorRole)} · ${escapeHtml(route.mentorName)}</small><b>${escapeHtml(selected.subtitle)}</b></span>
        </div>
        <section class="starter-mentor-copy">
          <header><div><small>${escapeHtml(selected.code)} · CHAPTER ${selected.chapter}</small><h4>${escapeHtml(selected.title)}</h4></div><strong>${selected.claimed ? '보존됨' : selected.complete && selected.available ? '준비됨' : selected.available ? '진행 중' : '잠김'}</strong></header>
          <p>${escapeHtml(selected.story)}</p>
          <blockquote class="${selected.claimed ? '' : 'is-locked'}">${escapeHtml(selected.claimed ? selected.closing : '이 장을 보존하면 멘토가 남긴 마지막 문장이 펼쳐져요.')}</blockquote>
          <div class="starter-mentor-requirements">${selected.requirements.map((item) => `<article class="${item.complete ? 'is-complete' : ''}">
            <i>${item.complete ? '✓' : item.mark}</i><span><small>${escapeHtml(item.location)}</small><b>${escapeHtml(item.label)}</b><em><i style="width:${item.progressPct}%"></i></em></span><strong>${Math.min(item.current, item.goal)}/${item.goal}</strong>
            ${!item.complete && selected.available && villageRequestDestinationForMetric(item.key) ? `<button data-starter-mentor-guide="${item.key}" data-starter-mentor-title="${escapeHtml(item.label)}">길 안내</button>` : ''}
          </article>`).join('')}</div>
          <footer>${action}<small>기한·실패·진로 잠금 없음 · 기존 평생 기록 소급</small></footer>
        </section>
      </main>
      <div class="starter-mentor-chapters">${chapters.map((chapter) => `<button data-starter-mentor-chapter="${chapter.id}" class="${chapter.id === selected.id ? 'is-selected' : ''} ${chapter.claimed ? 'is-claimed' : chapter.available ? 'is-open' : 'is-locked'}">
        <i>${chapter.claimed ? '✓' : String(chapter.chapter).padStart(2, '0')}</i><span><small>${escapeHtml(chapter.code)}</small><b>${escapeHtml(chapter.title)}</b><em>${chapter.claimed ? `${chapter.replayCount}회 다시 봄` : chapter.complete && chapter.available ? '보존 준비' : chapter.available ? `${chapter.requirements.filter((item) => item.complete).length}/2 기록` : '앞 장 이후'}</em></span>${chapter.featured ? '<strong>★ 대표</strong>' : ''}
      </button>`).join('')}</div>
      ${reward ? `<section class="starter-mentor-reward ${rewardUnlocked ? 'is-unlocked' : ''}">
        <header><div><small>ROUTE COMPLETION · 3-PIECE TASTE SET</small><h4>${escapeHtml(rewardUnlocked ? reward.title : `${route.mentorName}의 완주 취향 세트`)}</h4><p>${escapeHtml(rewardUnlocked ? reward.note : '세 번째 장을 보존하면 같은 취향의 코디·동행 장식·집 리폼이 동시에 열립니다.')}</p></div><strong>${rewardUnlocked ? '3/3 영구 소장' : `${chapters.filter((chapter) => chapter.claimed).length}/3장`}</strong></header>
        <div>
          <article><canvas width="${CHAR_W}" height="${CHAR_H}" data-starter-mentor-reward-outfit="${route.id}"></canvas><span><small>OUTFIT</small><b>${escapeHtml(rewardUnlocked ? reward.outfit.name : '완주 코디')}</b></span>${rewardUnlocked ? '<button data-village-reward-target="outfit">아틀리에</button>' : ''}</article>
          <article><canvas width="${PET_W}" height="${PET_H}" data-starter-mentor-reward-pet="${route.id}"></canvas><span><small>COMPANION</small><b>${escapeHtml(rewardUnlocked ? reward.petAccessory.name : '완주 장식')}</b></span>${rewardUnlocked ? '<button data-village-reward-target="pet">동행 프로필</button>' : ''}</article>
          <article><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-starter-mentor-reward-home="${route.id}"></canvas><span><small>HOME</small><b>${escapeHtml(rewardUnlocked ? reward.homeRecipe.name : '완주 리폼')}</b></span>${rewardUnlocked ? '<button data-village-reward-target="home">리폼 공방</button>' : ''}</article>
        </div>
      </section>` : ''}
      <p>한 루트를 끝내도 다른 다섯 방향은 그대로 열려 있어요. 좋아하는 세 장만 대표 성장 장면으로 남길 수 있고, 선택을 바꿔도 모든 기록은 보존됩니다.</p>
    </section>`;
  }

  private starterCompassHtml(): string {
    if (this.tab !== 'recommended') return '';
    const routes = starterCompassRouteViews(this.opts.getQuestState());
    const preference = this.starterPreference.get();
    const selectedRouteId = preference.selectedRouteId;
    const claimed = new Set(preference.claimedRouteIds);
    const concierge = starterCompassConciergeView(routes, selectedRouteId);
    const complete = routes.filter((route) => route.complete).length;
    const steps = routes.reduce((total, route) => total + route.completed, 0);
    const conciergeCopy = concierge.stage === 'all-complete'
      ? { eyebrow: 'ALL DIRECTIONS FOUND', title: '여섯 방향이 모두 당신의 생활이 되었어요', body: '이제 좋아하는 활동을 반복해도 레벨과 생활 숙련은 계속 자랍니다.' }
      : concierge.stage === 'complete'
        ? { eyebrow: 'FIRST ROUTE COMPLETE', title: `「${concierge.route?.title ?? '첫 방향'}」의 영구 도장을 찾았어요`, body: '이 방향은 사라지지 않아요. 다른 생활을 골라도 기존 기록과 보상은 그대로 남습니다.' }
        : concierge.stage === 'one-left'
          ? { eyebrow: 'ONE GENTLE STEP LEFT', title: `${concierge.route?.title ?? '고른 방향'}에서 한 걸음만 더`, body: '아래 한 가지를 해 보면 첫 방향이 완성돼요. 다른 활동을 먼저 해도 괜찮습니다.' }
          : concierge.stage === 'first-step'
            ? { eyebrow: 'YOUR FIRST ROUTE', title: `오늘은 「${concierge.route?.title ?? '고른 방향'}」부터`, body: '세 가지를 모두 할 필요 없이 둘만 경험하면 돼요. 가장 편한 행동 하나부터 안내할게요.' }
            : { eyebrow: 'NEW NEIGHBOR CONCIERGE', title: '처음에는 한 방향만 골라도 충분해요', body: `현재 기록에서는 「${concierge.suggestedRoute?.title ?? '골목 스타일러'}」 방향이 가장 가벼운 시작이에요. 추천을 따르지 않아도 아무 손해가 없습니다.` };
    const conciergeRouteReady = concierge.route?.complete && !claimed.has(concierge.route.id);
    const conciergeAction = conciergeRouteReady && concierge.route
      ? `<button data-starter-claim="${concierge.route.id}">${escapeHtml(concierge.route.mentorName)}의 환영 소포 받기</button>`
      : concierge.stage === 'choose' && concierge.suggestedRoute
      ? `<button data-starter-select="${concierge.suggestedRoute.id}">추천 방향으로 시작</button>`
      : concierge.stage === 'complete' && concierge.suggestedRoute
        ? `<button data-starter-select="${concierge.suggestedRoute.id}">다음 방향 이어보기</button>`
        : concierge.next && villageRequestDestinationForMetric(concierge.next.key)
          ? `<button data-starter-guide="${concierge.next.key}" data-starter-title="${escapeHtml(concierge.next.label)}">이 한 걸음 길 안내</button>`
          : '';
    return `<section class="starter-compass">
      <header>
        <canvas width="${STARTER_COMPASS_ART_W}" height="${STARTER_COMPASS_ART_H}" data-starter-compass-art aria-label="여섯 방향의 픽셀 골목 나침반"></canvas>
        <div><small>NO WRONG WAY · RETROACTIVE</small><h3>새 이웃 취향 나침반</h3><p>여섯 방향이 처음부터 모두 열려 있어요. 한 방향의 세 활동 중 마음 가는 두 가지만 해도 영구 도장이 남습니다.</p></div>
        <aside><span>찾은 방향</span><strong>${complete}<i>/6</i></strong><small>첫날 기록 ${steps}/18</small></aside>
      </header>
      <section class="starter-concierge is-${concierge.stage}" aria-live="polite">
        <div><i>${concierge.route?.mark ?? '안'}</i><span><small>${conciergeCopy.eyebrow}</small><b>${escapeHtml(conciergeCopy.title)}</b><p>${escapeHtml(conciergeCopy.body)}</p></span></div>
        ${concierge.next ? `<aside><small>지금 한 가지만</small><b>${escapeHtml(concierge.next.label)}</b><span>${escapeHtml(concierge.next.location)}</span></aside>` : concierge.suggestedRoute && concierge.stage === 'complete' ? `<aside><small>다음 추천</small><b>${escapeHtml(concierge.suggestedRoute.title)}</b><span>${escapeHtml(concierge.suggestedRoute.description)}</span></aside>` : ''}
        <nav>${conciergeAction}${concierge.selected && concierge.stage !== 'all-complete' ? '<button class="quiet" data-starter-select="">다른 방향 둘러보기</button>' : ''}</nav>
      </section>
      <div class="starter-compass-routes">${routes.map((route, index) => {
        const next = route.complete ? null : route.requirements.find((item) => !item.complete && villageRequestDestinationForMetric(item.key))
          ?? route.requirements.find((item) => !item.complete)
          ?? null;
        const canGuide = !!next && !!villageRequestDestinationForMetric(next.key);
        const selected = route.id === selectedRouteId;
        return `<article class="${route.complete ? 'is-complete' : ''} ${selected ? 'is-selected' : ''}" style="--starter-color:${route.color};--starter-index:${index}">
          <header><i>${route.mark}</i><div><small>${route.code}</small><b>${escapeHtml(route.title)}</b></div><strong>${Math.min(route.completed, route.required)}/${route.required}</strong></header>
          <p>${escapeHtml(route.description)}</p>
          <ul>${route.requirements.map((item) => `<li class="${item.complete ? 'is-done' : ''}"><i>${item.complete ? '✓' : item.mark}</i><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.location)}</small></span></li>`).join('')}</ul>
          <footer><span>${route.complete ? `영구 도장 · ${escapeHtml(route.reward)}` : next ? `다음 제안 · ${escapeHtml(next.label)}` : '이 방향을 모두 경험했어요'}</span><div>${canGuide ? `<button data-starter-guide="${next!.key}" data-starter-title="${escapeHtml(next!.label)}">길 안내</button>` : ''}${selected ? '<button class="is-selected" disabled>내 첫 방향</button>' : `<button class="choose" data-starter-select="${route.id}">${route.complete ? '이 방향 다시 보기' : '이 방향 선택'}</button>`}</div></footer>
        </article>`;
      }).join('')}</div>
      <section class="starter-keepsake-shelf">
        <header><div><small>WELCOME PARCEL ARCHIVE</small><h3>여섯 멘토의 환영 소포</h3><p>한 방향을 마치면 담당 주민의 편지와 기념품을 직접 받아 영구 보존해요. 받은 것 중 하나는 나의 첫 생활 표식으로 고를 수 있습니다.</p></div><aside><strong>${claimed.size}<i>/6</i></strong><span>수령한 소포</span><small>${preference.featuredRouteId ? '대표 기념품 전시 중' : '대표는 나중에 골라도 돼요'}</small></aside></header>
        ${this.starterFeedback ? `<p class="starter-keepsake-feedback" role="status">${escapeHtml(this.starterFeedback)}</p>` : ''}
        <div>${routes.map((route) => {
          const isClaimed = claimed.has(route.id);
          const isFeatured = preference.featuredRouteId === route.id;
          const next = route.next;
          return `<article class="${isClaimed ? 'is-claimed' : route.complete ? 'is-ready' : 'is-locked'} ${isFeatured ? 'is-featured' : ''}" style="--starter-color:${route.color}">
            <canvas width="${STARTER_KEEPSAKE_ART_W}" height="${STARTER_KEEPSAKE_ART_H}" data-starter-keepsake="${route.id}" aria-label="${escapeHtml(route.reward)} 픽셀 환영 소포"></canvas>
            <section><header><span><small>${escapeHtml(route.mentorRole)}</small><b>${escapeHtml(route.mentorName)}의 편지</b></span><em>${isFeatured ? '★ 대표' : isClaimed ? '수령함' : route.complete ? '도착' : `${route.completed}/${route.required}`}</em></header>
              <blockquote>${escapeHtml(isClaimed ? route.welcomeLetter : route.complete ? '첫 방향을 찾은 당신에게 건넬 편지와 기념품이 도착했어요.' : `「${next?.label ?? '이 방향의 첫 활동'}」부터 편한 때 이어 오세요.`)}</blockquote>
              <footer><span><small>${isClaimed ? '영구 기념품' : route.complete ? '소포 안의 기념품' : '완성 기념품'}</small><b>${escapeHtml(route.reward)}</b><em>${escapeHtml(isClaimed ? route.keepsakeNote : '수령 전에는 이름만 미리 볼 수 있어요.')}</em></span>
                ${isClaimed
                  ? `<button data-starter-feature="${route.id}" class="${isFeatured ? 'is-featured' : ''}">${isFeatured ? '대표에서 내리기' : '나의 첫 표식으로'}</button>`
                  : route.complete
                    ? `<button data-starter-claim="${route.id}">소포 열어 보존하기</button>`
                    : next && villageRequestDestinationForMetric(next.key)
                      ? `<button data-starter-guide="${next.key}" data-starter-title="${escapeHtml(next.label)}">다음 한 걸음 안내</button>`
                      : ''}
              </footer>
            </section>
          </article>`;
        }).join('')}</div>
        <p>수령 기한·연속 접속·능력치 차이가 없습니다. 오늘 열지 않아도 편지와 기념품은 계속 기다립니다.</p>
      </section>
      ${this.starterMentorHtml(routes)}
      <p class="starter-compass-note">순서·기한·실패가 없어요. 다른 콘텐츠를 먼저 즐겨도 이미 한 행동은 나중에 자동으로 반영됩니다.</p>
    </section>`;
  }

  private paintStarterCompass(): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-starter-compass-art]');
    const context = canvas?.getContext('2d');
    if (context) paintStarterCompassArt(
      context, starterCompassRouteViews(this.opts.getQuestState()), this.starterPreference.get().selectedRouteId,
    );
    const preference = this.starterPreference.get();
    const claimed = new Set(preference.claimedRouteIds);
    const routes = starterCompassRouteViews(this.opts.getQuestState());
    this.root.querySelectorAll<HTMLCanvasElement>('[data-starter-keepsake]').forEach((keepsake) => {
      const route = routes.find((item) => item.id === keepsake.dataset.starterKeepsake);
      if (route) paintStarterKeepsakeArt(
        keepsake, route, claimed.has(route.id), preference.featuredRouteId === route.id,
      );
    });
    const mentorCanvas = this.root.querySelector<HTMLCanvasElement>('[data-starter-mentor-art]');
    const mentorChapter = this.starterPreference.mentorViews(this.opts.getQuestState())
      .find((chapter) => chapter.id === mentorCanvas?.dataset.starterMentorArt);
    const mentorRoute = routes.find((route) => route.id === mentorChapter?.routeId);
    if (mentorCanvas && mentorChapter && mentorRoute) {
      paintStarterMentorArt(
        mentorCanvas, mentorRoute, mentorChapter,
        this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE,
        this.opts.getPet?.() ?? null,
      );
    }
    const rewardRouteId = this.root.querySelector<HTMLCanvasElement>('[data-starter-mentor-reward-outfit]')
      ?.dataset.starterMentorRewardOutfit as StarterCompassRouteId | undefined;
    const reward = rewardRouteId ? STARTER_MENTOR_REWARD_BY_ROUTE.get(rewardRouteId) : null;
    if (reward) {
      const outfit = this.root.querySelector<HTMLCanvasElement>(`[data-starter-mentor-reward-outfit="${rewardRouteId}"]`);
      const outfitContext = outfit?.getContext('2d');
      if (outfitContext) paintCharacterFrame(outfitContext, normalizeAppearance({
        ...(this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE), ...reward.outfit.style,
      }), 0, 1);
      const pet = this.root.querySelector<HTMLCanvasElement>(`[data-starter-mentor-reward-pet="${rewardRouteId}"]`);
      const petContext = pet?.getContext('2d');
      const currentPet = this.opts.getPet?.();
      if (petContext) paintPet(petContext, currentPet?.speciesId ?? 'dog', reward.petAccessory.id);
      const home = this.root.querySelector<HTMLCanvasElement>(`[data-starter-mentor-reward-home="${rewardRouteId}"]`);
      if (home) paintFurnitureReformPreview(home, 'desk_wood', reward.homeRecipe.style);
    }
  }

  private adventurePathsHtml(): string {
    const paths = adventurePathViews(this.views);
    const recommended = recommendAdventurePaths(this.views, 3);
    const passport = this.adventurePathPassport.get();
    if (!this.selectedAdventurePathId || !paths.some((path) => path.id === this.selectedAdventurePathId)) {
      this.selectedAdventurePathId = passport.featuredId ?? passport.pinnedIds[0] ?? recommended[0]?.id ?? paths[0]?.id ?? null;
    }
    const selected = paths.find((path) => path.id === this.selectedAdventurePathId) ?? paths[0];
    if (!selected) return '<p class="quest-empty">장기 진로 지도를 불러오지 못했어요.</p>';
    const next = selected.next;
    const recommendation = recommended.some((path) => path.id === selected.id);
    const pinned = passport.pinnedIds.includes(selected.id);
    const featured = passport.featuredId === selected.id;
    const completionBadge = this.badges.find((badge) => badge.id === `badge_master_adventure_path_${selected.id}`);
    const nextAction = next
      ? next.unlocked
        ? `<button data-focus="${next.id}" class="${this.focusedQuestId === next.id ? 'is-focused' : ''}">${this.focusedQuestId === next.id ? 'HUD 추적 해제' : '이 목표를 HUD에 고정'}</button>`
        : '<span>앞의 이야기를 마치면 자동으로 열려요</span>'
      : '<span>여섯 기록을 모두 완성했어요</span>';
    return `<section class="adventure-path-hero" style="--path-color:${selected.color}">
      <canvas width="${ADVENTURE_PATH_ART_W}" height="${ADVENTURE_PATH_ART_H}" data-adventure-path-art aria-label="여덟 갈래 장기 모험 진로를 그린 픽셀 골목"></canvas>
      <div><small>NO CLASS LOCK · RETROACTIVE</small><h3>여덟 갈래 생활 모험 진로</h3><p>전직이나 포기가 없어요. 당기는 진로를 몇 개든 동시에 즐기고, 이미 한 활동도 모두 인정받으세요.</p></div>
      <aside><span>완주한 진로</span><strong>${paths.filter((path) => path.completed >= path.total).length}<i>/8</i></strong><small>${paths.reduce((sum, path) => sum + path.completed, 0)} / ${paths.reduce((sum, path) => sum + path.total, 0)} 기록</small></aside>
    </section>
    <nav class="adventure-path-rail" aria-label="장기 모험 진로">${paths.map((path, index) => `<button data-adventure-path="${path.id}" class="${path.id === selected.id ? 'sel' : ''} ${path.completed >= path.total ? 'complete' : ''} ${passport.pinnedIds.includes(path.id) ? 'pinned' : ''} ${passport.featuredId === path.id ? 'featured' : ''}" style="--path-color:${path.color};--path-index:${index}">
      <i>${path.mark}</i><span><small>${passport.featuredId === path.id ? '대표 진로' : passport.pinnedIds.includes(path.id) ? '관심 진로' : path.code}</small><b>${escapeHtml(path.name)}</b><em>${path.rank}</em></span><strong>${path.progressPct}%</strong>
    </button>`).join('')}</nav>
    ${this.adventurePathFeedback ? `<p class="adventure-path-feedback" role="status">${escapeHtml(this.adventurePathFeedback)}</p>` : ''}
    <section class="adventure-path-book" style="--path-color:${selected.color}">
      <header><div class="adventure-path-seal"><i>${selected.mark}</i><small>${selected.code}</small></div><div><small>${featured ? '내 대표 진로' : pinned ? '내 관심 진로' : recommendation ? '현재 기록에서 추천' : '언제든 시작 가능'}</small><h3>${escapeHtml(selected.name)}</h3><p>${escapeHtml(selected.description)}</p><em>${escapeHtml(selected.epithet)}</em></div><aside><span>${selected.rank}</span><strong>${selected.completed}<i>/${selected.total}</i></strong><div><i style="width:${selected.progressPct}%"></i></div></aside></header>
      <div class="adventure-path-room"><canvas width="${ADVENTURE_PATH_ROOM_ART_W}" height="${ADVENTURE_PATH_ROOM_ART_H}" data-adventure-path-room-art="${selected.id}" aria-label="${escapeHtml(selected.name)}의 아이소메트릭 픽셀 아지트"></canvas><span>현재 캐릭터 · 동행 펫 · ${selected.completed}/6 기록 반영</span></div>
      <div class="adventure-path-passport-actions"><div><b>내 멀티 진로 패스포트</b><span>관심 ${passport.pinnedIds.length}/${ADVENTURE_PATH_PIN_MAX} · 다른 진로의 진행은 그대로 유지돼요.</span></div><button data-adventure-path-pin="${selected.id}" class="${pinned ? 'is-active' : ''}">${pinned ? '관심 진로에서 빼기' : '관심 진로로 담기'}</button><button data-adventure-path-feature="${selected.id}" class="${featured ? 'is-active' : ''}" ${pinned ? '' : 'disabled'}>${featured ? '대표 진로 해제' : '대표 진로로'}</button></div>
      <div class="adventure-path-next"><span>이 진로의 다음 한 걸음</span><div><b>${escapeHtml(next?.name ?? '모든 기록 완성')}</b><p>${escapeHtml(next ? `${next.desc} · ${next.location}` : selected.reward)}</p></div>${nextAction}</div>
      <ol>${selected.steps.map((quest, index) => {
        const status = quest.done ? 'complete' : quest.unlocked ? 'active' : 'locked';
        const pct = Math.round((Math.min(quest.progress, quest.goal) / quest.goal) * 100);
        return `<li class="is-${status}"><i>${quest.done ? '✓' : String(index + 1).padStart(2, '0')}</i><div><small>${quest.category === 'story' ? '이야기' : quest.category === 'collection' ? '수집' : quest.category === 'mastery' ? '숙련' : '첫걸음'}</small><b>${escapeHtml(quest.done || quest.unlocked ? quest.name : '아직 펼쳐지지 않은 장')}</b><span>${escapeHtml(quest.done || quest.unlocked ? quest.location : '앞의 기록을 마치면 자동으로 표시됩니다.')}</span><em><i style="width:${pct}%"></i></em></div><strong>${quest.done ? '완료' : quest.unlocked ? `${quest.progress}/${quest.goal}` : '잠김'}</strong></li>`;
      }).join('')}</ol>
      <footer class="${completionBadge?.unlocked ? 'is-unlocked' : ''}"><span>${completionBadge?.unlocked ? '실제 완주 보상 획득' : '진로 완주 기념'}</span><b>◆ ${escapeHtml(completionBadge?.name ?? selected.reward)}</b><small>${completionBadge?.unlocked ? `프로필 한마디 「${escapeHtml(selected.epithet)}」 해금` : '영웅 배지 + 전용 프로필 한마디 · 기한과 실패 없음'}</small></footer>
    </section>`;
  }

  private paintAdventurePaths(): void {
    const paths = adventurePathViews(this.views);
    const selectedId = this.selectedAdventurePathId ?? paths[0]?.id;
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-adventure-path-art]');
    const context = canvas?.getContext('2d');
    if (context && selectedId) paintAdventurePathArt(context, paths, selectedId);
    const selected = paths.find((path) => path.id === selectedId);
    const room = this.root.querySelector<HTMLCanvasElement>('[data-adventure-path-room-art]');
    if (selected && room) {
      paintAdventurePathRoomArt(
        room,
        selected,
        this.opts.getAppearance?.() ?? DEFAULT_APPEARANCE,
        this.opts.getPet?.() ?? null,
      );
    }
  }

  private festivalsHtml(): string {
    const quests = this.opts.getQuestState();
    const views = this.opts.festivalArchive.views(quests);
    const progress = this.opts.festivalArchive.progress(quests);
    if (!this.selectedFestivalId || !views.some((view) => view.id === this.selectedFestivalId)) {
      this.selectedFestivalId = progress.trackedId ?? progress.spotlightId;
    }
    const selected = views.find((view) => view.id === this.selectedFestivalId) ?? views[0];
    if (!selected) return '<p class="quest-empty">축제 엽서함을 불러오지 못했어요.</p>';
    const next = selected.next;
    const primaryAction = selected.claimed
      ? `<button data-festival-feature="${selected.id}" class="festival-feature ${selected.featured ? 'is-featured' : ''}">${selected.featured ? '대표 엽서 해제' : '대표 엽서로 전시'}</button>`
      : selected.ready
        ? `<button data-festival-claim="${selected.id}" class="festival-claim">${escapeHtml(selected.postcard)} 보존하기</button>`
        : `<button data-festival-track="${selected.id}" class="festival-track ${selected.tracked ? 'is-tracked' : ''}">${selected.tracked ? '추적 해제' : '이 축제 추적'}</button>`;
    return `<section class="festival-archive-hero" style="--festival-color:${selected.color};--festival-sky:${selected.sky}">
      <canvas width="${FESTIVAL_ART_W}" height="${FESTIVAL_ART_H}" data-festival-art aria-label="${escapeHtml(selected.name)} 픽셀 축제 장면"></canvas>
      <div><small>NO FOMO · ALL FESTIVALS OPEN</small><h3>골목 축제 아카이브</h3><p>지난 축제도 언제든 다시 켤 수 있어요. 이번 주 축제는 광장 조명만 더 밝고, 독점 보상이나 마감일은 없습니다.</p></div>
      <aside><span>영구 엽서</span><strong>${progress.postcards}<i>/${progress.totalPostcards}</i></strong><small>생활 단서 ${progress.clues}/${progress.totalClues}</small></aside>
    </section>
    <nav class="festival-archive-rail" aria-label="골목 축제 목록">${views.map((view, index) => `<button data-festival="${view.id}" class="${view.id === selected.id ? 'sel' : ''} ${view.claimed ? 'claimed' : ''}" style="--festival-color:${view.color};--festival-index:${index}">
      <i>${view.mark}</i><span><small>${view.spotlight ? '이번 주 광장 조명' : view.code}</small><b>${escapeHtml(view.name)}</b><em>${view.claimed ? '엽서 보존됨' : view.ready ? '보존 준비' : `${view.completed}/${view.required} 장면`}</em></span><strong>${view.claimed ? '✓' : `${view.progressPct}%`}</strong>
    </button>`).join('')}</nav>
    ${this.festivalFeedback ? `<p class="festival-feedback" role="status">${escapeHtml(this.festivalFeedback)}</p>` : ''}
    <section class="festival-archive-book" style="--festival-color:${selected.color};--festival-sky:${selected.sky}">
      <header><div class="festival-seal"><i>${selected.mark}</i><small>${selected.code}</small></div><div><small>${selected.spotlight ? '이번 주 광장 조명 · 상시 재생 가능' : '언제든 재생 가능'}</small><h3>${escapeHtml(selected.name)}</h3><p>${escapeHtml(selected.description)}</p><em>${escapeHtml(selected.host)} · ${escapeHtml(selected.subtitle)}</em></div><aside><span>${selected.claimed ? '아카이브 완료' : selected.ready ? '엽서 보존 준비' : '축제 준비 중'}</span><strong>${selected.completed}<i>/${selected.required}</i></strong><div><i style="width:${selected.progressPct}%"></i></div></aside></header>
      <div class="festival-choice-note"><b>네 활동 중 세 개만 골라요</b><span>안 고른 활동도 진행도를 잃지 않고, 축제는 절대 닫히지 않아요.</span>${primaryAction}</div>
      <div class="festival-objectives">${selected.objectives.map((item) => {
        const canGuide = !item.complete && !!villageRequestDestinationForMetric(item.key);
        return `<article class="${item.complete ? 'is-complete' : ''}"><i>${item.complete ? '✓' : item.mark}</i><div><small>${escapeHtml(item.location)}</small><b>${escapeHtml(item.label)}</b><em><i style="width:${item.progressPct}%"></i></em></div><strong>${Math.min(item.current, item.goal)}/${item.goal}</strong>${canGuide ? `<button data-festival-guide="${item.key}" data-festival-guide-title="${escapeHtml(item.label)}">길 안내</button>` : ''}</article>`;
      }).join('')}</div>
      <footer><div><span>완주 엽서</span><b>${escapeHtml(selected.postcard)}</b></div><div><span>보존 기념품</span><b>${escapeHtml(selected.keepsake)}</b></div><small>${next ? `다음 제안 · ${escapeHtml(next.label)}` : '네 장면 모두 기록됨'}</small></footer>
    </section>
    <section class="festival-postcard-shelf"><header><div><small>PERMANENT POSTCARD SHELF</small><h4>나의 축제 엽서함</h4></div><span>대표 엽서는 나중에도 바꿀 수 있어요.</span></header><div>${views.map((view) => `<article class="${view.claimed ? 'is-claimed' : ''} ${view.featured ? 'is-featured' : ''}" style="--festival-color:${view.color}"><i>${view.claimed ? view.mark : '?'}</i><span><b>${escapeHtml(view.claimed ? view.postcard : '빈 엽서 칸')}</b><small>${view.featured ? '대표 전시 중' : view.claimed ? escapeHtml(view.keepsake) : '언제든 채울 수 있어요'}</small></span></article>`).join('')}</div></section>`;
  }

  private paintFestival(): void {
    const selected = this.opts.festivalArchive.views(this.opts.getQuestState()).find((view) => view.id === this.selectedFestivalId);
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-festival-art]');
    const context = canvas?.getContext('2d');
    if (context && selected) paintFestivalArchiveArt(context, selected);
  }

  private requestCard(item: VillageRequestView): string {
    const pct = Math.round((item.progress / item.goal) * 100);
    const action = item.status === 'active'
      ? item.done
        ? `<button class="request-claim" data-request-claim="${item.id}">완료 도장 찍기</button>`
        : `<button class="request-pause" data-request-pause="${item.id}">잠시 보관</button>`
      : item.status === 'paused'
        ? `<button class="request-resume" data-request-accept="${item.id}" ${this.opts.requestBoard.progress().active >= VILLAGE_REQUEST_MAX_ACTIVE ? 'disabled' : ''}>다시 이어가기</button>`
        : `<button class="request-accept" data-request-accept="${item.id}" ${this.opts.requestBoard.progress().active >= VILLAGE_REQUEST_MAX_ACTIVE ? 'disabled' : ''}>수락하기</button>`;
    const canGuide = item.status === 'active' && !item.done && villageRequestDestinationForMetric(item.metric);
    return `<article class="request-card is-${item.status} ${item.done ? 'is-done' : ''} ${item.stamped ? 'is-stamped' : ''}" style="--request-color:${item.color}">
      <header><span>${item.code} · ${VILLAGE_REQUEST_CATEGORY_LABEL[item.category]}</span><em>${item.stamped ? `${item.repeats}회 완료` : '새 도장'}</em></header>
      <div class="request-card-body"><i>${item.stamped ? escapeHtml(item.stamp) : item.status === 'active' ? '진' : '의'}</i><div><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.description)}</p></div></div>
      <div class="request-meta"><span>${escapeHtml(item.requester)}</span><strong>${escapeHtml(item.location)}</strong></div>
      <div class="request-progress"><i style="width:${pct}%"></i></div>
      <footer><span>${item.status === 'available' ? '수락 뒤 증가분부터 기록' : `${item.progress} / ${item.goal}`}</span><div>${canGuide ? `<button class="request-guide" data-request-guide="${item.metric}" data-request-guide-title="${escapeHtml(item.title)}">길 안내</button>` : ''}${action}</div></footer>
    </article>`;
  }

  private requestStoryRail(stories: VillageRequestStoryView[]): string {
    return stories.map((story) => {
      const selected = story.id === this.selectedRequestStoryId;
      const status = story.complete ? '완결' : story.ready ? `${story.ready}장 수령 준비` : `${story.claimed}/3장`;
      return `<button data-request-story="${story.id}" class="${selected ? 'sel' : ''} ${story.complete ? 'complete' : ''}" style="--story-color:${story.color}">
        <i>${story.mark}</i><span><small>${story.code}</small><b>${escapeHtml(story.title)}</b><em>${status}</em></span><strong>${story.claimed}/3</strong>
      </button>`;
    }).join('');
  }

  private requestStoryChapter(chapter: VillageRequestStoryView['chapters'][number]): string {
    const state = chapter.claimed ? '기록 완료' : chapter.ready ? '수령 준비' : chapter.unlocked ? '진행 중' : '앞 장 완료 뒤 열림';
    const requirements = chapter.requirements.map((item) => `<li class="${item.complete ? 'complete' : ''}">
      <i>${item.complete ? '기' : '단'}</i><div><span>${escapeHtml(item.location)}</span><b>${escapeHtml(item.label)}</b><em><i style="width:${item.progressPct}%"></i></em></div>
      <strong>${Math.min(item.current, item.goal)} / ${item.goal}</strong>
      ${item.complete ? '<small>기록됨</small>' : chapter.unlocked ? `<button data-request-guide="${item.key}" data-request-guide-title="${escapeHtml(item.label)}">길 안내</button>` : '<small>잠김</small>'}
    </li>`).join('');
    const action = chapter.claimed
      ? `<blockquote>${escapeHtml(chapter.letter)}</blockquote><p class="request-story-keepsake">보존 기념품 · ${escapeHtml(chapter.keepsake)}</p>`
      : chapter.ready
        ? `<button class="request-story-claim" data-request-story-claim="${chapter.id}">${escapeHtml(chapter.keepsake)} 기록하기</button>`
        : chapter.unlocked ? '<p class="request-story-help">조건은 순서와 관계없이 진행돼요. 이전 평생 기록도 모두 반영됩니다.</p>' : '';
    return `<article class="request-story-chapter ${chapter.claimed ? 'claimed' : ''} ${chapter.ready ? 'ready' : ''} ${chapter.unlocked ? '' : 'locked'}">
      <header><span>ACT ${chapter.act}</span><div><small>${state}</small><h5>${escapeHtml(chapter.title)}</h5><p>${escapeHtml(chapter.summary)}</p></div><strong>${chapter.progressPct}%</strong></header>
      ${chapter.unlocked || chapter.claimed ? `<ul>${requirements}</ul>${action}` : '<p class="request-story-lock">앞 장의 기록을 보존하면 이 편지가 펼쳐집니다.</p>'}
    </article>`;
  }

  private requestStoriesHtml(): string {
    const quests = this.opts.getQuestState();
    const stories = this.opts.requestBoard.storyViews(quests);
    const recommended = this.opts.requestBoard.recommendedStory(quests);
    if (!this.selectedRequestStoryId || !stories.some((story) => story.id === this.selectedRequestStoryId)) {
      this.selectedRequestStoryId = recommended?.id ?? stories[0]?.id ?? null;
    }
    const selected = stories.find((story) => story.id === this.selectedRequestStoryId);
    if (!selected) return '<p class="request-empty">연속 의뢰 편지를 불러오지 못했어요. 단발 의뢰부터 천천히 이어가 주세요.</p>';
    const reward = REQUEST_STORY_REWARD_BY_STORY.get(selected.id)!;
    const rewardUnlocked = selected.complete;
    const rewardSet = `<section class="request-story-reward ${rewardUnlocked ? 'is-unlocked' : 'is-locked'}">
      <header><div><small>THREE-PIECE STORY REWARD</small><h4>${escapeHtml(rewardUnlocked ? reward.title : '완결 뒤 열리는 덕질 세트')}</h4><p>${escapeHtml(rewardUnlocked ? reward.note : '세 번째 장을 보존하면 코디·펫 장식·가구 리폼 레시피가 함께 자동 수령됩니다.')}</p></div><strong>${rewardUnlocked ? '수령 완료' : `${selected.claimed}/3`}</strong></header>
      <div><article><canvas width="${CHAR_W}" height="${CHAR_H}" data-story-reward-outfit="${selected.id}"></canvas><span><i>OUTFIT</i><b>${escapeHtml(rewardUnlocked ? reward.outfit.name : '이야기 전용 코디')}</b><small>${escapeHtml(rewardUnlocked ? reward.outfit.blurb : '아틀리에 옷장에 자동 등록')}</small></span></article>
      <article><canvas width="${PET_W}" height="${PET_H}" data-story-reward-pet="${selected.id}"></canvas><span><i>PET</i><b>${escapeHtml(rewardUnlocked ? reward.petAccessory.name : '동행 전용 장식')}</b><small>${escapeHtml(rewardUnlocked ? reward.petAccessory.description : '펫 액세서리 도감에 자동 등록')}</small></span></article>
      <article><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-story-reward-home="${selected.id}"></canvas><span><i>HOME</i><b>${escapeHtml(rewardUnlocked ? reward.homeRecipe.name : '완결 리폼 레시피')}</b><small>${escapeHtml(rewardUnlocked ? reward.homeRecipe.description : '가구 리폼 공방에 자동 등록')}</small></span></article></div>
      <footer>${rewardUnlocked ? '<button data-village-reward-target="outfit">코디 입어보기</button><button data-village-reward-target="pet">펫에게 달기</button><button data-village-reward-target="home">가구에 적용하기</button>' : '<span>기한·실패·별도 수령 버튼 없음</span>'}</footer>
    </section>`;
    return `<section class="request-story-summary">
      <div><small>PERMANENT NEIGHBORHOOD STORIES</small><h4>여덟 갈래 연속 의뢰</h4><p>각 이야기는 세 장으로 이어집니다. 기한과 실패가 없고, 이미 한 활동도 소급 기록돼요.</p></div>
    </section>
    <section class="request-story-book" style="--story-color:${selected.color}">
      <aside><header><small>EIGHT LETTER ROUTES</small><b>이야기 서랍</b></header>${this.requestStoryRail(stories)}</aside>
      <main>
        <header class="request-story-head"><div><small>${selected.code} · ${VILLAGE_REQUEST_CATEGORY_LABEL[selected.category]}</small><h3>${escapeHtml(selected.title)}</h3><p>${escapeHtml(selected.synopsis)}</p><span>${escapeHtml(selected.patron)}</span></div>
          <button data-request-story-track="${selected.id}" class="${selected.tracked ? 'tracked' : ''}">${selected.tracked ? '추적 해제' : '이 이야기 추적'}</button>
        </header>
        <div class="request-story-line"><i style="--story-progress:${selected.progressPct / 100}"></i><span>${selected.complete ? '세 장 모두 보존됨' : `다음 장 · ${escapeHtml(selected.nextChapter?.title ?? '완결')}`}</span><strong>${selected.claimed}/3</strong></div>
        <div class="request-story-chapters">${selected.chapters.map((item) => this.requestStoryChapter(item)).join('')}</div>
        ${rewardSet}
      </main>
    </section>
    <p class="request-story-footer">${recommended?.id === selected.id ? '현재 가장 가까운 이야기예요.' : recommended ? `추천 · ${escapeHtml(recommended.title)}의 다음 장이 가장 가까워요.` : '모든 연속 의뢰를 완결했어요. 편지와 기념품은 영구 보존됩니다.'}</p>`;
  }

  private requestsHtml(): string {
    const quests = this.opts.getQuestState();
    const progress = this.opts.requestBoard.progress(quests);
    const all = this.opts.requestBoard.views(this.opts.getQuestState());
    const active = all.filter((item) => item.status === 'active');
    const paused = all.filter((item) => item.status === 'paused');
    const catalog = all
      .filter((item) => item.status === 'available' && (this.requestFilter === 'all' || item.category === this.requestFilter))
      .sort((a, b) => Number(a.stamped) - Number(b.stamped) || a.code.localeCompare(b.code));
    const categories = Object.entries(VILLAGE_REQUEST_CATEGORY_LABEL) as [VillageRequestCategory, string][];
    return `<section class="request-board-hero">
      <canvas width="${REQUEST_BOARD_ART_W}" height="${REQUEST_BOARD_ART_H}" data-request-board-art></canvas>
      <div class="request-board-copy"><small>NO DEADLINE · NO FAILURE</small><h3>골목 의뢰소</h3><p>하고 싶은 일 세 장만 골라 두세요. 기간 제한도 실패도 없고, 잠시 보관해도 진행량은 그대로예요.</p></div>
      <div class="request-rank"><span>평판 ${progress.reputation}</span><strong>Lv.${progress.rank}</strong><b>${escapeHtml(progress.rankName)}</b></div>
    </section>
    <nav class="request-board-switch" aria-label="의뢰소 보기"><button data-request-mode="board" class="${this.requestMode === 'board' ? 'sel' : ''}">자유 의뢰 24장</button><button data-request-mode="stories" class="${this.requestMode === 'stories' ? 'sel' : ''}">연속 이야기 8권${progress.storyReady ? `<i>${progress.storyReady}</i>` : ''}</button></nav>
    <section class="request-board-stats">
      ${this.requestMode === 'board' ? `<div><span>활성 의뢰</span><b>${progress.active}<i>/${VILLAGE_REQUEST_MAX_ACTIVE}</i></b></div>
      <div><span>수집 도장</span><b>${progress.uniqueStamps}<i>/${progress.totalStamps}</i></b></div>
      <div><span>분야 도감</span><b>${progress.categoryStamps}<i>/${progress.totalCategories}</i></b></div>
      <div><span>누적 해결</span><b>${progress.totalCompleted}<i>회</i></b></div>` : `<div><span>보존한 장</span><b>${progress.storyChapters}<i>/${progress.storyTotalChapters}</i></b></div>
      <div><span>완결 이야기</span><b>${progress.storyRoutes}<i>/${progress.storyTotalRoutes}</i></b></div>
      <div><span>기록 단서</span><b>${progress.storyClues}<i>/${progress.storyTotalClues}</i></b></div>
      <div><span>수령 준비</span><b>${progress.storyReady}<i>장</i></b></div>`}
    </section>
    ${this.requestFeedback ? `<p class="request-feedback">${escapeHtml(this.requestFeedback)}</p>` : ''}
    ${this.requestMode === 'stories' ? this.requestStoriesHtml() : `<section class="request-active-section"><header><div><small>PINNED REQUESTS</small><h4>지금 돕는 일</h4></div><span>원하는 활동부터 해도 자동으로 올라요.</span></header>
      <div class="request-active-grid">${active.length ? active.map((item) => this.requestCard(item)).join('') : '<p class="request-empty">아직 고른 의뢰가 없어요. 아래 게시판에서 마음 가는 종이를 골라 보세요.</p>'}</div>
      ${paused.length ? `<details class="request-paused"><summary>잠시 보관한 의뢰 ${paused.length}장</summary><div>${paused.map((item) => this.requestCard(item)).join('')}</div></details>` : ''}
    </section>
    <section class="request-catalog"><header><div><small>24 PAPER ARCHIVE</small><h4>의뢰 게시판</h4></div><nav><button data-request-filter="all" class="${this.requestFilter === 'all' ? 'sel' : ''}">전체</button>${categories.map(([id, label]) => `<button data-request-filter="${id}" class="${this.requestFilter === id ? 'sel' : ''}">${label}</button>`).join('')}</nav></header>
      <div class="request-catalog-grid">${catalog.map((item) => this.requestCard(item)).join('')}</div>
    </section>`}`;
  }

  private bindRequestActions(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-mode]').forEach((button) => button.addEventListener('click', () => {
      this.requestMode = button.dataset.requestMode === 'stories' ? 'stories' : 'board';
      this.requestFeedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-filter]').forEach((button) => button.addEventListener('click', () => {
      this.requestFilter = button.dataset.requestFilter as 'all' | VillageRequestCategory; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-accept]').forEach((button) => button.addEventListener('click', () => {
      const result = this.opts.requestBoard.accept(button.dataset.requestAccept!, this.opts.getQuestState());
      this.requestFeedback = result.ok ? `「${result.view.title}」 의뢰를 수첩에 꽂았어요.` : '활성 의뢰는 세 장까지예요. 하나를 잠시 보관한 뒤 골라 주세요.';
      this.opts.onRequestChanged(this.opts.requestBoard.progress(this.opts.getQuestState())); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-pause]').forEach((button) => button.addEventListener('click', () => {
      const result = this.opts.requestBoard.pause(button.dataset.requestPause!, this.opts.getQuestState());
      this.requestFeedback = result.ok ? `「${result.view.title}」 진행을 잃지 않고 보관했어요.` : '완료한 의뢰는 먼저 도장을 찍어 주세요.';
      this.opts.onRequestChanged(this.opts.requestBoard.progress(this.opts.getQuestState())); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-claim]').forEach((button) => button.addEventListener('click', () => {
      const result = this.opts.requestBoard.claim(button.dataset.requestClaim!, this.opts.getQuestState());
      this.requestFeedback = result.ok ? `「${result.view.title}」 완료 도장을 받았어요. 언제든 다시 도울 수 있어요.` : '아직 필요한 기록이 남아 있어요.';
      this.opts.onRequestChanged(this.opts.requestBoard.progress(this.opts.getQuestState())); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-story]').forEach((button) => button.addEventListener('click', () => {
      this.selectedRequestStoryId = button.dataset.requestStory as VillageRequestStoryId;
      this.requestFeedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-story-track]').forEach((button) => button.addEventListener('click', () => {
      const storyId = button.dataset.requestStoryTrack as VillageRequestStoryId;
      const current = this.opts.requestBoard.storyViews(this.opts.getQuestState()).find((story) => story.id === storyId);
      this.opts.requestBoard.trackStory(current?.tracked ? null : storyId);
      this.requestFeedback = current?.tracked ? '연속 이야기 추적을 해제했어요. 기록은 그대로 남습니다.' : `「${current?.title ?? '연속 이야기'}」를 추천 목표로 고정했어요.`;
      this.opts.onRequestChanged(this.opts.requestBoard.progress(this.opts.getQuestState()));
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-story-claim]').forEach((button) => button.addEventListener('click', () => {
      const result = this.opts.requestBoard.claimStoryChapter(button.dataset.requestStoryClaim!, this.opts.getQuestState());
      this.requestFeedback = result.ok ? `「${result.view.title}」의 다음 장을 영구 기록했어요.` : '아직 기록하지 못한 단서가 남아 있어요.';
      this.opts.onRequestChanged(this.opts.requestBoard.progress(this.opts.getQuestState()));
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-request-guide]').forEach((button) => button.addEventListener('click', () => {
      this.opts.onRequestNavigate?.(button.dataset.requestGuide!, button.dataset.requestGuideTitle ?? '의뢰 목표');
    }));
  }

  private paintRequestStoryReward(): void {
    const rewards = requestStoryRewardViews(this.badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
    for (const reward of rewards) {
      const outfit = this.root.querySelector<HTMLCanvasElement>(`[data-story-reward-outfit="${reward.storyId}"]`);
      const outfitContext = outfit?.getContext('2d');
      if (outfitContext) paintCharacterFrame(outfitContext, normalizeAppearance({ ...DEFAULT_APPEARANCE, ...reward.outfit.style }), 0, 1);
      const pet = this.root.querySelector<HTMLCanvasElement>(`[data-story-reward-pet="${reward.storyId}"]`);
      const petContext = pet?.getContext('2d');
      if (petContext) paintPet(petContext, 'dog', reward.petAccessory.id);
      const home = this.root.querySelector<HTMLCanvasElement>(`[data-story-reward-home="${reward.storyId}"]`);
      if (home) paintFurnitureReformPreview(home, 'desk_wood', reward.homeRecipe.style);
    }
  }

  private chronicleContext() {
    const journey = villageJourneySummary(this.views, this.masteries);
    return {
      completed: journey.completedChapters,
      views: villageChronicleViews(this.chronicle.get(), this.opts.getQuestState(), journey.completedChapters),
    };
  }

  private chronicleHtml(): string {
    const context = this.chronicleContext();
    const progress = this.chronicle.progress();
    const defaultView = context.views.find((view) => view.status === 'active')
      ?? [...context.views].reverse().find((view) => view.status === 'complete')
      ?? context.views[0]!;
    const selected = context.views.find((view) => view.id === this.selectedChronicleId) ?? defaultView;
    this.selectedChronicleId = selected.id;
    const reward = journeyChapterRewardViews(this.badges.filter((badge) => badge.unlocked).map((badge) => badge.id))
      .find((item) => item.chapter === selected.chapter)!;
    const statusLabel = selected.status === 'complete' ? (selected.reflection ? '원고 보존 완료' : '마지막 문장 선택 가능')
      : selected.status === 'active' ? '현재 메인 장' : `제 ${selected.chapter - 1}장 완료 후 개방`;
    const routeCards = selected.routes.map((route) => {
      const pct = Math.round((Math.min(route.current, route.goal) / route.goal) * 100);
      return `<article class="chronicle-route-card ${route.selected ? 'is-selected' : ''} ${route.complete ? 'is-complete' : ''}">
        <button class="chronicle-route-choice" data-chronicle-route="${selected.id}:${route.id}" ${selected.status === 'locked' ? 'disabled' : ''}><i>${escapeHtml(route.mark)}</i><span><small>${route.complete ? '이미 경험함' : route.selected ? '선택한 길' : '선택 가능한 길'}</small><b>${escapeHtml(route.title)}</b><em>${escapeHtml(route.description)}</em></span></button>
        <div><span><i style="width:${pct}%"></i></span><b>${Math.min(route.current, route.goal)}/${route.goal}</b><button data-chronicle-guide="${escapeHtml(route.metric)}" data-chronicle-title="${escapeHtml(route.title)}">길 안내</button></div>
        <small>${escapeHtml(route.location)}</small>
      </article>`;
    }).join('');
    const reflectionBlock = selected.status !== 'complete'
      ? `<section class="chronicle-reflection is-waiting"><header><small>FINAL SENTENCE</small><h4>이 장의 마지막 문장은 아직 비어 있어요</h4></header><p>${selected.status === 'active' ? '여정 목표 중 마음에 드는 활동을 필요한 만큼 마치면 세 가지 결말이 모두 열립니다.' : '앞 장을 먼저 마쳐도 지금 해 둔 생활 기록은 사라지지 않고 소급 인정돼요.'}</p></section>`
      : `<section class="chronicle-reflection"><header><small>FINAL SENTENCE · NO WRONG ANSWER</small><h4>이 장에서 무엇을 가장 오래 남길까요?</h4><span>${selected.reflection ? '언제든 다시 고를 수 있어요.' : '세 선택 모두 같은 보상을 받아요.'}</span></header>
        <div>${selected.reflections.map((item) => `<button class="${selected.reflection?.id === item.id ? 'is-selected' : ''}" data-chronicle-reflection="${selected.id}:${item.id}"><i>${escapeHtml(item.mark)}</i><span><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.line)}</small><em>${escapeHtml(item.keepsake)}</em></span></button>`).join('')}</div>
        ${selected.reflection ? `<footer><span>영구 보존 기념</span><b>${escapeHtml(selected.reflection.keepsake)}</b><button data-chronicle-feature="${selected.id}">${selected.featured ? '대표 원고에서 내리기' : '대표 원고로 전시하기'}</button></footer>` : ''}
      </section>`;
    const rewardBlock = `<section class="chronicle-reward ${reward.unlocked ? 'is-unlocked' : 'is-locked'}">
      <header><div><small>CHAPTER THREE-PIECE REWARD</small><h4>${escapeHtml(reward.unlocked ? reward.title : `제${reward.chapter}장 완결 세트`)}</h4><p>${escapeHtml(reward.unlocked ? reward.note : '이 장을 완결하면 코디·동행 장식·가구 리폼 레시피가 동시에 영구 등록됩니다.')}</p></div><strong>${reward.unlocked ? '자동 수령 완료' : '완결 뒤 개방'}</strong></header>
      <div><article><canvas width="${CHAR_W}" height="${CHAR_H}" data-chronicle-reward-outfit="${reward.chapter}"></canvas><span><i>OUTFIT</i><b>${escapeHtml(reward.unlocked ? reward.outfit.name : '메인 장 전용 코디')}</b><small>${escapeHtml(reward.unlocked ? reward.outfit.blurb : '얼굴과 머리는 유지하고 옷장에 등록')}</small></span></article>
      <article><canvas width="${PET_W}" height="${PET_H}" data-chronicle-reward-pet="${reward.chapter}"></canvas><span><i>PET</i><b>${escapeHtml(reward.unlocked ? reward.petAccessory.name : '메인 장 동행 장식')}</b><small>${escapeHtml(reward.unlocked ? reward.petAccessory.description : '능력치 손해 없는 영구 장식')}</small></span></article>
      <article><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-chronicle-reward-home="${reward.chapter}"></canvas><span><i>HOME</i><b>${escapeHtml(reward.unlocked ? reward.homeRecipe.name : '메인 장 리폼 레시피')}</b><small>${escapeHtml(reward.unlocked ? reward.homeRecipe.description : '기존 가구 위치와 점수는 그대로 보존')}</small></span></article></div>
      <footer>${reward.unlocked ? '<button data-village-reward-target="outfit">코디 입어보기</button><button data-village-reward-target="pet">동행에게 달기</button><button data-village-reward-target="home">가구에 적용하기</button>' : '<span>기한·실패·별도 수령 버튼 없음</span>'}</footer>
    </section>`;
    return `<section class="chronicle-hero"><div><small>MAIN SCENARIO · PERMANENT STORY</small><h3>홍대마을 메인 연대기</h3><p>전투, 집, 코디, 펫, 관계와 생활 중 편한 길로 같은 이야기에 도착합니다. 실패·기간 제한·사라지는 보상은 없어요.</p></div><aside><strong>${progress.pages}<i>/8</i></strong><span>보존 원고</span><small>${progress.motifs}/3 기억 방식 · ${progress.routesChosen}개 길 선택</small></aside></section>
      ${this.chronicleFeedback ? `<p class="chronicle-feedback">${escapeHtml(this.chronicleFeedback)}</p>` : ''}
      <div class="chronicle-layout">
        <main class="chronicle-feature" style="--chronicle-color:${selected.palette[0]}">
          <div class="chronicle-art"><canvas width="${CHRONICLE_ART_W}" height="${CHRONICLE_ART_H}" data-chronicle-art="${selected.id}" aria-label="${escapeHtml(selected.title)} 픽셀 원화"></canvas><span>${escapeHtml(statusLabel)}</span></div>
          <header><div><small>${escapeHtml(selected.code)} · ${escapeHtml(selected.cast)}</small><h3>${escapeHtml(selected.title)}</h3></div><strong>${String(selected.chapter).padStart(2, '0')}</strong></header>
          <p class="chronicle-premise">${escapeHtml(selected.premise)}</p><blockquote>${escapeHtml(selected.scene)}</blockquote>
          <section class="chronicle-routes"><header><div><small>THREE EQUAL ROUTES</small><h4>이 장을 살아가는 세 가지 방법</h4></div><span>선택은 안내만 바꾸며 다른 활동을 막지 않아요.</span></header><div>${routeCards}</div></section>
          ${reflectionBlock}
          ${rewardBlock}
        </main>
        <aside class="chronicle-index"><header><small>EIGHT CHAPTERS</small><h3>원고 목차</h3><p>끝낸 활동은 어떤 장에서도 다시 요구하지 않아요.</p></header><div>${context.views.map((view) => `<button class="is-${view.status} ${view.id === selected.id ? 'is-selected' : ''} ${view.reflection ? 'is-archived' : ''}" data-chronicle-chapter="${view.id}"><i>${String(view.chapter).padStart(2, '0')}</i><span><b>${escapeHtml(view.title)}</b><small>${view.reflection ? escapeHtml(view.reflection.keepsake) : view.status === 'complete' ? '마지막 문장 선택 가능' : view.status === 'active' ? '현재 메인 장' : '앞 장 뒤에 열림'}</small></span><em>${view.featured ? '★' : view.reflection ? '보존' : view.status === 'locked' ? '잠김' : '진행'}</em></button>`).join('')}</div></aside>
      </div>`;
  }

  private paintChronicle(): void {
    const views = this.chronicleContext().views;
    this.root.querySelectorAll<HTMLCanvasElement>('[data-chronicle-art]').forEach((canvas) => {
      const view = views.find((item) => item.id === canvas.dataset.chronicleArt);
      if (view) paintVillageChronicleArt(canvas, view);
    });
    const rewards = journeyChapterRewardViews(this.badges.filter((badge) => badge.unlocked).map((badge) => badge.id));
    for (const reward of rewards) {
      const outfit = this.root.querySelector<HTMLCanvasElement>(`[data-chronicle-reward-outfit="${reward.chapter}"]`);
      const outfitContext = outfit?.getContext('2d');
      if (outfitContext) paintCharacterFrame(outfitContext, normalizeAppearance({ ...DEFAULT_APPEARANCE, ...reward.outfit.style }), 0, 1);
      const pet = this.root.querySelector<HTMLCanvasElement>(`[data-chronicle-reward-pet="${reward.chapter}"]`);
      const petContext = pet?.getContext('2d');
      if (petContext) paintPet(petContext, 'dog', reward.petAccessory.id);
      const home = this.root.querySelector<HTMLCanvasElement>(`[data-chronicle-reward-home="${reward.chapter}"]`);
      if (home) paintFurnitureReformPreview(home, 'desk_wood', reward.homeRecipe.style);
    }
  }

  private render(): void {
    const visible = this.visible();
    const done = this.views.filter((q) => q.done).length;
    const firstOpen = this.views.find((q) => q.id === 'intro_journal');
    const intro = firstOpen?.done
      ? '하고 싶은 일을 골라도 괜찮아요. 이미 한 행동도 자동으로 기록됩니다.'
      : '먼저 추천 탭부터 천천히 따라와 보세요. 길을 잃어도 진행이 사라지지 않아요.';

    this.root.innerHTML = `<div class="hv-shop-card quest-journal ${this.tab === 'requests' ? 'request-mode' : ''} ${this.tab === 'chronicle' ? 'chronicle-mode' : ''} ${this.tab === 'journey' ? 'journey-mode' : ''} ${this.tab === 'growth' ? 'growth-mode' : ''} ${this.tab === 'paths' ? 'paths-mode' : ''} ${this.tab === 'festivals' ? 'festivals-mode' : ''} ${this.tab === 'fanwork' ? 'fanwork-mode' : ''} ${this.tab === 'daily' ? 'daily-mode' : ''}">
      <div class="hv-cafe-head">
        <div><h2>홍대마을 모험 일지</h2><span class="quest-total">완료 ${done} / ${this.views.length}</span></div>
        <button class="close" aria-label="닫기">✕</button>
      </div>
      <p class="quest-intro">${intro}</p>
      <nav class="quest-tabs">${TABS.map((t) =>
        `<button data-tab="${t.id}" class="${this.tab === t.id ? 'sel' : ''}">${t.label}</button>`,
      ).join('')}</nav>
      <div class="hv-quest-rows ${this.tab === 'requests' ? 'request-board-mode' : ''}">${this.sessionPlannerHtml()}${this.starterCompassHtml()}${this.guideHtml()}${this.tab === 'badges'
        ? this.badgesHtml()
        : this.tab === 'chronicle' ? this.chronicleHtml()
        : this.tab === 'paths' ? this.adventurePathsHtml()
        : this.tab === 'festivals' ? this.festivalsHtml()
        : this.tab === 'fanwork' ? this.fanMerchHtml()
        : this.tab === 'requests' ? this.requestsHtml()
        : this.tab === 'journey' ? this.journeyHtml()
        : this.tab === 'growth' ? this.masteriesHtml()
        : this.tab === 'daily' ? `${this.dailyInvitationsHtml()}${visible.length ? visible.map((q) => this.row(q)).join('') : ''}`
        : visible.length ? visible.map((q) => this.row(q)).join('') : '<p class="quest-empty">이 탭의 기록을 모두 확인했어요.</p>'}</div>
      ${this.online ? '' : '<p class="off">오프라인에서도 진행은 저장돼요. 일일 코인 수령은 접속 후 가능해요.</p>'}
    </div>`;

    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    const boardCanvas = this.root.querySelector<HTMLCanvasElement>('[data-request-board-art]');
    const boardContext = boardCanvas?.getContext('2d');
    if (boardContext) paintRequestBoardArt(boardContext, this.opts.requestBoard.progress(this.opts.getQuestState()));
    if (this.tab === 'chronicle') this.paintChronicle();
    if (this.tab === 'journey') this.paintJourneyRewards();
    if (this.tab === 'growth') this.paintLifeSpecialties();
    if (this.tab === 'daily') this.paintDailyInvitations();
    if (this.tab === 'recommended') { this.paintSessionPlanner(); this.paintStarterCompass(); }
    if (this.tab === 'paths') this.paintAdventurePaths();
    if (this.tab === 'festivals') this.paintFestival();
    if (this.tab === 'fanwork') this.paintFanMerch();
    if (this.tab === 'requests' && this.requestMode === 'stories') this.paintRequestStoryReward();
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => { this.tab = button.dataset.tab as JournalTab; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-merch-subject]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFanMerchSubjectKey = button.dataset.fanMerchSubject!;
        this.pendingFanMerchOverwriteSlot = null;
        this.fanMerchFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-merch-format]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFanMerchFormatId = button.dataset.fanMerchFormat as FanMerchFormatId;
        this.pendingFanMerchOverwriteSlot = null;
        this.fanMerchFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-merch-motif]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFanMerchMotifId = button.dataset.fanMerchMotif as FanMerchMotifId;
        this.pendingFanMerchOverwriteSlot = null;
        this.fanMerchFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-merch-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFanMerchSlot = Number(button.dataset.fanMerchSlot);
        this.pendingFanMerchOverwriteSlot = null;
        this.fanMerchFeedback = `${this.selectedFanMerchSlot + 1}번 소장칸을 골랐어요.`;
        this.render();
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-fan-merch-save]')?.addEventListener('click', () => {
      const occupied = !!this.fanMerch.get().slots[this.selectedFanMerchSlot];
      if (occupied && this.pendingFanMerchOverwriteSlot !== this.selectedFanMerchSlot) {
        this.pendingFanMerchOverwriteSlot = this.selectedFanMerchSlot;
        this.fanMerchFeedback = '이미 굿즈가 있는 칸이에요. 같은 버튼을 한 번 더 누르면 교체하며, 과거 디자인 도장은 남습니다.';
        this.render();
        return;
      }
      const result = this.fanMerch.save(this.selectedFanMerchSlot, this.fanMerchDraft());
      this.pendingFanMerchOverwriteSlot = null;
      this.fanMerchFeedback = result === 'saved'
        ? '새 최애 굿즈를 소장칸에 보존했어요. 현재 모습은 독립 픽셀 스냅샷으로 남습니다.'
        : result === 'replaced'
          ? '소장칸의 굿즈를 교체했어요. 이전에 발견한 디자인 도감은 그대로 남아요.'
          : '소장칸을 다시 고른 뒤 제작해 주세요.';
      if (result !== 'invalid-slot') this.opts.onFanMerchChanged?.(this.fanMerch.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-merch-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.fanMerch.feature(button.dataset.fanMerchFeature!);
        this.fanMerchFeedback = result === 'featured' ? '대표 굿즈 진열대에 올렸어요.'
          : result === 'cleared' ? '대표 자리에서만 내렸어요. 소장품과 디자인 기록은 그대로예요.'
            : result === 'full' ? '대표 굿즈는 세 점까지예요. 한 점을 내린 뒤 새 최애를 올려 주세요.'
              : '소장품을 다시 찾지 못했어요.';
        if (result === 'featured' || result === 'cleared') this.opts.onFanMerchChanged?.(this.fanMerch.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-life-specialty]').forEach((button) => {
      button.addEventListener('click', () => {
        const before = this.lifeSpecialty.progress(this.masteries);
        const result = this.lifeSpecialty.toggle(button.dataset.lifeSpecialty!, this.masteries);
        const after = this.lifeSpecialty.progress(this.masteries);
        const newSynergy = after.discoveredSynergies > before.discoveredSynergies && after.currentSynergyId
          ? LIFE_SYNERGY_BY_ID.get(after.currentSynergyId) ?? null : null;
        this.specialtyFeedback = newSynergy ? `새 생활 시너지 「${newSynergy.title}」을 발견했어요. 조합을 바꿔도 도감에 영구 보존됩니다.`
          : result === 'added' ? '대표 전문성에 올렸어요. 서로 다른 분야 세 장이 만나면 생활 시너지를 발견할 수 있어요.'
          : result === 'removed' ? '대표 전시에서만 내렸어요. 해금한 자격과 숙련 레벨은 그대로예요.'
            : result === 'full' ? '대표 전문성은 세 장까지예요. 한 장을 내린 뒤 새 최애를 골라 주세요.'
              : result === 'locked' ? '이 활동을 조금 더 즐기면 자동으로 열려요. 미리 한 기록도 모두 반영됩니다.' : '자격 카드를 찾지 못했어요.';
        if (result === 'added' || result === 'removed') this.opts.onLifeSpecialtyChanged(after);
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-life-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.lifeGuide!, button.dataset.lifeGuideTitle ?? '생활 숙련 활동',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-daily-invite-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const featured = this.featuredLifeSpecialtyIds(this.masteries);
        const result = this.dailyInvitations.claim(button.dataset.dailyInviteClaim!, this.opts.getQuestState(), featured);
        this.dailyInvitationFeedback = result === 'claimed' ? '오늘의 도장을 남겼어요. 이 초대장의 첫 도장은 영구 수집책에도 보존됩니다.'
          : result === 'already' ? '이미 오늘 도장을 남긴 초대예요.' : '조금만 더 즐기면 도장을 남길 수 있어요.';
        this.opts.onDailyInvitationsChanged(this.dailyInvitations.progress(this.opts.getQuestState(), featured));
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-daily-invite-reroll]').forEach((button) => {
      button.addEventListener('click', () => {
        const featured = this.featuredLifeSpecialtyIds(this.masteries);
        const next = this.dailyInvitations.reroll(Number(button.dataset.dailyInviteReroll), this.opts.getQuestState(), featured);
        this.dailyInvitationFeedback = next ? '다른 초대장이 도착했어요. 오늘 이미 한 활동의 진행량은 그대로 반영됩니다.' : '도장을 남긴 초대는 오늘의 기록으로 보존돼요.';
        this.opts.onDailyInvitationsChanged(this.dailyInvitations.progress(this.opts.getQuestState(), featured));
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-daily-invite-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.dailyInviteGuide!, button.dataset.dailyInviteTitle ?? '오늘의 생활 초대',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-chronicle-chapter]').forEach((button) => {
      button.addEventListener('click', () => { this.selectedChronicleId = button.dataset.chronicleChapter!; this.chronicleFeedback = ''; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-chronicle-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const [chapterId, routeId] = button.dataset.chronicleRoute!.split(':');
        const completed = villageJourneySummary(this.views, this.masteries).completedChapters;
        if (chapterId && routeId && this.chronicle.chooseRoute(chapterId, routeId, completed)) {
          this.chronicleFeedback = '이 길을 현재 장의 책갈피로 꽂았어요. 다른 활동도 언제든 계속할 수 있어요.';
          this.opts.onChronicleChanged(this.chronicle.progress()); this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-chronicle-reflection]').forEach((button) => {
      button.addEventListener('click', () => {
        const [chapterId, motif] = button.dataset.chronicleReflection!.split(':');
        const completed = villageJourneySummary(this.views, this.masteries).completedChapters;
        if (chapterId && motif && this.chronicle.reflect(chapterId, motif as ChronicleMotifId, completed)) {
          const view = this.chronicleContext().views.find((item) => item.id === chapterId);
          this.chronicleFeedback = view?.reflection ? `「${view.reflection.keepsake}」와 마지막 문장을 영구 보존했어요.` : '마지막 문장을 보존했어요.';
          this.opts.onChronicleChanged(this.chronicle.progress()); this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-chronicle-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        if (this.chronicle.feature(button.dataset.chronicleFeature!)) {
          this.chronicleFeedback = '대표 원고 전시를 바꾸었어요.';
          this.opts.onChronicleChanged(this.chronicle.progress()); this.render();
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-chronicle-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.chronicleGuide!, button.dataset.chronicleTitle ?? '메인 연대기 활동',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-adventure-path]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedAdventurePathId = button.dataset.adventurePath as AdventurePathId;
        this.adventurePathFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-level-memory-level]').forEach((button) => {
      button.addEventListener('click', () => {
        const level = Number(button.dataset.levelMemoryLevel) as VillageLevelMemoryLevel;
        if (!VILLAGE_LEVEL_MEMORY_LEVELS.includes(level)) return;
        this.selectedLevelMemoryLevel = level;
        this.levelMemoryFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-level-memory-domain]').forEach((button) => {
      button.addEventListener('click', () => {
        const level = this.selectedLevelMemoryLevel;
        const domainId = button.dataset.levelMemoryDomain as VillageLevelMemoryDomainId;
        const currentLevel = villageJourneySummary(this.views, this.masteries).level.level;
        if (!level) return;
        const result = this.villageLevelMemories.choose(level, domainId, currentLevel);
        const domain = VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.get(domainId);
        this.levelMemoryFeedback = result === 'saved'
          ? `Lv.${level}의 기억을 「${domain?.name ?? '레벨업 추억'}」 장면으로 영구 보존했어요.`
          : result === 'changed' ? `Lv.${level}의 장면을 다시 골랐어요. 보상과 다른 기록은 그대로예요.`
            : result === 'locked' ? '아직 도달하지 않은 레벨의 장면이에요.' : '이 장면을 다시 찾지 못했어요.';
        this.opts.onVillageLevelMemoriesChanged?.(this.villageLevelMemories.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-adventure-path-pin]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.adventurePathPin as AdventurePathId;
        const result = this.adventurePathPassport.togglePin(id);
        this.adventurePathFeedback = result === 'pinned' ? '관심 진로로 담았어요. 다른 진로도 계속 진행돼요.'
          : result === 'unpinned' ? '관심 표시만 뺐어요. 지금까지의 진행 기록은 그대로예요.'
            : result === 'full' ? `관심 진로는 ${ADVENTURE_PATH_PIN_MAX}개까지예요. 먼저 하나를 빼 주세요.`
              : '진로 기록을 다시 찾지 못했어요.';
        this.opts.onAdventurePathsChanged?.(this.adventurePathPassport.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-adventure-path-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.adventurePathPassport.toggleFeatured(button.dataset.adventurePathFeature as AdventurePathId);
        this.adventurePathFeedback = result === 'featured' ? '대표 진로로 모험 일지 첫 장에 꽂았어요. 언제든 바꿀 수 있어요.'
          : result === 'cleared' ? '대표 표시를 내렸어요. 관심 진로와 진행 기록은 그대로예요.'
            : result === 'unpinned' ? '먼저 관심 진로로 담아 주세요.' : '진로 기록을 다시 찾지 못했어요.';
        this.opts.onAdventurePathsChanged?.(this.adventurePathPassport.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-festival]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFestivalId = button.dataset.festival as FestivalId;
        this.festivalFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-festival-track]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.festivalTrack as FestivalId;
        const current = this.opts.festivalArchive.get().trackedId;
        this.opts.festivalArchive.track(current === id ? null : id);
        this.festivalFeedback = current === id ? '축제 추적을 해제했어요. 진행 기록은 그대로예요.' : `「${this.opts.festivalArchive.views(this.opts.getQuestState()).find((view) => view.id === id)?.name ?? '축제'}」를 모험 수첩에 꽂았어요.`;
        this.opts.onFestivalChanged(this.opts.festivalArchive.progress(this.opts.getQuestState()));
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-festival-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.opts.festivalArchive.claim(button.dataset.festivalClaim!, this.opts.getQuestState());
        this.festivalFeedback = result.ok ? `「${result.view.postcard}」와 「${result.view.keepsake}」${objectParticle(result.view.keepsake)} 영구 보존했어요.` : result.reason === 'claimed' ? '이미 보존한 엽서예요.' : '네 활동 중 하나가 더 필요해요.';
        this.opts.onFestivalChanged(this.opts.festivalArchive.progress(this.opts.getQuestState()));
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-festival-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.festivalFeature as FestivalId;
        const current = this.opts.festivalArchive.get().featuredId;
        this.opts.festivalArchive.feature(current === id ? null : id);
        this.festivalFeedback = current === id ? '대표 엽서를 내렸어요.' : '대표 엽서를 바꾸었어요.';
        this.opts.onFestivalChanged(this.opts.festivalArchive.progress(this.opts.getQuestState()));
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-festival-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.festivalGuide!, button.dataset.festivalGuideTitle ?? '축제 활동',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-q]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onClaim(button.dataset.q!));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-badge]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onEquipBadge(button.dataset.badge!));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-focus]').forEach((button) => {
      button.addEventListener('click', () => {
        const requested = button.dataset.focus!;
        this.focusedQuestId = this.focusedQuestId === requested ? null : requested;
        this.opts.onFocus(this.focusedQuestId);
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-session-plan-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const questId = button.dataset.sessionPlanToggle!;
        const quest = this.views.find((item) => item.id === questId);
        const result = this.sessionPlanner.toggle(questId, this.views);
        this.sessionPlannerFeedback = result === 'added' ? `「${quest?.name ?? '목표'}」을 오늘의 플레이 큐에 담았어요.`
          : result === 'removed' ? '큐에서만 뺐어요. 퀘스트 진행과 보상은 그대로 남습니다.'
            : result === 'full' ? '플레이 큐는 세 목표까지예요. 하나를 빼거나 완주 페이지를 보존해 주세요.'
              : result === 'locked' ? '앞 이야기가 열리면 이 목표도 담을 수 있어요.'
                : result === 'done' ? '이미 완성한 목표예요. 아직 진행 중인 목표를 골라 주세요.' : '목표를 다시 찾지 못했어요.';
        if (result === 'added' || result === 'removed') this.opts.onSessionPlannerChanged?.(this.sessionPlanner.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-session-plan-guide]').forEach((button) => {
      button.addEventListener('click', () => {
        const quest = this.views.find((item) => item.id === button.dataset.sessionPlanGuide);
        if (!quest || quest.done) return;
        this.focusedQuestId = quest.id;
        this.opts.onFocus(quest.id);
        this.opts.onRequestNavigate?.(quest.registryKey, quest.name);
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-session-plan-archive]')?.addEventListener('click', () => {
      const result = this.sessionPlanner.archive(this.views);
      this.sessionPlannerFeedback = result.ok
        ? '세 정류장을 한 장의 영구 모험 페이지로 보존했어요. 새 큐는 비어 있는 상태로 시작합니다.'
        : result.reason === 'not-full' ? '목표 세 개를 먼저 담아 주세요.'
          : result.reason === 'not-complete' ? '아직 진행 중인 정류장이 있어요. 가장 가까운 한 걸음부터 안내할게요.'
            : '보존할 목표 중 하나를 다시 찾지 못했어요.';
      if (result.ok) this.opts.onSessionPlannerChanged?.(this.sessionPlanner.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-session-plan-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.sessionPlanner.feature(button.dataset.sessionPlanFeature!);
        this.sessionPlannerFeedback = result === 'featured' ? '이 세 정류장을 나의 대표 모험 페이지로 남겼어요.'
          : result === 'cleared' ? '대표 표시만 내렸어요. 완주 페이지는 그대로 보존됩니다.' : '완주 페이지를 다시 찾지 못했어요.';
        if (result !== 'missing') this.opts.onSessionPlannerChanged?.(this.sessionPlanner.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-village-reward-target]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onOpenVillageReward?.(
        button.dataset.villageRewardTarget as 'outfit' | 'pet' | 'home',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.starterGuide!, button.dataset.starterTitle ?? '첫날 추천 활동',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const routeId = button.dataset.starterClaim as StarterCompassRouteId;
        const route = starterCompassRouteViews(this.opts.getQuestState()).find((item) => item.id === routeId);
        const result = this.starterPreference.claim(routeId, !!route?.complete);
        this.starterFeedback = result === 'claimed'
          ? `${route?.mentorName ?? '마을 멘토'}의 편지와 「${route?.reward ?? '환영 기념품'}」을 영구 보존했어요.`
          : result === 'already' ? '이미 수령한 환영 소포예요.'
            : result === 'not-ready' ? '이 방향에서 편한 활동 하나만 더 경험하면 소포가 도착해요.'
              : '환영 소포의 방향을 다시 확인하지 못했어요.';
        if (result === 'claimed') this.opts.onStarterCompassChanged?.(this.starterPreference.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const routeId = button.dataset.starterFeature as StarterCompassRouteId;
        const route = starterCompassRouteViews(this.opts.getQuestState()).find((item) => item.id === routeId);
        const result = this.starterPreference.feature(routeId);
        this.starterFeedback = result === 'featured'
          ? `「${route?.reward ?? '환영 기념품'}」을 나의 첫 생활 표식으로 전시했어요.`
          : result === 'cleared' ? '대표 전시에서만 내렸어요. 편지와 기념품은 수집책에 그대로 남아요.'
            : result === 'locked' ? '먼저 이 방향의 환영 소포를 받아 주세요.'
              : '대표로 고를 기념품을 다시 확인하지 못했어요.';
        if (result === 'featured' || result === 'cleared') {
          this.opts.onStarterCompassChanged?.(this.starterPreference.progress());
        }
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-select]').forEach((button) => {
      button.addEventListener('click', () => {
        const routeId = button.dataset.starterSelect || null;
        this.starterPreference.select(routeId as StarterCompassRouteId | null);
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-route]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedStarterMentorRouteId = button.dataset.starterMentorRoute as StarterCompassRouteId;
        this.selectedStarterMentorChapterId = null;
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-chapter]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedStarterMentorChapterId = button.dataset.starterMentorChapter ?? null;
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-guide]').forEach((button) => {
      button.addEventListener('click', () => this.opts.onRequestNavigate?.(
        button.dataset.starterMentorGuide!, button.dataset.starterMentorTitle ?? '멘토 성장 활동',
      ));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const chapterId = button.dataset.starterMentorClaim!;
        const chapter = this.starterPreference.mentorViews(this.opts.getQuestState()).find((item) => item.id === chapterId);
        const result = this.starterPreference.claimMentorChapter(chapterId, this.opts.getQuestState());
        this.starterFeedback = result === 'claimed'
          ? `「${chapter?.title ?? '멘토 성장 장'}」을 첫 생활 연대기에 영구 보존했어요.`
          : result === 'already' ? '이미 보존한 멘토 성장 장이에요.'
            : result === 'route-locked' ? '먼저 이 방향의 환영 소포를 받아 주세요.'
              : result === 'previous' ? '앞 장을 먼저 보존하면 이 이야기가 이어져요.'
                : result === 'not-ready' ? '두 생활 기록 중 아직 남은 한 걸음이 있어요.'
                  : '멘토 성장 장을 다시 확인하지 못했어요.';
        if (result === 'claimed') this.opts.onStarterCompassChanged?.(this.starterPreference.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const chapterId = button.dataset.starterMentorFeature!;
        const result = this.starterPreference.toggleMentorFeature(chapterId);
        this.starterFeedback = result === 'featured'
          ? '이 장을 대표 성장 장면으로 전시했어요.'
          : result === 'cleared' ? '대표 전시에서만 내렸어요. 성장 장은 그대로 보존됩니다.'
            : result === 'locked' ? '대표 장면은 보존한 장 중 최대 세 장까지 고를 수 있어요.'
              : '대표 성장 장면을 다시 확인하지 못했어요.';
        if (result === 'featured' || result === 'cleared') {
          this.opts.onStarterCompassChanged?.(this.starterPreference.progress());
        }
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-starter-mentor-replay]').forEach((button) => {
      button.addEventListener('click', () => {
        const chapterId = button.dataset.starterMentorReplay!;
        if (!this.starterPreference.replayMentorChapter(chapterId)) return;
        const chapter = this.starterPreference.mentorViews(this.opts.getQuestState()).find((item) => item.id === chapterId);
        this.starterFeedback = `「${chapter?.title ?? '멘토 성장 장'}」 장면을 다시 펼쳤어요.`;
        this.opts.onStarterCompassChanged?.(this.starterPreference.progress());
        this.render();
      });
    });
    if (this.tab === 'requests') this.bindRequestActions();
  }

  destroy(): void { this.root.remove(); }
}
