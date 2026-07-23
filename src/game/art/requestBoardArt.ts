import type { VillageRequestProgress } from '../requests/villageRequests';

export const REQUEST_BOARD_ART_W = 600;
export const REQUEST_BOARD_ART_H = 210;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

/** 골목 의뢰소 상단 풍경. 도장·연속 이야기·평판이 실제 종이와 전구로 채워진다. */
export function paintRequestBoardArt(ctx: CanvasRenderingContext2D, progress: VillageRequestProgress): void {
  ctx.clearRect(0, 0, REQUEST_BOARD_ART_W, REQUEST_BOARD_ART_H);
  ctx.imageSmoothingEnabled = false;
  rect(ctx, '#aebbaa', 0, 0, 600, 83);
  rect(ctx, '#d9cdb2', 0, 83, 600, 127);
  rect(ctx, '#796553', 0, 161, 600, 49);
  for (let x = 0; x < 600; x += 30) rect(ctx, x % 60 ? '#8b7561' : '#705e50', x, 181, 28, 3);

  // 낮은 골목 건물과 간판
  rect(ctx, '#806c5c', 0, 32, 107, 131); rect(ctx, '#a18a70', 9, 43, 89, 120);
  rect(ctx, '#56645d', 19, 65, 30, 45); rect(ctx, '#6f5546', 59, 70, 30, 93);
  rect(ctx, '#6d7b6b', 493, 21, 107, 142); rect(ctx, '#899179', 503, 35, 89, 128);
  rect(ctx, '#4f5d57', 513, 61, 29, 50); rect(ctx, '#715d4b', 553, 68, 28, 95);

  // 중앙 의뢰 게시판
  rect(ctx, '#49382c', 128, 24, 344, 148);
  rect(ctx, '#8a6548', 135, 31, 330, 134);
  rect(ctx, '#b8885d', 146, 42, 308, 108);
  rect(ctx, '#5f4735', 151, 47, 298, 98);
  rect(ctx, '#a9855f', 157, 53, 286, 86);
  rect(ctx, '#44372e', 135, 165, 18, 45); rect(ctx, '#44372e', 447, 165, 18, 45);

  const paperColors = ['#efe1bd', '#d8d4b4', '#e4c8a6', '#c8d3b9', '#e6d6c5', '#d6c6a9'];
  for (let index = 0; index < 12; index += 1) {
    const col = index % 6; const row = Math.floor(index / 6);
    const x = 166 + col * 45; const y = 59 + row * 39 + (col % 2) * 3;
    const filled = index < Math.max(3, Math.ceil(progress.uniqueStamps / 2));
    rect(ctx, filled ? paperColors[index % paperColors.length]! : '#87765e', x, y, 35, 29);
    if (filled) {
      rect(ctx, '#6e5d4a', x + 6, y + 8, 23, 2); rect(ctx, '#8b7961', x + 6, y + 14, 17, 2);
      rect(ctx, '#a15f4e', x + 27, y + 21, 4, 4);
    }
    rect(ctx, '#c89f59', x + 16, y - 2, 4, 4);
  }

  // 8권 연속 이야기의 얇은 편지 서랍. 완결은 황동 띠, 수령 준비는 밝은 봉인으로 표시한다.
  const storyColors = ['#718477', '#9a745d', '#7d8c68', '#a07373', '#8f775c', '#7c815f', '#627e82', '#66705c'];
  for (let index = 0; index < 8; index += 1) {
    const x = 166 + index * 34;
    const complete = index < progress.storyRoutes;
    const hasPages = index * 3 < progress.storyChapters;
    rect(ctx, hasPages || complete ? storyColors[index]! : '#766958', x, 143, 27, 18);
    rect(ctx, complete ? '#d9bd74' : '#a58a63', x + 3, 147, 21, 2);
    rect(ctx, '#59483a', x + 12, 153, 4, 4);
  }
  if (progress.storyReady > 0) {
    rect(ctx, '#e9d69d', 427, 146, 11, 8);
    rect(ctx, '#617065', 431, 149, 3, 3);
  }

  // 평판 전구: 랭크만큼 점등
  rect(ctx, '#3f342c', 154, 15, 292, 3);
  for (let index = 0; index < 10; index += 1) {
    const x = 164 + index * 30;
    rect(ctx, index < progress.rank ? '#eed078' : '#665b4e', x, 13, 7, 7);
    if (index < progress.rank) rect(ctx, '#fff0a6', x + 2, 14, 3, 3);
  }

  // 벤치와 작은 우편함
  rect(ctx, '#584536', 29, 143, 80, 7); rect(ctx, '#785b43', 23, 151, 92, 7);
  rect(ctx, '#4d3b31', 31, 158, 8, 29); rect(ctx, '#4d3b31', 98, 158, 8, 29);
  rect(ctx, '#5c6b5e', 494, 127, 47, 36); rect(ctx, '#34463c', 498, 132, 39, 24);
  rect(ctx, '#d1ba75', 509, 140, 17, 3); rect(ctx, '#4b4338', 514, 163, 7, 30);

  // 바닥 잎과 종이 질감
  for (let index = 0; index < 46; index += 1) {
    const x = (index * 83 + 17) % 596; const y = 88 + ((index * 47) % 116);
    rect(ctx, index % 3 === 0 ? '#baaa88' : index % 3 === 1 ? '#6d725d' : '#d7c8a8', x, y, index % 4 === 0 ? 3 : 2, 2);
  }

  rect(ctx, '#efe3c6', 12, 12, 91, 25); rect(ctx, '#3e463f', 16, 16, 83, 17);
  ctx.fillStyle = '#efe3c6'; ctx.font = 'bold 10px monospace'; ctx.textBaseline = 'top';
  ctx.fillText(`RANK ${String(progress.rank).padStart(2, '0')}`, 27, 20);
}
