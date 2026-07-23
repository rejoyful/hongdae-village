import { audio } from '../game/audio';
import { paintFishBadge, paintFishingScene } from '../game/art/fishingArt';
import {
  FISHING_LURES, FISHING_SPECIES, FISHING_WATERS, fishById, fishingLureById, fishingRankLabel,
  fishingRankValue, fishingSpeciesForWater, fishingWaterById,
  type FishingCatchResult, type FishingLureId, type FishingWaterId,
} from '../game/fishing/fishing';
import { FishingStore } from '../game/fishing/fishingStore';

export interface FishingPanelOptions {
  onToggle?: (open: boolean) => void;
  onChanged?: (result: FishingCatchResult) => void;
}

export class FishingPanel {
  private readonly root: HTMLDivElement;
  private selectedWaterId: FishingWaterId = 'rail_garden';
  private selectedLureId: FishingLureId = 'crumb';
  private feedback = '';
  private latest: FishingCatchResult | null = null;

  constructor(private readonly store: FishingStore, private readonly opts: FishingPanelOptions = {}) {
    this.root = document.createElement('div');
    this.root.className = 'hv-fishing';
    this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => this.handleClick(event));
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }

  open(): void {
    const last = this.store.get().lastCatch;
    if (last) { this.selectedWaterId = last.waterId; this.selectedLureId = last.lureId; }
    this.feedback = '';
    this.latest = null;
    this.render();
    this.root.style.display = 'grid';
    this.opts.onToggle?.(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.style.display = 'none';
    this.opts.onToggle?.(false);
  }

  destroy(): void { this.root.remove(); }

  private handleClick(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'close' || action === 'backdrop') { audio.playSe('click'); this.close(); return; }
    const waterId = button.dataset.water as FishingWaterId | undefined;
    if (waterId) {
      this.selectedWaterId = waterId; this.latest = null;
      this.feedback = `${fishingWaterById(waterId).name}의 물소리를 골랐어요.`;
      audio.playSe('click'); this.render(); return;
    }
    const lureId = button.dataset.lure as FishingLureId | undefined;
    if (lureId) {
      this.selectedLureId = lureId;
      this.feedback = `${fishingLureById(lureId).name}을 낚싯줄에 묶었어요. 소모되지 않습니다.`;
      audio.playSe('click'); this.render(); return;
    }
    if (action === 'cast') this.cast();
  }

  private cast(): void {
    const result = this.store.cast(this.selectedWaterId, this.selectedLureId);
    this.latest = result;
    const fish = fishById(result.fishId);
    if (result.firstCatch) this.feedback = `새 도감! ${fish.name} ${result.sizeCm.toFixed(1)}cm를 만났어요.`;
    else if (result.newRank) this.feedback = `${fish.name} 기록이 ${fishingRankLabel(result.rank)} 도장으로 올랐어요 · ${result.sizeCm.toFixed(1)}cm`;
    else this.feedback = `${fish.name} 최고 기록 갱신 · ${result.previousSizeCm.toFixed(1)} → ${result.sizeCm.toFixed(1)}cm`;
    audio.playSe('success');
    this.opts.onChanged?.(result);
    this.render();
  }

  private render(): void {
    const state = this.store.get();
    const progress = this.store.progress();
    const water = fishingWaterById(this.selectedWaterId);
    const lure = fishingLureById(this.selectedLureId);
    const displayedFishId = this.latest?.fishId ?? (state.lastCatch?.waterId === this.selectedWaterId ? state.lastCatch.fishId : null);
    const waterRecords = fishingSpeciesForWater(this.selectedWaterId).filter((fish) => state.records[fish.id]).length;
    const lastFish = displayedFishId ? fishById(displayedFishId) : null;
    const lastRecord = displayedFishId ? state.records[displayedFishId] : null;

    this.root.innerHTML = `
      <button class="fishing-backdrop" data-action="backdrop" aria-label="물정원 낚시 닫기"></button>
      <section class="fishing-shell" role="dialog" aria-modal="true" aria-label="홍대 물정원 낚시 수첩">
        <header class="fishing-head">
          <div>
            <span class="fishing-eyebrow">URBAN WATERS · KIND CATCH JOURNAL</span>
            <h2>홍대 물정원 낚시 수첩</h2>
            <p>기다림을 벌주는 실패 판정은 없어요. 빈 도감 칸을 먼저 만나고, 같은 친구를 다시 낚으면 최고 크기가 반드시 자랍니다.</p>
          </div>
          <button class="fishing-close" data-action="close" aria-label="닫기">×</button>
        </header>

        <div class="fishing-ledger" aria-label="낚시 진행도">
          <div><span>누적 만남</span><b>${progress.totalCatches}</b></div>
          <div><span>생물 도감</span><b>${progress.speciesDiscovered}<i>/${progress.totalSpecies}</i></b></div>
          <div><span>크기 도장</span><b>${progress.recordStamps}<i>/${progress.totalStamps}</i></b></div>
          <div><span>금빛 기록</span><b>${progress.goldRecords}<i>/18</i></b></div>
        </div>

        <nav class="fishing-waters" aria-label="낚시 물가 선택">
          ${FISHING_WATERS.map((item, index) => {
            const found = fishingSpeciesForWater(item.id).filter((fish) => state.records[fish.id]).length;
            return `<button class="${item.id === water.id ? 'selected' : ''}" data-water="${item.id}" style="--water:${item.palette[2]}"><i>${String(index + 1).padStart(2, '0')}</i><span><b>${item.name}</b><small>${found}/6 발견</small></span></button>`;
          }).join('')}
        </nav>

        <div class="fishing-workspace">
          <section class="fishing-water-stage">
            <div class="fishing-scene">
              <canvas data-fishing-hero aria-label="${escapeHtml(water.name)} 픽셀 물가"></canvas>
              <div class="fishing-location-tag"><span>${escapeHtml(water.shortName)}</span><b>${waterRecords}/6</b></div>
              ${lastFish && lastRecord ? `<div class="fishing-catch-card ${lastRecord.rank}"><span>${this.latest?.firstCatch ? 'NEW SPECIES' : 'SIZE RECORD'}</span><h3>${escapeHtml(lastFish.name)}</h3><b>${lastRecord.maxSizeCm.toFixed(1)}<i>cm</i></b><small>${fishingRankLabel(lastRecord.rank)} 도장 · ${lastRecord.catches}번째 만남</small></div>` : ''}
            </div>
            <div class="fishing-field-copy">
              <div><span>WATER NOTE</span><h3>${escapeHtml(water.name)}</h3><p>${escapeHtml(water.note)}</p></div>
              <div class="fishing-lures" aria-label="무료 매듭 선택">
                ${FISHING_LURES.map((item) => `<button class="${item.id === lure.id ? 'selected' : ''}" data-lure="${item.id}"><i>${item.mark}</i><span><b>${item.name}</b><small>${item.note}</small></span></button>`).join('')}
              </div>
              <div class="fishing-cast-row">
                <span><b>소모 없음 · 실패 없음</b><small>${escapeHtml(lure.name)}은 출현 순서만 다정하게 바꿔요.</small></span>
                <button data-action="cast">낚싯줄 드리우기</button>
              </div>
            </div>
          </section>

          <aside class="fishing-notebook">
            <div class="fishing-section-head"><div><span>WATER INDEX</span><h3>열여덟 생물 기록</h3></div><p>동 · 은 · 금<br>54개 도장</p></div>
            <div class="fishing-index">
              ${FISHING_SPECIES.map((fish, index) => {
                const record = state.records[fish.id];
                const marks = record ? fishingRankValue(record.rank) : 0;
                return `<article class="fishing-species ${record ? 'found' : ''}" style="--index:${index}">
                  <canvas data-fish-badge="${fish.id}"></canvas>
                  <div><span>${fishingWaterById(fish.waterId).shortName} · ${record ? fish.rarity : '미발견'}</span><b>${record ? escapeHtml(fish.name) : '아직 만나지 못한 생물'}</b><small>${record ? `${record.maxSizeCm.toFixed(1)}cm · ${record.catches}회` : '물결 실루엣만 기록됨'}</small></div>
                  <em aria-label="크기 도장 ${marks}/3">${[1, 2, 3].map((n) => `<i class="${n <= marks ? `on rank-${n}` : ''}"></i>`).join('')}</em>
                </article>`;
              }).join('')}
            </div>
          </aside>
        </div>

        <footer class="fishing-footer">
          <p aria-live="polite">${escapeHtml(this.feedback || (progress.totalCatches ? '물가와 매듭을 바꿔 빈 도감과 더 큰 기록을 천천히 모아 보세요.' : '첫 낚시는 반드시 새로운 생물을 만납니다. 원하는 물가부터 골라도 괜찮아요.'))}</p>
          <span>중복 기록도 항상 +0.1cm 이상 성장</span>
        </footer>
      </section>`;

    const hero = this.root.querySelector<HTMLCanvasElement>('[data-fishing-hero]');
    if (hero) paintFishingScene(hero, this.selectedWaterId, displayedFishId);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-fish-badge]').forEach((canvas) => {
      const fishId = canvas.dataset.fishBadge!;
      paintFishBadge(canvas, fishId, !!state.records[fishId], state.records[fishId]?.rank);
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
