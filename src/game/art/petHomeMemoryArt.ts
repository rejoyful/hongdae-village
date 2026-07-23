import type { PetHomeMomentDef } from '../home/petHomeComfort';
import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import { paintPet, PET_H, PET_W } from './petArt';

export const PET_HOME_MEMORY_W = 176;
export const PET_HOME_MEMORY_H = 100;

type SceneMotif = 'rest' | 'soft' | 'green' | 'shelf' | 'screen' | 'tank' | 'door' | 'training'
  | 'lookout' | 'rug' | 'toy' | 'chairs' | 'sun' | 'reading' | 'stage' | 'audience' | 'spotlight';

export const PET_HOME_SCENE_MOTIFS: Readonly<Record<string, SceneMotif>> = {
  gentle_nearby_nap: 'rest', gentle_soft_guard: 'soft', gentle_green_company: 'green',
  curious_shelf_patrol: 'shelf', curious_screen_research: 'screen', curious_tank_watch: 'tank',
  brave_door_guard: 'door', brave_training_base: 'training', brave_lookout: 'lookout',
  playful_rug_zoom: 'rug', playful_toy_hide: 'toy', playful_chair_game: 'chairs',
  calm_long_nap: 'rest', calm_sun_corner: 'sun', calm_quiet_read: 'reading',
  performer_home_stage: 'stage', performer_audience_seat: 'audience', performer_spotlight: 'spotlight',
};

const PALETTES: Record<PetPersonalityId, readonly [string, string, string, string, string]> = {
  gentle: ['#ead9bd', '#a98770', '#6d7d69', '#efd58e', '#403b3a'],
  curious: ['#d7d3b9', '#708b86', '#6d718a', '#e6c36e', '#373d46'],
  brave: ['#d9c3a8', '#a56f59', '#637887', '#e6b95e', '#3e3a3d'],
  playful: ['#ead0a8', '#bd6f69', '#6e8b7b', '#efd066', '#403b45'],
  calm: ['#ddd4bd', '#87927d', '#7a7890', '#d9bb79', '#393d43'],
  performer: ['#d9c4b4', '#9a667d', '#5f7880', '#f0c66c', '#353541'],
};

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function room(ctx: CanvasRenderingContext2D, palette: readonly string[]): void {
  rect(ctx, palette[4]!, 0, 0, 176, 100); rect(ctx, palette[0]!, 3, 3, 170, 94);
  rect(ctx, palette[1]!, 3, 3, 170, 56); rect(ctx, '#f1dfba', 12, 12, 42, 29);
  rect(ctx, palette[4]!, 15, 15, 36, 23); rect(ctx, '#9fbea9', 18, 18, 30, 17);
  rect(ctx, 'rgba(249,224,163,.55)', 21, 18, 7, 34); rect(ctx, 'rgba(249,224,163,.34)', 32, 18, 14, 34);
  rect(ctx, palette[2]!, 3, 59, 170, 38); rect(ctx, 'rgba(36,34,40,.12)', 3, 70, 170, 3);
  for (let x = 7; x < 174; x += 18) rect(ctx, 'rgba(250,238,211,.12)', x, 60, 2, 37);
}

