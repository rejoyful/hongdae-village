import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import type { Placed } from '../src/game/entities/placement';
import {
  TASTE_SHOWCASE_EXHIBITS, TasteShowcaseStore, emptyPetSnapshot, evaluateTasteShowcase,
  freshTasteShowcaseState, homeSnapshotFromAnalysis, normalizeTasteShowcaseState,
  submitTasteShowcase, tasteShowcaseProgress,
} from '../src/game/showcase/tasteShowcase';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const placements = (ids: string[]): Placed[] => ids.map((itemId, index) => ({
  id: `taste-${index}`, itemId, tx: 1 + index, ty: 2, rot: 0,
}));

describe('골목 취향 전시회', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('집 네 주제와 펫 네 주제를 각각 세 조건으로 제공한다', () => {
    expect(TASTE_SHOWCASE_EXHIBITS).toHaveLength(8);
    expect(TASTE_SHOWCASE_EXHIBITS.filter((item) => item.domain === 'home')).toHaveLength(4);
    expect(TASTE_SHOWCASE_EXHIBITS.filter((item) => item.domain === 'pet')).toHaveLength(4);
    expect(TASTE_SHOWCASE_EXHIBITS.every((item) => item.criteria.length === 3)).toBe(true);
  });

  it('현재 방 분석을 스냅샷으로 남기고 실제 조건을 판정한다', () => {
    const placed = placements([
      'bed_basic', 'sofa_single', 'desk_wood', 'bookshelf', 'lamp_stand',
      'plant_pot', 'flower_vase', 'rug_cream', 'guitar', 'turntable', 'poster_band', 'cushion',
    ]);
    const home = homeSnapshotFromAnalysis(analyzeHomeDesign(placed), placed.map((item) => item.itemId), 100);
    const exhibit = TASTE_SHOWCASE_EXHIBITS.find((item) => item.id === 'home_everyday')!;
    expect(evaluateTasteShowcase(exhibit, { home, pet: emptyPetSnapshot() })).toMatchObject({ matched: 3, stampsOnSubmit: 3 });
    expect(home.itemIds).toContain('bed_basic');
  });

  it('조건이 없어도 참여 도장 하나를 주고 최고 기록을 낮추지 않는다', () => {
    const state = freshTasteShowcaseState();
    const context: { home: ReturnType<typeof homeSnapshotFromAnalysis> | null; pet: ReturnType<typeof emptyPetSnapshot> } = {
      home: null, pet: emptyPetSnapshot(),
    };
    expect(submitTasteShowcase(state, 'home_signature', context)).toMatchObject({ ok: true, stamps: 1, firstEntry: true });
    const strong = placements([
      'bed_basic', 'sofa_single', 'desk_wood', 'bookshelf', 'lamp_stand', 'plant_pot',
      'rug_cream', 'candle_set', 'cushion', 'bed_green', 'sofa_coral', 'rug_round',
    ]);
    context.home = homeSnapshotFromAnalysis(analyzeHomeDesign(strong), strong.map((item) => item.itemId));
    expect(submitTasteShowcase(state, 'home_signature', context)).toMatchObject({ ok: true, stamps: 3, improved: true });
    context.home = null;
    expect(submitTasteShowcase(state, 'home_signature', context)).toMatchObject({ ok: true, stamps: 1, improved: false });
    expect(state.records.home_signature?.bestStamps).toBe(3);
  });

  it('손상된 기록을 정리하고 사용자별 전시 기록을 복원한다', () => {
    const normalized = normalizeTasteShowcaseState({
      records: { home_everyday: { bestStamps: 99, attempts: 2.8, savedAt: -1 }, unknown: { bestStamps: 3, attempts: 1 } },
      totalSubmissions: 1,
      home: { score: 999, themeId: 'broken', themeName: 4, essentials: null, itemIds: ['bed_basic', 3, 'bed_basic'] },
    });
    expect(normalized.records).toEqual({ home_everyday: { bestStamps: 3, attempts: 2, savedAt: 0 } });
    expect(normalized.totalSubmissions).toBe(2);
    expect(normalized.home).toMatchObject({ score: 100, themeId: 'starter', essentials: { sleep: false }, itemIds: ['bed_basic'] });

    const store = new TasteShowcaseStore('curator-a');
    expect(store.submit('pet_first_portrait', { home: null, pet: emptyPetSnapshot() })).toMatchObject({ ok: true, stamps: 1 });
    expect(new TasteShowcaseStore('curator-a').progress()).toMatchObject({ entries: 1, stamps: 1 });
    expect(new TasteShowcaseStore('curator-b').progress()).toMatchObject({ entries: 0, stamps: 0 });
  });

  it('전시 도장과 완성 주제, 두 도메인 참여를 따로 집계한다', () => {
    const state = freshTasteShowcaseState();
    const pet = { ...emptyPetSnapshot(), activeId: 'dog', activeName: '보리', affinity: 55, accessory: 'ribbon' as const };
    submitTasteShowcase(state, 'pet_first_portrait', { home: null, pet });
    submitTasteShowcase(state, 'home_everyday', { home: null, pet });
    expect(tasteShowcaseProgress(state)).toMatchObject({ entries: 2, stamps: 4, perfect: 1, submissions: 2, domains: 2 });
  });
});
