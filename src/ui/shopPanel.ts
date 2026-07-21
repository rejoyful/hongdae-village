import { CATALOG, CATEGORY_LABEL, type ItemCategory } from '../items/catalog';

const TAB_ORDER: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];

/** 가구점 「살림」 상점 패널 — 전 카탈로그를 카테고리 탭으로 판매 */
export class ShopPanel {
  private root: HTMLDivElement;
  private activeCat: ItemCategory = 'furniture';
  private coins = 0;
  private opened = false;
  private buyEnabled: boolean;

  constructor(private readonly opts: {
    onBuy: (itemId: string) => void;
    onToggle: (open: boolean) => void;
    buyEnabled: boolean; // 오프라인이면 구매 비활성
  }) {
    this.buyEnabled = opts.buyEnabled;
    this.root = document.createElement('div');
    this.root.className = 'hv-shop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(coins: number): void {
    if (this.opened) return;
    this.opened = true;
    this.coins = coins;
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

  private render(): void {
    const items = CATALOG.filter((i) => i.category === this.activeCat);
    this.root.innerHTML = `
      <div class="hv-shop-card">
        <div class="hv-shop-head">
          <h2>살림 가구</h2>
          <span class="coins">🪙 ${this.coins.toLocaleString()}</span>
          <button class="close">✕</button>
        </div>
        <div class="hv-shop-tabs">
          ${TAB_ORDER.map((c) => `<button data-cat="${c}" class="${c === this.activeCat ? 'sel' : ''}">${CATEGORY_LABEL[c]}</button>`).join('')}
        </div>
        <div class="hv-shop-items">
          ${items.map((i) => `
            <div class="row">
              <i style="background:#${i.color}"></i>
              <span class="nm">${i.name}</span>
              <span class="sz">${i.w}×${i.h}</span>
              <span class="pr">🪙 ${i.price}</span>
              <button data-buy="${i.id}" ${!this.buyEnabled || this.coins < i.price ? 'disabled' : ''}>구매</button>
            </div>`).join('')}
        </div>
        ${this.buyEnabled ? '' : '<p class="off">오프라인 모드 — 구매는 접속 후 가능해요</p>'}
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-cat]').forEach((b) => {
      b.addEventListener('click', () => { this.activeCat = b.dataset.cat as ItemCategory; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-buy]').forEach((b) => {
      b.addEventListener('click', () => this.opts.onBuy(b.dataset.buy!));
    });
  }

  destroy(): void { this.root.remove(); }
}
