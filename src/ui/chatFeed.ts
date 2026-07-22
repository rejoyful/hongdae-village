export type ChatSender = 'me' | 'user' | 'system';

/** 전체 채팅 피드 — 모든 유저의 메시지를 화면 좌하단에 로그로 띄운다 (발신자별 색) */
export class ChatFeed {
  private root: HTMLDivElement;
  private lines: HTMLDivElement[] = [];
  private readonly max = 6;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'hv-chatfeed';
    document.body.appendChild(this.root);
  }

  push(nick: string, text: string, sender: ChatSender): void {
    const line = document.createElement('div');
    line.className = `hv-chatline s-${sender}`;
    line.innerHTML = sender === 'system'
      ? `<i>${escapeHtml(text)}</i>`
      : `<b>${escapeHtml(nick)}</b><span>${escapeHtml(text)}</span>`;
    this.root.appendChild(line);
    this.lines.push(line);
    // 오래된 줄 제거
    while (this.lines.length > this.max) this.lines.shift()!.remove();
    // 자동 페이드 아웃 (남아있어도 흐리게)
    window.setTimeout(() => line.classList.add('fade'), 8000);
    window.setTimeout(() => { if (line.parentElement) { line.remove(); this.lines = this.lines.filter((l) => l !== line); } }, 12000);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
