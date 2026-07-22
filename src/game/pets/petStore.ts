import { AFFINITY_MAX, BASE_SPECIES, evalUnlocks, petStage } from './pets';

/** 펫 보유·동행·친밀도 상태 (로컬 SSOT). 온라인이면 서버 owned_pets를 union해 기기 간 유지 */
const KEY = 'hv-pets-v1';

interface PetState {
  owned: string[];
  active: string | null;
  affinity: Record<string, number>; // petId -> 0..100
  fedDay: Record<string, string>;   // petId -> KST 날짜키 (하루 1회 먹이)
  feeds: number;                    // 누적 먹이 횟수 (히든 해금용)
  unlocked: string[];               // 발견한 희귀 펫 id
}

/** KST(서울) 날짜키 — 자정 리셋 기준 (퀘스트·보물과 동일 규칙) */
function kstDayKey(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60000);
  return `${kst.getFullYear()}-${kst.getMonth() + 1}-${kst.getDate()}`;
}

function load(): PetState {
  const base: PetState = { owned: [], active: null, affinity: {}, fedDay: {}, feeds: 0, unlocked: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      owned: Array.isArray(raw.owned) ? raw.owned.filter((x: unknown) => typeof x === 'string') : [],
      active: typeof raw.active === 'string' ? raw.active : null,
      affinity: raw.affinity && typeof raw.affinity === 'object' ? raw.affinity : {},
      fedDay: raw.fedDay && typeof raw.fedDay === 'object' ? raw.fedDay : {},
      feeds: Number.isFinite(raw.feeds) ? raw.feeds : 0,
      unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((x: unknown) => typeof x === 'string') : [],
    };
  } catch { return base; }
}

const clampAff = (n: number) => Math.max(0, Math.min(AFFINITY_MAX, Math.round(n)));

export class PetStore {
  private state: PetState = load();

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* 무시 */ }
  }

  /** 서버 동기 — 스냅샷/복원 */
  snapshot(): PetState { return this.state; }
  hydrate(raw: unknown): void {
    const r = (raw ?? {}) as Record<string, unknown>;
    this.state = {
      owned: Array.isArray(r.owned) ? (r.owned as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      active: typeof r.active === 'string' ? r.active : null,
      affinity: r.affinity && typeof r.affinity === 'object' ? r.affinity as Record<string, number> : {},
      fedDay: r.fedDay && typeof r.fedDay === 'object' ? r.fedDay as Record<string, string> : {},
      feeds: Number.isFinite(r.feeds) ? r.feeds as number : 0,
      unlocked: Array.isArray(r.unlocked) ? (r.unlocked as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    };
    this.save();
  }

  owned(): string[] { return [...this.state.owned]; }
  isOwned(id: string): boolean { return this.state.owned.includes(id); }
  activeId(): string | null { return this.state.active; }
  affinity(id: string): number { return this.state.affinity[id] ?? 0; }
  stage(id: string): number { return petStage(this.affinity(id)); }
  totalFeeds(): number { return this.state.feeds; }
  isUnlocked(id: string): boolean { return this.state.unlocked.includes(id); }

  /** 서버에서 불러온 보유 목록 병합 (기기 간 동기) */
  merge(ids: string[]): void {
    let changed = false;
    for (const id of ids) if (!this.state.owned.includes(id)) { this.state.owned.push(id); changed = true; }
    if (changed) this.save();
  }

  adopt(id: string): void {
    if (!this.state.owned.includes(id)) {
      this.state.owned.push(id);
      if (this.state.affinity[id] == null) this.state.affinity[id] = 10; // 입양 첫날 살짝 친함
      this.save();
    }
  }

  /** 동행 펫 지정 (null = 넣어두기). 보유하지 않은 펫은 무시 */
  setActive(id: string | null): void {
    if (id !== null && !this.state.owned.includes(id)) return;
    this.state.active = id;
    this.save();
  }

  /** 쓰다듬기 — 소량 친밀도 (쿨다운은 씬이 관리). 새 친밀도 반환 */
  pet(id: string): number {
    if (!this.state.owned.includes(id)) return 0;
    this.state.affinity[id] = clampAff(this.affinity(id) + 2);
    this.save();
    return this.state.affinity[id]!;
  }

  /** 오늘 먹이 가능 여부 (하루 1회) */
  canFeed(id: string): boolean {
    return this.state.owned.includes(id) && this.state.fedDay[id] !== kstDayKey();
  }

  /** 먹이 주기 — 하루 1회, 친밀도 +10 + 누적 카운트. 성공 시 새 친밀도, 실패 시 -1 */
  feed(id: string): number {
    if (!this.canFeed(id)) return -1;
    this.state.fedDay[id] = kstDayKey();
    this.state.feeds += 1;
    this.state.affinity[id] = clampAff(this.affinity(id) + 10);
    this.save();
    return this.state.affinity[id]!;
  }

  /** 통계 기반 희귀 펫 해금 — 새로 해금된 id 목록 반환 (연출용) */
  checkUnlocks(): string[] {
    const maxAffinity = Math.max(0, ...this.state.owned.map((id) => this.affinity(id)));
    const baseIds = new Set(BASE_SPECIES.map((p) => p.id));
    const ownedBase = this.state.owned.filter((id) => baseIds.has(id)).length;
    const newly = evalUnlocks({ maxAffinity, ownedBase, feeds: this.state.feeds })
      .filter((id) => !this.state.unlocked.includes(id));
    if (newly.length) { this.state.unlocked.push(...newly); this.save(); }
    return newly;
  }
}
