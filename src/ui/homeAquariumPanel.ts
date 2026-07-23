import { audio } from '../game/audio';
import { paintFishBadge } from '../game/art/fishingArt';
import { paintHomeAquarium } from '../game/art/homeAquariumArt';
import { FISHING_SPECIES, fishById, fishingWaterById } from '../game/fishing/fishing';
import type { FishingStore } from '../game/fishing/fishingStore';
import {
  AQUARIUM_FRAMES, AQUARIUM_ORNAMENTS, AQUARIUM_SUBSTRATES,
  aquariumFrameById, aquariumOrnamentById, aquariumSubstrateById,
  type AquariumFrameId, type AquariumOrnamentId, type AquariumSubstrateId, type HomeAquariumDraft,
  type HomeAquariumSaveResult,
} from '../game/home/homeAquarium';
import type { HomeAquariumStore } from '../game/home/homeAquariumStore';

export interface HomeAquariumPanelOptions {
  onToggle?: (open: boolean) => void;
  onSaved?: (result: HomeAquariumSaveResult & { ok: true }) => void;
  onOpenFishing?: () => void;
  hasPlacedTank?: () => boolean;
}

export class HomeAquariumPanel {
  private readonly root: HTMLDivElement;
  private draft: HomeAquariumDraft;
  private feedback = '';

