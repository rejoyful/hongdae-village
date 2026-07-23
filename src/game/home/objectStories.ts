import { CATALOG, CATALOG_BY_ID, STARTER_ITEMS } from '../../items/catalog';

export type ObjectStoryChapterId =
  | 'arrival'
  | 'reading'
  | 'wardrobe'
  | 'table'
  | 'soft'
  | 'music'
  | 'creator'
  | 'green'
  | 'living';

export interface ObjectStory {
  itemId: string;
  chapterId: ObjectStoryChapterId;
  whisper: string;
  note: string;
  tags: readonly [string, string, string];
  source: string;
}
export interface ObjectStoryChapter {
  id: ObjectStoryChapterId;
  code: string;
  mark: string;
  title: string;
  subtitle: string;
  curator: string;
  palette: readonly [string, string, string, string];
  required: number;
  itemIds: readonly string[];
}

export interface ObjectStoryState {
  version: 1;
  observedIds: string[];
  favoriteIds: string[];
  inspectionCounts: Record<string, number>;
  totalInspections: number;
}

export interface ObjectStoryChapterView extends ObjectStoryChapter {
  observed: number;
  total: number;
  complete: boolean;
}

export interface ObjectStoryProgress {
  observed: number;
  total: number;
  chapters: number;
  totalChapters: number;
  favorites: number;
  favoriteMax: number;
  inspections: number;
}

type StoryRow = readonly [
  itemId: string,
  whisper: string,
  note: string,
  tags: readonly [string, string, string],
];

const STARTER_IDS = new Set(STARTER_ITEMS.map((item) => item.itemId));
const CRAFTED_IDS = new Set([
  'bookshelf_wide', 'dining_table', 'cat_tower', 'mini_garden', 'neon_sign',
]);

const sourceFor = (itemId: string): string => {
  if (STARTER_IDS.has(itemId)) return '첫 입주 웰컴 박스';
  if (CRAFTED_IDS.has(itemId)) return '살림 아틀리에 · DIY 작업일지';
  return '살림 가구 쇼룸 · 기본 또는 주간 큐레이션';
};

const chapter = (
  id: ObjectStoryChapterId,
  code: string,
  mark: string,
  title: string,
  subtitle: string,
  curator: string,
  palette: readonly [string, string, string, string],
  rows: readonly StoryRow[],
): { chapter: ObjectStoryChapter; stories: ObjectStory[] } => ({
  chapter: {
    id, code, mark, title, subtitle, curator, palette, required: 4,
    itemIds: rows.map((row) => row[0]),
  },
  stories: rows.map(([itemId, whisper, note, tags]) => ({
    itemId, chapterId: id, whisper, note, tags, source: sourceFor(itemId),
  })),
});

