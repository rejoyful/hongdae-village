#!/usr/bin/env python3
"""AI 생성 이미지 → 게임 픽셀 스프라이트 정제 (스펙 §4 파이프라인 2단계).

사용:
  pixelize.py <입력> <출력png> <타일폭> <타일높이> [색상수=28] [--white-key] [--rot <출력2>]

- 기본: 목표 비율 중앙 크롭 → 32px 그리드 다운스케일 → 적응형 팔레트 양자화
- --white-key: 테두리와 이어진 흰 배경을 투명 처리(플러드필) 후 내용 bbox를
  타일 프레임에 하단 정렬로 배치 (서있는 가구용)
- --rot: 90도 회전 변형본도 저장 (배치 회전 rot=1용)
"""
import sys
from collections import deque
from PIL import Image

TILE = 32
WHITE_T = 242  # 이 값 이상 RGB는 배경 후보


def flood_key_white(img: Image.Image) -> Image.Image:
    """테두리에서 이어진 근사-흰색 영역만 투명화 (오브젝트 내부 흰색은 보존)"""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    q = deque()

    def is_white(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and r >= WHITE_T and g >= WHITE_T and b >= WHITE_T

    for x in range(w):
        for y in (0, h - 1):
            if is_white(x, y) and not seen[y * w + x]:
                q.append((x, y)); seen[y * w + x] = 1
    for y in range(h):
        for x in (0, w - 1):
            if is_white(x, y) and not seen[y * w + x]:
                q.append((x, y)); seen[y * w + x] = 1
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_white(nx, ny):
                seen[ny * w + nx] = 1
                q.append((nx, ny))
    return img


def quantize_rgba(img: Image.Image, colors: int) -> Image.Image:
    """RGB만 양자화하고 알파는 임계 이진화 (픽셀아트 경계 유지)"""
    alpha = img.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = img.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def main() -> None:
    argv = sys.argv[1:]
    rot_dst = None
    if "--rot" in argv:
        i = argv.index("--rot")
        rot_dst = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    white_key = "--white-key" in argv
    args = [a for a in argv if not a.startswith("--")]

    src, dst, tw, th = args[0], args[1], int(args[2]), int(args[3])
    colors = int(args[4]) if len(args) > 4 else 28
    target_w, target_h = tw * TILE, th * TILE

    img = Image.open(src)

    if white_key:
        img = flood_key_white(img)
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        # contain 스케일 후 하단 중앙 정렬 (서있는 가구는 바닥에 붙는다)
        scale = min(target_w * 2 / img.width, target_h * 2 / img.height)
        nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (target_w * 2, target_h * 2), (0, 0, 0, 0))
        canvas.paste(img, ((target_w * 2 - nw) // 2, target_h * 2 - nh), img)
        img = canvas.resize((target_w, target_h), Image.NEAREST)
        img = quantize_rgba(img, colors)
    else:
        img = img.convert("RGB")
        ratio = target_w / target_h
        w, h = img.size
        if w / h > ratio:
            nw = int(h * ratio)
            img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = int(w / ratio)
            img = img.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        img = img.resize((target_w * 2, target_h * 2), Image.LANCZOS)
        img = img.resize((target_w, target_h), Image.NEAREST)
        img = img.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")

    img.save(dst, optimize=True)
    print(f"OK {dst} {target_w}x{target_h}")
    if rot_dst:
        img.transpose(Image.ROTATE_90).save(rot_dst, optimize=True)
        print(f"OK {rot_dst} (rot90)")


if __name__ == "__main__":
    main()
