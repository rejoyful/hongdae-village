import type { MoveInput } from '../game/entities/playerMotion';

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

interface ActionDef { emoji: string; label: string; onTap: () => void }

/** 모바일 터치 컨트롤 — 좌하단 D-패드 + 우하단 액션 버튼 */
export class TouchControls {
  private root: HTMLDivElement;
  private state: MoveInput = { up: false, down: false, left: false, right: false };

  constructor(actions: ActionDef[]) {
    this.root = document.createElement('div');
    this.root.className = 'hv-touch';
    this.root.innerHTML = `
      <div class="hv-dpad">
        <button data-dir="up" class="u">▲</button>
        <button data-dir="left" class="l">◀</button>
        <button data-dir="right" class="r">▶</button>
        <button data-dir="down" class="d">▼</button>
      </div>
      <div class="hv-actions">
        ${actions.map((a, i) => `<button data-act="${i}" title="${a.label}">${a.emoji}</button>`).join('')}
      </div>`;
    document.body.appendChild(this.root);

    this.root.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((b) => {
      const dir = b.dataset.dir as keyof MoveInput;
      const press = (e: Event) => { e.preventDefault(); this.state[dir] = true; };
      const release = (e: Event) => { e.preventDefault(); this.state[dir] = false; };
      b.addEventListener('pointerdown', press);
      b.addEventListener('pointerup', release);
      b.addEventListener('pointerleave', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
      b.addEventListener('click', () => actions[Number(b.dataset.act)]!.onTap());
    });
  }

  /** 현재 눌린 방향 (키보드 입력과 OR로 합쳐 쓴다) */
  getInput(): MoveInput { return { ...this.state }; }

  destroy(): void { this.root.remove(); }
}
