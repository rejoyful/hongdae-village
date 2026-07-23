import { BADGE_BY_ID } from '../achievements';
import { normalizeAppearance, type Appearance } from '../art/appearance';
import { styleIdentityFor, type StyleIdentityId } from '../art/styleIdentity';
import type { QuestState } from '../questProgress';
import { LIFE_SPECIALTY_CARDS } from './lifeSpecialty';
import { lifeSynergyForMasteries } from './lifeSynergies';
import {
  PHOTO_BACKDROPS, PHOTO_FOILS, PHOTO_FRAMES, PHOTO_POSES, PHOTO_STICKERS,
  type PhotoBackdropId, type PhotoFoilId, type PhotoFrameId,
  type PhotoPoseId, type PhotoStickerId,
} from '../photo/photoAlbum';
import { isPetAccessoryId, type PetAccessoryId } from '../pets/petProfiles';
import { petById } from '../pets/pets';
import {
  CHARACTER_ZINE_FEATURED_MAX, normalizeCharacterZineCard, type CharacterZineCard,
} from './characterZine';
import {
  HOME_STUDIO_FEATURED_MAX, normalizeHomeStudioCard, type HomeStudioCard,
} from '../home/homeStudioCards';
import {
  PET_STYLE_FEATURED_MAX, normalizePetStylePublicCard,
  type PetStyleCard, type PetStylePublicCard,
} from '../pets/petStyleStudio';

export interface VillageProfileMottoDef {
  id: string;
  mark: string;
  text: string;
  requiredBadgeId?: string;
}
export interface VillageProfileFrameDef {
  id: string;
  mark: string;
  name: string;
  description: string;
  colors: readonly [string, string, string, string];
  requirement?: { key: string; goal: number; label: string };
}

export interface VillageProfileState {
  version: 1;
  mottoId: string;
  frameId: string;
  showcasedBadgeIds: string[];
  edited: boolean;
}

export interface VillageProfilePublic {
  mottoId: string;
  frameId: string;
  showcasedBadges: string[];
  villageLevel: number;
  tasteSets: number;
  rendezvous: number;
  signatureLooks: VillageProfileSignatureLook[];
  characterCards: VillageProfileCharacterCard[];
  specialtyIds: string[];
  synergyId: string | null;
  photoCards: VillageProfilePhotoCard[];
  homeCards: VillageProfileHomeStudioCard[];
  petStyleCards: PetStylePublicCard[];
}

export interface VillageProfileSignatureLookSource { name: string; appearance: Appearance }
export interface VillageProfileSignatureLook extends VillageProfileSignatureLookSource { styleId: StyleIdentityId }
export type VillageProfileCharacterCard = Omit<CharacterZineCard, 'savedAt'>;
export type VillageProfileHomeStudioCard = Omit<HomeStudioCard, 'savedAt'>;
export interface VillageProfilePhotoCard {
  frameId: PhotoFrameId;
  backdropId: PhotoBackdropId;
  poseId: PhotoPoseId;
  appearance: Appearance;
  pet: { speciesId: string; accessory: PetAccessoryId } | null;
  foilId: PhotoFoilId;
  stickerIds: PhotoStickerId[];
}

export const VILLAGE_PROFILE_BADGE_MAX = 3;
export const VILLAGE_PROFILE_SPECIALTY_MAX = 3;
export const VILLAGE_PROFILE_PHOTO_CARD_MAX = 3;

export const VILLAGE_PROFILE_MOTTOS: readonly VillageProfileMottoDef[] = [
  { id: 'hello', mark: '안', text: '천천히 둘러보는 중이에요.' },
  { id: 'collector', mark: '수', text: '좋아하는 건 끝까지 모아요.' },
  { id: 'stylist', mark: '옷', text: '오늘 코디가 오늘의 기분!' },
  { id: 'homebody', mark: '집', text: '집 구경은 언제나 환영이에요.' },
  { id: 'petfriend', mark: '펫', text: '작은 동행과 골목 산책 중.' },
  { id: 'neighbor', mark: '이', text: '먼저 인사해도 괜찮아요.' },
  { id: 'artisan', mark: '손', text: '고쳐 쓰고 새로 만드는 사람.' },
  { id: 'gardener', mark: '잎', text: '옥상에 오늘의 계절을 심어요.' },
  { id: 'angler', mark: '물', text: '느린 물결을 오래 바라봐요.' },
  { id: 'performer', mark: '음', text: '골목의 소리는 전부 음악이에요.' },
  { id: 'explorer', mark: '길', text: '지도 밖 한 칸을 찾아 걷는 중.' },
  { id: 'archivist', mark: '록', text: '사라지기 전에 기록해 둘게요.' },
  { id: 'path_style', mark: '옷', text: '오늘의 나를 수집하는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_style' },
  { id: 'path_home', mark: '집', text: '살림에 이야기를 담는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_home' },
  { id: 'path_companion', mark: '발', text: '작은 신호를 오래 기억하는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_companion' },
  { id: 'path_neighbor', mark: '이', text: '이름과 약속을 잊지 않는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_neighbor' },
  { id: 'path_maker', mark: '손', text: '심고 낚고 요리하는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_maker' },
  { id: 'path_explorer', mark: '길', text: '기분 따라 다른 길을 걷는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_explorer' },
  { id: 'path_collector', mark: '장', text: '작은 물건의 사연까지 모으는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_collector' },
  { id: 'path_guardian', mark: '숲', text: '싸움보다 관찰을 먼저 남기는 사람이에요.', requiredBadgeId: 'badge_master_adventure_path_guardian' },
] as const;