const chapters = [
  chapter('arrival', 'CHAPTER 01 · ARRIVAL', '첫', '처음 도착한 방', '이삿짐이 생활이 되기까지', '살림 아주머니', ['#352a28', '#8a6750', '#d0a366', '#f0dec0'], [
    ['bed_basic', '낯선 천장 아래서도 이 이불을 펴면 오늘 하루가 무사히 끝났다는 기분이 든다.', '창에서 한 칸 비켜 놓으면 아침빛과 늦잠을 모두 지킬 수 있어요.', ['첫날', '휴식', '온기']],
    ['desk_wood', '서툰 계획과 식은 차 자국이 겹칠수록 책상 모서리는 주인의 하루를 닮아 간다.', '앉을 자리와 작은 조명을 곁들이면 생활의 중심이 됩니다.', ['기록', '작업', '나뭇결']],
    ['chair_wood', '처음엔 손님을 위한 의자였지만 어느새 가방과 외투가 가장 먼저 집에 도착하는 자리다.', '책상이나 식탁의 긴 변에 맞추면 자연스러운 동선이 생겨요.', ['일상', '자리', '손님']],
    ['rug_cream', '빈 바닥에 처음 펼친 천 한 장이 아직 가구가 적은 방에도 경계를 만들어 주었다.', '침대와 소파 아래에 반쯤 겹치면 작은 섬처럼 보여요.', ['바닥', '경계', '포근함']],
    ['lamp_stand', '이사 첫날 마지막으로 꽂은 플러그. 이 불빛 아래에서야 비로소 상자를 그만 열었다.', '벽 모서리보다 읽거나 쉬는 자리 가까이에 두어 보세요.', ['빛', '첫날', '안심']],
    ['moving_box', '다 비운 뒤에도 버리지 못한 상자에는 아직 어디에도 놓지 못한 가능성이 남아 있다.', '한두 개는 책상 밑이나 현관 곁에 남겨 살아 있는 방을 만들어요.', ['이사', '수납', '가능성']],
  ]),
  chapter('reading', 'CHAPTER 02 · MARGINS', '책', '여백을 모으는 사람', '책과 기록이 벽을 채우는 방식', '마을 기록관', ['#2c2a31', '#6f6675', '#b9986f', '#e7d9c1'], [
    ['bookshelf', '읽은 책보다 아직 읽지 않은 책의 등표지가 더 많아도, 그건 미뤄 둔 세계가 많다는 뜻이다.', '앉을 자리에서 손이 닿는 벽면에 두면 작은 서재가 됩니다.', ['책', '세계', '수집']],
    ['bookshelf_wide', '서로 다른 시기에 산 책장이 이어 붙으며 한 사람의 취향이 벽 한 면의 연표가 되었다.', '낮은 소품을 앞에 두지 말고 긴 벽의 주인공으로 남겨 주세요.', ['서재', '연표', 'DIY']],
    ['drawer', '맨 위 칸에는 자주 쓰는 것, 맨 아래 칸에는 아직 버리지 못한 것이 들어 있다.', '문 가까이에는 생활 수납, 침대 곁에는 기억 수납이 잘 어울려요.', ['수납', '비밀', '생활']],
    ['book_pile', '책갈피가 없는 페이지는 그날 급히 불려 나간 사람의 시간을 그대로 붙잡고 있다.', '책상·침대·러그 가장자리에 놓으면 방의 리듬이 부드러워져요.', ['책', '중단', '흔적']],
    ['wall_shelf', '바닥을 차지하지 않는 작은 선반은 소중한 것만 올리라는 조용한 질문을 건넨다.', '시선 높이에 두고 아래 가구와 한 장면으로 묶어 보세요.', ['전시', '벽', '선택']],
    ['photo_frames', '사진 속 사람들은 같은 순간에 웃고 있지만, 액자를 고른 날의 마음은 모두 다르다.', '자주 머무는 자리 맞은편에 걸면 방이 먼저 인사를 건네요.', ['사진', '사람', '기억']],
    ['wall_clock', '조용한 방에서만 들리는 초침은 지나간 시간이 아니라 아직 남은 저녁을 세어 준다.', '작업 구역과 휴식 구역 사이에 걸면 하루의 경계가 돼요.', ['시간', '저녁', '경계']],
  ]),
  chapter('wardrobe', 'CHAPTER 03 · PRIVATE LOOK', '옷', '문을 닫고 고른 모습', '아무도 보지 않아도 나다운 방', '초코', ['#362b38', '#8b6680', '#c99878', '#efd9c0'], [
    ['bed_blue', '비 오는 날 골라 둔 파란 침구는 맑은 날에도 방 한가운데 작은 저녁을 남긴다.', '차가운 색 가구 한 점과 따뜻한 조명을 함께 두어 균형을 잡아 보세요.', ['파랑', '잠', '비']],
    ['bed_green', '짙은 초록 침대는 잠드는 곳보다 잠시 숨어 숨을 고르는 숲에 더 가깝다.', '식물과 나뭇결 가구 사이에 두면 색이 자연스럽게 이어져요.', ['초록', '숲', '휴식']],
    ['wardrobe', '문을 열면 옷보다 먼저 여러 날의 내가 나란히 서서 오늘은 누구로 나갈지 기다린다.', '전신 거울과 거리를 두고 마주 보게 놓으면 작은 드레스룸이 됩니다.', ['옷', '정체성', '선택']],
    ['dresser', '서랍 안 작은 물건들은 외출 준비보다 집으로 돌아온 뒤의 얼굴을 더 잘 알고 있다.', '거울이나 부드러운 조명 곁에 두면 사적인 코너가 또렷해져요.', ['단장', '서랍', '귀가']],
    ['hanger_rack', '자주 입는 옷은 옷장 안보다 바깥에 머물며 이번 계절의 생활색을 보여 준다.', '현관과 침실 사이에 두면 오늘과 내일의 옷이 자연스럽게 오가요.', ['옷결', '계절', '외출']],
    ['shoe_rack', '신발 밑창의 먼지는 어디를 다녀왔는지 말하고, 가지런한 앞코는 다시 나갈 준비를 한다.', '현관 동선을 막지 않는 벽 쪽에 붙여 귀환의 자리를 만들어 주세요.', ['산책', '귀환', '현관']],
    ['mirror_full', '거울은 가장 잘 꾸민 모습뿐 아니라 아무도 만나지 않을 날의 편한 표정도 기억한다.', '창을 정면으로 마주 보지 않게 두면 은은한 전신 실루엣이 살아나요.', ['거울', '자기표현', '표정']],
  ]),
  chapter('table', 'CHAPTER 04 · AROUND A TABLE', '상', '마주 앉는 생활', '작은 식탁에서 시작된 관계', '포차 이모', ['#3a2e25', '#8e6c4e', '#c89a5d', '#f1dfbb'], [
    ['table_low', '바닥에 가까운 상에서는 식사와 작업과 수다가 한 높이에서 오래 섞인다.', '러그 중앙에 두고 방석을 비대칭으로 놓으면 편안해 보여요.', ['좌식', '수다', '밤']],
    ['tea_table', '찻잔 하나만 올려도 기다리는 사람이 있는 것처럼 방의 시간이 조금 느려진다.', '소파 앞을 꽉 채우지 말고 손을 뻗을 만큼만 가까이 두세요.', ['차', '기다림', '쉼']],
    ['dining_table', '두 사람용 식탁의 빈 맞은편은 외로움보다 언제든 누군가 올 수 있다는 여백에 가깝다.', '의자 방향을 살짝 달리하면 실제로 막 일어난 자리처럼 보여요.', ['식사', '둘', '초대']],
    ['side_table', '침대와 소파 사이를 오가며 물컵, 안경, 읽다 만 마음을 잠시 맡아 주는 가구다.', '큰 가구의 모서리에 붙이되 통로 한 칸은 남겨 주세요.', ['곁', '작은것', '돌봄']],
    ['kitchen_counter', '잘 드는 칼보다 익숙한 동선이 요리를 편하게 만든다는 걸 흠집 난 상판이 알고 있다.', '싱크대와 한 줄로 잇고 식탁까지 짧은 삼각형을 만들어 보세요.', ['요리', '동선', '손맛']],
    ['sink_unit', '하루의 접시가 쌓였다 사라지는 동안 물소리는 집이 아직 움직이고 있다고 말한다.', '조리대 옆에 두되 창가 식물과 거리를 두면 주방이 또렷해져요.', ['물', '설거지', '생활']],
    ['fridge', '문에 붙은 작은 메모와 자석이 안쪽 음식보다 집의 약속을 더 오래 보관한다.', '주방 입구에 두면 장을 보고 돌아온 동선이 자연스러워요.', ['주방', '메모', '약속']],
    ['coffee_maker', '첫 잔이 내려오는 짧은 소리만으로 아직 시작하지 못한 아침이 한 칸 앞으로 간다.', '컵을 둘 작은 상판과 함께 두면 골목 카페 같은 코너가 생겨요.', ['커피', '아침', '의식']],
  ]),
  chapter('soft', 'CHAPTER 05 · SOFT LANDING', '쉼', '몸이 먼저 아는 자리', '푹신한 것들이 지키는 저녁', '모퉁이 씨', ['#382d30', '#8f6a69', '#d0a47b', '#f1ddc3'], [
    ['chair_cushion', '등을 기대는 순간 오늘 있었던 일을 자세히 설명하지 않아도 된다는 기분이 든다.', '작은 조명과 책 한 권이 보이는 방향으로 돌려 보세요.', ['의자', '위로', '쉼']],
    ['stool', '잠깐 앉으려고 가져온 낮은 의자는 화분 받침과 손님 자리 사이를 부지런히 오간다.', '완벽히 맞추기보다 필요한 곳에 한 칸 비껴 두면 살아 있어 보여요.', ['임시', '다용도', '손님']],
    ['sofa_coral', '선명한 코랄색은 조용한 방에도 누군가 크게 웃고 간 흔적을 남긴다.', '주변 소품은 두세 색으로 줄여 소파가 장면의 주인공이 되게 하세요.', ['코랄', '웃음', '중심']],
    ['sofa_gray', '무채색 소파는 어떤 계절의 담요와 어떤 사람의 피곤함도 조용히 받아 준다.', '색이 강한 쿠션이나 포스터를 한 점만 곁들이면 표정이 생겨요.', ['회색', '포용', '거실']],
    ['sofa_single', '혼자 앉는 소파가 반드시 혼자이고 싶은 뜻은 아니다. 옆에 둘 자리를 천천히 고르는 중이다.', '창가나 책장 곁에 독립된 한 사람의 섬을 만들어 보세요.', ['혼자', '섬', '독서']],
    ['cushion', '방석은 자리가 부족할 때마다 사람 사이의 거리를 한 뼘씩 가깝게 만든다.', '낮은 상 주변에 서로 다른 방향으로 흩어 두면 수다의 흔적이 보여요.', ['방석', '가까움', '수다']],
    ['rug_round', '둥근 러그는 각진 가구들 사이에서 여기쯤 모여 앉자고 말없이 원을 그린다.', '티테이블이나 펫의 자리 아래에 중심을 맞춰 보세요.', ['원', '모임', '바닥']],
  ]),
  chapter('music', 'CHAPTER 06 · AFTER MIDNIGHT', '음', '자정 이후의 선곡', '소리와 빛으로 남긴 골목', '하늘', ['#24243a', '#5e5680', '#bd7085', '#efd28c'], [
    ['turntable', '바늘을 올리는 손의 속도만큼은 재생 버튼보다 느려서, 음악을 고른 마음까지 들려준다.', 'LP 상자와 낮은 조명을 삼각형으로 배치하면 감상실이 완성돼요.', ['LP', '선곡', '느림']],
    ['speaker_amp', '낮에는 가구처럼 잠잠하지만 밤이 오면 작은 방의 벽을 공연장 뒤편으로 바꾼다.', '벽에서 한 칸 띄우고 악기와 마주 보게 두면 무대가 보여요.', ['음악', '공연', '저음']],
    ['guitar', '자주 잡는 코드 근처만 색이 옅어져, 완성하지 못한 노래도 얼마나 오래 연습했는지 드러난다.', '책상 옆보다 빈 벽 한쪽에 세워 다음 연주를 기다리게 하세요.', ['기타', '연습', '노래']],
    ['mic_stand', '아무도 없는 방에서 건넨 첫 소절도 이 마이크 앞에서는 정식 공연처럼 떨린다.', '앰프와 일직선보다 살짝 비껴 세워 작은 무대의 깊이를 주세요.', ['목소리', '무대', '용기']],
    ['lp_crate', '장르보다 그 음반을 샀던 날의 날씨로 정리되어 주인만 알아보는 순서를 가진다.', '턴테이블 아래나 소파 옆에 두어 손이 가는 수집품으로 보여 주세요.', ['음반', '날씨', '수집']],
    ['poster_band', '빛바랜 공연 날짜는 지났지만 그날 들은 첫 곡의 시작만큼은 벽에서 아직 선명하다.', '악기 위쪽 벽에 걸어 장면의 시간대를 알려 주세요.', ['밴드', '공연', '기억']],
    ['neon_sign', '불을 켜는 순간 평범한 방 이름이 오늘 밤만 열리는 작은 가게의 간판이 된다.', '다른 조명은 줄이고 짙은 벽 소품과 함께 야간 장면을 만들어 보세요.', ['네온', '밤', '간판']],
  ]),
  chapter('creator', 'CHAPTER 07 · STILL MAKING', '작', '아직 만드는 중', '완성보다 다음 한 칸을 위한 자리', '노을', ['#29333a', '#657c84', '#bd8569', '#e8dcc5'], [
    ['desk_white', '깨끗한 상판은 완벽해서가 아니라 다음 작업이 어지럽혀도 괜찮도록 비워 둔 여백이다.', '색이 많은 도구 사이에 두어 작업물의 배경처럼 사용해 보세요.', ['책상', '여백', '시작']],
    ['pc_setup', '밤새 켜진 화면에는 게임과 작업과 친구의 메시지가 같은 창 크기로 나란히 떠 있다.', '의자, 조명, 음료를 가까이 두되 화면 앞 통로는 남겨 주세요.', ['PC', '게임', '연결']],
    ['laptop_desk', '접으면 하루가 끝나지만 닫힌 덮개 아래에서도 방금 떠올린 문장은 조용히 이어진다.', '창가나 소파 곁에 두어 이동하는 작업실처럼 연출해 보세요.', ['노트북', '문장', '이동']],
    ['easel', '완성된 그림보다 여러 번 덧칠한 가장자리에서 오래 바라본 시간의 두께가 보인다.', '창빛을 받는 방향으로 돌리고 주변 바닥은 조금 비워 두세요.', ['그림', '덧칠', '관찰']],
    ['poster_film', '좋아하는 영화의 결말보다 포스터를 처음 본 골목과 함께 본 사람을 먼저 떠올리게 한다.', '낮은 조명 위에 걸면 작은 상영관의 입구처럼 보여요.', ['영화', '장면', '동행']],
    ['lamp_mood', '필요한 만큼 밝히지 못해도 마음이 머물 만큼은 충분한 빛을 만든다.', '강한 조명과 떨어뜨려 방 안에 서로 다른 시간대를 만들어 보세요.', ['무드', '빛', '감정']],
    ['candle_set', '불을 붙이지 않은 날에도 향이 남아, 쉬기로 마음먹었던 저녁을 먼저 기억한다.', '책이나 찻잔 곁에 두되 생활 동선 한가운데는 피하세요.', ['향', '저녁', '쉼']],
  ]),
  chapter('green', 'CHAPTER 08 · SLOW SEASON', '잎', '방 안의 느린 계절', '작은 생명과 함께 사는 리듬', '동수 할아버지', ['#26362f', '#657c61', '#a6ad73', '#e4dcb1'], [
    ['plant_pot', '새잎 하나가 펼쳐지는 데 걸린 시간만큼 방의 주인도 모르게 조금씩 달라졌다.', '가구 사이 빈 모서리에 두어 딱딱한 윤곽을 부드럽게 이어 주세요.', ['몬스테라', '새잎', '성장']],
    ['cactus', '물을 자주 달라고 하지 않는 대신 햇빛이 머무는 방향을 오래 정확하게 기억한다.', '창가 가까운 작은 상 위에 단독으로 두면 실루엣이 살아나요.', ['선인장', '햇빛', '기다림']],
    ['stuckyi', '곧게 선 잎들은 바쁜 날에도 방 한구석의 호흡만큼은 흐트러지지 않게 붙잡아 준다.', '세로선이 필요한 좁은 틈이나 현관 곁에 잘 어울려요.', ['스투키', '호흡', '세로선']],
    ['flower_vase', '며칠뿐인 꽃이라서 물을 갈아 준 손길과 피어난 날의 기분이 더 또렷하게 남는다.', '식탁이나 협탁 위 장면의 작은 마침표로 사용해 보세요.', ['꽃', '며칠', '마침표']],
    ['mini_garden', '서로 다른 잎이 한 화분에서 거리를 조절하며 작은 동네처럼 함께 자란다.', '초록 테마의 중심에 두고 주변 식물 높이를 다르게 맞춰 보세요.', ['정원', '동네', 'DIY']],
    ['window_plant', '창밖 계절이 바뀔 때마다 잎의 그림자도 방 안에서 조금씩 다른 자리를 차지한다.', '실제 창 아래 벽면을 따라 두면 바깥 풍경과 자연스럽게 이어져요.', ['창가', '그림자', '계절']],
    ['fish_tank', '말 없는 생물이 한 바퀴 도는 동안 급했던 생각도 수면 아래에서 천천히 가라앉는다.', '의자에서 바라보이는 높이와 조용한 조명을 함께 고려해 보세요.', ['물결', '생명', '관찰']],
  ]),
  chapter('living', 'CHAPTER 09 · LIVED IN', '삶', '정돈되지 않아도 좋은 집', '취미와 집안일이 함께 만든 표정', '준', ['#303134', '#6e7470', '#b18b66', '#e5d4b8'], [
    ['tv_stand', '꺼진 화면은 소파와 바닥에 앉았던 사람들의 흐릿한 실루엣을 한꺼번에 비춘다.', '시청 거리보다 함께 둘러앉을 여백을 먼저 남겨 보세요.', ['화면', '거실', '함께']],
    ['washer', '돌아가는 통의 일정한 소리는 미뤄 둔 일을 하나 끝냈다는 가장 생활적인 박수다.', '싱크대와 가깝되 휴식 공간과 한 칸 경계를 두면 좋아요.', ['세탁', '집안일', '완료']],
    ['fan_stand', '여름밤 이쪽저쪽으로 고개를 돌리며 방 안 모든 사람에게 같은 바람을 나눠 준다.', '침대와 책상 사이 통로를 막지 않는 모서리를 찾아 주세요.', ['여름', '바람', '나눔']],
    ['dry_rack', '잘 마른 옷 냄새는 화려한 향보다 오늘의 생활이 제대로 굴러갔다는 안도에 가깝다.', '창가와 세탁기 사이에 펼치되 필요할 때 접힐 여백을 남겨 주세요.', ['빨래', '햇빛', '안도']],
    ['cat_tower', '사람 눈높이보다 높은 가장 윗칸은 작은 동행이 이 집 전체를 자기 방식으로 읽는 전망대다.', '창가와 벽 사이에 두어 오르고 바라보는 동선을 만들어 주세요.', ['고양이', '전망대', '동행']],
    ['skateboard', '닳은 바퀴에는 잘 탄 날보다 넘어지고도 다시 일어난 골목의 모서리가 더 많이 묻어 있다.', '현관이나 취미 벽 아래에 기대어 바깥 생활을 방 안으로 이어 주세요.', ['보드', '골목', '다시']],
    ['bear_doll', '어릴 때부터 함께였는지는 중요하지 않다. 힘든 날 가장 먼저 찾았다면 이미 오래된 친구다.', '침대나 1인 소파 곁에 두어 시선이 마주치는 자리를 만들어 주세요.', ['인형', '친구', '위로']],
    ['rug_check', '반듯한 체크무늬 위에 물건이 비뚤게 놓일수록 오히려 누군가 사는 방처럼 보인다.', '낮은 상이나 작업 의자 아래에 살짝 어긋나게 깔아 보세요.', ['체크', '리듬', '생활감']],
    ['rug_long', '좁고 긴 러그는 현관부터 가장 좋아하는 자리까지 매일 걷는 길을 조용히 강조한다.', '복도형 동선이나 침대 옆 긴 여백에 방향을 맞춰 주세요.', ['러너', '동선', '귀가']],
  ]),
] as const;

