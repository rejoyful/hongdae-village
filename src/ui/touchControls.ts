import type { MoveInput } from '../game/entities/playerMotion';

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

const DEAD_ZONE = 12;   // px — 이 안쪽은 정지 (탭과 구분)
const KNOB_MAX = 34;    // 노브 최대 이동 반경

export interface ActionDef { emoji: string; label: string; onTap: () => void }

/**
 * 모바일 터치 컨트롤 v2 — 화면 아무 곳이나 누르면 그 자리에 조이스틱이 떠서
 * 끄는 방향으로 8방향 이동. 고정 D-패드보다 손이 훨씬 편하다.
 * (UI 버튼 위 터치는 캔버스가 아니므로 무시된다)
 * 액션 버튼이 필요한 씬(방 꾸미기 등)은 actions로 우하단 버튼을 추가한다.
 */
export class TouchControls {
  private root: HTMLDivElement;
  private base: HTMLDivElement;
  private knob: HTMLDivElement;
  private actionsEl: HTMLDivElement | null = null;
  private state: MoveInput = { up: false, down: false, left: false, right: false };
  private pointerId: number | null = null;
  private origin = { x: 0, y: 0 };
  private readonly onDown: (e: PointerEvent) => void;
  private readonly onMove: (e: PointerEvent) => void;
  private readonly onUp: (e: PointerEvent) => void;

  constructor(actions: ActionDef[] = []) {
    this.root = document.createElement('div');
    this.root.className = 'hv-stick';
    this.root.innerHTML = '<div class="hv-stick-base"><div class="hv-stick-knob"></div></div>';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.base = this.root.querySelector('.hv-stick-base')!;
    this.knob = this.root.querySelector('.hv-stick-knob')!;

    if (actions.length) {
      this.actionsEl = document.createElement('div');
      this.actionsEl.className = 'hv-actions';
      this.actionsEl.innerHTML = actions
        .map((a, i) => `<button data-act="${i}" title="${a.label}">${a.emoji}</button>`).join('');
      document.body.appendChild(this.actionsEl);
      this.actionsEl.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
        b.addEventListener('click', () => actions[Number(b.dataset.act)]!.onTap());
      });
    }

    this.onDown = (e) => {
      // 게임 캔버스 위 터치만 — DOM UI(버튼·패널)는 그대로 동작
      if (this.pointerId !== null || !(e.target instanceof HTMLCanvasElement)) return;
      this.pointerId = e.pointerId;
      this.origin = { x: e.clientX, y: e.clientY };
      this.root.style.display = 'block';
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.knob.style.transform = 'translate(-50%, -50%)';
    };
    this.onMove = (e) => {
      if (e.pointerId !== this.pointerId) return;
      const dx = e.clientX - this.origin.x;
      const dy = e.clientY - this.origin.y;
      const len = Math.hypot(dx, dy);
      const k = len > KNOB_MAX ? KNOB_MAX / len : 1;
      this.knob.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
      if (len < DEAD_ZONE) {
        this.state = { up: false, down: false, left: false, right: false };
        return;
      }
      // 8방향: 축 성분이 벡터의 40% 이상이면 그 방향도 켠다 (대각 이동)
      const t = len * 0.4;
      this.state = {
        left: dx < -t, right: dx > t,
        up: dy < -t, down: dy > t,
      };
    };
    this.onUp = (e) => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.state = { up: false, down: false, left: false, right: false };
      this.root.style.display = 'none';
    };

    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  /** 현재 방향 (키보드 입력과 OR로 합쳐 쓴다) */
  getInput(): MoveInput { return { ...this.state }; }

  destroy(): void {
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.actionsEl?.remove();
    this.root.remove();
  }
}
