import { CATALOG_BY_ID } from '../../items/catalog';
import type { MarketListing } from '../social/neighborhoodMarket';

const W = 280;
const H = 112;
const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

/** 실제 장터 카드의 아이템색을 작은 2.5D 밤장터 풍경에 다시 쓰는 픽셀 헤더. */
export function paintNeighborhoodMarketArt(
  canvas: HTMLCanvasElement,
  listings: readonly MarketListing[],
  favoriteItemIds: readonly string[],
): void {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  rect(ctx, '#292b3c', 0, 0, W, 62);
  rect(ctx, '#48584f', 0, 62, W, 50);
  for (let x = 9; x < W; x += 19) {
    rect(ctx, x % 3 ? '#ead898' : '#a8c0b0', x, 8 + ((x * 5) % 23), 2, 2);
  }
  // 아이소메트릭 골목 바닥
  for (let row = 0; row < 6; row++) {
    const y = 62 + row * 8;
    rect(ctx, row % 2 ? '#776e5d' : '#837963', 12 - row * 8, y, 256 + row * 16, 8);
    for (let x = 18 - row * 8; x < 260 + row * 8; x += 20) rect(ctx, '#958a72', x, y + 1, 13, 1);
  }
  // 천막과 전구
  rect(ctx, '#493b3e', 38, 27, 204, 6);
  for (let x = 42; x < 238; x += 16) {
    rect(ctx, '#d5b66f', x, 32, 2, 6);
    rect(ctx, favoriteItemIds.length && x / 16 <= favoriteItemIds.length + 2 ? '#ffe58a' : '#f1ce79', x - 1, 38, 4, 4);
  }
  rect(ctx, '#c17b65', 45, 43, 92, 9); rect(ctx, '#e0b584', 137, 43, 96, 9);
  for (let x = 45; x < 233; x += 16) rect(ctx, x < 137 ? '#eed2ae' : '#ab6258', x, 43, 8, 9);
  rect(ctx, '#5b4338', 49, 52, 5, 48); rect(ctx, '#5b4338', 224, 52, 5, 48);
  // 진열 선반
  rect(ctx, '#4a3934', 61, 67, 152, 5); rect(ctx, '#74574a', 57, 72, 160, 18);
  rect(ctx, '#302d32', 61, 90, 152, 4);
  const shown = listings.slice(0, 6);
  shown.forEach((listing, index) => {
    const item = CATALOG_BY_ID.get(listing.itemId);
    if (!item) return;
    const x = 65 + index * 25;
    rect(ctx, '#d5c59f', x, 58, 18, 14);
    rect(ctx, `#${item.color}`, x + 2, 60, 14, 10);
    if (favoriteItemIds.includes(item.id)) {
      rect(ctx, '#9f4f64', x + 12, 56, 5, 4); rect(ctx, '#9f4f64', x + 14, 54, 2, 7);
    }
  });
  // 두 이웃
  rect(ctx, '#372d31', 24, 57, 13, 12); rect(ctx, '#d4a384', 26, 60, 9, 8);
  rect(ctx, '#6f8873', 22, 69, 17, 21); rect(ctx, '#33313b', 24, 90, 6, 15); rect(ctx, '#33313b', 32, 90, 6, 15);
  rect(ctx, '#45323a', 243, 57, 13, 12); rect(ctx, '#c89578', 245, 60, 9, 8);
  rect(ctx, '#88708c', 241, 69, 17, 21); rect(ctx, '#33313b', 243, 90, 6, 15); rect(ctx, '#33313b', 251, 90, 6, 15);
  // 가격표 세 장
  ['#6f9478', '#d19b61', '#9b718e'].forEach((color, index) => {
    rect(ctx, '#352f34', 91 + index * 36, 96, 29, 12);
    rect(ctx, color, 93 + index * 36, 98, 25, 8);
  });
  rect(ctx, '#d8bd78', 0, 0, W, 2); rect(ctx, '#7d5f52', 0, H - 2, W, 2);
}
