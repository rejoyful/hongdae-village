import { BADGE_BY_ID, type BadgeRarity } from '../game/achievements';
import { CHAR_H, CHAR_W, paintCharacterFrame } from '../game/art/characterArt';
import { STYLE_IDENTITY_BY_ID, stylePaletteFor } from '../game/art/styleIdentity';
import { paintVillageProfileCard } from '../game/art/villageProfileArt';
import { LIFE_SPECIALTY_ART_H, LIFE_SPECIALTY_ART_W, paintLifeSpecialtyArt } from '../game/art/lifeSpecialtyArt';
import { LIFE_SYNERGY_ART_H, LIFE_SYNERGY_ART_W, paintLifeSynergyArt } from '../game/art/lifeSynergyArt';
import { LIFE_SPECIALTY_CARDS } from '../game/progression/lifeSpecialty';
import { LIFE_SYNERGY_BY_ID } from '../game/progression/lifeSynergies';
import { PHOTO_CARD_H, PHOTO_CARD_W, renderPhotoCard } from '../game/art/photoArt';
import type { PhotoRecord } from '../game/photo/photoAlbum';
import { PHOTO_BACKDROPS } from '../game/photo/photoAlbum';
import type { QuestState } from '../game/questProgress';
import type { PeerState } from '../net/NetworkAdapter';
import type { NeighborCheerKind, PetMeetKind } from '../net/protocol';
import {
  NEIGHBOR_CHEERS, NEIGHBOR_CHEER_BY_ID, NeighborCheerStore, type NeighborCheerProgress,
} from '../game/social/neighborCheers';
import {
  NEIGHBOR_CHEER_ART_H, NEIGHBOR_CHEER_ART_W, paintNeighborCheerArt,
} from '../game/art/neighborCheerArt';
import {
  NeighborHomeTourStore, type NeighborHomeTourProgress,
} from '../game/home/neighborHomeTours';
import { HOME_GRADES, HOME_THEMES, STARTER_THEME } from '../game/home/homeDesign';
import { HOUSE_SPECS } from '../game/realestate/realEstate';
import {
  NEIGHBOR_HOME_TOUR_ART_H, NEIGHBOR_HOME_TOUR_ART_W, paintNeighborHomeTourArt,
} from '../game/art/neighborHomeTourArt';
import {
  VILLAGE_PROFILE_FRAME_BY_ID, VILLAGE_PROFILE_MOTTO_BY_ID,
  VillageProfileStore, normalizeVillageProfilePublic, villageProfileFrameViews, villageProfileMottoViews, villageProfilePublic,
  type VillageProfilePublic,
  type VillageProfilePhotoCard,
} from '../game/progression/villageProfile';
import {
  CHARACTER_ZINE_MOTIFS, CHARACTER_ZINE_ROLES, type CharacterZineCard,
} from '../game/progression/characterZine';
import {
  CHARACTER_ZINE_ART_H, CHARACTER_ZINE_ART_W, paintCharacterZineArt,
} from '../game/art/characterZineArt';
import {
  HOME_STUDIO_CARD_H, HOME_STUDIO_CARD_W, paintHomeStudioCard,
} from '../game/art/homeStudioCardArt';
import {
  HOME_STUDIO_MOOD_BY_ID, type HomeStudioCard,
} from '../game/home/homeStudioCards';
import {
  PET_STYLE_BACKDROPS, PET_STYLE_POSES, type PetStyleCard,
} from '../game/pets/petStyleStudio';
import { PET_PERSONALITIES } from '../game/pets/petProfiles';
import { petById } from '../game/pets/pets';
import {
  PET_STYLE_ART_H, PET_STYLE_ART_W, paintPetStyleCard,
} from '../game/art/petStyleStudioArt';
import {
  PET_MEET_SCENES, PetMeetPostcardStore, type PetMeetProgress,
} from '../game/social/petMeetPostcards';
import {
  PET_MEET_ART_H, PET_MEET_ART_W, paintPetMeetPostcard,
} from '../game/art/petMeetPostcardArt';

export interface VillageProfileSelfContext {
  peer: PeerState;
  quests: QuestState;
  unlockedBadgeIds: string[];
  villageLevel: number;
  signatureLooks: Array<{ name: string; appearance: PeerState['appearance'] }>;
  characterCards: CharacterZineCard[];
  tasteSets: number;
  rendezvous: number;
  residentsMet: number;
  petsOwned: number;
  homeLabel: string;
  specialtyIds: string[];
  photoCards: VillageProfilePhotoCard[];
  homeCards: HomeStudioCard[];
  petStyleCards: PetStyleCard[];
}

interface VillageProfilePanelOptions {
  onToggle: (open: boolean) => void;
  getSelfContext: () => VillageProfileSelfContext;
  onChanged: (profile: VillageProfilePublic) => void;
  onOpenAtelier?: () => void;
  onOpenCharacterZine?: () => void;
  onOpenSpecialties?: () => void;
  onOpenPhotoBooth?: () => void;
  onOpenPetStyleStudio?: () => void;
  onViewPetStyleCards?: (peer: PeerState) => void;
  online: boolean;
  onSendNeighborCheer?: (peer: PeerState, kind: NeighborCheerKind) => boolean;
  onNeighborCheerChanged?: (progress: NeighborCheerProgress) => void;
  onSendPetMeet?: (peer: PeerState, kind: PetMeetKind) => boolean;
  onPetMeetChanged?: (progress: PetMeetProgress) => void;
  onVisitNeighborHome?: (peer: PeerState) => Promise<'entered' | 'no-home' | 'private' | 'offline' | 'error'>;
  onNeighborHomeTourChanged?: (progress: NeighborHomeTourProgress) => void;
}

const RARITY_LABEL: Record<BadgeRarity, string> = { common: '첫걸음', uncommon: '이야기', rare: '수집', epic: '숙련' };
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

/** 캐릭터 외형과 수집 기록을 다른 플레이어에게 보여 주는 안전한 공개 명함. */
export class VillageProfilePanel {
  private readonly root: HTMLDivElement;
  private readonly store: VillageProfileStore;
  private opened = false;
  private remotePeer: PeerState | null = null;
  private notice = '';
  private cheerNotice = '';
  private readonly neighborCheers: NeighborCheerStore;
  private readonly homeTours: NeighborHomeTourStore;
  private readonly petMeets: PetMeetPostcardStore;
  private tourNotice = '';
  private tourLoading = false;
  private petMeetNotice = '';

