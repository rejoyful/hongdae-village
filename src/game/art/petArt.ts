import type Phaser from 'phaser';
import { makeTexture, px, type Px } from './pixelCanvas';
import { type PetSpecies, petById } from '../pets/pets';
import { isPetAccessoryId, type PetAccessoryId } from '../pets/petProfiles';

export const PET_W = 20;
export const PET_H = 20;

/** 오른쪽을 보는 16×16 펫 (좌향은 스프라이트 flipX). 종별 귀·꼬리·색으로 구분 */
function drawPet(d: Px, ox: number, oy: number, s: PetSpecies): void {
  const OUT = 0x2e2620;
  // 그림자
  d.rect(ox + 3, oy + 15, 11, 1, 0x1a1713, 0.2);

  // 꼬리 (뒤=왼쪽)
  if (s.tail === 'curl') { d.rect(ox + 1, oy + 8, 2, 3, s.body); d.rect(ox + 1, oy + 7, 2, 1, s.body); }
  else if (s.tail === 'puff') d.rect(ox + 1, oy + 9, 3, 3, s.belly);
  else if (s.tail === 'long') { d.rect(ox + 0, oy + 8, 3, 1, s.body); d.rect(ox + 0, oy + 6, 1, 3, s.body); }
  else if (s.tail === 'longtip') { d.rect(ox + 0, oy + 8, 3, 1, s.body); d.rect(ox + 0, oy + 6, 1, 3, s.body); d.rect(ox + 0, oy + 6, 1, 1, 0xf4ead6); }

  // 다리
  d.rect(ox + 4, oy + 13, 2, 2, s.dark); d.rect(ox + 9, oy + 13, 2, 2, s.dark);
  if (s.accent && s.id === 'penguin') { d.rect(ox + 4, oy + 14, 2, 1, s.accent); d.rect(ox + 9, oy + 14, 2, 1, s.accent); }

  // 몸통
  d.rect(ox + 3, oy + 7, 9, 7, OUT, 0.45);
  d.rect(ox + 3, oy + 8, 9, 5, s.body);
  d.rect(ox + 4, oy + 11, 7, 2, s.belly); // 배

  // 머리 (오른쪽)
  d.rect(ox + 8, oy + 3, 7, 8, OUT, 0.45);
  d.rect(ox + 9, oy + 4, 6, 6, s.body);
  d.rect(ox + 9, oy + 8, 6, 2, s.belly); // 주둥이 아래

  // 귀
  if (s.earType === 'up') {
    d.rect(ox + 9, oy + 2, 2, 3, s.body); d.rect(ox + 13, oy + 2, 2, 3, s.body);
    d.rect(ox + 9, oy + 2, 2, 1, s.ear); d.rect(ox + 13, oy + 2, 2, 1, s.ear);
  } else if (s.earType === 'longup') {
    d.rect(ox + 9, oy + 0, 2, 5, s.body); d.rect(ox + 13, oy + 0, 2, 5, s.body);
    d.rect(ox + 9, oy + 1, 1, 3, s.ear); d.rect(ox + 13, oy + 1, 1, 3, s.ear);
  } else if (s.earType === 'round') {
    d.rect(ox + 8, oy + 2, 2, 2, s.ear); d.rect(ox + 13, oy + 2, 2, 2, s.ear);
  } else if (s.earType === 'floppy') {
    d.rect(ox + 8, oy + 4, 2, 4, s.ear); d.rect(ox + 14, oy + 4, 2, 4, s.ear);
  }

  // 눈 + 코 + 볼
  d.rect(ox + 12, oy + 6, 1, 2, 0x2a2420);
  d.rect(ox + 12, oy + 6, 1, 1, 0xffffff, 0.7);
  d.rect(ox + 14, oy + 8, 1, 1, 0x3a2e26); // 코
  d.rect(ox + 11, oy + 9, 1, 1, 0xe89a9a, 0.5); // 볼터치
  // 부리 (병아리·펭귄)
  if (s.accent && (s.id === 'chick' || s.id === 'penguin')) d.rect(ox + 15, oy + 7, 1, 2, s.accent);

  // 희귀 펫 반짝임 (별가루)
  if (s.rare) {
    d.rect(ox + 2, oy + 3, 1, 1, 0xfff2a0); d.rect(ox + 1, oy + 4, 1, 1, 0xfff2a0);
    d.rect(ox + 14, oy + 2, 1, 1, 0xfff2a0); d.rect(ox + 6, oy + 6, 1, 1, 0xffffff, 0.8);
  }
}

