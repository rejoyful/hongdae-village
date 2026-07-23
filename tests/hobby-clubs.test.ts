import { beforeEach, describe, expect, it } from 'vitest';
import type { QuestState } from '../src/game/questProgress';
import {
  HOBBY_CLUB_ROOMS, HOBBY_CLUBS, HobbyClubStore, claimHobbyClubChapter, freshHobbyClubState,
  hobbyClubProgress, hobbyClubViews, normalizeHobbyClubState,
} from '../src/game/clubs/hobbyClubs';
import { HOBBY_CLUB_FAN_QUESTS } from '../src/game/quests';
import { collectionWorldGuide } from '../src/game/world/isometricCollectionGuide';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const quests = (lifetimeCounts: Record<string, number> = {}): QuestState => ({
  day: '2026-07-23', counts: {}, claimed: [], lifetimeCounts,
});

describe('골목 동아리', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('여섯 동아리가 각각 다섯 장과 세 조건을 제공한다', () => {
    expect(HOBBY_CLUBS).toHaveLength(6);
    expect(HOBBY_CLUBS.every((club) => club.chapters.length === 5)).toBe(true);
    expect(HOBBY_CLUBS.flatMap((club) => club.chapters)).toHaveLength(30);
    expect(HOBBY_CLUBS.every((club) => club.chapters.every((chapter) => chapter.conditions.length === 3))).toBe(true);
    expect(Object.values(HOBBY_CLUB_ROOMS)).toHaveLength(6);
    expect(Object.values(HOBBY_CLUB_ROOMS).every((room) => room.pieces.length === 5)).toBe(true);
  });

  it('기존 평생 기록을 소급해 첫 장을 준비 상태로 만든다', () => {
    const state = freshHobbyClubState();
    const views = hobbyClubViews(state, quests({ customize_save: 2, fashion_dye: 1, closet_save: 3 }));
    const style = views.find((club) => club.id === 'style')!;
    expect(style.chapters[0]).toMatchObject({ complete: true, available: true, claimed: false, stamps: 3 });
    expect(style.ready).toBe(1);
    expect(style.nextCondition).toBeNull();
  });

  it('세 조건과 앞 장을 모두 확인한 뒤 순서대로 발간한다', () => {
    const state = freshHobbyClubState();
    const progress = quests({
      customize_save: 2, fashion_dye: 1, closet_save: 3, fashion_preset: 4, lookbook_entries: 2,
    });
    expect(claimHobbyClubChapter(state, 'style_2', progress)).toEqual({ ok: false, reason: 'previous-chapter' });
    expect(claimHobbyClubChapter(state, 'style_1', progress)).toMatchObject({ ok: true, firstSocietyChapter: true });
    expect(claimHobbyClubChapter(state, 'style_2', progress)).toMatchObject({ ok: true, firstSocietyChapter: false });
    expect(claimHobbyClubChapter(state, 'style_2', progress)).toEqual({ ok: false, reason: 'already-claimed' });
    expect(hobbyClubProgress(state, progress)).toMatchObject({ chapters: 2, societies: 1, rankMax: 2 });
  });

  it('가장 가까운 미완료 조건을 친절한 다음 행동으로 고른다', () => {
    const style = hobbyClubViews(freshHobbyClubState(), quests({ customize_save: 1, fashion_dye: 0, closet_save: 0 }))[0]!;
    expect(style.nextCondition).toMatchObject({ key: 'fashion_dye', current: 0, goal: 1 });
  });

  it('손상된 뒤 장은 버리고 유효한 연속 발간과 관심 동아리만 복원한다', () => {
    expect(normalizeHobbyClubState({
      claimedChapterIds: ['style_1', 'style_3', 'missing', 'home_2'], pinnedClubId: 'water', lastClaimedAt: -3,
      featuredClubIds: ['style', 'home', 'missing'], roomReplayCounts: { style: 4, home: 7, water: -1 },
    })).toEqual({
      version: 2, claimedChapterIds: ['style_1'], pinnedClubId: 'water', featuredClubIds: ['style'],
      roomReplayCounts: { style: 4 }, lastClaimedAt: 0,
    });
  });

  it('사용자별 발간 기록과 하나의 관심 동아리를 보존한다', () => {
    const q = quests({ pet_adopt: 1, pet_feed: 1, pet_profiles_customized: 1 });
    const store = new HobbyClubStore('club-a');
    expect(store.pin('companion')).toBe(true);
    expect(store.claim('companion_1', q)).toMatchObject({ ok: true });
    expect(new HobbyClubStore('club-a').get()).toMatchObject({ claimedChapterIds: ['companion_1'], pinnedClubId: 'companion' });
    expect(new HobbyClubStore('club-b').get()).toMatchObject({ claimedChapterIds: [], pinnedClubId: null });
  });

  it('발간한 장을 팬 키트와 아지트 단계로 해금한다', () => {
    const state = freshHobbyClubState();
    state.claimedChapterIds = ['style_1', 'style_2', 'companion_1'];
    const views = hobbyClubViews(state, quests());
    expect(views.find((club) => club.id === 'style')).toMatchObject({
      rank: 2, featured: false, roomReplayCount: 0,
    });
    expect(views.find((club) => club.id === 'style')!.fanKit.map((piece) => piece.unlocked))
      .toEqual([true, true, false, false, false]);
    expect(hobbyClubProgress(state, quests())).toMatchObject({
      fanKitPieces: 3, totalFanKitPieces: 30, completeKits: 0, featuredClubs: 0, roomReplays: 0,
    });
  });

  it('활동 동아리만 대표 전시와 장면 다시 보기를 기록하고 대표는 세 곳으로 제한한다', () => {
    const store = new HobbyClubStore('club-fans');
    const state = store.get();
    state.claimedChapterIds = ['style_1', 'home_1', 'companion_1', 'table_1'];
    expect(store.toggleFeatured('water')).toBe(false);
    expect(store.toggleFeatured('style')).toBe(true);
    expect(store.toggleFeatured('home')).toBe(true);
    expect(store.toggleFeatured('companion')).toBe(true);
    expect(store.toggleFeatured('table')).toBe(false);
    expect(store.replayRoom('style')).toBe(true);
    expect(store.replayRoom('style')).toBe(true);
    expect(store.replayRoom('water')).toBe(false);
    expect(store.progress(quests())).toMatchObject({ featuredClubs: 3, roomReplays: 2 });
    expect(store.toggleFeatured('home')).toBe(true);
    expect(store.toggleFeatured('table')).toBe(true);
    expect(new HobbyClubStore('club-fans').get()).toMatchObject({
      featuredClubIds: ['style', 'companion', 'table'], roomReplayCounts: { style: 2 },
    });
  });

  it('응원 키트·완성 키트·대표 전시·장면 재생을 여덟 영구 퀘스트와 실제 동아리 장소로 잇는다', () => {
    expect(HOBBY_CLUB_FAN_QUESTS).toHaveLength(8);
    expect(new Set(HOBBY_CLUB_FAN_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'hobby_club_fan_pieces', 'hobby_club_complete_kits', 'hobby_club_featured', 'hobby_club_room_replays',
    ]));
    expect(collectionWorldGuide('metric:hobby_club_room_replays')).toMatchObject({
      mode: 'activity', activityKind: 'clubs',
    });
    expect(villageRequestDestinationForMetric('hobby_club_fan_pieces')).toBe('clubs');
  });
});
