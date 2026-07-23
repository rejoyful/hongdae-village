import { describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import { TASTE_DOMAINS, tasteProfile } from '../src/game/progression/tasteProfile';

const fresh = () => normalizeState(null, '2026-07-23');

describe('수집가 취향 프로필', () => {
  it('아무 기록이 없어도 여덟 분야의 친절한 빈 프로필을 만든다', () => {
    const profile = tasteProfile(fresh());
    expect(profile.domains).toHaveLength(8);
    expect(profile.overallPct).toBe(0);
    expect(profile.completedMetrics).toBe(0);
    expect(profile.totalMetrics).toBe(56);
    expect(profile.favorite.id).toBe('style');
    expect(profile.nextMetric).not.toBeNull();
  });

  it('실제 평생 기록으로 가장 깊은 취향과 분야 완성도를 결정한다', () => {
    let state = fresh();
    state = setQuestMetric(state, 'garden_species', 12);
    state = setQuestMetric(state, 'garden_specimens', 27);
    state = setQuestMetric(state, 'lookbook_entries', 3);
    const profile = tasteProfile(state);
    const garden = profile.domains.find((domain) => domain.id === 'garden')!;
    expect(profile.favorite.id).toBe('garden');
    expect(garden.progressPct).toBe(88);
    expect(garden.rank).toBe('아카이비스트');
    expect(garden.completed).toBe(1);
    expect(garden.metrics[1]).toMatchObject({ current: 27, goal: 36, progressPct: 75, complete: false });
  });

  it('목표를 넘긴 평생 기록은 보존하되 프로필 퍼센트는 100에서 멈춘다', () => {
    let state = fresh();
    for (const domain of TASTE_DOMAINS) {
      for (const metric of domain.metrics) state = setQuestMetric(state, metric.key, metric.goal + 17);
    }
    const profile = tasteProfile(state);
    expect(profile.overallPct).toBe(100);
    expect(profile.completedMetrics).toBe(profile.totalMetrics);
    expect(profile.nextMetric).toBeNull();
    expect(profile.domains.every((domain) => domain.rank === '도감 완성')).toBe(true);
    expect(profile.domains[0]!.metrics[0]!.current).toBeGreaterThan(profile.domains[0]!.metrics[0]!.goal);
  });
});
