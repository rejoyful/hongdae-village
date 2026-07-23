import {
  HOME_GUESTBOOK_STICKER_BY_ID, HOME_GUESTBOOK_STICKER_KINDS,
  type HomeGuestbookStickerKind,
} from '../social/homeGuestbook';

export const HOME_GUESTBOOK_ART_W = 128;
export const HOME_GUESTBOOK_ART_H = 76;

function rect(context: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  context.fillStyle = color; context.fillRect(x, y, w, h);
}

/** 자유문구 없이 남기는 집들이 마음을 서로 다른 8종 픽셀 스티커 카드로 그린다. */
export function paintHomeGuestbookArt(canvas: HTMLCanvasElement, kind: HomeGuestbookStickerKind): void {
  canvas.width = HOME_GUESTBOOK_ART_W; canvas.height = HOME_GUESTBOOK_ART_H;
  const context = canvas.getContext('2d'); if (!context) return;
  const sticker = HOME_GUESTBOOK_STICKER_BY_ID.get(kind); if (!sticker) return;
  context.imageSmoothingEnabled = false; context.clearRect(0, 0, 128, 76);
  rect(context, '#28211c', 2, 3, 124, 70);
  rect(context, '#eee2c9', 5, 6, 118, 64);
  rect(context, sticker.deep, 5, 6, 118, 8);
  rect(context, sticker.color, 5, 64, 118, 6);
  rect(context, '#d2b98c', 10, 19, 108, 2);
  rect(context, sticker.color, 12, 24, 40, 34);
  rect(context, '#f7ecd5', 16, 28, 32, 26);
  drawMotif(context, kind, sticker.deep);
  rect(context, sticker.deep, 61, 26, 49, 5);
  rect(context, '#88735b', 61, 37, 43, 3);
  rect(context, '#a18b70', 61, 44, 49, 3);
  rect(context, sticker.color, 61, 52, 29, 5);
  rect(context, '#c19b55', 108, 17, 10, 9);
  rect(context, '#eee2c9', 111, 19, 4, 5);
}

function drawMotif(context: CanvasRenderingContext2D, kind: HomeGuestbookStickerKind, deep: string): void {
  const x = 21; const y = 31;
  rect(context, deep, x, y, 22, 3);
  if (kind === 'cozy') {
    rect(context, deep, x + 2, y + 3, 18, 10); rect(context, '#f7ecd5', x + 5, y + 6, 12, 4);
    rect(context, deep, x + 4, y - 5, 4, 5); rect(context, deep, x + 14, y - 7, 4, 7);
  } else if (kind === 'music') {
    rect(context, deep, x + 5, y - 7, 3, 18); rect(context, deep, x + 8, y - 7, 10, 3);
    rect(context, deep, x + 15, y - 4, 3, 14); rect(context, deep, x + 1, y + 8, 7, 5); rect(context, deep, x + 11, y + 7, 7, 5);
  } else if (kind === 'green') {
    rect(context, deep, x + 10, y - 6, 3, 19); rect(context, deep, x + 3, y - 4, 8, 6);
    rect(context, deep, x + 13, y - 1, 8, 6); rect(context, deep, x + 6, y + 11, 11, 4);
  } else if (kind === 'creator') {
    rect(context, deep, x + 2, y - 6, 18, 14); rect(context, '#f7ecd5', x + 5, y - 3, 12, 8);
    rect(context, deep, x + 8, y + 8, 6, 4); rect(context, deep, x + 5, y + 12, 12, 3);
  } else if (kind === 'pet') {
    rect(context, deep, x + 7, y + 2, 10, 9); rect(context, deep, x + 2, y - 4, 6, 7);
    rect(context, deep, x + 9, y - 7, 6, 7); rect(context, deep, x + 17, y - 4, 6, 7);
  } else if (kind === 'layout') {
    rect(context, deep, x + 2, y - 6, 5, 8); rect(context, deep, x + 15, y - 6, 5, 8);
    rect(context, deep, x + 9, y + 3, 5, 5); rect(context, deep, x + 2, y + 11, 18, 4);
  } else if (kind === 'color') {
    rect(context, '#bd6e74', x + 2, y - 7, 7, 9); rect(context, '#6e9295', x + 9, y - 7, 7, 9);
    rect(context, '#879865', x + 16, y - 7, 6, 9); rect(context, deep, x + 4, y + 5, 16, 8);
  } else {
    rect(context, deep, x + 3, y - 8, 16, 21); rect(context, '#f7ecd5', x + 7, y - 4, 8, 17);
    rect(context, deep, x + 12, y + 4, 2, 2);
  }
}

export function homeGuestbookArtIndex(kind: HomeGuestbookStickerKind): number {
  return HOME_GUESTBOOK_STICKER_KINDS.indexOf(kind);
}
