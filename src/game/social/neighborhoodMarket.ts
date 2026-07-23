import { CATALOG_BY_ID, type ItemCategory, type ItemDef } from '../../items/catalog';

export type MarketPriceTier = 'neighbor' | 'fair' | 'collector';

export interface MarketPriceTierDef {
  id: MarketPriceTier;
  mark: string;
  name: string;
  description: string;
  ratio: number;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  priceTier: MarketPriceTier;
  price: number;
  createdAt: string;
  mine: boolean;
}

export interface MarketSummary {
  listingsCreated: number;
  purchases: number;
  sales: number;
  uniqueItemIds: string[];
  categories: ItemCategory[];
}

export interface NeighborhoodMarketState {
  version: 1;
  visits: number;
  favoriteItemIds: string[];
  viewedCategories: ItemCategory[];
}

export interface NeighborhoodMarketProgress extends MarketSummary {
  visits: number;
  favorites: number;
  exchanges: number;
  uniqueItems: number;
  categoryKinds: number;
}

export const MARKET_ACTIVE_LIMIT = 6;
export const MARKET_FAVORITE_LIMIT = 8;

export const MARKET_PRICE_TIERS: readonly MarketPriceTierDef[] = [
  { id: 'neighbor', mark: '나', name: '이웃가', description: '정가의 40% · 먼저 발견한 이웃에게 가볍게', ratio: 0.4 },
  { id: 'fair', mark: '온', name: '포근가', description: '정가의 60% · 기본으로 권하는 균형 가격', ratio: 0.6 },
  { id: 'collector', mark: '소', name: '소장가', description: '정가의 80% · 오래 모은 한 점을 넘기는 가격', ratio: 0.8 },
] as const;

const CATEGORIES: readonly ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];
const EMPTY_SUMMARY: MarketSummary = { listingsCreated: 0, purchases: 0, sales: 0, uniqueItemIds: [], categories: [] };

const cleanIds = (value: unknown, limit: number): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && CATALOG_BY_ID.has(id)))].slice(0, limit);
};

const cleanCategories = (value: unknown): ItemCategory[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((category): category is ItemCategory => (
    typeof category === 'string' && CATEGORIES.includes(category as ItemCategory)
  )))];
};

export function marketPrice(item: ItemDef, tier: MarketPriceTier): number {
  const ratio = MARKET_PRICE_TIERS.find((candidate) => candidate.id === tier)?.ratio ?? 0.6;
  return Math.max(5, Math.round((item.price * ratio) / 5) * 5);
}

export function normalizeMarketState(value: unknown): NeighborhoodMarketState {
  const raw = value && typeof value === 'object' ? value as Partial<NeighborhoodMarketState> : {};
  return {
    version: 1,
    visits: typeof raw.visits === 'number' && Number.isFinite(raw.visits) ? Math.max(0, Math.floor(raw.visits)) : 0,
    favoriteItemIds: cleanIds(raw.favoriteItemIds, MARKET_FAVORITE_LIMIT),
    viewedCategories: cleanCategories(raw.viewedCategories),
  };
}

export function normalizeMarketSummary(value: unknown): MarketSummary {
  const raw = value && typeof value === 'object' ? value as Partial<MarketSummary> : {};
  const count = (candidate: unknown): number => (
    typeof candidate === 'number' && Number.isFinite(candidate) ? Math.max(0, Math.floor(candidate)) : 0
  );
  return {
    listingsCreated: count(raw.listingsCreated),
    purchases: count(raw.purchases),
    sales: count(raw.sales),
    uniqueItemIds: cleanIds(raw.uniqueItemIds, CATALOG_BY_ID.size),
    categories: cleanCategories(raw.categories),
  };
}

export function marketProgress(
  state: NeighborhoodMarketState,
  summary: MarketSummary = EMPTY_SUMMARY,
): NeighborhoodMarketProgress {
  const safe = normalizeMarketSummary(summary);
  return {
    ...safe,
    visits: state.visits,
    favorites: state.favoriteItemIds.length,
    exchanges: safe.purchases + safe.sales,
    uniqueItems: safe.uniqueItemIds.length,
    categoryKinds: safe.categories.length,
  };
}

const storageKey = (userId: string): string => `hv-neighborhood-market-${userId}`;

/** 서버 경제와 분리된 장터 취향 수첩. 방문·찜은 실패하거나 거래를 취소해도 사라지지 않는다. */
export class NeighborhoodMarketStore {
  private state: NeighborhoodMarketState;

  constructor(private readonly userId: string, initial?: unknown) {
    let source = initial;
    if (source === undefined) {
      try { source = JSON.parse(localStorage.getItem(storageKey(userId)) ?? 'null'); } catch { source = null; }
    }
    this.state = normalizeMarketState(source);
  }

  get(): NeighborhoodMarketState {
    return {
      ...this.state,
      favoriteItemIds: [...this.state.favoriteItemIds],
      viewedCategories: [...this.state.viewedCategories],
    };
  }

  visit(): NeighborhoodMarketState {
    this.state.visits += 1;
    this.persist();
    return this.get();
  }

  viewCategory(category: ItemCategory): NeighborhoodMarketState {
    if (!this.state.viewedCategories.includes(category)) this.state.viewedCategories.push(category);
    this.persist();
    return this.get();
  }

  toggleFavorite(itemId: string): 'added' | 'removed' | 'full' | 'unknown' {
    if (!CATALOG_BY_ID.has(itemId)) return 'unknown';
    const index = this.state.favoriteItemIds.indexOf(itemId);
    if (index >= 0) {
      this.state.favoriteItemIds.splice(index, 1);
      this.persist();
      return 'removed';
    }
    if (this.state.favoriteItemIds.length >= MARKET_FAVORITE_LIMIT) return 'full';
    this.state.favoriteItemIds.push(itemId);
    this.persist();
    return 'added';
  }

  progress(summary?: MarketSummary): NeighborhoodMarketProgress {
    return marketProgress(this.state, summary);
  }

  private persist(): void {
    try { localStorage.setItem(storageKey(this.userId), JSON.stringify(this.state)); } catch { /* private mode */ }
  }
}

const SAMPLE_IDS = ['turntable', 'cactus', 'poster_film', 'chair_cushion', 'lamp_mood', 'bear_doll'] as const;

/** 오프라인에서도 장터의 규칙과 카드 밀도를 그대로 볼 수 있는 읽기 전용 이웃 진열. */
export function sampleMarketListings(_userId: string): MarketListing[] {
  return SAMPLE_IDS.flatMap((itemId, index) => {
    const item = CATALOG_BY_ID.get(itemId);
    if (!item) return [];
    const tier = MARKET_PRICE_TIERS[index % MARKET_PRICE_TIERS.length]!.id;
    return [{
      id: `sample-${itemId}`,
      sellerId: `sample-${index}`,
      sellerName: ['새벽별', '모퉁이', '초록창', '달콩', '필름결', '느린손'][index]!,
      itemId,
      priceTier: tier,
      price: marketPrice(item, tier),
      createdAt: new Date(2026, 0, index + 1).toISOString(),
      mine: false,
    }];
  });
}
