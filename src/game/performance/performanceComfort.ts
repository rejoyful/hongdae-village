export type QualityMode = 'auto' | 'high' | 'balanced' | 'battery';
export type QualityTier = Exclude<QualityMode, 'auto'>;

export interface DeviceHints {
  memoryGb?: number;
  logicalCores?: number;
  touch?: boolean;
}

export interface FrameSummary {
  averageMs: number;
  p95Ms: number;
  fps: number;
  jankPct: number;
  samples: number;
}

export interface QualityProfile {
  tier: QualityTier;
  ambientMotion: number;
  combatVisualEvery: number;
  shadowAlpha: number;
  decorativeFx: boolean;
}

export interface PerformanceComfortView extends FrameSummary {
  mode: QualityMode;
  tier: QualityTier;
  measuring: boolean;
  reason: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'hv-performance-comfort-v1';
const MODES = new Set<QualityMode>(['auto', 'high', 'balanced', 'battery']);
const RANK: Record<QualityTier, number> = { battery: 0, balanced: 1, high: 2 };

export const QUALITY_PROFILES: Readonly<Record<QualityTier, QualityProfile>> = {
  high: {
    tier: 'high', ambientMotion: 1, combatVisualEvery: 1, shadowAlpha: 1, decorativeFx: true,
  },
  balanced: {
    tier: 'balanced', ambientMotion: .72, combatVisualEvery: 1, shadowAlpha: .82, decorativeFx: true,
  },
  battery: {
    tier: 'battery', ambientMotion: 0, combatVisualEvery: 2, shadowAlpha: .58, decorativeFx: false,
  },
};

export function initialQualityTier(hints: DeviceHints): QualityTier {
  const memory = hints.memoryGb ?? 8;
  const cores = hints.logicalCores ?? 8;
  if (memory <= 2 || cores <= 2) return 'battery';
  if (memory <= 4 || cores <= 4 || (hints.touch && memory <= 6)) return 'balanced';
  return 'high';
}

export function suggestedQuality(summary: Pick<FrameSummary, 'averageMs' | 'p95Ms' | 'jankPct'>): QualityTier {
  if (summary.averageMs > 28 || summary.p95Ms > 48 || summary.jankPct > 24) return 'battery';
  if (summary.averageMs > 19.5 || summary.p95Ms > 31 || summary.jankPct > 10) return 'balanced';
  return 'high';
}

function percentile(values: readonly number[], ratio: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))]!;
}

/** 탭 복귀·디버거 정지처럼 게임 성능과 무관한 긴 delta는 측정에서 제외한다. */
export class FrameTimeMonitor {
  private readonly values: number[] = [];
  private acceptedSinceSummary = 0;

  constructor(
    private readonly windowSize = 180,
    private readonly summaryEvery = 120,
    private readonly minimumSamples = 90,
  ) {}

  record(deltaMs: number): FrameSummary | null {
    if (!Number.isFinite(deltaMs) || deltaMs < 4 || deltaMs > 100) return null;
    this.values.push(deltaMs);
    if (this.values.length > this.windowSize) this.values.shift();
    this.acceptedSinceSummary += 1;
    if (this.values.length < this.minimumSamples || this.acceptedSinceSummary < this.summaryEvery) return null;
    this.acceptedSinceSummary = 0;
    return this.summary();
  }

  summary(): FrameSummary {
    if (!this.values.length) return { averageMs: 0, p95Ms: 0, fps: 0, jankPct: 0, samples: 0 };
    const averageMs = this.values.reduce((total, value) => total + value, 0) / this.values.length;
    const p95Ms = percentile(this.values, .95);
    const jank = this.values.filter((value) => value > 25).length;
    return {
      averageMs,
      p95Ms,
      fps: Math.min(60, Math.round(1_000 / averageMs)),
      jankPct: Math.round((jank / this.values.length) * 100),
      samples: this.values.length,
    };
  }

  reset(): void {
    this.values.length = 0;
    this.acceptedSinceSummary = 0;
  }
}

export class PerformanceComfort {
  private mode: QualityMode;
  private tier: QualityTier;
  private latest: FrameSummary = { averageMs: 0, p95Ms: 0, fps: 0, jankPct: 0, samples: 0 };
  private readonly monitor = new FrameTimeMonitor();
  private readonly listeners = new Set<(view: PerformanceComfortView) => void>();
  private slowWindows = 0;
  private fastWindows = 0;

