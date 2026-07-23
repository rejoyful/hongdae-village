import type { HomeMoodboardDef } from '../home/homeMoodboards';

export const HOME_MOODBOARD_ART_W = 240;
export const HOME_MOODBOARD_ART_H = 140;

const pixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** 테마 팔레트와 실제 게임 가구 미리보기를 합성한 작은 아이소메트릭 방 카드. */
export function paintHomeMoodboardArt(
  canvas: HTMLCanvasElement,
  board: HomeMoodboardDef,
  furniture: readonly (CanvasImageSource | null)[],
): void {
  canvas.width = HOME_MOODBOARD_ART_W; canvas.height = HOME_MOODBOARD_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const [paper, warm, cool, ink] = board.palette;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pixelRect(ctx, 0, 0, 240, 140, ink);
  pixelRect(ctx, 4, 4, 232, 132, paper);

  // 뒷벽 두 면과 픽셀 테두리.
  ctx.fillStyle = cool; ctx.beginPath(); ctx.moveTo(120, 13); ctx.lineTo(225, 42); ctx.lineTo(225, 80); ctx.lineTo(120, 51); ctx.closePath(); ctx.fill();
  ctx.fillStyle = warm; ctx.beginPath(); ctx.moveTo(15, 42); ctx.lineTo(120, 13); ctx.lineTo(120, 51); ctx.lineTo(15, 80); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(15, 42); ctx.lineTo(120, 13); ctx.lineTo(225, 42); ctx.lineTo(225, 80); ctx.stroke();
  ctx.globalAlpha = .18; pixelRect(ctx, 28, 43, 56, 3, paper); pixelRect(ctx, 152, 43, 50, 3, paper); ctx.globalAlpha = 1;

  // 아이소메트릭 바닥과 타일 결.
  ctx.fillStyle = paper; ctx.beginPath(); ctx.moveTo(120, 49); ctx.lineTo(225, 80); ctx.lineTo(120, 130); ctx.lineTo(15, 80); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = warm; ctx.globalAlpha = .34; ctx.lineWidth = 1;
  for (let i = 1; i < 6; i += 1) {
    const t = i / 6;
    ctx.beginPath(); ctx.moveTo(120 + (225 - 120) * t, 49 + (80 - 49) * t); ctx.lineTo(15 + (120 - 15) * t, 80 + (130 - 80) * t); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(120 + (15 - 120) * t, 49 + (80 - 49) * t); ctx.lineTo(225 + (120 - 225) * t, 80 + (130 - 80) * t); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke();

  // 가구 그림자와 실제 인게임 텍스처 미리보기. 앞쪽일수록 크게 보여 깊이를 만든다.
  const spots = [
    { x: 47, y: 57, w: 62, h: 48 }, { x: 132, y: 52, w: 58, h: 45 },
    { x: 71, y: 80, w: 64, h: 49 }, { x: 139, y: 78, w: 68, h: 51 },
  ];
  spots.forEach((spot, index) => {
    ctx.fillStyle = ink; ctx.globalAlpha = .18; ctx.beginPath(); ctx.ellipse(spot.x + spot.w / 2, spot.y + spot.h - 4, spot.w * .32, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    const source = furniture[index];
    if (source) ctx.drawImage(source, spot.x, spot.y, spot.w, spot.h);
    else {
      pixelRect(ctx, spot.x + 15, spot.y + 17, spot.w - 30, spot.h - 19, index % 2 ? cool : warm);
      pixelRect(ctx, spot.x + 11, spot.y + 12, spot.w - 22, 7, paper);
      pixelRect(ctx, spot.x + 15, spot.y + spot.h - 5, 5, 5, ink);
      pixelRect(ctx, spot.x + spot.w - 20, spot.y + spot.h - 5, 5, 5, ink);
    }
  });

  // 도장과 순번은 작은 카드에서도 테마를 구분하는 수집 표식.
  pixelRect(ctx, 12, 10, 31, 31, paper); pixelRect(ctx, 15, 13, 25, 25, warm);
  ctx.fillStyle = ink; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(board.mark, 27.5, 25.5);
  ctx.fillStyle = paper; ctx.font = '800 8px ui-monospace, monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText(`ROOM STUDY ${String(board.order).padStart(2, '0')}`, 226, 129);
}
