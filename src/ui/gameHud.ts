import { audio } from '../game/audio';
import {
  performanceComfort,
  type PerformanceComfortView,
  type QualityMode,
} from '../game/performance/performanceComfort';
import {
  playComfort,
  type ComfortContrast,
  type ComfortMotion,
  type ComfortTextSize,
  type PlayComfortView,
} from '../game/accessibility/playComfort';
import { villageLevelAdvance, type VillageLevelView } from '../game/progression/villageJourney';
import {
  VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID, recommendedVillageLevelMemoryDomain,
} from '../game/progression/villageLevelMemories';
import {
  paintVillageLevelMemoryArt, VILLAGE_LEVEL_MEMORY_ART_H, VILLAGE_LEVEL_MEMORY_ART_W,
} from '../game/art/villageLevelMemoryArt';
import { DEFAULT_APPEARANCE, type Appearance } from '../game/art/appearance';
import type { PetAccessoryId } from '../game/pets/petProfiles';
import type { QuestMilestoneNotice } from '../game/guidance/questMilestones';
import {
  paintQuestMilestoneArt, QUEST_MILESTONE_ART_H, QUEST_MILESTONE_ART_W,
} from '../game/art/questMilestoneArt';
import { pixelIcons } from './pixelIcons';
import pkg from '../../package.json';

/**
 * 게임형 HUD — 세션 싱글턴(main에서 1회 생성, 씬 전환에도 유지, P2-1).
 * 항상 표시: 좌상단 하트(퀘스트 진행), 우상단 코인·시계·설정.
 * 거리에서만: 하단 생활 액션 바 (mountActions/unmountActions).
 */
export interface HudBase {
  nickname: string;
  onLogout?: () => void;
  onResetData: () => void;
}

/** 거리 씬이 제공하는 액션 바 콜백 (씬 재진입마다 새로 배선) */
export interface BarActions {
  onSearch?: () => void;
  onBag: () => void;
  onDex: () => void;
  onMap: () => void;
  onResidents: () => void;
  onRanking: () => void;
  onQuest: () => void;
  onMarket: () => void;
  onJourney?: () => void;
  onMilestone?: (notice: QuestMilestoneNotice) => void;
  onTreasure: () => void;
  onGarden: () => void;
  onCooking: () => void;
  onFishing: () => void;
  onCustomize: () => void;
  onChat: () => void;
  onEmote: () => void;
}

export interface HudQuestTarget {
  id: string;
  name: string;
  location: string;
  label: string;
  action: string;
  tone: string;
  manual: boolean;
  progress: number;
  goal: number;
}

export interface HudVillageLevelVisual {
  appearance: Appearance;
  pet: { speciesId: string; accessory: PetAccessoryId } | null;
}

type BarButtonAction = Exclude<keyof BarActions, 'onJourney' | 'onMilestone'>;

const BAR_BUTTONS: Array<{ act: BarButtonAction; icon: string; label: string }> = [
  { act: 'onSearch', icon: 'search', label: '찾기' },
  { act: 'onBag', icon: 'bag', label: '소지품' },
  { act: 'onDex', icon: 'book', label: '가이드북' },
  { act: 'onMap', icon: 'map', label: '지도' },
  { act: 'onResidents', icon: 'people', label: '주민' },
  { act: 'onRanking', icon: 'trophy', label: '랭킹' },
  { act: 'onQuest', icon: 'scroll', label: '퀘스트' },
  { act: 'onMarket', icon: 'market', label: '장터' },
  { act: 'onTreasure', icon: 'gem', label: '보물' },
  { act: 'onGarden', icon: 'leaf', label: '정원' },
  { act: 'onCooking', icon: 'pot', label: '요리' },
  { act: 'onFishing', icon: 'fish', label: '낚시' },
  { act: 'onCustomize', icon: 'shirt', label: '꾸미기' },
  { act: 'onChat', icon: 'chat', label: '채팅' },
  { act: 'onEmote', icon: 'smile', label: '이모트' },
];

