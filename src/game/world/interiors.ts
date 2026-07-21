import type { Rect } from './grid';
import type { InteriorShop } from './mapData';

/**
 * 상가 인테리어 정의 — AI 백드롭 + 근사 충돌(선반·카운터).
 * solids 좌표는 백드롭 프롬프트의 고정 레이아웃과 일치하게 유지한다.
 */
export interface InteriorDef {
  id: InteriorShop;
  name: string;
  backdropKey: string;
  backdropUrl: string;
  w: number; // 타일
  h: number;
  solids: Rect[]; // 테두리 벽은 자동 — 내부 구조물만
}

const CONV_SOLIDS: Rect[] = [
  { x: 1, y: 1, w: 10, h: 1 },  // 상단 음료 냉장고 벽
  { x: 3, y: 3, w: 1, h: 3 },   // 진열대 3열
  { x: 6, y: 3, w: 1, h: 3 },
  { x: 9, y: 3, w: 1, h: 3 },
  { x: 1, y: 6, w: 3, h: 1 },   // 계산대
  { x: 8, y: 6, w: 3, h: 1 },   // 라면 취식대
];

export const INTERIORS: Record<InteriorShop, InteriorDef> = {
  apple: {
    id: 'apple', name: 'Apple 홍대',
    backdropKey: 'int-apple', backdropUrl: 'assets/interiors/apple.png',
    w: 12, h: 8,
    solids: [
      { x: 1, y: 1, w: 10, h: 1 }, // 상단 액세서리 월
      { x: 3, y: 3, w: 6, h: 1 },  // 디스플레이 테이블 2열
      { x: 3, y: 5, w: 6, h: 1 },
      { x: 1, y: 6, w: 3, h: 1 },  // 지니어스 바
    ],
  },
  gs25: {
    id: 'gs25', name: 'GS25 홍대점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS,
  },
  cu: {
    id: 'cu', name: 'CU 홍대입구점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS,
  },
  seven: {
    id: 'seven', name: '세븐일레븐 홍대점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS,
  },
};
