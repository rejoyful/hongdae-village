import Phaser from 'phaser';
import { TILE, ZOOM, TEXT_RES } from '../config';
import { tileToWorld, worldToTile, CollisionGrid } from '../world/grid';
import { COMPANIES, type CompanyId, type CompanyFloor } from '../company/company';
import { COMPANY_DOORS } from '../world/mapData';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import { makeTexture } from '../art/pixelCanvas';
import { ROOM_PAL, PAL } from '../art/palette';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';

interface CompanyData {
  companyId: CompanyId;
  level?: number;
  arrive?: { tx: number; ty: number };
  peer: PeerState;
  adapter: NetworkAdapter | null;
}
interface Bubble { c: Phaser.GameObjects.Container; owner: Phaser.GameObjects.Sprite; until: number }

/** 회사 건물 내부 — 층별 도면 + 계단 이동 + 사람·회의실·상호작용 */
export class CompanyScene extends Phaser.Scene {
  private companyId: CompanyId = 'forest';
  private floor!: CompanyFloor;
  private arrive: { tx: number; ty: number } | null = null;
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';
  private touch: TouchControls | null = null;
  private hint: HTMLDivElement | null = null;
  private bubbles: Bubble[] = [];
  private npcSprites: Array<{ sprite: Phaser.GameObjects.Sprite; lines: string[]; last: number; idx: number }> = [];
  private onSpotTile = -1;
  private switching = false;

  constructor() { super('company'); }

  init(data: CompanyData): void {
    this.companyId = data.companyId;
    const def = COMPANIES[this.companyId];
    const level = data.level ?? 1;
    this.floor = def.floors.find((f) => f.level === level) ?? def.floors[0]!;
    this.arrive = data.arrive ?? null;
    this.peer = data.peer;
    this.adapter = data.adapter ?? null;
    this.bubbles = [];
    this.npcSprites = [];
    this.onSpotTile = -1;
    this.switching = false;
  }

