/** 실내(매장·방·회사) 전용 나가기 버튼 — 문을 못 찾아도 한 번에 거리로 나간다 */
export class ExitButton {
  private root: HTMLButtonElement;

  constructor(onExit: () => void, label = '나가기') {
    this.root = document.createElement('button');
    this.root.className = 'hv-exit';
    this.root.type = 'button';
    this.root.innerHTML = `<span class="ico">🚪</span>${label}`;
    this.root.addEventListener('click', (e) => { e.preventDefault(); onExit(); });
    document.body.appendChild(this.root);
  }

  destroy(): void { this.root.remove(); }
}
