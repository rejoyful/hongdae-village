# 홍대마을 (Hongdae Village)

서울 홍대입구역 일대를 배경으로 한 픽셀아트 힐링 멀티플레이 웹 게임 (최대 10인).
각자의 공간을 꾸미고, 아이템을 만들고 거래하며, 작은 사회를 만들어갑니다.

- 디자인 스펙: `docs/superpowers/specs/2026-07-08-hongdae-village-design.md`
- 구현 계획: `docs/superpowers/plans/`

## 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 단위 테스트
npm run typecheck  # 타입 검사
```

## 스택

Phaser 3 · TypeScript · Vite · Vitest · Supabase (Phase 2~)

## 조작

- 이동: W/A/S/D
- 상호작용·배치: 마우스 클릭
