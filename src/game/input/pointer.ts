import { worldToTile } from '../world/grid';

/** Phaser 3 카메라 뷰 상태. 줌이 뷰포트 중심 기준이라 width/height가 필요하다. */
export interface CameraView { scrollX: number; scrollY: number; zoom: number; width: number; height: number }

/**
 * 화면(캔버스) 좌표 → 월드 → 타일 좌표. 클릭 상호작용·배치의 공용 진입점.
 * Phaser는 뷰포트 중심을 기준으로 줌하므로 (뷰포트/2)(1-1/zoom) 항을 보정한다
 * — Camera.getWorldPoint의 무회전·기본 원점(0.5) 케이스와 동일한 역변환.
 */
export function screenToTile(screenX: number, screenY: number, cam: CameraView): { tx: number; ty: number } {
  const worldX = cam.scrollX + (cam.width / 2) * (1 - 1 / cam.zoom) + screenX / cam.zoom;
  const worldY = cam.scrollY + (cam.height / 2) * (1 - 1 / cam.zoom) + screenY / cam.zoom;
  return worldToTile(worldX, worldY);
}
