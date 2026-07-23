export type IsoTerrain = 'grass' | 'alley' | 'road' | 'plaza' | 'wild';

/** 같은 월드 좌표는 실행 순서와 렌더 환경에 관계없이 같은 미세 재질을 얻는다. */
export function isoTerrainHash(tx: number, ty: number, salt = 0): number {
  let value = Math.imul(tx + 0x7ed55d16, 0x85ebca6b) ^ Math.imul(ty + salt + 0xc761c23c, 0xc2b2ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x27d4eb2d);
  return (value ^ (value >>> 15)) >>> 0;
}
