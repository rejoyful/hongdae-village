import type { AlleySecretDef } from '../guidance/alleySecrets';

export const ALLEY_SECRET_ART_W = 160;
export const ALLEY_SECRET_ART_H = 96;

const CHAPTER_PALETTE = {
  'first-door': { sky: '#3e4b51', far: '#596267', wall: '#9c8872', light: '#f0ce83', floor: '#716b63', accent: '#9fb0aa' },
  'warm-scent': { sky: '#4b3635', far: '#6c4a42', wall: '#aa8065', light: '#f3c477', floor: '#75635b', accent: '#cf8067' },
  'handmade-face': { sky: '#403d35', far: '#615a47', wall: '#9b8968', light: '#e7c276', floor: '#716b5b', accent: '#a89b69' },
  'night-walk': { sky: '#303d3c', far: '#45594d', wall: '#7e8469', light: '#ded18a', floor: '#5e685b', accent: '#87a47f' },
} as const;

function polygon(
  ctx: CanvasRenderingContext2D,
  fill: string,
  points: ReadonlyArray<readonly [number, number]>,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, floor: string): void {
  polygon(ctx, floor, [[0, 70], [80, 38], [160, 70], [80, 96]]);
  ctx.strokeStyle = '#2b2928';
  ctx.lineWidth = 1;
  for (let offset = -64; offset <= 64; offset += 16) {
    ctx.beginPath(); ctx.moveTo(80 + offset, 40); ctx.lineTo(160 + offset, 72); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80 + offset, 40); ctx.lineTo(offset, 72); ctx.stroke();
  }
  ctx.fillStyle = '#1f1d1c55';
  ctx.fillRect(0, 87, 160, 9);
}

function drawStreet(ctx: CanvasRenderingContext2D, secret: AlleySecretDef): void {
  const palette = CHAPTER_PALETTE[secret.chapterId];
  ctx.fillStyle = palette.sky; ctx.fillRect(0, 0, 160, 96);
  ctx.fillStyle = '#f4d58c';
  for (const [x, y] of [[12, 13], [39, 8], [105, 16], [143, 10], [124, 28]] as const) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = palette.far;
  ctx.fillRect(0, 29, 40, 43); ctx.fillRect(33, 19, 37, 51); ctx.fillRect(105, 24, 55, 49);
  ctx.fillStyle = palette.wall;
  ctx.fillRect(5, 38, 30, 31); ctx.fillRect(111, 34, 39, 38);
  ctx.fillStyle = '#3a302b';
  ctx.fillRect(11, 48, 10, 21); ctx.fillRect(126, 45, 12, 27);
  ctx.fillStyle = palette.light;
  ctx.fillRect(24, 45, 6, 8); ctx.fillRect(115, 41, 7, 9); ctx.fillRect(141, 43, 5, 8);
  ctx.fillStyle = '#d6bc78';
  ctx.fillRect(73, 23, 2, 42); ctx.fillRect(71, 21, 7, 3);
  ctx.fillStyle = palette.light; ctx.fillRect(70, 25, 8, 6);
  drawGround(ctx, palette.floor);
}

function drawTicket(ctx: CanvasRenderingContext2D, sequence: number, accent: string): void {
  ctx.fillStyle = '#201c1b99'; ctx.fillRect(53, 53, 59, 29);
  ctx.fillStyle = '#dec799'; ctx.fillRect(50, 49, 58, 28);
  ctx.fillStyle = '#665747'; ctx.fillRect(56, 55, 34, 2); ctx.fillRect(56, 61, 27, 2);
  ctx.fillStyle = accent; ctx.fillRect(94, 53, 8, 18);
  ctx.fillStyle = '#3c3430'; ctx.fillRect(97, 57, 2, 10);
  if (sequence === 2) {
    ctx.fillStyle = '#efe1b7'; ctx.fillRect(59, 43, 48, 27);
    ctx.fillStyle = '#7d6651'; ctx.fillRect(65, 49, 31, 2); ctx.fillRect(65, 55, 24, 2); ctx.fillRect(65, 61, 35, 2);
  } else if (sequence === 3) {
    ctx.fillStyle = '#bd965b'; ctx.fillRect(74, 42, 8, 25); ctx.fillRect(80, 42, 18, 8); ctx.fillRect(89, 49, 6, 6);
    ctx.fillStyle = '#f0cf78'; ctx.fillRect(75, 44, 3, 10);
  }
}

