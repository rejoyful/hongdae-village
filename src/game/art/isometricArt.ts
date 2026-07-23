import Phaser from 'phaser';
import { ISO_METRICS, isoDepth, projectFootprint, projectIso } from '../world/isometric';
import { isometricPropAsset, isometricTreeAsset, type IsometricTreeVariant } from './assetManifest';
import { drawIsoTerrainLayer, type IsoTerrain } from './isometricTerrainArt';

export type { IsoTerrain } from './isometricTerrainArt';
export type IsoPropKind = 'lamp' | 'bench' | 'planter' | 'bollard' | 'bin' | 'workbench' | 'showcase' | 'clubboard' | 'guidekiosk' | 'finderkiosk' | 'museumcabinet' | 'projectboard' | 'marketboard' | 'weatherstation';

export interface IsoPropDef {
  id: string;
  kind: IsoPropKind;
  tx: number;
  ty: number;
}

export interface IsoBuildingDef {
  id: string;
  name: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
  levels: number;
  wallLeft: number;
  wallRight: number;
  roof: number;
  accent: number;
  artKey?: string;
  artScale?: number;
  artOffsetX?: number;
  artOffsetY?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

function points(ps: Array<{ x: number; y: number }>): Phaser.Geom.Point[] {
  return ps.map((p) => new Phaser.Geom.Point(Math.round(p.x), Math.round(p.y)));
}

function shade(color: number, amount: number): number {
  const value = Phaser.Display.Color.ValueToColor(color);
  return (amount >= 0 ? value.lighten(amount) : value.darken(-amount)).color;
}

function lerp(a: { x: number; y: number }, b: { x: number; y: number }, t: number): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** 64×32 다이아몬드 지면. 한 Graphics에 배치해 draw call을 제한한다. */
export function drawIsoGround(
  scene: Phaser.Scene,
  width: number,
  height: number,
  terrainAt: (tx: number, ty: number) => IsoTerrain,
): Phaser.GameObjects.Graphics {
  return drawIsoTerrainLayer(scene, width, height, terrainAt);
}

/** 외곽숲의 위험 경계를 월드 지형 위에 가볍게 표시한다. */
export function drawIsoHuntZone(
  scene: Phaser.Scene,
  zone: { name: string; tx: number; ty: number; w: number; h: number },
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const border = projectFootprint(zone);
  g.fillStyle(0x6f4b8c, 0.08).fillPoints(points(border), true);
  g.lineStyle(2, 0xc59aed, 0.62).strokePoints(points(border), true);
  for (let ty = zone.ty; ty < zone.ty + zone.h; ty++) {
    for (let tx = zone.tx; tx < zone.tx + zone.w; tx++) {
      if ((tx * 5 + ty * 7) % 6 !== 0) continue;
      const p = projectIso(tx + 0.5, ty + 0.5);
      g.fillStyle(0xb58ae0, 0.6).fillCircle(p.x, p.y, 2);
    }
  }
  const labelAt = projectIso(zone.tx + zone.w / 2, zone.ty + zone.h / 2);
  const label = scene.add.text(labelAt.x, labelAt.y - 12, `⚔ ${zone.name}`, {
    fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    fontSize: '9px', color: '#fff0cf', backgroundColor: '#4b315fcc',
    padding: { x: 5, y: 2 }, resolution: 2,
  }).setOrigin(0.5);
  return scene.add.container(0, 0, [g, label]).setDepth(18);
}

/** 프로시저럴 아이소메트릭 건물. 이후 생성형 픽셀 자산이 같은 footprint/depth 계약을 사용한다. */
export function drawIsoBuilding(
  scene: Phaser.Scene,
  def: IsoBuildingDef,
): Phaser.GameObjects.Container {
  const base = projectFootprint({ tx: def.tx, ty: def.ty, w: def.w, h: def.h });
  const elevation = def.levels * 2.35;
  const top = projectFootprint({ tx: def.tx, ty: def.ty, w: def.w, h: def.h }, elevation);
  const depth = isoDepth({ tx: def.tx, ty: def.ty, w: def.w, h: def.h }, -100);

  // 생성형 대표 자산은 남쪽 모서리를 anchor로 사용한다. 실패 시 아래 프로시저럴 건물이 그대로 살아난다.
  if (def.artKey && scene.textures.exists(def.artKey)) {
    const anchor = base[2];
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x211a16, 0.22).fillPoints(points(base), true);
    const sprite = scene.add.image(
      anchor.x + (def.artOffsetX ?? 0), anchor.y + (def.artOffsetY ?? 0), def.artKey,
    ).setOrigin(0.5, 1).setScale(def.artScale ?? 1);
    const sign = scene.add.text(
      anchor.x + (def.labelOffsetX ?? 0), anchor.y + (def.labelOffsetY ?? -72), def.name,
      {
        fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        fontSize: '9px', color: '#49301d', backgroundColor: '#fff2d8e8',
        padding: { x: 5, y: 2 }, resolution: 2,
      },
    ).setOrigin(0.5);
    return scene.add.container(0, 0, [shadow, sprite, sign]).setDepth(depth);
  }

