import { describe, expect, it } from 'vitest';
import {
  clearLegacyGameData,
  createDesignerProfile,
  normalizeDesignerName,
} from '../src/core/profile';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('designer profile', () => {
  it('normalizes display names without inventing a fallback', () => {
    expect(normalizeDesignerName('  민아   킴  ')).toBe('민아 킴');
    expect(() => createDesignerProfile('   ')).toThrow('이름을 입력해 주세요.');
  });

  it('removes only legacy Hongdae Village data', () => {
    const storage = new MemoryStorage();
    storage.setItem('hv-quests-old', '1');
    storage.setItem('hongdae-village-profile', '1');
    storage.setItem('unrelated-key', 'keep');

    expect(clearLegacyGameData(storage)).toBe(2);
    expect(storage.getItem('unrelated-key')).toBe('keep');
  });
});
