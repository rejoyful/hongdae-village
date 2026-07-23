import type { AdventurePathId, AdventurePathView } from '../progression/adventurePaths';

export const ADVENTURE_PATH_ART_W = 128;
export const ADVENTURE_PATH_ART_H = 46;

const color = (hex: string): string => hex.startsWith('#') ? hex : `#${hex}`;

/** 여덟 장기 진로를 작은 밤 골목 노선도로 그린다. */
export function paintAdventurePathArt(
  context: CanvasRenderingContext2D,
  paths: AdventurePathView[],
  selectedId: AdventurePathId,
): void {
  const selected = paths.find((path) => path.id === selectedId) ?? paths[0];
  context.clearRect(0, 0, ADVENTURE_PATH_ART_W, ADVENTURE_PATH_ART_H);
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#171922'; context.fillRect(0, 0, ADVENTURE_PATH_ART_W, ADVENTURE_PATH_ART_H);
  context.fillStyle = '#232837'; context.fillRect(0, 27, ADVENTURE_PATH_ART_W, 19);
  context.fillStyle = '#30364a'; context.fillRect(0, 31, ADVENTURE_PATH_ART_W, 2);
  context.fillStyle = '#151823'; context.fillRect(0, 39, ADVENTURE_PATH_ART_W, 3);

  // 산책로와 홀로그램처럼 연결된 진로 불빛.
  context.fillStyle = '#6f695d'; context.fillRect(7, 35, 114, 1);
  paths.forEach((path, index) => {
    const x = 9 + index * 15;
    const active = path.id === selected?.id;
    const lit = path.completed > 0 || active;
    context.fillStyle = active ? '#f3d48b' : '#706a64'; context.fillRect(x, 33, 5, 4);
    context.fillStyle = color(path.color); context.fillRect(x + 1, 34, 3, 2);
    context.fillStyle = lit ? '#ffe6a4' : '#4d4b4d'; context.fillRect(x + 2, 34, 1, 1);
    context.fillStyle = '#12151e'; context.fillRect(x + 1, 37, 1, 2); context.fillRect(x + 3, 37, 1, 2);
    if (path.progressPct >= 100) {
      context.fillStyle = '#fff2b2'; context.fillRect(x + 2, 30, 1, 1);
      context.fillStyle = '#d6a85e'; context.fillRect(x + 1, 31, 3, 1);
    }
  });

  // 선택한 진로의 아지트를 원경 실루엣으로 표현.
  const accent = color(selected?.color ?? '#a77a58');
  context.fillStyle = '#11141d'; context.fillRect(45, 10, 38, 18);
  context.fillStyle = accent; context.fillRect(48, 8, 32, 19);
  context.fillStyle = '#171922'; context.fillRect(51, 11, 26, 16);
  context.fillStyle = accent; context.fillRect(55, 14, 5, 5); context.fillRect(68, 14, 5, 5);
  context.fillStyle = '#ffe4a0'; context.fillRect(56, 15, 3, 3); context.fillRect(69, 15, 3, 3);
  context.fillStyle = accent; context.fillRect(62, 20, 5, 7);
  context.fillStyle = '#f5d792'; context.fillRect(64, 22, 1, 1);
  context.fillStyle = '#343a4c'; context.fillRect(43, 27, 42, 2);

  context.fillStyle = '#676f86';
  for (const [x, y] of [[8, 8], [20, 15], [95, 11], [113, 6], [102, 23]] as const) context.fillRect(x, y, 1, 1);
  context.fillStyle = '#e8c982'; context.fillRect(16, 7, 1, 1); context.fillRect(105, 16, 1, 1);
}
