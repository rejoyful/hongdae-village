import { audio } from '../game/audio';
import { paintCookingDish } from '../game/art/cookingArt';
import {
  COOKING_RECIPES, cookingPlateKey, cookingRecipeById, initialCookingRecipeId,
  type CookingResult,
} from '../game/cooking/cooking';
import { CookingStore } from '../game/cooking/cookingStore';
import {
  GARDEN_VARIANTS, gardenSeedById, gardenSeedUnlocked, gardenVariantById,
  type GardenSeedId, type GardenVariantId,
} from '../game/garden/garden';
import { GardenStore } from '../game/garden/gardenStore';

export interface CookingPanelOptions {
  onToggle?: (open: boolean) => void;
  onChanged?: (result: CookingResult | null) => void;
  onOpenGarden?: () => void;
}

export class CookingPanel {
  private readonly root: HTMLDivElement;
  private selectedRecipeId: GardenSeedId = initialCookingRecipeId();
  private selectedVariantId: GardenVariantId = 'sun';
  private feedback = '';

  constructor(
    private readonly cooking: CookingStore,
    private readonly garden: GardenStore,
    private readonly opts: CookingPanelOptions = {},
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-cooking';
    this.root.style.display = 'none';
    this.root.addEventListener('click', (event) => this.handleClick(event));
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.root.style.display !== 'none'; }

  open(): void {
    this.feedback = '';
    this.ensureSelection();
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

  private ensureSelection(): void {
    const state = this.garden.get();
    if (!gardenSeedUnlocked(state, this.selectedRecipeId)) {
      this.selectedRecipeId = COOKING_RECIPES.find((recipe) => gardenSeedUnlocked(state, recipe.id))?.id ?? initialCookingRecipeId();
    }
    const selectedHasIngredient = GARDEN_VARIANTS.some((variant) => this.garden.ingredientCount(cookingPlateKey(this.selectedRecipeId, variant.id)) > 0);
    if (!selectedHasIngredient) {
      const readyRecipe = COOKING_RECIPES.find((recipe) => (
        gardenSeedUnlocked(state, recipe.id)
        && GARDEN_VARIANTS.some((variant) => this.garden.ingredientCount(cookingPlateKey(recipe.id, variant.id)) > 0)
      ));
      if (readyRecipe) this.selectedRecipeId = readyRecipe.id;
    }
    const available = GARDEN_VARIANTS.find((variant) => this.garden.ingredientCount(cookingPlateKey(this.selectedRecipeId, variant.id)) > 0);
    const cooked = GARDEN_VARIANTS.find((variant) => (this.cooking.get().dishCounts[cookingPlateKey(this.selectedRecipeId, variant.id)] ?? 0) > 0);
    if (available) this.selectedVariantId = available.id;
    else if (cooked) this.selectedVariantId = cooked.id;
  }

  private handleClick(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'close' || action === 'backdrop') {
      audio.playSe('click'); this.close(); return;
    }
    if (action === 'garden') {
      audio.playSe('click'); this.close(); this.opts.onOpenGarden?.(); return;
    }
    const recipeId = button.dataset.recipe as GardenSeedId | undefined;
    if (recipeId) {
      this.selectedRecipeId = recipeId;
      const available = GARDEN_VARIANTS.find((variant) => this.garden.ingredientCount(cookingPlateKey(recipeId, variant.id)) > 0);
      if (available) this.selectedVariantId = available.id;
      this.feedback = `${cookingRecipeById(recipeId).name} 조리 노트를 펼쳤어요.`;
      audio.playSe('click'); this.render(); return;
    }
    const variantId = button.dataset.variant as GardenVariantId | undefined;
    if (variantId) {
      this.selectedVariantId = variantId;
      this.feedback = `${gardenVariantById(variantId).name} 재료를 골랐어요.`;
      audio.playSe('click'); this.render(); return;
    }
    if (action === 'favorite') {
      const changed = this.cooking.toggleFavorite(this.selectedRecipeId);
      this.feedback = changed ? '단골 메뉴 서랍을 정리했어요.' : '단골 메뉴는 여섯 개까지만 고를 수 있어요.';
      if (changed) this.opts.onChanged?.(null);
      audio.playSe('click'); this.render(); return;
    }
    if (action === 'cook') this.cookSelected();
  }

