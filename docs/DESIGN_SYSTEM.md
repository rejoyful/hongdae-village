# 디자이너가 만드는 세상 — 게임 디자인 시스템

> 상태: Active / UI 단일 진실 원천(SSOT)
> 버전: `WORLD UI 1.0 · LIQUID GLASS`
> 최종 갱신: 2026-07-23

이 문서는 게임의 모든 DOM UI와 이후 제작하는 화면의 톤앤매너를 고정한다.
월드·캐릭터·아이소메트릭 픽셀아트 규칙은 `docs/STYLE_GUIDE.md`를 따르고,
두 문서가 충돌하면 **UI에는 이 문서가 우선**한다.

---

## 1. 제품 문장

**완성된 세계를 소비하는 대신, 디자이너들이 필요한 장면을 하나씩 커밋하는 아이소메트릭 공동 세계.**

UI는 게임보다 앞에 나서지 않는다. 정밀한 픽셀 월드를 선명한 콘텐츠 층으로 두고,
조작과 안내만 반응형 Liquid Glass 기능 층으로 띄운다.

### 1.1 감정 키워드

- 차분한 시작
- 공동 제작
- 정밀한 도구
- 살아 있는 재질
- 작은 커밋의 축적

### 1.2 금지 키워드

- 코지 농장게임 클리셰
- 판타지 RPG 장식
- 사이버펑크 네온
- 과도한 광택과 외곽 글로우
- 모든 정보를 카드로 감싸는 대시보드
- 보라색 AI 그라디언트

---

## 2. 시각 구조

모든 화면은 아래 세 층으로 나눈다.

| 층 | 역할 | 재질 |
|---|---|---|
| Content | 아이소메트릭 월드, 캐릭터, 아이템, 사진, 픽셀 삽화 | 불투명 픽셀아트 |
| Standard Material | 목록, 문서, 기록, 긴 본문 | Bone Paper 또는 Charcoal Sheet |
| Functional Glass | 버튼, 탭, HUD, 도구막대, 팝업, 내비게이션 | Liquid Glass |

Liquid Glass는 기능 층에만 사용한다. 콘텐츠 카드마다 유리를 반복해 겹치지 않는다.
긴 글과 복잡한 데이터는 더 불투명한 `regular`, 풍부한 픽셀아트 위의 짧은 제어는 `clear`를 쓴다.

---

## 3. 색상

한 화면의 강조색은 **Muted Coral 하나**다. 진행 상태의 세이지와 오류색은 의미 전달에만 쓴다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--dw-canvas` | `#151a1c` | 기본 배경 |
| `--dw-canvas-raised` | `#1d2325` | 어두운 표준 재질 |
| `--dw-paper` | `#f1ecdf` | 주요 텍스트, 밝은 종이 |
| `--dw-paper-muted` | `#aaa79d` | 보조 텍스트 |
| `--dw-ink` | `#1d2021` | 밝은 표면 위 글자 |
| `--dw-accent` | `#d86f5d` | 단일 강조, 주요 행동 |
| `--dw-accent-strong` | `#e98572` | 강조 hover |
| `--dw-sage` | `#819b80` | 온라인, 완료, 안전 |
| `--dw-error` | `#e89a8b` | 오류 |

규칙:

- 순수 검정 `#000`을 쓰지 않는다.
- 강조색은 선택, 진행, 주요 CTA에만 사용한다.
- 희귀도나 게임 고유 색은 아이템 콘텐츠 안에서만 유지한다.
- 유리 자체는 무채색이다. 주요 버튼만 엷은 coral stained glass를 사용한다.

---

## 4. Liquid Glass 재질

재질 토큰은 `--dw-glass-regular`, `--dw-glass-clear`, `--dw-glass-control`,
`--dw-glass-line`, `--dw-glass-shadow`를 사용한다. 화면 전용 CSS에서 별도 blur와
그림자 값을 만들지 않는다.

### 4.1 Regular