export const OBJECT_STORY_CHAPTERS: readonly ObjectStoryChapter[] = chapters.map((entry) => entry.chapter);
export const OBJECT_STORIES: readonly ObjectStory[] = chapters.flatMap((entry) => entry.stories);
export const OBJECT_STORY_BY_ITEM = new Map(OBJECT_STORIES.map((story) => [story.itemId, story]));
export const OBJECT_STORY_CHAPTER_BY_ID = new Map(OBJECT_STORY_CHAPTERS.map((entry) => [entry.id, entry]));
export const OBJECT_STORY_FAVORITE_MAX = 9;

const validItemIds = new Set(CATALOG.map((item) => item.id));

const cleanIds = (raw: unknown, limit: number): string[] => Array.isArray(raw)
  ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && validItemIds.has(id)))].slice(0, limit)
  : [];

const cleanCount = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
);

export function freshObjectStoryState(): ObjectStoryState {
  return { version: 1, observedIds: [], favoriteIds: [], inspectionCounts: {}, totalInspections: 0 };
}

export function normalizeObjectStoryState(raw: unknown): ObjectStoryState {
  if (!raw || typeof raw !== 'object') return freshObjectStoryState();
  const value = raw as Partial<ObjectStoryState>;
  const observedIds = cleanIds(value.observedIds, CATALOG.length);
  const observed = new Set(observedIds);
  const favoriteIds = cleanIds(value.favoriteIds, OBJECT_STORY_FAVORITE_MAX).filter((id) => observed.has(id));
  const inspectionCounts: Record<string, number> = {};
  if (value.inspectionCounts && typeof value.inspectionCounts === 'object') {
    for (const id of observedIds) {
      const count = cleanCount((value.inspectionCounts as Record<string, unknown>)[id]);
      if (count) inspectionCounts[id] = count;
    }
  }
  const counted = Object.values(inspectionCounts).reduce((sum, count) => sum + count, 0);
  return {
    version: 1,
    observedIds,
    favoriteIds,
    inspectionCounts,
    totalInspections: Math.max(counted, cleanCount(value.totalInspections)),
  };
}

