import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import type { Appearance } from './appearance';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type { VillageProfileFrameDef } from '../progression/villageProfile';

export const VILLAGE_PROFILE_ART_W = 240;
export const VILLAGE_PROFILE_ART_H = 140;

export interface VillageProfilePetArt { speciesId: string; accessory: PetAccessoryId }

const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

function characterCanvas(appearance: Appearance): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = CHAR_W; canvas.height = CHAR_H;
  const context = canvas.getContext('2d'); if (context) paintCharacterFrame(context, appearance, 0, 0);
  return canvas;
}

function petCanvas(pet: VillageProfilePetArt): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = PET_W; canvas.height = PET_H;
  const context = canvas.getContext('2d'); if (context) paintPet(context, pet.speciesId, pet.accessory);
  return canvas;
}

function backgroundPattern(ctx: CanvasRenderingContext2D, frame: VillageProfileFrameDef): void {
  const [ink, deep, accent, paper] = frame.colors;
  rect(ctx, 0, 0, VILLAGE_PROFILE_ART_W, VILLAGE_PROFILE_ART_H, ink);
  rect(ctx, 5, 5, 230, 130, deep); rect(ctx, 8, 8, 224, 124, paper);
  rect(ctx, 11, 11, 218, 118, ink); rect(ctx, 14, 14, 212, 112, deep);
  for (let x = 17; x < 226; x += 14) { rect(ctx, x, 17 + (x % 5), 2, 2, accent); rect(ctx, x + 5, 20 + (x % 3), 1, 1, paper); }
  rect(ctx, 18, 31, 204, 88, `${paper}ee`); rect(ctx, 21, 34, 198, 82, '#221d1fb8');
  rect(ctx, 25, 40, 104, 69, deep); rect(ctx, 28, 43, 98, 63, `${ink}dd`);
  for (let x = 29; x < 126; x += 9) rect(ctx, x, 100 - (x % 5), 7, 2, accent);
  rect(ctx, 135, 41, 78, 4, accent); rect(ctx, 135, 49, 58, 2, paper);
  rect(ctx, 135, 91, 78, 18, deep); rect(ctx, 139, 95, 16, 10, accent);
  rect(ctx, 159, 95, 23, 4, paper); rect(ctx, 159, 102, 43, 3, ink);
  rect(ctx, 18, 122, 204, 3, accent);
  rect(ctx, 14, 14, 4, 12, accent); rect(ctx, 14, 14, 12, 4, accent);
  rect(ctx, 222, 14, 4, 12, accent); rect(ctx, 214, 14, 12, 4, accent);
}

export function paintVillageProfileCard(
  ctx: CanvasRenderingContext2D, frame: VillageProfileFrameDef, appearance: Appearance,
  pet: VillageProfilePetArt | null, level: number,
): void {
  ctx.clearRect(0, 0, VILLAGE_PROFILE_ART_W, VILLAGE_PROFILE_ART_H); ctx.imageSmoothingEnabled = false;
  backgroundPattern(ctx, frame);
  rect(ctx, 44, 96, 68, 5, 'rgba(0,0,0,.35)');
  ctx.drawImage(characterCanvas(appearance), 45, 22, 72, 96);
  if (pet) { rect(ctx, 98, 101, 50, 4, 'rgba(0,0,0,.32)'); ctx.drawImage(petCanvas(pet), 99, 61, 48, 48); }
  rect(ctx, 138, 58, 68, 25, frame.colors[0]); rect(ctx, 141, 61, 62, 19, frame.colors[3]);
  ctx.fillStyle = frame.colors[0]; ctx.font = 'bold 8px monospace'; ctx.fillText('VILLAGE', 148, 68); ctx.font = 'bold 14px monospace'; ctx.fillText(`LV.${Math.max(1, Math.min(50, level))}`, 149, 78);
  rect(ctx, 201, 31, 14, 14, frame.colors[2]); rect(ctx, 205, 35, 6, 6, frame.colors[0]);
}
