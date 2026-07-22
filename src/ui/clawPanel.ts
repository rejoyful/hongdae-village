import { newClaw, tickClaw, dropClaw, CLAW_TOLERANCE, type ClawState } from '../game/entities/clawGame';
import { seeded } from '../game/art/pixelCanvas';
import { audio } from '../game/audio';

/** 인형뽑기 패널 — 움직이는 크레인을 타이밍 맞춰 멈춰 인형 획득. 획득은 localStorage 컬렉션 */
export class ClawPanel {
  private root: HTMLDivElement;
  private opened = false;
  private state: ClawState;
  private rnd = seeded(20260722);
  private raf = 0;
  private readonly storeKey: string;
  private collection: string[] = [];

  constructor(userId: string, private readonly opts: {
    onToggle: (open: boolean) => void;
    onWin: (prize: string) => void;
  }) {
    this.storeKey = `hv-dolls-${userId}`;
    try {
      const raw = localStorage.getItem(this.storeKey);
      if (raw) this.collection = JSON.parse(raw) as string[];
    } catch { /* ignore */ }
    this.state = newClaw(this.rnd);
    this.root = document.createElement('div');
    this.root.className = 'hv-claw';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.state = newClaw(this.rnd);
    this.root.style.display = 'flex';
    this.renderShell();
    this.loop();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    cancelAnimationFrame(this.raf);
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private loop = (): void => {
    if (!this.opened) return;
    if (this.state.result === 'playing') {
      this.state = tickClaw(this.state);
      this.paint();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private drop(): void {
    if (this.state.result !== 'playing') { this.retry(); return; }
    this.state = dropClaw(this.state, this.rnd);
    if (this.state.result === 'win' && this.state.prize) {
      audio.playSe('success');
      if (!this.collection.includes(this.state.prize)) {
        this.collection.push(this.state.prize);
        try { localStorage.setItem(this.storeKey, JSON.stringify(this.collection)); } catch { /* ignore */ }
      }
      this.opts.onWin(this.state.prize);
    } else {
      audio.playSe('pop');
    }
    this.renderShell();
  }

  private retry(): void {
    this.state = newClaw(this.rnd);
    this.renderShell();
  }

  private renderShell(): void {
    const s = this.state;
    const msg = s.result === 'win' ? `🎉 ${s.prize} 획득!`
      : s.result === 'miss' ? '아깝다! 다시 도전 🕹️'
      : '크레인이 인형 위에 오면 집게!';
    this.root.innerHTML = `
      <div class="hv-claw-card">
        <div class="hv-claw-head">
          <h2>🕹️ 인형뽑기</h2>
          <span>모은 인형 ${this.collection.length}/6</span>
          <button class="close">✕</button>
        </div>
        <div class="hv-claw-machine">
          <div class="rail"><div class="crane">🦾</div></div>
          <div class="doll"></div>
        </div>
        <p class="hv-claw-msg">${msg}</p>
        <div class="hv-claw-collection">${this.collection.map((d) => `<span>${d}</span>`).join('') || '<i>아직 모은 인형이 없어요</i>'}</div>
        <button class="hv-claw-btn">${s.result === 'playing' ? '집게 내리기!' : '한 판 더'}</button>
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.hv-claw-btn')!.addEventListener('click', () => this.drop());
    this.paint();
  }

  /** 크레인·인형 위치만 갱신 (매 프레임) */
  private paint(): void {
    const crane = this.root.querySelector<HTMLElement>('.crane');
    const doll = this.root.querySelector<HTMLElement>('.doll');
    if (crane) crane.style.left = `${this.state.cranePos * 100}%`;
    if (doll) {
      doll.style.left = `${this.state.dollPos * 100}%`;
      doll.textContent = this.state.dollPos >= 0 ? '🧸' : '';
      // 성공 존 표시
      doll.style.setProperty('--tol', `${CLAW_TOLERANCE * 100}%`);
    }
  }

  destroy(): void { cancelAnimationFrame(this.raf); this.root.remove(); }
}