  constructor(userId: string, private readonly opts: VillageProfilePanelOptions) {
    this.store = new VillageProfileStore(userId);
    this.neighborCheers = new NeighborCheerStore(userId);
    this.homeTours = new NeighborHomeTourStore(userId);
    this.petMeets = new PetMeetPostcardStore(userId);
    this.root = document.createElement('div'); this.root.className = 'hv-profile-modal'; this.root.style.display = 'none';
    document.body.appendChild(this.root); this.root.addEventListener('keydown', (event) => event.stopPropagation());
  }

  get isOpen(): boolean { return this.opened; }

  openSelf(): void { this.remotePeer = null; this.open(); }
  openPeer(peer: PeerState): void {
    this.remotePeer = peer; this.cheerNotice = ''; this.tourNotice = ''; this.petMeetNotice = '';
    if ((normalizeVillageProfilePublic(peer.profile)?.petStyleCards.length ?? 0) > 0) {
      this.opts.onViewPetStyleCards?.(peer);
    }
    this.open();
  }

  neighborCheerProgress(): NeighborCheerProgress { return this.neighborCheers.progress(); }
  neighborHomeTourProgress(): NeighborHomeTourProgress { return this.homeTours.progress(); }
  petMeetProgress(): PetMeetProgress { return this.petMeets.progress(); }
  receiveNeighborCheer(peer: PeerState, kind: NeighborCheerKind): boolean {
    const result = this.neighborCheers.receive(peer.userId, peer.nickname, kind);
    if (result !== 'received') return false;
    const cheer = NEIGHBOR_CHEER_BY_ID.get(kind);
    this.cheerNotice = `${peer.nickname}님에게서 「${cheer?.name ?? '이웃 응원'}」 우편이 도착했어요.`;
    this.opts.onNeighborCheerChanged?.(this.neighborCheers.progress());
    if (this.opened) this.render();
    return true;
  }

  receivePetMeet(peer: PeerState, kind: PetMeetKind): boolean {
    const myPet = this.publicSnapshot().petStyleCards[0];
    const neighborPet = normalizeVillageProfilePublic(peer.profile)?.petStyleCards[0];
    const result = this.petMeets.receive(peer.userId, peer.nickname, kind, myPet, neighborPet);
    if (result !== 'received') return false;
    const scene = PET_MEET_SCENES.find((item) => item.id === kind);
    this.petMeetNotice = `${peer.nickname}님의 동행과 「${scene?.name ?? '작은 만남'}」 엽서를 남겼어요.`;
    this.opts.onPetMeetChanged?.(this.petMeets.progress());
    if (this.opened) this.render();
    return true;
  }

  publicSnapshot(): VillageProfilePublic {
    const context = this.opts.getSelfContext();
    return villageProfilePublic(
      this.store.get(), context.villageLevel, context.tasteSets, context.rendezvous,
      context.signatureLooks, context.specialtyIds, context.photoCards, context.characterCards, context.homeCards,
      context.petStyleCards,
    );
  }

  progress(): { customized: number; badges: number; frames: number; specialties: number; photoCards: number; petStyleCards: number; showcaseSlots: number; showcaseComplete: number } {
    const context = this.opts.getSelfContext();
    const profile = this.publicSnapshot();
    const specialties = profile.specialtyIds.length;
    const photoCards = profile.photoCards.length;
    const badges = this.store.get().showcasedBadgeIds.length;
    const looks = profile.signatureLooks.length;
    return {
      customized: Number(this.store.get().edited),
      badges,
      frames: villageProfileFrameViews(context.quests).filter((frame) => frame.unlocked).length,
      specialties, photoCards, petStyleCards: profile.petStyleCards.length, showcaseSlots: specialties + photoCards,
      showcaseComplete: Number(badges >= 3 && looks >= 3 && specialties >= 3 && photoCards >= 3),
    };
  }

  private open(): void {
    if (!this.opened) { this.opened = true; this.root.style.display = 'flex'; this.opts.onToggle(true); }
    this.render();
  }

  private selfCardHtml(context: VillageProfileSelfContext, profile: VillageProfilePublic): string {
    const motto = VILLAGE_PROFILE_MOTTO_BY_ID.get(profile.mottoId)!;
    const badges = profile.showcasedBadges.length ? profile.showcasedBadges : ['아직 고르지 않은 대표 배지'];
    return `<div class="vprofile-card-copy">
      <small>HONGDAE VILLAGE ID · ${profile.frameId.toUpperCase()}</small>
      <h2>${escapeHtml(context.peer.nickname)}</h2>
      <p>“${escapeHtml(motto.text)}”</p>
      <div class="vprofile-badges">${badges.map((badge) => `<span>◆ ${escapeHtml(badge)}</span>`).join('')}</div>
      <div class="vprofile-stats"><span><b>${profile.villageLevel}</b>마을 레벨</span><span><b>${profile.tasteSets}/22</b>취향 세트</span><span><b>${profile.rendezvous}/30</b>주민 약속</span></div>
      <div class="vprofile-life"><span>이웃 ${context.residentsMet}/10</span><span>동행 ${context.petsOwned}/11</span><span>${escapeHtml(context.homeLabel)}</span>${profile.synergyId ? `<span>생활 시너지 · ${escapeHtml(LIFE_SYNERGY_BY_ID.get(profile.synergyId)?.title ?? '세 갈래 취향')}</span>` : ''}</div>
    </div>`;
  }

  private remoteCardHtml(peer: PeerState, profile: VillageProfilePublic): string {
    const motto = VILLAGE_PROFILE_MOTTO_BY_ID.get(profile.mottoId)!;
    const badges = profile.showcasedBadges.length ? profile.showcasedBadges : [peer.badge ?? '대표 배지를 준비 중'];
    return `<div class="vprofile-card-copy">
      <small>NEIGHBOR VILLAGE ID · ${profile.frameId.toUpperCase()}</small>
      <h2>${escapeHtml(peer.nickname)}</h2>
      <p>“${escapeHtml(motto.text)}”</p>
      <div class="vprofile-badges">${badges.map((badge) => `<span>◆ ${escapeHtml(badge)}</span>`).join('')}</div>
      <div class="vprofile-stats"><span><b>${profile.villageLevel}</b>마을 레벨</span><span><b>${profile.tasteSets}/22</b>취향 세트</span><span><b>${profile.rendezvous}/30</b>주민 약속</span></div>
      <div class="vprofile-life"><span>현재 동행 ${peer.petName ? escapeHtml(peer.petName) : peer.pet ? '함께 걷는 중' : '쉬는 중'}</span><span>${peer.badge ? `장착 · ${escapeHtml(peer.badge)}` : '배지 없음'}</span>${profile.synergyId ? `<span>생활 시너지 · ${escapeHtml(LIFE_SYNERGY_BY_ID.get(profile.synergyId)?.title ?? '세 갈래 취향')}</span>` : ''}</div>
    </div>`;
  }

