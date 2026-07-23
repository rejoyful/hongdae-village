import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import {
  MUSEUM_EXHIBITS, MUSEUM_FEATURED_MAX, MUSEUM_WINGS, NeighborhoodMuseumStore,
  claimMuseumExhibit, freshNeighborhoodMuseumState, neighborhoodMuseumExhibitViews,
  neighborhoodMuseumProgress, neighborhoodMuseumWingViews, normalizeNeighborhoodMuseumState,
  recommendedMuseumExhibit, toggleMuseumFeature,
} from '../src/game/museum/neighborhoodMuseum';

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
});

const freshQuest = () => normalizeState(null, '2026-07-23');

describe('골목 작은 박물관', () => {
  it('여덟 전시관에 초급·중급·완성 기념품 24점을 둔다', () => {
    expect(MUSEUM_WINGS).toHaveLength(8);
    expect(MUSEUM_EXHIBITS).toHaveLength(24);
    expect(new Set(MUSEUM_EXHIBITS.map((exhibit) => exhibit.id)).size).toBe(24);
    for (const wing of MUSEUM_WINGS) {
      expect(MUSEUM_EXHIBITS.filter((exhibit) => exhibit.wing === wing.id).map((exhibit) => exhibit.tier)).toEqual([1, 2, 3]);
    }
  });

  it('과거 평생 기록을 소급해 준비 상태와 다음 단서를 계산한다', () => {
    let quests = freshQuest();
    quests = setQuestMetric(quests, 'customize_save', 1);
    quests = setQuestMetric(quests, 'fashion_dye', 1);
    quests = setQuestMetric(quests, 'lookbook_entries', 4);
    const state = freshNeighborhoodMuseumState();
    const first = neighborhoodMuseumExhibitViews(state, quests).find((exhibit) => exhibit.id === 'first_thread')!;
    const ribbon = neighborhoodMuseumExhibitViews(state, quests).find((exhibit) => exhibit.id === 'lookbook_ribbon')!;
    expect(first).toMatchObject({ ready: true, progressPct: 100, completedRequirements: 2 });
    expect(ribbon.nextRequirement).toMatchObject({ key: 'lookbook_entries', current: 4, goal: 6, progressPct: 67 });
  });

  it('준비된 기념품만 한 번 수령하며 전시관 완성을 판정한다', () => {
    let quests = freshQuest();
    for (const exhibit of MUSEUM_EXHIBITS.filter((candidate) => candidate.wing === 'style')) {
      for (const requirement of exhibit.requirements) quests = setQuestMetric(quests, requirement.key, requirement.goal);
    }
    const state = freshNeighborhoodMuseumState();
    expect(claimMuseumExhibit(state, 'first_thread', quests, 10)).toMatchObject({ ok: true, firstInWing: true, wingComplete: false });
    expect(claimMuseumExhibit(state, 'first_thread', quests)).toEqual({ ok: false, reason: 'already-claimed' });
    expect(claimMuseumExhibit(state, 'lookbook_ribbon', quests)).toMatchObject({ ok: true, firstInWing: false, wingComplete: false });
    expect(claimMuseumExhibit(state, 'atelier_archive', quests)).toMatchObject({ ok: true, wingComplete: true });
    expect(neighborhoodMuseumWingViews(state, quests).find((wing) => wing.id === 'style')).toMatchObject({ claimed: 3, completed: true });
  });

  it('대표 진열은 수령한 기념품 여섯 점까지만 고르고 언제든 뺄 수 있다', () => {
    const state = freshNeighborhoodMuseumState();
    state.claimedExhibitIds = MUSEUM_EXHIBITS.slice(0, 7).map((exhibit) => exhibit.id);
    for (const exhibit of MUSEUM_EXHIBITS.slice(0, MUSEUM_FEATURED_MAX)) expect(toggleMuseumFeature(state, exhibit.id)).toBe('featured');
    expect(toggleMuseumFeature(state, MUSEUM_EXHIBITS[6]!.id)).toBe('full');
    expect(toggleMuseumFeature(state, MUSEUM_EXHIBITS[0]!.id)).toBe('removed');
    expect(toggleMuseumFeature(state, MUSEUM_EXHIBITS[6]!.id)).toBe('featured');
    expect(toggleMuseumFeature(state, MUSEUM_EXHIBITS.at(-1)!.id)).toBe('locked');
  });

  it('준비 완료를 먼저, 그다음 가장 가까운 미수령 기념품을 추천한다', () => {
    let quests = freshQuest();
    quests = setQuestMetric(quests, 'visit_home', 1);
    quests = setQuestMetric(quests, 'q_place', 4);
    quests = setQuestMetric(quests, 'customize_save', 1);
    const state = freshNeighborhoodMuseumState();
    expect(recommendedMuseumExhibit(state, quests)?.id).toBe('room_key');
    state.claimedExhibitIds = ['room_key'];
    expect(recommendedMuseumExhibit(state, quests)?.id).toBe('first_thread');
  });

  it('진행 요약은 전시품·전시관·단서·준비 수를 함께 보여 준다', () => {
    let quests = freshQuest();
    for (const requirement of MUSEUM_EXHIBITS[0]!.requirements) quests = setQuestMetric(quests, requirement.key, requirement.goal);
    const state = freshNeighborhoodMuseumState();
    claimMuseumExhibit(state, MUSEUM_EXHIBITS[0]!.id, quests);
    toggleMuseumFeature(state, MUSEUM_EXHIBITS[0]!.id);
    expect(neighborhoodMuseumProgress(state, quests)).toMatchObject({
      exhibits: 1, totalExhibits: 24, featured: 1, featuredMax: 6, completedWings: 0, totalWings: 8,
    });
  });

  it('손상된 저장값을 정리하고 사용자별 상태를 분리한다', () => {
    expect(normalizeNeighborhoodMuseumState({
      claimedExhibitIds: ['first_thread', 'first_thread', 'broken'],
      featuredExhibitIds: ['first_thread', 'room_key', 'first_thread'],
      lastClaimedAt: -1,
    })).toEqual({ version: 1, claimedExhibitIds: ['first_thread'], featuredExhibitIds: ['first_thread'], lastClaimedAt: 0 });
    const a = new NeighborhoodMuseumStore('a');
    const b = new NeighborhoodMuseumStore('b');
    let quests = freshQuest();
    for (const requirement of MUSEUM_EXHIBITS[0]!.requirements) quests = setQuestMetric(quests, requirement.key, requirement.goal);
    expect(a.claim('first_thread', quests).ok).toBe(true);
    expect(b.get().claimedExhibitIds).toEqual([]);
  });
});
