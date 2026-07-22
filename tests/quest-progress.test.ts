import { describe, it, expect } from 'vitest';
import {
  normalizeState, bumpQuest, markClaimed, doneCount, type QuestState,
} from '../src/game/questProgress';
import { DAILY_QUESTS } from '../src/game/quests';

const TODAY = '2026-07-22';

describe('questProgress 지속·리셋', () => {
  it('저장 날짜가 오늘과 다르면 새 하루로 리셋', () => {
    const stale: QuestState = { day: '2026-07-21', counts: { q_emote: 3 }, claimed: ['quest_emote'] };
    const s = normalizeState(stale, TODAY);
    expect(s.day).toBe(TODAY);
    expect(s.counts.q_emote).toBe(0);
    expect(s.claimed).toEqual([]);
  });

  it('같은 날이면 진행·수령을 보존한다', () => {
    const cur: QuestState = { day: TODAY, counts: { q_emote: 2 }, claimed: ['quest_cafe'] };
    const s = normalizeState(cur, TODAY);
    expect(s.counts.q_emote).toBe(2);
    expect(s.claimed).toEqual(['quest_cafe']);
  });

  it('손상된 저장값도 안전하게 정규화', () => {
    expect(normalizeState(null, TODAY).day).toBe(TODAY);
    expect(normalizeState('rubbish', TODAY).counts).toEqual(
      Object.fromEntries(DAILY_QUESTS.map((q) => [q.registryKey, 0])));
    const bad = normalizeState({ day: TODAY, counts: { q_emote: -5, q_cafe: 1.9 }, claimed: [1, 'quest_cafe'] }, TODAY);
    expect(bad.counts.q_emote).toBe(0);   // 음수 → 0
    expect(bad.counts.q_cafe).toBe(1);    // 소수 → 내림
    expect(bad.claimed).toEqual(['quest_cafe']); // 문자열만
  });

  it('bump은 목표에서 멈춘다 (하트 표시용)', () => {
    let s = normalizeState(null, TODAY);
    const emote = DAILY_QUESTS.find((q) => q.registryKey === 'q_emote')!;
    for (let i = 0; i < emote.goal + 5; i++) s = bumpQuest(s, 'q_emote');
    expect(s.counts.q_emote).toBe(emote.goal);
  });

  it('doneCount는 목표 도달 퀘스트만 센다', () => {
    let s = normalizeState(null, TODAY);
    expect(doneCount(s)).toBe(0);
    const emote = DAILY_QUESTS.find((q) => q.registryKey === 'q_emote')!;
    for (let i = 0; i < emote.goal; i++) s = bumpQuest(s, 'q_emote');
    expect(doneCount(s)).toBe(1);
  });

  it('markClaimed는 중복을 만들지 않는다', () => {
    let s = normalizeState(null, TODAY);
    s = markClaimed(s, 'quest_cafe');
    s = markClaimed(s, 'quest_cafe');
    expect(s.claimed).toEqual(['quest_cafe']);
  });
});
