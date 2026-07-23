import { PHOTO_CARD_H, PHOTO_CARD_W, renderPhotoCard, renderPhotoStrip } from '../game/art/photoArt';
import type { Appearance } from '../game/art/appearance';
import {
  PHOTO_ALBUM_CAPACITY, PHOTO_BACKDROPS, PHOTO_CAPTION_MAX, PHOTO_CARD_FEATURED_MAX,
  PHOTO_CARD_STICKER_MAX, PHOTO_FOILS, PHOTO_FRAMES, PHOTO_POSES, PHOTO_STICKERS,
  PhotoAlbumStore, photoFoilUnlocked, photoFrameUnlocked, photoStickerUnlocked, sanitizePhotoText,
  type PhotoAlbumProgress, type PhotoBackdropId, type PhotoCompanion, type PhotoDraft,
  type PhotoFoilId, type PhotoFrameId, type PhotoPoseId, type PhotoRecord, type PhotoStickerId,
} from '../game/photo/photoAlbum';

type PhotoTab = 'shoot' | 'album' | 'cards';

export interface PhotoBoothInput {
  appearance: Appearance;
  nickname: string;
  pet: PhotoCompanion | null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]!);
}

function withParticle(value: string): '과' | '와' {
  const last = Array.from(value).at(-1);
  if (!last) return '와';
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 0x2ba3 && code % 28 !== 0 ? '과' : '와';
}

