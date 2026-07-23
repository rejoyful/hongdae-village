import type { SupabaseClient } from '@supabase/supabase-js';
import type { PeerState } from '../net/NetworkAdapter';
import { normalizeAppearance, randomAppearance, type Appearance } from '../game/art/appearance';
import { validateId, validateCode, idToEmail } from '../game/auth';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!
));

export async function ensureProfile(sb: SupabaseClient): Promise<PeerState> {
  const existing = await loadProfileIfSession(sb);
  return showLoginPanel(sb, existing);
}

async function loadProfileIfSession(sb: SupabaseClient): Promise<PeerState | null> {
  const { data: { session } } = await sb.auth.getSession();
  const uid = session?.user.id;
  if (!uid) return null;
  const { data, error } = await sb.from('profiles').select('nickname,color,appearance').eq('id', uid).maybeSingle();
  if (error) throw new Error(`프로필 로드 실패: ${error.message}`);
  if (!data) return null;
  const appearance = normalizeAppearance(data.appearance, data.color as string);
  return { userId: uid, nickname: data.nickname as string, color: appearance.shirt, appearance };
}

async function createProfile(sb: SupabaseClient, uid: string, nickname: string): Promise<PeerState> {
  const appearance = randomAppearance();
  const { error } = await sb.from('profiles').upsert({ id: uid, nickname, color: appearance.shirt, appearance });
  if (error) throw new Error(`프로필 저장 실패: ${error.message}`);
  return { userId: uid, nickname, color: appearance.shirt, appearance };
}

export async function saveAppearance(sb: SupabaseClient, uid: string, appearance: Appearance): Promise<void> {
  await sb.from('profiles').update({ appearance, color: appearance.shirt }).eq('id', uid);
}

export async function linkIdCode(sb: SupabaseClient, id: string, code: string): Promise<string | null> {
  const idError = validateId(id);
  if (idError) return idError;
  const codeError = validateCode(code);
  if (codeError) return codeError;
  const { error } = await sb.auth.updateUser({ email: idToEmail(id), password: code });
  if (!error) return null;
  if (error.message.includes('already') || error.code === 'email_exists') return '이미 사용 중인 아이디예요';
  return error.message;
}