export class GameHud {
  private root: HTMLDivElement;
  private coinsEl: HTMLDivElement;
  private clockEl: HTMLDivElement;
  private settingsEl: HTMLDivElement;
  private barEl: HTMLDivElement;
  private objectiveEl: HTMLButtonElement;
  private villageLevelEl: HTMLButtonElement;
  private levelUpEl: HTMLDivElement;
  private questMilestoneEl: HTMLDivElement;
  private clockTimer: number;
  private levelUpTimer: number | null = null;
  private questMilestoneTimer: number | null = null;
  private readonly unsubscribePlayComfort: () => void;
  private readonly questMilestoneQueue: QuestMilestoneNotice[] = [];
  private activeQuestMilestone: QuestMilestoneNotice | null = null;
  private levelUpFrom: number | null = null;
  private readonly unsubscribePerformance: () => void;
  private questDone = 0;
  private questTotal = 5;
  private coins = 0;
  private objectiveId: string | null = null;
  private openQuest: (() => void) | null = null;
  private openJourney: (() => void) | null = null;
  private openMilestone: ((notice: QuestMilestoneNotice) => void) | null = null;
  private villageLevel: VillageLevelView | null = null;

  constructor(private readonly opts: HudBase) {
    const icons = pixelIcons();
    this.root = document.createElement('div');
    this.root.className = 'hv-hud';
    this.root.innerHTML = `
      <div class="hv-hud-top-right">
        <div class="hv-hud-coins"><img src="${icons.coin}" alt=""> <b>…</b></div>
        <div class="hv-hud-clock">…</div>
        <button class="hv-hud-gear" title="설정"><img src="${icons.gear}" alt=""></button>
      </div>
      <button class="hv-hud-village-level hidden" title="마을 여정 열기">
        <span class="village-level-seal"><small>VILLAGE</small><b>Lv.<strong>1</strong></b></span>
        <span class="village-level-copy"><b>새로 온 이웃</b><i><em></em></i><small>첫 도장을 기록해 보세요</small></span>
      </button>
      <button class="hv-hud-objective hidden" title="모험 일지 열기">
        <span class="objective-kicker"><span></span><kbd>Q</kbd></span>
        <b></b><small class="objective-action"></small><small class="objective-location"></small><i><em></em></i>
      </button>
      <div class="hv-level-up hidden" role="status" aria-live="polite" aria-atomic="true">
        <div class="level-up-rays" aria-hidden="true"></div>
        <div class="level-up-card">
          <small>VILLAGE LEVEL UP</small><span class="level-up-step"></span><strong></strong><p></p>
          <canvas width="${VILLAGE_LEVEL_MEMORY_ART_W}" height="${VILLAGE_LEVEL_MEMORY_ART_H}" aria-label="현재 캐릭터와 동행이 함께한 레벨업 픽셀 장면"></canvas>
          <div class="level-up-growth"><i></i><span><small>이번 성장의 가장 큰 기록</small><b></b><em></em></span></div>
          <div class="level-up-unlocks"><span>옷<small>코디 보상</small></span><span>발<small>펫 장식</small></span><span>집<small>리폼 레시피</small></span></div>
          <em></em><footer><button class="level-up-later">나중에</button><button class="level-up-action">여정에서 장면 고르기</button></footer>
        </div>
      </div>
      <div class="hv-quest-milestone hidden" role="status" aria-live="polite" aria-atomic="true">
        <section>
          <button class="quest-milestone-close" title="기록 카드 닫기" aria-label="기록 카드 닫기">×</button>
          <canvas width="${QUEST_MILESTONE_ART_W}" height="${QUEST_MILESTONE_ART_H}" aria-hidden="true"></canvas>
          <div class="quest-milestone-copy">
            <small></small><h3></h3><p></p>
            <div class="quest-milestone-reward"><i>◆</i><span></span></div>
            <div class="quest-milestone-extra hidden"></div>
            <div class="quest-milestone-next hidden"><small>NEXT STORY</small><b></b><span></span></div>
            <footer><em></em><button class="quest-milestone-action">기록 보기</button></footer>
          </div>
        </section>
      </div>
      <div class="hv-hud-bar hidden"></div>
      <div class="hv-hud-settings" style="display:none">
        <div class="card">
          <h3>게임 설정</h3>
          <p class="who">플레이어 · ${escapeHtml(opts.nickname)}</p>
          <div class="set-row"><span>BGM</span>
            <input class="vol-bgm" type="range" min="0" max="100" value="${Math.round(audio.prefs.bgm * 100)}"></div>
          <div class="set-row"><span>SE</span>
            <input class="vol-se" type="range" min="0" max="100" value="${Math.round(audio.prefs.se * 100)}"></div>
          <div class="set-row"><span>진동</span>
            <button class="tog-vib ${audio.prefs.vib ? 'on' : ''}">${audio.prefs.vib ? 'On' : 'Off'}</button></div>
          <div class="set-row quality-row"><span>화질</span>
            <select class="quality-mode" aria-label="그래픽 품질">
              <option value="auto">자동 맞춤</option>
              <option value="high">고품질</option>
              <option value="balanced">균형</option>
              <option value="battery">발열 절약</option>
            </select></div>
          <div class="quality-status" role="status" aria-live="polite">
            <div><i></i><b>기기 확인 중</b><strong>측정 중</strong></div>
            <span></span><small></small>
          </div>
          <section class="comfort-settings" aria-labelledby="comfort-settings-title">
            <header>
              <div><small>FRIENDLY PLAY</small><b id="comfort-settings-title">플레이 배려 설정</b></div>
              <i aria-hidden="true">편</i>
            </header>
            <div class="set-row comfort-row"><span>글씨</span>
              <select class="comfort-text" aria-label="화면 글씨 크기">
                <option value="standard">기본</option>
                <option value="large">크게</option>
                <option value="largest">가장 크게</option>
              </select></div>
            <div class="set-row comfort-row"><span>대비</span>
              <select class="comfort-contrast" aria-label="화면 색상 대비">
                <option value="standard">기본</option>
                <option value="high">선명하게</option>
              </select></div>
            <div class="set-row comfort-row"><span>움직임</span>
              <select class="comfort-motion" aria-label="화면 움직임">
                <option value="auto">기기 설정 따름</option>
                <option value="full">부드럽게</option>
                <option value="reduced">최소화</option>
              </select></div>
            <div class="comfort-status" role="status" aria-live="polite">
              <b>기본 글씨 · 기본 대비</b>
              <span>선택 즉시 모든 화면과 월드 연출에 적용되고 이 기기에 저장돼요.</span>
            </div>
          </section>
          <div class="set-row"><span>데이터</span>
            <button class="btn-reset">기록 초기화</button></div>
          <div class="guide">
            <b>조작 방법</b>
            <span>WASD/조이스틱 이동 · 문 밟으면 입장</span>
            <span>Enter 채팅 · E 이모트 · C 꾸미기</span>
            <span>B 소지품 · G 가이드북 · M 지도 · Q 퀘스트</span>
            <span>K 원정 키트 · N 골목 나눔장터</span>
          </div>
          ${opts.onLogout ? '<button class="logout">로그아웃</button>' : '<p class="off">오프라인 모드로 플레이 중</p>'}
          <p class="ver">VERSION : ${escapeHtml(pkg.version)}</p>
          <button class="close-x">✕</button>
        </div>
      </div>`;
    document.body.appendChild(this.root);

    this.coinsEl = this.root.querySelector('.hv-hud-coins')!;
    this.clockEl = this.root.querySelector('.hv-hud-clock')!;
    this.settingsEl = this.root.querySelector('.hv-hud-settings')!;
    this.barEl = this.root.querySelector('.hv-hud-bar')!;
    this.objectiveEl = this.root.querySelector('.hv-hud-objective')!;
    this.villageLevelEl = this.root.querySelector('.hv-hud-village-level')!;
    this.levelUpEl = this.root.querySelector('.hv-level-up')!;
    this.questMilestoneEl = this.root.querySelector('.hv-quest-milestone')!;
    this.tickClock();
    this.clockTimer = window.setInterval(() => this.tickClock(), 20_000);

    this.root.querySelector('.hv-hud-gear')!.addEventListener('click', () => {
      audio.playSe('click'); this.toggleSettings();
    });
    this.objectiveEl.addEventListener('click', () => {
      if (!this.openQuest) return;
      audio.playSe('click');
      this.openQuest();
    });
    this.villageLevelEl.addEventListener('click', () => {
      if (!this.openJourney) return;
      audio.playSe('click');
      this.openJourney();
    });
    this.levelUpEl.querySelector('.level-up-later')!.addEventListener('click', () => {
      audio.playSe('click');
      this.dismissLevelUp();
    });
    this.levelUpEl.querySelector('.level-up-action')!.addEventListener('click', () => {
      this.dismissLevelUp();
      if (!this.openJourney) return;
      audio.playSe('click');
      this.openJourney();
    });
    this.questMilestoneEl.querySelector('.quest-milestone-close')!.addEventListener('click', () => {
      audio.playSe('click');
      this.dismissQuestMilestone();
    });
    this.questMilestoneEl.querySelector('.quest-milestone-action')!.addEventListener('click', () => {
      const notice = this.activeQuestMilestone;
      this.dismissQuestMilestone();
      if (!notice) return;
      audio.playSe('click');
      if (this.openMilestone) this.openMilestone(notice);
      else this.openQuest?.();
    });
    this.settingsEl.querySelector('.close-x')!.addEventListener('click', () => this.toggleSettings());
    this.settingsEl.addEventListener('click', (e) => {
      if (e.target === this.settingsEl) this.toggleSettings();
    });
    this.settingsEl.querySelector('.logout')?.addEventListener('click', () => opts.onLogout?.());
    this.settingsEl.querySelector<HTMLInputElement>('.vol-bgm')!
      .addEventListener('input', (e) => audio.setBgm(Number((e.target as HTMLInputElement).value) / 100));
    this.settingsEl.querySelector<HTMLInputElement>('.vol-se')!
      .addEventListener('input', (e) => {
        audio.setSe(Number((e.target as HTMLInputElement).value) / 100);
        audio.playSe('pop');
      });
    const vib = this.settingsEl.querySelector<HTMLButtonElement>('.tog-vib')!;
    vib.addEventListener('click', () => {
      const on = !audio.prefs.vib;
      audio.setVib(on);
      vib.textContent = on ? 'On' : 'Off';
      vib.classList.toggle('on', on);
      if (on) audio.vibrate(40);
    });
    const quality = this.settingsEl.querySelector<HTMLSelectElement>('.quality-mode')!;
    quality.addEventListener('change', () => {
      performanceComfort.setMode(quality.value as QualityMode);
      audio.playSe('click');
    });
    this.unsubscribePerformance = performanceComfort.subscribe((view) => this.updatePerformance(view));
    const comfortText = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-text')!;
    const comfortContrast = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-contrast')!;
    const comfortMotion = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-motion')!;
    comfortText.addEventListener('change', () => {
      playComfort.setTextSize(comfortText.value as ComfortTextSize);
      audio.playSe('click');
    });
    comfortContrast.addEventListener('change', () => {
      playComfort.setContrast(comfortContrast.value as ComfortContrast);
      audio.playSe('click');
    });
    comfortMotion.addEventListener('change', () => {
      playComfort.setMotion(comfortMotion.value as ComfortMotion);
      audio.playSe('click');
    });
    this.unsubscribePlayComfort = playComfort.subscribe((view) => this.updatePlayComfort(view));
    this.settingsEl.querySelector('.btn-reset')!.addEventListener('click', () => {
      if (confirm('도감·주민·퀘스트 기록을 초기화할까요? (코인·소지품은 유지)')) opts.onResetData();
    });
  }

