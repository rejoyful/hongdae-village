import { TREASURES, RARITY_LABEL, RARITY_COLOR, STREET_SPARKLES, FOREST_SPARKLES } from '../game/treasure/treasures';
import type { TreasureStore } from '../game/treasure/treasureStore';
import { gemIcons } from './treasureIcons';

/** 보물 도감 — 조각으로 예쁜 젬 제작·수집(소장). 미발견 힌트 탭 포함 */
export class TreasurePanel {
  private root: HTMLDivElement;
  private opened = false;
  private tab: 'collection' | 'hints' = 'collection';
  private selected: string | null = null;

  constructor(private readonly store: TreasureStore, private readonly opts: { onToggle: (open: boolean) => void }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-treasure';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
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

  private render(): void {
    const st = this.store.get();
    const icons = gemIcons();
    const prog = this.store.progress();
    const body = this.tab === 'collection' ? this.collectionHtml(st, icons) : this.hintsHtml(st);
    this.root.innerHTML = `
      <div class="wood-frame tr-frame">
        <div class="wood-head">
          <h2>💎 보물 도감</h2>
          <span class="pill">💠 조각 ${st.shards} · 📖 ${prog.owned}/${prog.total}</span>
        </div>
        <div class="wood-tabs tr-tabs">
          <button data-tab="collection" class="${this.tab === 'collection' ? 'sel' : ''}">컬렉션</button>
          <button data-tab="hints" class="${this.tab === 'hints' ? 'sel' : ''}">단서</button>
        </div>
        <div class="wood-page tr-body">${body}</div>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => { this.tab = b.dataset.tab as 'collection' | 'hints'; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach((b) => {
      b.addEventListener('click', () => {
        if (this.store.craft(b.dataset.craft!)) this.selected = b.dataset.craft!;
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-sel]').forEach((b) => {
      b.addEventListener('click', () => { this.selected = b.dataset.sel!; this.render(); });
    });
  }

  private collectionHtml(st: ReturnType<TreasureStore['get']>, icons: Record<string, string>): string {
    const cells = TREASURES.map((t) => {
      const owned = st.crafted[t.id] ?? 0;
      const sel = this.selected === t.id;
      return `
        <button class="tr-cell ${owned ? 'has' : 'none'} ${sel ? 'sel' : ''}" data-sel="${t.id}"
          style="--rc:${RARITY_COLOR[t.rarity]}">
          ${owned ? `<img src="${icons[t.id]}" alt="">` : '<div class="tr-silhouette">?</div>'}
          ${owned > 1 ? `<b>×${owned}</b>` : ''}
          <span class="tr-name">${owned ? t.name : '???'}</span>
        </button>`;
    }).join('');
    const sel = this.selected ? TREASURES.find((t) => t.id === this.selected) : null;
    const detail = sel ? `
      <div class="tr-detail" style="--rc:${RARITY_COLOR[sel.rarity]}">
        <div class="tr-detail-head">
          ${(st.crafted[sel.id] ?? 0) > 0 ? `<img src="${icons[sel.id]}" alt="">` : '<div class="tr-silhouette big">?</div>'}
          <div>
            <b>${(st.crafted[sel.id] ?? 0) > 0 ? sel.name : '???'}</b>
            <span class="tr-rarity">${RARITY_LABEL[sel.rarity]}</span>
          </div>
        </div>
        <p class="tr-lore">${(st.crafted[sel.id] ?? 0) > 0 ? sel.lore : '아직 만들지 못한 보물이에요. 조각을 모아 제작해 보세요.'}</p>
        <button class="tr-craft" data-craft="${sel.id}" ${st.shards >= sel.shards ? '' : 'disabled'}>
          💠 ${sel.shards}개로 제작${st.shards >= sel.shards ? '' : ` (조각 부족)`}
        </button>
      </div>` : '<p class="tr-pick">보물을 골라 상세·제작을 확인하세요</p>';
    return `<div class="tr-grid">${cells}</div>${detail}`;
  }

  private hintsHtml(st: ReturnType<TreasureStore['get']>): string {
    const all = [...STREET_SPARKLES, ...Object.values(FOREST_SPARKLES).flat()];
    const rows = all.map((s) => {
      const found = st.found.includes(s.id);
      return `<div class="tr-hint ${found ? 'done' : ''}">
        <span class="tr-hint-ic">${found ? '✅' : '✨'}</span>
        <div><b>${s.where}</b><span>${found ? '오늘 발견 완료!' : s.hint}</span></div>
        <em>+${s.shards}</em>
      </div>`;
    }).join('');
    const foundCount = all.filter((s) => st.found.includes(s.id)).length;
    return `<p class="tr-hint-top">오늘 ${foundCount}/${all.length}곳 발견 · 반짝이는 곳을 밟으면 조각이 나와요 (매일 리셋)</p>${rows}`;
  }

  destroy(): void { this.root.remove(); }
}
