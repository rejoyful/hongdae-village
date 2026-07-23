import { describe, expect, it } from 'vitest';
import { normalizeState } from '../src/game/questProgress';
import {
  LIFE_MASTERIES, LIFE_MASTERY_THRESHOLDS, lifeMasteryQuestMetrics, lifeMasterySummary,
  lifeMasteryViews, masteryLevelForXp, masteryRank, masteryXp,
} from '../src/game/progression/lifeMastery';

const stateWith = (counts: Record<string, number>) => ({
  ...normalizeState(null, '2026-07-22'),
  lifetimeCounts: counts,
});

describe('생활 숙련', () => {
  it('열 분야가 고유한 ID·마크·Lv.5 보상을 가진다', () => {
    expect(LIFE_MASTERIES).toHaveLength(10);
    expect(new Set(LIFE_MASTERIES.map((def) => def.id)).size).toBe(10);
    expect(new Set(LIFE_MASTERIES.map((def) => def.mark)).size).toBe(10);
    expect(LIFE_MASTERIES.every((def) => def.reward && def.objectives.length >= 4)).toBe(true);
  });

  it('레벨 경계가 오름차순이며 최대 Lv.10에서 멈춘다', () => {
    expect([...LIFE_MASTERY_THRESHOLDS].sort((a, b) => a - b)).toEqual([...LIFE_MASTERY_THRESHOLDS]);
    expect(masteryLevelForXp(0)).toBe(1);
    expect(masteryLevelForXp(59)).toBe(1);
    expect(masteryLevelForXp(60)).toBe(2);
    expect(masteryLevelForXp(449)).toBe(4);
    expect(masteryLevelForXp(450)).toBe(5);
    expect(masteryLevelForXp(99_999)).toBe(10);
    expect(masteryRank(10)).toBe('전설');
  });

  it('패션 행동과 희귀 해금을 서로 다른 가중치로 합산한다', () => {
    const style = LIFE_MASTERIES.find((def) => def.id === 'style')!;
    const state = stateWith({ customize_save: 2, closet_save: 1, rare_styles: 3 });
    expect(masteryXp(style, state)).toBe(2 * 25 + 30 + 3 * 90);
    expect(lifeMasteryViews(state).find((view) => view.id === 'style')).toMatchObject({
      level: 4,
      objectivesDone: 2,
      nextAction: { key: 'closet_save', goal: 3, current: 1 },
    });
  });

  it('옷장 저장·대표 전시·스타일 정체성 수집을 패션 감각에 합산한다', () => {
    const style = LIFE_MASTERIES.find((def) => def.id === 'style')!;
    const state = stateWith({ closet_saved_slots: 3, closet_featured_slots: 2, closet_style_identities: 4 });
    expect(masteryXp(style, state)).toBe(3 * 35 + 2 * 70 + 4 * 95);
    expect(style.objectives.filter((objective) => objective.key === 'closet_style_identities')).toHaveLength(1);
  });

  it('룩북의 제출·페이지·별·완벽 기록·고유 코디를 패션 감각에 합산한다', () => {
    const style = LIFE_MASTERIES.find((def) => def.id === 'style')!;
    const state = stateWith({ lookbook_submissions: 8, lookbook_entries: 4, lookbook_stars: 9, lookbook_perfect: 2, lookbook_unique: 6 });
    expect(masteryXp(style, state)).toBe(8 * 14 + 4 * 55 + 9 * 16 + 2 * 80 + 6 * 22);
    expect(lifeMasteryViews(state).find((view) => view.id === 'style')).toMatchObject({ level: 6 });
  });

  it('산책 횟수·코스·도장·완주·동행 조합을 동행 돌봄 숙련에 합산한다', () => {
    const companion = LIFE_MASTERIES.find((def) => def.id === 'companion')!;
    const state = stateWith({ pet_outings_total: 8, pet_outing_routes: 4, pet_outing_stamps: 12, pet_outing_complete: 2, pet_outing_partners: 3, pet_outing_pairings: 5 });
    expect(masteryXp(companion, state)).toBe(8 * 16 + 4 * 60 + 12 * 38 + 2 * 90 + 3 * 65 + 5 * 22);
    expect(lifeMasteryViews(state).find((view) => view.id === 'companion')?.level).toBeGreaterThanOrEqual(5);
  });

  it('집 생활 장면은 공간 꾸미기와 동행 돌봄 양쪽 숙련에 연결된다', () => {
    const home = LIFE_MASTERIES.find((def) => def.id === 'home')!;
    const companion = LIFE_MASTERIES.find((def) => def.id === 'companion')!;
    const state = stateWith({ pet_home_scenes: 8, pet_home_memories: 3, pet_home_partners: 2, pet_home_personalities: 2 });
    expect(masteryXp(home, state)).toBe(3 * 55 + 2 * 75);
    expect(masteryXp(companion, state)).toBe(8 * 14 + 3 * 55 + 2 * 70 + 2 * 60);
  });

  it('의뢰 해결·도장·분야·평판을 이웃 관계 숙련에 합산한다', () => {
    const community = LIFE_MASTERIES.find((def) => def.id === 'community')!;
    const state = stateWith({ village_requests_total: 10, village_request_stamps: 8, village_request_categories: 4, village_request_rank: 3 });
    expect(masteryXp(community, state)).toBe(10 * 18 + 8 * 65 + 4 * 90 + 3 * 55);
    expect(lifeMasteryViews(state).find((view) => view.id === 'community')?.level).toBeGreaterThanOrEqual(5);
  });

  it('가구 리폼 저장·조합·마감·색감·배치 가구를 공간 꾸미기 숙련에 합산한다', () => {
    const home = LIFE_MASTERIES.find((def) => def.id === 'home')!;
    const state = stateWith({ furniture_reform_saves: 5, furniture_reform_combos: 12, furniture_reform_finishes: 4, furniture_reform_colors: 6, furniture_reformed_items: 3 });
    expect(masteryXp(home, state)).toBe(5 * 14 + 12 * 55 + 4 * 80 + 6 * 65 + 3 * 20);
    expect(lifeMasteryViews(state).find((view) => view.id === 'home')?.level).toBeGreaterThanOrEqual(5);
  });

  it('홈 무드보드의 완성 도장과 배치 연구를 공간 꾸미기 숙련에 합산한다', () => {
    const home = LIFE_MASTERIES.find((def) => def.id === 'home')!;
    const state = stateWith({ home_moodboard_stamps: 4, home_moodboard_items: 13 });
    expect(masteryXp(home, state)).toBe(4 * 120 + 13 * 16);
    expect(home.objectives.filter((objective) => objective.key === 'home_moodboard_stamps')).toHaveLength(2);
  });

  it('초보자에게 분야별 첫 미완료 행동과 정확한 위치를 추천한다', () => {
    const views = lifeMasteryViews(stateWith({ open_map: 1, sparkle_collect: 4 }));
    expect(views.find((view) => view.id === 'exploration')?.nextAction).toMatchObject({
      key: 'sparkle_collect', current: 4, goal: 10, location: '골목·광장·숲길',
    });
    expect(views.find((view) => view.id === 'companion')?.nextAction?.key).toBe('pet_adopt');
  });

  it('전 분야 최소 레벨·총합·전문 분야를 파생 퀘스트 지표로 만든다', () => {
    const state = stateWith({ customize_save: 20, rare_styles: 10, q_place: 20, monster_kill: 50 });
    const summary = lifeMasterySummary(state);
    const metrics = lifeMasteryQuestMetrics(state);
    expect(summary.totalLevel).toBeGreaterThanOrEqual(10);
    expect(summary.specialty.id).toBe('style');
    expect(metrics.mastery_style_level).toBe(summary.specialty.level);
    expect(metrics.mastery_all_level).toBe(summary.minimumLevel);
    expect(metrics.mastery_total_level).toBe(summary.totalLevel);
  });

  it('파생 숙련 지표 자체는 숙련 경험치에 다시 더해지지 않는다', () => {
    const base = stateWith({ monster_kill: 10 });
    const withDerived = stateWith({ monster_kill: 10, ...lifeMasteryQuestMetrics(base) });
    expect(lifeMasteryViews(withDerived).map((view) => view.xp)).toEqual(lifeMasteryViews(base).map((view) => view.xp));
  });

  it('정원 돌봄·수확·표본을 도시 정원 숙련으로 합산한다', () => {
    const garden = LIFE_MASTERIES.find((def) => def.id === 'gardener')!;
    const state = stateWith({ garden_planted: 4, garden_tend: 12, garden_harvest: 3, garden_species: 3, garden_specimens: 5 });
    expect(masteryXp(garden, state)).toBe(4 * 12 + 12 * 8 + 3 * 35 + 3 * 65 + 5 * 45);
    expect(lifeMasteryViews(state).find((view) => view.id === 'gardener')?.level).toBeGreaterThanOrEqual(5);
  });

  it('완성 접시·메뉴·플레이팅을 골목 요리 숙련으로 합산한다', () => {
    const culinary = LIFE_MASTERIES.find((def) => def.id === 'culinary')!;
    const state = stateWith({ cooking_total: 8, cooking_recipes: 4, cooking_plates: 7, cooking_favorites: 2 });
    expect(masteryXp(culinary, state)).toBe(8 * 35 + 4 * 70 + 7 * 45 + 2 * 40);
    expect(lifeMasteryViews(state).find((view) => view.id === 'culinary')?.level).toBeGreaterThanOrEqual(5);
  });

  it('만남·생물·크기 도장을 물정원 낚시 숙련으로 합산한다', () => {
    const angler = LIFE_MASTERIES.find((def) => def.id === 'angler')!;
    const state = stateWith({ fishing_total: 12, fishing_species: 8, fishing_stamps: 18, fishing_gold_records: 2, aquarium_saves: 3, aquarium_displayed: 2, aquarium_frames: 3, aquarium_substrates: 2, aquarium_ornaments: 2 });
    expect(masteryXp(angler, state)).toBe(12 * 22 + 8 * 65 + 18 * 32 + 2 * 85 + 3 * 18 + 2 * 55 + 3 * 24 + 2 * 24 + 2 * 24);
    expect(lifeMasteryViews(state).find((view) => view.id === 'angler')?.level).toBeGreaterThanOrEqual(5);
  });
});
