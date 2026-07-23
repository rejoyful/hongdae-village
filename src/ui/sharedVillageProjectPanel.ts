import {
  SHARED_PROJECT_CONTRIBUTIONS, type SharedProjectContributionKind,
  type SharedProjectContributeResult, type SharedProjectView,
} from '../game/projects/sharedVillageProject';
import { paintSharedContributionBadge, paintSharedVillageHero } from '../game/art/sharedVillageProjectArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export class SharedVillageProjectPanel {
  private readonly root = document.createElement('div');
  private opened = false;
  private loading = false;
  private contributing = false;
  private view: SharedProjectView;
  private feedback = '';

  constructor(
    initial: SharedProjectView,
    private readonly opts: {
      online: boolean;
      onToggle: (open: boolean) => void;
      onLoad: () => Promise<SharedProjectView>;
      onContribute: (kind: SharedProjectContributionKind) => Promise<SharedProjectContributeResult>;
      onChanged?: (view: SharedProjectView) => void;
    },
  ) {
    this.view = initial;
    this.root.className = 'hv-shared-project';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.feedback = '';
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    void this.load();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  update(view: SharedProjectView): void {
    this.view = view;
    if (this.opened) this.render();
  }

  destroy(): void { this.close(); this.root.remove(); }

  private async load(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.render();
    try {
      this.view = await this.opts.onLoad();
      this.opts.onChanged?.(this.view);
    } finally {
      this.loading = false;
      if (this.opened) this.render();
    }
  }

  private render(): void {
    const v = this.view;
    const progress = Math.min(100, Math.round(v.chapterProgress / v.chapterGoal * 100));
    const cards = SHARED_PROJECT_CONTRIBUTIONS.map((item) => {
      const collected = v.member.kindIds.includes(item.id);
      return `<button class="shared-project-card ${collected ? 'collected' : ''}" data-shared-kind="${item.id}"
        ${!this.opts.online || !v.canContribute || this.contributing ? 'disabled' : ''}>
        <canvas width="72" height="56" data-shared-art="${item.id}" aria-hidden="true"></canvas>
        <span><small>${escapeHtml(item.mark)} · ${v.global.kindCounts[item.id]}장 모임</small><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.note)}</p></span>
        <strong>${collected ? '내 도감에 있음' : '이 마음 남기기'}</strong>
      </button>`;
    }).join('');
    const stateText = !this.opts.online
      ? '온라인 연결 뒤 하루 한 장을 남길 수 있어요. 지금은 마지막 공동 풍경을 보고 있습니다.'
      : !v.canContribute ? '오늘의 한 장은 이미 도착했어요. 내일 다른 마음으로 다시 만나요.'
        : '오늘 이웃에게 건넬 마음 하나를 골라 주세요.';
    this.root.innerHTML = `<section class="shared-project-shell">
      <header class="shared-project-header">
        <div><small>LIVE · ONE VILLAGE, NO RANKING</small><h1>모두의 밤정원</h1><p>서버의 모든 이웃이 하루 한 장씩, 마감 없이 같은 정원을 키웁니다.</p></div>
        <button class="shared-project-close" aria-label="닫기">닫기</button>
      </header>
      <main>
        <section class="shared-project-hero">
          <canvas width="320" height="176" data-shared-hero aria-label="${escapeHtml(v.stageName)} 단계의 아이소메트릭 밤정원"></canvas>
          <div class="shared-project-chapter"><small>공동 기록 CHAPTER ${String(v.chapter).padStart(2, '0')}</small><h2>${escapeHtml(v.stageName)}</h2>
            <div><i style="width:${progress}%"></i></div><p><b>${v.chapterProgress}</b> / ${v.chapterGoal}장 · 완성된 밤 ${v.completedChapters}장</p></div>
        </section>
        <section class="shared-project-personal">
          <span><small>내가 건넨 마음</small><b>${v.member.total}<i>장</i></b></span>
          <span><small>마음 도감</small><b>${v.member.kindIds.length}<i>/8</i></b></span>
          <span><small>함께한 밤</small><b>${v.member.chapterIds.length}<i>장</i></b></span>
          <p>${escapeHtml(this.feedback || stateText)}</p>
        </section>
        <section class="shared-project-picker"><header><div><small>EIGHT SAFE CONTRIBUTIONS</small><h2>오늘 건넬 한 장</h2></div><span>한 장이면 충분 · 순위 없음 · 재화 소모 없음</span></header><div>${cards}</div></section>
      </main>
      <footer><p>늦게 와도 빈자리가 있습니다. 한 밤이 완성되면 다음 밤의 빈 광장이 조용히 열립니다.</p>
        <button class="shared-project-refresh" ${this.loading ? 'disabled' : ''}>${this.loading ? '공동 풍경 불러오는 중…' : '공동 풍경 새로고침'}</button></footer>
    </section>`;
    const hero = this.root.querySelector<HTMLCanvasElement>('[data-shared-hero]');
    if (hero) paintSharedVillageHero(hero, v);
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('[data-shared-art]')) {
      paintSharedContributionBadge(canvas, canvas.dataset.sharedArt as SharedProjectContributionKind);
    }
    this.bind();
  }

  private bind(): void {
    this.root.querySelector<HTMLButtonElement>('.shared-project-close')?.addEventListener('click', () => this.close());
    this.root.querySelector<HTMLButtonElement>('.shared-project-refresh')?.addEventListener('click', () => void this.load());
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-shared-kind]')) button.addEventListener('click', () => {
      void this.contribute(button.dataset.sharedKind as SharedProjectContributionKind);
    });
  }

  private async contribute(kind: SharedProjectContributionKind): Promise<void> {
    if (this.contributing || !this.opts.online || !this.view.canContribute) return;
    this.contributing = true;
    this.feedback = '이웃의 정원에 한 장을 건네는 중이에요…';
    this.render();
    try {
      const result = await this.opts.onContribute(kind);
      this.view = result.view;
      this.feedback = result.ok
        ? '오늘의 마음이 공동 정원에 도착했어요. 다른 선택도 더 좋거나 나쁘지 않습니다.'
        : result.reason === 'today' ? '오늘의 한 장은 이미 잘 도착해 있어요.' : '지금은 마음을 건네지 못했어요. 잠시 뒤 다시 열어 주세요.';
      this.opts.onChanged?.(this.view);
    } finally {
      this.contributing = false;
      if (this.opened) this.render();
    }
  }
}
