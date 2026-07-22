import { describe, it, expect } from 'vitest';
import { buildCollision, SOLID_RECTS, SOLID_PROPS, HOUSE_DOORS, SHOP_DOORS, CAFE_DOORS,
  INTERIOR_DOORS, BUSKING_SPOT, OMOK_SPOT, BOARD_SPOT, CLAW_SPOT, PHOTO_SPOT,
  BUNGEO_SPOT, REALTY_DOOR, SPAWN_TILE } from '../src/game/world/mapData';
import { TILE } from '../src/game/config';
import { stepPlayer } from '../src/game/entities/playerMotion';
import { worldToTile } from '../src/game/world/grid';

const BOX = { hw: 8, hh: 11 };
const grid = buildCollision();

/** 타일 중앙에서 지정 방향으로 최대 dur ms 걸어 최종 타일 반환 */
function walk(fromTx: number, fromTy: number, dir: 'up' | 'down' | 'left' | 'right', steps = 60) {
  let pos = { x: fromTx * TILE + TILE / 2, y: fromTy * TILE + TILE / 2 };
  const input = { up: dir === 'up', down: dir === 'down', left: dir === 'left', right: dir === 'right' };
  for (let i = 0; i < steps; i++) pos = stepPlayer(pos, input, 16, grid, BOX);
  return worldToTile(pos.x, pos.y);
}

describe('충돌 정합성 감사', () => {
  it('스폰 지점은 통행 가능', () => {
    expect(grid.isSolid(SPAWN_TILE.tx, SPAWN_TILE.ty)).toBe(false);
  });

  it('모든 문 타일과 그 접근 타일(아래)이 통행 가능', () => {
    const doors = [
      ...HOUSE_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `house${d.roomId}` })),
      ...SHOP_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `shop:${d.shop}` })),
      ...CAFE_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: 'cafe' })),
      { tx: REALTY_DOOR.tx, ty: REALTY_DOOR.ty, kind: 'realty' },
      ...INTERIOR_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `interior:${d.shop}` })),
    ];
    const bad: string[] = [];
    for (const d of doors) {
      if (grid.isSolid(d.tx, d.ty)) bad.push(`${d.kind} 문(${d.tx},${d.ty}) 자체가 막힘`);
      if (grid.isSolid(d.tx, d.ty + 1)) bad.push(`${d.kind} 문 접근(${d.tx},${d.ty + 1}) 막힘`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('활동 스팟(버스킹·오목·게시판·인형뽑기·네컷·붕어빵)은 통행 가능하고 접근로도 열림', () => {
    const spots = [['busking', BUSKING_SPOT], ['omok', OMOK_SPOT], ['board', BOARD_SPOT],
      ['claw', CLAW_SPOT], ['photo', PHOTO_SPOT], ['bungeo', BUNGEO_SPOT]] as const;
    for (const [n, s] of spots) {
      expect(grid.isSolid(s.tx, s.ty), `${n} 스팟(${s.tx},${s.ty})`).toBe(false);
      // 최소 한 방향은 접근 가능해야 (사방이 막혀 고립되면 안 됨)
      const open = ([[0, 1], [0, -1], [1, 0], [-1, 0]] as const)
        .some(([dx, dy]) => !grid.isSolid(s.tx + dx, s.ty + dy));
      expect(open, `${n} 스팟 사방 고립`).toBe(true);
    }
  });

  it('기계 몸체(SOLID_PROPS)는 실제로 솔리드', () => {
    for (const r of SOLID_PROPS) {
      expect(grid.isSolid(r.x, r.y), `prop(${r.x},${r.y})`).toBe(true);
    }
  });

  it('문 아래에서 위로 걸으면 실제로 문 타일에 도달한다 (걸려 못 들어가는 문 탐지)', () => {
    const doors = [
      ...HOUSE_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `house${d.roomId}` })),
      ...INTERIOR_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `interior:${d.shop}` })),
      ...SHOP_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: `shop:${d.shop}` })),
      ...CAFE_DOORS.map((d) => ({ tx: d.tx, ty: d.ty, kind: 'cafe' })),
    ];
    const stuck: string[] = [];
    for (const d of doors) {
      // 접근 타일이 막혀 있으면 이 케이스는 위 테스트에서 이미 잡힘 — 여기선 도달성만
      if (grid.isSolid(d.tx, d.ty + 1)) continue;
      const end = walk(d.tx, d.ty + 1, 'up', 40);
      if (!(end.tx === d.tx && end.ty === d.ty)) {
        stuck.push(`${d.kind}: 문(${d.tx},${d.ty}) 접근 실패 → 도달 (${end.tx},${end.ty})`);
      }
    }
    expect(stuck, stuck.join('\n')).toEqual([]);
  });

  it('건물 벽면은 통과 불가 (뚫린 건물 탐지) — 각 건물 아래에서 위로 걸어도 건물 안으로 못 들어감', () => {
    const doorSet = new Set([
      ...HOUSE_DOORS, ...SHOP_DOORS, ...CAFE_DOORS, ...INTERIOR_DOORS, REALTY_DOOR,
    ].map((d) => `${d.tx},${d.ty}`));
    const leaky: string[] = [];
    SOLID_RECTS.forEach((r, i) => {
      if (i < 4) return; // 테두리
      // 건물 하단 각 열에서, 문이 아닌 곳으로 아래에서 진입 시도
      const belowTy = r.y + r.h; // 건물 바로 아래 행
      if (belowTy >= grid.height - 1) return;
      for (let tx = r.x; tx < r.x + r.w; tx++) {
        if (doorSet.has(`${tx},${r.y + r.h - 1}`)) continue; // 문 열은 통과 정상
        if (grid.isSolid(tx, belowTy)) continue; // 접근 자체가 막힘(다른 건물) — 스킵
        const end = walk(tx, belowTy, 'up', 30);
        // 건물 내부(r.y..r.y+h-1)로 침투했으면 누수
        if (end.ty <= r.y + r.h - 1 && end.tx >= r.x && end.tx < r.x + r.w) {
          leaky.push(`건물#${i}(${r.x},${r.y},${r.w}x${r.h}) 열 ${tx}에서 내부 침투 → (${end.tx},${end.ty})`);
        }
      }
    });
    expect(leaky, leaky.join('\n')).toEqual([]);
  });
});
