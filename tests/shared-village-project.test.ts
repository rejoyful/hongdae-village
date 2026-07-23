import { beforeEach, describe, expect, it } from 'vitest';
import {
  SHARED_PROJECT_CONTRIBUTIONS, SharedVillageProjectStore, freshSharedProjectState,
  normalizeSharedProjectState, seoulSharedProjectDay, sharedProjectChapter, sharedProjectView,
} from '../src/game/projects/sharedVillageProject';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('모두의 밤정원', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('자유문구 없이 여덟 가지 안전한 기여만 제공한다', () => {
    expect(SHARED_PROJECT_CONTRIBUTIONS).toHaveLength(8);
    expect(new Set(SHARED_PROJECT_CONTRIBUTIONS.map((item) => item.id)).size).toBe(8);
    expect(SHARED_PROJECT_CONTRIBUTIONS.every((item) => item.name && item.note && item.color && item.dark)).toBe(true);
  });

  it('120장을 한 장으로 완성하고 다음 기여부터 새 장을 연다', () => {
    expect(sharedProjectChapter(0)).toEqual({ chapter: 1, progress: 0, completed: 0 });
    expect(sharedProjectChapter(119)).toEqual({ chapter: 1, progress: 119, completed: 0 });
    expect(sharedProjectChapter(120)).toEqual({ chapter: 1, progress: 120, completed: 1 });
    expect(sharedProjectChapter(121)).toEqual({ chapter: 2, progress: 1, completed: 1 });
    expect(sharedProjectView({ ...freshSharedProjectState(), global: { ...freshSharedProjectState().global, total: 80 } }, 0))
      .toMatchObject({ stage: 4, stageName: '등불 정원' });
  });

  it('서울 날짜 기준 하루 한 번만 기여하고 개인 도감을 남긴다', () => {
    const store = new SharedVillageProjectStore('daily');
    const time = new Date('2026-07-23T01:00:00.000Z');
    expect(seoulSharedProjectDay(time)).toBe('2026-07-23');
    expect(store.previewContribute('green', time)).toMatchObject({ ok: true });
    expect(store.previewContribute('music', time)).toMatchObject({ ok: false, reason: 'today' });
    expect(store.view(time)).toMatchObject({
      global: { total: 1 }, member: { total: 1, kindIds: ['green'], chapterIds: [1] }, canContribute: false,
    });
  });

  it('서버 병합은 오래된 응답으로 공동·개인 진척을 되돌리지 않는다', () => {
    const store = new SharedVillageProjectStore('merge');
    store.merge({
      globalTotal: 88, kindCounts: { green: 12, story: 4 }, updatedAt: 100,
      memberTotal: 5, kindIds: ['green', 'story'], chapterIds: [1], lastDay: '2026-07-22',
    });
    const view = store.merge({
      globalTotal: 70, kindCounts: { green: 10 }, updatedAt: 90,
      memberTotal: 2, kindIds: ['music'], chapterIds: [2], lastDay: '2026-07-20',
    });
    expect(view.global.total).toBe(88);
    expect(view.global.kindCounts.green).toBe(12);
    expect(view.member.total).toBe(5);
    expect(new Set(view.member.kindIds)).toEqual(new Set(['green', 'story', 'music']));
    expect(view.member.chapterIds).toEqual([1, 2]);
  });

  it('손상된 서버·캐시 값은 유효한 종류와 범위만 복구한다', () => {
    expect(normalizeSharedProjectState({
      global: { total: -2, kindCounts: { green: 3.9, bad: 99 }, updatedAt: 'bad' },
      member: { total: Infinity, kindIds: ['green', 'bad', 'green'], chapterIds: [2, -1, 2, 1.2], lastDay: 'tomorrow' },
    })).toMatchObject({
      global: { total: 0, kindCounts: { green: 3 }, updatedAt: 0 },
      member: { total: 0, kindIds: ['green'], chapterIds: [2], lastDay: null },
    });
  });
});
