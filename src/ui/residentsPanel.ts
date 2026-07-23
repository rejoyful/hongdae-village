import { paintResidentRendezvousScene } from '../game/art/residentRendezvousArt';
import { paintResidentLetterScene } from '../game/art/residentLetterArt';
import {
  paintResidentRoomCareArt, paintResidentRoomCareKeepsake,
  RESIDENT_ROOM_CARE_ART_H, RESIDENT_ROOM_CARE_ART_W,
  RESIDENT_ROOM_CARE_KEEPSAKE_H, RESIDENT_ROOM_CARE_KEEPSAKE_W,
} from '../game/art/residentRoomCareArt';
import { DEFAULT_APPEARANCE, type Appearance } from '../game/art/appearance';
import type { PetAccessoryId } from '../game/pets/petProfiles';
import type { QuestState } from '../game/questProgress';
import {
  RESIDENTS, trustOf, metCount, trustStage, nextTrustStage, type TrustState,
} from '../game/residents/residents';
import {
  ResidentRendezvousStore, type ResidentRendezvousProgress,
} from '../game/residents/residentRendezvous';
import {
  residentStoryArc, residentStoryProgress, residentStoryViews,
} from '../game/residents/residentStories';
import {
  RESIDENT_REPLY_TONES, ResidentLetterStore, type ResidentLetterProgress, type ResidentReplyTone,
} from '../game/residents/residentLetters';
import {
  RESIDENT_FAVORITE_LABELS, RESIDENT_FAVORITE_MAX, ResidentFanbookStore,
  type ResidentFanbookProgress,
} from '../game/residents/residentFanbook';
import {
  ROOM_CARE_FEATURED_MAX, ROOM_CARE_HOMES, ResidentRoomCareStore,
  type ResidentRoomCareProgress, type RoomCareHomeId,
} from '../game/residents/residentRoomCare';

export type ResidentBookMode = 'stories' | 'rendezvous' | 'letters' | 'fanbook' | 'room-care';

interface ActivePetPreview {
  speciesId: string;
  name: string;
  accessory: PetAccessoryId;
}

interface ResidentsPanelOptions {
  onToggle: (open: boolean) => void;
  getQuestState: () => QuestState;
  getPlayerAppearance?: () => Appearance;
  getActivePet?: () => ActivePetPreview | null;
  onRendezvousChanged?: (progress: ResidentRendezvousProgress) => void;
  onLettersChanged?: (progress: ResidentLetterProgress) => void;
  onFanbookChanged?: (progress: ResidentFanbookProgress) => void;
  onRoomCareChanged?: (progress: ResidentRoomCareProgress) => void;
  onNavigate?: (metric: string, title: string) => void;
}

const EMPTY_QUESTS: QuestState = { day: '', counts: {}, claimed: [], lifetimeCounts: {} };
const withAndJosa = (name: string): string => {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  return `${name}${code >= 0 && code <= 11171 && code % 28 !== 0 ? '과' : '와'}`;
};

/** 주민 수첩 — 관계 이야기 40장과 생활 기록으로 여는 주민 약속 30장을 함께 묶는다. */
export class ResidentsPanel {
  private root: HTMLDivElement;
  private opened = false;
  private trust: TrustState = {};
  private selectedId: string | null = null;
  private revealedResidentId: string | null = null;
  private mode: ResidentBookMode = 'stories';
  private readonly rendezvous: ResidentRendezvousStore;
  private readonly letters: ResidentLetterStore;
  private readonly fanbook: ResidentFanbookStore;
  private readonly roomCare: ResidentRoomCareStore;
  private letterFeedback = '';
  private fanbookFeedback = '';
  private roomCareFeedback = '';
  private selectedRoomCareItemId: string | null = null;
  private roomCareAlbumOpen = false;

  constructor(
    userId: string,
    /** 주민 id → 스프라이트에서 구운 초상 dataURL */
    private readonly portraits: Record<string, string>,
    private readonly opts: ResidentsPanelOptions,
  ) {
    this.rendezvous = new ResidentRendezvousStore(userId);
    this.letters = new ResidentLetterStore(userId);
    this.fanbook = new ResidentFanbookStore(userId);
    this.roomCare = new ResidentRoomCareStore(userId);
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-res';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(
    trust: TrustState,
    mode: ResidentBookMode = this.mode,
    preserveDirectResident = false,
  ): void {
    this.trust = trust;
    this.mode = mode;
    this.letterFeedback = '';
    this.fanbookFeedback = '';
    this.roomCareFeedback = '';
    this.selectedRoomCareItemId = null;
    this.roomCareAlbumOpen = false;
    if (!preserveDirectResident) this.revealedResidentId = null;
    const selectedStillMet = this.selectedId && (
      trustOf(trust, this.selectedId) > 0 || this.selectedId === this.revealedResidentId
    );
    if (!selectedStillMet) {
      const tracked = this.rendezvous.get().trackedResidentId;
      const favorite = this.fanbook.get().favorites.find((id) => trustOf(trust, id) > 0);
      this.selectedId = (this.mode === 'fanbook' ? favorite : null)
        ?? (tracked && trustOf(trust, tracked) > 0 ? tracked : null) ?? [...RESIDENTS]
        .sort((a, b) => trustOf(trust, b.id) - trustOf(trust, a.id))
        .find((resident) => trustOf(trust, resident.id) > 0)?.id ?? null;
    }
    if (!this.opened) {
      this.opened = true;
      this.root.style.display = 'flex';
      this.opts.onToggle(true);
    }
    this.render();
  }

