import {
  ALLEY_SECRET_CHAPTERS,
  ALLEY_SECRETS,
  type AlleySecretChapterId,
  type AlleySecretProgress,
  type AlleySecretView,
  AlleySecretStore,
} from '../game/guidance/alleySecrets';
import {
  ALLEY_SECRET_ART_H,
  ALLEY_SECRET_ART_W,
  paintAlleySecretArt,
} from '../game/art/alleySecretArt';

interface AlleySecretPanelOptions {
  onToggle: (open: boolean) => void;
  onNavigate: (secretId: string) => void;
  onChanged: (progress: AlleySecretProgress) => void;
}

/** 월드 환경 단서 12개를 네 편의 짧은 골목 서사로 묶는 영구 기록책. */
export class AlleySecretPanel {
  private readonly root = document.createElement('div');
  private opened = false;
  private selectedChapterId: AlleySecretChapterId = ALLEY_SECRET_CHAPTERS[0]!.id;
  private selectedSecretId: string | null = null;
  private feedback = '';

  constructor(
    private readonly store: AlleySecretStore,
    private readonly opts: AlleySecretPanelOptions,
  ) {
    this.root.className = 'hv-wood-modal hv-alley-secrets';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(secretId?: string): void {
    const focus = secretId ? this.store.views().find((secret) => secret.id === secretId) : null;
    if (focus) {
      this.selectedChapterId = focus.chapterId;
      this.selectedSecretId = focus.id;
    } else {
      const chapters = this.store.chapters();
      const preferred = chapters.find((chapter) => chapter.featured)
        ?? chapters.find((chapter) => !chapter.complete)
        ?? chapters[0];
      this.selectedChapterId = preferred?.id ?? ALLEY_SECRET_CHAPTERS[0]!.id;
      this.selectedSecretId = preferred?.secrets.find((secret) => secret.discovered)?.id
        ?? preferred?.next?.id ?? null;
    }
    this.feedback = '';
    if (!this.opened) {
      this.opened = true;
      this.root.style.display = 'flex';
      this.opts.onToggle(true);
    }
    this.render();
  }

  refresh(secretId?: string): void {
    if (this.opened) this.open(secretId ?? this.selectedSecretId ?? undefined);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private render(): void {
    const chapters = this.store.chapters();
    const progress = this.store.progress();
    const chapter = chapters.find((entry) => entry.id === this.selectedChapterId) ?? chapters[0]!;
    const selected = chapter.secrets.find((secret) => secret.id === this.selectedSecretId)
      ?? chapter.secrets.find((secret) => secret.discovered)
      ?? chapter.next
      ?? chapter.secrets[0]!;
    this.selectedSecretId = selected.id;

    this.root.innerHTML = `<div class="wood-frame alley-secret-frame" style="--secret-color:${chapter.color}">
      <div class="wood-head">
        <h2>골목 비밀 기록</h2>
        <span class="pill">환경 단서 ${progress.discovered}/${progress.total}</span>
        <span class="pill">완결 ${progress.completedChapters}/${progress.totalChapters}</span>
        <span class="pill">${progress.featured ? '최애 이야기 전시 중' : '최애 이야기 미선택'}</span>
      </div>
      <div class="wood-page alley-secret-page">
        <nav class="alley-secret-index" aria-label="골목 비밀 이야기">
          ${chapters.map((entry) => `<button data-secret-chapter="${entry.id}" class="${entry.id === chapter.id ? 'selected' : ''} ${entry.complete ? 'complete' : ''}" style="--chapter-color:${entry.color}">
            <i>${entry.mark}</i><span><small>${escapeHtml(entry.code)}</small><b>${escapeHtml(entry.title)}</b><em>${entry.discovered}/3${entry.featured ? ' · 최애' : ''}</em></span>
          </button>`).join('')}
        </nav>
        <section class="alley-secret-reader">
          <header>
            <div><small>${escapeHtml(chapter.code)}</small><h3>${escapeHtml(chapter.title)}</h3><p>${escapeHtml(chapter.subtitle)}</p></div>
            <strong>${chapter.discovered}<i>/3</i></strong>
          </header>
          <div class="alley-secret-feature ${selected.discovered ? 'is-found' : 'is-hidden'}">
            <canvas width="${ALLEY_SECRET_ART_W}" height="${ALLEY_SECRET_ART_H}" data-secret-art aria-label="${selected.discovered ? escapeHtml(selected.title) : '아직 발견하지 않은 골목 단서'} 픽셀 삽화"></canvas>
            <article>
              <small>${selected.discovered ? `DISCOVERED · CLUE ${selected.sequence}` : `UNREAD CLUE · ${selected.sequence}/3`}</small>
              <h4>${selected.discovered ? escapeHtml(selected.title) : '아직 이름 없는 단서'}</h4>
              <p>${escapeHtml(selected.discovered ? selected.memory : selected.teaser)}</p>
              <span>${escapeHtml(selected.location)}</span>
              ${selected.discovered
                ? '<b>영구 기록됨 · 다시 찾아가도 사라지지 않아요</b>'
                : `<button data-secret-route="${selected.id}">이 단서 길 안내</button>`}
            </article>
          </div>
          <ol class="alley-secret-clues">
            ${chapter.secrets.map((secret) => `<li class="${secret.discovered ? 'found' : 'hidden'} ${secret.id === selected.id ? 'selected' : ''}">
              <button data-secret-focus="${secret.id}">
                <i>${secret.discovered ? secret.mark : '?'}</i>
                <span><small>CLUE ${secret.sequence}</small><b>${secret.discovered ? escapeHtml(secret.title) : '아직 발견하지 않은 흔적'}</b><em>${escapeHtml(secret.discovered ? secret.memory : secret.location)}</em></span>
                <strong>${secret.discovered ? '기록' : '찾기'}</strong>
              </button>
            </li>`).join('')}
          </ol>
          <footer>
            <p>${chapter.complete ? escapeHtml(chapter.epilogue) : '세 단서는 순서 없이 찾을 수 있어요. 다른 생활을 먼저 해도 흔적과 진행은 사라지지 않습니다.'}</p>
            ${chapter.complete
              ? `<button data-secret-feature="${chapter.id}" class="${chapter.featured ? 'featured' : ''}">${chapter.featured ? '★ 최애 이야기에서 내리기' : '☆ 최애 이야기로 전시'}</button>`
              : chapter.next ? `<button data-secret-route="${chapter.next.id}">다음 단서 길 안내</button>` : ''}
          </footer>
          ${this.feedback ? `<p class="alley-secret-feedback" role="status">${escapeHtml(this.feedback)}</p>` : ''}
        </section>
      </div>
      <p class="alley-secret-safe">기간 한정 없음 · 전투 강제 없음 · 순서 자유 · 발견 기록 영구 보존</p>
      <button class="wood-close">닫기</button>
    </div>`;
    this.paint(selected, chapter.complete);
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-secret-chapter]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedChapterId = button.dataset.secretChapter as AlleySecretChapterId;
        const nextChapter = this.store.chapters().find((entry) => entry.id === this.selectedChapterId);
        this.selectedSecretId = nextChapter?.secrets.find((secret) => secret.discovered)?.id
          ?? nextChapter?.next?.id ?? null;
        this.feedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-secret-focus]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedSecretId = button.dataset.secretFocus ?? null;
        this.feedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-secret-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const secretId = button.dataset.secretRoute;
        if (!secretId || !ALLEY_SECRETS.some((secret) => secret.id === secretId)) return;
        this.close();
        this.opts.onNavigate(secretId);
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-secret-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.store.feature(button.dataset.secretFeature as AlleySecretChapterId);
        this.feedback = result === 'featured'
          ? `「${chapter.title}」을(를) 골목 여권의 최애 비밀 이야기로 전시했어요.`
          : result === 'cleared' ? '최애 이야기 전시를 내렸어요. 발견 기록은 그대로 남습니다.'
            : '세 단서를 모두 발견하면 최애 이야기로 전시할 수 있어요.';
        this.opts.onChanged(this.store.progress());
        this.render();
      });
    });
  }

  private paint(secret: AlleySecretView, chapterComplete: boolean): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-secret-art]');
    const context = canvas?.getContext('2d');
    if (context) paintAlleySecretArt(context, secret, secret.discovered, chapterComplete);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!
  ));
}
