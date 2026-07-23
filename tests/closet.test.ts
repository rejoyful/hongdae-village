import { describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import {
  CLOSET_FEATURED_MAX, CLOSET_SLOT_COUNT, FASHION_PRESETS, applyFashionPreset, fashionPresetViews,
  closetProgress, normalizeClosetState, removeClosetSlot, renameClosetSlot, saveClosetSlot, toggleFeaturedClosetSlot,
} from '../src/game/art/closet';

describe('코디 옷장', () => {
  it('손상된 저장값을 12칸 빈 옷장으로 복구한다', () => {
    const state = normalizeClosetState({ slots: ['bad', null, { appearance: null }] });
    expect(state.version).toBe(2);
    expect(state.slots).toHaveLength(CLOSET_SLOT_COUNT);
    expect(state.slots.every((slot) => slot === null)).toBe(true);
    expect(state.featured).toEqual([]);
  });

  it('기존 6칸 옷장을 앞쪽에 그대로 보존하고 새 여섯 칸을 덧붙인다', () => {
    const legacy = normalizeClosetState({ version: 1, slots: [
      { name: '첫 코디', appearance: DEFAULT_APPEARANCE, savedAt: 10 }, null, null, null, null, null,
    ] });
    expect(legacy.slots).toHaveLength(12);
    expect(legacy.slots[0]?.name).toBe('첫 코디');
    expect(legacy.slots.slice(6).every((slot) => slot === null)).toBe(true);
  });

  it('코디를 정규화해 저장하고 다시 비운다', () => {
    const empty = normalizeClosetState(null);
    const saved = saveClosetSlot(empty, 2, { ...DEFAULT_APPEARANCE, topStyle: 7 }, '<달빛>\n코디', 123);
    expect(saved.slots[2]?.name).toBe('달빛코디');
    expect(saved.slots[2]?.appearance.topStyle).toBe(7);
    expect(saved.slots[2]?.savedAt).toBe(123);
    expect(removeClosetSlot(saved, 2).slots[2]).toBeNull();
  });

  it('범위를 벗어난 슬롯은 상태를 바꾸지 않는다', () => {
    const state = normalizeClosetState(null);
    expect(saveClosetSlot(state, 99, DEFAULT_APPEARANCE)).toBe(state);
    expect(removeClosetSlot(state, -1)).toBe(state);
  });

  it('이름 변경과 대표 코디 세 칸 제한을 안전하게 관리한다', () => {
    let state = normalizeClosetState(null);
    for (let index = 0; index < 4; index += 1) state = saveClosetSlot(state, index, DEFAULT_APPEARANCE);
    state = renameClosetSlot(state, 0, '<심야>\n산책');
    expect(state.slots[0]?.name).toBe('심야산책');
    for (let index = 0; index < CLOSET_FEATURED_MAX; index += 1) {
      const next = toggleFeaturedClosetSlot(state, index);
      expect(next.result).toBe('added'); state = next.state;
    }
    expect(toggleFeaturedClosetSlot(state, 3).result).toBe('full');
    const removed = toggleFeaturedClosetSlot(state, 1);
    expect(removed.result).toBe('removed');
    expect(removed.state.featured).toEqual([0, 2]);
    expect(removeClosetSlot(removed.state, 0).featured).toEqual([2]);
  });

  it('저장 코디와 대표 코디의 서로 다른 스타일 정체성을 따로 집계한다', () => {
    let state = normalizeClosetState(null);
    for (const [index, presetId] of ['street_red', 'mono_city', 'dream_sailor'].entries()) {
      const preset = FASHION_PRESETS.find((item) => item.id === presetId)!;
      state = saveClosetSlot(state, index, applyFashionPreset(DEFAULT_APPEARANCE, preset));
      state = toggleFeaturedClosetSlot(state, index).state;
    }
    expect(closetProgress(state)).toEqual({ saved: 3, featured: 3, identities: 3, featuredIdentities: 3 });
  });

  it('테마 코디는 얼굴을 유지하고 의상만 바꾼다', () => {
    const current = { ...DEFAULT_APPEARANCE, skin: 4, hair: 3, hairColor: 7, eyeStyle: 5, faceDetail: 4 };
    const next = applyFashionPreset(current, FASHION_PRESETS[0]!);
    expect(next.skin).toBe(4);
    expect(next.hair).toBe(3);
    expect(next.hairColor).toBe(7);
    expect(next.eyeStyle).toBe(5);
    expect(next.faceDetail).toBe(4);
    expect(next.topStyle).toBe(FASHION_PRESETS[0]!.style.topStyle);
  });

  it('배지 조건이 있는 프리셋만 잠그고 해당 배지로 연다', () => {
    const locked = fashionPresetViews([]);
    expect(locked.find((preset) => preset.id === 'hanbok_night')?.unlocked).toBe(false);
    const open = fashionPresetViews(['badge_master_level_10']);
    expect(open.find((preset) => preset.id === 'hanbok_night')?.unlocked).toBe(true);
    expect(open.filter((preset) => !preset.requiredBadgeId).every((preset) => preset.unlocked)).toBe(true);
  });

  it('마을 레벨 명찰 여섯 개가 각각 전용 코디 한 벌을 연다', () => {
    const levelPresets = FASHION_PRESETS.filter((preset) => preset.id.startsWith('village_') || [
      'life_collector', 'taste_archivist', 'alley_artisan',
    ].includes(preset.id));
    expect(levelPresets).toHaveLength(6);
    const open = fashionPresetViews(['badge_master_village_level_20']);
    expect(open.find((preset) => preset.id === 'village_regular')?.unlocked).toBe(true);
    expect(open.find((preset) => preset.id === 'village_walker')?.unlocked).toBe(false);
  });

  it('연속 의뢰 완결 배지는 이야기 전용 코디만 정확히 연다', () => {
    const open = fashionPresetViews(['badge_story_request_reward_last_encore']);
    expect(open.find((preset) => preset.id === 'midnight_encore')?.unlocked).toBe(true);
    expect(open.find((preset) => preset.id === 'yellow_umbrella_guide')?.unlocked).toBe(false);
  });
});
