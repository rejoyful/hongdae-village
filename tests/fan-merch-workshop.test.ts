import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAN_MERCH_FEATURED_MAX, FAN_MERCH_FORMATS, FAN_MERCH_MOTIFS, FAN_MERCH_SLOT_COUNT,
  FanMerchWorkshopStore, freshFanMerchWorkshopState, normalizeFanMerchWorkshopState,
  type FanMerchDraft, type FanMerchFormatId, type FanMerchMotifId, type FanMerchStorage,
} from '../src/game/progression/fanMerchWorkshop';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import { RESIDENTS } from '../src/game/residents/residents';

class MemStorage implements FanMerchStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const selfDraft = (
  format: FanMerchFormatId = FAN_MERCH_FORMATS[0].id,
  motif: FanMerchMotifId = FAN_MERCH_MOTIFS[0].id,
): FanMerchDraft => ({
  subject: { kind: 'self', id: 'self', name: '나의 캐릭터', appearance: DEFAULT_APPEARANCE },
  formatId: format,
  motifId: motif,
});

describe('골목 최애 굿즈 공방', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
    vi.spyOn(Date, 'now').mockReturnValue(7_777);
  });

  it('여섯 소장 형태와 여섯 골목 분위기, 열두 소장칸을 제공한다', () => {
    expect(FAN_MERCH_FORMATS).toHaveLength(6);
    expect(FAN_MERCH_MOTIFS).toHaveLength(6);
    expect(new Set(FAN_MERCH_FORMATS.map((item) => item.id)).size).toBe(6);
    expect(new Set(FAN_MERCH_MOTIFS.map((item) => item.id)).size).toBe(6);
    expect(freshFanMerchWorkshopState().slots).toHaveLength(FAN_MERCH_SLOT_COUNT);
  });

  it('빈 칸에 현재 모습을 독립 스냅샷으로 저장하고 같은 디자인은 영구 도감에서 중복 집계하지 않는다', () => {
    const store = new FanMerchWorkshopStore('snapshot', storage);
    const draft = selfDraft();
    expect(store.save(0, draft)).toBe('saved');
    draft.subject.name = '바뀐 이름';
    expect(store.get().slots[0]?.subject.name).toBe('나의 캐릭터');
    expect(store.save(1, selfDraft())).toBe('saved');
    expect(store.progress()).toMatchObject({
      savedSlots: 2, totalCreated: 2, discoveries: 1, subjects: 1, formats: 1, motifs: 1,
    });
  });

  it('기존 칸을 교체해도 과거 디자인 발견은 남고 대표 진열은 새 굿즈로 이어진다', () => {
    const store = new FanMerchWorkshopStore('replace', storage);
    store.save(0, selfDraft('acrylic', 'neon'));
    const oldId = store.get().slots[0]!.id;
    expect(store.feature(oldId)).toBe('featured');
    expect(store.save(0, selfDraft('poster', 'garden'))).toBe('replaced');
    const state = store.get();
    expect(state.featuredIds).toEqual([state.slots[0]!.id]);
    expect(state.featuredIds).not.toContain(oldId);
    expect(store.progress()).toMatchObject({ savedSlots: 1, totalCreated: 2, discoveries: 2, featured: 1 });
  });

  it('대표 굿즈는 세 점까지 자유롭게 올리고 내릴 수 있다', () => {
    const store = new FanMerchWorkshopStore('featured', storage);
    for (let slot = 0; slot < 4; slot += 1) {
      store.save(slot, selfDraft(FAN_MERCH_FORMATS[slot]!.id, FAN_MERCH_MOTIFS[slot]!.id));
    }
    const ids = store.get().slots.slice(0, 4).map((record) => record!.id);
    for (const id of ids.slice(0, FAN_MERCH_FEATURED_MAX)) expect(store.feature(id)).toBe('featured');
    expect(store.feature(ids[3]!)).toBe('full');
    expect(store.feature(ids[0]!)).toBe('cleared');
    expect(store.feature(ids[3]!)).toBe('featured');
    expect(store.progress().featured).toBe(FAN_MERCH_FEATURED_MAX);
  });

  it('캐릭터·동행·주민과 형태·분위기 발견을 서로 독립적으로 집계한다', () => {
    const store = new FanMerchWorkshopStore('domains', storage);
    store.save(0, selfDraft('acrylic', 'neon'));
    store.save(1, {
      subject: { kind: 'pet', id: 'dog', name: '몽실', speciesId: 'dog', accessory: 'ribbon' },
      formatId: 'photocard', motifId: 'cozy',
    });
    const resident = RESIDENTS[0]!;
    store.save(2, {
      subject: { kind: 'resident', id: resident.id, name: resident.name, appearance: resident.appearance },
      formatId: 'button', motifId: 'festival',
    });
    expect(store.progress()).toMatchObject({
      discoveries: 3, subjects: 3, subjectKinds: 3, formats: 3, motifs: 3,
    });
  });

  it('손상된 슬롯·중복 ID·알 수 없는 대상과 대표 기록을 안전하게 정리한다', () => {
    const valid = {
      id: 'valid', subject: { kind: 'self', id: 'self', name: '<나>', appearance: DEFAULT_APPEARANCE },
      formatId: 'acrylic', motifId: 'neon', createdAt: 3.7,
    };
    const normalized = normalizeFanMerchWorkshopState({
      slots: [
        valid,
        valid,
        { ...valid, id: 'unknown-pet', subject: { kind: 'pet', id: 'dragon', speciesId: 'dragon' } },
        { ...valid, id: 'unknown-format', formatId: 'figure' },
      ],
      featuredIds: ['valid', 'missing', 'valid'],
      discoveries: ['self:self:acrylic:neon', 'self:self:acrylic:neon', 'bad:key'],
      totalCreated: -8,
    });
    expect(normalized.slots).toHaveLength(FAN_MERCH_SLOT_COUNT);
    expect(normalized.slots.filter(Boolean)).toHaveLength(1);
    expect(normalized.slots[0]?.subject.name).toBe('나');
    expect(normalized.featuredIds).toEqual(['valid']);
    expect(normalized.discoveries).toEqual(['self:self:acrylic:neon']);
    expect(normalized.totalCreated).toBe(1);
  });

  it('제작·도감·대표 기록을 재접속 뒤에도 그대로 복구한다', () => {
    const first = new FanMerchWorkshopStore('persist', storage);
    first.save(3, selfDraft('ticket', 'rain'));
    first.feature(first.get().slots[3]!.id);
    const restored = new FanMerchWorkshopStore('persist', storage);
    expect(restored.get()).toEqual(first.get());
    expect(restored.progress()).toEqual(first.progress());
    expect(restored.save(-1, selfDraft())).toBe('invalid-slot');
  });
});
