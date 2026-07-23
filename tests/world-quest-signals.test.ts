import { describe, expect, it } from 'vitest';
import { worldQuestSignals } from '../src/game/guidance/worldQuestSignals';
import type { QuestView } from '../src/game/questProgress';
import type { QuestCategory } from '../src/game/quests';
import type { TrustState } from '../src/game/residents/residents';

function quest(
  id: string,
  registryKey: string,
  category: QuestCategory,
  overrides: Partial<QuestView> = {},
): QuestView {
  return {
    id,
    name: id,
    desc: id,
    registryKey,
    goal: 10,
    reward: 0,
    category,
    location: '테스트 장소',
    order: 1,
    progress: 0,
    done: false,
    claimed: false,
    unlocked: true,
    ...overrides,
  };
}

const trust: TrustState = {
  haneul: { v: 45, day: '2026-07-23' },
  moturi: { v: 15, day: '2026-07-23' },
};

describe('world quest signals', () => {
  it('maps a new story to its physical activity without showing fresh collection clutter', () => {
    const result = worldQuestSignals([
      quest('story-cafe', 'q_cafe', 'story'),
      quest('collect-cafe', 'q_cafe', 'collection'),
    ], null, trust);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({
      questId: 'story-cafe',
      tone: 'available',
      target: { type: 'activity', kind: 'cafe' },
    });
  });

  it('keeps only the strongest signal per place', () => {
    const result = worldQuestSignals([
      quest('story-cafe', 'q_cafe', 'story'),
      quest('progress-cafe', 'q_cafe', 'collection', { progress: 8 }),
      quest('tracked-cafe', 'q_cafe', 'mastery', { progress: 2 }),
    ], 'tracked-cafe', trust);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({ questId: 'tracked-cafe', tone: 'tracked', mark: '◆' });
  });

  it('shows a completed unclaimed daily as reward-ready and hides it after claiming', () => {
    const result = worldQuestSignals([
      quest('daily-ready', 'q_busking', 'daily', { progress: 10, done: true }),
      quest('daily-claimed', 'q_cafe', 'daily', { progress: 10, done: true, claimed: true }),
    ], null, trust);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({
      questId: 'daily-ready',
      tone: 'reward',
      target: { type: 'activity', kind: 'quest' },
    });
  });

  it('pins resident bond stories to the named resident and generic greetings to one neighbor', () => {
    const result = worldQuestSignals([
      quest('story_resident_haneul_bond', 'resident_haneul_trust', 'story', { progress: 15, goal: 30 }),
      quest('story-neighbors', 'residents_met', 'story'),
    ], null, trust);

    expect(result.residents).toHaveLength(2);
    expect(result.residents[0]?.target).toEqual({ type: 'resident', residentId: 'haneul' });
    expect(result.residents[1]?.target).toEqual({ type: 'resident', residentId: 'sallim' });
  });

  it('falls panel-only stories back to the quest board and respects visibility limits', () => {
    const result = worldQuestSignals([
      quest('map-story', 'open_map', 'story'),
      quest('home-story', 'visit_home', 'story'),
      quest('photo-story', 'photo_taken', 'story'),
    ], null, trust, { activityLimit: 2 });

    expect(result.activities).toHaveLength(2);
    expect(result.activities.map((signal) => signal.target)).toContainEqual({ type: 'activity', kind: 'quest' });
  });
});
