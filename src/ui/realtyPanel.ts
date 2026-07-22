import { HOUSE_SPECS, DEAL_LABEL, type DealType } from '../game/realestate/realEstate';
import type { Property } from '../db/realEstateApi';

const TYPE_EMOJI: Record<string, string> = {
  banjiha: '🪟', oneroom: '🚪', villa: '🏢', apt: '🏬', house: '🏡',
};

/** 부동산(복덕방) 매물 패널 — 전세·월세·매매 계약 / 퇴실·매도 / 월세 납부 */
export class RealtyPanel {
  private root: HTMLDivElement;
  private opened = false;
  private props: Property[] = [];
  private coins = 0;
  private myId = '';
  private filter: 'all' | 'vacant' | 'mine' = 'all';

  constructor(private readonly opts: {
    online: boolean;
    onToggle: (open: boolean) => void;
    onLease: (id: number, deal: DealType) => void;
    onMoveOut: (id: number) => void;
    onSell: (id: number) => void;
    onPayRent: (id: number) => void;
  }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-realty';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(props: Property[], coins: number, myId: string): void {
    if (this.opened) return;
    this.opened = true;
    this.props = props;
    this.coins = coins;
    this.myId = myId;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onToggle(true);
  }

  /** 계약/납부 후 최신 상태로 다시 그린다 (패널 유지) */
  update(props: Property[], coins: number): void {
    this.props = props;
    this.coins = coins;
    if (this.opened) this.render();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private rows(): Property[] {
    return this.props.filter((p) => {
      if (this.filter === 'vacant') return p.holderId === null;
      if (this.filter === 'mine') return p.holderId === this.myId;
      return true;
    });
  }

  private card(p: Property): string {
    const spec = HOUSE_SPECS[p.houseType];
    const mine = p.holderId === this.myId;
    const vacant = p.holderId === null;
    const can = (cost: number) => this.opts.online && this.coins >= cost;
    let status = '';
    let actions = '';
    if (mine) {
      status = `<span class="tag mine">내 집 · ${p.dealType ? DEAL_LABEL[p.dealType] : ''}</span>`;
      if (p.dealType === 'maemae') {
        actions = `<button data-act="sell" data-id="${p.id}" class="danger">매도 (+${Math.floor(spec.price * 0.9).toLocaleString()})</button>`;
      } else {
        const rentBadge = p.rentDue > 0 ? `<span class="rent-due">미납 ${p.rentDue}</span>` : '';
        const pay = p.rentDue > 0 ? `<button data-act="pay" data-id="${p.id}">월세 납부 ${p.rentDue}</button>` : '';
        actions = `${rentBadge}${pay}<button data-act="moveout" data-id="${p.id}" class="danger">퇴실 (보증금 환급)</button>`;
      }
    } else if (vacant) {
      status = '<span class="tag vacant">공실</span>';
      actions = `
        <button data-act="jeonse" data-id="${p.id}" ${can(spec.jeonseDeposit) ? '' : 'disabled'}>전세 ${spec.jeonseDeposit.toLocaleString()}</button>
        <button data-act="wolse" data-id="${p.id}" ${can(spec.wolseDeposit) ? '' : 'disabled'}>월세 보증${spec.wolseDeposit.toLocaleString()}/월${spec.monthlyRent}</button>
        <button data-act="maemae" data-id="${p.id}" ${can(spec.price) ? '' : 'disabled'}>매매 ${spec.price.toLocaleString()}</button>`;
    } else {
      status = '<span class="tag taken">계약중</span>';
    }
    return `
      <div class="realty-card ${mine ? 'is-mine' : ''}">
        <div class="realty-head">
          <span class="ico">${TYPE_EMOJI[p.houseType] ?? '🏠'}</span>
          <b>${spec.label}</b><span class="rooms">방 ${spec.rooms}칸</span>
          ${status}
        </div>
        <p class="realty-desc">${spec.desc}</p>
        <div class="realty-actions">${actions}</div>
      </div>`;
  }

  private render(): void {
    const list = this.rows().map((p) => this.card(p)).join('');
    this.root.innerHTML = `
      <div class="wood-frame realty-frame">
        <div class="wood-head">
          <h2>🏘️ 복덕방 · 매물</h2>
          <span class="pill">🪙 ${this.coins.toLocaleString()}</span>
        </div>
        <div class="wood-tabs realty-tabs">
          ${(['all', 'vacant', 'mine'] as const).map((f) => `
            <button data-filter="${f}" class="${this.filter === f ? 'sel' : ''}">
              ${f === 'all' ? '전체' : f === 'vacant' ? '공실' : '내 집'}</button>`).join('')}
        </div>
        <div class="wood-page realty-list">${list || '<p class="realty-empty">해당하는 매물이 없어요</p>'}</div>
        ${this.opts.online ? '' : '<p class="off" style="text-align:center;color:#fff2d8;font-size:11px">오프라인 — 계약은 접속 후 가능해요</p>'}
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => {
      b.addEventListener('click', () => { this.filter = b.dataset.filter as 'all' | 'vacant' | 'mine'; this.render(); });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
      const id = Number(b.dataset.id);
      b.addEventListener('click', () => {
        const a = b.dataset.act!;
        if (a === 'moveout') { if (!confirm('퇴실하시겠어요? 배치한 가구는 사라지고 보증금이 환급돼요.')) return; this.opts.onMoveOut(id); }
        else if (a === 'sell') { if (!confirm('매도하시겠어요? 시세의 90%가 환급돼요.')) return; this.opts.onSell(id); }
        else if (a === 'pay') this.opts.onPayRent(id);
        else this.opts.onLease(id, a as DealType);
      });
    });
  }

  destroy(): void { this.root.remove(); }
}
