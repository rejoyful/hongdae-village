import { describe, it, expect, beforeEach } from 'vitest';
import {
  petStage, evalUnlocks, PET_STAGES, AFFINITY_MAX, BASE_SPECIES, RARE_SPECIES,
} from '../src/game/pets/pets';
import { petTarget, PET_REST } from '../src/game/pets/petFollowMath';
import { giftIntervalMs, giftShards, giftEmoji, GIFT_EMOJIS } from '../src/game/pets/petGift';

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

describe('펫 팔로워 위치 — 플레이어와 겹치지 않는다', () => {
  it('정지 상태(지연 버퍼 없음)면 플레이어 옆자리로 밀어낸다', () => {
    const t = petTarget(300, 200, null);
    expect(t).toEqual({ x: 300 + PET_REST.dx, y: 200 + PET_REST.dy });
    // 실제로 떨어져 있어 겹치지 않음
    expect(Math.hypot(t.x - 300, t.y - 200)).toBeGreaterThanOrEqual(PET_REST.gap);
  });

  it('지연 좌표가 플레이어와 겹칠 만큼 가까우면 옆자리로 보정한다', () => {
    const t = petTarget(300, 200, { x: 302, y: 201 }); // 거의 겹침
    expect(t).toEqual({ x: 300 + PET_REST.dx, y: 200 + PET_REST.dy });
  });

  it('이동 중(충분히 뒤처짐)이면 지연 좌표를 그대로 따라간다', () => {
    const lagged = { x: 260, y: 200 }; // 40px 뒤
    expect(petTarget(300, 200, lagged)).toEqual(lagged);
  });
});

describe('펫 선물 로직', () => {
  it('간격은 친밀도가 높을수록 짧고 하한 18s를 지킨다', () => {
    expect(giftIntervalMs(0)).toBe(30000);
    expect(giftIntervalMs(50)).toBe(24000);
    expect(giftIntervalMs(100)).toBe(18000);
    expect(giftIntervalMs(100000)).toBe(18000); // 하한
  });

  it('조각 수는 1 ~ stage+1 범위', () => {
    expect(giftShards(0, () => 0)).toBe(1);
    expect(giftShards(0, () => 0.99)).toBe(1); // stage0은 항상 1
    expect(giftShards(3, () => 0)).toBe(1);
    expect(giftShards(3, () => 0.99)).toBe(4); // 1 + floor(0.99*4)=4
    for (let i = 0; i < 40; i++) {
      const n = giftShards(3);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(4);
    }
  });

  it('선물 이모지는 정의된 목록 안에서 나온다', () => {
    for (let i = 0; i < 30; i++) expect(GIFT_EMOJIS).toContain(giftEmoji());
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
