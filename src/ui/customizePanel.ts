import {
  type Appearance, SKIN_TONES, SKIN_LABELS, HAIR_STYLES, HAIR_COLORS, HAIR_COLOR_LABELS,
  SHIRT_COLORS, PANTS_COLORS, GLASSES_STYLES, HAT_STYLES, TOP_STYLES, BOTTOM_STYLES,
  SHOE_STYLES, BACK_STYLES, ACCENT_COLORS, normalizeAppearance, randomAppearance,
  EYE_STYLES, MOUTH_STYLES, FACE_DETAILS, TOP_PATTERNS, SOCK_STYLES, appearanceCombinationCount,
} from '../game/art/appearance';
import {
  CLOSET_FEATURED_MAX, CLOSET_SLOT_COUNT, FASHION_PRESETS, applyFashionPreset, fashionPresetViews, type ClosetStore,
} from '../game/art/closet';
import { BADGE_BY_ID } from '../game/achievements';
import { paintCharacterFrame, CHAR_W, CHAR_H } from '../game/art/characterArt';
import {
  STYLE_FIELDS, STYLE_FIELD_LABELS, cycleStyleOption, isStyleField, styleCatalogProgress,
  styleOptionViews, unlockedStyleIndexes, type StyleField,
} from '../game/art/styleCatalog';
import {
  LOOKBOOK_CONTRACTS, type LookbookProgress, type LookbookStore, evaluateLookbookContract,
  lookbookContractUnlocked, suggestLookbookAppearance,
} from '../game/art/lookbook';
import { styleIdentityFor, stylePaletteFor } from '../game/art/styleIdentity';
import {
  CHARACTER_EPISODES, CHARACTER_EPISODE_FEATURED_MAX,
  CHARACTER_ZINE_BONDS, CHARACTER_ZINE_FEATURED_MAX, CHARACTER_ZINE_MEMORY_SCENES,
  CHARACTER_ZINE_MOTIFS, CHARACTER_ZINE_ROLES,
  CHARACTER_ZINE_SLOT_COUNT, type CharacterEpisodeId, type CharacterEpisodeView,
  type CharacterZineCard, type CharacterZineProgress, type CharacterZineStore,
  characterZineRelationStory, type CharacterZineBondId, type CharacterZineMemorySceneId,
  type CharacterZineMotifId, type CharacterZineRoleId,
} from '../game/progression/characterZine';
import type { QuestState } from '../game/questProgress';
import {
  CHARACTER_ZINE_ART_H, CHARACTER_ZINE_ART_W, paintCharacterZineArt,
} from '../game/art/characterZineArt';
import {
  CHARACTER_EPISODE_ART_H, CHARACTER_EPISODE_ART_W, paintCharacterEpisodeArt,
} from '../game/art/characterEpisodeArt';

const hex6 = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
export type CustomizeTab = 'body' | 'outfit' | 'accessory' | 'catalog' | 'closet' | 'lookbook' | 'zine';
type WardrobeAction = 'preset' | 'slot_save' | 'slot_load' | 'slot_feature' | 'slot_update' | 'dye';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

/** 한 줄(카테고리) 정의: 라벨 · 필드 · 표시 텍스트 · 스와치색 */
type RowDef = [label: string, field: keyof Appearance, text: string, swatch: string | null];

const TABS: Array<{ id: CustomizeTab; label: string }> = [
  { id: 'body', label: '얼굴' },
  { id: 'outfit', label: '의상' },
  { id: 'accessory', label: '장식' },
  { id: 'catalog', label: '도감' },
  { id: 'closet', label: '옷장' },
  { id: 'lookbook', label: '룩북' },
  { id: 'zine', label: '설정집' },
];

/** 캐릭터 아틀리에 — 레이어 편집·테마 프리셋·12칸 시그니처 코디를 한곳에서 관리한다. */
export class CustomizePanel {
  private root: HTMLDivElement;
  private a: Appearance;
  private original: Appearance;
  private opened = false;
  private committed = false;
  private tab: CustomizeTab = 'body';
  private previewCanvas: HTMLCanvasElement | null = null;
  private dir: 0 | 1 | 2 | 3 = 0;
  private step = 0;
  private animTimer = 0;
  private selectedLookbookId = LOOKBOOK_CONTRACTS[0]!.id;
  private lookbookCanvas: HTMLCanvasElement | null = null;
  private lookbookFeedback = '';
  private closetFeedback = '';
  private zineFeedback = '';
  private selectedEpisodeSlot = 0;
  private selectedEpisodeId: CharacterEpisodeId = CHARACTER_EPISODES[0].id;

  constructor(
    initial: Appearance,
    private readonly opts: {
      onChange: (a: Appearance) => void;
      onSave: (a: Appearance) => void;
      onToggle: (open: boolean) => void;
      closet: ClosetStore;
      lookbook: LookbookStore;
      characterZine: CharacterZineStore;
      getUnlockedBadgeIds: () => string[];
      getQuestState: () => QuestState;
      onWardrobeAction?: (action: WardrobeAction) => void;
      onLookbookChanged?: (progress: LookbookProgress) => void;
      onCharacterZineChanged?: (progress: CharacterZineProgress) => void;
      onCharacterEpisodeNavigate?: (metric: string, title: string) => void;
      onCharacterEpisodeReplay?: (card: CharacterZineCard, episode: CharacterEpisodeView) => void;
      /** 계정 지키기 — 아이디·코드 부여(익명→영구 전환). 에러 메시지 또는 null(성공) 반환 */
      onLinkId?: (id: string, code: string) => Promise<string | null>;
    },
  ) {
    this.a = normalizeAppearance(initial);
    this.original = { ...this.a };
    this.root = document.createElement('div');
    this.root.className = 'hv-custom';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
    this.render();
  }

  get isOpen(): boolean { return this.opened; }

  open(current: Appearance, initialTab?: CustomizeTab): void {
    if (this.opened) return;
    this.a = normalizeAppearance(current);
    this.original = { ...this.a };
    if (initialTab) this.tab = initialTab;
    this.committed = false;
    this.opened = true;
    const badges = this.opts.getUnlockedBadgeIds();
    this.selectedLookbookId = LOOKBOOK_CONTRACTS.find((contract) => (
      lookbookContractUnlocked(contract, badges) && !this.opts.lookbook.entry(contract.id)
    ))?.id ?? LOOKBOOK_CONTRACTS.find((contract) => lookbookContractUnlocked(contract, badges))?.id ?? LOOKBOOK_CONTRACTS[0]!.id;
    this.lookbookFeedback = '';
    this.closetFeedback = '';
    this.zineFeedback = '';
    this.root.style.display = 'flex';
    this.render();
    this.startAnim();
    this.opts.onToggle(true);
  }

  /** 가이드북 세트 수첩에서 얼굴·머리는 유지한 채 지정 코디를 바로 미리 본다. */
  openPreset(current: Appearance, presetId: string): boolean {
    const preset = fashionPresetViews(this.opts.getUnlockedBadgeIds()).find((item) => item.id === presetId);
    if (!preset?.unlocked) return false;
    this.open(current, 'closet');
    if (!this.opened) return false;
    this.previewChange(applyFashionPreset(this.a, preset), 'preset');
    return true;
  }

  close(): void {
    if (!this.opened) return;
    if (!this.committed) this.opts.onChange({ ...this.original });
    this.opened = false;
    this.root.style.display = 'none';
    this.stopAnim();
    this.opts.onToggle(false);
  }