export const VILLAGE_PROFILE_FRAMES: readonly VillageProfileFrameDef[] = [
  { id: 'kraft', mark: '첫', name: '골목 크라프트', description: '누구에게나 열려 있는 따뜻한 첫 명함.', colors: ['#30231c', '#8b5f3e', '#d7a563', '#f4dfb3'] },
  { id: 'neon', mark: '음', name: '네온 앙코르', description: '버스킹의 밤빛과 앰프 열기를 담은 프레임.', colors: ['#211d39', '#674b8b', '#e36d87', '#ffd485'], requirement: { key: 'q_busking', goal: 3, label: '버스킹 누적 3회' } },
  { id: 'garden', mark: '잎', name: '옥상 온실', description: '직접 키운 잎과 햇살이 둘러싼 프레임.', colors: ['#24372a', '#527256', '#9db36e', '#e7dca7'], requirement: { key: 'garden_species', goal: 6, label: '식물 6종 수확' } },
  { id: 'water', mark: '물', name: '달빛 수로', description: '도심 물결과 은빛 기록을 겹친 프레임.', colors: ['#172d3c', '#356176', '#65a5aa', '#d1e2bd'], requirement: { key: 'fishing_species', goal: 6, label: '물가 생물 6종 발견' } },
  { id: 'film', mark: '컷', name: '네컷 필름', description: '좋아하는 골목 장면을 필름처럼 두른 프레임.', colors: ['#36273f', '#855f86', '#df8a78', '#f2d6a0'], requirement: { key: 'photo_backdrops', goal: 3, label: '사진 배경 3종 기록' } },
  { id: 'artisan', mark: '결', name: '생활 장인의 결', description: '나무와 금속, 손때 묻은 재료의 표정을 담은 프레임.', colors: ['#292b2c', '#62645d', '#b28555', '#e8d1a0'], requirement: { key: 'furniture_reform_combos', goal: 12, label: '리폼 조합 12종 기록' } },
] as const;

export const VILLAGE_PROFILE_MOTTO_BY_ID = new Map(VILLAGE_PROFILE_MOTTOS.map((motto) => [motto.id, motto]));
export const VILLAGE_PROFILE_FRAME_BY_ID = new Map(VILLAGE_PROFILE_FRAMES.map((frame) => [frame.id, frame]));

