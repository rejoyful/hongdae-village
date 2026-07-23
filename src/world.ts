import {
  clampTile,
  getWorldMetrics,
  projectIsometric,
  unprojectIsometric,
  type TilePoint,
  type WorldMetrics,
} from './core/isometric';
import type { DesignerProfile } from './core/profile';

interface WorldOptions {
  profile: DesignerProfile;
  onExit: () => void;
}

export class EmptyWorld {
  private readonly root: HTMLElement;
  private readonly profile: DesignerProfile;
  private readonly onExit: () => void;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly player: HTMLElement;
  private readonly liveStatus: HTMLElement;
  private position: TilePoint = { x: 0, y: 0 };
  private metrics: WorldMetrics;
  private width = 0;
  private height = 0;
  private resizeObserver: ResizeObserver;

  constructor(root: HTMLElement, options: WorldOptions) {
    this.root = root;
    this.profile = options.profile;
    this.onExit = options.onExit;
    this.root.innerHTML = this.template();

    const canvas = root.querySelector<HTMLCanvasElement>('.world-canvas');
    const player = root.querySelector<HTMLElement>('.world-player');
    const liveStatus = root.querySelector<HTMLElement>('.connection-copy');
    const context = canvas?.getContext('2d');

    if (!canvas || !player || !liveStatus || !context) {
      throw new Error('빈 세계를 준비하지 못했습니다.');
    }

    this.canvas = canvas;
    this.player = player;
    this.liveStatus = liveStatus;
    this.context = context;
    this.metrics = getWorldMetrics(window.innerWidth, window.innerHeight);
    this.resizeObserver = new ResizeObserver(() => this.resize());

    this.bindEvents();
    this.resizeObserver.observe(this.root);
    this.resize();
  }

  destroy(): void {
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private template(): string {
    return `
      <main class="world-screen" aria-label="아직 아무것도 없는 아이소메트릭 세계">
        <canvas class="world-canvas"></canvas>
        <div class="world-vignette" aria-hidden="true"></div>

        <header class="world-header glass-control">
          <div class="world-mark" aria-hidden="true">D/W</div>
          <div class="connection-state">
            <span class="connection-dot" aria-hidden="true"></span>
            <span class="connection-copy" aria-live="polite">캐릭터 불러오는 중</span>
          </div>
          <button class="exit-button" type="button">나가기</button>
        </header>

        <div class="world-player" aria-label="${escapeHtml(this.profile.name)} 캐릭터">
          <div class="player-stack">
            <div class="player-shadow" aria-hidden="true"></div>
            <img
              class="player-sprite"
              src="./assets/characters/designer-01-idle-v1.png"
              alt=""
              aria-hidden="true"
            />
            <span class="player-name">${escapeHtml(this.profile.name)}</span>
          </div>
        </div>

        <section class="world-note" aria-labelledby="world-note-title">
          <p>VERSION 0.0</p>
          <h2 id="world-note-title">빈 바닥</h2>
          <span>여기서부터 하나씩 만듭니다.</span>
        </section>

        <p class="world-help glass-control">
          바닥을 누르거나 방향키로 이동
        </p>
      </main>
    `;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', (event) => {
      const bounds = this.canvas.getBoundingClientRect();
      const tile = unprojectIsometric({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      }, this.metrics);
      this.moveTo(clampTile(tile, this.metrics.radius));
    });

    this.root.querySelector<HTMLButtonElement>('.exit-button')
      ?.addEventListener('click', this.onExit);

    const sprite = this.root.querySelector<HTMLImageElement>('.player-sprite');
    sprite?.addEventListener('load', () => {
      this.player.classList.add('is-ready');
      this.liveStatus.textContent = `${this.profile.name} 접속됨`;
    }, { once: true });
    sprite?.addEventListener('error', () => {
      this.liveStatus.textContent = '캐릭터를 불러오지 못했습니다';
      this.liveStatus.closest('.connection-state')?.classList.add('has-error');
    }, { once: true });

    if (sprite?.complete && sprite.naturalWidth > 0) {
      this.player.classList.add('is-ready');
      this.liveStatus.textContent = `${this.profile.name} 접속됨`;
    }

    window.addEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const directions: Record<string, TilePoint> = {
      ArrowUp: { x: -1, y: -1 },
      w: { x: -1, y: -1 },
      W: { x: -1, y: -1 },
      ArrowDown: { x: 1, y: 1 },
      s: { x: 1, y: 1 },
      S: { x: 1, y: 1 },
      ArrowLeft: { x: -1, y: 1 },
      a: { x: -1, y: 1 },
      A: { x: -1, y: 1 },
      ArrowRight: { x: 1, y: -1 },
      d: { x: 1, y: -1 },
      D: { x: 1, y: -1 },
    };
    const direction = directions[event.key];
    if (!direction) return;

    event.preventDefault();
    this.moveTo(clampTile({
      x: this.position.x + direction.x,
      y: this.position.y + direction.y,
    }, this.metrics.radius));
  };

  private resize(): void {
    const bounds = this.root.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    if (nextWidth === this.width && nextHeight === this.height) return;

    this.width = nextWidth;
    this.height = nextHeight;
    this.metrics = getWorldMetrics(this.width, this.height);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.drawGround();
    this.placePlayer(false);
  }

  private moveTo(tile: TilePoint): void {
    this.position = tile;
    this.placePlayer(true);
  }

  private placePlayer(animate: boolean): void {
    const point = projectIsometric(this.position, this.metrics);
    this.player.classList.toggle('can-transition', animate);
    this.player.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
  }

  private drawGround(): void {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);

    const orderedTiles: TilePoint[] = [];
    for (let x = -this.metrics.radius; x <= this.metrics.radius; x += 1) {
      for (let y = -this.metrics.radius; y <= this.metrics.radius; y += 1) {
        orderedTiles.push({ x, y });
      }
    }
    orderedTiles.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    orderedTiles.forEach((tile) => {
      const center = projectIsometric(tile, this.metrics);
      const halfWidth = this.metrics.tileWidth / 2;
      const halfHeight = this.metrics.tileHeight / 2;

      ctx.beginPath();
      ctx.moveTo(center.x, center.y - halfHeight);
      ctx.lineTo(center.x + halfWidth, center.y);
      ctx.lineTo(center.x, center.y + halfHeight);
      ctx.lineTo(center.x - halfWidth, center.y);
      ctx.closePath();

      const isOrigin = tile.x === 0 && tile.y === 0;
      const alternate = Math.abs(tile.x + tile.y) % 2 === 1;
      ctx.fillStyle = isOrigin
        ? '#343130'
        : alternate
          ? '#252829'
          : '#292c2d';
      ctx.fill();
      ctx.strokeStyle = isOrigin ? '#8e5d4c' : '#3d4243';
      ctx.lineWidth = isOrigin ? 1.4 : 0.8;
      ctx.stroke();
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
