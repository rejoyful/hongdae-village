import { paintPet, PET_H, PET_W } from './petArt';
import type { PetOutingRoute, PetOutingRouteId } from '../pets/petOutings';
import type { PetAccessoryId } from '../pets/petProfiles';

export const PET_OUTING_ART_W = 480;
export const PET_OUTING_ART_H = 270;

const hash = (text: string): number => [...text].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function noise(ctx: CanvasRenderingContext2D, seed: number, colors: readonly string[]): void {
  let value = seed;
  for (let i = 0; i < 92; i += 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const x = 12 + (value % 456);
    value = (value * 1664525 + 1013904223) >>> 0;
    const y = 18 + (value % 224);
    rect(ctx, colors[i % colors.length]!, x, y, i % 3 === 0 ? 3 : 2, i % 4 === 0 ? 2 : 1);
  }
}

function rail(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, p[2], 0, 0, 480, 130); rect(ctx, '#d8d0b7', 0, 130, 480, 140);
  rect(ctx, p[0], 0, 98, 480, 20); rect(ctx, '#3f4b3f', 0, 113, 480, 8);
  for (let x = 12; x < 480; x += 38) { rect(ctx, p[1], x, 36 + (x % 17), 12, 12); rect(ctx, '#7d8053', x + 5, 48 + (x % 17), 3, 54); }
  rect(ctx, '#665b50', 0, 214, 480, 5); rect(ctx, '#665b50', 0, 248, 480, 5);
  for (let x = 0; x < 480; x += 26) rect(ctx, '#8f7d67', x, 207, 7, 53);
}

function mural(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#b9aa91', 0, 0, 480, 212); rect(ctx, '#70685e', 0, 212, 480, 58);
  for (let x = 0; x < 480; x += 32) rect(ctx, x % 64 ? '#c3b59d' : '#ac9e87', x, 0, 2, 212);
  rect(ctx, p[1], 30, 40, 96, 54); rect(ctx, p[3], 58, 62, 96, 67); rect(ctx, p[2], 124, 25, 75, 92);
  rect(ctx, '#66847b', 214, 38, 80, 72); rect(ctx, '#d1b876', 274, 76, 95, 51); rect(ctx, '#8d655f', 356, 32, 91, 83);
  for (let x = 18; x < 470; x += 54) { rect(ctx, '#514a43', x, 194, 27, 4); rect(ctx, '#d6c78d', x + 8, 188, 11, 6); }
}

function lawn(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#b9c5aa', 0, 0, 480, 112); rect(ctx, p[1], 0, 112, 480, 158);
  rect(ctx, '#52634f', 64, 50, 18, 110); rect(ctx, p[0], 18, 26, 112, 78); rect(ctx, '#738264', 86, 32, 80, 62);
  rect(ctx, '#c9b883', 315, 116, 116, 62); rect(ctx, '#9d7358', 315, 116, 116, 6);
  for (let x = 12; x < 470; x += 23) { rect(ctx, '#d8c97e', x, 152 + (x % 61), 3, 4); rect(ctx, '#557057', x + 4, 157 + (x % 61), 2, 8); }
}

function channel(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#344750', 0, 0, 480, 118); rect(ctx, p[1], 0, 118, 480, 152);
  rect(ctx, '#2f4852', 0, 162, 480, 108);
  for (let y = 174; y < 266; y += 20) for (let x = (y % 40); x < 480; x += 78) rect(ctx, y % 40 ? '#77918c' : '#b8aa7e', x, y, 35, 3);
  rect(ctx, '#2b3438', 0, 119, 480, 6); rect(ctx, '#91836d', 0, 130, 480, 5);
  for (let x = 16; x < 480; x += 52) rect(ctx, '#393f41', x, 100, 5, 62);
  rect(ctx, p[2], 384, 28, 38, 8); rect(ctx, p[2], 397, 16, 12, 32);
}

function recordLane(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#77665c', 0, 0, 480, 202); rect(ctx, '#4a4541', 0, 202, 68, 68); rect(ctx, '#62594f', 68, 202, 412, 68);
  const shops = [[18, 62, 120, p[1]], [153, 42, 142, p[3]], [310, 70, 144, p[0]]] as const;
  for (const [x, y, w, c] of shops) { rect(ctx, c, x, y, w, 140 - y); rect(ctx, '#27282a', x + 12, y + 31, w - 24, 65); rect(ctx, p[2], x + 8, y + 8, w - 16, 14); }
  for (let x = 54; x < 460; x += 83) { rect(ctx, '#252526', x, 107, 28, 28); rect(ctx, '#a88759', x + 10, 117, 8, 8); }
  for (let x = 88; x < 478; x += 44) rect(ctx, '#aaa08e', x, 218, 24, 3);
}

