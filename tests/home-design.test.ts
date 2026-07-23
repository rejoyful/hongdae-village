import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import { normalizeOfflineRoomState, OfflineRoomStore } from '../src/game/home/offlineRoomStore';
import type { Placed } from '../src/game/entities/placement';
import { STARTER_ITEMS } from '../src/items/catalog';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const placed = (ids: string[]): Placed[] => ids.map((itemId, i) => ({
  id: `p${i}`, itemId, tx: 1 + i, ty: 2, rot: 0,
}));

describe('홈 스타일 분석', () => {
  it('빈 방에는 시작 안내와 0점이 나온다', () => {
    const a = analyzeHomeDesign([]);
    expect(a.score).toBe(0);
    expect(a.grade.id).toBe('empty');
    expect(a.theme.id).toBe('starter');
    expect(a.nextTip).toContain('침대');
  });

  it('생활 필수 가구와 여러 레이어를 고르게 보상한다', () => {
    const a = analyzeHomeDesign(placed([
      'bed_basic', 'sofa_single', 'desk_wood', 'bookshelf', 'lamp_stand',
      'plant_pot', 'rug_cream', 'poster_band', 'guitar', 'turntable', 'lp_crate',
    ]));
    expect(Object.values(a.essentials).every(Boolean)).toBe(true);
    expect(a.categoryCount).toBe(6);
    expect(a.layerCount).toBe(3);
    expect(a.score).toBeGreaterThanOrEqual(70);
  });

  it('테마 아이템 3종부터 대표 취향을 판별한다', () => {
    const a = analyzeHomeDesign(placed(['guitar', 'mic_stand', 'turntable', 'speaker_amp']));
    expect(a.theme.id).toBe('music');
    expect(a.themePower).toBeGreaterThanOrEqual(3);
  });

  it('같은 아이템 도배는 고유 종류 점수를 부풀리지 않는다', () => {
    const a = analyzeHomeDesign(placed(Array(20).fill('chair_wood')));
    expect(a.placedCount).toBe(20);
    expect(a.uniqueCount).toBe(1);
    expect(a.score).toBeLessThan(30);
  });
});

describe('오프라인 방 저장', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('첫 접속에 전체 웰컴 세트를 한 번만 지급한다', () => {
    const first = normalizeOfflineRoomState(null);
    expect(Object.keys(first.counts).length).toBe(STARTER_ITEMS.length);
    const second = normalizeOfflineRoomState(first);
    expect(second.counts).toEqual(first.counts);
  });

  it('잘못된 배치와 수량을 정리한다', () => {
    const state = normalizeOfflineRoomState({
      placements: [
        { id: 'ok', itemId: 'chair_wood', tx: 2, ty: 2, rot: 0 },
        { id: 'bad', itemId: 'missing', tx: 2, ty: 2, rot: 0 },
      ],
      counts: { chair_wood: -10, missing: 100 },
      grantedStarterIds: STARTER_ITEMS.map((s) => s.itemId),
    });
    expect(state.placements).toHaveLength(1);
    expect(state.counts.chair_wood).toBe(0);
    expect(state.counts.missing).toBeUndefined();
  });

  it('기존 0/1 저장과 새 2/3 방향을 함께 복원하고 잘못된 방향은 북향으로 교정한다', () => {
    const state = normalizeOfflineRoomState({
      placements: [
        { id: 'legacy', itemId: 'bed_basic', tx: 2, ty: 2, rot: 1 },
        { id: 'south', itemId: 'chair_wood', tx: 5, ty: 2, rot: 2 },
        { id: 'west', itemId: 'desk_wood', tx: 2, ty: 5, rot: 3 },
        { id: 'bad-rot', itemId: 'lamp_stand', tx: 6, ty: 5, rot: 9 },
      ],
      grantedStarterIds: STARTER_ITEMS.map((s) => s.itemId),
    });
    expect(state.placements.map((placed) => placed.rot)).toEqual([1, 2, 3, 0]);
  });

  it('배치와 남은 인벤토리를 사용자·방별로 복원한다', () => {
    const store = new OfflineRoomStore('u1', 7);
    const p = placed(['bed_basic']);
    const counts = store.counts();
    counts.set('bed_basic', 0);
    store.save(p, counts);

    const restored = new OfflineRoomStore('u1', 7);
    expect(restored.placements()).toEqual(p);
    expect(restored.counts().get('bed_basic')).toBe(0);
    expect(new OfflineRoomStore('u1', 8).placements()).toEqual([]);
  });
});
