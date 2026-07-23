import type Phaser from 'phaser';
import type { FloorPlan } from '../realestate/realEstate';
import {
  ROOM_ISO_WALL_HEIGHT,
  ROOM_ISO_WORLD_DEPTH,
  isometricRoomLayout,
  projectRoomTile,
} from '../home/isometricRoom';
import { PAL, ROOM_PAL } from './palette';
import { hex, makeTexture, seeded, type Px } from './pixelCanvas';

type Point = { x: number; y: number };

function polygon(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  fill: number,
  stroke: number = PAL.outline,
  alpha = 1,
): void {
  if (points.length < 3) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(Math.round(points[0]!.x), Math.round(points[0]!.y));
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(Math.round(points[index]!.x), Math.round(points[index]!.y));
  }
  ctx.closePath();
  ctx.fillStyle = hex(fill);
  ctx.fill();
  ctx.strokeStyle = hex(stroke, 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function line(ctx: CanvasRenderingContext2D, a: Point, b: Point, color: number, alpha = 1, width = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(Math.round(a.x), Math.round(a.y));
  ctx.lineTo(Math.round(b.x), Math.round(b.y));
  ctx.strokeStyle = hex(color);
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function wallFace(
  d: Px,
  from: Point,
  to: Point,
  fill: number,
  height = ROOM_ISO_WALL_HEIGHT,
): void {
  polygon(d.ctx, [
    { x: from.x, y: from.y - height },
    { x: to.x, y: to.y - height },
    to,
    from,
  ], fill, ROOM_PAL.wallBase);
  line(d.ctx, { x: from.x, y: from.y - height }, { x: to.x, y: to.y - height }, ROOM_PAL.wallBase, .9, 3);
  line(d.ctx, from, to, ROOM_PAL.wallBase, .9, 3);
}

function wallWindow(d: Px, from: Point, to: Point, t0: number, t1: number): void {
  const at = (t: number, lift: number): Point => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t - lift,
  });
  const points = [at(t0, 43), at(t1, 43), at(t1, 13), at(t0, 13)];
  polygon(d.ctx, points, PAL.winFrame, PAL.outline, 1);
  const inset = [at(t0 + .02, 39), at(t1 - .02, 39), at(t1 - .02, 17), at(t0 + .02, 17)];
  polygon(d.ctx, inset, PAL.winGlassWarm, PAL.winFrame, .95);
  line(d.ctx, at((t0 + t1) / 2, 40), at((t0 + t1) / 2, 16), PAL.winFrame, .9);
  line(d.ctx, at(t0 + .01, 28), at(t1 - .01, 28), PAL.winFrame, .9);
  line(d.ctx, at(t0 + .05, 37), at(t0 + .18, 37), 0xffffff, .65);
}

function drawBoundaryWalls(d: Px, plan: FloorPlan): void {
  const northFrom = projectRoomTile(plan, 1, 1);
  const northTo = projectRoomTile(plan, plan.w - 1, 1);
  const westFrom = projectRoomTile(plan, 1, 1);
  const westTo = projectRoomTile(plan, 1, plan.h - 1);
  wallFace(d, northFrom, northTo, ROOM_PAL.wallPaper);
  wallFace(d, westFrom, westTo, ROOM_PAL.wallPaperShade);

  const northSpan = Math.max(1, plan.w - 2);
  for (let tx = 2; tx < plan.w - 2; tx += 3) {
    wallWindow(d, northFrom, northTo, (tx - 1) / northSpan, Math.min(1, (tx + 1) / northSpan));
  }
  const westSpan = Math.max(1, plan.h - 2);
  for (let ty = 2; ty < plan.h - 2; ty += 3) {
    wallWindow(d, westFrom, westTo, (ty - 1) / westSpan, Math.min(1, (ty + 1) / westSpan));
  }

  for (let tx = 2; tx < plan.w - 1; tx += 2) {
    const a = projectRoomTile(plan, tx, 1);
    line(d.ctx, { x: a.x, y: a.y - ROOM_ISO_WALL_HEIGHT + 5 }, { x: a.x, y: a.y - 5 }, ROOM_PAL.wallPaperShade, .2);
  }
  for (let ty = 2; ty < plan.h - 1; ty += 2) {
    const a = projectRoomTile(plan, 1, ty);
    line(d.ctx, { x: a.x, y: a.y - ROOM_ISO_WALL_HEIGHT + 5 }, { x: a.x, y: a.y - 5 }, ROOM_PAL.wallBase, .18);
  }
}

