export function showDesignSystemPreview(): void {
  document.documentElement.classList.add('dw-style-guide-active');
  document.title = '게임 디자인 시스템 · 디자이너가 만드는 세상';

  const root = document.createElement('div');
  root.className = 'dw-system-preview';
  root.innerHTML = `
    <nav class="dw-system-nav dw-glass--clear" aria-label="디자인 시스템 보기">
      <div>
        <small>WORLD UI 1.0</small>
        <b>디자이너가 만드는 세상 · Liquid Glass</b>
      </div>
      <div class="dw-system-segment" role="tablist" aria-label="유리 재질">
        <button type="button" role="tab" aria-selected="true" data-material="regular" class="is-selected">REGULAR</button>
        <button type="button" role="tab" aria-selected="false" data-material="clear">CLEAR</button>
      </div>
    </nav>

    <main class="dw-system-main">
      <section class="dw-system-hero">
        <div class="dw-system-copy">
          <small class="dw-system-eyebrow">CONTENT BELOW · CONTROLS ABOVE</small>
          <h1><span>픽셀 세계 위에</span><strong>살아 있는 도구</strong></h1>
          <p>아이소메트릭 월드는 선명하게 남겨 두고, 버튼과 HUD, 내비게이션과 팝업만 하나의 반응형 유리 층으로 띄웁니다.</p>
          <div class="dw-system-palette" aria-label="핵심 색상">
            <i style="--swatch:#151a1c" title="Charcoal"></i>
            <i style="--swatch:#f1ecdf" title="Bone"></i>
            <i style="--swatch:#d86f5d" title="Coral"></i>
            <i style="--swatch:#819b80" title="Sage"></i>
          </div>
        </div>

        <div class="dw-system-stage">
          <section class="dw-system-demo dw-glass--regular" aria-label="게임 진입 예시">
            <div>
              <small class="dw-system-eyebrow">DESIGN SESSION · ONLINE</small>
              <h2>첫 번째 공동 장면</h2>
              <p>현재 빌드에 합류하거나 다음 제안을 남깁니다.</p>
            </div>
            <div class="dw-system-demo-actions">
              <button type="button" class="dw-control--quiet">둘러보기</button>
              <button type="button" class="dw-control--primary">세계에 합류</button>
            </div>
          </section>
        </div>
      </section>

      <section class="dw-system-components">
        <article class="dw-system-section dw-glass--regular">
          <header>
            <small class="dw-system-eyebrow">CONTROLS</small>
            <h2>행동과 입력</h2>
          </header>
          <div class="dw-system-control-stack">
            <button type="button" class="dw-control--primary">주요 행동</button>
            <button type="button">보조 행동</button>
            <button type="button" class="is-selected" aria-pressed="true">선택됨</button>
            <button type="button" disabled>사용할 수 없음</button>
          </div>
          <div class="dw-system-field">
            <label for="dw-system-name">화면에 표시할 이름</label>
            <input id="dw-system-name" type="text" placeholder="디자이너 이름" />
            <small>입력은 16px 이상이며 오류와 도움말은 이 위치에 표시합니다.</small>
          </div>
        </article>

        <article class="dw-system-hud-samples">
          <div>
            <div class="dw-system-dock dw-glass--clear" aria-label="HUD 도구막대">
              <button type="button" aria-label="월드">W</button>
              <button type="button" aria-label="지도" class="is-selected">M</button>
              <button type="button" aria-label="기록">R</button>
              <button type="button" aria-label="설정">S</button>
            </div>
            <div class="dw-system-status dw-glass--clear">
              <i></i>
              <div><b>공동 세계 연결됨</b><small>다음 커밋을 기다리고 있습니다.</small></div>
              <span>ONLINE</span>
            </div>
          </div>
        </article>
      </section>

      <section class="dw-system-principles">
        <section>
          <small class="dw-system-eyebrow">HIERARCHY</small>
          <h3>콘텐츠와 기능을 분리합니다.</h3>
          <p>픽셀아트는 콘텐츠 층, 긴 기록은 표준 재질, 조작은 Liquid Glass 층에 둡니다. 유리의 목적은 장식이 아니라 기능의 위치를 알려 주는 것입니다.</p>
        </section>
        <section>
          <small class="dw-system-eyebrow">HARMONY</small>
          <h3>게임의 각진 픽셀과 부드러운 유리를 함께 씁니다.</h3>
          <p>픽셀 이미지는 날카롭게 유지하고 유리의 모서리·굴절·움직임만 부드럽게 처리합니다. Charcoal, Bone, Muted Coral, Sage 네 색 안에서 모든 새 UI를 설계합니다.</p>
        </section>
      </section>
    </main>`;

  document.body.replaceChildren(root);

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-material]'));
  const demo = root.querySelector<HTMLElement>('.dw-system-demo')!;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-selected', String(selected));
      });
      const clear = tab.dataset.material === 'clear';
      demo.classList.toggle('dw-glass--clear', clear);
      demo.classList.toggle('dw-glass--regular', !clear);
    });
  });
}
