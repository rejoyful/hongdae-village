import { beforeEach, describe, expect, it } from 'vitest';
import {
  RESIDENT_FAN_RIBBONS,
  RESIDENT_FAVORITE_MAX,
  ResidentFanbookStore,
  normalizeResidentFanbookState,
  residentFanView,
  residentFanbookProgress,
} from '../src/game/residents/residentFanbook';
import type { TrustState } from '../src/game/residents/residents';
import { QUEST_BY_ID, RESIDENT_FANBOOK_QUESTS } from '../src/game/quests';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const trust = (entries: Record<string, number>): TrustState => Object.fromEntries(
  Object.entries(entries).map(([id, value]) => [id, { v: value, day: '2026-07-23' }]),
);

describe('최애 주민 응원 팬북', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('손상된 저장값에서 실제 주민만 중복 없이 세 자리까지 복구한다', () => {
    expect(normalizeResidentFanbookState({
      favorites: ['haneul', 'haneul', 'missing', 'moturi', 'sallim', 'jun'],
    })).toEqual({ version: 1, favorites: ['haneul', 'moturi', 'sallim'] });
    expect(normalizeResidentFanbookState({ favorites: 3 })).toEqual({ version: 1, favorites: [] });
  });

  it('최애·차애·마음친구 세 자리를 저장하고 네 번째는 안전하게 막는다', () => {
    const store = new ResidentFanbookStore('fan');
    expect(store.toggle('haneul')).toBe('added');
    expect(store.toggle('moturi')).toBe('added');
    expect(store.toggle('sallim')).toBe('added');
    expect(store.toggle('jun')).toBe('full');
    expect(store.get().favorites).toHaveLength(RESIDENT_FAVORITE_MAX);
    expect(new ResidentFanbookStore('fan').get().favorites).toEqual(['haneul', 'moturi', 'sallim']);
  });

  it('응원 해제와 최애 승격은 관계 기록을 건드리지 않는다', () => {
    const store = new ResidentFanbookStore('fan');
    store.toggle('haneul'); store.toggle('moturi'); store.toggle('sallim');
    expect(store.promote('sallim')).toBe('promoted');
    expect(store.get().favorites).toEqual(['sallim', 'haneul', 'moturi']);
    expect(store.toggle('haneul')).toBe('removed');
    expect(store.get().favorites).toEqual(['sallim', 'moturi']);
  });

  it('신뢰 단계마다 다섯 응원 리본을 소급 해금한다', () => {
    const state = normalizeResidentFanbookState({ favorites: ['haneul'] });
    const view = residentFanView('haneul', state, trust({ haneul: 80 }))!;
    expect(view.favoriteLabel).toBe('최애');
    expect(view.unlockedRibbons).toBe(4);
    expect(view.nextRibbon?.threshold).toBe(100);
    expect(view.ribbons.map((ribbon) => ribbon.unlocked)).toEqual([true, true, true, true, false]);
  });

  it('응원 슬롯과 무관하게 열 주민의 리본 아카이브를 집계한다', () => {
    const state = normalizeResidentFanbookState({ favorites: ['haneul'] });
    expect(residentFanbookProgress(state, trust({ haneul: 100, moturi: 50, sallim: 15 }))).toEqual({
      favorites: 1,
      ribbons: 9,
      ribbonResidents: 3,
      completedResidents: 1,
      totalRibbons: 50,
    });
  });

  it('모든 리본은 서로 다른 단계와 친절한 설명을 가진다', () => {
    expect(new Set(RESIDENT_FAN_RIBBONS.map((ribbon) => ribbon.threshold)).size).toBe(5);
    expect(RESIDENT_FAN_RIBBONS.every((ribbon) => ribbon.name.length > 4 && ribbon.note.length > 8)).toBe(true);
  });

  it('첫 응원석부터 열 주민 전권까지 일곱 장기 퀘스트가 이어진다', () => {
    expect(RESIDENT_FANBOOK_QUESTS).toHaveLength(7);
    expect(QUEST_BY_ID.get('story_resident_fan_first')).toMatchObject({
      registryKey: 'resident_fan_favorites', goal: 1,
    });
    expect(QUEST_BY_ID.get('master_resident_fan_ten')).toMatchObject({
      registryKey: 'resident_fan_completed', goal: 10,
      prerequisite: 'collect_resident_fan_everyone',
    });
  });
});
