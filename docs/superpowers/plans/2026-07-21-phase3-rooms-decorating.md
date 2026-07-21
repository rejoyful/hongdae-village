# 홍대마을 Phase 3 — 개인 방 & 꾸미기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (인라인 실행, Phase 2와 동일 방식).

**Goal:** 주택 골목의 문을 클릭해 내 방에 입주하고, 인벤토리의 가구를 배치·회전·제거하며, 친구 방에 방문하면 배치가 실시간으로 보인다.

**Architecture:** 배치 규칙은 순수 모듈(placement.ts)로 TDD. 아이템 카탈로그는 저장소 JSON(데이터 주도 — 스펙 §3 "코드 수정 없이 아이템 추가"). 방 배치는 Postgres가 진실의 원천, postgres_changes로 방문자에게 실시간 반영. 방 안 캐릭터 co-presence(같은 방에서 서로 보이기)는 Phase 3.5로 분리(방 채널 room:{id}).

**Spec:** §2(개인 공간 10채), §3(꾸미기·아이템), §6(rooms/placements/inventory, RLS)

## 결정 사항

- 방 구조: 12×10 타일 단일 룸(테두리 벽, 하단 중앙 문). 구조 다양화(옥탑방 등)는 Phase 5 아트와 함께.
- 입주: 선착순 — 빈 방(owner null)의 문 클릭 시 claim. 이후 그 문은 "내 방".
- 회전: 0(가로)/1(세로, w·h 스왑) 2단계. 시작 인벤토리: 기본 가구 세트 지급(클라이언트 1회).
- dev 편의: `?room=N` URL로 방 직행, `?offline=1`로 오프라인 강제 (헤드리스 검증용).

## Tasks

1. **아이템 카탈로그** — `src/items/catalog.json` (16종: id·name·category·w·h·color), `src/items/catalog.ts` 로더+검증 (TDD)
2. **배치 규칙 (TDD)** — `src/game/entities/placement.ts`: footprint(회전 반영), canPlace(경계·겹침), ROOM_W/H 상수는 `src/game/world/roomMap.ts`
3. **roomMap** — 12×10 충돌(테두리), 문 타일, 스폰 (TDD 간단)
4. **거리 연결** — mapData에 HOUSE_DOORS 10개(roomId↔문 타일), StreetScene 문 클릭 → 입주/입장
5. **DB 마이그레이션** — `supabase/migrations/0002_rooms.sql`: rooms(1..10 시드)·inventory·placements + RLS(쓰기는 방 주인/본인만). 적용은 사용자 SQL Editor 실행
6. **Supabase 글루** — `src/db/roomsApi.ts`: claimRoom·inventory 로드/시작 지급·placements CRUD·실시간 구독
7. **RoomScene + 꾸미기 UI** — 방 렌더·WASD 이동·문으로 퇴장, 주인 모드: 하단 인벤토리 바(DOM)→고스트 프리뷰(R 회전, 초록/빨강)→클릭 배치, 배치물 클릭 제거. 방문 모드: 읽기 전용+실시간 반영
8. **검증·PR** — 단위 테스트, typecheck·build, 헤드리스 스크린샷(거리 문·방 내부), PR·CI

## 범위 밖 (Phase 3.5+)

방 안 co-presence·방 채널 / 벽지·바닥 교체 / 겹침 레이어(러그 위 가구) / 아이템 구매(Phase 4 경제)
