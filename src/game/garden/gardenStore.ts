import {
  gardenProgress, harvestGardenPlot, normalizeGardenState, plantGardenPlot, tendGardenPlot,
  type GardenActionResult, type GardenProgress, type GardenSeedId, type GardenState,
} from './garden';

const KEY_PREFIX = 'hv-garden-';

export class GardenStore {
  private state: GardenState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = KEY_PREFIX + userId;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 막혀도 현재 세션에서는 계속 작동한다. */ }
    this.state = normalizeGardenState(raw);
    this.persist();
  }

  get(): GardenState { return this.state; }
  progress(): GardenProgress { return gardenProgress(this.state); }
  ingredientCount(key: string): number { return this.state.ingredients[key] ?? 0; }

  consumeIngredient(key: string): boolean {
    const count = this.state.ingredients[key] ?? 0;
    if (count < 1) return false;
    this.state.ingredients[key] = count - 1;
    this.persist();
    return true;
  }

  plant(plotIndex: number, seedId: GardenSeedId): GardenActionResult {
    const result = plantGardenPlot(this.state, plotIndex, seedId);
    if (result.ok) this.persist();
    return result;
  }

  tend(plotIndex: number): GardenActionResult {
    const result = tendGardenPlot(this.state, plotIndex);
    if (result.ok) this.persist();
    return result;
  }

  harvest(plotIndex: number): GardenActionResult {
    const result = harvestGardenPlot(this.state, plotIndex);
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 한정 폴백 */ }
  }
}
