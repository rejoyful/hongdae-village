# 홍대마을 Phase 2 — 멀티플레이 코어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 두 명 이상이 같은 홍대 거리에 접속해 서로의 캐릭터를 보고, 말풍선 채팅과 이모트로 소통한다.

**Architecture:** 네트워킹은 `NetworkAdapter` 인터페이스 뒤로 격리하고 Supabase Realtime 구현체를 붙인다. 로컬 플레이어는 기존 `stepPlayer`(입력 구동), 원격 플레이어는 브로드캐스트 위치를 보간(interpolation) 구동 — 이 분리는 Phase 1 리뷰에서 명시된 결정이다. DB는 프로필만 (위치는 DB 미경유, broadcast 전용).

**Tech Stack:** @supabase/supabase-js v2 (Auth 익명 로그인 + Realtime presence/broadcast), 기존 Phaser 3 + TS + Vite + Vitest

**Spec:** `docs/superpowers/specs/2026-07-08-hongdae-village-design.md` §3(소통), §6(Realtime 채널 설계)

**결정 사항 (이 플랜에서 확정):**
- 로그인은 **익명 인증 + 닉네임**으로 시작. 카카오 OAuth는 Phase 2.5로 분리 (카카오 개발자 앱 등록이 사용자 작업이라 병목이 되지 않도록).
- 위치 전송 10Hz, 보간 지연 버퍼 120ms (스펙 §6).
- 채널: `street` 1개 (Phase 2에서 방은 아직 없음).

---

## 선행 조건 (사용자 작업 — 코드 시작 전 필요)

1. supabase.com 프로젝트 생성 → Project URL + anon key 확보
2. Supabase 대시보드 → Authentication → Sign In / Up → **Anonymous Sign-Ins 활성화**
3. 프로젝트 루트에 `.env.local` 작성 (아래 Task 1 참조). `.env*`는 이미 gitignore됨.

## 파일 구조 (신규)

```
src/
├── net/
│   ├── protocol.ts        # 와이어 메시지 타입 + 상수 (순수, 테스트)
│   ├── NetworkAdapter.ts  # 인터페이스 (구현 독립)
│   └── SupabaseAdapter.ts # Supabase Realtime 구현체
├── game/entities/
│   └── remoteMotion.ts    # 원격 위치 보간 (순수, 테스트)
├── supabaseClient.ts      # env 검증 + 클라이언트 팩토리
└── ui/
    ├── overlay.css        # HTML 오버레이 공통 스타일
    ├── loginPanel.ts      # 닉네임 입력 → 익명 로그인
    ├── chatInput.ts       # Enter로 열리는 채팅 입력 (열려있는 동안 WASD 캡처 해제!)
    └── emoteWheel.ts      # E키 → 이모트 8종 휠
supabase/migrations/
    └── 0001_profiles.sql
```

---

### Task 1: Supabase 클라이언트 연결

**Files:** Create `src/supabaseClient.ts`, `.env.local`(사용자 값), Modify `package.json`

- [ ] `npm install @supabase/supabase-js`
- [ ] `.env.local`: `VITE_SUPABASE_URL=...` / `VITE_SUPABASE_ANON_KEY=...`
- [ ] `src/supabaseClient.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabase(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 .env.local에 필요합니다');
  }
  return createClient(url, key);
}
```

- [ ] 검증: `npm run typecheck` / 커밋 `feat: Supabase 클라이언트 연결`

### Task 2: profiles 테이블 + RLS

**Files:** Create `supabase/migrations/0001_profiles.sql`

