import type { PetPersonalityId } from './petProfiles';

const KEY = 'hv-pet-signals-v1';

export type PetSignalResponseId = 'stay' | 'play' | 'wait';

export interface PetSignalResponseDef {
  id: PetSignalResponseId;
  mark: string;
  name: string;
  note: string;
}

export interface PetSignalDef {
  id: string;
  personality: PetPersonalityId;
  chapter: 1 | 2 | 3 | 4;
  mark: string;
  code: string;
  name: string;
  signal: string;
  translation: string;
  keepsake: string;
}

export interface PetSignalContext {
  affinity: number;
  plays: number;
  tricks: number;
  outings: number;
  homeMemories: number;
}

export interface PetSignalView extends PetSignalDef {
  unlocked: boolean;
  unlockHint: string;
  response: PetSignalResponseId | null;
  featured: boolean;
}

export interface PetSignalProgress {
  recorded: number;
  total: number;
  personalities: number;
  completedChapters: number;
  petPartners: number;
  responseStyles: number;
  featured: number;
}

interface PetSignalState {
  version: 1;
  responses: Record<string, PetSignalResponseId>;
  featured: string | null;
}

export const PET_SIGNAL_RESPONSES: readonly PetSignalResponseDef[] = [
  { id: 'stay', mark: '곁', name: '곁에 있기', note: '말보다 가까운 자리를 내어 줍니다.' },
  { id: 'play', mark: '놀', name: '함께 놀기', note: '그 마음을 둘만의 놀이로 이어 갑니다.' },
  { id: 'wait', mark: '쉼', name: '천천히 기다리기', note: '먼저 다가올 때까지 같은 속도로 기다립니다.' },
] as const;

const signals = (
  personality: PetPersonalityId,
  rows: ReadonlyArray<readonly [string, string, string, string, string]>,
): PetSignalDef[] => rows.map(([mark, name, signal, translation, keepsake], index) => ({
  id: `${personality}_${index + 1}`,
  personality,
  chapter: (index + 1) as 1 | 2 | 3 | 4,
  mark,
  code: `SIGN ${String(index + 1).padStart(2, '0')}`,
  name,
  signal,
  translation,
  keepsake,
}));

