import { describe, expect, it } from 'vitest';
import { normalizeState, questViews, setQuestMetric } from '../src/game/questProgress';
import {
  searchVillage, villageSearchEntries,
} from '../src/game/guidance/villageSearch';
import {
  ISO_RESIDENT_PLACEMENTS, ISO_VILLAGE_ACTIVITIES,
} from '../src/game/world/isometricVillageMap';
import { NEIGHBORHOOD_DISTRICTS } from '../src/game/world/neighborhoodDistricts';
import { RESIDENTS } from '../src/game/residents/residents';
import { ALL_QUESTS } from '../src/game/quests';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

const TODAY = '2026-07-23';

describe('전역 마을 찾기', () => {
  it('패널·실제 활동·주민·권역·전체 퀘스트를 중복 없이 한 색인으로 묶는다', () => {
    const entries = villageSearchEntries(questViews(normalizeState(null, TODAY)));
    expect(entries.filter((entry) => entry.kind === 'panel')).toHaveLength(11);
    expect(entries.filter((entry) => entry.kind === 'activity')).toHaveLength(ISO_VILLAGE_ACTIVITIES.length);
    expect(entries.filter((entry) => entry.kind === 'resident')).toHaveLength(ISO_RESIDENT_PLACEMENTS.length);
    expect(entries.filter((entry) => entry.kind === 'district')).toHaveLength(NEIGHBORHOOD_DISTRICTS.length);
    expect(entries.filter((entry) => entry.kind === 'quest')).toHaveLength(ALL_QUESTS.length);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(new Set(ISO_RESIDENT_PLACEMENTS.map((item) => item.residentId)))
      .toEqual(new Set(RESIDENTS.map((resident) => resident.id)));
  });

  it('한국어 생활 별칭으로 메뉴와 실제 목적지를 함께 찾는다', () => {
    const quests = questViews(normalizeState(null, TODAY));
    expect(searchVillage('집꾸미기', quests).some((entry) => entry.action.type === 'activity' && entry.action.activityKind === 'home')).toBe(true);
    expect(searchVillage('가구', quests).some((entry) => entry.action.type === 'activity' && entry.action.activityKind === 'shop')).toBe(true);
    expect(searchVillage('펫', quests)[0]?.title).toMatch(/펫|동행|멍냥/);
    expect(searchVillage('외곽숲', quests).some((entry) => entry.kind === 'district')).toBe(true);
    expect(searchVillage('길찾기 안내함', quests).some((entry) => (
      entry.action.type === 'activity' && entry.action.activityKind === 'search'
    ))).toBe(true);
    expect(searchVillage('세계관 비밀', quests)[0]).toMatchObject({
      kind: 'panel', title: '골목 비밀 기록',
    });
    expect(searchVillage('자캐 설정집', quests).find((entry) => entry.kind === 'panel')).toMatchObject({
      kind: 'panel', title: '골목 캐릭터 설정집',
    });
    expect(searchVillage('작은 방 정리', quests)[0]).toMatchObject({
      kind: 'panel', title: '주민 관계 수첩',
    });
    expect(searchVillage('날씨 관측소', quests).some((entry) => (
      entry.action.type === 'activity' && entry.action.activityKind === 'atmosphere'
    ))).toBe(true);
  });

  it('정확한 주민 이름과 장소 이름을 퀘스트보다 먼저 보여 준다', () => {
    const quests = questViews(normalizeState(null, TODAY));
    expect(searchVillage('하늘', quests)[0]).toMatchObject({ kind: 'resident', title: '하늘' });
    expect(searchVillage('물정원 낚시', quests)[0]).toMatchObject({ kind: 'activity', title: '물정원 낚시' });
  });

  it('진행 중 퀘스트를 잠긴 퀘스트보다 우선하고 현재 진행도를 보존한다', () => {
    let state = normalizeState(null, TODAY);
    state = setQuestMetric(state, 'monster_kill', 3);
    const results = searchVillage('몬스터', questViews(state), 'quest');
    expect(results.length).toBeGreaterThan(2);
    expect(results.some((entry) => entry.progress?.current === 3)).toBe(true);
    const firstLocked = results.findIndex((entry) => entry.progress?.state === 'locked');
    const firstActive = results.findIndex((entry) => entry.progress?.state === 'active');
    expect(firstActive).toBeGreaterThanOrEqual(0);
    if (firstLocked >= 0) expect(firstActive).toBeLessThan(firstLocked);
  });

  it('빈 검색에는 초보자가 자주 찾는 여덟 항목만 부담 없이 제안한다', () => {
    const results = searchVillage('', questViews(normalizeState(null, TODAY)));
    expect(results).toHaveLength(8);
    expect(results.every((entry) => entry.kind === 'panel' || entry.kind === 'activity')).toBe(true);
  });

  it('분류 필터와 결과 제한을 지킨다', () => {
    const quests = questViews(normalizeState(null, TODAY));
    expect(searchVillage('골목', quests, 'district').every((entry) => entry.kind === 'district')).toBe(true);
    expect(searchVillage('퀘스트', quests, 'all', 5)).toHaveLength(5);
  });

  it('찾기 사용법 두 단계가 실제 찾기 패널 안내로 되돌아온다', () => {
    const searchQuests = ALL_QUESTS.filter((quest) => quest.registryKey.startsWith('village_search_'));
    expect(searchQuests.map((quest) => quest.registryKey)).toEqual(['village_search_open', 'village_search_routes']);
    expect(searchQuests.every((quest) => !!quest.rewardLabel)).toBe(true);
    expect(villageRequestDestinationForMetric('village_search_open')).toBe('search');
    expect(villageRequestDestinationForMetric('village_search_routes')).toBe('search');
  });
});
