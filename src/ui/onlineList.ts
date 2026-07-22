/** 좌상단 접속자 목록 — 누가 지금 마을에 있는지 (나 + 원격 유저) */
export class OnlineList {
  private root: HTMLDivElement;
  private myNick: string;

  constructor(myNick: string) {
    this.myNick = myNick;
    this.root = document.createElement('div');
    this.root.className = 'hv-online';
    document.body.appendChild(this.root);
    this.render([]);
  }

  /** 원격 유저 닉네임 배열로 갱신 (나는 항상 맨 위) */
  render(remoteNicks: string[]): void {
    const total = remoteNicks.length + 1;
    this.root.innerHTML = `
      <div class="online-head"><span class="dot"></span>접속 ${total}</div>
      <div class="online-me">${escapeHtml(this.myNick)} <em>나</em></div>
      ${remoteNicks.map((n) => `<div class="online-user">${escapeHtml(n)}</div>`).join('')}`;
  }

  setMyNick(nick: string, remoteNicks: string[]): void {
    this.myNick = nick;
    this.render(remoteNicks);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
