import type { PosMsg, ChatMsg, EmoteMsg, NeighborCheerMsg, PetMeetMsg } from './protocol';
import type { Appearance } from '../game/art/appearance';
import type { PetAccessoryId } from '../game/pets/petProfiles';
import type { VillageProfilePublic } from '../game/progression/villageProfile';

export interface PeerState {
  userId: string;
  nickname: string;
  color: string; // 레거시(상의색) — appearance.shirt와 동기 유지
  appearance: Appearance;
  pet?: string | null; // 동행 펫 id (없으면 null) — 상대에게도 보이게
  petAccessory?: PetAccessoryId; // 동행 펫 장식 — presence 전용 코스메틱
  petName?: string | null;       // 정제된 펫 별명
  level?: number;      // 전투 레벨 — 이름표·간지 오라 동기
  weapon?: string;     // 장착 무기 id — 상대 캐릭터·정보창에 표시
  badge?: string | null; // 장착한 퀘스트 배지 이름 — presence 표시용
  profile?: VillageProfilePublic | null; // 선택한 공개 명함 정보 — 민감정보·자유 입력 없음
}

export type NetworkWorld = 'street' | 'iso-village';

/**
 * 네트워킹 추상화 — Supabase 구현체를 끼우고, 추후 전용 서버(Colyseus 등)로
 * 교체할 수 있는 유일한 지점 (스펙 §6).
 */
export interface NetworkAdapter {
  /** world를 생략하면 기존 직교 거리 채널을 유지한다. */
  connect(self: PeerState, world?: NetworkWorld): Promise<void>;
  disconnect(): Promise<void>;
  /** 씬 재진입 시 이전 씬이 등록한 콜백 제거 (중복 수신 방지) */
  clearListeners(): void;
  /** 외형 등 자기 상태 변경을 presence로 재전파 */
  updateSelf(self: PeerState): Promise<void>;
  /** 접속 중인 피어의 프로필(닉네임·외형) 변경 알림 */
  onPeerUpdate(cb: (peer: PeerState) => void): void;
  sendPos(msg: PosMsg): void; // fire-and-forget, POS_HZ 주기
  sendChat(msg: ChatMsg): void;
  sendEmote(msg: EmoteMsg): void;
  /** 대상 한 명에게만 표시되는 자유문구 없는 응원 우편. */
  sendNeighborCheer(msg: NeighborCheerMsg): void;
  /** 서로의 대표 동행을 한 장면에 남기는 하루 한 장 프리셋 엽서. */
  sendPetMeet(msg: PetMeetMsg): void;
  onPeerJoin(cb: (peer: PeerState) => void): void;
  onPeerLeave(cb: (userId: string) => void): void;
  onPos(cb: (userId: string, msg: PosMsg, atMs: number) => void): void;
  onChat(cb: (userId: string, msg: ChatMsg) => void): void;
  onEmote(cb: (userId: string, msg: EmoteMsg) => void): void;
  onNeighborCheer(cb: (userId: string, msg: NeighborCheerMsg) => void): void;
  onPetMeet(cb: (userId: string, msg: PetMeetMsg) => void): void;
}
