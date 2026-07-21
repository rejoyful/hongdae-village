import {
  newSession, tap, INGREDIENTS, INGREDIENT_LABEL, ORDER_COUNT,
  type CafeSession, type Ingredient,
} from '../game/entities/cafeGame';

/** 카페 「모퉁이」 알바 패널 — 주문서 순서대로 재료 탭, 5잔 완성 시 onComplete */
export class CafePanel {
  private root: HTMLDivElement;
  private session: CafeSession = newSession();
  private opened = false;
  private note = '';

  constructor(private readonly opts: {
    onComplete: () => void;
    onToggle: (open: boolean) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-cafe';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.session = newSession();
    this.note = '어서오세요! 주문서 순서대로 만들어주세요 ☕';
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

  private tapIngredient(ing: Ingredient): void {
    const r = tap(this.session, ing);
    this.session = r.session;
    if (r.event === 'wrong') this.note = '앗, 순서가 달라요! 이 잔은 다시 만들어요 😅';
    else if (r.event === 'progress') this.note = '좋아요, 그 다음은…';
    else if (r.event === 'order-done') this.note = '한 잔 완성! 다음 손님 주문이요 ✨';
    else if (r.event === 'all-done') {
      this.note = '';
      this.close();
      this.opts.onComplete();
      return;
    }
    this.render();
  }

  private render(): void {
    const s = this.session;
    const order = s.orders[s.current] ?? [];
    this.root.innerHTML = `
      <div class="hv-cafe-card">
        <div class="hv-cafe-head">
          <h2>카페 모퉁이 · 알바</h2>
          <span>${Math.min(s.current + 1, ORDER_COUNT)} / ${ORDER_COUNT}잔</span>
          <button class="close">✕</button>
        </div>
        <div class="hv-cafe-order">
          ${order.map((ing, i) => `<span class="${i < s.progress ? 'done' : i === s.progress ? 'now' : ''}">${INGREDIENT_LABEL[ing]}</span>`).join('')}
        </div>
        <p class="note">${this.note}</p>
        <div class="hv-cafe-btns">
          ${INGREDIENTS.map((ing) => `<button data-ing="${ing}">${INGREDIENT_LABEL[ing]}</button>`).join('')}
        </div>
      </div>`;
    this.root.querySelector('.close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('button[data-ing]').forEach((b) => {
      b.addEventListener('click', () => this.tapIngredient(b.dataset.ing as Ingredient));
    });
  }

  destroy(): void { this.root.remove(); }
}
