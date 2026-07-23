import { audio } from '../game/audio';
import { paintHomeGuestbookArt } from '../game/art/homeGuestbookArt';
import {
  HOME_GUESTBOOK_STICKERS, HOME_GUESTBOOK_STICKER_BY_ID, HomeGuestbookStore,
  type HomeGuestbookProgress, type HomeGuestbookRecord, type HomeGuestbookStickerKind,
} from '../game/social/homeGuestbook';
import type { LeaveHomeGuestbookResult } from '../db/homeSocialApi';

export interface HomeGuestbookPanelOptions {
  mode: 'owner' | 'visitor';
  online: boolean;
  userId: string;
  roomId: number;
  ownerId: string;
  ownerNickname: string;
  onToggle?: (open: boolean) => void;
  onSend?: (kind: HomeGuestbookStickerKind) => Promise<LeaveHomeGuestbookResult>;
  onLoad?: () => Promise<HomeGuestbookRecord[]>;
  onSentChanged?: (progress: HomeGuestbookProgress) => void;
  onReceivedChanged?: (records: HomeGuestbookRecord[]) => void;
}

export class HomeGuestbookPanel {
  private readonly button: HTMLButtonElement;
  private readonly root: HTMLDivElement;
  private readonly store: HomeGuestbookStore;
  private records: HomeGuestbookRecord[] = [];
  private loading = false;
  private sending = false;
  private feedback = '';

