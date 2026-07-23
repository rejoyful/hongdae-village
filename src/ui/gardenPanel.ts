import { audio } from '../game/audio';
import { paintGardenPlot, paintGardenSpecimen } from '../game/art/gardenArt';
import {
  GARDEN_SEEDS, GARDEN_STAGE_LABELS, GARDEN_VARIANTS, gardenSeedById, gardenSeedUnlocked,
  gardenSpecimenKey, gardenVariantById, type GardenActionResult, type GardenProgress, type GardenSeedId,
} from '../game/garden/garden';
import { GardenStore } from '../game/garden/gardenStore';

export interface GardenPanelOptions {
  onToggle?: (open: boolean) => void;
  onChanged?: (result: GardenActionResult, progress: GardenProgress) => void;
  onOpenKitchen?: () => void;
}

const RESULT_ERROR: Record<string, string> = {
  'bad-plot': '화분 위치를 다시 확인해 주세요.',
  occupied: '이미 식물이 자라고 있는 화분이에요.',
  empty: '먼저 씨앗을 심어 주세요.',
  'locked-seed': '수확 기록을 더 쌓으면 이 씨앗을 만날 수 있어요.',
  'no-seed': '이 씨앗 봉투가 비었어요. 같은 식물을 수확하면 두 봉투를 돌려받아요.',
  'already-ready': '꽃이 충분히 자랐어요. 이제 표본을 수확해 주세요.',
  'not-ready': '아직 자라는 중이에요. 조금 더 돌봐 주세요.',
};

export class GardenPanel {
  private readonly root: HTMLDivElement;
  private selectedSeedId: GardenSeedId = 'basil';
  private feedback = '';

