import { beforeEach, describe, expect, it } from 'vitest';
import { catchFish, fishingProgress, freshFishingState } from '../src/game/fishing/fishing';
import { FishingStore } from '../src/game/fishing/fishingStore';
import {
  AQUARIUM_FRAMES, AQUARIUM_ORNAMENTS, AQUARIUM_SUBSTRATES, applyHomeAquariumDraft,
  freshHomeAquariumState, homeAquariumProgress, normalizeHomeAquariumState,
} from '../src/game/home/homeAquarium';
import { HomeAquariumStore } from '../src/game/home/homeAquariumStore';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const fillWater = (state: ReturnType<typeof freshFishingState>, water: 'rail_garden' | 'moon_channel' | 'rooftop_reservoir') => {
  for (let i = 0; i < 18; i += 1) catchFish(state, water, 'glimmer');
};

describe('우리 집 물결 테라리움', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('프레임·바닥재·장식을 6종씩 제공하고 낚시 기록으로 순차 공개한다', () => {
    expect(AQUARIUM_FRAMES).toHaveLength(6);
    expect(AQUARIUM_SUBSTRATES).toHaveLength(6);
    expect(AQUARIUM_ORNAMENTS).toHaveLength(6);
    const fishing = freshFishingState();
    let progress = homeAquariumProgress(freshHomeAquariumState(), fishingProgress(fishing));
    expect(progress).toMatchObject({ displaySlots: 0, framesUnlocked: 1, substratesUnlocked: 1, ornamentsUnlocked: 1 });
    fillWater(fishing, 'rail_garden');
    fillWater(fishing, 'moon_channel');
    fillWater(fishing, 'rooftop_reservoir');
    progress = homeAquariumProgress(freshHomeAquariumState(), fishingProgress(fishing));
    expect(progress).toMatchObject({ displaySlots: 3, framesUnlocked: 6, substratesUnlocked: 6, ornamentsUnlocked: 6 });
  });

  it('발견 수에 따라 전시 슬롯이 1→2→3칸으로 열리고 미발견 생물은 거절한다', () => {
    const fishing = freshFishingState();
    const first = catchFish(fishing, 'rail_garden', 'crumb');
    const state = freshHomeAquariumState();
    const progress = fishingProgress(fishing);
    expect(homeAquariumProgress(state, progress).displaySlots).toBe(1);
    expect(applyHomeAquariumDraft(state, {
      frameId: 'rain_lab', substrateId: 'river_stone', ornamentId: 'reed', fishIds: [first.fishId, 'star_carp'],
    }, fishing, progress)).toEqual({ ok: false, reason: 'too-many-fish' });
    expect(applyHomeAquariumDraft(state, {
      frameId: 'rain_lab', substrateId: 'river_stone', ornamentId: 'reed', fishIds: ['star_carp'],
    }, fishing, progress)).toEqual({ ok: false, reason: 'undiscovered-fish' });
  });

  it('해금된 재료와 발견 생물 조합을 저장하고 저장 횟수를 누적한다', () => {
    const fishing = freshFishingState();
    fillWater(fishing, 'rail_garden');
    fillWater(fishing, 'moon_channel');
    const state = freshHomeAquariumState();
    const fishIds = Object.keys(fishing.records).slice(0, 3);
    const first = applyHomeAquariumDraft(state, {
      frameId: 'greenhouse', substrateId: 'brick_chip', ornamentId: 'mini_bridge', fishIds,
    }, fishing, fishingProgress(fishing));
    expect(first).toMatchObject({ ok: true, firstSave: true, fishCount: 3, saveCount: 1 });
    const second = applyHomeAquariumDraft(state, {
      frameId: 'rain_lab', substrateId: 'river_stone', ornamentId: 'reed', fishIds: fishIds.slice(0, 2),
    }, fishing, fishingProgress(fishing));
    expect(second).toMatchObject({ ok: true, firstSave: false, saveCount: 2 });
    expect(homeAquariumProgress(state, fishingProgress(fishing))).toMatchObject({ configured: true, displayedFish: 2 });
  });

  it('손상된 옵션·중복 생물·과한 저장 수를 안전하게 정규화한다', () => {
    const state = normalizeHomeAquariumState({
      frameId: 'hacked', substrateId: 'white_sand', ornamentId: 'reed',
      fishIds: ['rail_minnow', 'rail_minnow', 'unknown', 'star_carp', 'moon_catfish', 'rain_guppy'],
      saveCount: 2.9,
    });
    expect(state).toMatchObject({ frameId: 'rain_lab', substrateId: 'white_sand', ornamentId: 'reed', saveCount: 2 });
    expect(state.fishIds).toEqual(['rail_minnow', 'star_carp', 'moon_catfish']);
  });

  it('사용자별 저장 구성과 낚시 발견 기록을 함께 보존한다', () => {
    const fishing = new FishingStore('water-room');
    for (let i = 0; i < 6; i += 1) fishing.cast('rail_garden', 'crumb');
    const aquarium = new HomeAquariumStore('water-room');
    const fishIds = Object.keys(fishing.get().records).slice(0, 2);
    expect(aquarium.save({ frameId: 'rooftop_steel', substrateId: 'white_sand', ornamentId: 'reed', fishIds }, fishing).ok).toBe(true);
    const restored = new HomeAquariumStore('water-room');
    expect(restored.get()).toMatchObject({ frameId: 'rooftop_steel', substrateId: 'white_sand', fishIds, saveCount: 1 });
    expect(new HomeAquariumStore('neighbor').progress(new FishingStore('neighbor')).configured).toBe(false);
  });
});
