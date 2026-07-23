import { CATALOG_BY_ID } from '../../items/catalog';
import {
  OBJECT_STORY_BY_ITEM, OBJECT_STORY_CHAPTER_BY_ID,
} from '../home/objectStories';

export const HOME_OBJECT_STORY_W = 300;
export const HOME_OBJECT_STORY_H = 180;

const rect = (
  ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number,
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const color = (hex: string | undefined, fallback: string): string => (
  hex && /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : fallback
);

function diamond(
  ctx: CanvasRenderingContext2D, fill: string, cx: number, cy: number, rx: number, ry: number,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry);
  ctx.lineTo(cx + rx, cy);
  ctx.lineTo(cx, cy + ry);
  ctx.lineTo(cx - rx, cy);
  ctx.closePath();
  ctx.fill();
}
function isoBlock(
  ctx: CanvasRenderingContext2D, top: string, front: string, side: string,
  x: number, y: number, w: number, h: number,
): void {
  const ry = Math.max(4, Math.round(w * .24));
  ctx.fillStyle = '#17131955';
  diamond(ctx, '#17131955', x + 4, y + h + 8, w * .62, ry * .72);
  rect(ctx, front, x - w / 2, y, w, h);
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2 + ry, y - ry);
  ctx.lineTo(x + w / 2 + ry, y + h - ry);
  ctx.lineTo(x + w / 2, y + h);
  ctx.closePath();
  ctx.fill();
  diamond(ctx, top, x, y, w / 2, ry);
}

function plant(
  ctx: CanvasRenderingContext2D, base: string, accent: string, x: number, y: number, wide = false,
): void {
  isoBlock(ctx, accent, base, '#4a4038', x, y, wide ? 44 : 28, wide ? 25 : 20);
  const leaf = '#657b5c';
  const light = '#9eaf78';
  const count = wide ? 8 : 5;
  for (let index = 0; index < count; index += 1) {
    const dx = (index - (count - 1) / 2) * (wide ? 7 : 6);
    const dy = (index % 3) * 4;
    diamond(ctx, index % 2 ? light : leaf, x + dx, y - 17 - dy, wide ? 9 : 7, 4);
  }
  rect(ctx, '#40513f', x - 1, y - 23, 3, 26);
}

function screen(
  ctx: CanvasRenderingContext2D, base: string, accent: string, x: number, y: number,
): void {
  isoBlock(ctx, accent, base, '#343039', x, y + 8, 70, 25);
  rect(ctx, '#292638', x - 29, y - 35, 58, 36);
  rect(ctx, '#7895a0', x - 25, y - 31, 50, 27);
  rect(ctx, '#d8c77d', x - 21, y - 26, 17, 3);
  rect(ctx, '#4a6572', x - 21, y - 19, 34, 3);
  rect(ctx, '#30313a', x - 3, y + 1, 6, 9);
}

function shelf(
  ctx: CanvasRenderingContext2D, base: string, accent: string, x: number, y: number, wide: boolean,
): void {
  const w = wide ? 88 : 58;
  isoBlock(ctx, accent, base, '#514035', x, y - 48, w, 76);
  for (let row = 0; row < 3; row += 1) {
    rect(ctx, '#3b302d', x - w / 2 + 6, y - 37 + row * 21, w - 12, 4);
    for (let book = 0; book < (wide ? 7 : 4); book += 1) {
      const colors = ['#9b675e', '#6f7d68', '#6d6885', '#c19a60'];
      rect(ctx, colors[(book + row) % colors.length]!, x - w / 2 + 9 + book * 10, y - 50 + row * 21, 6, 13);
    }
  }
}

