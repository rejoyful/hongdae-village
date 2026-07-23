import { normalizeAppearance, type Appearance } from '../art/appearance';
import { isPetAccessoryId, sanitizePetNickname, type PetAccessoryId } from '../pets/petProfiles';
import { petById } from '../pets/pets';

export type PhotoFrameId = 'oatmeal' | 'leaf' | 'apricot' | 'walnut' | 'ink' | 'gold';
export type PhotoBackdropId = 'alley' | 'studio' | 'garden' | 'room' | 'stage' | 'night';
export type PhotoPoseId = 'hello' | 'side' | 'shy' | 'back';
export type PhotoStickerId = 'heart' | 'star' | 'paw' | 'home' | 'leaf' | 'camera' | 'note' | 'flower' | 'cup' | 'sparkle' | 'moon' | 'ribbon';
export type PhotoFoilId = 'paper' | 'silver' | 'rainbow' | 'midnight';

export interface PhotoFrameDef {
  id: PhotoFrameId;
  name: string;
  unlockAt: number;
  paper: string;
  ink: string;
  accent: string;
}

export interface PhotoBackdropDef {
  id: PhotoBackdropId;
  name: string;
  description: string;
}

export interface PhotoPoseDef {
  id: PhotoPoseId;
  name: string;
  dir: 0 | 1 | 2 | 3;
  steps: readonly [number, number, number, number];
}

export interface PhotoStickerDef {
  id: PhotoStickerId;
  mark: string;
  name: string;
  description: string;
  color: string;
  unlockAt: number;
}

export interface PhotoFoilDef {
  id: PhotoFoilId;
  mark: string;
  name: string;
  description: string;
  colors: readonly [string, string, string];
  unlockAt: number;
}

export const PHOTO_FRAMES: readonly PhotoFrameDef[] = [
  { id: 'oatmeal', name: '오트밀 종이', unlockAt: 0, paper: '#eee0bf', ink: '#4b3627', accent: '#be8d5d' },
  { id: 'leaf', name: '숲길 초록', unlockAt: 1, paper: '#d8dfc5', ink: '#314637', accent: '#758b67' },
  { id: 'apricot', name: '살구빛 골목', unlockAt: 3, paper: '#edc6a9', ink: '#57382d', accent: '#b86f57' },
  { id: 'walnut', name: '호두나무', unlockAt: 5, paper: '#9a704f', ink: '#fff0d0', accent: '#d7ae72' },
  { id: 'ink', name: '밤의 잉크', unlockAt: 8, paper: '#303843', ink: '#e4dcc7', accent: '#8399a2' },
  { id: 'gold', name: '열두 장의 금박', unlockAt: 11, paper: '#e6c879', ink: '#44321f', accent: '#fff0ad' },
] as const;

export const PHOTO_BACKDROPS: readonly PhotoBackdropDef[] = [
  { id: 'alley', name: '연남 골목', description: '벽돌과 작은 간판이 이어지는 오후' },
  { id: 'studio', name: '작업실 커튼', description: '차분한 천과 종이 오브제' },
  { id: 'garden', name: '숲길 정원', description: '나무 그늘과 들꽃이 있는 길' },
  { id: 'room', name: '나의 방', description: '스탠드 불빛이 머무는 저녁' },
  { id: 'stage', name: '골목 무대', description: '공연 직전의 따뜻한 조명' },
  { id: 'night', name: '밤 산책', description: '가게 불빛이 켜진 늦은 골목' },
] as const;

export const PHOTO_POSES: readonly PhotoPoseDef[] = [
  { id: 'hello', name: '반가운 인사', dir: 0, steps: [0, 1, 2, 3] },
  { id: 'side', name: '골목 산책', dir: 1, steps: [1, 2, 3, 2] },
  { id: 'shy', name: '수줍은 시선', dir: 2, steps: [0, 2, 0, 1] },
  { id: 'back', name: '함께 본 풍경', dir: 3, steps: [0, 1, 2, 1] },
] as const;

