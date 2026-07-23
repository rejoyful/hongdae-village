import { CATALOG, CATEGORY_LABEL, type ItemCategory, type ItemDef } from '../items/catalog';
import { MonsterDexStore } from '../game/battle/monsterDex';
import type { MonsterShape } from '../game/battle/monsters';
import type { QuestState } from '../game/questProgress';
import { BADGES } from '../game/achievements';
import { tasteProfile } from '../game/progression/tasteProfile';
import {
  COLLECTION_SHELF_MAX, CollectionShelfStore, type CollectionShelfContext, type CollectionShelfProgress,
} from '../game/progression/collectionShelf';
import { furnitureAcquisitionRoute } from '../game/home/furnitureWorkshop';
import {
  TASTE_SET_FEATURED_MAX, TasteSetArchiveStore, tasteSetViews,
  type TasteSetProgress, type TasteSetSource,
} from '../game/progression/tasteSetArchive';
import { DEFAULT_APPEARANCE, normalizeAppearance } from '../game/art/appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from '../game/art/characterArt';
import { PET_H, PET_W, paintPet } from '../game/art/petArt';
import {
  paintFurnitureReformPreview, REFORM_PREVIEW_H, REFORM_PREVIEW_W,
} from '../game/art/furnitureReformArt';
import { MON_H, MON_W, paintMonster } from '../game/art/monsterArt';
import {
  monsterResearchProgress, monsterResearchTierViews, type MonsterResearchProgress,
} from '../game/battle/monsterResearch';
import { STYLE_FIELD_LABELS, STYLE_OPTIONS, styleOptionViews } from '../game/art/styleCatalog';
import { PET_SPECIES } from '../game/pets/pets';

