import { beforeEach, describe, expect, it } from 'vitest';
import { LIFE_MASTERIES, type LifeMasteryId, type LifeMasteryView } from '../src/game/progression/lifeMastery';
import {
  LIFE_SPECIALTY_CARDS, LIFE_SPECIALTY_FEATURED_MAX, LifeSpecialtyStore,
} from '../src/game/progression/lifeSpecialty';
import {
  LIFE_SYNERGIES, lifeSynergyForMasteries, recommendLifeSynergies,
} from '../src/game/progression/lifeSynergies';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const masteryViews = (levels: Partial<Record<LifeMasteryId, number>> = {}): LifeMasteryView[] => LIFE_MASTERIES.map((mastery) => ({
  ...mastery,
  xp: 0,
  level: levels[mastery.id] ?? 1,
  rank: '입문',
  levelXp: 0,
  levelGoal: 60,
  progressPct: 0,
  objectivesDone: 0,
  nextAction: null,
}));

describe('생활 전문성 보드', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('열 분야마다 Lv.2·5·8 자격을 하나씩 총 30장 제공한다', () => {
    expect(LIFE_SPECIALTY_CARDS).toHaveLength(30);
    expect(new Set(LIFE_SPECIALTY_CARDS.map((card) => card.id)).size).toBe(30);
    for (const mastery of LIFE_MASTERIES) {
      const cards = LIFE_SPECIALTY_CARDS.filter((card) => card.masteryId === mastery.id);
      expect(cards.map((card) => card.unlockLevel)).toEqual([2, 5, 8]);
      expect(cards.map((card) => card.tier)).toEqual([1, 2, 3]);
    }
    expect(LIFE_SPECIALTY_FEATURED_MAX).toBe(3);
  });

  it('각 숙련 레벨에 도달한 자격을 자동으로 영구 해금한다', () => {
    const store = new LifeSpecialtyStore('levels');
    expect(store.progress(masteryViews()).unlockedCards).toBe(0);
    expect(store.progress(masteryViews(Object.fromEntries(LIFE_MASTERIES.map((item) => [item.id, 2])))).unlockedCards).toBe(10);
    expect(store.progress(masteryViews(Object.fromEntries(LIFE_MASTERIES.map((item) => [item.id, 5])))).unlockedCards).toBe(20);
    expect(store.progress(masteryViews(Object.fromEntries(LIFE_MASTERIES.map((item) => [item.id, 8]))))).toMatchObject({
      unlockedCards: 30, masteredDomains: 10,
    });
    expect(store.progress(masteryViews())).toMatchObject({ unlockedCards: 30, masteredDomains: 10 });
  });

  it('잠긴 카드는 막고 열린 카드는 비용 없이 대표 전시와 해제를 반복한다', () => {
    const store = new LifeSpecialtyStore('toggle');
    expect(store.toggle('style_1', masteryViews())).toBe('locked');
    const levels = masteryViews({ style: 2 });
    expect(store.toggle('style_1', levels)).toBe('added');
    expect(store.progress(levels)).toMatchObject({ featuredCards: 1, featuredDomains: 1, edits: 1 });
    expect(store.toggle('style_1', levels)).toBe('removed');
    expect(store.progress(levels)).toMatchObject({ featuredCards: 0, edits: 2 });
  });

  it('대표 전문성은 서로 다른 자격 세 장까지만 허용한다', () => {
    const store = new LifeSpecialtyStore('featured');
    const levels = masteryViews({ exploration: 2, style: 2, home: 2, companion: 2 });
    expect(store.toggle('exploration_1', levels)).toBe('added');
    expect(store.toggle('style_1', levels)).toBe('added');
    expect(store.toggle('home_1', levels)).toBe('added');
    expect(store.toggle('companion_1', levels)).toBe('full');
    expect(store.progress(levels)).toMatchObject({ featuredCards: 3, featuredDomains: 3, edits: 3 });
  });

  it('손상된 저장본의 알 수 없는 카드와 네 번째 전시를 안전하게 제거한다', () => {
    localStorage.setItem('hv-life-specialty-v1:safe', JSON.stringify({
      version: 9,
      featuredIds: ['style_1', 'style_1', 'missing', 'home_1', 'companion_1', 'angler_1'],
      edits: -4,
    }));
    const store = new LifeSpecialtyStore('safe');
    expect(store.featuredIds()).toEqual(['style_1', 'home_1', 'companion_1']);
    expect(store.progress(masteryViews({ style: 2, home: 2, companion: 2 }))).toMatchObject({
      featuredCards: 3, featuredDomains: 3, edits: 0,
    });
  });

  it('18개 생활 시너지는 서로 다른 세 분야 조합이며 서명도 중복되지 않는다', () => {
    expect(LIFE_SYNERGIES).toHaveLength(18);
    const signatures = LIFE_SYNERGIES.map((synergy) => [...synergy.domains].sort().join('|'));
    expect(new Set(signatures).size).toBe(18);
    for (const synergy of LIFE_SYNERGIES) {
      expect(new Set(synergy.domains).size).toBe(3);
      expect(lifeSynergyForMasteries(synergy.domains)?.id).toBe(synergy.id);
    }
    expect(lifeSynergyForMasteries(['style', 'style', 'home'])).toBeNull();
  });

  it('대표 세 장의 정확한 조합을 영구 발견하고 다른 덱으로 바꿔도 보존한다', () => {
    const levels = masteryViews({
      exploration: 2, community: 2, performer: 2, style: 2, home: 2, companion: 2,
    });
    const store = new LifeSpecialtyStore('synergy');
    for (const id of ['exploration_1', 'community_1', 'performer_1']) expect(store.toggle(id, levels)).toBe('added');
    expect(store.progress(levels)).toMatchObject({
      currentSynergyId: 'alley_editor', discoveredSynergies: 1, totalSynergies: 18,
    });
    for (const id of ['exploration_1', 'community_1', 'performer_1']) expect(store.toggle(id, levels)).toBe('removed');
    for (const id of ['style_1', 'home_1', 'companion_1']) expect(store.toggle(id, levels)).toBe('added');
    expect(store.progress(levels)).toMatchObject({
      currentSynergyId: 'cozy_curator', discoveredSynergies: 2,
    });
    expect(new Set(store.discoveredSynergyIds())).toEqual(new Set(['alley_editor', 'cozy_curator']));
  });

  it('아직 완성하지 못한 덱에는 현재 분야와 가장 많이 겹치는 조합을 먼저 제안한다', () => {
    const suggestions = recommendLifeSynergies(['style', 'home'], [], 3);
    expect(suggestions).toHaveLength(3);
    expect(suggestions.slice(0, 2).every((synergy) => (
      synergy.domains.includes('style') && synergy.domains.includes('home')
    ))).toBe(true);
  });
});
