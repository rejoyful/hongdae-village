import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import {
  PHOTO_BACKDROPS, PHOTO_FOILS, PHOTO_FRAMES, PHOTO_POSES, PHOTO_STICKERS,
  type PhotoBackdropId, type PhotoCardDecoration, type PhotoRecord,
} from '../photo/photoAlbum';

export const PHOTO_STRIP_W = 120;
export const PHOTO_STRIP_H = 268;
export const PHOTO_CARD_W = 188;
export const PHOTO_CARD_H = 332;

type Rect = { x: number; y: number; w: number; h: number };

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawAlley(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#c7d7ce', r.x, r.y, r.w, 17);
  rect(ctx, '#b97658', r.x, r.y + 17, 37, 25);
  rect(ctx, '#d6aa78', r.x + 37, r.y + 12, 36, 30);
  rect(ctx, '#8e6750', r.x + 73, r.y + 19, r.w - 73, 23);
  for (let y = r.y + 20; y < r.y + 39; y += 6) {
    for (let x = r.x + ((y / 6) % 2 ? 2 : 6); x < r.x + 35; x += 12) rect(ctx, '#875342', x, y, 7, 1);
  }
  rect(ctx, '#39524a', r.x + 44, r.y + 19, 20, 10);
  rect(ctx, '#e7d3a8', r.x + 47, r.y + 22, 14, 2);
  rect(ctx, '#776352', r.x, r.y + 42, r.w, r.h - 42);
  rect(ctx, variant % 2 ? '#6e8671' : '#ad7f59', r.x + 5, r.y + 38, 10, 6);
  rect(ctx, '#35463a', r.x + 7, r.y + 34, 6, 6);
}

function drawStudio(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#e9ddc6', r.x, r.y, r.w, r.h);
  for (let x = r.x; x < r.x + r.w; x += 12) rect(ctx, x % 24 ? '#dfcfb6' : '#f0e6d4', x, r.y, 6, r.h);
  rect(ctx, '#9b7f65', r.x, r.y + r.h - 9, r.w, 9);
  rect(ctx, '#718372', r.x + 7 + variant * 3, r.y + 9, 13, 16);
  rect(ctx, '#c68b67', r.x + r.w - 25, r.y + 8, 16, 4);
  rect(ctx, '#c68b67', r.x + r.w - 19, r.y + 4, 4, 16);
}

function drawGarden(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#b9d0c2', r.x, r.y, r.w, 27);
  rect(ctx, '#829a78', r.x, r.y + 27, r.w, r.h - 27);
  rect(ctx, '#657a5d', r.x, r.y + r.h - 8, r.w, 8);
  rect(ctx, '#674d36', r.x + 12, r.y + 13, 5, 25);
  rect(ctx, '#4f7557', r.x + 3, r.y + 5, 24, 17);
  rect(ctx, '#688c67', r.x + 20, r.y + 8, 15, 13);
  for (const [dx, dy] of [[38, 32], [48, 36], [88, 31], [95, 38]] as const) {
    rect(ctx, variant % 2 ? '#e5bc7e' : '#d79883', r.x + dx, r.y + dy, 2, 2);
    rect(ctx, '#52684e', r.x + dx, r.y + dy + 2, 1, 4);
  }
}

function drawRoom(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#d9c8aa', r.x, r.y, r.w, r.h - 10);
  for (let y = r.y + 5; y < r.y + r.h - 12; y += 9) rect(ctx, '#c9b693', r.x, y, r.w, 1);
  rect(ctx, '#8b6548', r.x, r.y + r.h - 10, r.w, 10);
  rect(ctx, '#6f806f', r.x + 4, r.y + 26, 35, 15);
  rect(ctx, '#879784', r.x + 8, r.y + 23, 27, 6);
  rect(ctx, '#5a4435', r.x + r.w - 19, r.y + 13, 2, 27);
  rect(ctx, variant % 2 ? '#d6a85d' : '#c48b69', r.x + r.w - 26, r.y + 10, 16, 8);
  rect(ctx, '#f1d9a1', r.x + r.w - 22, r.y + 12, 8, 3);
}

function drawStage(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#493a31', r.x, r.y, r.w, r.h);
  rect(ctx, '#6f4b39', r.x, r.y + r.h - 12, r.w, 12);
  for (let x = r.x + 4; x < r.x + r.w; x += 14) rect(ctx, '#8b6045', x, r.y + r.h - 11, 1, 10);
  rect(ctx, '#c7a365', r.x + 12, r.y + 2, 4, 4);
  rect(ctx, '#c7a365', r.x + r.w - 16, r.y + 2, 4, 4);
  for (let y = 7; y < 29; y += 4) {
    rect(ctx, `rgba(230,190,116,${0.13 + y / 240})`, r.x + 8 + y / 3, r.y + y, 19, 3);
    rect(ctx, `rgba(230,190,116,${0.13 + y / 240})`, r.x + r.w - 28 - y / 3, r.y + y, 19, 3);
  }
  rect(ctx, variant % 2 ? '#789083' : '#a76d57', r.x + 6, r.y + 16, 12, 8);
}

