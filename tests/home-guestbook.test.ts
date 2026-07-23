import { beforeEach, describe, expect, it } from 'vitest';
import {
  HOME_GUESTBOOK_STICKERS, HomeGuestbookStore, isHomeGuestbookStickerKind,
  normalizeHomeGuestbookState,
} from '../src/game/social/homeGuestbook';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('열린 집 스티커 방명록', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('자유문구 입력 없이 서버와 같은 여덟 스티커만 제공한다', () => {
    expect(HOME_GUESTBOOK_STICKERS).toHaveLength(8);
    expect(new Set(HOME_GUESTBOOK_STICKERS.map((sticker) => sticker.id)).size).toBe(8);
    expect(HOME_GUESTBOOK_STICKERS.every((sticker) => sticker.name && sticker.message && sticker.mark)).toBe(true);
    expect(isHomeGuestbookStickerKind('welcome')).toBe(true);
    expect(isHomeGuestbookStickerKind('<script>')).toBe(false);
  });

  it('같은 방에는 서울 날짜 기준 하루 한 장만 기록한다', () => {
    const store = new HomeGuestbookStore('me');
    const first = new Date('2026-07-23T01:00:00Z');
    expect(store.recordSent(12, 'neighbor-a', 'cozy', first)).toBe(true);
    expect(store.recordSent(12, 'neighbor-a', 'music', new Date('2026-07-23T12:00:00Z'))).toBe(false);
    expect(store.recordSent(12, 'neighbor-a', 'music', new Date('2026-07-23T16:00:00Z'))).toBe(true);
    expect(store.progress(new Date('2026-07-23T16:00:00Z'))).toMatchObject({ sent: 2, kinds: 2, homes: 1, todaySent: 1 });
  });

  it('다른 방과 이웃의 평생 집들이 기록을 서로 구분한다', () => {
    const store = new HomeGuestbookStore('me');
    const now = new Date('2026-07-23T03:00:00Z');
    expect(store.recordSent(1, 'neighbor-a', 'green', now)).toBe(true);
    expect(store.recordSent(2, 'neighbor-b', 'green', now)).toBe(true);
    expect(store.recordSent(3, 'neighbor-b', 'creator', now)).toBe(true);
    expect(store.progress(now)).toMatchObject({ sent: 3, kinds: 2, homes: 2, todaySent: 3 });
  });

  it('잘못된 방·대상·스티커와 손상된 저장값을 제거한다', () => {
    const store = new HomeGuestbookStore('me');
    expect(store.recordSent(0, 'neighbor-a', 'cozy')).toBe(false);
    expect(store.recordSent(1, 'bad id', 'cozy')).toBe(false);
    expect(store.recordSent(1, 'neighbor-a', 'fake' as 'cozy')).toBe(false);

    expect(normalizeHomeGuestbookState({
      sent: -3.2, kindIds: ['cozy', 'fake', 'cozy'], homeIds: ['neighbor-a', 'bad id', 'neighbor-a'],
      sentDays: { '3': '2026-07-23', '0x': '2026-07-23', '4': 'bad' },
    })).toMatchObject({ sent: 0, kindIds: ['cozy'], homeIds: ['neighbor-a'], sentDays: { '3': '2026-07-23' } });
  });
});
