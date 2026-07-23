import { CATALOG_BY_ID } from '../items/catalog';
import {
  HOME_MOODBOARDS, type HomeMoodboardContext, type HomeMoodboardId, type HomeMoodboardProgress,
  type HomeMoodboardStore, type HomeMoodboardView,
} from '../game/home/homeMoodboards';
import { HOME_MOODBOARD_ART_H, HOME_MOODBOARD_ART_W, paintHomeMoodboardArt } from '../game/art/homeMoodboardArt';
import { furnitureAcquisitionRoute } from '../game/home/furnitureWorkshop';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class HomeMoodboardPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedId: HomeMoodboardId;
  private feedback = '';

  constructor(private readonly store: HomeMoodboardStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getContext: () => HomeMoodboardContext;
    previewForItem: (itemId: string) => string | null;
    onFindItem: (itemId: string) => boolean;
    onOpenReform: () => void;
    onChanged: (progress: HomeMoodboardProgress) => void;
  }) {
    this.selectedId = store.get().trackedId ?? HOME_MOODBOARDS[0]!.id;
    this.root = document.createElement('div');
    this.root.className = 'hv-home-moodboards'; this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog'); this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '홈 무드보드 연구실');
    document.body.appendChild(this.root);
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => { event.stopPropagation(); if (event.key === 'Escape') this.close(); });
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.selectedId = this.store.get().trackedId ?? this.selectedId;
    this.feedback = ''; this.opened = true; this.root.style.display = 'flex'; this.render(); this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.mood-close')?.focus());
  }

  close(): void { if (!this.opened) return; this.opened = false; this.root.style.display = 'none'; this.opts.onToggle(false); }
  refresh(): void { if (this.opened) this.render(); }

  private render(): void {
    const context = this.opts.getContext();
    const views = this.store.views(context);
    const progress = this.store.progress(context);
    const selected = views.find((view) => view.id === this.selectedId) ?? views[0]!;
    const tracked = this.store.get().trackedId;
    const nextCheck = selected.checks.find((check) => !check.done);
    this.root.innerHTML = `<section class="moodbook">
      <header class="mood-head"><div class="mood-title-mark">집</div><div><small>HOME MOODBOARD ATELIER</small><h2>홈 무드보드 연구실</h2><p>좋아하는 장면을 연구하고, 지금 방으로 완성해 영구 도장을 모아요.</p></div><button class="mood-close">닫기</button></header>
      <div class="mood-stats"><span><b>${progress.stamped}</b><small>/ ${progress.total} 완성 도장</small></span><span><b>${progress.ready}</b><small>지금 도장 가능</small></span><span><b>${progress.matchedItems}</b><small>/ ${progress.totalItems} 가구 배치</small></span><p>기한도 실패도 없어요. 이미 쌓은 생활 기록과 리폼도 그대로 인정합니다.</p></div>
      <div class="mood-layout">
        <nav class="mood-index" aria-label="무드보드 테마">${views.map((view) => this.indexCard(view, tracked)).join('')}</nav>
        <main class="mood-page" style="--mood-paper:${selected.palette[0]};--mood-warm:${selected.palette[1]};--mood-cool:${selected.palette[2]};--mood-ink:${selected.palette[3]}">
          <section class="mood-hero"><div class="mood-art"><canvas width="${HOME_MOODBOARD_ART_W}" height="${HOME_MOODBOARD_ART_H}" data-mood-art></canvas><span>${selected.stamped ? 'ARCHIVED ROOM' : selected.ready ? 'STAMP READY' : `STUDY ${String(selected.order).padStart(2, '0')}`}</span></div>
            <div class="mood-copy"><small>${escapeHtml(selected.subtitle)}</small><h3>${escapeHtml(selected.title)}</h3><p>${escapeHtml(selected.description)}</p><div class="mood-progress"><i style="width:${selected.progress}%"></i></div><b>${selected.completedChecks}/${selected.checks.length} 조건 · ${selected.progress}%</b></div>
            <div class="mood-stamp ${selected.stamped ? 'stamped' : ''}"><i>${escapeHtml(selected.mark)}</i><span>${selected.stamped ? '완성 도장' : '연구 중'}</span></div>
          </section>
          <section class="mood-furniture"><header><div><small>PLACE THESE FOUR</small><h3>장면을 만드는 네 가지 가구</h3></div><span>방에 배치해야 체크돼요.</span></header><div>${selected.checks.filter((check) => check.kind === 'item').map((check, index) => {
            const def = CATALOG_BY_ID.get(check.itemId!);
            return `<article class="${check.done ? 'done' : check.owned ? 'owned' : ''}" style="--mood-item-index:${index}"><div class="mood-item-art"><img data-mood-item-image="${escapeHtml(check.itemId!)}" alt=""><i>${check.done ? '배치' : check.owned ? '보유' : '찾기'}</i></div><span><small>${check.done ? '현재 방에서 확인' : check.owned ? '가구함에 있어요' : '아직 가구함에 없어요'}</small><b>${escapeHtml(def?.name ?? check.label)}</b><em>${escapeHtml(def ? `${def.category} · ${def.w}×${def.h}칸` : '테마 가구')}</em></span>${check.done ? '<strong>✓</strong>' : `<button data-mood-find="${escapeHtml(check.itemId!)}">${check.owned ? '바로 배치' : '얻는 법'}</button>`}</article>`;
          }).join('')}</div></section>
          <section class="mood-conditions"><header><div><small>LIFE RECORD</small><h3>생활 조건</h3></div>${selected.requirements.some((requirement) => requirement.kind === 'reform') ? '<button data-mood-reform>리폼 공방 열기</button>' : '<span>평생 기록을 소급 적용</span>'}</header><div>${selected.checks.filter((check) => check.kind === 'condition').map((check) => `<span class="${check.done ? 'done' : ''}"><i>${check.done ? '✓' : '·'}</i><b>${escapeHtml(check.label)}</b><small>${check.current}/${check.goal}</small></span>`).join('')}</div></section>
          <footer class="mood-actions"><div><small>${selected.stamped ? '영구 소장품' : nextCheck ? '다음 한 걸음' : '모든 조건 완료'}</small><b>${escapeHtml(selected.stamped ? selected.keepsake : nextCheck ? this.nextHint(nextCheck) : '완성 도장을 찍어 기록하세요.')}</b>${this.feedback ? `<p aria-live="polite">${escapeHtml(this.feedback)}</p>` : ''}</div>
            ${selected.stamped ? '<button disabled>도장 소장 중</button>' : selected.ready ? '<button class="primary" data-mood-stamp>완성 도장 찍기</button>' : `<button data-mood-track>${tracked === selected.id ? '현재 추적 중' : '이 테마 추적하기'}</button>`}
          </footer>
        </main>
      </div>
    </section>`;
    this.paint(selected);
    this.bind(selected, context);
  }

  private indexCard(view: HomeMoodboardView, tracked: HomeMoodboardId | null): string {
    return `<button data-mood-board="${view.id}" class="${view.id === this.selectedId ? 'sel' : ''} ${view.stamped ? 'stamped' : view.ready ? 'ready' : ''}"><i>${view.stamped ? '✓' : escapeHtml(view.mark)}</i><span><small>${String(view.order).padStart(2, '0')} · ${view.stamped ? '완성' : view.ready ? '도장 가능' : tracked === view.id ? '추적 중' : `${view.progress}%`}</small><b>${escapeHtml(view.title)}</b></span><em>${view.completedChecks}/${view.checks.length}</em></button>`;
  }

  private nextHint(check: HomeMoodboardView['checks'][number]): string {
    if (check.kind === 'condition') return `${check.label} · 현재 ${check.current}/${check.goal}`;
    if (check.owned) return `${check.label}을 가구함에서 골라 방에 배치해 보세요.`;
    return `${check.label} · ${furnitureAcquisitionRoute(check.itemId!)}`;
  }

  private paint(selected: HomeMoodboardView): void {
    const sources: (HTMLImageElement | null)[] = selected.itemIds.map((itemId) => {
      const url = this.opts.previewForItem(itemId); if (!url) return null;
      const image = new Image(); image.src = url; return image;
    });
    const redraw = (): void => { const canvas = this.root.querySelector<HTMLCanvasElement>('[data-mood-art]'); if (canvas) paintHomeMoodboardArt(canvas, selected, sources); };
    redraw();
    sources.forEach((source) => { if (source && !source.complete) source.addEventListener('load', redraw, { once: true }); });
    this.root.querySelectorAll<HTMLImageElement>('[data-mood-item-image]').forEach((image) => {
      const url = this.opts.previewForItem(image.dataset.moodItemImage!); if (url) image.src = url;
    });
  }

  private bind(selected: HomeMoodboardView, context: HomeMoodboardContext): void {
    this.root.querySelector('.mood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-mood-board]').forEach((button) => button.addEventListener('click', () => {
      this.selectedId = button.dataset.moodBoard as HomeMoodboardId; this.feedback = ''; this.render();
    }));
    this.root.querySelector('[data-mood-track]')?.addEventListener('click', () => {
      this.store.track(selected.id); this.feedback = `「${selected.title}」을 현재 집 꾸미기 목표로 정했어요.`; this.opts.onChanged(this.store.progress(context)); this.render();
    });
    this.root.querySelector('[data-mood-stamp]')?.addEventListener('click', () => {
      const result = this.store.stamp(selected.id, context);
      this.feedback = result === 'stamped' ? `완성! 「${selected.keepsake}」을 영구 소장품으로 받았어요.` : '방이 바뀌었어요. 조건을 다시 확인해 주세요.';
      this.opts.onChanged(this.store.progress(this.opts.getContext())); this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-mood-find]').forEach((button) => button.addEventListener('click', () => {
      const itemId = button.dataset.moodFind!;
      const owned = selected.checks.find((check) => check.itemId === itemId)?.owned;
      if (owned) { this.close(); this.opts.onFindItem(itemId); return; }
      this.feedback = `${CATALOG_BY_ID.get(itemId)?.name ?? '이 가구'} · ${furnitureAcquisitionRoute(itemId)}`; this.render();
    }));
    this.root.querySelector('[data-mood-reform]')?.addEventListener('click', () => { this.close(); this.opts.onOpenReform(); });
  }

  destroy(): void { this.root.remove(); }
}
