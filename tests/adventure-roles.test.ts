import { beforeEach, describe, expect, it } from 'vitest';
import {
  ADVENTURE_CHARMS,
  AdventureRoleStore,
  adventureAttackInterval,
  adventureCombatModifier,
  normalizeAdventureRoleState,
} from '../src/game/battle/adventureRoles';
import { ADVENTURE_ROLE_QUESTS, QUEST_BY_ID } from '../src/game/quests';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('골목 원정 역할과 키트', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('손상된 역할·부적·세팅을 안전한 기본 수호자로 복구한다', () => {
    expect(normalizeAdventureRoleState({
      roleId: 'missing', charmIds: ['warm_blade', 'warm_blade', 'missing', 'soft_guard'],
      triedRoleIds: ['missing'], presets: [{ roleId: 'scout', charmIds: ['alley_breeze'] }],
    })).toMatchObject({
      roleId: 'guardian', charmIds: ['warm_blade', 'soft_guard'], triedRoleIds: ['guardian'],
      presets: [{ roleId: 'scout', charmIds: ['alley_breeze'] }, null, null],
    });
  });

  it('네 역할을 비용 없이 바꾸며 시도한 역할을 영구 기록한다', () => {
    const store = new AdventureRoleStore('role');
    expect(store.selectRole('scout')).toBe('selected');
    expect(store.selectRole('caretaker')).toBe('selected');
    expect(store.selectRole('researcher')).toBe('selected');
    expect(store.selectRole('guardian')).toBe('selected');
    expect(store.progress(1)).toMatchObject({ rolesTried: 4, switches: 4 });
  });

  it('레벨 조건과 두 부적 제한을 친절하게 지킨다', () => {
    const store = new AdventureRoleStore('charms');
    expect(store.toggleCharm('alley_breeze', 1)).toBe('locked');
    expect(store.toggleCharm('warm_blade', 1)).toBe('added');
    expect(store.toggleCharm('soft_guard', 1)).toBe('added');
    expect(store.toggleCharm('alley_breeze', 3)).toBe('full');
    expect(store.toggleCharm('warm_blade', 3)).toBe('removed');
    expect(store.toggleCharm('alley_breeze', 3)).toBe('added');
  });

  it('세 개 원정 키트를 저장하고 손실 없이 다시 적용한다', () => {
    const store = new AdventureRoleStore('kits');
    store.selectRole('scout'); store.toggleCharm('warm_blade', 10); store.toggleCharm('golden_star', 10);
    expect(store.saveKit(0)).toBe('saved');
    store.selectRole('guardian'); store.toggleCharm('warm_blade', 10);
    expect(store.applyKit(0, 10)).toBe('applied');
    expect(store.get()).toMatchObject({ roleId: 'scout', charmIds: ['warm_blade', 'golden_star'] });
    expect(store.progress(10).kitsSaved).toBe(1);
  });

  it('역할과 부적 보너스를 실제 전투 수치로 합성한다', () => {
    const state = normalizeAdventureRoleState({
      roleId: 'scout', charmIds: ['warm_blade', 'alley_breeze'],
    });
    const modifier = adventureCombatModifier(state);
    expect(modifier.attackMultiplier).toBeCloseTo(1.1664);
    expect(modifier.attackIntervalMultiplier).toBeCloseTo(0.736);
    expect(adventureAttackInterval(state)).toBe(456);
  });

  it('여덟 부적은 레벨 1부터 10까지 순차 해금된다', () => {
    expect(ADVENTURE_CHARMS).toHaveLength(8);
    expect(ADVENTURE_CHARMS.map((charm) => charm.unlockLevel)).toEqual([1, 1, 3, 3, 5, 5, 8, 10]);
  });

  it('첫 역할 변경부터 여덟 부적 전권까지 여섯 성장 퀘스트가 이어진다', () => {
    expect(ADVENTURE_ROLE_QUESTS).toHaveLength(6);
    expect(QUEST_BY_ID.get('story_adventure_role_first')).toMatchObject({
      registryKey: 'adventure_roles_tried', goal: 2,
    });
    expect(QUEST_BY_ID.get('master_adventure_charms_8')).toMatchObject({
      registryKey: 'adventure_charms_unlocked', goal: 8,
      prerequisite: 'collect_adventure_roles_4',
    });
  });
});
