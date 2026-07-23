import { petById } from '../pets/pets';
import { RESIDENTS, trustOf, type ResidentDef, type TrustState } from '../residents/residents';
import { HOME_THEMES, type HomeDesignAnalysis, type HomeThemeId } from './homeDesign';

export interface HomeVisitDef {
  residentId: string;
  mark: string;
  title: string;
  invitation: string;
  memory: string;
  dialogue: string;
  petDialogue: string;
  minTrust: number;
  minHomeScore: number;
  theme?: HomeThemeId;
  minThemePower?: number;
  minUniqueItems?: number;
  minCategories?: number;
  minPetAffinity?: number;
}

export interface HomeVisitRecord {
  residentId: string;
  recordedAt: string;
  homeScore: number;
  themeId: HomeThemeId;
  petId: string | null;
  petName: string | null;
}

export interface HomeVisitState {
  version: 1;
  records: Record<string, HomeVisitRecord>;
}

export interface HomeVisitContext {
  home: HomeDesignAnalysis;
  trust: TrustState;
  activePet: { id: string; name: string; affinity: number } | null;
}

export interface HomeVisitCheck {
  key: 'trust' | 'score' | 'theme' | 'collection' | 'balance' | 'pet';
  label: string;
  current: number;
  goal: number;
  met: boolean;
}

export interface HomeVisitView extends HomeVisitDef {
  resident: ResidentDef;
  checks: HomeVisitCheck[];
  status: 'locked' | 'ready' | 'recorded';
  record: HomeVisitRecord | null;
  nextHint: string;
  petName: string | null;
}

