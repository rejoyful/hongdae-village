import { beforeEach, describe, expect, it } from 'vitest';
import type { Placed } from '../src/game/entities/placement';
import {
  PET_HOME_MOMENTS, PetHomeMemoryStore, evaluatePetHome, petHomeMomentMatches, selectPetHomeMoment,
} from '../src/game/home/petHomeComfort';
import { CATALOG_BY_ID } from '../src/items/catalog';
import { PET_HOME_SCENE_MOTIFS } from '../src/game/art/petHomeMemoryArt';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const placed = (ids: string[]): Placed[] => ids.map((itemId, index) => ({
  id: `home-${index}`, itemId, tx: index + 1, ty: 2, rot: 0,
}));

describe('성격별 동행의 자리', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('여섯 성격에 세 장면씩 총 18개가 있고 id와 추천 품목이 유효하다', () => {
    expect(PET_HOME_MOMENTS).toHaveLength(18);
    expect(new Set(PET_HOME_MOMENTS.map((moment) => moment.id)).size).toBe(18);
    for (const personality of ['gentle', 'curious', 'brave', 'playful', 'calm', 'performer']) {
      expect(PET_HOME_MOMENTS.filter((moment) => moment.personality === personality)).toHaveLength(3);
    }
    expect(PET_HOME_MOMENTS.every((moment) => moment.suggestions.length >= 2)).toBe(true);
    expect(PET_HOME_MOMENTS.every((moment) => moment.suggestions.every((id) => CATALOG_BY_ID.has(id)))).toBe(true);
    expect(Object.keys(PET_HOME_SCENE_MOTIFS).sort()).toEqual(PET_HOME_MOMENTS.map((moment) => moment.id).sort());
    expect(new Set(Object.values(PET_HOME_SCENE_MOTIFS)).size).toBeGreaterThanOrEqual(15);
  });

  it('같은 방도 성격에 따라 다른 행동과 추천을 만든다', () => {
    const room = placed(['bed_basic', 'bookshelf', 'plant_pot', 'rug_cream', 'guitar']);
    expect(petHomeMomentMatches('gentle', room).map((match) => match.moment.id)).toEqual([
      'gentle_nearby_nap', 'gentle_soft_guard', 'gentle_green_company',
    ]);
    expect(petHomeMomentMatches('performer', room).map((match) => match.moment.id)).toContain('performer_home_stage');
    expect(evaluatePetHome('curious', room).tip).toContain('TV와 거실장');
  });

  it('안락도는 벌점 없이 장면과 고유 선호 가구가 늘수록 올라간다', () => {
    const empty = evaluatePetHome('calm', []);
    const one = evaluatePetHome('calm', placed(['bed_basic']));
    const full = evaluatePetHome('calm', placed(['bed_basic', 'plant_pot', 'bookshelf']));
    expect(empty.score).toBe(20);
    expect(one.score).toBeGreaterThan(empty.score);
    expect(full.score).toBeGreaterThan(one.score);
    expect(full.nextMoment).toBeNull();
  });

  it('새 장면을 우선 선택하고 모두 기록했으면 날짜에 따라 다시 보여 준다', () => {
    const room = placed(['bed_basic', 'rug_cream', 'plant_pot']);
    const first = selectPetHomeMoment('gentle', room, new Set(), '2026-07-23');
    expect(first?.moment.id).toBe('gentle_nearby_nap');
    const next = selectPetHomeMoment('gentle', room, new Set(['gentle_nearby_nap']), '2026-07-23');
    expect(next?.moment.id).toBe('gentle_soft_guard');
    expect(selectPetHomeMoment('gentle', [], new Set(), '2026-07-23')).toBeNull();
  });

  it('펫별 최초 발견과 재방문 횟수를 사용자별로 영구 보존한다', () => {
    const store = new PetHomeMemoryStore('u1');
    expect(store.record('dog', 'brave_training_base', '2026-07-23')).toMatchObject({ first: true, record: { count: 1 } });
    expect(store.record('dog', 'brave_training_base', '2026-07-24')).toMatchObject({ first: false, record: { count: 2 } });
    expect(store.record('cat', 'calm_long_nap', '2026-07-24')).toMatchObject({ first: true });
    const restored = new PetHomeMemoryStore('u1');
    expect(restored.uniqueCount('dog')).toBe(1);
    expect(restored.totalScenes()).toBe(3);
    expect(restored.petPartners()).toBe(2);
    expect(restored.personalityCount()).toBe(2);
    expect(restored.views('dog').find((view) => view.id === 'brave_training_base')).toMatchObject({ recorded: true, count: 2 });
  });
});
