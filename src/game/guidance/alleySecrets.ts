export type AlleySecretChapterId = 'first-door' | 'warm-scent' | 'handmade-face' | 'night-walk';

export interface AlleySecretChapterDef {
  id: AlleySecretChapterId;
  code: string;
  mark: string;
  title: string;
  subtitle: string;
  epilogue: string;
  color: string;
}

export interface AlleySecretDef {
  id: string;
  chapterId: AlleySecretChapterId;
  sequence: 1 | 2 | 3;
  mark: string;
  title: string;
  teaser: string;
  memory: string;
  location: string;
  tx: number;
  ty: number;
}

export interface AlleySecretState {
  version: 1;
  discoveredIds: string[];
  featuredChapterId: AlleySecretChapterId | null;
}

export interface AlleySecretView extends AlleySecretDef {
  discovered: boolean;
}

export interface AlleySecretChapterView extends AlleySecretChapterDef {
  secrets: AlleySecretView[];
  discovered: number;
  complete: boolean;
  featured: boolean;
  next: AlleySecretView | null;
}

export interface AlleySecretProgress {
  discovered: number;
  total: number;
  completedChapters: number;
  totalChapters: number;
  featured: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const ALLEY_SECRET_CHAPTERS: readonly AlleySecretChapterDef[] = [
  {
    id: 'first-door', code: 'SIDE A · ARRIVAL', mark: '문', title: '문을 연 골목',
    subtitle: '처음 온 사람을 위해 누군가 남겨 둔 세 개의 표식',
    epilogue: '낯선 골목은 먼저 도착한 사람이 남긴 작은 친절 덕분에 집이 된다.',
    color: '#7d8586',
  },
  {
    id: 'warm-scent', code: 'SIDE B · AFTERGLOW', mark: '잔', title: '생활의 잔향',
    subtitle: '컵과 노래와 메모 사이에 남은 하루의 온도',
    epilogue: '사라진 하루도 향과 소리와 손글씨 하나를 남기면 다시 돌아올 수 있다.',
    color: '#aa735d',
  },
  {
    id: 'handmade-face', code: 'SIDE C · HANDMADE', mark: '손', title: '손끝의 표정',
    subtitle: '누가 만들었는지 알 수 있는 작은 어긋남들',
    epilogue: '반듯하지 않은 자국은 실패가 아니라 만든 사람의 얼굴이었다.',
    color: '#8c8062',
  },
  {
    id: 'night-walk', code: 'SIDE D · TOGETHER', mark: '밤', title: '함께 걷는 밤',
    subtitle: '사람과 동행과 숲이 서로의 속도를 맞춘 흔적',
    epilogue: '같이 걷는다는 건 앞서지 않는 법을 오래 연습하는 일이었다.',
    color: '#697762',
  },
] as const;

export const ALLEY_SECRETS: readonly AlleySecretDef[] = [
  {
    id: 'creased-ticket', chapterId: 'first-door', sequence: 1, mark: '표',
    title: '두 번 접힌 승차권', teaser: '역 앞 산책문 바닥에서 종이 모서리가 반짝인다.',
    memory: '뒷면에는 “길을 잃으면 가장 밝은 창문을 보세요”라는 연필 글씨가 남아 있다.',
    location: '역 앞 산책문 · 첫 스폰 서쪽', tx: 12, ty: 19,
  },
  {
    id: 'notice-back', chapterId: 'first-door', sequence: 2, mark: '쪽',
    title: '게시판 뒤의 쪽지', teaser: '모험 일지 게시판 뒤로 작은 종이가 삐져나왔다.',
    memory: '초행자에게 필요한 건 정답보다 “지금은 하나만 해도 된다”는 허락이라는 메모다.',
    location: '취향 중앙광장 · 모험 일지 북쪽', tx: 13, ty: 13,
  },
  {
    id: 'borrowed-key', chapterId: 'first-door', sequence: 3, mark: '열',
    title: '돌려받지 않은 작은 열쇠', teaser: '주택가 난간 아래 낡은 열쇠표가 놓여 있다.',
    memory: '열쇠표에는 집 번호 대신 “돌아오고 싶은 곳”이라고만 적혀 있다.',
    location: '옥상 주택가 · 남쪽 난간', tx: 10, ty: 7,
  },
  {
    id: 'late-receipt', chapterId: 'warm-scent', sequence: 1, mark: '영',
    title: '마지막 주문 영수증', teaser: '카페길 돌 틈에서 커피 향이 희미하게 남는다.',
    memory: '마감 뒤 주문은 한 잔이 아니라 두 잔. 한 잔은 늦게 퇴근하는 이웃 몫이었다.',
    location: '모퉁이 카페길 · 남쪽 테이블', tx: 18, ty: 8,
  },
  {
    id: 'record-sticker', chapterId: 'warm-scent', sequence: 2, mark: '음',
    title: '벤치 아래 레코드 스티커', teaser: '낡은 벤치 아래 작은 음표 스티커가 붙어 있다.',
    memory: '아무도 듣지 않던 첫 공연의 날짜와 “그래도 한 사람은 끝까지 들었다”는 문장이 보인다.',
    location: '레코드 골목 · 북쪽 벤치', tx: 17, ty: 9,
  },
  {
    id: 'kitchen-margin', chapterId: 'warm-scent', sequence: 3, mark: '맛',
    title: '레시피 여백의 한 줄', teaser: '골목 주방 창가에 양념 묻은 메모가 접혀 있다.',
    memory: '정량 아래에 “오늘 먹을 사람의 표정을 보고 한 숟갈 덜기”가 마지막 과정으로 적혀 있다.',
    location: '모퉁이 골목 주방 · 서쪽 창가', tx: 16, ty: 6,
  },
  {
    id: 'thread-label', chapterId: 'handmade-face', sequence: 1, mark: '실',
    title: '이름 없는 실 색표', teaser: '아틀리에 길가에 여러 색 실이 한 뼘씩 묶여 있다.',
    memory: '색 이름은 전부 사람의 기억이다. “첫 출근 셔츠”, “비 온 날 우산”, “친구의 볼”.',
    location: '살림 창작골목 · 아틀리에 동쪽', tx: 10, ty: 18,
  },
  {
    id: 'sawdust-star', chapterId: 'handmade-face', sequence: 2, mark: '별',
    title: '톱밥 속 삐뚤한 별', teaser: 'DIY 작업대 뒤에서 작은 나무 별 하나가 굴러왔다.',
    memory: '모서리가 하나 짧지만 뒷면에는 “첫 완성품, 고치지 않기”라는 도장이 선명하다.',
    location: '살림 창작골목 · DIY 작업대 서쪽', tx: 7, ty: 20,
  },
  {
    id: 'photo-edge', chapterId: 'handmade-face', sequence: 3, mark: '찰',
    title: '잘려 나간 네컷 가장자리', teaser: '광장 서쪽 바닥에 포토카드 테두리 조각이 빛난다.',
    memory: '사진은 없지만 뒷면의 글씨는 남았다. “완벽하지 않아서 오늘과 더 닮았다.”',
    location: '취향 중앙광장 · 네컷 작업실 남쪽', tx: 8, ty: 13,
  },
  {
    id: 'paw-button', chapterId: 'night-walk', sequence: 1, mark: '발',
    title: '목줄에서 떨어진 단추', teaser: '동행 산책길 풀 사이로 발바닥 단추가 보인다.',
    memory: '단추 안쪽에는 작은 글씨로 “기다려 준 걸음 수는 세지 않기”라고 새겨져 있다.',
    location: '동행 산책길 · 펫샵 남쪽', tx: 21, ty: 20,
  },
  {
    id: 'water-coin', chapterId: 'night-walk', sequence: 2, mark: '물',
    title: '던지지 않은 소원 동전', teaser: '물정원 가장자리에 젖지 않은 동전 하나가 놓여 있다.',
    memory: '소원 대신 “잡지 않아도 만난 것으로 기억하기”라는 물고기 그림이 새겨져 있다.',
    location: '동행 산책길 · 물정원 서쪽', tx: 25, ty: 13,
  },
  {
    id: 'forest-bell', chapterId: 'night-walk', sequence: 3, mark: '숲',
    title: '울리지 않는 숲 방울', teaser: '외곽숲 입구의 나뭇가지에 작은 방울이 묶여 있다.',
    memory: '소리를 내지 않는 방울은 돌아올 길을 눈으로 기억하라는 관찰자의 표식이었다.',
    location: '별빛 외곽숲 · 안전 연결도로 끝', tx: 28, ty: 8,
  },
] as const;

const SECRET_IDS = new Set(ALLEY_SECRETS.map((secret) => secret.id));
const CHAPTER_IDS = new Set(ALLEY_SECRET_CHAPTERS.map((chapter) => chapter.id));

export function normalizeAlleySecretState(raw: unknown): AlleySecretState {
  const value = raw && typeof raw === 'object' ? raw as Partial<AlleySecretState> : {};
  const discoveredIds = Array.isArray(value.discoveredIds)
    ? [...new Set(value.discoveredIds.filter((id): id is string => (
      typeof id === 'string' && SECRET_IDS.has(id)
    )))]
    : [];
  const featuredChapterId = typeof value.featuredChapterId === 'string'
    && CHAPTER_IDS.has(value.featuredChapterId as AlleySecretChapterId)
    && ALLEY_SECRETS.filter((secret) => secret.chapterId === value.featuredChapterId)
      .every((secret) => discoveredIds.includes(secret.id))
    ? value.featuredChapterId as AlleySecretChapterId
    : null;
  return { version: 1, discoveredIds, featuredChapterId };
}

export function alleySecretViews(state: AlleySecretState): AlleySecretView[] {
  const discovered = new Set(state.discoveredIds);
  return ALLEY_SECRETS.map((secret) => ({ ...secret, discovered: discovered.has(secret.id) }));
}

export function alleySecretChapterViews(state: AlleySecretState): AlleySecretChapterView[] {
  const secrets = alleySecretViews(state);
  return ALLEY_SECRET_CHAPTERS.map((chapter) => {
    const entries = secrets.filter((secret) => secret.chapterId === chapter.id);
    const discovered = entries.filter((secret) => secret.discovered).length;
    return {
      ...chapter,
      secrets: entries,
      discovered,
      complete: discovered === entries.length,
      featured: state.featuredChapterId === chapter.id,
      next: entries.find((secret) => !secret.discovered) ?? null,
    };
  });
}

export function alleySecretProgress(state: AlleySecretState): AlleySecretProgress {
  const chapters = alleySecretChapterViews(state);
  return {
    discovered: state.discoveredIds.length,
    total: ALLEY_SECRETS.length,
    completedChapters: chapters.filter((chapter) => chapter.complete).length,
    totalChapters: chapters.length,
    featured: state.featuredChapterId ? 1 : 0,
  };
}

export class AlleySecretStore {
  private readonly key: string;
  private readonly storage?: StorageLike;
  private state: AlleySecretState;