function drawMotif(ctx: CanvasRenderingContext2D, motif: SceneMotif, p: readonly string[]): { x: number; y: number } {
  if (motif === 'rest') {
    rect(ctx, p[4]!, 87, 48, 73, 29); rect(ctx, '#d6b187', 91, 52, 65, 21); rect(ctx, '#f0ddbc', 96, 55, 23, 11); rect(ctx, p[0]!, 121, 55, 31, 16);
    return { x: 66, y: 51 };
  }
  if (motif === 'soft') {
    rect(ctx, '#a67663', 77, 70, 77, 17); rect(ctx, '#e7d0aa', 84, 61, 28, 18); rect(ctx, '#c58b7b', 119, 64, 23, 15);
    rect(ctx, p[4]!, 127, 54, 4, 8); rect(ctx, p[4]!, 136, 54, 4, 8); return { x: 67, y: 47 };
  }
  if (motif === 'green' || motif === 'sun') {
    rect(ctx, '#725441', 121, 65, 22, 20); rect(ctx, '#516e55', 117, 48, 11, 21); rect(ctx, '#698768', 128, 42, 12, 27); rect(ctx, '#81966e', 139, 50, 10, 18);
    if (motif === 'sun') { rect(ctx, 'rgba(255,224,134,.35)', 55, 12, 83, 59); rect(ctx, p[3]!, 145, 25, 5, 40); }
    return { x: 80, y: 49 };
  }
  if (motif === 'shelf' || motif === 'reading') {
    rect(ctx, p[4]!, 102, 20, 51, 58); for (let y = 25; y < 73; y += 17) { rect(ctx, '#c49b6b', 107, y, 41, 4); for (let x = 109; x < 145; x += 7) rect(ctx, [p[2], p[3], '#a76c62'][x % 3]!, x, y - 10, 5, 10); }
    if (motif === 'reading') { rect(ctx, '#eee0be', 70, 69, 31, 13); rect(ctx, p[4]!, 84, 68, 3, 14); }
    return { x: 67, y: 48 };
  }
  if (motif === 'screen') {
    rect(ctx, p[4]!, 99, 31, 57, 42); rect(ctx, '#7ba4a0', 104, 36, 47, 29); rect(ctx, '#d3e0c5', 111, 42, 14, 9); rect(ctx, p[3]!, 130, 47, 14, 11); rect(ctx, '#72513c', 107, 73, 42, 8);
    return { x: 66, y: 49 };
  }
  if (motif === 'tank') {
    rect(ctx, p[4]!, 103, 31, 54, 47); rect(ctx, '#7aa7a5', 107, 35, 46, 34); rect(ctx, '#b5d1be', 107, 35, 46, 5); rect(ctx, '#d8bc6b', 111, 62, 38, 7);
    rect(ctx, '#e6cd74', 118, 46, 9, 5); rect(ctx, '#cf7f6e', 136, 52, 10, 5); rect(ctx, '#526f60', 115, 54, 3, 9); return { x: 67, y: 49 };
  }
  if (motif === 'door') {
    rect(ctx, p[4]!, 108, 15, 47, 68); rect(ctx, '#8f6048', 113, 20, 37, 61); rect(ctx, '#d4b26d', 142, 50, 5, 5); rect(ctx, '#6a5546', 91, 66, 18, 16); rect(ctx, '#c99c64', 94, 69, 12, 10);
    return { x: 69, y: 51 };
  }
  if (motif === 'training') {
    rect(ctx, '#754d3c', 112, 30, 6, 49); rect(ctx, '#c08a5c', 118, 34, 17, 35); rect(ctx, p[4]!, 119, 40, 15, 3); rect(ctx, p[3]!, 143, 52, 11, 11); rect(ctx, '#8e6a55', 100, 75, 58, 7);
    return { x: 66, y: 47 };
  }
  if (motif === 'lookout') {
    rect(ctx, p[4]!, 112, 18, 39, 56); rect(ctx, '#94b5aa', 116, 22, 31, 44); rect(ctx, '#d6c287', 120, 26, 3, 36); rect(ctx, '#d6c287', 127, 38, 14, 3); rect(ctx, '#7a5a48', 109, 72, 46, 7);
    return { x: 73, y: 48 };
  }
  if (motif === 'rug') {
    rect(ctx, '#c68e71', 65, 67, 91, 21); rect(ctx, '#e1bd87', 72, 71, 77, 13); for (let x = 77; x < 145; x += 14) rect(ctx, p[2]!, x, 75, 5, 5);
    rect(ctx, p[3]!, 55, 52, 8, 3); rect(ctx, p[3]!, 48, 58, 12, 3); return { x: 78, y: 44 };
  }
  if (motif === 'toy') {
    rect(ctx, '#d6b886', 105, 67, 48, 17); rect(ctx, '#b76861', 112, 58, 12, 11); rect(ctx, '#6e8790', 128, 52, 14, 17); rect(ctx, p[3]!, 144, 61, 9, 8); return { x: 70, y: 49 };
  }
  if (motif === 'chairs' || motif === 'audience') {
    for (let x = 99; x < 159; x += 29) { rect(ctx, '#72513e', x, 49, 20, 29); rect(ctx, '#d1a876', x + 3, 52, 14, 13); rect(ctx, '#72513e', x + 2, 76, 4, 10); rect(ctx, '#72513e', x + 14, 76, 4, 10); }
    return { x: motif === 'audience' ? 69 : 72, y: 43 };
  }
  if (motif === 'stage' || motif === 'spotlight') {
    rect(ctx, '#453746', 82, 16, 76, 62); rect(ctx, '#7f4960', 88, 22, 64, 50); rect(ctx, p[3]!, 119, 23, 4, 48); rect(ctx, '#4b3a35', 76, 75, 87, 10);
    if (motif === 'stage') { rect(ctx, '#d0a15e', 141, 40, 4, 31); rect(ctx, p[4]!, 134, 38, 18, 4); }
    else { ctx.fillStyle = 'rgba(255,225,145,.33)'; ctx.beginPath(); ctx.moveTo(105, 17); ctx.lineTo(83, 75); ctx.lineTo(140, 75); ctx.fill(); }
    return { x: 85, y: 43 };
  }
  return { x: 70, y: 49 };
}

