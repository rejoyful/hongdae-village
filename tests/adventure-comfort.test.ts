import { describe, expect, it } from 'vitest';
import {
  AdventureComfortStore, normalizeAdventureComfortState,
} from '../src/game/battle/adventureComfort';
import { ALL_QUESTS } from '../src/game/quests';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('선택형 외곽숲 모험 보호', () => {
  it('새 이웃과 손상된 저장본은 공격받지 않는 관찰 모드로 시작한다', () => {
    expect(normalizeAdventureComfortState(null)).toEqual({
      version: 1, mode: 'peaceful', everStarted: false, everRestored: false,
    });
    expect(normalizeAdventureComfortState({ version: 99, mode: 'danger', everRestored: true })).toEqual({
      version: 1, mode: 'peaceful', everStarted: false, everRestored: false,
    });
  });

  it('사용자가 직접 원정을 켠 뒤에만 전투를 허용하고 사용자별로 보존한다', () => {
    const storage = new MemoryStorage();
    const store = new AdventureComfortStore('gentle', storage);
    expect(store.combatEnabled()).toBe(false);
    expect(store.toggle()).toBe('expedition');
    expect(store.combatEnabled()).toBe(true);
    expect(new AdventureComfortStore('gentle', storage).get()).toMatchObject({
      mode: 'expedition', everStarted: true,
    });
    expect(new AdventureComfortStore('another', storage).combatEnabled()).toBe(false);
  });

  it('원정을 접고 관찰로 돌아온 기록도 영구 도움말 진행으로 남긴다', () => {
    const store = new AdventureComfortStore('return', new MemoryStorage());
    expect(store.progress()).toEqual({ adventure_mode_started: 0, adventure_mode_restored: 0 });
    store.setMode('expedition');
    expect(store.progress()).toEqual({ adventure_mode_started: 1, adventure_mode_restored: 0 });
    store.setMode('peaceful');
    expect(store.progress()).toEqual({ adventure_mode_started: 1, adventure_mode_restored: 1 });
    expect(store.setMode('peaceful')).toBe('unchanged');
  });

  it('관찰과 원정 전환을 가르치는 두 퀘스트가 외곽숲 길 안내로 이어진다', () => {
    const quests = ALL_QUESTS.filter((quest) => quest.registryKey.startsWith('adventure_mode_'));
    expect(quests.map((quest) => quest.registryKey)).toEqual([
      'adventure_mode_started', 'adventure_mode_restored',
    ]);
    expect(quests.every((quest) => !!quest.rewardLabel)).toBe(true);
    expect(villageRequestDestinationForMetric('adventure_mode_started')).toBe('hunt');
    expect(villageRequestDestinationForMetric('adventure_mode_restored')).toBe('hunt');
  });
});
