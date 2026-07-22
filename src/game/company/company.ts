import type { Rect } from '../world/grid';
import type { Appearance } from '../art/appearance';

/**
 * 회사 건물 3동 (실제 우리 회사) — 마인드 포레스트(인싸이트)·마인드 월드(학지사)·
 * 마인드 브릿지(학지사 에듀). 각 층은 성격에 맞는 콘텐츠·사람·상호작용을 담는다.
 * 순수 데이터라 테스트로 요구사항을 못박는다.
 */
export type CompanyId = 'forest' | 'world' | 'bridge';

export interface CompanyMeeting { name: string; rect: Rect; door: { tx: number; ty: number } }
export interface CompanyNpc { tx: number; ty: number; name: string; role: string; appearance: Appearance; lines: string[] }
export interface CompanySpot { tx: number; ty: number; label: string; lines: string[] }

export interface CompanyFloor {
  level: number;             // 층 번호
  name: string;              // 부서/공간명
  w: number; h: number;      // 실내 타일
  solids: Rect[];            // 내부 구조물(테두리 제외)
  meetings: CompanyMeeting[]; // 회의실 (병렬 구획)
  npcs: CompanyNpc[];
  spots: CompanySpot[];
  up?: { tx: number; ty: number };   // 위층 계단 (5→6 전용)
  down?: { tx: number; ty: number };  // 아래층 계단 (6→5 전용)
  elevator?: { tx: number; ty: number }; // 엘리베이터 (1~5층만, 6층은 없음)
  clockDesk?: { tx: number; ty: number }; // 출퇴근 체크 (1층 로비)
  draftDesk?: { tx: number; ty: number };  // 결재함 (기안 미니게임, AX기획실)
}

export interface CompanyDef {
  id: CompanyId;
  name: string;              // 빌딩명
  org: string;               // 소속
  color: number;             // 파사드 톤
  floors: CompanyFloor[];
}

const emp = (skin: number, hair: number, hc: number, shirt: string): Appearance =>
  ({ skin, hair, hairColor: hc, shirt, pants: 2 });

// ── 마인드 포레스트 (인싸이트) — 6층, 6층에 AX기획실 ──

/** AX기획실 근무자 14명 (6층). 오피스존(y6~9)에 배치, 회의실 벽 회피 */
const AX_STAFF: CompanyNpc[] = [
  { tx: 1, ty: 6, name: '기획실장', role: 'AX 총괄', appearance: emp(1, 5, 1, '4a4e5c'),
    lines: ['오늘 스프린트 목표 확인했나요?', 'AX는 결국 사람을 향해요', '데모부터 만들어봅시다'] },
  { tx: 3, ty: 6, name: '프로덕트 리드', role: 'PM', appearance: emp(0, 1, 0, '8ab8a8'),
    lines: ['이 기능 임팩트가 클까요?', '유저 인터뷰 결과 공유할게요', '로드맵 다시 볼게요'] },
  { tx: 5, ty: 6, name: '디자인 리드', role: 'Design', appearance: emp(2, 3, 5, 'c8a8d8'),
    lines: ['이 플로우 마찰이 있어요', '컴포넌트 정리했어요', '픽셀 단위로 봅니다 👀'] },
  { tx: 7, ty: 6, name: 'AI 엔지니어', role: 'ML', appearance: emp(0, 0, 1, '6a7a8a'),
    lines: ['프롬프트 튜닝 중이에요', '평가셋부터 만들죠', '토큰이 좀 많이 드네요'] },
  { tx: 9, ty: 6, name: '백엔드 개발', role: 'Server', appearance: emp(3, 4, 2, '9cc79c'),
    lines: ['API 계약 먼저 정해요', 'RLS 다시 봐야 해요', '배포 파이프라인 손봤어요'] },
  { tx: 11, ty: 6, name: '프론트 개발', role: 'Client', appearance: emp(1, 2, 3, 'a8c8e0'),
    lines: ['반응형 확인했어요', '상태관리 정리 중', 'HMR 사랑해요'] },
  { tx: 1, ty: 8, name: '데이터 분석', role: 'Data', appearance: emp(2, 1, 4, 'd8b86e'),
    lines: ['리텐션 지표 뽑았어요', 'A/B 결과 유의해요', '대시보드 업데이트했어요'] },
  { tx: 3, ty: 8, name: 'QA 엔지니어', role: 'QA', appearance: emp(0, 5, 0, 'b0685a'),
    lines: ['엣지케이스 잡았어요', '재현 경로 정리했어요', '회귀 테스트 통과!'] },
  { tx: 5, ty: 8, name: '콘텐츠 기획', role: 'Content', appearance: emp(1, 3, 5, 'e0a8b8'),
    lines: ['카피 톤 맞춰봤어요', '심리 콘텐츠 검수 중', '사용자 언어로 씁시다'] },
  { tx: 7, ty: 8, name: '심리 전문위원', role: 'Psych', appearance: emp(2, 5, 1, 'f2ead8'),
    lines: ['타당도가 중요해요', '검사 규준 다시 볼게요', '해석은 신중하게'] },
  { tx: 9, ty: 8, name: '마케터', role: 'Growth', appearance: emp(0, 3, 3, 'd88a7c'),
    lines: ['이번 캠페인 반응 좋아요', '퍼널 최적화 중', '바이럴 포인트 찾았어요'] },
  { tx: 11, ty: 8, name: '사업개발', role: 'BizDev', appearance: emp(3, 1, 2, '6e5c4c'),
    lines: ['제휴 미팅 다녀왔어요', '파트너십 논의 중', 'B2B 문의 늘었어요'] },
  { tx: 5, ty: 9, name: 'HR 매니저', role: 'People', appearance: emp(1, 1, 4, '9cd8a0'),
    lines: ['커피챗 하실래요?', '온보딩 자료 정리했어요', '팀 분위기 최고예요 ☕'] },
  { tx: 9, ty: 9, name: '인턴', role: 'Intern', appearance: emp(0, 0, 0, 'e8c9a0'),
    lines: ['배울 게 많아요!', '오늘도 파이팅입니다', '커밋 처음 올렸어요 🎉'] },
];

