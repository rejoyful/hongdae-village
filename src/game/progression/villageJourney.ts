import type { QuestView } from '../questProgress';
import type { QuestCategory } from '../quests';
import type { LifeMasteryView } from './lifeMastery';

export interface VillageJourneyChapterDef {
  id: string;
  chapter: number;
  mark: string;
  title: string;
  description: string;
  questIds: readonly string[];
  required: number;
  reward: string;
}

export interface VillageJourneyObjectiveView {
  id: string;
  name: string;
  location: string;
  unlocked: boolean;
  done: boolean;
  progress: number;
  goal: number;
}

export interface VillageJourneyChapterView extends VillageJourneyChapterDef {
  objectives: VillageJourneyObjectiveView[];
  completed: number;
  status: 'locked' | 'active' | 'complete';
}

export const VILLAGE_JOURNEY_CHAPTERS: readonly VillageJourneyChapterDef[] = [
  {
    id: 'arrival', chapter: 1, mark: '첫', title: '문을 연 첫날',
    description: '일지·지도·이웃·아틀리에 중 세 가지를 골라 마을에 첫 흔적을 남깁니다.',
    questIds: ['intro_journal', 'intro_map', 'intro_greet', 'story_style', 'story_atmosphere_visit'], required: 3,
    reward: '첫날의 여권 도장',
  },
  {
    id: 'belonging', chapter: 2, mark: '집', title: '내가 사는 방식',
    description: '집, 가구, 펫, 사진처럼 마음이 가는 생활 세 갈래를 시작합니다.',
    questIds: ['intro_home', 'intro_decorate', 'intro_pet', 'story_photo', 'story_home_layout_first', 'story_home_studio_first', 'story_object_story_first', 'story_room_care_first'], required: 3,
    reward: '생활의 첫 페이지 배지',
  },
  {
    id: 'handmade', chapter: 3, mark: '손', title: '손끝에 남는 하루',
    description: '정원·요리·낚시·리폼·펫 산책·골목 소풍 중 세 분야를 직접 경험합니다.',
    questIds: [
      'story_garden_seed', 'story_cooking_first', 'story_fishing_first',
      'story_reform_first', 'story_pet_outing_first', 'story_project_first', 'story_tour_first',
    ], required: 3, reward: '골목 생활 제작자 배지',
  },
  {
    id: 'neighbors', chapter: 4, mark: '이', title: '이름을 기억하는 골목',
    description: '주민, 채팅, 집들이, 나눔장터, 카페와 공연 가운데 세 장면에서 관계를 만듭니다.',
    questIds: [
      'story_neighbor_circle', 'story_first_chat', 'story_home_first_guest',
      'story_regular', 'story_street_stage',
      'story_neighbor_cheer_send', 'story_neighbor_cheer_receive',
      'story_neighbor_home_first', 'story_home_open_public',
      'story_home_guestbook_send', 'story_home_guestbook_receive',
      'story_shared_project_first',
      'story_market_visit', 'story_market_listing', 'story_market_sale',
      'collect_room_care_rooms_5',
    ], required: 3, reward: '골목 인연 기록가 배지',
  },
  {
    id: 'collector', chapter: 5, mark: '수', title: '수집가의 벽 한 칸',
    description: '패션, 집, 펫, 정원, 낚시, 인형, 소풍 엽서, 장터 중 좋아하는 도감 세 권을 채웁니다.',
    questIds: [
      'collect_sparkle_10', 'collect_fashion_12', 'collect_home_unique_20',
      'collect_pet_accessories_5', 'collect_garden_species_6',
      'collect_fishing_species_6', 'collect_dolls_6', 'collect_tour_postcards_6',
      'collect_museum_exhibits_8',
      'collect_request_story_8',
      'collect_home_layout_slots_6',
      'collect_home_studio_moods_3',
      'collect_object_story_35',
      'collect_atmospheres_4',
      'collect_character_episode_kinds_4',
      'collect_club_fan_pieces_12',
      'collect_starter_mentor_chapters_6',
      'collect_shelf_kinds_4', 'collect_shelf_completed_4',
      'collect_resident_fan_ribbons_20',
      'collect_room_care_featured_3',
      'collect_adventure_kits_3',
      'collect_life_synergies_6',
      'collect_market_categories_6', 'collect_market_unique_10',
    ], required: 3, reward: '취향 수집가 배지',
  },
  {
    id: 'specialist', chapter: 6, mark: '숙', title: '네 갈래의 전문 생활',
    description: '열 가지 생활 숙련 중 네 분야를 Lv.5까지 키워 자신만의 전문 조합을 만듭니다.',
    questIds: [
      'master_life_exploration_5', 'master_life_style_5', 'master_life_home_5',
      'master_life_companion_5', 'master_life_community_5', 'master_life_performer_5',
      'master_life_gardener_5', 'master_life_culinary_5', 'master_life_angler_5',
      'master_life_adventure_5',
    ], required: 4, reward: '다분야 생활 전문가 휘장',
  },
  {
    id: 'chronicle', chapter: 7, mark: '록', title: '홍대마을 연대기',
    description: '관계와 수집의 깊은 기록 중 네 가지를 완성해 마을의 오래된 이웃이 됩니다.',
    questIds: [
      'master_resident_family', 'collect_home_visitors_10', 'collect_request_stamps_24',
      'collect_lookbook_entries_12', 'collect_pet_outing_routes_8',
      'collect_fishing_species_18', 'collect_garden_species_12', 'collect_monster_15',
      'collect_project_phases_10', 'collect_tour_moods_6', 'collect_museum_wings_4',
      'collect_request_story_routes_8',
      'collect_neighbor_cheer_kinds_8',
      'collect_neighbor_homes_5', 'collect_neighbor_home_themes_6',
      'collect_neighbor_home_favorites_6',
      'collect_home_guestbook_kinds_8', 'collect_home_guestbook_visitors_10',
      'collect_home_layout_scenes_6', 'collect_home_layout_items_30',
      'collect_object_story_chapters_9',
      'collect_atmospheres_8',
      'collect_character_episodes_8',
      'collect_club_complete_kits_3', 'collect_club_featured_3',
      'collect_starter_mentor_routes_2', 'collect_starter_mentor_featured_3',
      'collect_shared_project_kinds_8', 'collect_shared_project_chapters_3',
      'collect_resident_fan_everyone',
      'master_room_care_rooms_10',
    ], required: 4, reward: '마을 연대기 편집자 휘장',
  },
  {
    id: 'legend', chapter: 8, mark: '별', title: '자기 방식의 전설',
    description: '최상위 장기 목표 중 다섯 가지를 골라 한 가지 정답 없는 엔드게임을 완성합니다.',
    questIds: [
      'master_level_20', 'master_decorate_50', 'master_style_10', 'master_pet_memories',
      'master_fishing_50', 'master_cooking_30', 'master_request_rank_10',
      'master_life_total_45', 'master_project_phases_20', 'master_tour_postcards_12', 'master_museum_exhibits_24',
      'master_request_story_24',
      'master_home_guestbook_50',
      'master_home_layout_saves_30',
      'master_home_studio_featured_3',
      'master_object_story_favorites_9',
      'master_atmosphere_replays_20',
      'master_character_episodes_24',
      'master_club_fan_pieces_30', 'master_club_complete_kits_6', 'master_club_room_replays_20',
      'master_starter_mentor_chapters_18', 'master_starter_mentor_routes_6', 'master_starter_mentor_replays_30',
      'master_shared_project_contributions_30',
      'master_shelf_completed_8',
      'master_resident_fan_ten',
      'master_adventure_charms_8',
      'master_life_synergies_18',
      'master_market_exchanges_30',
    ], required: 5, reward: '홍대마을 생활 전설 휘장',
  },
] as const;