  const g = scene.add.graphics();

  // 화면 전면의 두 벽면
  g.fillStyle(def.wallRight, 1).fillPoints(points([base[1], base[2], top[2], top[1]]), true);
  g.fillStyle(def.wallLeft, 1).fillPoints(points([base[2], base[3], top[3], top[2]]), true);
  g.lineStyle(2, 0x49392d, 0.75);
  g.strokePoints(points([base[1], base[2], top[2], top[1]]), true);
  g.strokePoints(points([base[2], base[3], top[3], top[2]]), true);

  // 층 구분선
  const totalHeight = elevation * ISO_METRICS.elevationHeight;
  const levelPx = totalHeight / def.levels;
  for (let lv = 1; lv < def.levels; lv++) {
    const lift = lv * levelPx;
    for (const [a, b] of [[base[1], base[2]], [base[2], base[3]]] as const) {
      g.lineStyle(2, 0x5c4637, 0.28).lineBetween(a.x, a.y - lift, b.x, b.y - lift);
    }
  }

  // 각 벽면에 층별 창문을 투영해 건물마다 밀도를 유지한다.
  const drawWindows = (a: { x: number; y: number }, b: { x: number; y: number }, count: number, seed: number) => {
    for (let lv = 0; lv < def.levels; lv++) {
      const bottomLift = lv * levelPx + Math.max(7, levelPx * 0.2);
      const topLift = (lv + 1) * levelPx - Math.max(7, levelPx * 0.2);
      for (let index = 0; index < count; index++) {
        const t0 = (index + 0.2) / count;
        const t1 = (index + 0.74) / count;
        const lowerA = lerp(a, b, t0), lowerB = lerp(a, b, t1);
        const lit = (seed + lv * 7 + index * 3) % 4 !== 0;
        const window = [
          { x: lowerA.x, y: lowerA.y - bottomLift },
          { x: lowerB.x, y: lowerB.y - bottomLift },
          { x: lowerB.x, y: lowerB.y - topLift },
          { x: lowerA.x, y: lowerA.y - topLift },
        ];
        g.fillStyle(lit ? 0xe6ae63 : 0x415866, 0.96).fillPoints(points(window), true);
        g.lineStyle(2, shade(def.roof, -24), 0.9).strokePoints(points(window), true);
        const mid0 = lerp(lowerA, lowerB, 0.5);
        g.lineStyle(1, 0xf7d89a, lit ? 0.42 : 0.18)
          .lineBetween(mid0.x, mid0.y - bottomLift, mid0.x, mid0.y - topLift);
      }
    }
  };
  drawWindows(base[1], base[2], Math.max(2, Math.min(4, def.h)), def.tx + def.ty);
  drawWindows(base[2], base[3], Math.max(2, Math.min(4, def.w)), def.tx * 3 + def.ty);