const forest6: CompanyFloor = {
  level: 6, name: 'AX기획실',
  w: 15, h: 11,
  // 병렬 회의실 3개: 상단에 나란히 (입구부터 에너지·시너지·라운지), 사이 세로 칸막이만
  solids: [
    { x: 4, y: 1, w: 1, h: 4 },   // 에너지룸 / 시너지룸 칸막이
    { x: 9, y: 1, w: 1, h: 4 },   // 시너지룸 / 라운지룸 칸막이
  ],
  meetings: [
    { name: '에너지룸', rect: { x: 1, y: 1, w: 3, h: 4 }, door: { tx: 2, ty: 5 } },
    { name: '시너지룸', rect: { x: 5, y: 1, w: 4, h: 4 }, door: { tx: 6, ty: 5 } },
    { name: '라운지룸', rect: { x: 10, y: 1, w: 4, h: 4 }, door: { tx: 12, ty: 5 } },
  ],
  npcs: AX_STAFF,
  spots: [
    { tx: 2, ty: 2, label: '에너지룸', lines: ['🔋 킥오프 회의 중', '아이데이션 폭발!', '에너지 충전 완료'] },
    { tx: 7, ty: 2, label: '시너지룸', lines: ['🤝 협업 스프린트', '크로스팀 싱크', '함께라서 시너지'] },
    { tx: 12, ty: 2, label: '라운지룸', lines: ['🛋️ 편하게 브레인스토밍', '커피 한 잔의 여유', '캐주얼 미팅'] },
    { tx: 13, ty: 6, label: '탕비실', lines: ['☕ 커피 리필', '간식 충전소', '오늘의 원두는 케냐'] },
  ],
  down: { tx: 13, ty: 9 },       // 6층은 엘리베이터 없음 — 계단으로만 5층
  draftDesk: { tx: 11, ty: 7 },  // 결재함 (기안 미니게임) — 계단과 떨어뜨림
};

/**
 * 1~5층 로비/부서 — 엘리베이터(1~5층 이동). 5층만 6층행 계단(up)을 추가로 둔다.
 * (6층은 엘리베이터가 없어 5층에서 계단으로만 올라간다)
 */
