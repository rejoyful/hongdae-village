import type { PetStore } from '../game/pets/petStore';
import { petById } from '../game/pets/pets';
import { PET_PERSONALITIES, type PetAccessoryId, type PetPersonalityId } from '../game/pets/petProfiles';
import {
  PET_STYLE_BACKDROPS, PET_STYLE_FEATURED_MAX, PET_STYLE_POSES, PET_STYLE_SLOT_COUNT,
  PetStyleStudioStore, type PetStyleBackdropId, type PetStyleDraft, type PetStylePoseId,
  type PetStyleStudioProgress,
} from '../game/pets/petStyleStudio';
import {
  PET_STYLE_ART_H, PET_STYLE_ART_W, paintPetStyleCard,
} from '../game/art/petStyleStudioArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class PetStyleStudioPanel {
  private readonly root: HTMLDivElement;
  private petStore: PetStore | null = null;
  private opened = false;
  private selectedSlot = 0;
  private selectedPetId: string | null = null;
  private personalityId: PetPersonalityId = 'gentle';
  private accessoryId: PetAccessoryId = 'none';
  private backdropId: PetStyleBackdropId = PET_STYLE_BACKDROPS[0].id;
  private poseId: PetStylePoseId = PET_STYLE_POSES[0].id;
  private feedback = '';
  private pendingOverwrite = false;

  constructor(private readonly store: PetStyleStudioStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    onApply: (draft: PetStyleDraft) => boolean;
    onChanged: (progress: PetStyleStudioProgress) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-pet-style-studio';
    this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '동행 코디 카드 아틀리에');
    document.body.appendChild(this.root);
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  get isOpen(): boolean { return this.opened; }

  open(petStore: PetStore, initialPetId?: string): void {
    const owned = petStore.owned();
    const petId = initialPetId && petStore.isOwned(initialPetId)
      ? initialPetId
      : petStore.activeId() ?? owned[0] ?? null;
    if (this.opened || !petId) return;
    this.petStore = petStore;
    this.opened = true;
    this.feedback = '';
    this.pendingOverwrite = false;
    this.selectPet(petId);
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.pet-style-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(): void { if (this.opened) this.render(); }

  private selectPet(petId: string): void {
    if (!this.petStore?.isOwned(petId)) return;
    this.selectedPetId = petId;
    this.personalityId = this.petStore.personality(petId);
    this.accessoryId = this.petStore.accessory(petId);
  }

  private draft(): PetStyleDraft | null {
    const petId = this.selectedPetId;
    const species = petById(petId);
    if (!petId || !species || !this.petStore?.isOwned(petId)) return null;
    return {
      petId,
      petName: this.petStore.displayName(petId),
      personalityId: this.personalityId,
      accessoryId: this.accessoryId,
      backdropId: this.backdropId,
      poseId: this.poseId,
    };
  }

  private render(): void {
    const petStore = this.petStore;
    const draft = this.draft();
    if (!petStore || !draft) { this.close(); return; }
    const state = this.store.get();
    const progress = this.store.progress();
    const selectedSaved = state.slots[this.selectedSlot];
    const accessories = petStore.accessoryViews(draft.petId);
    const canApply = accessories.some((item) => item.id === draft.accessoryId && item.unlocked);
    this.root.innerHTML = `<section class="pet-style-book">
      <header><div><small>COMPANION · PERSONALITY · ACCESSORY · SCENE</small><h1>동행 코디 카드 아틀리에</h1><p>지금의 성격과 장식을 여섯 장에 보존하고, 저장한 코디를 실제 동행에게 다시 입혀요.</p></div>
        <aside><span><b>${progress.savedCards}</b>/${PET_STYLE_SLOT_COUNT} 카드</span><span><b>${progress.discoveries}</b> 디자인</span><span><b>${progress.featured}</b>/${PET_STYLE_FEATURED_MAX} 대표</span></aside>
        <button class="pet-style-close" aria-label="닫기">×</button></header>
      <div class="pet-style-layout">
        <aside class="pet-style-pickers">
          <section><header><small>MY COMPANIONS</small><h2>오늘의 동행</h2></header><div class="pet-style-pets">${petStore.owned().map((petId) => {
            const species = petById(petId);
            return species ? `<button data-pet-style-pet="${petId}" class="${petId === draft.petId ? 'is-selected' : ''}"><i>${species.emoji}</i><span><small>${escapeHtml(species.name)}</small><b>${escapeHtml(petStore.displayName(petId))}</b></span></button>` : '';
          }).join('')}</div></section>
          <section><header><small>SIX PERSONALITIES</small><h2>장면의 성격</h2></header><div class="pet-style-personalities">${PET_PERSONALITIES.map((item) => `<button data-pet-style-personality="${item.id}" class="${item.id === draft.personalityId ? 'is-selected' : ''}"><i>${item.mark}</i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.description)}</small></span></button>`).join('')}</div></section>
          <section><header><small>UNLOCKED ACCESSORIES</small><h2>장식 도감</h2></header><div class="pet-style-accessories">${accessories.map((item) => `<button data-pet-style-accessory="${item.id}" class="${item.id === draft.accessoryId ? 'is-selected' : ''} ${item.unlocked ? '' : 'is-locked'}" ${item.unlocked ? '' : 'disabled'}><i>${item.mark}</i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.unlocked ? item.description : `${item.hint} · ${item.progress}/${item.goal}`)}</small></span></button>`).join('')}</div></section>
        </aside>
        <main class="pet-style-stage">
          <header><div><small>LIVE 2.5D STYLE CARD</small><h2>${escapeHtml(draft.petName)}의 오늘 장면</h2><p>${escapeHtml(PET_STYLE_BACKDROPS.find((item) => item.id === draft.backdropId)!.name)} · ${escapeHtml(PET_STYLE_POSES.find((item) => item.id === draft.poseId)!.name)}</p></div><strong>${this.selectedSlot + 1}<small>저장 칸</small></strong></header>
          <canvas width="${PET_STYLE_ART_W}" height="${PET_STYLE_ART_H}" data-pet-style-preview aria-label="${escapeHtml(draft.petName)} 동행 코디 미리보기"></canvas>
          <section class="pet-style-scenes"><div><small>SIX BACKDROPS</small><h3>장면 배경</h3>${PET_STYLE_BACKDROPS.map((item) => `<button data-pet-style-backdrop="${item.id}" class="${item.id === draft.backdropId ? 'is-selected' : ''}" style="--pet-style-color:${item.colors[2]}"><i>${item.mark}</i><span><b>${item.name}</b><small>${item.note}</small></span></button>`).join('')}</div>
            <div><small>FIVE POSES</small><h3>오늘의 포즈</h3>${PET_STYLE_POSES.map((item) => `<button data-pet-style-pose="${item.id}" class="${item.id === draft.poseId ? 'is-selected' : ''}"><i>${item.mark}</i><span><b>${item.name}</b><small>${item.note}</small></span></button>`).join('')}</div></section>
          ${this.feedback ? `<p role="status">${escapeHtml(this.feedback)}</p>` : ''}
          <footer><button data-pet-style-apply ${canApply ? '' : 'disabled'}>이 코디로 함께 걷기</button><button data-pet-style-save class="${this.pendingOverwrite ? 'is-confirm' : ''}">${this.pendingOverwrite ? '한 번 더 눌러 교체 확정' : selectedSaved ? `슬롯 ${this.selectedSlot + 1} 현재 장면으로 교체` : `슬롯 ${this.selectedSlot + 1}에 카드 저장`}</button></footer>
        </main>
      </div>
      <section class="pet-style-archive"><header><div><small>SIX STYLE SNAPSHOTS</small><h2>동행 코디 보관함</h2></div><p>대표는 세 장까지 · 교체해도 과거 디자인 발견은 그대로</p></header><div>${state.slots.map((card, slot) => {
        const featured = !!card && state.featuredIds.includes(card.id);
        return `<article class="${card ? 'is-saved' : 'is-empty'} ${featured ? 'is-featured' : ''} ${slot === this.selectedSlot ? 'is-selected' : ''}">
          ${card ? `<canvas width="${PET_STYLE_ART_W}" height="${PET_STYLE_ART_H}" data-pet-style-card="${slot}" aria-label="${escapeHtml(card.petName)} 저장 코디 카드"></canvas>` : '<div class="pet-style-empty-art"><i>+</i><span>EMPTY LOOK</span></div>'}
          <section><header><span><small>SLOT ${slot + 1}</small><b>${card ? escapeHtml(card.petName) : '비어 있는 코디칸'}</b></span><em>${featured ? '★ 대표' : card ? escapeHtml(PET_STYLE_POSES.find((item) => item.id === card.poseId)!.name) : '새 카드 저장'}</em></header>
            <p>${card ? `${escapeHtml(PET_PERSONALITIES.find((item) => item.id === card.personalityId)!.name)} · ${escapeHtml(PET_STYLE_BACKDROPS.find((item) => item.id === card.backdropId)!.name)}` : '현재 동행의 성격과 장식을 독립 스냅샷으로 보존해요.'}</p>
            <footer><button data-pet-style-slot="${slot}">${slot === this.selectedSlot ? '선택됨' : card ? '카드 보기' : '이 칸 선택'}</button>${card ? `<button data-pet-style-feature="${card.id}" class="${featured ? 'is-featured' : ''}">${featured ? '★ 대표 해제' : '☆ 대표 전시'}</button>` : ''}</footer>
          </section>
        </article>`;
      }).join('')}</div></section>
      <footer>재료·확률·능력치 차이 없음 · 저장 카드는 독립 스냅샷 · 실제 적용은 현재 해금된 장식만</footer>
    </section>`;
    this.paint(draft);
    this.bind();
  }

  private paint(draft: PetStyleDraft): void {
    const preview = this.root.querySelector<HTMLCanvasElement>('[data-pet-style-preview]');
    if (preview) paintPetStyleCard(preview, draft);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-pet-style-card]').forEach((canvas) => {
      const card = this.store.card(Number(canvas.dataset.petStyleCard));
      if (card) paintPetStyleCard(canvas, card);
    });
  }

  private bind(): void {
    this.root.querySelector('.pet-style-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-pet]').forEach((button) => button.addEventListener('click', () => {
      this.selectPet(button.dataset.petStylePet!); this.pendingOverwrite = false; this.feedback = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-personality]').forEach((button) => button.addEventListener('click', () => {
      this.personalityId = button.dataset.petStylePersonality as PetPersonalityId; this.pendingOverwrite = false; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-accessory]:not(:disabled)').forEach((button) => button.addEventListener('click', () => {
      this.accessoryId = button.dataset.petStyleAccessory as PetAccessoryId; this.pendingOverwrite = false; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-backdrop]').forEach((button) => button.addEventListener('click', () => {
      this.backdropId = button.dataset.petStyleBackdrop as PetStyleBackdropId; this.pendingOverwrite = false; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-pose]').forEach((button) => button.addEventListener('click', () => {
      this.poseId = button.dataset.petStylePose as PetStylePoseId; this.pendingOverwrite = false; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-slot]').forEach((button) => button.addEventListener('click', () => {
      this.selectedSlot = Number(button.dataset.petStyleSlot);
      const card = this.store.card(this.selectedSlot);
      if (card && this.petStore?.isOwned(card.petId)) {
        this.selectedPetId = card.petId; this.personalityId = card.personalityId; this.accessoryId = card.accessoryId;
        this.backdropId = card.backdropId; this.poseId = card.poseId;
      }
      this.pendingOverwrite = false; this.feedback = ''; this.render();
    }));
    this.root.querySelector('[data-pet-style-save]')!.addEventListener('click', () => {
      const draft = this.draft();
      if (!draft) return;
      if (this.store.card(this.selectedSlot) && !this.pendingOverwrite) {
        this.pendingOverwrite = true;
        this.feedback = '기존 카드는 아직 그대로예요. 정말 바꾸려면 같은 버튼을 한 번 더 눌러 주세요.';
        this.render(); return;
      }
      const result = this.store.save(this.selectedSlot, draft);
      this.pendingOverwrite = false;
      this.feedback = result === 'replaced'
        ? `슬롯 ${this.selectedSlot + 1}을 현재 코디로 안전하게 교체했어요.`
        : `슬롯 ${this.selectedSlot + 1}에 ${draft.petName}의 오늘 코디를 보존했어요.`;
      this.opts.onChanged(this.store.progress());
      this.render();
    });
    this.root.querySelector('[data-pet-style-apply]')?.addEventListener('click', () => {
      const draft = this.draft();
      if (!draft) return;
      if (!this.opts.onApply(draft)) {
        this.feedback = '현재 동행에게 적용할 수 없는 장식이에요. 펫 프로필에서 해금 조건을 확인해 주세요.';
        this.render(); return;
      }
      this.store.recordApply();
      this.feedback = `${draft.petName}에게 이 성격과 장식을 적용했어요. 월드 동행 모습도 바로 바뀝니다.`;
      this.opts.onChanged(this.store.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-style-feature]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.feature(button.dataset.petStyleFeature!);
      this.feedback = result === 'featured' ? '대표 동행 코디에 올렸어요.'
        : result === 'cleared' ? '대표에서만 내렸어요. 저장 카드는 그대로예요.'
          : result === 'full' ? '대표 코디는 세 장까지예요. 한 장을 내린 뒤 다시 골라 주세요.'
            : '저장 카드를 다시 확인하지 못했어요.';
      this.opts.onChanged(this.store.progress());
      this.render();
    }));
  }

  destroy(): void { this.root.remove(); }
}
