import type { Appearance } from './appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type {
  StarterCompassRouteView, StarterMentorChapterView,
} from '../progression/starterCompass';

export const STARTER_MENTOR_ART_W = 360;
export const STARTER_MENTOR_ART_H = 190;

export interface StarterMentorPet {
  speciesId: string;
  accessory: PetAccessoryId;
}

const rect = (
  context: CanvasRenderingContext2D, color: string,
  x: number, y: number, width: number, height: number,
) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

const poly = (context: CanvasRenderingContext2D, color: string, points: Array<[number, number]>) => {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
  context.fill();
};

const line = (
  context: CanvasRenderingContext2D, color: string, width: number,
  ...points: Array<[number, number]>
) => {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.stroke();
};

const drawStyle = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  line(context, '#3c3342', 3, [54, 59], [54, 136], [105, 136], [105, 59]);
  line(context, '#e9d8b3', 2, [50, 68], [110, 68]);
  for (let index = 0; index < Math.min(3, stage + 1); index += 1) {
    poly(context, index === stage ? color : '#aa7b7d', [[59 + index * 15, 70], [66 + index * 15, 67], [72 + index * 15, 72], [70 + index * 15, 99], [59 + index * 15, 99]]);
  }
};

const drawHome = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  poly(context, '#534437', [[48, 114], [91, 98], [128, 116], [85, 133]]);
  poly(context, color, [[52, 111], [91, 97], [122, 112], [84, 126]]);
  if (stage >= 2) {
    rect(context, '#f0d49c', 64, 101, 14, 8);
    rect(context, '#7f9b83', 97, 103, 10, 9);
  }
  if (stage >= 3) rect(context, '#e4b465', 112, 77, 5, 29);
};

const drawCompanion = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  poly(context, '#51463e', [[48, 119], [88, 105], [126, 124], [85, 139]]);
  poly(context, color, [[54, 116], [88, 104], [119, 120], [85, 132]]);
  rect(context, '#f4e6c8', 74, 113, 6, 5);
  rect(context, '#f4e6c8', 92, 113, 6, 5);
  rect(context, '#f4e6c8', 83, 121, 7, 6);
  if (stage >= 2) line(context, '#e0b96d', 2, [58, 92], [76, 82], [96, 91], [117, 78]);
  if (stage >= 3) rect(context, '#718b8c', 107, 93, 17, 13);
};

const drawNeighbor = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  poly(context, '#3f3738', [[47, 113], [86, 99], [125, 118], [84, 132]]);
  poly(context, color, [[53, 111], [86, 100], [118, 116], [84, 127]]);
  for (let index = 0; index < Math.min(3, stage + 1); index += 1) {
    rect(context, '#eee1c2', 63 + index * 18, 104 + (index % 2) * 6, 9, 7);
    rect(context, '#5c4540', 66 + index * 18, 111 + (index % 2) * 6, 3, 4);
  }
};

const drawMaker = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  for (let index = 0; index < 3; index += 1) {
    poly(context, '#493c35', [[49 + index * 25, 115], [63 + index * 25, 108], [77 + index * 25, 115], [63 + index * 25, 122]]);
    rect(context, index < stage ? color : '#756d5b', 56 + index * 25, 107, 14, 7);
  }
  if (stage >= 2) {
    rect(context, '#7f9d69', 84, 91, 4, 17);
    rect(context, '#adc579', 77, 93, 9, 5);
    rect(context, '#adc579', 88, 88, 10, 5);
  }
};

const drawExplorer = (context: CanvasRenderingContext2D, color: string, stage: number) => {
  poly(context, '#403b4a', [[46, 122], [83, 96], [128, 118], [85, 140]]);
  for (let index = 0; index < stage + 1; index += 1) {
    const x = 62 + index * 21;
    line(context, color, 2, [x, 111], [x + 7, 104], [x + 14, 110]);
    rect(context, '#f1d184', x + 5, 100, 5, 5);
  }
  rect(context, '#5c536b', 107, 84, 18, 27);
  rect(context, '#ead18d', 111, 89, 10, 3);
  rect(context, '#ead18d', 111, 96, 7, 3);
};