/** 커스텀 캐릭터·동행 펫을 실제 픽셀 네컷으로 합성하고 12칸 앨범에 보존한다. */
export class PhotoBoothPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private tab: PhotoTab = 'shoot';
  private input: PhotoBoothInput | null = null;
  private frameId: PhotoFrameId = 'oatmeal';
  private backdropId: PhotoBackdropId = 'alley';
  private poseId: PhotoPoseId = 'hello';
  private includePet = true;
  private caption = '';
  private error = '';
  private pendingDeleteId: string | null = null;
  private selectedCardId: string | null = null;
  private selectedStickerIds: PhotoStickerId[] = [];
  private selectedFoilId: PhotoFoilId = 'paper';
  private cardFeedback = '';

  constructor(
    private readonly store: PhotoAlbumStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      onSaved: (record: PhotoRecord, progress: PhotoAlbumProgress) => void;
      onDeleted?: (progress: PhotoAlbumProgress) => void;
      onCardsChanged?: (progress: PhotoAlbumProgress) => void;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-photo';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(input: PhotoBoothInput): void {
    if (this.opened) return;
    this.input = { ...input, appearance: { ...input.appearance }, pet: input.pet ? { ...input.pet } : null };
    const recent = this.store.records()[0];
    const count = this.store.progress().count;
    this.frameId = recent && photoFrameUnlocked(recent.frameId, count) ? recent.frameId : 'oatmeal';
    this.backdropId = recent?.backdropId ?? 'alley';
    this.poseId = recent?.poseId ?? 'hello';
    this.includePet = !!input.pet;
    this.caption = '';
    this.error = '';
    this.pendingDeleteId = null;
    this.selectedCardId = recent?.id ?? null;
    const decoration = this.selectedCardId ? this.store.decorationFor(this.selectedCardId) : null;
    this.selectedStickerIds = decoration?.stickerIds ?? [];
    this.selectedFoilId = decoration?.foilId ?? 'paper';
    this.cardFeedback = '';
    this.tab = 'shoot';
    this.opened = true;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private draft(): PhotoDraft {
    return {
      frameId: this.frameId,
      backdropId: this.backdropId,
      poseId: this.poseId,
      caption: sanitizePhotoText(this.caption),
      appearance: { ...this.input!.appearance },
      nickname: sanitizePhotoText(this.input!.nickname, 12) || '마을 주민',
      pet: this.includePet && this.input!.pet ? { ...this.input!.pet } : null,
    };
  }

  private previewRecord(): PhotoRecord {
    return { id: 'preview', takenAt: new Date().toISOString(), ...this.draft() };
  }

  private shootHtml(): string {
    const progress = this.store.progress();
    const pet = this.input!.pet;
    const frames = PHOTO_FRAMES.map((frame) => {
      const unlocked = photoFrameUnlocked(frame.id, progress.count);
      return `<button class="photo-frame-option ${this.frameId === frame.id ? 'sel' : ''} ${unlocked ? '' : 'locked'}"
        data-frame="${frame.id}" ${unlocked ? '' : 'disabled'} style="--frame-paper:${frame.paper};--frame-ink:${frame.ink};--frame-accent:${frame.accent}">
        <i></i><span>${frame.name}</span><small>${unlocked ? '사용 가능' : `앨범 ${frame.unlockAt}장`}</small>
      </button>`;
    }).join('');
    const backdrops = PHOTO_BACKDROPS.map((backdrop, index) => `<button
      class="photo-backdrop-option ${this.backdropId === backdrop.id ? 'sel' : ''}" data-backdrop="${backdrop.id}" data-index="${index}">
      <i></i><span><b>${backdrop.name}</b><small>${backdrop.description}</small></span>
    </button>`).join('');
    const poses = PHOTO_POSES.map((pose) => `<button class="photo-pose-option ${this.poseId === pose.id ? 'sel' : ''}" data-pose="${pose.id}">
      <i></i><span>${pose.name}</span>
    </button>`).join('');
    const full = progress.count >= PHOTO_ALBUM_CAPACITY;
    return `<div class="photo-shoot-layout">
      <section class="photo-preview-stage">
        <div class="photo-stage-copy"><small>실시간 미리보기</small><b>${escapeHtml(this.input!.nickname)}의 네 컷</b></div>
        <div class="photo-strip-wrap"><canvas class="photo-strip-preview" aria-label="네컷 사진 미리보기"></canvas><i></i></div>
        <p>현재 모습과 장식이 사진에 그대로 남아요. 저장 뒤 캐릭터를 바꿔도 이 장면은 변하지 않습니다.</p>
      </section>
      <section class="photo-editor">
        <div class="photo-control-group"><header><span>프레임</span><small>${progress.count}장을 모으면 순서대로 열려요</small></header><div class="photo-frame-options">${frames}</div></div>
        <div class="photo-control-group"><header><span>배경</span><small>같은 포즈도 장소에 따라 다른 장면이 돼요</small></header><div class="photo-backdrop-options">${backdrops}</div></div>
        <div class="photo-control-group"><header><span>포즈</span><small>네 칸마다 조금씩 다른 움직임</small></header><div class="photo-pose-options">${poses}</div></div>
        <div class="photo-editor-tail">
          <label class="photo-caption-field"><span>한 줄 기록</span>
            <input value="${escapeHtml(this.caption)}" maxlength="${PHOTO_CAPTION_MAX}" placeholder="오늘 기억하고 싶은 말">
            <small><em class="photo-caption-count">${Array.from(this.caption).length}</em> / ${PHOTO_CAPTION_MAX}자 · 비워도 저장할 수 있어요</small>
          </label>
          <button class="photo-pet-toggle ${this.includePet ? 'on' : ''}" data-pet ${pet ? '' : 'disabled'} aria-pressed="${this.includePet}">
            <i></i><span><b>${pet ? `${escapeHtml(pet.name ?? '동행 펫')}도 함께` : '동행 펫이 없어요'}</b><small>${pet ? '사진 오른쪽에 나란히 서요' : '펫샵에서 동행을 정하면 함께 찍을 수 있어요'}</small></span>
          </button>
        </div>
        <p class="photo-error" role="status">${escapeHtml(this.error)}</p>
        <div class="photo-save-row"><span>앨범 ${progress.count} / ${progress.capacity}</span><button class="photo-save" ${full ? 'disabled' : ''}>${full ? '앨범을 정리해 주세요' : '이 네 컷 저장하기'}</button></div>
      </section>
    </div>`;
  }

  private albumHtml(): string {
    const records = this.store.records();
    const progress = this.store.progress();
    const featured = new Set(this.store.featuredIds());
    const summary = `<section class="photo-album-summary">
      <div><small>보관한 네컷</small><strong>${progress.count}<i>/ ${progress.capacity}</i></strong></div>
      <div><span><b>${progress.framesUsed}</b>사용한 프레임</span><span><b>${progress.backdropsUsed}</b>찾아간 배경</span><span><b>${progress.petPhotos}</b>펫과 찍은 날</span></div>
    </section>`;
    if (!records.length) {
      return `${summary}<section class="photo-album-empty"><div><i></i><i></i><i></i><i></i></div><small>아직 비어 있는 필름</small><b>첫 장면을 천천히 골라 보세요</b><p>촬영 탭에서 프레임과 배경, 포즈를 고른 뒤 저장하면 이곳에 오래 남습니다.</p><button data-tab="shoot">첫 네컷 준비하기</button></section>`;
    }
    const cards = records.map((record, index) => {
      const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }).format(new Date(record.takenAt));
      const frame = PHOTO_FRAMES.find((item) => item.id === record.frameId)!;
      const backdrop = PHOTO_BACKDROPS.find((item) => item.id === record.backdropId)!;
      const confirming = this.pendingDeleteId === record.id;
      return `<article class="photo-album-card ${featured.has(record.id) ? 'is-featured' : ''}" style="--photo-index:${index}">
        <div class="photo-album-strip"><canvas data-record="${record.id}" aria-label="${escapeHtml(record.caption || record.nickname)} 네컷"></canvas></div>
        <div class="photo-album-copy"><small>${date} · ${backdrop.name}${featured.has(record.id) ? ' · ★ 최애 전시' : ''}</small><b>${escapeHtml(record.caption || `${record.nickname}의 홍대마을`)}</b><span>${frame.name}${record.pet ? ` · ${escapeHtml(record.pet.name ?? '동행 펫')}${withParticle(record.pet.name ?? '동행 펫')} 함께` : ''}</span>
          <div><button data-card-edit="${record.id}">포토카드 꾸미기</button><button data-download="${record.id}">필름 PNG</button><button class="delete ${confirming ? 'confirm' : ''}" data-delete="${record.id}">${confirming ? '한 번 더 눌러 삭제' : '앨범에서 빼기'}</button></div>
        </div>
      </article>`;
    }).join('');
    return `${summary}<div class="photo-album-grid">${cards}</div>`;
  }

  private cardsHtml(): string {
    const records = this.store.records();
    const progress = this.store.progress();
    if (!records.length) {
      return `<section class="photo-card-empty"><small>COLLECTIBLE PHOTO CARDS</small><h3>꾸밀 필름이 아직 없어요</h3><p>먼저 촬영 탭에서 네컷 한 장을 남기면 스티커와 포일로 소장용 카드를 만들 수 있어요.</p><button data-tab="shoot">첫 네컷 준비하기</button></section>`;
    }
    if (!this.selectedCardId || !records.some((record) => record.id === this.selectedCardId)) {
      this.selectedCardId = records[0]!.id;
      const decoration = this.store.decorationFor(this.selectedCardId);
      this.selectedStickerIds = decoration.stickerIds;
      this.selectedFoilId = decoration.foilId;
    }
    const selected = records.find((record) => record.id === this.selectedCardId)!;
    const featured = new Set(this.store.featuredIds());
    const stickers = PHOTO_STICKERS.map((sticker) => {
      const unlocked = photoStickerUnlocked(sticker.id, progress.totalSaved);
      const active = this.selectedStickerIds.includes(sticker.id);
      return `<button data-card-sticker="${sticker.id}" class="${active ? 'sel' : ''} ${unlocked ? '' : 'locked'}" ${unlocked ? '' : 'disabled'} style="--sticker-color:${sticker.color}">
        <i>${sticker.mark}</i><span><b>${sticker.name}</b><small>${unlocked ? sticker.description : `누적 촬영 ${sticker.unlockAt}장`}</small></span>${active ? '<em>붙임</em>' : ''}
      </button>`;
    }).join('');
    const foils = PHOTO_FOILS.map((foil) => {
      const unlocked = photoFoilUnlocked(foil.id, progress.totalSaved);
      return `<button data-card-foil="${foil.id}" class="${this.selectedFoilId === foil.id ? 'sel' : ''} ${unlocked ? '' : 'locked'}" ${unlocked ? '' : 'disabled'} style="--foil-a:${foil.colors[0]};--foil-b:${foil.colors[1]};--foil-c:${foil.colors[2]}">
        <i>${foil.mark}</i><span><b>${foil.name}</b><small>${unlocked ? foil.description : `누적 촬영 ${foil.unlockAt}장`}</small></span>
      </button>`;
    }).join('');
    const rail = records.map((record, index) => `<button data-card-record="${record.id}" class="${record.id === selected.id ? 'sel' : ''} ${featured.has(record.id) ? 'featured' : ''}"><i>${String(index + 1).padStart(2, '0')}</i><span><b>${escapeHtml(record.caption || `${record.nickname}의 하루`)}</b><small>${PHOTO_BACKDROPS.find((item) => item.id === record.backdropId)?.name ?? '홍대마을'}${featured.has(record.id) ? ' · ★ 전시 중' : ''}</small></span></button>`).join('');
    return `<section class="photo-card-hero"><div><small>PIXEL PHOTOCARD SCRAPBOOK</small><h3>최애 장면 포토카드</h3><p>저장한 코디와 동행은 그대로 두고 카드 가장자리만 꾸며요. 능력치 차이 없이 최애 세 장을 자기소개처럼 전시할 수 있습니다.</p></div><aside><span><b>${progress.decoratedCards}</b>꾸민 카드</span><span><b>${progress.stickersUsed}</b>/12 스티커</span><span><b>${progress.featuredCards}</b>/${PHOTO_CARD_FEATURED_MAX} 최애 전시</span></aside></section>
      <section class="photo-card-workspace">
        <aside class="photo-card-rail"><header><small>12 FILM SLOTS</small><b>스크랩북 색인</b></header><div>${rail}</div></aside>
        <main class="photo-card-stage">
          <div class="photo-card-preview-wrap"><canvas width="${PHOTO_CARD_W}" height="${PHOTO_CARD_H}" data-photo-card-preview aria-label="${escapeHtml(selected.caption || selected.nickname)} 포토카드 미리보기"></canvas><span>${featured.has(selected.id) ? '★ 최애 전시 중' : '영구 소장 카드'}</span></div>
          <div class="photo-card-editor">
            <header><small>CARD ${String(records.indexOf(selected) + 1).padStart(2, '0')}</small><h3>${escapeHtml(selected.caption || `${selected.nickname}의 홍대마을`)}</h3><p>스티커는 최대 ${PHOTO_CARD_STICKER_MAX}개까지. 붙였다 떼어도 원본 필름은 변하지 않아요.</p></header>
            <section><div><b>포일 테두리</b><small>누적 촬영으로 영구 해금</small></div><div class="photo-foil-options">${foils}</div></section>
            <section><div><b>픽셀 스티커</b><small>${this.selectedStickerIds.length}/${PHOTO_CARD_STICKER_MAX} 선택</small></div><div class="photo-sticker-options">${stickers}</div></section>
            <p class="photo-card-feedback" role="status">${escapeHtml(this.cardFeedback)}</p>
            <footer><div><button data-card-download="${selected.id}">포토카드 PNG</button><button data-card-feature="${selected.id}" class="feature">${featured.has(selected.id) ? '최애 전시에서 내리기' : `최애로 전시 ${progress.featuredCards}/${PHOTO_CARD_FEATURED_MAX}`}</button></div><button class="save" data-card-save="${selected.id}">이 꾸밈 저장하기</button></footer>
          </div>
        </main>
      </section>`;
  }

  private render(): void {
    if (!this.input) return;
    const progress = this.store.progress();
    this.root.innerHTML = `<div class="photo-lab">
      <header class="photo-lab-head"><div><small>홍대 네컷 작업실</small><h2>오늘의 장면을 고르는 방</h2><p>옷과 펫, 배경을 조합해 나만의 픽셀 사진을 남겨요.</p></div><button class="photo-close" aria-label="닫기">닫기</button></header>
      <nav class="photo-tabs"><button data-tab="shoot" class="${this.tab === 'shoot' ? 'sel' : ''}">촬영</button><button data-tab="album" class="${this.tab === 'album' ? 'sel' : ''}">필름 앨범 <span>${progress.count}</span></button><button data-tab="cards" class="${this.tab === 'cards' ? 'sel' : ''}">포토카드 <span>${progress.decoratedCards}</span></button></nav>
      <div class="photo-lab-body">${this.tab === 'shoot' ? this.shootHtml() : this.tab === 'album' ? this.albumHtml() : this.cardsHtml()}</div>
    </div>`;
    this.bind();
    this.paintCanvases();
  }

  private bind(): void {
    this.root.querySelector('.photo-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      this.tab = button.dataset.tab as PhotoTab;
      this.error = '';
      this.cardFeedback = '';
      this.pendingDeleteId = null;
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-frame]').forEach((button) => button.addEventListener('click', () => {
      this.frameId = button.dataset.frame as PhotoFrameId; this.error = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-backdrop]').forEach((button) => button.addEventListener('click', () => {
      this.backdropId = button.dataset.backdrop as PhotoBackdropId; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach((button) => button.addEventListener('click', () => {
      this.poseId = button.dataset.pose as PhotoPoseId; this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-pet]')?.addEventListener('click', () => {
      this.includePet = !this.includePet; this.render();
    });
    const caption = this.root.querySelector<HTMLInputElement>('.photo-caption-field input');
    caption?.addEventListener('input', () => {
      this.caption = sanitizePhotoText(caption.value);
      caption.value = this.caption;
      const count = this.root.querySelector('.photo-caption-count'); if (count) count.textContent = String(Array.from(this.caption).length);
      this.paintPreview();
    });
    this.root.querySelector<HTMLButtonElement>('.photo-save')?.addEventListener('click', () => this.save());
    this.root.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => button.addEventListener('click', () => this.remove(button.dataset.delete!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-download]').forEach((button) => button.addEventListener('click', () => this.download(button.dataset.download!)));
    this.root.querySelectorAll<HTMLButtonElement>('[data-card-edit]').forEach((button) => button.addEventListener('click', () => {
      this.selectCard(button.dataset.cardEdit!); this.tab = 'cards'; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-card-record]').forEach((button) => button.addEventListener('click', () => {
      this.selectCard(button.dataset.cardRecord!); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-card-sticker]').forEach((button) => button.addEventListener('click', () => {
      this.toggleSticker(button.dataset.cardSticker as PhotoStickerId); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-card-foil]').forEach((button) => button.addEventListener('click', () => {
      this.selectedFoilId = button.dataset.cardFoil as PhotoFoilId; this.cardFeedback = ''; this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-card-save]')?.addEventListener('click', () => this.saveCard());
    this.root.querySelector<HTMLButtonElement>('[data-card-feature]')?.addEventListener('click', () => this.toggleCardFeatured());
    this.root.querySelector<HTMLButtonElement>('[data-card-download]')?.addEventListener('click', () => this.downloadCard());
  }

  private paintPreview(): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('.photo-strip-preview');
    if (canvas) renderPhotoStrip(canvas, this.previewRecord());
  }

  private paintCanvases(): void {
    this.paintPreview();
    const records = new Map(this.store.records().map((record) => [record.id, record]));
    this.root.querySelectorAll<HTMLCanvasElement>('canvas[data-record]').forEach((canvas) => {
      const record = records.get(canvas.dataset.record!);
      if (record) renderPhotoStrip(canvas, record);
    });
    const cardCanvas = this.root.querySelector<HTMLCanvasElement>('[data-photo-card-preview]');
    const selected = this.store.records().find((record) => record.id === this.selectedCardId);
    if (cardCanvas && selected) renderPhotoCard(cardCanvas, selected, {
      stickerIds: this.selectedStickerIds,
      foilId: this.selectedFoilId,
    });
  }

  private save(): void {
    const result = this.store.save(this.draft());
    if (!result.ok) {
      this.error = result.reason === 'full'
        ? '앨범 12칸이 모두 찼어요. 오래 남길 장면을 고른 뒤 한 장을 정리해 주세요.'
        : '아직 열리지 않은 프레임이에요. 먼저 사진을 더 모아 주세요.';
      this.render();
      return;
    }
    this.error = '';
    this.caption = '';
    this.selectedCardId = result.record.id;
    this.selectedStickerIds = [];
    this.selectedFoilId = 'paper';
    this.opts.onSaved(result.record, this.store.progress());
    this.tab = 'album';
    this.render();
  }

  private remove(id: string): void {
    if (this.pendingDeleteId !== id) { this.pendingDeleteId = id; this.render(); return; }
    if (this.store.remove(id)) this.opts.onDeleted?.(this.store.progress());
    this.pendingDeleteId = null;
    this.render();
  }

  private selectCard(recordId: string): void {
    if (!this.store.records().some((record) => record.id === recordId)) return;
    this.selectedCardId = recordId;
    const decoration = this.store.decorationFor(recordId);
    this.selectedStickerIds = decoration.stickerIds;
    this.selectedFoilId = decoration.foilId;
    this.cardFeedback = '';
  }

  private toggleSticker(stickerId: PhotoStickerId): void {
    if (this.selectedStickerIds.includes(stickerId)) {
      this.selectedStickerIds = this.selectedStickerIds.filter((id) => id !== stickerId);
      this.cardFeedback = '스티커를 떼었어요. 저장하기 전까지 원본 기록은 그대로예요.';
      return;
    }
    if (this.selectedStickerIds.length >= PHOTO_CARD_STICKER_MAX) {
      this.cardFeedback = `스티커는 세 개까지예요. 하나를 떼고 새 최애 표식을 골라 주세요.`;
      return;
    }
    this.selectedStickerIds.push(stickerId);
    this.cardFeedback = '카드 미리보기에 스티커를 붙였어요.';
  }

  private saveCard(): void {
    if (!this.selectedCardId) return;
    const result = this.store.decorate(this.selectedCardId, this.selectedStickerIds, this.selectedFoilId);
    if (!result.ok) {
      this.cardFeedback = result.reason === 'locked-sticker' ? '아직 열리지 않은 스티커가 섞여 있어요.'
        : result.reason === 'locked-foil' ? '아직 열리지 않은 포일이에요.' : '꾸밀 필름을 찾지 못했어요.';
      this.render();
      return;
    }
    this.cardFeedback = '포토카드 꾸밈을 영구 저장했어요. 원본 필름은 그대로 보존됩니다.';
    this.opts.onCardsChanged?.(this.store.progress());
    this.render();
  }

  private toggleCardFeatured(): void {
    if (!this.selectedCardId) return;
    const result = this.store.toggleFeatured(this.selectedCardId);
    this.cardFeedback = result === 'added' ? '최애 전시에 올렸어요. 세 장까지 나만의 대표 장면으로 남길 수 있어요.'
      : result === 'removed' ? '최애 전시에서만 내렸어요. 카드와 꾸밈 기록은 그대로예요.'
        : result === 'full' ? '최애 전시는 세 장까지예요. 한 장을 내린 뒤 다시 골라 주세요.' : '카드를 찾지 못했어요.';
    if (result === 'added' || result === 'removed') this.opts.onCardsChanged?.(this.store.progress());
    this.render();
  }

  private download(id: string): void {
    const record = this.store.records().find((item) => item.id === id);
    if (!record) return;
    const canvas = document.createElement('canvas');
    renderPhotoStrip(canvas, record);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `hongdae-village-${id}.png`;
    anchor.click();
  }

  private downloadCard(): void {
    const record = this.store.records().find((item) => item.id === this.selectedCardId);
    if (!record) return;
    const canvas = document.createElement('canvas');
    renderPhotoCard(canvas, record, { stickerIds: this.selectedStickerIds, foilId: this.selectedFoilId });
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `hongdae-photocard-${record.id}.png`;
    anchor.click();
  }

  destroy(): void { this.root.remove(); }
}
