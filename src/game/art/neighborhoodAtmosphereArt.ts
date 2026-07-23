import {
  NEIGHBORHOOD_ATMOSPHERE_BY_ID,
  type NeighborhoodAtmosphereId,
} from '../world/neighborhoodAtmospheres';

export const NEIGHBORHOOD_ATMOSPHERE_ART_W = 360;
export const NEIGHBORHOOD_ATMOSPHERE_ART_H = 216;

interface Point { x: number; y: number }

const hex = (value: string): string => value.startsWith('#') ? value : `#${value}`;

function polygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string, stroke?: string): void {
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function isoDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  polygon(ctx, [
    { x, y: y - h / 2 },
    { x: x + w / 2, y },
    { x, y: y + h / 2 },
    { x: x - w / 2, y },
  ], fill);
}

function building(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  level: number,
  left: string,
  right: string,
  roof: string,
  light: string,
): void {
  const top = y - level;
  polygon(ctx, [
    { x: x - w / 2, y: top },
    { x, y: top + h / 2 },
    { x, y: y + h / 2 },
    { x: x - w / 2, y },
  ], left);
  polygon(ctx, [
    { x, y: top + h / 2 },
    { x: x + w / 2, y: top },
    { x: x + w / 2, y },
    { x, y: y + h / 2 },
  ], right);
  polygon(ctx, [
    { x, y: top - h / 2 },
    { x: x + w / 2, y: top },
    { x, y: top + h / 2 },
    { x: x - w / 2, y: top },
  ], roof, '#2f2930');
  ctx.fillStyle = light;
  ctx.fillRect(x - w / 2 + 8, top + 8, 10, 7);
  ctx.fillRect(x + 8, top + 10, 10, 7);
  ctx.fillStyle = '#3f3029';
  ctx.fillRect(x - 5, y + h / 2 - 16, 10, 16);
}

function drawTown(ctx: CanvasRenderingContext2D, palette: readonly string[]): void {
  ctx.fillStyle = hex(palette[0]!);
  ctx.fillRect(0, 0, NEIGHBORHOOD_ATMOSPHERE_ART_W, NEIGHBORHOOD_ATMOSPHERE_ART_H);
  const skyGlow = ctx.createLinearGradient(0, 0, 0, 150);
  skyGlow.addColorStop(0, hex(palette[1]!));
  skyGlow.addColorStop(1, hex(palette[0]!));
  ctx.fillStyle = skyGlow;
  ctx.fillRect(0, 0, NEIGHBORHOOD_ATMOSPHERE_ART_W, 148);

  isoDiamond(ctx, 180, 142, 330, 146, hex(palette[1]!));
  isoDiamond(ctx, 180, 145, 292, 126, '#6c625c');
  isoDiamond(ctx, 180, 146, 88, 126, '#4e4d4d');
  isoDiamond(ctx, 180, 146, 274, 38, '#4e4d4d');

  const light = hex(palette[3]!);
  building(ctx, 94, 120, 86, 42, 53, '#a98571', '#82675c', '#654a49', light);
  building(ctx, 258, 112, 82, 39, 60, '#8d8194', '#685f76', '#54465e', light);
  building(ctx, 68, 166, 72, 34, 38, '#8e9c84', '#65785f', '#5c5848', light);
  building(ctx, 286, 168, 74, 35, 42, '#ad846d', '#8c6558', '#68494c', light);

  ctx.fillStyle = '#313132';
  for (const x of [128, 180, 232]) {
    ctx.fillRect(x - 2, 118, 4, 42);
    ctx.fillStyle = light;
    ctx.fillRect(x - 5, 116, 10, 7);
    ctx.fillStyle = '#313132';
  }
  ctx.fillStyle = '#334335';
  ctx.fillRect(131, 164, 10, 22);
  ctx.fillStyle = '#637a59';
  ctx.fillRect(124, 153, 24, 18);
  ctx.fillStyle = '#26382f';
  ctx.fillRect(219, 164, 9, 20);
  ctx.fillStyle = '#6d855d';
  ctx.fillRect(212, 153, 23, 17);
}

