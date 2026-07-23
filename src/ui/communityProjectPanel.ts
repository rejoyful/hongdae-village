import type { QuestState } from '../game/questProgress';
import {
  COMMUNITY_PROJECT_BY_ID, COMMUNITY_PROJECTS, CommunityProjectStore,
  type CommunityContributionView, type CommunityProjectClaimResult,
  type CommunityProjectId, type CommunityProjectProgress,
} from '../game/projects/communityProjects';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

/** 여러 생활 분야의 평생 기록을 소비 없이 공용 장소 변화로 바꾸는 마을 설계소. */
export class CommunityProjectPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedId: CommunityProjectId = 'shade';
  private feedback = '';

  constructor(
    private readonly store: CommunityProjectStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      getQuestState: () => QuestState;
      onChanged?: (progress: CommunityProjectProgress, result: CommunityProjectClaimResult) => void;
      onNavigate?: (contribution: CommunityContributionView) => void;
      onOpenShared?: () => void;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-community-projects';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(preferred?: CommunityProjectId): void {
    if (this.opened) return;
    if (preferred && COMMUNITY_PROJECT_BY_ID.has(preferred)) this.selectedId = preferred;
    else if (this.store.get().featuredProjectId) this.selectedId = this.store.get().featuredProjectId!;
    this.feedback = '';
    this.opened = true;
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

  destroy(): void { this.close(); this.root.remove(); }

  private render(): void {
    const quests = this.opts.getQuestState();
    const projects = this.store.views(quests);
    const progress = this.store.progress(quests);
    const selected = projects.find((project) => project.id === this.selectedId) ?? projects[0];
    if (!selected) {
      this.root.innerHTML = '<section class="project-empty"><b>설계 도면을 불러오지 못했어요.</b><p>잠시 뒤 다시 열어 주세요. 생활 기록은 그대로 보존됩니다.</p><button class="project-close">닫기</button></section>';
      this.root.querySelector<HTMLButtonElement>('.project-close')?.addEventListener('click', () => this.close());
      return;
    }

    const projectRail = projects.map((project, index) => {
      const status = project.status === 'complete' ? '완공' : project.status === 'building' ? '공사 중' : '설계 중';
      return `<button class="project-rail-item ${project.id === selected.id ? 'selected' : ''}" data-project="${project.id}" style="--project-index:${index}">
        <i>${escapeHtml(project.mark)}</i><span><small>${escapeHtml(project.code)} · ${escapeHtml(project.district)}</small><b>${escapeHtml(project.name)}</b><em>${status} · ${project.level}/4단계</em></span>
        ${project.featured ? '<strong>관심</strong>' : project.ready ? `<strong>${project.ready}단계 준비</strong>` : ''}
      </button>`;
    }).join('');

    const current = selected.nextPhase;
    const contributions = current?.contributions.map((item) => `<li class="${item.complete ? 'complete' : ''}">
      <div class="project-check">${item.complete ? '완' : '중'}</div><div><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.note)}</p><span>${escapeHtml(item.location)} · ${Math.min(item.current, item.goal)}/${item.goal}</span><em><i style="transform:scaleX(${item.progressPct / 100})"></i></em></div>
      ${item.complete ? '<strong>기여됨</strong>' : `<button data-project-guide="${escapeHtml(item.key)}">길 안내</button>`}
    </li>`).join('') ?? '';

    const currentPhase = current ? `<section class="project-current">
      <header><div><small>${escapeHtml(current.code)} · BUILD PHASE ${current.phase}</small><h2>${escapeHtml(current.name)}</h2><p>${escapeHtml(current.description)}</p></div><strong>${current.contributionsDone}<i>/4</i></strong></header>
      <ol>${contributions}</ol>
      <footer><div><small>다음 마을 변화</small><b>${escapeHtml(current.change)}</b></div><button class="project-claim" data-project-claim="${current.id}" ${current.ready ? '' : 'disabled'}>${current.ready ? '이 단계 완성하기' : '네 기여가 모이면 완성'}</button></footer>
    </section>` : `<section class="project-complete"><small>PERMANENT PLACE COMPLETE</small><h2>${escapeHtml(selected.name)} 완공</h2><p>${escapeHtml(selected.finalChange)}</p><strong>완공 뒤에도 모든 생활 기록은 계속 쌓입니다.</strong></section>`;

    const blueprint = selected.phases.map((item) => {
      const status = item.claimed ? 'built' : item.ready ? 'ready' : item.available ? 'active' : 'locked';
      const label = item.claimed ? '완성됨' : item.ready ? '완성 준비' : item.available ? `${item.contributionsDone}/4 기여` : '앞 단계 이후';
      return `<article class="project-phase is-${status}"><header><span>${String(item.phase).padStart(2, '0')}</span><i></i></header><div><small>${escapeHtml(item.code)}</small><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.change)}</p></div><strong>${label}</strong></article>`;
    }).join('');

    const builtStories = selected.phases.filter((item) => item.claimed).map((item) => `<article><small>${escapeHtml(item.code)}</small><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.story)}</p></article>`).join('');
    const defaultFeedback = selected.nextContribution
      ? `${selected.nextContribution.label}부터 이어가면 가장 가까워요. 이미 한 활동은 다시 할 필요가 없습니다.`
      : current ? '네 기여가 모두 모였어요. 준비된 마을 변화를 완성할 수 있습니다.'
        : '이 장소는 완공됐어요. 다른 설계도도 같은 속도로 계속 자라고 있습니다.';

    this.root.innerHTML = `<div class="project-shell">
      <header class="project-header"><div><small>HONGDAE COMMON WORKS</small><h1>골목 함께짓기</h1><p>내 기록을 잃지 않고, 여러 생활의 흔적을 모아 마을의 장소를 바꿉니다.</p><button class="project-shared-open"><i>LIVE</i> 서버 이웃과 모두의 밤정원 키우기</button></div><div class="project-header-art"><img src="assets/isometric/community_project_pavilion_v1.png" alt=""><button class="project-close" aria-label="닫기">닫기</button></div></header>
      <section class="project-overview"><span><small>완성 단계</small><b>${progress.phases}<i>/${progress.totalPhases}</i></b></span><span><small>완공 장소</small><b>${progress.completedProjects}<i>/${progress.totalProjects}</i></b></span><span><small>완성 준비</small><b>${progress.ready}<i>단계</i></b></span><span><small>생활 기여</small><b>${progress.contributionMarks}<i>/${progress.totalContributionMarks}</i></b></span></section>
      <main class="project-layout"><aside class="project-rail"><header><small>FIVE PERMANENT PLACES</small><b>서두르지 않는 다섯 설계도</b></header>${projectRail}</aside>
        <section class="project-workspace"><header class="project-selected"><div class="project-selected-mark">${escapeHtml(selected.mark)}</div><div><small>${escapeHtml(selected.code)} · ${escapeHtml(selected.steward)}</small><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.purpose)}</p></div><button data-project-feature="${selected.id}" class="${selected.featured ? 'featured' : ''}">${selected.featured ? '관심 설계도 고정됨' : '관심 설계도로 고정'}</button></header>
          <section class="project-blueprint"><header><small>FOUR-PHASE BLUEPRINT</small><b>${escapeHtml(selected.district)} · ${selected.level}/4단계</b></header><div>${blueprint}</div></section>
          ${currentPhase}
          <details class="project-log"><summary>완성된 변화 기록 ${selected.level}장 읽기</summary><div>${builtStories || '<p>첫 단계의 네 기여가 모이면 이곳에 장소의 이야기가 기록됩니다.</p>'}</div></details>
        </section></main>
      <footer class="project-footer"><p aria-live="polite">${escapeHtml(this.feedback || defaultFeedback)}</p><span>마감 없음 · 실패 없음 · 기록 소비 없음 · 모든 설계 동시 진행</span></footer>
    </div>`;
    this.bind(current?.contributions ?? []);
  }

  private bind(contributions: CommunityContributionView[]): void {
    this.root.querySelector<HTMLButtonElement>('.project-close')?.addEventListener('click', () => this.close());
    this.root.querySelector<HTMLButtonElement>('.project-shared-open')?.addEventListener('click', () => {
      this.close();
      this.opts.onOpenShared?.();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-project]')) button.addEventListener('click', () => {
      this.selectedId = button.dataset.project as CommunityProjectId;
      this.feedback = '';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-project-feature]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.projectFeature as CommunityProjectId;
      this.store.feature(id);
      this.feedback = this.store.get().featuredProjectId
        ? '관심 설계도로 고정했어요. 다른 네 장소의 진행도 멈추지 않습니다.'
        : '관심 고정을 풀었어요. 다섯 설계도는 계속 자랍니다.';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-project-claim]')?.addEventListener('click', (event) => {
      const result = this.store.claim((event.currentTarget as HTMLButtonElement).dataset.projectClaim!, this.opts.getQuestState());
      this.feedback = result.ok ? `「${result.phase.name}」 단계가 마을에 반영됐어요.` : '아직 이 단계에 필요한 생활 기여가 남아 있어요.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-project-guide]')) button.addEventListener('click', () => {
      const item = contributions.find((entry) => entry.key === button.dataset.projectGuide);
      if (!item) return;
      this.close();
      this.opts.onNavigate?.(item);
    });
  }
}
