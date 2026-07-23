import type { QuestState } from '../game/questProgress';
import {
  STARTER_COMPASS_ROUTES, starterCompassConciergeView, starterCompassRouteViews,
  type StarterCompassRouteId,
} from '../game/progression/starterCompass';
import {
  StarterConciergeStore, starterConciergePresentation,
} from '../game/guidance/starterConcierge';
import {
  STARTER_CONCIERGE_ART_H, STARTER_CONCIERGE_ART_W, paintStarterConciergeArt,
} from '../game/art/starterConciergeArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 512개 목표 앞에서 길을 잃지 않도록 기존 첫날 나침반의 단 한 걸음만 월드에 꺼내 놓는다. */
export class StarterConciergeDock {
  private readonly root: HTMLElement;
  private readonly store: StarterConciergeStore;

  constructor(userId: string, private readonly opts: {
    getQuestState: () => QuestState;
    getSelectedRouteId: () => StarterCompassRouteId | null;
    onSelectRoute: (routeId: StarterCompassRouteId) => void;
    onNavigate: (metric: string, title: string) => void;
    onOpenJournal: () => void;
  }) {
    this.store = new StarterConciergeStore(userId);
    this.root = document.createElement('aside');
    this.root.className = 'hv-starter-concierge';
    this.root.setAttribute('aria-label', '새 이웃 한 걸음 안내');
    document.body.appendChild(this.root);
    this.render();
  }

  refresh(): void { this.render(); }

  private render(): void {
    const routes = starterCompassRouteViews(this.opts.getQuestState());
    const concierge = starterCompassConciergeView(routes, this.opts.getSelectedRouteId());
    const presentation = starterConciergePresentation(concierge);
    const state = this.store.get();
    const completedRoutes = routes.filter((route) => route.complete).length;
    const compact = state.collapsed || (!state.opened && completedRoutes > 0);
    const route = concierge.route;
    const next = concierge.next;
    const suggested = concierge.suggestedRoute;
    this.root.className = `hv-starter-concierge ${compact ? 'is-compact' : ''} stage-${concierge.stage}`;
    this.root.style.setProperty('--concierge-color', route?.color ?? '#a47a61');
    this.root.innerHTML = compact
      ? `<button class="concierge-expand"><i>${route?.mark ?? '길'}</i><span><small>새 이웃 안내</small><b>${escapeHtml(next?.label ?? presentation.title)}</b></span><strong>${route ? `${Math.min(route.completed, route.required)}/${route.required}` : '열기'}</strong></button>`
      : `<section>
        <header><div><small>${presentation.code}</small><h2>${escapeHtml(presentation.title)}</h2></div><button class="concierge-collapse" aria-label="안내 접기">−</button></header>
        <canvas width="${STARTER_CONCIERGE_ART_W}" height="${STARTER_CONCIERGE_ART_H}" aria-label="현재 첫 생활 방향의 2.5D 픽셀 안내소"></canvas>
        <div class="concierge-status"><i>${route?.mark ?? '길'}</i><span><small>${escapeHtml(presentation.status)}</small><b>${escapeHtml(next?.label ?? route?.reward ?? '새 이웃의 여섯 방향')}</b><em>${escapeHtml(next?.location ?? route?.description ?? '마음 가는 방향부터 천천히')}</em></span></div>
        <p>${escapeHtml(presentation.body)}</p>
        <div class="concierge-routes">${STARTER_COMPASS_ROUTES.map((entry) => {
          const view = routes.find((item) => item.id === entry.id)!;
          const selected = route?.id === entry.id;
          return `<button data-concierge-route="${entry.id}" class="${selected ? 'is-selected' : ''} ${view.complete ? 'is-complete' : ''}" title="${escapeHtml(entry.title)}"><i>${entry.mark}</i><span>${entry.title}</span><b>${view.complete ? '✓' : view.completed}</b></button>`;
        }).join('')}</div>
        <footer class="${concierge.stage === 'all-complete' ? 'is-complete' : ''}">
          ${concierge.stage === 'all-complete'
            ? '<button class="concierge-journal primary">여섯 멘토 성장 이야기 보기</button>'
            : `<button class="concierge-journal">큰 안내책 보기</button>${next
              ? `<button class="concierge-guide" data-concierge-key="${next.key}" data-concierge-route-id="${route!.id}">${escapeHtml(presentation.action)}</button>`
              : suggested
                ? `<button class="concierge-next-route" data-concierge-route="${suggested.id}">${escapeHtml(presentation.action)}</button>`
                : ''}`}
        </footer>
      </section>`;
    if (!compact) {
      const canvas = this.root.querySelector('canvas');
      if (canvas) paintStarterConciergeArt(canvas, route, concierge.stage, routes);
    }
    this.bind();
  }

  private bind(): void {
    this.root.querySelector('.concierge-expand')?.addEventListener('click', () => {
      this.store.setCollapsed(false); this.render();
    });
    this.root.querySelector('.concierge-collapse')?.addEventListener('click', () => {
      this.store.setCollapsed(true); this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-concierge-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const routeId = button.dataset.conciergeRoute as StarterCompassRouteId;
        this.opts.onSelectRoute(routeId);
        this.render();
      });
    });
    this.root.querySelector('.concierge-next-route')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      this.opts.onSelectRoute(button.dataset.conciergeRoute as StarterCompassRouteId);
      this.render();
    });
    this.root.querySelector('.concierge-guide')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const key = button.dataset.conciergeKey;
      const routeId = button.dataset.conciergeRouteId as StarterCompassRouteId;
      const route = STARTER_COMPASS_ROUTES.find((item) => item.id === routeId);
      const requirement = route?.requirements.find((item) => item.key === key);
      if (!key || !route || !requirement) return;
      this.opts.onSelectRoute(routeId);
      this.store.recordGuide(key, routeId);
      this.opts.onNavigate(key, requirement.label);
      this.store.setCollapsed(true);
      this.render();
    });
    this.root.querySelectorAll('.concierge-journal').forEach((button) => button.addEventListener('click', () => {
      this.store.setCollapsed(true);
      this.render();
      this.opts.onOpenJournal();
    }));
  }

  destroy(): void { this.root.remove(); }
}
