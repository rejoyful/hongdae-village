export interface TilePoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface WorldMetrics {
  centerX: number;
  centerY: number;
  tileWidth: number;
  tileHeight: number;
  radius: number;
}

export const WORLD_RADIUS = 8;

export function getWorldMetrics(width: number, height: number): WorldMetrics {
  const tileWidth = Math.max(48, Math.min(72, width / 7));

  return {
    centerX: width / 2,
    centerY: height * (width < 700 ? 0.48 : 0.46),
    tileWidth,
    tileHeight: tileWidth / 2,
    radius: WORLD_RADIUS,
  };
}

export function projectIsometric(
  tile: TilePoint,
  metrics: WorldMetrics,
): ScreenPoint {
  return {
    x: metrics.centerX + (tile.x - tile.y) * (metrics.tileWidth / 2),
    y: metrics.centerY + (tile.x + tile.y) * (metrics.tileHeight / 2),
  };
}

export function unprojectIsometric(
  screen: ScreenPoint,
  metrics: WorldMetrics,
): TilePoint {
  const dx = screen.x - metrics.centerX;
  const dy = screen.y - metrics.centerY;
  const horizontal = dx / (metrics.tileWidth / 2);
  const vertical = dy / (metrics.tileHeight / 2);

  return {
    x: Math.round((horizontal + vertical) / 2),
    y: Math.round((vertical - horizontal) / 2),
  };
}

export function clampTile(
  tile: TilePoint,
  radius = WORLD_RADIUS,
): TilePoint {
  return {
    x: Math.max(-radius, Math.min(radius, tile.x)),
    y: Math.max(-radius, Math.min(radius, tile.y)),
  };
}
