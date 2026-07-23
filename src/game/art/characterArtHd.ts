import { PAL } from './palette';
import type { Px } from './pixelCanvas';
import {
  type Appearance, HAIR_COLORS, PANTS_COLORS, SKIN_TONES,
} from './appearance';

export const HD_CHAR_W = 32;
export const HD_CHAR_H = 48;
export const HD_CHAR_ORIGIN_Y = 0.78;

type Direction = 0 | 1 | 2 | 3;

function shade(color: number, factor: number): number {
  const channel = (value: number) => Math.max(0, Math.min(255, Math.round(value * factor)));
  return (channel((color >> 16) & 0xff) << 16)
    | (channel((color >> 8) & 0xff) << 8)
    | channel(color & 0xff);
}

function outlineRect(d: Px, x: number, y: number, w: number, h: number, fill: number, outline = PAL.outline): void {
  d.rect(x - 1, y - 1, w + 2, h + 2, outline);
  d.rect(x, y, w, h, fill);
}

function drawBack(
  d: Px, direction: Direction, bob: number, style: number, accent: number, accentDark: number,
): void {
  if (!style) return;
  const y = 18 - bob;
  if (style === 1) {
    outlineRect(d, 9, y, 14, 16, accentDark);
    d.rect(11, y + 2, 10, 11, accent);
    d.rect(12, y + 3, 8, 2, shade(accent, 1.25));
    d.rect(13, y + 11, 6, 2, accentDark);
    d.rect(8, y + 3, 2, 10, accentDark); d.rect(22, y + 3, 2, 10, accentDark);
  } else if (style === 2) {
    const x = direction === 2 ? 7 : 18;
    d.rect(x - 2, y - 3, 7, 23, PAL.outline);
    d.rect(x, y - 2, 4, 21, accentDark);
    d.rect(x + 1, y, 2, 16, accent);
    d.rect(x - 1, y + 15, 6, 4, shade(accentDark, 0.72));
  } else if (style === 3) {
    const wing = (x: number, mirror: boolean) => {
      const rows = [3, 6, 8, 7, 5, 3];
      rows.forEach((width, index) => {
        const offset = mirror ? -width : 0;
        d.rect(x + offset, y - 4 + index * 3, width, 2, index % 2 ? accentDark : accent, 0.95);
        d.rect(x + offset, y - 4 + index * 3, width, 1, shade(accent, 1.35), 0.9);
      });
    };
    wing(8, true); wing(24, false);
  } else if (style === 4) {
    const x = direction === 1 ? 5 : 21;
    outlineRect(d, x, y + 8, 8, 10, accent);
    d.rect(x + 1, y + 5, 6, 4, PAL.outline);
    d.rect(x + 2, y + 6, 4, 3, accentDark);
    d.rect(x + 2, y + 10, 4, 1, shade(accent, 1.3));
  } else {
    const right = direction !== 2;
    const x = right ? 23 : 8;
    d.rect(x, y + 11, 3, 3, PAL.outline);
    d.rect(x + (right ? 2 : -2), y + 13, 3, 3, PAL.outline);
    d.rect(x + (right ? 3 : -3), y + 15, 3, 4, PAL.outline);
    d.rect(x + (right ? 0 : 1), y + 12, 2, 2, accent);
    d.rect(x + (right ? 2 : -1), y + 14, 2, 2, accent);
    d.rect(x + (right ? 3 : -2), y + 16, 2, 3, accentDark);
  }
}

