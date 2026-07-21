import type Phaser from 'phaser';
import { TILE } from '../config';
import { ROOM_W, ROOM_H, ROOM_DOOR } from '../world/roomMap';
import { PAL, ROOM_PAL } from './palette';
import { CATALOG_BY_ID, type ItemDef } from '../../items/catalog';
import { makeTexture, seeded } from './pixelCanvas';

const T = TILE;

/** 방 배경(바닥·벽지·문) 텍스처 1장 */
export function makeRoomBackground(scene: Phaser.Scene): string {
  const key = 'room-bg';
  makeTexture(scene, key, ROOM_W * T, ROOM_H * T, (d) => {
    const rnd = seeded(9);
    // 원목 마루
    for (let ty = 0; ty < ROOM_H; ty++) {
      for (let tx = 0; tx < ROOM_W; tx++) {
        const x = tx * T, y = ty * T;
        d.rect(x, y, T, T, (tx + ty) % 2 ? ROOM_PAL.floorWood1 : ROOM_PAL.floorWood2);
        d.rect(x, y + T - 1, T, 1, ROOM_PAL.floorSeam, 0.5);
        if (tx % 2 === 0) d.rect(x, y, 1, T, ROOM_PAL.floorSeam, 0.35);
        d.speckle(x, y, T, T, ROOM_PAL.floorSeam, 0.015, rnd, 0.6);
      }
    }
    // 벽지 (상단 1타일 + 좌우·하단 테두리)
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
    // 창문 (상단 벽)
    for (const wx of [3, 8]) {
      d.rect(wx * T + 4, 6, 24, 20, PAL.winFrame);
      d.rect(wx * T + 6, 8, 20, 16, PAL.winGlassDay);
      d.rect(wx * T + 6, 15, 20, 1, PAL.winFrame);
      d.rect(wx * T + 15, 8, 1, 16, PAL.winFrame);
    }
    // 문 (하단 중앙)
    const dx = ROOM_DOOR.tx * T, dy = ROOM_DOOR.ty * T;
    d.rect(dx + 2, dy, T - 4, T, PAL.doorDark);
    d.rect(dx + 4, dy + 2, T - 8, T - 2, PAL.doorWood);
    d.rect(dx + T - 10, dy + T / 2, 3, 3, PAL.signText);
  });
  return key;
}

/** 가구 텍스처 (아이템별, 회전 0 기준 — 회전은 스프라이트에서 처리하지 않고 rot 1 전용 텍스처 생성) */
export function ensureFurniture(scene: Phaser.Scene, itemId: string, rot: 0 | 1): string {
  const def = CATALOG_BY_ID.get(itemId);
  const key = `furn-${itemId}-${rot}`;
  if (!def) return key;
  const w = (rot === 0 ? def.w : def.h) * T;
  const h = (rot === 0 ? def.h : def.w) * T;
  makeTexture(scene, key, w, h, (d) => {
    const rnd = seeded(hashCode(itemId) + rot);
    const base = parseInt(def.color, 16);
    const dark = shade(base, 0.75);
    const light = shade(base, 1.18);

    const body = (inset: number) => {
      d.rect(inset, inset, w - inset * 2, h - inset * 2, base);
      d.rect(inset, inset, w - inset * 2, 3, light);           // 윗면 하이라이트
      d.rect(inset, h - inset - 3, w - inset * 2, 3, dark);    // 아랫면 그림자
      outline(inset);
    };
    const outline = (inset: number) => {
      d.rect(inset, inset, w - inset * 2, 1, PAL.outline, 0.35);
      d.rect(inset, h - inset - 1, w - inset * 2, 1, PAL.outline, 0.5);
      d.rect(inset, inset, 1, h - inset * 2, PAL.outline, 0.35);
      d.rect(w - inset - 1, inset, 1, h - inset * 2, PAL.outline, 0.35);
    };

    switch (def.id) {
      case 'bed_basic':
        body(1);
        d.rect(3, 3, w - 6, 10, 0xf2ead8);                       // 베개
        d.rect(2, 14, w - 4, h - 16, shade(base, 0.92));         // 이불
        for (let y = 16; y < h - 4; y += 6) d.rect(2, y, w - 4, 1, dark, 0.5);
        break;
      case 'rug_cream':
        d.rect(0, 0, w, h, base);
        d.rect(2, 2, w - 4, h - 4, light, 0.5);
        d.rect(5, 5, w - 10, h - 10, base);
        d.rect(8, 8, w - 16, h - 16, dark, 0.35);
        d.speckle(0, 0, w, h, dark, 0.01, rnd, 0.5);
        break;
      case 'plant_pot':
        d.rect(10, 18, 12, 10, 0xb0685a);                        // 화분
        d.rect(11, 26, 10, 2, shade(0xb0685a, 0.7));
        d.rect(8, 4, 16, 14, PAL.grassDark);                     // 잎
        d.speckle(8, 4, 16, 14, PAL.grass1, 0.2, rnd);
        d.rect(14, 12, 3, 7, shade(PAL.grassDark, 0.8));
        break;
      case 'bookshelf':
        body(1);
        for (let s = 0; s < 3; s++) {
          const sy = 6 + s * 18;
          d.rect(4, sy, w - 8, 12, 0x2e2620);
          let bx = 5;
          while (bx < w - 9) {
            const bw = 3 + Math.floor(rnd() * 3);
            d.rect(bx, sy + 2, bw, 10, [0xd88a7c, 0x8ab8a8, 0xd8b86e, 0xa8c8e0][Math.floor(rnd() * 4)]!);
            bx += bw + 1;
          }
        }
        break;
      case 'lamp_stand':
        d.rect(14, 12, 4, 16, PAL.signBg);
        d.rect(12, 26, 8, 3, PAL.signBg);
        d.rect(8, 2, 16, 12, base);
        d.rect(9, 3, 14, 3, 0xfff4d8, 0.8);
        break;
      case 'fish_tank':
        d.rect(2, 6, w - 4, h - 10, 0x3a5c66);
        d.rect(3, 7, w - 6, h - 12, base, 0.9);
        d.rect(8, 14, 4, 3, 0xf2a05c);                            // 물고기
        d.rect(20, 18, 4, 3, 0xe8d06e);
        d.rect(2, 6, w - 4, 2, 0xf2ead8, 0.5);
        d.rect(2, h - 6, w - 4, 4, PAL.signBg);
        break;
      case 'guitar':
        d.rect(13, 2, 5, 14, PAL.doorDark);                      // 넥
        d.rect(9, 14, 14, 14, base);                             // 바디
        d.rect(11, 16, 10, 10, shade(base, 0.85));
        d.rect(14, 18, 4, 4, 0x2e2620);                          // 사운드홀
        break;
      case 'cat_tower':
        d.rect(6, 4, 20, 10, base);                              // 상단 하우스
        d.rect(10, 6, 8, 6, 0x2e2620);
        d.rect(13, 16, 6, 34, shade(base, 0.8));                 // 기둥
        d.rect(4, 50, 24, 10, base);                             // 받침
        d.rect(20, 8, 6, 4, 0x5c5650);                           // 고양이 귀?!
        break;
      default:
        body(2);
        if (def.category === 'furniture') {
          d.rect(4, 6, w - 8, 2, dark, 0.4);                     // 디테일 라인
        } else {
          d.rect(w / 2 - 3, h / 2 - 3, 6, 6, light);
        }
    }
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

export type { ItemDef };
