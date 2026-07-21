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