  /** 거리 씬 진입 시 하단 액션 바 장착 (콜백은 매번 새로 배선) */
  mountActions(actions: BarActions): void {
    const icons = pixelIcons();
    this.barEl.innerHTML = BAR_BUTTONS.filter((b) => b.act !== 'onSearch' || !!actions.onSearch).map((b) => `
      <button data-act="${b.act}" title="${b.label}">
        <img class="ico" src="${icons[b.icon]}" alt=""><span class="lbl">${b.label}</span>
      </button>`).join('');
    this.barEl.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((el) => {
      el.addEventListener('click', () => {
        audio.playSe('click');
        actions[el.dataset.act as BarButtonAction]?.();
      });
    });
    this.barEl.classList.remove('hidden'); // display은 CSS(데스크톱 flex / 모바일 grid)가 결정
    this.openQuest = actions.onQuest;
    this.openJourney = actions.onJourney ?? actions.onQuest;
    this.openMilestone = actions.onMilestone ?? null;
    this.objectiveEl.classList.toggle('hidden', this.objectiveId === null);
    this.villageLevelEl.classList.toggle('hidden', this.villageLevel === null);
    this.applyQuestBadge();
  }

  /** 거리 씬 이탈(방·인테리어 입장) 시 액션 바 제거 — 상태·설정은 유지 */
  unmountActions(): void {
    this.barEl.classList.add('hidden');
    this.barEl.innerHTML = '';
    this.openQuest = null;
    this.openJourney = null;
    this.openMilestone = null;
    this.objectiveEl.classList.add('hidden');
    this.villageLevelEl.classList.add('hidden');
    this.dismissLevelUp();
    this.questMilestoneQueue.length = 0;
    this.dismissQuestMilestone(false);
  }

