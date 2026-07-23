import type { QuestCategory } from '../quests';

export const QUEST_MILESTONE_ART_W = 72;
export const QUEST_MILESTONE_ART_H = 64;

const PALETTE: Record<QuestCategory, { dark: string; mid: string; light: string; mark: string }> = {
  onboarding: { dark: '#55422e', mid: '#d7aa67', light: '#fff0bd', mark: '길' },
  daily: { dark: '#304b46', mid: '#77a58d', light: '#dcf2cc', mark: '오늘' },
  story: { dark: '#4c3541', mid: '#b87579', light: '#f6d0b0', mark: '서' },
  collection: { dark: '#30445a', mid: '#6f95b2', light: '#d5edf1', mark: '수' },
  mastery: { dark: '#493757', mid: '#9b77ad', light: '#ead7f1', mark: '숙' },
};

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 완료 카드 왼쪽의 작은 아이소메트릭 기록책·왁스 도장 픽셀 일러스트. */
export function paintQuestMilestoneArt(ctx: CanvasRenderingContext2D, category: QuestCategory): void {
  const palette = PALETTE[category];
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, QUEST_MILESTONE_ART_W, QUEST_MILESTONE_ART_H);

  // faint celebratory pixels
  px(ctx, palette.mid, 7, 8, 3, 3);
  px(ctx, palette.light, 57, 6, 4, 4);
  px(ctx, palette.mid, 63, 19, 2, 5);
  px(ctx, palette.light, 12, 48, 3, 3);

  // isometric archive book
  ctx.beginPath();
  ctx.moveTo(9, 27); ctx.lineTo(34, 16); ctx.lineTo(62, 26); ctx.lineTo(36, 38); ctx.closePath();
  ctx.fillStyle = '#f0d9a4'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9, 27); ctx.lineTo(36, 38); ctx.lineTo(36, 50); ctx.lineTo(9, 39); ctx.closePath();
  ctx.fillStyle = '#8c684c'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(36, 38); ctx.lineTo(62, 26); ctx.lineTo(62, 38); ctx.lineTo(36, 50); ctx.closePath();
  ctx.fillStyle = palette.dark; ctx.fill();
  px(ctx, '#4a382d', 34, 18, 3, 18);
  px(ctx, '#b89b6e', 17, 26, 14, 2);
  px(ctx, '#b89b6e', 41, 27, 13, 2);

  // raised wax seal
  px(ctx, '#241e23', 26, 30, 23, 23);
  px(ctx, palette.mid, 28, 29, 19, 19);
  px(ctx, palette.light, 31, 32, 13, 13);
  px(ctx, palette.dark, 33, 34, 9, 9);
  ctx.fillStyle = palette.light;
  ctx.font = `900 ${palette.mark.length > 1 ? 6 : 9}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(palette.mark, 37.5, 38.5);

  // ribbon tails
  ctx.beginPath();
  ctx.moveTo(31, 47); ctx.lineTo(35, 47); ctx.lineTo(32, 58); ctx.lineTo(29, 53); ctx.closePath();
  ctx.fillStyle = palette.mid; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(40, 47); ctx.lineTo(44, 46); ctx.lineTo(47, 56); ctx.lineTo(42, 53); ctx.closePath();
  ctx.fillStyle = palette.dark; ctx.fill();
}
