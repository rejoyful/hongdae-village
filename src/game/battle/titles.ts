/** 레벨 호칭 (순수·테스트 가능). 레벨이 오르면 이름 위 호칭이 승격된다 */
export interface Title { minLevel: number; name: string }

export const TITLES: Title[] = [
  { minLevel: 1, name: '새내기 모험가' },
  { minLevel: 3, name: '동네 지킴이' },
  { minLevel: 5, name: '견습 사냥꾼' },
  { minLevel: 8, name: '숲길 순찰자' },
  { minLevel: 12, name: '숙련된 전사' },
  { minLevel: 18, name: '몬스터 헌터' },
  { minLevel: 25, name: '베테랑 용사' },
  { minLevel: 35, name: '몬스터 슬레이어' },
  { minLevel: 50, name: '전설의 영웅' },
];

/** 해당 레벨의 호칭 */
export function titleForLevel(level: number): string {
  let t = TITLES[0]!.name;
  for (const x of TITLES) if (level >= x.minLevel) t = x.name;
  return t;
}

/** 이 레벨에서 새 호칭으로 승격되는지 (레벨업 연출용) */
export function isTitleUpAt(level: number): boolean {
  return TITLES.some((x) => x.minLevel === level);
}
