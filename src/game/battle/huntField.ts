import Phaser from 'phaser';
import { ensureMonster, MON_H } from '../art/monsterArt';
import { monstersOfTier, type MonsterSpecies } from './monsters';

export interface FieldRect { x: number; y: number; w: number; h: number } // world px

interface Mob {
  sprite: Phaser.GameObjects.Sprite;
  bar: Phaser.GameObjects.Graphics;
  species: MonsterSpecies;
  hp: number;
  vx: number; vy: number;
  turnMs: number;   // 방향 전환까지
  atkCd: number;    // 공격 쿨다운
}

export interface HuntCallbacks {
  getPlayerPos: () => { x: number; y: number };
  getPlayerAtk: () => number;
  currentTier: () => number;
  onPlayerHit: (dmg: number) => void;   // 씬이 HP·사망 처리
  onDefeat: (species: MonsterSpecies) => void; // 씬이 경험치·조각·티어 처리
}

const TARGET_COUNT = 9;       // 필드에 유지할 몬스터 수
const PLAYER_RANGE = 30;      // 자동 공격 반경(px)
const MON_RANGE = 24;         // 몬스터 공격 반경(px)
const PLAYER_SWING_MS = 620;  // 내 휘두르기 간격
const MON_ATK_MS = 1150;      // 몬스터 공격 간격
const MON_SPEED = 22;         // px/s