  // 지붕·처마·난간과 옥상 설비
  g.fillStyle(def.roof, 1).fillPoints(points(top), true);
  g.lineStyle(2, 0x3f332a, 0.9).strokePoints(points(top), true);
  const roofInner = projectFootprint({ tx: def.tx + 0.22, ty: def.ty + 0.22, w: def.w - 0.44, h: def.h - 0.44 }, elevation + 0.08);
  g.lineStyle(3, shade(def.roof, 20), 0.78).strokePoints(points(roofInner), true);
  const roofCenter = projectIso(def.tx + def.w * 0.5, def.ty + def.h * 0.5, elevation + 0.12);
  g.fillStyle(shade(def.wallRight, -18), 1).fillRect(roofCenter.x - 10, roofCenter.y - 13, 20, 11);
  g.lineStyle(2, 0x3f332a, 0.8).strokeRect(roofCenter.x - 10, roofCenter.y - 13, 20, 11);
  g.fillStyle(0x526f76, 1).fillRect(roofCenter.x - 7, roofCenter.y - 22, 14, 9);
  g.lineStyle(1, 0x2f4147, 0.9).strokeRect(roofCenter.x - 7, roofCenter.y - 22, 14, 9);
  g.lineStyle(2, 0x3d342d, 0.9).lineBetween(roofCenter.x + 16, roofCenter.y - 5, roofCenter.x + 16, roofCenter.y - 31);
  g.lineStyle(1, 0x3d342d, 0.9).lineBetween(roofCenter.x + 10, roofCenter.y - 27, roofCenter.x + 22, roofCenter.y - 27);

  const signAt = projectIso(def.tx + def.w, def.ty + def.h * 0.62, elevation * 0.42);
  const sign = scene.add.text(signAt.x, signAt.y, def.name, {
    fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    fontSize: '9px', color: '#fff2d8', backgroundColor: `#${def.accent.toString(16).padStart(6, '0')}cc`,
    padding: { x: 4, y: 2 }, resolution: 2,
  }).setOrigin(0.5).setAngle(-0.5);

  const c = scene.add.container(0, 0, [g, sign]);
  c.setDepth(depth);
  return c;
}

export function drawIsoTree(
  scene: Phaser.Scene,
  tx: number,
  ty: number,
  variant: IsometricTreeVariant = 'zelkova',
): Phaser.GameObjects.Container {
  const p = projectIso(tx + 0.5, ty + 0.5);
  const authored = isometricTreeAsset(variant);
  if (authored && scene.textures.exists(authored.key)) {
    const shadow = scene.add.ellipse(0, 2, 35, 10, 0x211a16, 0.22);
    const sprite = scene.add.image(0, 4, authored.key).setOrigin(0.5, 1).setScale(authored.scale);
    return scene.add.container(p.x, p.y, [shadow, sprite])
      .setDepth(isoDepth({ tx, ty, w: 1, h: 1 }, 20));
  }
  const g = scene.add.graphics();
  g.fillStyle(0x241d17, 0.22).fillEllipse(0, 2, 28, 9);
  g.fillStyle(0x493421, 1).fillRect(-4, -25, 8, 27);
  g.fillStyle(0x725236, 1).fillRect(-2, -24, 3, 25);
  g.fillStyle(0x344932, 1).fillPoints(points([
    { x: -18, y: -28 }, { x: -12, y: -45 }, { x: -3, y: -52 }, { x: 10, y: -48 },
    { x: 18, y: -36 }, { x: 14, y: -22 }, { x: 2, y: -17 }, { x: -12, y: -20 },
  ]), true);
  g.fillStyle(0x56704a, 1).fillPoints(points([
    { x: -14, y: -31 }, { x: -8, y: -45 }, { x: 2, y: -50 }, { x: 14, y: -40 },
    { x: 12, y: -27 }, { x: 1, y: -22 }, { x: -10, y: -24 },
  ]), true);
  g.fillStyle(0x78915f, 1).fillRect(-8, -44, 8, 6).fillRect(3, -40, 7, 5).fillRect(-3, -34, 6, 4);
  g.fillStyle(0x9aac78, 0.9).fillRect(-6, -43, 3, 2).fillRect(5, -39, 3, 2);
  return scene.add.container(p.x, p.y, [g])
    .setDepth(isoDepth({ tx, ty, w: 1, h: 1 }, 20));
}