export function objectStoryChapterViews(state: ObjectStoryState): ObjectStoryChapterView[] {
  const observed = new Set(state.observedIds);
  return OBJECT_STORY_CHAPTERS.map((entry) => {
    const count = entry.itemIds.filter((id) => observed.has(id)).length;
    return { ...entry, observed: count, total: entry.itemIds.length, complete: count >= entry.required };
  });
}

export function objectStoryProgress(state: ObjectStoryState): ObjectStoryProgress {
  return {
    observed: state.observedIds.length,
    total: OBJECT_STORIES.length,
    chapters: objectStoryChapterViews(state).filter((entry) => entry.complete).length,
    totalChapters: OBJECT_STORY_CHAPTERS.length,
    favorites: state.favoriteIds.length,
    favoriteMax: OBJECT_STORY_FAVORITE_MAX,
    inspections: state.totalInspections,
  };
}

export type ObjectStoryInspectResult = 'inspected' | 'locked' | 'unknown';
export type ObjectStoryFavoriteResult = 'added' | 'removed' | 'locked' | 'full' | 'unknown';

export class HomeObjectStoryStore {
  private readonly key: string;
  private state: ObjectStoryState;

  constructor(userId: string) {
    this.key = `hv-home-object-stories-${userId}`;
    let raw: unknown = null;
    try { const saved = localStorage.getItem(this.key); if (saved) raw = JSON.parse(saved); } catch { /* session only */ }
    this.state = normalizeObjectStoryState(raw);
    this.persist();
  }

