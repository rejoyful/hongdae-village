import type { Appearance } from './appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type {
  VillageLevelMemoryDomainDef,
} from '../progression/villageLevelMemories';

export const VILLAGE_LEVEL_MEMORY_ART_W = 360;
export const VILLAGE_LEVEL_MEMORY_ART_H = 190;

export interface VillageLevelMemoryPet {
  speciesId: string;
  accessory: PetAccessoryId;
}

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, width: number, height: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

const poly = (ctx: CanvasRenderingContext2D, color: string, points: Array<[number, number]>) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
};

const line = (ctx: CanvasRenderingContext2D, color: string, width: number, ...points: Array<[number, number]>) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.stroke();
};

const isoBox = (
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number, height: number,
  top: string, left: string, right: string,
) => {
  poly(ctx, top, [[x, y], [x + size, y - size / 2], [x + size * 2, y], [x + size, y + size / 2]]);
  poly(ctx, left, [[x, y], [x + size, y + size / 2], [x + size, y + size / 2 + height], [x, y + height]]);
  poly(ctx, right, [[x + size, y + size / 2], [x + size * 2, y], [x + size * 2, y + height], [x + size, y + size / 2 + height]]);
};

function paintDomainProps(ctx: CanvasRenderingContext2D, domain: VillageLevelMemoryDomainDef): void {
  const accent = domain.color;
  if (domain.id === 'style') {
    line(ctx, '#473842', 3, [48, 65], [48, 136], [118, 136], [118, 65]);
    line(ctx, '#e8d5ae', 2, [43, 74], [123, 74]);
    for (let index = 0; index < 4; index += 1) {
      poly(ctx, index % 2 ? '#d1b47e' : accent, [[55 + index * 15, 76], [62 + index * 15, 72], [69 + index * 15, 78], [67 + index * 15, 106], [55 + index * 15, 106]]);
    }
    rect(ctx, '#f2dfb4', 54, 113, 58, 17);
    rect(ctx, '#7d5e59', 61, 117, 44, 9);
  } else if (domain.id === 'home') {
    isoBox(ctx, 46, 121, 36, 18, '#bb8d68', '#6e5140', '#8a654c');
    rect(ctx, accent, 60, 109, 28, 13);
    isoBox(ctx, 103, 129, 14, 14, '#d5ba7e', '#6d5845', '#907052');
    rect(ctx, '#7f9c76', 111, 96, 5, 26);
    rect(ctx, '#a9c07a', 104, 99, 11, 6);
    rect(ctx, '#a9c07a', 116, 92, 12, 6);
    rect(ctx, '#e6c77e', 51, 68, 7, 36);
    rect(ctx, '#f0dda8', 44, 65, 21, 8);
  } else if (domain.id === 'companion') {
    poly(ctx, '#5d4b45', [[44, 127], [84, 107], [127, 128], [84, 148]]);
    poly(ctx, accent, [[51, 124], [84, 110], [119, 127], [84, 141]]);
    for (const [x, y] of [[66, 122], [96, 122], [81, 133]] as const) rect(ctx, '#f5e3bd', x, y, 8, 7);
    line(ctx, '#d3b267', 2, [46, 91], [65, 82], [83, 91], [104, 78], [125, 87]);
    rect(ctx, '#5d6f74', 103, 95, 25, 18);
    rect(ctx, '#e5d39e', 109, 101, 13, 4);
  } else if (domain.id === 'neighbor') {
    isoBox(ctx, 46, 120, 36, 16, '#a97860', '#64483e', '#805948');
    for (let index = 0; index < 5; index += 1) {
      const x = 52 + index * 15;
      rect(ctx, '#f0dfbd', x, 98 + (index % 2) * 7, 11, 9);
      rect(ctx, index === 2 ? accent : '#8f6c62', x + 3, 107 + (index % 2) * 7, 5, 6);
    }
    rect(ctx, '#d5b56f', 44, 140, 83, 4);
    rect(ctx, '#5f4e48', 45, 68, 79, 19);
    rect(ctx, '#ead9b4', 51, 73, 66, 3);
    rect(ctx, '#ead9b4', 51, 79, 46, 3);
  } else if (domain.id === 'maker') {
    for (let index = 0; index < 3; index += 1) {
      isoBox(ctx, 44 + index * 29, 130, 14, 12, index === 1 ? accent : '#7e9362', '#584b3c', '#6e5942');
      rect(ctx, '#758f62', 50 + index * 29, 107 - (index % 2) * 9, 4, 20);
      rect(ctx, '#adc67c', 44 + index * 29, 110 - (index % 2) * 9, 10, 5);
      rect(ctx, '#adc67c', 53 + index * 29, 103 - (index % 2) * 9, 10, 5);
    }
    isoBox(ctx, 101, 91, 16, 20, '#bd9363', '#6f503e', '#8a6349');
    rect(ctx, '#e6c984', 108, 73, 18, 4);
    rect(ctx, '#5f4940', 112, 79, 10, 11);
  } else {
    poly(ctx, '#433d4c', [[42, 135], [84, 101], [132, 128], [85, 154]]);
    line(ctx, accent, 3, [49, 130], [69, 111], [88, 125], [109, 103], [128, 112]);
    for (let index = 0; index < 5; index += 1) rect(ctx, '#f0ce77', 56 + index * 15, 113 + (index % 2) * 8, 5, 5);
    rect(ctx, '#5c536b', 108, 68, 25, 36);
    rect(ctx, '#ead08a', 113, 75, 15, 3);
    rect(ctx, '#ead08a', 113, 83, 10, 3);
    rect(ctx, '#ead08a', 113, 91, 13, 3);
  }
}

