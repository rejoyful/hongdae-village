/**
 * 아이디·코드 로그인 규칙 (순수 헬퍼).
 * Supabase 이메일/비밀번호 인증 위에 아이디를 얹는다: <아이디>@player.hongdae.app
 */
export const ID_RE = /^[a-z0-9_]{3,16}$/;
export const CODE_MIN = 6;

export function validateId(id: string): string | null {
  const v = id.trim().toLowerCase();
  if (!ID_RE.test(v)) return '아이디는 영문 소문자·숫자·_ 3~16자예요';
  return null;
}

export function validateCode(code: string): string | null {
  if (code.length < CODE_MIN) return `코드는 ${CODE_MIN}자 이상이어야 해요`;
  return null;
}

export function idToEmail(id: string): string {
  return `${id.trim().toLowerCase()}@player.hongdae.app`;
}
