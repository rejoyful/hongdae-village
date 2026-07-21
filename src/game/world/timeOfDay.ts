/**
 * 실제 서울 시간 기준 시간대 연출 (스펙 §2 "살아있는 거리").
 * 거리 전체에 틴트 오버레이를 깔아 새벽/아침/낮/노을/밤을 표현한다.
 */
export interface DayPhase {
  name: '새벽' | '아침' | '낮' | '노을' | '밤';
  color: number; // 오버레이 색
  alpha: number; // 오버레이 불투명도 (0이면 없음)
}

export function phaseForHour(hour: number): DayPhase {
  if (hour >= 4 && hour < 7) return { name: '새벽', color: 0x4a5878, alpha: 0.22 };
  if (hour >= 7 && hour < 10) return { name: '아침', color: 0xffdfb0, alpha: 0.06 };
  if (hour >= 10 && hour < 17) return { name: '낮', color: 0x000000, alpha: 0 };
  if (hour >= 17 && hour < 20) return { name: '노을', color: 0xe8814f, alpha: 0.16 };
  return { name: '밤', color: 0x1b2440, alpha: 0.34 };
}

/** 현재 서울(Asia/Seoul) 시각의 시(0~23) */
export function seoulHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', hour: 'numeric', hour12: false,
  }).format(now)) % 24;
}