function drawWeather(
  ctx: CanvasRenderingContext2D,
  id: NeighborhoodAtmosphereId,
  palette: readonly string[],
): void {
  const accent = hex(palette[3]!);
  if (id === 'soft_sun') {
    ctx.fillStyle = `${accent}66`;
    ctx.fillRect(258, 20, 34, 34);
    ctx.fillStyle = `${accent}1f`;
    ctx.fillRect(231, 4, 88, 82);
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = i % 2 ? `${accent}99` : `${accent}55`;
      ctx.fillRect(18 + ((i * 53) % 315), 23 + ((i * 29) % 150), 2, 2);
    }
  } else if (id === 'cloud_walk') {
    ctx.fillStyle = `${accent}88`;
    for (const [x, y, w] of [[32, 28, 93], [142, 15, 118], [248, 40, 84]] as const) {
      ctx.fillRect(x, y, w, 13);
      ctx.fillRect(x + 14, y - 8, w - 28, 9);
    }
  } else if (id === 'window_rain' || id === 'neon_shower') {
    const colors = id === 'neon_shower' ? ['#d77bb8', '#7ea4d8', '#f0bd74'] : ['#c5d4d2', '#91afb7'];
    for (let i = 0; i < 52; i += 1) {
      const x = 10 + ((i * 47) % 340);
      const y = 5 + ((i * 31) % 190);
      ctx.fillStyle = colors[i % colors.length]!;
      ctx.fillRect(x, y, 2, 10 + (i % 3) * 3);
    }
    if (id === 'neon_shower') {
      ctx.fillStyle = '#c05c8b55';
      polygon(ctx, [{ x: 180, y: 158 }, { x: 241, y: 190 }, { x: 180, y: 210 }, { x: 118, y: 190 }], '#c05c8b55');
    }
  } else if (id === 'golden_garden') {
    ctx.fillStyle = `${accent}55`;
    polygon(ctx, [{ x: 0, y: 0 }, { x: 145, y: 0 }, { x: 278, y: 216 }, { x: 185, y: 216 }], `${accent}55`);
    for (let i = 0; i < 24; i += 1) {
      ctx.fillStyle = `${accent}${i % 3 ? '88' : 'cc'}`;
      ctx.fillRect(8 + ((i * 67) % 344), 22 + ((i * 37) % 174), 2 + (i % 2), 2 + (i % 2));
    }
  } else if (id === 'moon_haze') {
    ctx.fillStyle = `${accent}cc`;
    ctx.fillRect(286, 20, 22, 22);
    ctx.fillStyle = `${hex(palette[2]!)}55`;
    ctx.fillRect(0, 104, 360, 16);
    ctx.fillRect(44, 125, 280, 11);
    ctx.fillRect(12, 151, 332, 8);
  } else if (id === 'first_snow') {
    for (let i = 0; i < 68; i += 1) {
      const size = 2 + (i % 4);
      ctx.fillStyle = i % 3 ? '#f5ead6' : '#cdd8df';
      ctx.fillRect(5 + ((i * 61) % 350), 4 + ((i * 43) % 202), size, size);
    }
  } else if (id === 'spring_petals') {
    for (let i = 0; i < 54; i += 1) {
      const x = 4 + ((i * 73) % 350);
      const y = 7 + ((i * 41) % 198);
      ctx.fillStyle = i % 3 ? '#efb9b9' : '#f5d3bd';
      ctx.fillRect(x, y, 5, 2);
      ctx.fillRect(x + 2, y - 1, 2, 4);
    }
  }
}

/** 관측 카드와 상세 화면이 공유하는 2.5D 픽셀 골목 장면. */
export function paintNeighborhoodAtmosphere(
  canvas: HTMLCanvasElement,
  id: NeighborhoodAtmosphereId,
  observed: boolean,
  active = false,
): void {
  const atmosphere = NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(id);
  const ctx = canvas.getContext('2d');
  if (!atmosphere || !ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTown(ctx, atmosphere.palette);
  drawWeather(ctx, id, atmosphere.palette);

  ctx.fillStyle = '#231f24dd';
  ctx.fillRect(12, 12, 157, 34);
  ctx.fillStyle = atmosphere.palette[2];
  ctx.fillRect(18, 17, 24, 24);
  ctx.fillStyle = '#2d2830';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(atmosphere.mark, 30, 33);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f6ead2';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(atmosphere.code, 49, 27);
  ctx.fillStyle = atmosphere.palette[3];
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(observed ? atmosphere.name : '아직 기록하지 않은 하늘', 49, 40);

  if (!observed) {
    ctx.fillStyle = '#17171ccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e3d9c3';
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('생활 기록 두 갈래가 만나면 열려요', canvas.width / 2, canvas.height / 2);
  } else if (active) {
    ctx.strokeStyle = atmosphere.palette[3];
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    ctx.fillStyle = '#241f24dd';
    ctx.fillRect(canvas.width - 91, canvas.height - 29, 78, 18);
    ctx.fillStyle = atmosphere.palette[3];
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('현재 골목 빛', canvas.width - 52, canvas.height - 16);
  }
}