export interface VillageLevelMilestone {
  level: number;
  title: string;
  reward: string;
}

export const VILLAGE_LEVEL_MAX = 50;

export const VILLAGE_LEVEL_MILESTONES: readonly VillageLevelMilestone[] = [
  { level: 5, title: '골목 산책자', reward: '골목 산책자 명찰' },
  { level: 10, title: '생활 수집가', reward: '생활 수집가 명찰' },
  { level: 20, title: '마을 단골', reward: '마을 단골 명찰' },
  { level: 30, title: '취향 기록가', reward: '취향 기록가 명찰' },
  { level: 40, title: '골목 장인', reward: '골목 장인 명찰' },
  { level: 50, title: '마을 연대기', reward: '마을 연대기 명찰' },
] as const;

export interface VillagePassportRouteDef {
  id: string;
  mark: string;
  title: string;
  description: string;
  stamps: readonly [string, string, string, string, string];
}

export interface VillagePassportStampView {
  level: number;
  name: string;
  status: 'recorded' | 'current' | 'upcoming';
  majorReward: VillageLevelMilestone | null;
}

export interface VillagePassportRouteView extends Omit<VillagePassportRouteDef, 'stamps'> {
  startLevel: number;
  endLevel: number;
  recorded: number;
  status: 'complete' | 'active' | 'upcoming';
  stamps: VillagePassportStampView[];
}

