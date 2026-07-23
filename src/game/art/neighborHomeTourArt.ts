import type { NeighborHomeTourRecord } from '../home/neighborHomeTours';

export const NEIGHBOR_HOME_TOUR_ART_W = 180;
export const NEIGHBOR_HOME_TOUR_ART_H = 108;

interface TourPalette { ink: string; paper: string; wall: string; wallShade: string; floor: string; floorDark: string; accent: string; glow: string }

const PALETTES: Record<NeighborHomeTourRecord['themeId'], TourPalette> = {
  starter: { ink: '#302820', paper: '#e4d5b7', wall: '#c9b99b', wallShade: '#aa9579', floor: '#9b795b', floorDark: '#775944', accent: '#8b745e', glow: '#f1d8a2' },
  cozy: { ink: '#33251f', paper: '#ead9bc', wall: '#d1ad8b', wallShade: '#ad8067', floor: '#9a684d', floorDark: '#704937', accent: '#c47761', glow: '#ffd798' },
  music: { ink: '#242131', paper: '#d9d0df', wall: '#796c8f', wallShade: '#554b69', floor: '#514455', floorDark: '#352f3e', accent: '#d57b91', glow: '#f2c96f' },
  green: { ink: '#243029', paper: '#d8ddbd', wall: '#9daf89', wallShade: '#74866a', floor: '#8a7153', floorDark: '#64513d', accent: '#6f9369', glow: '#d8d58b' },
  creator: { ink: '#222b32', paper: '#d6d7ce', wall: '#8c9ba1', wallShade: '#68777d', floor: '#7d6e61', floorDark: '#584e47', accent: '#d18a5b', glow: '#acd8db' },
  pet: { ink: '#352a2a', paper: '#ead4ca', wall: '#c79791', wallShade: '#9e716e', floor: '#96715e', floorDark: '#6d5044', accent: '#d9a56f', glow: '#f3d49b' },
};

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawWindow(ctx: CanvasRenderingContext2D, p: TourPalette, x: number, y: number): void {
  rect(ctx, p.ink, x, y, 25, 22); rect(ctx, '#8fbbc2', x + 3, y + 3, 19, 16);
  rect(ctx, '#cce0d8', x + 4, y + 4, 8, 6); rect(ctx, '#6f94a0', x + 13, y + 4, 8, 14);
  rect(ctx, p.ink, x + 11, y + 3, 2, 16); rect(ctx, p.ink, x + 3, y + 10, 19, 2);
  rect(ctx, p.glow, x + 5, y + 5, 5, 2);
}

function drawRug(ctx: CanvasRenderingContext2D, p: TourPalette, x: number, y: number, seed: number): void {
  rect(ctx, p.ink, x - 1, y - 1, 25, 10); rect(ctx, p.paper, x, y, 23, 8); rect(ctx, p.accent, x + 3, y + 2, 17, 4);
  for (let stripe = 0; stripe < 4; stripe += 1) rect(ctx, p.glow, x + 4 + stripe * 4, y + 3 + (seed + stripe) % 2, 2, 2);
}

