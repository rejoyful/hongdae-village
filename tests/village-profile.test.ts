import { beforeEach, describe, expect, it } from 'vitest';
import { BADGES } from '../src/game/achievements';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import type { QuestState } from '../src/game/questProgress';
import {
  VILLAGE_PROFILE_FRAMES, VILLAGE_PROFILE_MOTTOS, VillageProfileStore,
  normalizeVillageProfilePublic, normalizeVillageProfileState, villageProfileFrameViews, villageProfileMottoViews,
  villageProfilePublic,
} from '../src/game/progression/villageProfile';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const quests = (lifetimeCounts: Record<string, number> = {}): QuestState => ({ day: '', counts: {}, claimed: [], lifetimeCounts });

describe('마을 프로필 명함', () => {
  beforeEach(() => { (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage(); });

  it('기본 열두 한마디와 진로 완주 여덟 문장, 여섯 생활 프레임을 제공한다', () => {
    expect(VILLAGE_PROFILE_MOTTOS).toHaveLength(20);
    expect(VILLAGE_PROFILE_FRAMES).toHaveLength(6);
    expect(new Set(VILLAGE_PROFILE_MOTTOS.map((item) => item.id)).size).toBe(20);
    expect(new Set(VILLAGE_PROFILE_FRAMES.map((item) => item.id)).size).toBe(6);
  });

  it('진로 문장은 해당 완주 배지를 얻은 뒤에만 프로필에 설정한다', () => {
    const store = new VillageProfileStore('motto-tester');
    const badgeId = 'badge_master_adventure_path_style';
    expect(villageProfileMottoViews([]).find((motto) => motto.id === 'path_style')).toMatchObject({ unlocked: false });
    expect(store.setMotto('path_style')).toBe(false);
    expect(store.setMotto('path_style', [badgeId])).toBe(true);
    expect(new VillageProfileStore('motto-tester').get().mottoId).toBe('path_style');
  });

  it('손상된 로컬 상태를 기본 명함과 유효한 대표 배지로 정규화한다', () => {
    const badge = BADGES[0]!;
    expect(normalizeVillageProfileState({ mottoId: 'bad', frameId: 'bad', showcasedBadgeIds: [badge.id, badge.id, 'bad'], edited: 1 }))
      .toEqual({ version: 1, mottoId: 'hello', frameId: 'kraft', showcasedBadgeIds: [badge.id], edited: false });
  });

  it('생활 기록으로 프레임을 소급 해금한다', () => {
    const views = villageProfileFrameViews(quests({ q_busking: 3, garden_species: 5 }));
    expect(views.find((frame) => frame.id === 'kraft')).toMatchObject({ unlocked: true });
    expect(views.find((frame) => frame.id === 'neon')).toMatchObject({ unlocked: true, progress: 3, goal: 3 });
    expect(views.find((frame) => frame.id === 'garden')).toMatchObject({ unlocked: false, progress: 5, goal: 6 });
  });

  it('해금한 대표 배지를 최대 세 개만 전시하고 상태를 저장한다', () => {
    const store = new VillageProfileStore('tester');
    const unlocked = BADGES.slice(0, 4).map((badge) => badge.id);
    expect(store.toggleBadge(unlocked[0]!, unlocked)).toBe('added');
    expect(store.toggleBadge(unlocked[1]!, unlocked)).toBe('added');
    expect(store.toggleBadge(unlocked[2]!, unlocked)).toBe('added');
    expect(store.toggleBadge(unlocked[3]!, unlocked)).toBe('full');
    expect(store.toggleBadge(unlocked[0]!, unlocked)).toBe('removed');
    expect(new VillageProfileStore('tester').get().showcasedBadgeIds).toEqual(unlocked.slice(1, 3));
  });

  it('공개 스냅샷은 알려진 선택과 제한된 수치·문구만 통과시킨다', () => {
    const badge = BADGES[0]!;
    const state = normalizeVillageProfileState({ mottoId: 'collector', frameId: 'neon', showcasedBadgeIds: [badge.id], edited: true });
    expect(villageProfilePublic(state, 18, 5, 12)).toMatchObject({ mottoId: 'collector', frameId: 'neon', showcasedBadges: [badge.name], villageLevel: 18, tasteSets: 5, rendezvous: 12, signatureLooks: [], characterCards: [], specialtyIds: [], synergyId: null, photoCards: [], homeCards: [], petStyleCards: [] });
    expect(normalizeVillageProfilePublic({ mottoId: 'x', frameId: 'x', showcasedBadges: ['  긴   배지  ', 3], villageLevel: 999, tasteSets: -4, rendezvous: 2.8 }))
      .toEqual({ mottoId: 'hello', frameId: 'kraft', showcasedBadges: ['긴 배지'], villageLevel: 50, tasteSets: 0, rendezvous: 2, signatureLooks: [], characterCards: [], specialtyIds: [], synergyId: null, photoCards: [], homeCards: [], petStyleCards: [] });
  });

  it('대표 전문성 ID와 정제된 포토카드 세 장만 공개하고 촬영 시각·펫 이름은 제외한다', () => {
    const rawCard = {
      caption: '  첫   산책  ', frameId: 'oatmeal', backdropId: 'alley', poseId: 'hello',
      appearance: DEFAULT_APPEARANCE,
      pet: { speciesId: 'dog', accessory: 'ribbon', name: '비공개 이름' },
      foilId: 'rainbow', stickerIds: ['heart', 'heart', 'unknown', 'star'],
      takenAt: '비공개', id: '비공개',
    };
    const profile = normalizeVillageProfilePublic({
      villageLevel: 3, tasteSets: 99,
      specialtyIds: ['style_1', 'style_1', 'missing', 'home_1', 'companion_1', 'angler_1'],
      synergyId: 'forged-client-title',
      photoCards: [rawCard, rawCard, rawCard, rawCard],
    })!;
    expect(profile.tasteSets).toBe(28);
    expect(profile.specialtyIds).toEqual(['style_1', 'home_1', 'companion_1']);
    expect(profile.synergyId).toBe('cozy_curator');
    expect(profile.photoCards).toHaveLength(3);
    expect(profile.photoCards[0]).toMatchObject({
      pet: { speciesId: 'dog', accessory: 'ribbon' },
      foilId: 'rainbow', stickerIds: ['heart', 'star'],
    });
    expect(profile.photoCards[0]).not.toHaveProperty('caption');
    expect(profile.photoCards[0]).not.toHaveProperty('takenAt');
    expect(profile.photoCards[0]?.pet).not.toHaveProperty('name');
  });

  it('대표 코디 세 벌만 안전한 이름·정규 외형·서버 재계산 정체성으로 공개한다', () => {
    const state = normalizeVillageProfileState(null);
    const rawLooks = Array.from({ length: 4 }, (_, index) => ({
      name: index ? `코디 ${index + 1}` : '<달빛>\n산책',
      appearance: { ...DEFAULT_APPEARANCE, topStyle: index === 0 ? 6 : 2, shirt: index === 0 ? 'c8a8d8' : '4a4e5c' },
      styleId: 'forged',
    }));
    const profile = villageProfilePublic(state, 3, 0, 0, rawLooks);
    expect(profile.signatureLooks).toHaveLength(3);
    expect(profile.signatureLooks[0]).toMatchObject({ name: '달빛산책', styleId: 'dreamy', appearance: { topStyle: 6 } });
    expect(normalizeVillageProfilePublic({ ...profile, signatureLooks: [{ ...profile.signatureLooks[0], styleId: 'street' }] })?.signatureLooks[0]?.styleId).toBe('dreamy');
  });

  it('대표 OC 세 장만 안전한 이름과 알려진 역할·모티프로 공개한다', () => {
    const profile = normalizeVillageProfilePublic({
      characterCards: Array.from({ length: 4 }, (_, index) => ({
        name: index ? `인물 ${index + 1}` : '<별빛>\n편집자',
        appearance: DEFAULT_APPEARANCE,
        roleId: index ? 'forged' : 'midnight_editor',
        motifId: index ? 'forged' : 'star',
        direction: index === 2 ? 2 : 99,
        savedAt: 10,
      })),
    })!;
    expect(profile.characterCards).toHaveLength(3);
    expect(profile.characterCards[0]).toMatchObject({
      name: '별빛 편집자', roleId: 'midnight_editor', motifId: 'star', direction: 0,
    });
    expect(profile.characterCards[0]).not.toHaveProperty('savedAt');
    expect(profile.characterCards[1]).toMatchObject({ roleId: 'midnight_editor', motifId: 'star' });
  });

  it('대표 홈 엽서 세 장은 실제 외형·동행·가구 배치만 공개하고 저장 시각은 제외한다', () => {
    const rawCard = {
      moodId: 'companion', appearance: DEFAULT_APPEARANCE,
      pet: { speciesId: 'dog', accessory: 'scarf', name: '비공개 이름' },
      houseType: 'oneroom', themeId: 'pet', themeName: '<동행>\n방',
      score: 87, placements: [{ itemId: 'bed_basic', tx: 2, ty: 3, rot: 1 }],
      savedAt: 123456,
    };
    const profile = normalizeVillageProfilePublic({ homeCards: [rawCard, rawCard, rawCard, rawCard] })!;
    expect(profile.homeCards).toHaveLength(3);
    expect(profile.homeCards[0]).toMatchObject({
      moodId: 'companion', pet: { speciesId: 'dog', accessory: 'scarf' },
      themeName: '동행방', score: 87,
      placements: [{ itemId: 'bed_basic', tx: 2, ty: 3, rot: 1 }],
    });
    expect(profile.homeCards[0]).not.toHaveProperty('savedAt');
    expect(profile.homeCards[0]?.pet).not.toHaveProperty('name');
  });

  it('대표 동행 코디는 세 장만 공개하고 별명·카드 ID·저장 시각은 전파하지 않는다', () => {
    const rawCard = {
      petId: 'dog', petName: '비공개 이름', personalityId: 'gentle', accessoryId: 'scarf',
      backdropId: 'rain_window', poseId: 'look_back', id: '비공개 카드 ID', savedAt: 123456,
    };
    const profile = normalizeVillageProfilePublic({
      petStyleCards: [
        rawCard,
        { ...rawCard, petId: 'cat', personalityId: 'calm', accessoryId: 'beret', backdropId: 'cozy_home', poseId: 'daydream' },
        { ...rawCard, petId: 'rabbit', personalityId: 'performer', accessoryId: 'ribbon', backdropId: 'little_stage', poseId: 'spotlight' },
        { ...rawCard, petId: 'fox' },
      ],
    })!;
    expect(profile.petStyleCards).toHaveLength(3);
    expect(profile.petStyleCards[0]).toEqual({
      petId: 'dog', personalityId: 'gentle', accessoryId: 'scarf',
      backdropId: 'rain_window', poseId: 'look_back',
    });
    expect(profile.petStyleCards[0]).not.toHaveProperty('petName');
    expect(profile.petStyleCards[0]).not.toHaveProperty('id');
    expect(profile.petStyleCards[0]).not.toHaveProperty('savedAt');
    expect(normalizeVillageProfilePublic({
      petStyleCards: [
        { ...rawCard, petId: 'dragon' },
        { ...rawCard, poseId: 'flying' },
      ],
    })?.petStyleCards).toEqual([]);
  });
});