function drawFloor(d: Px, plan: FloorPlan, seed: number): void {
  const rnd = seeded(seed + plan.w * 41 + plan.h * 17);
  for (let diagonal = 2; diagonal <= plan.w + plan.h - 4; diagonal += 1) {
    for (let ty = 1; ty < plan.h - 1; ty += 1) {
      const tx = diagonal - ty;
      if (tx < 1 || tx >= plan.w - 1) continue;
      const north = projectRoomTile(plan, tx, ty);
      const east = projectRoomTile(plan, tx + 1, ty);
      const south = projectRoomTile(plan, tx + 1, ty + 1);
      const west = projectRoomTile(plan, tx, ty + 1);
      const blocked = plan.walls.some((wall) => (
        tx >= wall.x && tx < wall.x + wall.w && ty >= wall.y && ty < wall.y + wall.h
        && !plan.doorGaps.some((gap) => gap.tx === tx && gap.ty === ty)
      ));
      const base = blocked
        ? ROOM_PAL.wallBase
        : ((tx + ty) % 2 ? ROOM_PAL.floorWood1 : ROOM_PAL.floorWood2);
      polygon(d.ctx, [north, east, south, west], base, ROOM_PAL.floorSeam);
      if (!blocked) {
        const offset = .28 + rnd() * .18;
        const a = {
          x: north.x + (west.x - north.x) * offset,
          y: north.y + (west.y - north.y) * offset,
        };
        const b = {
          x: east.x + (south.x - east.x) * offset,
          y: east.y + (south.y - east.y) * offset,
        };
        line(d.ctx, a, b, ROOM_PAL.floorSeam, .35);
        if ((tx * 7 + ty * 11 + seed) % 5 === 0) {
          const glint = {
            x: (north.x + east.x + south.x + west.x) / 4,
            y: (north.y + east.y + south.y + west.y) / 4,
          };
          d.rect(Math.round(glint.x), Math.round(glint.y), 2, 1, ROOM_PAL.wallPaper, .24);
        }
      }
    }
  }

  // 남쪽으로 열린 현관과 작은 환영 매트.
  const tx = plan.door.tx;
  const north = projectRoomTile(plan, tx, plan.h - 1);
  const east = projectRoomTile(plan, tx + 1, plan.h - 1);
  const south = projectRoomTile(plan, tx + 1, plan.h);
  const west = projectRoomTile(plan, tx, plan.h);
  polygon(d.ctx, [north, east, south, west], PAL.doorWood, PAL.doorDark);
  const center = projectRoomTile(plan, tx + .5, plan.h - .45);
  d.rect(Math.round(center.x - 9), Math.round(center.y - 2), 18, 4, PAL.signBg, .86);
}

/** 북·서 벽이 남고 남·동 면은 열린 인형집형 2.5D 실내 배경. */
export function makeIsometricRoomBackground(scene: Phaser.Scene, plan: FloorPlan, seed: number): string {
  const key = `room-iso-open-v1-${plan.w}x${plan.h}-${seed}`;
  if (scene.textures.exists(key)) return key;
  const layout = isometricRoomLayout(plan);
  makeTexture(scene, key, layout.width, layout.height, (d) => {
    drawBoundaryWalls(d, plan);
    drawFloor(d, plan, seed);
  });
  return key;
}

/**
 * 내부 칸막이는 캐릭터·가구와 같은 depth 축에 놓아 뒤에서는 가리고 앞에서는 가려진다.
 * 남쪽 면을 낮게 열어 큰 집에서도 현재 방을 잃어버리지 않게 한다.
 */
export function addIsometricRoomInteriorWalls(scene: Phaser.Scene, plan: FloorPlan): Phaser.GameObjects.Graphics[] {
  const objects: Phaser.GameObjects.Graphics[] = [];
  for (const wall of plan.walls) {
    for (let ty = wall.y; ty < wall.y + wall.h; ty += 1) {
      for (let tx = wall.x; tx < wall.x + wall.w; tx += 1) {
        if (plan.doorGaps.some((gap) => gap.tx === tx && gap.ty === ty)) continue;
        const north = projectRoomTile(plan, tx, ty);
        const east = projectRoomTile(plan, tx + 1, ty);
        const south = projectRoomTile(plan, tx + 1, ty + 1);
        const west = projectRoomTile(plan, tx, ty + 1);
        const height = 38;
        const lift = (point: Point): Point => ({ x: point.x, y: point.y - height });
        const graphics = scene.add.graphics();
        graphics.fillStyle(ROOM_PAL.wallPaperShade, 1);
        graphics.fillPoints([lift(west), lift(south), south, west], true);
        graphics.fillStyle(ROOM_PAL.wallPaper, 1);
        graphics.fillPoints([lift(east), lift(south), south, east], true);
        graphics.fillStyle(ROOM_PAL.wallBase, 1);
        graphics.fillPoints([lift(north), lift(east), lift(south), lift(west)], true);
        graphics.lineStyle(1, PAL.outline, .42);
        graphics.strokePoints([lift(north), lift(east), lift(south), lift(west)], true);
        graphics.setDepth(ROOM_ISO_WORLD_DEPTH + (north.y + east.y + south.y + west.y) / 4);
        objects.push(graphics);
      }
    }
  }
  return objects;
}
