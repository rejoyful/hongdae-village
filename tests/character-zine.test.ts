import { describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import type { QuestState } from '../src/game/questProgress';
import { CHARACTER_ZINE_QUESTS } from '../src/game/quests';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';
import {
  CHARACTER_EPISODES, CHARACTER_EPISODE_FEATURED_MAX,
  CHARACTER_ZINE_FEATURED_MAX, CHARACTER_ZINE_SLOT_COUNT,
  archiveCharacterEpisode, characterEpisodeViews, characterZineProgress,
  characterZineRelationStory, featuredCharacterZineCards, normalizeCharacterZineState,
  removeCharacterZineCard, removeCharacterZineRelation, replayCharacterEpisode, saveCharacterZineCard,
  toggleFeaturedCharacterEpisode,
  toggleFeaturedCharacterZineCard, updateCharacterZineCard, upsertCharacterZineRelation,
} from '../src/game/progression/characterZine';

const quests = (lifetimeCounts: Record<string, number> = {}): QuestState => ({
  version: 2, day: '2026-07-23', counts: {}, claimed: [], lifetimeCounts,
});

describe('픽셀 캐릭터 설정집', () => {
  it('손상된 저장값을 여섯 칸 빈 설정집으로 복구한다', () => {
    const state = normalizeCharacterZineState({ cards: ['bad', { appearance: null }], featured: [0, 99] });
    expect(state.version).toBe(3);
    expect(state.cards).toHaveLength(CHARACTER_ZINE_SLOT_COUNT);
    expect(state.cards.every((card) => card === null)).toBe(true);
    expect(state.featured).toEqual([]);
    expect(state.relations).toEqual([]);
    expect(state.episodes).toEqual([]);
    expect(state.featuredEpisodes).toEqual([]);
  });

  it('현재 외형을 독립된 스냅샷으로 보관한다', () => {
    const appearance = { ...DEFAULT_APPEARANCE, hair: 3, topStyle: 7 };
    const saved = saveCharacterZineCard(normalizeCharacterZineState(null), 0, appearance, {
      name: '<심야>\n편집자', roleId: 'midnight_editor', motifId: 'star', direction: 3,
    }, 123);
    appearance.hair = 1;
    expect(saved.cards[0]).toMatchObject({
      name: '심야 편집자', roleId: 'midnight_editor', motifId: 'star', direction: 3, savedAt: 123,
    });
    expect(saved.cards[0]?.appearance.hair).toBe(3);
  });

  it('역할과 모티프를 바꿔도 외형 스냅샷은 유지한다', () => {
    let state = saveCharacterZineCard(normalizeCharacterZineState(null), 2, DEFAULT_APPEARANCE);
    const appearance = state.cards[2]?.appearance;
    state = updateCharacterZineCard(state, 2, { name: '비의 지도', roleId: 'rain_cartographer', motifId: 'rain' });
    expect(state.cards[2]).toMatchObject({ name: '비의 지도', roleId: 'rain_cartographer', motifId: 'rain' });
    expect(state.cards[2]?.appearance).toEqual(appearance);
  });

  it('대표 카드는 세 장까지만 공개하고 삭제 시 대표에서도 내린다', () => {
    let state = normalizeCharacterZineState(null);
    for (let index = 0; index < 4; index += 1) {
      state = saveCharacterZineCard(state, index, DEFAULT_APPEARANCE);
    }
    for (let index = 0; index < CHARACTER_ZINE_FEATURED_MAX; index += 1) {
      const next = toggleFeaturedCharacterZineCard(state, index);
      expect(next.result).toBe('added'); state = next.state;
    }
    expect(toggleFeaturedCharacterZineCard(state, 3).result).toBe('full');
    expect(featuredCharacterZineCards(state)).toHaveLength(3);
    state = removeCharacterZineCard(state, 1);
    expect(state.featured).toEqual([0, 2]);
  });

  it('서로 다른 역할과 모티프 수를 장기 수집 기록으로 집계한다', () => {
    let state = normalizeCharacterZineState(null);
    state = saveCharacterZineCard(state, 0, DEFAULT_APPEARANCE, { roleId: 'midnight_editor', motifId: 'star' });
    state = saveCharacterZineCard(state, 1, DEFAULT_APPEARANCE, { roleId: 'record_collector', motifId: 'vinyl' });
    state = saveCharacterZineCard(state, 2, DEFAULT_APPEARANCE, { roleId: 'record_collector', motifId: 'film' });
    state = toggleFeaturedCharacterZineCard(state, 0).state;
    expect(characterZineProgress(state)).toEqual({
      saved: 3, featured: 1, roles: 2, motifs: 3, bonds: 0, bondKinds: 0, memoryScenes: 0,
      episodes: 0, episodeKinds: 0, episodeCharacters: 0, featuredEpisodes: 0, episodeReplays: 0,
    });
  });

  it('범위를 벗어난 슬롯은 원본 상태를 그대로 반환한다', () => {
    const state = normalizeCharacterZineState(null);
    expect(saveCharacterZineCard(state, 99, DEFAULT_APPEARANCE)).toBe(state);
    expect(removeCharacterZineCard(state, -1)).toBe(state);
    expect(updateCharacterZineCard(state, 1, { name: '없음' })).toBe(state);
  });

  it('기존 1버전 설정집을 관계와 에피소드가 빈 3버전으로 안전하게 마이그레이션한다', () => {
    const legacy = normalizeCharacterZineState({
      version: 1,
      cards: [{ name: '첫 인물', appearance: DEFAULT_APPEARANCE }],
      featured: [0],
    });
    expect(legacy.version).toBe(3);
    expect(legacy.cards[0]?.name).toBe('첫 인물');
    expect(legacy.featured).toEqual([0]);
    expect(legacy.relations).toEqual([]);
    expect(legacy.episodes).toEqual([]);
  });

  it('두 인물의 관계와 기억 장면을 한 쌍당 하나씩 저장하고 갱신한다', () => {
    let state = normalizeCharacterZineState(null);
    state = saveCharacterZineCard(state, 0, DEFAULT_APPEARANCE, { name: '별비' });
    state = saveCharacterZineCard(state, 2, DEFAULT_APPEARANCE, { name: '노을' });
    state = upsertCharacterZineRelation(state, 2, 0, 'creative_pair', 'dawn_rehearsal', 10);
    expect(state.relations).toEqual([{ a: 0, b: 2, bondId: 'creative_pair', memoryId: 'dawn_rehearsal', savedAt: 10 }]);
    expect(characterZineRelationStory(state, state.relations[0]!)).toContain('별비와 노을');
    state = upsertCharacterZineRelation(state, 0, 2, 'mutual_fans', 'rain_shelter', 20);
    expect(state.relations).toHaveLength(1);
    expect(state.relations[0]).toMatchObject({ bondId: 'mutual_fans', memoryId: 'rain_shelter', savedAt: 20 });
    expect(characterZineProgress(state)).toMatchObject({ bonds: 1, bondKinds: 1, memoryScenes: 1 });
  });

  it('자동 관계 문장은 한글 받침과 숫자 이름의 조사를 자연스럽게 고른다', () => {
    let state = normalizeCharacterZineState(null);
    state = saveCharacterZineCard(state, 0, DEFAULT_APPEARANCE, { name: '별빛' });
    state = saveCharacterZineCard(state, 1, DEFAULT_APPEARANCE, { name: '캐릭터 2' });
    state = upsertCharacterZineRelation(state, 0, 1, 'quiet_allies', 'forest_signal');
    expect(characterZineRelationStory(state, state.relations[0]!)).toContain('별빛과 캐릭터 2는');
  });

  it('인물 파일을 지우면 연결 관계도 함께 정리하고 관계만 따로 해제할 수 있다', () => {
    let state = normalizeCharacterZineState(null);
    state = saveCharacterZineCard(state, 0, DEFAULT_APPEARANCE);
    state = saveCharacterZineCard(state, 1, DEFAULT_APPEARANCE);
    state = upsertCharacterZineRelation(state, 0, 1, 'old_friends', 'last_train');
    expect(removeCharacterZineRelation(state, 0, 1).relations).toEqual([]);
    state = removeCharacterZineCard(state, 0);
    expect(state.relations).toEqual([]);
  });

  it('손상되거나 중복된 관계 저장값은 유효한 첫 쌍 하나만 복구한다', () => {
    const state = normalizeCharacterZineState({
      cards: [
        { name: '가', appearance: DEFAULT_APPEARANCE },
        { name: '나', appearance: DEFAULT_APPEARANCE },
      ],
      relations: [
        { a: 1, b: 0, bondId: 'old_friends', memoryId: 'last_train', savedAt: 1 },
        { a: 0, b: 1, bondId: 'forged', memoryId: 'forged', savedAt: 2 },
        { a: 0, b: 5, bondId: 'old_friends', memoryId: 'last_train' },
      ],
    });
    expect(state.relations).toEqual([{ a: 0, b: 1, bondId: 'old_friends', memoryId: 'last_train', savedAt: 1 }]);
  });

  it('여덟 에피소드가 서로 다른 이야기와 두 갈래 실제 생활 조건을 제공한다', () => {
    expect(CHARACTER_EPISODES).toHaveLength(8);
    expect(new Set(CHARACTER_EPISODES.map((episode) => episode.title)).size).toBe(8);
    expect(new Set(CHARACTER_EPISODES.map((episode) => episode.ending)).size).toBe(8);
    expect(CHARACTER_EPISODES.every((episode) => episode.requirements.length === 2)).toBe(true);
  });

  it('설정집의 19개 영구 퀘스트 중 8개가 에피소드 보존·재생·캐스트를 단계별로 추적한다', () => {
    expect(CHARACTER_ZINE_QUESTS).toHaveLength(19);
    const episodeQuests = CHARACTER_ZINE_QUESTS.filter((quest) => quest.registryKey.startsWith('character_episode_'));
    expect(episodeQuests).toHaveLength(8);
    expect(new Set(episodeQuests.map((quest) => quest.registryKey))).toEqual(new Set([
      'character_episode_archived', 'character_episode_replays', 'character_episode_kinds',
      'character_episode_characters', 'character_episode_featured',
    ]));
    expect(villageRequestDestinationForMetric('character_episode_archived')).toBe('atelier');
    expect(villageRequestDestinationForMetric('object_story_items')).toBe('home');
    expect(villageRequestDestinationForMetric('resident_rendezvous_scenes')).toBe('residents');
  });

  it('캐릭터가 있고 두 생활 기록이 준비된 에피소드만 영구 보존한다', () => {
    let state = saveCharacterZineCard(normalizeCharacterZineState(null), 0, DEFAULT_APPEARANCE, { name: '비의 아이' });
    const ready = quests({ q_busking: 3, photo_taken: 3 });
    expect(characterEpisodeViews(state, quests(), 0)[0]).toMatchObject({ ready: false, archived: false });
    expect(archiveCharacterEpisode(state, quests(), 0, 'rainy_encore').result).toBe('not-ready');
    const result = archiveCharacterEpisode(state, ready, 0, 'rainy_encore', 123);
    expect(result.result).toBe('archived');
    state = result.state;
    expect(characterEpisodeViews(state, ready, 0)[0]).toMatchObject({
      ready: true, archived: true, replayCount: 0,
    });
    expect(archiveCharacterEpisode(state, ready, 0, 'rainy_encore').result).toBe('already');
  });

  it('대표 에피소드는 세 장이며 재생과 캐릭터별·종류별 집계를 잃지 않는다', () => {
    let state = normalizeCharacterZineState(null);
    const all = Object.fromEntries(CHARACTER_EPISODES.flatMap((episode) => (
      episode.requirements.map((requirement) => [requirement.key, requirement.goal])
    )));
    for (let slot = 0; slot < 2; slot += 1) {
      state = saveCharacterZineCard(state, slot, DEFAULT_APPEARANCE);
      for (const episode of CHARACTER_EPISODES.slice(0, 2)) {
        state = archiveCharacterEpisode(state, quests(all), slot, episode.id).state;
      }
    }
    for (const [slot, episodeId] of [[0, 'rainy_encore'], [0, 'rooftop_supper'], [1, 'rainy_encore']] as const) {
      const next = toggleFeaturedCharacterEpisode(state, slot, episodeId);
      expect(next.result).toBe('added'); state = next.state;
    }
    expect(toggleFeaturedCharacterEpisode(state, 1, 'rooftop_supper').result).toBe('full');
    state = replayCharacterEpisode(state, 0, 'rainy_encore').state;
    expect(characterZineProgress(state)).toMatchObject({
      episodes: 4, episodeKinds: 2, episodeCharacters: 2,
      featuredEpisodes: CHARACTER_EPISODE_FEATURED_MAX, episodeReplays: 1,
    });
    state = removeCharacterZineCard(state, 0);
    expect(state.episodes.every((episode) => episode.slot !== 0)).toBe(true);
    expect(state.featuredEpisodes).toEqual(['1:rainy_encore']);
  });

  it('손상된 에피소드·대표 키는 존재하는 캐릭터와 보존 장면만 복구한다', () => {
    const state = normalizeCharacterZineState({
      cards: [{ name: '가', appearance: DEFAULT_APPEARANCE }],
      episodes: [
        { slot: 0, episodeId: 'rainy_encore', replayCount: 2.8, archivedAt: 9 },
        { slot: 0, episodeId: 'rainy_encore', replayCount: 8 },
        { slot: 5, episodeId: 'forest_signal' },
        { slot: 0, episodeId: 'fake' },
      ],
      featuredEpisodes: ['0:rainy_encore', '0:fake'],
    });
    expect(state.episodes).toEqual([{ slot: 0, episodeId: 'rainy_encore', replayCount: 2, archivedAt: 9 }]);
    expect(state.featuredEpisodes).toEqual(['0:rainy_encore']);
  });
});
