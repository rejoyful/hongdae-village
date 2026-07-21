/**
 * 오디오 엔진 (스펙 §2 "차분한 힐링 음악") — 외부 파일 없이 WebAudio로
 * 잔잔한 제너러티브 BGM(펜타토닉 플럭 + 패드)과 효과음을 합성한다.
 * 볼륨은 설정 패널 슬라이더와 연동, localStorage에 지속.
 */
export type SeKind = 'click' | 'coin' | 'success' | 'note' | 'door' | 'pop';

interface AudioPrefs { bgm: number; se: number; vib: boolean }

const PREF_KEY = 'hv-audio';
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C 펜타토닉

export function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AudioPrefs>;
      return {
        bgm: clamp01(p.bgm, 0.5), se: clamp01(p.se, 0.7),
        vib: typeof p.vib === 'boolean' ? p.vib : true,
      };
    }
  } catch { /* ignore */ }
  return { bgm: 0.5, se: 0.7, vib: true };
}
function clamp01(v: unknown, def: number): number {
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : def;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private seGain: GainNode | null = null;
  private timer: number | null = null;
  private nextNoteAt = 0;
  private nextPadAt = 0;
  private melodyIdx = 2;
  prefs: AudioPrefs = loadPrefs();

  /** 첫 사용자 제스처에서 호출 — 오토플레이 정책 준수 */
  unlock(): void {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.prefs.bgm * 0.5;
      this.bgmGain.connect(this.ctx.destination);
      this.seGain = this.ctx.createGain();
      this.seGain.gain.value = this.prefs.se;
      this.seGain.connect(this.ctx.destination);
      this.startBgm();
    } catch { /* 오디오 미지원 환경 — 무음 진행 */ }
  }

  setBgm(v: number): void {
    this.prefs.bgm = v;
    this.persist();
    this.bgmGain?.gain.setTargetAtTime(v * 0.5, this.ctx?.currentTime ?? 0, 0.1);
  }

  setSe(v: number): void {
    this.prefs.se = v;
    this.persist();
    this.seGain?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05);
  }

  setVib(on: boolean): void { this.prefs.vib = on; this.persist(); }

  /** 진동 (모바일, 설정 On일 때만) */
  vibrate(ms = 30): void {
    if (this.prefs.vib && 'vibrate' in navigator) navigator.vibrate(ms);
  }

  private persist(): void {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(this.prefs)); } catch { /* ignore */ }
  }

  // ── BGM: 2박마다 펜타토닉 랜덤워크 플럭, 8초마다 부드러운 패드 코드 ──

  private startBgm(): void {
    if (!this.ctx || this.timer !== null) return;
    this.nextNoteAt = this.ctx.currentTime + 0.3;
    this.nextPadAt = this.ctx.currentTime + 0.3;
    this.timer = window.setInterval(() => this.schedule(), 250);
  }

  private schedule(): void {
    const ctx = this.ctx!;
    const ahead = ctx.currentTime + 0.6;
    while (this.nextNoteAt < ahead) {
      // 30% 쉼표로 여백을 준다
      if (Math.random() > 0.3) this.pluck(this.nextNoteAt);
      this.nextNoteAt += 0.9 + Math.random() * 0.6;
    }
    while (this.nextPadAt < ahead) {
      this.pad(this.nextPadAt);
      this.nextPadAt += 8;
    }
  }

  private pluck(at: number): void {
    const ctx = this.ctx!;
    this.melodyIdx = Math.max(0, Math.min(PENTA.length - 1,
      this.melodyIdx + Math.floor(Math.random() * 3) - 1));
    const f = PENTA[this.melodyIdx]!;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.16, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1800;
    osc.connect(g); g.connect(lp); lp.connect(this.bgmGain!);
    osc.start(at); osc.stop(at + 1.5);
  }

  private pad(at: number): void {
    const ctx = this.ctx!;
    const roots = [PENTA[0]!, PENTA[3]!, PENTA[1]!];
    const root = roots[Math.floor(Math.random() * roots.length)]!;
    for (const mult of [1, 1.5, 2]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = root * mult * 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.05, at + 2.5);
      g.gain.linearRampToValueAtTime(0, at + 7.5);
      osc.connect(g); g.connect(this.bgmGain!);
      osc.start(at); osc.stop(at + 8);
    }
  }

  // ── 효과음 합성 ──

  playSe(kind: SeKind): void {
    if (!this.ctx || !this.seGain) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case 'click': this.blip(t, 660, 0.05, 'square', 0.08); break;
      case 'pop': this.blip(t, 880, 0.06, 'sine', 0.12); break;
      case 'note': this.blip(t, PENTA[Math.floor(Math.random() * PENTA.length)]! * 2, 0.3, 'triangle', 0.12); break;
      case 'door': this.blip(t, 140, 0.15, 'sine', 0.2); break;
      case 'coin':
        this.blip(t, 988, 0.07, 'square', 0.1);
        this.blip(t + 0.08, 1319, 0.12, 'square', 0.1);
        break;
      case 'success':
        [523, 659, 784].forEach((f, i) => this.blip(t + i * 0.09, f, 0.14, 'triangle', 0.12));
        break;
    }
  }

  private blip(at: number, freq: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type; osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g); g.connect(this.seGain!);
    osc.start(at); osc.stop(at + dur + 0.05);
  }
}

export const audio = new AudioEngine();

/** 첫 포인터/키 입력에서 한 번만 오디오 잠금 해제 */
export function installAudioUnlock(): void {
  const once = () => {
    audio.unlock();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once);
  window.addEventListener('keydown', once);
}
