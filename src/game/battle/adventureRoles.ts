export type AdventureRoleId = 'guardian' | 'scout' | 'caretaker' | 'researcher';
export type AdventureCharmId =
  | 'warm_blade' | 'soft_guard' | 'alley_breeze' | 'herbal_tea'
  | 'field_notes' | 'steady_rhythm' | 'home_light' | 'golden_star';

export interface AdventureRoleDef {
  id: AdventureRoleId;
  mark: string;
  name: string;
  epithet: string;
  description: string;
  color: string;
  bonuses: readonly string[];
  modifier: Partial<AdventureCombatModifier>;
}

export interface AdventureCharmDef {
  id: AdventureCharmId;
  mark: string;
  name: string;
  description: string;
  unlockLevel: number;
  color: string;
  modifier: Partial<AdventureCombatModifier>;
}

export interface AdventureCombatModifier {
  attackMultiplier: number;
  damageTakenMultiplier: number;
  attackIntervalMultiplier: number;
  xpMultiplier: number;
  healOnKillPct: number;
}

export interface AdventureKitSnapshot {
  roleId: AdventureRoleId;
  charmIds: AdventureCharmId[];
}

export interface AdventureRoleState extends AdventureKitSnapshot {
  version: 1;
  triedRoleIds: AdventureRoleId[];
  presets: Array<AdventureKitSnapshot | null>;
  switches: number;
}

export interface AdventureRoleProgress {
  rolesTried: number;
  charmsUnlocked: number;
  charmsEquipped: number;
  kitsSaved: number;
  switches: number;
}

export type AdventureRoleSelectResult = 'selected' | 'unchanged' | 'invalid';
export type AdventureCharmToggleResult = 'added' | 'removed' | 'full' | 'locked' | 'invalid';
export type AdventureKitResult = 'saved' | 'applied' | 'empty' | 'invalid';

export const ADVENTURE_CHARM_MAX = 2;
export const ADVENTURE_KIT_SLOTS = 3;
export const BASE_ATTACK_INTERVAL_MS = 620;

export const ADVENTURE_ROLES: readonly AdventureRoleDef[] = [
  {
    id: 'guardian', mark: '벽', name: '골목 수호자', epithet: '먼저 버티는 다정한 방패',
    description: '받는 피해를 줄이고 쓰러뜨린 뒤 숨을 고릅니다.', color: '#6d7e80',
    bonuses: ['받는 피해 -25%', '처치 시 체력 4% 회복'],
    modifier: { damageTakenMultiplier: 0.75, healOnKillPct: 0.04 },
  },
  {
    id: 'scout', mark: '풍', name: '바람 길잡이', epithet: '먼저 보고 가볍게 움직이는 칼끝',
    description: '빠른 공격과 작은 공격 보너스로 안전하게 거리를 정리합니다.', color: '#708d78',
    bonuses: ['공격 간격 -20%', '공격력 +8%'],
    modifier: { attackIntervalMultiplier: 0.8, attackMultiplier: 1.08 },
  },
  {
    id: 'caretaker', mark: '잎', name: '숲 돌봄가', epithet: '싸움 뒤의 숨까지 챙기는 손',
    description: '피해를 부드럽게 줄이고 처치할 때마다 크게 회복합니다.', color: '#849360',
    bonuses: ['받는 피해 -10%', '처치 시 체력 12% 회복'],
    modifier: { damageTakenMultiplier: 0.9, healOnKillPct: 0.12 },
  },
  {
    id: 'researcher', mark: '록', name: '생태 기록가', epithet: '관찰을 성장으로 바꾸는 연필',
    description: '관찰 경험을 더 많이 남기며 공격 흐름도 조금 빨라집니다.', color: '#80749b',
    bonuses: ['전투 경험치 +20%', '공격 간격 -5%', '공격력 +4%'],
    modifier: { xpMultiplier: 1.2, attackIntervalMultiplier: 0.95, attackMultiplier: 1.04 },
  },
] as const;