  create(): void {
    const f = this.floor;
    const doorTx = Math.floor(f.w / 2);
    this.grid = CollisionGrid.fromRects(f.w, f.h, [
      { x: 0, y: 0, w: f.w, h: 1 },
      { x: 0, y: f.h - 1, w: doorTx, h: 1 },
      { x: doorTx + 1, y: f.h - 1, w: f.w - doorTx - 1, h: 1 },
      { x: 0, y: 0, w: 1, h: f.h },
      { x: f.w - 1, y: 0, w: 1, h: f.h },
      ...f.solids,
    ], f.meetings.map((m) => m.door));

    this.add.image(0, 0, this.makeFloorBg()).setOrigin(0).setDepth(0);

    // 회의실 이름표
    for (const m of f.meetings) {
      this.add.text((m.rect.x + m.rect.w / 2) * TILE, (m.rect.y + 0.3) * TILE, m.name, {
        fontSize: '9px', color: '#3a4a6a', fontStyle: 'bold', resolution: TEXT_RES,
      }).setOrigin(0.5, 0).setDepth(1).setAlpha(0.7);
    }
    // 층·부서 안내
    const def = COMPANIES[this.companyId];
    this.add.text(doorTx * TILE + TILE / 2, 6, `${def.name} ${f.level}F · ${f.name}`, {
      fontSize: '8px', color: '#fff2d8', backgroundColor: '#3a4a6a', padding: { x: 4, y: 2 }, resolution: TEXT_RES,
    }).setOrigin(0.5, 0).setDepth(12).setAlpha(0.9);

    // 계단 표시
    const stair = (t: { tx: number; ty: number }, label: string) => {
      const w = tileToWorld(t.tx, t.ty);
      this.add.text(w.x + TILE / 2, w.y + TILE / 2, '🪜', { fontSize: '15px' }).setOrigin(0.5).setDepth(2);
      this.add.text(w.x + TILE / 2, w.y + TILE, label, {
        fontSize: '7px', color: '#fff2d8', backgroundColor: '#5c4432', padding: { x: 2, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 0).setDepth(12);
    };
    if (f.up) stair(f.up, '위층');
    if (f.down) stair(f.down, '아래층');

    // 사람들 (자리·이름표·폴짝)
    for (const npc of f.npcs) {
      const key = ensureCharacter(this, npc.appearance);
      const w = tileToWorld(npc.tx, npc.ty);
      const s = this.add.sprite(w.x + TILE / 2, w.y + TILE / 2, key, 0).setOrigin(0.5, 0.66).setDepth(9);
      this.add.text(s.x, s.y - 24, npc.name, {
        fontSize: '8px', color: '#fff2d8', backgroundColor: '#3a4a6a', padding: { x: 3, y: 1 }, resolution: TEXT_RES,
      }).setOrigin(0.5, 1).setDepth(11).setAlpha(0.95);
      this.tweens.add({ targets: s, y: s.y - 3, duration: 1200 + (npc.name.length * 90) % 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: (npc.tx * 137) % 1200 });
      this.npcSprites.push({ sprite: s, lines: npc.lines, last: -6000, idx: 0 });
    }
    // 상호작용 스팟
    for (const sp of f.spots) {
      const w = tileToWorld(sp.tx, sp.ty);
      const icon = this.add.text(w.x + TILE / 2, w.y - 2, '✨', { fontSize: '12px' }).setOrigin(0.5, 1).setDepth(12);
      this.tweens.add({ targets: icon, y: w.y - 8, duration: 640, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // 플레이어 스폰: 도착 지정 있으면 그곳, 없으면 하단 문 안쪽
    const spawnT = this.arrive ?? { tx: doorTx, ty: f.h - 2 };
    const spawn = tileToWorld(spawnT.tx, spawnT.ty);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(spawn.x + TILE / 2, spawn.y + TILE / 2, this.charKey, 3 * FRAMES_PER_DIR)
      .setOrigin(0.5, 0.66).setDepth(10);

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W), A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S), D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    const cam = this.cameras.main;
    cam.setZoom(window.innerWidth < 700 ? 1.3 : ZOOM);
    cam.centerOn((f.w * TILE) / 2, (f.h * TILE) / 2);

    if (isTouchDevice()) this.touch = new TouchControls();
    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = f.up || f.down
      ? `${def.name} ${f.level}F · 🪜계단으로 층 이동 · 아래 문으로 나가기`
      : `${def.name} · ✨앞에서 구경 · 아래 문으로 나가기`;
    document.body.appendChild(this.hint);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touch?.destroy(); this.touch = null;
      this.hint?.remove(); this.hint = null;
      for (const b of this.bubbles) b.c.destroy();
      this.bubbles = [];
    });
  }

  update(_t: number, delta: number): void {
    const t = this.touch?.getInput();
    const input: MoveInput = {
      up: this.keys.W.isDown || !!t?.up, down: this.keys.S.isDown || !!t?.down,
      left: this.keys.A.isDown || !!t?.left, right: this.keys.D.isDown || !!t?.right,
    };
    const next = stepPlayer({ x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 });
    this.player.setPosition(next.x, next.y);
    if (input.down) this.facing = 0; else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2; else if (input.up) this.facing = 3;
    const moving = input.up || input.down || input.left || input.right;
    const ak = `${this.charKey}-walk-${this.facing}`;
    if (moving) { if (this.player.anims.currentAnim?.key !== ak || !this.player.anims.isPlaying) this.player.play(ak); }
    else if (this.player.anims.isPlaying) { this.player.stop(); this.player.setFrame(this.facing * FRAMES_PER_DIR); }

    if (this.switching) return;
    const tile = worldToTile(next.x, next.y);
    const f = this.floor;

    // 계단 → 층 이동
    if (f.up && tile.tx === f.up.tx && tile.ty === f.up.ty) { this.goFloor(f.level + 1, 'down'); return; }
    if (f.down && tile.tx === f.down.tx && tile.ty === f.down.ty) { this.goFloor(f.level - 1, 'up'); return; }

    // 상호작용 스팟
    const spotIdx = f.spots.findIndex((sp) => sp.tx === tile.tx && sp.ty === tile.ty);
    if (spotIdx !== -1 && spotIdx !== this.onSpotTile) {
      const sp = f.spots[spotIdx]!;
      this.showBubble(this.player, sp.lines[Math.floor(Math.random() * sp.lines.length)]!);
    }
    this.onSpotTile = spotIdx;

    // 사람 근처면 말 걸기
    const now = this.time.now;
    for (const n of this.npcSprites) {
      const d = Math.abs(n.sprite.x - next.x) + Math.abs(n.sprite.y - next.y);
      if (d < TILE * 1.6 && now - n.last > 5000) {
        n.last = now;
        this.showBubble(n.sprite, n.lines[n.idx % n.lines.length]!);
        n.idx++;
      }
    }
    this.bubbles = this.bubbles.filter((b) => {
      if (now >= b.until || !b.owner.active) { b.c.destroy(); return false; }
      b.c.setPosition(b.owner.x, b.owner.y - 30);
      return true;
    });

    // 1층 하단 문 → 거리 (건물 앞)
    if (f.level === 1 && tile.tx === Math.floor(f.w / 2) && tile.ty === f.h - 1) {
      this.switching = true;
      const door = COMPANY_DOORS.find((d) => d.company === this.companyId);
      const spawnTile = door ? { tx: door.tx, ty: door.ty + 1 } : undefined;
      this.scene.start('street', { peer: this.peer, adapter: this.adapter, spawnTile });
    }
  }

  /** 층 이동 — 도착 층의 반대편 계단 옆으로 스폰 (재트리거 방지) */
  private goFloor(level: number, arriveStair: 'up' | 'down'): void {
    const def = COMPANIES[this.companyId];
    const target = def.floors.find((f) => f.level === level);
    if (!target) return;
    this.switching = true;
    const s = arriveStair === 'up' ? target.up : target.down;
    const arrive = s ? { tx: s.tx, ty: s.ty + 1 } : undefined; // 계단 한 칸 아래로 내려서 스폰
    this.scene.restart({ companyId: this.companyId, level, arrive, peer: this.peer, adapter: this.adapter });
  }

  private makeFloorBg(): string {
    const f = this.floor;
    const key = `company-bg-${this.companyId}-${f.level}`;
    if (this.textures.exists(key)) return key;
    const W = f.w * TILE, H = f.h * TILE, doorTx = Math.floor(f.w / 2);
    makeTexture(this, key, W, H, (d) => {
      // 오피스 카펫
      for (let ty = 0; ty < f.h; ty++) for (let tx = 0; tx < f.w; tx++) {
        d.rect(tx * TILE, ty * TILE, TILE, TILE, (tx + ty) % 2 ? 0x8a94a0 : 0x828c98);
        d.rect(tx * TILE, ty * TILE + TILE - 1, TILE, 1, 0x6a7280, 0.4);
      }
      const wall = (x: number, y: number, w: number, h: number) => {
        d.rect(x, y, w, h, ROOM_PAL.wallPaper); d.rect(x, y + h - 3, w, 3, 0x4a5470);
      };
      wall(0, 0, W, TILE);
      d.rect(0, 0, TILE, H, ROOM_PAL.wallPaper); d.rect(TILE - 3, 0, 3, H, 0x4a5470);
      d.rect(W - TILE, 0, TILE, H, ROOM_PAL.wallPaper); d.rect(W - TILE, 0, 3, H, 0x4a5470);
      d.rect(0, H - TILE, W, TILE, ROOM_PAL.wallPaper); d.rect(0, H - TILE, W, 3, 0x4a5470);
      // 내부 구조물(회의실 칸막이 등)
      for (const s of f.solids) {
        d.rect(s.x * TILE, s.y * TILE, s.w * TILE, s.h * TILE, 0xb8c0cc);
        d.rect(s.x * TILE, s.y * TILE, s.w * TILE, 3, 0x8a94a0);
      }
      // 유리 파티션 느낌 (회의실 상단)
      for (const m of f.meetings) {
        d.rect(m.rect.x * TILE + 2, m.rect.y * TILE + 3, m.rect.w * TILE - 4, 3, 0x9cc7e0, 0.5);
      }
      // 1층 출입문
      if (f.level === 1) {
        const dx = doorTx * TILE, dy = (f.h - 1) * TILE;
        d.rect(dx + 2, dy, TILE - 4, TILE, PAL.doorDark);
        d.rect(dx + 4, dy + 2, TILE - 8, TILE - 2, PAL.doorWood);
      }
    });
    return key;
  }

  private showBubble(owner: Phaser.GameObjects.Sprite, text: string): void {
    this.bubbles = this.bubbles.filter((b) => { if (b.owner === owner) { b.c.destroy(); return false; } return true; });
    const t = this.add.text(0, 0, text, {
      fontSize: '11px', color: '#243040', wordWrap: { width: 150 }, align: 'center', resolution: TEXT_RES,
    }).setOrigin(0.5);
    const b = t.getBounds();
    const w = b.width + 16, h = b.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a3444, 1).fillRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, 8);
    bg.fillStyle(0xf2f6fc, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 7);
    const c = this.add.container(owner.x, owner.y - 30, [bg, t]).setDepth(20).setScale(0.6);
    this.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.bubbles.push({ c, owner, until: this.time.now + 3500 });
  }
}
