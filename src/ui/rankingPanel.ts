import { computePoints, type RankRow } from '../game/ranking';

/** 랭킹 패널 (레퍼런스 IMG_9826) — 생활 포인트 + 가산값 내역 + 전체 랭킹 */
export class RankingPanel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(private readonly opts: {
    online: boolean;
    onToggle: (open: boolean) => void;
    /** 열 때 호출 — 최신 랭킹 목록 */
    fetchRows: () => Promise<RankRow[]>;
    myId: string;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-rank';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(stats: { coins: number; hearts: number; dexFound: number; trustSum: number }): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'flex';
    const p = computePoints(stats.coins, stats.hearts, stats.dexFound, stats.trustSum);
    this.root.innerHTML = `
      <div class="wood-frame rank-frame">
        <div class="wood-head"><h2>🏆 랭킹</h2><span class="pill">홍대 생활 포인트</span></div>
        <div class="wood-page rank-page">
          <p class="rank-caption">현재의 홍대 생활 포인트</p>
          <div class="rank-total">${p.total.toLocaleString()}pt</div>
          <p class="rank-desc">마을 주민들과 랭킹을 겨루자!<br>코인을 모으고 활동할수록 포인트가 쌓여요</p>
          <div class="rank-detail">
            <div class="rank-row head"><span>기본 pt / 보유 코인</span><b>${p.base.toLocaleString()}pt</b></div>
            <p class="rank-sub">가산값</p>
            <div class="rank-row"><span>퀘스트 하트 (${stats.hearts})</span><i>×5%</i><b>+${p.heartPct}%</b></div>
            <div class="rank-row"><span>도감 발견 (${stats.dexFound})</span><i>×1%</i><b>+${p.dexPct}%</b></div>
            <div class="rank-row"><span>주민 신뢰도 (${stats.trustSum})</span><i>÷50</i><b>+${p.trustPct}%</b></div>
          </div>
          <p class="rank-sub">전체 랭킹 (코인 기준)</p>
          <div class="rank-list"><p class="rank-loading">${this.opts.online ? '불러오는 중…' : '오프라인 모드 — 접속하면 랭킹이 보여요'}</p></div>
        </div>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.opts.onToggle(true);
    if (this.opts.online) void this.loadRows();
  }

  private async loadRows(): Promise<void> {
    const rows = await this.opts.fetchRows();
    const list = this.root.querySelector('.rank-list');
    if (!list || !this.opened) return;
    if (!rows.length) {
      list.innerHTML = '<p class="rank-loading">랭킹을 불러오지 못했어요</p>';
      return;
    }
    const medal = (rank: number): string =>
      rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
    list.innerHTML = rows.map((r) => `
      <div class="rank-item ${r.userId === this.opts.myId ? 'me' : ''}">
        <span class="rk">${medal(r.rank)}</span>
        <span class="nm">${escapeHtml(r.nickname)}${r.userId === this.opts.myId ? ' (나)' : ''}</span>
        <b>🪙 ${r.coins.toLocaleString()}</b>
      </div>`).join('');
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
