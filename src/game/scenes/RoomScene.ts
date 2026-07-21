import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM } from '../config';
import { tileToWorld, worldToTile, type CollisionGrid } from '../world/grid';
import { ROOM_W, ROOM_H, ROOM_DOOR, ROOM_SPAWN, buildRoomCollision } from '../world/roomMap';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { canPlace, footprint, sizeOf, type Placed, type Rot } from '../entities/placement';
import { screenToTile } from '../input/pointer';
import { CATALOG_BY_ID } from '../../items/catalog';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { InventoryBar } from '../../ui/inventoryBar';
import {
  fetchInventory, fetchPlacements, insertPlacement, deletePlacement,
  adjustInventory, subscribePlacements,
} from '../../db/roomsApi';

interface RoomData {
  roomId: number;
  isOwner: boolean;
  peer: PeerState;
  adapter: NetworkAdapter | null;
}

export class RoomScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Rectangle;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  private roomId = 1;
  private isOwner = false;
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private sb: SupabaseClient | null = null;

  private placed: Placed[] = [];
  private placedGfx = new Map<string, Phaser.GameObjects.Container>();
  private inv: InventoryBar | null = null;
  private counts = new Map<string, number>();
  private ghost: Phaser.GameObjects.Rectangle | null = null;
  private ghostRot: Rot = 0;
  private ghostTile = { tx: 2, ty: 2 };
  private unsubscribe: (() => void) | null = null;
  private hint: HTMLDivElement | null = null;
  private localSeq = 0;

  constructor() { super('room'); }

  init(data: RoomData): void {
    this.roomId = data.roomId;
    this.isOwner = data.isOwner;
    this.peer = data.peer;
    this.adapter = data.adapter ?? null;
    this.sb = (this.registry.get('sb') as SupabaseClient | undefined) ?? null;
    this.placed = [];
    this.placedGfx.clear();
    this.ghost = null;
    this.ghostRot = 0;
  }

  create(): void {
    this.grid = buildRoomCollision();
    this.drawRoom();

    const spawn = tileToWorld(ROOM_SPAWN.tx, ROOM_SPAWN.ty);
    this.player = this.add.rectangle(
      spawn.x + TILE / 2, spawn.y + TILE / 2, 16, 22, parseInt(this.peer.color, 16),
    ).setDepth(10);

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    // bounds를 걸면 방(뷰포트보다 작음)이 좌상단에 고정되므로 중앙 정렬만 사용
    cam.centerOn((ROOM_W * TILE) / 2, (ROOM_H * TILE) / 2);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    kb.on('keydown-R', () => this.rotateGhost());
    kb.on('keydown-ESC', () => this.inv?.clearSelection());

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    this.hint.textContent = this.isOwner
      ? '아래 바에서 가구 선택 → 클릭 배치 · R 회전 · 배치물 클릭 제거 · 문으로 나가기'
      : '친구의 방 (구경 모드) · 문으로 나가기';
    document.body.appendChild(this.hint);

    void this.loadRoom();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
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

    // 문 타일에 서면 거리로 퇴장
    const { tx, ty } = worldToTile(next.x, next.y);
    if (tx === ROOM_DOOR.tx && ty === ROOM_DOOR.ty) {
      this.scene.start('street', { peer: this.peer, adapter: this.adapter });
    }
  }

  // --- 데이터 ---

  private async loadRoom(): Promise<void> {
    if (this.sb) {
      this.placed = await fetchPlacements(this.sb, this.roomId);
      this.redrawPlacements();
      this.unsubscribe = subscribePlacements(this.sb, this.roomId, () => void this.refresh());
      if (this.isOwner) {
        this.counts = await fetchInventory(this.sb, this.peer.userId);
        this.mountInventory();
      }
    } else if (this.isOwner) {
      // 오프라인: 로컬 전용 배치 (미저장) — 개발·검증용
      this.counts = new Map([['bed_basic', 1], ['desk_wood', 1], ['chair_wood', 2], ['rug_cream', 1], ['plant_pot', 2]]);
      this.mountInventory();
    }
  }

  private async refresh(): Promise<void> {
    if (!this.sb) return;
    this.placed = await fetchPlacements(this.sb, this.roomId);
    this.redrawPlacements();
  }

  private mountInventory(): void {
    this.inv = new InventoryBar((itemId) => this.setGhost(itemId));
    this.inv.setCounts(this.counts);
  }

  // --- 렌더 ---

  private drawRoom(): void {
    for (let ty = 0; ty < ROOM_H; ty++) {
      for (let tx = 0; tx < ROOM_W; tx++) {
        const p = tileToWorld(tx, ty);
        const isWall = this.grid.isSolid(tx, ty);
        const isDoor = tx === ROOM_DOOR.tx && ty === ROOM_DOOR.ty;
        const color = isDoor ? 0x8a5a3a : isWall ? 0x3a3128 : ((tx + ty) % 2 ? 0x94795e : 0x8a6f56);
        this.add.rectangle(p.x, p.y, TILE, TILE, color).setOrigin(0);
      }
    }
  }

  private redrawPlacements(): void {
    for (const c of this.placedGfx.values()) c.destroy();
    this.placedGfx.clear();
    for (const p of this.placed) this.drawPlaced(p);
  }

  private drawPlaced(p: Placed): void {
    const def = CATALOG_BY_ID.get(p.itemId);
    const size = sizeOf(p.itemId, p.rot);
    if (!def || !size) return;
    const w = tileToWorld(p.tx, p.ty);
    const rect = this.add.rectangle(0, 0, size.w * TILE - 4, size.h * TILE - 4, parseInt(def.color, 16))
      .setOrigin(0).setStrokeStyle(1, 0x241f1a);
    const c = this.add.container(w.x + 2, w.y + 2, [rect]).setDepth(5);
    this.placedGfx.set(p.id, c);
  }

  // --- 꾸미기 (주인 전용) ---

  private setGhost(itemId: string | null): void {
    this.ghost?.destroy();
    this.ghost = null;
    if (!itemId) return;
    this.ghostRot = 0;
    this.ghost = this.add.rectangle(0, 0, TILE, TILE, 0xffffff, 0.4).setOrigin(0).setDepth(20);
    this.updateGhost();
  }

  private rotateGhost(): void {
    if (!this.ghost) return;
    this.ghostRot = this.ghostRot === 0 ? 1 : 0;
    this.updateGhost();
  }

  private updateGhost(): void {
    const itemId = this.inv?.selected;
    if (!this.ghost || !itemId) return;
    const def = CATALOG_BY_ID.get(itemId);
    const size = sizeOf(itemId, this.ghostRot);
    if (!def || !size) return;
    const ok = canPlace(this.placed, itemId, this.ghostTile.tx, this.ghostTile.ty, this.ghostRot);
    const w = tileToWorld(this.ghostTile.tx, this.ghostTile.ty);
    this.ghost.setPosition(w.x, w.y)
      .setSize(size.w * TILE, size.h * TILE)
      .setFillStyle(parseInt(def.color, 16), 0.55)
      .setStrokeStyle(2, ok ? 0x6ee87c : 0xe86e6e);
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!this.ghost) return;
    const cam = this.cameras.main;
    this.ghostTile = screenToTile(p.x, p.y, {
      scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
      width: cam.width, height: cam.height,
    });
    this.updateGhost();
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (!this.isOwner) return;
    const itemId = this.inv?.selected;
    if (itemId && this.ghost) {
      void this.tryPlace(itemId);
      return;
    }
    // 고스트 없으면 배치물 클릭 → 제거
    const cam = this.cameras.main;
    const t = screenToTile(p.x, p.y, {
      scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom,
      width: cam.width, height: cam.height,
    });
    const hit = this.placed.find((pl) => footprint(pl).some((f) => f.tx === t.tx && f.ty === t.ty));
    if (hit) void this.removePlaced(hit);
  }

  private async tryPlace(itemId: string): Promise<void> {
    const { tx, ty } = this.ghostTile;
    const rot = this.ghostRot;
    if ((this.counts.get(itemId) ?? 0) <= 0) return;
    if (!canPlace(this.placed, itemId, tx, ty, rot)) return;

    // 낙관적 반영 → 서버 실패 시 롤백 (스펙 §7)
    const localId = `local-${++this.localSeq}`;
    const optimistic: Placed = { id: localId, itemId, tx, ty, rot };
    this.placed.push(optimistic);
    this.drawPlaced(optimistic);
    this.counts.set(itemId, (this.counts.get(itemId) ?? 0) - 1);
    this.inv?.setCounts(this.counts);
    this.updateGhost();

    if (!this.sb) return; // 오프라인: 로컬 유지
    const realId = await insertPlacement(this.sb, this.roomId, { itemId, tx, ty, rot });
    if (!realId) {
      this.placed = this.placed.filter((pl) => pl.id !== localId);
      this.placedGfx.get(localId)?.destroy();
      this.placedGfx.delete(localId);
      this.counts.set(itemId, (this.counts.get(itemId) ?? 0) + 1);
      this.inv?.setCounts(this.counts);
      return;
    }
    optimistic.id = realId;
    const gfx = this.placedGfx.get(localId);
    if (gfx) { this.placedGfx.delete(localId); this.placedGfx.set(realId, gfx); }
    void adjustInventory(this.sb, this.peer.userId, itemId, -1);
  }

  private async removePlaced(p: Placed): Promise<void> {
    this.placed = this.placed.filter((pl) => pl.id !== p.id);
    this.placedGfx.get(p.id)?.destroy();
    this.placedGfx.delete(p.id);
    this.counts.set(p.itemId, (this.counts.get(p.itemId) ?? 0) + 1);
    this.inv?.setCounts(this.counts);

    if (!this.sb || p.id.startsWith('local-')) return;
    const ok = await deletePlacement(this.sb, p.id);
    if (ok) void adjustInventory(this.sb, this.peer.userId, p.itemId, 1);
    else void this.refresh(); // 실패 시 서버 상태로 복원
  }

  private teardown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.inv?.destroy();
    this.inv = null;
    this.ghost = null;
    this.hint?.remove();
    this.hint = null;
  }
}
