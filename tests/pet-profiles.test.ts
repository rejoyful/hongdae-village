import { beforeEach, describe, expect, it } from 'vitest';
import {
  PET_ACCESSORIES,
  PET_PERSONALITIES,
  defaultPetPersonality,
  isPetAccessoryId,
  isPetPersonalityId,
  petAccessoryViews,
  sanitizePetNickname,
} from '../src/game/pets/petProfiles';
import { PET_GROWTH_CHAPTERS } from '../src/game/art/petGrowthMemoryArt';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('펫 개성 프로필 규칙', () => {
  it('기존 성장 추억 네 장과 같은 순서의 픽셀 앨범 챕터를 제공한다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const store = new PetStore(); store.adopt('dog');
    expect(PET_GROWTH_CHAPTERS.map((chapter) => chapter.id)).toEqual(store.memories('dog').map((memory) => memory.id));
    expect(new Set(PET_GROWTH_CHAPTERS.map((chapter) => chapter.palette.join(':'))).size).toBe(4);
  });

  it('성격 6종과 돌봄·레벨·연속 의뢰·메인 여정 장식 및 기본 모습이 고유 id를 가진다', () => {
    expect(PET_PERSONALITIES).toHaveLength(6);
    expect(new Set(PET_PERSONALITIES.map((item) => item.id)).size).toBe(6);
    expect(PET_ACCESSORIES).toHaveLength(36);
    expect(PET_ACCESSORIES.filter((item) => item.id !== 'none')).toHaveLength(35);
    expect(PET_ACCESSORIES.filter((item) => item.requiredBadgeId)).toHaveLength(28);
    expect(new Set(PET_ACCESSORIES.map((item) => item.id)).size).toBe(36);
  });

  it('별명은 공백과 제어문자를 정리하고 한글 기준 8자까지만 보존한다', () => {
    expect(sanitizePetNickname('  말랑\n 콩떡  ')).toBe('말랑 콩떡');
    expect(sanitizePetNickname('가나다라마바사아자차')).toBe('가나다라마바사아');
    expect(sanitizePetNickname('   ')).toBeNull();
    expect(sanitizePetNickname(null)).toBeNull();
  });

  it('네트워크에서 사용하는 성격·장식 id는 화이트리스트만 허용한다', () => {
    expect(isPetPersonalityId('curious')).toBe(true);
    expect(isPetPersonalityId('admin')).toBe(false);
    expect(isPetAccessoryId('beret')).toBe(true);
    expect(isPetAccessoryId('../crown')).toBe(false);
  });

  it('종마다 어울리는 기본 성격이 있고 알 수 없는 종은 다정함으로 폴백한다', () => {
    expect(defaultPetPersonality('dog')).toBe('brave');
    expect(defaultPetPersonality('cat')).toBe('calm');
    expect(defaultPetPersonality('missing')).toBe('gentle');
  });

  it('액세서리는 실제 돌봄 기록을 모두 만족할 때만 열린다', () => {
    const early = petAccessoryViews({ affinity: 24, plays: 2, trainings: 2, tricks: 1, memories: 2 });
    expect(early.find((item) => item.id === 'ribbon')?.unlocked).toBe(true);
    expect(early.find((item) => item.id === 'scarf')).toMatchObject({ unlocked: false, progress: 24, goal: 25 });
    expect(early.find((item) => item.id === 'bandana')).toMatchObject({ unlocked: false, progress: 2, goal: 3 });
    expect(early.find((item) => item.id === 'crown')?.unlocked).toBe(false);

    const complete = petAccessoryViews({ affinity: 100, plays: 3, trainings: 3, tricks: 3, memories: 4 });
    expect(complete.filter((item) => !item.requiredBadgeId).every((item) => item.unlocked)).toBe(true);
    expect(complete.filter((item) => item.requiredBadgeId).every((item) => !item.unlocked)).toBe(true);

    const villageComplete = petAccessoryViews(
      { affinity: 100, plays: 3, trainings: 3, tricks: 3, memories: 4 },
      PET_ACCESSORIES.flatMap((item) => item.requiredBadgeId ? [item.requiredBadgeId] : []),
    );
    expect(villageComplete.every((item) => item.unlocked)).toBe(true);
  });
});

describe('PetStore 프로필 호환 저장', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('기존 저장값에도 기본 성격·기본 모습이 무손실로 붙는다', async () => {
    localStorage.setItem('hv-pets-v1', JSON.stringify({
      owned: ['dog'], active: 'dog', affinity: { dog: 10 }, fedDay: {}, feeds: 0, unlocked: [],
      playedDay: {}, trainedDay: {}, plays: {}, trainings: {}, tricks: {},
    }));
    const { PetStore } = await import('../src/game/pets/petStore');
    const store = new PetStore();
    expect(store.displayName('dog')).toBe('강아지');
    expect(store.personality('dog')).toBe('brave');
    expect(store.accessory('dog')).toBe('none');
    expect(store.unlockedAccessoryCount()).toBe(1);
  });

  it('별명·성격·열린 액세서리가 저장되고 월드 표시값으로 복원된다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const store = new PetStore();
    store.adopt('dog');
    expect(store.setNickname('dog', '  밤 산책  ')).toBe(true);
    expect(store.setPersonality('dog', 'curious')).toBe(true);
    expect(store.equipAccessory('dog', 'ribbon')).toBe(true);
    expect(store.equipAccessory('dog', 'crown')).toBe(false);
    expect(store.customizedCount()).toBe(1);

    const restored = new PetStore();
    expect(restored.nickname('dog')).toBe('밤 산책');
    expect(restored.displayName('dog')).toBe('밤 산책');
    expect(restored.personality('dog')).toBe('curious');
    expect(restored.accessory('dog')).toBe('ribbon');
  });

  it('친밀도 100을 만든 뒤에만 단짝 왕관을 착용한다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const store = new PetStore();
    store.adopt('cat');
    for (let index = 0; index < 45; index += 1) store.pet('cat');
    expect(store.affinity('cat')).toBe(100);
    expect(store.accessoryViews('cat').find((item) => item.id === 'crown')?.unlocked).toBe(true);
    expect(store.equipAccessory('cat', 'crown')).toBe(true);
    expect(store.accessory('cat')).toBe('crown');
  });

  it('마을 레벨 장식은 배지 공급자에 확인된 뒤에만 착용한다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const badges: string[] = [];
    const store = new PetStore(() => badges);
    store.adopt('dog');
    expect(store.equipAccessory('dog', 'walking_pin')).toBe(false);
    badges.push('badge_master_village_level_5');
    expect(store.accessoryViews('dog').find((item) => item.id === 'walking_pin')?.unlocked).toBe(true);
    expect(store.equipAccessory('dog', 'walking_pin')).toBe(true);
  });
});
