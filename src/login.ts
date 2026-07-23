import { createDesignerProfile, type DesignerProfile } from './core/profile';

interface LoginOptions {
  onJoin: (profile: DesignerProfile) => void;
}

const arrowIcon = `
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
    <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

export function mountLogin(root: HTMLElement, options: LoginOptions): void {
  root.innerHTML = `
    <main class="login-screen" aria-labelledby="login-title">
      <img
        class="login-key-art"
        src="./assets/ui/designer-world-login-v1.png"
        alt=""
        aria-hidden="true"
      />
      <div class="login-shade" aria-hidden="true"></div>
      <section class="login-copy">
        <p class="version-label">WORLD / 000</p>
        <h1 id="login-title">디자이너가<br />만드는 세상</h1>
        <p class="login-intro">
          아직 아무것도 없는 바닥에서 시작합니다.<br />
          첫 번째 디자이너로 접속하세요.
        </p>

        <form class="login-glass" novalidate>
          <div class="field">
            <label for="designer-name">디자이너 이름</label>
            <input
              id="designer-name"
              name="designer-name"
              type="text"
              maxlength="16"
              autocomplete="nickname"
              placeholder="어떻게 불러드릴까요?"
              enterkeyhint="go"
              required
            />
            <p class="field-message" aria-live="polite">
              이 이름은 빈 바닥 위에 표시됩니다.
            </p>
          </div>
          <button class="join-button" type="submit">
            <span>세계에 들어가기</span>
            ${arrowIcon}
          </button>
        </form>
      </section>
      <p class="login-caption">A WORLD BUILT ONE COMMIT AT A TIME</p>
    </main>
  `;

  const form = root.querySelector<HTMLFormElement>('.login-glass');
  const input = root.querySelector<HTMLInputElement>('#designer-name');
  const message = root.querySelector<HTMLElement>('.field-message');
  const keyArt = root.querySelector<HTMLImageElement>('.login-key-art');

  if (!form || !input || !message || !keyArt) return;

  keyArt.addEventListener('load', () => {
    keyArt.classList.add('is-ready');
  }, { once: true });

  if (keyArt.complete) keyArt.classList.add('is-ready');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.classList.remove('has-error');

    try {
      const profile = createDesignerProfile(input.value);
      const button = form.querySelector<HTMLButtonElement>('.join-button');
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
      }
      options.onJoin(profile);
    } catch (error) {
      form.classList.add('has-error');
      message.textContent = error instanceof Error
        ? error.message
        : '이름을 다시 확인해 주세요.';
      input.focus();
    }
  });
}
