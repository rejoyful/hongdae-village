import type { Appearance } from './appearance';
import { CHAR_H, CHAR_W, paintCharacterFrame } from './characterArt';
import { PET_H, PET_W, paintPet } from './petArt';
import type { PetAccessoryId } from '../pets/petProfiles';
import type { HobbyClubId, HobbyClubRoomDef } from '../clubs/hobbyClubs';

export const HOBBY_CLUB_ROOM_ART_W = 360;
export const HOBBY_CLUB_ROOM_ART_H = 210;

export interface HobbyClubRoomPet {
  speciesId: string;
  accessory: PetAccessoryId;
}

const rect = (
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
};

const polygon = (context: CanvasRenderingContext2D, color: string, points: Array<[number, number]>) => {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
  context.fill();
};

const line = (
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  ...points: Array<[number, number]>
) => {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(points[0]![0], points[0]![1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.stroke();
};

const drawBadge = (context: CanvasRenderingContext2D, color: string, light: string) => {
  rect(context, '#28242d', 50, 57, 18, 18);
  rect(context, color, 52, 59, 14, 14);
  rect(context, light, 56, 62, 6, 5);
  rect(context, '#28242d', 55, 73, 3, 7);
  rect(context, '#28242d', 62, 73, 3, 7);
};

const drawBanner = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  line(context, room.palette[0], 2, [93, 45], [167, 45]);
  polygon(context, room.palette[2], [[96, 47], [164, 47], [157, 85], [130, 76], [103, 85]]);
  rect(context, room.palette[4], 108, 56, 44, 4);
  rect(context, room.palette[1], 116, 65, 28, 4);
};

const drawLight = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  line(context, room.palette[0], 2, [250, 38], [250, 67]);
  polygon(context, room.palette[2], [[237, 67], [263, 67], [270, 79], [230, 79]]);
  polygon(context, `${room.palette[4]}66`, [[232, 80], [268, 80], [289, 145], [211, 145]]);
  rect(context, room.palette[4], 239, 75, 22, 5);
};

const drawAlbum = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  polygon(context, '#24222a', [[275, 138], [306, 128], [329, 140], [298, 151]]);
  polygon(context, room.palette[2], [[277, 136], [305, 127], [325, 137], [297, 147]]);
  line(context, room.palette[4], 2, [301, 129], [298, 146]);
  rect(context, room.palette[4], 288, 134, 8, 3);
};

const drawStyleProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  line(context, room.palette[0], 3, [75, 94], [75, 143], [104, 143], [104, 94]);
  line(context, room.palette[4], 2, [73, 101], [106, 101]);
  polygon(context, room.palette[2], [[79, 102], [91, 98], [102, 104], [99, 127], [82, 127]]);
  rect(context, room.palette[1], 81, 112, 19, 5);
  rect(context, room.palette[3], 88, 90, 5, 10);
};

const drawHomeProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  polygon(context, room.palette[1], [[67, 119], [99, 108], [123, 121], [90, 132]]);
  polygon(context, room.palette[0], [[67, 119], [90, 132], [90, 145], [67, 132]]);
  polygon(context, room.palette[2], [[90, 132], [123, 121], [123, 134], [90, 145]]);
  rect(context, room.palette[4], 83, 116, 14, 8);
  rect(context, room.palette[3], 102, 114, 8, 6);
};

const drawCompanionProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  polygon(context, room.palette[1], [[66, 124], [96, 114], [122, 127], [91, 138]]);
  polygon(context, room.palette[2], [[71, 121], [95, 113], [115, 124], [91, 133]]);
  rect(context, room.palette[4], 84, 119, 6, 5);
  rect(context, room.palette[4], 98, 119, 6, 5);
  rect(context, room.palette[4], 91, 125, 6, 6);
};

const drawTableProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  polygon(context, room.palette[3], [[65, 112], [103, 99], [132, 114], [94, 128]]);
  polygon(context, room.palette[0], [[65, 112], [94, 128], [94, 139], [65, 123]]);
  polygon(context, room.palette[1], [[94, 128], [132, 114], [132, 125], [94, 139]]);
  for (const [x, y, color] of [[82, 110, room.palette[4]], [98, 106, room.palette[2]], [112, 113, room.palette[4]]] as const) {
    polygon(context, '#29252a', [[x - 5, y], [x, y - 3], [x + 5, y], [x, y + 3]]);
    rect(context, color, x - 3, y - 2, 6, 3);
  }
};

const drawWaterProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  rect(context, room.palette[0], 65, 101, 63, 40);
  rect(context, '#8bc6c9', 69, 105, 55, 31);
  rect(context, '#4c8795', 69, 124, 55, 12);
  polygon(context, room.palette[4], [[80, 117], [87, 113], [94, 117], [87, 120]]);
  polygon(context, room.palette[3], [[103, 124], [110, 119], [118, 124], [110, 128]]);
  rect(context, '#d6c394', 71, 132, 51, 4);
};

