import {
  type Appearance, SKIN_TONES, SKIN_LABELS, HAIR_STYLES, HAIR_COLORS, HAIR_COLOR_LABELS,
  SHIRT_COLORS, PANTS_COLORS, GLASSES_STYLES, HAT_STYLES, randomAppearance,
} from '../game/art/appearance';
import { paintCharacterFrame, CHAR_W, CHAR_H } from '../game/art/characterArt';

const hex6 = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** 한 줄(카테고리) 정의: 라벨 · 필드 · 표시 텍스트 · 스와치색 */
type RowDef = [label: string, field: keyof Appearance, text: string, swatch: string | null];

/** C키로 여는 캐릭터 커스터마이징 패널 — 큰 미리보기 + 즉시 반영(onChange), 저장 시 onSave */
export class CustomizePanel {
  private root: HTMLDivElement;
  private a: Appearance;
  private opened = false;
  private previewCanvas: HTMLCanvasElement | null = null;
  private dir: 0 | 1 | 2 | 3 = 0; // 미리보기 방향 (하/우/좌/상)
  private step = 0;
  private animTimer = 0;

  constructor(
    initial: Appearance,
    private readonly opts: {
      onChange: (a: Appearance) => void;
      onSave: (a: Appearance) => void;
      onToggle: (open: boolean) => void;
      /** 계정 지키기 — 아이디·코드 부여(익명→영구 전환). 에러 메시지 또는 null(성공) 반환 */
      onLinkId?: (id: string, code: string) => Promise<string | null>;
    },
  ) {
    this.a = { ...initial };
    this.root = document.createElement('div');
    this.root.className = 'hv-custom';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
    this.root.addEventListener('keydown', (e) => e.stopPropagation());
    this.render();
  }

  get isOpen(): boolean { return this.opened; }

  open(current: Appearance): void {
    if (this.opened) return;
    this.a = { ...current };
    this.opened = true;
    this.root.style.display = 'flex';
    this.render();
    this.startAnim();
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.stopAnim();
    this.opts.onToggle(false);
  }

  private startAnim(): void {
    this.stopAnim();
    // 제자리 걸음으로 살아있는 느낌 (선명한 픽셀 미리보기)
    this.animTimer = window.setInterval(() => {
      this.step = (this.step + 1) % 4;
      this.paintPreview();
    }, 190);
  }

  private stopAnim(): void {
    if (this.animTimer) { clearInterval(this.animTimer); this.animTimer = 0; }
  }

  private paintPreview(): void {
    const ctx = this.previewCanvas?.getContext('2d');
    if (ctx) paintCharacterFrame(ctx, this.a, this.dir, this.step);
  }

  private cycle(field: keyof Appearance, dir: 1 | -1): void {
    const lens: Record<string, number> = {
      skin: SKIN_TONES.length, hair: HAIR_STYLES.length, hairColor: HAIR_COLORS.length,
      pants: PANTS_COLORS.length, glasses: GLASSES_STYLES.length, hat: HAT_STYLES.length,
    };
    if (field === 'shirt') {
      const i = SHIRT_COLORS.indexOf(this.a.shirt as typeof SHIRT_COLORS[number]);
      const next = ((i < 0 ? 0 : i) + dir + SHIRT_COLORS.length) % SHIRT_COLORS.length;
      this.a.shirt = SHIRT_COLORS[next]!;
    } else {
      const len = lens[field as string] ?? 0;
      this.a[field] = (((this.a[field] as number) + dir + len) % len) as never;
    }
    this.render();
    this.paintPreview();
    this.opts.onChange({ ...this.a });
  }

  private turn(dir: 0 | 1 | 2 | 3): void {
    this.dir = dir;
    this.render();
    this.paintPreview();
  }

  private randomize(): void {
    this.a = randomAppearance();
    this.render();
    this.paintPreview();
    this.opts.onChange({ ...this.a });
  }

