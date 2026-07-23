import { CATALOG_BY_ID, CATEGORY_LABEL, type ItemCategory } from '../items/catalog';
import { OBJECT_STORY_BY_ITEM } from '../game/home/objectStories';

const TAB_ORDER: ItemCategory[] = ['furniture', 'electronics', 'plant', 'deco', 'rug', 'wall'];

/** 방 주인 꾸미기용 하단 인벤토리 바 — 카테고리 탭 + 아이템 목록 */
export class InventoryBar {
  private root: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private detailEl: HTMLDivElement;
  private itemsEl: HTMLDivElement;
  private selectedId: string | null = null;
  private hoveredId: string | null = null;
  private activeCat: ItemCategory | null = null;
  private counts = new Map<string, number>();

  constructor(private readonly onSelect: (itemId: string | null) => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-inv';
    this.tabsEl = document.createElement('div');
    this.tabsEl.className = 'hv-inv-tabs';
    this.detailEl = document.createElement('div');
    this.detailEl.className = 'hv-inv-detail';
    this.itemsEl = document.createElement('div');
    this.itemsEl.className = 'hv-inv-items';
    this.root.append(this.tabsEl, this.detailEl, this.itemsEl);
    document.body.appendChild(this.root);
  }

  get selected(): string | null { return this.selectedId; }

  setCounts(counts: Map<string, number>): void {
    this.counts = counts;
    const cleared = !!this.selectedId && (counts.get(this.selectedId) ?? 0) <= 0;
    if (cleared) this.selectedId = null;
    if (!this.activeCat) this.activeCat = this.availableCats()[0] ?? 'furniture';
    this.render();
    // 마지막 수량을 배치한 순간 씬의 고스트도 함께 지운다.
    if (cleared) this.onSelect(null);
  }

  clearSelection(): void {
    this.selectedId = null;
    this.render();
    this.onSelect(null);
  }

  /** 홈 수첩의 추천처럼 외부 안내에서 보유 가구를 직접 선택한다. */
  select(itemId: string): boolean {
    const def = CATALOG_BY_ID.get(itemId);
    if (!def || (this.counts.get(itemId) ?? 0) <= 0) return false;
    this.activeCat = def.category;
    this.selectedId = itemId;
    this.render();
    this.onSelect(itemId);
    return true;
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
      tab.addEventListener('click', () => { this.activeCat = cat; this.hoveredId = null; this.render(); });
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
      btn.title = OBJECT_STORY_BY_ITEM.get(itemId)?.whisper ?? def.name;
      btn.addEventListener('mouseenter', () => { this.hoveredId = itemId; this.renderDetail(); });
      btn.addEventListener('focus', () => { this.hoveredId = itemId; this.renderDetail(); });
      btn.addEventListener('click', () => {
        this.selectedId = this.selectedId === itemId ? null : itemId;
        this.hoveredId = itemId;
        this.render();
        this.onSelect(this.selectedId);
      });
      this.itemsEl.appendChild(btn);
    }
    this.renderDetail();
  }

  private renderDetail(): void {
    const fallback = [...this.counts.entries()].find(([itemId, qty]) => (
      qty > 0 && CATALOG_BY_ID.get(itemId)?.category === this.activeCat
    ))?.[0] ?? null;
    const itemId = this.hoveredId && (this.counts.get(this.hoveredId) ?? 0) > 0
      ? this.hoveredId : this.selectedId ?? fallback;
    const item = itemId ? CATALOG_BY_ID.get(itemId) : null;
    const story = itemId ? OBJECT_STORY_BY_ITEM.get(itemId) : null;
    if (!item || !story) {
      this.detailEl.innerHTML = '<span><b>가구함</b><small>물건에 포인터를 올리면 작은 이야기가 보여요.</small></span>';
      return;
    }
    this.detailEl.innerHTML = `<i style="--item-color:#${item.color}">${story.tags[0].slice(0, 1)}</i><span><b>${item.name}<em>${CATEGORY_LABEL[item.category]} · ${item.w}×${item.h}</em></b><small>“${story.whisper}”</small></span><strong>${this.selectedId === itemId ? '배치 선택 중' : '살펴보기'}</strong>`;
  }

  destroy(): void { this.root.remove(); }
}