  private signatureGalleryHtml(profile: VillageProfilePublic, self: boolean): string {
    const looks = profile.signatureLooks;
    const cards = looks.map((look, index) => {
      const identity = STYLE_IDENTITY_BY_ID.get(look.styleId)!;
      const palette = stylePaletteFor(look.appearance);
      return `<article style="--signature-color:${identity.color}">
        <div class="vprofile-look-art"><canvas width="${CHAR_W}" height="${CHAR_H}" data-profile-look="${index}" aria-label="${escapeHtml(look.name)} 픽셀 코디"></canvas><i>${escapeHtml(identity.mark)}</i></div>
        <div><small>SIGNATURE ${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(look.name)}</h3><b>${escapeHtml(identity.name)}</b><p>${escapeHtml(identity.description)}</p><span>${palette.map((color) => `<i style="background:#${color}"></i>`).join('')}</span></div>
      </article>`;
    }).join('');
    return `<section class="vprofile-signature"><header><div><small>PIXEL LOOK SHOWCASE</small><h2>대표 코디 전시</h2></div><span>${looks.length}/3 · 능력치 없는 순수 자기소개</span></header>
      ${looks.length ? `<div>${cards}</div>` : `<div class="vprofile-signature-empty"><i>옷</i><p><b>아직 대표 코디가 비어 있어요.</b><span>좋아하는 모습 한 벌부터 골라도 충분해요. 아틀리에 옷장에서 언제든 바꿀 수 있습니다.</span></p>${self ? '<button data-profile-open-atelier>대표 코디 고르기</button>' : ''}</div>`}
    </section>`;
  }

  private characterZineGalleryHtml(profile: VillageProfilePublic, self: boolean): string {
    const cards = profile.characterCards.map((card, index) => {
      const role = CHARACTER_ZINE_ROLES.find((item) => item.id === card.roleId) ?? CHARACTER_ZINE_ROLES[0];
      const motif = CHARACTER_ZINE_MOTIFS.find((item) => item.id === card.motifId) ?? CHARACTER_ZINE_MOTIFS[0];
      return `<article style="--character-deep:${role.palette[0]};--character-accent:${role.palette[2]};--character-paper:${role.palette[3]}">
        <canvas width="${CHARACTER_ZINE_ART_W}" height="${CHARACTER_ZINE_ART_H}" data-profile-character="${index}" aria-label="${escapeHtml(card.name)} 픽셀 캐릭터 설정 카드"></canvas>
        <div><small>ORIGINAL CHARACTER ${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(card.name)}</h3><b>${escapeHtml(role.name)}</b><p>${escapeHtml(role.blurb)}</p><span><i>${motif.mark}</i>${escapeHtml(motif.name)} · ${escapeHtml(motif.blurb)}</span></div>
      </article>`;
    }).join('');
    return `<section class="vprofile-character-zine">
      <header><div><small>ORIGINAL CHARACTER ZINE</small><h2>나의 골목 캐릭터 설정집</h2></div><span>${profile.characterCards.length}/3 · 직접 고른 대표 OC만 공개</span></header>
      ${cards ? `<div class="vprofile-character-grid">${cards}</div>` : `<div class="vprofile-character-empty"><i>OC</i><p><b>아직 공개한 캐릭터 설정이 없어요.</b><span>현재 모습에서 시작해 역할과 상징이 다른 인물을 여섯 명까지 만들 수 있어요.</span></p>${self ? '<button data-profile-open-zine>설정집 만들기</button>' : ''}</div>`}
    </section>`;
  }

  private collectionShowcaseHtml(profile: VillageProfilePublic, self: boolean): string {
    const specialties = profile.specialtyIds.flatMap((id) => {
      const card = LIFE_SPECIALTY_CARDS.find((item) => item.id === id);
      return card ? [card] : [];
    });
    const specialtyCards = specialties.map((card) => `<article class="vprofile-specialty-card" style="--profile-specialty:${card.palette[1]}">
      <canvas width="${LIFE_SPECIALTY_ART_W}" height="${LIFE_SPECIALTY_ART_H}" data-profile-specialty="${card.id}" aria-label="${escapeHtml(card.title)} 픽셀 전문성 카드"></canvas>
      <span><small>${escapeHtml(card.mark)} · TIER ${card.tier}</small><b>${escapeHtml(card.title)}</b><em>${escapeHtml(card.keepsake)}</em></span></article>`).join('');
    const synergy = profile.synergyId ? LIFE_SYNERGY_BY_ID.get(profile.synergyId) ?? null : null;
    const synergyCard = synergy ? `<article class="vprofile-synergy" style="--profile-synergy:${synergy.palette[1]};--profile-synergy-deep:${synergy.palette[2]}">
      <canvas width="${LIFE_SYNERGY_ART_W}" height="${LIFE_SYNERGY_ART_H}" data-profile-synergy="${synergy.id}" aria-label="${escapeHtml(synergy.title)} 픽셀 시너지 카드"></canvas>
      <span><small>CURRENT LIFE SYNERGY · 능력치 보너스 없음</small><h3>${escapeHtml(synergy.title)}</h3><b>${escapeHtml(synergy.epithet)}</b><p>${escapeHtml(synergy.description)}</p><em>${escapeHtml(synergy.keepsake)}</em></span>
    </article>` : '';
    const photoCards = profile.photoCards.map((card, index) => {
      const backdrop = PHOTO_BACKDROPS.find((item) => item.id === card.backdropId)?.name ?? '홍대마을';
      return `<article class="vprofile-photo-card">
        <canvas width="${PHOTO_CARD_W}" height="${PHOTO_CARD_H}" data-profile-photo="${index}" aria-label="${escapeHtml(backdrop)} 최애 포토카드"></canvas>
        <span><small>FAVORITE ${String(index + 1).padStart(2, '0')}</small><b>${escapeHtml(backdrop)}의 최애 장면</b><em>${card.stickerIds.length}개 픽셀 스티커 · ${escapeHtml(card.foilId.toUpperCase())}</em></span></article>`;
    }).join('');
    return `<section class="vprofile-collection-showcase">
      <header><div><small>FAVORITE LIFE DECK</small><h2>생활 전문성과 최애 포토카드</h2></div><span>${specialties.length + profile.photoCards.length}/6 공개 슬롯 · 선택한 게임 기록만 표시</span></header>
      ${synergyCard}
      <div class="vprofile-showcase-columns">
        <section><header><b>대표 생활 전문성</b><span>${specialties.length}/3</span></header>${specialties.length ? `<div>${specialtyCards}</div>` : `<div class="vprofile-showcase-empty"><i>숙</i><p><b>대표 전문성이 비어 있어요.</b><span>좋아하는 생활 자격부터 한 장 골라 보세요.</span></p>${self ? '<button data-profile-open-specialties>전문성 고르기</button>' : ''}</div>`}</section>
        <section><header><b>최애 포토카드</b><span>${profile.photoCards.length}/3</span></header>${profile.photoCards.length ? `<div class="vprofile-photo-grid">${photoCards}</div>` : `<div class="vprofile-showcase-empty"><i>컷</i><p><b>공개한 최애 장면이 없어요.</b><span>포토카드에서 마음에 든 장면을 전시해 보세요.</span></p>${self ? '<button data-profile-open-photo>포토카드 고르기</button>' : ''}</div>`}</section>
      </div>
    </section>`;
  }

