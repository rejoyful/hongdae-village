import type { LifeSpecialtyCardView } from '../progression/lifeSpecialty';

export const LIFE_SPECIALTY_ART_W = 96;
export const LIFE_SPECIALTY_ART_H = 64;

/** 생활 자격 카드를 작은 픽셀 인장으로 그린다. 외부 이미지 없이 30종 팔레트를 공유한다. */
export function paintLifeSpecialtyArt(canvas: HTMLCanvasElement, card: LifeSpecialtyCardView): void {
  canvas.width = LIFE_SPECIALTY_ART_W;
  canvas.height = LIFE_SPECIALTY_ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const [paper, accent, ink] = card.palette;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = card.unlocked ? paper : '#5d5850'; ctx.fillRect(0, 0, 96, 64);
  ctx.fillStyle = card.unlocked ? ink : '#37342f'; ctx.fillRect(3, 3, 90, 58);
  ctx.fillStyle = card.unlocked ? '#f2e8cc' : '#817b70'; ctx.fillRect(6, 6, 84, 52);
  ctx.fillStyle = card.unlocked ? accent : '#666159'; ctx.fillRect(6, 6, 84, 7); ctx.fillRect(6, 51, 84, 7);
  ctx.fillStyle = card.unlocked ? ink : '#44413c';
  ctx.fillRect(13, 19, 27, 27); ctx.fillRect(47, 20, 34, 4); ctx.fillRect(47, 28, 28, 3); ctx.fillRect(47, 36, 34, 3);
  ctx.fillStyle = card.unlocked ? paper : '#777168';
  const motif = (card.masteryId.length + card.tier * 3) % 4;
  if (motif === 0) { ctx.fillRect(20, 23, 13, 3); ctx.fillRect(25, 18, 3, 13); ctx.fillRect(20, 35, 13, 3); }
  else if (motif === 1) { ctx.fillRect(19, 23, 15, 4); ctx.fillRect(23, 19, 7, 17); ctx.fillRect(19, 32, 15, 4); }
  else if (motif === 2) { ctx.fillRect(19, 20, 4, 18); ctx.fillRect(31, 20, 4, 18); ctx.fillRect(23, 27, 8, 4); }
  else { ctx.fillRect(20, 20, 13, 4); ctx.fillRect(17, 24, 4, 11); ctx.fillRect(33, 24, 4, 11); ctx.fillRect(21, 35, 12, 4); }
  for (let index = 0; index < 3; index += 1) {
    ctx.fillStyle = index < card.tier && card.unlocked ? accent : '#aaa18f';
    ctx.fillRect(48 + index * 11, 44, 7, 4);
  }
  if (card.featured) {
    ctx.fillStyle = '#f5d878'; ctx.fillRect(80, 8, 7, 7); ctx.fillStyle = ink;
    ctx.fillRect(83, 8, 1, 7); ctx.fillRect(80, 11, 7, 1);
  }
}
