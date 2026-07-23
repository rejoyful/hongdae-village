import { drawFishingCreature } from './fishingArt';
import { fishById, type FishingState } from '../fishing/fishing';
import {
  aquariumFrameById, aquariumOrnamentById, aquariumSubstrateById,
  type HomeAquariumState,
} from '../home/homeAquarium';

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function ornament(ctx: CanvasRenderingContext2D, state: HomeAquariumState, x: number, y: number, scale: number): void {
  const def = aquariumOrnamentById(state.ornamentId);
  const s = scale;
  if (state.ornamentId === 'reed') {
    for (const dx of [0, 7, 13]) { rect(ctx, def.color, x + dx*s, y - (23 + dx)*s/2, 3*s, (24 + dx/2)*s); rect(ctx, def.accent, x + (dx-3)*s, y - 17*s, 7*s, 4*s); }
  } else if (state.ornamentId === 'bottle_caps') {
    for (const [dx, dy] of [[0,0],[10,-3],[20,1]] as const) { rect(ctx, '#28343a', x+dx*s, y+dy*s, 10*s, 7*s); rect(ctx, def.accent, x+(dx+2)*s, y+(dy+2)*s, 6*s, 3*s); }
  } else if (state.ornamentId === 'mini_bridge') {
    rect(ctx, def.color, x, y-11*s, 39*s, 5*s); rect(ctx, def.accent, x+3*s, y-15*s, 3*s, 15*s); rect(ctx, def.accent, x+32*s, y-15*s, 3*s, 15*s); rect(ctx, def.color, x+8*s, y-6*s, 4*s, 6*s); rect(ctx, def.color, x+27*s, y-6*s, 4*s, 6*s);
  } else if (state.ornamentId === 'cassette') {
    rect(ctx, '#273137', x, y-20*s, 34*s, 21*s); rect(ctx, def.color, x+3*s, y-17*s, 28*s, 15*s); rect(ctx, def.accent, x+8*s, y-14*s, 18*s, 5*s); rect(ctx, '#30353b', x+8*s, y-6*s, 18*s, 4*s);
  } else if (state.ornamentId === 'tiny_house') {
    rect(ctx, '#273137', x, y-22*s, 34*s, 23*s); rect(ctx, def.color, x+3*s, y-18*s, 28*s, 18*s); rect(ctx, def.accent, x, y-24*s, 34*s, 8*s); rect(ctx, '#c9b98e', x+13*s, y-10*s, 8*s, 10*s);
  } else {
    rect(ctx, def.color, x, y-29*s, 37*s, 30*s); rect(ctx, '#314047', x+6*s, y-24*s, 25*s, 25*s); rect(ctx, def.accent, x+8*s, y-22*s, 20*s, 4*s); rect(ctx, '#314047', x+16*s, y-22*s, 20*s, 19*s);
  }
}

function drawAquarium(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HomeAquariumState,
  fishing: FishingState,
): void {
  const frame = aquariumFrameById(state.frameId);
  const substrate = aquariumSubstrateById(state.substrateId);
  rect(ctx, '#182126', 0, 0, width, height);
  const pad = Math.max(4, Math.round(width * .035));
  rect(ctx, frame.color, pad, pad, width-pad*2, height-pad*2);
  rect(ctx, frame.accent, pad, pad, width-pad*2, Math.max(2,pad/2));
  rect(ctx, '#213a43', pad*2, pad*2, width-pad*4, height-pad*4);
  rect(ctx, '#355a61', pad*2+2, pad*2+2, width-pad*4-4, height-pad*4-4);
  rect(ctx, 'rgba(192,220,214,.28)', pad*2+2, pad*2+2, width-pad*4-4, Math.max(2,pad/2));
  const groundY = height-pad*2-Math.max(8,Math.round(height*.16));
  rect(ctx, substrate.color, pad*2+2, groundY, width-pad*4-4, height-pad*2-groundY-1);
  for (let x=pad*2+5, i=0; x<width-pad*2-3; x+=Math.max(5,Math.round(width*.045)),i+=1) {
    rect(ctx, i%2 ? substrate.accent : substrate.color, x, groundY+(i%3)*2, Math.max(3,Math.round(width*.025)), Math.max(2,Math.round(height*.025)));
  }
  const compact = width < 120;
  ornament(ctx, state, width*.14, groundY, compact ? .38 : 1);
  const fishIds = state.fishIds.filter((id) => fishing.records[id]);
  const positions: Array<[number, number]> = compact
    ? [[width*.5,height*.42],[width*.68,height*.57],[width*.38,height*.65]]
    : [[width*.47,height*.35],[width*.68,height*.52],[width*.42,height*.66]];
  fishIds.forEach((id,index) => {
    const [x,y]=positions[index] ?? positions[0]!;
    drawFishingCreature(ctx, fishById(id), x, y, compact ? .34 : 1.05 - index*.08);
  });
  const bubbleSize = compact ? 1 : 3;
  for (let i=0;i<8;i+=1) rect(ctx,'rgba(215,234,228,.68)',pad*3+(i*37)%(width-pad*6),pad*3+(i*29)%(groundY-pad*4),bubbleSize,bubbleSize);
  rect(ctx, '#12191d', pad, height-pad-3, width-pad*2, 3);
}

export function paintHomeAquarium(
  canvas: HTMLCanvasElement,
  state: HomeAquariumState,
  fishing: FishingState,
  compact = false,
): void {
  canvas.width = compact ? 88 : 420;
  canvas.height = compact ? 64 : 258;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawAquarium(ctx, canvas.width, canvas.height, state, fishing);
}