/** 사냥터 전투 컨트롤러 — 몬스터 로밍 + 근접 자동 전투 + 처치·리스폰·티어 전진 */
export class HuntField {
  private mobs: Mob[] = [];
  private swingCd = 0;
  private tier: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly field: FieldRect,
    private readonly cb: HuntCallbacks,
  ) {
    this.tier = cb.currentTier();
    for (let i = 0; i < TARGET_COUNT; i++) this.spawn();
  }

  private rnd(a: number, b: number): number { return a + Math.random() * (b - a); }

  private spawn(): void {
    const pool = monstersOfTier(this.tier);
    const species = pool[Math.floor(Math.random() * pool.length)]!;
    const key = ensureMonster(this.scene, species.id);
    if (!key) return;
    const x = this.rnd(this.field.x + 12, this.field.x + this.field.w - 12);
    const y = this.rnd(this.field.y + 12, this.field.y + this.field.h - 12);
    const sprite = this.scene.add.sprite(x, y, key).setOrigin(0.5, 0.8).setDepth(8).setScale(1.2);
    const bar = this.scene.add.graphics().setDepth(9);
    const ang = this.rnd(0, Math.PI * 2);
    this.mobs.push({
      sprite, bar, species, hp: species.hp,
      vx: Math.cos(ang) * MON_SPEED, vy: Math.sin(ang) * MON_SPEED,
      turnMs: this.rnd(600, 1800), atkCd: this.rnd(300, MON_ATK_MS),
    });
  }

  /** 티어가 바뀌면 다음 티어 몬스터로 교체 */
  private syncTier(): void {
    const t = this.cb.currentTier();
    if (t !== this.tier) {
      this.tier = t;
      // 남은 몬스터를 서서히 새 티어로 — 즉시 전부 교체(연출은 리스폰이 담당)
      for (const m of this.mobs) { m.bar.destroy(); m.sprite.destroy(); }
      this.mobs = [];
      for (let i = 0; i < TARGET_COUNT; i++) this.spawn();
    }
  }

  private drawBar(m: Mob): void {
    const w = 16, x = m.sprite.x - w / 2, y = m.sprite.y - MON_H * 1.2 - 4;
    const ratio = Math.max(0, m.hp / m.species.hp);
    m.bar.clear();
    m.bar.fillStyle(0x000000, 0.5).fillRect(x - 1, y - 1, w + 2, 5);
    m.bar.fillStyle(0x8a2a2a, 1).fillRect(x, y, w, 3);
    m.bar.fillStyle(ratio > 0.5 ? 0x6ed06a : ratio > 0.25 ? 0xf2c25c : 0xe85a5a, 1).fillRect(x, y, w * ratio, 3);
  }

  private hurt(m: Mob, dmg: number): void {
    m.hp -= dmg;
    m.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => m.sprite.clearTint());
    const t = this.scene.add.text(m.sprite.x, m.sprite.y - 18, `-${dmg}`, {
      fontFamily: 'system-ui', fontSize: '11px', color: '#ffe08a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 500, onComplete: () => t.destroy() });
  }

  private defeat(m: Mob): void {
    const boom = this.scene.add.text(m.sprite.x, m.sprite.y - 6, '💥', { fontSize: '18px' })
      .setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({ targets: boom, scale: 1.6, alpha: 0, duration: 380, onComplete: () => boom.destroy() });
    m.bar.destroy(); m.sprite.destroy();
    this.cb.onDefeat(m.species);
  }

  private swingFx(px: number, py: number, tx: number): void {
    const dir = tx >= px ? 1 : -1;
    const arc = this.scene.add.text(px + dir * 14, py - 4, '✦', {
      fontFamily: 'system-ui', fontSize: '16px', color: '#fff2c8',
    }).setOrigin(0.5).setDepth(21).setScale(0.6);
    this.scene.tweens.add({ targets: arc, scale: 1.4, alpha: 0, angle: dir * 90, duration: 240, onComplete: () => arc.destroy() });
  }

  /** 매 프레임 호출. 플레이어 위치 기준으로 전투 판정 */
  update(delta: number): void {
    this.syncTier();
    const p = this.cb.getPlayerPos();
    const dt = delta / 1000;
    this.swingCd -= delta;

    // 가장 가까운 사정권 내 몬스터(내 자동 공격 대상)
    let nearest: Mob | null = null; let nd = PLAYER_RANGE;

    for (const m of this.mobs) {
      // 로밍
      m.turnMs -= delta;
      if (m.turnMs <= 0) { const a = this.rnd(0, Math.PI * 2); m.vx = Math.cos(a) * MON_SPEED; m.vy = Math.sin(a) * MON_SPEED; m.turnMs = this.rnd(600, 1800); }
      m.sprite.x += m.vx * dt; m.sprite.y += m.vy * dt;
      // 필드 경계 반사
      if (m.sprite.x < this.field.x + 8) { m.sprite.x = this.field.x + 8; m.vx = Math.abs(m.vx); }
      if (m.sprite.x > this.field.x + this.field.w - 8) { m.sprite.x = this.field.x + this.field.w - 8; m.vx = -Math.abs(m.vx); }
      if (m.sprite.y < this.field.y + 8) { m.sprite.y = this.field.y + 8; m.vy = Math.abs(m.vy); }
      if (m.sprite.y > this.field.y + this.field.h - 8) { m.sprite.y = this.field.y + this.field.h - 8; m.vy = -Math.abs(m.vy); }
      m.sprite.setFlipX(m.vx < 0);

      const dist = Math.hypot(m.sprite.x - p.x, m.sprite.y - p.y);
      // 몬스터 공격 (근접 시)
      m.atkCd -= delta;
      if (dist < MON_RANGE) {
        // 플레이어 쪽으로 살짝 다가옴(추적)
        m.sprite.x += ((p.x - m.sprite.x) / dist) * MON_SPEED * 0.6 * dt;
        m.sprite.y += ((p.y - m.sprite.y) / dist) * MON_SPEED * 0.6 * dt;
        if (m.atkCd <= 0) {
          m.atkCd = MON_ATK_MS;
          this.scene.tweens.add({ targets: m.sprite, x: m.sprite.x + (p.x > m.sprite.x ? 4 : -4), duration: 90, yoyo: true });
          this.cb.onPlayerHit(m.species.atk);
        }
      }
      if (dist < nd) { nd = dist; nearest = m; }
      this.drawBar(m);
    }

    // 내 자동 공격 (사정권 내 가장 가까운 몬스터)
    if (nearest && this.swingCd <= 0) {
      this.swingCd = PLAYER_SWING_MS;
      const dmg = Math.max(1, Math.round(this.cb.getPlayerAtk()));
      this.swingFx(p.x, p.y, nearest.sprite.x);
      this.hurt(nearest, dmg);
      if (nearest.hp <= 0) {
        this.mobs = this.mobs.filter((x) => x !== nearest);
        this.defeat(nearest);
        this.spawn(); // 빈자리 보충 (티어 유지)
      }
    }
  }

  /** 플레이어가 사냥터 안에 있는지 */
  contains(x: number, y: number): boolean {
    return x >= this.field.x && x <= this.field.x + this.field.w
      && y >= this.field.y && y <= this.field.y + this.field.h;
  }

  destroy(): void {
    for (const m of this.mobs) { m.bar.destroy(); m.sprite.destroy(); }
    this.mobs = [];
  }
}
