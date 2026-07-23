import { TILE } from '../config';
import type { MoveInput } from '../entities/playerMotion';

/**
 * 아이소메트릭 화면 규격.
 *
 * 게임 규칙·충돌·네트워크는 기존 직교 논리 좌표를 유지하고, 렌더링 경계에서만
 * 2:1 다이아몬드 좌표로 투영한다. 이 계약 덕분에 기존 콘텐츠를 단계적으로 전환할 수 있다.
 */
export interface IsoMetrics {
  tileWidth: number;
  tileHeight: number;
  elevationHeight: number;
  logicalTileSize: number;
}

export interface IsoOrigin { x: number; y: number }
export interface IsoPoint { x: number; y: number }
export interface IsoTilePoint { tx: number; ty: number }
export interface IsoFootprint { tx: number; ty: number; w: number; h: number }

export const ISO_METRICS: Readonly<IsoMetrics> = {
  tileWidth: 64,
  tileHeight: 32,
  elevationHeight: 16,
  logicalTileSize: TILE,
};

export const ISO_ORIGIN: Readonly<IsoOrigin> = { x: 0, y: 0 };

/** 타일 좌표의 격자 교차점을 화면 좌표로 투영한다. elevation은 타일 높이 단위다. */
export function projectIso(
  tx: number,
  ty: number,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): IsoPoint {
  return {
    x: origin.x + (tx - ty) * (metrics.tileWidth / 2),
    y: origin.y + (tx + ty) * (metrics.tileHeight / 2) - elevation * metrics.elevationHeight,
  };
}

/** 화면 좌표를 소수 타일 좌표로 역투영한다. */
export function unprojectIso(
  x: number,
  y: number,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): IsoTilePoint {
  const diagonalX = (x - origin.x) / (metrics.tileWidth / 2);
  const diagonalY = (y - origin.y + elevation * metrics.elevationHeight) / (metrics.tileHeight / 2);
  return {
    tx: (diagonalX + diagonalY) / 2,
    ty: (diagonalY - diagonalX) / 2,
  };
}

/** 기존 월드 픽셀 좌표를 아이소메트릭 화면 좌표로 변환한다. */
export function projectIsoWorld(
  worldX: number,
  worldY: number,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): IsoPoint {
  return projectIso(
    worldX / metrics.logicalTileSize,
    worldY / metrics.logicalTileSize,
    elevation,
    origin,
    metrics,
  );
}

/** 아이소메트릭 화면 좌표를 기존 월드 픽셀 좌표로 복원한다. */
export function unprojectIsoWorld(
  x: number,
  y: number,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): IsoPoint {
  const tile = unprojectIso(x, y, elevation, origin, metrics);
  return {
    x: tile.tx * metrics.logicalTileSize,
    y: tile.ty * metrics.logicalTileSize,
  };
}

/** 화면 지점이 속한 논리 타일. 클릭·가구 배치의 공용 진입점으로 사용한다. */
export function pickIsoTile(
  x: number,
  y: number,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): { tx: number; ty: number } {
  const p = unprojectIso(x, y, elevation, origin, metrics);
  return { tx: Math.floor(p.tx), ty: Math.floor(p.ty) };
}

/** 사각 타일 풋프린트를 화면의 다이아몬드 다각형으로 변환한다. */
export function projectFootprint(
  footprint: IsoFootprint,
  elevation = 0,
  origin: IsoOrigin = ISO_ORIGIN,
  metrics: IsoMetrics = ISO_METRICS,
): [IsoPoint, IsoPoint, IsoPoint, IsoPoint] {
  const { tx, ty, w, h } = footprint;
  return [
    projectIso(tx, ty, elevation, origin, metrics),
    projectIso(tx + w, ty, elevation, origin, metrics),
    projectIso(tx + w, ty + h, elevation, origin, metrics),
    projectIso(tx, ty + h, elevation, origin, metrics),
  ];
}

/**
 * 오브젝트 base의 화면 y를 기준으로 한 안정적인 depth.
 * footprint가 큰 가구·건물은 가장 남쪽 모서리 뒤에 정렬되며 layer로 미세 조정한다.
 */
export function isoDepth(footprint: IsoFootprint, layer = 0): number {
  const base = footprint.tx + footprint.w + footprint.ty + footprint.h;
  return base * 1000 + footprint.tx * 0.01 + layer;
}

/**
 * 화면 기준 WASD를 논리 격자 이동으로 회전한다.
 * W/S는 화면 위·아래, A/D는 화면 좌·우로 보이지만 충돌은 기존 축 정렬 격자를 사용한다.
 */
export function screenInputToWorld(input: MoveInput): MoveInput {
  const sx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const sy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const wx = sx + sy;
  const wy = sy - sx;
  return {
    up: wy < 0,
    down: wy > 0,
    left: wx < 0,
    right: wx > 0,
  };
}
