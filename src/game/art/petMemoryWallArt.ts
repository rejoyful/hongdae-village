import {
  PET_MEMORY_WALL_FRAMES, PET_MEMORY_WALL_LIGHTS,
  type PetMemoryWallState,
} from '../home/petMemoryWall';
import type { PetMeetPostcard } from '../social/petMeetPostcards';
import { paintPetMeetPostcard } from './petMeetPostcardArt';

export const PET_MEMORY_WALL_ART_W = 480;
export const PET_MEMORY_WALL_ART_H = 240;
export const PET_MEMORY_WALL_FIXTURE_W = 224;
export const PET_MEMORY_WALL_FIXTURE_H = 112;

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

interface CardPose {
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
}

function cardPoses(layoutId: PetMemoryWallState['layoutId'], count: number): CardPose[] {
  if (count <= 1) return [{ x: 69, y: 21, w: 86, h: 43 }];
  if (count === 2) return [{ x: 24, y: 27, w: 82, h: 41 }, { x: 118, y: 18, w: 82, h: 41 }];
  if (layoutId === 'center') {
    return [
      { x: 7, y: 34, w: 59, h: 30, angle: -.035 },
      { x: 65, y: 14, w: 94, h: 47 },
      { x: 158, y: 35, w: 59, h: 30, angle: .035 },
    ];
  }
  if (layoutId === 'steps') {
    return [
      { x: 8, y: 38, w: 68, h: 34 },
      { x: 78, y: 27, w: 68, h: 34 },
      { x: 148, y: 16, w: 68, h: 34 },
    ];
  }
  if (layoutId === 'collage') {
    return [
      { x: 15, y: 20, w: 82, h: 41, angle: -.055 },
      { x: 72, y: 34, w: 82, h: 41, angle: .035 },
      { x: 128, y: 14, w: 82, h: 41, angle: -.025 },
    ];
  }
  return [
    { x: 7, y: 25, w: 66, h: 33 },
    { x: 79, y: 25, w: 66, h: 33 },
    { x: 151, y: 25, w: 66, h: 33 },
  ];
}

function drawCard(
  context: CanvasRenderingContext2D,
  record: PetMeetPostcard,
  pose: CardPose,
  state: PetMemoryWallState,
  paper: string,
  glow: string,
) {
  const source = document.createElement('canvas');
  paintPetMeetPostcard(source, record);
  const frame = state.frameId;
  const border = frame === 'film_strip' ? '#131319'
    : frame === 'wood_gallery' ? '#6d4936'
      : frame === 'neon_grid' ? glow : paper;
  const rim = frame === 'film_strip' ? '#d7b873'
    : frame === 'wood_gallery' ? '#b47b51'
      : frame === 'neon_grid' ? shade(glow, -38) : '#b98a58';
  context.save();
  context.translate(pose.x + pose.w / 2, pose.y + pose.h / 2);
  context.rotate(pose.angle ?? 0);
  rect(context, '#0d0c10aa', -pose.w / 2 + 3, -pose.h / 2 + 4, pose.w + 4, pose.h + 5);
  rect(context, border, -pose.w / 2 - 3, -pose.h / 2 - 3, pose.w + 6, pose.h + 6);
  rect(context, rim, -pose.w / 2 - 1, -pose.h / 2 - 1, pose.w + 2, pose.h + 2);
  context.imageSmoothingEnabled = false;
  context.drawImage(source, -pose.w / 2, -pose.h / 2, pose.w, pose.h);
  if (frame === 'film_strip') {
    for (let hole = -pose.w / 2 + 4; hole < pose.w / 2 - 2; hole += 8) {
      rect(context, paper, hole, -pose.h / 2 - 2, 4, 2);
      rect(context, paper, hole, pose.h / 2, 4, 2);
    }
  } else if (frame === 'kraft_triptych') {
    rect(context, '#d5a66c', -pose.w / 2 + 5, -pose.h / 2 - 5, 15, 4);
    rect(context, '#d5a66c', pose.w / 2 - 20, pose.h / 2 + 1, 15, 4);
  } else if (frame === 'neon_grid') {
    rect(context, '#ffffffaa', -pose.w / 2 + 3, -pose.h / 2 - 2, Math.max(8, pose.w / 3), 2);
    rect(context, '#ffffff66', pose.w / 2, -pose.h / 2 + 3, 2, Math.max(8, pose.h / 2));
  }
  context.restore();
}