function drawNight(ctx: CanvasRenderingContext2D, r: Rect, variant: number): void {
  rect(ctx, '#303a43', r.x, r.y, r.w, r.h);
  rect(ctx, '#3f4b51', r.x, r.y + 11, 31, 31);
  rect(ctx, '#56483f', r.x + 31, r.y + 18, 39, 24);
  rect(ctx, '#39464a', r.x + 70, r.y + 8, r.w - 70, 34);
  for (const [dx, dy] of [[7, 17], [19, 24], [41, 24], [55, 29], [80, 14], [94, 20]] as const) {
    rect(ctx, variant % 2 ? '#e2b56c' : '#d8c38a', r.x + dx, r.y + dy, 5, 4);
  }
  rect(ctx, '#5d5952', r.x, r.y + 42, r.w, r.h - 42);
  rect(ctx, '#c78a63', r.x + 42, r.y + 20, 20, 7);
  rect(ctx, '#f0d395', r.x + 46, r.y + 23, 12, 1);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, id: PhotoBackdropId, r: Rect, variant: number): void {
  if (id === 'alley') drawAlley(ctx, r, variant);
  else if (id === 'studio') drawStudio(ctx, r, variant);
  else if (id === 'garden') drawGarden(ctx, r, variant);
  else if (id === 'room') drawRoom(ctx, r, variant);
  else if (id === 'stage') drawStage(ctx, r, variant);
  else drawNight(ctx, r, variant);
}

function drawFrameMarks(ctx: CanvasRenderingContext2D, record: PhotoRecord): void {
  const frame = PHOTO_FRAMES.find((item) => item.id === record.frameId) ?? PHOTO_FRAMES[0]!;
  if (record.frameId === 'leaf') {
    for (const y of [16, 72, 128, 184]) {
      rect(ctx, frame.accent, 5, y, 3, 6); rect(ctx, frame.ink, 7, y + 2, 3, 3);
    }
  } else if (record.frameId === 'apricot') {
    for (const y of [18, 75, 132, 189]) {
      rect(ctx, frame.accent, 4, y, 2, 2); rect(ctx, frame.accent, 7, y + 3, 2, 2);
    }
  } else if (record.frameId === 'walnut') {
    for (const y of [12, 68, 124, 180]) rect(ctx, frame.accent, 4, y, 4, 1);
  } else if (record.frameId === 'ink') {
    for (const [x, y] of [[5, 12], [110, 37], [6, 132], [111, 191]] as const) {
      rect(ctx, frame.accent, x, y, 1, 5); rect(ctx, frame.accent, x - 2, y + 2, 5, 1);
    }
  } else if (record.frameId === 'gold') {
    rect(ctx, frame.accent, 3, 3, 19, 2); rect(ctx, frame.accent, 3, 3, 2, 19);
    rect(ctx, frame.accent, 98, 3, 19, 2); rect(ctx, frame.accent, 115, 3, 2, 19);
  }
}

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: '2-digit', month: '2-digit', day: '2-digit',
  }).format(new Date(iso)).replace(/\. /g, '.').replace('.', '');
}

/** 저장된 외형·펫 스냅샷을 실제 픽셀 네컷 스트립으로 다시 합성한다. */
export function renderPhotoStrip(canvas: HTMLCanvasElement, record: PhotoRecord): void {
  canvas.width = PHOTO_STRIP_W;
  canvas.height = PHOTO_STRIP_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const frame = PHOTO_FRAMES.find((item) => item.id === record.frameId) ?? PHOTO_FRAMES[0]!;
  const pose = PHOTO_POSES.find((item) => item.id === record.poseId) ?? PHOTO_POSES[0]!;
  rect(ctx, frame.paper, 0, 0, PHOTO_STRIP_W, PHOTO_STRIP_H);
  rect(ctx, frame.accent, 2, 2, PHOTO_STRIP_W - 4, PHOTO_STRIP_H - 4);
  rect(ctx, frame.paper, 4, 4, PHOTO_STRIP_W - 8, PHOTO_STRIP_H - 8);

  const charCanvas = document.createElement('canvas');
  charCanvas.width = CHAR_W; charCanvas.height = CHAR_H;
  const charCtx = charCanvas.getContext('2d')!;
  charCtx.imageSmoothingEnabled = false;
  const petCanvas = document.createElement('canvas');
  petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petCtx = petCanvas.getContext('2d')!;
  petCtx.imageSmoothingEnabled = false;

  for (let index = 0; index < 4; index++) {
    const panel: Rect = { x: 10, y: 9 + index * 55, w: 100, h: 50 };
    rect(ctx, frame.ink, panel.x - 1, panel.y - 1, panel.w + 2, panel.h + 2);
    drawBackdrop(ctx, record.backdropId, panel, index);
    paintCharacterFrame(charCtx, record.appearance, pose.dir, pose.steps[index]!);
    const charX = panel.x + [38, 45, 34, 42][index]!;
    const charY = panel.y + panel.h - CHAR_H - 2;
    ctx.drawImage(charCanvas, charX, charY);
    if (record.pet) {
      paintPet(petCtx, record.pet.speciesId, record.pet.accessory);
      const petX = panel.x + [67, 29, 65, 25][index]!;
      const petY = panel.y + panel.h - PET_H - 1;
      ctx.drawImage(petCanvas, petX, petY);
    }
    rect(ctx, frame.paper, panel.x + 2, panel.y + 2, 7, 3);
    rect(ctx, frame.accent, panel.x + 3, panel.y + 3, 5, 1);
  }
  drawFrameMarks(ctx, record);

  ctx.fillStyle = frame.ink;
  ctx.textBaseline = 'top';
  ctx.font = '700 6px "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(record.caption || `${record.nickname}의 홍대마을`, 10, 231, 99);
  ctx.font = '700 5px "Apple SD Gothic Neo", sans-serif';
  ctx.fillText('HONGDAE VILLAGE', 10, 247);
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel(record.takenAt), 109, 247);
  ctx.textAlign = 'left';
  const backdrop = PHOTO_BACKDROPS.find((item) => item.id === record.backdropId);
  ctx.font = '500 4px "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(backdrop?.name ?? '', 10, 256);
}

