import type { HomeDesignAnalysis } from '../game/home/homeDesign';
import type { HomeVisitView } from '../game/home/homeVisits';
import type { HomeAquariumProgress } from '../game/home/homeAquarium';
import type { FurnitureReformProgress } from '../game/home/furnitureReform';
import type { HomeMoodboardProgress } from '../game/home/homeMoodboards';
import type { ObjectStoryProgress } from '../game/home/objectStories';
import type { PetHomeComfortView, PetHomeMemoryView } from '../game/home/petHomeComfort';
import { PET_PERSONALITIES, type PetAccessoryId } from '../game/pets/petProfiles';
import { paintPet, PET_H, PET_W } from '../game/art/petArt';
import { paintPetHomeMemory, PET_HOME_MEMORY_H, PET_HOME_MEMORY_W } from '../game/art/petHomeMemoryArt';

export interface HomePetView {
  petId: string;
  petName: string;
  accessory: PetAccessoryId;
  comfort: PetHomeComfortView;
  memories: PetHomeMemoryView[];
}

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 방의 완성도와 주민 방문 앨범을 함께 안내하는 홈 스타일 인터페이스. */
export class HomeDesignPanel {
  private readonly root: HTMLDivElement;
  private readonly album: HTMLDivElement;
  private readonly petHomeBook: HTMLDivElement;
  private expanded: boolean;
  private albumOpened = false;
  private analysis: HomeDesignAnalysis | null = null;
  private visits: HomeVisitView[] = [];
  private aquarium: HomeAquariumProgress | null = null;
  private reform: FurnitureReformProgress | null = null;
  private moodboards: HomeMoodboardProgress | null = null;
  private objectStories: ObjectStoryProgress | null = null;
  private petHome: HomePetView | null = null;
  private petHomeOpened = false;

