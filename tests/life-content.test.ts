import { describe, it, expect } from 'vitest';
import { newClaw, tickClaw, dropClaw, CLAW_TOLERANCE } from '../src/game/entities/clawGame';
import { pickLine, slotForHour, cohortForIndex, COHORT_LINES, SLOT_LINES } from '../src/game/entities/npcChatter';
import { seeded } from '../src/game/art/pixelCanvas';
import { INTERIORS } from '../src/game/world/interiors';
import { CollisionGrid } from '../src/game/world/grid';

describe('인형뽑기 로직', () => {
  it('크레인은 0~1 레일 안에서 반사하며 움직인다', () => {
    let s = newClaw(seeded(1));
    for (let i = 0; i < 500; i++) {
      s = tickClaw(s);
      expect(s.cranePos).toBeGreaterThanOrEqual(0);
      expect(s.cranePos).toBeLessThanOrEqual(1);
    }
  });

  it('인형 위에서 집으면 성공, 멀면 실패', () => {
    const base = newClaw(seeded(2));
    const onTarget = { ...base, cranePos: base.dollPos };
    expect(dropClaw(onTarget, seeded(2)).result).toBe('win');
    const far = { ...base, cranePos: Math.min(1, base.dollPos + CLAW_TOLERANCE + 0.2) };
    expect(dropClaw(far, seeded(2)).result).toBe('miss');
  });

  it('성공 시 인형 상품이 배정된다', () => {
    const s = newClaw(seeded(3));
    const win = dropClaw({ ...s, cranePos: s.dollPos }, seeded(3));
    expect(win.prize).toBeTruthy();
  });
});

describe('NPC 대사 (세대·시간대)', () => {
  it('시간대 슬롯이 시각별로 나뉜다', () => {
    expect(slotForHour(5)).toBe('dawn');
    expect(slotForHour(9)).toBe('morning');
    expect(slotForHour(14)).toBe('day');
    expect(slotForHour(18)).toBe('sunset');
    expect(slotForHour(23)).toBe('night');
    expect(slotForHour(2)).toBe('night');
  });

  it('세대는 인덱스로 고루 배정된다', () => {
    const seen = new Set(Array.from({ length: 8 }, (_, i) => cohortForIndex(i)));
    expect(seen.has('mz')).toBe(true);
    expect(seen.has('teen')).toBe(true);
    expect(seen.has('senior')).toBe(true);
    expect(seen.has('adult')).toBe(true);
  });

  it('pickLine은 항상 실제 대사 풀에서 뽑는다', () => {
    const all = new Set([...Object.values(COHORT_LINES).flat(), ...Object.values(SLOT_LINES).flat()]);
    for (let i = 0; i < 200; i++) {
      const line = pickLine(cohortForIndex(i), slotForHour(i % 24), seeded(i + 1));
      expect(all.has(line), line).toBe(true);
    }
  });
});

describe('인테리어 콘텐츠 정합성', () => {
  it('모든 상가에 사람과 상호작용 스팟이 있다', () => {
    for (const def of Object.values(INTERIORS)) {
      expect(def.npcs.length, `${def.name} npcs`).toBeGreaterThanOrEqual(1);
      expect(def.spots.length, `${def.name} spots`).toBeGreaterThanOrEqual(3);
    }
  });

  it('사람·스팟·스폰이 벽/구조물과 겹치지 않는다', () => {
    for (const def of Object.values(INTERIORS)) {
      const doorTx = Math.floor(def.w / 2);
      const grid = CollisionGrid.fromRects(def.w, def.h, [
        { x: 0, y: 0, w: def.w, h: 1 },
        { x: 0, y: def.h - 1, w: doorTx, h: 1 },
        { x: doorTx + 1, y: def.h - 1, w: def.w - doorTx - 1, h: 1 },
        { x: 0, y: 0, w: 1, h: def.h },
        { x: def.w - 1, y: 0, w: 1, h: def.h },
        ...def.solids,
      ]);
      const spawn = { tx: doorTx, ty: def.h - 2 };
      expect(grid.isSolid(spawn.tx, spawn.ty), `${def.name} 스폰`).toBe(false);
      for (const n of def.npcs) expect(grid.isSolid(n.tx, n.ty), `${def.name} npc ${n.name}`).toBe(false);
      for (const s of def.spots) {
        expect(grid.isSolid(s.tx, s.ty), `${def.name} spot ${s.label}`).toBe(false);
        // 스폰 타일과 겹치면 입장 즉시 트리거되므로 금지
        expect(!(s.tx === spawn.tx && s.ty === spawn.ty), `${def.name} spot ${s.label} 스폰겹침`).toBe(true);
      }
    }
  });
});
