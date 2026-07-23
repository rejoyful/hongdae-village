import { normalizeAppearance, type Appearance } from '../art/appearance';
import { isPetAccessoryId, type PetAccessoryId } from '../pets/petProfiles';
import { petById } from '../pets/pets';
import { RESIDENTS } from '../residents/residents';

export const FAN_MERCH_SLOT_COUNT = 12;
export const FAN_MERCH_FEATURED_MAX = 3;

export const FAN_MERCH_FORMATS = [
  { id: 'acrylic', mark: '판', code: 'ACRYLIC', name: '아크릴 스탠드', note: '책상 위에 세우는 작은 전신 장면' },
  { id: 'photocard', mark: '컷', code: 'PHOTO CARD', name: '소장 포토카드', note: '슬리브와 금박을 고른 한 장' },
  { id: 'button', mark: '원', code: 'BUTTON', name: '캔 배지', note: '가방에 달기 좋은 둥근 마음표' },
  { id: 'keyring', mark: '링', code: 'KEY RING', name: '픽셀 키링', note: '골목 열쇠와 나란히 흔들리는 장식' },
  { id: 'poster', mark: '벽', code: 'MINI POSTER', name: '미니 포스터', note: '방 한구석을 채우는 작은 화보' },
  { id: 'ticket', mark: '표', code: 'TICKET BOOK', name: '기념 티켓북', note: '좋아한 날짜 대신 장면을 찍는 표' },
] as const;

export const FAN_MERCH_MOTIFS = [
  { id: 'neon', mark: '빛', name: '심야 네온', note: '보라와 분홍 간판빛', colors: ['#262038', '#6c4d87', '#d56f93', '#f0c980'] },
  { id: 'cozy', mark: '집', name: '포근한 방', note: '원목과 크림빛 스탠드', colors: ['#382a25', '#835f49', '#c99668', '#efdbb3'] },
  { id: 'garden', mark: '잎', name: '옥상 초록', note: '잎과 햇살이 남은 오후', colors: ['#22352b', '#53745a', '#97b16d', '#e7dba8'] },
  { id: 'rain', mark: '비', name: '비 갠 물결', note: '청록 반사와 젖은 필름', colors: ['#213140', '#4f7484', '#75a9aa', '#d7e2bd'] },
  { id: 'festival', mark: '등', name: '골목 축제', note: '등불과 리본이 켜진 밤', colors: ['#362631', '#8e5260', '#d7836d', '#f1d28f'] },
  { id: 'forest', mark: '숲', name: '외곽 별빛', note: '짙은 숲과 관찰 별자리', colors: ['#202d2b', '#4d6a5a', '#829a69', '#e0d39a'] },
] as const;

export type FanMerchFormatId = typeof FAN_MERCH_FORMATS[number]['id'];
export type FanMerchMotifId = typeof FAN_MERCH_MOTIFS[number]['id'];
export type FanMerchSubjectKind = 'self' | 'pet' | 'resident';

export interface FanMerchSelfSubject {
  kind: 'self';
  id: 'self';
  name: string;
  appearance: Appearance;
}

export interface FanMerchPetSubject {
  kind: 'pet';
  id: string;
  name: string;
  speciesId: string;
  accessory: PetAccessoryId;
}

export interface FanMerchResidentSubject {
  kind: 'resident';
  id: string;
  name: string;
  appearance: Appearance;
}

export type FanMerchSubject = FanMerchSelfSubject | FanMerchPetSubject | FanMerchResidentSubject;

export interface FanMerchDraft {
  subject: FanMerchSubject;
  formatId: FanMerchFormatId;
  motifId: FanMerchMotifId;
}

export interface FanMerchRecord extends FanMerchDraft {
  id: string;
  createdAt: number;
}

export interface FanMerchWorkshopState {
  version: 1;
  slots: Array<FanMerchRecord | null>;
  featuredIds: string[];
  discoveries: string[];
  totalCreated: number;
}

export interface FanMerchWorkshopProgress {
  savedSlots: number;
  totalCreated: number;
  discoveries: number;
  subjects: number;
  subjectKinds: number;
  formats: number;
  motifs: number;
  featured: number;
}

export type FanMerchSaveResult = 'saved' | 'replaced' | 'invalid-slot';
export type FanMerchFeatureResult = 'featured' | 'cleared' | 'full' | 'missing';

export interface FanMerchStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const formatIds = new Set<string>(FAN_MERCH_FORMATS.map((item) => item.id));
const motifIds = new Set<string>(FAN_MERCH_MOTIFS.map((item) => item.id));
const residentById = new Map(RESIDENTS.map((resident) => [resident.id, resident]));

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

const safeName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[<>\n\r]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12) || fallback;
};

function normalizeSubject(raw: unknown): FanMerchSubject | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<FanMerchSubject>;
  if (value.kind === 'self' && value.appearance && typeof value.appearance === 'object') {
    return {
      kind: 'self', id: 'self', name: safeName(value.name, '나의 캐릭터'),
      appearance: normalizeAppearance(value.appearance),
    };
  }
  if (value.kind === 'resident') {
    const resident = typeof value.id === 'string' ? residentById.get(value.id) : null;
    if (!resident) return null;
    return {
      kind: 'resident', id: resident.id, name: resident.name,
      appearance: normalizeAppearance(value.appearance && typeof value.appearance === 'object'
        ? value.appearance : resident.appearance),
    };
  }
  if (value.kind === 'pet' && typeof value.speciesId === 'string') {
    const species = petById(value.speciesId);
    if (!species) return null;
    return {
      kind: 'pet', id: species.id, speciesId: species.id,
      name: safeName(value.name, species.name),
      accessory: isPetAccessoryId(value.accessory) ? value.accessory : 'none',
    };
  }
  return null;
}

