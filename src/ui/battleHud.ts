export interface BattleStats {
  level: number;
  hp: number; maxHp: number;
  xp: number; xpNext: number;
  tier: number; kills: number; quota: number;
  weapon: string;
  role: string;
  fatigued: boolean;
  combatMode?: 'peaceful' | 'expedition';
}

/** 사냥터 전투 HUD (상단 중앙) — Lv·HP·XP·티어·무기·피로. 필드 안에서만 표시 */
export class BattleHud {
  private root: HTMLDivElement;
  private shown = false;
  private readonly canToggleMode: boolean;

  constructor(opts: { onOpenRoles?: () => void; onToggleCombatMode?: () => void } = {}) {
    this.canToggleMode = !!opts.onToggleCombatMode;
    this.root = document.createElement('div');
    this.root.className = 'hv-battle';
    this.root.style.display = 'none';
    this.root.innerHTML = `
      <div class="bt-lv">Lv.1</div>
      <div class="bt-bars">
        <div class="bt-bar bt-hp"><i></i><span>0/0</span></div>
        <div class="bt-bar bt-xp"><i></i></div>
      </div>
      <div class="bt-meta">
        <span class="bt-weap">✊ 맨손</span>
        <span class="bt-tier">티어 1 · 0/0</span>
      </div>
      <button class="bt-role" type="button">벽 수호자</button>
      <button class="bt-comfort" type="button" aria-label="외곽숲 전투 보호 모드 전환">
        <span>FOREST MODE</span><b>관찰 모드</b><small>선제 전투 없음</small>
      </button>
      <div class="bt-fatigue">😵 피로</div>`;
    document.body.appendChild(this.root);
    this.root.querySelector('.bt-role')!.addEventListener('click', () => opts.onOpenRoles?.());
    const comfort = this.root.querySelector<HTMLButtonElement>('.bt-comfort')!;
    comfort.style.display = this.canToggleMode ? 'grid' : 'none';
    comfort.addEventListener('click', () => opts.onToggleCombatMode?.());
  }

  setVisible(v: boolean): void {
    if (v === this.shown) return;
    this.shown = v;
    this.root.style.display = v ? 'flex' : 'none';
  }

  set(s: BattleStats): void {
    this.root.querySelector('.bt-lv')!.textContent = `Lv.${s.level}`;
    const hp = this.root.querySelector<HTMLElement>('.bt-hp i')!;
    hp.style.width = `${Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100))}%`;
    hp.style.background = s.hp / s.maxHp > 0.5 ? '#6ed06a' : s.hp / s.maxHp > 0.25 ? '#f2c25c' : '#e85a5a';
    this.root.querySelector('.bt-hp span')!.textContent = `${Math.max(0, Math.ceil(s.hp))}/${s.maxHp}`;
    this.root.querySelector<HTMLElement>('.bt-xp i')!.style.width = `${Math.min(100, (s.xp / s.xpNext) * 100)}%`;
    this.root.querySelector('.bt-weap')!.textContent = s.weapon;
    this.root.querySelector('.bt-tier')!.textContent = `티어 ${s.tier} · ${s.kills}/${s.quota}`;
    this.root.querySelector('.bt-role')!.textContent = s.role;
    this.root.querySelector<HTMLElement>('.bt-fatigue')!.style.display = s.fatigued ? 'block' : 'none';
    const peaceful = s.combatMode === 'peaceful';
    this.root.classList.toggle('is-peaceful', peaceful);
    const comfort = this.root.querySelector<HTMLButtonElement>('.bt-comfort')!;
    comfort.querySelector('b')!.textContent = peaceful ? '관찰 모드' : '원정 모드';
    comfort.querySelector('small')!.textContent = peaceful ? '선제 전투 없음' : '자동 전투 중';
    comfort.setAttribute('aria-pressed', peaceful ? 'false' : 'true');
    comfort.title = peaceful ? '눌러서 원정 모드 시작' : '눌러서 관찰 모드로 돌아가기';
  }

  destroy(): void { this.root.remove(); }
}