  get(): ObjectStoryState { return this.state; }
  progress(): ObjectStoryProgress { return objectStoryProgress(this.state); }
  chapters(): ObjectStoryChapterView[] { return objectStoryChapterViews(this.state); }
  isObserved(itemId: string): boolean { return this.state.observedIds.includes(itemId); }
  isFavorite(itemId: string): boolean { return this.state.favoriteIds.includes(itemId); }
  favoriteIds(): string[] { return [...this.state.favoriteIds]; }

  discoverAvailable(itemIds: Iterable<string>): number {
    const incoming = [...new Set([...itemIds].filter((id) => validItemIds.has(id)))];
    const observed = new Set(this.state.observedIds);
    const added = incoming.filter((id) => !observed.has(id));
    if (!added.length) return 0;
    this.state = { ...this.state, observedIds: [...this.state.observedIds, ...added] };
    this.persist();
    return added.length;
  }

  inspect(itemId: string): ObjectStoryInspectResult {
    if (!CATALOG_BY_ID.has(itemId) || !OBJECT_STORY_BY_ITEM.has(itemId)) return 'unknown';
    if (!this.isObserved(itemId)) return 'locked';
    const inspectionCounts = {
      ...this.state.inspectionCounts,
      [itemId]: (this.state.inspectionCounts[itemId] ?? 0) + 1,
    };
    this.state = {
      ...this.state,
      inspectionCounts,
      totalInspections: this.state.totalInspections + 1,
    };
    this.persist();
    return 'inspected';
  }

  toggleFavorite(itemId: string): ObjectStoryFavoriteResult {
    if (!CATALOG_BY_ID.has(itemId) || !OBJECT_STORY_BY_ITEM.has(itemId)) return 'unknown';
    if (!this.isObserved(itemId)) return 'locked';
    if (this.isFavorite(itemId)) {
      this.state = { ...this.state, favoriteIds: this.state.favoriteIds.filter((id) => id !== itemId) };
      this.persist();
      return 'removed';
    }
    if (this.state.favoriteIds.length >= OBJECT_STORY_FAVORITE_MAX) return 'full';
    this.state = { ...this.state, favoriteIds: [...this.state.favoriteIds, itemId] };
    this.persist();
    return 'added';
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* session only */ }
  }
}