  constructor(
    private readonly store: HomeAquariumStore,
    private readonly fishing: FishingStore,
    private readonly opts: HomeAquariumPanelOptions = {},
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-home-aquarium';
    this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => this.handleClick(event));
    document.body.appendChild(this.root);
    this.draft = this.stateDraft();
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }

  open(): void {
    this.draft = this.stateDraft();
    this.feedback = '';
    this.render();
    this.root.style.display = 'grid';
    this.opts.onToggle?.(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.style.display = 'none';
    this.opts.onToggle?.(false);
  }

  refresh(): void { if (this.isOpen) this.render(); }
  destroy(): void { this.root.remove(); }

  private stateDraft(): HomeAquariumDraft {
    const state = this.store.get();
    return { frameId: state.frameId, substrateId: state.substrateId, ornamentId: state.ornamentId, fishIds: [...state.fishIds] };
  }

  private handleClick(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'close' || action === 'backdrop') { audio.playSe('click'); this.close(); return; }
    if (action === 'fishing') {
      audio.playSe('click'); this.close(); this.opts.onOpenFishing?.(); return;
    }
    const frameId = button.dataset.frame as AquariumFrameId | undefined;
    const substrateId = button.dataset.substrate as AquariumSubstrateId | undefined;
    const ornamentId = button.dataset.ornament as AquariumOrnamentId | undefined;
    if (frameId) { this.draft.frameId = frameId; this.feedback = `${aquariumFrameById(frameId).name}을 골랐어요.`; audio.playSe('click'); this.render(); return; }
    if (substrateId) { this.draft.substrateId = substrateId; this.feedback = `${aquariumSubstrateById(substrateId).name} 바닥으로 바꿨어요.`; audio.playSe('click'); this.render(); return; }
    if (ornamentId) { this.draft.ornamentId = ornamentId; this.feedback = `${aquariumOrnamentById(ornamentId).name}을 안쪽에 놓았어요.`; audio.playSe('click'); this.render(); return; }
    const fishId = button.dataset.fish;
    if (fishId) { this.toggleFish(fishId); return; }
    if (action === 'save') this.save();
  }

  private toggleFish(fishId: string): void {
    const progress = this.store.progress(this.fishing);
    const index = this.draft.fishIds.indexOf(fishId);
    if (index >= 0) {
      this.draft.fishIds.splice(index, 1);
      this.feedback = `${fishById(fishId).name}을 전시 슬롯에서 쉬게 했어요.`;
    } else if (this.draft.fishIds.length >= progress.displaySlots) {
      this.feedback = `현재 전시 슬롯은 ${progress.displaySlots}칸이에요. 생물 도감을 더 채우면 세 칸까지 열립니다.`;
      audio.playSe('click'); this.render(); return;
    } else {
      this.draft.fishIds.push(fishId);
      this.feedback = `${fishById(fishId).name}을 ${this.draft.fishIds.length}번 전시 슬롯에 배치했어요.`;
    }
    audio.playSe('click'); this.render();
  }

  private save(): void {
    const result = this.store.save(this.draft, this.fishing);
    if (!result.ok) {
      this.feedback = result.reason === 'no-fish' ? '발견한 생물을 한 마리 이상 골라 주세요.'
        : result.reason === 'too-many-fish' ? '현재 열린 전시 슬롯 수를 넘었어요.'
          : result.reason === 'undiscovered-fish' ? '아직 만나지 못한 생물은 전시할 수 없어요.'
            : '아직 잠긴 전시 재료가 포함되어 있어요.';
      audio.playSe('click'); this.render(); return;
    }
    this.feedback = `${result.fishCount}마리 물결 테라리움을 ${result.saveCount}번째 구성으로 저장했어요.${this.opts.hasPlacedTank?.() ? ' 방 안 어항에도 바로 반영됐습니다.' : ' 무료 어항을 방에 배치하면 실제 가구에 표시됩니다.'}`;
    audio.playSe('success');
    this.opts.onSaved?.(result);
    this.render();
  }

  private render(): void {
    const fishingState = this.fishing.get();
    const fishingProgress = this.fishing.progress();
    const progress = this.store.progress(this.fishing);
    const hasTank = this.opts.hasPlacedTank?.() ?? false;
    const discovered = FISHING_SPECIES.filter((fish) => fishingState.records[fish.id]);
    const selected = new Set(this.draft.fishIds);
    const optionButton = <T extends string>(
      dataKey: string, option: { id: T; name: string; note: string; unlockAt: number; color: string },
      current: number, selectedId: string, unit: string,
    ) => {
      const unlocked = current >= option.unlockAt;
      return `<button class="aquarium-option ${selectedId === option.id ? 'selected' : ''}" data-${dataKey}="${option.id}" ${unlocked ? '' : 'disabled'} style="--option:${option.color}">
        <i></i><span><b>${unlocked ? escapeHtml(option.name) : `${option.unlockAt}${unit}에 공개`}</b><small>${unlocked ? escapeHtml(option.note) : `현재 ${current}${unit}`}</small></span>
      </button>`;
    };

    this.root.innerHTML = `
      <button class="aquarium-backdrop" data-action="backdrop" aria-label="물결 테라리움 닫기"></button>
      <section class="aquarium-shell" role="dialog" aria-modal="true" aria-label="우리 집 물결 테라리움 작업실">
        <header class="aquarium-head">
          <div><span>HOME WATER ARCHIVE · LIVE DISPLAY</span><h2>우리 집 물결 테라리움</h2><p>낚시 도감의 생물을 골라 프레임·바닥재·장식을 조합하세요. 저장한 구성은 방에 배치한 어항 가구에 그대로 나타납니다.</p></div>
          <button class="aquarium-close" data-action="close" aria-label="닫기">×</button>
        </header>

        <div class="aquarium-ledger">
          <div><span>발견 생물</span><b>${fishingProgress.speciesDiscovered}<i>/18</i></b></div>
          <div><span>전시 슬롯</span><b>${progress.displaySlots}<i>/3</i></b></div>
          <div><span>전시 재료</span><b>${progress.framesUnlocked + progress.substratesUnlocked + progress.ornamentsUnlocked}<i>/18</i></b></div>
          <div><span>저장 구성</span><b>${progress.saveCount}</b></div>
          <div class="${hasTank ? 'active' : ''}"><span>방 안 연결</span><b>${hasTank ? 'ON' : 'OFF'}</b></div>
        </div>

        <div class="aquarium-workspace">
          <section class="aquarium-preview">
            <div class="aquarium-canvas-wrap">
              <canvas data-aquarium-hero aria-label="현재 물결 테라리움 픽셀 미리보기"></canvas>
              <div class="aquarium-preview-label"><span>LIVE COMPOSITION</span><b>${this.draft.fishIds.length}/${progress.displaySlots}마리</b></div>
            </div>
            <div class="aquarium-selection-note">
              <div><span>현재 조합</span><b>${escapeHtml(aquariumFrameById(this.draft.frameId).name)}</b><small>${escapeHtml(aquariumSubstrateById(this.draft.substrateId).name)} · ${escapeHtml(aquariumOrnamentById(this.draft.ornamentId).name)}</small></div>
              <ol>${[0,1,2].map((slot) => `<li class="${slot < progress.displaySlots ? 'open' : ''}"><i>${slot+1}</i><span>${this.draft.fishIds[slot] ? escapeHtml(fishById(this.draft.fishIds[slot]!).name) : slot < progress.displaySlots ? '비어 있는 전시 슬롯' : `${slot === 1 ? 6 : 12}종 발견 시 공개`}</span></li>`).join('')}</ol>
            </div>
            ${discovered.length === 0 ? `<div class="aquarium-empty"><b>아직 전시할 생물이 없어요.</b><p>물정원 낚시는 실패하지 않고 첫 만남부터 도감이 열립니다.</p><button data-action="fishing">낚시 수첩에서 첫 생물 만나기</button></div>` : `<button class="aquarium-save" data-action="save" ${this.draft.fishIds.length ? '' : 'disabled'}>이 구성을 우리 집 어항에 저장</button>`}
          </section>

          <aside class="aquarium-materials">
            <div class="aquarium-material-section"><div class="aquarium-section-head"><span>FRAME / 생물 발견</span><b>${progress.framesUnlocked}/6</b></div><div class="aquarium-option-grid">${AQUARIUM_FRAMES.map((option) => optionButton('frame', option, fishingProgress.speciesDiscovered, this.draft.frameId, '종')).join('')}</div></div>
            <div class="aquarium-material-section"><div class="aquarium-section-head"><span>GROUND / 크기 도장</span><b>${progress.substratesUnlocked}/6</b></div><div class="aquarium-option-grid">${AQUARIUM_SUBSTRATES.map((option) => optionButton('substrate', option, fishingProgress.recordStamps, this.draft.substrateId, '개')).join('')}</div></div>
            <div class="aquarium-material-section"><div class="aquarium-section-head"><span>OBJECT / 금빛 기록</span><b>${progress.ornamentsUnlocked}/6</b></div><div class="aquarium-option-grid">${AQUARIUM_ORNAMENTS.map((option) => optionButton('ornament', option, fishingProgress.goldRecords, this.draft.ornamentId, '종')).join('')}</div></div>
          </aside>
        </div>

        <section class="aquarium-fish-book">
          <div class="aquarium-section-head"><span>RESIDENTS / 발견 생물만 선택 가능</span><b>${this.draft.fishIds.length}/${progress.displaySlots} 선택</b></div>
          <div class="aquarium-fish-grid">
            ${FISHING_SPECIES.map((fish, index) => {
              const record = fishingState.records[fish.id];
              return `<button class="aquarium-fish ${selected.has(fish.id) ? 'selected' : ''}" data-fish="${fish.id}" ${record ? '' : 'disabled'} style="--fish-index:${index}">
                <canvas data-aquarium-fish="${fish.id}"></canvas><span><small>${fishingWaterById(fish.waterId).shortName}</small><b>${record ? escapeHtml(fish.name) : '미발견 생물'}</b><em>${record ? `${record.maxSizeCm.toFixed(1)}cm · ${record.rank}` : '낚시 수첩에서 만나기'}</em></span>
              </button>`;
            }).join('')}
          </div>
        </section>

        <footer class="aquarium-footer"><p aria-live="polite">${escapeHtml(this.feedback || (hasTank ? '저장할 때마다 방 안 어항의 생물과 재료가 즉시 바뀝니다.' : '웰컴 박스의 무료 어항을 방에 배치하면 이 구성이 실제 가구로 나타납니다.'))}</p><button data-action="fishing">물정원 낚시 수첩 열기</button></footer>
      </section>`;

    const hero = this.root.querySelector<HTMLCanvasElement>('[data-aquarium-hero]');
    if (hero) paintHomeAquarium(hero, { ...this.store.get(), ...this.draft }, fishingState);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-aquarium-fish]').forEach((canvas) => {
      const fishId = canvas.dataset.aquariumFish!;
      paintFishBadge(canvas, fishId, !!fishingState.records[fishId], fishingState.records[fishId]?.rank);
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
