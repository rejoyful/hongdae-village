/**
 * 펫 종류 (펫샵에서 입양해 데리고 다닌다).
 * 가격은 서버 adopt_pet RPC(0011)와 반드시 동일하게 유지 — 서버가 진짜 가격의 SSOT.
 * 오프라인/미적용 서버에서는 무료 입양(코스메틱)로 폴백한다.
 */
export type EarType = 'up' | 'longup' | 'round' | 'floppy' | 'none';
export type TailType = 'curl' | 'puff' | 'long' | 'longtip' | 'none';

/** 희귀 펫 해금 조건 id — checkUnlocks(stats)에서 평가 */
export type UnlockCond = 'maxAffinity100' | 'owned5' | 'feeds20';

export interface PetSpecies {
  id: string;
  name: string;
  emoji: string;
  price: number;
  body: number; belly: number; dark: number; ear: number;
  earType: EarType;
  tail: TailType;
  accent?: number; // 부리·발 등 포인트
  blurb: string;
  rare?: boolean;        // 희귀(히든) — 상점 구매 불가, 조건 달성 시 발견
  unlock?: UnlockCond;   // 해금 조건
  hint?: string;         // 잠금 상태에서 보여줄 힌트
}

/** 친밀도 성장 단계 (0~100). 인덱스 = petStage() */
export const PET_STAGES = ['낯가림', '친해지는 중', '단짝', '영혼의 단짝'] as const;
export function petStage(affinity: number): number {
  return affinity >= 80 ? 3 : affinity >= 50 ? 2 : affinity >= 25 ? 1 : 0;
}

/** 최대 친밀도 */
export const AFFINITY_MAX = 100;

export const PET_SPECIES: PetSpecies[] = [
  { id: 'dog', name: '강아지', emoji: '🐶', price: 120,
    body: 0xb98a5c, belly: 0xe6d2ac, dark: 0x8a6a44, ear: 0x7a5636,
    earType: 'floppy', tail: 'curl', blurb: '충성심 만렙, 산책 좋아' },
  { id: 'cat', name: '고양이', emoji: '🐱', price: 120,
    body: 0x9a9490, belly: 0xdcd8d0, dark: 0x6e6864, ear: 0xe8a0a0,
    earType: 'up', tail: 'long', blurb: '새침한 매력의 골목대장' },
  { id: 'rabbit', name: '토끼', emoji: '🐰', price: 150,
    body: 0xf2ece0, belly: 0xffffff, dark: 0xcfc8ba, ear: 0xf2c0d0,
    earType: 'longup', tail: 'puff', blurb: '깡총깡총 폭신 솜뭉치' },
  { id: 'chick', name: '병아리', emoji: '🐤', price: 90,
    body: 0xf2d84c, belly: 0xf6e88a, dark: 0xd8b82c, ear: 0xd8b82c,
    earType: 'none', tail: 'puff', accent: 0xf2903c, blurb: '삐약삐약 노란 봄기운' },
  { id: 'hamster', name: '햄스터', emoji: '🐹', price: 90,
    body: 0xe0c09a, belly: 0xf4ead8, dark: 0xc09a6a, ear: 0xb88a6a,
    earType: 'round', tail: 'none', blurb: '볼주머니 빵빵 먹보' },
  { id: 'fox', name: '여우', emoji: '🦊', price: 200,
    body: 0xe8823c, belly: 0xf4ead6, dark: 0xc45a24, ear: 0x2e2620,
    earType: 'up', tail: 'longtip', blurb: '영리한 골목의 요정' },
  { id: 'penguin', name: '펭귄', emoji: '🐧', price: 220,
    body: 0x3a3f52, belly: 0xf4f4ec, dark: 0x2a2e3c, ear: 0x3a3f52,
    earType: 'none', tail: 'none', accent: 0xf2a83c, blurb: '뒤뚱뒤뚱 턱시도 신사' },
  { id: 'panda', name: '판다', emoji: '🐼', price: 260,
    body: 0xf4f4ec, belly: 0xf4f4ec, dark: 0x2e2620, ear: 0x2e2620,
    earType: 'round', tail: 'none', blurb: '느긋한 대나무 러버' },
  // ── 희귀(히든) — 구매 불가, 노가다 조건 달성 시 발견 ──
  { id: 'goldcat', name: '황금 고양이', emoji: '🌟', price: 0, rare: true,
    unlock: 'maxAffinity100', hint: '펫 하나와 「영혼의 단짝」이 되면 나타나요',
    body: 0xf2c84c, belly: 0xfced9a, dark: 0xc89a2c, ear: 0xe8a0a0,
    earType: 'up', tail: 'long', blurb: '전설의 황금 길냥이' },
  { id: 'rainbowdog', name: '무지개 강아지', emoji: '🌈', price: 0, rare: true,
    unlock: 'owned5', hint: '기본 펫을 5종 이상 입양하면 찾아와요',
    body: 0xe89ab8, belly: 0xf6e0ea, dark: 0x8a6ad8, ear: 0x6a8ad8,
    earType: 'floppy', tail: 'curl', blurb: '무지개를 몰고 다니는 멍멍이' },
  { id: 'starbunny', name: '별토끼', emoji: '✨', price: 0, rare: true,
    unlock: 'feeds20', hint: '펫에게 먹이를 20번 주면 별을 타고 와요',
    body: 0xb8a0e0, belly: 0xf2ecff, dark: 0x8a6ad8, ear: 0xf2c84c,
    earType: 'longup', tail: 'puff', blurb: '별가루를 흩뿌리는 토끼' },
];

/** 기본(구매 가능) 펫 8종 */
export const BASE_SPECIES = PET_SPECIES.filter((p) => !p.rare);
/** 희귀(발견) 펫 */
export const RARE_SPECIES = PET_SPECIES.filter((p) => p.rare);

/** 통계로 새로 해금되는 희귀 펫 id 목록 (이미 해금된 것 제외는 호출측 책임) */
export function evalUnlocks(stats: { maxAffinity: number; ownedBase: number; feeds: number }): string[] {
  return RARE_SPECIES.filter((p) => {
    if (p.unlock === 'maxAffinity100') return stats.maxAffinity >= AFFINITY_MAX;
    if (p.unlock === 'owned5') return stats.ownedBase >= 5;
    if (p.unlock === 'feeds20') return stats.feeds >= 20;
    return false;
  }).map((p) => p.id);
}

export const PET_MAP: Map<string, PetSpecies> = new Map(PET_SPECIES.map((p) => [p.id, p]));

export function petById(id: string | null | undefined): PetSpecies | null {
  return id ? (PET_MAP.get(id) ?? null) : null;
}
