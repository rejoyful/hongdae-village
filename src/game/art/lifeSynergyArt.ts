import type { LifeSynergyDef } from '../progression/lifeSynergies';

export const LIFE_SYNERGY_ART_W = 180;
export const LIFE_SYNERGY_ART_H = 96;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

/** 세 전문성의 연결을 작은 별자리 카드로 그리는 저해상도 픽셀 렌더러. */
export function paintLifeSynergyArt(canvas: HTMLCanvasElement, synergy: LifeSynergyDef, discovered = true): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LIFE_SYNERGY_ART_W, LIFE_SYNERGY_ART_H);
  const [light, middle, deep] = synergy.palette;
  rect(ctx, '#28231f', 4, 4, 172, 88);
  rect(ctx, discovered ? deep : '#554f49', 7, 7, 166, 82);
  rect(ctx, discovered ? '#eadfc8' : '#8d857a', 11, 11, 158, 74);
  rect(ctx, discovered ? '#3c352f' : '#68615a', 15, 15, 150, 66);
  for (let x = 18; x < 164; x += 8) rect(ctx, discovered ? `${light}33` : '#ffffff12', x, 18 + ((x / 8) % 2) * 4, 2, 2);
  const nodes = [{ x: 48, y: 58 }, { x: 90, y: 30 }, { x: 132, y: 58 }];
  ctx.strokeStyle = discovered ? light : '#857e75'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(nodes[0]!.x, nodes[0]!.y); ctx.lineTo(nodes[1]!.x, nodes[1]!.y); ctx.lineTo(nodes[2]!.x, nodes[2]!.y); ctx.stroke();
  ctx.strokeStyle = discovered ? middle : '#625c55'; ctx.lineWidth = 2; ctx.stroke();
  nodes.forEach((node, index) => {
    rect(ctx, '#28231f', node.x - 11, node.y - 11, 22, 22);
    rect(ctx, discovered ? [middle, light, deep][index]! : '#6e6760', node.x - 8, node.y - 8, 16, 16);
    rect(ctx, discovered ? '#f1dfb7' : '#aaa299', node.x - 3, node.y - 3, 6, 6);
  });
  rect(ctx, '#28231f', 80, 68, 20, 14);
  rect(ctx, discovered ? light : '#777067', 83, 70, 14, 9);
  ctx.fillStyle = discovered ? '#2f2924' : '#48423d';
  ctx.font = '900 8px ui-monospace, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(discovered ? synergy.mark : '?', 90, 75);
}