/** 여섯 성격 × 네 장면. 정답을 맞히는 도감이 아니라 함께 정한 번역을 남기는 수첩이다. */
export const PET_SIGNALS: readonly PetSignalDef[] = [
  ...signals('gentle', [
    ['옆', '반 걸음 옆자리', '사람이 멈추면 앞서지 않고 발끝 옆에 조용히 앉아요.', '“오늘 속도는 네가 정해도 좋아.”', '나란한 발자국 표식'],
    ['코', '코끝의 안부', '손등 가까이에 코를 대고 아주 작게 숨을 내쉬어요.', '“말하지 않은 기분도 확인하고 싶어.”', '따뜻한 숨결 쪽지'],
    ['문', '문턱의 기다림', '다른 방으로 가도 문턱을 넘지 않은 채 돌아보기를 기다려요.', '“혼자 있고 싶다면 여기까지만 갈게.”', '작은 문턱 리본'],
    ['빛', '잠들기 전 반짝임', '눈을 감기 직전 한 번 더 고개를 들어 같은 곳을 바라봐요.', '“오늘도 무사해서 다행이야.”', '저녁빛 유리 조각'],
  ]),
  ...signals('curious', [
    ['틈', '골목 틈새 조사', '새로운 틈을 만나면 앞발을 모으고 고개부터 기울여요.', '“저 안에는 아직 모르는 이야기가 있어.”', '골목 지도 귀퉁이'],
    ['소', '처음 듣는 소리', '낯선 소리가 나면 귀를 번갈아 움직이며 세 번 확인해요.', '“한 번 더 들으면 이름을 붙일 수 있겠어.”', '세 박자 소리표'],
    ['봉', '주머니 감정사', '돌아온 가방과 주머니 냄새를 하나씩 오래 기억해요.', '“밖에서 만난 하루를 나에게도 들려줘.”', '작은 냄새 봉투'],
    ['별', '질문이 된 별빛', '밤이면 가장 밝은 점보다 움직이는 그림자를 오래 바라봐요.', '“정답보다 계속 궁금한 게 더 좋아.”', '물음표 별 스티커'],
  ]),
  ...signals('brave', [
    ['앞', '한 발 먼저', '낯선 길 앞에서 몸을 작게 낮춘 뒤 꼭 한 발 먼저 내디뎌요.', '“무섭지 않은 게 아니라 같이 가고 싶은 거야.”', '첫걸음 단추'],
    ['척', '괜찮은 척 꼬리', '놀란 뒤에도 꼬리를 세우지만 끝부분만 아주 작게 떨려요.', '“조금 놀랐지만 네가 보면 다시 해낼 수 있어.”', '용기 매듭'],
    ['돌', '돌아보는 선두', '앞장서 달리다가도 세 걸음마다 멈춰 뒤를 확인해요.', '“가장 먼저 가도 혼자 도착하고 싶진 않아.”', '세 걸음 나침반'],
    ['집', '우리 집 순찰', '잠들기 전 익숙한 자리를 한 바퀴 돌고 마지막에 곁으로 와요.', '“오늘 지킬 곳은 모두 평안해.”', '밤 순찰 도장'],
  ]),
  ...signals('playful', [
    ['톡', '발끝 초대장', '지나가는 발끝을 앞발로 살짝 건드리고 모르는 척 돌아서요.', '“잡을 수 있으면 따라와 봐.”', '장난 초대 딱지'],
    ['숨', '너무 잘 보이는 숨바꼭질', '몸은 전부 보이는데 얼굴만 가린 채 한참 기다려요.', '“찾아 주는 순간까지가 놀이야.”', '반쪽 숨바꼭질 천'],
    ['보', '보물 아닌 보물', '별것 아닌 종이 조각을 숨겨 두고 대단한 발견처럼 꺼내요.', '“가치는 우리가 신나게 찾았다는 데 있어.”', '구겨진 보물 지도'],
    ['꿈', '잠꼬대 달리기', '깊이 잠든 채 발을 빠르게 움직이다 이름을 들으면 멈춰요.', '“꿈속 골목에서도 같이 뛰고 있었어.”', '꿈 경주 번호표'],
  ]),
  ...signals('calm', [
    ['볕', '햇볕 한 칸', '따뜻한 바닥 한 칸을 찾으면 세상을 다 가진 듯 길게 누워요.', '“좋은 순간은 서둘러 다음으로 갈 필요가 없어.”', '볕 조각 책갈피'],
    ['숨', '긴 숨의 시계', '주변이 바쁠수록 한 번 더 길게 숨을 쉬고 천천히 눈을 깜빡여요.', '“우리에게 필요한 시간은 이미 충분해.”', '느린 시계 태엽'],
    ['비', '비 소리 감상석', '비 오는 날 창 가까운 자리를 골라 같은 박자를 오래 들어요.', '“오늘의 산책은 귀로 다녀와도 좋아.”', '빗소리 음표'],
    ['끝', '하루의 마지막 자리', '모두 불을 끈 뒤 가장 익숙한 쿠션을 한 번 고쳐 밟고 앉아요.', '“돌아올 자리가 있다는 건 좋은 일이야.”', '쿠션 모서리 표식'],
  ]),
  ...signals('performer', [
    ['막', '혼자 여는 막', '아무도 보지 않을 때도 작은 단 위에 올라 자세부터 가다듬어요.', '“무대는 박수보다 먼저 내 안에서 시작돼.”', '미니 커튼 조각'],
    ['눈', '관객 한 명 찾기', '재주를 시작하기 전 가장 가까운 눈과 꼭 시선을 맞춰요.', '“한 명이 진심으로 봐 주면 충분해.”', '첫 관객 티켓'],
    ['실', '실수 뒤의 인사', '동작이 꼬여도 마지막 자세와 인사만큼은 더 크게 해요.', '“틀린 장면도 우리 공연의 일부야.”', '삐뚤어진 금별'],
    ['앙', '둘만의 앙코르', '모두 잠든 뒤 작은 동작을 한 번 더 보여 주고 곁에 기대요.', '“오늘 가장 보여 주고 싶었던 관객은 너였어.”', '비밀 앙코르 표'],
  ]),
] as const;

const responseIds = new Set<string>(PET_SIGNAL_RESPONSES.map((item) => item.id));
const signalById = new Map(PET_SIGNALS.map((item) => [item.id, item]));
const signalKey = (petId: string, signalId: string): string => `${petId}:${signalId}`;