function rooftop(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#b9c1b5', 0, 0, 480, 112); rect(ctx, '#77766b', 0, 112, 480, 158); rect(ctx, '#4d554d', 0, 103, 480, 13);
  for (let x = 18; x < 470; x += 57) { rect(ctx, '#705542', x, 161 + (x % 32), 40, 40); rect(ctx, p[2], x + 2, 158 + (x % 32), 36, 6); rect(ctx, p[1], x + 10, 135 + (x % 32), 20, 27); rect(ctx, p[0], x + 18, 124 + (x % 32), 5, 38); }
  rect(ctx, '#8c7f68', 335, 34, 8, 82); rect(ctx, '#c0a56e', 315, 41, 48, 5); rect(ctx, '#6d5f52', 319, 47, 40, 27);
}

function forest(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#647069', 0, 0, 480, 94); rect(ctx, p[0], 0, 94, 480, 176);
  for (let x = -20; x < 500; x += 52) { rect(ctx, '#34433d', x + 18, 30 + (x % 29), 18, 154); rect(ctx, p[1], x, 14 + (x % 29), 66, 68); rect(ctx, '#506654', x + 25, 0 + (x % 31), 53, 54); }
  rect(ctx, '#9e9271', 106, 190, 374, 80); rect(ctx, '#b7aa82', 131, 190, 349, 80);
  rect(ctx, '#795d43', 56, 138, 8, 57); rect(ctx, p[2], 39, 140, 42, 28); rect(ctx, '#4a4b3f', 48, 148, 24, 4);
}

function dawn(ctx: CanvasRenderingContext2D, p: PetOutingRoute['palette']): void {
  rect(ctx, '#56616b', 0, 0, 480, 105); rect(ctx, '#777a74', 0, 105, 480, 165);
  rect(ctx, '#41494e', 0, 62, 480, 53); rect(ctx, p[2], 31, 77, 111, 9); rect(ctx, '#647b72', 164, 72, 86, 43); rect(ctx, '#9b7862', 284, 58, 151, 57);
  rect(ctx, '#d5c797', 0, 184, 480, 4); rect(ctx, '#484e50', 0, 226, 480, 5);
  for (let x = 20; x < 470; x += 71) { rect(ctx, '#303a40', x, 97, 5, 92); rect(ctx, '#c7af74', x - 7, 92, 19, 7); }
  for (let x = 12; x < 470; x += 48) rect(ctx, '#97968b', x, 244, 31, 3);
}

const DRAWERS: Record<PetOutingRouteId, (ctx: CanvasRenderingContext2D, palette: PetOutingRoute['palette']) => void> = {
  rail_sunwalk: rail, mural_alley: mural, yeonnam_lawn: lawn, moon_channel: channel,
  record_lane: recordLane, rooftop_garden: rooftop, forest_edge: forest, dawn_square: dawn,
};

/** 산책 수첩의 큰 장면. 외부 에셋 없이 코스별 레이어와 동행 펫을 픽셀 단위로 합성한다. */
export function paintPetOutingScene(
  ctx: CanvasRenderingContext2D,
  route: PetOutingRoute,
  petId: string,
  accessory: PetAccessoryId,
  archivePoints: number,
): void {
  ctx.clearRect(0, 0, PET_OUTING_ART_W, PET_OUTING_ART_H);
  ctx.imageSmoothingEnabled = false;
  DRAWERS[route.id](ctx, route.palette);
  noise(ctx, hash(route.id), ['rgba(255,255,255,.14)', 'rgba(43,45,40,.10)', route.palette[2]]);

  rect(ctx, 'rgba(35,32,28,.28)', 173, 226, 150, 13);
  const petCanvas = document.createElement('canvas');
  petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petContext = petCanvas.getContext('2d');
  if (petContext) paintPet(petContext, petId, accessory);
  ctx.drawImage(petCanvas, 190, 116, 120, 120);

  rect(ctx, '#efe5ca', 14, 14, 102, 28); rect(ctx, '#3d403b', 18, 18, 94, 20);
  ctx.fillStyle = '#efe5ca'; ctx.font = 'bold 12px monospace'; ctx.textBaseline = 'top';
  ctx.fillText(route.code, 26, 22);
  for (let i = 0; i < 3; i += 1) {
    rect(ctx, archivePoints >= route.souvenirs[i]!.threshold ? route.palette[2] : '#655f55', 426 + (i * 14), 19, 9, 9);
  }
}
