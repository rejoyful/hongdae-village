export type AdventureComfortMode = 'peaceful' | 'expedition';

export interface AdventureComfortState {
  version: 1;
  mode: AdventureComfortMode;
  everStarted: boolean;
  everRestored: boolean;
}

export interface AdventureComfortProgress {
  adventure_mode_started: number;
  adventure_mode_restored: number;
}

export interface AdventureComfortStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type AdventureComfortChange = 'unchanged' | 'expedition' | 'peaceful';

const MODES = new Set<AdventureComfortMode>(['peaceful', 'expedition']);

/**
 * 새 이웃은 외곽숲에서도 먼저 관찰만 한다. 전투는 HUD에서 본인이 원정 모드를 켠 뒤에만 시작된다.
 * 기존 저장이 손상되어도 공격적인 상태로 추측하지 않는 것이 이 시스템의 안전 기본값이다.
 */
export function normalizeAdventureComfortState(raw: unknown): AdventureComfortState {
  const value = raw && typeof raw === 'object' ? raw as Partial<AdventureComfortState> : {};
  const mode = typeof value.mode === 'string' && MODES.has(value.mode as AdventureComfortMode)
    ? value.mode as AdventureComfortMode
    : 'peaceful';
  const everStarted = value.everStarted === true || mode === 'expedition';
  return {
    version: 1,
    mode,
    everStarted,
    everRestored: everStarted && value.everRestored === true,
  };
}

function browserStorage(): AdventureComfortStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class AdventureComfortStore {
  private state: AdventureComfortState;
  private readonly key: string;

  constructor(userId: string, private readonly storage: AdventureComfortStorage | null = browserStorage()) {
    this.key = `hv-adventure-comfort-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 안에서는 안전 기본값으로 계속 플레이 */ }
    this.state = normalizeAdventureComfortState(raw);
    this.persist();
  }

  get(): AdventureComfortState { return { ...this.state }; }

  combatEnabled(): boolean { return this.state.mode === 'expedition'; }

  setMode(mode: AdventureComfortMode): AdventureComfortChange {
    if (!MODES.has(mode) || this.state.mode === mode) return 'unchanged';
    const everStarted = this.state.everStarted || mode === 'expedition';
    this.state = {
      version: 1,
      mode,
      everStarted,
      everRestored: this.state.everRestored || (mode === 'peaceful' && everStarted),
    };
    this.persist();
    return mode;
  }

  toggle(): AdventureComfortChange {
    return this.setMode(this.combatEnabled() ? 'peaceful' : 'expedition');
  }

  progress(): AdventureComfortProgress {
    return {
      adventure_mode_started: this.state.everStarted ? 1 : 0,
      adventure_mode_restored: this.state.everRestored ? 1 : 0,
    };
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
