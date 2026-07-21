import { audio } from '../game/audio';
import { pixelIcons } from './pixelIcons';
import pkg from '../../package.json';

/**
 * 게임형 HUD (레퍼런스 UI 적용) — 좌상단 하트(오늘의 퀘스트 진행),
 * 우상단 코인·시계, 하단 나무 아이콘 바, 설정 팝업(BGM/SE 슬라이더·진동·데이터).
 */
export interface HudActions {
  onBag: () => void;
  onDex: () => void;
  onMap: () => void;
  onQuest: () => void;
  onResidents: () => void;
  onRanking: () => void;
  onCustomize: () => void;
  onChat: () => void;
  onEmote: () => void;
  /** 온라인일 때만 제공 — 설정 패널의 로그아웃 버튼 */
  onLogout?: () => void;
  /** 도감·주민 기록 초기화 */
  onResetData: () => void;
  nickname: string;
}

const BAR_BUTTONS: Array<{ act: string; icon: string; label: string }> = [
  { act: 'bag', icon: 'bag', label: '소지품' },
  { act: 'dex', icon: 'book', label: '가이드북' },
  { act: 'map', icon: 'map', label: '지도' },
  { act: 'residents', icon: 'people', label: '주민' },
  { act: 'ranking', icon: 'trophy', label: '랭킹' },
  { act: 'quest', icon: 'scroll', label: '퀘스트' },
  { act: 'customize', icon: 'shirt', label: '꾸미기' },
  { act: 'chat', icon: 'chat', label: '채팅' },
  { act: 'emote', icon: 'smile', label: '이모트' },
  { act: 'settings', icon: 'gear', label: '설정' },
];

export class GameHud {
  private root: HTMLDivElement;
  private heartsEl: HTMLDivElement;
  private coinsEl: HTMLDivElement;
  private clockEl: HTMLDivElement;
  private settingsEl: HTMLDivElement;
  private clockTimer: number;

