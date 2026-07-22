import Phaser from 'phaser';
import { TILE, ZOOM, TEXT_RES, UI_FONT } from '../config';
import { tileToWorld, worldToTile, CollisionGrid, type CollisionGrid as Grid } from '../world/grid';
import { INTERIORS, type InteriorDef } from '../world/interiors';
import { INTERIOR_DOORS, type InteriorShop } from '../world/mapData';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { ROOM_PAL, PAL } from '../art/palette';
import { makeTexture } from '../art/pixelCanvas';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { ExitButton } from '../../ui/exitButton';

interface InteriorData { shop: InteriorShop; peer: PeerState; adapter: NetworkAdapter | null }

interface Bubble { c: Phaser.GameObjects.Container; owner: Phaser.GameObjects.Sprite; until: number }

/** 상가 내부 — AI 백드롭 + 근사 충돌 + 사람·상호작용 + 문으로 거리 복귀 */
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
  private exitBtn: ExitButton | null = null;
  private bubbles: Bubble[] = [];
  private npcSprites: Array<{ sprite: Phaser.GameObjects.Sprite; lines: string[]; last: number; idx: number }> = [];
  private onSpotTile = -1;

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

    if (isTouchDevice()) this.touch = new TouchControls();

    // 인테리어 사람들 (알바·손님) — 이름표 + 제자리 폴짝
    for (const npc of this.def.npcs) {
      const key = ensureCharacter(this, npc.appearance);
      const w = tileToWorld(npc.tx, npc.ty);
      const s = this.add.sprite(w.x + TILE / 2, w.y + TILE / 2, key, 0).setOrigin(0.5, 0.66).setDepth(9);
      this.add.text(s.x, s.y - 24, npc.name, {
        fontFamily: UI_FONT, fontSize: '10px', color: '#fff2d8', backgroundColor: '#7a5220', padding: { x: 3, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 1).setDepth(11).setAlpha(0.95);
      this.tweens.add({ targets: s, y: s.y - 3, duration: 1300, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: (npc.name.length * 173) % 1000 });
      this.npcSprites.push({ sprite: s, lines: npc.lines, last: -6000, idx: 0 });
    }

    // 상호작용 스팟 표시 (통통 튀는 라벨)
    for (const sp of this.def.spots) {
      const w = tileToWorld(sp.tx, sp.ty);
      const icon = this.add.text(w.x + TILE / 2, w.y - 2, '✨', { fontFamily: UI_FONT, fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12);
      this.add.text(w.x + TILE / 2, w.y + TILE, sp.label, {
        fontFamily: UI_FONT, fontSize: '9px', color: '#fff2d8', backgroundColor: '#5c4432', padding: { x: 2, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 0).setDepth(12).setAlpha(0.9);
      this.tweens.add({ targets: icon, y: w.y - 8, duration: 640, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // 출구 표시 — 하단 중앙 문 위에 매트 + "▼ 나가기" 라벨 (어디로 나가는지 명확히)
    const exitW = tileToWorld(Math.floor(this.def.w / 2), this.def.h - 1);
    this.add.rectangle(exitW.x + TILE / 2, exitW.y + TILE - 3, TILE - 6, 5, 0x6ee87c, 0.6).setDepth(1);
    this.add.text(exitW.x + TILE / 2, exitW.y - 2, '▼ 나가기', {
      fontFamily: UI_FONT, fontSize: '9px', color: '#fff2d8', backgroundColor: '#2a6a3a',
      padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 1).setDepth(12).setAlpha(0.95);

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = `${this.def.name} · ✨앞에 서면 구경`;
    document.body.appendChild(this.hint);
    this.exitBtn = new ExitButton(() => this.exitToStreet());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touch?.destroy();
      this.touch = null;
      this.hint?.remove();
      this.hint = null;
      this.exitBtn?.destroy();
      this.exitBtn = null;
      for (const b of this.bubbles) b.c.destroy();
      this.bubbles = [];
    });
  }

  private exitToStreet(): void {
    const door = INTERIOR_DOORS.find((d) => d.shop === this.def.id);
    const spawnTile = door ? { tx: door.tx, ty: door.ty + 1 } : undefined;
    this.scene.start('street', { peer: this.peer, adapter: this.adapter, spawnTile });
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

    // 상호작용 스팟: 밟는 순간 테마 대사 (건물 성격별 재미요소)
    const tile = worldToTile(next.x, next.y);
    const spotIdx = this.def.spots.findIndex((sp) => sp.tx === tile.tx && sp.ty === tile.ty);
    if (spotIdx !== -1 && spotIdx !== this.onSpotTile) {
      const sp = this.def.spots[spotIdx]!;
      this.showBubble(this.player, sp.lines[Math.floor(Math.random() * sp.lines.length)]!);
    }
    this.onSpotTile = spotIdx;

    // 사람 근처면 말 걸기 (쿨다운)
    const now = this.time.now;
    for (const n of this.npcSprites) {
      const d = Math.abs(n.sprite.x - next.x) + Math.abs(n.sprite.y - next.y);
      if (d < TILE * 1.6 && now - n.last > 5000) {
        n.last = now;
        this.showBubble(n.sprite, n.lines[n.idx % n.lines.length]!);
        n.idx++;
      }
    }

    // 말풍선 추종·만료
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 30);
      return true;
    });

    // 하단 중앙 문(출구 매트)을 밟으면 거리로
    if (tile.tx === Math.floor(this.def.w / 2) && tile.ty === this.def.h - 1) this.exitToStreet();
  }

  private showBubble(owner: Phaser.GameObjects.Sprite, text: string): void {
    this.bubbles = this.bubbles.filter((b) => {
      if (b.owner === owner) { b.c.destroy(); return false; }
      return true;
    });
    const t = this.add.text(0, 0, text, {
      fontFamily: UI_FONT, fontSize: '11px', color: '#4a2e14', wordWrap: { width: 150 }, align: 'center', resolution: TEXT_RES,
    }).setOrigin(0.5);
    const b = t.getBounds();
    const w = b.width + 16, h = b.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x4a2c12, 1).fillRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, 8);
    bg.fillStyle(0xfff8e4, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    const c = this.add.container(owner.x, owner.y - 30, [bg, t]).setDepth(20);
    c.setScale(0.6);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.bubbles.push({ c, owner, until: this.time.now + 3500 });
  }
}
