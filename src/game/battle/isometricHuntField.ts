import Phaser from 'phaser';
import { TILE, UI_FONT } from '../config';
import { ensureMonster } from '../art/monsterArt';
import { isometricMonsterScale } from '../art/assetManifest';
import { isoDepth, projectIsoWorld } from '../world/isometric';
import { huntZoneAtWorld, type IsoHuntZoneDef } from '../world/isometricVillageMap';
import { monstersOfTier, type MonsterSpecies } from './monsters';
import type { QualityProfile } from '../performance/performanceComfort';

interface IsoMob {
  sprite: Phaser.GameObjects.Sprite;
  bar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  species: MonsterSpecies;
  zone: IsoHuntZoneDef;
  x: number;
  y: number;
  hp: number;
  vx: number;
  vy: number;
  turnMs: number;
  atkCd: number;
  baseScale: number;
}

export interface IsometricHuntCallbacks {
  getPlayerPos: () => { x: number; y: number };
  getPlayerAtk: () => number;
  getPlayerAttackInterval?: () => number;
  combatEnabled?: () => boolean;
  currentTier: () => number;
  onPlayerHit: (damage: number) => void;
  onDefeat: (species: MonsterSpecies) => void;
  onZoneChange: (zone: IsoHuntZoneDef | null) => void;
  onSwing?: (targetScreenX: number) => void;
}

const MOBS_PER_ZONE = 4;
const PLAYER_RANGE = 44;
const MON_CHASE_RANGE = 78;
const MON_ATTACK_RANGE = 25;
const PLAYER_SWING_MS = 620;
const MON_ATTACK_MS = 1_150;
const MON_SPEED = 19;

/**
 * 논리 좌표에서 전투를 계산하고 매 프레임 아이소메트릭 화면에 투영한다.
 * 외곽숲 안의 몬스터만 플레이어를 인식하므로 생활권 전체는 안전하다.
 */
