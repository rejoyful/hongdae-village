import { buildScore, LOOP_LEN, type ScoreNote } from './music';

/**
 * 오디오 엔진 (스펙 §2 "차분한 힐링 음악") — 외부 파일 없이 WebAudio로
 * 작곡된 로파이 루프(music.ts 스코어)와 효과음을 합성한다.
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
  private score: ScoreNote[] = [];
  private loopStart = 0;
  private scheduledUntil = 0;
  prefs: AudioPrefs = loadPrefs();

  /** 첫 사용자 제스처에서 호출 — 오토플레이 정책 준수 */
  unlock(): void {
    if (this.ctx) {
      // iOS Safari 등: 컨텍스트가 suspended로 남을 수 있어 제스처마다 재개 시도 (P3-4)
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      // 생성 직후 suspended면 즉시 재개 (iOS Safari 안전망)
      if (this.ctx.state === 'suspended') void this.ctx.resume();
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

  /** BGM이 실제로 재생 가능한 상태(running)인지 — unlock 재시도 종료 판단용 */
  isRunning(): boolean { return this.ctx?.state === 'running'; }

  setVib(on: boolean): void { this.prefs.vib = on; this.persist(); }

  /** 진동 (모바일, 설정 On일 때만) */
  vibrate(pattern: number | number[] = 30): void {
    if (this.prefs.vib && 'vibrate' in navigator) navigator.vibrate(pattern);
  }

  private persist(): void {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(this.prefs)); } catch { /* ignore */ }
  }

  // ── BGM: music.ts의 작곡된 8마디 루프를 룩어헤드 스케줄러로 재생 ──

  private startBgm(): void {
    if (!this.ctx || this.timer !== null) return;
    this.score = buildScore();
    this.loopStart = this.ctx.currentTime + 0.25;
    this.scheduledUntil = this.loopStart;
    this.timer = window.setInterval(() => this.schedule(), 300);
    this.schedule();
  }

  private schedule(): void {
    const ctx = this.ctx!;
    const ahead = ctx.currentTime + 1.2;
    while (this.scheduledUntil < ahead) {
      const winStart = this.scheduledUntil;
      const winEnd = Math.min(ahead, winStart + 1.2);
      for (const n of this.score) {
        // 루프 반복 고려 — 이 창에 걸리는 반복 회차의 노트만 스케줄
        const loopIdx = Math.floor((winStart - this.loopStart) / LOOP_LEN);
        for (const k of [loopIdx, loopIdx + 1]) {
          const at = this.loopStart + k * LOOP_LEN + n.t;
          if (at >= winStart && at < winEnd) this.playNote(n, at);
        }
      }
      this.scheduledUntil = winEnd;
    }
  }

  private playNote(n: ScoreNote, at: number): void {
    const ctx = this.ctx!;
    if (n.voice === 'hat') { // 브러시 햇 — 필터드 노이즈 한 톨
      const len = Math.floor(ctx.sampleRate * 0.04);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 6000;
      const g = ctx.createGain();
      g.gain.value = 0.05 * n.vel;
      src.connect(hp); hp.connect(g); g.connect(this.bgmGain!);
      src.start(at);
      return;
    }
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    let peak = 0.1;
    switch (n.voice) {
      case 'bass':
        osc.type = 'sine'; lp.frequency.value = 400; peak = 0.22 * n.vel; break;
      case 'pluck':
        osc.type = 'triangle'; lp.frequency.value = 2200; peak = 0.10 * n.vel; break;
      case 'lead':
        osc.type = 'sine'; lp.frequency.value = 3200; peak = 0.15 * n.vel; break;
      case 'chime':
        osc.type = 'sine'; lp.frequency.value = 6000; peak = 0.08 * n.vel; break;
    }
    osc.frequency.value = n.f;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + (n.voice === 'bass' ? 0.03 : 0.015));
    g.gain.exponentialRampToValueAtTime(0.001, at + n.dur);
    osc.connect(g); g.connect(lp); lp.connect(this.bgmGain!);
    // 리드는 살짝 비브라토 — 사람 손맛
    if (n.voice === 'lead') {
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 5.2; lfoG.gain.value = 3;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      lfo.start(at); lfo.stop(at + n.dur);
    }
    osc.start(at); osc.stop(at + n.dur + 0.1);
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

/**
 * 사용자 입력에서 오디오 잠금 해제. 컨텍스트가 정상 running이 되면 리스너 제거.
 * iOS Safari는 첫 제스처 후에도 suspended로 남을 수 있어 running 확인 전까지 계속 시도 (P3-4).
 */
export function installAudioUnlock(): void {
  const tryUnlock = () => {
    audio.unlock();
    if (audio.isRunning()) {
      window.removeEventListener('pointerdown', tryUnlock);
      window.removeEventListener('keydown', tryUnlock);
      window.removeEventListener('touchend', tryUnlock);
    }
  };
  window.addEventListener('pointerdown', tryUnlock);
  window.addEventListener('keydown', tryUnlock);
  window.addEventListener('touchend', tryUnlock);
}
