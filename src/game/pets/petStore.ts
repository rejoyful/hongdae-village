/** 펫 보유·동행 상태 (로컬 SSOT). 온라인이면 서버 owned_pets를 union해 기기 간 유지 */
const KEY = 'hv-pets-v1';

interface PetState { owned: string[]; active: string | null }

function load(): PetState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const owned = Array.isArray(raw.owned) ? raw.owned.filter((x: unknown) => typeof x === 'string') : [];
    const active = typeof raw.active === 'string' ? raw.active : null;
    return { owned, active };
  } catch { return { owned: [], active: null }; }
}

export class PetStore {
  private state: PetState = load();

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* 무시 */ }
  }

  owned(): string[] { return [...this.state.owned]; }
  isOwned(id: string): boolean { return this.state.owned.includes(id); }
  activeId(): string | null { return this.state.active; }

  /** 서버에서 불러온 보유 목록 병합 (기기 간 동기) */
  merge(ids: string[]): void {
    let changed = false;
    for (const id of ids) if (!this.state.owned.includes(id)) { this.state.owned.push(id); changed = true; }
    if (changed) this.save();
  }

  adopt(id: string): void {
    if (!this.state.owned.includes(id)) { this.state.owned.push(id); this.save(); }
  }

  /** 동행 펫 지정 (null = 넣어두기). 보유하지 않은 펫은 무시 */
  setActive(id: string | null): void {
    if (id !== null && !this.state.owned.includes(id)) return;
    this.state.active = id;
    this.save();
  }
}
