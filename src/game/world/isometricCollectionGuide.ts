import { CATALOG_BY_ID } from '../../items/catalog';
import { MONSTER_MAP } from '../battle/monsters';
import { isCollectionTargetSignature } from '../progression/collectionShelf';
import { TASTE_DOMAINS } from '../progression/tasteProfile';
import type { IsoGuideStep } from '../art/isometricTerrainArt';
import type { IsoActivityKind } from './isometricVillageMap';
import { buildIsoVillageCollision } from './isometricVillageMap';
import { furnitureAcquisitionChannel, furnitureAcquisitionRoute } from '../home/furnitureWorkshop';
import { STYLE_OPTIONS, STYLE_FIELD_LABELS } from '../art/styleCatalog';
import { petById } from '../pets/pets';

export type CollectionGuidePanel = 'residents' | 'rendezvous' | 'resident-fanbook' | 'adventure-kit' | 'profile' | 'treasure' | 'guidebook' | 'collection-shelf';

type CollectionGuideDestination =
  | { mode: 'activity'; instruction: string; activityKind: IsoActivityKind }
  | { mode: 'hunt'; instruction: string; tier: number }
  | { mode: 'panel'; instruction: string; panel: CollectionGuidePanel };

export type CollectionWorldGuide =
  | {
      mode: 'activity';
      signature: string;
      title: string;
      instruction: string;
      activityKind: IsoActivityKind;
      focusItemId?: string;
    }
  | {
      mode: 'hunt';
      signature: string;
      title: string;
      instruction: string;
      tier: number;
    }
  | {
      mode: 'panel';
      signature: string;
      title: string;
      instruction: string;
      panel: CollectionGuidePanel;
    };

