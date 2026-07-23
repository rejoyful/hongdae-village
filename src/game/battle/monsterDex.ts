import { MONSTERS, MONSTER_MAP, type MonsterSpecies } from './monsters';

interface MonsterDexState {
  version: 1;
  kills: Record<string, number>;
  bestStreak: number;
  totalShards: number;
}

export interface MonsterDexEntry {
  species: MonsterSpecies;
  kills: number;
  discovered: boolean;
}

export interface MonsterKillRecord {
  firstDiscovery: boolean;
  speciesKills: number;
  discovered: number;
  currentStreak: number;
  bestStreak: number;
}

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function normalizeMonsterDex(raw: unknown): MonsterDexState {
  const value = (raw ?? {}) as Partial<MonsterDexState>;
  const kills: Record<string, number> = {};
  if (value.kills && typeof value.kills === 'object') {
    for (const [id, count] of Object.entries(value.kills)) {
      if (MONSTER_MAP.has(id)) kills[id] = cleanCount(count);
    }
  }
  return {
    version: 1,
    kills,
    bestStreak: cleanCount(value.bestStreak),
    totalShards: cleanCount(value.totalShards),
  };
}

/**
 * 몬스터 연구 노트. 서버 경제와 무관한 발견·처치 기록만 로컬에 저장한다.
 * 현재 연속 처치는 세션 값이며, 최고 기록만 기기에 남긴다.
 */
export class MonsterDexStore {
  private state: MonsterDexState;
  private currentStreak = 0;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-monster-dex-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 없으면 세션 기록만 유지 */ }
    this.state = normalizeMonsterDex(raw);
  }

  recordKill(speciesId: string): MonsterKillRecord | null {
    if (!MONSTER_MAP.has(speciesId)) return null;
    const before = this.state.kills[speciesId] ?? 0;
    this.currentStreak += 1;
    this.state = {
      ...this.state,
      kills: { ...this.state.kills, [speciesId]: before + 1 },
      bestStreak: Math.max(this.state.bestStreak, this.currentStreak),
    };
    this.persist();
    return {
      firstDiscovery: before === 0,
      speciesKills: before + 1,
      discovered: this.discovered,
      currentStreak: this.currentStreak,
      bestStreak: this.state.bestStreak,
    };
  }

  addShards(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.state = { ...this.state, totalShards: this.state.totalShards + Math.floor(amount) };
    this.persist();
  }

  breakStreak(): void { this.currentStreak = 0; }

  get discovered(): number {
    return Object.values(this.state.kills).filter((count) => count > 0).length;
  }

  get bestStreak(): number { return this.state.bestStreak; }
  get streak(): number { return this.currentStreak; }
  get totalShards(): number { return this.state.totalShards; }

  views(): MonsterDexEntry[] {
    return MONSTERS.map((species) => {
      const kills = this.state.kills[species.id] ?? 0;
      return { species, kills, discovered: kills > 0 };
    });
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