/** 모든 레벨에 남는 영구 기록 도장. 5레벨마다 수첩의 한 골목이 완성된다. */
export const VILLAGE_PASSPORT_ROUTES: readonly VillagePassportRouteDef[] = [
  { id: 'hello', mark: '첫', title: '첫 인사의 골목', description: '문을 열고 지도에 나의 첫 자리를 표시합니다.', stamps: ['문 열기', '첫 지도', '첫 발자국', '이웃 인사', '산책자 도장'] },
  { id: 'daily', mark: '생', title: '생활 수첩 골목', description: '작은 발견이 하루의 취향으로 이어집니다.', stamps: ['작은 발견', '손에 익기', '하루 기록', '취향 한 칸', '수집가 도장'] },
  { id: 'home', mark: '집', title: '내 집의 결', description: '오래 머물고 싶은 공간의 표정을 찾아갑니다.', stamps: ['가구 한 점', '빛 한 칸', '식물 곁', '머무는 자리', '집의 표정'] },
  { id: 'regular', mark: '단', title: '익숙한 골목', description: '서로의 이름과 좋아하는 것을 기억합니다.', stamps: ['단골 인사', '이름 기억', '골목 소식', '함께 앉기', '단골 도장'] },
  { id: 'companion', mark: '동', title: '동행의 시간', description: '작은 친구와 발맞춘 장면을 차곡차곡 남깁니다.', stamps: ['발맞추기', '같이 놀기', '산책길', '추억 한 장', '단짝 기록'] },
  { id: 'archive', mark: '록', title: '취향 기록실', description: '코디와 사진, 수집 선반을 나만의 색으로 묶습니다.', stamps: ['오늘의 코디', '사진 한 장', '수집 선반', '나만의 색', '기록가 도장'] },
  { id: 'workshop', mark: '손', title: '손끝 공방', description: '재료를 고르고 손질해 새로운 조합을 만듭니다.', stamps: ['재료 고르기', '첫 손질', '새로운 조합', '만든 이의 표식', '생활 제작자'] },
  { id: 'artisan', mark: '장', title: '골목 장인의 길', description: '오래 쓰고 고쳐 쓰며 함께 만드는 법을 배웁니다.', stamps: ['오래 쓰기', '고쳐 쓰기', '나눠 쓰기', '함께 만들기', '장인 도장'] },
  { id: 'editor', mark: '편', title: '마을 편집실', description: '사라질 장면과 계절의 이름을 한 권에 엮습니다.', stamps: ['남길 장면', '사람의 이름', '계절 기록', '골목 지도', '편집자 도장'] },
  { id: 'chronicle', mark: '별', title: '우리의 연대기', description: '좋아한 것과 함께한 날 다음의 한 페이지까지 기록합니다.', stamps: ['되돌아보기', '좋아한 것', '함께한 날', '다음 페이지', '연대기 도장'] },
] as const;