/** 20px 캔버스의 여백을 활용한 펫 전용 픽셀 액세서리 레이어. */
function drawAccessory(d: Px, ox: number, oy: number, accessory: PetAccessoryId): void {
  const edge = 0x3f3028;
  if (accessory === 'ribbon') {
    d.rect(ox + 8, oy + 9, 2, 2, edge); d.rect(ox + 7, oy + 8, 2, 2, 0xd98778);
    d.rect(ox + 10, oy + 8, 2, 2, 0xd98778); d.rect(ox + 9, oy + 9, 1, 1, 0xf0c2a1);
  } else if (accessory === 'scarf') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 8, oy + 9, 5, 1, 0x78927a);
    d.rect(ox + 8, oy + 11, 2, 3, edge); d.rect(ox + 8, oy + 11, 1, 3, 0x91aa8f);
  } else if (accessory === 'bandana') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 8, oy + 9, 5, 1, 0xc98755);
    d.rect(ox + 9, oy + 11, 3, 2, 0xc98755); d.rect(ox + 10, oy + 13, 1, 1, 0xe2b06f);
  } else if (accessory === 'glasses') {
    d.rect(ox + 10, oy + 5, 4, 4, edge, 0.9); d.rect(ox + 11, oy + 6, 2, 2, 0xd8e5dc, 0.7);
    d.rect(ox + 14, oy + 6, 1, 1, edge);
  } else if (accessory === 'beret') {
    d.rect(ox + 8, oy + 2, 7, 2, edge); d.rect(ox + 9, oy + 1, 5, 2, 0x9d6658);
    d.rect(ox + 13, oy + 0, 1, 1, 0xc18a73);
  } else if (accessory === 'satchel') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x5f4734); d.rect(ox + 6, oy + 11, 4, 3, edge);
    d.rect(ox + 7, oy + 11, 3, 2, 0xa7784a); d.rect(ox + 8, oy + 12, 1, 1, 0xe1bd72);
  } else if (accessory === 'crown') {
    d.rect(ox + 9, oy + 1, 6, 3, edge); d.rect(ox + 9, oy + 0, 2, 3, 0xe5bd55);
    d.rect(ox + 12, oy + 0, 1, 3, 0xf0d474); d.rect(ox + 14, oy + 0, 1, 3, 0xe5bd55);
    d.rect(ox + 10, oy + 2, 4, 1, 0xd29a3f);
  } else if (accessory === 'walking_pin') {
    d.rect(ox + 10, oy + 2, 3, 2, edge); d.rect(ox + 10, oy + 2, 2, 1, 0x779274);
    d.rect(ox + 12, oy + 1, 1, 2, 0x9fba83); d.rect(ox + 11, oy + 3, 1, 1, 0xe4c76f);
  } else if (accessory === 'field_notebook') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x67503a); d.rect(ox + 5, oy + 11, 4, 3, edge);
    d.rect(ox + 6, oy + 11, 3, 2, 0x78927a); d.rect(ox + 7, oy + 11, 1, 2, 0xe8d8b8);
  } else if (accessory === 'regular_tag') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0xb9785f);
    d.rect(ox + 10, oy + 10, 2, 2, 0xcfae62); d.rect(ox + 10, oy + 11, 1, 1, 0xf1dc91);
  } else if (accessory === 'film_pouch') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x57413b); d.rect(ox + 5, oy + 11, 5, 3, edge);
    d.rect(ox + 6, oy + 11, 4, 2, 0xa36e76); d.rect(ox + 7, oy + 11, 2, 1, 0xd4b98d);
  } else if (accessory === 'artisan_cape') {
    d.rect(ox + 7, oy + 8, 6, 2, edge); d.rect(ox + 7, oy + 9, 5, 5, 0x6f7c68);
    d.rect(ox + 8, oy + 10, 2, 2, 0xc79b55); d.rect(ox + 10, oy + 12, 2, 2, 0x9d6658);
  } else if (accessory === 'chronicle_crown') {
    d.rect(ox + 8, oy + 1, 7, 3, edge); d.rect(ox + 9, oy + 0, 1, 3, 0x7f9daa);
    d.rect(ox + 11, oy + 0, 1, 3, 0xe5bd55); d.rect(ox + 13, oy + 0, 1, 3, 0x7f9daa);
    d.rect(ox + 9, oy + 2, 5, 1, 0x555b78); d.rect(ox + 11, oy + 1, 1, 1, 0xf1dc91);
  } else if (accessory === 'umbrella_charm') {
    d.rect(ox + 5, oy + 9, 1, 5, edge); d.rect(ox + 4, oy + 9, 3, 1, 0xf2d85c);
    d.rect(ox + 3, oy + 10, 5, 1, 0xe7bd47); d.rect(ox + 5, oy + 13, 2, 1, 0x879b7d);
  } else if (accessory === 'encore_headset') {
    d.rect(ox + 9, oy + 2, 6, 1, edge); d.rect(ox + 8, oy + 3, 1, 4, 0xb0685a);
    d.rect(ox + 14, oy + 3, 2, 4, 0xb0685a); d.rect(ox + 15, oy + 6, 2, 1, 0xf2a85c);
  } else if (accessory === 'letter_satchel') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x76583d); d.rect(ox + 5, oy + 11, 5, 3, edge);
    d.rect(ox + 6, oy + 11, 4, 2, 0xd8b86e); d.rect(ox + 7, oy + 11, 2, 1, 0xf2ead8);
  } else if (accessory === 'editor_beret') {
    d.rect(ox + 8, oy + 2, 7, 2, edge); d.rect(ox + 9, oy + 1, 5, 2, 0xc68d88);
    d.rect(ox + 12, oy + 0, 1, 1, 0xe86aa8); d.rect(ox + 10, oy + 2, 1, 1, 0xf2ead8);
  } else if (accessory === 'house_key_tag') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x879b7d);
    d.rect(ox + 10, oy + 10, 3, 3, 0xc89a6a); d.rect(ox + 11, oy + 10, 1, 1, 0xf2ead8);
  } else if (accessory === 'herb_neckerchief') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 8, oy + 9, 5, 1, 0xc79b55);
    d.rect(ox + 9, oy + 11, 3, 3, 0x879b7d); d.rect(ox + 10, oy + 12, 1, 1, 0xf2d85c);
  } else if (accessory === 'water_goggles') {
    d.rect(ox + 10, oy + 5, 4, 4, edge); d.rect(ox + 11, oy + 6, 2, 2, 0x7f9daa);
    d.rect(ox + 14, oy + 6, 2, 1, 0x58b8c8); d.rect(ox + 11, oy + 6, 1, 1, 0xd8eff2);
  } else if (accessory === 'lantern_cape') {
    d.rect(ox + 7, oy + 8, 6, 2, edge); d.rect(ox + 7, oy + 9, 5, 5, 0x4a4e5c);
    d.rect(ox + 9, oy + 10, 2, 3, 0xf2d85c); d.rect(ox + 9, oy + 11, 2, 1, 0xfff2a0);
  } else if (accessory === 'map_pin_tag') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x7f9279);
    d.rect(ox + 10, oy + 10, 3, 3, 0xb78a69); d.rect(ox + 11, oy + 10, 1, 1, 0xf2d85c);
  } else if (accessory === 'window_lantern') {
    d.rect(ox + 5, oy + 8, 1, 5, edge); d.rect(ox + 4, oy + 10, 4, 4, edge);
    d.rect(ox + 5, oy + 10, 2, 3, 0xf2a85c); d.rect(ox + 5, oy + 11, 2, 1, 0xffefb0);
  } else if (accessory === 'seed_pouch') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x66503c); d.rect(ox + 5, oy + 11, 5, 3, edge);
    d.rect(ox + 6, oy + 11, 4, 2, 0xb85f72); d.rect(ox + 7, oy + 11, 1, 1, 0x9cc79c);
  } else if (accessory === 'neighbor_seat_tag') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0xaa6e64);
    d.rect(ox + 10, oy + 10, 3, 2, 0xd4be93); d.rect(ox + 11, oy + 10, 1, 1, 0xf4e6c8);
  } else if (accessory === 'museum_ribbon') {
    d.rect(ox + 9, oy + 2, 5, 2, edge); d.rect(ox + 9, oy + 2, 2, 2, 0xc8a8d8);
    d.rect(ox + 12, oy + 2, 2, 2, 0xf2a85c); d.rect(ox + 10, oy + 4, 1, 2, 0xb85f72); d.rect(ox + 12, oy + 4, 1, 2, 0xd8bd79);
  } else if (accessory === 'guild_satchel') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x4f5d55); d.rect(ox + 5, oy + 10, 6, 4, edge);
    d.rect(ox + 6, oy + 11, 2, 2, 0x6e7f76); d.rect(ox + 9, oy + 11, 1, 2, 0xb85f72); d.rect(ox + 8, oy + 12, 1, 1, 0xd8c69f);
  } else if (accessory === 'index_scarf') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 8, oy + 9, 5, 1, 0x4a4e5c);
    d.rect(ox + 8, oy + 11, 2, 4, edge); d.rect(ox + 8, oy + 11, 1, 4, 0xd4c39d); d.rect(ox + 9, oy + 12, 1, 1, 0x82718c);
  } else if (accessory === 'next_page_cape') {
    d.rect(ox + 7, oy + 8, 6, 2, edge); d.rect(ox + 7, oy + 9, 5, 5, 0x4d5870);
    d.rect(ox + 8, oy + 10, 1, 1, 0xd8bd79); d.rect(ox + 10, oy + 11, 1, 1, 0xf4e6b0); d.rect(ox + 8, oy + 13, 3, 1, 0x8c687e);
  } else if (accessory === 'palette_charm') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0xa77279);
    d.rect(ox + 9, oy + 11, 4, 3, edge); d.rect(ox + 10, oy + 11, 1, 1, 0xd77a8b);
    d.rect(ox + 11, oy + 12, 1, 1, 0xf2cf75); d.rect(ox + 12, oy + 11, 1, 1, 0x756d91);
  } else if (accessory === 'room_key_charm') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x9a785d);
    d.rect(ox + 10, oy + 10, 3, 3, 0xd4b98d); d.rect(ox + 11, oy + 11, 1, 1, edge);
    d.rect(ox + 12, oy + 12, 2, 1, 0xc79b55);
  } else if (accessory === 'paired_step_charm') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x788867);
    d.rect(ox + 9, oy + 11, 2, 2, 0xd8c89b); d.rect(ox + 12, oy + 12, 2, 2, 0x9cc79c);
  } else if (accessory === 'regular_cup_charm') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x6f8190);
    d.rect(ox + 9, oy + 11, 3, 3, 0xe4c691); d.rect(ox + 12, oy + 12, 2, 1, edge);
    d.rect(ox + 10, oy + 11, 1, 1, 0xf2ead8);
  } else if (accessory === 'harvest_pouch') {
    d.rect(ox + 5, oy + 8, 1, 5, 0x66503c); d.rect(ox + 5, oy + 11, 6, 3, edge);
    d.rect(ox + 6, oy + 11, 5, 2, 0xb6a06a); d.rect(ox + 7, oy + 11, 1, 1, 0x879b7d);
    d.rect(ox + 9, oy + 12, 1, 1, 0xd9825b);
  } else if (accessory === 'return_compass') {
    d.rect(ox + 8, oy + 9, 5, 2, edge); d.rect(ox + 9, oy + 9, 3, 1, 0x756d91);
    d.rect(ox + 9, oy + 11, 4, 4, edge); d.rect(ox + 10, oy + 12, 2, 2, 0xe1c36c);
    d.rect(ox + 11, oy + 11, 1, 3, 0xf2ead8);
  }
}

/** Phaser 텍스처 등록 (씬용). 키: pet-<id> */
export function ensurePet(scene: Phaser.Scene, speciesId: string, accessory: PetAccessoryId = 'none'): string | null {
  const s = petById(speciesId);
  if (!s) return null;
  const safeAccessory = isPetAccessoryId(accessory) ? accessory : 'none';
  const key = `pet-${s.id}-${safeAccessory}`;
  makeTexture(scene, key, PET_W, PET_H, (d) => {
    drawPet(d, 2, 4, s);
    drawAccessory(d, 2, 4, safeAccessory);
  });
  return key;
}

/** DOM 캔버스에 펫을 그린다 (펫샵 미리보기용) */
export function paintPet(ctx: CanvasRenderingContext2D, speciesId: string, accessory: PetAccessoryId = 'none'): void {
  const s = petById(speciesId);
  ctx.clearRect(0, 0, PET_W, PET_H);
  if (s) {
    const d = px(ctx);
    drawPet(d, 2, 4, s);
    drawAccessory(d, 2, 4, isPetAccessoryId(accessory) ? accessory : 'none');
  }
}