export const ADVENTURE_CHARMS: readonly AdventureCharmDef[] = [
  { id: 'warm_blade', mark: '칼', name: '따뜻한 칼집', description: '공격력 +8%', unlockLevel: 1, color: '#a66a55', modifier: { attackMultiplier: 1.08 } },
  { id: 'soft_guard', mark: '천', name: '폭신한 손목띠', description: '받는 피해 -8%', unlockLevel: 1, color: '#7c8582', modifier: { damageTakenMultiplier: 0.92 } },
  { id: 'alley_breeze', mark: '바', name: '골목 바람표', description: '공격 간격 -8%', unlockLevel: 3, color: '#668b80', modifier: { attackIntervalMultiplier: 0.92 } },
  { id: 'herbal_tea', mark: '차', name: '작은 약초차', description: '처치 시 체력 4% 회복', unlockLevel: 3, color: '#84935f', modifier: { healOnKillPct: 0.04 } },
  { id: 'field_notes', mark: '책', name: '현장 관찰 수첩', description: '전투 경험치 +10%', unlockLevel: 5, color: '#88725f', modifier: { xpMultiplier: 1.1 } },
  { id: 'steady_rhythm', mark: '박', name: '단단한 박자표', description: '공격력 +5% · 공격 간격 -5%', unlockLevel: 5, color: '#9a6c79', modifier: { attackMultiplier: 1.05, attackIntervalMultiplier: 0.95 } },
  { id: 'home_light', mark: '등', name: '귀가 등불', description: '받는 피해 -5% · 처치 회복 +3%', unlockLevel: 8, color: '#b58a55', modifier: { damageTakenMultiplier: 0.95, healOnKillPct: 0.03 } },
  { id: 'golden_star', mark: '별', name: '금빛 관찰별', description: '공격력 +6% · 경험치 +6%', unlockLevel: 10, color: '#b59a54', modifier: { attackMultiplier: 1.06, xpMultiplier: 1.06 } },
] as const;

export const ADVENTURE_ROLE_BY_ID = new Map(ADVENTURE_ROLES.map((role) => [role.id, role]));
export const ADVENTURE_CHARM_BY_ID = new Map(ADVENTURE_CHARMS.map((charm) => [charm.id, charm]));

const validRole = (value: unknown): value is AdventureRoleId =>
  typeof value === 'string' && ADVENTURE_ROLE_BY_ID.has(value as AdventureRoleId);
const validCharm = (value: unknown): value is AdventureCharmId =>
  typeof value === 'string' && ADVENTURE_CHARM_BY_ID.has(value as AdventureCharmId);

const normalizeSnapshot = (raw: unknown): AdventureKitSnapshot => {
  const value = (raw ?? {}) as Partial<AdventureKitSnapshot>;
  return {
    roleId: validRole(value.roleId) ? value.roleId : 'guardian',
    charmIds: Array.isArray(value.charmIds)
      ? [...new Set(value.charmIds.filter(validCharm))].slice(0, ADVENTURE_CHARM_MAX)
      : [],
  };
};

export function normalizeAdventureRoleState(raw: unknown): AdventureRoleState {
  const value = (raw ?? {}) as Partial<AdventureRoleState>;
  const current = normalizeSnapshot(value);
  const triedRoleIds = Array.isArray(value.triedRoleIds)
    ? [...new Set(value.triedRoleIds.filter(validRole))]
    : [];
  if (!triedRoleIds.includes(current.roleId)) triedRoleIds.push(current.roleId);
  const saved = Array.isArray(value.presets)
    ? value.presets.slice(0, ADVENTURE_KIT_SLOTS).map((preset) => preset ? normalizeSnapshot(preset) : null)
    : [];
  while (saved.length < ADVENTURE_KIT_SLOTS) saved.push(null);
  return {
    version: 1,
    ...current,
    triedRoleIds,
    presets: saved,
    switches: Number.isFinite(value.switches) && value.switches! > 0 ? Math.floor(value.switches!) : 0,
  };
}

const multiply = (current: number, value: number | undefined): number =>
  value === undefined ? current : current * value;

