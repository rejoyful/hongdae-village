import {
  normalizePetMeetPostcard, type PetMeetPostcard, type PetMeetStorage,
} from '../social/petMeetPostcards';

export const PET_MEMORY_WALL_FRAMES = [
  { id: 'kraft_triptych', mark: '종', code: 'KRAFT TRIPTYCH', name: '크라프트 세 폭 액자', note: '골목 엽서를 종이 테두리와 황동 핀으로 나란히' },
  { id: 'film_strip', mark: '필', code: 'FILM STRIP', name: '심야 필름 스트립', note: '검은 프레임과 작은 필름 구멍이 이어지는 기록 벽' },
  { id: 'wood_gallery', mark: '목', code: 'WOOD GALLERY', name: '원목 갤러리 선반', note: '깊이가 다른 원목 액자와 작은 선반의 생활 전시' },
  { id: 'neon_grid', mark: '빛', code: 'NEON GRID', name: '홍대 네온 그리드', note: '보랏빛 와이어와 발광 모서리로 묶은 밤의 전시' },
] as const;

export const PET_MEMORY_WALL_LIGHTS = [
  { id: 'warm', mark: '등', code: 'WARM EVENING', name: '크림빛 저녁', note: '종이결이 포근하게 살아나는 노란 조명', colors: ['#241d21', '#70524b', '#d59a6d', '#f3dfb0'] },
  { id: 'rain', mark: '비', code: 'RAIN WINDOW', name: '빗물 창가', note: '청록 그림자와 젖은 유리의 차분한 반사', colors: ['#17252d', '#3e6873', '#71a3a0', '#d6e1bf'] },
  { id: 'neon', mark: '밤', code: 'NEON ALLEY', name: '네온 골목', note: '분홍과 보라가 엽서 가장자리에 번지는 밤', colors: ['#211b30', '#63466f', '#d76d9a', '#f0c38c'] },
  { id: 'star', mark: '별', code: 'FOREST STAR', name: '숲의 별빛', note: '짙은 초록과 작은 별가루가 머무는 조명', colors: ['#172724', '#3c6250', '#88a36e', '#e5d48f'] },
] as const;

export const PET_MEMORY_WALL_LAYOUTS = [
  { id: 'row', mark: '一', code: 'QUIET ROW', name: '나란한 세 장', note: '같은 높이에 놓아 한 번의 산책처럼 읽어요.' },
  { id: 'center', mark: '中', code: 'CENTER STORY', name: '한 장이 큰 이야기', note: '가운데 추억을 크게, 두 장을 작은 여백처럼 둬요.' },
  { id: 'steps', mark: '階', code: 'ALLEY STEPS', name: '골목 계단', note: '조금씩 오르는 리듬으로 발자국을 이어 놓아요.' },
  { id: 'collage', mark: '겹', code: 'LIVED COLLAGE', name: '살아 있는 콜라주', note: '겹친 종이와 테이프가 오래 산 방처럼 보여요.' },
] as const;

export type PetMemoryWallFrameId = typeof PET_MEMORY_WALL_FRAMES[number]['id'];
export type PetMemoryWallLightId = typeof PET_MEMORY_WALL_LIGHTS[number]['id'];
export type PetMemoryWallLayoutId = typeof PET_MEMORY_WALL_LAYOUTS[number]['id'];

export interface PetMemoryWallState {
  version: 1;
  featured: PetMeetPostcard[];
  frameId: PetMemoryWallFrameId;
  lightId: PetMemoryWallLightId;
  layoutId: PetMemoryWallLayoutId;
  visible: boolean;
  triedFrameIds: PetMemoryWallFrameId[];
  triedLightIds: PetMemoryWallLightId[];
  triedLayoutIds: PetMemoryWallLayoutId[];
  restyles: number;
}

export interface PetMemoryWallProgress {
  featuredCards: number;
  framesTried: number;
  lightsTried: number;
  layoutsTried: number;
  restyles: number;
  visible: boolean;
}

export type PetMemoryWallStorage = PetMeetStorage;
export const PET_MEMORY_WALL_MAX = 3;

const frameIds = new Set<string>(PET_MEMORY_WALL_FRAMES.map((item) => item.id));
const lightIds = new Set<string>(PET_MEMORY_WALL_LIGHTS.map((item) => item.id));
const layoutIds = new Set<string>(PET_MEMORY_WALL_LAYOUTS.map((item) => item.id));
const isFrameId = (value: unknown): value is PetMemoryWallFrameId => typeof value === 'string' && frameIds.has(value);
const isLightId = (value: unknown): value is PetMemoryWallLightId => typeof value === 'string' && lightIds.has(value);
const isLayoutId = (value: unknown): value is PetMemoryWallLayoutId => typeof value === 'string' && layoutIds.has(value);
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
);

