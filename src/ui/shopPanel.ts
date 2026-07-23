import { CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory, type ItemDef } from '../items/catalog';
import {
  FURNITURE_RECIPES,
  furnitureAcquisitionChannel,
  furnitureAcquisitionRoute,
  furnitureCraftView,
  furnitureRotationKey,
  nextFurnitureRotationAt,
  standardFurnitureItems,
  weeklyFurniturePicks,
} from '../game/home/furnitureWorkshop';

const TAB_ORDER: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];
type ShopMode = 'buy' | 'weekly' | 'craft' | 'sell';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

const rotationCountdown = (now = new Date()): string => {
  const remaining = Math.max(0, nextFurnitureRotationAt(now).getTime() - now.getTime());
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  return days > 0 ? `${days}일 ${hours}시간 뒤 교체` : `${Math.max(1, hours)}시간 안에 교체`;
};

/** 일반 진열·4주 큐레이션·서버 권위 DIY·판매를 한 공간에 묶는 살림 쇼룸. */
export class ShopPanel {
  private readonly root: HTMLDivElement;
  private activeCat: ItemCategory = 'furniture';
  private mode: ShopMode = 'buy';
  private coins = 0;
  private counts = new Map<string, number>();
  private craftHistory = new Map<string, number>();
  private weeklyHistory = new Set<string>();
  private opened = false;
  private readonly buyEnabled: boolean;
  private focusedItemId: string | null = null;
  private celebratedItemId: string | null = null;
  private celebrationTimer: ReturnType<typeof setTimeout> | null = null;
  private status = '';

