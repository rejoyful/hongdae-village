import {
  NEIGHBORHOOD_TOUR_BY_ID, NEIGHBORHOOD_TOURS, type NeighborhoodTourClaimResult,
  type NeighborhoodTourId, type NeighborhoodTourMood, type NeighborhoodTourProgress,
  type NeighborhoodTourStopView, type NeighborhoodTourStore,
} from '../game/guidance/neighborhoodTours';
import type { QuestState } from '../game/questProgress';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

type MoodFilter = 'all' | NeighborhoodTourMood;
const MOODS: readonly MoodFilter[] = ['all', '처음', '꾸미기', '동행', '관찰', '만들기', '이웃'];

export class NeighborhoodTourPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedId: NeighborhoodTourId;
  private mood: MoodFilter = 'all';
  private feedback = '';

  constructor(private readonly store: NeighborhoodTourStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getQuestState: () => QuestState;
    onChanged?: (progress: NeighborhoodTourProgress, result: NeighborhoodTourClaimResult) => void;
    onNavigate?: (stop: NeighborhoodTourStopView) => void;
  }) {
    this.selectedId = store.get().pinnedTourId ?? NEIGHBORHOOD_TOURS[0]!.id;
    this.root = document.createElement('div');
    this.root.className = 'hv-neighborhood-tour';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(preferred?: NeighborhoodTourId): void {
    if (this.opened) return;
    const quests = this.opts.getQuestState();
    if (preferred && NEIGHBORHOOD_TOUR_BY_ID.has(preferred)) this.selectedId = preferred;
    else this.selectedId = this.store.recommended(quests)?.id ?? this.selectedId;
    this.feedback = '';
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

  destroy(): void { this.close(); this.root.remove(); }

  private render(): void {
    const quests = this.opts.getQuestState();
    const allViews = this.store.views(quests);
    const progress = this.store.progress(quests);
    const recommendation = this.store.recommended(quests);
    const visible = this.mood === 'all' ? allViews : allViews.filter((tour) => tour.mood === this.mood);
    let selected = allViews.find((tour) => tour.id === this.selectedId) ?? recommendation ?? allViews[0];
    if (selected && !visible.some((tour) => tour.id === selected!.id)) selected = visible[0] ?? selected;
    if (!selected) {
      this.root.innerHTML = '<section class="tour-empty"><b>소풍 수첩을 펼치지 못했어요.</b><p>잠시 뒤 다시 열어 주세요. 평생 기록과 엽서는 그대로 보존됩니다.</p><button class="tour-close">닫기</button></section>';
      this.root.querySelector<HTMLButtonElement>('.tour-close')?.addEventListener('click', () => this.close());
      return;
    }
    this.selectedId = selected.id;

    const filters = MOODS.map((mood) => `<button data-tour-mood="${mood}" class="${this.mood === mood ? 'selected' : ''}">${mood === 'all' ? '모든 코스' : mood}</button>`).join('');
    const rail = visible.map((tour, index) => `<button class="tour-rail-item ${tour.id === selected!.id ? 'selected' : ''} ${tour.claimed ? 'claimed' : ''}" data-tour-id="${tour.id}" style="--tour-index:${index}">
      <i style="--tour-color:${tour.color}">${escapeHtml(tour.mark)}</i><span><small>${escapeHtml(tour.code)} · ${escapeHtml(tour.duration)}</small><b>${escapeHtml(tour.name)}</b><em>${tour.claimed ? '엽서 기록됨' : tour.ready ? '엽서 준비 완료' : `${tour.completedStops}/4 정류장`}</em></span>${tour.pinned ? '<strong>관심</strong>' : ''}
    </button>`).join('');

    const stops = selected.stops.map((item, index) => `<li class="${item.complete ? 'complete' : ''}" style="--stop-index:${index}">
      <div class="tour-stop-no"><small>STOP</small><b>${String(index + 1).padStart(2, '0')}</b></div>
      <div class="tour-stop-copy"><small>${escapeHtml(item.location)}</small><b>${escapeHtml(item.label)}</b><p>${escapeHtml(item.note)}</p><em><i style="transform:scaleX(${item.progressPct / 100})"></i></em><span>${Math.min(item.current, item.goal)} / ${item.goal}</span></div>
      ${item.complete ? '<strong>기록됨</strong>' : `<button data-tour-guide="${escapeHtml(item.key)}">길 안내</button>`}
    </li>`).join('');

    const postcards = allViews.filter((tour) => tour.claimed).map((tour, index) => `<article style="--postcard-index:${index};--postcard-color:${tour.color}"><div><small>${escapeHtml(tour.code)}</small><b>${escapeHtml(tour.postcardTitle)}</b><p>${escapeHtml(tour.postcardCaption)}</p></div><span>${escapeHtml(tour.mark)}</span></article>`).join('');
    const nextCopy = selected.claimed
      ? '이 코스의 엽서는 안전하게 기록됐어요. 같은 활동을 계속 즐겨도 기록은 사라지지 않습니다.'
      : selected.ready ? '네 정류장의 기록이 모두 모였어요. 완주 엽서를 수첩에 찍을 수 있습니다.'
        : selected.nextStop ? `${selected.nextStop.label}이 가장 가까워요. 길 안내를 누르면 금빛 발자국이 이어집니다.`
          : '좋아하는 활동부터 시작해도 괜찮아요.';

    this.root.innerHTML = `<div class="tour-shell">
      <header class="tour-header"><div><small>FRIENDLY NEIGHBORHOOD DESK</small><h1>골목 소풍 안내소</h1><p>기분에 맞는 네 정류장을 골라 걷고, 완주한 하루를 영구 엽서로 모읍니다.</p></div><div class="tour-header-art"><img src="assets/isometric/neighborhood_guide_kiosk_v1.png" alt=""><button class="tour-close" aria-label="닫기">닫기</button></div></header>
      <section class="tour-progress"><span><small>완주 엽서</small><b>${progress.postcards}<i>/${progress.totalPostcards}</i></b></span><span><small>기분 색인</small><b>${progress.moods}<i>/${progress.totalMoods}</i></b></span><span><small>준비된 엽서</small><b>${progress.ready}<i>장</i></b></span><span><small>기록 정류장</small><b>${progress.completedStops}<i>/${progress.totalStops}</i></b></span></section>
      <nav class="tour-moods" aria-label="소풍 기분 필터">${filters}</nav>
      <main class="tour-layout"><aside class="tour-rail"><header><small>TWELVE SMALL ROUTES</small><b>${this.mood === 'all' ? '오늘 마음이 가는 길' : `${this.mood} 기분의 길`}</b></header>${rail || '<p>이 기분에 맞는 코스를 찾지 못했어요. 모든 코스를 다시 펼쳐 주세요.</p>'}</aside>
        <section class="tour-workspace"><header class="tour-selected"><i style="--tour-color:${selected.color}">${escapeHtml(selected.mark)}</i><div><small>${escapeHtml(selected.code)} · ${escapeHtml(selected.mood)} · ${escapeHtml(selected.duration)}</small><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.description)}</p></div><button data-tour-pin="${selected.id}" class="${selected.pinned ? 'pinned' : ''}">${selected.pinned ? '관심 코스 고정됨' : '관심 코스로 고정'}</button></header>
          <section class="tour-route-sheet"><header><div><small>FOUR-STOP WALK</small><b>${selected.claimed ? '완주 기록' : selected.ready ? '엽서 준비 완료' : `다음 정류장 · ${escapeHtml(selected.nextStop?.label ?? '자유 산책')}`}</b></div><strong>${selected.completedStops}<i>/4</i></strong></header><ol>${stops}</ol>
            <footer><p>${escapeHtml(this.feedback || nextCopy)}</p><button data-tour-claim="${selected.id}" ${selected.ready && !selected.claimed ? '' : 'disabled'}>${selected.claimed ? '엽서 기록 완료' : selected.ready ? '완주 엽서 찍기' : '네 정류장을 걸으면 열려요'}</button></footer></section>
          <section class="tour-postcard-preview" style="--postcard-color:${selected.color}"><div><small>${escapeHtml(selected.code)} · POSTCARD</small><h3>${escapeHtml(selected.claimed || selected.ready ? selected.postcardTitle : '아직 인화되지 않은 엽서')}</h3><p>${escapeHtml(selected.claimed || selected.ready ? selected.postcardCaption : '네 정류장의 생활 기록이 모이면 이 장면의 문장이 선명해집니다.')}</p></div><strong>${escapeHtml(selected.mark)}</strong></section>
        </section></main>
      <details class="tour-archive ${progress.postcards ? '' : 'empty'}"><summary>완주 엽서함 ${progress.postcards}장 펼치기</summary><div>${postcards || '<p><b>첫 엽서 자리가 비어 있어요.</b><span>추천 코스의 네 정류장 중 마음이 가는 곳부터 걸어 보세요. 순서와 마감은 없습니다.</span></p>'}</div></details>
      <footer class="tour-footer"><p>${recommendation ? `추천 · ${escapeHtml(recommendation.name)} · ${recommendation.ready ? '엽서를 바로 기록할 수 있어요.' : `${recommendation.completedStops}/4 정류장을 이미 걸었어요.`}` : '열두 장의 엽서를 모두 모았어요. 좋아하는 코스는 계속 걸을 수 있습니다.'}</p><span>마감 없음 · 실패 없음 · 소급 기록 · 조건 소비 없음</span></footer>
    </div>`;
    this.bind(selected.stops);
  }

  private bind(stops: NeighborhoodTourStopView[]): void {
    this.root.querySelector<HTMLButtonElement>('.tour-close')?.addEventListener('click', () => this.close());
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tour-mood]')) button.addEventListener('click', () => {
      this.mood = button.dataset.tourMood as MoodFilter;
      this.feedback = '';
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tour-id]')) button.addEventListener('click', () => {
      this.selectedId = button.dataset.tourId as NeighborhoodTourId;
      this.feedback = '';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-tour-pin]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.tourPin as NeighborhoodTourId;
      this.store.pin(id);
      this.feedback = this.store.get().pinnedTourId ? '관심 코스로 고정했어요. 다른 코스의 진행도 그대로 쌓입니다.' : '관심 고정을 풀었어요. 자동 추천으로 돌아갑니다.';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-tour-claim]')?.addEventListener('click', (event) => {
      const result = this.store.claim((event.currentTarget as HTMLButtonElement).dataset.tourClaim!, this.opts.getQuestState());
      this.feedback = result.ok ? `「${result.tour.postcardTitle}」 엽서를 수첩에 기록했어요.` : '아직 이 코스에 남은 정류장이 있어요.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tour-guide]')) button.addEventListener('click', () => {
      const item = stops.find((stop) => stop.key === button.dataset.tourGuide);
      if (!item) return;
      this.close();
      this.opts.onNavigate?.(item);
    });
  }
}
