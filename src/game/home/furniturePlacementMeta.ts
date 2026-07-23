import { TILE } from '../config';
import { CATALOG_BY_ID } from '../../items/catalog';
import { layerOf, sizeOf, type Placed, type Rot } from '../entities/placement';

export type FurnitureSurface = 'floor' | 'rug' | 'wall';
export type FurnitureAnchor = 'floor-baseline' | 'floor-center' | 'wall-baseline';

export interface FurniturePlacementMeta {
  surface: FurnitureSurface;
  anchor: FurnitureAnchor;
  /** 절차형 스프라이트가 점유 바닥 위로 솟는 추가 픽셀 높이. */
  risePx: number;
  /** 캐릭터와 앞뒤가 갈릴 때 사용하는 시각적 가림 높이. */
  occlusionPx: number;
  castsShadow: boolean;
  rotatable: boolean;
}

const RISE_BY_ARCH: Readonly<Record<string, number>> = {
  bed: 5, table: 9, seat: 11, sofa: 12, shelf: 24, wardrobe: 28, mirror: 20,
  hanger: 24, counter: 15, screen: 18, appliance: 18, lamp: 22, plant: 18,
  vase: 10, garden: 13, tank: 12, instrument: 20, cattower: 23, doll: 8,
};

/** 모든 카탈로그 가구에 결정적인 표면·앵커·높이 프로필을 부여한다. */
export function furniturePlacementMeta(itemId: string): FurniturePlacementMeta | null {
  const item = CATALOG_BY_ID.get(itemId);
  if (!item) return null;
  const surface = layerOf(itemId);
  if (surface === 'wall') {
    return { surface, anchor: 'wall-baseline', risePx: 0, occlusionPx: 0, castsShadow: false, rotatable: false };
  }
  if (surface === 'rug') {
    return { surface, anchor: 'floor-center', risePx: 0, occlusionPx: 0, castsShadow: false, rotatable: true };
  }
  const risePx = RISE_BY_ARCH[item.arch] ?? 10;
  return {
    surface, anchor: 'floor-baseline', risePx, occlusionPx: Math.max(8, risePx),
    castsShadow: true, rotatable: true,
  };
}

export interface FurnitureRenderPose {
  x: number;
  baselineY: number;
  depth: number;
  shadowX: number;
  shadowY: number;
  shadowW: number;
}

/** 점유 바닥의 남쪽 기준선에 스프라이트를 고정해 높이가 달라도 발이 뜨지 않게 한다. */
export function furnitureRenderPose(placed: Pick<Placed, 'itemId' | 'tx' | 'ty' | 'rot'>): FurnitureRenderPose | null {
  const size = sizeOf(placed.itemId, placed.rot);
  const meta = furniturePlacementMeta(placed.itemId);
  if (!size || !meta) return null;
  const x = placed.tx * TILE;
  const floorBaseline = (placed.ty + size.h) * TILE;
  const baselineY = meta.surface === 'wall' ? floorBaseline - 22 : floorBaseline;
  const baseDepth = meta.surface === 'rug' ? 4 : meta.surface === 'wall' ? 6 : 10;
  const depth = baseDepth + floorBaseline / 10_000 + placed.tx / 1_000_000;
  return {
    x, baselineY, depth,
    shadowX: x + size.w * TILE / 2,
    shadowY: floorBaseline - 3,
    shadowW: Math.max(14, size.w * TILE - 8),
  };
}

/** 캐릭터와 펫도 같은 남쪽 기준선 규칙을 사용한다. */
export function roomActorDepth(worldY: number): number { return 10 + worldY / 10_000 + .0005; }

/** 방향 2/3은 기존 0/1 자산을 좌우 반전해 호환 가능한 네 방향 외형을 만든다. */
export function sourceRotation(rot: Rot): { source: 0 | 1; mirror: boolean } {
  return { source: (rot % 2) as 0 | 1, mirror: rot >= 2 };
}