/** 집·주민·펫을 한 장면에서 만나게 하는 영구 방문 앨범. 실패나 기간 제한은 없다. */
export const HOME_VISITS: readonly HomeVisitDef[] = [
  {
    residentId: 'haneul', mark: '음', title: '방 안에서 열린 작은 공연',
    invitation: '악기와 음반이 모인 방이라면 하늘이 새 곡을 들고 찾아옵니다.',
    memory: '하늘은 창가를 작은 무대 삼아 아직 제목 없는 노래를 끝까지 연주했다.',
    dialogue: '거리보다 조용해서 기타 줄 떨리는 소리까지 들리네요. 이 방에 어울리는 곡이에요.',
    petDialogue: '오늘 첫 관객은 둘이네요. 작은 친구가 꼬리로 박자를 아주 정확히 맞춰요.',
    minTrust: 30, minHomeScore: 30, theme: 'music', minThemePower: 3,
  },
  {
    residentId: 'moturi', mark: '향', title: '창가에 내려진 한 잔',
    invitation: '편히 앉을 수 있는 포근한 공간이라면 모퉁이 씨가 원두를 챙겨 옵니다.',
    memory: '방 안에 번진 커피 향을 따라 평소보다 느린 오후가 한 잔만큼 머물렀다.',
    dialogue: '카페가 아닌 곳에서 내리니 같은 원두도 다르게 느껴져요. 이 자리가 참 좋네요.',
    petDialogue: '컵은 높은 곳에 둘게요. 대신 이 친구가 맡을 수 있게 원두 향은 조금 나눠 줄까요.',
    minTrust: 30, minHomeScore: 30, theme: 'cozy', minThemePower: 3,
  },
  {
    residentId: 'sallim', mark: '살', title: '줄자 없이 보는 집',
    invitation: '열 가지 살림이 자리를 찾으면 살림 아주머니가 집들이 심사를 와 줍니다.',
    memory: '살림 아주머니는 치수를 재지 않고도 이 방에서 반복될 하루의 동선을 정확히 알아보았다.',
    dialogue: '이제 물건을 둔 방이 아니라 사람이 사는 집이 됐네. 빈 틈도 아주 잘 남겼어.',
    petDialogue: '이 친구 길은 막지 않았네. 좋은 배치는 가장 작은 식구의 동선부터 보는 거야.',
    minTrust: 30, minHomeScore: 42, minUniqueItems: 10,
  },
  {
    residentId: 'jun', mark: '밤', title: '퇴근 뒤의 짧은 휴식',
    invitation: '여러 종류의 생활 가구가 갖춰지면 준이 야간 근무 뒤 잠깐 쉬러 옵니다.',
    memory: '준은 조명이 따뜻한 자리에 앉아 편의점 기계음이 들리지 않는 십 분을 오래 즐겼다.',
    dialogue: '여기선 냉장고 문 열리는 소리도 안 들리네요. 퇴근이 이제야 진짜 끝난 기분이에요.',
    petDialogue: '야간 손님보다 조용한 룸메이트네요. 옆에 앉아도 되는지 먼저 물어봐야겠어요.',
    minTrust: 30, minHomeScore: 35, minCategories: 4,
  },
  {
    residentId: 'choco', mark: '색', title: '작은 친구의 색 고르기',
    invitation: '친해진 동행 펫과 개성 있는 방이 있으면 초코가 오늘의 색을 골라 줍니다.',
    memory: '초코는 방과 펫의 표정을 번갈아 보더니 둘에게 가장 잘 어울리는 색 이름을 새로 지었다.',
    dialogue: '이 방은 살구빛 포근함에 민트 한 방울이에요. 이름은 방금 정했지만 꽤 정확하죠.',
    petDialogue: '귀 끝 색이 오늘 포인트네요. 이 친구까지 포함해서 방의 팔레트가 완성됐어요.',
    minTrust: 30, minHomeScore: 38, minCategories: 4, minPetAffinity: 25,
  },
  {
    residentId: 'ille', mark: '새', title: '새벽을 닮은 조용한 방',
    invitation: '포근한 테마가 깊어진 집이라면 일레가 교대 뒤의 조용한 이야기를 가져옵니다.',
    memory: '일레와 말없이 앉아 있던 방은 새벽 편의점보다 조용했지만 전혀 외롭지 않았다.',
    dialogue: '조용한데 심심하지 않은 공간은 드물어요. 새벽 두 시에도 여기라면 마음이 놓이겠네요.',
    petDialogue: '이 친구 숨소리가 냉장고 모터보다 훨씬 좋네요. 새벽 근무에 데려가고 싶을 정도예요.',
    minTrust: 50, minHomeScore: 45, theme: 'cozy', minThemePower: 4,
  },
  {
    residentId: 'park', mark: '길', title: '돌아갈 곳이 있는 지도',
    invitation: '다섯 분류 이상의 가구가 조화를 이루면 박 기장이 집의 동선을 살피러 옵니다.',
    memory: '박 기장은 현관에서 가장 편한 자리까지 이어지는 길을 작은 노선도처럼 수첩에 그렸다.',
    dialogue: '좋은 집은 처음 온 사람도 어디에서 쉬어야 할지 알려 줍니다. 이곳은 길을 잃지 않겠어요.',
    petDialogue: '이 친구가 먼저 가장 안전한 길을 안내했네요. 훌륭한 꼬마 역무원입니다.',
    minTrust: 50, minHomeScore: 52, minCategories: 5,
  },
  {
    residentId: 'noeul', mark: '빛', title: '벽에 남은 저녁빛',
    invitation: '창작자의 도구가 모인 방이라면 노을이 작은 색 연구를 하러 찾아옵니다.',
    memory: '노을은 벽에 번진 저녁빛을 빠르게 스케치하고 방의 주인만 알아볼 작은 서명을 남겼다.',
    dialogue: '잘 꾸민 방은 멈춰 있는 그림이 아니라 매일 빛이 바꾸는 벽화 같아요.',
    petDialogue: '가만히 있지 않아도 괜찮아. 움직이는 실루엣이 오늘 그림의 핵심이니까.',
    minTrust: 50, minHomeScore: 50, theme: 'creator', minThemePower: 3,
  },
  {
    residentId: 'imo', mark: '온', title: '식구가 되는 집들이',
    invitation: '오래 믿어 온 이웃의 포근한 명소라면 포차 이모가 따뜻한 봉투를 들고 옵니다.',
    memory: '포차 이모가 펼친 봉투 덕분에 근사한 집은 순식간에 둘러앉아 먹는 식구의 공간이 되었다.',
    dialogue: '집들이는 집 자랑하는 날이 아니라 여기 올 사람 자리를 만드는 날이야. 넉넉히 잘 만들었네.',
    petDialogue: '작은 식구 몫도 따로 챙겼지. 사람이 먹는 간은 세니까 냄새만 먼저 맡아 봐.',
    minTrust: 80, minHomeScore: 64, theme: 'cozy', minThemePower: 5,
  },
  {
    residentId: 'dongsu', mark: '숲', title: '집 안으로 이어진 산책길',
    invitation: '초록 테마와 단짝 펫이 함께하는 집이라면 동수 할아버지가 천천히 방문합니다.',
    memory: '동수 할아버지는 화분 사이를 산책하듯 둘러본 뒤 집 안에도 계절이 머문다고 말했다.',
    dialogue: '밖을 오래 걷는 사람은 집 안에도 숨 쉴 길을 만들더군요. 이곳에는 계절이 잘 들어와요.',
    petDialogue: '이 친구와 걸은 시간이 방에도 남아 있네요. 서로를 기다리는 속도가 아주 닮았어요.',
    minTrust: 80, minHomeScore: 60, theme: 'green', minThemePower: 4, minPetAffinity: 50,
  },
] as const;