/** 네컷 스트립에 포일과 최대 세 개의 픽셀 스티커를 합성한 소장용 포토카드. */
export function renderPhotoCard(
  canvas: HTMLCanvasElement,
  record: PhotoRecord,
  decoration: PhotoCardDecoration,
): void {
  canvas.width = PHOTO_CARD_W;
  canvas.height = PHOTO_CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const foil = PHOTO_FOILS.find((item) => item.id === decoration.foilId) ?? PHOTO_FOILS[0]!;
  rect(ctx, foil.colors[2], 0, 0, PHOTO_CARD_W, PHOTO_CARD_H);
  rect(ctx, foil.colors[0], 4, 4, PHOTO_CARD_W - 8, PHOTO_CARD_H - 8);
  if (foil.id === 'silver') {
    for (let y = 7; y < PHOTO_CARD_H - 7; y += 9) rect(ctx, y % 18 ? foil.colors[1] : '#f3f1e9', 7, y, PHOTO_CARD_W - 14, 2);
  } else if (foil.id === 'rainbow') {
    for (let x = -20; x < PHOTO_CARD_W + 20; x += 18) {
      rect(ctx, foil.colors[(Math.floor((x + 20) / 18) % 3) as 0 | 1 | 2], x, 7, 10, PHOTO_CARD_H - 14);
    }
    rect(ctx, 'rgba(255,245,222,.58)', 7, 7, PHOTO_CARD_W - 14, PHOTO_CARD_H - 14);
  } else if (foil.id === 'midnight') {
    rect(ctx, foil.colors[0], 7, 7, PHOTO_CARD_W - 14, PHOTO_CARD_H - 14);
    for (const [x, y] of [[13, 15], [166, 24], [17, 287], [158, 302], [150, 74], [27, 114]] as const) {
      rect(ctx, foil.colors[2], x, y, 3, 3); rect(ctx, '#f8eab1', x + 1, y - 2, 1, 7);
    }
  }
  rect(ctx, foil.colors[2], 13, 11, 148, 306);
  rect(ctx, foil.colors[0], 16, 14, 142, 300);

  const strip = document.createElement('canvas');
  renderPhotoStrip(strip, record);
  ctx.drawImage(strip, 27, 22, 120, 268);

  const positions: readonly [number, number, number][] = [[8, 26, -1], [150, 128, 1], [9, 252, -1]];
  decoration.stickerIds.slice(0, 3).forEach((stickerId, index) => {
    const sticker = PHOTO_STICKERS.find((item) => item.id === stickerId);
    if (!sticker) return;
    const [x, y, tilt] = positions[index]!;
    ctx.save();
    ctx.translate(x + 14, y + 14);
    ctx.rotate(tilt * .08);
    rect(ctx, '#4d392f', -13, -13, 27, 27);
    rect(ctx, '#fff0d1', -11, -11, 23, 23);
    rect(ctx, sticker.color, -9, -9, 19, 19);
    ctx.fillStyle = '#fff8e5';
    ctx.font = '900 8px "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.mark, 1, 1, 17);
    ctx.restore();
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = foil.colors[2];
  ctx.font = '900 6px monospace';
  ctx.fillText(`${foil.name} · ${decoration.stickerIds.length}/3 STICKERS`, PHOTO_CARD_W / 2, 307);
  ctx.textAlign = 'left';
}
