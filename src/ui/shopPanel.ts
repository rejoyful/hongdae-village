import { CATALOG, CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory } from '../items/catalog';

const TAB_ORDER: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];

/** 가구점 「살림」 — 구매(전 카탈로그) / 판매(보유 가구 반값 매입) */
export class ShopPanel {
  private root: HTMLDivElement;
  private activeCat: ItemCategory = 'furniture';
  private mode: 'buy' | 'sell' = 'buy';
  private coins = 0;
  private counts = new Map<string, number>();
  private opened = false;
  private buyEnabled: boolean;

  constructor(private readonly opts: {
    onBuy: (itemId: string) => void;
    onSell: (itemId: string) => void;
    onToggle: (open: boolean) => void;
    buyEnabled: boolean; // 오프라인이면 거래 비활성
  }) {
    this.buyEnabled = opts.buyEnabled;
    this.root = document.createElement('div');
    this.root.className = 'hv-shop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(coins: number, counts: Map<string, number>): void {
    if (this.opened) return;
    this.opened = true;
    this.coins = coins;
    this.counts = counts;
    this.mode = 'buy';
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

  setCoins(coins: number): void {
    this.coins = coins;
    if (this.opened) this.render();
  }

  setCounts(counts: Map<string, number>): void {
    this.counts = counts;
    if (this.opened) this.render();
  }

  private render(): void {
    const buyRows = CATALOG.filter((i) => i.category === this.activeCat).map((i) => `
      <div class="row">
        <i style="background:#${i.color}"></i>
        <span class="nm">${i.name}</span>
        <span class="sz">${i.w}×${i.h}</span>
        <span class="pr">🪙 ${i.price}</span>
        <button data-buy="${i.id}" ${!this.buyEnabled || this.coins < i.price ? 'disabled' : ''}>구매</button>
      </div>`).join('');

    const owned = [...this.counts.entries()].filter(([, q]) => q > 0);
    const sellRows = owned.length === 0
      ? '<p class="off">팔 수 있는 보유 가구가 없어요</p>'
      : owned.map(([id, qty]) => {
          const def = CATALOG_BY_ID.get(id);
          if (!def) return '';
          return `
            <div class="row">
              <i style="background:#${def.color}"></i>
              <span class="nm">${def.name} <b style="opacity:.6">×${qty}</b></span>
              <span class="pr">🪙 +${Math.floor(def.price / 2)}</span>
              <button data-sell="${id}" ${!this.buyEnabled ? 'disabled' : ''}>판매</button>
            </div>`;
        }).join('');

    this.root.innerHTML = `
      <div class="hv-shop-card">
        <div class="hv-shop-head">
          <h2>살림 가구</h2>
          <div class="hv-shop-mode">
            <button data-mode="buy" class="${this.mode === 'buy' ? 'sel' : ''}">구매</button>
            <button data-mode="sell" class="${this.mode === 'sell' ? 'sel' : ''}">판매</button>
          </div>
          <span class="coins">🪙 ${this.coins.toLocaleString()}</span>
          <button class="close">✕</button>
        </div>
        ${this.mode === 'buy' ? `
          <div class="hv-shop-tabs">
            ${TAB_ORDER.map((c) => `<button data-cat="${c}" class="${c === this.activeCat ? 'sel' : ''}">${CATEGORY_LABEL[c]}</button>`).join('')}
          </div>` : ''}
        <div class="hv-shop-items">${this.mode === 'buy' ? buyRows : sellRows}</div>
        ${this.buyEnabled ? '' : '<p class="off">오프라인 모드 — 거래는 접속 후 가능해요</p>'}
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach((b) => {
      b.addEventListener('click', () => { this.mode = b.dataset.mode as 'buy' | 'sell'; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-cat]').forEach((b) => {
      b.addEventListener('click', () => { this.activeCat = b.dataset.cat as ItemCategory; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-buy]').forEach((b) => {
      b.addEventListener('click', () => this.opts.onBuy(b.dataset.buy!));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-sell]').forEach((b) => {
      b.addEventListener('click', () => this.opts.onSell(b.dataset.sell!));
    });
  }

  destroy(): void { this.root.remove(); }
}
