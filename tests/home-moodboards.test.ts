import { beforeEach, describe, expect, it } from 'vitest';
import type { Placed } from '../src/game/entities/placement';
import { freshFurnitureReformState } from '../src/game/home/furnitureReform';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import {
  HOME_MOODBOARDS, HomeMoodboardStore, freshHomeMoodboardState, homeMoodboardProgress,
  homeMoodboardViews, normalizeHomeMoodboardState, type HomeMoodboardContext,
} from '../src/game/home/homeMoodboards';
import type { QuestState } from '../src/game/questProgress';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const placed = (itemIds: readonly string[]): Placed[] => itemIds.map((itemId, index) => ({ id: `p${index}`, itemId, tx: index, ty: 2, rot: 0 }));
const context = (itemIds: readonly string[], lifetimeCounts: Record<string, number> = {}): HomeMoodboardContext => {
  const room = placed(itemIds);
  const quests: QuestState = { day: '2026-07-23', counts: {}, claimed: [], lifetimeCounts };
  return { placed: room, inventory: new Map(), analysis: analyzeHomeDesign(room), quests, reform: freshFurnitureReformState() };
};

describe('홈 무드보드', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('서로 다른 12개 테마와 48개 유효 가구 목표를 제공한다', () => {
    expect(HOME_MOODBOARDS).toHaveLength(12);
    expect(new Set(HOME_MOODBOARDS.map((board) => board.id)).size).toBe(12);
    expect(HOME_MOODBOARDS.flatMap((board) => board.itemIds)).toHaveLength(48);
  });

  it('손상 저장값과 중복 도장을 정리한다', () => {
    expect(normalizeHomeMoodboardState({
      stampedIds: ['first_nest', 'first_nest', 'missing'], trackedId: 'vinyl_night',
    })).toEqual({ version: 1, stampedIds: ['first_nest'], trackedId: 'vinyl_night' });
    expect(normalizeHomeMoodboardState({ stampedIds: 3, trackedId: 'missing' })).toEqual({ version: 1, stampedIds: [], trackedId: null });
  });

  it('현재 배치와 평생 생활 기록을 소급해서 조건에 반영한다', () => {
    const board = HOME_MOODBOARDS.find((item) => item.id === 'rehearsal_room')!;
    const view = homeMoodboardViews(freshHomeMoodboardState(), context(board.itemIds, { q_busking: 5 }))
      .find((item) => item.id === board.id)!;
    expect(view.checks.every((check) => check.done)).toBe(true);
    expect(view.ready).toBe(true);
  });

  it('인벤토리에만 있는 가구는 보유 안내하되 배치 완료로 세지 않는다', () => {
    const base = context([]);
    const ctx = { ...base, inventory: new Map([['bed_basic', 1]]) };
    const item = homeMoodboardViews(freshHomeMoodboardState(), ctx)[0]!.checks.find((check) => check.itemId === 'bed_basic')!;
    expect(item).toMatchObject({ owned: true, done: false, current: 0 });
  });

  it('준비된 테마만 한 번 도장 찍고 다음 미완성 테마를 자동 추적한다', () => {
    const store = new HomeMoodboardStore('stamps');
    const first = HOME_MOODBOARDS[0]!;
    expect(store.stamp(first.id, context([]))).toBe('not-ready');
    expect(store.stamp(first.id, context(first.itemIds))).toBe('stamped');
    expect(store.stamp(first.id, context(first.itemIds))).toBe('not-ready');
    expect(store.get()).toMatchObject({ stampedIds: ['first_nest'], trackedId: 'rainy_cafe' });
    expect(new HomeMoodboardStore('stamps').get().stampedIds).toEqual(['first_nest']);
  });

  it('완성·준비·시작·아이템 진행을 한 번에 요약한다', () => {
    const room = context(HOME_MOODBOARDS[0]!.itemIds);
    const state = normalizeHomeMoodboardState({ stampedIds: ['vinyl_night'] });
    expect(homeMoodboardProgress(state, room)).toMatchObject({ stamped: 1, total: 12, ready: 1, started: 2, matchedItems: 4, totalItems: 48 });
  });
});
