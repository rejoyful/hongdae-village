/**
 * Enter로 여는 채팅 입력창. 열려 있는 동안 씬이 키보드를 비활성화해야 한다
 * (onToggle 콜백에서 처리 — Phase 1 리뷰가 예고한 WASD 캡처 충돌 해소 지점).
 */
export class ChatInput {
  private root: HTMLDivElement;
  private input: HTMLInputElement;
  private opened = false;

  constructor(private readonly opts: {
    onSend: (text: string) => void;
    onToggle: (open: boolean) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-chat';
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.maxLength = 80;
    this.input.placeholder = '메시지 입력 후 Enter (Esc 닫기)';
    this.root.appendChild(this.input);
    document.body.appendChild(this.root);

    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // 게임(window) 키 리스너와 분리
      if (e.key === 'Enter') {
        const text = this.input.value;
        this.input.value = '';
        this.close();
        this.opts.onSend(text);
      } else if (e.key === 'Escape') {
        this.input.value = '';
        this.close();
      }
    });
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'block';
    this.opts.onToggle(true);
    setTimeout(() => this.input.focus(), 0);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.input.blur();
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
