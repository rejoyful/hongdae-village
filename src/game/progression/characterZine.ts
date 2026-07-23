import { normalizeAppearance, type Appearance } from '../art/appearance';
import type { QuestState } from '../questProgress';

export const CHARACTER_ZINE_SLOT_COUNT = 6;
export const CHARACTER_ZINE_FEATURED_MAX = 3;
export const CHARACTER_EPISODE_FEATURED_MAX = 3;

export const CHARACTER_ZINE_ROLES = [
  { id: 'midnight_editor', mark: '편', name: '심야 골목 편집자', blurb: '잠들지 않은 간판과 사람들의 이야기를 한 장씩 엮는다.', palette: ['#211d32', '#665080', '#d58193', '#f4ddb0'] },
  { id: 'record_collector', mark: '음', name: '레코드 수집가', blurb: '골목의 오래된 소리를 찾아 바늘 끝에 보관한다.', palette: ['#272128', '#734d58', '#c97967', '#efcf91'] },
  { id: 'rooftop_gardener', mark: '잎', name: '옥상 정원 연구원', blurb: '작은 화분마다 계절과 햇빛의 차이를 기록한다.', palette: ['#20352d', '#4f7457', '#9bb66f', '#e8ddb0'] },
  { id: 'rain_cartographer', mark: '비', name: '빗물 지도 제작자', blurb: '비 오는 날에만 열리는 물길과 반사를 지도에 옮긴다.', palette: ['#1d3040', '#476b7d', '#79a7aa', '#d4e2c2'] },
  { id: 'home_curator', mark: '집', name: '작은 방 큐레이터', blurb: '낡은 가구와 좋아하는 물건으로 한 사람의 방을 만든다.', palette: ['#382820', '#865f46', '#c99564', '#f0d8ad'] },
  { id: 'companion_walker', mark: '발', name: '동행 산책 기록가', blurb: '작은 동행이 멈춰 선 자리와 표정을 오래 기억한다.', palette: ['#2e2c36', '#75647d', '#bd8290', '#f0cfaa'] },
  { id: 'alley_stylist', mark: '옷', name: '골목 스타일 디렉터', blurb: '서로 다른 색과 시대를 한 벌의 이야기로 조합한다.', palette: ['#34213a', '#8b4f79', '#df7d8f', '#f5d690'] },
  { id: 'forest_researcher', mark: '숲', name: '외곽 생태 관찰자', blurb: '도시 끝에서 자라는 풀과 낯선 생명의 흔적을 좇는다.', palette: ['#1f3428', '#526e4b', '#92a95e', '#e6d69a'] },
] as const;

export const CHARACTER_ZINE_MOTIFS = [
  { id: 'star', mark: '★', name: '새벽별', blurb: '어두운 장면을 잇는 작은 빛' },
  { id: 'film', mark: '▣', name: '필름', blurb: '지나간 순간을 잘라 둔 프레임' },
  { id: 'vinyl', mark: '◎', name: '바이닐', blurb: '몇 번이고 되감아 듣는 마음' },
  { id: 'leaf', mark: '♣', name: '잎사귀', blurb: '천천히 자라는 계절의 증거' },
  { id: 'paw', mark: '●', name: '발자국', blurb: '함께 걸었다는 작은 흔적' },
  { id: 'rain', mark: '〃', name: '빗방울', blurb: '젖은 골목 위로 겹치는 반사' },
  { id: 'ribbon', mark: '∞', name: '리본', blurb: '좋아하는 것을 묶어 둔 표시' },
  { id: 'lantern', mark: '◇', name: '등불', blurb: '늦은 귀가를 기다리는 온기' },
] as const;

export const CHARACTER_ZINE_BONDS = [
  { id: 'found_family', mark: '家', name: '선택한 가족', blurb: '돌아갈 곳을 서로에게 만들어 주는 사이', color: '#b46f62' },
  { id: 'creative_pair', mark: '作', name: '창작 콤비', blurb: '다른 감각으로 하나의 장면을 완성하는 사이', color: '#8c6ea3' },
  { id: 'friendly_rivals', mark: '競', name: '다정한 라이벌', blurb: '서로의 다음 가능성을 가장 먼저 알아보는 사이', color: '#b8874e' },
  { id: 'old_friends', mark: '久', name: '오랜 친구', blurb: '말하지 않은 계절까지 기억하는 사이', color: '#6d8f82' },
  { id: 'mentor_muse', mark: '燈', name: '길잡이와 영감', blurb: '가르침과 영감의 자리가 자주 뒤바뀌는 사이', color: '#987757' },
  { id: 'quiet_allies', mark: '盟', name: '말없는 동맹', blurb: '필요한 순간 같은 방향을 바라보는 사이', color: '#667b91' },
  { id: 'mutual_fans', mark: '推', name: '서로의 최애', blurb: '상대의 사소한 선택까지 진심으로 응원하는 사이', color: '#b66f8c' },
  { id: 'mystery_link', mark: '謎', name: '수수께끼 인연', blurb: '같은 흔적을 좇다 자꾸 마주치는 사이', color: '#6f688e' },
] as const;

