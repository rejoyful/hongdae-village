import { MAP_W, MAP_H } from '../game/config';
import {
  ZONES, SOLID_RECTS, HOUSE_DOORS, BUSKING_SPOT, OMOK_SPOT, BOARD_SPOT,
} from '../game/world/mapData';

const PX = 8; // 타일당 픽셀 (캔버스 내부 해상도)

/** 존 이름 → 지도 채색 (레퍼런스 IMG_9822의 일러스트 맵 무드) */
const ZONE_FILL: Record<string, string> = {
  '경의선 숲길': '#79a95f',
  '주택 골목 (서)': '#d9c49a',
  '주택 골목 (동)': '#d9c49a',
  '메인 스트리트': '#b9ac9c',
  '포차 골목': '#cba48c',
  '홍대입구역 9번 출구': '#b0b8ba',
  '벽화 골목': '#c2b389',
};

/** 북측 상가 4곳 (SOLID_RECTS 19~22 순서와 일치) — 브랜드 컬러 + 라벨 */
const BRAND_SHOPS = [
  { label: 'Apple', color: '#e8e8ea', text: '#333' },
  { label: 'GS25', color: '#3db3e4', text: '#fff' },
  { label: 'CU', color: '#8dc540', text: '#fff' },
  { label: '세븐일레븐', color: '#ee7c32', text: '#fff' },
];

/** 지도 패널 — 마을 데이터를 캔버스에 일러스트풍으로 렌더 + 내 위치 핀 */
export class MapPanel {
  private root: HTMLDivElement;
  private opened = false;
  private canvas: HTMLCanvasElement | null = null;
  private timer: number | null = null;
  private pulse = 0;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    /** 열려 있는 동안 주기 호출 — 내 현재 타일 */
    getPlayerTile: () => { tx: number; ty: number };
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-map';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'flex';
    this.root.innerHTML = `
      <div class="wood-frame map-frame">
        <div class="wood-head"><h2>🗺️ 지도 · 홍대입구</h2><span class="pill">📍 내 위치</span></div>
        <div class="wood-page map-page">
          <canvas width="${MAP_W * PX}" height="${MAP_H * PX}"></canvas>
        </div>
        <button class="wood-close">✕</button>
      </div>`;
    this.canvas = this.root.querySelector('canvas')!;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.draw();
    this.timer = window.setInterval(() => { this.pulse = (this.pulse + 1) % 4; this.draw(); }, 350);
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private draw(): void {
    const ctx = this.canvas?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // 바탕 종이
    ctx.fillStyle = '#e8d8ac';
    ctx.fillRect(0, 0, MAP_W * PX, MAP_H * PX);

    // 존 채색
    for (const z of ZONES) {
      ctx.fillStyle = ZONE_FILL[z.name] ?? '#cfc0a0';
      ctx.fillRect(z.rect.x * PX, z.rect.y * PX, z.rect.w * PX, z.rect.h * PX);
    }

    // 숲길 나무 (규칙 배치 — 일러스트 느낌)
    const forest = ZONES[0]!.rect;
    ctx.fillStyle = '#4f7d3f';
    for (let i = 0; i < 26; i++) {
      const tx = forest.x + 1 + ((i * 3) % (forest.w - 2));
      const ty = forest.y + 1 + ((i * 5) % (forest.h - 2));
      ctx.beginPath();
      ctx.arc(tx * PX + PX / 2, ty * PX + PX / 2, PX * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 건물: 4~13 주택, 14~17 상점, 18 역, 19~22 브랜드 상가
    SOLID_RECTS.forEach((r, i) => {
      if (i < 4) return; // 테두리 벽
      const x = r.x * PX, y = r.y * PX, w = r.w * PX, h = r.h * PX;
      if (i <= 13) { // 주택 — 지붕 얹은 갈색 블록
        ctx.fillStyle = '#9c6b45'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#c4584a'; ctx.fillRect(x, y, w, Math.max(4, h * 0.4));
      } else if (i <= 17) { // 상점가
        ctx.fillStyle = '#8a745c'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e0b060'; ctx.fillRect(x, y, w, 4);
      } else if (i === 18) { // 역 출구
        ctx.fillStyle = '#6a7a80'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#dce4e6'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      } else { // 브랜드 상가
        const b = BRAND_SHOPS[i - 19]!;
        ctx.fillStyle = '#5c4432'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = b.color; ctx.fillRect(x, y, w, h);
      }
    });

    // 라벨 (흰 글씨 + 진갈색 외곽)
    const label = (text: string, tx: number, ty: number, size = 11): void => {
      ctx.font = `700 ${size}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = '#3a2a18'; ctx.lineJoin = 'round';
      ctx.strokeText(text, tx * PX, ty * PX);
      ctx.fillStyle = '#fff6e0';
      ctx.fillText(text, tx * PX, ty * PX);
    };
    label('경의선 숲길', 40, 5.6);
    label('주택 골목', 12, 11.6, 10);
    label('주택 골목', 67, 11.6, 10);
    label('포차 골목', 11, 39, 10);
    label('벽화 골목', 68, 39, 10);
    label('홍대입구역 9번 출구', 40, 52.4, 10);
    BRAND_SHOPS.forEach((b, i) => {
      const r = SOLID_RECTS[19 + i]!;
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = b.text;
      ctx.fillText(b.label, (r.x + r.w / 2) * PX, (r.y + r.h / 2 + 0.4) * PX);
    });
    label('살림(가구)', 12, 32.4, 9);
    label('카페 모퉁이', 28, 32.4, 9);

    // 활동 스팟 이모지
    const spot = (emoji: string, tx: number, ty: number): void => {
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, tx * PX + PX / 2, ty * PX + PX);
    };
    spot('🎸', BUSKING_SPOT.tx, BUSKING_SPOT.ty);
    spot('⚫', OMOK_SPOT.tx, OMOK_SPOT.ty);
    spot('📋', BOARD_SPOT.tx, BOARD_SPOT.ty);
    for (const d of HOUSE_DOORS) {
      ctx.font = '700 8px system-ui, sans-serif';
      ctx.fillStyle = '#fff6e0';
      ctx.fillText(String(d.roomId), d.tx * PX + PX / 2, d.ty * PX);
    }

    // 내 위치 핀 (펄스)
    const { tx, ty } = this.opts.getPlayerTile();
    const px = tx * PX + PX / 2, py = ty * PX + PX / 2;
    const r = 5 + this.pulse;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(228, 70, 50, 0.25)';
    ctx.arc(px, py, r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e44632';
    ctx.beginPath(); ctx.arc(px, py - 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 4); ctx.lineTo(px + 4, py - 4); ctx.lineTo(px, py + 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px, py - 6, 2, 0, Math.PI * 2); ctx.fill();
  }

  destroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.root.remove();
  }
}
