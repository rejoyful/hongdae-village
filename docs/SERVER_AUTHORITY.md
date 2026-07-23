# 온라인 진행 권위 모델

`0015_verified_progression.sql`부터 코인·소유권뿐 아니라 집과 펫의 장기 진행도 서버가 검증한다.
클라이언트 `localStorage`는 오프라인 플레이와 빠른 화면 표시를 위한 캐시이며, 온라인 세션에서는 서버 스냅샷이 우선한다.

## 서버가 최종 결정하는 값

| 영역 | 서버 증거 | 쓰기 경로 |
|---|---|---|
| 코인 | `profiles.coins`, `coin_ledger` | 경제 RPC만 |
| 가구 소유·배치 | `inventory`, `placements`, `rooms`, `home_item_meta` | `place_item`, `pickup_item` |
| 홈 장면 전환 | `home_layout_slots`, `inventory`, `placements` | `save_home_layout_slot`, `apply_home_layout_slot` |
| 공동 밤정원 | `shared_village_projects`, `shared_village_members`, `shared_village_contributions` | `contribute_shared_village_project` |
| 펫 소유 | `owned_pets` | `adopt_pet`, `claim_rare_pet` |
| 펫 친밀도·트릭 | `owned_pets` 성장 컬럼 | `pet_care` |
| 일일 월드 행동 | `daily_world_progress`, 활동 원장 | `record_daily_progress`, 게임 활동 RPC |
| 일일 퀘스트 보상 | 위 증거 + `coin_ledger` | `claim_daily_quest` |
| 검증 배지 | 실제 집·펫 행에서 재계산 | `refresh_verified_progress` |

## 친절한 오프라인 원칙

- 연결이 없을 때도 퀘스트·집·펫 플레이는 로컬에 남는다.
- 온라인 재접속 시 서버에 존재하는 펫 성장 수치는 서버 스냅샷으로 교정된다.
- 마이그레이션이 아직 적용되지 않은 서버에서는 경제 보상을 임의 폴백하지 않는다. 진행은 보존하고 업데이트 안내만 표시한다.
- 펫은 접속하지 않은 날의 친밀도가 감소하지 않는다.

## 펫 코스메틱 경계

- 별명·성격·액세서리는 코인이나 전투 능력치를 만들지 않는 사용자별 코스메틱 기록이다. 현재는
  기존 `hv-pets-v1`에 호환 저장하고, 동행 중인 별명·장식만 정제해 Realtime presence로 공유한다.
- 서버의 `owned_pets` 소유권과 친밀도·놀이·트릭 기록이 액세서리 해금 조건의 권위 증거다. 클라이언트
  코스메틱 선택이 서버 성장 수치나 경제 보상을 직접 변경해서는 안 된다.
- 추후 프로필 서버 동기화를 추가할 때는 소유 펫 확인, 별명 길이, 성격·액세서리 화이트리스트를 RPC에서
  재검증하고 기존 로컬 선택과 합집합/최신 선택 규칙을 명시해야 한다.
- 동행 산책은 `hv-pet-outings-{userId}`에 펫×코스 기록을 저장하는 코스메틱 컬렉션이며 코인·거래·전투
  능력치를 만들지 않는다. 추후 서버 동기화 시 총 산책은 서버 검증 이벤트의 합계, 도감은 코스별 최고점,
  동행 조합은 `(petId, routeId)` 합집합으로 병합하며 기존 로컬 최고 기록을 낮추지 않는다.

## 골목 의뢰소 경계

- 골목 의뢰소는 `hv-village-requests-{userId}`에 활성 기준점·보관 진행·반복 횟수·완료 도장을 저장한다.
  기존 퀘스트 평생 지표를 읽기만 하며 코인·아이템 소유권·전투 능력치를 만들지 않는다.
- 추후 서버 동기화 시 수락 기준점과 보관 진행은 최신 이벤트 순서로 병합하고, 고유 도장은 합집합,
  반복 완료는 서버가 검증한 완료 이벤트 합계로 계산한다. 클라이언트의 `totalCompleted`를 경제 보상
  증거로 사용해서는 안 되며 기존 로컬 도장·반복 횟수를 낮추지 않는다.

## 가구 리폼 경계

- 가구 리폼은 `hv-furniture-reforms-{userId}`에 placement ID별 마감·색감, 발견 조합, 누적 저장 횟수를
  보존하는 로컬 코스메틱 기록이다. `placements`의 위치·회전·소유권과 `inventory` 수량은 수정하지 않는다.
