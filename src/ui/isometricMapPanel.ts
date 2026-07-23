import {
  ISO_VILLAGE_ACTIVITIES,
  ISO_VILLAGE_BUILDINGS,
  ISO_VILLAGE_H,
  ISO_HUNT_ZONES,
  ISO_RESIDENT_PLACEMENTS,
  ISO_VILLAGE_W,
  isoVillageTerrain,
} from '../game/world/isometricVillageMap';
import type {
  NeighborhoodDistrictId, NeighborhoodDistrictView,
} from '../game/world/neighborhoodDistricts';
import type { AlleySecretView } from '../game/guidance/alleySecrets';

const SCALE_X = 10;
const SCALE_Y = 5;
const ORIGIN_X = ISO_VILLAGE_H * SCALE_X + 18;
const ORIGIN_Y = 20;

const terrainColor = { grass: '#75915f', alley: '#897b6c', road: '#57534f', plaza: '#a0907d', wild: '#536b4c' };

function project(tx: number, ty: number): { x: number; y: number } {
  return { x: ORIGIN_X + (tx - ty) * SCALE_X, y: ORIGIN_Y + (tx + ty) * SCALE_Y };
}

/** 아이소메트릭 전환 구역 전용 지도. 실제 월드 데이터에서 직접 그려 위치가 어긋나지 않는다. */
export class IsometricMapPanel {
  private root = document.createElement('div');
  private opened = false;