export const CHARACTER_ZINE_MEMORY_SCENES = [
  { id: 'rain_shelter', mark: '비', name: '비를 피한 처마', blurb: '갑작스러운 비가 두 사람을 좁은 처마 아래 잠시 머물게 했다.' },
  { id: 'last_train', mark: '막', name: '막차가 지난 플랫폼', blurb: '막차를 놓친 밤, 평소라면 하지 않았을 이야기가 조용히 시작됐다.' },
  { id: 'rooftop_meal', mark: '옥', name: '옥상 위 늦은 식사', blurb: '식어 가는 한 접시를 나누며 서로의 긴 하루를 처음 알게 됐다.' },
  { id: 'lost_record', mark: '음', name: '주인 없는 레코드', blurb: '이름 없는 레코드 한 장의 주인을 찾는 동안 취향의 공통점을 발견했다.' },
  { id: 'festival_cleanup', mark: '등', name: '축제가 끝난 광장', blurb: '불이 꺼진 광장을 함께 정리하며 화려하지 않은 뒷이야기를 나눴다.' },
  { id: 'forest_signal', mark: '숲', name: '숲 가장자리의 신호', blurb: '외곽숲에서 같은 빛을 목격한 두 사람은 말없이 발걸음을 맞췄다.' },
  { id: 'room_makeover', mark: '집', name: '빈 방의 첫 가구', blurb: '텅 빈 방에 첫 가구를 놓으며 각자가 생각하는 집의 모양을 이야기했다.' },
  { id: 'dawn_rehearsal', mark: '새', name: '새벽 첫 리허설', blurb: '아무도 없는 거리에서 실패해도 괜찮은 첫 연습을 함께 시작했다.' },
] as const;

export type CharacterZineRoleId = typeof CHARACTER_ZINE_ROLES[number]['id'];
export type CharacterZineMotifId = typeof CHARACTER_ZINE_MOTIFS[number]['id'];
export type CharacterZineBondId = typeof CHARACTER_ZINE_BONDS[number]['id'];
export type CharacterZineMemorySceneId = typeof CHARACTER_ZINE_MEMORY_SCENES[number]['id'];

