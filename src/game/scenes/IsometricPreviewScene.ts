import Phaser from 'phaser';
import type { PeerState } from '../../net/NetworkAdapter';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { DEFAULT_APPEARANCE } from '../art/appearance';
import { ISOMETRIC_TREE_TEXTURES, type IsometricTreeVariant } from '../art/assetManifest';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import {
  drawIsoBuilding,
  drawIsoGround,
  drawIsoTileHighlight,
  drawIsoTree,
} from '../art/isometricArt';
import { TILE, TEXT_RES, UI_FONT } from '../config';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import {
  ISO_METRICS,
  isoDepth,
  pickIsoTile,
  projectIso,
  projectIsoWorld,
  screenInputToWorld,
} from '../world/isometric';
import {
  ISO_PREVIEW_BUILDINGS,
  ISO_PREVIEW_H,
  ISO_PREVIEW_W,
  buildIsoPreviewCollision,
  isoPreviewTerrain,
} from '../world/isometricPreviewMap';
import type { CollisionGrid } from '../world/grid';

interface PreviewData { peer?: PeerState }

/**
 * 아이소메트릭 전환 수직 슬라이스.
 * 기본 게임은 그대로 두고 `?iso&offline`으로 좌표·depth·충돌·조작을 독립 검증한다.
 */
export class IsometricPreviewScene extends Phaser.Scene {
  private peer!: PeerState;
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private ring!: Phaser.GameObjects.Ellipse;
  private highlight!: Phaser.GameObjects.Graphics;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private touch: TouchControls | null = null;
  private worldPos = { x: 8.5 * TILE, y: 13.5 * TILE };
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';

  constructor() { super('iso-preview'); }

  preload(): void {
    for (const asset of ISOMETRIC_TREE_TEXTURES) {
      if (!this.textures.exists(asset.key)) this.load.image(asset.key, asset.url);
    }
  }

  init(data: PreviewData): void {
    this.peer = data.peer ?? {
      userId: 'offline', nickname: '게스트', color: 'e8c9a0', appearance: DEFAULT_APPEARANCE,
    };
    this.worldPos = { x: 8.5 * TILE, y: 13.5 * TILE };
  }

  create(): void {
    this.grid = buildIsoPreviewCollision();
    drawIsoGround(this, ISO_PREVIEW_W, ISO_PREVIEW_H, isoPreviewTerrain);
    for (const def of ISO_PREVIEW_BUILDINGS) drawIsoBuilding(this, def);
    const treeVariants: IsometricTreeVariant[] = ['zelkova', 'ginkgo', 'redpine'];
    [[2, 8], [4, 8], [13, 8], [15, 8], [8, 3], [8, 15]].forEach(([tx, ty], index) => {
      drawIsoTree(this, tx!, ty!, treeVariants[index % treeVariants.length]);
    });

    this.highlight = this.add.graphics();
    const spawn = projectIsoWorld(this.worldPos.x, this.worldPos.y);
    this.ring = this.add.ellipse(spawn.x, spawn.y + 2, 28, 10, 0x5aa668, 0.42)
      .setStrokeStyle(2, 0xe8d79c, 0.85);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(spawn.x, spawn.y, this.charKey, 3 * FRAMES_PER_DIR)
      .setOrigin(0.5, 0.78);
    this.syncPlayerVisual();

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    if (isTouchDevice()) this.touch = new TouchControls();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tile = pickIsoTile(world.x, world.y);
      if (tile.tx >= 0 && tile.ty >= 0 && tile.tx < ISO_PREVIEW_W && tile.ty < ISO_PREVIEW_H) {
        drawIsoTileHighlight(this.highlight, tile.tx, tile.ty);
      } else {
        this.highlight.clear();
      }
    });

    const title = this.add.text(18, 16, '홍대마을 · ISOMETRIC LAB', {
      fontFamily: UI_FONT, fontSize: '15px', color: '#fff2d8', backgroundColor: '#4a2e14dd',
      padding: { x: 9, y: 6 }, resolution: TEXT_RES,
    }).setScrollFactor(0).setDepth(999999);
    const note = this.add.text(18, 55, '64×32 투영 · 기존 충돌/이동 재사용 · WASD 화면 기준 이동', {
      fontFamily: UI_FONT, fontSize: '10px', color: '#4a2e14', backgroundColor: '#f2dcaeee',
      padding: { x: 7, y: 4 }, resolution: TEXT_RES,
    }).setScrollFactor(0).setDepth(999999);
    title.setAlpha(0.97); note.setAlpha(0.94);

    const cam = this.cameras.main;
    const mapPixelW = (ISO_PREVIEW_W + ISO_PREVIEW_H) * (ISO_METRICS.tileWidth / 2);
    const mapPixelH = (ISO_PREVIEW_W + ISO_PREVIEW_H) * (ISO_METRICS.tileHeight / 2);
    cam.setBounds(-mapPixelW / 2 - 160, -180, mapPixelW + 320, mapPixelH + 380);
    cam.setZoom(window.innerWidth < 700 ? 1.15 : 1.55);
    cam.startFollow(this.player, true, 0.12, 0.12, 0, 55);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touch?.destroy();
      this.touch = null;
    });
  }

  update(_time: number, delta: number): void {
    const touch = this.touch?.getInput();
    const screenInput: MoveInput = {
      up: this.keys.W.isDown || !!touch?.up,
      down: this.keys.S.isDown || !!touch?.down,
      left: this.keys.A.isDown || !!touch?.left,
      right: this.keys.D.isDown || !!touch?.right,
    };
    const worldInput = screenInputToWorld(screenInput);
    this.worldPos = stepPlayer(this.worldPos, worldInput, delta, this.grid, { hw: 8, hh: 8 });
    this.updateFacing(screenInput);
    this.syncPlayerVisual();

    const moving = screenInput.up || screenInput.down || screenInput.left || screenInput.right;
    const animKey = `${this.charKey}-walk-${this.facing}`;
    if (moving) {
      if (this.player.anims.currentAnim?.key !== animKey || !this.player.anims.isPlaying) this.player.play(animKey);
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(this.facing * FRAMES_PER_DIR);
    }
  }

  private updateFacing(input: MoveInput): void {
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
  }

  private syncPlayerVisual(): void {
    const p = projectIsoWorld(this.worldPos.x, this.worldPos.y);
    this.player.setPosition(p.x, p.y);
    this.ring.setPosition(p.x, p.y + 2);
    const tile = { tx: this.worldPos.x / TILE, ty: this.worldPos.y / TILE, w: 0, h: 0 };
    this.ring.setDepth(isoDepth(tile, 300));
    this.player.setDepth(isoDepth(tile, 400));
  }
}
