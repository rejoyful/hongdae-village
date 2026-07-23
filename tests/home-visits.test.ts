import { beforeEach, describe, expect, it } from 'vitest';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import {
  HOME_VISITS,
  HomeVisitStore,
  homeVisitProgress,
  homeVisitViews,
  normalizeHomeVisitState,
  recordHomeVisit,
  type HomeVisitContext,
  type HomeVisitState,
} from '../src/game/home/homeVisits';
import type { Placed } from '../src/game/entities/placement';
import type { TrustState } from '../src/game/residents/residents';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const placed = (ids: string[]): Placed[] => ids.map((itemId, index) => ({
  id: `visit-${index}`, itemId, tx: index + 1, ty: 2, rot: 0,
}));

const musicHome = analyzeHomeDesign(placed([
  'guitar', 'mic_stand', 'turntable', 'speaker_amp',
  'bed_basic', 'sofa_single', 'desk_wood', 'bookshelf', 'lamp_stand', 'rug_cream', 'plant_pot',
]));

const state = (): HomeVisitState => ({ version: 1, records: {} });
const trust = (values: Record<string, number>): TrustState => Object.fromEntries(
  Object.entries(values).map(([id, value]) => [id, { v: value, day: '2026-07-22' }]),
);
const context = (values: Partial<HomeVisitContext> = {}): HomeVisitContext => ({
  home: musicHome,
  trust: trust({ haneul: 30 }),
  activePet: null,
  ...values,
});

describe('우리 집 방문 앨범', () => {
  it('주민 열 명이 모두 고유한 방문 장면과 조건을 가진다', () => {
    expect(HOME_VISITS).toHaveLength(10);
    expect(new Set(HOME_VISITS.map((visit) => visit.residentId)).size).toBe(10);
    for (const visit of HOME_VISITS) {
      expect(visit.title.length).toBeGreaterThan(4);
      expect(visit.memory.length).toBeGreaterThan(20);
      expect(visit.dialogue.length).toBeGreaterThan(20);
      expect(visit.petDialogue.length).toBeGreaterThan(20);
      expect(visit.minTrust).toBeGreaterThanOrEqual(30);
      expect(visit.minHomeScore).toBeGreaterThanOrEqual(30);
    }
  });

  it('신뢰·홈 점수·테마 조건을 모두 만족해야 초대할 수 있다', () => {
    const locked = homeVisitViews(context({ trust: {} }), state()).find((visit) => visit.residentId === 'haneul')!;
    expect(locked.status).toBe('locked');
    expect(locked.checks.find((check) => check.key === 'trust')?.met).toBe(false);

    const ready = homeVisitViews(context(), state()).find((visit) => visit.residentId === 'haneul')!;
    expect(musicHome.themePowers.music).toBeGreaterThanOrEqual(3);
    expect(ready.checks.every((check) => check.met)).toBe(true);
    expect(ready.status).toBe('ready');
  });

  it('일부 방문은 실제 동행 펫의 친밀도를 요구한다', () => {
    const noPet = homeVisitViews(context({ trust: trust({ choco: 30 }) }), state())
      .find((visit) => visit.residentId === 'choco')!;
    expect(noPet.checks.find((check) => check.key === 'pet')).toMatchObject({ current: 0, goal: 25, met: false });

    const withPet = homeVisitViews(context({
      trust: trust({ choco: 30 }), activePet: { id: 'cat', name: '고양이', affinity: 25 },
    }), state()).find((visit) => visit.residentId === 'choco')!;
    expect(withPet.checks.find((check) => check.key === 'pet')?.met).toBe(true);
  });

  it('열린 방문은 한 번만 영구 기록되고 펫 동반 여부도 보존된다', () => {
    const ctx = context({ activePet: { id: 'dog', name: '강아지', affinity: 60 } });
    const first = recordHomeVisit(state(), 'haneul', ctx, '2026-07-22');
    expect(first.recorded).toBe(true);
    expect(first.state.records.haneul).toMatchObject({ homeScore: musicHome.score, petId: 'dog', recordedAt: '2026-07-22' });
    expect(homeVisitProgress(first.state)).toEqual({ recorded: 1, total: 10, withPet: 1 });

    const second = recordHomeVisit(first.state, 'haneul', ctx, '2026-07-23');
    expect(second.recorded).toBe(false);
    expect(second.state.records.haneul?.recordedAt).toBe('2026-07-22');
    expect(homeVisitViews(ctx, second.state).find((visit) => visit.residentId === 'haneul')?.status).toBe('recorded');
  });

  it('잠긴 방문과 손상된 저장 데이터는 기록으로 인정하지 않는다', () => {
    expect(recordHomeVisit(state(), 'haneul', context({ trust: {} }), '2026-07-22').recorded).toBe(false);
    expect(normalizeHomeVisitState({
      records: {
        missing: { recordedAt: '2026-01-01', homeScore: 99, themeId: 'music' },
        haneul: { recordedAt: 99, homeScore: 500, themeId: 'hacked' },
      },
    }).records).toEqual({});
  });
});

describe('HomeVisitStore', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('사용자별 방문 기록을 복원한다', () => {
    const first = new HomeVisitStore('visitor-a');
    expect(first.record('haneul', context())).toBe(true);
    expect(new HomeVisitStore('visitor-a').progress().recorded).toBe(1);
    expect(new HomeVisitStore('visitor-b').progress().recorded).toBe(0);
  });
});
