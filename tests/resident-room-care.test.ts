import { beforeEach, describe, expect, it } from 'vitest';
import {
  RESIDENT_ROOM_CARE, ROOM_CARE_HOMES, ResidentRoomCareStore,
  normalizeResidentRoomCareState, residentRoomCareProgress, residentRoomCareViews,
} from '../src/game/residents/residentRoomCare';
import type { TrustState } from '../src/game/residents/residents';
import { QUEST_BY_ID, RESIDENT_ROOM_CARE_QUESTS } from '../src/game/quests';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const met = (residentId: string): TrustState => ({ [residentId]: { v: 15, day: '2026-07-23' } });

describe('이웃의 작은 방 정리 의뢰', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('주민 10명에게 각 4개의 고유 물건과 실제 정리 자리 단서가 있다', () => {
    expect(RESIDENT_ROOM_CARE).toHaveLength(10);
    expect(ROOM_CARE_HOMES).toHaveLength(4);
    const ids = RESIDENT_ROOM_CARE.flatMap((room) => room.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(40);
    for (const room of RESIDENT_ROOM_CARE) {
      expect(room.items).toHaveLength(4);
      expect(room.afterScene.length).toBeGreaterThan(30);
      expect(room.keepsakeMark.length).toBeGreaterThan(0);
      expect(room.keepsakeNote.length).toBeGreaterThan(35);
      expect(room.items.every((item) => item.note.length > 15 && item.placedLine.length > 15)).toBe(true);
      expect(new Set(room.items.map((item) => item.homeId)).size).toBe(4);
    }
  });

  it('만난 주민의 방만 열리고 순서와 무관하게 네 물건을 정리할 수 있다', () => {
    const state = normalizeResidentRoomCareState(null);
    const views = residentRoomCareViews(state, met('haneul'));
    expect(views.find((room) => room.residentId === 'haneul')).toMatchObject({ unlocked: true, sorted: 0 });
    expect(views.find((room) => room.residentId === 'moturi')).toMatchObject({ unlocked: false });
  });

  it('틀린 자리는 진행을 잃거나 오답을 저장하지 않고 같은 물건을 다시 고를 수 있다', () => {
    const store = new ResidentRoomCareStore('friendly');
    const room = RESIDENT_ROOM_CARE[0]!;
    const target = room.items[0]!;
    const wrong = ROOM_CARE_HOMES.find((home) => home.id !== target.homeId)!;
    expect(store.sort(room.residentId, target.id, wrong.id, met(room.residentId))).toMatchObject({
      ok: false, reason: 'not-home',
    });
    expect(store.progress().sortedItems).toBe(0);
    expect(store.sort(room.residentId, target.id, target.homeId, met(room.residentId))).toMatchObject({
      ok: true, roomComplete: false,
    });
  });

  it('네 물건을 모두 정리하면 전후 장면과 기념품을 완성하고 한 번만 기록한다', () => {
    const store = new ResidentRoomCareStore('complete');
    const room = RESIDENT_ROOM_CARE[2]!;
    let completed = false;
    for (const entry of room.items) {
      const result = store.sort(room.residentId, entry.id, entry.homeId, met(room.residentId));
      expect(result.ok).toBe(true);
      if (result.ok) completed = result.roomComplete;
    }
    expect(completed).toBe(true);
    expect(store.progress()).toMatchObject({ sortedItems: 4, completedRooms: 1 });
    expect(store.sort(room.residentId, room.items[0]!.id, room.items[0]!.homeId, met(room.residentId)))
      .toMatchObject({ ok: false, reason: 'already' });
  });

  it('완성한 방만 대표 전후 장면으로 고르고 언제든 손실 없이 내릴 수 있다', () => {
    const store = new ResidentRoomCareStore('featured');
    const room = RESIDENT_ROOM_CARE[1]!;
    expect(store.feature(room.residentId)).toBe('locked');
    for (const entry of room.items) store.sort(room.residentId, entry.id, entry.homeId, met(room.residentId));
    expect(store.feature(room.residentId)).toBe('featured');
    expect(store.progress().featuredRooms).toBe(1);
    expect(store.feature(room.residentId)).toBe('cleared');
    expect(store.progress().featuredRooms).toBe(0);
  });

  it('기존 단일 대표 저장을 세 칸 보관함으로 옮기고 손상·미완성 기록을 제거한다', () => {
    const room = RESIDENT_ROOM_CARE[0]!;
    const ids = room.items.map((item) => item.id);
    expect(normalizeResidentRoomCareState({
      sortedItemIds: [ids[0], ids[0], 'bad', ...ids.slice(1)],
      featuredResidentId: room.residentId,
    })).toEqual({ version: 2, sortedItemIds: ids, featuredResidentIds: [room.residentId] });
    expect(normalizeResidentRoomCareState({
      sortedItemIds: [ids[0]], featuredResidentId: room.residentId,
    }).featuredResidentIds).toEqual([]);
  });

  it('40개 물건과 10개 방의 장기 진행을 영구 집계한다', () => {
    const firstTwo = RESIDENT_ROOM_CARE.slice(0, 2);
    const ids = firstTwo.flatMap((room) => room.items.map((item) => item.id));
    expect(residentRoomCareProgress({ version: 2, sortedItemIds: ids, featuredResidentIds: [firstTwo[0]!.residentId] }))
      .toEqual({ sortedItems: 8, completedRooms: 2, featuredRooms: 1, totalItems: 40, totalRooms: 10 });
  });

  it('대표 진열 세 칸은 완성 기록만 받고 네 번째 기념품은 기존 진열을 덮어쓰지 않는다', () => {
    const store = new ResidentRoomCareStore('three-scenes');
    const rooms = RESIDENT_ROOM_CARE.slice(0, 4);
    for (const room of rooms) {
      for (const entry of room.items) store.sort(room.residentId, entry.id, entry.homeId, met(room.residentId));
    }
    expect(rooms.slice(0, 3).map((room) => store.feature(room.residentId))).toEqual(['featured', 'featured', 'featured']);
    expect(store.feature(rooms[3]!.residentId)).toBe('full');
    expect(store.get().featuredResidentIds).toEqual(rooms.slice(0, 3).map((room) => room.residentId));
    expect(store.progress().featuredRooms).toBe(3);
  });

  it('첫 물건·첫 방·대표 장면부터 40점 전집까지 일곱 장기 기록으로 이어진다', () => {
    expect(RESIDENT_ROOM_CARE_QUESTS).toHaveLength(7);
    expect(QUEST_BY_ID.get('story_room_care_item_first')).toMatchObject({
      registryKey: 'resident_room_care_items', goal: 1,
    });
    expect(QUEST_BY_ID.get('story_room_care_featured')).toMatchObject({
      registryKey: 'resident_room_care_featured', goal: 1, prerequisite: 'story_room_care_first',
    });
    expect(QUEST_BY_ID.get('collect_room_care_featured_3')).toMatchObject({
      registryKey: 'resident_room_care_featured', goal: 3, prerequisite: 'story_room_care_featured',
    });
    expect(QUEST_BY_ID.get('master_room_care_rooms_10')).toMatchObject({
      registryKey: 'resident_room_care_rooms', goal: 10, prerequisite: 'collect_room_care_rooms_5',
    });
    expect(RESIDENT_ROOM_CARE_QUESTS.every((quest) => quest.location.includes('작은 방 정리'))).toBe(true);
  });
});