function drawFurniture(ctx: CanvasRenderingContext2D, p: TourPalette, itemId: string, x: number, y: number): void {
  const seed = hash(itemId);
  const dark = p.ink; const wood = seed % 2 ? '#73533d' : '#876449'; const light = seed % 3 ? p.paper : p.glow;
  if (itemId.includes('bed')) {
    rect(ctx, dark, x, y + 3, 24, 11); rect(ctx, light, x + 2, y + 2, 21, 8); rect(ctx, p.accent, x + 3, y + 7, 20, 5); rect(ctx, '#f0e3ca', x + 3, y + 3, 7, 4); rect(ctx, dark, x, y + 14, 3, 3); rect(ctx, dark, x + 21, y + 14, 3, 3);
  } else if (itemId.includes('sofa') || itemId.includes('chair') || itemId.includes('cushion')) {
    rect(ctx, dark, x + 2, y + 3, 18, 12); rect(ctx, p.accent, x + 4, y + 4, 14, 7); rect(ctx, light, x + 5, y + 5, 5, 4); rect(ctx, dark, x, y + 8, 4, 7); rect(ctx, dark, x + 18, y + 8, 4, 7); rect(ctx, dark, x + 4, y + 15, 3, 2); rect(ctx, dark, x + 15, y + 15, 3, 2);
  } else if (itemId.includes('plant') || itemId.includes('cactus') || itemId.includes('stuckyi') || itemId.includes('flower')) {
    rect(ctx, dark, x + 7, y + 11, 11, 8); rect(ctx, '#b86f51', x + 8, y + 12, 9, 6);
    rect(ctx, '#486b4c', x + 11, y, 4, 13); rect(ctx, '#6e9561', x + 4, y + 3, 9, 6); rect(ctx, '#83a36c', x + 13, y + 2, 8, 7); rect(ctx, '#a0b979', x + 8, y + 1, 7, 5);
  } else if (itemId.includes('lamp') || itemId.includes('neon') || itemId.includes('candle')) {
    rect(ctx, dark, x + 10, y + 6, 3, 12); rect(ctx, dark, x + 5, y + 17, 13, 3); rect(ctx, p.glow, x + 5, y, 13, 8); rect(ctx, '#fff0bc', x + 8, y + 2, 7, 4); rect(ctx, p.accent, x + 6, y + 7, 11, 2);
  } else if (itemId.includes('guitar') || itemId.includes('mic') || itemId.includes('turntable') || itemId.includes('speaker')) {
    rect(ctx, dark, x + 10, y, 3, 13); rect(ctx, '#bd7650', x + 6, y + 8, 11, 10); rect(ctx, dark, x + 8, y + 11, 7, 5); rect(ctx, p.glow, x + 10, y + 12, 3, 3); rect(ctx, dark, x + 4, y + 18, 16, 2);
  } else if (itemId.includes('desk') || itemId.includes('table') || itemId.includes('pc_') || itemId.includes('laptop')) {
    rect(ctx, dark, x, y + 7, 25, 4); rect(ctx, wood, x + 2, y + 6, 21, 3); rect(ctx, dark, x + 3, y + 10, 3, 9); rect(ctx, dark, x + 19, y + 10, 3, 9); rect(ctx, '#526570', x + 8, y, 11, 7); rect(ctx, '#9bc1c2', x + 10, y + 2, 7, 3);
  } else if (itemId.includes('shelf') || itemId.includes('wardrobe') || itemId.includes('crate') || itemId.includes('book')) {
    rect(ctx, dark, x + 2, y, 20, 20); rect(ctx, wood, x + 4, y + 2, 16, 16); rect(ctx, dark, x + 4, y + 7, 16, 2); rect(ctx, dark, x + 4, y + 13, 16, 2);
    for (let book = 0; book < 5; book += 1) rect(ctx, [p.accent, p.glow, '#6f8f91'][book % 3]!, x + 5 + book * 3, y + 3 + (book % 2), 2, 4);
  } else if (itemId.includes('tank') || itemId.includes('aquarium')) {
    rect(ctx, dark, x + 1, y + 3, 22, 15); rect(ctx, '#699ba2', x + 3, y + 5, 18, 10); rect(ctx, '#a7ced0', x + 4, y + 6, 16, 3); rect(ctx, '#d4a56d', x + 3, y + 14, 18, 3); rect(ctx, p.glow, x + 8, y + 9, 4, 2); rect(ctx, dark, x + 4, y + 18, 17, 2);
  } else if (itemId.includes('rug')) {
    drawRug(ctx, p, x, y + 8, seed);
  } else {
    rect(ctx, dark, x + 3, y + 4, 18, 15); rect(ctx, p.accent, x + 5, y + 6, 14, 11); rect(ctx, light, x + 8, y + 8, 8, 4); rect(ctx, dark, x + 8, y + 13, 8, 2);
  }
}

