import { BASE_SPECIES, RARE_SPECIES, PET_STAGES, AFFINITY_MAX, type PetSpecies } from '../game/pets/pets';
import type { PetStore } from '../game/pets/petStore';
import { paintPet, PET_W, PET_H } from '../game/art/petArt';

const hearts = (aff: number): string => {
  const f = Math.round((aff / AFFINITY_MAX) * 5);
  return '♥'.repeat(f) + '♡'.repeat(5 - f);
};

/** 펫샵 「멍냥이네」 — 입양·동행 + 친밀도 키우기 + 희귀 펫 발견 */
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
    onFeed: (petId: string) => void;
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

  /** 입양·먹이·동행 변경 후 즉시 갱신 */
  refresh(coins: number): void {
    this.coins = coins;
    if (this.opened) this.render();
  }

  /** 보유 펫 카드 (친밀도·성장·먹이·동행) */
  private ownedCard(s: PetSpecies): string {
    const store = this.store!;
    const aff = store.affinity(s.id);
    const stage = PET_STAGES[store.stage(s.id)];
    const isActive = store.activeId() === s.id;
    const canFeed = store.canFeed(s.id);
    return `
      <div class="ps-card is-owned ${isActive ? 'is-active' : ''}">
        <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${s.id}"></canvas></div>
        <div class="ps-info">
          <b>${s.emoji} ${s.name} <em>${stage}</em></b>
          <span class="ps-aff"><i>${hearts(aff)}</i> ${aff}/${AFFINITY_MAX}</span>
        </div>
        <div class="ps-btns">
          ${isActive
            ? `<button class="ps-active" disabled>함께 중 ✓</button>`
            : `<button class="ps-take" data-take="${s.id}">데리고 다니기</button>`}
          <button class="ps-feed" data-feed="${s.id}" ${canFeed ? '' : 'disabled'}>${canFeed ? '먹이 주기 🍚' : '오늘 밥 줌'}</button>
        </div>
      </div>`;
  }

  private buyCard(s: PetSpecies): string {
    const afford = !this.online || this.coins >= s.price;
    const label = this.online ? `입양 🪙${s.price}` : '입양 (무료)';
    return `
      <div class="ps-card">
        <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${s.id}"></canvas></div>
        <div class="ps-info"><b>${s.emoji} ${s.name}</b><span>${s.blurb}</span></div>
        <button class="ps-buy" data-adopt="${s.id}" ${afford ? '' : 'disabled'}>${label}</button>
      </div>`;
  }

  /** 희귀 펫 카드 — 잠금(실루엣+힌트) / 발견(입양) / 보유 */
  private rareCard(s: PetSpecies): string {
    const store = this.store!;
    if (store.isOwned(s.id)) return this.ownedCard(s);
    if (!store.isUnlocked(s.id)) {
      return `
        <div class="ps-card ps-locked">
          <div class="ps-pic"><span class="ps-q">?</span></div>
          <div class="ps-info"><b>??? <em class="ps-rare-tag">희귀</em></b><span>${s.hint ?? ''}</span></div>
          <span class="ps-lock">🔒</span>
        </div>`;
    }
    return `
      <div class="ps-card ps-discovered">
        <div class="ps-pic"><canvas class="ps-canvas" width="${PET_W}" height="${PET_H}" data-pet="${s.id}"></canvas></div>
        <div class="ps-info"><b>${s.emoji} ${s.name} <em class="ps-rare-tag">희귀</em></b><span>${s.blurb}</span></div>
        <button class="ps-buy ps-rare-buy" data-adopt="${s.id}">🎉 발견! 입양</button>
      </div>`;
  }

  private render(): void {
    const store = this.store!;
    const active = store.activeId();
    const base = BASE_SPECIES.map((s) => (store.isOwned(s.id) ? this.ownedCard(s) : this.buyCard(s))).join('');
    const rare = RARE_SPECIES.map((s) => this.rareCard(s)).join('');

    this.root.innerHTML = `
      <div class="hv-wood-modal" style="position:static;background:none;">
        <div class="wood-frame ps-frame">
          <div class="wood-head">
            <h2>🐾 펫샵 멍냥이네</h2>
            <span class="pill">🪙 ${this.coins.toLocaleString()}</span>
          </div>
          <p class="ps-tip">입양한 펫은 <b>쓰다듬고(클릭) 먹이 주며</b> 친해져요. 단짝이 되면 특별한 친구도 나타나요!</p>
          <div class="wood-page ps-list">
            ${base}
            <div class="ps-section">✨ 히든 친구 (발견)</div>
            ${rare}
          </div>
          ${active ? '<button class="ps-rest">🏠 오늘은 집에 두기</button>' : ''}
          <button class="wood-close">닫기</button>
        </div>
      </div>`;

    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-pet]').forEach((c) => {
      const ctx = c.getContext('2d');
      if (ctx) paintPet(ctx, c.dataset.pet!);
    });
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-adopt]').forEach((b) =>
      b.addEventListener('click', () => this.opts.onAdopt(b.dataset.adopt!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-take]').forEach((b) =>
      b.addEventListener('click', () => { this.opts.onSetActive(b.dataset.take!); this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-feed]').forEach((b) =>
      b.addEventListener('click', () => this.opts.onFeed(b.dataset.feed!)));
    this.root.querySelector('.ps-rest')?.addEventListener('click', () => {
      this.opts.onSetActive(null); this.render();
    });
  }

  destroy(): void { this.root.remove(); }
}
