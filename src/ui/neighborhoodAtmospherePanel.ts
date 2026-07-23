import {
  NEIGHBORHOOD_ATMOSPHERE_ART_H,
  NEIGHBORHOOD_ATMOSPHERE_ART_W,
  paintNeighborhoodAtmosphere,
} from '../game/art/neighborhoodAtmosphereArt';
import type { QuestState } from '../game/questProgress';
import {
  NEIGHBORHOOD_ATMOSPHERE_BY_ID,
  NEIGHBORHOOD_ATMOSPHERES,
  NeighborhoodAtmosphereStore,
  type NeighborhoodAtmosphereId,
  type NeighborhoodAtmosphereProgress,
  type NeighborhoodAtmosphereRequirementView,
} from '../game/world/neighborhoodAtmospheres';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

interface NeighborhoodAtmospherePanelOptions {
  onToggle: (open: boolean) => void;
  getQuestState: () => QuestState;
  onChanged?: (progress: NeighborhoodAtmosphereProgress) => void;
  onReplay?: (id: NeighborhoodAtmosphereId) => void;
  onNavigate?: (requirement: NeighborhoodAtmosphereRequirementView) => void;
}

/** 생활 기록으로 영구 해금한 빛·비·눈을 자유롭게 재생하는 아이소메트릭 골목 관측소. */
export class NeighborhoodAtmospherePanel {
  private readonly root = document.createElement('div');
  private opened = false;
  private selectedId: NeighborhoodAtmosphereId;
  private feedback = '';

