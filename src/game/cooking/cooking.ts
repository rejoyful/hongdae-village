import {
  GARDEN_SEEDS, GARDEN_VARIANTS, gardenSpecimenKey,
  type GardenSeedId, type GardenVariantId,
} from '../garden/garden';

export type DishShape = 'toast' | 'cookie' | 'drink' | 'bread' | 'soup' | 'sandwich' | 'milk' | 'jelly' | 'pasta' | 'taco' | 'tea' | 'macaron';

export interface CookingRecipe {
  id: GardenSeedId;
  name: string;
  subtitle: string;
  note: string;
  basePantry: string;
  shape: DishShape;
  plate: string;
  food: string;
  accent: string;
}

export interface CookingState {
  version: 1;
  dishCounts: Record<string, number>;
  favorites: GardenSeedId[];
  totalCooked: number;
}

export interface CookingProgress {
  totalCooked: number;
  recipesDiscovered: number;
  platesDiscovered: number;
  totalRecipes: number;
  totalPlates: number;
  favorites: number;
}

export type CookingResult =
  | { ok: true; kind: 'cooked'; recipeId: GardenSeedId; variantId: GardenVariantId; plateKey: string; firstRecipe: boolean; firstPlate: boolean; servings: number }
  | { ok: false; reason: 'unknown-recipe' | 'no-ingredient' };

export const COOKING_RECIPES: readonly CookingRecipe[] = [
  { id: 'basil', name: '모퉁이 바질 토스트', subtitle: '골목의 첫 아침 메뉴', note: '바삭한 식빵 위에 창가 바질 향을 얹은 가장 다정한 첫 접시.', basePantry: '식빵 · 크림치즈', shape: 'toast', plate: '#d7c8a8', food: '#c99558', accent: '#6f9364' },
  { id: 'pansy', name: '팬지빛 설탕 쿠키', subtitle: '작은 얼굴을 닮은 과자', note: '식용 꽃 설탕으로 팬지의 색감을 표현한 골목 찻자리 쿠키.', basePantry: '밀가루 · 꽃설탕', shape: 'cookie', plate: '#cfbca0', food: '#d5a96d', accent: '#b77b68' },
  { id: 'mint', name: '빗소리 민트 소다', subtitle: '비가 그친 뒤의 한 잔', note: '차가운 탄산과 민트 향이 유리잔 안에서 층층이 맑아져요.', basePantry: '탄산수 · 얼음', shape: 'drink', plate: '#aabcb3', food: '#77aa93', accent: '#d2e2c9' },
  { id: 'rosemary', name: '계단 로즈마리 포카치아', subtitle: '오래 씹을수록 향긋한 빵', note: '굵은 소금과 로즈마리를 눌러 구운, 산책 전 든든한 한 조각.', basePantry: '반죽 · 올리브유', shape: 'bread', plate: '#c8b79a', food: '#c18d52', accent: '#708a75' },
  { id: 'marigold', name: '노을빛 단호박 수프', subtitle: '메리골드 색감의 저녁', note: '메리골드의 주황빛을 닮은 단호박 수프에 꽃잎 모양 크루통을 띄워요.', basePantry: '단호박 · 우유', shape: 'soup', plate: '#b8a88e', food: '#c77b39', accent: '#e6b154' },
  { id: 'strawberry', name: '옥상 딸기 산도', subtitle: '난간 아래 익은 한 입', note: '폭신한 빵 사이로 딸기와 크림의 단면을 또렷하게 남긴 메뉴.', basePantry: '우유식빵 · 생크림', shape: 'sandwich', plate: '#d3c2a5', food: '#eee0c6', accent: '#c65c58' },
  { id: 'lavender', name: '새벽 라벤더 밀크', subtitle: '잠들기 전의 온도', note: '라벤더 향을 아주 옅게 우린 따뜻한 우유. 잔 가장자리에 새벽빛이 감돌아요.', basePantry: '우유 · 꿀', shape: 'milk', plate: '#aaa59d', food: '#ded7c9', accent: '#8d7d9c' },
  { id: 'hydrangea', name: '장마빛 크림 젤리', subtitle: '수국 색에서 얻은 영감', note: '관상 수국은 넣지 않고, 푸른 허브티와 크림으로 장마의 색만 재현했어요.', basePantry: '블루 허브티 · 한천', shape: 'jelly', plate: '#afb4b0', food: '#7e97ad', accent: '#c3cbd0' },
  { id: 'tomato', name: '철길 토마토 파스타', subtitle: '기차 두 번 지나갈 동안', note: '방울토마토가 터질 만큼만 익혀 산뜻하고 윤기 있게 마무리한 한 접시.', basePantry: '생면 · 올리브유', shape: 'pasta', plate: '#c7b89c', food: '#b95d46', accent: '#e6a15e' },
  { id: 'monstera', name: '레코드 그린 타코', subtitle: '갈라진 잎결의 리듬', note: '관상 잎은 넣지 않고, 깻잎과 채소를 몬스테라 실루엣처럼 접어 담아요.', basePantry: '또르띠야 · 깻잎', shape: 'taco', plate: '#aaa28f', food: '#bc8c51', accent: '#4e7557' },
  { id: 'camellia', name: '겨울 동백빛 티', subtitle: '찬 골목의 붉은 찻잔', note: '동백의 색을 닮은 로즈힙 블렌드. 붉지만 산뜻하고 부드러워요.', basePantry: '로즈힙 · 꿀', shape: 'tea', plate: '#b7aaa1', food: '#9e4e4e', accent: '#dfb38b' },
  { id: 'moon_orchid', name: '달빛 난초 마카롱', subtitle: '표본함 마지막 디저트', note: '난초의 향과 달빛 색을 모티프로 만든 셰프의 마지막 수집 메뉴.', basePantry: '아몬드 · 바닐라', shape: 'macaron', plate: '#aaa7a0', food: '#a79bb3', accent: '#dfd4c2' },
] as const;

