import { RESIDENTS, trustOf, metCount, type TrustState } from '../game/residents/residents';

/** 주민 패널 (레퍼런스 IMG_9827) — 초상화 + 신뢰도, 못 만난 주민은 실루엣 ?????? */
export class ResidentsPanel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(
    /** 주민 id → 스프라이트에서 구운 초상 dataURL */
    private readonly portraits: Record<string, string>,
    private readonly opts: { onToggle: (open: boolean) => void },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-res';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(trust: TrustState): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'flex';
    const rows = RESIDENTS.map((r) => {
      const v = trustOf(trust, r.id);
      const met = v > 0;
      const img = this.portraits[r.id];
      return `
        <div class="res-row ${met ? '' : 'unmet'}">
          ${img ? `<img src="${img}" alt="">` : '<i></i>'}
          <div class="res-info">
            <b>${met ? `${r.name} <span>· ${r.role}</span>` : '??????'}</b>
            <div class="res-bar"><em style="width:${v}%"></em><label>신뢰도</label><strong>${v}%</strong></div>
          </div>
        </div>`;
    }).join('');
    this.root.innerHTML = `
      <div class="wood-frame res-frame">
        <div class="wood-head"><h2>👥 주민</h2><span class="pill">🤝 ${metCount(trust)} / ${RESIDENTS.length}</span></div>
        <div class="wood-page res-list">${rows}</div>
        <p class="res-tip">주민 곁에 다가가 인사하면 신뢰도가 올라요 (하루 한 번)</p>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
