import { describe, it, expect } from 'vitest';
import {
  normalizeState, bumpQuest, markClaimed, doneCount, setQuestMetric, questViews, type QuestState,
} from '../src/game/questProgress';
import { ALL_QUESTS, DAILY_QUESTS } from '../src/game/quests';
import { lifeMasteryQuestMetrics } from '../src/game/progression/lifeMastery';

const TODAY = '2026-07-22';

describe('questProgress 지속·리셋', () => {
  it('저장 날짜가 오늘과 다르면 새 하루로 리셋', () => {
    const stale: QuestState = { day: '2026-07-21', counts: { q_emote: 3 }, claimed: ['quest_emote'] };
    const s = normalizeState(stale, TODAY);
    expect(s.day).toBe(TODAY);
    expect(s.counts.q_emote).toBe(0);
    expect(s.claimed).toEqual([]);
  });

  it('같은 날이면 진행·수령을 보존한다', () => {
    const cur: QuestState = { day: TODAY, counts: { q_emote: 2 }, claimed: ['quest_cafe'] };
    const s = normalizeState(cur, TODAY);
    expect(s.counts.q_emote).toBe(2);
    expect(s.claimed).toEqual(['quest_cafe']);
  });

  it('손상된 저장값도 안전하게 정규화', () => {
    expect(normalizeState(null, TODAY).day).toBe(TODAY);
    expect(normalizeState('rubbish', TODAY).counts).toEqual(
      Object.fromEntries(DAILY_QUESTS.map((q) => [q.registryKey, 0])));
    const bad = normalizeState({ day: TODAY, counts: { q_emote: -5, q_cafe: 1.9 }, claimed: [1, 'quest_cafe'] }, TODAY);
    expect(bad.counts.q_emote).toBe(0);   // 음수 → 0
    expect(bad.counts.q_cafe).toBe(1);    // 소수 → 내림
    expect(bad.claimed).toEqual(['quest_cafe']); // 문자열만
  });

  it('bump은 목표에서 멈춘다 (하트 표시용)', () => {
    let s = normalizeState(null, TODAY);
    const emote = DAILY_QUESTS.find((q) => q.registryKey === 'q_emote')!;
    for (let i = 0; i < emote.goal + 5; i++) s = bumpQuest(s, 'q_emote');
    expect(s.counts.q_emote).toBe(emote.goal);
  });

  it('doneCount는 목표 도달 퀘스트만 센다', () => {
    let s = normalizeState(null, TODAY);
    expect(doneCount(s)).toBe(0);
    const emote = DAILY_QUESTS.find((q) => q.registryKey === 'q_emote')!;
    for (let i = 0; i < emote.goal; i++) s = bumpQuest(s, 'q_emote');
    expect(doneCount(s)).toBe(1);
  });

  it('markClaimed는 중복을 만들지 않는다', () => {
    let s = normalizeState(null, TODAY);
    s = markClaimed(s, 'quest_cafe');
    s = markClaimed(s, 'quest_cafe');
    expect(s.claimed).toEqual(['quest_cafe']);
  });

  it('날짜가 바뀌어도 영구 모험 기록은 보존한다', () => {
    const stale: QuestState = {
      day: '2026-07-21', counts: { q_emote: 3 }, claimed: ['quest_emote'],
      version: 2, lifetimeCounts: { monster_kill: 9, resident_greet: 2 },
    };
    const s = normalizeState(stale, TODAY);
    expect(s.counts.q_emote).toBe(0);
    expect(s.claimed).toEqual([]);
    expect(s.lifetimeCounts).toMatchObject({ monster_kill: 9, resident_greet: 2 });
  });

  it('같은 이벤트가 일일과 영구 퀘스트를 함께 진행한다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'q_cafe');
    expect(s.counts.q_cafe).toBe(1);
    expect(s.lifetimeCounts?.q_cafe).toBe(1);
    const views = questViews(s);
    expect(views.find((q) => q.id === 'quest_cafe')?.done).toBe(true);
    expect(views.find((q) => q.id === 'intro_cafe')?.progress).toBe(1);
  });

  it('이모트 일일·장기 목표 이후에도 생활 숙련용 평생 기록은 계속 쌓인다', () => {
    let s = normalizeState(null, TODAY);
    for (let i = 0; i < 14; i++) s = bumpQuest(s, 'q_emote');
    expect(s.counts.q_emote).toBe(3);
    expect(s.lifetimeCounts?.q_emote).toBe(14);
    expect(questViews(s).find((q) => q.id === 'story_emote_circle')?.done).toBe(true);
  });

  it('레벨 같은 최대 지표는 낮은 값으로 되돌아가지 않는다', () => {
    let s = normalizeState(null, TODAY);
    s = setQuestMetric(s, 'player_level', 8);
    s = setQuestMetric(s, 'player_level', 3);
    expect(s.lifetimeCounts?.player_level).toBe(8);
  });

  it('최대 지표 원본은 마지막 퀘스트 목표보다 높아도 보존한다', () => {
    let s = normalizeState(null, TODAY);
    s = setQuestMetric(s, 'player_level', 37);
    expect(s.lifetimeCounts?.player_level).toBe(37);
    expect(questViews(s).find((q) => q.id === 'master_level_20')?.progress).toBe(20);
  });

  it('선행 기록이 끝나면 다음 첫걸음이 열린다', () => {
    let s = normalizeState(null, TODAY);
    let views = questViews(s);
    expect(views.find((q) => q.id === 'intro_map')?.unlocked).toBe(false);
    s = bumpQuest(s, 'open_quest');
    views = questViews(s);
    expect(views.find((q) => q.id === 'intro_journal')?.done).toBe(true);
    expect(views.find((q) => q.id === 'intro_map')?.unlocked).toBe(true);
  });

  it('희귀 스타일 3종과 10종 해금이 이야기·수집 목표로 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'customize_save');
    s = setQuestMetric(s, 'rare_styles', 3);
    let views = questViews(s);
    expect(views.find((q) => q.id === 'story_style_scout')).toMatchObject({ unlocked: true, done: true, progress: 3 });
    expect(views.find((q) => q.id === 'collect_style_catalog')?.unlocked).toBe(true);
    s = setQuestMetric(s, 'rare_styles', 10);
    views = questViews(s);
    expect(views.find((q) => q.id === 'collect_style_catalog')).toMatchObject({ done: true, progress: 10 });
  });

  it('생활 숙련 파생 레벨이 Lv.5 분야 휘장 퀘스트를 완료한다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'customize_save', 20);
    s = setQuestMetric(s, 'rare_styles', 3);
    for (const [key, value] of Object.entries(lifeMasteryQuestMetrics(s))) s = setQuestMetric(s, key, value);
    expect(questViews(s).find((q) => q.id === 'master_life_style_5')).toMatchObject({
      unlocked: true, done: true, progress: 5,
    });
  });

  it('생활 전문성 선택·수집·세 분야 전시·전 분야 최고 자격을 장기 퀘스트로 연결한다', () => {
    let s = normalizeState(null, TODAY);
    s = setQuestMetric(s, 'open_quest', 1);
    s = setQuestMetric(s, 'life_specialty_featured', 1);
    s = setQuestMetric(s, 'life_specialty_cards', 30);
    s = setQuestMetric(s, 'life_specialty_featured_domains', 3);
    s = setQuestMetric(s, 'life_specialty_mastered_domains', 10);
    s = setQuestMetric(s, 'life_specialty_synergies', 18);
    const views = questViews(s);
    for (const id of [
      'story_life_specialty_first', 'collect_life_specialty_10', 'collect_life_specialty_30',
      'master_life_specialty_featured_3', 'master_life_specialty_domains_10',
      'story_life_synergy_first', 'collect_life_synergies_6', 'master_life_synergies_18',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('전문성·포토카드 공개 슬롯을 마을 명함 자기소개 퀘스트로 연결한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['life_specialty_featured', 1], ['village_profile_specialties', 3],
      ['photo_taken', 3], ['photo_album', 3], ['photo_cards_decorated', 1],
      ['village_profile_photo_cards', 3], ['village_profile_showcase_slots', 6],
      ['village_profile_showcase_complete', 1],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_profile_specialty_first', 'story_profile_photo_first', 'collect_profile_showcase_6',
      'master_profile_showcase_complete',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('붕어빵·인형뽑기·인형 컬렉션도 별도 이야기와 수집 기록이 된다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'open_map');
    s = bumpQuest(s, 'bungeo_eat', 5);
    s = bumpQuest(s, 'claw_win');
    s = setQuestMetric(s, 'dolls_owned', 6);
    const views = questViews(s);
    expect(views.find((q) => q.id === 'story_bungeo_regular')?.done).toBe(true);
    expect(views.find((q) => q.id === 'story_claw_first')?.done).toBe(true);
    expect(views.find((q) => q.id === 'collect_dolls_6')).toMatchObject({ unlocked: true, done: true });
  });

  it('네컷 저장·펫 동반·프레임·배경·12칸 앨범이 별도 추억 목표가 된다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'open_map');
    s = bumpQuest(s, 'photo_taken', 12);
    s = bumpQuest(s, 'photo_with_pet');
    s = setQuestMetric(s, 'photo_album', 12);
    s = setQuestMetric(s, 'photo_frames', 4);
    s = setQuestMetric(s, 'photo_backdrops', 6);
    const views = questViews(s);
    for (const id of [
      'story_photo_pet', 'story_photo_album', 'collect_photo_frames_4',
      'collect_photo_backdrops_6', 'master_photo_album_12',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('정원 심기·수확·12종·36표본·숙련이 독립 목표가 된다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'visit_home');
    s = setQuestMetric(s, 'garden_planted', 30);
    s = setQuestMetric(s, 'garden_tend', 90);
    s = setQuestMetric(s, 'garden_harvest', 30);
    s = setQuestMetric(s, 'garden_species', 12);
    s = setQuestMetric(s, 'garden_specimens', 36);
    for (const [key, value] of Object.entries(lifeMasteryQuestMetrics(s))) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_garden_seed', 'story_garden_harvest', 'collect_garden_species_6',
      'collect_garden_species_12', 'collect_garden_specimens_18', 'collect_garden_specimens_36',
      'master_garden_harvest_30', 'master_life_gardener_5',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 요리·단골·12메뉴·36플레이팅·조리 숙련이 독립 목표가 된다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'visit_home');
    s = setQuestMetric(s, 'garden_planted', 30);
    s = setQuestMetric(s, 'garden_harvest', 30);
    s = setQuestMetric(s, 'cooking_total', 30);
    s = setQuestMetric(s, 'cooking_recipes', 12);
    s = setQuestMetric(s, 'cooking_plates', 36);
    s = setQuestMetric(s, 'cooking_favorites', 6);
    for (const [key, value] of Object.entries(lifeMasteryQuestMetrics(s))) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_cooking_first', 'story_cooking_favorite', 'collect_cooking_recipes_6',
      'collect_cooking_recipes_12', 'collect_cooking_plates_18', 'collect_cooking_plates_36',
      'master_cooking_30', 'master_life_culinary_5',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 낚시·18종·54도장·금빛 기록·낚시 숙련이 독립 목표가 된다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'open_map');
    s = setQuestMetric(s, 'fishing_total', 50);
    s = setQuestMetric(s, 'fishing_species', 18);
    s = setQuestMetric(s, 'fishing_stamps', 54);
    s = setQuestMetric(s, 'fishing_gold_records', 18);
    for (const [key, value] of Object.entries(lifeMasteryQuestMetrics(s))) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_fishing_first', 'story_fishing_gold', 'collect_fishing_species_6',
      'collect_fishing_species_12', 'collect_fishing_species_18', 'collect_fishing_stamps_27',
      'collect_fishing_stamps_54', 'master_fishing_50', 'master_life_angler_5',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('테라리움 저장·실제 어항·재료 해금·누적 구성이 집과 낚시를 잇는다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'open_map');
    s = setQuestMetric(s, 'fishing_total', 60);
    s = setQuestMetric(s, 'fishing_species', 18);
    s = setQuestMetric(s, 'fishing_stamps', 54);
    s = setQuestMetric(s, 'fishing_gold_records', 18);
    s = setQuestMetric(s, 'aquarium_saves', 20);
    s = setQuestMetric(s, 'aquarium_displayed', 3);
    s = setQuestMetric(s, 'aquarium_frames', 6);
    s = setQuestMetric(s, 'aquarium_substrates', 6);
    s = setQuestMetric(s, 'aquarium_ornaments', 6);
    s = setQuestMetric(s, 'home_aquarium_active', 1);
    const views = questViews(s);
    for (const id of [
      'story_aquarium_first', 'story_aquarium_room', 'collect_aquarium_display_3',
      'collect_aquarium_frames_3', 'collect_aquarium_frames_6', 'collect_aquarium_substrates_6',
      'collect_aquarium_ornaments_6', 'master_aquarium_save_20',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 가구 리폼부터 48조합·전 마감·전 색감·서른 저장까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'q_place');
    s = setQuestMetric(s, 'furniture_reform_saves', 30);
    s = setQuestMetric(s, 'furniture_reformed_items', 3);
    s = setQuestMetric(s, 'furniture_reform_combos', 48);
    s = setQuestMetric(s, 'furniture_reform_finishes', 6);
    s = setQuestMetric(s, 'furniture_reform_colors', 8);
    const views = questViews(s);
    for (const id of [
      'story_reform_first', 'story_reform_room', 'collect_reform_combos_12',
      'collect_reform_combos_24', 'collect_reform_combos_48', 'collect_reform_finishes_6',
      'collect_reform_colors_8', 'master_reform_saves_30',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 홈 무드보드부터 12테마 완성 도감까지 영구 도장이 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'q_place');
    s = setQuestMetric(s, 'home_moodboard_stamps', 12);
    const views = questViews(s);
    for (const id of ['story_moodboard_first', 'collect_moodboards_4', 'collect_moodboards_8', 'collect_moodboards_12']) {
      expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
    }
  });

  it('룩북 첫 기록·12의뢰·36별·서른 제출·고유 코디가 패션 장기 목표로 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = bumpQuest(s, 'customize_save');
    s = setQuestMetric(s, 'lookbook_submissions', 30);
    s = setQuestMetric(s, 'lookbook_entries', 12);
    s = setQuestMetric(s, 'lookbook_stars', 36);
    s = setQuestMetric(s, 'lookbook_perfect', 12);
    s = setQuestMetric(s, 'lookbook_unique', 20);
    const views = questViews(s);
    for (const id of [
      'story_lookbook_first', 'story_lookbook_perfect', 'collect_lookbook_entries_6',
      'collect_lookbook_entries_12', 'collect_lookbook_stars_18', 'collect_lookbook_stars_36',
      'master_lookbook_submissions_30', 'master_lookbook_unique_20',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('산책 첫 기록부터 8코스·24도장·세 동행·쉰 산책까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'pet_adopt');
    s = setQuestMetric(s, 'pet_outings_total', 50);
    s = setQuestMetric(s, 'pet_outing_routes', 8);
    s = setQuestMetric(s, 'pet_outing_stamps', 24);
    s = setQuestMetric(s, 'pet_outing_partners', 3);
    const views = questViews(s);
    for (const id of [
      'story_pet_outing_first', 'story_pet_outing_souvenir', 'collect_pet_outing_routes_4',
      'collect_pet_outing_routes_8', 'collect_pet_outing_stamps_12', 'collect_pet_outing_stamps_24',
      'collect_pet_outing_partners_3', 'master_pet_outings_50',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 마음 번역부터 24개 몸짓·여섯 성격·세 돌봄 방식까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'pet_adopt');
    s = setQuestMetric(s, 'pet_signals', 24);
    s = setQuestMetric(s, 'pet_signal_personalities', 6);
    s = setQuestMetric(s, 'pet_signal_responses', 3);
    s = setQuestMetric(s, 'pet_signal_chapters', 6);
    const views = questViews(s);
    for (const id of [
      'story_pet_signal_first', 'collect_pet_signals_8', 'collect_pet_signals_24',
      'collect_pet_signal_personalities_6', 'master_pet_signal_responses_3', 'master_pet_signal_chapters_6',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 트릭 무대부터 다섯 레퍼토리·15장 추억·세 동행·대표 공연까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'pet_adopt');
    s = setQuestMetric(s, 'pet_tricks', 5);
    s = setQuestMetric(s, 'pet_performance_stamps', 15);
    s = setQuestMetric(s, 'pet_performance_tricks', 5);
    s = setQuestMetric(s, 'pet_performance_complete', 5);
    s = setQuestMetric(s, 'pet_performance_partners', 3);
    s = setQuestMetric(s, 'pet_performance_featured', 1);
    const views = questViews(s);
    for (const id of [
      'story_pet_performance_first', 'story_pet_performance_featured',
      'collect_pet_performance_tricks_5', 'collect_pet_performance_stamps_15',
      'collect_pet_performance_partners_3', 'master_pet_performance_complete_5',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('메인 연대기 첫 루트부터 8장·세 기억 방식·대표 원고까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = setQuestMetric(s, 'journey_chapters', 8);
    s = setQuestMetric(s, 'chronicle_routes', 8);
    s = setQuestMetric(s, 'chronicle_pages', 8);
    s = setQuestMetric(s, 'chronicle_motifs', 3);
    s = setQuestMetric(s, 'chronicle_featured', 1);
    const views = questViews(s);
    for (const id of [
      'story_chronicle_route_first', 'story_chronicle_page_first', 'collect_chronicle_pages_4',
      'collect_chronicle_pages_8', 'collect_chronicle_motifs_3', 'master_chronicle_featured',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 생활 초대부터 30도장·열 분야·백 번의 자율 선택으로 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = setQuestMetric(s, 'daily_invitations_claimed', 100);
    s = setQuestMetric(s, 'daily_invitation_stamps', 30);
    s = setQuestMetric(s, 'daily_invitation_domains', 10);
    const views = questViews(s);
    for (const id of [
      'story_daily_invitation_first', 'collect_daily_invitation_stamps_10',
      'collect_daily_invitation_stamps_30', 'collect_daily_invitation_domains_10',
      'master_daily_invitations_100',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 이웃 응원부터 여덟 취향·열 이웃·쉰 장의 안전한 우편으로 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = setQuestMetric(s, 'chat_sent', 1);
    s = setQuestMetric(s, 'neighbor_cheers_sent', 25);
    s = setQuestMetric(s, 'neighbor_cheers_received', 25);
    s = setQuestMetric(s, 'neighbor_cheer_total', 50);
    s = setQuestMetric(s, 'neighbor_cheer_kinds', 8);
    s = setQuestMetric(s, 'neighbor_cheer_neighbors', 10);
    const views = questViews(s);
    for (const id of [
      'story_neighbor_cheer_send', 'story_neighbor_cheer_receive', 'collect_neighbor_cheer_kinds_8',
      'collect_neighbor_cheer_neighbors_10', 'master_neighbor_cheer_50',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('골목 의뢰 첫 해결부터 8분야·24도장·백 번 해결·평판 10까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'open_quest');
    s = setQuestMetric(s, 'village_requests_total', 100);
    s = setQuestMetric(s, 'village_request_stamps', 24);
    s = setQuestMetric(s, 'village_request_categories', 8);
    s = setQuestMetric(s, 'village_request_rank', 10);
    const views = questViews(s);
    for (const id of [
      'story_request_first', 'story_request_categories_4', 'collect_request_stamps_12',
      'collect_request_stamps_24', 'collect_request_categories_8', 'master_requests_30',
      'master_requests_100', 'master_request_rank_10',
    ]) expect(views.find((quest) => quest.id === id)).toMatchObject({ unlocked: true, done: true });
  });

  it('첫 집 반응부터 18장·여섯 성격·세 동행·쉰 장면까지 이어진다', () => {
    let s = normalizeState(null, TODAY);
    s = bumpQuest(s, 'pet_adopt');
    s = setQuestMetric(s, 'pet_home_memories', 18);
    s = setQuestMetric(s, 'pet_home_personalities', 6);
    s = setQuestMetric(s, 'pet_home_partners', 3);
    s = setQuestMetric(s, 'pet_home_scenes', 50);
    const views = questViews(s);
    for (const id of [
      'story_pet_home_first', 'story_pet_home_personality', 'collect_pet_home_memories_9',
      'collect_pet_home_memories_18', 'collect_pet_home_personalities_3',
      'collect_pet_home_personalities_6', 'collect_pet_home_partners_3', 'master_pet_home_scenes_50',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('쇼룸 방문부터 첫 구매·65종 도감·단골 숙련까지 과거 기록을 소급 인정한다', () => {
    let s = normalizeState(null, TODAY);
    for (const key of ['open_quest', 'open_map', 'resident_greet', 'q_cafe', 'visit_home', 'visit_shop', 'visit_workshop']) s = bumpQuest(s, key);
    s = bumpQuest(s, 'shop_purchase', 50);
    s = setQuestMetric(s, 'items_discovered', 65);
    s = setQuestMetric(s, 'furniture_craft_total', 30);
    s = setQuestMetric(s, 'furniture_craft_recipes', 12);
    s = setQuestMetric(s, 'weekly_furniture_unique', 16);
    const views = questViews(s);
    for (const id of [
      'intro_shop', 'intro_workshop', 'story_shop_first', 'collect_sallim_10', 'collect_sallim_30',
      'collect_sallim_65', 'master_shop_50', 'story_diy_first', 'collect_diy_6',
      'collect_diy_12', 'collect_weekly_4', 'collect_weekly_16', 'master_diy_30',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('플레이 큐의 세 정류장·영구 페이지·분야 기록을 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['session_plan_slots', 3], ['session_plan_pages', 10],
      ['session_plan_quests', 30], ['session_plan_categories', 4], ['session_plan_featured', 1],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_session_plan_full', 'story_session_plan_page', 'story_session_plan_featured',
      'collect_session_plan_quests_15', 'collect_session_plan_categories_4', 'master_session_plan_pages_10',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('최애 굿즈의 대상·형태·분위기·영구 디자인을 팬메이드 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['fan_merch_created', 24], ['fan_merch_featured', 3],
      ['fan_merch_subjects', 5], ['fan_merch_formats', 6], ['fan_merch_motifs', 6],
      ['fan_merch_discoveries', 24],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_fan_merch_first', 'story_fan_merch_featured', 'collect_fan_merch_formats_6',
      'collect_fan_merch_motifs_6', 'collect_fan_merch_subjects_5', 'master_fan_merch_designs_24',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('대표 굿즈의 실제 방 전시·진열·조명 기록을 팬룸 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['fan_merch_created', 1], ['fan_merch_featured', 3],
      ['fan_room_goods', 3], ['fan_room_styles', 4], ['fan_room_lights', 4],
      ['fan_room_restyles', 16], ['fan_room_visible', 1],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_fan_room_first', 'story_fan_room_restyle', 'collect_fan_room_goods_3',
      'collect_fan_room_styles_4', 'collect_fan_room_lights_4', 'master_fan_room_restyles_16',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('동행 코디의 저장·적용·대표·장면 발견을 아틀리에 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['q_cafe', 1],
      ['visit_home', 1], ['visit_shop', 1], ['q_place', 1], ['pet_adopt', 1],
      ['pet_profiles_customized', 1], ['pet_accessory_equip', 1],
      ['pet_style_captures', 24], ['pet_style_applies', 1], ['pet_style_featured', 3],
      ['pet_style_backdrops', 6], ['pet_style_poses', 5], ['pet_style_pets', 3],
      ['pet_style_discoveries', 24],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_pet_style_first', 'story_pet_style_apply', 'story_pet_style_featured',
      'collect_pet_style_backdrops_6', 'collect_pet_style_poses_5',
      'collect_pet_style_partners_3', 'master_pet_style_designs_24',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('대표 동행 카드 공개와 이웃 카드 열람을 마을 명함 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['q_cafe', 1],
      ['visit_home', 1], ['visit_shop', 1], ['q_place', 1], ['pet_adopt', 1],
      ['pet_profiles_customized', 1], ['pet_accessory_equip', 1],
      ['pet_style_captures', 3], ['pet_style_featured', 3],
      ['village_profile_pet_styles', 3], ['pet_style_profile_views', 1],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_pet_style_profile_first', 'collect_pet_style_profile_3', 'story_pet_style_neighbor_view',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('동행 인사 엽서의 송수신·장면·친구·종 조합을 소셜 성장 목표에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['q_cafe', 1],
      ['visit_home', 1], ['visit_shop', 1], ['q_place', 1], ['pet_adopt', 1],
      ['pet_profiles_customized', 1], ['pet_accessory_equip', 1],
      ['pet_style_captures', 3], ['pet_style_featured', 3], ['village_profile_pet_styles', 3],
      ['pet_meet_sent', 12], ['pet_meet_received', 12], ['pet_meet_total', 24],
      ['pet_meet_scenes', 6], ['pet_meet_neighbors', 5], ['pet_meet_species', 8], ['pet_meet_pairs', 8],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_pet_meet_first', 'story_pet_meet_received', 'collect_pet_meet_scenes_6',
      'collect_pet_meet_neighbors_5', 'collect_pet_meet_species_8',
      'collect_pet_meet_pairs_8', 'master_pet_meet_total_24',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('동행 엽서 전시·액자·조명·배치를 실제 집 꾸미기 성장에 소급 반영한다', () => {
    let s = normalizeState(null, TODAY);
    for (const [key, value] of [
      ['open_quest', 1], ['open_map', 1], ['resident_greet', 1], ['q_cafe', 1],
      ['visit_home', 1], ['visit_shop', 1], ['q_place', 1], ['pet_adopt', 1],
      ['pet_profiles_customized', 1], ['pet_accessory_equip', 1],
      ['pet_style_captures', 3], ['pet_style_featured', 3], ['village_profile_pet_styles', 3],
      ['pet_meet_sent', 1],
      ['pet_memory_wall_cards', 3], ['pet_memory_wall_visible', 1],
      ['pet_memory_wall_frames', 4], ['pet_memory_wall_lights', 4],
      ['pet_memory_wall_layouts', 4], ['pet_memory_wall_restyles', 16],
    ] as const) s = setQuestMetric(s, key, value);
    const views = questViews(s);
    for (const id of [
      'story_pet_memory_wall_first', 'story_pet_memory_wall_visible',
      'collect_pet_memory_wall_cards_3', 'collect_pet_memory_wall_frames_4',
      'collect_pet_memory_wall_lights_4', 'collect_pet_memory_wall_layouts_4',
      'master_pet_memory_wall_restyles_16',
    ]) expect(views.find((quest) => quest.id === id), id).toMatchObject({ unlocked: true, done: true });
  });

  it('퀘스트 ID는 전체 카탈로그에서 중복되지 않는다', () => {
    expect(new Set(ALL_QUESTS.map((q) => q.id)).size).toBe(ALL_QUESTS.length);
    expect(ALL_QUESTS).toHaveLength(536);
  });
});