  private startAnim(): void {
    this.stopAnim();
    this.animTimer = window.setInterval(() => {
      this.step = (this.step + 1) % 4;
      this.paintPreview();
    }, 190);
  }

  private stopAnim(): void {
    if (this.animTimer) { clearInterval(this.animTimer); this.animTimer = 0; }
  }

  private paintPreview(): void {
    const ctx = this.previewCanvas?.getContext('2d');
    if (ctx) paintCharacterFrame(ctx, this.a, this.dir, this.step);
  }

  private paintLookbookFrame(): void {
    const ctx = this.lookbookCanvas?.getContext('2d');
    if (!ctx) return;
    const archived = this.opts.lookbook.entry(this.selectedLookbookId)?.appearance;
    paintCharacterFrame(ctx, archived ?? this.a, 0, this.step % 2);
  }

  private previewChange(next: Appearance, action?: WardrobeAction): void {
    this.a = normalizeAppearance(next);
    this.render();
    this.paintPreview();
    this.opts.onChange({ ...this.a });
    if (action) this.opts.onWardrobeAction?.(action);
  }

  private cycle(field: keyof Appearance, dir: 1 | -1): void {
    const lens: Partial<Record<keyof Appearance, number>> = {
      skin: SKIN_TONES.length, hair: HAIR_STYLES.length, hairColor: HAIR_COLORS.length,
      pants: PANTS_COLORS.length, glasses: GLASSES_STYLES.length, hat: HAT_STYLES.length,
      topStyle: TOP_STYLES.length, bottomStyle: BOTTOM_STYLES.length,
      shoeStyle: SHOE_STYLES.length, back: BACK_STYLES.length,
      eyeStyle: EYE_STYLES.length, mouthStyle: MOUTH_STYLES.length,
      faceDetail: FACE_DETAILS.length, topPattern: TOP_PATTERNS.length, sockStyle: SOCK_STYLES.length,
    };
    if (isStyleField(field)) {
      const current = Number(this.a[field] ?? 0);
      this.a[field] = cycleStyleOption(field, current, dir, this.opts.getUnlockedBadgeIds());
    } else if (field === 'shirt' || field === 'accent') {
      const palette = field === 'shirt' ? SHIRT_COLORS : ACCENT_COLORS;
      const current = String(this.a[field] ?? palette[0]);
      const index = palette.indexOf(current as never);
      this.a[field] = palette[((index < 0 ? 0 : index) + dir + palette.length) % palette.length]!;
    } else {
      const len = lens[field] ?? 0;
      const current = Number(this.a[field] ?? 0);
      this.a[field] = ((current + dir + len) % len) as never;
    }
    this.previewChange(this.a);
  }

  private turn(dir: 0 | 1 | 2 | 3): void {
    this.dir = dir;
    this.render();
    this.paintPreview();
  }

  private randomize(): void {
    const next = randomAppearance();
    const badges = this.opts.getUnlockedBadgeIds();
    for (const field of STYLE_FIELDS) {
      const indexes = unlockedStyleIndexes(field, badges);
      next[field] = indexes[Math.floor(Math.random() * indexes.length)] ?? 0;
    }
    this.previewChange(next);
  }

  private rows(): RowDef[] {
    if (this.tab === 'body') return [
      ['피부', 'skin', SKIN_LABELS[this.a.skin] ?? '', hex6(SKIN_TONES[this.a.skin]!)],
      ['헤어', 'hair', HAIR_STYLES[this.a.hair] ?? '', null],
      ['머리색', 'hairColor', HAIR_COLOR_LABELS[this.a.hairColor] ?? '', hex6(HAIR_COLORS[this.a.hairColor]!)],
      ['눈매', 'eyeStyle', EYE_STYLES[this.a.eyeStyle ?? 0] ?? '', null],
      ['입모양', 'mouthStyle', MOUTH_STYLES[this.a.mouthStyle ?? 0] ?? '', null],
      ['얼굴점', 'faceDetail', FACE_DETAILS[this.a.faceDetail ?? 0] ?? '', null],
    ];
    if (this.tab === 'outfit') return [
      ['상의', 'topStyle', TOP_STYLES[this.a.topStyle ?? 0] ?? '', null],
      ['상의색', 'shirt', '', `#${this.a.shirt}`],
      ['하의', 'bottomStyle', BOTTOM_STYLES[this.a.bottomStyle ?? 0] ?? '', null],
      ['하의색', 'pants', '', hex6(PANTS_COLORS[this.a.pants]!)],
      ['신발', 'shoeStyle', SHOE_STYLES[this.a.shoeStyle ?? 0] ?? '', null],
      ['무늬', 'topPattern', TOP_PATTERNS[this.a.topPattern ?? 0] ?? '', null],
      ['양말', 'sockStyle', SOCK_STYLES[this.a.sockStyle ?? 0] ?? '', null],
      ['포인트', 'accent', '', `#${this.a.accent ?? ACCENT_COLORS[0]}`],
    ];
    return [
      ['안경', 'glasses', GLASSES_STYLES[this.a.glasses ?? 0] ?? '', null],
      ['모자', 'hat', HAT_STYLES[this.a.hat ?? 0] ?? '', null],
      ['등 장식', 'back', BACK_STYLES[this.a.back ?? 0] ?? '', null],
    ];
  }

  private closetHtml(): string {
    const presets = fashionPresetViews(this.opts.getUnlockedBadgeIds());
    const closetProgress = this.opts.closet.progress();
    const presetCards = presets.map((preset) => {
      const required = preset.requiredBadgeId ? BADGE_BY_ID.get(preset.requiredBadgeId)?.name : null;
      return `<button class="cc-preset ${preset.unlocked ? '' : 'locked'}" data-preset="${preset.id}" ${preset.unlocked ? '' : 'disabled'}>
        <i style="--shirt:#${preset.style.shirt ?? 'e8c9a0'};--accent:#${preset.style.accent ?? 'f2ead8'}"></i>
        <b>${preset.name}</b><span>${preset.unlocked ? preset.blurb : `배지 필요 · ${required ?? '모험 기록'}`}</span>
      </button>`;
    }).join('');
    const slots = this.opts.closet.get().slots.map((slot, index) => {
      const identity = slot ? styleIdentityFor(slot.appearance) : null;
      const palette = slot ? stylePaletteFor(slot.appearance) : null;
      const featured = this.opts.closet.isFeatured(index);
      return `<article class="cc-slot ${slot ? 'filled' : ''} ${featured ? 'featured' : ''}" style="--slot-index:${index};--identity:${identity?.color ?? '#8d7b68'}">
        <div class="cc-slot-visual">${slot ? `<canvas width="${CHAR_W}" height="${CHAR_H}" data-closet-preview="${index}" aria-label="${escapeHtml(slot.name)} 픽셀 코디"></canvas>` : '<i>+</i>'}<span>${String(index + 1).padStart(2, '0')}</span>${featured ? '<b>대표</b>' : ''}</div>
        <div class="cc-slot-copy">${slot ? `<div class="cc-slot-identity"><i>${identity!.mark}</i><span><small>${escapeHtml(identity!.name)}</small><b>${escapeHtml(identity!.description)}</b></span></div>
          <div class="cc-slot-name"><input value="${escapeHtml(slot.name)}" maxlength="12" data-closet-name="${index}" aria-label="코디 ${index + 1} 이름"><button data-closet-rename="${index}">이름 저장</button></div>
          <span>${TOP_STYLES[slot.appearance.topStyle ?? 0]} · ${BOTTOM_STYLES[slot.appearance.bottomStyle ?? 0]}</span>
          <div class="cc-slot-palette">${palette!.map((color) => `<i style="background:#${color}"></i>`).join('')}</div>` : '<b>빈 코디 페이지</b><span>현재 모습을 이 칸에 영구 보관해 보세요.</span>'}</div>
        <div class="cc-slot-actions">
          ${slot ? `<button data-load="${index}">입기</button><button data-feature="${index}" class="${featured ? 'is-featured' : ''}">${featured ? '대표 해제' : '대표 전시'}</button><button data-remove="${index}">삭제</button>` : ''}
          <button data-store="${index}">${slot ? '현재 모습으로 덮기' : '현재 모습 저장'}</button>
        </div>
      </article>`;
    }).join('');
    return `<section class="cc-closet">
      <p class="cc-guide"><b>테마 코디</b> 얼굴과 머리는 그대로 두고 의상만 갈아입어요. 모험 배지로 특별 코디가 열립니다.</p>
      <div class="cc-presets">${presetCards}</div>
      <section class="cc-signature-head"><div><small>TWELVE-LOOK SIGNATURE ARCHIVE</small><h3>나의 픽셀 코디 아카이브</h3><p>표정·헤어·의상·장식이 모두 저장돼요. 대표 코디는 능력치 없이 순수한 자기소개로 남습니다.</p></div><aside><span>보관</span><b>${closetProgress.saved}<i>/${CLOSET_SLOT_COUNT}</i></b><span>대표</span><b>${closetProgress.featured}<i>/${CLOSET_FEATURED_MAX}</i></b></aside></section>
      ${this.closetFeedback ? `<p class="cc-closet-feedback" role="status">${escapeHtml(this.closetFeedback)}</p>` : ''}
      <div class="cc-slots">${slots}</div>
    </section>`;
  }