function drawLeg(
  d: Px, x: number, top: number, phase: number, appearance: Appearance,
  skin: number, skinDark: number, pants: number, pantsDark: number, accent: number,
): void {
  const bottomStyle = appearance.bottomStyle ?? 0;
  const wide = bottomStyle === 1 || bottomStyle === 4;
  const shorts = bottomStyle === 2;
  const skirt = bottomStyle === 3 || bottomStyle === 5;
  const width = wide ? 7 : 5;
  const height = 11 + Math.min(0, phase);
  const left = x - (wide ? 1 : 0);
  outlineRect(d, left, top, width, height, skirt || shorts ? skin : pants);
  if (shorts) {
    d.rect(left, top, width, 4, pants);
    d.rect(left, top + 3, width, 2, pantsDark);
    d.rect(x, top + 5, 5, Math.max(2, height - 5), skin);
    d.rect(x, top + 5, 1, Math.max(2, height - 5), skinDark);
  } else if (!skirt) {
    d.rect(left, top, 2, height, pantsDark);
    d.rect(left + 2, top, width - 2, 2, shade(pants, 1.14));
    d.rect(left, top + height - 2, width, 2, pantsDark);
    if (bottomStyle === 4) {
      const pocketX = x < 15 ? left : left + width - 3;
      d.rect(pocketX, top + 4, 3, 4, accent);
      d.rect(pocketX, top + 4, 3, 1, shade(accent, 1.25));
    }
  }

  const sockStyle = appearance.sockStyle ?? 0;
  const footY = top + height;
  if (sockStyle) {
    const sockH = sockStyle === 3 ? 6 : sockStyle === 4 ? 5 : 3;
    const sockW = sockStyle === 4 ? 7 : 5;
    const sockX = x - (sockStyle === 4 ? 1 : 0);
    outlineRect(d, sockX, footY - sockH, sockW, sockH, sockStyle === 4 ? accent : 0xf4ead8);
    if (sockStyle === 2) {
      d.rect(sockX, footY - sockH + 1, sockW, 1, accent);
      d.rect(sockX, footY - 2, sockW, 1, shade(accent, 0.75));
    } else if (sockStyle === 3) d.rect(sockX, footY - sockH, sockW, 2, accent);
  }

  const shoeStyle = appearance.shoeStyle ?? 0;
  const shoe = shoeStyle === 2 ? 0x5a3a24 : shoeStyle === 4 ? accent : PAL.shoes;
  const shoeH = shoeStyle === 1 ? 5 : shoeStyle === 3 ? 4 : 3;
  const shoeW = 6 + (phase > 0 ? 1 : 0);
  outlineRect(d, x - 1, footY - 1, shoeW, shoeH, shoe);
  d.rect(x, footY - 1, shoeW - 2, 1, shoeStyle === 4 ? shade(accent, 1.35) : shade(shoe, 1.45));
  d.rect(x + shoeW - 3, footY + shoeH - 3, 2, 1, shade(shoe, 0.65));
  if (shoeStyle === 3) {
    d.rect(x, footY, shoeW - 2, 1, accent);
    d.rect(x + 1, footY + 2, shoeW - 3, 1, 0xe9e1d2);
  }
}

function drawBottom(
  d: Px, direction: Direction, bob: number, appearance: Appearance,
  pants: number, pantsDark: number, accent: number,
): void {
  const style = appearance.bottomStyle ?? 0;
  if (style !== 3 && style !== 5) return;
  const y = 29 - bob;
  if (style === 3) {
    outlineRect(d, 7, y, 18, 8, pants);
    d.rect(8, y + 1, 16, 2, shade(pants, 1.14));
    d.rect(7, y + 6, 18, 2, pantsDark);
    for (const x of [9, 13, 17, 21]) d.rect(x, y + 2, 2, 4, x % 4 ? pantsDark : accent, 0.62);
  } else {
    outlineRect(d, 7, y, 18, 14, pants);
    d.rect(8, y + 1, 16, 2, shade(pants, 1.12));
    d.rect(6, y + 10, 20, 3, pants);
    d.rect(6, y + 12, 20, 2, pantsDark);
    d.rect(direction === 2 ? 8 : 21, y + 2, 2, 9, pantsDark, 0.72);
  }
}

