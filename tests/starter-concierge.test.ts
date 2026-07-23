import { describe, expect, it } from 'vitest';
import {
  StarterConciergeStore, freshStarterConciergeState, normalizeStarterConciergeState,
  starterConciergePresentation, type StarterConciergeStorage,
} from '../src/game/guidance/starterConcierge';
import {
  starterCompassConciergeView, starterCompassRouteViews,
} from '../src/game/progression/starterCompass';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';

const TODAY = '2026-07-23';

class MemStorage implements StarterConciergeStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('새 이웃 한 걸음 안내', () => {
  it('처음에는 펼친 안내를 제공하고 접기 여부를 사용자별로 복구한다', () => {
    const storage = new MemStorage();
    expect(freshStarterConciergeState()).toMatchObject({ collapsed: false, opened: false, guideCount: 0 });
    const store = new StarterConciergeStore('new', storage);
    expect(store.setCollapsed(true)).toBe(true);
    expect(store.setCollapsed(true)).toBe(false);
    expect(new StarterConciergeStore('new', storage).get()).toMatchObject({ collapsed: true, opened: true });
  });

  it('길 안내 횟수와 서로 다른 활동·방향을 중복 없이 기록한다', () => {
    const store = new StarterConciergeStore('guide', new MemStorage());
    expect(store.recordGuide('visit_home', 'home')).toBe(true);
    expect(store.recordGuide('visit_home', 'home')).toBe(true);
    expect(store.recordGuide('pet_adopt', 'companion')).toBe(true);
    expect(store.recordGuide('<script>', 'home')).toBe(false);
    expect(store.progress()).toEqual({
      guides: 3, uniqueActivities: 2, directionsGuided: 2, collapsed: false,
    });
  });

  it('손상된 저장에서 알 수 없는 metric과 방향을 제거하고 안전한 수치만 남긴다', () => {
    expect(normalizeStarterConciergeState({
      collapsed: 'yes',
      opened: true,
      guideCount: -4,
      guidedKeys: ['visit_home', 'visit_home', '<bad>', 2],
      guidedRouteIds: ['home', 'dragon', 'home'],
    })).toEqual({
      version: 1,
      collapsed: false,
      opened: true,
      guideCount: 0,
      guidedKeys: ['visit_home'],
      guidedRouteIds: ['home'],
    });
  });

  it('선택 전·첫걸음·하나 남음·완료 상태에 서로 다른 부담 없는 문장을 제공한다', () => {
    let state = normalizeState(null, TODAY);
    let routes = starterCompassRouteViews(state);
    let view = starterCompassConciergeView(routes, null);
    expect(starterConciergePresentation(view)).toMatchObject({
      code: 'WELCOME DESK · NO WRONG WAY', action: '이 방향으로 시작',
    });

    view = starterCompassConciergeView(routes, 'home');
    expect(starterConciergePresentation(view)).toMatchObject({
      code: 'FIRST SMALL STEP', action: '이 활동 길 안내',
    });

    state = setQuestMetric(state, 'visit_home', 1);
    routes = starterCompassRouteViews(state);
    view = starterCompassConciergeView(routes, 'home');
    expect(starterConciergePresentation(view)).toMatchObject({
      code: 'ONE GENTLE STEP LEFT', action: '다음 활동 길 안내',
    });

    state = setQuestMetric(state, 'visit_shop', 1);
    routes = starterCompassRouteViews(state);
    view = starterCompassConciergeView(routes, 'home');
    expect(starterConciergePresentation(view)).toMatchObject({
      code: 'FIRST DIRECTION FOUND', action: '다음 방향 추천',
    });
  });
});