  private cookSelected(): void {
    const result = this.cooking.cook(this.selectedRecipeId, this.selectedVariantId, this.garden);
    if (!result.ok) {
      this.feedback = '이 결의 식재료가 없어요. 정원에서 같은 결의 식물을 한 번 수확해 주세요.';
      audio.playSe('click'); this.render(); return;
    }
    const recipe = cookingRecipeById(result.recipeId);
    const variant = gardenVariantById(result.variantId);
    this.feedback = `${recipe.name} · ${variant.name} 접시를 ${result.firstPlate ? '새로 기록했어요.' : `${result.servings}번째로 완성했어요.`}`;
    audio.playSe('success');
    this.opts.onChanged?.(result);
    this.render();
  }

  private render(): void {
    const gardenState = this.garden.get();
    const gardenProgress = this.garden.progress();
    const cookingState = this.cooking.get();
    const progress = this.cooking.progress();
    const recipe = cookingRecipeById(this.selectedRecipeId);
    const ingredientKey = cookingPlateKey(this.selectedRecipeId, this.selectedVariantId);
    const ingredientCount = this.garden.ingredientCount(ingredientKey);
    const recipeDiscovered = GARDEN_VARIANTS.some((variant) => (cookingState.dishCounts[cookingPlateKey(recipe.id, variant.id)] ?? 0) > 0);
    const favorite = cookingState.favorites.includes(recipe.id);
    const plateKeys = new Set(Object.keys(cookingState.dishCounts).filter((key) => cookingState.dishCounts[key]! > 0));
    this.root.innerHTML = `
      <button class="cooking-backdrop" data-action="backdrop" aria-label="골목 주방 닫기"></button>
      <section class="cooking-shell" role="dialog" aria-modal="true" aria-label="모퉁이 골목 주방">
        <header class="cooking-head">
          <div>
            <span class="cooking-eyebrow">CORNER KITCHEN · FIELD TO TABLE</span>
            <h2>모퉁이 골목 주방</h2>
            <p>정원에서 수확한 성장 결 하나가 한 접시가 됩니다. 실패 없이 만들고, 마음에 든 여섯 메뉴는 단골 서랍에 꽂아 두세요.</p>
          </div>
          <button class="cooking-close" data-action="close" aria-label="닫기">×</button>
        </header>

        <div class="cooking-ledger" aria-label="요리 진행도">
          <div><span>완성 접시</span><b>${progress.totalCooked}</b></div>
          <div><span>발견 메뉴</span><b>${progress.recipesDiscovered}<i>/${progress.totalRecipes}</i></b></div>
          <div><span>플레이팅 노트</span><b>${progress.platesDiscovered}<i>/${progress.totalPlates}</i></b></div>
          <div><span>식재료 창고</span><b>${gardenProgress.pantryIngredients}</b></div>
        </div>

        <div class="cooking-workspace">
          <div class="cooking-pass">
            <div class="cooking-dish-art">
              <canvas data-cooking-hero aria-label="${escapeHtml(recipe.name)} 픽셀 요리"></canvas>
              <span>${gardenVariantById(this.selectedVariantId).name}</span>
            </div>
            <div class="cooking-order">
              <span class="cooking-kicker">TODAY'S TEST PLATE</span>
              <h3>${escapeHtml(recipe.name)}</h3>
              <b>${escapeHtml(recipe.subtitle)}</b>
              <p>${escapeHtml(recipe.note)}</p>
              <dl><div><dt>기본 팬트리</dt><dd>${escapeHtml(recipe.basePantry)}</dd></div><div><dt>정원 영감</dt><dd>${escapeHtml(gardenSeedById(recipe.id).name)}</dd></div></dl>
              <div class="cooking-variants" aria-label="성장 결 재료 선택">
                ${GARDEN_VARIANTS.map((variant) => {
                  const count = this.garden.ingredientCount(cookingPlateKey(recipe.id, variant.id));
                  return `<button class="${variant.id === this.selectedVariantId ? 'selected' : ''}" data-variant="${variant.id}"><i></i><span>${variant.name}</span><b>${count}</b></button>`;
                }).join('')}
              </div>
              ${gardenProgress.pantryIngredients === 0 && progress.totalCooked === 0 ? `<div class="cooking-empty"><b>아직 식재료 창고가 비어 있어요.</b><span>정원 식물을 수확하면 성장 결 재료가 한 개씩 도착합니다.</span><button data-action="garden">정원에서 첫 재료 수확하기</button></div>` : `
                <div class="cooking-actions">
                  <button class="cooking-favorite ${favorite ? 'active' : ''}" data-action="favorite" ${recipeDiscovered ? '' : 'disabled'}>${favorite ? '단골 메뉴에서 빼기' : '단골 메뉴로 고르기'}</button>
                  <button class="cooking-make" data-action="cook" ${ingredientCount > 0 ? '' : 'disabled'}>${ingredientCount > 0 ? `${gardenVariantById(this.selectedVariantId).name} 한 접시 만들기` : '선택한 결 재료 없음'}</button>
                </div>${gardenProgress.pantryIngredients === 0 ? '<small class="cooking-pantry-note">재료를 모두 사용했어요. 완성 메뉴는 단골로 고를 수 있고, 정원에서 다음 재료를 가져올 수 있어요.</small>' : ''}`}
            </div>
          </div>

          <aside class="cooking-recipes">
            <div class="cooking-section-head"><div><span>RECIPE RAIL</span><h3>열두 장의 메뉴 카드</h3></div><p>${COOKING_RECIPES.filter((item) => gardenSeedUnlocked(gardenState, item.id)).length}/12 공개</p></div>
            <div class="cooking-recipe-list">
              ${COOKING_RECIPES.map((item, index) => {
                const unlocked = gardenSeedUnlocked(gardenState, item.id);
                const ingredientTotal = GARDEN_VARIANTS.reduce((sum, variant) => sum + this.garden.ingredientCount(cookingPlateKey(item.id, variant.id)), 0);
                const collected = GARDEN_VARIANTS.filter((variant) => plateKeys.has(cookingPlateKey(item.id, variant.id))).length;
                return `<button class="cooking-recipe ${item.id === recipe.id ? 'selected' : ''}" data-recipe="${item.id}" ${unlocked ? '' : 'disabled'} style="--recipe-index:${index}">
                  <i>${String(index + 1).padStart(2, '0')}</i><span><b>${unlocked ? escapeHtml(item.name) : `수확 ${gardenSeedById(item.id).unlockAt}회에 공개`}</b><small>${unlocked ? `재료 ${ingredientTotal} · 플레이팅 ${collected}/3` : '아직 잠긴 조리 노트'}</small></span>
                </button>`;
              }).join('')}
            </div>
          </aside>
        </div>

        <section class="cooking-book">
          <div class="cooking-section-head"><div><span>PLATING ARCHIVE</span><h3>36칸 플레이팅 노트</h3></div><p>같은 메뉴도 정원의 성장 결에 따라 색과 장식이 달라집니다.</p></div>
          <div class="cooking-plate-grid">
            ${COOKING_RECIPES.flatMap((item) => GARDEN_VARIANTS.map((variant) => {
              const key = cookingPlateKey(item.id, variant.id);
              const collected = plateKeys.has(key);
              return `<div class="cooking-plate ${collected ? 'collected' : ''}" title="${escapeHtml(item.name)} · ${variant.name}">
                <canvas data-cooking-plate="${key}"></canvas><span>${collected ? escapeHtml(item.name) : '미완성'}</span><small>${variant.name}${collected && (cookingState.dishCounts[key] ?? 0) > 1 ? ` · ${cookingState.dishCounts[key]}접시` : ''}</small>
              </div>`;
            })).join('')}
          </div>
        </section>

        <footer class="cooking-footer">
          <p class="cooking-feedback" aria-live="polite">${escapeHtml(this.feedback || (gardenProgress.pantryIngredients === 0 && progress.totalCooked === 0 ? '정원 수확물이 생기면 이곳에서 첫 메뉴를 만들 수 있어요.' : gardenProgress.pantryIngredients === 0 ? '재료를 모두 사용했어요. 완성 기록은 남아 있고 정원에서 다음 재료를 가져올 수 있어요.' : '식재료는 소비되지만 완성한 플레이팅 기록은 영구히 남아요.'))}</p>
          <button data-action="garden">옥상 씨앗 연구소로 이동</button>
        </footer>
      </section>`;

    const hero = this.root.querySelector<HTMLCanvasElement>('[data-cooking-hero]');
    if (hero) paintCookingDish(hero, recipe.id, this.selectedVariantId, true);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-cooking-plate]').forEach((canvas) => {
      const [recipeId, variantId] = canvas.dataset.cookingPlate!.split(':') as [GardenSeedId, GardenVariantId];
      paintCookingDish(canvas, recipeId, variantId, plateKeys.has(canvas.dataset.cookingPlate!));
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
