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

## 멀티플레이 설정 (Supabase)

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. Authentication → Sign In / Up → **Anonymous Sign-Ins 활성화**
3. SQL Editor에서 `supabase/migrations/0001_profiles.sql` 실행
4. 프로젝트 루트에 `.env.local` 작성:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

`.env.local`이 없으면 **오프라인 혼자 모드**로 실행됩니다 (게임은 그대로 동작).

## 스택

Phaser 3 · TypeScript · Vite · Vitest · Supabase (Auth 익명 로그인 · Realtime presence/broadcast)

## 조작

- 이동: W/A/S/D
- 상호작용·배치: 마우스 클릭
- 채팅: Enter (말풍선) · 이모트: E (8종 휠)
