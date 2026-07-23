import type { PetMemory } from '../pets/pets';
import type { PetAccessoryId, PetPersonalityId } from '../pets/petProfiles';
import { paintPet, PET_H, PET_W } from './petArt';

export const PET_GROWTH_MEMORY_W = 240;
export const PET_GROWTH_MEMORY_H = 135;

export interface PetGrowthChapter {
  id: PetMemory['id'];
  code: string;
  caption: string;
  palette: readonly [string, string, string, string];
}

export const PET_GROWTH_CHAPTERS: readonly PetGrowthChapter[] = [
  { id: 'family', code: '01 · HOME', caption: '서로의 이름을 처음 기억한 저녁', palette: ['#d5b98a', '#8b6b55', '#6f8570', '#3e3c43'] },
  { id: 'playmate', code: '02 · PLAY', caption: '좋아하는 놀이를 알아챈 오후', palette: ['#e2c88f', '#b96f64', '#718b82', '#453d4d'] },
  { id: 'student', code: '03 · TRICK', caption: '서툰 동작에 함께 웃은 연습', palette: ['#d8c59a', '#6f8292', '#b07a61', '#393f4c'] },
  { id: 'soulmate', code: '04 · ALWAYS', caption: '같은 골목을 오래 걷기로 한 밤', palette: ['#d7bc81', '#85687a', '#597577', '#323646'] },
] as const;

const CHAPTER_BY_ID = new Map(PET_GROWTH_CHAPTERS.map((chapter) => [chapter.id, chapter]));
const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

function backdrop(ctx: CanvasRenderingContext2D, chapter: PetGrowthChapter, personality: PetPersonalityId): void {
  const [paper, warm, cool, ink] = chapter.palette;
  rect(ctx, ink, 0, 0, 240, 135); rect(ctx, paper, 4, 4, 232, 127);
  if (chapter.id === 'family') {
    rect(ctx, warm, 4, 4, 232, 79); rect(ctx, cool, 4, 83, 232, 48);
    rect(ctx, ink, 27, 26, 57, 57); rect(ctx, '#e6c98c', 33, 32, 45, 51); rect(ctx, '#74533e', 48, 55, 14, 28);
    rect(ctx, '#f2d27c', 118, 20, 45, 34); rect(ctx, ink, 122, 24, 37, 27); rect(ctx, '#e8b85d', 132, 34, 17, 9);
    rect(ctx, '#8d6a4c', 174, 69, 39, 27); rect(ctx, '#d5af77', 178, 73, 31, 20);
  } else if (chapter.id === 'playmate') {
    rect(ctx, '#bcaa8b', 4, 4, 232, 61); rect(ctx, paper, 4, 65, 232, 66);
    rect(ctx, cool, 33, 79, 176, 43); rect(ctx, '#506963', 38, 84, 166, 33);
    for (let i = 0; i < 5; i += 1) { rect(ctx, warm, 48 + i * 31, 91 + (i % 2) * 8, 8, 8); rect(ctx, paper, 50 + i * 31, 93 + (i % 2) * 8, 4, 4); }
    rect(ctx, '#b16d64', 180, 72, 16, 16); rect(ctx, ink, 184, 76, 8, 8);
  } else if (chapter.id === 'student') {
    rect(ctx, cool, 4, 4, 232, 73); rect(ctx, '#b9a983', 4, 77, 232, 54);
    rect(ctx, ink, 32, 80, 176, 10); rect(ctx, warm, 39, 90, 162, 27);
    for (let x = 22; x < 230; x += 34) { rect(ctx, '#f2d37b', x, 26 + (x % 17), 3, 8); rect(ctx, '#f2d37b', x - 3, 29 + (x % 17), 9, 3); }
    rect(ctx, paper, 169, 28, 45, 31); rect(ctx, ink, 174, 33, 35, 21); rect(ctx, warm, 183, 40, 17, 7);
  } else {
    rect(ctx, '#273448', 4, 4, 232, 82); rect(ctx, cool, 4, 86, 232, 45);
    rect(ctx, '#576675', 4, 58, 232, 28); rect(ctx, '#d6b66c', 25, 37, 3, 3); rect(ctx, '#f0d487', 58, 22, 2, 2); rect(ctx, '#e7c77a', 197, 31, 3, 3);
    rect(ctx, ink, 18, 80, 204, 6); for (let x = 24; x < 220; x += 23) rect(ctx, ink, x, 73, 4, 33);
    rect(ctx, '#e5c06d', 182, 14, 21, 21); rect(ctx, '#efd58e', 187, 17, 15, 15);
  }
  // 선택한 성격을 작은 우표 표시로 남긴다.
  rect(ctx, paper, 10, 10, 36, 19); rect(ctx, ink, 13, 13, 30, 13);
  ctx.fillStyle = paper; ctx.font = '900 8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(personality.slice(0, 3).toUpperCase(), 28, 19.5);
}

export function paintPetGrowthMemory(
  canvas: HTMLCanvasElement,
  memory: PetMemory,
  petId: string,
  accessory: PetAccessoryId,
  personality: PetPersonalityId,
): void {
  canvas.width = PET_GROWTH_MEMORY_W; canvas.height = PET_GROWTH_MEMORY_H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const chapter = CHAPTER_BY_ID.get(memory.id) ?? PET_GROWTH_CHAPTERS[0]!;
  backdrop(ctx, chapter, personality);
  const petCanvas = document.createElement('canvas'); petCanvas.width = PET_W; petCanvas.height = PET_H;
  const petContext = petCanvas.getContext('2d'); if (petContext) paintPet(petContext, petId, accessory);
  const x = chapter.id === 'family' ? 92 : chapter.id === 'playmate' ? 95 : chapter.id === 'student' ? 83 : 101;
  const y = chapter.id === 'soulmate' ? 53 : 50;
  ctx.fillStyle = 'rgba(28,25,25,.22)'; ctx.beginPath(); ctx.ellipse(x + 28, y + 55, 31, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(petCanvas, x, y, 58, 58);
  if (chapter.id === 'soulmate') {
    // 플레이어는 외형을 특정하지 않는 작은 동행 실루엣으로만 표현한다.
    rect(ctx, '#34303a', 72, 57, 16, 37); rect(ctx, '#c69470', 74, 48, 12, 12); rect(ctx, '#596d73', 71, 65, 18, 22);
  }
  rect(ctx, 'rgba(31,29,30,.82)', 8, 108, 224, 19);
  ctx.fillStyle = '#f1e5cf'; ctx.font = '900 8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(chapter.code, 14, 117.5);
  ctx.textAlign = 'right'; ctx.fillText(memory.unlocked ? 'ARCHIVED' : 'NEXT MEMORY', 226, 117.5);
  if (!memory.unlocked) {
    ctx.fillStyle = 'rgba(43,42,46,.58)'; ctx.fillRect(4, 4, 232, 104);
    for (let x2 = -120; x2 < 260; x2 += 18) { ctx.fillStyle = 'rgba(239,227,205,.1)'; ctx.fillRect(x2, 4, 5, 104); ctx.setTransform(1, 0, .35, 1, 0, 0); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