function drawTopPattern(
  d: Px, direction: Direction, y: number, pattern: number, accent: number, accentDark: number,
): void {
  if (!pattern) return;
  const x = direction === 2 ? 11 : 12;
  const width = direction === 0 || direction === 3 ? 9 : 7;
  if (pattern === 1) {
    d.rect(x, y + 4, width, 2, accent);
    d.rect(x, y + 8, width, 2, accentDark);
  } else if (pattern === 2) {
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      d.rect(x + col * 2, y + 3 + row * 2, 2, 2, (row + col) % 2 ? accentDark : accent);
    }
  } else if (direction !== 3 && pattern === 3) {
    d.rect(13, y + 4, 3, 3, accent); d.rect(17, y + 4, 3, 3, accent);
    d.rect(14, y + 6, 5, 3, accent); d.rect(16, y + 9, 1, 2, accentDark);
  } else if (direction !== 3 && pattern === 4) {
    d.rect(16, y + 3, 2, 9, accent); d.rect(12, y + 6, 10, 3, accent);
    d.rect(14, y + 4, 6, 6, accent); d.rect(16, y + 6, 2, 2, shade(accent, 1.4));
  } else if (direction !== 3) {
    d.rect(14, y + 4, 3, 3, accent); d.rect(18, y + 4, 3, 3, accent);
    d.rect(16, y + 2, 3, 3, accent); d.rect(16, y + 7, 3, 3, accent);
    d.rect(17, y + 5, 2, 2, shade(accent, 1.4));
  }
}

function drawTopDetails(
  d: Px, direction: Direction, y: number, appearance: Appearance,
  shirt: number, shirtDark: number, shirtLight: number, pants: number, accent: number, accentDark: number,
): void {
  const style = appearance.topStyle ?? 0;
  const back = direction === 3;
  if (style === 1) {
    outlineRect(d, 11, y - 3, 10, 5, shirt);
    if (back) outlineRect(d, 10, y, 12, 7, shirtDark);
    else {
      d.rect(13, y + 1, 1, 6, accentDark); d.rect(19, y + 1, 1, 6, accentDark);
      d.rect(12, y + 9, 9, 4, shirtDark); d.rect(14, y + 9, 5, 1, shirtLight);
    }
  } else if (style === 2 && !back) {
    d.rect(10, y + 1, 5, 7, shirtLight); d.rect(19, y + 1, 4, 7, shirtDark);
    d.rect(14, y + 1, 6, 8, accent); d.rect(16, y + 9, 2, 2, accentDark);
  } else if (style === 3) {
    d.rect(15, y, 3, 13, accent);
    d.rect(17, y, 1, 13, accentDark);
    if (!back) for (const buttonY of [y + 3, y + 7, y + 11]) d.rect(19, buttonY, 1, 1, shirtLight);
  } else if (style === 4) {
    d.rect(12, y, 3, 7, pants); d.rect(20, y, 3, 7, pants);
    d.rect(13, y + 4, 9, 8, pants); d.rect(15, y + 5, 5, 2, shade(pants, 1.15));
    if (!back) d.rect(16, y + 8, 3, 2, accent);
  } else if (style === 5) {
    d.rect(9, y + 7, 15, 6, shirtDark);
    d.rect(10, y + 7, 13, 2, shirtLight);
    d.rect(10, y + 12, 4, 2, accentDark); d.rect(19, y + 12, 4, 2, accentDark);
  } else if (style === 6) {
    d.rect(10, y, 5, 5, accent); d.rect(19, y, 5, 5, accent);
    d.rect(14, y + 1, 6, 6, 0xf1eadc);
    if (!back) d.rect(15, y + 5, 4, 4, accentDark);
    d.rect(10, y + 10, 14, 2, accent);
  } else if (style === 7) {
    d.rect(9, y + 2, 16, 5, shirtLight);
    d.rect(11, y + 6, 12, 7, shirt);
    d.rect(8, y + 10, 18, 3, accent);
    d.rect(9, y + 12, 16, 2, accentDark);
    if (!back) d.rect(15, y + 1, 3, 9, accentDark);
  }
}

