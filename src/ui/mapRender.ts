import { MAP_W, MAP_H } from '../game/config';
import {
  ZONES, SOLID_RECTS, BOARD_SPOT, BUSKING_SPOT, OMOK_SPOT,
  PETSHOP_DOOR, WEAPONSHOP_DOOR, REALTY_DOOR, COMPANY_DOORS, HUNT_FIELD,
} from '../game/world/mapData';

export interface MTile { tx: number; ty: number }
export interface MapDrawOpts {
  player?: MTile;
  remotes?: MTile[];
  pulse?: number;   // 0..3 (내 핀 펄스)
  labels?: boolean; // true = 전체 지도(라벨), false = 미니맵(간결)
}

const ZONE_FILL: Record<string, string> = {
  '경의선 숲길': '#7fae63',
  '주택 골목 (서)': '#dcc79c',
  '주택 골목 (동)': '#dcc79c',
  '메인 스트리트': '#bcae9c',
  '포차 골목': '#cea88e',
  '홍대입구역 9번 출구': '#b2babc',
  '벽화 골목': '#c4b58b',
};

const BRAND_SHOPS = [
  { label: 'Apple', color: '#e8e8ea', text: '#333' },
  { label: 'GS25', color: '#3db3e4', text: '#fff' },
  { label: 'CU', color: '#8dc540', text: '#fff' },
  { label: '세븐일레븐', color: '#ee7c32', text: '#fff' },
];

/** 건물 인덱스 → 색 (모든 인덱스 안전 처리 — 예전엔 23+에서 크래시했다) */
function buildingStyle(i: number): { body: string; roof?: string; text?: string } {
  if (i >= 4 && i <= 13) return { body: '#9c6b45', roof: '#c4584a' };       // 주택
  if (i >= 14 && i <= 17) return { body: '#8a745c', roof: '#e0b060' };      // 메인 상점
  if (i === 18) return { body: '#6a7a80', roof: '#dce4e6' };                // 역 출구
  if (i >= 19 && i <= 22) { const b = BRAND_SHOPS[i - 19]!; return { body: b.color, text: b.text }; }
  if (i === 29) return { body: '#d8a24c', roof: '#8a5a1c' };                // 부동산
  if (i >= 30 && i <= 32) return { body: '#3f4f70', roof: '#7a8aac' };      // 회사 3동
  if (i === 33) return { body: '#b0537e', roof: '#e86ab0' };               // 펫샵
  if (i === 34) return { body: '#6a5544', roof: '#b08a5a' };               // 대장간
  return { body: '#8a745c', roof: '#a58a6c' };                              // 장식 건물 등
}

function userDot(ctx: CanvasRenderingContext2D, x: number, y: number, PX: number, fill: string, ring: string): void {
  const r = Math.max(2.4, PX * 0.9);
  ctx.beginPath(); ctx.fillStyle = ring; ctx.arc(x, y, r + 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.fillStyle = fill; ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.32, 0, Math.PI * 2); ctx.fill();
}

