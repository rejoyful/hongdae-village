import type { ResidentRendezvousDef } from '../residents/residentRendezvous';
import { paintCharacterFrame, CHAR_H, CHAR_W } from './characterArt';
import type { Appearance } from './appearance';
import { paintPet, PET_H, PET_W } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';

export const RENDEZVOUS_ART_W = 160;
export const RENDEZVOUS_ART_H = 80;

const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

const line = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, color: string) => rect(ctx, x, y, w, 1, color);

function windowGlow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: string, glow: string): void {
  rect(ctx, x, y, w, h, frame); rect(ctx, x + 2, y + 2, w - 4, h - 4, glow);
  line(ctx, x + Math.floor(w / 2), y + 2, h - 4, frame);
}

function plant(ctx: CanvasRenderingContext2D, x: number, y: number, leaf: string, pot: string): void {
  rect(ctx, x + 3, y + 5, 1, 7, '#4c573c');
  rect(ctx, x, y + 3, 4, 3, leaf); rect(ctx, x + 4, y, 4, 4, leaf); rect(ctx, x + 5, y + 5, 4, 3, leaf);
  rect(ctx, x + 1, y + 11, 7, 3, pot); rect(ctx, x + 2, y + 14, 5, 3, '#5a3c2b');
}

function drawStage(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 52, p[0]!); rect(ctx, 0, 52, 160, 28, '#26202c');
  for (let x = 8; x < 160; x += 22) { rect(ctx, x, 8 + (x % 3), 2, 2, p[3]!); rect(ctx, x + 4, 4 + (x % 5), 1, 1, '#fff4cf'); }
  rect(ctx, 21, 17, 118, 36, p[1]!); rect(ctx, 24, 20, 112, 31, '#302641');
  rect(ctx, 41, 48, 78, 5, p[2]!); rect(ctx, 46, 53, 68, 4, '#563348');
  rect(ctx, 53, 30, 2, 19, '#b9a6a4'); rect(ctx, 50, 29, 8, 3, '#342d39');
  rect(ctx, 104, 31, 13, 16, '#473a50'); rect(ctx, 107, 34, 7, 7, p[3]!);
}

function drawCafe(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 57, p[1]!); rect(ctx, 0, 57, 160, 23, '#5b402e');
  windowGlow(ctx, 12, 11, 42, 30, '#372a25', p[3]!); windowGlow(ctx, 106, 11, 42, 30, '#372a25', '#b9d5d7');
  rect(ctx, 69, 10, 22, 3, p[3]!); rect(ctx, 65, 14, 30, 2, p[2]!);
  rect(ctx, 62, 48, 36, 5, '#6e4930'); rect(ctx, 65, 53, 4, 17, '#392d25'); rect(ctx, 91, 53, 4, 17, '#392d25');
  rect(ctx, 75, 42, 11, 6, '#efe0c5'); rect(ctx, 85, 43, 3, 4, '#efe0c5'); plant(ctx, 27, 45, '#688252', '#a76348');
}

function drawHome(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 56, '#d8c79d'); rect(ctx, 0, 56, 160, 24, '#8c6848');
  for (let y = 58; y < 80; y += 5) line(ctx, 0, y, 160, '#765438');
  windowGlow(ctx, 13, 10, 44, 31, '#674c36', '#c8e1c9');
  rect(ctx, 75, 41, 56, 5, p[2]!); rect(ctx, 79, 46, 4, 17, '#594331'); rect(ctx, 123, 46, 4, 17, '#594331');
  rect(ctx, 88, 34, 18, 7, '#f1e5c2'); line(ctx, 90, 37, 14, p[1]!); plant(ctx, 136, 39, p[1]!, '#b56f50');
}

function drawShop(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 58, p[0]!); rect(ctx, 0, 58, 160, 22, '#504b4c');
  rect(ctx, 7, 8, 146, 6, p[2]!); rect(ctx, 12, 16, 65, 33, '#5c6470'); rect(ctx, 15, 19, 59, 27, '#d8e5df');
  for (let x = 19; x < 72; x += 11) { rect(ctx, x, 25, 7, 8, x % 2 ? p[2]! : p[3]!); rect(ctx, x, 35, 7, 7, p[1]!); }
  rect(ctx, 89, 18, 57, 31, '#3d424d'); for (let y = 22; y < 46; y += 8) { line(ctx, 94, y, 46, '#aeb7b1'); rect(ctx, 97, y - 5, 8, 4, p[3]!); rect(ctx, 111, y - 5, 10, 4, p[2]!); }
}

function drawForest(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 49, p[0]!); rect(ctx, 0, 49, 160, 31, '#51644b');
  for (let x = 4; x < 160; x += 18) { rect(ctx, x + 6, 21, 4, 34, '#594533'); rect(ctx, x, 8 + (x % 7), 17, 20, p[x % 3 === 0 ? 2 : 1]!); rect(ctx, x + 4, 5 + (x % 5), 10, 12, p[1]!); }
  rect(ctx, 54, 48, 63, 7, '#8a7657'); rect(ctx, 59, 55, 5, 12, '#514739'); rect(ctx, 108, 55, 5, 12, '#514739');
  for (let x = 8; x < 150; x += 17) rect(ctx, x, 69 + (x % 4), 3, 2, p[3]!);
}