  private paintClosetPreviews(): void {
    this.opts.closet.get().slots.forEach((slot, index) => {
      if (!slot) return;
      const canvas = this.root.querySelector<HTMLCanvasElement>(`[data-closet-preview="${index}"]`);
      const context = canvas?.getContext('2d');
      if (context) paintCharacterFrame(context, slot.appearance, 0, index % 2);
    });
  }

  private characterZineHtml(): string {
    const state = this.opts.characterZine.get();
    const progress = this.opts.characterZine.progress();
    const cards = state.cards.map((card, index) => {
      const featured = this.opts.characterZine.isFeatured(index);
      const role = card ? CHARACTER_ZINE_ROLES.find((item) => item.id === card.roleId)! : CHARACTER_ZINE_ROLES[index % CHARACTER_ZINE_ROLES.length]!;
      const motif = card ? CHARACTER_ZINE_MOTIFS.find((item) => item.id === card.motifId)! : CHARACTER_ZINE_MOTIFS[index % CHARACTER_ZINE_MOTIFS.length]!;
      const roleOptions = CHARACTER_ZINE_ROLES.map((item) => `<option value="${item.id}" ${item.id === role.id ? 'selected' : ''}>${item.mark} · ${item.name}</option>`).join('');
      const motifOptions = CHARACTER_ZINE_MOTIFS.map((item) => `<option value="${item.id}" ${item.id === motif.id ? 'selected' : ''}>${item.mark} · ${item.name}</option>`).join('');
      const directionOptions = [['0', '정면'], ['1', '오른쪽'], ['2', '왼쪽'], ['3', '뒷모습']]
        .map(([value, label]) => `<option value="${value}" ${Number(value) === (card?.direction ?? 0) ? 'selected' : ''}>${label}</option>`).join('');
      return `<article class="cc-zine-card ${card ? 'filled' : 'empty'} ${featured ? 'featured' : ''}" style="--zine-deep:${role.palette[0]};--zine-mid:${role.palette[1]};--zine-accent:${role.palette[2]};--zine-paper:${role.palette[3]}">
        <div class="cc-zine-art">${card
          ? `<canvas width="${CHARACTER_ZINE_ART_W}" height="${CHARACTER_ZINE_ART_H}" data-zine-preview="${index}" aria-label="${escapeHtml(card.name)} 픽셀 캐릭터 카드"></canvas>`
          : `<div><i>${String(index + 1).padStart(2, '0')}</i><b>새 인물 파일</b><span>현재 모습을 복사해 첫 설정을 만드세요.</span></div>`}
          ${featured ? '<em>대표 OC</em>' : ''}
        </div>
        <div class="cc-zine-copy">
          <small>CHARACTER FILE ${String(index + 1).padStart(2, '0')}</small>
          ${card ? `<input value="${escapeHtml(card.name)}" maxlength="12" data-zine-name="${index}" aria-label="캐릭터 ${index + 1} 이름">` : `<h3>${escapeHtml(role.name)}</h3>`}
          <p>${escapeHtml(role.blurb)}</p>
          <span>${motif.mark} ${escapeHtml(motif.name)} · ${escapeHtml(motif.blurb)}</span>
        </div>
        <div class="cc-zine-fields">
          <label>역할<select data-zine-role="${index}" ${card ? '' : 'disabled'}>${roleOptions}</select></label>
          <label>모티프<select data-zine-motif="${index}" ${card ? '' : 'disabled'}>${motifOptions}</select></label>
          <label>포즈<select data-zine-direction="${index}" ${card ? '' : 'disabled'}>${directionOptions}</select></label>
        </div>
        <div class="cc-zine-actions">
          ${card ? `<button data-zine-load="${index}">이 모습 입기</button><button data-zine-meta="${index}">설정 저장</button>
            <button data-zine-feature="${index}" class="${featured ? 'is-featured' : ''}">${featured ? '대표 해제' : '대표 공개'}</button>
            <button data-zine-remove="${index}">파일 삭제</button>` : ''}
          <button class="snapshot" data-zine-store="${index}">${card ? '현재 모습으로 초상 갱신' : '현재 모습으로 만들기'}</button>
        </div>
      </article>`;
    }).join('');
    const filled = state.cards.flatMap((card, index) => card ? [{ card, index }] : []);
    const characterOptions = filled.map(({ card, index }) => `<option value="${index}">${String(index + 1).padStart(2, '0')} · ${escapeHtml(card.name)}</option>`).join('');
    const secondCharacterOptions = filled.map(({ card, index }, optionIndex) => `<option value="${index}" ${optionIndex === 1 ? 'selected' : ''}>${String(index + 1).padStart(2, '0')} · ${escapeHtml(card.name)}</option>`).join('');
    const bondOptions = CHARACTER_ZINE_BONDS.map((bond) => `<option value="${bond.id}">${bond.mark} · ${bond.name}</option>`).join('');
    const memoryOptions = CHARACTER_ZINE_MEMORY_SCENES.map((scene) => `<option value="${scene.id}">${scene.mark} · ${scene.name}</option>`).join('');
    const relations = state.relations.map((relation, index) => {
      const a = state.cards[relation.a]!;
      const b = state.cards[relation.b]!;
      const bond = CHARACTER_ZINE_BONDS.find((item) => item.id === relation.bondId) ?? CHARACTER_ZINE_BONDS[0];
      const memory = CHARACTER_ZINE_MEMORY_SCENES.find((item) => item.id === relation.memoryId) ?? CHARACTER_ZINE_MEMORY_SCENES[0];
      return `<article class="cc-zine-relation" style="--bond-color:${bond.color};--bond-index:${index}">
        <div class="cc-zine-relation-pair">
          <canvas width="${CHAR_W}" height="${CHAR_H}" data-zine-relation-a="${index}" aria-label="${escapeHtml(a.name)} 픽셀 초상"></canvas>
          <i>${bond.mark}</i>
          <canvas width="${CHAR_W}" height="${CHAR_H}" data-zine-relation-b="${index}" aria-label="${escapeHtml(b.name)} 픽셀 초상"></canvas>
        </div>
        <div><small>THREAD ${String(index + 1).padStart(2, '0')} · ${memory.mark} ${escapeHtml(memory.name)}</small><h4>${escapeHtml(a.name)} × ${escapeHtml(b.name)}</h4><b>${escapeHtml(bond.name)}</b><p>${escapeHtml(characterZineRelationStory(state, relation))}</p></div>
        <button data-zine-relation-remove="${relation.a}:${relation.b}">관계 기록 해제</button>
      </article>`;
    }).join('');
    const relationBook = filled.length < 2
      ? `<div class="cc-zine-relation-empty"><i>∞</i><p><b>두 번째 인물이 생기면 관계 실타래가 열려요.</b><span>먼저 위의 빈 파일에 현재 모습을 한 번 더 복사해 주세요. 같은 외형으로 시작해도 괜찮습니다.</span></p></div>`
      : `<div class="cc-zine-relation-editor">
          <label>첫 인물<select data-zine-relation-a>${characterOptions}</select></label>
          <label>둘째 인물<select data-zine-relation-b>${secondCharacterOptions}</select></label>
          <label>관계<select data-zine-relation-kind>${bondOptions}</select></label>
          <label>기억 장면<select data-zine-relation-memory>${memoryOptions}</select></label>
          <button data-zine-relation-save>이 관계를 한 장면으로 엮기</button>
        </div>
        ${relations ? `<div class="cc-zine-relations">${relations}</div>` : `<div class="cc-zine-relation-empty ready"><i>실</i><p><b>아직 두 인물 사이의 장면이 비어 있어요.</b><span>관계와 기억 장면을 하나씩 고르면 안전한 설정 문장이 자동으로 완성됩니다.</span></p></div>`}`;
    return `<section class="cc-zine">
      <section class="cc-zine-head">
        <div><small>ORIGINAL CHARACTER PIXEL ZINE</small><h3>골목 캐릭터 설정집</h3><p>옷장이 ‘내가 입을 코디’라면 설정집은 ‘내가 만든 인물’이에요. 외형을 독립된 스냅샷으로 저장하고 역할과 상징을 붙여 여러 OC를 오래 보관합니다.</p></div>
        <aside><span>인물</span><b>${progress.saved}<i>/${CHARACTER_ZINE_SLOT_COUNT}</i></b><span>역할</span><b>${progress.roles}<i>/${CHARACTER_ZINE_ROLES.length}</i></b><span>모티프</span><b>${progress.motifs}<i>/${CHARACTER_ZINE_MOTIFS.length}</i></b><span>대표</span><b>${progress.featured}<i>/${CHARACTER_ZINE_FEATURED_MAX}</i></b></aside>
      </section>
      <p class="cc-zine-safe">능력치·랭킹·연속 접속 조건은 없어요. 대표로 고른 최대 세 장만 이웃 명함에 공개되고, 나머지는 이 기기의 개인 설정집에 남습니다.</p>
      ${this.zineFeedback ? `<p class="cc-zine-feedback" role="status">${escapeHtml(this.zineFeedback)}</p>` : ''}
      <div class="cc-zine-grid">${cards}</div>
      <section class="cc-zine-thread">
        <header><div><small>CHARACTER RELATION THREADS</small><h3>관계 실타래</h3><p>두 인물의 관계와 함께 남은 한 장면을 엮어요. 자유문구 없이도 조합마다 작은 앤솔로지 문장이 완성됩니다.</p></div><aside><span><b>${progress.bonds}</b>관계</span><span><b>${progress.bondKinds}<i>/${CHARACTER_ZINE_BONDS.length}</i></b>관계 유형</span><span><b>${progress.memoryScenes}<i>/${CHARACTER_ZINE_MEMORY_SCENES.length}</i></b>기억 장면</span></aside></header>
        ${relationBook}
      </section>
      ${this.characterEpisodeHtml(filled)}
    </section>`;
  }

