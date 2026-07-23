import type { IsoBuildingDef, IsoPropDef, IsoTerrain } from '../art/isometricArt';
import type { IsometricTreeVariant } from '../art/assetManifest';
import type { IsoGuideStep } from '../art/isometricTerrainArt';
import { TILE } from '../config';
import { CollisionGrid, type Rect } from './grid';

export const ISO_VILLAGE_W = 34;
export const ISO_VILLAGE_H = 24;
export const ISO_VILLAGE_SPAWN = { tx: 13, ty: 19 } as const;

export type IsoActivityKind = 'home' | 'quest' | 'cafe' | 'busking' | 'photo' | 'petshop' | 'atelier' | 'shop' | 'workshop' | 'garden' | 'kitchen' | 'fishing' | 'showcase' | 'clubs' | 'projects' | 'guide' | 'search' | 'museum' | 'market' | 'atmosphere';

export interface IsoActivitySpot {
  id: string;
  kind: IsoActivityKind;
  label: string;
  emoji: string;
  tx: number;
  ty: number;
  questKey: string;
}

export interface IsoResidentPlacement {
  residentId: string;
  tx: number;
  ty: number;
}

export interface IsoHuntZoneDef {
  id: string;
  name: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
}

export interface IsoTreePlacement {
  id: string;
  variant: IsometricTreeVariant;
  tx: number;
  ty: number;
}

/** 동쪽 연결도로 위·아래의 외곽숲. 중앙 생활권은 완전한 안전구역으로 남긴다. */
export const ISO_HUNT_ZONES: readonly IsoHuntZoneDef[] = [
  { id: 'moon-grove', name: '달빛 외곽숲', tx: 28, ty: 2, w: 5, h: 7 },
  { id: 'rail-thicket', name: '철길 야생화숲', tx: 28, ty: 14, w: 5, h: 9 },
] as const;

export const ISO_VILLAGE_BUILDINGS: readonly IsoBuildingDef[] = [
  {
    id: 'home', name: '나의 집', tx: 3, ty: 3, w: 5, h: 4, levels: 3,
    wallLeft: 0xb59a7d, wallRight: 0x967a63, roof: 0x795448, accent: 0xe7b96f,
    artKey: 'iso-home-hero-v1', artScale: 0.33, artOffsetX: 0, artOffsetY: 5,
    labelOffsetX: 16, labelOffsetY: -86,
  },
  {
    id: 'cafe', name: '모퉁이 카페', tx: 19, ty: 3, w: 4, h: 4, levels: 2,
    wallLeft: 0xc9a987, wallRight: 0xa98267, roof: 0x744d43, accent: 0xd97963,
    artKey: 'iso-cafe-hero-v1', artScale: 0.265, artOffsetX: 0, artOffsetY: 4,
    labelOffsetX: 22, labelOffsetY: -100,
  },
  {
    id: 'atelier', name: '살림 아틀리에', tx: 3, ty: 16, w: 5, h: 4, levels: 2,
    wallLeft: 0xb7aa82, wallRight: 0x918563, roof: 0x665f4c, accent: 0xe2b872,
    artKey: 'iso-atelier-hero-v1', artScale: 0.285, artOffsetX: 0, artOffsetY: 5,
    labelOffsetX: 48, labelOffsetY: -82,
  },
  {
    id: 'petshop', name: '멍냥이네', tx: 20, ty: 16, w: 4, h: 4, levels: 2,
    wallLeft: 0xc49c9e, wallRight: 0xa17c80, roof: 0x71515c, accent: 0xedb796,
    artKey: 'iso-petshop-hero-v1', artScale: 0.284, artOffsetX: 0, artOffsetY: 5,
    labelOffsetX: 8, labelOffsetY: -112,
  },
  {
    id: 'studio', name: '네컷 작업실', tx: 4, ty: 10, w: 4, h: 3, levels: 2,
    wallLeft: 0x91a5a5, wallRight: 0x71898b, roof: 0x4f6568, accent: 0xf2d18a,
    artKey: 'iso-studio-hero-v1', artScale: 0.27, artOffsetX: 0, artOffsetY: 5,
    labelOffsetX: 46, labelOffsetY: -82,
  },
  {
    id: 'record', name: '레코드 골목', tx: 20, ty: 10, w: 4, h: 3, levels: 3,
    wallLeft: 0x9e8aab, wallRight: 0x806e91, roof: 0x5b4e67, accent: 0xe0a3c8,
    artKey: 'iso-record-hero-v1', artScale: 0.306, artOffsetX: 0, artOffsetY: 5,
    labelOffsetX: 12, labelOffsetY: -90,
  },
] as const;

