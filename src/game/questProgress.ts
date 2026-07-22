import { DAILY_QUESTS } from './quests';

/**
 * 오늘의 퀘스트 진행 지속 (P2-3) — 새로고침·씬 전환에도 유지.
 * 서버 보상 상한(earn_activity)과 같은 KST 자정 기준으로 매일 리셋.
 * 진행 카운트 + "수령함" 표시를 함께 저장(수령은 서버 원장이 최종 진실).
 */
export interface QuestState {
  day: string;                       // KST YYYY-MM-DD
  counts: Record<string, number>;    // registryKey → 진행수
  claimed: string[];                 // 수령한 questId
}

export function todaySeoul(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

const KEY_PREFIX = 'hv-quests-';

function fresh(day: string): QuestState {
  const counts: Record<string, number> = {};
  for (const q of DAILY_QUESTS) counts[q.registryKey] = 0;
  return { day, counts, claimed: [] };
}

/** 저장 상태를 오늘 기준으로 정규화 — 날짜가 바뀌었으면 새 하루로 리셋 */
export function normalizeState(raw: unknown, today: string): QuestState {
  const o = (raw ?? {}) as Partial<QuestState>;
  if (o.day !== today || typeof o.counts !== 'object' || o.counts === null) return fresh(today);
  const counts: Record<string, number> = {};
  for (const q of DAILY_QUESTS) {
    const v = (o.counts as Record<string, unknown>)[q.registryKey];
    counts[q.registryKey] = typeof v === 'number' && v >= 0 ? Math.floor(v) : 0;
  }
  const claimed = Array.isArray(o.claimed) ? o.claimed.filter((c): c is string => typeof c === 'string') : [];
  return { day: today, counts, claimed };
}

/** 진행 +by (목표 이상은 목표에서 멈춤 — 하트/표시용) */
export function bumpQuest(state: QuestState, registryKey: string, by = 1): QuestState {
  const q = DAILY_QUESTS.find((d) => d.registryKey === registryKey);
  const cap = q ? q.goal : Number.MAX_SAFE_INTEGER;
  const next = Math.min(cap, (state.counts[registryKey] ?? 0) + by);
  return { ...state, counts: { ...state.counts, [registryKey]: next } };
}

export function markClaimed(state: QuestState, questId: string): QuestState {
  if (state.claimed.includes(questId)) return state;
  return { ...state, claimed: [...state.claimed, questId] };
}

/** 달성한(목표 도달) 퀘스트 수 — 하트 채우기용 */
export function doneCount(state: QuestState): number {
  return DAILY_QUESTS.filter((q) => (state.counts[q.registryKey] ?? 0) >= q.goal).length;
}

/** 세션·기기 지속 저장소 래퍼 — userId별로 분리 */
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
    const m = new Map<string, number>();
    for (const q of DAILY_QUESTS) m.set(q.registryKey, this.state.counts[q.registryKey] ?? 0);
    return m;
  }

  bump(registryKey: string, by = 1): void {
    this.state = bumpQuest(this.state, registryKey, by);
    this.persist();
  }

  claim(questId: string): void {
    this.state = markClaimed(this.state, questId);
    this.persist();
  }

  isClaimed(questId: string): boolean { return this.state.claimed.includes(questId); }
  doneCount(): number { return doneCount(this.state); }

  private persist(): void {
    try { localStorage.setItem(this.storeKey, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
