import Phaser from 'phaser';
import { projectFootprint, projectIso } from '../world/isometric';
import { isoTerrainHash, type IsoTerrain } from '../world/isometricTerrain';

export type { IsoTerrain } from '../world/isometricTerrain';

interface TerrainMaterial {
  base: number;
  alternate: number;
  rim: number;
  detail: number;
  highlight: number;
}

const MATERIALS: Record<IsoTerrain, TerrainMaterial> = {
  grass: { base: 0x71875d, alternate: 0x768d61, rim: 0x526a47, detail: 0x526f48, highlight: 0x9bae7a },
  alley: { base: 0x82776b, alternate: 0x887c70, rim: 0x5e574f, detail: 0x625b54, highlight: 0xa99a86 },
  road: { base: 0x56534f, alternate: 0x5b5854, rim: 0x403e3b, detail: 0x454340, highlight: 0x77716a },
  plaza: { base: 0x968878, alternate: 0x9d8f7e, rim: 0x716558, detail: 0x776b5f, highlight: 0xc0ad92 },
  wild: { base: 0x4e6848, alternate: 0x536e4c, rim: 0x385039, detail: 0x71865d, highlight: 0x91a873 },
};

type Point = { x: number; y: number };

const phaserPoints = (points: Point[]): Phaser.Geom.Point[] => points.map(
  (point) => new Phaser.Geom.Point(Math.round(point.x), Math.round(point.y)),
);

const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const inset = (corners: Point[], amount: number): Point[] => {
  const center = corners.reduce((sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }), { x: 0, y: 0 });
  return corners.map((corner) => lerp(corner, center, amount));
};

function drawPaving(
  graphics: Phaser.GameObjects.Graphics,
  corners: Point[],
  material: TerrainMaterial,
  density: 2 | 3,
): void {
  graphics.lineStyle(1, material.detail, 0.34);
  for (let index = 1; index < density; index++) {
    const t = index / density;
    const horizontalStart = lerp(corners[0]!, corners[3]!, t);
    const horizontalEnd = lerp(corners[1]!, corners[2]!, t);
    const verticalStart = lerp(corners[0]!, corners[1]!, t);
    const verticalEnd = lerp(corners[3]!, corners[2]!, t);
    graphics.lineBetween(horizontalStart.x, horizontalStart.y, horizontalEnd.x, horizontalEnd.y);
    graphics.lineBetween(verticalStart.x, verticalStart.y, verticalEnd.x, verticalEnd.y);
  }
}

function drawTerrainDetails(
  graphics: Phaser.GameObjects.Graphics,
  terrain: IsoTerrain,
  tx: number,
  ty: number,
  corners: Point[],
  material: TerrainMaterial,
): void {
  const center = projectIso(tx + 0.5, ty + 0.5);
  const hash = isoTerrainHash(tx, ty);
  if (terrain === 'plaza') {
    drawPaving(graphics, corners, material, 3);
    if (hash % 3 === 0) graphics.fillStyle(material.highlight, 0.45).fillRect(center.x - 2, center.y, 4, 2);
    return;
  }
  if (terrain === 'alley') {
    drawPaving(graphics, corners, material, 2);
    if (hash % 4 === 0) {
      graphics.lineStyle(1, material.detail, 0.66)
        .lineBetween(center.x - 8, center.y + 1, center.x - 3, center.y + 3)
        .lineBetween(center.x - 3, center.y + 3, center.x + 2, center.y + 1);
    }
    if (hash % 13 === 0) graphics.fillStyle(0x4e5960, 0.55).fillRect(center.x + 7, center.y - 1, 7, 3);
    return;
  }
  if (terrain === 'road') {
    if (hash % 3 === 0) graphics.fillStyle(material.highlight, 0.18).fillRect(center.x - 9, center.y - 2, 13, 2);
    if (hash % 7 === 0) {
      graphics.lineStyle(1, material.detail, 0.72)
        .lineBetween(center.x - 7, center.y + 2, center.x - 1, center.y)
        .lineBetween(center.x - 1, center.y, center.x + 3, center.y + 2);
    }
    if (hash % 17 === 0) graphics.fillStyle(0x30383b, 0.7).fillRect(center.x + 9, center.y - 2, 8, 3);
    return;
  }

  const rich = terrain === 'wild';
  const clusterCount = rich ? 2 + (hash % 2) : 1;
  for (let index = 0; index < clusterCount; index++) {
    const detailHash = isoTerrainHash(tx, ty, index + 11);
    const x = center.x - 11 + (detailHash % 22);
    const y = center.y - 2 + ((detailHash >>> 6) % 6);
    graphics.fillStyle(index % 2 ? material.highlight : material.detail, rich ? 0.9 : 0.72)
      .fillRect(x, y, 2, rich ? 5 : 4)
      .fillRect(x + 3, y + 1, 2, rich ? 4 : 3);
    if (rich && detailHash % 5 === 0) {
      graphics.fillStyle(detailHash % 2 ? 0xc59aed : 0xe7c276, 0.9).fillRect(x + 1, y - 1, 2, 2);
    }
  }
}

