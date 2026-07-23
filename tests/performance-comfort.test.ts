import { describe, expect, it } from 'vitest';
import {
  FrameTimeMonitor,
  PerformanceComfort,
  initialQualityTier,
  suggestedQuality,
} from '../src/game/performance/performanceComfort';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('플레이 편안함 성능 계측', () => {
  it('기기 힌트는 저사양에서 보수적으로 시작하고 충분한 기기는 고품질을 쓴다', () => {
    expect(initialQualityTier({ memoryGb: 2, logicalCores: 8 })).toBe('battery');
    expect(initialQualityTier({ memoryGb: 4, logicalCores: 4 })).toBe('balanced');
    expect(initialQualityTier({ memoryGb: 8, logicalCores: 8 })).toBe('high');
    expect(initialQualityTier({ memoryGb: 6, logicalCores: 8, touch: true })).toBe('balanced');
  });

  it('평균·95백분위·끊김 비율을 함께 보고 품질을 판단한다', () => {
    expect(suggestedQuality({ averageMs: 16.7, p95Ms: 18, jankPct: 0 })).toBe('high');
    expect(suggestedQuality({ averageMs: 21, p95Ms: 29, jankPct: 8 })).toBe('balanced');
    expect(suggestedQuality({ averageMs: 25, p95Ms: 52, jankPct: 18 })).toBe('battery');
  });

  it('탭 복귀처럼 비정상적으로 긴 프레임은 측정에서 제외한다', () => {
    const monitor = new FrameTimeMonitor(12, 4, 4);
    expect(monitor.record(500)).toBeNull();
    expect(monitor.record(Number.NaN)).toBeNull();
    monitor.record(16); monitor.record(17); monitor.record(16);
    const summary = monitor.record(17)!;
    expect(summary.samples).toBe(4);
    expect(summary.fps).toBeGreaterThanOrEqual(59);
    expect(summary.jankPct).toBe(0);
  });

  it('자동 모드는 짧은 순간 끊김 한 번에 품질을 바꾸지 않고 지속될 때 한 단계씩 낮춘다', () => {
    const comfort = new PerformanceComfort(new MemoryStorage(), { memoryGb: 8, logicalCores: 8 });
    expect(comfort.current().tier).toBe('high');
    for (let index = 0; index < 120; index += 1) comfort.recordFrame(40);
    expect(comfort.current().tier).toBe('high');
    for (let index = 0; index < 120; index += 1) comfort.recordFrame(40);
    expect(comfort.current().tier).toBe('balanced');
    for (let index = 0; index < 240; index += 1) comfort.recordFrame(40);
    expect(comfort.current().tier).toBe('battery');
  });

  it('사용자가 직접 고른 품질은 측정 결과가 느려도 바꾸지 않고 저장한다', () => {
    const storage = new MemoryStorage();
    const comfort = new PerformanceComfort(storage, { memoryGb: 2, logicalCores: 2 });
    comfort.setMode('high');
    for (let index = 0; index < 1_000; index += 1) comfort.recordFrame(50);
    expect(comfort.current()).toMatchObject({ mode: 'high', tier: 'high' });
    expect(new PerformanceComfort(storage, { memoryGb: 2, logicalCores: 2 }).current().tier).toBe('high');
  });

  it('절전 단계에서는 픽셀 해상도 대신 반복 장식과 전투 화면 갱신만 줄인다', () => {
    const comfort = new PerformanceComfort(undefined, { memoryGb: 2, logicalCores: 2 });
    const profile = comfort.profile();
    expect(profile.tier).toBe('battery');
    expect(profile.combatVisualEvery).toBe(2);
    expect(profile.ambientMotion).toBe(0);
    expect(profile.shadowAlpha).toBeGreaterThan(0);
  });
});
