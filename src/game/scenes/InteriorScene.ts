import Phaser from 'phaser';
import { TILE, ZOOM } from '../config';
import { tileToWorld, worldToTile, CollisionGrid, type CollisionGrid as Grid } from '../world/grid';
import { INTERIORS, type InteriorDef } from '../world/interiors';
import { INTERIOR_DOORS, type InteriorShop } from '../world/mapData';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { ROOM_PAL, PAL } from '../art/palette';
import { makeTexture } from '../art/pixelCanvas';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';

interface InteriorData { shop: InteriorShop; peer: PeerState; adapter: NetworkAdapter | null }

/** 상가 내부 — AI 백드롭 + 근사 충돌 + 문으로 거리 복귀 */
export class InteriorScene extends Phaser.Scene {
  private def!: InteriorDef;
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private grid!: Grid;
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';
  private touch: TouchControls | null = null;
  private hint: HTMLDivElement | null = null;

  constructor() { super('interior'); }

  preload(): void {
    const loaded = new Set<string>();
    for (const def of Object.values(INTERIORS)) {
      if (!loaded.has(def.backdropKey) && !this.textures.exists(def.backdropKey)) {
        this.load.image(def.backdropKey, def.backdropUrl);
        loaded.add(def.backdropKey);
      }
    }
    this.load.on('loaderror', (f: { key: string }) =>
      console.warn('[홍대마을] 인테리어 백드롭 없음(프로시저럴 폴백):', f.key));
  }

  init(data: InteriorData): void {
    this.def = INTERIORS[data.shop];
    this.peer = data.peer;
    this.adapter = data.adapter ?? null;
  }

  create(): void {
    const { w, h } = this.def;
    const doorTx = Math.floor(w / 2);

    // 충돌: 테두리(하단 중앙 문 제외) + 내부 구조물
    this.grid = CollisionGrid.fromRects(w, h, [
      { x: 0, y: 0, w, h: 1 },
      { x: 0, y: h - 1, w: doorTx, h: 1 },
      { x: doorTx + 1, y: h - 1, w: w - doorTx - 1, h: 1 },
      { x: 0, y: 0, w: 1, h },
      { x: w - 1, y: 0, w: 1, h },
      ...this.def.solids,
    ]);

    // 백드롭 (없으면 프로시저럴 폴백)
    if (this.textures.exists(this.def.backdropKey)) {
      this.add.image(0, 0, this.def.backdropKey).setOrigin(0).setDisplaySize(w * TILE, h * TILE).setDepth(0);
    } else {
      const key = `int-fallback-${this.def.id}`;
      makeTexture(this, key, w * TILE, h * TILE, (d) => {
        d.rect(0, 0, w * TILE, h * TILE, 0xdedad2);
        for (const s of this.def.solids) d.rect(s.x * TILE, s.y * TILE, s.w * TILE, s.h * TILE, 0x9a9288);
        d.rect(0, 0, w * TILE, TILE, ROOM_PAL.wallBase);
        d.rect(doorTx * TILE + 4, (h - 1) * TILE, TILE - 8, TILE, PAL.doorWood);
      });
      this.add.image(0, 0, key).setOrigin(0).setDepth(0);
    }

    // 플레이어 — 문 안쪽 스폰
    const spawn = tileToWorld(doorTx, h - 2);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, this.charKey, 3 * FRAMES_PER_DIR)
      .setOrigin(0.5, 0.66).setDepth(10);

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    const cam = this.cameras.main;
    cam.setZoom(window.innerWidth < 700 ? 1.4 : ZOOM);
    cam.centerOn((w * TILE) / 2, (h * TILE) / 2);

    if (isTouchDevice()) this.touch = new TouchControls([]);

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = `${this.def.name} · 아래 문으로 나가기`;
    document.body.appendChild(this.hint);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touch?.destroy();
      this.touch = null;
      this.hint?.remove();
      this.hint = null;
    });
  }

  update(_t: number, delta: number): void {
    const t = this.touch?.getInput();
    const input: MoveInput = {
      up: this.keys.W.isDown || !!t?.up,
      down: this.keys.S.isDown || !!t?.down,
      left: this.keys.A.isDown || !!t?.left,
      right: this.keys.D.isDown || !!t?.right,
    };
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.player.setPosition(next.x, next.y);

    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
    const moving = input.up || input.down || input.left || input.right;
    const ak = `${this.charKey}-walk-${this.facing}`;
    if (moving) {
      if (this.player.anims.currentAnim?.key !== ak || !this.player.anims.isPlaying) this.player.play(ak);
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(this.facing * FRAMES_PER_DIR);
    }

    // 문 밟으면 거리로 (들어온 상가 문 앞)
    const tile = worldToTile(next.x, next.y);
    if (tile.tx === Math.floor(this.def.w / 2) && tile.ty === this.def.h - 1) {
      const door = INTERIOR_DOORS.find((d) => d.shop === this.def.id);
      const spawnTile = door ? { tx: door.tx, ty: door.ty + 1 } : undefined;
      this.scene.start('street', { peer: this.peer, adapter: this.adapter, spawnTile });
    }
  }
}
