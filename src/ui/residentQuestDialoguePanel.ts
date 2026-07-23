import type { WorldQuestSignal } from '../game/guidance/worldQuestSignals';
import {
  residentQuestConversation, type ResidentQuestConversation,
} from '../game/residents/residentQuestDialogue';
import type { ResidentDef } from '../game/residents/residents';

interface ResidentQuestDialoguePanelOptions {
  onToggle: (open: boolean) => void;
  onTrack: (questId: string) => void;
  onOpenBook: (residentId: string) => void;
}

/**
 * 월드 주민과 퀘스트 일지 사이의 짧은 대화 장면.
 * 수락/거절 상태는 만들지 않고, 따라가기 버튼은 기존 focusedQuestId만 바꾼다.
 */
export class ResidentQuestDialoguePanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private conversation: ResidentQuestConversation | null = null;

  constructor(
    private readonly portraits: Readonly<Record<string, string>>,
    private readonly opts: ResidentQuestDialoguePanelOptions,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-resident-quest-dialogue';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(resident: ResidentDef, signal: WorldQuestSignal): void {
    this.conversation = residentQuestConversation(resident, signal);
    this.opened = true;
    this.render();
    this.root.style.display = 'grid';
    this.opts.onToggle(true);
  }

  private render(): void {
    const view = this.conversation;
    if (!view) return;
    const portrait = this.portraits[view.residentId];
    this.root.innerHTML = `<section data-stage="${escapeHtml(view.stageCode)}">
      <button class="resident-quest-close" aria-label="대화 닫기" title="대화 닫기">×</button>
      <header><small>${escapeHtml(view.stageCode)}</small><span>${escapeHtml(view.stageLabel)}</span></header>
      <div class="resident-quest-scene">
        <figure>
          ${portrait ? `<img src="${portrait}" alt="${escapeHtml(view.residentName)} 픽셀 초상">` : '<i>?</i>'}
          <figcaption><small>${escapeHtml(view.residentRole)}</small><strong>${escapeHtml(view.residentName)}</strong></figcaption>
        </figure>
        <blockquote><i>“</i><p>${escapeHtml(view.quote)}</p><small>${escapeHtml(view.reassurance)}</small></blockquote>
      </div>
      <article class="resident-quest-ticket">
        <div><small>NEIGHBOR REQUEST</small><h2>${escapeHtml(view.title)}</h2><p>${escapeHtml(view.request)}</p></div>
        <dl>
          <div><dt>현재 기록</dt><dd>${escapeHtml(view.progressLabel)}</dd></div>
          <div><dt>이어갈 곳</dt><dd>${escapeHtml(view.location)}</dd></div>
          ${view.rewardLabel ? `<div><dt>영구 기념</dt><dd>◆ ${escapeHtml(view.rewardLabel)}</dd></div>` : ''}
        </dl>
      </article>
      <p class="resident-quest-safe">이야기는 이미 열려 있어요. 지금 따라가지 않아도 진행·관계·보상은 사라지지 않습니다.</p>
      <footer>
        <button class="resident-quest-track">${escapeHtml(view.trackLabel)}</button>
        <button class="resident-quest-book">${escapeHtml(view.residentName)} 수첩 보기</button>
        <button class="resident-quest-later">지금은 둘러볼게요</button>
      </footer>
    </section>`;
    this.root.querySelector('.resident-quest-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.resident-quest-later')!.addEventListener('click', () => this.close());
    this.root.querySelector('.resident-quest-track')!.addEventListener('click', () => {
      const questId = view.questId;
      this.close();
      this.opts.onTrack(questId);
    });
    this.root.querySelector('.resident-quest-book')!.addEventListener('click', () => {
      const residentId = view.residentId;
      this.close();
      this.opts.onOpenBook(residentId);
    });
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void {
    this.root.remove();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
  ));
}