  setCoins(v: number): void {
    this.coins = v;
    this.coinsEl.querySelector('b')!.textContent = v.toLocaleString();
  }

  get lastCoins(): number { return this.coins; }

  /** 모든 생활 활동에서 파생되는 마을 레벨을 상시 표시하고 실제 상승 때만 축하한다. */
  setVillageLevel(view: VillageLevelView, visual?: HudVillageLevelVisual): void {
    const previous = this.villageLevel?.level ?? null;
    this.villageLevel = view;
    this.villageLevelEl.querySelector<HTMLElement>('.village-level-seal strong')!.textContent = String(view.level);
    this.villageLevelEl.querySelector<HTMLElement>('.village-level-copy > b')!.textContent = view.title;
    (this.villageLevelEl.querySelector('.village-level-copy i > em') as HTMLElement).style.width = `${view.progressPct}%`;
    this.villageLevelEl.querySelector<HTMLElement>('.village-level-copy > small')!.textContent = view.level >= 50
      ? '골목 여권 50칸 완성'
      : view.nextMilestone
        ? `다음 명찰 Lv.${view.nextMilestone.level} · ${view.xpToNextLevel.toLocaleString()} XP`
        : `다음 레벨까지 ${view.xpToNextLevel.toLocaleString()} XP`;
    this.villageLevelEl.setAttribute('aria-label', `마을 레벨 ${view.level}, ${view.title}. 마을 여정 열기`);
    this.villageLevelEl.classList.toggle('hidden', this.openJourney === null);

    if (previous === null || view.level <= previous) return;
    const advance = villageLevelAdvance(this.levelUpFrom ?? previous, view.level);
    if (!advance) return;
    this.levelUpFrom = advance.from;
    this.levelUpEl.querySelector<HTMLElement>('.level-up-step')!.textContent = advance.gained > 1
      ? `Lv.${advance.from} → Lv.${advance.to} · ${advance.gained}단계 상승`
      : `Lv.${advance.from} → Lv.${advance.to}`;
    this.levelUpEl.querySelector<HTMLElement>('strong')!.textContent = advance.title;
    this.levelUpEl.querySelector<HTMLElement>('p')!.textContent = advance.milestone
      ? `새 명찰 「${advance.milestone.reward}」과 취향 보상 세 가지가 모두 자동으로 열렸어요.`
      : '오늘의 생활 기록이 골목 여권에 새 도장으로 남았어요. 어떤 하루였는지 주요 레벨 앨범에 남길 수 있어요.';
    const domainId = recommendedVillageLevelMemoryDomain(view.xpBreakdown);
    const domain = VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.get(domainId)!;
    this.levelUpEl.style.setProperty('--level-up-color', domain.color);
    const growth = this.levelUpEl.querySelector<HTMLElement>('.level-up-growth')!;
    growth.querySelector<HTMLElement>('i')!.textContent = domain.mark;
    growth.querySelector<HTMLElement>('b')!.textContent = domain.name;
    growth.querySelector<HTMLElement>('em')!.textContent = `${domain.nextAction} · ${domain.location}`;
    this.levelUpEl.querySelector<HTMLElement>('.level-up-unlocks')!.classList.toggle('is-milestone', !!advance.milestone);
    const canvas = this.levelUpEl.querySelector<HTMLCanvasElement>('canvas')!;
    paintVillageLevelMemoryArt(
      canvas,
      view.level,
      domain,
      visual?.appearance ?? DEFAULT_APPEARANCE,
      visual?.pet ?? null,
    );
    this.levelUpEl.querySelector<HTMLElement>('.level-up-card > em')!.textContent = view.level >= 50
      ? '마을 연대기 완성'
      : advance.milestone
        ? `Lv.${advance.milestone.level} 장면 앨범에 지금의 취향을 남겨 보세요`
        : `다음 레벨까지 ${view.xpToNextLevel.toLocaleString()} XP`;
    this.levelUpEl.classList.remove('hidden');
    this.levelUpEl.classList.remove('celebrate');
    void this.levelUpEl.offsetWidth;
    this.levelUpEl.classList.add('celebrate');
    audio.playSe('success');
    audio.vibrate([40, 35, 70]);
    if (this.levelUpTimer !== null) window.clearTimeout(this.levelUpTimer);
    this.levelUpTimer = window.setTimeout(() => this.dismissLevelUp(), 9_000);
  }

