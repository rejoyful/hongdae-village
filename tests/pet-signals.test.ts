import { beforeEach, describe, expect, it } from 'vitest';
import {
  PET_SIGNALS, PET_SIGNAL_RESPONSES, PetSignalStore, type PetSignalContext,
} from '../src/game/pets/petSignals';
import { PET_PERSONALITIES } from '../src/game/pets/petProfiles';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const context = (overrides: Partial<PetSignalContext> = {}): PetSignalContext => ({
  affinity: 10, plays: 0, tricks: 0, outings: 0, homeMemories: 0, ...overrides,
});

describe('동행 마음 번역 수첩', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('여섯 성격마다 네 몸짓과 세 가지 동등한 응답을 제공한다', () => {
    expect(PET_SIGNALS).toHaveLength(24);
    expect(PET_SIGNAL_RESPONSES.map((item) => item.id)).toEqual(['stay', 'play', 'wait']);
    expect(new Set(PET_SIGNALS.map((item) => item.id)).size).toBe(24);
    for (const personality of PET_PERSONALITIES) {
      expect(PET_SIGNALS.filter((item) => item.personality === personality.id).map((item) => item.chapter)).toEqual([1, 2, 3, 4]);
    }
  });

  it('첫 몸짓은 즉시 열리고 기존 친밀도·놀이·산책·집 추억을 소급 인정한다', () => {
    const store = new PetSignalStore('unlocker');
    expect(store.views('dog', 'brave', context()).map((item) => item.unlocked)).toEqual([true, false, false, false]);
    expect(store.views('dog', 'brave', context({ plays: 1, outings: 1, homeMemories: 3 })).map((item) => item.unlocked)).toEqual([true, true, true, true]);
    expect(store.views('dog', 'brave', context({ affinity: 80 })).every((item) => item.unlocked)).toBe(true);
  });

  it('어느 응답이든 기록되고 같은 몸짓의 번역을 손해 없이 다시 쓸 수 있다', () => {
    const store = new PetSignalStore('rewriter');
    const first = PET_SIGNALS.find((item) => item.personality === 'gentle')!;
    expect(store.record('rabbit', first.id, 'stay', context())).toBe(true);
    expect(store.views('rabbit', 'gentle', context())[0]).toMatchObject({ response: 'stay' });
    expect(store.record('rabbit', first.id, 'play', context())).toBe(true);
    expect(store.views('rabbit', 'gentle', context())[0]).toMatchObject({ response: 'play' });
    expect(store.progress()).toMatchObject({ recorded: 1, responseStyles: 1 });
  });

  it('잠긴 몸짓은 기록하지 않고 응답한 몸짓만 대표로 지정한다', () => {
    const store = new PetSignalStore('feature');
    const views = store.views('cat', 'calm', context());
    expect(store.record('cat', views[3]!.id, 'wait', context())).toBe(false);
    expect(store.feature('cat', views[0]!.id)).toBe(false);
    expect(store.record('cat', views[0]!.id, 'wait', context())).toBe(true);
    expect(store.feature('cat', views[0]!.id)).toBe(true);
    expect(store.views('cat', 'calm', context())[0]).toMatchObject({ featured: true });
    expect(store.feature('cat', views[0]!.id)).toBe(true);
    expect(store.progress().featured).toBe(0);
  });

  it('한 펫의 여섯 성격 전권과 세 응답 방식을 영구 집계한다', () => {
    const store = new PetSignalStore('archivist');
    const full = context({ affinity: 100, plays: 10, tricks: 5, outings: 24, homeMemories: 18 });
    PET_SIGNALS.forEach((signal, index) => {
      expect(store.record('dog', signal.id, PET_SIGNAL_RESPONSES[index % 3]!.id, full)).toBe(true);
    });
    expect(store.progress()).toMatchObject({
      recorded: 24, total: 24, personalities: 6, completedChapters: 6,
      petPartners: 1, responseStyles: 3,
    });
    expect(new PetSignalStore('archivist').progress().recorded).toBe(24);
    expect(new PetSignalStore('other-player').progress().recorded).toBe(0);
  });
});
