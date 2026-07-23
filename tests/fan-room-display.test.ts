import { describe, expect, it } from 'vitest';
import {
  FAN_ROOM_LIGHTS, FAN_ROOM_STYLES, FanRoomDisplayStore, featuredFanMerch,
  freshFanRoomDisplayState, normalizeFanRoomDisplayState, type FanRoomStorage,
} from '../src/game/home/fanRoomDisplay';
import { FanMerchWorkshopStore, type FanMerchStorage } from '../src/game/progression/fanMerchWorkshop';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';

class MemStorage implements FanRoomStorage, FanMerchStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('나의 최애 방 전시 코너', () => {
  it('능력치 차이 없는 네 진열 방식과 네 조명, 안전한 기본 전시를 제공한다', () => {
    expect(FAN_ROOM_STYLES).toHaveLength(4);
    expect(FAN_ROOM_LIGHTS).toHaveLength(4);
    expect(new Set(FAN_ROOM_STYLES.map((item) => item.id)).size).toBe(4);
    expect(new Set(FAN_ROOM_LIGHTS.map((item) => item.id)).size).toBe(4);
    expect(freshFanRoomDisplayState()).toMatchObject({
      styleId: 'wood_shelf', lightId: 'warm', visible: true,
      triedStyleIds: ['wood_shelf'], triedLightIds: ['warm'], restyles: 0,
    });
  });

  it('진열과 조명 변경은 영구 발견과 누적 다듬기 횟수를 기록하고 같은 선택은 중복 집계하지 않는다', () => {
    const storage = new MemStorage();
    const store = new FanRoomDisplayStore('styling', storage);
    expect(store.selectStyle('peg_board')).toBe(true);
    expect(store.selectStyle('peg_board')).toBe(false);
    expect(store.selectLight('neon')).toBe(true);
    expect(store.selectLight('neon')).toBe(false);
    expect(store.progress(2)).toEqual({
      featuredGoods: 2, stylesTried: 2, lightsTried: 2, restyles: 2, visible: true,
    });
    expect(new FanRoomDisplayStore('styling', storage).get()).toEqual(store.get());
  });

  it('벽면 표시를 숨겨도 발견 기록은 사라지지 않고 다시 펼칠 수 있다', () => {
    const store = new FanRoomDisplayStore('visible', new MemStorage());
    expect(store.setVisible(false)).toBe(true);
    expect(store.setVisible(false)).toBe(false);
    expect(store.progress(3)).toMatchObject({ featuredGoods: 3, visible: false, restyles: 1 });
    expect(store.setVisible(true)).toBe(true);
    expect(store.progress(3)).toMatchObject({ featuredGoods: 3, visible: true, restyles: 2 });
  });

  it('공방의 대표 ID 순서대로 실제 굿즈 스냅샷 세 점만 안전하게 연결한다', () => {
    const storage = new MemStorage();
    const merch = new FanMerchWorkshopStore('linked', storage);
    for (let slot = 0; slot < 3; slot += 1) {
      merch.save(slot, {
        subject: { kind: 'self', id: 'self', name: `최애 ${slot}`, appearance: DEFAULT_APPEARANCE },
        formatId: ['acrylic', 'poster', 'ticket'][slot] as 'acrylic' | 'poster' | 'ticket',
        motifId: ['neon', 'cozy', 'forest'][slot] as 'neon' | 'cozy' | 'forest',
      });
    }
    const records = merch.get().slots.slice(0, 3).map((record) => record!);
    merch.feature(records[2]!.id);
    merch.feature(records[0]!.id);
    expect(featuredFanMerch(merch.get()).map((record) => record.id)).toEqual([records[2]!.id, records[0]!.id]);
  });

  it('손상된 저장값과 알 수 없는 선택은 허용된 현재 스타일을 포함하도록 정규화한다', () => {
    expect(normalizeFanRoomDisplayState({
      styleId: 'glass_case',
      lightId: 'forest',
      visible: 'yes',
      triedStyleIds: ['peg_board', 'unknown', 'peg_board'],
      triedLightIds: ['neon', 'unknown'],
      restyles: -3,
    })).toEqual({
      version: 1,
      styleId: 'glass_case',
      lightId: 'forest',
      visible: true,
      triedStyleIds: ['peg_board', 'glass_case'],
      triedLightIds: ['neon', 'forest'],
      restyles: 0,
    });
  });
});
