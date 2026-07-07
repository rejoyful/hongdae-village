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

createGame('game');