export function villagePassportRoutes(level: number): VillagePassportRouteView[] {
  const safeLevel = Math.max(1, Math.min(VILLAGE_LEVEL_MAX, Math.floor(level)));
  return VILLAGE_PASSPORT_ROUTES.map((route, routeIndex) => {
    const startLevel = routeIndex * 5 + 1;
    const endLevel = startLevel + 4;
    const recorded = Math.max(0, Math.min(5, safeLevel - startLevel + 1));
    const status: VillagePassportRouteView['status'] = safeLevel > endLevel
      ? 'complete'
      : safeLevel >= startLevel ? 'active' : 'upcoming';
    return {
      ...route,
      startLevel,
      endLevel,
      recorded,
      status,
      stamps: route.stamps.map((name, stampIndex) => {
        const stampLevel = startLevel + stampIndex;
        return {
          level: stampLevel,
          name,
          status: stampLevel < safeLevel ? 'recorded' : stampLevel === safeLevel ? 'current' : 'upcoming',
          majorReward: VILLAGE_LEVEL_MILESTONES.find((milestone) => milestone.level === stampLevel) ?? null,
        };
      }),
    };
  });
}

export interface VillageXpBreakdown {
  firstSteps: number;
  stories: number;
  collections: number;
  mastery: number;
  life: number;
}

export interface VillageLevelView {
  level: number;
  title: string;
  totalXp: number;
  questXp: number;
  activityXp: number;
  xpBreakdown: VillageXpBreakdown;
  levelXp: number;
  levelGoal: number;
  xpToNextLevel: number;
  progressPct: number;
  nextMilestone: VillageLevelMilestone | null;
}

export interface VillageJourneySummary {
  chapters: VillageJourneyChapterView[];
  completedChapters: number;
  level: VillageLevelView;
}

export interface VillageLevelAdvance {
  from: number;
  to: number;
  gained: number;
  title: string;
  milestone: VillageLevelMilestone | null;
}

const QUEST_XP: Record<Exclude<QuestCategory, 'daily'>, number> = {
  onboarding: 80,
  story: 120,
  collection: 160,
  mastery: 220,
};

const isJourneyReward = (id: string): boolean => id.startsWith('journey_reward_');
const isVillageLevelReward = (id: string): boolean => id.startsWith('master_village_level_');

/** 해당 레벨에 처음 도달하는 데 필요한 누적 마을 XP. */
export function villageXpFloor(level: number): number {
  const safe = Math.max(1, Math.min(VILLAGE_LEVEL_MAX, Math.floor(level)));
  return Math.round(90 * Math.pow(safe - 1, 1.75));
}

export function villageLevelForXp(xp: number): number {
  const safe = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let level = 1;
  while (level < VILLAGE_LEVEL_MAX && safe >= villageXpFloor(level + 1)) level += 1;
  return level;
}

export function villageTitle(level: number): string {
  const milestone = [...VILLAGE_LEVEL_MILESTONES].reverse().find((item) => level >= item.level);
  return milestone?.title ?? '새로 온 이웃';
}

/** HUD가 복수 레벨 상승과 중간 명찰 보상을 놓치지 않도록 한 번의 성장 사건으로 묶는다. */
export function villageLevelAdvance(previous: number, current: number): VillageLevelAdvance | null {
  const from = Math.max(1, Math.min(VILLAGE_LEVEL_MAX, Math.floor(previous)));
  const to = Math.max(1, Math.min(VILLAGE_LEVEL_MAX, Math.floor(current)));
  if (to <= from) return null;
  return {
    from,
    to,
    gained: to - from,
    title: villageTitle(to),
    milestone: [...VILLAGE_LEVEL_MILESTONES].reverse()
      .find((item) => item.level > from && item.level <= to) ?? null,
  };
}

