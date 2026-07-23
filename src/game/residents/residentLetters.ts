import { RESIDENTS, trustOf, type TrustState } from './residents';

export type ResidentLetterAct = 1 | 2 | 3;
export type ResidentReplyTone = 'warm' | 'playful' | 'thoughtful';

export interface ResidentReplyToneDef {
  id: ResidentReplyTone;
  mark: string;
  label: string;
  description: string;
  seal: string;
}

export const RESIDENT_REPLY_TONES: readonly ResidentReplyToneDef[] = [
  { id: 'warm', mark: '온', label: '다정하게', description: '고마움과 응원을 솔직하게 전해요.', seal: '살구빛 마음 봉인' },
  { id: 'playful', mark: '웃', label: '장난스럽게', description: '둘만 알아볼 농담과 약속을 보태요.', seal: '민트빛 웃음 봉인' },
  { id: 'thoughtful', mark: '결', label: '찬찬하게', description: '편지에 담긴 뜻을 오래 생각해 답해요.', seal: '남보라 생각 봉인' },
] as const;

export const RESIDENT_REPLY_TONE_BY_ID = new Map(RESIDENT_REPLY_TONES.map((tone) => [tone.id, tone]));

export interface ResidentLetterDef {
  id: string;
  residentId: string;
  act: ResidentLetterAct;
  trust: 15 | 50 | 100;
  subject: string;
  dateLine: string;
  body: string;
  postscript: string;
  keepsake: string;
  mark: string;
  palette: readonly [string, string, string, string];
  reactions: Readonly<Record<ResidentReplyTone, string>>;
}

interface ResidentLetterSeries {
  residentId: string;
  palette: readonly [string, string, string, string];
  reactions: Readonly<Record<ResidentReplyTone, string>>;
  letters: readonly [
    Omit<ResidentLetterDef, 'id' | 'residentId' | 'act' | 'trust' | 'palette' | 'reactions'>,
    Omit<ResidentLetterDef, 'id' | 'residentId' | 'act' | 'trust' | 'palette' | 'reactions'>,
    Omit<ResidentLetterDef, 'id' | 'residentId' | 'act' | 'trust' | 'palette' | 'reactions'>,
  ];
}

const letter = (
  subject: string, dateLine: string, body: string, postscript: string, keepsake: string, mark: string,
): ResidentLetterSeries['letters'][number] => ({ subject, dateLine, body, postscript, keepsake, mark });

/**
 * 선물 소비·기간 제한·호감도 정답 없이 매일의 인사만으로 열리는 주민 편지 30통.
 * 답장 말투는 서사를 잠그지 않으며 언제든 다시 고를 수 있다.
 */