export const ISO_VILLAGE_ACTIVITIES: readonly IsoActivitySpot[] = [
  { id: 'home-door', kind: 'home', label: '나의 집', emoji: '🏠', tx: 8, ty: 6, questKey: 'visit_home' },
  { id: 'quest-board', kind: 'quest', label: '모험 일지', emoji: '📋', tx: 13, ty: 12, questKey: 'open_quest' },
  { id: 'cafe-door', kind: 'cafe', label: '커피 한 잔', emoji: '☕', tx: 18, ty: 6, questKey: 'q_cafe' },
  { id: 'busking-stage', kind: 'busking', label: '버스킹', emoji: '🎸', tx: 15, ty: 11, questKey: 'q_busking' },
  { id: 'photo-booth', kind: 'photo', label: '네컷 사진', emoji: '📸', tx: 9, ty: 11, questKey: 'photo_taken' },
  { id: 'petshop-door', kind: 'petshop', label: '펫샵', emoji: '🐾', tx: 19, ty: 18, questKey: 'visit_petshop' },
  { id: 'atelier-door', kind: 'atelier', label: '캐릭터 아틀리에', emoji: '🧵', tx: 8, ty: 18, questKey: 'customize' },
  { id: 'sallim-showroom', kind: 'shop', label: '살림 가구', emoji: '살', tx: 9, ty: 19, questKey: 'visit_shop' },
  { id: 'sallim-workbench', kind: 'workshop', label: 'DIY 작업대', emoji: 'DIY', tx: 8, ty: 20, questKey: 'visit_workshop' },
  { id: 'home-garden', kind: 'garden', label: '옥상 정원', emoji: '싹', tx: 9, ty: 5, questKey: 'garden_planted' },
  { id: 'corner-kitchen', kind: 'kitchen', label: '골목 주방', emoji: '솥', tx: 17, ty: 5, questKey: 'cooking_total' },
  { id: 'water-garden', kind: 'fishing', label: '물정원 낚시', emoji: '낚', tx: 26, ty: 12, questKey: 'fishing_total' },
  { id: 'taste-showcase', kind: 'showcase', label: '골목 취향 전시회', emoji: '전', tx: 17, ty: 14, questKey: 'taste_showcase_submissions' },
  { id: 'hobby-clubs', kind: 'clubs', label: '골목 동아리', emoji: '동', tx: 12, ty: 14, questKey: 'hobby_club_chapters' },
  { id: 'neighborhood-guide', kind: 'guide', label: '골목 소풍 안내소', emoji: '길', tx: 15, ty: 14, questKey: 'neighborhood_tour_postcards' },
  { id: 'village-finder', kind: 'search', label: '골목 찾기 안내함', emoji: '찾', tx: 14, ty: 12, questKey: 'village_search_open' },
  { id: 'neighborhood-museum', kind: 'museum', label: '골목 작은 박물관', emoji: '관', tx: 14, ty: 17, questKey: 'neighborhood_museum_exhibits' },
  { id: 'community-projects', kind: 'projects', label: '골목 함께짓기', emoji: '함', tx: 27, ty: 10, questKey: 'community_project_phases' },
  { id: 'neighborhood-market', kind: 'market', label: '나눔장터', emoji: '장', tx: 10, ty: 15, questKey: 'market_visits' },
  { id: 'weather-observatory', kind: 'atmosphere', label: '골목 분위기 관측소', emoji: '하', tx: 19, ty: 14, questKey: 'atmosphere_visits' },
] as const;

/** 첫 접속 스폰에서 모험 일지까지 이어지는 짧은 인월드 온보딩 길. */
export const ISO_WELCOME_ROUTE: readonly IsoGuideStep[] = [
  { tx: 13, ty: 18 },
  { tx: 13, ty: 17 },
  { tx: 13, ty: 16 },
  { tx: 13, ty: 15 },
  { tx: 13, ty: 14 },
  { tx: 13, ty: 13 },
  { tx: 13, ty: 12 },
] as const;

