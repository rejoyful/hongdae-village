import { paintCharacterFrame } from './characterArt';
import {
  CHARACTER_ZINE_MOTIFS, CHARACTER_ZINE_ROLES, type CharacterZineCard,
} from '../progression/characterZine';

export const CHARACTER_ZINE_ART_W = 184;
export const CHARACTER_ZINE_ART_H = 112;
export type CharacterZineArtCard = Omit<CharacterZineCard, 'savedAt'>;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

/** 설정집 카드용 저해상도 픽셀 원화. 외형 스냅샷과 역할 팔레트가 한 장에 함께 남는다. */
export function paintCharacterZineArt(canvas: HTMLCanvasElement, card: CharacterZineArtCard, featured = false): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const role = CHARACTER_ZINE_ROLES.find((item) => item.id === card.roleId) ?? CHARACTER_ZINE_ROLES[0];
  const motif = CHARACTER_ZINE_MOTIFS.find((item) => item.id === card.motifId) ?? CHARACTER_ZINE_MOTIFS[0];
  const [deep, middle, accent, paper] = role.palette;
  ctx.clearRect(0, 0, CHARACTER_ZINE_ART_W, CHARACTER_ZINE_ART_H);
  ctx.imageSmoothingEnabled = false;
  rect(ctx, deep, 0, 0, CHARACTER_ZINE_ART_W, CHARACTER_ZINE_ART_H);
  rect(ctx, paper, 4, 4, CHARACTER_ZINE_ART_W - 8, CHARACTER_ZINE_ART_H - 8);
  rect(ctx, middle, 8, 8, 66, 96);
  rect(ctx, deep, 12, 12, 58, 88);
  rect(ctx, accent, 76, 8, 100, 6);
  rect(ctx, middle, 76, 18, 74, 4);
  rect(ctx, middle, 76, 26, 92, 3);
  rect(ctx, middle, 76, 33, 66, 3);
  rect(ctx, middle, 76, 62, 92, 2);
  rect(ctx, middle, 76, 70, 72, 2);
  rect(ctx, middle, 76, 78, 84, 2);
  rect(ctx, accent, 76, 91, 100, 13);
  ctx.globalAlpha = 0.22;
  for (let x = 82; x < 170; x += 14) {
    ctx.fillStyle = deep; ctx.fillRect(x, 42 + ((x / 14) % 2) * 5, 4, 4);
  }
  ctx.globalAlpha = 1;

  const portrait = document.createElement('canvas');
  portrait.width = 32; portrait.height = 48;
  const portraitContext = portrait.getContext('2d');
  if (portraitContext) paintCharacterFrame(portraitContext, card.appearance, card.direction, 0);
  ctx.drawImage(portrait, 10, 8, 64, 96);

  ctx.fillStyle = paper;
  ctx.font = 'bold 9px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(role.mark, 15, 15);
  ctx.fillStyle = deep;
  ctx.font = 'bold 10px monospace';
  ctx.fillText(motif.mark, 158, 18);
  ctx.font = 'bold 7px monospace';
  ctx.fillText(featured ? 'FEATURED OC' : 'CHARACTER FILE', 80, 94);
}
