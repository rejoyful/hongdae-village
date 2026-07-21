import type Phaser from 'phaser';
import { TILE } from '../config';
import { ZONES, SOLID_RECTS, HOUSE_DOORS } from '../world/mapData';
import type { Rect } from '../world/grid';
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
export function buildStreetArt(scene: Phaser.Scene, mapW: number, mapH: number): void {
  scene.add.image(0, 0, makeStreetGround(scene, mapW, mapH)).setOrigin(0).setDepth(0);
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
  const doorKey = makeDoorTexture(scene);
  for (const d of HOUSE_DOORS) {
    scene.add.image(d.tx * T, d.ty * T, doorKey).setOrigin(0).setDepth(2);
  }
  drawShops(scene);
  drawStreetProps(scene);
  drawHongdaeProps(scene);
}