  private characterEpisodeHtml(
    filled: Array<{ card: CharacterZineCard; index: number }>,
  ): string {
    if (!filled.length) {
      return `<section class="cc-episode-board is-empty"><i>EP</i><div><small>CHARACTER EPISODE BOARD</small><h3>첫 인물을 만들면 여덟 에피소드가 열려요</h3><p>외형만 저장하는 설정집을 넘어, 실제로 즐긴 생활 두 가지를 한 장의 캐릭터 장면으로 엮을 수 있어요.</p></div></section>`;
    }
    if (!filled.some((item) => item.index === this.selectedEpisodeSlot)) this.selectedEpisodeSlot = filled[0]!.index;
    const card = this.opts.characterZine.card(this.selectedEpisodeSlot) ?? filled[0]!.card;
    const views = this.opts.characterZine.episodeViews(this.opts.getQuestState(), this.selectedEpisodeSlot);
    if (!views.some((episode) => episode.id === this.selectedEpisodeId)) this.selectedEpisodeId = views[0]!.id;
    const selected = views.find((episode) => episode.id === this.selectedEpisodeId) ?? views[0]!;
    const progress = this.opts.characterZine.progress();
    const characterTabs = filled.map(({ card: item, index }) => (
      `<button data-episode-slot="${index}" class="${index === this.selectedEpisodeSlot ? 'selected' : ''}">
        <i>${String(index + 1).padStart(2, '0')}</i><span><small>CHARACTER</small><b>${escapeHtml(item.name)}</b></span>
        <em>${this.opts.characterZine.get().episodes.filter((episode) => episode.slot === index).length}/8</em>
      </button>`
    )).join('');
    const episodeRail = views.map((episode, index) => (
      `<button data-episode-id="${episode.id}" class="${episode.id === selected.id ? 'selected' : ''} ${episode.archived ? 'archived' : episode.ready ? 'ready' : ''}" style="--episode:${episode.palette[2]};--episode-index:${index}">
        <i>${episode.archived ? episode.mark : episode.ready ? 'NEW' : String(index + 1).padStart(2, '0')}</i>
        <span><small>${episode.code}</small><b>${escapeHtml(episode.title)}</b><em>${episode.archived ? `보존 · 재생 ${episode.replayCount}` : episode.ready ? '장면 보존 준비' : `${episode.requirements.filter((item) => item.complete).length}/2 생활 기록`}</em></span>
      </button>`
    )).join('');
    const requirements = selected.requirements.map((requirement) => (
      `<li class="${requirement.complete ? 'complete' : ''}">
        <i>${requirement.complete ? '✓' : '·'}</i><span><b>${escapeHtml(requirement.label)}</b><small>${escapeHtml(requirement.location)} · ${requirement.current}/${requirement.goal}</small><em><i style="width:${requirement.progressPct}%"></i></em></span>
        ${requirement.complete ? '<strong>기록됨</strong>' : `<button data-episode-route="${escapeHtml(requirement.key)}" data-episode-route-title="${escapeHtml(requirement.label)}">길 안내</button>`}
      </li>`
    )).join('');
    const action = selected.archived
      ? `<button data-episode-replay="${selected.id}" class="primary">이 인물로 장면 다시 걷기 · ${selected.replayCount}회</button>
        <button data-episode-feature="${selected.id}" class="${selected.featured ? 'featured' : ''}">${selected.featured ? '★ 대표 장면에서 내리기' : '☆ 대표 에피소드로 간직하기'}</button>`
      : selected.ready
        ? `<button data-episode-archive="${selected.id}" class="primary">두 생활 기록을 이 장면으로 보존</button>`
        : '<button disabled>두 생활 기록이 모이면 장면을 보존할 수 있어요</button>';
    const featured = this.opts.characterZine.get().featuredEpisodes.map((key, index) => {
      const separator = key.indexOf(':');
      const slot = Number(key.slice(0, separator));
      const episodeId = key.slice(separator + 1) as CharacterEpisodeId;
      const featuredCard = this.opts.characterZine.card(slot);
      const episode = CHARACTER_EPISODES.find((item) => item.id === episodeId);
      return featuredCard && episode
        ? `<button data-episode-featured-slot="${slot}" data-episode-featured-id="${episodeId}" style="--episode:${episode.palette[2]}"><i>${index + 1}</i><span><small>${escapeHtml(featuredCard.name)}</small><b>${escapeHtml(episode.title)}</b></span></button>`
        : '';
    }).join('');
    return `<section class="cc-episode-board" style="--episode:${selected.palette[2]};--episode-deep:${selected.palette[0]};--episode-mid:${selected.palette[1]};--episode-light:${selected.palette[3]}">
      <header><div><small>48-PAGE PLAYABLE OC ANTHOLOGY</small><h3>캐릭터 에피소드 보드</h3><p>여섯 인물마다 같은 여덟 사건도 다른 주인공의 장면으로 보존돼요. 이미 즐긴 생활은 소급 인정되며 마감·실패·능력치 보너스는 없습니다.</p></div>
        <aside><span><b>${progress.episodes}</b><i>/48</i> 보존 장면</span><span><b>${progress.episodeKinds}</b><i>/8</i> 사건 도감</span><span><b>${progress.episodeCharacters}</b><i>/6</i> 주인공</span><span><b>${progress.featuredEpisodes}</b><i>/${CHARACTER_EPISODE_FEATURED_MAX}</i> 대표 장면</span></aside></header>
      <nav class="cc-episode-characters">${characterTabs}</nav>
      <div class="cc-episode-layout">
        <nav class="cc-episode-rail">${episodeRail}</nav>
        <main>
          <canvas width="${CHARACTER_EPISODE_ART_W}" height="${CHARACTER_EPISODE_ART_H}" data-character-episode-preview aria-label="${escapeHtml(card.name)}의 ${escapeHtml(selected.title)} 픽셀 에피소드"></canvas>
          <section class="cc-episode-copy"><small>${selected.code} · ${selected.archived ? 'PERMANENTLY ARCHIVED' : selected.ready ? 'READY TO ARCHIVE' : 'LIFE RECORDS IN PROGRESS'}</small><h3>${escapeHtml(selected.title)}</h3><p>${escapeHtml(selected.opening)}</p><blockquote>“${escapeHtml(selected.archived ? selected.ending : selected.subtitle)}”</blockquote></section>
          <ol class="cc-episode-requirements">${requirements}</ol>
        </main>
        <aside class="cc-episode-actions"><section><small>PLAY THIS CHARACTER</small><h4>${escapeHtml(card.name)}의 ${selected.mark} 장면</h4><p>${escapeHtml(selected.archived ? selected.ending : '조건을 채워도 생활 기록이나 아이템은 소비되지 않아요.')}</p>${action}</section>
          <section><header><small>MY FAVORITE EPISODES</small><b>대표 장면 세 장</b><em>${progress.featuredEpisodes}/${CHARACTER_EPISODE_FEATURED_MAX}</em></header><div>${featured || '<p>오래 다시 보고 싶은 캐릭터 장면을 세 장까지 고를 수 있어요.</p>'}</div></section>
        </aside>
      </div>
      <footer>${selected.archived ? '이 인물의 저장 외형으로 갈아입고 실제 에피소드 장소까지 다시 걸을 수 있어요.' : selected.ready ? '두 생활 기록이 모두 준비됐어요. 보존하면 캐릭터별 엔딩 문장이 영구 기록됩니다.' : '미완성 생활의 길 안내부터 하나씩 이어가도 충분해요.'}</footer>
    </section>`;
  }