const METRIC_DESTINATIONS: Readonly<Record<string, CollectionGuideDestination>> = {
  rare_styles: { mode: 'activity', activityKind: 'atelier', instruction: '살림 아틀리에의 스타일 도감을 열어 보세요.' },
  lookbook_entries: { mode: 'activity', activityKind: 'atelier', instruction: '살림 아틀리에의 골목 룩북에서 의뢰를 골라 보세요.' },
  lookbook_stars: { mode: 'activity', activityKind: 'atelier', instruction: '살림 아틀리에의 룩북 의뢰에서 별을 모아 보세요.' },
  photo_cards_featured: { mode: 'activity', activityKind: 'photo', instruction: '네컷 작업실의 포토카드 스크랩북에서 최애 세 장을 전시해 보세요.' },
  taste_sets_unlocked: { mode: 'panel', panel: 'guidebook', instruction: '가이드북의 취향 세트 수첩에서 아직 봉인된 세트와 해금 방법을 확인해 보세요.' },
  collection_shelf_targets: { mode: 'panel', panel: 'collection-shelf', instruction: '가이드북 첫 장의 나의 수집 선반에서 마음에 둔 목표를 확인해 보세요.' },
  collection_shelf_kinds: { mode: 'panel', panel: 'collection-shelf', instruction: '스타일·동행·가구·생태·생활 기록 중 다른 분야도 선반에 담아 보세요.' },
  collection_shelf_completed: { mode: 'panel', panel: 'collection-shelf', instruction: '나의 수집 선반에서 이미 완성된 목표와 다음 획득 경로를 확인해 보세요.' },
  taste_showcase_entries: { mode: 'activity', activityKind: 'showcase', instruction: '중앙 광장 전시 부스에서 집과 동행의 현재 모습을 기록해 보세요.' },
  taste_showcase_stamps: { mode: 'activity', activityKind: 'showcase', instruction: '골목 취향 전시회에서 주제 조건을 읽고 최고 도장을 갱신해 보세요.' },
  taste_showcase_home_entries: { mode: 'activity', activityKind: 'showcase', instruction: '전시 부스의 사는 취향 색인에서 현재 방을 출품해 보세요.' },
  taste_showcase_pet_entries: { mode: 'activity', activityKind: 'showcase', instruction: '전시 부스의 함께하는 취향 색인에서 현재 동행을 출품해 보세요.' },
  hobby_club_chapters: { mode: 'activity', activityKind: 'clubs', instruction: '중앙 광장 게시판에서 발간할 수 있는 다음 동아리 장을 확인해 보세요.' },
  hobby_club_societies: { mode: 'activity', activityKind: 'clubs', instruction: '골목 동아리 수첩에서 아직 첫 장을 발간하지 않은 모임을 골라 보세요.' },
  hobby_club_stamps: { mode: 'activity', activityKind: 'clubs', instruction: '골목 동아리에서 가장 가까운 생활 조건의 길 안내를 눌러 보세요.' },
  hobby_club_fan_pieces: { mode: 'activity', activityKind: 'clubs', instruction: '동아리 장을 발간해 응원 키트와 아지트 장식을 함께 해금해 보세요.' },
  hobby_club_complete_kits: { mode: 'activity', activityKind: 'clubs', instruction: '골목 동아리에서 다섯 장 완성에 가까운 모임의 아지트를 확인해 보세요.' },
  hobby_club_featured: { mode: 'activity', activityKind: 'clubs', instruction: '해금한 동아리 아지트 중 좋아하는 세 곳을 대표 전시에 올려 보세요.' },
  hobby_club_room_replays: { mode: 'activity', activityKind: 'clubs', instruction: '응원 키트가 열린 아지트에서 내 캐릭터와 동행의 장면을 다시 펼쳐 보세요.' },
  starter_mentor_chapters: { mode: 'activity', activityKind: 'quest', instruction: '모험 일지 추천 탭의 첫 생활 연대기에서 보존 준비가 된 멘토 성장 장을 확인해 보세요.' },
  starter_mentor_routes: { mode: 'activity', activityKind: 'quest', instruction: '첫 생활 연대기에서 세 번째 장에 가까운 멘토 루트를 골라 보세요.' },
  starter_mentor_featured: { mode: 'activity', activityKind: 'quest', instruction: '보존한 멘토 성장 장 중 좋아하는 세 장을 대표 장면으로 전시해 보세요.' },
  starter_mentor_replays: { mode: 'activity', activityKind: 'quest', instruction: '첫 생활 연대기에서 보존한 멘토 장면을 다시 펼쳐 보세요.' },
  community_project_phases: { mode: 'activity', activityKind: 'projects', instruction: '골목 함께짓기 설계소에서 완성 준비가 된 다음 단계를 확인해 보세요.' },
  community_projects_completed: { mode: 'activity', activityKind: 'projects', instruction: '다섯 설계도의 단계 연표에서 아직 완공되지 않은 장소를 골라 보세요.' },
  community_project_contributions: { mode: 'activity', activityKind: 'projects', instruction: '골목 함께짓기에서 가장 가까운 생활 기여의 길 안내를 눌러 보세요.' },
  shared_project_contributions: { mode: 'activity', activityKind: 'projects', instruction: '골목 함께짓기의 LIVE 버튼에서 오늘 모두의 밤정원에 건넬 마음을 골라 보세요.' },
  shared_project_kinds: { mode: 'activity', activityKind: 'projects', instruction: '모두의 밤정원에서 아직 내 도감에 없는 마음을 다른 날 골라 보세요.' },
  shared_project_chapters: { mode: 'activity', activityKind: 'projects', instruction: '모두의 밤정원에서 함께한 공동 밤의 기록을 확인해 보세요.' },
  neighborhood_tour_postcards: { mode: 'activity', activityKind: 'guide', instruction: '중앙 광장 소풍 안내소에서 준비된 완주 엽서를 수첩에 찍어 보세요.' },
  neighborhood_tour_moods: { mode: 'activity', activityKind: 'guide', instruction: '골목 소풍 안내소에서 아직 걷지 않은 기분의 코스를 골라 보세요.' },
  neighborhood_tour_stops: { mode: 'activity', activityKind: 'guide', instruction: '골목 소풍 안내소에서 가장 가까운 미완료 정류장의 길 안내를 눌러 보세요.' },
  neighborhood_museum_exhibits: { mode: 'activity', activityKind: 'museum', instruction: '골목 작은 박물관에서 수령 준비가 된 다음 기념품을 확인해 보세요.' },
  neighborhood_museum_featured: { mode: 'activity', activityKind: 'museum', instruction: '골목 작은 박물관에서 수령한 기념품을 대표 진열에 올려 보세요.' },
  neighborhood_museum_wings: { mode: 'activity', activityKind: 'museum', instruction: '골목 작은 박물관의 전시관 색인에서 완성에 가까운 분야를 골라 보세요.' },
  neighborhood_museum_clues: { mode: 'activity', activityKind: 'museum', instruction: '골목 작은 박물관에서 가장 가까운 미완료 단서의 길 안내를 눌러 보세요.' },
  market_categories: { mode: 'activity', activityKind: 'market', instruction: '중앙 광장 남쪽 나눔장터에서 아직 교환하지 않은 가구 분류를 둘러보세요.' },
  market_unique_items: { mode: 'activity', activityKind: 'market', instruction: '골목 나눔장터의 이웃 선반과 내 교환 수첩에서 서로 다른 물건 기록을 확인해 보세요.' },
  market_exchanges: { mode: 'activity', activityKind: 'market', instruction: '골목 나눔장터에서 쓰지 않는 한 점을 맡기거나 이웃의 한 점을 들여 보세요.' },
  village_request_story_chapters: { mode: 'activity', activityKind: 'quest', instruction: '중앙 광장 모험 일지에서 의뢰소의 연속 이야기 서랍을 펼쳐 보세요.' },
  village_request_story_routes: { mode: 'activity', activityKind: 'quest', instruction: '골목 의뢰소의 여덟 이야기 중 아직 완결하지 않은 편지를 골라 보세요.' },
  home_unique_items: { mode: 'activity', activityKind: 'home', instruction: '나의 집 인테리어 수첩에서 서로 다른 가구를 배치해 보세요.' },
  furniture_reform_combos: { mode: 'activity', activityKind: 'home', instruction: '나의 집 리폼 공방에서 마감과 색감을 조합해 보세요.' },
  home_visits: { mode: 'activity', activityKind: 'home', instruction: '나의 집 방문 앨범에서 집들이 추억을 확인해 보세요.' },
  home_moodboard_stamps: { mode: 'activity', activityKind: 'home', instruction: '나의 집 홈 무드보드 연구실에서 12가지 장면과 완성 도장을 확인해 보세요.' },
  pet_home_personalities: { mode: 'activity', activityKind: 'home', instruction: '나의 집 동행의 자리에서 다른 성격이 좋아하는 가구를 놓아 보세요.' },
  pets_owned: { mode: 'activity', activityKind: 'petshop', instruction: '멍냥이네 가족 목록에서 새로운 동행을 만나 보세요.' },
  pet_accessories: { mode: 'activity', activityKind: 'petshop', instruction: '멍냥이네 장식 도감에서 동행 장식을 골라 보세요.' },
  pet_outing_stamps: { mode: 'activity', activityKind: 'petshop', instruction: '멍냥이네 산책 수첩에서 오늘의 골목을 골라 보세요.' },
  pet_home_memories: { mode: 'activity', activityKind: 'home', instruction: '나의 집 동행의 자리 수첩에서 추천 가구와 생활 장면을 확인해 보세요.' },
  garden_species: { mode: 'activity', activityKind: 'garden', instruction: '옥상 정원의 씨앗 서랍에서 아직 키우지 않은 식물을 골라 보세요.' },
  garden_specimens: { mode: 'activity', activityKind: 'garden', instruction: '옥상 정원에서 서로 다른 성장 결을 표본으로 남겨 보세요.' },
  cooking_recipes: { mode: 'activity', activityKind: 'kitchen', instruction: '골목 주방의 메뉴 카드에서 새 요리를 완성해 보세요.' },
  cooking_plates: { mode: 'activity', activityKind: 'kitchen', instruction: '골목 주방에서 성장 결이 다른 재료로 접시 기록을 채워 보세요.' },
  fishing_species: { mode: 'activity', activityKind: 'fishing', instruction: '물정원 낚시 수첩에서 아직 만나지 못한 생물을 찾아보세요.' },
  fishing_stamps: { mode: 'activity', activityKind: 'fishing', instruction: '세 물가를 오가며 동·은·금 크기 도장을 모아 보세요.' },
  residents_met: { mode: 'panel', panel: 'residents', instruction: '주민 수첩의 인연 지도에서 아직 인사하지 않은 이웃을 찾아보세요.' },
  resident_trust_max: { mode: 'panel', panel: 'residents', instruction: '주민 수첩에서 가까워지고 싶은 이웃의 관계 앨범을 확인해 보세요.' },
  resident_rendezvous_scenes: { mode: 'panel', panel: 'rendezvous', instruction: '주민 수첩의 약속 앨범에서 지금 기록할 수 있는 장면을 확인해 보세요.' },
  resident_rendezvous_completed: { mode: 'panel', panel: 'rendezvous', instruction: '주민 약속 수첩에서 세 번째 장면에 가까운 이웃을 확인해 보세요.' },
  resident_fan_favorites: { mode: 'panel', panel: 'resident-fanbook', instruction: '주민 수첩의 최애 팬북에서 세 응원석을 마음대로 골라 보세요.' },
  resident_fan_ribbons: { mode: 'panel', panel: 'resident-fanbook', instruction: '최애 팬북에서 주민별 다섯 응원 리본과 다음 신뢰 단계를 확인해 보세요.' },
  adventure_roles_tried: { mode: 'panel', panel: 'adventure-kit', instruction: '골목 원정 키트에서 네 역할을 자유롭게 바꿔 보고 내 전투 취향을 찾아보세요.' },
  adventure_kits_saved: { mode: 'panel', panel: 'adventure-kit', instruction: '골목 원정 키트 보관함에 역할과 두 부적 조합을 저장해 보세요.' },
  village_profile_frames: { mode: 'panel', panel: 'profile', instruction: '내 마을 명함에서 생활 기록으로 열린 프레임을 확인해 보세요.' },
  village_profile_badges: { mode: 'panel', panel: 'profile', instruction: '내 마을 명함에 가장 아끼는 배지 세 개를 골라 전시해 보세요.' },
  village_profile_specialties: { mode: 'panel', panel: 'profile', instruction: '내 마을 명함에서 대표 생활 전문성 카드를 확인해 보세요.' },
  village_profile_photo_cards: { mode: 'panel', panel: 'profile', instruction: '내 마을 명함에서 공개할 최애 포토카드 세 장을 확인해 보세요.' },
  village_profile_showcase_slots: { mode: 'panel', panel: 'profile', instruction: '마을 명함의 생활 전문성과 최애 포토카드 공개 슬롯을 채워 보세요.' },
  monster_species: { mode: 'hunt', tier: 1, instruction: '동쪽 연결도로 끝의 외곽숲에서 새로운 생태를 관찰해 보세요.' },
  treasures_owned: { mode: 'panel', panel: 'treasure', instruction: '보물 도감에서 모은 조각을 복원해 진열장에 채워 보세요.' },
};