  constructor(private readonly opts: HomeGuestbookPanelOptions) {
    this.store = new HomeGuestbookStore(opts.userId);
    this.button = document.createElement('button');
    this.button.className = `hv-home-guestbook-button ${opts.mode}`;
    this.button.innerHTML = `<i>${opts.mode === 'owner' ? '우' : '집'}</i><span>${opts.mode === 'owner' ? '우리 집 방명록' : '집들이 스티커'}</span>`;
    this.button.addEventListener('click', () => void this.open());
    document.body.appendChild(this.button);
    this.root = document.createElement('div');
    this.root.className = 'hv-home-guestbook'; this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => void this.handleClick(event));
    document.body.appendChild(this.root);
    this.opts.onSentChanged?.(this.store.progress());
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }
  progress(): HomeGuestbookProgress { return this.store.progress(); }

  async open(): Promise<void> {
    this.feedback = ''; this.render(); this.root.style.display = 'grid'; this.opts.onToggle?.(true);
    if (this.opts.mode === 'owner' && this.opts.onLoad) {
      this.loading = true; this.render();
      this.records = await this.opts.onLoad();
      this.loading = false; this.opts.onReceivedChanged?.(this.records); this.render();
    }
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.style.display = 'none'; this.opts.onToggle?.(false);
  }

  destroy(): void { this.button.remove(); this.root.remove(); }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'close' || button.dataset.action === 'backdrop') {
      audio.playSe('click'); this.close(); return;
    }
    const kind = button.dataset.sticker as HomeGuestbookStickerKind | undefined;
    if (!kind || this.sending || !this.opts.onSend) return;
    this.sending = true; this.feedback = '집들이 스티커를 현관 우편함에 넣는 중이에요…'; this.render();
    const result = await this.opts.onSend(kind);
    this.sending = false;
    if (result === 'ok') {
      this.store.recordSent(this.opts.roomId, this.opts.ownerId, kind);
      this.opts.onSentChanged?.(this.store.progress());
      this.feedback = `${HOME_GUESTBOOK_STICKER_BY_ID.get(kind)?.name ?? '마음'} 스티커를 남겼어요. 오늘은 이 집에 한 장이면 충분해요.`;
      audio.playSe('success');
    } else {
      this.feedback = result === 'today' ? '오늘 이 집에는 이미 한 장을 남겼어요. 내일 다른 마음으로 다시 들러도 좋아요.'
        : result === 'closed' ? '집주인이 문을 닫아 새 방명록을 쉬게 했어요.'
          : result === 'self' ? '내 집에는 이웃이 남겨 준 마음만 차곡차곡 모여요.'
            : '연결이 잠시 쉬고 있어요. 스티커는 저장되지 않았으니 나중에 다시 시도해 주세요.';
      audio.playSe('click');
    }
    this.render();
  }

  private render(): void {
    const sentToday = !this.store.canSend(this.opts.roomId);
    const uniqueVisitors = new Set(this.records.map((record) => record.fromUserId)).size;
    const receivedKinds = new Set(this.records.map((record) => record.kind)).size;
    const body = this.opts.mode === 'owner' ? this.ownerHtml(uniqueVisitors, receivedKinds) : this.visitorHtml(sentToday);
    this.root.innerHTML = `
      <button class="guestbook-backdrop" data-action="backdrop" aria-label="집들이 방명록 닫기"></button>
      <section class="guestbook-shell ${this.opts.mode}" role="dialog" aria-modal="true" aria-label="${this.opts.mode === 'owner' ? '우리 집 방명록' : '집들이 스티커'}">
        <header class="guestbook-head"><div><small>OPEN HOME · SAFE STICKER MAIL</small><h2>${this.opts.mode === 'owner' ? '우리 집 방명록' : `${escapeHtml(this.opts.ownerNickname)}님의 집들이 우편함`}</h2><p>자유문구·별점·순위 없이, 집에서 발견한 좋은 마음만 고정 스티커로 나눠요.</p></div><button data-action="close" aria-label="닫기">×</button></header>
        ${body}
        <footer class="guestbook-footer" aria-live="polite">${escapeHtml(this.feedback || (this.opts.mode === 'owner' ? '문을 닫아도 이미 받은 스티커는 집주인에게 안전하게 남아 있어요.' : '한 집에 하루 한 장 · 코인과 보상 경쟁 없음 · 자유문구 없음'))}</footer>
      </section>`;
    this.root.querySelectorAll<HTMLCanvasElement>('[data-guestbook-art]').forEach((canvas) => {
      paintHomeGuestbookArt(canvas, canvas.dataset.guestbookArt as HomeGuestbookStickerKind);
    });
  }

  private ownerHtml(uniqueVisitors: number, receivedKinds: number): string {
    return `<div class="guestbook-ledger"><span><small>받은 마음</small><b>${this.records.length}</b></span><span><small>찾아온 이웃</small><b>${uniqueVisitors}</b></span><span><small>스티커 도감</small><b>${receivedKinds}<i>/8</i></b></span></div>
      ${this.loading ? '<div class="guestbook-empty"><b>현관 우편함을 여는 중…</b><p>오프라인에 도착한 스티커도 함께 가져오고 있어요.</p></div>'
        : this.records.length ? `<div class="guestbook-records">${this.records.map((record) => {
          const sticker = HOME_GUESTBOOK_STICKER_BY_ID.get(record.kind)!;
          return `<article><canvas data-guestbook-art="${record.kind}"></canvas><div><small>${escapeHtml(record.day)} · ${escapeHtml(record.fromNickname)}</small><b>${escapeHtml(sticker.name)}</b><p>${escapeHtml(sticker.message)}</p></div></article>`;
        }).join('')}</div>`
          : `<div class="guestbook-empty"><b>첫 집들이 스티커를 기다리는 우편함</b><p>집 꾸미기에서 ‘이웃집 투어 공개’를 켜면 이웃이 읽기 전용으로 둘러보고 한 장을 남길 수 있어요.</p></div>`}`;
  }

  private visitorHtml(sentToday: boolean): string {
    const disabled = !this.opts.online || sentToday || this.sending;
    return `<div class="guestbook-stickers">${HOME_GUESTBOOK_STICKERS.map((sticker) => `<button data-sticker="${sticker.id}" ${disabled ? 'disabled' : ''} style="--sticker:${sticker.color};--sticker-deep:${sticker.deep}"><canvas data-guestbook-art="${sticker.id}"></canvas><span><small>${sticker.mark} · 고정 문구</small><b>${escapeHtml(sticker.name)}</b><em>${escapeHtml(sticker.message)}</em></span></button>`).join('')}</div>
      ${!this.opts.online ? '<p class="guestbook-safety">온라인 열린 집에서만 집주인의 영구 우편함에 저장할 수 있어요.</p>' : sentToday ? '<p class="guestbook-safety done">오늘의 한 장을 이미 남겼어요. 집은 계속 편하게 둘러볼 수 있어요.</p>' : '<p class="guestbook-safety">선택한 문장 그대로만 전달돼요. 닉네임 외 개인 정보나 자유문구는 보내지 않습니다.</p>'}`;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
