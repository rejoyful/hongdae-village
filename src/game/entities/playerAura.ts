import Phaser from 'phaser';
import { swagTier } from '../battle/swag';

interface TierCfg { color: number; scale: number; alpha: number; particles: boolean; freq: number }
const TIERS: (TierCfg | null)[] = [
  null,
  { color: 0xfff2c8, scale: 0.62, alpha: 0.35, particles: false, freq: 0 },   // Lv5+  은은한 빛
  { color: 0x8ee08a, scale: 0.78, alpha: 0.46, particles: true, freq: 260 },  // Lv10+ 초록 기운
  { color: 0x7ab0f0, scale: 0.95, alpha: 0.52, particles: true, freq: 190 },  // Lv20+ 푸른 오라
  { color: 0xc07ce0, scale: 1.10, alpha: 0.58, particles: true, freq: 130 },  // Lv35+ 보랏빛 카리스마
  { color: 0xf2c84c, scale: 1.32, alpha: 0.68, particles: true, freq: 80 },   // Lv50+ 황금빛 전설
];

/** 레벨이 오를수록 발밑에 오라 + 상승 반짝임으로 간지가 난다 */
export class PlayerAura {
  private aura: Phaser.GameObjects.Image;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private pulse?: Phaser.Tweens.Tween;
  private tier = -1;

  constructor(private readonly scene: Phaser.Scene, depth = 8) {
    PlayerAura.bakeTextures(scene);
    this.aura = scene.add.image(0, 0, 'aura-glow')
      .setDepth(depth).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.emitter = scene.add.particles(0, 0, 'aura-star', {
      lifespan: 850, speedY: { min: -32, max: -14 }, speedX: { min: -9, max: 9 },
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 },
      frequency: 200, quantity: 1, blendMode: 'ADD',
    }).setDepth(depth + 3);
    this.emitter.stop();
  }

  private static bakeTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('aura-glow')) {
      const c = scene.textures.createCanvas('aura-glow', 64, 64);
      if (c) {
        const ctx = c.getContext();
        const g = ctx.createRadialGradient(32, 32, 3, 32, 32, 30);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); c.refresh();
      }
    }
    if (!scene.textures.exists('aura-star')) {
      const c = scene.textures.createCanvas('aura-star', 6, 6);
      if (c) {
        const ctx = c.getContext();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 0, 2, 6); ctx.fillRect(0, 2, 6, 2);
        c.refresh();
      }
    }
  }

  setLevel(level: number): void {
    const t = swagTier(level);
    if (t === this.tier) return;
    this.tier = t;
    const cfg = TIERS[t];
    this.pulse?.stop();
    if (!cfg) { this.aura.setVisible(false); this.emitter.stop(); return; }
    this.aura.setVisible(true).setTint(cfg.color).setScale(cfg.scale).setAlpha(cfg.alpha);
    this.pulse = this.scene.tweens.add({
      targets: this.aura, scaleX: cfg.scale * 1.14, scaleY: cfg.scale * 1.14,
      alpha: cfg.alpha * 0.7, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    if (cfg.particles) {
      this.emitter.setParticleTint(cfg.color);
      this.emitter.setFrequency(cfg.freq);
      this.emitter.start();
    } else this.emitter.stop();
  }

  follow(x: number, y: number): void {
    this.aura.setPosition(x, y + 9);
    this.emitter.setPosition(x, y + 4);
  }

  destroy(): void { this.pulse?.stop(); this.aura.destroy(); this.emitter.destroy(); }
}
