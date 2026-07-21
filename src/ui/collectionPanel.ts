import { CATALOG, CATEGORY_LABEL, type ItemCategory } from '../items/catalog';
import { itemEmoji } from './bagPanel';

const CATS: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];
/** 사이드 탭 색 — 레퍼런스(IMG_9821)의 알록달록한 카테고리 리본 재현 */
const TAB_COLOR: Record<ItemCategory, string> = {
  furniture: '#e8b64c', electronics: '#7fa8d8', plant: '#8cbf6a',
  deco: '#e88ca0', rug: '#c09468', wall: '#a88cd0',
};
const TAB_EMOJI: Record<ItemCategory, string> = {
  furniture: '🪑', electronics: '📺', plant: '🪴', deco: '🧸', rug: '🟫', wall: '🖼️',
};

/**
 * 가이드북(도감) 패널 — 카테고리별 수집 진행. "발견"은 한 번이라도 소유한 아이템
 * (세션 누적 + 현재 인벤토리 병합, localStorage로 기기 지속).
 */
export class CollectionPanel {
  private root: HTMLDivElement;
  private opened = false;
  private cat: ItemCategory = 'furniture';
  private discovered = new Set<string>();
  private counts = new Map<string, number>();
  private readonly storeKey: string;

  constructor(userId: string, private readonly opts: { onToggle: (open: boolean) => void }) {
    this.storeKey = `hv-dex-${userId}`;
    try {
      const raw = localStorage.getItem(this.storeKey);
      if (raw) (JSON.parse(raw) as string[]).forEach((id) => this.discovered.add(id));
    } catch { /* 저장소 불가 환경 — 세션 한정으로 동작 */ }
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-dex';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  /** 지금까지 발견한 아이템 수 (랭킹 가산값) */
  get foundCount(): number { return this.discovered.size; }

  /** 인벤토리 스냅샷을 발견 목록에 병합 (열 때마다 호출) */
  absorb(counts: Map<string, number>): void {
    this.counts = counts;
    let dirty = false;
    for (const [id, qty] of counts) {
      if (qty > 0 && !this.discovered.has(id)) { this.discovered.add(id); dirty = true; }
    }
    if (dirty) {
      try { localStorage.setItem(this.storeKey, JSON.stringify([...this.discovered])); }
      catch { /* ignore */ }
    }
  }

  open(counts: Map<string, number>): void {
    if (this.opened) return;
    this.opened = true;
    this.absorb(counts);
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

  private render(): void {
    const items = CATALOG.filter((i) => i.category === this.cat);
    const found = items.filter((i) => this.discovered.has(i.id)).length;
    const rows = items.map((def) => {
      const known = this.discovered.has(def.id);
      const qty = this.counts.get(def.id) ?? 0;
      return known
        ? `<div class="row known">
             <i style="background:#${def.color}">${itemEmoji(def)}</i>
             <span class="nm">${def.name}</span>
             <span class="own">${qty > 0 ? `보유 ×${qty}` : '기록됨'}</span>
           </div>`
        : `<div class="row unknown"><i>?</i><span class="nm">???</span></div>`;
    }).join('');
    this.root.innerHTML = `
      <div class="wood-frame dex-frame">
        <div class="wood-head">
          <h2>📖 가이드북</h2>
          <span class="pill">👑 ${found} / ${items.length}</span>
        </div>
        <div class="dex-body">
          <div class="dex-tabs">
            ${CATS.map((c) => `
              <button data-cat="${c}" class="${this.cat === c ? 'sel' : ''}"
                style="background:${TAB_COLOR[c]}" title="${CATEGORY_LABEL[c]}">${TAB_EMOJI[c]}</button>`).join('')}
          </div>
          <div class="wood-page dex-list">
            <div class="dex-title">${CATEGORY_LABEL[this.cat]}</div>
            ${rows}
          </div>
        </div>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => {
      b.addEventListener('click', () => { this.cat = b.dataset.cat as ItemCategory; this.render(); });
    });
  }

  destroy(): void { this.root.remove(); }
}