export const CHARACTER_EPISODES = [
  {
    id: 'rainy_encore', mark: '비', code: 'EP.01 · RAINY ENCORE', title: '소나기 뒤 마지막 앙코르',
    subtitle: '공연이 끝난 뒤에야 시작된 이야기',
    opening: '젖은 무대 아래 남겨진 세트리스트 한 장이 새로운 약속의 시작이 되었다.',
    ending: '마지막 곡을 다시 찍은 네컷에는 빗소리까지 함께 남아 있었다.',
    palette: ['#20243a', '#5b5278', '#b56f8c', '#efc894'],
    requirements: [
      { key: 'q_busking', goal: 3, label: '골목 공연 3번 완주하기', location: '중앙 광장 무대' },
      { key: 'photo_taken', goal: 3, label: '서로 다른 네컷 3장 남기기', location: '네컷 작업실' },
    ],
  },
  {
    id: 'rooftop_supper', mark: '옥', code: 'EP.02 · ROOFTOP SUPPER', title: '옥상 위 늦은 저녁',
    subtitle: '기른 잎과 따뜻한 접시가 만나는 밤',
    opening: '수확이 늦어진 날, 옥상 난간 옆 작은 상이 두 사람의 식탁이 되었다.',
    ending: '비어 있는 접시 곁에는 다음에 함께 심을 씨앗 이름이 적혀 있었다.',
    palette: ['#2f352d', '#65714c', '#c39355', '#eed598'],
    requirements: [
      { key: 'garden_harvest', goal: 3, label: '옥상 식물 3번 수확하기', location: '옥상 정원' },
      { key: 'cooking_total', goal: 3, label: '골목 메뉴 3번 완성하기', location: '골목 주방' },
    ],
  },
  {
    id: 'room_rescue', mark: '집', code: 'EP.03 · ROOM RESCUE', title: '빈 방을 구하는 세 가지 물건',
    subtitle: '가구의 흠집까지 설정이 되는 오후',
    opening: '텅 빈 방에 들어온 첫 가구는 새것이 아니라 여러 번 고쳐 쓴 작은 책상이었다.',
    ending: '세 번째 물건을 놓자 방은 배경이 아니라 그 인물이 살아온 문장이 되었다.',
    palette: ['#3d2c28', '#805a48', '#bd8a62', '#efd4a4'],
    requirements: [
      { key: 'q_place', goal: 4, label: '내 집에 가구 4점 배치하기', location: '나의 집' },
      { key: 'furniture_reform_crafted', goal: 1, label: '첫 가구 리폼 완성하기', location: '골목 DIY 작업대' },
    ],
  },
  {
    id: 'paw_delivery', mark: '발', code: 'EP.04 · PAW DELIVERY', title: '발자국이 배달한 안부',
    subtitle: '동행이 먼저 알아본 이웃의 마음',
    opening: '산책길마다 멈춰 서던 동행의 발끝에는 전하지 못한 안부가 한 장씩 놓여 있었다.',
    ending: '마지막 편지를 건넨 뒤 작은 발자국은 가장 익숙한 집 방향으로 돌아섰다.',
    palette: ['#31323d', '#71647c', '#b9858e', '#efd1a7'],
    requirements: [
      { key: 'pet_outings_total', goal: 3, label: '동행과 산책 3번 기록하기', location: '펫샵 · 산책 수첩' },
      { key: 'resident_greet', goal: 3, label: '주민과 안부 3번 나누기', location: '이름 있는 주민' },
    ],
  },
  {
    id: 'midnight_index', mark: '달', code: 'EP.05 · MIDNIGHT INDEX', title: '첫차 전의 비밀 색인',
    subtitle: '커피 자국 사이에서 발견한 골목 문장',
    opening: '문 닫을 시간이 지난 카페에서 오래된 영수증 뒷면의 지도가 발견되었다.',
    ending: '새벽이 오기 전 찾은 세 번째 표식은 지도보다 사람의 기억에 오래 남았다.',
    palette: ['#222536', '#4f5a73', '#8b8298', '#d9cda9'],
    requirements: [
      { key: 'q_cafe', goal: 3, label: '카페의 하루 3번 돕기', location: '카페 「모퉁이」' },
      { key: 'alley_secrets_discovered', goal: 3, label: '환경 단서 3개 발견하기', location: '골목 비밀 기록' },
    ],
  },
  {
    id: 'forest_signal', mark: '숲', code: 'EP.06 · FOREST SIGNAL', title: '외곽숲에서 온 작은 신호',
    subtitle: '싸움보다 관찰을 먼저 남긴 원정',
    opening: '같은 자리에서 세 번 깜빡인 빛은 몬스터가 아니라 길을 잃은 생태 신호였다.',
    ending: '돌아온 수첩에는 승패 대신 다섯 생명의 습성과 안전한 귀환길이 적혔다.',
    palette: ['#20342a', '#506e55', '#8daa69', '#e3d69d'],
    requirements: [
      { key: 'q_forest', goal: 180, label: '숲길에서 누적 3분 걷기', location: '동쪽 외곽숲 연결로' },
      { key: 'monster_species', goal: 5, label: '외곽 생명 5종 관찰하기', location: '몬스터 연구 도감' },
    ],
  },
  {
    id: 'market_curio', mark: '장', code: 'EP.07 · MARKET CURIO', title: '주인을 기다리던 작은 물건',
    subtitle: '나눔장터에서 시작된 사물의 전기',
    opening: '아무도 찜하지 않은 낡은 소품 하나에는 지워지지 않은 이름표가 붙어 있었다.',
    ending: '주인을 찾지 못한 대신 그 물건이 지나온 다섯 방의 이야기가 새 도감이 되었다.',
    palette: ['#3d3028', '#80634c', '#b98a5f', '#ead2a2'],
    requirements: [
      { key: 'market_visits', goal: 1, label: '골목 나눔장터 둘러보기', location: '골목 나눔장터' },
      { key: 'object_story_items', goal: 5, label: '물건 이야기 5점 발견하기', location: '내 집 · 물건의 속삭임 도감' },
    ],
  },
  {
    id: 'petal_promise', mark: '꽃', code: 'EP.08 · PETAL PROMISE', title: '꽃잎이 기억한 약속 장소',
    subtitle: '좋아하는 날씨를 다시 부르는 엔딩',
    opening: '서로 다른 시간에 도착한 두 사람은 같은 꽃잎이 쌓인 벤치를 기억하고 있었다.',
    ending: '약속이 끝난 뒤에도 그날의 하늘은 관측소에서 언제든 다시 펼칠 수 있었다.',
    palette: ['#473b43', '#8b6879', '#d28f9a', '#f0cdb2'],
    requirements: [
      { key: 'resident_rendezvous_scenes', goal: 1, label: '주민과 첫 약속 장면 기록하기', location: '주민 관계 수첩' },
      { key: 'atmosphere_observed', goal: 2, label: '두 번째 골목 하늘 관측하기', location: '골목 분위기 관측소' },
    ],
  },
] as const;

