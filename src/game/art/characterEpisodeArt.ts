import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import type {
  CharacterEpisodeView, CharacterZineCard,
} from '../progression/characterZine';

export const CHARACTER_EPISODE_ART_W = 360;
export const CHARACTER_EPISODE_ART_H = 188;

const rect = (
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

const diamond = (
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y - height / 2);
  context.lineTo(x + width / 2, y);
  context.lineTo(x, y + height / 2);
  context.lineTo(x - width / 2, y);
  context.closePath();
  context.fill();
};

function building(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  wall: string,
  roof: string,
  light: string,
) {
  diamond(context, roof, x, y - height, width + 24, 28);
  rect(context, wall, x - width / 2, y - height, width, height);
  rect(context, '#322b2d', x - width / 2 - 3, y - 3, width + 6, 5);
  for (let wx = x - width / 2 + 10; wx < x + width / 2 - 4; wx += 18) {
    rect(context, '#3a3438', wx - 2, y - height + 14, 12, 15);
    rect(context, light, wx, y - height + 16, 8, 10);
  }
}

function drawSceneProps(
  context: CanvasRenderingContext2D,
  episode: CharacterEpisodeView,
  palette: readonly [string, string, string, string],
) {
  const id = episode.id;
  if (id === 'rainy_encore') {
    rect(context, '#332738', 236, 107, 82, 5);
    rect(context, palette[1], 244, 82, 66, 25);
    for (let x = 250; x < 306; x += 18) rect(context, palette[2], x, 86, 8, 14);
    for (let x = 18; x < 348; x += 17) {
      context.strokeStyle = x % 34 ? '#8bb4bd88' : '#d78fa688';
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(x, 18 + (x % 5)); context.lineTo(x - 7, 42 + (x % 9)); context.stroke();
    }
  } else if (id === 'rooftop_supper') {
    rect(context, '#5e5346', 230, 101, 72, 7);
    rect(context, '#735b47', 238, 108, 7, 25); rect(context, '#735b47', 287, 108, 7, 25);
    rect(context, palette[3], 250, 92, 30, 8);
    for (let x = 205; x < 330; x += 25) {
      rect(context, '#674d39', x, 116, 18, 12);
      rect(context, palette[1], x + 4, 100 - (x % 8), 10, 18 + (x % 8));
    }
  } else if (id === 'room_rescue') {
    rect(context, '#6e513d', 222, 96, 92, 34);
    rect(context, '#3b3030', 232, 103, 24, 27);
    rect(context, palette[3], 238, 108, 13, 11);
    rect(context, '#8b6b4e', 270, 84, 35, 45);
    for (let y = 91; y < 122; y += 10) rect(context, palette[2], 275, y, 25, 5);
  } else if (id === 'paw_delivery') {
    for (let index = 0; index < 6; index += 1) {
      const x = 224 + index * 16;
      const y = 112 + (index % 2) * 7;
      rect(context, palette[index % 2 ? 2 : 3], x, y, 7, 6);
      rect(context, palette[index % 2 ? 2 : 3], x + 2, y - 3, 3, 3);
    }
    rect(context, '#4d3c34', 304, 89, 28, 35);
    rect(context, palette[3], 309, 95, 18, 12);
  } else if (id === 'midnight_index') {
    rect(context, '#3b3030', 224, 103, 91, 27);
    rect(context, '#695142', 232, 91, 74, 12);
    for (let x = 238; x < 300; x += 15) rect(context, palette[3], x, 94, 8, 6);
    rect(context, palette[2], 314, 34, 4, 73);
    rect(context, palette[3], 303, 36, 26, 18);
  } else if (id === 'forest_signal') {
    for (let x = 215; x < 340; x += 27) {
      rect(context, '#3f4937', x + 8, 80 + (x % 9), 6, 50);
      diamond(context, palette[1], x + 11, 79 + (x % 9), 31, 24);
      diamond(context, '#687d59', x + 2, 92 + (x % 5), 26, 19);
    }
    rect(context, palette[3], 278, 88, 4, 4);
    rect(context, palette[2], 285, 82, 6, 6);
    rect(context, palette[3], 295, 91, 3, 3);
  } else if (id === 'market_curio') {
    rect(context, '#624936', 220, 76, 103, 56);
    rect(context, palette[2], 214, 73, 115, 8);
    for (let x = 226; x < 315; x += 22) {
      rect(context, '#2f2b2d', x, 88, 16, 24);
      rect(context, palette[3], x + 3, 92, 10, 8);
    }
    rect(context, '#8b674b', 238, 119, 67, 8);
  } else {
    rect(context, '#5b4a45', 219, 116, 111, 8);
    rect(context, '#8d7968', 237, 91, 77, 24);
    for (let index = 0; index < 18; index += 1) {
      const x = 208 + ((index * 23) % 130);
      const y = 30 + ((index * 31) % 91);
      rect(context, index % 3 ? palette[2] : palette[3], x, y, 5, 4);
      rect(context, index % 3 ? palette[2] : palette[3], x + 2, y - 3, 2, 3);
    }
  }
}

/** OC의 실제 외형을 아이소메트릭 에피소드 배경과 합성한 영구 픽셀 장면. */
export function paintCharacterEpisodeArt(
  canvas: HTMLCanvasElement,
  card: CharacterZineCard,
  episode: CharacterEpisodeView,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const palette = episode.palette;
  context.imageSmoothingEnabled = false;
  rect(context, palette[0], 0, 0, canvas.width, canvas.height);
  rect(context, palette[1], 0, 0, canvas.width, 112);

  for (let y = 0; y < 112; y += 8) {
    rect(context, y % 16 ? `${palette[0]}22` : `${palette[3]}0e`, 0, y, canvas.width, 4);
  }
  diamond(context, '#6d655f', 178, 128, 350, 92);
  diamond(context, '#4c4948', 178, 128, 238, 62);
  diamond(context, palette[0], 178, 128, 148, 38);
  building(context, 55, 115, 74, 62, palette[1], palette[0], palette[3]);
  building(context, 145, 105, 68, 53, palette[2], palette[0], palette[3]);
  drawSceneProps(context, episode, palette);

  const portrait = document.createElement('canvas');
  portrait.width = CHAR_W;
  portrait.height = CHAR_H;
  const portraitContext = portrait.getContext('2d');
  if (portraitContext) {
    portraitContext.imageSmoothingEnabled = false;
    paintCharacterFrame(portraitContext, card.appearance, card.direction, 0);
    context.drawImage(portrait, 0, 0, CHAR_W, CHAR_H, 121, 69, CHAR_W * 1.45, CHAR_H * 1.45);
  }

  rect(context, '#17151acc', 8, 8, 196, 38);
  rect(context, palette[2], 8, 8, 5, 38);
  context.fillStyle = palette[3];
  context.font = '900 9px ui-monospace, monospace';
  context.fillText(episode.code, 21, 21);
  context.font = '900 13px system-ui, sans-serif';
  context.fillText(episode.archived ? episode.title : '아직 쓰이지 않은 에피소드', 21, 38);

  rect(context, '#17151add', 8, 154, 344, 25);
  context.fillStyle = episode.archived ? palette[3] : '#aaa1a0';
  context.font = '800 9px system-ui, sans-serif';
  context.fillText(`${card.name} · ${episode.archived ? episode.ending : episode.subtitle}`, 16, 170);
  if (episode.featured) {
    rect(context, palette[3], 314, 8, 38, 21);
    context.fillStyle = palette[0];
    context.font = '900 9px ui-monospace, monospace';
    context.fillText('FAVE', 321, 22);
  }
}
