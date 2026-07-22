import Phaser from 'phaser';
import './ui/overlay.css';
import { installAudioUnlock } from './game/audio';
import { StreetScene } from './game/scenes/StreetScene';
import { RoomScene } from './game/scenes/RoomScene';
import { InteriorScene } from './game/scenes/InteriorScene';
import { CompanyScene } from './game/scenes/CompanyScene';
import { createSupabase } from './supabaseClient';
import { ensureProfile } from './ui/loginPanel';
import { SupabaseAdapter } from './net/SupabaseAdapter';
import type { NetworkAdapter, PeerState } from './net/NetworkAdapter';
import { GameHud } from './ui/gameHud';
import { QuestStore } from './game/questProgress';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  installAudioUnlock(); // 첫 입력에서 BGM·효과음 시작 (오토플레이 정책)
  const game = createGame('game');

  // 개발 모드 전용 디버그 훅 (콘솔·자동화 검증에서 게임 상태 접근용)
  if (import.meta.env.DEV) {
    (window as unknown as { __game?: Phaser.Game }).__game = game;
  }

  const params = new URLSearchParams(location.search);
  let peer: PeerState;
  let adapter: NetworkAdapter | null = null;
  try {
    if (params.has('offline')) throw new Error('오프라인 모드 강제 (?offline)');
    const sb = createSupabase();
    peer = await ensureProfile(sb);
    adapter = new SupabaseAdapter(sb);
    game.registry.set('sb', sb);
  } catch (err) {
    // Supabase 미설정·장애 시에도 게임은 혼자 모드로 계속 (스펙 §7)
    console.warn('[홍대마을] 오프라인 모드로 시작:', err);
    const { DEFAULT_APPEARANCE } = await import('./game/art/appearance');
    peer = { userId: 'offline', nickname: '게스트', color: 'e8c9a0', appearance: DEFAULT_APPEARANCE };
  }

  // 세션 싱글턴: 퀘스트 진행 저장소 + 게임 HUD (씬 전환에도 유지, P2-1·P2-3)
  const sb = game.registry.get('sb') as SupabaseClient | undefined;
  const questStore = new QuestStore(peer.userId);
  game.registry.set('quests', questStore);
  const hud = new GameHud({
    nickname: peer.nickname,
    onLogout: sb ? () => { void sb.auth.signOut().then(() => location.reload()); } : undefined,
    onResetData: () => {
      try {
        localStorage.removeItem(`hv-dex-${peer.userId}`);
        localStorage.removeItem(`hv-trust-${peer.userId}`);
        localStorage.removeItem(`hv-quests-${peer.userId}`);
      } catch { /* ignore */ }
      location.reload();
    },
  });
  hud.setHearts(questStore.doneCount(), 5);
  game.registry.set('hud', hud);

  game.scene.add('room', RoomScene, false);
  game.scene.add('interior', InteriorScene, false);
  game.scene.add('company', CompanyScene, false);
  const devRoom = params.get('room');
  if (devRoom) {
    game.scene.add('street', StreetScene, false);
    game.scene.start('room', { roomId: Number(devRoom), isOwner: true, peer, adapter });
  } else {
    game.scene.add('street', StreetScene, true, { peer, adapter });
  }
}

void boot();
