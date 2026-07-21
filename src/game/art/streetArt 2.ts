import type Phaser from 'phaser';
import { TILE } from '../config';
import { ZONES, SOLID_RECTS, HOUSE_DOORS } from '../world/mapData';
import type { Rect } from '../world/grid';
import { PAL } from './palette';
import { makeTexture, seeded, type Px } from './pixelCanvas';

const T = TILE;

/** 존 이름 → 바닥 스타일 */
function zoneGround(name: string): 'grass' | 'street' | 'plaza' | 'alley' {
  if (name.includes('숲길')) return 'grass';
  if (name.includes('메인 스트리트')) return 'street';
  if (name.includes('출구')) return 'plaza';
  return 'alley';
}

function drawGroundTile(d: Px, style: string, rnd: () => number, ox: number, oy: number): void {
  switch (style) {
    case 'grass': {
      d.rect(ox, oy, T, T, rnd() < 0.5 ? PAL.grass1 : PAL.grass2);
      d.speckle(ox, oy, T, T, PAL.grassDark, 0.06, rnd);
      d.speckle(ox, oy, T, T, PAL.grass1, 0.04, rnd);
      break;
    }
    case 'street': {
      // 보도블럭
      d.rect(ox, oy, T, T, rnd() < 0.5 ? PAL.side1 : PAL.side2);
      d.rect(ox, oy + T - 1, T, 1, PAL.sideLine, 0.7);
      d.rect(ox + (rnd() < 0.5 ? 0 : T / 2), oy, 1, T, PAL.sideLine, 0.5);
      d.speckle(ox, oy, T, T, PAL.sideLine, 0.02, rnd);
      break;
    }
    case 'plaza': {
      d.rect(ox, oy, T, T, rnd() < 0.5 ? PAL.plaza1 : PAL.plaza2);
      d.rect(ox, oy + T - 1, T, 1, PAL.plazaLine, 0.6);
      d.rect(ox + T - 1, oy, 1, T, PAL.plazaLine, 0.4);
      d.speckle(ox, oy, T, T, PAL.plazaLine, 0.02, rnd);
      break;
    }
    default: { // alley
      d.rect(ox, oy, T, T, rnd() < 0.5 ? PAL.alley1 : PAL.alley2);
      d.speckle(ox, oy, T, T, PAL.roadLine, 0.008, rnd, 0.5);
      d.speckle(ox, oy, T, T, PAL.roofLine, 0.02, rnd, 0.4);
    }
  }
}

/** 거리 전체 바닥을 하나의 텍스처로 생성 (80×60타일 = 2560×1920px, 1회) */
export function makeStreetGround(scene: Phaser.Scene, mapW: number, mapH: number): string {
  const key = 'street-ground';
  makeTexture(scene, key, mapW * T, mapH * T, (d) => {
    const rnd = seeded(20260721);
    // 기본: 골목 톤
    for (let ty = 0; ty < mapH; ty++) {
      for (let tx = 0; tx < mapW; tx++) drawGroundTile(d, 'alley', rnd, tx * T, ty * T);
    }
    // 존별 덮어쓰기
    for (const z of ZONES) {
      const style = zoneGround(z.name);
      for (let ty = z.rect.y; ty < z.rect.y + z.rect.h; ty++) {
        for (let tx = z.rect.x; tx < z.rect.x + z.rect.w; tx++) {
          drawGroundTile(d, style, rnd, tx * T, ty * T);
        }
      }
      // 숲길: 산책로
      if (style === 'grass') {
        const py = (z.rect.y + Math.floor(z.rect.h / 2)) * T;
        d.rect(z.rect.x * T, py, z.rect.w * T, T, PAL.path);
        d.speckle(z.rect.x * T, py, z.rect.w * T, T, PAL.sideLine, 0.03, rnd);
      }
      // 메인 스트리트: 중앙 차도
      if (style === 'street') {
        const ry = (z.rect.y + Math.floor(z.rect.h / 2) - 1) * T;
        for (let tx = z.rect.x; tx < z.rect.x + z.rect.w; tx++) {
          for (let row = 0; row < 2; row++) {
            d.rect(tx * T, ry + row * T, T, T, (tx + row) % 2 ? PAL.road1 : PAL.road2);
          }
          if (tx % 2 === 0) d.rect(tx * T + 4, ry + T - 1, T - 12, 2, PAL.roadLine, 0.8); // 중앙선
        }
      }
    }
  });
  return key;
}

const WALLS = [PAL.wallA, PAL.wallB, PAL.wallC, PAL.wallD, PAL.wallE];

/** 건물 하나의 파사드 텍스처 (풋프린트 크기) */
export function makeBuilding(scene: Phaser.Scene, r: Rect, index: number): string {
  const key = `bld-${index}`;
  const w = r.w * T, h = r.h * T;
  makeTexture(scene, key, w, h, (d) => {
    const rnd = seeded(1000 + index * 77);
    const wall = WALLS[Math.floor(rnd() * WALLS.length)]!;
    d.rect(0, 0, w, h, wall);
    d.speckle(0, 0, w, h, PAL.roofLine, 0.015, rnd, 0.25);
    // 지붕 파라펫 (상단 1타일)
    d.rect(0, 0, w, T - 6, rnd() < 0.5 ? PAL.roofA : PAL.roofB);
    d.rect(0, T - 6, w, 2, PAL.roofLine);
    d.speckle(0, 0, w, T - 6, PAL.roofLine, 0.03, rnd, 0.5);
    // 창문 격자 (지붕 아래, 마지막 행 제외)
    for (let ty = 1; ty < r.h - 1; ty++) {
      for (let tx = 0; tx < r.w; tx++) {
        if (rnd() < 0.18) continue; // 빈 벽 창문
        const wx = tx * T + 7, wy = ty * T + 6;
        d.rect(wx - 1, wy - 1, 20, 16, PAL.winFrame);
        d.rect(wx, wy, 18, 14, rnd() < 0.35 ? PAL.winGlassWarm : PAL.winGlassDay);
        d.rect(wx, wy + 6, 18, 1, PAL.winFrame);
        d.rect(wx + 9, wy, 1, 14, PAL.winFrame);
      }
    }
    // 1층 하단 어둡게 (깊이감)
    d.rect(0, h - 6, w, 6, PAL.roofLine, 0.35);
  });
  return key;
}

