import type { Appearance } from './appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type { AdventurePathView } from '../progression/adventurePaths';

export const ADVENTURE_PATH_ROOM_ART_W = 360;
export const ADVENTURE_PATH_ROOM_ART_H = 180;

export interface AdventurePathRoomPet {
  speciesId: string;
  accessory: PetAccessoryId;
}

const rect = (ctx: CanvasRenderingContext2D, fill: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const poly = (ctx: CanvasRenderingContext2D, fill: string, points: Array<[number, number]>) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
};

const line = (ctx: CanvasRenderingContext2D, stroke: string, width: number, ...points: Array<[number, number]>) => {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
};

const isoBox = (
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number,
  top: string, left: string, right: string,
) => {
  poly(ctx, top, [[x, y], [x + w, y - w / 2], [x + w * 2, y], [x + w, y + w / 2]]);
  poly(ctx, left, [[x, y], [x + w, y + w / 2], [x + w, y + w / 2 + h], [x, y + h]]);
  poly(ctx, right, [[x + w, y + w / 2], [x + w * 2, y], [x + w * 2, y + h], [x + w, y + w / 2 + h]]);
};

function paintProps(ctx: CanvasRenderingContext2D, path: AdventurePathView): void {
  const accent = path.color;
  const complete = Math.min(path.completed, 6);
  if (path.id === 'style') {
    line(ctx, '#4b3b43', 3, [50, 58], [50, 126], [113, 126], [113, 58]);
    line(ctx, '#e6d3b1', 2, [46, 68], [118, 68]);
    for (let i = 0; i < 4; i += 1) {
      poly(ctx, i < complete ? accent : '#75666d', [[56 + i * 14, 70], [62 + i * 14, 67], [69 + i * 14, 72], [67 + i * 14, 99], [56 + i * 14, 99]]);
    }
    rect(ctx, '#e4c98e', 45, 130, 77, 4);
  } else if (path.id === 'home') {
    isoBox(ctx, 43, 111, 36, 16, '#b88b68', '#725542', '#8d694e');
    rect(ctx, accent, 57, 102, 22, 10);
    rect(ctx, '#dec796', 97, 98, 15, 18);
    rect(ctx, '#719070', 101, 90, 7, 10);
    isoBox(ctx, 105, 130, 15, 12, '#d9bd82', '#796047', '#987454');
  } else if (path.id === 'companion') {
    poly(ctx, '#5b4a45', [[44, 119], [84, 102], [126, 121], [84, 139]]);
    poly(ctx, accent, [[51, 117], [84, 104], [118, 120], [84, 132]]);
    for (const [x, y] of [[69, 114], [95, 114], [81, 124]] as const) rect(ctx, '#f0dfbd', x, y, 7, 6);
    line(ctx, '#d4b56e', 2, [50, 89], [71, 80], [90, 89], [112, 78], [126, 84]);
    rect(ctx, '#576970', 107, 92, 20, 14);
  } else if (path.id === 'neighbor') {
    isoBox(ctx, 48, 111, 35, 14, '#a97962', '#6b4b42', '#815b4c');
    for (let i = 0; i < 4; i += 1) {
      rect(ctx, i < complete ? '#f0dfbd' : '#756864', 58 + i * 15, 98 + (i % 2) * 5, 10, 8);
      rect(ctx, accent, 61 + i * 15, 106 + (i % 2) * 5, 4, 5);
    }
    rect(ctx, '#d4b56e', 45, 128, 79, 4);
  } else if (path.id === 'maker') {
    for (let i = 0; i < 3; i += 1) {
      isoBox(ctx, 43 + i * 27, 119, 13, 10, i * 2 < complete ? accent : '#716c5d', '#574b3c', '#6c5842');
      rect(ctx, '#7d9b63', 49 + i * 27, 101 - (i % 2) * 7, 4, 17);
      rect(ctx, '#a9c175', 43 + i * 27, 103 - (i % 2) * 7, 9, 5);
    }
    isoBox(ctx, 105, 99, 15, 18, '#bd9364', '#72513e', '#8c6449');
    rect(ctx, '#e4c681', 111, 84, 18, 4);
  } else if (path.id === 'explorer') {
    poly(ctx, '#433d4c', [[42, 126], [84, 96], [131, 121], [85, 145]]);
    line(ctx, accent, 3, [53, 119], [72, 105], [91, 116], [112, 99], [127, 106]);
    for (let i = 0; i < 4; i += 1) rect(ctx, i < complete ? '#f0cf79' : '#6a6470', 60 + i * 18, 103 + (i % 2) * 7, 5, 5);
    rect(ctx, '#5c536b', 109, 69, 23, 31);
    rect(ctx, '#e7ca86', 113, 75, 15, 3);
    rect(ctx, '#e7ca86', 113, 83, 11, 3);
  } else if (path.id === 'collector') {
    rect(ctx, '#463b38', 44, 62, 82, 68);
    rect(ctx, '#b79772', 49, 67, 72, 58);
    for (let i = 0; i < 6; i += 1) {
      const x = 54 + (i % 3) * 22; const y = 73 + Math.floor(i / 3) * 25;
      rect(ctx, '#584b45', x, y, 17, 19);
      rect(ctx, i < complete ? accent : '#766f68', x + 5, y + 5, 7, 9);
      rect(ctx, '#e5c984', x + 3, y + 16, 11, 2);
    }
  } else {
    isoBox(ctx, 43, 119, 39, 15, '#60766e', '#3e514c', '#4d625a');
    rect(ctx, '#d8c792', 52, 89, 56, 28);
    for (let i = 0; i < 4; i += 1) {
      rect(ctx, i < complete ? accent : '#756e68', 57 + i * 12, 94 + (i % 2) * 8, 7, 6);
    }
    rect(ctx, '#4d5c58', 112, 73, 19, 45);
    rect(ctx, '#e2cb8c', 116, 79, 11, 3);
    rect(ctx, '#e2cb8c', 116, 88, 8, 3);
  }
}

