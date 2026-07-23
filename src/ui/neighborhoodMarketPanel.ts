import { CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory, type ItemDef } from '../items/catalog';
import { paintNeighborhoodMarketArt } from '../game/art/neighborhoodMarketArt';
import {
  MARKET_ACTIVE_LIMIT,
  MARKET_FAVORITE_LIMIT,
  MARKET_PRICE_TIERS,
  NeighborhoodMarketStore,
  marketPrice,
  sampleMarketListings,
  type MarketListing,
  type MarketPriceTier,
  type MarketSummary,
  type NeighborhoodMarketProgress,
} from '../game/social/neighborhoodMarket';
import type { MarketActionResult } from '../db/neighborhoodMarketApi';
import { itemEmoji } from './bagPanel';

type MarketTab = 'browse' | 'sell' | 'collection';
type MarketCategory = ItemCategory | 'all' | 'favorites';

const EMPTY_SUMMARY: MarketSummary = { listingsCreated: 0, purchases: 0, sales: 0, uniqueItemIds: [], categories: [] };
const CATEGORY_ORDER: MarketCategory[] = ['all', 'favorites', 'furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];
const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class NeighborhoodMarketPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private tab: MarketTab = 'browse';
  private category: MarketCategory = 'all';
  private listings: MarketListing[] = [];
  private summary: MarketSummary = EMPTY_SUMMARY;
  private selectedItemId: string | null = null;
  private selectedTier: MarketPriceTier = 'fair';
  private pendingCreate = false;
  private pendingBuyId: string | null = null;
  private loading = false;
  private acting = false;
  private status = '';

  constructor(private readonly store: NeighborhoodMarketStore, private readonly opts: {
    userId: string;
    online: boolean;
    onToggle: (open: boolean) => void;
    getInventory: () => Map<string, number>;
    getCoins: () => number;
    loadListings?: () => Promise<MarketListing[]>;
    loadSummary?: () => Promise<MarketSummary>;
    createListing?: (itemId: string, tier: MarketPriceTier) => Promise<MarketActionResult>;
    cancelListing?: (listingId: string) => Promise<MarketActionResult>;
    buyListing?: (listingId: string) => Promise<MarketActionResult>;
    onChanged?: (progress: NeighborhoodMarketProgress, result?: MarketActionResult) => void;
    previewForItem?: (itemId: string) => string | null;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-neighborhood-market';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }
  progress(): NeighborhoodMarketProgress { return this.store.progress(this.summary); }

  open(tab: MarketTab = 'browse'): void {
    if (!this.opened) {
      this.opened = true;
      this.root.style.display = 'flex';
      this.store.visit();
      this.opts.onToggle(true);
    }
    this.tab = tab;
    this.status = '';
    this.pendingCreate = false;
    this.pendingBuyId = null;
    this.listings = this.opts.online ? this.listings : sampleMarketListings(this.opts.userId);
    this.render();
    void this.reload();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.close(); this.root.remove(); }

  private async reload(result?: MarketActionResult): Promise<void> {
    if (!this.opts.online) {
      this.listings = sampleMarketListings(this.opts.userId);
      this.summary = EMPTY_SUMMARY;
      this.opts.onChanged?.(this.progress(), result);
      if (this.opened) this.render();
      return;
    }
    this.loading = true;
    if (this.opened) this.render();
    const [listings, summary] = await Promise.all([
      this.opts.loadListings?.() ?? Promise.resolve([]),
      this.opts.loadSummary?.() ?? Promise.resolve(EMPTY_SUMMARY),
    ]);
    this.listings = listings;
    this.summary = summary;
    this.loading = false;
    this.opts.onChanged?.(this.progress(), result);
    if (this.opened) this.render();
  }

  private preview(item: ItemDef, className: string): string {
    const source = this.opts.previewForItem?.(item.id);
    return source
      ? `<img class="${className}" src="${escapeHtml(source)}" alt="" aria-hidden="true">`
      : `<i class="${className}" style="--item-color:#${item.color}">${itemEmoji(item)}</i>`;
  }

  private browseHtml(): string {
    const favoriteIds = this.store.get().favoriteItemIds;
    const rows = this.listings.filter((listing) => {
      const item = CATALOG_BY_ID.get(listing.itemId);
      if (!item) return false;
      if (this.category === 'favorites') return favoriteIds.includes(item.id);
      return this.category === 'all' || item.category === this.category;
    });
    const cards = rows.map((listing) => {
      const item = CATALOG_BY_ID.get(listing.itemId)!;
      const tier = MARKET_PRICE_TIERS.find((candidate) => candidate.id === listing.priceTier)!;
      const favorite = favoriteIds.includes(item.id);
      const pending = this.pendingBuyId === listing.id;
      const canAfford = this.opts.getCoins() >= listing.price;
      return `<article class="market-listing ${listing.mine ? 'is-mine' : ''} ${favorite ? 'is-favorite' : ''}" style="--item-color:#${item.color}">
        <header>${this.preview(item, 'market-item-art')}<button data-market-favorite="${item.id}" aria-label="${favorite ? '찜 해제' : '찜하기'}">${favorite ? '♥' : '♡'}</button></header>
        <div><small>${CATEGORY_LABEL[item.category]} · ${tier.mark} ${tier.name}</small><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(listing.sellerName)}님의 한 점</p></div>
        <footer><span><b>${listing.price.toLocaleString()}</b> C<i>정가 ${item.price.toLocaleString()} C</i></span>${listing.mine
          ? `<button data-market-cancel="${listing.id}">판매 취소</button>`
          : pending
            ? `<nav><button data-market-buy-cancel>그대로 둘게요</button><button data-market-buy-confirm="${listing.id}" ${!this.opts.online || !canAfford ? 'disabled' : ''}>${canAfford ? '구매 확정' : '코인 부족'}</button></nav>`
            : `<button data-market-buy="${listing.id}" ${!this.opts.online ? 'disabled' : ''}>${this.opts.online ? '한 번 더 확인' : '접속 후 교환'}</button>`}</footer>
      </article>`;
    }).join('');
    return `<section class="market-browse">
      <nav class="market-categories">${CATEGORY_ORDER.map((category) => `<button data-market-category="${category}" class="${category === this.category ? 'selected' : ''}">${category === 'all' ? '전체' : category === 'favorites' ? `찜 ${favoriteIds.length}` : CATEGORY_LABEL[category]}</button>`).join('')}</nav>
      <div class="market-listing-grid">${cards || `<div class="market-empty"><b>${this.category === 'favorites' ? '아직 찜한 한 점이 없어요' : '이 선반은 잠시 비어 있어요'}</b><p>가격이나 인기 순위 때문에 서두를 필요가 없어요. 다른 분류를 천천히 둘러보세요.</p></div>`}</div>
    </section>`;
  }

  private sellHtml(): string {
    const counts = this.opts.getInventory();
    const owned = [...counts.entries()].flatMap(([id, qty]) => {
      const item = CATALOG_BY_ID.get(id);
      return item && qty > 0 ? [{ item, qty }] : [];
    }).sort((a, b) => a.item.name.localeCompare(b.item.name, 'ko'));
    const selected = this.selectedItemId ? CATALOG_BY_ID.get(this.selectedItemId) : null;
    const myActive = this.listings.filter((listing) => listing.mine).length;
    const itemCards = owned.map(({ item, qty }) => `<button data-market-item="${item.id}" class="${item.id === selected?.id ? 'selected' : ''}">
      ${this.preview(item, 'market-sell-art')}<span><b>${escapeHtml(item.name)}</b><small>${CATEGORY_LABEL[item.category]} · 보유 ${qty}</small></span>
    </button>`).join('');
    const tierCards = MARKET_PRICE_TIERS.map((tier) => `<button data-market-tier="${tier.id}" class="${tier.id === this.selectedTier ? 'selected' : ''}">
      <i>${tier.mark}</i><span><b>${tier.name}${selected ? ` · ${marketPrice(selected, tier.id).toLocaleString()} C` : ''}</b><small>${tier.description}</small></span>
    </button>`).join('');
    return `<section class="market-sell">
      <header><div><small>SAFE ESCROW SHELF</small><h2>내 한 점 내놓기</h2><p>판매 중에는 서버 보관함에 한 점을 안전하게 맡겨요. 취소하면 즉시 소지품으로 돌아옵니다.</p></div><strong>${myActive}<i>/${MARKET_ACTIVE_LIMIT}</i></strong></header>
      <div class="market-sell-layout"><section><header><b>1. 소지품에서 한 점</b><span>배치 중인 가구는 보이지 않아요.</span></header><div class="market-owned-grid">${itemCards || '<div class="market-empty"><b>내놓을 소지품이 없어요</b><p>방에 놓은 물건은 자동으로 보호됩니다. 회수한 뒤 다시 확인해 주세요.</p></div>'}</div></section>
        <section><header><b>2. 세 가격 중 하나</b><span>임의 가격·흥정·자유문구 없음</span></header><div class="market-tier-grid">${tierCards}</div>
          <aside class="market-create-summary">${selected ? `${this.preview(selected, 'market-create-art')}<div><small>장터에 맡길 한 점</small><b>${escapeHtml(selected.name)}</b><span>${MARKET_PRICE_TIERS.find((tier) => tier.id === this.selectedTier)!.name} · ${marketPrice(selected, this.selectedTier).toLocaleString()} C</span></div>` : '<div><small>먼저 물건을 골라 주세요</small><b>선택 전에는 아무것도 이동하지 않아요.</b></div>'}
            <button data-market-create ${!selected || !this.opts.online || myActive >= MARKET_ACTIVE_LIMIT ? 'disabled' : ''}>${!this.opts.online ? '접속 후 등록' : myActive >= MARKET_ACTIVE_LIMIT ? '판매 선반 6칸이 찼어요' : this.pendingCreate ? '이 조건으로 등록 확정' : '한 번 더 확인'}</button>
          </aside>
        </section></div>
    </section>`;
  }

  private collectionHtml(): string {
    const progress = this.progress();
    const favoriteIds = this.store.get().favoriteItemIds;
    const favorites = favoriteIds.map((id) => CATALOG_BY_ID.get(id)).filter((item): item is ItemDef => !!item);
    const favoriteCards = favorites.map((item) => `<button data-market-favorite="${item.id}" style="--item-color:#${item.color}">
      ${this.preview(item, 'market-favorite-art')}<span><b>${escapeHtml(item.name)}</b><small>${CATEGORY_LABEL[item.category]} · 눌러서 찜 해제</small></span>
    </button>`).join('');
    return `<section class="market-collection">
      <header><div><small>MY NEIGHBORHOOD EXCHANGE LOG</small><h2>나의 장터 수첩</h2><p>거래가 끝나도 만난 물건과 분류 기록은 영구 집계됩니다. 찜을 바꿔도 실제 소지품과 거래 이력은 그대로예요.</p></div><strong>${progress.exchanges}<i>번 교환</i></strong></header>
      <div class="market-ledger-grid">
        <article><i>문</i><span><small>장터 방문</small><b>${progress.visits}</b></span></article>
        <article><i>내</i><span><small>내놓은 한 점</small><b>${progress.listingsCreated}</b></span></article>
        <article><i>들</i><span><small>새로 들인 한 점</small><b>${progress.purchases}</b></span></article>
        <article><i>잇</i><span><small>이웃에게 간 한 점</small><b>${progress.sales}</b></span></article>
        <article><i>종</i><span><small>교환 물건 도감</small><b>${progress.uniqueItems}<em>/10</em></b></span></article>
        <article><i>분</i><span><small>교환 분류 도감</small><b>${progress.categoryKinds}<em>/6</em></b></span></article>
      </div>
      <section class="market-favorite-shelf"><header><div><small>EIGHT FAVORITE FINDS</small><h3>마음에 둔 여덟 한 점</h3></div><span>${favoriteIds.length}/${MARKET_FAVORITE_LIMIT} · 찜은 예약이나 선점이 아니에요.</span></header><div>${favoriteCards || '<div class="market-empty"><b>비어 있는 찜 선반</b><p>장터 카드의 빈 하트를 눌러 나중에 다시 보고 싶은 물건을 담아 보세요.</p></div>'}</div></section>
      ${this.opts.online ? '' : '<p class="market-offline-note">오프라인 둘러보기에서는 샘플 이웃 진열과 찜 수첩만 사용합니다. 실제 코인·소지품·거래 기록은 바뀌지 않아요.</p>'}
    </section>`;
  }

  private render(): void {
    const progress = this.progress();
    const content = this.tab === 'browse' ? this.browseHtml() : this.tab === 'sell' ? this.sellHtml() : this.collectionHtml();
    this.root.innerHTML = `<div class="market-shell" aria-busy="${this.loading || this.acting}">
      <header class="market-header"><canvas width="280" height="112" aria-label="골목 나눔장터 픽셀 야시장"></canvas><div><small>SAFE NEIGHBORHOOD EXCHANGE</small><h1>골목 나눔장터</h1><p>임의 가격·흥정·자유문구 없이, 쓰지 않는 한 점이 다른 이웃의 방에서 새 장면이 됩니다.</p><nav><button data-market-tab="browse" class="${this.tab === 'browse' ? 'selected' : ''}">이웃 선반</button><button data-market-tab="sell" class="${this.tab === 'sell' ? 'selected' : ''}">내 한 점</button><button data-market-tab="collection" class="${this.tab === 'collection' ? 'selected' : ''}">장터 수첩</button></nav></div><aside><span>내 코인<b>${this.opts.getCoins().toLocaleString()} C</b></span><span>교환 기록<b>${progress.exchanges}</b></span><button class="market-close">닫기</button></aside></header>
      ${this.status ? `<p class="market-status" role="status">${escapeHtml(this.status)}</p>` : ''}
      ${this.loading ? '<div class="market-loading">이웃 선반을 안전하게 다시 확인하는 중…</div>' : content}
      <footer class="market-footer"><span>판매 취소 무료 · 만료 없음 · 서버 보관함 · 원자 정산</span><b>${this.opts.online ? 'ONLINE SAFE TRADE' : 'OFFLINE READ-ONLY PREVIEW'}</b></footer>
    </div>`;
    const canvas = this.root.querySelector<HTMLCanvasElement>('canvas');
    if (canvas) paintNeighborhoodMarketArt(canvas, this.listings, this.store.get().favoriteItemIds);
    this.bind();
  }

  private bind(): void {
    this.root.querySelector<HTMLButtonElement>('.market-close')?.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-tab]').forEach((button) => button.addEventListener('click', () => {
      this.tab = button.dataset.marketTab as MarketTab;
      this.pendingBuyId = null; this.pendingCreate = false; this.status = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-category]').forEach((button) => button.addEventListener('click', () => {
      this.category = button.dataset.marketCategory as MarketCategory;
      if (this.category !== 'all' && this.category !== 'favorites') this.store.viewCategory(this.category);
      this.pendingBuyId = null; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-favorite]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.toggleFavorite(button.dataset.marketFavorite!);
      this.status = result === 'added' ? '찜 선반에 담았어요. 예약이나 선점은 아니며 언제든 바꿀 수 있어요.'
        : result === 'removed' ? '찜에서만 내렸어요. 수집과 거래 기록은 그대로예요.'
          : '찜 선반은 여덟 칸이에요. 한 점을 내린 뒤 다시 담아 주세요.';
      this.opts.onChanged?.(this.progress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-buy]').forEach((button) => button.addEventListener('click', () => {
      this.pendingBuyId = button.dataset.marketBuy!;
      this.status = '코인과 물건 이름을 한 번 더 확인해 주세요. 아직 구매되지 않았어요.';
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-market-buy-cancel]')?.addEventListener('click', () => {
      this.pendingBuyId = null; this.status = '구매를 취소했어요. 코인과 소지품은 그대로예요.'; this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-buy-confirm]').forEach((button) => button.addEventListener('click', async () => {
      if (this.acting) return;
      const listingId = button.dataset.marketBuyConfirm!;
      this.acting = true;
      this.status = '코인과 서버 보관함을 함께 확인하는 중이에요…';
      this.render();
      const result = await (this.opts.buyListing?.(listingId) ?? Promise.resolve({ ok: false, reason: 'error' } as MarketActionResult));
      this.acting = false;
      this.pendingBuyId = null;
      this.status = result.ok ? `${CATALOG_BY_ID.get(result.itemId ?? '')?.name ?? '새 한 점'}을(를) 안전하게 들였어요. 발견 기록도 남았습니다.`
        : result.reason === 'no-coins' ? '코인이 조금 부족해요. 아무것도 차감되지 않았습니다.'
          : result.reason === 'settled' ? '다른 이웃이 조금 먼저 데려갔어요. 찜과 기록은 그대로예요.'
            : result.reason === 'self' ? '내 판매품은 구매 대신 무료로 취소해 되돌릴 수 있어요.'
              : '거래를 확인하지 못했어요. 코인과 소지품은 그대로입니다.';
      await this.reload(result);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-cancel]').forEach((button) => button.addEventListener('click', async () => {
      if (this.acting) return;
      const listingId = button.dataset.marketCancel!;
      this.acting = true;
      this.status = '서버 보관함에서 소지품으로 되돌리는 중이에요…';
      this.render();
      const result = await (this.opts.cancelListing?.(listingId) ?? Promise.resolve({ ok: false, reason: 'error' } as MarketActionResult));
      this.acting = false;
      this.status = result.ok ? `${CATALOG_BY_ID.get(result.itemId ?? '')?.name ?? '맡긴 한 점'}이(가) 소지품으로 돌아왔어요.`
        : result.reason === 'settled' ? '이미 거래가 끝난 판매 카드예요. 새로고침해 기록을 확인해 주세요.'
          : '판매 취소를 확인하지 못했어요. 맡긴 물건은 서버 보관함에 안전하게 남아 있습니다.';
      await this.reload(result);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-item]').forEach((button) => button.addEventListener('click', () => {
      this.selectedItemId = button.dataset.marketItem!;
      this.pendingCreate = false; this.status = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-market-tier]').forEach((button) => button.addEventListener('click', () => {
      this.selectedTier = button.dataset.marketTier as MarketPriceTier;
      this.pendingCreate = false; this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-market-create]')?.addEventListener('click', async () => {
      if (!this.selectedItemId) return;
      if (!this.pendingCreate) {
        this.pendingCreate = true;
        this.status = '선택한 한 점과 고정 가격을 확인해 주세요. 아직 소지품에서 이동하지 않았어요.';
        this.render();
        return;
      }
      if (this.acting) return;
      const itemId = this.selectedItemId;
      this.acting = true;
      this.status = '고정 가격과 소지품을 확인해 안전 선반에 맡기는 중이에요…';
      this.render();
      const result = await (this.opts.createListing?.(itemId, this.selectedTier) ?? Promise.resolve({ ok: false, reason: 'error' } as MarketActionResult));
      this.acting = false;
      this.pendingCreate = false;
      if (result.ok) this.selectedItemId = null;
      this.status = result.ok ? `${CATALOG_BY_ID.get(itemId)?.name ?? '한 점'}을(를) 서버 보관함에 맡겼어요. 판매 전에는 언제든 무료로 취소할 수 있어요.`
        : result.reason === 'no-stock' ? '소지품 수량이 달라졌어요. 물건은 이동하지 않았습니다.'
          : result.reason === 'limit' ? '판매 선반 여섯 칸이 찼어요. 한 장을 취소하거나 거래를 기다려 주세요.'
            : '등록을 확인하지 못했어요. 소지품은 그대로입니다.';
      await this.reload(result);
    });
  }
}