const drawStageProps = (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => {
  polygon(context, room.palette[1], [[63, 119], [103, 105], [132, 120], [92, 135]]);
  polygon(context, room.palette[0], [[63, 119], [92, 135], [92, 143], [63, 128]]);
  polygon(context, room.palette[2], [[92, 135], [132, 120], [132, 128], [92, 143]]);
  rect(context, room.palette[4], 82, 113, 29, 3);
  line(context, room.palette[4], 2, [99, 108], [105, 98], [111, 100]);
  rect(context, room.palette[3], 109, 96, 4, 7);
};

const PROP_DRAWERS: Record<HobbyClubId, (context: CanvasRenderingContext2D, room: HobbyClubRoomDef) => void> = {
  style: drawStyleProps,
  home: drawHomeProps,
  companion: drawCompanionProps,
  table: drawTableProps,
  water: drawWaterProps,
  stage: drawStageProps,
};

export function paintHobbyClubRoomArt(
  canvas: HTMLCanvasElement,
  room: HobbyClubRoomDef,
  rank: number,
  appearance: Appearance,
  pet: HobbyClubRoomPet | null = null,
  replayCount = 0,
): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const [dark, mid, accent, warm, paper] = room.palette;
  rect(context, dark, 0, 0, HOBBY_CLUB_ROOM_ART_W, HOBBY_CLUB_ROOM_ART_H);
  rect(context, mid, 0, 0, HOBBY_CLUB_ROOM_ART_W, 29);
  for (let x = 0; x < HOBBY_CLUB_ROOM_ART_W; x += 24) rect(context, `${paper}18`, x, 27, 13, 2);

  // 아이소메트릭 벽과 바닥
  polygon(context, paper, [[25, 45], [181, 8], [181, 151], [25, 188]]);
  polygon(context, '#d4c6aa', [[181, 8], [337, 45], [337, 188], [181, 151]]);
  polygon(context, '#8a796a', [[25, 188], [181, 151], [337, 188], [181, 226]]);
  for (let offset = -80; offset < 260; offset += 24) {
    line(context, '#aa9985', 1, [25 + offset, 188], [181 + offset, 226]);
    line(context, '#aa9985', 1, [337 - offset, 188], [181 - offset, 226]);
  }
  line(context, dark, 3, [25, 45], [181, 8], [337, 45]);
  line(context, dark, 3, [25, 45], [25, 188], [181, 226], [337, 188], [337, 45]);
  line(context, '#796b60', 2, [181, 9], [181, 151]);

  // 창과 게시물
  rect(context, dark, 273, 50, 42, 46);
  rect(context, '#6d91a0', 277, 54, 34, 38);
  rect(context, '#b9d6cf', 279, 56, 14, 14);
  rect(context, '#537284', 295, 56, 14, 14);
  rect(context, '#435c6c', 279, 72, 14, 18);
  rect(context, '#7497a0', 295, 72, 14, 18);
  line(context, dark, 2, [294, 54], [294, 92]);
  line(context, dark, 2, [277, 71], [311, 71]);
  rect(context, accent, 40, 91, 18, 25);
  rect(context, warm, 43, 94, 12, 4);
  rect(context, paper, 43, 101, 9, 2);
  rect(context, paper, 43, 106, 11, 2);

  if (rank >= 1) drawBadge(context, accent, paper);
  if (rank >= 2) drawBanner(context, room);
  if (rank >= 3) drawLight(context, room);
  if (rank >= 4) PROP_DRAWERS[room.clubId](context, room);
  if (rank >= 5) drawAlbum(context, room);

  // 중앙 모임 러그
  polygon(context, dark, [[139, 144], [195, 126], [244, 150], [187, 170]]);
  polygon(context, accent, [[144, 142], [195, 126], [238, 148], [187, 165]]);
  polygon(context, mid, [[158, 141], [194, 130], [224, 146], [187, 157]]);
  rect(context, warm, 185, 142, 7, 4);

  // 저장된 실제 플레이어 외형
  const character = document.createElement('canvas');
  character.width = CHAR_W;
  character.height = CHAR_H;
  const characterContext = character.getContext('2d');
  if (characterContext) {
    paintCharacterFrame(characterContext, appearance, 0, replayCount % 2);
    context.drawImage(character, 0, 0, CHAR_W, CHAR_H, 166, 86, CHAR_W * 1.65, CHAR_H * 1.65);
  }

  if (pet) {
    const petCanvas = document.createElement('canvas');
    petCanvas.width = PET_W;
    petCanvas.height = PET_H;
    const petContext = petCanvas.getContext('2d');
    if (petContext) {
      paintPet(petContext, pet.speciesId, pet.accessory);
      context.drawImage(petCanvas, 228, 120, PET_W * 1.35, PET_H * 1.35);
    }
  }

  // 리플레이 횟수는 작은 반짝임으로만 표현
  const sparkleCount = Math.min(6, replayCount);
  for (let index = 0; index < sparkleCount; index += 1) {
    const x = 146 + ((index * 31) % 129);
    const y = 67 + ((index * 17) % 45);
    rect(context, paper, x, y, 2, 6);
    rect(context, paper, x - 2, y + 2, 6, 2);
  }

  rect(context, dark, 11, 11, 92, 20);
  rect(context, accent, 14, 14, 5, 14);
  context.fillStyle = paper;
  context.font = 'bold 9px monospace';
  context.textBaseline = 'top';
  context.fillText(`${room.clubId.toUpperCase()} ROOM · ${rank}/5`, 24, 17);
}
