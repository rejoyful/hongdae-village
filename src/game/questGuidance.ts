import { QUEST_CATEGORY_LABEL, type QuestCategory } from './quests';
import type { QuestView } from './questProgress';

export type QuestGuideTone = 'tracked' | 'first-step' | 'reward' | 'daily' | 'almost' | 'story' | 'collection' | 'mastery';

export interface QuestGuide {
  quest: QuestView;
  tone: QuestGuideTone;
  label: string;
  reason: string;
  action: string;
  manual: boolean;
}

const LONG_TERM_REASON: Record<Exclude<QuestCategory, 'onboarding' | 'daily'>, string> = {
  story: '주민과 장소의 다음 이야기가 이어져요.',
  collection: '도감과 진열장을 채우는 수집 목표예요.',
  mastery: '오래 즐길수록 쌓이는 장기 성장 목표예요.',
};

function available(view: QuestView): boolean {
  return view.unlocked && (!view.done || (view.category === 'daily' && !view.claimed));
}

function progressRatio(view: QuestView): number {
  return view.goal > 0 ? Math.min(view.progress, view.goal) / view.goal : 0;
}

function describe(view: QuestView, manual: boolean): Omit<QuestGuide, 'quest' | 'manual'> {
  if (manual) {
    return {
      tone: 'tracked',
      label: '내가 고른 목표',
      reason: '직접 추적한 목표는 완료할 때까지 HUD에 계속 보여요.',
      action: view.tip ?? view.desc,
    };
  }
  if (view.category === 'daily' && view.done && !view.claimed) {
    return {
      tone: 'reward',
      label: '보상 대기',
      reason: '오늘의 목표를 마쳤어요. 기록이 바뀌기 전에 보상을 챙겨요.',
      action: '모험 일지의 오늘 탭에서 코인 보상 받기',
    };
  }
  if (view.category === 'onboarding') {
    return {
      tone: 'first-step',
      label: '첫걸음 안내',
      reason: '처음 한 번만 익히면 이후 활동은 자동으로 기록돼요.',
      action: view.tip ?? view.desc,
    };
  }
  if (view.category === 'daily') {
    return {
      tone: 'daily',
      label: '오늘의 생활',
      reason: '부담 없이 한 번 즐기고 코인 보상을 받을 수 있어요.',
      action: view.tip ?? view.desc,
    };
  }
  if (view.progress > 0 && progressRatio(view) >= 0.5) {
    return {
      tone: 'almost',
      label: '완료가 가까워요',
      reason: `이미 ${Math.round(progressRatio(view) * 100)}% 진행했어요. 조금만 더 하면 새 배지가 열려요.`,
      action: view.tip ?? view.desc,
    };
  }
  return {
    tone: view.category,
    label: QUEST_CATEGORY_LABEL[view.category],
    reason: LONG_TERM_REASON[view.category],
    action: view.tip ?? view.desc,
  };
}

export function guideForQuest(view: QuestView, manual = false): QuestGuide {
  return { quest: view, manual, ...describe(view, manual) };
}

/**
 * 초보 흐름, 받을 보상, 오늘 할 일, 거의 끝난 목표, 장기 취향을 섞어 한 화면에 제안한다.
 * 같은 분류의 앞쪽 퀘스트만 도배되지 않도록 역할별 후보를 하나씩 뽑는다.
 */
export function recommendQuestGuides(
  views: QuestView[],
  focusedQuestId: string | null = null,
  limit = 6,
): QuestGuide[] {
  if (limit <= 0) return [];
  const candidates = views.filter(available);
  const byId = new Map(candidates.map((view) => [view.id, view]));
  const picks: Array<{ view: QuestView | undefined; manual?: boolean }> = [];

  picks.push({ view: focusedQuestId ? byId.get(focusedQuestId) : undefined, manual: true });
  picks.push({ view: candidates.find((view) => view.category === 'onboarding' && !view.done) });
  picks.push({ view: candidates.find((view) => view.category === 'daily' && view.done && !view.claimed) });
  picks.push({
    view: candidates
      .filter((view) => !view.done && view.progress > 0)
      .sort((a, b) => progressRatio(b) - progressRatio(a) || a.order - b.order)[0],
  });
  picks.push({ view: candidates.find((view) => view.category === 'daily' && !view.done) });
  for (const category of ['story', 'collection', 'mastery'] as const) {
    picks.push({
      view: candidates
        .filter((view) => view.category === category && !view.done)
        .sort((a, b) => Number(b.progress > 0) - Number(a.progress > 0) || a.order - b.order)[0],
    });
  }

  const result: QuestGuide[] = [];
  const used = new Set<string>();
  for (const pick of picks) {
    if (!pick.view || used.has(pick.view.id)) continue;
    used.add(pick.view.id);
    result.push(guideForQuest(pick.view, !!pick.manual));
    if (result.length >= limit) return result;
  }
  for (const view of candidates) {
    if (used.has(view.id)) continue;
    result.push(guideForQuest(view));
    if (result.length >= limit) break;
  }
  return result;
}

/** 직접 추적한 목표가 유효하면 최우선, 아니면 다양성 추천의 첫 항목을 HUD에 보낸다. */
export function selectQuestGuide(views: QuestView[], focusedQuestId: string | null = null): QuestGuide | null {
  return recommendQuestGuides(views, focusedQuestId, 1)[0] ?? null;
}
