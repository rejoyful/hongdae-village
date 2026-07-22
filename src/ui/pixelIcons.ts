/**
 * 손으로 찍은 12×12 픽셀 아이콘 세트 — 이모지 대신 게임 톤에 맞는 전용 아이콘.
 * 문자 그리드로 정의하고 캔버스에서 4배 확대(dataURL)해 DOM <img>로 쓴다.
 * '.'은 투명. 그리드는 반드시 12×12 (테스트로 검증).
 */

export interface IconDef { rows: string[]; pal: Record<string, string> }

const O = '#4a2c12'; // 공통 외곽선

export const ICON_DEFS: Record<string, IconDef> = {
  // 🎒 소지품 — 빨간 배낭
  bag: {
    pal: { o: O, f: '#e8c9a0', r: '#d85a4a', d: '#b04234', p: '#f2a25c' },
    rows: [
      '....oooo....',
      '...offffo...',
      '..orrrrrro..',
      '.orrrrrrrro.',
      '.orrrrrrrro.',
      '.orrpppprro.',
      '.orrpooprro.',
      '.orrpppprro.',
      '.orrrrrrrro.',
      '.odrrrrrrdo.',
      '..oooooooo..',
      '............',
    ],
  },
  // 📖 가이드북 — 파란 표지 + 책갈피
  book: {
    pal: { o: O, b: '#4a7ab8', d: '#38609a', r: '#d85a4a', w: '#f6ecd0' },
    rows: [
      '............',
      '..oooooooo..',
      '.odbbbrbbwo.',
      '.odbbbrbbwo.',
      '.odbbbrbbwo.',
      '.odbbbbbbwo.',
      '.odbbbbbbwo.',
      '.odbbbbbbwo.',
      '.odbbbbbbwo.',
      '.odbbbbbbwo.',
      '..oooooooo..',
      '............',
    ],
  },
  // 🗺️ 지도 — 크림 종이 + 숲 + 빨간 핀
  map: {
    pal: { o: O, c: '#f2dcae', g: '#7fae5f', r: '#e0483a', w: '#fff8e4' },
    rows: [
      '............',
      '.oooooooooo.',
      '.ocggccccco.',
      '.ocgggcccco.',
      '.occcccrrco.',
      '.occccrrrro.',
      '.ocgcccrrco.',
      '.ocggcccrco.',
      '.ocgggcccco.',
      '.oooooooooo.',
      '............',
      '............',
    ],
  },
  // 👥 주민 — 두 사람
  people: {
    pal: { o: O, s: '#f0cfae', h: '#6e4a30', b: '#7fa8d8', p: '#e8a0b0' },
    rows: [
      '............',
      '..ooo..ooo..',
      '.ohhho ohho.',
      '.ohsso ohso.',
      '.ossso osso.',
      '..ooo..ooo..',
      '.oobbooppoo.',
      '.obbbbopppo.',
      '.obbbbopppo.',
      '.obbbbopppo.',
      '..ooo..ooo..',
      '............',
    ],
  },
  // 🏆 랭킹 — 금 트로피
  trophy: {
    pal: { o: O, g: '#f2c25c', d: '#d89a2c', h: '#fff0b0' },
    rows: [
      '............',
      '.oooooooooo.',
      '.oghggggodo.',
      'oohggggggoo.',
      'o.oggggggo.o',
      'oo.odggdo.oo',
      '....oggo....',
      '.....gg.....',
      '....oggo....',
      '...oggggo...',
      '..oooooooo..',
      '............',
    ],
  },
  // 📜 퀘스트 — 두루마리
  scroll: {
    pal: { o: O, p: '#f6ecd0', d: '#d8b878', l: '#a08050' },
    rows: [
      '............',
      '..oooooooo..',
      '.odppppppdo.',
      '.oodppppoo..',
      '..opllllpo..',
      '..oppppppo..',
      '..opllllpo..',
      '..oppppppo..',
      '..opllplpo..',
      '.oodppppoo..',
      '.odppppppdo.',
      '..oooooooo..',
    ],
  },
  // 👕 꾸미기 — 티셔츠
  shirt: {
    pal: { o: O, b: '#8ab8a8', d: '#6a988a', w: '#f6ecd0' },
    rows: [
      '............',
      '..oo....oo..',
      '.obboooobbo.',
      '.obbbbbbbbo.',
      '.obobbbbobo.',
      '..oobbbboo..',
      '...obbbbo...',
      '...obwbbo...',
      '...obbbbo...',
      '...obbbbo...',
      '...oooooo...',
      '............',
    ],
  },
  // 💬 채팅 — 말풍선
  chat: {
    pal: { o: O, w: '#fff8e4', d: '#a08050' },
    rows: [
      '............',
      '..oooooooo..',
      '.owwwwwwwwo.',
      '.owdwdwdwwo.',
      '.owwwwwwwwo.',
      '..oooooooo..',
      '....owo.....',
      '...owo......',
      '...oo.......',
      '............',
      '............',
      '............',
    ],
  },
  // 😊 이모트 — 웃는 얼굴
  smile: {
    pal: { o: O, y: '#f2c25c', d: '#6e4a20', r: '#e8927c' },
    rows: [
      '............',
      '...oooooo...',
      '..oyyyyyyo..',
      '.oyydyydyyo.',
      '.oyydyydyyo.',
      '.oyyyyyyyyo.',
      '.oydyyyydyo.',
      '.oyyddddyyo.',
      '..oryyyyro..',
      '...oooooo...',
      '............',
      '............',
    ],
  },
  // 💎 보물 — 다이아 젬
  gem: {
    pal: { o: O, c: '#5ac8e0', h: '#b0f0ff', d: '#2a8ab0', w: '#ffffff' },
    rows: [
      '............',
      '..o.oooo.o..',
      '.ochhcccdo..',
      'occhcccddco.',
      'ocwhccccddo.',
      '.occcccddo..',
      '..occcddo...',
      '...occdo....',
      '....odo.....',
      '.....o......',
      '............',
      '............',
    ],
  },
  // ⚙️ 설정 — 톱니바퀴
  gear: {
    pal: { o: O, g: '#a89882', d: '#887860' },
    rows: [
      '............',
      '.....oo.....',
      '..o.oggo.o..',
      '.oooggggooo.',
      '..ogggggggo.',
      '.oggodd ggo.',
      '.oggoddoggo.',
      '..ogggggggo.',
      '.oooggggooo.',
      '..o.oggo.o..',
      '.....oo.....',
      '............',
    ],
  },
  // 🪙 코인
  coin: {
    pal: { o: O, g: '#f2c25c', h: '#fff0b0', d: '#d89a2c' },
    rows: [
      '............',
      '...oooooo...',
      '..oghhggdo..',
      '.oghgggggdo.',
      '.ohgggggggo.',
      '.ogggoogggo.',
      '.oggo..oggo.',
      '.ogggoogggo.',
      '.ogggggggdo.',
      '..ogggggdo..',
      '...oooooo...',
      '............',
    ],
  },
  // 🧡 하트 (채움)
  heart: {
    pal: { o: O, r: '#f2803c', h: '#ffb87c', d: '#d85a24' },
    rows: [
      '............',
      '..oo....oo..',
      '.ohro..orro.',
      '.ohhro orro.',
      '.orrrrorrro.',
      '.orrrrrrrro.',
      '..orrrrrrdo.',
      '...orrrrdo..',
      '....orrdo...',
      '.....odo....',
      '......o.....',
      '............',
    ],
  },
  // 🤎 하트 (비움)
  heartEmpty: {
    pal: { o: '#3a2a18', r: '#5c4630', h: '#6e5840', d: '#4a3824' },
    rows: [
      '............',
      '..oo....oo..',
      '.ohro..orro.',
      '.ohhro orro.',
      '.orrrrorrro.',
      '.orrrrrrrro.',
      '..orrrrrrdo.',
      '...orrrrdo..',
      '....orrdo...',
      '.....odo....',
      '......o.....',
      '............',
    ],
  },
};

/** 그리드 → dataURL (scale배 확대, 픽셀 유지) */
export function renderIcon(def: IconDef, scale = 4): string {
  const size = 12;
  const c = document.createElement('canvas');
  c.width = size * scale; c.height = size * scale;
  const ctx = c.getContext('2d')!;
  def.rows.forEach((row, y) => {
    for (let x = 0; x < size; x++) {
      const ch = row[x]!;
      const color = def.pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  });
  return c.toDataURL();
}

let cache: Record<string, string> | null = null;

/** 전체 아이콘 dataURL 맵 (렌더는 1회) */
export function pixelIcons(): Record<string, string> {
  if (!cache) {
    cache = {};
    for (const [k, def] of Object.entries(ICON_DEFS)) cache[k] = renderIcon(def);
  }
  return cache;
}
