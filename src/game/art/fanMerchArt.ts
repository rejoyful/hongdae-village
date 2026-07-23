import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { paintPet, PET_H, PET_W } from './petArt';
import {
  FAN_MERCH_FORMATS, FAN_MERCH_MOTIFS,
  type FanMerchDraft, type FanMerchSubject,
} from '../progression/fanMerchWorkshop';

export const FAN_MERCH_ART_W = 480;
export const FAN_MERCH_ART_H = 210;

const rect = (
  context: CanvasRenderingContext2D, color: string,
  x: number, y: number, width: number, height: number,
) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

function shade(color: string, amount: number): string {
  const raw = color.replace('#', '');
  const value = Number.parseInt(raw, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function diamond(
  context: CanvasRenderingContext2D, color: string,
  cx: number, cy: number, width: number, height: number,
) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(cx, cy - height / 2);
  context.lineTo(cx + width / 2, cy);
  context.lineTo(cx, cy + height / 2);
  context.lineTo(cx - width / 2, cy);
  context.closePath();
  context.fill();
}

function drawSubject(
  context: CanvasRenderingContext2D, subject: FanMerchSubject,
  x: number, y: number, width: number, height: number,
) {
  const source = document.createElement('canvas');
  if (subject.kind === 'pet') {
    source.width = PET_W;
    source.height = PET_H;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) return;
    paintPet(sourceContext, subject.speciesId, subject.accessory);
  } else {
    source.width = CHAR_W;
    source.height = CHAR_H;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) return;
    paintCharacterFrame(sourceContext, subject.appearance, subject.kind === 'resident' ? 2 : 1, 0);
  }
  context.imageSmoothingEnabled = false;
  const ratio = Math.min(width / source.width, height / source.height);
  const targetW = Math.round(source.width * ratio);
  const targetH = Math.round(source.height * ratio);
  context.drawImage(source, Math.round(x + (width - targetW) / 2), Math.round(y + height - targetH), targetW, targetH);
}

function drawFormatFrame(
  context: CanvasRenderingContext2D, draft: FanMerchDraft,
  colors: readonly [string, string, string, string],
) {
  const [dark, mid, warm, paper] = colors;
  const x = 172;
  const y = 22;
  const w = 142;
  const h = 146;

  if (draft.formatId === 'acrylic') {
    rect(context, '#11121855', x + 8, y + 11, w - 16, h - 12);
    rect(context, shade(mid, -24), x + 4, y + 4, w - 8, h - 8);
    rect(context, '#e8f2eaaa', x + 8, y + 8, w - 16, h - 16);
    rect(context, '#ffffff99', x + 12, y + 12, 4, h - 30);
    drawSubject(context, draft.subject, x + 25, y + 17, w - 50, h - 37);
    diamond(context, shade(warm, -35), x + w / 2, y + h + 10, 115, 26);
    diamond(context, warm, x + w / 2, y + h + 5, 96, 18);
  } else if (draft.formatId === 'photocard') {
    rect(context, '#11121888', x + 7, y + 8, w - 4, h);
    rect(context, paper, x, y, w, h);
    rect(context, warm, x + 7, y + 7, w - 14, h - 35);
    rect(context, dark, x + 11, y + 11, w - 22, h - 43);
    drawSubject(context, draft.subject, x + 33, y + 18, w - 66, h - 54);
    rect(context, mid, x + 10, y + h - 21, 79, 4);
    rect(context, shade(mid, 30), x + 10, y + h - 13, 48, 3);
    rect(context, warm, x + w - 25, y + h - 22, 13, 13);
  } else if (draft.formatId === 'button') {
    context.fillStyle = '#12131988';
    context.beginPath(); context.arc(x + w / 2 + 5, y + 76, 69, 0, Math.PI * 2); context.fill();
    context.fillStyle = shade(mid, -25);
    context.beginPath(); context.arc(x + w / 2, y + 70, 68, 0, Math.PI * 2); context.fill();
    context.fillStyle = warm;
    context.beginPath(); context.arc(x + w / 2, y + 70, 62, 0, Math.PI * 2); context.fill();
    context.fillStyle = dark;
    context.beginPath(); context.arc(x + w / 2, y + 70, 54, 0, Math.PI * 2); context.fill();
    drawSubject(context, draft.subject, x + 37, y + 27, w - 74, 92);
    rect(context, paper, x + 32, y + 126, 78, 5);
  } else if (draft.formatId === 'keyring') {
    context.strokeStyle = paper; context.lineWidth = 6;
    context.beginPath(); context.arc(x + w / 2, y + 19, 17, 0, Math.PI * 2); context.stroke();
    rect(context, shade(warm, -36), x + w / 2 - 5, y + 31, 10, 17);
    diamond(context, shade(mid, -34), x + w / 2 + 5, y + 102, 132, 118);
    diamond(context, warm, x + w / 2, y + 96, 122, 108);
    diamond(context, dark, x + w / 2, y + 96, 106, 94);
    drawSubject(context, draft.subject, x + 40, y + 52, w - 80, 82);
  } else if (draft.formatId === 'poster') {
    rect(context, '#12131977', x + 8, y + 8, w, h);
    rect(context, paper, x, y, w, h);
    rect(context, mid, x + 8, y + 8, w - 16, h - 16);
    rect(context, dark, x + 13, y + 13, w - 26, h - 39);
    drawSubject(context, draft.subject, x + 38, y + 18, w - 76, h - 48);
    rect(context, warm, x + 13, y + h - 21, w - 26, 8);
    rect(context, '#efe4c0cc', x + 13, y - 3, 27, 9);
    rect(context, '#efe4c0cc', x + w - 40, y - 3, 27, 9);
  } else {
    rect(context, '#11121866', x + 7, y + 16, w, h - 27);
    rect(context, paper, x, y + 9, w, h - 27);
    for (let dotY = y + 18; dotY < y + h - 20; dotY += 10) {
      rect(context, dark, x - 2, dotY, 5, 4);
      rect(context, dark, x + w - 3, dotY, 5, 4);
    }
    rect(context, mid, x + 9, y + 18, w - 18, h - 45);
    rect(context, dark, x + 14, y + 23, 77, h - 55);
    drawSubject(context, draft.subject, x + 23, y + 31, 58, h - 69);
    rect(context, warm, x + 99, y + 28, 27, 27);
    rect(context, dark, x + 98, y + 67, 29, 5);
    rect(context, shade(mid, -22), x + 98, y + 79, 22, 4);
    rect(context, shade(mid, 20), x + 98, y + 89, 29, 3);
    rect(context, warm, x + 9, y + h - 19, w - 18, 7);
  }
}

