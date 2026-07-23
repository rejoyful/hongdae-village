import { describe, expect, it } from 'vitest';
import {
  ISO_METRICS,
  isoDepth,
  pickIsoTile,
  projectFootprint,
  projectIso,
  projectIsoWorld,
  screenInputToWorld,
  unprojectIso,
  unprojectIsoWorld,
} from '../src/game/world/isometric';
import {
  ISO_VILLAGE_ACTIVITIES,
  ISO_VILLAGE_BUILDINGS,
  ISO_VILLAGE_H,
  ISO_HUNT_ZONES,
  ISO_VILLAGE_PROPS,
  ISO_VILLAGE_TREES,
  ISO_RESIDENT_PLACEMENTS,
  ISO_VILLAGE_SPAWN,
  ISO_VILLAGE_W,
  ISO_WELCOME_ROUTE,
  activityAt,
  buildIsoVillageCollision,
  huntZoneAt,
  huntZoneAtWorld,
  isIsoVillageWorldPosition,
} from '../src/game/world/isometricVillageMap';
import { RESIDENTS } from '../src/game/residents/residents';
import { ISOMETRIC_BUILDING_TEXTURES, ISOMETRIC_MONSTER_TEXTURES, ISOMETRIC_PROP_TEXTURES, ISOMETRIC_TREE_TEXTURES, isometricMonsterScale, isometricPropAsset, isometricTreeAsset } from '../src/game/art/assetManifest';
import { MONSTER_MAP } from '../src/game/battle/monsters';
import { isoTerrainHash } from '../src/game/world/isometricTerrain';

describe('아이소메트릭 좌표', () => {
  it('64×32 2:1 다이아몬드로 투영한다', () => {
    expect(projectIso(1, 0)).toEqual({ x: 32, y: 16 });
    expect(projectIso(0, 1)).toEqual({ x: -32, y: 16 });
    expect(projectIso(2, 2)).toEqual({ x: 0, y: 64 });
  });

  it('투영과 역투영은 소수 좌표에서도 왕복된다', () => {
    const source = { tx: 3.25, ty: 7.75 };
    const screen = projectIso(source.tx, source.ty, 1.5, { x: 120, y: 40 });
    const restored = unprojectIso(screen.x, screen.y, 1.5, { x: 120, y: 40 });
    expect(restored.tx).toBeCloseTo(source.tx);
    expect(restored.ty).toBeCloseTo(source.ty);
  });

  it('기존 32px 월드 좌표를 손실 없이 왕복한다', () => {
    const screen = projectIsoWorld(320, 176, 0, { x: 400, y: 80 });
    const restored = unprojectIsoWorld(screen.x, screen.y, 0, { x: 400, y: 80 });
    expect(restored.x).toBeCloseTo(320);
    expect(restored.y).toBeCloseTo(176);
    expect(ISO_METRICS.logicalTileSize).toBe(32);
  });

  it('타일 중앙을 클릭하면 원래 논리 타일을 고른다', () => {
    const center = projectIso(5.5, 8.5);
    expect(pickIsoTile(center.x, center.y)).toEqual({ tx: 5, ty: 8 });
  });
});

describe('아이소메트릭 공간 정렬', () => {
  it('다중 타일 풋프린트의 네 모서리를 투영한다', () => {
    expect(projectFootprint({ tx: 1, ty: 2, w: 2, h: 1 })).toEqual([
      projectIso(1, 2), projectIso(3, 2), projectIso(3, 3), projectIso(1, 3),
    ]);
  });

  it('남쪽에 있는 오브젝트가 더 높은 depth를 가진다', () => {
    expect(isoDepth({ tx: 4, ty: 6, w: 1, h: 1 }))
      .toBeGreaterThan(isoDepth({ tx: 4, ty: 2, w: 1, h: 1 }));
  });

  it('큰 가구는 풋프린트의 가장 먼 모서리로 정렬한다', () => {
    expect(isoDepth({ tx: 2, ty: 2, w: 3, h: 2 }))
      .toBeGreaterThan(isoDepth({ tx: 2, ty: 2, w: 1, h: 1 }));
  });
});

