# 홍대마을 타이틀 키아트 v2 생성 기록

생성 방식: Codex 내장 `image_gen`  
런타임 자산: `public/assets/ui/title_keyart_v2.webp`, `title_keyart_mobile_v2.webp`  
무손실 마스터: 같은 경로의 PNG 파일

## 데스크톱 16:9

기존 `title_keyart_v1.png`는 화풍·세계관 참고로만 사용했다. 따뜻한 홍대 골목 정체성, 블루아워 조명,
수공예 픽셀 질감은 유지하되 새로운 2:1 아이소메트릭 구도로 생성했다.

핵심 프롬프트:

> Premium 16:9 PC title-screen key art for a fictional Seoul Hongdae village. One coherent 2:1 isometric
> mixed-use alley block at blue hour; open windows reveal a customizable home, cafe, clothing atelier,
> pet corner, rooftop garden, busking platform, and shared lantern garden. Three original residents with
> distinct outfits and small companion pets cross the central alley. Authentic hand-authored crisp pixel
> art, warm brick, cream plaster, muted teal, sage and amber. No text, UI, logos, watermark, copied
> characters, neon cyberpunk, warped geometry, or painterly softness.

## 모바일 9:16

데스크톱 v2를 화풍·팔레트·픽셀 스케일 기준으로 사용하고 단순 크롭이 아닌 전용 세로 구도를 생성했다.

핵심 프롬프트:

> Portrait 9:16 companion title art of the same fictional village. Rooftop garden, studio windows and
> lantern pergola in the upper half; residents and a small dog in the central plaza; the lower 35 percent
> becomes a quiet, dark, low-contrast stone alley for readable mobile login UI. Match the desktop image's
> crisp pixel grid and true 2:1 isometric geometry. No text, UI, logos, watermark, pseudo-signage,
> duplicated animals, oversized characters, photorealism, or painterly softness.

## 후처리

- 원본 PNG를 그대로 보존했다.
- 런타임 WebP는 `cwebp -q 88 -m 6 -sharp_yuv`로 생성했다.
- 데스크톱과 모바일은 CSS 미디어 쿼리로 분리하며 중앙 크롭에 의존하지 않는다.