/** 작은 거리 소품. 통행 판정은 막지 않고 시각적 생활감만 더한다. */
export function drawIsoProp(scene: Phaser.Scene, def: IsoPropDef): Phaser.GameObjects.Container {
  const p = projectIso(def.tx + 0.5, def.ty + 0.5);
  const authored = isometricPropAsset(def.kind);
  if (authored && scene.textures.exists(authored.key)) {
    const shadow = scene.add.ellipse(0, 2, 70, 17, 0x211a16, 0.24);
    const sprite = scene.add.image(0, 5, authored.key).setOrigin(0.5, 1).setScale(authored.scale);
    return scene.add.container(p.x, p.y, [shadow, sprite])
      .setDepth(isoDepth({ tx: def.tx, ty: def.ty, w: 1, h: 1 }, 45));
  }
  const g = scene.add.graphics();
  if (def.kind === 'lamp') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 20, 6);
    g.fillStyle(0x3d3833, 1).fillRect(-2, -34, 4, 36);
    g.fillStyle(0x74695c, 1).fillRect(-1, -33, 2, 33);
    g.fillStyle(0x3b332c, 1).fillRect(-7, -39, 14, 6);
    g.fillStyle(0xffd477, 0.35).fillCircle(0, -36, 12);
    g.fillStyle(0xffdfa0, 1).fillRect(-4, -37, 8, 6);
    g.lineStyle(1, 0x59442d, 0.95).strokeRect(-4, -37, 8, 6);
  } else if (def.kind === 'bench') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 30, 7);
    g.fillStyle(0x4a3626, 1).fillRect(-13, -10, 26, 5).fillRect(-12, -17, 24, 4);
    g.fillStyle(0x9a6a3d, 1).fillRect(-11, -9, 22, 2).fillRect(-10, -16, 20, 2);
    g.fillStyle(0x37332f, 1).fillRect(-10, -5, 3, 8).fillRect(7, -5, 3, 8);
  } else if (def.kind === 'planter') {
    g.fillStyle(0x2b2119, 0.18).fillEllipse(0, 2, 19, 6);
    g.fillStyle(0x9c5c3d, 1).fillPoints(points([
      { x: -7, y: -8 }, { x: 7, y: -8 }, { x: 5, y: 1 }, { x: -5, y: 1 },
    ]), true);
    g.fillStyle(0xc27b4e, 1).fillRect(-8, -10, 16, 3);
    g.fillStyle(0x496344, 1).fillRect(-2, -24, 4, 15).fillRect(-8, -19, 7, 4).fillRect(2, -17, 8, 4);
    g.fillStyle(0x78915f, 1).fillRect(-7, -21, 5, 4).fillRect(3, -22, 5, 5);
  } else if (def.kind === 'bollard') {
    g.fillStyle(0x211b17, 0.18).fillEllipse(0, 2, 11, 4);
    g.fillStyle(0x3d4244, 1).fillRect(-3, -13, 6, 15);
    g.fillStyle(0xd9ae55, 1).fillRect(-3, -9, 6, 3);
    g.fillStyle(0x60686a, 1).fillRect(-4, -15, 8, 3);
  } else if (def.kind === 'workbench') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 46, 11);
    g.fillStyle(0x4b3425, 1).fillRect(-21, -24, 42, 5).fillRect(-18, -19, 5, 21).fillRect(13, -19, 5, 21);
    g.fillStyle(0xa67747, 1).fillRect(-19, -27, 38, 6);
    g.fillStyle(0x697561, 1).fillRect(-17, -46, 17, 19);
    g.fillStyle(0xd6c7a8, 1).fillRect(3, -34, 13, 7);
    g.fillStyle(0x332b25, 1).fillRect(6, -42, 2, 14).fillRect(12, -39, 2, 12);
  } else if (def.kind === 'showcase') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 58, 13);
    g.fillStyle(0x5a3f2b, 1).fillRect(-25, -39, 5, 40).fillRect(20, -39, 5, 40);
    g.fillStyle(0xa77a4e, 1).fillRect(-23, -42, 46, 5);
    g.fillStyle(0xcdbf99, 1).fillRect(-21, -38, 19, 26).fillRect(2, -38, 19, 26);
    g.fillStyle(0x667865, 1).fillRect(-19, -35, 10, 8).fillRect(5, -24, 12, 7);
    g.fillStyle(0xb66f55, 1).fillRect(-16, -22, 11, 7).fillRect(7, -35, 10, 8);
    g.fillStyle(0xd6b861, 1).fillRect(-25, -48, 50, 7);
    g.fillStyle(0x73816d, 1).fillRect(-23, -51, 46, 5);
  } else if (def.kind === 'clubboard') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 58, 13);
    g.fillStyle(0x5b3e2b, 1).fillRect(-24, -43, 5, 44).fillRect(19, -43, 5, 44);
    g.fillStyle(0x6a7666, 1).fillRect(-21, -42, 42, 31);
    g.fillStyle(0xd9c9a6, 1).fillRect(-17, -37, 12, 9).fillRect(3, -37, 14, 9)
      .fillRect(-17, -23, 13, 8).fillRect(4, -23, 13, 8);
    g.fillStyle(0xb86d53, 1).fillRect(-14, -35, 5, 3).fillRect(7, -21, 6, 3);
    g.fillStyle(0x9b7848, 1).fillRect(-25, -49, 50, 7);
    g.fillStyle(0x7a856f, 1).fillRect(-23, -52, 46, 5);
  } else if (def.kind === 'guidekiosk') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 66, 14);
    g.fillStyle(0x5c402b, 1).fillRect(-27, -43, 5, 44).fillRect(22, -43, 5, 44);
    g.fillStyle(0x9b7448, 1).fillRect(-30, -48, 60, 7);
    g.fillStyle(0x74816f, 1).fillPoints(points([
      { x: -30, y: -48 }, { x: 30, y: -48 }, { x: 23, y: -38 }, { x: -23, y: -38 },
    ]), true);
    g.fillStyle(0xd8c8a5, 1).fillRect(-19, -35, 38, 23);
    g.fillStyle(0x7d8d78, 1).fillRect(-15, -31, 8, 6).fillRect(6, -27, 7, 6);
    g.fillStyle(0xb56f55, 1).fillRect(-3, -32, 7, 5).fillRect(-12, -20, 8, 5);
    g.fillStyle(0x9a7145, 1).fillRect(-29, -10, 58, 8);
    g.fillStyle(0xe3d5b7, 1).fillRect(-21, -8, 10, 7).fillRect(-5, -8, 10, 7).fillRect(11, -8, 10, 7);
  } else if (def.kind === 'finderkiosk') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 58, 13);
    g.fillStyle(0x543923, 1).fillRect(-24, -46, 48, 47);
    g.fillStyle(0x75806d, 1).fillPoints(points([
      { x: -28, y: -48 }, { x: 28, y: -48 }, { x: 21, y: -39 }, { x: -21, y: -39 },
    ]), true);
    g.fillStyle(0xd8c8a7, 1).fillRect(-18, -36, 36, 21);
    g.fillStyle(0x9a7145, 1).fillRect(-22, -11, 44, 11);
    for (let col = 0; col < 3; col += 1) g.fillStyle(0xe3d5b7, 1).fillRect(-17 + col * 13, -9, 9, 6);
    g.lineStyle(3, 0xc39a50, 1).strokeCircle(0, -47, 6);
    g.lineStyle(3, 0xc39a50, 1).lineBetween(4, -43, 9, -38);
  } else if (def.kind === 'museumcabinet') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 72, 15);
    g.fillStyle(0x5b3d29, 1).fillRect(-31, -46, 6, 47).fillRect(25, -46, 6, 47);
    g.fillStyle(0x78816d, 1).fillPoints(points([
      { x: -34, y: -50 }, { x: 34, y: -50 }, { x: 28, y: -41 }, { x: -28, y: -41 },
    ]), true);
    g.fillStyle(0xa47749, 1).fillRect(-34, -43, 68, 5);
    for (let row = 0; row < 2; row += 1) for (let col = 0; col < 4; col += 1) {
      const x = -27 + col * 14;
      const y = -36 + row * 17;
      g.fillStyle(0x465158, 1).fillRect(x, y, 12, 14);
      g.fillStyle([0x9d6d5d, 0x84765d, 0x6f8068, 0x61797d][col]!, 1).fillRect(x + 3, y + 5, 6, 5);
      g.lineStyle(1, 0xb99455, .9).strokeRect(x, y, 12, 14);
    }
    g.fillStyle(0x9b7548, 1).fillRect(-33, -3, 66, 5);
    for (let col = 0; col < 6; col += 1) g.fillStyle(0xd9c9a7, 1).fillRect(-28 + col * 10, -8, 7, 5);
  } else if (def.kind === 'projectboard') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 66, 14);
    g.fillStyle(0x5c402b, 1).fillRect(-29, -30, 5, 32).fillRect(24, -30, 5, 32);
    g.fillStyle(0x98724a, 1).fillRect(-31, -33, 62, 7);
    g.fillStyle(0xd9ceb7, 1).fillPoints(points([
      { x: -22, y: -29 }, { x: 21, y: -29 }, { x: 18, y: -8 }, { x: -25, y: -8 },
    ]), true);
    g.fillStyle(0x738071, 1).fillRect(-23, -44, 47, 7);
    g.fillStyle(0x9a7650, 1).fillRect(-27, -38, 55, 5);
    g.fillStyle(0xb56d55, 1).fillRect(-18, -24, 10, 8);
    g.fillStyle(0x667d80, 1).fillRect(-4, -24, 10, 8);
    g.fillStyle(0x718167, 1).fillRect(10, -24, 10, 8);
  } else if (def.kind === 'marketboard') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 72, 15);
    g.fillStyle(0x5a3d2e, 1).fillRect(-31, -39, 5, 40).fillRect(26, -39, 5, 40);
    g.fillStyle(0xb96d5b, 1).fillRect(-34, -46, 68, 8);
    for (let x = -34; x < 34; x += 12) g.fillStyle(x % 24 ? 0xe0bd7f : 0xefe0bd, 1).fillRect(x, -46, 7, 8);
    g.fillStyle(0x9a7049, 1).fillRect(-28, -20, 56, 7);
    g.fillStyle(0xdac9a7, 1).fillRect(-26, -35, 52, 15);
    g.fillStyle(0x6e806e, 1).fillRect(-21, -31, 12, 8);
    g.fillStyle(0x8c6b85, 1).fillRect(-5, -31, 12, 8);
    g.fillStyle(0xc17c5d, 1).fillRect(11, -31, 12, 8);
    g.fillStyle(0xd9b966, 1).fillRect(-31, -52, 62, 4);
    for (let x = -27; x <= 27; x += 9) g.fillStyle(0xf1d886, 1).fillRect(x, -56, 3, 3);
  } else if (def.kind === 'weatherstation') {
    g.fillStyle(0x211b17, 0.2).fillEllipse(0, 2, 64, 14);
    g.fillStyle(0x4b3d43, 1).fillRect(-25, -42, 50, 43);
    g.fillStyle(0x7c6973, 1).fillPoints(points([
      { x: -30, y: -45 }, { x: 30, y: -45 }, { x: 23, y: -36 }, { x: -23, y: -36 },
    ]), true);
    g.fillStyle(0xd8cfbb, 1).fillRect(-19, -33, 38, 22);
    g.fillStyle(0x5b7180, 1).fillRect(-15, -29, 30, 13);
    g.fillStyle(0xe7c77e, .9).fillCircle(4, -24, 5);
    g.fillStyle(0xaab9b7, 1).fillRect(-13, -21, 11, 3).fillRect(2, -18, 12, 3);
    g.fillStyle(0x9a7149, 1).fillRect(-28, -8, 56, 9);
    g.fillStyle(0x3c343b, 1).fillRect(-2, -59, 4, 15);
    g.lineStyle(2, 0xdcc77c, 1).strokeCircle(0, -62, 8);
    g.lineBetween(-9, -62, 9, -62).lineBetween(0, -71, 0, -53);
    g.fillStyle(0xd28791, 1).fillRect(-29, -50, 58, 5);
  } else {
    g.fillStyle(0x211b17, 0.18).fillEllipse(0, 2, 15, 5);
    g.fillStyle(0x3f5857, 1).fillRect(-6, -15, 12, 16);
    g.fillStyle(0x6d8580, 1).fillRect(-5, -13, 10, 3);
    g.fillStyle(0x263c3c, 1).fillRect(-7, -17, 14, 4);
  }
  return scene.add.container(p.x, p.y, [g]).setDepth(isoDepth({ tx: def.tx, ty: def.ty, w: 1, h: 1 }, 45));
}

