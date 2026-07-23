import { AFFINITY_MAX, BASE_SPECIES, PET_TRICKS, evalUnlocks, petById, petStage, type PetMemory, type PetTrick } from './pets';
import {
  defaultPetPersonality, isPetAccessoryId, isPetPersonalityId, petAccessoryViews, sanitizePetNickname,
  type PetAccessoryId, type PetAccessoryStats, type PetAccessoryView, type PetPersonalityId,
} from './petProfiles';

/** 펫 보유·동행·친밀도 상태 (로컬 SSOT). 온라인이면 서버 owned_pets를 union해 기기 간 유지 */
const KEY = 'hv-pets-v1';

interface PetState {
  owned: string[];
  active: string | null;
  affinity: Record<string, number>; // petId -> 0..100
  fedDay: Record<string, string>;   // petId -> KST 날짜키 (하루 1회 먹이)
  feeds: number;                    // 누적 먹이 횟수 (히든 해금용)
  unlocked: string[];               // 발견한 희귀 펫 id
  playedDay: Record<string, string>; // petId -> 마지막 놀이 KST 날짜
  trainedDay: Record<string, string>;// petId -> 마지막 트릭 연습 날짜
  plays: Record<string, number>;     // petId -> 누적 놀이
  trainings: Record<string, number>;// petId -> 누적 연습
  tricks: Record<string, string[]>;  // petId -> 배운 트릭 id
  feedsByPet: Record<string, number>; // petId -> 누적 먹이 (레거시 total feeds와 병행)
  nicknames: Record<string, string>;
  personalities: Record<string, PetPersonalityId>;
  accessories: Record<string, PetAccessoryId>;
  styled: string[];                  // 프로필을 한 번이라도 직접 편집한 펫
}

/** KST(서울) 날짜키 — 자정 리셋 기준 (퀘스트·보물과 동일 규칙) */
function kstDayKey(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}

export interface PetServerSnapshot {
  petId: string;
  affinity: number;
  feeds: number;
  plays: number;
  trainings: number;
  tricks: string[];
  lastFedDay: string | null;
  lastPlayedDay: string | null;
  lastTrainedDay: string | null;
}

function normalizeState(value: unknown): PetState {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    owned: Array.isArray(raw.owned) ? raw.owned.filter((x): x is string => typeof x === 'string') : [],
    active: typeof raw.active === 'string' ? raw.active : null,
    affinity: raw.affinity && typeof raw.affinity === 'object' ? raw.affinity as Record<string, number> : {},
    fedDay: raw.fedDay && typeof raw.fedDay === 'object' ? raw.fedDay as Record<string, string> : {},
    feeds: Number.isFinite(raw.feeds) ? raw.feeds as number : 0,
    unlocked: Array.isArray(raw.unlocked) ? raw.unlocked.filter((x): x is string => typeof x === 'string') : [],
    playedDay: raw.playedDay && typeof raw.playedDay === 'object' ? raw.playedDay as Record<string, string> : {},
    trainedDay: raw.trainedDay && typeof raw.trainedDay === 'object' ? raw.trainedDay as Record<string, string> : {},
    plays: raw.plays && typeof raw.plays === 'object' ? raw.plays as Record<string, number> : {},
    trainings: raw.trainings && typeof raw.trainings === 'object' ? raw.trainings as Record<string, number> : {},
    tricks: raw.tricks && typeof raw.tricks === 'object' ? raw.tricks as Record<string, string[]> : {},
    feedsByPet: raw.feedsByPet && typeof raw.feedsByPet === 'object' ? raw.feedsByPet as Record<string, number> : {},
    nicknames: raw.nicknames && typeof raw.nicknames === 'object' ? Object.fromEntries(
      Object.entries(raw.nicknames).flatMap(([id, nicknameValue]) => {
        const nickname = sanitizePetNickname(nicknameValue);
        return nickname ? [[id, nickname]] : [];
      }),
    ) : {},
    personalities: raw.personalities && typeof raw.personalities === 'object' ? Object.fromEntries(
      Object.entries(raw.personalities).filter(([, personality]) => isPetPersonalityId(personality)),
    ) as Record<string, PetPersonalityId> : {},
    accessories: raw.accessories && typeof raw.accessories === 'object' ? Object.fromEntries(
      Object.entries(raw.accessories).filter(([, accessory]) => isPetAccessoryId(accessory)),
    ) as Record<string, PetAccessoryId> : {},
    styled: Array.isArray(raw.styled)
      ? [...new Set<string>(raw.styled.filter((id): id is string => typeof id === 'string'))] : [],
  };
}

