import Phaser from 'phaser';
import { ensurePet } from '../art/petArt';
import { petTarget } from './petFollowMath';
import { TEXT_RES, UI_FONT } from '../config';
import type { PetAccessoryId } from './petProfiles';

/**
 * 플레이어를 졸졸 따라다니는 펫. 위치 이력 버퍼를 두어 몇 프레임 뒤처져 따라오고,
 * 이동 방향으로 좌우 반전, 멈추면 살짝 바운스한다. 동물의 숲 감성.
 * 친밀도 단짝(단계 2+)이면 머리 위에 하트가 둥실. 클릭하면 쓰다듬기.
 */
export class PetFollower {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private heart: Phaser.GameObjects.Text | null = null;
  private nameLabel: Phaser.GameObjects.Text | null = null;
  private trail: Array<{ x: number; y: number }> = [];
  private readonly lag = 16;
  private t = 0;
  private placed = false;
  private homeTarget: { x: number; y: number; until: number } | null = null;
  private homeBubble: Phaser.GameObjects.Text | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    initial: string | null,
    accessory: PetAccessoryId = 'none',
    nickname: string | null = null,
  ) {
    this.setSpecies(initial, accessory, nickname);
  }

  /** 동행 펫 교체 (null이면 숨김) */
  setSpecies(id: string | null, accessory: PetAccessoryId = 'none', nickname: string | null = null): void {
    if (id === null) { this.destroy(); return; }
    const key = ensurePet(this.scene, id, accessory);
    if (!key) { this.destroy(); return; }
    if (!this.sprite) {
      this.sprite = this.scene.add.sprite(0, 0, key).setOrigin(0.5, 0.9).setDepth(9).setScale(1.15);
    } else {
      this.sprite.setTexture(key);
    }
    this.trail = [];
    this.placed = false; // 다음 update에서 플레이어 옆으로 스냅
    this.setNickname(nickname);
  }

  private setNickname(nickname: string | null): void {
    if (!nickname) { this.nameLabel?.destroy(); this.nameLabel = null; return; }
    if (!this.nameLabel) {
      this.nameLabel = this.scene.add.text(0, 0, nickname, {
        fontFamily: UI_FONT, fontSize: '7px', color: '#fff4dc', backgroundColor: '#5a4030cc',
        padding: { x: 3, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 1).setDepth(11);
    } else this.nameLabel.setText(nickname);
  }

  /** 성장 단계에 따라 머리 위 하트 표시 (단짝 2 / 영혼의단짝 3) */
  setStage(stage: number): void {
    if (!this.sprite || stage < 2) { this.heart?.destroy(); this.heart = null; return; }
    const glyph = stage >= 3 ? '💛' : '❤️';
    if (!this.heart) {
      this.heart = this.scene.add.text(this.sprite.x, this.sprite.y - (this.nameLabel ? 28 : 20), glyph, { fontSize: '11px' })
        .setOrigin(0.5).setDepth(11);
    } else {
      this.heart.setText(glyph);
    }
  }

  /** 클릭 판정 (월드 좌표) */
  contains(wx: number, wy: number): boolean {
    return !!this.sprite && this.sprite.getBounds().contains(wx, wy);
  }

  /** 쓰다듬기 연출 — 하트가 뿅 떠오른다 */
  petFx(): void {
    if (!this.sprite) return;
    const h = this.scene.add.text(this.sprite.x, this.sprite.y - 12, '❤️', { fontSize: '13px' })
      .setOrigin(0.5).setDepth(21);
    this.scene.tweens.add({
      targets: h, y: h.y - 18, alpha: 0, scale: 1.4, duration: 700, ease: 'Sine.easeOut',
      onComplete: () => h.destroy(),
    });
  }

  /** 선물 연출 — 펫이 폴짝 뛰고 선물 아이콘이 플레이어(위)로 떠오른다 */
  giftFx(emoji: string): void {
    if (!this.sprite) return;
    const s = this.sprite;
    // 신난 폴짝
    this.scene.tweens.add({ targets: s, y: s.y - 6, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    const g = this.scene.add.text(s.x, s.y - 14, emoji, { fontSize: '15px' }).setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: g, y: g.y - 26, scale: 1.3, duration: 620, ease: 'Back.easeOut',
      onComplete: () => this.scene.tweens.add({
        targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy(),
      }),
    });
  }

  /** 배운 트릭의 짧은 픽셀 연출. 이동 로직을 방해하지 않도록 위치 변화는 작고 즉시 복원한다. */
  trickFx(trickId: string): void {
    if (!this.sprite) return;
    const s = this.sprite;
    const glyph: Record<string, string> = {
      play: '🧶', hello: '👋', paw: '🐾', spin: '🌀', dance: '🎵', pose: '✨',
    };
    if (trickId === 'spin') {
      this.scene.tweens.add({
        targets: s, angle: s.flipX ? -360 : 360, duration: 620, ease: 'Cubic.easeInOut',
        onComplete: () => s.setAngle(0),
      });
    } else if (trickId === 'dance') {
      this.scene.tweens.add({
        targets: s, angle: { from: -12, to: 12 }, scaleX: 1.35, scaleY: 1.05,
        duration: 130, yoyo: true, repeat: 3,
        onComplete: () => { s.setAngle(0); s.setScale(1.15); },
      });
    } else if (trickId === 'pose') {
      this.scene.tweens.add({
        targets: s, scale: 1.55, duration: 220, yoyo: true, hold: 260,
        onComplete: () => s.setScale(1.15),
      });
    } else {
      this.scene.tweens.add({ targets: s, y: s.y - 7, duration: 150, yoyo: true, repeat: trickId === 'play' ? 2 : 0 });
    }
    const fx = this.scene.add.text(s.x, s.y - 15, glyph[trickId] ?? '💛', { fontSize: '15px' })
      .setOrigin(0.5).setDepth(22);
    this.scene.tweens.add({
      targets: fx, y: fx.y - 24, alpha: 0, scale: 1.35, duration: 850, ease: 'Back.easeOut',
      onComplete: () => fx.destroy(),
    });
  }

  /** 집에서 좋아하는 가구 곁으로 이동해 성격별 생활 장면을 보여 준다. */
  settleAt(x: number, y: number, mark: string, phrase: string, duration = 5200): void {
    if (!this.sprite) return;
    this.homeTarget = { x, y, until: this.scene.time.now + duration };
    this.homeBubble?.destroy();
    this.homeBubble = this.scene.add.text(this.sprite.x, this.sprite.y - 25, `${mark} · ${phrase}`, {
      fontFamily: UI_FONT, fontSize: '8px', color: '#4a3d31', backgroundColor: '#fff3d9ee',
      wordWrap: { width: 164 }, align: 'center', padding: { x: 6, y: 4 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(24).setAlpha(0);
    this.scene.tweens.add({ targets: this.homeBubble, alpha: 1, duration: 220, ease: 'Cubic.easeOut' });
  }

  worldY(): number | null { return this.sprite?.y ?? null; }

  update(px: number, py: number, delta: number): void {
    if (!this.sprite) return;
    this.t += delta;
    if (this.homeTarget && this.scene.time.now < this.homeTarget.until) {
      const nx = Phaser.Math.Linear(this.sprite.x, this.homeTarget.x, 0.12);
      const ny = Phaser.Math.Linear(this.sprite.y, this.homeTarget.y, 0.12);
      const bob = Math.abs(Math.sin(this.t * 0.004)) * 1.5;
      this.sprite.setPosition(nx, ny - bob);
      this.nameLabel?.setPosition(nx, ny - 18 - bob);
      this.heart?.setPosition(nx, ny - (this.nameLabel ? 28 : 20) - bob);
      this.homeBubble?.setPosition(nx, ny - (this.nameLabel ? 34 : 25) - bob);
      return;
    }
    if (this.homeTarget) {
      this.homeTarget = null;
      this.scene.tweens.add({ targets: this.homeBubble, alpha: 0, duration: 180, onComplete: () => { this.homeBubble?.destroy(); this.homeBubble = null; } });
      this.trail = [];
    }
    this.trail.push({ x: px, y: py });
    if (this.trail.length > this.lag + 1) this.trail.shift();
    // 지연 버퍼가 차면 뒤처져 따라오고, 정지 상태(겹침)면 옆자리로
    const target = petTarget(px, py, this.trail.length > this.lag ? this.trail[0]! : null);
    // 첫 프레임(소환 직후)은 이동 없이 바로 옆에 놓는다 — 맵 가로지르기 방지
    if (!this.placed) {
      this.placed = true;
      this.sprite.setPosition(target.x, target.y);
      if (this.heart) this.heart.setPosition(target.x, target.y - (this.nameLabel ? 28 : 20));
      if (this.nameLabel) this.nameLabel.setPosition(target.x, target.y - 18);
      return;
    }

    const prevX = this.sprite.x;
    const nx = Phaser.Math.Linear(this.sprite.x, target.x, 0.2);
    const ny = Phaser.Math.Linear(this.sprite.y, target.y, 0.2);
    const moving = Math.abs(target.x - this.sprite.x) + Math.abs(target.y - this.sprite.y) > 0.6;
    const bob = moving ? 0 : Math.abs(Math.sin(this.t * 0.005)) * 2;
    this.sprite.setPosition(nx, ny - bob);
    // 텍스처는 기본 우향 — 왼쪽으로 갈 때만 반전
    if (nx - prevX > 0.3) this.sprite.setFlipX(false);
    else if (nx - prevX < -0.3) this.sprite.setFlipX(true);
    if (this.heart) this.heart.setPosition(nx, ny - (this.nameLabel ? 28 : 20) - bob - Math.sin(this.t * 0.004) * 2);
    if (this.nameLabel) this.nameLabel.setPosition(nx, ny - 18 - bob);
  }

  /** 아이소메트릭처럼 화면 투영 좌표와 depth를 외부에서 관리할 때 사용한다. */
  setDepth(depth: number): void {
    this.sprite?.setDepth(depth);
    this.heart?.setDepth(depth + 2);
    this.nameLabel?.setDepth(depth + 2);
  }

  destroy(): void {
    this.sprite?.destroy(); this.sprite = null;
    this.heart?.destroy(); this.heart = null;
    this.nameLabel?.destroy(); this.nameLabel = null;
    this.homeBubble?.destroy(); this.homeBubble = null;
    this.homeTarget = null;
  }
}
