import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PET_STYLE_BACKDROPS, PET_STYLE_FEATURED_MAX, PET_STYLE_POSES, PET_STYLE_SLOT_COUNT,
  PetStyleStudioStore, freshPetStyleStudioState, normalizePetStyleStudioState,
  type PetStyleDraft, type PetStyleStorage,
} from '../src/game/pets/petStyleStudio';

class MemStorage implements PetStyleStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const dogLook = (overrides: Partial<PetStyleDraft> = {}): PetStyleDraft => ({
  petId: 'dog',
  petName: '몽실',
  personalityId: 'gentle',
  accessoryId: 'none',
  backdropId: 'alley_neon',
  poseId: 'hello',
  ...overrides,
});

describe('동행 코디 카드 아틀리에', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    vi.spyOn(Date, 'now').mockReturnValue(24_072_300);
  });

  it('여섯 장면 배경과 다섯 포즈, 여섯 보관칸을 제공한다', () => {
    expect(PET_STYLE_BACKDROPS).toHaveLength(6);
    expect(PET_STYLE_POSES).toHaveLength(5);
    expect(new Set(PET_STYLE_BACKDROPS.map((item) => item.id)).size).toBe(6);
    expect(new Set(PET_STYLE_POSES.map((item) => item.id)).size).toBe(5);
    expect(freshPetStyleStudioState().slots).toHaveLength(PET_STYLE_SLOT_COUNT);
  });

  it('현재 동행 코디를 독립 스냅샷으로 저장하고 같은 디자인은 중복 집계하지 않는다', () => {
    const store = new PetStyleStudioStore('snapshot', storage);
    const draft = dogLook();
    expect(store.save(0, draft)).toBe('saved');
    draft.petName = '바뀐 이름';
    expect(store.card(0)?.petName).toBe('몽실');
    expect(store.save(1, dogLook())).toBe('saved');
    expect(store.progress()).toMatchObject({
      savedCards: 2, totalCaptures: 2, discoveries: 1,
      pets: 1, personalities: 1, accessories: 1, backdrops: 1, poses: 1,
    });
  });

  it('기존 칸을 교체해도 과거 디자인은 남고 대표 전시는 새 카드로 이어진다', () => {
    const store = new PetStyleStudioStore('replace', storage);
    store.save(0, dogLook());
    const firstId = store.card(0)!.id;
    expect(store.feature(firstId)).toBe('featured');
    expect(store.save(0, dogLook({ personalityId: 'brave', backdropId: 'forest_star' }))).toBe('replaced');
    expect(store.card(0)!.id).not.toBe(firstId);
    expect(store.get().featuredIds).toEqual([store.card(0)!.id]);
    expect(store.progress()).toMatchObject({
      savedCards: 1, totalCaptures: 2, discoveries: 2, featured: 1,
    });
  });

  it('대표 코디는 세 장까지 올리고 내릴 수 있다', () => {
    const store = new PetStyleStudioStore('featured', storage);
    for (let slot = 0; slot < 4; slot += 1) {
      store.save(slot, dogLook({
        backdropId: PET_STYLE_BACKDROPS[slot]!.id,
        poseId: PET_STYLE_POSES[slot]!.id,
      }));
    }
    const ids = store.get().slots.slice(0, 4).map((card) => card!.id);
    for (const id of ids.slice(0, PET_STYLE_FEATURED_MAX)) expect(store.feature(id)).toBe('featured');
    expect(store.feature(ids[3]!)).toBe('full');
    expect(store.feature(ids[0]!)).toBe('cleared');
    expect(store.feature(ids[3]!)).toBe('featured');
    expect(store.progress().featured).toBe(PET_STYLE_FEATURED_MAX);
    const featured = store.featuredCards();
    expect(featured.map((card) => card.id)).toEqual([ids[1], ids[2], ids[3]]);
    featured[0]!.petName = '외부에서 바꾼 이름';
    expect(store.featuredCards()[0]?.petName).toBe('몽실');
  });

  it('적용 횟수와 코디 기록을 재접속 뒤에도 복구한다', () => {
    const first = new PetStyleStudioStore('persist', storage);
    first.save(2, dogLook({ petId: 'cat', petName: '보리', personalityId: 'curious', poseId: 'look_back' }));
    first.recordApply();
    first.recordApply();
    const restored = new PetStyleStudioStore('persist', storage);
    expect(restored.get()).toEqual(first.get());
    expect(restored.progress()).toEqual(first.progress());
    expect(restored.progress().applies).toBe(2);
    expect(restored.save(-1, dogLook())).toBe('invalid');
  });

  it('손상된 슬롯·중복 ID·알 수 없는 펫과 발견 기록을 안전하게 정리한다', () => {
    const valid = {
      ...dogLook({ petName: '<몽실>\n' }),
      id: 'valid',
      savedAt: 12.8,
    };
    const normalized = normalizePetStyleStudioState({
      slots: [
        valid,
        valid,
        { ...valid, id: 'dragon', petId: 'dragon' },
        { ...valid, id: 'bad-pose', poseId: 'flying' },
      ],
      featuredIds: ['valid', 'missing', 'valid'],
      discoveries: [
        'dog:gentle:none:alley_neon:hello',
        'dog:gentle:none:alley_neon:hello',
        'dragon:gentle:none:alley_neon:hello',
      ],
      totalCaptures: -3,
      applies: -9,
    });
    expect(normalized.slots).toHaveLength(PET_STYLE_SLOT_COUNT);
    expect(normalized.slots.filter(Boolean)).toHaveLength(1);
    expect(normalized.slots[0]?.petName).toBe('몽실');
    expect(normalized.featuredIds).toEqual(['valid']);
    expect(normalized.discoveries).toEqual(['dog:gentle:none:alley_neon:hello']);
    expect(normalized.totalCaptures).toBe(1);
    expect(normalized.applies).toBe(0);
  });
});
