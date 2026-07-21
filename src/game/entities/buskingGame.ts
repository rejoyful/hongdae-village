/**
 * 버스킹 미니게임 — 흘러나온 멜로디를 듣고 그대로 따라 연주 (스펙 §3 수익 활동).
 * 순수 로직. 틀리면 입력만 처음부터 (멜로디는 유지 — 좌절 없이).
 */
export const NOTES = ['do', 're', 'mi', 'sol'] as const;
export type Note = typeof NOTES[number];

export const NOTE_LABEL: Record<Note, string> = {
  do: '🎵 도', re: '🎶 레', mi: '🎼 미', sol: '🎸 솔',
};

export const MELODY_LEN = 8;

export interface BuskingSession {
  melody: Note[];
  progress: number; // 따라친 개수
}

export type BuskingEvent = 'progress' | 'wrong' | 'done';

export function newBusking(rnd: () => number = Math.random): BuskingSession {
  const melody: Note[] = [];
  for (let i = 0; i < MELODY_LEN; i++) melody.push(NOTES[Math.floor(rnd() * NOTES.length)]!);
  return { melody, progress: 0 };
}

export function play(s: BuskingSession, note: Note): { session: BuskingSession; event: BuskingEvent } {
  if (s.melody[s.progress] !== note) {
    return { session: { ...s, progress: 0 }, event: 'wrong' };
  }
  const progress = s.progress + 1;
  if (progress >= s.melody.length) return { session: { ...s, progress }, event: 'done' };
  return { session: { ...s, progress }, event: 'progress' };
}