  /** 개발 회귀 화면에서 실제 레벨업 카드 렌더링을 검증한다. */
  previewVillageLevelUp(view: VillageLevelView, visual?: HudVillageLevelVisual): void {
    this.villageLevel = { ...view, level: Math.max(1, view.level - 1) };
    this.setVillageLevel(view, visual);
  }

  private dismissLevelUp(): void {
    if (this.levelUpTimer !== null) window.clearTimeout(this.levelUpTimer);
    this.levelUpTimer = null;
    this.levelUpFrom = null;
    this.levelUpEl.classList.add('hidden');
    this.levelUpEl.classList.remove('celebrate');
  }

  /** 새 완료·배지·다음 이야기를 플레이를 멈추지 않는 한 장의 기록 카드로 순서대로 보여 준다. */
  showQuestMilestone(notice: QuestMilestoneNotice): void {
    if (this.activeQuestMilestone?.id === notice.id
      || this.questMilestoneQueue.some((queued) => queued.id === notice.id)) return;
    this.questMilestoneQueue.push(notice);
    if (!this.activeQuestMilestone) this.renderNextQuestMilestone();
  }

  private renderNextQuestMilestone(): void {
    const notice = this.questMilestoneQueue.shift() ?? null;
    this.activeQuestMilestone = notice;
    if (!notice) {
      this.questMilestoneEl.classList.add('hidden');
      return;
    }
    this.questMilestoneEl.dataset.category = notice.category;
    this.questMilestoneEl.querySelector<HTMLElement>('.quest-milestone-copy > small')!.textContent = notice.eyebrow;
    this.questMilestoneEl.querySelector('h3')!.textContent = notice.title;
    this.questMilestoneEl.querySelector<HTMLElement>('.quest-milestone-copy > p')!.textContent = notice.description;
    const reward = this.questMilestoneEl.querySelector<HTMLElement>('.quest-milestone-reward')!;
    reward.classList.toggle('hidden', !notice.rewardLabel);
    reward.querySelector('span')!.textContent = notice.rewardLabel ?? '';
    const extra = this.questMilestoneEl.querySelector<HTMLElement>('.quest-milestone-extra')!;
    extra.classList.toggle('hidden', notice.extraCount === 0);
    extra.textContent = notice.extraCount > 0
      ? `함께 기록됨 +${notice.extraCount} · ${notice.extraTitles.join(' · ')}`
      : '';
    const next = this.questMilestoneEl.querySelector<HTMLElement>('.quest-milestone-next')!;
    next.classList.toggle('hidden', !notice.next);
    next.querySelector('b')!.textContent = notice.next?.name ?? '';
    next.querySelector('span')!.textContent = notice.next
      ? `${notice.next.description} · ${notice.next.location}`
      : '';
    this.questMilestoneEl.querySelector('footer em')!.textContent = notice.progressLabel;
    this.questMilestoneEl.querySelector<HTMLButtonElement>('.quest-milestone-action')!.textContent = notice.category === 'daily'
      ? '보상 확인'
      : notice.next
        ? '다음 이야기'
        : '기록 보기';
    const canvas = this.questMilestoneEl.querySelector<HTMLCanvasElement>('canvas')!;
    const context = canvas.getContext('2d');
    if (context) paintQuestMilestoneArt(context, notice.category);

    this.questMilestoneEl.classList.remove('hidden', 'arrive');
    void this.questMilestoneEl.offsetWidth;
    this.questMilestoneEl.classList.add('arrive');
    audio.playSe('success');
    audio.vibrate(35);
    if (this.questMilestoneTimer !== null) window.clearTimeout(this.questMilestoneTimer);
    // 개발 미리보기는 사람이 데스크톱·모바일을 모두 검수할 때까지 유지한다.
    if (!notice.id.startsWith('dev:')) {
      this.questMilestoneTimer = window.setTimeout(() => this.dismissQuestMilestone(), 6_500);
    }
  }