const count = (quests: QuestState, key: string): number => {
  const value = quests.lifetimeCounts?.[key];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

export function normalizeVillageProfileState(raw: unknown): VillageProfileState {
  const value = (raw ?? {}) as Partial<VillageProfileState>;
  const mottoId = typeof value.mottoId === 'string' && VILLAGE_PROFILE_MOTTO_BY_ID.has(value.mottoId) ? value.mottoId : 'hello';
  const frameId = typeof value.frameId === 'string' && VILLAGE_PROFILE_FRAME_BY_ID.has(value.frameId) ? value.frameId : 'kraft';
  const showcasedBadgeIds = Array.isArray(value.showcasedBadgeIds)
    ? [...new Set(value.showcasedBadgeIds.filter((id): id is string => typeof id === 'string' && BADGE_BY_ID.has(id)))].slice(0, VILLAGE_PROFILE_BADGE_MAX)
    : [];
  return { version: 1, mottoId, frameId, showcasedBadgeIds, edited: value.edited === true };
}

export function villageProfileFrameViews(quests: QuestState) {
  return VILLAGE_PROFILE_FRAMES.map((frame) => {
    const progress = frame.requirement ? count(quests, frame.requirement.key) : 1;
    const goal = frame.requirement?.goal ?? 1;
    return { ...frame, progress: Math.min(progress, goal), goal, unlocked: progress >= goal };
  });
}

export function villageProfileMottoViews(unlockedBadgeIds: Iterable<string>) {
  const unlocked = new Set(unlockedBadgeIds);
  return VILLAGE_PROFILE_MOTTOS.map((motto) => ({
    ...motto,
    unlocked: !motto.requiredBadgeId || unlocked.has(motto.requiredBadgeId),
    requirement: motto.requiredBadgeId ? BADGE_BY_ID.get(motto.requiredBadgeId)?.name ?? '진로 완주 배지' : null,
  }));
}

export function normalizeVillageProfilePublic(raw: unknown): VillageProfilePublic | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<VillageProfilePublic>;
  const mottoId = typeof value.mottoId === 'string' && VILLAGE_PROFILE_MOTTO_BY_ID.has(value.mottoId) ? value.mottoId : 'hello';
  const frameId = typeof value.frameId === 'string' && VILLAGE_PROFILE_FRAME_BY_ID.has(value.frameId) ? value.frameId : 'kraft';
  const showcasedBadges = Array.isArray(value.showcasedBadges)
    ? [...new Set(value.showcasedBadges.filter((name): name is string => typeof name === 'string')
      .map((name) => name.replace(/\s+/g, ' ').trim().slice(0, 24)).filter(Boolean))].slice(0, VILLAGE_PROFILE_BADGE_MAX)
    : [];
  const metric = (input: unknown, max: number) => typeof input === 'number' && Number.isFinite(input)
    ? Math.max(0, Math.min(max, Math.floor(input))) : 0;
  const signatureLooks = Array.isArray(value.signatureLooks) ? value.signatureLooks.slice(0, 3).flatMap((rawLook) => {
    if (!rawLook || typeof rawLook !== 'object') return [];
    const look = rawLook as Partial<VillageProfileSignatureLook>;
    if (!look.appearance || typeof look.appearance !== 'object') return [];
    const appearance = normalizeAppearance(look.appearance);
    const name = typeof look.name === 'string' ? look.name.replace(/[<>\n\r]/g, '').trim().slice(0, 12) : '';
    return [{ name: name || '이름 없는 코디', appearance, styleId: styleIdentityFor(appearance).id }];
  }) : [];
  const characterCards = Array.isArray(value.characterCards)
    ? value.characterCards.slice(0, CHARACTER_ZINE_FEATURED_MAX)
      .flatMap((rawCard, index) => {
        const card = normalizeCharacterZineCard(rawCard, `캐릭터 ${index + 1}`);
        return card ? [{
          name: card.name,
          appearance: card.appearance,
          roleId: card.roleId,
          motifId: card.motifId,
          direction: card.direction,
        }] : [];
      })
    : [];
  const specialtyIds = Array.isArray(value.specialtyIds)
    ? [...new Set(value.specialtyIds.filter((id): id is string => typeof id === 'string'
      && LIFE_SPECIALTY_CARDS.some((card) => card.id === id)))].slice(0, VILLAGE_PROFILE_SPECIALTY_MAX)
    : [];
  const specialtyDomains = specialtyIds.flatMap((id) => {
    const card = LIFE_SPECIALTY_CARDS.find((item) => item.id === id);
    return card ? [card.masteryId] : [];
  });
  const synergyId = lifeSynergyForMasteries(specialtyDomains)?.id ?? null;
  const frameIds = new Set(PHOTO_FRAMES.map((item) => item.id));
  const backdropIds = new Set(PHOTO_BACKDROPS.map((item) => item.id));
  const poseIds = new Set(PHOTO_POSES.map((item) => item.id));
  const foilIds = new Set(PHOTO_FOILS.map((item) => item.id));
  const stickerIds = new Set(PHOTO_STICKERS.map((item) => item.id));
  const photoCards = Array.isArray(value.photoCards) ? value.photoCards.slice(0, VILLAGE_PROFILE_PHOTO_CARD_MAX).flatMap((rawCard) => {
    if (!rawCard || typeof rawCard !== 'object') return [];
    const card = rawCard as Partial<VillageProfilePhotoCard>;
    if (!frameIds.has(card.frameId as PhotoFrameId) || !backdropIds.has(card.backdropId as PhotoBackdropId)
      || !poseIds.has(card.poseId as PhotoPoseId)) return [];
    const pet = card.pet && typeof card.pet === 'object' && petById(card.pet.speciesId)
      ? { speciesId: card.pet.speciesId, accessory: isPetAccessoryId(card.pet.accessory) ? card.pet.accessory : 'none' as const }
      : null;
    return [{
      frameId: card.frameId as PhotoFrameId,
      backdropId: card.backdropId as PhotoBackdropId,
      poseId: card.poseId as PhotoPoseId,
      appearance: normalizeAppearance(card.appearance),
      pet,
      foilId: foilIds.has(card.foilId as PhotoFoilId) ? card.foilId as PhotoFoilId : 'paper',
      stickerIds: Array.isArray(card.stickerIds)
        ? [...new Set(card.stickerIds.filter((id): id is PhotoStickerId => typeof id === 'string' && stickerIds.has(id)))].slice(0, 3)
        : [],
    }];
  }) : [];
  const homeCards = Array.isArray(value.homeCards)
    ? value.homeCards.slice(0, HOME_STUDIO_FEATURED_MAX).flatMap((rawCard) => {
      const card = normalizeHomeStudioCard(rawCard);
      if (!card) return [];
      return [{
        moodId: card.moodId,
        appearance: card.appearance,
        pet: card.pet,
        houseType: card.houseType,
        themeId: card.themeId,
        themeName: card.themeName,
        score: card.score,
        placements: card.placements,
      }];
    })
    : [];
  const petStyleCards = Array.isArray(value.petStyleCards)
    ? value.petStyleCards.slice(0, PET_STYLE_FEATURED_MAX).flatMap((rawCard) => {
      const card = normalizePetStylePublicCard(rawCard);
      return card ? [card] : [];
    })
    : [];
  return {
    mottoId, frameId, showcasedBadges,
    villageLevel: Math.max(1, metric(value.villageLevel, 50)),
    tasteSets: metric(value.tasteSets, 28), rendezvous: metric(value.rendezvous, 30), signatureLooks,
    characterCards, specialtyIds, synergyId, photoCards, homeCards, petStyleCards,
  };
}

