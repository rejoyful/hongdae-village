import { axRoster } from '../game/company/company';

const ROLE_EMOJI: Record<string, string> = {
  'AX 총괄': '👑', 'UX기획': '🎨', 'Dev': '💻', '서비스기획': '📋', 'Edu': '🎓',
};

/** AX기획실 조직도 보드 — 실제 팀원 소개 (직군별 그룹) */
export class RosterPanel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(private readonly opts: { onToggle: (open: boolean) => void }) {
    this.root = document.createElement('div');
    this.root.className = 'hv-wood-modal hv-roster';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    const roster = axRoster();
    // 직군별 그룹 (등장 순서 유지)
    const groups = new Map<string, string[]>();
    for (const m of roster) {
      if (!groups.has(m.role)) groups.set(m.role, []);
      groups.get(m.role)!.push(m.name);
    }
    const groupHtml = [...groups.entries()].map(([role, names]) => `
      <div class="roster-group">
        <div class="roster-role">${ROLE_EMOJI[role] ?? '🧑‍💼'} ${role} <span>${names.length}</span></div>
        <div class="roster-names">${names.map((n) => `<span>${n}</span>`).join('')}</div>
      </div>`).join('');
    this.root.style.display = 'flex';
    this.root.innerHTML = `
      <div class="wood-frame roster-frame">
        <div class="wood-head"><h2>🗂️ AX기획실 조직도</h2><span class="pill">총 ${roster.length}명 + 인턴</span></div>
        <div class="wood-page roster-body">${groupHtml}</div>
        <p class="roster-tip">인싸이트 AX기획실 · 실제로 이 게임을 만든 팀이에요 😎</p>
        <button class="wood-close">✕</button>
      </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
