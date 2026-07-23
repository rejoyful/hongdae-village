import type { StarterCompassRouteId, StarterCompassRouteView } from '../progression/starterCompass';

export const STARTER_COMPASS_ART_W = 360;
export const STARTER_COMPASS_ART_H = 124;
export const STARTER_KEEPSAKE_ART_W = 112;
export const STARTER_KEEPSAKE_ART_H = 72;

function pixel(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 모험 일지 표지에 쓰는 작은 2.5D 골목 나침반. DOM 카드와 같은 진행 상태를 반영한다. */
export function paintStarterCompassArt(
  ctx: CanvasRenderingContext2D,
  routes: readonly StarterCompassRouteView[],
  selectedRouteId: StarterCompassRouteId | null = null,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, STARTER_COMPASS_ART_W, STARTER_COMPASS_ART_H);
  const complete = routes.filter((route) => route.complete).length;

  // dusk alley backdrop
  pixel(ctx, '#262335', 0, 0, 360, 124);
  pixel(ctx, '#373349', 0, 66, 360, 58);
  for (let x = -12; x < 372; x += 28) {
    pixel(ctx, '#474257', x, 94, 22, 3);
    pixel(ctx, '#2d2a3b', x + 10, 96, 3, 18);
  }
  pixel(ctx, '#171724', 0, 113, 360, 11);
  for (let x = 12; x < 360; x += 34) pixel(ctx, '#d9b86d', x, 13 + ((x / 34) % 2) * 3, 4, 4);

  // isometric journal/map slab
  ctx.beginPath();
  ctx.moveTo(62, 72); ctx.lineTo(175, 30); ctx.lineTo(300, 64); ctx.lineTo(183, 108); ctx.closePath();
  ctx.fillStyle = '#d8c18b'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(62, 72); ctx.lineTo(183, 108); ctx.lineTo(183, 116); ctx.lineTo(62, 81); ctx.closePath();
  ctx.fillStyle = '#7c5d4b'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(183, 108); ctx.lineTo(300, 64); ctx.lineTo(300, 72); ctx.lineTo(183, 116); ctx.closePath();
  ctx.fillStyle = '#5e4b48'; ctx.fill();

  // compass rose
  ctx.save();
  ctx.translate(181, 70);
  ctx.rotate(Math.PI / 4);
  pixel(ctx, '#44394a', -18, -18, 36, 36);
  pixel(ctx, '#f3d17e', -13, -13, 26, 26);
  pixel(ctx, '#8f5860', -4, -22, 8, 44);
  pixel(ctx, '#617d76', -22, -4, 44, 8);
  pixel(ctx, '#fff0b7', -4, -4, 8, 8);
  ctx.restore();

  const points: readonly [number, number][] = [[90, 61], [126, 45], [236, 47], [275, 64], [238, 91], [126, 91]];
  routes.forEach((route, index) => {
    const [x, y] = points[index]!;
    if (route.id === selectedRouteId) {
      pixel(ctx, '#fff0b7', x - 11, y - 11, 22, 22);
      pixel(ctx, '#392f40', x - 8, y - 8, 16, 16);
    }
    pixel(ctx, route.complete ? '#f5d783' : '#594f62', x - 8, y - 8, 16, 16);
    pixel(ctx, route.complete ? route.color : '#77717d', x - 5, y - 5, 10, 10);
    if (route.complete || route.id === selectedRouteId) pixel(ctx, '#fff4c9', x - 2, y - 2, 4, 4);
  });

  // small completion ticket
  pixel(ctx, '#161521', 304, 18, 43, 27);
  pixel(ctx, '#e5c577', 307, 21, 37, 21);
  ctx.fillStyle = '#3e3545';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${complete}/6`, 325, 32);
}

/** 방향을 마친 뒤 주민에게 받는 작은 우편 소포. 수령·대표 상태가 카드에 그대로 남는다. */
export function paintStarterKeepsakeArt(
  canvas: HTMLCanvasElement,
  route: Pick<StarterCompassRouteView, 'mark' | 'color'>,
  claimed: boolean,
  featured: boolean,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, STARTER_KEEPSAKE_ART_W, STARTER_KEEPSAKE_ART_H);

  pixel(ctx, claimed ? '#292433' : '#242229', 0, 0, 112, 72);
  for (let x = 4; x < 112; x += 13) pixel(ctx, claimed ? route.color : '#403b43', x, 7 + (x % 3), 2, 2);
  pixel(ctx, '#17151c', 0, 59, 112, 13);
  pixel(ctx, '#39323a', 12, 54, 88, 5);

  // 작은 2.5D 우편 소포
  const paper = claimed ? '#e8d5a4' : '#6e6766';
  const side = claimed ? '#8f6f57' : '#494448';
  ctx.beginPath();
  ctx.moveTo(25, 27); ctx.lineTo(55, 15); ctx.lineTo(88, 26); ctx.lineTo(57, 40); ctx.closePath();
  ctx.fillStyle = paper; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(25, 27); ctx.lineTo(57, 40); ctx.lineTo(57, 53); ctx.lineTo(25, 40); ctx.closePath();
  ctx.fillStyle = side; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(57, 40); ctx.lineTo(88, 26); ctx.lineTo(88, 39); ctx.lineTo(57, 53); ctx.closePath();
  ctx.fillStyle = claimed ? '#6e5651' : '#38363d'; ctx.fill();
  pixel(ctx, claimed ? '#f3e2b5' : '#817979', 52, 17, 11, 8);
  pixel(ctx, claimed ? route.color : '#4d494f', 54, 19, 7, 5);
  pixel(ctx, claimed ? '#fff0bd' : '#938b86', 56, 21, 3, 2);

  // 소포 끈과 경로 표식
  ctx.strokeStyle = claimed ? '#725446' : '#4a4548';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(55, 15); ctx.lineTo(57, 53); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(25, 27); ctx.lineTo(88, 39); ctx.stroke();
  pixel(ctx, claimed ? route.color : '#4e4950', 18, 12, 16, 16);
  pixel(ctx, claimed ? '#fff0c6' : '#8b8380', 21, 15, 10, 10);
  ctx.fillStyle = claimed ? '#3f3334' : '#555056';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(route.mark, 26, 20);

  // 대표 소장품은 금빛 북마크로 표시
  if (featured) {
    pixel(ctx, '#f4cf72', 91, 7, 13, 22);
    pixel(ctx, '#fff0a4', 94, 10, 7, 10);
    pixel(ctx, '#9e653d', 96, 12, 3, 7);
    ctx.beginPath();
    ctx.moveTo(91, 29); ctx.lineTo(97.5, 24); ctx.lineTo(104, 29); ctx.closePath();
    ctx.fillStyle = '#f4cf72'; ctx.fill();
  }

  ctx.fillStyle = claimed ? '#e6d9bd' : '#8c8584';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(claimed ? 'WELCOME PARCEL' : 'WAITING FOR YOU', 7, 66);
}