/** 이름 있는 주민 10명의 아이소메트릭 생활권. 건물 입구·활동 타일과 겹치지 않는다. */
export const ISO_RESIDENT_PLACEMENTS: readonly IsoResidentPlacement[] = [
  { residentId: 'dongsu', tx: 10, ty: 4 },
  { residentId: 'moturi', tx: 18, ty: 7 },
  { residentId: 'noeul', tx: 10, ty: 9 },
  { residentId: 'jun', tx: 12, ty: 10 },
  { residentId: 'haneul', tx: 16, ty: 10 },
  { residentId: 'ille', tx: 17, ty: 12 },
  { residentId: 'choco', tx: 14, ty: 14 },
  { residentId: 'imo', tx: 7, ty: 14 },
  { residentId: 'sallim', tx: 9, ty: 18 },
  { residentId: 'park', tx: 13, ty: 21 },
] as const;

/** 통행을 막지 않는 생활 소품. 활동·주민 타일과 겹치지 않아 길 안내를 흐리지 않는다. */
export const ISO_VILLAGE_PROPS: readonly IsoPropDef[] = [
  { id: 'lamp-nw', kind: 'lamp', tx: 11, ty: 8 },
  { id: 'lamp-ne', kind: 'lamp', tx: 16, ty: 8 },
  { id: 'lamp-sw', kind: 'lamp', tx: 11, ty: 15 },
  { id: 'lamp-se', kind: 'lamp', tx: 16, ty: 15 },
  { id: 'lamp-home', kind: 'lamp', tx: 13, ty: 7 },
  { id: 'lamp-south', kind: 'lamp', tx: 13, ty: 16 },
  { id: 'bench-nw', kind: 'bench', tx: 9, ty: 8 },
  { id: 'bench-east', kind: 'bench', tx: 18, ty: 14 },
  { id: 'bench-south', kind: 'bench', tx: 11, ty: 14 },
  { id: 'bench-record', kind: 'bench', tx: 17, ty: 9 },
  { id: 'plant-cafe', kind: 'planter', tx: 17, ty: 6 },
  { id: 'plant-atelier', kind: 'planter', tx: 9, ty: 17 },
  { id: 'plant-petshop', kind: 'planter', tx: 18, ty: 18 },
  { id: 'plant-home', kind: 'planter', tx: 8, ty: 5 },
  { id: 'diy-workbench', kind: 'workbench', tx: 8, ty: 19 },
  { id: 'taste-showcase-booth', kind: 'showcase', tx: 17, ty: 13 },
  { id: 'hobby-club-board', kind: 'clubboard', tx: 12, ty: 13 },
  { id: 'neighborhood-guide-kiosk', kind: 'guidekiosk', tx: 15, ty: 13 },
  { id: 'village-finder-kiosk', kind: 'finderkiosk', tx: 14, ty: 11 },
  { id: 'neighborhood-museum-cabinet', kind: 'museumcabinet', tx: 14, ty: 16 },
  { id: 'community-project-pavilion', kind: 'projectboard', tx: 26, ty: 10 },
  { id: 'neighborhood-market-stall', kind: 'marketboard', tx: 10, ty: 14 },
  { id: 'weather-observatory-kiosk', kind: 'weatherstation', tx: 19, ty: 13 },
  { id: 'bollard-west', kind: 'bollard', tx: 11, ty: 10 },
  { id: 'bollard-east', kind: 'bollard', tx: 16, ty: 9 },
  { id: 'bollard-southwest', kind: 'bollard', tx: 11, ty: 13 },
  { id: 'bollard-southeast', kind: 'bollard', tx: 16, ty: 13 },
  { id: 'bin-plaza', kind: 'bin', tx: 10, ty: 12 },
  { id: 'bin-record', kind: 'bin', tx: 18, ty: 11 },
] as const;

