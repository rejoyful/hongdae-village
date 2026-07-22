import { MAP_W, MAP_H } from '../game/config';
import { drawVillageMap, type MTile } from './mapRender';

const PX = 8; // 타일당 픽셀 (캔버스 내부 해상도)

/** 지도 패널 — 공용 렌더러로 마을 전체를 그리고, 내 위치·다른 유저를 표시 */
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
    /** 다른 유저 타일 목록 */
    getRemoteTiles?: () => MTile[];
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
    drawVillageMap(ctx, PX, {
      player: this.opts.getPlayerTile(),
      remotes: this.opts.getRemoteTiles?.() ?? [],
      pulse: this.pulse,
      labels: true,
    });
  }

  destroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.root.remove();
  }
}