function drawFixture(
  context: CanvasRenderingContext2D,
  state: PetMemoryWallState,
  records: readonly PetMeetPostcard[],
  x: number,
  y: number,
  scale: number,
) {
  const light = PET_MEMORY_WALL_LIGHTS.find((item) => item.id === state.lightId) ?? PET_MEMORY_WALL_LIGHTS[0]!;
  const [dark, mid, glow, paper] = light.colors;
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  rect(context, '#0c0b0faa', 6, 8, 212, 88);
  if (state.frameId === 'neon_grid') {
    rect(context, shade(dark, 7), 0, 0, 224, 94);
    for (let gx = 13; gx < 220; gx += 22) rect(context, `${glow}72`, gx, 7, 1, 78);
    for (let gy = 14; gy < 88; gy += 18) rect(context, `${glow}5f`, 7, gy, 210, 1);
    rect(context, glow, 0, 0, 224, 3);
  } else if (state.frameId === 'wood_gallery') {
    rect(context, shade(mid, -47), 1, 3, 222, 87);
    rect(context, shade(mid, -22), 5, 7, 214, 79);
    rect(context, shade(mid, -57), 0, 84, 224, 10);
    rect(context, paper, 6, 84, 212, 2);
  } else if (state.frameId === 'film_strip') {
    rect(context, '#111016', 0, 2, 224, 90);
    rect(context, shade(mid, -35), 5, 8, 214, 76);
    for (let px = 7; px < 220; px += 12) {
      rect(context, paper, px, 4, 6, 3);
      rect(context, paper, px, 86, 6, 3);
    }
  } else {
    rect(context, shade(mid, -42), 1, 3, 222, 88);
    rect(context, '#a97850', 5, 7, 214, 80);
    rect(context, paper, 8, 10, 208, 74);
    for (let pin = 0; pin < 5; pin += 1) {
      rect(context, pin % 2 ? glow : '#aa774d', 17 + pin * 47, 5 + (pin % 2) * 77, 4, 4);
    }
  }
  const poses = cardPoses(state.layoutId, records.length);
  records.slice(0, 3).forEach((record, index) => {
    const pose = poses[index];
    if (pose) drawCard(context, record, pose, state, paper, glow);
  });
  if (records.length === 0) {
    rect(context, '#151319d9', 41, 25, 142, 35);
    context.fillStyle = paper;
    context.font = '900 8px ui-monospace, monospace';
    context.fillText('COMPANION MEMORY WALL', 52, 38);
    context.fillStyle = glow;
    context.font = '900 7px ui-monospace, monospace';
    context.fillText('동행 엽서 세 장을 기다리는 중', 52, 51);
  }
  rect(context, shade(glow, -55), 13, 96, 198, 4);
  rect(context, glow, 35, 93, 154, 3);
  context.restore();
}

export function paintPetMemoryWallFixture(
  canvas: HTMLCanvasElement,
  state: PetMemoryWallState,
  records: readonly PetMeetPostcard[] = state.featured,
): void {
  canvas.width = PET_MEMORY_WALL_FIXTURE_W;
  canvas.height = PET_MEMORY_WALL_FIXTURE_H;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawFixture(context, state, records, 0, 4, 1);
}

export function paintPetMemoryWallArt(
  canvas: HTMLCanvasElement,
  state: PetMemoryWallState,
  records: readonly PetMeetPostcard[] = state.featured,
): void {
  canvas.width = PET_MEMORY_WALL_ART_W;
  canvas.height = PET_MEMORY_WALL_ART_H;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  const light = PET_MEMORY_WALL_LIGHTS.find((item) => item.id === state.lightId) ?? PET_MEMORY_WALL_LIGHTS[0]!;
  const frame = PET_MEMORY_WALL_FRAMES.find((item) => item.id === state.frameId) ?? PET_MEMORY_WALL_FRAMES[0]!;
  const [dark, mid, glow, paper] = light.colors;
  rect(context, '#101014', 0, 0, 480, 240);
  rect(context, dark, 0, 0, 480, 148);
  rect(context, shade(dark, 18), 0, 148, 480, 92);
  for (let x = 0; x < 480; x += 24) {
    rect(context, x % 48 ? `${paper}0d` : `${glow}12`, x, 17, 2, 117);
  }
  rect(context, shade(mid, -43), 22, 26, 90, 79);
  rect(context, mid, 28, 32, 78, 67);
  rect(context, '#142127', 34, 38, 66, 55);
  rect(context, `${paper}aa`, 64, 38, 3, 55);
  rect(context, `${glow}c9`, 34, 65, 66, 3);
  for (let drop = 0; drop < 8; drop += 1) {
    rect(context, glow, 42 + (drop * 19) % 52, 43 + (drop * 13) % 43, 2, 5);
  }
  rect(context, shade(mid, -41), 379, 28, 70, 108);
  for (let shelf = 0; shelf < 3; shelf += 1) {
    rect(context, glow, 386, 54 + shelf * 27, 56, 3);
    rect(context, shelf % 2 ? paper : mid, 391, 39 + shelf * 27, 13, 15);
    rect(context, dark, 412, 42 + shelf * 27, 9, 12);
    rect(context, paper, 429, 37 + shelf * 27, 8, 17);
  }
  rect(context, shade(glow, -62), 0, 144, 480, 8);
  diamond(context, shade(glow, -70), 240, 204, 456, 72);
  diamond(context, shade(glow, -38), 240, 192, 456, 62);
  drawFixture(context, state, records, 117, 43, 1.12);
  rect(context, '#101014df', 12, 10, 165, 25);
  context.fillStyle = paper;
  context.font = '900 8px ui-monospace, monospace';
  context.fillText('COMPANION MEMORY WALL', 21, 19);
  context.fillStyle = glow;
  context.font = '900 7px ui-monospace, monospace';
  context.fillText(`${frame.code} · ${light.code}`, 21, 29);
  rect(context, shade(mid, -30), 343, 170, 102, 13);
  rect(context, glow, 352, 161, 84, 10);
  rect(context, paper, 364, 154, 59, 7);
}
