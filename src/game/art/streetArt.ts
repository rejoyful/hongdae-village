import type Phaser from 'phaser';
import { TILE } from '../config';
import {
  ZONES, SOLID_RECTS, HOUSE_DOORS, SHOP_DOORS, CAFE_DOORS, INTERIOR_DOORS,
  CLAW_SPOT, PHOTO_SPOT, BUNGEO_SPOT, FOOD_TRUCKS, REALTY_DOOR,
} from '../world/mapData';
import type { Rect, CollisionGrid } from '../world/grid';
import { PAL } from './palette';
import { makeTexture, seeded, type Px } from './pixelCanvas';
import { BUILDING_PLACEMENT } from './assetManifest';

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

/** 상점 간판 — AI 자산에 간판이 포함된 건물은 오버레이 생략 */
export function drawShops(scene: Phaser.Scene): void {
  const shops = [
    { name: '살림 가구', index: 14 }, { name: '카페 모퉁이', index: 15 },
    { name: '편의점 24', index: 16 }, { name: '잡화점', index: 17 },
  ];
  for (const s of shops) {
    const assetKey = BUILDING_PLACEMENT.get(s.index);
    if (assetKey && scene.textures.exists(assetKey)) continue; // AI 자산엔 간판 포함

    const rect = SOLID_RECTS[s.index]!;
    const x = rect.x * T, y = rect.y * T, w = rect.w * T;
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
  // 메인 스트리트 가로등 (북측 상가 신설로 차도 가장자리로 이동)
  const street = ZONES.find((z) => z.name.includes('메인 스트리트'))!.rect;
  for (let i = 0; i < 8; i++) {
    scene.add.image((street.x + 4 + i * 9) * T, (street.y + 5) * T + 6, 'lamp').setOrigin(0.5, 0).setDepth(2);
  }
}

/** 실제 홍대 감성 소품 밀도 패스 — 프로시저럴 + AI 소품 배치 */
export function drawHongdaeProps(scene: Phaser.Scene): void {
  const rnd = seeded(31547);

  // ── 프로시저럴 소품 텍스처 ──
  makeTexture(scene, 'pole', 10, T * 2 + 12, (d) => {  // 전봇대
    d.rect(4, 0, 3, T * 2 + 12, 0x5c5044);
    d.rect(0, 6, 10, 2, 0x5c5044);
    d.rect(1, 12, 8, 2, 0x5c5044);
    d.rect(3, 2, 5, 3, 0x8a8a72, 0.8); // 변압기
  });
  makeTexture(scene, 'aframe', 20, 22, (d) => {        // 입간판
    d.rect(2, 2, 16, 16, 0xf0e8d8);
    d.rect(3, 3, 14, 3, 0xd88a7c);
    d.rect(4, 8, 12, 1, 0x5c5650); d.rect(4, 11, 10, 1, 0x5c5650); d.rect(4, 14, 12, 1, 0x5c5650);
    d.rect(1, 18, 4, 4, 0x8a7d6e); d.rect(15, 18, 4, 4, 0x8a7d6e);
  });
  makeTexture(scene, 'trash', 16, 18, (d) => {         // 분리수거함
    d.rect(0, 2, 7, 14, 0x5aa668); d.rect(9, 2, 7, 14, 0x6a8ac8);
    d.rect(1, 0, 5, 3, 0x37663f); d.rect(10, 0, 5, 3, 0x3f5686);
    d.rect(2, 6, 3, 4, 0x2e3a2e, 0.6); d.rect(11, 6, 3, 4, 0x2e3346, 0.6);
  });
  makeTexture(scene, 'kick', 20, 14, (d) => {          // 공유 킥보드
    d.rect(2, 11, 4, 3, 0x2e2620); d.rect(14, 11, 4, 3, 0x2e2620);
    d.rect(3, 9, 14, 2, 0x7cc47f);
    d.rect(15, 1, 2, 9, 0x7cc47f); d.rect(12, 1, 6, 2, 0x4a7a4e);
  });
  makeTexture(scene, 'bikerack', 46, 18, (d) => {      // 따릉이 거치대
    d.rect(0, 14, 46, 2, 0x8a8a92);
    for (let i = 0; i < 3; i++) {
      const x = 2 + i * 15;
      d.rect(x + 1, 8, 10, 2, 0x4aa06a);
      d.rect(x, 4, 2, 8, 0x4aa06a); d.rect(x + 10, 4, 2, 8, 0x4aa06a);
      d.rect(x - 1, 10, 4, 4, 0x2e2620); d.rect(x + 9, 10, 4, 4, 0x2e2620);
    }
  });
  makeTexture(scene, 'parasol', 30, 30, (d) => {       // 파라솔 테이블
    d.rect(4, 4, 22, 10, 0xd88a7c);
    d.rect(6, 2, 18, 4, 0xe8a89a);
    d.rect(14, 14, 2, 8, 0x5c5044);
    d.rect(8, 20, 14, 6, 0xb89a6e);
  });
  makeTexture(scene, 'busstop', 54, 30, (d) => {       // 버스정류장
    d.rect(0, 0, 54, 4, 0x37424a);
    d.rect(2, 4, 3, 24, 0x5c6870); d.rect(49, 4, 3, 24, 0x5c6870);
    d.rect(6, 6, 42, 14, 0xa8c8d8, 0.45);
    d.rect(8, 22, 38, 4, 0x8a959c);
    d.rect(20, 1, 14, 2, 0x7cc47f);
  });
  makeTexture(scene, 'cat', 14, 10, (d) => {           // 길고양이
    d.rect(2, 3, 9, 6, 0x8a7454);
    d.rect(9, 1, 4, 5, 0x8a7454);
    d.rect(9, 0, 1, 2, 0x8a7454); d.rect(12, 0, 1, 2, 0x8a7454);
    d.rect(0, 4, 3, 2, 0x8a7454);
    d.rect(10, 3, 1, 1, 0x2e2620);
    d.rect(3, 4, 6, 2, 0xf0e8d8, 0.6); // 배 얼룩
  });
  makeTexture(scene, 'vent', 40, 24, (d) => {          // 지하철 환풍구
    d.rect(0, 0, 40, 24, 0x6e6a64);
    for (let i = 2; i < 38; i += 4) d.rect(i, 2, 2, 20, 0x4a463c);
  });
  makeTexture(scene, 'hydrant', 12, 16, (d) => {       // 소화전
    d.rect(3, 4, 6, 10, 0xc45c50);
    d.rect(2, 2, 8, 3, 0xc45c50); d.rect(4, 0, 4, 3, 0xa04438);
    d.rect(0, 7, 3, 3, 0xa04438); d.rect(9, 7, 3, 3, 0xa04438);
    d.rect(2, 14, 8, 2, 0x8a3a30);
  });

  const img = (key: string, tx: number, ty: number, oy = 1) =>
    scene.add.image(tx * T + T / 2, ty * T + T, key).setOrigin(0.5, oy).setDepth(2);

  // ── 배치: 광장·거리를 빽빽하게 ──
  // 전봇대 + 전선 (골목 라인)
  const poleXs = [3, 18, 33, 55, 70];
  for (const px2 of poleXs) img('pole', px2, 26);
  const wire = scene.add.graphics().setDepth(2);
  wire.lineStyle(1, 0x2e2620, 0.6);
  for (let i = 0; i < poleXs.length - 1; i++) {
    const x1 = poleXs[i]! * T + T / 2, x2 = poleXs[i + 1]! * T + T / 2;
    const y = 25 * T + 6;
    wire.beginPath();
    wire.moveTo(x1, y);
    // 살짝 늘어진 전선
    wire.lineTo((x1 + x2) / 2, y + 6);
    wire.lineTo(x2, y);
    wire.strokePath();
  }
  // 광장: 환풍구·소화전·쓰레기통·킥보드 무리
  img('vent', 31, 40); img('vent', 47, 40);
  img('hydrant', 29, 44);
  img('trash', 34, 38); img('trash', 45, 51);
  for (let i = 0; i < 4; i++) img('kick', 42 + i, 53);
  // 따릉이 거치대 (역 앞)
  img('bikerack', 33, 53);
  // 버스정류장 (차도 북측)
  img('busstop', 68, 31, 1);
  // 카페 앞 파라솔
  img('parasol', 26, 36); img('parasol', 30, 36);
  // 입간판들 (상점 앞)
  img('aframe', 10, 36); img('aframe', 50, 36); img('aframe', 66, 36);
  // 길고양이 3마리 (숲길·골목·포차)
  img('cat', 22, 7); img('cat', 52, 22); img('cat', 6, 41);
  // 포차골목 쓰레기통·입간판
  img('trash', 18, 44); img('aframe', 12, 47);

  // ── AI 소품 (있으면 배치) ──
  const aiImg = (key: string, tx: number, ty: number, wT: number, hT: number) => {
    if (!scene.textures.exists(key)) return;
    scene.add.image(tx * T, ty * T, key).setOrigin(0, 1).setDisplaySize(wT * T, hT * T).setDepth(2);
  };
  aiImg('prop-cart', 8, 46, 2, 2);    // 붕어빵 포차 (포차골목)
  aiImg('prop-cart', 45, 44, 2, 2);   // 광장에도 한 대
  aiImg('prop-arcade', 63, 37, 3, 2); // 인형뽑기+네컷 (잡화점 옆)
  aiImg('prop-mural', 59, 41, 8, 3);  // 벽화골목 그래피티
  aiImg('prop-mural', 68, 45, 8, 3);
  void rnd;
}

/** 거리 전체 아트 배치 (씬 create에서 1회 호출) */
export function buildStreetArt(scene: Phaser.Scene, mapW: number, mapH: number, grid?: CollisionGrid): void {
  scene.add.image(0, 0, makeStreetGround(scene, mapW, mapH)).setOrigin(0).setDepth(0);
  if (grid) scatterDecals(scene, mapW, mapH, grid);
  SOLID_RECTS.forEach((r, i) => {
    if (i < 4) return; // 테두리 벽 스킵 (지도 밖)
    // AI 아트 자산이 로드돼 있으면 우선 사용, 없으면 프로시저럴 폴백
    const assetKey = BUILDING_PLACEMENT.get(i);
    const key = assetKey && scene.textures.exists(assetKey)
      ? assetKey
      : makeBuilding(scene, r, i);
    scene.add.image(r.x * T, r.y * T, key).setOrigin(0).setDepth(1);
    // AI 자산 크기가 풋프린트와 다르면 맞춰 늘린다 (안전망)
    if (assetKey && scene.textures.exists(assetKey)) {
      const img = scene.children.list[scene.children.list.length - 1] as Phaser.GameObjects.Image;
      img.setDisplaySize(r.w * T, r.h * T);
    }
  });
  // 모든 출입구에 보이는 문을 그린다 (입구가 안 보여 헷갈리던 문제 보완)
  const doorKey = makeDoorTexture(scene);
  const glowKey = makeDoorGlow(scene);
  const allDoors = [
    ...HOUSE_DOORS.map((d) => ({ tx: d.tx, ty: d.ty })),
    ...SHOP_DOORS, ...CAFE_DOORS, REALTY_DOOR,
    ...INTERIOR_DOORS.map((d) => ({ tx: d.tx, ty: d.ty })),
  ];
  for (const d of allDoors) {
    scene.add.image(d.tx * T + T / 2, d.ty * T + T, glowKey).setOrigin(0.5, 1).setDepth(1);
    scene.add.image(d.tx * T, d.ty * T, doorKey).setOrigin(0).setDepth(2);
  }
  drawShops(scene);
  drawStreetProps(scene);
  drawHongdaeProps(scene);
  drawDensity(scene);
  drawInteractables(scene);

  // 복덕방 간판
  const rr = SOLID_RECTS[29]!;
  scene.add.rectangle(rr.x * T + 6, rr.y * T + 8, rr.w * T - 12, 14, PAL.signBg).setOrigin(0).setDepth(3);
  scene.add.text((rr.x + rr.w / 2) * T, rr.y * T + 15, '복덕방 부동산', {
    fontSize: '9px', color: '#f2d8a8', fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(3);
}

/** 바닥 데칼 산개 — 통행 가능한 타일에만 낙엽·맨홀·얼룩·꽃잎을 흩뿌려 빈 공간을 채운다 */
function scatterDecals(scene: Phaser.Scene, mapW: number, mapH: number, grid: CollisionGrid): void {
  makeTexture(scene, 'dc-leaf', 8, 8, (d) => { d.rect(2, 1, 3, 5, 0xb8a06a); d.rect(3, 0, 1, 7, 0x8a7048); });
  makeTexture(scene, 'dc-manhole', 20, 14, (d) => {
    d.rect(0, 2, 20, 10, 0x5c5650); d.rect(2, 3, 16, 8, 0x6e6a64);
    for (let i = 3; i < 17; i += 3) d.rect(i, 4, 1, 6, 0x4a463c);
  });
  makeTexture(scene, 'dc-crack', 16, 10, (d) => {
    d.rect(1, 5, 6, 1, 0x4a463c, 0.5); d.rect(6, 3, 5, 1, 0x4a463c, 0.5); d.rect(9, 5, 6, 1, 0x4a463c, 0.5);
  });
  makeTexture(scene, 'dc-petal', 6, 6, (d) => { d.rect(1, 1, 4, 4, 0xe8a0b8, 0.85); d.rect(2, 2, 2, 2, 0xf2c0d0); });
  makeTexture(scene, 'dc-puddle', 18, 10, (d) => { d.rect(0, 2, 18, 6, 0x8aa0a8, 0.35); d.rect(3, 3, 10, 3, 0xb8c8cc, 0.3); });

  const keys = ['dc-leaf', 'dc-crack', 'dc-petal', 'dc-leaf', 'dc-manhole', 'dc-puddle', 'dc-leaf', 'dc-petal'];
  const rnd = seeded(90210);
  let placed = 0;
  for (let i = 0; i < 900 && placed < 240; i++) {
    const tx = 1 + Math.floor(rnd() * (mapW - 2));
    const ty = 1 + Math.floor(rnd() * (mapH - 2));
    if (grid.isSolid(tx, ty)) continue;              // 건물·소품 위엔 안 놓음
    const key = keys[Math.floor(rnd() * keys.length)]!;
    scene.add.image(tx * T + T / 2 + (rnd() - 0.5) * 16, ty * T + T / 2 + (rnd() - 0.5) * 16, key)
      .setOrigin(0.5).setDepth(1).setAlpha(0.5 + rnd() * 0.35);
    placed++;
  }
}

/** 빈 골목을 채우는 밀도 패스 — 화분·자전거·포차 등불·꽃밭·입간판 (장식) */
function drawDensity(scene: Phaser.Scene): void {
  makeTexture(scene, 'planter', 18, 16, (d) => {       // 화분
    d.rect(2, 8, 14, 8, 0xb08050); d.rect(2, 8, 14, 2, 0x8a6038);
    d.rect(4, 0, 4, 9, 0x5aa668); d.rect(9, 1, 4, 8, 0x4a9658); d.rect(6, 3, 5, 5, 0x6ab878);
  });
  makeTexture(scene, 'lantern', 12, 20, (d) => {       // 포차 등불
    d.rect(5, 0, 2, 6, 0x3a2a20);
    d.rect(1, 6, 10, 12, 0xd85a4a); d.rect(1, 6, 10, 2, 0xc4453a); d.rect(1, 15, 10, 2, 0xc4453a);
    d.rect(4, 9, 4, 6, 0xffe0b0, 0.6);
  });
  makeTexture(scene, 'flowerbed', T, 12, (d) => {      // 꽃밭
    d.rect(0, 4, T, 8, 0x4a7a3a);
    for (let i = 0; i < 6; i++) d.rect(2 + i * 5, 2 + (i % 2) * 2, 3, 3, [0xe86a8a, 0xf2c25c, 0xc8a8d8][i % 3]!);
  });
  makeTexture(scene, 'bicycle', 22, 16, (d) => {       // 자전거
    d.rect(1, 10, 6, 5, 0x3a3a40); d.rect(15, 10, 6, 5, 0x3a3a40);
    d.rect(4, 12, 14, 1, 0x8a8a92); d.rect(6, 6, 10, 2, 0x6a8ac8);
    d.rect(15, 4, 2, 8, 0x8a8a92); d.rect(4, 8, 2, 5, 0x8a8a92);
  });
  makeTexture(scene, 'standee', 16, 24, (d) => {       // 홍보 입간판
    d.rect(3, 0, 10, 18, 0xf0e8d8); d.rect(3, 0, 10, 4, 0x7fb8a8);
    d.rect(5, 6, 6, 1, 0x5c5650); d.rect(5, 9, 6, 1, 0x5c5650); d.rect(5, 12, 4, 1, 0x5c5650);
    d.rect(6, 18, 2, 6, 0x8a7d6e); d.rect(8, 18, 2, 6, 0x8a7d6e);
  });

  const img = (key: string, tx: number, ty: number) =>
    scene.add.image(tx * T + T / 2, ty * T + T, key).setOrigin(0.5, 1).setDepth(2);

  // 주택 골목(서·동) — 화분·자전거로 생활감
  const homeSpots: Array<[string, number, number]> = [
    ['planter', 10, 14], ['planter', 19, 13], ['bicycle', 10, 18], ['planter', 4, 25],
    ['planter', 64, 14], ['bicycle', 64, 18], ['planter', 73, 13], ['planter', 72, 25],
    ['flowerbed', 25, 24], ['flowerbed', 54, 24],
  ];
  // 포차 골목 — 등불·화분·입간판
  const pojangSpots: Array<[string, number, number]> = [
    ['lantern', 4, 44], ['lantern', 7, 44], ['lantern', 17, 45], ['standee', 14, 52],
    ['planter', 3, 52], ['bicycle', 20, 51], ['lantern', 20, 45],
  ];
  // 벽화 골목 — 화분·꽃밭·입간판
  const muralSpots: Array<[string, number, number]> = [
    ['planter', 69, 45], ['flowerbed', 74, 45], ['standee', 62, 45], ['planter', 76, 48],
    ['flowerbed', 60, 52], ['bicycle', 76, 52],
  ];
  // 숲길 — 꽃밭 산책로 가장자리
  const forestSpots: Array<[string, number, number]> = [
    ['flowerbed', 8, 3], ['flowerbed', 34, 7], ['flowerbed', 60, 3], ['flowerbed', 70, 7], ['planter', 45, 3],
  ];
  for (const [k, tx, ty] of [...homeSpots, ...pojangSpots, ...muralSpots, ...forestSpots]) img(k, tx, ty);
}

/** 문 앞 바닥 발광 매트 — 여기가 입구임을 알린다 */
function makeDoorGlow(scene: Phaser.Scene): string {
  const key = 'door-glow';
  if (scene.textures.exists(key)) return key;
  makeTexture(scene, key, T, 10, (d) => {
    d.rect(2, 2, T - 4, 6, PAL.winGlassWarm, 0.5);
    d.rect(4, 3, T - 8, 4, PAL.winGlassWarm, 0.35);
  });
  return key;
}

/** 인형뽑기·네컷·붕어빵 기계 — 몸체는 SOLID_PROPS로 통행 불가, 앞 타일이 트리거 */
function drawInteractables(scene: Phaser.Scene): void {
  makeTexture(scene, 'claw', T, Math.floor(T * 1.6), (d) => {   // 인형뽑기
    d.rect(2, 2, T - 4, T + 8, 0xe07a9a);
    d.rect(5, 6, T - 10, 22, 0xffe0ec, 0.85);           // 유리창
    d.rect(8, 10, 6, 6, 0xf2c25c); d.rect(17, 14, 6, 6, 0x7fb8e0); // 인형들
    d.rect(12, 8, 3, 6, 0x8a8a92);                       // 크레인
    d.rect(4, T + 10, T - 8, 10, 0xc45c7a);              // 하단 조작부
    d.rect(9, T + 13, 6, 4, 0x3a2a30);
  });
  makeTexture(scene, 'photobooth', T, Math.floor(T * 1.7), (d) => { // 네컷 포토부스
    d.rect(1, 1, T - 2, T + 12, 0x3a3346);
    d.rect(4, 5, T - 8, 18, 0x8ac8e0, 0.7);             // 화면
    d.rect(6, 26, T - 12, 3, 0xf2d8a8);                 // 커튼봉
    d.rect(6, 29, 9, T - 14, 0xd85a7c, 0.85);           // 커튼
    d.rect(T - 15, 29, 9, T - 14, 0xd85a7c, 0.85);
    d.rect(11, 12, 10, 8, 0x2a2430);                    // 카메라
  });
  makeTexture(scene, 'bungeo', T + 8, T, (d) => {        // 붕어빵 포차
    d.rect(0, T - 16, T + 8, 14, 0x8a5a3c);             // 카트
    d.rect(2, 2, T + 4, 12, 0xc4453a);                  // 천막
    d.rect(2, 2, T + 4, 3, 0xf0e8d8);
    d.rect(6, T - 14, 8, 6, 0xe8b04c); d.rect(18, T - 14, 8, 6, 0xe8b04c); // 붕어빵
    d.rect(30, T - 14, 6, 6, 0xe8b04c);
  });

  const claw = SOLID_PROPS_BODY(CLAW_SPOT);      // 트리거 위 몸체 타일
  scene.add.image(claw.x * T + T / 2, claw.y * T + T, 'claw').setOrigin(0.5, 1).setDepth(2);
  const photo = SOLID_PROPS_BODY(PHOTO_SPOT);
  scene.add.image(photo.x * T + T / 2, photo.y * T + T, 'photobooth').setOrigin(0.5, 1).setDepth(2);
  const bung = SOLID_PROPS_BODY(BUNGEO_SPOT);
  scene.add.image(bung.x * T + T / 2, bung.y * T + T, 'bungeo').setOrigin(0.5, 1).setDepth(2);

  // 광장 푸드트럭 (몸체 SOLID_PROPS, 2×1 타일)
  makeTexture(scene, 'foodtruck', T * 2, Math.floor(T * 1.4), (d) => {
    d.rect(0, 12, T * 2, 26, 0xf2e2c8);                 // 차체
    d.rect(0, 2, T * 2, 12, 0xd85a4a);                  // 어닝
    for (let i = 0; i < 4; i++) d.rect(i * 16 + 2, 2, 8, 12, 0xf0e8d8);
    d.rect(6, 18, 22, 12, 0x8ac8e0, 0.7);               // 판매창
    d.rect(34, 20, 16, 8, 0x5c5044);                    // 메뉴판
    d.rect(8, 38, 10, 6, 0x2e2620); d.rect(46, 38, 10, 6, 0x2e2620); // 바퀴
  });
  for (const ft of FOOD_TRUCKS) {
    scene.add.image(ft.tx * T, (ft.ty + 1) * T, 'foodtruck').setOrigin(0, 1).setDepth(2);
  }
}

/** 스팟 바로 위(북쪽) 타일 = 기계 몸체 위치 (SOLID_PROPS와 일치) */
function SOLID_PROPS_BODY(spot: { tx: number; ty: number }): { x: number; y: number } {
  return { x: spot.tx, y: spot.ty - 1 };
}
