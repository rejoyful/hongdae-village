/**
 * 펫 종류 (펫샵에서 입양해 데리고 다닌다).
 * 가격은 서버 adopt_pet RPC(0011)와 반드시 동일하게 유지 — 서버가 진짜 가격의 SSOT.
 * 오프라인/미적용 서버에서는 무료 입양(코스메틱)로 폴백한다.
 */
export type EarType = 'up' | 'longup' | 'round' | 'floppy' | 'none';
export type TailType = 'curl' | 'puff' | 'long' | 'longtip' | 'none';

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
}

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
];

export const PET_MAP: Map<string, PetSpecies> = new Map(PET_SPECIES.map((p) => [p.id, p]));

export function petById(id: string | null | undefined): PetSpecies | null {
  return id ? (PET_MAP.get(id) ?? null) : null;
}
