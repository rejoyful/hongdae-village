import { paintPet, PET_H, PET_W } from './petArt';
import { PET_PERSONALITIES } from '../pets/petProfiles';
import {
  PET_STYLE_BACKDROPS, PET_STYLE_POSES, type PetStyleDraft,
} from '../pets/petStyleStudio';

export const PET_STYLE_ART_W = 480;
export const PET_STYLE_ART_H = 230;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function shade(color: string, amount: number): string {
  const raw = color.replace('#', '');
  const value = Number.parseInt(raw, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function diamond(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2); ctx.lineTo(cx - w / 2, cy);
  ctx.closePath(); ctx.fill();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  draft: PetStyleDraft,
  colors: readonly [string, string, string, string],
) {
  const [dark, mid, accent, paper] = colors;
  rect(ctx, '#17151a', 0, 0, PET_STYLE_ART_W, PET_STYLE_ART_H);
  rect(ctx, dark, 0, 0, 480, 146);
  rect(ctx, shade(dark, 17), 0, 146, 480, 84);
  if (draft.backdropId === 'cozy_home') {
    rect(ctx, shade(mid, -35), 27, 31, 112, 90);
    for (let shelf = 0; shelf < 3; shelf += 1) {
      rect(ctx, accent, 37, 56 + shelf * 23, 92, 4);
      rect(ctx, shelf % 2 ? paper : mid, 45, 42 + shelf * 23, 16, 14);
      rect(ctx, dark, 73, 45 + shelf * 23, 13, 11);
      rect(ctx, paper, 103, 40 + shelf * 23, 12, 16);
    }
    rect(ctx, accent, 385, 52, 9, 77); rect(ctx, paper, 362, 44, 55, 12);
  } else if (draft.backdropId === 'roof_garden') {
    rect(ctx, shade(mid, -35), 20, 78, 120, 55);
    for (let pot = 0; pot < 5; pot += 1) {
      rect(ctx, pot % 2 ? accent : paper, 31 + pot * 23, 104, 15, 15);
      rect(ctx, mid, 35 + pot * 23, 85 - (pot % 3) * 7, 7, 20);
      rect(ctx, shade(accent, 20), 27 + pot * 23, 84 - (pot % 3) * 7, 15, 7);
    }
    rect(ctx, paper, 370, 29, 74, 5); rect(ctx, accent, 397, 34, 8, 83);
  } else if (draft.backdropId === 'rain_window') {
    rect(ctx, shade(mid, -42), 27, 25, 129, 103);
    rect(ctx, mid, 34, 32, 115, 89);
    rect(ctx, dark, 40, 38, 103, 77);
    rect(ctx, paper, 89, 38, 4, 77); rect(ctx, paper, 40, 75, 103, 4);
    for (let drop = 0; drop < 10; drop += 1) rect(ctx, accent, 48 + (drop * 29) % 88, 45 + (drop * 17) % 60, 2, 8);
    rect(ctx, shade(accent, -25), 362, 104, 88, 11);
  } else if (draft.backdropId === 'little_stage') {
    rect(ctx, shade(mid, -44), 0, 0, 74, 142); rect(ctx, shade(mid, -44), 406, 0, 74, 142);
    for (let fold = 0; fold < 4; fold += 1) {
      rect(ctx, fold % 2 ? mid : shade(mid, -18), fold * 18, 0, 18, 142);
      rect(ctx, fold % 2 ? shade(mid, -18) : mid, 408 + fold * 18, 0, 18, 142);
    }
    rect(ctx, paper, 137, 22, 206, 7);
    for (let bulb = 0; bulb < 9; bulb += 1) rect(ctx, accent, 147 + bulb * 23, 34, 7, 7);
  } else if (draft.backdropId === 'forest_star') {
    for (let tree = 0; tree < 6; tree += 1) {
      rect(ctx, shade(mid, -38), tree * 88 - 15, 69 - (tree % 2) * 17, 54, 80);
      rect(ctx, mid, tree * 88 - 27, 51 - (tree % 2) * 17, 79, 39);
      rect(ctx, shade(accent, -20), tree * 88 - 9, 34 - (tree % 2) * 17, 45, 32);
    }
    for (let star = 0; star < 15; star += 1) rect(ctx, star % 3 ? paper : accent, 17 + star * 31, 11 + (star * 13) % 48, star % 4 ? 2 : 3, star % 4 ? 2 : 3);
  } else {
    rect(ctx, shade(mid, -40), 24, 28, 113, 84);
    rect(ctx, mid, 30, 34, 101, 72);
    rect(ctx, dark, 36, 40, 89, 60);
    rect(ctx, paper, 43, 48, 28, 4);
    rect(ctx, accent, 43, 60, 65, 7);
    rect(ctx, shade(mid, 25), 43, 75, 49, 5);
    rect(ctx, shade(accent, -45), 362, 26, 85, 104);
    for (let sign = 0; sign < 3; sign += 1) {
      rect(ctx, sign % 2 ? accent : paper, 371, 39 + sign * 27, 67, 15);
      rect(ctx, dark, 378, 44 + sign * 27, 35, 4);
    }
  }
  rect(ctx, shade(accent, -56), 0, 142, 480, 8);
  diamond(ctx, shade(accent, -69), 240, 193, 445, 68);
  diamond(ctx, shade(accent, -34), 240, 184, 445, 57);
  diamond(ctx, `${paper}33`, 240, 178, 284, 34);
}

function drawPetPose(ctx: CanvasRenderingContext2D, draft: PetStyleDraft) {
  const source = document.createElement('canvas');
  source.width = PET_W; source.height = PET_H;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) return;
  paintPet(sourceContext, draft.petId, draft.accessoryId);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const pose = PET_STYLE_POSES.find((item) => item.id === draft.poseId) ?? PET_STYLE_POSES[0]!;
  const scale = draft.poseId === 'spotlight' ? 6.5 : draft.poseId === 'daydream' ? 5.7 : 6.1;
  const width = PET_W * scale;
  const height = PET_H * scale;
  let x = 240 - width / 2;
  let y = 166 - height;
  if (draft.poseId === 'look_back') {
    ctx.translate(480, 0); ctx.scale(-1, 1);
    x = 240 - width / 2;
  } else if (draft.poseId === 'tiny_step') {
    x += 18; y -= 7;
  } else if (draft.poseId === 'daydream') {
    y += 13;
  } else if (draft.poseId === 'spotlight') {
    y -= 9;
  }
  ctx.drawImage(source, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  ctx.restore();
  if (draft.poseId === 'tiny_step') {
    rect(ctx, '#ffffff35', 180, 165, 17, 4); rect(ctx, '#ffffff25', 150, 174, 12, 3);
  } else if (draft.poseId === 'daydream') {
    ctx.fillStyle = '#fff0cc'; ctx.font = '900 14px ui-monospace, monospace';
    ctx.fillText('z', 310, 75); ctx.font = '900 9px ui-monospace, monospace'; ctx.fillText('z', 329, 91);
  } else if (draft.poseId === 'spotlight') {
    rect(ctx, '#fff2c555', 177, 42, 126, 5);
    rect(ctx, '#fff2c533', 190, 47, 100, 7);
  }
  rect(ctx, '#1a161bcc', 165, 168, 150, 19);
  ctx.fillStyle = '#fff0db'; ctx.font = '900 9px ui-monospace, monospace';
  ctx.fillText(`${pose.code} · ${draft.petName}`.slice(0, 28), 177, 174);
}

export function paintPetStyleCard(canvas: HTMLCanvasElement, draft: PetStyleDraft): void {
  canvas.width = PET_STYLE_ART_W;
  canvas.height = PET_STYLE_ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const backdrop = PET_STYLE_BACKDROPS.find((item) => item.id === draft.backdropId) ?? PET_STYLE_BACKDROPS[0]!;
  const personality = PET_PERSONALITIES.find((item) => item.id === draft.personalityId) ?? PET_PERSONALITIES[0]!;
  drawBackground(ctx, draft, backdrop.colors);
  drawPetPose(ctx, draft);
  rect(ctx, '#151319d9', 11, 10, 143, 23);
  ctx.fillStyle = backdrop.colors[3]; ctx.font = '900 8px ui-monospace, monospace';
  ctx.fillText('COMPANION STYLE STUDIO', 19, 16);
  ctx.fillStyle = backdrop.colors[2]; ctx.font = '900 7px ui-monospace, monospace';
  ctx.fillText(`${backdrop.code} · ${personality.mark}`, 19, 26);
  rect(ctx, backdrop.colors[2], 349, 119, 113, 19);
  ctx.fillStyle = backdrop.colors[0]; ctx.font = '900 7px ui-monospace, monospace';
  ctx.fillText(`${personality.name} 동행`.slice(0, 18), 359, 125);
}
