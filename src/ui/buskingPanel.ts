import {
  newBusking, play, NOTES, NOTE_LABEL, type BuskingSession, type Note,
} from '../game/entities/buskingGame';

/** 버스킹 패널 — 멜로디 재생(하이라이트) 후 따라 연주. 완주 시 onComplete */
export class BuskingPanel {
  private root: HTMLDivElement;
  private session: BuskingSession = newBusking();
  private opened = false;
  private playingBack = false;
  private note = '';

  constructor(private readonly opts: {
    onComplete: () => void;
    onToggle: (open: boolean) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-busking';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.session = newBusking();
    this.root.style.display = 'flex';
    this.opts.onToggle(true);
    void this.playback();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  /** 멜로디를 순서대로 하이라이트로 들려준다 */
  private async playback(): Promise<void> {
    this.playingBack = true;
    this.note = '멜로디를 잘 들어보세요… 🎧';
    this.render();
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < this.session.melody.length; i++) {
      if (!this.opened) return;
      this.render(i);
      await new Promise((r) => setTimeout(r, 420));
    }
    this.playingBack = false;
    this.note = '이제 그대로 연주해보세요!';
    this.render();
  }

  private tapNote(n: Note): void {
    if (this.playingBack) return;
    const r = play(this.session, n);
    this.session = r.session;
    if (r.event === 'wrong') this.note = '음이 어긋났어요 — 처음부터 다시! 🙂';
    else if (r.event === 'progress') this.note = '좋아요… 계속!';
    else if (r.event === 'done') {
      this.close();
      this.opts.onComplete();
      return;
    }
    this.render();
  }

  private render(highlight = -1): void {
    const s = this.session;
    this.root.innerHTML = `
      <div class="hv-cafe-card">
        <div class="hv-cafe-head">
          <h2>버스킹 🎸</h2>
          <span>${s.progress} / ${s.melody.length}음</span>
          <button class="close">✕</button>
        </div>
        <div class="hv-cafe-order">
          ${s.melody.map((n, i) => `<span class="${i < s.progress ? 'done' : ''} ${i === highlight ? 'now' : ''}">${this.playingBack || i < s.progress || i === highlight ? NOTE_LABEL[n] : '♪'}</span>`).join('')}
        </div>
        <p class="note">${this.note}</p>
        <div class="hv-cafe-btns">
          ${NOTES.map((n) => `<button data-note="${n}" ${this.playingBack ? 'disabled' : ''}>${NOTE_LABEL[n]}</button>`).join('')}
        </div>
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-note]').forEach((b) => {
      b.addEventListener('click', () => this.tapNote(b.dataset.note as Note));
    });
  }

  destroy(): void { this.root.remove(); }
}
