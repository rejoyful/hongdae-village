import type { SupabaseClient } from '@supabase/supabase-js';
import type { PeerState } from '../net/NetworkAdapter';
import { normalizeAppearance, randomAppearance, type Appearance } from '../game/art/appearance';

/**
 * 세션이 있으면 프로필 로드, 없으면 닉네임 입력 → 익명 로그인 → 프로필 upsert.
 * 카카오 OAuth는 Phase 2.5에서 이 함수만 확장하면 된다.
 */
export async function ensureProfile(sb: SupabaseClient): Promise<PeerState> {
  const { data: { session } } = await sb.auth.getSession();
  let uid = session?.user.id ?? null;

  if (uid) {
    const { data, error } = await sb.from('profiles').select('nickname,color,appearance').eq('id', uid).maybeSingle();
    // 일시 오류를 "신규 유저"로 오판해 기존 프로필을 덮어쓰면 안 된다 → 오프라인 폴백으로 던진다
    if (error) throw new Error(`프로필 로드 실패(일시 오류일 수 있음): ${error.message}`);
    if (data) {
      const appearance = normalizeAppearance(data.appearance, data.color as string);
      return { userId: uid, nickname: data.nickname as string, color: appearance.shirt, appearance };
    }
    // error 없음 + data 없음 = 확실히 프로필 미생성 (세션만 있는 상태) → 아래 생성 경로로
  }

  const nickname = await promptNickname(sb);
  if (!uid) {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error || !data.user) throw new Error(`익명 로그인 실패: ${error?.message ?? 'unknown'}`);
    uid = data.user.id;
  }
  const appearance = randomAppearance();
  const { error: upsertErr } = await sb.from('profiles')
    .upsert({ id: uid, nickname, color: appearance.shirt, appearance });
  if (upsertErr) throw new Error(`프로필 저장 실패: ${upsertErr.message}`);
  return { userId: uid, nickname, color: appearance.shirt, appearance };
}

/** 커스터마이징 저장 (color는 레거시 동기화) */
export async function saveAppearance(sb: SupabaseClient, uid: string, a: Appearance): Promise<void> {
  await sb.from('profiles').update({ appearance: a, color: a.shirt }).eq('id', uid);
}

/** 계정 지키기 — 익명 계정에 이메일 연결 (다른 기기에서 복구 가능해짐) */
export async function linkEmail(sb: SupabaseClient, email: string): Promise<string | null> {
  const { error } = await sb.auth.updateUser({ email });
  return error ? error.message : null;
}

/** 이메일로 기존 계정 불러오기 — 매직링크 발송 (메일의 링크를 열면 이 사이트로 복귀하며 로그인) */
export async function requestRecovery(sb: SupabaseClient, email: string): Promise<string | null> {
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + window.location.pathname },
  });
  return error ? error.message : null;
}

function promptNickname(sb: SupabaseClient): Promise<string> {
  return new Promise((resolve) => {
    const panel = document.createElement('div');
    panel.className = 'hv-panel';
    panel.innerHTML = `
      <div class="hv-card">
        <h1>홍대마을</h1>
        <p>마을에서 쓸 닉네임을 정해주세요 (1~12자)</p>
        <input type="text" maxlength="12" placeholder="닉네임" autofocus />
        <button>입장하기</button>
        <a class="hv-recover" href="#">예전에 만든 캐릭터가 있어요 (이메일로 불러오기)</a>
        <p class="hv-note" style="display:none"></p>
      </div>`;
    document.body.appendChild(panel);
    const input = panel.querySelector('input')!;
    const button = panel.querySelector('button')!;
    const note = panel.querySelector<HTMLParagraphElement>('.hv-note')!;

    panel.querySelector<HTMLAnchorElement>('.hv-recover')!.addEventListener('click', (e) => {
      e.preventDefault();
      const email = window.prompt('계정에 연결해둔 이메일 주소를 입력하세요');
      if (!email) return;
      note.style.display = 'block';
      note.textContent = '메일 보내는 중…';
      void requestRecovery(sb, email.trim()).then((err) => {
        note.textContent = err
          ? `불러오기 실패: ${err}`
          : '메일함을 확인하세요! 메일 속 링크를 열면 캐릭터가 이어집니다 ✉️';
      });
    });

    const submit = () => {
      const name = input.value.trim();
      if (name.length < 1) { input.focus(); return; }
      panel.remove();
      resolve(name);
    };
    button.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // 게임 키 입력과 분리
      if (e.key === 'Enter') submit();
    });
    input.focus();
  });
}