function officeFloor(
  level: number, name: string, spotLabel: string, lines: string[],
  opts: { emojiA?: string } = {},
): CompanyFloor {
  const floor: CompanyFloor = {
    level, name, w: 12, h: 9,
    solids: [{ x: 2, y: 2, w: 3, h: 1 }, { x: 7, y: 2, w: 3, h: 1 }],
    meetings: [],
    npcs: [
      { tx: 3, ty: 4, name: `${name} 담당`, role: name, appearance: emp(level % 4, 1, 2, opts.emojiA ?? '8ab8a8'),
        lines: [`${name}입니다`, ...lines] },
      { tx: 8, ty: 4, name: `${name} 담당`, role: name, appearance: emp((level + 1) % 4, 3, 1, 'a8c8e0'),
        lines },
    ],
    spots: [{ tx: 6, ty: 3, label: spotLabel, lines }],
    elevator: { tx: 10, ty: 6 },   // 엘리베이터 (1~5층)
  };
  if (level === 1) floor.clockDesk = { tx: 2, ty: 6 };  // 로비 출퇴근 체크
  if (level === 5) floor.up = { tx: 1, ty: 6 };          // 5→6층 계단 (6층은 엘베 없음)
  return floor;
}

const MIND_FOREST: CompanyDef = {
  id: 'forest', name: '마인드 포레스트', org: '인싸이트', color: 0x4a7a5a,
  floors: [
    officeFloor(1, '로비·안내', '안내 데스크', ['어서오세요, 인싸이트입니다', '방문 목적을 알려주세요', '6층은 AX기획실이에요']),
    officeFloor(2, '심리검사 연구', '연구실', ['검사 개발 중이에요', '타당화 연구 진행 중', '규준 데이터 분석해요']),
    officeFloor(3, '검사 제작', '제작실', ['문항 다듬는 중', '채점 로직 검토', '온라인 검사 전환 작업']),
    officeFloor(4, '상담·교육', '교육실', ['워크숍 준비 중', '상담사 연수 진행', '해석 매뉴얼 작업']),
    officeFloor(5, '경영지원', '경영지원실', ['회계 마감 중', '채용 진행해요', '복지 개선 논의 중']),
    forest6,
  ],
};

// ── 마인드 월드 (학지사) — 출판사 ──

/** 학지사(출판) 층 — 엘리베이터 1~5층, 5층에 6층행 계단 */
function worldFloor(level: number, name: string, spotLabel: string, lines: string[], role: string): CompanyFloor {
  const floor: CompanyFloor = {
    level, name, w: 12, h: 9,
    solids: [{ x: 2, y: 2, w: 3, h: 1 }, { x: 7, y: 2, w: 3, h: 1 }],
    meetings: [],
    npcs: [
      { tx: 3, ty: 4, name: `${role}`, role, appearance: emp(level % 4, 5, 1, '6e5c4c'),
        lines: [`${name}입니다`, ...lines] },
      { tx: 8, ty: 4, name: `${role}`, role, appearance: emp((level + 2) % 4, 3, 5, 'c8a8d8'), lines },
    ],
    spots: [{ tx: 6, ty: 3, label: spotLabel, lines }],
    elevator: { tx: 10, ty: 6 },
  };
  if (level === 1) floor.clockDesk = { tx: 2, ty: 6 };
  if (level === 5) floor.up = { tx: 1, ty: 6 };
  return floor;
}

const world6: CompanyFloor = {
  level: 6, name: '임원실·출판기획', w: 13, h: 10,
  solids: [{ x: 4, y: 1, w: 1, h: 4 }, { x: 9, y: 1, w: 1, h: 4 }],
  meetings: [
    { name: '대표이사실', rect: { x: 1, y: 1, w: 3, h: 4 }, door: { tx: 2, ty: 5 } },
    { name: '기획회의실', rect: { x: 5, y: 1, w: 4, h: 4 }, door: { tx: 6, ty: 5 } },
  ],
  npcs: [
    { tx: 3, ty: 7, name: '대표', role: '경영', appearance: emp(1, 5, 1, '4a4e5c'),
      lines: ['좋은 책이 좋은 회사를 만들어요', '올해 신간 라인업 좋네요', '독자를 먼저 생각합시다'] },
    { tx: 6, ty: 7, name: '출판기획', role: '기획', appearance: emp(2, 1, 4, '9cd8a0'),
      lines: ['시리즈 기획 중이에요', '베스트셀러 감이 와요', '저자 미팅 다녀왔어요'] },
    { tx: 9, ty: 7, name: '편집주간', role: '편집총괄', appearance: emp(0, 3, 2, 'd8b86e'),
      lines: ['교정 일정 조율 중', '표지 최종 컨펌', '학술 검수 철저히'] },
  ],
  spots: [
    { tx: 2, ty: 2, label: '대표이사실', lines: ['👔 경영 회의 중', '큰 그림을 봅니다', '올해 목표 점검'] },
    { tx: 7, ty: 2, label: '기획회의실', lines: ['📋 신간 기획 회의', '라인업 확정', '독자 트렌드 분석'] },
  ],
  down: { tx: 11, ty: 8 }, // 6층 엘베 없음 — 계단으로 5층
};