const SERIES: readonly ResidentLetterSeries[] = [
  {
    residentId: 'haneul', palette: ['#211f38', '#5b4774', '#d97972', '#f6d28d'],
    reactions: {
      warm: '무대 아래 한 자리를 떠올리며 다음 곡을 끝까지 써 볼게요.',
      playful: '그 제목, 진짜 세트리스트에 적었어요. 나중에 모른 척하면 안 돼요!',
      thoughtful: '답장을 읽고 같은 코드를 조금 다르게 눌러 봤어요. 오래 남는 소리였어요.',
    },
    letters: [
      letter('첫 소절을 들어 준 사람에게', '리허설이 끝난 늦은 밤', '관객이 없던 시간에도 당신이 고개를 끄덕여 줘서 첫 음을 끝까지 이어 갈 수 있었어요. 좋은 노래는 큰 함성보다 한 사람의 표정에서 시작되기도 하나 봐요.', '다음에는 제목 없는 곡을 하나 들려줄게요.', '파란 피크가 든 작은 봉투', '음'),
      letter('골목이 만든 여덟 마디', '비가 그친 뒤의 골목', '컵이 탁자에 닿는 소리, 신호등 알림, 멀리서 웃는 목소리를 모아 여덟 마디를 만들었어요. 매일 지나던 길도 귀를 기울이면 전혀 다른 장소가 되네요.', '당신이 기억하는 골목 소리도 알려 줘요.', '손그림 카세트 라벨', '록'),
      letter('아직 이름 없는 앙코르', '옥상 불빛이 켜진 자정', '처음 이 골목에 왔을 때는 오래 노래할 수 있을지 몰랐어요. 이제는 무대가 비어 있어도 다시 올 얼굴들을 알아요. 그중 가장 먼저 떠오른 사람에게 이 편지를 보내요.', '곡 제목을 정할 자리는 여전히 비워 뒀어요.', '자정 앙코르 셋리스트', '별'),
    ],
  },
  {
    residentId: 'moturi', palette: ['#30261f', '#79553b', '#bd835d', '#f0d4a6'],
    reactions: {
      warm: '다음에 오면 가장 따뜻한 잔을 먼저 데워 둘게요.',
      playful: '그 메뉴 이름, 손님들이 주문하면 책임져야 해요. 공동 개발자니까요.',
      thoughtful: '천천히 적은 문장은 오래 우린 커피처럼 끝맛이 남네요.',
    },
    letters: [
      letter('오늘의 첫 잔', '가게 문을 열기 전', '누군가를 떠올리며 첫 커피를 내리는 날은 물줄기가 조금 더 차분해져요. 오늘은 자연스럽게 당신이 앉던 자리를 보며 원두를 갈았습니다.', '바쁜 날에는 다 마시지 않아도 괜찮아요.', '첫 추출 원두 카드', '콩'),
      letter('단골 메뉴는 아직 실험 중', '시음표가 가득 찬 오후', '완벽하지 않은 조합을 같이 맛봐 주는 사람이 있어 새 메뉴를 계속 만들 수 있어요. 실패라고 적었던 잔에도 우리가 웃은 이유를 덧붙였어요.', '다음 시음의 첫 모금은 당신 몫입니다.', '둘이 고친 시음표', '잔'),
      letter('문을 닫은 뒤의 카페', '마지막 의자를 넣은 밤', '영업이 끝나면 카페는 잠깐 아주 작은 집이 됩니다. 단골잔 두 개를 꺼내 놓고 말하지 못했던 하루를 천천히 내려놓을 수 있는 집이요.', '불이 꺼져 있어도 안쪽 자리는 비워 둘게요.', '두 번째 단골잔 받침', '온'),
    ],
  },
  {
    residentId: 'sallim', palette: ['#354139', '#718261', '#c29b69', '#f0dfb7'],
    reactions: {
      warm: '그 마음이면 어떤 방도 사람이 돌아오고 싶은 집이 되지.',
      playful: '그 배치는 줄자로는 안 나오지만 재미는 백 점이네. 한번 해 보자고.',
      thoughtful: '물건보다 생활을 먼저 본 답장이라 오래 간직하고 싶구나.',
    },
    letters: [
      letter('햇살을 재는 줄자', '창가가 가장 밝은 시간', '방의 크기는 숫자로 재지만 좋은 자리는 햇살이 머무는 시간으로 재야 해. 네가 고른 첫 자리를 보니 오래 살 집의 표정이 벌써 보이더구나.', '빈 곳도 생활을 위해 남겨 둔 가구란다.', '햇살 눈금 리본', '집'),
      letter('흠집을 숨기지 않는 법', '리폼 공방을 닫으며', '오래 쓴 의자의 긁힌 결을 전부 덮지 않았어. 누가 앉았고 몇 번 옮겼는지 남은 자국까지 그 물건의 얼굴이니까.', '새 색은 과거를 지우는 대신 잘 보이게 해야 해.', '원목 색 견본표', '결'),
      letter('사람이 들어올 틈', '긴 식탁 도면 옆에서', '좋은 집은 가구가 많은 집이 아니라 갑자기 찾아온 이웃이 앉을 틈이 있는 집이야. 네 방에는 이미 그런 자리가 생겼더구나.', '언젠가 골목 모두가 앉는 상을 같이 짜자.', '사랑방 배치 원도', '틈'),
    ],
  },
  {
    residentId: 'jun', palette: ['#202b43', '#486c8d', '#8ac2d3', '#f0d99b'],
    reactions: {
      warm: '퇴근 전 읽었더니 오늘 야간이 평소보다 짧게 느껴졌어요.',
      playful: '그 농담은 야간 근무자 전용 명언으로 계산대 밑에 붙여 둘게요.',
      thoughtful: '별것 아닌 하루를 진지하게 읽어 주는 사람이 있다는 게 꽤 든든하네요.',
    },
    letters: [
      letter('1+1의 남은 하나', '교대까지 스물세 분', '행사 상품이 하나 남으면 예전에는 그냥 재고라고 생각했어요. 요즘은 누구와 나누면 좋을지를 먼저 떠올립니다. 별것 아닌 변화인데 야간이 덜 조용해졌어요.', '삼각김밥은 역시 참치마요 쪽이 안전합니다.', '야간 행사 스티커', '밤'),
      letter('실패한 신상품 보고서', '새벽 두 시 십칠 분', '오늘 먹은 젤리는 설명과 전혀 다른 맛이었지만 포장지 문구만으로 한참 웃었어요. 성공한 간식보다 실패한 신상이 더 좋은 에피소드가 될 때도 있네요.', '다음 평가는 공동 책임입니다.', '심야 신상 평가표', '신'),
      letter('첫차까지 남은 십 분', '셔터를 반쯤 내린 아침', '가장 지친 시간에 누군가 오늘 어땠냐고 물어 주면 이상하게 남은 일이 쉬워져요. 당신이 이 골목에 있다는 사실이 제 야간 근무의 작은 안전등 같습니다.', '내일도 불은 켜 둘 테니 너무 걱정 말아요.', '첫차 시간 영수증', '빛'),
    ],
  },
  {
    residentId: 'choco', palette: ['#52314a', '#a65c77', '#ed9e91', '#ffe0a7'],
    reactions: {
      warm: '답장을 읽으니 오늘 기분은 따뜻한 복숭아 우유색이에요.',
      playful: '그 이름 너무 좋아요! 다음 가상 신상 봉지에 진짜 적을래요.',
      thoughtful: '색 하나를 이렇게 오래 바라봐 준 사람이 처음이라 조금 벅차요.',
    },
    letters: [
      letter('오늘 기분은 무슨 색?', '신상 진열을 마친 오후', '매일 기분에 색 이름을 붙이면 평범한 날도 작은 샘플이 돼요. 오늘 당신을 보고 떠오른 색은 햇빛이 조금 섞인 살구 탄산색이었어요.', '정답은 없으니 당신 이름도 지어 줘요.', '살구색 젤리 띠지', '색'),
      letter('세상에 없는 젤리 봉지', '색연필이 짧아진 밤', '당신 룩북의 색으로 가상 신상품 포장을 그렸어요. 먹는 것보다 봉지를 모으고 싶은 젤리라니 조금 이상하지만, 좋아하는 건 꼭 실용적일 필요 없잖아요.', '첫 봉지는 뜯지 말고 같이 보관해요.', '가상 신상 패키지', '젤'),
      letter('사라진 맛을 기억하는 법', '빈 진열대 앞에서', '좋아하던 맛이 단종됐지만 같이 찾아다닌 골목은 그대로 남았어요. 사라지는 걸 막을 수 없어도 좋아했다고 많이 말해 두면 추억의 맛은 흐려지지 않나 봐요.', '마지막 봉지보다 원정 지도를 더 아끼게 됐어요.', '단종 맛 원정 지도', '탐'),
    ],
  },
  {
    residentId: 'ille', palette: ['#19303c', '#38616b', '#6ca489', '#dce3a2'],
    reactions: {
      warm: '새벽에 읽으니 답장 글씨가 작은 조명처럼 보였어요.',
      playful: '그 맛 조합은 위험해 보이지만 다음 반값 날에 꼭 시험해 봐요.',
      thoughtful: '조용한 시간의 의미를 알아봐 줘서, 오늘 새벽은 덜 외롭겠네요.',
    },
    letters: [
      letter('조용하지 않은 새벽', '냉장고 모터가 세 번 멈춘 뒤', '사람들은 새벽이 조용하다고 하지만 사실 작은 소리가 가까워지는 시간이에요. 멀리 있는 발자국과 봉지 스치는 소리를 세다 보면 골목도 숨을 쉬는 것 같아요.', '다음에는 가장 작은 소리를 같이 찾아요.', '새벽 소리 체크표', '새'),
      letter('반값 아이스크림의 모험', '첫차 전의 벤치', '가장 이상한 맛을 골랐는데 예상보다 괜찮았어요. 결과를 몰라서 망설이는 일도 누군가와 반씩 나누면 작은 모험이 되네요.', '다음 선택권은 당신에게 양보할게요.', '아이스크림 막대 표식', '달'),
      letter('행운이 갈 곳', '일곱 번째 스티커를 붙인 밤', '행운을 반으로 나누면 줄어드는 줄 알았는데 오히려 갈 곳이 생겼어요. 당신에게 필요한 몫을 생각하는 동안 제 몫도 더 선명해졌습니다.', '별 하나는 편지 안쪽에 붙여 뒀어요.', '반쪽 별 스티커', '행'),
    ],
  },
  {
    residentId: 'park', palette: ['#21364b', '#426580', '#d09b52', '#eee0b6'],
    reactions: {
      warm: '이 답장은 길을 잃은 날 펼쳐 보는 작은 안내판으로 삼겠습니다.',
      playful: '그 이정표는 공식 노선도엔 못 넣어도 제 비밀 지도에는 표시해 두죠.',
      thoughtful: '천천히 읽으니 제가 왜 이 일을 시작했는지 다시 떠올랐습니다.',
    },
    letters: [
      letter('기억나는 길이 친절한 길', '9번 출구 첫 점검 뒤', '정확한 거리보다 빵 냄새와 노란 간판으로 설명한 길을 사람들이 더 잘 기억하더군요. 친절한 안내는 정답을 말하는 일이 아니라 안심할 단서를 주는 일인지도 모릅니다.', '당신만의 이정표도 듣고 싶습니다.', '9번 출구 방향표', '길'),
      letter('돌아갈 곳을 적는 표', '분실물 창고의 늦은 오후', '낡은 우산에도 누군가의 귀갓길이 붙어 있습니다. 이름 없는 물건에 돌아갈 장소를 적어 두는 일이 생각보다 많은 마음을 지켜 줍니다.', '잃어버린 기억도 발견하면 맡겨 주세요.', '분실물 꼬리표', '표'),
      letter('막차 뒤에도 남는 약속', '플랫폼의 불을 줄인 밤', '아무도 없는 시간에 손잡이와 안내판을 다시 확인합니다. 보이지 않는 곳에서 지킨 약속이 다음 날 누군가의 평범한 출발을 만든다고 믿기 때문입니다.', '당신의 다음 출발도 안전하길 바랍니다.', '막차 점검 펀치표', '약'),
    ],
  },
  {
    residentId: 'noeul', palette: ['#462c57', '#955f8e', '#e48770', '#fbd09b'],
    reactions: {
      warm: '당신의 문장을 읽고 벽 한쪽에 더 따뜻한 색을 섞었어요.',
      playful: '그 색 이름 마음에 들어요. 물감통에도 그대로 써 붙일래요.',
      thoughtful: '한참 바라본 사람만 쓸 수 있는 답장이라 그림 옆에 오래 두고 싶어요.',
    },
    letters: [
      letter('이름 없는 노을빛', '주황과 보라 사이의 몇 분', '혼자였다면 그냥 지나쳤을 색을 함께 멈춰 봐 줘서 고마워요. 이름을 모르는 색도 둘이 기억하면 사라지지 않는다는 걸 알았어요.', '다음 노을에는 작은 병을 가져올게요.', '노을빛 물감 점', '빛'),
      letter('골목을 색으로 읽는 지도', '세 색을 모은 오후', '간판과 소매 끝, 오래된 벽에서 오늘의 색을 하나씩 주웠어요. 익숙한 길도 색으로 다시 읽으니 처음 온 전시장처럼 보였어요.', '당신이 고른 세 색은 지도 가장자리에 남겼어요.', '세 색의 골목 팔레트', '화'),
      letter('벽화의 비어 있던 한 칸', '마지막 붓을 씻기 전', '완벽하게 채우려고 남겨 둔 자리에 우리 실루엣을 작게 그렸어요. 그림이 완성된 건 빈칸이 사라져서가 아니라 지금 골목의 사람이 들어왔기 때문이에요.', '한 마리 작은 그림자 자리도 남겨 뒀답니다.', '벽화 색 조각', '벽'),
    ],
  },
  {
    residentId: 'imo', palette: ['#4a2723', '#a64b36', '#dc8350', '#f4cf8c'],
    reactions: {
      warm: '그래, 이런 말 한 줄이면 국물 한 솥 끓인 보람이 있지.',
      playful: '말은 잘하네! 다음에 오면 그 농담값으로 설거지 한 번이야.',
      thoughtful: '천천히 쓴 답장을 메뉴판 뒤에 붙여 뒀어. 오래 볼 거야.',
    },
    letters: [
      letter('국물부터 마셔', '찬 바람이 골목을 돈 저녁', '낯선 얼굴도 손이 차가워 보이면 국물부터 줘야 해. 주문은 나중이고 이야기는 더 나중이야. 몸이 녹아야 오늘 하루를 제대로 내려놓을 수 있거든.', '네 자리는 포차 안쪽, 바람 덜 드는 데야.', '어묵 국물 종이컵 띠', '온'),
      letter('반 숟갈의 비밀', '양념을 저은 늦은 밤', '레시피에는 한 숟갈이라 적혀 있어도 사람 표정을 보면 반 숟갈만 넣어야 할 때가 있어. 맛도 마음도 똑같이 주는 게 공평한 건 아니더라.', '네 몫은 이제 말 안 해도 알아.', '양념 반 숟갈 표', '맛'),
      letter('메뉴판 뒤의 이름들', '십 년 된 메뉴판을 고치며', '돈이 모자랐던 날, 비를 피한 날, 말없이 설거지해 준 날의 이름을 메뉴판 뒤에 적어 뒀어. 자주 온다고 식구가 아니라 서로 기억해야 식구야.', '네 이름 옆에는 빈 줄을 넉넉히 남겼다.', '포차 식구 메모', '식'),
    ],
  },
  {
    residentId: 'dongsu', palette: ['#293e34', '#57735a', '#9ca56d', '#e2d5a5'],
    reactions: {
      warm: '따뜻한 답장을 주머니에 넣고 오늘은 한 바퀴 더 걸어야겠어요.',
      playful: '허허, 그 이름이면 나무도 웃겠군요. 다음에 같이 불러 봅시다.',
      thoughtful: '빠르지 않은 글이라 좋습니다. 산책처럼 쉬어 가며 읽었어요.',
    },
    letters: [
      letter('나무 하나의 이름', '느린 아침 산책 뒤', '매일 지나던 나무에도 이름을 붙이면 다음 날 먼저 안부를 묻게 됩니다. 길을 많이 아는 것보다 한 그루를 오래 기억하는 일이 더 좋은 산책일 때가 있지요.', '당신이 고른 이름표는 비에 젖지 않게 해 뒀어요.', '은행잎 이름표', '잎'),
      letter('사라진 철길이 이어지는 곳', '자갈 탁본을 뜬 오후', '숲길 아래에는 옛 기찻길의 작은 돌이 남아 있습니다. 사라진 길도 천천히 흔적을 읽으면 지금의 나무와 다시 이어집니다.', '발밑의 오래된 시간을 너무 서두르지 맙시다.', '기찻길 탁본 조각', '길'),
      letter('계절을 데리고 걷는 법', '세 발자국이 나란했던 날', '목적지까지 가는 대신 작은 발의 속도에 맞추니 잎의 앞뒤와 바람 냄새가 모두 보였습니다. 오늘은 우리가 길을 지난 게 아니라 계절을 데리고 돌아온 셈이지요.', '다음 계절에도 같은 속도로 만납시다.', '세 발자국 산책 표식', '봄'),
    ],
  },
] as const;

