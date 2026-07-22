import { WEAPONS, type Weapon } from '../game/battle/weapons';
import type { BattleStore } from '../game/battle/battleStore';

/** 무기상점 「대장간」 — 코인(골드)으로 무기를 사고 장착 */
export class WeaponShopPanel {
  private root: HTMLDivElement;
  private opened = false;
  private store: BattleStore | null = null;
  private coins = 0;
  private online = false;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    onBuy: (weaponId: string) => void;
    onEquip: (weaponId: string) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-weaponshop';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(store: BattleStore, coins: number, online: boolean): void {
    if (this.opened) return;
    this.opened = true; this.store = store; this.coins = coins; this.online = online;
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

  refresh(coins: number): void { this.coins = coins; if (this.opened) this.render(); }

  private card(w: Weapon): string {
    const store = this.store!;
    const owned = w.id === 'fist' || store.isWeaponOwned(w.id);
    const equipped = store.equippedId() === w.id;
    let btn: string;
    if (equipped) btn = `<button class="ws-eq" disabled>장착 중 ✓</button>`;
    else if (owned) btn = `<button class="ws-equip" data-equip="${w.id}">장착</button>`;
    else {
      const afford = !this.online || this.coins >= w.price;
      btn = `<button class="ws-buy" data-buy="${w.id}" ${afford ? '' : 'disabled'}>${this.online ? `🪙${w.price.toLocaleString()}` : '구매(무료)'}</button>`;
    }
    return `
      <div class="ws-card ${equipped ? 'is-eq' : ''}">
        <div class="ws-ico">${w.emoji}</div>
        <div class="ws-info"><b>${w.name}</b><span>공격력 +${w.atk}</span></div>
        ${btn}
      </div>`;
  }

  private render(): void {
    this.root.innerHTML = `
      <div class="hv-wood-modal" style="position:static;background:none;">
        <div class="wood-frame ws-frame">
          <div class="wood-head">
            <h2>⚒️ 대장간</h2>
            <span class="pill">🪙 ${this.coins.toLocaleString()}</span>
          </div>
          <p class="ws-tip">더 센 무기일수록 몬스터를 빨리 잡아요. 장착한 무기의 공격력이 적용돼요.</p>
          <div class="wood-page ws-list">${WEAPONS.map((w) => this.card(w)).join('')}</div>
          <button class="wood-close">닫기</button>
        </div>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((b) =>
      b.addEventListener('click', () => this.opts.onBuy(b.dataset.buy!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach((b) =>
      b.addEventListener('click', () => { this.opts.onEquip(b.dataset.equip!); this.render(); }));
  }

  destroy(): void { this.root.remove(); }
}
