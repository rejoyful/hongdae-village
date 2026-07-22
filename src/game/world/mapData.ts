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
  // 북측 상가 — 실제 홍대 브랜드 (인덱스 19~22, 인테리어 입장 가능)
  { x: 6, y: 28, w: 10, h: 3 },  // 19 Apple 홍대
  { x: 20, y: 28, w: 6, h: 3 },  // 20 GS25
  { x: 46, y: 28, w: 6, h: 3 },  // 21 CU
  { x: 58, y: 28, w: 6, h: 3 },  // 22 세븐일레븐
  // 채움용 장식 건물 (인덱스 23~, 입장 불가 — 빈 골목 밀도 채우기)
  { x: 3,  y: 40, w: 5, h: 3 },  // 23 포차골목 노포
  { x: 16, y: 48, w: 5, h: 3 },  // 24 포차골목 술집
  { x: 70, y: 41, w: 6, h: 3 },  // 25 벽화골목 편집샵
  { x: 60, y: 49, w: 5, h: 3 },  // 26 벽화골목 갤러리
  { x: 2,  y: 24, w: 3, h: 2 },  // 27 주택골목(서) 창고
  { x: 74, y: 24, w: 3, h: 2 },  // 28 주택골목(동) 창고
];

/**
 * 통행 불가 대형 소품 (버스정류장·거치대·기계 몸체 등).
 * "막혀야 하는데 뚫려있던" 문제 보완 — streetArt 배치와 좌표 동기 유지.
 * 미니게임/간식 기계는 몸체를 솔리드로, 바로 아래 트리거 타일은 통행 가능하게 둔다.
 */
export const SOLID_PROPS: Rect[] = [
  { x: 68, y: 30, w: 2, h: 1 }, // 버스정류장 (차도 북측)
  { x: 33, y: 52, w: 2, h: 1 }, // 따릉이 거치대 (역 앞)
  { x: 63, y: 36, w: 3, h: 1 }, // 인형뽑기+네컷 아케이드 (잡화점 옆, 장식)
  { x: 66, y: 43, w: 1, h: 1 }, // 인형뽑기 기계 몸체
  { x: 72, y: 43, w: 1, h: 1 }, // 네컷 포토부스 몸체
  { x: 10, y: 43, w: 1, h: 1 }, // 붕어빵 포차 몸체
];

/** 스폰 지점: 역 출구 앞 광장 (스펙 §2) */
export const SPAWN_TILE = { tx: 40, ty: 42 };

/** 개인 공간 10채의 문 — 각 주택 건물 하단 중앙 타일 (클릭하면 입주/입장, 스펙 §2·§3) */
export const HOUSE_DOORS: Array<{ roomId: number; tx: number; ty: number }> = [
  { roomId: 1,  tx: 6,  ty: 15 }, { roomId: 2,  tx: 15, ty: 15 },
  { roomId: 3,  tx: 6,  ty: 23 }, { roomId: 4,  tx: 15, ty: 23 },
  { roomId: 5,  tx: 22, ty: 21 },
  { roomId: 6,  tx: 60, ty: 15 }, { roomId: 7,  tx: 69, ty: 15 },
  { roomId: 8,  tx: 60, ty: 23 }, { roomId: 9,  tx: 69, ty: 23 },
  { roomId: 10, tx: 76, ty: 21 },
];

/** 상점 문 — 밟으면 상점 패널이 열린다 (가구점 「살림」, 스펙 §3 구매) */
export const SHOP_DOORS: Array<{ shop: 'furniture'; tx: number; ty: number }> = [
  { shop: 'furniture', tx: 12, ty: 35 },
];

/** 카페 「모퉁이」 문 — 밟으면 알바 미니게임 (스펙 §3 수익 활동) */
export const CAFE_DOORS: Array<{ tx: number; ty: number }> = [
  { tx: 28, ty: 35 },
];

/** 버스킹 스팟 — 메인 스트리트 보도, 밟으면 버스킹 (스펙 §2·§3) */
export const BUSKING_SPOT = { tx: 40, ty: 30 };

/** 인테리어 입장 문 — 북측 상가 (밟으면 내부 씬으로) */
export type InteriorShop = 'apple' | 'gs25' | 'cu' | 'seven';
export const INTERIOR_DOORS: Array<{ shop: InteriorShop; tx: number; ty: number }> = [
  { shop: 'apple', tx: 11, ty: 30 },
  { shop: 'gs25', tx: 23, ty: 30 },
  { shop: 'cu', tx: 49, ty: 30 },
  { shop: 'seven', tx: 61, ty: 30 },
];

/** 공원 오목판 — 숲길 벤치 옆 (스펙 §3 재미 요소) */
export const OMOK_SPOT = { tx: 24, ty: 5 };

/** 마을 게시판 — 역 광장 (스펙 §2, 오늘의 퀘스트) */
export const BOARD_SPOT = { tx: 36, ty: 44 };

/** 인형뽑기 — 벽화 골목 (미니게임, 기계 몸체는 바로 위 타일) */
export const CLAW_SPOT = { tx: 66, ty: 44 };

/** 네컷 포토부스 — 벽화 골목 (프로필 프레임 획득) */
export const PHOTO_SPOT = { tx: 72, ty: 44 };

/** 붕어빵 포차 — 포차 골목 (간식, 하트 회복 연출) */
export const BUNGEO_SPOT = { tx: 10, ty: 44 };

export function buildCollision(): CollisionGrid {
  // 건물 + 대형 소품이 솔리드. 문 타일만 뚫어 걸어 들어가게 한다 (밟으면 입장).
  return CollisionGrid.fromRects(MAP_W, MAP_H, [...SOLID_RECTS, ...SOLID_PROPS],
    [...HOUSE_DOORS, ...SHOP_DOORS, ...CAFE_DOORS, ...INTERIOR_DOORS]);
}
