import { describe, expect, it } from 'vitest';
import { MONSTERS } from '../src/game/battle/monsters';
import type { MonsterDexEntry } from '../src/game/battle/monsterDex';
import {
  MONSTER_RESEARCH_STAGES, MONSTER_RESEARCH_TIERS, monsterResearchProgress, monsterResearchTierViews,
} from '../src/game/battle/monsterResearch';
import { ALL_QUESTS } from '../src/game/quests';

const entries = (kills: (id: string) => number): MonsterDexEntry[] => MONSTERS.map((species) => ({
  species,
  kills: kills(species.id),
  discovered: kills(species.id) > 0,
}));

describe('외곽숲 90도장 생태 연구', () => {
  it('30종마다 1·3·10회 세 도장을 제공해 총 90칸을 만든다', () => {
    expect(MONSTER_RESEARCH_TIERS).toHaveLength(6);
    expect(MONSTER_RESEARCH_STAGES.map((stage) => stage.goal)).toEqual([1, 3, 10]);
    const progress = monsterResearchProgress(entries(() => 0));
    expect(progress).toEqual({ discovered: 0, masteredSpecies: 0, stamps: 0, totalStamps: 90, pages: 0, totalPages: 6 });
  });

  it('처치 1·3·10회 경계에서 연구 도장이 정확히 열린다', () => {
    const firstId = MONSTERS[0]!.id;
    for (const [kills, stamps] of [[0, 0], [1, 1], [2, 1], [3, 2], [9, 2], [10, 3]] as const) {
      const first = monsterResearchTierViews(entries((id) => id === firstId ? kills : 0))[0]!.entries[0]!;
      expect(first.stampsUnlocked).toBe(stamps);
      expect(first.mastered).toBe(kills >= 10);
    }
  });

  it('한 티어의 다섯 종을 한 번씩 만나면 해당 현장 수첩 표지를 기록한다', () => {
    const tierOneIds = new Set(MONSTERS.filter((monster) => monster.tier === 1).map((monster) => monster.id));
    const views = monsterResearchTierViews(entries((id) => tierOneIds.has(id) ? 1 : 0));
    expect(views[0]).toMatchObject({ discovered: 5, pageRecorded: true, stamps: 5 });
    expect(views.slice(1).every((tier) => !tier.pageRecorded)).toBe(true);
    expect(monsterResearchProgress(entries((id) => tierOneIds.has(id) ? 1 : 0)).pages).toBe(1);
  });

  it('모든 종 10회 관찰은 90도장·30종 숙련·6권 표지 완성이다', () => {
    expect(monsterResearchProgress(entries(() => 10))).toEqual({
      discovered: 30, masteredSpecies: 30, stamps: 90, totalStamps: 90, pages: 6, totalPages: 6,
    });
  });

  it('연구 도장·구역 표지가 실제 영구 배지 퀘스트로 연결된다', () => {
    const stampQuests = ALL_QUESTS.filter((quest) => quest.registryKey === 'monster_research_stamps');
    expect(stampQuests.map((quest) => quest.goal)).toEqual([1, 30, 90]);
    expect(ALL_QUESTS.find((quest) => quest.registryKey === 'monster_research_pages')).toMatchObject({ goal: 3 });
    expect([...stampQuests, ALL_QUESTS.find((quest) => quest.registryKey === 'monster_research_pages')!]
      .every((quest) => !!quest.rewardLabel)).toBe(true);
  });
});
