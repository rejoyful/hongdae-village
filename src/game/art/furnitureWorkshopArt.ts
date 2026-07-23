import type Phaser from 'phaser';
import { ensureFurniture } from './roomArt';

const PREVIEW_W = 96;
const PREVIEW_H = 72;
const sceneCache = new WeakMap<Phaser.Scene, Map<string, string>>();

/** 방에서 실제 사용하는 가구 텍스처를 DOM 작업일지용 투명 픽셀 미리보기로 굽는다. */
export function furnitureWorkshopPreview(scene: Phaser.Scene, itemId: string): string | null {
  let cache = sceneCache.get(scene);
  if (!cache) { cache = new Map(); sceneCache.set(scene, cache); }
  const cached = cache.get(itemId);
  if (cached) return cached;
  const key = ensureFurniture(scene, itemId, 0);
  if (!scene.textures.exists(key)) return null;
  const source = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  if (!source.width || !source.height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = PREVIEW_W; canvas.height = PREVIEW_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const scale = Math.min((PREVIEW_W - 10) / source.width, (PREVIEW_H - 8) / source.height);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  ctx.drawImage(source, Math.round((PREVIEW_W - width) / 2), PREVIEW_H - height - 3, width, height);
  const dataUrl = canvas.toDataURL('image/png');
  cache.set(itemId, dataUrl);
  return dataUrl;
}
