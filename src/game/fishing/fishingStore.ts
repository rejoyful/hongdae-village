import {
  catchFish, fishingProgress, freshFishingState, normalizeFishingState,
  type FishingCatchResult, type FishingLureId, type FishingProgress, type FishingState, type FishingWaterId,
} from './fishing';

const KEY_PREFIX = 'hv-fishing-';

export class FishingStore {
  private state: FishingState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = KEY_PREFIX + userId;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 막혀도 현재 세션의 물고기 기록은 유지한다. */ }
    this.state = normalizeFishingState(raw);
    this.persist();
  }

  get(): FishingState { return this.state; }
  progress(): FishingProgress { return fishingProgress(this.state); }

  cast(waterId: FishingWaterId, lureId: FishingLureId): FishingCatchResult {
    const result = catchFish(this.state, waterId, lureId);
    this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 한정 폴백 */ }
  }
}