  openResident(trust: TrustState, residentId: string, mode: ResidentBookMode = 'stories'): void {
    if (!RESIDENTS.some((resident) => resident.id === residentId)) {
      this.open(trust, mode);
      return;
    }
    this.revealedResidentId = residentId;
    this.selectedId = residentId;
    this.open(trust, mode, true);
  }

  rendezvousProgress(): ResidentRendezvousProgress {
    return this.rendezvous.progress(this.trust, this.opts.getQuestState?.() ?? EMPTY_QUESTS);
  }

  lettersProgress(): ResidentLetterProgress { return this.letters.progress(this.trust); }

  fanbookProgress(): ResidentFanbookProgress { return this.fanbook.progress(this.trust); }

  roomCareProgress(): ResidentRoomCareProgress { return this.roomCare.progress(); }

  private rosterHtml(): string {
    const ordered = [...RESIDENTS].sort((a, b) => {
      const trustGap = trustOf(this.trust, b.id) - trustOf(this.trust, a.id);
      return trustGap !== 0 ? trustGap : RESIDENTS.indexOf(a) - RESIDENTS.indexOf(b);
    });
    const quests = this.opts.getQuestState?.() ?? EMPTY_QUESTS;
    const roomCareViews = this.roomCare.views(this.trust);
    return ordered.map((resident) => {
      const trust = trustOf(this.trust, resident.id);
      const met = trust > 0;
      const revealed = met || resident.id === this.revealedResidentId;
      const stage = trustStage(trust);
      const portrait = this.portraits[resident.id];
      const rendezvous = this.rendezvous.views(resident.id, this.trust, quests);
      const recorded = rendezvous.filter((scene) => scene.recorded).length;
      const letters = this.letters.views(resident.id, this.trust);
      const replied = letters.filter((letter) => letter.replied).length;
      const fan = this.fanbook.view(resident.id, this.trust);
      const roomCare = roomCareViews.find((view) => view.residentId === resident.id);
      const ready = this.mode === 'letters' ? letters.some((letter) => letter.ready)
        : this.mode === 'fanbook' ? met && !!fan?.nextRibbon && fan.trust + 15 >= fan.nextRibbon.threshold
          : this.mode === 'room-care' ? met && !roomCare?.complete
          : rendezvous.some((scene) => scene.ready);
      return `<button class="res-row ${revealed ? '' : 'unmet'} ${this.selectedId === resident.id ? 'sel' : ''}"
        data-resident="${resident.id}" ${revealed ? '' : 'disabled'}>
        ${portrait ? `<img src="${portrait}" alt="">` : '<i></i>'}
        <div class="res-info">
          <b>${revealed ? resident.name : '아직 만나지 못한 주민'}${fan?.favoriteLabel ? `<i class="res-fan-rank">${fan.favoriteLabel}</i>` : ''}<span>${revealed ? resident.role : '마을 이름표를 찾아보세요'}</span></b>
          <div class="res-bar"><em style="width:${trust}%"></em><label>${this.mode === 'rendezvous' && met ? `약속 ${recorded}/3` : this.mode === 'letters' && met ? `답장 ${replied}/3` : this.mode === 'fanbook' && met ? `리본 ${fan?.unlockedRibbons ?? 0}/5` : this.mode === 'room-care' && met ? `정리 ${roomCare?.sorted ?? 0}/4` : (met ? stage.name : revealed ? '이야기 안내' : '미발견')}</label><strong>${ready ? '●' : `${trust}%`}</strong></div>
        </div>
      </button>`;
    }).join('');
  }

  private profileHtml(residentId: string): string {
    const resident = RESIDENTS.find((item) => item.id === residentId)!;
    const trust = trustOf(this.trust, resident.id);
    const arc = residentStoryArc(resident.id);
    const portrait = this.portraits[resident.id];
    return `<div class="res-profile">
      ${portrait ? `<img src="${portrait}" alt="">` : '<i></i>'}
      <div><span>${resident.role}</span><h3>${resident.name}</h3><p>${arc?.motto ?? resident.favorite}</p></div>
      <strong>${trust}<small>/100</small></strong>
    </div>`;
  }

  private storyDetailHtml(residentId: string): string {
    const resident = RESIDENTS.find((item) => item.id === residentId)!;
    const trust = trustOf(this.trust, resident.id);
    const stage = trustStage(trust);
    const next = nextTrustStage(trust);
    const arc = residentStoryArc(resident.id);
    const chapters = residentStoryViews(resident.id, trust);
    const storyCards = chapters.map((chapter, index) => `<article class="res-memory ${chapter.unlocked ? 'open' : 'locked'}">
      <span>${chapter.unlocked ? `${index + 1}장` : `신뢰 ${chapter.threshold}`}</span>
      <b>${chapter.unlocked ? chapter.title : '아직 잠긴 이야기'}</b>
      <p>${chapter.unlocked ? chapter.memory : `${resident.name}에게 조금 더 자주 인사하면 열려요.`}</p>
    </article>`).join('');
    return `${this.profileHtml(residentId)}
      <div class="res-tags">${arc?.tags.map((tag) => `<span>${tag}</span>`).join('') ?? ''}</div>
      <div class="res-bond-line"><b>${stage.icon} ${stage.name}</b><span>${next ? `다음 관계 「${next.name}」까지 ${next.min - trust}` : `마을 가족 · ${resident.keepsake}`}</span></div>
      ${arc ? `<div class="res-request ${trust >= 30 ? 'open' : ''}">
        <span>${trust >= 30 ? '개인 부탁 열림' : '신뢰 30에서 개인 부탁'}</span>
        <div><b>${trust >= 30 ? arc.request.title : `${resident.name}의 두 번째 인사`}</b><small>${trust >= 30 ? `${arc.request.desc} · ${arc.request.location}` : '매일 첫인사를 나누면 모험 일지에 새 이야기가 열려요.'}</small></div>
      </div>` : ''}
      <h4>관계 이야기 앨범 <span>${chapters.filter((chapter) => chapter.unlocked).length}/${chapters.length}</span></h4>
      <div class="res-memories">${storyCards}</div>`;
  }