function drawStation(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 55, '#cad2ca'); rect(ctx, 0, 55, 160, 25, '#535c60');
  rect(ctx, 0, 61, 160, 3, p[2]!); rect(ctx, 12, 8, 136, 7, p[1]!); rect(ctx, 18, 18, 46, 30, '#87a7b0'); rect(ctx, 22, 22, 38, 22, '#233b4b');
  rect(ctx, 78, 19, 61, 5, p[0]!); rect(ctx, 82, 27, 53, 19, '#f0e4c8');
  for (let x = 86; x < 132; x += 9) rect(ctx, x, 31, 5, 2, p[2]!);
  rect(ctx, 73, 47, 70, 5, '#3d4a50'); rect(ctx, 75, 52, 4, 15, '#28363d'); rect(ctx, 137, 52, 4, 15, '#28363d');
}

function drawStudio(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 56, '#d7c5b1'); rect(ctx, 0, 56, 160, 24, '#785e4c');
  rect(ctx, 9, 8, 95, 41, p[0]!); rect(ctx, 14, 12, 34, 16, p[2]!); rect(ctx, 41, 20, 35, 25, p[1]!); rect(ctx, 70, 10, 28, 20, p[3]!);
  for (let x = 13; x < 101; x += 13) { rect(ctx, x, 35 + (x % 6), 9, 5, x % 2 ? p[2]! : p[3]!); }
  rect(ctx, 118, 17, 3, 35, '#59412f'); rect(ctx, 108, 49, 26, 3, '#59412f'); rect(ctx, 113, 23, 17, 23, '#eee2bf');
  rect(ctx, 137, 42, 8, 10, p[2]!); rect(ctx, 139, 38, 4, 4, p[3]!);
}

function drawStall(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
  rect(ctx, 0, 0, 160, 52, '#26303b'); rect(ctx, 0, 52, 160, 28, '#3e3c3b');
  for (let x = 7; x < 155; x += 20) rect(ctx, x, 9 + (x % 5), 2, 2, p[3]!);
  rect(ctx, 20, 20, 120, 7, p[2]!); for (let x = 22; x < 140; x += 16) rect(ctx, x, 20, 8, 7, p[3]!);
  rect(ctx, 27, 27, 4, 36, '#5b3d2b'); rect(ctx, 129, 27, 4, 36, '#5b3d2b'); rect(ctx, 34, 31, 92, 26, p[1]!);
  rect(ctx, 42, 48, 76, 11, '#7b492d'); for (let x = 48; x < 115; x += 12) { rect(ctx, x, 43, 7, 5, '#f2c572'); rect(ctx, x + 2, 40, 3, 3, '#fff0ba'); }
  rect(ctx, 72, 32, 18, 9, '#d6d0bd'); rect(ctx, 76, 29, 10, 3, '#ede5cf');
}

export interface RendezvousPetArt {
  speciesId: string;
  accessory: PetAccessoryId;
}

function drawCharacter(ctx: CanvasRenderingContext2D, appearance: Appearance, x: number, y: number, flip = false): void {
  const canvas = document.createElement('canvas'); canvas.width = CHAR_W; canvas.height = CHAR_H;
  const character = canvas.getContext('2d'); if (!character) return;
  paintCharacterFrame(character, appearance, flip ? 2 : 1, 0);
  ctx.save();
  if (flip) { ctx.translate(x + 30, 0); ctx.scale(-1, 1); ctx.drawImage(canvas, 0, y, 30, 40); }
  else ctx.drawImage(canvas, x, y, 30, 40);
  ctx.restore();
}

function drawPet(ctx: CanvasRenderingContext2D, pet: RendezvousPetArt, x: number, y: number): void {
  const canvas = document.createElement('canvas'); canvas.width = PET_W; canvas.height = PET_H;
  const petContext = canvas.getContext('2d'); if (!petContext) return;
  paintPet(petContext, pet.speciesId, pet.accessory);
  ctx.drawImage(canvas, x, y, 23, 23);
}

export function paintResidentRendezvousScene(
  ctx: CanvasRenderingContext2D, scene: ResidentRendezvousDef,
  resident: Appearance, player: Appearance, pet: RendezvousPetArt | null = null,
): void {
  ctx.clearRect(0, 0, RENDEZVOUS_ART_W, RENDEZVOUS_ART_H);
  ctx.imageSmoothingEnabled = false;
  const drawers = { stage: drawStage, cafe: drawCafe, home: drawHome, shop: drawShop, forest: drawForest, station: drawStation, studio: drawStudio, stall: drawStall };
  drawers[scene.location](ctx, scene.palette);
  rect(ctx, 61, 71, 32, 3, 'rgba(22,18,21,.38)'); rect(ctx, 91, 71, 32, 3, 'rgba(22,18,21,.38)');
  drawCharacter(ctx, player, 62, 34, false);
  drawCharacter(ctx, resident, 92, 34, true);
  if (pet) { rect(ctx, 123, 72, 23, 2, 'rgba(22,18,21,.35)'); drawPet(ctx, pet, 123, 50); }
  rect(ctx, 87, 28, 2, 2, scene.palette[3]); rect(ctx, 83, 25, 1, 1, '#fff3ca'); rect(ctx, 122, 31, 1, 1, scene.palette[2]);
  rect(ctx, 0, 75, 160, 5, '#1e1b1d');
  rect(ctx, 6, 5, 19, 12, '#211d22aa'); rect(ctx, 9, 7, 13, 8, scene.palette[3]);
  ctx.fillStyle = scene.palette[0]; ctx.font = 'bold 7px monospace'; ctx.fillText(scene.mark.slice(0, 1), 13, 14);
}
