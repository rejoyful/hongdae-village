import {
  fishById, fishingWaterById, type FishDef, type FishingRank, type FishingWaterId,
} from '../fishing/fishing';

const px = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const poly = (ctx: CanvasRenderingContext2D, color: string, points: Array<[number, number]>): void => {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fill();
};

export function drawFishingCreature(ctx: CanvasRenderingContext2D, fish: FishDef, cx: number, cy: number, scale: number): void {
  const s = scale;
  const dark = '#263139';
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy));
  const body = fish.body, accent = fish.accent;
  if (fish.shape === 'eel') {
    px(ctx, dark, -26*s, -5*s, 48*s, 12*s); px(ctx, body, -24*s, -3*s, 44*s, 8*s);
    px(ctx, dark, 18*s, -7*s, 10*s, 16*s); px(ctx, body, 18*s, -5*s, 7*s, 12*s);
  } else if (fish.shape === 'shrimp') {
    px(ctx, dark, -17*s, -7*s, 29*s, 15*s); px(ctx, body, -15*s, -5*s, 25*s, 11*s);
    px(ctx, accent, -10*s, -5*s, 3*s, 11*s); px(ctx, accent, -3*s, -5*s, 3*s, 11*s); px(ctx, accent, 4*s, -4*s, 3*s, 9*s);
    px(ctx, dark, 10*s, -10*s, 3*s, 6*s); px(ctx, dark, 13*s, -13*s, 2*s, 7*s);
    px(ctx, dark, -18*s, 7*s, 3*s, 7*s); px(ctx, dark, -8*s, 7*s, 3*s, 7*s);
  } else if (fish.shape === 'crayfish') {
    px(ctx, dark, -20*s, -7*s, 34*s, 15*s); px(ctx, body, -17*s, -5*s, 28*s, 11*s);
    px(ctx, dark, 10*s, -13*s, 13*s, 9*s); px(ctx, body, 12*s, -11*s, 8*s, 5*s);
    px(ctx, dark, 10*s, 6*s, 13*s, 9*s); px(ctx, body, 12*s, 8*s, 8*s, 5*s);
    px(ctx, accent, -12*s, -5*s, 3*s, 11*s); px(ctx, accent, -4*s, -5*s, 3*s, 11*s);
  } else if (fish.shape === 'jelly') {
    px(ctx, dark, -17*s, -11*s, 34*s, 18*s); px(ctx, body, -14*s, -8*s, 28*s, 13*s);
    px(ctx, accent, -9*s, -6*s, 7*s, 4*s); px(ctx, '#e8dfed', 3*s, -6*s, 5*s, 3*s);
    px(ctx, dark, -12*s, 7*s, 3*s, 15*s); px(ctx, dark, -2*s, 7*s, 3*s, 19*s); px(ctx, dark, 9*s, 7*s, 3*s, 14*s);
  } else {
    const round = fish.shape === 'round' || fish.shape === 'puffer';
    const w = round ? 34 : fish.shape === 'catfish' || fish.shape === 'carp' ? 43 : 38;
    const h = round ? 24 : fish.shape === 'goby' ? 17 : 19;
    poly(ctx, dark, [[-w/2*s,0],[-(w/2+10)*s,-10*s],[-(w/2+10)*s,10*s],[-w/2*s,4*s],[-w/3*s,h/2*s],[w/3*s,h/2*s],[w/2*s,5*s],[(w/2+4)*s,0],[w/2*s,-5*s],[w/3*s,-h/2*s],[-w/3*s,-h/2*s]]);
    px(ctx, body, -(w/2-2)*s, -(h/2-2)*s, (w-4)*s, (h-4)*s);
    poly(ctx, body, [[-w/2*s,0],[-(w/2+7)*s,-7*s],[-(w/2+7)*s,7*s],[-w/2*s,3*s]]);
    if (fish.shape === 'betta') {
      px(ctx, accent, -18*s, -16*s, 19*s, 6*s); px(ctx, accent, -20*s, 10*s, 21*s, 7*s);
    }
    if (fish.shape === 'puffer') {
      for (const [x, y] of [[-11,-14],[2,-15],[13,-10],[-13,12],[3,13],[14,8]] as const) px(ctx, accent, x*s, y*s, 3*s, 4*s);
    }
    if (fish.shape === 'catfish') {
      px(ctx, dark, 16*s, 5*s, 17*s, 2*s); px(ctx, dark, 16*s, 9*s, 14*s, 2*s);
    }
    px(ctx, accent, -5*s, -(h/2-2)*s, 7*s, (h-4)*s);
  }
  px(ctx, '#f2e6c5', 13*s, -4*s, 4*s, 4*s); px(ctx, '#22262a', 14*s, -3*s, 2*s, 2*s);
  ctx.restore();
}

