import { VILLAGE_LEVEL_REWARDS, type VillageRewardPetAccessoryId } from '../progression/villageRewards';
import {
  REQUEST_STORY_REWARDS, type RequestStoryRewardPetAccessoryId,
} from '../progression/requestStoryRewards';
import {
  JOURNEY_CHAPTER_REWARDS, type JourneyRewardPetAccessoryId,
} from '../progression/journeyChapterRewards';
import {
  STARTER_MENTOR_REWARDS, type StarterMentorRewardPetAccessoryId,
} from '../progression/starterMentorRewards';

export type PetPersonalityId = 'gentle' | 'curious' | 'brave' | 'playful' | 'calm' | 'performer';
export type PetAccessoryId = 'none' | 'ribbon' | 'scarf' | 'bandana' | 'glasses' | 'beret' | 'satchel' | 'crown' | VillageRewardPetAccessoryId | RequestStoryRewardPetAccessoryId | JourneyRewardPetAccessoryId | StarterMentorRewardPetAccessoryId;

export interface PetPersonalityDef {
  id: PetPersonalityId;
  mark: string;
  name: string;
  description: string;
}

export interface PetAccessoryDef {
  id: PetAccessoryId;
  mark: string;
  name: string;
  description: string;
  hint: string;
  requirement?: Partial<PetAccessoryStats>;
  requiredBadgeId?: string;
}

export interface PetAccessoryStats {
  affinity: number;
  plays: number;
  trainings: number;
  tricks: number;
  memories: number;
}

export interface PetAccessoryView extends PetAccessoryDef {
  unlocked: boolean;
  progress: number;
  goal: number;
}

export const PET_NICKNAME_MAX = 8;

export const PET_PERSONALITIES: readonly PetPersonalityDef[] = [
  { id: 'gentle', mark: '다', name: '다정한', description: '곁에 조용히 머물며 먼저 마음을 살핍니다.' },
  { id: 'curious', mark: '호', name: '호기심 많은', description: '낯선 골목과 새 물건을 그냥 지나치지 못합니다.' },
  { id: 'brave', mark: '씩', name: '씩씩한', description: '처음 보는 길에서도 한 발 먼저 나아갑니다.' },
  { id: 'playful', mark: '장', name: '장난꾸러기', description: '평범한 산책도 작은 놀이로 바꿉니다.' },
  { id: 'calm', mark: '느', name: '느긋한', description: '서두르지 않고 자기만의 속도로 하루를 즐깁니다.' },
  { id: 'performer', mark: '무', name: '무대 체질', description: '사람이 모이면 배운 트릭을 보여 주고 싶어 합니다.' },
] as const;

