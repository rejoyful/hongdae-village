/**
 * 오늘의 퀘스트 (스펙 §3 일일 퀘스트). 진행은 클라이언트 추적(game.registry),
 * 보상 수령은 earn_activity RPC(하루 1회 원장 검증)로 서버가 보장.
 */
export interface QuestDef {
  id: string;          // earn_activity kind와 동일
  name: string;
  desc: string;
  goal: number;
  registryKey: string; // game.registry 진행 카운터 키
  reward: number;
}

export const DAILY_QUESTS: QuestDef[] = [
  {
    id: 'quest_cafe', name: '모퉁이의 하루',
    desc: '카페 알바를 1번 완료하기', goal: 1, registryKey: 'q_cafe', reward: 40,
  },
  {
    id: 'quest_busking', name: '거리의 뮤지션',
    desc: '버스킹을 1번 성공하기', goal: 1, registryKey: 'q_busking', reward: 40,
  },
  {
    id: 'quest_forest', name: '숲길 산책',
    desc: '경의선 숲길에서 30초 머물기', goal: 30, registryKey: 'q_forest', reward: 40,
  },
  {
    id: 'quest_emote', name: '동네 인사',
    desc: '이모트 3번 보내기', goal: 3, registryKey: 'q_emote', reward: 40,
  },
  {
    id: 'quest_decorate', name: '오늘의 인테리어',
    desc: '내 방에 가구 2개 배치하기', goal: 2, registryKey: 'q_place', reward: 40,
  },
];