export function paintAdventurePathRoomArt(
  canvas: HTMLCanvasElement,
  path: AdventurePathView,
  appearance: Appearance,
  pet: AdventurePathRoomPet | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  rect(ctx, '#292633', 0, 0, ADVENTURE_PATH_ROOM_ART_W, ADVENTURE_PATH_ROOM_ART_H);
  rect(ctx, '#605469', 0, 52, ADVENTURE_PATH_ROOM_ART_W, 82);
  poly(ctx, '#e0d1b5', [[22, 45], [180, 8], [180, 117], [22, 156]]);
  poly(ctx, '#b9a78f', [[180, 8], [338, 45], [338, 156], [180, 117]]);
  poly(ctx, '#786b63', [[22, 156], [180, 117], [338, 156], [180, 195]]);
  line(ctx, '#3d3742', 3, [22, 45], [180, 8], [338, 45], [338, 156], [180, 195], [22, 156], [22, 45]);
  line(ctx, '#887870', 2, [180, 9], [180, 117]);
  for (let offset = -100; offset <= 190; offset += 24) {
    line(ctx, '#8e7d71', 1, [22 + offset, 156], [180 + offset, 195]);
    line(ctx, '#8e7d71', 1, [338 - offset, 156], [180 - offset, 195]);
  }

  rect(ctx, '#403944', 263, 45, 48, 44);
  rect(ctx, '#718392', 267, 49, 40, 36);
  rect(ctx, '#e8d18c', 271, 53, 13, 10);
  line(ctx, '#403944', 2, [287, 49], [287, 85]);
  line(ctx, '#403944', 2, [267, 67], [307, 67]);
  paintProps(ctx, path);

  const playerCanvas = document.createElement('canvas');
  playerCanvas.width = CHAR_W; playerCanvas.height = CHAR_H;
  const playerCtx = playerCanvas.getContext('2d');
  if (playerCtx) {
    paintCharacterFrame(playerCtx, appearance, 0, path.completed % 2);
    ctx.drawImage(playerCanvas, 0, 0, CHAR_W, CHAR_H, 168, 69, CHAR_W * 1.75, CHAR_H * 1.75);
  }

  if (pet) {
    const petCanvas = document.createElement('canvas');
    petCanvas.width = PET_W; petCanvas.height = PET_H;
    const petCtx = petCanvas.getContext('2d');
    if (petCtx) {
      paintPet(petCtx, pet.speciesId, pet.accessory);
      ctx.drawImage(petCanvas, 236, 111, PET_W * 1.45, PET_H * 1.45);
    }
  }

  rect(ctx, '#211e27', 10, 10, 147, 27);
  rect(ctx, path.color, 13, 13, 7, 21);
  ctx.fillStyle = '#f5e7ca';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${path.code} · PATH ROOM`, 26, 19);

  for (let i = 0; i < 6; i += 1) {
    rect(ctx, i < path.completed ? '#f0cf78' : '#554f55', 301 + (i % 3) * 14, 11 + Math.floor(i / 3) * 14, 10, 10);
    if (i < path.completed) rect(ctx, '#fff1af', 304 + (i % 3) * 14, 14 + Math.floor(i / 3) * 14, 4, 4);
  }
}
