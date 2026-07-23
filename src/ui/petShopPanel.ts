import { BASE_SPECIES, RARE_SPECIES, PET_STAGES, AFFINITY_MAX, type PetSpecies } from '../game/pets/pets';
import type { PetStore } from '../game/pets/petStore';
import {
  PET_ACCESSORIES, PET_NICKNAME_MAX, PET_PERSONALITIES, sanitizePetNickname,
  type PetAccessoryId, type PetPersonalityId,
} from '../game/pets/petProfiles';
import { paintPet, PET_W, PET_H } from '../game/art/petArt';
import { paintPetOutingScene, PET_OUTING_ART_H, PET_OUTING_ART_W } from '../game/art/petOutingArt';
import { PET_GROWTH_CHAPTERS, PET_GROWTH_MEMORY_H, PET_GROWTH_MEMORY_W, paintPetGrowthMemory } from '../game/art/petGrowthMemoryArt';
import { paintPetHomeMemory, PET_HOME_MEMORY_H, PET_HOME_MEMORY_W } from '../game/art/petHomeMemoryArt';
import { paintPetSignalScene, PET_SIGNAL_ART_H, PET_SIGNAL_ART_W } from '../game/art/petSignalArt';
import {
  paintPetPerformanceScene, PET_PERFORMANCE_ART_H, PET_PERFORMANCE_ART_W,
} from '../game/art/petPerformanceArt';
import {
  favoritePersonalityNames, PET_OUTING_ROUTES, type PetOutingContext, type PetOutingProgress,
  type PetOutingRouteId, type PetOutingRouteView, type PetOutingStore,
} from '../game/pets/petOutings';
import type { PetHomeMemoryView } from '../game/home/petHomeComfort';
import {
  PET_SIGNAL_RESPONSES, PetSignalStore,
  type PetSignalContext, type PetSignalProgress, type PetSignalResponseId,
} from '../game/pets/petSignals';
import {
  PET_PERFORMANCES, PetPerformanceStore,
  type PetPerformanceProgress,
} from '../game/pets/petPerformances';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 펫샵 「멍냥이네」 — 입양·돌봄·트릭·별명·성격·액세서리까지 관리한다. */
export class PetShopPanel {
  private root: HTMLDivElement;
  private opened = false;
  private store: PetStore | null = null;
  private coins = 0;
  private online = false;
  private profilePetId: string | null = null;
  private profileError = '';
  private outingOpen = false;
  private selectedOutingRouteId: PetOutingRouteId = PET_OUTING_ROUTES[0]!.id;
  private outingFeedback = '';
  private performanceOpen = false;
  private selectedPerformanceTrickId = PET_PERFORMANCES[0]!.trickId;
  private performanceFeedback = '';
  private readonly signals: PetSignalStore;
  private readonly performances: PetPerformanceStore;

