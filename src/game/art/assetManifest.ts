/**
 * AI 아트 파이프라인 산출 자산 (tools/pixelize.py로 정제된 PNG).
 * solidIndex는 mapData.SOLID_RECTS 인덱스 — 해당 건물의 프로시저럴 파사드를 교체한다.
 * 파일이 없으면 자동으로 프로시저럴 폴백 (점진 교체 가능).
 */
export interface BuildingAsset {
  key: string;
  url: string;
  solidIndex: number;
  hasOwnSign: boolean; // 간판이 그림에 포함 → 텍스트 오버레이 생략
}

export const BUILDING_ASSETS: BuildingAsset[] = [
  { key: 'bldg-furniture', url: 'assets/buildings/furniture.png', solidIndex: 14, hasOwnSign: true },
  { key: 'bldg-cafe',      url: 'assets/buildings/cafe.png',      solidIndex: 15, hasOwnSign: true },
  { key: 'bldg-conv',      url: 'assets/buildings/conv.png',      solidIndex: 16, hasOwnSign: true },
  { key: 'bldg-store',     url: 'assets/buildings/store.png',     solidIndex: 17, hasOwnSign: true },
];

export const ASSET_BY_SOLID_INDEX = new Map(BUILDING_ASSETS.map((a) => [a.solidIndex, a]));
