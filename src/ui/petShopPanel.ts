import { PET_SPECIES } from '../game/pets/pets';
import type { PetStore } from '../game/pets/petStore';
import { paintPet, PET_W, PET_H } from '../game/art/petArt';

/** 펫샵 「멍냥이네」 — 코인으로 입양하고 데리고 다닐 펫을 고른다 */
export class PetShopPanel {
  private root: HTMLDivElement;
  private opened = false;
  private store: PetStore | null = null;
  private coins = 0;
  private online = false;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    onAdopt: (petId: string) => void;
    onSetActive: (petId: string | null) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-petshop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(store: PetStore, coins: number, online: boolean): void {
    if (this.opened) return;
    this.opened = true;
    this.store = store;
    this.coins = coins;
    this.online = online;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  /** 입양·동행 변경 후 즉시 갱신 */
  refresh(coins: number): void {
    this.coins = coins;
    if (this.opened) this.render();
  }

  private render(): void {
    const store = this.store!;
    const active = store.activeId();
    const cards = PET_SPECIES.map((s) => {
      const owned = store.isOwned(s.id);
      const isActive = active === s.id;
      const afford = !this.online || this.coins >= s.price;
      let btn: string;
      if (!owned) {
        const label = this.online ? `입양 🪙${s.price}` : `입양 (무료)`;
        btn = `<button class="ps-buy" data-adopt="${s.id}" ${afford ? '' : 'disabled'}>${label}</button>`;
      } else if (isActive) {
        btn = `<button class="ps-active" data-active="">함께 중 ✓</button>`;
      } else {
        btn = `<button class="ps-take" data-take="${s.id}">데리고 다니기</button>`;
      }
      return `
        <div class="ps-card ${isActive ? 'is-active' : ''}">
          <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${s.id}"></canvas></div>
          <div class="ps-info">
            <b>${s.emoji} ${s.name}</b>
            <span>${s.blurb}</span>
          </div>
          ${btn}
        </div>`;
    }).join('');

    this.root.innerHTML = `
      <div class="hv-wood-modal" style="position:static;background:none;">
        <div class="wood-frame ps-frame">
          <div class="wood-head">
            <h2>🐾 펫샵 멍냥이네</h2>
            <span class="pill">🪙 ${this.coins.toLocaleString()}</span>
          </div>
          <p class="ps-tip">마음에 드는 친구를 입양해 데리고 다녀요. 언제든 바꿀 수 있어요!</p>
          <div class="wood-page ps-list">${cards}</div>
          ${active ? '<button class="ps-rest">🏠 오늘은 집에 두기</button>' : ''}
          <button class="wood-close">닫기</button>
        </div>
      </div>`;

    // 픽셀 펫 미리보기 렌더
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-pet]').forEach((c) => {
      const ctx = c.getContext('2d');
      if (ctx) paintPet(ctx, c.dataset.pet!);
    });

    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((b) =>
      b.addEventListener('click', () => this.opts.onAdopt(b.dataset.adopt!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((b) =>
      b.addEventListener('click', () => { this.opts.onSetActive(b.dataset.take!); this.render(); }));
    this.root.querySelector('.ps-rest')?.addEventListener('click', () => {
      this.opts.onSetActive(null); this.render();
    });
  }

  destroy(): void { this.root.remove(); }
}