  private homeStudioGalleryHtml(profile: VillageProfilePublic, self: boolean): string {
    const cards = profile.homeCards.map((card, index) => {
      const mood = HOME_STUDIO_MOOD_BY_ID.get(card.moodId) ?? HOME_STUDIO_MOOD_BY_ID.get('everyday')!;
      return `<article style="--home-card:${mood.palette[2]};--home-card-deep:${mood.palette[0]}">
        <canvas width="${HOME_STUDIO_CARD_W}" height="${HOME_STUDIO_CARD_H}" data-profile-home="${index}" aria-label="${escapeHtml(mood.title)} 대표 홈 스튜디오 엽서"></canvas>
        <div><small>HOME SCENE ${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(mood.title)}</h3><b>${escapeHtml(card.themeName)} · 가구 ${card.placements.length}점</b><p>${escapeHtml(mood.subtitle)}</p></div>
      </article>`;
    }).join('');
    return `<section class="vprofile-home-studio">
      <header><div><small>CURATED 2.5D HOME POSTCARDS</small><h2>나의 홈 스튜디오 엽서</h2></div><span>${profile.homeCards.length}/3 · 직접 고른 방 장면만 공개</span></header>
      ${cards ? `<div class="vprofile-home-studio-grid">${cards}</div>` : `<div class="vprofile-home-studio-empty"><i>집</i><p><b>아직 대표 홈 엽서가 없어요.</b><span>${self ? '내 집 꾸미기의 홈 스튜디오에서 지금 모습과 가구 배치를 한 장으로 남길 수 있어요.' : '이 이웃은 아직 공개할 홈 장면을 고르지 않았어요.'}</span></p></div>`}
    </section>`;
  }

  private petStyleGalleryHtml(profile: VillageProfilePublic, self: boolean): string {
    const cards = profile.petStyleCards.map((card, index) => {
      const species = petById(card.petId)!;
      const personality = PET_PERSONALITIES.find((item) => item.id === card.personalityId)!;
      const backdrop = PET_STYLE_BACKDROPS.find((item) => item.id === card.backdropId)!;
      const pose = PET_STYLE_POSES.find((item) => item.id === card.poseId)!;
      return `<article style="--pet-profile-card:${backdrop.colors[2]};--pet-profile-deep:${backdrop.colors[0]}">
        <canvas width="${PET_STYLE_ART_W}" height="${PET_STYLE_ART_H}" data-profile-pet-style="${index}" aria-label="${escapeHtml(species.name)} 대표 동행 코디 카드"></canvas>
        <div><small>COMPANION CARD ${String(index + 1).padStart(2, '0')}</small><h3>${escapeHtml(species.name)} · ${escapeHtml(personality.name)}</h3><b>${escapeHtml(backdrop.name)} · ${escapeHtml(pose.name)}</b><p>별명과 저장 시각 없이 직접 고른 동행 코디만 공개해요.</p></div>
      </article>`;
    }).join('');
    return `<section class="vprofile-pet-style">
      <header><div><small>CURATED COMPANION STYLE CARDS</small><h2>나의 대표 동행 코디</h2></div><span>${profile.petStyleCards.length}/3 · 종·성격·장식·장면만 안전하게 공개</span></header>
      ${cards ? `<div class="vprofile-pet-style-grid">${cards}</div>` : `<div class="vprofile-pet-style-empty"><i>펫</i><p><b>아직 대표 동행 카드가 비어 있어요.</b><span>${self ? '동행 코디 카드 아틀리에에서 좋아하는 장면 한 장부터 대표로 골라 보세요.' : '이 이웃은 아직 공개할 동행 코디를 고르지 않았어요.'}</span></p>${self ? '<button data-profile-open-pet-style>대표 동행 카드 고르기</button>' : ''}</div>`}
    </section>`;
  }

