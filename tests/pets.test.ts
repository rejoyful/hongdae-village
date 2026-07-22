import { describe, it, expect, beforeEach } from 'vitest';
import {
  petStage, evalUnlocks, PET_STAGES, AFFINITY_MAX, BASE_SPECIES, RARE_SPECIES,
} from '../src/game/pets/pets';

// 노드 환경엔 localStorage가 없다 — 최소 shim
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

describe('펫 성장·해금 (순수 로직)', () => {
  it('petStage는 친밀도 구간을 지킨다', () => {
    expect(petStage(0)).toBe(0);
    expect(petStage(24)).toBe(0);
    expect(petStage(25)).toBe(1);
    expect(petStage(49)).toBe(1);
    expect(petStage(50)).toBe(2);
    expect(petStage(79)).toBe(2);
    expect(petStage(80)).toBe(3);
    expect(petStage(100)).toBe(3);
    expect(PET_STAGES.length).toBe(4);
  });

  it('기본 8종·희귀 3종이 분리된다', () => {
    expect(BASE_SPECIES).toHaveLength(8);
    expect(RARE_SPECIES).toHaveLength(3);
    expect(BASE_SPECIES.every((p) => !p.rare)).toBe(true);
    expect(RARE_SPECIES.every((p) => p.rare)).toBe(true);
  });

  it('evalUnlocks는 조건을 만족한 희귀 펫만 낸다', () => {
    expect(evalUnlocks({ maxAffinity: 0, ownedBase: 0, feeds: 0 })).toEqual([]);
    expect(evalUnlocks({ maxAffinity: 100, ownedBase: 0, feeds: 0 })).toContain('goldcat');
    expect(evalUnlocks({ maxAffinity: 99, ownedBase: 0, feeds: 0 })).not.toContain('goldcat');
    expect(evalUnlocks({ maxAffinity: 0, ownedBase: 5, feeds: 0 })).toContain('rainbowdog');
    expect(evalUnlocks({ maxAffinity: 0, ownedBase: 4, feeds: 0 })).not.toContain('rainbowdog');
    expect(evalUnlocks({ maxAffinity: 0, ownedBase: 0, feeds: 20 })).toContain('starbunny');
    expect(evalUnlocks({ maxAffinity: 0, ownedBase: 0, feeds: 19 })).not.toContain('starbunny');
  });
});

describe('PetStore (localStorage shim)', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('입양하면 첫 친밀도가 붙고 쓰다듬으면 오른다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const s = new PetStore();
    s.adopt('dog');
    expect(s.isOwned('dog')).toBe(true);
    expect(s.affinity('dog')).toBe(10);
    expect(s.pet('dog')).toBe(12);
    expect(s.pet('nope')).toBe(0); // 미보유는 무시
  });

  it('먹이는 하루 1회 — 재시도는 거부되고 친밀도·누적이 오른다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const s = new PetStore();
    s.adopt('cat');
    expect(s.canFeed('cat')).toBe(true);
    expect(s.feed('cat')).toBe(20); // 10 + 10
    expect(s.canFeed('cat')).toBe(false);
    expect(s.feed('cat')).toBe(-1); // 오늘 이미
    expect(s.totalFeeds()).toBe(1);
  });

  it('기본 5종 입양 시 무지개 강아지가 해금된다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const s = new PetStore();
    ['dog', 'cat', 'rabbit', 'chick', 'hamster'].forEach((id) => s.adopt(id));
    const newly = s.checkUnlocks();
    expect(newly).toContain('rainbowdog');
    expect(s.isUnlocked('rainbowdog')).toBe(true);
    // 두 번째 호출은 새 해금 없음(멱등)
    expect(s.checkUnlocks()).not.toContain('rainbowdog');
  });

  it('친밀도를 최고로 올리면 황금 고양이가 해금된다', async () => {
    const { PetStore } = await import('../src/game/pets/petStore');
    const s = new PetStore();
    s.adopt('fox');
    for (let i = 0; i < 50; i++) s.pet('fox'); // 10 + 2*50 → 100 클램프
    expect(s.affinity('fox')).toBe(AFFINITY_MAX);
    expect(s.checkUnlocks()).toContain('goldcat');
  });
});