  constructor(private readonly store: GardenStore, private readonly opts: GardenPanelOptions = {}) {
    this.root = document.createElement('div');
    this.root.className = 'hv-garden';
    this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => this.handleClick(event));
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }

  open(): void {
    this.feedback = '';
    this.ensureSelectableSeed();
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

  private ensureSelectableSeed(): void {
    const state = this.store.get();
    if (gardenSeedUnlocked(state, this.selectedSeedId) && state.seedPackets[this.selectedSeedId] > 0) return;
    this.selectedSeedId = GARDEN_SEEDS.find((seed) => gardenSeedUnlocked(state, seed.id) && state.seedPackets[seed.id] > 0)?.id ?? 'basil';
  }

  private handleClick(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'close' || button.dataset.action === 'backdrop') {
      audio.playSe('click');
      this.close();
      return;
    }
    if (button.dataset.action === 'kitchen') {
      audio.playSe('click');
      this.close();
      this.opts.onOpenKitchen?.();
      return;
    }
    const seedId = button.dataset.seed as GardenSeedId | undefined;
    if (seedId) {
      this.selectedSeedId = seedId;
      this.feedback = `${gardenSeedById(seedId).name} 씨앗을 골랐어요.`;
      audio.playSe('click');
      this.render();
      return;
    }
    const rawIndex = button.dataset.plot;
    if (rawIndex === undefined) return;
    const plotIndex = Number(rawIndex);
    let result: GardenActionResult;
    if (button.dataset.action === 'plant') result = this.store.plant(plotIndex, this.selectedSeedId);
    else if (button.dataset.action === 'tend') result = this.store.tend(plotIndex);
    else if (button.dataset.action === 'harvest') result = this.store.harvest(plotIndex);
    else return;
    this.handleResult(result);
  }

  private handleResult(result: GardenActionResult): void {
    if (!result.ok) {
      this.feedback = RESULT_ERROR[result.reason] ?? '정원 기록을 다시 확인해 주세요.';
      audio.playSe('click');
      this.render();
      return;
    }
    if (result.kind === 'planted') {
      const seed = gardenSeedById(result.plot.seedId);
      const variant = gardenVariantById(result.plot.variantId);
      this.feedback = `${seed.name}을 심었어요. 이번 화분은 ${variant.name} 표본으로 자라요.`;
      audio.playSe('pop');
    } else if (result.kind === 'tended') {
      this.feedback = `${GARDEN_STAGE_LABELS[result.plot.stage]} 단계로 자랐어요. 이 정원에는 시듦이 없어요.`;
      audio.playSe(result.plot.stage === 3 ? 'success' : 'pop');
    } else {
      const [seedId, variantId] = result.specimenKey.split(':') as [GardenSeedId, 'sun' | 'rain' | 'moon'];
      const unlockText = result.newlyUnlocked.length
        ? ` 새 씨앗 「${result.newlyUnlocked.map((id) => gardenSeedById(id).name).join(' · ')}」도 도착했어요.`
        : '';
      this.feedback = `${gardenSeedById(seedId).name} · ${gardenVariantById(variantId).name} 표본과 조리 재료 1개를 ${result.firstSpecimen ? '새로 기록했어요.' : '수확했어요.'}${unlockText}`;
      audio.playSe('success');
    }
    const progress = this.store.progress();
    this.ensureSelectableSeed();
    this.opts.onChanged?.(result, progress);
    this.render();
  }

  private render(): void {
    const state = this.store.get();
    const progress = this.store.progress();
    const nextSeed = GARDEN_SEEDS.find((seed) => seed.unlockAt > progress.totalHarvests);
    const selected = gardenSeedById(this.selectedSeedId);
    const specimenSet = new Set(state.specimens);
    this.root.innerHTML = `
      <button class="garden-backdrop" data-action="backdrop" aria-label="정원 닫기"></button>
      <section class="garden-shell" role="dialog" aria-modal="true" aria-label="옥상 씨앗 연구소">
        <header class="garden-head">
          <div>
            <span class="garden-eyebrow">ROOFTOP SEED LAB · COLLECTION 01</span>
            <h2>옥상 씨앗 연구소</h2>
            <p>심고 세 번 돌보면 수확할 수 있어요. 기다림도 시듦도 없이, 표본만 차곡차곡 남습니다.</p>
          </div>
          <button class="garden-close" data-action="close" aria-label="닫기">×</button>
        </header>

        <div class="garden-ledger" aria-label="정원 진행도">
          <div><span>수확 기록</span><b>${progress.totalHarvests}</b></div>
          <div><span>발견 식물</span><b>${progress.speciesDiscovered}<i>/12</i></b></div>
          <div><span>표본 서랍</span><b>${progress.specimensDiscovered}<i>/${progress.totalSpecimens}</i></b></div>
          <div><span>조리 재료</span><b>${progress.pantryIngredients}</b></div>
        </div>

        <div class="garden-workspace">
          <div class="garden-plots-wrap">
            <div class="garden-section-head">
              <div><span>LIVE PLANTERS</span><h3>오늘의 네 화분</h3></div>
              <p>${progress.ready ? `수확을 기다리는 화분 ${progress.ready}개` : '모든 돌봄은 영구 기록으로 남아요'}</p>
            </div>
            <div class="garden-plots">
              ${state.plots.map((plot, index) => {
                const seed = plot ? gardenSeedById(plot.seedId) : selected;
                const variant = plot ? gardenVariantById(plot.variantId) : null;
                const action = !plot ? 'plant' : plot.stage === 3 ? 'harvest' : 'tend';
                const actionLabel = !plot ? `${selected.name} 심기` : plot.stage === 3 ? '표본 수확하기' : '한 번 돌보기';
                return `<article class="garden-plot ${plot?.stage === 3 ? 'is-ready' : ''}">
                  <div class="garden-plot-art"><canvas data-plot-art="${index}" aria-label="${escapeHtml(seed.name)} 성장 모습"></canvas><span>${String(index + 1).padStart(2, '0')}</span></div>
                  <div class="garden-plot-copy">
                    <small>${plot ? `${variant!.name} · ${GARDEN_STAGE_LABELS[plot.stage]}` : '빈 화분 · 선택한 씨앗'}</small>
                    <b>${escapeHtml(seed.name)}</b>
                    <p>${escapeHtml(plot ? seed.note : `봉투 ${state.seedPackets[selected.id]}개 보유`)}</p>
                    <div class="garden-stage" aria-label="성장 ${plot?.stage ?? 0}/3">${[0, 1, 2, 3].map((stage) => `<i class="${(plot?.stage ?? -1) >= stage ? 'on' : ''}"></i>`).join('')}</div>
                    <button data-action="${action}" data-plot="${index}">${actionLabel}</button>
                  </div>
                </article>`;
              }).join('')}
            </div>
          </div>

          <aside class="garden-seed-bank">
            <div class="garden-section-head">
              <div><span>SEED INDEX</span><h3>씨앗 서랍</h3></div>
              <p>${progress.unlockedSeeds}/12 해금</p>
            </div>
            <div class="garden-seeds">
              ${GARDEN_SEEDS.map((seed) => {
                const unlocked = gardenSeedUnlocked(state, seed.id);
                const selectedClass = seed.id === this.selectedSeedId ? 'selected' : '';
                return `<button class="garden-seed ${selectedClass}" data-seed="${seed.id}" ${unlocked ? '' : 'disabled'} style="--seed:${seed.bloom};--leaf:${seed.leaf}">
                  <i></i><span><b>${unlocked ? escapeHtml(seed.name) : `수확 ${seed.unlockAt}회`}</b><small>${unlocked ? `${state.seedPackets[seed.id]}봉투 · ${rarityLabel(seed.rarity)}` : '아직 잠든 씨앗'}</small></span>
                </button>`;
              }).join('')}
            </div>
            <div class="garden-next">
              <span>NEXT DELIVERY</span>
              <b>${nextSeed ? `${nextSeed.name} · 수확 ${nextSeed.unlockAt}회` : '모든 씨앗 배송 완료'}</b>
              <i><em style="width:${nextSeed ? Math.min(100, progress.totalHarvests / nextSeed.unlockAt * 100) : 100}%"></em></i>
            </div>
          </aside>
        </div>

        <section class="garden-specimens">
          <div class="garden-section-head">
            <div><span>SPECIMEN DRAWER</span><h3>36칸 식물 표본함</h3></div>
            <p>같은 씨앗도 심는 순서에 따라 세 가지 결로 자라요.</p>
          </div>
          <div class="garden-specimen-grid">
            ${GARDEN_SEEDS.flatMap((seed) => GARDEN_VARIANTS.map((variant) => {
              const key = gardenSpecimenKey(seed.id, variant.id);
              const collected = specimenSet.has(key);
              return `<div class="garden-specimen ${collected ? 'collected' : ''}" title="${escapeHtml(seed.name)} · ${variant.name}">
                <canvas data-specimen="${key}"></canvas><span>${collected ? seed.name : '미발견'}</span><small>${variant.name}</small>
              </div>`;
            })).join('')}
          </div>
        </section>

        <footer class="garden-footer">
          <p class="garden-feedback" aria-live="polite">${escapeHtml(this.feedback || (progress.totalHarvests === 0 ? '첫 씨앗을 골라 빈 화분에 심어 보세요.' : '정원 기록은 기기와 플레이어별로 안전하게 보관돼요.'))}</p>
          <div class="garden-footer-actions"><span>선택 · ${escapeHtml(selected.name)} / ${state.seedPackets[selected.id]}봉투</span><button data-action="kitchen" ${progress.pantryIngredients > 0 ? '' : 'disabled'}>골목 주방으로 보내기</button></div>
        </footer>
      </section>`;

    this.root.querySelectorAll<HTMLCanvasElement>('[data-plot-art]').forEach((canvas) => {
      const index = Number(canvas.dataset.plotArt);
      paintGardenPlot(canvas, state.plots[index] ?? null, this.selectedSeedId);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-specimen]').forEach((canvas) => {
      const [seedId, variantId] = canvas.dataset.specimen!.split(':') as [GardenSeedId, 'sun' | 'rain' | 'moon'];
      paintGardenSpecimen(canvas, seedId, variantId, specimenSet.has(canvas.dataset.specimen!));
    });
  }
}

function rarityLabel(rarity: string): string {
  return { common: '일반', uncommon: '정성', rare: '희귀', legendary: '전설' }[rarity] ?? rarity;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
