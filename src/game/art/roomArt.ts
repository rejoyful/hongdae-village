import type Phaser from 'phaser';
import { TILE } from '../config';
import { ROOM_W, ROOM_H, ROOM_DOOR } from '../world/roomMap';
import { PAL, ROOM_PAL } from './palette';
import { CATALOG_BY_ID } from '../../items/catalog';
import { makeTexture, seeded, type Px } from './pixelCanvas';
import { furnitureAssetKey } from './assetManifest';
import type { FloorPlan } from '../realestate/realEstate';
import type { Rot } from '../entities/placement';
import { furniturePlacementMeta, sourceRotation } from '../home/furniturePlacementMeta';

const T = TILE;

/** 부동산 평면 기반 방 배경 — 가변 크기 + 내부 칸막이 + 창문·문 (유형별 구조) */
export function makeRoomBackgroundPlan(scene: Phaser.Scene, plan: FloorPlan, seed: number): string {
  const key = `room-diorama-bg-v2-${plan.w}x${plan.h}-${seed}`;
  if (scene.textures.exists(key)) return key;
  const W = plan.w * T, H = plan.h * T;
  makeTexture(scene, key, W, H, (d) => {
    const rnd = seeded(seed + 9);
    // 바닥 마루
    for (let ty = 0; ty < plan.h; ty++) {
      for (let tx = 0; tx < plan.w; tx++) {
        const x = tx * T, y = ty * T;
        d.rect(x, y, T, T, (tx + ty) % 2 ? ROOM_PAL.floorWood1 : ROOM_PAL.floorWood2);
        d.rect(x, y + T - 1, T, 1, ROOM_PAL.floorSeam, 0.5);
        if (tx % 2 === 0) d.rect(x, y, 1, T, ROOM_PAL.floorSeam, 0.35);
        d.speckle(x, y, T, T, ROOM_PAL.floorSeam, 0.015, rnd, 0.6);
      }
    }
    const wallRect = (x: number, y: number, w: number, h: number) => {
      d.rect(x, y, w, h, ROOM_PAL.wallPaper);
      for (let i = 0; i < w; i += 8) d.rect(x + i, y, 1, h, ROOM_PAL.wallPaperShade, 0.4);
      d.rect(x, y, w, 4, ROOM_PAL.wallBase, 0.72);
      d.rect(x + 2, y + 4, Math.max(0, w - 4), 2, ROOM_PAL.wallPaperShade, 0.55);
      d.rect(x, y + h - 3, w, 3, ROOM_PAL.wallBase);
    };
    // 테두리 벽
    wallRect(0, 0, W, T);
    d.rect(0, 0, T, H, ROOM_PAL.wallPaper); d.rect(T - 3, 0, 3, H, ROOM_PAL.wallBase);
    d.rect(W - T, 0, T, H, ROOM_PAL.wallPaper); d.rect(W - T, 0, 3, H, ROOM_PAL.wallBase);
    d.rect(0, H - T, W, T, ROOM_PAL.wallPaper); d.rect(0, H - T, W, 3, ROOM_PAL.wallBase);
    // 창문 (상단 벽, 크기에 비례)
    for (let wx = 2; wx < plan.w - 2; wx += 3) {
      d.rect(wx * T + 4, 6, 24, 20, PAL.winFrame);
      d.rect(wx * T + 6, 8, 20, 16, PAL.winGlassDay);
      d.rect(wx * T + 6, 15, 20, 1, PAL.winFrame);
      d.rect(wx * T + 15, 8, 1, 16, PAL.winFrame);
    }
    // 내부 칸막이 (문 통로 제외)
    const isGap = (tx: number, ty: number) => plan.doorGaps.some((g) => g.tx === tx && g.ty === ty);
    for (const wl of plan.walls) {
      for (let ty = wl.y; ty < wl.y + wl.h; ty++) {
        for (let tx = wl.x; tx < wl.x + wl.w; tx++) {
          if (isGap(tx, ty)) continue;
          d.rect(tx * T, ty * T, T, T, ROOM_PAL.wallPaper);
          d.rect(tx * T, ty * T, T, 3, ROOM_PAL.wallBase);
          d.rect(tx * T, ty * T + T - 3, T, 3, ROOM_PAL.wallBase);
        }
      }
    }
    // 현관문 (하단 중앙)
    const dx = plan.door.tx * T, dy = plan.door.ty * T;
    d.rect(dx + 2, dy, T - 4, T, PAL.doorDark);
    d.rect(dx + 4, dy + 2, T - 8, T - 2, PAL.doorWood);
    d.rect(dx + T - 10, dy + T / 2, 3, 3, PAL.signText);
    // 열린 인형집처럼 읽히는 안쪽 모서리와 얕은 벽 그림자
    d.rect(T, T, W - T * 2, 3, PAL.shadow, 0.22);
    d.rect(T, T, 3, H - T * 2, PAL.shadow, 0.16);
    d.rect(W - T - 3, T, 3, H - T * 2, PAL.shadow, 0.24);
  });
  return key;
}

