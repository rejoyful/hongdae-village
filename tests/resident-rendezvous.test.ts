import { beforeEach, describe, expect, it } from 'vitest';
import type { QuestState } from '../src/game/questProgress';
import {
  RESIDENT_RENDEZVOUS,
  ResidentRendezvousStore,
  normalizeResidentRendezvousState,
  residentRendezvousProgress,
  residentRendezvousViews,
} from '../src/game/residents/residentRendezvous';
import type { TrustState } from '../src/game/residents/residents';

const quests = (lifetimeCounts: Record<string, number> = {}): QuestState => ({
  day: '2026-07-23', counts: {}, claimed: [], lifetimeCounts,
});

const trust = (residentId: string, value: number): TrustState => ({ [residentId]: { v: value, day: '2026-07-23' } });

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  clear(): void { this.values.clear(); }
}

describe('resident rendezvous', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('defines three sequential scenes for each of ten residents', () => {
    expect(RESIDENT_RENDEZVOUS).toHaveLength(30);
    const counts = new Map<string, number>();
    for (const scene of RESIDENT_RENDEZVOUS) counts.set(scene.residentId, (counts.get(scene.residentId) ?? 0) + 1);
    expect([...counts.values()]).toEqual(Array(10).fill(3));
    expect(new Set(RESIDENT_RENDEZVOUS.map((scene) => scene.id)).size).toBe(30);
  });

  it('normalizes unknown and duplicated stored scene ids', () => {
    expect(normalizeResidentRendezvousState({
      recordedIds: ['haneul_1', 'haneul_1', 'missing'], trackedResidentId: 'haneul',
    })).toEqual({ version: 1, recordedIds: ['haneul_1'], trackedResidentId: 'haneul' });
    expect(normalizeResidentRendezvousState({ recordedIds: 3, trackedResidentId: 'missing' })).toEqual({ version: 1, recordedIds: [], trackedResidentId: null });
  });

  it('requires trust, lifetime activity, and the previous scene', () => {
    const state = normalizeResidentRendezvousState(null);
    expect(residentRendezvousViews('haneul', state, trust('haneul', 15), quests({ q_busking: 9 }))[0]?.ready).toBe(false);
    expect(residentRendezvousViews('haneul', state, trust('haneul', 30), quests({ q_busking: 1 }))[0]?.ready).toBe(true);
    const second = residentRendezvousViews('haneul', state, trust('haneul', 80), quests({ q_busking: 9, photo_taken: 9, lookbook_entries: 9 }))[1]!;
    expect(second.requirementsMet).toBe(true);
    expect(second.previousMet).toBe(false);
    expect(second.ready).toBe(false);
  });

  it('records ready scenes once and persists them per user', () => {
    const store = new ResidentRendezvousStore('tester');
    const state = trust('haneul', 80);
    const journal = quests({ q_busking: 8, photo_taken: 2, lookbook_entries: 3 });
    expect(store.record('haneul_1', state, journal)).toBe('recorded');
    expect(store.record('haneul_1', state, journal)).toBe('not-ready');
    expect(store.record('haneul_2', state, journal)).toBe('recorded');
    expect(new ResidentRendezvousStore('tester').get().recordedIds).toEqual(['haneul_1', 'haneul_2']);
  });

  it('summarizes ready, started, completed, and keepsake progress', () => {
    const recordedIds = RESIDENT_RENDEZVOUS.filter((scene) => ['haneul', 'moturi'].includes(scene.residentId)).map((scene) => scene.id);
    const state = normalizeResidentRendezvousState({ recordedIds });
    const allTrust = Object.fromEntries(['haneul', 'moturi', 'sallim'].map((id) => [id, { v: 100, day: '2026-07-23' }]));
    const progress = residentRendezvousProgress(state, allTrust, quests({ q_place: 3 }));
    expect(progress).toMatchObject({ recorded: 6, total: 30, keepsakes: 6, startedResidents: 2, completedResidents: 2, ready: 1 });
  });
});
