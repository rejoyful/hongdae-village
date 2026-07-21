import raw from './catalog.json';

export interface ItemDef {
  id: string;
  name: string;
  category: 'furniture' | 'deco';
  w: number; // 타일 폭 (rot 0 기준)
  h: number; // 타일 높이
  color: string; // placeholder hex (# 제외) — Phase 5에서 스프라이트 키로 대체
}

/** 카탈로그 무결성 검증 — 아이템 추가 시 실수를 테스트에서 잡는다 (스펙 §3 데이터 주도) */
export function validateCatalog(items: unknown[]): items is ItemDef[] {
  const seen = new Set<string>();
  for (const it of items) {
    const o = it as Partial<ItemDef>;
    if (!o.id || seen.has(o.id)) return false;
    seen.add(o.id);
    if (!o.name || (o.category !== 'furniture' && o.category !== 'deco')) return false;
    if (!Number.isInteger(o.w) || !Number.isInteger(o.h) || o.w! < 1 || o.h! < 1) return false;
    if (typeof o.color !== 'string' || !/^[0-9a-f]{6}$/.test(o.color)) return false;
  }
  return true;
}

if (!validateCatalog(raw)) throw new Error('items/catalog.json 무결성 위반');
export const CATALOG: ItemDef[] = raw;
export const CATALOG_BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

/** 시작 인벤토리 (입주 시 1회 지급) */
export const STARTER_ITEMS: Array<{ itemId: string; qty: number }> = [
  { itemId: 'bed_basic', qty: 1 }, { itemId: 'desk_wood', qty: 1 },
  { itemId: 'chair_wood', qty: 2 }, { itemId: 'rug_cream', qty: 1 },
  { itemId: 'plant_pot', qty: 2 }, { itemId: 'lamp_stand', qty: 1 },
  { itemId: 'cushion', qty: 2 },
];
