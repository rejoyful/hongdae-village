import type { QuestView } from '../game/questProgress';
import {
  searchVillage, type VillageSearchAction, type VillageSearchKind, type VillageSearchResult,
} from '../game/guidance/villageSearch';

const FILTERS: Array<{ id: VillageSearchKind | 'all'; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'activity', label: '장소' },
  { id: 'quest', label: '퀘스트' },
  { id: 'resident', label: '주민' },
  { id: 'district', label: '권역' },
  { id: 'panel', label: '메뉴' },
];

const KIND_LABEL: Record<VillageSearchKind, string> = {
  panel: 'MENU', activity: 'PLACE', resident: 'RESIDENT', district: 'DISTRICT', quest: 'QUEST',
};

const QUICK_SEARCHES = ['집꾸미기', '펫', '코디', '주민', '낚시', '외곽숲'] as const;

/** 391개 퀘스트와 월드 목적지를 한 입력창에서 찾고 기존 금빛 길 안내로 넘기는 전역 탐색 패널. */
export class VillageSearchPanel {
  private readonly root = document.createElement('div');
  private opened = false;
  private query = '';
  private kind: VillageSearchKind | 'all' = 'all';
  private results: VillageSearchResult[] = [];

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    getQuestViews: () => QuestView[];
    onSelect: (action: VillageSearchAction, result: VillageSearchResult) => void;
    onOpen?: () => void;
  }) {
    this.root.className = 'hv-village-search';
    this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') { this.close(); return; }
      if (event.key === 'Enter' && event.target instanceof HTMLInputElement && this.results[0]) {
        event.preventDefault();
        this.choose(this.results[0]);
      }
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(initialQuery = ''): void {
    if (this.opened) return;
    this.opened = true;
    this.query = initialQuery;
    this.kind = 'all';
    this.root.style.display = 'flex';
    this.render();
    this.opts.onOpen?.();
    this.opts.onToggle(true);
    window.setTimeout(() => {
      const input = this.root.querySelector<HTMLInputElement>('input');
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private render(): void {
    this.results = searchVillage(this.query, this.opts.getQuestViews(), this.kind);
    this.root.innerHTML = `<section class="village-search-book" role="dialog" aria-modal="true" aria-label="마을 전체 찾기">
      <header>
        <div><small>HONGDAE VILLAGE FINDER</small><h2>마을 전체 찾기</h2><p>퀘스트 이름을 몰라도 하고 싶은 말로 찾아보세요. 선택하면 실제 메뉴를 열거나 금빛 발자국을 이어 드립니다.</p></div>
        <aside><b>F</b><span>언제든 다시 열기</span></aside>
        <button class="village-search-close" aria-label="마을 찾기 닫기">닫기</button>
      </header>
      <div class="village-search-input">
        <i aria-hidden="true"></i>
        <input type="search" value="${escapeHtml(this.query)}" placeholder="예: 집꾸미기, 하늘, 외곽숲, 첫 코디" autocomplete="off" spellcheck="false" aria-label="마을 콘텐츠 검색">
        <span>${this.results.length}개 찾음</span>
      </div>
      <nav class="village-search-filters" aria-label="검색 분류">
        ${FILTERS.map((filter) => `<button data-search-kind="${filter.id}" class="${this.kind === filter.id ? 'is-selected' : ''}">${filter.label}</button>`).join('')}
      </nav>
      <div class="village-search-layout">
        <aside class="village-search-quick">
          <small>QUICK WORDS</small><b>무엇을 하고 싶나요?</b>
          <div>${QUICK_SEARCHES.map((word) => `<button data-search-quick="${word}" class="${this.query === word ? 'is-selected' : ''}">${word}</button>`).join('')}</div>
          <p>메뉴 이름을 외울 필요가 없어요. 띄어쓰기가 달라도 생활 별칭을 함께 찾아봅니다.</p>
        </aside>
        <section class="village-search-results" aria-live="polite">${this.resultsHtml()}</section>
      </div>
    </section>`;
    this.bind();
  }

  private resultsHtml(): string {
    if (!this.results.length) {
      return `<div class="village-search-empty"><i>?</i><div><small>NO MATCH YET</small><b>아직 맞는 기록을 찾지 못했어요</b><p>더 짧은 낱말로 다시 찾아보세요. “집”, “펫”, “요리”처럼 하고 싶은 생활 한 가지만 적어도 됩니다.</p></div></div>`;
    }
    return this.results.map((result, index) => {
      const progress = result.progress;
      const pct = progress ? Math.round((progress.current / Math.max(1, progress.goal)) * 100) : 0;
      const state = progress?.state ?? 'ready';
      const actionLabel = result.action.type === 'panel' ? '열기'
        : result.action.type === 'quest' && !result.action.unlocked ? '조건 보기'
          : result.action.type === 'resident' ? '만나러 가기' : '길 안내';
      return `<button class="village-search-result is-${state}" data-search-result="${result.id}" style="--search-index:${Math.min(index, 8)}">
        <i>${escapeHtml(result.mark)}</i>
        <span><small>${KIND_LABEL[result.kind]} · ${escapeHtml(result.code)}</small><b>${escapeHtml(result.title)}</b><em>${escapeHtml(result.subtitle)}</em>
          ${progress ? `<u><i style="transform:scaleX(${Math.min(100, pct) / 100})"></i></u>` : ''}
        </span>
        <strong>${progress ? `${progress.current}/${progress.goal}` : actionLabel}<small>${progress ? actionLabel : ''}</small></strong>
      </button>`;
    }).join('');
  }

  private bind(): void {
    this.root.querySelector('.village-search-close')!.addEventListener('click', () => this.close());
    const input = this.root.querySelector<HTMLInputElement>('input')!;
    input.addEventListener('input', () => {
      this.query = input.value;
      this.updateResults();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-search-kind]').forEach((button) => {
      button.addEventListener('click', () => {
        this.kind = button.dataset.searchKind as VillageSearchKind | 'all';
        this.render();
        this.root.querySelector<HTMLInputElement>('input')?.focus();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-search-quick]').forEach((button) => {
      button.addEventListener('click', () => {
        this.query = button.dataset.searchQuick ?? '';
        this.render();
        const next = this.root.querySelector<HTMLInputElement>('input');
        next?.focus(); next?.setSelectionRange(next.value.length, next.value.length);
      });
    });
    this.bindResultButtons();
  }

  private updateResults(): void {
    this.results = searchVillage(this.query, this.opts.getQuestViews(), this.kind);
    const host = this.root.querySelector<HTMLElement>('.village-search-results')!;
    host.innerHTML = this.resultsHtml();
    this.root.querySelector<HTMLElement>('.village-search-input > span')!.textContent = `${this.results.length}개 찾음`;
    this.bindResultButtons();
  }

  private bindResultButtons(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-search-result]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.results.find((item) => item.id === button.dataset.searchResult);
        if (result) this.choose(result);
      });
    });
  }

  private choose(result: VillageSearchResult): void {
    this.close();
    this.opts.onSelect(result.action, result);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!
  ));
}
