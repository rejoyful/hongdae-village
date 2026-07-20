import type { EmoteKind } from '../net/protocol';

export const EMOTE_EMOJI: Record<EmoteKind, string> = {
  heart: '❤️', laugh: '😂', clap: '👏', dance: '🕺',
  surprise: '😲', sleepy: '😴', cheers: '🍻', wave: '👋',
};

/** E키로 여닫는 이모트 8종 선택 패널 */
export class EmoteWheel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(onPick: (k: EmoteKind) => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-emotes';
    for (const [kind, emoji] of Object.entries(EMOTE_EMOJI) as Array<[EmoteKind, string]>) {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.title = kind;
      btn.addEventListener('click', () => { this.close(); onPick(kind); });
      this.root.appendChild(btn);
    }
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }
  toggle(): void { this.opened ? this.close() : this.open(); }
  open(): void { this.opened = true; this.root.style.display = 'grid'; }
  close(): void { this.opened = false; this.root.style.display = 'none'; }
  destroy(): void { this.root.remove(); }
}
