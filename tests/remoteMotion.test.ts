import { describe, it, expect } from 'vitest';
import { RemoteTrack } from '../src/game/entities/remoteMotion';

describe('RemoteTrack', () => {
  it('빈 버퍼는 null을 반환한다', () => {
    expect(new RemoteTrack().sample(1000)).toBeNull();
  });

  it('스냅샷이 하나면 그 값을 반환한다', () => {
    const tr = new RemoteTrack();
    tr.push({ t: 1000, x: 10, y: 20 });
    expect(tr.sample(900)).toEqual({ x: 10, y: 20 });
    expect(tr.sample(1100)).toEqual({ x: 10, y: 20 });
  });

  it('두 스냅샷 사이 시각은 선형 보간한다', () => {
    const tr = new RemoteTrack();
    tr.push({ t: 1000, x: 0, y: 0 });
    tr.push({ t: 1100, x: 100, y: 50 });
    expect(tr.sample(1050)).toEqual({ x: 50, y: 25 });
  });

  it('최신 스냅샷 이후 시각은 최신값을 유지한다', () => {
    const tr = new RemoteTrack();
    tr.push({ t: 1000, x: 0, y: 0 });
    tr.push({ t: 1100, x: 100, y: 50 });
    expect(tr.sample(9999)).toEqual({ x: 100, y: 50 });
  });

  it('역순(과거 시각) push는 무시한다', () => {
    const tr = new RemoteTrack();
    tr.push({ t: 1100, x: 100, y: 50 });
    tr.push({ t: 1000, x: 0, y: 0 }); // 무시되어야 함
    expect(tr.sample(1100)).toEqual({ x: 100, y: 50 });
    expect(tr.sample(500)).toEqual({ x: 100, y: 50 }); // first가 1100 스냅샷
  });
});
