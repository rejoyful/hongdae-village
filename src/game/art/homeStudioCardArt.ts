import { CATALOG_BY_ID } from '../../items/catalog';
import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import {
  HOME_STUDIO_MOOD_BY_ID, type HomeStudioCard,
} from '../home/homeStudioCards';

export const HOME_STUDIO_CARD_W = 320;
export const HOME_STUDIO_CARD_H = 190;

const rect = (
  ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number,
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const parseColor = (value: string | undefined, fallback: string): string => (
  value && /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : fallback
);

function diamond(
  ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, rx: number, ry: number,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry);
  ctx.lineTo(cx + rx, cy);
  ctx.lineTo(cx, cy + ry);
  ctx.lineTo(cx - rx, cy);
  ctx.closePath();
  ctx.fill();
}

function isoBlock(
  ctx: CanvasRenderingContext2D, top: string, side: string, x: number, y: number, width: number, height: number,
): void {
  const ry = Math.max(3, Math.round(width * .28));
  diamond(ctx, '#18141a55', x + 2, y + height + 4, width * .58, ry * .7);
  rect(ctx, side, x - width / 2, y, width, height);
  diamond(ctx, top, x, y, width / 2, ry);
}

function itemPosition(card: HomeStudioCard, index: number): { x: number; y: number } {
  const placements = card.placements;
  if (!placements.length) {
    const fallback = [
      { x: 92, y: 98 }, { x: 216, y: 95 }, { x: 122, y: 124 }, { x: 194, y: 128 },
    ];
    return fallback[index % fallback.length]!;
  }
  const xs = placements.map((entry) => entry.tx);
  const ys = placements.map((entry) => entry.ty);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const entry = placements[index]!;
  const u = (entry.tx - minX + .5) / Math.max(1, maxX - minX + 1);
  const v = (entry.ty - minY + .5) / Math.max(1, maxY - minY + 1);
  return {
    x: 160 + (u - v) * 95,
    y: 70 + (u + v) * 42,
  };
}

function drawFurniture(ctx: CanvasRenderingContext2D, card: HomeStudioCard): void {
  const visible = [...card.placements]
    .sort((a, b) => (a.tx + a.ty) - (b.tx + b.ty) || a.ty - b.ty)
    .slice(0, 14);
  visible.forEach((placement, index) => {
    const def = CATALOG_BY_ID.get(placement.itemId);
    const pos = itemPosition({ ...card, placements: visible }, index);
    const base = parseColor(def?.color, '#94745d');
    const accent = parseColor(def?.accent, '#d4b178');
    const layer = def?.category ?? '';
    if (/러그|카펫/.test(def?.name ?? '') || layer === 'rug') {
      diamond(ctx, base, pos.x, pos.y + 7, 20, 8);
      ctx.globalAlpha = .7; diamond(ctx, accent, pos.x, pos.y + 7, 14, 5); ctx.globalAlpha = 1;
      return;
    }
    const tall = /책장|옷장|냉장고|트리|타워|포스터|시계/.test(def?.name ?? '');
    const tiny = /화분|램프|인형|꽃|촛불|컵|프레임/.test(def?.name ?? '');
    const width = tiny ? 13 : tall ? 18 : 22;
    const height = tiny ? 10 : tall ? 26 : 14;
    isoBlock(ctx, accent, base, pos.x, pos.y - height, width, height);
    ctx.fillStyle = '#30272a';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((def?.name ?? '?').slice(0, 1), pos.x, pos.y - Math.max(4, height / 2));
  });
}

function drawActors(ctx: CanvasRenderingContext2D, card: HomeStudioCard): void {
  const character = document.createElement('canvas');
  character.width = CHAR_W; character.height = CHAR_H;
  const characterContext = character.getContext('2d');
  if (characterContext) {
    paintCharacterFrame(characterContext, card.appearance, 0, 0);
    ctx.drawImage(character, 132, 91, CHAR_W * 2, CHAR_H * 2);
  }
  if (!card.pet) return;
  const pet = document.createElement('canvas');
  pet.width = PET_W; pet.height = PET_H;
  const petContext = pet.getContext('2d');
  if (petContext) {
    paintPet(petContext, card.pet.speciesId, card.pet.accessory);
    ctx.drawImage(pet, 190, 126, PET_W * 1.8, PET_H * 1.8);
  }
}

