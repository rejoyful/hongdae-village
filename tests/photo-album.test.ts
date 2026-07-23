import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_APPEARANCE } from '../src/game/art/appearance';
import {
  PHOTO_ALBUM_CAPACITY, PHOTO_BACKDROPS, PHOTO_CARD_FEATURED_MAX, PHOTO_CARD_STICKER_MAX,
  PHOTO_FOILS, PHOTO_FRAMES, PHOTO_POSES, PHOTO_STICKERS, PhotoAlbumStore,
  normalizePhotoAlbum, photoFoilUnlocked, photoFrameUnlocked, photoStickerUnlocked,
  sanitizePhotoText, type PhotoDraft, type PhotoFrameId,
} from '../src/game/photo/photoAlbum';

class MemStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const draft = (overrides: Partial<PhotoDraft> = {}): PhotoDraft => ({
  frameId: 'oatmeal', backdropId: 'alley', poseId: 'hello', caption: '첫 산책',
  appearance: { ...DEFAULT_APPEARANCE }, nickname: '밤산책자', pet: null,
  ...overrides,
});

describe('픽셀 네컷 필름 앨범', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
  });

  it('6개 프레임·6개 배경·4개 포즈와 12칸 용량을 제공한다', () => {
    expect(PHOTO_FRAMES).toHaveLength(6);
    expect(PHOTO_BACKDROPS).toHaveLength(6);
    expect(PHOTO_POSES).toHaveLength(4);
    expect(PHOTO_ALBUM_CAPACITY).toBe(12);
    expect(new Set(PHOTO_FRAMES.map((item) => item.id)).size).toBe(6);
  });

  it('12종 스티커와 4종 포일을 중복 없는 포토카드 재료로 제공한다', () => {
    expect(PHOTO_STICKERS).toHaveLength(12);
    expect(PHOTO_FOILS).toHaveLength(4);
    expect(new Set(PHOTO_STICKERS.map((item) => item.id)).size).toBe(12);
    expect(new Set(PHOTO_FOILS.map((item) => item.id)).size).toBe(4);
    expect(PHOTO_CARD_STICKER_MAX).toBe(3);
    expect(PHOTO_CARD_FEATURED_MAX).toBe(3);
  });

  it('사진 수에 따라 프레임이 순서대로 열린다', () => {
    expect(photoFrameUnlocked('oatmeal', 0)).toBe(true);
    expect(photoFrameUnlocked('leaf', 0)).toBe(false);
    expect(photoFrameUnlocked('leaf', 1)).toBe(true);
    expect(photoFrameUnlocked('gold', 10)).toBe(false);
    expect(photoFrameUnlocked('gold', 11)).toBe(true);
  });

  it('캡션은 제어문자·과한 공백을 없애고 18자로 제한한다', () => {
    expect(sanitizePhotoText('  오늘\n 정말\t좋았던   골목  ')).toBe('오늘 정말 좋았던 골목');
    expect(Array.from(sanitizePhotoText('가'.repeat(40))).length).toBe(18);
  });

  it('손상된 레코드는 버리고 외형·펫 데이터를 안전하게 정규화한다', () => {
    const state = normalizePhotoAlbum({ records: [
      { id: 'bad', takenAt: 'never', frameId: 'fake', backdropId: 'alley', poseId: 'hello' },
      {
        id: 'safe', takenAt: '2026-07-23T00:00:00.000Z', frameId: 'oatmeal', backdropId: 'room', poseId: 'side',
        caption: '  우리   집  ', appearance: { skin: 999, shirt: 'wrong' }, nickname: '<주민>',
        pet: { speciesId: 'dog', accessory: 'broken', name: ' 멍 멍 ' },
      },
    ] });
    expect(state.records).toHaveLength(1);
    expect(state.records[0]).toMatchObject({ id: 'safe', caption: '우리 집', pet: { speciesId: 'dog', accessory: 'none', name: '멍 멍' } });
    expect(state.records[0]?.appearance).toEqual(DEFAULT_APPEARANCE);
  });

  it('기존 v1 필름 앨범을 사진 손실 없이 v2 포토카드 앨범으로 승격한다', () => {
    const legacy = normalizePhotoAlbum({ version: 1, records: [{
      id: 'legacy-card', takenAt: '2026-07-23T00:00:00.000Z', frameId: 'oatmeal',
      backdropId: 'alley', poseId: 'hello', caption: '첫 필름', appearance: DEFAULT_APPEARANCE,
      nickname: '밤산책자', pet: null,
    }] });
    expect(legacy).toMatchObject({
      version: 2, totalSaved: 1, editCount: 0, decorations: {}, featuredIds: [],
    });
    expect(legacy.records).toHaveLength(1);
    expect(legacy.records[0]).toMatchObject({ id: 'legacy-card', caption: '첫 필름' });
  });

  it('저장 누적 수에 따라 스티커와 포일을 같은 단계로 연다', () => {
    expect(photoStickerUnlocked('heart', 0)).toBe(true);
    expect(photoStickerUnlocked('leaf', 2)).toBe(false);
    expect(photoStickerUnlocked('leaf', 3)).toBe(true);
    expect(photoFoilUnlocked('silver', 2)).toBe(false);
    expect(photoFoilUnlocked('silver', 3)).toBe(true);
    expect(photoFoilUnlocked('midnight', 9)).toBe(true);
  });

  it('현재 외형과 펫을 독립 스냅샷으로 저장한다', () => {
    const store = new PhotoAlbumStore('snapshot');
    const appearance = { ...DEFAULT_APPEARANCE, hair: 3, topStyle: 5 };
    const result = store.save(draft({ appearance, pet: { speciesId: 'dog', accessory: 'ribbon', name: '두부' } }), new Date('2026-07-23T03:00:00Z'));
    expect(result.ok).toBe(true);
    appearance.hair = 0;
    const saved = store.records()[0]!;
    expect(saved.appearance).toMatchObject({ hair: 3, topStyle: 5 });
    expect(saved.pet).toEqual({ speciesId: 'dog', accessory: 'ribbon', name: '두부' });
  });

  it('잠긴 프레임은 저장을 막고 첫 사진 뒤 다음 프레임을 허용한다', () => {
    const store = new PhotoAlbumStore('unlock');
    expect(store.save(draft({ frameId: 'leaf' }))).toEqual({ ok: false, reason: 'locked-frame' });
    expect(store.save(draft()).ok).toBe(true);
    expect(store.save(draft({ frameId: 'leaf' })).ok).toBe(true);
  });

  it('프레임·배경·펫 사진을 수집 진행도로 집계한다', () => {
    const store = new PhotoAlbumStore('progress');
    store.save(draft({ backdropId: 'alley' }), new Date('2026-07-23T01:00:00Z'));
    store.save(draft({ frameId: 'leaf', backdropId: 'garden', pet: { speciesId: 'cat', accessory: 'none', name: null } }), new Date('2026-07-23T02:00:00Z'));
    expect(store.progress()).toEqual({
      count: 2, capacity: 12, totalSaved: 2, framesUsed: 2, backdropsUsed: 2, petPhotos: 1,
      decoratedCards: 0, stickersUsed: 0, foilsUsed: 0, featuredCards: 0, cardEdits: 0,
    });
  });

  it('한 카드에 최대 세 스티커를 저장하고 잠긴 재료는 거부한다', () => {
    const store = new PhotoAlbumStore('decorate');
    const first = store.save(draft(), new Date('2026-07-23T01:00:00Z'));
    if (!first.ok) throw new Error('사진 저장 실패');
    expect(store.decorate(first.record.id, ['leaf'], 'paper')).toEqual({ ok: false, reason: 'locked-sticker' });
    expect(store.decorate(first.record.id, ['heart'], 'silver')).toEqual({ ok: false, reason: 'locked-foil' });
    expect(store.decorate(first.record.id, ['heart', 'star', 'paw', 'home'], 'paper')).toEqual({
      ok: true, decoration: { stickerIds: ['heart', 'star', 'paw'], foilId: 'paper' },
    });
    expect(store.progress()).toMatchObject({ decoratedCards: 1, stickersUsed: 3, cardEdits: 1 });
  });

  it('최애 전시는 세 장까지만 허용하고 사진 삭제 시 장식과 전시를 함께 정리한다', () => {
    const store = new PhotoAlbumStore('featured');
    const ids: string[] = [];
    for (let index = 0; index < 4; index += 1) {
      const result = store.save(draft({ frameId: index === 0 ? 'oatmeal' : 'leaf' }), new Date(1_700_000_000_000 + index * 1_000));
      if (result.ok) ids.push(result.record.id);
    }
    expect(ids).toHaveLength(4);
    expect(ids.slice(0, 3).map((id) => store.toggleFeatured(id))).toEqual(['added', 'added', 'added']);
    expect(store.toggleFeatured(ids[3]!)).toBe('full');
    expect(store.decorate(ids[0]!, ['heart'], 'silver').ok).toBe(true);
    expect(store.remove(ids[0]!)).toBe(true);
    expect(store.featuredIds()).toEqual(ids.slice(1, 3));
    expect(store.decorationFor(ids[0]!)).toEqual({ stickerIds: [], foilId: 'paper' });
    expect(store.progress()).toMatchObject({ count: 3, totalSaved: 4, featuredCards: 2, decoratedCards: 0 });
  });

  it('저장본의 알 수 없는 장식과 사라진 사진 참조를 안전하게 제거한다', () => {
    const record = {
      id: 'safe', takenAt: '2026-07-23T00:00:00.000Z', frameId: 'oatmeal', backdropId: 'room',
      poseId: 'hello', caption: '', appearance: DEFAULT_APPEARANCE, nickname: '주민', pet: null,
    };
    const state = normalizePhotoAlbum({
      records: [record], totalSaved: 9, editCount: 2,
      decorations: {
        safe: { stickerIds: ['heart', 'heart', 'unknown', 'star', 'paw', 'home'], foilId: 'broken' },
        missing: { stickerIds: ['heart'], foilId: 'silver' },
      },
      featuredIds: ['safe', 'missing', 'safe'],
    });
    expect(state.decorations.safe).toEqual({ stickerIds: ['heart', 'star', 'paw'], foilId: 'paper' });
    expect(state.decorations.missing).toBeUndefined();
    expect(state.featuredIds).toEqual(['safe']);
    expect(state).toMatchObject({ totalSaved: 9, editCount: 2 });
  });

  it('12칸이 차면 덮어쓰지 않고 정리를 안내할 수 있게 거부한다', () => {
    const store = new PhotoAlbumStore('capacity');
    for (let index = 0; index < PHOTO_ALBUM_CAPACITY; index += 1) {
      const unlocked = [...PHOTO_FRAMES].reverse().find((frame) => frame.unlockAt <= index)!.id as PhotoFrameId;
      expect(store.save(draft({ frameId: unlocked }), new Date(1_700_000_000_000 + index * 1_000)).ok).toBe(true);
    }
    expect(store.progress().count).toBe(12);
    expect(store.save(draft())).toEqual({ ok: false, reason: 'full' });
    expect(store.remove(store.records()[0]!.id)).toBe(true);
    expect(store.progress().count).toBe(11);
  });
});
