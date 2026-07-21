/**
 * 오목 (13×13, 플레이어 흑 선공 vs 휴리스틱 AI 백).
 * 순수 로직 — UI는 ui/omokPanel.ts.
 */
export const OMOK_N = 13;
export type Stone = 0 | 1 | 2; // 0 빈칸, 1 흑(플레이어), 2 백(AI)

export interface OmokState {
  board: Stone[]; // N*N
  turn: 1 | 2;
  winner: 0 | 1 | 2;
  moves: number;
}

export function newOmok(): OmokState {
  return { board: new Array(OMOK_N * OMOK_N).fill(0) as Stone[], turn: 1, winner: 0, moves: 0 };
}

const DIRS: Array<[number, number]> = [[1, 0], [0, 1], [1, 1], [1, -1]];

function countRun(b: Stone[], x: number, y: number, dx: number, dy: number, who: Stone): number {
  let c = 0;
  let cx = x + dx, cy = y + dy;
  while (cx >= 0 && cx < OMOK_N && cy >= 0 && cy < OMOK_N && b[cy * OMOK_N + cx] === who) {
    c++; cx += dx; cy += dy;
  }
  return c;
}

export function checkWin(b: Stone[], x: number, y: number): boolean {
  const who = b[y * OMOK_N + x];
  if (!who) return false;
  for (const [dx, dy] of DIRS) {
    if (1 + countRun(b, x, y, dx, dy, who) + countRun(b, x, y, -dx, -dy, who) >= 5) return true;
  }
  return false;
}

export function place(s: OmokState, x: number, y: number): OmokState | null {
  if (s.winner || b(s)[y * OMOK_N + x] !== 0) return null;
  const board = [...s.board];
  board[y * OMOK_N + x] = s.turn;
  const winner = checkWin(board, x, y) ? s.turn : 0;
  return { board, turn: s.turn === 1 ? 2 : 1, winner, moves: s.moves + 1 };
}

function b(s: OmokState): Stone[] { return s.board; }

/** 셀 점수: 자기 연결(공격) + 상대 연결(수비)을 패턴 길이 기반으로 평가 */
function scoreCell(board: Stone[], x: number, y: number, me: Stone, foe: Stone): number {
  let score = 0;
  for (const [dx, dy] of DIRS) {
    const mine = countRun(board, x, y, dx, dy, me) + countRun(board, x, y, -dx, -dy, me);
    const theirs = countRun(board, x, y, dx, dy, foe) + countRun(board, x, y, -dx, -dy, foe);
    // 5완성 > 상대 5저지 > 4 > 상대 4 저지 > 3 …
    if (mine >= 4) score += 100000;
    else if (theirs >= 4) score += 50000;
    else if (mine === 3) score += 5000;
    else if (theirs === 3) score += 2500;
    else if (mine === 2) score += 400;
    else if (theirs === 2) score += 200;
    else score += mine * 30 + theirs * 15;
  }
  // 중앙 선호
  const cx = Math.abs(x - (OMOK_N - 1) / 2), cy = Math.abs(y - (OMOK_N - 1) / 2);
  score += (OMOK_N - cx - cy);
  return score;
}

/** AI 착수 좌표 (백). 놓을 곳이 없으면 null */
export function aiMove(s: OmokState, rnd: () => number = Math.random): { x: number; y: number } | null {
  let best: Array<{ x: number; y: number }> = [];
  let bestScore = -1;
  for (let y = 0; y < OMOK_N; y++) {
    for (let x = 0; x < OMOK_N; x++) {
      if (s.board[y * OMOK_N + x] !== 0) continue;
      const sc = scoreCell(s.board, x, y, 2, 1);
      if (sc > bestScore) { bestScore = sc; best = [{ x, y }]; }
      else if (sc === bestScore) best.push({ x, y });
    }
  }
  if (best.length === 0) return null;
  return best[Math.floor(rnd() * best.length)]!;
}
