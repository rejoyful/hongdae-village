#!/usr/bin/env python3
"""Normalize a transparent source into a compact, bottom-anchored pixel sprite.

Usage:
  normalize_alpha_sprite.py INPUT OUTPUT [SIZE=48|WIDTHxHEIGHT] [COLORS=64]

The chroma-key removal step is intentionally separate. This script crops by
alpha, fits the subject into a square runtime canvas with a two-pixel safe
margin, uses nearest-neighbour sampling, and keeps a binary alpha edge so the
result stays crisp under Phaser's pixel-art renderer.
"""
import sys
from pathlib import Path

from PIL import Image


def quantize_rgba(image: Image.Image, colors: int) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    rgb = image.convert("RGB").quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: normalize_alpha_sprite.py INPUT OUTPUT [SIZE=48|WIDTHxHEIGHT] [COLORS=64]")

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    canvas_spec = sys.argv[3].lower() if len(sys.argv) > 3 else "48"
    if "x" in canvas_spec:
        width_text, height_text = canvas_spec.split("x", 1)
        canvas_width, canvas_height = int(width_text), int(height_text)
    else:
        canvas_width = canvas_height = int(canvas_spec)
    colors = int(sys.argv[4]) if len(sys.argv) > 4 else 64
    margin = max(2, round(min(canvas_width, canvas_height) * 0.045))

    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    image.putalpha(alpha)
    bbox = alpha.getbbox()
    if bbox is None:
        raise SystemExit(f"no opaque pixels in {source}")
    subject = image.crop(bbox)

    available_width = canvas_width - margin * 2
    available_height = canvas_height - margin * 2
    scale = min(available_width / subject.width, available_height / subject.height)
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    subject = subject.resize((width, height), Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    canvas.alpha_composite(subject, ((canvas_width - width) // 2, canvas_height - margin - height))
    canvas = quantize_rgba(canvas, colors)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)
    print(f"OK {output} {canvas_width}x{canvas_height} colors={colors} bbox={canvas.getchannel('A').getbbox()}")


if __name__ == "__main__":
    main()
