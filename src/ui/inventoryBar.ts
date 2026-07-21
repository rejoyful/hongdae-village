import { CATALOG_BY_ID } from '../items/catalog';

/** 방 주인 꾸미기용 하단 인벤토리 바. 아이템 선택 → 씬이 고스트 프리뷰 모드로 전환 */
export class InventoryBar {
  private root: HTMLDivElement;
  private selectedId: string | null = null;
  private counts = new Map<string, number>();

  constructor(private readonly onSelect: (itemId: string | null) => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-inv';
    document.body.appendChild(this.root);
  }

  get selected(): string | null { return this.selectedId; }

  setCounts(counts: Map<string, number>): void {
    this.counts = counts;
    if (this.selectedId && (counts.get(this.selectedId) ?? 0) <= 0) this.selectedId = null;
    this.render();
  }

  clearSelection(): void {
    this.selectedId = null;
    this.render();
    this.onSelect(null);
  }

  private render(): void {
    this.root.innerHTML = '';
    for (const [itemId, qty] of this.counts) {
      if (qty <= 0) continue;
      const def = CATALOG_BY_ID.get(itemId);
      if (!def) continue;
      const btn = document.createElement('button');
      btn.className = this.selectedId === itemId ? 'sel' : '';
      btn.innerHTML = `<i style="background:#${def.color}"></i>${def.name} <b>×${qty}</b>`;
      btn.addEventListener('click', () => {
        this.selectedId = this.selectedId === itemId ? null : itemId;
        this.render();
        this.onSelect(this.selectedId);
      });
      this.root.appendChild(btn);
    }
  }

  destroy(): void { this.root.remove(); }
}
