import type {
  StarterCompassConciergeStage, StarterCompassConciergeView, StarterCompassRouteId,
} from '../progression/starterCompass';

export interface StarterConciergeState {
  version: 1;
  collapsed: boolean;
  opened: boolean;
  guideCount: number;
  guidedKeys: string[];
  guidedRouteIds: StarterCompassRouteId[];
}

export interface StarterConciergeProgress {
  guides: number;
  uniqueActivities: number;
  directionsGuided: number;
  collapsed: boolean;
}

export interface StarterConciergeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StarterConciergePresentation {
  code: string;
  title: string;
  body: string;
  status: string;
  action: string;
}

const ROUTE_IDS = new Set<StarterCompassRouteId>(['style', 'home', 'companion', 'neighbor', 'maker', 'explorer']);
const KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function freshStarterConciergeState(): StarterConciergeState {
  return {
    version: 1,
    collapsed: false,
    opened: false,
    guideCount: 0,
    guidedKeys: [],
    guidedRouteIds: [],
  };
}

export function normalizeStarterConciergeState(raw: unknown): StarterConciergeState {
  if (!raw || typeof raw !== 'object') return freshStarterConciergeState();
  const value = raw as Partial<StarterConciergeState>;
  return {
    version: 1,
    collapsed: value.collapsed === true,
    opened: value.opened === true,
    guideCount: cleanCount(value.guideCount),
    guidedKeys: Array.isArray(value.guidedKeys)
      ? [...new Set(value.guidedKeys.filter((key): key is string => (
        typeof key === 'string' && KEY_PATTERN.test(key)
      )))].slice(0, 64)
      : [],
    guidedRouteIds: Array.isArray(value.guidedRouteIds)
      ? [...new Set(value.guidedRouteIds.filter((id): id is StarterCompassRouteId => (
        typeof id === 'string' && ROUTE_IDS.has(id as StarterCompassRouteId)
      )))]
      : [],
  };
}

const PRESENTATIONS: Record<StarterCompassConciergeStage, Omit<StarterConciergePresentation, 'status'>> = {
  choose: {
    code: 'WELCOME DESK · NO WRONG WAY',
    title: '오늘 끌리는 한 방향만 골라요',
    body: '여섯 방향은 모두 열려 있고 선택은 안내만 바꿉니다. 지금 하지 않은 활동도 사라지지 않아요.',
    action: '이 방향으로 시작',
  },
  'first-step': {
    code: 'FIRST SMALL STEP',
    title: '세 가지 중 편한 것부터',
    body: '순서도 시간 제한도 없어요. 길 안내를 켜면 안전한 실제 장소까지만 표시합니다.',
    action: '이 활동 길 안내',
  },
  'one-left': {
    code: 'ONE GENTLE STEP LEFT',
    title: '한 번만 더 경험하면 첫 방향 완성',
    body: '이미 한 활동은 영구 기록됐어요. 남은 제안 중 마음 가는 하나만 해도 충분합니다.',
    action: '다음 활동 길 안내',
  },
  complete: {
    code: 'FIRST DIRECTION FOUND',
    title: '첫 방향을 찾았어요',
    body: '완료한 방향은 그대로 남습니다. 다른 방향으로 옮겨도 기념품과 진행은 사라지지 않아요.',
    action: '다음 방향 추천',
  },
  'all-complete': {
    code: 'ALL DIRECTIONS FOUND',
    title: '여섯 방식으로 마을을 살아 봤어요',
    body: '이제 안내 없이도, 다시 펼쳐도 괜찮아요. 모험 일지에는 각 방향의 멘토 이야기가 이어집니다.',
    action: '성장 이야기 보기',
  },
};

export function starterConciergePresentation(view: StarterCompassConciergeView): StarterConciergePresentation {
  const base = PRESENTATIONS[view.stage];
  const status = view.stage === 'all-complete'
    ? '6/6 방향 완성'
    : view.route
      ? `${view.route.title} · ${Math.min(view.route.completed, view.route.required)}/${view.route.required}`
      : '부담 없는 첫 선택';
  return { ...base, status };
}

function browserStorage(): StarterConciergeStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class StarterConciergeStore {
  private state: StarterConciergeState;
  private readonly key: string;

  constructor(userId: string, private readonly storage: StarterConciergeStorage | null = browserStorage()) {
    this.key = `hv-starter-concierge-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 손상된 안내 상태 대신 안전한 기본 상태 사용 */ }
    this.state = normalizeStarterConciergeState(raw);
    this.persist();
  }

  get(): StarterConciergeState { return structuredClone(this.state); }

  progress(): StarterConciergeProgress {
    return {
      guides: this.state.guideCount,
      uniqueActivities: this.state.guidedKeys.length,
      directionsGuided: this.state.guidedRouteIds.length,
      collapsed: this.state.collapsed,
    };
  }

  setCollapsed(collapsed: boolean): boolean {
    if (this.state.collapsed === collapsed && this.state.opened) return false;
    this.state = { ...this.state, collapsed, opened: true };
    this.persist();
    return true;
  }

  recordGuide(key: string, routeId: StarterCompassRouteId): boolean {
    if (!KEY_PATTERN.test(key) || !ROUTE_IDS.has(routeId)) return false;
    this.state = {
      ...this.state,
      guideCount: this.state.guideCount + 1,
      guidedKeys: [...new Set([...this.state.guidedKeys, key])],
      guidedRouteIds: [...new Set([...this.state.guidedRouteIds, routeId])],
    };
    this.persist();
    return true;
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 안에서 계속 안내 */ }
  }
}
