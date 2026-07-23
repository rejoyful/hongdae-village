import Phaser from 'phaser';
import {
  NEIGHBORHOOD_ATMOSPHERE_BY_ID,
  type NeighborhoodAtmosphereDef,
  type NeighborhoodAtmosphereId,
} from '../world/neighborhoodAtmospheres';

interface AtmosphereParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}

const color = (value: string): number => Number.parseInt(value.replace('#', ''), 16);

const tintByEffect = {
  sun: { color: 0xf6d49a, alpha: 0.055 },
  cloud: { color: 0x4a5964, alpha: 0.14 },
  rain: { color: 0x304b5b, alpha: 0.18 },
  'neon-rain': { color: 0x392f59, alpha: 0.2 },
  golden: { color: 0xd9894f, alpha: 0.13 },
  moon: { color: 0x263653, alpha: 0.23 },
  snow: { color: 0xaebbc8, alpha: 0.12 },
  petal: { color: 0xc88992, alpha: 0.08 },
} as const;

/**
 * DOM UI와 충돌하지 않는 카메라 고정 픽셀 날씨층.
 * 논리 좌표·충돌·전투 수치는 건드리지 않고 색, 빛, 입자만 바꾼다.
 */
export class NeighborhoodAtmosphereFx {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private atmosphere: NeighborhoodAtmosphereDef;
  private elapsed = 0;
  private replayPulse = 0;
  private readonly particles: AtmosphereParticle[];

  constructor(private readonly scene: Phaser.Scene, initialId: NeighborhoodAtmosphereId) {
    this.atmosphere = NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(initialId)
      ?? [...NEIGHBORHOOD_ATMOSPHERE_BY_ID.values()][0]!;
    this.graphics = scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(2_000_000);
    this.particles = Array.from({ length: 72 }, (_, index) => ({
      x: ((index * 83 + 19) % 997) / 997,
      y: ((index * 47 + 11) % 991) / 991,
      speed: 0.7 + (index % 7) * 0.13,
      size: 1 + (index % 4),
      phase: (index * 1.618) % (Math.PI * 2),
    }));
    this.draw(false);
  }

  get activeId(): NeighborhoodAtmosphereId { return this.atmosphere.id; }

  set(id: NeighborhoodAtmosphereId): void {
    const next = NEIGHBORHOOD_ATMOSPHERE_BY_ID.get(id);
    if (!next) return;
    this.atmosphere = next;
    this.elapsed = 0;
    this.replayPulse = 1;
    this.draw(false);
  }

  replay(): void {
    this.elapsed = 0;
    this.replayPulse = 1;
    this.draw(false);
  }

  update(delta: number, reducedMotion: boolean, density = 1): void {
    if (!reducedMotion) this.elapsed += Math.min(64, Math.max(0, delta));
    this.replayPulse = Math.max(0, this.replayPulse - delta / 900);
    this.draw(reducedMotion, Math.max(0.25, Math.min(1, density)));
  }

  private draw(reducedMotion: boolean, density = 1): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const time = reducedMotion ? 0 : this.elapsed / 1000;
    const effect = this.atmosphere.effect;
    const tint = tintByEffect[effect];
    const g = this.graphics;
    g.clear();
    g.fillStyle(tint.color, tint.alpha).fillRect(0, 0, width, height);

    if (effect === 'sun' || effect === 'golden') this.drawLight(g, width, height, time, effect === 'golden');
    if (effect === 'cloud') this.drawClouds(g, width, height, time);
    if (effect === 'rain' || effect === 'neon-rain') {
      this.drawRain(g, width, height, time, density, effect === 'neon-rain');
    }
    if (effect === 'moon') this.drawHaze(g, width, height, time);
    if (effect === 'snow') this.drawSnow(g, width, height, time, density);
    if (effect === 'petal') this.drawPetals(g, width, height, time, density);

