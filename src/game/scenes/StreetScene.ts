import Phaser from 'phaser';
import { TILE, ZOOM, MAP_W, MAP_H } from '../config';
import { ZONES, SOLID_RECTS, SPAWN_TILE, buildCollision } from '../world/mapData';
import { tileToWorld, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { screenToTile } from '../input/pointer';

export class StreetScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Rectangle;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private marker!: Phaser.GameObjects.Rectangle;

  constructor() { super('street'); }

  create(): void {
    this.grid = buildCollision();

    // 존 배경 블록
    for (const z of ZONES) {
      const p = tileToWorld(z.rect.x, z.rect.y);
      this.add.rectangle(p.x, p.y, z.rect.w * TILE, z.rect.h * TILE, z.color).setOrigin(0);
      this.add.text(p.x + 6, p.y + 6, z.name, { fontSize: '10px', color: '#ffffff' }).setAlpha(0.55);
    }
    // 건물(충돌) 블록
    for (const r of SOLID_RECTS) {
      const p = tileToWorld(r.x, r.y);
      this.add.rectangle(p.x, p.y, r.w * TILE, r.h * TILE, 0x241f1a).setOrigin(0);
    }

    // 클릭 마커
    this.marker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0)
      .setStrokeStyle(2, 0xf2d8a8).setVisible(false);

    // 플레이어 (placeholder 사각형 — Phase 5에서 스프라이트 교체)
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    this.player = this.add.rectangle(spawn.x + TILE / 2, spawn.y + TILE / 2, 16, 22, 0xe8c9a0);

    // 입력
    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      const { tx, ty } = screenToTile(p.x, p.y, {
        scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
        width: cam.width, height: cam.height,
      });
      const w = tileToWorld(tx, ty);
      this.marker.setPosition(w.x, w.y).setVisible(true);
    });

    // 카메라
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  update(_time: number, delta: number): void {
    const input: MoveInput = {
      up: this.keys.W.isDown, down: this.keys.S.isDown,
      left: this.keys.A.isDown, right: this.keys.D.isDown,
    };
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.player.setPosition(next.x, next.y);
  }
}
