/**
 * 홍대마을 테마 — 제대로 작곡된 로파이 코지 루프 (72 BPM, 8마디).
 * 코드 Cmaj7–Am7–Fmaj7–G7 진행 위에 핑거피킹 아르페지오, 베이스,
 * 펜타토닉 멜로디, 4마디마다 차임, 2·4박 브러시 햇.
 * 순수 데이터(스코어)로 정의해 테스트 가능하게 한다.
 */

export const BPM = 72;
export const BEAT = 60 / BPM;          // 0.833s
export const BAR = BEAT * 4;
export const LOOP_BARS = 8;
export const LOOP_LEN = BAR * LOOP_BARS;

/** 음이름 → 주파수 (A4 = 440) */
export function noteFreq(name: string): number {
  const m = /^([A-G])(#?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`잘못된 음이름: ${name}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semi = base[m[1]!]! + (m[2] === '#' ? 1 : 0);
  const oct = Number(m[3]);
  const midi = (oct + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export type Voice = 'pluck' | 'bass' | 'lead' | 'chime' | 'hat';

export interface ScoreNote {
  t: number;      // 루프 시작 기준 초
  f: number;      // Hz (hat은 0)
  dur: number;    // 초
  voice: Voice;
  vel: number;    // 0..1
}

/** 마디별 코드 (핑거피킹용 4성) + 베이스 루트 */
const PROG: Array<{ bass: string; tones: [string, string, string, string] }> = [
  { bass: 'C2', tones: ['C4', 'E4', 'G4', 'B4'] },   // Cmaj7
  { bass: 'A2', tones: ['A3', 'C4', 'E4', 'G4'] },   // Am7
  { bass: 'F2', tones: ['F3', 'A3', 'C4', 'E4'] },   // Fmaj7
  { bass: 'G2', tones: ['G3', 'B3', 'D4', 'F4'] },   // G7
  { bass: 'C2', tones: ['C4', 'E4', 'G4', 'B4'] },
  { bass: 'A2', tones: ['A3', 'C4', 'E4', 'G4'] },
  { bass: 'F2', tones: ['F3', 'A3', 'C4', 'E4'] },
  { bass: 'G2', tones: ['G3', 'B3', 'D4', 'F4'] },
];

/** 핑거피킹 패턴 — 8분음표 8개가 짚는 코드 성부 인덱스 */
const PICK: number[] = [0, 2, 1, 3, 2, 1, 2, 3];

/** 멜로디 (마디, 박, 음, 길이박) — 앞 4마디 제시, 뒤 4마디 응답 */
const MELODY: Array<[number, number, string, number]> = [
  [0, 0, 'E5', 1], [0, 1, 'G5', 1], [0, 2, 'A5', 2],
  [1, 1, 'A5', 0.5], [1, 1.5, 'G5', 0.5], [1, 2, 'E5', 2],
  [2, 0, 'D5', 1], [2, 1, 'E5', 1], [2, 2, 'G5', 2],
  [3, 0, 'G5', 1], [3, 1, 'E5', 1], [3, 2, 'D5', 2],
  [4, 0, 'C5', 2], [4, 2, 'E5', 1], [4, 3, 'G5', 1],
  [5, 0, 'A5', 1], [5, 1, 'G5', 1], [5, 2, 'E5', 2],
  [6, 0, 'D5', 1], [6, 1, 'C5', 1], [6, 2, 'A4', 2],
  [7, 0, 'D5', 2], [7, 2, 'B4', 1], [7, 3, 'G4', 1],
];

/** 차임 스파클 (마디, 박, 음) */
const CHIME: Array<[number, number, string]> = [
  [3, 3.5, 'E6'], [7, 3.5, 'G6'],
];

/** 전체 스코어를 편평한 노트 목록으로 컴파일 */
export function buildScore(): ScoreNote[] {
  const notes: ScoreNote[] = [];
  PROG.forEach((bar, b) => {
    const t0 = b * BAR;
    // 베이스 — 1·3박, 부드럽게
    notes.push({ t: t0, f: noteFreq(bar.bass), dur: BEAT * 1.8, voice: 'bass', vel: 0.9 });
    notes.push({ t: t0 + BEAT * 2, f: noteFreq(bar.bass), dur: BEAT * 1.6, voice: 'bass', vel: 0.7 });
    // 핑거피킹 아르페지오 — 8분음표
    PICK.forEach((tone, i) => {
      notes.push({
        t: t0 + i * BEAT * 0.5, f: noteFreq(bar.tones[tone]!),
        dur: BEAT * 0.9, voice: 'pluck', vel: i % 2 === 0 ? 0.75 : 0.55,
      });
    });
    // 브러시 햇 — 2·4박 (아주 약하게)
    notes.push({ t: t0 + BEAT, f: 0, dur: 0.05, voice: 'hat', vel: 0.5 });
    notes.push({ t: t0 + BEAT * 3, f: 0, dur: 0.05, voice: 'hat', vel: 0.4 });
  });
  for (const [bar, beat, name, durBeats] of MELODY) {
    notes.push({
      t: bar * BAR + beat * BEAT, f: noteFreq(name),
      dur: durBeats * BEAT * 0.95, voice: 'lead', vel: 0.8,
    });
  }
  for (const [bar, beat, name] of CHIME) {
    notes.push({ t: bar * BAR + beat * BEAT, f: noteFreq(name), dur: BEAT * 2, voice: 'chime', vel: 0.6 });
  }
  return notes.sort((a, b) => a.t - b.t);
}