const TRUST_BY_ACT = [15, 50, 100] as const;

export const RESIDENT_LETTERS: readonly ResidentLetterDef[] = SERIES.flatMap((series) => (
  series.letters.map((item, index): ResidentLetterDef => ({
    ...item,
    id: `${series.residentId}_letter_${index + 1}`,
    residentId: series.residentId,
    act: (index + 1) as ResidentLetterAct,
    trust: TRUST_BY_ACT[index]!,
    palette: series.palette,
    reactions: series.reactions,
  }))
));

export const RESIDENT_LETTER_BY_ID = new Map(RESIDENT_LETTERS.map((item) => [item.id, item]));

export interface ResidentLetterState {
  version: 1;
  replies: Record<string, ResidentReplyTone>;
  featuredId: string | null;
}

export interface ResidentLetterView extends ResidentLetterDef {
  replied: boolean;
  tone: ResidentReplyTone | null;
  trustMet: boolean;
  previousMet: boolean;
  available: boolean;
  ready: boolean;
  featured: boolean;
  playerLine: string | null;
  residentReaction: string | null;
}

export interface ResidentLetterProgress {
  replied: number;
  total: number;
  ready: number;
  correspondents: number;
  completedResidents: number;
  tonesUsed: number;
  featured: number;
}

const isTone = (value: unknown): value is ResidentReplyTone => typeof value === 'string' && RESIDENT_REPLY_TONE_BY_ID.has(value as ResidentReplyTone);

