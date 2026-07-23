import { describe, expect, it } from 'vitest';
import migration from '../supabase/migrations/0018_furniture_workshop.sql?raw';
import { CATALOG, CATALOG_BY_ID } from '../src/items/catalog';
import {
  FURNITURE_RECIPES,
  furnitureAcquisitionChannel,
  furnitureAcquisitionRoute,
  furnitureCraftView,
  furnitureRotationSlot,
  nextFurnitureRotationAt,
  standardFurnitureItems,
  weeklyFurniturePicks,
} from '../src/game/home/furnitureWorkshop';

describe('살림 쇼룸 주간 큐레이션과 DIY 작업대', () => {
  it('65종을 기본 37·주간 16·DIY 12종으로 중복 없이 나눈다', () => {
    const groups = new Map<string, string[]>();
    for (const item of CATALOG) {
      const channel = furnitureAcquisitionChannel(item.id);
      groups.set(channel, [...(groups.get(channel) ?? []), item.id]);
    }
    expect(groups.get('standard')).toHaveLength(37);
    expect(groups.get('weekly')).toHaveLength(16);
    expect(groups.get('diy')).toHaveLength(12);
    expect(standardFurnitureItems()).toHaveLength(37);
  });

  it('매주 정확히 4종이 열리고 KST 월요일 자정에 다음 슬롯으로 넘어간다', () => {
    const sunday = new Date('2026-07-19T14:59:59.000Z');
    const monday = new Date('2026-07-19T15:00:00.000Z');
    expect(furnitureRotationSlot(monday)).toBe((furnitureRotationSlot(sunday) + 1) % 4);
    expect(weeklyFurniturePicks(sunday).filter((pick) => pick.available)).toHaveLength(4);
    expect(weeklyFurniturePicks(monday).filter((pick) => pick.available)).toHaveLength(4);
    expect(nextFurnitureRotationAt(sunday).toISOString()).toBe('2026-07-19T15:00:00.000Z');
  });

  it('모든 레시피의 결과와 재료가 실제 카탈로그이며 결과가 겹치지 않는다', () => {
    expect(new Set(FURNITURE_RECIPES.map((recipe) => recipe.outputItemId)).size).toBe(FURNITURE_RECIPES.length);
    for (const recipe of FURNITURE_RECIPES) {
      expect(CATALOG_BY_ID.has(recipe.outputItemId), recipe.id).toBe(true);
      expect(furnitureAcquisitionChannel(recipe.outputItemId), recipe.id).toBe('diy');
      for (const ingredient of recipe.ingredients) expect(CATALOG_BY_ID.has(ingredient.itemId), `${recipe.id}/${ingredient.itemId}`).toBe(true);
    }
  });

  it('재료와 공임을 각각 설명하고 둘 다 갖췄을 때만 제작할 수 있다', () => {
    const recipe = FURNITURE_RECIPES.find((candidate) => candidate.id === 'wide_story_shelf')!;
    const missing = furnitureCraftView(recipe, new Map([['bookshelf', 1], ['book_pile', 1]]), 500);
    expect(missing).toMatchObject({ enoughMaterials: false, enoughCoins: true, ready: false });
    expect(missing.ingredients.find((ingredient) => ingredient.itemId === 'bookshelf')).toMatchObject({ owned: 1, qty: 2, ready: false });
    const ready = furnitureCraftView(recipe, new Map([['bookshelf', 2], ['book_pile', 1]]), recipe.fee);
    expect(ready).toMatchObject({ enoughMaterials: true, enoughCoins: true, ready: true });
  });

  it('도감 획득 경로가 기본·이번 주·대기 주차·DIY를 정확히 구분한다', () => {
    const date = new Date('2026-07-23T03:00:00.000Z');
    expect(furnitureAcquisitionRoute('tea_table', date)).toContain('기본 진열');
    expect(furnitureAcquisitionRoute('bed_green', date)).toContain('DIY 작업대');
    const picks = weeklyFurniturePicks(date);
    expect(furnitureAcquisitionRoute(picks.find((pick) => pick.available)!.item.id, date)).toContain('이번 주 큐레이션');
    expect(furnitureAcquisitionRoute(picks.find((pick) => !pick.available)!.item.id, date)).toMatch(/\d주 뒤 등장/);
  });

  it('클라이언트의 4주 슬롯·레시피·재료가 서버 마이그레이션과 한 글자도 어긋나지 않는다', () => {
    for (const pick of weeklyFurniturePicks(new Date('2026-07-23T03:00:00.000Z'))) {
      expect(migration, pick.item.id).toContain(`('${pick.item.id}','weekly',${pick.slot})`);
    }
    for (const recipe of FURNITURE_RECIPES) {
      expect(migration, recipe.id).toContain(`('${recipe.id}','${recipe.outputItemId}',${recipe.fee})`);
      for (const ingredient of recipe.ingredients) {
        expect(migration, `${recipe.id}/${ingredient.itemId}`).toContain(`('${recipe.id}','${ingredient.itemId}',${ingredient.qty})`);
      }
    }
  });

  it('서버가 동시 제작을 잠그고 DIY·비활성 주간 구매를 거부하며 이력을 본인에게만 공개한다', () => {
    expect(migration).toContain("if acquisition = 'diy' then return -5");
    expect(migration).toContain("if acquisition = 'weekly' and item_slot <> current_slot then return -6");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain('auth.uid() = user_id');
    expect(migration).toContain('revoke insert, update, delete on public.furniture_craft_history from authenticated');
  });
});
