import type { ResidentRoomCareView, RoomCareHomeId } from '../residents/residentRoomCare';

export const RESIDENT_ROOM_CARE_ART_W = 240;
export const RESIDENT_ROOM_CARE_ART_H = 136;
export const RESIDENT_ROOM_CARE_KEEPSAKE_W = 144;
export const RESIDENT_ROOM_CARE_KEEPSAKE_H = 92;

const rect = (
  ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number,
): void => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

const HOME_POS: Readonly<Record<RoomCareHomeId, { x: number; y: number }>> = {
  hook: { x: 54, y: 57 },
  shelf: { x: 181, y: 66 },
  worktop: { x: 100, y: 69 },
  memory: { x: 151, y: 93 },
};

const CLUTTER_POS = [
  { x: 84, y: 106 }, { x: 122, y: 111 }, { x: 175, y: 106 }, { x: 139, y: 116 },
] as const;

function isoDiamond(
  ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, rx: number, ry: number,
): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry); ctx.lineTo(cx + rx, cy); ctx.lineTo(cx, cy + ry); ctx.lineTo(cx - rx, cy);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function drawItem(
  ctx: CanvasRenderingContext2D, mark: string, color: string, x: number, y: number, sorted: boolean,
): void {
  rect(ctx, '#18141988', x - 7, y + 5, 17, 5);
  isoDiamond(ctx, sorted ? color : '#6c5a57', x, y, 9, 5);
  rect(ctx, sorted ? color : '#544b50', x - 9, y, 18, 10);
  rect(ctx, sorted ? '#f2dfae' : '#b5a99d', x - 6, y + 2, 12, 6);
  ctx.fillStyle = sorted ? '#45353a' : '#5c5352';
  ctx.font = 'bold 6px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mark, x, y + 5);
}