  constructor(
    private readonly store: NeighborhoodAtmosphereStore,
    private readonly opts: NeighborhoodAtmospherePanelOptions,
  ) {
    this.selectedId = store.get().activeId;
    this.root.className = 'hv-neighborhood-atmosphere';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(preferred?: NeighborhoodAtmosphereId): void {
    if (preferred && NEIGHBORHOOD_ATMOSPHERE_BY_ID.has(preferred)) this.selectedId = preferred;
    else this.selectedId = this.store.get().activeId;
    if (!this.opened) {
      this.opened = true;
      this.store.visit();
      this.root.style.display = 'flex';
      this.opts.onToggle(true);
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()));
    }
    this.feedback = '';
    this.render();
  }

  refresh(): void { if (this.opened) this.render(); }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.close(); this.root.remove(); }

  private render(): void {
    const quests = this.opts.getQuestState();
    const views = this.store.views(quests);
    const progress = this.store.progress(quests);
    const selected = views.find((view) => view.id === this.selectedId) ?? views[0]!;
    const selectedRecordLabel = selected.requirements.length
      ? `${selected.completedRequirements}/${selected.requirements.length} 기록`
      : '기본 하늘';
    const featured = this.store.get().featuredIds;
    const list = views.map((view, index) => {
      const state = view.active ? '현재 골목' : view.observed ? '관측 완료' : view.ready ? '기록 준비' : `${view.completedRequirements}/${view.requirements.length || 1} 조건`;
      return `<button data-atmosphere="${view.id}" class="${view.id === selected.id ? 'selected' : ''} ${view.observed ? 'observed' : 'locked'} ${view.ready ? 'ready' : ''}" style="--sky:${view.palette[2]};--sky-deep:${view.palette[0]};--sky-index:${index}">
        <canvas width="${NEIGHBORHOOD_ATMOSPHERE_ART_W}" height="${NEIGHBORHOOD_ATMOSPHERE_ART_H}" data-atmosphere-card="${view.id}" aria-label="${escapeHtml(view.observed ? view.name : '아직 기록하지 않은 골목 분위기')} 픽셀 장면"></canvas>
        <span><small>${escapeHtml(view.code)}</small><b>${escapeHtml(view.observed || view.ready ? view.name : '아직 모르는 하늘')}</b><em>${state}</em></span>
        <i>${view.active ? 'ON' : view.ready ? 'NEW' : view.observed ? view.mark : '?'}</i>
      </button>`;
    }).join('');
    const requirementRows = selected.requirements.length
      ? selected.requirements.map((requirement) => `<li class="${requirement.complete ? 'complete' : ''}">
          <i>${requirement.complete ? '완' : '중'}</i><span><b>${escapeHtml(requirement.label)}</b><small>${escapeHtml(requirement.location)} · ${requirement.current}/${requirement.goal}</small><em><i style="width:${requirement.progressPct}%"></i></em></span>
          ${requirement.complete ? '<strong>기록됨</strong>' : `<button data-atmosphere-route="${escapeHtml(requirement.key)}">길 안내</button>`}
        </li>`).join('')
      : '<li class="complete"><i>첫</i><span><b>누구나 바로 관측 가능</b><small>첫 햇살은 시작부터 열려 있어요.</small><em><i style="width:100%"></i></em></span><strong>기록됨</strong></li>';
    const activities = selected.recommendedActivities.map((activity) => `<span>${escapeHtml(activity)}</span>`).join('');
    const featuredCards = featured.map((id, index) => {
      const atmosphere = NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(id)!;
      return `<button data-atmosphere-featured="${id}" style="--sky:${atmosphere.palette[2]}"><i>${index + 1}</i><span><small>${escapeHtml(atmosphere.code)}</small><b>${escapeHtml(atmosphere.name)}</b></span></button>`;
    }).join('');

    const actions = selected.observed
      ? `<button data-atmosphere-activate="${selected.id}" ${selected.active ? 'disabled' : ''}>${selected.active ? '✓ 현재 골목에 적용 중' : '이 분위기를 골목에 적용'}</button>
        <button data-atmosphere-replay="${selected.id}">연출 다시 보기 · ${this.store.get().replayCount}회</button>
        <button data-atmosphere-feature="${selected.id}" class="${selected.featured ? 'featured' : ''}">${selected.featured ? '★ 대표 하늘에서 내리기' : '☆ 대표 하늘로 간직하기'}</button>`
      : selected.ready
        ? `<button data-atmosphere-observe="${selected.id}" class="primary">생활 기록으로 이 하늘 관측하기</button>`
        : '<button disabled>두 생활 기록이 만나면 자동으로 준비돼요</button>';

    this.root.innerHTML = `<section class="atmosphere-observatory" style="--sky:${selected.palette[2]};--sky-deep:${selected.palette[0]};--sky-mid:${selected.palette[1]};--sky-light:${selected.palette[3]}">
      <header class="atmosphere-header"><div><small>REPLAYABLE ISOMETRIC WEATHER · NO FOMO</small><h1>골목 분위기 관측소</h1><p>살아온 기록으로 빛·비·눈을 발견하고, 원하는 하늘을 언제든 마을 위에 다시 펼쳐요.</p></div>
        <aside><span><b>${progress.observed}</b>/${progress.total}<small>관측 장면</small></span><span><b>${progress.ready}</b><small>기록 준비</small></span><span><b>${progress.featured}</b>/${progress.featuredMax}<small>대표 하늘</small></span><span><b>${progress.effects}</b><small>월드 효과</small></span></aside>
        <button class="atmosphere-close" aria-label="닫기">×</button></header>
      <div class="atmosphere-layout">
        <nav class="atmosphere-rail"><header><small>EIGHT PERMANENT SKIES</small><b>다시 부를 수 있는 여덟 날씨</b></header>${list}</nav>
        <main class="atmosphere-stage">
          <section class="atmosphere-preview">
            <canvas width="${NEIGHBORHOOD_ATMOSPHERE_ART_W}" height="${NEIGHBORHOOD_ATMOSPHERE_ART_H}" data-atmosphere-preview="${selected.id}" aria-label="${escapeHtml(selected.observed ? selected.name : '아직 기록하지 않은 골목 분위기')} 상세 픽셀 장면"></canvas>
            <div><small>${escapeHtml(selected.code)} · ${selected.observed ? 'PERMANENTLY OBSERVED' : selected.ready ? 'READY TO OBSERVE' : 'LIFE RECORDS IN PROGRESS'}</small>
              <h2>${escapeHtml(selected.observed || selected.ready ? selected.name : '아직 이름 붙이지 않은 하늘')}</h2><p>${escapeHtml(selected.subtitle)}</p>
              <blockquote>“${escapeHtml(selected.observed || selected.ready ? selected.memory : '두 가지 생활이 만나는 날, 이곳에 새로운 골목 문장이 기록됩니다.')}”</blockquote>
            </div>
          </section>
          <section class="atmosphere-records"><header><div><small>TWO WAYS TO THE SAME SKY</small><h3>${escapeHtml(selected.description)}</h3></div><span>${selectedRecordLabel}</span></header><ol>${requirementRows}</ol></section>
          <section class="atmosphere-ideas"><header><small>THIS SKY GOES WELL WITH</small><b>이 분위기에서 해 보고 싶은 생활</b></header><div>${activities}</div><p>추천일 뿐 보너스나 손해는 없어요. 날씨를 바꿔도 정원·낚시·전투 확률과 경제는 그대로입니다.</p></section>
        </main>
        <aside class="atmosphere-actions">
          <section><small>WORLD LIGHT CONTROL</small><h2>${escapeHtml(selected.mark)} ${escapeHtml(selected.observed ? selected.name : '관측 준비 중')}</h2><p>${escapeHtml(selected.observed ? `영구 기념품 · ${selected.keepsake}` : '조건을 채워도 재료나 기록은 소비되지 않아요.')}</p><div>${actions}</div></section>
          <section class="atmosphere-featured"><header><small>MY THREE FAVORITE SKIES</small><h3>대표 하늘 세 장</h3><span>${featured.length}/3</span></header><div>${featuredCards || '<p>마음에 남은 하늘을 세 장까지 간직할 수 있어요.</p>'}</div></section>
        </aside>
      </div>
      <footer><p aria-live="polite">${escapeHtml(this.feedback || (selected.ready ? '두 생활 기록이 모두 모였어요. 관측하면 바로 현재 골목 분위기로 펼쳐집니다.' : selected.observed ? '언제든 적용·재생·대표 전시를 바꿀 수 있어요.' : '미완성 기록의 길 안내부터 천천히 따라가도 충분해요.'))}</p><span>기간 한정 없음 · 출석 강제 없음 · 능력치 변화 없음 · 기존 기록 소급</span></footer>
    </section>`;
    this.paint();
    this.bind(selected.requirements);
  }

  private paint(): void {
    const state = this.store.get();
    const observed = new Set(state.observedIds);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-atmosphere-card]').forEach((canvas) => {
      const id = canvas.dataset.atmosphereCard as NeighborhoodAtmosphereId;
      paintNeighborhoodAtmosphere(canvas, id, observed.has(id), state.activeId === id);
    });
    const preview = this.root.querySelector<HTMLCanvasElement>('[data-atmosphere-preview]');
    if (preview) {
      const id = preview.dataset.atmospherePreview as NeighborhoodAtmosphereId;
      paintNeighborhoodAtmosphere(preview, id, observed.has(id), state.activeId === id);
    }
  }

  private bind(requirements: readonly NeighborhoodAtmosphereRequirementView[]): void {
    this.root.querySelector<HTMLButtonElement>('.atmosphere-close')?.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-atmosphere]').forEach((button) => button.addEventListener('click', () => {
      this.selectedId = button.dataset.atmosphere as NeighborhoodAtmosphereId;
      this.feedback = '';
      this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-atmosphere-observe]')?.addEventListener('click', (event) => {
      const result = this.store.observe((event.currentTarget as HTMLButtonElement).dataset.atmosphereObserve!, this.opts.getQuestState());
      if (result.ok) {
        this.feedback = result.first
          ? `「${result.atmosphere.name}」을(를) 영구 관측하고 현재 골목에 펼쳤어요.`
          : '이미 안전하게 보존한 분위기예요.';
        this.changed(true);
      } else {
        this.feedback = '아직 두 생활 기록이 모두 모이지 않았어요. 준비된 길 안내부터 이어가 주세요.';
        this.render();
      }
    });
    this.root.querySelector<HTMLButtonElement>('[data-atmosphere-activate]')?.addEventListener('click', (event) => {
      const result = this.store.activate((event.currentTarget as HTMLButtonElement).dataset.atmosphereActivate!);
      this.feedback = result === 'activated'
        ? '골목의 빛과 날씨를 바꿨어요. 게임 규칙과 획득 확률은 그대로입니다.'
        : '이미 이 분위기가 골목 위에 펼쳐져 있어요.';
      this.changed(true);
    });
    this.root.querySelector<HTMLButtonElement>('[data-atmosphere-replay]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.atmosphereReplay as NeighborhoodAtmosphereId;
      this.store.replay();
      this.feedback = '화면 가장자리부터 분위기 연출을 다시 펼쳤어요.';
      this.opts.onReplay?.(id);
      this.changed(false);
    });
    this.root.querySelector<HTMLButtonElement>('[data-atmosphere-feature]')?.addEventListener('click', (event) => {
      const result = this.store.toggleFeatured((event.currentTarget as HTMLButtonElement).dataset.atmosphereFeature!);
      this.feedback = result === 'added' ? '나를 설명하는 대표 하늘에 간직했어요.'
        : result === 'removed' ? '대표 전시에서만 내렸어요. 관측 기록과 재생 기능은 그대로예요.'
          : result === 'full' ? '대표 하늘은 세 장이에요. 한 장을 내려도 모든 관측 기록은 남아 있어요.'
            : '먼저 이 하늘을 관측해 주세요.';
      this.changed(false);
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-atmosphere-featured]').forEach((button) => button.addEventListener('click', () => {
      this.selectedId = button.dataset.atmosphereFeatured as NeighborhoodAtmosphereId;
      this.feedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-atmosphere-route]').forEach((button) => button.addEventListener('click', () => {
      const requirement = requirements.find((item) => item.key === button.dataset.atmosphereRoute);
      if (!requirement) return;
      this.close();
      this.opts.onNavigate?.(requirement);
    }));
  }

  private changed(applyWorld: boolean): void {
    const progress = this.store.progress(this.opts.getQuestState());
    this.opts.onChanged?.(progress);
    if (applyWorld) this.opts.onReplay?.(this.store.get().activeId);
    this.render();
  }
}