const DRAW_ROUTE = {
  style: drawStyle,
  home: drawHome,
  companion: drawCompanion,
  neighbor: drawNeighbor,
  maker: drawMaker,
  explorer: drawExplorer,
} as const;

export function paintStarterMentorArt(
  canvas: HTMLCanvasElement,
  route: StarterCompassRouteView,
  chapter: StarterMentorChapterView,
  appearance: Appearance,
  pet: StarterMentorPet | null,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const night = chapter.chapter === 3;
  const sky = night ? '#29253b' : chapter.chapter === 2 ? '#746279' : '#9d7d76';
  rect(context, sky, 0, 0, STARTER_MENTOR_ART_W, STARTER_MENTOR_ART_H);
  rect(context, night ? '#373149' : '#b1917e', 0, 68, STARTER_MENTOR_ART_W, 80);
  rect(context, '#25222b', 0, 148, STARTER_MENTOR_ART_W, 42);

  // 2.5D 골목 방/작업대
  poly(context, '#e9dabd', [[27, 50], [180, 13], [180, 128], [27, 165]]);
  poly(context, '#c9b89b', [[180, 13], [333, 50], [333, 165], [180, 128]]);
  poly(context, '#74655b', [[27, 165], [180, 128], [333, 165], [180, 202]]);
  line(context, '#3c3540', 3, [27, 50], [180, 13], [333, 50], [333, 165], [180, 202], [27, 165], [27, 50]);
  line(context, '#86756a', 2, [180, 14], [180, 128]);
  for (let offset = -70; offset < 240; offset += 25) {
    line(context, '#8b796d', 1, [27 + offset, 165], [180 + offset, 202]);
    line(context, '#8b796d', 1, [333 - offset, 165], [180 - offset, 202]);
  }

  rect(context, '#3e3942', 260, 53, 48, 47);
  rect(context, night ? '#5f6683' : '#8eb0af', 264, 57, 40, 39);
  rect(context, night ? '#e8cf82' : '#d9e7cd', 267, 60, 16, 14);
  line(context, '#3e3942', 2, [284, 57], [284, 96]);
  line(context, '#3e3942', 2, [264, 76], [304, 76]);

  DRAW_ROUTE[route.id](context, route.color, chapter.chapter);

  // 멘토 자리: 인물 복제 대신 이름표와 고유 색 실루엣으로 플레이어가 중심이 되게 한다.
  poly(context, '#312d35', [[268, 123], [289, 116], [307, 125], [286, 133]]);
  rect(context, route.color, 279, 86, 16, 28);
  rect(context, '#e2c49e', 281, 76, 12, 13);
  rect(context, '#3e3540', 279, 73, 16, 7);
  rect(context, '#f2ddb6', 274, 132, 37, 13);
  context.fillStyle = '#3a3237';
  context.font = 'bold 7px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(route.mentorName, 292, 139);

  const player = document.createElement('canvas');
  player.width = CHAR_W;
  player.height = CHAR_H;
  const playerContext = player.getContext('2d');
  if (playerContext) {
    paintCharacterFrame(playerContext, appearance, 0, chapter.replayCount % 2);
    context.drawImage(player, 0, 0, CHAR_W, CHAR_H, 166, 76, CHAR_W * 1.7, CHAR_H * 1.7);
  }

  if (pet && (route.id === 'companion' || chapter.chapter >= 2)) {
    const petCanvas = document.createElement('canvas');
    petCanvas.width = PET_W;
    petCanvas.height = PET_H;
    const petContext = petCanvas.getContext('2d');
    if (petContext) {
      paintPet(petContext, pet.speciesId, pet.accessory);
      context.drawImage(petCanvas, 226, 118, PET_W * 1.35, PET_H * 1.35);
    }
  }

  rect(context, '#211f28', 10, 10, 125, 25);
  rect(context, route.color, 13, 13, 7, 19);
  context.fillStyle = '#f5e8ca';
  context.font = 'bold 9px monospace';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(`${chapter.code} · MENTOR STORY`, 25, 18);

  if (chapter.claimed) {
    rect(context, '#e8c56f', 321, 12, 27, 27);
    rect(context, '#fff0a6', 325, 16, 19, 19);
    context.fillStyle = '#513f42';
    context.font = 'bold 13px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(chapter.featured ? '★' : '✓', 334.5, 25.5);
  }
}