export function freshPetMemoryWallState(): PetMemoryWallState {
  return {
    version: 1,
    featured: [],
    frameId: 'kraft_triptych',
    lightId: 'warm',
    layoutId: 'row',
    visible: true,
    triedFrameIds: ['kraft_triptych'],
    triedLightIds: ['warm'],
    triedLayoutIds: ['row'],
    restyles: 0,
  };
}

export function normalizePetMemoryWallState(raw: unknown): PetMemoryWallState {
  if (!raw || typeof raw !== 'object') return freshPetMemoryWallState();
  const value = raw as Partial<PetMemoryWallState>;
  const frameId = isFrameId(value.frameId) ? value.frameId : 'kraft_triptych';
  const lightId = isLightId(value.lightId) ? value.lightId : 'warm';
  const layoutId = isLayoutId(value.layoutId) ? value.layoutId : 'row';
  const featured = Array.isArray(value.featured)
    ? value.featured.flatMap((entry) => {
      const record = normalizePetMeetPostcard(entry);
      return record ? [record] : [];
    }).filter((record, index, records) => records.findIndex((item) => item.id === record.id) === index)
      .slice(0, PET_MEMORY_WALL_MAX)
    : [];
  return {
    version: 1,
    featured,
    frameId,
    lightId,
    layoutId,
    visible: value.visible !== false,
    triedFrameIds: [...new Set([
      ...(Array.isArray(value.triedFrameIds) ? value.triedFrameIds.filter(isFrameId) : []),
      frameId,
    ])],
    triedLightIds: [...new Set([
      ...(Array.isArray(value.triedLightIds) ? value.triedLightIds.filter(isLightId) : []),
      lightId,
    ])],
    triedLayoutIds: [...new Set([
      ...(Array.isArray(value.triedLayoutIds) ? value.triedLayoutIds.filter(isLayoutId) : []),
      layoutId,
    ])],
    restyles: cleanCount(value.restyles),
  };
}

function browserStorage(): PetMemoryWallStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export class PetMemoryWallStore {
  private readonly key: string;
  private state: PetMemoryWallState;

  constructor(userId: string, private readonly storage: PetMemoryWallStorage | null = browserStorage()) {
    this.key = `hv-pet-memory-wall-v1:${userId}`;
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 손상된 저장 대신 안전한 빈 전시를 사용 */ }
    this.state = normalizePetMemoryWallState(raw);
    this.persist();
  }

  get(): PetMemoryWallState { return structuredClone(this.state); }
  featured(): PetMeetPostcard[] { return structuredClone(this.state.featured); }
  isFeatured(id: string): boolean { return this.state.featured.some((record) => record.id === id); }

  progress(): PetMemoryWallProgress {
    return {
      featuredCards: this.state.featured.length,
      framesTried: this.state.triedFrameIds.length,
      lightsTried: this.state.triedLightIds.length,
      layoutsTried: this.state.triedLayoutIds.length,
      restyles: this.state.restyles,
      visible: this.state.visible,
    };
  }

  toggle(raw: unknown): 'featured' | 'unfeatured' | 'full' | 'invalid' {
    const record = normalizePetMeetPostcard(raw);
    if (!record) return 'invalid';
    if (this.isFeatured(record.id)) {
      this.state = {
        ...this.state,
        featured: this.state.featured.filter((item) => item.id !== record.id),
        restyles: this.state.restyles + 1,
      };
      this.persist();
      return 'unfeatured';
    }
    if (this.state.featured.length >= PET_MEMORY_WALL_MAX) return 'full';
    this.state = {
      ...this.state,
      featured: [...this.state.featured, record],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return 'featured';
  }

  selectFrame(frameId: PetMemoryWallFrameId): boolean {
    if (!frameIds.has(frameId) || frameId === this.state.frameId) return false;
    this.state = {
      ...this.state,
      frameId,
      triedFrameIds: [...new Set([...this.state.triedFrameIds, frameId])],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return true;
  }

  selectLight(lightId: PetMemoryWallLightId): boolean {
    if (!lightIds.has(lightId) || lightId === this.state.lightId) return false;
    this.state = {
      ...this.state,
      lightId,
      triedLightIds: [...new Set([...this.state.triedLightIds, lightId])],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return true;
  }

  selectLayout(layoutId: PetMemoryWallLayoutId): boolean {
    if (!layoutIds.has(layoutId) || layoutId === this.state.layoutId) return false;
    this.state = {
      ...this.state,
      layoutId,
      triedLayoutIds: [...new Set([...this.state.triedLayoutIds, layoutId])],
      restyles: this.state.restyles + 1,
    };
    this.persist();
    return true;
  }

  setVisible(visible: boolean): boolean {
    if (visible === this.state.visible) return false;
    this.state = { ...this.state, visible, restyles: this.state.restyles + 1 };
    this.persist();
    return true;
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 현재 세션은 유지 */ }
  }
}
