import { TREASURES, RARITY_COLOR, type Treasure } from '../game/treasure/treasures';

/** 색 보정 유틸 */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

/** 보물 하나를 파세트 젬으로 렌더 (희귀도 색 + 컷 모양 + 반짝임) → dataURL */
export function renderGem(t: Treasure, size = 48): string {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const base = RARITY_COLOR[t.rarity];
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  // id 해시로 컷(면 수) 변주 6~8
  let h = 0; for (const ch of t.id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  const facets = 6 + (h % 3);
  const rot = (h % 12) / 12 * Math.PI;

  // 젬 외곽 (다각형)
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < facets; i++) {
    const a = rot + (i / facets) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.08]);
  }
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  // 본체
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, shade(base, 60));
  grad.addColorStop(0.5, base);
  grad.addColorStop(1, shade(base, -50));
  ctx.fillStyle = grad; ctx.fill();
  ctx.lineWidth = Math.max(1.5, size / 24); ctx.strokeStyle = shade(base, -80); ctx.stroke();
  // 파세트 라인 (중심 방사)
  ctx.strokeStyle = shade(base, 40); ctx.lineWidth = 1;
  for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.15); ctx.lineTo(x, y); ctx.stroke(); }
  // 상단 하이라이트 면
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.15);
  ctx.lineTo(pts[0]![0], pts[0]![1]);
  ctx.lineTo(pts[1 % facets]![0], pts[1 % facets]![1]);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  // 반짝임
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.35, size * 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.arc(cx + r * 0.25, cy + r * 0.1, size * 0.028, 0, Math.PI * 2); ctx.fill();
  return c.toDataURL();
}

let cache: Record<string, string> | null = null;
export function gemIcons(): Record<string, string> {
  if (!cache) {
    cache = {};
    for (const t of TREASURES) cache[t.id] = renderGem(t);
  }
  return cache;
}
