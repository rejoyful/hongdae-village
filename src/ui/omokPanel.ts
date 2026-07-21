import { newOmok, place, aiMove, OMOK_N, type OmokState } from '../game/entities/omok';

/** 숲길 오목판 — 플레이어(흑) vs AI(백). 승리 시 onWin */
export class OmokPanel {
  private root: HTMLDivElement;
  private state: OmokState = newOmok();
  private opened = false;
  private note = '';
  private busy = false;

  constructor(private readonly opts: {
    onWin: () => void;
    onToggle: (open: boolean) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-omok';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.state = newOmok();
    this.note = '흑을 잡으셨어요 — 다섯 개를 이어보세요!';
    this.busy = false;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private async tap(x: number, y: number): Promise<void> {
    if (this.busy || this.state.winner || this.state.turn !== 1) return;
    const placed = place(this.state, x, y);
    if (!placed) return;
    this.state = placed;
    if (this.state.winner === 1) {
      this.note = '이겼습니다! 공원의 고수가 되셨네요 🎉';
      this.render();
      setTimeout(() => { this.close(); this.opts.onWin(); }, 900);
      return;
    }
    this.busy = true;
    this.note = '상대가 고민 중…';
    this.render();
    await new Promise((r) => setTimeout(r, 350 + Math.random() * 450));
    const mv = aiMove(this.state);
    if (mv) {
      const next = place(this.state, mv.x, mv.y);
      if (next) this.state = next;
    }
    this.busy = false;
    if (this.state.winner === 2) this.note = '아쉽다! 한 판 더? (새로 열면 리셋)';
    else if (!mv) this.note = '무승부네요!';
    else this.note = '당신 차례예요';
    this.render();
  }

  private render(): void {
    const cells = Array.from({ length: OMOK_N * OMOK_N }, (_, i) => {
      const v = this.state.board[i];
      return `<button data-i="${i}" class="${v === 1 ? 'b' : v === 2 ? 'w' : ''}" ${v !== 0 || this.state.winner ? 'disabled' : ''}></button>`;
    }).join('');
    this.root.innerHTML = `
      <div class="hv-omok-card">
        <div class="hv-cafe-head">
          <h2>공원 오목 ⚫⚪</h2>
          <span>${this.state.moves}수</span>
          <button class="close">✕</button>
        </div>
        <div class="hv-omok-board" style="grid-template-columns: repeat(${OMOK_N}, 1fr)">${cells}</div>
        <p class="note">${this.note}</p>
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-i]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        void this.tap(i % OMOK_N, Math.floor(i / OMOK_N));
      });
    });
  }

  destroy(): void { this.root.remove(); }
}
