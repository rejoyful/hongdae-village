import Phaser from 'phaser';
import './ui/overlay.css';
import { installAudioUnlock } from './game/audio';
import { RoomScene } from './game/scenes/RoomScene';
import { createSupabase } from './supabaseClient';
import { ensureProfile, showLoginPreview } from './ui/loginPanel';
import { SupabaseAdapter } from './net/SupabaseAdapter';
import type { NetworkAdapter, PeerState } from './net/NetworkAdapter';
import { GameHud } from './ui/gameHud';
import { QuestStore } from './game/questProgress';
import { TreasureStore } from './game/treasure/treasureStore';
import { GardenStore } from './game/garden/gardenStore';
import { CookingStore } from './game/cooking/cookingStore';
import { FishingStore } from './game/fishing/fishingStore';
import { HomeAquariumStore } from './game/home/homeAquariumStore';
import { VillageRequestStore } from './game/requests/villageRequests';
import { FurnitureReformStore } from './game/home/furnitureReform';
import { FestivalArchiveStore } from './game/events/festivalArchive';
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
  if (import.meta.env.DEV && params.has('title-preview')) { showLoginPreview(); return; }
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
  game.registry.set('treasure', new TreasureStore(peer.userId));
  game.registry.set('garden', new GardenStore(peer.userId));
  game.registry.set('cooking', new CookingStore(peer.userId));
  game.registry.set('fishing', new FishingStore(peer.userId));
  game.registry.set('homeAquarium', new HomeAquariumStore(peer.userId));
  game.registry.set('requests', new VillageRequestStore(peer.userId));
  game.registry.set('furnitureReform', new FurnitureReformStore(peer.userId));
  game.registry.set('festivals', new FestivalArchiveStore(peer.userId));
  const hud = new GameHud({
    nickname: peer.nickname,
    onLogout: sb ? () => { void sb.auth.signOut().then(() => location.reload()); } : undefined,
    onResetData: () => {
      try {
        localStorage.removeItem(`hv-dex-${peer.userId}`);
        localStorage.removeItem(`hv-collection-shelf-${peer.userId}`);
        localStorage.removeItem(`hv-trust-${peer.userId}`);
        localStorage.removeItem(`hv-quests-${peer.userId}`);
        localStorage.removeItem(`hv-home-visits-${peer.userId}`);
        localStorage.removeItem(`hv-garden-${peer.userId}`);
        localStorage.removeItem(`hv-cooking-${peer.userId}`);
        localStorage.removeItem(`hv-fishing-${peer.userId}`);
        localStorage.removeItem(`hv-home-aquarium-${peer.userId}`);
        localStorage.removeItem(`hv-lookbook-${peer.userId}`);
        localStorage.removeItem(`hv-character-zine-${peer.userId}`);
        localStorage.removeItem(`hv-taste-showcase-${peer.userId}`);
        localStorage.removeItem(`hv-hobby-clubs-${peer.userId}`);
        localStorage.removeItem(`hv-community-projects-${peer.userId}`);
        localStorage.removeItem(`hv-shared-village-project-v1:${peer.userId}`);
        localStorage.removeItem(`hv-neighborhood-tours-${peer.userId}`);
        localStorage.removeItem(`hv-neighborhood-museum-${peer.userId}`);
        localStorage.removeItem(`hv-pet-outings-${peer.userId}`);
        localStorage.removeItem(`hv-pet-signals-v1:${peer.userId}`);
        localStorage.removeItem(`hv-pet-performances-v1:${peer.userId}`);
        localStorage.removeItem(`hv-pet-style-studio-v1:${peer.userId}`);
        localStorage.removeItem(`hv-session-planner-v1:${peer.userId}`);
        localStorage.removeItem(`hv-starter-compass-preference-${peer.userId}`);
        localStorage.removeItem(`hv-starter-concierge-v1:${peer.userId}`);
        localStorage.removeItem(`hv-fan-merch-v1:${peer.userId}`);
        localStorage.removeItem(`hv-fan-room-v1:${peer.userId}`);
        localStorage.removeItem(`hv-village-requests-${peer.userId}`);
        localStorage.removeItem(`hv-furniture-reforms-${peer.userId}`);
        localStorage.removeItem(`hv-festival-archive-${peer.userId}`);
        localStorage.removeItem(`hv-photo-album-${peer.userId}`);
        localStorage.removeItem(`hv-life-specialty-v1:${peer.userId}`);
        localStorage.removeItem(`hv-daily-invitations-v1:${peer.userId}`);
        localStorage.removeItem(`hv-neighbor-cheers-v1:${peer.userId}`);
        localStorage.removeItem(`hv-neighbor-home-tours-v1:${peer.userId}`);
        localStorage.removeItem(`hv-home-guestbook-v1:${peer.userId}`);
        localStorage.removeItem(`hv-village-chronicle-v1:${peer.userId}`);
        localStorage.removeItem(`hv-village-level-memories-v1:${peer.userId}`);
        localStorage.removeItem(`hv-adventure-path-passport-${peer.userId}`);
        localStorage.removeItem(`hv-resident-letters-${peer.userId}`);
        localStorage.removeItem(`hv-resident-fanbook-${peer.userId}`);
        localStorage.removeItem(`hv-adventure-role-${peer.userId}`);
        localStorage.removeItem(`hv-neighborhood-market-${peer.userId}`);
        localStorage.removeItem(`hv-neighborhood-atmospheres-v1:${peer.userId}`);
        localStorage.removeItem(`hv-home-moodboards-${peer.userId}`);
        localStorage.removeItem(`hv-quest-milestone-history-${peer.userId}`);
        for (let roomId = 1; roomId <= 10; roomId += 1) localStorage.removeItem(`hv-home-layouts-v1:${peer.userId}:${roomId}`);
        localStorage.removeItem(`hv-battle-v1-${peer.userId}`);
      } catch { /* ignore */ }
      location.reload();
    },
  });
  hud.setHearts(questStore.doneCount(), 5);
  game.registry.set('hud', hud);

  // 기본 공개 주소는 실제 저장·HUD·퀘스트·집·펫을 공유하는 아이소메트릭 월드다.
  // 순수 투영 실험실은 `?iso-lab&offline`로 계속 독립 검증한다.
  if (params.has('iso-lab')) {
    const { IsometricPreviewScene } = await import('./game/scenes/IsometricPreviewScene');
    game.scene.add('iso-preview', IsometricPreviewScene, true, { peer });
    return;
  }

  const { IsometricVillageScene } = await import('./game/scenes/IsometricVillageScene');
  game.scene.add('room', RoomScene, false);
  const devRoom = params.get('room');
  game.scene.add('iso-village', IsometricVillageScene, !devRoom, { peer, adapter });
  if (devRoom) {
    const house = params.get('house');
    const houseType = ['banjiha', 'oneroom', 'villa', 'apt', 'house'].includes(house ?? '')
      ? house
      : undefined;
    game.scene.start('room', {
      roomId: Number(devRoom),
      isOwner: true,
      peer,
      adapter,
      houseType,
      returnScene: 'iso-village',
    });
  }
}

void boot();
