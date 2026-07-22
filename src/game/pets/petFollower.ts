import Phaser from 'phaser';
import { ensurePet } from '../art/petArt';

/**
 * 플레이어를 졸졸 따라다니는 펫. 위치 이력 버퍼를 두어 몇 프레임 뒤처져 따라오고,
 * 이동 방향으로 좌우 반전, 멈추면 살짝 바운스한다. 동물의 숲 감성.
 * 친밀도 단짝(단계 2+)이면 머리 위에 하트가 둥실. 클릭하면 쓰다듬기.
 */
export class PetFollower {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private heart: Phaser.GameObjects.Text | null = null;
  private trail: Array<{ x: number; y: number }> = [];
  private readonly lag = 16;
  private t = 0;

  constructor(private readonly scene: Phaser.Scene, initial: string | null) {
    this.setSpecies(initial);
  }

  /** 동행 펫 교체 (null이면 숨김) */
  setSpecies(id: string | null): void {
    if (id === null) { this.destroy(); return; }
    const key = ensurePet(this.scene, id);
    if (!key) { this.destroy(); return; }
    if (!this.sprite) {
      this.sprite = this.scene.add.sprite(0, 0, key).setOrigin(0.5, 0.9).setDepth(9).setScale(1.15);
    } else {
      this.sprite.setTexture(key);
    }
    this.trail = [];
  }

  /** 성장 단계에 따라 머리 위 하트 표시 (단짝 2 / 영혼의단짝 3) */
  setStage(stage: number): void {
    if (!this.sprite || stage < 2) { this.heart?.destroy(); this.heart = null; return; }
    const glyph = stage >= 3 ? '💛' : '❤️';
    if (!this.heart) {
      this.heart = this.scene.add.text(this.sprite.x, this.sprite.y - 16, glyph, { fontSize: '11px' })
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

  update(px: number, py: number, delta: number): void {
    if (!this.sprite) return;
    this.t += delta;
    this.trail.push({ x: px, y: py });
    if (this.trail.length > this.lag + 1) this.trail.shift();
    const target = this.trail.length > this.lag ? this.trail[0]! : { x: px, y: py + 6 };

    const prevX = this.sprite.x;
    const nx = Phaser.Math.Linear(this.sprite.x, target.x, 0.2);
    const ny = Phaser.Math.Linear(this.sprite.y, target.y, 0.2);
    const moving = Math.abs(target.x - this.sprite.x) + Math.abs(target.y - this.sprite.y) > 0.6;
    const bob = moving ? 0 : Math.abs(Math.sin(this.t * 0.005)) * 2;
    this.sprite.setPosition(nx, ny - bob);
    // 텍스처는 기본 우향 — 왼쪽으로 갈 때만 반전
    if (nx - prevX > 0.3) this.sprite.setFlipX(false);
    else if (nx - prevX < -0.3) this.sprite.setFlipX(true);
    if (this.heart) this.heart.setPosition(nx, ny - 20 - bob - Math.sin(this.t * 0.004) * 2);
  }

  destroy(): void {
    this.sprite?.destroy(); this.sprite = null;
    this.heart?.destroy(); this.heart = null;
  }
}