function drawArm(
  d: Px, x: number, top: number, phase: number, mirror: boolean,
  shirt: number, shirtDark: number, skin: number, skinDark: number,
): void {
  const y = top + Math.max(0, -phase);
  outlineRect(d, x, y, 5, 11, shirt);
  d.rect(x + (mirror ? 3 : 0), y, 2, 7, shirtDark);
  d.rect(x, y + 7, 5, 4, skin);
  d.rect(x + (mirror ? 3 : 0), y + 8, 2, 3, skinDark);
  d.rect(x + 1, y + 7, 3, 1, shade(skin, 1.08));
}

function drawFace(
  d: Px, direction: Direction, y: number, appearance: Appearance,
  skinDark: number, accent: number, accentDark: number,
): void {
  if (direction === 3) return;
  const ink = 0x29231f;
  const eyeStyle = appearance.eyeStyle ?? 0;
  const eye = (x: number, mirror = false) => {
    const ey = y + 10;
    if (eyeStyle === 1) {
      d.rect(x, ey, 3, 4, ink); d.rect(x, ey, 1, 1, 0xffffff); d.rect(x + 2, ey + 3, 1, 1, 0x75c6d8);
    } else if (eyeStyle === 2) {
      d.rect(x, ey + 2, 4, 1, ink); d.rect(x + (mirror ? 0 : 3), ey + 1, 1, 1, ink);
    } else if (eyeStyle === 3) {
      d.rect(x, ey + 1, 4, 1, ink); d.rect(x + (mirror ? 0 : 3), ey + 2, 1, 1, ink, 0.8);
    } else if (eyeStyle === 4) {
      d.rect(x, ey + (mirror ? 0 : 2), 4, 1, ink); d.rect(x + (mirror ? 2 : 0), ey + 1, 2, 2, ink);
    } else if (eyeStyle === 5) {
      d.rect(x + 1, ey - 1, 2, 5, ink); d.rect(x, ey, 4, 3, ink); d.rect(x + 1, ey, 1, 1, 0xffffff);
    } else {
      d.rect(x, ey, 3, 4, ink); d.rect(x, ey, 1, 1, 0xffffff);
    }
  };
  if (direction === 0) {
    eye(10); eye(19, true);
    const mouth = appearance.mouthStyle ?? 0;
    if (mouth === 1) d.rect(16, y + 16, 2, 1, 0xa85d59);
    else if (mouth === 2) {
      d.rect(14, y + 16, 3, 1, 0xb95f64); d.rect(18, y + 16, 3, 1, 0xb95f64);
      d.rect(16, y + 15, 3, 1, 0xb95f64);
    } else if (mouth === 3) d.rect(15, y + 16, 4, 1, skinDark);
    else if (mouth === 4) {
      d.rect(15, y + 15, 4, 3, 0xb95f64); d.rect(16, y + 15, 3, 1, 0xffffff);
    } else {
      d.rect(15, y + 16, 4, 1, 0xc97970); d.rect(16, y + 17, 2, 1, 0xc97970);
    }
    const detail = appearance.faceDetail ?? 0;
    if (detail === 1) for (const x of [9, 12, 21, 24]) d.rect(x, y + 15, 1, 1, 0xa26a55);
    else if (detail === 2) {
      d.rect(8, y + 15, 4, 2, 0xe88f8a, 0.72); d.rect(21, y + 15, 4, 2, 0xe88f8a, 0.72);
    } else if (detail === 3) d.rect(22, y + 17, 1, 1, 0x53352f);
    else if (detail === 4) {
      d.rect(20, y + 13, 6, 3, 0xd8b890); d.rect(22, y + 13, 2, 3, 0xf2d8ae);
    } else if (detail === 5) {
      d.rect(8, y + 13, 4, 2, accent); d.rect(10, y + 15, 4, 1, accentDark);
    }
  } else {
    const x = direction === 1 ? 19 : 10;
    eye(x, direction === 1);
    d.rect(direction === 1 ? 25 : 7, y + 12, 1, 4, skinDark);
    if ((appearance.faceDetail ?? 0) === 2) d.rect(direction === 1 ? 20 : 8, y + 15, 4, 2, 0xe88f8a, 0.72);
  }
}

