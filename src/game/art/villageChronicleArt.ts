import type { ChronicleChapterView } from '../progression/villageChronicle';

export const CHRONICLE_ART_W = 320;
export const CHRONICLE_ART_H = 180;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const text = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, align: CanvasTextAlign = 'left'): void => {
  ctx.textAlign = align; ctx.fillText(value, x, y);
};
const star = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, size = 3): void => {
  rect(ctx, color, x + size, y, size, size * 3); rect(ctx, color, x, y + size, size * 3, size);
};

function person(ctx: CanvasRenderingContext2D, x: number, y: number, shirt: string, hair: string, flip = false): void {
  rect(ctx, '#3f3b40', x + 4, y + 28, 13, 5);
  rect(ctx, shirt, x + 2, y + 13, 17, 16);
  rect(ctx, '#c99270', x + 5, y + 4, 12, 12);
  rect(ctx, hair, x + (flip ? 8 : 4), y + 1, 11, 7);
  rect(ctx, '#443d3e', x + (flip ? 7 : 14), y + 8, 2, 2);
}

function drawScene(ctx: CanvasRenderingContext2D, view: ChronicleChapterView): void {
  const [primary, paper, accent, ink] = view.palette;
  rect(ctx, ink, 0, 0, CHRONICLE_ART_W, CHRONICLE_ART_H);
  rect(ctx, paper, 5, 5, 310, 170);
  rect(ctx, primary, 5, 5, 310, 96);
  rect(ctx, accent, 5, 101, 310, 74);

  if (view.chapter === 1) {
    rect(ctx, ink, 22, 27, 88, 66); rect(ctx, '#e8d8ad', 28, 33, 76, 54);
    for (let i = 0; i < 5; i += 1) { rect(ctx, accent, 35 + i * 12, 45 + (i % 2) * 9, 19, 3); rect(ctx, '#b36e58', 41 + i * 10, 64 - (i % 3) * 6, 4, 4); }
    rect(ctx, ink, 48, 92, 7, 38); rect(ctx, ink, 88, 92, 7, 38);
    person(ctx, 211, 63, '#6f8390', '#4e403a'); person(ctx, 246, 67, '#a66e6b', '#675049', true);
  } else if (view.chapter === 2) {
    rect(ctx, ink, 28, 38, 94, 67); rect(ctx, '#e6c99a', 35, 45, 80, 60);
    rect(ctx, primary, 45, 64, 22, 41); rect(ctx, '#b9d2c4', 78, 54, 27, 25); rect(ctx, ink, 90, 54, 3, 25); rect(ctx, ink, 78, 65, 27, 3);
    rect(ctx, '#e7c76f', 50, 54, 10, 10); star(ctx, '#f4d67e', 196, 38); star(ctx, paper, 232, 24);
    person(ctx, 212, 71, '#7a8c72', '#58443d'); rect(ctx, '#765947', 248, 83, 24, 13); rect(ctx, '#d6b983', 252, 86, 16, 7);
  } else if (view.chapter === 3) {
    rect(ctx, '#76563f', 31, 78, 105, 11); rect(ctx, '#5c4939', 38, 89, 8, 35); rect(ctx, '#5c4939', 120, 89, 8, 35);
    rect(ctx, paper, 47, 55, 31, 23); rect(ctx, '#7e946e', 53, 48, 19, 10); rect(ctx, '#557150', 59, 39, 5, 15);
    rect(ctx, '#b57b5f', 88, 61, 29, 17); rect(ctx, '#dbbd80', 93, 65, 19, 8);
    for (let i = 0; i < 4; i += 1) { rect(ctx, ink, 183 + i * 21, 84 - i * 5, 9, 5); rect(ctx, ink, 186 + i * 21, 79 - i * 5, 4, 4); }
    person(ctx, 250, 68, '#a0745c', '#4b403b', true);
  } else if (view.chapter === 4) {
    rect(ctx, '#6f513d', 41, 78, 181, 12); rect(ctx, '#554136', 55, 90, 8, 28); rect(ctx, '#554136', 201, 90, 8, 28);
    for (let i = 0; i < 4; i += 1) person(ctx, 61 + i * 44, 39 + (i % 2) * 6, ['#8d6d65', '#6d8377', '#8b7995', '#b08660'][i]!, ['#4a3e3a', '#6a5142', '#403b43', '#7a5c46'][i]!, i % 2 > 0);
    rect(ctx, '#d4ad6a', 244, 45, 27, 41); rect(ctx, ink, 249, 50, 17, 31); rect(ctx, '#e7c67c', 253, 59, 9, 9);
    for (let i = 0; i < 5; i += 1) star(ctx, '#efd67f', 32 + i * 58, 18 + (i % 2) * 8, 2);
  } else if (view.chapter === 5) {
    rect(ctx, '#6e5845', 26, 27, 117, 79); rect(ctx, '#d8c49c', 33, 34, 103, 65);
    for (let i = 0; i < 6; i += 1) {
      const x = 42 + (i % 3) * 30; const y = 45 + Math.floor(i / 3) * 30;
      rect(ctx, primary, x, y, 20, 18); rect(ctx, accent, x + 5, y + 4, 10, 10);
    }
    person(ctx, 195, 69, '#9b6d76', '#51423c'); rect(ctx, ink, 228, 65, 52, 37); rect(ctx, paper, 234, 71, 40, 25); star(ctx, '#e9c76e', 249, 78);
  } else if (view.chapter === 6) {
    rect(ctx, ink, 26, 24, 124, 78); rect(ctx, '#ead8ad', 33, 31, 110, 64);
    for (let i = 0; i < 4; i += 1) { rect(ctx, [primary, accent, '#a97962', '#758598'][i]!, 43, 40 + i * 12, 79 + i * 4, 7); rect(ctx, ink, 126, 40 + i * 12, 8, 7); }
    rect(ctx, '#72533e', 185, 75, 101, 12); rect(ctx, '#554237', 194, 87, 8, 29); rect(ctx, '#554237', 269, 87, 8, 29);
    person(ctx, 220, 43, '#748777', '#4a403b'); star(ctx, '#edcf79', 276, 36);
  } else if (view.chapter === 7) {
    rect(ctx, '#5b4a3d', 29, 25, 99, 81); rect(ctx, '#dfcca3', 36, 32, 85, 67);
    for (let i = 0; i < 7; i += 1) { rect(ctx, i % 2 ? primary : accent, 44, 41 + i * 7, 58 + (i % 3) * 8, 3); }
    rect(ctx, '#c59a5e', 135, 78, 17, 11); rect(ctx, ink, 139, 68, 9, 18);
    rect(ctx, ink, 181, 30, 102, 75); rect(ctx, '#d6c39c', 188, 37, 88, 61);
    for (let i = 0; i < 6; i += 1) { rect(ctx, primary, 196 + (i % 3) * 25, 48 + Math.floor(i / 3) * 27, 17, 17); star(ctx, '#e7ca72', 200 + (i % 3) * 25, 52 + Math.floor(i / 3) * 27, 2); }
  } else {
    rect(ctx, '#27364a', 5, 5, 310, 110); rect(ctx, '#52636c', 5, 115, 310, 60);
    for (let i = 0; i < 11; i += 1) star(ctx, i % 3 ? '#e4c875' : '#c9d8cf', 24 + i * 27, 18 + (i % 4) * 13, i % 4 === 0 ? 3 : 2);
    rect(ctx, ink, 43, 101, 232, 8); for (let i = 0; i < 7; i += 1) person(ctx, 54 + i * 34, 69 + (i % 3) * 5, ['#a36e6a', '#71877c', '#967b96', '#b28c63'][i % 4]!, '#4a4040', i % 2 > 0);
    star(ctx, '#f0d272', 151, 37, 5);
  }

  // 선택한 루트는 장면 위 책갈피 리본으로, 완성 원고는 금빛 인장으로 표시한다.
  rect(ctx, 'rgba(42,40,42,.86)', 12, 130, 296, 33);
  ctx.font = '900 9px monospace'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f0e6d1';
  text(ctx, view.code, 21, 140);
  ctx.font = '900 8px monospace'; ctx.fillStyle = '#d6c49d';
  text(ctx, view.selectedRouteId ? 'ROUTE BOOKMARKED' : view.status === 'locked' ? 'NEXT CHAPTER' : 'CHOOSE YOUR ROUTE', 21, 153);
  ctx.font = '900 9px monospace'; ctx.fillStyle = view.reflection ? '#f0ce73' : '#f0e6d1';
  text(ctx, view.reflection ? `${view.reflection.mark} ARCHIVED` : view.status.toUpperCase(), 299, 146, 'right');
  if (view.featured) { star(ctx, '#f2d170', 282, 15, 3); star(ctx, '#f2d170', 296, 25, 2); }

  if (view.status === 'locked') {
    rect(ctx, 'rgba(35,38,42,.58)', 5, 5, 310, 125);
    rect(ctx, ink, 145, 51, 31, 25); rect(ctx, '#d7bd87', 150, 59, 21, 17); rect(ctx, ink, 153, 46, 15, 19);
  }
}

export function paintVillageChronicleArt(canvas: HTMLCanvasElement, view: ChronicleChapterView): void {
  canvas.width = CHRONICLE_ART_W; canvas.height = CHRONICLE_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  drawScene(ctx, view);
}
