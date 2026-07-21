/**
 * AI 아트 파이프라인 산출 자산 (tools/pixelize.py로 정제된 PNG).
 * 텍스처 목록 + SOLID_RECTS 인덱스→텍스처 배치 매핑.
 * 파일이 없으면 자동으로 프로시저럴 폴백 (점진 교체 가능).
 */
export interface BuildingTexture { key: string; url: string }

export const BUILDING_TEXTURES: BuildingTexture[] = [
  { key: 'bldg-house-a',    url: 'assets/buildings/house_a.png' },    // 다세대 벽돌 (192×128)
  { key: 'bldg-house-b',    url: 'assets/buildings/house_b.png' },    // 옥탑방 주택
  { key: 'bldg-house-c',    url: 'assets/buildings/house_c.png' },    // 상가주택 (꽃집)
  { key: 'bldg-house-d',    url: 'assets/buildings/house_d.png' },    // 붉은벽돌 빌라
  { key: 'bldg-house-tall', url: 'assets/buildings/house_tall.png' }, // 오피스텔 (128×192)
  { key: 'bldg-station',    url: 'assets/buildings/station.png' },    // 홍대입구역 출구 (256×128)
  { key: 'bldg-furniture',  url: 'assets/buildings/furniture.png' },  // 살림 가구 (256×96)
  { key: 'bldg-cafe',       url: 'assets/buildings/cafe.png' },
  { key: 'bldg-conv',       url: 'assets/buildings/conv.png' },
  { key: 'bldg-store',      url: 'assets/buildings/store.png' },
];

/** AI 가구 스프라이트 — public/assets/furniture/<id>_<rot>.png, 키 furn-ai-<id>-<rot> */
export const FURNITURE_ASSETS: Array<{ itemId: string; rots: Array<0 | 1> }> = [
  { itemId: 'bed_basic', rots: [0, 1] },
  { itemId: 'rug_cream', rots: [0, 1] },
  { itemId: 'desk_wood', rots: [0, 1] },
  { itemId: 'bookshelf', rots: [0, 1] },
  { itemId: 'tea_table', rots: [0] },
  { itemId: 'plant_pot', rots: [0] },
  { itemId: 'bear_doll', rots: [0] },
];

export const furnitureAssetKey = (itemId: string, rot: 0 | 1): string => `furn-ai-${itemId}-${rot}`;

/** 방 재질 (바닥 등) */
export const ROOM_MATERIALS: BuildingTexture[] = [
  { key: 'room-floor-ai', url: 'assets/room/floor_wood.png' }, // 128×128 타일링
];

/** mapData.SOLID_RECTS 인덱스 → 텍스처 키 (주택 4종은 좌우 골목에 교차 배치) */
export const BUILDING_PLACEMENT = new Map<number, string>([
  // 주택 골목 (서): 4~8
  [4, 'bldg-house-a'], [5, 'bldg-house-b'], [6, 'bldg-house-c'], [7, 'bldg-house-d'], [8, 'bldg-house-tall'],
  // 주택 골목 (동): 9~13
  [9, 'bldg-house-c'], [10, 'bldg-house-d'], [11, 'bldg-house-a'], [12, 'bldg-house-b'], [13, 'bldg-house-tall'],
  // 메인 스트리트 상점: 14~17
  [14, 'bldg-furniture'], [15, 'bldg-cafe'], [16, 'bldg-conv'], [17, 'bldg-store'],
  // 역 출구 구조물: 18
  [18, 'bldg-station'],
]);
