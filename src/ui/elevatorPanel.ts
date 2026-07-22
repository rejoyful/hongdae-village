/** 엘리베이터 패널 — 1~5층 이동 (6층은 계단, 목록에서 제외). 실제 회사 감성 ㅋㅋ */
export class ElevatorPanel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    onPick: (level: number) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-elev';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(current: number): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'flex';
    this.root.innerHTML = `
      <div class="elev-frame">
        <div class="elev-head">🛗 엘리베이터<span>6층은 계단으로 가세요</span></div>
        <div class="elev-buttons">
          ${[5, 4, 3, 2, 1].map((l) => `
            <button data-lv="${l}" class="${l === current ? 'cur' : ''}">${l}<small>F</small></button>`).join('')}
        </div>
        <button class="elev-close">닫기</button>
      </div>`;
    this.root.querySelector('.elev-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-lv]').forEach((b) => {
      b.addEventListener('click', () => { const l = Number(b.dataset.lv); this.close(); this.opts.onPick(l); });
    });
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