  private petMeetHtml(peer: PeerState, profile: VillageProfilePublic, self: boolean): string {
    const progress = this.petMeets.progress();
    if (!self) {
      const myPet = this.publicSnapshot().petStyleCards[0];
      const neighborPet = profile.petStyleCards[0];
      const canSendToday = this.petMeets.canSendTo(peer.userId);
      const hasPair = !!myPet && !!neighborPet;
      const enabled = this.opts.online && canSendToday && hasPair;
      const footer = this.petMeetNotice
        ? this.petMeetNotice
        : !hasPair
          ? '두 명함에 대표 동행 카드가 한 장씩 있어야 함께 찍을 수 있어요. 누구도 불이익을 받지 않습니다.'
          : !this.opts.online
            ? '온라인에서 만난 이웃에게만 보낼 수 있어요. 혼자 모드의 기록은 그대로 유지됩니다.'
            : canSendToday
              ? `${escapeHtml(peer.nickname)}님의 동행과 남기고 싶은 장면 하나를 골라 주세요.`
              : '오늘의 두 발자국은 이미 남겼어요. 내일 다른 장면을 골라도 연속 보상은 없습니다.';
      return `<section class="vprofile-pet-meet-send">
        <header><div><small>SAFE COMPANION MEET · ONE A DAY</small><h2>동행끼리 인사 엽서 남기기</h2><p>서로의 대표 동행 두 마리와 프리셋 장면만 합성해요. 자유문구·코인·별명·랭킹은 전송하지 않습니다.</p></div><strong>${hasPair ? canSendToday ? '오늘 1장 가능' : '오늘 촬영 완료' : '대표 동행 필요'}</strong></header>
        <div>${PET_MEET_SCENES.map((scene) => `<button data-pet-meet="${scene.id}" style="--meet-color:${scene.colors[2]};--meet-deep:${scene.colors[0]}" ${enabled ? '' : 'disabled'}><i>${scene.mark}</i><span><b>${escapeHtml(scene.name)}</b><small>${escapeHtml(scene.message)}</small></span></button>`).join('')}</div>
        <footer>${escapeHtml(footer)}</footer>
      </section>`;
    }
    const records = this.petMeets.postcards().slice(0, 12);
    const cards = records.map((record, index) => {
      const scene = PET_MEET_SCENES.find((item) => item.id === record.kind)!;
      const mySpecies = petById(record.myPet.petId)!;
      const neighborSpecies = petById(record.neighborPet.petId)!;
      return `<article style="--meet-color:${scene.colors[2]};--meet-deep:${scene.colors[0]}">
        <canvas width="${PET_MEET_ART_W}" height="${PET_MEET_ART_H}" data-pet-meet-art="${index}" aria-label="${escapeHtml(mySpecies.name)}와 ${escapeHtml(neighborSpecies.name)}의 ${escapeHtml(scene.name)} 픽셀 엽서"></canvas>
        <div><small>${escapeHtml(record.day)} · ${record.direction === 'sent' ? '내가 건넨 장면' : '도착한 장면'}</small><h3>${escapeHtml(scene.name)}</h3><b>${escapeHtml(mySpecies.name)} × ${escapeHtml(neighborSpecies.name)} · ${escapeHtml(record.neighborNickname)}</b><p>${escapeHtml(scene.message)}</p></div>
      </article>`;
    }).join('');
    return `<section class="vprofile-pet-meet-album">
      <header><div><small>PERMANENT COMPANION MEET ALBUM · NO RANKING</small><h2>동행 인사 엽서 앨범</h2><p>온라인 이웃의 대표 동행과 함께 남긴 최근 36장을 보관하고, 장면·친구·종 조합 발견은 평생 기록해요.</p></div><aside><span><b>${progress.total}</b>만남</span><span><b>${progress.scenes}<i>/6</i></b>장면</span><span><b>${progress.neighbors}</b>이웃</span><span><b>${progress.pairs}</b>조합</span></aside></header>
      ${this.petMeetNotice ? `<p class="vprofile-pet-meet-notice">${escapeHtml(this.petMeetNotice)}</p>` : ''}
      ${cards ? `<div class="vprofile-pet-meet-cards">${cards}</div>` : '<div class="vprofile-pet-meet-empty"><i>발</i><p><b>아직 함께 남긴 동행 엽서가 없어요.</b><span>온라인 이웃 명함에서 대표 동행 두 마리가 만날 장면을 고르면 첫 장이 생겨요. 참여하지 않아도 진행 불이익은 없습니다.</span></p></div>'}
    </section>`;
  }

  private neighborCheerHtml(peer: PeerState, self: boolean): string {
    const progress = this.neighborCheers.progress();
    if (!self) {
      const canSendToday = this.neighborCheers.canSendTo(peer.userId);
      const enabled = this.opts.online && canSendToday;
      return `<section class="vprofile-neighbor-cheer-send">
        <header><div><small>SAFE REALTIME CHEER</small><h2>이웃에게 취향 응원 보내기</h2><p>자유문구·코인·능력치 없이 미리 준비된 마음 한 장만 전해요. 같은 이웃에게 하루 한 장이면 충분합니다.</p></div><strong>${canSendToday ? '오늘 1장 가능' : '오늘 전송 완료'}</strong></header>
        <div>${NEIGHBOR_CHEERS.map((cheer) => `<button data-neighbor-cheer="${cheer.id}" style="--cheer-color:${cheer.color};--cheer-deep:${cheer.deep}" ${enabled ? '' : 'disabled'}><i>${cheer.mark}</i><span><b>${escapeHtml(cheer.name)}</b><small>${escapeHtml(cheer.message)}</small></span></button>`).join('')}</div>
        <footer>${this.cheerNotice ? escapeHtml(this.cheerNotice) : !this.opts.online ? '온라인으로 만난 이웃에게만 우편을 보낼 수 있어요. 오프라인 기록은 그대로 유지됩니다.' : canSendToday ? `${escapeHtml(peer.nickname)}님의 공개 명함에서 마음에 닿은 한 가지를 골라 주세요.` : '내일 다시 다른 마음을 전할 수 있어요. 연속 전송 보상은 없습니다.'}</footer>
      </section>`;
    }
    const cards = this.neighborCheers.records().slice(0, 12).map((record, index) => {
      const cheer = NEIGHBOR_CHEER_BY_ID.get(record.kind)!;
      return `<article style="--cheer-color:${cheer.color};--cheer-deep:${cheer.deep}"><canvas width="${NEIGHBOR_CHEER_ART_W}" height="${NEIGHBOR_CHEER_ART_H}" data-neighbor-cheer-art="${index}" aria-label="${escapeHtml(cheer.name)} 픽셀 우편"></canvas><span><small>${escapeHtml(record.day)} · ${escapeHtml(record.fromNickname)}</small><b>${escapeHtml(cheer.name)}</b><em>${escapeHtml(cheer.message)}</em></span></article>`;
    }).join('');
    return `<section class="vprofile-neighbor-cheer-inbox">
      <header><div><small>PERMANENT NEIGHBOR MAILBOX · NO STREAK</small><h2>이웃 응원 우편함</h2><p>온라인 이웃이 골라 준 안전한 취향 스티커를 최근 36장까지 보관해요. 평생 집계와 도감은 카드가 밀려나도 남습니다.</p></div><aside><span><b>${progress.received}</b>받은 마음</span><span><b>${progress.sent}</b>보낸 마음</span><span><b>${progress.kinds}<i>/8</i></b>응원 도감</span><span><b>${progress.neighbors}</b>마주친 이웃</span></aside></header>
      ${this.cheerNotice ? `<p class="vprofile-cheer-notice">${escapeHtml(this.cheerNotice)}</p>` : ''}
      ${cards ? `<div class="vprofile-neighbor-cheer-cards">${cards}</div>` : '<div class="vprofile-neighbor-cheer-empty"><i>우</i><p><b>아직 도착한 응원 우편이 없어요.</b><span>우편이 없어도 불이익은 없어요. 온라인 이웃의 명함에서 먼저 한 장 보내 볼 수도 있습니다.</span></p></div>'}
    </section>`;
  }

