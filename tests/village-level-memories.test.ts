import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_QUESTS } from '../src/game/quests';
import {
  VillageLevelMemoryStore, normalizeVillageLevelMemoryState,
  recommendedVillageLevelMemoryDomain, villageLevelMemoryMetrics,
} from '../src/game/progression/villageLevelMemories';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('마을 레벨업 장면 앨범', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('도달한 주요 레벨에만 여섯 생활 취향 중 하나를 영구 보존한다', () => {
    const store = new VillageLevelMemoryStore('tester');
    expect(store.choose(5, 'style', 4)).toBe('locked');
    expect(store.choose(5, 'style', 5)).toBe('saved');
    expect(store.choose(10, 'home', 20)).toBe('saved');
    expect(store.choose(5, 'companion', 20)).toBe('changed');
    expect(new VillageLevelMemoryStore('tester').get().entries).toEqual([
      { level: 5, domainId: 'companion' },
      { level: 10, domainId: 'home' },
    ]);
  });

  it('손상된 중복 기록은 알려진 레벨과 취향만 레벨 순서대로 남긴다', () => {
    expect(normalizeVillageLevelMemoryState({
      entries: [
        { level: 20, domainId: 'maker' },
        { level: 5, domainId: 'bad' },
        { level: 20, domainId: 'style' },
        { level: 99, domainId: 'home' },
        { level: 5, domainId: 'explorer' },
      ],
    })).toEqual({
      version: 1,
      entries: [{ level: 5, domainId: 'explorer' }, { level: 20, domainId: 'maker' }],
    });
  });

  it('XP가 가장 많이 쌓인 생활을 첫 장면으로 제안한다', () => {
    expect(recommendedVillageLevelMemoryDomain({
      firstSteps: 80, stories: 240, collections: 160, mastery: 0, life: 900,
    })).toBe('maker');
    expect(recommendedVillageLevelMemoryDomain({
      firstSteps: 80, stories: 240, collections: 700, mastery: 0, life: 100,
    })).toBe('explorer');
  });

  it('보존 장수와 서로 다른 취향 수를 퀘스트 지표로 연결한다', () => {
    const store = new VillageLevelMemoryStore('metrics');
    store.choose(5, 'style', 50);
    store.choose(10, 'home', 50);
    store.choose(20, 'style', 50);
    expect(villageLevelMemoryMetrics(store.progress())).toEqual({
      village_level_memories: 3,
      village_level_memory_domains: 2,
    });
  });

  it('첫 장·여섯 취향·전권 보존을 실제 이야기·수집·숙련 퀘스트로 제공한다', () => {
    const quests = ALL_QUESTS.filter((quest) => quest.registryKey.startsWith('village_level_memor'));
    expect(quests).toHaveLength(3);
    expect(new Set(quests.map((quest) => quest.category))).toEqual(new Set(['story', 'collection', 'mastery']));
    expect(quests.every((quest) => !!quest.rewardLabel)).toBe(true);
  });
});
