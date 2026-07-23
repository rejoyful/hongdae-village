import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import type { PetPerformanceView } from '../pets/petPerformances';
import { paintPet, PET_H, PET_W } from './petArt';

export const PET_PERFORMANCE_ART_W = 480;
export const PET_PERFORMANCE_ART_H = 270;

const PALETTES: Readonly<Record<PetPersonalityId, readonly [string, string, string, string, string]>> = {
  gentle: ['#6f7d6d', '#d2b18d', '#ead6ae', '#413d3b', '#e9c96f'],
  curious: ['#567a78', '#c68d67', '#dbc799', '#394649', '#efd36f'],
  brave: ['#6e665f', '#b35f51', '#d8b47c', '#3f3b3d', '#f0c264'],
  playful: ['#7b5b72', '#cf7b75', '#e5c286', '#403849', '#f3d761'],
  calm: ['#617570', '#a88972', '#d8c8a4', '#3c4547', '#d9bf78'],
  performer: ['#624e70', '#ac6077', '#d7ad77', '#37313e', '#f1c653'],
};

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function star(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, scale = 1): void {
  rect(ctx, color, x + 3 * scale, y, 3 * scale, 9 * scale);
  rect(ctx, color, x, y + 3 * scale, 9 * scale, 3 * scale);
}

function stage(ctx: CanvasRenderingContext2D, palette: readonly string[], stamps: number): void {
  const [primary, warm, paper, ink, light] = palette;
  rect(ctx, ink!, 0, 0, 480, 270);
  rect(ctx, '#272832', 6, 6, 468, 258);
  rect(ctx, primary!, 12, 12, 456, 130);
  rect(ctx, warm!, 12, 142, 456, 116);
  // 픽셀 커튼과 조명.
  rect(ctx, '#3b2f3b', 12, 12, 58, 194); rect(ctx, '#3b2f3b', 410, 12, 58, 194);
  for (let x = 18; x < 67; x += 12) rect(ctx, x % 24 ? '#654357' : '#7e4d62', x, 12, 8, 194);
  for (let x = 416; x < 465; x += 12) rect(ctx, x % 24 ? '#654357' : '#7e4d62', x, 12, 8, 194);
  rect(ctx, '#2d2932', 70, 30, 340, 12);
  for (let x = 88; x < 400; x += 62) {
    rect(ctx, '#71655a', x, 42, 22, 8);
    rect(ctx, light!, x + 5, 50, 12, 7);
  }
  // 2.5D 무대 바닥.
  ctx.fillStyle = paper!; ctx.beginPath(); ctx.moveTo(92, 116); ctx.lineTo(388, 116); ctx.lineTo(452, 236); ctx.lineTo(28, 236); ctx.closePath(); ctx.fill();
  for (let y = 132; y < 230; y += 20) {
    const inset = (y - 116) * .46;
    rect(ctx, 'rgba(70,55,48,.12)', 92 - inset, y, 296 + inset * 2, 2);
  }
  for (let x = 112; x < 382; x += 44) {
    ctx.strokeStyle = 'rgba(70,55,48,.13)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 116); ctx.lineTo(240 + (x - 240) * 1.45, 236); ctx.stroke();
  }
  rect(ctx, '#51463e', 28, 236, 424, 12);
  for (let i = 0; i < 3; i += 1) {
    rect(ctx, i < stamps ? light! : '#6a625c', 372 + i * 25, 214, 16, 16);
    if (i < stamps) star(ctx, '#fff0bd', 376 + i * 25, 218);
  }
}

