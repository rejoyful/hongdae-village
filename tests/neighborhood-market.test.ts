import { describe, expect, it } from 'vitest';
import { CATALOG_BY_ID } from '../src/items/catalog';
import {
  MARKET_ACTIVE_LIMIT,
  MARKET_FAVORITE_LIMIT,
  MARKET_PRICE_TIERS,
  NeighborhoodMarketStore,
  marketPrice,
  marketProgress,
  normalizeMarketState,
  normalizeMarketSummary,
  sampleMarketListings,
} from '../src/game/social/neighborhoodMarket';
import { NEIGHBORHOOD_MARKET_QUESTS } from '../src/game/quests';

describe('골목 나눔장터 도메인', () => {
  it('세 가격은 정가 아래의 고정 비율이고 사용자가 임의 가격을 만들 수 없다', () => {
    const item = CATALOG_BY_ID.get('turntable')!;
    expect(MARKET_PRICE_TIERS.map((tier) => marketPrice(item, tier.id))).toEqual([150, 230, 305]);
    expect(MARKET_PRICE_TIERS.map((tier) => tier.ratio)).toEqual([0.4, 0.6, 0.8]);
  });

  it('오염된 로컬 수첩과 서버 요약을 안전하게 정규화한다', () => {
    expect(normalizeMarketState({
      visits: 3.9,
      favoriteItemIds: ['turntable', 'turntable', 'hacked'],
      viewedCategories: ['deco', 'deco', 'wrong'],
    })).toEqual({
      version: 1, visits: 3, favoriteItemIds: ['turntable'], viewedCategories: ['deco'],
    });
    expect(normalizeMarketSummary({
      listingsCreated: 2.9, purchases: -5, sales: 4,
      uniqueItemIds: ['cactus', 'hacked'], categories: ['plant', 'wrong'],
    })).toEqual({
      listingsCreated: 2, purchases: 0, sales: 4, uniqueItemIds: ['cactus'], categories: ['plant'],
    });
  });

  it('찜은 최대 여덟 칸이고 제거해도 서버 거래 기록과 무관하다', () => {
    const items = [...CATALOG_BY_ID.keys()].slice(0, MARKET_FAVORITE_LIMIT + 1);
    const store = new NeighborhoodMarketStore('market-test', { visits: 0 });
    for (const id of items.slice(0, MARKET_FAVORITE_LIMIT)) expect(store.toggleFavorite(id)).toBe('added');
    expect(store.toggleFavorite(items[MARKET_FAVORITE_LIMIT]!)).toBe('full');
    expect(store.toggleFavorite(items[0]!)).toBe('removed');
    expect(store.get().favoriteItemIds).toHaveLength(MARKET_FAVORITE_LIMIT - 1);
  });

  it('방문·찜·매입·판매·교환 도감을 하나의 친절한 진행도로 합친다', () => {
    const progress = marketProgress(normalizeMarketState({
      visits: 5, favoriteItemIds: ['cactus', 'turntable'], viewedCategories: ['plant'],
    }), normalizeMarketSummary({
      listingsCreated: 3, purchases: 4, sales: 2,
      uniqueItemIds: ['cactus', 'turntable', 'poster_film'], categories: ['plant', 'electronics', 'wall'],
    }));
    expect(progress).toMatchObject({
      visits: 5, favorites: 2, listingsCreated: 3, purchases: 4, sales: 2,
      exchanges: 6, uniqueItems: 3, categoryKinds: 3,
    });
  });

  it('오프라인 진열도 실제 카탈로그와 고정 가격 규칙만 사용한다', () => {
    const listings = sampleMarketListings('guest');
    expect(listings).toHaveLength(6);
    for (const listing of listings) {
      const item = CATALOG_BY_ID.get(listing.itemId)!;
      expect(listing.price).toBe(marketPrice(item, listing.priceTier));
      expect(listing.mine).toBe(false);
    }
  });

  it('활성 판매는 사용자당 여섯 장, 찜 수첩은 여덟 칸으로 분리한다', () => {
    expect(MARKET_ACTIVE_LIMIT).toBe(6);
    expect(MARKET_FAVORITE_LIMIT).toBe(8);
  });

  it('방문·찜·판매·구매·분류·물건·장기 교환을 여덟 퀘스트로 잇는다', () => {
    expect(NEIGHBORHOOD_MARKET_QUESTS).toHaveLength(8);
    expect(new Set(NEIGHBORHOOD_MARKET_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'market_visits', 'market_favorites', 'market_listings_created', 'market_purchases',
      'market_sales', 'market_categories', 'market_unique_items', 'market_exchanges',
    ]));
  });
});