const metricLabel = (key: string): string | null => {
  const showcaseLabels: Readonly<Record<string, string>> = {
    taste_showcase_entries: '주민 전시 주제',
    taste_showcase_stamps: '주민 전시 도장',
    hobby_club_chapters: '동아리 발간 장',
    hobby_club_societies: '활동 동아리',
    hobby_club_stamps: '동아리 생활 기록',
    hobby_club_fan_pieces: '동아리 응원 키트',
    hobby_club_complete_kits: '완성한 동아리 키트',
    hobby_club_featured: '대표 아지트 전시',
    hobby_club_room_replays: '다시 펼친 아지트 장면',
    starter_mentor_chapters: '보존한 멘토 성장 장',
    starter_mentor_routes: '완주한 첫 생활 루트',
    starter_mentor_featured: '대표 성장 장면',
    starter_mentor_replays: '다시 펼친 멘토 장면',
    community_project_phases: '함께짓기 완성 단계',
    community_projects_completed: '완공된 공용 장소',
    community_project_contributions: '공동 생활 기여',
    shared_project_contributions: '밤정원에 건넨 마음',
    shared_project_kinds: '밤정원 마음 도감',
    shared_project_chapters: '함께한 공동 밤',
    neighborhood_tour_postcards: '골목 소풍 완주 엽서',
    neighborhood_tour_moods: '소풍 기분 색인',
    neighborhood_tour_stops: '기록한 소풍 정류장',
    neighborhood_museum_exhibits: '생활 기념품',
    neighborhood_museum_featured: '박물관 대표 진열',
    neighborhood_museum_wings: '완성 생활 전시관',
    neighborhood_museum_clues: '박물관 생활 단서',
    market_categories: '장터 교환 분류',
    market_unique_items: '장터 교환 물건',
    market_exchanges: '이웃 장터 교환',
    village_request_story_chapters: '연속 의뢰 이야기',
    village_request_story_routes: '완결한 골목 편지',
    taste_sets_unlocked: '통합 취향 세트',
    collection_shelf_targets: '마음에 둔 수집 목표',
    collection_shelf_kinds: '선반의 취향 분야',
    collection_shelf_completed: '완성된 선반 목표',
    resident_rendezvous_scenes: '주민 약속 장면',
    resident_rendezvous_completed: '완결한 주민 인연',
    village_profile_frames: '마을 명함 프레임',
    village_profile_badges: '명함 대표 배지',
    village_profile_specialties: '명함 생활 전문성',
    village_profile_photo_cards: '명함 최애 포토카드',
    village_profile_showcase_slots: '명함 공개 쇼케이스',
  };
  if (showcaseLabels[key]) return showcaseLabels[key];
  for (const domain of TASTE_DOMAINS) {
    const metric = domain.metrics.find((candidate) => candidate.key === key);
    if (metric) return metric.label;
  }
  return null;
};