function trickProps(ctx: CanvasRenderingContext2D, view: PetPerformanceView, palette: readonly string[]): void {
  const [primary, warm, , ink, light] = palette;
  if (view.trickId === 'hello') {
    rect(ctx, ink!, 173, 172, 134, 12); rect(ctx, primary!, 181, 160, 118, 13);
    star(ctx, light!, 130, 78); star(ctx, light!, 337, 72);
  } else if (view.trickId === 'paw') {
    rect(ctx, ink!, 174, 174, 132, 35); rect(ctx, warm!, 183, 164, 114, 36);
    rect(ctx, light!, 224, 176, 32, 8); rect(ctx, light!, 236, 166, 8, 28);
  } else if (view.trickId === 'spin') {
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2;
      rect(ctx, i % 2 ? light! : warm!, 240 + Math.cos(angle) * 100, 150 + Math.sin(angle) * 55, 8, 5);
    }
  } else if (view.trickId === 'dance') {
    rect(ctx, ink!, 103, 137, 54, 68); rect(ctx, primary!, 110, 144, 40, 54);
    rect(ctx, ink!, 323, 137, 54, 68); rect(ctx, primary!, 330, 144, 40, 54);
    for (const x of [125, 343]) { rect(ctx, light!, x, 153, 10, 10); rect(ctx, warm!, x - 6, 176, 22, 5); }
    for (let i = 0; i < 5; i += 1) star(ctx, i % 2 ? light! : '#e7a0a5', 165 + i * 36, 68 + (i % 2) * 18);
  } else {
    rect(ctx, ink!, 154, 66, 172, 112); rect(ctx, '#efe1bc', 163, 75, 154, 94);
    star(ctx, light!, 133, 92, 2); star(ctx, light!, 329, 74, 2);
    rect(ctx, '#3e343d', 88, 164, 54, 42); rect(ctx, light!, 105, 176, 20, 13);
  }
}

/** 배운 트릭을 되풀이할수록 데뷔·대표작·앙코르가 쌓이는 2.5D 픽셀 소극장. */
export function paintPetPerformanceScene(
  canvas: HTMLCanvasElement,
  view: PetPerformanceView,
  petId: string,
  accessory: PetAccessoryId,
  personality: PetPersonalityId,
): void {
  canvas.width = PET_PERFORMANCE_ART_W; canvas.height = PET_PERFORMANCE_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const palette = PALETTES[personality];
  stage(ctx, palette, view.stamps);
  trickProps(ctx, view, palette);

  const petCanvas = document.createElement('canvas');
  petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petContext = petCanvas.getContext('2d');
  if (petContext) paintPet(petContext, petId, accessory);
  const y = view.trickId === 'paw' ? 124 : 111;
  if (view.trickId === 'spin' && view.rehearsals > 0) {
    ctx.globalAlpha = .18; ctx.drawImage(petCanvas, 151, y + 7, 112, 112);
    ctx.drawImage(petCanvas, 217, y + 7, 112, 112); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(38,32,34,.24)'; ctx.beginPath(); ctx.ellipse(240, 220, 66, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  if (view.trickId === 'hello') { ctx.translate(240, 0); ctx.rotate(-.045); ctx.translate(-240, 0); }
  if (view.trickId === 'dance') ctx.translate(0, -5);
  ctx.drawImage(petCanvas, 180, y, 120, 120);
  ctx.restore();

  rect(ctx, 'rgba(36,31,37,.88)', 18, 18, 124, 27);
  ctx.fillStyle = '#f3e7cb'; ctx.font = '900 11px monospace'; ctx.textBaseline = 'middle';
  ctx.fillText(view.code, 28, 31.5);
  rect(ctx, 'rgba(36,31,37,.88)', 18, 247, 444, 11);
  ctx.fillStyle = palette[4]; ctx.font = '900 7px monospace'; ctx.fillText(
    view.learned ? `${view.trick.name} · REHEARSAL ${view.rehearsals}` : `${view.trick.name} · LEARN FIRST`,
    27, 252.5,
  );

  if (!view.learned) {
    rect(ctx, 'rgba(35,33,39,.69)', 70, 42, 340, 194);
    for (let x = 74; x < 408; x += 20) rect(ctx, 'rgba(245,226,194,.08)', x, 42, 7, 194);
    rect(ctx, '#3c3740', 217, 119, 46, 39); rect(ctx, '#c8a869', 224, 134, 32, 24); rect(ctx, '#3c3740', 229, 108, 22, 38);
  }
}