    if (this.replayPulse > 0) {
      g.lineStyle(3, color(this.atmosphere.palette[3]), this.replayPulse * 0.6);
      const margin = 10 + (1 - this.replayPulse) * 24;
      g.strokeRect(margin, margin, Math.max(0, width - margin * 2), Math.max(0, height - margin * 2));
    }
  }

  private drawLight(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    time: number,
    golden: boolean,
  ): void {
    const pulse = 0.85 + Math.sin(time * 0.45) * 0.08;
    const light = color(this.atmosphere.palette[3]);
    g.fillStyle(light, (golden ? 0.055 : 0.035) * pulse);
    g.fillTriangle(0, 0, width * 0.58, 0, width * 0.9, height);
    g.fillTriangle(width * 0.16, 0, width * 0.42, 0, width * 0.7, height);
    const count = golden ? 30 : 18;
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index]!;
      const x = particle.x * width + Math.sin(time * 0.4 + particle.phase) * 9;
      const y = particle.y * height;
      g.fillStyle(light, 0.2 + (index % 3) * 0.08).fillRect(x, y, particle.size, particle.size);
    }
  }

  private drawClouds(g: Phaser.GameObjects.Graphics, width: number, height: number, time: number): void {
    const cloud = color(this.atmosphere.palette[2]);
    for (let index = 0; index < 5; index += 1) {
      const particle = this.particles[index]!;
      const cloudWidth = 110 + index * 24;
      const x = ((particle.x * (width + cloudWidth) + time * (8 + index)) % (width + cloudWidth)) - cloudWidth;
      const y = 24 + particle.y * Math.min(190, height * 0.32);
      g.fillStyle(cloud, 0.11);
      g.fillRoundedRect(x, y, cloudWidth, 17, 5);
      g.fillRoundedRect(x + 20, y - 9, cloudWidth * 0.62, 14, 6);
    }
  }

  private drawRain(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    time: number,
    density: number,
    neon: boolean,
  ): void {
    const count = Math.round(62 * density);
    const colors = neon
      ? [0xe28ab9, 0x8ea6e2, 0xf0b96f]
      : [0xc7d7d5, 0x8faeb8, 0x708d9b];
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index]!;
      const travel = (particle.y * (height + 70) + time * 190 * particle.speed) % (height + 70);
      const x = particle.x * (width + 70) - 35 + Math.sin(particle.phase) * 18;
      const y = travel - 35;
      g.lineStyle(neon ? 2 : 1, colors[index % colors.length]!, neon ? 0.48 : 0.38);
      g.lineBetween(x, y, x - 6, y + 17 + particle.size * 2);
    }
    if (neon) {
      g.fillStyle(0xc05c8b, 0.035).fillRect(0, height * 0.7, width, height * 0.3);
      g.fillStyle(0x766fc4, 0.03).fillRect(width * 0.45, 0, width * 0.55, height);
    }
  }

  private drawHaze(g: Phaser.GameObjects.Graphics, width: number, height: number, time: number): void {
    const haze = color(this.atmosphere.palette[2]);
    for (let index = 0; index < 6; index += 1) {
      const bandHeight = 20 + index * 5;
      const x = Math.sin(time * 0.12 + index * 1.8) * 35 - 40;
      const y = height * (0.35 + index * 0.1);
      g.fillStyle(haze, 0.045 + (index % 2) * 0.02);
      g.fillRoundedRect(x, y, width + 80, bandHeight, 10);
    }
    const moon = color(this.atmosphere.palette[3]);
    g.fillStyle(moon, 0.17).fillCircle(width - 74, 62, 24);
    g.fillStyle(moon, 0.04).fillCircle(width - 74, 62, 48);
  }

  private drawSnow(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    time: number,
    density: number,
  ): void {
    const count = Math.round(58 * density);
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index]!;
      const x = particle.x * width + Math.sin(time * particle.speed + particle.phase) * 22;
      const y = (particle.y * (height + 30) + time * 34 * particle.speed) % (height + 30) - 15;
      g.fillStyle(index % 3 ? 0xf4ead8 : 0xcbd6df, 0.72);
      g.fillRect(x, y, particle.size + 1, particle.size + 1);
    }
  }

  private drawPetals(
    g: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    time: number,
    density: number,
  ): void {
    const count = Math.round(52 * density);
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[index]!;
      const x = (particle.x * (width + 80) + time * 34 * particle.speed) % (width + 80) - 40;
      const y = (particle.y * (height + 50) + time * 21 * particle.speed) % (height + 50) - 25;
      const pink = index % 3 ? 0xefb5b8 : 0xf4d0ba;
      g.fillStyle(pink, 0.76);
      g.fillRect(x, y, 5 + (index % 2), 2);
      g.fillRect(x + 2, y - 1, 2, 4);
    }
  }

  destroy(): void { this.graphics.destroy(); }
}