const MIND_WORLD: CompanyDef = {
  id: 'world', name: '마인드 월드', org: '학지사', color: 0x5a6ab0,
  floors: [
    worldFloor(1, '로비·영업', '안내 데스크', ['어서오세요, 학지사입니다', '신간 문의 도와드려요', '6층은 임원실이에요'], '영업'),
    worldFloor(2, '편집부', '편집부', ['원고 교정 중', '학술서는 정확성이 생명', '오탈자 잡아요'], '편집장'),
    worldFloor(3, '북디자인·제작', '디자인실', ['조판 다시 볼게요', '서체가 중요하죠', '판형 정했어요'], '디자이너'),
    worldFloor(4, '마케팅', '마케팅실', ['신간 홍보 중', 'SNS 반응 좋아요', '북토크 준비해요'], '마케터'),
    worldFloor(5, '물류·관리', '관리실', ['서점 배본 확인', '재고 정리 중', '정산 마감이에요'], '관리'),
    world6,
  ],
};

// ── 마인드 브릿지 (학지사 에듀) — 교육 ──

const MIND_BRIDGE: CompanyDef = {
  id: 'bridge', name: '마인드 브릿지', org: '학지사 에듀', color: 0xb08a4a,
  floors: [{
    level: 1, name: '학지사 에듀', w: 13, h: 9,
    solids: [{ x: 4, y: 1, w: 1, h: 5 }, { x: 8, y: 1, w: 1, h: 5 }],
    meetings: [
      { name: '강의실 A', rect: { x: 1, y: 1, w: 3, h: 5 }, door: { tx: 2, ty: 6 } },
      { name: '강의실 B', rect: { x: 5, y: 1, w: 3, h: 5 }, door: { tx: 6, ty: 6 } },
    ],
    npcs: [
      { tx: 10, ty: 3, name: '교육기획', role: '기획', appearance: emp(1, 1, 4, '9cd8a0'),
        lines: ['커리큘럼 짜는 중', '이러닝 콘텐츠 제작', '연수 프로그램 개편'] },
      { tx: 10, ty: 6, name: '강사', role: '강의', appearance: emp(2, 5, 1, '8ab8a8'),
        lines: ['오늘 수업 준비 완료', '수강생 피드백 좋아요', '실습 중심으로 가요'] },
    ],
    spots: [
      { tx: 2, ty: 2, label: '강의실 A', lines: ['🎓 심리검사 연수', '자격 과정 진행', '실무 워크숍'] },
      { tx: 6, ty: 2, label: '강의실 B', lines: ['🎓 이러닝 스튜디오', '온라인 강의 녹화', '콘텐츠 제작 중'] },
      { tx: 11, ty: 7, label: '수강 안내', lines: ['📋 과정 등록 안내', '연수 일정 확인', '수료증 발급'] },
    ],
  }],
};

export const COMPANIES: Record<CompanyId, CompanyDef> = {
  forest: MIND_FOREST, world: MIND_WORLD, bridge: MIND_BRIDGE,
};

/** 층 도면 → 배치 불가 판정 (테두리·구조물·회의실 벽, 계단·문 제외) */
export function isCompanyFloorWalkable(floor: CompanyFloor, tx: number, ty: number): boolean {
  if (tx < 1 || ty < 1 || tx >= floor.w - 1 || ty >= floor.h - 1) return false;
  for (const s of floor.solids) {
    if (tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h) {
      // 회의실 문은 통로
      const isDoor = floor.meetings.some((m) => m.door.tx === tx && m.door.ty === ty);
      if (!isDoor) return false;
    }
  }
  return true;
}