function drawHair(
  d: Px, direction: Direction, y: number, style: number, color: number, dark: number, light: number,
): void {
  const back = direction === 3;
  outlineRect(d, 6, y - 1, 20, 10, color);
  d.rect(7, y, 18, 3, light);
  d.rect(6, y + 5, 3, 7, dark); d.rect(23, y + 5, 3, 7, dark);
  if (!back) {
    const fringe = style === 1 ? [7, 9, 12, 16, 20] : style === 4 ? [7, 10, 14, 18, 22] : [7, 11, 15, 20, 23];
    fringe.forEach((x, index) => d.rect(x, y + 5 + (index % 2), index % 2 ? 4 : 5, 4, index % 3 ? color : dark));
    d.rect(8, y + 4, 16, 2, color);
  } else {
    d.rect(8, y + 5, 16, 8, color);
    d.rect(8, y + 10, 16, 3, dark);
    d.rect(12, y + 6, 8, 2, light, 0.75);
  }
  if (style === 1) {
    d.rect(6, y + 8, 4, 12, color); d.rect(22, y + 8, 4, 12, color);
    d.rect(7, y + 17, 3, 3, dark); d.rect(22, y + 17, 3, 3, dark);
  } else if (style === 2) {
    d.rect(5, y + 8, 5, 19, color); d.rect(22, y + 8, 5, 19, color);
    d.rect(7, y + 22, 4, 5, dark); d.rect(21, y + 22, 4, 5, dark);
    if (back) d.rect(9, y + 10, 14, 18, color);
  } else if (style === 3) {
    const x = direction === 2 ? 4 : 24;
    outlineRect(d, x, y + 8, 5, 15, color);
    d.rect(x + 1, y + 10, 3, 3, light); d.rect(x + 1, y + 20, 3, 3, dark);
    d.rect(direction === 2 ? 6 : 23, y + 7, 3, 4, dark);
  } else if (style === 4) {
    for (const [x, cy] of [[5, 8], [8, 5], [12, 4], [17, 4], [22, 6], [25, 10], [6, 15], [24, 16]] as const) {
      outlineRect(d, x, y + cy, 4, 4, (x + cy) % 2 ? color : dark);
      d.rect(x + 1, y + cy, 2, 1, light);
    }
  } else if (style === 5) {
    d.rect(6, y - 3, 20, 7, 0x4e5d72);
    d.rect(5, y + 3, 22, 3, 0x2f3948);
    d.rect(direction === 2 ? 3 : 21, y + 5, 9, 3, 0x4e5d72);
    d.rect(9, y + 7, 14, 5, color);
  }
}

function drawGlasses(d: Px, direction: Direction, y: number, style: number): void {
  if (!style || direction === 3) return;
  const ey = y + 9;
  if (style === 4) {
    const heart = (x: number) => {
      d.rect(x, ey, 5, 4, 0xe86a8a); d.rect(x, ey - 1, 2, 1, 0xe86a8a);
      d.rect(x + 3, ey - 1, 2, 1, 0xe86a8a); d.rect(x + 1, ey + 4, 3, 1, 0xe86a8a);
      d.rect(x + 1, ey, 1, 1, 0xffffff, 0.65);
    };
    if (direction === 0) { heart(8); heart(19); } else heart(direction === 1 ? 18 : 9);
    return;
  }
  const frame = style === 2 ? 0x5a3a1c : 0x29251f;
  const lensColor = style === 3 ? 0x20242b : 0x8fd0e8;
  const lensAlpha = style === 3 ? 0.98 : 0.48;
  const lens = (x: number) => {
    d.rect(x, ey - 1, 6, 1, frame); d.rect(x, ey + 4, 6, 1, frame);
    d.rect(x, ey, 1, 4, frame); d.rect(x + 5, ey, 1, 4, frame);
    d.rect(x + 1, ey, 4, 4, lensColor, lensAlpha);
    if (style !== 3) d.rect(x + 1, ey, 2, 1, 0xffffff, 0.75);
  };
  if (direction === 0) { lens(8); lens(19); d.rect(14, ey, 5, 1, frame); }
  else lens(direction === 1 ? 18 : 8);
}

