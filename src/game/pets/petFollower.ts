import Phaser from 'phaser';
import { ensurePet } from '../art/petArt';

/**
 * 플레이어를 졸졸 따라다니는 펫. 위치 이력 버퍼를 두어 몇 프레임 뒤처져 따라오고,
 * 이동 방향으로 좌우 반전, 멈추면 살짝 바운스한다. 동물의 숲 감성.
 */
export class PetFollower {
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private trail: Array<{ x: number; y: number }> = [];
  private readonly lag = 16; // 프레임 지연 (졸졸 따라오는 거리감)
  private t = 0;

  constructor(private readonly scene: Phaser.Scene, initial: string | null) {
    this.setSpecies(initial);
  }

  /** 동행 펫 교체 (null이면 숨김) */
  setSpecies(id: string | null): void {
    if (id === null) { this.sprite?.destroy(); this.sprite = null; return; }
    const key = ensurePet(this.scene, id);
    if (!key) { this.sprite?.destroy(); this.sprite = null; return; }
    if (!this.sprite) {
      this.sprite = this.scene.add.sprite(0, 0, key).setOrigin(0.5, 0.9).setDepth(9).setScale(1.15);
    } else {
      this.sprite.setTexture(key);
    }
    this.trail = [];
  }

  update(px: number, py: number, delta: number): void {
    if (!this.sprite) return;
    this.t += delta;
    this.trail.push({ x: px, y: py });
    if (this.trail.length > this.lag + 1) this.trail.shift();
    // 버퍼가 덜 찼으면(방금 소환) 발밑에 붙어 있는다
    const target = this.trail.length > this.lag ? this.trail[0]! : { x: px, y: py + 6 };

    const prevX = this.sprite.x;
    const nx = Phaser.Math.Linear(this.sprite.x, target.x, 0.2);
    const ny = Phaser.Math.Linear(this.sprite.y, target.y, 0.2);
    const moving = Math.abs(target.x - this.sprite.x) + Math.abs(target.y - this.sprite.y) > 0.6;
    // 멈췄을 때만 통통 바운스
    const bob = moving ? 0 : Math.abs(Math.sin(this.t * 0.005)) * 2;
    this.sprite.setPosition(nx, ny - bob);
    // 텍스처는 기본 우향 — 왼쪽으로 갈 때만 반전
    if (nx - prevX > 0.3) this.sprite.setFlipX(false);
    else if (nx - prevX < -0.3) this.sprite.setFlipX(true);
  }

  destroy(): void { this.sprite?.destroy(); this.sprite = null; }
}