  private neighborHomeTourHtml(peer: PeerState, self: boolean): string {
    const progress = this.homeTours.progress();
    if (!self) {
      const enabled = this.opts.online && !this.tourLoading && !!this.opts.onVisitNeighborHome;
      return `<section class="vprofile-home-tour-invite">
        <div class="vprofile-home-tour-door" aria-hidden="true"><i></i><span>집</span><b></b></div>
        <div><small>READ-ONLY OPEN HOME TOUR</small><h2>${escapeHtml(peer.nickname)}님의 집 구경하기</h2><p>서버에 공개된 가구 배치와 홈 테마만 둘러봐요. 가구를 옮길 수 없고 코인·채팅·개인 리폼·어항 설정은 보이지 않습니다.</p><em>${this.tourNotice ? escapeHtml(this.tourNotice) : '별점과 순위 없이, 하루 한 번 투어 수첩에 방문 도장만 남아요.'}</em></div>
        <button data-neighbor-home-visit ${enabled ? '' : 'disabled'}>${this.tourLoading ? '집을 찾는 중…' : this.opts.online ? '열린 집 방문' : '온라인에서 방문 가능'}</button>
      </section>`;
    }
    const themeName = new Map([[STARTER_THEME.id, STARTER_THEME.name] as const, ...HOME_THEMES.map((theme) => [theme.id, theme.name] as const)]);
    const gradeName = new Map(HOME_GRADES.map((grade) => [grade.id, grade.name] as const));
    const cards = this.homeTours.records().slice(0, 12).map((record, index) => `<article class="${record.favorite ? 'is-favorite' : ''}" style="--tour-index:${index}">
      <canvas width="${NEIGHBOR_HOME_TOUR_ART_W}" height="${NEIGHBOR_HOME_TOUR_ART_H}" data-home-tour-art="${index}" aria-label="${escapeHtml(record.ownerNickname)}님의 ${escapeHtml(themeName.get(record.themeId) ?? '집')} 픽셀 투어 엽서"></canvas>
      <div><span><small>${escapeHtml(record.lastVisitDay)} · ${escapeHtml(HOUSE_SPECS[record.houseType].label)}</small><b>${escapeHtml(record.ownerNickname)}님의 집</b><em>${escapeHtml(themeName.get(record.themeId) ?? '나만의 시작')} · ${escapeHtml(gradeName.get(record.gradeId) ?? '빈 캔버스')} · 가구 ${record.uniqueItems}종</em></span><strong>${record.visits}<small>회 방문</small></strong></div>
      <button data-home-tour-favorite="${escapeHtml(record.ownerId)}" aria-pressed="${record.favorite}">${record.favorite ? '최애 엽서 보존 중' : '내 최애 엽서로'}</button>
    </article>`).join('');
    return `<section class="vprofile-home-tour-passport">
      <header><div><small>PERMANENT OPEN HOME PASSPORT · NO RANKING</small><h2>이웃집 투어 수첩</h2><p>온라인에서 실제로 불러온 집만 기록해요. 같은 집은 하루 한 번만 누적되며 연속 방문 보상은 없습니다.</p></div><aside><span><b>${progress.tours}</b>투어</span><span><b>${progress.neighbors}</b>이웃집</span><span><b>${progress.themes}<i>/6</i></b>테마</span><span><b>${progress.houseTypes}<i>/5</i></b>주거형</span><span><b>${progress.favorites}<i>/6</i></b>최애</span></aside></header>
      ${this.tourNotice ? `<p class="vprofile-home-tour-notice">${escapeHtml(this.tourNotice)}</p>` : ''}
      ${cards ? `<div>${cards}</div>` : '<div class="vprofile-home-tour-empty"><i>문</i><p><b>아직 투어 도장이 없어요.</b><span>온라인 이웃의 명함에서 열린 집을 방문하면 첫 장이 생겨요. 방문하지 않아도 불이익은 없습니다.</span></p></div>'}
    </section>`;
  }

  private editorHtml(context: VillageProfileSelfContext): string {
    const state = this.store.get();
    const frames = villageProfileFrameViews(context.quests);
    const mottos = villageProfileMottoViews(context.unlockedBadgeIds);
    const unlocked = new Set(context.unlockedBadgeIds);
    const availableBadges = context.unlockedBadgeIds.map((id) => BADGE_BY_ID.get(id)).filter((badge) => !!badge)
      .sort((a, b) => Number(state.showcasedBadgeIds.includes(b.id)) - Number(state.showcasedBadgeIds.includes(a.id)) || b.rarity.localeCompare(a.rarity));
    return `<section class="vprofile-editor">
      <div class="vprofile-edit-block"><h3>나를 소개하는 한마디 <span>${mottos.filter((motto) => motto.unlocked).length}/${mottos.length} 해금 · 진로 완주 문장 포함</span></h3><div class="vprofile-mottos">${mottos.map((motto) => `<button data-profile-motto="${motto.id}" class="${state.mottoId === motto.id ? 'sel' : ''} ${motto.unlocked ? '' : 'locked'}" ${motto.unlocked ? '' : 'disabled'} title="${escapeHtml(motto.unlocked ? motto.text : `${motto.requirement} 필요`)}"><i>${motto.unlocked ? motto.mark : '잠'}</i>${motto.unlocked ? escapeHtml(motto.text) : escapeHtml(`${motto.requirement} 완주 문장`)}</button>`).join('')}</div></div>
      <div class="vprofile-edit-block"><h3>생활 프레임 <span>${frames.filter((frame) => frame.unlocked).length}/${frames.length} 해금</span></h3><div class="vprofile-frames">${frames.map((frame) => `<button data-profile-frame="${frame.id}" class="${state.frameId === frame.id ? 'sel' : ''} ${frame.unlocked ? '' : 'locked'}" ${frame.unlocked ? '' : 'disabled'} style="--pf-accent:${frame.colors[2]};--pf-deep:${frame.colors[1]}"><i>${frame.mark}</i><b>${frame.name}</b><small>${frame.unlocked ? frame.description : `${frame.requirement?.label} · ${frame.progress}/${frame.goal}`}</small></button>`).join('')}</div></div>
      <div class="vprofile-edit-block"><h3>대표 배지 <span>${state.showcasedBadgeIds.length}/3 선택 · 순서대로 명함에 표시</span></h3><div class="vprofile-badge-picker">${availableBadges.length ? availableBadges.map((badge) => `<button data-profile-badge="${badge.id}" class="${state.showcasedBadgeIds.includes(badge.id) ? 'sel' : ''}" data-rarity="${badge.rarity}"><i>◆</i><b>${escapeHtml(badge.name)}</b><small>${RARITY_LABEL[badge.rarity]} · ${escapeHtml(badge.source)}</small></button>`).join('') : '<p>모험 일지에서 첫 배지를 얻으면 여기에 전시할 수 있어요.</p>'}</div></div>
      ${this.notice ? `<p class="vprofile-notice">${escapeHtml(this.notice)}</p>` : ''}<p class="vprofile-safe">공개되는 것은 선택한 문장·프레임·배지·전문성·대표 캐릭터 설정·정제된 포토카드·대표 홈 엽서·대표 동행 코디와 게임 진행 수치뿐이에요. 캐릭터 저장 시각, 촬영 시각, 카드 ID, 펫 별명, 채팅, 보유 코인, 실제 개인정보는 명함에 포함되지 않습니다.</p>
    </section>`;
  }

