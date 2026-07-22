import { pickDrafts, judgeDraft, DRAFT_ACTIONS, type DraftDoc } from '../game/company/worklife';
import { audio } from '../game/audio';

/** 기안 결재 미니게임 — 문서 내용에 맞게 승인/반려/보류. 다 맞히면 보상 */
export class DraftPanel {
  private root: HTMLDivElement;
  private opened = false;
  private docs: DraftDoc[] = [];
  private idx = 0;
  private correct = 0;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    onDone: (correct: number, total: number) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-draft';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(seed: number): void {
    if (this.opened) return;
    this.opened = true;
    this.docs = pickDrafts(seed, 3);
    this.idx = 0;
    this.correct = 0;
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

  private choose(action: '승인' | '반려' | '보류'): void {
    const doc = this.docs[this.idx]!;
    const ok = judgeDraft(doc, action);
    if (ok) this.correct++;
    audio.playSe(ok ? 'coin' : 'pop');
    this.idx++;
    if (this.idx >= this.docs.length) { this.renderResult(); }
    else this.render();
  }

  private render(): void {
    const doc = this.docs[this.idx]!;
    this.root.innerHTML = `
      <div class="draft-card">
        <div class="draft-head">📝 기안 결재 <span>${this.idx + 1} / ${this.docs.length}</span></div>
        <div class="draft-doc">
          <div class="draft-stamp">기안서</div>
          <p class="draft-title">${doc.title}</p>
          <p class="draft-hint">💡 ${doc.hint}</p>
        </div>
        <div class="draft-actions">
          ${DRAFT_ACTIONS.map((a) => `<button data-a="${a}" class="a-${a}">${a}</button>`).join('')}
        </div>
        <button class="draft-close">그만두기</button>
      </div>`;
    this.root.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => {
      b.addEventListener('click', () => this.choose(b.dataset.a as '승인' | '반려' | '보류'));
    });
    this.root.querySelector('.draft-close')!.addEventListener('click', () => this.close());
  }

  private renderResult(): void {
    const perfect = this.correct === this.docs.length;
    this.root.innerHTML = `
      <div class="draft-card">
        <div class="draft-head">📝 결재 완료</div>
        <div class="draft-result">
          <div class="draft-score">${this.correct} / ${this.docs.length}</div>
          <p>${perfect ? '완벽한 결재! 팀장님이 흐뭇해합니다 😎' : '음… 재검토가 필요한 건이 있네요 ㅋㅋ'}</p>
        </div>
        <button class="draft-ok">확인</button>
      </div>`;
    this.root.querySelector('.draft-ok')!.addEventListener('click', () => {
      const c = this.correct, t = this.docs.length;
      this.close();
      this.opts.onDone(c, t);
    });
  }

  destroy(): void { this.root.remove(); }
}