  private dismissQuestMilestone(showNext = true): void {
    if (this.questMilestoneTimer !== null) window.clearTimeout(this.questMilestoneTimer);
    this.questMilestoneTimer = null;
    this.activeQuestMilestone = null;
    this.questMilestoneEl.classList.add('hidden');
    this.questMilestoneEl.classList.remove('arrive');
    if (showNext && this.questMilestoneQueue.length) this.renderNextQuestMilestone();
  }

  /** 오늘의 퀘스트 진행 — 퀘스트 버튼에 배지로 표시 (하트 대체) */
  setHearts(done: number, total: number): void {
    this.questDone = done;
    this.questTotal = total;
    this.applyQuestBadge();
  }

  /** 거리에서 다음 추천 목표 한 가지를 항상 보여 준다. */
  setQuestTarget(target: HudQuestTarget | null): void {
    if (!target) {
      this.objectiveId = null;
      this.objectiveEl.classList.add('hidden');
      return;
    }
    const changed = this.objectiveId !== null && this.objectiveId !== target.id;
    this.objectiveId = target.id;
    this.objectiveEl.dataset.guideTone = target.tone;
    this.objectiveEl.querySelector<HTMLElement>('.objective-kicker > span')!.textContent = target.manual ? '직접 추적 중' : target.label;
    this.objectiveEl.querySelector('b')!.textContent = target.name;
    this.objectiveEl.querySelector<HTMLElement>('.objective-action')!.textContent = target.action;
    this.objectiveEl.querySelector<HTMLElement>('.objective-location')!.textContent = target.location;
    const pct = Math.round((Math.min(target.progress, target.goal) / target.goal) * 100);
    (this.objectiveEl.querySelector('em') as HTMLElement).style.width = `${pct}%`;
    this.objectiveEl.classList.toggle('hidden', this.openQuest === null);
    if (changed) {
      this.objectiveEl.classList.remove('advance');
      void this.objectiveEl.offsetWidth;
      this.objectiveEl.classList.add('advance');
    }
  }