function drawHat(d: Px, direction: Direction, y: number, style: number): void {
  if (!style) return;
  const back = direction === 3;
  if (style === 1) {
    d.rect(6, y - 4, 20, 6, 0xc4453a); d.rect(6, y + 1, 20, 2, 0x8a2e28);
    d.rect(8, y - 4, 15, 1, 0xe86a5a); d.rect(22, y - 5, 3, 3, 0x8a2e28);
  } else if (style === 2) {
    d.rect(6, y - 4, 20, 7, 0x5a7a9a);
    for (let x = 6; x < 26; x += 3) d.rect(x, y - 4, 1, 7, 0x3a5470, 0.6);
    d.rect(5, y + 1, 22, 3, 0xcfd8e0);
    d.rect(14, y - 5, 5, 3, 0x5a7a9a);
  } else if (style === 3) {
    d.rect(6, y, 20, 3, 0xe86a9a); d.rect(6, y, 20, 1, 0xf2a0c0);
    if (!back) {
      d.rect(21, y - 4, 6, 4, 0xe86a9a); d.rect(23, y - 3, 2, 2, 0xf2a0c0);
    }
  } else if (style === 4) {
    const x = back ? 8 : direction === 2 ? 7 : 22;
    for (const [dx, dy] of [[1, 0], [3, 1], [3, 3], [1, 4], [0, 2]] as const) d.rect(x + dx, y - 2 + dy, 3, 3, 0xf4f0e8);
    d.rect(x + 2, y + 1, 2, 2, 0xf2c25c);
  } else if (style === 5) {
    d.rect(10, y - 5, 5, 5, 0xe85a7a); d.rect(18, y - 5, 5, 5, 0xe85a7a);
    d.rect(14, y - 4, 5, 3, 0xb03a5a);
    d.rect(10, y - 5, 2, 1, 0xf2a0b8); d.rect(21, y - 5, 2, 1, 0xf2a0b8);
  } else if (style === 6) {
    d.rect(8, y - 2, 16, 5, 0xf2c84c); d.rect(8, y + 1, 16, 2, 0xc89a2c);
    for (const x of [8, 13, 18, 23]) {
      d.rect(x, y - 4, 2, 2, 0xf2c84c); d.rect(x, y - 5, 2, 1, 0xfff0a0);
    }
    d.rect(15, y - 1, 4, 3, 0xe85a7a);
  } else {
    d.rect(7, y - 5, 18, 3, 0x3a3f52); d.rect(8, y - 5, 16, 1, 0x6a7088);
    if (direction === 0 || back) {
      d.rect(5, y, 4, 7, 0xe8623c); d.rect(23, y, 4, 7, 0xe8623c);
    } else d.rect(direction === 1 ? 6 : 22, y, 4, 7, 0xe8623c);
  }
}

/**
 * 네이티브 32×48 캐릭터 프레임. 논리 충돌은 그대로 두고 실루엣·얼굴·봉제·액세서리에
 * 더 많은 픽셀을 배정한다. 발바닥은 y=46에 고정해 모든 월드에서 같은 origin을 쓴다.
 */