function showLoginPanel(
  sb: SupabaseClient | null,
  existing: PeerState | null,
  preview = false,
): Promise<PeerState> {
  return new Promise((resolve) => {
    const panel = document.createElement('div');
    panel.className = 'dw-login';
    panel.innerHTML = `
      <div class="dw-login-art" aria-hidden="true"></div>
      <div class="dw-login-shade" aria-hidden="true"></div>
      <main class="dw-login-layout">
        <header class="dw-brand">
          <a class="dw-brand-mark" href="./" aria-label="디자이너가 만드는 세상 홈">
            <span>DM</span><i></i>
          </a>
          <p><b>WORLD BUILD</b><span>PUBLIC ALPHA · COMMIT 001</span></p>
        </header>

        <section class="dw-manifesto" aria-labelledby="dw-title">
          <p class="dw-kicker"><i></i> A WORLD IN PROGRESS</p>
          <h1 id="dw-title"><span>디자이너가</span><strong>만드는 세상</strong></h1>
          <p class="dw-description">완성된 세계에 입장하는 대신,<br>우리에게 필요한 장면을 하나씩 커밋합니다.</p>
          <div class="dw-principles" aria-label="프로젝트 원칙">
            <span><i>01</i>아이소메트릭 월드</span>
            <span><i>02</i>실시간 멀티플레이</span>
            <span><i>03</i>디자이너의 다음 제안</span>
          </div>
        </section>

        <section class="dw-entry" aria-label="입장">
          <div class="dw-entry-line"><i></i><span>DESIGN SESSION</span><b>ONLINE</b></div>

          ${existing ? `
            <div class="dw-resume">
              <small>LAST SESSION</small>
              <h2>${escapeHtml(existing.nickname)}</h2>
              <p>이 디자이너 이름으로 현재 빌드에 합류합니다.</p>
              <button type="button" class="dw-primary dw-continue"><span>작업 중인 세계로</span><i>↗</i></button>
              <button type="button" class="dw-text-button dw-switch">다른 방식으로 입장</button>
            </div>
          ` : ''}

          <div class="dw-auth ${existing ? 'is-hidden' : ''}">
            <div class="dw-tabs" role="tablist" aria-label="입장 방식">
              <button type="button" role="tab" aria-selected="true" data-tab="guest" class="is-active">빠른 입장</button>
              <button type="button" role="tab" aria-selected="false" data-tab="account">아이디</button>
            </div>

            <div class="dw-view dw-guest" data-view="guest">
              <label for="dw-nickname">화면에 표시할 이름</label>
              <input id="dw-nickname" type="text" maxlength="12" placeholder="디자이너 이름" autocomplete="nickname" />
              <small>한 글자 이상 입력하세요. 나중에 계정으로 이어갈 수 있습니다.</small>
              <button type="button" class="dw-primary dw-guest-enter"><span>새 세션 시작</span><i>↗</i></button>
            </div>

            <div class="dw-view dw-account is-hidden" data-view="account">
              <label for="dw-id">아이디</label>
              <input id="dw-id" type="text" maxlength="16" placeholder="영문·숫자 3~16자" autocomplete="username" autocapitalize="none" />
              <label for="dw-code">접속 코드</label>
              <input id="dw-code" type="password" maxlength="32" placeholder="6자 이상" autocomplete="current-password" />
              <small>다른 기기에서도 같은 이름으로 접속할 때 사용합니다.</small>
              <div class="dw-account-actions">
                <button type="button" class="dw-secondary dw-signup">새 계정</button>
                <button type="button" class="dw-primary dw-signin"><span>로그인</span><i>↗</i></button>
              </div>
            </div>
          </div>

          <p class="dw-note" role="status" aria-live="polite"></p>
        </section>

        <footer class="dw-login-footer">
          <span>BUILD 0.1</span>
          <p>기능은 적게, 피드백은 빠르게.</p>
        </footer>
      </main>`;
    document.body.appendChild(panel);

    const q = <T extends HTMLElement>(selector: string): T => panel.querySelector<T>(selector)!;
    const note = q<HTMLParagraphElement>('.dw-note');
    const auth = q<HTMLDivElement>('.dw-auth');
    let busy = false;

    const say = (message: string, tone: 'info' | 'error' = 'info') => {
      note.textContent = message;
      note.dataset.tone = tone;
    };
    const setBusy = (next: boolean, message = '') => {
      busy = next;
      panel.classList.toggle('is-busy', next);
      panel.querySelectorAll<HTMLButtonElement>('button').forEach((button) => { button.disabled = next; });
      if (message) say(message);
    };
    const finish = (peer: PeerState) => {
      panel.classList.add('is-leaving');
      window.setTimeout(() => {
        panel.remove();
        resolve(peer);
      }, 260);
    };
    const previewOnly = () => {
      if (!preview) return false;
      say('미리보기에서는 인증하지 않습니다. 실제 배포에서는 이 화면에서 바로 입장합니다.');
      return true;
    };
    const showAuth = () => {
      q<HTMLDivElement>('.dw-resume')?.classList.add('is-hidden');
      auth.classList.remove('is-hidden');
      q<HTMLInputElement>('#dw-nickname').focus();
    };

    q<HTMLButtonElement>('.dw-continue')?.addEventListener('click', () => {
      if (existing) finish(existing);
    });
    q<HTMLButtonElement>('.dw-switch')?.addEventListener('click', showAuth);

    panel.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        if (busy) return;
        const target = button.dataset.tab;
        panel.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((tab) => {
          const active = tab === button;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', String(active));
        });
        panel.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
          view.classList.toggle('is-hidden', view.dataset.view !== target);
        });
        note.textContent = '';
        q<HTMLInputElement>(target === 'guest' ? '#dw-nickname' : '#dw-id').focus();
      });
    });

    const enterGuest = async () => {
      const nickname = q<HTMLInputElement>('#dw-nickname').value.replace(/\s+/g, ' ').trim();
      if (!nickname) {
        say('디자이너 이름을 한 글자 이상 입력해 주세요.', 'error');
        q<HTMLInputElement>('#dw-nickname').focus();
        return;
      }
      if (previewOnly() || !sb) return;
      setBusy(true, '새 디자인 세션을 준비하고 있습니다.');
      try {
        if (existing) await sb.auth.signOut();
        const { data, error } = await sb.auth.signInAnonymously();
        if (error || !data.user) throw new Error(error?.message ?? '익명 인증에 실패했습니다.');
        finish(await createProfile(sb, data.user.id, nickname));
      } catch (error) {
        setBusy(false);
        say(error instanceof Error ? error.message : '입장하지 못했습니다. 다시 시도해 주세요.', 'error');
      }
    };
    q<HTMLButtonElement>('.dw-guest-enter').addEventListener('click', () => { void enterGuest(); });
    q<HTMLInputElement>('#dw-nickname').addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') void enterGuest();
    });

    const credentials = (): { id: string; code: string } | null => {
      const id = q<HTMLInputElement>('#dw-id').value.trim().toLowerCase();
      const code = q<HTMLInputElement>('#dw-code').value;
      const idError = validateId(id);
      if (idError) { say(idError, 'error'); return null; }
      const codeError = validateCode(code);
      if (codeError) { say(codeError, 'error'); return null; }
      return { id, code };
    };
    const enterAccount = async (mode: 'signin' | 'signup') => {
      const values = credentials();
      if (!values || previewOnly() || !sb) return;
      setBusy(true, mode === 'signin' ? '저장된 세션을 불러오고 있습니다.' : '새 디자인 계정을 만들고 있습니다.');
      try {
        if (existing) await sb.auth.signOut();
        const result = mode === 'signin'
          ? await sb.auth.signInWithPassword({ email: idToEmail(values.id), password: values.code })
          : await sb.auth.signUp({ email: idToEmail(values.id), password: values.code });
        if (result.error) throw result.error;
        if (!result.data.session?.user) throw new Error('세션을 만들지 못했습니다. 이메일 확인 설정을 점검해 주세요.');
        const loaded = await loadProfileIfSession(sb);
        finish(loaded ?? await createProfile(sb, result.data.session.user.id, values.id));
      } catch (error) {
        setBusy(false);
        const message = error instanceof Error ? error.message : '계정에 연결하지 못했습니다.';
        say(message.includes('Invalid login') ? '아이디 또는 접속 코드가 맞지 않습니다.' : message, 'error');
      }
    };
    q<HTMLButtonElement>('.dw-signin').addEventListener('click', () => { void enterAccount('signin'); });
    q<HTMLButtonElement>('.dw-signup').addEventListener('click', () => { void enterAccount('signup'); });
    panel.querySelectorAll<HTMLInputElement>('.dw-account input').forEach((input) => {
      input.addEventListener('keydown', (event) => {
        event.stopPropagation();
        if (event.key === 'Enter') void enterAccount('signin');
      });
    });

    window.requestAnimationFrame(() => panel.classList.add('is-ready'));
    if (!existing) window.setTimeout(() => q<HTMLInputElement>('#dw-nickname').focus(), 380);
  });
}

/** 인증 없이 새 로그인 화면의 반응형 상태를 검수한다. */
export function showLoginPreview(): void {
  void showLoginPanel(null, null, true);
}