export type CharacterEpisodeId = typeof CHARACTER_EPISODES[number]['id'];
export interface CharacterEpisodeRecord {
  slot: number;
  episodeId: CharacterEpisodeId;
  archivedAt: number;
  replayCount: number;
}
export interface CharacterEpisodeRequirementView {
  key: string;
  goal: number;
  label: string;
  location: string;
  current: number;
  complete: boolean;
  progressPct: number;
}
export interface CharacterEpisodeView extends Omit<typeof CHARACTER_EPISODES[number], 'requirements'> {
  requirements: CharacterEpisodeRequirementView[];
  ready: boolean;
  archived: boolean;
  featured: boolean;
  replayCount: number;
}

export interface CharacterZineCard {
  name: string;
  appearance: Appearance;
  roleId: CharacterZineRoleId;
  motifId: CharacterZineMotifId;
  direction: 0 | 1 | 2 | 3;
  savedAt: number;
}

export interface CharacterZineRelation {
  a: number;
  b: number;
  bondId: CharacterZineBondId;
  memoryId: CharacterZineMemorySceneId;
  savedAt: number;
}

export interface CharacterZineState {
  version: 3;
  cards: Array<CharacterZineCard | null>;
  featured: number[];
  relations: CharacterZineRelation[];
  episodes: CharacterEpisodeRecord[];
  featuredEpisodes: string[];
}

export interface CharacterZineProgress {
  saved: number;
  featured: number;
  roles: number;
  motifs: number;
  bonds: number;
  bondKinds: number;
  memoryScenes: number;
  episodes: number;
  episodeKinds: number;
  episodeCharacters: number;
  featuredEpisodes: number;
  episodeReplays: number;
}

const roleIds = new Set<string>(CHARACTER_ZINE_ROLES.map((role) => role.id));
const motifIds = new Set<string>(CHARACTER_ZINE_MOTIFS.map((motif) => motif.id));
const bondIds = new Set<string>(CHARACTER_ZINE_BONDS.map((bond) => bond.id));
const memorySceneIds = new Set<string>(CHARACTER_ZINE_MEMORY_SCENES.map((scene) => scene.id));
const episodeIds = new Set<string>(CHARACTER_EPISODES.map((episode) => episode.id));
const episodeKey = (slot: number, episodeId: CharacterEpisodeId): string => `${slot}:${episodeId}`;
const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export const safeCharacterZineName = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const clean = value.replace(/[<>]/g, '').replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12);
  return clean || fallback;
};

const safeDirection = (value: unknown): 0 | 1 | 2 | 3 => (
  value === 1 || value === 2 || value === 3 ? value : 0
);

export function normalizeCharacterZineCard(raw: unknown, fallbackName = '이름 없는 인물'): CharacterZineCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<CharacterZineCard>;
  if (!value.appearance || typeof value.appearance !== 'object') return null;
  return {
    name: safeCharacterZineName(value.name, fallbackName),
    appearance: normalizeAppearance(value.appearance),
    roleId: roleIds.has(value.roleId ?? '') ? value.roleId as CharacterZineRoleId : CHARACTER_ZINE_ROLES[0].id,
    motifId: motifIds.has(value.motifId ?? '') ? value.motifId as CharacterZineMotifId : CHARACTER_ZINE_MOTIFS[0].id,
    direction: safeDirection(value.direction),
    savedAt: typeof value.savedAt === 'number' && Number.isFinite(value.savedAt) ? Math.max(0, value.savedAt) : 0,
  };
}

