import type { SupabaseClient } from '@supabase/supabase-js';
import type { PeerState } from '../net/NetworkAdapter';
import { normalizeAppearance, randomAppearance, type Appearance } from '../game/art/appearance';
import { validateId, validateCode, idToEmail } from '../game/auth';

/**
 * 로그인 플로우:
 * - 세션 있으면 프로필 로드 (자동 이어하기)
 * - 없으면 로그인 페이지: [간편 입장(닉네임만·익명)] / [아이디 로그인·가입]
 */
export async function ensureProfile(sb: SupabaseClient): Promise<PeerState> {
  const existing = await loadProfileIfSession(sb);
  if (existing) return existing;

  const choice = await showLoginPanel(sb);

  if (choice.mode === 'guest') {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error || !data.user) throw new Error(`익명 로그인 실패: ${error?.message ?? 'unknown'}`);
    return createProfile(sb, data.user.id, choice.nickname);
  }

  // 아이디 로그인/가입 성공 → 세션 존재
  const after = await loadProfileIfSession(sb);
  if (after) return after;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('로그인 세션 생성 실패');
  return createProfile(sb, session.user.id, choice.nickname);
}

async function loadProfileIfSession(sb: SupabaseClient): Promise<PeerState | null> {
  const { data: { session } } = await sb.auth.getSession();
  const uid = session?.user.id;
  if (!uid) return null;
  const { data, error } = await sb.from('profiles').select('nickname,color,appearance').eq('id', uid).maybeSingle();
  // 일시 오류를 "신규 유저"로 오판해 기존 프로필을 덮어쓰면 안 된다 → 오프라인 폴백으로 던진다
  if (error) throw new Error(`프로필 로드 실패(일시 오류일 수 있음): ${error.message}`);
  if (!data) return null; // 세션만 있고 프로필 미생성 (가입 직후)
  const appearance = normalizeAppearance(data.appearance, data.color as string);
  return { userId: uid, nickname: data.nickname as string, color: appearance.shirt, appearance };
}

async function createProfile(sb: SupabaseClient, uid: string, nickname: string): Promise<PeerState> {
  const appearance = randomAppearance();
  const { error } = await sb.from('profiles')
    .upsert({ id: uid, nickname, color: appearance.shirt, appearance });
  if (error) throw new Error(`프로필 저장 실패: ${error.message}`);
  return { userId: uid, nickname, color: appearance.shirt, appearance };
}

/** 커스터마이징 저장 (color는 레거시 동기화) */
export async function saveAppearance(sb: SupabaseClient, uid: string, a: Appearance): Promise<void> {
  await sb.from('profiles').update({ appearance: a, color: a.shirt }).eq('id', uid);
}

/** 계정 지키기 — 익명 계정에 아이디·코드를 부여해 영구 계정으로 전환 */
export async function linkIdCode(sb: SupabaseClient, id: string, code: string): Promise<string | null> {
  const idErr = validateId(id); if (idErr) return idErr;
  const codeErr = validateCode(code); if (codeErr) return codeErr;
  const { error } = await sb.auth.updateUser({ email: idToEmail(id), password: code });
  if (error) {
    if (error.message.includes('already') || error.code === 'email_exists') return '이미 사용 중인 아이디예요';
    return error.message;
  }
  return null;
}

type LoginChoice = { mode: 'guest'; nickname: string } | { mode: 'id'; nickname: string };

function showLoginPanel(sb: SupabaseClient): Promise<LoginChoice> {
  return new Promise((resolve) => {
    const panel = document.createElement('div');
    panel.className = 'hv-panel hv-title-screen';
    panel.innerHTML = `
      <div class="hv-title-wrap">
        <img class="hv-title-logo" src="assets/ui/title.png" alt="홍대마을" />
        <p class="hv-tagline">서울 홍대입구 · 함께 꾸미는 힐링 마을</p>
      </div>
      <div class="hv-card">
        <div class="hv-login-tabs">
          <button data-tab="guest" class="sel">간편 입장</button>
          <button data-tab="id">아이디 로그인</button>
        </div>
        <div class="hv-login-guest">
          <p>닉네임만 정하면 바로 입장! (이 브라우저에 저장돼요)</p>
          <input class="g-nick" type="text" maxlength="12" placeholder="닉네임 (1~12자)" />
          <button class="g-enter">입장하기</button>
        </div>
        <div class="hv-login-id" style="display:none">
          <p>어느 기기에서든 같은 캐릭터로 — 아이디와 코드로 입장</p>
          <input class="i-id" type="text" maxlength="16" placeholder="아이디 (영문·숫자 3~16자)" autocapitalize="none" />
          <input class="i-code" type="password" maxlength="32" placeholder="코드 (6자 이상)" />
          <div class="hv-login-row">
            <button class="i-login">로그인</button>
            <button class="i-signup">새로 만들기</button>
          </div>
        </div>
        <p class="hv-note" style="display:none"></p>
      </div>`;
    document.body.appendChild(panel);

    const q = <T extends HTMLElement>(sel: string) => panel.querySelector<T>(sel)!;
    const note = q<HTMLParagraphElement>('.hv-note');
    const say = (msg: string) => { note.style.display = 'block'; note.textContent = msg; };

    // 탭 전환
    panel.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        panel.querySelectorAll('[data-tab]').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        q('.hv-login-guest').style.display = b.dataset.tab === 'guest' ? 'block' : 'none';
        q('.hv-login-id').style.display = b.dataset.tab === 'id' ? 'block' : 'none';
        note.style.display = 'none';
      });
    });

    // 간편 입장
    const guestEnter = () => {
      const nickname = q<HTMLInputElement>('.g-nick').value.trim();
      if (nickname.length < 1) { q<HTMLInputElement>('.g-nick').focus(); return; }
      panel.remove();
      resolve({ mode: 'guest', nickname });
    };
    q('.g-enter').addEventListener('click', guestEnter);
    q<HTMLInputElement>('.g-nick').addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') guestEnter();
    });

    // 아이디 로그인/가입
    const idVal = () => q<HTMLInputElement>('.i-id').value.trim().toLowerCase();
    const codeVal = () => q<HTMLInputElement>('.i-code').value;
    const checkInputs = (): boolean => {
      const e1 = validateId(idVal()); if (e1) { say(e1); return false; }
      const e2 = validateCode(codeVal()); if (e2) { say(e2); return false; }
      return true;
    };

    q('.i-login').addEventListener('click', () => {
      if (!checkInputs()) return;
      say('로그인 중…');
      void sb.auth.signInWithPassword({ email: idToEmail(idVal()), password: codeVal() }).then(({ data, error }) => {
        if (error || !data.session) {
          say('아이디 또는 코드가 맞지 않아요. 처음이라면 [새로 만들기]를 눌러주세요');
          return;
        }
        panel.remove();
        resolve({ mode: 'id', nickname: idVal() });
      });
    });

    q('.i-signup').addEventListener('click', () => {
      if (!checkInputs()) return;
      say('계정 만드는 중…');
      void sb.auth.signUp({ email: idToEmail(idVal()), password: codeVal() }).then(({ data, error }) => {
        if (error) {
          say(error.message.includes('already') ? '이미 있는 아이디예요 — [로그인]을 눌러주세요' : `가입 실패: ${error.message}`);
          return;
        }
        if (!data.session) {
          say('가입은 됐지만 로그인이 막혔어요 — Supabase에서 "Confirm email"을 꺼주세요');
          return;
        }
        panel.remove();
        resolve({ mode: 'id', nickname: idVal() });
      });
    });

    panel.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
    q<HTMLInputElement>('.g-nick').focus();
  });
}
