import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import type { PetSignalView } from '../pets/petSignals';
import { paintPet, PET_H, PET_W } from './petArt';

export const PET_SIGNAL_ART_W = 240;
export const PET_SIGNAL_ART_H = 120;

const PALETTES: Readonly<Record<PetPersonalityId, readonly [string, string, string, string, string]>> = {
  gentle: ['#e7d5b7', '#bf8f80', '#7f9684', '#4d4b4b', '#f2c979'],
  curious: ['#d9cda9', '#7f9a91', '#bd7b5f', '#3f4d4b', '#efd078'],
  brave: ['#d3c39b', '#a96355', '#657b72', '#3d3f45', '#e5bd68'],
  playful: ['#e6c894', '#bc6f72', '#688b88', '#483e4e', '#f2d36f'],
  calm: ['#d8d0b7', '#82968e', '#aa856d', '#424b4d', '#d9bd75'],
  performer: ['#e0c5a0', '#9a647a', '#5f7189', '#413b4a', '#f0c86d'],
};

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function star(ctx: CanvasRenderingContext2D, color: string, x: number, y: number): void {
  rect(ctx, color, x + 3, y, 3, 9); rect(ctx, color, x, y + 3, 9, 3);
}

function backdrop(ctx: CanvasRenderingContext2D, view: PetSignalView): void {
  const [paper, warm, cool, ink, light] = PALETTES[view.personality];
  rect(ctx, ink, 0, 0, PET_SIGNAL_ART_W, PET_SIGNAL_ART_H);
  rect(ctx, paper, 4, 4, 232, 112);
  rect(ctx, warm, 4, 4, 232, 58);
  rect(ctx, cool, 4, 62, 232, 54);

  if (view.chapter === 1) {
    // 골목의 첫 관찰: 간판, 화분, 긴 그림자.
    rect(ctx, ink, 18, 20, 46, 41); rect(ctx, paper, 23, 25, 36, 36);
    rect(ctx, light, 29, 31, 24, 8); rect(ctx, '#755543', 33, 43, 16, 18);
    rect(ctx, '#6c7e62', 186, 44, 17, 18); rect(ctx, '#9b704f', 183, 58, 23, 8);
    rect(ctx, 'rgba(45,40,44,.22)', 73, 91, 119, 7);
  } else if (view.chapter === 2) {
    // 가까워진 실내: 창과 흩어진 작은 놀이 조각.
    rect(ctx, ink, 18, 15, 68, 48); rect(ctx, '#b9d0c2', 23, 20, 58, 38);
    rect(ctx, paper, 50, 20, 4, 38); rect(ctx, paper, 23, 38, 58, 4);
    for (let i = 0; i < 4; i += 1) star(ctx, light, 111 + i * 27, 18 + (i % 2) * 10);
    rect(ctx, '#8b6354', 178, 83, 26, 13); rect(ctx, light, 184, 87, 14, 5);
  } else if (view.chapter === 3) {
    // 함께 쌓인 하루: 지도/액자/기억 핀.
    rect(ctx, ink, 18, 15, 79, 52); rect(ctx, '#ead9b3', 23, 20, 69, 42);
    for (let i = 0; i < 5; i += 1) {
      rect(ctx, i % 2 ? warm : cool, 30 + i * 11, 30 + (i % 3) * 7, 17, 3);
      rect(ctx, light, 28 + i * 13, 25 + (i % 2) * 16, 4, 4);
    }
    rect(ctx, '#6d5947', 179, 33, 35, 39); rect(ctx, paper, 184, 38, 25, 29); star(ctx, light, 192, 47);
  } else {
    // 깊은 신뢰: 밤 창, 별빛, 한 자리에 모이는 빛.
    rect(ctx, '#27374a', 4, 4, 232, 73); rect(ctx, '#53686d', 4, 77, 232, 39);
    star(ctx, light, 29, 20); star(ctx, '#f3de9a', 81, 12); star(ctx, light, 191, 25);
    rect(ctx, '#e7c76f', 174, 14, 24, 24); rect(ctx, '#f1d98c', 181, 17, 16, 16);
    rect(ctx, ink, 19, 82, 202, 5); for (let x = 27; x < 218; x += 26) rect(ctx, ink, x, 78, 4, 27);
  }

  // 몸짓을 상징하는 네 종류의 작은 픽셀 궤적.
  if (view.chapter === 1) {
    for (let i = 0; i < 3; i += 1) { rect(ctx, light, 113 + i * 15, 80 - i * 4, 7, 4); rect(ctx, light, 115 + i * 15, 76 - i * 4, 3, 3); }
  } else if (view.chapter === 2) {
    rect(ctx, light, 129, 75, 18, 5); rect(ctx, light, 135, 69, 6, 17);
  } else if (view.chapter === 3) {
    star(ctx, light, 126, 75); star(ctx, paper, 146, 65);
  } else {
    rect(ctx, light, 119, 72, 4, 4); rect(ctx, light, 128, 66, 4, 4); rect(ctx, light, 138, 73, 4, 4);
  }
}

export function paintPetSignalScene(
  canvas: HTMLCanvasElement,
  view: PetSignalView,
  petId: string,
  accessory: PetAccessoryId,
): void {
  canvas.width = PET_SIGNAL_ART_W; canvas.height = PET_SIGNAL_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  backdrop(ctx, view);

  const petCanvas = document.createElement('canvas'); petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petContext = petCanvas.getContext('2d'); if (petContext) paintPet(petContext, petId, accessory);
  const petX = view.chapter % 2 ? 99 : 112;
  const petY = view.chapter === 4 ? 45 : 49;
  ctx.fillStyle = 'rgba(32,31,35,.24)'; ctx.beginPath(); ctx.ellipse(petX + 30, petY + 56, 31, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(petCanvas, petX, petY, 60, 60);

  const [, , , ink, light] = PALETTES[view.personality];
  rect(ctx, 'rgba(35,34,38,.84)', 9, 91, 222, 19);
  ctx.fillStyle = '#f3e8d2'; ctx.font = '900 8px monospace'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText(view.code, 15, 100.5);
  ctx.textAlign = 'center'; ctx.fillStyle = light; ctx.fillText(view.mark, 120, 100.5);
  ctx.textAlign = 'right'; ctx.fillStyle = '#f3e8d2'; ctx.fillText(view.response ? 'TRANSLATED' : 'OBSERVING', 225, 100.5);

  if (!view.unlocked) {
    rect(ctx, 'rgba(38,38,43,.62)', 4, 4, 232, 87);
    for (let x = -20; x < 250; x += 17) rect(ctx, 'rgba(245,232,206,.09)', x, 4, 5, 87);
    rect(ctx, ink, 105, 39, 30, 26); rect(ctx, '#d5bd8a', 110, 48, 20, 17); rect(ctx, ink, 113, 34, 14, 20);
  }
}
