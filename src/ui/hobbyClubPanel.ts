import type { QuestState } from '../game/questProgress';
import type { Appearance } from '../game/art/appearance';
import type { PetAccessoryId } from '../game/pets/petProfiles';
import {
  HOBBY_CLUB_ROOM_ART_H, HOBBY_CLUB_ROOM_ART_W, paintHobbyClubRoomArt,
} from '../game/art/hobbyClubRoomArt';
import {
  HOBBY_CLUB_BY_ID, HOBBY_CLUBS, HobbyClubStore,
  type HobbyClubClaimResult, type HobbyClubConditionView, type HobbyClubId, type HobbyClubProgress,
  type HobbyClubView,
} from '../game/clubs/hobbyClubs';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

/** 기존 평생 기록을 여섯 취향 동아리의 30장 연대기로 읽는 주민 수첩. */
export class HobbyClubPanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private selectedId: HobbyClubId = 'style';
  private feedback = '';

  constructor(
    private readonly store: HobbyClubStore,
    private readonly opts: {
      onToggle: (open: boolean) => void;
      getQuestState: () => QuestState;
      onChanged?: (progress: HobbyClubProgress, result: HobbyClubClaimResult) => void;
      onFanChanged?: (progress: HobbyClubProgress) => void;
      onNavigate?: (condition: HobbyClubConditionView) => void;
      onReplay?: (club: HobbyClubView) => void;
      getAppearance?: () => Appearance;
      getPet?: () => { speciesId: string; accessory: PetAccessoryId } | null;
    },
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-hobby-clubs';
    this.root.style.display = 'none';
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(preferred?: HobbyClubId): void {
    if (this.opened) return;
    if (preferred && HOBBY_CLUB_BY_ID.has(preferred)) this.selectedId = preferred;
    else if (this.store.get().pinnedClubId) this.selectedId = this.store.get().pinnedClubId!;
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
    const questState = this.opts.getQuestState();
    const clubs = this.store.views(questState);
    const progress = this.store.progress(questState);
    const selected = clubs.find((club) => club.id === this.selectedId) ?? clubs[0]!;
    const next = selected.nextChapter;
    const clubRail = clubs.map((club, index) => `<button class="club-rail-item ${club.id === selected.id ? 'selected' : ''}" data-club="${club.id}" style="--club-index:${index}">
      <i>${escapeHtml(club.mark)}</i><span><small>${escapeHtml(club.code)}</small><b>${escapeHtml(club.name)}</b><em>${club.rankName} · ${club.rank}/5장</em></span>${club.pinned ? '<strong>관심</strong>' : club.ready ? `<strong>${club.ready}장 준비</strong>` : ''}
    </button>`).join('');

    const conditions = next ? next.conditions.map((condition) => `<li class="${condition.complete ? 'complete' : ''}">
      <i>${condition.complete ? '완' : '중'}</i><div><b>${escapeHtml(condition.label)}</b><span>${escapeHtml(condition.location)} · ${Math.min(condition.current, condition.goal)}/${condition.goal}</span><em><i style="width:${condition.progressPct}%"></i></em></div>
      ${condition.complete ? '<strong>기록됨</strong>' : `<button data-navigate="${escapeHtml(condition.key)}">길 안내</button>`}
    </li>`).join('') : '';
    const nextBlock = next ? `<section class="club-current">
      <header><div><small>${escapeHtml(next.code)} · CHAPTER ${next.chapter}</small><h2>${escapeHtml(next.name)}</h2><p>${escapeHtml(next.note)}</p></div><strong>${next.stamps}<i>/3</i></strong></header>
      <ol>${conditions}</ol>
      <footer><div><small>발간 페이지</small><b>${escapeHtml(next.pageTitle)}</b></div><button class="club-claim" data-claim="${next.id}" ${next.complete && next.available ? '' : 'disabled'}>${next.complete ? '새 장 발간하기' : '세 기록을 모으면 발간'}</button></footer>
    </section>` : `<section class="club-current club-complete"><small>ALL FIVE CHAPTERS PUBLISHED</small><h2>${escapeHtml(selected.name)} 전권 완성</h2><p>이 동아리의 다섯 장을 모두 발간했어요. 좋아하는 활동을 계속해도 평생 기록은 그대로 쌓입니다.</p></section>`;

    const timeline = selected.chapters.map((item) => {
      const status = item.claimed ? 'published' : item.complete && item.available ? 'ready' : item.available ? 'active' : 'locked';
      const label = status === 'published' ? '발간 완료' : status === 'ready' ? '발간 준비' : status === 'active' ? `${item.stamps}/3 기록` : '앞 장 이후';
      return `<article class="club-chapter-row is-${status}"><div><small>${String(item.chapter).padStart(2, '0')}</small><i></i></div><span><b>${escapeHtml(item.name)}</b><em>${escapeHtml(item.pageTitle)}</em></span><strong>${label}</strong></article>`;
    }).join('');
    const archive = selected.chapters.filter((item) => item.claimed).map((item) => `<article><small>${escapeHtml(item.code)}</small><b>${escapeHtml(item.pageTitle)}</b><p>${escapeHtml(item.pageText)}</p></article>`).join('');
    const fanKit = selected.fanKit.map((item) => `<article class="${item.unlocked ? 'unlocked' : 'locked'}">
      <i>${item.unlocked ? ['핀', '깃', '빛', '물', '책'][item.chapter - 1] : '?'}</i><span><small>CHAPTER ${item.chapter} · ${item.kind.toUpperCase()}</small><b>${escapeHtml(item.unlocked ? item.name : '아직 비어 있는 키트')}</b><em>${escapeHtml(item.unlocked ? item.description : `${item.chapter}장을 발간하면 영구 해금됩니다.`)}</em></span>
    </article>`).join('');
    const roomLocked = selected.rank === 0;

    this.root.innerHTML = `<div class="club-shell">
      <header class="club-header"><div><small>HONGDAE HOBBY SOCIETIES</small><h1>골목 동아리 수첩</h1><p>가입 경쟁도 탈퇴 불이익도 없습니다. 여섯 동아리가 과거와 현재의 생활 기록을 동시에 읽어요.</p></div>
        <div class="club-header-art"><img src="assets/isometric/hobby_club_board_v1.png" alt=""><button class="club-close" aria-label="닫기">닫기</button></div></header>
      <section class="club-overview"><span><small>발간한 장</small><b>${progress.chapters}<i>/${progress.totalChapters}</i></b></span><span><small>활동 동아리</small><b>${progress.societies}<i>/${progress.totalSocieties}</i></b></span><span><small>응원 키트</small><b>${progress.fanKitPieces}<i>/${progress.totalFanKitPieces}</i></b></span><span><small>완성 키트</small><b>${progress.completeKits}<i>/6</i></b></span><span><small>대표 아지트</small><b>${progress.featuredClubs}<i>/3</i></b></span><span><small>장면 다시 보기</small><b>${progress.roomReplays}<i>회</i></b></span></section>
      <main class="club-layout"><aside class="club-rail"><header><small>SIX OPEN SOCIETIES</small><b>동시에 자라는 여섯 모임</b></header>${clubRail}</aside>
        <section class="club-workspace"><header class="club-selected-head"><div class="club-selected-mark">${escapeHtml(selected.mark)}</div><div><small>${escapeHtml(selected.code)} · ${escapeHtml(selected.curator)}</small><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.description)}</p></div>
          <button data-pin="${selected.id}" class="${selected.pinned ? 'pinned' : ''}">${selected.pinned ? '★ 나의 최애 동아리' : '최애 동아리로 고르기'}</button></header>
          <section class="club-fan-room ${roomLocked ? 'is-locked' : ''}">
            <div class="club-room-visual"><canvas width="${HOBBY_CLUB_ROOM_ART_W}" height="${HOBBY_CLUB_ROOM_ART_H}" aria-label="${escapeHtml(selected.room.roomName)} 2.5D 픽셀 장면"></canvas>
              <span><small>${escapeHtml(selected.room.roomName)}</small><b>${roomLocked ? '첫 장을 발간하면 문이 열려요' : escapeHtml(selected.room.cheerLine)}</b></span>
            </div>
            <div class="club-room-info"><header><div><small>MY FAVORITE CLUBROOM</small><h3>응원 키트와 아지트</h3></div><strong>${selected.rank}<i>/5</i></strong></header>
              <p>발간한 장마다 키트 한 점과 방의 장식 한 단계가 영구 해금됩니다. 전투 능력치는 없고, 내 캐릭터와 동행이 함께 머무는 취향 장면으로 남아요.</p>
              <div class="club-room-actions">
                <button data-feature="${selected.id}" class="${selected.featured ? 'featured' : ''}" ${roomLocked ? 'disabled' : ''}>${selected.featured ? '★ 대표 아지트 전시 중' : `대표 전시 ${progress.featuredClubs}/3`}</button>
                <button data-replay="${selected.id}" ${roomLocked ? 'disabled' : ''}>아지트 장면 다시 보기 <i>${selected.roomReplayCount}</i></button>
              </div>
            </div>
            <div class="club-fan-kit">${fanKit}</div>
          </section>
          ${nextBlock}<section class="club-timeline"><header><small>FIVE CHAPTER LEDGER</small><b>${escapeHtml(selected.rankName)} · ${selected.rank}/5장</b></header>${timeline}</section>
          <details class="club-archive" ${archive ? '' : 'disabled'}><summary>발간한 동아리 페이지 ${selected.rank}장 읽기</summary><div>${archive || '<p>첫 장의 세 기록을 모으면 이곳에 짧은 동아리 이야기가 보관됩니다.</p>'}</div></details>
        </section></main>
      <footer class="club-footer"><p aria-live="polite">${escapeHtml(this.feedback || (selected.nextCondition
        ? `${selected.nextCondition.label}부터 이어 보면 가장 가까워요. 이미 한 활동은 다시 할 필요가 없습니다.`
        : selected.nextChapter
          ? '세 기록이 모두 모였어요. 준비된 새 장을 발간할 수 있습니다.'
          : '모든 장을 발간했어요. 좋아하는 활동을 계속 즐겨 주세요.'))}</p><span>기간 제한 없음 · 모든 동아리 동시 진행 · 기록 소급 적용</span></footer>
    </div>`;
    const canvas = this.root.querySelector<HTMLCanvasElement>('.club-room-visual canvas');
    const appearance = this.opts.getAppearance?.();
    if (canvas && appearance) {
      paintHobbyClubRoomArt(
        canvas, selected.room, selected.rank, appearance, this.opts.getPet?.() ?? null, selected.roomReplayCount,
      );
    }
    this.bind(selected.nextChapter?.conditions ?? []);
  }

  private bind(conditions: HobbyClubConditionView[]): void {
    this.root.querySelector<HTMLButtonElement>('.club-close')?.addEventListener('click', () => this.close());
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-club]')) button.addEventListener('click', () => {
      this.selectedId = button.dataset.club as HobbyClubId;
      this.feedback = '';
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-pin]')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      this.store.pin(button.dataset.pin as HobbyClubId);
      this.feedback = this.store.get().pinnedClubId ? '나의 최애 동아리로 골랐어요. 다른 동아리의 진행도 그대로 이어집니다.' : '최애 표시를 풀었어요. 언제든 다시 고를 수 있습니다.';
      this.opts.onFanChanged?.(this.store.progress(this.opts.getQuestState()));
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-feature]')?.addEventListener('click', (event) => {
      const clubId = (event.currentTarget as HTMLButtonElement).dataset.feature as HobbyClubId;
      const before = this.store.get().featuredClubIds.includes(clubId);
      const changed = this.store.toggleFeatured(clubId);
      this.feedback = changed
        ? before ? '대표 아지트 전시에서 내렸어요.' : '대표 아지트 전시에 올렸어요.'
        : '대표 아지트는 최대 세 곳까지 전시할 수 있어요.';
      if (changed) this.opts.onFanChanged?.(this.store.progress(this.opts.getQuestState()));
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-replay]')?.addEventListener('click', (event) => {
      const clubId = (event.currentTarget as HTMLButtonElement).dataset.replay as HobbyClubId;
      const changed = this.store.replayRoom(clubId);
      if (!changed) return;
      const club = this.store.views(this.opts.getQuestState()).find((item) => item.id === clubId);
      this.feedback = club ? `「${club.room.roomName}」 장면을 다시 펼쳤어요.` : '아지트 장면을 다시 펼쳤어요.';
      this.opts.onFanChanged?.(this.store.progress(this.opts.getQuestState()));
      if (club) this.opts.onReplay?.(club);
      this.render();
    });
    this.root.querySelector<HTMLButtonElement>('[data-claim]')?.addEventListener('click', (event) => {
      const result = this.store.claim((event.currentTarget as HTMLButtonElement).dataset.claim!, this.opts.getQuestState());
      this.feedback = result.ok ? `「${result.chapter.pageTitle}」 페이지를 발간했어요.` : '아직 이 장에 필요한 기록이 남아 있어요.';
      this.opts.onChanged?.(this.store.progress(this.opts.getQuestState()), result);
      this.render();
    });
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-navigate]')) button.addEventListener('click', () => {
      const condition = conditions.find((item) => item.key === button.dataset.navigate);
      if (!condition) return;
      this.close();
      this.opts.onNavigate?.(condition);
    });
  }
}
