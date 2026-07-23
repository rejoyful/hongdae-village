import { PET_SPECIES, PET_TRICKS, type PetTrick } from './pets';
import { PET_PERSONALITIES, type PetPersonalityId } from './petProfiles';

const KEY = 'hv-pet-performances-v1';
export const PET_PERFORMANCE_THRESHOLDS = [1, 3, 6] as const;

export interface PetPerformanceDef {
  trickId: string;
  code: string;
  stageName: string;
  keepsakes: readonly [string, string, string];
  direction: string;
}

export interface PetPerformanceRecord {
  petId: string;
  trickId: string;
  rehearsals: number;
  lastAt: number;
}

export interface PetPerformanceState {
  version: 1;
  records: Record<string, PetPerformanceRecord>;
  totalRehearsals: number;
  featured: string | null;
}

export interface PetPerformanceView extends PetPerformanceDef {
  trick: PetTrick;
  learned: boolean;
  rehearsals: number;
  stamps: number;
  featured: boolean;
  nextThreshold: number | null;
  nextAction: string;
  personalityLine: string;
}

export interface PetPerformanceProgress {
  totalRehearsals: number;
  stamps: number;
  repertoireTricks: number;
  completedPerformances: number;
  petPartners: number;
  featured: number;
}

export type PetPerformanceResult =
  | { ok: true; rehearsals: number; stamps: number; newKeepsakes: string[]; completed: boolean }
  | { ok: false; reason: 'unknown-pet' | 'unknown-trick' | 'not-learned' };

export const PET_PERFORMANCES: readonly PetPerformanceDef[] = [
  {
    trickId: 'hello', code: 'STAGE 01', stageName: '첫인사 소극장',
    keepsakes: ['첫 관객표', '반듯한 인사 리본', '앙코르 커튼 조각'],
    direction: '작은 커튼이 열리면 눈을 맞추고 천천히 인사해요.',
  },
  {
    trickId: 'paw', code: 'STAGE 02', stageName: '두 손의 약속 무대',
    keepsakes: ['발도장 티켓', '나란한 손수건', '단짝 약속패'],
    direction: '낮은 단상 위에서 서로의 손과 발을 조심스레 맞춰요.',
  },
  {
    trickId: 'spin', code: 'STAGE 03', stageName: '빙글 색종이 극장',
    keepsakes: ['첫 바퀴 띠지', '회전 별가루 병', '여섯 바퀴 금박'],
    direction: '색종이 조명 사이로 둘만의 속도에 맞춰 한 바퀴 돌아요.',
  },
  {
    trickId: 'dance', code: 'STAGE 04', stageName: '골목 리듬 라이브',
    keepsakes: ['첫 박자 픽', '둘만의 세트리스트', '비밀 라이브 음반'],
    direction: '낡은 스피커와 네온 박자 위에서 자유롭게 몸을 흔들어요.',
  },
  {
    trickId: 'pose', code: 'STAGE 05', stageName: '최애 포토 피날레',
    keepsakes: ['첫 셔터 별', '대표 포즈 필름', '피날레 금빛 프레임'],
    direction: '가장 좋아하는 모습으로 멈춰 둘만의 마지막 장면을 남겨요.',
  },
] as const;

const PERFORMANCE_BY_TRICK = new Map(PET_PERFORMANCES.map((item) => [item.trickId, item]));
const TRICK_BY_ID = new Map(PET_TRICKS.map((item) => [item.id, item]));
const PET_IDS = new Set(PET_SPECIES.map((item) => item.id));
const PERSONALITY_NAMES = new Map(PET_PERSONALITIES.map((item) => [item.id, item.name]));
const recordKey = (petId: string, trickId: string): string => `${petId}:${trickId}`;
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export function freshPetPerformanceState(): PetPerformanceState {
  return { version: 1, records: {}, totalRehearsals: 0, featured: null };
}

export function normalizePetPerformanceState(raw: unknown): PetPerformanceState {
  if (!raw || typeof raw !== 'object') return freshPetPerformanceState();
  const value = raw as Partial<PetPerformanceState>;
  const records: Record<string, PetPerformanceRecord> = {};
  const input = value.records && typeof value.records === 'object'
    ? value.records as Record<string, unknown> : {};
  for (const entry of Object.values(input)) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<PetPerformanceRecord>;
    if (typeof candidate.petId !== 'string' || !PET_IDS.has(candidate.petId)) continue;
    if (typeof candidate.trickId !== 'string' || !PERFORMANCE_BY_TRICK.has(candidate.trickId)) continue;
    const rehearsals = cleanCount(candidate.rehearsals);
    if (!rehearsals) continue;
    records[recordKey(candidate.petId, candidate.trickId)] = {
      petId: candidate.petId,
      trickId: candidate.trickId,
      rehearsals,
      lastAt: cleanCount(candidate.lastAt),
    };
  }
  const rehearsed = Object.values(records).reduce((sum, item) => sum + item.rehearsals, 0);
  const featured = typeof value.featured === 'string' && records[value.featured] ? value.featured : null;
  return {
    version: 1,
    records,
    totalRehearsals: Math.max(cleanCount(value.totalRehearsals), rehearsed),
    featured,
  };
}

export function petPerformanceStampCount(rehearsals: number): number {
  return PET_PERFORMANCE_THRESHOLDS.filter((threshold) => rehearsals >= threshold).length;
}

