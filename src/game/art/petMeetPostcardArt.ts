import { paintPet, PET_H, PET_W } from './petArt';
import {
  PET_MEET_SCENE_BY_ID, type PetMeetPostcard,
} from '../social/petMeetPostcards';

export const PET_MEET_ART_W = 360;
export const PET_MEET_ART_H = 180;

const rect = (
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

function shade(color: string, amount: number): string {
  const raw = color.replace('#', '');
  const value = Number.parseInt(raw, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function diamond(
  context: CanvasRenderingContext2D,
  color: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(centerX, centerY - height / 2);
  context.lineTo(centerX + width / 2, centerY);
  context.lineTo(centerX, centerY + height / 2);
  context.lineTo(centerX - width / 2, centerY);
  context.closePath();
  context.fill();
}

function drawScene(
  context: CanvasRenderingContext2D,
  kind: PetMeetPostcard['kind'],
  colors: readonly [string, string, string, string],
) {
  const [dark, mid, accent, paper] = colors;
  rect(context, '#17151a', 0, 0, PET_MEET_ART_W, PET_MEET_ART_H);
  rect(context, dark, 0, 0, 360, 112);
  rect(context, shade(dark, 16), 0, 112, 360, 68);
  if (kind === 'cafe_window') {
    rect(context, shade(mid, -34), 18, 23, 93, 72);
    rect(context, mid, 25, 30, 79, 57);
    rect(context, dark, 30, 35, 69, 47);
    rect(context, paper, 62, 35, 4, 47);
    rect(context, accent, 30, 57, 69, 4);
    rect(context, accent, 276, 54, 8, 45);
    rect(context, paper, 259, 47, 42, 9);
  } else if (kind === 'roof_garden') {
    for (let pot = 0; pot < 6; pot += 1) {
      rect(context, pot % 2 ? accent : paper, 22 + pot * 55, 83, 20, 18);
      rect(context, mid, 28 + pot * 55, 64 - (pot % 3) * 6, 7, 19);
      rect(context, shade(accent, 15), 20 + pot * 55, 59 - (pot % 3) * 6, 23, 9);
    }
  } else if (kind === 'rain_shelter') {
    rect(context, shade(mid, -35), 13, 19, 110, 81);
    rect(context, mid, 20, 26, 96, 68);
    rect(context, dark, 27, 33, 82, 54);
    rect(context, paper, 66, 33, 4, 54);
    for (let drop = 0; drop < 11; drop += 1) {
      rect(context, accent, 34 + (drop * 31) % 296, 18 + (drop * 17) % 74, 2, 7);
    }
    rect(context, paper, 230, 39, 101, 6);
    rect(context, shade(accent, -18), 240, 45, 7, 59);
  } else if (kind === 'little_stage') {
    rect(context, shade(mid, -40), 0, 0, 52, 108);
    rect(context, shade(mid, -40), 308, 0, 52, 108);
    for (let fold = 0; fold < 4; fold += 1) {
      rect(context, fold % 2 ? mid : shade(mid, -18), fold * 13, 0, 13, 108);
      rect(context, fold % 2 ? shade(mid, -18) : mid, 308 + fold * 13, 0, 13, 108);
    }
    rect(context, paper, 104, 18, 151, 6);
    for (let bulb = 0; bulb < 8; bulb += 1) rect(context, accent, 111 + bulb * 19, 30, 6, 6);
  } else if (kind === 'forest_star') {
    for (let tree = 0; tree < 6; tree += 1) {
      rect(context, shade(mid, -36), tree * 67 - 11, 53 - (tree % 2) * 14, 39, 62);
      rect(context, mid, tree * 67 - 20, 38 - (tree % 2) * 14, 58, 32);
      rect(context, shade(accent, -17), tree * 67 - 6, 25 - (tree % 2) * 14, 34, 25);
    }
    for (let star = 0; star < 13; star += 1) {
      rect(context, star % 3 ? paper : accent, 13 + star * 27, 9 + (star * 13) % 34, star % 4 ? 2 : 3, star % 4 ? 2 : 3);
    }
  } else {
    rect(context, shade(mid, -37), 20, 20, 86, 72);
    rect(context, mid, 27, 27, 72, 58);
    rect(context, dark, 33, 33, 60, 46);
    rect(context, paper, 42, 42, 37, 4);
    rect(context, accent, 42, 54, 44, 6);
    for (let lamp = 0; lamp < 3; lamp += 1) {
      rect(context, paper, 239 + lamp * 36, 27 + (lamp % 2) * 9, 22, 8);
      rect(context, accent, 247 + lamp * 36, 35 + (lamp % 2) * 9, 6, 41);
    }
  }
  rect(context, shade(accent, -54), 0, 108, 360, 7);
  diamond(context, shade(accent, -67), 180, 148, 336, 54);
  diamond(context, shade(accent, -33), 180, 141, 336, 45);
  diamond(context, `${paper}38`, 180, 137, 218, 28);
}

function drawScaledPet(
  context: CanvasRenderingContext2D,
  pet: PetMeetPostcard['myPet'],
  centerX: number,
  baseY: number,
  flip: boolean,
) {
  const source = document.createElement('canvas');
  source.width = PET_W;
  source.height = PET_H;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) return;
  paintPet(sourceContext, pet.petId, pet.accessoryId);
  const scale = 4.4;
  const width = PET_W * scale;
  const height = PET_H * scale;
  context.save();
  context.imageSmoothingEnabled = false;
  if (flip) {
    context.translate(centerX * 2, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, Math.round(centerX - width / 2), Math.round(baseY - height), width, height);
  context.restore();
}

/** 두 이웃의 공개 대표 동행만 합성하는 자유문구 없는 2.5D 픽셀 엽서. */
export function paintPetMeetPostcard(canvas: HTMLCanvasElement, record: PetMeetPostcard): void {
  canvas.width = PET_MEET_ART_W;
  canvas.height = PET_MEET_ART_H;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  const scene = PET_MEET_SCENE_BY_ID.get(record.kind) ?? PET_MEET_SCENES_FALLBACK;
  drawScene(context, record.kind, scene.colors);
  drawScaledPet(context, record.myPet, 133, 139, false);
  drawScaledPet(context, record.neighborPet, 227, 139, true);
  rect(context, '#151319df', 10, 9, 132, 24);
  context.fillStyle = scene.colors[3];
  context.font = '900 8px ui-monospace, monospace';
  context.fillText('COMPANION MEET POSTCARD', 17, 17);
  context.fillStyle = scene.colors[2];
  context.font = '900 7px ui-monospace, monospace';
  context.fillText(scene.code, 17, 27);
  rect(context, '#17151add', 121, 145, 118, 19);
  context.fillStyle = scene.colors[3];
  context.font = '900 7px ui-monospace, monospace';
  context.fillText('TWO PAWS · ONE MEMORY', 130, 157);
}

const PET_MEET_SCENES_FALLBACK = {
  id: 'alley_walk',
  mark: '걷',
  code: 'ALLEY WALK',
  name: '나란한 골목 산책',
  message: '말보다 먼저 같은 속도로 걷기 시작했어요.',
  colors: ['#20252b', '#49525a', '#b8796d', '#ead5a5'],
} as const;
