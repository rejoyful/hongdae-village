/** 무기 — 무기상점에서 코인(골드)으로 구매. 공격력 보너스가 붙는다. 가격 SSOT=서버 RPC(0012) */
export interface Weapon {
  id: string;
  name: string;
  emoji: string;
  atk: number;   // 공격력 보너스
  price: number; // 코인
}

export const WEAPONS: Weapon[] = [
  // 등급 간 공격력 차이를 크게 벌려 "바꾸면 확 세지는" 체감을 준다
  { id: 'fist', name: '맨손', emoji: '✊', atk: 0, price: 0 },
  { id: 'woodsword', name: '목검', emoji: '🥢', atk: 5, price: 30 },
  { id: 'dagger', name: '단검', emoji: '🔪', atk: 12, price: 120 },
  { id: 'bronze', name: '청동검', emoji: '🗡️', atk: 22, price: 350 },
  { id: 'steel', name: '강철검', emoji: '⚔️', atk: 40, price: 800 },
  { id: 'knight', name: '기사검', emoji: '🛡️', atk: 66, price: 1800 },
  { id: 'mithril', name: '미스릴검', emoji: '💠', atk: 100, price: 4000 },
  { id: 'dragon', name: '용검', emoji: '🐉', atk: 150, price: 8500 },
  { id: 'legend', name: '전설의 검', emoji: '🌟', atk: 220, price: 18000 },
];

export const WEAPON_MAP = new Map(WEAPONS.map((w) => [w.id, w]));
export function weaponById(id: string | null | undefined): Weapon {
  return (id && WEAPON_MAP.get(id)) || WEAPONS[0]!;
}