export function normalizeResidentLetterState(raw: unknown): ResidentLetterState {
  const value = (raw ?? {}) as Partial<ResidentLetterState>;
  const replies: Record<string, ResidentReplyTone> = {};
  if (value.replies && typeof value.replies === 'object' && !Array.isArray(value.replies)) {
    for (const [id, tone] of Object.entries(value.replies)) {
      if (RESIDENT_LETTER_BY_ID.has(id) && isTone(tone)) replies[id] = tone;
    }
  }
  const featuredId = typeof value.featuredId === 'string' && replies[value.featuredId] ? value.featuredId : null;
  return { version: 1, replies, featuredId };
}

export function residentLetterPlayerLine(letter: ResidentLetterDef, tone: ResidentReplyTone): string {
  if (tone === 'warm') return `「${letter.subject}」을 함께 기억하고 싶다는 마음을 솔직하게 적었다.`;
  if (tone === 'playful') return `「${letter.subject}」에 어울리는 둘만의 농담과 다음 약속을 한 줄 보탰다.`;
  return `「${letter.subject}」에 담긴 뜻을 오래 생각한 뒤 천천히 답장을 마쳤다.`;
}

export function residentLetterViews(
  residentId: string, state: ResidentLetterState, trust: TrustState,
): ResidentLetterView[] {
  return RESIDENT_LETTERS.filter((item) => item.residentId === residentId).map((item) => {
    const tone = state.replies[item.id] ?? null;
    const replied = tone !== null;
    const previousMet = item.act === 1 || !!state.replies[`${item.residentId}_letter_${item.act - 1}`];
    const trustMet = trustOf(trust, residentId) >= item.trust;
    const available = previousMet && trustMet;
    return {
      ...item,
      replied,
      tone,
      previousMet,
      trustMet,
      available,
      ready: available && !replied,
      featured: state.featuredId === item.id,
      playerLine: tone ? residentLetterPlayerLine(item, tone) : null,
      residentReaction: tone ? item.reactions[tone] : null,
    };
  });
}

