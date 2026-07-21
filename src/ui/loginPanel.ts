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
    const { data } = await sb.from('profiles').select('nickname,color,appearance').eq('id', uid).maybeSingle();
    if (data) {
      const appearance = normalizeAppearance(data.appearance, data.color as string);
      return { userId: uid, nickname: data.nickname as string, color: appearance.shirt, appearance };
    }
  }

  const nickname = await promptNickname();
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

function promptNickname(): Promise<string> {
  return new Promise((resolve) => {
    const panel = document.createElement('div');
    panel.className = 'hv-panel';
    panel.innerHTML = `
      <div class="hv-card">
        <h1>홍대마을</h1>
        <p>마을에서 쓸 닉네임을 정해주세요 (1~12자)</p>
        <input type="text" maxlength="12" placeholder="닉네임" autofocus />
        <button>입장하기</button>
      </div>`;
    document.body.appendChild(panel);
    const input = panel.querySelector('input')!;
    const button = panel.querySelector('button')!;
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
