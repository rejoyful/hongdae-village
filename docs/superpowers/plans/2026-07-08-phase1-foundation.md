# 홍대마을 Phase 1 — 파운데이션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WASD+마우스로 걸어다닐 수 있는 홍대 거리 블록아웃(placeholder 그래픽)을 브라우저에서 실행하고, 타입체크·테스트 CI까지 갖춘 프로젝트 기반을 만든다.

**Architecture:** Phaser 3 씬은 얇게 유지하고 게임 로직(그리드, 이동, 클릭 판정)은 순수 TypeScript 모듈로 분리해 Vitest로 TDD한다. 그래픽은 Phaser Graphics로 런타임 생성(실제 픽셀아트는 Phase 5에서 교체). 맵은 존(zone) 사각형 데이터 → 충돌 그리드로 빌드한다.

**Tech Stack:** Phaser 3, TypeScript(strict), Vite, Vitest, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-07-08-hongdae-village-design.md` §2(월드 블록아웃), §6(클라이언트 골격), §8(단위 테스트·CI)

---

## 파일 구조

```
hongdae-village/
├── index.html                        # Vite 엔트리
├── package.json / tsconfig.json / vite.config.ts
├── src/
│   ├── main.ts                       # Phaser.Game 부트스트랩
│   └── game/
│       ├── config.ts                 # 상수 (타일 크기, 속도, 줌)
│       ├── world/
│       │   ├── grid.ts               # 타일↔월드 변환, CollisionGrid
│       │   └── mapData.ts            # 시즌1 거리 블록아웃 (존·충돌 사각형)
│       ├── entities/
│       │   └── playerMotion.ts       # 순수 이동 로직 (WASD→위치, 충돌 슬라이드)
│       ├── input/
│       │   └── pointer.ts            # 화면 좌표→타일 좌표 (카메라 보정)
│       └── scenes/
│           └── StreetScene.ts        # 렌더링·입력 배선만 담당하는 얇은 씬
├── tests/
│   ├── grid.test.ts
│   ├── mapData.test.ts
│   ├── playerMotion.test.ts
│   └── pointer.test.ts
└── .github/workflows/ci.yml
```

---

### Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/game/config.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "hongdae-village",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: vite.config.ts 작성**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as ReturnType<typeof defineConfig>);
```

주의: `test` 필드는 Vitest가 읽는다. 타입 에러가 나면 파일 상단을 `import { defineConfig } from 'vitest/config';`로 바꾼다 (Vitest 2.x 권장 방식).