/** 수집 목표를 실제 아이소메트릭 활동·외곽숲·전용 수첩 중 하나로 결정한다. */
export function collectionWorldGuide(signature: string): CollectionWorldGuide | null {
  if (typeof signature !== 'string') return null;
  const separator = signature.indexOf(':');
  if (separator < 1) return null;
  const kind = signature.slice(0, separator);
  const id = signature.slice(separator + 1);
  if (kind !== 'metric' && !isCollectionTargetSignature(signature)) return null;
  if (kind === 'item') {
    const item = CATALOG_BY_ID.get(id);
    if (!item) return null;
    return {
      mode: 'activity', signature, title: item.name,
      activityKind: furnitureAcquisitionChannel(item.id) === 'diy' ? 'workshop' : 'shop', focusItemId: item.id,
      instruction: `${furnitureAcquisitionRoute(item.id)}로 안내할게요.`,
    };
  }
  if (kind === 'monster') {
    const species = MONSTER_MAP.get(id);
    if (!species) return null;
    return {
      mode: 'hunt', signature, title: `T${species.tier} 생태`, tier: species.tier,
      instruction: `동쪽 외곽숲의 T${species.tier} 생태 구역으로 안내할게요.`,
    };
  }
  if (kind === 'style') {
    const option = STYLE_OPTIONS.find((candidate) => candidate.id === id);
    if (!option) return null;
    return {
      mode: 'activity', signature, title: option.name, activityKind: 'atelier',
      instruction: `캐릭터 아틀리에의 ${STYLE_FIELD_LABELS[option.field]} 스타일 도감으로 안내할게요. 잠금 조건도 그 자리에서 확인할 수 있어요.`,
    };
  }
  if (kind === 'pet') {
    const pet = petById(id);
    if (!pet) return null;
    return {
      mode: 'activity', signature, title: pet.rare ? '숨은 동행' : pet.name, activityKind: 'petshop',
      instruction: pet.rare
        ? `멍냥이네 숨은 친구 기록으로 안내할게요. ${pet.hint ?? '생활 기록을 쌓으면 만날 수 있어요.'}`
        : `멍냥이네 가족 목록에서 ${pet.name}을(를) 만나 보세요.`,
    };
  }
  const destination = METRIC_DESTINATIONS[id];
  const title = metricLabel(id);
  return destination && title ? { ...destination, signature, title } as CollectionWorldGuide : null;
}

