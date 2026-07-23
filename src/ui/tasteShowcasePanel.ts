import type { Appearance } from '../game/art/appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from '../game/art/characterArt';
import { PET_H, PET_W, paintPet } from '../game/art/petArt';
import {
  LOOKBOOK_CONTRACTS, evaluateLookbookContract, type LookbookStore,
} from '../game/art/lookbook';
import {
  TASTE_SHOWCASE_BY_ID, TASTE_SHOWCASE_EXHIBITS, TasteShowcaseStore, evaluateTasteShowcase,
  type TasteShowcaseContext, type TasteShowcaseDomain,
} from '../game/showcase/tasteShowcase';

type ShowcaseTab = 'fashion' | TasteShowcaseDomain;

export interface TasteShowcasePanelContext extends TasteShowcaseContext {
  appearance: Appearance;
  unlockedBadgeIds: string[];
}

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

const FASHION_CONTRACTS = LOOKBOOK_CONTRACTS.filter((contract) => !contract.prerequisiteBadgeId).slice(0, 4);

/** 의상 룩북과 집·동행 기록을 한 자리에서 큐레이션하는 비경쟁 전시 패널. */
export class TasteShowcasePanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private tab: ShowcaseTab = 'fashion';
  private selectedId = `fashion:${FASHION_CONTRACTS[0]!.id}`;
  private feedback = '';

  constructor(
    private readonly store: TasteShowcaseStore,
    private readonly lookbook: LookbookStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      getContext: () => TasteShowcasePanelContext;
      onChanged?: () => void;
      onOpenAtelier?: () => void;
      onOpenHome?: () => void;
      onOpenPet?: () => void;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-taste-showcase';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(initialTab?: ShowcaseTab): void {
    if (this.opened) return;
    if (initialTab) this.tab = initialTab;
    this.ensureSelection();
    this.feedback = '';
    this.opened = true;
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

  destroy(): void { this.close(); this.root.remove(); }

  private ensureSelection(): void {
    if (this.tab === 'fashion') {
      if (!this.selectedId.startsWith('fashion:')) this.selectedId = `fashion:${FASHION_CONTRACTS[0]!.id}`;
      return;
    }
    const selected = TASTE_SHOWCASE_BY_ID.get(this.selectedId);
    if (selected?.domain === this.tab) return;
    this.selectedId = TASTE_SHOWCASE_EXHIBITS.find((item) => item.domain === this.tab)!.id;
  }

  private currentCards(): Array<{ id: string; code: string; mark: string; name: string; brief: string; best: number }> {
    if (this.tab === 'fashion') return FASHION_CONTRACTS.map((contract) => ({
      id: `fashion:${contract.id}`, code: 'LOOK', mark: '옷', name: contract.name, brief: contract.brief,
      best: this.lookbook.entry(contract.id)?.bestStars ?? 0,
    }));
    return TASTE_SHOWCASE_EXHIBITS.filter((item) => item.domain === this.tab).map((item) => ({
      id: item.id, code: item.code, mark: item.mark, name: item.name, brief: item.brief,
      best: this.store.record(item.id)?.bestStamps ?? 0,
    }));
  }

  private selectedHtml(context: TasteShowcasePanelContext): string {
    if (this.selectedId.startsWith('fashion:')) {
      const id = this.selectedId.slice('fashion:'.length);
      const contract = FASHION_CONTRACTS.find((item) => item.id === id) ?? FASHION_CONTRACTS[0]!;
      const evaluation = evaluateLookbookContract(contract, context.appearance);
      const record = this.lookbook.entry(contract.id);
      const criteria = evaluation.rules.map((item) => `<li class="${item.matched ? 'met' : ''}">
        <i>${item.matched ? '완' : '중'}</i><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.hint)}</small></span>
      </li>`).join('');
      return `<section class="taste-feature" data-domain="fashion">
        <div class="taste-feature-copy"><span>${escapeHtml(contract.scene)}</span><h2>${escapeHtml(contract.name)}</h2><p>${escapeHtml(contract.brief)}</p></div>
        <div class="taste-live-stage"><div class="taste-canvas-frame"><canvas class="taste-avatar-canvas" width="${CHAR_W}" height="${CHAR_H}" aria-label="현재 캐릭터 코디"></canvas></div>
          <div><small>현재 코디</small><b>${evaluation.matched}/3 조건</b><p>지금 입은 모습이 그대로 룩북에 남습니다.</p></div></div>
        <ol class="taste-criteria">${criteria}</ol>
        <div class="taste-submit-row"><div><small>최고 기록</small><b>${record?.bestStars ?? 0}/3 도장</b></div><button class="taste-submit" data-submit="${contract.id}">현재 코디 출품</button></div>
      </section>`;
    }

    const exhibit = TASTE_SHOWCASE_BY_ID.get(this.selectedId) ?? TASTE_SHOWCASE_EXHIBITS[0]!;
    const evaluation = evaluateTasteShowcase(exhibit, context);
    const record = this.store.record(exhibit.id);
    const criteria = evaluation.criteria.map((item) => `<li class="${item.matched ? 'met' : ''}">
      <i>${item.matched ? '완' : '중'}</i><span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.hint)}</small></span>
    </li>`).join('');
    const home = context.home;
    const pet = context.pet;
    const live = exhibit.domain === 'home'
      ? `<div class="taste-room-mini"><span>${home ? escapeHtml(home.themeName) : '아직 불러온 방 없음'}</span><b>${home?.score ?? 0}</b><small>홈 스타일 점수</small><i style="--fill:${home?.score ?? 0}%"></i></div>
         <div><small>현재 방 기록</small><b>${home ? `${home.uniqueCount}종 · ${home.categoryCount}분류` : '집에 한 번 다녀오세요'}</b><p>${home ? '가장 최근에 집에서 저장된 배치를 읽었어요.' : '방에 들어가면 현재 배치가 자동으로 전시 수첩에 동기화됩니다.'}</p></div>`
      : `<div class="taste-canvas-frame pet"><canvas class="taste-pet-canvas" width="${PET_W}" height="${PET_H}" aria-label="현재 동행 펫"></canvas></div>
         <div><small>현재 동행</small><b>${pet.activeName ? escapeHtml(pet.activeName) : '함께 걷는 펫 없음'}</b><p>${pet.activeId ? `친밀도 ${pet.affinity} · 트릭 ${pet.tricks}개 · 추억 ${pet.memories}장` : '펫샵에서 동행을 정하면 초상이 이곳에 나타납니다.'}</p></div>`;
    return `<section class="taste-feature" data-domain="${exhibit.domain}">
      <div class="taste-feature-copy"><span>${escapeHtml(exhibit.code)} · ${escapeHtml(exhibit.curator)}</span><h2>${escapeHtml(exhibit.name)}</h2><p>${escapeHtml(exhibit.brief)}</p></div>
      <div class="taste-live-stage">${live}</div>
      <ol class="taste-criteria">${criteria}</ol>
      <div class="taste-submit-row"><div><small>최고 기록</small><b>${record?.bestStamps ?? 0}/3 도장</b></div><button class="taste-submit" data-submit="${exhibit.id}">현재 모습 출품</button></div>
    </section>`;
  }

  private render(): void {
    const context = this.opts.getContext();
    const ownProgress = this.store.progress();
    const fashionEntries = FASHION_CONTRACTS.filter((item) => this.lookbook.entry(item.id)).length;
    const fashionStamps = FASHION_CONTRACTS.reduce((sum, item) => sum + (this.lookbook.entry(item.id)?.bestStars ?? 0), 0);
    const entries = ownProgress.entries + fashionEntries;
    const stamps = ownProgress.stamps + fashionStamps;
    const cards = this.currentCards().map((card, index) => `<button class="taste-index-card ${this.selectedId === card.id ? 'selected' : ''}" data-select="${card.id}" style="--delay:${index * 35}ms">
      <i>${escapeHtml(card.mark)}</i><span><small>${escapeHtml(card.code)}</small><b>${escapeHtml(card.name)}</b><em>${card.best ? `${card.best}/3 최고 기록` : '아직 비어 있음'}</em></span>
    </button>`).join('');
    const tabButton = (id: ShowcaseTab, label: string, note: string) => `<button class="${this.tab === id ? 'selected' : ''}" data-tab="${id}"><b>${label}</b><small>${note}</small></button>`;

    this.root.innerHTML = `<div class="taste-shell">
      <header class="taste-header"><div><small>HONGDAE TASTE ARCHIVE</small><h1>골목 취향 전시회</h1><p>잘하고 못하는 순위 없이, 지금의 선택을 한 장씩 남기는 주민 전시입니다.</p></div>
        <div class="taste-header-art"><img src="assets/isometric/taste_showcase_booth_v1.png" alt="골목 취향 전시 부스"><button class="taste-close" aria-label="닫기">닫기</button></div></header>
      <div class="taste-ledger"><span><small>출품한 주제</small><b>${entries}/12</b></span><span><small>모은 도장</small><b>${stamps}/36</b></span><span><small>참여 원칙</small><b>실패·기한 없음</b></span></div>
      <nav class="taste-tabs" aria-label="전시 분야">${tabButton('fashion', '입는 취향', '즉시 열린 룩북 4장')}${tabButton('home', '사는 취향', '현재 방 4장')}${tabButton('pet', '함께하는 취향', '동행 기록 4장')}</nav>
      <main class="taste-layout">${this.selectedHtml(context)}<aside class="taste-index"><header><small>${this.tab === 'fashion' ? 'LOOK ARCHIVE' : this.tab === 'home' ? 'ROOM ARCHIVE' : 'PAIR ARCHIVE'}</small><b>이번 전시의 네 장</b></header>${cards}</aside></main>
      <footer class="taste-footer"><p class="taste-feedback" aria-live="polite">${escapeHtml(this.feedback || '조건이 하나도 맞지 않아도 참여 도장 하나를 받아요. 최고 기록은 내려가지 않습니다.')}</p>
        <button class="taste-edit" data-edit="${this.tab}">${this.tab === 'fashion' ? '아틀리에에서 코디 바꾸기' : this.tab === 'home' ? '집에서 배치 갱신하기' : '펫샵에서 동행 살펴보기'}</button></footer>
    </div>`;

    this.bind();
    this.paintPreviews(context);
  }

  private bind(): void {
    this.root.querySelector<HTMLButtonElement>('.taste-close')?.addEventListener('click', () => this.close());
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tab]')) button.addEventListener('click', () => {
      this.tab = button.dataset.tab as ShowcaseTab;
      this.ensureSelection();
      this.feedback = '';
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-select]')) button.addEventListener('click', () => {
      this.selectedId = button.dataset.select!;
      this.feedback = '';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-submit]')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const context = this.opts.getContext();
      if (this.selectedId.startsWith('fashion:')) {
        const result = this.lookbook.submit(button.dataset.submit!, context.appearance, context.unlockedBadgeIds);
        this.feedback = result.ok
          ? `${result.stars}도장을 기록했어요.${result.improved ? ' 이번 모습이 새 최고 기록입니다.' : ' 기존 최고 기록도 안전하게 보관했어요.'}`
          : '룩북 기록을 확인하지 못했어요.';
      } else {
        const result = this.store.submit(button.dataset.submit!, context);
        this.feedback = result.ok
          ? `${result.stamps}도장을 기록했어요.${result.improved ? ' 이번 모습이 새 최고 기록입니다.' : ' 기존 최고 기록도 안전하게 보관했어요.'}`
          : '전시 기록을 확인하지 못했어요.';
      }
      this.opts.onChanged?.();
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-edit]')?.addEventListener('click', () => {
      const tab = this.tab;
      this.close();
      if (tab === 'fashion') this.opts.onOpenAtelier?.();
      else if (tab === 'home') this.opts.onOpenHome?.();
      else this.opts.onOpenPet?.();
    });
  }

  private paintPreviews(context: TasteShowcasePanelContext): void {
    const avatar = this.root.querySelector<HTMLCanvasElement>('.taste-avatar-canvas');
    const avatarCtx = avatar?.getContext('2d');
    if (avatarCtx) paintCharacterFrame(avatarCtx, context.appearance, 0, 0);
    const pet = this.root.querySelector<HTMLCanvasElement>('.taste-pet-canvas');
    const petCtx = pet?.getContext('2d');
    if (petCtx && context.pet.activeId) paintPet(petCtx, context.pet.activeId, context.pet.accessory ?? 'none');
  }
}
