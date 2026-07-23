import type { Placed } from '../entities/placement';
import type { FurnitureReformStyle } from './furnitureReform';

export type HomeEditKind = 'place' | 'remove';

export interface HomeEditAction {
  kind: HomeEditKind;
  placement: Placed;
  reform: FurnitureReformStyle | null;
}

export interface HomeEditHistoryView {
  undoCount: number;
  redoCount: number;
  canUndo: boolean;
  canRedo: boolean;
  undo: HomeEditAction | null;
  redo: HomeEditAction | null;
}

const clone = (action: HomeEditAction): HomeEditAction => ({
  ...action, placement: { ...action.placement }, reform: action.reform ? { ...action.reform } : null,
});

/** 서버 성공이 확인된 단일 가구 연산만 담는 세션 이력. 새 편집은 redo 분기를 지운다. */
export class HomeEditHistory {
  private readonly undoStack: HomeEditAction[] = [];
  private readonly redoStack: HomeEditAction[] = [];

  constructor(private readonly limit = 50) {}

  push(action: HomeEditAction): void {
    this.undoStack.push(clone(action));
    if (this.undoStack.length > Math.max(1, this.limit)) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  peekUndo(): HomeEditAction | null { return this.undoStack.length ? clone(this.undoStack[this.undoStack.length - 1]!) : null; }
  peekRedo(): HomeEditAction | null { return this.redoStack.length ? clone(this.redoStack[this.redoStack.length - 1]!) : null; }

  commitUndo(updated: HomeEditAction): boolean {
    if (!this.undoStack.length) return false;
    this.undoStack.pop(); this.redoStack.push(clone(updated)); return true;
  }

  commitRedo(updated: HomeEditAction): boolean {
    if (!this.redoStack.length) return false;
    this.redoStack.pop(); this.undoStack.push(clone(updated)); return true;
  }

  /** 온라인 재배치가 새 UUID를 돌려줘도 같은 가구를 가리키는 과거 연산을 함께 갱신한다. */
  rebindPlacement(previousId: string, placement: Placed): void {
    for (const stack of [this.undoStack, this.redoStack]) {
      for (const action of stack) if (action.placement.id === previousId) action.placement = { ...placement };
    }
  }

  view(): HomeEditHistoryView {
    return {
      undoCount: this.undoStack.length, redoCount: this.redoStack.length,
      canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0,
      undo: this.peekUndo(), redo: this.peekRedo(),
    };
  }

  clear(): void { this.undoStack.length = 0; this.redoStack.length = 0; }
}
