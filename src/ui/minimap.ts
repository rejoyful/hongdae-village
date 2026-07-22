import { MAP_W, MAP_H } from '../game/config';
import { drawVillageMap, type MTile } from './mapRender';

const PX = 3; // 미니맵 내부 해상도(타일당) — 240×168, CSS로 축소

/** 우측 상단 미니맵 — 항상 표시. 내 위치(초록)·다른 유저(파랑)를 실시간으로 보여준다. 클릭 시 전체 지도 */
export class Minimap {
  private root: HTMLDivElement;
  private ctx: CanvasRenderingContext2D | null;
  private pulse = 0;
  private shown = true;

  constructor(onExpand: () => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-minimap';
    this.root.innerHTML = `
      <canvas width="${MAP_W * PX}" height="${MAP_H * PX}"></canvas>
      <span class="mm-tag">🗺️ 지도</span>`;
    this.root.title = '클릭하면 전체 지도';
    this.root.addEventListener('click', onExpand);
    document.body.appendChild(this.root);
    this.ctx = this.root.querySelector('canvas')!.getContext('2d');
  }

  /** 매 프레임(스로틀) 호출 — 내 타일 + 다른 유저 타일 */
  update(player: MTile, remotes: MTile[]): void {
    if (!this.ctx || !this.shown) return;
    this.pulse = (this.pulse + 1) % 4;
    drawVillageMap(this.ctx, PX, { player, remotes, pulse: this.pulse, labels: false });
  }

  setVisible(v: boolean): void {
    this.shown = v;
    this.root.style.display = v ? 'block' : 'none';
  }

  destroy(): void { this.root.remove(); }
}
