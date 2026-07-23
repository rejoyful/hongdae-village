import { QUEST_BY_ID, type QuestCategory } from '../quests';
import type { QuestView } from '../questProgress';

const KEY = 'hv-session-planner-v1';
export const SESSION_PLAN_MAX = 3;
export const SESSION_PLAN_ARCHIVE_MAX = 12;

export interface SessionPlanArchive {
  id: string;
  questIds: [string, string, string];
  completedAt: number;
}

export interface SessionPlannerState {
  version: 1;
  questIds: string[];
  archives: SessionPlanArchive[];
  featuredArchiveId: string | null;
  totalArchived: number;
}

export interface SessionPlanSlotView {
  slot: number;
  quest: QuestView;
  active: boolean;
}

export interface SessionPlanArchiveView extends SessionPlanArchive {
  names: string[];
  categories: QuestCategory[];
  featured: boolean;
}

export interface SessionPlannerView {
  slots: SessionPlanSlotView[];
  recommendations: QuestView[];
  readyToArchive: boolean;
  nextQuest: QuestView | null;
  archives: SessionPlanArchiveView[];
}

export interface SessionPlannerProgress {
  slots: number;
  archivedPages: number;
  archivedQuests: number;
  archivedCategories: number;
  featured: number;
}

export type SessionPlanToggleResult = 'added' | 'removed' | 'full' | 'locked' | 'done' | 'missing';
export type SessionPlanArchiveResult =
  | { ok: true; archive: SessionPlanArchive }
  | { ok: false; reason: 'not-full' | 'not-complete' | 'missing' };

const validQuestId = (value: unknown): value is string => typeof value === 'string' && QUEST_BY_ID.has(value);
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function freshSessionPlannerState(): SessionPlannerState {
  return { version: 1, questIds: [], archives: [], featuredArchiveId: null, totalArchived: 0 };
}

export function normalizeSessionPlannerState(raw: unknown): SessionPlannerState {
  if (!raw || typeof raw !== 'object') return freshSessionPlannerState();
  const value = raw as Partial<SessionPlannerState>;
  const questIds = Array.isArray(value.questIds)
    ? [...new Set(value.questIds.filter(validQuestId))].slice(0, SESSION_PLAN_MAX)
    : [];
  const archiveIds = new Set<string>();
  const archives: SessionPlanArchive[] = [];
  if (Array.isArray(value.archives)) {
    for (const rawArchive of value.archives) {
      if (!rawArchive || typeof rawArchive !== 'object') continue;
      const archive = rawArchive as Partial<SessionPlanArchive>;
      const ids = Array.isArray(archive.questIds) ? [...new Set(archive.questIds.filter(validQuestId))] : [];
      if (typeof archive.id !== 'string' || !archive.id || archiveIds.has(archive.id) || ids.length !== 3) continue;
      archiveIds.add(archive.id);
      archives.push({
        id: archive.id.slice(0, 80),
        questIds: ids as [string, string, string],
        completedAt: cleanCount(archive.completedAt),
      });
      if (archives.length >= SESSION_PLAN_ARCHIVE_MAX) break;
    }
  }
  const featuredArchiveId = typeof value.featuredArchiveId === 'string' && archiveIds.has(value.featuredArchiveId)
    ? value.featuredArchiveId
    : null;
  return {
    version: 1,
    questIds,
    archives,
    featuredArchiveId,
    totalArchived: Math.max(cleanCount(value.totalArchived), archives.length),
  };
}

function ratio(quest: QuestView): number {
  return quest.goal > 0 ? quest.progress / quest.goal : 0;
}

/** 현재 큐와 겹치지 않게, 거의 끝난 목표와 서로 다른 분류·장소를 우선 추천한다. */
export function recommendSessionPlan(views: readonly QuestView[], excludedIds: Iterable<string>, limit = 6): QuestView[] {
  const excluded = new Set(excludedIds);
  const candidates = views.filter((quest) => quest.unlocked && !quest.done && !excluded.has(quest.id));
  const picked: QuestView[] = [];
  const usedCategories = new Set<QuestCategory>();
  const usedLocations = new Set<string>();
  const sorted = [...candidates].sort((a, b) => {
    const aStarted = Number(a.progress > 0);
    const bStarted = Number(b.progress > 0);
    return bStarted - aStarted || ratio(b) - ratio(a) || a.goal - b.goal || a.order - b.order;
  });
  while (picked.length < limit && sorted.length) {
    sorted.sort((a, b) => {
      const aFresh = Number(!usedCategories.has(a.category)) + Number(!usedLocations.has(a.location));
      const bFresh = Number(!usedCategories.has(b.category)) + Number(!usedLocations.has(b.location));
      return bFresh - aFresh || Number(b.progress > 0) - Number(a.progress > 0)
        || ratio(b) - ratio(a) || a.goal - b.goal || a.order - b.order;
    });
    const next = sorted.shift()!;
    picked.push(next);
    usedCategories.add(next.category);
    usedLocations.add(next.location);
  }
  return picked;
}

