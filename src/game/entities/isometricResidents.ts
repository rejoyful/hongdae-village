import type Phaser from 'phaser';
import { TILE, TEXT_RES, UI_FONT } from '../config';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { isoDepth, projectIso, projectIsoWorld } from '../world/isometric';
import { ISO_RESIDENT_PLACEMENTS } from '../world/isometricVillageMap';
import {
  RESIDENTS,
  applyGreeting,
  loadTrust,
  saveTrust,
  todaySeoul,
  trustOf,
  type ResidentDef,
  type TrustState,
} from '../residents/residents';
import { latestResidentStory } from '../residents/residentStories';

interface IsoResidentNpc {
  def: ResidentDef;
  tx: number;
  ty: number;
  worldX: number;
  worldY: number;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  lastBubbleAt: number;
  lineIndex: number;
}

/**
 * 아이소메트릭 이름 주민 — 자동 근접 인사와 직접 클릭 대화를 함께 지원한다.
 * 신뢰도 SSOT는 기존 주민 시스템을 공유해 직교/아이소메트릭 월드 전환에도 기록이 이어진다.
 */
export class IsometricResidentNpcs {
  private readonly npcs: IsoResidentNpc[] = [];
  private readonly ambientTweens: Phaser.Tweens.Tween[] = [];
  private trust: TrustState;
  private playerWorld = { x: 0, y: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly userId: string,
    private readonly callbacks: {
      onBubble: (sprite: Phaser.GameObjects.Sprite, text: string) => void;
      onGreet: (sprite: Phaser.GameObjects.Sprite, resident: ResidentDef, trust: number) => void;
      onDirectTalk?: (resident: ResidentDef) => void;
    },
  ) {
    this.trust = loadTrust(userId);
    const residentsById = new Map(RESIDENTS.map((resident) => [resident.id, resident]));
    for (const placement of ISO_RESIDENT_PLACEMENTS) {
      const def = residentsById.get(placement.residentId);
      if (!def) continue;
      const worldX = (placement.tx + 0.5) * TILE;
      const worldY = (placement.ty + 0.5) * TILE;
      const p = projectIso(placement.tx + 0.5, placement.ty + 0.5);
      const depth = isoDepth({ tx: placement.tx, ty: placement.ty, w: 1, h: 1 }, 410);
      const key = ensureCharacter(scene, def.appearance);
      const sprite = scene.add.sprite(p.x, p.y, key, 0)
        .setOrigin(0.5, 0.78).setDepth(depth).setInteractive({ useHandCursor: true });
      const label = scene.add.text(p.x, p.y - 43, `♥ ${def.name}`, {
        fontFamily: UI_FONT,
        fontSize: '8px',
        color: '#fff4dc',
        backgroundColor: '#6f4927e8',
        align: 'center',
        padding: { x: 4, y: 2 },
        resolution: TEXT_RES,
      }).setOrigin(0.5, 1).setDepth(depth + 2);
      const npc: IsoResidentNpc = {
        def, tx: placement.tx, ty: placement.ty, worldX, worldY,
        sprite, label, lastBubbleAt: -6000, lineIndex: 0,
      };
      sprite.on('pointerdown', () => this.talk(npc, true));
      this.ambientTweens.push(scene.tweens.add({
        targets: [sprite, label], y: '-=3', duration: 1200 + (def.id.length * 137) % 900,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (def.id.length * 271) % 1500,
      }));
      this.npcs.push(npc);
    }
  }

  getTrust(): TrustState { return this.trust; }

  setAmbientMotion(amount: number): void {
    for (const tween of this.ambientTweens) {
      if (amount <= 0) tween.pause();
      else {
        tween.timeScale = amount;
        tween.resume();
      }
    }
  }

  update(playerWorldX: number, playerWorldY: number): void {
    this.playerWorld = { x: playerWorldX, y: playerWorldY };
    const near = TILE * 1.8;
    for (const npc of this.npcs) {
      const distance = Math.abs(npc.worldX - playerWorldX) + Math.abs(npc.worldY - playerWorldY);
      if (distance <= near) this.talk(npc, false);
    }
  }

  private talk(npc: IsoResidentNpc, direct: boolean): void {
    const now = this.scene.time.now;
    const cooldown = direct ? 900 : 6000;
    if (now - npc.lastBubbleAt < cooldown) return;
    npc.lastBubbleAt = now;
    this.facePlayer(npc);

    const currentTrust = trustOf(this.trust, npc.def.id);
    const latestStory = latestResidentStory(npc.def.id, currentTrust);
    const special = npc.lineIndex > 0 && npc.lineIndex % 4 === 0 && latestStory
      ? latestStory.dialogue
      : npc.lineIndex > 0 && npc.lineIndex % 5 === 0 && currentTrust >= 100
      ? `내 소중한 이야기는 「${npc.def.keepsake}」에 담겨 있어요.`
      : npc.lineIndex > 0 && npc.lineIndex % 3 === 0 && currentTrust >= 50
        ? `제가 좋아하는 건 「${npc.def.favorite}」예요.`
        : npc.def.ments[npc.lineIndex % npc.def.ments.length]!;
    npc.lineIndex++;
    this.callbacks.onBubble(npc.sprite, special);

    const greeting = applyGreeting(this.trust, npc.def.id, todaySeoul());
    if (greeting.gained) {
      this.trust = greeting.state;
      saveTrust(this.userId, this.trust);
      this.callbacks.onGreet(npc.sprite, npc.def, trustOf(this.trust, npc.def.id));
    }
    if (direct) this.callbacks.onDirectTalk?.(npc.def);
  }

  private facePlayer(npc: IsoResidentNpc): void {
    const p = projectIsoWorld(this.playerWorld.x, this.playerWorld.y);
    const dx = p.x - npc.sprite.x;
    const dy = p.y - npc.sprite.y;
    const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 2) : (dy > 0 ? 0 : 3);
    npc.sprite.setFrame(facing * FRAMES_PER_DIR);
  }

  destroy(): void {
    for (const tween of this.ambientTweens) tween.stop();
    this.ambientTweens.length = 0;
    for (const npc of this.npcs) {
      npc.sprite.removeAllListeners();
      npc.sprite.destroy();
      npc.label.destroy();
    }
    this.npcs.length = 0;
  }
}