export function paintVillageLevelMemoryArt(
  canvas: HTMLCanvasElement,
  level: number,
  domain: VillageLevelMemoryDomainDef,
  appearance: Appearance,
  pet: VillageLevelMemoryPet | null,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  rect(ctx, '#292633', 0, 0, VILLAGE_LEVEL_MEMORY_ART_W, VILLAGE_LEVEL_MEMORY_ART_H);
  rect(ctx, '#66576d', 0, 52, VILLAGE_LEVEL_MEMORY_ART_W, 90);
  poly(ctx, '#e3d3b6', [[20, 46], [180, 8], [180, 121], [20, 160]]);
  poly(ctx, '#baa890', [[180, 8], [340, 46], [340, 160], [180, 121]]);
  poly(ctx, '#786b63', [[20, 160], [180, 121], [340, 160], [180, 199]]);
  line(ctx, '#3d3742', 3, [20, 46], [180, 8], [340, 46], [340, 160], [180, 199], [20, 160], [20, 46]);
  line(ctx, '#887970', 2, [180, 9], [180, 121]);
  for (let offset = -100; offset <= 200; offset += 24) {
    line(ctx, '#8e7d71', 1, [20 + offset, 160], [180 + offset, 199]);
    line(ctx, '#8e7d71', 1, [340 - offset, 160], [180 - offset, 199]);
  }
  paintDomainProps(ctx, domain);

  const player = document.createElement('canvas');
  player.width = CHAR_W; player.height = CHAR_H;
  const playerCtx = player.getContext('2d');
  if (playerCtx) {
    paintCharacterFrame(playerCtx, appearance, 0, level % 2);
    ctx.drawImage(player, 0, 0, CHAR_W, CHAR_H, 171, 75, CHAR_W * 1.72, CHAR_H * 1.72);
  }

  if (pet) {
    const petCanvas = document.createElement('canvas');
    petCanvas.width = PET_W; petCanvas.height = PET_H;
    const petCtx = petCanvas.getContext('2d');
    if (petCtx) {
      paintPet(petCtx, pet.speciesId, pet.accessory);
      ctx.drawImage(petCanvas, 239, 119, PET_W * 1.4, PET_H * 1.4);
    }
  }

  rect(ctx, '#211e27', 10, 10, 157, 28);
  rect(ctx, domain.color, 13, 13, 7, 22);
  ctx.fillStyle = '#f5e7ca';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`VILLAGE LV.${level} · MEMORY`, 27, 19);

  rect(ctx, domain.color, 302, 11, 46, 31);
  rect(ctx, '#f5dfa3', 306, 15, 38, 23);
  ctx.fillStyle = '#493d3c';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(domain.mark, 325, 26);
}