export function normalizeCharacterZineState(raw: unknown): CharacterZineState {
  const value = (raw ?? {}) as Partial<CharacterZineState>;
  const input = Array.isArray(value.cards) ? value.cards : [];
  const cards = Array.from({ length: CHARACTER_ZINE_SLOT_COUNT }, (_, index) => (
    normalizeCharacterZineCard(input[index], `캐릭터 ${index + 1}`)
  ));
  const featured = Array.isArray(value.featured)
    ? [...new Set(value.featured.filter((index): index is number => (
      Number.isInteger(index) && index >= 0 && index < CHARACTER_ZINE_SLOT_COUNT && !!cards[index]
    )))].slice(0, CHARACTER_ZINE_FEATURED_MAX)
    : [];
  const relationInput = Array.isArray(value.relations) ? value.relations : [];
  const seenPairs = new Set<string>();
  const relations = relationInput.flatMap((rawRelation): CharacterZineRelation[] => {
    if (!rawRelation || typeof rawRelation !== 'object') return [];
    const relation = rawRelation as Partial<CharacterZineRelation>;
    if (!Number.isInteger(relation.a) || !Number.isInteger(relation.b)) return [];
    const a = Math.min(relation.a!, relation.b!);
    const b = Math.max(relation.a!, relation.b!);
    const pair = `${a}:${b}`;
    if (a < 0 || b >= CHARACTER_ZINE_SLOT_COUNT || a === b || !cards[a] || !cards[b] || seenPairs.has(pair)) return [];
    seenPairs.add(pair);
    return [{
      a, b,
      bondId: bondIds.has(relation.bondId ?? '') ? relation.bondId as CharacterZineBondId : CHARACTER_ZINE_BONDS[0].id,
      memoryId: memorySceneIds.has(relation.memoryId ?? '') ? relation.memoryId as CharacterZineMemorySceneId : CHARACTER_ZINE_MEMORY_SCENES[0].id,
      savedAt: typeof relation.savedAt === 'number' && Number.isFinite(relation.savedAt) ? Math.max(0, relation.savedAt) : 0,
    }];
  });
  const episodeInput = Array.isArray(value.episodes) ? value.episodes : [];
  const seenEpisodes = new Set<string>();
  const episodes = episodeInput.flatMap((rawEpisode): CharacterEpisodeRecord[] => {
    if (!rawEpisode || typeof rawEpisode !== 'object') return [];
    const episode = rawEpisode as Partial<CharacterEpisodeRecord>;
    if (!Number.isInteger(episode.slot) || episode.slot! < 0 || episode.slot! >= CHARACTER_ZINE_SLOT_COUNT
      || !cards[episode.slot!] || !episodeIds.has(episode.episodeId ?? '')) return [];
    const key = episodeKey(episode.slot!, episode.episodeId as CharacterEpisodeId);
    if (seenEpisodes.has(key)) return [];
    seenEpisodes.add(key);
    return [{
      slot: episode.slot!,
      episodeId: episode.episodeId as CharacterEpisodeId,
      archivedAt: cleanCount(episode.archivedAt),
      replayCount: cleanCount(episode.replayCount),
    }];
  });
  const validEpisodeKeys = new Set(episodes.map((episode) => episodeKey(episode.slot, episode.episodeId)));
  const featuredEpisodes = Array.isArray(value.featuredEpisodes)
    ? [...new Set(value.featuredEpisodes.filter((key): key is string => (
      typeof key === 'string' && validEpisodeKeys.has(key)
    )))].slice(0, CHARACTER_EPISODE_FEATURED_MAX)
    : [];
  return { version: 3, cards, featured, relations, episodes, featuredEpisodes };
}