- 온라인에서 가구를 회수한 뒤 서버 삭제가 성공했을 때만 해당 placement의 리폼 선택을 지운다. 삭제가
  실패하면 서버 배치를 복원하고 코스메틱 기록도 유지한다. 리폼 기록은 코인·거래·능력치 증거가 아니다.
- 추후 서버 동기화 시 배치 소유권을 먼저 확인하고, 스타일은 허용된 6×8 ID 화이트리스트와 최신 선택으로
  병합한다. 발견 조합은 합집합, 누적 저장은 서버가 검증한 이벤트 합계로 계산하며 로컬 도감을 낮추지 않는다.

## 홈 장면 보관함 경계

- `0020_home_layout_library.sql`의 스냅샷은 사용자가 보낸 배치 JSON을 저장하지 않고, 집주인의 현재 서버
  `placements`만 읽어 생성한다. 테이블에는 본인 읽기 정책만 두고 저장·적용은 두 RPC로 제한한다.
- 적용 전 해당 방, 인벤토리, 현재 배치를 잠그고 `inventory + 현재 배치` 수량이 저장 장면을 완성하는지
  검사한다. 부족하면 삭제 전에 `missing`을 반환하고, 충분할 때만 회수·삭제·재배치를 같은 트랜잭션에서 한다.
- 마감·색감은 경제나 소유권을 만들지 않는 로컬 코스메틱이므로 좌표·아이템·회전 키에 맞춰 새 placement
  UUID로 다시 연결한다. 이사로 `rooms.owner_id`가 바뀌면 이전 소유자의 여섯 장면은 모두 삭제한다.

## 모두의 밤정원 경계

- `0021_shared_village_project.sql`은 서버 전체 공동 합계와 사용자별 도감을 분리해 보존한다. 클라이언트는
  공동 행과 자기 기록을 읽을 수 있지만 직접 쓰지 못하며, 모든 기여는 보안 RPC 한 곳을 통과한다.
- 기여는 자유문구가 아닌 고정된 여덟 종류만 허용하고 서울 날짜 기준 사용자별 하루 한 번을 고유 제약과
  원장으로 강제한다. 공동 행을 잠근 뒤 원장을 먼저 확정하므로 동시 기여에서도 합계가 유실되지 않는다.
- 순위·마감·코인·아이템 보상을 두지 않는다. 로컬 저장은 마지막 공동 풍경을 보여 주는 단조 증가 캐시이며
  오프라인에서 서버 기여를 가장하거나 경제·소유권 증거로 사용할 수 없다.

## 네컷 앨범 경계

- 필름 앨범은 코인이나 소유권을 만들지 않는 사용자별 로컬 코스메틱 기록이다. 완성 PNG와 외형
  스냅샷을 서버에 업로드하지 않으며, 손상된 프레임·포즈·펫 값은 클라이언트 화이트리스트로 정규화한다.
- 온라인 사진 활동 코인 보상은 앨범 저장과 분리된 기존 `earn_activity('photo')` RPC가 최종 검증한다.
- 정원 화분·씨앗·표본은 현재 `hv-garden-{userId}` 로컬 우선 저장이다. 코인 보상과 거래 재화에는
  영향을 주지 않으며, 서버 동기화 전까지 퀘스트·생활 숙련은 해당 기기의 누적 최댓값만 참조한다.
- 골목 주방 접시·단골 메뉴는 `hv-cooking-{userId}`에 저장하고 정원의 변이별 조리 재료만 소비한다.
  현재 접시는 코인·거래·능력치 보상을 만들지 않으므로 서버 경제 원장을 우회하지 않는다.
- 물정원 생물·최고 크기·도장은 `hv-fishing-{userId}`에 저장한다. 매듭은 소모 재화가 아니며 현재
  낚시 기록은 코인·거래·전투 능력치를 만들지 않는다. 온라인 보상과 연결할 때는 서버가 캐스팅 횟수와
  크기 증가 규칙을 다시 계산하고 기존 로컬 도감은 합집합·최고 크기로 병합해야 한다.
