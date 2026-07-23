import {
  HOME_STUDIO_FEATURED_MAX, HOME_STUDIO_MOODS, HOME_STUDIO_SLOT_MAX,
  HOME_STUDIO_MOOD_BY_ID, HomeStudioCardStore, makeHomeStudioCard,
  type HomeStudioCardContext, type HomeStudioCardProgress, type HomeStudioMoodId,
} from '../game/home/homeStudioCards';
import {
  HOME_STUDIO_CARD_H, HOME_STUDIO_CARD_W, paintHomeStudioCard,
} from '../game/art/homeStudioCardArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class HomeStudioCardPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedSlot = 0;
  private selectedMood: HomeStudioMoodId = 'everyday';
  private feedback = '';
  private pending: { kind: 'overwrite' | 'remove'; slot: number } | null = null;

  constructor(private readonly store: HomeStudioCardStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getContext: () => HomeStudioCardContext;
    onChanged: (progress: HomeStudioCardProgress) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-home-studio';
    this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '홈 스튜디오 엽서');
    document.body.appendChild(this.root);
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.feedback = '';
    this.pending = null;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.home-studio-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(): void { if (this.opened) this.render(); }

  private render(): void {
    const state = this.store.get();
    const progress = this.store.progress();
    const context = this.opts.getContext();
    const selectedSaved = state.slots[this.selectedSlot];
    const preview = makeHomeStudioCard(context, this.selectedMood);
    const mood = HOME_STUDIO_MOOD_BY_ID.get(this.selectedMood)!;
    const slotCards = Array.from({ length: HOME_STUDIO_SLOT_MAX }, (_, slot) => {
      const card = state.slots[slot];
      const cardMood = card ? HOME_STUDIO_MOOD_BY_ID.get(card.moodId)! : null;
      const featured = state.featuredSlots.includes(slot);
      return `<article class="${card ? 'is-saved' : 'is-empty'} ${featured ? 'is-featured' : ''} ${slot === this.selectedSlot ? 'is-selected' : ''}" style="--studio-color:${cardMood?.palette[2] ?? '#85766b'}">
        ${card ? `<canvas width="${HOME_STUDIO_CARD_W}" height="${HOME_STUDIO_CARD_H}" data-home-studio-card="${slot}" aria-label="${escapeHtml(cardMood!.title)} 저장 엽서"></canvas>` : '<div class="home-studio-empty-art"><i>+</i><span>EMPTY SCENE</span></div>'}
        <section><header><span><small>SLOT ${slot + 1}</small><b>${cardMood ? escapeHtml(cardMood.title) : '비어 있는 엽서칸'}</b></span><em>${featured ? '★ 공개 중' : card ? `${card.placements.length}개 물건` : '새 장면 저장'}</em></header>
          <p>${card ? `${escapeHtml(card.themeName)} · 홈 ${card.score} · ${card.pet ? '동행과 함께' : '나만의 장면'}` : '현재 캐릭터와 방을 이 슬롯에 독립 스냅샷으로 남길 수 있어요.'}</p>
          <footer><button data-home-studio-slot="${slot}">${slot === this.selectedSlot ? '선택됨' : card ? '이 엽서 보기' : '이 칸 선택'}</button>
          ${card ? `<button data-home-studio-feature="${slot}" class="${featured ? 'is-featured' : ''}">${featured ? '★ 대표 해제' : '☆ 대표 공개'}</button>` : ''}</footer>
        </section>
      </article>`;
    }).join('');
    this.root.innerHTML = `<section class="home-studio-book">
      <header><div><small>MY CHARACTER · COMPANION · ACTUAL ROOM</small><h1>홈 스튜디오 엽서</h1><p>지금의 캐릭터, 동행, 실제 가구 배치를 한 장에 얼려 둡니다. 방과 코디를 바꿔도 저장한 엽서는 변하지 않아요.</p></div>
        <aside><span><b>${progress.savedCards}</b>/${progress.totalSlots} 엽서</span><span><b>${progress.moods}</b>/6 연출</span><span><b>${progress.featuredCards}</b>/${HOME_STUDIO_FEATURED_MAX} 공개</span></aside>
        <button class="home-studio-close" aria-label="닫기">×</button></header>
      <div class="home-studio-layout">
        <aside class="home-studio-moods"><header><small>SIX DIRECTIONS</small><h2>오늘의 연출</h2></header>
          ${HOME_STUDIO_MOODS.map((entry) => `<button data-home-studio-mood="${entry.id}" class="${entry.id === this.selectedMood ? 'sel' : ''}" style="--studio-color:${entry.palette[2]};--studio-deep:${entry.palette[1]}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.title}</b><em>${entry.subtitle}</em></span></button>`).join('')}
        </aside>
        <main class="home-studio-preview" style="--studio-color:${mood.palette[2]};--studio-deep:${mood.palette[0]}">
          <header><div><small>LIVE DIORAMA PREVIEW</small><h2>${escapeHtml(mood.title)}</h2><p>${escapeHtml(mood.note)}</p></div><strong>${context.placed.length}<small>현재 가구</small></strong></header>
          <canvas width="${HOME_STUDIO_CARD_W}" height="${HOME_STUDIO_CARD_H}" data-home-studio-preview aria-label="${escapeHtml(mood.title)} 현재 방 미리보기"></canvas>
          <section><span><small>저장할 장면</small><b>슬롯 ${this.selectedSlot + 1} · ${selectedSaved ? '기존 엽서 있음' : '빈 엽서칸'}</b></span><span><small>현재 구성</small><b>${escapeHtml(context.analysis.theme.name)} · 홈 ${context.analysis.score} · ${context.pet ? '동행 포함' : '캐릭터 단독'}</b></span></section>
          ${this.feedback ? `<p role="status">${escapeHtml(this.feedback)}</p>` : ''}
          <footer><button data-home-studio-save class="${this.pending?.kind === 'overwrite' && this.pending.slot === this.selectedSlot ? 'confirm' : ''}">${this.pending?.kind === 'overwrite' && this.pending.slot === this.selectedSlot ? '한 번 더 눌러 덮어쓰기 확정' : selectedSaved ? '현재 장면으로 교체' : '현재 장면 저장'}</button>
            ${selectedSaved ? `<button data-home-studio-download>PNG 엽서 저장</button><button data-home-studio-remove class="${this.pending?.kind === 'remove' && this.pending.slot === this.selectedSlot ? 'confirm danger' : 'quiet'}">${this.pending?.kind === 'remove' && this.pending.slot === this.selectedSlot ? '한 번 더 눌러 삭제 확정' : '이 엽서 비우기'}</button>` : ''}
          </footer>
        </main>
      </div>
      <section class="home-studio-archive"><header><div><small>SIX PERMANENT SNAPSHOTS</small><h2>나의 장면 보관함</h2></div><p>대표 공개는 세 장까지 · 공개에서 내려도 저장 엽서는 그대로</p></header><div>${slotCards}</div></section>
      <footer>능력치 보너스 없음 · 순위 없음 · 덮어쓰기와 삭제는 두 번 확인 · 공개 엽서에 저장 시각과 펫 이름은 포함하지 않음</footer>
    </section>`;
    this.paint(preview);
    this.bind(preview);
  }

  private paint(preview: ReturnType<typeof makeHomeStudioCard>): void {
    const previewCanvas = this.root.querySelector<HTMLCanvasElement>('[data-home-studio-preview]');
    if (previewCanvas) paintHomeStudioCard(previewCanvas, preview);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-home-studio-card]').forEach((canvas) => {
      const card = this.store.card(Number(canvas.dataset.homeStudioCard));
      if (card) paintHomeStudioCard(canvas, card);
    });
  }

  private bind(preview: ReturnType<typeof makeHomeStudioCard>): void {
    this.root.querySelector('.home-studio-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-home-studio-mood]').forEach((button) => button.addEventListener('click', () => {
      this.selectedMood = button.dataset.homeStudioMood as HomeStudioMoodId;
      this.pending = null; this.feedback = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-home-studio-slot]').forEach((button) => button.addEventListener('click', () => {
      this.selectedSlot = Number(button.dataset.homeStudioSlot);
      const card = this.store.card(this.selectedSlot);
      if (card) this.selectedMood = card.moodId;
      this.pending = null; this.feedback = ''; this.render();
    }));
    this.root.querySelector('[data-home-studio-save]')?.addEventListener('click', () => {
      if (this.store.card(this.selectedSlot) && !(this.pending?.kind === 'overwrite' && this.pending.slot === this.selectedSlot)) {
        this.pending = { kind: 'overwrite', slot: this.selectedSlot };
        this.feedback = `슬롯 ${this.selectedSlot + 1}의 기존 엽서는 아직 그대로예요. 정말 바꾸려면 같은 버튼을 한 번 더 눌러 주세요.`;
        this.render(); return;
      }
      const result = this.store.save(this.selectedSlot, preview);
      this.pending = null;
      this.feedback = result === 'overwritten'
        ? `슬롯 ${this.selectedSlot + 1}을 현재 장면으로 안전하게 교체했어요.`
        : `슬롯 ${this.selectedSlot + 1}에 「${HOME_STUDIO_MOOD_BY_ID.get(preview.moodId)?.title}」을 저장했어요.`;
      this.opts.onChanged(this.store.progress());
      this.render();
    });
    this.root.querySelector('[data-home-studio-remove]')?.addEventListener('click', () => {
      if (!(this.pending?.kind === 'remove' && this.pending.slot === this.selectedSlot)) {
        this.pending = { kind: 'remove', slot: this.selectedSlot };
        this.feedback = '아직 지우지 않았어요. 정말 이 엽서칸을 비우려면 같은 버튼을 한 번 더 눌러 주세요.';
        this.render(); return;
      }
      this.store.remove(this.selectedSlot);
      this.pending = null; this.feedback = '엽서칸을 비웠어요. 다른 저장 장면과 퀘스트 평생 기록은 그대로 남습니다.';
      this.opts.onChanged(this.store.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-home-studio-feature]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.toggleFeatured(Number(button.dataset.homeStudioFeature));
      this.feedback = result === 'added' ? '마을 명함의 대표 홈 엽서에 공개했어요.'
        : result === 'removed' ? '대표 공개에서만 내렸어요. 개인 보관함 엽서는 그대로예요.'
          : result === 'full' ? '대표 홈 엽서는 세 장까지예요. 한 장을 내린 뒤 다시 골라 주세요.'
            : '먼저 현재 방 장면을 저장해 주세요.';
      this.opts.onChanged(this.store.progress());
      this.render();
    }));
    this.root.querySelector('[data-home-studio-download]')?.addEventListener('click', () => this.downloadSelected());
  }

  private downloadSelected(): void {
    const card = this.store.card(this.selectedSlot);
    if (!card) return;
    const canvas = document.createElement('canvas');
    paintHomeStudioCard(canvas, card);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `hongdae-home-scene-${this.selectedSlot + 1}.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }, 'image/png');
    this.feedback = '개인 기기에 저장할 PNG 엽서를 준비했어요.';
    this.render();
  }

  destroy(): void { this.root.remove(); }
}
