import {
  PET_MEMORY_WALL_FRAMES, PET_MEMORY_WALL_LAYOUTS, PET_MEMORY_WALL_LIGHTS,
  PET_MEMORY_WALL_MAX, PetMemoryWallStore, type PetMemoryWallProgress,
} from '../game/home/petMemoryWall';
import {
  PET_MEET_SCENE_BY_ID, PetMeetPostcardStore,
} from '../game/social/petMeetPostcards';
import {
  PET_MEMORY_WALL_ART_H, PET_MEMORY_WALL_ART_W, paintPetMemoryWallArt,
} from '../game/art/petMemoryWallArt';
import { paintPetMeetPostcard } from '../game/art/petMeetPostcardArt';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export class PetMemoryWallPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private feedback = '';

  constructor(
    private readonly wallStore: PetMemoryWallStore,
    private readonly postcardStore: PetMeetPostcardStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      onChanged: (progress: PetMemoryWallProgress) => void;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-pet-memory-wall';
    this.root.style.display = 'none';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', '동행 추억 벽');
    document.body.appendChild(this.root);
    this.root.addEventListener('click', (event) => { if (event.target === this.root) this.close(); });
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') this.close();
    });
  }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.feedback = '';
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
    requestAnimationFrame(() => this.root.querySelector<HTMLButtonElement>('.pet-memory-close')?.focus());
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  refresh(): void { if (this.opened) this.render(); }

  private render(): void {
    const state = this.wallStore.get();
    const album = this.postcardStore.postcards();
    const progress = this.wallStore.progress();
    const frame = PET_MEMORY_WALL_FRAMES.find((item) => item.id === state.frameId)!;
    const light = PET_MEMORY_WALL_LIGHTS.find((item) => item.id === state.lightId)!;
    const layout = PET_MEMORY_WALL_LAYOUTS.find((item) => item.id === state.layoutId)!;
    this.root.innerHTML = `<section class="pet-memory-book" style="--pet-memory-glow:${light.colors[2]};--pet-memory-deep:${light.colors[0]}">
      <header>
        <div><small>COMPANION POSTCARDS → MY 2.5D ROOM</small><h1>동행 추억 벽</h1><p>이웃의 작은 친구와 남긴 엽서 세 장을 골라 실제 방 벽에 걸어요. 선택한 공개 스냅샷은 앨범이 바뀌어도 안전하게 남습니다.</p></div>
        <aside><span><b>${progress.featuredCards}</b>/3 전시</span><span><b>${progress.framesTried}</b>/4 액자</span><span><b>${progress.layoutsTried}</b>/4 배치</span></aside>
        <button class="pet-memory-close" aria-label="닫기">×</button>
      </header>
      <main>
        <section class="pet-memory-stage">
          <header><div><small>LIVE ROOM PREVIEW</small><h2>${escapeHtml(frame.name)}</h2><p>${escapeHtml(light.name)} · ${escapeHtml(layout.name)}</p></div><strong>${state.visible ? 'ON' : 'OFF'}<small>방 표시</small></strong></header>
          <canvas class="pet-memory-preview-canvas" width="${PET_MEMORY_WALL_ART_W}" height="${PET_MEMORY_WALL_ART_H}" aria-label="현재 동행 추억 벽 미리보기"></canvas>
          <div class="pet-memory-featured">${state.featured.length ? state.featured.map((record, index) => {
            const scene = PET_MEET_SCENE_BY_ID.get(record.kind);
            return `<span><i>${index + 1}</i><b>${escapeHtml(scene?.name ?? '동행의 한 장면')}</b><small>${escapeHtml(record.neighborNickname)} · ${escapeHtml(record.day)}</small></span>`;
          }).join('') : '<span class="is-empty"><i>0</i><b>비어 있는 추억 벽</b><small>아래 앨범에서 마음에 드는 엽서를 최대 세 장 골라 주세요.</small></span>'}</div>
          ${this.feedback ? `<p role="status">${escapeHtml(this.feedback)}</p>` : ''}
          <section class="pet-memory-album">
            <header><div><small>MY COMPANION POSTCARD ALBUM</small><h2>벽에 걸 엽서 고르기</h2></div><span>${album.length}장 보관 · ${state.featured.length}/${PET_MEMORY_WALL_MAX} 선택</span></header>
            ${album.length ? `<div>${album.map((record) => {
              const scene = PET_MEET_SCENE_BY_ID.get(record.kind);
              const selected = this.wallStore.isFeatured(record.id);
              return `<article class="${selected ? 'is-selected' : ''}">
                <canvas width="360" height="180" data-pet-memory-card="${escapeHtml(record.id)}" aria-label="${escapeHtml(scene?.name ?? '동행 엽서')} 미리보기"></canvas>
                <span><small>${escapeHtml(record.direction === 'sent' ? '보낸 엽서' : '받은 엽서')} · ${escapeHtml(record.day)}</small><b>${escapeHtml(scene?.name ?? '동행의 한 장면')}</b><em>${escapeHtml(record.neighborNickname)}의 동행과 함께</em></span>
                <button data-pet-memory-toggle="${escapeHtml(record.id)}">${selected ? '벽에서 내리기' : '추억 벽에 걸기'}</button>
              </article>`;
            }).join('')}</div>` : '<div class="pet-memory-album-empty"><b>아직 동행 인사 엽서가 없어요.</b><span>온라인 거리에서 이웃 명함을 열고 서로의 대표 동행에게 프리셋 인사를 건네면 앨범에 한 장씩 쌓입니다.</span></div>'}
          </section>
        </section>
        <aside class="pet-memory-controls">
          <section><header><small>FRAME MATERIAL</small><h2>액자 결</h2></header><div>${PET_MEMORY_WALL_FRAMES.map((entry) => `<button data-pet-memory-frame="${entry.id}" class="${entry.id === state.frameId ? 'is-selected' : ''}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.name}</b><em>${entry.note}</em></span></button>`).join('')}</div></section>
          <section><header><small>MEMORY LIGHT</small><h2>추억 조명</h2></header><div class="pet-memory-lights">${PET_MEMORY_WALL_LIGHTS.map((entry) => `<button data-pet-memory-light="${entry.id}" class="${entry.id === state.lightId ? 'is-selected' : ''}" style="--memory-light:${entry.colors[2]}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.name}</b><em>${entry.note}</em></span></button>`).join('')}</div></section>
          <section><header><small>CARD COMPOSITION</small><h2>세 장 배치</h2></header><div>${PET_MEMORY_WALL_LAYOUTS.map((entry) => `<button data-pet-memory-layout="${entry.id}" class="${entry.id === state.layoutId ? 'is-selected' : ''}"><i>${entry.mark}</i><span><small>${entry.code}</small><b>${entry.name}</b><em>${entry.note}</em></span></button>`).join('')}</div></section>
          <button class="pet-memory-visible ${state.visible ? 'is-visible' : ''}"><i>${state.visible ? 'ON' : 'OFF'}</i><span><b>${state.visible ? '실제 방에 추억 전시 중' : '벽면 전시를 잠시 쉬는 중'}</b><small>엽서와 꾸미기 발견 기록은 숨겨도 그대로 남아요.</small></span><strong>${state.visible ? '숨기기' : '보이기'}</strong></button>
        </aside>
      </main>
      <footer>자유 문구·펫 이름·코인·능력치·순위 공개 없음 · 가구 칸과 이동 공간을 차지하지 않는 벽면 전시</footer>
    </section>`;
    const preview = this.root.querySelector<HTMLCanvasElement>('.pet-memory-preview-canvas');
    if (preview) paintPetMemoryWallArt(preview, state);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-pet-memory-card]').forEach((canvas) => {
      const record = album.find((item) => item.id === canvas.dataset.petMemoryCard);
      if (record) paintPetMeetPostcard(canvas, record);
    });
    this.bind();
  }

  private bind(): void {
    this.root.querySelector('.pet-memory-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-memory-toggle]').forEach((button) => button.addEventListener('click', () => {
      const record = this.postcardStore.postcards().find((item) => item.id === button.dataset.petMemoryToggle);
      if (!record) return;
      const result = this.wallStore.toggle(record);
      this.feedback = result === 'featured'
        ? '엽서를 추억 벽에 걸었어요. 실제 방에도 바로 반영됩니다.'
        : result === 'unfeatured'
          ? '엽서를 벽에서 내렸어요. 원본 앨범에는 그대로 남아 있어요.'
          : result === 'full'
            ? '추억 벽은 세 장까지예요. 한 장을 내린 뒤 새 엽서를 골라 주세요.'
            : '이 엽서는 안전하게 읽을 수 없어 전시하지 않았어요.';
      if (result === 'featured' || result === 'unfeatured') this.opts.onChanged(this.wallStore.progress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-memory-frame]').forEach((button) => button.addEventListener('click', () => {
      const entry = PET_MEMORY_WALL_FRAMES.find((item) => item.id === button.dataset.petMemoryFrame);
      if (!entry || !this.wallStore.selectFrame(entry.id)) return;
      this.feedback = `「${entry.name}」으로 액자를 바꿨어요.`;
      this.changed();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-memory-light]').forEach((button) => button.addEventListener('click', () => {
      const entry = PET_MEMORY_WALL_LIGHTS.find((item) => item.id === button.dataset.petMemoryLight);
      if (!entry || !this.wallStore.selectLight(entry.id)) return;
      this.feedback = `「${entry.name}」 조명으로 추억의 온도를 바꿨어요.`;
      this.changed();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-memory-layout]').forEach((button) => button.addEventListener('click', () => {
      const entry = PET_MEMORY_WALL_LAYOUTS.find((item) => item.id === button.dataset.petMemoryLayout);
      if (!entry || !this.wallStore.selectLayout(entry.id)) return;
      this.feedback = `「${entry.name}」 배치로 세 장의 흐름을 바꿨어요.`;
      this.changed();
    }));
    this.root.querySelector('.pet-memory-visible')!.addEventListener('click', () => {
      const next = !this.wallStore.get().visible;
      this.wallStore.setVisible(next);
      this.feedback = next
        ? '동행 추억 벽을 실제 방에 다시 펼쳤어요.'
        : '벽면 전시만 잠시 숨겼어요. 엽서와 영구 기록은 그대로예요.';
      this.changed();
    });
  }

  private changed(): void {
    this.opts.onChanged(this.wallStore.progress());
    this.render();
  }

  destroy(): void { this.root.remove(); }
}