export const PET_ACCESSORIES: readonly PetAccessoryDef[] = [
  { id: 'none', mark: '기', name: '기본 모습', description: '본래의 털빛과 실루엣을 그대로 보여 줍니다.', hint: '언제든 선택할 수 있어요.' },
  { id: 'ribbon', mark: '리', name: '살구 리본', description: '목 옆에 작게 매는 첫 가족 선물입니다.', hint: '입양하면 바로 열려요.' },
  { id: 'scarf', mark: '목', name: '산책 목도리', description: '바람 부는 골목 산책에 어울리는 짧은 목도리입니다.', hint: '친밀도 25 달성', requirement: { affinity: 25 } },
  { id: 'bandana', mark: '놀', name: '놀이 반다나', description: '함께 뛰어논 날의 에너지를 담은 삼각 반다나입니다.', hint: '같이 놀기 3번', requirement: { plays: 3 } },
  { id: 'glasses', mark: '안', name: '연구가 안경', description: '트릭을 차근차근 익힌 영리한 친구의 둥근 안경입니다.', hint: '트릭 2개 배우기', requirement: { tricks: 2 } },
  { id: 'beret', mark: '예', name: '골목 예술가 베레', description: '연습을 꾸준히 이어 온 작은 예술가의 모자입니다.', hint: '트릭 연습 3번', requirement: { trainings: 3 } },
  { id: 'satchel', mark: '추', name: '추억 수첩 가방', description: '함께 모은 장면을 빠짐없이 적어 두는 작은 가방입니다.', hint: '펫 추억 3장 열기', requirement: { memories: 3 } },
  { id: 'crown', mark: '단', name: '단짝 왕관', description: '영혼의 단짝이 된 친구에게만 어울리는 오래된 왕관입니다.', hint: '친밀도 100 달성', requirement: { affinity: 100 } },
  ...VILLAGE_LEVEL_REWARDS.map((reward): PetAccessoryDef => ({
    ...reward.petAccessory,
    hint: `마을 Lv.${reward.level} 명찰`,
    requiredBadgeId: reward.badgeId,
  })),
  ...REQUEST_STORY_REWARDS.map((reward): PetAccessoryDef => ({
    ...reward.petAccessory,
    hint: `연속 의뢰 「${reward.title}」 완결`,
    requiredBadgeId: reward.badgeId,
  })),
  ...JOURNEY_CHAPTER_REWARDS.map((reward): PetAccessoryDef => ({
    ...reward.petAccessory,
    hint: `메인 여정 제${reward.chapter}장 완결`,
    requiredBadgeId: reward.badgeId,
  })),
  ...STARTER_MENTOR_REWARDS.map((reward): PetAccessoryDef => ({
    ...reward.petAccessory,
    hint: `첫 생활 「${reward.title}」 루트 완주`,
    requiredBadgeId: reward.badgeId,
  })),
] as const;

const PERSONALITY_IDS = new Set<string>(PET_PERSONALITIES.map((item) => item.id));
const ACCESSORY_IDS = new Set<string>(PET_ACCESSORIES.map((item) => item.id));

const DEFAULT_PERSONALITY: Readonly<Record<string, PetPersonalityId>> = {
  dog: 'brave', cat: 'calm', rabbit: 'gentle', chick: 'curious', hamster: 'playful',
  fox: 'curious', penguin: 'performer', panda: 'calm', goldcat: 'calm',
  rainbowdog: 'playful', starbunny: 'gentle',
};

export function defaultPetPersonality(speciesId: string): PetPersonalityId {
  return DEFAULT_PERSONALITY[speciesId] ?? 'gentle';
}

export function isPetPersonalityId(value: unknown): value is PetPersonalityId {
  return typeof value === 'string' && PERSONALITY_IDS.has(value);
}

export function isPetAccessoryId(value: unknown): value is PetAccessoryId {
  return typeof value === 'string' && ACCESSORY_IDS.has(value);
}

export function sanitizePetNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return [...cleaned].slice(0, PET_NICKNAME_MAX).join('');
}

function requirementProgress(requirement: Partial<PetAccessoryStats> | undefined, stats: PetAccessoryStats): { progress: number; goal: number } {
  if (!requirement) return { progress: 1, goal: 1 };
  const entries = Object.entries(requirement) as Array<[keyof PetAccessoryStats, number]>;
  const firstUnmet = entries.find(([key, goal]) => stats[key] < goal) ?? entries[0];
  if (!firstUnmet) return { progress: 1, goal: 1 };
  return { progress: Math.min(stats[firstUnmet[0]], firstUnmet[1]), goal: firstUnmet[1] };
}

export function petAccessoryViews(stats: PetAccessoryStats, unlockedBadgeIds: Iterable<string> = []): PetAccessoryView[] {
  const unlockedBadges = new Set(unlockedBadgeIds);
  return PET_ACCESSORIES.map((accessory) => {
    const requirements = Object.entries(accessory.requirement ?? {}) as Array<[keyof PetAccessoryStats, number]>;
    const badgeUnlocked = !accessory.requiredBadgeId || unlockedBadges.has(accessory.requiredBadgeId);
    const unlocked = badgeUnlocked && requirements.every(([key, goal]) => stats[key] >= goal);
    const progress = accessory.requiredBadgeId && !badgeUnlocked
      ? { progress: 0, goal: 1 }
      : requirementProgress(accessory.requirement, stats);
    return { ...accessory, unlocked, ...progress };
  });
}
