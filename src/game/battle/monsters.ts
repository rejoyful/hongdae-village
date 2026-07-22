/**
 * 몬스터 도감 — 6티어 × 5종 = 30종. 위 티어일수록 강하다(HP·공격·경험치↑).
 * 사냥터에서 현재 티어 몬스터가 출몰하고, 티어 처치 할당량을 채우면 다음 티어가 나온다.
 * 처치 보상은 경험치(로컬 진행) + 소량 조각(로컬). 코인은 서버 권한이라 드롭하지 않는다.
 */
export type MonsterShape = 'slime' | 'horned' | 'spiky' | 'ghost' | 'winged' | 'golem';

export interface MonsterSpecies {
  id: string;
  name: string;
  tier: number;       // 1..6
  shape: MonsterShape;
  body: number; dark: number; eye: number; accent?: number;
  hp: number;         // 최대 체력
  atk: number;        // 플레이어에게 주는 피해
  xp: number;         // 처치 시 경험치
  shard: number;      // 처치 시 조각 드롭(확률적으로 지급)
}

const T = (
  tier: number, shape: MonsterShape, body: number, dark: number, eye: number,
  hp: number, atk: number, xp: number, shard: number, accent?: number,
) => ({ tier, shape, body, dark, eye, hp, atk, xp, shard, accent });

