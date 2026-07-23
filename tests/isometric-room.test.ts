import { describe, expect, it } from 'vitest';
import {
  ROOM_ISO_WORLD_DEPTH,
  isometricActorPose,
  isometricFurniturePose,
  isometricRoomLayout,
  pickRoomTile,
  projectRoomFootprint,
  projectRoomTile,
  projectRoomWorld,
  roomLogicalTileCenter,
  screenToRoomTile,
} from '../src/game/home/isometricRoom';
import { generateFloorPlan, HOUSE_SPECS, type HouseType } from '../src/game/realestate/realEstate';

const HOUSE_TYPES = Object.keys(HOUSE_SPECS) as HouseType[];

describe('아이소메트릭 오픈월 실내', () => {
  it('모든 주택의 바닥·벽 여백이 결정적 캔버스 안에 들어간다', () => {
    for (const type of HOUSE_TYPES) {
      const plan = generateFloorPlan(type, 17);
      const layout = isometricRoomLayout(plan);
      expect(isometricRoomLayout(plan)).toEqual(layout);
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
      for (const [tx, ty] of [[0, 0], [plan.w, 0], [plan.w, plan.h], [0, plan.h]]) {
        const point = projectRoomTile(plan, tx!, ty!);
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(layout.width);
        expect(point.y).toBeGreaterThanOrEqual(56);
        expect(point.y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it('투영한 타일 중앙을 다시 같은 저장 타일로 고른다', () => {
    const plan = generateFloorPlan('apt', 21);
    for (const tile of [{ tx: 1, ty: 1 }, { tx: 5, ty: 4 }, { tx: 10, ty: 8 }]) {
      const point = projectRoomTile(plan, tile.tx + .5, tile.ty + .5);
      expect(pickRoomTile(plan, point.x, point.y)).toEqual(tile);
    }
  });

  it('카메라 줌과 스크롤을 거친 포인터도 같은 배치 타일을 선택한다', () => {
    const plan = generateFloorPlan('villa', 3);
    const target = projectRoomTile(plan, 4.5, 3.5);
    const camera = { scrollX: 40, scrollY: 20, zoom: 1.25, width: 1000, height: 700 };
    const screenX = (target.x - camera.scrollX - (camera.width / 2) * (1 - 1 / camera.zoom)) * camera.zoom;
    const screenY = (target.y - camera.scrollY - (camera.height / 2) * (1 - 1 / camera.zoom)) * camera.zoom;
    expect(screenToRoomTile(plan, screenX, screenY, camera)).toEqual({ tx: 4, ty: 3 });
  });

  it('논리 32px 이동은 화면 다이아몬드 축으로 투영된다', () => {
    const plan = generateFloorPlan('oneroom', 4);
    const center = roomLogicalTileCenter(2, 2);
    const base = projectRoomWorld(plan, center.x, center.y);
    const east = projectRoomWorld(plan, center.x + 32, center.y);
    const south = projectRoomWorld(plan, center.x, center.y + 32);
    expect(east.x - base.x).toBe(32);
    expect(east.y - base.y).toBe(16);
    expect(south.x - base.x).toBe(-32);
    expect(south.y - base.y).toBe(16);
  });

  it('가구 풋프린트·러그·벽장식·캐릭터가 같은 남쪽 depth 규칙을 쓴다', () => {
    const plan = generateFloorPlan('oneroom', 9);
    const north = isometricFurniturePose(plan, { itemId: 'bed_basic', tx: 1, ty: 1, rot: 0 })!;
    const south = isometricFurniturePose(plan, { itemId: 'bed_basic', tx: 1, ty: 3, rot: 0 })!;
    const rug = isometricFurniturePose(plan, { itemId: 'rug_cream', tx: 1, ty: 3, rot: 0 })!;
    const wall = isometricFurniturePose(plan, { itemId: 'poster_band', tx: 2, ty: 1, rot: 0 })!;
    expect(south.depth).toBeGreaterThan(north.depth);
    expect(rug.depth).toBeLessThan(north.depth);
    expect(wall.depth).toBeLessThan(north.depth);
    expect(projectRoomFootprint(plan, { itemId: 'bed_basic', tx: 1, ty: 1, rot: 0 })).toHaveLength(4);

    const a = isometricActorPose(plan, 2 * 32, 2 * 32);
    const b = isometricActorPose(plan, 2 * 32, 4 * 32);
    expect(a.depth).toBe(ROOM_ISO_WORLD_DEPTH + a.y);
    expect(b.depth).toBeGreaterThan(a.depth);
  });

  it('가구 회전은 저장값을 바꾸지 않고 투영 풋프린트만 교환한다', () => {
    const plan = generateFloorPlan('villa', 14);
    const north = projectRoomFootprint(plan, { itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 })!;
    const east = projectRoomFootprint(plan, { itemId: 'bed_basic', tx: 2, ty: 2, rot: 1 })!;
    expect(north).not.toEqual(east);
    expect(north[0]).toEqual(east[0]);
  });
});