  private paintCharacterZinePreviews(): void {
    const state = this.opts.characterZine.get();
    state.cards.forEach((card, index) => {
      if (!card) return;
      const canvas = this.root.querySelector<HTMLCanvasElement>(`[data-zine-preview="${index}"]`);
      if (canvas) paintCharacterZineArt(canvas, card, this.opts.characterZine.isFeatured(index));
    });
    state.relations.forEach((relation, index) => {
      const a = state.cards[relation.a];
      const b = state.cards[relation.b];
      const aContext = this.root.querySelector<HTMLCanvasElement>(`[data-zine-relation-a="${index}"]`)?.getContext('2d');
      const bContext = this.root.querySelector<HTMLCanvasElement>(`[data-zine-relation-b="${index}"]`)?.getContext('2d');
      if (a && aContext) paintCharacterFrame(aContext, a.appearance, a.direction, 0);
      if (b && bContext) paintCharacterFrame(bContext, b.appearance, b.direction, 0);
    });
    const episodeCanvas = this.root.querySelector<HTMLCanvasElement>('[data-character-episode-preview]');
    const episodeCard = this.opts.characterZine.card(this.selectedEpisodeSlot);
    const episode = this.opts.characterZine.episodeViews(this.opts.getQuestState(), this.selectedEpisodeSlot)
      .find((item) => item.id === this.selectedEpisodeId);
    if (episodeCanvas && episodeCard && episode) paintCharacterEpisodeArt(episodeCanvas, episodeCard, episode);
  }

  private catalogHtml(): string {
    const badges = this.opts.getUnlockedBadgeIds();
    const views = styleOptionViews(badges);
    const progress = styleCatalogProgress(badges);
    const groups = STYLE_FIELDS.map((field) => {
      const options = views.filter((option) => option.field === field).map((option) => {
        const badge = option.requiredBadgeId ? BADGE_BY_ID.get(option.requiredBadgeId) : null;
        const active = Number(this.a[field] ?? 0) === option.index;
        const detail = option.unlocked
          ? (option.rarity === 'rare' ? `희귀 · ${badge?.name ?? '모험 보상'}` : '기본 스타일')
          : `필요: ${badge?.name ?? '모험 배지'} · ${badge?.source ?? '모험 일지'}`;
        return `<button class="cc-style ${option.rarity} ${option.unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}"
          data-style-field="${field}" data-style-index="${option.index}" ${option.unlocked ? '' : 'disabled'}
          aria-label="${option.name}${option.unlocked ? ' 적용' : ' 잠김'}">
          <span class="cc-style-mark">${option.unlocked ? (active ? '착용' : '보유') : '잠김'}</span>
          <b>${option.name}</b><small>${detail}</small>
        </button>`;
      }).join('');
      return `<section class="cc-style-group"><h3>${STYLE_FIELD_LABELS[field]}</h3><div class="cc-style-grid">${options}</div></section>`;
    }).join('');
    return `<section class="cc-catalog">
      <div class="cc-catalog-summary">
        <div><span>스타일 도감</span><strong>${progress.unlocked}<i>/ ${progress.total}</i></strong></div>
        <div><span>희귀 해금</span><strong>${progress.rareUnlocked}<i>/ ${progress.rareTotal}</i></strong></div>
        <p>마을 활동으로 배지를 얻으면 새 얼굴·무늬·양말이 열립니다.</p>
      </div>
      <div class="cc-catalog-list">${groups}</div>
    </section>`;
  }

