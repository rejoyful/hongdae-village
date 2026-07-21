import { CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory } from '../items/catalog';

const TAB_ORDER: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];

/** 방 주인 꾸미기용 하단 인벤토리 바 — 카테고리 탭 + 아이템 목록 */
export class InventoryBar {
  private root: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private itemsEl: HTMLDivElement;
  private selectedId: string | null = null;
  private activeCat: ItemCategory | null = null;
  private counts = new Map<string, number>();

  constructor(private readonly onSelect: (itemId: string | null) => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-inv';
    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'hv-inv-tabs';
    this.itemsEl = document.createElement('div');
    this.itemsEl.className = 'hv-inv-items';
    this.root.append(this.tabsEl, this.itemsEl);
    document.body.appendChild(this.root);
  }

  get selected(): string | null { return this.selectedId; }

  setCounts(counts: Map<string, number>): void {
    this.counts = counts;
    if (this.selectedId && (counts.get(this.selectedId) ?? 0) <= 0) this.selectedId = null;
    if (!this.activeCat) this.activeCat = this.availableCats()[0] ?? 'furniture';
    this.render();
  }

  clearSelection(): void {
    this.selectedId = null;
    this.render();
    this.onSelect(null);
  }

  private availableCats(): ItemCategory[] {
    const cats = new Set<ItemCategory>();
    for (const [id, qty] of this.counts) {
      if (qty > 0) {
        const def = CATALOG_BY_ID.get(id);
        if (def) cats.add(def.category);
      }
    }
    return TAB_ORDER.filter((c) => cats.has(c));
  }

  private render(): void {
    const cats = this.availableCats();
    if (this.activeCat && !cats.includes(this.activeCat)) this.activeCat = cats[0] ?? null;

    this.tabsEl.innerHTML = '';
    for (const cat of cats) {
      const tab = document.createElement('button');
      tab.className = this.activeCat === cat ? 'sel' : '';
      tab.textContent = CATEGORY_LABEL[cat];
      tab.addEventListener('click', () => { this.activeCat = cat; this.render(); });
      this.tabsEl.appendChild(tab);
    }

    this.itemsEl.innerHTML = '';
    for (const [itemId, qty] of this.counts) {
      if (qty <= 0) continue;
      const def = CATALOG_BY_ID.get(itemId);
      if (!def || def.category !== this.activeCat) continue;
      const btn = document.createElement('button');
      btn.className = this.selectedId === itemId ? 'sel' : '';
      btn.innerHTML = `<i style="background:#${def.color}"></i>${def.name} <b>×${qty}</b>`;
      btn.addEventListener('click', () => {
        this.selectedId = this.selectedId === itemId ? null : itemId;
        this.render();
        this.onSelect(this.selectedId);
      });
      this.itemsEl.appendChild(btn);
    }
  }

  destroy(): void { this.root.remove(); }
}