  private paint(peer: PeerState, profile: VillageProfilePublic): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('[data-profile-art]'); const context = canvas?.getContext('2d');
    const frame = VILLAGE_PROFILE_FRAME_BY_ID.get(profile.frameId) ?? VILLAGE_PROFILE_FRAME_BY_ID.get('kraft')!;
    if (context) paintVillageProfileCard(context, frame, peer.appearance, peer.pet ? { speciesId: peer.pet, accessory: peer.petAccessory ?? 'none' } : null, profile.villageLevel);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-look]').forEach((lookCanvas) => {
      const look = profile.signatureLooks[Number(lookCanvas.dataset.profileLook)];
      const lookContext = lookCanvas.getContext('2d');
      if (!look || !lookContext) return;
      lookContext.clearRect(0, 0, CHAR_W, CHAR_H); lookContext.imageSmoothingEnabled = false;
      paintCharacterFrame(lookContext, look.appearance, 0, 0);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-character]').forEach((characterCanvas) => {
      const card = profile.characterCards[Number(characterCanvas.dataset.profileCharacter)];
      if (card) paintCharacterZineArt(characterCanvas, card, true);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-specialty]').forEach((specialtyCanvas) => {
      const card = LIFE_SPECIALTY_CARDS.find((item) => item.id === specialtyCanvas.dataset.profileSpecialty);
      if (card) paintLifeSpecialtyArt(specialtyCanvas, { ...card, masteryLevel: card.unlockLevel, unlocked: true, featured: true });
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-synergy]').forEach((synergyCanvas) => {
      const synergy = LIFE_SYNERGY_BY_ID.get(synergyCanvas.dataset.profileSynergy!);
      if (synergy) paintLifeSynergyArt(synergyCanvas, synergy, true);
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-photo]').forEach((photoCanvas) => {
      const card = profile.photoCards[Number(photoCanvas.dataset.profilePhoto)];
      if (!card) return;
      const record: PhotoRecord = {
        id: `public-${photoCanvas.dataset.profilePhoto}`, takenAt: '2000-01-01T00:00:00.000Z', nickname: '마을 이웃',
        caption: PHOTO_BACKDROPS.find((item) => item.id === card.backdropId)?.name ?? '홍대마을', frameId: card.frameId, backdropId: card.backdropId, poseId: card.poseId,
        appearance: card.appearance, pet: card.pet ? { ...card.pet, name: null } : null,
      };
      renderPhotoCard(photoCanvas, record, { foilId: card.foilId, stickerIds: card.stickerIds });
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-home]').forEach((homeCanvas) => {
      const card = profile.homeCards[Number(homeCanvas.dataset.profileHome)];
      if (card) paintHomeStudioCard(homeCanvas, { ...card, savedAt: 0 });
    });
    this.root.querySelectorAll<HTMLCanvasElement>('[data-profile-pet-style]').forEach((styleCanvas) => {
      const card = profile.petStyleCards[Number(styleCanvas.dataset.profilePetStyle)];
      const species = card ? petById(card.petId) : null;
      if (card && species) paintPetStyleCard(styleCanvas, { ...card, petName: species.name });
    });
    const cheerRecords = this.neighborCheers.records().slice(0, 12);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-neighbor-cheer-art]').forEach((cheerCanvas) => {
      const record = cheerRecords[Number(cheerCanvas.dataset.neighborCheerArt)];
      if (record) paintNeighborCheerArt(cheerCanvas, record);
    });
    const petMeetRecords = this.petMeets.postcards().slice(0, 12);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-pet-meet-art]').forEach((postcardCanvas) => {
      const record = petMeetRecords[Number(postcardCanvas.dataset.petMeetArt)];
      if (record) paintPetMeetPostcard(postcardCanvas, record);
    });
    const tourRecords = this.homeTours.records().slice(0, 12);
    this.root.querySelectorAll<HTMLCanvasElement>('[data-home-tour-art]').forEach((tourCanvas) => {
      const record = tourRecords[Number(tourCanvas.dataset.homeTourArt)];
      if (record) paintNeighborHomeTourArt(tourCanvas, record);
    });
  }

  private notifyChanged(): void {
    const profile = this.publicSnapshot(); this.opts.onChanged(profile); this.render();
  }

  private render(): void {
    const self = this.opts.getSelfContext();
    const peer = this.remotePeer ?? self.peer;
    const profile = this.remotePeer ? (normalizeVillageProfilePublic(peer.profile) ?? normalizeVillageProfilePublic({ villageLevel: peer.level ?? 1 })!) : this.publicSnapshot();
    this.root.innerHTML = `<div class="vprofile-frame"><header><div><small>${this.remotePeer ? 'NEIGHBOR PROFILE' : 'MY VILLAGE PROFILE'}</small><h1>${this.remotePeer ? '이웃의 마을 명함' : '나의 마을 명함'}</h1><p>${this.remotePeer ? '이웃이 직접 고른 공개 기록만 보여요.' : '코디와 수집, 생활 기록을 한 장의 자기소개로 꾸며 보세요.'}</p></div><button class="vprofile-close" aria-label="닫기">닫기</button></header>
      <div class="vprofile-card"><canvas width="240" height="140" data-profile-art></canvas>${this.remotePeer ? this.remoteCardHtml(peer, profile) : this.selfCardHtml(self, profile)}</div>
      ${this.petStyleGalleryHtml(profile, !this.remotePeer)}
      ${this.petMeetHtml(peer, profile, !this.remotePeer)}
      ${this.neighborHomeTourHtml(peer, !this.remotePeer)}
      ${this.neighborCheerHtml(peer, !this.remotePeer)}
      ${this.collectionShowcaseHtml(profile, !this.remotePeer)}
      ${this.homeStudioGalleryHtml(profile, !this.remotePeer)}
      ${this.characterZineGalleryHtml(profile, !this.remotePeer)}
      ${this.signatureGalleryHtml(profile, !this.remotePeer)}
      ${this.remotePeer ? '<p class="vprofile-remote-tip">대표 동행 코디는 종·성격·장식·배경·포즈만, 집 투어와 홈 엽서는 공개한 기본 가구 장면만 읽습니다. 저장·촬영 시각, 카드 ID, 펫 별명, 채팅·코인·개인 리폼·어항 설정은 공개되지 않습니다.</p>' : this.editorHtml(self)}
    </div>`;
    this.paint(peer, profile);
    this.root.querySelector('.vprofile-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('[data-profile-open-atelier]')?.addEventListener('click', () => { this.close(); this.opts.onOpenAtelier?.(); });
    this.root.querySelector('[data-profile-open-zine]')?.addEventListener('click', () => { this.close(); this.opts.onOpenCharacterZine?.(); });
    this.root.querySelector('[data-profile-open-specialties]')?.addEventListener('click', () => { this.close(); this.opts.onOpenSpecialties?.(); });
    this.root.querySelector('[data-profile-open-photo]')?.addEventListener('click', () => { this.close(); this.opts.onOpenPhotoBooth?.(); });
    this.root.querySelector('[data-profile-open-pet-style]')?.addEventListener('click', () => { this.close(); this.opts.onOpenPetStyleStudio?.(); });
    this.root.querySelector<HTMLButtonElement>('[data-neighbor-home-visit]')?.addEventListener('click', () => { void this.visitNeighborHome(); });
    this.root.querySelectorAll<HTMLButtonElement>('[data-home-tour-favorite]').forEach((button) => button.addEventListener('click', () => {
      const result = this.homeTours.toggleFavorite(button.dataset.homeTourFavorite ?? '');
      this.tourNotice = result === 'featured' ? '최애 투어 엽서로 보존했어요. 언제든 다시 눌러 바꿀 수 있어요.'
        : result === 'unfeatured' ? '최애 보존에서 내렸어요. 방문 기록과 엽서는 그대로 남아 있어요.'
          : result === 'full' ? '최애 엽서는 여섯 장까지예요. 먼저 한 장을 내려 주세요.' : '이 엽서 기록을 다시 찾지 못했어요.';
      if (result === 'featured' || result === 'unfeatured') this.opts.onNeighborHomeTourChanged?.(this.homeTours.progress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-neighbor-cheer]').forEach((button) => button.addEventListener('click', () => {
      if (!this.remotePeer) return;
      const kind = button.dataset.neighborCheer as NeighborCheerKind;
      if (!this.neighborCheers.canSendTo(this.remotePeer.userId)) {
        this.cheerNotice = '이 이웃에게는 오늘 이미 마음 한 장을 전했어요.'; this.render(); return;
      }
      if (!this.opts.onSendNeighborCheer?.(this.remotePeer, kind)) {
        this.cheerNotice = '지금은 혼자 모드예요. 온라인에서 다시 만났을 때 안전하게 보낼 수 있어요.'; this.render(); return;
      }
      const result = this.neighborCheers.recordSent(this.remotePeer.userId, kind);
      const cheer = NEIGHBOR_CHEER_BY_ID.get(kind);
      this.cheerNotice = result === 'sent' ? `「${cheer?.name ?? '이웃 응원'}」 우편을 보냈어요. 코인이나 능력치 경쟁은 생기지 않습니다.` : '오늘의 마음은 이미 전해졌어요.';
      if (result === 'sent') this.opts.onNeighborCheerChanged?.(this.neighborCheers.progress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-pet-meet]').forEach((button) => button.addEventListener('click', () => {
      if (!this.remotePeer) return;
      const kind = button.dataset.petMeet as PetMeetKind;
      const myPet = this.publicSnapshot().petStyleCards[0];
      const neighborPet = normalizeVillageProfilePublic(this.remotePeer.profile)?.petStyleCards[0];
      if (!myPet || !neighborPet) {
        this.petMeetNotice = '두 명함에 대표 동행 카드가 한 장씩 있어야 엽서를 남길 수 있어요.';
        this.render();
        return;
      }
      if (!this.petMeets.canSendTo(this.remotePeer.userId)) {
        this.petMeetNotice = '이 이웃과는 오늘 이미 동행 엽서 한 장을 남겼어요.';
        this.render();
        return;
      }
      if (!this.opts.onSendPetMeet?.(this.remotePeer, kind)) {
        this.petMeetNotice = '지금은 혼자 모드예요. 온라인에서 다시 만났을 때 안전하게 보낼 수 있어요.';
        this.render();
        return;
      }
      const result = this.petMeets.recordSent(
        this.remotePeer.userId, this.remotePeer.nickname, kind, myPet, neighborPet,
      );
      const scene = PET_MEET_SCENES.find((item) => item.id === kind);
      this.petMeetNotice = result === 'sent'
        ? `「${scene?.name ?? '작은 만남'}」 엽서를 함께 남겼어요. 코인·능력치·연속 접속 보상은 생기지 않습니다.`
        : '오늘의 두 발자국은 이미 앨범에 남아 있어요.';
      if (result === 'sent') this.opts.onPetMeetChanged?.(this.petMeets.progress());
      this.render();
    }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-profile-motto]').forEach((button) => button.addEventListener('click', () => { if (this.store.setMotto(button.dataset.profileMotto!, self.unlockedBadgeIds)) this.notifyChanged(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-profile-frame]').forEach((button) => button.addEventListener('click', () => { if (this.store.setFrame(button.dataset.profileFrame!, self.quests)) this.notifyChanged(); }));
    this.root.querySelectorAll<HTMLButtonElement>('[data-profile-badge]').forEach((button) => button.addEventListener('click', () => {
      const result = this.store.toggleBadge(button.dataset.profileBadge!, new Set(self.unlockedBadgeIds));
      if (result === 'added' || result === 'removed') { this.notice = ''; this.notifyChanged(); }
      else if (result === 'full') { this.notice = '대표 배지는 세 개까지예요. 먼저 전시 중인 배지 하나를 눌러 내려 주세요.'; this.render(); }
    }));
  }

  private async visitNeighborHome(): Promise<void> {
    if (!this.remotePeer || this.tourLoading || !this.opts.onVisitNeighborHome) return;
    if (!this.opts.online) { this.tourNotice = '지금은 혼자 모드예요. 온라인 이웃을 만났을 때 방문할 수 있어요.'; this.render(); return; }
    const peer = this.remotePeer;
    this.tourLoading = true; this.tourNotice = ''; this.render();
    let result: 'entered' | 'no-home' | 'private' | 'offline' | 'error' = 'error';
    try { result = await this.opts.onVisitNeighborHome(peer); } catch { result = 'error'; }
    if (result === 'entered') return;
    this.tourLoading = false;
    this.tourNotice = result === 'no-home'
      ? '아직 공개된 집을 찾지 못했어요. 이웃의 명함 기록은 그대로 둘러볼 수 있어요.'
      : result === 'private' ? '이웃이 지금은 집 문을 닫아 두었어요. 명함과 응원 우편은 그대로 즐길 수 있어요.'
      : result === 'offline' ? '온라인 연결이 돌아오면 안전하게 집을 찾아볼게요.'
        : '집 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    if (this.opened) this.render();
  }

  close(): void { if (!this.opened) return; this.opened = false; this.root.style.display = 'none'; this.opts.onToggle(false); }
  destroy(): void { this.root.remove(); }
}