  constructor(
    private readonly storage?: StorageLike,
    private readonly hints: DeviceHints = {},
  ) {
    const saved = this.readMode();
    this.mode = saved;
    this.tier = saved === 'auto' ? initialQualityTier(hints) : saved;
    this.applyDocumentTier();
  }

  recordFrame(deltaMs: number): void {
    const summary = this.monitor.record(deltaMs);
    if (!summary) return;
    this.latest = summary;
    if (this.mode === 'auto') this.evaluateAutoTier(summary);
    this.emit();
  }

  setMode(mode: QualityMode): void {
    if (!MODES.has(mode)) return;
    this.mode = mode;
    this.slowWindows = 0;
    this.fastWindows = 0;
    if (mode === 'auto') {
      this.tier = this.latest.samples ? suggestedQuality(this.latest) : initialQualityTier(this.hints);
    } else {
      this.tier = mode;
    }
    try { this.storage?.setItem(STORAGE_KEY, mode); } catch { /* private storage or quota */ }
    this.applyDocumentTier();
    this.emit();
  }

  current(): PerformanceComfortView {
    return {
      ...this.latest,
      mode: this.mode,
      tier: this.tier,
      measuring: this.latest.samples === 0,
      reason: this.reason(),
    };
  }

  profile(): QualityProfile { return QUALITY_PROFILES[this.tier]; }

  subscribe(listener: (view: PerformanceComfortView) => void): () => void {
    this.listeners.add(listener);
    listener(this.current());
    return () => this.listeners.delete(listener);
  }

  resetMeasurement(): void {
    this.monitor.reset();
    this.latest = { averageMs: 0, p95Ms: 0, fps: 0, jankPct: 0, samples: 0 };
    this.slowWindows = 0;
    this.fastWindows = 0;
    this.emit();
  }

  private evaluateAutoTier(summary: FrameSummary): void {
    const suggested = suggestedQuality(summary);
    const direction = RANK[suggested] - RANK[this.tier];
    if (direction < 0) {
      this.slowWindows += 1;
      this.fastWindows = 0;
      if (this.slowWindows < 2) return;
      this.tier = RANK[this.tier] - 1 <= 0 ? 'battery' : 'balanced';
    } else if (direction > 0) {
      this.fastWindows += 1;
      this.slowWindows = 0;
      if (this.fastWindows < 6) return;
      this.tier = RANK[this.tier] + 1 >= 2 ? 'high' : 'balanced';
    } else {
      this.slowWindows = 0;
      this.fastWindows = 0;
      return;
    }
    this.slowWindows = 0;
    this.fastWindows = 0;
    this.applyDocumentTier();
  }

  private reason(): string {
    if (this.mode !== 'auto') return '직접 고른 품질을 유지하고 있어요.';
    if (!this.latest.samples) return '기기 사양으로 시작하고 플레이 중 프레임을 천천히 확인해요.';
    if (this.tier === 'battery') return '발열과 끊김을 줄이도록 장식 움직임과 전투 화면 갱신을 낮췄어요.';
    if (this.tier === 'balanced') return '픽셀 선명도는 유지하고 반복 장식만 가볍게 조절했어요.';
    return '현재 기기에서 장식과 그림자를 모두 부드럽게 표시하고 있어요.';
  }

  private readMode(): QualityMode {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return MODES.has(raw as QualityMode) ? raw as QualityMode : 'auto';
    } catch {
      return 'auto';
    }
  }

  private applyDocumentTier(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.hvQuality = this.tier;
  }

  private emit(): void {
    const view = this.current();
    for (const listener of this.listeners) listener(view);
  }
}

const browserHints: DeviceHints = typeof navigator === 'undefined' ? {} : {
  memoryGb: 'deviceMemory' in navigator ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) : undefined,
  logicalCores: navigator.hardwareConcurrency,
  touch: navigator.maxTouchPoints > 0,
};

export const performanceComfort = new PerformanceComfort(
  typeof localStorage === 'undefined' ? undefined : localStorage,
  browserHints,
);
