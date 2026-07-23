import type { QuestView } from '../questProgress';
import { RESIDENTS, trustOf, type TrustState } from '../residents/residents';
import { villageRequestDestinationForMetric } from '../requests/villageRequestStories';
import { ISO_VILLAGE_ACTIVITIES, type IsoActivityKind } from '../world/isometricVillageMap';

export type WorldQuestSignalTone = 'tracked' | 'reward' | 'progress' | 'available';

export type WorldQuestSignalTarget =
  | { type: 'activity'; kind: IsoActivityKind }
  | { type: 'resident'; residentId: string };

export interface WorldQuestSignal {
  questId: string;
  title: string;
  description: string;
  location: string;
  rewardLabel: string | null;
  registryKey: string;
  progress: number;
  goal: number;
  tone: WorldQuestSignalTone;
  mark: '◆' | '✓' | '↗' | '새';
  shortLabel: '추적' | '보상' | '진행' | '새 이야기';
  target: WorldQuestSignalTarget;
  priority: number;
}

export interface WorldQuestSignalSet {
  activities: WorldQuestSignal[];
  residents: WorldQuestSignal[];
}

export interface WorldQuestSignalOptions {
  activityLimit?: number;
  residentLimit?: number;
}

const ACTIVITY_KINDS = new Set<IsoActivityKind>(ISO_VILLAGE_ACTIVITIES.map((spot) => spot.kind));

function signalTone(view: QuestView, focusedQuestId: string | null): WorldQuestSignalTone | null {
  if (!view.unlocked) return null;
  if (view.category === 'daily' && view.done && !view.claimed) return 'reward';
  if (view.done) return null;
  if (view.id === focusedQuestId) return 'tracked';
  if (view.progress > 0) return 'progress';
  if (view.category === 'onboarding' || view.category === 'story') return 'available';
  return null;
}

function tonePresentation(tone: WorldQuestSignalTone): Pick<WorldQuestSignal, 'mark' | 'shortLabel'> {
  if (tone === 'tracked') return { mark: '◆', shortLabel: '추적' };
  if (tone === 'reward') return { mark: '✓', shortLabel: '보상' };
  if (tone === 'progress') return { mark: '↗', shortLabel: '진행' };
  return { mark: '새', shortLabel: '새 이야기' };
}

function signalPriority(view: QuestView, tone: WorldQuestSignalTone): number {
  const ratio = view.goal > 0 ? Math.min(view.progress, view.goal) / view.goal : 0;
  if (tone === 'tracked') return 500;
  if (tone === 'reward') return 400;
  if (tone === 'progress') {
    const category = view.category === 'onboarding' || view.category === 'story'
      ? 320
      : view.category === 'daily'
        ? 300
        : view.category === 'collection'
          ? 280
          : 260;
    return category + Math.round(ratio * 30);
  }
  return view.category === 'onboarding' ? 220 : 180;
}

function specificResidentId(view: QuestView): string | null {
  const metric = /^resident_([a-z0-9-]+)_trust$/.exec(view.registryKey)?.[1];
  if (metric && RESIDENTS.some((resident) => resident.id === metric)) return metric;
  const quest = /^story_resident_([a-z0-9-]+)_bond$/.exec(view.id)?.[1];
  return quest && RESIDENTS.some((resident) => resident.id === quest) ? quest : null;
}

function genericResidentId(metric: string, trust: TrustState): string | null {
  const residents = [...RESIDENTS];
  if (metric === 'resident_greet' || metric === 'residents_met') {
    residents.sort((a, b) => trustOf(trust, a.id) - trustOf(trust, b.id));
  } else {
    residents.sort((a, b) => trustOf(trust, b.id) - trustOf(trust, a.id));
  }
  return residents[0]?.id ?? null;
}

function targetFor(view: QuestView, tone: WorldQuestSignalTone, trust: TrustState): WorldQuestSignalTarget {
  if (tone === 'reward') return { type: 'activity', kind: 'quest' };
  const specificResident = specificResidentId(view);
  if (specificResident) return { type: 'resident', residentId: specificResident };

  const destination = villageRequestDestinationForMetric(view.registryKey);
  if (destination === 'residents') {
    return { type: 'resident', residentId: genericResidentId(view.registryKey, trust) ?? RESIDENTS[0]!.id };
  }
  if (destination && ACTIVITY_KINDS.has(destination as IsoActivityKind)) {
    return { type: 'activity', kind: destination as IsoActivityKind };
  }
  // 지도·명함·채팅처럼 별도 패널에서 이어지는 기록과 외곽숲 목표는
  // 중앙 모험 일지에서 한 번만 안내해 월드 표식이 흩어지지 않게 한다.
  return { type: 'activity', kind: 'quest' };
}

function targetKey(target: WorldQuestSignalTarget): string {
  return target.type === 'activity' ? `activity:${target.kind}` : `resident:${target.residentId}`;
}

function sortSignals(a: WorldQuestSignal, b: WorldQuestSignal): number {
  return b.priority - a.priority || b.progress / Math.max(1, b.goal) - a.progress / Math.max(1, a.goal)
    || a.title.localeCompare(b.title);
}

/**
 * 수백 개의 퀘스트 중 지금 월드에서 의미 있는 신호만 고른다.
 * 한 장소에는 가장 중요한 한 건만 남기고, 새 수집·숙련 목표는 일지 안에 보존한다.
 */
export function worldQuestSignals(
  views: readonly QuestView[],
  focusedQuestId: string | null,
  trust: TrustState,
  options: WorldQuestSignalOptions = {},
): WorldQuestSignalSet {
  const candidates: WorldQuestSignal[] = [];
  for (const view of views) {
    const tone = signalTone(view, focusedQuestId);
    if (!tone) continue;
    candidates.push({
      questId: view.id,
      title: view.name,
      description: view.desc,
      location: view.location,
      rewardLabel: view.rewardLabel ?? null,
      registryKey: view.registryKey,
      progress: view.progress,
      goal: view.goal,
      tone,
      ...tonePresentation(tone),
      target: targetFor(view, tone, trust),
      priority: signalPriority(view, tone),
    });
  }

  candidates.sort(sortSignals);
  const strongestByTarget = new Map<string, WorldQuestSignal>();
  for (const signal of candidates) {
    const key = targetKey(signal.target);
    if (!strongestByTarget.has(key)) strongestByTarget.set(key, signal);
  }

  const selected = [...strongestByTarget.values()].sort(sortSignals);
  return {
    activities: selected
      .filter((signal) => signal.target.type === 'activity')
      .slice(0, Math.max(0, options.activityLimit ?? 8)),
    residents: selected
      .filter((signal) => signal.target.type === 'resident')
      .slice(0, Math.max(0, options.residentLimit ?? 2)),
  };
}

export function worldQuestSignalSignature(signals: WorldQuestSignalSet): string {
  return [...signals.activities, ...signals.residents]
    .map((signal) => `${targetKey(signal.target)}:${signal.questId}:${signal.tone}`)
    .join('|');
}
