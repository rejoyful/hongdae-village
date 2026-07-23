import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import {
  VILLAGE_CHRONICLE, VillageChronicleStore, normalizeVillageChronicleState,
  villageChronicleProgress, villageChronicleViews,
} from '../src/game/progression/villageChronicle';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const TODAY = '2026-07-23';

describe('홍대마을 메인 연대기', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('8장마다 우열 없는 세 생활 루트와 세 마지막 문장을 제공한다', () => {
    expect(VILLAGE_CHRONICLE).toHaveLength(8);
    expect(new Set(VILLAGE_CHRONICLE.map((chapter) => chapter.id)).size).toBe(8);
    for (const chapter of VILLAGE_CHRONICLE) {
      expect(chapter.routes).toHaveLength(3);
      expect(chapter.reflections.map((item) => item.id)).toEqual(['people', 'place', 'possibility']);
      expect(new Set(chapter.routes.map((route) => route.id)).size).toBe(3);
    }
  });

  it('현재 장 하나만 열고 이전 장은 완료, 이후 장은 잠금으로 표시한다', () => {
    const views = villageChronicleViews(normalizeVillageChronicleState(null), normalizeState(null, TODAY), 2);
    expect(views.map((view) => view.status)).toEqual(['complete', 'complete', 'active', 'locked', 'locked', 'locked', 'locked', 'locked']);
  });

  it('평생 기록을 읽어 선택하지 않은 루트까지 소급 진행으로 보여 준다', () => {
    let quest = normalizeState(null, TODAY);
    quest = setQuestMetric(quest, 'open_map', 1);
    quest = setQuestMetric(quest, 'resident_greet', 1);
    const first = villageChronicleViews(normalizeVillageChronicleState(null), quest, 0)[0]!;
    expect(first.routes.map((route) => route.complete)).toEqual([true, true, false]);
    expect(first.routes[0]).toMatchObject({ current: 1, goal: 1, selected: false });
  });

  it('현재 장의 루트는 자유롭게 바꾸지만 잠긴 장은 선택할 수 없다', () => {
    const store = new VillageChronicleStore('route-player');
    expect(store.chooseRoute('arrival', 'arrival_map', 0)).toBe(true);
    expect(store.chooseRoute('arrival', 'arrival_names', 0)).toBe(true);
    expect(store.chooseRoute('handmade', 'handmade_seed', 0)).toBe(false);
    expect(store.get().routes).toEqual({ arrival: 'arrival_names' });
    expect(new VillageChronicleStore('route-player').get().routes).toEqual({ arrival: 'arrival_names' });
  });

  it('완료한 장만 마지막 문장을 기록하고 언제든 다른 기억 방식으로 고친다', () => {
    const store = new VillageChronicleStore('writer');
    expect(store.reflect('arrival', 'people', 0)).toBe(false);
    expect(store.reflect('arrival', 'people', 1)).toBe(true);
    expect(store.reflect('arrival', 'possibility', 1)).toBe(true);
    expect(store.get().reflections).toEqual({ arrival: 'possibility' });
    expect(store.progress()).toMatchObject({ pages: 1, motifs: 1 });
  });

  it('응답한 원고만 대표로 삼고 8장·세 기억 방식 진행을 집계한다', () => {
    const store = new VillageChronicleStore('editor');
    expect(store.feature('arrival')).toBe(false);
    VILLAGE_CHRONICLE.forEach((chapter, index) => {
      expect(store.chooseRoute(chapter.id, chapter.routes[index % 3]!.id, 8)).toBe(true);
      expect(store.reflect(chapter.id, chapter.reflections[index % 3]!.id, 8)).toBe(true);
    });
    expect(store.feature('legend')).toBe(true);
    expect(store.progress()).toEqual({ pages: 8, totalPages: 8, routesChosen: 8, motifs: 3, featured: 1 });
    expect(new VillageChronicleStore('editor').progress().pages).toBe(8);
    expect(new VillageChronicleStore('other').progress().pages).toBe(0);
  });

  it('손상된 루트·결말·대표 원고는 저장 복구 과정에서 제거한다', () => {
    const state = normalizeVillageChronicleState({
      routes: { arrival: 'arrival_map', missing: 'x', belonging: 'wrong' },
      reflections: { arrival: 'people', missing: 'place', handmade: 'wrong' },
      featuredId: 'missing',
    });
    expect(state).toEqual({ version: 1, routes: { arrival: 'arrival_map' }, reflections: { arrival: 'people' }, featuredId: null });
    expect(villageChronicleProgress(state)).toMatchObject({ pages: 1, routesChosen: 1, motifs: 1, featured: 0 });
  });
});