const RECIPE_IDS = new Set<GardenSeedId>(COOKING_RECIPES.map((recipe) => recipe.id));
const VARIANT_IDS = new Set<GardenVariantId>(GARDEN_VARIANTS.map((variant) => variant.id));

export const cookingRecipeById = (id: GardenSeedId): CookingRecipe => COOKING_RECIPES.find((recipe) => recipe.id === id)!;
export const cookingPlateKey = (recipeId: GardenSeedId, variantId: GardenVariantId): string => gardenSpecimenKey(recipeId, variantId);

const cleanCount = (value: unknown, max = Number.MAX_SAFE_INTEGER): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.min(max, Math.floor(value)) : 0
);

export function freshCookingState(): CookingState {
  return { version: 1, dishCounts: {}, favorites: [], totalCooked: 0 };
}

export function isCookingPlateKey(key: string): boolean {
  const [recipeId, variantId] = key.split(':');
  return RECIPE_IDS.has(recipeId as GardenSeedId) && VARIANT_IDS.has(variantId as GardenVariantId);
}

export function normalizeCookingState(raw: unknown): CookingState {
  if (!raw || typeof raw !== 'object') return freshCookingState();
  const value = raw as Partial<CookingState>;
  const dishCounts: Record<string, number> = {};
  if (value.dishCounts && typeof value.dishCounts === 'object') {
    for (const [key, count] of Object.entries(value.dishCounts)) {
      if (isCookingPlateKey(key)) dishCounts[key] = cleanCount(count, 999);
    }
  }
  const favorites = Array.isArray(value.favorites)
    ? [...new Set(value.favorites.filter((id): id is GardenSeedId => RECIPE_IDS.has(id as GardenSeedId)))].slice(0, 6)
    : [];
  return { version: 1, dishCounts, favorites, totalCooked: cleanCount(value.totalCooked) };
}

export function cookingProgress(state: CookingState): CookingProgress {
  const plates = Object.keys(state.dishCounts).filter((key) => state.dishCounts[key]! > 0 && isCookingPlateKey(key));
  const recipes = new Set(plates.map((key) => key.split(':')[0]));
  return {
    totalCooked: state.totalCooked,
    recipesDiscovered: recipes.size,
    platesDiscovered: plates.length,
    totalRecipes: COOKING_RECIPES.length,
    totalPlates: COOKING_RECIPES.length * GARDEN_VARIANTS.length,
    favorites: state.favorites.length,
  };
}

export function recordCook(state: CookingState, recipeId: GardenSeedId, variantId: GardenVariantId): CookingResult {
  if (!RECIPE_IDS.has(recipeId) || !VARIANT_IDS.has(variantId)) return { ok: false, reason: 'unknown-recipe' };
  const plateKey = cookingPlateKey(recipeId, variantId);
  const firstPlate = (state.dishCounts[plateKey] ?? 0) === 0;
  const firstRecipe = !Object.keys(state.dishCounts).some((key) => key.startsWith(`${recipeId}:`) && state.dishCounts[key]! > 0);
  state.dishCounts[plateKey] = Math.min(999, (state.dishCounts[plateKey] ?? 0) + 1);
  state.totalCooked += 1;
  return { ok: true, kind: 'cooked', recipeId, variantId, plateKey, firstRecipe, firstPlate, servings: state.dishCounts[plateKey] };
}

export function toggleCookingFavorite(state: CookingState, recipeId: GardenSeedId): boolean {
  if (!RECIPE_IDS.has(recipeId)) return false;
  const index = state.favorites.indexOf(recipeId);
  if (index >= 0) state.favorites.splice(index, 1);
  else if (state.favorites.length < 6) state.favorites.push(recipeId);
  else return false;
  return true;
}

export function initialCookingRecipeId(): GardenSeedId { return GARDEN_SEEDS[0]!.id; }