  constructor(private readonly opts: HudActions) {
    const icons = pixelIcons();
    this.root = document.createElement('div');
    this.root.className = 'hv-hud';
    this.root.innerHTML = `
      <div class="hv-hud-hearts" title="오늘의 퀘스트 진행"></div>
      <div class="hv-hud-top-right">
        <div class="hv-hud-coins"><img src="${icons.coin}" alt=""> <b>…</b></div>
        <div class="hv-hud-clock">…</div>
      </div>
      <div class="hv-hud-bar">
        ${BAR_BUTTONS.map((b) => `
          <button data-act="${b.act}" title="${b.label}">
            <img class="ico" src="${icons[b.icon]}" alt=""><span class="lbl">${b.label}</span>
          </button>`).join('')}
      </div>
      <div class="hv-hud-settings" style="display:none">
        <div class="card">
          <h3>⚙️ 설정</h3>
          <p class="who">👤 ${escapeHtml(opts.nickname)}</p>
          <div class="set-row"><span>BGM</span>
            <input class="vol-bgm" type="range" min="0" max="100" value="${Math.round(audio.prefs.bgm * 100)}"></div>
          <div class="set-row"><span>SE</span>
            <input class="vol-se" type="range" min="0" max="100" value="${Math.round(audio.prefs.se * 100)}"></div>
          <div class="set-row"><span>진동</span>
            <button class="tog-vib ${audio.prefs.vib ? 'on' : ''}">${audio.prefs.vib ? 'On' : 'Off'}</button></div>
          <div class="set-row"><span>데이터</span>
            <button class="btn-reset">기록 초기화</button></div>
          <div class="guide">
            <b>조작 방법</b>
            <span>WASD/패드 이동 · 문 밟으면 입장</span>
            <span>Enter 채팅 · E 이모트 · C 꾸미기</span>
            <span>B 소지품 · G 가이드북 · M 지도 · Q 퀘스트</span>
          </div>
          ${opts.onLogout ? '<button class="logout">로그아웃</button>' : '<p class="off">오프라인 모드로 플레이 중</p>'}
          <p class="ver">VERSION : ${escapeHtml(pkg.version)}</p>
          <button class="close-x">✕</button>
        </div>
      </div>`;
    document.body.appendChild(this.root);

    this.heartsEl = this.root.querySelector('.hv-hud-hearts')!;
    this.coinsEl = this.root.querySelector('.hv-hud-coins')!;
    this.clockEl = this.root.querySelector('.hv-hud-clock')!;
    this.settingsEl = this.root.querySelector('.hv-hud-settings')!;
    this.setHearts(0, 5);
    this.tickClock();
    this.clockTimer = window.setInterval(() => this.tickClock(), 20_000);

    const handlers: Record<string, () => void> = {
      bag: opts.onBag, dex: opts.onDex, map: opts.onMap, quest: opts.onQuest,
      residents: opts.onResidents, ranking: opts.onRanking,
      customize: opts.onCustomize, chat: opts.onChat, emote: opts.onEmote,
      settings: () => this.toggleSettings(),
    };
    this.root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
      b.addEventListener('click', () => { audio.playSe('click'); handlers[b.dataset.act!]!(); });
    });

    // 설정 컨트롤
    this.settingsEl.querySelector('.close-x')!.addEventListener('click', () => this.toggleSettings());
    this.settingsEl.addEventListener('click', (e) => {
      if (e.target === this.settingsEl) this.toggleSettings();
    });
    this.settingsEl.querySelector('.logout')?.addEventListener('click', () => opts.onLogout?.());
    this.settingsEl.querySelector<HTMLInputElement>('.vol-bgm')!
      .addEventListener('input', (e) => audio.setBgm(Number((e.target as HTMLInputElement).value) / 100));
    this.settingsEl.querySelector<HTMLInputElement>('.vol-se')!
      .addEventListener('input', (e) => {
        audio.setSe(Number((e.target as HTMLInputElement).value) / 100);
        audio.playSe('pop');
      });
    const vib = this.settingsEl.querySelector<HTMLButtonElement>('.tog-vib')!;
    vib.addEventListener('click', () => {
      const on = !audio.prefs.vib;
      audio.setVib(on);
      vib.textContent = on ? 'On' : 'Off';
      vib.classList.toggle('on', on);
      if (on) audio.vibrate(40);
    });
    this.settingsEl.querySelector('.btn-reset')!.addEventListener('click', () => {
      if (confirm('도감·주민 기록을 초기화할까요? (코인·소지품은 유지)')) opts.onResetData();
    });
  }

  setCoins(v: number): void {
    this.coinsEl.querySelector('b')!.textContent = v.toLocaleString();
  }

  private prevHearts = -1;

  /** 하트 = 오늘의 퀘스트 달성 수 (총 5개) — 새로 채워진 하트는 통통 튄다 */
  setHearts(done: number, total: number): void {
    const icons = pixelIcons();
    const bumped = this.prevHearts >= 0 && done > this.prevHearts;
    this.heartsEl.innerHTML = Array.from({ length: total }, (_, i) =>
      `<img class="${i < done ? 'on' : 'off'} ${bumped && i === done - 1 ? 'bump' : ''}"
        src="${i < done ? icons.heart : icons.heartEmpty}" alt="">`).join('');
    this.prevHearts = done;
  }

  private tickClock(): void {
    const now = new Date();
    const hm = now.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const h = Number(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false }));
    const icon = h >= 6 && h < 16 ? '☀️' : h >= 16 && h < 19 ? '🌆' : '🌙';
    this.clockEl.textContent = `${icon} ${hm}`;
  }

  private toggleSettings(): void {
    const open = this.settingsEl.style.display === 'none';
    this.settingsEl.style.display = open ? 'flex' : 'none';
  }

  destroy(): void {
    clearInterval(this.clockTimer);
    this.root.remove();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
