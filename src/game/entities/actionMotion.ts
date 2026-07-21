import type Phaser from 'phaser';
import { audio } from '../audio';

/**
 * 행동 연상 모션 — 활동마다 캐릭터가 "그 행동을 하는 것처럼" 보이게
 * 스프라이트 트윈 + 이모지 소품 오버레이 + 파티클을 조합한다.
 * busking/cafe/omok은 지속형(stop 호출까지), 나머지는 단발형.
 */
export type MotionKind = 'busking' | 'cafe' | 'omok' | 'win' | 'coin' | 'greet';

interface Active { cleanup: Array<() => void> }

export class ActionMotions {
  private active = new Map<Phaser.GameObjects.Sprite, Active>();

  constructor(private readonly scene: Phaser.Scene) {}

  play(sprite: Phaser.GameObjects.Sprite, kind: MotionKind): void {
    this.stop(sprite);
    const a: Active = { cleanup: [] };
    this.active.set(sprite, a);
    switch (kind) {
      case 'busking': this.busking(sprite, a); break;
      case 'cafe': this.cafe(sprite, a); break;
      case 'omok': this.omok(sprite, a); break;
      case 'win': this.win(sprite, a); break;
      case 'coin': this.coinBurst(sprite, a); break;
      case 'greet': this.greet(sprite, a); break;
    }
  }

  /** 지속형 모션 종료 + 소품 정리 (단발형은 스스로 정리) */
  stop(sprite: Phaser.GameObjects.Sprite): void {
    const a = this.active.get(sprite);
    if (!a) return;
    for (const fn of a.cleanup) fn();
    this.active.delete(sprite);
    sprite.setAngle(0).setScale(1);
  }

  destroy(): void {
    for (const s of [...this.active.keys()]) this.stop(s);
  }

  // ── 소품/파티클 헬퍼 ──

  private prop(sprite: Phaser.GameObjects.Sprite, a: Active, emoji: string,
    dx: number, dy: number, size = 14): Phaser.GameObjects.Text {
    const t = this.scene.add.text(sprite.x + dx, sprite.y + dy, emoji, { fontSize: `${size}px` })
      .setOrigin(0.5).setDepth(21);
    const follow = this.scene.time.addEvent({
      delay: 60, loop: true,
      callback: () => t.setPosition(sprite.x + dx, sprite.y + dy),
    });
    a.cleanup.push(() => { follow.remove(); t.destroy(); });
    return t;
  }

  private float(x: number, y: number, emoji: string, size = 12): void {
    const t = this.scene.add.text(x, y, emoji, { fontSize: `${size}px` }).setOrigin(0.5).setDepth(21);
    this.scene.tweens.add({
      targets: t, y: y - 26, alpha: 0, duration: 1100, ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private loopTween(a: Active, cfg: Phaser.Types.Tweens.TweenBuilderConfig): void {
    const tw = this.scene.tweens.add(cfg);
    a.cleanup.push(() => tw.remove());
  }

  private loopTimer(a: Active, delay: number, cb: () => void): void {
    const ev = this.scene.time.addEvent({ delay, loop: true, callback: cb });
    a.cleanup.push(() => ev.remove());
  }

  // ── 모션 구현 ──

  /** 버스킹: 기타 들고 몸을 흔들며 음표가 퍼진다 */
  private busking(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    this.prop(sprite, a, '🎸', 9, 2);
    this.loopTween(a, {
      targets: sprite, angle: { from: -4, to: 4 },
      duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.loopTimer(a, 650, () => {
      this.float(sprite.x + (Math.random() * 24 - 12), sprite.y - 16,
        Math.random() < 0.5 ? '🎵' : '🎶');
      audio.playSe('note');
    });
  }

  /** 카페 알바: 커피잔 들고 종종거리며 김이 모락모락 */
  private cafe(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    this.prop(sprite, a, '☕', 9, -4);
    this.loopTween(a, {
      targets: sprite, scaleY: { from: 1, to: 0.94 }, scaleX: { from: 1, to: 1.04 },
      duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.loopTimer(a, 900, () => this.float(sprite.x + 9, sprite.y - 14, '💨', 9));
  }

  /** 오목: 팔짱 끼고 고민하는 갸웃갸웃 */
  private omok(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    this.prop(sprite, a, '🤔', 10, -14, 11);
    this.loopTween(a, {
      targets: sprite, angle: { from: -3, to: 3 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  /** 승리·완료: 폴짝폴짝 + 축포 */
  private win(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    const baseY = sprite.y;
    const tw = this.scene.tweens.add({
      targets: sprite, y: baseY - 12, duration: 190,
      yoyo: true, repeat: 2, ease: 'Quad.easeOut',
      onComplete: () => this.stop(sprite),
    });
    a.cleanup.push(() => { tw.remove(); sprite.setY(baseY); });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      this.float(sprite.x + Math.cos(ang) * 14, sprite.y - 8 + Math.sin(ang) * 8,
        ['🎉', '✨', '🎊'][i % 3]!, 11);
    }
    audio.playSe('success');
  }

  /** 보상: 코인이 솟아오른다 */
  private coinBurst(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    const baseY = sprite.y;
    const tw = this.scene.tweens.add({
      targets: sprite, y: baseY - 7, duration: 150, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => this.stop(sprite),
    });
    a.cleanup.push(() => { tw.remove(); sprite.setY(baseY); });
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 90, () =>
        this.float(sprite.x + (Math.random() * 20 - 10), sprite.y - 12, '🪙', 11));
    }
    audio.playSe('coin');
    audio.vibrate(25);
  }

  /** 인사: 짧게 폴짝 + 하트 */
  private greet(sprite: Phaser.GameObjects.Sprite, a: Active): void {
    const baseY = sprite.y;
    const tw = this.scene.tweens.add({
      targets: sprite, y: baseY - 6, duration: 160, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => this.stop(sprite),
    });
    a.cleanup.push(() => { tw.remove(); sprite.setY(baseY); });
    this.float(sprite.x, sprite.y - 20, '💚', 11);
    audio.playSe('pop');
  }
}

/** 대기 중 숨쉬기 모션 — 이동이 멈추면 잔잔하게, 움직이면 해제 */
export class IdleBreath {
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly sprite: Phaser.GameObjects.Sprite) {}

  set(idle: boolean): void {
    if (idle && !this.tween) {
      this.tween = this.scene.tweens.add({
        targets: this.sprite, scaleY: 0.975, duration: 850,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    } else if (!idle && this.tween) {
      this.tween.remove();
      this.tween = null;
      this.sprite.setScale(1);
    }
  }

  destroy(): void { this.tween?.remove(); }
}