export function normalizeFanMerchRecord(raw: unknown): FanMerchRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<FanMerchRecord>;
  const subject = normalizeSubject(value.subject);
  if (!subject || typeof value.id !== 'string' || !value.id
    || !formatIds.has(value.formatId ?? '') || !motifIds.has(value.motifId ?? '')) return null;
  return {
    id: value.id.slice(0, 80),
    subject,
    formatId: value.formatId as FanMerchFormatId,
    motifId: value.motifId as FanMerchMotifId,
    createdAt: cleanCount(value.createdAt),
  };
}

function discoveryKey(draft: FanMerchDraft): string {
  return `${draft.subject.kind}:${draft.subject.id}:${draft.formatId}:${draft.motifId}`;
}

export function freshFanMerchWorkshopState(): FanMerchWorkshopState {
  return {
    version: 1,
    slots: Array.from({ length: FAN_MERCH_SLOT_COUNT }, () => null),
    featuredIds: [],
    discoveries: [],
    totalCreated: 0,
  };
}

export function normalizeFanMerchWorkshopState(raw: unknown): FanMerchWorkshopState {
  if (!raw || typeof raw !== 'object') return freshFanMerchWorkshopState();
  const value = raw as Partial<FanMerchWorkshopState>;
  const seenRecordIds = new Set<string>();
  const input = Array.isArray(value.slots) ? value.slots : [];
  const slots = Array.from({ length: FAN_MERCH_SLOT_COUNT }, (_, index) => {
    const record = normalizeFanMerchRecord(input[index]);
    if (!record || seenRecordIds.has(record.id)) return null;
    seenRecordIds.add(record.id);
    return record;
  });
  const featuredIds = Array.isArray(value.featuredIds)
    ? [...new Set(value.featuredIds.filter((id): id is string => (
      typeof id === 'string' && seenRecordIds.has(id)
    )))].slice(0, FAN_MERCH_FEATURED_MAX)
    : [];
  const discoveries = Array.isArray(value.discoveries)
    ? [...new Set(value.discoveries.filter((key): key is string => (
      typeof key === 'string' && /^(self|pet|resident):[^:]+:(acrylic|photocard|button|keyring|poster|ticket):(neon|cozy|garden|rain|festival|forest)$/.test(key)
    )))].slice(0, 1000)
    : [];
  return {
    version: 1,
    slots,
    featuredIds,
    discoveries,
    totalCreated: Math.max(cleanCount(value.totalCreated), slots.filter(Boolean).length, discoveries.length),
  };
}

export function fanMerchWorkshopProgress(state: FanMerchWorkshopState): FanMerchWorkshopProgress {
  const parts = state.discoveries.map((key) => key.split(':'));
  return {
    savedSlots: state.slots.filter(Boolean).length,
    totalCreated: state.totalCreated,
    discoveries: state.discoveries.length,
    subjects: new Set(parts.map((part) => `${part[0]}:${part[1]}`)).size,
    subjectKinds: new Set(parts.map((part) => part[0])).size,
    formats: new Set(parts.map((part) => part[2])).size,
    motifs: new Set(parts.map((part) => part[3])).size,
    featured: state.featuredIds.length,
  };
}

function browserStorage(): FanMerchStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class FanMerchWorkshopStore {
  private state: FanMerchWorkshopState;
  private readonly key: string;

  constructor(userId: string, private readonly storage: FanMerchStorage | null = browserStorage()) {
    this.key = `hv-fan-merch-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 안전한 빈 공방으로 계속 진행 */ }
    this.state = normalizeFanMerchWorkshopState(raw);
    this.persist();
  }

  get(): FanMerchWorkshopState { return structuredClone(this.state); }
  progress(): FanMerchWorkshopProgress { return fanMerchWorkshopProgress(this.state); }

  save(slot: number, draft: FanMerchDraft): FanMerchSaveResult {
    if (!Number.isInteger(slot) || slot < 0 || slot >= FAN_MERCH_SLOT_COUNT) return 'invalid-slot';
    const normalizedSubject = normalizeSubject(draft.subject);
    if (!normalizedSubject || !formatIds.has(draft.formatId) || !motifIds.has(draft.motifId)) return 'invalid-slot';
    const replaced = !!this.state.slots[slot];
    const previousId = this.state.slots[slot]?.id ?? null;
    const record: FanMerchRecord = {
      id: `${Date.now()}-${this.state.totalCreated + 1}-${slot}`,
      subject: normalizedSubject,
      formatId: draft.formatId,
      motifId: draft.motifId,
      createdAt: Date.now(),
    };
    const slots = [...this.state.slots];
    slots[slot] = record;
    const featuredIds = previousId
      ? this.state.featuredIds.map((id) => id === previousId ? record.id : id)
      : this.state.featuredIds;
    this.state = {
      ...this.state,
      slots,
      featuredIds,
      discoveries: [...new Set([...this.state.discoveries, discoveryKey(record)])],
      totalCreated: this.state.totalCreated + 1,
    };
    this.persist();
    return replaced ? 'replaced' : 'saved';
  }

  feature(recordId: string): FanMerchFeatureResult {
    if (!this.state.slots.some((record) => record?.id === recordId)) return 'missing';
    if (this.state.featuredIds.includes(recordId)) {
      this.state = { ...this.state, featuredIds: this.state.featuredIds.filter((id) => id !== recordId) };
      this.persist();
      return 'cleared';
    }
    if (this.state.featuredIds.length >= FAN_MERCH_FEATURED_MAX) return 'full';
    this.state = { ...this.state, featuredIds: [...this.state.featuredIds, recordId] };
    this.persist();
    return 'featured';
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션 안에서 계속 제작 */ }
  }
}
