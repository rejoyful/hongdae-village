import type Phaser from 'phaser';
import { TILE } from '../config';
import { tileToWorld } from '../world/grid';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import {
  RESIDENTS, applyGreeting, loadTrust, saveTrust, todaySeoul, type TrustState,
} from '../residents/residents';

interface ResidentNpc {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  lastBubbleAt: number;
  mentIdx: number;
}

/**
 * 이름 있는 주민 NPC — 담당 구역에 상주하며 가끔 제자리 폴짝.
 * 플레이어가 1.5타일 안으로 오면 인사(말풍선+하트)하고 신뢰도를 올린다.
 */
export class ResidentNpcs {
  private npcs: ResidentNpc[] = [];
  private trust: TrustState;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly userId: string,
    private readonly cbs: {
      onBubble: (sprite: Phaser.GameObjects.Sprite, text: string) => void;
      onGreet: (sprite: Phaser.GameObjects.Sprite) => void;
    },
  ) {
    this.trust = loadTrust(userId);
    for (const def of RESIDENTS) {
      const w = tileToWorld(def.tile.tx, def.tile.ty);
      const key = ensureCharacter(scene, def.appearance);
      const sprite = scene.add.sprite(w.x + TILE / 2, w.y + TILE / 2, key, 0)
        .setOrigin(0.5, 0.66).setDepth(9);
      const label = scene.add.text(sprite.x, sprite.y - 26, def.name, {
        fontSize: '8px', color: '#ffe9b8', backgroundColor: '#3a2a18', padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(11);
      // 각자 리듬이 다른 제자리 폴짝 (아기자기 대기 모션)
      scene.tweens.add({
        targets: sprite, y: sprite.y - 3,
        duration: 1200 + (def.id.length * 137) % 900,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: (def.id.length * 271) % 1500,
      });
      // 쿨다운 기준값을 과거로 — 씬 시작 직후에도 첫 인사가 가능해야 한다
      this.npcs.push({ id: def.id, sprite, label, lastBubbleAt: -6000, mentIdx: 0 });
    }
  }

  getTrust(): TrustState { return this.trust; }

  /** 매 프레임: 근접 인사 체크 */
  update(playerX: number, playerY: number): void {
    const now = this.scene.time.now;
    const near = TILE * 1.6;
    for (const n of this.npcs) {
      const dist = Math.abs(n.sprite.x - playerX) + Math.abs(n.sprite.y - playerY);
      if (dist > near || now - n.lastBubbleAt < 6000) continue;
      n.lastBubbleAt = now;
      const def = RESIDENTS.find((r) => r.id === n.id)!;
      // 플레이어 쪽을 바라본다
      const dx = playerX - n.sprite.x, dy = playerY - n.sprite.y;
      const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 2) : (dy > 0 ? 0 : 3);
      n.sprite.setFrame(facing * FRAMES_PER_DIR);
      this.cbs.onBubble(n.sprite, def.ments[n.mentIdx % def.ments.length]!);
      n.mentIdx++;
      const res = applyGreeting(this.trust, n.id, todaySeoul());
      if (res.gained) {
        this.trust = res.state;
        saveTrust(this.userId, this.trust);
        this.cbs.onGreet(n.sprite);
      }
    }
  }

  destroy(): void {
    for (const n of this.npcs) { n.sprite.destroy(); n.label.destroy(); }
    this.npcs = [];
  }
}