  constructor(private readonly opts: {
    onBuy: (itemId: string) => void | Promise<void>;
    onSell: (itemId: string) => void | Promise<void>;
    onCraft: (recipeId: string) => void | Promise<void>;
    onToggle: (open: boolean) => void;
    buyEnabled: boolean;
    previewForItem?: (itemId: string) => string | null;
  }) {
    this.buyEnabled = opts.buyEnabled;
    this.root = document.createElement('div');
    this.root.className = 'hv-shop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(coins: number, counts: Map<string, number>, focusItemId?: string, craftHistory?: Map<string, number>, weeklyHistory?: Set<string>, initialMode?: ShopMode): void {
    this.coins = coins;
    this.counts = counts;
    if (craftHistory) this.craftHistory = craftHistory;
    if (weeklyHistory) this.weeklyHistory = weeklyHistory;
    const focused = focusItemId ? CATALOG_BY_ID.get(focusItemId) : null;
    this.focusedItemId = focused?.id ?? null;
    if (focused) {
      this.activeCat = focused.category;
      const channel = furnitureAcquisitionChannel(focused.id);
      this.mode = channel === 'diy' ? 'craft' : channel === 'weekly' ? 'weekly' : 'buy';
      this.status = channel === 'diy'
        ? `수집 선반의 ‘${focused.name}’ 제작 기록을 펼쳤어요.`
        : channel === 'weekly'
          ? `수집 선반의 ‘${focused.name}’ 주간 기록을 펼쳤어요.`
          : `수집 선반에서 찾는 ‘${focused.name}’ 진열대를 펼쳤어요.`;
    } else if (initialMode) {
      this.mode = initialMode;
      this.status = initialMode === 'craft' ? '마을 작업대에 도착했어요. 만들고 싶은 설계도와 필요한 재료를 천천히 확인해 보세요.' : '';
    } else if (!this.opened) {
      this.mode = 'buy';
      this.status = '';
    }
    if (this.opened) { this.render(); return; }
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

  setCoins(coins: number): void { this.coins = coins; if (this.opened) this.render(); }
  setCounts(counts: Map<string, number>): void { this.counts = counts; if (this.opened) this.render(); }
  setCraftHistory(history: Map<string, number>): void { this.craftHistory = history; if (this.opened) this.render(); }
  setWeeklyHistory(history: Set<string>): void { this.weeklyHistory = history; if (this.opened) this.render(); }
  setStatus(message: string): void { this.status = message; if (this.opened) this.render(); }

  celebrateCraft(itemId: string): void {
    this.celebratedItemId = itemId;
    if (this.celebrationTimer) clearTimeout(this.celebrationTimer);
    if (this.opened) this.render();
    this.celebrationTimer = setTimeout(() => {
      this.celebratedItemId = null; this.celebrationTimer = null;
      if (this.opened) this.render();
    }, 1500);
  }

  private preview(item: ItemDef, className: string): string {
    const source = this.opts.previewForItem?.(item.id);
    return source
      ? `<img class="${className}" src="${escapeHtml(source)}" alt="" aria-hidden="true">`
      : `<i class="${className}" style="background:#${item.color}" aria-hidden="true"></i>`;
  }

  private buyRow(item: ItemDef, weekly = false): string {
    const owned = this.counts.get(item.id) ?? 0;
    const recorded = weekly && this.weeklyHistory.has(item.id);
    return `<div class="row ${item.id === this.focusedItemId ? 'is-guided' : ''}" data-item-id="${item.id}">
      <i style="background:#${item.color}" aria-hidden="true"></i>
      <span class="nm">${item.id === this.focusedItemId ? '<small>선반 목표</small>' : ''}${escapeHtml(item.name)}${owned > 0 ? `<em>보유 ${owned}</em>` : ''}${recorded ? '<em>수집 기록됨</em>' : ''}</span>
      <span class="sz">${item.w}×${item.h}</span><span class="pr">${item.price.toLocaleString()} C</span>
      <button data-buy="${item.id}" ${!this.buyEnabled || this.coins < item.price ? 'disabled' : ''}>${weekly ? '이번 주 구매' : '구매'}</button>
    </div>`;
  }

  private standardHtml(): string {
    const items = standardFurnitureItems().filter((item) => item.category === this.activeCat);
    return `<div class="hv-shop-tabs">${TAB_ORDER.map((category) => `<button data-cat="${category}" class="${category === this.activeCat ? 'sel' : ''}">${CATEGORY_LABEL[category]}</button>`).join('')}</div>
      <div class="hv-shop-items">${items.length ? items.map((item) => this.buyRow(item)).join('') : '<p class="off">이 분류의 기본 진열은 비어 있어요. 이번 주와 DIY 작업대를 확인해 보세요.</p>'}</div>`;
  }

  private weeklyHtml(): string {
    const picks = weeklyFurniturePicks();
    const current = picks.filter((pick) => pick.available);
    const upcoming = picks.filter((pick) => !pick.available);
    return `<section class="shop-weekly-head"><div><small>${furnitureRotationKey()}</small><h3>이번 주 네 점</h3><p>월요일 자정마다 네 점만 바뀌고, 놓친 물건은 4주 안에 다시 돌아옵니다.</p></div><strong>${rotationCountdown()}</strong></section>
      <div class="hv-shop-items shop-weekly-current">${current.map((pick) => this.buyRow(pick.item, true)).join('')}</div>
      <section class="shop-rotation-book"><header><div><small>FOUR WEEK NOTE</small><h3>다시 오는 순환 수첩</h3></div><span>기다리는 동안 선반 목표로 남겨 둘 수 있어요.</span></header><div>${upcoming.map((pick) => `<div class="shop-upcoming ${pick.item.id === this.focusedItemId ? 'is-guided' : ''}" data-item-id="${pick.item.id}"><i style="background:#${pick.item.color}"></i><span><b>${escapeHtml(pick.item.name)}</b><small>${CATEGORY_LABEL[pick.item.category]} · ${pick.item.price.toLocaleString()} C${this.weeklyHistory.has(pick.item.id) ? ' · 수집 기록됨' : ''}</small></span><strong>${pick.waitWeeks}주 뒤</strong></div>`).join('')}</div></section>`;
  }

  private craftHtml(): string {
    const cards = FURNITURE_RECIPES.map((recipe, index) => {
      const view = furnitureCraftView(recipe, this.counts, this.coins);
      const crafted = this.craftHistory.get(recipe.id) ?? 0;
      return `<article class="shop-recipe ${view.output.id === this.focusedItemId ? 'is-guided' : ''} ${view.output.id === this.celebratedItemId ? 'is-crafted' : ''}" data-item-id="${view.output.id}" style="--shop-index:${index}">
        <header>${this.preview(view.output, 'shop-output-preview')}<div><small>${crafted > 0 ? `제작 기록 ${crafted}회` : '아직 만들지 않음'}</small><h4>${escapeHtml(view.output.name)}</h4></div><strong>${recipe.fee} C</strong></header>
        <p><b>${escapeHtml(recipe.name)}</b>${escapeHtml(recipe.note)}</p>
        <ul>${view.ingredients.map((ingredient) => {
          const item = CATALOG_BY_ID.get(ingredient.itemId)!;
          return `<li class="${ingredient.ready ? 'ready' : 'missing'}">${this.preview(item, 'shop-material-preview')}<span>${escapeHtml(ingredient.name)}</span><b>${ingredient.owned}<i>/${ingredient.qty}</i></b><button data-find-ingredient="${ingredient.itemId}">재료 찾기</button></li>`;
        }).join('')}</ul>
        <footer><span>${view.enoughMaterials ? (view.enoughCoins ? '재료와 공임 준비 완료' : '공임이 조금 부족해요') : '부족한 재료는 기본 진열에서 찾을 수 있어요'}</span><button data-craft="${recipe.id}" ${!this.buyEnabled || !view.ready ? 'disabled' : ''}>제작하기</button></footer>
      </article>`;
    }).join('');
    return `<section class="shop-craft-intro"><div><small>REMAKE, DO NOT DISCARD</small><h3>DIY 작업대</h3><p>보유 가구를 재료로 다시 만듭니다. 서버가 재료 차감과 결과 지급을 한 번에 처리합니다.</p></div><strong>${this.craftHistory.size}<i>/12</i></strong></section><div class="shop-recipe-grid">${cards}</div>`;
  }

  private sellHtml(): string {
    const owned = [...this.counts.entries()].filter(([, qty]) => qty > 0);
    return `<div class="hv-shop-items">${owned.length === 0 ? '<p class="off">팔 수 있는 보유 가구가 없어요. 발견 기록과 제작 수첩은 그대로 유지됩니다.</p>' : owned.map(([id, qty]) => {
      const item = CATALOG_BY_ID.get(id);
      if (!item) return '';
      return `<div class="row"><i style="background:#${item.color}"></i><span class="nm">${escapeHtml(item.name)} <b>×${qty}</b></span><span class="sz">${item.w}×${item.h}</span><span class="pr">+${Math.floor(item.price / 2).toLocaleString()} C</span><button data-sell="${id}" ${!this.buyEnabled ? 'disabled' : ''}>판매</button></div>`;
    }).join('')}</div>`;
  }

  private render(): void {
    const content = this.mode === 'buy' ? this.standardHtml() : this.mode === 'weekly' ? this.weeklyHtml() : this.mode === 'craft' ? this.craftHtml() : this.sellHtml();
    this.root.innerHTML = `<div class="hv-shop-card mode-${this.mode}">
      <div class="hv-shop-head"><div class="hv-shop-title"><small>SALLIM SHOWROOM</small><h2>살림 가구</h2></div>
        <div class="hv-shop-mode"><button data-mode="buy" class="${this.mode === 'buy' ? 'sel' : ''}">기본 진열</button><button data-mode="weekly" class="${this.mode === 'weekly' ? 'sel' : ''}">이번 주</button><button data-mode="craft" class="${this.mode === 'craft' ? 'sel' : ''}">DIY</button><button data-mode="sell" class="${this.mode === 'sell' ? 'sel' : ''}">판매</button></div>
        <span class="coins">${this.coins.toLocaleString()} C</span><button class="close" aria-label="살림 가구 닫기">닫기</button></div>
      ${this.status ? `<p class="hv-shop-status" role="status">${escapeHtml(this.status)}</p>` : ''}${content}
      ${this.buyEnabled ? '' : '<p class="off">지금은 둘러보기 모드예요. 접속하면 구매와 DIY 제작을 안전하게 진행할 수 있어요.</p>'}
    </div>`;
    this.bind();
    if (this.focusedItemId) requestAnimationFrame(() => this.root.querySelector<HTMLElement>(`[data-item-id="${this.focusedItemId}"]`)?.scrollIntoView({ block: 'center' }));
  }

  private bind(): void {
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => button.addEventListener('click', () => { this.mode = button.dataset.mode as ShopMode; this.focusedItemId = null; this.status = ''; this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((button) => button.addEventListener('click', () => { this.activeCat = button.dataset.cat as ItemCategory; this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; await this.opts.onBuy(button.dataset.buy!); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-sell]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; await this.opts.onSell(button.dataset.sell!); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-craft]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; await this.opts.onCraft(button.dataset.craft!); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-find-ingredient]').forEach((button) => button.addEventListener('click', () => {
      const itemId = button.dataset.findIngredient!;
      const item = CATALOG_BY_ID.get(itemId);
      if (!item) return;
      this.focusedItemId = itemId; this.activeCat = item.category;
      const channel = furnitureAcquisitionChannel(itemId);
      this.mode = channel === 'diy' ? 'craft' : channel === 'weekly' ? 'weekly' : 'buy';
      this.status = `${item.name} 재료 위치를 펼쳤어요. ${furnitureAcquisitionRoute(itemId)}`;
      this.render();
    }));
  }

  destroy(): void { if (this.celebrationTimer) clearTimeout(this.celebrationTimer); this.root.remove(); }
}