function drawWarmObject(ctx: CanvasRenderingContext2D, sequence: number, accent: string): void {
  if (sequence === 1) {
    ctx.fillStyle = '#efe1c4'; ctx.fillRect(63, 50, 32, 22);
    ctx.fillStyle = '#43342d'; ctx.fillRect(68, 55, 18, 2); ctx.fillRect(68, 61, 22, 2); ctx.fillRect(68, 67, 15, 2);
    ctx.fillStyle = accent; ctx.fillRect(91, 48, 11, 16); ctx.fillRect(94, 45, 5, 4);
  } else if (sequence === 2) {
    ctx.fillStyle = '#211e22'; ctx.fillRect(57, 44, 46, 34);
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(80, 61, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b2528'; ctx.beginPath(); ctx.arc(80, 61, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3c37d'; ctx.fillRect(79, 58, 3, 5);
  } else {
    ctx.fillStyle = '#e7d1a6'; ctx.fillRect(56, 43, 51, 34);
    ctx.fillStyle = '#77583f'; ctx.fillRect(62, 49, 33, 2); ctx.fillRect(62, 55, 39, 2); ctx.fillRect(62, 61, 28, 2); ctx.fillRect(62, 67, 35, 2);
    ctx.fillStyle = accent; ctx.fillRect(101, 44, 3, 31);
  }
}

function drawHandmadeObject(ctx: CanvasRenderingContext2D, sequence: number, accent: string): void {
  if (sequence === 1) {
    for (let index = 0; index < 6; index++) {
      ctx.fillStyle = ['#a96d6d', '#d0ad76', '#6f8a77', '#7587a2', '#9a769b', accent][index]!;
      ctx.fillRect(53 + index * 9, 47 + (index % 2) * 3, 5, 27);
      ctx.fillStyle = '#e6d7b6'; ctx.fillRect(51 + index * 9, 46, 9, 6);
    }
  } else if (sequence === 2) {
    ctx.fillStyle = '#b58b58';
    polygon(ctx, '#b58b58', [[80, 42], [86, 55], [101, 56], [89, 65], [93, 79], [80, 70], [67, 79], [71, 65], [59, 56], [74, 55]]);
    ctx.fillStyle = '#e7c881'; ctx.fillRect(78, 48, 4, 19);
  } else {
    ctx.fillStyle = '#f0dfbd'; ctx.fillRect(55, 44, 50, 34);
    ctx.fillStyle = '#4a3b35'; ctx.fillRect(60, 49, 18, 22); ctx.fillRect(82, 49, 18, 22);
    ctx.fillStyle = accent; ctx.fillRect(57, 74, 45, 3);
    ctx.fillStyle = '#edc77d'; ctx.fillRect(72, 54, 5, 5); ctx.fillRect(87, 58, 6, 6);
  }
}

function drawNightObject(ctx: CanvasRenderingContext2D, sequence: number, accent: string): void {
  if (sequence === 1) {
    ctx.fillStyle = '#b9855f'; ctx.beginPath(); ctx.arc(80, 59, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ecd29b';
    for (const [x, y] of [[72, 52], [88, 52], [68, 63], [92, 63]] as const) {
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(80, 65, 6, 0, Math.PI * 2); ctx.fill();
  } else if (sequence === 2) {
    ctx.fillStyle = '#486d6e'; ctx.fillRect(47, 49, 66, 27);
    ctx.fillStyle = '#8eb5a7';
    for (let x = 51; x < 108; x += 9) ctx.fillRect(x, 54 + ((x / 9) % 2) * 5, 5, 3);
    ctx.fillStyle = '#d2aa5f'; ctx.beginPath(); ctx.arc(80, 62, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6d532f'; ctx.fillRect(78, 56, 4, 12);
  } else {
    ctx.fillStyle = '#605044'; ctx.fillRect(78, 33, 3, 35);
    ctx.fillStyle = '#c7a85d'; ctx.fillRect(70, 49, 19, 3);
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(80, 61, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c3936'; ctx.beginPath(); ctx.arc(80, 61, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9c878'; ctx.fillRect(79, 70, 3, 7);
  }
}

export function paintAlleySecretArt(
  ctx: CanvasRenderingContext2D,
  secret: AlleySecretDef,
  discovered: boolean,
  chapterComplete: boolean,
): void {
  ctx.imageSmoothingEnabled = false;
  drawStreet(ctx, secret);
  const palette = CHAPTER_PALETTE[secret.chapterId];
  if (secret.chapterId === 'first-door') drawTicket(ctx, secret.sequence, palette.accent);
  else if (secret.chapterId === 'warm-scent') drawWarmObject(ctx, secret.sequence, palette.accent);
  else if (secret.chapterId === 'handmade-face') drawHandmadeObject(ctx, secret.sequence, palette.accent);
  else drawNightObject(ctx, secret.sequence, palette.accent);

  ctx.fillStyle = '#171514cc'; ctx.fillRect(0, 82, 160, 14);
  ctx.fillStyle = chapterComplete ? '#efd785' : palette.accent;
  ctx.font = '900 7px monospace'; ctx.textAlign = 'left';
  ctx.fillText(chapterComplete ? 'CHAPTER ARCHIVED' : `CLUE ${secret.sequence} / 3`, 6, 91);
  ctx.textAlign = 'right'; ctx.fillText(discovered ? secret.mark : '?', 153, 91);

  if (!discovered) {
    ctx.fillStyle = '#171419c4'; ctx.fillRect(0, 0, 160, 82);
    ctx.fillStyle = '#dfc994'; ctx.font = '900 22px monospace'; ctx.textAlign = 'center'; ctx.fillText('?', 80, 57);
  }
}
