import type { SupabaseClient } from '@supabase/supabase-js';
import { HOUSE_SPECS, type DealType, type HouseType } from '../game/realestate/realEstate';

export interface Property {
  id: number;
  houseType: HouseType;
  dealType: DealType | null;   // null = 공실
  holderId: string | null;     // 현재 세입자/소유자
  rentDue: number;             // 미납 월세
  floorSeed: number;
}

/** 매물 + 소유 상태 조회 (properties + rooms.owner_id 병합) */
export async function fetchProperties(sb: SupabaseClient): Promise<Property[]> {
  const [props, rooms] = await Promise.all([
    sb.from('properties').select('id,house_type,deal_type,rent_due,floor_seed').order('id'),
    sb.from('rooms').select('id,owner_id'),
  ]);
  if (props.error || !props.data) return [];
  const owner = new Map<number, string | null>();
  for (const r of rooms.data ?? []) owner.set(r.id as number, (r.owner_id as string | null) ?? null);
  return props.data.map((p) => ({
    id: p.id as number,
    houseType: p.house_type as HouseType,
    dealType: (p.deal_type as DealType | null) ?? null,
    holderId: owner.get(p.id as number) ?? null,
    rentDue: (p.rent_due as number | null) ?? 0,
    floorSeed: (p.floor_seed as number | null) ?? p.id as number,
  }));
}

export type LeaseResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'occupied' | 'no-coins' | 'bad' | 'offline' };

export async function leaseProperty(sb: SupabaseClient, id: number, deal: DealType): Promise<LeaseResult> {
  const { data, error } = await sb.rpc('lease_property', { p_id: id, p_deal: deal });
  if (error || typeof data !== 'number') return { ok: false, reason: 'bad' };
  if (data === -3) return { ok: false, reason: 'occupied' };
  if (data === -4) return { ok: false, reason: 'no-coins' };
  if (data < 0) return { ok: false, reason: 'bad' };
  return { ok: true, balance: data };
}

/** 방 입장·부동산 열람 시 월세 청구 (반환: 남은 미납액, 실패 시 null) */
export async function chargeRent(sb: SupabaseClient, id: number): Promise<number | null> {
  const { data, error } = await sb.rpc('charge_rent', { p_id: id });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}

export async function payRent(sb: SupabaseClient, id: number): Promise<number | null> {
  const { data, error } = await sb.rpc('pay_rent', { p_id: id });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}

export async function moveOut(sb: SupabaseClient, id: number): Promise<number | null> {
  const { data, error } = await sb.rpc('move_out', { p_id: id });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}

export async function sellProperty(sb: SupabaseClient, id: number): Promise<number | null> {
  const { data, error } = await sb.rpc('sell_property', { p_id: id });
  if (error || typeof data !== 'number' || data < 0) return null;
  return data;
}

/** 오프라인 매물 세트 — 지도 개인공간 문(1~10)에 유형 배정, 전부 공실(로컬 무료 체험) */
const OFFLINE_TYPES: HouseType[] = [
  'banjiha', 'oneroom', 'banjiha', 'oneroom', 'villa',
  'villa', 'apt', 'oneroom', 'villa', 'house',
];
export function offlineProperties(): Property[] {
  return OFFLINE_TYPES.map((t, i) => ({
    id: i + 1, houseType: t, dealType: null, holderId: null, rentDue: 0, floorSeed: 100 + i + 1,
  }));
}

/** 매물의 시세 요약 (패널 표시용) */
export function priceSummary(houseType: HouseType): {
  jeonse: number; wolseDeposit: number; monthlyRent: number; price: number;
} {
  const s = HOUSE_SPECS[houseType];
  return { jeonse: s.jeonseDeposit, wolseDeposit: s.wolseDeposit, monthlyRent: s.monthlyRent, price: s.price };
}
