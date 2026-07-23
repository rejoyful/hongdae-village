import { sanitizeNetworkUserId } from '../../net/protocol';
import {
  HOME_GRADES, HOME_THEMES, STARTER_THEME,
  type HomeDesignAnalysis, type HomeGradeId, type HomeThemeId,
} from './homeDesign';
import type { HouseType } from '../realestate/realEstate';
import { CATALOG_BY_ID } from '../../items/catalog';

export interface NeighborHomeTourRecord {
  ownerId: string;
  ownerNickname: string;
  roomId: number;
  houseType: HouseType;
  themeId: HomeThemeId;
  gradeId: HomeGradeId;
  homeScore: number;
  uniqueItems: number;
  firstVisitedAt: number;
  lastVisitedAt: number;
  lastVisitDay: string;
  visits: number;
  itemIds: string[];
  favorite: boolean;
}

export interface NeighborHomeTourProgress {
  tours: number;
  neighbors: number;
  themes: number;
  grades: number;
  houseTypes: number;
  recentCards: number;
  favorites: number;
}

interface NeighborHomeTourState {
  version: 1;
  totalTours: number;
  records: Record<string, NeighborHomeTourRecord>;
}

const HOUSE_TYPES = new Set<HouseType>(['banjiha', 'oneroom', 'villa', 'apt', 'house']);
const THEME_IDS = new Set<HomeThemeId>([STARTER_THEME.id, ...HOME_THEMES.map((theme) => theme.id)]);
const GRADE_IDS = new Set<HomeGradeId>(HOME_GRADES.map((grade) => grade.id));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const NEIGHBOR_HOME_TOUR_ITEM_MAX = 18;
export const NEIGHBOR_HOME_TOUR_FAVORITE_MAX = 6;

const count = (value: unknown, cap = Number.MAX_SAFE_INTEGER): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(cap, Math.floor(value)) : 0
);

