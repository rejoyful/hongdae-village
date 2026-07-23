import { gardenSpecimenKey, type GardenSeedId, type GardenVariantId } from '../garden/garden';
import type { GardenStore } from '../garden/gardenStore';
import {
  cookingProgress, freshCookingState, normalizeCookingState, recordCook, toggleCookingFavorite,
  type CookingProgress, type CookingResult, type CookingState,
} from './cooking';

const KEY_PREFIX = 'hv-cooking-';

export class CookingStore {
  private state: CookingState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = KEY_PREFIX + userId;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 막혀도 세션 안에서는 계속 작동한다. */ }
    this.state = normalizeCookingState(raw);
    this.persist();
  }

  get(): CookingState { return this.state; }
  progress(): CookingProgress { return cookingProgress(this.state); }

  cook(recipeId: GardenSeedId, variantId: GardenVariantId, garden: GardenStore): CookingResult {
    const ingredientKey = gardenSpecimenKey(recipeId, variantId);
    if (garden.ingredientCount(ingredientKey) < 1) return { ok: false, reason: 'no-ingredient' };
    if (!garden.consumeIngredient(ingredientKey)) return { ok: false, reason: 'no-ingredient' };
    const result = recordCook(this.state, recipeId, variantId);
    if (result.ok) this.persist();
    return result;
  }

  toggleFavorite(recipeId: GardenSeedId): boolean {
    const discovered = Object.keys(this.state.dishCounts)
      .some((key) => key.startsWith(`${recipeId}:`) && this.state.dishCounts[key]! > 0);
    if (!discovered) return false;
    if (!toggleCookingFavorite(this.state, recipeId)) return false;
    this.persist();
    return true;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 한정 폴백 */ }
  }
}
