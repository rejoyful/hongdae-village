import { audio } from '../game/audio';
import { pixelIcons } from './pixelIcons';
import pkg from '../../package.json';

/**
 * 게임형 HUD — 세션 싱글턴(main에서 1회 생성, 씬 전환에도 유지, P2-1).
 * 항상 표시: 좌상단 하트(퀘스트 진행), 우상단 코인·시계·설정.
 * 거리에서만: 하단 9버튼 액션 바 (mountActions/unmountActions).
 */
export interface HudBase {
  nickname: string;
  onLogout?: () => void;
  onResetData: () => void;
}

/** 거리 씬이 제공하는 액션 바 콜백 (씬 재진입마다 새로 배선) */
export interface BarActions {
  onBag: () => void;
  onDex: () => void;
  onMap: () => void;
  onResidents: () => void;
  onRanking: () => void;
  onQuest: () => void;
  onTreasure: () => void;
  onCustomize: () => void;
  onChat: () => void;
  onEmote: () => void;
}

const BAR_BUTTONS: Array<{ act: keyof BarActions; icon: string; label: string }> = [
  { act: 'onBag', icon: 'bag', label: '소지품' },
  { act: 'onDex', icon: 'book', label: '가이드북' },
  { act: 'onMap', icon: 'map', label: '지도' },
  { act: 'onResidents', icon: 'people', label: '주민' },
  { act: 'onRanking', icon: 'trophy', label: '랭킹' },
  { act: 'onQuest', icon: 'scroll', label: '퀘스트' },
  { act: 'onTreasure', icon: 'gem', label: '보물' },
  { act: 'onCustomize', icon: 'shirt', label: '꾸미기' },
  { act: 'onChat', icon: 'chat', label: '채팅' },
  { act: 'onEmote', icon: 'smile', label: '이모트' },
];

export class GameHud {
  private root: HTMLDivElement;
  private heartsEl: HTMLDivElement;
  private coinsEl: HTMLDivElement;
  private clockEl: HTMLDivElement;
  private settingsEl: HTMLDivElement;
  private barEl: HTMLDivElement;
  private clockTimer: number;
  private prevHearts = -1;
  private coins = 0;

  constructor(private readonly opts: HudBase) {
    const icons = pixelIcons();
    this.root = document.createElement('div');
    this.root.className = 'hv-hud';
    this.root.innerHTML = `
      <div class="hv-hud-hearts" title="오늘의 퀘스트 진행"></div>
      <div class="hv-hud-top-right">
        <div class="hv-hud-coins"><img src="${icons.coin}" alt=""> <b>…</b></div>
        <div class="hv-hud-clock">…</div>
        <button class="hv-hud-gear" title="설정"><img src="${icons.gear}" alt=""></button>
      </div>
      <div class="hv-hud-bar" style="display:none"></div>
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
            <span>WASD/조이스틱 이동 · 문 밟으면 입장</span>
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
    this.barEl = this.root.querySelector('.hv-hud-bar')!;
    this.setHearts(0, 5);
    this.tickClock();
    this.clockTimer = window.setInterval(() => this.tickClock(), 20_000);

    this.root.querySelector('.hv-hud-gear')!.addEventListener('click', () => {
      audio.playSe('click'); this.toggleSettings();
    });
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
      if (confirm('도감·주민·퀘스트 기록을 초기화할까요? (코인·소지품은 유지)')) opts.onResetData();
    });
  }

  /** 거리 씬 진입 시 하단 액션 바 장착 (콜백은 매번 새로 배선) */
  mountActions(actions: BarActions): void {
    const icons = pixelIcons();
    this.barEl.innerHTML = BAR_BUTTONS.map((b) => `
      <button data-act="${b.act}" title="${b.label}">
        <img class="ico" src="${icons[b.icon]}" alt=""><span class="lbl">${b.label}</span>
      </button>`).join('');
    this.barEl.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((el) => {
      el.addEventListener('click', () => {
        audio.playSe('click');
        actions[el.dataset.act as keyof BarActions]();
      });
    });
    this.barEl.style.display = 'flex';
  }

  /** 거리 씬 이탈(방·인테리어 입장) 시 액션 바 제거 — 상태·설정은 유지 */
  unmountActions(): void {
    this.barEl.style.display = 'none';
    this.barEl.innerHTML = '';
  }

  setCoins(v: number): void {
    this.coins = v;
    this.coinsEl.querySelector('b')!.textContent = v.toLocaleString();
  }

  get lastCoins(): number { return this.coins; }

  /** 하트 = 오늘의 퀘스트 달성 수 — 새로 채워진 하트는 통통 튄다 */
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