export function saveCharacterZineCard(
  state: CharacterZineState,
  index: number,
  appearance: Appearance,
  options: Partial<Pick<CharacterZineCard, 'name' | 'roleId' | 'motifId' | 'direction'>> = {},
  savedAt = Date.now(),
): CharacterZineState {
  if (!Number.isInteger(index) || index < 0 || index >= CHARACTER_ZINE_SLOT_COUNT) return state;
  const previous = state.cards[index];
  const roleId = roleIds.has(options.roleId ?? '') ? options.roleId! : previous?.roleId ?? CHARACTER_ZINE_ROLES[index % CHARACTER_ZINE_ROLES.length]!.id;
  const motifId = motifIds.has(options.motifId ?? '') ? options.motifId! : previous?.motifId ?? CHARACTER_ZINE_MOTIFS[index % CHARACTER_ZINE_MOTIFS.length]!.id;
  const cards = [...state.cards];
  cards[index] = {
    name: safeCharacterZineName(options.name, previous?.name ?? `캐릭터 ${index + 1}`),
    appearance: normalizeAppearance(appearance),
    roleId,
    motifId,
    direction: options.direction === undefined ? previous?.direction ?? 0 : safeDirection(options.direction),
    savedAt,
  };
  return { ...state, cards };
}

export function updateCharacterZineCard(
  state: CharacterZineState,
  index: number,
  patch: Partial<Pick<CharacterZineCard, 'name' | 'roleId' | 'motifId' | 'direction'>>,
): CharacterZineState {
  const card = state.cards[index];
  if (!card) return state;
  const cards = [...state.cards];
  cards[index] = {
    ...card,
    name: safeCharacterZineName(patch.name, card.name),
    roleId: roleIds.has(patch.roleId ?? '') ? patch.roleId! : card.roleId,
    motifId: motifIds.has(patch.motifId ?? '') ? patch.motifId! : card.motifId,
    direction: patch.direction === undefined ? card.direction : safeDirection(patch.direction),
  };
  return { ...state, cards };
}

export function removeCharacterZineCard(state: CharacterZineState, index: number): CharacterZineState {
  if (!Number.isInteger(index) || index < 0 || index >= CHARACTER_ZINE_SLOT_COUNT || !state.cards[index]) return state;
  const cards = [...state.cards];
  cards[index] = null;
  return {
    ...state,
    cards,
    featured: state.featured.filter((slot) => slot !== index),
    relations: state.relations.filter((relation) => relation.a !== index && relation.b !== index),
    episodes: state.episodes.filter((episode) => episode.slot !== index),
    featuredEpisodes: state.featuredEpisodes.filter((key) => !key.startsWith(`${index}:`)),
  };
}

export function toggleFeaturedCharacterZineCard(
  state: CharacterZineState,
  index: number,
): { state: CharacterZineState; result: 'added' | 'removed' | 'full' | 'empty' } {
  if (!state.cards[index]) return { state, result: 'empty' };
  if (state.featured.includes(index)) {
    return { state: { ...state, featured: state.featured.filter((slot) => slot !== index) }, result: 'removed' };
  }
  if (state.featured.length >= CHARACTER_ZINE_FEATURED_MAX) return { state, result: 'full' };
  return { state: { ...state, featured: [...state.featured, index] }, result: 'added' };
}

export function featuredCharacterZineCards(state: CharacterZineState): CharacterZineCard[] {
  return state.featured.map((index) => state.cards[index]).filter((card): card is CharacterZineCard => !!card);
}

export function upsertCharacterZineRelation(
  state: CharacterZineState,
  aIndex: number,
  bIndex: number,
  bondId: CharacterZineBondId,
  memoryId: CharacterZineMemorySceneId,
  savedAt = Date.now(),
): CharacterZineState {
  if (!Number.isInteger(aIndex) || !Number.isInteger(bIndex) || aIndex === bIndex) return state;
  const a = Math.min(aIndex, bIndex);
  const b = Math.max(aIndex, bIndex);
  if (a < 0 || b >= CHARACTER_ZINE_SLOT_COUNT || !state.cards[a] || !state.cards[b]) return state;
  const safeBondId = bondIds.has(bondId) ? bondId : CHARACTER_ZINE_BONDS[0].id;
  const safeMemoryId = memorySceneIds.has(memoryId) ? memoryId : CHARACTER_ZINE_MEMORY_SCENES[0].id;
  const relation: CharacterZineRelation = { a, b, bondId: safeBondId, memoryId: safeMemoryId, savedAt };
  const index = state.relations.findIndex((item) => item.a === a && item.b === b);
  const relations = [...state.relations];
  if (index >= 0) relations[index] = relation;
  else relations.push(relation);
  return { ...state, relations };
}

export function removeCharacterZineRelation(
  state: CharacterZineState,
  aIndex: number,
  bIndex: number,
): CharacterZineState {
  const a = Math.min(aIndex, bIndex);
  const b = Math.max(aIndex, bIndex);
  const relations = state.relations.filter((relation) => relation.a !== a || relation.b !== b);
  return relations.length === state.relations.length ? state : { ...state, relations };
}

