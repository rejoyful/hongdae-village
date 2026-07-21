/** 게임 전역 상수 — 스펙 §4(32px 타일·2배 렌더), §1(조작) */
export const TILE = 32;          // 기준 타일 픽셀
export const ZOOM = 2;           // 화면 2배 확대 렌더링
export const PLAYER_SPEED = 140; // px/초 (월드 좌표 기준, 잠정치 — 실플레이 후 조정)
export const MAP_W = 80;         // 시즌1 맵 타일 크기 (스펙 §2)
export const MAP_H = 60;

/** 텍스트 렌더 해상도 — 고해상도 모바일에서 흐릿함 방지 (Phaser Text style.resolution) */
export const TEXT_RES = Math.min(3, Math.max(2, Math.round(
  (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1)));
