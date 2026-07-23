import { beforeEach, describe, expect, it } from 'vitest';
import {
  RESIDENT_LETTERS,
  RESIDENT_REPLY_TONES,
  ResidentLetterStore,
  normalizeResidentLetterState,
  residentLetterProgress,
  residentLetterViews,
} from '../src/game/residents/residentLetters';
import type { TrustState } from '../src/game/residents/residents';

const trust = (residentId: string, value: number): TrustState => ({ [residentId]: { v: value, day: '2026-07-23' } });

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  clear(): void { this.values.clear(); }
}

describe('resident letters', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('defines three letters for each of ten residents and three equal reply tones', () => {
    expect(RESIDENT_LETTERS).toHaveLength(30);
    expect(RESIDENT_REPLY_TONES.map((tone) => tone.id)).toEqual(['warm', 'playful', 'thoughtful']);
    const counts = new Map<string, number>();
    for (const item of RESIDENT_LETTERS) counts.set(item.residentId, (counts.get(item.residentId) ?? 0) + 1);
    expect([...counts.values()]).toEqual(Array(10).fill(3));
    expect(new Set(RESIDENT_LETTERS.map((item) => item.id)).size).toBe(30);
  });

  it('normalizes unknown letters, tones, and invalid featured ids', () => {
    expect(normalizeResidentLetterState({
      replies: { haneul_letter_1: 'warm', missing: 'playful', haneul_letter_2: 'wrong' },
      featuredId: 'missing',
    })).toEqual({ version: 1, replies: { haneul_letter_1: 'warm' }, featuredId: null });
    expect(normalizeResidentLetterState({ replies: [], featuredId: 7 })).toEqual({ version: 1, replies: {}, featuredId: null });
  });

  it('uses trust thresholds and reply order without deadlines or consumable gifts', () => {
    const empty = normalizeResidentLetterState(null);
    expect(residentLetterViews('haneul', empty, trust('haneul', 14))[0]?.ready).toBe(false);
    expect(residentLetterViews('haneul', empty, trust('haneul', 15))[0]?.ready).toBe(true);
    const second = residentLetterViews('haneul', empty, trust('haneul', 100))[1]!;
    expect(second.trustMet).toBe(true);
    expect(second.previousMet).toBe(false);
    expect(second.ready).toBe(false);
  });

  it('replies in sequence and allows a stress-free tone rewrite', () => {
    const store = new ResidentLetterStore('tester');
    const maxTrust = trust('haneul', 100);
    const first = store.reply('haneul_letter_1', 'warm', maxTrust);
    expect(first).toMatchObject({ ok: true, firstReply: true, changed: true });
    const rewrite = store.reply('haneul_letter_1', 'thoughtful', maxTrust);
    expect(rewrite).toMatchObject({ ok: true, firstReply: false, changed: true });
    expect(store.reply('haneul_letter_2', 'playful', maxTrust)).toMatchObject({ ok: true, firstReply: true });
    expect(new ResidentLetterStore('tester').get().replies).toMatchObject({
      haneul_letter_1: 'thoughtful', haneul_letter_2: 'playful',
    });
  });

  it('features only replied letters and can remove the representative star', () => {
    const store = new ResidentLetterStore('tester');
    const maxTrust = trust('haneul', 100);
    store.feature('haneul_letter_1');
    expect(store.get().featuredId).toBeNull();
    store.reply('haneul_letter_1', 'warm', maxTrust);
    store.feature('haneul_letter_1');
    expect(store.get().featuredId).toBe('haneul_letter_1');
    store.feature(null);
    expect(store.get().featuredId).toBeNull();
  });

  it('summarizes correspondents, completed residents, unique tones, and ready mail', () => {
    const replies = Object.fromEntries(RESIDENT_LETTERS
      .filter((item) => ['haneul', 'moturi'].includes(item.residentId))
      .map((item, index) => [item.id, RESIDENT_REPLY_TONES[index % 3]!.id]));
    const state = normalizeResidentLetterState({ replies, featuredId: 'haneul_letter_1' });
    const allTrust = Object.fromEntries(['haneul', 'moturi', 'sallim'].map((id) => [id, { v: 100, day: '2026-07-23' }]));
    expect(residentLetterProgress(state, allTrust)).toMatchObject({
      replied: 6, total: 30, correspondents: 2, completedResidents: 2, tonesUsed: 3, featured: 1, ready: 1,
    });
  });

  it('rejects unknown or unavailable replies without mutating saved state', () => {
    const store = new ResidentLetterStore('tester');
    expect(store.reply('missing', 'warm', trust('haneul', 100))).toEqual({ ok: false, reason: 'unknown-letter' });
    expect(store.reply('haneul_letter_2', 'warm', trust('haneul', 100))).toEqual({ ok: false, reason: 'not-available' });
    expect(store.get().replies).toEqual({});
  });
});
