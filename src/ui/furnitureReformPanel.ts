import { CATALOG_BY_ID } from '../items/catalog';
import type { Placed } from '../game/entities/placement';
import type { QuestState } from '../game/questProgress';
import {
  DEFAULT_FURNITURE_REFORM, FURNITURE_COLOR_BY_ID, FURNITURE_FINISH_BY_ID,
  furnitureColorViews, furnitureFinishViews, isReformableFurniture,
  type FurnitureColorId, type FurnitureFinishId, type FurnitureReformProgress, type FurnitureReformStore,
} from '../game/home/furnitureReform';
import { paintFurnitureReformPreview, REFORM_PREVIEW_H, REFORM_PREVIEW_W } from '../game/art/furnitureReformArt';
import { villageLevelRewardViews } from '../game/progression/villageRewards';
import { requestStoryRewardViews } from '../game/progression/requestStoryRewards';
import { journeyChapterRewardViews } from '../game/progression/journeyChapterRewards';
import { starterMentorRewardViews } from '../game/progression/starterMentorRewards';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 실제 배치 가구를 골라 6×8 외형 조합을 적용하는 홈 리폼 공방. */
export class FurnitureReformPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private placements: Placed[] = [];
  private selectedPlacementId: string | null = null;
  private finishId: FurnitureFinishId = DEFAULT_FURNITURE_REFORM.finishId;
  private colorId: FurnitureColorId = DEFAULT_FURNITURE_REFORM.colorId;
  private feedback = '';

  constructor(private readonly store: FurnitureReformStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getQuestState: () => QuestState;
    getUnlockedBadgeIds: () => readonly string[];
    onApplied: (progress: FurnitureReformProgress) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-furniture-reform'; this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '골목 가구 리폼 공방');
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  get isOpen(): boolean { return this.opened; }

  open(placements: readonly Placed[]): void {
    if (this.opened) return;
    this.placements = placements.filter((placed) => isReformableFurniture(placed.itemId));
    this.selectedPlacementId = this.placements.find((placed) => this.store.styleFor(placed.id))?.id ?? this.placements[0]?.id ?? null;
    const current = this.selectedPlacementId ? this.store.styleFor(this.selectedPlacementId) : null;
    this.finishId = current?.finishId ?? DEFAULT_FURNITURE_REFORM.finishId;
    this.colorId = current?.colorId ?? DEFAULT_FURNITURE_REFORM.colorId;
    this.feedback = '';
    this.opened = true; this.root.style.display = 'flex'; this.render(); this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.reform-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false; this.root.style.display = 'none'; this.opts.onToggle(false);
  }

  refresh(placements: readonly Placed[]): void {
    this.placements = placements.filter((placed) => isReformableFurniture(placed.itemId));
    if (this.selectedPlacementId && !this.placements.some((placed) => placed.id === this.selectedPlacementId)) this.selectedPlacementId = this.placements[0]?.id ?? null;
    if (this.opened) this.render();
  }

  private render(): void {
    const progress = this.store.progress();
    const selected = this.placements.find((placed) => placed.id === this.selectedPlacementId) ?? null;
    const def = selected ? CATALOG_BY_ID.get(selected.itemId) : null;
    const finishes = furnitureFinishViews(this.opts.getQuestState());
    const colors = furnitureColorViews(this.opts.getQuestState());
    const rewardRecipes = villageLevelRewardViews(this.opts.getUnlockedBadgeIds());
    const storyRewardRecipes = requestStoryRewardViews(this.opts.getUnlockedBadgeIds());
    const journeyRewardRecipes = journeyChapterRewardViews(this.opts.getUnlockedBadgeIds());
    const mentorRewardRecipes = starterMentorRewardViews(this.opts.getUnlockedBadgeIds());
    const finish = FURNITURE_FINISH_BY_ID.get(this.finishId)!;
    const color = FURNITURE_COLOR_BY_ID.get(this.colorId)!;
    this.root.innerHTML = `<section class="reform-workshop">
      <header class="reform-head"><div><small>FURNITURE REFORM WORKSHOP</small><h2>골목 가구 리폼 공방</h2><p>배치한 가구의 색과 결만 바꿔요. 위치·소유권·홈 점수는 그대로입니다.</p></div><button class="reform-close">닫기</button></header>
      <div class="reform-stats"><span><b>${progress.combinations}</b>/${progress.totalCombinations} 조합</span><span><b>${progress.finishes}</b>/${progress.totalFinishes} 마감</span><span><b>${progress.colors}</b>/${progress.totalColors} 색감</span><span><b>${progress.saves}</b>회 리폼</span></div>
      ${selected && def ? `<div class="reform-layout">
        <aside class="reform-stage">
          <div class="reform-canvas-wrap"><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-reform-preview></canvas><span>${escapeHtml(finish.name)} · ${escapeHtml(color.name)}</span></div>
          <div class="reform-selected"><small>지금 고른 가구</small><h3>${escapeHtml(def.name)}</h3><p>${escapeHtml(finish.description)} · ${escapeHtml(color.description)}</p></div>
          <div class="reform-placement-strip">${this.placements.map((placed, index) => {
            const item = CATALOG_BY_ID.get(placed.itemId)!; const styled = this.store.styleFor(placed.id);
            return `<button data-reform-placement="${escapeHtml(placed.id)}" class="${placed.id === selected.id ? 'sel' : ''}"><i>${String(index + 1).padStart(2, '0')}</i><span><b>${escapeHtml(item.name)}</b><small>${styled ? `${FURNITURE_FINISH_BY_ID.get(styled.finishId)?.name} · ${FURNITURE_COLOR_BY_ID.get(styled.colorId)?.name}` : '기본 외형'}</small></span></button>`;
          }).join('')}</div>
        </aside>
        <main class="reform-controls">
          <section class="reform-reward-recipes"><header><div><small>VILLAGE LEVEL RECIPES</small><h3>마을 명찰 전용 레시피</h3></div><span>자동 수령 ${rewardRecipes.filter((view) => view.unlocked).length}/${rewardRecipes.length}</span></header>
            <div class="reform-recipe-grid">${rewardRecipes.map((view) => {
              const recipeFinish = FURNITURE_FINISH_BY_ID.get(view.homeRecipe.style.finishId)!;
              const recipeColor = FURNITURE_COLOR_BY_ID.get(view.homeRecipe.style.colorId)!;
              const selectedRecipe = this.finishId === view.homeRecipe.style.finishId && this.colorId === view.homeRecipe.style.colorId;
              return `<button data-reform-recipe="${view.homeRecipe.id}" class="${selectedRecipe ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-color:${recipeColor.hex};--reform-dark:${recipeColor.dark}"><i>${view.level}</i><span><b>${escapeHtml(view.unlocked ? view.homeRecipe.name : `Lv.${view.level} 명찰 레시피`)}</b><small>${escapeHtml(view.unlocked ? `${recipeFinish.name} · ${recipeColor.name}` : `${view.title} 자동 수령`)}</small></span></button>`;
            }).join('')}</div>
          </section>
          <section class="reform-reward-recipes reform-story-recipes"><header><div><small>STORY COMPLETION RECIPES</small><h3>연속 의뢰 완결 레시피</h3></div><span>자동 수령 ${storyRewardRecipes.filter((view) => view.unlocked).length}/${storyRewardRecipes.length}</span></header>
            <div class="reform-recipe-grid">${storyRewardRecipes.map((view) => {
              const recipeFinish = FURNITURE_FINISH_BY_ID.get(view.homeRecipe.style.finishId)!;
              const recipeColor = FURNITURE_COLOR_BY_ID.get(view.homeRecipe.style.colorId)!;
              const selectedRecipe = this.finishId === view.homeRecipe.style.finishId && this.colorId === view.homeRecipe.style.colorId;
              return `<button data-reform-story-recipe="${view.homeRecipe.id}" class="${selectedRecipe ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-color:${recipeColor.hex};--reform-dark:${recipeColor.dark}"><i>${escapeHtml(view.petAccessory.mark)}</i><span><b>${escapeHtml(view.unlocked ? view.homeRecipe.name : '완결 레시피')}</b><small>${escapeHtml(view.unlocked ? `${recipeFinish.name} · ${recipeColor.name}` : `${view.title} 완결 시 자동 수령`)}</small></span></button>`;
            }).join('')}</div>
          </section>
          <section class="reform-reward-recipes reform-story-recipes"><header><div><small>MAIN CHRONICLE RECIPES</small><h3>메인 여정 완결 레시피</h3></div><span>자동 수령 ${journeyRewardRecipes.filter((view) => view.unlocked).length}/${journeyRewardRecipes.length}</span></header>
            <div class="reform-recipe-grid">${journeyRewardRecipes.map((view) => {
              const recipeFinish = FURNITURE_FINISH_BY_ID.get(view.homeRecipe.style.finishId)!;
              const recipeColor = FURNITURE_COLOR_BY_ID.get(view.homeRecipe.style.colorId)!;
              const selectedRecipe = this.finishId === view.homeRecipe.style.finishId && this.colorId === view.homeRecipe.style.colorId;
              return `<button data-reform-journey-recipe="${view.homeRecipe.id}" class="${selectedRecipe ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-color:${recipeColor.hex};--reform-dark:${recipeColor.dark}"><i>${view.chapter}</i><span><b>${escapeHtml(view.unlocked ? view.homeRecipe.name : `제${view.chapter}장 레시피`)}</b><small>${escapeHtml(view.unlocked ? `${recipeFinish.name} · ${recipeColor.name}` : `메인 여정 제${view.chapter}장 완결 시 자동 수령`)}</small></span></button>`;
            }).join('')}</div>
          </section>
          <section class="reform-reward-recipes reform-story-recipes"><header><div><small>FIRST LIFE MENTOR RECIPES</small><h3>첫 생활 멘토 완주 레시피</h3></div><span>자동 수령 ${mentorRewardRecipes.filter((view) => view.unlocked).length}/${mentorRewardRecipes.length}</span></header>
            <div class="reform-recipe-grid">${mentorRewardRecipes.map((view) => {
              const recipeFinish = FURNITURE_FINISH_BY_ID.get(view.homeRecipe.style.finishId)!;
              const recipeColor = FURNITURE_COLOR_BY_ID.get(view.homeRecipe.style.colorId)!;
              const selectedRecipe = this.finishId === view.homeRecipe.style.finishId && this.colorId === view.homeRecipe.style.colorId;
              return `<button data-reform-mentor-recipe="${view.homeRecipe.id}" class="${selectedRecipe ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-color:${recipeColor.hex};--reform-dark:${recipeColor.dark}"><i>${escapeHtml(view.petAccessory.mark)}</i><span><b>${escapeHtml(view.unlocked ? view.homeRecipe.name : '멘토 완주 레시피')}</b><small>${escapeHtml(view.unlocked ? `${recipeFinish.name} · ${recipeColor.name}` : `${view.title} 완주 시 자동 수령`)}</small></span></button>`;
            }).join('')}</div>
          </section>
          <section><header><div><small>STEP 01</small><h3>재질 마감</h3></div><span>해금 ${finishes.filter((view) => view.unlocked).length}/${finishes.length}</span></header>
            <div class="reform-finish-grid">${finishes.map((view, index) => `<button data-reform-finish="${view.option.id}" class="${this.finishId === view.option.id ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-index:${index}"><i>${escapeHtml(view.option.mark)}</i><span><b>${escapeHtml(view.option.name)}</b><small>${escapeHtml(view.unlocked ? view.option.description : `${view.hint} · ${view.current}/${view.goal}`)}</small></span></button>`).join('')}</div>
          </section>
          <section><header><div><small>STEP 02</small><h3>색감 팔레트</h3></div><span>해금 ${colors.filter((view) => view.unlocked).length}/${colors.length}</span></header>
            <div class="reform-color-grid">${colors.map((view, index) => `<button data-reform-color="${view.option.id}" class="${this.colorId === view.option.id ? 'sel' : ''} ${view.unlocked ? '' : 'locked'}" ${view.unlocked ? '' : 'disabled'} style="--reform-color:${view.option.hex};--reform-dark:${view.option.dark};--reform-index:${index}"><i></i><span><b>${escapeHtml(view.option.name)}</b><small>${escapeHtml(view.unlocked ? view.option.description : `${view.hint} · ${view.current}/${view.goal}`)}</small></span></button>`).join('')}</div>
          </section>
          <div class="reform-apply-row"><div><small>선택 조합</small><b>${escapeHtml(finish.name)} × ${escapeHtml(color.name)}</b>${this.feedback ? `<p aria-live="polite">${escapeHtml(this.feedback)}</p>` : ''}</div><button data-reform-apply>이 가구에 적용하기</button></div>
        </main>
      </div>` : `<div class="reform-empty"><b>리폼할 수 있는 가구가 아직 없어요.</b><p>가구·가전·소품·러그·벽장식을 방에 하나 배치하면 공방 작업대에 나타납니다. 식물과 생물이 사는 어항은 원래 모습을 지켜 드려요.</p></div>`}
    </section>`;
    this.root.querySelector('.reform-close')!.addEventListener('click', () => this.close());
    if (!selected) return;
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-reform-preview]');
    if (canvas) paintFurnitureReformPreview(canvas, selected.itemId, { finishId: this.finishId, colorId: this.colorId });
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-placement]').forEach((button) => button.addEventListener('click', () => {
      this.selectedPlacementId = button.dataset.reformPlacement!;
      const style = this.store.styleFor(this.selectedPlacementId);
      this.finishId = style?.finishId ?? DEFAULT_FURNITURE_REFORM.finishId; this.colorId = style?.colorId ?? DEFAULT_FURNITURE_REFORM.colorId;
      this.feedback = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-recipe]').forEach((button) => button.addEventListener('click', () => {
      const reward = rewardRecipes.find((view) => view.homeRecipe.id === button.dataset.reformRecipe);
      if (!reward?.unlocked) return;
      this.finishId = reward.homeRecipe.style.finishId; this.colorId = reward.homeRecipe.style.colorId;
      this.feedback = `Lv.${reward.level} 「${reward.homeRecipe.name}」 레시피를 골랐어요.`; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-story-recipe]').forEach((button) => button.addEventListener('click', () => {
      const reward = storyRewardRecipes.find((view) => view.homeRecipe.id === button.dataset.reformStoryRecipe);
      if (!reward?.unlocked) return;
      this.finishId = reward.homeRecipe.style.finishId; this.colorId = reward.homeRecipe.style.colorId;
      this.feedback = `연속 의뢰 「${reward.homeRecipe.name}」 레시피를 골랐어요.`; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-journey-recipe]').forEach((button) => button.addEventListener('click', () => {
      const reward = journeyRewardRecipes.find((view) => view.homeRecipe.id === button.dataset.reformJourneyRecipe);
      if (!reward?.unlocked) return;
      this.finishId = reward.homeRecipe.style.finishId; this.colorId = reward.homeRecipe.style.colorId;
      this.feedback = `메인 여정 제${reward.chapter}장 「${reward.homeRecipe.name}」 레시피를 골랐어요.`; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-mentor-recipe]').forEach((button) => button.addEventListener('click', () => {
      const reward = mentorRewardRecipes.find((view) => view.homeRecipe.id === button.dataset.reformMentorRecipe);
      if (!reward?.unlocked) return;
      this.finishId = reward.homeRecipe.style.finishId; this.colorId = reward.homeRecipe.style.colorId;
      this.feedback = `첫 생활 「${reward.homeRecipe.name}」 레시피를 골랐어요.`; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-finish]').forEach((button) => button.addEventListener('click', () => { this.finishId = button.dataset.reformFinish as FurnitureFinishId; this.feedback = ''; this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-reform-color]').forEach((button) => button.addEventListener('click', () => { this.colorId = button.dataset.reformColor as FurnitureColorId; this.feedback = ''; this.render(); }));
    this.root.querySelector('[data-reform-apply]')?.addEventListener('click', () => {
      const result = this.store.apply(
        selected.id,
        selected.itemId,
        { finishId: this.finishId, colorId: this.colorId },
        this.opts.getQuestState(),
        this.opts.getUnlockedBadgeIds(),
      );
      this.feedback = result.ok ? (result.newCombination ? '새 조합이 48칸 리폼 도감에 기록됐어요.' : '익숙한 조합으로 다시 단장했어요.') : '아직 이 조합을 사용할 수 없어요.';
      if (result.ok) this.opts.onApplied(this.store.progress());
      this.render();
    });
  }

  destroy(): void { this.root.remove(); }
}