export function sessionPlannerView(state: SessionPlannerState, views: readonly QuestView[]): SessionPlannerView {
  const byId = new Map(views.map((quest) => [quest.id, quest]));
  const slots = state.questIds.flatMap((id, slot) => {
    const quest = byId.get(id);
    return quest ? [{ slot, quest, active: !quest.done && !state.questIds.slice(0, slot).some((prior) => !byId.get(prior)?.done) }] : [];
  });
  const nextQuest = slots.find((slot) => !slot.quest.done)?.quest ?? null;
  const archives = state.archives.map((archive) => {
    const defs = archive.questIds.map((id) => QUEST_BY_ID.get(id)).filter(Boolean);
    return {
      ...archive,
      names: defs.map((quest) => quest!.name),
      categories: [...new Set(defs.map((quest) => quest!.category))],
      featured: state.featuredArchiveId === archive.id,
    };
  });
  return {
    slots,
    recommendations: recommendSessionPlan(views, state.questIds, Math.max(3, 6 - state.questIds.length)),
    readyToArchive: slots.length === SESSION_PLAN_MAX && slots.every((slot) => slot.quest.done),
    nextQuest,
    archives,
  };
}

export function sessionPlannerProgress(state: SessionPlannerState): SessionPlannerProgress {
  const archivedIds = state.archives.flatMap((archive) => archive.questIds);
  return {
    slots: state.questIds.length,
    archivedPages: state.totalArchived,
    archivedQuests: state.totalArchived * SESSION_PLAN_MAX,
    archivedCategories: new Set(archivedIds.map((id) => QUEST_BY_ID.get(id)?.category).filter(Boolean)).size,
    featured: state.featuredArchiveId ? 1 : 0,
  };
}

export class SessionPlannerStore {
  private readonly key: string;
  private state: SessionPlannerState;

  constructor(userId: string) {
    this.key = `${KEY}:${userId}`;
    try { this.state = normalizeSessionPlannerState(JSON.parse(localStorage.getItem(this.key) ?? '{}')); }
    catch { this.state = freshSessionPlannerState(); }
  }

  private save(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 계획 저장 실패가 플레이를 막지 않는다. */ }
  }

  get(): SessionPlannerState { return normalizeSessionPlannerState(this.state); }
  view(views: readonly QuestView[]): SessionPlannerView { return sessionPlannerView(this.state, views); }
  progress(): SessionPlannerProgress { return sessionPlannerProgress(this.state); }
  has(questId: string): boolean { return this.state.questIds.includes(questId); }

  toggle(questId: string, views: readonly QuestView[]): SessionPlanToggleResult {
    if (this.state.questIds.includes(questId)) {
      this.state.questIds = this.state.questIds.filter((id) => id !== questId);
      this.save();
      return 'removed';
    }
    const quest = views.find((item) => item.id === questId);
    if (!quest) return 'missing';
    if (!quest.unlocked) return 'locked';
    if (quest.done) return 'done';
    if (this.state.questIds.length >= SESSION_PLAN_MAX) return 'full';
    this.state.questIds.push(questId);
    this.save();
    return 'added';
  }

  archive(views: readonly QuestView[]): SessionPlanArchiveResult {
    if (this.state.questIds.length !== SESSION_PLAN_MAX) return { ok: false, reason: 'not-full' };
    const byId = new Map(views.map((quest) => [quest.id, quest]));
    const quests = this.state.questIds.map((id) => byId.get(id));
    if (quests.some((quest) => !quest)) return { ok: false, reason: 'missing' };
    if (quests.some((quest) => !quest!.done)) return { ok: false, reason: 'not-complete' };
    const completedAt = Date.now();
    const archive: SessionPlanArchive = {
      id: `${completedAt}-${this.state.totalArchived + 1}`,
      questIds: [...this.state.questIds] as [string, string, string],
      completedAt,
    };
    this.state.archives = [archive, ...this.state.archives].slice(0, SESSION_PLAN_ARCHIVE_MAX);
    if (this.state.featuredArchiveId && !this.state.archives.some((item) => item.id === this.state.featuredArchiveId)) {
      this.state.featuredArchiveId = null;
    }
    this.state.questIds = [];
    this.state.totalArchived += 1;
    this.save();
    return { ok: true, archive };
  }

  feature(archiveId: string): 'featured' | 'cleared' | 'missing' {
    if (!this.state.archives.some((archive) => archive.id === archiveId)) return 'missing';
    if (this.state.featuredArchiveId === archiveId) {
      this.state.featuredArchiveId = null;
      this.save();
      return 'cleared';
    }
    this.state.featuredArchiveId = archiveId;
    this.save();
    return 'featured';
  }
}
