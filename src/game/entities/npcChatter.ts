/**
 * NPC 대사 — 세대별 말투 + MZ 신조어 + 실시간(시간대) 반영.
 * 홍대의 다양한 나이층을 담아 "살아있는 거리" 느낌을 낸다 (스펙 §2).
 * 순수 데이터 + 선택 함수라 테스트로 검증한다.
 */

export type Cohort = 'teen' | 'mz' | 'adult' | 'senior';
export type Slot = 'dawn' | 'morning' | 'day' | 'sunset' | 'night';

/** 시(0~23) → 시간대 슬롯 */
export function slotForHour(hour: number): Slot {
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

/** 세대별 상시 멘트 (아무 때나) */
export const COHORT_LINES: Record<Cohort, string[]> = {
  teen: [
    '이거 실화냐 ㅋㅋㅋ', '급식이라 용돈이 없어 ㅠ', '틱톡 챌린지 찍자!',
    '방금 그거 개웃곀ㅋㅋ', '나 이번 시험 망함 ㅇㅈ?', '탕후루 어디서 팔지',
    '우리 최애 컴백함!!', '수행평가 하기 싫다…', '이 노래 완전 띵곡',
  ],
  mz: [
    '오늘 아아 각인데', '이거 완전 갓생 아이템', 'TMI인데 나 여기 단골임',
    '분위기 미쳤다 진짜 ㄹㅇ', '킹받네… 참을 인 세 번', '갑분싸 될 뻔 ㅋㅋ',
    '이 골목 감성 어쩔티비', '점심 뭐 먹지 알고리즘 돌려', '주말이라 플렉스 좀 했지',
    '오운완! 오늘 운동 완료', '아 손민수 당했어 ㅋㅋ', '갬성샷 건지러 왔어',
    'NPC 같은 하루긴 한데 ㅋㅋ', '럭키비키잖앙~',
  ],
  adult: [
    '이 근처 주차가 문제야', '오랜만에 홍대 나오니 좋네', '애들 데리고 나왔어요',
    '커피 한 잔의 여유랄까', '요즘 물가가 참…', '전시 보고 가려고요',
    '주말엔 역시 나들이지', '단골 국밥집이 여기 있었는데',
  ],
  senior: [
    '옛날엔 여기 다 논밭이었지', '젊은 사람들 활기차서 좋아', '천천히들 다녀요',
    '이 길이 참 많이 변했어', '햇볕이 아주 좋구먼', '손주 선물 사러 나왔어',
    '건강이 최고여, 다들', '라디오에서 좋은 노래 나오더라',
  ],
};

/** 시간대별 멘트 (세대 무관, 실시간 반영) */
export const SLOT_LINES: Record<Slot, string[]> = {
  dawn: ['이 새벽 공기 좋다…', '밤샜다 결국 ㅋㅋ', '첫차 놓치면 안 되는데', '해 뜨기 전 홍대 조용하네'],
  morning: ['모닝커피가 답이다', '출근길 화이팅', '아침부터 사람 많네', '오늘 날씨 봐야지'],
  day: ['점심 뭐 먹지', '햇살 좋다 산책각', '카페 자리 있으려나', '오후 나른하다'],
  sunset: ['노을 미쳤다 갬성', '퇴근길 맥주 한 캔?', '이 시간 홍대가 제일 예뻐', '저녁 약속 있어서 나왔어'],
  night: ['밤이 진짜지 홍대는', '버스킹 소리 좋다', '2차 어디로 갈까', '야식 땡긴다 ㅠㅠ', '막차 시간 확인해야지'],
};

/**
 * 대사 선택 — 30% 확률로 시간대 멘트, 아니면 세대 멘트.
 * rnd는 [0,1) 난수, idx는 배열 인덱스 선택에 사용.
 */
export function pickLine(cohort: Cohort, slot: Slot, rnd: () => number): string {
  if (rnd() < 0.32) {
    const arr = SLOT_LINES[slot];
    return arr[Math.floor(rnd() * arr.length)]!;
  }
  const arr = COHORT_LINES[cohort];
  return arr[Math.floor(rnd() * arr.length)]!;
}

/** 외형 시드로 세대 배정 (군중이 세대별로 고루 섞이게) */
export function cohortForIndex(i: number): Cohort {
  const order: Cohort[] = ['mz', 'teen', 'mz', 'adult', 'mz', 'senior', 'teen', 'adult'];
  return order[i % order.length]!;
}
