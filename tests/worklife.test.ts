import { describe, it, expect } from 'vitest';
import {
  workPhase, workStatus, computeWage, judgeDraft, pickDrafts, DRAFT_DOCS,
  HOURLY_WAGE, OVERTIME_MULT,
} from '../src/game/company/worklife';

describe('근무 시간대', () => {
  it('9시 출근·18시 정시·21시 야근 경계', () => {
    expect(workPhase(8)).toBe('before');
    expect(workPhase(9)).toBe('work');
    expect(workPhase(17)).toBe('work');
    expect(workPhase(18)).toBe('overtime');
    expect(workPhase(20)).toBe('overtime');
    expect(workPhase(21)).toBe('after');
    expect(workPhase(23)).toBe('after');
  });

  it('상태 안내: 출근 전엔 체크인 불가, 18시부터 퇴근 가능, 야근 플래그', () => {
    expect(workStatus(8).canClockIn).toBe(false);
    expect(workStatus(10).canClockIn).toBe(true);
    expect(workStatus(10).canClockOut).toBe(false);
    expect(workStatus(19).isOvertime).toBe(true);
    expect(workStatus(19).canClockOut).toBe(true);
    expect(workStatus(22).phase).toBe('after');
  });
});

describe('급여 계산', () => {
  it('정시 근무(9~18) = 9시간 × 기본시급', () => {
    expect(computeWage(9, 18)).toBe(HOURLY_WAGE * 9);
  });
  it('야근(18~21)은 1.5배 수당', () => {
    expect(computeWage(18, 21)).toBe(Math.round(HOURLY_WAGE * OVERTIME_MULT) * 3);
  });
  it('9~21 풀근무 = 정시9h + 야근3h', () => {
    expect(computeWage(9, 21)).toBe(HOURLY_WAGE * 9 + Math.round(HOURLY_WAGE * OVERTIME_MULT) * 3);
  });
  it('역전·동일 시각은 0', () => {
    expect(computeWage(18, 18)).toBe(0);
    expect(computeWage(20, 10)).toBe(0);
  });
});

describe('기안 결재 미니게임', () => {
  it('정답 처리만 통과한다', () => {
    for (const d of DRAFT_DOCS) {
      expect(judgeDraft(d, d.correct)).toBe(true);
      const wrong = (['승인', '반려', '보류'] as const).find((a) => a !== d.correct)!;
      expect(judgeDraft(d, wrong)).toBe(false);
    }
  });
  it('pickDrafts는 결정론적이고 중복 없이 N개', () => {
    const a = pickDrafts(7, 3), b = pickDrafts(7, 3);
    expect(a).toEqual(b);
    expect(new Set(a.map((d) => d.id)).size).toBe(3);
  });
  it('문서 풀에 승인·반려·보류가 모두 존재한다', () => {
    const kinds = new Set(DRAFT_DOCS.map((d) => d.correct));
    expect(kinds.has('승인')).toBe(true);
    expect(kinds.has('반려')).toBe(true);
    expect(kinds.has('보류')).toBe(true);
  });
});
