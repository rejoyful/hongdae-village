import { describe, it, expect } from 'vitest';
import { sanitizeChat, CHAT_MAX, EV, POS_HZ, INTERP_DELAY_MS } from '../src/net/protocol';

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
    expect(EV).toEqual({ pos: 'p', chat: 'c', emote: 'e' });
    expect(POS_HZ).toBe(10);
    expect(INTERP_DELAY_MS).toBe(120);
  });
});
