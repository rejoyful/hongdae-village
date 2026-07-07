import { worldToTile } from '../world/grid';

export interface CameraView { scrollX: number; scrollY: number; zoom: number }

/** 화면(캔버스) 좌표 → 월드 → 타일 좌표. 클릭 상호작용·배치의 공용 진입점. */
export function screenToTile(screenX: number, screenY: number, cam: CameraView): { tx: number; ty: number } {
  const worldX = cam.scrollX + screenX / cam.zoom;
  const worldY = cam.scrollY + screenY / cam.zoom;
  return worldToTile(worldX, worldY);
}
