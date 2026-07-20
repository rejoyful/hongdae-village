/** 원격 플레이어 위치 스냅샷 (t: 수신 시각 ms) */
export interface Snapshot { t: number; x: number; y: number }

const MAX_SNAPSHOTS = 32;

/**
 * 원격 플레이어 보간 트랙. 스냅샷을 시간순으로 쌓고,
 * 렌더 시각(now - INTERP_DELAY_MS)의 위치를 선형 보간으로 샘플한다.
 * 로컬 플레이어는 stepPlayer(입력 구동), 원격은 이 트랙(보간 구동) — 스펙 §6.
 */
export class RemoteTrack {
  private buf: Snapshot[] = [];

  /** 과거·동일 시각 스냅샷은 무시해 시간 오름차순을 보장한다 */
  push(s: Snapshot): void {
    const last = this.buf[this.buf.length - 1];
    if (last && s.t <= last.t) return;
    this.buf.push(s);
    if (this.buf.length > MAX_SNAPSHOTS) this.buf.shift();
  }

  /** renderT 시점 위치. 버퍼가 비면 null, 범위 밖이면 가장 가까운 끝값 고정 */
  sample(renderT: number): { x: number; y: number } | null {
    const first = this.buf[0];
    if (!first) return null;
    if (this.buf.length === 1 || renderT <= first.t) return { x: first.x, y: first.y };
    const last = this.buf[this.buf.length - 1]!;
    if (renderT >= last.t) return { x: last.x, y: last.y };
    for (let i = 1; i < this.buf.length; i++) {
      const b = this.buf[i]!;
      if (renderT <= b.t) {
        const a = this.buf[i - 1]!;
        const k = (renderT - a.t) / (b.t - a.t);
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      }
    }
    return { x: last.x, y: last.y };
  }
}
