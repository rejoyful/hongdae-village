import type {
  StarterCompassConciergeStage, StarterCompassRouteView,
} from '../progression/starterCompass';

export const STARTER_CONCIERGE_ART_W = 336;
export const STARTER_CONCIERGE_ART_H = 104;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
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

/** 월드 도크에서 현재 성향과 남은 한 걸음을 보여 주는 작은 2.5D 안내소. */
export function paintStarterConciergeArt(
  canvas: HTMLCanvasElement,
  route: StarterCompassRouteView | null,
  stage: StarterCompassConciergeStage,
  allRoutes: readonly StarterCompassRouteView[],
): void {
  canvas.width = STARTER_CONCIERGE_ART_W;
  canvas.height = STARTER_CONCIERGE_ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const accent = route?.color ?? '#8a735e';
  const deep = shade(accent, -68);
  rect(ctx, '#17151a', 0, 0, 336, 104);
  rect(ctx, deep, 0, 0, 336, 64);
  rect(ctx, shade(deep, 18), 0, 64, 336, 40);
  for (let x = 10; x < 330; x += 22) rect(ctx, x % 44 ? '#ffffff16' : accent, x, 9 + (x % 13), 2, 2);
  rect(ctx, shade(accent, -42), 20, 22, 72, 49);
  rect(ctx, shade(accent, -10), 25, 27, 62, 39);
  rect(ctx, deep, 30, 32, 52, 29);
  rect(ctx, '#eee0bd', 36, 37, 33, 4);
  rect(ctx, accent, 36, 47, 40, 6);
  rect(ctx, shade(accent, 30), 36, 58, 25, 3);

  diamond(ctx, shade(accent, -54), 204, 80, 214, 38);
  diamond(ctx, shade(accent, -22), 204, 73, 214, 34);
  rect(ctx, shade(accent, -50), 147, 35, 114, 35);
  rect(ctx, '#1b181d', 153, 40, 102, 25);
  rect(ctx, accent, 158, 45, 92, 5);
  rect(ctx, '#eadfbd', 166, 55, 42, 4);
  rect(ctx, shade(accent, 28), 214, 55, 28, 4);
  rect(ctx, '#4a342d', 199, 70, 8, 20);
  rect(ctx, '#735240', 196, 62, 14, 9);
  rect(ctx, '#e2b990', 198, 54, 10, 9);
  rect(ctx, '#332b31', 197, 50, 12, 6);

  const routeOrder = allRoutes.slice(0, 6);
  routeOrder.forEach((entry, index) => {
    const x = 274 + (index % 3) * 18;
    const y = 25 + Math.floor(index / 3) * 24;
    const active = entry.id === route?.id;
    rect(ctx, active ? entry.color : shade(entry.color, -48), x, y, 13, 15);
    rect(ctx, entry.complete ? '#f1d684' : '#211d24', x + 4, y + 4, 5, 5);
    if (active) {
      rect(ctx, '#fff1c8', x - 2, y - 2, 17, 2);
      rect(ctx, '#fff1c8', x - 2, y + 15, 17, 2);
    }
  });
  rect(ctx, '#151319dd', 9, 7, 115, 15);
  ctx.fillStyle = '#f0dfc4';
  ctx.font = '900 7px ui-monospace, monospace';
  ctx.fillText(stage === 'all-complete' ? 'WELCOME DESK · COMPLETE' : 'WELCOME DESK · ONE STEP', 15, 12);
}
