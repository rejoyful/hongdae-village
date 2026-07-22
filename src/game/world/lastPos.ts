/** 마지막 위치 저장 (localStorage, userId별) — 새로고침해도 그 자리에서 시작 */
const KEY = (uid: string) => `hv-pos-${uid}`;

export interface Tile { tx: number; ty: number }

export function saveLastPos(uid: string, tx: number, ty: number): void {
  try { localStorage.setItem(KEY(uid), JSON.stringify({ tx, ty })); } catch { /* 무시 */ }
}

export function loadLastPos(uid: string): Tile | null {
  try {
    const r = JSON.parse(localStorage.getItem(KEY(uid)) ?? 'null');
    if (r && Number.isInteger(r.tx) && Number.isInteger(r.ty)) return { tx: r.tx, ty: r.ty };
  } catch { /* 무시 */ }
  return null;
}