const RESIDENT_BY_ID = new Map(RESIDENTS.map((resident) => [resident.id, resident]));
const VISIT_BY_ID = new Map(HOME_VISITS.map((visit) => [visit.residentId, visit]));
const THEME_BY_ID = new Map(HOME_THEMES.map((theme) => [theme.id, theme]));
const THEME_IDS = new Set<HomeThemeId>(['starter', ...HOME_THEMES.map((theme) => theme.id)]);

export function normalizeHomeVisitState(raw: unknown): HomeVisitState {
  const source = (raw ?? {}) as Partial<HomeVisitState>;
  const records: Record<string, HomeVisitRecord> = {};
  if (source.records && typeof source.records === 'object') {
    for (const [residentId, value] of Object.entries(source.records)) {
      if (!VISIT_BY_ID.has(residentId) || !value || typeof value !== 'object') continue;
      const record = value as Partial<HomeVisitRecord>;
      if (typeof record.recordedAt !== 'string') continue;
      const themeId = typeof record.themeId === 'string' && THEME_IDS.has(record.themeId as HomeThemeId)
        ? record.themeId as HomeThemeId : 'starter';
      records[residentId] = {
        residentId,
        recordedAt: record.recordedAt,
        homeScore: Number.isFinite(record.homeScore) ? Math.max(0, Math.min(100, Math.floor(record.homeScore!))) : 0,
        themeId,
        petId: typeof record.petId === 'string' ? record.petId : null,
        petName: typeof record.petName === 'string' ? record.petName : null,
      };
    }
  }
  return { version: 1, records };
}

