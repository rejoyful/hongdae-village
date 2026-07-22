/**
 * 채팅 입력 — 데스크톱 Enter, 모바일은 전송/닫기 버튼으로 명확히 조작.
 * 열려 있는 동안 씬이 키보드를 비활성화한다(onToggle). 모바일 키보드 위로 뜨게 배치.
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
    this.root.innerHTML = `
      <input type="text" maxlength="80" placeholder="메시지 입력…" enterkeyhint="send" />
      <button class="hv-chat-send" type="button">전송</button>
      <button class="hv-chat-close" type="button" aria-label="닫기">✕</button>`;
    this.input = this.root.querySelector('input')!;
    document.body.appendChild(this.root);

    const send = () => {
      const text = this.input.value;
      this.input.value = '';
      this.close();
      this.opts.onSend(text);
    };
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // 게임(window) 키 리스너와 분리
      if (e.key === 'Enter') send();
      else if (e.key === 'Escape') { this.input.value = ''; this.close(); }
    });
    // 폼 제출(모바일 키보드 '전송'/'return')도 처리
    this.input.addEventListener('input', (e) => e.stopPropagation());
    this.root.querySelector('.hv-chat-send')!.addEventListener('click', (e) => { e.preventDefault(); send(); });
    this.root.querySelector('.hv-chat-close')!.addEventListener('click', (e) => {
      e.preventDefault(); this.input.value = ''; this.close();
    });
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.root.classList.add('open');
    this.opts.onToggle(true);
    setTimeout(() => this.input.focus(), 0);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.classList.remove('open');
    this.input.blur();
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
