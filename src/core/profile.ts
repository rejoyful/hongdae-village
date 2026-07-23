export interface DesignerProfile {
  id: string;
  name: string;
}

const MAX_NAME_LENGTH = 16;

export function normalizeDesignerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
}

export function createDesignerProfile(value: string): DesignerProfile {
  const name = normalizeDesignerName(value);
  if (!name) throw new Error('이름을 입력해 주세요.');

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`,
    name,
  };
}

export function clearLegacyGameData(storage: Storage): number {
  const legacyKeys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith('hv-') || key?.startsWith('hongdae-village')) {
      legacyKeys.push(key);
    }
  }

  legacyKeys.forEach((key) => storage.removeItem(key));
  return legacyKeys.length;
}