export function drawCharacterHd(
  d: Px, ox: number, direction: Direction, step: number, appearance: Appearance,
): void {
  const translated: Px = {
    ctx: d.ctx,
    p: (x, y, color, alpha) => d.p(ox + x, y, color, alpha),
    rect: (x, y, w, h, color, alpha) => d.rect(ox + x, y, w, h, color, alpha),
    speckle: (x, y, w, h, color, density, random, alpha) => (
      d.speckle(ox + x, y, w, h, color, density, random, alpha)
    ),
  };
  const skin = SKIN_TONES[appearance.skin]!;
  const skinDark = shade(skin, 0.84);
  const hair = HAIR_COLORS[appearance.hairColor]!;
  const hairDark = shade(hair, 0.66);
  const hairLight = shade(hair, 1.25);
  const shirt = Number.parseInt(appearance.shirt, 16);
  const shirtDark = shade(shirt, 0.76);
  const shirtLight = shade(shirt, 1.16);
  const pants = PANTS_COLORS[appearance.pants]!;
  const pantsDark = shade(pants, 0.72);
  const accent = Number.parseInt(appearance.accent ?? 'f2ead8', 16);
  const accentDark = shade(accent, 0.7);
  const bob = step === 2 ? 1 : 0;
  const legA = step === 1 ? 2 : step === 3 ? -1 : 0;
  const legB = step === 3 ? 2 : step === 1 ? -1 : 0;
  const armA = -legA;
  const armB = -legB;

  translated.rect(7, 44, 18, 3, PAL.shadow, 0.78);
  translated.rect(10, 47, 12, 1, PAL.shadow, 0.5);
  drawBack(translated, direction, bob, appearance.back ?? 0, accent, accentDark);

  const legTop = 32 - bob;
  if (direction === 1) {
    drawLeg(translated, 13 + legB, legTop, legB, appearance, skin, skinDark, pants, pantsDark, accent);
    drawLeg(translated, 17 + legA, legTop, legA, appearance, skin, skinDark, pants, pantsDark, accent);
  } else if (direction === 2) {
    drawLeg(translated, 10 + legA, legTop, legA, appearance, skin, skinDark, pants, pantsDark, accent);
    drawLeg(translated, 14 + legB, legTop, legB, appearance, skin, skinDark, pants, pantsDark, accent);
  } else {
    drawLeg(translated, 9, legTop, legA, appearance, skin, skinDark, pants, pantsDark, accent);
    drawLeg(translated, 18, legTop, legB, appearance, skin, skinDark, pants, pantsDark, accent);
  }
  drawBottom(translated, direction, bob, appearance, pants, pantsDark, accent);

  const torsoY = 20 - bob;
  outlineRect(translated, 8, torsoY, 16, 14, shirt);
  translated.rect(8, torsoY, 3, 14, shirtDark);
  translated.rect(21, torsoY, 3, 14, direction === 2 ? shirtLight : shirtDark);
  translated.rect(10, torsoY, 11, 2, shirtLight);
  translated.rect(8, torsoY + 11, 16, 3, shirtDark);
  if (direction === 0) translated.rect(15, torsoY, 3, 3, shirtDark);
  drawTopPattern(translated, direction, torsoY, appearance.topPattern ?? 0, accent, accentDark);
  drawTopDetails(
    translated, direction, torsoY, appearance, shirt, shirtDark, shirtLight, pants, accent, accentDark,
  );

  if (direction !== 2) drawArm(translated, 4, torsoY + 2, armA, false, shirt, shirtDark, skin, skinDark);
  if (direction !== 1) drawArm(translated, 23, torsoY + 2, armB, true, shirt, shirtDark, skin, skinDark);

  const headY = 6 - bob;
  outlineRect(translated, 7, headY, 18, 18, skin);
  translated.rect(7, headY, 2, 18, skinDark);
  translated.rect(9, headY, 14, 2, shade(skin, 1.08));
  translated.rect(8, headY + 16, 16, 2, skinDark);
  translated.rect(14, headY + 18, 5, 3, skin);
  translated.rect(14, headY + 20, 5, 1, skinDark);
  drawFace(translated, direction, headY, appearance, skinDark, accent, accentDark);
  drawHair(translated, direction, headY, appearance.hair, hair, hairDark, hairLight);
  drawGlasses(translated, direction, headY, appearance.glasses ?? 0);
  drawHat(translated, direction, headY, appearance.hat ?? 0);
}
