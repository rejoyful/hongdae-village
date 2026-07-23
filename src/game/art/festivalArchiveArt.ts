import type { FestivalId, FestivalView } from '../events/festivalArchive';

export const FESTIVAL_ART_W = 160;
export const FESTIVAL_ART_H = 72;

const fill = (context: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  context.fillStyle = color; context.fillRect(x, y, w, h);
};

function person(context: CanvasRenderingContext2D, x: number, y: number, coat: string, accent: string): void {
  fill(context, '#33251f', x + 2, y, 3, 3);
  fill(context, '#d5aa83', x + 1, y + 3, 5, 4);
  fill(context, coat, x, y + 7, 7, 8);
  fill(context, accent, x + 1, y + 9, 5, 2);
  fill(context, '#28232a', x + 1, y + 15, 2, 4); fill(context, '#28232a', x + 4, y + 15, 2, 4);
}

function bunting(context: CanvasRenderingContext2D, color: string, y: number): void {
  fill(context, '#d8c79e', 10, y, 140, 1);
  for (let x = 14; x < 148; x += 11) {
    fill(context, color, x, y + 1, 5, 3);
    fill(context, '#f1d487', x + 1, y + 4, 3, 2);
  }
}

function baseStreet(context: CanvasRenderingContext2D, view: FestivalView): void {
  fill(context, view.sky, 0, 0, FESTIVAL_ART_W, FESTIVAL_ART_H);
  fill(context, '#242735', 0, 29, FESTIVAL_ART_W, 43);
  fill(context, '#3e3a3d', 0, 52, FESTIVAL_ART_W, 20);
  fill(context, '#6f655b', 0, 55, FESTIVAL_ART_W, 2);
  fill(context, '#28262b', 0, 64, FESTIVAL_ART_W, 8);
  // 골목 상가 실루엣
  for (const [x, w, h] of [[4, 29, 27], [36, 35, 34], [75, 37, 29], [116, 40, 37]] as const) {
    fill(context, '#25242b', x, 52 - h, w, h);
    fill(context, '#16171e', x + 2, 52 - h + 3, w - 4, 2);
    for (let wx = x + 5; wx < x + w - 4; wx += 9) {
      fill(context, '#e5c982', wx, 52 - h + 8, 5, 5);
      fill(context, view.color, wx + 1, 52 - h + 9, 3, 3);
    }
  }
  fill(context, '#7c6950', 65, 41, 30, 12);
  fill(context, '#e6d0a0', 68, 44, 24, 5);
  fill(context, view.color, 70, 45, 20, 3);
  bunting(context, view.color, 11);
}

function drawMotif(context: CanvasRenderingContext2D, id: FestivalId, color: string): void {
  switch (id) {
    case 'lantern_encore':
      for (const x of [17, 42, 118, 141]) { fill(context, '#f6c86f', x, 20, 5, 7); fill(context, color, x + 1, 21, 3, 5); fill(context, '#ffeeb4', x + 2, 23, 1, 2); }
      fill(context, '#342b2b', 69, 48, 22, 3); fill(context, '#74513d', 73, 36, 3, 12); fill(context, '#d39a5d', 76, 36, 8, 3); fill(context, '#f2d187', 80, 39, 2, 8);
      break;
    case 'rain_postcard':
      for (let x = 8; x < 153; x += 13) { fill(context, '#91bfd0', x, 8 + (x % 5), 1, 4); fill(context, '#6c97a7', x - 1, 13 + (x % 5), 3, 1); }
      fill(context, '#52777d', 18, 56, 36, 5); fill(context, '#8bb2b1', 23, 55, 4, 2); fill(context, '#8bb2b1', 43, 55, 4, 2);
      break;
    case 'rooftop_table':
      fill(context, '#6f563d', 55, 50, 50, 5); fill(context, '#3a302a', 61, 55, 3, 9); fill(context, '#3a302a', 96, 55, 3, 9);
      for (const x of [62, 75, 88]) { fill(context, '#e4c48a', x, 46, 8, 4); fill(context, '#87a365', x + 2, 44, 4, 2); }
      break;
    case 'pet_parade':
      for (const x of [24, 46, 108, 130]) { fill(context, '#d8b585', x, 55, 7, 5); fill(context, color, x + 1, 53, 5, 3); fill(context, '#28232a', x + 1, 60, 2, 2); fill(context, '#28232a', x + 5, 60, 2, 2); }
      for (const x of [20, 39, 122, 141]) { fill(context, '#d9c8a5', x, 46, 2, 2); fill(context, '#d9c8a5', x - 2, 48, 2, 2); fill(context, '#d9c8a5', x + 2, 48, 2, 2); }
      break;
    case 'open_house':
      for (const x of [14, 47, 84, 124]) { fill(context, color, x, 29, 16, 12); fill(context, '#f7df9b', x + 3, 32, 4, 5); fill(context, '#f7df9b', x + 9, 32, 4, 5); fill(context, '#6c4a36', x + 6, 38, 4, 3); }
      break;
    case 'style_week':
      fill(context, '#1d1c24', 55, 47, 50, 4); fill(context, '#b28aa2', 61, 37, 10, 10); fill(context, '#6d8a9c', 76, 35, 10, 12); fill(context, '#a58a5e', 91, 38, 9, 9);
      fill(context, '#e5d6bb', 65, 39, 2, 5); fill(context, '#e5d6bb', 80, 37, 2, 6); fill(context, '#e5d6bb', 94, 40, 2, 5);
      break;
    case 'collector_market':
      for (const x of [18, 52, 91, 126]) { fill(context, color, x, 43, 25, 4); fill(context, '#4b392c', x + 2, 47, 2, 11); fill(context, '#4b392c', x + 21, 47, 2, 11); fill(context, '#e2bd79', x + 4, 39, 5, 4); fill(context, '#87a184', x + 13, 38, 6, 5); }
      break;
    case 'forest_observatory':
      for (const x of [10, 25, 135, 150]) { fill(context, '#283a34', x, 31, 7, 22); fill(context, '#506f5c', x - 5, 24, 17, 12); fill(context, '#789177', x - 2, 21, 11, 8); }
      fill(context, '#282833', 72, 43, 8, 13); fill(context, '#9fc1bc', 78, 39, 13, 5); fill(context, '#d9e6d8', 88, 38, 3, 3);
      for (const [x, y] of [[34, 8], [48, 17], [110, 10], [127, 19]] as const) fill(context, '#f6e6a2', x, y, 1, 1);
      break;
  }
}

export function paintFestivalArchiveArt(context: CanvasRenderingContext2D, view: FestivalView): void {
  context.clearRect(0, 0, FESTIVAL_ART_W, FESTIVAL_ART_H);
  context.imageSmoothingEnabled = false;
  baseStreet(context, view);
  drawMotif(context, view.id, view.color);
  person(context, 57, 45, view.color, '#f0d18a');
  person(context, 96, 45, '#657a83', view.color);
  // 준비 상태에 따라 광장 도장의 불빛이 하나씩 켜진다.
  for (let i = 0; i < view.required; i += 1) {
    fill(context, i < Math.min(view.completed, view.required) ? '#ffe39a' : '#514b4b', 71 + i * 9, 6, 5, 3);
  }
  if (view.claimed) {
    fill(context, '#f2d491', 142, 59, 11, 8); fill(context, view.color, 144, 61, 7, 4); fill(context, '#fff0b8', 147, 62, 1, 2);
  }
}