const hasKoreanFinalConsonant = (value: string): boolean => {
  const last = value.trim().at(-1) ?? '';
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(last)) return new Set(['0', '1', '3', '6', '7', '8']).has(last);
  return false;
};

const withParticle = (value: string, afterFinal: string, afterVowel: string): string => (
  `${value}${hasKoreanFinalConsonant(value) ? afterFinal : afterVowel}`
);

export function characterZineRelationStory(state: CharacterZineState, relation: CharacterZineRelation): string {
  const a = state.cards[relation.a];
  const b = state.cards[relation.b];
  if (!a || !b) return '';
  const bond = CHARACTER_ZINE_BONDS.find((item) => item.id === relation.bondId) ?? CHARACTER_ZINE_BONDS[0];
  const memory = CHARACTER_ZINE_MEMORY_SCENES.find((item) => item.id === relation.memoryId) ?? CHARACTER_ZINE_MEMORY_SCENES[0];
  return `${withParticle(a.name, '과', '와')} ${withParticle(b.name, '은', '는')} ${bond.blurb}. ${memory.blurb}`;
}

const questCount = (state: QuestState, key: string): number => Math.max(0, state.lifetimeCounts?.[key] ?? 0);

export function characterEpisodeViews(
  state: CharacterZineState,
  quests: QuestState,
  slot: number,
): CharacterEpisodeView[] {
  const records = new Map(state.episodes.filter((episode) => episode.slot === slot)
    .map((episode) => [episode.episodeId, episode]));
  return CHARACTER_EPISODES.map((episode) => {
    const requirements = episode.requirements.map((requirement) => {
      const current = questCount(quests, requirement.key);
      return {
        ...requirement,
        current,
        complete: current >= requirement.goal,
        progressPct: Math.round((Math.min(current, requirement.goal) / requirement.goal) * 100),
      };
    });
    const record = records.get(episode.id);
    return {
      ...episode,
      requirements,
      ready: !!state.cards[slot] && requirements.every((requirement) => requirement.complete),
      archived: !!record,
      featured: state.featuredEpisodes.includes(episodeKey(slot, episode.id)),
      replayCount: record?.replayCount ?? 0,
    };
  });
}

export function archiveCharacterEpisode(
  state: CharacterZineState,
  quests: QuestState,
  slot: number,
  episodeId: CharacterEpisodeId,
  archivedAt = Date.now(),
): { state: CharacterZineState; result: 'archived' | 'already' | 'not-ready' | 'missing' } {
  if (!state.cards[slot] || !episodeIds.has(episodeId)) return { state, result: 'missing' };
  if (state.episodes.some((episode) => episode.slot === slot && episode.episodeId === episodeId)) {
    return { state, result: 'already' };
  }
  const view = characterEpisodeViews(state, quests, slot).find((episode) => episode.id === episodeId);
  if (!view?.ready) return { state, result: 'not-ready' };
  return {
    state: {
      ...state,
      episodes: [...state.episodes, { slot, episodeId, archivedAt: cleanCount(archivedAt), replayCount: 0 }],
    },
    result: 'archived',
  };
}

export function replayCharacterEpisode(
  state: CharacterZineState,
  slot: number,
  episodeId: CharacterEpisodeId,
): { state: CharacterZineState; result: 'replayed' | 'missing' } {
  const index = state.episodes.findIndex((episode) => episode.slot === slot && episode.episodeId === episodeId);
  if (index < 0) return { state, result: 'missing' };
  const episodes = [...state.episodes];
  episodes[index] = { ...episodes[index]!, replayCount: episodes[index]!.replayCount + 1 };
  return { state: { ...state, episodes }, result: 'replayed' };
}

export function toggleFeaturedCharacterEpisode(
  state: CharacterZineState,
  slot: number,
  episodeId: CharacterEpisodeId,
): { state: CharacterZineState; result: 'added' | 'removed' | 'full' | 'missing' } {
  const key = episodeKey(slot, episodeId);
  if (!state.episodes.some((episode) => episode.slot === slot && episode.episodeId === episodeId)) {
    return { state, result: 'missing' };
  }
  if (state.featuredEpisodes.includes(key)) {
    return { state: { ...state, featuredEpisodes: state.featuredEpisodes.filter((item) => item !== key) }, result: 'removed' };
  }
  if (state.featuredEpisodes.length >= CHARACTER_EPISODE_FEATURED_MAX) return { state, result: 'full' };
  return { state: { ...state, featuredEpisodes: [...state.featuredEpisodes, key] }, result: 'added' };
}

