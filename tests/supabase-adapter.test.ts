import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseAdapter } from '../src/net/SupabaseAdapter';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';

type EventCallback = (event: { payload: Record<string, unknown> }) => void;

function fakeRealtime() {
  const channelNames: string[] = [];
  const handlers = new Map<string, EventCallback>();
  const tracked: Record<string, unknown>[] = [];
  const sent: Array<{ type: string; event: string; payload: Record<string, unknown> }> = [];
  const channel = {
    state: 'joined',
    on(type: string, filter: { event: string }, callback: EventCallback) {
      if (type === 'broadcast') handlers.set(filter.event, callback);
      return channel;
    },
    subscribe(callback: (status: string) => void) { callback('SUBSCRIBED'); return channel; },
    track(value: Record<string, unknown>) { tracked.push(value); return Promise.resolve('ok'); },
    unsubscribe() { return Promise.resolve('ok'); },
    presenceState() { return {}; },
    send(value: { type: string; event: string; payload: Record<string, unknown> }) { sent.push(value); return Promise.resolve('ok'); },
  };
  const client = {
    channel(name: string) { channelNames.push(name); return channel; },
  } as unknown as SupabaseClient;
  return { client, channelNames, handlers, tracked, sent };
}

const SELF = {
  userId: 'me', nickname: '나', color: 'e8c9a0', appearance: DEFAULT_APPEARANCE,
};

describe('SupabaseAdapter 월드·payload 계약', () => {
  it('기존 호출은 street, 아이소메트릭은 별도 presence 채널을 사용한다', async () => {
    const fake = fakeRealtime();
    const adapter = new SupabaseAdapter(fake.client);
    await adapter.connect(SELF);
    await adapter.connect(SELF, 'iso-village');
    expect(fake.channelNames).toEqual(['street', 'iso-village']);
    await adapter.disconnect();
  });

  it('수신 채팅은 80자로 정제하고 비정상 좌표·이모트는 버린다', async () => {
    const fake = fakeRealtime();
    const adapter = new SupabaseAdapter(fake.client);
    const chats: string[] = [];
    const positions: number[] = [];
    const emotes: string[] = [];
    adapter.onChat((_id, message) => chats.push(message.t));
    adapter.onPos((_id, message) => positions.push(message.x));
    adapter.onEmote((_id, message) => emotes.push(message.k));
    await adapter.connect(SELF, 'iso-village');

    fake.handlers.get('c')?.({ payload: { u: 'neighbor', t: `  ${'가'.repeat(100)}  ` } });
    fake.handlers.get('c')?.({ payload: { u: 'neighbor', t: 42 } });
    fake.handlers.get('p')?.({ payload: { u: 'neighbor', x: Number.NaN, y: 10, f: 0 } });
    fake.handlers.get('p')?.({ payload: { u: 'neighbor', x: 20, y: 10, f: 1 } });
    fake.handlers.get('e')?.({ payload: { u: 'neighbor', k: 'admin' } });
    fake.handlers.get('e')?.({ payload: { u: 'neighbor', k: 'wave' } });

    expect(chats).toEqual(['가'.repeat(80)]);
    expect(positions).toEqual([20]);
    expect(emotes).toEqual(['wave']);
    await adapter.disconnect();
  });

  it('선택형 마을 명함만 공개 presence에 포함한다', async () => {
    const fake = fakeRealtime();
    const adapter = new SupabaseAdapter(fake.client);
    await adapter.connect({
      ...SELF,
      profile: { mottoId: 'collector', frameId: 'neon', showcasedBadges: ['수집가'], villageLevel: 18, tasteSets: 5, rendezvous: 9, signatureLooks: [], characterCards: [], specialtyIds: [], synergyId: null, photoCards: [], homeCards: [], petStyleCards: [] },
    });
    expect(fake.tracked.at(-1)?.profile).toEqual({ mottoId: 'collector', frameId: 'neon', showcasedBadges: ['수집가'], villageLevel: 18, tasteSets: 5, rendezvous: 9, signatureLooks: [], characterCards: [], specialtyIds: [], synergyId: null, photoCards: [], homeCards: [], petStyleCards: [] });
    await adapter.disconnect();
  });

  it('응원 우편은 지정된 나에게 온 프리셋만 받고 유효한 대상에게만 보낸다', async () => {
    const fake = fakeRealtime();
    const adapter = new SupabaseAdapter(fake.client);
    const received: Array<[string, string]> = [];
    adapter.onNeighborCheer((id, message) => received.push([id, message.k]));
    await adapter.connect(SELF, 'iso-village');

    fake.handlers.get('n')?.({ payload: { u: 'neighbor-a', to: 'other', k: 'style' } });
    fake.handlers.get('n')?.({ payload: { u: 'neighbor-a', to: 'me', k: 'free-text' } });
    fake.handlers.get('n')?.({ payload: { u: 'bad id', to: 'me', k: 'home' } });
    fake.handlers.get('n')?.({ payload: { u: 'neighbor-a', to: 'me', k: 'home' } });
    expect(received).toEqual([['neighbor-a', 'home']]);

    adapter.sendNeighborCheer({ to: 'neighbor-b', k: 'companion' });
    adapter.sendNeighborCheer({ to: 'bad id', k: 'style' });
    expect(fake.sent.filter((message) => message.event === 'n')).toEqual([{
      type: 'broadcast', event: 'n', payload: { u: 'me', to: 'neighbor-b', k: 'companion' },
    }]);
    await adapter.disconnect();
  });

  it('동행 인사 엽서는 지정된 나에게 온 여섯 장면만 받고 안전한 대상에게만 보낸다', async () => {
    const fake = fakeRealtime();
    const adapter = new SupabaseAdapter(fake.client);
    const received: Array<[string, string]> = [];
    adapter.onPetMeet((id, message) => received.push([id, message.k]));
    await adapter.connect(SELF, 'iso-village');

    fake.handlers.get('m')?.({ payload: { u: 'neighbor-a', to: 'other', k: 'alley_walk' } });
    fake.handlers.get('m')?.({ payload: { u: 'neighbor-a', to: 'me', k: 'free-text' } });
    fake.handlers.get('m')?.({ payload: { u: 'bad id', to: 'me', k: 'cafe_window' } });
    fake.handlers.get('m')?.({ payload: { u: 'neighbor-a', to: 'me', k: 'rain_shelter' } });
    expect(received).toEqual([['neighbor-a', 'rain_shelter']]);

    adapter.sendPetMeet({ to: 'neighbor-b', k: 'little_stage' });
    adapter.sendPetMeet({ to: 'bad id', k: 'forest_star' });
    expect(fake.sent.filter((message) => message.event === 'm')).toEqual([{
      type: 'broadcast', event: 'm', payload: { u: 'me', to: 'neighbor-b', k: 'little_stage' },
    }]);
    await adapter.disconnect();
  });
});