export function paintPetHomeMemory(
  canvas: HTMLCanvasElement,
  moment: PetHomeMomentDef,
  petId: string,
  accessory: PetAccessoryId,
  recorded: boolean,
  count = 0,
): void {
  canvas.width = PET_HOME_MEMORY_W; canvas.height = PET_HOME_MEMORY_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const palette = PALETTES[moment.personality];
  room(ctx, palette);
  const motif = PET_HOME_SCENE_MOTIFS[moment.id] ?? 'soft';
  const petPosition = drawMotif(ctx, motif, palette);
  const petCanvas = document.createElement('canvas'); petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petContext = petCanvas.getContext('2d'); if (petContext) paintPet(petContext, petId, accessory);
  ctx.fillStyle = 'rgba(35,31,31,.2)'; ctx.beginPath(); ctx.ellipse(petPosition.x + 21, petPosition.y + 36, 23, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(petCanvas, petPosition.x, petPosition.y, 43, 43);
  rect(ctx, 'rgba(34,31,33,.84)', 3, 80, 170, 17); rect(ctx, palette[3], 9, 84, 12, 9);
  ctx.fillStyle = palette[4]; ctx.font = '900 7px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(moment.mark, 15, 88.5);
  ctx.fillStyle = '#f3e6cd'; ctx.textAlign = 'left'; ctx.fillText(moment.id.split('_').slice(1).join(' ').toUpperCase().slice(0, 17), 27, 88.5);
  ctx.textAlign = 'right'; ctx.fillText(recorded ? `ARCHIVE ×${Math.max(1, count)}` : 'UNKNOWN', 168, 88.5);
  if (!recorded) {
    rect(ctx, 'rgba(34,33,39,.68)', 3, 3, 170, 77);
    for (let x = -20; x < 190; x += 16) { ctx.fillStyle = 'rgba(239,225,196,.07)'; ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 7, 3); ctx.lineTo(x - 25, 80); ctx.lineTo(x - 32, 80); ctx.fill(); }
    rect(ctx, 'rgba(28,29,34,.82)', 74, 29, 29, 29); ctx.fillStyle = '#d8c59f'; ctx.font = '900 17px monospace'; ctx.textAlign = 'center'; ctx.fillText('?', 88.5, 43.5);
  }
}
