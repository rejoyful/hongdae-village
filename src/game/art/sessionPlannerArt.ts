import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { DEFAULT_APPEARANCE, type Appearance } from './appearance';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type { SessionPlanSlotView } from '../progression/sessionPlanner';

export const SESSION_PLANNER_ART_W = 480;
export const SESSION_PLANNER_ART_H = 210;

const CATEGORY_COLORS: Record<string, readonly [string, string]> = {
  onboarding: ['#668070', '#c7d0ad'],
  daily: ['#9b7a53', '#e1c987'],
  story: ['#8b6171', '#d6a9a0'],
  collection: ['#5e7482', '#a8c0c6'],
  mastery: ['#6c6289', '#beb0d2'],
};

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function diamond(ctx: CanvasRenderingContext2D, color: string, edge: string, cx: number, cy: number, w: number, h: number): void {
  ctx.fillStyle = edge; ctx.beginPath(); ctx.moveTo(cx, cy - h / 2 - 3); ctx.lineTo(cx + w / 2 + 5, cy);
  ctx.lineTo(cx, cy + h / 2 + 3); ctx.lineTo(cx - w / 2 - 5, cy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2); ctx.lineTo(cx - w / 2, cy); ctx.closePath(); ctx.fill();
}

/** 서로 다른 퀘스트 세 개가 한 번의 외출 동선으로 이어지는 2.5D 픽셀 계획 카드. */
export function paintSessionPlannerArt(
  canvas: HTMLCanvasElement,
  slots: readonly SessionPlanSlotView[],
  appearance: Appearance = DEFAULT_APPEARANCE,
  pet: { speciesId: string; accessory: PetAccessoryId } | null = null,
): void {
  canvas.width = SESSION_PLANNER_ART_W; canvas.height = SESSION_PLANNER_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  rect(ctx, '#30383a', 0, 0, 480, 210);
  rect(ctx, '#b9c2b0', 5, 5, 470, 200);
  rect(ctx, '#728078', 5, 5, 470, 68);
  rect(ctx, '#d8cfb8', 5, 73, 470, 132);
  for (let x = 12; x < 474; x += 23) rect(ctx, x % 46 ? 'rgba(255,255,255,.12)' : 'rgba(47,58,57,.08)', x, 8 + (x % 31), 3, 2);

  // 세 장소를 잇는 금빛 아이소메트릭 발자국.
  const centers = [[122, 125], [250, 95], [380, 126]] as const;
  for (let i = 0; i < 2; i += 1) {
    const [sx, sy] = centers[i]!;
    const [tx, ty] = centers[i + 1]!;
    for (let step = 1; step <= 5; step += 1) {
      const t = step / 6;
      rect(ctx, step % 2 ? '#b7934b' : '#d2b76c', sx + (tx - sx) * t, sy + (ty - sy) * t, 6, 4);
    }
  }
  centers.forEach(([cx, cy], index) => {
    const slot = slots[index];
    const colors = CATEGORY_COLORS[slot?.quest.category ?? 'onboarding']!;
    diamond(ctx, slot?.quest.done ? '#c8d2b4' : colors[1], '#4b5350', cx, cy, 92, 48);
    rect(ctx, colors[0], cx - 22, cy - 38, 44, 23);
    ctx.fillStyle = '#f2ead7'; ctx.font = '900 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(slot ? (slot.quest.done ? '✓' : String(index + 1).padStart(2, '0')) : '+', cx, cy - 26);
    if (slot) {
      rect(ctx, '#4d514c', cx - 31, cy + 14, 62, 10);
      ctx.fillStyle = '#f0e7d4'; ctx.font = '900 6px sans-serif';
      ctx.fillText(slot.quest.name.slice(0, 9), cx, cy + 19);
    }
  });

  const character = document.createElement('canvas'); character.width = CHAR_W; character.height = CHAR_H;
  const characterContext = character.getContext('2d');
  if (characterContext) paintCharacterFrame(characterContext, appearance, 0, 1);
  ctx.fillStyle = 'rgba(36,38,37,.22)'; ctx.beginPath(); ctx.ellipse(63, 174, 29, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(character, 35, 105, 56, 72);
  if (pet) {
    const petCanvas = document.createElement('canvas'); petCanvas.width = PET_W; petCanvas.height = PET_H;
    const petContext = petCanvas.getContext('2d');
    if (petContext) paintPet(petContext, pet.speciesId, pet.accessory);
    ctx.drawImage(petCanvas, 76, 129, 48, 48);
  }
  rect(ctx, 'rgba(42,47,47,.9)', 14, 14, 166, 28);
  ctx.fillStyle = '#f3e8cf'; ctx.textAlign = 'left'; ctx.font = '900 10px monospace';
  ctx.fillText('TODAY · THREE STOPS', 25, 28);
  rect(ctx, 'rgba(42,47,47,.88)', 304, 178, 158, 17);
  ctx.fillStyle = '#dfc778'; ctx.font = '900 7px monospace';
  ctx.fillText(slots.length === 3 ? (slots.every((slot) => slot.quest.done) ? 'PAGE READY TO ARCHIVE' : 'ROUTE IN PROGRESS') : `${slots.length}/3 STOPS PLANNED`, 315, 186.5);
}