/** 함께짓기 완성 단계가 누적될수록 설계소 주변에 다섯 장소의 재료 표식이 하나씩 켜진다. */
export function drawIsoCommunityProjectProgress(
  scene: Phaser.Scene, tx: number, ty: number, completedPhases: number,
): Phaser.GameObjects.Container {
  const p = projectIso(tx + 0.5, ty + 0.5);
  const g = scene.add.graphics();
  const milestones = [4, 8, 12, 16, 20];
  const colors = [0x75836f, 0x607d80, 0xa97858, 0x8a765d, 0xb36f58];
  for (let index = 0; index < milestones.length; index += 1) {
    const x = -38 + index * 19;
    const lit = completedPhases >= milestones[index]!;
    g.fillStyle(0x4e3a2b, 1).fillRect(x, -15, 2, 17);
    g.fillStyle(lit ? colors[index]! : 0x9f9687, lit ? 1 : .45).fillRect(x + 2, -14, 10, 7);
    if (lit) g.fillStyle(0xf0d18a, .9).fillRect(x + 4, -12, 3, 2);
  }
  if (completedPhases >= 20) {
    g.fillStyle(0xf0c875, .24).fillCircle(0, -24, 18);
    g.fillStyle(0xf4d99a, 1).fillRect(-3, -28, 6, 5);
  }
  return scene.add.container(p.x, p.y, [g])
    .setDepth(isoDepth({ tx, ty, w: 1, h: 1 }, 70));
}

export function drawIsoTileHighlight(
  graphics: Phaser.GameObjects.Graphics,
  tx: number,
  ty: number,
): void {
  graphics.clear();
  const corners = projectFootprint({ tx, ty, w: 1, h: 1 });
  graphics.fillStyle(0xf2c25c, 0.24).fillPoints(points(corners), true);
  graphics.lineStyle(2, 0xffe7a3, 0.9).strokePoints(points(corners), true);
  graphics.setDepth(isoDepth({ tx, ty, w: 1, h: 1 }, 800));
}
