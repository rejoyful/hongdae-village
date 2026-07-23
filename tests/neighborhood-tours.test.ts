import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric, type QuestState } from '../src/game/questProgress';
import {
  NEIGHBORHOOD_TOURS, NeighborhoodTourStore, claimNeighborhoodTour, freshNeighborhoodTourState,
  neighborhoodTourProgress, neighborhoodTourViews, normalizeNeighborhoodTourState,
  recommendedNeighborhoodTour,
} from '../src/game/guidance/neighborhoodTours';

class MemStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

const fresh = (): QuestState => normalizeState(null, '2026-07-23');
const withMetrics = (values: Record<string, number>): QuestState => Object.entries(values)
  .reduce((state, [key, value]) => setQuestMetric(state, key, value), fresh());

describe('골목 소풍 안내소', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('12개 코스가 6개 기분과 48개 실제 활동 정류장을 제공한다', () => {
    expect(NEIGHBORHOOD_TOURS).toHaveLength(12);
    expect(new Set(NEIGHBORHOOD_TOURS.map((tour) => tour.id)).size).toBe(12);
    expect(new Set(NEIGHBORHOOD_TOURS.map((tour) => tour.mood)).size).toBe(6);
    expect(NEIGHBORHOOD_TOURS.every((tour) => tour.stops.length === 4)).toBe(true);
    expect(NEIGHBORHOOD_TOURS.flatMap((tour) => tour.stops).every((stop) => stop.goal > 0 && stop.activity)).toBe(true);
  });

  it('과거 평생 기록을 소급해 정류장과 엽서 준비 상태를 계산한다', () => {
    const quests = withMetrics({ q_cafe: 1, photo_taken: 1, customize_save: 1, visit_home: 1 });
    const view = neighborhoodTourViews(freshNeighborhoodTourState(), quests).find((tour) => tour.id === 'first_afternoon')!;
    expect(view).toMatchObject({ completedStops: 4, progressPct: 100, ready: true, claimed: false });
    expect(view.nextStop).toBeNull();
  });

  it('준비 전에는 엽서를 찍지 않고 준비 뒤 한 번만 영구 기록한다', () => {
    const state = freshNeighborhoodTourState();
    expect(claimNeighborhoodTour(state, 'first_afternoon', fresh())).toMatchObject({ ok: false, reason: 'not-ready' });
    const quests = withMetrics({ q_cafe: 1, photo_taken: 1, customize_save: 1, visit_home: 1 });
    expect(claimNeighborhoodTour(state, 'first_afternoon', quests, 123)).toMatchObject({ ok: true, firstMood: true, collectionComplete: false });
    expect(state).toMatchObject({ claimedTourIds: ['first_afternoon'], lastClaimedAt: 123 });
    expect(claimNeighborhoodTour(state, 'first_afternoon', quests)).toMatchObject({ ok: false, reason: 'already-claimed' });
  });

  it('관심 코스를 우선 추천하고 없으면 가장 가까운 미완주 코스를 고른다', () => {
    const state = freshNeighborhoodTourState();
    state.pinnedTourId = 'paw_steps';
    const quests = withMetrics({ q_cafe: 1, photo_taken: 1, customize_save: 1 });
    expect(recommendedNeighborhoodTour(state, quests)?.id).toBe('paw_steps');
    state.pinnedTourId = null;
    expect(recommendedNeighborhoodTour(state, quests)?.id).toBe('first_afternoon');
  });

  it('엽서·기분·준비·정류장 수집 진척을 분리한다', () => {
    const state = freshNeighborhoodTourState();
    state.claimedTourIds = ['first_afternoon', 'thread_walk', 'paw_steps'];
    const progress = neighborhoodTourProgress(state, withMetrics({ q_cafe: 2, photo_taken: 2, customize_save: 1, visit_home: 1 }));
    expect(progress).toMatchObject({ postcards: 3, totalPostcards: 12, moods: 3, totalMoods: 6, totalStops: 48 });
    expect(progress.completedStops).toBeGreaterThanOrEqual(4);
  });

  it('손상 저장값을 정리하고 사용자별 관심 코스와 엽서를 분리한다', () => {
    expect(normalizeNeighborhoodTourState({ claimedTourIds: ['first_afternoon', 'bad', 'first_afternoon', 3], pinnedTourId: 'bad', lastClaimedAt: -3 }))
      .toEqual({ version: 1, claimedTourIds: ['first_afternoon'], pinnedTourId: null, lastClaimedAt: 0 });
    const store = new NeighborhoodTourStore('a');
    expect(store.pin('thread_walk')).toBe(true);
    expect(store.get().pinnedTourId).toBe('thread_walk');
    expect(new NeighborhoodTourStore('a').get().pinnedTourId).toBe('thread_walk');
    expect(new NeighborhoodTourStore('b').get().pinnedTourId).toBeNull();
  });
});
