import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import type { Placed } from '../src/game/entities/placement';
import { analyzeHomeDesign } from '../src/game/home/homeDesign';
import {
  HOME_STUDIO_FEATURED_MAX, HOME_STUDIO_MOODS, HOME_STUDIO_SLOT_MAX,
  HomeStudioCardStore, freshHomeStudioCardState, homeStudioCardProgress,
  makeHomeStudioCard, normalizeHomeStudioCardState,
} from '../src/game/home/homeStudioCards';
import { HOME_STUDIO_CARD_QUESTS, QUEST_BY_ID } from '../src/game/quests';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const placed: Placed[] = [
  { id: 'bed', itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 },
  { id: 'desk', itemId: 'desk_wood', tx: 5, ty: 2, rot: 1 },
  { id: 'lamp', itemId: 'lamp_stand', tx: 7, ty: 4, rot: 2 },
  { id: 'plant', itemId: 'plant_pot', tx: 3, ty: 5, rot: 3 },
];

const card = (moodId: (typeof HOME_STUDIO_MOODS)[number]['id'], withPet = true) => makeHomeStudioCard({
  appearance: DEFAULT_APPEARANCE,
  pet: withPet ? { speciesId: 'dog', accessory: 'scarf' } : null,
  houseType: 'oneroom',
  analysis: analyzeHomeDesign(placed),
  placed,
}, moodId, 100);

describe('캐릭터·동행·방을 묶는 홈 스튜디오 엽서', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('서로 다른 여섯 연출은 이름·설명·4색 팔레트를 갖는다', () => {
    expect(HOME_STUDIO_MOODS).toHaveLength(6);
    expect(new Set(HOME_STUDIO_MOODS.map((mood) => mood.id)).size).toBe(6);
    for (const mood of HOME_STUDIO_MOODS) {
      expect(mood.palette).toHaveLength(4);
      expect(mood.note.length).toBeGreaterThan(25);
    }
  });

  it('현재 외형·동행·홈 분석·실제 가구 좌표를 독립 스냅샷으로 보존한다', () => {
    const snapshot = card('companion');
    expect(snapshot).toMatchObject({
      moodId: 'companion', houseType: 'oneroom', pet: { speciesId: 'dog', accessory: 'scarf' },
    });
    expect(snapshot.placements.slice(0, 2)).toEqual([
      { itemId: 'bed_basic', tx: 2, ty: 2, rot: 0 },
      { itemId: 'desk_wood', tx: 5, ty: 2, rot: 1 },
    ]);
    placed[0]!.tx = 20;
    expect(snapshot.placements[0]?.tx).toBe(2);
    placed[0]!.tx = 2;
  });

  it('여섯 슬롯을 저장·덮어쓰기하고 누적 촬영은 내려가지 않는다', () => {
    const store = new HomeStudioCardStore('six');
    expect(store.save(0, card('everyday'))).toBe('saved');
    expect(store.save(0, card('night'))).toBe('overwritten');
    expect(store.card(0)?.moodId).toBe('night');
    expect(store.progress()).toMatchObject({ savedCards: 1, totalCaptures: 2, moods: 1, petCards: 1 });
    expect(store.remove(0)).toBe(true);
    expect(store.progress()).toMatchObject({ savedCards: 0, totalCaptures: 2 });
  });

  it('완성 엽서만 세 장까지 대표 공개하며 네 번째가 기존 전시를 덮지 않는다', () => {
    const store = new HomeStudioCardStore('feature');
    HOME_STUDIO_MOODS.slice(0, 4).forEach((mood, index) => store.save(index, card(mood.id)));
    expect([0, 1, 2].map((slot) => store.toggleFeatured(slot))).toEqual(['added', 'added', 'added']);
    expect(store.toggleFeatured(3)).toBe('full');
    expect(store.get().featuredSlots).toEqual([0, 1, 2]);
    expect(store.toggleFeatured(1)).toBe('removed');
    expect(store.featuredCards().map((item) => item.moodId)).toEqual(['everyday', 'green']);
  });

  it('손상 저장은 유효한 카드·슬롯·가구만 남기고 공개 수를 제한한다', () => {
    const valid = card('creator');
    const normalized = normalizeHomeStudioCardState({
      slots: [valid, { ...valid, placements: [{ itemId: 'fake', tx: -3, ty: 2 }] }, null, valid],
      featuredSlots: [0, 0, 1, 3, 99],
      totalCaptures: -4,
    });
    expect(normalized.slots).toHaveLength(HOME_STUDIO_SLOT_MAX);
    expect(normalized.slots[1]?.placements).toEqual([]);
    expect(normalized.featuredSlots).toEqual([0, 1, 3].slice(0, HOME_STUDIO_FEATURED_MAX));
    expect(normalized.totalCaptures).toBe(3);
  });

  it('장기 진행은 저장 수·연출·동행 포함·대표 공개를 각각 집계한다', () => {
    const state = freshHomeStudioCardState();
    state.slots[0] = card('everyday', false);
    state.slots[1] = card('night');
    state.slots[2] = card('night');
    state.featuredSlots = [1, 2];
    state.totalCaptures = 7;
    expect(homeStudioCardProgress(state)).toEqual({
      savedCards: 3, totalCaptures: 7, moods: 2, petCards: 2,
      featuredCards: 2, totalSlots: HOME_STUDIO_SLOT_MAX,
    });
  });

  it('일곱 장기 목표가 저장·무드·동행·대표 공개 지표에 연결된다', () => {
    expect(HOME_STUDIO_CARD_QUESTS).toHaveLength(7);
    expect(HOME_STUDIO_CARD_QUESTS.every((quest) => QUEST_BY_ID.get(quest.id) === quest)).toBe(true);
    expect(new Set(HOME_STUDIO_CARD_QUESTS.map((quest) => quest.registryKey))).toEqual(new Set([
      'home_studio_cards', 'home_studio_pet_cards', 'home_studio_featured', 'home_studio_moods',
    ]));
  });
});
