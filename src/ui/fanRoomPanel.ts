import {
  FAN_ROOM_LIGHTS, FAN_ROOM_STYLES, FanRoomDisplayStore, featuredFanMerch,
  type FanRoomDisplayProgress,
} from '../game/home/fanRoomDisplay';
import { FanMerchWorkshopStore } from '../game/progression/fanMerchWorkshop';
import {
  FAN_ROOM_ART_H, FAN_ROOM_ART_W, paintFanRoomArt,
} from '../game/art/fanRoomArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class FanRoomPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private feedback = '';

  constructor(
    private readonly displayStore: FanRoomDisplayStore,
    private readonly merchStore: FanMerchWorkshopStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      onChanged: (progress: FanRoomDisplayProgress) => void;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-fan-room';
    this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '나의 최애 방 전시 코너');
    document.body.appendChild(this.root);
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.feedback = '';
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.fan-room-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(): void { if (this.opened) this.render(); }

  private render(): void {
    const state = this.displayStore.get();
    const records = featuredFanMerch(this.merchStore.get());
    const progress = this.displayStore.progress(records.length);
    const style = FAN_ROOM_STYLES.find((item) => item.id === state.styleId)!;
    const light = FAN_ROOM_LIGHTS.find((item) => item.id === state.lightId)!;
    this.root.innerHTML = `<section class="fan-room-book" style="--fan-room-glow:${light.colors[2]};--fan-room-deep:${light.colors[0]}">
      <header><div><small>COLLECTION → MY 2.5D ROOM</small><h1>나의 최애 방 전시 코너</h1><p>공방에서 대표로 고른 굿즈가 실제 방의 벽면 전시로 이어집니다. 가구 칸과 이동 공간은 차지하지 않아요.</p></div>
        <aside><span><b>${records.length}</b>/3 굿즈</span><span><b>${progress.stylesTried}</b>/4 진열</span><span><b>${progress.lightsTried}</b>/4 조명</span></aside>
        <button class="fan-room-close" aria-label="닫기">×</button></header>
      <main>
        <section class="fan-room-preview"><header><div><small>LIVE ROOM PREVIEW</small><h2>${escapeHtml(style.name)}</h2><p>${escapeHtml(light.name)} · ${escapeHtml(style.note)}</p></div><strong>${state.visible ? 'ON' : 'OFF'}<small>방 표시</small></strong></header>
          <canvas width="${FAN_ROOM_ART_W}" height="${FAN_ROOM_ART_H}" aria-label="현재 최애 방 전시 미리보기"></canvas>
          ${records.length ? `<div class="fan-room-goods">${records.map((record) => `<span><i>${escapeHtml(record.subject.kind === 'self' ? 'MY' : record.subject.kind === 'pet' ? 'PET' : 'NPC')}</i><b>${escapeHtml(record.subject.name)}</b></span>`).join('')}</div>` : '<div class="fan-room-empty"><b>아직 대표 굿즈가 없어요.</b><span>거리에서 Q → 굿즈를 열고 소장품의 ‘대표 진열’을 골라 주세요. 전시 설정은 미리 바꿔 둘 수 있어요.</span></div>'}
          ${this.feedback ? `<p role="status">${escapeHtml(this.feedback)}</p>` : ''}
        </section>
        <aside class="fan-room-controls">
          <section><header><small>DISPLAY FURNITURE</small><h2>진열 방식</h2></header><div>${FAN_ROOM_STYLES.map((entry) => `<button data-fan-room-style="${entry.id}" class="${entry.id === state.styleId ? 'is-selected' : ''}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.name}</b><em>${entry.note}</em></span></button>`).join('')}</div></section>
          <section><header><small>ROOM LIGHT</small><h2>코너 조명</h2></header><div class="fan-room-lights">${FAN_ROOM_LIGHTS.map((entry) => `<button data-fan-room-light="${entry.id}" class="${entry.id === state.lightId ? 'is-selected' : ''}" style="--light-color:${entry.colors[2]}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.name}</b><em>${entry.note}</em></span></button>`).join('')}</div></section>
          <button class="fan-room-visible ${state.visible ? 'is-visible' : ''}"><i>${state.visible ? 'ON' : 'OFF'}</i><span><b>${state.visible ? '실제 방에 전시 중' : '전시를 잠시 쉬는 중'}</b><small>대표 굿즈와 수집 기록은 숨겨도 그대로 남습니다.</small></span><strong>${state.visible ? '숨기기' : '보이기'}</strong></button>
        </aside>
      </main>
      <footer>능력치·순위·임대료 변화 없음 · 대표 굿즈 교체는 공방에서 · 진열과 조명 발견은 영구 기록</footer>
    </section>`;
    const canvas = this.root.querySelector('canvas');
    if (canvas) paintFanRoomArt(canvas, state, records);
    this.bind(records.length);
  }

  private bind(featuredCount: number): void {
    this.root.querySelector('.fan-room-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-room-style]').forEach((button) => button.addEventListener('click', () => {
      const entry = FAN_ROOM_STYLES.find((item) => item.id === button.dataset.fanRoomStyle);
      if (!entry || !this.displayStore.selectStyle(entry.id)) return;
      this.feedback = `「${entry.name}」으로 전시 가구를 바꿨어요. 실제 방에도 바로 반영됩니다.`;
      this.changed(featuredCount);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-room-light]').forEach((button) => button.addEventListener('click', () => {
      const entry = FAN_ROOM_LIGHTS.find((item) => item.id === button.dataset.fanRoomLight);
      if (!entry || !this.displayStore.selectLight(entry.id)) return;
      this.feedback = `「${entry.name}」 조명을 켰어요. 굿즈는 그대로 두고 분위기만 바뀝니다.`;
      this.changed(featuredCount);
    }));
    this.root.querySelector('.fan-room-visible')!.addEventListener('click', () => {
      const next = !this.displayStore.get().visible;
      this.displayStore.setVisible(next);
      this.feedback = next
        ? '최애 코너를 실제 방에 다시 펼쳤어요.'
        : '벽면 전시만 잠시 숨겼어요. 대표 굿즈와 영구 기록은 그대로예요.';
      this.changed(featuredCount);
    });
  }

  private changed(featuredCount: number): void {
    this.opts.onChanged(this.displayStore.progress(featuredCount));
    this.render();
  }

  destroy(): void { this.root.remove(); }
}
