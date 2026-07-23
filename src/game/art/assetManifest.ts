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
  { key: 'bldg-apple',      url: 'assets/buildings/apple.png' },   // Apple 홍대 (320×96)
  { key: 'bldg-gs25',       url: 'assets/buildings/gs25.png' },    // GS25 (192×96)
  { key: 'bldg-cu',         url: 'assets/buildings/cu.png' },      // CU (192×96)
  { key: 'bldg-seven',      url: 'assets/buildings/seven.png' },   // 세븐일레븐 (192×96)
];

/** 아이소메트릭 대표 건물. 투명 PNG가 없거나 로드 실패하면 프로시저럴 건물로 자동 폴백한다. */
export const ISOMETRIC_BUILDING_TEXTURES: BuildingTexture[] = [
  { key: 'iso-cafe-hero-v1', url: 'assets/isometric/cafe_hero_v1.png' },
  { key: 'iso-home-hero-v1', url: 'assets/isometric/home_hero_v1.png' },
  { key: 'iso-atelier-hero-v1', url: 'assets/isometric/atelier_hero_v1.png' },
  { key: 'iso-petshop-hero-v1', url: 'assets/isometric/petshop_hero_v1.png' },
  { key: 'iso-studio-hero-v1', url: 'assets/isometric/studio_hero_v1.png' },
  { key: 'iso-record-hero-v1', url: 'assets/isometric/record_hero_v1.png' },
];

export interface MonsterTexture extends BuildingTexture {
  speciesId: string;
  /** 48px 정규화 캔버스를 월드에서 보여 주는 기본 배율 */
  scale: number;
}

/** 1티어 고밀도 몬스터. 같은 mon- 키를 선로딩해 절차형 생성기를 안전한 폴백으로 둔다. */
export const ISOMETRIC_MONSTER_TEXTURES: MonsterTexture[] = [
  { speciesId: 'slime_g', key: 'mon-slime_g', url: 'assets/isometric/monsters/slime_g_v1.png', scale: 0.82 },
  { speciesId: 'acornbug', key: 'mon-acornbug', url: 'assets/isometric/monsters/acornbug_v1.png', scale: 0.82 },
  { speciesId: 'molelet', key: 'mon-molelet', url: 'assets/isometric/monsters/molelet_v1.png', scale: 0.82 },
  { speciesId: 'glowmoth', key: 'mon-glowmoth', url: 'assets/isometric/monsters/glowmoth_v1.png', scale: 0.82 },
  { speciesId: 'nutsquirrel', key: 'mon-nutsquirrel', url: 'assets/isometric/monsters/nutsquirrel_v1.png', scale: 0.82 },
];

const MONSTER_TEXTURE_BY_ID = new Map(ISOMETRIC_MONSTER_TEXTURES.map((asset) => [asset.speciesId, asset]));

/** 생성형 자산은 48px 캔버스, 나머지 티어는 기존 16px 절차형 자산 배율을 사용한다. */
export const isometricMonsterScale = (speciesId: string): number => MONSTER_TEXTURE_BY_ID.get(speciesId)?.scale ?? 1.5;

export type IsometricTreeVariant = 'zelkova' | 'ginkgo' | 'redpine';

export interface TreeTexture extends BuildingTexture {
  variant: IsometricTreeVariant;
  /** 96×128 정규화 캔버스를 월드에 배치하는 기본 배율 */
  scale: number;
}

/** 생활권과 외곽숲을 구분하는 고밀도 가로수 세트. */
export const ISOMETRIC_TREE_TEXTURES: TreeTexture[] = [
  { variant: 'zelkova', key: 'iso-tree-zelkova-v1', url: 'assets/isometric/trees/zelkova_v1.png', scale: 0.72 },
  { variant: 'ginkgo', key: 'iso-tree-ginkgo-v1', url: 'assets/isometric/trees/ginkgo_v1.png', scale: 0.68 },
  { variant: 'redpine', key: 'iso-tree-redpine-v1', url: 'assets/isometric/trees/redpine_v1.png', scale: 0.68 },
];

/** 생활 활동을 월드에 직접 보여 주는 고밀도 아이소메트릭 소품. */
export const ISOMETRIC_PROP_TEXTURES = [
  { kind: 'workbench', key: 'iso-diy-workbench-v1', url: 'assets/isometric/diy_workbench_v1.png', scale: 0.72 },
  { kind: 'showcase', key: 'iso-taste-showcase-v1', url: 'assets/isometric/taste_showcase_booth_v1.png', scale: 0.78 },
  { kind: 'clubboard', key: 'iso-hobby-club-board-v1', url: 'assets/isometric/hobby_club_board_v1.png', scale: 0.78 },
  { kind: 'guidekiosk', key: 'iso-neighborhood-guide-kiosk-v1', url: 'assets/isometric/neighborhood_guide_kiosk_v1.png', scale: 0.82 },
  { kind: 'finderkiosk', key: 'iso-village-finder-kiosk-v1', url: 'assets/isometric/village_finder_kiosk_v1.png', scale: 0.78 },
  { kind: 'museumcabinet', key: 'iso-neighborhood-museum-cabinet-v1', url: 'assets/isometric/neighborhood_museum_cabinet_v1.png', scale: 0.86 },
  { kind: 'projectboard', key: 'iso-community-project-pavilion-v1', url: 'assets/isometric/community_project_pavilion_v1.png', scale: 0.82 },
] as const;

export const isometricPropAsset = (kind: string) => ISOMETRIC_PROP_TEXTURES.find((asset) => asset.kind === kind);

const TREE_TEXTURE_BY_VARIANT = new Map(ISOMETRIC_TREE_TEXTURES.map((asset) => [asset.variant, asset]));

export const isometricTreeAsset = (variant: IsometricTreeVariant): TreeTexture | undefined => (
  TREE_TEXTURE_BY_VARIANT.get(variant)
);

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

/** 거리 소품 AI 자산 (실제 홍대 감성 — 없으면 해당 소품만 생략) */
export const PROP_ASSETS: BuildingTexture[] = [
  { key: 'prop-cart',   url: 'assets/props/bungeoppang_cart.png' }, // 붕어빵 포차 (2×2)
  { key: 'prop-arcade', url: 'assets/props/claw_photobooth.png' },  // 인형뽑기+네컷부스 (3×2)
  { key: 'prop-mural',  url: 'assets/props/mural.png' },            // 그래피티 벽화 (8×3)
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
  // 북측 상가 (실브랜드): 19~22
  [19, 'bldg-apple'], [20, 'bldg-gs25'], [21, 'bldg-cu'], [22, 'bldg-seven'],
]);
