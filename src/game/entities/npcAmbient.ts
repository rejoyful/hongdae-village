import type Phaser from 'phaser';
import { TILE } from '../config';
import { tileToWorld, worldToTile, type CollisionGrid, type Vec2 } from '../world/grid';
import { stepPlayer, type MoveInput } from './playerMotion';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { randomAppearance } from '../art/appearance';
import { seeded } from '../art/pixelCanvas';
import { pickLine, cohortForIndex, slotForHour, type Cohort } from './npcChatter';
import { seoulHour } from '../world/timeOfDay';

interface Npc {
  sprite: Phaser.GameObjects.Sprite;
  charKey: string;
  target: Vec2 | null;
  waitUntil: number;
  facing: 0 | 1 | 2 | 3;
  speed: number;
  cohort: Cohort;
}

/** 걸어다니는 앰비언트 NPC 무리 — 랜덤 외형·배회·가끔 혼잣말 */
export class NpcCrowd {
  private npcs: Npc[] = [];
  private rnd: () => number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly grid: CollisionGrid,
    private readonly onBubble: (sprite: Phaser.GameObjects.Sprite, text: string) => void,
    count = 70,
    seed = 20260721,
  ) {
    this.rnd = seeded(seed);
    for (let i = 0; i < count; i++) this.spawn(i);
  }

  /** 실제 홍대처럼 광장·메인 스트리트에 인파가 몰리게 스폰 가중치 */
  private denseZone(): { x: number; y: number; w: number; h: number } | null {
    const r = this.rnd();
    if (r < 0.4) return { x: 28, y: 37, w: 24, h: 18 };  // 역 광장
    if (r < 0.7) return { x: 1, y: 28, w: 78, h: 8 };    // 메인 스트리트
    if (r < 0.82) return { x: 1, y: 1, w: 78, h: 8 };    // 숲길
    return null; // 나머지는 마을 전체
  }

  private randomWalkableTile(nearTx?: number, nearTy?: number, radius = 10): { tx: number; ty: number } | null {
    const zone = nearTx === undefined ? this.denseZone() : null;
    for (let tries = 0; tries < 40; tries++) {
      const tx = nearTx !== undefined
        ? Math.max(1, Math.min(this.grid.width - 2, nearTx + Math.floor((this.rnd() - 0.5) * radius * 2)))
        : zone
          ? zone.x + Math.floor(this.rnd() * zone.w)
          : 1 + Math.floor(this.rnd() * (this.grid.width - 2));
      const ty = nearTy !== undefined
        ? Math.max(1, Math.min(this.grid.height - 2, nearTy + Math.floor((this.rnd() - 0.5) * radius * 2)))
        : zone
          ? zone.y + Math.floor(this.rnd() * zone.h)
          : 1 + Math.floor(this.rnd() * (this.grid.height - 2));
      if (!this.grid.isSolid(tx, ty)) return { tx, ty };
    }
    return null;
  }

  private spawn(i: number): void {
    const tile = this.randomWalkableTile();
    if (!tile) return;
    const appearance = randomAppearance(this.rnd);
    const charKey = ensureCharacter(this.scene, appearance);
    const w = tileToWorld(tile.tx, tile.ty);
    const sprite = this.scene.add.sprite(w.x + TILE / 2, w.y + TILE / 2, charKey, 0)
      .setOrigin(0.5, 0.66).setDepth(9); // 플레이어(10)보다 살짝 아래
    this.npcs.push({
      sprite, charKey, target: null,
      waitUntil: this.scene.time.now + this.rnd() * 3000,
      facing: 0,
      speed: 0.45 + this.rnd() * 0.35, // 사람마다 걸음 속도 다르게 (플레이어 대비 배율)
      cohort: cohortForIndex(i), // 세대 배정 (말투 다양화)
    });
  }

  update(delta: number): void {
    const now = this.scene.time.now;
    for (const n of this.npcs) {
      if (!n.target) {
        if (now < n.waitUntil) continue;
        const cur = worldToTile(n.sprite.x, n.sprite.y);
        const t = this.randomWalkableTile(cur.tx, cur.ty);
        if (!t) { n.waitUntil = now + 2000; continue; }
        const w = tileToWorld(t.tx, t.ty);
        n.target = { x: w.x + TILE / 2, y: w.y + TILE / 2 };
        // 출발하며 가끔 혼잣말 (세대·시간대 반영) + 아기자기한 제자리 폴짝
        if (this.rnd() < 0.22) {
          const slot = slotForHour(seoulHour());
          this.onBubble(n.sprite, pickLine(n.cohort, slot, this.rnd));
          const baseY = n.sprite.y;
          this.scene.tweens.add({
            targets: n.sprite, y: baseY - 5, duration: 150, yoyo: true,
            ease: 'Quad.easeOut', onComplete: () => n.sprite.setY(baseY),
          });
        }
      }

      const dx = n.target.x - n.sprite.x;
      const dy = n.target.y - n.sprite.y;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        n.target = null;
        n.waitUntil = now + 800 + this.rnd() * 4200;
        n.sprite.stop();
        n.sprite.setFrame(n.facing * FRAMES_PER_DIR);
        continue;
      }

      const input: MoveInput = {
        left: dx < -3, right: dx > 3, up: dy < -3, down: dy > 3,
      };
      if (input.down) n.facing = 0;
      else if (input.right) n.facing = 1;
      else if (input.left) n.facing = 2;
      else if (input.up) n.facing = 3;

      const next = stepPlayer(
        { x: n.sprite.x, y: n.sprite.y }, input, delta * n.speed, this.grid, { hw: 8, hh: 11 },
      );
      // 막혀서 못 움직이면 목적지 포기
      if (Math.abs(next.x - n.sprite.x) < 0.01 && Math.abs(next.y - n.sprite.y) < 0.01) {
        n.target = null;
        n.waitUntil = now + 1500;
        continue;
      }
      n.sprite.setPosition(next.x, next.y);
      const ak = `${n.charKey}-walk-${n.facing}`;
      if (n.sprite.anims.currentAnim?.key !== ak || !n.sprite.anims.isPlaying) n.sprite.play(ak);
    }
  }

  destroy(): void {
    for (const n of this.npcs) n.sprite.destroy();
    this.npcs = [];
  }
}
