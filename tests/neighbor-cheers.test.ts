import { beforeEach, describe, expect, it } from 'vitest';
import {
  NEIGHBOR_CHEERS, NEIGHBOR_CHEER_INBOX_MAX, NeighborCheerStore, normalizeNeighborCheerState,
} from '../src/game/social/neighborCheers';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('이웃 응원 우편', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('자유문구 없이 여덟 생활 취향 응원만 제공한다', () => {
    expect(NEIGHBOR_CHEERS).toHaveLength(8);
    expect(new Set(NEIGHBOR_CHEERS.map((cheer) => cheer.id)).size).toBe(8);
    expect(NEIGHBOR_CHEERS.every((cheer) => cheer.name && cheer.message && cheer.mark)).toBe(true);
  });

  it('같은 이웃에게는 서울 날짜 기준 하루 한 장만 보낸다', () => {
    const store = new NeighborCheerStore('me');
    const morning = new Date('2026-07-23T01:00:00Z');
    expect(store.canSendTo('neighbor-a', morning)).toBe(true);
    expect(store.recordSent('neighbor-a', 'style', morning)).toBe('sent');
    expect(store.recordSent('neighbor-a', 'home', new Date('2026-07-23T12:00:00Z'))).toBe('today');
    expect(store.canSendTo('neighbor-a', new Date('2026-07-24T01:00:00Z'))).toBe(true);
    expect(store.recordSent('neighbor-a', 'home', new Date('2026-07-24T01:00:00Z'))).toBe('sent');
    expect(store.progress(new Date('2026-07-24T01:00:00Z'))).toMatchObject({ sent: 2, kinds: 2, neighbors: 1, todaySent: 1 });
  });

  it('받은 우편도 같은 발신자의 같은 날 중복을 막고 안전한 이름만 저장한다', () => {
    const store = new NeighborCheerStore('me');
    const now = new Date('2026-07-23T03:00:00Z');
    expect(store.receive('neighbor-a', '<별>\n  이웃', 'garden', now)).toBe('received');
    expect(store.receive('neighbor-a', '다른 이름', 'water', now)).toBe('duplicate');
    expect(store.records()[0]).toMatchObject({ fromUserId: 'neighbor-a', fromNickname: '별 이웃', kind: 'garden' });
    expect(store.progress(now)).toMatchObject({ received: 1, kinds: 1, neighbors: 1, inboxCards: 1 });
  });

  it('자기 자신과 잘못된 대상은 송수신하지 않는다', () => {
    const store = new NeighborCheerStore('me');
    expect(store.recordSent('me', 'style')).toBe('self');
    expect(store.receive('me', '나', 'style')).toBe('self');
    expect(store.recordSent('<script>', 'style')).toBe('invalid');
    expect(store.receive('bad id', '이웃', 'style')).toBe('invalid');
  });

  it('우편함은 최근 36장만 보이고 평생 수신 횟수는 계속 보존한다', () => {
    const store = new NeighborCheerStore('me');
    for (let index = 0; index < 45; index += 1) {
      store.receive(`neighbor-${index}`, `이웃${index}`, NEIGHBOR_CHEERS[index % 8]!.id, new Date(Date.UTC(2026, 6, 1 + index, 1)));
    }
    expect(store.records()).toHaveLength(NEIGHBOR_CHEER_INBOX_MAX);
    expect(store.progress()).toMatchObject({ received: 45, kinds: 8, neighbors: 45, inboxCards: 36 });
  });

  it('손상된 저장본의 알 수 없는 카드·대상·음수 집계를 제거한다', () => {
    const state = normalizeNeighborCheerState({
      records: [
        { id: 'ok', fromUserId: 'neighbor-a', fromNickname: '<별>', kind: 'style', receivedAt: 10, day: 'bad' },
        { id: 'bad', fromUserId: 'bad id', fromNickname: 'x', kind: 'fake', receivedAt: -1 },
      ], sentDays: { 'neighbor-a': '2026-07-23', 'bad id': '2026-07-23', other: 'bad' },
      sentTotal: -1, receivedTotal: 3.8, kindIds: ['style', 'fake', 'style'], neighborIds: ['neighbor-a', 'bad id', 'neighbor-a'],
    });
    expect(state.records).toHaveLength(1);
    expect(state.records[0]?.fromNickname).toBe('별');
    expect(state.sentDays).toEqual({ 'neighbor-a': '2026-07-23' });
    expect(state).toMatchObject({ sentTotal: 0, receivedTotal: 3, kindIds: ['style'], neighborIds: ['neighbor-a'] });
  });
});
