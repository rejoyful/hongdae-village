import { describe, expect, it } from 'vitest';
import { HomeEditHistory, type HomeEditAction } from '../src/game/home/homeEditHistory';

const action = (kind: HomeEditAction['kind'], id: string): HomeEditAction => ({
  kind, placement: { id, itemId: 'chair_wood', tx: 2, ty: 3, rot: 1 },
  reform: { finishId: 'woodgrain', colorId: 'sage' },
});

describe('친절한 집꾸미기 편집 이력', () => {
  it('새 편집을 쌓고 되돌리기·다시하기 분기를 명시적으로 이동한다', () => {
    const history = new HomeEditHistory();
    history.push(action('place', 'p1'));
    expect(history.view()).toMatchObject({ undoCount: 1, redoCount: 0, canUndo: true, canRedo: false });
    const undone = { ...action('place', 'p1'), placement: { ...action('place', 'p1').placement, id: 'removed-p1' } };
    expect(history.commitUndo(undone)).toBe(true);
    expect(history.view()).toMatchObject({ undoCount: 0, redoCount: 1, canUndo: false, canRedo: true });
    const redone = { ...undone, placement: { ...undone.placement, id: 'new-p1' } };
    expect(history.commitRedo(redone)).toBe(true);
    expect(history.peekUndo()?.placement.id).toBe('new-p1');
  });

  it('되돌린 뒤 새로운 편집을 하면 오래된 다시하기 분기를 버린다', () => {
    const history = new HomeEditHistory();
    history.push(action('place', 'p1')); history.commitUndo(action('place', 'p1'));
    history.push(action('remove', 'p2'));
    expect(history.view()).toMatchObject({ undoCount: 1, redoCount: 0 });
  });

  it('최대 50단계만 보존하고 외부 객체 변경에서 내부 기록을 보호한다', () => {
    const history = new HomeEditHistory(50);
    const first = action('place', 'p0'); history.push(first); first.placement.tx = 99;
    for (let i = 1; i < 55; i += 1) history.push(action('place', `p${i}`));
    expect(history.view().undoCount).toBe(50);
    expect(history.peekUndo()?.placement.id).toBe('p54');
    const peek = history.peekUndo()!; peek.placement.tx = 77;
    expect(history.peekUndo()?.placement.tx).toBe(2);
  });

  it('서버 재배치로 ID가 바뀌면 같은 가구를 가리키는 과거 연산도 다시 묶는다', () => {
    const history = new HomeEditHistory();
    history.push(action('place', 'old')); history.push(action('remove', 'old'));
    history.rebindPlacement('old', { ...action('place', 'old').placement, id: 'new', tx: 5 });
    expect(history.peekUndo()?.placement).toMatchObject({ id: 'new', tx: 5 });
    history.commitUndo(action('remove', 'new'));
    expect(history.peekUndo()?.placement.id).toBe('new');
  });
});