  private rendezvousDetailHtml(residentId: string): string {
    const resident = RESIDENTS.find((item) => item.id === residentId)!;
    const quests = this.opts.getQuestState?.() ?? EMPTY_QUESTS;
    const views = this.rendezvous.views(residentId, this.trust, quests);
    const tracked = this.rendezvous.get().trackedResidentId === residentId;
    const pet = this.opts.getActivePet?.();
    const cards = views.map((scene) => {
      const state = scene.recorded ? 'recorded' : scene.ready ? 'ready' : 'locked';
      const reason = !scene.previousMet ? '앞 장면을 먼저 기록해요' : !scene.trustMet ? `신뢰 ${scene.trust}에서 초대가 와요` : !scene.requirementsMet ? '생활 기록을 채우면 준비 완료' : '지금 장면을 기록할 수 있어요';
      const requirements = scene.requirementViews.map((requirement) => `<button class="res-rdv-req ${requirement.done ? 'done' : ''}" data-route="${requirement.key}" data-route-title="${scene.title}">
        <span>${requirement.done ? '✓' : '→'}</span><b>${requirement.label}</b><em>${requirement.progress}/${requirement.goal}</em>
      </button>`).join('');
      return `<article class="res-rdv-card ${state}">
        <div class="res-rdv-art"><canvas width="160" height="80" data-rdv-art="${scene.id}"></canvas><span>${scene.act}번째 약속</span>${scene.recorded ? '<strong>기록 완료</strong>' : ''}</div>
        <div class="res-rdv-copy"><small>${scene.recorded ? `기념 표식 · ${scene.mark} ${scene.keepsake}` : reason}</small><h4>${scene.title}</h4><p>${scene.recorded ? scene.memory : scene.invitation}</p>
          ${scene.recorded ? `<blockquote>“${scene.dialogue}”</blockquote>` : `<div class="res-rdv-reqs">${requirements}</div>`}
          ${scene.ready ? `<button class="res-rdv-record" data-record-rdv="${scene.id}">장면 기록하기</button>` : ''}
        </div>
      </article>`;
    }).join('');
    return `${this.profileHtml(residentId)}
      <div class="res-rdv-lead"><div><b>${withAndJosa(resident.name)} 보내는 세 번의 약속</b><span>선물이나 마감 없이, 지금까지의 생활 기록으로 초대가 열려요.${pet ? ` ${pet.name}도 장면에 함께해요.` : ''}</span></div><button data-track-rdv="${residentId}">${tracked ? '★ 길잡이 중' : '☆ 길잡이로'}</button></div>
      <div class="res-rdv-list">${cards}</div>`;
  }

