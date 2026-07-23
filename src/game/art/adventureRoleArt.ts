import {
  ADVENTURE_CHARM_BY_ID, ADVENTURE_ROLE_BY_ID, type AdventureRoleState,
} from '../battle/adventureRoles';

const W = 240;
const H = 96;
const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
};

const rolePalette: Record<string, readonly [string, string, string]> = {
  guardian: ['#647a7b', '#9ab1aa', '#d7c998'],
  scout: ['#5f806a', '#9eb984', '#e1c36f'],
  caretaker: ['#788c5c', '#b3c582', '#d7ad79'],
  researcher: ['#75668b', '#aa91bc', '#d9ba75'],
};

/** 역할·부적 조합을 작은 2.5D 야간 원정 엽서로 그린다. */
export function paintAdventureRoleArt(canvas: HTMLCanvasElement, state: AdventureRoleState): void {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const role = ADVENTURE_ROLE_BY_ID.get(state.roleId)!;
  const palette = rolePalette[role.id]!;
  rect(ctx, '#252738', 0, 0, W, 55);
  rect(ctx, '#3f4c46', 0, 55, W, 41);
  for (let x = 8; x < W; x += 23) {
    const y = 8 + ((x * 7) % 19);
    rect(ctx, x % 2 ? '#f2dba0' : '#9eb9b1', x, y, 2, 2);
  }
  // 아이소메트릭 산책길
  for (let row = 0; row < 5; row++) {
    const y = 55 + row * 8;
    rect(ctx, row % 2 ? '#716a55' : '#7e745b', 45 - row * 8, y, 150 + row * 16, 8);
    for (let x = 49 - row * 8; x < 190 + row * 8; x += 17) rect(ctx, '#8d8369', x, y + 1, 11, 1);
  }
  // 나무와 안내등
  for (const x of [12, 29, 204, 224]) {
    rect(ctx, '#4b3b32', x + 5, 31, 5, 33);
    rect(ctx, '#34483f', x, 18, 16, 20);
    rect(ctx, '#465b48', x + 3, 13, 11, 18);
  }
  rect(ctx, '#473a31', 184, 31, 3, 35); rect(ctx, '#d4b46a', 178, 28, 15, 5);
  rect(ctx, '#f4db86', 181, 32, 9, 8); rect(ctx, '#78614a', 182, 40, 7, 2);
  // 캐릭터: 2px 픽셀 스프라이트
  rect(ctx, '#372d31', 108, 30, 18, 16);
  rect(ctx, '#d3a17f', 110, 34, 14, 12);
  rect(ctx, '#2f2930', 109, 30, 16, 6);
  rect(ctx, '#322b31', 112, 38, 2, 2); rect(ctx, '#322b31', 120, 38, 2, 2);
  rect(ctx, palette[0], 107, 46, 20, 23);
  rect(ctx, palette[1], 110, 48, 14, 14);
  rect(ctx, '#302d35', 109, 69, 7, 17); rect(ctx, '#302d35', 119, 69, 7, 17);
  rect(ctx, '#d3a17f', 103, 49, 5, 17); rect(ctx, '#d3a17f', 127, 49, 5, 17);
  // 역할별 장비 실루엣
  if (role.id === 'guardian') {
    rect(ctx, palette[2], 95, 48, 10, 19); rect(ctx, '#4b5557', 97, 50, 6, 15);
  } else if (role.id === 'scout') {
    rect(ctx, palette[2], 130, 42, 2, 28); rect(ctx, '#f0de9b', 128, 42, 6, 4);
  } else if (role.id === 'caretaker') {
    rect(ctx, '#8b6045', 95, 55, 11, 12); rect(ctx, palette[1], 98, 51, 5, 5);
  } else {
    rect(ctx, '#e1d2a4', 130, 51, 10, 14); rect(ctx, palette[0], 132, 53, 6, 2);
    rect(ctx, palette[0], 132, 58, 5, 2);
  }
  // 장착 부적 두 칸
  state.charmIds.forEach((id, index) => {
    const charm = ADVENTURE_CHARM_BY_ID.get(id);
    if (!charm) return;
    const x = 77 + index * 78;
    rect(ctx, '#292630', x, 73, 28, 18); rect(ctx, charm.color, x + 2, 75, 24, 14);
    rect(ctx, '#f4e7c3', x + 11, 78, 6, 7);
  });
  // 역할색 픽셀 테두리
  rect(ctx, palette[1], 0, 0, W, 2); rect(ctx, palette[0], 0, H - 2, W, 2);
}
