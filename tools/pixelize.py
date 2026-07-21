#!/usr/bin/env python3
"""AI 생성 이미지 → 게임 픽셀 스프라이트 정제 (스펙 §4 파이프라인 2단계).

사용: pixelize.py <입력이미지> <출력png> <타일폭> <타일높이> [색상수=28]
- 타일 크기(32px) 격자에 맞춰 다운스케일 (LANCZOS → 최근접 정렬)
- 적응형 팔레트 양자화로 픽셀아트 톤 통일
"""
import sys
from PIL import Image

TILE = 32

def main() -> None:
    src, dst, tw, th = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    colors = int(sys.argv[5]) if len(sys.argv) > 5 else 28

    img = Image.open(src).convert("RGB")
    target_w, target_h = tw * TILE, th * TILE

    # 1) 목표 비율로 중앙 크롭
    ratio = target_w / target_h
    w, h = img.size
    if w / h > ratio:
        nw = int(h * ratio)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / ratio)
        img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))

    # 2) 2배 크기로 부드럽게 줄인 뒤 최근접으로 반토막 → 픽셀 경계가 선명해짐
    img = img.resize((target_w * 2, target_h * 2), Image.LANCZOS)
    img = img.resize((target_w, target_h), Image.NEAREST)

    # 3) 적응형 팔레트 양자화 (디더링 없이 — 면이 깔끔한 픽셀아트 톤)
    img = img.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE)

    img.convert("RGB").save(dst, optimize=True)
    print(f"OK {dst} {target_w}x{target_h} colors<={colors}")

if __name__ == "__main__":
    main()
