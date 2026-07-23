import { RESIDENTS, trustOf, type ResidentDef, type TrustState } from './residents';

export const RESIDENT_FAVORITE_MAX = 3;

export interface ResidentFanbookState {
  version: 1;
  favorites: string[];
}

export interface ResidentFanRibbon {
  threshold: number;
  mark: string;
  name: string;
  note: string;
}

export interface ResidentFanRibbonView extends ResidentFanRibbon {
  unlocked: boolean;
}

export interface ResidentFanView {
  resident: ResidentDef;
  trust: number;
  favoriteRank: number | null;
  favoriteLabel: string | null;
  ribbons: ResidentFanRibbonView[];
  unlockedRibbons: number;
  complete: boolean;
  nextRibbon: ResidentFanRibbon | null;
}

export interface ResidentFanbookProgress {
  favorites: number;
  ribbons: number;
  ribbonResidents: number;
  completedResidents: number;
  totalRibbons: number;
}

export type ResidentFavoriteToggleResult = 'added' | 'removed' | 'full' | 'invalid';
export type ResidentFavoritePromoteResult = 'promoted' | 'unchanged' | 'invalid';

export const RESIDENT_FAVORITE_LABELS = ['최애', '차애', '마음친구'] as const;

/**
 * 신뢰 수치 위에 자동으로 찍히는 팬북 리본.
 * 응원 슬롯을 바꾸더라도 이미 쌓인 관계와 리본은 절대 사라지지 않는다.
 */
export const RESIDENT_FAN_RIBBONS: readonly ResidentFanRibbon[] = [
  { threshold: 15, mark: '첫', name: '첫인사 리본', note: '서로의 이름을 처음 기억한 날' },
  { threshold: 30, mark: '단', name: '단골 응원 리본', note: '골목에서 반갑게 마주치는 사이' },
  { threshold: 50, mark: '맘', name: '마음 발견 리본', note: '좋아하는 장면을 알게 된 날' },
  { threshold: 80, mark: '별', name: '별빛 동행 리본', note: '작은 비밀까지 나눈 단짝 이웃' },
  { threshold: 100, mark: '집', name: '평생 응원 리본', note: '마을 가족으로 남은 오래된 마음' },
] as const;

const RESIDENT_IDS = new Set(RESIDENTS.map((resident) => resident.id));

export function normalizeResidentFanbookState(raw: unknown): ResidentFanbookState {
  const value = (raw ?? {}) as Partial<ResidentFanbookState>;
  const favorites = Array.isArray(value.favorites)
    ? [...new Set(value.favorites.filter((id): id is string => typeof id === 'string' && RESIDENT_IDS.has(id)))]
      .slice(0, RESIDENT_FAVORITE_MAX)
    : [];
  return { version: 1, favorites };
}

export function residentFanView(
  residentId: string,
  state: ResidentFanbookState,
  trust: TrustState,
): ResidentFanView | null {
  const resident = RESIDENTS.find((candidate) => candidate.id === residentId);
  if (!resident) return null;
  const value = trustOf(trust, residentId);
  const favoriteIndex = state.favorites.indexOf(residentId);
  const ribbons = RESIDENT_FAN_RIBBONS.map((ribbon) => ({
    ...ribbon, unlocked: value >= ribbon.threshold,
  }));
  const unlockedRibbons = ribbons.filter((ribbon) => ribbon.unlocked).length;
  return {
    resident,
    trust: value,
    favoriteRank: favoriteIndex >= 0 ? favoriteIndex + 1 : null,
    favoriteLabel: favoriteIndex >= 0 ? RESIDENT_FAVORITE_LABELS[favoriteIndex] ?? null : null,
    ribbons,
    unlockedRibbons,
    complete: unlockedRibbons === RESIDENT_FAN_RIBBONS.length,
    nextRibbon: RESIDENT_FAN_RIBBONS.find((ribbon) => value < ribbon.threshold) ?? null,
  };
}

export function residentFanbookProgress(
  state: ResidentFanbookState,
  trust: TrustState,
): ResidentFanbookProgress {
  const views = RESIDENTS.map((resident) => residentFanView(resident.id, state, trust)!);
  return {
    favorites: state.favorites.length,
    ribbons: views.reduce((total, view) => total + view.unlockedRibbons, 0),
    ribbonResidents: views.filter((view) => view.unlockedRibbons > 0).length,
    completedResidents: views.filter((view) => view.complete).length,
    totalRibbons: RESIDENTS.length * RESIDENT_FAN_RIBBONS.length,
  };
}

export class ResidentFanbookStore {
  private state: ResidentFanbookState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-resident-fanbook-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 현재 세션에서만 유지 */ }
    this.state = normalizeResidentFanbookState(raw);
    this.persist();
  }

  get(): ResidentFanbookState { return this.state; }

  toggle(residentId: string): ResidentFavoriteToggleResult {
    if (!RESIDENT_IDS.has(residentId)) return 'invalid';
    if (this.state.favorites.includes(residentId)) {
      this.state = {
        version: 1,
        favorites: this.state.favorites.filter((id) => id !== residentId),
      };
      this.persist();
      return 'removed';
    }
    if (this.state.favorites.length >= RESIDENT_FAVORITE_MAX) return 'full';
    this.state = { version: 1, favorites: [...this.state.favorites, residentId] };
    this.persist();
    return 'added';
  }

  promote(residentId: string): ResidentFavoritePromoteResult {
    const index = this.state.favorites.indexOf(residentId);
    if (index < 0) return 'invalid';
    if (index === 0) return 'unchanged';
    this.state = {
      version: 1,
      favorites: [residentId, ...this.state.favorites.filter((id) => id !== residentId)],
    };
    this.persist();
    return 'promoted';
  }

  progress(trust: TrustState): ResidentFanbookProgress {
    return residentFanbookProgress(this.state, trust);
  }

  view(residentId: string, trust: TrustState): ResidentFanView | null {
    return residentFanView(residentId, this.state, trust);
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션에서만 유지 */ }
  }
}