function visitChecks(def: HomeVisitDef, context: HomeVisitContext): HomeVisitCheck[] {
  const residentTrust = trustOf(context.trust, def.residentId);
  const checks: HomeVisitCheck[] = [
    { key: 'trust', label: '주민 신뢰', current: residentTrust, goal: def.minTrust, met: residentTrust >= def.minTrust },
    { key: 'score', label: '홈 점수', current: context.home.score, goal: def.minHomeScore, met: context.home.score >= def.minHomeScore },
  ];
  if (def.theme && def.minThemePower) {
    const power = context.home.themePowers[def.theme] ?? 0;
    checks.push({
      key: 'theme', label: `${THEME_BY_ID.get(def.theme)?.name ?? def.theme} 테마`,
      current: power, goal: def.minThemePower, met: power >= def.minThemePower,
    });
  }
  if (def.minUniqueItems) checks.push({
    key: 'collection', label: '서로 다른 가구', current: context.home.uniqueCount,
    goal: def.minUniqueItems, met: context.home.uniqueCount >= def.minUniqueItems,
  });
  if (def.minCategories) checks.push({
    key: 'balance', label: '가구 분류', current: context.home.categoryCount,
    goal: def.minCategories, met: context.home.categoryCount >= def.minCategories,
  });
  if (def.minPetAffinity) checks.push({
    key: 'pet', label: context.activePet ? `${context.activePet.name} 친밀도` : '동행 펫 친밀도',
    current: context.activePet?.affinity ?? 0, goal: def.minPetAffinity,
    met: (context.activePet?.affinity ?? 0) >= def.minPetAffinity,
  });
  return checks;
}

export function homeVisitViews(context: HomeVisitContext, state: HomeVisitState): HomeVisitView[] {
  return HOME_VISITS.flatMap((def) => {
    const resident = RESIDENT_BY_ID.get(def.residentId);
    if (!resident) return [];
    const checks = visitChecks(def, context);
    const record = state.records[def.residentId] ?? null;
    const status = record ? 'recorded' : checks.every((check) => check.met) ? 'ready' : 'locked';
    const unmet = checks.find((check) => !check.met);
    const petName = record?.petName ?? (record?.petId ? petById(record.petId)?.name ?? null : null);
    const nextHint = record
      ? `${record.recordedAt} · 홈 점수 ${record.homeScore}${petName ? ` · ${petName}와 함께` : ''}`
      : unmet ? `${unmet.label} ${unmet.current}/${unmet.goal}` : '지금 초대할 수 있어요.';
    return [{ ...def, resident, checks, record, status, nextHint, petName }];
  });
}

export function recordHomeVisit(
  state: HomeVisitState,
  residentId: string,
  context: HomeVisitContext,
  recordedAt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()),
): { state: HomeVisitState; recorded: boolean } {
  if (state.records[residentId]) return { state, recorded: false };
  const view = homeVisitViews(context, state).find((item) => item.residentId === residentId);
  if (!view || view.status !== 'ready') return { state, recorded: false };
  return {
    recorded: true,
    state: {
      version: 1,
      records: {
        ...state.records,
        [residentId]: {
          residentId,
          recordedAt,
          homeScore: context.home.score,
          themeId: context.home.theme.id,
          petId: context.activePet?.id ?? null,
          petName: context.activePet?.name ?? null,
        },
      },
    },
  };
}

export function homeVisitProgress(state: HomeVisitState): { recorded: number; total: number; withPet: number } {
  const records = Object.values(state.records);
  return { recorded: records.length, total: HOME_VISITS.length, withPet: records.filter((record) => record.petId).length };
}

/** 사용자별 로컬 방문 앨범. 경제 보상은 없으며 서버 스키마 없이 안전하게 영구 수집만 기록한다. */
export class HomeVisitStore {
  private state: HomeVisitState;
  private readonly key: string;

  constructor(userId: string) {
    this.key = `hv-home-visits-${userId}`;
    let raw: unknown = null;
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) raw = JSON.parse(saved);
    } catch { /* 세션 한정 */ }
    this.state = normalizeHomeVisitState(raw);
    this.persist();
  }

  get(): HomeVisitState { return this.state; }
  views(context: HomeVisitContext): HomeVisitView[] { return homeVisitViews(context, this.state); }
  progress(): { recorded: number; total: number; withPet: number } { return homeVisitProgress(this.state); }

  record(residentId: string, context: HomeVisitContext): boolean {
    const result = recordHomeVisit(this.state, residentId, context);
    this.state = result.state;
    if (result.recorded) this.persist();
    return result.recorded;
  }

  private persist(): void {
    try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch { /* ignore */ }
  }
}
