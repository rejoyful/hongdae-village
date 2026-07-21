import raw from './catalog.json';

export type ItemCategory = 'furniture' | 'electronics' | 'plant' | 'deco' | 'rug' | 'wall';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  arch: string;   // 픽셀아트 아키타입 (roomArt 드로어 선택)
  w: number;      // 타일 폭 (rot 0 기준)
  h: number;      // 타일 높이
  color: string;  // 기본색 hex (# 제외)
  accent?: string; // 포인트색 hex
  price: number;  // 상점 가격 (코인) — DB item_prices와 0004 마이그레이션으로 동기
}

const CATEGORIES: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];
export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  furniture: '가구', electronics: '가전', plant: '식물', deco: '소품', rug: '러그', wall: '벽장식',
};

const HEX = /^[0-9a-f]{6}$/;

/** 카탈로그 무결성 검증 — 아이템 추가 시 실수를 테스트에서 잡는다 (스펙 §3 데이터 주도) */
export function validateCatalog(items: unknown[]): items is ItemDef[] {
  const seen = new Set<string>();
  for (const it of items) {
    const o = it as Partial<ItemDef>;
    if (!o.id || seen.has(o.id)) return false;
    seen.add(o.id);
    if (!o.name || !o.arch || !CATEGORIES.includes(o.category as ItemCategory)) return false;
    if (!Number.isInteger(o.w) || !Number.isInteger(o.h) || o.w! < 1 || o.h! < 1) return false;
    if (typeof o.color !== 'string' || !HEX.test(o.color)) return false;
    if (o.accent !== undefined && !HEX.test(o.accent)) return false;
    if (o.category === 'wall' && o.h !== 1) return false; // 벽걸이는 1타일 높이
    if (!Number.isInteger(o.price) || o.price! <= 0) return false;
  }
  return true;
}

if (!validateCatalog(raw)) throw new Error('items/catalog.json 무결성 위반');
export const CATALOG: ItemDef[] = raw as ItemDef[];
export const CATALOG_BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

/**
 * 시작 인벤토리 — 첫 입주 웰컴 박스.
 * grantStarterOnce가 "없는 아이템만" upsert하므로 목록을 늘리면 기존 유저도 다음 접속에 받는다.
 */
export const STARTER_ITEMS: Array<{ itemId: string; qty: number }> = [
  { itemId: 'bed_basic', qty: 1 }, { itemId: 'desk_wood', qty: 1 },
  { itemId: 'chair_wood', qty: 2 }, { itemId: 'rug_cream', qty: 1 },
  { itemId: 'plant_pot', qty: 2 }, { itemId: 'lamp_stand', qty: 1 },
  { itemId: 'cushion', qty: 2 }, { itemId: 'sofa_single', qty: 1 },
  { itemId: 'tea_table', qty: 1 }, { itemId: 'bookshelf', qty: 1 },
  { itemId: 'poster_band', qty: 1 }, { itemId: 'wall_clock', qty: 1 },
  { itemId: 'moving_box', qty: 2 }, { itemId: 'book_pile', qty: 1 },
  { itemId: 'flower_vase', qty: 1 }, { itemId: 'bear_doll', qty: 1 },
];
