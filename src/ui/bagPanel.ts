import { CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory, type ItemDef } from '../items/catalog';

/** 아키타입별 아이콘 (레퍼런스의 아이템 아이콘 슬롯 재현 — 자산 없는 아이템은 카테고리 폴백) */
export const ARCH_EMOJI: Record<string, string> = {
  bed: '🛏️', sofa: '🛋️', seat: '🪑', table: '🪵', shelf: '📚', wardrobe: '🚪',
  counter: '🍳', hanger: '🧥', appliance: '📺', screen: '🖥️', lamp: '💡', tank: '🐠',
  plant: '🪴', garden: '🌷', vase: '🏺', doll: '🧸', deco: '🎀', mirror: '🪞',
  instrument: '🎸', cattower: '🐈', rug: '🟫', wall: '🖼️', wallclock: '🕐',
  wallneon: '✨', wallshelf: '🗄️',
};
const CAT_EMOJI: Record<ItemCategory, string> = {
  furniture: '🪑', electronics: '📺', plant: '🪴', deco: '🧸', rug: '🟫', wall: '🖼️',
};
export function itemEmoji(def: ItemDef): string {
  return ARCH_EMOJI[def.arch] ?? CAT_EMOJI[def.category];
}

const TABS: Array<ItemCategory | 'all'> = ['all', 'furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];

/** 소지품 패널 (레퍼런스 IMG_9819) — 나무 그리드 + 수량 뱃지 + 하단 카테고리 선반 */
export class BagPanel {
  private root: HTMLDivElement;
  private opened = false;
  private counts = new Map<string, number>();
  private tab: ItemCategory | 'all' = 'all';
  private online: boolean;

  constructor(private readonly opts: { onToggle: (open: boolean) => void; online: boolean }) {
    this.online = opts.online;
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-bag';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(counts: Map<string, number>): void {
    if (this.opened) return;
    this.opened = true;
    this.counts = counts;
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

  private items(): Array<{ def: ItemDef; qty: number }> {
    const out: Array<{ def: ItemDef; qty: number }> = [];
    for (const [id, qty] of this.counts) {
      if (qty <= 0) continue;
      const def = CATALOG_BY_ID.get(id);
      if (!def) continue;
      if (this.tab !== 'all' && def.category !== this.tab) continue;
      out.push({ def, qty });
    }
    return out.sort((a, b) => a.def.name.localeCompare(b.def.name, 'ko'));
  }

  private render(): void {
    const rows = this.items();
    const total = [...this.counts.values()].reduce((s, v) => s + Math.max(0, v), 0);
    const slots = rows.map(({ def, qty }) => `
      <button class="slot" data-name="${def.name}" title="${def.name} ×${qty}">
        <i style="background:#${def.color}">${itemEmoji(def)}</i>
        <b>${qty}</b>
      </button>`).join('');
    const empty = this.online
      ? '아직 소지품이 없어요 — 가구점 「살림」에서 장만해 보세요!'
      : '오프라인 모드 — 접속하면 내 소지품이 보여요';
    this.root.innerHTML = `
      <div class="wood-frame">
        <div class="wood-head">
          <h2>🎒 소지품</h2>
          <span class="pill">전체 ${total}개</span>
        </div>
        <div class="wood-page bag-grid">${slots || `<p class="empty">${empty}</p>`}</div>
        <p class="bag-name">&nbsp;</p>
        <div class="wood-tabs">
          ${TABS.map((t) => `
            <button data-tab="${t}" class="${this.tab === t ? 'sel' : ''}">
              ${t === 'all' ? '모두' : CATEGORY_LABEL[t]}
            </button>`).join('')}
        </div>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => { this.tab = b.dataset.tab as ItemCategory | 'all'; this.render(); });
    });
    const nameEl = this.root.querySelector<HTMLParagraphElement>('.bag-name')!;
    this.root.querySelectorAll<HTMLButtonElement>('.slot').forEach((b) => {
      b.addEventListener('click', () => { nameEl.textContent = b.dataset.name!; });
    });
  }

  destroy(): void { this.root.remove(); }
}
