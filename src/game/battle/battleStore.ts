import { gainXp, deathPenalty, type Progress } from './combat';
import { tierQuota, MAX_TIER } from './monsters';

/** 전투 진행 저장 (로컬 SSOT): 레벨·경험치·티어·처치수·무기 */
const LEGACY_KEY = 'hv-battle-v1';
const KEY_PREFIX = 'hv-battle-v1-';
const MIGRATION_OWNER_KEY = 'hv-battle-v1-migration-owner';

interface BattleState {
  level: number;
  xp: number;
  tier: number;
  killsInTier: number;
  totalKills: number;
  weapons: string[];   // 보유 무기 id
  equipped: string;    // 장착 무기 id
}

function normalize(raw: unknown): BattleState {
  const r = (raw ?? {}) as Partial<BattleState>;
  return {
    level: Number.isFinite(r.level) && r.level! >= 1 ? Math.floor(r.level!) : 1,
    xp: Number.isFinite(r.xp) && r.xp! >= 0 ? Math.floor(r.xp!) : 0,
    tier: Number.isFinite(r.tier) && r.tier! >= 1 ? Math.min(Math.floor(r.tier!), MAX_TIER) : 1,
    killsInTier: Number.isFinite(r.killsInTier) && r.killsInTier! >= 0 ? Math.floor(r.killsInTier!) : 0,
    totalKills: Number.isFinite(r.totalKills) && r.totalKills! >= 0 ? Math.floor(r.totalKills!) : 0,
    weapons: Array.isArray(r.weapons) && r.weapons.length ? r.weapons.filter((x): x is string => typeof x === 'string') : ['fist'],
    equipped: typeof r.equipped === 'string' ? r.equipped : 'fist',
  };
}

function loadForUser(storeKey: string, userId: string): BattleState {
  try {
    const current = localStorage.getItem(storeKey);
    if (current) return normalize(JSON.parse(current));
    const legacy = localStorage.getItem(LEGACY_KEY);
    const migrationOwner = localStorage.getItem(MIGRATION_OWNER_KEY);
    if (legacy && (!migrationOwner || migrationOwner === userId)) {
      const migrated = normalize(JSON.parse(legacy));
      localStorage.setItem(storeKey, JSON.stringify(migrated));
      localStorage.setItem(MIGRATION_OWNER_KEY, userId);
      return migrated;
    }
  } catch { /* 손상 저장·저장소 차단은 새 진행으로 복구 */ }
  return normalize(null);
}

export class BattleStore {
  private s: BattleState;
  private readonly storeKey: string;

  constructor(userId = 'offline') {
    this.storeKey = KEY_PREFIX + userId;
    this.s = loadForUser(this.storeKey, userId);
  }

  private save(): void { try { localStorage.setItem(this.storeKey, JSON.stringify(this.s)); } catch { /* 무시 */ } }

  /** 서버 동기 — 스냅샷/복원 */
  snapshot(): BattleState { return this.s; }
  hydrate(raw: unknown): void {
    const r = (raw ?? {}) as Record<string, unknown>;
    this.s = {
      level: Number.isFinite(r.level) && (r.level as number) >= 1 ? r.level as number : 1,
      xp: Number.isFinite(r.xp) && (r.xp as number) >= 0 ? r.xp as number : 0,
      tier: Number.isFinite(r.tier) && (r.tier as number) >= 1 ? Math.min(r.tier as number, MAX_TIER) : 1,
      killsInTier: Number.isFinite(r.killsInTier) && (r.killsInTier as number) >= 0 ? r.killsInTier as number : 0,
      totalKills: Number.isFinite(r.totalKills) ? r.totalKills as number : 0,
      weapons: Array.isArray(r.weapons) && r.weapons.length ? (r.weapons as unknown[]).filter((x): x is string => typeof x === 'string') : ['fist'],
      equipped: typeof r.equipped === 'string' ? r.equipped : 'fist',
    };
    this.save();
  }

  progress(): Progress { return { level: this.s.level, xp: this.s.xp }; }
  get level(): number { return this.s.level; }
  get xp(): number { return this.s.xp; }
  get tier(): number { return this.s.tier; }
  get killsInTier(): number { return this.s.killsInTier; }
  get quota(): number { return tierQuota(this.s.tier); }
  get totalKills(): number { return this.s.totalKills; }
  weaponsOwned(): string[] { return [...this.s.weapons]; }
  isWeaponOwned(id: string): boolean { return this.s.weapons.includes(id); }
  equippedId(): string { return this.s.equipped; }

  /** 몬스터 처치 — 경험치 + 티어 진행. 반환: 레벨업 수 · 티어 상승 여부 */
  onKill(xp: number): { leveledUp: number; tierUp: boolean; newTier: number } {
    const g = gainXp({ level: this.s.level, xp: this.s.xp }, xp);
    this.s.level = g.next.level; this.s.xp = g.next.xp;
    this.s.totalKills += 1;
    let tierUp = false;
    if (this.s.tier < MAX_TIER) {
      this.s.killsInTier += 1;
      if (this.s.killsInTier >= tierQuota(this.s.tier)) {
        this.s.tier += 1; this.s.killsInTier = 0; tierUp = true;
      }
    }
    this.save();
    return { leveledUp: g.leveledUp, tierUp, newTier: this.s.tier };
  }

  /** 사망 — 경험치 감소 */
  onDeath(): void {
    const p = deathPenalty({ level: this.s.level, xp: this.s.xp });
    this.s.level = p.level; this.s.xp = p.xp;
    this.save();
  }

  buyWeapon(id: string): void {
    if (!this.s.weapons.includes(id)) { this.s.weapons.push(id); this.save(); }
  }

  equip(id: string): void {
    if (this.s.weapons.includes(id)) { this.s.equipped = id; this.save(); }
  }
}
