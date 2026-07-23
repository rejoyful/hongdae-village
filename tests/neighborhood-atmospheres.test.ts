import { beforeEach, describe, expect, it } from 'vitest';
import type { QuestState } from '../src/game/questProgress';
import { NEIGHBORHOOD_ATMOSPHERE_QUESTS, QUEST_BY_ID } from '../src/game/quests';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';
import {
  NEIGHBORHOOD_ATMOSPHERES,
  NeighborhoodAtmosphereStore,
  freshNeighborhoodAtmosphereState,
  neighborhoodAtmosphereProgress,
  neighborhoodAtmosphereViews,
  normalizeNeighborhoodAtmosphereState,
} from '../src/game/world/neighborhoodAtmospheres';

const memory = new Map<string, string>();
const quests = (counts: Record<string, number> = {}): QuestState => ({
  version: 2,
  day: '2026-07-23',
  counts: {},
  claimed: [],
  lifetimeCounts: counts,
});

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    },
  });
});

describe('골목 분위기 관측소', () => {
  it('서로 다른 8개 효과와 고유한 기억·기념품을 제공한다', () => {
    expect(NEIGHBORHOOD_ATMOSPHERES).toHaveLength(8);
    expect(new Set(NEIGHBORHOOD_ATMOSPHERES.map((item) => item.effect)).size).toBe(8);
    expect(new Set(NEIGHBORHOOD_ATMOSPHERES.map((item) => item.memory)).size).toBe(8);
    expect(new Set(NEIGHBORHOOD_ATMOSPHERES.map((item) => item.keepsake)).size).toBe(8);
    expect(NEIGHBORHOOD_ATMOSPHERES.slice(1).every((item) => item.requirements.length === 2)).toBe(true);
  });

  it('일곱 영구 퀘스트와 실제 관측소 길 안내를 같은 지표로 연결한다', () => {
    expect(NEIGHBORHOOD_ATMOSPHERE_QUESTS).toHaveLength(7);
    expect(NEIGHBORHOOD_ATMOSPHERE_QUESTS.every((quest) => QUEST_BY_ID.get(quest.id) === quest)).toBe(true);
    expect(new Set(NEIGHBORHOOD_ATMOSPHERE_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'atmosphere_visits', 'atmosphere_observed', 'atmosphere_replays', 'atmosphere_featured',
    ]));
    expect(villageRequestDestinationForMetric('atmosphere_observed')).toBe('atmosphere');
  });

  it('첫 햇살은 즉시 열리고 나머지는 기존 생활 기록 두 가지를 모두 읽는다', () => {
    const state = freshNeighborhoodAtmosphereState();
    const empty = neighborhoodAtmosphereViews(state, quests());
    expect(empty[0]).toMatchObject({ id: 'soft_sun', observed: true, active: true });
    expect(empty.slice(1).every((item) => !item.ready && !item.observed)).toBe(true);
    const ready = neighborhoodAtmosphereViews(state, quests({ q_forest: 60, resident_greet: 3 }));
    expect(ready.find((item) => item.id === 'cloud_walk')).toMatchObject({
      ready: true,
      completedRequirements: 2,
    });
  });

  it('준비된 장면만 처음 관측하며 자동으로 현재 분위기가 된다', () => {
    const store = new NeighborhoodAtmosphereStore('observer');
    expect(store.observe('cloud_walk', quests())).toMatchObject({ ok: false, reason: 'not-ready' });
    expect(store.observe('cloud_walk', quests({ q_forest: 60, resident_greet: 3 }))).toMatchObject({
      ok: true,
      first: true,
    });
    expect(store.get()).toMatchObject({
      observedIds: ['soft_sun', 'cloud_walk'],
      activeId: 'cloud_walk',
    });
    expect(store.observe('cloud_walk', quests())).toMatchObject({ ok: true, first: false });
  });

  it('관측한 장면만 자유롭게 재생하고 대표 세 칸을 손실 없이 바꾼다', () => {
    const store = new NeighborhoodAtmosphereStore('showcase');
    const all = Object.fromEntries(NEIGHBORHOOD_ATMOSPHERES.flatMap((item) => (
      item.requirements.map((requirement) => [requirement.key, requirement.goal])
    )));
    for (const item of NEIGHBORHOOD_ATMOSPHERES.slice(1)) expect(store.observe(item.id, quests(all)).ok).toBe(true);
    expect(store.activate('soft_sun')).toBe('activated');
    store.replay();
    store.replay();
    expect(store.toggleFeatured('soft_sun')).toBe('added');
    expect(store.toggleFeatured('cloud_walk')).toBe('added');
    expect(store.toggleFeatured('window_rain')).toBe('added');
    expect(store.toggleFeatured('neon_shower')).toBe('full');
    expect(store.toggleFeatured('cloud_walk')).toBe('removed');
    expect(store.get()).toMatchObject({
      activeId: 'soft_sun',
      featuredIds: ['soft_sun', 'window_rain'],
      replayCount: 2,
    });
  });

  it('손상된 저장에서 관측·활성·대표 값과 횟수를 안전하게 정리한다', () => {
    expect(normalizeNeighborhoodAtmosphereState({
      observedIds: ['cloud_walk', 'cloud_walk', 'fake'],
      activeId: 'first_snow',
      featuredIds: ['cloud_walk', 'first_snow', 'fake'],
      replayCount: 2.8,
      visitCount: -1,
    })).toEqual({
      version: 1,
      observedIds: ['soft_sun', 'cloud_walk'],
      activeId: 'soft_sun',
      featuredIds: ['cloud_walk'],
      replayCount: 2,
      visitCount: 0,
    });
  });

  it('진행 요약은 관측·준비·대표·재생·효과 수를 분리한다', () => {
    const state = {
      ...freshNeighborhoodAtmosphereState(),
      featuredIds: ['soft_sun'] as const,
      replayCount: 4,
      visitCount: 2,
    };
    expect(neighborhoodAtmosphereProgress(
      { ...state, featuredIds: [...state.featuredIds] },
      quests({ q_forest: 60, resident_greet: 3 }),
    )).toEqual({
      observed: 1,
      total: 8,
      ready: 1,
      featured: 1,
      featuredMax: 3,
      replayCount: 4,
      visitCount: 2,
      effects: 8,
    });
  });
});