export function residentLetterProgress(
  state: ResidentLetterState, trust: TrustState,
): ResidentLetterProgress {
  const views = RESIDENTS.flatMap((resident) => residentLetterViews(resident.id, state, trust));
  const repliedByResident = new Map<string, number>();
  for (const item of views) if (item.replied) repliedByResident.set(item.residentId, (repliedByResident.get(item.residentId) ?? 0) + 1);
  return {
    replied: views.filter((item) => item.replied).length,
    total: views.length,
    ready: views.filter((item) => item.ready).length,
    correspondents: [...repliedByResident.values()].filter((count) => count > 0).length,
    completedResidents: [...repliedByResident.values()].filter((count) => count === 3).length,
    tonesUsed: new Set(Object.values(state.replies)).size,
    featured: state.featuredId ? 1 : 0,
  };
}

export type ReplyResidentLetterResult =
  | { ok: true; firstReply: boolean; changed: boolean; view: ResidentLetterView }
  | { ok: false; reason: 'unknown-letter' | 'unknown-tone' | 'not-available' };

export class ResidentLetterStore {
  private state: ResidentLetterState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-resident-letters-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* 세션 한정 */ }
    this.state = normalizeResidentLetterState(raw);
    this.persist();
  }

  get(): ResidentLetterState { return this.state; }
  views(residentId: string, trust: TrustState): ResidentLetterView[] { return residentLetterViews(residentId, this.state, trust); }
  progress(trust: TrustState): ResidentLetterProgress { return residentLetterProgress(this.state, trust); }

  reply(letterId: string, tone: ResidentReplyTone, trust: TrustState): ReplyResidentLetterResult {
    const letter = RESIDENT_LETTER_BY_ID.get(letterId);
    if (!letter) return { ok: false, reason: 'unknown-letter' };
    if (!RESIDENT_REPLY_TONE_BY_ID.has(tone)) return { ok: false, reason: 'unknown-tone' };
    const before = this.views(letter.residentId, trust).find((item) => item.id === letterId);
    if (!before?.available) return { ok: false, reason: 'not-available' };
    const previousTone = this.state.replies[letterId];
    this.state = { ...this.state, replies: { ...this.state.replies, [letterId]: tone } };
    this.persist();
    return {
      ok: true,
      firstReply: !previousTone,
      changed: previousTone !== tone,
      view: this.views(letter.residentId, trust).find((item) => item.id === letterId)!,
    };
  }

  feature(letterId: string | null): void {
    if (letterId !== null && !this.state.replies[letterId]) return;
    this.state = { ...this.state, featuredId: letterId };
    this.persist();
  }

  private persist(): void { try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ } }
}