/** 남쪽 벽의 높이 면. 캐릭터가 현관에 다가가면 RoomScene에서 부드럽게 투명해진다. */
export function makeRoomForegroundPlan(scene: Phaser.Scene, plan: FloorPlan, seed: number): string {
  const key = `room-diorama-front-v1-${plan.w}x${plan.h}-${seed}`;
  if (scene.textures.exists(key)) return key;
  const W = plan.w * T; const H = T + 6;
  makeTexture(scene, key, W, H, (d) => {
    for (let tx = 0; tx < plan.w; tx += 1) {
      if (tx === plan.door.tx) continue;
      const x = tx * T;
      d.rect(x, 0, T, 6, ROOM_PAL.wallBase);
      d.rect(x + 2, 1, T - 4, 2, ROOM_PAL.wallPaperShade, .8);
      d.rect(x, 6, T, T, ROOM_PAL.wallPaper);
      d.rect(x, 6, 1, T, ROOM_PAL.wallPaperShade, .55);
      d.rect(x, T + 2, T, 4, ROOM_PAL.wallBase);
    }
    const left = plan.door.tx * T;
    d.rect(left - 3, 3, 3, H - 3, PAL.doorDark);
    d.rect(left + T, 3, 3, H - 3, PAL.doorDark);
  });
  return key;
}

/** 방 배경(바닥·벽지·문) 텍스처 1장 */
export function makeRoomBackground(scene: Phaser.Scene): string {
  const key = 'room-bg';
  makeTexture(scene, key, ROOM_W * T, ROOM_H * T, (d) => {
    const rnd = seeded(9);
    // 바닥: AI 재질이 로드돼 있으면 타일링, 없으면 프로시저럴 마루
    const floorTex = scene.textures.exists('room-floor-ai')
      ? (scene.textures.get('room-floor-ai').getSourceImage() as HTMLImageElement | HTMLCanvasElement)
      : null;
    if (floorTex) {
      for (let y = 0; y < ROOM_H * T; y += floorTex.height) {
        for (let x = 0; x < ROOM_W * T; x += floorTex.width) {
          d.ctx.drawImage(floorTex, x, y);
        }
      }
    } else {
      for (let ty = 0; ty < ROOM_H; ty++) {
        for (let tx = 0; tx < ROOM_W; tx++) {
          const x = tx * T, y = ty * T;
          d.rect(x, y, T, T, (tx + ty) % 2 ? ROOM_PAL.floorWood1 : ROOM_PAL.floorWood2);
          d.rect(x, y + T - 1, T, 1, ROOM_PAL.floorSeam, 0.5);
          if (tx % 2 === 0) d.rect(x, y, 1, T, ROOM_PAL.floorSeam, 0.35);
          d.speckle(x, y, T, T, ROOM_PAL.floorSeam, 0.015, rnd, 0.6);
        }
      }
    }
    const wall = (x: number, y: number, w: number, h: number) => {
      d.rect(x, y, w, h, ROOM_PAL.wallPaper);
      for (let i = 0; i < w; i += 8) d.rect(x + i, y, 1, h, ROOM_PAL.wallPaperShade, 0.5);
      d.rect(x, y + h - 3, w, 3, ROOM_PAL.wallBase);
    };
    wall(0, 0, ROOM_W * T, T);
    d.rect(0, 0, T, ROOM_H * T, ROOM_PAL.wallPaper);
    d.rect(T - 3, 0, 3, ROOM_H * T, ROOM_PAL.wallBase);
    d.rect((ROOM_W - 1) * T, 0, T, ROOM_H * T, ROOM_PAL.wallPaper);
    d.rect((ROOM_W - 1) * T, 0, 3, ROOM_H * T, ROOM_PAL.wallBase);
    d.rect(0, (ROOM_H - 1) * T, ROOM_W * T, T, ROOM_PAL.wallPaper);
    d.rect(0, (ROOM_H - 1) * T, ROOM_W * T, 3, ROOM_PAL.wallBase);
    for (const wx of [3, 8]) {
      d.rect(wx * T + 4, 6, 24, 20, PAL.winFrame);
      d.rect(wx * T + 6, 8, 20, 16, PAL.winGlassDay);
      d.rect(wx * T + 6, 15, 20, 1, PAL.winFrame);
      d.rect(wx * T + 15, 8, 1, 16, PAL.winFrame);
    }
    const dx = ROOM_DOOR.tx * T, dy = ROOM_DOOR.ty * T;
    d.rect(dx + 2, dy, T - 4, T, PAL.doorDark);
    d.rect(dx + 4, dy + 2, T - 8, T - 2, PAL.doorWood);
    d.rect(dx + T - 10, dy + T / 2, 3, 3, PAL.signText);
  });
  return key;
}