본문이 있거나 배경이 복잡한 팝업·사이드바·로그인 폼에 사용한다.

```css
background: rgba(27, 33, 35, .76);
backdrop-filter: blur(24px) saturate(1.16);
border: 1px solid rgba(255, 255, 255, .18);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, .16),
  inset 0 -1px 0 rgba(255, 255, 255, .05),
  0 18px 52px rgba(8, 12, 13, .28);
```

### 4.2 Clear

픽셀아트가 충분히 어둡고 텍스트가 짧은 HUD·도구막대에 사용한다.

```css
background: rgba(255, 255, 255, .075);
backdrop-filter: blur(16px) saturate(1.2);
border: 1px solid rgba(255, 255, 255, .2);
```

밝은 이미지 위에서는 유리 뒤에 최대 35%의 어두운 dim layer를 추가한다.

### 4.3 Stained

화면에서 가장 중요한 행동 한 개에만 사용한다.

```css
background: color-mix(in srgb, var(--dw-accent) 72%, rgba(31, 35, 36, .74));
```

### 4.4 유리 형태

- 작은 버튼: 12px
- 입력·세그먼트: 14px
- HUD 그룹: 18px
- 팝업: 24px
- 전체 화면 시트: 상단 28px, 모바일에서는 화면 모서리와 동심 형태
- 같은 그룹 안의 모서리는 바깥 컨테이너보다 6~10px 작게 한다.

### 4.5 성능

- 여러 버튼은 하나의 유리 컨테이너에서 blur를 공유한다.
- 각 버튼에는 blur 대신 반투명 채움과 내부 굴절선만 적용한다.
- 애니메이션은 `transform`과 `opacity`만 사용한다.
- 노이즈는 고정된 `pointer-events:none` 층에서만 사용한다.

---

## 5. 컴포넌트 계약

### 5.1 버튼

- 한 화면의 주요 버튼은 하나다.
- 높이: 데스크톱 44px 이상, 모바일 48px 이상.
- 아이콘만 있는 버튼은 44×44px 이상이며 접근 가능한 이름이 필요하다.
- `hover`: 위로 1px, 굴절선이 조금 밝아진다.
- `active`: `translateY(1px) scale(.98)`.
- `disabled`: 채도와 대비를 낮추되 라벨은 읽을 수 있어야 한다.
- 위험 행동은 coral을 채우지 않고 오류색 테두리와 2단계 확인을 사용한다.

공통 클래스:

- `.dw-control`
- `.dw-control--primary`
- `.dw-control--quiet`
- `.dw-control--danger`
- `.dw-icon-control`

### 5.2 입력

- 라벨은 항상 입력 위에 둔다.
- 본문 입력 크기는 16px 이상으로 모바일 확대와 글자 뭉개짐을 방지한다.
- 도움말과 오류는 입력 아래에 둔다.
- 포커스는 coral 외곽선과 왼쪽 3px 굴절선으로 표시한다.
- placeholder만으로 의미를 전달하지 않는다.

### 5.3 탭과 세그먼트

- 2~5개의 동등한 보기 전환에만 사용한다.
- 선택 상태는 색뿐 아니라 `aria-selected`와 하단/내부 표식으로 전달한다.
- 한 그룹 전체가 하나의 `clear` 유리 덩어리로 보이게 한다.

### 5.4 HUD

- 콘텐츠 위에 떠 있는 `clear` 유리다.
- 좌상단: 현재 맥락과 목표.
- 우상단: 자원·시간·설정.
- 하단: 주 행동 도구막대.
- 한 모서리에 두 개 이상의 독립 유리 그룹을 쌓지 않는다.
- 모바일에서는 하단 safe area를 지키고 가로 스크롤 대신 핵심 행동만 남긴다.

### 5.5 팝업과 시트