describe('아이소메트릭 입력', () => {
  const idle = { up: false, down: false, left: false, right: false };

  it('화면 위 W를 논리 북서 방향으로 회전한다', () => {
    expect(screenInputToWorld({ ...idle, up: true }))
      .toEqual({ up: true, down: false, left: true, right: false });
  });

  it('W+D 조합은 화면 위 대각 입력이 아니라 논리 북쪽이 된다', () => {
    expect(screenInputToWorld({ ...idle, up: true, right: true }))
      .toEqual({ up: true, down: false, left: false, right: false });
  });
});

describe('아이소메트릭 메인 월드 데이터', () => {
  it('지형 미세 재질 해시는 실행 순서와 무관하게 결정적이다', () => {
    expect(isoTerrainHash(12, 9)).toBe(isoTerrainHash(12, 9));
    expect(isoTerrainHash(12, 9)).not.toBe(isoTerrainHash(13, 9));
    expect(isoTerrainHash(12, 9, 1)).not.toBe(isoTerrainHash(12, 9, 2));
  });

  it('초행자 금빛 길은 스폰 앞에서 시작해 모험 일지까지 끊김 없이 이어진다', () => {
    const grid = buildIsoVillageCollision();
    const questBoard = ISO_VILLAGE_ACTIVITIES.find((spot) => spot.id === 'quest-board')!;
    expect(ISO_WELCOME_ROUTE[0]).toEqual({ tx: ISO_VILLAGE_SPAWN.tx, ty: ISO_VILLAGE_SPAWN.ty - 1 });
    expect(ISO_WELCOME_ROUTE.at(-1)).toEqual({ tx: questBoard.tx, ty: questBoard.ty });
    ISO_WELCOME_ROUTE.forEach((step, index) => {
      expect(grid.isSolid(step.tx, step.ty), `${step.tx},${step.ty}`).toBe(false);
      if (index === 0) return;
      const previous = ISO_WELCOME_ROUTE[index - 1]!;
      expect(Math.abs(step.tx - previous.tx) + Math.abs(step.ty - previous.ty)).toBe(1);
    });
  });
  it('Realtime 월드 좌표는 유한한 맵 내부 값만 허용한다', () => {
    expect(isIsoVillageWorldPosition(16, 16)).toBe(true);
    expect(isIsoVillageWorldPosition(34 * 32 - 1, 24 * 32 - 1)).toBe(true);
    expect(isIsoVillageWorldPosition(-1, 16)).toBe(false);
    expect(isIsoVillageWorldPosition(34 * 32, 16)).toBe(false);
    expect(isIsoVillageWorldPosition(Number.NaN, 16)).toBe(false);
  });
  it('스폰과 모든 활동 타일은 걷기 가능하며 좌표가 겹치지 않는다', () => {
    const grid = buildIsoVillageCollision();
    expect(grid.isSolid(ISO_VILLAGE_SPAWN.tx, ISO_VILLAGE_SPAWN.ty)).toBe(false);
    const cells = new Set<string>();
    for (const spot of ISO_VILLAGE_ACTIVITIES) {
      expect(grid.isSolid(spot.tx, spot.ty), spot.id).toBe(false);
      const key = `${spot.tx},${spot.ty}`;
      expect(cells.has(key), key).toBe(false);
      cells.add(key);
      expect(activityAt(spot.tx, spot.ty)?.id).toBe(spot.id);
    }
  });

  it('주민 10명은 실제 로스터와 일치하고 활동을 막지 않는 고유 타일에 선다', () => {
    const grid = buildIsoVillageCollision();
    const residentIds = new Set(RESIDENTS.map((resident) => resident.id));
    const activityCells = new Set(ISO_VILLAGE_ACTIVITIES.map((spot) => `${spot.tx},${spot.ty}`));
    const occupied = new Set<string>();
    expect(ISO_RESIDENT_PLACEMENTS).toHaveLength(RESIDENTS.length);
    for (const resident of ISO_RESIDENT_PLACEMENTS) {
      const cell = `${resident.tx},${resident.ty}`;
      expect(residentIds.has(resident.residentId), resident.residentId).toBe(true);
      expect(grid.isSolid(resident.tx, resident.ty), cell).toBe(false);
      expect(activityCells.has(cell), cell).toBe(false);
      expect(occupied.has(cell), cell).toBe(false);
      occupied.add(cell);
    }
  });

  it('거리 소품은 길 안내 타일과 겹치지 않고 모든 종류가 실제 통행 가능한 곳에 있다', () => {
    const grid = buildIsoVillageCollision();
    const blockedGuideCells = new Set([
      ...ISO_VILLAGE_ACTIVITIES.map((spot) => `${spot.tx},${spot.ty}`),
      ...ISO_RESIDENT_PLACEMENTS.map((resident) => `${resident.tx},${resident.ty}`),
    ]);
    const occupied = new Set<string>();
    const kinds = new Set<string>();
    for (const prop of ISO_VILLAGE_PROPS) {
      const cell = `${prop.tx},${prop.ty}`;
      expect(grid.isSolid(prop.tx, prop.ty), prop.id).toBe(false);
      expect(blockedGuideCells.has(cell), prop.id).toBe(false);
      expect(occupied.has(cell), prop.id).toBe(false);
      occupied.add(cell); kinds.add(prop.kind);
    }
    expect(kinds.size).toBe(14);
    expect(kinds.has('weatherstation')).toBe(true);
    expect(isometricPropAsset('workbench')).toMatchObject({ key: 'iso-diy-workbench-v1', scale: 0.72 });
    expect(isometricPropAsset('showcase')).toMatchObject({ key: 'iso-taste-showcase-v1', scale: 0.78 });
    expect(isometricPropAsset('clubboard')).toMatchObject({ key: 'iso-hobby-club-board-v1', scale: 0.78 });
    expect(isometricPropAsset('guidekiosk')).toMatchObject({ key: 'iso-neighborhood-guide-kiosk-v1', scale: 0.82 });
    expect(isometricPropAsset('finderkiosk')).toMatchObject({ key: 'iso-village-finder-kiosk-v1', scale: 0.78 });
    expect(isometricPropAsset('museumcabinet')).toMatchObject({ key: 'iso-neighborhood-museum-cabinet-v1', scale: 0.86 });
    expect(isometricPropAsset('projectboard')).toMatchObject({ key: 'iso-community-project-pavilion-v1', scale: 0.82 });
    expect(ISOMETRIC_PROP_TEXTURES).toHaveLength(7);
  });

  it('대표 건물 자산은 manifest와 footprint 데이터가 함께 있어 폴백 계약을 지킨다', () => {
    const keys = new Set(ISOMETRIC_BUILDING_TEXTURES.map((asset) => asset.key));
    const authored = ISO_VILLAGE_BUILDINGS.filter((building) => building.artKey);
    expect(authored.map((building) => building.id)).toEqual(['home', 'cafe', 'atelier', 'petshop', 'studio', 'record']);
    expect(keys.size).toBe(authored.length);
    for (const building of authored) {
      expect(keys.has(building.artKey!), building.id).toBe(true);
      expect(building.artScale, building.id).toBeGreaterThan(0.1);
      expect(building.artScale, building.id).toBeLessThan(0.5);
    }
  });

  it('1티어 생성형 몬스터는 기존 mon- 키와 종 데이터를 공유해 절차형 폴백을 유지한다', () => {
    const tierOneIds = [...MONSTER_MAP.values()].filter((monster) => monster.tier === 1).map((monster) => monster.id);
    expect(ISOMETRIC_MONSTER_TEXTURES.map((asset) => asset.speciesId)).toEqual(tierOneIds);
    expect(new Set(ISOMETRIC_MONSTER_TEXTURES.map((asset) => asset.key)).size).toBe(tierOneIds.length);
    expect(new Set(ISOMETRIC_MONSTER_TEXTURES.map((asset) => asset.url)).size).toBe(tierOneIds.length);
    for (const asset of ISOMETRIC_MONSTER_TEXTURES) {
      expect(asset.key).toBe(`mon-${asset.speciesId}`);
      expect(MONSTER_MAP.has(asset.speciesId)).toBe(true);
      expect(asset.scale).toBeGreaterThanOrEqual(0.4);
      expect(asset.scale).toBeLessThanOrEqual(1.2);
      expect(isometricMonsterScale(asset.speciesId)).toBe(asset.scale);
    }
    expect(isometricMonsterScale('procedural-fallback')).toBe(1.5);
  });

  it('가로수 배치는 세 생성형 변형을 모두 사용하며 월드 안에서 고유하다', () => {
    const ids = new Set<string>();
    const cells = new Set<string>();
    const variants = new Set(ISOMETRIC_TREE_TEXTURES.map((asset) => asset.variant));
    expect(variants).toEqual(new Set(['zelkova', 'ginkgo', 'redpine']));
    for (const tree of ISO_VILLAGE_TREES) {
      const cell = `${tree.tx},${tree.ty}`;
      expect(ids.has(tree.id), tree.id).toBe(false);
      expect(cells.has(cell), cell).toBe(false);
      expect(tree.tx).toBeGreaterThanOrEqual(1);
      expect(tree.ty).toBeGreaterThanOrEqual(1);
      expect(tree.tx).toBeLessThan(ISO_VILLAGE_W - 1);
      expect(tree.ty).toBeLessThan(ISO_VILLAGE_H - 1);
      expect(variants.has(tree.variant), tree.variant).toBe(true);
      expect(isometricTreeAsset(tree.variant)?.key).toBe(`iso-tree-${tree.variant}-v1`);
      ids.add(tree.id); cells.add(cell);
    }
  });

  it('동쪽 외곽숲은 생활권 건물과 겹치지 않고 연결도로를 사이에 둔 선택형 전투 구역이다', () => {
    expect(ISO_HUNT_ZONES).toHaveLength(2);
    for (const zone of ISO_HUNT_ZONES) {
      expect(zone.tx).toBeGreaterThanOrEqual(28);
      expect(zone.tx + zone.w).toBeLessThan(ISO_VILLAGE_W);
      expect(zone.ty).toBeGreaterThanOrEqual(1);
      expect(zone.ty + zone.h).toBeLessThan(ISO_VILLAGE_H);
      expect(huntZoneAt(zone.tx, zone.ty)?.id).toBe(zone.id);
      expect(huntZoneAtWorld((zone.tx + 0.5) * 32, (zone.ty + 0.5) * 32)?.id).toBe(zone.id);
      for (const building of ISO_VILLAGE_BUILDINGS) {
        const overlaps = zone.tx < building.tx + building.w && zone.tx + zone.w > building.tx
          && zone.ty < building.ty + building.h && zone.ty + zone.h > building.ty;
        expect(overlaps, `${zone.id}/${building.id}`).toBe(false);
      }
    }
    expect(huntZoneAt(30, 11)).toBeNull();
  });

  it('모든 활동 지점은 스폰에서 충돌 없이 도달 가능하다', () => {
    const grid = buildIsoVillageCollision();
    const queue: Array<{ tx: number; ty: number }> = [{ ...ISO_VILLAGE_SPAWN }];
    const directions: Array<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const visited = new Set([`${ISO_VILLAGE_SPAWN.tx},${ISO_VILLAGE_SPAWN.ty}`]);
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i]!;
      for (const [dx, dy] of directions) {
        const tx = current.tx + dx, ty = current.ty + dy, key = `${tx},${ty}`;
        if (!visited.has(key) && !grid.isSolid(tx, ty)) { visited.add(key); queue.push({ tx, ty }); }
      }
    }
    for (const spot of ISO_VILLAGE_ACTIVITIES) expect(visited.has(`${spot.tx},${spot.ty}`), spot.id).toBe(true);
    for (const resident of ISO_RESIDENT_PLACEMENTS) expect(visited.has(`${resident.tx},${resident.ty}`), resident.residentId).toBe(true);
  });

  it('건물 풋프린트는 맵 안에 있고 충돌 영역으로 등록된다', () => {
    const grid = buildIsoVillageCollision();
    for (const building of ISO_VILLAGE_BUILDINGS) {
      expect(building.tx).toBeGreaterThanOrEqual(1);
      expect(building.ty).toBeGreaterThanOrEqual(1);
      expect(building.tx + building.w).toBeLessThan(ISO_VILLAGE_W);
      expect(building.ty + building.h).toBeLessThan(ISO_VILLAGE_H);
      expect(grid.isSolid(building.tx, building.ty), building.id).toBe(true);
    }
  });
});
