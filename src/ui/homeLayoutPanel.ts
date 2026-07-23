import { audio } from '../game/audio';
import { paintHomeLayoutArt } from '../game/art/homeLayoutArt';
import {
  HOME_LAYOUT_LABELS, HOME_LAYOUT_LABEL_BY_ID, HOME_LAYOUT_SLOT_MAX, homeLayoutProgress,
  makeHomeLayoutSnapshot, type HomeLayoutLabelId, type HomeLayoutProgress, type HomeLayoutSnapshot,
} from '../game/home/homeLayouts';

export type HomeLayoutPanelResult =
  | { ok: true; snapshot: HomeLayoutSnapshot }
  | { ok: false; reason: 'missing' | 'invalid' | 'owner' | 'offline' | 'bad' | 'empty'; missingNames?: string[] };

export interface HomeLayoutPanelOptions {
  online: boolean;
  onToggle?: (open: boolean) => void;
  currentSnapshot: (slot: number, labelId: HomeLayoutLabelId) => HomeLayoutSnapshot;
  loadSlots: () => Promise<HomeLayoutSnapshot[]>;
  saveSlot: (slot: number, labelId: HomeLayoutLabelId) => Promise<HomeLayoutPanelResult>;
  applySlot: (slot: number) => Promise<HomeLayoutPanelResult>;
  onChanged?: (progress: HomeLayoutProgress) => void;
}

export class HomeLayoutPanel {
  private readonly root: HTMLDivElement;
  private slots = new Map<number, HomeLayoutSnapshot>();
  private selectedSlot = 1;
  private selectedLabel: HomeLayoutLabelId = 'daily';
  private loading = false;
  private busy = false;
  private feedback = '';
  private confirm: { action: 'save' | 'apply'; slot: number } | null = null;