function load(): PetState {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
  } catch {
    return normalizeState({});
  }
}

const clampAff = (n: number) => Math.max(0, Math.min(AFFINITY_MAX, Math.round(n)));

export class PetStore {
  private state: PetState = load();

  constructor(private readonly getUnlockedBadgeIds: () => readonly string[] = () => []) {}

  private save(): void {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* 무시 */ }
  }

  /** 서버 동기 — 스냅샷/복원 */
  snapshot(): PetState { return this.state; }
  hydrate(raw: unknown): void {
    this.state = normalizeState(raw);
    this.save();
  }

  owned(): string[] { return [...this.state.owned]; }
  isOwned(id: string): boolean { return this.state.owned.includes(id); }
  activeId(): string | null { return this.state.active; }
  affinity(id: string): number { return this.state.affinity[id] ?? 0; }
  stage(id: string): number { return petStage(this.affinity(id)); }
  totalFeeds(): number { return this.state.feeds; }
  feedCount(id: string): number { return Math.max(0, Math.floor(this.state.feedsByPet[id] ?? 0)); }
  isUnlocked(id: string): boolean { return this.state.unlocked.includes(id); }
  playCount(id: string): number { return Math.max(0, Math.floor(this.state.plays[id] ?? 0)); }
  trainingCount(id: string): number { return Math.max(0, Math.floor(this.state.trainings[id] ?? 0)); }
  learnedTricks(id: string): PetTrick[] {
    const learned = new Set(this.state.tricks[id] ?? []);
    return PET_TRICKS.filter((trick) => learned.has(trick.id));
  }
  nextTrick(id: string): PetTrick | null {
    const learned = new Set(this.state.tricks[id] ?? []);
    return PET_TRICKS.find((trick) => !learned.has(trick.id)) ?? null;
  }
  nickname(id: string): string | null { return sanitizePetNickname(this.state.nicknames[id]); }
  displayName(id: string): string { return this.nickname(id) ?? petById(id)?.name ?? id; }
  personality(id: string): PetPersonalityId { return this.state.personalities[id] ?? defaultPetPersonality(id); }
  accessory(id: string): PetAccessoryId {
    const value = this.state.accessories[id];
    return value && isPetAccessoryId(value) ? value : 'none';
  }
  accessoryStats(id: string): PetAccessoryStats {
    return {
      affinity: this.affinity(id), plays: this.playCount(id), trainings: this.trainingCount(id),
      tricks: this.learnedTricks(id).length, memories: this.memories(id).filter((memory) => memory.unlocked).length,
    };
  }
  accessoryViews(id: string): PetAccessoryView[] { return petAccessoryViews(this.accessoryStats(id), this.getUnlockedBadgeIds()); }
  customizedCount(): number { return this.state.owned.filter((id) => this.state.styled.includes(id)).length; }
  unlockedAccessoryCount(): number {
    const unlocked = new Set<PetAccessoryId>();
    for (const id of this.state.owned) {
      for (const item of this.accessoryViews(id)) if (item.id !== 'none' && item.unlocked) unlocked.add(item.id);
    }
    return unlocked.size;
  }
  personalityVariety(): number { return new Set(this.state.owned.map((id) => this.personality(id))).size; }

  setNickname(id: string, value: string): boolean {
    if (!this.isOwned(id)) return false;
    const nickname = sanitizePetNickname(value);
    const before = this.nickname(id);
    if (nickname === before) return false;
    if (nickname) this.state.nicknames[id] = nickname; else delete this.state.nicknames[id];
    this.markStyled(id); this.save(); return true;
  }

  setPersonality(id: string, personality: PetPersonalityId): boolean {
    if (!this.isOwned(id) || !isPetPersonalityId(personality) || this.personality(id) === personality) return false;
    this.state.personalities[id] = personality;
    this.markStyled(id); this.save(); return true;
  }

  equipAccessory(id: string, accessory: PetAccessoryId): boolean {
    if (!this.isOwned(id) || !isPetAccessoryId(accessory) || this.accessory(id) === accessory) return false;
    const view = this.accessoryViews(id).find((item) => item.id === accessory);
    if (!view?.unlocked) return false;
    this.state.accessories[id] = accessory;
    this.markStyled(id); this.save(); return true;
  }

  private markStyled(id: string): void {
    if (!this.state.styled.includes(id)) this.state.styled.push(id);
  }

  /** 서버에서 불러온 보유 목록 병합 (기기 간 동기) */
  merge(ids: string[]): void {
    let changed = false;
    for (const id of ids) if (!this.state.owned.includes(id)) { this.state.owned.push(id); changed = true; }
    if (changed) this.save();
  }

  /** 0013 서버 스냅샷을 로컬 캐시에 반영한다. 서버에 있는 수치는 온라인 세션의 권위값이다. */
  mergeServerProgress(rows: readonly PetServerSnapshot[]): void {
    const validTricks = new Set(PET_TRICKS.map((trick) => trick.id));
    let totalFeeds = 0;
    for (const row of rows) {
      if (!this.state.owned.includes(row.petId)) this.state.owned.push(row.petId);
      this.state.affinity[row.petId] = clampAff(row.affinity);
      this.state.plays[row.petId] = Math.max(0, Math.floor(row.plays));
      this.state.trainings[row.petId] = Math.max(0, Math.floor(row.trainings));
      this.state.tricks[row.petId] = [...new Set(row.tricks.filter((id) => validTricks.has(id)))];
      this.state.feedsByPet[row.petId] = Math.max(0, Math.floor(row.feeds));
      if (row.lastFedDay) this.state.fedDay[row.petId] = row.lastFedDay;
      if (row.lastPlayedDay) this.state.playedDay[row.petId] = row.lastPlayedDay;
      if (row.lastTrainedDay) this.state.trainedDay[row.petId] = row.lastTrainedDay;
      totalFeeds += Math.max(0, Math.floor(row.feeds));
    }
    this.state.feeds = totalFeeds;
    this.save();
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
    this.state.feedsByPet[id] = this.feedCount(id) + 1;
    this.state.affinity[id] = clampAff(this.affinity(id) + 10);
    this.save();
    return this.state.affinity[id]!;
  }

  /** 같이 놀기 — 하루 1회, 친밀도 +6. 실패 시 -1 */
  canPlay(id: string): boolean {
    return this.state.owned.includes(id) && this.state.playedDay[id] !== kstDayKey();
  }

  play(id: string): number {
    if (!this.canPlay(id)) return -1;
    this.state.playedDay[id] = kstDayKey();
    this.state.plays[id] = this.playCount(id) + 1;
    this.state.affinity[id] = clampAff(this.affinity(id) + 6);
    this.save();
    return this.state.affinity[id]!;
  }

  /** 다음 트릭 연습 가능 여부 — 요구 친밀도 충족 + 하루 1회 + 아직 배울 트릭 존재 */
  canTrain(id: string): boolean {
    const next = this.nextTrick(id);
    return this.state.owned.includes(id) && !!next
      && this.affinity(id) >= next.minAffinity && this.state.trainedDay[id] !== kstDayKey();
  }

  train(id: string): { ok: true; trick: PetTrick; affinity: number } | { ok: false; reason: 'daily' | 'affinity' | 'done' | 'not-owned' } {
    if (!this.state.owned.includes(id)) return { ok: false, reason: 'not-owned' };
    const next = this.nextTrick(id);
    if (!next) return { ok: false, reason: 'done' };
    if (this.state.trainedDay[id] === kstDayKey()) return { ok: false, reason: 'daily' };
    if (this.affinity(id) < next.minAffinity) return { ok: false, reason: 'affinity' };
    this.state.trainedDay[id] = kstDayKey();
    this.state.trainings[id] = this.trainingCount(id) + 1;
    this.state.tricks[id] = [...(this.state.tricks[id] ?? []), next.id];
    this.state.affinity[id] = clampAff(this.affinity(id) + 5);
    this.save();
    return { ok: true, trick: next, affinity: this.state.affinity[id]! };
  }

  /** 펫별 추억 앨범 — 실패/감점 없이 함께한 행동이 영구 기록으로 남는다. */
  memories(id: string): PetMemory[] {
    const trickCount = this.learnedTricks(id).length;
    return [
      { id: 'family', name: '처음 만난 날', emoji: '🏠', hint: '이 친구를 입양해 가족이 되기', unlocked: this.isOwned(id) },
      { id: 'playmate', name: '신나는 놀이친구', emoji: '🧶', hint: '같이 놀기 3번', unlocked: this.playCount(id) >= 3 },
      { id: 'student', name: '트릭 우등생', emoji: '🎓', hint: '트릭 3개 배우기', unlocked: trickCount >= 3 },
      { id: 'soulmate', name: '영혼의 단짝', emoji: '💛', hint: '친밀도 100 달성하기', unlocked: this.affinity(id) >= AFFINITY_MAX },
    ];
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
