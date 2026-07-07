import Phaser from 'phaser';
import { StreetScene } from './game/scenes/StreetScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1713',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [StreetScene],
  });
}

const game = createGame('game');

// 개발 모드 전용 디버그 훅 (콘솔·자동화 검증에서 게임 상태 접근용)
if (import.meta.env.DEV) {
  (window as unknown as { __game?: Phaser.Game }).__game = game;
}