function personalityLine(personality: PetPersonalityId, trick: PetTrick): string {
  const lines: Record<PetPersonalityId, string> = {
    gentle: `박수보다 눈을 맞추며 ${trick.name}의 속도를 함께 정해요.`,
    curious: `${trick.name}의 작은 동작마다 새 이름을 붙이며 무대를 살펴요.`,
    brave: `조금 떨려도 먼저 무대에 올라 ${trick.name}의 첫 장면을 열어요.`,
    playful: `정해진 순서도 놀이처럼 바꾸며 ${trick.name}을 둘만의 버전으로 만들어요.`,
    calm: `서두르지 않고 익숙한 호흡으로 ${trick.name}의 여운을 길게 남겨요.`,
    performer: `관객이 한 명이어도 ${trick.name}의 마지막 인사까지 또렷하게 보여 줘요.`,
  };
  return lines[personality];
}

export function petPerformanceViews(
  state: PetPerformanceState,
  petId: string,
  learnedTrickIds: Iterable<string>,
  personality: PetPersonalityId,
): PetPerformanceView[] {
  const learned = new Set(learnedTrickIds);
  return PET_PERFORMANCES.map((def) => {
    const trick = TRICK_BY_ID.get(def.trickId)!;
    const record = state.records[recordKey(petId, def.trickId)];
    const rehearsals = record?.rehearsals ?? 0;
    const stamps = petPerformanceStampCount(rehearsals);
    const nextThreshold = PET_PERFORMANCE_THRESHOLDS.find((threshold) => rehearsals < threshold) ?? null;
    const isLearned = learned.has(def.trickId);
    return {
      ...def,
      trick,
      learned: isLearned,
      rehearsals,
      stamps,
      featured: state.featured === recordKey(petId, def.trickId),
      nextThreshold,
      nextAction: !isLearned
        ? `펫샵 돌봄에서 친밀도 ${trick.minAffinity}에 「${trick.name}」 배우기`
        : nextThreshold
          ? `${nextThreshold - rehearsals}번 더 함께하면 ${def.keepsakes[stamps]} 보존`
          : '세 장면 완성 · 좋아할 때마다 부담 없이 다시 공연할 수 있어요.',
      personalityLine: `${PERSONALITY_NAMES.get(personality) ?? '다정한'} 성격 · ${personalityLine(personality, trick)}`,
    };
  });
}

export function rehearsePetPerformance(
  state: PetPerformanceState,
  petId: string,
  trickId: string,
  learnedTrickIds: Iterable<string>,
): PetPerformanceResult {
  if (!PET_IDS.has(petId)) return { ok: false, reason: 'unknown-pet' };
  const def = PERFORMANCE_BY_TRICK.get(trickId);
  if (!def) return { ok: false, reason: 'unknown-trick' };
  if (!new Set(learnedTrickIds).has(trickId)) return { ok: false, reason: 'not-learned' };
  const key = recordKey(petId, trickId);
  const before = state.records[key]?.rehearsals ?? 0;
  const rehearsals = before + 1;
  state.records[key] = { petId, trickId, rehearsals, lastAt: Date.now() };
  state.totalRehearsals += 1;
  const beforeStamps = petPerformanceStampCount(before);
  const stamps = petPerformanceStampCount(rehearsals);
  return {
    ok: true,
    rehearsals,
    stamps,
    newKeepsakes: def.keepsakes.slice(beforeStamps, stamps),
    completed: beforeStamps < 3 && stamps === 3,
  };
}

export function petPerformanceProgress(state: PetPerformanceState): PetPerformanceProgress {
  const entries = Object.values(state.records);
  return {
    totalRehearsals: state.totalRehearsals,
    stamps: entries.reduce((sum, item) => sum + petPerformanceStampCount(item.rehearsals), 0),
    repertoireTricks: new Set(entries.map((item) => item.trickId)).size,
    completedPerformances: entries.filter((item) => petPerformanceStampCount(item.rehearsals) === 3).length,
    petPartners: new Set(entries.map((item) => item.petId)).size,
    featured: state.featured ? 1 : 0,
  };
}

export class PetPerformanceStore {
  private readonly key: string;
  private state: PetPerformanceState;

  constructor(userId: string) {
    this.key = `${KEY}:${userId}`;
    try { this.state = normalizePetPerformanceState(JSON.parse(localStorage.getItem(this.key) ?? '{}')); }
    catch { this.state = freshPetPerformanceState(); }
  }

  private save(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* 기록 실패가 공연을 막지 않는다. */ }
  }

  views(petId: string, learnedTrickIds: Iterable<string>, personality: PetPersonalityId): PetPerformanceView[] {
    return petPerformanceViews(this.state, petId, learnedTrickIds, personality);
  }

  rehearse(petId: string, trickId: string, learnedTrickIds: Iterable<string>): PetPerformanceResult {
    const result = rehearsePetPerformance(this.state, petId, trickId, learnedTrickIds);
    if (result.ok) this.save();
    return result;
  }

  feature(petId: string, trickId: string): boolean {
    const key = recordKey(petId, trickId);
    if (!this.state.records[key] || petPerformanceStampCount(this.state.records[key].rehearsals) < 1) return false;
    this.state.featured = this.state.featured === key ? null : key;
    this.save();
    return true;
  }

  progress(): PetPerformanceProgress { return petPerformanceProgress(this.state); }
}