export function adventureCombatModifier(state: AdventureRoleState): AdventureCombatModifier {
  const role = ADVENTURE_ROLE_BY_ID.get(state.roleId) ?? ADVENTURE_ROLES[0]!;
  const modifier: AdventureCombatModifier = {
    attackMultiplier: 1,
    damageTakenMultiplier: 1,
    attackIntervalMultiplier: 1,
    xpMultiplier: 1,
    healOnKillPct: 0,
  };
  const apply = (source: Partial<AdventureCombatModifier>) => {
    modifier.attackMultiplier = multiply(modifier.attackMultiplier, source.attackMultiplier);
    modifier.damageTakenMultiplier = multiply(modifier.damageTakenMultiplier, source.damageTakenMultiplier);
    modifier.attackIntervalMultiplier = multiply(modifier.attackIntervalMultiplier, source.attackIntervalMultiplier);
    modifier.xpMultiplier = multiply(modifier.xpMultiplier, source.xpMultiplier);
    modifier.healOnKillPct += source.healOnKillPct ?? 0;
  };
  apply(role.modifier);
  for (const id of state.charmIds) {
    const charm = ADVENTURE_CHARM_BY_ID.get(id);
    if (charm) apply(charm.modifier);
  }
  return {
    attackMultiplier: Math.max(1, modifier.attackMultiplier),
    damageTakenMultiplier: Math.min(1, Math.max(0.5, modifier.damageTakenMultiplier)),
    attackIntervalMultiplier: Math.min(1, Math.max(0.55, modifier.attackIntervalMultiplier)),
    xpMultiplier: Math.max(1, modifier.xpMultiplier),
    healOnKillPct: Math.min(0.3, modifier.healOnKillPct),
  };
}

export function adventureAttackInterval(state: AdventureRoleState): number {
  return Math.round(BASE_ATTACK_INTERVAL_MS * adventureCombatModifier(state).attackIntervalMultiplier);
}

export class AdventureRoleStore {
  private state: AdventureRoleState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-adventure-role-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 현재 세션에서만 유지 */ }
    this.state = normalizeAdventureRoleState(raw);
    this.persist();
  }

  get(): AdventureRoleState { return this.state; }
  role(): AdventureRoleDef { return ADVENTURE_ROLE_BY_ID.get(this.state.roleId) ?? ADVENTURE_ROLES[0]!; }
  modifier(): AdventureCombatModifier { return adventureCombatModifier(this.state); }
  attackInterval(): number { return adventureAttackInterval(this.state); }

  selectRole(roleId: string): AdventureRoleSelectResult {
    if (!validRole(roleId)) return 'invalid';
    if (this.state.roleId === roleId) return 'unchanged';
    this.state = {
      ...this.state,
      roleId,
      triedRoleIds: [...new Set([...this.state.triedRoleIds, roleId])],
      switches: this.state.switches + 1,
    };
    this.persist();
    return 'selected';
  }

  toggleCharm(charmId: string, level: number): AdventureCharmToggleResult {
    if (!validCharm(charmId)) return 'invalid';
    const charm = ADVENTURE_CHARM_BY_ID.get(charmId)!;
    if (level < charm.unlockLevel) return 'locked';
    if (this.state.charmIds.includes(charmId)) {
      this.state = { ...this.state, charmIds: this.state.charmIds.filter((id) => id !== charmId) };
      this.persist();
      return 'removed';
    }
    if (this.state.charmIds.length >= ADVENTURE_CHARM_MAX) return 'full';
    this.state = { ...this.state, charmIds: [...this.state.charmIds, charmId] };
    this.persist();
    return 'added';
  }

  saveKit(index: number): AdventureKitResult {
    if (!Number.isInteger(index) || index < 0 || index >= ADVENTURE_KIT_SLOTS) return 'invalid';
    const presets = [...this.state.presets];
    presets[index] = { roleId: this.state.roleId, charmIds: [...this.state.charmIds] };
    this.state = { ...this.state, presets };
    this.persist();
    return 'saved';
  }

  applyKit(index: number, level: number): AdventureKitResult {
    if (!Number.isInteger(index) || index < 0 || index >= ADVENTURE_KIT_SLOTS) return 'invalid';
    const preset = this.state.presets[index];
    if (!preset) return 'empty';
    const charmIds = preset.charmIds.filter((id) => (ADVENTURE_CHARM_BY_ID.get(id)?.unlockLevel ?? Infinity) <= level);
    const changed = preset.roleId !== this.state.roleId
      || charmIds.join('|') !== this.state.charmIds.join('|');
    this.state = {
      ...this.state,
      roleId: preset.roleId,
      charmIds,
      triedRoleIds: [...new Set([...this.state.triedRoleIds, preset.roleId])],
      switches: this.state.switches + Number(changed),
    };
    this.persist();
    return 'applied';
  }

  progress(level: number): AdventureRoleProgress {
    return {
      rolesTried: this.state.triedRoleIds.length,
      charmsUnlocked: ADVENTURE_CHARMS.filter((charm) => level >= charm.unlockLevel).length,
      charmsEquipped: this.state.charmIds.length,
      kitsSaved: this.state.presets.filter(Boolean).length,
      switches: this.state.switches,
    };
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션에서만 유지 */ }
  }
}
