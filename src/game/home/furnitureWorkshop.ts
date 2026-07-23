import { CATALOG, CATALOG_BY_ID, type ItemDef } from '../../items/catalog';

export type FurnitureAcquisitionChannel = 'standard' | 'weekly' | 'diy';

export interface FurnitureIngredient {
  itemId: string;
  qty: number;
}

export interface FurnitureRecipe {
  id: string;
  name: string;
  outputItemId: string;
  fee: number;
  note: string;
  ingredients: readonly FurnitureIngredient[];
}

export interface FurnitureIngredientView extends FurnitureIngredient {
  name: string;
  owned: number;
  ready: boolean;
}

export interface FurnitureCraftView {
  recipe: FurnitureRecipe;
  output: ItemDef;
  ingredients: FurnitureIngredientView[];
  enoughMaterials: boolean;
  enoughCoins: boolean;
  ready: boolean;
}

export interface WeeklyFurniturePick {
  item: ItemDef;
  slot: number;
  available: boolean;
  waitWeeks: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1_000;
const ROTATION_EPOCH_DAY = Date.UTC(2026, 0, 5); // KST 월요일

const WEEKLY_SLOTS = new Map<string, number>([
  ['bed_blue', 0], ['turntable', 0], ['cactus', 0], ['poster_film', 0],
  ['desk_white', 1], ['speaker_amp', 1], ['stuckyi', 1], ['guitar', 1],
  ['chair_cushion', 2], ['fridge', 2], ['rug_check', 2], ['mic_stand', 2],
  ['sofa_coral', 3], ['washer', 3], ['lamp_mood', 3], ['easel', 3],
]);

export const FURNITURE_RECIPES: readonly FurnitureRecipe[] = [
  { id: 'soft_green_bed', name: '초록 포근 침대', outputItemId: 'bed_green', fee: 80, note: '기본 침대에 두 겹 쿠션을 덧대 넓게 만듭니다.', ingredients: [{ itemId: 'bed_basic', qty: 1 }, { itemId: 'cushion', qty: 2 }] },
  { id: 'table_for_two', name: '둘이 앉는 식탁', outputItemId: 'dining_table', fee: 70, note: '좌식 테이블을 두 사람의 저녁 식탁으로 높입니다.', ingredients: [{ itemId: 'table_low', qty: 1 }, { itemId: 'chair_wood', qty: 2 }] },
  { id: 'wide_story_shelf', name: '이어 붙인 이야기 책장', outputItemId: 'bookshelf_wide', fee: 75, note: '책장 두 칸과 책 더미를 한 벽의 기록으로 묶습니다.', ingredients: [{ itemId: 'bookshelf', qty: 2 }, { itemId: 'book_pile', qty: 1 }] },
  { id: 'quiet_wardrobe', name: '조용히 닫히는 옷장', outputItemId: 'wardrobe', fee: 90, note: '수납장과 행거를 합쳐 큰 옷장 한 점을 만듭니다.', ingredients: [{ itemId: 'drawer', qty: 1 }, { itemId: 'hanger_rack', qty: 1 }] },
  { id: 'morning_dresser', name: '아침빛 화장대', outputItemId: 'dresser', fee: 70, note: '원목 책상에 전신 거울을 낮게 맞춰 붙입니다.', ingredients: [{ itemId: 'desk_wood', qty: 1 }, { itemId: 'mirror_full', qty: 1 }] },
  { id: 'alley_pc_desk', name: '골목 작업용 PC 셋업', outputItemId: 'pc_setup', fee: 120, note: '노트북 책상과 TV 스탠드를 하나의 작업대로 재배선합니다.', ingredients: [{ itemId: 'laptop_desk', qty: 1 }, { itemId: 'tv_stand', qty: 1 }] },
  { id: 'tabletop_greenhouse', name: '탁상 온실', outputItemId: 'mini_garden', fee: 60, note: '두 화분과 꽃병을 작은 실내 정원으로 엮습니다.', ingredients: [{ itemId: 'plant_pot', qty: 2 }, { itemId: 'flower_vase', qty: 1 }] },
  { id: 'window_green_line', name: '창가 초록 선반', outputItemId: 'window_plant', fee: 60, note: '벽 선반 위로 화분의 높낮이를 맞춥니다.', ingredients: [{ itemId: 'plant_pot', qty: 1 }, { itemId: 'wall_shelf', qty: 1 }] },
  { id: 'round_rest_rug', name: '둥근 쉼표 러그', outputItemId: 'rug_round', fee: 70, note: '긴 러그를 둥글게 재단하고 쿠션 솜으로 가장자리를 채웁니다.', ingredients: [{ itemId: 'rug_long', qty: 1 }, { itemId: 'cushion', qty: 2 }] },
  { id: 'cat_stair_tower', name: '책장 계단 캣타워', outputItemId: 'cat_tower', fee: 75, note: '낮은 책장과 쿠션을 동행 펫의 계단으로 바꿉니다.', ingredients: [{ itemId: 'bookshelf', qty: 1 }, { itemId: 'cushion', qty: 2 }] },
  { id: 'band_neon_memory', name: '밴드 포스터 네온', outputItemId: 'neon_sign', fee: 85, note: '스탠드 조명의 배선을 포스터 윤곽에 따라 심습니다.', ingredients: [{ itemId: 'lamp_stand', qty: 1 }, { itemId: 'poster_band', qty: 1 }] },
  { id: 'slow_photo_wall', name: '천천히 모은 사진 벽', outputItemId: 'photo_frames', fee: 55, note: '벽시계의 틀과 책 더미 종이를 작은 액자로 다시 씁니다.', ingredients: [{ itemId: 'wall_clock', qty: 1 }, { itemId: 'book_pile', qty: 1 }] },
] as const;

export const FURNITURE_RECIPE_BY_ID = new Map(FURNITURE_RECIPES.map((recipe) => [recipe.id, recipe]));
export const FURNITURE_RECIPE_BY_OUTPUT = new Map(FURNITURE_RECIPES.map((recipe) => [recipe.outputItemId, recipe]));

const kstDay = (date: Date): number => {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
};

const positiveMod = (value: number, divisor: number): number => ((value % divisor) + divisor) % divisor;

/** 2026-01-05 KST를 기준으로 서버와 공유하는 4주 순환 슬롯. */
export function furnitureRotationSlot(date = new Date()): number {
  return positiveMod(Math.floor((kstDay(date) - ROTATION_EPOCH_DAY) / WEEK_MS), 4);
}

export function furnitureRotationKey(date = new Date()): string {
  const week = Math.floor((kstDay(date) - ROTATION_EPOCH_DAY) / WEEK_MS);
  return `SALLIM-${String(week).padStart(3, '0')}`;
}

/** 다음 KST 월요일 00:00. 카운트다운·서버 회전 경계에 공통 사용한다. */
export function nextFurnitureRotationAt(date = new Date()): Date {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  const weekday = shifted.getUTCDay();
  const untilMonday = weekday === 0 ? 1 : 8 - weekday;
  const nextDay = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + untilMonday);
  return new Date(nextDay - KST_OFFSET_MS);
}

