import type { ResidentLetterView, ResidentReplyTone } from '../residents/residentLetters';

export const RESIDENT_LETTER_ART_W = 160;
export const RESIDENT_LETTER_ART_H = 80;

const hex = (value: string): string => value.startsWith('#') ? value : `#${value}`;

function shade(color: string, amount: number): string {
  const raw = hex(color).slice(1);
  const value = Number.parseInt(raw, 16);
  const r = Math.max(0, Math.min(255, ((value >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r},${g},${b})`;
}

function rect(context: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function dots(context: CanvasRenderingContext2D, color: string, seed: number, count: number): void {
  let value = seed * 7919 + 17;
  for (let index = 0; index < count; index += 1) {
    value = (value * 48271) % 2147483647;
    const x = 4 + (value % 152); value = (value * 48271) % 2147483647;
    const y = 3 + (value % 72);
    rect(context, color, x, y, index % 4 === 0 ? 2 : 1, 1);
  }
}

function drawWindow(context: CanvasRenderingContext2D, letter: ResidentLetterView): void {
  const [, mid, warm, paper] = letter.palette;
  rect(context, '#171921', 8, 7, 55, 42);
  rect(context, shade(mid, -18), 10, 9, 51, 38);
  const skyTop = context.createLinearGradient(0, 9, 0, 47);
  skyTop.addColorStop(0, hex(letter.palette[0])); skyTop.addColorStop(1, hex(mid));
  context.fillStyle = skyTop; context.fillRect(11, 10, 49, 36);
  dots(context, shade(paper, 10), letter.act * 11 + letter.residentId.length, 10 + letter.act * 3);
  rect(context, '#1c1d24', 34, 9, 2, 38); rect(context, '#1c1d24', 10, 29, 52, 2);
  rect(context, shade(warm, -28), 12, 40, 47, 6);
  for (let index = 0; index < 7; index += 1) {
    const h = 4 + ((index * 7 + letter.act * 3) % 11);
    rect(context, index % 2 ? shade(mid, -32) : shade(warm, -46), 13 + index * 7, 40 - h, 5, h);
  }
}

function drawDeskObject(context: CanvasRenderingContext2D, letter: ResidentLetterView): void {
  const [, mid, warm, paper] = letter.palette;
  const id = letter.residentId;
  if (id === 'haneul') {
    rect(context, '#34283e', 18, 55, 29, 5); rect(context, warm, 21, 57, 22, 2); rect(context, paper, 39, 54, 7, 3);
  } else if (id === 'moturi') {
    rect(context, shade(paper, -15), 20, 52, 18, 13); rect(context, warm, 22, 54, 13, 8); rect(context, shade(mid, -20), 37, 55, 5, 6);
  } else if (id === 'sallim') {
    rect(context, '#d4bd86', 17, 56, 30, 4); for (let i = 0; i < 8; i += 1) rect(context, '#6d604c', 19 + i * 3, 57, 1, i % 2 ? 2 : 1);
  } else if (id === 'jun' || id === 'choco') {
    rect(context, paper, 18, 53, 25, 11); rect(context, warm, 20, 55, 21, 3); rect(context, mid, 22, 59, 5, 3); rect(context, mid, 30, 59, 9, 1);
  } else if (id === 'ille') {
    rect(context, paper, 20, 54, 20, 9); rect(context, mid, 22, 56, 16, 5); rect(context, warm, 28, 51, 4, 4);
  } else if (id === 'park') {
    rect(context, '#dbc99f', 18, 55, 26, 8); rect(context, mid, 20, 57, 22, 1); rect(context, warm, 33, 55, 3, 8);
  } else if (id === 'noeul') {
    for (let i = 0; i < 5; i += 1) rect(context, i % 2 ? warm : mid, 18 + i * 5, 57 - i % 3, 4, 7 + i % 2);
  } else if (id === 'imo') {
    rect(context, '#e4d0a5', 18, 53, 23, 11); rect(context, warm, 20, 55, 19, 4); rect(context, '#ffffff66', 22, 56, 14, 1);
  } else {
    rect(context, shade(mid, -18), 20, 57, 23, 5); rect(context, warm, 23, 53, 6, 6); rect(context, paper, 25, 51, 2, 4);
  }
}

function drawLetter(context: CanvasRenderingContext2D, letter: ResidentLetterView): void {
  const [, mid, warm, paper] = letter.palette;
  rect(context, '#18171b88', 69, 16, 82, 54);
  rect(context, shade(paper, -28), 66, 13, 82, 54);
  rect(context, paper, 68, 12, 78, 53);
  rect(context, shade(warm, -10), 68, 12, 78, 3);
  rect(context, shade(mid, -5), 75, 21, 28 + letter.act * 5, 2);
  rect(context, shade(mid, 12), 75, 27, 59, 1);
  rect(context, shade(mid, 12), 75, 31, 64, 1);
  rect(context, shade(mid, 12), 75, 35, 56, 1);
  rect(context, shade(mid, 12), 75, 39, 61, 1);
  rect(context, shade(mid, 12), 75, 43, 45, 1);
  rect(context, shade(warm, -5), 75, 50, 24, 2);
  rect(context, shade(mid, -18), 126, 52, 13, 7);
  rect(context, warm, 129, 54, 7, 3);
  context.fillStyle = shade(letter.palette[0], 5);
  context.font = '900 7px ui-monospace, monospace';
  context.textBaseline = 'top'; context.fillText(letter.mark, 129, 52);
  if (letter.replied) drawSeal(context, letter.tone!, 108, 52, letter.featured);
}

function drawSeal(context: CanvasRenderingContext2D, tone: ResidentReplyTone, x: number, y: number, featured: boolean): void {
  const colors: Record<ResidentReplyTone, string> = { warm: '#c66f5e', playful: '#58958b', thoughtful: '#76638e' };
  const marks: Record<ResidentReplyTone, string> = { warm: '온', playful: '웃', thoughtful: '결' };
  const color = colors[tone];
  rect(context, featured ? '#f5d98b' : shade(color, -34), x - 2, y - 2, 17, 14);
  rect(context, color, x, y, 13, 10);
  rect(context, shade(color, 25), x + 2, y + 2, 9, 6);
  context.fillStyle = '#fff3d5'; context.font = '900 6px ui-monospace, monospace'; context.fillText(marks[tone], x + 4, y + 2);
}

export function paintResidentLetterScene(context: CanvasRenderingContext2D, letter: ResidentLetterView): void {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, RESIDENT_LETTER_ART_W, RESIDENT_LETTER_ART_H);
  const [dark, mid, warm] = letter.palette;
  const wall = context.createLinearGradient(0, 0, 0, RESIDENT_LETTER_ART_H);
  wall.addColorStop(0, hex(dark)); wall.addColorStop(1, shade(mid, -30));
  context.fillStyle = wall; context.fillRect(0, 0, RESIDENT_LETTER_ART_W, RESIDENT_LETTER_ART_H);
  dots(context, '#ffffff0c', letter.id.length * 13, 22);
  drawWindow(context, letter);
  rect(context, shade(warm, -62), 0, 49, 160, 31);
  rect(context, shade(warm, -32), 0, 50, 160, 5);
  rect(context, '#201b1d55', 0, 72, 160, 8);
  drawDeskObject(context, letter);
  drawLetter(context, letter);
  if (letter.ready) {
    rect(context, warm, 151, 18, 4, 4); rect(context, warm, 152, 16, 2, 8); rect(context, warm, 150, 19, 6, 2);
  }
}