export function villageJourneyChapters(views: readonly QuestView[]): VillageJourneyChapterView[] {
  const byId = new Map(views.map((quest) => [quest.id, quest]));
  let routeOpen = true;
  return VILLAGE_JOURNEY_CHAPTERS.map((chapter) => {
    const objectives = chapter.questIds.flatMap((id) => {
      const quest = byId.get(id);
      return quest ? [{
        id: quest.id, name: quest.name, location: quest.location, unlocked: quest.unlocked,
        done: quest.done, progress: quest.progress, goal: quest.goal,
      }] : [];
    });
    const completed = objectives.filter((objective) => objective.done).length;
    const complete = routeOpen && completed >= chapter.required;
    const status: VillageJourneyChapterView['status'] = !routeOpen ? 'locked' : complete ? 'complete' : 'active';
    routeOpen = complete;
    return { ...chapter, objectives, completed, status };
  });
}

export function villageLevelView(
  views: readonly QuestView[], masteries: readonly LifeMasteryView[],
): VillageLevelView {
  const xpBreakdown: VillageXpBreakdown = { firstSteps: 0, stories: 0, collections: 0, mastery: 0, life: 0 };
  const questXp = views.reduce((total, quest) => {
    if (!quest.done || quest.category === 'daily' || isJourneyReward(quest.id) || isVillageLevelReward(quest.id)) return total;
    const xp = QUEST_XP[quest.category];
    if (quest.category === 'onboarding') xpBreakdown.firstSteps += xp;
    else if (quest.category === 'story') xpBreakdown.stories += xp;
    else if (quest.category === 'collection') xpBreakdown.collections += xp;
    else xpBreakdown.mastery += xp;
    return total + xp;
  }, 0);
  // 생활 활동 자체의 XP도 그대로 합쳐 전투를 하지 않는 플레이어도 같은 마을 레벨을 올릴 수 있다.
  const activityXp = masteries.reduce((total, mastery) => total + Math.max(0, mastery.xp), 0);
  xpBreakdown.life = activityXp;
  const totalXp = Math.min(Number.MAX_SAFE_INTEGER, questXp + activityXp);
  const level = villageLevelForXp(totalXp);
  const floor = villageXpFloor(level);
  const nextFloor = level >= VILLAGE_LEVEL_MAX ? floor : villageXpFloor(level + 1);
  const levelGoal = Math.max(0, nextFloor - floor);
  const levelXp = level >= VILLAGE_LEVEL_MAX ? levelGoal : Math.max(0, totalXp - floor);
  return {
    level,
    title: villageTitle(level),
    totalXp,
    questXp,
    activityXp,
    xpBreakdown,
    levelXp,
    levelGoal,
    xpToNextLevel: level >= VILLAGE_LEVEL_MAX ? 0 : Math.max(0, levelGoal - levelXp),
    progressPct: level >= VILLAGE_LEVEL_MAX ? 100 : Math.round((levelXp / Math.max(1, levelGoal)) * 100),
    nextMilestone: VILLAGE_LEVEL_MILESTONES.find((milestone) => milestone.level > level) ?? null,
  };
}

export function villageJourneySummary(
  views: readonly QuestView[], masteries: readonly LifeMasteryView[],
): VillageJourneySummary {
  const chapters = villageJourneyChapters(views);
  return {
    chapters,
    completedChapters: chapters.filter((chapter) => chapter.status === 'complete').length,
    level: villageLevelView(views, masteries),
  };
}

/** 파생 진행만 반환하므로 반복 동기화해도 경험치가 중복되지 않는다. */
export function villageJourneyMetrics(
  views: readonly QuestView[], masteries: readonly LifeMasteryView[],
): Record<'journey_chapters' | 'village_level', number> {
  const summary = villageJourneySummary(views, masteries);
  return { journey_chapters: summary.completedChapters, village_level: summary.level.level };
}