/** 현재 타일에서 목적지까지 충돌을 피하는 최단 금빛 발자국 경로를 만든다. */
export function findIsoVillageRoute(start: IsoGuideStep, goal: IsoGuideStep): IsoGuideStep[] {
  const grid = buildIsoVillageCollision();
  if (grid.isSolid(start.tx, start.ty) || grid.isSolid(goal.tx, goal.ty)) return [];
  const startKey = `${start.tx},${start.ty}`;
  const goalKey = `${goal.tx},${goal.ty}`;
  const queue: IsoGuideStep[] = [{ ...start }];
  const previous = new Map<string, string | null>([[startKey, null]]);
  const directions: ReadonlyArray<readonly [number, number]> = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor]!;
    const currentKey = `${current.tx},${current.ty}`;
    if (currentKey === goalKey) break;
    for (const [dx, dy] of directions) {
      const next = { tx: current.tx + dx, ty: current.ty + dy };
      const key = `${next.tx},${next.ty}`;
      if (previous.has(key) || grid.isSolid(next.tx, next.ty)) continue;
      previous.set(key, currentKey);
      queue.push(next);
    }
  }
  if (!previous.has(goalKey)) return [];
  const route: IsoGuideStep[] = [];
  let key: string | null = goalKey;
  while (key) {
    const parts = key.split(',');
    const tx = Number(parts[0]);
    const ty = Number(parts[1]);
    route.push({ tx, ty });
    key = previous.get(key) ?? null;
  }
  return route.reverse();
}