/** 문 텍스처 (문틀+판자) */
export function makeDoorTexture(scene: Phaser.Scene): string {
  const key = 'door';
  makeTexture(scene, key, T, T, (d) => {
    d.rect(2, 0, T - 4, T, PAL.doorDark);
    d.rect(4, 2, T - 8, T - 2, PAL.doorWood);
    for (let i = 0; i < 3; i++) d.rect(4, 4 + i * 9, T - 8, 1, PAL.doorDark, 0.6);
    d.rect(T - 10, T / 2, 3, 3, PAL.signText); // 손잡이
  });
  return key;
}

/** 상점 간판 (텍스트는 Phaser Text로 얹는다) */
export function drawShops(scene: Phaser.Scene): void {
  const shops = [
    { name: '살림 가구', rect: SOLID_RECTS[14]! },
    { name: '카페 모퉁이', rect: SOLID_RECTS[15]! },
    { name: '편의점 24', rect: SOLID_RECTS[16]! },
    { name: '잡화점', rect: SOLID_RECTS[17]! },
  ];
  for (const s of shops) {
    const x = s.rect.x * T, y = s.rect.y * T;
    const w = s.rect.w * T;
    scene.add.rectangle(x + 6, y + 8, w - 12, 14, PAL.signBg).setOrigin(0).setDepth(3);
    scene.add.text(x + w / 2, y + 15, s.name, {
      fontSize: '9px', color: '#f2d8a8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }
}

/** 거리 소품: 가로수·가로등·벤치 (숲길·거리 가장자리) */
export function drawStreetProps(scene: Phaser.Scene): void {
  makeTexture(scene, 'tree', T, T * 2, (d) => {
    const rnd = seeded(42);
    d.rect(14, 40, 4, 22, PAL.doorDark);
    d.rect(4, 6, 24, 30, PAL.grassDark);
    d.rect(8, 2, 16, 10, PAL.grassDark);
    d.speckle(4, 2, 24, 34, PAL.grass1, 0.15, rnd);
    d.speckle(4, 2, 24, 34, PAL.grass2, 0.1, rnd);
  });
  makeTexture(scene, 'lamp', 8, T * 2, (d) => {
    d.rect(3, 8, 2, 54, PAL.signBg);
    d.rect(0, 0, 8, 8, PAL.signBg);
    d.rect(1, 1, 6, 6, PAL.winGlassWarm);
  });
  makeTexture(scene, 'bench', T, 12, (d) => {
    d.rect(0, 0, T, 6, PAL.doorWood);
    d.rect(1, 1, T - 2, 1, PAL.winGlassWarm, 0.25);
    d.rect(2, 6, 3, 6, PAL.doorDark);
    d.rect(T - 5, 6, 3, 6, PAL.doorDark);
  });

  const rnd = seeded(777);
  // 숲길 나무 + 벤치
  const forest = ZONES.find((z) => z.name.includes('숲길'))!.rect;
  for (let i = 0; i < 14; i++) {
    const tx = forest.x + 2 + Math.floor(rnd() * (forest.w - 4));
    const ty = forest.y + (rnd() < 0.5 ? 0 : forest.h - 2);
    scene.add.image(tx * T + T / 2, ty * T + T, 'tree').setOrigin(0.5, 1).setDepth(2);
  }
  for (let i = 0; i < 4; i++) {
    scene.add.image((forest.x + 6 + i * 18) * T, (forest.y + Math.floor(forest.h / 2) + 1) * T + 8, 'bench').setDepth(2);
  }
  // 메인 스트리트 가로등
  const street = ZONES.find((z) => z.name.includes('메인 스트리트'))!.rect;
  for (let i = 0; i < 8; i++) {
    scene.add.image((street.x + 4 + i * 9) * T, street.y * T + 10, 'lamp').setOrigin(0.5, 0).setDepth(2);
  }
}

/** 거리 전체 아트 배치 (씬 create에서 1회 호출) */
export function buildStreetArt(scene: Phaser.Scene, mapW: number, mapH: number): void {
  scene.add.image(0, 0, makeStreetGround(scene, mapW, mapH)).setOrigin(0).setDepth(0);
  SOLID_RECTS.forEach((r, i) => {
    if (i < 4) return; // 테두리 벽 스킵 (지도 밖)
    const key = makeBuilding(scene, r, i);
    scene.add.image(r.x * T, r.y * T, key).setOrigin(0).setDepth(1);
  });
  const doorKey = makeDoorTexture(scene);
  for (const d of HOUSE_DOORS) {
    scene.add.image(d.tx * T, d.ty * T, doorKey).setOrigin(0).setDepth(2);
  }
  drawShops(scene);
  drawStreetProps(scene);
}