type GuideCategory = 'profile' | 'sets' | 'style' | 'pet' | ItemCategory | 'monster';
type TasteSetFilter = 'all' | 'owned' | TasteSetSource;
const TASTE_SET_SOURCE_LABEL: Record<TasteSetSource, string> = {
  'village-level': 'VILLAGE LEVEL',
  'request-story': 'STORY REWARD',
  'journey-chapter': 'MAIN CHAPTER',
  'starter-mentor': 'FIRST LIFE MENTOR',
};
const TASTE_SET_SOURCE_HEADING: Record<TasteSetSource, string> = {
  'village-level': 'VILLAGE LEVEL COLLECTION',
  'request-story': 'NEIGHBORHOOD STORY COLLECTION',
  'journey-chapter': 'MAIN CHRONICLE COLLECTION',
  'starter-mentor': 'FIRST LIFE MENTOR COLLECTION',
};
const TASTE_SET_SOURCE_COLOR: Record<TasteSetSource, string> = {
  'village-level': '#879b7d',
  'request-story': '#a36e76',
  'journey-chapter': '#a77f3f',
  'starter-mentor': '#756d91',
};
const CATS: readonly GuideCategory[] = ['profile', 'sets', 'style', 'pet', 'furniture', 'electronics', 'plant', 'deco', 'rug', 'wall', 'monster'];
const TAB_COLOR: Record<GuideCategory, string> = {
  profile: '#71836b', sets: '#a36e76', style: '#a7788d', pet: '#b48665', furniture: '#c79b55', electronics: '#7f9daa', plant: '#879b7d',
  deco: '#b97878', rug: '#9d7b5d', wall: '#8b806e', monster: '#756b7d',
};
const TAB_MARK: Record<GuideCategory, string> = {
  profile: '취', sets: '셋', style: '옷', pet: '곁', furniture: '가', electronics: '전', plant: '식', deco: '소', rug: '러', wall: '벽', monster: '생',
};
const GUIDE_LABEL: Record<GuideCategory, string> = {
  profile: '취향 프로필', sets: '취향 세트', style: '스타일 도감', pet: '동행 도감', ...CATEGORY_LABEL, monster: '몬스터 연구',
};
const MONSTER_MARK: Record<MonsterShape, string> = {
  slime: '슬', horned: '뿔', spiky: '가', ghost: '령', winged: '익', golem: '암',
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

const itemMark = (def: ItemDef): string => escapeHtml([...def.name][0] ?? TAB_MARK[def.category]);

/** 아이템·생태·생활 수집을 한 권으로 묶는 취향 아카이브. */
export class CollectionPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private cat: GuideCategory = 'profile';
  private readonly discovered = new Set<string>();
  private counts = new Map<string, number>();
  private readonly storeKey: string;
  private readonly shelf: CollectionShelfStore;
  private readonly tasteSets: TasteSetArchiveStore;
  private shelfFeedback = '';
  private tasteSetFeedback = '';
  private tasteSetFilter: TasteSetFilter = 'all';
  private selectedTasteSetId: string | null = null;
  private selectedMonsterTier = 1;

  constructor(
    userId: string,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      getQuestState: () => QuestState;
      getUnlockedBadgeIds: () => readonly string[];
      getOwnedPetIds: () => readonly string[];
      onNavigateTarget?: (signature: string) => void;
      onOpenTasteSet?: (target: 'outfit' | 'pet' | 'home', setId: string) => void;
      onTasteSetsChanged?: (progress: TasteSetProgress) => void;
      onShelfChanged?: (progress: CollectionShelfProgress) => void;
    },
    private readonly monsterDex = new MonsterDexStore(userId),
  ) {
    this.storeKey = `hv-dex-${userId}`;
    this.shelf = new CollectionShelfStore(userId);
    this.tasteSets = new TasteSetArchiveStore(userId);
    try {
      const raw = localStorage.getItem(this.storeKey);
      if (raw) (JSON.parse(raw) as string[]).forEach((id) => this.discovered.add(id));
    } catch { /* 저장소 불가 환경에서는 세션 한정으로 동작 */ }
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-dex';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  private shelfContext(): CollectionShelfContext {
    return {
      quests: this.opts.getQuestState(),
      discoveredItems: this.discovered,
      monsters: this.monsterDex.views(),
      unlockedBadgeIds: this.opts.getUnlockedBadgeIds(),
      ownedPetIds: this.opts.getOwnedPetIds(),
    };
  }

  get isOpen(): boolean { return this.opened; }
  get foundCount(): number { return this.discovered.size; }
  get monsterFoundCount(): number { return this.monsterDex.discovered; }
  tasteSetProgress(): TasteSetProgress { return this.tasteSets.progress(this.opts.getUnlockedBadgeIds()); }
  shelfProgress(): CollectionShelfProgress { return this.shelf.progress(this.shelfContext()); }

  recordMonster(id: string): ReturnType<MonsterDexStore['recordKill']> { return this.monsterDex.recordKill(id); }
  breakMonsterStreak(): void { this.monsterDex.breakStreak(); }
  addMonsterShards(amount: number): void { this.monsterDex.addShards(amount); }
  monsterProgress(): { discovered: number; bestStreak: number; totalShards: number } {
    return { discovered: this.monsterDex.discovered, bestStreak: this.monsterDex.bestStreak, totalShards: this.monsterDex.totalShards };
  }
  monsterResearchProgress(): MonsterResearchProgress { return monsterResearchProgress(this.monsterDex.views()); }

  absorb(counts: Map<string, number>): void {
    this.counts = counts;
    let dirty = false;
    for (const [id, qty] of counts) if (qty > 0 && !this.discovered.has(id)) { this.discovered.add(id); dirty = true; }
    if (dirty) try { localStorage.setItem(this.storeKey, JSON.stringify([...this.discovered])); } catch { /* ignore */ }
  }

  open(counts: Map<string, number>): void {
    if (this.opened) return;
    this.opened = true;
    this.absorb(counts);
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  openTasteSets(counts: Map<string, number>): void {
    this.cat = 'sets';
    this.open(counts);
    if (this.opened) this.render();
  }

  openProfile(counts: Map<string, number>): void {
    this.cat = 'profile';
    this.open(counts);
    if (this.opened) this.render();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private profileHtml(): string {
    const profile = tasteProfile(this.opts.getQuestState());
    const unlockedBadges = this.opts.getUnlockedBadgeIds();
    const rewardCount = this.tasteSets.progress(unlockedBadges).unlockedSets;
    const next = profile.nextMetric;
    const shelfViews = this.shelf.views(this.shelfContext());
    const shelfHtml = shelfViews.length
      ? shelfViews.map((target, index) => `<article class="dex-shelf-target ${target.complete ? 'complete' : ''}" style="--shelf-index:${index}">
        <i>${escapeHtml(target.mark)}</i><div class="dex-shelf-copy"><small>${target.complete ? '기록 완료' : escapeHtml(target.detail)}</small><b>${escapeHtml(target.label)}</b><span>${escapeHtml(target.location)}</span><em><i style="width:${target.progressPct}%"></i></em></div>
        <strong>${target.complete ? '완료' : `${Math.min(target.current, target.goal)}/${target.goal}`}</strong><div class="dex-shelf-actions">${this.opts.onNavigateTarget ? `<button data-collection-route="${target.signature}">길 안내</button>` : ''}<button data-shelf-target="${target.signature}">빼기</button></div>
      </article>`).join('')
      : '<p class="dex-shelf-empty"><b>마음에 둔 수집 목표가 아직 없어요.</b><span>아래 생활 기록이나 옆 도감의 물건·생태에서 ‘선반 담기’를 누르세요. 기한도 실패도 없습니다.</span></p>';
    const domains = profile.domains.map((domain, index) => `<article class="dex-domain" style="--dex-index:${index}">
      <header><i>${domain.mark}</i><div><small>${escapeHtml(domain.rank)}</small><b>${escapeHtml(domain.name)}</b></div><strong>${domain.progressPct}<span>%</span></strong></header>
      <p>${escapeHtml(domain.description)}</p><div class="dex-domain-progress"><i style="width:${domain.progressPct}%"></i></div>
      <ul>${domain.metrics.map((metric) => { const signature = `metric:${metric.key}`; const pinned = this.shelf.has(signature); return `<li class="${metric.complete ? 'complete' : ''}"><span>${escapeHtml(metric.label)}</span><b>${Math.min(metric.current, metric.goal)}<i>/${metric.goal}</i></b><small>${escapeHtml(metric.location)}</small><button data-shelf-target="${signature}">${pinned ? '선반 빼기' : '선반 담기'}</button></li>`; }).join('')}</ul>
    </article>`).join('');
    return `<section class="dex-profile-hero">
      <div class="dex-profile-seal"><small>TASTE</small><strong>${profile.overallPct}</strong><span>ARCHIVE</span></div>
      <div class="dex-profile-copy"><small>지금 가장 짙은 취향</small><h3>${escapeHtml(profile.favorite.title)}</h3><p>${escapeHtml(profile.favorite.description)}</p>
        ${next ? `<div class="dex-profile-next"><span>완성에 가까운 다음 기록</span><b>${escapeHtml(next.label)} ${Math.min(next.current, next.goal)}/${next.goal}</b><small>${escapeHtml(next.location)}</small></div>` : '<div class="dex-profile-next complete"><span>모든 취향 기록 완성</span><b>새로운 계절 기록을 기다리고 있어요.</b></div>'}
      </div>
      <aside><div><span>완성 항목</span><b>${profile.completedMetrics}<i>/${profile.totalMetrics}</i></b></div><div><span>취향 세트</span><b>${rewardCount}<i>/14</i></b></div><div><span>배지</span><b>${unlockedBadges.length}<i>/${BADGES.length}</i></b></div></aside>
    </section>
    ${profile.overallPct === 0 ? '<p class="dex-profile-empty"><b>아직 새 수첩이에요.</b><span>코디, 집 꾸미기, 펫 돌봄처럼 마음에 가는 생활 하나를 시작하면 첫 취향이 기록됩니다.</span></p>' : ''}
    <section class="dex-personal-shelf"><header><div><small>MY COLLECTION SHELF</small><h3>나의 수집 선반</h3></div><span>${shelfViews.length}/${COLLECTION_SHELF_MAX} · 완료 기록도 그대로 전시</span></header>${this.shelfFeedback ? `<p class="dex-shelf-feedback" role="status">${escapeHtml(this.shelfFeedback)}</p>` : ''}<div>${shelfHtml}</div></section>
    <section class="dex-domain-ledger"><header><div><small>EIGHT LIFE ARCHIVES</small><h3>여덟 갈래 취향 기록</h3></div><span>실제 평생 기록에서 자동 집계</span></header><div>${domains}</div></section>
    <section class="dex-catalog-totals"><div><span>생활 물건 발견</span><b>${this.discovered.size}<i>/${CATALOG.length}</i></b></div><div><span>외곽 생태 발견</span><b>${this.monsterDex.discovered}<i>/${this.monsterDex.views().length}</i></b></div><div><span>최고 연속 관찰</span><b>${this.monsterDex.bestStreak}<i>회</i></b></div></section>`;
  }

  private categoryHtml(): { title: string; found: number; total: number; summary: string; rows: string } {
    if (this.cat === 'monster') {
      const entries = this.monsterDex.views();
      return {
        title: '외곽숲 몬스터 연구', found: entries.filter((entry) => entry.discovered).length, total: entries.length,
        summary: `최고 연속 ${this.monsterDex.bestStreak} · 획득 조각 ${this.monsterDex.totalShards}`,
        rows: entries.map(({ species, kills, discovered }) => { const signature = `monster:${species.id}`; const pinned = this.shelf.has(signature); const actions = `<span class="dex-row-actions">${this.opts.onNavigateTarget ? `<button data-collection-route="${signature}">길 안내</button>` : ''}<button data-shelf-target="${signature}">${pinned ? '선반 빼기' : '선반 담기'}</button></span>`; return discovered
          ? `<div class="row known"><i style="background:#${species.body.toString(16).padStart(6, '0')}">${MONSTER_MARK[species.shape]}</i><span class="nm"><b>T${species.tier} · ${escapeHtml(species.name)}</b><small>동쪽 외곽숲 · 전투 T${species.tier} 해금 뒤 출현</small></span><span class="own">처치 ×${kills}</span>${actions}</div>`
          : `<div class="row unknown"><i>?</i><span class="nm"><b>T${species.tier} · 미발견 생태</b><small>동쪽 외곽숲 · 전투 T${species.tier} 해금 뒤 출현</small></span>${actions}</div>`; }).join(''),
      };
    }
    if (this.cat === 'style') {
      const views = styleOptionViews(this.opts.getUnlockedBadgeIds());
      return {
        title: '캐릭터 스타일 도감',
        found: views.filter((option) => option.unlocked).length,
        total: views.length,
        summary: '눈매·표정·얼굴 포인트·상의 무늬·양말을 능력치 없이 자유롭게 모아요.',
        rows: views.map((option) => {
          const signature = `style:${option.id}`;
          const pinned = this.shelf.has(signature);
          return `<div class="row dex-style-row ${option.unlocked ? 'known' : 'unknown'}">
            <canvas width="${CHAR_W}" height="${CHAR_H}" data-style-wish="${option.id}" aria-label="${escapeHtml(option.name)} 미리보기"></canvas>
            <span class="nm"><b>${escapeHtml(option.name)}</b><small>${escapeHtml(STYLE_FIELD_LABELS[option.field])} · ${option.unlocked ? '사용 가능' : '배지 기록으로 해금'}</small></span>
            <span class="own">${option.unlocked ? '해금됨' : '미해금'}</span>
            <span class="dex-row-actions">${this.opts.onNavigateTarget ? `<button data-collection-route="${signature}">길 안내</button>` : ''}<button data-shelf-target="${signature}">${pinned ? '선반 빼기' : '선반 담기'}</button></span>
          </div>`;
        }).join(''),
      };
    }
    if (this.cat === 'pet') {
      const owned = new Set(this.opts.getOwnedPetIds());
      return {
        title: '함께 걷는 동행 도감',
        found: PET_SPECIES.filter((pet) => owned.has(pet.id)).length,
        total: PET_SPECIES.length,
        summary: '기본 친구는 펫샵에서, 숨은 친구는 생활 기록으로 만나요. 놓치는 기간 한정 친구는 없습니다.',
        rows: PET_SPECIES.map((pet) => {
          const known = owned.has(pet.id);
          const signature = `pet:${pet.id}`;
          const pinned = this.shelf.has(signature);
          const visible = !pet.rare || known;
          return `<div class="row dex-pet-row ${known ? 'known' : 'unknown'}">
            ${visible ? `<canvas width="${PET_W}" height="${PET_H}" data-pet-wish="${pet.id}" aria-label="${escapeHtml(pet.name)} 픽셀 모습"></canvas>` : '<i>?</i>'}
            <span class="nm"><b>${escapeHtml(visible ? pet.name : '아직 모르는 숨은 친구')}</b><small>${escapeHtml(pet.rare ? (pet.hint ?? '생활 기록으로 발견') : `${pet.price} 코인 · ${pet.blurb}`)}</small></span>
            <span class="own">${known ? '가족' : pet.rare ? '미발견' : '아직 만나기 전'}</span>
            <span class="dex-row-actions">${this.opts.onNavigateTarget ? `<button data-collection-route="${signature}">길 안내</button>` : ''}<button data-shelf-target="${signature}">${pinned ? '선반 빼기' : '선반 담기'}</button></span>
          </div>`;
        }).join(''),
      };
    }
    const category = this.cat as ItemCategory;
    const items = CATALOG.filter((item) => item.category === category);
    return {
      title: CATEGORY_LABEL[category], found: items.filter((item) => this.discovered.has(item.id)).length, total: items.length, summary: '',
      rows: items.map((def) => {
        const known = this.discovered.has(def.id); const qty = this.counts.get(def.id) ?? 0;
        const signature = `item:${def.id}`; const pinned = this.shelf.has(signature);
        const source = furnitureAcquisitionRoute(def.id);
        return `<div class="row ${known ? 'known' : 'unknown'}"><i style="background:#${def.color}">${known ? itemMark(def) : '?'}</i><span class="nm"><b>${escapeHtml(def.name)}</b><small>${escapeHtml(source)}</small></span><span class="own">${known ? (qty > 0 ? `보유 ×${qty}` : '기록됨') : '미발견'}</span><span class="dex-row-actions">${this.opts.onNavigateTarget ? `<button data-collection-route="${signature}">길 안내</button>` : ''}<button data-shelf-target="${signature}">${pinned ? '선반 빼기' : '선반 담기'}</button></span></div>`;
      }).join(''),
    };
  }

  private tasteSetsHtml(): string {
    const badges = this.opts.getUnlockedBadgeIds();
    const views = tasteSetViews(badges, this.tasteSets.get().featuredIds);
    const progress = this.tasteSets.progress(badges);
    const filtered = views.filter((set) => this.tasteSetFilter === 'all'
      || (this.tasteSetFilter === 'owned' ? set.unlocked : set.source === this.tasteSetFilter));
    if (!this.selectedTasteSetId || !views.some((set) => set.id === this.selectedTasteSetId)) {
      this.selectedTasteSetId = views.find((set) => set.unlocked)?.id ?? views[0]?.id ?? null;
    }
    const selected = views.find((set) => set.id === this.selectedTasteSetId) ?? views[0]!;
    const filterLabels: Array<[TasteSetFilter, string]> = [
      ['all', `전체 ${progress.totalSets}`], ['owned', `보유 ${progress.unlockedSets}`],
      ['village-level', '레벨 6'], ['request-story', '이야기 8'], ['journey-chapter', '메인 8'], ['starter-mentor', '멘토 6'],
    ];
    return `<section class="taste-set-hero">
      <div class="taste-set-seal"><small>SET</small><strong>${progress.unlockedSets}</strong><span>/ ${progress.totalSets}</span></div>
      <div><small>${progress.totalPieces}-PIECE CROSS-SYSTEM ARCHIVE</small><h3>나의 취향 세트 수첩</h3><p>한 세트는 코디 한 벌, 동행 장식 하나, 집 리폼 레시피 하나로 완성돼요. 시즌 종료 없이 영구 소장됩니다.</p></div>
      <aside><span><b>${progress.unlockedPieces}</b>/${progress.totalPieces} 구성품</span><span><b>${progress.featuredSets}</b>/${TASTE_SET_FEATURED_MAX} 대표 전시</span></aside>
    </section>
    <section class="taste-set-workspace">
      <aside class="taste-set-index"><nav>${filterLabels.map(([id, label]) => `<button data-taste-set-filter="${id}" class="${this.tasteSetFilter === id ? 'sel' : ''}">${label}</button>`).join('')}</nav>
        <div>${filtered.length ? filtered.map((set, index) => `<button data-taste-set="${set.id}" class="${set.id === selected.id ? 'sel' : ''} ${set.unlocked ? 'unlocked' : 'locked'}" style="--taste-set-index:${index}"><i>${escapeHtml(set.mark)}</i><span><small>${TASTE_SET_SOURCE_LABEL[set.source]}</small><b>${escapeHtml(set.unlocked ? set.title : '아직 봉인된 세트')}</b><em>${escapeHtml(set.unlocked ? (set.featured ? '대표 전시 중' : '영구 소장') : set.unlockHint)}</em></span><strong>${set.unlocked ? '3/3' : '0/3'}</strong></button>`).join('') : '<p>이 조건의 세트가 아직 없어요.</p>'}</div>
      </aside>
      <main class="taste-set-detail" style="--taste-set-color:${TASTE_SET_SOURCE_COLOR[selected.source]}">
        <header><div><small>${TASTE_SET_SOURCE_HEADING[selected.source]}</small><h3>${escapeHtml(selected.unlocked ? selected.title : '봉인된 취향 세트')}</h3><p>${escapeHtml(selected.unlocked ? selected.note : `${selected.unlockHint}을(를) 마치면 세 구성품이 동시에 열립니다.`)}</p></div><span>${selected.unlocked ? (selected.featured ? '대표 전시' : '소장 완료') : '미해금'}</span></header>
        <div class="taste-set-pieces">
          <article><canvas width="${CHAR_W}" height="${CHAR_H}" data-taste-set-outfit="${selected.id}"></canvas><div><small>01 · OUTFIT</small><h4>${escapeHtml(selected.unlocked ? selected.outfit.name : '봉인된 코디')}</h4><p>${escapeHtml(selected.unlocked ? selected.outfit.blurb : '캐릭터 아틀리에의 얼굴과 머리는 유지합니다.')}</p></div>${selected.unlocked && this.opts.onOpenTasteSet ? `<button data-taste-set-open="outfit" data-taste-set-id="${selected.id}">바로 입어보기</button>` : ''}</article>
          <article><canvas width="${PET_W}" height="${PET_H}" data-taste-set-pet="${selected.id}"></canvas><div><small>02 · PET</small><h4>${escapeHtml(selected.unlocked ? selected.petAccessory.name : '봉인된 동행 장식')}</h4><p>${escapeHtml(selected.unlocked ? selected.petAccessory.description : '능력치 손해 없이 언제든 갈아 끼울 수 있어요.')}</p></div>${selected.unlocked && this.opts.onOpenTasteSet ? `<button data-taste-set-open="pet" data-taste-set-id="${selected.id}">동행에게 달기</button>` : ''}</article>
          <article><canvas width="${REFORM_PREVIEW_W}" height="${REFORM_PREVIEW_H}" data-taste-set-home="${selected.id}"></canvas><div><small>03 · HOME</small><h4>${escapeHtml(selected.unlocked ? selected.homeRecipe.name : '봉인된 집 레시피')}</h4><p>${escapeHtml(selected.unlocked ? selected.homeRecipe.description : '가구 위치와 홈 점수는 그대로 보존됩니다.')}</p></div>${selected.unlocked && this.opts.onOpenTasteSet ? `<button data-taste-set-open="home" data-taste-set-id="${selected.id}">리폼 공방 안내</button>` : ''}</article>
        </div>
        <footer><div><small>대표 전시는 능력치 보너스가 없는 순수한 자기소개예요.</small>${this.tasteSetFeedback ? `<p role="status">${escapeHtml(this.tasteSetFeedback)}</p>` : ''}</div><button data-taste-set-feature="${selected.id}" ${selected.unlocked ? '' : 'disabled'}>${selected.featured ? '대표 전시에서 내리기' : `대표 세트로 전시 ${progress.featuredSets}/${TASTE_SET_FEATURED_MAX}`}</button></footer>
      </main>
    </section>`;
  }

  private paintTasteSet(): void {
    const selected = tasteSetViews(this.opts.getUnlockedBadgeIds(), this.tasteSets.get().featuredIds)
      .find((set) => set.id === this.selectedTasteSetId);
    if (!selected) return;
    const outfit = this.root.querySelector<HTMLCanvasElement>(`[data-taste-set-outfit="${selected.id}"]`);
    const outfitContext = outfit?.getContext('2d');
    if (outfitContext) paintCharacterFrame(outfitContext, normalizeAppearance({ ...DEFAULT_APPEARANCE, ...selected.outfit.style }), 0, 1);
    const pet = this.root.querySelector<HTMLCanvasElement>(`[data-taste-set-pet="${selected.id}"]`);
    const petContext = pet?.getContext('2d');
    if (petContext) paintPet(petContext, 'dog', selected.petAccessory.id);
    const home = this.root.querySelector<HTMLCanvasElement>(`[data-taste-set-home="${selected.id}"]`);
    if (home) paintFurnitureReformPreview(home, 'desk_wood', selected.homeRecipe.style);
  }

  private paintWishTargets(): void {
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('[data-style-wish]')) {
      const option = STYLE_OPTIONS.find((candidate) => candidate.id === canvas.dataset.styleWish);
      const context = canvas.getContext('2d');
      if (!option || !context) continue;
      paintCharacterFrame(context, normalizeAppearance({ ...DEFAULT_APPEARANCE, [option.field]: option.index }), 0, 1);
    }
    for (const canvas of this.root.querySelectorAll<HTMLCanvasElement>('[data-pet-wish]')) {
      const context = canvas.getContext('2d');
      if (context && canvas.dataset.petWish) paintPet(context, canvas.dataset.petWish, 'none');
    }
  }

  private monsterResearchHtml(): string {
    const tiers = monsterResearchTierViews(this.monsterDex.views());
    const progress = monsterResearchProgress(this.monsterDex.views());
    const selected = tiers.find((tier) => tier.tier === this.selectedMonsterTier) ?? tiers[0]!;
    return `<section class="monster-research-hero">
      <div class="monster-research-seal"><small>FIELD</small><strong>${progress.stamps}</strong><span>/ ${progress.totalStamps}</span></div>
      <div><small>NO SEASON · NO LOST GEAR</small><h3>외곽숲 6권 생태 연구 수첩</h3><p>30종마다 첫 발견 1회, 익숙한 관찰 3회, 생태 숙련 10회의 세 도장을 남겨요. 길로 나오면 전투가 멈추고 기록은 영구 보존됩니다.</p></div>
      <aside><span><b>${progress.discovered}</b>/30 발견</span><span><b>${progress.masteredSpecies}</b>/30 숙련</span><span><b>${progress.pages}</b>/6 표지</span></aside>
    </section>
    <section class="monster-research-book" style="--monster-tier-color:${selected.color}">
      <aside class="monster-tier-index"><header><small>SIX FIELD BOOKS</small><b>연구 구역</b></header>${tiers.map((tier) => `<button data-monster-tier="${tier.tier}" class="${tier.tier === selected.tier ? 'sel' : ''} ${tier.pageRecorded ? 'recorded' : ''}">
        <i>${tier.mark}</i><span><small>T${tier.tier} · ${tier.code}</small><b>${escapeHtml(tier.title)}</b><em>${tier.pageRecorded ? '표지 기록 완료' : `${tier.discovered}/5 발견 · ${tier.stamps}/15 도장`}</em></span><strong>${tier.progressPct}%</strong>
      </button>`).join('')}</aside>
      <main class="monster-research-page">
        <header><div><small>TIER ${selected.tier} · ${selected.code}</small><h3>${escapeHtml(selected.title)}</h3><p>${escapeHtml(selected.description)}</p></div><aside><span>${selected.pageRecorded ? '표지 기록' : '관찰 중'}</span><b>${selected.stamps}<i>/${selected.totalStamps}</i></b></aside></header>
        <div class="monster-research-progress"><i style="width:${selected.progressPct}%"></i></div>
        <p class="monster-field-note"><i>안</i><span><b>친절한 현장 안내</b>${escapeHtml(selected.fieldNote)}</span></p>
        <div class="monster-specimen-grid">${selected.entries.map((entry, index) => `<article class="${entry.discovered ? 'discovered' : 'unknown'} ${entry.mastered ? 'mastered' : ''}" style="--monster-index:${index}">
          <header><div class="monster-specimen-art"><canvas width="${MON_W}" height="${MON_H}" data-monster-art="${entry.species.id}" aria-label="${escapeHtml(entry.discovered ? entry.species.name : '미발견 생태')} 픽셀 표본"></canvas><i>T${entry.species.tier}</i></div><div><small>${entry.discovered ? 'FIELD SPECIMEN' : 'UNDISCOVERED'}</small><h4>${escapeHtml(entry.discovered ? entry.species.name : '미발견 생태')}</h4><p>${entry.discovered ? `누적 관찰 ${entry.kills}회 · 공격 ${entry.species.atk} · 체력 ${entry.species.hp}` : '해당 연구 티어가 열리면 외곽숲에서 만날 수 있어요.'}</p></div><strong>${entry.stampsUnlocked}/3</strong></header>
          <div class="monster-stamp-row">${entry.stamps.map((stamp) => `<span class="${stamp.unlocked ? 'unlocked' : ''}"><i>${stamp.unlocked ? '✓' : stamp.mark}</i><b>${escapeHtml(stamp.name)}</b><small>${Math.min(entry.kills, stamp.goal)}/${stamp.goal}</small></span>`).join('')}</div>
          <div class="monster-specimen-progress"><i style="width:${entry.progressPct}%"></i></div>
          <footer><span>${entry.mastered ? '세 도장 영구 기록 완료' : entry.nextStage ? `다음 도장 · ${escapeHtml(entry.nextStage.name)} ${Math.min(entry.kills, entry.nextStage.goal)}/${entry.nextStage.goal}` : '연구 완료'}</span>${this.opts.onNavigateTarget ? `<button data-collection-route="monster:${entry.species.id}">외곽숲 안내</button>` : ''}</footer>
        </article>`).join('')}</div>
      </main>
    </section>`;
  }

  private paintMonsterResearch(): void {
    this.root.querySelectorAll<HTMLCanvasElement>('[data-monster-art]').forEach((canvas) => {
      const context = canvas.getContext('2d');
      if (context && canvas.dataset.monsterArt) paintMonster(context, canvas.dataset.monsterArt);
    });
  }

  private render(): void {
    const profileMode = this.cat === 'profile';
    const tasteSetMode = this.cat === 'sets';
    const monsterMode = this.cat === 'monster';
    const category = profileMode || tasteSetMode ? null : this.categoryHtml();
    const research = monsterMode ? this.monsterResearchProgress() : null;
    this.root.innerHTML = `<div class="wood-frame dex-frame ${profileMode ? 'profile-mode' : ''} ${tasteSetMode ? 'taste-set-mode' : ''} ${monsterMode ? 'monster-research-mode' : ''}">
      <div class="wood-head"><div><small>HONGDAE VILLAGE ARCHIVE</small><h2>가이드북</h2></div><span class="pill">${profileMode ? '취향 프로필' : tasteSetMode ? `${this.tasteSetProgress().unlockedSets} / ${this.tasteSetProgress().totalSets} 세트` : monsterMode ? `${research!.stamps} / ${research!.totalStamps} 도장` : `${category!.found} / ${category!.total}`}</span></div>
      <div class="dex-body"><nav class="dex-tabs" aria-label="가이드북 분류">${CATS.map((cat) => `<button data-cat="${cat}" class="${this.cat === cat ? 'sel' : ''}" style="--tab-color:${TAB_COLOR[cat]}" title="${GUIDE_LABEL[cat]}"><span>${TAB_MARK[cat]}</span><small>${GUIDE_LABEL[cat]}</small></button>`).join('')}</nav>
        <main class="wood-page dex-list ${profileMode ? 'dex-profile' : ''} ${tasteSetMode ? 'taste-set-list' : ''} ${monsterMode ? 'monster-research-list' : ''}">${profileMode ? this.profileHtml() : tasteSetMode ? this.tasteSetsHtml() : monsterMode ? this.monsterResearchHtml() : `<div class="dex-title">${escapeHtml(category!.title)}</div>${category!.summary ? `<p class="dex-summary">${escapeHtml(category!.summary)}</p>` : ''}${this.shelfFeedback ? `<p class="dex-shelf-feedback" role="status">${escapeHtml(this.shelfFeedback)}</p>` : ''}${category!.rows}`}</main>
      </div><button class="wood-close" aria-label="가이드북 닫기">닫기</button>
    </div>`;
    if (tasteSetMode) this.paintTasteSet();
    if (monsterMode) this.paintMonsterResearch();
    this.paintWishTargets();
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((button) => button.addEventListener('click', () => {
      this.cat = button.dataset.cat as GuideCategory; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-monster-tier]').forEach((button) => button.addEventListener('click', () => {
      this.selectedMonsterTier = Math.max(1, Math.min(6, Number(button.dataset.monsterTier) || 1)); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-shelf-target]').forEach((button) => button.addEventListener('click', () => {
      const result = this.shelf.toggle(button.dataset.shelfTarget!);
      this.shelfFeedback = result === 'added' ? '수집 선반에 담았어요. 이미 한 기록도 자동으로 반영됩니다.'
        : result === 'removed' ? '선반에서 뺐어요. 실제 수집 기록은 지워지지 않습니다.'
          : result === 'full' ? `선반은 ${COLLECTION_SHELF_MAX}칸이에요. 하나를 빼면 새 목표를 담을 수 있어요.`
            : '이 목표는 지금 선반에 담을 수 없어요.';
      this.opts.onShelfChanged?.(this.shelfProgress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-collection-route]').forEach((button) => button.addEventListener('click', () => {
      const signature = button.dataset.collectionRoute;
      if (!signature || !this.opts.onNavigateTarget) return;
      this.close();
      this.opts.onNavigateTarget(signature);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-taste-set-filter]').forEach((button) => button.addEventListener('click', () => {
      this.tasteSetFilter = button.dataset.tasteSetFilter as TasteSetFilter; this.tasteSetFeedback = ''; this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-taste-set]').forEach((button) => button.addEventListener('click', () => {
      this.selectedTasteSetId = button.dataset.tasteSet ?? null; this.tasteSetFeedback = ''; this.render();
    }));
    this.root.querySelector<HTMLButtonElement>('[data-taste-set-feature]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.tasteSetFeature!;
      const result = this.tasteSets.toggleFeatured(id, this.opts.getUnlockedBadgeIds());
      this.tasteSetFeedback = result === 'added' ? '대표 전시에 올렸어요. 가이드북 첫 장의 자기소개로 오래 남습니다.'
        : result === 'removed' ? '대표 전시에서 내렸어요. 세트 소장 기록은 그대로예요.'
          : result === 'full' ? `대표 전시는 ${TASTE_SET_FEATURED_MAX}칸이에요. 한 세트를 내린 뒤 골라 주세요.`
            : result === 'locked' ? '먼저 세트를 해금해 주세요.' : '세트 기록을 찾지 못했어요.';
      this.opts.onTasteSetsChanged?.(this.tasteSetProgress());
      this.render();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-taste-set-open]').forEach((button) => button.addEventListener('click', () => {
      const target = button.dataset.tasteSetOpen as 'outfit' | 'pet' | 'home';
      const setId = button.dataset.tasteSetId!;
      if (!this.opts.onOpenTasteSet) return;
      this.close(); this.opts.onOpenTasteSet(target, setId);
    }));
  }

  destroy(): void { this.root.remove(); }
}
