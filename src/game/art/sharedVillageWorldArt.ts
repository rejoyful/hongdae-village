import Phaser from 'phaser';
import type { SharedProjectView } from '../projects/sharedVillageProject';
import { isoDepth, projectIso } from '../world/isometric';

/** 서버 공동 진척을 월드에 투영한다. 개인 프로젝트 표식과 겹치지 않게 파빌리온 동쪽에 둔다. */
export function drawIsoSharedVillageProject(
  scene: Phaser.Scene, tx: number, ty: number, view: SharedProjectView,
): Phaser.GameObjects.Container {
  const p = projectIso(tx + 1.9, ty + 0.15);
  const g = scene.add.graphics();
  const stage = view.stage;
  g.fillStyle(0x252237, .24).fillEllipse(0, 3, 58, 18);
  g.fillStyle(0x574838, 1).fillRect(-28, -4, 56, 6);
  if (stage >= 1) {
    g.lineStyle(1, 0xb8a77b, .85).strokePoints([
      new Phaser.Geom.Point(0, -16), new Phaser.Geom.Point(18, -7),
      new Phaser.Geom.Point(0, 2), new Phaser.Geom.Point(-18, -7),
    ], true);
  }
  if (stage >= 2) {
    for (const x of [-23, 18]) {
      g.fillStyle(0x40513b, 1).fillRect(x, -10, 7, 8);
      g.fillStyle(0x78906a, 1).fillRect(x + 2, -16, 5, 8);
    }
  }
  if (stage >= 3) {
    g.fillStyle(0x8a684a, 1).fillRect(-14, -13, 28, 5);
    g.fillStyle(0x4a382c, 1).fillRect(-11, -8, 3, 10).fillRect(8, -8, 3, 10);
  }
  if (stage >= 4) {
    for (const x of [-24, 0, 24]) {
      g.fillStyle(0x4c3c31, 1).fillRect(x, -29, 2, 20);
      g.fillStyle(0xf2d27c, 1).fillRect(x - 2, -32, 6, 5);
      g.fillStyle(0xe9ba58, .18).fillCircle(x + 1, -30, 9);
    }
  }
  if (stage >= 5) {
    g.fillStyle(0xd8c692, 1).fillRect(-6, -28, 12, 9);
    g.fillStyle(0x836c4c, 1).fillRect(-8, -20, 16, 3);
  }
  const label = scene.add.text(0, -47, `LIVE · 밤정원 ${view.chapterProgress}/${view.chapterGoal}`, {
    fontFamily: '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    fontSize: '8px', color: '#fff0bd', backgroundColor: '#28243bdd',
    padding: { x: 5, y: 2 }, resolution: 2,
  }).setOrigin(.5);
  return scene.add.container(p.x, p.y, [g, label])
    .setDepth(isoDepth({ tx: tx + 1, ty, w: 1, h: 1 }, 76));
}
