import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOG } from '../src/items/catalog';
import {
  OBJECT_STORIES, OBJECT_STORY_BY_ITEM, OBJECT_STORY_CHAPTERS, OBJECT_STORY_FAVORITE_MAX,
  HomeObjectStoryStore, freshObjectStoryState, normalizeObjectStoryState,
  objectStoryChapterViews, objectStoryProgress,
} from '../src/game/home/objectStories';
import { OBJECT_STORY_QUESTS, QUEST_BY_ID } from '../src/game/quests';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('65개 가구에 애착을 만드는 물건의 속삭임 도감', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('카탈로그 모든 물건이 정확히 하나의 고유 이야기와 세 태그를 가진다', () => {
    expect(OBJECT_STORIES).toHaveLength(CATALOG.length);
    expect(new Set(OBJECT_STORIES.map((story) => story.itemId)).size).toBe(CATALOG.length);
    expect(new Set(OBJECT_STORIES.map((story) => story.whisper)).size).toBe(CATALOG.length);
    for (const item of CATALOG) {
      const story = OBJECT_STORY_BY_ITEM.get(item.id);
      expect(story?.whisper.length).toBeGreaterThan(25);
      expect(story?.note.length).toBeGreaterThan(20);
      expect(story?.tags).toHaveLength(3);
      expect(story?.source.length).toBeGreaterThan(5);
    }
  });

  it('아홉 테마 장이 65개 물건을 빠짐없이 한 번씩 묶고 각 장은 네 점부터 완성된다', () => {
    expect(OBJECT_STORY_CHAPTERS).toHaveLength(9);
    const ids = OBJECT_STORY_CHAPTERS.flatMap((chapter) => chapter.itemIds);
    expect(ids).toHaveLength(CATALOG.length);
    expect(new Set(ids).size).toBe(CATALOG.length);
    expect(OBJECT_STORY_CHAPTERS.every((chapter) => chapter.required === 4 && chapter.itemIds.length >= 4)).toBe(true);
  });

  it('보유·배치로 만난 물건은 소급 발견되고 같은 물건은 중복 집계하지 않는다', () => {
    const store = new HomeObjectStoryStore('discover');
    expect(store.discoverAvailable(['bed_basic', 'desk_wood', 'bed_basic', 'unknown'])).toBe(2);
    expect(store.discoverAvailable(['bed_basic', 'desk_wood'])).toBe(0);
    expect(store.progress()).toMatchObject({ observed: 2, total: 65 });
    expect(new HomeObjectStoryStore('discover').get().observedIds).toEqual(['bed_basic', 'desk_wood']);
  });

  it('실제로 만난 물건만 관찰 횟수와 최애 진열을 남긴다', () => {
    const store = new HomeObjectStoryStore('inspect');
    expect(store.inspect('bed_basic')).toBe('locked');
    store.discoverAvailable(CATALOG.slice(0, 12).map((item) => item.id));
    expect(store.inspect('bed_basic')).toBe('inspected');
    expect(store.inspect('bed_basic')).toBe('inspected');
    for (const item of CATALOG.slice(0, OBJECT_STORY_FAVORITE_MAX)) {
      expect(store.toggleFavorite(item.id)).toBe('added');
    }
    expect(store.toggleFavorite(CATALOG[OBJECT_STORY_FAVORITE_MAX]!.id)).toBe('full');
    expect(store.toggleFavorite('bed_basic')).toBe('removed');
    expect(store.progress()).toMatchObject({ favorites: OBJECT_STORY_FAVORITE_MAX - 1, inspections: 2 });
  });

  it('손상 저장은 알려진 발견·최애·관찰만 남기고 최애 아홉 칸을 넘지 않는다', () => {
    const ids = CATALOG.slice(0, 12).map((item) => item.id);
    const state = normalizeObjectStoryState({
      observedIds: [...ids, ids[0], 'fake'],
      favoriteIds: [...ids, 'fake'],
      inspectionCounts: { [ids[0]!]: 3, [ids[1]!]: -2, fake: 99 },
      totalInspections: 1,
    });
    expect(state.observedIds).toHaveLength(12);
    expect(state.favoriteIds).toEqual(ids.slice(0, OBJECT_STORY_FAVORITE_MAX));
    expect(state.inspectionCounts).toEqual({ [ids[0]!]: 3 });
    expect(state.totalInspections).toBe(3);
  });

  it('장 완성과 전체 진행은 일부 테마를 좋아하는 플레이도 인정한다', () => {
    const state = freshObjectStoryState();
    state.observedIds = [
      ...OBJECT_STORY_CHAPTERS[0]!.itemIds.slice(0, 4),
      ...OBJECT_STORY_CHAPTERS[1]!.itemIds.slice(0, 3),
    ];
    const chapters = objectStoryChapterViews(state);
    expect(chapters[0]).toMatchObject({ observed: 4, complete: true });
    expect(chapters[1]).toMatchObject({ observed: 3, complete: false });
    expect(objectStoryProgress(state)).toMatchObject({
      observed: 7, chapters: 1, totalChapters: 9, favoriteMax: 9,
    });
  });

  it('아홉 장기 목표가 발견·관찰·테마 장·최애 진열에 모두 연결된다', () => {
    expect(OBJECT_STORY_QUESTS).toHaveLength(9);
    expect(OBJECT_STORY_QUESTS.every((quest) => QUEST_BY_ID.get(quest.id) === quest)).toBe(true);
    expect(new Set(OBJECT_STORY_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'object_story_items', 'object_story_inspections', 'object_story_favorites', 'object_story_chapters',
    ]));
  });
});
