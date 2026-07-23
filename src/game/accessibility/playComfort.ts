export type ComfortTextSize = 'standard' | 'large' | 'largest';
export type ComfortContrast = 'standard' | 'high';
export type ComfortMotion = 'auto' | 'full' | 'reduced';

export interface PlayComfortState {
  version: 1;
  textSize: ComfortTextSize;
  contrast: ComfortContrast;
  motion: ComfortMotion;
}

export interface PlayComfortView extends PlayComfortState {
  reducedMotion: boolean;
  summary: string;
}

export interface PlayComfortStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type MotionPreference = {
  matches: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
};

const STORAGE_KEY = 'hv-play-comfort-v1';
const TEXT_SIZES = new Set<ComfortTextSize>(['standard', 'large', 'largest']);
const CONTRASTS = new Set<ComfortContrast>(['standard', 'high']);
const MOTIONS = new Set<ComfortMotion>(['auto', 'full', 'reduced']);

export function normalizePlayComfortState(raw: unknown): PlayComfortState {
  const value = raw && typeof raw === 'object' ? raw as Partial<PlayComfortState> : {};
  return {
    version: 1,
    textSize: typeof value.textSize === 'string' && TEXT_SIZES.has(value.textSize as ComfortTextSize)
      ? value.textSize as ComfortTextSize : 'standard',
    contrast: typeof value.contrast === 'string' && CONTRASTS.has(value.contrast as ComfortContrast)
      ? value.contrast as ComfortContrast : 'standard',
    motion: typeof value.motion === 'string' && MOTIONS.has(value.motion as ComfortMotion)
      ? value.motion as ComfortMotion : 'auto',
  };
}

function browserStorage(): PlayComfortStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

function browserMotionPreference(): MotionPreference | null {
  try {
    return typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  } catch {
    return null;
  }
}

/**
 * 가독성과 움직임을 기기 전체에 저장하는 배려 설정.
 * 계정·퀘스트·능력치와 분리해 로그인 전후에도 같은 환경을 유지한다.
 */
export class PlayComfort {
  private state: PlayComfortState;
  private readonly listeners = new Set<(view: PlayComfortView) => void>();

  constructor(
    private readonly storage: PlayComfortStorage | null = browserStorage(),
    private readonly motionPreference: MotionPreference | null = browserMotionPreference(),
  ) {
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(STORAGE_KEY);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 손상된 설정은 안전한 기본값으로 복구 */ }
    this.state = normalizePlayComfortState(raw);
    this.motionPreference?.addEventListener?.('change', () => {
      if (this.state.motion !== 'auto') return;
      this.applyDocument();
      this.emit();
    });
    this.persist();
    this.applyDocument();
  }

  get(): PlayComfortState { return { ...this.state }; }

  current(): PlayComfortView {
    const reducedMotion = this.reducedMotion();
    const text = this.state.textSize === 'standard' ? '기본 글씨'
      : this.state.textSize === 'large' ? '큰 글씨' : '가장 큰 글씨';
    const contrast = this.state.contrast === 'high' ? '선명한 대비' : '기본 대비';
    const motion = reducedMotion ? '움직임 최소화' : '부드러운 움직임';
    return { ...this.state, reducedMotion, summary: `${text} · ${contrast} · ${motion}` };
  }

  reducedMotion(): boolean {
    if (this.state.motion === 'reduced') return true;
    if (this.state.motion === 'full') return false;
    return this.motionPreference?.matches === true;
  }

  setTextSize(textSize: ComfortTextSize): boolean {
    if (!TEXT_SIZES.has(textSize) || this.state.textSize === textSize) return false;
    this.state = { ...this.state, textSize };
    this.commit();
    return true;
  }

  setContrast(contrast: ComfortContrast): boolean {
    if (!CONTRASTS.has(contrast) || this.state.contrast === contrast) return false;
    this.state = { ...this.state, contrast };
    this.commit();
    return true;
  }

  setMotion(motion: ComfortMotion): boolean {
    if (!MOTIONS.has(motion) || this.state.motion === motion) return false;
    this.state = { ...this.state, motion };
    this.commit();
    return true;
  }

  subscribe(listener: (view: PlayComfortView) => void): () => void {
    this.listeners.add(listener);
    listener(this.current());
    return () => this.listeners.delete(listener);
  }

  private commit(): void {
    this.persist();
    this.applyDocument();
    this.emit();
  }

  private persist(): void {
    try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* 세션 안에서 계속 적용 */ }
  }

  private applyDocument(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.hvText = this.state.textSize;
    root.dataset.hvContrast = this.state.contrast;
    root.dataset.hvMotion = this.reducedMotion() ? 'reduced' : 'full';
  }

  private emit(): void {
    const view = this.current();
    for (const listener of this.listeners) listener(view);
  }
}

export const playComfort = new PlayComfort();