- 물결 테라리움 구성은 `hv-home-aquarium-{userId}`에 저장하며 경제 재화가 아니다. 실제 어항 소유와
  방 배치는 기존 서버 `inventory`·`placements`가 권위 데이터를 유지한다. `0016_home_aquarium_starter.sql`은
  `grant_starter()`에 어항 한 개를 추가할 뿐 로컬 전시 구성을 서버 소유권 증거로 사용하지 않는다.
  사진 레코드 수나 브라우저 저장값을 경제 보상의 서버 증거로 사용해서는 안 된다.
- 골목 룩북은 `hv-lookbook-{userId}`에 의뢰별 최고 별·외형 스냅샷·누적 제출·고유 코디 서명을
  저장한다. 별과 배지는 코인·거래·전투 능력치를 만들지 않는 로컬 수집 기록이다. 온라인 보상으로
  확장할 때는 서버가 허용 외형 값과 의뢰 조건을 다시 판정하고, 기기 간 병합은 의뢰별 최고 별·최신
  동점 스냅샷·누적 제출 합계·고유 서명 합집합 규칙을 사용해야 한다.

## 배포 순서

1. Supabase 백업 또는 스테이징 프로젝트에서 기존 마이그레이션 적용 상태를 확인한다.
2. [`0015_verified_progression.sql`](../supabase/migrations/0015_verified_progression.sql)을 적용한다.
3. [`0016_home_aquarium_starter.sql`](../supabase/migrations/0016_home_aquarium_starter.sql)을 적용한다.
4. [`0017_four_direction_furniture.sql`](../supabase/migrations/0017_four_direction_furniture.sql)을 적용한다.
5. [`0018_furniture_workshop.sql`](../supabase/migrations/0018_furniture_workshop.sql)을 적용한다.
6. [`0019_open_homes_guestbook.sql`](../supabase/migrations/0019_open_homes_guestbook.sql)을 적용한다.
7. [`0020_home_layout_library.sql`](../supabase/migrations/0020_home_layout_library.sql)을 적용한다.
8. [`0021_shared_village_project.sql`](../supabase/migrations/0021_shared_village_project.sql)을 적용한다.
9. [`0022_neighborhood_market.sql`](../supabase/migrations/0022_neighborhood_market.sql)을 적용한다.
10. 인증 사용자로 다음 항목을 점검한다.
   - `refresh_verified_progress()`가 `ok: true`, `metrics`, `badges`를 반환한다.
   - 기본 펫 입양 후 `pet_care(pet, 'feed')` 두 번째 호출은 `daily`를 반환한다.
   - 다른 사용자의 방 또는 보유하지 않은 가구 배치는 `place_item`이 `null`을 반환한다.
   - 같은 레이어 가구를 겹쳐 놓으면 `place_item`이 `null`을 반환한다.
   - `p_rot=2/3` 배치는 성공하고 `p_rot=4`는 `null`을 반환한다.
   - 활동 증거 없이 `claim_daily_quest`를 호출하면 `-4`를 반환한다.
   - 보유 수량이 부족한 `apply_home_layout_slot`은 `missing`을 반환하고 기존 배치를 보존한다.
   - 충분한 홈 장면 적용은 배치와 인벤토리를 한 트랜잭션으로 교체한다.
   - 같은 사용자의 두 번째 `contribute_shared_village_project` 호출은 `today`를 반환한다.
   - 두 사용자의 동시 기여 뒤 공동 합계와 원장 행 수가 모두 2 증가한다.
10. 클라이언트를 배포하고 코인 원장에서 중복 지급이 없는지 관찰한다.

## 반환 규약

- `claim_daily_quest`: 잔액 또는 `-1 인증`, `-2 잘못된 id`, `-3 이미 수령`, `-4 증거 부족`
- `record_daily_progress`: 서버 누적값 또는 음수 오류
- `pet_care`: JSON `{ ok, ... }`; 실패 시 `reason`이 `daily`, `daily-cap`, `affinity`, `done`, `not-owned` 등으로 내려온다.
- `place_item`: 성공한 placement UUID, 실패 시 `null`
- `save_home_layout_slot`, `apply_home_layout_slot`: JSON `{ ok, ... }`; 부족 시 적용은 `{ ok:false, reason:'missing', missingItemIds }`
- `get_shared_village_project`, `contribute_shared_village_project`: JSON `{ ok, global, member }`; 당일 중복은 `{ ok:false, reason:'today', state }`

직접 테이블 쓰기 폴백을 다시 추가하면 서버 권위 모델이 깨진다. 특히 `inventory`, `placements`, `owned_pets`, `verified_badges`는 반드시 RPC를 통해서만 변경한다.
