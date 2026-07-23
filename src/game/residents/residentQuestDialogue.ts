import type { WorldQuestSignal } from '../guidance/worldQuestSignals';
import type { ResidentDef } from './residents';
import { residentStoryArc } from './residentStories';

export interface ResidentQuestConversation {
  residentId: string;
  residentName: string;
  residentRole: string;
  questId: string;
  stageLabel: string;
  stageCode: string;
  title: string;
  quote: string;
  request: string;
  progressLabel: string;
  location: string;
  rewardLabel: string | null;
  reassurance: string;
  trackLabel: string;
}

interface ResidentQuestVoice {
  available: string;
  progress: string;
  tracked: string;
  reassurance: string;
}

/** 주민의 기존 관계 서사와 같은 말투로 월드 퀘스트 대사를 만든다. */
export const RESIDENT_QUEST_VOICES: Readonly<Record<string, ResidentQuestVoice>> = {
  haneul: {
    available: '아직 제목이 없는 곡처럼, 같이 시작하면 더 오래 남을 것 같아요.',
    progress: '첫 소절은 이미 울렸어요. 서두르지 말고 우리 박자로 이어 가요.',
    tracked: '당신이 듣고 있다는 걸 아니까 마지막 코드까지 연주할 수 있어요.',
    reassurance: '오늘 못 끝내도 앙코르는 사라지지 않아요.',
  },
  moturi: {
    available: '첫 잔은 제가 내릴게요. 다음 장면은 천천히 같이 골라 봐요.',
    progress: '이미 좋은 향이 나기 시작했어요. 너무 급하게 내릴 필요는 없어요.',
    tracked: '당신 자리는 비워 두었어요. 편한 시간에 이어 오세요.',
    reassurance: '마감도, 식어 버리는 기록도 없어요.',
  },
  sallim: {
    available: '생활은 정답보다 손에 맞는 자리를 찾는 일이야. 같이 한 번 재 볼까?',
    progress: '벌써 방의 표정이 보이네. 남은 건 네 생활에 맞추면 돼.',
    tracked: '줄자는 여기 있어. 네가 고른 속도로 하나씩 맞춰 보자.',
    reassurance: '잘못 놓아도 다시 바꾸면 되고, 기록은 줄지 않아.',
  },
  jun: {
    available: '이 시간엔 거창한 계획보다 같이 해 줄 한 사람이 더 필요하거든요.',
    progress: '교대까지 꽤 왔네요. 남은 건 간식 하나 먹는 마음으로 가요.',
    tracked: '목표는 제가 기억해 둘게요. 너무 무리해서 야근하진 마세요.',
    reassurance: '오늘 넘겨도 폐기되는 이야기는 없어요.',
  },
  choco: {
    available: '처음 보는 맛 같아서 궁금해요. 실패해도 같이 웃으면 되잖아요!',
    progress: '벌써 색이 예쁘게 섞였어요. 다음 한 칸도 우리 기분대로 골라요.',
    tracked: '지금 이 이야기가 오늘의 최애예요. 같이 끝까지 구경해요.',
    reassurance: '다른 걸 먼저 골라도 이 맛은 없어지지 않아요.',
  },
  ille: {
    available: '조용할 때만 들리는 이야기가 있어요. 잠깐 같이 걸어 볼래요?',
    progress: '밤을 절반쯤 건넜네요. 작은 소리를 따라가면 다음이 보여요.',
    tracked: '첫차 전까지 제가 길을 기억해 둘게요.',
    reassurance: '늦어도 괜찮아요. 이 새벽은 기다려 줍니다.',
  },
  park: {
    available: '처음 가는 길도 안심되는 표식 하나면 충분합니다. 제가 설명해 드리죠.',
    progress: '방향은 맞습니다. 지금까지 온 길도 모두 기록되어 있어요.',
    tracked: '환승 지점마다 제가 확인하겠습니다. 천천히 따라오세요.',
    reassurance: '길을 바꾸어도 잃어버리는 진행은 없습니다.',
  },
  noeul: {
    available: '비어 있는 칸이 하나 있어요. 오늘 색을 같이 남겨 줄래요?',
    progress: '밑그림은 벌써 멋져요. 완성보다 지금의 흔적을 즐겨요.',
    tracked: '당신이 고른 색을 중심으로 다음 장면을 이어 둘게요.',
    reassurance: '덧칠해도 이전 색은 이야기 속에 남아요.',
  },
  imo: {
    available: '일단 따뜻한 국물부터 한 모금 해. 그다음은 같이 하면 금방이야.',
    progress: '여기까지 왔으면 벌써 반은 식구지. 남은 것도 천천히 해.',
    tracked: '내가 자리 맡아 둘 테니 다른 일 보고 와도 돼.',
    reassurance: '외상처럼 사라지는 이야기는 없어. 마음 편히 해.',
  },
  dongsu: {
    available: '빨리 끝내는 길보다 계절이 보이는 길로 같이 걸어 봅시다.',
    progress: '지금까지 본 풍경도 충분히 귀해요. 남은 길은 더 천천히 갑시다.',
    tracked: '내가 앞서 재촉하지 않을 테니, 보이는 것부터 기억해요.',
    reassurance: '쉬었다 이어도 길과 기록은 그대로 남아 있어요.',
  },
};

const STAGE = {
  available: { label: '새로 건네는 이야기', code: 'NEW NEIGHBOR STORY' },
  progress: { label: '이어지고 있는 이야기', code: 'STORY IN PROGRESS' },
  tracked: { label: '함께 따라가는 이야기', code: 'TRACKED TOGETHER' },
} as const;

export function residentQuestConversation(
  resident: ResidentDef,
  signal: WorldQuestSignal,
): ResidentQuestConversation {
  const stage = signal.tone === 'tracked' ? 'tracked' : signal.progress > 0 ? 'progress' : 'available';
  const voice = RESIDENT_QUEST_VOICES[resident.id] ?? {
    available: '같이 시작해 볼까요?',
    progress: '이미 잘 이어 가고 있어요.',
    tracked: '제가 다음 길을 기억해 둘게요.',
    reassurance: '언제 이어도 기록은 사라지지 않아요.',
  };
  const arc = residentStoryArc(resident.id);
  return {
    residentId: resident.id,
    residentName: resident.name,
    residentRole: resident.role,
    questId: signal.questId,
    stageLabel: STAGE[stage].label,
    stageCode: STAGE[stage].code,
    title: signal.title,
    quote: voice[stage],
    request: signal.description,
    progressLabel: signal.progress > 0
      ? `${signal.progress.toLocaleString()} / ${signal.goal.toLocaleString()} 기록됨`
      : '아직 첫 장면 전 · 이미 한 행동은 자동 반영',
    location: signal.location,
    rewardLabel: signal.rewardLabel,
    reassurance: `${voice.reassurance} ${arc?.motto ?? ''}`.trim(),
    trackLabel: signal.tone === 'tracked' ? '계속 따라가기' : '이 이야기 따라가기',
  };
}