export const PHOTO_STICKERS: readonly PhotoStickerDef[] = [
  { id: 'heart', mark: '♥', name: '최애 하트', description: '오늘의 최애 장면에 붙이는 진한 마음표', color: '#d9747b', unlockAt: 0 },
  { id: 'star', mark: '★', name: '골목 별', description: '발견한 반짝임을 오래 기억하는 별표', color: '#d6ae58', unlockAt: 0 },
  { id: 'paw', mark: '발', name: '동행 발자국', description: '함께 찍은 작은 친구의 방문 도장', color: '#8b745e', unlockAt: 0 },
  { id: 'home', mark: '집', name: '우리 집', description: '돌아오고 싶은 장면에 붙이는 집 표식', color: '#78917c', unlockAt: 0 },
  { id: 'leaf', mark: '잎', name: '산책 잎사귀', description: '천천히 걸었던 날의 초록 한 조각', color: '#708968', unlockAt: 3 },
  { id: 'camera', mark: '찰', name: '필름 카메라', description: '사진을 세 장 모은 기록가의 카메라', color: '#756a78', unlockAt: 3 },
  { id: 'note', mark: '음', name: '골목 음표', description: '무대와 거리의 소리를 붙잡은 음표', color: '#8a6d91', unlockAt: 3 },
  { id: 'flower', mark: '꽃', name: '노을 꽃', description: '평범한 하루를 화보로 만드는 작은 꽃', color: '#c77f7b', unlockAt: 6 },
  { id: 'cup', mark: '잔', name: '단골 컵', description: '함께 쉬어 간 모퉁이의 따뜻한 컵', color: '#a87757', unlockAt: 6 },
  { id: 'sparkle', mark: '빛', name: '홀로그램 빛', description: '카드 가장자리를 뛰어다니는 픽셀 반짝임', color: '#72a8a5', unlockAt: 6 },
  { id: 'moon', mark: '달', name: '심야 산책 달', description: '아홉 장을 모은 밤 산책자의 달빛', color: '#65728f', unlockAt: 9 },
  { id: 'ribbon', mark: '상', name: '소장 리본', description: '오래 간직할 한 장을 표시하는 전시 리본', color: '#b58b55', unlockAt: 9 },
] as const;

export const PHOTO_FOILS: readonly PhotoFoilDef[] = [
  { id: 'paper', mark: '종', name: '무광 종이', description: '사진의 색을 담백하게 살리는 기본 카드지', colors: ['#e7d5b4', '#c4a77d', '#6b4d36'], unlockAt: 0 },
  { id: 'silver', mark: '은', name: '은빛 필름', description: '세 장을 모으면 열리는 차분한 은박 테두리', colors: ['#e4e1d8', '#9da5a5', '#596467'], unlockAt: 3 },
  { id: 'rainbow', mark: '빛', name: '무지개 홀로', description: '여섯 장의 다른 배경을 비추는 홀로그램', colors: ['#dc91a4', '#88b8b4', '#d4b65f'], unlockAt: 6 },
  { id: 'midnight', mark: '밤', name: '심야 오로라', description: '아홉 장을 모은 수집가의 깊은 밤 포일', colors: ['#343849', '#756080', '#d0af63'], unlockAt: 9 },
] as const;

export const PHOTO_ALBUM_CAPACITY = 12;
export const PHOTO_CAPTION_MAX = 18;
export const PHOTO_CARD_STICKER_MAX = 3;
export const PHOTO_CARD_FEATURED_MAX = 3;

export interface PhotoCompanion {
  speciesId: string;
  accessory: PetAccessoryId;
  name: string | null;
}

export interface PhotoRecord {
  id: string;
  takenAt: string;
  frameId: PhotoFrameId;
  backdropId: PhotoBackdropId;
  poseId: PhotoPoseId;
  caption: string;
  appearance: Appearance;
  nickname: string;
  pet: PhotoCompanion | null;
}

export interface PhotoDraft extends Omit<PhotoRecord, 'id' | 'takenAt'> {}

export interface PhotoAlbumProgress {
  count: number;
  capacity: number;
  totalSaved: number;
  framesUsed: number;
  backdropsUsed: number;
  petPhotos: number;
  decoratedCards: number;
  stickersUsed: number;
  foilsUsed: number;
  featuredCards: number;
  cardEdits: number;
}

export interface PhotoCardDecoration {
  stickerIds: PhotoStickerId[];
  foilId: PhotoFoilId;
}

export interface PhotoAlbumState {
  version: 2;
  records: PhotoRecord[];
  decorations: Record<string, PhotoCardDecoration>;
  featuredIds: string[];
  totalSaved: number;
  editCount: number;
}

const FRAME_IDS = new Set(PHOTO_FRAMES.map((frame) => frame.id));
const BACKDROP_IDS = new Set(PHOTO_BACKDROPS.map((backdrop) => backdrop.id));
const POSE_IDS = new Set(PHOTO_POSES.map((pose) => pose.id));
const STICKER_IDS = new Set<string>(PHOTO_STICKERS.map((sticker) => sticker.id));
const FOIL_IDS = new Set<string>(PHOTO_FOILS.map((foil) => foil.id));