  private rows(): RowDef[] {
    return [
      ['피부', 'skin', SKIN_LABELS[this.a.skin] ?? '', hex6(SKIN_TONES[this.a.skin]!)],
      ['헤어', 'hair', HAIR_STYLES[this.a.hair] ?? '', null],
      ['머리색', 'hairColor', HAIR_COLOR_LABELS[this.a.hairColor] ?? '', hex6(HAIR_COLORS[this.a.hairColor]!)],
      ['상의', 'shirt', '', `#${this.a.shirt}`],
      ['하의', 'pants', '', hex6(PANTS_COLORS[this.a.pants]!)],
      ['안경', 'glasses', GLASSES_STYLES[this.a.glasses ?? 0] ?? '', null],
      ['모자', 'hat', HAT_STYLES[this.a.hat ?? 0] ?? '', null],
    ];
  }

  private render(): void {
    const dirs: Array<[0 | 1 | 2 | 3, string]> = [[3, '뒤'], [2, '좌'], [0, '앞'], [1, '우']];
    this.root.innerHTML = `
      <div class="hv-custom-card">
        <div class="cc-head">
          <h2>캐릭터 꾸미기</h2>
          <button class="cc-random" title="랜덤">🎲 랜덤</button>
        </div>
        <div class="cc-preview-wrap">
          <div class="cc-stage">
            <canvas class="cc-preview" width="${CHAR_W}" height="${CHAR_H}"></canvas>
          </div>
          <div class="cc-turn">
            ${dirs.map(([d, t]) => `<button data-dir="${d}" class="${this.dir === d ? 'sel' : ''}">${t}</button>`).join('')}
          </div>
        </div>
        <div class="cc-rows">
          ${this.rows().map(([label, field, text, swatch]) => `
            <div class="hv-custom-row">
              <span class="lbl">${label}</span>
              <button data-f="${field}" data-d="-1">◀</button>
              <span class="val">${swatch ? `<i style="background:${swatch}"></i>` : ''}${text}</span>
              <button data-f="${field}" data-d="1">▶</button>
            </div>`).join('')}
        </div>
        <div class="hv-custom-actions">
          <button class="save">저장</button>
          <button class="cancel">닫기</button>
        </div>
        ${this.opts.onLinkId ? `
        <div class="hv-custom-account">
          <p>💾 계정 지키기 — 아이디·코드를 만들면 다른 기기에서도 이 캐릭터로 로그인!</p>
          <div class="row">
            <input class="acc-id" type="text" maxlength="16" placeholder="아이디" autocapitalize="none" />
            <input class="acc-code" type="password" maxlength="32" placeholder="코드 6자+" />
            <button class="link">만들기</button>
          </div>
          <p class="acc-note"></p>
        </div>` : ''}
      </div>`;

    this.previewCanvas = this.root.querySelector('.cc-preview');
    this.paintPreview();

    this.root.querySelector('.cc-random')!.addEventListener('click', () => this.randomize());
    this.root.querySelectorAll<HTMLButtonElement>('.cc-turn button').forEach((b) => {
      b.addEventListener('click', () => this.turn(Number(b.dataset.dir) as 0 | 1 | 2 | 3));
    });
    this.root.querySelectorAll<HTMLButtonElement>('button[data-f]').forEach((b) => {
      b.addEventListener('click', () => this.cycle(b.dataset.f as keyof Appearance, Number(b.dataset.d) as 1 | -1));
    });
    this.root.querySelector('.save')!.addEventListener('click', () => {
      this.opts.onSave({ ...this.a });
      this.close();
    });
    this.root.querySelector('.cancel')!.addEventListener('click', () => this.close());

    const linkBtn = this.root.querySelector<HTMLButtonElement>('.hv-custom-account .link');
    if (linkBtn && this.opts.onLinkId) {
      linkBtn.addEventListener('click', () => {
        const idInput = this.root.querySelector<HTMLInputElement>('.acc-id')!;
        const codeInput = this.root.querySelector<HTMLInputElement>('.acc-code')!;
        const noteEl = this.root.querySelector<HTMLParagraphElement>('.acc-note')!;
        noteEl.textContent = '만드는 중…';
        void this.opts.onLinkId!(idInput.value, codeInput.value).then((err) => {
          noteEl.textContent = err
            ? `실패: ${err}`
            : '완료! 이제 어느 기기에서든 이 아이디·코드로 로그인하면 돼요 ✅';
        });
      });
      this.root.querySelectorAll<HTMLInputElement>('.hv-custom-account input')
        .forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
    }
  }

  destroy(): void { this.stopAnim(); this.root.remove(); }
}
