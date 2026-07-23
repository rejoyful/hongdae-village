import { describe, expect, it } from 'vitest';
import { CATALOG } from '../src/items/catalog';
import {
  furniturePlacementMeta, furnitureRenderPose, roomActorDepth, sourceRotation,
} from '../src/game/home/furniturePlacementMeta';

describe('2.5D 가구 배치 메타', () => {
  it('카탈로그 모든 항목이 표면·앵커·높이 프로필을 가진다', () => {
    const profiles = CATALOG.map((item) => furniturePlacementMeta(item.id));
    expect(profiles.every(Boolean)).toBe(true);
    expect(profiles.filter((profile) => profile?.surface === 'wall').every((profile) => !profile?.rotatable)).toBe(true);
    expect(profiles.filter((profile) => profile?.surface === 'floor').every((profile) => profile!.castsShadow && profile!.risePx > 0)).toBe(true);
  });

  it('높은 수납장은 침대보다 더 솟고 러그는 바닥 높이를 유지한다', () => {
    expect(furniturePlacementMeta('bookshelf')!.risePx).toBeGreaterThan(furniturePlacementMeta('bed_basic')!.risePx);
    expect(furniturePlacementMeta('rug_cream')).toMatchObject({ risePx: 0, castsShadow: false, anchor: 'floor-center' });
  });

  it('스프라이트는 점유 바닥의 남쪽 기준선에 고정되고 y가 클수록 앞에 그려진다', () => {
    const north = furnitureRenderPose({ itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 })!;
    const south = furnitureRenderPose({ itemId: 'bed_basic', tx: 2, ty: 4, rot: 0 })!;
    expect(north.baselineY).toBe((2 + 3) * 32);
    expect(south.depth).toBeGreaterThan(north.depth);
    expect(roomActorDepth(south.baselineY)).toBeGreaterThan(roomActorDepth(north.baselineY));
  });

  it('남·서는 기존 북·동 자산을 좌우 반전하는 호환 규칙을 쓴다', () => {
    expect(sourceRotation(0)).toEqual({ source: 0, mirror: false });
    expect(sourceRotation(1)).toEqual({ source: 1, mirror: false });
    expect(sourceRotation(2)).toEqual({ source: 0, mirror: true });
    expect(sourceRotation(3)).toEqual({ source: 1, mirror: true });
  });
});
