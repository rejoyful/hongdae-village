import {
  type Appearance, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, SHIRT_COLORS, PANTS_COLORS,
} from '../game/art/appearance';

const SKIN_LABEL = ['라이트', '미디엄', '탠', '딥'];

/** C키로 여는 캐릭터 커스터마이징 패널 — 변경 즉시 미리보기(onChange), 저장 시 onSave */
export class CustomizePanel {
  private root: HTMLDivElement;
  private a: Appearance;
  private opened = false;

  constructor(
    initial: Appearance,
    private readonly opts: {
      onChange: (a: Appearance) => void;
      onSave: (a: Appearance) => void;
      onToggle: (open: boolean) => void;
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
    this.opts.onToggle(true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private cycle(field: keyof Appearance, dir: 1 | -1): void {
    const len = { skin: SKIN_TONES.length, hair: HAIR_STYLES.length, hairColor: HAIR_COLORS.length, pants: PANTS_COLORS.length }[field as string] ?? 0;
    if (field === 'shirt') {
      const i = SHIRT_COLORS.indexOf(this.a.shirt as typeof SHIRT_COLORS[number]);
      const next = ((i < 0 ? 0 : i) + dir + SHIRT_COLORS.length) % SHIRT_COLORS.length;
      this.a.shirt = SHIRT_COLORS[next]!;
    } else {
      this.a[field] = (((this.a[field] as number) + dir + len) % len) as never;
    }
    this.render();
    this.opts.onChange({ ...this.a });
  }

  private render(): void {
    const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
    const rows: Array<[string, keyof Appearance, string, string | null]> = [
      ['피부', 'skin', SKIN_LABEL[this.a.skin] ?? '', hex(SKIN_TONES[this.a.skin]!)],
      ['헤어', 'hair', HAIR_STYLES[this.a.hair] ?? '', null],
      ['머리색', 'hairColor', '', hex(HAIR_COLORS[this.a.hairColor]!)],
      ['상의', 'shirt', '', `#${this.a.shirt}`],
      ['하의', 'pants', '', hex(PANTS_COLORS[this.a.pants]!)],
    ];
    this.root.innerHTML = `
      <div class="hv-custom-card">
        <h2>캐릭터 꾸미기</h2>
        ${rows.map(([label, field, text, swatch]) => `
          <div class="hv-custom-row">
            <span class="lbl">${label}</span>
            <button data-f="${field}" data-d="-1">◀</button>
            <span class="val">${swatch ? `<i style="background:${swatch}"></i>` : ''}${text}</span>
            <button data-f="${field}" data-d="1">▶</button>
          </div>`).join('')}
        <div class="hv-custom-actions">
          <button class="save">저장</button>
          <button class="cancel">닫기</button>
        </div>
      </div>`;
    this.root.querySelectorAll<HTMLButtonElement>('button[data-f]').forEach((b) => {
      b.addEventListener('click', () => this.cycle(b.dataset.f as keyof Appearance, Number(b.dataset.d) as 1 | -1));
    });
    this.root.querySelector('.save')!.addEventListener('click', () => {
      this.opts.onSave({ ...this.a });
      this.close();
    });
    this.root.querySelector('.cancel')!.addEventListener('click', () => this.close());
  }

  destroy(): void { this.root.remove(); }
}