/** 생활권은 느티나무·은행나무, 전투 외곽은 적송으로 실루엣을 구분한다. */
export const ISO_VILLAGE_TREES: readonly IsoTreePlacement[] = [
  { id: 'zelkova-home-nw', variant: 'zelkova', tx: 2, ty: 2 },
  { id: 'ginkgo-home-east', variant: 'ginkgo', tx: 9, ty: 3 },
  { id: 'zelkova-cafe-west', variant: 'zelkova', tx: 17, ty: 3 },
  { id: 'ginkgo-cafe-east', variant: 'ginkgo', tx: 25, ty: 4 },
  { id: 'ginkgo-studio-west', variant: 'ginkgo', tx: 2, ty: 9 },
  { id: 'zelkova-record-east', variant: 'zelkova', tx: 25, ty: 9 },
  { id: 'zelkova-atelier-west', variant: 'zelkova', tx: 2, ty: 14 },
  { id: 'ginkgo-plaza-southwest', variant: 'ginkgo', tx: 10, ty: 16 },
  { id: 'zelkova-plaza-southeast', variant: 'zelkova', tx: 17, ty: 16 },
  { id: 'ginkgo-petshop-north', variant: 'ginkgo', tx: 25, ty: 15 },
  { id: 'ginkgo-southwest', variant: 'ginkgo', tx: 10, ty: 21 },
  { id: 'zelkova-south', variant: 'zelkova', tx: 17, ty: 21 },
  { id: 'zelkova-southeast', variant: 'zelkova', tx: 25, ty: 21 },
  { id: 'pine-moon-north', variant: 'redpine', tx: 29, ty: 2 },
  { id: 'pine-moon-south', variant: 'redpine', tx: 32, ty: 8 },
  { id: 'pine-rail-north', variant: 'redpine', tx: 29, ty: 15 },
  { id: 'pine-rail-south', variant: 'redpine', tx: 32, ty: 21 },
  { id: 'pine-gate-north', variant: 'redpine', tx: 27, ty: 4 },
  { id: 'pine-gate-south', variant: 'redpine', tx: 27, ty: 19 },
] as const;

const BORDER: Rect[] = [
  { x: 0, y: 0, w: ISO_VILLAGE_W, h: 1 },
  { x: 0, y: ISO_VILLAGE_H - 1, w: ISO_VILLAGE_W, h: 1 },
  { x: 0, y: 0, w: 1, h: ISO_VILLAGE_H },
  { x: ISO_VILLAGE_W - 1, y: 0, w: 1, h: ISO_VILLAGE_H },
];

export function buildIsoVillageCollision(): CollisionGrid {
  const buildings = ISO_VILLAGE_BUILDINGS.map(({ tx: x, ty: y, w, h }) => ({ x, y, w, h }));
  return CollisionGrid.fromRects(ISO_VILLAGE_W, ISO_VILLAGE_H, [...BORDER, ...buildings]);
}

export function isoVillageTerrain(tx: number, ty: number): IsoTerrain {
  if (tx >= 12 && tx <= 15) return 'road';
  if (ty >= 9 && ty <= 13) return 'road';
  if (tx >= 28) return 'wild';
  if (tx >= 9 && tx <= 18 && ty >= 8 && ty <= 15) return 'plaza';
  if ((tx < 10 && ty < 9) || (tx > 17 && ty > 14)) return 'grass';
  return 'alley';
}

export function huntZoneAt(tx: number, ty: number): IsoHuntZoneDef | null {
  return ISO_HUNT_ZONES.find((zone) => (
    tx >= zone.tx && tx < zone.tx + zone.w && ty >= zone.ty && ty < zone.ty + zone.h
  )) ?? null;
}

export function huntZoneAtWorld(x: number, y: number): IsoHuntZoneDef | null {
  return huntZoneAt(Math.floor(x / TILE), Math.floor(y / TILE));
}

export function activityAt(tx: number, ty: number): IsoActivitySpot | null {
  return ISO_VILLAGE_ACTIVITIES.find((spot) => spot.tx === tx && spot.ty === ty) ?? null;
}

/** Realtime 좌표가 아이소메트릭 마을 논리 경계 안인지 검증한다. */
export function isIsoVillageWorldPosition(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y)
    && x >= 0 && y >= 0 && x < ISO_VILLAGE_W * TILE && y < ISO_VILLAGE_H * TILE;
}