- 배경 dim layer 한 장 + `regular` 유리 시트 한 장이 기본이다.
- 팝업 위에 다시 팝업을 올리지 않는다.
- 긴 기록은 유리 안에 Bone Paper 표준 재질을 배치한다.
- 닫기는 우상단, 저장·확인은 우하단 또는 하단 고정 영역에 둔다.

### 5.6 알림

- 게임을 멈추지 않는 알림은 우하단 또는 하단 도구막대 위에 한 장만 표시한다.
- 여러 결과는 한 알림 안에 요약한다.
- 성공·오류·대기는 색만이 아니라 문장으로 구분한다.

---

## 6. 타이포그래피

```css
font-family:
  "Pretendard", "SUIT", "Apple SD Gothic Neo",
  "Noto Sans KR", system-ui, sans-serif;
```

- Display: 700~800, 자간 `-.06em`, 40~72px
- Section title: 720, 자간 `-.035em`, 20~28px
- Body: 500~650, 14~16px, 행간 1.55
- UI label: 700, 12~14px
- Metadata: monospace, 9~11px, 자간 `.08em`
- 모바일 본문 13px 미만 금지
- 아이콘 자리에 이모지를 사용하지 않는다.

---

## 7. 배치

- 데스크톱은 비대칭 2열과 넓은 여백을 기본으로 한다.
- 760px 이하에서는 반드시 단일 열로 접는다.
- 페이지 전체 가로 스크롤을 만들지 않는다.
- 콘텐츠 정렬선과 유리 컨트롤 정렬선을 맞춘다.
- 동일한 의미의 요소는 동일한 간격을 쓴다.

간격 토큰:

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
```

---

## 8. 모션

- 기본 이징: `cubic-bezier(.16, 1, .3, 1)`
- 버튼: 160~220ms
- 팝업: 320~420ms
- 화면 전환: 450~650ms
- 자동 반복은 온라인 점·현재 위치처럼 살아 있음을 전달할 때만 사용한다.
- `prefers-reduced-motion`에서는 반복 모션과 이동 변형을 제거한다.
- `prefers-reduced-transparency` 또는 고대비 환경에서는 blur를 제거하고 불투명 표면으로 바꾼다.

---

## 9. 접근성 완료 조건

- 일반 텍스트 대비 4.5:1 이상
- 큰 텍스트와 굵은 UI 라벨 대비 3:1 이상
- 키보드 포커스가 항상 보임
- 터치 대상 44×44px 이상
- 입력 16px 이상
- 상태를 색만으로 전달하지 않음
- blur 없이도 계층이 유지됨
- 390×844와 1280×720에서 핵심 행동이 잘리지 않음

---

## 10. 구현 규칙

1. 신규 UI를 만들기 전에 이 문서의 컴포넌트 계약을 선택한다.
2. 색·반경·그림자를 직접 쓰지 않고 `src/ui/liquidGlass.css` 토큰을 사용한다.
3. 공통 클래스가 부족하면 먼저 토큰과 공통 클래스를 확장한다.
4. 화면 전용 CSS는 구조와 콘텐츠 표현만 담당한다.
5. UI 변경 커밋에는 390×844, 1280×720 검수와 전체 테스트를 포함한다.
6. 톤앤매너를 바꿀 때는 이 문서를 먼저 수정하고 코드에 반영한다.

### 10.1 검수 경로

배포 주소에 `?style-guide`를 붙이면 현재 공통 재질과 컴포넌트를 확인할 수 있다.

```text
https://rejoyful.github.io/hongdae-village/?style-guide
```

---

## 11. 참고 원칙

- Apple Liquid Glass는 콘텐츠와 기능 층의 구분을 강조한다.
- 복잡한 본문에는 regular, 풍부한 미디어 위 짧은 조작에는 clear를 사용한다.
- 재질은 과용하지 않고 중요한 제어와 내비게이션을 중심으로 사용한다.
- 투명도·모션 감소와 고대비 설정에서도 기능이 유지되어야 한다.

공식 참고:

- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple Developer — Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
- [WWDC25 — Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
