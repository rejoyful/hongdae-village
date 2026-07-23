import type { FishingStore } from '../fishing/fishingStore';
import {
  applyHomeAquariumDraft, aquariumSignature, freshHomeAquariumState, homeAquariumProgress,
  normalizeHomeAquariumState, type HomeAquariumDraft, type HomeAquariumProgress,
  type HomeAquariumSaveResult, type HomeAquariumState,
} from './homeAquarium';

const KEY_PREFIX = 'hv-home-aquarium-';

export class HomeAquariumStore {
  private state: HomeAquariumState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = KEY_PREFIX + userId;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 폴백 */ }
    this.state = normalizeHomeAquariumState(raw);
    this.persist();
  }

  get(): HomeAquariumState { return this.state; }
  progress(fishing: FishingStore): HomeAquariumProgress { return homeAquariumProgress(this.state, fishing.progress()); }
  signature(): string { return aquariumSignature(this.state); }

  save(draft: HomeAquariumDraft, fishing: FishingStore): HomeAquariumSaveResult {
    const result = applyHomeAquariumDraft(this.state, draft, fishing.get(), fishing.progress());
    if (result.ok) this.persist();
    return result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
