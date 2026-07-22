import { paintCharacterFrame, CHAR_W, CHAR_H } from '../game/art/characterArt';
import { paintPet, PET_W, PET_H } from '../game/art/petArt';
import { titleForLevel } from '../game/battle/titles';
import { petById } from '../game/pets/pets';
import { weaponById } from '../game/battle/weapons';
import type { Appearance } from '../game/art/appearance';

export interface PlayerInfo {
  nickname: string;
  level: number;
  appearance: Appearance;
  pet: string | null;
  weapon: string;
}

/** 다른 유저를 클릭하면 뜨는 정보창 — 외형·레벨·호칭·펫·무기 */
export class PlayerInfoPanel {
  private root: HTMLDivElement;
  private opened = false;

  constructor(private readonly onToggle: (open: boolean) => void) {
    this.root = document.createElement('div');
    this.root.className = 'hv-pinfo';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(info: PlayerInfo): void {
    this.opened = true;
    this.root.style.display = 'flex';
    this.render(info);
    this.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.onToggle(false);
  }

  private render(info: PlayerInfo): void {
    const pet = petById(info.pet);
    const weapon = weaponById(info.weapon);
    this.root.innerHTML = `
      <div class="hv-wood-modal" style="position:static;background:none;">
        <div class="wood-frame pinfo-frame">
          <div class="wood-head"><h2>👤 ${escapeHtml(info.nickname)}</h2><span class="pill">Lv.${info.level}</span></div>
          <div class="pinfo-body">
            <div class="pinfo-stage"><canvas class="pinfo-char" width="${CHAR_W}" height="${CHAR_H}"></canvas></div>
            <div class="pinfo-rows">
              <div class="pinfo-row"><b>호칭</b><span class="pinfo-title">〈${titleForLevel(info.level)}〉</span></div>
              <div class="pinfo-row"><b>레벨</b><span>Lv.${info.level}</span></div>
              <div class="pinfo-row"><b>무기</b><span>${weapon.emoji} ${weapon.name} <em>+${weapon.atk}</em></span></div>
              <div class="pinfo-row"><b>펫</b><span class="pinfo-pet">${pet
                ? `<canvas class="pinfo-petc" width="${PET_W}" height="${PET_H}"></canvas> ${pet.emoji} ${pet.name}`
                : '없음'}</span></div>
            </div>
          </div>
          <button class="wood-close">닫기</button>
        </div>
      </div>`;
    const cc = this.root.querySelector<HTMLCanvasElement>('.pinfo-char');
    if (cc) paintCharacterFrame(cc.getContext('2d')!, info.appearance, 0, 0);
    const pc = this.root.querySelector<HTMLCanvasElement>('.pinfo-petc');
    if (pc && pet) paintPet(pc.getContext('2d')!, pet.id);
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
