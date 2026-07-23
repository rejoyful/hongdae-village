import { describe, expect, it } from 'vitest';
import { ALL_QUESTS } from '../src/game/quests';
import {
  bumpQuest, normalizeState, questViews, setQuestMetric, type QuestState, type QuestView,
} from '../src/game/questProgress';
import { lifeMasteryViews } from '../src/game/progression/lifeMastery';
import {
  VILLAGE_JOURNEY_CHAPTERS, VILLAGE_LEVEL_MAX, villageJourneyChapters,
  VILLAGE_PASSPORT_ROUTES, villageJourneyMetrics, villageLevelAdvance, villageLevelForXp, villageLevelView,
  villagePassportRoutes, villageXpFloor,
} from '../src/game/progression/villageJourney';
import { VILLAGE_LEVEL_REWARDS, villageLevelRewardViews } from '../src/game/progression/villageRewards';

const TODAY = '2026-07-23';

const fresh = (): QuestState => normalizeState(null, TODAY);

describe('선택형 마을 여정', () => {
  it('여러 레벨을 한 번에 올라도 지나친 가장 높은 명찰을 레벨업 사건에 담는다', () => {
    expect(villageLevelAdvance(4, 11)).toEqual({
      from: 4, to: 11, gained: 7, title: '생활 수집가',
      milestone: { level: 10, title: '생활 수집가', reward: '생활 수집가 명찰' },
    });
    expect(villageLevelAdvance(10, 10)).toBeNull();
    expect(villageLevelAdvance(12, 8)).toBeNull();
  });

  it('연속 갱신은 첫 출발 레벨을 유지하면 중간 명찰을 잃지 않는다', () => {
    const first = villageLevelAdvance(4, 5)!;
    const merged = villageLevelAdvance(first.from, 6);
    expect(merged).toMatchObject({ from: 4, to: 6, gained: 2, milestone: { level: 5, reward: '골목 산책자 명찰' } });
  });
  it('8개 장의 모든 목표가 실제 퀘스트를 참조하며 각 장에 선택 여유가 있다', () => {
    const ids = new Set(ALL_QUESTS.map((quest) => quest.id));
    expect(VILLAGE_JOURNEY_CHAPTERS).toHaveLength(8);
    for (const chapter of VILLAGE_JOURNEY_CHAPTERS) {
      expect(chapter.required).toBeGreaterThanOrEqual(3);
      expect(chapter.questIds.length).toBeGreaterThan(chapter.required);
      expect(chapter.questIds.every((id) => ids.has(id))).toBe(true);
      expect(chapter.reward.length).toBeGreaterThan(4);
    }
  });

  it('첫 장에서 네 목표 중 세 개만 골라도 다음 장이 열린다', () => {
    let state = fresh();
    state = bumpQuest(state, 'open_quest');
    state = bumpQuest(state, 'open_map');
    state = bumpQuest(state, 'resident_greet');
    const chapters = villageJourneyChapters(questViews(state));
    expect(chapters[0]).toMatchObject({ status: 'complete', completed: 3, required: 3 });
    expect(chapters[1]?.status).toBe('active');
    expect(chapters[2]?.status).toBe('locked');
  });

  it('잠긴 장에서 미리 한 활동도 이전 장 완료 뒤 소급 인정한다', () => {
    let state = fresh();
    state = setQuestMetric(state, 'visit_home', 1);
    state = setQuestMetric(state, 'q_place', 1);
    state = setQuestMetric(state, 'pet_adopt', 1);
    let chapters = villageJourneyChapters(questViews(state));
    expect(chapters[1]).toMatchObject({ status: 'locked', completed: 3 });

    state = bumpQuest(state, 'open_quest');
    state = bumpQuest(state, 'open_map');
    state = bumpQuest(state, 'resident_greet');
    chapters = villageJourneyChapters(questViews(state));
    expect(chapters[0]?.status).toBe('complete');
    expect(chapters[1]?.status).toBe('complete');
    expect(chapters[2]?.status).toBe('active');
  });

  it('연속 완료한 장 수가 배지 퀘스트용 파생 지표가 된다', () => {
    let state = fresh();
    for (const key of ['open_quest', 'open_map', 'resident_greet']) state = bumpQuest(state, key);
    for (const key of ['visit_home', 'q_place', 'pet_adopt']) state = setQuestMetric(state, key, 1);
    const views = questViews(state);
    const metrics = villageJourneyMetrics(views, lifeMasteryViews(state));
    expect(metrics.journey_chapters).toBe(2);
    state = setQuestMetric(state, 'journey_chapters', metrics.journey_chapters);
    expect(questViews(state).find((quest) => quest.id === 'journey_reward_2')).toMatchObject({ done: true, unlocked: true });
  });
});

