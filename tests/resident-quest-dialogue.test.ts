import { describe, expect, it } from 'vitest';
import { residentQuestConversation, RESIDENT_QUEST_VOICES } from '../src/game/residents/residentQuestDialogue';
import { RESIDENTS } from '../src/game/residents/residents';
import type { WorldQuestSignal } from '../src/game/guidance/worldQuestSignals';

function signal(overrides: Partial<WorldQuestSignal> = {}): WorldQuestSignal {
  return {
    questId: 'story_resident_haneul_bond',
    title: '하늘의 두 번째 인사',
    description: '하늘 신뢰도 30 달성하기',
    location: '거리 뮤지션 · 주민 이름표 근처',
    rewardLabel: '하늘의 리듬 배지',
    registryKey: 'resident_haneul_trust',
    progress: 0,
    goal: 30,
    tone: 'available',
    mark: '새',
    shortLabel: '새 이야기',
    target: { type: 'resident', residentId: 'haneul' },
    priority: 180,
    ...overrides,
  };
}

describe('resident quest dialogue', () => {
  const haneul = RESIDENTS.find((resident) => resident.id === 'haneul')!;

  it('gives every named resident a distinct quest voice', () => {
    expect(Object.keys(RESIDENT_QUEST_VOICES)).toHaveLength(RESIDENTS.length);
    expect(new Set(Object.values(RESIDENT_QUEST_VOICES).map((voice) => voice.available)).size)
      .toBe(RESIDENTS.length);
  });

  it('presents a new story without implying a deadline or explicit acceptance gate', () => {
    const view = residentQuestConversation(haneul, signal());
    expect(view).toMatchObject({
      stageLabel: '새로 건네는 이야기',
      stageCode: 'NEW NEIGHBOR STORY',
      progressLabel: '아직 첫 장면 전 · 이미 한 행동은 자동 반영',
      trackLabel: '이 이야기 따라가기',
    });
    expect(view.reassurance).toContain('사라지지 않아요');
  });

  it('reflects current progress and preserves the authored location and reward', () => {
    const view = residentQuestConversation(haneul, signal({ progress: 15, tone: 'progress' }));
    expect(view).toMatchObject({
      stageLabel: '이어지고 있는 이야기',
      progressLabel: '15 / 30 기록됨',
      location: '거리 뮤지션 · 주민 이름표 근처',
      rewardLabel: '하늘의 리듬 배지',
    });
  });

  it('uses the tracked variant when the player chose this story', () => {
    const view = residentQuestConversation(haneul, signal({ progress: 15, tone: 'tracked' }));
    expect(view.stageCode).toBe('TRACKED TOGETHER');
    expect(view.trackLabel).toBe('계속 따라가기');
    expect(view.quote).toContain('마지막 코드');
  });
});