export function characterZineProgress(state: CharacterZineState): CharacterZineProgress {
  const cards = state.cards.filter((card): card is CharacterZineCard => !!card);
  return {
    saved: cards.length,
    featured: state.featured.length,
    roles: new Set(cards.map((card) => card.roleId)).size,
    motifs: new Set(cards.map((card) => card.motifId)).size,
    bonds: state.relations.length,
    bondKinds: new Set(state.relations.map((relation) => relation.bondId)).size,
    memoryScenes: new Set(state.relations.map((relation) => relation.memoryId)).size,
    episodes: state.episodes.length,
    episodeKinds: new Set(state.episodes.map((episode) => episode.episodeId)).size,
    episodeCharacters: new Set(state.episodes.map((episode) => episode.slot)).size,
    featuredEpisodes: state.featuredEpisodes.length,
    episodeReplays: state.episodes.reduce((total, episode) => total + episode.replayCount, 0),
  };
}

export class CharacterZineStore {
  private state: CharacterZineState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-character-zine-${userId}`;
    let raw: unknown = null;
    try {
      const value = localStorage.getItem(this.key);
      if (value) raw = JSON.parse(value);
    } catch { /* 세션 한정 */ }
    this.state = normalizeCharacterZineState(raw);
    this.persist();
  }

  get(): CharacterZineState { return this.state; }
  card(index: number): CharacterZineCard | null { return this.state.cards[index] ?? null; }
  isFeatured(index: number): boolean { return this.state.featured.includes(index); }
  featuredCards(): CharacterZineCard[] { return featuredCharacterZineCards(this.state); }
  progress(): CharacterZineProgress { return characterZineProgress(this.state); }

  save(index: number, appearance: Appearance, options?: Parameters<typeof saveCharacterZineCard>[3]): void {
    this.state = saveCharacterZineCard(this.state, index, appearance, options);
    this.persist();
  }

  update(index: number, patch: Parameters<typeof updateCharacterZineCard>[2]): void {
    const next = updateCharacterZineCard(this.state, index, patch);
    if (next === this.state) return;
    this.state = next; this.persist();
  }

  remove(index: number): void {
    const next = removeCharacterZineCard(this.state, index);
    if (next === this.state) return;
    this.state = next; this.persist();
  }

  toggleFeatured(index: number): 'added' | 'removed' | 'full' | 'empty' {
    const next = toggleFeaturedCharacterZineCard(this.state, index);
    this.state = next.state;
    if (next.result === 'added' || next.result === 'removed') this.persist();
    return next.result;
  }

  upsertRelation(
    a: number, b: number, bondId: CharacterZineBondId, memoryId: CharacterZineMemorySceneId,
  ): boolean {
    const next = upsertCharacterZineRelation(this.state, a, b, bondId, memoryId);
    if (next === this.state) return false;
    this.state = next; this.persist(); return true;
  }

  removeRelation(a: number, b: number): boolean {
    const next = removeCharacterZineRelation(this.state, a, b);
    if (next === this.state) return false;
    this.state = next; this.persist(); return true;
  }

  episodeViews(quests: QuestState, slot: number): CharacterEpisodeView[] {
    return characterEpisodeViews(this.state, quests, slot);
  }

  archiveEpisode(
    quests: QuestState, slot: number, episodeId: CharacterEpisodeId,
  ): 'archived' | 'already' | 'not-ready' | 'missing' {
    const next = archiveCharacterEpisode(this.state, quests, slot, episodeId);
    this.state = next.state;
    if (next.result === 'archived') this.persist();
    return next.result;
  }

  replayEpisode(slot: number, episodeId: CharacterEpisodeId): 'replayed' | 'missing' {
    const next = replayCharacterEpisode(this.state, slot, episodeId);
    this.state = next.state;
    if (next.result === 'replayed') this.persist();
    return next.result;
  }

  toggleFeaturedEpisode(
    slot: number, episodeId: CharacterEpisodeId,
  ): 'added' | 'removed' | 'full' | 'missing' {
    const next = toggleFeaturedCharacterEpisode(this.state, slot, episodeId);
    this.state = next.state;
    if (next.result === 'added' || next.result === 'removed') this.persist();
    return next.result;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