  /** 퀘스트 버튼에 진행 배지 부착 (바가 장착돼 있을 때만) */
  private applyQuestBadge(): void {
    const btn = this.barEl.querySelector<HTMLButtonElement>('[data-act="onQuest"]');
    if (!btn) return;
    let badge = btn.querySelector<HTMLSpanElement>('.hud-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'hud-badge';
      btn.appendChild(badge);
    }
    const done = this.questDone === this.questTotal && this.questTotal > 0;
    badge.textContent = done ? '✓' : `${this.questDone}/${this.questTotal}`;
    badge.classList.toggle('done', done);
    badge.classList.toggle('active', this.questDone > 0);
  }

  private tickClock(): void {
    const now = new Date();
    const hm = now.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const h = Number(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false }));
    const phase = h >= 6 && h < 16 ? '낮' : h >= 16 && h < 19 ? '해질녘' : '밤';
    this.clockEl.textContent = `${phase} ${hm}`;
  }

  private toggleSettings(): void {
    const open = this.settingsEl.style.display === 'none';
    this.settingsEl.style.display = open ? 'flex' : 'none';
  }

  private updatePerformance(view: PerformanceComfortView): void {
    const modeNames: Record<QualityMode, string> = {
      auto: '자동 맞춤', high: '고품질', balanced: '균형', battery: '발열 절약',
    };
    const tierNames = { high: '고품질', balanced: '균형', battery: '발열 절약' } as const;
    const quality = this.settingsEl.querySelector<HTMLSelectElement>('.quality-mode');
    if (quality) quality.value = view.mode;
    const status = this.settingsEl.querySelector<HTMLElement>('.quality-status');
    if (!status) return;
    status.dataset.tier = view.tier;
    status.querySelector('i')!.textContent = view.tier === 'high' ? '선' : view.tier === 'balanced' ? '균' : '온';
    status.querySelector('b')!.textContent = `${modeNames[view.mode]} · ${tierNames[view.tier]}`;
    status.querySelector('strong')!.textContent = view.measuring
      ? '측정 중'
      : `${view.fps} FPS · 끊김 ${view.jankPct}%`;
    status.querySelector('span')!.textContent = view.reason;
    status.querySelector('small')!.textContent = view.measuring
      ? '약 2초 동안 실제 플레이 프레임을 확인한 뒤 결과를 보여 드려요.'
      : `평균 ${view.averageMs.toFixed(1)}ms · 느린 프레임 ${view.p95Ms.toFixed(1)}ms · ${view.samples}개 표본`;
  }

  private updatePlayComfort(view: PlayComfortView): void {
    const text = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-text');
    const contrast = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-contrast');
    const motion = this.settingsEl.querySelector<HTMLSelectElement>('.comfort-motion');
    if (text) text.value = view.textSize;
    if (contrast) contrast.value = view.contrast;
    if (motion) motion.value = view.motion;
    const status = this.settingsEl.querySelector<HTMLElement>('.comfort-status');
    if (!status) return;
    status.dataset.motion = view.reducedMotion ? 'reduced' : 'full';
    status.querySelector('b')!.textContent = view.summary;
    status.querySelector('span')!.textContent = view.reducedMotion
      ? '반복 애니메이션, 화면 흔들림과 밝은 플래시를 줄였어요. 게임 진행과 보상은 그대로예요.'
      : '선택 즉시 모든 화면과 월드 연출에 적용되고 이 기기에 저장돼요.';
  }

  destroy(): void {
    clearInterval(this.clockTimer);
    if (this.levelUpTimer !== null) window.clearTimeout(this.levelUpTimer);
    if (this.questMilestoneTimer !== null) window.clearTimeout(this.questMilestoneTimer);
    this.unsubscribePerformance();
    this.unsubscribePlayComfort();
    this.root.remove();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