function drawObject(
  ctx: CanvasRenderingContext2D, itemId: string, x: number, y: number,
): void {
  const def = CATALOG_BY_ID.get(itemId);
  if (!def) return;
  const base = color(def.color, '#90715d');
  const accent = color(def.accent, '#d3ad72');
  const name = def.name;
  if (def.category === 'rug') {
    diamond(ctx, '#15111655', x + 3, y + 10, 76, 25);
    diamond(ctx, base, x, y, 72, 23);
    diamond(ctx, accent, x, y, 56, 16);
    if (/체크/.test(name)) {
      for (let index = -3; index <= 3; index += 1) rect(ctx, base, x + index * 14 - 2, y - 12, 4, 24);
    }
    return;
  }
  if (def.category === 'plant') {
    plant(ctx, base, accent, x, y, /정원|세트/.test(name));
    return;
  }
  if (def.category === 'wall') {
    rect(ctx, '#17131866', x - 54, y - 61, 112, 82);
    rect(ctx, base, x - 50, y - 66, 100, 74);
    rect(ctx, accent, x - 44, y - 60, 88, 62);
    if (/포스터/.test(name)) {
      rect(ctx, '#36303b', x - 31, y - 50, 62, 42);
      diamond(ctx, '#d69077', x, y - 29, 22, 13);
    } else if (/시계/.test(name)) {
      ctx.fillStyle = '#f0dfbf'; ctx.beginPath(); ctx.arc(x, y - 29, 25, 0, Math.PI * 2); ctx.fill();
      rect(ctx, '#4a3c37', x - 1, y - 48, 3, 20); rect(ctx, '#4a3c37', x, y - 29, 15, 3);
    } else {
      for (let index = 0; index < 3; index += 1) rect(ctx, '#f0dfbf', x - 35 + index * 24, y - 51 + index * 5, 19, 28);
    }
    return;
  }
  if (/책장|수납장|옷장|냉장고|건조대/.test(name)) {
    if (/책장/.test(name)) shelf(ctx, base, accent, x, y, /와이드/.test(name));
    else {
      isoBlock(ctx, accent, base, '#4b3c37', x, y - 43, 66, 76);
      rect(ctx, '#332b2d', x - 3, y - 35, 3, 57);
      rect(ctx, accent, x + 21, y - 19, 4, 4);
    }
    return;
  }
  if (/PC|TV|노트북/.test(name)) {
    screen(ctx, base, accent, x, y - 2);
    return;
  }
  if (/침대|소파/.test(name)) {
    diamond(ctx, '#17131955', x + 4, y + 21, 76, 24);
    isoBlock(ctx, accent, base, '#51403b', x, y - 2, 116, 27);
    rect(ctx, accent, x - 52, y - 31, 104, 25);
    rect(ctx, '#eee0c3', x - 45, y - 26, /소파/.test(name) ? 32 : 42, 17);
    return;
  }
  if (/의자|스툴|타워/.test(name)) {
    isoBlock(ctx, accent, base, '#493b37', x, y - 3, 48, 24);
    if (!/스툴/.test(name)) rect(ctx, base, x - 22, y - 42, 44, 37);
    rect(ctx, '#403536', x - 17, y + 16, 5, 28); rect(ctx, '#403536', x + 12, y + 16, 5, 28);
    if (/타워/.test(name)) {
      rect(ctx, base, x - 31, y - 58, 8, 75); rect(ctx, base, x + 23, y - 58, 8, 75);
      rect(ctx, accent, x - 38, y - 63, 76, 10);
    }
    return;
  }
  if (/테이블|책상|식탁|조리대|싱크대|화장대/.test(name)) {
    isoBlock(ctx, accent, base, '#55433b', x, y - 4, /식탁|조리대|싱크대/.test(name) ? 100 : 82, 23);
    rect(ctx, '#423435', x - 35, y + 15, 6, 34); rect(ctx, '#423435', x + 29, y + 15, 6, 34);
    if (/싱크/.test(name)) diamond(ctx, '#8da6aa', x + 18, y - 8, 20, 6);
    return;
  }
  if (/어항/.test(name)) {
    isoBlock(ctx, accent, base, '#453b3b', x, y + 12, 74, 20);
    rect(ctx, '#365b68', x - 42, y - 45, 84, 56);
    rect(ctx, '#74a5ab', x - 38, y - 41, 76, 46);
    diamond(ctx, '#e0b45f', x - 12, y - 20, 9, 5); diamond(ctx, '#9c6b69', x + 19, y - 7, 8, 4);
    return;
  }
  if (/기타|마이크|스케이트/.test(name)) {
    if (/기타/.test(name)) {
      ctx.fillStyle = base; ctx.beginPath(); ctx.arc(x, y - 4, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x, y - 4, 11, 0, Math.PI * 2); ctx.fill();
      rect(ctx, base, x - 6, y - 70, 12, 56);
    } else if (/마이크/.test(name)) {
      rect(ctx, base, x - 3, y - 60, 6, 84); diamond(ctx, accent, x, y - 65, 12, 7);
      rect(ctx, '#3a3033', x - 28, y + 24, 56, 5);
    } else {
      diamond(ctx, base, x, y, 68, 16);
      rect(ctx, accent, x - 46, y - 4, 92, 8);
    }
    return;
  }
  if (/화분|꽃병/.test(name)) {
    plant(ctx, base, accent, x, y);
    return;
  }
  isoBlock(ctx, accent, base, '#4b3d39', x, y, 58, 42);
  rect(ctx, '#31292c', x - 19, y + 12, 38, 3);
}

