import type { SupabaseClient } from '@supabase/supabase-js';
import {
  normalizeMarketSummary,
  type MarketListing,
  type MarketPriceTier,
  type MarketSummary,
} from '../game/social/neighborhoodMarket';

type MarketFailureReason =
  | 'auth'
  | 'invalid-tier'
  | 'no-item'
  | 'limit'
  | 'no-stock'
  | 'unknown'
  | 'settled'
  | 'self'
  | 'no-coins'
  | 'error';

export type MarketActionResult = {
  ok: true;
  listingId?: string;
  itemId?: string;
  price?: number;
  balance?: number;
} | {
  ok: false;
  reason: MarketFailureReason;
};

const cleanText = (value: unknown): string | null => typeof value === 'string' && value.length > 0 ? value : null;
const cleanNumber = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined
);

export function normalizeMarketAction(value: unknown, failed = false): MarketActionResult {
  if (failed || !value || typeof value !== 'object') return { ok: false, reason: 'error' };
  const raw = value as Record<string, unknown>;
  if (raw.ok !== true) {
    const allowed: MarketFailureReason[] = [
      'auth', 'invalid-tier', 'no-item', 'limit', 'no-stock', 'unknown', 'settled', 'self', 'no-coins',
    ];
    const reason = cleanText(raw.reason) as MarketFailureReason | null;
    return { ok: false, reason: reason && allowed.includes(reason) ? reason : 'error' };
  }
  return {
    ok: true,
    ...(cleanText(raw.listing_id) ? { listingId: cleanText(raw.listing_id)! } : {}),
    ...(cleanText(raw.item_id) ? { itemId: cleanText(raw.item_id)! } : {}),
    ...(cleanNumber(raw.price) !== undefined ? { price: cleanNumber(raw.price) } : {}),
    ...(cleanNumber(raw.buyer_balance) !== undefined ? { balance: cleanNumber(raw.buyer_balance) } : {}),
  };
}

export async function fetchMarketListings(sb: SupabaseClient, userId: string): Promise<MarketListing[]> {
  const { data, error } = await sb.from('neighborhood_market_active')
    .select('id,seller_id,seller_name,item_id,price_tier,price,created_at')
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) return [];
  return (data ?? []).flatMap((row): MarketListing[] => {
    const id = cleanText(row.id);
    const sellerId = cleanText(row.seller_id);
    const sellerName = cleanText(row.seller_name);
    const itemId = cleanText(row.item_id);
    const tier = cleanText(row.price_tier);
    const createdAt = cleanText(row.created_at);
    const price = cleanNumber(row.price);
    if (!id || !sellerId || !sellerName || !itemId || !createdAt || price === undefined) return [];
    if (tier !== 'neighbor' && tier !== 'fair' && tier !== 'collector') return [];
    return [{
      id, sellerId, sellerName, itemId, priceTier: tier, price, createdAt, mine: sellerId === userId,
    }];
  });
}

export async function createMarketListing(
  sb: SupabaseClient,
  itemId: string,
  tier: MarketPriceTier,
): Promise<MarketActionResult> {
  const { data, error } = await sb.rpc('create_neighborhood_market_listing', {
    p_item_id: itemId, p_price_tier: tier,
  });
  return normalizeMarketAction(data, !!error);
}

export async function cancelMarketListing(
  sb: SupabaseClient,
  listingId: string,
): Promise<MarketActionResult> {
  const { data, error } = await sb.rpc('cancel_neighborhood_market_listing', { p_listing_id: listingId });
  return normalizeMarketAction(data, !!error);
}

export async function buyMarketListing(
  sb: SupabaseClient,
  listingId: string,
): Promise<MarketActionResult> {
  const { data, error } = await sb.rpc('buy_neighborhood_market_listing', { p_listing_id: listingId });
  return normalizeMarketAction(data, !!error);
}

export async function fetchMarketSummary(sb: SupabaseClient): Promise<MarketSummary> {
  const { data, error } = await sb.rpc('neighborhood_market_summary');
  if (error || !data || typeof data !== 'object') return normalizeMarketSummary(null);
  const raw = data as Record<string, unknown>;
  return normalizeMarketSummary({
    listingsCreated: raw.listings_created,
    purchases: raw.purchases,
    sales: raw.sales,
    uniqueItemIds: raw.unique_item_ids,
    categories: raw.categories,
  });
}
