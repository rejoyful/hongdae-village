import {
  normalizeTreasure, freshState, collectSpot, craftTreasure, collectionProgress,
  todaySeoul, type TreasureState, type SparkleSpot,
} from './treasures';

/** 트레저 수집 지속 저장 (localStorage, userId별). 스팟은 매일 리셋, 조각·보물은 유지 */
export class TreasureStore {
  private state: TreasureState;
  private readonly key: string;

  constructor(userId: string, today = todaySeoul()) {
    this.key = `hv-treasure-${userId}`;
    let raw: unknown = null;
    try { const s = localStorage.getItem(this.key); if (s) raw = JSON.parse(s); } catch { /* ignore */ }
    this.state = raw ? normalizeTreasure(raw, today) : freshState(today);
    this.persist();
  }

  get(): TreasureState { return this.state; }
  get shards(): number { return this.state.shards; }

  isFound(spotId: string): boolean { return this.state.found.includes(spotId); }

  /** 스팟 채집 — 오늘 처음이면 조각 획득. 반환 획득 조각(0=이미) */
  collect(spot: SparkleSpot): number {
    const r = collectSpot(this.state, spot);
    this.state = r.state;
    if (r.gained > 0) this.persist();
    return r.gained;
  }

  /** 조각 직접 추가 (펫 선물 등). 음수·0은 무시 */
  addShards(n: number): void {
    if (n <= 0) return;
    this.state = { ...this.state, shards: this.state.shards + Math.floor(n) };
    this.persist();
  }

  /** 보물 제작. 성공 여부 */
  craft(treasureId: string): boolean {
    const r = craftTreasure(this.state, treasureId);
    if (!r.ok) return false;
    this.state = r.state;
    this.persist();
    return true;
  }

  progress(): { owned: number; total: number } { return collectionProgress(this.state); }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
