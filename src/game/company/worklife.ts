/**
 * 회사 근무 시스템 (실제 회사 라이프 반영, ㅋㅋ) — 서울시간 기준.
 * 출근 9시 / 정시퇴근 18시 / 야근 21시까지. 기안 결재까지 올려야 진짜 퇴근.
 * 순수 로직 + 서울시각 함수. 급여·상태는 클라가 이 판정을 따른다.
 */
export type WorkPhase =
  | 'before'    // 출근 전 (9시 이전)
  | 'work'      // 정상 근무 (9~18)
  | 'overtime'  // 야근 (18~21)
  | 'after';    // 퇴근 시간 지남 (21시 이후)

export const WORK_START = 9;
export const WORK_END = 18;
export const OVERTIME_END = 21;

export function seoulHourNow(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false,
  }).format(now)) % 24;
}

export function workPhase(hour: number): WorkPhase {
  if (hour < WORK_START) return 'before';
  if (hour < WORK_END) return 'work';
  if (hour < OVERTIME_END) return 'overtime';
  return 'after';
}

export interface WorkStatus {
  phase: WorkPhase;
  headline: string;   // 상단 안내
  canClockIn: boolean;
  canClockOut: boolean;   // 정시 퇴근 가능(18시~)
  isOvertime: boolean;
}

/** 현재 시각 기준 근무 안내 (출근/퇴근/야근 카피는 재미있게) */
export function workStatus(hour: number): WorkStatus {
  const phase = workPhase(hour);
  switch (phase) {
    case 'before':
      return { phase, headline: `☕ 아직 업무 전이에요 (${WORK_START}시 출근)`, canClockIn: false, canClockOut: false, isOvertime: false };
    case 'work':
      return { phase, headline: '💼 근무 중 · 기안 처리하고 정시 퇴근 노려요!', canClockIn: true, canClockOut: false, isOvertime: false };
    case 'overtime':
      return { phase, headline: '🌙 야근 타임… 21시까지 화이팅 ㅠㅠ', canClockIn: true, canClockOut: true, isOvertime: true };
    default:
      return { phase, headline: '🏠 퇴근 시간 지났어요 — 집에 가요!', canClockIn: false, canClockOut: true, isOvertime: false };
  }
}

/**
 * 출근 급여 계산 — 근무 시작(clockIn) 후 clockOut까지의 근무 코인.
 * 정상근무 시급 base, 야근은 1.5배(실제 야근수당 감성). 서울시 기준 시간으로 계산.
 */
export const HOURLY_WAGE = 12;   // 코인/시간
export const OVERTIME_MULT = 1.5;

/** clockIn~clockOut 시각(정수 시)으로 급여 계산. 상한은 하루 1회 정산으로 서버가 관리 */
export function computeWage(inHour: number, outHour: number): number {
  if (outHour <= inHour) return 0;
  let wage = 0;
  for (let h = inHour; h < outHour; h++) {
    const rate = h >= WORK_END ? HOURLY_WAGE * OVERTIME_MULT : HOURLY_WAGE;
    wage += rate;
  }
  return Math.round(wage);
}

// ── 기안(결재) 미니게임 ──

export interface DraftDoc { id: string; title: string; correct: '승인' | '반려' | '보류'; hint: string }

/** 결재 문서 풀 — 내용에 맞는 처리를 골라야 통과 (가볍게 웃긴 사내 감성) */
export const DRAFT_DOCS: DraftDoc[] = [
  { id: 'd1', title: '탕비실 커피머신 교체 건', correct: '승인', hint: '복지 개선, 예산 내' },
  { id: 'd2', title: '전 직원 하와이 워크샵 (전액 회사부담)', correct: '반려', hint: '예산 초과 ㅋㅋ' },
  { id: 'd3', title: '금요일 재택근무 시범 도입', correct: '승인', hint: '생산성 향상 기대' },
  { id: 'd4', title: '사무실 강아지 10마리 입양', correct: '반려', hint: '알레르기·관리 이슈' },
  { id: 'd5', title: '신규 검사도구 외주 개발 (견적 검토중)', correct: '보류', hint: '견적 확정 후 재상신' },
  { id: 'd6', title: 'AX 데모데이 개최 예산', correct: '승인', hint: '핵심 성과 공유' },
  { id: 'd7', title: '점심시간 3시간으로 연장', correct: '반려', hint: '아무리 그래도… ㅋㅋ' },
  { id: 'd8', title: '개발팀 모니터 1대씩 추가 지급', correct: '승인', hint: '업무 효율, 예산 내' },
  { id: 'd9', title: '회사 옥상에 수영장 설치', correct: '반려', hint: '구조·안전 불가' },
  { id: 'd10', title: '외부 강사 초빙 세미나 (일정 미정)', correct: '보류', hint: '일정 확정 후 진행' },
];

export const DRAFT_ACTIONS: Array<'승인' | '반려' | '보류'> = ['승인', '반려', '보류'];

/** 기안 결재 정답 판정 */
export function judgeDraft(doc: DraftDoc, action: '승인' | '반려' | '보류'): boolean {
  return doc.correct === action;
}

/** 시드로 오늘의 결재 문서 N개 뽑기 (결정론적) */
export function pickDrafts(seed: number, n = 3): DraftDoc[] {
  const out: DraftDoc[] = [];
  const used = new Set<number>();
  let s = seed >>> 0;
  while (out.length < n && used.size < DRAFT_DOCS.length) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % DRAFT_DOCS.length;
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(DRAFT_DOCS[idx]!);
  }
  return out;
}
