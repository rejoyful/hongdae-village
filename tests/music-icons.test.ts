import { describe, it, expect } from 'vitest';
import { noteFreq, buildScore, LOOP_LEN, BAR, LOOP_BARS } from '../src/game/music';
import { ICON_DEFS } from '../src/ui/pixelIcons';

describe('작곡 스코어', () => {
  it('음이름 → 주파수 변환이 표준과 일치한다', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('G2')).toBeCloseTo(98.0, 1);
    expect(() => noteFreq('H3')).toThrow();
  });

  it('모든 노트가 8마디 루프 안에 있고 시간순으로 정렬돼 있다', () => {
    const score = buildScore();
    expect(score.length).toBeGreaterThan(80); // 베이스16+아르페지오64+햇16+멜로디+차임
    let prev = -1;
    for (const n of score) {
      expect(n.t).toBeGreaterThanOrEqual(0);
      expect(n.t).toBeLessThan(LOOP_LEN);
      expect(n.dur).toBeGreaterThan(0);
      expect(n.vel).toBeGreaterThan(0);
      expect(n.vel).toBeLessThanOrEqual(1);
      if (n.voice !== 'hat') expect(n.f).toBeGreaterThan(40);
      expect(n.t).toBeGreaterThanOrEqual(prev);
      prev = n.t;
    }
  });

  it('마디마다 베이스·아르페지오·햇이 배치된다', () => {
    const score = buildScore();
    for (let b = 0; b < LOOP_BARS; b++) {
      const inBar = score.filter((n) => n.t >= b * BAR && n.t < (b + 1) * BAR);
      expect(inBar.filter((n) => n.voice === 'bass').length).toBe(2);
      expect(inBar.filter((n) => n.voice === 'pluck').length).toBe(8);
      expect(inBar.filter((n) => n.voice === 'hat').length).toBe(2);
    }
  });
});

describe('픽셀 아이콘', () => {
  it('모든 그리드가 12×12이고 팔레트에 있는 문자만 쓴다', () => {
    for (const [name, def] of Object.entries(ICON_DEFS)) {
      expect(def.rows.length, `${name} 행 수`).toBe(12);
      for (const row of def.rows) {
        expect(row.length, `${name} "${row}"`).toBe(12);
        for (const ch of row) {
          if (ch === '.' || ch === ' ') continue;
          expect(def.pal[ch], `${name}의 미정의 문자 '${ch}'`).toBeDefined();
        }
      }
    }
  });

  it('HUD 바에 필요한 아이콘이 모두 있다', () => {
    for (const k of ['bag', 'book', 'map', 'people', 'trophy', 'scroll',
      'shirt', 'chat', 'smile', 'gear', 'coin', 'heart', 'heartEmpty']) {
      expect(ICON_DEFS[k], k).toBeDefined();
    }
  });
});
