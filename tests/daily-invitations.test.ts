import { beforeEach, describe, expect, it } from 'vitest';
import type { QuestState } from '../src/game/questProgress';
import { DAILY_INVITATIONS, DailyInvitationStore } from '../src/game/progression/dailyInvitations';
import { LIFE_MASTERIES } from '../src/game/progression/lifeMastery';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const quests = (day: string, lifetimeCounts: Record<string, number> = {}): QuestState => ({
  version: 2, day, counts: {}, claimed: [], lifetimeCounts,
});

describe('개인화 생활 초대장', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('열 생활 분야에 서로 다른 초대장 세 장씩 총 30장을 제공한다', () => {
    expect(DAILY_INVITATIONS).toHaveLength(30);
    expect(new Set(DAILY_INVITATIONS.map((item) => item.id)).size).toBe(30);
    for (const mastery of LIFE_MASTERIES) {
      const cards = DAILY_INVITATIONS.filter((item) => item.masteryId === mastery.id);
      expect(cards).toHaveLength(3);
      expect(cards.every((item) => item.goal > 0 && item.metric && item.location)).toBe(true);
    }
  });

  it('대표 전문성을 우선해 서로 다른 세 분야의 오늘 초대장을 고른다', () => {
    const store = new DailyInvitationStore('personalized');
    const views = store.views(quests('2026-07-23'), ['style_1', 'home_1', 'companion_1']);
    expect(views).toHaveLength(3);
    expect(new Set(views.map((item) => item.id)).size).toBe(3);
    expect(new Set(views.map((item) => item.masteryId))).toEqual(new Set(['style', 'home', 'companion']));
  });

  it('초대장을 연 시점 이전 기록은 제외하고 이후의 오늘 활동만 센다', () => {
    const store = new DailyInvitationStore('baseline');
    const initial = Object.fromEntries(DAILY_INVITATIONS.map((item) => [item.metric, 9]));
    const before = store.views(quests('2026-07-23', initial));
    expect(before.every((item) => item.current === 0)).toBe(true);
    const active = before[0]!;
    const after = { ...initial, [active.metric]: initial[active.metric]! + active.goal };
    expect(store.views(quests('2026-07-23', after))[0]).toMatchObject({ id: active.id, done: true });
  });

  it('무료 교체 뒤에도 같은 날 이미 한 활동의 증가분을 지우지 않는다', () => {
    const store = new DailyInvitationStore('reroll-progress');
    const initial = quests('2026-07-23');
    store.views(initial);
    const allAdvanced = Object.fromEntries([...new Set(DAILY_INVITATIONS.map((item) => item.metric))].map((key) => [key, 10]));
    const replacement = store.reroll(0, quests('2026-07-23', allAdvanced));
    expect(replacement).not.toBeNull();
    const view = store.views(quests('2026-07-23', allAdvanced))[0]!;
    expect(view.id).toBe(replacement);
    expect(view.current).toBeGreaterThan(0);
    expect(store.progress(quests('2026-07-23', allAdvanced)).rerolls).toBe(1);
  });

  it('완료 전 수령을 막고 완료 도장은 날짜가 바뀌어도 영구 보존한다', () => {
    const store = new DailyInvitationStore('stamp');
    const first = store.views(quests('2026-07-23'))[0]!;
    expect(store.claim(first.id, quests('2026-07-23'))).toBe('not-ready');
    const complete = quests('2026-07-23', { [first.metric]: first.goal });
    expect(store.claim(first.id, complete)).toBe('claimed');
    expect(store.claim(first.id, complete)).toBe('already');
    expect(store.progress(complete)).toMatchObject({ todayClaimed: 1, uniqueStamps: 1, totalClaims: 1 });
    const tomorrow = store.progress(quests('2026-07-24', { [first.metric]: first.goal }));
    expect(tomorrow).toMatchObject({ todayClaimed: 0, uniqueStamps: 1, totalClaims: 1 });
    expect(store.stampIds()).toContain(first.id);
  });

  it('완료 도장을 받은 슬롯은 교체하지 못하고 미완료 슬롯만 무료 교체한다', () => {
    const store = new DailyInvitationStore('claimed-reroll');
    const views = store.views(quests('2026-07-23'));
    const first = views[0]!;
    store.claim(first.id, quests('2026-07-23', { [first.metric]: first.goal }));
    expect(store.reroll(0, quests('2026-07-23'))).toBeNull();
    expect(store.reroll(1, quests('2026-07-23'))).not.toBeNull();
    expect(new Set(store.views(quests('2026-07-23')).map((item) => item.id)).size).toBe(3);
  });

  it('손상된 저장본의 중복·알 수 없는 카드와 음수 기록을 안전하게 정리한다', () => {
    localStorage.setItem('hv-daily-invitations-v1:safe', JSON.stringify({
      version: 99, day: '2026-07-23-extra',
      slotIds: ['style_1', 'style_1', 'missing', 'home_1', 'companion_1', 'angler_1'],
      claimedIds: ['style_1', 'missing', 'style_1'], stampIds: ['style_1', 'missing', 'home_1'],
      baselines: { customize_save: -8, q_place: 3.7 }, totalClaims: -4, rerolls: Number.NaN,
    }));
    const store = new DailyInvitationStore('safe');
    const views = store.views(quests('2026-07-23'));
    expect(views).toHaveLength(3);
    expect(new Set(views.map((item) => item.id)).size).toBe(3);
    expect(store.stampIds()).toEqual(['style_1', 'home_1']);
    expect(store.progress(quests('2026-07-23'))).toMatchObject({ totalClaims: 0, rerolls: 0 });
  });
});
