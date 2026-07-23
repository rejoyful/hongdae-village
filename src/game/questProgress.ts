import { ALL_QUESTS, DAILY_QUESTS, QUEST_BY_ID, type QuestDef } from './quests';

/**
 * 퀘스트 진행 지속 저장소.
 * counts/claimed는 기존 일일 저장 계약을 유지하고 lifetimeCounts가 영구 일지를 담당한다.
 */
export interface QuestState {
  day: string;
  counts: Record<string, number>;
  claimed: string[];
  version?: 2;
  lifetimeCounts?: Record<string, number>;
  focusedQuestId?: string;
}

export interface QuestView extends QuestDef {
  progress: number;
  done: boolean;
  claimed: boolean;
  unlocked: boolean;
}

export function todaySeoul(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

const KEY_PREFIX = 'hv-quests-';

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

function blankDailyCounts(): Record<string, number> {
  return Object.fromEntries(DAILY_QUESTS.map((q) => [q.registryKey, 0]));
}

function cleanLifetime(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw)) out[key] = cleanCount(value);
  return out;
}

function cleanFocusedQuestId(value: unknown): string | undefined {
  return typeof value === 'string' && QUEST_BY_ID.has(value) ? value : undefined;
}

function fresh(day: string, lifetimeCounts: Record<string, number> = {}, focusedQuestId?: string): QuestState {
  return { version: 2, day, counts: blankDailyCounts(), claimed: [], lifetimeCounts, focusedQuestId };
}

/** 날짜가 바뀌면 일일 항목만 리셋하고 영구 모험 기록은 보존한다. */
export function normalizeState(raw: unknown, today: string): QuestState {
  const o = (raw ?? {}) as Partial<QuestState>;
  const lifetimeCounts = cleanLifetime(o.lifetimeCounts);
  const focusedQuestId = cleanFocusedQuestId(o.focusedQuestId);
  if (o.day !== today || typeof o.counts !== 'object' || o.counts === null) return fresh(today, lifetimeCounts, focusedQuestId);

  const counts = blankDailyCounts();
  for (const q of DAILY_QUESTS) counts[q.registryKey] = cleanCount(o.counts[q.registryKey]);
  const claimed = Array.isArray(o.claimed)
    ? [...new Set(o.claimed.filter((c): c is string => typeof c === 'string'))]
    : [];
  return { version: 2, day: today, counts, claimed, lifetimeCounts, focusedQuestId };
}

function maxGoal(registryKey: string, daily: boolean): number {
  const matches = (daily ? DAILY_QUESTS : ALL_QUESTS.filter((q) => q.category !== 'daily'))
    .filter((q) => q.registryKey === registryKey);
  return matches.length ? Math.max(...matches.map((q) => q.goal)) : Number.MAX_SAFE_INTEGER;
}

/** 이벤트를 1회 이상 기록. 일일과 영구 목표가 같은 행동을 구독할 수 있다. */
export function bumpQuest(state: QuestState, registryKey: string, by = 1): QuestState {
  if (!Number.isFinite(by) || by <= 0) return state;
  const amount = Math.floor(by);
  const dailyCap = maxGoal(registryKey, true);
  const counts = {
    ...state.counts,
    [registryKey]: Math.min(dailyCap, (state.counts[registryKey] ?? 0) + amount),
  };
  const lifetime = state.lifetimeCounts ?? {};
  const lifetimeCounts = {
    ...lifetime,
    // 퀘스트 UI만 progressFor에서 목표치로 제한한다. 평생 기록은 숙련·통계가 쓰므로 계속 보존한다.
    [registryKey]: Math.min(Number.MAX_SAFE_INTEGER, (lifetime[registryKey] ?? 0) + amount),
  };
  return { ...state, version: 2, counts, lifetimeCounts };
}

/** 레벨·보유 수처럼 현재 최댓값이 중요한 지표를 동기화한다. 값은 뒤로 가지 않는다. */
export function setQuestMetric(state: QuestState, registryKey: string, value: number): QuestState {
  if (!Number.isFinite(value) || value < 0) return state;
  const lifetime = state.lifetimeCounts ?? {};
  const next = Math.min(Number.MAX_SAFE_INTEGER, Math.max(lifetime[registryKey] ?? 0, Math.floor(value)));
  if (next === (lifetime[registryKey] ?? 0)) return state;
  return { ...state, version: 2, lifetimeCounts: { ...lifetime, [registryKey]: next } };
}