  private starsHtml(count: number): string {
    return `<span class="cc-look-stars" aria-label="별 ${count}개">${Array.from({ length: 3 }, (_, index) => `<i class="${index < count ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  private lookbookHtml(): string {
    const badges = this.opts.getUnlockedBadgeIds();
    const progress = this.opts.lookbook.progress(badges);
    const selected = LOOKBOOK_CONTRACTS.find((contract) => contract.id === this.selectedLookbookId) ?? LOOKBOOK_CONTRACTS[0]!;
    const unlocked = lookbookContractUnlocked(selected, badges);
    const evaluation = evaluateLookbookContract(selected, this.a);
    const entry = this.opts.lookbook.entry(selected.id);
    const requiredBadge = selected.prerequisiteBadgeId ? BADGE_BY_ID.get(selected.prerequisiteBadgeId) : null;
    const contracts = LOOKBOOK_CONTRACTS.map((contract, index) => {
      const contractUnlocked = lookbookContractUnlocked(contract, badges);
      const record = this.opts.lookbook.entry(contract.id);
      const selectedClass = contract.id === selected.id ? 'selected' : '';
      return `<button class="cc-look-contract ${selectedClass} ${contractUnlocked ? '' : 'locked'}" data-lookbook-contract="${contract.id}"
        ${contractUnlocked ? '' : 'disabled'} aria-label="${contract.name}${record ? ` 최고 별 ${record.bestStars}개` : contractUnlocked ? ' 새 의뢰' : ' 잠김'}">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <div><b>${contractUnlocked ? contract.name : '봉인된 의뢰'}</b><small>${record ? `${record.attempts}회 기록` : contractUnlocked ? contract.client : BADGE_BY_ID.get(contract.prerequisiteBadgeId ?? '')?.name ?? '모험 배지 필요'}</small></div>
        ${this.starsHtml(record?.bestStars ?? 0)}
      </button>`;
    }).join('');
    const rules = evaluation.rules.map((item) => `<li class="${item.matched ? 'matched' : ''}">
      <i></i><div><b>${item.label}</b><span>${item.hint}</span></div><strong>${item.matched ? '일치' : '조정'}</strong>
    </li>`).join('');
    return `<section class="cc-lookbook">
      <div class="cc-look-summary">
        <div><span>기록한 의뢰</span><strong>${progress.entries}<i>/ ${progress.totalEntries}</i></strong></div>
        <div><span>모은 별</span><strong>${progress.stars}<i>/ ${progress.totalStars}</i></strong></div>
        <div><span>완벽 페이지</span><strong>${progress.perfect}</strong></div>
        <p>${progress.unlocked}개 의뢰 공개 · 서로 다른 코디 ${progress.uniqueLooks}벌 · 제출 ${progress.submissions}회</p>
      </div>
      <div class="cc-look-workspace" style="--look-ink:${selected.ink};--look-paper:${selected.paper}">
        <aside class="cc-look-index" aria-label="코디 의뢰 목록">${contracts}</aside>
        <article class="cc-look-sheet">
          <header><span>STYLE BRIEF · ${String(LOOKBOOK_CONTRACTS.indexOf(selected) + 1).padStart(2, '0')}</span><b>${unlocked ? selected.client : '아직 봉인된 의뢰'}</b></header>
          <div class="cc-look-title"><div><h3>${selected.name}</h3><p>${selected.scene}</p></div>${this.starsHtml(entry?.bestStars ?? 0)}</div>
          <p class="cc-look-brief">${unlocked ? selected.brief : `${requiredBadge?.name ?? '모험 배지'}를 얻으면 의뢰서가 펼쳐집니다.`}</p>
          <div class="cc-look-record">
            <div class="cc-look-polaroid"><canvas class="cc-lookbook-frame" width="${CHAR_W}" height="${CHAR_H}"></canvas><span>${entry ? `최고 ${entry.bestStars}별 · ${entry.attempts}회` : '첫 페이지 대기 중'}</span></div>
            <ol class="cc-look-rules">${rules}</ol>
          </div>
          <div class="cc-look-current"><span>현재 코디 조건</span><strong>${evaluation.matched} / 3</strong><p>조건을 못 맞춰도 첫 제출에는 참여 별 하나가 남고, 최고 기록은 절대 낮아지지 않아요.</p></div>
          <div class="cc-look-actions">
            <button data-lookbook-suggest ${unlocked ? '' : 'disabled'}>샘플 코디 입어보기</button>
            <button class="submit" data-lookbook-submit ${unlocked ? '' : 'disabled'}>이 코디를 룩북에 기록</button>
          </div>
          <p class="cc-look-feedback" aria-live="polite">${this.lookbookFeedback || '샘플은 자동 제출되지 않아요. 마음에 들게 더 바꾼 뒤 기록해도 됩니다.'}</p>
        </article>
      </div>
    </section>`;
  }

  private editorHtml(): string {
    return `<div class="cc-rows">${this.rows().map(([label, field, text, swatch]) => `
      <div class="hv-custom-row">
        <span class="lbl">${label}</span>
        <button data-f="${field}" data-d="-1" aria-label="${label} 이전">◀</button>
        <span class="val">${swatch ? `<i style="background:${swatch}"></i>` : ''}${text}</span>
        <button data-f="${field}" data-d="1" aria-label="${label} 다음">▶</button>
      </div>`).join('')}</div>`;
  }

  private render(): void {
    const dirs: Array<[0 | 1 | 2 | 3, string]> = [[3, '뒤'], [2, '좌'], [0, '앞'], [1, '우']];
    this.root.innerHTML = `<div class="hv-custom-card ${this.tab === 'catalog' ? 'catalog-mode' : ''} ${this.tab === 'lookbook' ? 'lookbook-mode' : ''} ${this.tab === 'closet' ? 'closet-mode' : ''} ${this.tab === 'zine' ? 'zine-mode' : ''}">
      <div class="cc-head"><div><h2>캐릭터 아틀리에</h2><span>레이어 코디 · ${appearanceCombinationCount().toLocaleString('ko-KR')}가지 조합</span></div><button class="cc-random" title="랜덤">랜덤</button></div>
      <div class="cc-preview-wrap">
        <div class="cc-stage"><canvas class="cc-preview" width="${CHAR_W}" height="${CHAR_H}"></canvas></div>
        <div class="cc-turn">${dirs.map(([d, text]) => `<button data-dir="${d}" class="${this.dir === d ? 'sel' : ''}">${text}</button>`).join('')}</div>
      </div>
      <nav class="cc-tabs">${TABS.map((tab) => `<button data-tab="${tab.id}" class="${this.tab === tab.id ? 'sel' : ''}">${tab.label}</button>`).join('')}</nav>
      ${this.tab === 'closet' ? this.closetHtml() : this.tab === 'catalog' ? this.catalogHtml() : this.tab === 'lookbook' ? this.lookbookHtml() : this.tab === 'zine' ? this.characterZineHtml() : this.editorHtml()}
      <div class="hv-custom-actions"><button class="save">이 모습 저장</button><button class="cancel">취소</button></div>
      ${this.opts.onLinkId ? `<div class="hv-custom-account">
        <p>계정 지키기 — 아이디·코드를 만들면 다른 기기에서도 이 캐릭터로 로그인!</p>
        <div class="row"><input class="acc-id" type="text" maxlength="16" placeholder="아이디" autocapitalize="none"><input class="acc-code" type="password" maxlength="32" placeholder="코드 6자+"><button class="link">만들기</button></div>
        <p class="acc-note"></p>
      </div>` : ''}
    </div>`;

    this.previewCanvas = this.root.querySelector('.cc-preview');
    this.lookbookCanvas = this.root.querySelector('.cc-lookbook-frame');
    this.paintPreview();
    this.paintLookbookFrame();
    this.paintClosetPreviews();
    this.paintCharacterZinePreviews();
    this.wireEvents();
  }

