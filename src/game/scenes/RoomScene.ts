import Phaser from 'phaser';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TILE, ZOOM, TEXT_RES, UI_FONT } from '../config';
import { tileToWorld, worldToTile, CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { canPlace, footprint, sizeOf, layerOf, type Placed, type Rot, type PlaceRegion } from '../entities/placement';
import { screenToTile } from '../input/pointer';
import { CATALOG_BY_ID } from '../../items/catalog';
import { HOUSE_DOORS } from '../world/mapData';
import { makeRoomBackgroundPlan, ensureFurniture } from '../art/roomArt';
import {
  generateFloorPlan, isPlaceableTile, HOUSE_SPECS, DEAL_LABEL,
  type FloorPlan, type HouseType, type DealType,
} from '../realestate/realEstate';
import { chargeRent } from '../../db/realEstateApi';
import { ROOM_MATERIALS, FURNITURE_ASSETS, furnitureAssetKey } from '../art/assetManifest';
import { TouchControls, isTouchDevice } from '../../ui/touchControls';
import { ensureCharacter, FRAMES_PER_DIR } from '../art/characterArt';
import type { NetworkAdapter, PeerState } from '../../net/NetworkAdapter';
import { InventoryBar } from '../../ui/inventoryBar';
import type { GameHud } from '../../ui/gameHud';
import type { QuestStore } from '../questProgress';
import { DAILY_QUESTS } from '../quests';
import {
  fetchInventory, fetchPlacements, insertPlacement, deletePlacement,
  subscribePlacements, grantStarterOnce,
} from '../../db/roomsApi';

interface RoomData {
  roomId: number;
  isOwner: boolean;
  peer: PeerState;
  adapter: NetworkAdapter | null;
  houseType?: HouseType;
  floorSeed?: number;
  dealType?: DealType | null;
}

export class RoomScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Sprite;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private facing: 0 | 1 | 2 | 3 = 3;
  private charKey = '';

  private roomId = 1;
  private isOwner = false;
  private peer!: PeerState;
  private adapter: NetworkAdapter | null = null;
  private sb: SupabaseClient | null = null;
  private plan!: FloorPlan;
  private region!: PlaceRegion;
  private houseType: HouseType = 'oneroom';
  private dealType: DealType | null = null;

  private placed: Placed[] = [];
  private placedGfx = new Map<string, Phaser.GameObjects.Image>();
  private inv: InventoryBar | null = null;
  private counts = new Map<string, number>();
  private ghost: Phaser.GameObjects.Rectangle | null = null;
  private ghostRot: Rot = 0;
  private ghostTile = { tx: 2, ty: 2 };
  private unsubscribe: (() => void) | null = null;
  private hint: HTMLDivElement | null = null;
  private touch: TouchControls | null = null;
  private localSeq = 0;

  constructor() { super('room'); }

  preload(): void {
    // AI 방 재질·가구 스프라이트 — 404여도 프로시저럴 폴백으로 계속
    for (const m of ROOM_MATERIALS) {
      if (!this.textures.exists(m.key)) this.load.image(m.key, m.url);
    }
    for (const f of FURNITURE_ASSETS) {
      for (const rot of f.rots) {
        const key = furnitureAssetKey(f.itemId, rot);
        if (!this.textures.exists(key)) this.load.image(key, `assets/furniture/${f.itemId}_${rot}.png`);
      }
    }
    this.load.on('loaderror', (file: { key: string }) => {
      console.warn('[홍대마을] 자산 로드 실패(프로시저럴 폴백):', file.key);
    });
  }

  init(data: RoomData): void {
    this.roomId = data.roomId;
    this.isOwner = data.isOwner;
    this.peer = data.peer;
    this.adapter = data.adapter ?? null;
    this.sb = (this.registry.get('sb') as SupabaseClient | undefined) ?? null;
    this.houseType = data.houseType ?? 'oneroom';
    this.dealType = data.dealType ?? null;
    this.plan = generateFloorPlan(this.houseType, data.floorSeed ?? this.roomId);
    this.region = {
      x: 1, y: 1, w: this.plan.w - 2, h: this.plan.h - 2, wallRow: 1,
      isBlocked: (tx, ty) => !isPlaceableTile(this.plan, tx, ty),
    };
    this.placed = [];
    this.placedGfx.clear();
    this.ghost = null;
    this.ghostRot = 0;
  }

  create(): void {
    // 부동산 평면 기반 충돌: 테두리(문 제외) + 내부 칸막이(통로 제외)
    const { w, h, door, walls, doorGaps } = this.plan;
    this.grid = CollisionGrid.fromRects(w, h, [
      { x: 0, y: 0, w, h: 1 },
      { x: 0, y: h - 1, w: door.tx, h: 1 },
      { x: door.tx + 1, y: h - 1, w: w - door.tx - 1, h: 1 },
      { x: 0, y: 0, w: 1, h },
      { x: w - 1, y: 0, w: 1, h },
      ...walls,
    ], doorGaps);
    this.add.image(0, 0, makeRoomBackgroundPlan(this, this.plan, this.roomId)).setOrigin(0).setDepth(0);

    // 방 이름표 (구획별)
    for (const rm of this.plan.rooms) {
      const cx = (rm.rect.x + rm.rect.w / 2) * TILE;
      const cy = (rm.rect.y + 0.4) * TILE;
      this.add.text(cx, cy, rm.name, {
        fontFamily: UI_FONT, fontSize: '9px', color: '#8a6a4a', resolution: TEXT_RES,
      }).setOrigin(0.5).setDepth(1).setAlpha(0.5);
    }

    const spawn = tileToWorld(this.plan.spawn.tx, this.plan.spawn.ty);
    this.charKey = ensureCharacter(this, this.peer.appearance);
    this.player = this.add.sprite(
      spawn.x + TILE / 2, spawn.y + TILE / 2, this.charKey, 3 * FRAMES_PER_DIR,
    ).setOrigin(0.5, 0.66).setDepth(10);
    this.facing = 3; // 문으로 들어와 위를 보는 상태

    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    const cam = this.cameras.main;
    cam.setZoom(window.innerWidth < 700 ? 1.3 : ZOOM);
    cam.centerOn((w * TILE) / 2, (h * TILE) / 2);

    // 월세 청구 (온라인·월세 계약 시 서울 자정 경과분 자동 납부)
    if (this.sb && this.isOwner && this.dealType === 'wolse') {
      void chargeRent(this.sb, this.roomId).then((due) => {
        if (due && due > 0) this.showRentNotice(due);
      });
    }

    if (isTouchDevice()) {
      this.touch = new TouchControls([
        { emoji: '🔄', label: '가구 회전', onTap: () => this.rotateGhost() },
        { emoji: '↩️', label: '선택 해제', onTap: () => this.inv?.clearSelection() },
      ]);
    }

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    kb.on('keydown-R', () => this.rotateGhost());
    kb.on('keydown-ESC', () => this.inv?.clearSelection());

    this.hint = document.createElement('div');
    this.hint.className = 'hv-hint';
    const label = HOUSE_SPECS[this.houseType].label + (this.dealType ? ` · ${DEAL_LABEL[this.dealType]}` : '');
    this.hint.textContent = this.isOwner
      ? `${label} · 가구 선택→클릭 배치 · R 회전 · 배치물 클릭 제거 · 문으로 나가기`
      : `${label} (구경 모드) · 문으로 나가기`;
    document.body.appendChild(this.hint);

    void this.loadRoom();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
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

    // 방향·걷기 애니메이션
    if (input.down) this.facing = 0;
    else if (input.right) this.facing = 1;
    else if (input.left) this.facing = 2;
    else if (input.up) this.facing = 3;
    const moving = input.up || input.down || input.left || input.right;
    const animKey = `${this.charKey}-walk-${this.facing}`;
    if (moving) {
      if (this.player.anims.currentAnim?.key !== animKey || !this.player.anims.isPlaying) {
        this.player.play(animKey);
      }
    } else if (this.player.anims.isPlaying) {
      this.player.stop();
      this.player.setFrame(this.facing * FRAMES_PER_DIR);
    }

    // 문 타일에 서면 거리로 퇴장 — 들어온 집 문 앞으로 복귀
    const { tx, ty } = worldToTile(next.x, next.y);
    if (tx === this.plan.door.tx && ty === this.plan.door.ty) {
      const door = HOUSE_DOORS.find((d) => d.roomId === this.roomId);
      const spawnTile = door ? { tx: door.tx, ty: door.ty + 1 } : undefined;
      this.scene.start('street', { peer: this.peer, adapter: this.adapter, spawnTile });
    }
  }

  private showRentNotice(due: number): void {
    const el = document.createElement('div');
    el.className = 'hv-hint';
    el.style.cssText = 'top:70px;bottom:auto;left:50%;transform:translateX(-50%);color:#e88a6a;opacity:1';
    el.textContent = `⚠️ 월세 미납 ${due.toLocaleString()}코인 — 부동산에서 납부하세요`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  // --- 데이터 ---

  private async loadRoom(): Promise<void> {
    if (this.sb) {
      this.placed = await fetchPlacements(this.sb, this.roomId);
      this.redrawPlacements();
      this.unsubscribe = subscribePlacements(this.sb, this.roomId, () => void this.refresh());
      if (this.isOwner) {
        // 시작 세트가 확장되면 기존 유저도 부족분을 받는다 (없는 아이템만 채움)
        await grantStarterOnce(this.sb, this.peer.userId);
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

  private redrawPlacements(): void {
    for (const c of this.placedGfx.values()) c.destroy();
    this.placedGfx.clear();
    for (const p of this.placed) this.drawPlaced(p);
  }

  private drawPlaced(p: Placed): void {
    if (!CATALOG_BY_ID.has(p.itemId)) return;
    const key = ensureFurniture(this, p.itemId, p.rot);
    const w = tileToWorld(p.tx, p.ty);
    const layer = layerOf(p.itemId);
    // 러그(4)는 가구(5) 밑에, 벽걸이(6)는 벽지 위로 올려 그린다
    const yOff = layer === 'wall' ? -22 : 0;
    const depth = layer === 'rug' ? 4 : layer === 'wall' ? 6 : 5;
    const img = this.add.image(w.x, w.y + yOff, key).setOrigin(0).setDepth(depth);
    this.placedGfx.set(p.id, img);
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
    const ok = canPlace(this.placed, itemId, this.ghostTile.tx, this.ghostTile.ty, this.ghostRot, this.region);
    const w = tileToWorld(this.ghostTile.tx, this.ghostTile.ty);
    const yOff = layerOf(itemId) === 'wall' ? -22 : 0;
    this.ghost.setPosition(w.x, w.y + yOff)
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
    // 벽걸이는 벽 행에 자석처럼 붙는다
    const itemId = this.inv?.selected;
    if (itemId && layerOf(itemId) === 'wall') this.ghostTile = { tx: this.ghostTile.tx, ty: this.region.wallRow };
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
    // 벽걸이는 벽지 위(한 칸 위)에 그려지므로 그 위치 클릭도 인정
    const hit = this.placed.find((pl) =>
      footprint(pl).some((f) =>
        (f.tx === t.tx && f.ty === t.ty) ||
        (layerOf(pl.itemId) === 'wall' && f.tx === t.tx && f.ty === t.ty + 1),
      ));
    if (hit) void this.removePlaced(hit);
  }

  private async tryPlace(itemId: string): Promise<void> {
    const { tx, ty } = this.ghostTile;
    const rot = this.ghostRot;
    if ((this.counts.get(itemId) ?? 0) <= 0) return;
    if (!canPlace(this.placed, itemId, tx, ty, rot, this.region)) return;

    // 오늘의 인테리어 퀘스트 진행 (지속 저장 + HUD 하트 갱신, P2-3)
    const quests = this.registry.get('quests') as QuestStore | undefined;
    quests?.bump('q_place');
    const hud = this.registry.get('hud') as GameHud | undefined;
    if (quests && hud) hud.setHearts(quests.doneCount(), DAILY_QUESTS.length);

    // 낙관적 반영 → 서버 실패 시 롤백 (스펙 §7)
    const localId = `local-${++this.localSeq}`;
    const optimistic: Placed = { id: localId, itemId, tx, ty, rot };
    this.placed.push(optimistic);
    this.drawPlaced(optimistic);
    this.counts.set(itemId, (this.counts.get(itemId) ?? 0) - 1);
    this.inv?.setCounts(this.counts);
    this.updateGhost();

    if (!this.sb) return; // 오프라인: 로컬 유지
    // 서버가 소유·수량·좌표 검증 + 인벤 차감까지 원자 처리 (0007 place_item)
    const realId = await insertPlacement(this.sb, this.roomId, this.peer.userId, { itemId, tx, ty, rot });
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
  }

  private async removePlaced(p: Placed): Promise<void> {
    this.placed = this.placed.filter((pl) => pl.id !== p.id);
    this.placedGfx.get(p.id)?.destroy();
    this.placedGfx.delete(p.id);
    this.counts.set(p.itemId, (this.counts.get(p.itemId) ?? 0) + 1);
    this.inv?.setCounts(this.counts);

    if (!this.sb || p.id.startsWith('local-')) return;
    // 서버가 삭제 + 인벤 복귀 원자 처리 (0007 pickup_item)
    const ok = await deletePlacement(this.sb, p.id, this.peer.userId, p.itemId);
    if (!ok) void this.refresh(); // 실패 시 서버 상태로 복원
  }

  private teardown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.touch?.destroy();
    this.touch = null;
    this.inv?.destroy();
    this.inv = null;
    this.ghost = null;
    this.hint?.remove();
    this.hint = null;
  }
}