  private letterDetailHtml(residentId: string): string {
    const resident = RESIDENTS.find((item) => item.id === residentId)!;
    const views = this.letters.views(residentId, this.trust);
    const cards = views.map((item) => {
      const status = item.replied ? 'replied' : item.ready ? 'ready' : item.available ? 'available' : 'locked';
      const reason = !item.previousMet ? '앞 편지에 먼저 답장해 주세요' : !item.trustMet ? `신뢰 ${item.trust}에서 도착해요` : '지금 답장할 수 있어요';
      const tone = item.tone ? RESIDENT_REPLY_TONES.find((entry) => entry.id === item.tone) : null;
      const toneButtons = item.available ? RESIDENT_REPLY_TONES.map((entry) => `<button data-letter-reply="${item.id}" data-letter-tone="${entry.id}" class="${item.tone === entry.id ? 'selected' : ''}" style="--reply-tone:${entry.id}"><i>${entry.mark}</i><span><b>${entry.label}</b><small>${entry.description}</small></span>${item.tone === entry.id ? '<strong>보낸 답장</strong>' : ''}</button>`).join('') : '';
      return `<article class="res-letter-card ${status}" style="--letter-dark:${item.palette[0]};--letter-mid:${item.palette[1]};--letter-warm:${item.palette[2]};--letter-paper:${item.palette[3]}">
        <div class="res-letter-art"><canvas width="160" height="80" data-letter-art="${item.id}"></canvas><span>${item.act}번째 우편</span>${item.featured ? '<strong>대표 편지</strong>' : item.replied ? '<strong>답장 완료</strong>' : ''}</div>
        <div class="res-letter-paper"><header><div><small>${item.replied ? `${tone?.seal ?? '답장 봉인'} · ${item.keepsake}` : reason}</small><h4>${item.available ? item.subject : '아직 봉인된 편지'}</h4><em>${item.available ? item.dateLine : `${resident.name}과 조금 더 자주 인사를 나눠 보세요.`}</em></div><i>${item.available ? item.mark : '?'}</i></header>
          ${item.available ? `<p>${item.body}</p><small class="res-letter-ps">추신 · ${item.postscript}</small>
            ${item.replied ? `<div class="res-letter-exchange"><blockquote>${item.playerLine}</blockquote><q>${item.residentReaction}</q></div>` : '<div class="res-letter-invite"><b>어떤 말투도 정답이에요.</b><span>결과나 관계 수치는 달라지지 않고, 나중에 언제든 다시 쓸 수 있어요.</span></div>'}
            <div class="res-letter-tones">${toneButtons}</div>
            ${item.replied ? `<button class="res-letter-feature ${item.featured ? 'selected' : ''}" data-letter-feature="${item.id}">${item.featured ? '★ 대표 편지에서 내리기' : '☆ 대표 편지로 간직하기'}</button>` : ''}` : `<div class="res-letter-lock"><b>${reason}</b><span>놓친 편지는 사라지지 않으며, 도착 순서대로 영구 보관됩니다.</span></div>`}
        </div>
      </article>`;
    }).join('');
    const featuredId = this.letters.get().featuredId;
    const featured = featuredId ? views.find((item) => item.id === featuredId) : null;
    return `${this.profileHtml(residentId)}
      <div class="res-letter-lead"><div><b>${withAndJosa(resident.name)} 주고받는 세 통의 편지</b><span>매일의 인사만으로 도착해요. 정답·마감·선물 소비 없이 답장 말투만 나답게 고릅니다.</span></div><strong>${views.filter((item) => item.replied).length}<i>/3</i></strong></div>
      ${this.letterFeedback ? `<p class="res-letter-feedback">${this.letterFeedback}</p>` : ''}
      <div class="res-letter-list">${cards}</div>
      <footer class="res-letter-footer"><span>${featured ? `대표 보관 · 「${featured.subject}」` : '대표 편지를 하나 고르면 주민 수첩 첫 장에 별표로 남아요.'}</span><b>답장은 언제든 다시 쓰기 가능 · 서사 분기 잠김 없음</b></footer>`;
  }

  private fanbookShelfHtml(): string {
    const favorites = this.fanbook.get().favorites;
    return `<div class="res-fan-shelf">${Array.from({ length: RESIDENT_FAVORITE_MAX }, (_, index) => {
      const id = favorites[index];
      const resident = id ? RESIDENTS.find((item) => item.id === id) : null;
      const portrait = resident ? this.portraits[resident.id] : null;
      return resident ? `<button data-resident="${resident.id}" class="${this.selectedId === resident.id ? 'selected' : ''}">
        ${portrait ? `<img src="${portrait}" alt="">` : '<i>?</i>'}<span><small>${RESIDENT_FAVORITE_LABELS[index]}</small><b>${resident.name}</b><em>${trustOf(this.trust, resident.id)} 신뢰</em></span>
      </button>` : `<div class="empty"><i>${index + 1}</i><span><small>${RESIDENT_FAVORITE_LABELS[index]}</small><b>비어 있는 응원석</b><em>만난 주민을 골라 주세요</em></span></div>`;
    }).join('')}</div>`;
  }

  private fanbookDetailHtml(residentId: string): string {
    const view = this.fanbook.view(residentId, this.trust)!;
    const favoritesFull = this.fanbook.get().favorites.length >= RESIDENT_FAVORITE_MAX;
    const ribbonCards = view.ribbons.map((ribbon) => `<article class="${ribbon.unlocked ? 'unlocked' : 'locked'}">
      <i>${ribbon.unlocked ? ribbon.mark : '?'}</i><span><small>${ribbon.unlocked ? `신뢰 ${ribbon.threshold} · 영구 기록` : `신뢰 ${ribbon.threshold}에서 열림`}</small><b>${ribbon.unlocked ? ribbon.name : '아직 봉인된 응원 리본'}</b><em>${ribbon.unlocked ? ribbon.note : `${view.resident.name}에게 천천히 안부를 건네 보세요.`}</em></span>
    </article>`).join('');
    const action = view.favoriteRank
      ? `<div class="res-fan-actions">${view.favoriteRank > 1 ? `<button data-fan-promote="${residentId}">★ 최애로 올리기</button>` : '<strong>★ 지금 나의 최애</strong>'}<button class="quiet" data-fan-toggle="${residentId}">응원석에서 내리기</button></div>`
      : `<div class="res-fan-actions"><button data-fan-toggle="${residentId}" ${favoritesFull ? 'disabled' : ''}>${favoritesFull ? '응원석 3자리가 가득 찼어요' : '♡ 나의 응원석에 담기'}</button></div>`;
    return `${this.profileHtml(residentId)}
      <section class="res-fan-hero">
        <div><small>MY NEIGHBOR FANBOOK</small><h4>${view.favoriteLabel ? `${view.favoriteLabel} · ${view.resident.name}` : `${view.resident.name} 응원 페이지`}</h4><p>좋아하는 주민을 세 명까지 마음에 둘 수 있어요. 순서를 바꾸거나 내려도 신뢰·이야기·리본은 하나도 사라지지 않습니다.</p></div>
        <strong>${view.unlockedRibbons}<i>/5</i><small>응원 리본</small></strong>
      </section>
      ${this.fanbookShelfHtml()}
      ${action}
      ${this.fanbookFeedback ? `<p class="res-fan-feedback">${this.fanbookFeedback}</p>` : ''}
      <header class="res-fan-ribbon-head"><div><small>FIVE FOREVER RIBBONS</small><h4>다섯 단계 응원 리본</h4></div><span>${view.nextRibbon ? `다음 「${view.nextRibbon.name}」까지 신뢰 ${Math.max(0, view.nextRibbon.threshold - view.trust)}` : `${view.resident.keepsake} · 전권 완성`}</span></header>
      <div class="res-fan-ribbons">${ribbonCards}</div>
      <footer class="res-fan-safe">순위 경쟁 없음 · 선물 소비 없음 · 기간 한정 없음 · 과거 신뢰 소급 인정</footer>`;
  }

