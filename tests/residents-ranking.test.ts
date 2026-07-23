import { describe, it, expect } from 'vitest';
import {
  RESIDENTS, applyGreeting, trustOf, metCount, trustStage, nextTrustStage, TRUST_GAIN, TRUST_MAX,
} from '../src/game/residents/residents';
import { computePoints, assignRanks } from '../src/game/ranking';
import { buildCollision, SOLID_RECTS } from '../src/game/world/mapData';
import {
  RESIDENT_STORY_ARCS, latestResidentStory, residentStoryProgress, residentStoryViews,
  residentTrustMetricKey, residentTrustMetrics,
} from '../src/game/residents/residentStories';
import { QUEST_BY_ID } from '../src/game/quests';

describe('주민 신뢰도', () => {
  it('같은 날 인사는 한 번만 +15', () => {
    let s = applyGreeting({}, 'haneul', '2026-07-21');
    expect(s.gained).toBe(true);
    expect(trustOf(s.state, 'haneul')).toBe(TRUST_GAIN);
    const again = applyGreeting(s.state, 'haneul', '2026-07-21');
    expect(again.gained).toBe(false);
    expect(trustOf(again.state, 'haneul')).toBe(TRUST_GAIN);
  });

  it('다음 날 인사는 다시 오르고 100에서 캡', () => {
    let state = {};
    for (let d = 1; d <= 9; d++) {
      state = applyGreeting(state, 'imo', `2026-07-${String(d).padStart(2, '0')}`).state;
    }
    expect(trustOf(state, 'imo')).toBe(TRUST_MAX);
  });

  it('만난 주민 수를 센다', () => {
    const s = applyGreeting({}, RESIDENTS[0]!.id, '2026-07-21').state;
    expect(metCount(s)).toBe(1);
    expect(metCount({})).toBe(0);
  });

  it('신뢰도에 따라 관계 단계와 다음 목표를 친절하게 안내한다', () => {
    expect(trustStage(0).name).toBe('낯선 얼굴');
    expect(trustStage(15).name).toBe('첫인사');
    expect(trustStage(50).name).toBe('동네 친구');
    expect(trustStage(100).name).toBe('마을 가족');
    expect(nextTrustStage(49)?.min).toBe(50);
    expect(nextTrustStage(100)).toBeNull();
  });

  it('주민 로스터는 id 중복이 없고 통행 가능한 타일에 선다', () => {
    const grid = buildCollision();
    const ids = new Set(RESIDENTS.map((r) => r.id));
    expect(ids.size).toBe(RESIDENTS.length);
    for (const r of RESIDENTS) {
      expect(grid.isSolid(r.tile.tx, r.tile.ty), `${r.name} @${r.tile.tx},${r.tile.ty}`).toBe(false);
      expect(r.favorite.length).toBeGreaterThan(4);
      expect(r.keepsake.length).toBeGreaterThan(4);
    }
  });

  it('주민 10명 모두 4장짜리 고유 관계 서사와 개인 부탁을 가진다', () => {
    expect(Object.keys(RESIDENT_STORY_ARCS)).toHaveLength(RESIDENTS.length);
    for (const resident of RESIDENTS) {
      const arc = RESIDENT_STORY_ARCS[resident.id]!;
      expect(arc.chapters.map((chapter) => chapter.threshold)).toEqual([15, 50, 80, 100]);
      expect(arc.chapters.every((chapter) => chapter.memory.length > 20 && chapter.dialogue.length > 10)).toBe(true);
      expect(arc.tags).toHaveLength(3);
      expect(arc.request.goal).toBeGreaterThan(0);
    }
  });

  it('신뢰 단계에 맞춰 이야기 앨범이 순차 해금된다', () => {
    expect(residentStoryViews('haneul', 0).filter((chapter) => chapter.unlocked)).toHaveLength(0);
    expect(residentStoryViews('haneul', 50).filter((chapter) => chapter.unlocked)).toHaveLength(2);
    expect(residentStoryViews('haneul', 100).every((chapter) => chapter.unlocked)).toBe(true);
    expect(latestResidentStory('haneul', 79)?.title).toBe('비가 그친 뒤의 관객');
  });

  it('40장 전체 진행과 주민별 신뢰 퀘스트 지표를 계산한다', () => {
    const state = {
      haneul: { v: 100, day: '2026-07-22' },
      moturi: { v: 50, day: '2026-07-22' },
    };
    expect(residentStoryProgress(state)).toEqual({ unlocked: 6, total: 40, completedResidents: 1 });
    expect(residentTrustMetrics(state)).toMatchObject({
      [residentTrustMetricKey('haneul')]: 100,
      [residentTrustMetricKey('moturi')]: 50,
      [residentTrustMetricKey('sallim')]: 0,
    });
  });

  it('각 주민의 신뢰 30 퀘스트와 개인 부탁 퀘스트가 한 체인으로 생성된다', () => {
    for (const resident of RESIDENTS) {
      const bond = QUEST_BY_ID.get(`story_resident_${resident.id}_bond`);
      const request = QUEST_BY_ID.get(`story_resident_${resident.id}_request`);
      expect(bond).toMatchObject({ registryKey: residentTrustMetricKey(resident.id), goal: 30 });
      expect(request?.prerequisite).toBe(bond?.id);
      expect(request?.rewardLabel).toBe(RESIDENT_STORY_ARCS[resident.id]!.request.reward);
    }
  });
});

describe('생활 포인트·랭킹', () => {
  it('가산값 공식: 하트×5% + 도감×1% + 신뢰도÷50%', () => {
    const p = computePoints(1000, 2, 10, 100);
    expect(p.base).toBe(1000);
    expect(p.heartPct).toBe(10);
    expect(p.dexPct).toBe(10);
    expect(p.trustPct).toBe(2);
    expect(p.total).toBe(1220); // 1000 × 1.22
  });

  it('활동이 없으면 포인트 = 코인', () => {
    expect(computePoints(500, 0, 0, 0).total).toBe(500);
  });

  it('랭킹은 코인 내림차순, 동점은 같은 순위', () => {
    const rows = assignRanks([
      { userId: 'a', nickname: 'A', coins: 100 },
      { userId: 'b', nickname: 'B', coins: 300 },
      { userId: 'c', nickname: 'C', coins: 300 },
      { userId: 'd', nickname: 'D', coins: 50 },
    ]);
    expect(rows.map((r) => [r.userId, r.rank])).toEqual([
      ['b', 1], ['c', 1], ['a', 3], ['d', 4],
    ]);
  });
});

describe('맵 데이터 회귀', () => {
  it('브랜드 상가 4곳이 인덱스 19~22에 유지된다 (BUILDING_PLACEMENT 매핑 보존)', () => {
    // 인덱스 0~3 테두리, 19~22 = Apple/GS25/CU/세븐일레븐. 채움 건물은 23~ 뒤에 추가.
    expect(SOLID_RECTS.length).toBeGreaterThanOrEqual(23);
    expect(SOLID_RECTS[19]).toEqual({ x: 6, y: 28, w: 10, h: 3 });   // Apple
    expect(SOLID_RECTS[20]).toEqual({ x: 20, y: 28, w: 6, h: 3 });   // GS25
    expect(SOLID_RECTS[22]).toEqual({ x: 58, y: 28, w: 6, h: 3 });   // 세븐일레븐
  });
});
