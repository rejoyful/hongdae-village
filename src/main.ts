import Phaser from 'phaser';
import './ui/overlay.css';
import { StreetScene } from './game/scenes/StreetScene';
import { createSupabase } from './supabaseClient';
import { ensureProfile } from './ui/loginPanel';
import { SupabaseAdapter } from './net/SupabaseAdapter';
import type { NetworkAdapter, PeerState } from './net/NetworkAdapter';

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1713',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
  });
}

async function boot(): Promise<void> {
  const game = createGame('game');

  // 개발 모드 전용 디버그 훅 (콘솔·자동화 검증에서 게임 상태 접근용)
  if (import.meta.env.DEV) {
    (window as unknown as { __game?: Phaser.Game }).__game = game;
  }

  let peer: PeerState;
  let adapter: NetworkAdapter | null = null;
  try {
    const sb = createSupabase();
    peer = await ensureProfile(sb);
    adapter = new SupabaseAdapter(sb);
  } catch (err) {
    // Supabase 미설정·장애 시에도 게임은 혼자 모드로 계속 (스펙 §7)
    console.warn('[홍대마을] 오프라인 모드로 시작:', err);
    peer = { userId: 'offline', nickname: '게스트', color: 'e8c9a0' };
  }

  game.scene.add('street', StreetScene, true, { peer, adapter });
}

void boot();