- [ ] SQL (Supabase SQL Editor 또는 CLI로 적용 후 저장소 커밋):

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 12),
  color text not null default 'e8c9a0', -- 캐릭터 placeholder 색 (hex, # 제외)
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_read_all"  on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
```

- [ ] 커밋 `feat: profiles 스키마·RLS`

### Task 3: 프로토콜 타입 (TDD)

**Files:** Create `src/net/protocol.ts`, `tests/protocol.test.ts`

- [ ] 와이어 타입 — broadcast payload는 짧은 키로 (10Hz × 10인 대역폭 절약):

```ts
/** broadcast 이벤트 이름 */
export const EV = { pos: 'p', chat: 'c', emote: 'e' } as const;

export interface PosMsg  { x: number; y: number; f: 0 | 1 | 2 | 3 }  // f: 방향(하우좌상)
export interface ChatMsg { t: string }                                // 최대 80자, trim
export interface EmoteMsg { k: EmoteKind }
export type EmoteKind = 'heart' | 'laugh' | 'clap' | 'dance' | 'surprise' | 'sleepy' | 'cheers' | 'wave';

export const POS_HZ = 10;            // 위치 전송 주기
export const INTERP_DELAY_MS = 120;  // 보간 지연 버퍼

/** 채팅 메시지 정제: trim + 80자 제한 + 빈 문자열이면 null */
export function sanitizeChat(raw: string): string | null;
```

- [ ] 테스트: sanitizeChat — trim, 80자 초과 절단, 공백만이면 null, 정상 통과
- [ ] 커밋 `feat: 네트워크 프로토콜 타입`

### Task 4: NetworkAdapter 인터페이스

**Files:** Create `src/net/NetworkAdapter.ts`

```ts
import type { PosMsg, ChatMsg, EmoteMsg } from './protocol';

export interface PeerState { userId: string; nickname: string; color: string }

/** 네트워킹 추상화 — Supabase 구현체를 끼우고, 추후 전용 서버로 교체 가능한 유일한 지점 */
export interface NetworkAdapter {
  connect(self: PeerState): Promise<void>;
  disconnect(): Promise<void>;
  sendPos(msg: PosMsg): void;        // fire-and-forget, 10Hz
  sendChat(msg: ChatMsg): void;
  sendEmote(msg: EmoteMsg): void;
  onPeerJoin(cb: (peer: PeerState) => void): void;
  onPeerLeave(cb: (userId: string) => void): void;
  onPos(cb: (userId: string, msg: PosMsg, atMs: number) => void): void;
  onChat(cb: (userId: string, msg: ChatMsg) => void): void;
  onEmote(cb: (userId: string, msg: EmoteMsg) => void): void;
}
```

- [ ] 커밋 `feat: NetworkAdapter 인터페이스`

### Task 5: 원격 보간 모듈 (TDD — 핵심 순수 로직)

**Files:** Create `src/game/entities/remoteMotion.ts`, `tests/remoteMotion.test.ts`

- [ ] 링버퍼에 (t, x, y) 스냅샷 쌓고, `now - INTERP_DELAY_MS` 시점을 두 스냅샷 사이 선형 보간으로 샘플:

```ts
export interface Snapshot { t: number; x: number; y: number }

export class RemoteTrack {
  private buf: Snapshot[] = [];               // 시간 오름차순, 최대 32개
  push(s: Snapshot): void;                    // 과거 시각이 들어오면 무시(순서 보장)
  /** renderT(now-120ms) 시점 위치. 버퍼가 비면 null, 최신보다 미래면 최신값 고정 */
  sample(renderT: number): { x: number; y: number } | null;
}
```

- [ ] 테스트 5개: 빈 버퍼 null / 스냅샷 1개면 그 값 / 두 스냅샷 사이 중간 시각 = 선형 중간값 / 최신 이후 시각 = 최신값 유지 / 역순 push 무시
- [ ] 커밋 `feat: 원격 플레이어 보간 트랙`

### Task 6: SupabaseAdapter 구현

**Files:** Create `src/net/SupabaseAdapter.ts`

- [ ] `client.channel('street', { config: { presence: { key: userId }, broadcast: { self: false } } })`
- [ ] presence sync/join/leave → onPeerJoin/onPeerLeave (presence state에 nickname·color 실림)
- [ ] `channel.send({ type: 'broadcast', event: EV.pos, payload })` / on(EV.pos) 수신 시 `atMs = Date.now()`로 콜백
- [ ] 끊김 대응: `channel.subscribe` 상태 콜백에서 CLOSED/CHANNEL_ERROR 시 지수 백오프 재구독 (스펙 §7 "혼자 모드로 계속")
- [ ] 커밋 `feat: Supabase Realtime 어댑터`

### Task 7: 로그인 UI + 부트 플로우

**Files:** Create `src/ui/loginPanel.ts`, `src/ui/overlay.css`, Modify `src/main.ts`

- [ ] 시작 시: 세션 있으면 profiles에서 닉네임 로드 → 바로 게임. 없으면 닉네임 입력 패널 → `supabase.auth.signInAnonymously()` → profiles upsert → 게임 시작
- [ ] 게임 시작 시 StreetScene에 `{ selfPeer, adapter }` 주입 (scene.start data)
- [ ] 커밋 `feat: 익명 로그인·닉네임 온보딩`

### Task 8: StreetScene 멀티플레이 통합

**Files:** Modify `src/game/scenes/StreetScene.ts`

- [ ] Phase 1 리뷰 결정 반영: `this.player`(로컬, stepPlayer 구동)와 `remotes: Map<string, {rect, label, track: RemoteTrack}>`(보간 구동) 분리. 카메라는 로컬만 팔로우
- [ ] update(): 로컬 이동 후 10Hz 스로틀로 `sendPos`; 원격은 `track.sample(now - INTERP_DELAY_MS)`로 위치 갱신
- [ ] onPeerJoin → 원격 rect(+색)·닉네임 라벨 생성 / onPeerLeave → 제거
- [ ] 커밋 `feat: 거리 멀티플레이 — 원격 렌더·보간`

### Task 9: 말풍선 + 이모트

**Files:** Create `src/ui/chatInput.ts`, `src/ui/emoteWheel.ts`, Modify StreetScene

- [ ] Enter → 채팅 입력창 오픈. **오픈 동안 `scene.input.keyboard.enabled = false` + `removeCapture('W,A,S,D')`** (Phase 1 리뷰가 예고한 WASD 캡처 충돌 — 여기서 해소). 전송 시 sanitizeChat → sendChat
- [ ] 말풍선: 캐릭터 머리 위 Phaser Text+배경, 4초 후 페이드. 로컬/원격 공통 함수
- [ ] E키 → 이모트 휠(8종) → sendEmote → 머리 위 이모트 스프라이트 2초
- [ ] 커밋 `feat: 말풍선 채팅·이모트`

### Task 10: 통합 검증 + 마무리

- [ ] `npm run typecheck && npm test && npm run build` 전체 그린
- [ ] 브라우저 탭 2개(일반+시크릿)로 실측: 서로 보임 / 움직임 부드러움(보간) / 말풍선·이모트 상호 표시 / 한 탭 종료 시 상대 화면에서 제거
- [ ] README에 Supabase 설정(.env.local) 섹션 추가
- [ ] main 머지 (Phase 1과 동일하게 브랜치 `feature/phase2-multiplayer` → PR → CI → 머지)

## Self-Review 결과

- **커버리지**: 스펙 §3 소통(말풍선·이모트 8종·근접 개념은 "같은 street 채널"로 단순화 — 방 채널은 Phase 3), §6 Realtime(presence/broadcast/10Hz/보간) 커버. 카카오 OAuth는 Phase 2.5로 명시 분리 — 스펙 §1 로그인 결정의 부분 이행이며 의도된 순서 변경.
- **플레이스홀더**: UI 태스크(7·9)는 Phase 1보다 기술 수준이 낮게 기술됨 — 사용량 제약으로 의도된 결정. 핵심 계약(프로토콜·어댑터 인터페이스·보간·스키마·RLS)은 코드로 고정했으므로 실행 세션이 세부를 채워도 아키텍처가 흔들리지 않는다.
- **타입 일관성**: protocol.ts의 EV/PosMsg/EmoteKind ↔ NetworkAdapter 시그니처 ↔ Task 8 사용처 일치 확인.