export function markClaimed(state: QuestState, questId: string): QuestState {
  if (state.claimed.includes(questId)) return state;
  return { ...state, claimed: [...state.claimed, questId] };
}

export function progressFor(state: QuestState, quest: QuestDef): number {
  const source = quest.category === 'daily' ? state.counts : (state.lifetimeCounts ?? {});
  return Math.min(source[quest.registryKey] ?? 0, quest.goal);
}

export function isQuestDone(state: QuestState, questId: string): boolean {
  const q = ALL_QUESTS.find((item) => item.id === questId);
  return !!q && progressFor(state, q) >= q.goal;
}

/** 잠겼거나 끝난 목표는 추적하지 않는다. null은 자동 추천으로 돌아간다는 뜻이다. */
export function setFocusedQuest(state: QuestState, questId: string | null): QuestState {
  if (questId === null) {
    if (!state.focusedQuestId) return state;
    const { focusedQuestId: _removed, ...rest } = state;
    return rest;
  }
  const view = questViews(state).find((quest) => quest.id === questId);
  if (!view || !view.unlocked || view.done) return state;
  return { ...state, focusedQuestId: questId };
}

export function reconcileFocusedQuest(state: QuestState): QuestState {
  if (!state.focusedQuestId || !isQuestDone(state, state.focusedQuestId)) return state;
  return setFocusedQuest(state, null);
}

/** 달성한 일일 퀘스트 수 — 기존 하트 HUD 계약. */
export function doneCount(state: QuestState): number {
  return DAILY_QUESTS.filter((q) => progressFor(state, q) >= q.goal).length;
}

export function questViews(state: QuestState): QuestView[] {
  const doneIds = new Set(ALL_QUESTS.filter((q) => progressFor(state, q) >= q.goal).map((q) => q.id));
  return ALL_QUESTS.map((q) => {
    const progress = progressFor(state, q);
    return {
      ...q,
      progress,
      done: progress >= q.goal,
      claimed: q.category === 'daily' && state.claimed.includes(q.id),
      unlocked: !q.prerequisite || doneIds.has(q.prerequisite),
    };
  });
}

/** 세션·기기 지속 저장소 래퍼 — userId별로 분리. */
export class QuestStore {
  private state: QuestState;
  private readonly storeKey: string;

  constructor(userId: string, today = todaySeoul()) {
    this.storeKey = KEY_PREFIX + userId;
    let raw: unknown = null;
    try {
      const s = localStorage.getItem(this.storeKey);
      if (s) raw = JSON.parse(s);
    } catch { /* 저장소 불가 — 세션 한정 */ }
    this.state = normalizeState(raw, today);
    this.persist();
  }

  get(): QuestState { return this.state; }

  /** 서버 동기 — 스냅샷/복원 (오늘 기준 정규화로 일일 리셋 반영) */
  snapshot(): QuestState { return this.state; }
  hydrate(raw: unknown): void { this.state = normalizeState(raw, todaySeoul()); this.persist(); }

  progress(): Map<string, number> {
    return new Map(DAILY_QUESTS.map((q) => [q.registryKey, this.state.counts[q.registryKey] ?? 0]));
  }

  views(): QuestView[] { return questViews(this.state); }

  bump(registryKey: string, by = 1): void {
    this.state = reconcileFocusedQuest(bumpQuest(this.state, registryKey, by));
    this.persist();
  }

  setMetric(registryKey: string, value: number): void {
    this.state = reconcileFocusedQuest(setQuestMetric(this.state, registryKey, value));
    this.persist();
  }

  claim(questId: string): void {
    this.state = markClaimed(this.state, questId);
    this.persist();
  }

  isClaimed(questId: string): boolean { return this.state.claimed.includes(questId); }
  doneCount(): number { return doneCount(this.state); }
  focusedQuestId(): string | null { return this.state.focusedQuestId ?? null; }

  focusQuest(questId: string | null): boolean {
    const next = setFocusedQuest(this.state, questId);
    if (next === this.state) return questId === this.state.focusedQuestId || (questId === null && !this.state.focusedQuestId);
    this.state = next;
    this.persist();
    return true;
  }

  private persist(): void {
    try { localStorage.setItem(this.storeKey, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