/** 마을 지도를 캔버스에 그린다 (미니맵·전체지도 공용). PX = 타일당 픽셀 */
export function drawVillageMap(ctx: CanvasRenderingContext2D, PX: number, opts: MapDrawOpts): void {
  const W = MAP_W * PX, H = MAP_H * PX;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#efe0bc'; ctx.fillRect(0, 0, W, H);

  for (const z of ZONES) {
    ctx.fillStyle = ZONE_FILL[z.name] ?? '#cfc0a0';
    ctx.fillRect(z.rect.x * PX, z.rect.y * PX, z.rect.w * PX, z.rect.h * PX);
  }
  // 사냥터(숲길) 붉은 기운
  ctx.fillStyle = 'rgba(200,70,50,0.12)';
  ctx.fillRect(HUNT_FIELD.x * PX, HUNT_FIELD.y * PX, HUNT_FIELD.w * PX, HUNT_FIELD.h * PX);
  // 숲길 나무 점
  const forest = ZONES[0]!.rect;
  ctx.fillStyle = '#4f7d3f';
  for (let i = 0; i < 26; i++) {
    const tx = forest.x + 1 + ((i * 3) % (forest.w - 2));
    const ty = forest.y + 1 + ((i * 5) % (forest.h - 2));
    ctx.beginPath(); ctx.arc(tx * PX + PX / 2, ty * PX + PX / 2, Math.max(1.2, PX * 0.85), 0, Math.PI * 2); ctx.fill();
  }

  // 건물 (모든 인덱스 안전)
  SOLID_RECTS.forEach((r, i) => {
    if (i < 4) return;
    const s = buildingStyle(i);
    const x = r.x * PX, y = r.y * PX, w = r.w * PX, h = r.h * PX;
    ctx.fillStyle = s.body; ctx.fillRect(x, y, w, h);
    if (s.roof) { ctx.fillStyle = s.roof; ctx.fillRect(x, y, w, Math.max(2, h * 0.42)); }
  });

  if (opts.labels) {
    const label = (text: string, tx: number, ty: number, size = 11): void => {
      ctx.font = `700 ${size}px "Apple SD Gothic Neo", system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#3a2a18'; ctx.lineJoin = 'round';
      ctx.strokeText(text, tx * PX, ty * PX); ctx.fillStyle = '#fff6e0'; ctx.fillText(text, tx * PX, ty * PX);
    };
    label('경의선 숲길 · 사냥터', 40, 5.4, 11);
    label('주택 골목', 12, 12, 10); label('주택 골목', 67, 12, 10);
    label('포차 골목', 11, 39, 10); label('벽화 골목', 68, 39, 10);
    label('홍대입구역', 40, 52, 10);
    BRAND_SHOPS.forEach((b, i) => {
      const r = SOLID_RECTS[19 + i]!;
      ctx.font = '700 9px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = b.text; ctx.fillText(b.label, (r.x + r.w / 2) * PX, (r.y + r.h / 2 + 0.4) * PX);
    });
    const spot = (emoji: string, t: MTile): void => {
      ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(emoji, t.tx * PX + PX / 2, t.ty * PX + PX);
    };
    spot('⚒️', WEAPONSHOP_DOOR); spot('🐾', PETSHOP_DOOR); spot('🏠', REALTY_DOOR);
    spot('📋', BOARD_SPOT); spot('🎸', BUSKING_SPOT); spot('⚫', OMOK_SPOT);
    for (const c of COMPANY_DOORS) spot('🏢', c);
  } else {
    // 미니맵: 핵심 POI 점만
    const poi = (t: MTile, color: string): void => {
      ctx.beginPath(); ctx.fillStyle = color;
      ctx.arc(t.tx * PX + PX / 2, t.ty * PX + PX / 2, Math.max(1.6, PX * 0.9), 0, Math.PI * 2); ctx.fill();
    };
    poi(WEAPONSHOP_DOOR, '#e0b060'); poi(PETSHOP_DOOR, '#e86ab0');
    poi(REALTY_DOOR, '#e8a83c'); poi(BOARD_SPOT, '#f2d24a');
  }

  // 다른 유저 (파랑)
  for (const t of opts.remotes ?? []) userDot(ctx, t.tx * PX + PX / 2, t.ty * PX + PX / 2, PX, '#5aa0e0', '#1a3a5a');

  // 나 (초록, 펄스)
  if (opts.player) {
    const x = opts.player.tx * PX + PX / 2, y = opts.player.ty * PX + PX / 2;
    const pr = Math.max(3, PX) + (opts.pulse ?? 0) * 1.2;
    ctx.beginPath(); ctx.fillStyle = 'rgba(78,200,106,0.22)'; ctx.arc(x, y, pr + 3, 0, Math.PI * 2); ctx.fill();
    userDot(ctx, x, y, PX * 1.1, '#4ec86a', '#1c4a2a');
  }
}
