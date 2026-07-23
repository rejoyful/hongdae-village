import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { paintPet, PET_H, PET_W } from './petArt';
import {
  FAN_MERCH_FORMATS, FAN_MERCH_MOTIFS, type FanMerchRecord, type FanMerchSubject,
} from '../progression/fanMerchWorkshop';
import {
  FAN_ROOM_LIGHTS, FAN_ROOM_STYLES, type FanRoomDisplayState,
} from '../home/fanRoomDisplay';

export const FAN_ROOM_ART_W = 480;
export const FAN_ROOM_ART_H = 240;
export const FAN_ROOM_FIXTURE_W = 196;
export const FAN_ROOM_FIXTURE_H = 92;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function shade(color: string, amount: number): string {
  const raw = color.replace('#', '');
  const value = Number.parseInt(raw, 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

function diamond(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx + w / 2, cy);
  ctx.lineTo(cx, cy + h / 2); ctx.lineTo(cx - w / 2, cy);
  ctx.closePath(); ctx.fill();
}

function drawMiniSubject(
  ctx: CanvasRenderingContext2D, subject: FanMerchSubject,
  x: number, y: number, w: number, h: number,
) {
  const source = document.createElement('canvas');
  if (subject.kind === 'pet') {
    source.width = PET_W; source.height = PET_H;
    const sourceCtx = source.getContext('2d');
    if (!sourceCtx) return;
    paintPet(sourceCtx, subject.speciesId, subject.accessory);
  } else {
    source.width = CHAR_W; source.height = CHAR_H;
    const sourceCtx = source.getContext('2d');
    if (!sourceCtx) return;
    paintCharacterFrame(sourceCtx, subject.appearance, subject.kind === 'resident' ? 2 : 1, 0);
  }
  const ratio = Math.min(w / source.width, h / source.height);
  const targetW = Math.round(source.width * ratio);
  const targetH = Math.round(source.height * ratio);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, Math.round(x + (w - targetW) / 2), Math.round(y + h - targetH), targetW, targetH);
}

function drawGood(ctx: CanvasRenderingContext2D, record: FanMerchRecord, x: number, y: number, scale = 1) {
  const motif = FAN_MERCH_MOTIFS.find((item) => item.id === record.motifId) ?? FAN_MERCH_MOTIFS[0]!;
  const [dark, mid, warm, paper] = motif.colors;
  const w = 42 * scale;
  const h = 53 * scale;
  if (record.formatId === 'button') {
    ctx.fillStyle = shade(mid, -30);
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 19 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = warm;
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 16 * scale, 0, Math.PI * 2); ctx.fill();
    drawMiniSubject(ctx, record.subject, x + 12 * scale, y + 12 * scale, 18 * scale, 27 * scale);
  } else if (record.formatId === 'keyring') {
    ctx.strokeStyle = paper; ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath(); ctx.arc(x + w / 2, y + 5 * scale, 5 * scale, 0, Math.PI * 2); ctx.stroke();
    diamond(ctx, warm, x + w / 2, y + 31 * scale, 36 * scale, 39 * scale);
    diamond(ctx, dark, x + w / 2, y + 31 * scale, 29 * scale, 31 * scale);
    drawMiniSubject(ctx, record.subject, x + 13 * scale, y + 18 * scale, 16 * scale, 24 * scale);
  } else if (record.formatId === 'ticket') {
    rect(ctx, paper, x + 2 * scale, y + 8 * scale, 38 * scale, 38 * scale);
    rect(ctx, mid, x + 6 * scale, y + 12 * scale, 30 * scale, 29 * scale);
    rect(ctx, dark, x + 8 * scale, y + 15 * scale, 17 * scale, 23 * scale);
    drawMiniSubject(ctx, record.subject, x + 10 * scale, y + 17 * scale, 13 * scale, 19 * scale);
    rect(ctx, warm, x + 27 * scale, y + 16 * scale, 6 * scale, 6 * scale);
  } else {
    const poster = record.formatId === 'poster';
    const acrylic = record.formatId === 'acrylic';
    rect(ctx, shade(mid, -35), x + 3 * scale, y + 3 * scale, w - 3 * scale, h - 3 * scale);
    rect(ctx, acrylic ? '#dff1e2cc' : paper, x, y, w - 4 * scale, h - 5 * scale);
    rect(ctx, mid, x + 4 * scale, y + 4 * scale, w - 12 * scale, h - (poster ? 13 : 17) * scale);
    rect(ctx, dark, x + 7 * scale, y + 7 * scale, w - 18 * scale, h - 23 * scale);
    drawMiniSubject(ctx, record.subject, x + 12 * scale, y + 10 * scale, w - 28 * scale, h - 29 * scale);
    rect(ctx, warm, x + 5 * scale, y + h - 13 * scale, w - 14 * scale, 4 * scale);
    if (acrylic) diamond(ctx, warm, x + w / 2 - 2 * scale, y + h, 32 * scale, 7 * scale);
  }
}

