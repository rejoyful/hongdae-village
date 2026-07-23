import { describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import { FASHION_PRESETS, applyFashionPreset } from '../src/game/art/closet';
import { STYLE_IDENTITIES, styleIdentityFor, stylePaletteFor } from '../src/game/art/styleIdentity';
import { ALL_QUESTS } from '../src/game/quests';

describe('픽셀 코디 스타일 정체성', () => {
  it('여덟 가지 정체성이 겹치지 않는 이름·표식·색을 가진다', () => {
    expect(STYLE_IDENTITIES).toHaveLength(8);
    expect(new Set(STYLE_IDENTITIES.map((identity) => identity.id)).size).toBe(8);
    expect(new Set(STYLE_IDENTITIES.map((identity) => identity.name)).size).toBe(8);
    expect(new Set(STYLE_IDENTITIES.map((identity) => identity.color)).size).toBe(8);
  });

  it('대표 프리셋의 옷 레이어와 색을 이용해 안정적인 정체성을 만든다', () => {
    const street = applyFashionPreset(DEFAULT_APPEARANCE, FASHION_PRESETS.find((item) => item.id === 'street_red')!);
    const classic = applyFashionPreset(DEFAULT_APPEARANCE, FASHION_PRESETS.find((item) => item.id === 'mono_city')!);
    const dreamy = applyFashionPreset(DEFAULT_APPEARANCE, FASHION_PRESETS.find((item) => item.id === 'dream_sailor')!);
    expect(styleIdentityFor(street).id).toBe('street');
    expect(styleIdentityFor(classic).id).toBe('classic');
    expect(styleIdentityFor(dreamy).id).toBe('dreamy');
  });

  it('상의·하의·포인트 세 색을 슬롯 팔레트로 반환한다', () => {
    const palette = stylePaletteFor({ ...DEFAULT_APPEARANCE, shirt: 'e86a6a', pants: 1, accent: '58b8c8' });
    expect(palette).toEqual(['e86a6a', '6e5c4c', '58b8c8']);
  });

  it('6·12칸 보관, 1·3칸 대표 전시, 4·8계열 수집이 실제 영구 배지 목표다', () => {
    expect(ALL_QUESTS.filter((quest) => quest.registryKey === 'closet_saved_slots').map((quest) => quest.goal)).toEqual([6, 12]);
    expect(ALL_QUESTS.filter((quest) => quest.registryKey === 'closet_featured_slots').map((quest) => quest.goal)).toEqual([1, 3]);
    expect(ALL_QUESTS.filter((quest) => quest.registryKey === 'closet_style_identities').map((quest) => quest.goal)).toEqual([4, 8]);
  });
});
