import { ACCENT_COLORS, PANTS_COLORS, type Appearance } from './appearance';

export type StyleIdentityId = 'cozy' | 'street' | 'classic' | 'dreamy' | 'nature' | 'playful' | 'artisan' | 'night';

export interface StyleIdentity {
  id: StyleIdentityId;
  mark: string;
  name: string;
  description: string;
  color: string;
}

export const STYLE_IDENTITIES: readonly StyleIdentity[] = [
  { id: 'cozy', mark: '포', name: '포근한 레이어러', description: '부드러운 겹침과 머물고 싶은 색의 조합', color: '#a98467' },
  { id: 'street', mark: '골', name: '골목 스트리터', description: '움직임이 큰 실루엣과 선명한 포인트', color: '#a96569' },
  { id: 'classic', mark: '정', name: '정갈한 클래식', description: '반듯한 선과 오래 입을 수 있는 균형', color: '#6f7b82' },
  { id: 'dreamy', mark: '꿈', name: '몽상 수집가', description: '별과 리본처럼 장면을 만드는 디테일', color: '#8f75a1' },
  { id: 'nature', mark: '잎', name: '숲빛 산책자', description: '잎과 흙을 닮은 편안한 생활 색감', color: '#71886a' },
  { id: 'playful', mark: '놀', name: '장난스러운 믹서', description: '예상 밖의 무늬와 액세서리를 섞는 조합', color: '#b27676' },
  { id: 'artisan', mark: '손', name: '생활 공방가', description: '손때 묻은 소재와 실용적인 수납의 조합', color: '#8c785c' },
  { id: 'night', mark: '밤', name: '심야 편집자', description: '어두운 바탕 위에 한 점만 남기는 도시 색감', color: '#5f6278' },
] as const;

export const STYLE_IDENTITY_BY_ID = new Map(STYLE_IDENTITIES.map((identity) => [identity.id, identity]));
const DARK = new Set(['2e2e38', '4a4e5c', '6a7a8a']);
const WARM = new Set(['e8c9a0', 'd88a7c', 'd8b86e', 'f2a85c', 'c89a6a', 'b0685a']);
const GREEN = new Set(['8ab8a8', '9cc79c', '7ec86a', '3a7a5a', '72b86a']);
const PASTEL = new Set(['c8a8d8', 'e0a8b8', 'a8c8e0', 'e86ab0', 'e86aa8']);

export function styleIdentityFor(appearance: Appearance): StyleIdentity {
  const a = appearance;
  const score: Record<StyleIdentityId, number> = {
    cozy: 0, street: 0, classic: 0, dreamy: 0, nature: 0, playful: 0, artisan: 0, night: 0,
  };
  if ([3, 4].includes(a.topStyle ?? 0)) { score.cozy += 3; score.artisan += 2; }
  if ([1, 5].includes(a.topStyle ?? 0)) { score.street += 3; score.playful += 2; }
  if ([2, 7].includes(a.topStyle ?? 0)) score.classic += 4;
  if ((a.topStyle ?? 0) === 6) score.dreamy += 4;
  if ((a.topStyle ?? 0) === 0) score.nature += 2;
  if ([1, 4].includes(a.bottomStyle ?? 0)) { score.street += 2; score.artisan += 1; }
  if ([3, 5].includes(a.bottomStyle ?? 0)) { score.dreamy += 2; score.classic += 1; }
  if ((a.bottomStyle ?? 0) === 2) { score.nature += 1; score.playful += 2; }
  if ((a.shoeStyle ?? 0) === 2) score.classic += 2;
  if ((a.shoeStyle ?? 0) === 3) score.street += 2;
  if ((a.shoeStyle ?? 0) === 4) score.playful += 1;
  if ((a.back ?? 0) === 1) { score.nature += 2; score.street += 1; }
  if ([2, 4].includes(a.back ?? 0)) score.artisan += 2;
  if ((a.back ?? 0) === 3) score.dreamy += 3;
  if ((a.back ?? 0) === 5) score.playful += 3;
  if ([3, 4].includes(a.topPattern ?? 0)) { score.dreamy += 2; score.playful += 1; }
  if ((a.topPattern ?? 0) === 2) { score.street += 1; score.playful += 2; }
  if ((a.topPattern ?? 0) === 5) { score.nature += 2; score.artisan += 1; }
  if ((a.hat ?? 0) >= 4 || (a.faceDetail ?? 0) >= 4) score.playful += 2;
  if ((a.glasses ?? 0) > 0) score.night += 1;
  if (DARK.has(a.shirt)) { score.night += 4; score.classic += 1; }
  if (WARM.has(a.shirt) || WARM.has(a.accent ?? '')) score.cozy += 2;
  if (GREEN.has(a.shirt) || GREEN.has(a.accent ?? '')) score.nature += 3;
  if (PASTEL.has(a.shirt) || PASTEL.has(a.accent ?? '')) score.dreamy += 2;
  if ((a.hairColor ?? 0) >= 7) { score.playful += 1; score.dreamy += 1; }
  const winner = STYLE_IDENTITIES.reduce((best, identity) => score[identity.id] > score[best.id] ? identity : best);
  return STYLE_IDENTITY_BY_ID.get(winner.id)!;
}

const hex = (value: number): string => value.toString(16).padStart(6, '0');

export function stylePaletteFor(appearance: Appearance): readonly [string, string, string] {
  return [appearance.shirt, hex(PANTS_COLORS[appearance.pants]!), appearance.accent ?? ACCENT_COLORS[0]!];
}
