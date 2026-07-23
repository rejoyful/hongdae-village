import {
  SHARED_PROJECT_CONTRIBUTION_BY_ID, type SharedProjectContributionKind, type SharedProjectView,
} from '../projects/sharedVillageProject';

const px = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** 패널용 2:1 아이소메트릭 밤정원. 작은 캔버스에서도 픽셀 격자를 보존한다. */
export function paintSharedVillageHero(canvas: HTMLCanvasElement, view: SharedProjectView): void {
  canvas.width = 320;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const sky = ctx.createLinearGradient(0, 0, 0, 176);
  sky.addColorStop(0, '#22243a');
  sky.addColorStop(1, '#52515a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 320, 176);
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 73 + 19) % 320;
    const y = (i * 31 + 11) % 84;
    px(ctx, i % 4 ? '#beb88c' : '#e6cf8f', x, y, i % 5 ? 1 : 2, 1);
  }
  ctx.fillStyle = '#6c6560';
  ctx.beginPath();
  ctx.moveTo(160, 61); ctx.lineTo(304, 124); ctx.lineTo(160, 171); ctx.lineTo(16, 124); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8e8171';
  ctx.lineWidth = 2;
  ctx.stroke();
  const stage = view.stage;
  if (stage >= 1) {
    ctx.strokeStyle = '#b5a582';
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(57, 123); ctx.lineTo(160, 78); ctx.lineTo(262, 123); ctx.lineTo(160, 158); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
  }
  if (stage >= 2) {
    for (const [x, y, c] of [[67, 111, '#6e885c'], [250, 117, '#7a9563'], [102, 139, '#627b55'], [211, 143, '#819763']] as const) {
      px(ctx, '#3a4734', x - 2, y + 4, 10, 5); px(ctx, c, x, y, 6, 7); px(ctx, '#9bb078', x + 3, y - 3, 3, 6);
    }
  }
  if (stage >= 3) {
    px(ctx, '#654a35', 126, 117, 69, 6); px(ctx, '#8c6949', 130, 111, 61, 7);
    px(ctx, '#45382d', 134, 123, 5, 13); px(ctx, '#45382d', 183, 123, 5, 13);
    px(ctx, '#75583e', 93, 94, 7, 35); px(ctx, '#75583e', 221, 94, 7, 35);
    px(ctx, '#987250', 99, 95, 122, 5);
  }
  if (stage >= 4) {
    for (const x of [96, 124, 154, 185, 218]) {
      px(ctx, '#4d3e32', x, 96, 2, 22); px(ctx, '#eccb74', x - 2, 93, 6, 5);
      ctx.fillStyle = '#e8ba5a33'; ctx.fillRect(x - 7, 87, 16, 16);
    }
  }
  if (stage >= 5) {
    px(ctx, '#5c4937', 149, 84, 23, 7); px(ctx, '#d5c397', 152, 71, 17, 14);
    px(ctx, '#866e4e', 158, 76, 6, 2);
  }
  px(ctx, '#252437cc', 10, 10, 112, 26);
  ctx.fillStyle = '#f3dfaa';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`CH.${String(view.chapter).padStart(2, '0')}  ${view.stageName}`, 18, 26);
  ctx.fillStyle = '#d2c9b3';
  ctx.font = '8px monospace';
  ctx.fillText(`${view.chapterProgress} / ${view.chapterGoal} NEIGHBOR MARKS`, 18, 34);
}

export function paintSharedContributionBadge(canvas: HTMLCanvasElement, kind: SharedProjectContributionKind, selected = false): void {
  canvas.width = 72;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');
  const def = SHARED_PROJECT_CONTRIBUTION_BY_ID.get(kind);
  if (!ctx || !def) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 72, 56);
  px(ctx, selected ? '#f0dca5' : '#cbbd9e', 8, 8, 56, 40);
  px(ctx, def.dark, 12, 12, 48, 32);
  px(ctx, def.color, 16, 16, 40, 24);
  const motifs: Record<SharedProjectContributionKind, Array<[number, number, number, number]>> = {
    warmth: [[27, 26, 18, 8], [31, 20, 10, 7], [26, 34, 4, 4], [42, 34, 4, 4]],
    green: [[34, 19, 4, 22], [24, 23, 12, 7], [36, 28, 12, 7], [26, 36, 18, 3]],
    music: [[27, 20, 4, 20], [31, 20, 15, 4], [42, 23, 4, 13], [22, 36, 9, 6], [37, 34, 9, 6]],
    craft: [[23, 23, 25, 5], [34, 18, 5, 23], [27, 33, 18, 5]],
    companion: [[24, 22, 7, 8], [33, 18, 7, 8], [43, 22, 7, 8], [29, 31, 17, 10]],
    table: [[22, 26, 28, 7], [25, 33, 5, 9], [42, 33, 5, 9]],
    water: [[20, 23, 12, 4], [30, 29, 18, 4], [22, 36, 26, 4]],
    story: [[23, 20, 27, 22], [27, 24, 8, 2], [27, 29, 17, 2], [27, 34, 14, 2]],
  };
  ctx.fillStyle = '#fff1c7';
  for (const [x, y, w, h] of motifs[kind]) ctx.fillRect(x, y, w, h);
}
