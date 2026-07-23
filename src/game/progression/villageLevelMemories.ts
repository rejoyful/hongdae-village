import type { VillageXpBreakdown } from './villageJourney';

export type VillageLevelMemoryLevel = 5 | 10 | 20 | 30 | 40 | 50;
export type VillageLevelMemoryDomainId =
  | 'style'
  | 'home'
  | 'companion'
  | 'neighbor'
  | 'maker'
  | 'explorer';

export interface VillageLevelMemoryDomainDef {
  id: VillageLevelMemoryDomainId;
  mark: string;
  name: string;
  subtitle: string;
  color: string;
  nextAction: string;
  location: string;
}

export interface VillageLevelMemoryEntry {
  level: VillageLevelMemoryLevel;
  domainId: VillageLevelMemoryDomainId;
}

export interface VillageLevelMemoryState {
  version: 1;
  entries: VillageLevelMemoryEntry[];
}

export interface VillageLevelMemoryProgress {
  saved: number;
  domains: number;
  complete: boolean;
  domainIds: VillageLevelMemoryDomainId[];
}

export const VILLAGE_LEVEL_MEMORY_LEVELS: readonly VillageLevelMemoryLevel[] = [5, 10, 20, 30, 40, 50];

export const VILLAGE_LEVEL_MEMORY_DOMAINS: readonly VillageLevelMemoryDomainDef[] = [
  { id: 'style', mark: '옷', name: '오늘의 모습', subtitle: '그 레벨의 나를 한 벌의 코디로 기억해요.', color: '#a96f82', nextAction: '새 코디 한 벌을 옷장에 남기기', location: '캐릭터 아틀리에 · 옷장' },
  { id: 'home', mark: '집', name: '살고 싶은 장면', subtitle: '가장 마음에 든 방의 온도를 기억해요.', color: '#a77a58', nextAction: '가구 하나에 새로운 리폼 입히기', location: '내 집 · 가구 리폼 공방' },
  { id: 'companion', mark: '발', name: '함께 걷던 하루', subtitle: '작은 동행과 나눈 신호를 기억해요.', color: '#7f9169', nextAction: '동행 펫과 산책 추억 하나 남기기', location: '펫샵 · 동행 프로필' },
  { id: 'neighbor', mark: '이', name: '이름을 부른 순간', subtitle: '안부와 약속이 쌓인 골목을 기억해요.', color: '#66869a', nextAction: '마음 가는 주민에게 오늘의 인사 건네기', location: '주민 수첩 · 약속과 편지' },
  { id: 'maker', mark: '손', name: '손끝에 남은 생활', subtitle: '심고 낚고 요리한 작은 성취를 기억해요.', color: '#8d885a', nextAction: '정원·요리·낚시 중 한 가지 이어 하기', location: '생활 작업실' },
  { id: 'explorer', mark: '길', name: '처음 발견한 풍경', subtitle: '지도 밖에서 만난 장면을 기억해요.', color: '#80739b', nextAction: '아직 못 본 골목 도장 하나 찾기', location: '마을 지도 · 골목 여권' },
] as const;

export const VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID = new Map(
  VILLAGE_LEVEL_MEMORY_DOMAINS.map((domain) => [domain.id, domain]),
);

export function normalizeVillageLevelMemoryState(raw: unknown): VillageLevelMemoryState {
  const value = (raw ?? {}) as Partial<VillageLevelMemoryState>;
  const byLevel = new Map<VillageLevelMemoryLevel, VillageLevelMemoryEntry>();
  if (Array.isArray(value.entries)) {
    for (const rawEntry of value.entries) {
      if (!rawEntry || typeof rawEntry !== 'object') continue;
      const entry = rawEntry as Partial<VillageLevelMemoryEntry>;
      if (!VILLAGE_LEVEL_MEMORY_LEVELS.includes(entry.level as VillageLevelMemoryLevel)
        || !VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.has(entry.domainId as VillageLevelMemoryDomainId)) continue;
      const level = entry.level as VillageLevelMemoryLevel;
      if (!byLevel.has(level)) byLevel.set(level, { level, domainId: entry.domainId as VillageLevelMemoryDomainId });
    }
  }
  return {
    version: 1,
    entries: VILLAGE_LEVEL_MEMORY_LEVELS.flatMap((level) => {
      const entry = byLevel.get(level);
      return entry ? [entry] : [];
    }),
  };
}

export function villageLevelMemoryProgress(state: VillageLevelMemoryState): VillageLevelMemoryProgress {
  const domainIds = [...new Set(state.entries.map((entry) => entry.domainId))];
  return {
    saved: state.entries.length,
    domains: domainIds.length,
    complete: state.entries.length >= VILLAGE_LEVEL_MEMORY_LEVELS.length,
    domainIds,
  };
}

export function villageLevelMemoryMetrics(progress: VillageLevelMemoryProgress): Record<string, number> {
  return {
    village_level_memories: progress.saved,
    village_level_memory_domains: progress.domains,
  };
}

/** 현재 XP의 가장 큰 출처를 첫 제안으로 사용하되 선택을 강제하지 않는다. */
export function recommendedVillageLevelMemoryDomain(
  breakdown: VillageXpBreakdown,
): VillageLevelMemoryDomainId {
  const candidates: Array<[VillageLevelMemoryDomainId, number]> = [
    ['maker', breakdown.life],
    ['neighbor', breakdown.stories],
    ['explorer', breakdown.collections],
    ['style', breakdown.mastery],
    ['home', breakdown.firstSteps],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0]?.[1] ? candidates[0][0] : 'companion';
}

export type VillageLevelMemoryChooseResult = 'saved' | 'changed' | 'locked' | 'missing';

export class VillageLevelMemoryStore {
  private state: VillageLevelMemoryState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-village-level-memories-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeVillageLevelMemoryState(raw);
    this.persist();
  }

  get(): VillageLevelMemoryState { return this.state; }
  progress(): VillageLevelMemoryProgress { return villageLevelMemoryProgress(this.state); }

  choose(
    level: VillageLevelMemoryLevel,
    domainId: VillageLevelMemoryDomainId,
    currentLevel: number,
  ): VillageLevelMemoryChooseResult {
    if (!VILLAGE_LEVEL_MEMORY_LEVELS.includes(level)
      || !VILLAGE_LEVEL_MEMORY_DOMAIN_BY_ID.has(domainId)) return 'missing';
    if (level > currentLevel) return 'locked';
    const previous = this.state.entries.find((entry) => entry.level === level);
    if (previous?.domainId === domainId) return 'changed';
    this.state = normalizeVillageLevelMemoryState({
      version: 1,
      entries: [...this.state.entries.filter((entry) => entry.level !== level), { level, domainId }],
    });
    this.persist();
    return previous ? 'changed' : 'saved';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