  private wireEvents(): void {
    this.root.querySelector('.cc-random')!.addEventListener('click', () => this.randomize());
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => { this.tab = button.dataset.tab as CustomizeTab; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('.cc-turn button').forEach((button) => {
      button.addEventListener('click', () => this.turn(Number(button.dataset.dir) as 0 | 1 | 2 | 3));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-f]').forEach((button) => {
      button.addEventListener('click', () => this.cycle(button.dataset.f as keyof Appearance, Number(button.dataset.d) as 1 | -1));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-style-field]').forEach((button) => {
      button.addEventListener('click', () => {
        const field = button.dataset.styleField as StyleField;
        this.previewChange({ ...this.a, [field]: Number(button.dataset.styleIndex) });
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
      button.addEventListener('click', () => {
        const preset = FASHION_PRESETS.find((item) => item.id === button.dataset.preset);
        if (preset) this.previewChange(applyFashionPreset(this.a, preset), 'preset');
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-store]').forEach((button) => {
      button.addEventListener('click', () => {
        this.opts.closet.save(Number(button.dataset.store), this.a);
        this.opts.onWardrobeAction?.('slot_save');
        this.closetFeedback = '현재 코디를 픽셀 아카이브에 보관했어요. 같은 칸은 언제든 덮어쓸 수 있어요.';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-load]').forEach((button) => {
      button.addEventListener('click', () => {
        const slot = this.opts.closet.slot(Number(button.dataset.load));
        if (slot) this.previewChange(slot.appearance, 'slot_load');
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((button) => {
      button.addEventListener('click', () => { this.opts.closet.remove(Number(button.dataset.remove)); this.opts.onWardrobeAction?.('slot_update'); this.closetFeedback = '코디 페이지를 비웠어요. 퀘스트와 배지 기록은 사라지지 않습니다.'; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.opts.closet.toggleFeatured(Number(button.dataset.feature));
        this.closetFeedback = result === 'added' ? '대표 코디로 전시했어요. 세 칸까지 나만의 시그니처를 고를 수 있어요.'
          : result === 'removed' ? '대표 전시에서 내렸어요. 저장한 코디 페이지는 그대로 남습니다.'
            : result === 'full' ? `대표 코디는 ${CLOSET_FEATURED_MAX}칸이에요. 하나를 내린 뒤 새 코디를 골라 주세요.`
              : '먼저 현재 코디를 이 칸에 저장해 주세요.';
        if (result === 'added' || result === 'removed') this.opts.onWardrobeAction?.('slot_feature');
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-closet-rename]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.closetRename);
        const input = this.root.querySelector<HTMLInputElement>(`[data-closet-name="${index}"]`);
        if (!input) return;
        this.opts.closet.rename(index, input.value);
        this.opts.onWardrobeAction?.('slot_update');
        this.closetFeedback = '코디 페이지의 이름을 저장했어요.';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-lookbook-contract]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedLookbookId = button.dataset.lookbookContract ?? LOOKBOOK_CONTRACTS[0]!.id;
        this.lookbookFeedback = '';
        this.render();
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-lookbook-suggest]')?.addEventListener('click', () => {
      const contract = LOOKBOOK_CONTRACTS.find((item) => item.id === this.selectedLookbookId);
      if (!contract) return;
      this.lookbookFeedback = '세 조건에 맞는 샘플을 입었어요. 색과 얼굴은 그대로이며 아직 기록되지는 않았습니다.';
      this.previewChange(suggestLookbookAppearance(this.a, contract));
    });
    this.root.querySelector<HTMLButtonElement>('[data-lookbook-submit]')?.addEventListener('click', () => {
      const result = this.opts.lookbook.submit(this.selectedLookbookId, this.a, this.opts.getUnlockedBadgeIds());
      if (!result.ok) {
        this.lookbookFeedback = '아직 열리지 않은 의뢰예요. 필요한 모험 배지를 먼저 확인해 주세요.';
      } else if (result.firstPerfect) {
        this.lookbookFeedback = '세 조건이 모두 맞았어요. 완벽한 페이지와 최고 별 세 개를 기록했습니다.';
      } else if (result.improved) {
        this.lookbookFeedback = `최고 기록이 ${result.stars}별로 올랐어요. 이전 페이지는 더 낮아지지 않습니다.`;
      } else {
        this.lookbookFeedback = `${result.stars}별 코디를 한 장 더 남겼어요. 최고 기록은 그대로 보존됩니다.`;
      }
      if (result.ok) this.opts.onLookbookChanged?.(this.opts.lookbook.progress(this.opts.getUnlockedBadgeIds()));
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-store]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.zineStore);
        const card = this.opts.characterZine.card(index);
        this.opts.characterZine.save(index, this.a, card ? {
          name: card.name, roleId: card.roleId, motifId: card.motifId, direction: card.direction,
        } : undefined);
        this.zineFeedback = card
          ? '현재 모습을 이 인물의 새 초상으로 갱신했어요. 이름과 설정은 그대로예요.'
          : '현재 모습을 복사해 새 인물 파일을 만들었어요. 역할과 모티프를 자유롭게 바꿔 보세요.';
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-load]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = this.opts.characterZine.card(Number(button.dataset.zineLoad));
        if (card) {
          this.zineFeedback = `${card.name}의 저장된 모습을 현재 미리보기에 입혔어요. 원본 카드는 바뀌지 않습니다.`;
          this.previewChange(card.appearance);
        }
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-meta]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.zineMeta);
        const name = this.root.querySelector<HTMLInputElement>(`[data-zine-name="${index}"]`)?.value;
        const roleId = this.root.querySelector<HTMLSelectElement>(`[data-zine-role="${index}"]`)?.value as CharacterZineRoleId;
        const motifId = this.root.querySelector<HTMLSelectElement>(`[data-zine-motif="${index}"]`)?.value as CharacterZineMotifId;
        const direction = Number(this.root.querySelector<HTMLSelectElement>(`[data-zine-direction="${index}"]`)?.value) as 0 | 1 | 2 | 3;
        this.opts.characterZine.update(index, { name, roleId, motifId, direction });
        this.zineFeedback = '인물의 이름·역할·상징·초상 방향을 설정집에 저장했어요.';
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        const result = this.opts.characterZine.toggleFeatured(Number(button.dataset.zineFeature));
        this.zineFeedback = result === 'added' ? '대표 OC로 공개했어요. 이웃 명함에는 최대 세 장만 보여요.'
          : result === 'removed' ? '공개 명함에서 내렸어요. 개인 설정집의 인물 파일은 그대로입니다.'
            : result === 'full' ? `대표 OC는 ${CHARACTER_ZINE_FEATURED_MAX}장까지예요. 한 장을 내린 뒤 다시 골라 주세요.`
              : '먼저 현재 모습으로 인물 파일을 만들어 주세요.';
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        this.opts.characterZine.remove(Number(button.dataset.zineRemove));
        this.zineFeedback = '인물 파일을 비웠어요. 이미 달성한 퀘스트 기록은 낮아지지 않습니다.';
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        this.render();
      });
    });
    const relationA = this.root.querySelector<HTMLSelectElement>('[data-zine-relation-a]');
    const relationB = this.root.querySelector<HTMLSelectElement>('[data-zine-relation-b]');
    relationA?.addEventListener('change', () => {
      if (!relationB || relationA.value !== relationB.value) return;
      const alternative = [...relationB.options].find((option) => option.value !== relationA.value);
      if (alternative) relationB.value = alternative.value;
    });
    relationB?.addEventListener('change', () => {
      if (!relationA || relationA.value !== relationB.value) return;
      const alternative = [...relationA.options].find((option) => option.value !== relationB.value);
      if (alternative) relationA.value = alternative.value;
    });
    this.root.querySelector<HTMLButtonElement>('[data-zine-relation-save]')?.addEventListener('click', () => {
      const a = Number(relationA?.value);
      const b = Number(relationB?.value);
      const bondId = this.root.querySelector<HTMLSelectElement>('[data-zine-relation-kind]')?.value as CharacterZineBondId;
      const memoryId = this.root.querySelector<HTMLSelectElement>('[data-zine-relation-memory]')?.value as CharacterZineMemorySceneId;
      if (a === b) {
        this.zineFeedback = '한 인물 안이 아니라 서로 다른 두 인물을 골라 주세요.';
      } else if (this.opts.characterZine.upsertRelation(a, b, bondId, memoryId)) {
        this.zineFeedback = '두 인물 사이의 관계와 기억 장면을 한 페이지로 엮었어요. 같은 쌍은 새 설정으로 갱신됩니다.';
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
      }
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-zine-relation-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const [a, b] = (button.dataset.zineRelationRemove ?? '').split(':').map(Number);
        if (this.opts.characterZine.removeRelation(a!, b!)) {
          this.zineFeedback = '관계 페이지를 실타래에서 풀었어요. 두 인물 파일과 이미 달성한 기록은 그대로입니다.';
          this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        }
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-episode-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedEpisodeSlot = Number(button.dataset.episodeSlot);
        this.zineFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-episode-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedEpisodeId = button.dataset.episodeId as CharacterEpisodeId;
        this.zineFeedback = '';
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-episode-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const metric = button.dataset.episodeRoute;
        const title = button.dataset.episodeRouteTitle;
        if (!metric || !title || !this.opts.onCharacterEpisodeNavigate) return;
        this.close();
        this.opts.onCharacterEpisodeNavigate(metric, title);
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-episode-archive]')?.addEventListener('click', (event) => {
      const episodeId = (event.currentTarget as HTMLButtonElement).dataset.episodeArchive as CharacterEpisodeId;
      const result = this.opts.characterZine.archiveEpisode(
        this.opts.getQuestState(), this.selectedEpisodeSlot, episodeId,
      );
      this.zineFeedback = result === 'archived'
        ? '두 생활 기록을 이 인물의 영구 에피소드로 보존했어요. 같은 사건도 다른 인물로 다시 기록할 수 있어요.'
        : result === 'already' ? '이미 이 인물의 설정집에 보존한 장면이에요.'
          : result === 'not-ready' ? '아직 두 생활 기록이 모두 준비되지 않았어요.'
            : '먼저 이 칸에 캐릭터를 만들어 주세요.';
      this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-episode-replay]')?.addEventListener('click', (event) => {
      const episodeId = (event.currentTarget as HTMLButtonElement).dataset.episodeReplay as CharacterEpisodeId;
      const card = this.opts.characterZine.card(this.selectedEpisodeSlot);
      const episode = this.opts.characterZine.episodeViews(this.opts.getQuestState(), this.selectedEpisodeSlot)
        .find((item) => item.id === episodeId);
      const result = this.opts.characterZine.replayEpisode(this.selectedEpisodeSlot, episodeId);
      if (result === 'replayed' && card && episode) {
        this.a = normalizeAppearance(card.appearance);
        this.zineFeedback = `${card.name}의 저장 외형을 입고 「${episode.title}」의 실제 장소로 다시 출발해요.`;
        this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
        if (this.opts.onCharacterEpisodeReplay) {
          this.close();
          this.opts.onCharacterEpisodeReplay(card, episode);
          return;
        }
      }
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-episode-feature]')?.addEventListener('click', (event) => {
      const result = this.opts.characterZine.toggleFeaturedEpisode(
        this.selectedEpisodeSlot,
        (event.currentTarget as HTMLButtonElement).dataset.episodeFeature as CharacterEpisodeId,
      );
      this.zineFeedback = result === 'added' ? '대표 에피소드에 간직했어요.'
        : result === 'removed' ? '대표 전시에서만 내렸어요. 캐릭터별 장면과 재생 기록은 그대로예요.'
          : result === 'full' ? '대표 장면은 세 장이에요. 한 장을 내려도 모든 에피소드는 남아 있어요.'
            : '먼저 이 에피소드를 보존해 주세요.';
      this.opts.onCharacterZineChanged?.(this.opts.characterZine.progress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-episode-featured-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedEpisodeSlot = Number(button.dataset.episodeFeaturedSlot);
        this.selectedEpisodeId = button.dataset.episodeFeaturedId as CharacterEpisodeId;
        this.zineFeedback = '';
        this.render();
      });
    });
    this.root.querySelector('.save')!.addEventListener('click', () => {
      if (this.a.shirt !== this.original.shirt || this.a.accent !== this.original.accent) {
        this.opts.onWardrobeAction?.('dye');
      }
      this.committed = true;
      this.opts.onSave({ ...this.a });
      this.close();
    });
    this.root.querySelector('.cancel')!.addEventListener('click', () => this.close());

    const linkButton = this.root.querySelector<HTMLButtonElement>('.hv-custom-account .link');
    if (linkButton && this.opts.onLinkId) {
      linkButton.addEventListener('click', () => {
        const id = this.root.querySelector<HTMLInputElement>('.acc-id')!;
        const code = this.root.querySelector<HTMLInputElement>('.acc-code')!;
        const note = this.root.querySelector<HTMLParagraphElement>('.acc-note')!;
        note.textContent = '만드는 중…';
        void this.opts.onLinkId!(id.value, code.value).then((error) => {
          note.textContent = error ? `실패: ${error}` : '완료! 이제 어느 기기에서든 이 캐릭터로 로그인할 수 있어요.';
        });
      });
      this.root.querySelectorAll<HTMLInputElement>('.hv-custom-account input')
        .forEach((input) => input.addEventListener('keydown', (event) => event.stopPropagation()));
    }
    this.root.querySelectorAll<HTMLInputElement>('[data-closet-name], [data-zine-name]')
      .forEach((input) => input.addEventListener('keydown', (event) => event.stopPropagation()));
  }

  destroy(): void { this.stopAnim(); this.root.remove(); }
}
