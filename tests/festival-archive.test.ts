import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeState, setQuestMetric } from '../src/game/questProgress';
import {
  FESTIVALS, FestivalArchiveStore, festivalArchiveViews, festivalSpotlight, festivalWeekIndex,
  normalizeFestivalArchiveState,
} from '../src/game/events/festivalArchive';

class MemStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
}

const TODAY = '2026-07-23';

describe('FOMO 없는 골목 축제 아카이브', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('8개 축제가 처음부터 모두 열리고 네 활동 중 세 개만 요구한다', () => {
    expect(FESTIVALS).toHaveLength(8);
    expect(new Set(FESTIVALS.map((festival) => festival.id)).size).toBe(8);
    for (const festival of FESTIVALS) {
      expect(festival.objectives).toHaveLength(4);
      expect(festival.required).toBe(3);
      expect(festival.postcard.length).toBeGreaterThan(4);
      expect(festival.keepsake.length).toBeGreaterThan(4);
    }
  });

  it('주간 순환은 추천 조명만 바꾸고 8주 뒤 다시 돌아온다', () => {
    const start = new Date('2026-07-20T00:00:00.000Z');
    const next = new Date('2026-07-27T00:00:00.000Z');
    const repeat = new Date('2026-09-14T00:00:00.000Z');
    expect(festivalWeekIndex(next)).toBe(festivalWeekIndex(start) + 1);
    expect(festivalSpotlight(next).id).not.toBe(festivalSpotlight(start).id);
    expect(festivalSpotlight(repeat).id).toBe(festivalSpotlight(start).id);
  });

  it('한국 시간 월요일 0시를 기준으로 이번 주 광장 조명을 교체한다', () => {
    const sunday = new Date('2026-07-19T14:59:59.000Z'); // KST 일요일 23:59:59
    const monday = new Date('2026-07-19T15:00:00.000Z'); // KST 월요일 00:00:00
    expect(festivalWeekIndex(monday)).toBe(festivalWeekIndex(sunday) + 1);
  });

  it('네 조건을 모두 강요하지 않고 세 가지만 채워도 엽서를 기록한다', () => {
    const festival = FESTIVALS[0]!;
    let quests = normalizeState(null, TODAY);
    for (const item of festival.objectives.slice(0, 3)) quests = setQuestMetric(quests, item.key, item.goal);
    const store = new FestivalArchiveStore('three-of-four');
    expect(store.views(quests).find((view) => view.id === festival.id)).toMatchObject({ completed: 3, ready: true, claimed: false });
    expect(store.claim(festival.id, quests)).toMatchObject({ ok: true, view: { claimed: true } });
    expect(store.claim(festival.id, quests)).toEqual({ ok: false, reason: 'claimed' });
    expect(new FestivalArchiveStore('three-of-four').progress(quests)).toMatchObject({ postcards: 1, totalPostcards: 8 });
  });

  it('미완료 축제는 저장하지 않고 현재 기록을 보존한다', () => {
    const store = new FestivalArchiveStore('not-ready');
    expect(store.claim(FESTIVALS[0]!.id, normalizeState(null, TODAY))).toEqual({ ok: false, reason: 'not-ready' });
    expect(store.get().claimedIds).toEqual([]);
  });

  it('어떤 축제든 추적할 수 있지만 대표 엽서는 수령한 후에만 걸 수 있다', () => {
    const store = new FestivalArchiveStore('track-feature');
    const first = FESTIVALS[0]!;
    expect(store.track(first.id)).toBe(true);
    expect(store.feature(first.id)).toBe(false);
    let quests = normalizeState(null, TODAY);
    for (const item of first.objectives.slice(0, 3)) quests = setQuestMetric(quests, item.key, item.goal);
    store.claim(first.id, quests);
    expect(store.feature(first.id)).toBe(true);
    expect(store.views(quests).find((view) => view.id === first.id)).toMatchObject({ tracked: true, featured: true });
  });

  it('손상된 저장값에서 가짜 축제와 미수령 대표 엽서를 제거한다', () => {
    expect(normalizeFestivalArchiveState({
      claimedIds: [FESTIVALS[0]!.id, 'fake', FESTIVALS[0]!.id], trackedId: FESTIVALS[1]!.id, featuredId: FESTIVALS[2]!.id,
    })).toEqual({ version: 1, claimedIds: [FESTIVALS[0]!.id], trackedId: FESTIVALS[1]!.id });
    expect(festivalArchiveViews(normalizeState(null, TODAY), normalizeFestivalArchiveState(null))).toHaveLength(8);
  });
});
