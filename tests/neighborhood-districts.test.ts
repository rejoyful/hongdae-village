import { describe, expect, it } from 'vitest';
import {
  NEIGHBORHOOD_DISTRICTS,
  NeighborhoodDistrictStore,
  neighborhoodDistrictAt,
  normalizeNeighborhoodDistrictState,
} from '../src/game/world/neighborhoodDistricts';
import { ISO_VILLAGE_SPAWN } from '../src/game/world/isometricVillageMap';
import { findIsoVillageRoute } from '../src/game/world/isometricCollectionGuide';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('골목 권역 여권', () => {
  it('34×24 월드의 모든 타일을 정확히 일곱 권역 중 하나로 분류한다', () => {
    const ids = new Set<string>();
    for (let ty = 0; ty < 24; ty += 1) for (let tx = 0; tx < 34; tx += 1) {
      const district = neighborhoodDistrictAt(tx, ty);
      expect(district, `${tx},${ty}`).not.toBeNull();
      ids.add(district!.id);
    }
    expect(ids).toEqual(new Set(NEIGHBORHOOD_DISTRICTS.map((district) => district.id)));
    expect(neighborhoodDistrictAt(-1, 4)).toBeNull();
    expect(neighborhoodDistrictAt(34, 4)).toBeNull();
  });

  it('각 여권 표식은 해당 권역의 통행 가능한 타일이며 첫 스폰에서 안전 경로가 있다', () => {
    for (const district of NEIGHBORHOOD_DISTRICTS) {
      expect(neighborhoodDistrictAt(district.guideTarget.tx, district.guideTarget.ty)?.id).toBe(district.id);
      expect(findIsoVillageRoute(ISO_VILLAGE_SPAWN, district.guideTarget).length, district.id).toBeGreaterThan(0);
    }
  });

  it('첫 발견만 영구 도장으로 세고 재진입은 중복 기록하지 않는다', () => {
    const store = new NeighborhoodDistrictStore('walker', new MemoryStorage());
    expect(store.discover('station-gate')).toBe('discovered');
    expect(store.discover('station-gate')).toBe('known');
    expect(store.discover('central-square')).toBe('discovered');
    expect(store.progress()).toMatchObject({ discovered: 2, total: 7, safeDiscovered: 2 });
  });

  it('발견한 권역만 최애로 전시하고 같은 권역을 다시 누르면 해제한다', () => {
    const store = new NeighborhoodDistrictStore('favorite', new MemoryStorage());
    expect(store.feature('creative-alley')).toBe('locked');
    store.discover('creative-alley');
    expect(store.feature('creative-alley')).toBe('featured');
    expect(store.progress().featured).toBe(1);
    expect(store.feature('creative-alley')).toBe('cleared');
    expect(store.progress().featured).toBe(0);
  });

  it('손상 저장본의 중복·미등록 권역과 잠긴 대표 전시를 정리한다', () => {
    expect(normalizeNeighborhoodDistrictState({
      version: 99,
      discoveredIds: ['cafe-lane', 'missing', 'cafe-lane', 'outer-forest'],
      featuredId: 'creative-alley',
    })).toEqual({
      version: 1,
      discoveredIds: ['cafe-lane', 'outer-forest'],
      featuredId: null,
    });
  });

  it('권역 여권 퀘스트 지표를 지도 길 안내로 연결한다', () => {
    expect(villageRequestDestinationForMetric('districts_discovered')).toBe('map');
    expect(villageRequestDestinationForMetric('district_passport_featured')).toBe('map');
    expect(villageRequestDestinationForMetric('safe_districts_discovered')).toBe('map');
  });
});