function drawWater(ctx: CanvasRenderingContext2D, waterId: FishingWaterId, w: number, h: number): void {
  const water = fishingWaterById(waterId);
  px(ctx, water.palette[0], 0, 0, w, h);
  px(ctx, water.palette[1], 0, Math.floor(h * .2), w, h * .8);
  for (let y = Math.floor(h * .25); y < h; y += 12) {
    const shift = (y / 12) % 2 ? 7 : 0;
    for (let x = -8 + shift; x < w; x += 34) px(ctx, water.palette[2], x, y, 18, 2);
  }
  if (waterId === 'rail_garden') {
    px(ctx, '#444a43', 0, 0, w, 14); px(ctx, '#7c765f', 0, 14, w, 5);
    for (let x = 4; x < w; x += 20) px(ctx, '#5d594c', x, 4, 11, 4);
    for (let x = 8; x < w; x += 27) { px(ctx, '#536d54', x, h-28, 3, 23); px(ctx, '#77906b', x-3, h-24, 5, 7); }
  } else if (waterId === 'moon_channel') {
    px(ctx, '#303345', 0, 0, w, 17); px(ctx, '#5e5966', 0, 14, w, 4);
    for (let x = 10; x < w; x += 38) px(ctx, '#d4ad70', x, 22, 13, 3);
    px(ctx, '#9698ac', w-29, 7, 12, 12); px(ctx, '#303345', w-26, 7, 12, 9);
  } else {
    px(ctx, '#3a3d4c', 0, 0, w, 15); px(ctx, '#b2a581', 0, 13, w, 3);
    px(ctx, '#767b84', 10, 4, 40, 4); px(ctx, '#d5d0bd', 16, 2, 17, 3);
    for (let x = 6; x < w; x += 25) { px(ctx, '#70806b', x, h-20, 3, 15); px(ctx, '#91a083', x-3, h-19, 6, 5); }
  }
  for (let i = 0; i < 9; i += 1) {
    const x = (i * 37 + 13) % w, y = 28 + ((i * 19) % Math.max(20, h - 40));
    px(ctx, 'rgba(214,232,226,.55)', x, y, i % 3 === 0 ? 3 : 2, 2);
  }
}

export function paintFishingScene(canvas: HTMLCanvasElement, waterId: FishingWaterId, fishId: string | null): void {
  canvas.width = 224; canvas.height = 148;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  drawWater(ctx, waterId, canvas.width, canvas.height);
  px(ctx, 'rgba(10,18,25,.28)', 0, 111, 224, 37);
  if (fishId) {
    const fish = fishById(fishId);
    drawFishingCreature(ctx, fish, 115, 83, 1.8);
    px(ctx, '#d9e8dd', 154, 51, 3, 3); px(ctx, '#d9e8dd', 165, 41, 4, 4); px(ctx, '#d9e8dd', 173, 58, 2, 2);
  } else {
    px(ctx, 'rgba(220,236,226,.72)', 83, 78, 58, 2); px(ctx, 'rgba(220,236,226,.35)', 95, 72, 35, 2);
    px(ctx, '#d8c08b', 111, 46, 3, 34); px(ctx, '#f2ddb0', 111, 74, 3, 5);
  }
  px(ctx, '#171c22', 0, 142, 224, 6);
}

export function paintFishBadge(canvas: HTMLCanvasElement, fishId: string, discovered: boolean, rank?: FishingRank): void {
  canvas.width = 64; canvas.height = 48;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const fish = fishById(fishId); const water = fishingWaterById(fish.waterId);
  px(ctx, water.palette[0], 0, 0, 64, 48); px(ctx, water.palette[1], 2, 2, 60, 44);
  px(ctx, water.palette[2], 5, 9, 23, 2); px(ctx, water.palette[2], 35, 35, 21, 2);
  if (discovered) drawFishingCreature(ctx, fish, 34, 25, .8);
  else { px(ctx, '#172126', 16, 19, 36, 13); px(ctx, '#172126', 8, 15, 10, 20); }
  const stamp = rank === 'gold' ? '#e2bd64' : rank === 'silver' ? '#b9c3c4' : rank === 'bronze' ? '#b47f5c' : '#36464d';
  px(ctx, stamp, 4, 39, rank ? 18 : 7, 4);
}
