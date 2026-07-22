import type { Rect } from './grid';
import type { InteriorShop } from './mapData';
import type { Appearance } from '../art/appearance';

/**
 * 상가 인테리어 정의 — AI 백드롭 + 근사 충돌(선반·카운터) + 사람·상호작용 스팟.
 * solids 좌표는 백드롭 프롬프트의 고정 레이아웃과 일치하게 유지한다.
 */
export interface InteriorNpc { tx: number; ty: number; name: string; appearance: Appearance; lines: string[] }
export interface InteriorSpot { tx: number; ty: number; label: string; lines: string[] }

export interface InteriorDef {
  id: InteriorShop;
  name: string;
  backdropKey: string;
  backdropUrl: string;
  w: number; // 타일
  h: number;
  solids: Rect[]; // 테두리 벽은 자동 — 내부 구조물만
  npcs: InteriorNpc[];
  spots: InteriorSpot[]; // 밟으면 테마 대사 (건물 성격별 재미요소)
}

const CONV_SOLIDS: Rect[] = [
  { x: 1, y: 1, w: 10, h: 1 },  // 상단 음료 냉장고 벽
  { x: 3, y: 3, w: 1, h: 3 },   // 진열대 3열
  { x: 6, y: 3, w: 1, h: 3 },
  { x: 9, y: 3, w: 1, h: 3 },
  { x: 1, y: 6, w: 3, h: 1 },   // 계산대
  { x: 8, y: 6, w: 3, h: 1 },   // 라면 취식대
];

const clerk = (shirt: string): Appearance => ({ skin: 1, hair: 0, hairColor: 1, shirt, pants: 2 });
const guest = (shirt: string): Appearance => ({ skin: 0, hair: 3, hairColor: 4, shirt, pants: 1 });

/** 편의점 3사 공통 사람·스팟 (브랜드명만 다름) */
function convLife(brand: string): { npcs: InteriorNpc[]; spots: InteriorSpot[] } {
  return {
    npcs: [
      { tx: 2, ty: 5, name: `${brand} 알바`, appearance: clerk('6a7a8a'),
        lines: ['어서오세요~', '봉투 필요하세요?', `${brand} 포인트 적립되세요?`, '1+1 행사 중이에요'] },
      { tx: 8, ty: 4, name: '손님', appearance: guest('d88a7c'),
        lines: ['오늘 뭐 먹지…', '컵라면 국룰이지', '이 조합 못 참지 ㅋㅋ'] },
    ],
    spots: [
      { tx: 8, ty: 5, label: '라면 취식대', lines: ['컵라면 3분 컷! 🍜', '국물이 예술이다…', '치즈 추가는 국룰'] },
      { tx: 1, ty: 2, label: '음료 냉장고', lines: ['제로콜라 픽 🥤', '이온음료로 해장각', '아 오늘 날씨 아아 각인데'] },
      { tx: 5, ty: 4, label: '삼각김밥', lines: ['참치마요 1+1 🍙', '신상 젤리 입고됨!', '폐기 도시락의 낭만…'] },
      { tx: 10, ty: 5, label: 'ATM', lines: ['잔액 조회는 마음의 준비 후에', '용돈이 스쳐 지나갔다', '💸'] },
    ],
  };
}

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
    npcs: [
      { tx: 2, ty: 5, name: '지니어스', appearance: clerk('4a4e5c'),
        lines: ['무엇을 도와드릴까요?', '예약하고 오셨나요?', '신제품 체험해보세요!'] },
      { tx: 8, ty: 4, name: '체험 손님', appearance: guest('a8c8e0'),
        lines: ['카메라 미쳤다 진짜', '이거 지르면 한 달 라면인데…', '갤럭시에서 넘어왔어요'] },
    ],
    spots: [
      { tx: 4, ty: 4, label: '아이폰 체험', lines: ['신형 카메라 갬성 미쳤다 📷', '색감 실화냐', '이걸로 브이로그 각'] },
      { tx: 7, ty: 4, label: '맥북 체험', lines: ['자소서나 써볼까…', 'M칩 속도 지린다', '무보정 갬성샷 편집각'] },
      { tx: 8, ty: 6, label: '애플워치', lines: ['오운완 기록해야지 ⌚', '심박수 두근두근', '링 채우기 중독됨'] },
    ],
  },
  gs25: {
    id: 'gs25', name: 'GS25 홍대점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS, ...convLife('GS25'),
  },
  cu: {
    id: 'cu', name: 'CU 홍대입구점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS, ...convLife('CU'),
  },
  seven: {
    id: 'seven', name: '세븐일레븐 홍대점',
    backdropKey: 'int-conv', backdropUrl: 'assets/interiors/convenience.png',
    w: 12, h: 8, solids: CONV_SOLIDS, ...convLife('세븐일레븐'),
  },
};
