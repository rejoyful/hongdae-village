import { describe, it, expect } from 'vitest';
import {
  xpToNext, maxHpForLevel, baseAtkForLevel, totalAtk, gainXp, deathPenalty, FATIGUE_MS,
} from '../src/game/battle/combat';
import { MONSTERS, monstersOfTier, tierQuota, MAX_TIER } from '../src/game/battle/monsters';
import { WEAPONS, weaponById } from '../src/game/battle/weapons';

describe('전투·성장 곡선', () => {
  it('경험치 곡선은 가파르게 증가한다 (너무 쉽지 않게)', () => {
    expect(xpToNext(1)).toBe(40);
    for (let l = 1; l < 30; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
    // 레벨이 오를수록 요구치가 크게 늘어난다
    expect(xpToNext(10)).toBeGreaterThan(xpToNext(5) * 2);
  });

  it('체력·공격력은 레벨에 비례한다', () => {
    expect(maxHpForLevel(1)).toBe(40);
    expect(maxHpForLevel(5)).toBe(88);
    expect(baseAtkForLevel(1)).toBe(4);
    expect(baseAtkForLevel(5)).toBeGreaterThan(baseAtkForLevel(1));
  });

  it('총 공격력에 무기가 더해지고, 피로 시 절반', () => {
    expect(totalAtk(1, 10)).toBe(14);           // 4 + 10
    expect(totalAtk(1, 10, true)).toBe(7);      // 절반
    expect(totalAtk(1, 0, true)).toBeGreaterThanOrEqual(1); // 최소 1
  });

  it('경험치 획득으로 레벨업하고 넘침이 이월된다', () => {
    expect(gainXp({ level: 1, xp: 0 }, 40)).toEqual({ next: { level: 2, xp: 0 }, leveledUp: 1 });
    expect(gainXp({ level: 1, xp: 0 }, 45).next).toEqual({ level: 2, xp: 5 });
    const big = gainXp({ level: 1, xp: 0 }, 100000);
    expect(big.leveledUp).toBeGreaterThan(5);
  });

  it('사망 패널티는 경험치를 깎고 0에서 멈춘다', () => {
    const p = deathPenalty({ level: 3, xp: 100 });
    expect(p.level).toBe(3);
    expect(p.xp).toBeLessThan(100);
    expect(deathPenalty({ level: 3, xp: 0 }).xp).toBe(0); // 음수 안 됨
    expect(FATIGUE_MS).toBeGreaterThan(0);
  });
});

describe('몬스터·무기 데이터', () => {
  it('30종 6티어, 티어당 5종', () => {
    expect(MONSTERS).toHaveLength(30);
    for (let t = 1; t <= MAX_TIER; t++) expect(monstersOfTier(t)).toHaveLength(5);
    // id 중복 없음
    expect(new Set(MONSTERS.map((m) => m.id)).size).toBe(30);
  });

  it('티어가 오를수록 몬스터가 강하다', () => {
    const avg = (t: number, k: 'hp' | 'atk' | 'xp') =>
      monstersOfTier(t).reduce((s, m) => s + m[k], 0) / 5;
    for (let t = 1; t < MAX_TIER; t++) {
      expect(avg(t + 1, 'hp')).toBeGreaterThan(avg(t, 'hp'));
      expect(avg(t + 1, 'atk')).toBeGreaterThan(avg(t, 'atk'));
      expect(avg(t + 1, 'xp')).toBeGreaterThan(avg(t, 'xp'));
    }
  });

  it('티어 할당량은 수십 마리대로 증가한다', () => {
    expect(tierQuota(1)).toBe(20);
    expect(tierQuota(6)).toBe(45);
    for (let t = 1; t < MAX_TIER; t++) expect(tierQuota(t + 1)).toBeGreaterThan(tierQuota(t));
  });

  it('무기는 공격력·가격이 함께 오르고 맨손이 기본', () => {
    expect(weaponById(null).id).toBe('fist');
    expect(weaponById('nope').id).toBe('fist');
    const paid = WEAPONS.filter((w) => w.price > 0);
    for (let i = 1; i < paid.length; i++) {
      expect(paid[i]!.atk).toBeGreaterThan(paid[i - 1]!.atk);
      expect(paid[i]!.price).toBeGreaterThan(paid[i - 1]!.price);
    }
  });
});

describe('레벨 호칭', () => {
  it('레벨 구간마다 호칭이 오른다', async () => {
    const { titleForLevel, isTitleUpAt, TITLES } = await import('../src/game/battle/titles');
    expect(titleForLevel(1)).toBe('새내기 모험가');
    expect(titleForLevel(5)).toBe('견습 사냥꾼');
    expect(titleForLevel(50)).toBe('전설의 영웅');
    expect(titleForLevel(999)).toBe('전설의 영웅');
    // 단조 증가(높은 레벨 호칭이 낮은 레벨과 같거나 더 상위)
    let seen = -1;
    for (const t of TITLES) { expect(t.minLevel).toBeGreaterThan(seen); seen = t.minLevel; }
    expect(isTitleUpAt(5)).toBe(true);
    expect(isTitleUpAt(6)).toBe(false);
  });
});

describe('레벨 간지(오라) 등급', () => {
  it('레벨이 오를수록 간지 등급이 오른다', async () => {
    const { swagTier } = await import('../src/game/battle/swag');
    expect(swagTier(1)).toBe(0);
    expect(swagTier(4)).toBe(0);
    expect(swagTier(5)).toBe(1);
    expect(swagTier(10)).toBe(2);
    expect(swagTier(20)).toBe(3);
    expect(swagTier(35)).toBe(4);
    expect(swagTier(50)).toBe(5);
    expect(swagTier(999)).toBe(5);
    for (let l = 1; l < 60; l++) expect(swagTier(l + 1)).toBeGreaterThanOrEqual(swagTier(l));
  });
});
