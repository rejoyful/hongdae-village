import { describe, expect, it } from 'vitest';
import {
  PET_MEET_ALBUM_MAX, PET_MEET_SCENES, PetMeetPostcardStore,
  normalizePetMeetState, type PetMeetStorage,
} from '../src/game/social/petMeetPostcards';

class MemStorage implements PetMeetStorage {
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

describe('동행 인사 엽서', () => {
  it('서로 다른 여섯 장면을 경쟁 수치 없이 제공한다', () => {
    expect(PET_MEET_SCENES).toHaveLength(6);
    expect(new Set(PET_MEET_SCENES.map((scene) => scene.id)).size).toBe(6);
    expect(PET_MEET_SCENES.every((scene) => scene.message.length > 0)).toBe(true);
  });

  it('같은 이웃에게 하루 한 장만 보내고 양쪽 공개 동행 스냅샷을 독립 보존한다', () => {
    const storage = new MemStorage();
    const store = new PetMeetPostcardStore('me', storage);
    const now = new Date('2026-07-23T03:00:00.000Z');
    expect(store.recordSent('neighbor-a', '새벽별', 'rain_shelter', dog, cat, now)).toBe('sent');
    expect(store.recordSent('neighbor-a', '새벽별', 'little_stage', dog, cat, now)).toBe('today');
    const card = store.postcards()[0]!;
    expect(card).toMatchObject({
      direction: 'sent', neighborId: 'neighbor-a', neighborNickname: '새벽별',
      kind: 'rain_shelter', day: '2026-07-23', myPet: dog, neighborPet: cat,
    });
    expect(card.myPet).not.toHaveProperty('petName');
    expect(store.progress(now)).toMatchObject({
      sent: 1, received: 0, total: 1, scenes: 1, neighbors: 1, species: 2, pairs: 1, albumCards: 1,
    });
    expect(new PetMeetPostcardStore('me', storage).postcards()).toEqual(store.postcards());
  });

  it('받은 엽서도 이웃별 하루 한 장으로 중복을 막고 평생 발견 기록을 합친다', () => {
    const store = new PetMeetPostcardStore('me', new MemStorage());
    const now = new Date('2026-07-23T03:00:00.000Z');
    expect(store.receive('neighbor-a', '<새벽별>', 'alley_walk', dog, cat, now)).toBe('received');
    expect(store.receive('neighbor-a', '새벽별', 'forest_star', dog, cat, now)).toBe('duplicate');
    expect(store.receive('me', '나', 'alley_walk', dog, cat, now)).toBe('self');
    expect(store.receive('bad id', '이웃', 'alley_walk', dog, cat, now)).toBe('invalid');
    expect(store.progress(now)).toMatchObject({ received: 1, total: 1, scenes: 1, neighbors: 1 });
    expect(store.postcards()[0]?.neighborNickname).toBe('새벽별');
  });

  it('손상된 자유 입력·알 수 없는 장면·펫을 제거하고 앨범 상한을 지킨다', () => {
    const records: Array<Record<string, unknown>> = Array.from({ length: PET_MEET_ALBUM_MAX + 4 }, (_, index) => ({
      id: `<bad-${index}>`,
      direction: 'received',
      neighborId: `neighbor-${index}`,
      neighborNickname: '<이웃>\n',
      kind: 'cafe_window',
      day: 'bad',
      createdAt: index + 1,
      myPet: dog,
      neighborPet: cat,
    }));
    records[1] = { ...records[1], kind: 'free-text' };
    records[2] = { ...records[2], neighborPet: { ...cat, petId: 'dragon' } };
    const normalized = normalizePetMeetState({
      records,
      sentTotal: -3,
      receivedTotal: 8.9,
      sceneIds: ['alley_walk', 'free-text'],
      neighborIds: ['neighbor-a', 'bad id'],
    });
    expect(normalized.records.length).toBe(PET_MEET_ALBUM_MAX - 2);
    expect(normalized.records[0]?.neighborNickname).toBe('이웃');
    expect(normalized.records[0]?.id).toBe('bad-0');
    expect(normalized.sentTotal).toBe(0);
    expect(normalized.receivedTotal).toBe(8);
    expect(normalized.sceneIds).toEqual(['alley_walk']);
    expect(normalized.neighborIds).toEqual(['neighbor-a']);
  });
});