/** 티어별 5종 (id/name은 아래에서 부여) */
export const MONSTERS: MonsterSpecies[] = [
  // ── 티어 1: 약골 (숲 언저리) ──
  { id: 'slime_g', name: '초록 슬라임', ...T(1, 'slime', 0x7ec86a, 0x4e9a48, 0x2a3a2a, 14, 2, 9, 1) },
  { id: 'acornbug', name: '도토리벌레', ...T(1, 'horned', 0xb98a5c, 0x8a6a44, 0x2a2420, 16, 2, 10, 1, 0x6e4a30) },
  { id: 'molelet', name: '아기 두더지', ...T(1, 'slime', 0x9a8a7c, 0x6e6058, 0x2a2420, 15, 3, 10, 1) },
  { id: 'glowmoth', name: '반딧불나방', ...T(1, 'winged', 0xe8d86a, 0xc0a83c, 0x4a3a10, 12, 2, 9, 1, 0xfff2a0) },
  { id: 'nutsquirrel', name: '말썽 다람쥐', ...T(1, 'horned', 0xc89a6a, 0x9a6e44, 0x2a2420, 18, 3, 12, 1, 0xe0c090) },
  // ── 티어 2: 골목 잡몹 ──
  { id: 'slime_b', name: '파랑 슬라임', ...T(2, 'slime', 0x6aa0e0, 0x3a6ab0, 0x1a2a3a, 30, 5, 20, 1) },
  { id: 'hedgehog', name: '가시 고슴도치', ...T(2, 'spiky', 0x9a7a5c, 0x6e5440, 0x2a2420, 34, 6, 24, 1) },
  { id: 'mudgolem', name: '진흙 골렘', ...T(2, 'golem', 0x8a6e4c, 0x5c4630, 0x3a2e20, 40, 5, 26, 2, 0xa88a5c) },
  { id: 'cavebat', name: '동굴 박쥐', ...T(2, 'winged', 0x6a5a7a, 0x453a52, 0xe86a6a, 26, 6, 22, 1) },
  { id: 'angryraccoon', name: '성난 너구리', ...T(2, 'horned', 0x8a8a92, 0x5a5a62, 0x2a2420, 35, 6, 25, 2, 0xd8d8e0) },
  // ── 티어 3: 정령·도깨비 ──
  { id: 'firegoblin', name: '불 도깨비', ...T(3, 'horned', 0xe8623c, 0xb03a1c, 0xfff2a0, 58, 9, 40, 2, 0xf2a83c) },
  { id: 'icewisp', name: '얼음 정령', ...T(3, 'ghost', 0x9cd8e8, 0x5aa0c0, 0x2a4a5a, 52, 8, 38, 2, 0xffffff) },
  { id: 'toadstool', name: '독버섯', ...T(3, 'slime', 0xc85a7c, 0x9a3a58, 0xfff2ea, 60, 9, 42, 2, 0xf2e0e8) },
  { id: 'cyclonebird', name: '회오리 새', ...T(3, 'winged', 0x7ec0a0, 0x4e9070, 0x2a3a2a, 55, 10, 44, 2, 0xd8f2e0) },
  { id: 'rockcrab', name: '바위 게', ...T(3, 'golem', 0x9a8a7c, 0x6a5a4c, 0xe86a6a, 70, 8, 46, 2, 0xc4b49c) },
  // ── 티어 4: 어둠·강철 ──
  { id: 'shadowwolf', name: '그림자 늑대', ...T(4, 'horned', 0x4a4458, 0x2a2434, 0xe8623c, 95, 15, 68, 2) },
  { id: 'thunderimp', name: '번개 임프', ...T(4, 'winged', 0xe8d84c, 0xb0a02c, 0x2a2410, 90, 16, 66, 2, 0xfff2a0) },
  { id: 'curseddoll', name: '저주 인형', ...T(4, 'ghost', 0xd8c8b0, 0xa89880, 0xe83a3a, 100, 14, 70, 3, 0x8a3a3a) },
  { id: 'tentacle', name: '촉수 슬라임', ...T(4, 'slime', 0x8a5aa8, 0x5a3a70, 0xfff2a0, 110, 15, 74, 3, 0xb08ad0) },
  { id: 'steelscorpion', name: '강철 전갈', ...T(4, 'spiky', 0x8a94a0, 0x5a6470, 0xe86a6a, 120, 18, 80, 3, 0xc0cad6) },
  // ── 티어 5: 용·망령 ──
  { id: 'flamedrake', name: '화염 드레이크', ...T(5, 'winged', 0xe84a2c, 0xa82a10, 0xfff2a0, 160, 24, 115, 3, 0xf2903c) },
  { id: 'frostgolem', name: '서리 골렘', ...T(5, 'golem', 0xa0d0e8, 0x60a0c8, 0x2a4a5a, 200, 22, 125, 3, 0xe0f2ff) },
  { id: 'wraithknight', name: '망령 기사', ...T(5, 'ghost', 0x5a6a7a, 0x3a4a5a, 0x8ae8e8, 180, 26, 130, 3, 0x9ab0c0) },
  { id: 'venomserpent', name: '독룡 뱀', ...T(5, 'horned', 0x6ab04a, 0x3a7a2a, 0xf2f24a, 175, 25, 128, 3, 0xa8e888) },
  { id: 'stormgriffin', name: '폭풍 그리핀', ...T(5, 'winged', 0xd8c8a0, 0xa89870, 0x2a2410, 190, 28, 140, 4, 0xf2e8c8) },
  // ── 티어 6: 보스급 ──
  { id: 'demondragon', name: '마룡', ...T(6, 'winged', 0x8a2a3a, 0x5a1420, 0xffe04a, 280, 36, 210, 5, 0xe85a6a) },
  { id: 'abysslord', name: '심연 군주', ...T(6, 'ghost', 0x2e2440, 0x1a1428, 0xa86ad0, 300, 38, 230, 5, 0x6a4a9a) },
  { id: 'destroyergolem', name: '파괴자 골렘', ...T(6, 'golem', 0x6a5a4a, 0x3a2e20, 0xe8623c, 340, 34, 250, 6, 0x9a8464) },
  { id: 'darkwitch', name: '어둠 마녀', ...T(6, 'horned', 0x5a2a6a, 0x3a1444, 0xf2f24a, 300, 40, 240, 5, 0x9a5ac0) },
  { id: 'worldtree', name: '세계수 정령', ...T(6, 'golem', 0x4e8a5a, 0x2e5a38, 0xfff2a0, 360, 36, 280, 7, 0x8ad0a0) },
];

export const MONSTER_MAP = new Map(MONSTERS.map((m) => [m.id, m]));
export const MAX_TIER = 6;

/** 해당 티어의 몬스터 종 */
export function monstersOfTier(tier: number): MonsterSpecies[] {
  return MONSTERS.filter((m) => m.tier === tier);
}

/** 티어를 클리어하는 데 필요한 처치 수 — 수십 마리, 위 티어일수록 많이 */
export function tierQuota(tier: number): number {
  return 15 + tier * 5; // 티어1=20 … 티어6=45
}