function line(
  ctx: CanvasRenderingContext2D, color: string, x1: number, y1: number, x2: number, y2: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawKeepsakeObject(
  ctx: CanvasRenderingContext2D, view: ResidentRoomCareView, x: number, y: number,
): void {
  const [, mid, warm, paper] = view.palette;
  const ink = '#47383a';
  switch (view.residentId) {
    case 'haneul':
      rect(ctx, paper, x - 24, y - 18, 48, 32);
      rect(ctx, mid, x - 20, y - 14, 4, 24);
      line(ctx, ink, x - 10, y - 10, x + 18, y - 10);
      line(ctx, ink, x - 10, y - 2, x + 14, y - 2);
      ctx.fillStyle = warm; ctx.font = 'bold 18px serif'; ctx.fillText('♪', x + 5, y + 9);
      break;
    case 'moturi':
      rect(ctx, paper, x - 25, y - 18, 40, 31);
      line(ctx, mid, x - 18, y - 10, x + 8, y - 10);
      line(ctx, mid, x - 18, y - 2, x + 5, y - 2);
      rect(ctx, warm, x + 8, y + 1, 20, 13);
      rect(ctx, ink, x + 12, y - 5, 12, 8);
      break;
    case 'sallim':
      rect(ctx, warm, x - 25, y - 4, 50, 19);
      ctx.fillStyle = mid;
      ctx.beginPath(); ctx.moveTo(x - 28, y - 4); ctx.lineTo(x, y - 26); ctx.lineTo(x + 28, y - 4); ctx.fill();
      rect(ctx, paper, x - 5, y + 3, 10, 12);
      line(ctx, ink, x - 19, y + 9, x + 19, y + 9);
      break;
    case 'jun':
      rect(ctx, paper, x - 18, y - 25, 36, 46);
      for (let i = 0; i < 4; i++) line(ctx, mid, x - 12, y - 16 + i * 8, x + 11, y - 16 + i * 8);
      rect(ctx, warm, x - 13, y + 12, 26, 4);
      break;
    case 'choco':
      rect(ctx, mid, x - 26, y - 21, 52, 40);
      rect(ctx, paper, x - 20, y - 13, 40, 24);
      isoDiamond(ctx, warm, x, y - 1, 13, 9);
      rect(ctx, '#715271', x - 6, y - 7, 12, 13);
      break;
    case 'ille':
      rect(ctx, paper, x - 27, y - 20, 54, 38);
      for (let i = 0; i < 7; i++) rect(ctx, i % 2 ? warm : mid, x - 21 + i * 7, y + 7 - (i % 3) * 6, 4, 4 + (i % 3) * 6);
      line(ctx, ink, x - 20, y - 13, x + 18, y - 13);
      break;
    case 'park':
      rect(ctx, paper, x - 30, y - 14, 60, 28);
      rect(ctx, mid, x - 23, y - 9, 46, 18);
      rect(ctx, warm, x - 16, y - 5, 32, 10);
      rect(ctx, ink, x - 34, y - 5, 7, 10);
      rect(ctx, ink, x + 27, y - 5, 7, 10);
      break;
    case 'noeul':
      isoDiamond(ctx, mid, x, y, 31, 20);
      isoDiamond(ctx, warm, x - 5, y - 4, 21, 13);
      rect(ctx, paper, x + 2, y - 13, 11, 8);
      rect(ctx, '#b9656d', x - 17, y + 3, 12, 6);
      break;
    case 'imo':
      rect(ctx, warm, x - 28, y - 21, 56, 40);
      rect(ctx, paper, x - 22, y - 15, 44, 27);
      line(ctx, mid, x - 16, y - 8, x + 16, y - 8);
      line(ctx, mid, x - 16, y, x + 10, y);
      rect(ctx, '#6e4439', x + 15, y - 18, 7, 34);
      break;
    default:
      isoDiamond(ctx, mid, x, y + 4, 30, 15);
      isoDiamond(ctx, warm, x - 3, y, 21, 11);
      rect(ctx, paper, x - 15, y - 4, 21, 7);
      line(ctx, ink, x - 24, y + 14, x + 23, y - 10);
      line(ctx, ink, x - 18, y + 19, x + 29, y - 5);
      break;
  }
}

/** 완성한 방에서 받은 주민별 생활 기념품을 작은 진열 상자처럼 그린다. */
export function paintResidentRoomCareKeepsake(
  canvas: HTMLCanvasElement, view: ResidentRoomCareView,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const [dark, mid, warm, paper] = view.palette;
  ctx.clearRect(0, 0, RESIDENT_ROOM_CARE_KEEPSAKE_W, RESIDENT_ROOM_CARE_KEEPSAKE_H);
  rect(ctx, '#18151b', 0, 0, 144, 92);
  rect(ctx, dark, 4, 4, 136, 84);
  rect(ctx, '#211b21', 9, 9, 126, 70);
  rect(ctx, mid, 9, 78, 126, 5);
  rect(ctx, warm, 15, 73, 114, 4);
  ctx.globalAlpha = view.complete ? 0.16 : 0.05;
  for (let x = 14; x < 136; x += 14) rect(ctx, paper, x, 14 + (x % 7), 2, 2);
  ctx.globalAlpha = 1;
  if (view.complete) {
    drawKeepsakeObject(ctx, view, 72, 46);
    rect(ctx, '#111016cc', 10, 9, 35, 14);
    ctx.fillStyle = warm; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(view.keepsakeMark, 27, 16);
    if (view.featured) {
      rect(ctx, '#d5b66e', 112, 8, 22, 15);
      ctx.fillStyle = '#3b302b'; ctx.font = 'bold 10px serif'; ctx.fillText('★', 123, 16);
    }
  } else {
    ctx.fillStyle = '#151319cc'; ctx.fillRect(9, 9, 126, 69);
    ctx.fillStyle = view.unlocked ? '#978b80' : '#6f6866';
    ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(view.unlocked ? `${view.sorted}/4` : '?', 72, 43);
    ctx.font = 'bold 6px monospace';
    ctx.fillText(view.unlocked ? 'ROOM IN PROGRESS' : 'MEET NEIGHBOR', 72, 62);
  }
}

/** 주민별 팔레트와 정리 진행을 반영하는 오픈월 2.5D 작은 방 전후 장면. */
export function paintResidentRoomCareArt(canvas: HTMLCanvasElement, view: ResidentRoomCareView): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, RESIDENT_ROOM_CARE_ART_W, RESIDENT_ROOM_CARE_ART_H);
  const [dark, mid, warm, paper] = view.palette;
  const sorted = new Set(view.sortedItemIds);

  rect(ctx, '#211c24', 0, 0, 240, 136);
  rect(ctx, dark, 0, 0, 240, 89);
  for (let x = 9; x < 240; x += 23) rect(ctx, mid, x, 10 + (x % 4), 2, 2);

  // 오픈월 아이소메트릭 바닥과 북·서 벽
  ctx.beginPath();
  ctx.moveTo(25, 75); ctx.lineTo(111, 34); ctx.lineTo(220, 73); ctx.lineTo(131, 126); ctx.closePath();
  ctx.fillStyle = '#c6af86'; ctx.fill();
  ctx.strokeStyle = '#5d4b43'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(42 + i * 25, 83 + i * 7); ctx.lineTo(134 + i * 9, 44 + i * 3);
    ctx.strokeStyle = '#9b836a55'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(25, 75); ctx.lineTo(111, 34); ctx.lineTo(111, 11); ctx.lineTo(25, 50); ctx.closePath();
  ctx.fillStyle = '#6e5b55'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(111, 34); ctx.lineTo(220, 73); ctx.lineTo(220, 47); ctx.lineTo(111, 11); ctx.closePath();
  ctx.fillStyle = '#80665d'; ctx.fill();

  // 창문과 저녁빛
  rect(ctx, '#2c3140', 133, 28, 42, 28);
  rect(ctx, view.complete ? warm : '#756d73', 136, 31, 36, 22);
  rect(ctx, '#f0d79a88', 151, 31, 3, 22);
  rect(ctx, '#5d4d49', 132, 55, 44, 3);

  // 벽걸이, 작업대, 선반, 기억 상자
  rect(ctx, '#342b2d', 43, 43, 4, 34); rect(ctx, paper, 46, 47, 18, 3);
  rect(ctx, '#5a4638', 77, 67, 62, 9); rect(ctx, '#3e312f', 83, 76, 7, 24); rect(ctx, '#3e312f', 126, 76, 7, 24);
  rect(ctx, '#4d3b35', 165, 55, 39, 5); rect(ctx, '#4d3b35', 165, 74, 39, 5);
  rect(ctx, '#3a2e31', 165, 55, 5, 29); rect(ctx, '#3a2e31', 199, 55, 5, 29);
  isoDiamond(ctx, '#483835', 151, 98, 17, 8); rect(ctx, '#392c30', 134, 98, 34, 13);
  rect(ctx, warm, 143, 96, 16, 3);

  // 러그와 의자: 완료될수록 시야가 맑아지는 따뜻한 중심
  isoDiamond(ctx, view.complete ? warm : '#8b6c65', 117, 101, 37, 17);
  isoDiamond(ctx, '#4a3935', 87, 88, 14, 7); rect(ctx, '#493a36', 77, 87, 20, 20);
  if (view.complete) {
    rect(ctx, '#f7d980', 209, 49, 5, 21); rect(ctx, '#fff0b8', 204, 44, 15, 8);
    ctx.globalAlpha = 0.12;
    isoDiamond(ctx, '#ffe3a0', 151, 83, 63, 29);
    ctx.globalAlpha = 1;
  }

  view.items.forEach((entry, index) => {
    const isSorted = sorted.has(entry.id);
    const pos = isSorted ? HOME_POS[entry.homeId] : CLUTTER_POS[index]!;
    drawItem(ctx, entry.mark, warm, pos.x, pos.y, isSorted);
  });

  // 진행 티켓
  rect(ctx, '#171419dd', 7, 7, 58, 22);
  rect(ctx, view.complete ? warm : mid, 10, 10, 17, 16);
  ctx.fillStyle = view.complete ? '#3d3130' : paper;
  ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText(view.complete ? '✓' : `${view.sorted}`, 18, 18);
  ctx.fillStyle = paper; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'left';
  ctx.fillText(view.complete ? 'ROOM RESTORED' : `TIDY ${view.sorted}/4`, 31, 19);

  if (!view.unlocked) {
    ctx.fillStyle = '#17151bd9'; ctx.fillRect(0, 0, 240, 136);
    ctx.fillStyle = '#d5c6ad'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MEET THIS NEIGHBOR FIRST', 120, 66);
    ctx.fillStyle = '#827a75'; ctx.font = 'bold 7px monospace';
    ctx.fillText('첫인사 뒤에도 의뢰는 계속 기다려요', 120, 80);
  }
}
