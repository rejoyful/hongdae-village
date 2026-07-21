/**
 * 홍대마을 마스터 팔레트 (스펙 §4 — 차분한 웜톤).
 * 모든 프로시저럴 아트는 이 팔레트 안에서만 색을 고른다.
 */
export const PAL = {
  // 바닥
  plaza1: 0x9a8d7c, plaza2: 0x92867a, plazaLine: 0x847768,
  side1: 0xa89a88, side2: 0xa09280, sideLine: 0x8e8070,
  road1: 0x5c5852, road2: 0x565248, roadLine: 0xcabf9e,
  grass1: 0x7d9468, grass2: 0x74895f, grassDark: 0x63784f, path: 0xb0a084,
  alley1: 0x8a7d6e, alley2: 0x827568,
  // 건물
  wallA: 0xc4a98a, wallB: 0xb3987c, wallC: 0x9f8a72, wallD: 0xb0685a, wallE: 0x8fa38a,
  wallShade: 0x00000022,
  roofA: 0x6e5c4c, roofB: 0x635246, roofLine: 0x55463c,
  winFrame: 0x55463c, winGlassDay: 0xcfe0e4, winGlassWarm: 0xf2d8a0,
  doorWood: 0x8a5a3a, doorDark: 0x6e4830,
  signBg: 0x3a3128, signText: 0xf2d8a8,
  // 캐릭터
  skin: 0xf0cfae, skinShade: 0xd9b493,
  hairA: 0x4a3828, hairB: 0x2e2620, hairC: 0x6e4a30,
  pants: 0x4a4e5c, shoes: 0x322c28,
  outline: 0x3a2f26,
  // 공통
  shadow: 0x00000033,
} as const;

// 방 전용 (위 객체 리터럴 오타 방지를 위해 분리 정의)
export const ROOM_PAL = {
  floorWood1: 0xa8896a, floorWood2: 0x9f8062, floorSeam: 0x8d7156,
  wallPaper: 0xd8cbb6, wallPaperShade: 0xcbbda6, wallBase: 0x8d7156,
} as const;