function drawRoadCurbs(
  graphics: Phaser.GameObjects.Graphics,
  tx: number,
  ty: number,
  width: number,
  height: number,
  terrainAt: (tx: number, ty: number) => IsoTerrain,
  corners: Point[],
): void {
  const neighbors: Array<{ tx: number; ty: number; edge: readonly [number, number] }> = [
    { tx, ty: ty - 1, edge: [0, 1] },
    { tx: tx + 1, ty, edge: [1, 2] },
    { tx, ty: ty + 1, edge: [2, 3] },
    { tx: tx - 1, ty, edge: [3, 0] },
  ];
  for (const neighbor of neighbors) {
    const outside = neighbor.tx < 0 || neighbor.ty < 0 || neighbor.tx >= width || neighbor.ty >= height;
    if (!outside && terrainAt(neighbor.tx, neighbor.ty) === 'road') continue;
    const [startIndex, endIndex] = neighbor.edge;
    const start = corners[startIndex]!, end = corners[endIndex]!;
    graphics.lineStyle(3, 0x373431, 0.72).lineBetween(start.x, start.y + 1, end.x, end.y + 1);
    graphics.lineStyle(1, 0xb5a995, 0.92).lineBetween(start.x, start.y - 1, end.x, end.y - 1);
  }
}

/** 이음새가 정확한 결정적 픽셀 재질과 도로 커브를 한 레이어에 그린다. */
export function drawIsoTerrainLayer(
  scene: Phaser.Scene,
  width: number,
  height: number,
  terrainAt: (tx: number, ty: number) => IsoTerrain,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics().setDepth(0);
  for (let ty = 0; ty < height; ty++) {
    for (let tx = 0; tx < width; tx++) {
      const corners = projectFootprint({ tx, ty, w: 1, h: 1 });
      const terrain = terrainAt(tx, ty);
      const material = MATERIALS[terrain];
      const fill = isoTerrainHash(tx, ty, 3) % 2 ? material.base : material.alternate;
      graphics.fillStyle(material.rim, 1).fillPoints(phaserPoints(corners), true);
      graphics.fillStyle(fill, 1).fillPoints(phaserPoints(inset(corners, 0.035)), true);
      drawTerrainDetails(graphics, terrain, tx, ty, corners, material);
      if (terrain === 'road') drawRoadCurbs(graphics, tx, ty, width, height, terrainAt, corners);
    }
  }
  return graphics;
}

export interface IsoGuideStep { tx: number; ty: number }

/** 첫 방문자에게 영구 UI 화살표 대신 세계 안의 금빛 발자국으로 목적지를 안내한다. */
export function drawIsoGuideRoute(
  scene: Phaser.Scene,
  route: readonly IsoGuideStep[],
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics().setDepth(9);
  route.forEach((step, index) => {
    const center = projectIso(step.tx + 0.5, step.ty + 0.5);
    const direction = index % 2 === 0 ? -1 : 1;
    const foot = [
      { x: center.x + direction * 3, y: center.y - 3 },
      { x: center.x + direction * 6, y: center.y - 1 },
      { x: center.x + direction * 3, y: center.y + 2 },
      { x: center.x, y: center.y },
    ];
    graphics.fillStyle(0x5a3c20, 0.38).fillPoints(phaserPoints(foot.map((point) => ({ x: point.x + 1, y: point.y + 1 }))), true);
    graphics.fillStyle(0xf1c75b, 0.88).fillPoints(phaserPoints(foot), true);
    graphics.fillStyle(0xffe8a0, 0.82).fillRect(center.x + direction * 2, center.y - 2, 2, 1);
  });
  return graphics;
}