export function furnitureAcquisitionChannel(itemId: string): FurnitureAcquisitionChannel {
  if (FURNITURE_RECIPE_BY_OUTPUT.has(itemId)) return 'diy';
  if (WEEKLY_SLOTS.has(itemId)) return 'weekly';
  return 'standard';
}

export function weeklyFurniturePicks(date = new Date()): WeeklyFurniturePick[] {
  const current = furnitureRotationSlot(date);
  return [...WEEKLY_SLOTS.entries()].map(([itemId, slot]) => ({
    item: CATALOG_BY_ID.get(itemId)!, slot, available: slot === current,
    waitWeeks: positiveMod(slot - current, 4),
  })).sort((a, b) => Number(b.available) - Number(a.available) || a.waitWeeks - b.waitWeeks || a.item.price - b.item.price);
}

export function standardFurnitureItems(): ItemDef[] {
  return CATALOG.filter((item) => furnitureAcquisitionChannel(item.id) === 'standard');
}

export function furnitureCraftView(recipe: FurnitureRecipe, inventory: ReadonlyMap<string, number>, coins: number): FurnitureCraftView {
  const ingredients = recipe.ingredients.map((ingredient) => {
    const item = CATALOG_BY_ID.get(ingredient.itemId)!;
    const owned = Math.max(0, Math.floor(inventory.get(ingredient.itemId) ?? 0));
    return { ...ingredient, name: item.name, owned, ready: owned >= ingredient.qty };
  });
  const enoughMaterials = ingredients.every((ingredient) => ingredient.ready);
  const enoughCoins = coins >= recipe.fee;
  return {
    recipe, output: CATALOG_BY_ID.get(recipe.outputItemId)!, ingredients,
    enoughMaterials, enoughCoins, ready: enoughMaterials && enoughCoins,
  };
}

export function furnitureAcquisitionRoute(itemId: string, date = new Date()): string {
  const item = CATALOG_BY_ID.get(itemId);
  if (!item) return '획득 경로를 확인할 수 없음';
  const channel = furnitureAcquisitionChannel(itemId);
  if (channel === 'diy') return `살림 가구 · DIY 작업대 · ${FURNITURE_RECIPE_BY_OUTPUT.get(itemId)!.name}`;
  if (channel === 'weekly') {
    const pick = weeklyFurniturePicks(date).find((candidate) => candidate.item.id === itemId)!;
    return pick.available ? '살림 가구 · 이번 주 큐레이션' : `살림 가구 · 주간 수첩 · ${pick.waitWeeks}주 뒤 등장`;
  }
  return `살림 가구 · 기본 진열 · ${item.price} 코인`;
}
