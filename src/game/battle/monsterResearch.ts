import type { MonsterDexEntry } from './monsterDex';

export interface MonsterResearchStage {
  id: 'discovery' | 'familiar' | 'mastery';
  mark: string;
  name: string;
  goal: number;
}

export interface MonsterResearchTierDef {
  tier: number;
  code: string;
  mark: string;
  title: string;
  description: string;
  fieldNote: string;
  color: string;
}

export interface MonsterResearchEntryView extends MonsterDexEntry {
  stamps: Array<MonsterResearchStage & { unlocked: boolean }>;
  stampsUnlocked: number;
  nextStage: MonsterResearchStage | null;
  mastered: boolean;
  progressPct: number;
}

export interface MonsterResearchTierView extends MonsterResearchTierDef {
  entries: MonsterResearchEntryView[];
  discovered: number;
  mastered: number;
  stamps: number;
  totalStamps: number;
  pageRecorded: boolean;
  progressPct: number;
}

export interface MonsterResearchProgress {
  discovered: number;
  masteredSpecies: number;
  stamps: number;
  totalStamps: number;
  pages: number;
  totalPages: number;
}

export const MONSTER_RESEARCH_STAGES: readonly MonsterResearchStage[] = [
  { id: 'discovery', mark: '발', name: '첫 발견', goal: 1 },
  { id: 'familiar', mark: '관', name: '익숙한 관찰', goal: 3 },
  { id: 'mastery', mark: '숙', name: '생태 숙련', goal: 10 },
] as const;

export const MONSTER_RESEARCH_TIERS: readonly MonsterResearchTierDef[] = [
  { tier: 1, code: 'EDGE', mark: '싹', title: '숲 언저리', description: '길과 풀이 만나는 가장 안전한 첫 관찰 구역', fieldNote: '길 쪽으로 나오면 전투가 즉시 멈추고 체력이 천천히 회복됩니다.', color: '#789169' },
  { tier: 2, code: 'ALLEY', mark: '굴', title: '골목 그늘', description: '돌담 아래 작은 굴과 습지에 모이는 생태', fieldNote: '한 종만 반복해도 괜찮지만, 다섯 종을 만나면 이 장의 표지가 기록됩니다.', color: '#7b8894' },
  { tier: 3, code: 'SPIRIT', mark: '령', title: '정령 화단', description: '불·얼음·바람의 흔적이 꽃가루처럼 섞이는 구역', fieldNote: '현재 티어 할당량을 채우면 다음 생태가 열리고 이전 종도 계속 만날 수 있습니다.', color: '#7e948c' },
  { tier: 4, code: 'MIDNIGHT', mark: '철', title: '심야 철길', description: '어둠과 금속성 생태가 낡은 철길을 지키는 구역', fieldNote: '기절해도 장비와 레벨은 사라지지 않으며 현재 경험치 일부만 감소합니다.', color: '#746d82' },
  { tier: 5, code: 'ANCIENT', mark: '고', title: '오래된 능선', description: '용과 망령의 큰 발자국이 겹쳐 남은 깊은 숲', fieldNote: '더 높은 공격력은 관찰 시간을 줄여 줄 뿐, 전용 기간이나 경쟁 순위는 없습니다.', color: '#8c715f' },
  { tier: 6, code: 'CHRONICLE', mark: '별', title: '연대기 심부', description: '외곽숲의 가장 오래된 다섯 생태가 머무는 마지막 장', fieldNote: '90개 도장은 시즌 없이 영구 보존됩니다. 원하는 종부터 천천히 완성하세요.', color: '#8b6574' },
] as const;

export function monsterResearchTierViews(entries: readonly MonsterDexEntry[]): MonsterResearchTierView[] {
  return MONSTER_RESEARCH_TIERS.map((tier) => {
    const tierEntries = entries.filter((entry) => entry.species.tier === tier.tier).map((entry) => {
      const stamps = MONSTER_RESEARCH_STAGES.map((stage) => ({ ...stage, unlocked: entry.kills >= stage.goal }));
      const stampsUnlocked = stamps.filter((stage) => stage.unlocked).length;
      return {
        ...entry,
        stamps,
        stampsUnlocked,
        nextStage: MONSTER_RESEARCH_STAGES.find((stage) => entry.kills < stage.goal) ?? null,
        mastered: entry.kills >= MONSTER_RESEARCH_STAGES.at(-1)!.goal,
        progressPct: Math.round((Math.min(entry.kills, MONSTER_RESEARCH_STAGES.at(-1)!.goal) / MONSTER_RESEARCH_STAGES.at(-1)!.goal) * 100),
      };
    });
    const discovered = tierEntries.filter((entry) => entry.discovered).length;
    const mastered = tierEntries.filter((entry) => entry.mastered).length;
    const stamps = tierEntries.reduce((total, entry) => total + entry.stampsUnlocked, 0);
    const totalStamps = tierEntries.length * MONSTER_RESEARCH_STAGES.length;
    return {
      ...tier,
      entries: tierEntries,
      discovered,
      mastered,
      stamps,
      totalStamps,
      pageRecorded: tierEntries.length > 0 && discovered === tierEntries.length,
      progressPct: totalStamps ? Math.round((stamps / totalStamps) * 100) : 0,
    };
  });
}

export function monsterResearchProgress(entries: readonly MonsterDexEntry[]): MonsterResearchProgress {
  const tiers = monsterResearchTierViews(entries);
  return {
    discovered: entries.filter((entry) => entry.discovered).length,
    masteredSpecies: entries.filter((entry) => entry.kills >= MONSTER_RESEARCH_STAGES.at(-1)!.goal).length,
    stamps: tiers.reduce((total, tier) => total + tier.stamps, 0),
    totalStamps: entries.length * MONSTER_RESEARCH_STAGES.length,
    pages: tiers.filter((tier) => tier.pageRecorded).length,
    totalPages: tiers.length,
  };
}
