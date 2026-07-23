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

function showLoginPanel(sb: SupabaseClient | null, preview = false): Promise<LoginChoice> {
  return new Promise((resolve) => {
    const panel = document.createElement('div');
    panel.className = 'hv-panel hv-title-screen';
    panel.innerHTML = `<main class="hv-title-shell">
      <section class="hv-title-wrap">
        <span class="hv-title-kicker"><i></i> COZY PIXEL MMORPG</span>
        <img class="hv-title-logo" src="assets/ui/title.png" alt="홍대마을" decoding="async" />
        <p class="hv-tagline">서울 골목에서 시작하는, 오래 머물고 싶은 두 번째 생활</p>
        <div class="hv-title-features" aria-label="게임 특징">
          <span><i>집</i><b>12테마 집 꾸미기</b></span>
          <span><i>곁</i><b>펫과 함께하는 생활</b></span>
          <span><i>옷</i><b>자유로운 캐릭터 취향</b></span>
          <span><i>길</i><b>이웃과 잇는 마을 이야기</b></span>
        </div>
        <p class="hv-title-caption">전투를 서두르지 않아도 괜찮아요. 꾸미고, 모으고, 친해지며 나만의 속도로 성장하세요.</p>
      </section>
      <div class="hv-card">
        <header class="hv-login-head"><small>WELCOME HOME</small><h1>마을로 돌아가기</h1><p>저장된 생활은 사라지지 않아요.</p></header>
        <div class="hv-login-tabs" role="tablist" aria-label="입장 방식">
          <button type="button" id="hv-tab-guest" role="tab" aria-selected="true" aria-controls="hv-panel-guest" data-tab="guest" class="sel">간편 입장</button>
          <button type="button" id="hv-tab-id" role="tab" aria-selected="false" aria-controls="hv-panel-id" data-tab="id">아이디 로그인</button>
        </div>
        <div class="hv-login-guest" id="hv-panel-guest" role="tabpanel" aria-labelledby="hv-tab-guest">
          <p>닉네임 하나로 먼저 둘러보세요. 이 브라우저에 안전하게 이어집니다.</p>
          <label for="hv-guest-nick">마을에서 불릴 이름</label>
          <input id="hv-guest-nick" class="g-nick" type="text" maxlength="12" placeholder="닉네임 1~12자" autocomplete="nickname" />
          <button type="button" class="g-enter">새 생활 시작하기 <i>→</i></button>
        </div>
        <div class="hv-login-id" id="hv-panel-id" role="tabpanel" aria-labelledby="hv-tab-id" hidden style="display:none">
          <p>다른 기기에서도 같은 캐릭터와 수집 기록을 이어가세요.</p>
          <label for="hv-login-id">아이디</label><input id="hv-login-id" class="i-id" type="text" maxlength="16" placeholder="영문·숫자 3~16자" autocapitalize="none" autocomplete="username" />
          <label for="hv-login-code">나만의 코드</label><input id="hv-login-code" class="i-code" type="password" maxlength="32" placeholder="6자 이상" autocomplete="current-password" />
          <div class="hv-login-row">
            <button type="button" class="i-login">로그인</button>
            <button type="button" class="i-signup">새로 만들기</button>
          </div>
        </div>
        <p class="hv-note" role="status" aria-live="polite" style="display:none"></p>
        <footer class="hv-login-safe"><i>✓</i><span><b>친절한 저장</b><small>실패 페널티·접속 강요 없이 천천히 이어져요.</small></span></footer>
      </div>
    </main><p class="hv-title-version">HONGDAE VILLAGE · EARLY WORLD BUILD</p>`;
    document.body.appendChild(panel);

    const q = <T extends HTMLElement>(sel: string) => panel.querySelector<T>(sel)!;
    const note = q<HTMLParagraphElement>('.hv-note');
    const say = (msg: string) => { note.style.display = 'block'; note.textContent = msg; };

    // 탭 전환
    panel.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        panel.querySelectorAll('[data-tab]').forEach((x) => x.classList.remove('sel'));
        panel.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === b)));
        b.classList.add('sel');
        const guest = q('.hv-login-guest');
        const id = q('.hv-login-id');
        const guestSelected = b.dataset.tab === 'guest';
        guest.style.display = guestSelected ? 'block' : 'none';
        guest.hidden = !guestSelected;
        id.style.display = guestSelected ? 'none' : 'block';
        id.hidden = guestSelected;
        note.style.display = 'none';
        q<HTMLInputElement>(guestSelected ? '.g-nick' : '.i-id').focus();
      });
    });

    // 간편 입장
    const guestEnter = () => {
      const nickname = q<HTMLInputElement>('.g-nick').value.trim();
      if (nickname.length < 1) {
        say('마을에서 불릴 이름을 한 글자 이상 적어 주세요.');
        q<HTMLInputElement>('.g-nick').focus();
        return;
      }
      if (preview) { say('미리보기 모드예요. 실제 서버 연결에서는 이 이름으로 바로 입장합니다.'); return; }
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

    const login = () => {
      if (!checkInputs()) return;
      if (!sb) { say('미리보기 모드예요. 실제 서버 연결에서는 저장된 마을을 불러옵니다.'); return; }
      say('로그인 중…');
      void sb.auth.signInWithPassword({ email: idToEmail(idVal()), password: codeVal() }).then(({ data, error }) => {
        if (error || !data.session) {
          say('아이디 또는 코드가 맞지 않아요. 처음이라면 [새로 만들기]를 눌러주세요');
          return;
        }
        panel.remove();
        resolve({ mode: 'id', nickname: idVal() });
      });
    };
    q('.i-login').addEventListener('click', login);

    q('.i-signup').addEventListener('click', () => {
      if (!checkInputs()) return;
      if (!sb) { say('미리보기 모드예요. 실제 서버 연결에서는 새 계정을 만듭니다.'); return; }
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

    panel.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && i.closest('.hv-login-id')) login();
    }));
    q<HTMLInputElement>('.g-nick').focus();
  });
}

/** 개발 시 실제 인증을 건드리지 않고 표지와 탭 상호작용을 검수한다. */
export function showLoginPreview(): void { void showLoginPanel(null, true); }
