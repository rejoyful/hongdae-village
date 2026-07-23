import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import {
  LOOKBOOK_CONTRACTS, LookbookStore, evaluateLookbookContract, freshLookbookState,
  lookbookProgress, normalizeLookbookState, submitLookbookEntry, suggestLookbookAppearance,
} from '../src/game/art/lookbook';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('골목 룩북 코디 의뢰', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('세 조건짜리 의뢰 12개와 즉시 열린 입문 의뢰 4개를 제공한다', () => {
    expect(LOOKBOOK_CONTRACTS).toHaveLength(12);
    expect(LOOKBOOK_CONTRACTS.every((contract) => contract.rules.length === 3)).toBe(true);
    expect(LOOKBOOK_CONTRACTS.filter((contract) => !contract.prerequisiteBadgeId)).toHaveLength(4);
    expect(new Set(LOOKBOOK_CONTRACTS.map((contract) => contract.id)).size).toBe(12);
  });

  it('조건이 하나도 맞지 않아도 참여 별 하나를 주고 기존 최고 기록은 낮추지 않는다', () => {
    const state = freshLookbookState();
    const contract = LOOKBOOK_CONTRACTS.find((item) => item.id === 'cafe_shift')!;
    const miss = { ...DEFAULT_APPEARANCE, topStyle: 7, bottomStyle: 5, accent: 'e86aa8' };
    expect(evaluateLookbookContract(contract, miss)).toMatchObject({ matched: 0, starsOnSubmit: 1 });
    expect(submitLookbookEntry(state, contract.id, miss, [])).toMatchObject({ ok: true, stars: 1, firstEntry: true });
    const perfect = suggestLookbookAppearance(miss, contract);
    expect(evaluateLookbookContract(contract, perfect)).toMatchObject({ matched: 3, starsOnSubmit: 3 });
    expect(submitLookbookEntry(state, contract.id, perfect, [])).toMatchObject({ ok: true, stars: 3, improved: true, firstPerfect: true });
    expect(submitLookbookEntry(state, contract.id, miss, [])).toMatchObject({ ok: true, stars: 1, improved: false });
    expect(state.entries[contract.id]?.bestStars).toBe(3);
  });

  it('잠긴 의뢰는 요구 배지 전에는 제출할 수 없고 배지 획득 뒤 열린다', () => {
    const state = freshLookbookState();
    const contract = LOOKBOOK_CONTRACTS.find((item) => item.id === 'pet_picnic')!;
    expect(submitLookbookEntry(state, contract.id, DEFAULT_APPEARANCE, [])).toEqual({ ok: false, reason: 'locked-contract' });
    expect(submitLookbookEntry(state, contract.id, suggestLookbookAppearance(DEFAULT_APPEARANCE, contract), ['badge_intro_pet']))
      .toMatchObject({ ok: true, stars: 3 });
  });

  it('서로 다른 코디·누적 제출·최고 별·완벽 의뢰를 별도 수집 지표로 센다', () => {
    const state = freshLookbookState();
    for (const contract of LOOKBOOK_CONTRACTS.slice(0, 3)) {
      const look = suggestLookbookAppearance(DEFAULT_APPEARANCE, contract);
      submitLookbookEntry(state, contract.id, look, []);
    }
    submitLookbookEntry(state, 'alley_arrival', suggestLookbookAppearance(DEFAULT_APPEARANCE, LOOKBOOK_CONTRACTS[0]!), []);
    expect(lookbookProgress(state)).toMatchObject({ entries: 3, stars: 9, perfect: 3, submissions: 4, uniqueLooks: 3 });
  });

  it('손상된 계약·별·중복 서명을 제거하고 유효 기록만 복구한다', () => {
    const state = normalizeLookbookState({
      entries: {
        alley_arrival: { bestStars: 99, attempts: 2.8, appearance: { ...DEFAULT_APPEARANCE, topStyle: 99 }, savedAt: -1 },
        unknown: { bestStars: 3, attempts: 2, appearance: DEFAULT_APPEARANCE },
      },
      totalSubmissions: 1,
      uniqueLooks: ['safe-look-1', 'safe-look-1', '<bad>'],
    });
    expect(Object.keys(state.entries)).toEqual(['alley_arrival']);
    expect(state.entries.alley_arrival).toMatchObject({ bestStars: 3, attempts: 2, savedAt: 0 });
    expect(state.entries.alley_arrival?.appearance.topStyle).toBe(DEFAULT_APPEARANCE.topStyle);
    expect(state.totalSubmissions).toBe(2);
    expect(state.uniqueLooks).toEqual(['safe-look-1']);
  });

  it('사용자별 룩북을 분리해 다시 열어도 최고 코디를 보존한다', () => {
    const store = new LookbookStore('stylist-a');
    const contract = LOOKBOOK_CONTRACTS[0]!;
    const appearance = suggestLookbookAppearance(DEFAULT_APPEARANCE, contract);
    expect(store.submit(contract.id, appearance, [])).toMatchObject({ ok: true, stars: 3 });
    expect(new LookbookStore('stylist-a').entry(contract.id)).toMatchObject({ bestStars: 3, appearance });
    expect(new LookbookStore('stylist-b').progress()).toMatchObject({ entries: 0, stars: 0, submissions: 0 });
  });
});