/** 물건 하나의 색·형태·테마 장을 작은 2.5D 진열 카드로 그린다. */
export function paintHomeObjectStory(
  canvas: HTMLCanvasElement, itemId: string, observed: boolean, favorite = false,
): void {
  canvas.width = HOME_OBJECT_STORY_W;
  canvas.height = HOME_OBJECT_STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const story = OBJECT_STORY_BY_ITEM.get(itemId);
  const chapter = story ? OBJECT_STORY_CHAPTER_BY_ID.get(story.chapterId) : null;
  const palette = chapter?.palette ?? ['#302a2e', '#79675d', '#c39b69', '#ebdbc2'];
  const [ink, mid, accent, paper] = palette;
  const def = CATALOG_BY_ID.get(itemId);

  rect(ctx, '#151217', 0, 0, 300, 180);
  rect(ctx, ink, 5, 5, 290, 170);
  rect(ctx, mid, 9, 9, 282, 162);
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.moveTo(150, 44); ctx.lineTo(274, 84); ctx.lineTo(150, 150); ctx.lineTo(26, 84);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#241d22'; ctx.lineWidth = 3; ctx.stroke();
  ctx.globalAlpha = .18;
  for (let index = 1; index < 6; index += 1) {
    const t = index / 6;
    ctx.strokeStyle = mid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(150 + 124 * t, 44 + 40 * t); ctx.lineTo(26 + 124 * t, 84 + 66 * t); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150 - 124 * t, 44 + 40 * t); ctx.lineTo(274 - 124 * t, 84 + 66 * t); ctx.stroke();
  }
  ctx.globalAlpha = observed ? 1 : .24;
  drawObject(ctx, itemId, 150, 91);
  ctx.globalAlpha = 1;
  if (!observed) {
    rect(ctx, '#171319c9', 20, 22, 260, 126);
    ctx.fillStyle = '#897d78'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 150, 84);
    ctx.font = 'bold 7px monospace'; ctx.fillText('MEET THIS OBJECT IN YOUR ROOM', 150, 116);
  }
  rect(ctx, '#171319dd', 12, 12, 112, 29);
  rect(ctx, accent, 15, 15, 24, 23);
  ctx.fillStyle = ink; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(chapter?.mark ?? '?', 27, 26);
  ctx.textAlign = 'left'; ctx.fillStyle = paper; ctx.font = 'bold 6px monospace';
  ctx.fillText(chapter?.code ?? 'UNKNOWN OBJECT', 45, 24);
  ctx.fillStyle = accent; ctx.font = 'bold 8px sans-serif';
  ctx.fillText(observed ? (def?.name ?? '이름 없는 물건') : '아직 모르는 물건', 45, 34);
  if (favorite && observed) {
    rect(ctx, '#171319dd', 249, 12, 36, 24);
    ctx.fillStyle = '#f0ca70'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('★', 267, 24);
  }
}