  constructor(private readonly opts: {
    onToggle?: (open: boolean) => void;
    onInvite?: (residentId: string) => void;
    onOpenAquarium?: () => void;
    onOpenReform?: () => void;
    onOpenMoodboards?: () => void;
    onOpenLayouts?: () => void;
    onOpenStudio?: () => void;
    onOpenFanRoom?: () => void;
    onOpenPetMemoryWall?: () => void;
    onOpenObjectStories?: () => void;
    onFindPetFurniture?: (itemId: string) => boolean;
    tourHost?: string;
    getHomeOpen?: () => { isPublic: boolean; online: boolean; busy: boolean };
    onToggleHomeOpen?: () => void;
  } = {}) {
    // 작은 화면에서는 방 자체가 주인공이 되도록 점수 요약만 먼저 보여 준다.
    this.expanded = window.innerWidth > 700;
    this.root = document.createElement('div');
    this.root.className = 'hv-home-style';
    this.album = document.createElement('div');
    this.album.className = 'hv-home-album';
    this.album.style.display = 'none';
    this.album.setAttribute('role', 'dialog');
    this.album.setAttribute('aria-modal', 'true');
    this.album.setAttribute('aria-label', '우리 집 방문 앨범');
    this.petHomeBook = document.createElement('div');
    this.petHomeBook.className = 'hv-pet-home-book';
    this.petHomeBook.style.display = 'none';
    this.petHomeBook.setAttribute('role', 'dialog');
    this.petHomeBook.setAttribute('aria-modal', 'true');
    this.petHomeBook.setAttribute('aria-label', '동행의 자리 수첩');
    document.body.append(this.root, this.album, this.petHomeBook);
    this.album.addEventListener('click', (event) => {
      if (event.target === this.album) this.closeAlbum();
    });
    this.album.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.closeAlbum();
    });
    this.petHomeBook.addEventListener('click', (event) => { if (event.target === this.petHomeBook) this.closePetHome(); });
    this.petHomeBook.addEventListener('keydown', (event) => { event.stopPropagation(); if (event.key === 'Escape') this.closePetHome(); });
  }

  update(analysis: HomeDesignAnalysis, visits: readonly HomeVisitView[] = [], aquarium: HomeAquariumProgress | null = null, reform: FurnitureReformProgress | null = null, petHome: HomePetView | null = null, moodboards: HomeMoodboardProgress | null = null, objectStories: ObjectStoryProgress | null = null): void {
    this.analysis = analysis;
    this.visits = [...visits];
    this.aquarium = aquarium;
    this.reform = reform;
    this.moodboards = moodboards;
    this.objectStories = objectStories;
    this.petHome = petHome;
    this.render();
    if (this.albumOpened) this.renderAlbum();
    if (this.petHomeOpened) this.renderPetHome();
  }

  openAlbum(): void {
    if (!this.analysis || this.albumOpened) return;
    this.albumOpened = true;
    this.album.style.display = 'flex';
    this.renderAlbum();
    this.opts.onToggle?.(true);
    requestAnimationFrame(() => this.album.querySelector<HTMLButtonElement>('.home-visit-close')?.focus());
  }

  closeAlbum(): void {
    if (!this.albumOpened) return;
    this.albumOpened = false;
    this.album.style.display = 'none';
    this.opts.onToggle?.(false);
  }

  openPetHome(): void {
    if (!this.petHome || this.petHomeOpened) return;
    this.petHomeOpened = true; this.petHomeBook.style.display = 'flex'; this.renderPetHome(); this.opts.onToggle?.(true);
    requestAnimationFrame(() => this.petHomeBook.querySelector<HTMLButtonElement>('.pet-home-close')?.focus());
  }

  closePetHome(): void {
    if (!this.petHomeOpened) return;
    this.petHomeOpened = false; this.petHomeBook.style.display = 'none'; this.opts.onToggle?.(false);
  }

  private render(): void {
    const analysis = this.analysis;
    if (!analysis) return;
    const recorded = this.visits.filter((visit) => visit.status === 'recorded').length;
    const ready = this.visits.filter((visit) => visit.status === 'ready');
    const next = ready[0] ?? this.visits.find((visit) => visit.status === 'locked') ?? this.visits[0];
    this.root.innerHTML = `
      <button class="hs-summary" aria-expanded="${this.expanded}">
        <span class="hs-grade" aria-hidden="true">${escapeHtml(analysis.grade.name.slice(0, 1))}</span>
        <span><b>${escapeHtml(analysis.grade.name)}</b><small>${escapeHtml(analysis.theme.name)}</small></span>
        <strong>${analysis.score}<i>/100</i></strong>
        <em aria-hidden="true">${this.expanded ? '−' : '+'}</em>
      </button>
      <div class="hs-detail" ${this.expanded ? '' : 'hidden'}>
        <div class="hs-meter" aria-label="홈 점수 ${analysis.score}점"><i style="width:${analysis.score}%"></i></div>
        <p>${escapeHtml(analysis.theme.description)}</p>
        <div class="hs-metrics">
          <span><b>${analysis.placedCount}</b>배치</span>
          <span><b>${analysis.uniqueCount}</b>종류</span>
          <span><b>${analysis.categoryCount}/6</b>분류</span>
          <span><b>${analysis.themePower}</b>테마</span>
        </div>
        ${this.opts.tourHost
          ? `<div class="hs-tour-note"><b>${escapeHtml(this.opts.tourHost)}님의 열린 집</b><span>배치와 홈 테마만 읽는 구경 모드예요. 가구·코인·집주인의 개인 설정은 바뀌거나 공개되지 않습니다.</span></div>`
          : `<div class="hs-tip"><b>다음 꾸미기</b>${escapeHtml(analysis.nextTip)}</div>`}
        ${this.opts.tourHost ? '' : `
        ${this.opts.getHomeOpen ? (() => {
          const open = this.opts.getHomeOpen!();
          return `<button class="hs-open-home ${open.isPublic ? 'is-open' : ''}" ${open.online && !open.busy ? '' : 'disabled'}>
            <i>${open.isPublic ? '문열' : '문닫'}</i><span><b>${open.isPublic ? '이웃집 투어 공개 중' : '나만의 집으로 쉬는 중'}</b><small>${open.online ? open.isPublic ? '온라인 이웃이 읽기 전용으로 방문할 수 있어요. 언제든 닫을 수 있습니다.' : '직접 열기 전에는 명함에서 누구도 방문할 수 없어요.' : '집 공개 설정은 온라인에서만 서버에 안전하게 저장돼요.'}</small></span><strong>${open.busy ? '저장 중' : open.isPublic ? '닫기' : '열기'}</strong>
          </button>`;
        })() : ''}
        ${this.opts.onOpenMoodboards && this.moodboards ? `<button class="hs-mood-open">
          <i>집</i><span><b>홈 무드보드 연구실</b><small>${this.moodboards.ready ? `${this.moodboards.ready}개 테마에 완성 도장을 찍을 수 있어요.` : '12가지 장면을 연구해 영구 도장을 모아요.'}</small></span>
          <strong>${this.moodboards.stamped}/${this.moodboards.total}</strong>
        </button>` : ''}
        ${this.opts.onOpenLayouts ? `<button class="hs-layout-open">
          <i>칸</i><span><b>홈 장면 보관함</b><small>여섯 가지 배치를 픽셀 미니어처와 함께 안전하게 갈아입혀요.</small></span><strong>6칸</strong>
        </button>` : ''}
        ${this.opts.onOpenStudio ? `<button class="hs-studio-open">
          <i>컷</i><span><b>홈 스튜디오 엽서</b><small>현재 캐릭터·동행·실제 방을 2.5D 픽셀 장면으로 보존해요.</small></span><strong>6장</strong>
        </button>` : ''}
        ${this.opts.onOpenFanRoom ? `<button class="hs-fan-room-open">
          <i>팬</i><span><b>나의 최애 방 전시 코너</b><small>공방의 대표 굿즈 3점을 실제 2.5D 방 벽에 펼쳐요.</small></span><strong>3점</strong>
        </button>` : ''}
        ${this.opts.onOpenPetMemoryWall ? `<button class="hs-pet-memory-open">
          <i>발</i><span><b>동행 추억 벽</b><small>이웃의 작은 친구와 남긴 엽서 3장을 액자·조명·배치로 전시해요.</small></span><strong>3장</strong>
        </button>` : ''}
        ${this.opts.onOpenObjectStories && this.objectStories ? `<button class="hs-object-story-open">
          <i>물</i><span><b>물건의 속삭임 도감</b><small>보유하거나 놓아 본 가구 65점의 개별 기억과 배치 이야기를 읽어요.</small></span><strong>${this.objectStories.observed}/65</strong>
        </button>` : ''}
        <button class="hs-album-open">
          <span><b>우리 집 방문 앨범</b><small>${next ? escapeHtml(next.nextHint) : '주민과 친해지면 방문 이야기가 열려요.'}</small></span>
          <strong>${recorded}/${this.visits.length || 10}</strong>
          ${ready.length ? `<i>${ready.length}명 초대 가능</i>` : '<i>천천히 준비 중</i>'}
        </button>
        ${this.opts.onOpenAquarium && this.aquarium ? `<button class="hs-aquarium-open">
          <i>수조</i><span><b>물결 테라리움 작업실</b><small>${this.aquarium.configured ? `${this.aquarium.displayedFish}마리 전시 구성 저장됨` : '낚시 도감 생물을 우리 집 어항으로'}</small></span>
          <strong>${this.aquarium.displayedFish}/${this.aquarium.displaySlots}</strong>
        </button>` : ''}
        ${this.opts.onOpenReform && this.reform ? `<button class="hs-reform-open">
          <i>결</i><span><b>골목 가구 리폼 공방</b><small>6가지 마감과 8가지 색감으로 실제 가구를 단장해요.</small></span>
          <strong>${this.reform.combinations}/${this.reform.totalCombinations}</strong>
        </button>` : ''}
        ${this.petHome ? `<button class="hs-pet-home-open">
          <i>동행</i><span><b>${escapeHtml(this.petHome.petName)}의 자리</b><small>${escapeHtml(this.petHome.comfort.grade)} · ${escapeHtml(this.petHome.comfort.tip)}</small></span>
          <strong>${this.petHome.comfort.score}<small>/100</small></strong>
        </button>` : `<button class="hs-pet-home-open" disabled><i>동행</i><span><b>동행의 자리</b><small>펫샵에서 함께 걸을 친구를 골라 오면 성격별 집 반응이 열려요.</small></span><strong>준비</strong></button>`}`}
      </div>`;
    this.root.querySelector('.hs-summary')!.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.render();
    });
    this.root.querySelector('.hs-album-open')?.addEventListener('click', () => this.openAlbum());
    this.root.querySelector('.hs-mood-open')?.addEventListener('click', () => this.opts.onOpenMoodboards?.());
    this.root.querySelector('.hs-layout-open')?.addEventListener('click', () => this.opts.onOpenLayouts?.());
    this.root.querySelector('.hs-studio-open')?.addEventListener('click', () => this.opts.onOpenStudio?.());
    this.root.querySelector('.hs-fan-room-open')?.addEventListener('click', () => this.opts.onOpenFanRoom?.());
    this.root.querySelector('.hs-pet-memory-open')?.addEventListener('click', () => this.opts.onOpenPetMemoryWall?.());
    this.root.querySelector('.hs-object-story-open')?.addEventListener('click', () => this.opts.onOpenObjectStories?.());
    this.root.querySelector('.hs-open-home:not(:disabled)')?.addEventListener('click', () => this.opts.onToggleHomeOpen?.());
    this.root.querySelector('.hs-aquarium-open')?.addEventListener('click', () => this.opts.onOpenAquarium?.());
    this.root.querySelector('.hs-reform-open')?.addEventListener('click', () => this.opts.onOpenReform?.());
    this.root.querySelector('.hs-pet-home-open:not(:disabled)')?.addEventListener('click', () => this.openPetHome());
  }

  private renderPetHome(): void {
    const context = this.petHome;
    if (!context) { this.closePetHome(); return; }
    const recorded = context.memories.filter((memory) => memory.recorded).length;
    const current = new Set(context.comfort.matches.map((match) => match.moment.id));
    this.petHomeBook.innerHTML = `<section class="pet-home-journal">
      <header class="pet-home-head"><div><small>COMPANION HOME JOURNAL</small><h2>동행의 자리</h2><p>성격과 집 꾸미기가 만나면 같은 가구도 서로 다른 생활 장면이 됩니다.</p></div><button class="pet-home-close">닫기</button></header>
      <div class="pet-home-hero">
        <aside><canvas width="${PET_W}" height="${PET_H}" data-home-pet="${context.petId}"></canvas><span>${escapeHtml(context.comfort.personalityName)} 성격</span></aside>
        <div><small>${escapeHtml(context.petName)}의 현재 안락도</small><h3>${escapeHtml(context.comfort.grade)}</h3><p>${escapeHtml(context.comfort.tip)}</p><div><i style="width:${context.comfort.score}%"></i></div></div>
        <strong>${context.comfort.score}<i>/100</i><small>추억 ${recorded}/18</small></strong>
      </div>
      <section class="pet-home-current"><header><div><small>THIS ROOM</small><h3>이 방에서 열리는 세 장면</h3></div><span>실패도, 기간 제한도 없어요.</span></header><div>${context.memories.filter((memory) => memory.personality === context.comfort.personality).map((memory, index) => {
        const match = context.comfort.matches.find((candidate) => candidate.moment.id === memory.id);
        const suggestion = memory.suggestions.map((id) => context.comfort.nextMoment?.id === memory.id && context.comfort.nextSuggestion?.id === id ? context.comfort.nextSuggestion : null).find(Boolean);
        return `<article class="${match ? 'is-ready' : ''} ${memory.recorded ? 'is-recorded' : ''}" style="--pet-home-index:${index}"><canvas width="${PET_HOME_MEMORY_W}" height="${PET_HOME_MEMORY_H}" data-pet-home-memory="${memory.id}" aria-label="${escapeHtml(memory.recorded ? memory.name : '아직 기록하지 않은 동행 장면')} 픽셀 엽서"></canvas><div><small>${memory.recorded ? `추억 ${memory.count}회` : match ? '지금 반응 가능' : '자리 준비 중'}</small><h4>${escapeHtml(memory.name)}</h4><p>${escapeHtml(match ? `${match.item.name} 곁에서 · ${memory.phrase}` : memory.hint)}</p></div>${match ? `<strong>${escapeHtml(match.item.name)}</strong>` : `<button data-pet-home-find="${suggestion?.id ?? memory.suggestions[0]}">추천 가구 찾기</button>`}</article>`;
      }).join('')}</div></section>
      <section class="pet-home-archive"><header><div><small>ALL PERSONALITIES</small><h3>여섯 성격의 18장 추억</h3></div><span>성격은 능력치 손해 없이 언제든 바꿀 수 있어요.</span></header><div>${PET_PERSONALITIES.map((personality) => {
        const memories = context.memories.filter((memory) => memory.personality === personality.id);
        return `<section><header><i>${escapeHtml(personality.mark)}</i><span><b>${escapeHtml(personality.name)}</b><small>${memories.filter((memory) => memory.recorded).length}/3 기록</small></span></header><div>${memories.map((memory) => `<article class="${memory.recorded ? 'recorded' : ''} ${current.has(memory.id) ? 'current' : ''}"><canvas width="${PET_HOME_MEMORY_W}" height="${PET_HOME_MEMORY_H}" data-pet-home-memory="${memory.id}" aria-label="${escapeHtml(memory.recorded ? memory.name : '아직 모르는 장면')} 픽셀 엽서"></canvas><span><b>${escapeHtml(memory.recorded ? memory.name : '아직 모르는 장면')}</b><small>${escapeHtml(memory.recorded ? `${memory.count}회 머묾` : memory.hint)}</small></span></article>`).join('')}</div></section>`;
      }).join('')}</div></section>
    </section>`;
    const canvas = this.petHomeBook.querySelector<HTMLCanvasElement>('[data-home-pet]');
    const ctx = canvas?.getContext('2d'); if (ctx) paintPet(ctx, context.petId, context.accessory);
    this.petHomeBook.querySelectorAll<HTMLCanvasElement>('[data-pet-home-memory]').forEach((memoryCanvas) => {
      const memory = context.memories.find((item) => item.id === memoryCanvas.dataset.petHomeMemory);
      if (memory) paintPetHomeMemory(memoryCanvas, memory, context.petId, context.accessory, memory.recorded, memory.count);
    });
    this.petHomeBook.querySelector('.pet-home-close')!.addEventListener('click', () => this.closePetHome());
    this.petHomeBook.querySelectorAll<HTMLButtonElement>('[data-pet-home-find]').forEach((button) => button.addEventListener('click', () => {
      const itemId = button.dataset.petHomeFind; if (!itemId) return;
      this.closePetHome(); this.opts.onFindPetFurniture?.(itemId);
    }));
  }

  private renderAlbum(): void {
    const analysis = this.analysis;
    if (!analysis) return;
    const recorded = this.visits.filter((visit) => visit.status === 'recorded').length;
    const ready = this.visits.filter((visit) => visit.status === 'ready').length;
    const withPet = this.visits.filter((visit) => visit.record?.petId).length;
    const featured = this.visits.find((visit) => visit.status === 'ready')
      ?? this.visits.find((visit) => visit.status === 'locked')
      ?? this.visits[this.visits.length - 1];

    this.album.innerHTML = `<section class="home-visit-book">
      <header class="home-visit-head">
        <div class="home-visit-title-mark" aria-hidden="true">집</div>
        <div><span>HOME VISITOR LOG</span><h2>우리 집 방문 앨범</h2>
          <p>꾸민 공간과 쌓아 온 관계가 만나면 이웃의 새로운 이야기가 열립니다.</p></div>
        <button class="home-visit-close" aria-label="방문 앨범 닫기">닫기</button>
      </header>
      <div class="home-visit-summary">
        <div><span>기록한 방문</span><strong>${recorded}<small> / ${this.visits.length}</small></strong></div>
        <div><span>지금 초대 가능</span><strong>${ready}<small> 명</small></strong></div>
        <div><span>펫과 함께한 장면</span><strong>${withPet}<small> 장</small></strong></div>
        <p>기간 제한도, 관계 하락도 없어요. 좋아하는 방을 천천히 완성해 주세요.</p>
      </div>
      ${featured ? `<article class="home-visit-featured ${featured.status}">
        <div class="home-visit-featured-mark">${escapeHtml(featured.mark)}</div>
        <div><span>${featured.status === 'recorded' ? '최근 완성한 추억' : featured.status === 'ready' ? '지금 열리는 초대' : '다음 추천 목표'}</span>
          <h3>${escapeHtml(featured.title)}</h3><p>${escapeHtml(featured.invitation)}</p>
          <small>${escapeHtml(featured.nextHint)}</small></div>
        ${featured.status === 'locked' ? '' : `<button data-visit="${featured.residentId}">${featured.status === 'recorded' ? '장면 다시 보기' : '집으로 초대하기'}</button>`}
      </article>` : ''}
      <div class="home-visit-list">${this.visits.map((visit, index) => this.visitCard(visit, index)).join('')}</div>
    </section>`;

    this.album.querySelector('.home-visit-close')!.addEventListener('click', () => this.closeAlbum());
    this.album.querySelectorAll<HTMLButtonElement>('[data-visit]').forEach((button) => {
      button.addEventListener('click', () => {
        const residentId = button.dataset.visit;
        if (residentId) this.opts.onInvite?.(residentId);
      });
    });
  }

  private visitCard(visit: HomeVisitView, index: number): string {
    const statusLabel = visit.status === 'recorded' ? '기록 완료' : visit.status === 'ready' ? '초대 가능' : '준비 중';
    const body = visit.status === 'recorded' ? visit.memory : visit.invitation;
    return `<article class="home-visit-card ${visit.status}" style="--visit-index:${index}">
      <div class="home-visit-card-top">
        <span class="home-visit-resident-mark">${escapeHtml(visit.mark)}</span>
        <div><small>${escapeHtml(visit.resident.role)}</small><h3>${escapeHtml(visit.resident.name)}</h3></div>
        <b>${statusLabel}</b>
      </div>
      <h4>${escapeHtml(visit.title)}</h4>
      <p>${escapeHtml(body)}</p>
      <div class="home-visit-checks">${visit.checks.map((check) => `
        <span class="${check.met || visit.status === 'recorded' ? 'met' : ''}"><i aria-hidden="true"></i>${escapeHtml(check.label)} <b>${Math.min(check.current, check.goal)}/${check.goal}</b></span>`).join('')}
      </div>
      <footer><small>${escapeHtml(visit.nextHint)}</small>
        ${visit.status === 'locked' ? '<button disabled>조건을 채우는 중</button>'
          : `<button data-visit="${visit.residentId}">${visit.status === 'recorded' ? '다시 만나기' : '초대하기'}</button>`}
      </footer>
    </article>`;
  }

  destroy(): void {
    if (this.albumOpened) this.opts.onToggle?.(false);
    if (this.petHomeOpened) this.opts.onToggle?.(false);
    this.root.remove();
    this.album.remove();
    this.petHomeBook.remove();
  }
}