export function paintFanMerchArt(canvas: HTMLCanvasElement, draft: FanMerchDraft): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, FAN_MERCH_ART_W, FAN_MERCH_ART_H);
  const motif = FAN_MERCH_MOTIFS.find((item) => item.id === draft.motifId) ?? FAN_MERCH_MOTIFS[0]!;
  const format = FAN_MERCH_FORMATS.find((item) => item.id === draft.formatId) ?? FAN_MERCH_FORMATS[0]!;
  const [dark, mid, warm, paper] = motif.colors;

  rect(context, '#19171d', 0, 0, FAN_MERCH_ART_W, FAN_MERCH_ART_H);
  rect(context, dark, 0, 0, FAN_MERCH_ART_W, 129);
  rect(context, shade(dark, 16), 0, 129, FAN_MERCH_ART_W, 81);
  for (let x = 13; x < 470; x += 31) {
    rect(context, x % 2 ? '#ffffff10' : warm, x, 13 + (x % 17), x % 3 ? 2 : 3, x % 3 ? 2 : 3);
  }
  rect(context, shade(mid, -35), 24, 34, 112, 72);
  rect(context, shade(mid, -8), 29, 39, 102, 62);
  rect(context, dark, 35, 45, 90, 50);
  rect(context, paper, 42, 52, 28, 3);
  rect(context, warm, 42, 61, 68, 6);
  rect(context, mid, 42, 74, 51, 4);
  rect(context, shade(mid, 28), 42, 85, 61, 3);
  rect(context, '#16151a', 342, 31, 111, 82);
  for (let shelf = 0; shelf < 3; shelf += 1) {
    rect(context, shade(mid, -18), 350, 43 + shelf * 22, 95, 4);
    for (let item = 0; item < 4; item += 1) {
      const itemX = 354 + item * 22;
      rect(context, item % 2 ? warm : paper, itemX, 31 + shelf * 22, 13, 12);
      rect(context, dark, itemX + 3, 34 + shelf * 22, 7, 6);
    }
  }
  rect(context, shade(warm, -48), 0, 139, 480, 8);
  diamond(context, shade(warm, -68), 240, 183, 430, 54);
  diamond(context, shade(warm, -31), 240, 174, 432, 48);
  rect(context, warm, 49, 157, 66, 7);
  rect(context, paper, 59, 148, 47, 10);
  rect(context, dark, 365, 149, 58, 12);
  rect(context, mid, 372, 143, 44, 8);

  drawFormatFrame(context, draft, motif.colors);

  rect(context, '#16151aca', 11, 10, 115, 21);
  context.fillStyle = paper;
  context.font = '900 8px ui-monospace, monospace';
  context.textBaseline = 'top';
  context.fillText('FAVORITE GOODS LAB', 18, 16);
  rect(context, warm, 337, 120, 126, 19);
  context.fillStyle = dark;
  context.font = '900 8px ui-monospace, monospace';
  context.fillText(`${format.code} · ${motif.mark}`, 345, 126);
  rect(context, '#16151acc', 132, 184, 218, 18);
  context.fillStyle = '#fff2d8';
  context.font = '900 9px ui-monospace, monospace';
  const subjectLabel = `${draft.subject.kind === 'self' ? 'MY OC' : draft.subject.kind === 'pet' ? 'COMPANION' : 'NEIGHBOR'} · ${draft.subject.name}`;
  context.fillText(subjectLabel.slice(0, 32), 143, 189);
}
