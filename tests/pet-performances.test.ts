import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PET_PERFORMANCES, PET_PERFORMANCE_THRESHOLDS, PetPerformanceStore,
  freshPetPerformanceState, normalizePetPerformanceState, petPerformanceProgress,
  petPerformanceViews, rehearsePetPerformance,
} from '../src/game/pets/petPerformances';
import { PET_TRICKS } from '../src/game/pets/pets';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('둘만의 트릭 소극장', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
    vi.spyOn(Date, 'now').mockReturnValue(123456);
  });

  it('기존 다섯 트릭마다 데뷔·대표작·앙코르 세 장면을 제공한다', () => {
    expect(PET_PERFORMANCES).toHaveLength(5);
    expect(PET_PERFORMANCES.map((item) => item.trickId)).toEqual(PET_TRICKS.map((item) => item.id));
    expect(PET_PERFORMANCES.every((item) => item.keepsakes.length === 3)).toBe(true);
    expect(PET_PERFORMANCE_THRESHOLDS).toEqual([1, 3, 6]);
  });

  it('배우지 않은 트릭은 막되 실패나 자원 손실 없이 다음 행동을 알려 준다', () => {
    const state = freshPetPerformanceState();
    const views = petPerformanceViews(state, 'dog', ['hello'], 'brave');
    expect(views[0]).toMatchObject({ learned: true, rehearsals: 0, stamps: 0, nextThreshold: 1 });
    expect(views[1]).toMatchObject({ learned: false });
    expect(views[1]!.nextAction).toContain('친밀도 25');
    expect(rehearsePetPerformance(state, 'dog', 'paw', ['hello'])).toEqual({ ok: false, reason: 'not-learned' });
    expect(petPerformanceProgress(state).totalRehearsals).toBe(0);
  });

  it('1·3·6번째 공연에서만 새 추억을 열고 완성 뒤에도 좋아서 다시 공연할 수 있다', () => {
    const state = freshPetPerformanceState();
    const learned = ['spin'];
    expect(rehearsePetPerformance(state, 'cat', 'spin', learned)).toMatchObject({ ok: true, rehearsals: 1, stamps: 1, newKeepsakes: ['첫 바퀴 띠지'] });
    expect(rehearsePetPerformance(state, 'cat', 'spin', learned)).toMatchObject({ ok: true, rehearsals: 2, stamps: 1, newKeepsakes: [] });
    expect(rehearsePetPerformance(state, 'cat', 'spin', learned)).toMatchObject({ ok: true, rehearsals: 3, stamps: 2, newKeepsakes: ['회전 별가루 병'] });
    rehearsePetPerformance(state, 'cat', 'spin', learned);
    rehearsePetPerformance(state, 'cat', 'spin', learned);
    expect(rehearsePetPerformance(state, 'cat', 'spin', learned)).toMatchObject({ ok: true, rehearsals: 6, stamps: 3, completed: true, newKeepsakes: ['여섯 바퀴 금박'] });
    expect(rehearsePetPerformance(state, 'cat', 'spin', learned)).toMatchObject({ ok: true, rehearsals: 7, stamps: 3, completed: false, newKeepsakes: [] });
  });

  it('성격은 진행 효율을 바꾸지 않고 무대 문장만 다르게 만든다', () => {
    const state = freshPetPerformanceState();
    const gentle = petPerformanceViews(state, 'rabbit', ['hello'], 'gentle')[0]!;
    const performer = petPerformanceViews(state, 'rabbit', ['hello'], 'performer')[0]!;
    expect(gentle.nextThreshold).toBe(performer.nextThreshold);
    expect(gentle.personalityLine).not.toBe(performer.personalityLine);
  });

  it('여러 펫과 트릭의 레퍼토리·도장·완주를 영구 집계하고 대표 무대를 토글한다', () => {
    const store = new PetPerformanceStore('director');
    for (const trick of PET_TRICKS) {
      for (let count = 0; count < 6; count += 1) expect(store.rehearse('dog', trick.id, PET_TRICKS.map((item) => item.id)).ok).toBe(true);
    }
    expect(store.rehearse('cat', 'hello', ['hello']).ok).toBe(true);
    expect(store.feature('dog', 'pose')).toBe(true);
    expect(store.progress()).toEqual({
      totalRehearsals: 31, stamps: 16, repertoireTricks: 5,
      completedPerformances: 5, petPartners: 2, featured: 1,
    });
    expect(new PetPerformanceStore('director').progress()).toEqual(store.progress());
    expect(store.feature('dog', 'pose')).toBe(true);
    expect(store.progress().featured).toBe(0);
  });

  it('손상된 저장값과 알 수 없는 펫·트릭을 정리한다', () => {
    const normalized = normalizePetPerformanceState({
      records: {
        good: { petId: 'dog', trickId: 'hello', rehearsals: 2.9, lastAt: 10 },
        badPet: { petId: 'dragon', trickId: 'hello', rehearsals: 4 },
        badTrick: { petId: 'dog', trickId: 'fly', rehearsals: 4 },
      },
      totalRehearsals: 1,
      featured: 'dragon:hello',
    });
    expect(Object.values(normalized.records)).toEqual([
      { petId: 'dog', trickId: 'hello', rehearsals: 2, lastAt: 10 },
    ]);
    expect(normalized.totalRehearsals).toBe(2);
    expect(normalized.featured).toBeNull();
  });
});
