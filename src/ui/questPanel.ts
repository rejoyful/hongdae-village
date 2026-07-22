import { DAILY_QUESTS } from '../game/quests';

/** 마을 게시판 — 오늘의 퀘스트 진행/보상 수령 */
export class QuestPanel {
  private root: HTMLDivElement;
  private opened = false;
  private progress = new Map<string, number>();
  private claimed = new Set<string>(); // 세션 내 수령 표시 (진짜 검증은 서버 원장)
  private online: boolean;

  constructor(private readonly opts: {
    onClaim: (questId: string) => void;
    onToggle: (open: boolean) => void;
    online: boolean;
  }) {
    this.online = opts.online;
    this.root = document.createElement('div');
    this.root.className = 'hv-quest';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(progress: Map<string, number>, claimed?: string[]): void {
    if (this.opened) return;
    this.opened = true;
    this.progress = progress;
    if (claimed) this.claimed = new Set(claimed); // 지속 저장된 수령 상태 반영 (P2-3)
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

  markClaimed(questId: string): void {
    this.claimed.add(questId);
    if (this.opened) this.render();
  }

  refresh(progress: Map<string, number>): void {
    this.progress = progress;
    if (this.opened) this.render();
  }

  private render(): void {
    const rows = DAILY_QUESTS.map((q) => {
      const p = Math.min(this.progress.get(q.registryKey) ?? 0, q.goal);
      const done = p >= q.goal;
      const claimed = this.claimed.has(q.id);
      return `
        <div class="row ${done ? 'done' : ''}">
          <div class="info">
            <b>${q.name}</b>
            <span>${q.desc}</span>
          </div>
          <span class="prog">${done ? '완료!' : `${p} / ${q.goal}`}</span>
          <button data-q="${q.id}" ${done && !claimed && this.online ? '' : 'disabled'}>
            ${claimed ? '수령함' : `🪙 ${q.reward}`}
          </button>
        </div>`;
    }).join('');
    this.root.innerHTML = `
      <div class="hv-shop-card">
        <div class="hv-cafe-head">
          <h2>마을 게시판 · 오늘의 퀘스트</h2>
          <button class="close">✕</button>
        </div>
        <div class="hv-quest-rows">${rows}</div>
        ${this.online ? '' : '<p class="off">오프라인 모드 — 보상 수령은 접속 후 가능해요</p>'}
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-q]').forEach((b) => {
      b.addEventListener('click', () => this.opts.onClaim(b.dataset.q!));
    });
  }

  destroy(): void { this.root.remove(); }
}
