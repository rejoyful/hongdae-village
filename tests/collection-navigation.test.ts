import { describe, expect, it } from 'vitest';
import { collectionWorldGuide, findIsoVillageRoute } from '../src/game/world/isometricCollectionGuide';
import {
  ISO_VILLAGE_ACTIVITIES, ISO_VILLAGE_SPAWN, buildIsoVillageCollision,
} from '../src/game/world/isometricVillageMap';
import { TASTE_DOMAINS } from '../src/game/progression/tasteProfile';

describe('수집 선반 아이소메트릭 길 안내', () => {
  it('가구 목표를 실제 살림 쇼룸과 목표 진열대로 연결한다', () => {
    expect(collectionWorldGuide('item:bed_basic')).toMatchObject({
      mode: 'activity', activityKind: 'shop', focusItemId: 'bed_basic', title: '포근한 침대',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'shop' && spot.id === 'sallim-showroom')).toBe(true);
    expect(collectionWorldGuide('item:bed_green')).toMatchObject({
      mode: 'activity', activityKind: 'workshop', focusItemId: 'bed_green', title: '그린 더블침대',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'workshop' && spot.id === 'sallim-workbench')).toBe(true);
  });

  it('몬스터·생활 기록을 외곽숲, 활동 지점 또는 전용 수첩으로 빠짐없이 분류한다', () => {
    expect(collectionWorldGuide('monster:slime_g')).toMatchObject({ mode: 'hunt', tier: 1 });
    expect(collectionWorldGuide('metric:residents_met')).toMatchObject({ mode: 'panel', panel: 'residents' });
    expect(collectionWorldGuide('metric:treasures_owned')).toMatchObject({ mode: 'panel', panel: 'treasure' });
    for (const metric of TASTE_DOMAINS.flatMap((domain) => domain.metrics)) {
      const guide = collectionWorldGuide(`metric:${metric.key}`);
      expect(guide, metric.key).not.toBeNull();
      if (guide?.mode === 'activity') {
        expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === guide.activityKind), metric.key).toBe(true);
      }
    }
  });

  it('금빛 발자국은 충돌 타일을 피하고 한 칸씩 쇼룸까지 이어진다', () => {
    const shop = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.kind === 'shop')!;
    const route = findIsoVillageRoute(ISO_VILLAGE_SPAWN, { tx: shop.tx, ty: shop.ty });
    const grid = buildIsoVillageCollision();
    expect(route[0]).toEqual(ISO_VILLAGE_SPAWN);
    expect(route.at(-1)).toEqual({ tx: shop.tx, ty: shop.ty });
    route.forEach((step, index) => {
      expect(grid.isSolid(step.tx, step.ty), `${step.tx},${step.ty}`).toBe(false);
      if (index === 0) return;
      const previous = route[index - 1]!;
      expect(Math.abs(step.tx - previous.tx) + Math.abs(step.ty - previous.ty)).toBe(1);
    });
  });

  it('동아리 연대기 목표는 중앙 광장의 실제 게시판으로 이어진다', () => {
    expect(collectionWorldGuide('metric:hobby_club_chapters')).toMatchObject({
      mode: 'activity', activityKind: 'clubs', title: '동아리 발간 장',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'clubs' && spot.id === 'hobby-clubs')).toBe(true);
  });

  it('공동 프로젝트 목표는 레코드 골목의 실제 설계소로 이어진다', () => {
    expect(collectionWorldGuide('metric:community_project_phases')).toMatchObject({
      mode: 'activity', activityKind: 'projects', title: '함께짓기 완성 단계',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'projects' && spot.id === 'community-projects')).toBe(true);
  });

  it('소풍 엽서 목표는 중앙 광장의 실제 안내소로 이어진다', () => {
    expect(collectionWorldGuide('metric:neighborhood_tour_postcards')).toMatchObject({
      mode: 'activity', activityKind: 'guide', title: '골목 소풍 완주 엽서',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'guide' && spot.id === 'neighborhood-guide')).toBe(true);
  });

  it('생활 기념품 목표는 레코드 골목의 실제 작은 박물관으로 이어진다', () => {
    expect(collectionWorldGuide('metric:neighborhood_museum_exhibits')).toMatchObject({
      mode: 'activity', activityKind: 'museum', title: '생활 기념품',
    });
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'museum' && spot.id === 'neighborhood-museum')).toBe(true);
  });

  it('이웃 교환 도감은 중앙 광장 남쪽의 실제 나눔장터로 이어진다', () => {
    for (const key of ['market_categories', 'market_unique_items', 'market_exchanges']) {
      expect(collectionWorldGuide(`metric:${key}`)).toMatchObject({
        mode: 'activity', activityKind: 'market',
      });
    }
    expect(ISO_VILLAGE_ACTIVITIES.some((spot) => spot.kind === 'market' && spot.id === 'neighborhood-market')).toBe(true);
  });

  it('연속 의뢰 수집 목표는 중앙 광장의 실제 모험 일지로 이어진다', () => {
    for (const key of ['village_request_story_chapters', 'village_request_story_routes']) {
      expect(collectionWorldGuide(`metric:${key}`)).toMatchObject({ mode: 'activity', activityKind: 'quest' });
    }
  });

  it('스타일과 동행 목표를 실제 아틀리에·펫샵으로 안내한다', () => {
    expect(collectionWorldGuide('style:eyeStyle-4')).toMatchObject({
      mode: 'activity', activityKind: 'atelier', title: '날카로운 눈',
    });
    expect(collectionWorldGuide('pet:dog')).toMatchObject({
      mode: 'activity', activityKind: 'petshop', title: '강아지',
    });
    expect(collectionWorldGuide('pet:goldcat')).toMatchObject({
      mode: 'activity', activityKind: 'petshop', title: '숨은 동행',
    });
  });

  it('선반 성장 목표는 현재 선반과 진행도를 바로 보여준다', () => {
    for (const key of [
      'collection_shelf_targets', 'collection_shelf_kinds', 'collection_shelf_completed',
    ]) {
      expect(collectionWorldGuide(`metric:${key}`)).toMatchObject({
        mode: 'panel', panel: 'collection-shelf',
      });
    }
  });

  it('주민 팬덤 목표는 최애 팬북을 바로 펼친다', () => {
    for (const key of ['resident_fan_favorites', 'resident_fan_ribbons']) {
      expect(collectionWorldGuide(`metric:${key}`)).toMatchObject({
        mode: 'panel', panel: 'resident-fanbook',
      });
    }
  });

  it('원정 역할과 세팅 목표는 골목 원정 키트를 바로 펼친다', () => {
    for (const key of ['adventure_roles_tried', 'adventure_kits_saved']) {
      expect(collectionWorldGuide(`metric:${key}`)).toMatchObject({
        mode: 'panel', panel: 'adventure-kit',
      });
    }
  });

  it('손상되거나 존재하지 않는 목표는 안내를 만들지 않는다', () => {
    expect(collectionWorldGuide('item:not-real')).toBeNull();
    expect(collectionWorldGuide('broken')).toBeNull();
  });
});