  constructor(private readonly opts: {
    onToggle: (open: boolean) => void;
    onOpen: () => void;
    getPlayerTile: () => { tx: number; ty: number };
    getDistricts: () => NeighborhoodDistrictView[];
    getSecrets: () => AlleySecretView[];
    onNavigateDistrict: (id: NeighborhoodDistrictId) => void;
    onFeatureDistrict: (id: NeighborhoodDistrictId) => void;
    onOpenSecrets: () => void;
    onOpenAtmospheres: () => void;
  }) {
    this.root.className = 'hv-wood-modal hv-map';
    this.root.style.display = 'none';
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean { return this.opened; }

  open(): void {
    if (this.opened) return;
    this.opened = true;
    this.root.style.display = 'flex';
    this.render();
    this.opts.onOpen();
    this.opts.onToggle(true);
  }

  refresh(): void {
    if (this.opened) this.render();
  }

  private render(): void {
    const districts = this.opts.getDistricts();
    const secrets = this.opts.getSecrets();
    const discovered = districts.filter((district) => district.discovered).length;
    const secretCount = secrets.filter((secret) => secret.discovered).length;
    const featured = districts.find((district) => district.featured);
    this.root.innerHTML = `<div class="wood-frame map-frame">
      <div class="wood-head"><h2>아이소메트릭 홍대마을</h2><span class="pill">골목 여권 ${discovered}/${districts.length}</span><span class="pill">비밀 기록 ${secretCount}/${secrets.length}</span><span class="pill">${featured ? `최애 · ${escapeHtml(featured.name)}` : '최애 권역 미선택'}</span></div>
      <div class="wood-page map-page">
        <section class="iso-map-canvas"><canvas width="660" height="330"></canvas><p>활동 표식과 주민을 찾아보고, 동쪽 외곽숲은 원할 때만 도전하세요.</p><div class="map-world-books"><button class="map-secret-book">◇ 골목 비밀 기록 ${secretCount}/${secrets.length}</button><button class="map-atmosphere-book">하 골목 분위기 관측소</button></div></section>
        <aside class="district-passport">
          <header><small>NEIGHBORHOOD PASSPORT</small><b>일곱 골목 발견 도장</b><span>걸어서 발견 · 순간이동 없음</span></header>
          <div>${districts.map((district) => `
            <article class="${district.discovered ? 'is-discovered' : 'is-unknown'} ${district.featured ? 'is-featured' : ''}" style="--district:${district.color}">
              <i>${district.discovered ? escapeHtml(district.mark) : '?'}</i>
              <div><small>${escapeHtml(district.code)}</small><b>${escapeHtml(district.name)}</b><span>${escapeHtml(district.discovered ? district.subtitle : district.description)}</span></div>
              <button data-district-route="${district.id}">${district.discovered ? '다시 걷기' : '길 찾기'}</button>
              <button data-district-feature="${district.id}" ${district.discovered ? '' : 'disabled'}>${district.featured ? '최애 해제' : '최애'}</button>
            </article>`).join('')}</div>
          <p>처음 들어선 권역만 도장을 남깁니다. 전투 지역도 들어가기 전까지는 안전한 연결도로로 안내해요.</p>
        </aside>
      </div>
      <button class="wood-close">✕</button>
    </div>`;
    this.root.querySelector('.wood-close')!.addEventListener('click', () => this.close());
    this.root.querySelector('.map-secret-book')!.addEventListener('click', () => {
      this.close();
      this.opts.onOpenSecrets();
    });
    this.root.querySelector('.map-atmosphere-book')!.addEventListener('click', () => {
      this.close();
      this.opts.onOpenAtmospheres();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-district-route]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.districtRoute as NeighborhoodDistrictId;
        this.close();
        this.opts.onNavigateDistrict(id);
      });
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-district-feature]').forEach((button) => {
      button.addEventListener('click', () => {
        this.opts.onFeatureDistrict(button.dataset.districtFeature as NeighborhoodDistrictId);
        this.render();
      });
    });
    this.draw(districts, secrets);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.root.style.display = 'none';
    this.opts.onToggle(false);
  }

  private draw(
    districts: readonly NeighborhoodDistrictView[],
    secrets: readonly AlleySecretView[],
  ): void {
    const canvas = this.root.querySelector<HTMLCanvasElement>('canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#e7d5ac'; ctx.fillRect(0, 0, canvas!.width, canvas!.height);
    for (let ty = 0; ty < ISO_VILLAGE_H; ty++) for (let tx = 0; tx < ISO_VILLAGE_W; tx++) {
      const p = project(tx, ty);
      ctx.fillStyle = terrainColor[isoVillageTerrain(tx, ty)];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + SCALE_X, p.y + SCALE_Y);
      ctx.lineTo(p.x, p.y + SCALE_Y * 2); ctx.lineTo(p.x - SCALE_X, p.y + SCALE_Y); ctx.closePath(); ctx.fill();
    }
    for (const b of ISO_VILLAGE_BUILDINGS) {
      const p = project(b.tx + b.w / 2, b.ty + b.h / 2);
      ctx.fillStyle = `#${b.accent.toString(16).padStart(6, '0')}`;
      ctx.fillRect(p.x - 15, p.y - 13 - b.levels * 2, 30, 13 + b.levels * 2);
      ctx.fillStyle = '#3e3129'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(b.name, p.x, p.y + 10);
    }
    ctx.fillStyle = '#7e529e'; ctx.font = 'bold 10px sans-serif';
    for (const zone of ISO_HUNT_ZONES) {
      const p = project(zone.tx + zone.w / 2, zone.ty + zone.h / 2);
      ctx.fillText(`⚔ ${zone.name}`, p.x, p.y + 4);
    }
    ctx.font = '13px sans-serif';
    for (const spot of ISO_VILLAGE_ACTIVITIES) {
      const p = project(spot.tx + 0.5, spot.ty + 0.5);
      ctx.fillText(spot.emoji, p.x, p.y + 4);
    }
    ctx.fillStyle = '#b7464d'; ctx.font = 'bold 9px sans-serif';
    for (const resident of ISO_RESIDENT_PLACEMENTS) {
      const p = project(resident.tx + 0.5, resident.ty + 0.5);
      ctx.fillText('♥', p.x, p.y + 3);
    }
    for (const district of districts) {
      const p = project(district.guideTarget.tx + 0.5, district.guideTarget.ty + 0.5);
      ctx.fillStyle = district.discovered ? district.color : '#706b64';
      ctx.beginPath(); ctx.arc(p.x, p.y, district.featured ? 9 : 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = district.featured ? '#fff3b5' : '#342c26';
      ctx.lineWidth = district.featured ? 3 : 1; ctx.stroke();
      ctx.fillStyle = '#fff6d8'; ctx.font = 'bold 8px sans-serif';
      ctx.fillText(district.discovered ? district.mark : '?', p.x, p.y + 3);
    }
    ctx.font = 'bold 8px monospace';
    for (const secret of secrets.filter((entry) => entry.discovered)) {
      const secretPoint = project(secret.tx + 0.5, secret.ty + 0.5);
      ctx.fillStyle = '#fff0b8'; ctx.fillRect(secretPoint.x - 4, secretPoint.y - 4, 8, 8);
      ctx.fillStyle = '#574635'; ctx.fillText(secret.mark, secretPoint.x, secretPoint.y + 3);
    }
    const me = this.opts.getPlayerTile();
    const p = project(me.tx + 0.5, me.ty + 0.5);
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#db4f52'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('●', p.x, p.y + 4);
  }

  destroy(): void { this.root.remove(); }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!
  ));
}
