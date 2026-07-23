import './styles.css';
import { clearLegacyGameData, type DesignerProfile } from './core/profile';
import { mountLogin } from './login';
import { EmptyWorld } from './world';

const root = getGameRoot();

try {
  clearLegacyGameData(window.localStorage);
} catch {
  // 저장소 접근이 막혀도 버전 0 세계는 정상적으로 시작한다.
}

let world: EmptyWorld | null = null;

function showLogin(): void {
  world?.destroy();
  world = null;
  mountLogin(root, {
    onJoin: showWorld,
  });
}

function showWorld(profile: DesignerProfile): void {
  world?.destroy();
  world = new EmptyWorld(root, {
    profile,
    onExit: showLogin,
  });
}

showLogin();

function getGameRoot(): HTMLElement {
  const element = document.querySelector<HTMLElement>('#game');
  if (!element) throw new Error('게임 루트를 찾을 수 없습니다.');
  return element;
}