- [ ] **Step 4: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>홍대마을</title>
    <style>
      html, body { margin: 0; padding: 0; background: #1a1713; height: 100%; }
      #game { width: 100vw; height: 100vh; }
      canvas { image-rendering: pixelated; }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: src/game/config.ts 작성**

```ts
/** 게임 전역 상수 — 스펙 §4(32px 타일·2배 렌더), §3(조작) */
export const TILE = 32;          // 기준 타일 픽셀
export const ZOOM = 2;           // 화면 2배 확대 렌더링
export const PLAYER_SPEED = 140; // px/초 (월드 좌표 기준)
export const MAP_W = 80;         // 시즌1 맵 타일 크기 (스펙 §2)
export const MAP_H = 60;
```

- [ ] **Step 6: src/main.ts 스텁 작성** (씬은 Task 6에서 — 지금은 빈 캔버스 부팅만)

```ts
import Phaser from 'phaser';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1713',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
  });
}

createGame('game');
```

- [ ] **Step 7: 설치 및 부팅 확인**

Run: `npm install && npm run typecheck`
Expected: 에러 없이 종료 (exit 0)

Run: `npm run dev` (백그라운드) 후 브라우저에서 `http://localhost:5173` 접속
Expected: 어두운 배경의 빈 캔버스, 콘솔에 Phaser 배너 출력

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: Phaser+TS+Vite 프로젝트 스캐폴드"
```

---

### Task 2: 그리드 모듈 (타일↔월드 변환, 충돌 그리드)

**Files:**
- Create: `src/game/world/grid.ts`
- Test: `tests/grid.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/grid.test.ts
import { describe, it, expect } from 'vitest';
import { tileToWorld, worldToTile, CollisionGrid, type Rect } from '../src/game/world/grid';

describe('tile/world 변환', () => {
  it('타일 좌표를 월드 픽셀(타일 좌상단)로 변환한다', () => {
    expect(tileToWorld(0, 0)).toEqual({ x: 0, y: 0 });
    expect(tileToWorld(3, 2)).toEqual({ x: 96, y: 64 });
  });

  it('월드 픽셀을 타일 좌표로 변환한다 (내림)', () => {
    expect(worldToTile(0, 0)).toEqual({ tx: 0, ty: 0 });
    expect(worldToTile(95.9, 64)).toEqual({ tx: 2, ty: 2 });
  });
});

describe('CollisionGrid', () => {
  const rects: Rect[] = [{ x: 2, y: 2, w: 3, h: 2 }]; // 타일 (2,2)~(4,3) 솔리드
  const grid = CollisionGrid.fromRects(10, 8, rects);

  it('사각형 내부는 솔리드다', () => {
    expect(grid.isSolid(2, 2)).toBe(true);
    expect(grid.isSolid(4, 3)).toBe(true);
  });

  it('사각형 밖은 통행 가능하다', () => {
    expect(grid.isSolid(1, 2)).toBe(false);
    expect(grid.isSolid(5, 3)).toBe(false);
  });

  it('맵 밖은 항상 솔리드다', () => {
    expect(grid.isSolid(-1, 0)).toBe(true);
    expect(grid.isSolid(10, 0)).toBe(true);
    expect(grid.isSolid(0, 8)).toBe(true);
  });

  it('월드 좌표(픽셀)로도 질의할 수 있다', () => {
    expect(grid.isSolidAtWorld(2 * 32 + 1, 2 * 32 + 1)).toBe(true);
    expect(grid.isSolidAtWorld(0, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- tests/grid.test.ts`
Expected: FAIL — `Cannot find module '../src/game/world/grid'`

- [ ] **Step 3: 구현**

```ts
// src/game/world/grid.ts
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

  static fromRects(width: number, height: number, rects: Rect[]): CollisionGrid {
    const solid = new Uint8Array(width * height);
    for (const r of rects) {
      for (let ty = r.y; ty < r.y + r.h; ty++) {
        for (let tx = r.x; tx < r.x + r.w; tx++) {
          if (tx >= 0 && tx < width && ty >= 0 && ty < height) solid[ty * width + tx] = 1;
        }
      }
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- tests/grid.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/world/grid.ts tests/grid.test.ts
git commit -m "feat: 타일 그리드·충돌 맵 모듈"
```

---

### Task 3: 시즌1 거리 블록아웃 데이터

**Files:**
- Create: `src/game/world/mapData.ts`
- Test: `tests/mapData.test.ts`

스펙 §2의 6개 구역을 placeholder 색 블록으로 배치한다. 실제 타일아트는 Phase 5에서 교체하므로 여기서는 존 사각형 + 건물 충돌 사각형만 정의한다.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/mapData.test.ts
import { describe, it, expect } from 'vitest';
import { ZONES, buildCollision, SPAWN_TILE } from '../src/game/world/mapData';
import { MAP_W, MAP_H } from '../src/game/config';

describe('시즌1 블록아웃', () => {
  it('스펙 §2의 7개 구역이 모두 존재한다', () => {
    const names = ZONES.map((z) => z.name);
    for (const required of ['경의선 숲길', '주택 골목 (서)', '주택 골목 (동)', '메인 스트리트', '포차 골목', '홍대입구역 9번 출구', '벽화 골목']) {
      expect(names).toContain(required);
    }
  });

  it('모든 존은 맵 범위 안에 있다', () => {
    for (const z of ZONES) {
      expect(z.rect.x).toBeGreaterThanOrEqual(0);
      expect(z.rect.y).toBeGreaterThanOrEqual(0);
      expect(z.rect.x + z.rect.w).toBeLessThanOrEqual(MAP_W);
      expect(z.rect.y + z.rect.h).toBeLessThanOrEqual(MAP_H);
    }
  });

  it('스폰 지점(역 광장)은 통행 가능하다', () => {
    const grid = buildCollision();
    expect(grid.isSolid(SPAWN_TILE.tx, SPAWN_TILE.ty)).toBe(false);
  });

  it('맵 테두리는 벽이다', () => {
    const grid = buildCollision();
    expect(grid.isSolid(0, 30)).toBe(true);
    expect(grid.isSolid(MAP_W - 1, 30)).toBe(true);
    expect(grid.isSolid(40, 0)).toBe(true);
    expect(grid.isSolid(40, MAP_H - 1)).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- tests/mapData.test.ts`
Expected: FAIL — `Cannot find module '../src/game/world/mapData'`

- [ ] **Step 3: 구현**

```ts
// src/game/world/mapData.ts
import { MAP_W, MAP_H } from '../config';
import { CollisionGrid, type Rect } from './grid';

export interface Zone { name: string; rect: Rect; color: number }

/** 시즌1 홍대입구역 일대 블록아웃 (스펙 §2). 색은 placeholder 무드 컬러. */
export const ZONES: Zone[] = [
  { name: '경의선 숲길',        rect: { x: 1,  y: 1,  w: 78, h: 8  }, color: 0x2f4a3a },
  { name: '주택 골목 (서)',     rect: { x: 1,  y: 10, w: 24, h: 17 }, color: 0x4a3a2f },
  { name: '주택 골목 (동)',     rect: { x: 55, y: 10, w: 24, h: 17 }, color: 0x4a3a2f },
  { name: '메인 스트리트',      rect: { x: 1,  y: 28, w: 78, h: 8  }, color: 0x3a3f52 },
  { name: '포차 골목',          rect: { x: 1,  y: 37, w: 22, h: 18 }, color: 0x523a4a },
  { name: '홍대입구역 9번 출구', rect: { x: 28, y: 37, w: 24, h: 18 }, color: 0x37424a },
  { name: '벽화 골목',          rect: { x: 57, y: 37, w: 22, h: 18 }, color: 0x3d4a37 },
];

/** 건물·구조물 풋프린트 (통행 불가). 실내 진입은 Phase 3에서. */
export const SOLID_RECTS: Rect[] = [
  // 맵 테두리 벽
  { x: 0, y: 0, w: MAP_W, h: 1 },
  { x: 0, y: MAP_H - 1, w: MAP_W, h: 1 },
  { x: 0, y: 0, w: 1, h: MAP_H },
  { x: MAP_W - 1, y: 0, w: 1, h: MAP_H },
  // 주택 골목 (서) — 개인 공간 5채
  { x: 3,  y: 12, w: 6, h: 4 }, { x: 12, y: 12, w: 6, h: 4 },
  { x: 3,  y: 20, w: 6, h: 4 }, { x: 12, y: 20, w: 6, h: 4 }, { x: 20, y: 16, w: 4, h: 6 },
  // 주택 골목 (동) — 개인 공간 5채
  { x: 57, y: 12, w: 6, h: 4 }, { x: 66, y: 12, w: 6, h: 4 },
  { x: 57, y: 20, w: 6, h: 4 }, { x: 66, y: 20, w: 6, h: 4 }, { x: 74, y: 16, w: 4, h: 6 },
  // 메인 스트리트 상점 4곳 (가구점·카페·편의점·잡화점) — 거리 남쪽 접면
  { x: 8,  y: 33, w: 8, h: 3 }, { x: 24, y: 33, w: 8, h: 3 },
  { x: 48, y: 33, w: 8, h: 3 }, { x: 64, y: 33, w: 8, h: 3 },
  // 역 출구 구조물
  { x: 36, y: 46, w: 8, h: 4 },
];

/** 스폰 지점: 역 출구 앞 광장 (스펙 §2) */
export const SPAWN_TILE = { tx: 40, ty: 42 };

export function buildCollision(): CollisionGrid {
  return CollisionGrid.fromRects(MAP_W, MAP_H, SOLID_RECTS);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- tests/mapData.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/world/mapData.ts tests/mapData.test.ts
git commit -m "feat: 시즌1 홍대 거리 블록아웃 데이터"
```

---

### Task 4: 플레이어 이동 로직 (순수 함수)

**Files:**
- Create: `src/game/entities/playerMotion.ts`
- Test: `tests/playerMotion.test.ts`

축 분리 이동(벽에 비비면 미끄러지는 표준 탑다운 이동), 대각선 정규화, AABB 4모서리 충돌.

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/playerMotion.test.ts
import { describe, it, expect } from 'vitest';
import { stepPlayer, type MoveInput } from '../src/game/entities/playerMotion';
import { CollisionGrid } from '../src/game/world/grid';
import { PLAYER_SPEED } from '../src/game/config';

const open = CollisionGrid.fromRects(20, 20, []);           // 빈 맵
const walled = CollisionGrid.fromRects(20, 20, [{ x: 5, y: 0, w: 1, h: 20 }]); // x=5 세로 벽
const BOX = { hw: 8, hh: 8 };
const idle: MoveInput = { up: false, down: false, left: false, right: false };

describe('stepPlayer', () => {
  it('입력이 없으면 제자리에 머문다', () => {
    expect(stepPlayer({ x: 100, y: 100 }, idle, 16, open, BOX)).toEqual({ x: 100, y: 100 });
  });

  it('오른쪽 입력 시 속도×시간만큼 이동한다', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true }, 1000, open, BOX);
    expect(next.x).toBeCloseTo(100 + PLAYER_SPEED);
    expect(next.y).toBe(100);
  });

  it('대각선 이동은 정규화되어 같은 속력이다', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true, down: true }, 1000, open, BOX);
    const dist = Math.hypot(next.x - 100, next.y - 100);
    expect(dist).toBeCloseTo(PLAYER_SPEED, 0);
  });

  it('벽을 통과하지 못한다', () => {
    // 벽(x타일=5 → 월드 160~192) 왼쪽에서 오른쪽으로 1초 이동해도 벽 앞에서 멈춘다
    const next = stepPlayer({ x: 130, y: 100 }, { ...idle, right: true }, 1000, walled, BOX);
    expect(next.x + BOX.hw).toBeLessThanOrEqual(160);
  });

  it('벽에 대각선으로 비비면 남은 축으로 미끄러진다', () => {
    const next = stepPlayer({ x: 150, y: 100 }, { ...idle, right: true, down: true }, 1000, walled, BOX);
    expect(next.x + BOX.hw).toBeLessThanOrEqual(160); // x는 벽에 막힘
    expect(next.y).toBeGreaterThan(100);              // y로는 진행
  });

  it('소수 이동량도 정확히 반영된다 (프레임레이트 독립)', () => {
    const next = stepPlayer({ x: 100, y: 100 }, { ...idle, right: true }, 16, open, BOX);
    expect(next.x).toBeCloseTo(100 + PLAYER_SPEED * 0.016, 5);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- tests/playerMotion.test.ts`
Expected: FAIL — `Cannot find module '../src/game/entities/playerMotion'`

- [ ] **Step 3: 구현**

```ts
// src/game/entities/playerMotion.ts
import { PLAYER_SPEED } from '../config';
import type { CollisionGrid, Vec2 } from '../world/grid';

export interface MoveInput { up: boolean; down: boolean; left: boolean; right: boolean }
export interface Aabb { hw: number; hh: number } // 중심 기준 half-extents(px)

function boxCollides(x: number, y: number, box: Aabb, grid: CollisionGrid): boolean {
  return (
    grid.isSolidAtWorld(x - box.hw, y - box.hh) ||
    grid.isSolidAtWorld(x + box.hw - 1, y - box.hh) ||
    grid.isSolidAtWorld(x - box.hw, y + box.hh - 1) ||
    grid.isSolidAtWorld(x + box.hw - 1, y + box.hh - 1)
  );
}

/**
 * 프레임당 이동. 축 분리 처리로 벽에 막힌 축만 취소되고 나머지 축은 진행(슬라이드).
 * 1px 단위 스윕으로 터널링을 방지하고, 잔여 소수분은 마지막에 적용해 속도를 보존한다.
 */
export function stepPlayer(pos: Vec2, input: MoveInput, dtMs: number, grid: CollisionGrid, box: Aabb): Vec2 {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (dx === 0 && dy === 0) return { ...pos };

  const len = Math.hypot(dx, dy);
  const dist = (PLAYER_SPEED * dtMs) / 1000;
  dx = (dx / len) * dist;
  dy = (dy / len) * dist;

  const next = { ...pos };
  next.x = moveAxis(next.x, next.y, dx, 'x', box, grid);
  next.y = moveAxis(next.x, next.y, dy, 'y', box, grid);
  return next;
}

function moveAxis(x: number, y: number, delta: number, axis: 'x' | 'y', box: Aabb, grid: CollisionGrid): number {
  const cur = axis === 'x' ? x : y;
  if (delta === 0) return cur;
  const collides = (v: number) =>
    axis === 'x' ? boxCollides(v, y, box, grid) : boxCollides(x, v, box, grid);
  // 1px 스윕: 큰 dt(탭 백그라운드 복귀 등)에도 벽을 통과하지 않는다
  const step = Math.sign(delta);
  const total = Math.abs(delta);
  let v = cur;
  let moved = 0;
  while (total - moved >= 1) {
    if (collides(v + step)) return v;
    v += step;
    moved += 1;
  }
  // 잔여 소수분 적용 — 정수 스텝만 쓰면 프레임레이트에 따라 속도가 왜곡된다
  const rem = total - moved;
  if (rem > 0 && !collides(v + step * rem)) v += step * rem;
  return v;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- tests/playerMotion.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/entities/playerMotion.ts tests/playerMotion.test.ts
git commit -m "feat: 플레이어 이동·충돌 슬라이드 로직"
```

---

### Task 5: 포인터 입력 (화면→타일 변환)

**Files:**
- Create: `src/game/input/pointer.ts`
- Test: `tests/pointer.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/pointer.test.ts
import { describe, it, expect } from 'vitest';
import { screenToTile } from '../src/game/input/pointer';

describe('screenToTile', () => {
  it('줌 1, 스크롤 0이면 화면 좌표 그대로 타일 계산한다', () => {
    expect(screenToTile(33, 65, { scrollX: 0, scrollY: 0, zoom: 1 })).toEqual({ tx: 1, ty: 2 });
  });

  it('카메라 스크롤을 보정한다', () => {
    expect(screenToTile(0, 0, { scrollX: 320, scrollY: 64, zoom: 1 })).toEqual({ tx: 10, ty: 2 });
  });

  it('줌을 보정한다 (줌 2에서 화면 64px = 월드 32px)', () => {
    expect(screenToTile(64, 64, { scrollX: 0, scrollY: 0, zoom: 2 })).toEqual({ tx: 1, ty: 1 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- tests/pointer.test.ts`
Expected: FAIL — `Cannot find module '../src/game/input/pointer'`

- [ ] **Step 3: 구현**

```ts
// src/game/input/pointer.ts
import { worldToTile } from '../world/grid';

export interface CameraView { scrollX: number; scrollY: number; zoom: number }

/** 화면(캔버스) 좌표 → 월드 → 타일 좌표. 클릭 상호작용·배치의 공용 진입점. */
export function screenToTile(screenX: number, screenY: number, cam: CameraView): { tx: number; ty: number } {
  const worldX = cam.scrollX + screenX / cam.zoom;
  const worldY = cam.scrollY + screenY / cam.zoom;
  return worldToTile(worldX, worldY);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- tests/pointer.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game/input/pointer.ts tests/pointer.test.ts
git commit -m "feat: 포인터 화면→타일 변환"
```

---

### Task 6: StreetScene — 렌더링·입력 배선

**Files:**
- Create: `src/game/scenes/StreetScene.ts`
- Modify: `src/main.ts` (씬 등록)

씬은 로직 없이 배선만: 존 색 블록 렌더 → 플레이어 스프라이트 → 키 입력 수집 → `stepPlayer` 호출 → 클릭 시 `screenToTile`로 타일 마커 표시.

- [ ] **Step 1: StreetScene 구현**

```ts
// src/game/scenes/StreetScene.ts
import Phaser from 'phaser';
import { TILE, ZOOM, MAP_W, MAP_H } from '../config';
import { ZONES, SOLID_RECTS, SPAWN_TILE, buildCollision } from '../world/mapData';
import { tileToWorld, type CollisionGrid } from '../world/grid';
import { stepPlayer, type MoveInput } from '../entities/playerMotion';
import { screenToTile } from '../input/pointer';

export class StreetScene extends Phaser.Scene {
  private grid!: CollisionGrid;
  private player!: Phaser.GameObjects.Rectangle;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private marker!: Phaser.GameObjects.Rectangle;

  constructor() { super('street'); }

  create(): void {
    this.grid = buildCollision();

    // 존 배경 블록
    for (const z of ZONES) {
      const p = tileToWorld(z.rect.x, z.rect.y);
      this.add.rectangle(p.x, p.y, z.rect.w * TILE, z.rect.h * TILE, z.color).setOrigin(0);
      this.add.text(p.x + 6, p.y + 6, z.name, { fontSize: '10px', color: '#ffffff' }).setAlpha(0.55);
    }
    // 건물(충돌) 블록
    for (const r of SOLID_RECTS) {
      const p = tileToWorld(r.x, r.y);
      this.add.rectangle(p.x, p.y, r.w * TILE, r.h * TILE, 0x241f1a).setOrigin(0);
    }

    // 클릭 마커
    this.marker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0)
      .setStrokeStyle(2, 0xf2d8a8).setVisible(false);

    // 플레이어 (placeholder 사각형 — Phase 5에서 스프라이트 교체)
    const spawn = tileToWorld(SPAWN_TILE.tx, SPAWN_TILE.ty);
    this.player = this.add.rectangle(spawn.x + TILE / 2, spawn.y + TILE / 2, 16, 22, 0xe8c9a0);

    // 입력
    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const cam = this.cameras.main;
      const { tx, ty } = screenToTile(p.x, p.y, { scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom });
      const w = tileToWorld(tx, ty);
      this.marker.setPosition(w.x, w.y).setVisible(true);
    });

    // 카메라
    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  update(_time: number, delta: number): void {
    const input: MoveInput = {
      up: this.keys.W.isDown, down: this.keys.S.isDown,
      left: this.keys.A.isDown, right: this.keys.D.isDown,
    };
    const next = stepPlayer(
      { x: this.player.x, y: this.player.y }, input, delta, this.grid, { hw: 8, hh: 11 },
    );
    this.player.setPosition(next.x, next.y);
  }
}
```

- [ ] **Step 2: main.ts에 씬 등록**

```ts
// src/main.ts — scene 배열만 변경
import Phaser from 'phaser';
import { StreetScene } from './game/scenes/StreetScene';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1713',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [StreetScene],
  });
}

createGame('game');
```

- [ ] **Step 3: 전체 검증**

Run: `npm run typecheck && npm test`
Expected: 타입 에러 0, 테스트 전체 PASS

Run: 개발 서버 접속 후 확인 —
Expected: ① 7개 존 색 블록과 이름 라벨 ② WASD로 캐릭터 이동, 건물·테두리에 막히고 벽 따라 미끄러짐 ③ 클릭한 타일에 골드 테두리 마커 ④ 카메라가 부드럽게 따라옴

- [ ] **Step 4: Commit**

```bash
git add src/game/scenes/StreetScene.ts src/main.ts
git commit -m "feat: StreetScene — 블록아웃 렌더·WASD 이동·클릭 마커·카메라"
```

---

### Task 7: CI 파이프라인 + README

**Files:**
- Create: `.github/workflows/ci.yml`, `README.md`

- [ ] **Step 1: CI 워크플로 작성**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: README 작성**

```markdown
# 홍대마을 (Hongdae Village)

서울 홍대입구역 일대를 배경으로 한 픽셀아트 힐링 멀티플레이 웹 게임 (최대 10인).
각자의 공간을 꾸미고, 아이템을 만들고 거래하며, 작은 사회를 만들어갑니다.

- 디자인 스펙: `docs/superpowers/specs/2026-07-08-hongdae-village-design.md`
- 구현 계획: `docs/superpowers/plans/`

## 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 단위 테스트
npm run typecheck  # 타입 검사
```

## 스택

Phaser 3 · TypeScript · Vite · Vitest · Supabase (Phase 2~)

## 조작

- 이동: W/A/S/D
- 상호작용·배치: 마우스 클릭
```

- [ ] **Step 3: 로컬에서 CI와 동일한 검증 실행**

Run: `npm ci && npm run typecheck && npm test && npm run build`
Expected: 모두 성공 (exit 0)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "chore: CI 워크플로·README"
```

---

### Task 8: GitHub 저장소 생성·푸시 (요구사항 §6 저장소)

**Files:** 없음 (원격 설정만)

- [ ] **Step 1: gh 인증 확인**

Run: `gh auth status`
Expected: 로그인된 계정 표시. **실패 시 이 태스크를 중단하고 사용자에게 `gh auth login` 실행을 요청한다** (사용자 계정 필요 — 스펙 §10).

- [ ] **Step 2: 저장소 생성 및 푸시**

```bash
gh repo create hongdae-village --private --source . --push
```

Expected: 원격 `origin` 등록 및 main 브랜치 푸시 완료

- [ ] **Step 3: CI 통과 확인**

Run: `gh run watch --exit-status` (또는 `gh run list --limit 1`)
Expected: CI `check` 잡 성공

---

## 정정 이력

- **2026-07-08 (Task 4 실행 중)**: 최초 플랜의 `moveAxis`(타겟 우선 검사 + 실패 시 1px 접근)는 이동량이 벽 두께보다 클 때 터널링하는 버그가 있어 플랜 자체 테스트를 통과하지 못했다. 또한 단순 정수 1px 스윕은 소수 이동량을 과이동시켜 속도가 프레임레이트 의존적이 된다. 위 코드는 "1px 스윕(터널링 방지) + 잔여 소수분 적용(속도 보존)"으로 정정된 최종본이다.
- **2026-07-08 (Task 3 실행 중)**: mapData 테스트 이름의 "6개 구역"은 오기 — 스펙 §2대로 7개 구역이 맞다 (수정 반영됨).

## Self-Review 결과

- **스펙 커버리지**: 이 플랜은 Phase 1 범위(§6 클라이언트 골격, §2 블록아웃, §8 단위 테스트·CI)만 다룬다. §2 시간/날씨·NPC, §3 전 시스템, §4 아트, §5 사운드, §6 Supabase, §7, §8 Playwright는 Phase 2~5 플랜에서 다룬다 (의도된 분할).
- **플레이스홀더**: 없음 — 전 스텝에 실제 코드·명령·기대 출력 포함.
- **타입 일관성 확인**: `CollisionGrid.fromRects(w, h, rects)` / `isSolid(tx, ty)` / `isSolidAtWorld(x, y)`, `stepPlayer(pos, input, dtMs, grid, box)`, `screenToTile(x, y, cam)` — Task 2~6에서 서명 일치.