function drawFixture(
  ctx: CanvasRenderingContext2D, state: FanRoomDisplayState, records: readonly FanMerchRecord[],
  x: number, y: number, scale: number,
) {
  const light = FAN_ROOM_LIGHTS.find((item) => item.id === state.lightId) ?? FAN_ROOM_LIGHTS[0]!;
  const [dark, mid, glow, paper] = light.colors;
  const w = 188 * scale;
  const h = 82 * scale;
  if (state.styleId === 'peg_board') {
    rect(ctx, shade(mid, -28), x, y, w, h);
    rect(ctx, mid, x + 4 * scale, y + 4 * scale, w - 8 * scale, h - 8 * scale);
    for (let py = 10; py < 76; py += 11) for (let px = 10; px < 182; px += 12) {
      rect(ctx, dark, x + px * scale, y + py * scale, 2 * scale, 2 * scale);
    }
  } else if (state.styleId === 'glass_case') {
    rect(ctx, shade(dark, -12), x, y, w, h);
    rect(ctx, '#d9efe829', x + 5 * scale, y + 4 * scale, w - 10 * scale, h - 10 * scale);
    rect(ctx, '#ffffff55', x + 9 * scale, y + 8 * scale, 3 * scale, h - 23 * scale);
    rect(ctx, glow, x + 8 * scale, y + h - 10 * scale, w - 16 * scale, 3 * scale);
  } else if (state.styleId === 'poster_wall') {
    rect(ctx, shade(mid, -36), x, y, w, h);
    rect(ctx, shade(mid, -10), x + 4 * scale, y + 4 * scale, w - 8 * scale, h - 8 * scale);
    rect(ctx, paper, x + 13 * scale, y + 7 * scale, 42 * scale, 5 * scale);
    rect(ctx, glow, x + 133 * scale, y + 69 * scale, 39 * scale, 4 * scale);
  } else {
    rect(ctx, shade(mid, -40), x + 3 * scale, y + 2 * scale, w - 6 * scale, h - 10 * scale);
    rect(ctx, shade(mid, -8), x + 7 * scale, y + 6 * scale, w - 14 * scale, h - 19 * scale);
    rect(ctx, shade(glow, -42), x, y + h - 14 * scale, w, 9 * scale);
    rect(ctx, paper, x + 5 * scale, y + h - 14 * scale, w - 10 * scale, 2 * scale);
  }
  const positions = records.length === 1 ? [73] : records.length === 2 ? [42, 104] : [17, 73, 129];
  records.slice(0, 3).forEach((record, index) => drawGood(
    ctx, record, x + (positions[index] ?? 17) * scale, y + 13 * scale, scale,
  ));
  if (records.length === 0) {
    rect(ctx, '#151318aa', x + 37 * scale, y + 24 * scale, 114 * scale, 26 * scale);
    ctx.fillStyle = paper;
    ctx.font = `900 ${7 * scale}px ui-monospace, monospace`;
    ctx.fillText('FAVORITE CORNER', x + 48 * scale, y + 34 * scale);
    ctx.fillStyle = glow;
    ctx.fillText('대표 굿즈를 기다리는 중', x + 48 * scale, y + 44 * scale);
  }
}

export function paintFanRoomFixture(
  canvas: HTMLCanvasElement, state: FanRoomDisplayState, records: readonly FanMerchRecord[],
): void {
  canvas.width = FAN_ROOM_FIXTURE_W; canvas.height = FAN_ROOM_FIXTURE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFixture(ctx, state, records, 4, 4, 1);
}

export function paintFanRoomArt(
  canvas: HTMLCanvasElement, state: FanRoomDisplayState, records: readonly FanMerchRecord[],
): void {
  canvas.width = FAN_ROOM_ART_W; canvas.height = FAN_ROOM_ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const light = FAN_ROOM_LIGHTS.find((item) => item.id === state.lightId) ?? FAN_ROOM_LIGHTS[0]!;
  const style = FAN_ROOM_STYLES.find((item) => item.id === state.styleId) ?? FAN_ROOM_STYLES[0]!;
  const [dark, mid, glow, paper] = light.colors;
  rect(ctx, '#151319', 0, 0, 480, 240);
  rect(ctx, dark, 0, 0, 480, 146);
  rect(ctx, shade(dark, 18), 0, 146, 480, 94);
  for (let x = 0; x < 480; x += 32) rect(ctx, x % 64 ? `${paper}12` : `${glow}16`, x, 18, 2, 113);
  rect(ctx, shade(mid, -42), 22, 23, 91, 73);
  rect(ctx, mid, 28, 29, 79, 61);
  rect(ctx, '#132029', 33, 34, 69, 51);
  rect(ctx, paper, 39, 39, 23, 3);
  rect(ctx, glow, 39, 48, 51, 5);
  rect(ctx, shade(mid, 24), 39, 60, 39, 4);
  rect(ctx, '#ffffff22', 96, 36, 3, 42);
  rect(ctx, shade(mid, -38), 366, 29, 83, 101);
  for (let shelf = 0; shelf < 3; shelf += 1) {
    rect(ctx, glow, 374, 52 + shelf * 25, 67, 3);
    rect(ctx, shelf % 2 ? paper : mid, 381, 38 + shelf * 25, 15, 14);
    rect(ctx, dark, 404, 41 + shelf * 25, 11, 11);
    rect(ctx, paper, 424, 35 + shelf * 25, 10, 17);
  }
  rect(ctx, shade(glow, -58), 0, 142, 480, 8);
  diamond(ctx, shade(glow, -67), 240, 199, 452, 68);
  diamond(ctx, shade(glow, -33), 240, 189, 452, 58);
  drawFixture(ctx, state, records, 135, 47, 1.12);
  rect(ctx, '#151319d9', 12, 10, 147, 24);
  ctx.fillStyle = paper;
  ctx.font = '900 8px ui-monospace, monospace';
  ctx.fillText('MY FAVORITE ROOM CORNER', 21, 18);
  ctx.fillStyle = glow;
  ctx.font = '900 7px ui-monospace, monospace';
  ctx.fillText(`${style.code} · ${light.code}`, 21, 27);
  rect(ctx, shade(mid, -23), 335, 167, 109, 12);
  rect(ctx, glow, 347, 157, 83, 10);
  rect(ctx, paper, 357, 150, 63, 7);
}