  constructor(userId: string, private readonly opts: {
    onToggle: (open: boolean) => void;
    onAdopt: (petId: string) => void;
    onSetActive: (petId: string | null) => void;
    onFeed: (petId: string) => void;
    onPlay: (petId: string) => void;
    onTrain: (petId: string) => void;
    onTrick: (petId: string, trickId: string) => void;
    onRename: (petId: string, nickname: string) => void;
    onPersonality: (petId: string, personality: PetPersonalityId) => void;
    onAccessory: (petId: string, accessory: PetAccessoryId) => void;
    onOpenStyleStudio?: (petId: string) => void;
    outings: PetOutingStore;
    homeMemories: (petId: string) => PetHomeMemoryView[];
    onOutingChanged: (progress: PetOutingProgress) => void;
    onSignalsChanged: (progress: PetSignalProgress) => void;
    onPerformanceChanged: (progress: PetPerformanceProgress) => void;
  }) {
    this.signals = new PetSignalStore(userId);
    this.performances = new PetPerformanceStore(userId);
    this.root = document.createElement('div');
    this.root.className = 'hv-petshop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }
  signalProgress(): PetSignalProgress { return this.signals.progress(); }
  performanceProgress(): PetPerformanceProgress { return this.performances.progress(); }

  open(store: PetStore, coins: number, online: boolean, initialView: 'list' | 'outings' | 'performances' = 'list'): void {
    if (this.opened) return;
    this.opened = true;
    this.store = store;
    this.coins = coins;
    this.online = online;
    this.profilePetId = null;
    this.profileError = '';
    this.outingOpen = initialView === 'outings';
    this.performanceOpen = initialView === 'performances';
    this.outingFeedback = '';
    this.performanceFeedback = '';
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  /** 세트 수첩에서 현재 동행의 프로필과 액세서리 도감을 곧바로 연다. */
  openProfile(store: PetStore, coins: number, online: boolean, petId: string): boolean {
    if (!store.isOwned(petId)) return false;
    this.open(store, coins, online);
    if (!this.opened) return false;
    this.profilePetId = petId;
    this.render();
    return true;
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.profilePetId = null;
    this.outingOpen = false;
    this.performanceOpen = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(coins: number): void {
    this.coins = coins;
    if (this.opened) this.render();
  }

  private ownedCard(species: PetSpecies): string {
    const store = this.store!;
    const affinity = store.affinity(species.id);
    const stage = PET_STAGES[store.stage(species.id)];
    const active = store.activeId() === species.id;
    const nextTrick = store.nextTrick(species.id);
    const learned = store.learnedTricks(species.id);
    const memoryCount = store.memories(species.id).filter((memory) => memory.unlocked).length;
    const homeMemoryCount = this.opts.homeMemories(species.id).filter((memory) => memory.recorded).length;
    const personality = PET_PERSONALITIES.find((item) => item.id === store.personality(species.id))!;
    const accessory = PET_ACCESSORIES.find((item) => item.id === store.accessory(species.id))!;
    const trainLabel = !nextTrick ? '모든 트릭 습득'
      : affinity < nextTrick.minAffinity ? `친밀도 ${nextTrick.minAffinity}에 ${nextTrick.name} 해금`
        : store.canTrain(species.id) ? `${nextTrick.name} 배우기` : '오늘 연습 완료';
    return `<article class="ps-card is-owned ${active ? 'is-active' : ''}">
      <button class="ps-pic ps-profile-open" data-profile="${species.id}" aria-label="${escapeHtml(store.displayName(species.id))} 프로필 열기">
        <canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${species.id}" data-accessory="${store.accessory(species.id)}"></canvas>
      </button>
      <div class="ps-info">
        <small>${escapeHtml(species.name)} · ${escapeHtml(personality.name)}</small>
        <b>${escapeHtml(store.displayName(species.id))} <em>${stage}</em></b>
        <span class="ps-aff"><i style="width:${affinity}%"></i></span>
        <span>친밀도 ${affinity}/${AFFINITY_MAX} · ${escapeHtml(accessory.name)}</span>
      </div>
      <div class="ps-btns">
        ${active ? '<button class="ps-active" disabled>함께 걷는 중</button>' : `<button class="ps-take" data-take="${species.id}">동행하기</button>`}
        <button class="ps-feed" data-feed="${species.id}" ${store.canFeed(species.id) ? '' : 'disabled'}>${store.canFeed(species.id) ? '먹이 주기' : '오늘 식사 완료'}</button>
      </div>
      <div class="ps-care">
        <button data-play="${species.id}" ${store.canPlay(species.id) ? '' : 'disabled'}>${store.canPlay(species.id) ? '같이 놀기' : '오늘 놀이 완료'}</button>
        <button data-train="${species.id}" ${store.canTrain(species.id) ? '' : 'disabled'}>${trainLabel}</button>
        <button class="ps-edit" data-profile="${species.id}">프로필 꾸미기</button>
      </div>
      <div class="ps-tricks">
        <span>트릭 ${learned.length}/5 · 성장 추억 ${memoryCount}/4 · 집 추억 ${homeMemoryCount}/18</span>
        ${learned.length ? learned.map((trick) => `<button data-trick="${species.id}:${trick.id}" title="${escapeHtml(trick.praise)}">${escapeHtml(trick.name)}</button>`).join('') : '<i>연습한 트릭이 이곳에 차곡차곡 기록돼요.</i>'}
      </div>
    </article>`;
  }

  private buyCard(species: PetSpecies): string {
    const affordable = !this.online || this.coins >= species.price;
    return `<article class="ps-card ps-adopt-card">
      <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${species.id}" data-accessory="none"></canvas></div>
      <div class="ps-info"><small>새로운 가족</small><b>${escapeHtml(species.name)}</b><span>${escapeHtml(species.blurb)}</span></div>
      <button class="ps-buy" data-adopt="${species.id}" ${affordable ? '' : 'disabled'}>${this.online ? `${species.price}코인으로 입양` : '입양하기'}</button>
    </article>`;
  }

  private rareCard(species: PetSpecies): string {
    const store = this.store!;
    if (store.isOwned(species.id)) return this.ownedCard(species);
    if (!store.isUnlocked(species.id)) return `<article class="ps-card ps-locked">
      <div class="ps-pic"><span class="ps-q">?</span></div>
      <div class="ps-info"><small>숨은 친구</small><b>아직 모르는 실루엣 <em class="ps-rare-tag">희귀</em></b><span>${escapeHtml(species.hint ?? '')}</span></div>
      <span class="ps-lock">잠금</span>
    </article>`;
    return `<article class="ps-card ps-discovered">
      <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${species.id}" data-accessory="none"></canvas></div>
      <div class="ps-info"><small>새로 발견</small><b>${escapeHtml(species.name)} <em class="ps-rare-tag">희귀</em></b><span>${escapeHtml(species.blurb)}</span></div>
      <button class="ps-buy ps-rare-buy" data-adopt="${species.id}">가족으로 맞이하기</button>
    </article>`;
  }

  private render(): void {
    const store = this.store!;
    if (this.performanceOpen) { this.renderPerformances(); return; }
    if (this.outingOpen) { this.renderOutings(); return; }
    if (this.profilePetId && store.isOwned(this.profilePetId)) {
      this.renderProfile(this.profilePetId);
      return;
    }
    this.profilePetId = null;
    const active = store.activeId();
    const outingProgress = this.opts.outings.progress();
    const performanceProgress = this.performances.progress();
    const base = BASE_SPECIES.map((species) => (store.isOwned(species.id) ? this.ownedCard(species) : this.buyCard(species))).join('');
    const rare = RARE_SPECIES.map((species) => this.rareCard(species)).join('');
    this.root.innerHTML = `<div class="hv-wood-modal" style="position:static;background:none;">
      <div class="wood-frame ps-frame">
        <div class="wood-head"><h2>펫샵 멍냥이네</h2><span class="pill">보유 ${this.coins.toLocaleString()}코인</span></div>
        <p class="ps-tip">먹고 놀고 연습한 시간은 사라지지 않아요. 별명과 성격, 장식으로 각 친구의 이야기를 만들어 주세요.</p>
        <div class="ps-companion-entries">
          <button class="ps-outing-entry" data-open-outings ${active ? '' : 'disabled'}>
            <span><small>COMPANION WALK JOURNAL</small><b>동행 산책 수첩</b><em>${active ? `${escapeHtml(store.displayName(active))}와 여덟 골목을 천천히 걸어요.` : '동행 펫을 먼저 골라 주세요.'}</em></span>
            <strong>${outingProgress.souvenirStamps}<i>/24</i><small>기념 도장</small></strong>
          </button>
          <button class="ps-outing-entry ps-performance-entry" data-open-performances ${active ? '' : 'disabled'}>
            <span><small>OUR LITTLE REPERTOIRE</small><b>둘만의 트릭 소극장</b><em>${active ? `배운 트릭을 데뷔·대표작·앙코르로 오래 남겨요.` : '동행 펫을 먼저 골라 주세요.'}</em></span>
            <strong>${performanceProgress.stamps}<i>장</i><small>무대 추억</small></strong>
          </button>
        </div>
        <div class="wood-page ps-list">${base}<div class="ps-section"><span>HIDDEN FRIENDS</span>숨은 친구</div>${rare}</div>
        ${active ? '<button class="ps-rest">오늘은 집에서 쉬기</button>' : ''}
        <button class="wood-close">닫기</button>
      </div>
    </div>`;
    this.paintCanvases();
    this.bindCommonActions();
  }

  private renderPerformances(): void {
    const store = this.store!;
    const active = store.activeId();
    if (!active) { this.performanceOpen = false; this.render(); return; }
    const learnedIds = store.learnedTricks(active).map((trick) => trick.id);
    const personality = store.personality(active);
    const views = this.performances.views(active, learnedIds, personality);
    if (!views.some((view) => view.trickId === this.selectedPerformanceTrickId)) {
      this.selectedPerformanceTrickId = views[0]!.trickId;
    }
    const selected = views.find((view) => view.trickId === this.selectedPerformanceTrickId) ?? views[0]!;
    const progress = this.performances.progress();
    const personalityDef = PET_PERSONALITIES.find((item) => item.id === personality)!;
    this.root.innerHTML = `<div class="hv-wood-modal" style="position:static;background:none;">
      <div class="wood-frame ps-frame ps-performance-frame">
        <header class="ps-outing-head ps-performance-head">
          <button class="ps-performance-back">펫샵으로</button>
          <div><span>OUR LITTLE REPERTOIRE</span><h2>둘만의 트릭 소극장</h2><p>${escapeHtml(store.displayName(active))} · ${escapeHtml(personalityDef.name)} 성격 · 능력치 경쟁 없는 영구 공연 수첩</p></div>
          <button class="wood-close">닫기</button>
        </header>
        <div class="ps-outing-stats ps-performance-stats"><span><b>${progress.stamps}</b>장 무대 추억</span><span><b>${progress.repertoireTricks}</b>/5 레퍼토리</span><span><b>${progress.completedPerformances}</b>개 앙코르 완성</span><span><b>${progress.petPartners}</b>마리 공연 친구</span></div>
        <div class="ps-performance-layout">
          <main class="ps-performance-feature">
            <div class="ps-performance-art"><canvas width="${PET_PERFORMANCE_ART_W}" height="${PET_PERFORMANCE_ART_H}" data-performance-scene="${selected.trickId}" aria-label="${escapeHtml(selected.stageName)} 픽셀 무대"></canvas><span>${escapeHtml(selected.code)}</span></div>
            <header><div><small>${escapeHtml(selected.trick.emoji)} ${escapeHtml(selected.trick.name)}</small><h3>${escapeHtml(selected.stageName)}</h3></div><strong>${selected.stamps}/3</strong></header>
            <p>${escapeHtml(selected.direction)}</p>
            <blockquote>${escapeHtml(selected.personalityLine)}</blockquote>
            <ol class="ps-performance-keepsakes">${selected.keepsakes.map((keepsake, index) => `<li class="${index < selected.stamps ? 'is-recorded' : ''}"><b>${index < selected.stamps ? ['데', '작', '앙'][index] : '?'}</b><span><strong>${index < selected.stamps ? escapeHtml(keepsake) : ['첫 공연', '대표작', '앙코르'][index]}</strong><small>${[1, 3, 6][index]}회 함께 공연</small></span></li>`).join('')}</ol>
            <p class="ps-performance-next"><b>다음 돌봄 행동</b>${escapeHtml(selected.nextAction)}</p>
            ${this.performanceFeedback ? `<p class="ps-outing-feedback">${escapeHtml(this.performanceFeedback)}</p>` : ''}
            <div class="ps-performance-actions">
              <button data-performance-rehearse ${selected.learned ? '' : 'disabled'}>${selected.learned ? (selected.stamps >= 3 ? '좋아서 다시 앙코르하기' : `${selected.trick.name} 함께 공연하기`) : `친밀도 ${selected.trick.minAffinity}에 먼저 배우기`}</button>
              <button data-performance-feature ${selected.stamps ? '' : 'disabled'}>${selected.featured ? '대표 무대에서 내리기' : '이 장면을 대표 무대로'}</button>
            </div>
          </main>
          <aside class="ps-performance-index"><header><span>다섯 레퍼토리</span><small>배운 트릭은 매일 제한 없이 다시 즐길 수 있어요.</small></header>
            <div>${views.map((view, index) => `<button class="${view.trickId === selected.trickId ? 'is-selected' : ''} ${view.learned ? '' : 'is-locked'}" data-performance-trick="${view.trickId}">
              <i>${String(index + 1).padStart(2, '0')}</i><span><b>${escapeHtml(view.trick.name)}</b><small>${view.learned ? `${view.rehearsals}회 공연 · 추억 ${view.stamps}/3` : `친밀도 ${view.trick.minAffinity}에 배우기`}</small></span><em>${view.featured ? '대표' : `${view.stamps}/3`}</em>
            </button>`).join('')}</div>
            <footer>실패, 점수, 순위는 없어요. 같은 트릭도 펫의 현재 성격과 장식으로 매번 다시 그려집니다.</footer>
          </aside>
        </div>
      </div>
    </div>`;
    this.paintCanvases();
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.ps-performance-back')!.addEventListener('click', () => {
      this.performanceOpen = false; this.performanceFeedback = ''; this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-performance-trick]').forEach((button) => button.addEventListener('click', () => {
      this.selectedPerformanceTrickId = button.dataset.performanceTrick!;
      this.performanceFeedback = '';
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-performance-rehearse]')?.addEventListener('click', () => {
      const result = this.performances.rehearse(active, selected.trickId, learnedIds);
      if (!result.ok) {
        this.performanceFeedback = '이 트릭을 먼저 배운 뒤 무대에서 다시 만나 주세요.';
        this.render();
        return;
      }
      this.opts.onTrick(active, selected.trickId);
      this.performanceFeedback = result.newKeepsakes.length
        ? `새 무대 추억을 보존했어요: ${result.newKeepsakes.join(' · ')}`
        : result.completed ? '둘만의 앙코르 무대가 완성됐어요.' : `${result.rehearsals}번째 공연도 둘만의 호흡으로 마쳤어요.`;
      this.opts.onPerformanceChanged(this.performances.progress());
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-performance-feature]')?.addEventListener('click', () => {
      if (this.performances.feature(active, selected.trickId)) {
        this.performanceFeedback = selected.featured ? '대표 무대에서 조심히 내렸어요.' : '마을 기록에 보여 줄 대표 무대로 남겼어요.';
        this.opts.onPerformanceChanged(this.performances.progress());
        this.render();
      }
    });
  }

  private outingContext(petId: string): PetOutingContext {
    const store = this.store!;
    return {
      affinity: store.affinity(petId),
      tricks: store.learnedTricks(petId).length,
      memories: store.memories(petId).filter((memory) => memory.unlocked).length,
      personality: store.personality(petId),
    };
  }

  private signalContext(petId: string): PetSignalContext {
    const store = this.store!;
    const outingPoints = this.opts.outings.views(petId, this.outingContext(petId))
      .reduce((sum, route) => sum + route.activePoints, 0);
    return {
      affinity: store.affinity(petId),
      plays: store.playCount(petId),
      tricks: store.learnedTricks(petId).length,
      outings: outingPoints,
      homeMemories: this.opts.homeMemories(petId).filter((memory) => memory.recorded).length,
    };
  }

  private souvenirRows(route: PetOutingRouteView): string {
    return route.souvenirs.map((item) => {
      const found = route.archivePoints >= item.threshold;
      return `<li class="${found ? 'is-found' : ''}"><b>${found ? escapeHtml(item.mark) : '?'}</b><span><strong>${found ? escapeHtml(item.name) : `${item.threshold}걸음의 기념품`}</strong><small>${found ? escapeHtml(item.note) : `이 코스의 기록 ${item.threshold}칸에서 발견`}</small></span><em>${item.threshold}</em></li>`;
    }).join('');
  }

  private renderOutings(): void {
    const store = this.store!;
    const active = store.activeId();
    if (!active) { this.outingOpen = false; this.render(); return; }
    const context = this.outingContext(active);
    const views = this.opts.outings.views(active, context);
    if (!views.some((route) => route.id === this.selectedOutingRouteId)) this.selectedOutingRouteId = views[0]!.id;
    const selected = views.find((route) => route.id === this.selectedOutingRouteId) ?? views[0]!;
    const progress = this.opts.outings.progress();
    const personality = PET_PERSONALITIES.find((item) => item.id === context.personality)!;
    this.root.innerHTML = `<div class="hv-wood-modal" style="position:static;background:none;">
      <div class="wood-frame ps-frame ps-outing-frame">
        <header class="ps-outing-head">
          <button class="ps-outing-back">펫샵으로</button>
          <div><span>COMPANION WALK JOURNAL</span><h2>동행 산책 수첩</h2><p>${escapeHtml(store.displayName(active))} · ${escapeHtml(personality.name)} 성격</p></div>
          <button class="wood-close">닫기</button>
        </header>
        <div class="ps-outing-stats"><span><b>${progress.souvenirStamps}</b>/24 기념 도장</span><span><b>${progress.routesVisited}</b>/8 걸어 본 코스</span><span><b>${progress.totalWalks}</b>번의 산책</span><span><b>${progress.petPartners}</b>마리 동행</span></div>
        <div class="ps-outing-layout">
          <main class="ps-outing-feature" style="--outing-a:${selected.palette[0]};--outing-b:${selected.palette[2]}">
            <div class="ps-outing-art"><canvas width="${PET_OUTING_ART_W}" height="${PET_OUTING_ART_H}" data-outing-scene="${selected.id}" data-pet="${active}" data-accessory="${store.accessory(active)}"></canvas><span>${selected.code}</span></div>
            <header><div><small>${escapeHtml(selected.district)}</small><h3>${escapeHtml(selected.name)}</h3></div><strong>${selected.stamps}/3</strong></header>
            <p>${escapeHtml(selected.description)}</p>
            <div class="ps-outing-affinity"><span>잘 맞는 성격</span><b>${escapeHtml(favoritePersonalityNames(selected))}</b><em class="${selected.favoriteMatch ? 'is-match' : ''}">${selected.favoriteMatch ? '호흡 일치 · 기록 2칸' : '천천히 기록 1칸'}</em></div>
            <ol class="ps-outing-souvenirs">${this.souvenirRows(selected)}</ol>
            ${this.outingFeedback ? `<p class="ps-outing-feedback">${escapeHtml(this.outingFeedback)}</p>` : ''}
            <button class="ps-outing-walk" data-outing-walk ${selected.unlocked ? '' : 'disabled'}>${selected.unlocked ? (selected.activePoints >= 6 ? '이 길을 다시 산책하기' : `${selected.name} 함께 걷기`) : escapeHtml(selected.unlockHint)}</button>
          </main>
          <aside class="ps-outing-index"><header><span>여덟 골목</span><small>완주 뒤에도 다른 친구와 다시 걸을 수 있어요.</small></header>
            <div>${views.map((route, index) => `<button class="${route.id === selected.id ? 'is-selected' : ''} ${route.unlocked ? '' : 'is-locked'}" data-outing-route="${route.id}">
              <i>${String(index + 1).padStart(2, '0')}</i><span><b>${escapeHtml(route.name)}</b><small>${route.unlocked ? `${route.activePoints}/6 · 도장 ${route.stamps}/3` : escapeHtml(route.unlockHint)}</small></span><em>${route.unlocked ? `${route.stamps}/3` : '잠금'}</em>
            </button>`).join('')}</div>
          </aside>
        </div>
      </div>
    </div>`;
    this.paintCanvases();
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.ps-outing-back')!.addEventListener('click', () => { this.outingOpen = false; this.outingFeedback = ''; this.render(); });
    this.root.querySelectorAll<HTMLButtonElement>('[data-outing-route]').forEach((button) => button.addEventListener('click', () => {
      this.selectedOutingRouteId = button.dataset.outingRoute as PetOutingRouteId; this.outingFeedback = ''; this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-outing-walk]')?.addEventListener('click', () => {
      const result = this.opts.outings.walk(active, selected.id, this.outingContext(active));
      if (!result.ok) { this.outingFeedback = '아직 이 길을 걸을 준비가 되지 않았어요.'; this.render(); return; }
      const found = result.newSouvenirs.map((item) => item.name).join(' · ');
      this.outingFeedback = found
        ? `${result.favoriteMatch ? '완벽한 호흡으로' : '나란히'} 걸었어요. 새 기록: ${found}`
        : `${result.favoriteMatch ? '호흡이 잘 맞아 기록 두 칸을' : '천천히 기록 한 칸을'} 채웠어요.`;
      this.opts.onOutingChanged(this.opts.outings.progress());
      this.render();
    });
  }

  private renderProfile(petId: string): void {
    const store = this.store!;
    const species = [...BASE_SPECIES, ...RARE_SPECIES].find((item) => item.id === petId)!;
    const personality = store.personality(petId);
    const accessory = store.accessory(petId);
    const accessoryViews = store.accessoryViews(petId);
    const nickname = store.nickname(petId) ?? '';
    const affinity = store.affinity(petId);
    const homeMemories = this.opts.homeMemories(petId);
    const homeMemoryCount = homeMemories.filter((memory) => memory.recorded).length;
    const growthMemories = store.memories(petId);
    const signalContext = this.signalContext(petId);
    const signalViews = this.signals.views(petId, personality, signalContext);
    const signalProgress = this.signals.progress();
    this.root.innerHTML = `<div class="hv-wood-modal" style="position:static;background:none;">
      <div class="wood-frame ps-frame ps-profile-frame">
        <header class="ps-profile-head">
          <button class="ps-profile-back">목록으로</button>
          <div><span>COMPANION PROFILE</span><h2>${escapeHtml(store.displayName(petId))}</h2><p>${escapeHtml(species.name)} · ${PET_STAGES[store.stage(petId)]}</p></div>
          <button class="wood-close">닫기</button>
        </header>
        <div class="ps-profile-layout">
          <aside class="ps-profile-preview">
            <canvas class="ps-profile-canvas" width="${PET_W}" height="${PET_H}" data-pet="${petId}" data-accessory="${accessory}"></canvas>
            <div class="ps-profile-aff"><span>친밀도</span><b>${affinity}/${AFFINITY_MAX}</b><i><em style="width:${affinity}%"></em></i></div>
            <dl><div><dt>함께 놀기</dt><dd>${store.playCount(petId)}회</dd></div><div><dt>트릭 연습</dt><dd>${store.trainingCount(petId)}회</dd></div><div><dt>배운 트릭</dt><dd>${store.learnedTricks(petId).length}/5</dd></div><div><dt>성장 추억</dt><dd>${store.memories(petId).filter((memory) => memory.unlocked).length}/4</dd></div><div><dt>집 추억</dt><dd>${homeMemoryCount}/18</dd></div></dl>
            ${this.opts.onOpenStyleStudio ? `<button class="ps-style-studio-open" data-open-pet-style="${petId}"><small>COMPANION STYLE CARDS</small><b>동행 코디 카드 아틀리에</b><span>성격·장식·배경·포즈를 여섯 장에 저장하고 다시 입혀요.</span></button>` : ''}
          </aside>
          <main class="ps-profile-editor">
            <section class="ps-growth-album"><header><div><small>FOUR CHAPTERS TOGETHER</small><h3>${escapeHtml(store.displayName(petId))}의 성장 앨범</h3></div><span>${growthMemories.filter((memory) => memory.unlocked).length}/4 영구 추억</span></header>
              <div>${growthMemories.map((memory, index) => {
                const chapter = PET_GROWTH_CHAPTERS.find((item) => item.id === memory.id)!;
                return `<article class="${memory.unlocked ? 'unlocked' : 'locked'}" style="--growth-index:${index}"><div><canvas width="${PET_GROWTH_MEMORY_W}" height="${PET_GROWTH_MEMORY_H}" data-growth-memory="${memory.id}" data-pet="${petId}" data-accessory="${accessory}" data-personality="${personality}"></canvas><i>${memory.unlocked ? '추억 보존' : `제 ${index + 1}장`}</i></div><span><small>${escapeHtml(chapter.code)}</small><b>${escapeHtml(memory.unlocked ? memory.name : '아직 쓰지 않은 다음 장')}</b><p>${escapeHtml(memory.unlocked ? chapter.caption : memory.hint)}</p></span></article>`;
              }).join('')}</div><footer>성격과 장식을 바꿔도 추억은 사라지지 않고, 앨범 장면만 지금 모습으로 다시 그려져요.</footer></section>
            <section class="ps-signals"><header><div><small>COMPANION BODY LANGUAGE</small><h3>마음 번역 수첩</h3></div><span>${signalProgress.recorded}개 번역 · ${signalProgress.personalities}/6 성격</span></header>
              <p class="ps-signals-intro">${escapeHtml(store.displayName(petId))}의 작은 몸짓에 둘만의 뜻을 붙여 주세요. 어떤 선택도 정답이나 능력치 손해가 아니며 언제든 고쳐 쓸 수 있어요.</p>
              <div class="ps-signal-grid">${signalViews.map((view, index) => `<article class="${view.unlocked ? 'is-unlocked' : 'is-locked'} ${view.response ? 'is-recorded' : ''} ${view.featured ? 'is-featured' : ''}" style="--signal-index:${index}">
                <div class="ps-signal-art"><canvas width="${PET_SIGNAL_ART_W}" height="${PET_SIGNAL_ART_H}" data-pet-signal="${view.id}" aria-label="${escapeHtml(view.unlocked ? view.name : '아직 알아가는 몸짓')} 픽셀 장면"></canvas><i>${view.featured ? '대표 몸짓' : view.response ? '번역 보존' : `제 ${view.chapter}장`}</i></div>
                <div class="ps-signal-copy"><small>${escapeHtml(view.code)} · ${escapeHtml(view.keepsake)}</small><h4>${escapeHtml(view.unlocked ? view.name : '아직 알아가는 몸짓')}</h4><p>${escapeHtml(view.unlocked ? view.signal : view.unlockHint)}</p>${view.unlocked ? `<blockquote>${escapeHtml(view.translation)}</blockquote>` : ''}</div>
                ${view.unlocked ? `<div class="ps-signal-responses">${PET_SIGNAL_RESPONSES.map((response) => `<button class="${view.response === response.id ? 'selected' : ''}" data-signal-response="${view.id}:${response.id}" title="${escapeHtml(response.note)}"><b>${response.mark}</b><span>${escapeHtml(response.name)}</span></button>`).join('')}</div>
                <button class="ps-signal-feature" data-signal-feature="${view.id}" ${view.response ? '' : 'disabled'}>${view.featured ? '대표 몸짓에서 내리기' : '이 몸짓을 대표로 남기기'}</button>` : ''}
              </article>`).join('')}</div>
              <footer><b>${signalProgress.completedChapters}</b>개 성격 장 완성 · <b>${signalProgress.responseStyles}/3</b> 돌봄 방식 · 성격을 바꿔도 이전 번역은 그대로 남아요.</footer>
            </section>
            <form class="ps-name-form">
              <label for="pet-nickname">별명</label>
              <div><input id="pet-nickname" name="nickname" value="${escapeHtml(nickname)}" placeholder="${escapeHtml(species.name)}" autocomplete="off"><button>저장</button></div>
              <small>공백 포함 ${PET_NICKNAME_MAX}자까지. 비워 두면 기본 이름으로 돌아갑니다.</small>
              ${this.profileError ? `<p class="ps-form-error">${escapeHtml(this.profileError)}</p>` : ''}
            </form>
            <section class="ps-personality"><header><span>성격</span><p>언제든 바꿀 수 있으며 능력치 손해는 없어요.</p></header>
              <div>${PET_PERSONALITIES.map((item, index) => `<button class="${item.id === personality ? 'selected' : ''}" data-personality="${item.id}" style="--pet-option-index:${index}"><b>${item.mark}</b><span>${escapeHtml(item.name)}</span><small>${escapeHtml(item.description)}</small></button>`).join('')}</div>
            </section>
            <section class="ps-accessories"><header><span>액세서리 도감</span><p>${accessoryViews.filter((item) => item.id !== 'none' && item.unlocked).length}/${accessoryViews.length - 1} 해금 · 플레이 기록으로 자연스럽게 열려요.</p></header>
              <div>${accessoryViews.map((item, index) => `<button class="${item.id === accessory ? 'selected' : ''} ${item.unlocked ? '' : 'locked'}" data-accessory="${item.id}" ${item.unlocked ? '' : 'disabled'} style="--pet-option-index:${index}">
                <b>${item.mark}</b><span>${escapeHtml(item.name)}</span><small>${escapeHtml(item.unlocked ? item.description : `${item.hint} · ${item.progress}/${item.goal}`)}</small>
              </button>`).join('')}</div>
            </section>
            <section class="ps-home-memories"><header><span>동행의 자리 기록</span><p>집에 놓인 가구와 성격이 만나 생긴 생활 장면 ${homeMemoryCount}/18</p></header>
              <div>${PET_PERSONALITIES.map((item, index) => {
                const records = homeMemories.filter((memory) => memory.personality === item.id);
                return `<article class="${item.id === personality ? 'is-current' : ''}" style="--pet-option-index:${index}"><header><b>${escapeHtml(item.mark)}</b><span><strong>${escapeHtml(item.name)}</strong><small>${records.filter((memory) => memory.recorded).length}/3 기록</small></span></header><div>${records.map((memory) => `<span class="${memory.recorded ? 'recorded' : ''}"><canvas width="${PET_HOME_MEMORY_W}" height="${PET_HOME_MEMORY_H}" data-profile-home-memory="${memory.id}" aria-label="${escapeHtml(memory.recorded ? memory.name : '아직 모르는 동행 장면')} 픽셀 엽서"></canvas><b>${escapeHtml(memory.recorded ? memory.name : '아직 모르는 장면')}</b></span>`).join('')}</div></article>`;
              }).join('')}</div>
              <p>새 장면은 집에서 자동으로 발견됩니다. 성격 변경에는 능력치 손해나 기간 제한이 없어요.</p>
            </section>
          </main>
        </div>
      </div>
    </div>`;
    this.paintCanvases();
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.ps-profile-back')!.addEventListener('click', () => { this.profilePetId = null; this.profileError = ''; this.render(); });
    this.root.querySelector<HTMLFormElement>('.ps-name-form')!.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = this.root.querySelector<HTMLInputElement>('#pet-nickname')!;
      const raw = input.value;
      const clean = sanitizePetNickname(raw);
      if (raw.trim() && !clean) { this.profileError = '사용할 수 있는 글자를 한 자 이상 입력해 주세요.'; this.render(); return; }
      this.profileError = '';
      this.opts.onRename(petId, clean ?? '');
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-personality]').forEach((button) => button.addEventListener('click', () => {
      this.opts.onPersonality(petId, button.dataset.personality as PetPersonalityId);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-accessory]').forEach((button) => button.addEventListener('click', () => {
      this.opts.onAccessory(petId, button.dataset.accessory as PetAccessoryId);
    }));
    this.root.querySelector<HTMLButtonElement>('[data-open-pet-style]')?.addEventListener('click', () => {
      this.opts.onOpenStyleStudio?.(petId);
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-signal-response]').forEach((button) => button.addEventListener('click', () => {
      const [signalId, response] = button.dataset.signalResponse!.split(':');
      if (!signalId || !response) return;
      if (this.signals.record(petId, signalId, response as PetSignalResponseId, this.signalContext(petId))) {
        this.opts.onSignalsChanged(this.signals.progress()); this.render();
      }
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-signal-feature]').forEach((button) => button.addEventListener('click', () => {
      const signalId = button.dataset.signalFeature!;
      if (this.signals.feature(petId, signalId)) { this.opts.onSignalsChanged(this.signals.progress()); this.render(); }
    }));
  }

  private paintCanvases(): void {
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-pet]').forEach((canvas) => {
      const context = canvas.getContext('2d');
      if (context) paintPet(context, canvas.dataset.pet!, (canvas.dataset.accessory ?? 'none') as PetAccessoryId);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-outing-scene]').forEach((canvas) => {
      const context = canvas.getContext('2d');
      const route = PET_OUTING_ROUTES.find((item) => item.id === canvas.dataset.outingScene);
      if (context && route) paintPetOutingScene(
        context, route, canvas.dataset.pet!, (canvas.dataset.accessory ?? 'none') as PetAccessoryId,
        this.opts.outings.views(canvas.dataset.pet!, this.outingContext(canvas.dataset.pet!)).find((item) => item.id === route.id)?.archivePoints ?? 0,
      );
    });
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-growth-memory]').forEach((canvas) => {
      const memory = this.store?.memories(canvas.dataset.pet!).find((item) => item.id === canvas.dataset.growthMemory);
      if (memory) paintPetGrowthMemory(
        canvas, memory, canvas.dataset.pet!, (canvas.dataset.accessory ?? 'none') as PetAccessoryId,
        canvas.dataset.personality as PetPersonalityId,
      );
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-home-memory]').forEach((canvas) => {
      const petId = this.profilePetId;
      const memory = petId ? this.opts.homeMemories(petId).find((item) => item.id === canvas.dataset.profileHomeMemory) : null;
      if (memory && petId && this.store) paintPetHomeMemory(canvas, memory, petId, this.store.accessory(petId), memory.recorded, memory.count);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-pet-signal]').forEach((canvas) => {
      const petId = this.profilePetId;
      if (!petId || !this.store) return;
      const view = this.signals.views(petId, this.store.personality(petId), this.signalContext(petId))
        .find((item) => item.id === canvas.dataset.petSignal);
      if (view) paintPetSignalScene(canvas, view, petId, this.store.accessory(petId));
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-performance-scene]').forEach((canvas) => {
      const petId = this.store?.activeId();
      if (!petId || !this.store) return;
      const view = this.performances.views(
        petId,
        this.store.learnedTricks(petId).map((trick) => trick.id),
        this.store.personality(petId),
      ).find((item) => item.trickId === canvas.dataset.performanceScene);
      if (view) paintPetPerformanceScene(
        canvas,
        view,
        petId,
        this.store.accessory(petId),
        this.store.personality(petId),
      );
    });
  }

  private bindCommonActions(): void {
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((button) => button.addEventListener('click', () => this.opts.onAdopt(button.dataset.adopt!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-profile]').forEach((button) => button.addEventListener('click', () => {
      this.profilePetId = button.dataset.profile!; this.profileError = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((button) => button.addEventListener('click', () => { this.opts.onSetActive(button.dataset.take!); this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-feed]').forEach((button) => button.addEventListener('click', () => this.opts.onFeed(button.dataset.feed!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((button) => button.addEventListener('click', () => this.opts.onPlay(button.dataset.play!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-train]').forEach((button) => button.addEventListener('click', () => this.opts.onTrain(button.dataset.train!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-trick]').forEach((button) => button.addEventListener('click', () => {
      const [petId, trickId] = button.dataset.trick!.split(':'); if (petId && trickId) this.opts.onTrick(petId, trickId);
    }));
    this.root.querySelector('.ps-rest')?.addEventListener('click', () => { this.opts.onSetActive(null); this.render(); });
    this.root.querySelector('[data-open-outings]')?.addEventListener('click', () => { this.outingOpen = true; this.outingFeedback = ''; this.render(); });
    this.root.querySelector('[data-open-performances]')?.addEventListener('click', () => {
      this.performanceOpen = true;
      const active = this.store?.activeId();
      const firstLearned = active ? this.store?.learnedTricks(active)[0]?.id : null;
      this.selectedPerformanceTrickId = firstLearned ?? PET_PERFORMANCES[0]!.trickId;
      this.performanceFeedback = '';
      this.render();
    });
  }

  destroy(): void { this.root.remove(); }
}
