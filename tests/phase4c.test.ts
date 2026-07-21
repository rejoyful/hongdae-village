import { describe, it, expect } from 'vitest';
import { phaseForHour } from '../src/game/world/timeOfDay';
import { newBusking, play, NOTES, MELODY_LEN } from '../src/game/entities/buskingGame';
import { seeded } from '../src/game/art/pixelCanvas';

describe('timeOfDay', () => {
  it('시간대 5단계가 스펙대로 나뉜다', () => {
    expect(phaseForHour(5).name).toBe('새벽');
    expect(phaseForHour(8).name).toBe('아침');
    expect(phaseForHour(13).name).toBe('낮');
    expect(phaseForHour(13).alpha).toBe(0);
    expect(phaseForHour(18).name).toBe('노을');
    expect(phaseForHour(22).name).toBe('밤');
    expect(phaseForHour(2).name).toBe('밤');
  });
});

describe('buskingGame', () => {
  it('멜로디 8음이 4음계에서 생성된다', () => {
    const s = newBusking(seeded(7));
    expect(s.melody).toHaveLength(MELODY_LEN);
    for (const n of s.melody) expect(NOTES).toContain(n);
  });

  it('정확히 따라치면 done, 틀리면 입력만 리셋(멜로디 유지)', () => {
    let s = newBusking(seeded(8));
    const melody = [...s.melody];
    s = play(s, s.melody[0]!).session;
    const wrong = NOTES.find((n) => n !== s.melody[1])!;
    const r = play(s, wrong);
    expect(r.event).toBe('wrong');
    expect(r.session.progress).toBe(0);
    expect(r.session.melody).toEqual(melody);
    let done = false;
    for (const n of melody) {
      const step = play(r.session.progress === 0 && !done ? r.session : s, n);
      s = step.session;
      r.session = s;
      if (step.event === 'done') done = true;
    }
    expect(done).toBe(true);
  });
});

// --- Phase 6a ---
import { newOmok, place, aiMove, checkWin, OMOK_N } from '../src/game/entities/omok';
import { DAILY_QUESTS } from '../src/game/quests';

describe('omok', () => {
  it('가로 5목을 승리로 판정한다', () => {
    let s = newOmok();
    // 흑: (0..4, 0) / 백: (0..3, 5) 교차로 두기
    for (let i = 0; i < 4; i++) {
      s = place(s, i, 0)!;      // 흑
      s = place(s, i, 5)!;      // 백
    }
    s = place(s, 4, 0)!;        // 흑 5번째
    expect(s.winner).toBe(1);
  });

  it('AI는 상대 4목을 막는다', () => {
    let s = newOmok();
    // 흑 4연속 (open four) 상황을 만들고 AI 착수 확인
    s = place(s, 3, 6)!; s = place(s, 0, 0)!;
    s = place(s, 4, 6)!; s = place(s, 0, 1)!;
    s = place(s, 5, 6)!; s = place(s, 0, 2)!;
    s = place(s, 6, 6)!; // 흑 4연속 (3~6, 6) — 백 차례
    const mv = aiMove(s, () => 0);
    expect(mv).not.toBeNull();
    const blocks = (mv!.x === 2 && mv!.y === 6) || (mv!.x === 7 && mv!.y === 6);
    expect(blocks).toBe(true);
  });

  it('같은 자리에 둘 수 없다', () => {
    let s = newOmok();
    s = place(s, 6, 6)!;
    expect(place(s, 6, 6)).toBeNull();
  });

  it('checkWin은 대각선도 잡는다', () => {
    const b = newOmok().board;
    for (let i = 0; i < 5; i++) b[(i + 2) * OMOK_N + (i + 2)] = 1;
    expect(checkWin(b, 4, 4)).toBe(true);
  });
});

describe('quests', () => {
  it('퀘스트 5종의 id는 earn_activity 규약(quest_)을 따른다', () => {
    expect(DAILY_QUESTS).toHaveLength(5);
    for (const q of DAILY_QUESTS) {
      expect(q.id.startsWith('quest_')).toBe(true);
      expect(q.goal).toBeGreaterThan(0);
      expect(q.reward).toBe(40);
    }
  });
});
