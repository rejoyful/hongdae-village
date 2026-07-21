import { TILE } from '../config';

export interface Vec2 { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number } // 타일 단위

export function tileToWorld(tx: number, ty: number): Vec2 {
  return { x: tx * TILE, y: ty * TILE };
}

export function worldToTile(x: number, y: number): { tx: number; ty: number } {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

/** 타일 단위 충돌 맵. 맵 경계 밖은 항상 솔리드. */
export class CollisionGrid {
  private constructor(
    readonly width: number,
    readonly height: number,
    private readonly solid: Uint8Array,
  ) {}

  static fromRects(
    width: number,
    height: number,
    rects: Rect[],
    holes: Array<{ tx: number; ty: number }> = [],
  ): CollisionGrid {
    const solid = new Uint8Array(width * height);
    for (const r of rects) {
      for (let ty = r.y; ty < r.y + r.h; ty++) {
        for (let tx = r.x; tx < r.x + r.w; tx++) {
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) solid[ty * width + tx] = 1;
        }
      }
    }
    // 구멍(문 등)은 채운 뒤 뚫는다
    for (const h of holes) {
      if (h.tx >= 0 && h.tx < width && h.ty >= 0 && h.ty < height) solid[h.ty * width + h.tx] = 0;
    }
    return new CollisionGrid(width, height, solid);
  }

  isSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    return this.solid[ty * this.width + tx] === 1;
  }

  isSolidAtWorld(x: number, y: number): boolean {
    const { tx, ty } = worldToTile(x, y);
    return this.isSolid(tx, ty);
  }
}