export function villageProfilePublic(
  state: VillageProfileState, villageLevel: number, tasteSets: number, rendezvous: number,
  signatureLooks: readonly VillageProfileSignatureLookSource[] = [],
  specialtyIds: readonly string[] = [], photoCards: readonly VillageProfilePhotoCard[] = [],
  characterCards: readonly CharacterZineCard[] = [],
  homeCards: readonly HomeStudioCard[] = [],
  petStyleCards: readonly PetStyleCard[] = [],
): VillageProfilePublic {
  return normalizeVillageProfilePublic({
    mottoId: state.mottoId,
    frameId: state.frameId,
    showcasedBadges: state.showcasedBadgeIds.map((id) => BADGE_BY_ID.get(id)?.name).filter((name): name is string => !!name),
    villageLevel, tasteSets, rendezvous, signatureLooks, specialtyIds, photoCards, characterCards, homeCards, petStyleCards,
  })!;
}

export type VillageProfileBadgeResult = 'added' | 'removed' | 'locked' | 'full' | 'unknown';

export class VillageProfileStore {
  private state: VillageProfileState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-village-profile-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeVillageProfileState(raw); this.persist();
  }

  get(): VillageProfileState { return this.state; }

  setMotto(id: string, unlockedBadgeIds: Iterable<string> = []): boolean {
    const motto = VILLAGE_PROFILE_MOTTO_BY_ID.get(id);
    if (!motto || (motto.requiredBadgeId && !new Set(unlockedBadgeIds).has(motto.requiredBadgeId))
      || this.state.mottoId === id) return false;
    this.state = { ...this.state, mottoId: id, edited: true }; this.persist(); return true;
  }

  setFrame(id: string, quests: QuestState): boolean {
    const view = villageProfileFrameViews(quests).find((frame) => frame.id === id);
    if (!view?.unlocked || this.state.frameId === id) return false;
    this.state = { ...this.state, frameId: id, edited: true }; this.persist(); return true;
  }

  toggleBadge(id: string, unlockedBadgeIds: Iterable<string>): VillageProfileBadgeResult {
    if (!BADGE_BY_ID.has(id)) return 'unknown';
    const index = this.state.showcasedBadgeIds.indexOf(id);
    if (index >= 0) {
      this.state = { ...this.state, showcasedBadgeIds: this.state.showcasedBadgeIds.filter((badgeId) => badgeId !== id), edited: true };
      this.persist(); return 'removed';
    }
    if (!new Set(unlockedBadgeIds).has(id)) return 'locked';
    if (this.state.showcasedBadgeIds.length >= VILLAGE_PROFILE_BADGE_MAX) return 'full';
    this.state = { ...this.state, showcasedBadgeIds: [...this.state.showcasedBadgeIds, id], edited: true };
    this.persist(); return 'added';
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
