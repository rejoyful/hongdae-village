export type SharedProjectContributionKind = 'warmth' | 'green' | 'music' | 'craft' | 'companion' | 'table' | 'water' | 'story';

export interface SharedProjectContributionDef {
  id: SharedProjectContributionKind;
  mark: string;
  name: string;
  note: string;
  color: string;
  dark: string;
}

export interface SharedProjectGlobalState {
  total: number;
  kindCounts: Record<SharedProjectContributionKind, number>;
  updatedAt: number;
}

export interface SharedProjectMemberState {
  total: number;
  kindIds: SharedProjectContributionKind[];
  chapterIds: number[];
  lastDay: string | null;
}

export interface SharedProjectState {
  version: 1;
  global: SharedProjectGlobalState;
  member: SharedProjectMemberState;
}

export interface SharedProjectView extends SharedProjectState {
  chapter: number;
  chapterProgress: number;
  chapterGoal: number;
  completedChapters: number;
  stage: number;
  stageName: string;
  stageProgressPct: number;
  canContribute: boolean;
  day: string;
}

export type SharedProjectContributeResult =
  | { ok: true; view: SharedProjectView }
  | { ok: false; reason: 'today' | 'bad'; view: SharedProjectView };

export const SHARED_PROJECT_ID = 'night_garden';
export const SHARED_PROJECT_CHAPTER_GOAL = 120;
export const SHARED_PROJECT_STAGE_THRESHOLDS = [0, 12, 30, 55, 80, 120] as const;
export const SHARED_PROJECT_STAGE_NAMES = ['빈 광장', '첫 설계선', '초록 골조', '이웃의 쉼터', '등불 정원', '한 장의 밤 완성'] as const;

export const SHARED_PROJECT_CONTRIBUTIONS: readonly SharedProjectContributionDef[] = [
  { id: 'warmth', mark: '온', name: '따뜻한 자리', note: '누구나 잠시 쉬는 의자와 담요의 마음', color: '#d49a6b', dark: '#744f38' },
  { id: 'green', mark: '잎', name: '골목의 초록', note: '계절을 잃지 않는 작은 잎과 화분', color: '#82996e', dark: '#4b5f41' },
  { id: 'music', mark: '음', name: '늦은 리듬', note: '소리를 독점하지 않는 작은 골목 공연', color: '#8d7da4', dark: '#51465f' },
  { id: 'craft', mark: '손', name: '손끝의 결', note: '고쳐 쓰고 나눠 쓰는 생활 제작의 흔적', color: '#78969a', dark: '#435b60' },
  { id: 'companion', mark: '발', name: '작은 동행', note: '물그릇과 낮은 그늘이 있는 함께 걷는 길', color: '#bd8581', dark: '#6b4948' },
  { id: 'table', mark: '상', name: '빈 의자 한 칸', note: '늦게 오는 이웃도 앉을 수 있는 긴 식탁', color: '#b09266', dark: '#655038' },
  { id: 'water', mark: '물', name: '느린 물결', note: '비가 그친 뒤에도 생물이 머무는 작은 수로', color: '#6f94a8', dark: '#405968' },
  { id: 'story', mark: '록', name: '남길 이야기', note: '이름과 생활 장면을 다음 이웃에게 건네는 기록', color: '#aa7d8e', dark: '#604657' },
] as const;

export const SHARED_PROJECT_CONTRIBUTION_BY_ID = new Map(SHARED_PROJECT_CONTRIBUTIONS.map((item) => [item.id, item]));

export function isSharedProjectContributionKind(value: unknown): value is SharedProjectContributionKind {
  return typeof value === 'string' && SHARED_PROJECT_CONTRIBUTION_BY_ID.has(value as SharedProjectContributionKind);
}

export function seoulSharedProjectDay(now: Date | number = Date.now()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now instanceof Date ? now : new Date(now));
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function freshSharedProjectState(): SharedProjectState {
  return {
    version: 1,
    global: { total: 0, kindCounts: Object.fromEntries(SHARED_PROJECT_CONTRIBUTIONS.map((item) => [item.id, 0])) as Record<SharedProjectContributionKind, number>, updatedAt: 0 },
    member: { total: 0, kindIds: [], chapterIds: [], lastDay: null },
  };
}

export function normalizeSharedProjectState(raw: unknown): SharedProjectState {
  const base = freshSharedProjectState();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Partial<SharedProjectState> & {
    globalTotal?: unknown; kindCounts?: unknown; updatedAt?: unknown;
    memberTotal?: unknown; kindIds?: unknown; chapterIds?: unknown; lastDay?: unknown;
  };
  const globalInput = value.global && typeof value.global === 'object' ? value.global : {} as Partial<SharedProjectGlobalState>;
  const memberInput = value.member && typeof value.member === 'object' ? value.member : {} as Partial<SharedProjectMemberState>;
  const rawKindCounts = globalInput.kindCounts ?? value.kindCounts;
  if (rawKindCounts && typeof rawKindCounts === 'object') for (const item of SHARED_PROJECT_CONTRIBUTIONS) {
    base.global.kindCounts[item.id] = count((rawKindCounts as Record<string, unknown>)[item.id]);
  }
  base.global.total = count(globalInput.total ?? value.globalTotal);
  const updated = globalInput.updatedAt ?? value.updatedAt;
  base.global.updatedAt = typeof updated === 'string' ? Math.max(0, Date.parse(updated) || 0) : count(updated);
  base.member.total = count(memberInput.total ?? value.memberTotal);
  const kindIds = memberInput.kindIds ?? value.kindIds;
  base.member.kindIds = Array.isArray(kindIds) ? [...new Set(kindIds.filter(isSharedProjectContributionKind))] : [];
  const chapterIds = memberInput.chapterIds ?? value.chapterIds;
  base.member.chapterIds = Array.isArray(chapterIds) ? [...new Set(chapterIds.map(Number).filter((chapter) => Number.isInteger(chapter) && chapter >= 1 && chapter <= 100_000))].sort((a, b) => a - b) : [];
  const lastDay = memberInput.lastDay ?? value.lastDay;
  base.member.lastDay = typeof lastDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lastDay) ? lastDay : null;
  return base;
}

