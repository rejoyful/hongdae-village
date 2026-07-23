import { paintAdventureRoleArt } from '../game/art/adventureRoleArt';
import {
  ADVENTURE_CHARMS, ADVENTURE_CHARM_MAX, ADVENTURE_KIT_SLOTS, ADVENTURE_ROLES,
  AdventureRoleStore, type AdventureRoleProgress,
} from '../game/battle/adventureRoles';

interface AdventureRolePanelOptions {
  onToggle: (open: boolean) => void;
  getLevel: () => number;
  onChanged?: (progress: AdventureRoleProgress) => void;
}

/** 전직 잠금 없이 역할·부적·세팅을 바꾸는 친절한 전투 빌드 수첩. */
export class AdventureRolePanel {
  private readonly root: HTMLDivElement;
  private opened = false;
  private feedback = '';

  constructor(
    private readonly store: AdventureRoleStore,
    private readonly opts: AdventureRolePanelOptions,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'hv-adventure-role-modal';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }
  progress(): AdventureRoleProgress { return this.store.progress(this.opts.getLevel()); }

  open(): void {
    if (!this.opened) {
      this.opened = true;
      this.root.style.display = 'flex';
      this.opts.onToggle(true);
    }
    this.feedback = '';
    this.render();
  }

  private render(): void {
    const state = this.store.get();
    const role = this.store.role();
    const level = this.opts.getLevel();
    const progress = this.progress();
    const modifier = this.store.modifier();
    const roleCards = ADVENTURE_ROLES.map((item) => `<button data-role="${item.id}" class="${state.roleId === item.id ? 'selected' : ''}" style="--role-color:${item.color}">
      <i>${item.mark}</i><span><small>${item.epithet}</small><b>${item.name}</b><em>${item.description}</em></span><strong>${item.bonuses.join(' · ')}</strong>
    </button>`).join('');
    const charmCards = ADVENTURE_CHARMS.map((charm) => {
      const unlocked = level >= charm.unlockLevel;
      const equipped = state.charmIds.includes(charm.id);
      return `<button data-charm="${charm.id}" class="${equipped ? 'selected' : ''} ${unlocked ? '' : 'locked'}" style="--charm-color:${charm.color}" ${unlocked ? '' : 'disabled'}>
        <i>${unlocked ? charm.mark : '?'}</i><span><small>${unlocked ? `Lv.${charm.unlockLevel} 해금` : `전투 Lv.${charm.unlockLevel}에서 열림`}</small><b>${unlocked ? charm.name : '아직 봉인된 원정 부적'}</b><em>${unlocked ? charm.description : '레벨이 오르면 자동으로 수령해요.'}</em></span>${equipped ? '<strong>장착 중</strong>' : ''}
      </button>`;
    }).join('');
    const kits = Array.from({ length: ADVENTURE_KIT_SLOTS }, (_, index) => {
      const kit = state.presets[index];
      const savedRole = kit ? ADVENTURE_ROLES.find((item) => item.id === kit.roleId) : null;
      const charmNames = kit?.charmIds.map((id) => ADVENTURE_CHARMS.find((item) => item.id === id)?.name).filter(Boolean) ?? [];
      return `<article class="${kit ? 'saved' : 'empty'}"><i>${index + 1}</i><span><small>원정 키트 ${index + 1}</small><b>${savedRole?.name ?? '비어 있는 세팅칸'}</b><em>${kit ? (charmNames.join(' · ') || '부적 없이 가볍게') : '현재 역할과 부적을 저장할 수 있어요.'}</em></span><nav>${kit ? `<button data-kit-apply="${index}">불러오기</button>` : ''}<button data-kit-save="${index}">${kit ? '덮어쓰기' : '저장하기'}</button></nav></article>`;
    }).join('');
    this.root.innerHTML = `<section class="adventure-role-book">
      <header><div><small>FRIENDLY EXPEDITION LOADOUT</small><h1>골목 원정 키트</h1><p>네 역할과 두 부적을 자유롭게 조합해요. 전직·초기화 비용·잘못 고른 선택은 없습니다.</p></div><button class="adventure-role-close">닫기</button></header>
      <section class="adventure-role-hero" style="--role-color:${role.color}">
        <canvas width="240" height="96" aria-label="${role.name} 픽셀 원정 장면"></canvas>
        <div><small>CURRENT ROLE</small><h2>${role.mark} ${role.name}</h2><p>${role.epithet} · ${role.description}</p><div><span>공격 <b>${Math.round(modifier.attackMultiplier * 100)}%</b></span><span>피해 <b>${Math.round(modifier.damageTakenMultiplier * 100)}%</b></span><span>속도 <b>${Math.round((1 / modifier.attackIntervalMultiplier) * 100)}%</b></span><span>경험 <b>${Math.round(modifier.xpMultiplier * 100)}%</b></span></div></div>
        <aside><span>전투 Lv.</span><strong>${level}</strong><small>역할 ${progress.rolesTried}/4 · 부적 ${progress.charmsUnlocked}/8</small></aside>
      </section>
      ${this.feedback ? `<p class="adventure-role-feedback">${this.feedback}</p>` : ''}
      <section class="adventure-role-section"><header><div><small>FOUR OPEN ROLES</small><h2>언제든 바꾸는 네 역할</h2></div><span>역할 변경 즉시 적용 · 기록 보존</span></header><div class="adventure-role-grid">${roleCards}</div></section>
      <section class="adventure-role-section charms"><header><div><small>EIGHT GROWTH CHARMS</small><h2>원정 부적 두 자리</h2></div><span>${state.charmIds.length}/${ADVENTURE_CHARM_MAX} 장착 · 레벨 달성 시 자동 해금</span></header><div class="adventure-charm-grid">${charmCards}</div></section>
      <section class="adventure-role-section kits"><header><div><small>THREE SAFE PRESETS</small><h2>세 가지 원정 키트 보관함</h2></div><span>저장·불러오기 무료 · 장비와 진행도 불변</span></header><div>${kits}</div></section>
      <footer>전투는 동쪽 외곽숲에서만 선택적으로 진행 · 마을 생활에는 불이익 없음 · 선택 변경 비용·진행도 손실 없음</footer>
    </section>`;
    const canvas = this.root.querySelector<HTMLCanvasElement>('.adventure-role-hero canvas');
    if (canvas) paintAdventureRoleArt(canvas, state);
    this.root.querySelector('.adventure-role-close')!.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-role]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.selectRole(button.dataset.role!);
      this.feedback = result === 'selected' ? '역할을 바꿨어요. 장비·레벨·부적은 그대로 유지됩니다.' : '이미 이 역할로 원정 준비를 마쳤어요.';
      this.changed();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-charm]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.toggleCharm(button.dataset.charm!, level);
      this.feedback = result === 'added' ? '원정 부적을 장착했어요. 전투 수치에 바로 반영됩니다.'
        : result === 'removed' ? '부적을 안전하게 보관함으로 돌렸어요.'
          : result === 'full' ? '부적 자리는 두 칸이에요. 장착 중인 부적 하나를 먼저 내려 주세요.'
            : '이 부적은 전투 레벨이 오르면 자동으로 열립니다.';
      this.changed();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-kit-save]').forEach((button) => button.addEventListener('click', () => {
      this.store.saveKit(Number(button.dataset.kitSave));
      this.feedback = `현재 조합을 원정 키트 ${Number(button.dataset.kitSave) + 1}번에 저장했어요.`;
      this.changed();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-kit-apply]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.applyKit(Number(button.dataset.kitApply), level);
      this.feedback = result === 'applied' ? `원정 키트 ${Number(button.dataset.kitApply) + 1}번을 불러왔어요.` : '아직 저장하지 않은 세팅칸이에요.';
      this.changed();
    }));
  }

  private changed(): void {
    this.opts.onChanged?.(this.progress());
    this.render();
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  destroy(): void { this.root.remove(); }
}
