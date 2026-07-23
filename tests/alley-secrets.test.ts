import { describe, expect, it } from 'vitest';
import {
  ALLEY_SECRET_CHAPTERS,
  ALLEY_SECRETS,
  AlleySecretStore,
  alleySecretChapterViews,
  alleySecretProgress,
  normalizeAlleySecretState,
} from '../src/game/guidance/alleySecrets';
import { findIsoVillageRoute } from '../src/game/world/isometricCollectionGuide';
import { ISO_VILLAGE_SPAWN, buildIsoVillageCollision } from '../src/game/world/isometricVillageMap';
import { villageRequestDestinationForMetric } from '../src/game/requests/villageRequestStories';

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('alley secret archive', () => {
  it('places three distinct, reachable clues in each four-part story', () => {
    expect(ALLEY_SECRET_CHAPTERS).toHaveLength(4);
    expect(ALLEY_SECRETS).toHaveLength(12);
    expect(new Set(ALLEY_SECRETS.map((secret) => secret.id)).size).toBe(ALLEY_SECRETS.length);
    expect(new Set(ALLEY_SECRETS.map((secret) => `${secret.tx},${secret.ty}`)).size).toBe(ALLEY_SECRETS.length);

    const grid = buildIsoVillageCollision();
    for (const chapter of ALLEY_SECRET_CHAPTERS) {
      const secrets = ALLEY_SECRETS.filter((secret) => secret.chapterId === chapter.id);
      expect(secrets.map((secret) => secret.sequence)).toEqual([1, 2, 3]);
      for (const secret of secrets) {
        expect(grid.isSolid(secret.tx, secret.ty)).toBe(false);
        expect(findIsoVillageRoute(ISO_VILLAGE_SPAWN, secret)).not.toHaveLength(0);
      }
    }
  });

  it('normalizes damaged ids and only preserves a featured completed chapter', () => {
    const firstChapterSecrets = ALLEY_SECRETS
      .filter((secret) => secret.chapterId === 'first-door')
      .map((secret) => secret.id);
    expect(normalizeAlleySecretState({
      discoveredIds: [...firstChapterSecrets, firstChapterSecrets[0], '<script>'],
      featuredChapterId: 'first-door',
    })).toEqual({
      version: 1,
      discoveredIds: firstChapterSecrets,
      featuredChapterId: 'first-door',
    });
    expect(normalizeAlleySecretState({
      discoveredIds: [firstChapterSecrets[0]],
      featuredChapterId: 'first-door',
    }).featuredChapterId).toBeNull();
  });

  it('discovers clues permanently without loss or duplicate progress', () => {
    const storage = new MemoryStorage();
    const store = new AlleySecretStore('neighbor', storage);
    expect(store.discover('creased-ticket')).toBe('discovered');
    expect(store.discover('creased-ticket')).toBe('known');
    expect(store.discover('missing')).toBe('invalid');
    expect(store.progress().discovered).toBe(1);
    expect(new AlleySecretStore('neighbor', storage).get().discoveredIds).toEqual(['creased-ticket']);
  });

  it('completes and features a chapter without locking the other stories', () => {
    const store = new AlleySecretStore('collector', new MemoryStorage());
    expect(store.feature('first-door')).toBe('locked');
    for (const secret of ALLEY_SECRETS.filter((entry) => entry.chapterId === 'first-door')) {
      store.discover(secret.id);
    }
    expect(store.feature('first-door')).toBe('featured');
    expect(alleySecretChapterViews(store.get()).find((chapter) => chapter.id === 'first-door'))
      .toMatchObject({ discovered: 3, complete: true, featured: true });
    expect(store.feature('first-door')).toBe('cleared');
    expect(store.views().filter((secret) => !secret.discovered)).toHaveLength(9);
  });

  it('reports archive and chapter progress for quest metrics', () => {
    const state = normalizeAlleySecretState({
      discoveredIds: ALLEY_SECRETS.slice(0, 4).map((secret) => secret.id),
      featuredChapterId: 'first-door',
    });
    expect(alleySecretProgress(state)).toEqual({
      discovered: 4,
      total: 12,
      completedChapters: 1,
      totalChapters: 4,
      featured: 1,
    });
    expect(villageRequestDestinationForMetric('alley_secrets_discovered')).toBe('secrets');
    expect(villageRequestDestinationForMetric('alley_secret_chapters')).toBe('secrets');
  });
});