describe('통합 마을 레벨', () => {
  it('1~50 모든 레벨에 겹치지 않는 영구 여권 도장을 배치한다', () => {
    expect(VILLAGE_PASSPORT_ROUTES).toHaveLength(10);
    const routes = villagePassportRoutes(23);
    const stamps = routes.flatMap((route) => route.stamps);
    expect(stamps).toHaveLength(50);
    expect(stamps.map((stamp) => stamp.level)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    expect(routes[3]).toMatchObject({ startLevel: 16, endLevel: 20, recorded: 5, status: 'complete' });
    expect(routes[4]).toMatchObject({ startLevel: 21, endLevel: 25, recorded: 3, status: 'active' });
    expect(routes[5]).toMatchObject({ recorded: 0, status: 'upcoming' });
    expect(stamps.find((stamp) => stamp.level === 23)?.status).toBe('current');
    expect(stamps.find((stamp) => stamp.level === 20)?.majorReward?.reward).toBe('마을 단골 명찰');
    expect(villagePassportRoutes(5)[0]).toMatchObject({ recorded: 5, status: 'active' });
    expect(villagePassportRoutes(5)[1]).toMatchObject({ recorded: 0, status: 'upcoming' });
    expect(villagePassportRoutes(50)[9]).toMatchObject({ recorded: 5, status: 'active' });
  });

  it('여섯 마일스톤이 코디·펫 장식·가구 레시피를 같은 배지로 자동 해금한다', () => {
    expect(VILLAGE_LEVEL_REWARDS.map((reward) => reward.level)).toEqual([5, 10, 20, 30, 40, 50]);
    expect(new Set(VILLAGE_LEVEL_REWARDS.map((reward) => reward.outfit.id)).size).toBe(6);
    expect(new Set(VILLAGE_LEVEL_REWARDS.map((reward) => reward.petAccessory.id)).size).toBe(6);
    expect(new Set(VILLAGE_LEVEL_REWARDS.map((reward) => reward.homeRecipe.id)).size).toBe(6);
    const views = villageLevelRewardViews(['badge_master_village_level_10']);
    expect(views.find((reward) => reward.level === 10)?.unlocked).toBe(true);
    expect(views.filter((reward) => reward.level !== 10).every((reward) => !reward.unlocked)).toBe(true);
  });

  it('누적 XP 경계가 단조 증가하고 1~50 레벨로 제한된다', () => {
    const floors = Array.from({ length: VILLAGE_LEVEL_MAX }, (_, index) => villageXpFloor(index + 1));
    expect(floors[0]).toBe(0);
    expect([...floors].sort((a, b) => a - b)).toEqual(floors);
    expect(villageLevelForXp(0)).toBe(1);
    expect(villageLevelForXp(villageXpFloor(10))).toBe(10);
    expect(villageLevelForXp(Number.MAX_SAFE_INTEGER)).toBe(50);
  });

  it('전투 없이 코디와 생활 기록만으로도 마을 레벨이 오른다', () => {
    let state = fresh();
    state = bumpQuest(state, 'open_quest');
    state = bumpQuest(state, 'customize_save', 10);
    state = bumpQuest(state, 'closet_save', 4);
    state = setQuestMetric(state, 'rare_styles', 3);
    const view = villageLevelView(questViews(state), lifeMasteryViews(state));
    expect(state.lifetimeCounts?.monster_kill ?? 0).toBe(0);
    expect(view.level).toBeGreaterThanOrEqual(5);
    expect(view.totalXp).toBeGreaterThan(0);
    expect(view.questXp + view.activityXp).toBe(view.totalXp);
    expect(Object.values(view.xpBreakdown).reduce((total, xp) => total + xp, 0)).toBe(view.totalXp);
    expect(view.xpToNextLevel).toBe(Math.max(0, view.levelGoal - view.levelXp));
    expect(view.progressPct).toBeGreaterThanOrEqual(0);
  });

  it('여정·마을 레벨 보상 퀘스트는 자기 자신의 XP를 다시 만들지 않는다', () => {
    const base = ALL_QUESTS.find((quest) => quest.id === 'journey_reward_1')!;
    const rewardView: QuestView = {
      ...base, progress: 1, done: true, claimed: false, unlocked: true,
    };
    const levelReward = ALL_QUESTS.find((quest) => quest.id === 'master_village_level_5')!;
    const levelRewardView: QuestView = {
      ...levelReward, progress: 5, done: true, claimed: false, unlocked: true,
    };
    expect(villageLevelView([rewardView, levelRewardView], []).totalXp).toBe(0);
  });
});
