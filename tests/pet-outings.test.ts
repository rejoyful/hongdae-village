import { beforeEach, describe, expect, it } from 'vitest';
import {
  PET_OUTING_ROUTES, PetOutingStore, freshPetOutingState, normalizePetOutingState,
  petOutingProgress, petOutingRouteViews, walkPetOuting, type PetOutingContext,
} from '../src/game/pets/petOutings';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const context = (overrides: Partial<PetOutingContext> = {}): PetOutingContext => ({
  affinity: 10, tricks: 0, memories: 1, personality: 'brave', ...overrides,
});

describe('동행 산책 수첩', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('8개 산책 코스에 1·3·6 발걸음 기념품을 세 개씩 둔다', () => {
    expect(PET_OUTING_ROUTES).toHaveLength(8);
    expect(PET_OUTING_ROUTES.every((route) => route.souvenirs.map((item) => item.threshold).join(',') === '1,3,6')).toBe(true);
    expect(new Set(PET_OUTING_ROUTES.flatMap((route) => route.souvenirs.map((item) => item.id))).size).toBe(24);
  });

  it('첫 세 코스는 바로 열리고 성장 코스는 부족한 조건을 구체적으로 알려 준다', () => {
    const views = petOutingRouteViews(freshPetOutingState(), 'dog', context());
    expect(views.slice(0, 3).every((route) => route.unlocked)).toBe(true);
    expect(views.find((route) => route.id === 'moon_channel')).toMatchObject({ unlocked: false, unlockHint: '친밀도 25 조건이 필요해요.' });
    expect(views.find((route) => route.id === 'forest_edge')?.unlockHint).toContain('트릭 2개');
    expect(views.find((route) => route.id === 'dawn_square')?.unlockHint).toContain('기존 추억 3장');
  });

  it('성격 궁합이면 두 칸, 아니어도 한 칸씩 전진하며 어느 경우도 실패하지 않는다', () => {
    const route = PET_OUTING_ROUTES[0]!;
    const matched = freshPetOutingState();
    expect(walkPetOuting(matched, 'dog', route.id, context({ personality: route.favorites[0] }))).toMatchObject({ ok: true, gained: 2, points: 2, favoriteMatch: true });
    const normal = freshPetOutingState();
    expect(walkPetOuting(normal, 'dog', route.id, context({ personality: 'brave' }))).toMatchObject({ ok: true, gained: 1, points: 1, favoriteMatch: false });
  });

  it('궁합 산책 세 번으로 세 기념품을 순서대로 발견하고 최고 진행은 여섯 칸에서 멈춘다', () => {
    const state = freshPetOutingState();
    const route = PET_OUTING_ROUTES[0]!;
    const pet = context({ personality: route.favorites[0] });
    expect(walkPetOuting(state, 'cat', route.id, pet)).toMatchObject({ ok: true, points: 2, newSouvenirs: [route.souvenirs[0]] });
    expect(walkPetOuting(state, 'cat', route.id, pet)).toMatchObject({ ok: true, points: 4, newSouvenirs: [route.souvenirs[1]] });
    expect(walkPetOuting(state, 'cat', route.id, pet)).toMatchObject({ ok: true, points: 6, newSouvenirs: [route.souvenirs[2]], routeCompleted: true });
    expect(walkPetOuting(state, 'cat', route.id, pet)).toMatchObject({ ok: true, points: 6, newSouvenirs: [], routeCompleted: false });
    expect(petOutingProgress(state)).toMatchObject({ totalWalks: 4, routesVisited: 1, souvenirStamps: 3, completedRoutes: 1, petPartners: 1 });
  });

  it('같은 코스를 다른 펫과 걸어도 24칸 도감은 코스별 최고 기록만 사용한다', () => {
    const state = freshPetOutingState();
    const route = PET_OUTING_ROUTES[1]!;
    walkPetOuting(state, 'dog', route.id, context({ personality: route.favorites[0] }));
    walkPetOuting(state, 'cat', route.id, context({ personality: route.favorites[1] }));
    const progress = petOutingProgress(state);
    expect(progress).toMatchObject({ totalWalks: 2, routesVisited: 1, souvenirStamps: 1, petPartners: 2, pairings: 2 });
  });

  it('잠긴 코스·알 수 없는 펫은 기록을 만들지 않는다', () => {
    const state = freshPetOutingState();
    expect(walkPetOuting(state, 'dog', 'dawn_square', context())).toEqual({ ok: false, reason: 'locked-route' });
    expect(walkPetOuting(state, 'missing', 'rail_sunwalk', context())).toEqual({ ok: false, reason: 'unknown-pet' });
    expect(state.records).toEqual({});
  });

  it('손상된 기록과 알 수 없는 코스를 제거하고 사용자별로 보존한다', () => {
    const normalized = normalizePetOutingState({
      records: {
        good: { petId: 'dog', routeId: 'rail_sunwalk', points: 99, walks: 2.8, lastAt: -1 },
        badPet: { petId: 'dragon', routeId: 'rail_sunwalk', points: 2, walks: 1 },
        badRoute: { petId: 'dog', routeId: 'space', points: 2, walks: 1 },
      },
      totalWalks: 1,
    });
    expect(Object.values(normalized.records)).toEqual([expect.objectContaining({ petId: 'dog', points: 6, walks: 2, lastAt: 0 })]);
    expect(normalized.totalWalks).toBe(2);

    const store = new PetOutingStore('walker-a');
    const route = PET_OUTING_ROUTES[0]!;
    expect(store.walk('rabbit', route.id, context({ personality: route.favorites[0] })).ok).toBe(true);
    expect(new PetOutingStore('walker-a').progress()).toMatchObject({ totalWalks: 1, petPartners: 1 });
    expect(new PetOutingStore('walker-b').progress()).toMatchObject({ totalWalks: 0, petPartners: 0 });
  });
});
