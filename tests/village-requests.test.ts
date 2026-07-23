import { beforeEach, describe, expect, it } from 'vitest';
import { bumpQuest, normalizeState, setQuestMetric, type QuestState } from '../src/game/questProgress';
import {
  freshVillageRequestState, normalizeVillageRequestState, villageRequestProgress, villageRequestViews,
  VILLAGE_REQUESTS, VillageRequestStore,
} from '../src/game/requests/villageRequests';
import {
  normalizeVillageRequestStoryState, recommendedVillageRequestStory, villageRequestDestinationForMetric,
  villageRequestStoryProgress, villageRequestStoryViews, VILLAGE_REQUEST_STORIES,
  VILLAGE_REQUEST_STORY_CHAPTERS,
} from '../src/game/requests/villageRequestStories';
import {
  REQUEST_STORY_REWARDS, requestStoryMetricKey, requestStoryRewardViews,
} from '../src/game/progression/requestStoryRewards';

class MemStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  clear(): void { this.data.clear(); }
}

const TODAY = '2026-07-23';
const questState = (): QuestState => normalizeState(null, TODAY);

describe('골목 의뢰소', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('여덟 분야에 세 장씩 총 24개 수제 의뢰가 있다', () => {
    expect(VILLAGE_REQUESTS).toHaveLength(24);
    expect(new Set(VILLAGE_REQUESTS.map((item) => item.id)).size).toBe(24);
    const counts = new Map<string, number>();
    for (const item of VILLAGE_REQUESTS) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    expect([...counts.values()]).toEqual([3, 3, 3, 3, 3, 3, 3, 3]);
  });

  it('여덟 갈래 연속 의뢰가 세 장·두 단서씩 총 24장 48단서로 이어진다', () => {
    expect(VILLAGE_REQUEST_STORIES).toHaveLength(8);
    expect(VILLAGE_REQUEST_STORY_CHAPTERS).toHaveLength(24);
    expect(VILLAGE_REQUEST_STORY_CHAPTERS.flatMap((item) => item.requirements)).toHaveLength(48);
    expect(new Set(VILLAGE_REQUEST_STORIES.map((item) => item.category)).size).toBe(8);
    for (const story of VILLAGE_REQUEST_STORIES) {
      expect(story.chapters.map((item) => item.act)).toEqual([1, 2, 3]);
      expect(story.chapters.every((item) => item.requirements.length === 2)).toBe(true);
    }
  });

  it('연속 의뢰는 수락 시점 없이 평생 기록을 소급하고 첫 장만 먼저 펼친다', () => {
    const state = freshVillageRequestState();
    let quests = setQuestMetric(questState(), 'customize_save', 1);
    quests = setQuestMetric(quests, 'photo_taken', 1);
    quests = setQuestMetric(quests, 'fashion_dye', 99);
    quests = setQuestMetric(quests, 'lookbook_entries', 99);
    const story = villageRequestStoryViews(state.stories, quests).find((item) => item.id === 'alley_issue')!;
    expect(story.chapters[0]).toMatchObject({ unlocked: true, ready: true, progressPct: 100 });
    expect(story.chapters[1]).toMatchObject({ unlocked: false, ready: false, progressPct: 100 });
    // 사진 기록은 다른 이야기의 단서에도 동시에 반영되어 중복 노가다를 만들지 않는다.
    expect(villageRequestStoryProgress(state.stories, quests)).toMatchObject({ completedClues: 5, readyChapters: 1 });
  });

  it('장 기록은 순서대로만 가능하고 다음 장은 기존 기록으로 즉시 준비된다', () => {
    const store = new VillageRequestStore('story-sequence');
    let quests = setQuestMetric(questState(), 'customize_save', 1);
    quests = setQuestMetric(quests, 'photo_taken', 1);
    quests = setQuestMetric(quests, 'fashion_dye', 3);
    quests = setQuestMetric(quests, 'lookbook_entries', 6);
    quests = setQuestMetric(quests, 'lookbook_stars', 12);
    expect(store.claimStoryChapter('alley_issue_2', quests)).toMatchObject({ ok: false, reason: 'locked' });
    expect(store.claimStoryChapter('alley_issue_1', quests).ok).toBe(true);
    expect(store.storyViews(quests).find((item) => item.id === 'alley_issue')?.chapters[1]).toMatchObject({ unlocked: true, ready: true });
    expect(store.claimStoryChapter('alley_issue_2', quests).ok).toBe(true);
    expect(store.claimStoryChapter('alley_issue_3', quests).ok).toBe(true);
    expect(store.storyProgress(quests)).toMatchObject({ claimedChapters: 3, completedStories: 1, completedStoryIds: ['alley_issue'] });
    expect(store.progress(quests).storyCompletedIds).toEqual(['alley_issue']);
  });

  it('여덟 완결 이야기는 각각 코디·펫 장식·집 레시피 한 세트를 자동 해금한다', () => {
    expect(REQUEST_STORY_REWARDS).toHaveLength(8);
    expect(new Set(REQUEST_STORY_REWARDS.map((reward) => reward.storyId)).size).toBe(8);
    expect(new Set(REQUEST_STORY_REWARDS.map((reward) => reward.outfit.id)).size).toBe(8);
    expect(new Set(REQUEST_STORY_REWARDS.map((reward) => reward.petAccessory.id)).size).toBe(8);
    expect(new Set(REQUEST_STORY_REWARDS.map((reward) => reward.homeRecipe.id)).size).toBe(8);
    expect(requestStoryMetricKey('rain_map')).toBe('village_request_story_rain_map');
    const views = requestStoryRewardViews(['badge_story_request_reward_rain_map']);
    expect(views.find((reward) => reward.storyId === 'rain_map')?.unlocked).toBe(true);
    expect(views.filter((reward) => reward.storyId !== 'rain_map').every((reward) => !reward.unlocked)).toBe(true);
  });

  it('추적한 연속 의뢰를 추천하고 완결하면 자동 추적을 해제한다', () => {
    const store = new VillageRequestStore('story-track');
    const quests = questState();
    expect(store.trackStory('rain_map')).toBe(true);
    expect(store.recommendedStory(quests)?.id).toBe('rain_map');
    expect(store.trackStory('rain_map')).toBe(false);
    expect(store.trackStory('not-a-story' as 'rain_map')).toBe(false);
  });

  it('손상된 연속 의뢰 저장은 존재하는 앞 장까지만 복구하고 길 안내를 실제 활동으로 매핑한다', () => {
    const state = normalizeVillageRequestStoryState({
      claimedChapters: ['rain_map_1', 'rain_map_3', 'fake', 'alley_issue_2'],
      trackedStoryId: 'rain_map',
    });
    expect(state.claimedChapters).toEqual(['rain_map_1']);
    expect(state.trackedStoryId).toBe('rain_map');
    expect(villageRequestDestinationForMetric('lookbook_entries')).toBe('atelier');
    expect(villageRequestDestinationForMetric('resident_greet')).toBe('residents');
    expect(villageRequestDestinationForMetric('resident_fan_ribbons')).toBe('residents');
    expect(villageRequestDestinationForMetric('resident_room_care_rooms')).toBe('residents');
    expect(villageRequestDestinationForMetric('adventure_kits_saved')).toBe('adventure-kit');
    expect(villageRequestDestinationForMetric('market_unique_items')).toBe('market');
    expect(villageRequestDestinationForMetric('monster_species')).toBe('hunt');
    expect(villageRequestDestinationForMetric('unknown')).toBeNull();
  });

  it('가장 가까운 준비 장을 자동 추천한다', () => {
    const state = freshVillageRequestState();
    let quests = setQuestMetric(questState(), 'pet_adopt', 1);
    quests = setQuestMetric(quests, 'pet_feed', 1);
    expect(recommendedVillageRequestStory(state.stories, quests)?.id).toBe('paw_letter');
  });

  it('수락 이전의 평생 기록은 진행으로 세지 않고 이후 증가분만 계산한다', () => {
    const store = new VillageRequestStore('baseline');
    let quests = bumpQuest(questState(), 'resident_greet', 20);
    expect(store.accept('neighbor_hello', quests).ok).toBe(true);
    expect(store.views(quests).find((item) => item.id === 'neighbor_hello')?.progress).toBe(0);
    quests = bumpQuest(quests, 'resident_greet', 2);
    expect(store.views(quests).find((item) => item.id === 'neighbor_hello')).toMatchObject({ progress: 2, done: false });
  });

  it('활성 의뢰는 최대 세 장이며 이미 활성인 의뢰 재선택은 안전하다', () => {
    const store = new VillageRequestStore('slots');
    const quests = questState();
    for (const id of ['neighbor_hello', 'street_cafe', 'companion_walk']) expect(store.accept(id, quests).ok).toBe(true);
    expect(store.accept('style_save', quests)).toMatchObject({ ok: false, reason: 'full' });
    expect(store.accept('neighbor_hello', quests).ok).toBe(true);
    expect(store.progress().active).toBe(3);
  });

  it('잠시 보관한 의뢰는 진행량을 잃지 않고 다시 이어 간다', () => {
    const store = new VillageRequestStore('pause');
    let quests = questState();
    store.accept('water_long', quests);
    quests = setQuestMetric(quests, 'fishing_total', 4);
    expect(store.pause('water_long', quests).ok).toBe(true);
    quests = setQuestMetric(quests, 'fishing_total', 40);
    expect(store.views(quests).find((item) => item.id === 'water_long')?.progress).toBe(4);
    store.accept('water_long', quests);
    quests = setQuestMetric(quests, 'fishing_total', 42);
    expect(store.views(quests).find((item) => item.id === 'water_long')).toMatchObject({ progress: 6, done: true });
  });

  it('완료 도장을 찍으면 고유 도감과 반복 완료가 함께 쌓인다', () => {
    const store = new VillageRequestStore('claim');
    let quests = questState();
    store.accept('street_cafe', quests);
    quests = bumpQuest(quests, 'q_cafe');
    expect(store.claim('street_cafe', quests, 100)).toMatchObject({ ok: true });
    expect(store.progress()).toMatchObject({ uniqueStamps: 1, totalCompleted: 1, categoryStamps: 1 });
    store.accept('street_cafe', quests);
    quests = bumpQuest(quests, 'q_cafe');
    store.claim('street_cafe', quests, 200);
    expect(store.progress()).toMatchObject({ uniqueStamps: 1, totalCompleted: 2 });
  });

  it('완료되지 않은 의뢰는 도장을 받을 수 없다', () => {
    const store = new VillageRequestStore('guard');
    const quests = questState();
    expect(store.claim('street_busking', quests)).toMatchObject({ ok: false, reason: 'not-active' });
    store.accept('street_busking', quests);
    expect(store.claim('street_busking', quests)).toMatchObject({ ok: false, reason: 'not-done' });
  });

  it('손상된 저장값을 정규화하고 알 수 없는 의뢰를 제거한다', () => {
    const state = normalizeVillageRequestState({
      totalCompleted: 1,
      records: {
        street_cafe: { status: 'active', baseline: -9, carry: 1.8, repeats: 2.9, acceptedAt: Infinity },
        fake: { status: 'active', repeats: 99 },
      },
    });
    expect(state.records.fake).toBeUndefined();
    expect(state.records.street_cafe).toMatchObject({ status: 'active', baseline: 0, carry: 1, repeats: 2, acceptedAt: 0 });
    expect(state.totalCompleted).toBe(2);
  });

  it('도장과 반복 완료가 평판·랭크를 만들고 사용자 저장은 분리된다', () => {
    const state = freshVillageRequestState();
    state.records.street_cafe = { id: 'street_cafe', status: 'available', baseline: 0, carry: 0, repeats: 2, acceptedAt: 0, lastCompletedAt: 1 };
    state.totalCompleted = 2;
    expect(villageRequestProgress(state)).toMatchObject({ reputation: 20, rank: 2, rankName: '심부름꾼' });
    expect(villageRequestViews(state, questState()).find((item) => item.id === 'street_cafe')).toMatchObject({ stamped: true, repeats: 2 });
    new VillageRequestStore('a').accept('neighbor_hello', questState());
    expect(new VillageRequestStore('a').progress().active).toBe(1);
    expect(new VillageRequestStore('b').progress().active).toBe(0);
  });
});
