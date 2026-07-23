import { describe, it, expect } from 'vitest';
import {
  sanitizeChat, isEmoteKind, isNeighborCheerKind, isPetMeetKind, sanitizeNetworkUserId,
  EMOTE_KINDS, NEIGHBOR_CHEER_KINDS, PET_MEET_KINDS, CHAT_MAX, EV, POS_HZ, INTERP_DELAY_MS,
} from '../src/net/protocol';

describe('sanitizeChat', () => {
  it('앞뒤 공백을 제거한다', () => {
    expect(sanitizeChat('  안녕하세요  ')).toBe('안녕하세요');
  });

  it('80자를 초과하면 절단한다', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeChat(long)).toHaveLength(CHAT_MAX);
  });

  it('공백만 있으면 null을 반환한다', () => {
    expect(sanitizeChat('   ')).toBeNull();
    expect(sanitizeChat('')).toBeNull();
  });

  it('정상 메시지는 그대로 통과한다', () => {
    expect(sanitizeChat('홍대에서 만나요!')).toBe('홍대에서 만나요!');
  });
});

describe('프로토콜 상수', () => {
  it('이벤트 키·전송 주기·보간 지연이 스펙과 일치한다', () => {
    expect(EV).toEqual({ pos: 'p', chat: 'c', emote: 'e', neighborCheer: 'n', petMeet: 'm' });
    expect(POS_HZ).toBe(10);
    expect(INTERP_DELAY_MS).toBe(120);
  });

  it('화이트리스트의 8개 이모트만 수신한다', () => {
    expect(EMOTE_KINDS).toHaveLength(8);
    expect(isEmoteKind('wave')).toBe(true);
    expect(isEmoteKind('admin')).toBe(false);
    expect(isEmoteKind(null)).toBe(false);
  });

  it('응원 우편은 여덟 프리셋과 안전한 대상 ID만 통과시킨다', () => {
    expect(NEIGHBOR_CHEER_KINDS).toHaveLength(8);
    expect(isNeighborCheerKind('companion')).toBe(true);
    expect(isNeighborCheerKind('free-text')).toBe(false);
    expect(sanitizeNetworkUserId('neighbor_01-a')).toBe('neighbor_01-a');
    expect(sanitizeNetworkUserId('bad id')).toBeNull();
    expect(sanitizeNetworkUserId('<script>')).toBeNull();
  });

  it('동행 인사 엽서는 자유문구 없는 여섯 장면만 통과시킨다', () => {
    expect(PET_MEET_KINDS).toHaveLength(6);
    expect(isPetMeetKind('rain_shelter')).toBe(true);
    expect(isPetMeetKind('free-text')).toBe(false);
    expect(isPetMeetKind(null)).toBe(false);
  });
});
