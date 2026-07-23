import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import {
  NeighborHomeTourStore, normalizeNeighborHomeTourState,
} from '../src/game/home/neighborHomeTours';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
  clear: () => memory.clear(),
}, configurable: true });

const home = analyzeHomeDesign([
  { id: 'bed', itemId: 'bed_basic', tx: 1, ty: 1, rot: 0 },
  { id: 'sofa', itemId: 'sofa_single', tx: 3, ty: 1, rot: 0 },
  { id: 'rug', itemId: 'rug_cream', tx: 2, ty: 3, rot: 0 },
]);

describe('이웃집 투어 수첩', () => {
  beforeEach(() => memory.clear());

  it('같은 집은 서울 날짜마다 한 번만 누적하고 최신 집 상태는 갱신한다', () => {
    const store = new NeighborHomeTourStore('me');
    expect(store.record('neighbor', '<별빛>', 3, 'villa', home, ['bed_basic', 'sofa_single', 'unknown'], new Date('2026-07-22T14:00:00Z'))).toBe('recorded');
    expect(store.record('neighbor', '별빛', 3, 'villa', home, ['bed_basic', 'rug_cream'], new Date('2026-07-22T14:30:00Z'))).toBe('today');
    expect(store.progress()).toMatchObject({ tours: 1, neighbors: 1, themes: 1, grades: 1, houseTypes: 1 });
    expect(store.records()[0]).toMatchObject({ ownerNickname: '별빛', visits: 1, roomId: 3, itemIds: ['bed_basic', 'rug_cream'], favorite: false });

    expect(store.record('neighbor', '별빛', 3, 'villa', home, ['plant_pot'], new Date('2026-07-23T15:10:00Z'))).toBe('recorded');
    expect(store.progress().tours).toBe(2);
    expect(store.records()[0]?.visits).toBe(2);
  });

  it('자기 집과 잘못된 방은 기록하지 않는다', () => {
    const store = new NeighborHomeTourStore('me');
    expect(store.record('me', '나', 1, 'oneroom', home, [])).toBe('self');
    expect(store.record('neighbor', '이웃', 0, 'oneroom', home, [])).toBe('invalid');
    expect(store.progress().tours).toBe(0);
  });

  it('최애 엽서는 여섯 장까지 보존하고 다시 누르면 해제한다', () => {
    const store = new NeighborHomeTourStore('me');
    for (let index = 0; index < 7; index += 1) {
      store.record(`neighbor-${index}`, `이웃${index}`, index + 1, 'oneroom', home, ['bed_basic'], new Date(1000 + index));
    }
    for (let index = 0; index < 6; index += 1) expect(store.toggleFavorite(`neighbor-${index}`)).toBe('featured');
    expect(store.toggleFavorite('neighbor-6')).toBe('full');
    expect(store.progress().favorites).toBe(6);
    expect(store.toggleFavorite('neighbor-0')).toBe('unfeatured');
    expect(store.toggleFavorite('neighbor-6')).toBe('featured');
    expect(store.records().filter((record) => record.favorite)).toHaveLength(6);
  });

  it('손상된 저장값을 안전하게 정규화한다', () => {
    const state = normalizeNeighborHomeTourState({ totalTours: -5, records: {
      good: { ownerId: 'neighbor-1', ownerNickname: '<b>모카</b>', roomId: 4, houseType: 'apt', themeId: 'bad', gradeId: 'bad', homeScore: 999, uniqueItems: -1, firstVisitedAt: 100, lastVisitedAt: 50, lastVisitDay: 'bad', visits: 0 },
      bad: { ownerId: '<script>', roomId: -1, houseType: 'castle' },
    } });
    expect(state.totalTours).toBe(1);
    expect(Object.values(state.records)).toHaveLength(1);
    expect(state.records['neighbor-1']).toMatchObject({ ownerNickname: 'b모카/b', themeId: 'starter', gradeId: 'empty', homeScore: 100, uniqueItems: 0, visits: 1 });
  });
});
