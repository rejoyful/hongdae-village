import { beforeEach, describe, expect, it } from 'vitest';
import type { Placed, PlaceRegion } from '../src/game/entities/placement';
import {
  HOME_LAYOUT_LABELS, HomeLayoutStore, homeLayoutProgress, makeHomeLayoutSnapshot,
  normalizeHomeLayoutState, prepareHomeLayoutApply,
} from '../src/game/home/homeLayouts';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const region: PlaceRegion = { x: 1, y: 1, w: 10, h: 8, wallRow: 1 };
const current: Placed[] = [
  { id: 'bed-now', itemId: 'bed_basic', tx: 1, ty: 2, rot: 0 },
  { id: 'plant-now', itemId: 'plant_pot', tx: 5, ty: 2, rot: 0 },
];

describe('홈 장면 보관함', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('서로 다른 목적의 여섯 고정 표지를 제공한다', () => {
    expect(HOME_LAYOUT_LABELS).toHaveLength(6);
    expect(new Set(HOME_LAYOUT_LABELS.map((label) => label.id)).size).toBe(6);
    expect(HOME_LAYOUT_LABELS.every((label) => label.name && label.note && label.color && label.dark)).toBe(true);
  });

  it('가구 방향과 리폼 결까지 장면에 무손실 보존한다', () => {
    const snapshot = makeHomeLayoutSnapshot(2, 'studio', current, (id) => id === 'bed-now' ? { finishId: 'linen', colorId: 'sage' } : null, 1234);
    expect(snapshot).toMatchObject({ slot: 2, labelId: 'studio', savedAt: 1234, saveCount: 1, applyCount: 0 });
    expect(snapshot.placements[0]).toMatchObject({ itemId: 'bed_basic', tx: 1, ty: 2, rot: 0, reform: { finishId: 'linen', colorId: 'sage' } });
    expect(snapshot.signature).toMatch(/^2-/);
  });

  it('현재 방과 인벤토리의 총량이 충분할 때만 새 ID로 원자 적용 결과를 준비한다', () => {
    const target: Placed[] = [
      { id: 'old-bed', itemId: 'bed_basic', tx: 2, ty: 2, rot: 1 },
      { id: 'old-desk', itemId: 'desk_wood', tx: 6, ty: 2, rot: 0 },
    ];
    const snapshot = makeHomeLayoutSnapshot(1, 'daily', target, (id) => id === 'old-desk' ? { finishId: 'woodgrain', colorId: 'clay' } : null);
    const result = prepareHomeLayoutApply(snapshot, current, new Map([['desk_wood', 1]]), region, 'swap');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements).toHaveLength(2);
    expect(result.placements.every((placement) => placement.id.startsWith('swap-'))).toBe(true);
    expect(result.counts.get('plant_pot')).toBe(1);
    expect(result.counts.get('bed_basic')).toBe(0);
    expect(result.counts.get('desk_wood')).toBe(0);
    expect([...result.styles.values()]).toEqual([{ finishId: 'woodgrain', colorId: 'clay' }]);
  });

  it('아이템 부족이나 평면 충돌이면 현재 상태를 만들지 않고 이유만 돌려준다', () => {
    const twoBeds: Placed[] = [
      { id: 'a', itemId: 'bed_basic', tx: 1, ty: 2, rot: 0 },
      { id: 'b', itemId: 'bed_basic', tx: 6, ty: 2, rot: 0 },
    ];
    const missing = prepareHomeLayoutApply(makeHomeLayoutSnapshot(1, 'guest', twoBeds), [], new Map([['bed_basic', 1]]), region);
    expect(missing).toEqual({ ok: false, reason: 'missing', missingItemIds: ['bed_basic'] });

    const overlapping: Placed[] = [
      { id: 'a', itemId: 'bed_basic', tx: 1, ty: 2, rot: 0 },
      { id: 'b', itemId: 'sofa_single', tx: 1, ty: 2, rot: 0 },
    ];
    expect(prepareHomeLayoutApply(makeHomeLayoutSnapshot(1, 'guest', overlapping), [], new Map([['bed_basic', 1], ['sofa_single', 1]]), region)).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('여섯 슬롯과 누적 저장·적용·서로 다른 장면을 사용자별로 기록한다', () => {
    const store = new HomeLayoutStore('me', 3);
    const one = store.save(makeHomeLayoutSnapshot(1, 'daily', current));
    store.save(makeHomeLayoutSnapshot(1, 'season', current.slice(0, 1)));
    store.save(makeHomeLayoutSnapshot(2, 'collector', current));
    store.recordApplied(1); store.recordApplied(2);
    expect(one.slot).toBe(1);
    expect(store.snapshot(1)).toMatchObject({ labelId: 'season', saveCount: 2, applyCount: 1 });
    expect(store.progress()).toMatchObject({ savedSlots: 2, totalSaves: 3, totalApplies: 2, distinctScenes: 2, itemTypes: 2 });
  });

  it('손상 저장본은 1~6 슬롯·알려진 아이템·리폼만 남긴다', () => {
    const state = normalizeHomeLayoutState({ totalSaves: -4, totalApplies: 2.9, slots: {
      1: { slot: 1, labelId: 'daily', savedAt: 10, saveCount: 0, placements: [
        { itemId: 'bed_basic', tx: 1, ty: 2, rot: 9, reform: { finishId: 'fake', colorId: 'sage' } },
        { itemId: '<script>', tx: 2, ty: 2, rot: 0 },
      ] },
      9: { slot: 9, labelId: 'fake', placements: [] },
    } });
    expect(Object.keys(state.slots)).toEqual(['1']);
    expect(state.slots['1']?.placements).toEqual([{ itemId: 'bed_basic', tx: 1, ty: 2, rot: 0, reform: null }]);
    expect(homeLayoutProgress(state)).toMatchObject({ savedSlots: 1, totalSaves: 1, totalApplies: 2, distinctScenes: 1, itemTypes: 1 });
  });
});