  private roomCareDetailHtml(residentId: string): string {
    const view = this.roomCare.views(this.trust).find((entry) => entry.residentId === residentId)!;
    const selected = view.items.find((entry) => entry.id === this.selectedRoomCareItemId && !view.sortedItemIds.includes(entry.id)) ?? null;
    const items = view.items.map((entry) => {
      const sorted = view.sortedItemIds.includes(entry.id);
      return `<button data-room-care-item="${entry.id}" class="${sorted ? 'is-sorted' : selected?.id === entry.id ? 'is-selected' : ''}" ${!view.unlocked || sorted ? 'disabled' : ''}>
        <i>${sorted ? '✓' : entry.mark}</i><span><b>${entry.name}</b><small>${sorted ? entry.placedLine : entry.note}</small></span><em>${sorted ? '제자리' : selected?.id === entry.id ? '선택됨' : '살펴보기'}</em>
      </button>`;
    }).join('');
    const homes = ROOM_CARE_HOMES.map((home) => `<button data-room-care-home="${home.id}" ${!view.unlocked || view.complete || !selected ? 'disabled' : ''}>
      <i>${home.mark}</i><span><b>${home.name}</b><small>${home.description}</small></span>
    </button>`).join('');
    return `${this.profileHtml(residentId)}
      <section class="res-room-care-hero" style="--room-care-color:${view.palette[1]};--room-care-warm:${view.palette[2]}">
        <div><small>${view.code} · NO WRONG PENALTY</small><h4>${view.title}</h4><p>${view.request}</p><button data-room-care-album="open">▣ 열 사람의 기념품 보관함</button></div>
        <strong>${view.sorted}<i>/4</i><small>${view.complete ? '정리 완료' : '제자리 찾기'}</small></strong>
      </section>
      <section class="res-room-care-scene ${view.complete ? 'is-complete' : ''}">
        <canvas width="${RESIDENT_ROOM_CARE_ART_W}" height="${RESIDENT_ROOM_CARE_ART_H}" data-room-care-art="${residentId}" aria-label="${view.title} 2.5D 픽셀 방"></canvas>
        <div><small>${view.complete ? 'AFTER STORY · 영구 전후 장면' : 'BEFORE · 천천히 관찰하기'}</small><h4>${view.complete ? view.keepsake : '물건의 쓰임을 읽어 보세요'}</h4><p>${view.complete ? view.afterScene : '물건 하나를 고른 뒤 네 자리 중 어울리는 곳을 눌러 주세요. 틀려도 진행은 줄지 않고 물건이 사라지지 않습니다.'}</p>
          ${view.complete ? `<button data-room-care-feature="${residentId}" class="${view.featured ? 'is-featured' : ''}">${view.featured ? '★ 대표 전후 장면에서 내리기' : '☆ 대표 전후 장면으로 간직하기'}</button>` : ''}
        </div>
      </section>
      ${this.roomCareFeedback ? `<p class="res-room-care-feedback" role="status">${this.roomCareFeedback}</p>` : ''}
      <section class="res-room-care-work">
        <header><div><small>FOUR OBJECT STORIES</small><h4>정리할 물건</h4></div><span>${selected ? `지금 든 물건 · ${selected.name}` : view.complete ? '네 물건이 모두 자기 이야기를 찾았어요.' : '먼저 물건 하나를 살펴보세요.'}</span></header>
        <div class="res-room-care-items">${items}</div>
        <header><div><small>FOUR GENTLE HOMES</small><h4>어디에 두면 좋을까요?</h4></div><span>${selected ? selected.note : '물건을 고르면 자리를 선택할 수 있어요.'}</span></header>
        <div class="res-room-care-homes">${homes}</div>
      </section>
      <footer class="res-room-care-safe">시간 제한 없음 · 오답 감점 없음 · 순서 자유 · 완성 장면 영구 보존</footer>`;
  }