  constructor(private readonly opts: HomeLayoutPanelOptions) {
    this.root = document.createElement('div'); this.root.className = 'hv-home-layouts'; this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => void this.handleClick(event)); document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }

  async open(): Promise<void> {
    if (this.isOpen) return;
    this.root.style.display = 'grid'; this.loading = true; this.feedback = ''; this.confirm = null; this.render(); this.opts.onToggle?.(true);
    const slots = await this.opts.loadSlots();
    this.slots = new Map(slots.map((slot) => [slot.slot, slot]));
    const first = slots[0]; if (first) { this.selectedSlot = first.slot; this.selectedLabel = first.labelId; }
    this.loading = false; this.emitProgress(); this.render();
  }

  close(): void { if (!this.isOpen || this.busy) return; this.root.style.display = 'none'; this.opts.onToggle?.(false); }
  destroy(): void { this.root.remove(); }

  private async handleClick(event: Event): Promise<void> {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled || this.busy) return;
    const action = button.dataset.action;
    if (action === 'close' || action === 'backdrop') { audio.playSe('click'); this.close(); return; }
    const slot = Number(button.dataset.slot);
    if (Number.isInteger(slot) && slot >= 1 && slot <= HOME_LAYOUT_SLOT_MAX && action === 'select') {
      this.selectedSlot = slot; this.selectedLabel = this.slots.get(slot)?.labelId ?? HOME_LAYOUT_LABELS[slot - 1]!.id;
      this.confirm = null; this.feedback = ''; audio.playSe('click'); this.render(); return;
    }
    const label = button.dataset.label as HomeLayoutLabelId | undefined;
    if (label && HOME_LAYOUT_LABEL_BY_ID.has(label)) {
      this.selectedLabel = label; this.confirm = null; this.feedback = `${HOME_LAYOUT_LABEL_BY_ID.get(label)!.name} 표지를 골랐어요.`;
      audio.playSe('click'); this.render(); return;
    }
    if (action === 'save') { await this.saveSelected(); return; }
    if (action === 'apply') await this.applySelected();
  }

  private async saveSelected(): Promise<void> {
    const exists = this.slots.has(this.selectedSlot);
    if (exists && (this.confirm?.action !== 'save' || this.confirm.slot !== this.selectedSlot)) {
      this.confirm = { action: 'save', slot: this.selectedSlot };
      this.feedback = `${this.selectedSlot}번에 있던 장면은 새 현재 방으로 바뀝니다. 한 번 더 눌러 덮어써 주세요.`;
      audio.playSe('click'); this.render(); return;
    }
    this.busy = true; this.feedback = '현재 방의 가구·방향·리폼 결을 장면으로 묶는 중이에요…'; this.render();
    const result = await this.opts.saveSlot(this.selectedSlot, this.selectedLabel);
    this.busy = false; this.confirm = null;
    if (result.ok) {
      this.slots.set(this.selectedSlot, result.snapshot);
      this.feedback = `${this.selectedSlot}번 ${HOME_LAYOUT_LABEL_BY_ID.get(result.snapshot.labelId)!.name} 장면을 안전하게 보관했어요.`;
      this.emitProgress(); audio.playSe('success');
    } else {
      this.feedback = result.reason === 'owner' ? '현재 집의 소유자만 장면을 저장할 수 있어요.'
        : result.reason === 'offline' ? '연결이 잠시 쉬고 있어 저장하지 못했어요. 현재 방은 그대로예요.'
          : '장면을 저장하지 못했어요. 현재 방은 바뀌지 않았습니다.';
      audio.playSe('click');
    }
    this.render();
  }

  private async applySelected(): Promise<void> {
    if (!this.slots.has(this.selectedSlot)) { this.feedback = '먼저 이 칸에 현재 방 장면을 저장해 주세요.'; audio.playSe('click'); this.render(); return; }
    if (this.confirm?.action !== 'apply' || this.confirm.slot !== this.selectedSlot) {
      this.confirm = { action: 'apply', slot: this.selectedSlot };
      this.feedback = '현재 배치는 사라지기 전에 다른 칸에 저장할 수 있어요. 한 번 더 눌러 이 장면으로 전환하세요.';
      audio.playSe('click'); this.render(); return;
    }
    this.busy = true; this.feedback = '아이템을 먼저 확인한 뒤 한 번에 장면을 바꾸는 중이에요…'; this.render();
    const result = await this.opts.applySlot(this.selectedSlot);
    this.busy = false; this.confirm = null;
    if (result.ok) {
      this.slots.set(this.selectedSlot, result.snapshot);
      this.feedback = `${HOME_LAYOUT_LABEL_BY_ID.get(result.snapshot.labelId)!.name} 장면으로 바꿨어요. 가구 편집 되돌리기는 여기서 새로 시작합니다.`;
      this.emitProgress(); audio.playSe('success');
    } else {
      this.feedback = result.reason === 'missing'
        ? `필요한 가구가 모자라 장면을 바꾸지 않았어요.${result.missingNames?.length ? ` 부족: ${result.missingNames.join(' · ')}` : ''}`
        : result.reason === 'invalid' ? '현재 집 평면과 맞지 않는 배치가 있어 적용하지 않았어요.'
          : result.reason === 'offline' ? '연결이 잠시 쉬고 있어 적용하지 못했어요. 현재 방은 그대로예요.'
            : '이 장면을 적용하지 못했어요. 현재 방은 그대로 유지됩니다.';
      audio.playSe('click');
    }
    this.render();
  }

  private emitProgress(): void {
    const state = {
      version: 1 as const, slots: Object.fromEntries([...this.slots].map(([slot, snapshot]) => [String(slot), snapshot])),
      totalSaves: [...this.slots.values()].reduce((sum, snapshot) => sum + snapshot.saveCount, 0),
      totalApplies: [...this.slots.values()].reduce((sum, snapshot) => sum + snapshot.applyCount, 0),
    };
    this.opts.onChanged?.(homeLayoutProgress(state));
  }

  private render(): void {
    const selected = this.slots.get(this.selectedSlot);
    const current = this.opts.currentSnapshot(this.selectedSlot, this.selectedLabel);
    const label = HOME_LAYOUT_LABEL_BY_ID.get(this.selectedLabel)!;
    const saveConfirm = this.confirm?.action === 'save' && this.confirm.slot === this.selectedSlot;
    const applyConfirm = this.confirm?.action === 'apply' && this.confirm.slot === this.selectedSlot;
    this.root.innerHTML = `
      <button class="layout-backdrop" data-action="backdrop" aria-label="홈 장면 보관함 닫기"></button>
      <section class="layout-book" role="dialog" aria-modal="true" aria-label="홈 장면 보관함">
        <header class="layout-head"><div><small>SIX HOME SCENES · ATOMIC ROOM CHANGE</small><h2>홈 장면 보관함</h2><p>좋아하는 배치를 여섯 장면으로 보존하고, 아이템을 먼저 확인한 뒤 한 번에 안전하게 갈아입혀요.</p></div><aside><span>${this.opts.online ? 'SERVER SAFE' : 'OFFLINE SAFE'}</span><button data-action="close" aria-label="닫기">×</button></aside></header>
        <div class="layout-stats"><span><small>보관 장면</small><b>${this.slots.size}<i>/6</i></b></span><span><small>선택 슬롯</small><b>${this.selectedSlot}</b></span><p>저장과 적용은 각각 다시 확인합니다. 아이템이 모자라면 현재 방을 전혀 바꾸지 않아요.</p></div>
        <main class="layout-workspace">
          <aside class="layout-slots">${Array.from({ length: HOME_LAYOUT_SLOT_MAX }, (_, index) => {
            const slot = index + 1; const saved = this.slots.get(slot); const slotLabel = HOME_LAYOUT_LABEL_BY_ID.get(saved?.labelId ?? HOME_LAYOUT_LABELS[index]!.id)!;
            return `<button data-action="select" data-slot="${slot}" class="${slot === this.selectedSlot ? 'selected' : ''} ${saved ? 'saved' : ''}" style="--layout:${slotLabel.color};--layout-dark:${slotLabel.dark}"><i>${slot}</i><span><small>${saved ? `${saved.placements.length}개 · 적용 ${saved.applyCount}회` : '비어 있는 장면 칸'}</small><b>${escapeHtml(saved ? slotLabel.name : `${slot}번 장면`)}</b></span><em>${saved ? slotLabel.mark : '+'}</em></button>`;
          }).join('')}</aside>
          <section class="layout-page">
            <div class="layout-compare">
              <article><header><span>CURRENT ROOM</span><b>지금의 방</b></header><canvas data-layout-current></canvas><footer>${current.placements.length}개 가구 · 저장 전 미리보기</footer></article>
              <i aria-hidden="true">⇄</i>
              <article class="saved"><header><span>SAVED SCENE ${this.selectedSlot}</span><b>${escapeHtml(selected ? HOME_LAYOUT_LABEL_BY_ID.get(selected.labelId)!.name : '아직 비어 있어요')}</b></header><canvas data-layout-saved></canvas><footer>${selected ? `${selected.placements.length}개 가구 · ${formatDate(selected.savedAt)}` : '현재 방을 이 칸에 처음 보관해 보세요.'}</footer></article>
            </div>
            <section class="layout-labels"><header><small>SCENE COVER</small><b>이 장면의 표지 고르기</b></header><div>${HOME_LAYOUT_LABELS.map((option) => `<button data-label="${option.id}" class="${this.selectedLabel === option.id ? 'selected' : ''}" style="--layout:${option.color};--layout-dark:${option.dark}"><i>${option.mark}</i><span><b>${escapeHtml(option.name)}</b><small>${escapeHtml(option.note)}</small></span></button>`).join('')}</div></section>
            <div class="layout-actions"><button data-action="save" class="save ${saveConfirm ? 'confirm' : ''}" ${this.loading || this.busy ? 'disabled' : ''}><small>${selected ? '현재 방으로 덮어쓰기' : '새 장면 보관'}</small><b>${this.busy ? '처리 중…' : saveConfirm ? '한 번 더 눌러 저장' : `${this.selectedSlot}번에 현재 방 저장`}</b></button><button data-action="apply" class="apply ${applyConfirm ? 'confirm' : ''}" ${!selected || this.loading || this.busy ? 'disabled' : ''}><small>아이템 확인 뒤 원자 전환</small><b>${this.busy ? '처리 중…' : applyConfirm ? '한 번 더 눌러 전환' : '이 장면으로 방 바꾸기'}</b></button></div>
          </section>
        </main>
        <footer class="layout-footer" aria-live="polite"><span style="--layout:${label.color}">${label.mark}</span><p>${escapeHtml(this.feedback || (this.loading ? '저장된 장면을 불러오는 중이에요…' : '빈 칸은 부담 없이 시작할 수 있고, 기존 장면을 덮을 때는 꼭 한 번 더 확인해요.'))}</p></footer>
      </section>`;
    const currentCanvas = this.root.querySelector<HTMLCanvasElement>('[data-layout-current]');
    if (currentCanvas) paintHomeLayoutArt(currentCanvas, current.placements, this.selectedLabel, false);
    const savedCanvas = this.root.querySelector<HTMLCanvasElement>('[data-layout-saved]');
    if (savedCanvas) paintHomeLayoutArt(savedCanvas, selected?.placements ?? [], selected?.labelId ?? this.selectedLabel, !!selected);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

function formatDate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '저장 시각 기록 없음';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