/** 실제 캐릭터·동행·배치 가구 스냅샷을 2.5D 픽셀 엽서 한 장으로 합성한다. */
export function paintHomeStudioCard(canvas: HTMLCanvasElement, card: HomeStudioCard): void {
  canvas.width = HOME_STUDIO_CARD_W;
  canvas.height = HOME_STUDIO_CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const mood = HOME_STUDIO_MOOD_BY_ID.get(card.moodId) ?? HOME_STUDIO_MOOD_BY_ID.get('everyday')!;
  const [ink, mid, warm, paper] = mood.palette;

  rect(ctx, '#151218', 0, 0, 320, 190);
  rect(ctx, ink, 5, 5, 310, 180);
  for (let x = 14; x < 312; x += 17) rect(ctx, x % 34 ? mid : warm, x, 13 + (x % 5), 2, 2);

  // 북·서 벽과 넓은 2:1 바닥.
  ctx.fillStyle = mid;
  ctx.beginPath(); ctx.moveTo(160, 28); ctx.lineTo(299, 73); ctx.lineTo(299, 106); ctx.lineTo(160, 61); ctx.closePath(); ctx.fill();
  ctx.fillStyle = warm;
  ctx.beginPath(); ctx.moveTo(21, 73); ctx.lineTo(160, 28); ctx.lineTo(160, 61); ctx.lineTo(21, 106); ctx.closePath(); ctx.fill();
  ctx.fillStyle = paper;
  ctx.beginPath(); ctx.moveTo(160, 58); ctx.lineTo(299, 104); ctx.lineTo(160, 174); ctx.lineTo(21, 104); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2b2227'; ctx.lineWidth = 3; ctx.stroke();
  ctx.globalAlpha = .22;
  for (let index = 1; index < 7; index += 1) {
    const t = index / 7;
    ctx.strokeStyle = mid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(160 + 139 * t, 58 + 46 * t); ctx.lineTo(21 + 139 * t, 104 + 70 * t); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(160 - 139 * t, 58 + 46 * t); ctx.lineTo(299 - 139 * t, 104 + 70 * t); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 창문과 연출색.
  rect(ctx, '#232333', 206, 46, 49, 32);
  rect(ctx, mood.id === 'night' ? '#554b85' : paper, 210, 49, 41, 25);
  rect(ctx, warm, 229, 49, 3, 25);
  rect(ctx, '#33272a', 204, 76, 53, 4);
  if (mood.id === 'green') {
    rect(ctx, '#526b52', 42, 56, 31, 26);
    for (let i = 0; i < 5; i += 1) diamond(ctx, '#9baa72', 48 + i * 6, 55 + (i % 2) * 5, 5, 3);
  }

  drawFurniture(ctx, card);
  drawActors(ctx, card);

  // 엽서 캡션과 상태표.
  rect(ctx, '#171419dd', 10, 9, 118, 27);
  rect(ctx, warm, 13, 12, 23, 21);
  ctx.fillStyle = ink; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(mood.mark, 24.5, 22.5);
  ctx.fillStyle = paper; ctx.textAlign = 'left'; ctx.font = 'bold 6px monospace';
  ctx.fillText(mood.code, 42, 20);
  ctx.fillStyle = warm; ctx.font = 'bold 8px sans-serif'; ctx.fillText(mood.title, 42, 29);

  rect(ctx, '#171419dd', 218, 151, 88, 28);
  ctx.fillStyle = paper; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'right';
  ctx.fillText(`${card.themeName} · HOME ${card.score}`, 300, 162);
  ctx.fillStyle = warm; ctx.font = 'bold 8px sans-serif';
  ctx.fillText(`${card.placements.length} OBJECTS`, 300, 173);
}