function shade(color: number, f: number): number {
  const c = (v: number) => Math.max(0, Math.min(255, Math.floor(v * f)));
  return (c((color >> 16) & 0xff) << 16) | (c((color >> 8) & 0xff) << 8) | c(color & 0xff);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface Ctx {
  d: Px; w: number; h: number;
  base: number; dark: number; light: number; accent: number;
  rnd: () => number;
}

/** 공통: 몸체 + 윗면 하이라이트 + 그림자 + 외곽선 */
function body(c: Ctx, inset = 1): void {
  const { d, w, h } = c;
  d.rect(inset, inset, w - inset * 2, h - inset * 2, c.base);
  d.rect(inset + 1, inset + 1, w - inset * 2 - 2, 3, c.light);
  d.rect(inset + 1, h - inset - 4, w - inset * 2 - 2, 3, c.dark);
  edge(c, inset);
}
function edge(c: Ctx, inset = 1): void {
  const { d, w, h } = c;
  d.rect(inset, inset, w - inset * 2, 1, PAL.outline, 0.45);
  d.rect(inset, h - inset - 1, w - inset * 2, 1, PAL.outline, 0.6);
  d.rect(inset, inset, 1, h - inset * 2, PAL.outline, 0.45);
  d.rect(w - inset - 1, inset, 1, h - inset * 2, PAL.outline, 0.45);
}
/** 바닥 접지 그림자 */
function ground(c: Ctx): void {
  c.d.rect(2, c.h - 3, c.w - 4, 3, PAL.shadow);
}

const DRAWERS: Record<string, (c: Ctx) => void> = {
  bed(c) {
    const { d, w, h } = c;
    ground(c); body(c, 1);
    d.rect(3, 3, w - 6, 11, c.accent);                       // 베개 영역
    d.rect(5, 5, Math.floor(w / 2) - 6, 7, shade(c.accent, 0.9));
    d.rect(Math.floor(w / 2) + 2, 5, Math.floor(w / 2) - 6, 7, shade(c.accent, 0.9));
    d.rect(2, 15, w - 4, h - 18, shade(c.base, 0.94));       // 이불
    d.rect(2, 15, w - 4, 3, shade(c.base, 0.8));             // 이불 접힘
    for (let y = 21; y < h - 5; y += 7) d.rect(4, y, w - 8, 1, c.dark, 0.4);
    d.rect(2, h - 5, w - 4, 2, shade(c.base, 0.7));          // 프레임
  },
  table(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(1, 1, w - 2, h - 4, c.base);
    d.rect(2, 2, w - 4, 3, c.light);
    d.rect(1, h - 6, w - 2, 3, c.dark);                      // 상판 두께
    d.rect(3, h - 3, 3, 2, c.dark); d.rect(w - 6, h - 3, 3, 2, c.dark); // 다리
    edge(c, 1);
    d.speckle(2, 4, w - 4, h - 10, c.dark, 0.02, c.rnd, 0.5); // 나뭇결
  },
  seat(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(4, 2, w - 8, 8, c.dark);                          // 등받이
    d.rect(5, 3, w - 10, 6, c.base);
    d.rect(3, 10, w - 6, h - 15, c.base);                    // 방석면
    d.rect(4, 11, w - 8, 2, c.light);
    d.rect(4, h - 5, 2, 3, c.dark); d.rect(w - 6, h - 5, 2, 3, c.dark);
    edge(c, 2);
  },
  sofa(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(1, 2, w - 2, 9, shade(c.base, 0.85));             // 등받이
    d.rect(2, 3, w - 4, 6, c.base);
    d.rect(1, 10, w - 2, h - 14, c.base);                    // 좌면
    const seats = Math.max(1, Math.floor(c.w / T));
    for (let s = 1; s < seats; s++) d.rect(Math.floor((w / seats) * s), 10, 1, h - 14, c.dark, 0.6);
    d.rect(2, 11, w - 4, 2, c.light);
    d.rect(0, 6, 4, h - 9, shade(c.base, 0.8));              // 팔걸이
    d.rect(w - 4, 6, 4, h - 9, shade(c.base, 0.8));
    edge(c, 0);
  },
  shelf(c) {
    const { d, w, h } = c;
    ground(c); body(c, 1);
    const rows = Math.max(2, Math.floor(h / 20));
    for (let s = 0; s < rows; s++) {
      const sy = 5 + s * ((h - 10) / rows);
      d.rect(4, sy, w - 8, (h - 14) / rows, 0x2e2620);
      let bx = 5;
      while (bx < w - 10) {
        const bw = 3 + Math.floor(c.rnd() * 4);
        const cols = [0xd88a7c, 0x8ab8a8, 0xd8b86e, 0xa8c8e0, 0xc8a8d8];
        if (c.rnd() < 0.85) d.rect(bx, sy + 2, bw, (h - 14) / rows - 4, cols[Math.floor(c.rnd() * cols.length)]!);
        bx += bw + 1;
      }
    }
  },
  wardrobe(c) {
    const { d, w, h } = c;
    ground(c); body(c, 1);
    d.rect(Math.floor(w / 2), 3, 1, h - 6, c.dark);          // 문 분할
    d.rect(Math.floor(w / 2) - 4, Math.floor(h / 2), 2, 5, PAL.signText); // 손잡이
    d.rect(Math.floor(w / 2) + 3, Math.floor(h / 2), 2, 5, PAL.signText);
    d.rect(3, 4, Math.floor(w / 2) - 5, 2, c.light);
  },
  mirror(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(2, h - 8, w - 4, 5, c.base);                      // 받침/서랍
    d.rect(Math.floor(w / 2) - 8, 2, 16, h - 12, PAL.winFrame);
    d.rect(Math.floor(w / 2) - 6, 4, 12, h - 16, 0xcfe0e4);
    d.rect(Math.floor(w / 2) - 5, 5, 3, h - 18, 0xffffff, 0.6); // 반사광
    edge(c, 1);
  },
  hanger(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(2, 2, 2, h - 4, c.base); d.rect(w - 4, 2, 2, h - 4, c.base);
    d.rect(2, 2, w - 4, 2, c.base);                           // 봉
    const cols = [0xd88a7c, 0x8ab8a8, 0x6a7a8a, 0xe8d5a8];
    for (let i = 0; i < Math.floor(w / 10); i++) {
      const cx = 6 + i * 9;
      d.rect(cx, 4, 1, 3, c.dark);
      d.rect(cx - 2, 7, 6, 10 + Math.floor(c.rnd() * 5), cols[i % cols.length]!);
    }
  },
  counter(c) {
    const { d, w, h } = c;
    ground(c); body(c, 1);
    d.rect(2, 2, w - 4, 4, 0xd8dce0);                        // 상판
    if (c.base === 0xb8c0c4 || c.accent === 0xb8c0c4) { /* noop */ }
    d.rect(Math.floor(w / 2) - 6, 4, 12, 8, 0x8a9298);       // 개수대/화구
    d.rect(4, Math.floor(h / 2) + 2, w - 8, 1, c.dark);
    d.rect(6, Math.floor(h / 2) + 5, 3, 4, PAL.signText);
  },
  screen(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(1, h - 8, w - 2, 6, c.base);                      // 스탠드/장
    d.rect(Math.floor(w * 0.15), 2, Math.floor(w * 0.7), h - 12, 0x1e2126); // 화면
    d.rect(Math.floor(w * 0.15) + 2, 4, Math.floor(w * 0.7) - 4, h - 16, c.accent, 0.35);
    d.rect(Math.floor(w * 0.15) + 3, 5, 8, 3, 0xffffff, 0.25); // 화면 반사
    edge(c, 1);
  },
  appliance(c) {
    const { d, w, h } = c;
    ground(c); body(c, 2);
    d.rect(Math.floor(w / 2) - 7, Math.floor(h / 2) - 7, 14, 14, c.accent, 0.9); // 도어/패널
    d.rect(Math.floor(w / 2) - 5, Math.floor(h / 2) - 5, 10, 10, shade(c.accent, 0.8));
    d.rect(4, 4, w - 8, 2, c.light);
  },
  lamp(c) {
    const { d, w, h } = c;
    d.rect(Math.floor(w / 2) - 2, 12, 4, h - 16, PAL.signBg);
    d.rect(Math.floor(w / 2) - 5, h - 5, 10, 3, PAL.signBg);
    d.rect(Math.floor(w / 2) - 8, 2, 16, 11, c.base);        // 갓
    d.rect(Math.floor(w / 2) - 7, 3, 14, 3, 0xfff4d8, 0.85); // 빛
    d.rect(Math.floor(w / 2) - 10, 13, 20, 2, 0xfff4d8, 0.25);
  },
  plant(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(Math.floor(w / 2) - 6, h - 13, 12, 9, 0xb0685a);
    d.rect(Math.floor(w / 2) - 5, h - 5, 10, 2, shade(0xb0685a, 0.7));
    d.rect(Math.floor(w / 2) - 8, 4, 16, 14, c.base);
    d.speckle(Math.floor(w / 2) - 8, 4, 16, 14, shade(c.base, 1.25), 0.22, c.rnd);
    d.speckle(Math.floor(w / 2) - 8, 4, 16, 14, shade(c.base, 0.7), 0.15, c.rnd);
    d.rect(Math.floor(w / 2) - 1, 12, 2, h - 24, shade(c.base, 0.6));
    if (c.accent !== c.base) d.rect(Math.floor(w / 2) - 2, 3, 4, 4, c.accent); // 꽃/포인트
  },
  vase(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(Math.floor(w / 2) - 4, h - 14, 8, 10, c.base);
    d.rect(Math.floor(w / 2) - 3, h - 13, 2, 8, shade(c.base, 1.2));
    d.rect(Math.floor(w / 2) - 1, h - 20, 2, 7, PAL.grassDark);
    d.rect(Math.floor(w / 2) - 5, h - 24, 4, 4, c.accent);
    d.rect(Math.floor(w / 2) + 1, h - 26, 4, 4, shade(c.accent, 1.15));
    d.rect(Math.floor(w / 2) - 2, h - 27, 4, 4, 0xf0e0c8);
  },
  garden(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(1, h - 12, w - 2, 9, 0x8a6f52);                   // 화단
    d.rect(2, h - 11, w - 4, 2, shade(0x8a6f52, 1.2));
    for (let i = 0; i < Math.floor(w / 8); i++) {
      const px2 = 4 + i * 8;
      d.rect(px2, h - 20 - (i % 3) * 2, 5, 9 + (i % 3) * 2, c.base);
      d.speckle(px2, h - 20 - (i % 3) * 2, 5, 9, shade(c.base, 1.3), 0.25, c.rnd);
      if (c.accent !== c.base && i % 2 === 0) d.rect(px2 + 1, h - 22 - (i % 3) * 2, 3, 3, c.accent);
    }
  },
  rug(c) {
    const { d, w, h } = c;
    d.rect(0, 0, w, h, c.base);
    d.rect(1, 1, w - 2, h - 2, shade(c.base, 1.1), 0.5);
    d.rect(4, 4, w - 8, h - 8, c.base);
    if (c.accent !== c.base) {
      for (let y = 4; y < h - 4; y += 8) for (let x = 4; x < w - 4; x += 8) {
        if ((x + y) % 16 === 8) d.rect(x, y, 8, 8, c.accent, 0.6); // 체크
      }
    } else {
      d.rect(7, 7, w - 14, h - 14, shade(c.base, 0.85), 0.6);
    }
    d.speckle(0, 0, w, h, shade(c.base, 0.8), 0.012, c.rnd, 0.5);
    edge(c, 0);
  },
  tank(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(2, h - 8, w - 4, 5, PAL.signBg);
    d.rect(2, 4, w - 4, h - 12, 0x3a5c66);
    d.rect(3, 5, w - 6, h - 14, c.base, 0.92);
    d.rect(3, 5, w - 6, 2, 0xf2ead8, 0.5);                    // 수면
    d.rect(7, 12, 5, 3, 0xf2a05c); d.rect(6, 13, 2, 1, 0xf2a05c); // 물고기
    d.rect(w - 12, 17, 5, 3, 0xe8d06e); d.rect(w - 7, 18, 2, 1, 0xe8d06e);
    d.rect(5, h - 10, 4, 4, PAL.grassDark);                   // 수초
    d.rect(w - 9, h - 12, 3, 6, PAL.grassDark);
  },
  instrument(c) {
    const { d, w, h } = c;
    ground(c);
    if (c.base === 0xb06858) {                                // 기타
      d.rect(Math.floor(w / 2) - 2, 2, 4, 14, PAL.doorDark);
      d.rect(Math.floor(w / 2) - 3, 3, 6, 2, 0xe8d06e);
      d.rect(Math.floor(w / 2) - 7, 14, 14, 14, c.base);
      d.rect(Math.floor(w / 2) - 5, 16, 10, 10, shade(c.base, 0.85));
      d.rect(Math.floor(w / 2) - 2, 18, 4, 4, 0x2e2620);
    } else if (c.accent && c.accent !== c.base) {             // 이젤
      d.rect(6, 4, w - 12, h - 14, c.accent);
      d.rect(7, 5, w - 14, h - 16, 0xffffff, 0.7);
      d.rect(9, 8, 8, 5, 0x8fa38a); d.rect(14, 14, 9, 6, 0xd88a7c);
      d.rect(4, h - 8, 3, 6, c.base); d.rect(w - 7, h - 8, 3, 6, c.base);
      d.rect(Math.floor(w / 2) - 1, h - 10, 2, 8, c.base);
    } else {                                                  // 마이크 스탠드
      d.rect(Math.floor(w / 2) - 1, 8, 2, h - 14, c.base);
      d.rect(Math.floor(w / 2) - 6, h - 6, 12, 3, c.base);
      d.rect(Math.floor(w / 2) - 3, 2, 6, 8, 0x2e2620);
      d.speckle(Math.floor(w / 2) - 3, 2, 6, 8, 0x6a6a72, 0.3, c.rnd);
    }
  },
  doll(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(Math.floor(w / 2) - 7, 12, 14, 13, c.base);        // 몸
    d.rect(Math.floor(w / 2) - 5, 4, 10, 9, c.base);          // 머리
    d.rect(Math.floor(w / 2) - 7, 2, 4, 4, c.base); d.rect(Math.floor(w / 2) + 3, 2, 4, 4, c.base); // 귀
    d.rect(Math.floor(w / 2) - 3, 7, 2, 2, 0x2e2620); d.rect(Math.floor(w / 2) + 1, 7, 2, 2, 0x2e2620);
    d.rect(Math.floor(w / 2) - 1, 9, 2, 2, shade(c.base, 0.6));
    d.rect(Math.floor(w / 2) - 4, 16, 8, 5, shade(c.base, 1.2)); // 배
    d.rect(Math.floor(w / 2) - 9, 14, 3, 7, c.base); d.rect(Math.floor(w / 2) + 6, 14, 3, 7, c.base); // 팔
  },
  cattower(c) {
    const { d, w, h } = c;
    ground(c);
    d.rect(4, h - 8, w - 8, 5, c.base);
    d.rect(Math.floor(w / 2) - 3, 16, 6, h - 24, shade(c.base, 0.8));
    for (let y = 18; y < h - 10; y += 4) d.rect(Math.floor(w / 2) - 3, y, 6, 1, shade(c.base, 0.65)); // 스크래처 감김
    d.rect(3, 4, w - 6, 12, c.base);                          // 하우스
    d.rect(Math.floor(w / 2) - 4, 7, 8, 7, 0x2e2620);         // 입구
    d.rect(5, 2, 5, 4, 0x5c5650); d.rect(w - 10, 2, 5, 4, 0x5c5650); // 고양이 귀
  },
  deco(c) {
    const { d, w, h } = c;
    ground(c);
    if (c.accent && c.accent !== c.base) {                    // LP상자·캔들 등 포인트 있는 소품
      body(c, 3);
      for (let i = 0; i < 4; i++) d.rect(6 + i * 5, 6, 4, h - 14, i % 2 ? c.accent : shade(c.accent, 0.8));
    } else {
      body(c, 4);
      d.rect(6, 8, w - 12, 2, c.dark, 0.5);
      d.rect(6, 13, w - 12, 2, c.dark, 0.4);
      d.rect(6, 18, w - 12, 2, c.dark, 0.3);
    }
  },
  wall(c) {
    const { d, w, h } = c;
    d.rect(1, 1, w - 2, h - 2, c.accent ?? PAL.outline);      // 프레임
    d.rect(3, 3, w - 6, h - 6, c.base);
    d.rect(4, 4, w - 8, 3, shade(c.base, 1.2));
    d.rect(Math.floor(w / 2) - 5, Math.floor(h / 2) - 3, 10, 6, shade(c.base, 0.75)); // 그림 실루엣
    d.rect(5, h - 8, w - 10, 2, shade(c.base, 0.7), 0.7);
  },
  wallneon(c) {
    const { d, w, h } = c;
    d.rect(0, 0, w, h, 0x1e2126, 0.65);                       // 밤배경 판
    d.rect(4, Math.floor(h / 2) - 4, w - 8, 8, c.base, 0.25); // 글로우
    d.rect(6, Math.floor(h / 2) - 2, w - 12, 4, c.base);      // 네온 튜브
    d.rect(8, Math.floor(h / 2) - 6, 3, 3, c.base, 0.8);
    d.rect(w - 12, Math.floor(h / 2) + 3, 3, 3, c.base, 0.8);
  },
  wallclock(c) {
    const { d, w, h } = c;
    const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
    d.rect(cx - 9, cy - 9, 18, 18, PAL.outline);
    d.rect(cx - 8, cy - 8, 16, 16, c.base);
    d.rect(cx - 1, cy - 6, 2, 6, 0x2e2620);                    // 시침
    d.rect(cx, cy, 5, 2, 0xb0685a);                            // 분침
    d.rect(cx - 1, cy - 1, 2, 2, 0x2e2620);
  },
  wallshelf(c) {
    const { d, w, h } = c;
    d.rect(2, h - 10, w - 4, 4, c.base);
    d.rect(2, h - 6, 3, 4, shade(c.base, 0.7)); d.rect(w - 5, h - 6, 3, 4, shade(c.base, 0.7));
    d.rect(6, h - 17, 5, 7, 0x8fa38a);                         // 미니 화분
    d.rect(14, h - 16, 4, 6, 0xd88a7c);                        // 책
    d.rect(19, h - 16, 4, 6, 0x8ab8a8);
    d.rect(w - 10, h - 15, 6, 5, 0xe8d06e);                    // 소품
  },
};

function ensureFurnitureSource(scene: Phaser.Scene, itemId: string, rot: 0 | 1): string {
  const aiKey = furnitureAssetKey(itemId, rot);
  if (scene.textures.exists(aiKey)) return aiKey;
  // 정사각형 아이템은 rot 1도 rot 0 텍스처 재사용
  const def0 = CATALOG_BY_ID.get(itemId);
  if (rot === 1 && def0 && def0.w === def0.h && scene.textures.exists(furnitureAssetKey(itemId, 0))) {
    return furnitureAssetKey(itemId, 0);
  }
  const def = def0;
  const key = `furn-${itemId}-${rot}`;
  if (scene.textures.exists(key)) return key;
  if (!def) return key;
  const wall = def.category === 'wall';
  const w = ((rot === 0 || wall) ? def.w : def.h) * T;
  const footprintH = ((rot === 0 || wall) ? def.h : def.w) * T;
  const h = footprintH + (furniturePlacementMeta(itemId)?.risePx ?? 0);
  makeTexture(scene, key, w, h, (d) => {
    const base = parseInt(def.color, 16);
    const c: Ctx = {
      d, w, h, base,
      dark: shade(base, 0.72), light: shade(base, 1.18),
      accent: def.accent ? parseInt(def.accent, 16) : base,
      rnd: seeded(hashCode(itemId) + rot),
    };
    (DRAWERS[def.arch] ?? DRAWERS.deco!)(c);
  });
  return key;
}

/** 가구 텍스처 — 기존 0/1 자산을 보존하고 2/3은 픽셀 좌우 반전으로 확장한다. */
export function ensureFurniture(scene: Phaser.Scene, itemId: string, rot: Rot): string {
  const direction = sourceRotation(rot);
  const sourceKey = ensureFurnitureSource(scene, itemId, direction.source);
  if (!direction.mirror || !scene.textures.exists(sourceKey)) return sourceKey;
  const key = `furn-${itemId}-${rot}`;
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(source, 0, 0);
  scene.textures.addCanvas(key, canvas);
  return key;
}
