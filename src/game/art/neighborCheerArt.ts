import { NEIGHBOR_CHEER_BY_ID, type NeighborCheerRecord } from '../social/neighborCheers';

export const NEIGHBOR_CHEER_ART_W = 128;
export const NEIGHBOR_CHEER_ART_H = 76;

/** 받은 응원을 자유문구 없는 작은 픽셀 우편 카드로 렌더한다. */
export function paintNeighborCheerArt(canvas: HTMLCanvasElement, record: NeighborCheerRecord): void {
  canvas.width = NEIGHBOR_CHEER_ART_W; canvas.height = NEIGHBOR_CHEER_ART_H;
  const context = canvas.getContext('2d'); if (!context) return;
  const cheer = NEIGHBOR_CHEER_BY_ID.get(record.kind); if (!cheer) return;
  context.imageSmoothingEnabled = false; context.clearRect(0, 0, 128, 76);
  context.fillStyle = '#261f1b'; context.fillRect(2, 3, 124, 70);
  context.fillStyle = '#eadfc8'; context.fillRect(5, 6, 118, 64);
  context.fillStyle = cheer.deep; context.fillRect(5, 6, 118, 8); context.fillRect(5, 64, 118, 6);
  context.fillStyle = cheer.color; context.fillRect(11, 21, 36, 34);
  context.fillStyle = '#f5ead4'; context.fillRect(15, 25, 28, 26);
  context.fillStyle = cheer.deep;
  const motif = NEIGHBOR_CHEERS_ORDER.indexOf(record.kind) % 4;
  if (motif === 0) { context.fillRect(20, 31, 18, 5); context.fillRect(26, 26, 6, 22); }
  else if (motif === 1) { context.fillRect(20, 29, 18, 15); context.fillStyle = '#f5ead4'; context.fillRect(24, 34, 10, 10); }
  else if (motif === 2) { context.fillRect(19, 30, 7, 7); context.fillRect(32, 30, 7, 7); context.fillRect(24, 38, 10, 7); }
  else { context.fillRect(27, 25, 5, 23); context.fillRect(19, 33, 21, 5); }
  context.fillStyle = cheer.deep; context.fillRect(56, 23, 52, 5); context.fillRect(56, 34, 43, 3); context.fillRect(56, 42, 49, 3);
  context.fillStyle = cheer.color; context.fillRect(56, 51, 30, 5);
  context.fillStyle = '#c4a66a'; context.fillRect(109, 18, 8, 8); context.fillStyle = '#eadfc8'; context.fillRect(111, 20, 4, 4);
}

const NEIGHBOR_CHEERS_ORDER = ['style', 'home', 'companion', 'garden', 'table', 'water', 'neighbor', 'adventure'] as const;