export class IsometricHuntField {
  private mobs: IsoMob[] = [];
  private swingCd = 0;
  private tier: number;
  private activeZoneId: string | null = null;
  private visualEvery = 1;
  private visualFrame = 0;
  private decorativeFx = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly zones: readonly IsoHuntZoneDef[],
    private readonly cb: IsometricHuntCallbacks,
  ) {
    this.tier = cb.currentTier();
    for (const zone of zones) for (let i = 0; i < MOBS_PER_ZONE; i++) this.spawn(zone);
  }

  private rnd(min: number, max: number): number { return min + Math.random() * (max - min); }

  private spawn(zone: IsoHuntZoneDef): void {
    const pool = monstersOfTier(this.tier);
    const species = pool[Math.floor(Math.random() * pool.length)]!;
    const key = ensureMonster(this.scene, species.id);
    if (!key) return;
    const x = this.rnd(zone.tx + 0.55, zone.tx + zone.w - 0.55) * TILE;
    const y = this.rnd(zone.ty + 0.55, zone.ty + zone.h - 0.55) * TILE;
    const projected = projectIsoWorld(x, y);
    const baseScale = isometricMonsterScale(species.id);
    const sprite = this.scene.add.sprite(projected.x, projected.y, key)
      .setOrigin(0.5, 0.82).setScale(baseScale);
    const bar = this.scene.add.graphics();
    const label = this.scene.add.text(projected.x, projected.y - 27, `T${species.tier} ${species.name}`, {
      fontFamily: UI_FONT, fontSize: '7px', color: '#fff1d0', backgroundColor: '#3b2848cc',
      padding: { x: 3, y: 1 }, resolution: 2,
    }).setOrigin(0.5, 1).setVisible(false);
    const angle = this.rnd(0, Math.PI * 2);
    this.mobs.push({
      sprite, bar, label, species, zone, x, y, hp: species.hp,
      vx: Math.cos(angle) * MON_SPEED, vy: Math.sin(angle) * MON_SPEED,
      turnMs: this.rnd(700, 1_900), atkCd: this.rnd(350, MON_ATTACK_MS), baseScale,
    });
  }

  private syncTier(): void {
    const next = this.cb.currentTier();
    if (next === this.tier) return;
    this.tier = next;
    for (const mob of this.mobs) this.destroyMob(mob);
    this.mobs = [];
    for (const zone of this.zones) for (let i = 0; i < MOBS_PER_ZONE; i++) this.spawn(zone);
  }

  private syncScreen(mob: IsoMob, nearPlayer: boolean): void {
    const p = projectIsoWorld(mob.x, mob.y);
    const depth = isoDepth({ tx: mob.x / TILE, ty: mob.y / TILE, w: 0, h: 0 }, 320);
    mob.sprite.setPosition(p.x, p.y).setDepth(depth);
    mob.bar.setDepth(depth + 2);
    const top = p.y - mob.sprite.displayHeight * mob.sprite.originY;
    mob.label.setPosition(p.x, top - 10).setDepth(depth + 3).setVisible(nearPlayer);
    const width = 22;
    const ratio = Math.max(0, mob.hp / mob.species.hp);
    mob.bar.clear();
    if (!nearPlayer && ratio >= 1) return;
    mob.bar.fillStyle(0x241b24, 0.78).fillRoundedRect(p.x - width / 2 - 1, top - 7, width + 2, 5, 2);
    mob.bar.fillStyle(ratio > 0.5 ? 0x72cf72 : ratio > 0.25 ? 0xefbe56 : 0xe45d61, 1)
      .fillRect(p.x - width / 2, top - 6, width * ratio, 3);
  }

  private hurt(mob: IsoMob, damage: number): void {
    mob.hp -= damage;
    mob.sprite.setTintFill(0xffffff).setScale(mob.baseScale * 1.15);
    this.scene.time.delayedCall(75, () => {
      if (mob.sprite.active) mob.sprite.clearTint().setScale(mob.baseScale);
    });
    const p = projectIsoWorld(mob.x, mob.y);
    const text = this.scene.add.text(p.x, p.y - 24, `-${damage}`, {
      fontFamily: UI_FONT, fontSize: '11px', color: '#ffe384', fontStyle: 'bold',
      stroke: '#452a18', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(999_000);
    this.scene.tweens.add({ targets: text, y: text.y - 16, alpha: 0, duration: 520, onComplete: () => text.destroy() });
  }

  private defeat(mob: IsoMob): void {
    if (this.decorativeFx) {
      const p = projectIsoWorld(mob.x, mob.y);
      const burst = this.scene.add.text(p.x, p.y - 7, '✦', {
        fontFamily: UI_FONT, fontSize: '22px', color: '#ffe4a0',
      }).setOrigin(0.5).setDepth(999_001).setScale(0.5);
      this.scene.tweens.add({ targets: burst, scale: 1.8, angle: 90, alpha: 0, duration: 420, onComplete: () => burst.destroy() });
    }
    this.destroyMob(mob);
    this.cb.onDefeat(mob.species);
  }

  private destroyMob(mob: IsoMob): void {
    mob.bar.destroy();
    mob.label.destroy();
    mob.sprite.destroy();
  }

  private swingFx(playerX: number, playerY: number, targetX: number): void {
    const p = projectIsoWorld(playerX, playerY);
    const target = projectIsoWorld(targetX, playerY);
    const direction = target.x >= p.x ? 1 : -1;
    this.cb.onSwing?.(target.x);
    if (!this.decorativeFx) return;
    const arc = this.scene.add.text(p.x + direction * 16, p.y - 7, '✧', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#fff3c4',
      stroke: '#8c6538', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(999_000).setScale(0.6);
    this.scene.tweens.add({
      targets: arc, scale: 1.5, alpha: 0, angle: direction * 110,
      duration: 250, onComplete: () => arc.destroy(),
    });
  }

  update(delta: number): void {
    this.syncTier();
    this.visualFrame = (this.visualFrame + 1) % this.visualEvery;
    const syncVisual = this.visualFrame === 0;
    const player = this.cb.getPlayerPos();
    const activeZone = huntZoneAtWorld(player.x, player.y);
    if ((activeZone?.id ?? null) !== this.activeZoneId) {
      this.activeZoneId = activeZone?.id ?? null;
      this.cb.onZoneChange(activeZone);
    }
    const dt = Math.min(delta, 60) / 1_000;
    const combatEnabled = this.cb.combatEnabled?.() ?? true;
    this.swingCd -= delta;
    let nearest: IsoMob | null = null;
    let nearestDistance = PLAYER_RANGE;

    for (const mob of this.mobs) {
      mob.turnMs -= delta;
      if (mob.turnMs <= 0) {
        const angle = this.rnd(0, Math.PI * 2);
        mob.vx = Math.cos(angle) * MON_SPEED;
        mob.vy = Math.sin(angle) * MON_SPEED;
        mob.turnMs = this.rnd(700, 1_900);
      }
      mob.x += mob.vx * dt;
      mob.y += mob.vy * dt;
      const minX = (mob.zone.tx + 0.35) * TILE;
      const maxX = (mob.zone.tx + mob.zone.w - 0.35) * TILE;
      const minY = (mob.zone.ty + 0.35) * TILE;
      const maxY = (mob.zone.ty + mob.zone.h - 0.35) * TILE;
      if (mob.x < minX) { mob.x = minX; mob.vx = Math.abs(mob.vx); }
      if (mob.x > maxX) { mob.x = maxX; mob.vx = -Math.abs(mob.vx); }
      if (mob.y < minY) { mob.y = minY; mob.vy = Math.abs(mob.vy); }
      if (mob.y > maxY) { mob.y = maxY; mob.vy = -Math.abs(mob.vy); }

      const sameZone = activeZone?.id === mob.zone.id;
      const distance = Math.hypot(mob.x - player.x, mob.y - player.y);
      mob.atkCd -= delta;
      if (combatEnabled && sameZone && distance < MON_CHASE_RANGE && distance > 0.001) {
        const chase = distance < MON_ATTACK_RANGE ? 0.25 : 0.68;
        mob.x += ((player.x - mob.x) / distance) * MON_SPEED * chase * dt;
        mob.y += ((player.y - mob.y) / distance) * MON_SPEED * chase * dt;
        if (distance < MON_ATTACK_RANGE && mob.atkCd <= 0) {
          mob.atkCd = MON_ATTACK_MS;
          mob.sprite.setTint(0xffb0b0).setScale(mob.baseScale * 1.15);
          this.scene.time.delayedCall(100, () => {
            if (mob.sprite.active) mob.sprite.clearTint().setScale(mob.baseScale);
          });
          this.cb.onPlayerHit(mob.species.atk);
        }
      }
      if (combatEnabled && sameZone && distance < nearestDistance) {
        nearest = mob;
        nearestDistance = distance;
      }
      mob.sprite.setFlipX(mob.vx < 0);
      if (syncVisual) this.syncScreen(mob, false);
    }

    // 이름표와 만체력 바는 현재 자동 공격 대상만 보여 줘 군집 시 시야를 가리지 않는다.
    if (nearest && syncVisual) this.syncScreen(nearest, true);
    if (!nearest || this.swingCd > 0) return;
    this.swingCd = Math.max(220, this.cb.getPlayerAttackInterval?.() ?? PLAYER_SWING_MS);
    const damage = Math.max(1, Math.round(this.cb.getPlayerAtk()));
    this.swingFx(player.x, player.y, nearest.x);
    this.hurt(nearest, damage);
    if (nearest.hp > 0) return;
    const zone = nearest.zone;
    this.mobs = this.mobs.filter((mob) => mob !== nearest);
    this.defeat(nearest);
    this.spawn(zone);
  }

  isInHuntZone(x: number, y: number): boolean { return huntZoneAtWorld(x, y) !== null; }

  setQuality(profile: Pick<QualityProfile, 'combatVisualEvery' | 'decorativeFx'>): void {
    this.visualEvery = Math.max(1, Math.floor(profile.combatVisualEvery));
    this.visualFrame = 0;
    this.decorativeFx = profile.decorativeFx;
  }

  destroy(): void {
    for (const mob of this.mobs) this.destroyMob(mob);
    this.mobs = [];
  }
}
