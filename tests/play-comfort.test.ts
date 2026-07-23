import { describe, expect, it, vi } from 'vitest';
import {
  normalizePlayComfortState, PlayComfort, type PlayComfortStorage,
} from '../src/game/accessibility/playComfort';

class MemoryStorage implements PlayComfortStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('플레이 배려 설정', () => {
  it('손상된 저장값은 친절한 기본값으로 복구한다', () => {
    expect(normalizePlayComfortState({
      textSize: 'tiny', contrast: 'neon', motion: 'shake',
    })).toEqual({
      version: 1, textSize: 'standard', contrast: 'standard', motion: 'auto',
    });
  });

  it('큰 글씨·고대비·움직임 선택을 기기에 영구 저장한다', () => {
    const storage = new MemoryStorage();
    const comfort = new PlayComfort(storage, { matches: false });
    expect(comfort.setTextSize('largest')).toBe(true);
    expect(comfort.setContrast('high')).toBe(true);
    expect(comfort.setMotion('reduced')).toBe(true);
    expect(comfort.current()).toMatchObject({
      textSize: 'largest', contrast: 'high', motion: 'reduced', reducedMotion: true,
    });

    const restored = new PlayComfort(storage, { matches: false });
    expect(restored.get()).toEqual({
      version: 1, textSize: 'largest', contrast: 'high', motion: 'reduced',
    });
  });

  it('자동 모션은 기기 설정을 따르되 직접 선택이 우선한다', () => {
    const comfort = new PlayComfort(new MemoryStorage(), { matches: true });
    expect(comfort.reducedMotion()).toBe(true);
    comfort.setMotion('full');
    expect(comfort.reducedMotion()).toBe(false);
    comfort.setMotion('reduced');
    expect(comfort.reducedMotion()).toBe(true);
  });

  it('변경 구독은 현재 상태와 이후 선택을 즉시 알린다', () => {
    const comfort = new PlayComfort(new MemoryStorage(), { matches: false });
    const listener = vi.fn();
    const unsubscribe = comfort.subscribe(listener);
    comfort.setTextSize('large');
    comfort.setContrast('high');
    unsubscribe();
    comfort.setMotion('reduced');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls.at(-1)?.[0]).toMatchObject({
      textSize: 'large', contrast: 'high', reducedMotion: false,
    });
  });
});
