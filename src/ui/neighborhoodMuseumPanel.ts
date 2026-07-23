import {
  MUSEUM_EXHIBIT_BY_ID, MUSEUM_WINGS, type MuseumClaimResult, type MuseumExhibitId,
  type MuseumFeatureResult, type MuseumRequirementView, type MuseumWingId,
  type NeighborhoodMuseumProgress, type NeighborhoodMuseumStore,
} from '../game/museum/neighborhoodMuseum';
import type { QuestState } from '../game/questProgress';

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

const tierName = (tier: 1 | 2 | 3): string => tier === 1 ? '첫 발견' : tier === 2 ? '깊은 기록' : '전권 완성';

export class NeighborhoodMuseumPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private wingId: MuseumWingId = 'style';
  private exhibitId: MuseumExhibitId = 'first_thread';
  private feedback = '';

  constructor(private readonly store: NeighborhoodMuseumStore, private readonly opts: {
    onToggle: (open: boolean) => void;
    getQuestState: () => QuestState;
    onChanged?: (progress: NeighborhoodMuseumProgress, result: MuseumClaimResult | MuseumFeatureResult) => void;
    onNavigate?: (requirement: MuseumRequirementView) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-neighborhood-museum';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(preferred?: MuseumExhibitId): void {
    if (this.opened) return;
    const quests = this.opts.getQuestState();
    const preferredExhibit = preferred ? MUSEUM_EXHIBIT_BY_ID.get(preferred) : null;
    const recommendation = this.store.recommended(quests);
    const selected = preferredExhibit ?? recommendation ?? MUSEUM_EXHIBIT_BY_ID.get(this.exhibitId);
    if (selected) { this.exhibitId = selected.id; this.wingId = selected.wing; }
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
    const wings = this.store.wings(quests);
    const exhibits = this.store.exhibits(quests);
    const progress = this.store.progress(quests);
    const recommendation = this.store.recommended(quests);
    const wing = wings.find((candidate) => candidate.id === this.wingId) ?? wings[0];
    let selected = exhibits.find((candidate) => candidate.id === this.exhibitId && candidate.wing === wing?.id);
    if (!selected) selected = wing?.exhibits[0];
    if (!wing || !selected) {
      this.root.innerHTML = '<section class="museum-error"><b>전시 기록을 펼치지 못했어요.</b><p>잠시 뒤 다시 열어 주세요. 수령한 기념품과 평생 기록은 그대로 보존됩니다.</p><button class="museum-close">닫기</button></section>';
      this.root.querySelector<HTMLButtonElement>('.museum-close')?.addEventListener('click', () => this.close());
      return;
    }
    this.wingId = wing.id;
    this.exhibitId = selected.id;

    const wingRail = wings.map((item, index) => `<button data-museum-wing="${item.id}" class="${item.id === wing.id ? 'selected' : ''} ${item.completed ? 'complete' : ''}" style="--museum-index:${index}">
      <i>${escapeHtml(item.mark)}</i><span><small>${escapeHtml(item.title)}</small><b>${escapeHtml(item.name)}</b><em>${item.claimed}/3 수령${item.ready ? ` · ${item.ready} 준비` : ''}</em></span><strong>${item.progressPct}%</strong>
    </button>`).join('');

    const exhibitRail = wing.exhibits.map((item, index) => `<button data-museum-exhibit="${item.id}" class="museum-piece ${item.id === selected!.id ? 'selected' : ''} ${item.claimed ? 'claimed' : item.ready ? 'ready' : ''}" style="--piece-index:${index};--piece-color:${item.color}">
      <span><small>TIER ${item.tier} · ${tierName(item.tier)}</small><b>${escapeHtml(item.name)}</b><em>${item.claimed ? '기념품 수령됨' : item.ready ? '수령 준비 완료' : `${item.completedRequirements}/${item.requirements.length} 단서`}</em></span><i>${escapeHtml(item.mark)}</i>
    </button>`).join('');

    const requirements = selected.requirements.map((requirement, index) => `<li class="${requirement.complete ? 'complete' : ''}" style="--clue-index:${index}">
      <span><small>CLUE ${String(index + 1).padStart(2, '0')} · ${escapeHtml(requirement.location)}</small><b>${escapeHtml(requirement.label)}</b><em><i style="transform:scaleX(${requirement.progressPct / 100})"></i></em><strong>${Math.min(requirement.current, requirement.goal)} / ${requirement.goal}</strong></span>
      ${requirement.complete ? '<b>기록됨</b>' : `<button data-museum-guide="${escapeHtml(requirement.key)}">길 안내</button>`}
    </li>`).join('');

    const featured = this.store.get().featuredExhibitIds.map((id) => MUSEUM_EXHIBIT_BY_ID.get(id)).filter(Boolean);
    const featuredSlots = Array.from({ length: progress.featuredMax }, (_, index) => {
      const item = featured[index];
      return item
        ? `<button data-museum-feature-remove="${item.id}" style="--piece-color:${item.color}"><i>${escapeHtml(item.mark)}</i><span><b>${escapeHtml(item.objectName)}</b><small>눌러서 진열에서 빼기</small></span></button>`
        : `<div><i>${String(index + 1).padStart(2, '0')}</i><span><b>비어 있는 받침</b><small>수령한 기념품에서 대표 진열을 골라요.</small></span></div>`;
    }).join('');

    const claimCopy = selected.claimed
      ? '이 기념품은 박물관에 영구 보존됐어요. 대표 진열에서 빼도 수집 기록은 사라지지 않습니다.'
      : selected.ready ? '모든 단서가 기록됐어요. 기념품을 수령해 전시관에 영구 보존할 수 있습니다.'
        : selected.nextRequirement ? `${selected.nextRequirement.label} 단서가 가장 가까워요. 길 안내를 누르면 실제 장소로 이어집니다.`
          : '좋아하는 기록부터 천천히 이어가도 괜찮아요.';
    const featureResult = selected.featured ? '대표 진열에서 빼기' : progress.featured >= progress.featuredMax ? '대표 진열 6칸이 찼어요' : '대표 진열에 올리기';

    this.root.innerHTML = `<div class="museum-shell">
      <header class="museum-header"><div><small>THE SMALL MUSEUM OF EVERYDAY LIFE</small><h1>골목 작은 박물관</h1><p>여덟 갈래 생활에서 오래 남은 증거를 기념품으로 보존하고, 가장 아끼는 여섯 점을 대표 진열로 고릅니다.</p></div><div class="museum-header-art"><img src="assets/isometric/neighborhood_museum_cabinet_v1.png" alt=""><button class="museum-close" aria-label="닫기">닫기</button></div></header>
      <section class="museum-metrics"><span><small>수령 기념품</small><b>${progress.exhibits}<i>/${progress.totalExhibits}</i></b></span><span><small>완성 전시관</small><b>${progress.completedWings}<i>/${progress.totalWings}</i></b></span><span><small>대표 진열</small><b>${progress.featured}<i>/${progress.featuredMax}</i></b></span><span><small>기록 단서</small><b>${progress.completedClues}<i>/${progress.totalClues}</i></b></span><span><small>수령 준비</small><b>${progress.ready}<i>점</i></b></span></section>
      <main class="museum-layout"><aside class="museum-wings"><header><small>EIGHT COLLECTION WINGS</small><b>생활 전시관</b></header>${wingRail}</aside>
        <section class="museum-workspace"><header class="museum-wing-title"><i>${escapeHtml(wing.mark)}</i><div><small>${escapeHtml(wing.title)}</small><h2>${escapeHtml(wing.name)} 전시관</h2><p>${escapeHtml(wing.description)}</p></div><strong>${wing.claimed}<i>/3</i></strong></header>
          <div class="museum-focus"><section class="museum-piece-list"><header><small>THREE DEPTHS OF MEMORY</small><b>첫 발견에서 전권 완성까지</b></header>${exhibitRail}</section>
            <article class="museum-curator" style="--piece-color:${selected.color}"><header><small>TIER ${selected.tier} · ${tierName(selected.tier)}</small><i>${escapeHtml(selected.mark)}</i></header><h3>${escapeHtml(selected.objectName)}</h3><b>${escapeHtml(selected.name)}</b><p>${escapeHtml(selected.description)}</p><blockquote>${escapeHtml(selected.lore)}</blockquote><footer><span>${selected.progressPct}% 기록</span><button data-museum-feature="${selected.id}" ${!selected.claimed || (!selected.featured && progress.featured >= progress.featuredMax) ? 'disabled' : ''}>${featureResult}</button></footer></article>
          </div>
          <section class="museum-clues"><header><div><small>PERMANENT CLUES</small><b>${selected.claimed ? '기념품 보존 완료' : selected.ready ? '기념품 수령 준비 완료' : '남은 단서 기록하기'}</b></div><strong>${selected.completedRequirements}<i>/${selected.requirements.length}</i></strong></header><ol>${requirements}</ol><footer><p>${escapeHtml(this.feedback || claimCopy)}</p><button data-museum-claim="${selected.id}" ${selected.ready && !selected.claimed ? '' : 'disabled'}>${selected.claimed ? '기념품 수령 완료' : selected.ready ? `${escapeHtml(selected.objectName)} 수령하기` : '모든 단서가 기록되면 열려요'}</button></footer></section>
        </section></main>
      <section class="museum-featured"><header><div><small>MY SIX OBJECTS</small><b>대표 진열 · ${progress.featured}/${progress.featuredMax}</b></div><p>${featured.length ? '고른 여섯 점은 언제든 바꿀 수 있고 수집 기록은 그대로 남습니다.' : '첫 기념품을 수령하면 이곳에 나만의 전시를 시작할 수 있어요.'}</p></header><div>${featuredSlots}</div></section>
      <footer class="museum-footer"><p>${recommendation ? `다음 추천 · ${escapeHtml(recommendation.objectName)} · ${recommendation.ready ? '지금 수령할 수 있어요.' : `${recommendation.progressPct}% 기록됐어요.`}` : '스물네 기념품을 모두 보존했어요. 대표 진열은 계속 바꿀 수 있습니다.'}</p><span>소급 기록 · 기한 없음 · 실패 없음 · 조건 소비 없음</span></footer>
    </div>`;
    this.bind(selected.requirements);
  }

  private bind(requirements: MuseumRequirementView[]): void {
    this.root.querySelector<HTMLButtonElement>('.museum-close')?.addEventListener('click', () => this.close());
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-museum-wing]')) button.addEventListener('click', () => {
      this.wingId = button.dataset.museumWing as MuseumWingId;
      const quests = this.opts.getQuestState();
      const next = this.store.wings(quests).find((wing) => wing.id === this.wingId)?.exhibits[0];
      if (next) this.exhibitId = next.id;
      this.feedback = '';
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-museum-exhibit]')) button.addEventListener('click', () => {
      this.exhibitId = button.dataset.museumExhibit as MuseumExhibitId;
      this.feedback = '';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-museum-claim]')?.addEventListener('click', (event) => {
      const result = this.store.claim((event.currentTarget as HTMLButtonElement).dataset.museumClaim!, this.opts.getQuestState());
      this.feedback = result.ok ? `「${result.exhibit.objectName}」을(를) 박물관에 영구 보존했어요.` : '아직 기록하지 않은 단서가 남아 있어요.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-museum-feature]')?.addEventListener('click', (event) => {
      const result = this.store.feature((event.currentTarget as HTMLButtonElement).dataset.museumFeature!);
      this.feedback = result === 'featured' ? '대표 진열에 올렸어요. 다른 사람에게 가장 먼저 보여 줄 여섯 점을 고를 수 있습니다.'
        : result === 'removed' ? '대표 진열에서만 뺐어요. 박물관의 수집 기록은 그대로입니다.'
          : result === 'full' ? '대표 진열 여섯 칸이 찼어요. 한 점을 빼고 다시 골라 주세요.' : '먼저 이 기념품을 수령해 주세요.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-museum-feature-remove]')) button.addEventListener('click', () => {
      const result = this.store.feature(button.dataset.museumFeatureRemove!);
      this.feedback = '대표 진열에서만 뺐어요. 박물관의 수집 기록은 그대로입니다.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-museum-guide]')) button.addEventListener('click', () => {
      const requirement = requirements.find((candidate) => candidate.key === button.dataset.museumGuide);
      if (!requirement) return;
      this.close();
      this.opts.onNavigate?.(requirement);
    });
  }
}