const cleanNickname = (value: unknown): string => typeof value === 'string'
  ? value.replace(/[<>\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || '이름 없는 이웃'
  : '이름 없는 이웃';

const cleanItemIds = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string' && CATALOG_BY_ID.has(item)))]
    .slice(0, NEIGHBOR_HOME_TOUR_ITEM_MAX)
  : [];

export function seoulTourDay(now: Date | number = Date.now()): string {
  const date = now instanceof Date ? now : new Date(now);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
}

export function normalizeNeighborHomeTourState(raw: unknown): NeighborHomeTourState {
  const value = raw && typeof raw === 'object' ? raw as Partial<NeighborHomeTourState> : {};
  const records: Record<string, NeighborHomeTourRecord> = {};
  if (value.records && typeof value.records === 'object') {
    for (const entry of Object.values(value.records)) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Partial<NeighborHomeTourRecord>;
      const ownerId = sanitizeNetworkUserId(record.ownerId);
      if (!ownerId || !Number.isInteger(record.roomId) || record.roomId! <= 0) continue;
      if (!HOUSE_TYPES.has(record.houseType as HouseType)) continue;
      const firstVisitedAt = count(record.firstVisitedAt);
      const lastVisitedAt = Math.max(firstVisitedAt, count(record.lastVisitedAt));
      const themeId = THEME_IDS.has(record.themeId as HomeThemeId) ? record.themeId as HomeThemeId : 'starter';
      const gradeId = GRADE_IDS.has(record.gradeId as HomeGradeId) ? record.gradeId as HomeGradeId : 'empty';
      records[ownerId] = {
        ownerId, ownerNickname: cleanNickname(record.ownerNickname), roomId: record.roomId!,
        houseType: record.houseType as HouseType, themeId, gradeId,
        homeScore: count(record.homeScore, 100), uniqueItems: count(record.uniqueItems, 500),
        firstVisitedAt, lastVisitedAt,
        lastVisitDay: typeof record.lastVisitDay === 'string' && datePattern.test(record.lastVisitDay)
          ? record.lastVisitDay : seoulTourDay(lastVisitedAt),
        visits: Math.max(1, count(record.visits)),
        itemIds: cleanItemIds(record.itemIds),
        favorite: record.favorite === true,
      };
    }
  }
  return { version: 1, totalTours: Math.max(count(value.totalTours), Object.keys(records).length), records };
}

/**
 * 온라인 이웃집을 실제로 불러온 뒤 남기는 로컬 영구 투어 수첩.
 * 같은 집 재입장은 하루 한 번만 누적해 새로고침 보상을 만들지 않는다.
 */
export class NeighborHomeTourStore {
  private readonly key: string;
  private readonly selfId: string;
  private state: NeighborHomeTourState;

  constructor(userId: string) {
    this.selfId = sanitizeNetworkUserId(userId) ?? 'offline';
    this.key = `hv-neighbor-home-tours-v1:${this.selfId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeNeighborHomeTourState(raw);
    this.persist();
  }

  records(): readonly NeighborHomeTourRecord[] {
    return Object.values(this.state.records)
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.lastVisitedAt - a.lastVisitedAt)
      .map((record) => ({ ...record, itemIds: [...record.itemIds] }));
  }

  record(
    ownerId: string,
    ownerNickname: string,
    roomId: number,
    houseType: HouseType,
    analysis: HomeDesignAnalysis,
    itemIds: readonly string[] = [],
    now: Date | number = Date.now(),
  ): 'recorded' | 'today' | 'self' | 'invalid' {
    const safeOwnerId = sanitizeNetworkUserId(ownerId);
    const timestamp = now instanceof Date ? now.getTime() : now;
    if (!safeOwnerId || !Number.isInteger(roomId) || roomId <= 0 || !HOUSE_TYPES.has(houseType) || !Number.isFinite(timestamp) || timestamp < 0) return 'invalid';
    if (safeOwnerId === this.selfId) return 'self';
    const day = seoulTourDay(timestamp);
    const previous = this.state.records[safeOwnerId];
    const isNewDay = previous?.lastVisitDay !== day;
    this.state.records[safeOwnerId] = {
      ownerId: safeOwnerId,
      ownerNickname: cleanNickname(ownerNickname),
      roomId,
      houseType,
      themeId: analysis.theme.id,
      gradeId: analysis.grade.id,
      homeScore: analysis.score,
      uniqueItems: analysis.uniqueCount,
      firstVisitedAt: previous?.firstVisitedAt ?? Math.floor(timestamp),
      lastVisitedAt: Math.floor(timestamp),
      lastVisitDay: day,
      visits: previous ? previous.visits + Number(isNewDay) : 1,
      itemIds: cleanItemIds(itemIds),
      favorite: previous?.favorite ?? false,
    };
    if (!previous || isNewDay) this.state.totalTours += 1;
    this.persist();
    return previous && !isNewDay ? 'today' : 'recorded';
  }

  toggleFavorite(ownerId: string): 'featured' | 'unfeatured' | 'full' | 'missing' {
    const safeOwnerId = sanitizeNetworkUserId(ownerId);
    if (!safeOwnerId || !this.state.records[safeOwnerId]) return 'missing';
    const record = this.state.records[safeOwnerId]!;
    if (record.favorite) {
      record.favorite = false; this.persist(); return 'unfeatured';
    }
    if (Object.values(this.state.records).filter((item) => item.favorite).length >= NEIGHBOR_HOME_TOUR_FAVORITE_MAX) return 'full';
    record.favorite = true; this.persist(); return 'featured';
  }

  progress(): NeighborHomeTourProgress {
    const records = Object.values(this.state.records);
    return {
      tours: this.state.totalTours,
      neighbors: records.length,
      themes: new Set(records.map((record) => record.themeId)).size,
      grades: new Set(records.map((record) => record.gradeId)).size,
      houseTypes: new Set(records.map((record) => record.houseType)).size,
      recentCards: Math.min(12, records.length),
      favorites: records.filter((record) => record.favorite).length,
    };
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
