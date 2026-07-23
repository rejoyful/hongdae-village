import { CATALOG_BY_ID, CATEGORY_LABEL } from '../items/catalog';
import type { Placed } from '../game/entities/placement';
import {
  HOME_OBJECT_STORY_H, HOME_OBJECT_STORY_W, paintHomeObjectStory,
} from '../game/art/homeObjectStoryArt';
import {
  OBJECT_STORY_BY_ITEM, OBJECT_STORY_CHAPTERS, OBJECT_STORY_CHAPTER_BY_ID,
  HomeObjectStoryStore,
  type ObjectStoryChapterId, type ObjectStoryProgress,
} from '../game/home/objectStories';

export interface HomeObjectStoryContext {
  counts: ReadonlyMap<string, number>;
  placed: readonly Placed[];
}
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 보유·배치한 65개 물건의 개별 서사와 최애 진열을 읽는 2.5D 픽셀 도감. */
export class HomeObjectStoryPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedChapter: ObjectStoryChapterId = OBJECT_STORY_CHAPTERS[0]!.id;
  private selectedItemId = OBJECT_STORY_CHAPTERS[0]!.itemIds[0]!;
  private feedback = '';

  constructor(private readonly store: HomeObjectStoryStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getContext: () => HomeObjectStoryContext;
    onChanged: (progress: ObjectStoryProgress) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-object-stories';
    this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '물건의 속삭임 도감');
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    const added = this.discoverCurrent();
    const firstObserved = this.store.get().observedIds[0];
    if (firstObserved) {
      const story = OBJECT_STORY_BY_ITEM.get(firstObserved);
      if (story) {
        this.selectedChapter = story.chapterId;
        this.selectedItemId = firstObserved;
      }
    }
    this.feedback = added
      ? `방과 가구함에서 처음 만난 물건 ${added}점의 이야기를 도감에 보존했어요.`
      : '물건을 옮기거나 방을 바꿔도 이미 읽은 이야기는 사라지지 않아요.';
    this.opened = true;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.object-story-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(): void {
    if (!this.opened) return;
    const added = this.discoverCurrent();
    if (added) this.feedback = `새로 만난 물건 ${added}점의 속삭임이 도착했어요.`;
    this.render();
  }

  destroy(): void { this.close(); this.root.remove(); }

  private availableIds(): string[] {
    const context = this.opts.getContext();
    return [...new Set([
      ...[...context.counts.entries()].filter(([, count]) => count > 0).map(([id]) => id),
      ...context.placed.map((entry) => entry.itemId),
    ])];
  }

  private discoverCurrent(): number {
    const added = this.store.discoverAvailable(this.availableIds());
    if (added) this.opts.onChanged(this.store.progress());
    return added;
  }

  private render(): void {
    const state = this.store.get();
    const progress = this.store.progress();
    const chapters = this.store.chapters();
    const chapter = OBJECT_STORY_CHAPTER_BY_ID.get(this.selectedChapter) ?? OBJECT_STORY_CHAPTERS[0]!;
    if (!chapter.itemIds.includes(this.selectedItemId)) this.selectedItemId = chapter.itemIds[0]!;
    const selectedStory = OBJECT_STORY_BY_ITEM.get(this.selectedItemId)!;
    const selectedItem = CATALOG_BY_ID.get(this.selectedItemId)!;
    const observed = new Set(state.observedIds);
    const favorites = new Set(state.favoriteIds);
    const placed = new Set(this.opts.getContext().placed.map((entry) => entry.itemId));
    const chapterView = chapters.find((entry) => entry.id === chapter.id)!;

    const chapterButtons = chapters.map((entry) => `<button data-object-chapter="${entry.id}" class="${entry.id === chapter.id ? 'sel' : ''} ${entry.complete ? 'complete' : ''}" style="--object-color:${entry.palette[2]};--object-deep:${entry.palette[0]}">
      <i>${entry.mark}</i><span><small>${escapeHtml(entry.code)}</small><b>${escapeHtml(entry.title)}</b><em>${entry.observed}/${entry.total} 관찰 · ${entry.complete ? '장 완성' : `${entry.required}점부터 완성`}</em></span>
    </button>`).join('');

    const cards = chapter.itemIds.map((itemId, index) => {
      const story = OBJECT_STORY_BY_ITEM.get(itemId)!;
      const item = CATALOG_BY_ID.get(itemId)!;
      const isObserved = observed.has(itemId);
      return `<button data-object-item="${itemId}" class="${itemId === this.selectedItemId ? 'sel' : ''} ${isObserved ? 'observed' : 'locked'} ${favorites.has(itemId) ? 'favorite' : ''}" style="--delay:${index * 38}ms">
        <canvas width="${HOME_OBJECT_STORY_W}" height="${HOME_OBJECT_STORY_H}" data-object-card="${itemId}" aria-label="${escapeHtml(isObserved ? item.name : '아직 모르는 물건')} 픽셀 카드"></canvas>
        <span><small>${isObserved ? escapeHtml(CATEGORY_LABEL[item.category]) : 'NOT MET YET'}${placed.has(itemId) ? ' · 방에 배치 중' : ''}</small><b>${escapeHtml(isObserved ? item.name : '아직 모르는 물건')}</b><em>${isObserved ? escapeHtml(story.tags.join(' · ')) : escapeHtml(story.source)}</em></span>
      </button>`;
    }).join('');

    const favoriteCards = state.favoriteIds.map((itemId, index) => {
      const item = CATALOG_BY_ID.get(itemId)!;
      return `<button data-object-favorite-jump="${itemId}" title="${escapeHtml(item.name)} 이야기 보기"><i>${index + 1}</i><span>${escapeHtml(item.name)}</span></button>`;
    }).join('');

    this.root.innerHTML = `<section class="object-story-book" style="--object-color:${chapter.palette[2]};--object-deep:${chapter.palette[0]};--object-mid:${chapter.palette[1]};--object-paper:${chapter.palette[3]}">
      <header><div><small>65 OBJECTS · 65 WHISPERS · NO EXPIRY</small><h1>물건의 속삭임 도감</h1><p>가지고 있거나 방에 놓아 본 물건은 기능을 넘어 고유한 기억과 배치 이야기를 들려줍니다.</p></div>
        <aside><span><b>${progress.observed}</b>/${progress.total}<small>만난 물건</small></span><span><b>${progress.chapters}</b>/${progress.totalChapters}<small>완성한 장</small></span><span><b>${progress.favorites}</b>/${progress.favoriteMax}<small>최애 진열</small></span></aside>
        <button class="object-story-close" aria-label="닫기">×</button></header>
      <div class="object-story-layout">
        <nav class="object-story-chapters" aria-label="물건 이야기 장"><header><small>NINE WAYS TO LIVE</small><h2>방이 기억한 아홉 장</h2></header>${chapterButtons}</nav>
        <main class="object-story-index">
          <header><div><small>${escapeHtml(chapter.code)} · ${escapeHtml(chapter.curator)}</small><h2>${escapeHtml(chapter.title)}</h2><p>${escapeHtml(chapter.subtitle)}</p></div><strong>${chapterView.observed}<i>/${chapterView.total}</i><small>${chapterView.complete ? '장 완성' : `${chapterView.required}점부터 완성`}</small></strong></header>
          <div>${cards}</div>
        </main>
        <aside class="object-story-detail">
          <canvas width="${HOME_OBJECT_STORY_W}" height="${HOME_OBJECT_STORY_H}" data-object-selected="${this.selectedItemId}" aria-label="${escapeHtml(observed.has(this.selectedItemId) ? selectedItem.name : '아직 모르는 물건')} 상세 픽셀 장면"></canvas>
          <div class="${observed.has(this.selectedItemId) ? '' : 'locked'}"><small>${escapeHtml(chapter.code)} · ${escapeHtml(CATEGORY_LABEL[selectedItem.category])}</small>
            <h2>${escapeHtml(observed.has(this.selectedItemId) ? selectedItem.name : '아직 만나지 못한 물건')}</h2>
            ${observed.has(this.selectedItemId)
              ? `<blockquote>“${escapeHtml(selectedStory.whisper)}”</blockquote><p>${escapeHtml(selectedStory.note)}</p><div>${selectedStory.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div><em>${placed.has(this.selectedItemId) ? '현재 방에 배치 중 · 가까이에서 매일 만나는 물건' : '가구함에 보관 중 · 언제든 다시 방으로 꺼낼 수 있어요'}</em>`
              : `<blockquote>이 물건을 직접 소유하거나 방에 배치하면 이름과 이야기가 열립니다.</blockquote><p>${escapeHtml(selectedStory.source)}에서 천천히 만날 수 있어요. 기간 한정이나 실패 페널티는 없습니다.</p>`}
          </div>
          <footer>${observed.has(this.selectedItemId)
            ? `<button data-object-inspect="${this.selectedItemId}">이 속삭임 다시 읽기 · ${state.inspectionCounts[this.selectedItemId] ?? 0}회</button><button data-object-favorite="${this.selectedItemId}" class="${favorites.has(this.selectedItemId) ? 'favorite' : ''}">${favorites.has(this.selectedItemId) ? '★ 최애 진열에서 내리기' : '☆ 나의 최애 물건으로'}</button>`
            : `<button disabled>${escapeHtml(selectedStory.source)}에서 만나기</button>`}</footer>
        </aside>
      </div>
      <section class="object-story-favorites"><header><div><small>MY NINE FAVORITE OBJECTS</small><h2>나를 설명하는 아홉 물건</h2></div><p>최애에서 내려도 이야기와 관찰 기록은 그대로 남아요.</p></header><div>${favoriteCards || '<span>마음에 남은 물건의 ☆ 버튼을 누르면 이 선반에 이름이 놓여요.</span>'}</div></section>
      <footer role="status">${escapeHtml(this.feedback)} · 순위·별점·연속 접속 보상 없음</footer>
    </section>`;
    this.paint();
    this.bind();
  }

  private paint(): void {
    const observed = new Set(this.store.get().observedIds);
    const favorites = new Set(this.store.get().favoriteIds);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-object-card]').forEach((canvas) => {
      const itemId = canvas.dataset.objectCard!;
      paintHomeObjectStory(canvas, itemId, observed.has(itemId), favorites.has(itemId));
    });
    const selected = this.root.querySelector<HTMLCanvasElement>('[data-object-selected]');
    if (selected) paintHomeObjectStory(
      selected, selected.dataset.objectSelected!, observed.has(selected.dataset.objectSelected!),
      favorites.has(selected.dataset.objectSelected!),
    );
  }

  private bind(): void {
    this.root.querySelector('.object-story-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-object-chapter]').forEach((button) => button.addEventListener('click', () => {
      this.selectedChapter = button.dataset.objectChapter as ObjectStoryChapterId;
      const chapter = OBJECT_STORY_CHAPTER_BY_ID.get(this.selectedChapter)!;
      this.selectedItemId = chapter.itemIds.find((id) => this.store.isObserved(id)) ?? chapter.itemIds[0]!;
      this.feedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-object-item]').forEach((button) => button.addEventListener('click', () => {
      this.selectedItemId = button.dataset.objectItem!;
      if (this.store.isObserved(this.selectedItemId)) {
        this.store.inspect(this.selectedItemId);
        this.feedback = `「${CATALOG_BY_ID.get(this.selectedItemId)?.name}」의 작은 이야기를 다시 읽었어요.`;
        this.opts.onChanged(this.store.progress());
      } else {
        this.feedback = `${OBJECT_STORY_BY_ITEM.get(this.selectedItemId)?.source ?? '살림 쇼룸'}에서 직접 만나면 이야기가 열려요.`;
      }
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-object-inspect]')?.addEventListener('click', (event) => {
      const itemId = (event.currentTarget as HTMLButtonElement).dataset.objectInspect!;
      if (this.store.inspect(itemId) === 'inspected') {
        this.feedback = '같은 이야기도 지금의 방과 함께 읽으면 조금 다른 장면으로 남아요.';
        this.opts.onChanged(this.store.progress());
        this.render();
      }
    });
    this.root.querySelector<HTMLButtonElement>('[data-object-favorite]')?.addEventListener('click', (event) => {
      const itemId = (event.currentTarget as HTMLButtonElement).dataset.objectFavorite!;
      const result = this.store.toggleFavorite(itemId);
      this.feedback = result === 'added' ? '나를 설명하는 최애 물건 선반에 올렸어요.'
        : result === 'removed' ? '최애 선반에서만 내렸어요. 이야기와 관찰 기록은 그대로예요.'
          : result === 'full' ? '최애 선반은 아홉 칸이에요. 한 점을 내린 뒤 다시 골라 주세요.'
            : '직접 만난 물건만 최애로 고를 수 있어요.';
      this.opts.onChanged(this.store.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-object-favorite-jump]').forEach((button) => button.addEventListener('click', () => {
      const itemId = button.dataset.objectFavoriteJump!;
      const story = OBJECT_STORY_BY_ITEM.get(itemId);
      if (!story) return;
      this.selectedChapter = story.chapterId;
      this.selectedItemId = itemId;
      this.feedback = '최애 선반에서 이 물건의 장으로 돌아왔어요.';
      this.render();
    }));
  }
}