  constructor(userId: string, storage?: StorageLike) {
    this.key = `hv-alley-secrets-v1:${userId}`;
    this.storage = storage ?? (typeof localStorage === 'undefined' ? undefined : localStorage);
    let raw: unknown = null;
    try {
      const saved = this.storage?.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeAlleySecretState(raw);
    this.persist();
  }

  get(): AlleySecretState {
    return { ...this.state, discoveredIds: [...this.state.discoveredIds] };
  }

  views(): AlleySecretView[] { return alleySecretViews(this.state); }
  chapters(): AlleySecretChapterView[] { return alleySecretChapterViews(this.state); }
  progress(): AlleySecretProgress { return alleySecretProgress(this.state); }

  discover(secretId: string): 'discovered' | 'known' | 'invalid' {
    if (!SECRET_IDS.has(secretId)) return 'invalid';
    if (this.state.discoveredIds.includes(secretId)) return 'known';
    this.state = { ...this.state, discoveredIds: [...this.state.discoveredIds, secretId] };
    this.persist();
    return 'discovered';
  }

  feature(chapterId: AlleySecretChapterId | null): 'featured' | 'cleared' | 'locked' | 'invalid' {
    if (chapterId === null) {
      this.state = { ...this.state, featuredChapterId: null };
      this.persist();
      return 'cleared';
    }
    if (!CHAPTER_IDS.has(chapterId)) return 'invalid';
    const chapter = this.chapters().find((entry) => entry.id === chapterId);
    if (!chapter?.complete) return 'locked';
    this.state = {
      ...this.state,
      featuredChapterId: this.state.featuredChapterId === chapterId ? null : chapterId,
    };
    this.persist();
    return this.state.featuredChapterId ? 'featured' : 'cleared';
  }

  private persist(): void {
    try { this.storage?.setItem(this.key, JSON.stringify(this.state)); } catch { /* 세션 한정 */ }
  }
}
