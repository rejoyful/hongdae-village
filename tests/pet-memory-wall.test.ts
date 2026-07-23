import { describe, expect, it } from 'vitest';
import {
  PET_MEMORY_WALL_FRAMES, PET_MEMORY_WALL_LAYOUTS, PET_MEMORY_WALL_LIGHTS,
  PetMemoryWallStore, freshPetMemoryWallState, normalizePetMemoryWallState,
  type PetMemoryWallStorage,
} from '../src/game/home/petMemoryWall';
import type { PetMeetPostcard } from '../src/game/social/petMeetPostcards';

class MemStorage implements PetMemoryWallStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const dog = {
  petId: 'dog', personalityId: 'gentle', accessoryId: 'scarf',
  backdropId: 'rain_window', poseId: 'look_back',
} as const;
const cat = {
  petId: 'cat', personalityId: 'calm', accessoryId: 'beret',
  backdropId: 'cozy_home', poseId: 'daydream',
} as const;
const card = (id: string, neighborId = `neighbor-${id}`): PetMeetPostcard => ({
  id,
  direction: 'received',
  neighborId,
  neighborNickname: `이웃 ${id}`,
  kind: 'rain_shelter',
  day: '2026-07-23',
  createdAt: 1_774_419_600_000 + Number(id.replace(/\D/g, '') || 0),
  myPet: dog,
  neighborPet: cat,
});

describe('동행 추억 벽', () => {
  it('액자·조명·배치를 각각 네 가지 경쟁 없는 꾸미기로 제공한다', () => {
    expect(PET_MEMORY_WALL_FRAMES).toHaveLength(4);
    expect(PET_MEMORY_WALL_LIGHTS).toHaveLength(4);
    expect(PET_MEMORY_WALL_LAYOUTS).toHaveLength(4);
    expect(freshPetMemoryWallState()).toMatchObject({
      featured: [], frameId: 'kraft_triptych', lightId: 'warm', layoutId: 'row', visible: true,
    });
  });

  it('서로 다른 엽서 세 장을 독립 스냅샷으로 보존하고 네 번째를 막는다', () => {
    const storage = new MemStorage();
    const store = new PetMemoryWallStore('me', storage);
    expect(store.toggle(card('card-1'))).toBe('featured');
    expect(store.toggle(card('card-2'))).toBe('featured');
    expect(store.toggle(card('card-3'))).toBe('featured');
    expect(store.toggle(card('card-4'))).toBe('full');
    expect(store.progress()).toMatchObject({ featuredCards: 3, restyles: 3, visible: true });
    expect(new PetMemoryWallStore('me', storage).featured()).toEqual(store.featured());
    expect(store.toggle(card('card-2'))).toBe('unfeatured');
    expect(store.featured().map((item) => item.id)).toEqual(['card-1', 'card-3']);
  });

  it('꾸미기 발견과 실제 방 표시를 영구 기록한다', () => {
    const store = new PetMemoryWallStore('styling', new MemStorage());
    expect(store.selectFrame('film_strip')).toBe(true);
    expect(store.selectLight('neon')).toBe(true);
    expect(store.selectLayout('collage')).toBe(true);
    expect(store.setVisible(false)).toBe(true);
    expect(store.progress()).toEqual({
      featuredCards: 0,
      framesTried: 2,
      lightsTried: 2,
      layoutsTried: 2,
      restyles: 4,
      visible: false,
    });
  });

  it('손상된 자유 입력과 중복 엽서를 제거하고 안전한 기본값으로 복원한다', () => {
    const normalized = normalizePetMemoryWallState({
      featured: [
        card('good'),
        card('good'),
        { ...card('bad'), neighborId: 'bad id' },
        { ...card('kind'), kind: 'free text' },
      ],
      frameId: 'unknown',
      lightId: 'rain',
      layoutId: 'unknown',
      triedFrameIds: ['film_strip', 'bad'],
      triedLightIds: ['star'],
      triedLayoutIds: ['steps', 'bad'],
      restyles: -3,
    });
    expect(normalized.featured.map((item) => item.id)).toEqual(['good']);
    expect(normalized).toMatchObject({
      frameId: 'kraft_triptych',
      lightId: 'rain',
      layoutId: 'row',
      triedFrameIds: ['film_strip', 'kraft_triptych'],
      triedLightIds: ['star', 'rain'],
      triedLayoutIds: ['steps', 'row'],
      restyles: 0,
    });
  });
});
