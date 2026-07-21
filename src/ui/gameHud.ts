/**
 * 게임형 HUD (레퍼런스 UI 적용) — 좌상단 하트(오늘의 퀘스트 진행),
 * 우상단 코인, 하단 나무 아이콘 바(가방·가이드북·지도·퀘스트·꾸미기·채팅·이모트·설정).
 */
export interface HudActions {
  onBag: () => void;
  onDex: () => void;
  onMap: () => void;
  onQuest: () => void;
  onCustomize: () => void;
  onChat: () => void;
  onEmote: () => void;
  /** 온라인일 때만 제공 — 설정 패널의 로그아웃 버튼 */
  onLogout?: () => void;
  nickname: string;
}

const BAR_BUTTONS: Array<{ act: string; emoji: string; label: string }> = [
  { act: 'bag', emoji: '🎒', label: '소지품' },
  { act: 'dex', emoji: '📖', label: '가이드북' },
  { act: 'map', emoji: '🗺️', label: '지도' },
  { act: 'quest', emoji: '📜', label: '퀘스트' },
  { act: 'customize', emoji: '👕', label: '꾸미기' },
  { act: 'chat', emoji: '💬', label: '채팅' },
  { act: 'emote', emoji: '😊', label: '이모트' },
  { act: 'settings', emoji: '⚙️', label: '설정' },
];

export class GameHud {
  private root: HTMLDivElement;
  private heartsEl: HTMLDivElement;
  private coinsEl: HTMLDivElement;
  private settingsEl: HTMLDivElement;

  constructor(private readonly opts: HudActions) {
    this.root = document.createElement('div');
    this.root.className = 'hv-hud';
    this.root.innerHTML = `
      <div class="hv-hud-hearts" title="오늘의 퀘스트 진행"></div>
      <div class="hv-hud-coins">🪙 <b>…</b></div>
      <div class="hv-hud-bar">
        ${BAR_BUTTONS.map((b) => `
          <button data-act="${b.act}" title="${b.label}">
            <span class="ico">${b.emoji}</span><span class="lbl">${b.label}</span>
          </button>`).join('')}
      </div>
      <div class="hv-hud-settings" style="display:none">
        <div class="card">
          <h3>⚙️ 설정</h3>
          <p class="who">👤 ${escapeHtml(opts.nickname)}</p>
          <div class="guide">
            <b>조작 방법</b>
            <span>WASD/패드 이동 · 문 밟으면 입장</span>
            <span>Enter 채팅 · E 이모트 · C 꾸미기</span>
            <span>B 소지품 · G 가이드북 · M 지도 · Q 퀘스트</span>
          </div>
          ${opts.onLogout ? '<button class="logout">로그아웃</button>' : '<p class="off">오프라인 모드로 플레이 중</p>'}
          <button class="close-x">✕</button>
        </div>
      </div>`;
    document.body.appendChild(this.root);

    this.heartsEl = this.root.querySelector('.hv-hud-hearts')!;
    this.coinsEl = this.root.querySelector('.hv-hud-coins')!;
    this.settingsEl = this.root.querySelector('.hv-hud-settings')!;
    this.setHearts(0, 5);

    const handlers: Record<string, () => void> = {
      bag: opts.onBag, dex: opts.onDex, map: opts.onMap, quest: opts.onQuest,
      customize: opts.onCustomize, chat: opts.onChat, emote: opts.onEmote,
      settings: () => this.toggleSettings(),
    };
    this.root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
      b.addEventListener('click', () => handlers[b.dataset.act!]!());
    });
    this.settingsEl.querySelector('.close-x')!.addEventListener('click', () => this.toggleSettings());
    this.settingsEl.addEventListener('click', (e) => {
      if (e.target === this.settingsEl) this.toggleSettings();
    });
    this.settingsEl.querySelector('.logout')?.addEventListener('click', () => opts.onLogout?.());
  }

  setCoins(v: number): void {
    this.coinsEl.querySelector('b')!.textContent = v.toLocaleString();
  }

  /** 하트 = 오늘의 퀘스트 달성 수 (총 5개) */
  setHearts(done: number, total: number): void {
    this.heartsEl.innerHTML = Array.from({ length: total }, (_, i) =>
      `<span class="${i < done ? 'on' : 'off'}">${i < done ? '🧡' : '🤎'}</span>`).join('');
  }

  private toggleSettings(): void {
    const open = this.settingsEl.style.display === 'none';
    this.settingsEl.style.display = open ? 'flex' : 'none';
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