function load(userId: string): PetSignalState {
  const base: PetSignalState = { version: 1, responses: {}, featured: null };
  try {
    const raw = JSON.parse(localStorage.getItem(`${KEY}:${userId}`) ?? '{}');
    const responses = raw.responses && typeof raw.responses === 'object'
      ? Object.fromEntries(Object.entries(raw.responses).filter(([key, value]) => {
        const separator = key.indexOf(':');
        return separator > 0 && signalById.has(key.slice(separator + 1)) && responseIds.has(String(value));
      })) as Record<string, PetSignalResponseId>
      : {};
    const featured = typeof raw.featured === 'string' && responses[raw.featured] ? raw.featured : null;
    return { version: 1, responses, featured };
  } catch { return base; }
}

function unlockFor(chapter: PetSignalDef['chapter'], context: PetSignalContext): { unlocked: boolean; hint: string } {
  if (chapter === 1) return { unlocked: true, hint: '가족이 된 첫날부터 관찰할 수 있어요.' };
  if (chapter === 2) return {
    unlocked: context.affinity >= 25 || context.plays >= 1,
    hint: `친밀도 25 또는 함께 놀기 1회 · 현재 ${context.affinity}/25`,
  };
  if (chapter === 3) return {
    unlocked: context.affinity >= 50 || context.tricks >= 2 || context.outings >= 1 || context.homeMemories >= 1,
    hint: `친밀도 50, 트릭 2개, 산책이나 집 추억 중 하나 · 현재 ${context.affinity}/50`,
  };
  return {
    unlocked: context.affinity >= 80 || context.outings >= 6 || context.homeMemories >= 3,
    hint: `친밀도 80, 산책 6회, 집 추억 3장 중 하나 · 현재 ${context.affinity}/80`,
  };
}

export class PetSignalStore {
  private state: PetSignalState;

  constructor(private readonly userId: string) { this.state = load(userId); }

  private save(): void {
    try { localStorage.setItem(`${KEY}:${this.userId}`, JSON.stringify(this.state)); } catch { /* 로컬 저장 실패는 플레이를 막지 않는다. */ }
  }

  views(petId: string, personality: PetPersonalityId, context: PetSignalContext): PetSignalView[] {
    return PET_SIGNALS.filter((item) => item.personality === personality).map((item) => {
      const key = signalKey(petId, item.id);
      const unlock = unlockFor(item.chapter, context);
      return { ...item, unlocked: unlock.unlocked, unlockHint: unlock.hint, response: this.state.responses[key] ?? null, featured: this.state.featured === key };
    });
  }

  record(petId: string, signalId: string, response: PetSignalResponseId, context: PetSignalContext): boolean {
    const signal = signalById.get(signalId);
    if (!petId || !signal || !responseIds.has(response) || !unlockFor(signal.chapter, context).unlocked) return false;
    const key = signalKey(petId, signalId);
    if (this.state.responses[key] === response) return false;
    this.state.responses[key] = response;
    this.save();
    return true;
  }

  feature(petId: string, signalId: string): boolean {
    const key = signalKey(petId, signalId);
    if (!this.state.responses[key]) return false;
    this.state.featured = this.state.featured === key ? null : key;
    this.save();
    return true;
  }

  progress(): PetSignalProgress {
    const entries = Object.entries(this.state.responses).flatMap(([key, response]) => {
      const separator = key.indexOf(':');
      const petId = key.slice(0, separator);
      const signal = signalById.get(key.slice(separator + 1));
      return signal ? [{ petId, signal, response }] : [];
    });
    const pairCounts = new Map<string, number>();
    for (const entry of entries) {
      const key = `${entry.petId}:${entry.signal.personality}`;
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    }
    return {
      recorded: entries.length,
      total: PET_SIGNALS.length,
      personalities: new Set(entries.map((entry) => entry.signal.personality)).size,
      completedChapters: [...pairCounts.values()].filter((count) => count >= 4).length,
      petPartners: new Set(entries.map((entry) => entry.petId)).size,
      responseStyles: new Set(entries.map((entry) => entry.response)).size,
      featured: this.state.featured ? 1 : 0,
    };
  }
}