export function sanitizePhotoText(value: unknown, max = PHOTO_CAPTION_MAX): string {
  if (typeof value !== 'string') return '';
  return Array.from(value.normalize('NFKC')
    .replace(/[\t\n\r\f\v]+/g, ' ')
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ').trim())
    .slice(0, max).join('');
}

function cleanRecord(raw: unknown, index: number): PhotoRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PhotoRecord>;
  if (!FRAME_IDS.has(value.frameId as PhotoFrameId)
    || !BACKDROP_IDS.has(value.backdropId as PhotoBackdropId)
    || !POSE_IDS.has(value.poseId as PhotoPoseId)) return null;
  const date = typeof value.takenAt === 'string' && Number.isFinite(Date.parse(value.takenAt))
    ? new Date(value.takenAt).toISOString() : null;
  if (!date) return null;
  const pet = value.pet && typeof value.pet === 'object' && petById(value.pet.speciesId)
    ? {
        speciesId: value.pet.speciesId,
        accessory: isPetAccessoryId(value.pet.accessory) ? value.pet.accessory : 'none' as const,
        name: sanitizePetNickname(value.pet.name),
      }
    : null;
  return {
    id: sanitizePhotoText(value.id, 60) || `legacy-${index}-${date}`,
    takenAt: date,
    frameId: value.frameId as PhotoFrameId,
    backdropId: value.backdropId as PhotoBackdropId,
    poseId: value.poseId as PhotoPoseId,
    caption: sanitizePhotoText(value.caption),
    appearance: normalizeAppearance(value.appearance),
    nickname: sanitizePhotoText(value.nickname, 12) || '마을 주민',
    pet,
  };
}

export function normalizePhotoAlbum(raw: unknown): PhotoAlbumState {
  const records = raw && typeof raw === 'object' && Array.isArray((raw as Partial<PhotoAlbumState>).records)
    ? (raw as Partial<PhotoAlbumState>).records! : [];
  const seen = new Set<string>();
  const clean: PhotoRecord[] = [];
  for (const [index, record] of records.entries()) {
    const next = cleanRecord(record, index);
    if (!next || seen.has(next.id)) continue;
    seen.add(next.id);
    clean.push(next);
    if (clean.length >= PHOTO_ALBUM_CAPACITY) break;
  }
  const recordIds = new Set(clean.map((record) => record.id));
  const decorations: Record<string, PhotoCardDecoration> = {};
  const inputDecorations = raw && typeof raw === 'object' && (raw as Partial<PhotoAlbumState>).decorations
    && typeof (raw as Partial<PhotoAlbumState>).decorations === 'object'
    ? (raw as Partial<PhotoAlbumState>).decorations! : {};
  for (const [recordId, decoration] of Object.entries(inputDecorations)) {
    if (!recordIds.has(recordId) || !decoration || typeof decoration !== 'object') continue;
    const value = decoration as Partial<PhotoCardDecoration>;
    const stickerIds = Array.isArray(value.stickerIds)
      ? [...new Set(value.stickerIds.filter((id): id is PhotoStickerId => typeof id === 'string' && STICKER_IDS.has(id)))].slice(0, PHOTO_CARD_STICKER_MAX)
      : [];
    const foilId = typeof value.foilId === 'string' && FOIL_IDS.has(value.foilId) ? value.foilId as PhotoFoilId : 'paper';
    if (stickerIds.length || foilId !== 'paper') decorations[recordId] = { stickerIds, foilId };
  }
  const featuredIds = raw && typeof raw === 'object' && Array.isArray((raw as Partial<PhotoAlbumState>).featuredIds)
    ? [...new Set((raw as Partial<PhotoAlbumState>).featuredIds!.filter((id): id is string => typeof id === 'string' && recordIds.has(id)))].slice(0, PHOTO_CARD_FEATURED_MAX)
    : [];
  const rawTotalSaved = raw && typeof raw === 'object' ? Number((raw as Partial<PhotoAlbumState>).totalSaved) : 0;
  const rawEditCount = raw && typeof raw === 'object' ? Number((raw as Partial<PhotoAlbumState>).editCount) : 0;
  return {
    version: 2,
    records: clean.sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt)),
    decorations,
    featuredIds,
    totalSaved: Math.max(clean.length, Number.isFinite(rawTotalSaved) ? Math.floor(rawTotalSaved) : 0),
    editCount: Math.max(0, Number.isFinite(rawEditCount) ? Math.floor(rawEditCount) : 0),
  };
}

export function photoFrameUnlocked(frameId: PhotoFrameId, albumCount: number): boolean {
  return (PHOTO_FRAMES.find((frame) => frame.id === frameId)?.unlockAt ?? Number.MAX_SAFE_INTEGER) <= albumCount;
}

export function photoStickerUnlocked(stickerId: PhotoStickerId, totalSaved: number): boolean {
  return (PHOTO_STICKERS.find((sticker) => sticker.id === stickerId)?.unlockAt ?? Number.MAX_SAFE_INTEGER) <= totalSaved;
}

export function photoFoilUnlocked(foilId: PhotoFoilId, totalSaved: number): boolean {
  return (PHOTO_FOILS.find((foil) => foil.id === foilId)?.unlockAt ?? Number.MAX_SAFE_INTEGER) <= totalSaved;
}

