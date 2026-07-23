import { LIFE_SPECIALTY_CARDS } from '../progression/lifeSpecialty';
import type { DailyInvitationView } from '../progression/dailyInvitations';

export const DAILY_INVITATION_ART_W = 120;
export const DAILY_INVITATION_ART_H = 72;

/** 매일의 생활 제안을 우편함에서 꺼낸 작은 픽셀 엽서처럼 그린다. */
export function paintDailyInvitationArt(canvas: HTMLCanvasElement, invitation: DailyInvitationView): void {
  canvas.width = DAILY_INVITATION_ART_W; canvas.height = DAILY_INVITATION_ART_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 120, 72);
  const palette = LIFE_SPECIALTY_CARDS.find((card) => card.masteryId === invitation.masteryId)?.palette
    ?? ['#d9c49c', '#9b7757', '#4d3c31'] as const;
  const [paper, accent, ink] = palette;
  ctx.fillStyle = '#211a16'; ctx.fillRect(2, 3, 116, 66);
  ctx.fillStyle = invitation.claimed ? '#c8ad70' : paper; ctx.fillRect(5, 5, 110, 62);
  ctx.fillStyle = ink; ctx.fillRect(8, 8, 104, 3); ctx.fillRect(8, 61, 104, 3);
  ctx.fillStyle = accent; ctx.fillRect(12, 17, 34, 34);
  ctx.fillStyle = paper; ctx.fillRect(16, 21, 26, 26);
  ctx.fillStyle = ink;
  const motif = (invitation.id.length + invitation.goal) % 3;
  if (motif === 0) { ctx.fillRect(21, 25, 16, 4); ctx.fillRect(27, 20, 4, 24); ctx.fillRect(21, 37, 16, 4); }
  else if (motif === 1) { ctx.fillRect(20, 24, 5, 18); ctx.fillRect(34, 24, 5, 18); ctx.fillRect(25, 30, 9, 5); }
  else { ctx.fillRect(21, 22, 16, 5); ctx.fillRect(18, 27, 5, 12); ctx.fillRect(35, 27, 5, 12); ctx.fillRect(23, 39, 12, 5); }
  ctx.fillStyle = ink; ctx.fillRect(54, 19, 48, 4); ctx.fillRect(54, 29, 40, 3); ctx.fillRect(54, 38, 49, 3);
  ctx.fillStyle = accent; ctx.fillRect(54, 48, 34, 5);
  if (invitation.done) { ctx.fillStyle = '#f0cf70'; ctx.fillRect(100, 8, 10, 10); ctx.fillStyle = ink; ctx.fillRect(104, 9, 2, 8); ctx.fillRect(101, 12, 8, 2); }
}
