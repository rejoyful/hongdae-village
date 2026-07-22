-- 0014: 진행 데이터 계정 동기 (레벨·펫 친밀도·보물·퀘스트를 기기 간 유지)
-- 지금까지 이 값들은 localStorage(기기별)라 다른 폰에서 로그인하면 초기화돼 보였다.
-- profiles.game_state(jsonb)에 스냅샷을 저장해 계정을 따라다니게 한다.

alter table public.profiles add column if not exists game_state jsonb;

-- 본인 프로필의 game_state만 갱신 가능 (기존 profiles_update_own 정책 + 컬럼 grant)
grant update (game_state) on public.profiles to authenticated;