export class PhotoAlbumStore {
  private readonly key: string;
  private state: PhotoAlbumState;

  constructor(userId: string) {
    this.key = `hv-photo-album-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 저장소가 막힌 환경은 현재 세션만 유지 */ }
    this.state = normalizePhotoAlbum(raw);
    this.persist();
  }

  records(): PhotoRecord[] { return this.state.records.map((record) => ({ ...record, appearance: { ...record.appearance }, pet: record.pet ? { ...record.pet } : null })); }

  decorationFor(recordId: string): PhotoCardDecoration {
    const decoration = this.state.decorations[recordId];
    return decoration ? { stickerIds: [...decoration.stickerIds], foilId: decoration.foilId } : { stickerIds: [], foilId: 'paper' };
  }

  featuredIds(): string[] { return [...this.state.featuredIds]; }

  progress(): PhotoAlbumProgress {
    return {
      count: this.state.records.length,
      capacity: PHOTO_ALBUM_CAPACITY,
      totalSaved: this.state.totalSaved,
      framesUsed: new Set(this.state.records.map((record) => record.frameId)).size,
      backdropsUsed: new Set(this.state.records.map((record) => record.backdropId)).size,
      petPhotos: this.state.records.filter((record) => record.pet).length,
      decoratedCards: Object.keys(this.state.decorations).length,
      stickersUsed: new Set(Object.values(this.state.decorations).flatMap((item) => item.stickerIds)).size,
      foilsUsed: new Set(Object.values(this.state.decorations).map((item) => item.foilId).filter((id) => id !== 'paper')).size,
      featuredCards: this.state.featuredIds.length,
      cardEdits: this.state.editCount,
    };
  }

  save(draft: PhotoDraft, now = new Date()): { ok: true; record: PhotoRecord } | { ok: false; reason: 'full' | 'locked-frame' } {
    if (this.state.records.length >= PHOTO_ALBUM_CAPACITY) return { ok: false, reason: 'full' };
    if (!photoFrameUnlocked(draft.frameId, this.state.records.length)) return { ok: false, reason: 'locked-frame' };
    const takenAt = now.toISOString();
    const record = cleanRecord({
      ...draft,
      id: `photo-${now.getTime().toString(36)}-${this.state.records.length.toString(36)}`,
      takenAt,
    }, this.state.records.length)!;
    this.state.records.unshift(record);
    this.state.totalSaved += 1;
    this.persist();
    return { ok: true, record: { ...record, appearance: { ...record.appearance }, pet: record.pet ? { ...record.pet } : null } };
  }

  remove(id: string): boolean {
    const next = this.state.records.filter((record) => record.id !== id);
    if (next.length === this.state.records.length) return false;
    this.state.records = next;
    delete this.state.decorations[id];
    this.state.featuredIds = this.state.featuredIds.filter((recordId) => recordId !== id);
    this.persist();
    return true;
  }

  decorate(
    recordId: string,
    stickerIds: Iterable<PhotoStickerId>,
    foilId: PhotoFoilId,
  ): { ok: true; decoration: PhotoCardDecoration } | { ok: false; reason: 'unknown' | 'locked-sticker' | 'locked-foil' } {
    if (!this.state.records.some((record) => record.id === recordId)) return { ok: false, reason: 'unknown' };
    const cleanStickers = [...new Set([...stickerIds].filter((id) => STICKER_IDS.has(id)))].slice(0, PHOTO_CARD_STICKER_MAX);
    if (cleanStickers.some((id) => !photoStickerUnlocked(id, this.state.totalSaved))) return { ok: false, reason: 'locked-sticker' };
    if (!FOIL_IDS.has(foilId) || !photoFoilUnlocked(foilId, this.state.totalSaved)) return { ok: false, reason: 'locked-foil' };
    const decoration = { stickerIds: cleanStickers, foilId };
    if (!decoration.stickerIds.length && decoration.foilId === 'paper') delete this.state.decorations[recordId];
    else this.state.decorations[recordId] = decoration;
    this.state.editCount += 1;
    this.persist();
    return { ok: true, decoration: { stickerIds: [...decoration.stickerIds], foilId: decoration.foilId } };
  }

  toggleFeatured(recordId: string): 'added' | 'removed' | 'full' | 'unknown' {
    if (!this.state.records.some((record) => record.id === recordId)) return 'unknown';
    if (this.state.featuredIds.includes(recordId)) {
      this.state.featuredIds = this.state.featuredIds.filter((id) => id !== recordId);
      this.persist();
      return 'removed';
    }
    if (this.state.featuredIds.length >= PHOTO_CARD_FEATURED_MAX) return 'full';
    this.state.featuredIds.push(recordId);
    this.persist();
    return 'added';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