function drawThemeMotif(ctx: CanvasRenderingContext2D, record: NeighborHomeTourRecord, p: TourPalette): void {
  if (record.themeId === 'music') {
    rect(ctx, p.glow, 143, 13, 3, 13); rect(ctx, p.glow, 146, 13, 9, 3); rect(ctx, p.glow, 153, 16, 3, 8); rect(ctx, p.glow, 137, 24, 8, 5); rect(ctx, p.glow, 148, 22, 8, 5);
  } else if (record.themeId === 'green') {
    rect(ctx, '#58764f', 149, 9, 3, 20); rect(ctx, '#7e9d68', 140, 11, 10, 5); rect(ctx, '#91ae72', 152, 15, 8, 6); rect(ctx, '#6c8d5c', 143, 22, 8, 5);
  } else if (record.themeId === 'creator') {
    rect(ctx, p.glow, 139, 10, 22, 15); rect(ctx, p.ink, 141, 12, 18, 11); rect(ctx, '#84b6bd', 143, 14, 14, 7); rect(ctx, p.accent, 146, 17, 8, 2);
  } else if (record.themeId === 'pet') {
    rect(ctx, p.glow, 141, 15, 5, 5); rect(ctx, p.glow, 151, 12, 5, 5); rect(ctx, p.glow, 159, 16, 5, 5); rect(ctx, p.glow, 148, 19, 12, 8); rect(ctx, p.wall, 151, 21, 6, 4);
  } else {
    rect(ctx, p.glow, 146, 11, 10, 3); rect(ctx, p.glow, 142, 14, 18, 3); rect(ctx, p.accent, 146, 18, 10, 7); rect(ctx, p.paper, 149, 20, 4, 3);
  }
}

/** 공개 가구 ID의 축약본으로 방문 당시 분위기를 복원하는 고밀도 픽셀 엽서. */
export function paintNeighborHomeTourArt(canvas: HTMLCanvasElement, record: NeighborHomeTourRecord): void {
  canvas.width = NEIGHBOR_HOME_TOUR_ART_W; canvas.height = NEIGHBOR_HOME_TOUR_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const p = PALETTES[record.themeId] ?? PALETTES.starter;
  ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 180, 108);
  rect(ctx, '#171412', 1, 2, 178, 104); rect(ctx, p.paper, 4, 5, 172, 98); rect(ctx, p.ink, 7, 8, 166, 76);

  // 벽과 원근 바닥
  rect(ctx, p.wall, 10, 11, 160, 30); rect(ctx, p.wallShade, 10, 36, 160, 5);
  for (let y = 41; y < 81; y += 1) {
    const inset = Math.max(0, 18 - Math.floor((y - 41) * 0.42));
    rect(ctx, (y % 7 === 0) ? p.floorDark : p.floor, 10 + inset, y, 160 - inset * 2, 1);
  }
  for (let plank = 0; plank < 5; plank += 1) rect(ctx, p.floorDark, 28 + plank * 30, 42, 1, 39);
  drawWindow(ctx, p, 17, 14); drawThemeMotif(ctx, record, p);
  rect(ctx, p.ink, 10, 39, 160, 2); rect(ctx, p.glow, 64, 13, 55, 3); rect(ctx, p.accent, 72, 18, 39, 2);

  const items = record.itemIds.length ? record.itemIds : ['bed_basic', 'lamp_stand', 'plant_pot'];
  const slots = [[20, 48], [57, 46], [96, 47], [133, 49], [39, 65], [78, 64], [117, 65]] as const;
  items.slice(0, slots.length).forEach((itemId, index) => {
    const slot = slots[(index + record.roomId) % slots.length]!;
    drawFurniture(ctx, p, itemId, slot[0], slot[1]);
  });

  // 엽서 하단: 주거형 천공, 홈 점수 미터, 최애 금박
  rect(ctx, p.ink, 8, 88, 164, 15); rect(ctx, p.paper, 10, 90, 160, 11);
  const typeIndex = ['banjiha', 'oneroom', 'villa', 'apt', 'house'].indexOf(record.houseType);
  for (let index = 0; index < 5; index += 1) rect(ctx, index <= typeIndex ? p.accent : p.wallShade, 14 + index * 7, 93, 5, 5);
  rect(ctx, p.wallShade, 54, 93, 78, 5); rect(ctx, p.accent, 54, 93, Math.round(78 * record.homeScore / 100), 5);
  for (let index = 0; index < Math.min(6, record.visits); index += 1) rect(ctx, p.ink, 138 + (index % 3) * 6, 92 + Math.floor(index / 3) * 5, 4, 3);
  if (record.favorite) {
    rect(ctx, '#d3a84f', 158, 9, 10, 10); rect(ctx, '#fff0b0', 162, 10, 2, 8); rect(ctx, '#fff0b0', 159, 13, 8, 2);
  }
}