  private roomCareAlbumHtml(): string {
    const views = this.roomCare.views(this.trust);
    const progress = this.roomCareProgress();
    const featuredIds = this.roomCare.get().featuredResidentIds;
    const featuredSlots = Array.from({ length: ROOM_CARE_FEATURED_MAX }, (_, index) => {
      const id = featuredIds[index];
      const view = id ? views.find((entry) => entry.residentId === id) : null;
      return view ? `<button data-room-care-album-open="${view.residentId}" style="--room-care-color:${view.palette[1]}">
        <i>${view.keepsakeMark}</i><span><small>FAVORITE ${index + 1}</small><b>${view.residentName}</b><em>${view.keepsake}</em></span>
      </button>` : `<div><i>${index + 1}</i><span><small>FAVORITE SLOT</small><b>비어 있는 진열칸</b><em>완성한 방의 기념품을 골라요.</em></span></div>`;
    }).join('');
    const cards = views.map((view) => {
      const status = view.complete ? '영구 소장' : view.unlocked ? `${view.sorted}/4 정리 중` : '첫인사 뒤 열림';
      return `<article class="${view.complete ? 'is-complete' : view.unlocked ? 'is-progress' : 'is-locked'} ${view.featured ? 'is-featured' : ''}" style="--room-care-color:${view.palette[1]};--room-care-warm:${view.palette[2]}">
        <canvas width="${RESIDENT_ROOM_CARE_KEEPSAKE_W}" height="${RESIDENT_ROOM_CARE_KEEPSAKE_H}" data-room-care-keepsake="${view.residentId}" aria-label="${view.complete ? view.keepsake : `${view.residentName}의 봉인된 생활 기념품`}"></canvas>
        <section><header><span><small>${view.code}</small><b>${view.unlocked ? view.residentName : '아직 만나지 못한 이웃'}</b></span><em>${status}</em></header>
          <h4>${view.complete ? `${view.keepsakeMark} ${view.keepsake}` : view.unlocked ? view.title : '봉인된 작은 방 기록'}</h4>
          <p>${view.complete ? view.keepsakeNote : view.unlocked ? '네 물건의 제자리를 모두 찾으면 이 방만의 생활 기념품과 긴 사연이 열려요.' : '마을에서 첫인사를 건네면 시간 제한 없이 천천히 시작할 수 있어요.'}</p>
          <footer><button data-room-care-album-open="${view.residentId}" ${view.unlocked ? '' : 'disabled'}>${view.complete ? '완성 장면 다시 보기' : view.unlocked ? '정리 이어가기' : '아직 잠겨 있어요'}</button>
          ${view.complete ? `<button class="feature ${view.featured ? 'is-featured' : ''}" data-room-care-feature="${view.residentId}">${view.featured ? '★ 대표 진열 해제' : '☆ 대표 진열'}</button>` : ''}</footer>
        </section>
      </article>`;
    }).join('');
    return `<section class="res-room-care-album">
      <header><button data-room-care-album="close">← 방 정리로 돌아가기</button><div><small>THE TEN ROOMS · KEEPSAKE CABINET</small><h3>열 사람의 생활 기념품 보관함</h3><p>누구의 방에서 어떤 물건을 함께 돌려놓았는지, 사소해서 더 오래 남는 생활의 증거를 모읍니다.</p></div>
        <strong>${progress.completedRooms}<i>/10</i><small>영구 소장</small></strong></header>
      ${this.roomCareFeedback ? `<p class="res-room-care-feedback" role="status">${this.roomCareFeedback}</p>` : ''}
      <section class="res-room-care-featured"><header><div><small>MY THREE SCENES</small><h4>대표 기념품 진열 · ${progress.featuredRooms}/${ROOM_CARE_FEATURED_MAX}</h4></div><span>세 칸은 언제든 다시 고를 수 있고, 내려도 방과 기념품은 사라지지 않아요.</span></header><div>${featuredSlots}</div></section>
      <div class="res-room-care-archive-grid">${cards}</div>
      <footer>완성 기록 소급 인정 · 전시 변경 손실 없음 · 기간 한정 없음 · 순위 경쟁 없음</footer>
    </section>`;
  }

  private detailHtml(): string {
    const resident = RESIDENTS.find((item) => item.id === this.selectedId);
    if (this.mode === 'room-care' && this.roomCareAlbumOpen) return `<section class="res-detail room-care album">${this.roomCareAlbumHtml()}</section>`;
    if (!resident) return `<section class="res-detail empty"><b>아직 펼쳐진 주민 이야기가 없어요.</b><span>마을에서 이름표가 있는 주민에게 다가가 첫인사를 건네 보세요.</span></section>`;
    return `<section class="res-detail ${this.mode}">${this.mode === 'stories' ? this.storyDetailHtml(resident.id) : this.mode === 'rendezvous' ? this.rendezvousDetailHtml(resident.id) : this.mode === 'letters' ? this.letterDetailHtml(resident.id) : this.mode === 'fanbook' ? this.fanbookDetailHtml(resident.id) : this.roomCareDetailHtml(resident.id)}</section>`;
  }

  private paintRendezvousArt(): void {
    if (this.mode !== 'rendezvous' || !this.selectedId) return;
    const scenes = this.rendezvous.views(this.selectedId, this.trust, this.opts.getQuestState?.() ?? EMPTY_QUESTS);
    const resident = RESIDENTS.find((item) => item.id === this.selectedId);
    const pet = this.opts.getActivePet?.();
    this.root.querySelectorAll<HTMLCanvasElement>('[data-rdv-art]').forEach((canvas) => {
      const scene = scenes.find((item) => item.id === canvas.dataset.rdvArt);
      const context = canvas.getContext('2d');
      if (scene && resident && context) paintResidentRendezvousScene(
        context, scene, resident.appearance, this.opts.getPlayerAppearance?.() ?? DEFAULT_APPEARANCE,
        pet ? { speciesId: pet.speciesId, accessory: pet.accessory } : null,
      );
    });
  }