export function sharedProjectChapter(total: number): { chapter: number; progress: number; completed: number } {
  const safe = count(total);
  if (safe > 0 && safe % SHARED_PROJECT_CHAPTER_GOAL === 0) {
    return { chapter: safe / SHARED_PROJECT_CHAPTER_GOAL, progress: SHARED_PROJECT_CHAPTER_GOAL, completed: safe / SHARED_PROJECT_CHAPTER_GOAL };
  }
  return {
    chapter: Math.floor(safe / SHARED_PROJECT_CHAPTER_GOAL) + 1,
    progress: safe % SHARED_PROJECT_CHAPTER_GOAL,
    completed: Math.floor(safe / SHARED_PROJECT_CHAPTER_GOAL),
  };
}

export function sharedProjectView(state: SharedProjectState, now: Date | number = Date.now()): SharedProjectView {
  const normalized = normalizeSharedProjectState(state);
  const chapter = sharedProjectChapter(normalized.global.total);
  let stage = 0;
  for (let index = 1; index < SHARED_PROJECT_STAGE_THRESHOLDS.length; index += 1) {
    if (chapter.progress >= SHARED_PROJECT_STAGE_THRESHOLDS[index]!) stage = index;
  }
  const lower = SHARED_PROJECT_STAGE_THRESHOLDS[stage]!;
  const upper = SHARED_PROJECT_STAGE_THRESHOLDS[Math.min(stage + 1, SHARED_PROJECT_STAGE_THRESHOLDS.length - 1)]!;
  const stageProgressPct = stage >= SHARED_PROJECT_STAGE_THRESHOLDS.length - 1 ? 100
    : Math.round(Math.max(0, Math.min(1, (chapter.progress - lower) / Math.max(1, upper - lower))) * 100);
  const day = seoulSharedProjectDay(now);
  return {
    ...normalized, chapter: chapter.chapter, chapterProgress: chapter.progress,
    chapterGoal: SHARED_PROJECT_CHAPTER_GOAL, completedChapters: chapter.completed,
    stage, stageName: SHARED_PROJECT_STAGE_NAMES[stage]!, stageProgressPct,
    canContribute: normalized.member.lastDay !== day, day,
  };
}

export class SharedVillageProjectStore {
  private readonly key: string;
  private state: SharedProjectState;

  constructor(userId: string) {
    this.key = `hv-shared-village-project-v1:${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeSharedProjectState(raw); this.persist();
  }

  get(): SharedProjectState { return structuredClone(this.state); }
  view(now: Date | number = Date.now()): SharedProjectView { return sharedProjectView(this.state, now); }

  merge(raw: unknown): SharedProjectView {
    const incoming = normalizeSharedProjectState(raw);
    this.state.global.total = Math.max(this.state.global.total, incoming.global.total);
    this.state.global.updatedAt = Math.max(this.state.global.updatedAt, incoming.global.updatedAt);
    for (const item of SHARED_PROJECT_CONTRIBUTIONS) this.state.global.kindCounts[item.id] = Math.max(this.state.global.kindCounts[item.id], incoming.global.kindCounts[item.id]);
    this.state.member.total = Math.max(this.state.member.total, incoming.member.total);
    this.state.member.kindIds = [...new Set([...this.state.member.kindIds, ...incoming.member.kindIds])];
    this.state.member.chapterIds = [...new Set([...this.state.member.chapterIds, ...incoming.member.chapterIds])].sort((a, b) => a - b);
    if (incoming.member.lastDay && (!this.state.member.lastDay || incoming.member.lastDay > this.state.member.lastDay)) this.state.member.lastDay = incoming.member.lastDay;
    this.persist(); return this.view();
  }

  previewContribute(kind: SharedProjectContributionKind, now: Date | number = Date.now()): SharedProjectContributeResult {
    const view = this.view(now);
    if (!isSharedProjectContributionKind(kind)) return { ok: false, reason: 'bad', view };
    if (!view.canContribute) return { ok: false, reason: 'today', view };
    const nextChapter = sharedProjectChapter(this.state.global.total + 1).chapter;
    this.state.global.total += 1; this.state.global.kindCounts[kind] += 1; this.state.global.updatedAt = now instanceof Date ? now.getTime() : now;
    this.state.member.total += 1;
    if (!this.state.member.kindIds.includes(kind)) this.state.member.kindIds.push(kind);
    if (!this.state.member.chapterIds.includes(nextChapter)) this.state.member.chapterIds.push(nextChapter);
    this.state.member.lastDay = seoulSharedProjectDay(now);
    this.persist(); return { ok: true, view: this.view(now) };
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
