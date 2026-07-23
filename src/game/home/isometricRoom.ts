import { TILE } from '../config';
import type { Placed } from '../entities/placement';
import { sizeOf } from '../entities/placement';
import type { FloorPlan } from '../realestate/realEstate';
import {
  ISO_METRICS,
  pickIsoTile,
  projectFootprint,
  projectIso,
  projectIsoWorld,
  type IsoOrigin,
  type IsoPoint,
} from '../world/isometric';
import { furniturePlacementMeta } from './furniturePlacementMeta';

export const ROOM_ISO_WALL_HEIGHT = 56;
export const ROOM_ISO_WORLD_DEPTH = 1_000;
export const ROOM_ISO_OVERLAY_DEPTH = 4_000;

export interface IsometricRoomLayout {
  width: number;
  height: number;
  origin: IsoOrigin;
}

/**
 * 주택 크기와 무관하게 북·서 벽, 바닥, 남쪽 출구 여백이 모두 캔버스 안에 들어오는
 * 결정적 레이아웃. 저장 좌표는 그대로 두고 화면 투영에만 사용한다.
 */
export function isometricRoomLayout(plan: Pick<FloorPlan, 'w' | 'h'>): IsometricRoomLayout {
  const width = (plan.w + plan.h + 4) * (ISO_METRICS.tileWidth / 2);
  const origin = {
    x: (plan.h + 2) * (ISO_METRICS.tileWidth / 2),
    y: ROOM_ISO_WALL_HEIGHT + 38,
  };
  return {
    width,
    height: Math.ceil(origin.y + (plan.w + plan.h) * (ISO_METRICS.tileHeight / 2) + 72),
    origin,
  };
}

export function projectRoomTile(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  tx: number,
  ty: number,
  elevation = 0,
): IsoPoint {
  return projectIso(tx, ty, elevation, isometricRoomLayout(plan).origin);
}

export function projectRoomWorld(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  worldX: number,
  worldY: number,
  elevation = 0,
): IsoPoint {
  return projectIsoWorld(worldX, worldY, elevation, isometricRoomLayout(plan).origin);
}

export function pickRoomTile(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  sceneX: number,
  sceneY: number,
): { tx: number; ty: number } {
  return pickIsoTile(sceneX, sceneY, 0, isometricRoomLayout(plan).origin);
}

export function projectRoomFootprint(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  placed: Pick<Placed, 'tx' | 'ty' | 'itemId' | 'rot'>,
): [IsoPoint, IsoPoint, IsoPoint, IsoPoint] | null {
  const size = sizeOf(placed.itemId, placed.rot);
  if (!size) return null;
  const elevation = furniturePlacementMeta(placed.itemId)?.surface === 'wall' ? 2.3 : 0;
  return projectFootprint(
    { tx: placed.tx, ty: placed.ty, w: size.w, h: size.h },
    elevation,
    isometricRoomLayout(plan).origin,
  );
}

export interface IsometricFurniturePose {
  x: number;
  baselineY: number;
  depth: number;
  shadowX: number;
  shadowY: number;
  shadowW: number;
}

/**
 * 가구 텍스처는 점유 다이아몬드의 중앙 남쪽 기준선에 세운다. 기존 0~3 회전과
 * 배치 좌표는 바꾸지 않으며 wall/rug/floor 레이어만 depth로 분리한다.
 */
export function isometricFurniturePose(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  placed: Pick<Placed, 'tx' | 'ty' | 'itemId' | 'rot'>,
): IsometricFurniturePose | null {
  const size = sizeOf(placed.itemId, placed.rot);
  const meta = furniturePlacementMeta(placed.itemId);
  if (!size || !meta) return null;
  const elevation = meta.surface === 'wall' ? 2.3 : 0;
  const center = projectRoomTile(
    plan,
    placed.tx + size.w / 2,
    meta.surface === 'wall' ? placed.ty + 0.35 : placed.ty + size.h / 2,
    elevation,
  );
  const baselineY = center.y + (meta.surface === 'wall' ? 5 : ISO_METRICS.tileHeight / 4);
  const depthBand = meta.surface === 'rug' ? 100 : meta.surface === 'wall' ? 620 : ROOM_ISO_WORLD_DEPTH;
  return {
    x: center.x,
    baselineY,
    depth: depthBand + baselineY,
    shadowX: center.x,
    shadowY: center.y + ISO_METRICS.tileHeight / 4,
    shadowW: Math.max(18, (size.w + size.h) * (ISO_METRICS.tileWidth / 4)),
  };
}

export function isometricActorPose(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  worldX: number,
  worldY: number,
): { x: number; y: number; depth: number } {
  const point = projectRoomWorld(plan, worldX, worldY);
  return { ...point, depth: ROOM_ISO_WORLD_DEPTH + point.y };
}

/** screenToTile과 같은 Phaser 기본 카메라 보정을 적용한 뒤 아이소메트릭으로 역투영한다. */
export function screenToRoomTile(
  plan: Pick<FloorPlan, 'w' | 'h'>,
  screenX: number,
  screenY: number,
  camera: { scrollX: number; scrollY: number; zoom: number; width: number; height: number },
): { tx: number; ty: number } {
  const sceneX = camera.scrollX + (camera.width / 2) * (1 - 1 / camera.zoom) + screenX / camera.zoom;
  const sceneY = camera.scrollY + (camera.height / 2) * (1 - 1 / camera.zoom) + screenY / camera.zoom;
  return pickRoomTile(plan, sceneX, sceneY);
}

export function roomLogicalTileCenter(tx: number, ty: number): IsoPoint {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}