  private paintLetterArt(): void {
    if (this.mode !== 'letters' || !this.selectedId) return;
    const letters = this.letters.views(this.selectedId, this.trust);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-letter-art]').forEach((canvas) => {
      const letter = letters.find((item) => item.id === canvas.dataset.letterArt);
      const context = canvas.getContext('2d');
      if (letter && context) paintResidentLetterScene(context, letter);
    });
  }

  private paintRoomCareArt(): void {
    if (this.mode !== 'room-care') return;
    const views = this.roomCare.views(this.trust);
    if (this.roomCareAlbumOpen) {
      this.root.querySelectorAll<HTMLCanvasElement>('[data-room-care-keepsake]').forEach((canvas) => {
        const view = views.find((entry) => entry.residentId === canvas.dataset.roomCareKeepsake);
        if (view) paintResidentRoomCareKeepsake(canvas, view);
      });
      return;
    }
    if (!this.selectedId) return;
    const view = views.find((entry) => entry.residentId === this.selectedId);
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-room-care-art]');
    if (view && canvas) paintResidentRoomCareArt(canvas, view);
  }

  private render(): void {
    const story = residentStoryProgress(this.trust);
    const rendezvous = this.rendezvousProgress();
    const letters = this.lettersProgress();
    const fanbook = this.fanbookProgress();
    const roomCare = this.roomCareProgress();
    this.root.innerHTML = `<div class="wood-frame res-frame">
      <div class="wood-head"><h2>주민 관계 수첩</h2><span class="pill">만남 ${metCount(this.trust)}/${RESIDENTS.length}</span><span class="pill">약속 ${rendezvous.recorded}/${rendezvous.total}</span><span class="pill">편지 ${letters.replied}/${letters.total}</span><span class="pill">리본 ${fanbook.ribbons}/${fanbook.totalRibbons}</span><span class="pill">정리 ${roomCare.completedRooms}/${roomCare.totalRooms}</span>${this.mode === 'room-care' ? `<span class="pill">진열 ${roomCare.featuredRooms}/${ROOM_CARE_FEATURED_MAX}</span>` : ''}${this.mode === 'letters' && letters.ready ? `<span class="pill ready">새 우편 ${letters.ready}</span>` : this.mode === 'rendezvous' && rendezvous.ready ? `<span class="pill ready">준비 ${rendezvous.ready}</span>` : ''}</div>
      <div class="res-tabs"><button data-res-mode="stories" class="${this.mode === 'stories' ? 'sel' : ''}">관계 이야기 <span>${story.unlocked}/${story.total}</span></button><button data-res-mode="rendezvous" class="${this.mode === 'rendezvous' ? 'sel' : ''}">주민 약속 <span>${rendezvous.recorded}/${rendezvous.total}</span></button><button data-res-mode="letters" class="${this.mode === 'letters' ? 'sel' : ''}">골목 우편 <span>${letters.replied}/${letters.total}</span></button><button data-res-mode="fanbook" class="${this.mode === 'fanbook' ? 'sel' : ''}">최애 팬북 <span>${fanbook.favorites}/${RESIDENT_FAVORITE_MAX}</span></button><button data-res-mode="room-care" class="${this.mode === 'room-care' ? 'sel' : ''}">작은 방 정리 <span>${roomCare.sortedItems}/${roomCare.totalItems}</span></button></div>
      <div class="wood-page res-book"><aside class="res-roster">${this.rosterHtml()}</aside>${this.detailHtml()}</div>
      <p class="res-tip">${this.mode === 'stories' ? '하루 첫인사만 신뢰도가 올라요. 놓친 날이 있어도 관계는 절대 줄지 않습니다.' : this.mode === 'rendezvous' ? '이미 해 둔 생활도 모두 인정돼요. 비용·실패·마감 없이 준비된 약속만 천천히 기록하세요.' : this.mode === 'letters' ? '편지는 신뢰 15·50·100에 차례로 도착해요. 어떤 말투를 골라도 관계 수치와 다음 이야기는 똑같이 열립니다.' : this.mode === 'fanbook' ? '누구를 최애로 골라도 보상 차이는 없어요. 마음이 바뀌면 언제든 손실 없이 응원석을 고쳐 앉힐 수 있습니다.' : '한 번 만난 주민의 정리 의뢰는 영구히 열려요. 기념품 대표 진열 세 칸을 바꿔도 완성 기록과 사연은 그대로 남습니다.'}</p>
      <button class="wood-close">닫기</button>
    </div>`;
    this.paintRendezvousArt();
    this.paintLetterArt();
    this.paintRoomCareArt();
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-res-mode]').forEach((button) => button.addEventListener('click', () => { this.mode = button.dataset.resMode as ResidentBookMode; this.letterFeedback = ''; this.fanbookFeedback = ''; this.roomCareFeedback = ''; this.selectedRoomCareItemId = null; this.roomCareAlbumOpen = false; this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-resident]').forEach((button) => button.addEventListener('click', () => { this.selectedId = button.dataset.resident ?? null; this.letterFeedback = ''; this.fanbookFeedback = ''; this.roomCareFeedback = ''; this.selectedRoomCareItemId = null; this.roomCareAlbumOpen = false; this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => button.addEventListener('click', () => {
      const metric = button.dataset.route!; const title = button.dataset.routeTitle ?? '주민 약속';
      this.close(); this.opts.onNavigate?.(metric, title);
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-track-rdv]').forEach((button) => button.addEventListener('click', () => { const id = button.dataset.trackRdv!; this.rendezvous.track(this.rendezvous.get().trackedResidentId === id ? null : id); this.render(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-record-rdv]').forEach((button) => button.addEventListener('click', () => {
      if (this.rendezvous.record(button.dataset.recordRdv!, this.trust, this.opts.getQuestState?.() ?? EMPTY_QUESTS) !== 'recorded') return;
      const progress = this.rendezvousProgress();
      this.opts.onRendezvousChanged?.(progress);
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-letter-reply]').forEach((button) => button.addEventListener('click', () => {
      const result = this.letters.reply(button.dataset.letterReply!, button.dataset.letterTone as ResidentReplyTone, this.trust);
      if (!result.ok) { this.letterFeedback = '편지 도착 순서와 신뢰 단계를 다시 확인해 주세요.'; this.render(); return; }
      this.letterFeedback = result.firstReply
        ? `답장을 보냈어요. 「${result.view.keepsake}」와 ${RESIDENT_REPLY_TONES.find((tone) => tone.id === result.view.tone)?.seal ?? '답장 봉인'}을 영구 보관합니다.`
        : result.changed ? '마음이 달라진 만큼 답장을 다시 썼어요. 다른 이야기는 잠기지 않습니다.' : '이 말투의 답장을 그대로 간직했어요.';
      this.opts.onLettersChanged?.(this.lettersProgress()); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-letter-feature]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.letterFeature!;
      this.letters.feature(this.letters.get().featuredId === id ? null : id);
      this.letterFeedback = this.letters.get().featuredId ? '대표 편지로 별표를 남겼어요.' : '대표 별표를 내렸어요. 편지와 답장은 그대로 보관됩니다.';
      this.opts.onLettersChanged?.(this.lettersProgress()); this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-toggle]').forEach((button) => button.addEventListener('click', () => {
      const result = this.fanbook.toggle(button.dataset.fanToggle!);
      this.fanbookFeedback = result === 'added' ? '응원석에 마음을 담았어요. 지금까지 쌓은 신뢰 리본도 모두 소급 기록됩니다.'
        : result === 'removed' ? '응원석에서 내렸어요. 관계와 리본 기록은 그대로 안전하게 남아 있어요.'
          : result === 'full' ? '응원석은 세 자리예요. 자리를 바꾸고 싶다면 현재 주민 한 명을 먼저 내려 주세요.'
            : '이 주민의 응원 페이지를 다시 확인해 주세요.';
      this.opts.onFanbookChanged?.(this.fanbookProgress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-fan-promote]').forEach((button) => button.addEventListener('click', () => {
      const result = this.fanbook.promote(button.dataset.fanPromote!);
      this.fanbookFeedback = result === 'promoted' ? '가장 앞의 최애 응원석으로 옮겼어요. 다른 주민의 기록도 그대로예요.' : '이미 가장 앞의 최애 응원석이에요.';
      this.opts.onFanbookChanged?.(this.fanbookProgress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-room-care-item]').forEach((button) => button.addEventListener('click', () => {
      this.selectedRoomCareItemId = button.dataset.roomCareItem ?? null;
      this.roomCareFeedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-room-care-album]').forEach((button) => button.addEventListener('click', () => {
      this.roomCareAlbumOpen = button.dataset.roomCareAlbum === 'open';
      this.roomCareFeedback = '';
      this.selectedRoomCareItemId = null;
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-room-care-album-open]').forEach((button) => button.addEventListener('click', () => {
      if (button.disabled) return;
      this.selectedId = button.dataset.roomCareAlbumOpen ?? this.selectedId;
      this.roomCareAlbumOpen = false;
      this.roomCareFeedback = '';
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-room-care-home]').forEach((button) => button.addEventListener('click', () => {
      if (!this.selectedId || !this.selectedRoomCareItemId) return;
      const result = this.roomCare.sort(
        this.selectedId, this.selectedRoomCareItemId, button.dataset.roomCareHome as RoomCareHomeId, this.trust,
      );
      if (!result.ok) {
        this.roomCareFeedback = result.reason === 'not-home' && result.item
          ? `아직 그 자리는 아닌 것 같아요. 단서 · ${result.item.note}`
          : result.reason === 'locked' ? '먼저 마을에서 이 주민과 첫인사를 나눠 주세요. 의뢰는 사라지지 않아요.'
            : result.reason === 'already' ? '이미 제자리를 찾은 물건이에요.'
              : '물건과 자리를 다시 천천히 골라 주세요.';
        this.render();
        return;
      }
      this.selectedRoomCareItemId = null;
      this.roomCareFeedback = result.roomComplete
        ? `${result.view.residentName}의 방이 새로운 표정을 찾았어요. 「${result.view.keepsake}」와 전후 장면을 영구 보존합니다.`
        : result.item.placedLine;
      this.opts.onRoomCareChanged?.(this.roomCareProgress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-room-care-feature]').forEach((button) => button.addEventListener('click', () => {
      const result = this.roomCare.feature(button.dataset.roomCareFeature!);
      this.roomCareFeedback = result === 'featured' ? '이 방의 기념품과 전후 장면을 대표 진열에 걸었어요.'
        : result === 'cleared' ? '대표 페이지에서만 내렸어요. 완성 장면과 기념품은 그대로 남아요.'
          : result === 'full' ? '대표 진열 세 칸이 모두 찼어요. 한 장면을 내린 뒤 새 기념품을 골라 주세요.'
          : '네 물건을 모두 제자리로 돌려놓은 뒤 대표 장면을 고를 수 있어요.';
      if (result === 'featured' || result === 'cleared') this.opts.onRoomCareChanged?.(this.roomCareProgress());
      this.render();
    }));
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
