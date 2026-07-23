import { beforeEach, describe, expect, it } from 'vitest';
import {
  COOKING_RECIPES, cookingPlateKey, cookingProgress, freshCookingState,
  normalizeCookingState, recordCook, toggleCookingFavorite,
} from '../src/game/cooking/cooking';
import { CookingStore } from '../src/game/cooking/cookingStore';
import { GARDEN_VARIANTS } from '../src/game/garden/garden';
import { GardenStore } from '../src/game/garden/gardenStore';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function harvestBasil(garden: GardenStore): void {
  expect(garden.plant(0, 'basil').ok).toBe(true);
  for (let step = 0; step < 3; step += 1) expect(garden.tend(0).ok).toBe(true);
  expect(garden.harvest(0).ok).toBe(true);
}

describe('모퉁이 골목 주방', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('12개 식물 메뉴와 세 성장 결로 36칸 플레이팅 도감을 만든다', () => {
    expect(COOKING_RECIPES).toHaveLength(12);
    expect(GARDEN_VARIANTS).toHaveLength(3);
    expect(new Set(COOKING_RECIPES.map((recipe) => recipe.id)).size).toBe(12);
    expect(cookingProgress(freshCookingState())).toMatchObject({ totalRecipes: 12, totalPlates: 36 });
  });

  it('첫 메뉴·첫 플레이팅과 반복 접시를 따로 집계한다', () => {
    const state = freshCookingState();
    expect(recordCook(state, 'basil', 'sun')).toMatchObject({ ok: true, firstRecipe: true, firstPlate: true, servings: 1 });
    expect(recordCook(state, 'basil', 'sun')).toMatchObject({ ok: true, firstRecipe: false, firstPlate: false, servings: 2 });
    expect(recordCook(state, 'basil', 'rain')).toMatchObject({ ok: true, firstRecipe: false, firstPlate: true, servings: 1 });
    expect(cookingProgress(state)).toMatchObject({ totalCooked: 3, recipesDiscovered: 1, platesDiscovered: 2 });
  });

  it('정원 수확물 한 개를 실제로 소비해 한 접시를 완성한다', () => {
    const garden = new GardenStore('cook-loop');
    const cooking = new CookingStore('cook-loop');
    harvestBasil(garden);
    expect(garden.ingredientCount(cookingPlateKey('basil', 'sun'))).toBe(1);
    expect(cooking.cook('basil', 'sun', garden)).toMatchObject({ ok: true, kind: 'cooked', firstPlate: true });
    expect(garden.ingredientCount(cookingPlateKey('basil', 'sun'))).toBe(0);
    expect(cooking.cook('basil', 'sun', garden)).toEqual({ ok: false, reason: 'no-ingredient' });
  });

  it('같은 식물의 세 성장 결을 수확하면 세 플레이팅이 모두 열린다', () => {
    const garden = new GardenStore('three-weather');
    const cooking = new CookingStore('three-weather');
    for (const variant of GARDEN_VARIANTS) {
      harvestBasil(garden);
      expect(cooking.cook('basil', variant.id, garden).ok).toBe(true);
    }
    expect(cooking.progress()).toMatchObject({ totalCooked: 3, recipesDiscovered: 1, platesDiscovered: 3 });
  });

  it('완성한 메뉴만 단골로 고르고 최대 여섯 메뉴를 보존한다', () => {
    const state = freshCookingState();
    expect(toggleCookingFavorite(state, 'basil')).toBe(true);
    expect(toggleCookingFavorite(state, 'basil')).toBe(true);
    for (const recipe of COOKING_RECIPES.slice(0, 6)) expect(toggleCookingFavorite(state, recipe.id)).toBe(true);
    expect(toggleCookingFavorite(state, COOKING_RECIPES[6]!.id)).toBe(false);
    expect(state.favorites).toHaveLength(6);

    const store = new CookingStore('favorite-guard');
    expect(store.toggleFavorite('basil')).toBe(false);
  });

  it('손상된 접시와 중복 단골 메뉴를 정규화한다', () => {
    const state = normalizeCookingState({
      dishCounts: { 'basil:sun': 3.8, 'basil:fake': 9, 'fake:moon': 4, 'mint:rain': -2 },
      favorites: ['basil', 'basil', 'fake', 'mint'], totalCooked: 8.9,
    });
    expect(state.dishCounts).toEqual({ 'basil:sun': 3, 'mint:rain': 0 });
    expect(state.favorites).toEqual(['basil', 'mint']);
    expect(state.totalCooked).toBe(8);
  });

  it('사용자별 조리 기록은 다시 열어도 유지되고 다른 사용자와 분리된다', () => {
    const garden = new GardenStore('chef');
    const cooking = new CookingStore('chef');
    harvestBasil(garden);
    cooking.cook('basil', 'sun', garden);
    cooking.toggleFavorite('basil');
    expect(new CookingStore('chef').progress()).toMatchObject({ totalCooked: 1, platesDiscovered: 1, favorites: 1 });
    expect(new CookingStore('neighbor').progress().totalCooked).toBe(0);
  });
});
